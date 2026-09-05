/**
 * selectors.js - Memoized Read-Only Views of AppState
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * Selectors are the ONLY way non-reducer code reads derived state.
 * They prevent scattered state logic across components.
 *
 * Components read state via selectors. They never access AppState fields directly
 * when a selector can derive the right shape.
 */

// ── Navigation ────────────────────────────────────────────────────────────────
export const selectCurrentScreen   = (s) => s.currentScreen;
export const selectActivePersona   = (s) => s.activePersona;
export const selectLanguage        = (s) => s.language;

// ── Network ───────────────────────────────────────────────────────────────────
export const selectIsOnline        = (s) => s.onlineStatus === 'ONLINE';
export const selectIsOffline       = (s) => s.onlineStatus === 'OFFLINE';
export const selectOnlineStatus    = (s) => s.onlineStatus;
export const selectSyncQueueLength = (s) => s.syncQueue.length;
export const selectSyncToast       = (s) => s.syncToast;

// ── Collector ─────────────────────────────────────────────────────────────────
export const selectCollector       = (s) => s.collector;
export const selectCollectorName   = (s) => s.collector?.name;

// ── Lots ──────────────────────────────────────────────────────────────────────
export const selectLots            = (s) => s.lots;
export const selectActiveLotDraft  = (s) => s.activeLotDraft;
export const selectHasDraft        = (s) => s.activeLotDraft !== null;
export const selectDraftWeight     = (s) => s.activeLotDraft?.reportedWeightKg ?? null;
export const selectDraftMaterial   = (s) => s.activeLotDraft?.materialId ?? null;

/** All settled / non-draft lots sorted newest first */
export const selectLotsHistory     = (s) =>
  s.lots.filter((l) => l.status !== 'DRAFT').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

// ── Marketplace ───────────────────────────────────────────────────────────────
export const selectVisibleOffers   = (s) => s.visibleOffers;
export const selectSelectedOffer   = (s) =>
  s.selectedOfferIndex != null ? s.visibleOffers[s.selectedOfferIndex] ?? null : null;
export const selectBuyRequests     = (s) => s.buyRequests;

/** Best offer by net payout (Stage 1 of 3-stage ranking) */
export const selectBestOffer       = (s) =>
  s.visibleOffers.length > 0
    ? [...s.visibleOffers].sort((a, b) => (b.netPayout ?? 0) - (a.netPayout ?? 0))[0]
    : null;

// ── Transaction gate ──────────────────────────────────────────────────────────
export const selectPendingIntent   = (s) => s.pendingTransactionIntent;
export const selectIsIntentArmed   = (s) => s.pendingTransactionIntent !== null;
export const selectIntentExpired   = (s) =>
  s.pendingTransactionIntent ? s.pendingTransactionIntent.expiresAt < Date.now() : false;

// ── Voice state ───────────────────────────────────────────────────────────────
export const selectVoicePhase         = (s) => s.voicePhase;
export const selectVoiceTranscript    = (s) => s.voiceTranscript;
export const selectVoiceSpokenResp    = (s) => s.voiceSpokenResponse;
export const selectVoiceActivityTrace = (s) => s.voiceActivityTrace;
export const selectVoicePreparedCard  = (s) => s.voicePreparedCard;
export const selectVoiceClarification = (s) => s.voiceClarification;
export const selectVoiceConfirmLevel  = (s) => s.voiceConfirmationLevel;
export const selectVoiceUI            = (s) => ({
  phase:             s.voicePhase,
  transcript:        s.voiceTranscript,
  detectedLanguage:  s.voiceDetectedLanguage,
  spokenResponse:    s.voiceSpokenResponse,
  activityTrace:     s.voiceActivityTrace,
  preparedCard:      s.voicePreparedCard,
  clarification:     s.voiceClarification,
  confirmationLevel: s.voiceConfirmationLevel,
  durationMs:        s.voiceDurationMs,
});

// ── Offline guard (use this in UI to block financial actions) ─────────────────
/**
 * Returns true if a given action category is HARD BLOCKED offline.
 * UI components use this to disable buttons when offline.
 *
 * Per V4 spec P0-6:
 *   Financial actions (accept offer, commit transaction) = HARD BLOCKED offline.
 *   Draft creation = ALLOWED offline (queued).
 */
export const selectIsFinancialActionBlocked = (s) =>
  s.onlineStatus === 'OFFLINE' || s.onlineStatus === 'DEGRADED';
