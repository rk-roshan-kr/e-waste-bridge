import React, { useState, useEffect } from "react";
import { useMarketplace } from "../../context/MarketplaceContext";
import { RECYCLERS } from "../../data/recyclers";
import { MATERIAL_TAXONOMY } from "../../data/materialTaxonomy";
import MaterialFlow from "../shared/MaterialFlow";
import { parseVoiceIntent } from "../../services/voiceIntentEngine";
import { useAppDispatch } from "../../state/AppStateContext";
import { AppActions } from "../../state/AppActions";
import { motion, AnimatePresence } from "motion/react";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  Printer,
  ChevronRight,
  Plus,
  Sparkles,
  Layers,
  Clock,
  Mic,
  Volume2,
  VolumeX,
  X,
  Zap,
  Check,
  FileText,
  QrCode,
  RefreshCw,
  Sliders,
  ChevronDown,
  Download,
  Smartphone,
  Package
} from "lucide-react";

export default function RecyclerTerminal({ targetLotId, onClearTargetLot, onOpenAdminTrace, onOpenCollector }) {
  const { lots, confirmIntakeAndSettle, buyRequests, createBuyRequest } = useMarketplace();
  const dispatch = useAppDispatch();
  const currentRecycler = RECYCLERS[0]; // Apex E-Recovery Ltd.

  // Automatically open weigh modal if navigated with a specific lot ID
  useEffect(() => {
    if (targetLotId && lots && lots.length > 0) {
      const target = lots.find((l) => l.lotId === targetLotId);
      if (target && target.status !== "SETTLED") {
        handleOpenWeighModal(target);
        if (onClearTargetLot) onClearTargetLot();
      }
    }
  }, [targetLotId, lots]);

  const [mainSection, setMainSection] = useState("QUEUE"); // 'QUEUE' | 'DEMAND_BOARD'
  const [filterTab, setFilterTab] = useState("ALL"); // 'ALL' | 'PENDING_INTAKE' | 'SETTLED'
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalLot, setActiveModalLot] = useState(null);
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [showGatePassModal, setShowGatePassModal] = useState(null);

  // Industrial Weighbridge state for activeModalLot
  const [grossWeightInput, setGrossWeightInput] = useState("");
  const [tareWeightInput, setTareWeightInput] = useState("4.0");
  const [qualityGrade, setQualityGrade] = useState("STANDARD"); // 'STANDARD' | 'PREMIUM_WORKING' | 'CONTAMINATED_BURNT'
  const [moistureDeduction, setMoistureDeduction] = useState("0"); // 0 | 2 | 5 | 10 %
  const [deductionReason, setDeductionReason] = useState("NONE");

  // Demand board modal
  const [showNewDemandModal, setShowNewDemandModal] = useState(false);
  const [newMatId, setNewMatId] = useState("smartphones");
  const [newTargetQty, setNewTargetQty] = useState("30");
  const [newTargetPrice, setNewTargetPrice] = useState("380");
  const [newRadius, setNewRadius] = useState("25");
  const [newPickup, setNewPickup] = useState(true);

  // Voice procurement modal
  const [showVoiceProcureModal, setShowVoiceProcureModal] = useState(false);
  const [voiceProcureTranscript, setVoiceProcureTranscript] = useState("");
  const [isVoiceProcuring, setIsVoiceProcuring] = useState(false);

  // 1-Click Inbound Vehicle Arrival Simulation
  const handleSimulateInboundArrival = () => {
    const randomMat = MATERIAL_TAXONOMY[Math.floor(Math.random() * 12)] || MATERIAL_TAXONOMY[0];
    const weight = Math.round((8 + Math.random() * 22) * 10) / 10;
    const rate = randomMat.baseBenchmarkRatePerKg || 210;
    const gross = Math.round(weight * rate);
    const logCost = Math.min(220, Math.round(weight * 12 + 60));
    const net = gross - logCost;
    const newLotId = `EW-${Math.floor(2100 + Math.random() * 800)}`;

    const newLot = {
      lotId: newLotId,
      materialId: randomMat.id,
      materialName: randomMat.name,
      reportedWeightKg: weight,
      unitsCount: Math.round(weight * 4),
      collectorName: "Santosh Shinde",
      collectorLocation: "Hadapsar Yard, Pune",
      vehicleNumber: `MH-12-EV-${Math.floor(1000 + Math.random() * 9000)}`,
      driverName: "Dinesh Kadam",
      grossBid: gross,
      logisticsCost: logCost,
      netPayout: net,
      selectedBuyerName: currentRecycler.name,
      status: "IN_TRANSIT",
      conditionGrade: "Mixed Field Scrap",
      photoUrl: randomMat.sampleImages?.[0]?.id
        ? "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80"
        : "",
      qrCode: `EWB-QR-${newLotId}`,
      createdAt: new Date().toISOString(),
      events: [
        {
          step: "COLLECTION_INITIATED",
          agent: "Santosh Shinde (Collector)",
          timestamp: new Date().toISOString(),
          note: `Verified ${weight} kg of ${randomMat.name} via Multimodal Voice Agent.`
        },
        {
          step: "LOGISTICS_DISPATCHED",
          agent: "Electric Cargo Fleet (MH-12-EV)",
          timestamp: new Date().toISOString(),
          note: "Assigned zero-emission 3-wheeler for direct yard hauling."
        }
      ]
    };

    dispatch({ type: AppActions.ADD_LOT, payload: { lot: newLot } });
    dispatch({
      type: AppActions.SET_SYNC_TOAST,
      payload: {
        title: "INBOUND EV VEHICLE ARRIVED AT YARD",
        message: `Lot #${newLotId} (${randomMat.name}, ${weight} kg) entered weighbridge queue.`
      }
    });
    setTimeout(() => dispatch({ type: AppActions.CLEAR_SYNC_TOAST }), 4000);
  };

  const handleOpenWeighModal = (lot) => {
    setActiveModalLot(lot);
    const tare = 4.0;
    const gross = Math.round((lot.reportedWeightKg + tare) * 10) / 10;
    setGrossWeightInput(gross.toString());
    setTareWeightInput(tare.toString());
    setQualityGrade("STANDARD");
    setMoistureDeduction("0");
    setDeductionReason("NONE");
  };

  const handleConfirmWeighAndPayout = () => {
    if (!activeModalLot) return;
    const grossW = parseFloat(grossWeightInput) || activeModalLot.reportedWeightKg + 4;
    const tareW = parseFloat(tareWeightInput) || 4.0;
    const netScrapWeight = Math.max(0.1, Math.round((grossW - tareW) * 10) / 10);

    let gradeMultiplier = 1.0;
    if (qualityGrade === "PREMIUM_WORKING") gradeMultiplier = 1.15;
    if (qualityGrade === "CONTAMINATED_BURNT") gradeMultiplier = 0.80;

    const deductPct = parseFloat(moistureDeduction) || 0;
    const unitRate = activeModalLot.grossBid / activeModalLot.reportedWeightKg;
    const adjustedGross = Math.round(netScrapWeight * unitRate * gradeMultiplier * (1 - deductPct / 100));
    const finalNet = Math.max(0, adjustedGross - activeModalLot.logisticsCost);

    confirmIntakeAndSettle(activeModalLot.lotId, netScrapWeight, "CASH", {
      netPayout: finalNet,
      qualityGrade,
      moistureDeductionPct: deductPct
    });

    const receiptObj = {
      lotId: activeModalLot.lotId,
      materialName: activeModalLot.materialName,
      collectorName: activeModalLot.collectorName,
      collectorLocation: activeModalLot.collectorLocation,
      vehicleNumber: activeModalLot.vehicleNumber || "MH-12-EV-4092",
      driverName: activeModalLot.driverName || "Ramesh Jadhav",
      grossWeightKg: grossW,
      tareWeightKg: tareW,
      actualWeightKg: netScrapWeight,
      reportedWeightKg: activeModalLot.reportedWeightKg,
      variancePct: Math.round(Math.abs(netScrapWeight - activeModalLot.reportedWeightKg) / activeModalLot.reportedWeightKg * 100),
      qualityGrade,
      moistureDeductionPct: deductPct,
      deductionReason,
      unitRate: Math.round(unitRate),
      grossBid: adjustedGross,
      logisticsCost: activeModalLot.logisticsCost,
      netPayout: finalNet,
      weighbridgeTimestamp: new Date().toLocaleTimeString(),
      cpcbManifestRef: `CPCB/MH/EW-MANIFEST/2026/${activeModalLot.lotId}`
    };

    setSuccessReceipt(receiptObj);
    setShowGatePassModal(receiptObj);
    setActiveModalLot(null);
  };

  const handleOpenVoiceProcure = () => {
    setShowVoiceProcureModal(true);
    setIsVoiceProcuring(true);
    setVoiceProcureTranscript("Listening for procurement order...");

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      try {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = "hi-IN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          handleApplyVoiceDemand(text);
        };
        recognition.onerror = () => setIsVoiceProcuring(false);
        recognition.onend = () => setIsVoiceProcuring(false);
        recognition.start();
      } catch (e) {
        console.warn("Speech recognition error:", e);
      }
    }
  };

  const handleApplyVoiceDemand = (text) => {
    setVoiceProcureTranscript(text);
    const parsed = parseVoiceIntent(text, "hi");
    if (parsed && parsed.entities) {
      if (parsed.entities.material) {
        setNewMatId(parsed.entities.material);
        const mat = MATERIAL_TAXONOMY.find((m) => m.id === parsed.entities.material);
        if (mat) setNewTargetPrice(mat.baseBenchmarkRatePerKg.toString());
      }
      if (parsed.entities.quantity) {
        setNewTargetQty(parsed.entities.quantity.toString());
      }
      if (parsed.entities.targetPrice) {
        setNewTargetPrice(parsed.entities.targetPrice.toString());
      }
    }
    setTimeout(() => {
      setShowVoiceProcureModal(false);
      setIsVoiceProcuring(false);
      setShowNewDemandModal(true);
    }, 850);
  };

  const filteredLots = lots.filter((lot) => {
    if (filterTab === "PENDING_INTAKE" && (lot.status === "SETTLED" || lot.status === "CLOSED")) return false;
    if (filterTab === "SETTLED" && lot.status !== "SETTLED" && lot.status !== "CLOSED") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        lot.lotId.toLowerCase().includes(q) ||
        lot.materialName.toLowerCase().includes(q) ||
        lot.collectorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalValue = lots.reduce((acc, l) => acc + (l.grossBid || 0), 0);
  const pendingCount = lots.filter((l) => l.status !== "SETTLED" && l.status !== "CLOSED").length;

  return (
    <div className="recycler-grid">
      {/* Header Info & CPCB Accreditation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="text-sub-label">AUTHORIZED RECYCLER OPERATIONS TERMINAL</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--graphite)", margin: "2px 0 0 0" }}>
            {currentRecycler.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12.5, color: "var(--muted)" }}>
            <span style={{ color: "#1B7943", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={15} />
              {currentRecycler.cpcbRegistrationNo}
            </span>
            <span>•</span>
            <span>Valid till: {currentRecycler.validTill}</span>
            <span>•</span>
            <span>Kasba Peth Processing Yard, Pune</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Quick Jump to Collector Mobile App */}
          {onOpenCollector && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onOpenCollector}
              title="Switch to Collector Mobile App view"
              style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
              id="btn-recycler-to-collector"
            >
              <Smartphone size={14} />
              <span>Collector App</span>
            </button>
          )}

          {/* Quick Simulation Trigger */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSimulateInboundArrival}
            title="Simulate EV cargo delivery arriving at weighbridge"
            style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Truck size={14} color="#1B7943" />
            <span>Simulate Inbound Delivery</span>
          </button>

          {/* Voice Procurement Button */}
          <button
            type="button"
            className="btn-graphite-action"
            style={{
              background: "var(--graphite)",
              color: "var(--accent)",
              border: "1.5px solid var(--accent)",
              padding: "8px 14px",
              fontSize: 12.5,
              fontWeight: 800,
              width: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            onClick={handleOpenVoiceProcure}
            id="btn-voice-procurement"
          >
            <Mic size={14} />
            <span>Voice Procurement</span>
          </button>

          {/* Post Buy Requirement Button */}
          <button
            type="button"
            className="btn-graphite-action"
            style={{
              background: "var(--accent)",
              color: "var(--graphite)",
              padding: "8px 14px",
              fontSize: 12.5,
              fontWeight: 800,
              width: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            onClick={() => setShowNewDemandModal(true)}
            id="btn-post-buy-order"
          >
            <Plus size={15} />
            <span>Post Buy Order</span>
          </button>
        </div>
      </div>

      {/* Two-Sided Navigation Switcher */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
        <button
          type="button"
          className={`persona-tab ${mainSection === "QUEUE" ? "active" : ""}`}
          onClick={() => setMainSection("QUEUE")}
          style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Scale size={15} />
          <span>Weighbridge & Intake Scale ({lots.length})</span>
        </button>

        <button
          type="button"
          className={`persona-tab ${mainSection === "DEMAND_BOARD" ? "active" : ""}`}
          onClick={() => setMainSection("DEMAND_BOARD")}
          style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          id="tab-demand-board"
        >
          <Layers size={15} />
          <span>Standing Demand Board ({buyRequests.length})</span>
        </button>
      </div>

      {/* Industrial Counters Bar */}
      <div className="stats-counter-bar">
        <div className="stat-terminal-box">
          <div className="text-sub-label">INCOMING FEED LOTS</div>
          <div className="stat-num">{lots.length}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Live two-way collector feed</div>
        </div>

        <div className="stat-terminal-box">
          <div className="text-sub-label">AWAITING WEIGHBRIDGE</div>
          <div className="stat-num" style={{ color: pendingCount > 0 ? "var(--graphite)" : "#1B7943" }}>
            {pendingCount.toString().padStart(2, "0")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Vehicles in transit / at yard</div>
        </div>

        <div className="stat-terminal-box">
          <div className="text-sub-label">TODAY'S INTAKE VALUE</div>
          <div className="stat-num" style={{ color: "var(--graphite)" }}>
            ₹{(totalValue + 78200).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>All receipts CPCB compliant</div>
        </div>

        <div className="stat-terminal-box">
          <div className="text-sub-label">CPCB ALLOTTED CAPACITY</div>
          <div className="stat-num">
            {currentRecycler.currentIntakeKg} <span style={{ fontSize: 14, color: "var(--muted)" }}>/ {currentRecycler.intakeCapacityKgPerDay} kg</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#1B7943", fontWeight: 700 }}>53.7% capacity utilized</div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successReceipt && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "var(--graphite)",
            color: "var(--surface)",
            padding: "14px 18px",
            borderRadius: "var(--radius-card)",
            borderLeft: "4px solid var(--accent)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", gap: 6, color: "#FFF" }}>
              <CheckCircle2 size={16} color="var(--accent)" />
              <span>INTAKE WEIGHED & SETTLED: Lot #{successReceipt.lotId}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-light)", marginTop: 2 }}>
              Certified Scrap: {successReceipt.actualWeightKg} kg • Final Cash Payout: ₹{successReceipt.netPayout.toLocaleString("en-IN")} • Form-6 Manifest Generated
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowGatePassModal(successReceipt)}
              style={{ background: "rgba(255,255,255,0.15)", color: "#FFF", border: "1px solid rgba(255,255,255,0.2)", fontSize: 12, padding: "6px 10px" }}
            >
              <Printer size={13} />
              <span>View Gate Pass</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSuccessReceipt(null)}
              style={{ background: "transparent", color: "var(--muted-light)", border: "none", fontSize: 12, padding: "6px 8px" }}
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Section 1: Intake Queue Table */}
      {mainSection === "QUEUE" && (
        <div className="terminal-table-wrap">
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                type="button"
                className={`persona-tab ${filterTab === "ALL" ? "active" : ""}`}
                onClick={() => setFilterTab("ALL")}
              >
                All Feed Lots ({lots.length})
              </button>
              <button
                type="button"
                className={`persona-tab ${filterTab === "PENDING_INTAKE" ? "active" : ""}`}
                onClick={() => setFilterTab("PENDING_INTAKE")}
              >
                Awaiting Weigh-In ({pendingCount})
              </button>
              <button
                type="button"
                className={`persona-tab ${filterTab === "SETTLED" ? "active" : ""}`}
                onClick={() => setFilterTab("SETTLED")}
              >
                Intake Confirmed ({lots.length - pendingCount})
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", width: 220 }}>
                <Search size={14} color="var(--muted)" style={{ position: "absolute", left: 10, top: 10 }} />
                <input
                  type="text"
                  placeholder="Search lot, collector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px 7px 30px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                    background: "var(--canvas)"
                  }}
                />
              </div>
            </div>
          </div>

          <table className="terminal-table">
            <thead>
              <tr>
                <th>Lot Ref</th>
                <th>Material Category</th>
                <th>Reported / Weighed</th>
                <th>Collector & Vehicle</th>
                <th>Logistics Transit</th>
                <th>Gross Payout</th>
                <th>Net Collector Cash</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ color: "var(--muted)", maxWidth: 360, margin: "0 auto" }}>
                      <Package size={32} style={{ margin: "0 auto 10px", display: "block" }} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--graphite)" }}>
                        No Inbound Lots in Intake Queue (0 Active)
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        Click "Simulate Inbound Vehicle Arrival" above or wait for collectors to submit lots.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => (
                <tr key={lot.lotId}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 13, color: "var(--graphite)" }}>
                      #{lot.lotId}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {lot.photoUrl ? (
                        <img
                          src={lot.photoUrl}
                          alt="Thumbnail"
                          style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: "var(--canvas)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Layers size={16} color="var(--muted)" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--graphite)" }}>{lot.materialName}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>Units: {lot.unitsCount || "Batch"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                      {lot.actualIntakeWeightKg ? (
                        <span style={{ color: "#1B7943" }}>{lot.actualIntakeWeightKg} kg (Certified)</span>
                      ) : (
                        <span>{lot.reportedWeightKg} kg (Est.)</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--graphite)" }}>{lot.collectorName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {lot.vehicleNumber || "MH-12-EV-4092"} • {lot.collectorLocation || "Kasba Peth"}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--danger)", fontWeight: 700 }}>
                      -₹{lot.logisticsCost}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      ₹{lot.grossBid?.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 900, color: "var(--graphite)", fontSize: 14 }}>
                      ₹{lot.netPayout?.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        lot.status === "SETTLED" ? "settled" : lot.status === "BIDDING_ACTIVE" ? "bidding" : "accepted"
                      }`}
                    >
                      {lot.status === "SETTLED" ? "INTAKE SETTLED" : lot.status === "IN_TRANSIT" ? "IN TRANSIT" : lot.status}
                    </span>
                  </td>
                  <td>
                    {lot.status !== "SETTLED" ? (
                      <button
                        type="button"
                        className="btn-graphite-action"
                        style={{ padding: "6px 12px", fontSize: 12, width: "auto", display: "inline-flex", alignItems: "center", gap: 5 }}
                        onClick={() => handleOpenWeighModal(lot)}
                      >
                        <Scale size={13} />
                        <span>Weigh & Settle</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "5px 10px", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4 }}
                        onClick={() => {
                          const gross = lot.actualIntakeWeightKg ? lot.actualIntakeWeightKg + 4 : lot.reportedWeightKg + 4;
                          const tare = 4.0;
                          setShowGatePassModal({
                            lotId: lot.lotId,
                            materialName: lot.materialName,
                            collectorName: lot.collectorName,
                            collectorLocation: lot.collectorLocation,
                            vehicleNumber: lot.vehicleNumber || "MH-12-EV-4092",
                            driverName: lot.driverName || "Ramesh Jadhav",
                            grossWeightKg: gross,
                            tareWeightKg: tare,
                            actualWeightKg: lot.actualIntakeWeightKg || lot.reportedWeightKg,
                            reportedWeightKg: lot.reportedWeightKg,
                            variancePct: 0,
                            qualityGrade: "STANDARD",
                            moistureDeductionPct: 0,
                            deductionReason: "NONE",
                            unitRate: Math.round(lot.grossBid / lot.reportedWeightKg),
                            grossBid: lot.grossBid,
                            logisticsCost: lot.logisticsCost,
                            netPayout: lot.netPayout,
                            weighbridgeTimestamp: "Certified",
                            cpcbManifestRef: `CPCB/MH/EW-MANIFEST/2026/${lot.lotId}`
                          });
                        }}
                      >
                        <FileText size={12} />
                        <span>Gate Pass</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 2: Demand Board / Standing Procurement */}
      {mainSection === "DEMAND_BOARD" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="instrument-card" style={{ background: "var(--surface)", padding: 18 }}>
            <div className="text-sub-label">CPCB TWO-SIDED DEMAND DISPATCH ENGINE</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--graphite)", margin: "2px 0 0 0" }}>
              Active Standing Procurement Orders
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, marginBottom: 0 }}>
              Published standing requirements automatically broadcast to nearby informal collectors. Matching lots trigger immediate EV pickup dispatch.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            {buyRequests.map((req) => (
              <div key={req.id} className="instrument-card" style={{ border: "2px solid var(--graphite)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span className="brand-badge" style={{ background: "var(--graphite)", color: "var(--surface)" }}>
                      {req.id}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#1B7943", display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={13} /> {req.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 900, color: "var(--graphite)", margin: "4px 0" }}>
                    {req.materialName}
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Buyer: {req.recyclerName}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "10px 0 8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900, color: "var(--graphite)" }}>
                      ₹{req.targetPricePerKg}
                    </span>
                    <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>/kg Standing Rate</span>
                  </div>

                  <div
                    style={{
                      background: "var(--canvas)",
                      padding: "10px 12px",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "var(--muted)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4
                    }}
                  >
                    <div>
                      Target Quota: <strong style={{ color: "var(--graphite)" }}>{req.targetQuantityKg} kg</strong> (Range: {req.acceptableRangeKg?.min || 10}–{req.acceptableRangeKg?.max || 40} kg)
                    </div>
                    <div>
                      Procurement Radius: <strong style={{ color: "var(--graphite)" }}>{req.radiusKm} km</strong> • Logistics: <strong style={{ color: "#1B7943" }}>{req.pickupOffered ? "Dedicated EV Dispatched" : "Yard Drop"}</strong>
                    </div>
                    <div>
                      Order Validity: <strong style={{ color: "var(--graphite)" }}>{req.validityDays || 7} days remaining</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "var(--graphite)",
                      background: "var(--accent)",
                      padding: "3px 8px",
                      borderRadius: 6
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Zap size={11} color="var(--graphite)" />
                      <span>{req.activeMatchesCount || 2} Field Matches Found</span>
                    </span>
                  </span>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                    onClick={() => setMainSection("QUEUE")}
                  >
                    <span>View Inbound Lots</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: INDUSTRIAL WEIGHBRIDGE & INTAKE SETTLEMENT */}
      <AnimatePresence>
        {activeModalLot && (() => {
          const reportedW = activeModalLot.reportedWeightKg;
          const grossW = parseFloat(grossWeightInput) || reportedW + 4;
          const tareW = parseFloat(tareWeightInput) || 4.0;
          const netScrapWeight = Math.max(0.1, Math.round((grossW - tareW) * 10) / 10);
          const variancePct = Math.round(Math.abs(netScrapWeight - reportedW) / reportedW * 100);
          const isDiscrepant = variancePct > 5;

          let gradeMult = 1.0;
          if (qualityGrade === "PREMIUM_WORKING") gradeMult = 1.15;
          if (qualityGrade === "CONTAMINATED_BURNT") gradeMult = 0.80;

          const deductPct = parseFloat(moistureDeduction) || 0;
          const unitRate = activeModalLot.grossBid / reportedW;
          const adjustedGross = Math.round(netScrapWeight * unitRate * gradeMult * (1 - deductPct / 100));
          const finalNet = Math.max(0, adjustedGross - activeModalLot.logisticsCost);

          return (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal-card"
                style={{ maxWidth: 540 }}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
              >
                {/* Modal Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div className="text-sub-label">CERTIFIED WEIGHBRIDGE SCALE STATION</div>
                    <h3 style={{ fontSize: 19, fontWeight: 900, color: "var(--graphite)", margin: 0 }}>
                      Lot #{activeModalLot.lotId} — {activeModalLot.materialName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActiveModalLot(null)}
                    style={{ padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Scrap Visual Photo & Metadata */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--canvas)", padding: 10, borderRadius: 10, border: "1px solid var(--border)", marginBottom: 12 }}>
                  {activeModalLot.photoUrl ? (
                    <img
                      src={activeModalLot.photoUrl}
                      alt="Lot evidence"
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}
                    />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Layers size={20} color="var(--muted)" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--graphite)" }}>
                      Collector: {activeModalLot.collectorName} ({activeModalLot.collectorLocation})
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                      Vehicle: {activeModalLot.vehicleNumber || "MH-12-EV-4092"} • Reported: <strong>{reportedW} kg</strong>
                    </div>
                    <div style={{ fontSize: 11, color: "#1B7943", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <ShieldCheck size={13} />
                      <span>CPCB Verified Informal Lot Chain</span>
                    </div>
                  </div>
                </div>

                {/* Industrial Weighbridge Reading (Gross / Tare / Net) */}
                <div style={{ background: "#12151A", borderRadius: 12, padding: "12px 14px", color: "#FFF", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--accent)" }}>
                      <Scale size={14} />
                      <span>CERTIFIED DIGITAL LOAD CELL READINGS</span>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#9499A1" }}>
                      CALIBRATION: ACTIVE (ISO-9001)
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 8 }}>
                    {/* Gross */}
                    <div style={{ background: "#1E232D", padding: "8px 10px", borderRadius: 8 }}>
                      <label style={{ fontSize: 10, color: "#9499A1", display: "block", textTransform: "uppercase" }}>Gross (Vehicle+Tote)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={grossWeightInput}
                        onChange={(e) => setGrossWeightInput(e.target.value)}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          color: "#FFF",
                          fontFamily: "var(--font-mono)",
                          fontSize: 16,
                          fontWeight: 900,
                          outline: "none"
                        }}
                      />
                      <span style={{ fontSize: 10, color: "#9499A1" }}>kg</span>
                    </div>

                    {/* Tare */}
                    <div style={{ background: "#1E232D", padding: "8px 10px", borderRadius: 8 }}>
                      <label style={{ fontSize: 10, color: "#9499A1", display: "block", textTransform: "uppercase" }}>Tare (Empty Tote)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={tareWeightInput}
                        onChange={(e) => setTareWeightInput(e.target.value)}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          color: "#FFF",
                          fontFamily: "var(--font-mono)",
                          fontSize: 16,
                          fontWeight: 900,
                          outline: "none"
                        }}
                      />
                      <span style={{ fontSize: 10, color: "#9499A1" }}>kg</span>
                    </div>

                    {/* Net Scrap Weight */}
                    <div style={{ background: "#1A2E20", border: "1px solid #1B7943", padding: "8px 10px", borderRadius: 8 }}>
                      <label style={{ fontSize: 10, color: "#22C55E", display: "block", textTransform: "uppercase", fontWeight: 800 }}>Net E-Waste Scrap</label>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 900, color: "var(--accent)" }}>
                        {netScrapWeight} <span style={{ fontSize: 12 }}>KG</span>
                      </div>
                      <span style={{ fontSize: 10, color: isDiscrepant ? "#F59E0B" : "#22C55E" }}>
                        {variancePct}% variance from reported
                      </span>
                    </div>
                  </div>

                  {isDiscrepant && (
                    <div style={{ marginTop: 8, padding: "6px 8px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 6, fontSize: 10.5, color: "#FBBF24", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={13} color="#FBBF24" />
                      <span>Variance exceeds standard 5% tolerance. Payout will auto-adjust based on certified net scale.</span>
                    </div>
                  )}
                </div>

                {/* Quality Re-Grading & Moisture Deduction Selectors */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label className="text-sub-label" style={{ display: "block", marginBottom: 4 }}>Physical Quality Grade:</label>
                    <select
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        fontSize: 12.5,
                        fontWeight: 700,
                        background: "var(--canvas)"
                      }}
                    >
                      <option value="STANDARD">Standard Scrap (1.0x - 100%)</option>
                      <option value="PREMIUM_WORKING">Working / Refurbishable (+15%)</option>
                      <option value="CONTAMINATED_BURNT">Stripped / Damaged (-20%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sub-label" style={{ display: "block", marginBottom: 4 }}>Foreign Matter / Moisture:</label>
                    <select
                      value={moistureDeduction}
                      onChange={(e) => {
                        setMoistureDeduction(e.target.value);
                        if (e.target.value !== "0") setDeductionReason("DIRT_DEBRIS");
                        else setDeductionReason("NONE");
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        fontSize: 12.5,
                        fontWeight: 700,
                        background: "var(--canvas)"
                      }}
                    >
                      <option value="0">Clean (0% deduction)</option>
                      <option value="2">Minor Dust / Casing Tape (-2%)</option>
                      <option value="5">Moisture / Debris (-5%)</option>
                      <option value="10">Heavy Sludge / Inert (-10%)</option>
                    </select>
                  </div>
                </div>

                {/* Final Recalculated Landed Economics */}
                <div style={{ background: "var(--canvas)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                    <span>Gross Scrap Value ({netScrapWeight} kg @ ₹{Math.round(unitRate * gradeMult)}/kg):</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--graphite)" }}>₹{adjustedGross}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                    <span>Logistics Deduction:</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--danger)" }}>-₹{activeModalLot.logisticsCost}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: "var(--graphite)", borderTop: "1px solid var(--border)", paddingTop: 6, marginTop: 4 }}>
                    <span>Final Net Cash Handover:</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#1B7943" }}>₹{finalNet.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-graphite-action"
                    onClick={handleConfirmWeighAndPayout}
                    style={{ flex: 1, padding: "10px 14px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirm Certified Intake & Print Voucher</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActiveModalLot(null)}
                    style={{ padding: "10px 14px", fontSize: 13 }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL 2: PRINTABLE CPCB GATE PASS & CASH VOUCHER */}
      <AnimatePresence>
        {showGatePassModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card"
              style={{ maxWidth: 520, background: "#FFF", color: "#12151A", border: "2px solid #000" }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              {/* Gate Pass Header */}
              <div style={{ borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: "#666" }}>
                    CENTRAL POLLUTION CONTROL BOARD • FORM 6 GATE INTAKE SLIP
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: "2px 0 0 0" }}>
                    E-Waste Weighbridge & Cash Settlement Voucher
                  </h2>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#333", marginTop: 2 }}>
                    Pass #{showGatePassModal.lotId} • Ref: {showGatePassModal.cpcbManifestRef}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGatePassModal(null)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#666", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Recycler & Collector Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginBottom: 12 }}>
                <div style={{ background: "#F4F5F7", padding: "8px 10px", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>Authorized Recycler</div>
                  <div style={{ fontWeight: 900, color: "#000" }}>{currentRecycler.name}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>Reg: {currentRecycler.cpcbRegistrationNo}</div>
                </div>

                <div style={{ background: "#F4F5F7", padding: "8px 10px", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>Collector / Source</div>
                  <div style={{ fontWeight: 900, color: "#000" }}>{showGatePassModal.collectorName}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>Vehicle: {showGatePassModal.vehicleNumber}</div>
                </div>
              </div>

              {/* Certified Weight Scale Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12, border: "1px solid #CCC" }}>
                <thead>
                  <tr style={{ background: "#EAECEF", textAlign: "left" }}>
                    <th style={{ padding: "6px 8px", border: "1px solid #CCC" }}>Material</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #CCC" }}>Gross (kg)</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #CCC" }}>Tare (kg)</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #CCC" }}>Certified Net (kg)</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #CCC" }}>Grade / Deduct</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontWeight: 800 }}>{showGatePassModal.materialName}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontFamily: "var(--font-mono)" }}>{showGatePassModal.grossWeightKg}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontFamily: "var(--font-mono)" }}>{showGatePassModal.tareWeightKg}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontFamily: "var(--font-mono)", fontWeight: 900, color: "#1B7943" }}>{showGatePassModal.actualWeightKg}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #CCC", fontSize: 11 }}>
                      {showGatePassModal.qualityGrade} (-{showGatePassModal.moistureDeductionPct}%)
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Payout Summary */}
              <div style={{ background: "#F4F5F7", padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span>Gross Valuation:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>₹{showGatePassModal.grossBid}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3, color: "#C53030" }}>
                  <span>EV Logistics Deduction:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>-₹{showGatePassModal.logisticsCost}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, borderTop: "1px solid #DDD", paddingTop: 5, marginTop: 4 }}>
                  <span>Settled Net Cash Payout:</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#1B7943", fontSize: 17 }}>₹{showGatePassModal.netPayout.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Digital Hash & QR Verification Stamp */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "#666", borderTop: "1px dashed #CCC", paddingTop: 8, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <QrCode size={30} color="#000" />
                  <div>
                    <div>SHA-256 DIGITAL AUTHENTICATION STAMP</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}>8f3a9e...c742b01d</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>Weighbridge Operator: S. Patil</div>
                  <div>Timestamp: {showGatePassModal.weighbridgeTimestamp}</div>
                </div>
              </div>

              {/* Print & Close Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-graphite-action"
                  onClick={() => window.print()}
                  style={{ flex: 1, minWidth: 160, padding: "9px 12px", fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Printer size={14} />
                  <span>Print Formal CPCB Voucher</span>
                </button>
                {onOpenAdminTrace && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const id = showGatePassModal.lotId;
                      setShowGatePassModal(null);
                      onOpenAdminTrace(id);
                    }}
                    style={{ padding: "9px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, color: "var(--graphite)", fontWeight: 700 }}
                    id="btn-inspect-cpcb-gatepass"
                  >
                    <Layers size={14} />
                    <span>Inspect in CPCB Portal</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowGatePassModal(null)}
                  style={{ padding: "9px 14px", fontSize: 12.5 }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: VOICE PROCUREMENT ORDER */}
      <AnimatePresence>
        {showVoiceProcureModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card"
              style={{ maxWidth: 460, textAlign: "center" }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="text-sub-label">VOICE PROCUREMENT ORDER ASSISTANT</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowVoiceProcureModal(false)}
                  style={{ padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ fontSize: 17, fontWeight: 900, color: "var(--graphite)" }}>
                Speak Bulk Industrial Buy Requirement
              </div>

              {/* Motion Waveform Pulse */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, height: 40, margin: "14px 0" }}>
                {[12, 26, 38, 28, 16].map((h, i) => (
                  <motion.div
                    key={i}
                    style={{ width: 4, borderRadius: 4, background: i === 2 ? "#D4FF28" : "var(--graphite)" }}
                    animate={{ height: isVoiceProcuring ? [h * 0.4, h, h * 0.4] : 8 }}
                    transition={{ repeat: Infinity, duration: 0.8 + i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--graphite)",
                  background: "var(--canvas)",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  fontStyle: "italic",
                  minHeight: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                "{voiceProcureTranscript}"
              </div>

              <div style={{ fontSize: 11, color: "var(--muted)", margin: "12px 0 8px 0" }}>
                Speak or select an industrial procurement order:
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
                <button
                  type="button"
                  className="voice-chip-btn"
                  style={{ justifyContent: "flex-start", width: "100%", padding: "8px 12px" }}
                  onClick={() => handleApplyVoiceDemand("50 kg ABS plastic chahiye 32 rupaye rate")}
                >
                  <Sparkles size={13} color="#1B7943" />
                  <span>"50 kg ABS Plastic ₹32 तक चाहिए"</span>
                </button>
                <button
                  type="button"
                  className="voice-chip-btn"
                  style={{ justifyContent: "flex-start", width: "100%", padding: "8px 12px" }}
                  onClick={() => handleApplyVoiceDemand("25 kg Motherboard PCB board 480 rupaye tak")}
                >
                  <Sparkles size={13} color="#1B7943" />
                  <span>"25 kg Motherboard PCB ₹480 दर"</span>
                </button>
                <button
                  type="button"
                  className="voice-chip-btn"
                  style={{ justifyContent: "flex-start", width: "100%", padding: "8px 12px" }}
                  onClick={() => handleApplyVoiceDemand("100 kg Lithium Batteries 110 rupaye bhav")}
                >
                  <Sparkles size={13} color="#1B7943" />
                  <span>"100 kg Lithium Batteries ₹110 भाव"</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 4: POST STANDING BUY REQUIREMENT (ALL 25 CATEGORIES) */}
      <AnimatePresence>
        {showNewDemandModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card"
              style={{ maxWidth: 500 }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div className="text-sub-label">NEW BUY REQUIREMENT</div>
                  <h3 style={{ fontSize: 19, fontWeight: 900, color: "var(--graphite)", margin: 0 }}>
                    Publish Standing Procurement Order
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewDemandModal(false)}
                  style={{ padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="text-sub-label" style={{ display: "block", marginBottom: 4 }}>
                    Material Category (All 25 CPCB Regulated Categories)
                  </label>
                  <select
                    value={newMatId}
                    onChange={(e) => {
                      setNewMatId(e.target.value);
                      const mat = MATERIAL_TAXONOMY.find((m) => m.id === e.target.value);
                      if (mat) setNewTargetPrice(mat.baseBenchmarkRatePerKg.toString());
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      background: "var(--surface)",
                      fontWeight: 700
                    }}
                  >
                    {MATERIAL_TAXONOMY.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.shortCode}) • Base: ₹{m.baseBenchmarkRatePerKg}/kg
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sliders for Quantity, Offer Rate, Radius */}
                <div style={{ background: "var(--canvas)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Quota */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <label className="text-sub-label">Target Quota Quantity:</label>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: 14, color: "var(--graphite)" }}>
                        {newTargetQty} KG
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="1"
                      value={newTargetQty}
                      className="aesthetic-range-slider"
                      style={{ "--slider-pct": `${((parseFloat(newTargetQty) - 5) / (150 - 5)) * 100}%` }}
                      onChange={(e) => setNewTargetQty(e.target.value)}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <label className="text-sub-label">Maximum Target Rate (₹/kg):</label>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: 14, color: "var(--graphite)" }}>
                        ₹{newTargetPrice}/kg
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1500"
                      step="5"
                      value={newTargetPrice}
                      className="aesthetic-range-slider"
                      style={{ "--slider-pct": `${((parseFloat(newTargetPrice) - 10) / (1500 - 10)) * 100}%` }}
                      onChange={(e) => setNewTargetPrice(e.target.value)}
                    />
                  </div>

                  {/* Radius */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <label className="text-sub-label">Maximum Logistics Radius:</label>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: 14, color: "var(--graphite)" }}>
                        {newRadius} KM
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      step="5"
                      value={newRadius}
                      className="aesthetic-range-slider"
                      style={{ "--slider-pct": `${((parseFloat(newRadius) - 5) / (80 - 5)) * 100}%` }}
                      onChange={(e) => setNewRadius(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <input
                      type="checkbox"
                      id="chk-pickup-modal"
                      checked={newPickup}
                      onChange={(e) => setNewPickup(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <label htmlFor="chk-pickup-modal" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--graphite)" }}>
                      Dispatch Dedicated EV Electric Cargo 3-Wheeler
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn-graphite-action"
                  onClick={() => {
                    const mat = MATERIAL_TAXONOMY.find((m) => m.id === newMatId) || MATERIAL_TAXONOMY[0];
                    createBuyRequest({
                      recyclerId: currentRecycler.id,
                      recyclerName: currentRecycler.name,
                      cpcbRegistrationNo: currentRecycler.cpcbRegistrationNo,
                      materialId: mat.id,
                      materialName: mat.name,
                      targetQuantityKg: parseFloat(newTargetQty) || 25,
                      acceptableRangeKg: {
                        min: Math.round((parseFloat(newTargetQty) || 25) * 0.7),
                        max: Math.round((parseFloat(newTargetQty) || 25) * 1.5)
                      },
                      targetPricePerKg: parseFloat(newTargetPrice) || mat.baseBenchmarkRatePerKg,
                      maxAcceptablePricePerKg: Math.round((parseFloat(newTargetPrice) || mat.baseBenchmarkRatePerKg) * 1.1),
                      location: currentRecycler.location,
                      radiusKm: parseFloat(newRadius) || 25,
                      pickupOffered: newPickup,
                      pickupVehicleType: currentRecycler.pickupVehicleType,
                      validityDays: 7
                    });
                    setShowNewDemandModal(false);
                    setMainSection("DEMAND_BOARD");
                  }}
                  style={{ flex: 1, padding: "10px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <CheckCircle2 size={16} />
                  <span>Publish to Standing Demand Board</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
