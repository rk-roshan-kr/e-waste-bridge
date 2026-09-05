import { speechNormalizer } from '../src/voice/normalization/SpeechNormalizer.js';
import { LanguageDetector } from '../src/voice/understanding/LanguageDetector.js';
import { TurnManager } from '../src/voice/turn/TurnManager.js';
import { processAgentUtterance, AGENT_INTENTS, extractWeight, extractMaterial, classifyUtteranceIntent } from '../src/services/voiceAgentEngine.js';
import { IndicF5AudioBank } from '../src/data/indicF5AudioBank.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, testName, detail = "") {
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    failed++;
    const msg = `[FAIL] ${testName} ${detail ? `- ${detail}` : ''}`;
    console.error(msg);
    errors.push(msg);
  }
}

console.log('=== 1. AUDIO BANK ASSET VERIFICATION ===');
for (const [key, clip] of Object.entries(IndicF5AudioBank.clips)) {
  const filePath = path.join(process.cwd(), 'public', clip.audioUrl.replace(/^\//, ''));
  const exists = fs.existsSync(filePath);
  assert(exists, `Audio file exists for clip: ${key}`, `Missing: ${filePath}`);
}

console.log('\n=== 2. SPEECH NORMALIZER BUG HUNT ===');
// Test 2.1: User screenshot input
const norm1 = speechNormalizer.normalize("I have 10 laptop to sell sorry I have 5 laptop to sell that weighs around 10 kts.", "en");
assert(norm1.wasCorrected === true, "Detects 'sorry' as backtracking in user screenshot input");
assert(norm1.matchedEntity?.canonicalEntity === "LAPTOP", "Identifies LAPTOP material from screenshot input");

// Test 2.2: Grams and fractions
const norm2 = speechNormalizer.normalize("500 grams copper wire", "en");
assert(norm2.cleanText.includes("500") || norm2.cleanText.includes("0.5"), "Normalizes 500 grams properly");

// Test 2.3: Null, undefined, empty, number types
assert(speechNormalizer.normalize(null).cleanText === "", "Handles null input without throwing");
assert(speechNormalizer.normalize(undefined).cleanText === "", "Handles undefined input without throwing");
assert(speechNormalizer.normalize("").cleanText === "", "Handles empty input without throwing");
assert(speechNormalizer.normalize(12345).cleanText !== "", "Handles numeric input without throwing");

console.log('\n=== 3. WEIGHT & MATERIAL EXTRACTION BUG HUNT ===');
// Test 3.1: Grams conversion
assert(extractWeight("500 grams") === 0.5, "Converts 500 grams to 0.5 kg");
assert(extractWeight("250 gm") === 0.25, "Converts 250 gm to 0.25 kg");
assert(extractWeight("1000 gram") === 1, "Converts 1000 gram to 1 kg");
assert(extractWeight("10 kg") === 10, "Extracts 10 kg");
assert(extractWeight("10 kts") === 10, "Extracts 10 from '10 kts'");
assert(extractWeight("पाच किलो") === 5, "Extracts 5 from Devanagari 'पाच किलो'");

// Test 3.2: Mobile / Smartphone extraction
const matMob = extractMaterial("I have five mobiles");
assert(matMob && matMob.id === "smartphones", "Extracts 'smartphones' from 'five mobiles'");

const matLaptop = extractMaterial("purane laptop");
assert(matLaptop && matLaptop.id === "laptops", "Extracts 'laptops' from 'purane laptop'");

console.log('\n=== 4. INTENT CLASSIFICATION BUG HUNT ===');
// Test 4.1: Screenshot sentence
const intentScreen = classifyUtteranceIntent("I have 10 laptop to sell sorry I have 5 laptop to sell that weighs around 10 kts.");
assert(intentScreen.intent === AGENT_INTENTS.SELL_EWASTE, "Screenshot input classified as SELL_EWASTE");

// Test 4.2: Thank you & Goodbye
const intentThanks1 = classifyUtteranceIntent("thank you very much");
assert(intentThanks1.intent === AGENT_INTENTS.THANK_YOU, "Classifies 'thank you very much' as THANK_YOU");

const intentThanks2 = classifyUtteranceIntent("धन्यवाद");
assert(intentThanks2.intent === AGENT_INTENTS.THANK_YOU, "Classifies 'धन्यवाद' as THANK_YOU");

const intentBye = classifyUtteranceIntent("bye bye see you");
assert(intentBye.intent === AGENT_INTENTS.GOODBYE, "Classifies 'bye bye see you' as GOODBYE");

// Test 4.3: High value
const intentHighVal = classifyUtteranceIntent("124600 accept karo");
assert(intentHighVal.intent === AGENT_INTENTS.REQUEST_ACCEPT_OFFER, "Classifies 124600 as REQUEST_ACCEPT_OFFER");

console.log('\n=== 5. AGENT EXECUTION & RESPONSE GENERATION BUG HUNT ===');
const mockContext = {
  user: { id: "col-1", name: "Ramesh", language: "hi" },
  session: { selectedMaterial: null, weight: null, estimatedValue: 0 },
  conversation: { pendingQuestion: null, history: [] }
};
const mockMarket = { lots: [], buyRequests: [], currentSettledLot: null, activeLotDraft: null };

// Test 5.1: Screenshot utterance execution
const step1 = processAgentUtterance("I have 10 laptop to sell sorry I have 5 laptop to sell that weighs around 10 kts.", mockContext, mockMarket, { screen: "HOME" });
assert(step1 && step1.phase === "ACTION", "Step 1 phase is ACTION");
assert(step1.toolCalls.length > 0, "Dispatches tools for screenshot utterance");
assert(step1.shouldListenAgain === false, "Does not auto-listen in infinite loop");

// Test 5.2: Thank you execution
const stepThanks = processAgentUtterance("thank you very much", mockContext, mockMarket, { screen: "HOME" });
assert(stepThanks.phase === "ACTION", "Thank you phase is ACTION");
assert(stepThanks.shouldListenAgain === false, "Thank you does not auto-listen");
assert(stepThanks.spokenResponse.length > 0, "Thank you produces spoken response");

// Test 5.3: Unknown gibberish fallback
const stepUnknown = processAgentUtterance("asldkfj qwerty zxcv", mockContext, mockMarket, { screen: "HOME" });
assert(stepUnknown.shouldListenAgain === false, "Unknown fallback does not auto-listen in infinite loop");

// Test 5.4: Audio bank never matches fallback guidance
const fallbackAudio = IndicF5AudioBank.findMatch(stepUnknown.spokenResponse, "mr");
assert(fallbackAudio === null, "Audio bank strictly rejects fallback error messages (no 10kg laptop loop!)");

const fallbackAudioHi = IndicF5AudioBank.findMatch(stepUnknown.spokenResponse, "hi");
assert(fallbackAudioHi === null, "Audio bank strictly rejects Hindi fallback error messages");

console.log('\n=== 6. TURN MANAGER STATE MACHINE BUG HUNT ===');
const tm = new TurnManager();
tm.startSession();
assert(tm.state === "LISTENING", "TurnManager starts in LISTENING");
tm.onFinal("mere paas");
assert(tm.state === "LISTENING", "Remains in LISTENING during speech");
tm.onSpeechStop();
assert(tm.state === "PAUSED_WAITING", "Transitions to PAUSED_WAITING on speech stop");
tm.onSpeechResume();
assert(tm.state === "LISTENING", "Resumes LISTENING seamlessly without losing buffer");
tm.onFinal("10 kilo laptop hai");
assert(tm.getAccumulatedText().includes("mere paas") && tm.getAccumulatedText().includes("10 kilo laptop hai"), "Accumulates multi-segment text");
tm.commitTurn();
assert(tm.state === "PROCESSING", "Transitions to PROCESSING on commit");
assert(tm.getAccumulatedText() === "", "Resets text buffer after commit");

console.log('\n========================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
if (errors.length > 0) {
  console.log('ERRORS:');
  errors.forEach(e => console.log(' - ' + e));
}
console.log('========================================');
