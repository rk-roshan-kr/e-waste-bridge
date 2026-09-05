import React from "react";
import { motion } from "motion/react";
import { useMarketplace } from "../../context/MarketplaceContext";
import MaterialFlow from "../shared/MaterialFlow";
import { CheckCircle2, Check, QrCode, ArrowLeft, ShieldCheck, Download, Truck, ArrowRight, MapPin } from "lucide-react";

import { emitInputAck } from "../../services/feedbackDispatcher";

export default function HandoverReceipt({ lot, onDone, onOpenRecyclerTerminal, onBack }) {
  const { t, networkState, confirmIntakeAndSettle, language, lots } = useMarketplace();
  const activeLot = lot || (lots && lots[0]) || {
    lotId: "EW-2041",
    materialId: "laptops",
    materialName: "Laptops & Notebooks",
    reportedWeightKg: 12.4,
    netPayout: 2450,
    grossBid: 2840,
    logisticsCost: 390,
    selectedBuyerName: "Apex E-Recovery Ltd.",
    lifecycleStage: "MATCHED"
  };

  const localizedMat = t("materials." + activeLot.materialId, { defaultValue: activeLot.materialName || "Scrap" });

  const handleBack = () => {
    emitInputAck("TOUCH", "receipt_back_button");
    if (onBack) {
      onBack();
    } else if (onDone) {
      onDone();
    }
  };

  const handleHome = () => {
    emitInputAck("TOUCH", "receipt_home_shortcut");
    if (onDone) {
      onDone();
    }
  };

  return (
    <div className="collector-viewport">
      {/* Top Navigation Bar: Back to Lots List & Direct Home Shortcut */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <button
          className="btn-secondary"
          onClick={handleBack}
          style={{ padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
          id="btn-receipt-back-lots"
        >
          <ArrowLeft size={16} />
          <span>
            {language === "mr" ? "लॉट्स यादी" : language === "hi" ? "लॉट सूची" : "Lots & Receipts"}
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onDone && (
            <button
              className="btn-secondary"
              onClick={handleHome}
              style={{ padding: "6px 10px", fontSize: 11 }}
              title="Return to Home Dashboard"
              id="btn-receipt-home-shortcut"
            >
              <span>{language === "mr" ? "मुख्य" : language === "hi" ? "होम" : "Home"}</span>
            </button>
          )}
          <span className="text-sub-label" style={{ fontSize: 10 }}>
            {t("receipt.title", { defaultValue: "HANDOVER & SETTLEMENT" })}
          </span>
        </div>
      </div>

      {/* Signature Material Flow Lifecycle */}
      <MaterialFlow currentStage={activeLot.lifecycleStage || "MATCHED"} lotId={activeLot.lotId} />

      {/* Financial Confirmation Card */}
      <motion.div
        className="instrument-card"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ border: "2px solid var(--graphite)", padding: 22 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "var(--graphite)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900
              }}
            >
              <Check size={20} strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--graphite)" }}>
                {t("receipt.settlementVerified", { defaultValue: "TRANSACTION CONFIRMED" })}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Lot #{activeLot.lotId} • {activeLot.selectedBuyerName}
              </div>
            </div>
          </div>

          <span className="brand-badge" style={{ background: "var(--graphite)", color: "var(--accent)" }}>
            {t("receipt.immutableReceipt", { defaultValue: "IMMUTABLE RECEIPT" })}
          </span>
        </div>

        {/* Money in Hand Value Callout */}
        <div style={{ background: "var(--canvas)", padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 14 }}>
          <span className="text-sub-label">{t("app.cashInHand", { defaultValue: t.netPayout })}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <div className="text-hero-amount" style={{ fontSize: 44 }}>
              ₹{activeLot.netPayout?.toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--graphite)", background: "var(--accent)", padding: "2px 8px", borderRadius: 4 }}>
              {t("receipt.cashReceivedStamp", { defaultValue: "CASH SETTLED" })}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            {t("receipt.breakdown", { gross: activeLot.grossBid, logistics: activeLot.logisticsCost, defaultValue: `Gross Bid: ₹${activeLot.grossBid} | Logistics: -₹${activeLot.logisticsCost}` })}
          </div>
        </div>

        {/* Cash Settlement Voucher Guarantee (Mandatory Statutory PS Requirement) */}
        <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 800, fontSize: 12 }}>
              <CheckCircle2 size={16} />
              <span>{language === "mr" ? "हस्ते रोख प्रदान हमी (Default Cash)" : language === "hi" ? "हस्ते नकद भुगतान गारंटी (Default Cash)" : "DEFAULT SETTLEMENT: SPOT CASH IN HAND"}</span>
            </div>
            <span style={{ fontSize: 10, background: "#DCFCE7", color: "#15803D", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>
              CASH AT GATE
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 4, lineHeight: 1.4 }}>
            {language === "mr"
              ? "काट्यावर वजन होताच संकलकाला रोख रक्कम तात्काळ दिली जाईल. डिजिटल पेमेंट (UPI) पूर्णपणे ऐच्छिक आहे."
              : language === "hi"
              ? "धर्मकांटे पर वजन होते ही संग्राहक को तुरंत नकद भुगतान दिया जाएगा। डिजिटल भुगतान (UPI) पूर्णतः वैकल्पिक है।"
              : "Spot cash is released to collector immediately upon physical scale intake. Digital payment (UPI) is strictly optional."}
          </div>
        </div>

        {/* Captured Lot Photo Evidence */}
        {activeLot.photoUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--canvas)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
            <img
              src={activeLot.photoUrl}
              alt={localizedMat}
              style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{localizedMat}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {t("receipt.reportedWeight", { weight: activeLot.reportedWeightKg, condition: activeLot.conditionGrade || "Scrap", defaultValue: `Reported Weight: ${activeLot.reportedWeightKg} kg • Condition: ${activeLot.conditionGrade || "Scrap"}` })}
              </div>
              <div style={{ fontSize: 11, color: "#1B7943", fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={12} strokeWidth={2.5} />
                <span>{t("receipt.evidenceLogged", { defaultValue: "CPCB Field Photo Evidence Logged" })}</span>
              </div>
            </div>
          </div>
        )}

        {/* GPS-Verified Physical Handover Location */}
        <div style={{ background: "var(--canvas)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color="var(--accent)" />
              <span className="text-sub-label" style={{ fontSize: 11, fontWeight: 800 }}>
                {language === "mr" ? "GPS प्रमाणित हस्तांतरण ठिकाण" : language === "hi" ? "GPS सत्यापित हस्तांतरण स्थान" : "GPS HANDOVER VERIFICATION"}
              </span>
            </div>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#1B7943", background: "rgba(27,121,67,0.12)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
              ±4.8m GNSS FIX
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--graphite)" }}>
            {activeLot.handoverLocation || "Apex E-Recovery Gate 2, Turbhe MIDC"}
          </div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)", marginTop: 2 }}>
            {activeLot.handoverLat ? `${activeLot.handoverLat.toFixed(6)}° N, ${activeLot.handoverLng.toFixed(6)}° E` : "19.082500° N, 73.018200° E"} • CPCB Certified Transfer Point
          </div>
        </div>

        {/* QR Code Handover Simulation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 10,
            padding: "16px 0",
            borderTop: "1px dashed var(--border)",
            borderBottom: "1px dashed var(--border)",
            marginBottom: 16
          }}
        >
          {/* Simulated Industrial QR Box */}
          <div
            style={{
              width: 140,
              height: 140,
              background: "#FFF",
              border: "3px solid var(--graphite)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}
          >
            <QrCode size={94} color="var(--graphite)" />
            <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: 2 }}>
              {t("receipt.scanAtWeighIn", { defaultValue: "SCAN AT WEIGH-IN" })}
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
            {t("receipt.code", { defaultValue: "CODE" })}: {activeLot.qrCode || "EWB-QR-ACTIVE"}
          </div>
        </div>

        {/* Offline Sync State Demo Indicator */}
        <div style={{ marginBottom: 16 }}>
          <div className="text-sub-label" style={{ marginBottom: 6 }}>
            {t("receipt.syncTrail", { defaultValue: "CPCB Synchronization Trail:" })}
          </div>
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", background: "var(--canvas)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            {activeLot.isOfflineQueued ? (
              <div style={{ color: "#925800", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <span>{t("receipt.savedLocally", { defaultValue: "• SAVED LOCALLY → WAITING FOR NETWORK TO BROADCAST" })}</span>
              </div>
            ) : (
              <div style={{ color: "#137333", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <Check size={13} strokeWidth={2.5} />
                <span>{t("receipt.synced", { defaultValue: "• SYNCED TO CPCB CENTRAL REVERSE REGISTRY" })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shortcut to Recycler Intake to test the full lifecycle */}
        <button
          className="btn-graphite-action"
          onClick={() => onOpenRecyclerTerminal(activeLot)}
          id="btn-switch-recycler-intake"
        >
          <span>{t("receipt.switchToRecycler", { defaultValue: "Switch to Recycler Intake (Confirm Weight)" })}</span>
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}
