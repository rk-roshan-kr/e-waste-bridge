/**
 * AsrProvider.js - Streaming ASR Adapter (IndicConformer & Web Speech Fallback)
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { AsrProviders, createTranscriptResult } from './transcriptTypes.js';

export class AsrProvider {
  constructor(options = {}) {
    this.providerType = options.providerType || AsrProviders.WEB_SPEECH_FALLBACK;
    this.recognition = null;
    this.isListening = false;
    this.shouldBeListening = false;
    this.language = options.language || 'hi-IN';
    this.onInterimCb = null;
    this.onFinalCb = null;
    this.onErrorCb = null;
    this.onEndCb = null;
  }

  setLanguage(langCode) {
    if (langCode === 'hi') this.language = 'hi-IN';
    else if (langCode === 'mr') this.language = 'mr-IN';
    else this.language = 'en-IN';

    if (this.recognition) {
      this.recognition.lang = this.language;
    }
  }

  initialize(callbacks = {}) {
    this.onInterimCb = callbacks.onInterim;
    this.onFinalCb = callbacks.onFinal;
    this.onErrorCb = callbacks.onError;
    this.onEndCb = callbacks.onEnd;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[AsrProvider] Web Speech API not supported in this browser environment');
      return false;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim && this.onInterimCb) {
          this.onInterimCb(createTranscriptResult({
            text: interim,
            isFinal: false,
            provider: this.providerType,
            language: this.language
          }));
        }

        if (final && this.onFinalCb) {
          this.onFinalCb(createTranscriptResult({
            text: final,
            isFinal: true,
            provider: this.providerType,
            language: this.language
          }));
        }
      };

      this.recognition.onerror = (event) => {
        // Silently ignore 'no-speech' or 'aborted' as normal conversation flow
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.warn('[AsrProvider] Recognition error:', event.error);
        if (this.onErrorCb) this.onErrorCb(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCb) this.onEndCb();
      };

      return true;
    } catch (err) {
      console.error('[AsrProvider] Failed to initialize recognition:', err);
      return false;
    }
  }

  start() {
    if (!this.recognition) return;
    this.shouldBeListening = true;
    if (this.isListening) return;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      // Ignored if already starting
    }
  }

  stop() {
    this.shouldBeListening = false;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
    this.isListening = false;
  }
}

export const asrProvider = new AsrProvider();
