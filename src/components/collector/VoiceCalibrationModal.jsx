import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  Volume2,
  VolumeX,
  Sliders,
  Check,
  CheckCircle2,
  RotateCcw,
  X,
  Sparkles,
  Activity,
  Zap
} from "lucide-react";

export default function VoiceCalibrationModal({
  isOpen,
  onClose,
  currentLevel = 0,
  calibration,
  onSaveCalibration,
  language = "en"
}) {
  const [step, setStep] = useState("IDLE"); // IDLE | MEASURING_NOISE | PREPARING | SPEAKING | COMPLETED
  const [ambientFloor, setAmbientFloor] = useState(calibration?.ambientFloor || 1);
  const [voicePeak, setVoicePeak] = useState(calibration?.voicePeak || 28);
  const [gain, setGain] = useState(calibration?.gain || 3.5);
  const [sensitivity, setSensitivity] = useState(calibration?.sensitivity || "high");
  const [countdown, setCountdown] = useState(0);

  // Calibration samples & timers
  const noiseSamplesRef = useRef([]);
  const voiceSamplesRef = useRef([]);
  const currentLevelRef = useRef(currentLevel);
  const activeTimersRef = useRef([]);

  const clearAllTimers = () => {
    activeTimersRef.current.forEach((t) => clearInterval(t));
    activeTimersRef.current = [];
  };

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      setStep("IDLE");
    } else if (calibration) {
      if (calibration.ambientFloor !== undefined) setAmbientFloor(calibration.ambientFloor);
      if (calibration.voicePeak !== undefined) setVoicePeak(calibration.voicePeak);
      if (calibration.gain !== undefined) setGain(calibration.gain);
      if (calibration.sensitivity !== undefined) setSensitivity(calibration.sensitivity);
    }
    return () => clearAllTimers();
  }, [isOpen, calibration]);

  // High-frequency active sampler during calibration phases (samples every 40ms)
  useEffect(() => {
    if (step !== "MEASURING_NOISE" && step !== "SPEAKING") return;
    const sampler = setInterval(() => {
      const lvl = currentLevelRef.current || 0;
      if (step === "MEASURING_NOISE") {
        noiseSamplesRef.current.push(lvl);
      } else if (step === "SPEAKING") {
        voiceSamplesRef.current.push(lvl);
      }
    }, 40);
    return () => clearInterval(sampler);
  }, [step]);

  const startAutoCalibration = () => {
    clearAllTimers();
    // Step 1: 3s of silence measurement
    setStep("MEASURING_NOISE");
    noiseSamplesRef.current = [];
    voiceSamplesRef.current = [];
    setCountdown(3);

    const noiseTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(noiseTimer);
          // Compute ambient noise floor from 3s silence
          const rawNoise = noiseSamplesRef.current.filter((n) => typeof n === "number" && !isNaN(n));
          const avgNoise =
            rawNoise.length > 0
              ? Math.round(rawNoise.reduce((a, b) => a + b, 0) / rawNoise.length)
              : 1;
          setAmbientFloor(Math.max(0, avgNoise));

          // Step 2: Gap of 2s in between silence and speaking
          setStep("PREPARING");
          setCountdown(2);

          const prepTimer = setInterval(() => {
            setCountdown((prepPrev) => {
              if (prepPrev <= 1) {
                clearInterval(prepTimer);

                // Step 3: 10s for vocal peak measurement
                setStep("SPEAKING");
                setCountdown(10);

                const speakTimer = setInterval(() => {
                  setCountdown((p) => {
                    if (p <= 1) {
                      clearInterval(speakTimer);
                      // Compute results after 10s vocal peak measurement
                      const rawVoice = voiceSamplesRef.current.filter((n) => typeof n === "number" && !isNaN(n));
                      const maxVoice =
                        rawVoice.length > 0
                          ? Math.max(...rawVoice)
                          : Math.max(24, avgNoise + 14);
                      setVoicePeak(Math.max(avgNoise + 4, maxVoice));

                      // Auto-tune threshold: dynamic knee point above room floor
                      const optimalThreshold = Math.max(
                        2,
                        Math.round(avgNoise + (maxVoice - avgNoise) * 0.22)
                      );
                      const dynamicGain = optimalThreshold <= 3 ? 3.5 : optimalThreshold <= 6 ? 2.2 : 1.4;
                      setGain(dynamicGain);
                      setSensitivity("custom");

                      const newCalib = {
                        gain: dynamicGain,
                        sensitivity: "custom",
                        threshold: optimalThreshold,
                        ambientFloor: avgNoise,
                        voicePeak: maxVoice
                      };
                      onSaveCalibration(newCalib);
                      setStep("COMPLETED");
                      return 0;
                    }
                    return p - 1;
                  });
                }, 1000);
                activeTimersRef.current.push(speakTimer);

                return 0;
              }
              return prepPrev - 1;
            });
          }, 1000);
          activeTimersRef.current.push(prepTimer);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    activeTimersRef.current.push(noiseTimer);
  };

  const applyPreset = (presetName) => {
    clearAllTimers();
    setSensitivity(presetName);
    let calib = {};
    if (presetName === "high") {
      calib = { gain: 3.5, threshold: 2, sensitivity: "high", ambientFloor: 1, voicePeak: 28 };
      setGain(3.5);
    } else if (presetName === "balanced") {
      calib = { gain: 2.2, threshold: 5, sensitivity: "balanced", ambientFloor: 2, voicePeak: 25 };
      setGain(2.2);
    } else {
      calib = { gain: 1.4, threshold: 9, sensitivity: "noisy", ambientFloor: 5, voicePeak: 22 };
      setGain(1.4);
    }
    onSaveCalibration(calib);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="phone-settings-sheet"
          style={{ zIndex: 85 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="phone-settings-card"
            style={{
              maxHeight: "84%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "rgba(212,255,40,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Sliders size={16} color="var(--accent)" />
                </div>
                <div>
                  <span className="text-sub-label">
                    {language === "mr"
                      ? "मायक्रोफोन ट्यूनिंग"
                      : language === "hi"
                      ? "माइक कैलिब्रेशन"
                      : "VOICE CALIBRATION"}
                  </span>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: "var(--graphite)",
                      margin: 0
                    }}
                  >
                    {language === "mr"
                      ? "तुमच्या आवाजाशी ट्यून करा"
                      : language === "hi"
                      ? "अपनी आवाज के अनुसार सेट करें"
                      : "Calibrate to Your Voice"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "var(--canvas)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--muted)",
                  padding: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Live Audio Level VU Meter */}
            <div
              style={{
                background: "#12151A",
                borderRadius: 12,
                padding: "12px 14px",
                color: "#FFF"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--accent)"
                  }}
                >
                  <Activity size={13} />
                  <span>
                    {language === "mr"
                      ? "थेट मायक्रोफोन इनपुट"
                      : language === "hi"
                      ? "लाइव माइक इनपुट"
                      : "Live Mic Volume"}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 900,
                    color:
                      currentLevel >= (calibration?.threshold || 5)
                        ? "#D4FF28"
                        : "#888"
                  }}
                >
                  {currentLevel} / 100
                </span>
              </div>

              {/* Dynamic LED VU Bar */}
              <div
                style={{
                  width: "100%",
                  height: 14,
                  background: "#1E232D",
                  borderRadius: 7,
                  overflow: "hidden",
                  position: "relative"
                }}
              >
                <motion.div
                  style={{
                    height: "100%",
                    background:
                      currentLevel >= (calibration?.threshold || 5)
                        ? "linear-gradient(90deg, #1B7943 0%, #D4FF28 75%, #FF4D4F 100%)"
                        : "#4A5568",
                    borderRadius: 7
                  }}
                  animate={{ width: `${Math.min(100, currentLevel * 1.6)}%` }}
                  transition={{ type: "tween", ease: "linear", duration: 0.05 }}
                />
                {/* Threshold marker line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${Math.min(
                      100,
                      (calibration?.threshold || 5) * 1.6
                    )}%`,
                    width: 2,
                    background: "#FFF",
                    boxShadow: "0 0 4px #FFF"
                  }}
                  title="Speech Trigger Gate"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "#A0A6B2",
                  marginTop: 6
                }}
              >
                <span>
                  {language === "mr"
                    ? "शांत खोली"
                    : language === "hi"
                    ? "शांत कमरा"
                    : "Quiet room"}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    color: "var(--accent)"
                  }}
                >
                  <Zap size={10} />
                  <span>
                    {language === "mr"
                      ? "आवाज गेट"
                      : language === "hi"
                      ? "वॉइस गेट"
                      : "Speech Gate"}{" "}
                    ({calibration?.threshold || 5})
                  </span>
                </span>
                <span>
                  {language === "mr"
                    ? "मोठा आवाज"
                    : language === "hi"
                    ? "तेज आवाज"
                    : "Loud speech"}
                </span>
              </div>
            </div>

            {/* 1-Click Auto Calibration Wizard */}
            <div
              style={{
                background: "var(--canvas)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "12px 14px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8
                }}
              >
                <Sparkles size={15} color="#1B7943" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "var(--graphite)"
                  }}
                >
                  {language === "mr"
                    ? "१-क्लिक स्वयंचलित ट्यूनिंग"
                    : language === "hi"
                    ? "1-क्लिक ऑटो ट्यूनिंग"
                    : "1-Click Auto Calibrate"}
                </span>
              </div>

              {step === "IDLE" && (
                <div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted)",
                      margin: "0 0 10px 0",
                      lineHeight: 1.35
                    }}
                  >
                    {language === "mr"
                      ? "३ सेकंद शांतता, २ सेकंद तयारी आणि १० सेकंद बोलण्याचा आवाज मोजून परिपूर्ण सेटिंग करेल."
                      : language === "hi"
                      ? "3 सेकंड शांति, 2 सेकंड तैयारी और 10 सेकंड आवाज मापकर सटीक सेटिंग तय करेगा।"
                      : "Measures 3s room silence, gives a 2s preparation gap, then samples 10s of natural speech."}
                  </p>
                  <button
                    type="button"
                    onClick={startAutoCalibration}
                    className="btn-primary-action"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      fontSize: 12.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Mic size={14} />
                    <span>
                      {language === "mr"
                        ? "आवाज मोजणे सुरू करा"
                        : language === "hi"
                        ? "कैलिब्रेशन शुरू करें"
                        : "Start Voice Calibration"}
                    </span>
                  </button>
                </div>
              )}

              {step === "MEASURING_NOISE" && (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "rgba(212, 255, 40, 0.15)",
                      border: "1px solid rgba(212, 255, 40, 0.3)",
                      margin: "0 auto 6px auto"
                    }}
                  >
                    <VolumeX size={22} color="var(--graphite)" />
                  </motion.div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "var(--graphite)",
                      fontFamily: "var(--font-mono)"
                    }}
                  >
                    {countdown}s
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--graphite)",
                      marginTop: 3
                    }}
                  >
                    {language === "mr"
                      ? "शांत राहा (३ सेकंद)... खोलीचा आवाज मोजत आहे"
                      : language === "hi"
                      ? "कृपया शांत रहें (3 सेकंड)... कमरे का बैकग्राउंड साउंड माप रहे हैं"
                      : "Stay quiet (3s)... measuring ambient room noise"}
                  </div>
                </div>
              )}

              {step === "PREPARING" && (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "rgba(212, 255, 40, 0.2)",
                      border: "1px solid rgba(212, 255, 40, 0.4)",
                      margin: "0 auto 6px auto"
                    }}
                  >
                    <Activity size={22} color="var(--graphite)" />
                  </motion.div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "var(--graphite)",
                      fontFamily: "var(--font-mono)"
                    }}
                  >
                    {countdown}s
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--graphite)",
                      marginTop: 3
                    }}
                  >
                    {language === "mr"
                      ? "तयार व्हा... (२ सेकंद)"
                      : language === "hi"
                      ? "बोलने के लिए तैयार हो जाएं (2 सेकंड)..."
                      : "Get ready to speak (2s)..."}
                  </div>
                </div>
              )}

              {step === "SPEAKING" && (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <motion.div
                    animate={{
                      scale: [1, 1.12, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(27,121,67,0.35)",
                        "0 0 0 8px rgba(27,121,67,0)",
                        "0 0 0 0 rgba(27,121,67,0)"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "rgba(27, 121, 67, 0.15)",
                      border: "1px solid rgba(27, 121, 67, 0.3)",
                      margin: "0 auto 6px auto"
                    }}
                  >
                    <Mic size={22} color="#1B7943" />
                  </motion.div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#1B7943",
                      fontFamily: "var(--font-mono)"
                    }}
                  >
                    {countdown}s
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 900,
                      color: "#1B7943",
                      marginTop: 3
                    }}
                  >
                    {language === "mr"
                      ? "आता मोकळेपणाने बोला (१० सेकंद): '१० किलो लॅपटॉप विकायचे आहेत'"
                      : language === "hi"
                      ? "स्वाभाविक रूप से बोलिए (10 सेकंड): '10 किलो लैपटॉप बेचना है' या स्क्रैप बताएं"
                      : "Speak naturally (10s): '10 kg laptop to sell' or describe your scrap"}
                  </div>
                </div>
              )}

              {step === "COMPLETED" && (
                <div style={{ textAlign: "center", padding: "6px 0" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#1B7943",
                      fontWeight: 900,
                      fontSize: 13
                    }}
                  >
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                    <span>
                      {language === "mr"
                        ? "यशस्वीरीत्या ट्यून झाले!"
                        : language === "hi"
                        ? "सफलतापूर्वक कैलिब्रेट हुआ!"
                        : "Calibration Saved!"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--muted)",
                      marginTop: 3
                    }}
                  >
                    {language === "mr"
                      ? `खोलीचा आवाज: ${ambientFloor} | तुमचा आवाज: ${voicePeak} | गेट: ${calibration?.threshold || 5}`
                      : language === "hi"
                      ? `कमरे का शोर: ${ambientFloor} | आपकी आवाज: ${voicePeak} | गेट: ${calibration?.threshold || 5}`
                      : `Room: ${ambientFloor} | Voice: ${voicePeak} | Gate: ${calibration?.threshold || 5}`}
                  </div>
                  <button
                    type="button"
                    onClick={startAutoCalibration}
                    style={{
                      marginTop: 8,
                      background: "transparent",
                      border: "none",
                      color: "var(--graphite)",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>
                      {language === "mr"
                        ? "पुन्हा ट्यून करा"
                        : language === "hi"
                        ? "दोबारा टेस्ट करें"
                        : "Recalibrate"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Sensitivity Presets */}
            <div>
              <div className="text-sub-label" style={{ marginBottom: 6 }}>
                {language === "mr"
                  ? "मायक्रोफोन संवेदनशीलता"
                  : language === "hi"
                  ? "माइक संवेदनशीलता (प्रीसेट)"
                  : "SENSITIVITY PRESETS"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  {
                    id: "high",
                    icon: Sparkles,
                    title:
                      language === "mr"
                        ? "उच्च संवेदनशीलता (शिफारस केलेली)"
                        : language === "hi"
                        ? "उच्च संवेदनशीलता (अनुशंसित)"
                        : "High Sensitivity (Recommended)",
                    desc:
                      language === "mr"
                        ? "लॅपटॉप माइक किंवा हळू आवाजासाठी (३.५x बूस्ट)"
                        : language === "hi"
                        ? "लैपटॉप माइक या धीमी आवाज के लिए (3.5x बूस्ट)"
                        : "For laptop internal mics or soft speech (3.5x boost)"
                  },
                  {
                    id: "balanced",
                    icon: Volume2,
                    title:
                      language === "mr"
                        ? "संतुलित (सामान्य)"
                        : language === "hi"
                        ? "संतुलित (सामान्य)"
                        : "Balanced (Standard)",
                    desc:
                      language === "mr"
                        ? "हेडसेट किंवा शांत खोलीसाठी (२.२x बूस्ट)"
                        : language === "hi"
                        ? "हेडसेट या शांत कमरे के लिए (2.2x बूस्ट)"
                        : "For headsets or quiet rooms (2.2x boost)"
                  },
                  {
                    id: "noisy",
                    icon: Sliders,
                    title:
                      language === "mr"
                        ? "गजबजलेले वातावरण / पंखा"
                        : language === "hi"
                        ? "शोरगुल / पंखे वाला कमरा"
                        : "Noisy Room / Loud Fan",
                    desc:
                      language === "mr"
                        ? "पंख्याचा आवाज जास्त असल्यास (१.४x बूस्ट)"
                        : language === "hi"
                        ? "यदि पंखे या बाहर का शोर अधिक हो (1.4x बूस्ट)"
                        : "Suppresses loud fans or street noise (1.4x boost)"
                  }
                ].map((preset) => {
                  const isSel = sensitivity === preset.id;
                  const IconComp = preset.icon;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: isSel
                          ? "2px solid var(--graphite)"
                          : "1px solid var(--border)",
                        background: isSel ? "var(--canvas)" : "var(--surface)",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: isSel
                              ? "rgba(18,21,26,0.1)"
                              : "rgba(0,0,0,0.03)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <IconComp
                            size={13}
                            color={isSel ? "var(--graphite)" : "var(--muted)"}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: "var(--graphite)"
                            }}
                          >
                            {preset.title}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              marginTop: 1
                            }}
                          >
                            {preset.desc}
                          </div>
                        </div>
                      </div>
                      {isSel && (
                        <Check
                          size={15}
                          color="var(--graphite)"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              className="btn-graphite-action"
              onClick={onClose}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Check size={14} />
              <span>
                {language === "mr"
                  ? "जतन करा आणि पूर्ण करा"
                  : language === "hi"
                  ? "सहेजें और संपन्न"
                  : "Save & Close"}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
