// E-Waste Bridge: Centralized Interaction Feedback Dispatcher
// Principle: Every input must produce immediate, perceptible feedback.
// Tier 1: Visual feedback = MANDATORY (same frame, 100% reliable)
// Tier 2: Audio feedback = OPTIONAL / SYNTHESIZED (Web Audio API, zero asset load)
// Tier 3: Haptic feedback = PROGRESSIVE ENHANCEMENT (navigator.vibrate when supported)

class InteractionFeedbackDispatcher {
  constructor() {
    this.subscribers = new Set();
    this.audioCtx = null;
    this.audioEnabled = true;
    this.hapticsEnabled = true;
  }

  // Initialize lightweight Web Audio synth on first user interaction
  initAudio() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          this.audioCtx = new AudioContextClass();
        } catch (e) {
          // Graceful fallback if audio context blocked
        }
      }
    }
  }

  // Synthesize clean industrial micro-audio (no external mp3 files needed)
  playTone(frequency = 600, duration = 0.04, type = "sine", gainVal = 0.04) {
    if (!this.audioEnabled) return;
    this.initAudio();
    if (!this.audioCtx || this.audioCtx.state !== "running") {
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      return;
    }

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fails silently without crashing interaction
    }
  }

  // Progressive enhancement: Trigger mobile vibration if browser supports it
  triggerHaptic(pattern = 15) {
    if (!this.hapticsEnabled || typeof window === "undefined") return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Haptics fail gracefully
      }
    }
  }

  // Subscribe UI components to interaction events
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Primary event dispatch: Notifies all UI listeners, plays micro-tone, and triggers haptics
  dispatch(event) {
    const enrichedEvent = {
      id: "ev_" + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      source: event.source || "TOUCH", // "TOUCH" | "VOICE" | "CAMERA" | "HOLD"
      action: event.action || "UNKNOWN",
      status: event.status || "ACKNOWLEDGED", // "ACKNOWLEDGED" | "UNDERSTOOD" | "AMBIGUOUS" | "CANCELLED" | "SUCCESS" | "ERROR"
      target: event.target || "screen",
      payload: event.payload || {},
      undoable: !!event.undoable,
      onUndo: event.onUndo || null,
      message: event.message || ""
    };

    // Progressive physical & auditory feedback based on status
    if (enrichedEvent.status === "ACKNOWLEDGED") {
      this.triggerHaptic(12);
      this.playTone(850, 0.02, "sine", 0.02);
    } else if (enrichedEvent.status === "SUCCESS") {
      this.triggerHaptic([20, 30, 35]);
      this.playTone(920, 0.07, "triangle", 0.05);
    } else if (enrichedEvent.status === "CANCELLED") {
      this.triggerHaptic([35, 25]);
      this.playTone(320, 0.06, "sawtooth", 0.03);
    } else if (enrichedEvent.status === "AMBIGUOUS") {
      this.triggerHaptic(25);
      this.playTone(550, 0.05, "sine", 0.03);
    } else if (enrichedEvent.status === "MILESTONE") {
      this.triggerHaptic(20);
      this.playTone(720 + (enrichedEvent.payload.step || 1) * 80, 0.03, "sine", 0.03);
    }

    // Notify all UI subscribers
    this.subscribers.forEach((cb) => {
      try {
        cb(enrichedEvent);
      } catch (err) {
        console.error("Interaction subscriber error:", err);
      }
    });

    return enrichedEvent;
  }
}

export const feedbackDispatcher = new InteractionFeedbackDispatcher();

// Convenience Action Helpers
export function emitInputAck(source = "TOUCH", target = "button", payload = {}) {
  return feedbackDispatcher.dispatch({
    source,
    action: "INPUT_ACK",
    status: "ACKNOWLEDGED",
    target,
    payload
  });
}

export function emitStateChange(source = "TOUCH", action = "UPDATE", target = "value", payload = {}, undoConfig = null) {
  return feedbackDispatcher.dispatch({
    source,
    action,
    status: "UNDERSTOOD",
    target,
    payload,
    undoable: !!undoConfig,
    onUndo: undoConfig?.onUndo,
    message: undoConfig?.message
  });
}

export function emitSuccess(source = "TOUCH", action = "COMMIT", target = "transaction", message = "Action completed") {
  return feedbackDispatcher.dispatch({
    source,
    action,
    status: "SUCCESS",
    target,
    message
  });
}

export function emitCancelled(source = "HOLD", action = "HOLD_COMMIT", target = "transaction", message = "Transaction not committed") {
  return feedbackDispatcher.dispatch({
    source,
    action,
    status: "CANCELLED",
    target,
    message
  });
}

export function emitAmbiguity(source = "VOICE", action = "QUERY", prompt = "Aap kis buyer ki baat kar rahe hain?", options = []) {
  return feedbackDispatcher.dispatch({
    source,
    action,
    status: "AMBIGUOUS",
    target: "clarification",
    payload: { prompt, options }
  });
}

export function emitMilestone(step = 1, total = 5) {
  return feedbackDispatcher.dispatch({
    source: "HOLD",
    action: "HOLD_PROGRESS",
    status: "MILESTONE",
    target: "hold_timer",
    payload: { step, total }
  });
}

export default feedbackDispatcher;
