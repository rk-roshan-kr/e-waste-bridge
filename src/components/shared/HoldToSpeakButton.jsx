/**
 * HoldToSpeakButton.jsx — Press & Hold Voice Input
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * UX MODEL:
 *   Press   → startListening() — mic opens, live waveform
 *   Holding → interim transcript streams in real-time
 *   Release → stopListening() — turn committed immediately
 *
 * Why this beats continuous listening for demo:
 *   - No accidental triggers
 *   - No "dead air" while the VAD waits
 *   - Works despite browser audio permission timing
 *   - The physical release IS the EOT signal (100% accurate)
 *
 * Supports both mouse and touch (mobile demo on real device).
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff } from "lucide-react";

const LANG_LABELS = {
  mr: { hold: "बोलण्यासाठी दाबा", holding: "बोलत आहे...", release: "सोडा" },
  hi: { hold: "बोलने के लिए दबाएं", holding: "बोल रहे हैं...", release: "छोड़ें" },
  en: { hold: "Hold to Speak", holding: "Listening...", release: "Release" },
};

export default function HoldToSpeakButton({
  language = "mr",
  onSpeechStart,    // () => void — mic opened
  onSpeechEnd,      // (transcript: string) => void — turn committed
  onInterim,        // (text: string) => void — live transcript update
  disabled = false,
  isSessionActive = false, // true when voice session is open
}) {
  const [isHolding, setIsHolding] = useState(false);
  const [pulseLevel, setPulseLevel] = useState(0);

  const recognitionRef      = useRef(null);
  const interimRef          = useRef("");
  const finalRef            = useRef("");
  const holdStartRef        = useRef(0);
  const audioCtxRef         = useRef(null);
  const analyserRef         = useRef(null);
  const animFrameRef        = useRef(null);
  const streamRef           = useRef(null);
  const committedRef        = useRef(false);

  const labels = LANG_LABELS[language] || LANG_LABELS.en;

  // ── Audio level visualizer ──────────────────────────────────────────────────
  const startAudioLevel = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setPulseLevel(Math.min(avg / 60, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      // Permission denied or not available — still allow the session
    }
  }, []);

  const stopAudioLevel = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setPulseLevel(0);
  }, []);

  // ── WebSpeech Recognition ───────────────────────────────────────────────────
  const startRecognition = useCallback((lang) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    interimRef.current  = "";
    finalRef.current    = "";
    committedRef.current = false;

    const rec = new SR();
    rec.lang            = lang === "mr" ? "mr-IN" : "hi-IN";
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = "";
      let final   = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0]?.transcript || "";
        if (e.results[i].isFinal) final += t.trim() + " ";
        else interim += t;
      }
      if (final) finalRef.current += final;
      interimRef.current = interim;
      const full = `${finalRef.current}${interim}`.trim();
      if (full && onInterim) onInterim(full);
    };

    rec.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      console.warn("[HoldToSpeak] ASR error:", e.error);
    };

    rec.onend = () => {
      // If still holding, restart — browser sometimes cuts off
      if (isHolding && !committedRef.current) {
        try { rec.start(); } catch (e) {}
      }
    };

    rec.start();
    recognitionRef.current = rec;
  }, [isHolding, onInterim]);

  const stopRecognition = useCallback(() => {
    committedRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // ── Hold start ─────────────────────────────────────────────────────────────
  const handlePressStart = useCallback((e) => {
    e.preventDefault();
    if (disabled || isHolding) return;

    setIsHolding(true);
    holdStartRef.current = performance.now();
    if (onSpeechStart) onSpeechStart();
    startAudioLevel();
    startRecognition(language);
  }, [disabled, isHolding, language, onSpeechStart, startAudioLevel, startRecognition]);

  // ── Hold end ───────────────────────────────────────────────────────────────
  const handlePressEnd = useCallback((e) => {
    if (e) e.preventDefault();
    if (!isHolding) return;

    setIsHolding(false);
    stopRecognition();
    stopAudioLevel();

    // Commit whatever was said
    const transcript = `${finalRef.current}${interimRef.current}`.trim();
    interimRef.current = "";
    finalRef.current   = "";

    if (onSpeechEnd && transcript) {
      onSpeechEnd(transcript);
    } else if (onSpeechEnd) {
      // Even empty release — signal that session can continue
      onSpeechEnd("");
    }
  }, [isHolding, onSpeechEnd, stopAudioLevel, stopRecognition]);

  // ── Pointer leave / cancel (finger slips off button) ──────────────────────
  const handlePressCancel = useCallback(() => {
    if (isHolding) handlePressEnd(null);
  }, [isHolding, handlePressEnd]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRecognition();
      stopAudioLevel();
    };
  }, [stopRecognition, stopAudioLevel]);

  // Ring scale: 1.0 idle → 1.35 at max audio level
  const ringScale = isHolding ? 1.05 + pulseLevel * 0.3 : 1.0;
  const ringOpacity = isHolding ? 0.25 + pulseLevel * 0.55 : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* ── Outer glow ring ── */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          animate={{ scale: ringScale, opacity: ringOpacity }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,255,40,0.35) 0%, rgba(212,255,40,0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Main button ── */}
        <motion.button
          type="button"
          id="hold-to-speak-btn"
          aria-label={isHolding ? labels.holding : labels.hold}
          disabled={disabled}
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressCancel}
          onPointerCancel={handlePressCancel}
          // Touch fallback
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressCancel}
          animate={{
            scale: isHolding ? 1.08 : 1,
            boxShadow: isHolding
              ? `0 0 0 ${4 + pulseLevel * 12}px rgba(212,255,40,${0.15 + pulseLevel * 0.25}), 0 4px 24px rgba(212,255,40,0.3)`
              : "0 2px 12px rgba(0,0,0,0.35)",
          }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: isHolding ? "2px solid var(--accent)" : "2px solid rgba(212,255,40,0.35)",
            background: isHolding
              ? "linear-gradient(135deg, #d4ff28 0%, #aacc00 100%)"
              : "rgba(212,255,40,0.10)",
            color: isHolding ? "#0D1117" : "var(--accent)",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
            touchAction: "none",
            WebkitTapHighlightColor: "transparent",
            position: "relative",
            zIndex: 1,
          }}
        >
          <AnimatePresence mode="wait">
            {isHolding ? (
              <motion.div
                key="recording"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {/* Animated waveform bars */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    height: 20,
                  }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scaleY: isHolding ? [0.3, 0.4 + pulseLevel * 0.9, 0.3] : 0.3,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + i * 0.07,
                        delay: i * 0.08,
                        ease: "easeInOut",
                      }}
                      style={{
                        width: 3,
                        height: 18,
                        borderRadius: 2,
                        background: "#0D1117",
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <Mic size={22} strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Label ── */}
      <AnimatePresence mode="wait">
        <motion.span
          key={isHolding ? "holding" : "idle"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: isHolding ? "var(--accent)" : "var(--muted)",
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          {isHolding ? labels.holding : labels.hold}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
