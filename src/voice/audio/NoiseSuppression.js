/**
 * NoiseSuppression.js - Ambient Noise Estimation & Spectral Gating
 * Part of E-Waste Speech Intelligence Layer
 * Filters out background scrap-yard noise (machinery, fans, traffic, clatter).
 */

export class NoiseSuppression {
  constructor(options = {}) {
    this.ambientNoiseFloor = options.initialFloor || 0.035;
    this.adaptationRate = 0.05; // EMA smoothing rate
    this.speechMargin = 0.045; // Energy margin required above noise floor
  }

  updateNoiseEstimate(energy, isSpeechDetected) {
    if (!isSpeechDetected && energy > 0.001) {
      // Adapt noise floor only during silence
      this.ambientNoiseFloor = (1 - this.adaptationRate) * this.ambientNoiseFloor + this.adaptationRate * energy;
    }
  }

  isSignalAboveNoise(energy) {
    return energy > (this.ambientNoiseFloor + this.speechMargin);
  }

  getEffectiveThreshold() {
    return this.ambientNoiseFloor + this.speechMargin;
  }
}

export const noiseSuppression = new NoiseSuppression();
