import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useMarketplace } from "../../context/MarketplaceContext";
import {
  AlertTriangle,
  ShieldCheck,
  Zap,
  Check,
  Volume2,
  Flame,
  Hand,
  Eye,
  ShieldAlert,
  Ban,
  Sparkles
} from "lucide-react";
import { emitInputAck } from "../../services/feedbackDispatcher";

export default function SafetyModal({ material, onAcknowledge, onCancel }) {
  const { t, language, speakPrompt } = useMarketplace();
  const [isPlayingSafetyAudio, setIsPlayingSafetyAudio] = useState(false);

  if (!material || material.hazardLevel === "LOW") return null;

  const target = typeof document !== "undefined" ? document.getElementById("phone-screen-portal") : null;

  const localizedMatName = t("materials." + material.id, { defaultValue: material.name });

  // Vernacular localized safety warnings for high risk categories
  const getLocalizedWarning = () => {
    if (language === "mr") {
      if (material.id === "batteries" || material.id === "lithium_batteries") {
        return "लिथियम-आयन बॅटरी फुटू नये किंवा शॉर्ट सर्किट होऊ नये म्हणून काळजी घ्या. उष्णतेपासून दूर ठेवा आणि थेट हाताने तुटलेली बॅटरी पकडू नका.";
      }
      if (material.id === "crt" || material.id === "crt_monitors") {
        return "सीआरटी काचेमध्ये शिसे (Lead) असते. ट्यूब फुटल्यास काच उडू शकते. हातमोजे वापरा आणि स्क्रीन फुटू देऊ नका.";
      }
      if (material.id === "pcb" || material.id === "pcb_mixed") {
        return "मदरबोर्ड किंवा पीसीबीवर कधीही तेजाब (Acid) टाकू नका आणि जाळू नका. हे फेफड्यांसाठी अतिशय विषारी असते.";
      }
      return `${localizedMatName} हाताळताना सुरक्षित राहा. CPCB नियमांनुसार योग्य प्रकारे पॅक करा.`;
    }
    if (language === "hi") {
      if (material.id === "batteries" || material.id === "lithium_batteries") {
        return "लिथियम-आयन बैटरी में शॉर्ट सर्किट या दबाव से आग लगने का खतरा होता है। इसे नुकीली चीजों से दूर रखें और दस्ताने पहनें।";
      }
      if (material.id === "crt" || material.id === "crt_monitors") {
        return "सीआरटी कांच में जहरीला सीसा (Lead) होता है। ट्यूब फूटने से बचें और सुरक्षा चश्मा व दस्ताने पहनें।";
      }
      if (material.id === "pcb" || material.id === "pcb_mixed") {
        return "सर्किट बोर्ड पर तेजाब न डालें और न ही इसे खुली आग में जलाएं। यह सांस के लिए अत्यंत विषैला है।";
      }
      return `${localizedMatName} संभालते समय सावधानी बरतें। CPCB सुरक्षा नियमों का पालन करें।`;
    }
    return material.safetyWarning || "Handle with certified protective gloves and avoid physical damage.";
  };

  const handlePlaySafetyAudio = () => {
    emitInputAck("TOUCH", "play_safety_audio");
    setIsPlayingSafetyAudio(true);
    const speech = getLocalizedWarning();
    speakPrompt(speech);
    setTimeout(() => setIsPlayingSafetyAudio(false), 7000);
  };

  const content = (
    <div
      className={target ? "phone-settings-sheet" : "modal-overlay"}
      style={target ? { zIndex: 95 } : undefined}
      onClick={onCancel || onAcknowledge}
    >
      <div
        className={target ? "phone-settings-card" : "modal-card"}
        style={target ? { maxHeight: "88%", overflowY: "auto" } : { maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--danger)" }}>
            <AlertTriangle size={24} strokeWidth={2.5} />
            <div>
              <div className="text-sub-label" style={{ fontSize: 9.5, color: "var(--danger)" }}>
                CPCB PROTOCOL COMPLIANCE
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: "var(--graphite)" }}>
                {t("safety.title", { defaultValue: "Mandatory Handling & Safety Warning" })}
              </h3>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div style={{ background: "var(--danger-bg)", border: "1px solid #F5C6CB", padding: 14, borderRadius: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#721C24", marginBottom: 4 }}>
            {localizedMatName} ({material.shortCode || "CPCB-REG"}) • Hazard: {material.hazardLevel}
          </div>
          <p style={{ fontSize: 12.5, color: "#721C24", lineHeight: 1.45, margin: 0 }}>
            {getLocalizedWarning()}
          </p>
        </div>

        {/* Audio Readout Pill */}
        <button
          type="button"
          onClick={handlePlaySafetyAudio}
          style={{
            width: "100%",
            marginBottom: 14,
            padding: "8px 12px",
            background: isPlayingSafetyAudio ? "#1B7943" : "var(--canvas)",
            color: isPlayingSafetyAudio ? "#FFFFFF" : "var(--graphite)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800 }}>
            <Volume2 size={15} />
            <span>
              {isPlayingSafetyAudio
                ? (language === "mr" ? "सुरक्षा नियम ऐकत आहे..." : language === "hi" ? "नियम सुनाए जा रहे हैं..." : "Playing Guidance...")
                : (language === "mr" ? "सुरक्षा नियम ऐका (ऑडिओ)" : language === "hi" ? "सुरक्षा निर्देश सुनें (ऑडियो)" : "Listen to Safety Audio")}
            </span>
          </div>
          <Sparkles size={13} color={isPlayingSafetyAudio ? "#FFF" : "var(--graphite)"} />
        </button>

        {/* Pictorial Guidance Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "#EDF7EE", border: "1px solid #C8E6C9", borderRadius: 10, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#1E4620", marginBottom: 4 }}>
              <ShieldCheck size={16} color="#2E7D32" />
              <span>{t("safety.dos", { defaultValue: "DO THIS" })}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#1E4620", lineHeight: 1.4 }}>
              <li>{language === "mr" ? "हातमोजे वापरा" : language === "hi" ? "दस्ताने पहनें" : "Wear certified gloves"}</li>
              <li>{language === "mr" ? "कोरड्या जागी ठेवा" : language === "hi" ? "सूखी जगह रखें" : "Keep in dry crate"}</li>
            </ul>
          </div>

          <div style={{ background: "#FDECEA", border: "1px solid #FFCDD2", borderRadius: 10, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#5C1D18", marginBottom: 4 }}>
              <Ban size={16} color="#C62828" />
              <span>{t("safety.donts", { defaultValue: "STRICT DON'TS" })}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#5C1D18", lineHeight: 1.4 }}>
              <li>{language === "mr" ? "उघड्यावर जाळू नका" : language === "hi" ? "खुले में न जलाएं" : "No open burning"}</li>
              <li>{language === "mr" ? "तेजाब वापरू नका" : language === "hi" ? "तेजाब का प्रयोग न करें" : "No acid leaching"}</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-graphite-action"
            style={{ background: "var(--graphite)", color: "var(--surface)", flex: 1 }}
            onClick={onAcknowledge}
          >
            <Check size={18} />
            <span>{t("safety.confirmBtn", { defaultValue: "I Confirm Safe Handling" })}</span>
          </button>
          {onCancel && (
            <button className="btn-secondary" onClick={onCancel}>
              {t("app.cancel", { defaultValue: "Cancel" })}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return target ? createPortal(content, target) : content;
}
