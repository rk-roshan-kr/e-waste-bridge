/**
 * TranscriptBuffer.js - Multi-Segment Accumulator & Interim Word Streamer
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export class TranscriptBuffer {
  constructor() {
    this.segments = []; // Array of { text: string, timestamp: number, pauseAfterMs: number }
    this.currentInterim = '';
    this.lastCommittedText = '';
  }

  setInterim(text) {
    this.currentInterim = (text || '').trim();
  }

  appendFinal(text, pauseAfterMs = 0) {
    const clean = (text || '').trim();
    if (!clean) return;

    this.segments.push({
      text: clean,
      timestamp: Date.now(),
      pauseAfterMs
    });
    this.currentInterim = '';
  }

  getAccumulatedText() {
    const finalPart = this.segments.map(s => s.text).join(' ').trim();
    if (this.currentInterim) {
      return finalPart ? `${finalPart} ${this.currentInterim}` : this.currentInterim;
    }
    return finalPart;
  }

  getFinalOnlyText() {
    return this.segments.map(s => s.text).join(' ').trim();
  }

  clear() {
    this.segments = [];
    this.currentInterim = '';
    this.lastCommittedText = '';
  }
}
