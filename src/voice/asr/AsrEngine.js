/**
 * AsrEngine.js - Streaming ASR Orchestrator
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { AsrProvider } from './AsrProvider.js';

export class AsrEngine {
  constructor() {
    this.provider = new AsrProvider();
    this.listeners = {
      onInterim: [],
      onFinal: [],
      onError: []
    };
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

  initialize(lang = 'hi') {
    this.provider.setLanguage(lang);
    return this.provider.initialize({
      onInterim: (res) => this.emit('onInterim', res),
      onFinal: (res) => this.emit('onFinal', res),
      onError: (err) => this.emit('onError', err),
      onEnd: () => {
        // Auto-restart if session was supposed to be continuous and didn't terminate intentionally
        if (this.provider.shouldBeListening) {
          try { this.provider.start(); } catch (e) {}
        }
      }
    });
  }

  start() {
    this.provider.start();
  }

  stop() {
    this.provider.stop();
  }

  setLanguage(lang) {
    this.provider.setLanguage(lang);
  }
}

export const asrEngine = new AsrEngine();
