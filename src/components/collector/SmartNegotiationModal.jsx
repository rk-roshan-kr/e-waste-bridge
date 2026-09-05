import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useMarketplace } from "../../context/MarketplaceContext";
import { calculateAISuggestedNegotiation } from "../../data/buyerDemand";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Truck,
  X
} from "lucide-react";

export default function SmartNegotiationModal({
  lotDraft,
  matchedBuyRequest,
  onAcceptNegotiatedOffer,
  onClose
}) {
  const { t, language } = useMarketplace();
  const target = typeof document !== "undefined" ? document.getElementById("phone-screen-portal") : null;

  const [collectorAsk, setCollectorAsk] = useState(
    Math.round(matchedBuyRequest.targetPricePerKg * 1.1)
  );


  const [customCounter, setCustomCounter] = useState("");
  const [showCounterInput, setShowCounterInput] = useState(false);

  // Run AI negotiation logic
  const negotiation = calculateAISuggestedNegotiation({
    buyerTargetRate: matchedBuyRequest.targetPricePerKg,
    collectorAskRate: collectorAsk,
    weightKg: lotDraft.weightKg,
    targetQuantityKg: matchedBuyRequest.targetQuantityKg,
    distanceKm: 8.4,
    hazardLevel: lotDraft.material?.hazardLevel || "LOW",
    language
  });

  const [activeNegotiatedRate, setActiveNegotiatedRate] = useState(negotiation.suggestedRate);

  // Recalculate if user changes counter
  const grossOffer = Math.round(activeNegotiatedRate * lotDraft.weightKg);
  const netPayout = grossOffer - negotiation.logisticsEst;

  const handleConfirmDeal = () => {
    onAcceptNegotiatedOffer({
      recyclerId: matchedBuyRequest.recyclerId,
      recyclerName: matchedBuyRequest.recyclerName,
      badge: "CPCB Verified Standing Buyer",
      cpcbRegistrationNo: matchedBuyRequest.cpcbRegistrationNo,
      rating: 4.9,
      distanceKm: 8.4,
      pickupVehicleType: matchedBuyRequest.pickupVehicleType,
      grossBid: grossOffer,
      logisticsCost: negotiation.logisticsEst,
      netPayout: netPayout,
      recyclerLandedCost: grossOffer + negotiation.logisticsEst,
      paymentMode: "Immediate Cash on Handover",
      negotiatedRatePerKg: activeNegotiatedRate,
      isStandingDemandMatch: true
    });
  };

  const content = (
    <div
      className={target ? "phone-settings-sheet" : "modal-overlay"}
      style={target ? { zIndex: 95 } : undefined}
      onClick={onClose}
    >
      <div
        className={target ? "phone-settings-card" : "modal-card"}
        style={target ? { maxHeight: "88%", overflowY: "auto" } : { maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--graphite)" }}>
              <Sparkles size={18} color="var(--accent-dark)" />
              <span className="text-sub-label" style={{ color: "var(--graphite)" }}>
                {t("negotiate.title", { defaultValue: "AI SMART NEGOTIATION MEDIATOR" })}
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--graphite)", marginTop: 2 }}>
              {t("negotiate.standingMatchWith", { name: matchedBuyRequest.recyclerName, defaultValue: `Standing Demand Match with ${matchedBuyRequest.recyclerName}` })}
            </h3>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* The Two Sides: Standing Demand Target vs Collector Ask */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "var(--canvas)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            gap: 12,
            marginBottom: 14
          }}
        >
          {/* Buyer Demand */}
          <div>
            <div className="text-sub-label">{t("negotiate.buyerTarget", { defaultValue: "BUYER STANDING TARGET" })}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 900, color: "var(--graphite)" }}>
              ₹{matchedBuyRequest.targetPricePerKg}
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>/{t("app.kg", { defaultValue: "kg" })}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {t("negotiate.quota", { count: matchedBuyRequest.targetQuantityKg, defaultValue: `Quota: ${matchedBuyRequest.targetQuantityKg} kg` })}
            </div>
          </div>

          {/* Collector Current Ask */}
          <div>
            <div className="text-sub-label">{t("negotiate.collectorAsk", { defaultValue: "COLLECTOR ASK RATE" })}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 900, color: "var(--graphite)" }}>
              ₹{collectorAsk}
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>/{t("app.kg", { defaultValue: "kg" })}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {t("negotiate.yourLot", { weight: lotDraft.weightKg, defaultValue: `Your lot: ${lotDraft.weightKg} kg` })}
            </div>
          </div>
        </div>

        {/* AI Suggested Compromise Box */}
        <div
          style={{
            background: "#12151A",
            color: "#FFF",
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 16,
            position: "relative"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t("negotiate.aiSuggested", { defaultValue: "AI SUGGESTED MARKET RATE" })}
            </span>
            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, color: "#E2E4E8" }}>
              {t("negotiate.humanApproval", { defaultValue: "Human Approval Required" })}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 900, color: "var(--accent)" }}>
              ₹{activeNegotiatedRate}
              <span style={{ fontSize: 16, color: "#A0A6B2", fontWeight: 500 }}>/{t("app.kg", { defaultValue: "kg" })}</span>
            </div>
            <span style={{ fontSize: 13, color: "#A0A6B2" }}>
              ({t("negotiate.yieldsNet", { net: netPayout, defaultValue: `Yields ₹${netPayout} Net Cash in Hand` })})
            </span>
          </div>

          {/* AI Explainable Reasoning Bullets */}
          <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A0A6B2", marginBottom: 6, textTransform: "uppercase" }}>
              {t("negotiate.rationale", { defaultValue: "Algorithmic Mediation Rationale:" })}
            </div>
            <ul style={{ paddingLeft: 18, fontSize: 12, color: "#E2E4E8", lineHeight: 1.5 }}>
              {negotiation.reasoning.map((r, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payout & Logistics Deductions */}
        <div style={{ background: "var(--canvas)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
          <div className="breakdown-row">
            <span>{t("app.grossBid", { defaultValue: "Gross Value" })} ({lotDraft.weightKg} {t("app.kg", { defaultValue: "kg" })} @ ₹{activeNegotiatedRate}):</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>₹{grossOffer}</span>
          </div>
          <div className="breakdown-row">
            <span>{t("app.logistics", { defaultValue: "Logistics Deduction" })} (8.4 {t("app.km", { defaultValue: "km" })}):</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--danger)" }}>-₹{negotiation.logisticsEst}</span>
          </div>
          <div className="breakdown-row total-payout">
            <span>{t("app.cashInHand", { defaultValue: "Actual Money in Hand" })}:</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--graphite)" }}>₹{netPayout}</span>
          </div>
        </div>

        {/* Counter Rate Input with Aesthetic Slider */}
        {showCounterInput && (
          <div style={{ marginBottom: 14, background: "var(--canvas)", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="text-sub-label">{t("negotiate.dialCounter", { defaultValue: "Dial Proposed Counter Rate:" })}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 900, color: "var(--graphite)", background: "var(--surface)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
                ₹{activeNegotiatedRate}/{t("app.kg", { defaultValue: "kg" })}
              </span>
            </div>
            <input
              type="range"
              min={Math.max(10, Math.round(matchedBuyRequest.targetPricePerKg * 0.85))}
              max={Math.round(matchedBuyRequest.targetPricePerKg * 1.35)}
              step="1"
              value={activeNegotiatedRate}
              className="aesthetic-range-slider"
              style={{
                "--slider-pct": `${
                  ((activeNegotiatedRate - Math.max(10, Math.round(matchedBuyRequest.targetPricePerKg * 0.85))) /
                    (Math.round(matchedBuyRequest.targetPricePerKg * 1.35) -
                      Math.max(10, Math.round(matchedBuyRequest.targetPricePerKg * 0.85)))) *
                  100
                }%`
              }}
              onChange={(e) => setActiveNegotiatedRate(parseFloat(e.target.value))}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
              <span>{language === "mr" ? "किमान" : language === "hi" ? "न्यूनतम" : "Min"}: ₹{Math.max(10, Math.round(matchedBuyRequest.targetPricePerKg * 0.85))}</span>
              <span>{language === "mr" ? "लक्ष्य" : language === "hi" ? "लक्ष्य" : "Target"}: ₹{matchedBuyRequest.targetPricePerKg}</span>
              <span>{language === "mr" ? "कमाल" : language === "hi" ? "अधिकतम" : "Max"}: ₹{Math.round(matchedBuyRequest.targetPricePerKg * 1.35)}</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-graphite-action" onClick={handleConfirmDeal} id="btn-accept-negotiation">
            <CheckCircle2 size={18} />
            <span>{t("negotiate.acceptDeal", { rate: activeNegotiatedRate, net: netPayout, defaultValue: `Accept Deal (₹${activeNegotiatedRate}/kg — Net ₹${netPayout})` })}</span>
          </button>
          {!showCounterInput && (
            <button className="btn-secondary" onClick={() => setShowCounterInput(true)}>
              {t("negotiate.proposeCounter", { defaultValue: "Propose Counter" })}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return target ? createPortal(content, target) : content;
}
