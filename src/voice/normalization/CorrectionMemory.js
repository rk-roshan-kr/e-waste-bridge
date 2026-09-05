/**
 * CorrectionMemory.js — Domain Interpretation Memory
 * (Previously misnamed "recognition correction" — see note below)
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SCOPE: POST-ASR DOMAIN INTERPRETATION — NOT ASR ADAPTATION     ║
 * ║                                                                  ║
 * ║  What this does:                                                 ║
 * ║    ASR output: "pankha kabaddi"                                  ║
 * ║    Stored mapping: "pankha kabaddi" → "PCB"                      ║
 * ║    Result: downstream intent engine sees "PCB"                   ║
 * ║                                                                  ║
 * ║  What this does NOT do:                                          ║
 * ║    It does NOT improve what Whisper/WebSpeech hears acoustically. ║
 * ║    The ASR model still outputs "pankha kabaddi".                 ║
 * ║    We remap it afterward in this post-processing step.           ║
 * ║                                                                  ║
 * ║  For actual ASR acoustic adaptation, a separate fine-tuning or  ║
 * ║  prompt-engineering mechanism on the ASR model is required.      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export class CorrectionMemory {
  constructor(storageKey = 'ewaste_correction_memory') {
    this.storageKey = storageKey;
    this.memory = new Map();
    this.load();
  }

  load() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          Object.entries(parsed).forEach(([key, val]) => {
            this.memory.set(key.toLowerCase(), val);
          });
        }
      }
    } catch (e) {
      console.warn('[CorrectionMemory] Failed to load local memory', e);
    }
  }

  save() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj = {};
        this.memory.forEach((val, key) => {
          obj[key] = val;
        });
        window.localStorage.setItem(this.storageKey, JSON.stringify(obj));
      }
    } catch (e) {
      console.warn('[CorrectionMemory] Failed to save local memory', e);
    }
  }

  learnCorrection({ spokenVariant, canonicalTerm, entity, confidence = 1.0 }) {
    if (!spokenVariant || !canonicalTerm) return;
    this.memory.set(spokenVariant.toLowerCase().trim(), {
      canonicalTerm,
      entity,
      confidence,
      timestamp: Date.now()
    });
    this.save();
  }

  lookup(text) {
    if (!text || typeof text !== 'string') return text;
    let modified = text;

    this.memory.forEach((entry, spoken) => {
      const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
      if (regex.test(modified)) {
        modified = modified.replace(regex, entry.canonicalTerm);
      }
    });

    return modified;
  }
}

export const correctionMemory = new CorrectionMemory();
