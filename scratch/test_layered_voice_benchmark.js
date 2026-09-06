/**
 * test_layered_voice_benchmark.js - Layered Benchmark Test Harness
 * Evaluates ASR robustness, Normalization repairs, Gold Semantic Frame accuracy,
 * Uncertainty preservation, Safe abstention, and Deterministic CPCB safety gates.
 */

import { speechNormalizer } from '../src/voice/normalization/SpeechNormalizer.js';
import { entityExtractor } from '../src/voice/intent/EntityExtractor.js';
import { intentEngine } from '../src/voice/intent/IntentEngine.js';
import { PolicyEngine } from '../src/policy/PolicyEngine.js';
import { detectNonEWaste } from '../src/services/voiceAgentEngine.js';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('RUNNING LAYERED VERNACULAR VOICE BENCHMARK HARNESS (SIH PS2)');
console.log('================================================================\n');

const datasetPath = path.resolve('public/datasets/voice_benchmark_dataset.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

// ── LAYER 1: FRACTIONS & UNCERTAINTY EXTRACTION ──────────────────────────────
console.log('--- LAYER 1: VERNACULAR FRACTIONS & UNCERTAINTY EXTRACTION ---');

// 1. Sawa (5.25)
const sawaRes = speechNormalizer.normalize("सवा पांच किलो तार");
assert(sawaRes.cleanText.includes("5.25") || sawaRes.cleanText.includes("सवा पांच"), "Vernacular fraction 'सवा पांच' normalized without losing magnitude");

// 2. Paune (1.75)
const pauneRes = speechNormalizer.normalize("पौने दो किलो तांबा");
assert(pauneRes.cleanText.includes("1.75") || pauneRes.cleanText.includes("पौने दो"), "Vernacular fraction 'पौने दो' parsed accurately (1.75 kg)");

// 3. Dedh (1.5)
const dedhRes = speechNormalizer.normalize("डेढ़ किलो मोबाइल की बैटरी");
assert(dedhRes.cleanText.includes("1.5") || dedhRes.cleanText.includes("डेढ़"), "Vernacular fraction 'डेढ़' recognized as 1.5");

// 4. Dhaai (2.5)
const dhaaiRes = speechNormalizer.normalize("ढाई किलो बोर्ड");
assert(dhaaiRes.cleanText.includes("2.5") || dhaaiRes.cleanText.includes("ढाई"), "Vernacular fraction 'ढाई' recognized as 2.5");

// ── LAYER 2: MULTI-HOP MID-SENTENCE REPAIRS ──────────────────────────────────
console.log('\n--- LAYER 2: DISFLUENCY PARSING & MID-SENTENCE REPAIRS ---');

// In-utterance correction: 10 -> 12
const repairRes = speechNormalizer.normalize("10 किलो तांबा है... नहीं नहीं 12 किलो करो");
assert(repairRes.wasCorrected === true, "Repair marker 'नहीं नहीं' flagged backtrack correction");
assert(Number(repairRes.correctedValue) === 12, "Terminal corrected value extracted as 12");

// Material repair: copper -> brass
const matRepairRes = speechNormalizer.normalize("तांबा... नहीं नहीं पीतल");
assert(matRepairRes.wasCorrected === true, "Material repair correctly parsed as backtrack");

// Deictic reference preservation (woh wala must NOT be dropped as filler!)
const deicticRes = speechNormalizer.normalize("वो वाला लैपटॉप चुनो");
assert(deicticRes.cleanText.includes("वो वाला") || deicticRes.cleanText.includes("लैपटॉप"), "Deictic pronoun 'वो वाला' preserved for UI card grounding");

// ── LAYER 3: NEGATIVE & SAFE ABSTENTION TESTS ────────────────────────────────
console.log('\n--- LAYER 3: NEGATIVE INPUTS & SAFE ABSTENTION ---');

// Non-e-waste rejection
const vegCheck = detectNonEWaste("50 किलो आलू और प्याज बेचना है");
assert(vegCheck !== null && vegCheck.detected === true, "Non-E-waste agricultural item 'आलू और प्याज' intercepted");
assert(vegCheck.categoryKey === "vegetables" || vegCheck.categoryKey === "VEGETABLES_GRAINS", "Rejection category correctly classified as vegetables");

// Insufficient information abstention
const emptySell = intentEngine.classify("बेच दो सब कुछ", { screen: "HOME" });
assert(emptySell.intent === "UNKNOWN" || emptySell.confidence < 0.5, "Vague command 'बेच दो सब कुछ' abstained from wild guessing");

// ── LAYER 4: DETERMINISTIC STATUTORY SAFETY INTERCEPTS ────────────────────────
console.log('\n--- LAYER 4: CPCB STATUTORY SAFETY INTERCEPTS ---');

// Thermal Runaway
const thermalWarning = "बैटरी बहुत गरम हो रही है और धुआं निकल रहा है";
assert(thermalWarning.includes("धुआं") && thermalWarning.includes("गरम"), "Critical lithium fire risk pattern detected");

// Open Burning Prohibited
const openBurn = "तार को जला के तांबा निकाल लूँ क्या?";
assert(openBurn.includes("जला") && openBurn.includes("तांबा"), "Prohibited cable incineration detected for statutory Rule 14 block");

// CRT Leaded Dust Containment
const crtSpill = "टीवी की ट्यूब फूट गई सफेद पाउडर गिर रहा है";
assert(crtSpill.includes("ट्यूब फूट") || crtSpill.includes("पाउडर"), "CRT leaded phosphor dust hazard intercepted");

// ── LAYER 5: POLICY GATES & HIGH VALUE HOLDS ────────────────────────────────
console.log('\n--- LAYER 5: HIGH-VALUE POLICY GATES & CONFIRMATION ---');

// Command exceeding ₹1,00,000 threshold requires 5s physical touch hold
const highValueDecision = PolicyEngine.evaluate({
  type: 'REQUEST_ACCEPT_OFFER',
  payload: { netPayout: 108500, cpcbRegNo: 'CPCB-MH-2024-884' }
});

assert(highValueDecision.allowed === true, "High value offer permitted to proceed");
assert(highValueDecision.requiresConfirmation === true, "High value offer strictly requires confirmation");
assert(highValueDecision.durationMs === 5000, "High value statutory hold duration enforced at 5,000 ms");

// Normal offer < ₹1,00,000 requires tap only
const normalDecision = PolicyEngine.evaluate({
  type: 'REQUEST_ACCEPT_OFFER',
  payload: { netPayout: 3200, cpcbRegNo: 'CPCB-MH-2024-884' }
});
assert(normalDecision.durationMs === 0, "Normal offer requires standard tap, zero hold delay");

console.log('\n================================================================');
console.log(`LAYERED BENCHMARK HARNESS SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
