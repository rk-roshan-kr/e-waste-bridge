/**
 * AudioSession.js - Audio Capture Lifecycle & Interruption Coordination
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { audioInput } from './AudioInput.js';
import { VadEngine } from './VadEngine.js';

export class AudioSession {
  constructor() {
    this.audioInput = audioInput;
    this.vad = new VadEngine();
    this.active = false;
    this.muted = false;
  }

  async start() {
    const success = await this.audioInput.initialize();
    if (!success) return false;

    this.active = true;
    this.muted = false;
    this.vad.start(this.audioInput);
    return true;
  }

  mute() {
    this.muted = true;
  }

  unmute() {
    this.muted = false;
  }

  stop() {
    this.vad.stop();
    this.audioInput.stop();
    this.active = false;
    this.muted = false;
  }
}

export const audioSession = new AudioSession();
