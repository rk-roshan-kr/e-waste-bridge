/**
 * SpeechNormalizer.js - Master Speech Normalization & Domain Sanitization Engine
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * Responsibilities:
 *   1. Language detection
 *   2. Filler removal (via FillerFilter + TokenRoleClassifier)
 *   3. Domain interpretation memory lookup (via CorrectionMemory)
 *   4. In-utterance backtracking resolution (via BacktrackResolver)
 *   5. Slang → canonical material mapping (via DomainDictionary)
 *   6. Noise artifact / hallucination detection (static: isNoiseArtifact)
 *
 * isNoiseArtifact() is the authoritative hallucination guard.
 * It lives here, NOT in the UI layer or ASR layer.
 * VoiceAdapter calls it as the first gate before any processing.
 */

import { fillerFilter } from './FillerFilter.js';
import { correctionMemory } from './CorrectionMemory.js';
import { backtrackResolver } from './BacktrackResolver.js';
import { DomainDictionary } from '../../data/domainDictionary.js';
import { languageDetector } from '../understanding/LanguageDetector.js';

export class SpeechNormalizer {
  normalize(rawText, fallbackLang = 'hi') {
    if (rawText === null || rawText === undefined) {
      return { cleanText: '', wasCorrected: false, matchedEntity: null, detectedLanguage: fallbackLang };
    }
    const rawString = String(rawText).trim();
    if (!rawString) {
      return { cleanText: '', wasCorrected: false, matchedEntity: null, detectedLanguage: fallbackLang };
    }
    const rawTextToUse = rawString;

    // 0. Auto-detect spoken language (Hindi, Marathi, or English)
    const detectedLanguage = languageDetector.detect(rawTextToUse, fallbackLang);

    // 1. Strip common conversational fillers
    let text = fillerFilter.clean(rawTextToUse);

    // 2. Apply locally learned correction memory
    text = correctionMemory.lookup(text);

    // 3. Resolve in-utterance backtracking (e.g. "10 kilo... actually 11 kilo")
    const backtrackResult = backtrackResolver.resolve(text);
    const wasCorrected = backtrackResult.wasCorrected;
    text = backtrackResult.text;

    // 4. Map e-waste scrap slang to canonical taxonomy
    let matchedEntity = null;
    for (const item of DomainDictionary.slangMappings) {
      for (const pattern of item.patterns) {
        if (pattern.test(text)) {
          matchedEntity = item;
          break;
        }
      }
      if (matchedEntity) break;
    }

    return {
      cleanText: text,
      wasCorrected,
      previousValue: backtrackResult.previousValue,
      correctedValue: backtrackResult.correctedValue,
      matchedEntity,
      detectedLanguage
    };
  }

  // ── Static: Noise Artifact / Hallucination Detection ───────────────────────
  // Detects ASR silence artifacts, repetitive hallucination loops, and YouTube-
  // style stub transcripts that the Whisper model emits for non-speech audio.
  //
  // Call this BEFORE any normalization or intent processing.
  // VoiceAdapter.processTranscript() is the single caller in production.

  static isNoiseArtifact(raw) {
    if (!raw || typeof raw !== 'string') return true;
    const clean = raw.trim();
    if (!clean || clean.length < 2) return true;

    const lower = clean.toLowerCase().replace(/[.,!?;:"'\-]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = lower.split(' ').filter(Boolean);
    if (words.length === 0) return true;

    // Known Whisper silence hallucination exact strings and substrings
    const KNOWN_ARTIFACTS = new Set([
      'thank you', 'thank you very much', 'thank you for watching', 'thanks for watching',
      'thank you so much', 'thanks for watching see you in the next video',
      'bye', 'bye bye', 'goodbye', 'you', 'watching', 'hello',
      'what', 'subtitles by', 'please subscribe', 'subscribe', 'amara org',
      'the end', 'this is the beginning of the day', 'beginning of the day',
    ]);
    if (KNOWN_ARTIFACTS.has(lower)) return true;

    // Substrings that indicate Whisper internet-training hallucinations during silence
    const PHRASE_HALLUCINATIONS = [
      'thank you', 'thanks for', 'thank you for', 'joining us',
      'listening to', 'for watching', 'next video', 'subscribe',
      'subtitles', 'amara org', 'amara.org', 'ordnance', 'bye bye',
      'see you in the next', 'the end', 'check my ordnance', 'please like',
      'share and subscribe', 'welcome back to my channel'
    ];
    for (const phrase of PHRASE_HALLUCINATIONS) {
      if (lower.includes(phrase)) return true;
    }

    // High-frequency noise tokens (should not dominate any real utterance)
    const NOISE_TOKENS = new Set(['thank', 'thanks', 'bye', 'day', 'beginning', 'watching', 'subscribe', 'subtitles', 'video']);
    const counts = {};
    for (const w of words) {
      counts[w] = (counts[w] || 0) + 1;
      if (counts[w] >= 2 && NOISE_TOKENS.has(w)) return true;
    }
    const noiseRatio = words.filter((w) => NOISE_TOKENS.has(w)).length / words.length;
    if (noiseRatio >= 0.35) return true;

    // Low vocabulary diversity → repetition loop
    if (words.length >= 3 && new Set(words).size === 1) return true;
    if (words.length >= 5 && new Set(words).size <= 2) return true;
    if (words.length >= 6 && new Set(words).size / words.length < 0.45) return true;

    // Regex-based repeating phrase detection
    if (/(\b.+?\b)(?:\s+\1){1,}/i.test(lower)) return true;

    return false;
  }

  isNoiseArtifact(raw) {
    return SpeechNormalizer.isNoiseArtifact(raw);
  }
}

export const speechNormalizer = new SpeechNormalizer();
