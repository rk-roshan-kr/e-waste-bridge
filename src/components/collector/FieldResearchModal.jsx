import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet,
  Building,
  Quote,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { FIELD_RESEARCH_CASE_STUDIES, UNIT_ECONOMICS_DATA } from "../../database/seedData";
import { emitInputAck } from "../../services/feedbackDispatcher";

export default function FieldResearchModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("RESEARCH"); // 'RESEARCH' | 'ECONOMICS'

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 15, 29, 0.7)",
          backdropFilter: "blur(5px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--surface)",
            width: "100%",
            maxWidth: 680,
            borderRadius: 18,
            border: "1px solid var(--border)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.35)",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--canvas)"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="text-sub-label" style={{ fontSize: 10 }}>
                  SIH PS-2 FIELD DOSSIER
                </span>
                <span
                  style={{
                    background: "#E8F0FE",
                    color: "#1967D2",
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 4
                  }}
                >
                  GROUND TRUTH VALIDATION
                </span>
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "var(--graphite)",
                  margin: "2px 0 0 0"
                }}
              >
                Field Research & Unit Economics Model
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--graphite)"
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)"
            }}
          >
            <button
              type="button"
              onClick={() => {
                emitInputAck("TOUCH", "tab_research");
                setActiveTab("RESEARCH");
              }}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "RESEARCH" ? "2.5px solid var(--graphite)" : "2.5px solid transparent",
                fontWeight: activeTab === "RESEARCH" ? 900 : 700,
                fontSize: 13,
                color: activeTab === "RESEARCH" ? "var(--graphite)" : "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <UserCheck size={16} />
              <span>1. Collector Case Studies (2 Profiles)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                emitInputAck("TOUCH", "tab_economics");
                setActiveTab("ECONOMICS");
              }}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === "ECONOMICS" ? "2.5px solid var(--graphite)" : "2.5px solid transparent",
                fontWeight: activeTab === "ECONOMICS" ? 900 : 700,
                fontSize: 13,
                color: activeTab === "ECONOMICS" ? "var(--graphite)" : "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <TrendingUp size={16} />
              <span>2. Unit Economics (+40.8% Net Uplift)</span>
            </button>
          </div>

          {/* Content Area */}
          <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
            {activeTab === "RESEARCH" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {FIELD_RESEARCH_CASE_STUDIES.map((cs) => (
                  <div
                    key={cs.id}
                    style={{
                      background: "var(--canvas)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: 16
                    }}
                  >
                    {/* Persona Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: "var(--graphite)" }}>
                            {cs.collectorName}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>
                            (Age {cs.age}, {cs.experienceYears} Years Experience)
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          {cs.cluster}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#E6F4EA",
                          color: "#137333",
                          border: "1px solid #CEEAD6",
                          borderRadius: 8,
                          padding: "4px 8px",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 900
                        }}
                      >
                        +{cs.incomeGainPercent}% Income Uplift
                      </div>
                    </div>

                    {/* Verbatim Quote Box */}
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        background: "var(--surface)",
                        borderLeft: "3px solid #1B7943",
                        borderRadius: "0 8px 8px 0",
                        fontSize: 12,
                        color: "var(--graphite)",
                        fontStyle: "italic",
                        lineHeight: 1.5
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, fontStyle: "normal", fontSize: 10, fontWeight: 800, color: "var(--muted)" }}>
                        <Quote size={12} color="#1B7943" />
                        <span>VERBATIM VERNACULAR STATEMENT</span>
                      </div>
                      <p style={{ margin: "0 0 4px 0" }}>"{cs.keyQuotes.hi}"</p>
                      <p style={{ margin: 0, color: "var(--muted)" }}>"{cs.keyQuotes.mr}"</p>
                    </div>

                    {/* Operational Metrics Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: 8,
                        marginTop: 12
                      }}
                    >
                      <div style={{ background: "var(--surface)", padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>DAILY VOLUME</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--graphite)", marginTop: 2 }}>
                          {cs.dailyCollectionKg}
                        </div>
                      </div>
                      <div style={{ background: "var(--surface)", padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>INFORMAL BASELINE</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#B3261E", marginTop: 2 }}>
                          ₹{cs.baselineMonthlyIncome.toLocaleString("en-IN")}/mo
                        </div>
                      </div>
                      <div style={{ background: "var(--surface)", padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>PLATFORM NET</div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "#1B7943", marginTop: 2 }}>
                          ₹{cs.platformProjectedIncome.toLocaleString("en-IN")}/mo
                        </div>
                      </div>
                    </div>

                    {/* Critical Findings */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--graphite)", marginBottom: 6 }}>
                        Field Pain Points & Why Formalization Previously Failed:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
                        {cs.criticalFindings.map((finding, idx) => (
                          <li key={idx} style={{ marginBottom: 2 }}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Comparison Table */}
                <div style={{ background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--graphite)", marginBottom: 4 }}>
                    Itemized Net Income Comparison: Middleman vs E-Waste Bridge
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                    Based on standard monthly scrap distribution for an active Mumbai/Pune aggregator.
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid var(--border)", textAlign: "left" }}>
                        <th style={{ padding: "6px 4px", color: "var(--muted)", fontWeight: 800 }}>E-Waste Stream</th>
                        <th style={{ padding: "6px 4px", color: "var(--muted)", fontWeight: 800, textAlign: "right" }}>Informal Rate</th>
                        <th style={{ padding: "6px 4px", color: "var(--muted)", fontWeight: 800, textAlign: "right" }}>Informal Payout</th>
                        <th style={{ padding: "6px 4px", color: "var(--graphite)", fontWeight: 900, textAlign: "right" }}>Platform Rate</th>
                        <th style={{ padding: "6px 4px", color: "#1B7943", fontWeight: 900, textAlign: "right" }}>Platform Payout</th>
                        <th style={{ padding: "6px 4px", color: "#1B7943", fontWeight: 900, textAlign: "right" }}>Net Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {UNIT_ECONOMICS_DATA.informalVsPlatformTable.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px 4px", fontWeight: 800, color: "var(--graphite)" }}>{row.stream}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>₹{row.informalRate}/kg</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", color: "#B3261E", fontFamily: "var(--font-mono)" }}>₹{row.informalPayout}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: 800, fontFamily: "var(--font-mono)" }}>₹{row.platformRate}/kg</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: 900, color: "#1B7943", fontFamily: "var(--font-mono)" }}>₹{row.platformPayout}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: 900, color: "#1B7943", fontFamily: "var(--font-mono)" }}>
                            +₹{row.netGain} <span style={{ fontSize: 9.5 }}>({row.gainPercent})</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Banner */}
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      background: "#E6F4EA",
                      borderRadius: 10,
                      border: "1px solid #CEEAD6",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#137333" }}>TOTAL MONTHLY CASH IN HAND</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>Baseline: ₹18,450 vs Platform: ₹25,980</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 900, color: "#137333" }}>
                        +₹7,530 / month
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "#137333" }}>+40.8% Net Income Uplift</div>
                    </div>
                  </div>
                </div>

                {/* Sustainability & Revenue Model */}
                <div style={{ background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--graphite)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Building size={16} />
                    <span>Platform Sustainability & 1.75% Recycler Facilitation Fee Model</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--graphite)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--muted)", fontWeight: 700 }}>Waste Collector Fee:</span>
                      <span style={{ fontWeight: 900, color: "#1B7943" }}>{UNIT_ECONOMICS_DATA.platformSustainabilityModel.collectorFee}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--muted)", fontWeight: 700 }}>Recycler Facilitation Fee:</span>
                      <span style={{ fontWeight: 900, color: "var(--graphite)" }}>{UNIT_ECONOMICS_DATA.platformSustainabilityModel.recyclerFacilitationFee}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--muted)", fontWeight: 700 }}>Why Recyclers Pay:</span>
                      <span style={{ maxWidth: 360, textAlign: "right", color: "var(--muted)" }}>{UNIT_ECONOMICS_DATA.platformSustainabilityModel.whyRecyclersPay}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ color: "var(--muted)", fontWeight: 700 }}>Neural Inference OPEX:</span>
                      <span style={{ fontWeight: 800, color: "#1B7943" }}>{UNIT_ECONOMICS_DATA.platformSustainabilityModel.serverlessEdgeOpex}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
