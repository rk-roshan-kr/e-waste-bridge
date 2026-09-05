/**
 * VoiceAdapter.js - Single Execution Path Adapter
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * ╔════════════════════════════════════════════════════════════╗
 * ║  THIS IS THE ONLY FILE THAT MAY CALL A VOICE PROCESSING   ║
 * ║  IMPLEMENTATION. CollectorPhoneWrapper calls this. Period. ║
 * ╚════════════════════════════════════════════════════════════╝
 *
 * USE_RUNTIME = false  →  Old monolith (voiceAgentEngine.js) runs
 * USE_RUNTIME = true   →  New VoiceRuntime runs (flip per phase)
 *
 * Never call both. Never execute in parallel.
 */

import { processAgentUtterance } from '../services/voiceAgentEngine.js';
import { SpeechNormalizer, speechNormalizer } from './normalization/SpeechNormalizer.js';

// ─── Migration Flag ───────────────────────────────────────────────────────────
// Phase 0: false  (monolith runs, contracts are locked)
// Phase 4+: true  (new runtime runs after context+intent verified)
const USE_RUNTIME = false;

// ─── Session idempotency: processed commandIds in this session ────────────────
const _processedCommandIds = new Set();

export function resetAdapterSession() {
  _processedCommandIds.clear();
}

/**
 * processTranscript — The single entry point for all transcript processing.
 *
 * @param {string} rawText   - Transcript text from any ASR source
 * @param {object} ctx       - Context bundle
 * @param {object} ctx.agentCtx   - Legacy agent context (monolith)
 * @param {object} ctx.external   - { lots, buyRequests, currentSettledLot, activeLotDraft }
 * @param {object} ctx.screen     - Screen context { screen, selectedElement, visibleElements }
 * @returns {object} stepResult   - Unified result (compatible with both implementations)
 */
export async function processTranscript(rawText, ctx = {}) {
  console.count('[VoiceAdapter] processTranscript');

  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return null;
  }

  // Hallucination / noise artifact guard (single location — not in UI layer)
  const isNoise = typeof SpeechNormalizer?.isNoiseArtifact === 'function'
    ? SpeechNormalizer.isNoiseArtifact(rawText)
    : typeof speechNormalizer?.isNoiseArtifact === 'function'
    ? speechNormalizer.isNoiseArtifact(rawText)
    : false;

  if (isNoise) {
    console.log('[VoiceAdapter] Noise artifact suppressed:', rawText.substring(0, 50));
    return null;
  }

  if (USE_RUNTIME) {
    // ── New layered VoiceRuntime path (Phase 4+) ──────────────────────────
    // Import lazily to avoid loading the runtime before it is ready
    const { voiceRuntime } = await import('./VoiceRuntime.js');
    return voiceRuntime.processTranscriptForTest(rawText, ctx);
  } else {
    // ── Legacy monolith path (Phase 0–3) ─────────────────────────────────
    const { agentCtx, external = {}, screen = {} } = ctx;
    return processAgentUtterance(rawText, agentCtx, external, screen);
  }
}

/**
 * isRuntimeActive — Allows UI to conditionally show runtime-powered features.
 */
export function isRuntimeActive() {
  return USE_RUNTIME;
}
