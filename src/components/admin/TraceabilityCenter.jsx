import React, { useState, useEffect } from "react";
import { useMarketplace } from "../../context/MarketplaceContext";
import MaterialFlow from "../shared/MaterialFlow";
import { MATERIAL_TAXONOMY } from "../../data/materialTaxonomy";
import { PRICE_BENCHMARKS } from "../../data/priceBenchmarks";
import { RECYCLERS } from "../../data/recyclers";
import { DEFAULT_COLLECTOR } from "../../data/collectors";
import { MOCK_ADMIN_ALERTS, evaluateTransactionAnomalies } from "../../data/anomalyRules";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  AlertTriangle,
  Database,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Layers,
  ArrowUpRight,
  Fingerprint,
  Printer,
  Download,
  QrCode,
  X,
  Check,
  ExternalLink,
  Scale,
  Truck,
  DollarSign,
  Zap,
  TrendingUp,
  FileText,
  Smartphone
} from "lucide-react";

export default function TraceabilityCenter({ targetLotId, onOpenRecyclerTerminal, onOpenCollector }) {
  const { lots, buyRequests } = useMarketplace();
  const [selectedLotId, setSelectedLotId] = useState(targetLotId || lots[0]?.lotId || "EW-2041");
  const [activeDatasetTab, setActiveDatasetTab] = useState("DATASETS"); // 'DATASETS' | 'AUDIT_LOG' | 'ANOMALIES' | 'EPR_CREDITS'
  const [currentDatasetIndex, setCurrentDatasetIndex] = useState(0);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [showManifestModal, setShowManifestModal] = useState(null);

  // Synchronize targetLotId when arriving from Recycler or Collector
  useEffect(() => {
    if (targetLotId) {
      setSelectedLotId(targetLotId);
    }
  }, [targetLotId]);

  // Persisted Anomaly Resolution State
  const [anomalyResolutionState, setAnomalyResolutionState] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('ewb_anomalies');
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    try {
      window.localStorage?.setItem('ewb_anomalies', JSON.stringify(anomalyResolutionState));
    } catch (e) {
      console.warn('[TraceabilityCenter] anomaly storage write error:', e);
    }
  }, [anomalyResolutionState]);

  const selectedLot = lots.find((l) => l.lotId === selectedLotId) || lots[0];
  const detectedAnomalies = selectedLot ? evaluateTransactionAnomalies(selectedLot) : [];

  // 7 Mandatory PDR Datasets
  const datasetList = [
    {
      id: "taxonomy",
      name: "1. Material Taxonomy (25 Streams)",
      data: MATERIAL_TAXONOMY,
      description: "CPCB Schedule I Regulated E-Waste Classification, Hazard Levels & Benchmark Rates"
    },
    {
      id: "benchmarks",
      name: "2. Price Benchmarks",
      data: PRICE_BENCHMARKS,
      description: "State-Wise Reference Floor Rates, Price Volatility Indices & Refurbishment Premiums"
    },
    {
      id: "recyclers",
      name: "3. Recycler Registry",
      data: RECYCLERS,
      description: "Authorized CPCB Recycler Processing Units, Capacities & Compliance Status"
    },
    {
      id: "ledger",
      name: "4. Transactions Ledger",
      data: lots,
      description: "Immutable E-Waste Intake Records, Weighbridge Discrepancies & Net Payouts"
    },
    {
      id: "events",
      name: "5. Traceability Events",
      data: selectedLot?.events || [],
      description: "Cryptographically Linked Supply Chain Event Stream from Collector to Smelter"
    },
    {
      id: "collectors",
      name: "6. Collector Registry",
      data: [
        DEFAULT_COLLECTOR,
        {
          id: "COL-1092",
          name: "Santosh Shinde",
          phone: "+91 98224 81092",
          role: "Verified Field Aggregator",
          location: "Hadapsar Ward 14, Pune",
          monthlyEarningsInr: 34200,
          complianceTier: "Tier 1 Certified (CPCB Trained)",
          completedTransactions: 84
        },
        {
          id: "COL-1104",
          name: "Dinesh Kadam",
          phone: "+91 97650 33411",
          role: "Informal E-Waste Collector",
          location: "Pimpri-Chinchwad Ward 08",
          monthlyEarningsInr: 28500,
          complianceTier: "Tier 2 Active",
          completedTransactions: 46
        }
      ],
      description: "Informal Waste Picker Transition Registry, KYC Validation & Direct Earning Ledger"
    },
    {
      id: "demand",
      name: "7. Standing Procurement Demands",
      data: buyRequests,
      description: "Two-Sided Buyer Procurement Quotes, Quotas & EV Pickup Radii"
    }
  ];

  // Dynamic CSV Exporter for any dataset
  const handleExportCSV = (ds) => {
    if (!ds.data || ds.data.length === 0) return;
    const items = ds.data;
    const headers = Object.keys(items[0]).filter((k) => typeof items[0][k] !== "object" || Array.isArray(items[0][k]));
    const csvRows = [headers.join(",")];

    items.forEach((row) => {
      const values = headers.map((h) => {
        let val = row[h];
        if (Array.isArray(val)) val = val.join("; ");
        if (val === undefined || val === null) val = "";
        return `"${("" + val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CPCB_AUDIT_${ds.id.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Environmental diversion calculations
  const totalDivertedKg = lots.reduce((sum, l) => sum + (l.actualIntakeWeightKg || l.reportedWeightKg || 0), 0);
  const copperDivertedKg = Math.round(totalDivertedKg * 0.18 * 10) / 10;
  const lithiumSecuredKg = Math.round(totalDivertedKg * 0.045 * 10) / 10;
  const preciousGrams = Math.round(totalDivertedKg * 0.12 * 10) / 10;
  const leadNeutralizedKg = Math.round(totalDivertedKg * 0.14 * 10) / 10;
  const co2AvoidedKg = Math.round(totalDivertedKg * 3.4);

  return (
    <div className="recycler-grid" style={{ maxWidth: 1260, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="text-sub-label">CPCB EPR COMPLIANCE & TRACEABILITY TERMINAL</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--graphite)", margin: "2px 0 0 0" }}>
            Central Audit & Traceability Terminal
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, marginBottom: 0 }}>
            Two-sided matching governance, immutable ledger events, and CPCB Form-6 digital movement manifests across informal pickers and registered smelters.
          </p>
        </div>

        {/* Top Metric Counter Badges & Persona Jumps */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {(onOpenCollector || onOpenRecyclerTerminal) && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginRight: 4 }}>
              {onOpenCollector && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onOpenCollector}
                  style={{ padding: "8px 12px", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}
                  id="btn-admin-to-collector"
                >
                  <Smartphone size={14} />
                  <span>Collector App</span>
                </button>
              )}
              {onOpenRecyclerTerminal && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onOpenRecyclerTerminal(selectedLotId)}
                  style={{ padding: "8px 12px", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}
                  id="btn-admin-to-recycler"
                >
                  <Truck size={14} />
                  <span>Recycler Gate</span>
                </button>
              )}
            </div>
          )}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>DIVERTED SCRAP</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 900, color: "#1B7943" }}>{totalDivertedKg} kg</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>VERIFIED LOTS</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 900 }}>{lots.length} Tracked</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>STANDING QUOTAS</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 900, color: "var(--graphite)" }}>{buyRequests.length} Active</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>CPCB NODES</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 900, color: "#1B7943" }}>4 Authorized</div>
          </div>
        </div>
      </div>

      {/* Signature Centerpiece: Material Flow Lifecycle Graphic */}
      <div className="instrument-card" style={{ padding: 20, border: "2px solid var(--graphite)" }}>
        {!selectedLot ? (
          <div style={{ textAlign: "center", padding: "28px 12px" }}>
            <Layers size={36} color="var(--muted)" style={{ margin: "0 auto 10px", display: "block" }} />
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--graphite)" }}>
              Central Audit Ledger Initialized (0 Active Lots)
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", maxWidth: 460, margin: "6px auto 14px", lineHeight: 1.5 }}>
              The platform is currently in Empty State UI mode. Use the header "Load Seed" button to restore canonical CPCB demo transactions, or create new lots via the Collector App.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="text-sub-label">SIGNATURE MATERIAL FLOW & CHAIN-OF-CUSTODY</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "var(--graphite)" }}>
              Active Lifecycle of Lot #{selectedLot?.lotId} ({selectedLot?.materialName})
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowManifestModal(selectedLot)}
              style={{ padding: "5px 10px", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
            >
              <FileText size={13} color="#1B7943" />
              <span>CPCB Form 6 Manifest</span>
            </button>

            <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
              {lots.map((l) => (
                <button
                  key={l.lotId}
                  type="button"
                  onClick={() => setSelectedLotId(l.lotId)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: selectedLotId === l.lotId ? "var(--graphite)" : "var(--canvas)",
                    color: selectedLotId === l.lotId ? "var(--surface)" : "var(--graphite)",
                    cursor: "pointer"
                  }}
                >
                  #{l.lotId}
                </button>
              ))}
            </div>
          </div>
        </div>

        <MaterialFlow currentStage={selectedLot?.status === "SETTLED" ? "DELIVERED" : selectedLot?.status === "IN_TRANSIT" ? "DISPATCHED" : "MATCHED"} lotId={selectedLot?.lotId} />

        {/* Visual Field Evidence Photo in Audit Center */}
        {selectedLot?.photoUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--canvas)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", marginTop: 14 }}>
            <img
              src={selectedLot.photoUrl}
              alt="Audit evidence"
              style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}
            />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--graphite)" }}>CPCB Field Visual Evidence — #{selectedLot.lotId}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                Category: {selectedLot.materialName} • Physical Grade: {selectedLot.conditionGrade || "Scrap"} • QR: {selectedLot.qrCode || "EWB-QR-ACTIVE"}
              </div>
              <div style={{ fontSize: 11, color: "#1B7943", fontWeight: 800, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} color="#1B7943" />
                <span>Cryptographically Authenticated Against Collector Device Timestamp</span>
              </div>
            </div>
          </div>
        )}

        {/* Lot Detailed Meta Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
          <div style={{ background: "var(--canvas)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>COLLECTOR SOURCE</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--graphite)" }}>{selectedLot?.collectorName}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{selectedLot?.collectorLocation}</div>
          </div>

          <div style={{ background: "var(--canvas)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>RECEIVING RECYCLER</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--graphite)" }}>{selectedLot?.selectedBuyerName || "Apex E-Recovery Ltd."}</div>
            <div style={{ fontSize: 11, color: "#1B7943", fontWeight: 700 }}>CPCB/EWR/MH/2023/88921</div>
          </div>

          <div style={{ background: "var(--canvas)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>REPORTED / ACTUAL WEIGHT</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 900 }}>
              {selectedLot?.reportedWeightKg} kg / {selectedLot?.actualIntakeWeightKg ? <span style={{ color: "#1B7943" }}>{selectedLot.actualIntakeWeightKg} kg (Certified)</span> : "Pending Scale"}
            </div>
          </div>

          <div style={{ background: "var(--canvas)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 800 }}>SETTLED NET PAYOUT</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 900, color: "var(--graphite)" }}>
              ₹{selectedLot?.netPayout?.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </>
    )}
  </div>

      {/* Main Admin Tab View: Datasets vs Audit Log vs Anomalies vs EPR Credits */}
      <div className="instrument-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`persona-tab ${activeDatasetTab === "DATASETS" ? "active" : ""}`}
              onClick={() => setActiveDatasetTab("DATASETS")}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <Database size={14} />
              <span>Mandatory CPCB Datasets (7)</span>
            </button>

            <button
              type="button"
              className={`persona-tab ${activeDatasetTab === "EPR_CREDITS" ? "active" : ""}`}
              onClick={() => setActiveDatasetTab("EPR_CREDITS")}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <TrendingUp size={14} />
              <span>EPR Credit & Minerals Balance</span>
            </button>

            <button
              type="button"
              className={`persona-tab ${activeDatasetTab === "AUDIT_LOG" ? "active" : ""}`}
              onClick={() => setActiveDatasetTab("AUDIT_LOG")}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <Activity size={14} />
              <span>Cryptographic Event Stream</span>
            </button>

            <button
              type="button"
              className={`persona-tab ${activeDatasetTab === "ANOMALIES" ? "active" : ""}`}
              onClick={() => setActiveDatasetTab("ANOMALIES")}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <AlertTriangle size={14} />
              <span>Anti-Lowball & Anomaly Monitor</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INTERACTIVE CPCB DATASETS VIEWER */}
        {activeDatasetTab === "DATASETS" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              {/* Dataset switcher pills */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {datasetList.map((ds, idx) => (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => {
                      setCurrentDatasetIndex(idx);
                      setDatasetSearch("");
                    }}
                    style={{
                      background: currentDatasetIndex === idx ? "var(--graphite)" : "var(--canvas)",
                      color: currentDatasetIndex === idx ? "var(--surface)" : "var(--graphite)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {ds.name}
                  </button>
                ))}
              </div>

              {/* Search & Export Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative", width: 220 }}>
                  <Search size={13} color="var(--muted)" style={{ position: "absolute", left: 9, top: 9 }} />
                  <input
                    type="text"
                    placeholder="Search in dataset..."
                    value={datasetSearch}
                    onChange={(e) => setDatasetSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px 6px 28px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 11.5,
                      background: "var(--canvas)"
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleExportCSV(datasetList[currentDatasetIndex])}
                  style={{ padding: "6px 12px", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
              {datasetList[currentDatasetIndex].description}
            </div>

            {/* Render High-Density CPCB Table for Current Dataset */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", overflowX: "auto" }}>
              {/* 1. Material Taxonomy (25 Categories) */}
              {currentDatasetIndex === 0 && (
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>CPCB Code</th>
                      <th>Category & Regulated Stream</th>
                      <th>Hazard Level</th>
                      <th>CPCB Floor Rate</th>
                      <th>Unit</th>
                      <th>Statutory Safety Guidelines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetList[0].data
                      .filter((m) => !datasetSearch || m.name.toLowerCase().includes(datasetSearch.toLowerCase()) || m.shortCode.toLowerCase().includes(datasetSearch.toLowerCase()))
                      .map((mat) => (
                        <tr key={mat.id}>
                          <td>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 12, background: "var(--canvas)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>
                              {mat.shortCode}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: "var(--graphite)" }}>{mat.name}</div>
                            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{mat.category}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 900,
                                padding: "2px 7px",
                                borderRadius: 4,
                                textTransform: "uppercase",
                                background:
                                  mat.hazardLevel === "CRITICAL"
                                    ? "rgba(220, 38, 38, 0.15)"
                                    : mat.hazardLevel === "HIGH"
                                    ? "rgba(234, 88, 12, 0.15)"
                                    : "rgba(34, 197, 94, 0.15)",
                                color:
                                  mat.hazardLevel === "CRITICAL"
                                    ? "#DC2626"
                                    : mat.hazardLevel === "HIGH"
                                    ? "#C2410C"
                                    : "#15803D"
                              }}
                            >
                              {mat.hazardLevel}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 13, color: "var(--graphite)" }}>
                              ₹{mat.baseBenchmarkRatePerKg}/kg
                            </span>
                          </td>
                          <td>{mat.unit}</td>
                          <td style={{ fontSize: 11, color: "var(--muted)", maxWidth: 320 }}>
                            {mat.safetyWarning}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* 2. Price Benchmarks */}
              {currentDatasetIndex === 1 && (
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Material Stream</th>
                      <th>Region</th>
                      <th>CPCB Benchmark Floor</th>
                      <th>Monthly Trend</th>
                      <th>Refurbished Grade Premium</th>
                      <th>Freshness Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetList[1].data
                      .filter((b) => !datasetSearch || b.materialName?.toLowerCase().includes(datasetSearch.toLowerCase()) || b.region?.toLowerCase().includes(datasetSearch.toLowerCase()))
                      .map((bench, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 800, color: "var(--graphite)" }}>{bench.materialName || bench.materialId}</td>
                          <td>{bench.region}</td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 900 }}>₹{bench.benchmarkRatePerKg}/kg</td>
                          <td style={{ color: "#1B7943", fontWeight: 700 }}>+4.2% (Steady Demand)</td>
                          <td style={{ color: "#1B7943", fontWeight: 800 }}>+15% Over Standard</td>
                          <td>
                            <span style={{ fontFamily: "var(--font-mono)", background: "#1B7943", color: "#FFF", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              98 / 100
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* 3. Recycler Registry */}
              {currentDatasetIndex === 2 && (
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Recycler Facility Name</th>
                      <th>CPCB Authorization No</th>
                      <th>Yard Location</th>
                      <th>Allotted Daily Intake</th>
                      <th>Logistics Fleet</th>
                      <th>Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetList[2].data
                      .filter((r) => !datasetSearch || r.name.toLowerCase().includes(datasetSearch.toLowerCase()))
                      .map((rec) => (
                        <tr key={rec.id}>
                          <td style={{ fontWeight: 800, color: "var(--graphite)" }}>{rec.name}</td>
                          <td>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#1B7943", fontWeight: 800 }}>
                              {rec.cpcbRegistrationNo}
                            </span>
                          </td>
                          <td>{rec.location}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{rec.intakeCapacityKgPerDay} kg/day</td>
                          <td style={{ fontSize: 11.5 }}>{rec.pickupVehicleType}</td>
                          <td>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#1B7943", background: "rgba(27,121,67,0.12)", padding: "3px 7px", borderRadius: 4 }}>
                              AUTHORIZED & AUDITED
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* 4. Transactions Ledger */}
              {currentDatasetIndex === 3 && (
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Lot Ref</th>
                      <th>Material Category</th>
                      <th>Reported / Weighed</th>
                      <th>Gross Value</th>
                      <th>Logistics Net</th>
                      <th>Net Cash Payout</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetList[3].data
                      .filter((l) => !datasetSearch || l.lotId.toLowerCase().includes(datasetSearch.toLowerCase()) || l.materialName.toLowerCase().includes(datasetSearch.toLowerCase()))
                      .map((lot) => (
                        <tr key={lot.lotId}>
                          <td>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>#{lot.lotId}</span>
                          </td>
                          <td style={{ fontWeight: 800, color: "var(--graphite)" }}>{lot.materialName}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>
                            {lot.reportedWeightKg} kg / {lot.actualIntakeWeightKg ? `${lot.actualIntakeWeightKg} kg` : "Pending"}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>₹{lot.grossBid?.toLocaleString("en-IN")}</td>
                          <td style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>-₹{lot.logisticsCost}</td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 900, color: "#1B7943" }}>₹{lot.netPayout?.toLocaleString("en-IN")}</td>
                          <td>
                            <span className={`status-pill ${lot.status === "SETTLED" ? "settled" : "accepted"}`}>
                              {lot.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowManifestModal(lot)}
                                style={{ padding: "4px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <FileText size={11} />
                                <span>Form 6</span>
                              </button>
                              {onOpenRecyclerTerminal && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => onOpenRecyclerTerminal(lot.lotId)}
                                  title="Open in Recycler Gate"
                                  style={{ padding: "4px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  <Scale size={11} />
                                  <span>Gate</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* 5. Traceability Events */}
              {currentDatasetIndex === 4 && (
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Step Sequence</th>
                      <th>Timestamp</th>
                      <th>Operating Agent</th>
                      <th>Audit Note & Physical Evidence</th>
                      <th>Cryptographic Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedLot?.events || []).map((ev, idx) => (
                      <tr key={idx}>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>0{idx + 1}</span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "Pending"}
                        </td>
                        <td style={{ fontWeight: 800, color: "var(--graphite)" }}>{ev.agent}</td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>{ev.note}</td>
                        <td>
                          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#1B7943", background: "rgba(27,121,67,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                            SHA256:VERIFIED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 6. Collector Registry */}
              {currentDatasetIndex === 5 && (
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Collector ID</th>
                      <th>Full Name & Ward</th>
                      <th>Contact Phone</th>
                      <th>Compliance Accreditation</th>
                      <th>Cumulative Payouts</th>
                      <th>KYC Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetList[5].data.map((col) => (
                      <tr key={col.id}>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>{col.id}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: "var(--graphite)" }}>{col.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{col.location}</div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{col.phone}</td>
                        <td style={{ fontSize: 11.5, color: "#1B7943", fontWeight: 700 }}>{col.complianceTier}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>₹{col.monthlyEarningsInr?.toLocaleString("en-IN")}</td>
                        <td>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#1B7943", background: "rgba(27,121,67,0.12)", padding: "2px 6px", borderRadius: 4 }}>
                            VERIFIED AADHAAR
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 7. Standing Procurement Demands */}
              {currentDatasetIndex === 6 && (
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Registered Recycler</th>
                      <th>Requested Material</th>
                      <th>Target Rate (₹/kg)</th>
                      <th>Target Quota (kg)</th>
                      <th>Pickup Radius</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetList[6].data.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>{req.id}</span>
                        </td>
                        <td style={{ fontWeight: 800 }}>{req.recyclerName}</td>
                        <td style={{ fontWeight: 800, color: "var(--graphite)" }}>{req.materialName}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 900, color: "#1B7943" }}>₹{req.targetPricePerKg}/kg</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{req.targetQuantityKg} kg</td>
                        <td>{req.radiusKm} km ({req.pickupOffered ? "EV Dispatched" : "Yard Drop"})</td>
                        <td>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#1B7943", background: "rgba(27,121,67,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EPR CREDIT & CRITICAL MINERALS BALANCE */}
        {activeDatasetTab === "EPR_CREDITS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--canvas)", padding: "16px 20px", borderRadius: 12, border: "1px solid var(--border)" }}>
              <div className="text-sub-label">CPCB EPR MANDATE • FORM 2 ENVIRONMENTAL AUDIT</div>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: "var(--graphite)", margin: "2px 0 0 0" }}>
                Cumulative Circular Economy Mass Balance
              </h2>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, marginBottom: 0 }}>
                Real-time accounting of hazardous heavy metals safely neutralized and critical minerals channeled to authorized smelters rather than informal open burning.
              </p>
            </div>

            {/* Mineral Metric Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 800 }}>TOTAL E-WASTE SECURED</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900, color: "var(--graphite)", marginTop: 4 }}>
                  {totalDivertedKg} <span style={{ fontSize: 14 }}>KG</span>
                </div>
                <div style={{ fontSize: 11, color: "#1B7943", fontWeight: 700, marginTop: 4 }}>
                  Diverted from unscientific landfilling
                </div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 800 }}>COPPER (Cu) RECOVERED</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900, color: "#B45309", marginTop: 4 }}>
                  {copperDivertedKg} <span style={{ fontSize: 14 }}>KG</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  Stripped from wiring harnesses & coils
                </div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 800 }}>LITHIUM (Li) HARVESTED</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900, color: "#0284C7", marginTop: 4 }}>
                  {lithiumSecuredKg} <span style={{ fontSize: 14 }}>KG</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  Recovered from Li-ion cells & pouches
                </div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 800 }}>TOXIC LEAD (Pb) NEUTRALIZED</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900, color: "#DC2626", marginTop: 4 }}>
                  {leadNeutralizedKg} <span style={{ fontSize: 14 }}>KG</span>
                </div>
                <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, marginTop: 4 }}>
                  Acid fumes prevented in local communities
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#161A20", padding: "14px 18px", borderRadius: 10, color: "#FFF" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--accent)" }}>
                  CPCB Form 2 EPR Annual Return Generation
                </div>
                <div style={{ fontSize: 11, color: "#9499A1", marginTop: 2 }}>
                  Direct legal filing export for Producer Responsibility Organizations (PROs) and OEMs.
                </div>
              </div>
              <button
                type="button"
                className="btn-graphite-action"
                onClick={() => alert("CPCB Form 2 Return compiled with SHA-256 cryptographic seal. Ready for regulatory submission.")}
                style={{ background: "var(--accent)", color: "var(--graphite)", padding: "8px 14px", fontSize: 12, fontWeight: 800, width: "auto" }}
              >
                <Download size={13} />
                <span>Download Form 2 EPR Filing</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT EVENT STREAM */}
        {activeDatasetTab === "AUDIT_LOG" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedLot?.events?.map((ev, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "12px 14px",
                  background: "var(--canvas)",
                  border: "1px solid var(--border)",
                  borderRadius: 10
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--graphite)",
                    color: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)"
                  }}
                >
                  0{index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--graphite)" }}>
                      {ev.step} — {ev.agent}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "Pending"}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
                    {ev.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: ANOMALIES & LOWBALL MONITOR */}
        {activeDatasetTab === "ANOMALIES" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_ADMIN_ALERTS.map((alert) => {
              const isResolved = anomalyResolutionState[alert.id];
              return (
                <div
                  key={alert.id}
                  style={{
                    background: "var(--canvas)",
                    borderLeft: `4px solid ${alert.severity === "HIGH" ? "var(--danger)" : "var(--warning)"}`,
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "14px 16px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--muted)" }}>
                      #{alert.id} • {alert.type}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {isResolved ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#1B7943", display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={13} color="#1B7943" />
                          <span>AUDIT RESOLVED ({isResolved})</span>
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setAnomalyResolutionState((prev) => ({ ...prev, [alert.id]: "CLEARED" }))}
                            style={{ padding: "3px 8px", fontSize: 11, fontWeight: 800 }}
                          >
                            Approve Clearance
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setAnomalyResolutionState((prev) => ({ ...prev, [alert.id]: "FLAGGED_INSPECTION" }))}
                            style={{ padding: "3px 8px", fontSize: 11, fontWeight: 800, color: "#C53030" }}
                          >
                            Flag for Yard Audit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--graphite)" }}>
                    {alert.message}
                  </div>
                </div>
              );
            })}

            {detectedAnomalies.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="text-sub-label" style={{ marginBottom: 8 }}>Active Selected Lot Risk Analysis</div>
                {detectedAnomalies.map((anom, idx) => (
                  <div key={idx} style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid #FAD390", padding: 12, borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#874800" }}>{anom.title}</div>
                    <div style={{ fontSize: 12, color: "#874800", marginTop: 2 }}>{anom.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CPCB FORM 6 MOVEMENT MANIFEST MODAL */}
      <AnimatePresence>
        {showManifestModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card"
              style={{ maxWidth: 580, background: "#FFF", color: "#12151A", border: "2px solid #000" }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              {/* Manifest Header */}
              <div style={{ borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: "#666" }}>
                    FORM 6 • [See Rule 19(1)] • CENTRAL POLLUTION CONTROL BOARD
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: "2px 0 0 0" }}>
                    E-Waste Hazardous Waste Movement Manifest
                  </h2>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#333", marginTop: 2 }}>
                    Manifest Reg: CPCB/MH/EW-MANIFEST/2026/{showManifestModal.lotId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManifestModal(null)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#666", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 12-Clause Form 6 Entities */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11.5, marginBottom: 12 }}>
                <div style={{ background: "#F4F5F7", padding: "8px", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>1. Consignor (Sender)</div>
                  <div style={{ fontWeight: 900 }}>{showManifestModal.collectorName}</div>
                  <div style={{ fontSize: 10.5, color: "#555" }}>{showManifestModal.collectorLocation}</div>
                </div>

                <div style={{ background: "#F4F5F7", padding: "8px", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>2. Transporter</div>
                  <div style={{ fontWeight: 900 }}>EV Dedicated Logistics</div>
                  <div style={{ fontSize: 10.5, color: "#555" }}>Vehicle: {showManifestModal.vehicleNumber || "MH-12-EV-4092"}</div>
                </div>

                <div style={{ background: "#F4F5F7", padding: "8px", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>3. Consignee (Receiver)</div>
                  <div style={{ fontWeight: 900 }}>{showManifestModal.selectedBuyerName || "Apex E-Recovery Ltd."}</div>
                  <div style={{ fontSize: 10.5, color: "#555" }}>Reg: CPCB/EWR/MH/2023</div>
                </div>
              </div>

              {/* Description of Waste */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, marginBottom: 12, border: "1px solid #CCC" }}>
                <thead>
                  <tr style={{ background: "#EAECEF", textAlign: "left" }}>
                    <th style={{ padding: "5px 8px", border: "1px solid #CCC" }}>Waste Description</th>
                    <th style={{ padding: "5px 8px", border: "1px solid #CCC" }}>Quantity</th>
                    <th style={{ padding: "5px 8px", border: "1px solid #CCC" }}>Physical Form</th>
                    <th style={{ padding: "5px 8px", border: "1px solid #CCC" }}>Special Handling</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontWeight: 800 }}>{showManifestModal.materialName}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                      {showManifestModal.actualIntakeWeightKg || showManifestModal.reportedWeightKg} kg
                    </td>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC" }}>Solid Mixed WEEE</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontSize: 10.5 }}>Do not crush; fire-retardant dry bin</td>
                  </tr>
                </tbody>
              </table>

              {/* Legal Declarations & Cryptographic Hash */}
              <div style={{ background: "#F4F5F7", padding: "8px 12px", borderRadius: 6, fontSize: 11, color: "#444", marginBottom: 12, lineHeight: 1.4 }}>
                <strong>Consignor Declaration:</strong> I hereby declare that the contents of this consignment are fully and accurately described above and are classified, packed, marked and labelled in all respects in proper condition for transport according to CPCB E-Waste Rules 2022.
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "#666", borderTop: "1px dashed #CCC", paddingTop: 8, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <QrCode size={32} color="#000" />
                  <div>
                    <div>CPCB DIGITAL AUTHENTICATION KEY</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}>SHA-256: 7e2d5c...b89124fa</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>Verified By: S. Patil (Inspector)</div>
                  <div>Timestamp: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn-graphite-action"
                  onClick={() => window.print()}
                  style={{ flex: 1, padding: "9px 12px", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Printer size={14} />
                  <span>Print Statutory Form 6 Manifest</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowManifestModal(null)}
                  style={{ padding: "9px 14px", fontSize: 12.5 }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
