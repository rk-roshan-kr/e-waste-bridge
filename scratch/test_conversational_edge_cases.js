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

if (passed === testUtterances.length && res.intent === AGENT_INTENTS.HOW_ARE_YOU) {
  console.log('\nALL CONVERSATIONAL EDGE CASES PASSED!');
} else {
  process.exit(1);
}
