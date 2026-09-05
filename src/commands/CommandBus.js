/**
 * CommandBus.js - Synchronous Command Dispatcher with Idempotency
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * ROLE: Receives typed Commands from VoiceAdapter, touch handlers, or camera.
 * Validates idempotency. Calls PolicyEngine. Dispatches AppAction via reducer.
 *
 * RULE: CommandBus is the ONLY caller of appDispatch for domain mutations.
 * React components call appDispatch ONLY for UI/navigation AppActions
 * (SET_VOICE_PHASE, NAVIGATE_TO, SET_LANGUAGE) — never for domain state.
 *
 * RULE: Commands cause state changes. Events announce them. Never both.
 */

import { AppActions } from '../state/AppActions.js';
import { generateMarketplaceOffers } from '../data/logisticsEngine.js';
import { PolicyEngine } from '../policy/PolicyEngine.js';
import { interactionBus, VoiceEvents } from '../interaction/InteractionBus.js';
import { CommandTypes } from './commandTypes.js';

// Idempotency store — processed commandIds in this session
const _processedIds = new Set();

// Maximum intent TTL (5 minutes)
const INTENT_TTL_MS = 5 * 60 * 1000;

let _dispatch = null;   // set by AppStateContext on mount
let _getState = null;   // set by AppStateContext on mount

/**
 * Wire CommandBus to the AppState reducer.
 * Called once by AppStateContext on mount.
 *
 * @param {Function} dispatch - appDispatch from useReducer
 * @param {Function} getState - returns current AppState snapshot
 */
export function initCommandBus(dispatch, getState) {
  _dispatch = dispatch;
  _getState = getState;
}

export function resetCommandBusSession() {
  _processedIds.clear();
}

/**
 * Execute a typed command through the CommandBus.
 *
 * @param {{ type: string, payload: object, commandId: string, source: string, timestamp: number }} command
 * @returns {{ success: boolean, action?: object, policyDecision?: object, error?: string }}
 */
export function executeCommand(command) {
  if (!_dispatch || !_getState) {
    console.error('[CommandBus] Not initialized. Call initCommandBus() first.');
    return { success: false, error: 'CommandBus not initialized' };
  }

  const { type, payload = {}, commandId, source } = command;

  // ── Idempotency guard ───────────────────────────────────────────────────
  if (commandId && _processedIds.has(commandId)) {
    console.log('[CommandBus] Duplicate commandId suppressed:', commandId);
    return { success: true, idempotent: true };
  }

  const state = _getState();

  // ── Offline guard for financial actions ─────────────────────────────────
  const FINANCIAL_COMMANDS = new Set([
    'REQUEST_ACCEPT_OFFER', 'COMMIT_TRANSACTION', 'ACCEPT_OFFER'
  ]);
  if (FINANCIAL_COMMANDS.has(type) && state.onlineStatus === 'OFFLINE') {
    return {
      success: false,
      error: 'OFFLINE_BLOCKED',
      message: 'Financial actions require network connectivity.',
    };
  }

  // ── Policy evaluation ───────────────────────────────────────────────────
  const policyDecision = PolicyEngine.evaluate(command, state);
  interactionBus.emit(VoiceEvents.POLICY_GATE, { command, policyDecision });

  if (!policyDecision.allowed) {
    return { success: false, policyDecision, error: policyDecision.reason };
  }

  // ── Route to reducer action ─────────────────────────────────────────────
  const action = _routeToAction(type, payload, state, policyDecision);
  if (!action) {
    return { success: false, error: `Unknown command type: ${type}` };
  }

  _dispatch(action);

  if (commandId) _processedIds.add(commandId);

  interactionBus.emit(VoiceEvents.COMMAND_DISPATCHED, { command, action });

  return { success: true, action, policyDecision };
}

function _routeToAction(type, payload, state, policyDecision) {

  switch (type) {
    // ── Lot drafting ──────────────────────────────────────────────────────
    case 'CREATE_LOT_DRAFT':
      return { type: AppActions.CREATE_LOT_DRAFT, payload: { ...payload, networkState: state.onlineStatus } };

    case 'UPDATE_WEIGHT':
      return { type: AppActions.UPDATE_LOT_DRAFT, payload: { reportedWeightKg: parseFloat(payload.weightKg) } };

    case 'UPDATE_MATERIAL':
      return { type: AppActions.UPDATE_LOT_DRAFT, payload: { materialId: payload.materialId, materialName: payload.materialName } };

    case 'UPDATE_UNITS':
      return { type: AppActions.UPDATE_LOT_DRAFT, payload: { unitsCount: parseInt(payload.unitsCount, 10) } };

    case 'RESET_DRAFT':
      return { type: AppActions.CANCEL_DRAFT, payload: {} };

    // ── Marketplace ───────────────────────────────────────────────────────
    case 'FIND_BUYERS': {
      const draft = state.activeLotDraft;
      const materialId = payload.materialId || draft?.materialId || 'laptops';
      const weightKg = payload.weightKg || draft?.reportedWeightKg || 5;
      const offers = generateMarketplaceOffers({ materialId, weightKg, hazardLevel: payload.hazardLevel || 'LOW' });
      return { type: AppActions.QUOTE_LOT, payload: { offers } };
    }

    case 'SELECT_OFFER':
      return { type: AppActions.SELECT_OFFER_INDEX, payload: { index: payload.offerIndex ?? 0 } };

    // ── Acceptance gate ───────────────────────────────────────────────────
    case 'REQUEST_ACCEPT_OFFER': {
      const { offerId, offerIndex, netPayout, quotedAmount } = payload;
      const draft = state.activeLotDraft;
      const offer = state.visibleOffers[offerIndex ?? state.selectedOfferIndex ?? 0];
      const intent = {
        intentId:         `ti_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        offerId:          offerId || offer?.offerId || offer?.id || 'OFFER_0',
        quotedAmount:     netPayout || quotedAmount || offer?.netPayout || 0,
        currency:         'INR',
        lotId:            draft?.lotId || null,
        weightKg:         draft?.reportedWeightKg || null,
        materialId:       draft?.materialId || null,
        policyVersion:    'v1.2',
        requiresHold:     policyDecision.requiresHold ?? false,
        createdAt:        Date.now(),
        expiresAt:        Date.now() + INTENT_TTL_MS,
      };
      return { type: AppActions.ARM_TRANSACTION_INTENT, payload: { intent } };
    }

    case 'COMMIT_TRANSACTION': {
      const { intentId, nonce, offerId } = payload;
      return { type: AppActions.COMMIT_LOT, payload: { intentId, nonce, offerId } };
    }

    case 'CANCEL_CURRENT_OPERATION':
      return { type: AppActions.CANCEL_DRAFT, payload: {} };

    // ── Navigation ────────────────────────────────────────────────────────
    case 'NAVIGATE_TO':
      return { type: AppActions.NAVIGATE_TO, payload: { screen: payload.screen } };

    case 'NAVIGATE_BACK': {
      const backMap = { SCANNER: 'HOME', MARKETPLACE: 'SCANNER', LOTS_LIST: 'HOME', RECEIPT: 'LOTS_LIST' };
      return { type: AppActions.NAVIGATE_TO, payload: { screen: backMap[state.currentScreen] || 'HOME' } };
    }

    default:
      return null;
  }
}
