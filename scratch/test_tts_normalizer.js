// scratch/test_tts_normalizer.js

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

function numberToMarathiWords(num) {
  num = parseInt(num, 10);
  if (isNaN(num)) return '';
  if (num === 0) return 'शून्य';

  let parts = [];
  if (num >= 10000000) {
    const crore = Math.floor(num / 10000000);
    parts.push(`${numberToMarathiWords(crore)} कोटी`);
    num %= 10000000;
  }
  if (num >= 100000) {
    const lakh = Math.floor(num / 100000);
    parts.push(`${twoDigitsMarathi(lakh)} लाख`);
    num %= 100000;
  }
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    parts.push(`${twoDigitsMarathi(thousand)} हजार`);
    num %= 1000;
  }
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    const hundredsMap = { 1: 'एकशे', 2: 'दोनशे', 3: 'तीनशे', 4: 'चारशे', 5: 'पाचशे', 6: 'सहाशे', 7: 'सातशे', 8: 'आठशे', 9: 'नऊशे' };
    parts.push(hundredsMap[hundred] || `${MARATHI_UNITS[hundred]} शे`);
    num %= 100;
  }
  if (num > 0) {
    parts.push(twoDigitsMarathi(num));
  }
  return parts.join(' ').trim();
}

console.log('2960 in Marathi:', numberToMarathiWords(2960));
console.log('124600 in Marathi:', numberToMarathiWords(124600));
console.log('10 in Marathi:', numberToMarathiWords(10));
console.log('7 in Marathi:', numberToMarathiWords(7));
