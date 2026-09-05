import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { useMarketplace } from "../../context/MarketplaceContext";
import { MATERIAL_TAXONOMY } from "../../data/materialTaxonomy";
import { emitInputAck, feedbackDispatcher } from "../../services/feedbackDispatcher";
import { useCollectorAgentBridge } from "../../context/CollectorAgentBridgeContext";
import {
  ArrowRight,
  Smartphone,
  Laptop,
  Cpu,
  BatteryCharging,
  Cable,
  Tv,
  Camera,
  Package,
  Sparkles,
  TrendingUp,
  PhoneCall,
  ChevronRight,
  Mic,
  MicOff,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Check,
  Star,
  Search,
  Zap,
  CheckCircle2,
  TrendingDown,
  Scale,
  FileText,
  RotateCw
} from "lucide-react";
import PriceBoardModal from "./PriceBoardModal";
import FieldResearchModal from "./FieldResearchModal";

// Icon mapping helper
const ICON_MAP = {
  smartphones: <Smartphone size={18} />,
  laptops: <Laptop size={18} />,
  pcb: <Cpu size={18} />,
  pcb_mixed: <Cpu size={18} />,
  batteries: <BatteryCharging size={18} />,
  lithium_batteries: <BatteryCharging size={18} />,
  cables: <Cable size={18} />,
  cables_copper: <Cable size={18} />,
  motors_magnets: <RotateCw size={18} />,
  crt: <Tv size={18} />,
  crt_monitors: <Tv size={18} />,
  abs_plastic: <Package size={18} />
};

export default function CollectorHome({ onStartSell, onViewLot, onViewLotsList, onOpenVoiceModal }) {
  const { t, collector, lots, buyRequests, language, speakPrompt } = useMarketplace();
  const bridge = useCollectorAgentBridge();
  const [heroActiveFlash, setHeroActiveFlash] = useState(false);
  const heroHoldTimerRef = useRef(null);
  const heroDidHoldRef = useRef(false);
  const heroPointerIdRef = useRef(null);
  const [showPriceBoard, setShowPriceBoard] = useState(false);
  const [showFieldResearch, setShowFieldResearch] = useState(false);

  const isContinuousListening = bridge?.isContinuousListening || false;
  const voicePhase = bridge?.voiceUI?.phase || "IDLE";

  const isVoiceError = voicePhase === "ERROR";
  const isVoiceActive =
    (heroActiveFlash ||
     voicePhase === "LISTENING" ||
     voicePhase === "PAUSED_WAITING" ||
     voicePhase === "UNDERSTANDING" ||
     voicePhase === "ACTION") && !isVoiceError;

  const handleVoiceHeroClick = () => {
    emitInputAck("TOUCH", "hero_voice_button");
    feedbackDispatcher.playTone(850, 0.05, "sine", 0.06);
    feedbackDispatcher.triggerHaptic(25);
    setHeroActiveFlash(true);
    setTimeout(() => setHeroActiveFlash(false), 2600);

    if (bridge?.onTriggerVoice) {
      bridge.onTriggerVoice();
    } else if (onOpenVoiceModal) {
      onOpenVoiceModal();
    } else {
      const prompt = language === "mr"
        ? "आता बोला. तुमच्याकडे कोणता ई-कचरा आहे?"
        : language === "hi"
        ? "अब बोलिए। आपके पास कौन सा ई-कचरा है?"
        : "Speak now. What e-waste do you have?";
      speakPrompt(prompt);
    }
  };

  const handleHeroPointerDown = (e) => {
    e.stopPropagation();
    if (e.button !== undefined && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      heroPointerIdRef.current = e.pointerId;
    } catch (_) {}
    heroDidHoldRef.current = false;
    heroHoldTimerRef.current = setTimeout(() => {
      heroDidHoldRef.current = true;
      feedbackDispatcher.triggerHaptic(20);
      if (bridge?.onHoldStart) {
        bridge.onHoldStart();
      } else if (bridge?.onTriggerVoice) {
        bridge.onTriggerVoice();
      }
    }, 140);
  };

  const handleHeroPointerUp = (e) => {
    e.stopPropagation();
    clearTimeout(heroHoldTimerRef.current);
    if (heroPointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(heroPointerIdRef.current);
      } catch (_) {}
      heroPointerIdRef.current = null;
    }
    if (!heroDidHoldRef.current) {
      handleVoiceHeroClick();
    } else {
      if (bridge?.onHoldEnd) {
        bridge.onHoldEnd();
      }
    }
    heroDidHoldRef.current = false;
  };

  const handleHeroPointerCancel = (e) => {
    e.stopPropagation();
    clearTimeout(heroHoldTimerRef.current);
    if (heroPointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(heroPointerIdRef.current);
      } catch (_) {}
      heroPointerIdRef.current = null;
    }
    if (heroDidHoldRef.current && bridge?.onHoldEnd) {
      bridge.onHoldEnd();
    }
    heroDidHoldRef.current = false;
  };

  const handleSampleQueryClick = (e) => {
    e.stopPropagation();
    emitInputAck("TOUCH", "sample_query_chip");
    feedbackDispatcher.playTone(920, 0.04, "triangle", 0.05);
    feedbackDispatcher.triggerHaptic(20);
    setHeroActiveFlash(true);
    setTimeout(() => setHeroActiveFlash(false), 1600);

    const query =
      language === "mr"
        ? "१० किलो जुने लॅपटॉप आहेत"
        : language === "hi"
        ? "मेरे पास 10 किलो पुराने लैपटॉप हैं"
        : "I have 10 kg old laptops";

    if (bridge?.handleProcessUtterance) {
      bridge.handleProcessUtterance(query);
    } else if (onStartSell) {
      onStartSell("laptops");
    }
  };

  const handleQuickVoicePrompt = (promptText, categoryId, weight) => {
    emitInputAck("TOUCH", "quick_voice_chip", { categoryId, weight });
    feedbackDispatcher.playTone(880, 0.03, "sine", 0.04);
    feedbackDispatcher.triggerHaptic(18);

    let query = "";
    if (language === "mr") {
      if (categoryId === "laptops") query = `${weight} किलो जुने लॅपटॉप विकायचे आहेत`;
      else if (categoryId === "lithium_batteries") query = `${weight} किलो लिथियम बॅटरी विकायची आहे`;
      else if (categoryId === "smartphones") query = `${weight} किलो जुने मोबाईल विकायचे आहेत`;
      else if (categoryId === "pcb_mixed") query = "मदरबोर्डचा काय दर आहे?";
      else query = `${weight} किलो ई-कचरा विकायचा आहे`;
    } else if (language === "hi") {
      if (categoryId === "laptops") query = `${weight} किलो पुराने लैपटॉप बेचना है`;
      else if (categoryId === "lithium_batteries") query = `${weight} किलो लिथियम बैटरी बेचना है`;
      else if (categoryId === "smartphones") query = `${weight} किलो पुराने मोबाइल बेचना है`;
      else if (categoryId === "pcb_mixed") query = "मदरबोर्ड का क्या भाव है?";
      else query = `${weight} किलो ई-कचरा बेचना है`;
    } else {
      if (categoryId === "laptops") query = `I have ${weight} kg old laptops to sell`;
      else if (categoryId === "lithium_batteries") query = `I have ${weight} kg lithium batteries to sell`;
      else if (categoryId === "smartphones") query = `I have ${weight} kg old phones to sell`;
      else if (categoryId === "pcb_mixed") query = "What is the price for computer motherboards?";
      else query = `I have ${weight} kg e-waste to sell`;
    }

    if (bridge?.handleProcessUtterance) {
      bridge.handleProcessUtterance(query);
    } else if (onStartSell) {
      onStartSell(categoryId, weight);
    }
  };

  const pendingDues = (lots || [])
    .filter((l) => l.status !== "SETTLED" && l.status !== "CLOSED" && l.paymentStatus !== "CASH_SETTLED" && l.paymentStatus !== "PAID")
    .reduce((sum, l) => sum + (l.finalNetPayout || l.netPayout || l.estimatedValue || 0), 0);

  return (
    <div className="collector-viewport" style={{ paddingBottom: 24 }}>
      {/* 1. Precision Fintech Earnings Card */}
      <div
        className="instrument-card"
        style={{
          padding: "16px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
        }}
      >
        {/* Top Row: Greeting & Trend Pill */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
            {t("home.greeting", { defaultValue: "Good morning" })}, <strong style={{ color: "var(--graphite)" }}>{collector.name.split(" ")[0]}</strong>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#1B7943",
              background: "#E8F5E9",
              padding: "3px 8px",
              borderRadius: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap"
            }}
          >
            <TrendingUp size={12} strokeWidth={2.5} />
            <span>+12% this mo</span>
          </span>
        </div>

        {/* Hero Balance: Total Settled & Pending Dues Widget */}
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {language === "mr" ? "एकूण रोख जमा (Settled)" : language === "hi" ? "कुल नकद प्राप्त (Settled)" : "THIS MONTH'S SETTLED"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 900, color: "var(--graphite)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              ₹{collector.monthlyEarningsInr.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Pending Dues Display (Mandatory PS Requirement) */}
          <div
            onClick={onViewLotsList}
            title={language === "mr" ? "थकीत रक्कम पहा" : language === "hi" ? "बाकी विवरण देखें" : "View Pending Dues"}
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 10,
              padding: "6px 12px",
              cursor: "pointer",
              textAlign: "right",
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 800, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {language === "mr" ? "थकीत येणे (Dues)" : language === "hi" ? "बाकी रोकड़ (Dues)" : "PENDING DUES"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 900, color: "#B45309", marginTop: 2 }}>
              ₹{pendingDues.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Bottom Structured 2-Tile Stat Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
          {/* Tile 1: Lots Completed */}
          <div
            style={{
              background: "var(--canvas)",
              borderRadius: 10,
              padding: "8px 10px",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#EBF3FE",
                color: "#1A4480",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Package size={16} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 900, color: "var(--graphite)", lineHeight: 1.2 }}>
                {collector.totalLotsCompleted}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {t("home.lotsRouted", { defaultValue: "Lots Sold" })}
              </div>
            </div>
          </div>

          {/* Tile 2: Diverted Scrap */}
          <div
            style={{
              background: "var(--canvas)",
              borderRadius: 10,
              padding: "8px 10px",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#E8F5E9",
                color: "#1B7943",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 900, color: "var(--graphite)", lineHeight: 1.2 }}>
                {collector.monthlyWeightKg} kg
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {t("home.kgDiverted", { defaultValue: "Recycled" })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Central Hero Interaction: TALK TO SELL (The Differentiator) */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "var(--graphite)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{t("home.whatToSell", { defaultValue: "What to sell today?" })}</span>
        </div>

        <motion.div
          className="voice-hero-card interactive-tap"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVoiceHeroClick}
          id="btn-hero-voice-assistant"
          style={{
            background: "#12151A",
            borderRadius: 16,
            padding: "20px 18px",
            minHeight: 116,
            color: "#FFF",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            border: isVoiceError ? "1.5px solid #FF4D4F" : isVoiceActive ? "1.5px solid rgba(212, 255, 40, 0.5)" : "1px solid #282E38",
            transition: "border 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ minWidth: 0, flex: 1, paddingRight: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {t("home.voiceHeroTitle", { defaultValue: "TALK TO SELL" })}
                </span>
                <span
                  onClick={handleSampleQueryClick}
                  title="Tap to test this query"
                  style={{
                    fontSize: 10,
                    color: "#12151A",
                    background: "var(--accent)",
                    fontWeight: 900,
                    borderRadius: 5,
                    padding: "3px 8px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={11} />
                  <span>{language === "mr" ? "चाचणी" : language === "hi" ? "टेस्ट" : "Test"}</span>
                </span>
              </div>
              <div
                onClick={handleSampleQueryClick}
                title="Tap to test this query"
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  marginTop: 3,
                  marginBottom: 3,
                  color: "#FFF",
                  cursor: "pointer",
                  lineHeight: 1.35,
                  wordBreak: "break-word"
                }}
              >
                {t("home.voiceHeroSample", { defaultValue: "\"I have 10 kg old laptops\"" })}
              </div>
              <div style={{ fontSize: 11.5, color: isVoiceError ? "#FF8A8A" : isVoiceActive ? "#D4FF28" : "#A0A6B2", marginTop: 5, lineHeight: 1.35 }}>
                {isVoiceError
                  ? (language === "mr" ? "मायक्रोफोन इनपुट नाही — चाचणी पर्याय निवडा" : language === "hi" ? "माइक इनपुट नहीं मिला — टेस्ट विकल्प चुनें" : "No mic input — tap test chip")
                  : isVoiceActive
                  ? (language === "mr" ? "व्हॉइस सक्रिय — खाली दिलेल्या बारमध्ये बोला" : language === "hi" ? "वॉइस सक्रिय — नीचे दिए बार में बोलें" : "Voice active — speak into bottom bar")
                  : t("home.voiceHeroSub", { defaultValue: "Tap mic and speak naturally in your language" })}
              </div>
            </div>

            {/* Mic Orb */}
            <div
              onPointerDown={handleHeroPointerDown}
              onPointerUp={handleHeroPointerUp}
              onPointerCancel={handleHeroPointerCancel}
              onClick={(e) => { e.stopPropagation(); }}
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: isVoiceError ? "#FF4D4F" : "var(--accent)",
                color: isVoiceError ? "#FFF" : "var(--graphite)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: isVoiceActive ? "0 0 16px rgba(212, 255, 40, 0.5)" : "0 2px 8px rgba(0, 0, 0, 0.3)",
                transition: "all 0.2s ease",
                touchAction: "none",
                userSelect: "none",
                cursor: "pointer"
              }}
            >
              {isVoiceError ? <MicOff size={25} strokeWidth={2.4} /> : <Mic size={25} strokeWidth={2.4} />}
            </div>
          </div>
        </motion.div>

        {/* Quick Voice Prompt Chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 2px", scrollbarWidth: "none" }}>
          {[
            { label: language === "mr" ? "\"१० किलो लॅपटॉप\"" : language === "hi" ? "\"10 किलो लैपटॉप\"" : "\"10 kg Laptop\"", id: "laptops", w: 10 },
            { label: language === "mr" ? "\"बॅटरी विकायची\"" : language === "hi" ? "\"बैटरी बेचना है\"" : "\"Sell Batteries\"", id: "lithium_batteries", w: 15 },
            { label: language === "mr" ? "\"मोबाईल स्क्रॅप\"" : language === "hi" ? "\"मोबाइल स्क्रैप\"" : "\"Old Mobiles\"", id: "smartphones", w: 5 },
            { label: language === "mr" ? "\"मदरबोर्ड भाव?\"" : language === "hi" ? "\"मदरबोर्ड भाव?\"" : "\"PCB Rates\"", id: "pcb_mixed", w: 20 }
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickVoicePrompt(chip.label, chip.id, chip.w)}
              style={{
                background: "var(--canvas)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--graphite)",
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <MessageSquare size={12} color="var(--graphite)" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Intent Dual Choice: OR SELECT ON SCREEN */}
      <div style={{ marginTop: 12 }}>
        <div className="text-sub-label" style={{ marginBottom: 8, paddingLeft: 2 }}>
          {t("home.orSelectOnScreen", { defaultValue: "Or choose on screen" })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => {
              emitInputAck("TOUCH", "photo_scan_button");
              onStartSell(null);
            }}
            id="btn-home-photo-scan"
            style={{
              padding: "14px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              textAlign: "center"
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={20} color="var(--graphite)" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--graphite)" }}>
              {t("home.photoSell", { defaultValue: "Sell via Photo Scan" })}
            </span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              emitInputAck("TOUCH", "home_my_lots_btn");
              if (onViewLotsList) {
                onViewLotsList();
              } else if (onViewLot) {
                onViewLot(null);
              }
            }}
            id="btn-home-my-lots"
            style={{
              padding: "14px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              textAlign: "center"
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={20} color="var(--graphite)" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--graphite)" }}>
              {t("home.myLots", { defaultValue: "My Lots & Receipts" })}
            </span>
          </button>
        </div>

        {/* Quick Scrap Visual Pills */}
        <div className="quick-sell-row" style={{ marginTop: 10 }}>
          {MATERIAL_TAXONOMY.slice(0, 4).map((item) => {
            const localizedName = t("materials." + item.id, { defaultValue: item.name });
            return (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => {
                  emitInputAck("TOUCH", "category_pill", { materialId: item.id });
                  onStartSell(item.id);
                }}
              >
                {ICON_MAP[item.id] || <Cpu size={16} />}
                <span>{localizedName.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Bhav Board & Research Hub Direct Triggers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => {
              emitInputAck("TOUCH", "home_open_price_board");
              setShowPriceBoard(true);
            }}
            id="btn-home-open-price-board"
            style={{
              padding: "9px 10px",
              background: "var(--canvas)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 800,
              color: "var(--graphite)",
              cursor: "pointer"
            }}
          >
            <Scale size={14} color="#1B7943" />
            <span>{language === "mr" ? "आजचा भाव (Bhav)" : language === "hi" ? "आज का भाव (Bhav)" : "Daily Price Board"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              emitInputAck("TOUCH", "home_open_field_research");
              setShowFieldResearch(true);
            }}
            id="btn-home-open-research"
            style={{
              padding: "9px 10px",
              background: "var(--canvas)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 800,
              color: "var(--graphite)",
              cursor: "pointer"
            }}
          >
            <FileText size={14} color="var(--graphite)" />
            <span>{language === "mr" ? "संशोधन व नफा (+४०%)" : language === "hi" ? "शोध व मुनाफा (+४०%)" : "Field Research"}</span>
          </button>
        </div>
      </div>

      {/* 4. Active Buyer Demand Board (Two-Sided Marketplace Advantage) */}
      <div className="instrument-card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={16} color="var(--graphite)" />
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--graphite)" }}>
              {t("home.activeBuyerDemand", { defaultValue: "Active Buyer Demand Nearby" })}
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1B7943", background: "#E6F4EA", padding: "2px 6px", borderRadius: 4 }}>
            {t("app.nearbyBuyersCount", { defaultValue: "● 3 verified buyers nearby" })}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {buyRequests.slice(0, 3).map((req) => {
            const mat = MATERIAL_TAXONOMY.find((m) => m.id === req.materialId);
            const localizedName = t("materials." + req.materialId, { defaultValue: req.materialName });

            return (
              <div
                key={req.id}
                onClick={() => onStartSell(req.materialId, req.targetQuantityKg)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--canvas)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={{ color: "var(--graphite)", flexShrink: 0 }}>
                    {ICON_MAP[req.materialId] || <Package size={16} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--graphite)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {localizedName.split("&")[0].trim()}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t("home.buyersCount", { count: req.activeMatchesCount || 3, defaultValue: `${req.activeMatchesCount || 3} buyers` })} • {req.location.split(",")[0]}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 900, color: "#1B7943", whiteSpace: "nowrap" }}>
                    {t("home.upToRate", { rate: req.targetPricePerKg, defaultValue: `up to ₹${req.targetPricePerKg}/kg` })}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {language === "mr" ? "तात्काळ पिकअप" : language === "hi" ? "तत्काल पिकअप" : "Instant Pickup"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Activity & Settlement History */}
      <div className="instrument-card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className="text-sub-label">{t("home.yourActivity", { defaultValue: "Recent Activity" })}</span>
          <button
            type="button"
            onClick={() => {
              emitInputAck("TOUCH", "home_view_all_lots_link");
              if (onViewLotsList) {
                onViewLotsList();
              } else if (onViewLot) {
                onViewLot(null);
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 11,
              fontWeight: 800,
              color: "var(--graphite)",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline"
            }}
            id="link-home-view-all-lots"
          >
            {language === "mr" ? "सर्व पाहा →" : language === "hi" ? "सभी देखें →" : "View All →"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lots.length === 0 ? (
            <div
              style={{
                padding: "20px 14px",
                textAlign: "center",
                background: "var(--canvas)",
                border: "1px dashed var(--border)",
                borderRadius: 12
              }}
            >
              <Package size={26} color="var(--muted)" style={{ margin: "0 auto 8px", display: "block" }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--graphite)" }}>
                {language === "mr" ? "अद्याप कोणतेही व्यवहार नाहीत (0 Lots)" : language === "hi" ? "अभी कोई लेन-देन नहीं है (0 Lots)" : "No lots created yet (0 Lots)"}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                {language === "mr" ? "माइक दाबून बोला किंवा वरून स्क्रॅप निवडा." : language === "hi" ? "माइक दबाकर बोलें या ऊपर से स्क्रैप चुनें।" : "Hold mic to speak or select a category above to create your first lot."}
              </div>
            </div>
          ) : (
            lots.slice(0, 2).map((lot) => {
              const localizedMat = t("materials." + lot.materialId, { defaultValue: lot.materialName });
              return (
                <div
                  key={lot.lotId}
                  onClick={() => onViewLot(lot)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "var(--canvas)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    cursor: "pointer"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
                        #{lot.lotId}
                      </span>
                      <span className="status-pill settled" style={{ fontSize: 10, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {lot.status === "SETTLED" ? (
                          <>
                            <Check size={11} strokeWidth={3} />
                            <span>{t("home.cashReceived", { defaultValue: "Cash Settled" })}</span>
                          </>
                        ) : (
                          <span>{t("home.bidding", { defaultValue: "Bidding" })}</span>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {localizedMat.split("&")[0].trim()} • {lot.reportedWeightKg} {t("app.kg", { defaultValue: "kg" })}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, color: "var(--graphite)" }}>
                        ₹{lot.netPayout?.toLocaleString("en-IN") || lot.grossBid}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700 }}>
                        {t("app.cashInHandShort", { defaultValue: "NET IN HAND" })}
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--muted)" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Human Fallback Bar: "Need Help?" */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 12px",
          background: "var(--canvas)",
          borderRadius: 10,
          border: "1px dashed var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
          <HelpCircle size={13} />
          <span>{t("home.humanHelp", { defaultValue: "Need help?" })}</span>
        </span>
        <div style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: 700 }}>
          <button
            onClick={handleVoiceHeroClick}
            style={{ background: "transparent", border: "none", color: "var(--graphite)", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}
          >
            <Mic size={12} />
            <span>{t("home.helpVoice", { defaultValue: "Speak" })}</span>
          </button>
          <span>•</span>
          <button
            onClick={() => onStartSell(null)}
            style={{ background: "transparent", border: "none", color: "var(--graphite)", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}
          >
            <Camera size={12} />
            <span>{t("home.helpPhoto", { defaultValue: "Photo" })}</span>
          </button>
          <span>•</span>
          <a
            href="tel:1800-EWASTE"
            style={{ color: "#1B7943", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}
          >
            <PhoneCall size={12} />
            <span>1800-EWASTE</span>
          </a>
        </div>
      </div>

      {/* Daily Price Bhav Board Modal */}
      <PriceBoardModal
        isOpen={showPriceBoard}
        onClose={() => setShowPriceBoard(false)}
        onSelectMaterial={(matId) => {
          setShowPriceBoard(false);
          onStartSell(matId);
        }}
      />

      {/* Field Research & Unit Economics Dossier Modal */}
      <FieldResearchModal
        isOpen={showFieldResearch}
        onClose={() => setShowFieldResearch(false)}
      />
    </div>
  );
}
