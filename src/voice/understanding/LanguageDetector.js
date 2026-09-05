/**
 * LanguageDetector.js - Automatic Vernacular & Polyglot Language Classifier
 * Part of E-Waste Speech Intelligence Layer
 *
 * Automatically detects whether an utterance is spoken in Hindi (hi), Marathi (mr),
 * or English (en), even when the visual UI is set to English.
 */

export class LanguageDetector {
  constructor() {
    // 1. Exclusive Marathi markers (Devanagari uses whitespace/boundary patterns; Latin uses \b)
    this.marathiDevanagariWords = [
      'आहे', 'आहेत', 'माझ्याकडे', 'मज्याकडे', 'मला', 'विकायचे', 'विकायचा', 'विकायची',
      'विकायचं', 'किती', 'भावात', 'पाहिजे', 'कचरा', 'पावत्या', 'पावती', 'खरेदीदार',
      'दुसरा', 'तिसरा', 'बरं', 'होय', 'नाही', 'दाखवा', 'सांगा', 'नको', 'चांगला', 'जास्त'
    ];

    this.marathiLatinPatterns = [
      /\b(ahe|aahe|ahet|aahet|mazyakade|majhyakade|mazakade|mala|vikaycha|vikayche|vikaychi|kiti|pahije|pahijet|dakhva|dakhav|sang|sangaa|bhavat|changla|changle|nakko|nako)\b/i
    ];

    // 2. Exclusive Hindi markers
    this.hindiDevanagariWords = [
      'है', 'हैं', 'मेरे पास', 'हमारे पास', 'मुझे', 'बेचना', 'बेचो', 'कितना', 'दाम',
      'चाहिए', 'कबाड़', 'रसीद', 'खरीदार', 'दूसरा', 'तीसरा', 'हाँ', 'अच्छा', 'दिखाओ',
      'करो', 'बताओ', 'मत', 'रुपये', 'सौदा'
    ];

    this.hindiLatinPatterns = [
      /\b(hai|hain|mere paas|mere pass|humare paas|mujhe|bechna|becho|kitna|daam|chahiye|kabaad|rasid|kharidar|doosra|teesra|bhai|dekhna|dikhana|dikhao|batao|accha|achha|mat|rupaye)\b/i
    ];

    // 3. English structural phrases
    this.englishPatterns = [
      /\b(i have|we have|want to sell|selling|find buyers|find buyer|look for buyers|best offer|what is the price|show receipts|show lots|accept offer|cancel)\b/i
    ];
  }

  /**
   * Detects the language of a spoken utterance.
   * @param {string} text - The raw or normalized speech transcript
   * @param {string} currentUiLanguage - The active UI language fallback ('en' | 'hi' | 'mr')
   * @returns {'hi' | 'mr' | 'en'} Detected language code
   */
  detect(text, currentUiLanguage = 'hi') {
    if (!text || typeof text !== 'string') return currentUiLanguage || 'hi';
    const clean = text.toLowerCase().trim();

    // 1. Direct check for Marathi letter 'ळ'
    if (/ळ/.test(text)) return 'mr';

    let mrScore = 0;
    let hiScore = 0;
    let enScore = 0;

    // Check Devanagari words using substring/token matching (safe for Unicode)
    for (const word of this.marathiDevanagariWords) {
      if (text.includes(word)) mrScore += 3;
    }

    for (const word of this.hindiDevanagariWords) {
      if (text.includes(word)) hiScore += 3;
    }

    // Check Latin transliteration patterns
    for (const pat of this.marathiLatinPatterns) {
      if (pat.test(clean)) mrScore += 3;
    }

    for (const pat of this.hindiLatinPatterns) {
      if (pat.test(clean)) hiScore += 3;
    }

    for (const pat of this.englishPatterns) {
      if (pat.test(clean)) enScore += 3;
    }

    // High confidence winner
    if (mrScore > hiScore && mrScore > enScore) return 'mr';
    if (hiScore > mrScore && hiScore > enScore) return 'hi';
    if (enScore > hiScore && enScore > mrScore) return 'en';

    // If Devanagari script is present but no specific marker matched:
    if (/[\u0900-\u097F]/.test(text)) {
      return mrScore > hiScore ? 'mr' : 'hi';
    }

    // If text contains vernacular scrap slang words like "maal", "kilo", "bhav", "purana"
    if (/\b(maal|kilo|purana|purane|dhoondo|bhav|daam)\b/i.test(clean)) {
      return 'hi';
    }

    // Fallback: If UI is English and pure English words were said without Indian markers
    if (currentUiLanguage === 'en' && /^[a-zA-Z0-9\s.,!?'"-]+$/.test(text)) {
      if (/\b(mere|paas|hain|hai|kilo|maal|purane|batao|dikhao|chahiye|wala)\b/i.test(clean)) {
        return 'hi';
      }
      return 'en';
    }

    return currentUiLanguage || 'hi';
  }
}

export const languageDetector = new LanguageDetector();
