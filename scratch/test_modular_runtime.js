/**
 * test_modular_runtime.js - Behavioral Verification Suite
 * Tests TurnManager, Normalizer, ContextEngine, PolicyEngine, and ResponseGenerator
 */

import { speechNormalizer } from '../src/voice/normalization/SpeechNormalizer.js';
import { turnManager } from '../src/voice/turn/TurnManager.js';
import { languageDetector } from '../src/voice/understanding/LanguageDetector.js';
import { ContextEngine } from '../src/voice/context/ContextEngine.js';
import { intentEngine } from '../src/voice/intent/IntentEngine.js';
import { commandRouter } from '../src/commands/CommandRouter.js';
import { PolicyEngine } from '../src/policy/PolicyEngine.js';
import { ConfirmationTypes } from '../src/policy/ConfirmationPolicy.js';
import { responseGenerator } from '../src/voice/response/ResponseGenerator.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

console.log('--- 1. SPEECH NORMALIZER TESTS ---');
const fillerResult = speechNormalizer.normalize('Mere paas um matlab purane laptop hain');
assert(fillerResult.cleanText === 'Mere paas purane laptop hain', 'Filler words "um matlab" stripped');

const backtrackResult = speechNormalizer.normalize('around 10 kilo actually gyarah kilo');
assert(backtrackResult.wasCorrected === true, 'Backtracking detected');
assert(backtrackResult.correctedValue === 11, 'Numeric value corrected from 10 to 11');

// User Test Case: “Mere paas... 10 kilo... purane laptop hain... actually 12 kilo hain... aur mujhe best buyer chahiye.”
const userScenario = speechNormalizer.normalize('Mere paas 10 kilo purane laptop hain actually 12 kilo hain aur mujhe best buyer chahiye');
assert(userScenario.wasCorrected === true, 'User test case: Backtracking detected');
assert(userScenario.correctedValue === 12, 'User test case: Numeric corrected from 10 to 12');
assert(userScenario.matchedEntity?.canonicalEntity === 'LAPTOP', 'User test case: Canonical entity LAPTOP preserved');

const slangResult = speechNormalizer.normalize('laptop ka maal bechna hai');
assert(slangResult.matchedEntity?.canonicalEntity === 'LAPTOP', 'Slang "laptop ka maal" mapped to LAPTOP');
assert(slangResult.matchedEntity?.cpcbCode === 'ITEW2', 'Mapped to CPCB code ITEW2');

console.log('\n--- 2. AUTO LANGUAGE DETECTION TESTS (EVEN IF UI IS ENGLISH) ---');
// 1. Spoken Hindi when UI is English
const hiDetected = languageDetector.detect('Mere paas 10 kilo purane laptop hain buyer dhoondo', 'en');
assert(hiDetected === 'hi', 'Spoken Hindi detected as "hi" even when UI is English');

// 2. Spoken Marathi when UI is English
const mrDetected = languageDetector.detect('Mazyakade 10 kilo purane laptop ahet buyer dakhva', 'en');
assert(mrDetected === 'mr', 'Spoken Marathi detected as "mr" even when UI is English');

// 3. Spoken English when UI is English
const enDetected = languageDetector.detect('I have 10 kg laptop scrap, find me buyers', 'en');
assert(enDetected === 'en', 'Spoken English detected as "en" when UI is English');

// 4. Devanagari Marathi with unique letter 'ळ'
const mrDevanagari = languageDetector.detect('माझ्याकडे १० किलो जुने लॅपटॉप आहेत', 'en');
assert(mrDevanagari === 'mr', 'Devanagari Marathi with "आहेत" detected as "mr"');

// 5. Devanagari Hindi
const hiDevanagari = languageDetector.detect('मेरे पास १० किलो पुराने लैपटॉप हैं', 'en');
assert(hiDevanagari === 'hi', 'Devanagari Hindi with "हैं" detected as "hi"');

// 6. SpeechNormalizer integration with auto-detection
const normAuto = speechNormalizer.normalize('Mere paas 10 kilo laptop hain', 'en');
assert(normAuto.detectedLanguage === 'hi', 'SpeechNormalizer returns detectedLanguage: "hi"');

console.log('\n--- 2. TURN MANAGER & MULTI-SEGMENT PAUSE TESTS ---');
turnManager.startSession();
assert(turnManager.state === 'LISTENING', 'TurnManager starts in LISTENING state');

turnManager.onInterim('Mere paas');
assert(turnManager.interimText === 'Mere paas', 'Interim text stored');
assert(turnManager.getAccumulatedText() === 'Mere paas', 'Accumulated text matches interim');

turnManager.onSpeechStop();
assert(turnManager.state === 'PAUSED_WAITING', 'Short pause enters PAUSED_WAITING without committing');

turnManager.onSpeechResume();
assert(turnManager.state === 'LISTENING', 'User resumption returns to LISTENING');

turnManager.onFinal('Mere paas 10 kilo purane laptop hain');
assert(turnManager.finalText.trim() === 'Mere paas 10 kilo purane laptop hain', 'Final segment appended to buffer');

turnManager.onInterim('actually 12 kilo hain aur mujhe best buyer chahiye');
assert(turnManager.getAccumulatedText().includes('actually 12 kilo'), 'Interim appended to accumulated buffer across pauses');

let committedTurnText = '';
turnManager.onTurnComplete = (text) => {
  committedTurnText = text;
};
turnManager.commitTurn();
assert(turnManager.state === 'PROCESSING', 'Turn committed enters PROCESSING state');
assert(committedTurnText.includes('actually 12 kilo'), 'Committed turn contains full multi-segment sentence');
assert(turnManager.getAccumulatedText() === '', 'Buffer reset after turn commit');

console.log('\n--- 3. CONTEXT ENGINE & DEICTIC GROUNDING TESTS ---');
const mockAppState = {
  currentScreen: 'MARKETPLACE',
  visibleOffers: [
    { id: 'OFFER_0', buyerName: 'EcoRecycle', netPayout: 2920, distanceKm: 4.2 },
    { id: 'OFFER_1', buyerName: 'GreenTech', netPayout: 2960, distanceKm: 1.8 },
    { id: 'OFFER_2', buyerName: 'CircularLoop', netPayout: 2880, distanceKm: 8.5 }
  ],
  selectedOfferIndex: 0
};

const context = ContextEngine.buildContext(mockAppState);
assert(context.visibleOffers.length === 3, 'Context built with 3 visible offers');

const middleRef = ContextEngine.resolveReference('Beech wala kyun?', context);
assert(middleRef.index === 1, '"Beech wala" resolved to visibleOffers[1]');
assert(middleRef.offer.buyerName === 'GreenTech', 'Resolved offer is GreenTech');

const bestRef = ContextEngine.resolveReference('Sabse achha wala select karo', context);
assert(bestRef.index === 1, '"Sabse achha wala" resolved to max netPayout (GreenTech: 2960)');

console.log('\n--- 3. INTENT ENGINE & COMMAND ROUTER TESTS ---');
const parsedIntent = intentEngine.classify('Beech wala kyun?', context);
assert(parsedIntent.intent === 'EXPLAIN_OFFER', 'Classified as EXPLAIN_OFFER');

const command = commandRouter.routeIntent(parsedIntent, context, 'VOICE');
assert(command.type === 'EXPLAIN_OFFER', 'Command router produced EXPLAIN_OFFER');
assert(command.payload.offerIndex === 1, 'Target index is 1');

console.log('\n--- 4. POLICY ENGINE & ₹1L HOLD GATE TESTS ---');
// Test 4.1: Normal transaction < ₹1,00,000
const normalAcceptCommand = {
  type: 'REQUEST_ACCEPT_OFFER',
  payload: { offerId: 'OFFER_1', netPayout: 72000, verified: true }
};
const normalPolicy = PolicyEngine.evaluate(normalAcceptCommand, mockAppState);
assert(normalPolicy.allowed === true, 'Normal accept allowed');
assert(normalPolicy.confirmationType === ConfirmationTypes.PHYSICAL_TAP, 'Requires PHYSICAL_TAP');

// Test 4.2: High-value transaction >= ₹1,00,000
const highValueAcceptCommand = {
  type: 'REQUEST_ACCEPT_OFFER',
  payload: { offerId: 'OFFER_1', netPayout: 124600, verified: true }
};
const highPolicy = PolicyEngine.evaluate(highValueAcceptCommand, mockAppState);
assert(highPolicy.allowed === true, 'High value accept allowed');
assert(highPolicy.confirmationType === ConfirmationTypes.PHYSICAL_HOLD_5S, 'Requires PHYSICAL_HOLD_5S');
assert(highPolicy.durationMs === 5000, 'Hold duration is 5000ms');

// Test 4.3: Early release authorization failure
const prematureCommit = PolicyEngine.authorizeCommit({
  confirmationType: ConfirmationTypes.PHYSICAL_HOLD_5S,
  actualHoldDurationMs: 3200
});
assert(prematureCommit.authorized === false, 'Release at 3.2s rejected with INSUFFICIENT_HOLD_DURATION');

// Test 4.4: Full 5s hold authorization success
const validCommit = PolicyEngine.authorizeCommit({
  confirmationType: ConfirmationTypes.PHYSICAL_HOLD_5S,
  actualHoldDurationMs: 5000
});
assert(validCommit.authorized === true, 'Hold for 5.0s successfully authorized commit');

console.log('\n--- 5. RESPONSE GENERATOR VERNACULAR RULES TESTS ---');
const response = responseGenerator.generate(highValueAcceptCommand, {}, 'hi');
assert(response.text.includes('1,24,600 रुपये का बड़ा सौदा है'), 'Generated natural Hindi with Indian grouping');
assert(response.text.includes('5 सेकंड दबा कर रखें'), 'Mentions 5 second hold');
assert(response.audioKey === 'high_value_hold_hi', 'Mapped to precomputed studio IndicF5 clip');

console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
