import React from "react";
import { motion } from "motion/react";
import { useMarketplace } from "../../context/MarketplaceContext";
import { Check, Circle } from "lucide-react";

export const LIFECYCLE_STAGES = [
  { key: "COLLECTED", labelKey: "flow.collected", defaultLabel: "Collected", sub: "Lot Drafted" },
  { key: "VERIFIED", labelKey: "flow.verified", defaultLabel: "Verified", sub: "AI Category" },
  { key: "BIDDED", labelKey: "flow.bidded", defaultLabel: "Bidded", sub: "RFQ Open" },
  { key: "MATCHED", labelKey: "flow.matched", defaultLabel: "Matched", sub: "Best Net" },
  { key: "HANDED_OVER", labelKey: "flow.handover", defaultLabel: "Handover", sub: "Pickup" },
  { key: "INTAKE_CONFIRMED", labelKey: "flow.intake", defaultLabel: "Intake", sub: "Weighed & CPCB" },
  { key: "RECYCLED", labelKey: "flow.recycled", defaultLabel: "Recycled", sub: "Downstream" }
];

export default function MaterialFlow({ currentStage = "BIDDED", lotId = "EW-2041" }) {
  const { t } = useMarketplace();
  const currentIndex = LIFECYCLE_STAGES.findIndex((s) => s.key === currentStage);
  const activeIndex = currentIndex === -1 ? 2 : currentIndex;

  return (
    <div className="material-flow-card instrument-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: "var(--muted)", textTransform: "uppercase" }}>
            {t("flow.title", { defaultValue: "Traceability Chain" })}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, background: "var(--canvas)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
            #{lotId}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
          {t("flow.stageOf", { current: activeIndex + 1, total: 7, defaultValue: `Stage ${activeIndex + 1} of 7` })}
        </span>
      </div>

      <div className="material-flow-container">
        <div
          className="flow-connector-line"
          style={{
            background: `linear-gradient(to right, var(--graphite) ${(activeIndex / (LIFECYCLE_STAGES.length - 1)) * 100}%, var(--border) ${(activeIndex / (LIFECYCLE_STAGES.length - 1)) * 100}%)`
          }}
        />
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <div key={stage.key} className="flow-step-item">
              <motion.div
                className={`flow-node-dot ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                layout
                initial={{ scale: 0.9 }}
                animate={{ scale: isActive ? 1.25 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isCompleted ? "#FFF" : isActive ? "var(--graphite)" : "transparent"
                }}
              >
                {isCompleted ? <Check size={8} strokeWidth={3} /> : isActive ? <Circle size={6} fill="var(--graphite)" /> : null}
              </motion.div>
              <span className={`flow-node-label ${isActive ? "active" : ""}`}>
                {t(stage.labelKey, { defaultValue: stage.defaultLabel })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
