import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMarketplace } from "../../context/MarketplaceContext";
import { generateMarketplaceOffers } from "../../data/logisticsEngine";
import { matchDemandForLot } from "../../data/buyerDemand";
import SmartNegotiationModal from "./SmartNegotiationModal";
import HoldToConfirmButton from "../shared/HoldToConfirmButton";
import { CONFIRMATION_POLICY } from "../../data/confirmationPolicy";
import {
  ShieldCheck,
  Truck,
  Clock,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  MapPin,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Star,
  Loader2
} from "lucide-react";

import { useCollectorAgentBridge } from "../../context/CollectorAgentBridgeContext";
import { emitStateChange, emitInputAck, emitSuccess } from "../../services/feedbackDispatcher";

export default function ReverseMarketplace({
  lotDraft,
  onBack,
  onAcceptOffer,
  voiceCommandAction = null,
  onContextChange = null
}) {
  const { t, networkState, createNewLot, buyRequests, language } = useMarketplace();
  const bridge = useCollectorAgentBridge();
  const effectiveOnContextChange = onContextChange || bridge?.setScreenContext;
  const effectiveVoiceCommand = voiceCommandAction || bridge?.voiceCommandAction;

  // Mode: 'INSTANT' | 'OPEN_BIDDING'
  const [marketMode, setMarketMode] = useState("INSTANT");
  const [sortBy, setSortBy] = useState("NET_PAYOUT"); // 'NET_PAYOUT' | 'GROSS_BID' | 'DISTANCE'
  const [countdownSeconds, setCountdownSeconds] = useState(145);
  const [selectedDemandForNegotiation, setSelectedDemandForNegotiation] = useState(null);
  const [maxTransitKm, setMaxTransitKm] = useState(45);
  const [demoHighValue, setDemoHighValue] = useState(false);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [highlightedOfferIndex, setHighlightedOfferIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const draftMaterialId = lotDraft?.materialId || "laptops";
  const draftWeightKg = lotDraft?.weightKg || 10;
  const draftHazard = lotDraft?.material?.hazardLevel || "LOW";

  // Check for 2-sided buyer demand matches
  const matchedDemand = matchDemandForLot(buyRequests, {
    materialId: draftMaterialId,
    weightKg: draftWeightKg,
    distanceKm: 8.4
  });

  // Generate offers based on logistics engine
  const [offers, setOffers] = useState(() =>
    generateMarketplaceOffers({
      materialId: draftMaterialId,
      weightKg: draftWeightKg,
      hazardLevel: draftHazard
    })
  );

  // Countdown timer for open bidding window
  useEffect(() => {
    if (marketMode !== "OPEN_BIDDING") return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [marketMode]);

  const formatCountdown = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `00:${m}:${s}`;
  };

  // Filter and sort offers dynamically
  const filteredOffers = offers.filter((o) => o.distanceKm <= maxTransitKm);
  const sortedOffers = [...(filteredOffers.length > 0 ? filteredOffers : offers)].sort((a, b) => {
    if (sortBy === "NET_PAYOUT") return b.netPayout - a.netPayout;
    if (sortBy === "GROSS_BID") return b.grossBid - a.grossBid;
    if (sortBy === "DISTANCE") return a.distanceKm - b.distanceKm;
    return 0;
  });

  const bestOffer = sortedOffers[0];

  // Report structured screen context to parent agent
  useEffect(() => {
    const visible = sortedOffers.slice(0, 3).map((o, idx) => ({
      type: "OFFER",
      id: o.recyclerId || `offer_${idx}`,
      position: idx,
      buyerName: o.recyclerName,
      netPayout: o.netPayout,
      offer: o
    }));

    effectiveOnContextChange?.({
      screen: "MARKETPLACE",
      selectedElement: {
        type: "OFFER",
        id: sortedOffers[selectedOfferIndex]?.recyclerId || "offer_0",
        index: selectedOfferIndex,
        offer: sortedOffers[selectedOfferIndex]
      },
      visibleElements: visible,
      availableActions: ["COMPARE", "SELECT", "REQUEST_ACCEPT"]
    });
  }, [sortedOffers, selectedOfferIndex, effectiveOnContextChange]);

  // Handle Two-Way Multimodal Voice Commands
  useEffect(() => {
    if (!effectiveVoiceCommand) return;

    if (effectiveVoiceCommand.type === "SELECT_OFFER") {
      const idx = Math.min(sortedOffers.length - 1, Math.max(0, effectiveVoiceCommand.index ?? 0));
      setSelectedOfferIndex(idx);
      setHighlightedOfferIndex(idx);
      setTimeout(() => setHighlightedOfferIndex(null), 3000);
    } else if (effectiveVoiceCommand.type === "HIGHLIGHT_OFFER") {
      const idx = Math.min(sortedOffers.length - 1, Math.max(0, effectiveVoiceCommand.index ?? 0));
      setHighlightedOfferIndex(idx);
      setTimeout(() => setHighlightedOfferIndex(null), 3500);
    } else if (effectiveVoiceCommand.type === "ACCEPT_OFFER") {
      const target = sortedOffers[selectedOfferIndex] || bestOffer;
      handleConfirmAcceptance(target);
    }
  }, [effectiveVoiceCommand]);

  const handleConfirmAcceptance = (offer) => {
    setIsProcessing(true);
    emitInputAck("TOUCH", "accept_offer_button");
    emitSuccess("TOUCH", "ACCEPT_OFFER", "transaction", `Accepted ₹${offer.netPayout}`);

    setTimeout(() => {
      const lot = createNewLot({
        materialId: lotDraft?.materialId || "laptops",
        weightKg: lotDraft?.weightKg || 10,
        unitsCount: lotDraft?.material?.sampleImages?.[0]?.estUnits || 1,
        selectedOffer: offer,
        isInstant: marketMode === "INSTANT",
        photoUrl: lotDraft?.photoUrl || "",
        conditionGrade: lotDraft?.conditionGrade || "Used"
      });
      setIsProcessing(false);
      onAcceptOffer(lot, offer);
    }, 120);
  };

  const handleAcceptNegotiatedDeal = (offer) => {
    setSelectedDemandForNegotiation(null);
    handleConfirmAcceptance(offer);
  };

  const localizedMatName = t("materials." + (lotDraft?.materialId || "laptops"), { defaultValue: lotDraft?.material?.name || "Laptops" });

  return (
    <div className="collector-viewport">
      {/* Navigation & Mode Selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: "8px 12px" }}>
          <ArrowLeft size={16} />
          <span>{t("marketplace.editLot", { defaultValue: "Edit Lot" })}</span>
        </button>
        <span className="text-sub-label">{t("marketplace.title", { defaultValue: "VERIFIED REVERSE MARKETPLACE" })}</span>
      </div>

      {/* Lot Spec Bar with Photo Thumbnail */}
      <div
        className="instrument-card"
        style={{
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          {lotDraft.photoUrl && (
            <img
              src={lotDraft.photoUrl}
              alt="Lot item"
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                objectFit: "cover",
                border: "1px solid var(--border)",
                flexShrink: 0
              }}
            />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--graphite)",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={localizedMatName}
            >
              {localizedMatName}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {t("app.weight", { defaultValue: "Weight" })}: <strong style={{ color: "var(--graphite)" }}>{lotDraft.weightKg} {t("app.kg", { defaultValue: "kg" })}</strong> • {t("scanner.conditionLabel", { defaultValue: "Condition" })}: <strong style={{ color: "var(--graphite)" }}>{lotDraft.conditionGrade || "Scrap"}</strong>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3.5,
              fontSize: 9.5,
              fontWeight: 800,
              background: "#12151A",
              color: "#FFF",
              padding: "2.5px 7px",
              borderRadius: 6,
              letterSpacing: "0.03em",
              whiteSpace: "nowrap"
            }}
          >
            <ShieldCheck size={11} color="var(--accent)" />
            <span>{t("app.cpcbRegulatedShort", { defaultValue: "CPCB REG." })}</span>
          </span>
        </div>
      </div>


      {/* Two-Sided Demand Match Banner (Buyer Requirements Board) */}
      {matchedDemand.length > 0 && (
        <div
          style={{
            background: "#12151A",
            color: "#FFF",
            borderRadius: "var(--radius-card)",
            padding: "16px 18px",
            border: "1px solid #282E38",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={14} />
              <span>{t("marketplace.standingMatch", { defaultValue: "STANDING BUY ORDER MATCH DETECTED" })}</span>
            </span>
            <span style={{ fontSize: 11, background: "rgba(255,255,255,0.12)", padding: "2px 8px", borderRadius: 999, color: "#FFF", fontWeight: 700 }}>
              {matchedDemand.length} {t("marketplace.buyersWantThis", { defaultValue: "Buyer Wants This" })}
            </span>
          </div>

          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {matchedDemand[0].recyclerName}
            </div>
            <div style={{ fontSize: 12, color: "#A0A6B2", marginTop: 2 }}>
              {t("marketplace.demandSpecs", {
                qty: matchedDemand[0].targetQuantityKg,
                rate: matchedDemand[0].targetPricePerKg,
                radius: matchedDemand[0].radiusKm,
                defaultValue: `Needs: ${matchedDemand[0].targetQuantityKg} kg • Target rate: ₹${matchedDemand[0].targetPricePerKg}/kg • Pickup within: ${matchedDemand[0].radiusKm} km`
              })}
            </div>
          </div>

          <button
            className="btn-graphite-action"
            style={{
              background: "var(--accent)",
              color: "var(--graphite)",
              marginTop: 4,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 800
            }}
            onClick={() => setSelectedDemandForNegotiation(matchedDemand[0])}
            id="btn-open-smart-negotiate"
          >
            <Sparkles size={16} />
            <span>{t("marketplace.openNegotiate", { defaultValue: "Open AI Smart Negotiation" })}</span>
          </button>
        </div>
      )}

      {/* Marketplace Mode Switcher: Instant Sell vs Open Bidding */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "var(--canvas)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-btn)",
          padding: 4,
          gap: 4
        }}
      >
        <button
          onClick={() => setMarketMode("INSTANT")}
          style={{
            background: marketMode === "INSTANT" ? "var(--graphite)" : "transparent",
            color: marketMode === "INSTANT" ? "var(--surface)" : "var(--graphite)",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <Sparkles size={14} color={marketMode === "INSTANT" ? "var(--accent)" : "currentColor"} />
          <span>{t("marketplace.instantSell", { defaultValue: t.instantSell })}</span>
        </button>

        <button
          onClick={() => setMarketMode("OPEN_BIDDING")}
          style={{
            background: marketMode === "OPEN_BIDDING" ? "var(--graphite)" : "transparent",
            color: marketMode === "OPEN_BIDDING" ? "var(--surface)" : "var(--graphite)",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <Clock size={14} color={marketMode === "OPEN_BIDDING" ? "var(--accent)" : "currentColor"} />
          <span>{t("marketplace.openBidding", { defaultValue: "Open Bidding RFQ" })}</span>
        </button>
      </div>

      {/* Open Bidding Timer Banner */}
      {marketMode === "OPEN_BIDDING" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "#FFF9EC",
            border: "1px solid #F8DA9F",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#854E00" }}>
            <Clock size={16} />
            <span>{t("marketplace.biddingClosesIn", { defaultValue: t.biddingClosesIn })}</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 900, color: "#854E00" }}>
            {formatCountdown(countdownSeconds)}
          </span>
        </motion.div>
      )}

      {/* Featured Dominant: Best NET OFFER Card */}
      {bestOffer && (
        <div className="net-offer-card highlight">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div className="badge-best-net">
              <Star size={10.5} fill="currentColor" />
              <span>{t("marketplace.bestOffer", { defaultValue: "BEST NET OFFER" })}</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3.5,
                fontSize: 10,
                fontWeight: 800,
                color: "#166534",
                background: "#DCFCE7",
                border: "1px solid #BBF7D0",
                padding: "2.5px 7px",
                borderRadius: 6,
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                flexShrink: 0
              }}
            >
              <ShieldCheck size={12} />
              <span>{t("app.cpcbAuthorized", { defaultValue: "CPCB AUTHORIZED" })}</span>
            </div>
          </div>

          <div>
            <div className="text-sub-label">{t("app.cashInHand", { defaultValue: t.moneyInHand })}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div className="text-hero-amount" style={{ fontSize: 44 }}>
                ₹{bestOffer.netPayout.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                {t("marketplace.netPayout", { defaultValue: "NET PAYOUT" })}
              </span>
            </div>
          </div>

          {/* Transparent Logistics Deduction Breakdown */}
          <div style={{ background: "var(--canvas)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div className="breakdown-row">
              <span>{t("app.grossBid", { defaultValue: t.grossBid })} ({bestOffer.recyclerName})</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--graphite)" }}>
                ₹{bestOffer.grossBid.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="breakdown-row">
              <span>{t("app.logistics", { defaultValue: t.estLogistics })} ({bestOffer.distanceKm} {t("app.km", { defaultValue: "km" })})</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--danger)" }}>
                - ₹{bestOffer.logisticsCost}
              </span>
            </div>

            <div className="breakdown-row total-payout">
              <span>{t("app.cashInHand", { defaultValue: t.netPayout })}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--graphite)" }}>
                ₹{bestOffer.netPayout.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Operational Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Truck size={14} color="var(--graphite)" />
              <span>{t("vehicles." + bestOffer.pickupVehicleType, { defaultValue: bestOffer.pickupVehicleType })}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <DollarSign size={14} color="var(--graphite)" />
              <span>{t("marketplace.immediateCash", { defaultValue: "Immediate Cash on Handover" })}</span>
            </div>
          </div>

          {/* High-Value Safeguard Policy Toggle for Demonstration */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border)", fontSize: 11 }}>
            <span style={{ color: "var(--muted)", fontWeight: 600 }}>
              {language === "mr" ? "धोरण: ₹१ लाखापेक्षा जास्त रकमेसाठी ५ सेकंद दाबून धरा" : language === "hi" ? "नीति: ₹1 लाख से अधिक पर 5s होल्ड जरूरी" : "Policy: ≥₹1 Lakh requires 5s Hold"}
            </span>
            <button
              type="button"
              onClick={() => setDemoHighValue(!demoHighValue)}
              style={{
                background: demoHighValue ? "var(--graphite)" : "var(--canvas)",
                color: demoHighValue ? "var(--accent)" : "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "2px 8px",
                fontWeight: 700,
                fontSize: 10,
                cursor: "pointer"
              }}
            >
              {demoHighValue ? "Simulating ₹1,24,600 (Hold Mode)" : "Simulate ₹1 Lakh+ Lot"}
            </button>
          </div>

          {/* Action Button: Tap vs Physical Hold based on Value */}
          {bestOffer && (demoHighValue || bestOffer.netPayout >= CONFIRMATION_POLICY.highValue.threshold) ? (
            <HoldToConfirmButton
              amount={demoHighValue ? 124600 : bestOffer.netPayout}
              durationMs={CONFIRMATION_POLICY.highValue.durationMs}
              language={language}
              onConfirmed={() => handleConfirmAcceptance({ ...bestOffer, netPayout: demoHighValue ? 124600 : bestOffer.netPayout })}
            />
          ) : (
            <button
              className="btn-graphite-action"
              disabled={isProcessing}
              onClick={() => handleConfirmAcceptance(bestOffer)}
              id="btn-accept-best-offer"
              style={{ marginTop: 8 }}
            >
              {isProcessing ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <Loader2 size={16} className="animate-spin" color="var(--accent)" />
                  <span>{language === "mr" ? "सौदा नोंदवत आहे..." : language === "hi" ? "सौदा दर्ज हो रहा है..." : "Processing Commitment..."}</span>
                </div>
              ) : (
                <>
                  <span>{t("marketplace.acceptCTA", { amount: bestOffer.netPayout.toLocaleString("en-IN"), defaultValue: `ACCEPT ₹${bestOffer.netPayout}` })}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Competing Bids Reordering View */}
      <div className="instrument-card" style={{ padding: 16 }}>
        {/* Transit Distance Filter Slider */}
        <div style={{ background: "var(--canvas)", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="text-sub-label">{t("marketplace.filterRadius", { defaultValue: "Dial Max Transit Distance:" })}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 900, color: "var(--graphite)", background: "var(--surface)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
              {t("marketplace.withinKm", { km: maxTransitKm, count: sortedOffers.length, defaultValue: `Within ${maxTransitKm} km` })}
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={maxTransitKm}
            className="aesthetic-range-slider"
            style={{ "--slider-pct": `${((maxTransitKm - 5) / (50 - 5)) * 100}%` }}
            onChange={(e) => setMaxTransitKm(parseFloat(e.target.value))}
          />
          <div className="slider-ticks-row" style={{ marginTop: 6 }}>
            {[10, 20, 30, 45, 50].map((dist) => (
              <button
                key={dist}
                type="button"
                className={`slider-tick-chip ${maxTransitKm === dist ? "active" : ""}`}
                onClick={() => setMaxTransitKm(dist)}
              >
                {dist} {t("app.km", { defaultValue: "km" })}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="text-sub-label">
            {t("marketplace.competingBids", { defaultValue: "Competing Recycler Bids" })} ({sortedOffers.length})
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setSortBy("NET_PAYOUT")}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: sortBy === "NET_PAYOUT" ? "var(--graphite)" : "var(--surface)",
                color: sortBy === "NET_PAYOUT" ? "var(--surface)" : "var(--graphite)",
                cursor: "pointer"
              }}
            >
              {t("marketplace.sortBestNet", { defaultValue: "Best Net" })}
            </button>
            <button
              onClick={() => setSortBy("GROSS_BID")}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: sortBy === "GROSS_BID" ? "var(--graphite)" : "var(--surface)",
                color: sortBy === "GROSS_BID" ? "var(--surface)" : "var(--graphite)",
                cursor: "pointer"
              }}
            >
              {t("marketplace.sortGross", { defaultValue: "Gross Bid" })}
            </button>
            <button
              onClick={() => setSortBy("DISTANCE")}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: sortBy === "DISTANCE" ? "var(--graphite)" : "var(--surface)",
                color: sortBy === "DISTANCE" ? "var(--surface)" : "var(--graphite)",
                cursor: "pointer"
              }}
            >
              {t("marketplace.sortDistance", { defaultValue: "Distance" })}
            </button>
          </div>
        </div>



        {/* Dynamic Motion Layout List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence>
            {sortedOffers.map((offer, index) => (
              <motion.div
                key={offer.recyclerId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileTap={{ scale: 0.985 }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={highlightedOfferIndex === index ? "voice-card-highlight" : ""}
                onClick={() => {
                  setSelectedOfferIndex(index);
                  emitStateChange("TOUCH", "SELECT_OFFER", "offerCard", { index, offerId: offer.recyclerId });
                }}
                style={{
                  padding: "12px 14px",
                  background: selectedOfferIndex === index ? "var(--surface)" : "var(--canvas)",
                  border: highlightedOfferIndex === index
                    ? "2.5px solid #D4FF28"
                    : selectedOfferIndex === index
                    ? "2px solid var(--graphite)"
                    : "1px solid var(--border)",
                  borderRadius: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--graphite)" }}>
                      {offer.recyclerName}
                    </span>
                    {index === 0 ? (
                      <span style={{ background: "var(--accent)", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 4 }}>
                        96% MATCH • BEST NET
                      </span>
                    ) : (
                      <span style={{ background: "rgba(0,0,0,0.06)", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, color: "var(--muted)" }}>
                        {index === 1 ? "91% Match" : "86% Match"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {t("marketplace.bidSummary", {
                      gross: offer.grossBid,
                      pickup: offer.logisticsCost,
                      dist: offer.distanceKm,
                      defaultValue: `Gross: ₹${offer.grossBid} • Pickup: ₹${offer.logisticsCost} • ${offer.distanceKm} km`
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 800, color: "var(--graphite)" }}>
                      ₹{offer.netPayout.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>
                      {t("app.cashInHandShort", { defaultValue: "NET IN HAND" })}
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => handleConfirmAcceptance(offer)}
                    style={{ padding: "6px 10px", fontSize: 12 }}
                  >
                    {t("app.accept", { defaultValue: "Accept" })}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Two-Sided Smart Negotiation Modal */}
      {selectedDemandForNegotiation && (
        <SmartNegotiationModal
          lotDraft={lotDraft}
          matchedBuyRequest={selectedDemandForNegotiation}
          onAcceptNegotiatedOffer={handleAcceptNegotiatedDeal}
          onClose={() => setSelectedDemandForNegotiation(null)}
        />
      )}
    </div>
  );
}
