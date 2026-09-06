/**
 * TTSNormalizer.js - Vernacular Prosodic Normalizer for Speech Synthesis
 * Converts raw digits, Indian numbering (Lakhs/Crores), currency symbols,
 * Latin tech loanwords, and punctuation into human-sounding vernacular phonetics.
 * 
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

const HINDI_UNITS = ['', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस'];
const HINDI_TENS = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];
const HINDI_SPECIAL = {
  21: 'इक्कीस', 22: 'बाईस', 23: 'तेईस', 24: 'चौबीस', 25: 'पच्चीस', 26: 'छब्बीस', 27: 'सत्ताईस', 28: 'अट्ठाईस', 29: 'उनतीस',
  31: 'इकत्तीस', 32: 'बत्तीस', 33: 'तैंतीस', 34: 'चौंतीस', 35: 'पैंतीस', 36: 'छत्तीस', 37: 'सैंतीस', 38: 'अड़तीस', 39: 'उनतालीस',
  41: 'इकतालीस', 42: 'बयालीस', 43: 'तैंतालीस', 44: 'चवालीस', 45: 'पैंतालीस', 46: 'छियालीस', 47: 'सैंतालीस', 48: 'अड़तालीस', 49: 'उनचास',
  51: 'इक्यावन', 52: 'बावन', 53: 'तिरेपन', 54: 'चौवन', 55: 'पचपन', 56: 'छप्पन', 57: 'सत्तावन', 58: 'अट्ठावन', 59: 'उनसठ',
  61: 'इकसठ', 62: 'बासठ', 63: 'तिरेसठ', 64: 'चौंसठ', 65: 'पैंसठ', 66: 'छियासठ', 67: 'सरसठ', 68: 'अड़सठ', 69: 'उनहत्तर',
  71: 'इकहत्तर', 72: 'बहत्तर', 73: 'तिहत्तर', 74: 'चौहत्तर', 75: 'पचहत्तर', 76: 'छिहत्तर', 77: 'सतहत्तर', 78: 'अठहत्तर', 79: 'उन्नासी',
  81: 'इक्यासी', 82: 'बयासी', 83: 'तिरासी', 84: 'चौरासी', 85: 'पचासी', 86: 'छियासी', 87: 'सत्तासी', 88: 'अठासी', 89: 'नवासी',
  91: 'इक्यानवे', 92: 'बानवे', 93: 'तिरानवे', 94: 'चौरानवे', 95: 'पंचानवे', 96: 'छियानवे', 97: 'सत्तानवे', 98: 'अट्ठानवे', 99: 'निन्यानवे'
};

const MARATHI_UNITS = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'];
const MARATHI_TENS = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];
const MARATHI_SPECIAL = {
  21: 'एकवीस', 22: 'बावीस', 23: 'तेवीस', 24: 'चोवीस', 25: 'पंचवीस', 26: 'सव्वीस', 27: 'सत्तावीस', 28: 'अठ्ठावीस', 29: 'एकोणतीस',
  31: 'एकतीस', 32: 'बत्तीस', 33: 'तेहेतीस', 34: 'चौतीस', 35: 'पस्तीस', 36: 'छत्तीस', 37: 'सदतीस', 38: 'अडतीस', 39: 'एकोणचाळीस',
  41: 'एक्केचाळीस', 42: 'बेचाळीस', 43: 'त्रेचाळीस', 44: 'चव्वेचाळीस', 45: 'पंचेचाळीस', 46: 'शेहेचाळीस', 47: 'सत्तेचाळीस', 48: 'अठ्ठेचाळीस', 49: 'एकोणपन्नास',
  50: 'पन्नास', 60: 'साठ', 70: 'सत्तर', 80: 'ऐंशी', 90: 'नव्वद'
};

function twoDigitsHindi(n) {
  if (n === 0) return '';
  if (n < 20) return HINDI_UNITS[n];
  if (HINDI_SPECIAL[n]) return HINDI_SPECIAL[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? HINDI_TENS[t] : `${HINDI_TENS[t]} ${HINDI_UNITS[u]}`;
}

function twoDigitsMarathi(n) {
  if (n === 0) return '';
  if (n < 20) return MARATHI_UNITS[n];
  if (MARATHI_SPECIAL[n]) return MARATHI_SPECIAL[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? MARATHI_TENS[t] : `${MARATHI_TENS[t]} ${MARATHI_UNITS[u]}`;
}

export function numberToVernacularWords(num, lang = 'hi') {
  num = parseInt(num, 10);
  if (isNaN(num)) return '';
  if (num === 0) return 'शून्य';

  const isMarathi = lang === 'mr';
  const twoDigits = isMarathi ? twoDigitsMarathi : twoDigitsHindi;
  const lakhWord = isMarathi ? 'लाख' : 'लाख';
  const thousandWord = isMarathi ? 'हजार' : 'हज़ार';
  const croreWord = isMarathi ? 'कोटी' : 'करोड़';

  let parts = [];
  if (num >= 10000000) {
    const crore = Math.floor(num / 10000000);
    parts.push(`${numberToVernacularWords(crore, lang)} ${croreWord}`);
    num %= 10000000;
  }
  if (num >= 100000) {
    const lakh = Math.floor(num / 100000);
    parts.push(`${twoDigits(lakh)} ${lakhWord}`);
    num %= 100000;
  }
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    parts.push(`${twoDigits(thousand)} ${thousandWord}`);
    num %= 1000;
  }
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    if (isMarathi) {
      const mrHundreds = { 1: 'एकशे', 2: 'दोनशे', 3: 'तीनशे', 4: 'चारशे', 5: 'पाचशे', 6: 'सहाशे', 7: 'सातशे', 8: 'आठशे', 9: 'नऊशे' };
      parts.push(mrHundreds[hundred] || `${MARATHI_UNITS[hundred]} शे`);
    } else {
      parts.push(`${HINDI_UNITS[hundred]} सौ`);
    }
    num %= 100;
  }
  if (num > 0) {
    parts.push(twoDigits(num));
  }
  return parts.join(' ').trim();
}

/**
 * Normalizes text for speech synthesis:
 * - Expands currency symbols (₹, Rs) to vernacular words
 * - Expands digits and Indian comma-grouped numbers into spoken words
 * - Converts Latin technical abbreviations into clean phonetics
 * - Replaces robotic characters and ensures prosodic breathing pauses
 */
export function normalizeForTTS(text, lang = 'hi') {
  if (!text || typeof text !== 'string') return '';

  let out = text;

  // 1. Clean markdown artifacts
  out = out.replace(/[*_~`#[\]]/g, ' ');

  // 2. Common Latin loanwords & abbreviations to phonetic vernacular
  if (lang === 'hi' || lang === 'mr') {
    const phonetics = [
      [/\bCPCB\b/gi, 'सी पी सी बी'],
      [/\bPCB\b/gi, 'पी सी बी'],
      [/\bverified\b/gi, lang === 'mr' ? 'व्हेरिफाइड' : 'वेरिफाइड'],
      [/\bbuyers\b/gi, lang === 'mr' ? 'खरेदीदार' : 'खरीदार'],
      [/\bbuyer\b/gi, lang === 'mr' ? 'खरेदीदार' : 'खरीदार'],
      [/\blaptop\b/gi, lang === 'mr' ? 'लॅपटॉप' : 'लैपटॉप'],
      [/\blaptops\b/gi, lang === 'mr' ? 'लॅपटॉप' : 'लैपटॉप'],
      [/\bbattery\b/gi, lang === 'mr' ? 'बॅटरी' : 'बैटरी'],
      [/\bwire\b/gi, 'वायर'],
      [/\bpickup\b/gi, 'पिकअप'],
      [/\bcode\b/gi, 'कोड'],
      [/\bkg\b/gi, 'किलो'],
      [/\bsec\b/gi, lang === 'mr' ? 'सेकंद' : 'सेकंड'],
      [/\bseconds\b/gi, lang === 'mr' ? 'सेकंद' : 'सेकंड']
    ];
    for (const [re, replacement] of phonetics) {
      out = out.replace(re, replacement);
    }
  }

  // 3. Vernacular decimal fractions
  if (lang === 'hi') {
    out = out.replace(/\b1\.5\s*(किलो|kg)?\b/g, 'डेढ़ $1');
    out = out.replace(/\b2\.5\s*(किलो|kg)?\b/g, 'ढाई $1');
    out = out.replace(/\b0\.5\s*(किलो|kg)?\b/g, 'आधा $1');
  } else if (lang === 'mr') {
    out = out.replace(/\b1\.5\s*(किलो|kg)?\b/g, 'दीड $1');
    out = out.replace(/\b2\.5\s*(किलो|kg)?\b/g, 'अडीच $1');
    out = out.replace(/\b0\.5\s*(किलो|kg)?\b/g, 'अर्धा $1');
  }

  // 4. Currency normalization (₹ 2,960 -> 2,960 रुपये)
  if (lang === 'hi' || lang === 'mr') {
    const rupeeWord = lang === 'mr' ? 'रुपये' : 'रुपये';
    out = out.replace(/₹\s*([\d,]+)/g, (match, digits) => {
      const cleanNum = digits.replace(/,/g, '');
      const words = numberToVernacularWords(cleanNum, lang);
      return words ? `${words} ${rupeeWord}` : `${digits} ${rupeeWord}`;
    });
    out = out.replace(/([\d,]+)\s*(?:रुपये|रुपया|rupees|rs\.?)/gi, (match, digits) => {
      const cleanNum = digits.replace(/,/g, '');
      const words = numberToVernacularWords(cleanNum, lang);
      return words ? `${words} ${rupeeWord}` : `${digits} ${rupeeWord}`;
    });
  }

  // 5. Standalone numbers and quantities (e.g., 10 किलो, 5 सेकंड)
  if (lang === 'hi' || lang === 'mr') {
    // Replace numbers followed by units or standalone numbers up to 7 digits
    out = out.replace(/\b([\d,]+)\b/g, (match, digits) => {
      const clean = digits.replace(/,/g, '');
      if (/^\d+$/.test(clean) && clean.length <= 8) {
        const words = numberToVernacularWords(clean, lang);
        return words || match;
      }
      return match;
    });

    // Also convert Devanagari numerals if present (१० -> दहा / दस)
    const devanagariDigits = { '०':0, '१':1, '२':2, '३':3, '४':4, '५':5, '६':6, '७':7, '८':8, '९':9 };
    out = out.replace(/[०-९]+/g, (match) => {
      const latin = match.split('').map(d => devanagariDigits[d] ?? d).join('');
      const words = numberToVernacularWords(latin, lang);
      return words || match;
    });
  }

  // 6. Natural prosody & breathing pauses
  // Replace slashes or colons with commas
  out = out.replace(/[:;]/g, ',');
  // Ensure space after punctuation
  out = out.replace(/([,।!?])([^\s])/g, '$1 $2');
  // Collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();

  return out;
}
