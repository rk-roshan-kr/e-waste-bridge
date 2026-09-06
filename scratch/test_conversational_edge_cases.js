// scratch/test_conversational_edge_cases.js
import { classifyUtteranceIntent, processAgentUtterance, AGENT_INTENTS } from '../src/services/voiceAgentEngine.js';

const testUtterances = [
  { text: "क्यासे हो आप", expectedIntent: AGENT_INTENTS.HOW_ARE_YOU },
  { text: "कैसे हो आप", expectedIntent: AGENT_INTENTS.HOW_ARE_YOU },
  { text: "कसा आहेस", expectedIntent: AGENT_INTENTS.HOW_ARE_YOU },
  { text: "how are you", expectedIntent: AGENT_INTENTS.HOW_ARE_YOU },
  { text: "मेरी आवाज आ रही है", expectedIntent: AGENT_INTENTS.AUDIBILITY_CHECK },
  { text: "sun rahe ho kya", expectedIntent: AGENT_INTENTS.AUDIBILITY_CHECK },
  { text: "can you hear me", expectedIntent: AGENT_INTENTS.AUDIBILITY_CHECK },
  { text: "नमस्ते", expectedIntent: AGENT_INTENTS.GREETING },
  { text: "आप कौन हो", expectedIntent: AGENT_INTENTS.ASSISTANT_IDENTITY },
  { text: "help me", expectedIntent: AGENT_INTENTS.HELP_PROMPT }
];

let passed = 0;
for (const tc of testUtterances) {
  const cl = classifyUtteranceIntent(tc.text, null, { screen: "HOME" });
  if (cl.intent === tc.expectedIntent) {
    console.log(`[PASS] "${tc.text}" -> ${cl.intent}`);
    passed++;
  } else {
    console.error(`[FAIL] "${tc.text}" -> got ${cl.intent}, expected ${tc.expectedIntent}`);
  }
}

console.log('\n--- Testing Full Turn Execution for "क्यासे हो आप" ---');
const res = processAgentUtterance("क्यासे हो आप", { user: { language: "hi" } }, {}, { screen: "HOME" });
console.log('Spoken Response:', res.spokenResponse);
console.log('Prepared Card Type:', res.preparedCard?.type);
console.log('Should Listen Again:', res.shouldListenAgain);

console.log('\n--- Testing Check Earnings against Live Dashboard Data ---');
const dashboardCollector = {
  monthlyEarningsInr: 2840,
  monthlyWeightKg: 46.5,
  totalLotsCompleted: 29
};
const dashboardLots = [
  { lotId: "LOT-1", status: "PENDING", netPayout: 1800 }
];

const earningsRes = processAgentUtterance("Check my earnings.", { user: { language: "en" } }, { collector: dashboardCollector, lots: dashboardLots }, { screen: "HOME" });
console.log('Earnings Spoken Response:', earningsRes.spokenResponse);
console.log('Earnings Prepared Card:', earningsRes.preparedCard);

const earningsMatch = earningsRes.spokenResponse.includes("2,840") &&
  earningsRes.spokenResponse.includes("1,800") &&
  earningsRes.spokenResponse.includes("46.5") &&
  earningsRes.preparedCard.totalEarned === 2840 &&
  earningsRes.preparedCard.pendingPayouts === 1800 &&
  earningsRes.preparedCard.divertedKg === 46.5;

if (!earningsMatch) {
  console.error('[FAIL] Check earnings response did not match live dashboard numbers!');
  process.exit(1);
}
console.log('[PASS] Check earnings matches dashboard data exactly (₹2,840 settled, ₹1,800 pending, 46.5 kg)!');

if (passed === testUtterances.length && res.intent === AGENT_INTENTS.HOW_ARE_YOU && earningsMatch) {
  console.log('\nALL CONVERSATIONAL AND DASHBOARD CONSISTENCY TESTS PASSED!');
} else {
  process.exit(1);
}
