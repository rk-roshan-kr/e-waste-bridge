/**
 * transcriptTypes.js - Standardized ASR Token & Result Types
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export const AsrProviders = Object.freeze({
  INDIC_CONFORMER: 'INDIC_CONFORMER',
  WEB_SPEECH_FALLBACK: 'WEB_SPEECH_FALLBACK',
  MOCK_STREAMING: 'MOCK_STREAMING'
});

export function createTranscriptResult({
  text,
  isFinal = false,
  confidence = 0.95,
  provider = AsrProviders.WEB_SPEECH_FALLBACK,
  language = 'hi'
}) {
  return {
    text: (text || '').trim(),
    isFinal,
    confidence,
    provider,
    language,
    timestamp: Date.now()
  };
}
