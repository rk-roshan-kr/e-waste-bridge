/**
 * AppState.js - Single Source of Truth: Application State Shape
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * OWNERSHIP CONTRACT:
 *   Voice Runtime    → reads AppState via selectors.   Never writes directly.
 *   Domain Services  → writes AppState via reducer actions only.
 *   React Components → reads AppState via useAppState(). Never writes domain state.
 *   Commands         → the ONLY write path into domain state.
 */

import { INITIAL_LOTS } from '../data/initialLots.js';
import { INITIAL_BUY_REQUESTS } from '../data/buyerDemand.js';
import { DEFAULT_COLLECTOR } from '../data/collectors.js';

/** Safe helper to synchronously load from localStorage with fallback */
export function loadStorage(key, fallback) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`[AppState] Failed to parse localStorage for key "${key}":`, err);
    return fallback;
  }
}

export const INITIAL_APP_STATE = {
  // ── Navigation ──────────────────────────────────────────────────────────
  currentScreen: 'HOME',      // 'HOME'|'SCANNER'|'MARKETPLACE'|'LOTS_LIST'|'RECEIPT'
  activePersona: loadStorage('ewb_activePersona', 'collector'), // 'collector'|'recycler'|'admin'

  // ── Collector identity ───────────────────────────────────────────────────
  collector: loadStorage('ewb_collector', DEFAULT_COLLECTOR),

  // ── Language ─────────────────────────────────────────────────────────────
  language: loadStorage('ewb_language', 'mr'),             // 'mr'|'hi'|'en'

  // ── Network / sync ───────────────────────────────────────────────────────
  onlineStatus: 'ONLINE',     // 'ONLINE'|'OFFLINE'|'SYNCING'|'DEGRADED'
  syncQueue: [],              // Command[] pending sync

  // ── Lot domain ───────────────────────────────────────────────────────────
  lots: loadStorage('ewb_lots', INITIAL_LOTS),
  activeLotDraft: null,       // Lot | null

  // ── Marketplace domain ───────────────────────────────────────────────────
  visibleOffers: [],
  selectedOfferIndex: null,
  buyRequests: loadStorage('ewb_buyRequests', INITIAL_BUY_REQUESTS),

  // ── Transaction gate ─────────────────────────────────────────────────────
  pendingTransactionIntent: null,  // TransactionIntent | null

  // ── Voice state (ephemeral — never persisted) ─────────────────────────────
  voicePhase: 'IDLE',
  voiceTranscript: '',
  voiceDetectedLanguage: null,
  voiceSpokenResponse: null,
  voiceActivityTrace: [],
  voicePreparedCard: null,
  voiceClarification: null,
  voiceConfirmationLevel: 'TAP_TO_CONFIRM',
  voiceDurationMs: 0,

  // ── Feedback ─────────────────────────────────────────────────────────────
  undoStack: [],
  syncToast: null,            // { title, message } | null
};
