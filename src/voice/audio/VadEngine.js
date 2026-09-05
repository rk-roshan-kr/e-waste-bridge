/**
 * VadEngine.js - Frame-Level Voice Activity Detection
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { echoCancellation } from './EchoCancellation.js';
import { noiseSuppression } from './NoiseSuppression.js';

export class VadEngine {
  constructor(options = {}) {
    this.isSpeaking = false;
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
    this.listeners = {
      onSpeechStart: [],
      onSpeechFrame: [],
      onSpeechPause: [],
      onBargeIn: []
    };
    this.active = false;
    this.pollTimer = null;
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  start(audioInput) {
    this.active = true;
    this.isSpeaking = false;
    this.silenceStartTime = Date.now();

    const checkFrame = () => {
      if (!this.active) return;
      const energy = audioInput.getEnergy();

      // 1. Check for Acoustic Echo Cancellation when Assistant TTS is speaking
      if (echoCancellation.isAssistantSpeaking) {
        if (echoCancellation.isBargeInInterrupt({ currentEnergy: energy, baseNoiseFloor: noiseSuppression.ambientNoiseFloor })) {
          // Genuine user barge-in!
          this.emit('onBargeIn', { energy, timestamp: Date.now() });
        }
        this.pollTimer = setTimeout(checkFrame, 30);
        return;
      }

      // 2. Normal speech vs background noise separation
      noiseSuppression.updateNoiseEstimate(energy, this.isSpeaking);
      const currentlyHasSpeech = noiseSuppression.isSignalAboveNoise(energy);

      if (currentlyHasSpeech && !this.isSpeaking) {
        this.isSpeaking = true;
        this.speechStartTime = Date.now();
        this.emit('onSpeechStart', { energy, timestamp: this.speechStartTime });
      } else if (currentlyHasSpeech && this.isSpeaking) {
        this.emit('onSpeechFrame', { energy, durationMs: Date.now() - this.speechStartTime });
      } else if (!currentlyHasSpeech && this.isSpeaking) {
        this.isSpeaking = false;
        this.silenceStartTime = Date.now();
        const totalSpeechDurationMs = this.silenceStartTime - this.speechStartTime;
        this.emit('onSpeechPause', { energy, durationMs: totalSpeechDurationMs, timestamp: this.silenceStartTime });
      }

      this.pollTimer = setTimeout(checkFrame, 30); // ~33Hz polling (30ms frames)
    };

    checkFrame();
  }

  stop() {
    this.active = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.isSpeaking = false;
  }
}
