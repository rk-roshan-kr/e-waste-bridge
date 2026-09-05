/**
 * VoiceMetrics.js - Turn-Level Voice Latency Measurement System
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * PURPOSE: Measure actual latencies — never claim performance without data.
 *
 * Metrics per turn:
 *   vadOnsetMs      — speech onset → VAD fires onSpeechStart
 *   asrFirstTokenMs — speech onset → first interim transcript received
 *   turnCommitMs    — silence onset → TurnManager.commitTurn() fires
 *   intentMs        — raw transcript received → intent classified
 *   toolMs          — intent classified → DomainToolResult returned
 *   ttsStartMs      — toolResult ready → TTS audio begins playing
 *   bargeInLatencyMs— speech onset (during TTS) → TTS audio stops
 *   e2eMs           — speech onset → TTS playback ends
 */

const MARKS = {};

export class VoiceMetrics {
  constructor() {
    this._lastTurnReport = null;
    this._sessionTurns = [];
    this._sessionId = null;
  }

  startSession(sessionId) {
    this._sessionId = sessionId || `session_${Date.now()}`;
    this._sessionTurns = [];
    this._lastTurnReport = null;
  }

  // ── Mark helpers ──────────────────────────────────────────────────────────

  mark(name) {
    const key = `ewb_${name}`;
    MARKS[key] = performance.now();
    try { performance.mark(key); } catch (e) { /* SSR safety */ }
  }

  _elapsed(fromName, toName) {
    const from = MARKS[`ewb_${fromName}`];
    const to   = MARKS[`ewb_${toName}`];
    if (from == null || to == null) return null;
    return Math.round(to - from);
  }

  // ── Per-turn measurement flow ─────────────────────────────────────────────
  // Call these at the appropriate moment in the pipeline:

  markSpeechOnset()      { this.mark('speech_onset'); }
  markAsrFirstToken()    { this.mark('asr_first_token'); }
  markSilenceOnset()     { this.mark('silence_onset'); }
  markTurnCommit()       { this.mark('turn_commit'); }
  markIntentClassified() { this.mark('intent_classified'); }
  markToolComplete()     { this.mark('tool_complete'); }
  markTtsStart()         { this.mark('tts_start'); }
  markTtsEnd()           { this.mark('tts_end'); }
  markBargeInDetected()  { this.mark('barge_in_detected'); }
  markBargeInStopped()   { this.mark('barge_in_stopped'); }

  /**
   * Compute and store the completed turn report.
   * Call after TTS ends (or after barge-in if interrupted).
   * @returns {object} Turn latency report
   */
  commitTurnReport() {
    const report = {
      sessionId:        this._sessionId,
      timestamp:        Date.now(),
      vadOnsetMs:       this._elapsed('speech_onset', 'speech_onset'),   // self = 0 (reference point)
      asrFirstTokenMs:  this._elapsed('speech_onset', 'asr_first_token'),
      turnCommitMs:     this._elapsed('silence_onset', 'turn_commit'),
      intentMs:         this._elapsed('turn_commit', 'intent_classified'),
      toolMs:           this._elapsed('intent_classified', 'tool_complete'),
      ttsStartMs:       this._elapsed('tool_complete', 'tts_start'),
      bargeInLatencyMs: this._elapsed('barge_in_detected', 'barge_in_stopped'),
      e2eMs:            this._elapsed('speech_onset', 'tts_end'),
    };

    this._lastTurnReport = report;
    this._sessionTurns.push(report);

    // Clear marks for next turn
    Object.keys(MARKS).forEach((k) => { if (k.startsWith('ewb_')) delete MARKS[k]; });

    return report;
  }

  /** Most recent turn report (for AIStackInspector display). */
  getLastTurnReport() {
    return this._lastTurnReport;
  }

  /** Session summary across all turns. */
  getSessionSummary() {
    const turns = this._sessionTurns.filter((t) => t.e2eMs != null);
    if (turns.length === 0) return null;

    const avg = (arr) => {
      const valid = arr.filter((v) => v != null);
      return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };

    return {
      sessionId:        this._sessionId,
      turnCount:        this._sessionTurns.length,
      avgE2eMs:         avg(turns.map((t) => t.e2eMs)),
      maxE2eMs:         Math.max(...turns.map((t) => t.e2eMs)),
      avgAsrFirstTokenMs: avg(turns.map((t) => t.asrFirstTokenMs)),
      avgIntentMs:      avg(turns.map((t) => t.intentMs)),
      maxBargeInLatencyMs: Math.max(...turns.map((t) => t.bargeInLatencyMs).filter((v) => v != null), 0) || null,
    };
  }
}

export const voiceMetrics = new VoiceMetrics();
