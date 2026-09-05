/**
 * TurnManager.js - Core Conversational Turn Taking & Multi-Segment Buffer
 * Part of E-Waste Speech Intelligence Layer
 *
 * Implements deterministic turn management:
 * 1. Accumulates interim and final speech segments across natural pauses
 * 2. Recognizes PAUSE (grace window ~900ms) without committing prematurely
 * 3. Commits turn independently of browser speech recognition disconnection
 * 4. Supports user speech resumption and barge-in
 */

export class TurnManager {
  constructor(config = {}) {
    this.state = "IDLE"; // "IDLE" | "LISTENING" | "PAUSED_WAITING" | "PROCESSING" | "SPEAKING"
    this.finalText = "";
    this.interimText = "";
    this.pauseStartedAt = null;
    this.graceTimer = null;
    this.graceWindowMs = config.graceWindowMs || 450;
    this.onTurnComplete = null;

    this.listeners = {
      onStateChange: [],
      onInterim: [],
      onFinal: [],
      onTurnCommit: [],
      onBargeIn: []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try { cb(data); } catch (e) { console.error(`[TurnManager] error in ${event} listener`, e); }
      });
    }
  }

  startSession() {
    this.reset();
    this.state = "LISTENING";
    this.emit("onStateChange", this.state);
  }

  onSpeechStart() {
    this.state = "LISTENING";
    this.pauseStartedAt = null;
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    this.emit("onStateChange", this.state);
  }

  onInterim(text) {
    this.interimText = text || "";
    this.onSpeechResume();
    this.emit("onInterim", {
      interim: this.interimText,
      accumulated: this.getAccumulatedText()
    });
  }

  onFinal(text) {
    if (text && text.trim()) {
      this.finalText += `${text.trim()} `;
      this.interimText = "";
    }
    this.onSpeechResume();
    this.emit("onFinal", {
      final: text,
      accumulated: this.getAccumulatedText()
    });
  }

  updateTranscript({ finalText = "", interimText = "" }) {
    if (finalText) {
      this.finalText += `${finalText.trim()} `;
    }
    this.interimText = interimText || "";
    this.onSpeechResume();
    this.emit("onInterim", {
      interim: this.interimText,
      accumulated: this.getAccumulatedText()
    });
  }

  onSpeechStop() {
    const accumulated = this.getAccumulatedText();
    if (!accumulated) return;

    this.state = "PAUSED_WAITING";
    this.pauseStartedAt = performance.now();
    this.emit("onStateChange", this.state, { accumulated });

    if (this.graceTimer) clearTimeout(this.graceTimer);

    this.graceTimer = setTimeout(() => {
      this.commitTurn();
    }, this.graceWindowMs);
  }

  onSpeechResume() {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    if (this.state !== "LISTENING") {
      this.state = "LISTENING";
      this.emit("onStateChange", this.state, { accumulated: this.getAccumulatedText() });
    }
  }

  commitTurn() {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }

    const text = this.getAccumulatedText();
    if (!text) return;

    this.state = "PROCESSING";
    this.emit("onStateChange", this.state, { transcript: text });
    this.emit("onTurnCommit", { transcript: text, sessionId: `turn_${Date.now()}` });

    if (this.onTurnComplete) {
      this.onTurnComplete(text);
    }

    this.finalText = "";
    this.interimText = "";
  }

  handleBargeIn() {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    this.state = "LISTENING";
    this.emit("onBargeIn", { timestamp: Date.now() });
    this.emit("onStateChange", this.state);
  }

  getAccumulatedText() {
    return `${this.finalText} ${this.interimText}`.trim();
  }

  reset() {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    this.state = "IDLE";
    this.finalText = "";
    this.interimText = "";
    this.pauseStartedAt = null;
    this.emit("onStateChange", this.state);
  }

  cancelTurn() {
    this.reset();
  }
}

export const turnManager = new TurnManager();
