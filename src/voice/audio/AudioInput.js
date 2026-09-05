/**
 * AudioInput.js - Hardware Microphone Capture & Analyser Stream
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export class AudioInput {
  constructor() {
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.isRecording = false;
    this.permissionState = 'prompt'; // 'prompt' | 'granted' | 'denied'
  }

  async initialize() {
    if (this.audioContext && this.stream) return true;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[AudioInput] getUserMedia not supported in this browser');
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.permissionState = 'granted';

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.2;

        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.source.connect(this.analyser);
      }

      this.isRecording = true;
      return true;
    } catch (err) {
      console.warn('[AudioInput] Microphone access error:', err);
      this.permissionState = err.name === 'NotAllowedError' ? 'denied' : 'prompt';
      return false;
    }
  }

  getEnergy() {
    if (!this.analyser) return 0;
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i];
    }
    return sum / (buffer.length * 255); // 0.0 to 1.0
  }

  getWaveformData() {
    if (!this.analyser) return new Uint8Array(64);
    const buffer = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.analyser = null;
    this.source = null;
    this.isRecording = false;
  }
}

export const audioInput = new AudioInput();
