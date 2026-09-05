/**
 * EchoCancellation.js - Acoustic Echo Cancellation & Self-Speech Gate
 * Part of E-Waste Speech Intelligence Layer
 * Prevents the microphone from mistaking the assistant's own TTS output for user speech.
 */

export class EchoCancellation {
  constructor() {
    this.isAssistantSpeaking = false;
    this.duckingFactor = 2.4; // Multiplier applied to energy threshold when TTS is active
    this.playbackStartTime = 0;
  }

  setAssistantSpeaking(speaking) {
    this.isAssistantSpeaking = Boolean(speaking);
    if (speaking) {
      this.playbackStartTime = Date.now();
    }
  }

  isEcho({ currentEnergy, baseNoiseFloor }) {
    // If assistant is silent, it's definitely not echo
    if (!this.isAssistantSpeaking) return false;

    // When assistant is speaking, mic level rises due to phone speaker output.
    // If energy is within normal speaker reverberation range (< baseNoiseFloor * duckingFactor),
    // we classify it as self-echo and gate it out.
    const duckedThreshold = baseNoiseFloor * this.duckingFactor;
    return currentEnergy <= duckedThreshold;
  }

  isBargeInInterrupt({ currentEnergy, baseNoiseFloor }) {
    if (!this.isAssistantSpeaking) return false;
    // Genuine human interruption is noticeably louder than speaker leakage (+12dB to +18dB)
    const interruptThreshold = baseNoiseFloor * (this.duckingFactor + 1.6);
    return currentEnergy > interruptThreshold;
  }
}

export const echoCancellation = new EchoCancellation();
