/**
 * PersistentProfile.js - localStorage-backed User Preference Store
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * PURPOSE: Stores preferences and domain interpretation corrections that
 * survive page reloads and across sessions.
 *
 * CONTAINS:
 *   - language preference
 *   - domain interpretation corrections (spoken variant → canonical term)
 *     NOTE: These correct POST-ASR interpretation, NOT the acoustic model.
 *     The Whisper/WebSpeech model still produces the original text; we remap
 *     it afterward. This is "domain interpretation memory", not "ASR adaptation".
 *
 * NOT for: session state (SessionState), turn context (TurnMemory),
 *          business data (AppState/LotStore)
 */

const STORAGE_KEY = 'ewaste_bridge_profile_v3';

export class PersistentProfile {
  constructor() {
    this._data = {
      language: 'hi',
      /** @type {Record<string, { canonicalTerm: string, materialId: string|null, confidence: number, timestamp: number }>} */
      domainInterpretations: {},
      preferredMaterial: null,
    };
    this._load();
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  _load() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this._data = { ...this._data, ...parsed };
        }
      }
    } catch (e) {
      console.warn('[PersistentProfile] Load failed:', e);
    }
  }

  _save() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      }
    } catch (e) {
      console.warn('[PersistentProfile] Save failed:', e);
    }
  }

  // ── Language ─────────────────────────────────────────────────────────────────

  get language() { return this._data.language; }

  setLanguage(lang) {
    if (['hi', 'mr', 'en'].includes(lang)) {
      this._data.language = lang;
      this._save();
    }
  }

  // ── Domain Interpretation Memory ─────────────────────────────────────────────
  // IMPORTANT: This remaps ASR output after recognition. It does NOT improve
  // what the acoustic model hears. Whisper still outputs "pankha kabaddi";
  // we map it to "PCB" here in post-processing.

  /**
   * Record a learned domain interpretation correction.
   * @param {string} spokenVariant  - What ASR produced, e.g. "pankha kabaddi"
   * @param {string} canonicalTerm  - What it actually means, e.g. "PCB"
   * @param {string|null} materialId - e.g. 'pcb'
   * @param {number} [confidence]
   */
  learnInterpretation(spokenVariant, canonicalTerm, materialId = null, confidence = 1.0) {
    if (!spokenVariant || !canonicalTerm) return;
    const key = spokenVariant.toLowerCase().trim();
    this._data.domainInterpretations[key] = {
      canonicalTerm,
      materialId,
      confidence,
      timestamp: Date.now(),
    };
    this._save();
  }

  /**
   * Look up a spoken variant in the interpretation table.
   * Returns null if not found.
   * @param {string} text
   * @returns {{ canonicalTerm: string, materialId: string|null }|null}
   */
  lookupInterpretation(text) {
    if (!text) return null;
    const lower = text.toLowerCase().trim();
    const entries = Object.entries(this._data.domainInterpretations);
    for (const [spoken, entry] of entries) {
      if (lower.includes(spoken)) {
        return entry;
      }
    }
    return null;
  }

  /** All stored interpretations (for debugging). */
  get allInterpretations() {
    return { ...this._data.domainInterpretations };
  }

  // ── Preferred Material ───────────────────────────────────────────────────────

  get preferredMaterial() { return this._data.preferredMaterial; }

  setPreferredMaterial(materialId) {
    this._data.preferredMaterial = materialId || null;
    this._save();
  }

  // ── Debug ─────────────────────────────────────────────────────────────────────

  toJSON() {
    return { ...this._data };
  }
}

export const persistentProfile = new PersistentProfile();
