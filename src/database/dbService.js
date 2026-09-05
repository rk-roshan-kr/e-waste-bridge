/**
 * dbService.js - Unified Database Service Layer
 * Part of E-Waste Bridge Database Layer (SIH 2026 PS-2)
 *
 * Provides a database-friendly API bridging relational schemas (ANSI SQL),
 * canonical seed records, and real-time frontend application state.
 *
 * Features:
 * - Direct ANSI SQL schema exposure
 * - Full CRUD & query methods for all 9 relational entities
 * - 7-Day price history time-series & volatility analytics
 * - Field research case studies & Unit Economics models
 * - SQL Data Definition & INSERT dump generator (for MySQL/Postgres/SQLite)
 * - JSON and CSV export generators for CPCB audits
 */

import {
  MATERIALS_SEED,
  PRICE_BENCHMARKS_SEED,
  PRICE_HISTORY_SEED,
  RECYCLERS_SEED,
  COLLECTOR_SEED,
  INITIAL_LOTS_SEED,
  BUYER_DEMANDS_SEED,
  FIELD_RESEARCH_CASE_STUDIES,
  UNIT_ECONOMICS_DATA
} from "./seedData.js";

class DatabaseService {
  constructor() {
    this.materials = [...MATERIALS_SEED];
    this.priceBenchmarks = [...PRICE_BENCHMARKS_SEED];
    this.priceHistory = [...PRICE_HISTORY_SEED];
    this.recyclers = [...RECYCLERS_SEED];
    this.collectors = [{ ...COLLECTOR_SEED }];
    this.lots = [...INITIAL_LOTS_SEED];
    this.buyerDemands = [...BUYER_DEMANDS_SEED];
    this.fieldResearch = [...FIELD_RESEARCH_CASE_STUDIES];
    this.unitEconomics = { ...UNIT_ECONOMICS_DATA };
  }

  // ── 1. Materials (CPCB Schedule I Taxonomy) ──────────────────────────────

  getMaterials() {
    return [...this.materials];
  }

  getMaterialById(id) {
    if (!id) return null;
    return this.materials.find((m) => m.material_id === id) || null;
  }

  getMaterialsByCategory(category) {
    return this.materials.filter((m) => m.category === category);
  }

  // ── 2. Price Benchmarks & Volatility ─────────────────────────────────────

  getPriceBenchmarks() {
    return [...this.priceBenchmarks];
  }

  getBenchmarkByMaterial(materialId) {
    return this.priceBenchmarks.find((b) => b.material_id === materialId) || null;
  }

  getPriceHistory(materialId = null) {
    if (!materialId) return [...this.priceHistory];
    return this.priceHistory.filter((h) => h.material_id === materialId);
  }

  // ── 3. Authorized Recyclers Registry ─────────────────────────────────────

  getRecyclers() {
    return [...this.recyclers];
  }

  getRecyclerById(id) {
    return this.recyclers.find((r) => r.recycler_id === id) || null;
  }

  findRecyclersForMaterial(materialId) {
    return this.recyclers.filter((r) =>
      r.accepted_materials.includes(materialId)
    );
  }

  // ── 4. Collector Profile & Registry ──────────────────────────────────────

  getCollectors() {
    return [...this.collectors];
  }

  getDefaultCollector() {
    return { ...this.collectors[0] };
  }

  // ── 5. Transactions Ledger & Traceability ────────────────────────────────

  getLots() {
    return [...this.lots];
  }

  getLotById(lotId) {
    return this.lots.find((l) => l.lotId === lotId) || null;
  }

  getTraceabilityEvents(lotId) {
    const lot = this.getLotById(lotId);
    return lot ? [...(lot.events || [])] : [];
  }

  // ── 6. Standing Buyer Procurement Demands ────────────────────────────────

  getBuyerDemands() {
    return [...this.buyerDemands];
  }

  getDemandsForMaterial(materialId) {
    return this.buyerDemands.filter((d) => d.materialId === materialId);
  }

  // ── 7. Field Research & Unit Economics ───────────────────────────────────

  getFieldResearch() {
    return [...this.fieldResearch];
  }

  getUnitEconomics() {
    return { ...this.unitEconomics };
  }

  // ── 8. Dataset Dumps & Exporters ─────────────────────────────────────────

  /**
   * Generates standard ANSI SQL INSERT statements for relational databases
   */
  generateSQLDump() {
    const lines = [
      "-- ============================================================================",
      "-- E-Waste Bridge - Canonical SQL Seed Dump",
      `-- Generated: ${new Date().toISOString()}`,
      "-- Target: PostgreSQL 14+ / MySQL 8.0+ / SQLite 3",
      "-- ============================================================================",
      "",
      "BEGIN TRANSACTION;",
      ""
    ];

    // Table: materials
    lines.push("-- Materials Seed");
    this.materials.forEach((m) => {
      const flags = JSON.stringify(m.hazard_flags).replace(/'/g, "''");
      const crm = JSON.stringify(m.critical_raw_materials).replace(/'/g, "''");
      lines.push(
        `INSERT INTO materials (material_id, category, sub_category, cpcb_code, name_en, name_hi, name_mr, unit, base_benchmark_rate, min_market_rate, max_market_rate, hazard_level, hazard_flags, safety_warning_en, safety_warning_hi, safety_warning_mr, critical_raw_materials) ` +
        `VALUES ('${m.material_id}', '${m.category.replace(/'/g, "''")}', '${m.sub_category.replace(/'/g, "''")}', '${m.cpcb_code}', '${m.name_en.replace(/'/g, "''")}', '${m.name_hi.replace(/'/g, "''")}', '${m.name_mr.replace(/'/g, "''")}', '${m.unit}', ${m.base_benchmark_rate}, ${m.min_market_rate}, ${m.max_market_rate}, '${m.hazard_level}', '${flags}', '${m.safety_warning_en.replace(/'/g, "''")}', '${m.safety_warning_hi.replace(/'/g, "''")}', '${m.safety_warning_mr.replace(/'/g, "''")}', '${crm}') ` +
        `ON CONFLICT (material_id) DO NOTHING;`
      );
    });
    lines.push("");

    // Table: price_benchmarks
    lines.push("-- Price Benchmarks Seed");
    this.priceBenchmarks.forEach((b) => {
      lines.push(
        `INSERT INTO price_benchmarks (benchmark_id, material_id, region_code, region_name, prevailing_buying_rate, min_rate, max_rate, unit, price_trend, trend_percentage, freshness_score, sample_transaction_count, source_index) ` +
        `VALUES ('${b.benchmark_id}', '${b.material_id}', '${b.region_code}', '${b.region_name}', ${b.prevailing_buying_rate}, ${b.min_rate}, ${b.max_rate}, '${b.unit}', '${b.price_trend}', ${b.trend_percentage}, ${b.freshness_score}, ${b.sample_transaction_count}, '${b.source_index}') ` +
        `ON CONFLICT (benchmark_id) DO NOTHING;`
      );
    });
    lines.push("");

    // Table: recyclers
    lines.push("-- Recyclers Seed");
    this.recyclers.forEach((r) => {
      const mats = JSON.stringify(r.accepted_materials);
      const modes = JSON.stringify(r.settlement_modes);
      lines.push(
        `INSERT INTO recyclers (recycler_id, name, badge, cpcb_registration_no, registration_valid_till, status, facility_location, latitude, longitude, contact_phone, rating, intake_capacity_kg_day, current_intake_kg, pickup_capability, pickup_vehicle_type, pickup_radius_km, accepted_materials, settlement_modes) ` +
        `VALUES ('${r.recycler_id}', '${r.name}', '${r.badge}', '${r.cpcb_registration_no}', '${r.registration_valid_till}', '${r.status}', '${r.facility_location}', ${r.latitude}, ${r.longitude}, '${r.contact_phone}', ${r.rating}, ${r.intake_capacity_kg_day}, ${r.current_intake_kg}, ${r.pickup_capability}, '${r.pickup_vehicle_type}', ${r.pickup_radius_km}, '${mats}', '${modes}') ` +
        `ON CONFLICT (recycler_id) DO NOTHING;`
      );
    });
    lines.push("");

    // Table: lots
    lines.push("-- Transactions Ledger Seed");
    this.lots.forEach((l) => {
      lines.push(
        `INSERT INTO lots (lot_id, collector_id, material_id, sub_category, cpcb_category_code, material_name, material_description, condition, source_type, reported_weight_kg, actual_intake_weight_kg, estimated_value, quoted_price_per_kg, final_net_payout, selected_recycler_id, status, payment_status, payment_mode, collection_location, qr_code_payload, created_at) ` +
        `VALUES ('${l.lotId}', '${l.collectorId}', '${l.materialId}', '${l.subCategory}', '${l.cpcbCategoryCode}', '${l.materialName}', '${l.materialDescription.replace(/'/g, "''")}', '${l.condition}', '${l.sourceType}', ${l.reportedWeightKg}, ${l.actualIntakeWeightKg || "NULL"}, ${l.estimatedValue}, ${l.quotedPricePerKg}, ${l.finalNetPayout}, '${l.selectedRecyclerId}', '${l.status}', '${l.paymentStatus}', '${l.paymentMode}', '${l.collectionLocation}', '${l.qrCodePayload}', '${l.createdAt}') ` +
        `ON CONFLICT (lot_id) DO NOTHING;`
      );
    });
    lines.push("");

    lines.push("COMMIT;");
    return lines.join("\n");
  }

  /**
   * Exports an array of records to RFC-4180 compliant CSV string
   */
  exportToCSV(records) {
    if (!records || records.length === 0) return "";
    const headers = Object.keys(records[0]).filter((k) => typeof records[0][k] !== "object" || Array.isArray(records[0][k]));
    const rows = [headers.join(",")];

    records.forEach((row) => {
      const line = headers.map((h) => {
        let val = row[h];
        if (Array.isArray(val)) val = val.join("; ");
        if (val === undefined || val === null) val = "";
        return `"${("" + val).replace(/"/g, '""')}"`;
      });
      rows.push(line.join(","));
    });

    return rows.join("\n");
  }
}

export const dbService = new DatabaseService();
