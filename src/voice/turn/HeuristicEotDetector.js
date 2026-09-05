/**
 * HeuristicEotDetector.js - Multi-Signal End-of-Thought Detector
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * REPLACES: EotEngine.js (900ms timer only)
 *
 * EOT is decided by a weighted score across 4 independent signals:
 *
 *   eotScore = (
 *     silenceScore    * 0.30  +  // VAD silence duration
 *     grammarScore    * 0.30  +  // terminal vs incomplete token
 *     stabilityScore  * 0.25  +  // ASR transcript has stopped changing
 *     contextScore    * 0.15     // screen context has a completable intent match
 *   )
 *
 * Commit fires when: eotScore >= threshold AND silenceDuration >= graceWindowMs.
 *
 * The 900ms is still the minimum gate — but it alone no longer triggers commit.
 * A low eotScore (e.g. trailing with "aur", "lekin") will suppress commit even
 * past 900ms, letting the user continue.
 *
 * Tunable via config — defaults tuned for Indian field environment:
 *   graceWindowMs:        900   (minimum silence before any commit attempt)
 *   maxThinkingPauseMs:  2500   (silence ceiling: always commit after this)
 *   eotThreshold:        0.78   (score required to commit at grace window)
 */

// ── Vernacular terminal markers (multi-language) ──────────────────────────────
const TERMINAL_TOKENS = new Set([
  // Hindi
  'karo', 'kar do', 'chahiye', 'dikhana', 'batao', 'hoga', 'hai', 'dekhna',
  'suna', 'pakka', 'bata do', 'dikha do', 'check karo', 'dekh lo', 'bol do',
  'dena', 'lena', 'milega', 'milegi', 'chalta hai', 'theek hai', 'sahi hai',
  'acha hai', 'done', 'haan', 'ji haan',
  // Marathi
  'kara', 'sanga', 'ahe', 'ahet', 'dyaa', 'ghyaa', 'baghaa', 'thevaa',
  'pahaa', 'theek ahe', 'hota', 'zala', 'zali',
  // English (domain-specific)
  'show', 'find', 'accept', 'cancel', 'confirm', 'ok', 'done', 'yes', 'no',
]);

// ── Incomplete utterance markers — suppress EOT even past grace window ────────
const INCOMPLETE_TOKENS = new Set([
  // Hindi
  'aur', 'matlab', 'jisme', 'ki', 'ka', 'to', 'fir', 'lekin', 'waise',
  'mane', 'ek', 'wo', 'woh', 'jaise', 'toh', 'agar', 'jab', 'tab',
  // Marathi
  'ani', 'pan', 'mhanje', 'jevha', 'tevha', 'jar', 'tar',
  // English
  'and', 'but', 'if', 'when', 'the', 'a', 'with', 'for',
]);

// ── Correction markers — reset EOT clock when detected ───────────────────────
const CORRECTION_MARKERS = new Set([
  'actually', 'nahi', 'nai', 'sorry', 'wait', 'ruko', 'badal', 'change',
  'matlab', 'ek second', 'suno', 'arey',
]);

export class HeuristicEotDetector {
  constructor(config = {}) {
    this.graceWindowMs       = config.graceWindowMs       ?? 900;
    this.maxThinkingPauseMs  = config.maxThinkingPauseMs  ?? 2500;
    this.eotThreshold        = config.eotThreshold        ?? 0.78;
    this.stabilityWindowMs   = config.stabilityWindowMs   ?? 400;  // how long text must be stable

    // Stability tracking
    this._lastText           = '';
    this._textStableAt       = 0;
  }

  /**
   * Evaluate whether the current turn should be committed.
   *
   * @param {object} params
   * @param {number} params.silenceDurationMs  - ms of VAD silence
   * @param {string} params.currentText        - current accumulated transcript
   * @param {string} params.previousText       - transcript from previous evaluation (for stability)
   * @param {object} params.screenContext      - { screen, availableActions, visibleElements }
   * @param {number} params.nowMs              - current timestamp (performance.now())
   * @returns {{ eotScore, shouldCommit, breakdown, correctionDetected }}
   */
  evaluate({ silenceDurationMs, currentText, previousText, screenContext = {}, nowMs = performance.now() }) {
    const text = (currentText || '').trim();

    if (!text) {
      return { eotScore: 0, shouldCommit: false, breakdown: null, correctionDetected: false };
    }

    // Always commit after max thinking pause regardless of score
    if (silenceDurationMs >= this.maxThinkingPauseMs) {
      return {
        eotScore: 1.0,
        shouldCommit: true,
        breakdown: { silenceScore: 1, grammarScore: 1, stabilityScore: 1, contextScore: 1 },
        correctionDetected: false,
        forcedByTimeout: true,
      };
    }

    // Not enough silence yet — return low score, no commit
    if (silenceDurationMs < this.graceWindowMs * 0.5) {
      return { eotScore: 0.05, shouldCommit: false, breakdown: null, correctionDetected: false };
    }

    const tokens  = text.toLowerCase().trim().split(/\s+/);
    const lastTok = tokens[tokens.length - 1];

    // ── Correction detection — reset stability clock ──────────────────────────
    const correctionDetected = tokens.some((t) => CORRECTION_MARKERS.has(t));
    if (correctionDetected) {
      this._lastText    = '';
      this._textStableAt = 0;
    }

    // ── Signal 1: Silence score ───────────────────────────────────────────────
    // Normalized: 0.0 (at graceWindow) → 1.0 (at maxThinkingPause)
    const silenceRange  = this.maxThinkingPauseMs - this.graceWindowMs;
    const silenceAbove  = Math.max(0, silenceDurationMs - this.graceWindowMs);
    const silenceScore  = Math.min(silenceAbove / silenceRange, 1.0);

    // ── Signal 2: Grammar score ───────────────────────────────────────────────
    let grammarScore = 0.55; // neutral baseline
    const ltext      = text.toLowerCase();

    if (TERMINAL_TOKENS.has(lastTok) || [...TERMINAL_TOKENS].some((t) => ltext.endsWith(t))) {
      grammarScore = 0.95;
    } else if (INCOMPLETE_TOKENS.has(lastTok)) {
      grammarScore = 0.10; // strongly suppress — user is mid-sentence
    } else if (correctionDetected) {
      grammarScore = 0.15;
    }

    // Sentence-final punctuation / capitalization signal (English)
    if (/[.!?]$/.test(text) || /\bkaro\b|\bhai\b|\bahe\b/.test(ltext)) {
      grammarScore = Math.max(grammarScore, 0.85);
    }

    // ── Signal 3: Transcript stability score ──────────────────────────────────
    // High when text hasn't changed for >= stabilityWindowMs
    let stabilityScore = 0;
    if (text !== this._lastText) {
      this._lastText    = text;
      this._textStableAt = nowMs;
    }
    const stableFor    = nowMs - this._textStableAt;
    stabilityScore     = Math.min(stableFor / this.stabilityWindowMs, 1.0);

    // ── Signal 4: Context score ───────────────────────────────────────────────
    // Does the screen have an action that matches the current text?
    let contextScore = 0.3; // baseline — we don't always have context
    if (screenContext.availableActions && screenContext.availableActions.length > 0) {
      const hasMatch = screenContext.availableActions.some((action) =>
        action && ltext.includes(action.toLowerCase())
      );
      contextScore = hasMatch ? 0.9 : 0.2;
    }
    // Minimum weight of 1+ entity detected in text
    const hasWeight    = /\b\d+(\.\d+)?\s*(kg|kilo|gram|g)\b/i.test(text);
    const hasMaterial  = /laptop|mobile|pcb|battery|cable|copper|tamba|motherboard/i.test(text);
    if (hasWeight || hasMaterial) contextScore = Math.max(contextScore, 0.7);

    // ── Weighted composite ────────────────────────────────────────────────────
    const eotScore = (
      silenceScore   * 0.30 +
      grammarScore   * 0.30 +
      stabilityScore * 0.25 +
      contextScore   * 0.15
    );

    const shouldCommit = (
      eotScore >= this.eotThreshold &&
      silenceDurationMs >= this.graceWindowMs
    );

    return {
      eotScore:           parseFloat(eotScore.toFixed(3)),
      shouldCommit,
      correctionDetected,
      breakdown: {
        silenceScore:    parseFloat(silenceScore.toFixed(3)),
        grammarScore:    parseFloat(grammarScore.toFixed(3)),
        stabilityScore:  parseFloat(stabilityScore.toFixed(3)),
        contextScore:    parseFloat(contextScore.toFixed(3)),
        silenceDurationMs,
        stableForMs:     Math.round(stableFor),
      },
    };
  }

  /** Reset stability tracking (call on session reset / barge-in) */
  reset() {
    this._lastText    = '';
    this._textStableAt = 0;
  }
}

export const heuristicEotDetector = new HeuristicEotDetector();
