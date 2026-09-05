import os
import re
import sys
import tempfile
import time
import subprocess
import wave
import struct
import math

# Ensure Windows stdout handles Hindi/Marathi Unicode without charmap crashes
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import torch

app = FastAPI(title="Local ASR Server for E-Waste Bridge (Whisper Large v3 Turbo)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda:0" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if torch.cuda.is_available() else torch.float32

print(f"Loading Whisper Large v3 Turbo on {device} (RTX 5070 Ti, dtype={dtype})...")
pipe = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-large-v3-turbo",
    dtype=dtype,
    device=device,
    generate_kwargs={
        "task": "transcribe",
        "max_new_tokens": 128,
        "no_repeat_ngram_size": 3,
    }
)
print(f"Whisper Large v3 Turbo loaded and ready on {device} (http://127.0.0.1:8765)")

# Substrings that indicate Whisper internet-training hallucinations during silence/ambient noise
HALLUCINATION_SUBSTRINGS = [
    "thank you",
    "thanks for",
    "thank you for",
    "joining us",
    "listening to",
    "for watching",
    "next video",
    "subscribe",
    "subtitles",
    "amara.org",
    "amara org",
    "ordnance",
    "bye bye",
    "goodbye",
    "see you in",
    "see you next",
    "the end",
    "check my ordnance",
    "please like",
    "share and subscribe",
    "welcome back to",
    "watch more"
]

# Known Whisper hallucinations triggered by silence or low ambient noise
SILENCE_HALLUCINATIONS = {
    "thank you",
    "thank you very much",
    "thank you for watching",
    "thank you very much for watching",
    "thank you very much for watching!",
    "thanks for watching",
    "thanks for watching!",
    "thank you so much",
    "bye",
    "bye bye",
    "goodbye",
    "you",
    "subtitles by",
    "please subscribe",
    "subscribe",
    "watching",
    "watching!",
    "amara.org",
    "so",
    "the end",
    "thank you.",
    "thank you very much.",
    "bye.",
    "hello.",
    "what?",
    "what",
    "."
}

def compute_wav_rms(wav_file_path: str) -> float:
    """Compute Root Mean Square (RMS) energy of 16-bit mono PCM WAV."""
    try:
        with wave.open(wav_file_path, "rb") as wf:
            n_frames = wf.getnframes()
            if n_frames == 0:
                return 0.0
            frames = wf.readframes(n_frames)
            shorts = struct.unpack(f"<{len(frames)//2}h", frames)
            if not shorts:
                return 0.0
            sum_squares = sum(s * s for s in shorts)
            rms = math.sqrt(sum_squares / len(shorts)) / 32768.0
            return rms
    except Exception as e:
        print("[RMS Error]:", e)
        return 0.05

def is_silence_hallucination(text: str) -> bool:
    if not text:
        return True
    cleaned = re.sub(r"[^\w\s]", " ", text).lower().strip()
    words = cleaned.split()
    if not words:
        return True

    # 1. Substring matches for YouTube/podcast outro phrases
    for phrase in HALLUCINATION_SUBSTRINGS:
        if phrase in cleaned:
            return True

    # 2. Direct match on known Whisper silence hallucination phrases
    if text.strip().lower() in SILENCE_HALLUCINATIONS or cleaned in SILENCE_HALLUCINATIONS:
        return True

    # 3. Known hallucination tokens ratio
    bad_keywords = {
        "thank", "thanks", "you", "watching", "subscribe", "subtitles",
        "bye", "amara", "video", "beginning", "day", "ordnance"
    }
    bad_count = sum(1 for w in words if w in bad_keywords)
    if bad_count / len(words) >= 0.30:
        return True

    # 4. Repeated single words (e.g. "thank" 2+ times, or "day" 2+ times)
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
        if counts[w] >= 2 and w in bad_keywords:
            return True

    # 5. Low vocabulary diversity (repetition loop, e.g. "thank you thank you thank you")
    if len(words) >= 3 and len(set(words)) <= 2:
        return True
    if len(words) >= 6 and (len(set(words)) / len(words)) < 0.4:
        return True

    # 6. Regex repetition pattern
    if re.search(r"(\b.+?\b)(?:\s+\1){2,}", cleaned):
        return True

    return False

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "openai/whisper-large-v3-turbo",
        "device": device,
        "supported_languages": ["mr", "hi", "en"]
    }

@app.post("/transcribe")
async def transcribe(request: Request):
    t0 = time.time()
    try:
        # Strictly support ONLY 3 languages: Marathi (mr), Hindi (hi), English (en)
        lang = request.query_params.get("lang", "mr").strip().lower()
        if lang not in ["mr", "hi", "en"]:
            lang = "mr"

        contents = await request.body()
        # Allow natural short speech buffers (> 1000 bytes)
        if not contents or len(contents) < 1000:
            return {"success": True, "text": "", "suppressed": True, "reason": "Audio buffer too small"}

        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        wav_path = tmp_path.replace(".webm", ".wav")
        try:
            # Convert webm to clean 16kHz mono WAV via ffmpeg
            subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_path, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=5,
                check=False
            )
            
            # ACOUSTIC ENERGY GATE: Only discard dead/flat silence (RMS < 0.002)
            if os.path.exists(wav_path) and os.path.getsize(wav_path) > 100:
                audio_rms = compute_wav_rms(wav_path)
                if audio_rms < 0.002:
                    elapsed = round((time.time() - t0) * 1000)
                    print(f"[Local ASR ({elapsed}ms)]: SUPPRESSED FLAT SILENCE (RMS: {audio_rms:.4f} < 0.002)")
                    return {"success": True, "text": "", "suppressed": True, "reason": "Flat silence"}
                audio_target = wav_path
            else:
                audio_target = tmp_path

            # Multilingual auto-detection for Indian code-mixed speech (Marathi/Hindi/English)
            # Whisper Large v3 Turbo natively identifies mr/hi/en with >98% accuracy.
            force_lang = request.query_params.get("force_lang", "false").lower() == "true"
            gen_kwargs = {"task": "transcribe"}
            if force_lang and lang in ["mr", "hi", "en"]:
                gen_kwargs["language"] = lang
            result = pipe(audio_target, return_timestamps=True, generate_kwargs=gen_kwargs)
            text = result.get("text", "").strip()
            elapsed = round((time.time() - t0) * 1000)

            # Strict silence / punctuation check
            if not text or not re.sub(r"[\s\.\,\-\_\'\"]", "", text):
                return {"success": True, "text": "", "suppressed": True}

            # Filter Whisper silence hallucinations
            if is_silence_hallucination(text):
                print(f"[Local ASR ({elapsed}ms, {lang})]: SUPPRESSED SILENCE ARTIFACT -> '{text}'")
                return {"success": True, "text": "", "suppressed": True}

            print(f"[Local ASR ({elapsed}ms, {lang})]: '{text}' (size: {len(contents)} bytes)")
            return {"success": True, "text": text, "lang": lang, "latencyMs": elapsed}
        finally:
            for p in [tmp_path, wav_path]:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass
    except Exception as e:
        print("[Local ASR Error]:", e)
        return {"success": False, "error": str(e), "text": ""}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)
