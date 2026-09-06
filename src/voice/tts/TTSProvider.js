/**
 * TTSProvider.js - Pluggable Vernacular Neural TTS Adapter with Studio Audio & Barge-In Abort
 * Part of E-Waste Bridge Architecture Blueprint v2
 * High-fidelity, warm human Indian-language speech output
 */

import { IndicF5AudioBank } from '../../data/indicF5AudioBank.js';
import { normalizeForTTS } from './TTSNormalizer.js';

export class TTSProvider {
  constructor() {
    this.currentAudio = null;
    this.activeUtterance = null;
    this.isPlayingAudio = false;
    this.onBargeInCb = null;
    this.activeProvider = 'INDIC_F5_NEURAL';
    this.cachedVoices = [];
    this.initVoiceListener();
  }

  initVoiceListener() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        try {
          const v = window.speechSynthesis.getVoices();
          if (v && v.length > 0) this.cachedVoices = v;
        } catch (e) {}
      };
      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    }
  }

  getAvailableVoices() {
    if (this.cachedVoices && this.cachedVoices.length > 0) return this.cachedVoices;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          this.cachedVoices = v;
          return v;
        }
      } catch (e) {}
    }
    return [];
  }

  registerBargeInHandler(callback) {
    this.onBargeInCb = callback;
  }

  async speak({ text, audioKey, language = 'hi', onStart, onEnd }) {
    this.stop();
    this.isPlayingAudio = true;

    if (onStart) onStart();

    // 1. Primary: Check if precomputed neural IndicF5 clip matches (via key or text)
    const clip = (audioKey && IndicF5AudioBank.clips[audioKey]) 
      || IndicF5AudioBank.findMatch(audioKey || text, language);

    if (clip && clip.audioUrl) {
      try {
        const success = await this.playPrecomputedClip(clip, onEnd);
        if (success) {
          return { provider: 'INDIC_F5_NEURAL', success: true };
        }
      } catch (err) {
        console.warn('[TTSProvider] Precomputed clip failed, degrading to neural browser voice', err);
      }
    }

    // 2. High-Quality Natural Fallback: Enriched Browser Speech Synthesis
    this.speakWithBrowserFallback(text, language, onEnd);
    return { provider: 'BROWSER_NEURAL_FALLBACK', success: true };
  }

  playPrecomputedClip(clip, onEnd) {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(clip.audioUrl);
        this.currentAudio = audio;

        audio.onended = () => {
          this.isPlayingAudio = false;
          this.currentAudio = null;
          if (onEnd) onEnd();
          resolve(true);
        };

        audio.onerror = (err) => {
          console.warn('[TTSProvider] Audio load error for clip:', clip.id, err);
          this.isPlayingAudio = false;
          this.currentAudio = null;
          resolve(false);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[TTSProvider] Audio autoplay restricted or blocked:', err);
            this.isPlayingAudio = false;
            this.currentAudio = null;
            resolve(false);
          });
        }
      } catch (e) {
        console.warn('[TTSProvider] HTMLAudioElement instantiation exception:', e);
        resolve(false);
      }
    });
  }

  speakWithBrowserFallback(text, language, onEnd) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isPlayingAudio = false;
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Apply vernacular normalization (expands ₹, numbers, Latin terms to phonetic Devanagari)
      const normalizedText = normalizeForTTS(text, language);
      const utterance = new SpeechSynthesisUtterance(normalizedText || text);

      const targetLang = language === 'mr' ? 'mr-IN' : language === 'en' ? 'en-IN' : 'hi-IN';
      utterance.lang = targetLang;

      // Select top-tier natural human-like Indian voice if available in OS / browser
      const voices = this.getAvailableVoices();
      if (voices && voices.length > 0) {
        let selected = null;
        if (language === 'hi') {
          selected = voices.find(v => (v.name.includes('Swara') || v.name.includes('Madhur')) && v.lang.includes('hi'))
            || voices.find(v => v.lang.includes('hi') && (v.name.includes('Natural') || v.name.includes('Online')))
            || voices.find(v => v.lang.includes('hi') && v.name.includes('Google'))
            || voices.find(v => v.lang.includes('hi'))
            || voices.find(v => v.lang.startsWith('hi'));
        } else if (language === 'mr') {
          selected = voices.find(v => v.name.includes('Aarohi') && v.lang.includes('mr'))
            || voices.find(v => v.lang.includes('mr') && (v.name.includes('Natural') || v.name.includes('Online')))
            || voices.find(v => v.lang.includes('mr') && v.name.includes('Google'))
            || voices.find(v => v.lang.includes('mr'))
            // Hindi neural voice Swara/Madhur renders Devanagari Marathi with far greater warmth than mechanical English fallback
            || voices.find(v => (v.name.includes('Swara') || v.name.includes('Madhur')) && v.lang.includes('hi'))
            || voices.find(v => v.lang.includes('hi'));
        } else {
          selected = voices.find(v => (v.name.includes('Neerja') || v.name.includes('Prabhat')) && v.lang.includes('en'))
            || voices.find(v => (v.lang.includes('en-IN') || v.lang === 'en_IN') && (v.name.includes('Natural') || v.name.includes('Online')))
            || voices.find(v => v.lang.includes('en-IN') || v.lang === 'en_IN');
        }
        if (selected) utterance.voice = selected;
      }

      // Warm human cadence: 0.90x pacing prevents rushed robotic phoneme clipping
      utterance.rate = 0.90;
      utterance.pitch = 1.02;

      utterance.onend = () => {
        this.isPlayingAudio = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.isPlayingAudio = false;
        if (onEnd) onEnd();
      };

      this.activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[TTSProvider] Speech synthesis error:', err);
      this.isPlayingAudio = false;
      if (onEnd) onEnd();
    }
  }

  stop() {
    this.isPlayingAudio = false;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    this.activeUtterance = null;
  }

  handleBargeIn() {
    if (this.isPlayingAudio) {
      this.stop();
      if (this.onBargeInCb) {
        this.onBargeInCb({ timestamp: Date.now() });
      }
      return true;
    }
    return false;
  }

  isPlaying() {
    return this.isPlayingAudio || (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);
  }
}

export const ttsProvider = new TTSProvider();
