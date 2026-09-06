// scratch/test_tts_normalizer_live.js
import { normalizeForTTS, numberToVernacularWords } from '../src/voice/tts/TTSNormalizer.js';

const testCases = [
  {
    input: "10 किलो लैपटॉप के लिए 3 verified buyers मिले हैं। सबसे अच्छा दाम 2,960 रुपये है।",
    lang: "hi",
    expectedSubstring: "दस किलो लैपटॉप के लिए तीन वेरिफाइड खरीदार मिले हैं"
  },
  {
    input: "1,24,600 रुपये का बड़ा सौदा है। पक्का करने के लिए 5 सेकंड दबा कर रखें।",
    lang: "hi",
    expectedSubstring: "एक लाख चौबीस हज़ार छह सौ रुपये का बड़ा सौदा है"
  },
  {
    input: "१० किलो लॅपटॉपसाठी 3 verified खरेदीदार मिळाले आहेत. सर्वोत्तम भाव 2,960 रुपये आहे.",
    lang: "mr",
    expectedSubstring: "दहा किलो लॅपटॉपसाठी तीन व्हेरिफाइड खरेदीदार मिळाले आहेत"
  },
  {
    input: "CPCB रसीद और पिकअप कोड तैयार है।",
    lang: "hi",
    expectedSubstring: "सी पी सी बी रसीद और पिकअप कोड तैयार है"
  },
  {
    input: "वजन बदलून 7 किलो केले आहे. नवीन भाव सुमारे 2,072 रुपये आहे.",
    lang: "mr",
    expectedSubstring: "सात किलो केले आहे"
  }
];

let pass = 0;
for (const tc of testCases) {
  const norm = normalizeForTTS(tc.input, tc.lang);
  console.log(`\nINPUT:  ${tc.input}`);
  console.log(`OUTPUT: ${norm}`);
  if (norm.includes(tc.expectedSubstring)) {
    console.log(`[PASS] Contains expected: "${tc.expectedSubstring}"`);
    pass++;
  } else {
    console.log(`[FAIL] Expected "${tc.expectedSubstring}" not in "${norm}"`);
  }
}

console.log(`\nPassed: ${pass}/${testCases.length}`);
if (pass !== testCases.length) process.exit(1);
