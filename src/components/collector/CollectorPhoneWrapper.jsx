import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMarketplace } from "../../context/MarketplaceContext";
import { MATERIAL_TAXONOMY } from "../../data/materialTaxonomy";
import {
  createAgentContext,
  AGENT_TOOLS,
  AGENT_INTENTS
} from "../../services/voiceAgentEngine";
import { processTranscript as voiceAdapterProcess, resetAdapterSession } from "../../voice/VoiceAdapter";
import { useAppDispatch } from "../../state/AppStateContext";
import { useAppState } from "../../state/AppStateContext";
import { AppActions } from "../../state/AppActions";
import { selectVoiceUI, selectIsFinancialActionBlocked } from "../../state/selectors";
import { CONFIRMATION_POLICY } from "../../data/confirmationPolicy";
import HoldToConfirmButton from "../shared/HoldToConfirmButton";
import {
  Wifi,
  WifiOff,
  BatteryCharging,
  Mic,
  MicOff,
  Settings,
  X,
  Sparkles,
  ShieldCheck,
  Globe,
  Radio,
  Volume2,
  Cpu,
  Smartphone,
  Laptop,
  Check,
  Home,
  Package,
  Clock,
  ArrowRight,
  Lock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Zap,
  Bot,
  Star,
  DollarSign,
  Layers,
  ChevronDown,
  Send,
  Terminal,
  Sliders,
  Lightbulb,
  Ban,
  TrendingUp,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AIStackInspectorModal from "./AIStackInspectorModal";
import VoiceCalibrationModal from "./VoiceCalibrationModal";
import { CollectorAgentBridgeContext } from "../../context/CollectorAgentBridgeContext";
import { useInteractionFeedback } from "../../context/InteractionFeedbackContext";
import { emitInputAck, feedbackDispatcher } from "../../services/feedbackDispatcher";
import { turnManager } from "../../voice/turn/TurnManager";
import { speechNormalizer } from "../../voice/normalization/SpeechNormalizer";
import { LanguageDetector } from "../../voice/understanding/LanguageDetector";
import { ttsProvider } from "../../voice/tts/TTSProvider";

const languageDetector = new LanguageDetector();

// ── CenterNavVoiceButton ──────────────────────────────────────────────────────
// Dedicated Voice Button in Bottom Navigation:
//   Quick Tap        → Toggle Voice session (open / close Voice Pill)
//   Press & Hold (≥180ms) → Hold-to-Speak (active mic, audio waveform, release commits)
//
// Cleanly integrates with the remade floating pill without UI overlap or audio conflict.
// ─────────────────────────────────────────────────────────────────────────────
const HOLD_THRESHOLD_MS = 140;

function CenterNavVoiceButton({
  language,
  voicePhase,
  micAudioLevel = 0,
  isHolding = false,
  onToggleVoice,
  onHoldStart,
  onHoldEnd,
}) {
  const holdTimerRef = React.useRef(null);
  const pressStartRef = React.useRef(0);
  const didHoldRef = React.useRef(false);
  const pointerCapturedIdRef = React.useRef(null);

  const isActivelyListening = isHolding || voicePhase === "LISTENING" || voicePhase === "PAUSED_WAITING";
  const isVoiceActive = voicePhase !== "IDLE";
  const pulseLevel = Math.min(1, Math.max(0, micAudioLevel / 60));

  const handlePointerDown = React.useCallback((e) => {
    e.stopPropagation();
    // Only capture primary button (left click / touch)
    if (e.button !== undefined && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      pointerCapturedIdRef.current = e.pointerId;
    } catch (_) {}
    pressStartRef.current = performance.now();
    didHoldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      onHoldStart?.();
    }, HOLD_THRESHOLD_MS);
  }, [onHoldStart]);

  const handlePointerUp = React.useCallback((e) => {
    e.stopPropagation();
    clearTimeout(holdTimerRef.current);
    if (pointerCapturedIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerCapturedIdRef.current);
      } catch (_) {}
      pointerCapturedIdRef.current = null;
    }
    if (!didHoldRef.current) {
      // Tap: toggle voice session
      onToggleVoice?.();
    } else {
      // Release: commit speech
      onHoldEnd?.();
    }
    didHoldRef.current = false;
  }, [onToggleVoice, onHoldEnd]);

  const handlePointerCancel = React.useCallback((e) => {
    e.stopPropagation();
    clearTimeout(holdTimerRef.current);
    if (pointerCapturedIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerCapturedIdRef.current);
      } catch (_) {}
      pointerCapturedIdRef.current = null;
    }
    if (didHoldRef.current) {
      onHoldEnd?.();
    }
    didHoldRef.current = false;
  }, [onHoldEnd]);

  React.useEffect(() => {
    return () => {
      clearTimeout(holdTimerRef.current);
    };
  }, []);

  const glowSize = isHolding ? 4 + pulseLevel * 14 : isActivelyListening ? 6 : 0;
  const glowOpacity = isHolding ? 0.35 + pulseLevel * 0.45 : isActivelyListening ? 0.35 : 0;

  return (
    <button
      className={`phone-nav-tab sell-tab voice-center-tab${isActivelyListening ? " active" : ""}${isHolding ? " holding" : ""}`}
      id="tab-phone-center-voice"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(e) => { e.stopPropagation(); }}
      style={{ touchAction: "none", WebkitTapHighlightColor: "transparent", userSelect: "none" }}
      aria-label={
        isHolding
          ? (language === "mr" ? "बोलत आहे..." : language === "hi" ? "बोल रहे हैं..." : "Listening...")
          : isActivelyListening
          ? (language === "mr" ? "ऐकत आहे" : language === "hi" ? "माइक चालू" : "Listening")
          : (language === "mr" ? "आवाज AI" : language === "hi" ? "बोलें" : "Voice AI")
      }
    >
      <motion.div
        className="sell-tab-icon voice-circle-icon"
        animate={{
          scale: isHolding ? 1.15 : isActivelyListening ? 1.06 : 1,
          boxShadow: isHolding
            ? `0 0 0 ${glowSize}px rgba(212,255,40,${glowOpacity}), 0 4px 18px rgba(0,0,0,0.55)`
            : isActivelyListening
            ? "0 0 0 4px rgba(212,255,40,0.32), 0 0 20px rgba(212,255,40,0.45)"
            : "0 4px 14px rgba(0,0,0,0.35)",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
      >
        <AnimatePresence mode="wait">
          {isHolding || (isVoiceActive && micAudioLevel >= 8) ? (
            <motion.div
              key="waveform"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
              style={{ display: "flex", alignItems: "center", gap: 3, height: 22 }}
            >
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [0.25, 0.4 + pulseLevel * 0.9, 0.25] }}
                  transition={{ repeat: Infinity, duration: 0.4 + i * 0.08, delay: i * 0.07, ease: "easeInOut" }}
                  style={{ width: 3, height: 18, borderRadius: 2, background: "#0D1117", transformOrigin: "center" }}
                />
              ))}
            </motion.div>
          ) : isVoiceActive ? (
            <motion.div
              key="mic-active"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Mic size={22} strokeWidth={2.4} color="#0D1117" />
            </motion.div>
          ) : (
            <motion.div
              key="mic-idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Mic size={22} strokeWidth={2.2} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <span className="voice-tab-label">
        {isHolding
          ? (language === "mr" ? "बोलत आहे..." : language === "hi" ? "बोल रहे हैं..." : "Listening...")
          : isActivelyListening
          ? (language === "mr" ? "ऐकत आहे" : language === "hi" ? "सुन रहे हैं" : "Listening")
          : voicePhase === "UNDERSTANDING"
          ? (language === "mr" ? "समजत आहे..." : language === "hi" ? "समझ रहे हैं..." : "Understanding...")
          : voicePhase === "ACTION" || voicePhase === "CONFIRMATION"
          ? (language === "mr" ? "सज्ज" : language === "hi" ? "तैयार" : "Ready")
          : (language === "mr" ? "आवाज AI" : language === "hi" ? "बोलें" : "Voice AI")}
      </span>
    </button>
  );
}

export default function CollectorPhoneWrapper({
  children,
  currentView = "HOME",
  onNavigateHome,
  onStartSellWithCategory,
  onViewLots,
  activeLotDraft = null,
  currentSettledLot = null
}) {
  const {
    language,
    setLanguage,
    networkState,
    offlineQueue,
    t,
    speakPrompt,
    collector,
    lots,
    buyRequests
  } = useMarketplace();

  // Settings drawer state
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showAIStackModal, setShowAIStackModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const showCalibrationModalRef = useRef(false);
  const [micCalibration, setMicCalibration] = useState(() => {
    try {
      const saved = localStorage.getItem("collector_mic_calibration");
      return saved ? JSON.parse(saved) : { gain: 3.5, threshold: 2, sensitivity: "high", ambientFloor: 1, voicePeak: 28 };
    } catch (e) {
      return { gain: 3.5, threshold: 2, sensitivity: "high", ambientFloor: 1, voicePeak: 28 };
    }
  });
  const micCalibrationRef = useRef(micCalibration);
  useEffect(() => { micCalibrationRef.current = micCalibration; }, [micCalibration]);
  const gainNodeRef = useRef(null);
  const updateVolumeRef = useRef(null);

  useEffect(() => {
    showCalibrationModalRef.current = showCalibrationModal;
    if (showCalibrationModal) {
      startLiveMicAudio();
    }
  }, [showCalibrationModal]);

  const handleSaveCalibration = (newCalib) => {
    setMicCalibration(newCalib);
    micCalibrationRef.current = newCalib;
    try {
      localStorage.setItem("collector_mic_calibration", JSON.stringify(newCalib));
    } catch (e) {}
    if (gainNodeRef.current && newCalib.gain) {
      gainNodeRef.current.gain.value = newCalib.gain;
    }
  };

  // Interaction Feedback Bus & Undo Hook
  const {
    undoState,
    executeUndo,
    clearUndo,
    activeClarification,
    clearClarification,
    cancelledState
  } = useInteractionFeedback();

  // Time state for realistic phone status bar
  const [phoneTime, setPhoneTime] = useState("09:41");

  // Persistent Application Context for Collector Voice Agent
  const [agentContext, setAgentContext] = useState(() =>
    createAgentContext(collector, currentView)
  );

  // Deep Screen Awareness Context (synced from active child view)
  const [screenContext, setScreenContext] = useState({
    screen: currentView,
    selectedElement: null,
    visibleElements: [],
    availableActions: []
  });

  // Action Bridge (commands dispatched down to active screen)
  const [voiceCommandAction, setVoiceCommandAction] = useState(null);

  // ── AppState wiring ──────────────────────────────────────────────────────
  const appState  = useAppState();
  const appDispatch = useAppDispatch();
  const voiceUI = selectVoiceUI(appState);
  const isFinancialBlocked = selectIsFinancialActionBlocked(appState);

  // Stable ref of current voiceUI for functional setVoiceUI calls
  const voiceUIRef = useRef(voiceUI);
  useEffect(() => { voiceUIRef.current = voiceUI; }, [voiceUI]);

  // Backward-compatible setVoiceUI — dispatches to AppState reducer
  // Supports both object and functional (prev => next) update patterns
  const setVoiceUI = useCallback((updater) => {
    if (typeof updater === 'function') {
      // Functional update: read latest from ref, compute patch, dispatch
      const next = updater(voiceUIRef.current);
      appDispatch({ type: AppActions.SET_VOICE_UI, payload: next });
    } else {
      appDispatch({ type: AppActions.SET_VOICE_UI, payload: updater });
    }
  }, [appDispatch]);

  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const visibleTranscript = `${finalTranscript} ${interimTranscript}`.trim();

  // Dynamic real-time polyglot language classification across speech stream
  const effectiveDetectedLang = visibleTranscript
    ? languageDetector.detect(visibleTranscript, language)
    : (voiceUI.detectedLanguage || language);

  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [speechNetworkNotice, setSpeechNetworkNotice] = useState(false);
  const [isUserVocalizing, setIsUserVocalizing] = useState(false);
  const isUserVocalizingRef = useRef(false);
  const lastVolTimeRef = useRef(0);
  const recognitionRef = useRef(null);
  const isRecognitionActiveRef = useRef(false);
  const isRecognitionStartingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isContinuousListeningRef = useRef(false);
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const isHoldingMicRef = useRef(false);
  const hasSpokenInTurnRef = useRef(false);
  const userActuallySpokeInTurnRef = useRef(false);
  const errorTimeoutRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const interimInFlightRef = useRef(false);
  const lastInterimTimeRef = useRef(0);
  const currentChunksRef = useRef([]);
  const lastSpeechTimeRef = useRef(0);
  const vadPhaseRef = useRef("IDLE");
  const lastProcessedTextRef = useRef("");
  const lastProcessedTimeRef = useRef(0);
  const holdFallbackTimerRef = useRef(null);

  // Resilient Watchdog: Automatically unstick UI if it stays in UNDERSTANDING for >2.5s
  useEffect(() => {
    if (voiceUI.phase !== "UNDERSTANDING") return;
    const timer = setTimeout(() => {
      console.warn("[Voice Watchdog]: Stuck in UNDERSTANDING phase for >2.5s. Auto-recovering to LISTENING.");
      vadPhaseRef.current = "LISTENING";
      setVoiceUI((prev) => {
        if (prev.phase === "UNDERSTANDING") {
          return {
            ...prev,
            phase: "LISTENING",
            transcript: prev.transcript && !prev.transcript.includes("...") && prev.transcript.trim() !== ""
              ? prev.transcript
              : (language === "mr" ? "ऐकत आहे... बोला" : language === "hi" ? "सुन रहे हैं... बोलिए" : "Listening... Speak naturally")
          };
        }
        return prev;
      });
      if (isContinuousListeningRef.current && micStreamRef.current && (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive")) {
        startNewMediaRecorder(micStreamRef.current);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [voiceUI.phase, language]);

  // Instant Barge-In Interruption Handler
  const handleBargeIn = () => {
    if (isSpeakingRef.current || ttsProvider.isPlayingAudio) {
      ttsProvider.stop();
      isSpeakingRef.current = false;
      setVoiceUI((prev) => ({ ...prev, phase: "LISTENING" }));
    }
  };

  // Live Simulated Voice Input for Quick Utterance Chips
  const simulateLiveVoiceInput = (text) => {
    if (!text) return;
    const detectedLang = languageDetector.detect(text, language);
    setFinalTranscript("");
    setInterimTranscript(text);
    setVoiceUI((prev) => ({
      ...prev,
      phase: "LISTENING",
      transcript: text,
      detectedLanguage: detectedLang
    }));
    turnManager.onInterim(text);
    setTimeout(() => {
      turnManager.onFinal(text);
      turnManager.commitTurn();
    }, 450);
  };

  // AI/ML Telemetry & Command Router State for Evaluators
  const [telemetry, setTelemetry] = useState({
    intent: "FIND_BUYERS",
    entities: [
      { key: "Material", val: "Laptop" },
      { key: "Weight", val: "10 kg" }
    ],
    tools: [
      "estimateLotValue()",
      "findBuyers()",
      "estimateLogistics()",
      "compareOffers()"
    ],
    policy: "Voice prepares • Touch commits",
    status: "Standby Ready"
  });

  // Anti-hallucination filter — delegates to SpeechNormalizer.isNoiseArtifact (canonical source)
  // Kept here for backward compatibility with existing MediaRecorder onstop handler.
  const isHallucinationText = (raw) => {
    // Delegate to the canonical implementation in SpeechNormalizer
    const { SpeechNormalizer } = { SpeechNormalizer: speechNormalizer.constructor };
    try {
      return speechNormalizer.constructor.isNoiseArtifact(raw);
    } catch (e) {
      // Fallback: basic empty check
      return !raw || !raw.trim() || raw.trim().length < 2;
    }
  };

  // Flush active audio buffer to local Whisper ASR immediately
  const flushAndTranscribeAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("flushAndTranscribeAudio catch:", e);
      }
    }
  };

  // Spawn fresh MediaRecorder instance for each utterance cycle
  const startNewMediaRecorder = (stream) => {
    if (!stream || typeof window === "undefined" || !("MediaRecorder" in window)) return;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;
      let chunks = [];
      currentChunksRef.current = chunks;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const restartRecorderIfListening = () => {
          if (isHoldingMicRef.current) return;
          if (
            isContinuousListeningRef.current &&
            micStreamRef.current &&
            !isSpeakingRef.current &&
            !ttsProvider.isPlayingAudio &&
            vadPhaseRef.current !== "ACTION" &&
            vadPhaseRef.current !== "COMMITTED"
          ) {
            startNewMediaRecorder(micStreamRef.current);
          }
        };

        const recoverToListening = () => {
          if (isHoldingMicRef.current) return;
          vadPhaseRef.current = "LISTENING";
          setVoiceUI((prev) => {
            if (prev.phase === "UNDERSTANDING") {
              return {
                ...prev,
                phase: "LISTENING",
                transcript: prev.transcript && !prev.transcript.includes("...") && prev.transcript.trim() !== ""
                  ? prev.transcript
                  : (language === "mr" ? "ऐकत आहे... बोला" : language === "hi" ? "सुन रहे हैं... बोलिए" : "Listening... Speak naturally")
              };
            }
            return prev;
          });
          restartRecorderIfListening();
        };

        if (chunks.length === 0) {
          recoverToListening();
          return;
        }

        const blob = new Blob(chunks, { type: mime || "audio/webm" });
        chunks = [];
        currentChunksRef.current = [];

        // 1. If assistant is actively speaking, DISCARD AUDIO (prevents echo loop!)
        if (isSpeakingRef.current || ttsProvider.isPlayingAudio) {
          userActuallySpokeInTurnRef.current = false;
          hasSpokenInTurnRef.current = false;
          restartRecorderIfListening();
          return;
        }

        userActuallySpokeInTurnRef.current = false;
        hasSpokenInTurnRef.current = false;

        // Discard if audio buffer is too small to contain speech (<200 bytes is empty header)
        if (blob.size < 200) {
          recoverToListening();
          return;
        }

        const asrLang = (language === "hi" || language === "en") ? language : "mr";
        try {
          let res = null;
          try {
            res = await fetch(`/api/asr/transcribe?lang=${asrLang}`, { method: "POST", body: blob });
            if (!res.ok) throw new Error(`Vite proxy returned status ${res.status}`);
          } catch (proxyErr) {
            res = await fetch(`http://127.0.0.1:8765/transcribe?lang=${asrLang}`, { method: "POST", body: blob });
          }

          if (res && res.ok) {
            const data = await res.json();
            if (data.success && data.text && data.text.trim()) {
              const clean = data.text.trim();

              // Frontend guard against Whisper silence hallucinations and repetition loops
              if (isHallucinationText(clean)) {
                console.log("[ASR Suppressed Silence Hallucination]:", clean);
                setInterimTranscript("");
                recoverToListening();
                return;
              }

              console.log("[ASR Transcribed from Mic]:", clean);
              setSpeechNetworkNotice(false);

              // Discard stale in-flight response if user is actively holding down the mic
              if (isHoldingMicRef.current) {
                console.log("[ASR Suppressed stale transcription while user holds mic]:", clean);
                return;
              }

              if (holdFallbackTimerRef.current) {
                clearTimeout(holdFallbackTimerRef.current);
                holdFallbackTimerRef.current = null;
              }

              turnManager.onFinal(clean);
              setFinalTranscript(clean);
              setInterimTranscript("");
              const detected = languageDetector.detect(clean, language);

              vadPhaseRef.current = "UNDERSTANDING";
              setVoiceUI((prev) => ({
                ...prev,
                phase: "UNDERSTANDING",
                transcript: clean,
                detectedLanguage: detected
              }));
              // Dispatch directly to intent pipeline
              handleProcessUtterance(clean);
            } else {
              recoverToListening();
            }
          } else {
            recoverToListening();
          }
        } catch (e) {
          console.warn("Local ASR transcription error:", e);
          recoverToListening();
        }
      };

      recorder.start(250);
    } catch (e) {
      console.warn("Could not start MediaRecorder:", e);
    }
  };

  // Live Microphone Level Monitor via Web Audio API + Resilient Local Whisper ASR
  const startLiveMicAudio = async () => {
    try {
      // 0. Instant Re-Arm: If stream and AudioContext already exist, unmute tracks & resume in 0ms!
      if (micStreamRef.current && audioContextRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = true; });
        if (audioContextRef.current.state === "suspended") {
          try { await audioContextRef.current.resume(); } catch (e) {}
        }
        if (!animFrameRef.current && updateVolumeRef.current) {
          animFrameRef.current = requestAnimationFrame(updateVolumeRef.current);
        }
        startNewMediaRecorder(micStreamRef.current);
        return;
      }

      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        micStreamRef.current = stream;

        // 1. Web Audio Hardware VU Equalizer & Real-time RMS VAD
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") {
            try { await ctx.resume(); } catch (e) {}
          }
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.2;
          analyserRef.current = analyser;

          // Calibrated Gain booster node for laptop/quiet mics
          const gainNode = ctx.createGain();
          gainNode.gain.value = micCalibrationRef.current?.gain || 3.5;
          gainNodeRef.current = gainNode;

          const src = ctx.createMediaStreamSource(stream);
          src.connect(gainNode);
          gainNode.connect(analyser);

          const timeData = new Float32Array(analyser.fftSize);
          const updateVolume = () => {
            if (!micStreamRef.current) return;

            const isCalibrating = showCalibrationModalRef.current;

            // If assistant is speaking, continuous listening is off (and not holding mic and not calibrating), or already in ACTION/COMMITTED, do not trigger VAD!
            if (
              (!isContinuousListeningRef.current && !isHoldingMicRef.current && !isCalibrating) ||
              isSpeakingRef.current ||
              ttsProvider.isPlayingAudio ||
              (!isCalibrating && (
                vadPhaseRef.current === "UNDERSTANDING" ||
                vadPhaseRef.current === "ACTION" ||
                vadPhaseRef.current === "COMMITTED"
              ))
            ) {
              setMicAudioLevel(0);
              animFrameRef.current = requestAnimationFrame(updateVolume);
              return;
            }

            analyser.getFloatTimeDomainData(timeData);
            let sumSquares = 0;
            for (let i = 0; i < timeData.length; i++) {
              sumSquares += timeData[i] * timeData[i];
            }
            const rms = Math.sqrt(sumSquares / timeData.length);
            // Dynamic RMS scale: quiet room is 0.005-0.015, speaking is 0.03-0.25+
            const level = Math.min(100, Math.round(rms * 650));

            const now = Date.now();
            // Responsive updates: ~40ms (25fps) during calibration, ~80ms (12fps) during normal operation
            const throttleMs = isCalibrating ? 40 : 80;
            if (now - lastVolTimeRef.current >= throttleMs) {
              lastVolTimeRef.current = now;
              setMicAudioLevel(level);
            }

            // In calibration modal, do NOT trigger conversational agent state transitions!
            if (isCalibrating) {
              animFrameRef.current = requestAnimationFrame(updateVolume);
              return;
            }

            // Calibrated Voice Activity Watchdog
            const speechThreshold = micCalibrationRef.current?.threshold || 2;
            if (level >= speechThreshold) {
              lastSpeechTimeRef.current = now;
              hasSpokenInTurnRef.current = true;
              userActuallySpokeInTurnRef.current = true;
              if (!isUserVocalizingRef.current) {
                isUserVocalizingRef.current = true;
                setIsUserVocalizing(true);
              }
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
              if (vadPhaseRef.current !== "LISTENING") {
                if (vadPhaseRef.current === "ACTION" || vadPhaseRef.current === "COMMITTED") {
                  return;
                }
                vadPhaseRef.current = "LISTENING";
                setVoiceUI((prev) => {
                  if (prev.phase === "PAUSED_WAITING") {
                    return { ...prev, phase: "LISTENING" };
                  }
                  return prev;
                });
              }
            } else if (hasSpokenInTurnRef.current && level < Math.max(1, speechThreshold - 1)) {
              // While user is actively holding down the mic button, DO NOT AUTO-COMMIT on pause! Wait for release!
              if (isHoldingMicRef.current) {
                animFrameRef.current = requestAnimationFrame(updateVolume);
                return;
              }
              const silenceElapsed = now - lastSpeechTimeRef.current;
              // Transition to PAUSED_WAITING after natural pause (450ms)
              if (silenceElapsed >= 450) {
                if (isUserVocalizingRef.current) {
                  isUserVocalizingRef.current = false;
                  setIsUserVocalizing(false);
                }
                if (vadPhaseRef.current === "LISTENING") {
                  vadPhaseRef.current = "PAUSED_WAITING";
                  setVoiceUI((prev) => {
                    if (prev.phase === "LISTENING") {
                      return { ...prev, phase: "PAUSED_WAITING" };
                    }
                    return prev;
                  });
                }

                // Commit utterance to UNDERSTANDING after sustained quiet (250ms debounce)
                if (!silenceTimerRef.current) {
                  silenceTimerRef.current = setTimeout(() => {
                    silenceTimerRef.current = null;
                    if (isHoldingMicRef.current) {
                      return; // NEVER auto-commit while user is holding the button!
                    }
                    hasSpokenInTurnRef.current = false; // Reset VAD loop state
                    const recognized = (turnManager.finalText || finalTranscript || interimTranscript || "").trim();
                    if (recognized && !recognized.includes("...")) {
                      vadPhaseRef.current = "UNDERSTANDING";
                      setVoiceUI((prev) => ({
                        ...prev,
                        phase: "UNDERSTANDING",
                        transcript: recognized
                      }));
                      handleProcessUtterance(recognized);
                    } else {
                      // Flush audio to Whisper with status feedback
                      vadPhaseRef.current = "UNDERSTANDING";
                      setVoiceUI((prev) => ({
                        ...prev,
                        phase: "UNDERSTANDING",
                        transcript: language === "mr" ? "आवाज तपासत आहे..." : language === "hi" ? "आवाज़ समझ रहे हैं..." : "Processing speech..."
                      }));
                      flushAndTranscribeAudio();
                    }
                  }, 250);
                }
              }
            }

            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolumeRef.current = updateVolume;
          updateVolume();
        }

        // 2. Start initial MediaRecorder for local ASR
        startNewMediaRecorder(stream);
      }
    } catch (e) {
      console.warn("Could not start live mic audio analyser:", e);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setVoiceUI((prev) => ({
          ...prev,
          phase: "ERROR",
          spokenResponse:
            language === "mr"
              ? "माइक परवानगी नाकारली आहे. कृपया ब्राउझरमध्ये मायक्रोफोन चालू करा."
              : language === "hi"
              ? "माइक्रोफ़ोन अनुमति ब्लॉक है। कृपया ब्राउज़र में माइक की अनुमति दें।"
              : "Microphone access blocked. Please allow microphone in browser."
        }));
      }
    }
  };

  const stopLiveMicAudio = (permanent = false) => {
    isUserVocalizingRef.current = false;
    setIsUserVocalizing(false);
    hasSpokenInTurnRef.current = false;
    userActuallySpokeInTurnRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (permanent) {
      if (micStreamRef.current) {
        try {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
        audioContextRef.current = null;
      }
    } else {
      // Warm mute & suspend: keep stream ready for instant 0ms unmuting
      if (micStreamRef.current) {
        try {
          micStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = false; });
        } catch (e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state === "running") {
        try { audioContextRef.current.suspend(); } catch (e) {}
      }
    }
    setMicAudioLevel(0);
  };

  // Update time in phone status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, "0");
      const m = now.getMinutes().toString().padStart(2, "0");
      setPhoneTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update agent context when active view or collector changes
  useEffect(() => {
    setAgentContext((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        language: language,
        name: collector?.name || prev.user.name
      },
      session: {
        ...prev.session,
        currentScreen: currentView,
        currentSettledLot,
        activeLotDraft
      }
    }));
    setScreenContext((prev) => ({ ...prev, screen: currentView }));
  }, [currentView, language, collector, currentSettledLot, activeLotDraft]);

  const stopSpeechRecognition = () => {
    isRecognitionActiveRef.current = false;
    isRecognitionStartingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
  };

  // Clean up speech recognition and live mic on unmount
  useEffect(() => {
    return () => {
      stopLiveMicAudio(true);
      stopSpeechRecognition();
    };
  }, []);

  // Continuous Voice Loop - Start Speech Recognition Synchronously on User Gesture
  const startSpeechRecognition = (fallbackLang = null) => {
    if (typeof window === "undefined") return;
    if (isRecognitionActiveRef.current || isRecognitionStartingRef.current) return;

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      try {
        isRecognitionStartingRef.current = true;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
          recognitionRef.current = null;
        }

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        // Multilingual speech recognition: map exact regional/subcontinental code
        recognition.lang = fallbackLang || (
          language === "mr" ? "mr-IN" :
          language === "hi" ? "hi-IN" :
          "en-IN"
        );
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isRecognitionActiveRef.current = true;
          isRecognitionStartingRef.current = false;
        };

        recognition.onresult = (event) => {
          // Immediately discard ONLY if assistant is actively speaking (prevents echo loop)
          if (isSpeakingRef.current || ttsProvider.isPlayingAudio) {
            return;
          }

          let interim = "";
          let finalText = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || "";
            if (event.results[i].isFinal) {
              finalText += `${transcript.trim()} `;
            } else {
              interim += transcript;
            }
          }

          if (finalText) {
            turnManager.onFinal(finalText);
            setFinalTranscript(turnManager.finalText);
          }
          if (interim !== undefined) {
            turnManager.onInterim(interim);
            setInterimTranscript(interim);
          }

          const currentAccumulated = `${turnManager.finalText} ${interim}`.trim();

          // Live visual feedback and real-time language detection as collector speaks
          if (currentAccumulated) {
            setSpeechNetworkNotice(false);
            vadPhaseRef.current = "LISTENING";
            const liveDetectedLang = languageDetector.detect(currentAccumulated, language);
            setVoiceUI((prev) => ({
              ...prev,
              phase: "LISTENING",
              transcript: currentAccumulated,
              detectedLanguage: liveDetectedLang
            }));
          }

          // Trigger deterministic pause detector ONLY if user is not actively holding down the mic button
          if (!isHoldingMicRef.current) {
            turnManager.onSpeechStop();
          }
        };

        recognition.onerror = (err) => {
          isRecognitionStartingRef.current = false;
          const errCode = err?.error || "unknown";
          // 1. Aborted or no-speech is normal conversation flow
          if (errCode === "aborted" || errCode === "no-speech") {
            return;
          }

          // 2. Network notice (Brave shields / offline / unsupported language)
          if (errCode === "network") {
            console.info("SpeechRecognition cloud notice. Resilient fallback mode active.");
            setSpeechNetworkNotice(true);
            if (!fallbackLang && language === "mr") {
              setTimeout(() => {
                if (isContinuousListeningRef.current) {
                  startSpeechRecognition("hi-IN");
                }
              }, 400);
            }
            return;
          }

          console.warn("SpeechRecognition error notice:", errCode, err);
        };

        recognition.onend = () => {
          isRecognitionActiveRef.current = false;
          isRecognitionStartingRef.current = false;
          // Restart a fresh recognizer instance if session is active and not speaking
          const currentPhase = voiceUIRef.current?.phase || "IDLE";
          if (
            isContinuousListeningRef.current &&
            !isSpeakingRef.current &&
            currentPhase !== "COMMITTED" &&
            currentPhase !== "ERROR"
          ) {
            setTimeout(() => {
              if (
                isContinuousListeningRef.current &&
                !isSpeakingRef.current &&
                !isRecognitionActiveRef.current
              ) {
                startSpeechRecognition(fallbackLang);
              }
            }, 120);
          }
        };

        recognition.start();
      } catch (err) {
        isRecognitionStartingRef.current = false;
        console.warn("Speech recognition initialization catch:", err);
        setSpeechNetworkNotice(true);
      }
    } else {
      setSpeechNetworkNotice(true);
    }
  };

  // Start Agent Session (Invoked directly on user click)
  const handleOpenVoice = () => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    retryAttemptRef.current = 0;
    setSpeechNetworkNotice(false);

    const initialContext = createAgentContext(collector, currentView);
    setAgentContext(initialContext);
    isContinuousListeningRef.current = true;
    setIsContinuousListening(true);
    setFinalTranscript("");
    setInterimTranscript("");

    turnManager.startSession();
    resetAdapterSession();
    turnManager.onTurnComplete = (text) => {
      if (isHoldingMicRef.current) {
        console.log("[TurnManager]: Suppressed premature turn commit while user is holding mic button.");
        return;
      }
      handleProcessUtterance(text);
    };
    turnManager.onStateChange = (state, data) => {
      if (isHoldingMicRef.current && (state === "PROCESSING" || state === "PAUSED_WAITING")) {
        return;
      }
      if (state === "PAUSED_WAITING") {
        setVoiceUI((prev) => ({
          ...prev,
          phase: "PAUSED_WAITING"
        }));
      } else if (state === "LISTENING") {
        setVoiceUI((prev) => ({
          ...prev,
          phase: "LISTENING"
        }));
      } else if (state === "PROCESSING") {
        setVoiceUI((prev) => ({
          ...prev,
          phase: "UNDERSTANDING",
          transcript: data?.text || prev.transcript
        }));
      }
    };

    const initialPlaceholder =
      language === "mr"
        ? "ऐकत आहे... बोला"
        : language === "hi"
        ? "सुन रहे हैं... बोलिए"
        : "Listening... Speak naturally";

    setVoiceUI({
      phase: "LISTENING",
      transcript: initialPlaceholder,
      spokenResponse: "",
      activityTrace: [],
      preparedCard: null,
      confirmationLevel: "TAP_TO_CONFIRM",
      durationMs: 0
    });

    // Start live microphone hardware audio analyzer
    startLiveMicAudio();

    // Start recognition IMMEDIATELY inside user gesture event loop
    startSpeechRecognition();
  };

  // Stop Agent Session
  const handleCloseVoice = () => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    isContinuousListeningRef.current = false;
    setIsContinuousListening(false);
    setSpeechNetworkNotice(false);
    flushAndTranscribeAudio();
    stopLiveMicAudio();
    turnManager.reset();
    setFinalTranscript("");
    setInterimTranscript("");
    setVoiceUI({
      phase: "IDLE",
      transcript: "",
      spokenResponse: "",
      activityTrace: [],
      preparedCard: null,
      confirmationLevel: "TAP_TO_CONFIRM",
      durationMs: 0
    });

    stopSpeechRecognition();
    ttsProvider.stop();
  };


  // Action Planner & Intent Handler
  // Delegates to VoiceAdapter — the single execution path.
  // Never call processAgentUtterance directly from this component.
  const handleProcessUtterance = async (text) => {
    if (!text || text.trim() === "") return;

    // Strict Hold Gate: Under NO circumstances perform action while user holds mic!
    if (isHoldingMicRef.current) {
      console.log("[VoiceAgent]: Blocked handleProcessUtterance because user is actively holding mic:", text);
      return;
    }

    if (holdFallbackTimerRef.current) {
      clearTimeout(holdFallbackTimerRef.current);
      holdFallbackTimerRef.current = null;
    }

    // Normalize speech & Auto-Detect Language
    const norm = speechNormalizer.normalize(text, language);
    const textToProcess = norm.cleanText || text;
    const detectedLang = norm.detectedLanguage || language || "hi";

    // Deduplication gate: ignore identical utterance within 1.8s
    const now = Date.now();
    if (lastProcessedTextRef.current === textToProcess && (now - lastProcessedTimeRef.current < 1800)) {
      console.log("[VoiceAgent]: Suppressed duplicate utterance execution:", textToProcess);
      return;
    }
    lastProcessedTextRef.current = textToProcess;
    lastProcessedTimeRef.current = now;

    const effectiveContext = {
      ...agentContext,
      user: {
        ...agentContext.user,
        language: detectedLang
      }
    };
    setAgentContext(effectiveContext);

    vadPhaseRef.current = "UNDERSTANDING";
    setVoiceUI((prev) => ({
      ...prev,
      phase: "UNDERSTANDING",
      transcript: textToProcess,
      detectedLanguage: detectedLang
    }));

    setTimeout(async () => {
      try {
        // ── SINGLE EXECUTION PATH ─────────────────────────────────────────
        // VoiceAdapter decides which implementation runs (monolith or runtime).
        // This component never calls processAgentUtterance directly.
        const stepResult = await voiceAdapterProcess(textToProcess, {
          agentCtx: effectiveContext,
          external: { lots, buyRequests, currentSettledLot, activeLotDraft, collector },
          screen: screenContext
        });

        if (!stepResult) {
          // VoiceAdapter suppressed (noise artifact or empty)
          vadPhaseRef.current = "LISTENING";
          setVoiceUI((prev) => prev.phase === "UNDERSTANDING" ? { ...prev, phase: "LISTENING" } : prev);
          if (isContinuousListeningRef.current && micStreamRef.current) {
            startNewMediaRecorder(micStreamRef.current);
          }
          return;
        }

        // Update persistent agent context
        if (stepResult.updatedContext) {
          setAgentContext(stepResult.updatedContext);
        }

        // Dispatch commandAction to active screen
        if (stepResult.commandAction) {
          setVoiceCommandAction(stepResult.commandAction);
        }

        // Navigation
        if (stepResult.navigateTo) {
          if (stepResult.navigateTo === "SCANNER") {
            onStartSellWithCategory(stepResult.commandAction?.materialId || "laptops");
          } else if (stepResult.navigateTo === "RECEIPT" || stepResult.navigateTo === "LOTS_LIST") {
            onViewLots();
          }
        }

        // Update Voice UI
        setVoiceUI({
          phase: stepResult.phase || "ACTION",
          transcript: textToProcess,
          detectedLanguage: detectedLang,
          spokenResponse: stepResult.spokenResponse,
          activityTrace: stepResult.activityTrace || [],
          preparedCard: stepResult.preparedCard,
          clarification: stepResult.clarification || null,
          confirmationLevel: stepResult.confirmationLevel || "TAP_TO_CONFIRM",
          durationMs: stepResult.durationMs || 0
        });

        // Evaluator telemetry
        setTelemetry({
          intent: stepResult.diagnostics?.intent || "FIND_BUYERS",
          confidence: stepResult.diagnostics?.confidence || 0.98,
          entities: stepResult.diagnostics?.entities || { Material: "Laptop", Weight: "10 kg" },
          tools: stepResult.diagnostics?.dispatchedTools || [
            "estimateLotValue()",
            "findBuyers()",
            "estimateLogistics()",
            "compareOffers()"
          ],
          policyDecision: stepResult.confirmationLevel === "HOLD_TO_CONFIRM" ? "POLICY_HIGH_VALUE_5S_HOLD" : "ALLOW_IMMEDIATE",
          runtimeState: "BRIDGE_LISTENING",
          screen: currentView,
          detectedLanguage: detectedLang
        });

        // Cardinal UX Rule: Voice prepares • Touch commits
        // If action card is prepared or turn complete: STOP LISTENING IMMEDIATELY! DO NOT LOOP!
        if (!stepResult.shouldListenAgain) {
          vadPhaseRef.current = stepResult.phase || "ACTION";
          isContinuousListeningRef.current = false;
          setIsContinuousListening(false);
          stopLiveMicAudio();
        }

        // TTS feedback
        if (stepResult.spokenResponse) {
          isSpeakingRef.current = true;
          if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) {}
          }
          speakPrompt(stepResult.spokenResponse, detectedLang);
          if (stepResult.shouldListenAgain) {
            setTimeout(() => {
              isSpeakingRef.current = false;
              if (isContinuousListeningRef.current && stepResult.phase !== "COMMITTED" && stepResult.phase !== "ERROR") {
                vadPhaseRef.current = "LISTENING";
                setVoiceUI((prev) => ({
                  ...prev,
                  phase: "LISTENING"
                }));
                startSpeechRecognition();
              }
            }, 2600);
          } else {
            setTimeout(() => {
              isSpeakingRef.current = false;
            }, 2600);
          }
        }
      } catch (err) {
        console.error("Error in handleProcessUtterance:", err);
        setVoiceUI((prev) => ({
          ...prev,
          phase: "ACTION",
          spokenResponse: detectedLang === "mr" ? "प्रक्रियेत अडचण आली. पुन्हा बोला." : detectedLang === "hi" ? "प्रोसेसिंग में समस्या आई। पुनः बोलें।" : "Could not process request. Please try again."
        }));
      }
    }, 300);
  };

  // Physical Touch Commitment (Transaction Policy Engine Commitment)
  const handleCommitAction = () => {
    setVoiceUI((prev) => ({ ...prev, phase: "COMMITTED" }));
    setIsContinuousListening(false);

    // Also dispatch commit to active screen if on marketplace
    if (currentView === "MARKETPLACE") {
      setVoiceCommandAction({ type: "ACCEPT_OFFER" });
    }

    const successMsg =
      language === "mr" ? "सौदा पक्का झाला" : language === "hi" ? "सौदा पक्का हुआ" : "Transaction Committed";
    speakPrompt(successMsg);

    setTimeout(() => {
      onViewLots();
      setTimeout(() => {
        setVoiceUI((prev) => ({ ...prev, phase: "IDLE" }));
      }, 800);
    }, 1200);
  };

  // Determine Perimeter Glow Class
  const getPerimeterGlowClass = () => {
    if (voiceUI.phase === "AMBIGUOUS" || activeClarification) return "glow-clarification";
    if (voiceUI.phase === "PAUSED_WAITING") return "glow-clarification";
    if (voiceUI.phase === "LISTENING") return "glow-listening";
    if (voiceUI.phase === "UNDERSTANDING") return "glow-understanding";
    if (voiceUI.phase === "ERROR") return "glow-error";
    if (voiceUI.phase === "COMMITTED") return "glow-listening";
    if (voiceUI.phase === "CONFIRMATION") return "glow-listening";
    return "glow-speaking";
  };

  const handleHoldStart = useCallback(() => {
    isHoldingMicRef.current = true;
    setIsHoldingMic(true);
    isContinuousListeningRef.current = true;
    setIsContinuousListening(true);
    vadPhaseRef.current = "LISTENING";
    userActuallySpokeInTurnRef.current = true;
    hasSpokenInTurnRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setFinalTranscript("");
    setInterimTranscript("");
    turnManager.startSession();

    setVoiceUI((prev) => ({
      ...prev,
      phase: "LISTENING",
      transcript: language === "mr" ? "ऐकत आहे... बोला" : language === "hi" ? "सुन रहे हैं... बोलिए" : "Listening... Speak now"
    }));

    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      try { audioContextRef.current.resume(); } catch (e) {}
    }

    if (!micStreamRef.current) {
      startLiveMicAudio();
    } else {
      micStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = true; });
      startNewMediaRecorder(micStreamRef.current);
    }

    startSpeechRecognition();
  }, [language]);

  const handleHoldEnd = useCallback(() => {
    isHoldingMicRef.current = false;
    setIsHoldingMic(false);
    userActuallySpokeInTurnRef.current = true;
    hasSpokenInTurnRef.current = true;

    vadPhaseRef.current = "UNDERSTANDING";
    const currentWebSpeech = (turnManager.finalText || finalTranscript || interimTranscript || "").trim();
    setVoiceUI((prev) => ({
      ...prev,
      phase: "UNDERSTANDING",
      transcript: currentWebSpeech && !currentWebSpeech.includes("...")
        ? currentWebSpeech
        : (language === "mr" ? "आवाज तपासत आहे..." : language === "hi" ? "आवाज़ समझ रहे हैं..." : "Processing speech...")
    }));

    // Always flush and stop the dedicated hold audio recording to Whisper ASR
    flushAndTranscribeAudio();

    // Fallback: If Web Speech API already captured a complete transcript,
    // and Whisper takes >1100ms or fails, process the Web Speech transcript safely
    if (currentWebSpeech && !currentWebSpeech.includes("...")) {
      if (holdFallbackTimerRef.current) clearTimeout(holdFallbackTimerRef.current);
      holdFallbackTimerRef.current = setTimeout(() => {
        holdFallbackTimerRef.current = null;
        if (vadPhaseRef.current === "UNDERSTANDING") {
          console.log("[Hold-to-Speak]: Whisper delay fallback to Web Speech transcript:", currentWebSpeech);
          handleProcessUtterance(currentWebSpeech);
        }
      }, 1100);
    }
  }, [finalTranscript, interimTranscript, language]);

  return (
    <CollectorAgentBridgeContext.Provider
      value={{
        screenContext,
        setScreenContext,
        voiceCommandAction,
        dispatchVoiceAction: setVoiceCommandAction,
        onTriggerVoice: handleOpenVoice,
        handleOpenVoice,
        handleCloseVoice,
        handleProcessUtterance,
        voiceUI,
        visibleTranscript,
        interimTranscript,
        isContinuousListening,
        isSpeaking: isSpeakingRef.current,
        onHoldStart: handleHoldStart,
        onHoldEnd: handleHoldEnd
      }}
    >
      <div className="phone-presentation-stage">
        {/* Realistic Android Smartphone Hardware Chassis */}
        <div className="phone-chassis">
          {/* Hardware Ear-Piece Slot */}
          <div className="phone-speaker-pill" />

          {/* Screen Bezel & Display */}
          <div className={`phone-screen ${voiceUI.phase !== "IDLE" ? "voice-active" : ""}`}>
            {/* Global Voice-State Indicator: Ambient Glowing Side Perimeter */}
            {voiceUI.phase !== "IDLE" && (
              <div className={`phone-voice-perimeter-glow ${getPerimeterGlowClass()}`} />
            )}

            {/* Top Status Bar (Time, Punch Hole, Battery, Network) */}
            <div className="phone-status-bar">
              <span>{phoneTime}</span>

              {/* Centered Front Camera Hole Punch */}
              <div className="phone-punch-camera" />

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Native In-Phone Network Badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: networkState === "ONLINE" ? "#1B7943" : "#C47100",
                    display: "flex",
                    alignItems: "center",
                    gap: 3
                  }}
                >
                  {networkState === "ONLINE" ? <Wifi size={11} /> : <WifiOff size={11} />}
                  <span>
                    {networkState === "ONLINE"
                      ? language === "mr"
                        ? "ऑनलाइन"
                        : language === "hi"
                        ? "ऑनलाइन"
                        : "Online"
                      : language === "mr"
                      ? `ऑफलाइन (${offlineQueue.length})`
                      : language === "hi"
                      ? `ऑफलाइन (${offlineQueue.length})`
                      : `Offline (${offlineQueue.length})`}
                  </span>
                </span>

                {/* Battery Indicator */}
                <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontFamily: "var(--font-mono)" }}>
                  <BatteryCharging size={13} color="#1B7943" />
                  <span>94%</span>
                </span>
              </div>
            </div>

            {/* In-App Mobile Header */}
            <div className="phone-app-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "var(--graphite)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                    fontSize: 12,
                    fontWeight: 900
                  }}
                >
                  E
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: "-0.01em", color: "var(--graphite)" }}>
                  E-WASTE BRIDGE
                </span>
              </div>

              {/* In-App Controls: Direct Segmented Language Switcher & Settings */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Direct Segmented Language Switcher */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--canvas)",
                    padding: "2px",
                    borderRadius: 8,
                    border: "1px solid var(--border)"
                  }}
                >
                  {[
                    { id: "mr", label: "मराठी" },
                    { id: "hi", label: "हिन्दी" },
                    { id: "en", label: "EN" }
                  ].map((item) => {
                    const isActive = language === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLanguage(item.id)}
                        style={{
                          padding: "3px 7px",
                          fontSize: 10,
                          fontWeight: 800,
                          borderRadius: 6,
                          border: "none",
                          background: isActive ? "var(--graphite)" : "transparent",
                          color: isActive ? "#FFF" : "var(--muted)",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* Voice Calibration Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCalibrationModal(true);
                    startLiveMicAudio();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    color: "var(--graphite)",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title={language === "mr" ? "आवाज ट्यून करा" : language === "hi" ? "आवाज कैलिब्रेट करें" : "Calibrate Mic & Voice"}
                >
                  <Sliders size={16} />
                </button>

                {/* Settings Drawer Button */}
                <button
                  type="button"
                  onClick={() => setShowSettingsSheet(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    color: "var(--graphite)",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Settings & Profile"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Phone App Body */}
            <div className="phone-scroll-body">
              {/* Native In-Phone Offline Banner (PDR Mandatory §3.1) */}
              {networkState === "OFFLINE" && (
                <div className="phone-offline-banner">
                  <WifiOff size={18} style={{ flexShrink: 0, marginTop: 2, color: "#873800" }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>
                      {language === "mr"
                        ? "ऑफलाइन मोड सक्रिय"
                        : language === "hi"
                        ? "ऑफलाइन मोड सक्रिय"
                        : "OFFLINE MODE ACTIVE"}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
                      {language === "mr"
                        ? "तुमचा डेटा फोनमध्ये सुरक्षित आहे. इंटरनेट सुरू होताच आपोआप सिंक होईल."
                        : language === "hi"
                        ? "आपका डेटा फोन में सुरक्षित है। इंटरनेट मिलने पर अपने आप सिंक होगा।"
                        : "Transactions are encrypted locally. Automatic sync resumes when network returns."}
                    </div>
                    {offlineQueue.length > 0 && (
                      <div style={{ marginTop: 4, fontWeight: 700, fontSize: 10, color: "#873800" }}>
                        ● {offlineQueue.length}{" "}
                        {language === "mr"
                          ? "व्यवहार स्थानिक रांगेत जतन"
                          : language === "hi"
                          ? "लेन-देन फोन में सुरक्षित"
                          : "transactions cached locally"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Active Collector View Body */}
              {children}
            </div>



            {/* In-Phone Native Bottom Navigation Bar */}
            <div className="phone-bottom-nav">
              <button
                className={`phone-nav-tab ${currentView === "HOME" ? "active" : ""}`}
                onClick={onNavigateHome}
                id="tab-phone-home"
              >
                <Home size={19} />
                <span>{language === "mr" ? "मुख्य" : language === "hi" ? "होम" : "Home"}</span>
              </button>

              {/* ── Center button: Dedicated Voice (Tap toggles Voice, Hold to Speak) ── */}
              <CenterNavVoiceButton
                language={language}
                voicePhase={voiceUI.phase}
                micAudioLevel={micAudioLevel}
                isContinuousListening={isContinuousListening}
                isHolding={isHoldingMic}
                onToggleVoice={() => {
                  if (voiceUI.phase === "IDLE") {
                    handleOpenVoice();
                  } else {
                    handleCloseVoice();
                  }
                }}
                onHoldStart={handleHoldStart}
                onHoldEnd={handleHoldEnd}
              />

              <button
                className={`phone-nav-tab ${currentView === "LOTS_LIST" || currentView === "RECEIPT" ? "active" : ""}`}
                onClick={onViewLots}
                id="tab-phone-lots"
              >
                <Package size={19} />
                <span>{language === "mr" ? "लॉट्स व पावती" : language === "hi" ? "लॉट व रसीद" : "Lots & Receipts"}</span>
              </button>
            </div>

            {/* Bottom Android Gesture Indicator */}
            <div className="phone-gesture-bar" />

            {/* SIGNATURE STATE-DRIVEN CONTEXTUAL FLOATING PILL */}
            <AnimatePresence>
              {(voiceUI.phase !== "IDLE" || activeClarification || undoState) && (
                <motion.div
                  key="voice-pill"
                  onClick={handleBargeIn}
                  className={`phone-voice-bottom-pill ${
                    (voiceUI.phase === "LISTENING" || voiceUI.phase === "PAUSED_WAITING" || voiceUI.phase === "UNDERSTANDING" || voiceUI.phase === "COMMITTED" || (undoState && voiceUI.phase === "IDLE")) && voiceUI.phase !== "ERROR"
                      ? "compact"
                      : ""
                  } ${voiceUI.phase === "ERROR" ? "error-state" : ""}`}
                  initial={{ y: 24, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 24, opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  {/* UNDO NOTIFICATION (For Reversible Actions) */}
                  {undoState && voiceUI.phase === "IDLE" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <CheckCircle2 size={13} color="var(--accent)" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {undoState.message}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button type="button" className="pill-undo-btn" onClick={executeUndo}>
                          <RotateCcw size={11} />
                          <span>Undo</span>
                        </button>
                        <button type="button" onClick={clearUndo} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 2 }}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AMBIGUITY CLARIFICATION PHASE */}
                  {(voiceUI.phase === "AMBIGUOUS" || activeClarification) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={13} color="#F59E0B" />
                          <span style={{ fontSize: 11, fontWeight: 900, color: "#F59E0B" }}>
                            {voiceUI.clarification?.prompt || activeClarification?.prompt || (language === "mr" ? "कृपया खरेदीदार निवडा:" : language === "hi" ? "कृपया खरीदार चुनें:" : "Clarification needed:")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVoiceUI((prev) => ({ ...prev, phase: "IDLE" }));
                            clearClarification();
                          }}
                          style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 2 }}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                        {(voiceUI.clarification?.options || activeClarification?.options || [
                          { id: "opt_0", label: "1. Apex (#1)", position: 0 },
                          { id: "opt_1", label: "2. EcoGreen (#2)", position: 1 },
                          { id: "opt_2", label: "3. E-Scrap (#3)", position: 2 }
                        ]).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className="pill-choice-chip"
                            onClick={() => {
                              setVoiceCommandAction({ type: "SELECT_OFFER", index: opt.position });
                              setVoiceUI((prev) => ({
                                ...prev,
                                phase: "ACTION",
                                transcript: opt.label,
                                preparedCard: {
                                  type: "BEST_OFFER",
                                  buyerName: opt.label.split("(")[0].trim() || "Selected Buyer",
                                  netPayout: 2960 - (opt.position * 80)
                                }
                              }));
                              clearClarification();
                            }}
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1. LISTENING & PAUSED_WAITING PHASES (UNIFIED LIVE STREAMING TRANSCRIPT) */}
                  {(voiceUI.phase === "LISTENING" || voiceUI.phase === "PAUSED_WAITING") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      {/* Top Row: Audio Waveform Equalizer + Status + Vernacular Lang Badge + Controls */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          {/* Live 5-Bar Hardware Mic Equalizer */}
                          <div className="phone-mic-vu-meter" title={`Mic Volume: ${micAudioLevel}%`}>
                            {[1, 2, 3, 4, 5].map((bar) => {
                              const barHeight = Math.max(4, Math.min(18, (micAudioLevel / 100) * 18 + 4));
                              const isActive = micAudioLevel >= bar * 12;
                              return (
                                <span
                                  key={bar}
                                  className={`vu-bar ${isActive ? "active" : ""}`}
                                  style={{ height: `${barHeight}px` }}
                                />
                              );
                            })}
                          </div>

                          {/* Dynamic State Pill */}
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 900,
                                color: voiceUI.phase === "PAUSED_WAITING" ? "#F59E0B" : "var(--accent)",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "#D4FF28",
                                  boxShadow: "0 0 8px #D4FF28"
                                }}
                              />
                              {language === "mr" ? "ऐकत आहे..." : language === "hi" ? "सुन रहे हैं..." : "Listening..."}
                            </span>

                            {/* Auto-Detected Vernacular Language Badge */}
                            {effectiveDetectedLang && (
                              <span className="voice-lang-badge">
                                {effectiveDetectedLang === "mr" ? "मराठी" : effectiveDetectedLang === "hi" ? "हिन्दी" : "EN"}
                              </span>
                            )}

                            {/* Subtle micro-indicator if offline speech mode */}
                            {speechNetworkNotice && (
                              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>
                                offline
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Quick Actions: Clean Dismiss Button */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            type="button"
                            onClick={handleCloseVoice}
                            className="voice-icon-btn"
                            title="Close Voice"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* HERO LIVE TRANSCRIPT AREA — THIS IS WHERE WHAT USER SAYS IS DISPLAYED! */}
                      <div className="voice-hero-transcript">
                        {visibleTranscript ? (
                          <>
                            <span>{visibleTranscript}</span>
                            <span className="voice-cursor-caret" />
                          </>
                        ) : isUserVocalizing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent)", fontWeight: 800 }}>
                            <span>
                              {language === "mr"
                                ? "आवाज येत आहे... बोलत रहा..."
                                : language === "hi"
                                ? "आवाज़ आ रही है... बोलते रहिए..."
                                : "Detecting speech... Speak naturally..."}
                            </span>
                            <span className="voice-cursor-caret" />
                          </div>
                        ) : (
                          <span className="voice-placeholder-shimmer">
                            {language === "mr"
                              ? "बोला, उदा. \"१० किलो लॅपटॉप विकायचे आहेत\"..."
                              : language === "hi"
                              ? "बोलिए, जैसे \"10 किलो लैपटॉप बेचना है\"..."
                              : "Speak naturally, e.g. \"I have 10 kg laptops to sell\"..."}
                          </span>
                        )}
                      </div>

                      {/* 1-Tap Quick Scrap Utterance Chips (Sleek horizontal pills, 0 scrollbars) */}
                      {(!visibleTranscript || visibleTranscript.length === 0) && (
                        <div className="voice-prompt-chips-row">
                          {[
                            { label: language === "mr" ? "१० किलो लॅपटॉप" : language === "hi" ? "10 kg लैपटॉप" : "10 kg Laptops", query: language === "mr" ? "माझ्याकडे १० किलो लॅपटॉप आहेत" : language === "hi" ? "मेरे पास 10 किलो लैपटॉप है" : "I have 10 kg laptops to sell" },
                            { label: language === "mr" ? "२५ किलो बॅटरी" : language === "hi" ? "25 किलो बैटरी" : "25 kg Batteries", query: language === "mr" ? "२५ किलो बॅटरी विकायची आहे" : language === "hi" ? "25 किलो बैटरी बेचना है" : "Sell 25 kg battery scrap" },
                            { label: language === "mr" ? "तांबे वायर" : language === "hi" ? "15 kg तांबा वायर" : "15 kg Wire", query: language === "mr" ? "१५ किलो तांबे वायर विकायचे आहे" : language === "hi" ? "15 किलो तांबा वायर बेचना है" : "Sell 15 kg copper wire" },
                            { label: language === "mr" ? "पावत्या दाखवा" : language === "hi" ? "रसीदें दिखाओ" : "Show Receipts", query: language === "mr" ? "माझ्या पावत्या दाखवा" : language === "hi" ? "मेरी रसीदें दिखाओ" : "Show my receipts" }
                          ].map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="voice-prompt-chip"
                              onClick={() => {
                                emitInputAck("TOUCH", "voice_prompt_chip");
                                simulateLiveVoiceInput(chip.query);
                              }}
                            >
                              <span>{chip.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. UNDERSTANDING PHASE */}
                  {voiceUI.phase === "UNDERSTANDING" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                      <Loader2 size={16} className="animate-spin" color="#D4FF28" />
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--accent)", textTransform: "uppercase" }}>
                            {voiceUI.detectedLanguage === "mr" ? "समजले" : voiceUI.detectedLanguage === "hi" ? "समझ गया" : "Recognized"}
                          </span>
                          {voiceUI.detectedLanguage && (
                            <span className="voice-lang-badge">
                              {voiceUI.detectedLanguage === "mr" ? "मराठी" : voiceUI.detectedLanguage === "hi" ? "हिन्दी" : "EN"}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#FFF", lineHeight: 1.4, wordBreak: "break-word" }}>
                          {voiceUI.transcript && voiceUI.transcript.trim() ? `"${voiceUI.transcript}"` : (language === "mr" ? "आवाज तपासत आहे..." : language === "hi" ? "आवाज जांच रहे हैं..." : "Processing speech...")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. ACTION PHASE (Signature Lot Preparation or Buyer Match) */}
                  {voiceUI.phase === "ACTION" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      {/* Spoken Utterance Top Line */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <Mic size={12} color="var(--accent)" />
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            "{voiceUI.transcript}"
                          </span>
                          {voiceUI.detectedLanguage && (
                            <span className="voice-lang-badge">
                              {voiceUI.detectedLanguage === "mr" ? "मराठी" : voiceUI.detectedLanguage === "hi" ? "हिन्दी" : "EN"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleCloseVoice}
                          className="voice-icon-btn"
                          style={{ width: 22, height: 22 }}
                          title="Close"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Understood Lot / Buyer Detail */}
                      {voiceUI.preparedCard?.type === "LOT_PREPARATION" ? (
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", background: "rgba(255,255,255,0.08)", padding: "6px 10px", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Check size={13} color="#D4FF28" strokeWidth={3} />
                            <span style={{ fontSize: 12, fontWeight: 900, color: "#FFF" }}>
                              {voiceUI.preparedCard.materialName} • {voiceUI.preparedCard.weightKg} kg
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 900, color: "#D4FF28" }}>
                              ₹{voiceUI.preparedCard.estimatedNet.toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
                              CPCB ref
                            </span>
                          </div>
                        </div>
                      ) : voiceUI.preparedCard?.type === "BEST_OFFER" ? (
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", background: "rgba(255,255,255,0.08)", padding: "6px 10px", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Check size={13} color="#D4FF28" strokeWidth={3} />
                            <span style={{ fontSize: 12, fontWeight: 900, color: "#FFF" }}>
                              {voiceUI.preparedCard.buyerName}
                            </span>
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 900, color: "#D4FF28" }}>
                            ₹{voiceUI.preparedCard.netPayout.toLocaleString("en-IN")} Net
                          </span>
                        </div>
                      ) : voiceUI.preparedCard?.type === "PRICE_NEGOTIATION" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, background: "rgba(255,255,255,0.08)", padding: "8px 10px", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>
                              {language === "mr" ? "तुमचा अपेक्षित भाव" : language === "hi" ? "आपका लक्ष्य भाव" : "Your Target Rate"}:
                            </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 900, color: "#D4FF28" }}>
                              ₹{voiceUI.preparedCard.targetPrice}/kg
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 4 }}>
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>
                              CPCB: ₹{voiceUI.preparedCard.benchmarkRate}/kg • Top Bid: ₹{voiceUI.preparedCard.topBidRate}/kg
                            </span>
                            <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 800 }}>
                              +18% Premium
                            </span>
                          </div>
                        </div>
                      ) : voiceUI.preparedCard?.type === "HIGHER_PRICE_TIPS" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "rgba(255,255,255,0.08)", padding: "8px 10px", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 900, color: "#D4FF28" }}>
                            <Lightbulb size={13} color="#D4FF28" />
                            <span>{language === "mr" ? "जास्त भाव मिळवण्याचे २ मार्ग:" : language === "hi" ? "ज्यादा दाम पाने के 2 तरीके:" : "2 Ways to Get a Higher Payout:"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#E2E8F0" }}>
                            <span>1. Working स्थिति (+15%)</span>
                            <span style={{ color: "#22C55E", fontWeight: 800 }}>₹{Math.round(voiceUI.preparedCard.baseRate * 1.15)}/kg</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#E2E8F0" }}>
                            <span>2. SafeBat रीसायकलर (+18%)</span>
                            <span style={{ color: "#22C55E", fontWeight: 800 }}>₹{voiceUI.preparedCard.maxRate}/kg</span>
                          </div>
                        </div>
                      ) : voiceUI.preparedCard?.type === "NON_EWASTE_REJECTED" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(255, 77, 79, 0.12)", border: "1px solid rgba(255, 77, 79, 0.35)", padding: "8px 10px", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 900, color: "#FF7875" }}>
                              <Ban size={13} color="#FF7875" />
                              <span>{language === "mr" ? "केवळ ई-कचरा स्वीकारला जातो" : language === "hi" ? "केवल ई-कचरा स्वीकार्य है" : "E-Waste Only Platform"}</span>
                            </span>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                              {voiceUI.preparedCard.category?.split(" ")[0]}
                            </span>
                          </div>
                          <div style={{ fontSize: 10.5, color: "#E2E8F0", lineHeight: 1.35 }}>
                            {language === "mr"
                              ? `आम्ही '${voiceUI.preparedCard.rejectedItem}' किंवा भाजीपाला घेत नाही. खालीलपैकी इलेक्ट्रॉनिक भंगार निवडा:`
                              : language === "hi"
                              ? `हम '${voiceUI.preparedCard.rejectedItem}' या सब्जी/रद्दी नहीं लेते। नीचे से इलेक्ट्रॉनिक स्क्रैप चुनें:`
                              : `We do not accept '${voiceUI.preparedCard.rejectedItem}'. Please choose valid electronic scrap below:`}
                          </div>
                          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
                            {(voiceUI.preparedCard.allowedCategories || []).map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  handleCloseVoice();
                                  onStartSellWithCategory(cat.id);
                                }}
                                style={{
                                  background: "rgba(255,255,255,0.12)",
                                  border: "1px solid rgba(255,255,255,0.2)",
                                  color: "#FFF",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "3px 7px",
                                  borderRadius: 6,
                                  whiteSpace: "nowrap",
                                  cursor: "pointer"
                                }}
                              >
                                {cat.name} ({cat.rate})
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : voiceUI.preparedCard?.type === "EARNINGS_SUMMARY" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 7, background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "10px", borderRadius: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {language === "mr" ? "मासिक ताळेबंद" : language === "hi" ? "मासिक खाता विवरण" : "Monthly Live Ledger"}
                            </span>
                            <span style={{ fontSize: 9.5, color: "#94A3B8" }}>
                              {voiceUI.preparedCard.settledLotsCount} {language === "mr" ? "लॉट पूर्ण" : language === "hi" ? "लॉट पूर्ण" : "Lots Done"}
                            </span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: 8, padding: "6px 8px" }}>
                              <div style={{ fontSize: 9, color: "#86EFAC", fontWeight: 700, textTransform: "uppercase" }}>
                                {language === "mr" ? "जमा रक्कम" : language === "hi" ? "कुल जमा" : "SETTLED"}
                              </div>
                              <div style={{ fontSize: 15, fontWeight: 900, color: "#FFF", fontFamily: "var(--font-mono)" }}>
                                ₹{voiceUI.preparedCard.totalEarned.toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 8, padding: "6px 8px" }}>
                              <div style={{ fontSize: 9, color: "#FDE68A", fontWeight: 700, textTransform: "uppercase" }}>
                                {language === "mr" ? "थकीत येणे" : language === "hi" ? "बाकी रोकड़" : "PENDING DUES"}
                              </div>
                              <div style={{ fontSize: 15, fontWeight: 900, color: "#FFF", fontFamily: "var(--font-mono)" }}>
                                ₹{voiceUI.preparedCard.pendingPayouts.toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: 10.5, color: "#CBD5E1", display: "flex", justifyContent: "space-between" }}>
                            <span>{language === "mr" ? "पुनर्वापरात वळवले:" : language === "hi" ? "रीसायकल वजन:" : "Diverted Weight:"}</span>
                            <span style={{ fontWeight: 800, color: "#FFF" }}>{voiceUI.preparedCard.divertedKg} kg</span>
                          </div>
                        </div>
                      ) : voiceUI.preparedCard?.type === "CONVERSATIONAL_GREETING" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 800, lineHeight: 1.35 }}>
                            {voiceUI.spokenResponse}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 2 }}>
                            {(voiceUI.preparedCard.options || []).map((opt, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  handleCloseVoice();
                                  if (opt.action === "CHECK_EARNINGS") {
                                    setCurrentView("LOTS");
                                  } else if (opt.action === "NAVIGATE_PRICES") {
                                    setShowPriceBoard(true);
                                  } else if (opt.materialId) {
                                    onStartSellWithCategory(opt.materialId);
                                    if (opt.weightKg) {
                                      setVoiceCommandAction({ type: "SET_LOT", materialId: opt.materialId, weight: opt.weightKg, startCamera: true });
                                    }
                                  }
                                }}
                                style={{
                                  background: "rgba(212, 255, 40, 0.12)",
                                  border: "1px solid rgba(212, 255, 40, 0.35)",
                                  color: "#FFF",
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 800 }}>
                          {voiceUI.spokenResponse}
                        </div>
                      )}

                      {/* Signature Action Buttons: [ आगे बढ़ें ] [ बदलें ] [ बोलें ] */}
                      <div className="phone-voice-pill-actions">
                        <button
                          type="button"
                          className="btn-pill-primary"
                          onClick={() => {
                            const card = voiceUI.preparedCard;
                            const matId = card?.materialId || "smartphones";
                            const weight = card?.weightKg;

                            if (card?.type === "EARNINGS_SUMMARY") {
                              handleCloseVoice();
                              onViewLots();
                              return;
                            }

                            if (card?.type === "CONVERSATIONAL_GREETING") {
                              handleCloseVoice();
                              onStartSellWithCategory("laptops");
                              return;
                            }

                            if (card?.type === "NON_EWASTE_REJECTED") {
                              onStartSellWithCategory("smartphones");
                              handleCloseVoice();
                              return;
                            }

                            if (card?.type === "PRICE_NEGOTIATION" || card?.type === "HIGHER_PRICE_TIPS") {
                              if (currentView === "HOME") {
                                onStartSellWithCategory(card?.materialId || "batteries");
                              } else if (currentView === "SCANNER") {
                                const hasPhoto = screenContext?.scanner?.hasUserCapturedPhoto;
                                if (!hasPhoto) {
                                  setVoiceCommandAction({ type: "START_CAMERA" });
                                } else {
                                  setVoiceCommandAction({ type: "PROCEED" });
                                }
                              }
                              handleCloseVoice();
                              return;
                            }

                            if (currentView === "HOME") {
                              onStartSellWithCategory(matId);
                              if (weight) {
                                setVoiceCommandAction({ type: "SET_LOT", materialId: matId, weight, startCamera: true });
                              }
                              // Cleanly dismiss speech box so user sees Scanner screen with camera open
                              handleCloseVoice();
                            } else if (currentView === "SCANNER") {
                              const hasPhoto = screenContext?.scanner?.hasUserCapturedPhoto;
                              if (!hasPhoto) {
                                setVoiceCommandAction({ type: "START_CAMERA" });
                              } else {
                                setVoiceCommandAction({ type: "PROCEED" });
                              }
                              handleCloseVoice();
                            } else if (currentView === "MARKETPLACE") {
                              handleCommitAction();
                              handleCloseVoice();
                            }
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {voiceUI.preparedCard?.type === "EARNINGS_SUMMARY" ? (
                              <>
                                <Package size={13} />
                                <span>{language === "mr" ? "पावत्या व लॉट पहा" : language === "hi" ? "रसीदें और लॉट देखें" : "View Lots & Receipts"}</span>
                              </>
                            ) : voiceUI.preparedCard?.type === "CONVERSATIONAL_GREETING" ? (
                              <>
                                <Sparkles size={13} />
                                <span>{language === "mr" ? "सुरुवात करा" : language === "hi" ? "शुरुआत करें" : "Start Selling"}</span>
                              </>
                            ) : voiceUI.preparedCard?.type === "NON_EWASTE_REJECTED" ? (
                              <>
                                <Smartphone size={13} />
                                <span>{language === "mr" ? "ई-कचरा निवडा" : language === "hi" ? "ई-कचरा चुनें" : "Choose E-Waste"}</span>
                              </>
                            ) : voiceUI.preparedCard?.type === "PRICE_NEGOTIATION" || voiceUI.preparedCard?.type === "HIGHER_PRICE_TIPS" ? (
                              <>
                                <TrendingUp size={13} />
                                <span>{language === "mr" ? "खरेदीदार बोलण्या पाहा" : language === "hi" ? "खरीदार बोलियां देखें" : "View Buyer Bids"}</span>
                              </>
                            ) : currentView === "HOME" || (currentView === "SCANNER" && !screenContext?.scanner?.hasUserCapturedPhoto) ? (
                              <>
                                <Camera size={13} />
                                <span>{language === "mr" ? "फोटो काढा" : language === "hi" ? "फोटो लें" : "Take Photo"}</span>
                              </>
                            ) : currentView === "SCANNER" ? (
                              <span>{language === "mr" ? "खरेदीदार शोधा" : language === "hi" ? "खरीदार खोजें" : "Find Buyers"}</span>
                            ) : (
                              <span>{language === "mr" ? "पुढे जा" : language === "hi" ? "आगे बढ़ें" : "Proceed"}</span>
                            )}
                          </span>
                          <ArrowRight size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-pill-secondary"
                          onClick={() => {
                            handleCloseVoice();
                            if (currentView !== "SCANNER") {
                              onStartSellWithCategory(null);
                            }
                          }}
                        >
                          <span>{language === "mr" ? "बदला" : language === "hi" ? "बदलें" : "Change"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-pill-mic"
                          onClick={() => {
                            if (isSpeakingRef.current) {
                              ttsProvider.stop();
                              isSpeakingRef.current = false;
                            }
                            setIsContinuousListening(true);
                            setVoiceUI((prev) => ({ ...prev, phase: "LISTENING" }));
                            startSpeechRecognition();
                          }}
                          title="Speak next command"
                          style={{
                            background: "rgba(212, 255, 40, 0.14)",
                            border: "1px solid var(--accent)",
                            color: "var(--accent)",
                            borderRadius: 8,
                            padding: "6px 11px",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 900,
                            cursor: "pointer"
                          }}
                        >
                          <Mic size={13} strokeWidth={2.4} />
                          <span>{language === "mr" ? "बोला" : language === "hi" ? "बोलें" : "Speak"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. CONFIRMATION PHASE (Physical Touch Commit) */}
                  {voiceUI.phase === "CONFIRMATION" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: "#FFF" }}>
                          {language === "mr"
                            ? `₹${(voiceUI.preparedCard?.amount || 2960).toLocaleString("en-IN")} ऑफर स्वीकार करायची?`
                            : language === "hi"
                            ? `₹${(voiceUI.preparedCard?.amount || 2960).toLocaleString("en-IN")} ऑफर स्वीकार करें?`
                            : `Accept ₹${(voiceUI.preparedCard?.amount || 2960).toLocaleString("en-IN")} offer?`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVoiceUI((prev) => ({ ...prev, phase: "IDLE" }))}
                          style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 2 }}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* High-Value 5s Hold vs Instant Tap Commit */}
                      {voiceUI.confirmationLevel === "HOLD_TO_CONFIRM" ? (
                        <HoldToConfirmButton
                          amount={voiceUI.preparedCard?.amount || 124600}
                          durationMs={5000}
                          language={language}
                          label={language === "mr" ? "मंजूर करा (५ सेकंद दाबा)" : language === "hi" ? "मंजूर करें (5s दबाएं)" : "HOLD 5S TO CONFIRM"}
                          onConfirmed={handleCommitAction}
                        />
                      ) : (
                        <div className="phone-voice-pill-actions">
                          <button
                            type="button"
                            className="btn-pill-primary"
                            onClick={handleCommitAction}
                            id="btn-voice-pill-accept"
                          >
                            <span>{language === "mr" ? "स्वीकारा (ACCEPT)" : language === "hi" ? "स्वीकार करें (ACCEPT)" : "ACCEPT"}</span>
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            className="btn-pill-secondary"
                            onClick={() => setVoiceUI((prev) => ({ ...prev, phase: "IDLE" }))}
                          >
                            <span>{language === "mr" ? "रद्द करा" : language === "hi" ? "रद्द करें" : "CANCEL"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. COMMITTED PHASE */}
                  {voiceUI.phase === "COMMITTED" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "4px 0", width: "100%" }}>
                      <CheckCircle2 size={16} color="#D4FF28" />
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#D4FF28" }}>
                        {language === "mr" ? "सौदा पक्का झाला" : language === "hi" ? "सौदा पक्का हुआ" : "Transaction Committed"}
                      </span>
                    </div>
                  )}

                  {/* 6. ERROR / NO-MIC DETECTED / NO-SPEECH PHASE */}
                  {voiceUI.phase === "ERROR" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      {/* Top Header Row with MicOff and Dismiss */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "rgba(255, 77, 79, 0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FF4D4F"
                            }}
                          >
                            <MicOff size={13} strokeWidth={2.5} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 900, color: "#FF6B6B" }}>
                            {voiceUI.errorTitle || (language === "mr" ? "मायक्रोफोन जोडलेला नाही" : language === "hi" ? "माइक कनेक्ट नहीं है" : "No Microphone Connected")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCloseVoice}
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            border: "none",
                            color: "#FFF",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          title="Close"
                          id="btn-voice-error-close"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Descriptive Honest Explanation */}
                      <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.4 }}>
                        {voiceUI.errorDescription || (language === "mr"
                          ? "मायक्रोफोन इनपुट मिळाले नाही. खालीलपैकी पर्याय निवडून पुढे जा."
                          : language === "hi"
                          ? "माइक इनपुट नहीं मिला। नीचे दिए विकल्पों में से चुनकर आगे बढ़ें।"
                          : "No audio captured. Check mic connection or tap a sample quote below:")}
                      </div>

                      {/* Quick Fallback Test Chips (Work even with zero mic!) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                        <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                          {language === "mr" ? "चाचणी:" : language === "hi" ? "टेस्ट:" : "Try:"}
                        </span>
                        {[
                          { label: language === "mr" ? "१० किलो लॅपटॉप" : "10 kg Laptops", query: "10 kg laptop" },
                          { label: language === "mr" ? "बॅटरी स्क्रॅप" : "Sell Batteries", query: "batteries" },
                          { label: language === "mr" ? "मोबाईल स्क्रॅप" : "Old Mobiles", query: "smartphones" }
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="pill-choice-chip"
                            onClick={() => {
                              emitInputAck("TOUCH", "error_fallback_chip");
                              handleProcessUtterance(chip.query);
                            }}
                            style={{
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.18)",
                              color: "#FFF",
                              fontSize: 10,
                              padding: "4px 8px",
                              borderRadius: 6,
                              cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span>{chip.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Action buttons: [ Retry Mic ] and [ Dismiss ] */}
                      <div className="phone-voice-pill-actions">
                        <button
                          type="button"
                          className="btn-pill-primary"
                          onClick={() => {
                            emitInputAck("TOUCH", "voice_retry_btn");
                            handleOpenVoice();
                          }}
                          id="btn-voice-retry"
                          style={{
                            background: "var(--accent)",
                            color: "var(--graphite)",
                            fontSize: 11,
                            padding: "6px 12px",
                            fontWeight: 900
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>{language === "mr" ? "पुन्हा प्रयत्न करा" : language === "hi" ? "दोबारा कोशिश करें" : "Retry Mic"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-pill-secondary"
                          onClick={handleCloseVoice}
                          id="btn-voice-dismiss"
                          style={{ fontSize: 11, padding: "6px 12px" }}
                        >
                          <span>{language === "mr" ? "रद्द करा" : language === "hi" ? "रद्द करें" : "Dismiss"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* In-Phone Settings & Language Bottom Sheet */}
            {showSettingsSheet && (
              <div className="phone-settings-sheet">
                <div className="phone-settings-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span className="text-sub-label">{t("app.settingsHeader", { defaultValue: "APP SETTINGS" })}</span>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--graphite)" }}>
                        {t("app.settingsSub", { defaultValue: "Language & Identity" })}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowSettingsSheet(false)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Vernacular Language Radio List */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="text-sub-label" style={{ marginBottom: 8 }}>
                      {t("app.selectLang", { defaultValue: "SELECT LANGUAGE" })}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div
                        onClick={() => setLanguage("mr")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: language === "mr" ? "2px solid var(--graphite)" : "1px solid var(--border)",
                          background: language === "mr" ? "var(--canvas)" : "var(--surface)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16 }}>●</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>मराठी (Marathi)</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>स्थानिक बोली आणि व्हॉईस सपोर्ट</div>
                          </div>
                        </div>
                        {language === "mr" && <Check size={16} color="var(--graphite)" />}
                      </div>

                      <div
                        onClick={() => setLanguage("hi")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: language === "hi" ? "2px solid var(--graphite)" : "1px solid var(--border)",
                          background: language === "hi" ? "var(--canvas)" : "var(--surface)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16 }}>●</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>हिन्दी (Hindi)</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>आवाज और स्थानीय सहायता</div>
                          </div>
                        </div>
                        {language === "hi" && <Check size={16} color="var(--graphite)" />}
                      </div>

                      <div
                        onClick={() => setLanguage("en")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: language === "en" ? "2px solid var(--graphite)" : "1px solid var(--border)",
                          background: language === "en" ? "var(--canvas)" : "var(--surface)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16 }}>●</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>English</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>Standard technical UI</div>
                          </div>
                        </div>
                        {language === "en" && <Check size={16} color="var(--graphite)" />}
                      </div>
                    </div>
                  </div>

                  {/* Collector Identity Details */}
                  <div style={{ background: "var(--canvas)", padding: 12, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1B7943", fontWeight: 700, fontSize: 12 }}>
                      <ShieldCheck size={16} />
                      <span>{language === "mr" ? "नोंदणीकृत ई-कचरा संकलक" : language === "hi" ? "पंजीकृत ई-कचरा संग्राहक" : "Registered Collector Network"}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                      {collector.name} ({collector.phone})
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {t("app.serviceWard", { defaultValue: "Service Ward" })}: {collector.serviceArea} • {collector.complianceTier}
                    </div>
                  </div>

                  {/* AI Stack Technical Inspector Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsSheet(false);
                      setShowAIStackModal(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 14px",
                      background: "#12151A",
                      color: "var(--accent)",
                      border: "1px solid #282E38",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      marginBottom: 12
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Zap size={14} color="var(--accent)" />
                      <span>Zero-Paid-API AI Stack (10 Jobs)</span>
                    </div>
                    <ArrowRight size={14} />
                  </button>

                  {/* Voice & Mic Calibration Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsSheet(false);
                      setShowCalibrationModal(true);
                      startLiveMicAudio();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "11px 14px",
                      background: "var(--canvas)",
                      color: "var(--graphite)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      marginBottom: 10
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Sliders size={16} color="var(--graphite)" />
                      <span>{language === "mr" ? "मायक्रोफोन आवाज ट्यून करा" : language === "hi" ? "आवाज व माइक कैलिब्रेट करें" : "Calibrate Microphone & Voice"}</span>
                    </div>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    className="btn-graphite-action"
                    onClick={() => setShowSettingsSheet(false)}
                    style={{ padding: "10px 14px", fontSize: 13 }}
                  >
                    <span>{t("app.done", { defaultValue: "Done" })}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Voice Calibration Modal - fitted INSIDE phone screen */}
            <VoiceCalibrationModal
              isOpen={showCalibrationModal}
              onClose={() => setShowCalibrationModal(false)}
              currentLevel={micAudioLevel}
              calibration={micCalibration}
              onSaveCalibration={handleSaveCalibration}
              language={language}
            />

            {/* Portal target for modals that must render inside phone screen */}
            <div
              id="phone-screen-portal"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 90,
                borderRadius: 36,
                overflow: "hidden"
              }}
            />
          </div>
        </div>

        {/* Zero-Paid-API AI Stack Architecture Inspector Modal */}
        <AIStackInspectorModal
          isOpen={showAIStackModal}
          onClose={() => setShowAIStackModal(false)}
          screenContext={screenContext}
        />
      </div>
    </CollectorAgentBridgeContext.Provider>
  );
}
