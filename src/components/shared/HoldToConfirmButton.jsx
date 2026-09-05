import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { ShieldAlert, CheckCircle2, Lock, AlertTriangle, XCircle } from "lucide-react";
import { emitMilestone, emitCancelled, emitSuccess, emitInputAck } from "../../services/feedbackDispatcher";

export default function HoldToConfirmButton({
  amount = 124600,
  durationMs = 5000,
  onConfirmed,
  label = "HOLD TO APPROVE TRANSACTION",
  subLabel = "Deliberate physical commitment for high-value e-waste",
  language = "mr"
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [cancelledMessage, setCancelledMessage] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastMilestoneRef = useRef(0);

  const cancelHold = useCallback(() => {
    if (confirmed) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (holding && progress < 100) {
      setCancelledMessage(true);
      emitCancelled("HOLD", "HIGH_VALUE_CONFIRM", "transaction", "Transaction not committed");
      setTimeout(() => setCancelledMessage(false), 2600);
    }

    setHolding(false);
    setProgress(0);
    lastMilestoneRef.current = 0;
  }, [confirmed, holding, progress]);

  const startHold = (e) => {
    if (confirmed) return;
    if (e && e.type !== "touchstart") e.preventDefault();
    setHolding(true);
    setCancelledMessage(false);
    emitInputAck("HOLD", "high_value_button");
    startTimeRef.current = Date.now();
    lastMilestoneRef.current = 0;

    const interval = 25; // 40fps progress tracking
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);

      // Trigger 1s discrete milestone ticks (1s, 2s, 3s, 4s)
      const currentSecond = Math.floor(elapsed / 1000);
      if (currentSecond > lastMilestoneRef.current && currentSecond < 5) {
        lastMilestoneRef.current = currentSecond;
        emitMilestone(currentSecond, 5);
      }

      if (elapsed >= durationMs) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setHolding(false);
        setProgress(100);
        setConfirmed(true);
        emitSuccess("HOLD", "HIGH_VALUE_CONFIRM", "transaction", `Approved ₹${amount.toLocaleString("en-IN")}`);
        if (onConfirmed) {
          onConfirmed();
        }
      }
    }, interval);
  };

  // Window blur / visibility change cancel invariant
  useEffect(() => {
    const handleBlur = () => {
      if (holding) cancelHold();
    };
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleBlur);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [holding, cancelHold]);

  const remainingSeconds = ((durationMs - (progress / 100) * durationMs) / 1000).toFixed(1);
  const currentStep = Math.min(5, Math.floor((progress / 100) * 5) + (progress > 0 ? 1 : 0));

  return (
    <div style={{ marginTop: 12 }}>
      {/* High-Value Safeguard Notice Banner */}
      <div
        style={{
          background: "#FFF9EC",
          border: "1px solid #F8DA9F",
          borderRadius: 8,
          padding: "8px 12px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          color: "#854E00",
          fontWeight: 700
        }}
      >
        <ShieldAlert size={16} color="#C47100" />
        <span>
          {language === "mr"
            ? `उच्च मूल्य संरक्षण: ₹${amount.toLocaleString("en-IN")} चा व्यवहार मंजूर करण्यासाठी ५ सेकंद दाबून धरा.`
            : language === "hi"
            ? `उच्च मूल्य सुरक्षा: ₹${amount.toLocaleString("en-IN")} का सौदा पक्का करने के लिए 5 सेकंड दबाकर रखें.`
            : `High-Value Safeguard: Hold button for 5s to commit to ₹${amount.toLocaleString("en-IN")} transaction.`}
        </span>
      </div>

      {/* Tactile Hold Button with Strict Cancel Invariants */}
      <div
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        style={{
          position: "relative",
          background: confirmed ? "#137333" : "#12151A",
          borderRadius: 12,
          border: confirmed ? "2px solid #2ED87B" : holding ? "2px solid var(--accent)" : "2px solid #282E38",
          overflow: "hidden",
          cursor: confirmed ? "default" : "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          padding: "16px 20px",
          color: "#FFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: holding ? "0 0 24px rgba(212, 255, 40, 0.45)" : "none",
          transition: "border-color 0.1s ease, box-shadow 0.15s ease"
        }}
      >
        {/* Animated Progress Fill Bar */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${progress}%`,
            background: "linear-gradient(to right, rgba(212, 255, 40, 0.25), rgba(212, 255, 40, 0.85))",
            zIndex: 1,
            pointerEvents: "none"
          }}
          transition={{ ease: "linear", duration: 0.025 }}
        />

        {/* Content over Progress Fill */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%" }}>
          {confirmed ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--accent)", fontWeight: 900, fontSize: 16 }}>
              <CheckCircle2 size={22} color="var(--accent)" />
              <span>
                {language === "mr" ? `व्यवहार मंजूर ₹${amount.toLocaleString("en-IN")}` : language === "hi" ? `सौदा स्वीकृत ₹${amount.toLocaleString("en-IN")}` : `TRANSACTION APPROVED ₹${amount.toLocaleString("en-IN")}`}
              </span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Lock size={16} color={holding ? "var(--accent)" : "#9499A1"} />
                <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.04em", color: holding ? "var(--accent)" : "#FFF", textTransform: "uppercase" }}>
                  {holding ? `${remainingSeconds}s... ${language === "mr" ? "दाबून ठेवा" : language === "hi" ? "दबाकर रखें" : "HOLDING..."}` : label}
                </span>
              </div>

              {/* Discrete 5-Segment Milestone Indicator (░░░░░░░░░░ -> ██████████) */}
              <div className="hold-milestone-ticks" style={{ maxWidth: 200, margin: "8px auto 0" }}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`hold-tick ${progress >= (step / 5) * 100 ? "active" : ""}`}
                    title={`${step}s`}
                  />
                ))}
              </div>

              <div style={{ fontSize: 11, color: "#A0A6B2", marginTop: 6 }}>
                {cancelledMessage ? (
                  <span className="status-cancelled">
                    <XCircle size={13} color="#CF1322" />
                    <span>
                      {language === "mr"
                        ? "सोडले — व्यवहार रद्द झाला (Not committed)"
                        : language === "hi"
                        ? "छोड़ा गया — सौदा रद्द हुआ (Not committed)"
                        : "Released early — Transaction not committed"}
                    </span>
                  </span>
                ) : (
                  subLabel
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
