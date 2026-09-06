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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          this.cachedVoices = v;
          return v;
        }
      } catch (e) {}
    }
    if (this.cachedVoices && this.cachedVoices.length > 0) return this.cachedVoices;
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

      // Select sweet, loving female voice (strictly eliminating male robotic voices)
      const voices = this.getAvailableVoices();
      const selected = this.selectSweetFemaleVoice(language, voices);
      if (selected) {
        utterance.voice = selected;
      }

      // Sweet, warm, loving feminine prosody:
      // - pitch: 1.16 gives high melodic warmth and eliminates low robotic drone
      // - rate: 0.88 gives gentle, unhurried, loving cadence
      // - volume: 1.0 ensures crisp clarity
      utterance.pitch = 1.16;
      utterance.rate = 0.88;
      utterance.volume = 1.0;

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

  isMaleVoice(voice) {
    if (!voice || !voice.name) return false;
    const name = voice.name.toLowerCase();
    return (
      name.includes('madhur') ||
      name.includes('hemant') ||
      name.includes('prabhat') ||
      name.includes('david') ||
      name.includes('mark') ||
      name.includes('george') ||
      name.includes('ravi') ||
      name.includes('guy') ||
      name.includes('male') ||
      name.includes('man') ||
      name.includes('stefan') ||
      name.includes('brian') ||
      name.includes('richard') ||
      name.includes('james') ||
      name.includes('paul') ||
      name.includes('sean') ||
      name.includes('raul') ||
      name.includes('ryan') ||
      name.includes('christopher') ||
      name.includes('eric') ||
      name.includes('deepak') ||
      name.includes('anand') ||
      name.includes('ajay') ||
      name.includes('rajesh') ||
      name.includes('amit')
    );
  }

  isExplicitlyFemale(voice) {
    if (!voice || !voice.name) return false;
    const name = voice.name.toLowerCase();
    return (
      name.includes('female') ||
      name.includes('woman') ||
      name.includes('girl') ||
      name.includes('swara') ||
      name.includes('aarohi') ||
      name.includes('neerja') ||
      name.includes('kalpana') ||
      name.includes('lekha') ||
      name.includes('veena') ||
      name.includes('sangeeta') ||
      name.includes('zira') ||
      name.includes('samantha') ||
      name.includes('karen') ||
      name.includes('victoria') ||
      name.includes('hazel') ||
      name.includes('susan') ||
      name.includes('jenny') ||
      name.includes('aria') ||
      name.includes('ananya') ||
      name.includes('aditi') ||
      name.includes('heera') ||
      name.includes('priya')
    );
  }

  selectSweetFemaleVoice(language, voices) {
    if (!voices || voices.length === 0) return null;

    if (language === 'hi') {
      // 1. Top pick: Microsoft Swara Online (Natural) - famous sweet, loving Indian female voice
      let v = voices.find(voice => voice.name.includes('Swara') && !this.isMaleVoice(voice));
      if (v) return v;

      // 2. Google Hindi Female
      v = voices.find(voice => voice.lang.includes('hi') && voice.name.includes('Google') && !this.isMaleVoice(voice));
      if (v) return v;

      // 3. Any Natural/Online Hindi Female
      v = voices.find(voice => voice.lang.includes('hi') && (voice.name.includes('Natural') || voice.name.includes('Online')) && !this.isMaleVoice(voice));
      if (v) return v;

      // 4. Apple Lekha / Kalpana (Female)
      v = voices.find(voice => voice.lang.includes('hi') && (voice.name.includes('Lekha') || voice.name.includes('Kalpana')) && !this.isMaleVoice(voice));
      if (v) return v;

      // 5. Any non-male Hindi voice
      v = voices.find(voice => voice.lang.includes('hi') && !this.isMaleVoice(voice));
      if (v) return v;

      // 6. Fallback: Sweet Indian English female voice (e.g. Neerja / Veena / Sangeeta) rather than harsh male robot
      v = voices.find(voice => (voice.name.includes('Neerja') || voice.name.includes('Veena') || voice.name.includes('Sangeeta')) && !this.isMaleVoice(voice));
      if (v) return v;

      // 7. Any explicitly female voice on system
      v = voices.find(voice => this.isExplicitlyFemale(voice) && !this.isMaleVoice(voice));
      if (v) return v;

      return voices.find(voice => !this.isMaleVoice(voice)) || voices[0];
    }

    if (language === 'mr') {
      // 1. Top pick: Microsoft Aarohi Online (Natural) - sweet, loving Marathi female voice
      let v = voices.find(voice => voice.name.includes('Aarohi') && !this.isMaleVoice(voice));
      if (v) return v;

      // 2. Google Marathi Female
      v = voices.find(voice => voice.lang.includes('mr') && voice.name.includes('Google') && !this.isMaleVoice(voice));
      if (v) return v;

      // 3. Any Natural/Online Marathi Female
      v = voices.find(voice => voice.lang.includes('mr') && (voice.name.includes('Natural') || voice.name.includes('Online')) && !this.isMaleVoice(voice));
      if (v) return v;

      // 4. Any non-male Marathi voice
      v = voices.find(voice => voice.lang.includes('mr') && !this.isMaleVoice(voice));
      if (v) return v;

      // 5. Devanagari sister fallback: Microsoft Swara (Sweet female Hindi voice reads Devanagari Marathi with far more sweetness than robotic male)
      v = voices.find(voice => voice.name.includes('Swara') && !this.isMaleVoice(voice));
      if (v) return v;

      // 6. Any non-male Hindi voice
      v = voices.find(voice => voice.lang.includes('hi') && !this.isMaleVoice(voice));
      if (v) return v;

      // 7. Any explicitly female voice on system
      v = voices.find(voice => this.isExplicitlyFemale(voice) && !this.isMaleVoice(voice));
      if (v) return v;

      return voices.find(voice => !this.isMaleVoice(voice)) || voices[0];
    }

    // English (default / en-IN)
    // 1. Top pick: Microsoft Neerja Online (Natural) - sweet, warm, loving Indian English female voice
    let v = voices.find(voice => voice.name.includes('Neerja') && !this.isMaleVoice(voice));
    if (v) return v;

    // 2. Apple Veena / Sangeeta (Indian English Female)
    v = voices.find(voice => (voice.name.includes('Veena') || voice.name.includes('Sangeeta')) && !this.isMaleVoice(voice));
    if (v) return v;

    // 3. Any Natural Indian English Female
    v = voices.find(voice => (voice.lang.includes('en-IN') || voice.lang.includes('en_IN')) && (voice.name.includes('Natural') || voice.name.includes('Online')) && !this.isMaleVoice(voice));
    if (v) return v;

    // 4. Google English India Female
    v = voices.find(voice => (voice.lang.includes('en-IN') || voice.lang.includes('en_IN')) && !this.isMaleVoice(voice));
    if (v) return v;

    // 5. Any explicitly female English voice (e.g. Zira, Jenny, Aria, Samantha)
    v = voices.find(voice => voice.lang.includes('en') && this.isExplicitlyFemale(voice) && !this.isMaleVoice(voice));
    if (v) return v;

    // 6. Any non-male English voice
    v = voices.find(voice => voice.lang.includes('en') && !this.isMaleVoice(voice));
    if (v) return v;

    // 7. Any explicitly female voice on system
    v = voices.find(voice => this.isExplicitlyFemale(voice) && !this.isMaleVoice(voice));
    if (v) return v;

    return voices.find(voice => !this.isMaleVoice(voice)) || voices[0];
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
