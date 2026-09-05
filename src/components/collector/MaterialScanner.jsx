import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMarketplace } from "../../context/MarketplaceContext";
import { MATERIAL_TAXONOMY } from "../../data/materialTaxonomy";
import { SAMPLE_LOT_PHOTOS } from "../../data/samplePhotos";
import SafetyModal from "./SafetyModal";
import {
  Camera,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Upload,
  Video,
  VideoOff,
  Minus,
  Plus,
  Mic,
  ChevronDown,
  Edit3
} from "lucide-react";

import { useCollectorAgentBridge } from "../../context/CollectorAgentBridgeContext";
import { emitStateChange, emitInputAck } from "../../services/feedbackDispatcher";

export default function MaterialScanner({
  initialMaterialId,
  onBack,
  onOffersReady,
  voiceCommandAction = null,
  onContextChange = null
}) {
  const { t, networkState, language, speakPrompt } = useMarketplace();
  const bridge = useCollectorAgentBridge();
  const effectiveOnContextChange = onContextChange || bridge?.setScreenContext;
  const effectiveVoiceCommand = voiceCommandAction || bridge?.voiceCommandAction;

  // Find initial material or default to smartphones
  const defaultMat = MATERIAL_TAXONOMY.find((m) => m.id === initialMaterialId) || MATERIAL_TAXONOMY[0];
  const [selectedMaterial, setSelectedMaterial] = useState(defaultMat);
  const [weightKg, setWeightKg] = useState(defaultMat.sampleImages[0]?.weightEst || 5.0);
  const [valuePulse, setValuePulse] = useState(false);
  
  // Simplified Condition: 'WORKING' | 'USED' | 'DAMAGED'
  const [condition, setCondition] = useState("USED");

  // Camera & Image State
  const [hasUserCapturedPhoto, setHasUserCapturedPhoto] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState(SAMPLE_LOT_PHOTOS[defaultMat.id] || SAMPLE_LOT_PHOTOS.smartphones);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Progressive Details & Modals
  const [showDetails, setShowDetails] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [isChangingMaterial, setIsChangingMaterial] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceMutated, setVoiceMutated] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const voiceRecognitionRef = useRef(null);

  // Expose live screen context up to parent agent
  useEffect(() => {
    effectiveOnContextChange?.({
      screen: "SCANNER",
      scanner: {
        material: selectedMaterial,
        weightKg,
        condition,
        isCameraActive,
        hasUserCapturedPhoto
      },
      availableActions: ["CHANGE_MATERIAL", "CHANGE_WEIGHT", "START_CAMERA", "PROCEED"]
    });
  }, [selectedMaterial, weightKg, condition, isCameraActive, hasUserCapturedPhoto, effectiveOnContextChange]);

  // Two-Way Voice Action Bridge (Mutates screen directly)
  useEffect(() => {
    if (!effectiveVoiceCommand) return;

    if (effectiveVoiceCommand.type === "UPDATE_WEIGHT" && effectiveVoiceCommand.weight) {
      handleUpdateWeight(effectiveVoiceCommand.weight, "VOICE");
      setVoiceMutated(true);
      setTimeout(() => setVoiceMutated(false), 1400);
    } else if (effectiveVoiceCommand.type === "SET_LOT") {
      if (effectiveVoiceCommand.materialId) {
        const mat = MATERIAL_TAXONOMY.find((m) => m.id === effectiveVoiceCommand.materialId);
        if (mat) {
          setSelectedMaterial(mat);
        }
      }
      if (effectiveVoiceCommand.weight) {
        setWeightKg(effectiveVoiceCommand.weight);
        setVoiceMutated(true);
        setTimeout(() => setVoiceMutated(false), 1400);
      }
      if (effectiveVoiceCommand.startCamera || !hasUserCapturedPhoto) {
        startLiveCamera();
        speakPrompt(
          language === "mr"
            ? "कृपया स्क्रॅपचा फोटो काढा"
            : language === "hi"
            ? "कृपया स्क्रैप की फोटो लें"
            : "Please photograph the scrap"
        );
      }
    } else if (effectiveVoiceCommand.type === "CHANGE_MATERIAL" && effectiveVoiceCommand.materialId) {
      const mat = MATERIAL_TAXONOMY.find((m) => m.id === effectiveVoiceCommand.materialId);
      if (mat) {
        setSelectedMaterial(mat);
      }
    } else if (effectiveVoiceCommand.type === "START_CAMERA") {
      if (effectiveVoiceCommand.snap && isCameraActive) {
        capturePhoto();
      } else {
        startLiveCamera();
      }
    } else if (effectiveVoiceCommand.type === "RETAKE_PHOTO") {
      setHasUserCapturedPhoto(false);
      startLiveCamera();
    } else if (effectiveVoiceCommand.type === "CHANGE_CONDITION" && effectiveVoiceCommand.condition) {
      setCondition(effectiveVoiceCommand.condition);
    } else if (effectiveVoiceCommand.type === "PROCEED") {
      handleProceed();
    }
  }, [effectiveVoiceCommand, isCameraActive, hasUserCapturedPhoto]);

  // Shared Unified Weight Mutation with Instant Same-Frame Feedback & Undo
  const handleUpdateWeight = (newWeight, source = "TOUCH") => {
    const prev = weightKg;
    const rounded = Math.max(0.5, Math.round(newWeight * 10) / 10);
    if (prev === rounded) return;
    setWeightKg(rounded);
    setValuePulse(true);
    setTimeout(() => setValuePulse(false), 450);

    emitStateChange(
      source,
      "UPDATE_WEIGHT",
      "weight",
      { from: prev, to: rounded },
      {
        message: `${rounded} kg (${selectedMaterial.name})`,
        onUndo: () => {
          setWeightKg(prev);
          setValuePulse(true);
          setTimeout(() => setValuePulse(false), 450);
        }
      }
    );
  };

  // Condition multipliers (clean 3-tier mental model)
  const conditionMultiplier = condition === "WORKING" ? 1.15 : condition === "DAMAGED" ? 0.85 : 1.0;
  const targetValue = Math.round(selectedMaterial.baseBenchmarkRatePerKg * weightKg * conditionMultiplier);

  // WebRTC Live Camera Controls
  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraError("Camera unavailable. Using certified sample photo.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setActivePhotoUrl(dataUrl);
    setHasUserCapturedPhoto(true);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === "string") {
        setActivePhotoUrl(dataUrl);
        setHasUserCapturedPhoto(true);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectMaterial = (mat) => {
    setSelectedMaterial(mat);
    setIsChangingMaterial(false);
    const newWeight = mat.sampleImages[0]?.weightEst || 5.0;
    setWeightKg(newWeight);
    setActivePhotoUrl(SAMPLE_LOT_PHOTOS[mat.id] || SAMPLE_LOT_PHOTOS.smartphones);
  };

  // Quick Voice Weight Input
  const handleVoiceWeight = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakPrompt(language === "mr" ? "कृपया बटणाने वजन निवडा" : language === "hi" ? "कृपया बटन से वजन चुनें" : "Please tap buttons for weight");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      voiceRecognitionRef.current = rec;
      rec.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
      rec.continuous = false;
      rec.interimResults = false;

      setIsVoiceListening(true);
      speakPrompt(language === "mr" ? "वजन सांगा..." : language === "hi" ? "वजन बोलिए..." : "Speak weight...");

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const digitMatch = transcript.match(/(\d+(?:\.\d+)?)/);
        if (digitMatch && digitMatch[1]) {
          const num = parseFloat(digitMatch[1]);
          if (num > 0 && num <= 300) {
            setWeightKg(num);
            speakPrompt(`${num} ${language === "mr" ? "किलो" : language === "hi" ? "किलो" : "kg"}`);
          }
        }
        setIsVoiceListening(false);
      };

      rec.onerror = () => setIsVoiceListening(false);
      rec.onend = () => setIsVoiceListening(false);

      rec.start();
    } catch (e) {
      setIsVoiceListening(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (voiceRecognitionRef.current) {
        try { voiceRecognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const handleProceed = () => {
    if (!hasUserCapturedPhoto) {
      if (!isCameraActive) {
        startLiveCamera();
      }
      speakPrompt(
        language === "mr"
          ? "कृपया आधी स्क्रॅपचा फोटो काढा"
          : language === "hi"
          ? "कृपया पहले स्क्रैप का फोटो लें"
          : "Please take a photo of the scrap first"
      );
      return;
    }
    onOffersReady({
      materialId: selectedMaterial.id,
      material: selectedMaterial,
      weightKg: parseFloat(weightKg),
      targetValue,
      photoUrl: activePhotoUrl,
      conditionGrade: condition === "WORKING" ? "Intact" : condition === "DAMAGED" ? "Damaged" : "Scrap"
    });
  };

  const localizedMatName = t("materials." + selectedMaterial.id, { defaultValue: selectedMaterial.name });

  return (
    <div className="collector-viewport" style={{ paddingBottom: 16 }}>
      {/* Top Bar: Back & Screen Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: "6px 10px", fontSize: 12 }}>
          <ArrowLeft size={15} />
          <span>{t("app.back", { defaultValue: "Back" })}</span>
        </button>
        <span className="text-sub-label" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em" }}>
          {language === "mr" ? "ई-कचरा तपासणी" : language === "hi" ? "ई-कचरा स्कैन" : "E-WASTE SCANNER"}
        </span>
      </div>

      {/* Main Single-Decision Card */}
      <div className="instrument-card" style={{ padding: 14 }}>
        {/* 1. Camera / Photo Viewport with Mandatory Shutter Prompt */}
        <div
          style={{
            height: 155,
            background: "#0F1216",
            borderRadius: 12,
            border: hasUserCapturedPhoto ? "2px solid #22C55E" : isCameraActive ? "2px solid var(--accent)" : "2px dashed rgba(212,255,40,0.45)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12
          }}
        >
          {/* A. Live Camera Stream */}
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: isCameraActive ? "block" : "none"
            }}
            playsInline
            muted
          />

          {/* B. Real Captured Photo (Only shown AFTER collector actually snaps/uploads) */}
          {!isCameraActive && hasUserCapturedPhoto && (
            <img
              src={activePhotoUrl}
              alt="Scrap Verified"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}

          {/* C. Mandatory Photo Shutter Prompt (Shown when no photo has been taken yet) */}
          {!isCameraActive && !hasUserCapturedPhoto && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 16px",
                textAlign: "center",
                gap: 6
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(212, 255, 40, 0.12)",
                  border: "1px solid var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                  boxShadow: "0 0 16px rgba(212, 255, 40, 0.2)"
                }}
              >
                <Camera size={22} strokeWidth={2.4} />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#FFF", letterSpacing: "0.02em" }}>
                  {language === "mr"
                    ? "पायरी १: स्क्रॅपचा फोटो काढा"
                    : language === "hi"
                    ? "चरण 1: स्क्रैप की फोटो लें"
                    : "Step 1: Photograph Scrap Lot"}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, fontWeight: 600 }}>
                  {language === "mr"
                    ? "CPCB नियमांनुसार खरेदीदार बोलीसाठी फोटो आवश्यक आहे"
                    : language === "hi"
                    ? "सत्यापित खरीदार बोलियों के लिए फोटो अनिवार्य है"
                    : "Required for buyer bids & CPCB verification"}
                </div>
              </div>

              {/* Viewport Action Buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={startLiveCamera}
                  style={{
                    background: "var(--accent)",
                    color: "var(--graphite)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer"
                  }}
                >
                  <Camera size={13} strokeWidth={2.5} />
                  <span>{language === "mr" ? "कॅमेरा सुरू करा" : language === "hi" ? "कैमरा खोलें" : "Open Camera"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#FFF",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer"
                  }}
                >
                  <Upload size={13} />
                  <span>{language === "mr" ? "गॅलरी" : language === "hi" ? "गैलरी" : "Gallery"}</span>
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Captured Photo Verified Badge Overlay */}
          {hasUserCapturedPhoto && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                background: "rgba(18, 21, 26, 0.92)",
                backdropFilter: "blur(6px)",
                border: "1px solid #22C55E",
                borderRadius: 8,
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#FFF"
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#22C55E",
                  color: "#0D1117",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Check size={12} strokeWidth={3} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#22C55E", textTransform: "uppercase" }}>
                  {selectedMaterial.shortCode} • PHOTO VERIFIED
                </div>
                <div style={{ fontSize: 9, color: "#A0A6B2", fontWeight: 700 }}>
                  CPCB Digital Audit Trail Ready
                </div>
              </div>
            </div>
          )}

          {/* Shutter Snap Overlay (When live camera stream is active) */}
          {isCameraActive && (
            <div style={{ position: "absolute", bottom: 8, display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={capturePhoto}
                style={{
                  background: "var(--accent)",
                  border: "none",
                  color: "var(--graphite)",
                  borderRadius: 20,
                  padding: "7px 16px",
                  fontSize: 12,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(212,255,40,0.5)"
                }}
              >
                <Camera size={14} strokeWidth={2.5} />
                <span>{language === "mr" ? "फोटो काढा (SNAP)" : language === "hi" ? "फोटो लें (SNAP)" : "SNAP PHOTO"}</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  background: "rgba(0,0,0,0.65)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#FFF",
                  borderRadius: 20,
                  padding: "7px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span>{language === "mr" ? "बंद करा" : language === "hi" ? "बंद करें" : "Cancel"}</span>
              </button>
            </div>
          )}

          {/* Top-Right Quick Utility Controls (Retake / Upload) */}
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
            {hasUserCapturedPhoto && (
              <button
                type="button"
                onClick={() => { setHasUserCapturedPhoto(false); startLiveCamera(); }}
                style={{
                  background: "rgba(0,0,0,0.7)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#FFF",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer"
                }}
              >
                <Camera size={11} />
                <span>{language === "mr" ? "पुन्हा काढा" : language === "hi" ? "दोबारा लें" : "Retake"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "rgba(0,0,0,0.65)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#FFF",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer"
              }}
            >
              <Upload size={11} />
              <span>Photo</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Camera Error Banner */}
        {cameraError && (
          <div style={{ marginBottom: 10, fontSize: 11, color: "#854E00", background: "#FFF9EC", border: "1px solid #F8DA9F", padding: "6px 8px", borderRadius: 6 }}>
            {cameraError}
          </div>
        )}

        {/* 2. Detected Material Header (With 1-Tap Change Override) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div className="text-sub-label" style={{ fontSize: 10 }}>
              {language === "mr" ? "ओळखलेला ई-कचरा" : language === "hi" ? "पहचाना गया ई-कचरा" : "IDENTIFIED MATERIAL"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "var(--graphite)" }}>
              {localizedMatName}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsChangingMaterial(!isChangingMaterial)}
            className="btn-secondary"
            style={{ padding: "4px 8px", fontSize: 11 }}
          >
            <Edit3 size={11} />
            <span>{isChangingMaterial ? "Done" : (language === "mr" ? "बदला" : language === "hi" ? "बदलें" : "Change")}</span>
          </button>
        </div>

        {/* Quick Material Chooser if user taps Change */}
        {isChangingMaterial && (
          <div style={{ marginBottom: 12, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {MATERIAL_TAXONOMY.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMaterial(m)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  border: selectedMaterial.id === m.id ? "2px solid var(--graphite)" : "1px solid var(--border)",
                  background: selectedMaterial.id === m.id ? "var(--graphite)" : "var(--canvas)",
                  color: selectedMaterial.id === m.id ? "var(--surface)" : "var(--graphite)"
                }}
              >
                {t("materials." + m.id, { defaultValue: m.name }).split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {/* 3. Physical Condition: [ Working ] [ Used ] [ Damaged ] */}
        <div style={{ marginBottom: 12 }}>
          <div className="text-sub-label" style={{ fontSize: 10, marginBottom: 4 }}>
            {language === "mr" ? "स्थिती" : language === "hi" ? "स्थिति" : "CONDITION"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { id: "WORKING", labelMr: "चालू", labelHi: "काम कर रहा", labelEn: "Working" },
              { id: "USED", labelMr: "वापरलेला", labelHi: "प्रयुक्त", labelEn: "Used" },
              { id: "DAMAGED", labelMr: "खराब", labelHi: "टूटा हुआ", labelEn: "Damaged" }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCondition(c.id)}
                style={{
                  padding: "7px 4px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  textAlign: "center",
                  cursor: "pointer",
                  border: condition === c.id ? "2px solid var(--graphite)" : "1px solid var(--border)",
                  background: condition === c.id ? "var(--graphite)" : "var(--canvas)",
                  color: condition === c.id ? "#FFF" : "var(--graphite)",
                  transition: "all 0.15s ease"
                }}
              >
                {language === "mr" ? c.labelMr : language === "hi" ? c.labelHi : c.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Weight: Single Clean Primary Interaction: [ − 5.0 kg + ] */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div className="text-sub-label" style={{ fontSize: 10 }}>
              {language === "mr" ? "अंदाजे वजन" : language === "hi" ? "अनुमानित वजन" : "WEIGHT"}
            </div>
            {/* Explicit Micro-Voice CTA */}
            <button
              type="button"
              onClick={handleVoiceWeight}
              style={{
                background: isVoiceListening ? "var(--accent)" : "transparent",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 700,
                color: isVoiceListening ? "var(--graphite)" : "var(--muted)",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: 6
              }}
            >
              <Mic size={12} color={isVoiceListening ? "var(--graphite)" : "var(--accent-dark)"} />
              <span>{isVoiceListening ? "Listening..." : (language === "mr" ? "बोलून सांगा" : language === "hi" ? "बोलकर भी भरें" : "Speak weight")}</span>
            </button>
          </div>

          {/* Stepper Display */}
          <div
            className={voiceMutated ? "voice-value-flash" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--canvas)",
              borderRadius: 10,
              border: voiceMutated ? "2px solid #D4FF28" : "1px solid var(--border)",
              boxShadow: voiceMutated ? "0 0 12px rgba(212, 255, 40, 0.4)" : "none",
              padding: "6px 8px",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease"
            }}
          >
            <button
              type="button"
              onClick={() => handleUpdateWeight(weightKg - 0.5)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--graphite)"
              }}
              aria-label="Decrease weight"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 900, color: "var(--graphite)" }}>
                {weightKg}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginLeft: 4 }}>
                {t("app.kg", { defaultValue: "kg" })}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleUpdateWeight(weightKg + 0.5)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--graphite)"
              }}
              aria-label="Increase weight"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Quick Tactile Weight Chips */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
            {[1, 5, 10, 15].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleUpdateWeight(w)}
                style={{
                  padding: "5px 4px",
                  borderRadius: 6,
                  border: weightKg === w ? "2px solid var(--graphite)" : "1px solid var(--border)",
                  background: weightKg === w ? "var(--graphite)" : "var(--surface)",
                  color: weightKg === w ? "#FFF" : "var(--graphite)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                {w} kg
              </button>
            ))}
          </div>
        </div>

        {/* 5. Estimated Value & Buyer Count */}
        <div
          style={{
            background: "#F8F9FA",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12
          }}
        >
          <div>
            <div className="text-sub-label" style={{ fontSize: 10 }}>
              {language === "mr" ? "अंदाजित मोबदला" : language === "hi" ? "अनुमानित भुगतान" : "ESTIMATED VALUE"}
            </div>
            <div
              className={valuePulse ? "value-flash-pulse" : ""}
              style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 900, color: "var(--graphite)" }}
            >
              ₹{targetValue.toLocaleString("en-IN")}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1B7943" }}>
              ● {language === "mr" ? "३ खरेदीदार सज्ज" : language === "hi" ? "3 खरीदार तैयार" : "3 verified buyers"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              ₹{selectedMaterial.baseBenchmarkRatePerKg}/{t("app.kg", { defaultValue: "kg" })} CPCB ref
            </div>
          </div>
        </div>

        {/* Primary CTA: Mandatory Photo Shutter vs Continue to Buyers */}
        {!hasUserCapturedPhoto ? (
          <button
            type="button"
            className="btn-graphite-action"
            onClick={isCameraActive ? capturePhoto : startLiveCamera}
            id="btn-scanner-photo-action"
            style={{
              padding: "14px 16px",
              fontSize: 14,
              fontWeight: 900,
              borderRadius: 10,
              background: "var(--accent)",
              color: "var(--graphite)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 0 16px rgba(212,255,40,0.35)",
              cursor: "pointer"
            }}
          >
            <Camera size={18} strokeWidth={2.4} />
            <span>
              {isCameraActive
                ? (language === "mr" ? "फोटो काढा (SNAP PHOTO)" : language === "hi" ? "फोटो लें (SNAP PHOTO)" : "SNAP PHOTO")
                : (language === "mr" ? "स्क्रॅपचा फोटो काढा (TAKE PHOTO)" : language === "hi" ? "स्क्रैप की फोटो लें (TAKE PHOTO)" : "TAKE SCRAP PHOTO")}
            </span>
          </button>
        ) : (
          <button
            className="btn-graphite-action"
            onClick={handleProceed}
            id="btn-scanner-continue"
            style={{ padding: "13px 16px", fontSize: 14, fontWeight: 900, borderRadius: 10 }}
          >
            <span>{language === "mr" ? "खरेदीदार शोधा (CONTINUE) →" : language === "hi" ? "खरीदार खोजें (CONTINUE) →" : "CONTINUE TO BUYERS →"}</span>
            <ArrowRight size={17} />
          </button>
        )}

        {/* 6. Progressive Disclosure: View Estimate Details Toggle */}
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <span>
              {showDetails
                ? (language === "mr" ? "तपशील लपवा" : language === "hi" ? "विवरण छिपाएं" : "Hide details")
                : (language === "mr" ? "अधिक तपशील पाहा" : language === "hi" ? "अनुमान विवरण देखें" : "View estimate details")}
            </span>
            <ChevronDown
              size={13}
              style={{
                transform: showDetails ? "rotate(180deg)" : "none",
                transition: "transform 0.2s ease"
              }}
            />
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  overflow: "hidden",
                  textAlign: "left",
                  background: "var(--canvas)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 6,
                  fontSize: 11
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: "var(--muted)" }}>Price Range:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    ₹{selectedMaterial.rateRange?.min || 190} – ₹{selectedMaterial.rateRange?.max || 240}/{t("app.kg", { defaultValue: "kg" })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: "var(--muted)" }}>Reference Rate:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    ₹{selectedMaterial.baseBenchmarkRatePerKg}/{t("app.kg", { defaultValue: "kg" })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: "var(--muted)" }}>Confidence:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#1B7943" }}>
                    95.4% Match
                  </span>
                </div>

                {selectedMaterial.hazardLevel && selectedMaterial.hazardLevel !== "LOW" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 4, marginTop: 4 }}>
                    <span style={{ color: "#D9381E", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <ShieldAlert size={12} color="#D9381E" />
                      <span>{selectedMaterial.hazardLevel} Safety Gate</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSafetyModal(true)}
                      style={{ background: "transparent", border: "none", color: "var(--graphite)", textDecoration: "underline", fontSize: 10, cursor: "pointer", fontWeight: 700 }}
                    >
                      Protocol
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Safety Protocol Modal */}
      {showSafetyModal && (
        <SafetyModal
          material={selectedMaterial}
          onAcknowledge={() => setShowSafetyModal(false)}
          onCancel={() => setShowSafetyModal(false)}
        />
      )}
    </div>
  );
}
