import React, { useState } from "react";
import { useMarketplace } from "../../context/MarketplaceContext";
import { Wifi, WifiOff, ShieldCheck, Layers, Truck, Smartphone, RotateCcw, Database, FileText } from "lucide-react";
import FieldResearchModal from "../collector/FieldResearchModal";

export default function AppHeader() {
  const {
    activePersona,
    setActivePersona,
    networkState,
    toggleNetworkState,
    lots,
    resetDemoData,
    resetToEmpty,
    loadSeedData
  } = useMarketplace();

  const [showHeaderResearch, setShowHeaderResearch] = useState(false);

  const pendingIntakeCount = (lots || []).filter((l) => l.status !== "SETTLED" && l.status !== "CLOSED").length;
  const totalLotsCount = (lots || []).length;

  return (
    <header className="system-nav">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="brand-mark">
          <span style={{ letterSpacing: "-0.03em" }}>E-WASTE BRIDGE</span>
          <span className="brand-badge">SIH 2026 • PS2</span>
        </div>

        {/* Demo Persona Switcher (For Judges) */}
        <nav className="persona-switcher" aria-label="Persona Navigation">
          <button
            className={`persona-tab ${activePersona === "collector" ? "active" : ""}`}
            onClick={() => setActivePersona("collector")}
            id="tab-collector"
          >
            <Smartphone size={14} />
            <span>Collector (Mobile App)</span>
          </button>

          <button
            className={`persona-tab ${activePersona === "recycler" ? "active" : ""}`}
            onClick={() => setActivePersona("recycler")}
            id="tab-recycler"
          >
            <Truck size={14} />
            <span>Recycler Ops (Desktop)</span>
            {pendingIntakeCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 900,
                  background: activePersona === "recycler" ? "var(--graphite)" : "rgba(27, 121, 67, 0.15)",
                  color: activePersona === "recycler" ? "var(--accent)" : "#1B7943",
                  padding: "1px 6px",
                  borderRadius: 10,
                  marginLeft: 4
                }}
                title={`${pendingIntakeCount} lot(s) awaiting weighbridge intake`}
              >
                {pendingIntakeCount}
              </span>
            )}
          </button>

          <button
            className={`persona-tab ${activePersona === "admin" ? "active" : ""}`}
            onClick={() => setActivePersona("admin")}
            id="tab-admin"
          >
            <Layers size={14} />
            <span>Admin & Trace (CPCB)</span>
            {totalLotsCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  background: "var(--surface)",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                  padding: "1px 5px",
                  borderRadius: 10,
                  marginLeft: 4
                }}
                title={`${totalLotsCount} registered lots in central ledger`}
              >
                {totalLotsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="system-controls">
        {/* Judge Network Disruption Simulator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>
            Field Simulation:
          </span>
          <button
            className={`network-pill ${networkState === "ONLINE" ? "online" : "offline"}`}
            onClick={toggleNetworkState}
            id="btn-toggle-network-sim"
            title="Click to simulate network disconnection and test offline caching & auto-sync"
          >
            {networkState === "ONLINE" ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{networkState === "ONLINE" ? "ONLINE (5G SYNCED)" : "OFFLINE (DISCONNECTED)"}</span>
            <span className="pulse-dot" />
          </button>

          {/* Database Controls: Load Seed & Reset to Empty State */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (window.confirm("Load canonical raw seed dataset (3 CPCB lifecycle lots, live demands, benchmark rates)?")) {
                loadSeedData();
              }
            }}
            style={{ padding: "5px 9px", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 5, color: "#1B7943" }}
            title="Populate full canonical seed dataset into database and UI"
            id="btn-load-seed-data"
          >
            <Database size={12} />
            <span>Load Seed</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (window.confirm("Reset database to Empty State UI (0 lots, 0 demands, clean ledger)?")) {
                resetToEmpty();
              }
            }}
            style={{ padding: "5px 9px", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 5, color: "var(--muted)" }}
            title="Reset database to pristine Empty State UI"
            id="btn-reset-to-empty"
          >
            <RotateCcw size={12} />
            <span>Empty UI</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowHeaderResearch(true)}
            style={{ padding: "5px 9px", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}
            title="View Ground-Truth Field Research Dossiers & Unit Economics Model"
            id="btn-header-research"
          >
            <FileText size={12} />
            <span>Research & Economics</span>
          </button>
        </div>
      </div>

      <FieldResearchModal
        isOpen={showHeaderResearch}
        onClose={() => setShowHeaderResearch(false)}
      />
    </header>
  );
}

