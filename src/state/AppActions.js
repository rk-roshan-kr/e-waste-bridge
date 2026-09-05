/**
 * AppActions.js - Typed Action Token Registry
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * RULE: Actions mutate state. Events announce state changes.
 * AppActions are the ONLY way the reducer changes AppState.
 *
 * Grouped by domain. All are handled in appReducer.js.
 */

export const AppActions = Object.freeze({
  // ── Navigation ──────────────────────────────────────────────────────────
  NAVIGATE_TO:                'NAVIGATE_TO',
  SET_PERSONA:                'SET_PERSONA',

  // ── Language ─────────────────────────────────────────────────────────────
  SET_LANGUAGE:               'SET_LANGUAGE',

  // ── Network ──────────────────────────────────────────────────────────────
  SET_ONLINE_STATUS:          'SET_ONLINE_STATUS',
  SET_SYNC_TOAST:             'SET_SYNC_TOAST',
  CLEAR_SYNC_TOAST:           'CLEAR_SYNC_TOAST',
  FLUSH_SYNC_QUEUE:           'FLUSH_SYNC_QUEUE',   // after successful sync
  ENQUEUE_OFFLINE_COMMAND:    'ENQUEUE_OFFLINE_COMMAND',

  // ── Lot domain ───────────────────────────────────────────────────────────
  CREATE_LOT_DRAFT:           'CREATE_LOT_DRAFT',
  UPDATE_LOT_DRAFT:           'UPDATE_LOT_DRAFT',   // patch fields on activeLotDraft
  QUOTE_LOT:                  'QUOTE_LOT',           // DRAFT → QUOTED, sets visibleOffers
  ACCEPT_OFFER:               'ACCEPT_OFFER',        // arms pendingTransactionIntent
  COMMIT_LOT:                 'COMMIT_LOT',          // finalizes lot, moves to lots[]
  CANCEL_DRAFT:               'CANCEL_DRAFT',
  CONFIRM_INTAKE:             'CONFIRM_INTAKE',      // recycler confirms → INTAKE_CONFIRMED
  ADD_LOT:                    'ADD_LOT',             // direct add (offline sync flush)

  // ── Marketplace ──────────────────────────────────────────────────────────
  SET_VISIBLE_OFFERS:         'SET_VISIBLE_OFFERS',
  SELECT_OFFER_INDEX:         'SELECT_OFFER_INDEX',
  ADD_BUY_REQUEST:            'ADD_BUY_REQUEST',

  // ── Transaction intent gate ───────────────────────────────────────────────
  ARM_TRANSACTION_INTENT:     'ARM_TRANSACTION_INTENT',
  DISARM_TRANSACTION_INTENT:  'DISARM_TRANSACTION_INTENT',

  // ── Voice state (ephemeral) ───────────────────────────────────────────────
  SET_VOICE_PHASE:            'SET_VOICE_PHASE',
  SET_VOICE_UI:               'SET_VOICE_UI',        // batch update all voice UI fields
  CLEAR_VOICE_STATE:          'CLEAR_VOICE_STATE',

  // ── Collector profile ─────────────────────────────────────────────────────
  UPDATE_COLLECTOR:           'UPDATE_COLLECTOR',

  // ── Storage & Demo Data Reset ─────────────────────────────────────────────
  RESET_DEMO_DATA:            'RESET_DEMO_DATA',
  RESET_TO_EMPTY:             'RESET_TO_EMPTY',
  LOAD_SEED_DATA:             'LOAD_SEED_DATA',
  SYNC_FROM_STORAGE:          'SYNC_FROM_STORAGE',

  // ── Undo ──────────────────────────────────────────────────────────────────
  PUSH_UNDO:                  'PUSH_UNDO',
  POP_UNDO:                   'POP_UNDO',
  CLEAR_UNDO_STACK:           'CLEAR_UNDO_STACK',
});
