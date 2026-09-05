import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dbService } from "../src/database/dbService.js";
import { appReducer } from "../src/state/appReducer.js";
import { AppActions } from "../src/state/AppActions.js";
import { INITIAL_APP_STATE } from "../src/state/AppState.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

console.log("===============================================================");
console.log("TESTING DATABASE SERVICE, RELATIONAL SCHEMAS & DATASET FLOW");
console.log("===============================================================");

// 1. Relational Schema & Taxonomy Verification
const materials = dbService.getMaterials();
assert(materials.length >= 8, `Materials seeded with ${materials.length} categories`);
const motors = dbService.getMaterialById("motors_magnets");
assert(motors !== null, "Found motors_magnets rare-earth category in database");
assert(motors.cpcb_code === "EEM1", "motors_magnets has CPCB code EEM1");

// 2. Price Benchmarks & Volatility
const benchmarks = dbService.getPriceBenchmarks();
assert(benchmarks.length >= 8, `Price benchmarks seeded with ${benchmarks.length} streams`);
const pcbBench = dbService.getBenchmarkByMaterial("pcb");
assert(pcbBench.prevailing_buying_rate === 350, "PCB prevailing buying rate is ₹350/kg");
assert(pcbBench.trend_percentage === 8.5, "PCB trend is +8.5% up");

// 3. 7-Day Time Series
const pcbHist = dbService.getPriceHistory("pcb");
assert(pcbHist.length === 7, `PCB has 7-day price time-series (${pcbHist.length} days)`);

// 4. Authorized Recyclers Registry
const recyclers = dbService.getRecyclers();
assert(recyclers.length === 4, `Recycler registry has 4 CPCB authorized plants`);
const apex = dbService.getRecyclerById("rec-apex");
assert(apex.cpcb_registration_no === "CPCB/EPR-REC/2023/MH-0149", "Apex registration verified");

// 5. Field Research & Unit Economics
const fieldResearch = dbService.getFieldResearch();
assert(fieldResearch.length === 2, `Field research contains 2 collector dossiers`);
const ramu = fieldResearch[0];
assert(ramu.collectorName === "Ramu Pawar", "Case study 1 is Ramu Pawar");
assert(ramu.incomeGainPercent > 40, `Ramu Pawar projected income gain: +${ramu.incomeGainPercent}%`);

const economics = dbService.getUnitEconomics();
assert(economics.monthlyTotals.percentageIncrease === 40.8, "+40.8% net income increase verified");

// 6. SQL Dump Generator
const sqlDump = dbService.generateSQLDump();
assert(sqlDump.includes("INSERT INTO materials"), "SQL dump contains materials INSERTs");
assert(sqlDump.includes("INSERT INTO lots"), "SQL dump contains lots INSERTs");
assert(sqlDump.includes("COMMIT;"), "SQL dump properly committed");

// 7. Reducer RESET_TO_EMPTY Action
console.log("\n--- Testing appReducer RESET_TO_EMPTY ---");
const stateWithLots = {
  ...INITIAL_APP_STATE,
  lots: dbService.getLots(),
  collector: { ...dbService.getDefaultCollector(), monthlyEarningsInr: 89450, totalLotsCompleted: 29 }
};
assert(stateWithLots.lots.length > 0, "Initial test state has active lots");

const emptyState = appReducer(stateWithLots, { type: AppActions.RESET_TO_EMPTY });
assert(emptyState.lots.length === 0, "Empty state lots array is strictly empty ([])");
assert(emptyState.buyRequests.length === 0, "Empty state buyRequests array is strictly empty ([])");
assert(emptyState.collector.monthlyEarningsInr === 0, "Collector monthly earnings zeroed to ₹0");
assert(emptyState.collector.totalLotsCompleted === 0, "Collector lots completed zeroed to 0");
assert(emptyState.activeLotDraft === null, "Active lot draft cleared to null");

// 8. Reducer LOAD_SEED_DATA Action
console.log("\n--- Testing appReducer LOAD_SEED_DATA ---");
const seededState = appReducer(emptyState, { type: AppActions.LOAD_SEED_DATA });
assert(seededState.lots.length >= 3, `Seeded state has ${seededState.lots.length} canonical CPCB lots`);
assert(seededState.buyRequests.length === 3, `Seeded state has 3 standing procurement tenders`);
assert(seededState.collector.totalLotsCompleted === 29, `Collector completed lots restored to 29`);
assert(seededState.collector.monthlyEarningsInr === 89450, `Collector monthly earnings restored to ₹89,450`);

// 9. Filesystem Artifacts Check
console.log("\n--- Testing Seed Files on Disk ---");
const filesToCheck = [
  "public/datasets/materials.json",
  "public/datasets/price_benchmarks.json",
  "public/datasets/price_history.json",
  "public/datasets/recyclers.json",
  "public/datasets/lots.json",
  "public/datasets/buyer_demands.json",
  "public/datasets/collectors.json",
  "public/datasets/ai_ml_dataset_manifest.json",
  "public/datasets/materials.csv",
  "public/datasets/price_benchmarks.csv",
  "src/database/schema.sql",
  "src/database/seed_dump.sql",
  "src/database/activeState.json"
];

filesToCheck.forEach((relPath) => {
  const fullPath = path.join(ROOT_DIR, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
  const stat = fs.statSync(fullPath);
  assert(stat.size > 20, `File ${relPath} is non-empty (${stat.size} bytes)`);
});

console.log("\n===============================================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("===============================================================");

if (failed > 0) process.exit(1);
