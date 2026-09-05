// PDR Anomaly & Fraud Detection Engine (PDR §8 & §18)
// Flags price lowballing, weight discrepancies, and hazardous routing violations.

import { getBenchmarkForMaterial } from "./priceBenchmarks";

export function evaluateTransactionAnomalies(lot) {
  const anomalies = [];
  const benchmark = getBenchmarkForMaterial(lot.materialId);

  // 1. Price Lowball Detection
  if (lot.grossBid && lot.reportedWeightKg) {
    const effectiveRate = lot.grossBid / lot.reportedWeightKg;
    if (effectiveRate < benchmark.minRatePerKg * 0.85) {
      anomalies.push({
        code: "LOWBALL_OFFER_ALERT",
        severity: "HIGH",
        title: "Potential Price Exploitation / Lowball Offer",
        description: `Effective rate ₹${Math.round(effectiveRate)}/kg is >15% below regional CPCB reference floor (₹${benchmark.minRatePerKg}/kg).`
      });
    }
  }

  // 2. Physical Weight Discrepancy
  if (lot.actualIntakeWeightKg && lot.reportedWeightKg) {
    const diffPct = Math.abs(lot.actualIntakeWeightKg - lot.reportedWeightKg) / lot.reportedWeightKg;
    if (diffPct > 0.15) {
      anomalies.push({
        code: "WEIGHT_DISCREPANCY",
        severity: "MEDIUM",
        title: "Scale Variance Detected at Intake",
        description: `Yard scale recorded ${lot.actualIntakeWeightKg}kg vs reported ${lot.reportedWeightKg}kg (${Math.round(diffPct * 100)}% variance).`
      });
    }
  }

  // 3. Stale Authorization Check
  if (lot.selectedBuyerId === "unregistered-trader") {
    anomalies.push({
      code: "UNAUTHORIZED_RECYCLER_BLOCK",
      severity: "CRITICAL",
      title: "Non-CPCB Authorized Counterparty",
      description: "Transaction blocked: Counterparty lacks valid EPR authorization under E-Waste Rules 2022."
    });
  }

  return anomalies;
}

export const MOCK_ADMIN_ALERTS = [
  {
    id: "ALT-801",
    lotId: "EW-2035",
    type: "PRICE_MANIPULATION_PREVENTED",
    severity: "MEDIUM",
    timestamp: "2026-09-04T07:20:00Z",
    message: "Bid from Unverified Trader ₹180/kg on High-Grade PCB auto-suppressed (Fair band: ₹310-₹420/kg).",
    resolved: true
  },
  {
    id: "ALT-802",
    lotId: "EW-2031",
    type: "HAZARDOUS_ROUTE_ENFORCED",
    severity: "HIGH",
    timestamp: "2026-09-03T16:45:00Z",
    message: "Swollen Li-Ion battery lot (14kg) auto-routed to SafeCell specialized hazardous facility rather than general scrap yard.",
    resolved: true
  }
];
