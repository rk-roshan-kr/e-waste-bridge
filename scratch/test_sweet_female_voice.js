// scratch/test_sweet_female_voice.js
import { ttsProvider } from '../src/voice/tts/TTSProvider.js';

const mockVoices = [
  { name: 'Microsoft Hemant - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Madhur Online (Natural) - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Swara Online (Natural) - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Prabhat Online (Natural) - English (India)', lang: 'en-IN' },
  { name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN' },
  { name: 'Microsoft Aarohi Online (Natural) - Marathi (India)', lang: 'mr-IN' },
  { name: 'Microsoft David - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
  { name: 'Google हिन्दी', lang: 'hi-IN' },
  { name: 'Google मराठी', lang: 'mr-IN' }
];

console.log('Testing Female Voice Selection...\n');

const hiVoice = ttsProvider.selectSweetFemaleVoice('hi', mockVoices);
console.log('Selected Hindi Voice:', hiVoice.name);
if (hiVoice.name.includes('Swara')) {
  console.log('[PASS] Hindi correctly selected sweet female voice "Microsoft Swara Online (Natural)"!');
} else {
  console.error('[FAIL] Expected Swara, got:', hiVoice.name);
  process.exit(1);
}

const mrVoice = ttsProvider.selectSweetFemaleVoice('mr', mockVoices);
console.log('Selected Marathi Voice:', mrVoice.name);
if (mrVoice.name.includes('Aarohi')) {
  console.log('[PASS] Marathi correctly selected sweet female voice "Microsoft Aarohi Online (Natural)"!');
} else {
  console.error('[FAIL] Expected Aarohi, got:', mrVoice.name);
  process.exit(1);
}

const enVoice = ttsProvider.selectSweetFemaleVoice('en', mockVoices);
console.log('Selected English Voice:', enVoice.name);
if (enVoice.name.includes('Neerja')) {
  console.log('[PASS] English correctly selected sweet female voice "Microsoft Neerja Online (Natural)"!');
} else {
  console.error('[FAIL] Expected Neerja, got:', enVoice.name);
  process.exit(1);
}

// Test male rejection
const maleVoicesOnly = [
  { name: 'Microsoft Hemant - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Madhur Online (Natural) - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN' }
];
const fallbackFemale = ttsProvider.selectSweetFemaleVoice('hi', maleVoicesOnly);
console.log('When only male Hindi voices exist, fallback is:', fallbackFemale.name);
if (fallbackFemale.name.includes('Neerja')) {
  console.log('[PASS] Refused male robotic Hindi voice and picked sweet Indian female Neerja!');
} else {
  console.error('[FAIL] Fallback picked male voice:', fallbackFemale.name);
  process.exit(1);
}

console.log('\nALL FEMALE VOICE SELECTION TESTS PASSED!');
