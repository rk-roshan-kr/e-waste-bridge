/**
 * scripts/reset.js - Reset Database & Application to Empty State UI
 * Part of E-Waste Bridge Architecture Blueprint (SIH 2026 PS-2)
 *
 * Runs via:
 *   node scripts/reset.js
 *   npm run reset
 *
 * Clears transactional records (lots, demand orders, earnings) to present
 * a completely clean, pristine Empty State UI across Collector, Recycler,
 * and Admin personas.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { COLLECTOR_SEED } from "../src/database/seedData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DATASETS_DIR = path.join(ROOT_DIR, "public", "datasets");
const DB_DIR = path.join(ROOT_DIR, "src", "database");

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runReset() {
  console.log("===============================================================");
  console.log("[RESET] Resetting Application State to Pristine Empty State UI");
  console.log("===============================================================");

  ensureDirectoryExists(PUBLIC_DATASETS_DIR);
  ensureDirectoryExists(DB_DIR);

  // 1. Write Empty Active State
  const emptyCollector = {
    ...COLLECTOR_SEED,
    total_lots_completed: 0,
    monthly_weight_kg: 0,
    monthly_earnings_inr: 0
  };

  const emptyState = {
    isEmptyState: true,
    resetAt: new Date().toISOString(),
    collector: emptyCollector,
    lots: [],
    buyRequests: []
  };

  const activeStatePath = path.join(DB_DIR, "activeState.json");
  fs.writeFileSync(activeStatePath, JSON.stringify(emptyState, null, 2), "utf-8");
  console.log("[STATE] activeState.json reset: 0 lots, 0 demands, zeroed collector wallet");

  // 2. Clear transactional datasets in public/datasets
  const emptyLotsJson = path.join(PUBLIC_DATASETS_DIR, "lots.json");
  fs.writeFileSync(emptyLotsJson, JSON.stringify([], null, 2), "utf-8");

  const lotsCsvHeaders = "lot_id,collector_id,material_id,sub_category,reported_weight_kg,estimated_value,status\n";
  const emptyLotsCsv = path.join(PUBLIC_DATASETS_DIR, "lots.csv");
  fs.writeFileSync(emptyLotsCsv, lotsCsvHeaders, "utf-8");
  console.log("[DATASETS] Cleared lots.json and lots.csv to 0 transactions");

  const emptyDemandsJson = path.join(PUBLIC_DATASETS_DIR, "buyer_demands.json");
  fs.writeFileSync(emptyDemandsJson, JSON.stringify([], null, 2), "utf-8");

  const demandsCsvHeaders = "id,recycler_id,material_id,required_quantity_kg,offered_rate_per_kg,status\n";
  const emptyDemandsCsv = path.join(PUBLIC_DATASETS_DIR, "buyer_demands.csv");
  fs.writeFileSync(emptyDemandsCsv, demandsCsvHeaders, "utf-8");
  console.log("[DATASETS] Cleared buyer_demands.json and buyer_demands.csv to 0 tenders");

  console.log("===============================================================");
  console.log("[SUCCESS] Empty State UI Active - Ready for Fresh Field Input");
  console.log("===============================================================");
}

runReset();
