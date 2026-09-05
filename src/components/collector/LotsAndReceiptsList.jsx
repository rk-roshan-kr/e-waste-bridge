import React, { useState } from "react";
import { motion } from "motion/react";
import { useMarketplace } from "../../context/MarketplaceContext";
import {
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Truck,
  Calendar,
  ShieldCheck,
  TrendingUp,
  QrCode,
  DollarSign,
  Filter,
  Layers,
  PlusCircle,
  Smartphone,
  Laptop,
  Cpu,
  BatteryCharging,
  Cable,
  Tv
} from "lucide-react";
import { emitInputAck } from "../../services/feedbackDispatcher";

const MATERIAL_ICONS = {
  laptops: <Laptop size={18} />,
  smartphones: <Smartphone size={18} />,
  pcb: <Cpu size={18} />,
  pcb_mixed: <Cpu size={18} />,
  batteries: <BatteryCharging size={18} />,
  lithium_batteries: <BatteryCharging size={18} />,
  cables: <Cable size={18} />,
  cables_copper: <Cable size={18} />,
  crt: <Tv size={18} />,
  crt_monitors: <Tv size={18} />,
  abs_plastic: <Package size={18} />
};

export default function LotsAndReceiptsList({ onSelectLot, onBackHome, onNewLot }) {
  const { t, lots = [], language, collector } = useMarketplace();
  const [filterMode, setFilterMode] = useState("ALL"); // 'ALL' | 'SETTLED' | 'ACTIVE'

  const isLotSettled = (l) => l.status === "SETTLED" || l.status === "CLOSED" || l.paymentStatus === "CASH_SETTLED" || l.paymentStatus === "PAID";

  const filteredLots = lots.filter((lot) => {
    if (filterMode === "SETTLED") {
      return isLotSettled(lot);
    }
    if (filterMode === "PENDING") {
      return !isLotSettled(lot);
    }
    return true;
  });

  const totalSettledEarnings = lots
    .filter(isLotSettled)
    .reduce((sum, l) => sum + (l.finalNetPayout || l.netPayout || l.estimatedValue || 0), 0);

  const pendingLots = lots.filter((l) => !isLotSettled(l));
  const totalPendingDues = pendingLots
    .reduce((sum, l) => sum + (l.finalNetPayout || l.netPayout || l.estimatedValue || 0), 0);

  const totalDivertedWeight = lots.reduce(
    (sum, l) => sum + (l.actualIntakeWeightKg || l.reportedWeightKg || 0),
    0
  );

  const handleCardClick = (lot) => {
    emitInputAck("TOUCH", "lot_receipt_card", { lotId: lot.lotId });
    if (onSelectLot) {
      onSelectLot(lot);
    }
  };

  return (
    <div className="collector-viewport" style={{ paddingBottom: 28 }}>
      {/* Top Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button
          className="btn-secondary"
          onClick={() => {
            emitInputAck("TOUCH", "back_home_btn");
            if (onBackHome) onBackHome();
          }}
          style={{ padding: "8px 12px" }}
        >
          <ArrowLeft size={16} />
          <span>{language === "mr" ? "मुख्य पृष्ठ" : language === "hi" ? "होम" : "Home"}</span>
        </button>

        <div style={{ textAlign: "right" }}>
          <span className="text-sub-label" style={{ fontSize: 10 }}>
            {language === "mr" ? "संकलक खाती व येणे" : language === "hi" ? "संग्राहक खाता व बाकी" : "COLLECTOR LEDGER & DUES"}
          </span>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--graphite)" }}>
            {language === "mr" ? "लॉट्स, पावत्या व येणे" : language === "hi" ? "लॉट, रसीदें व बाकी" : "Lots, Receipts & Dues"}
          </div>
        </div>
      </div>

      {/* Summary Stat Banner - 3 KPI Cards */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 14,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1B7943", fontWeight: 800, fontSize: 12 }}>
            <ShieldCheck size={16} />
            <span>{language === "mr" ? "CPCB नोंदणीकृत रोख खाती" : language === "hi" ? "CPCB पंजीकृत नकद खाता" : "CPCB Verified Cash Ledger"}</span>
          </div>
          <span style={{ fontSize: 11, background: "var(--canvas)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 999, fontWeight: 800, color: "var(--graphite)" }}>
            {lots.length} {language === "mr" ? "एकूण लॉट्स" : language === "hi" ? "कुल लॉट" : "Total Lots"}
          </span>
        </div>

        {/* 3-Column Earnings & Pending Dues Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {/* Tile 1: Settled Cash */}
          <div style={{ background: "var(--canvas)", padding: "10px 10px", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>
              {language === "mr" ? "रोख जमा" : language === "hi" ? "नकद प्राप्त" : "CASH PAID"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 900, color: "#1B7943", marginTop: 2 }}>
              ₹{totalSettledEarnings.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Tile 2: Pending Dues (Statutory PS Requirement) */}
          <div style={{ background: "#FFFBEB", padding: "10px 10px", borderRadius: 10, border: "1px solid #FDE68A" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#B45309", textTransform: "uppercase" }}>
              {language === "mr" ? "थकीत येणे" : language === "hi" ? "बाकी रोकड़" : "PENDING DUES"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 900, color: "#B45309", marginTop: 2 }}>
              ₹{totalPendingDues.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Tile 3: Weight Diverted */}
          <div style={{ background: "var(--canvas)", padding: "10px 10px", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>
              {language === "mr" ? "पुनर्चक्रित वजन" : language === "hi" ? "रीसायकल वजन" : "WEIGHT"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 900, color: "var(--graphite)", marginTop: 2 }}>
              {totalDivertedWeight.toFixed(1)} kg
            </div>
          </div>
        </div>
      </div>

      {/* Filter Mode Switcher with Pending Dues Tab */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          background: "var(--canvas)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 3,
          gap: 3,
          marginBottom: 14
        }}
      >
        {[
          { id: "ALL", label: language === "mr" ? "सर्व" : language === "hi" ? "सभी" : "All", count: lots.length },
          {
            id: "SETTLED",
            label: language === "mr" ? "रोख जमा" : language === "hi" ? "नकद प्राप्त" : "Settled",
            count: lots.filter(isLotSettled).length
          },
          {
            id: "PENDING",
            label: language === "mr" ? "बाकी येणे" : language === "hi" ? "बाकी रोकड़" : "Pending Dues",
            count: pendingLots.length
          }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              emitInputAck("TOUCH", "filter_lots_tab", { filter: f.id });
              setFilterMode(f.id);
            }}
            style={{
              padding: "7px 4px",
              borderRadius: 8,
              border: "none",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              background: filterMode === f.id ? "var(--graphite)" : "transparent",
              color: filterMode === f.id ? "#FFF" : f.id === "PENDING" && pendingLots.length > 0 ? "#B45309" : "var(--muted)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4
            }}
          >
            <span>{f.label}</span>
            <span
              style={{
                fontSize: 10,
                opacity: 0.85,
                background: filterMode === f.id ? "rgba(255,255,255,0.2)" : f.id === "PENDING" && pendingLots.length > 0 ? "#FDE68A" : "rgba(0,0,0,0.06)",
                color: filterMode === f.id ? "#FFF" : f.id === "PENDING" && pendingLots.length > 0 ? "#92400E" : "inherit",
                padding: "1px 5px",
                borderRadius: 999
              }}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* List of Lots & Receipts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredLots.length === 0 ? (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              padding: "32px 20px",
              textAlign: "center",
              border: "1px dashed var(--border)"
            }}
          >
            <Package size={36} color="var(--muted)" style={{ margin: "0 auto 10px" }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--graphite)" }}>
              {language === "mr" ? "कोणतेही लॉट्स सापडले नाहीत" : language === "hi" ? "कोई लॉट नहीं मिला" : "No lots found in this filter"}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {language === "mr" ? "नवीन ई-कचरा लॉट तयार करण्यासाठी खाली टॅप करा." : "Tap below to sell scrap and create your next lot."}
            </p>
            {onNewLot && (
              <button
                type="button"
                className="btn-graphite-action"
                onClick={onNewLot}
                style={{ marginTop: 14, display: "inline-flex", padding: "8px 16px", fontSize: 12 }}
              >
                <PlusCircle size={14} />
                <span>{language === "mr" ? "कचरा विका (Sell Scrap)" : "Sell Scrap Now"}</span>
              </button>
            )}
          </div>
        ) : (
          filteredLots.map((lot) => {
            const isSettled = lot.status === "SETTLED" || lot.status === "CLOSED";
            const localizedMat = t("materials." + lot.materialId, { defaultValue: lot.materialName || "E-Waste Scrap" });

            return (
              <motion.div
                key={lot.lotId}
                whileTap={{ scale: 0.975 }}
                whileHover={{ y: -2 }}
                onClick={() => handleCardClick(lot)}
                style={{
                  background: "var(--surface)",
                  border: isSettled ? "1px solid var(--border)" : "1.5px solid #F8DA9F",
                  borderRadius: 14,
                  padding: "14px 16px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}
              >
                {/* Top Row: Lot ID, Date & Status Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 900,
                        color: "var(--graphite)",
                        background: "var(--canvas)",
                        padding: "2px 6px",
                        borderRadius: 6,
                        border: "1px solid var(--border)"
                      }}
                    >
                      #{lot.lotId}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {lot.createdAt ? new Date(lot.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent"}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {isSettled ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#E8F5E9",
                        color: "#1B7943",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 999
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>{language === "mr" ? "नकद जमा (पूर्ण)" : language === "hi" ? "नकद प्राप्त (पूर्ण)" : "PAID & SETTLED"}</span>
                    </span>
                  ) : lot.paymentStatus === "PARTIAL" ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#EBF3FE",
                        color: "#1A4480",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 999
                      }}
                    >
                      <Clock size={11} />
                      <span>{language === "mr" ? "अंशतः रोख जमा" : language === "hi" ? "आंशिक नकद प्राप्त" : "PARTIAL PAID"}</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#FFFBEB",
                        color: "#B45309",
                        border: "1px solid #FDE68A",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 999
                      }}
                    >
                      <Clock size={11} />
                      <span>{language === "mr" ? "थकीत येणे (पिकअप बाकी)" : language === "hi" ? "बाकी रोकड़ (पिकअप पर)" : "PENDING CASH AT GATE"}</span>
                    </span>
                  )}
                </div>

                {/* Middle Row: Material Icon, Name, Weight, Buyer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "var(--canvas)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--graphite)",
                        flexShrink: 0
                      }}
                    >
                      {MATERIAL_ICONS[lot.materialId] || <Package size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "var(--graphite)" }}>
                        {localizedMat}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>
                          {lot.actualIntakeWeightKg || lot.reportedWeightKg || 10} kg
                        </span>
                        <span>•</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Truck size={11} />
                          <span>{lot.selectedBuyerName || lot.selectedRecyclerName || "Recycler"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Payout or Pending Due */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: isSettled ? "var(--muted)" : "#B45309", textTransform: "uppercase" }}>
                      {isSettled
                        ? (language === "mr" ? "रोख जमा" : language === "hi" ? "नकद प्राप्त" : "CASH RECEIVED")
                        : (language === "mr" ? "थकीत येणे" : language === "hi" ? "बाकी रोकड़" : "CASH DUE")}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 17,
                        fontWeight: 900,
                        color: isSettled ? "#1B7943" : "#B45309"
                      }}
                    >
                      ₹{(lot.finalNetPayout || lot.netPayout || lot.estimatedValue || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Cash Payment Method & View Digital Receipt */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px dashed var(--border)",
                    paddingTop: 8,
                    marginTop: 2
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: isSettled ? "#1B7943" : "#B45309" }}>
                    <DollarSign size={12} />
                    <span>
                      {lot.paymentMode === "ESCROW_UPI"
                        ? (language === "mr" ? "पद्धत: यूपीआय एस्क्रो (पर्यायी)" : language === "hi" ? "पद्धति: यूपीआई एस्क्रो (वैकल्पिक)" : "Method: UPI Escrow (Optional)")
                        : (language === "mr" ? "पद्धत: हस्ते रोख (Default Spot Cash)" : language === "hi" ? "पद्धति: हस्ते नकद (Default Spot Cash)" : "Method: Spot Cash in Hand (Default)")}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--graphite)" }}>
                    <QrCode size={12} />
                    <span>{language === "mr" ? "पावती पहा →" : language === "hi" ? "रसीद देखें →" : "View Receipt →"}</span>
                  </div>
                </div>

                {/* Bottom Row: View Digital Receipt & QR Action */}
                <div
                  style={{
                    borderTop: "1px dashed var(--border)",
                    paddingTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--graphite)"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--muted)" }}>
                    <QrCode size={13} color="var(--graphite)" />
                    <span>{lot.qrCode || `EWB-${lot.lotId}`}</span>
                  </span>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--graphite)", fontWeight: 800 }}>
                    <span>{language === "mr" ? "पावती व QR पाहा" : language === "hi" ? "रसीद व QR देखें" : "View Receipt & QR"}</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
