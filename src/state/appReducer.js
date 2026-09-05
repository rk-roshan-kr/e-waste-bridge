/**
 * appReducer.js - Pure Domain State Reducer
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * RULE: This function must be pure — no side effects, no async, no imports of
 * services or APIs. Given the same state + action, always returns the same result.
 *
 * RULE: Domain state mutations happen ONLY here.
 * No component, context, or voice runtime may mutate AppState except by
 * dispatching an AppAction through this reducer.
 */

import { AppActions } from './AppActions.js';
import { MATERIAL_TAXONOMY } from '../data/materialTaxonomy.js';
import { INITIAL_LOTS } from '../data/initialLots.js';
import { INITIAL_BUY_REQUESTS } from '../data/buyerDemand.js';
import { DEFAULT_COLLECTOR } from '../data/collectors.js';
import { INITIAL_LOTS_SEED, BUYER_DEMANDS_SEED, COLLECTOR_SEED } from '../database/seedData.js';

const MAX_UNDO_STACK = 5;

export function appReducer(state, action) {
  switch (action.type) {

    // ── Navigation ────────────────────────────────────────────────────────
    case AppActions.NAVIGATE_TO:
      return { ...state, currentScreen: action.payload.screen };

    case AppActions.SET_PERSONA:
      return { ...state, activePersona: action.payload.persona };

    // ── Language ──────────────────────────────────────────────────────────
    case AppActions.SET_LANGUAGE:
      return { ...state, language: action.payload.language };

    // ── Network ───────────────────────────────────────────────────────────
    case AppActions.SET_ONLINE_STATUS:
      return { ...state, onlineStatus: action.payload.status };

    case AppActions.SET_SYNC_TOAST:
      return { ...state, syncToast: action.payload };

    case AppActions.CLEAR_SYNC_TOAST:
      return { ...state, syncToast: null };

    case AppActions.ENQUEUE_OFFLINE_COMMAND:
      return { ...state, syncQueue: [...state.syncQueue, action.payload.command] };

    case AppActions.FLUSH_SYNC_QUEUE: {
      // Move queued offline lots into the main lots array
      const newLots = action.payload.lots || [];
      return {
        ...state,
        lots: [...newLots, ...state.lots],
        syncQueue: [],
        onlineStatus: 'ONLINE',
      };
    }

    // ── Lot domain ────────────────────────────────────────────────────────
    case AppActions.CREATE_LOT_DRAFT: {
      const { materialId, weightKg, unitsCount = 1, conditionGrade = 'SCRAP', photoUrl = null, networkState } = action.payload;
      const mat = MATERIAL_TAXONOMY.find((m) => m.id === materialId) || MATERIAL_TAXONOMY[0];
      const lotId = `EW-${Math.floor(2050 + Math.random() * 900)}`;
      const now = new Date().toISOString();

      const draft = {
        lotId,
        materialId: materialId || 'laptops',
        materialName: mat.name,
        reportedWeightKg: parseFloat(weightKg) || 0,
        actualIntakeWeightKg: null,
        unitsCount: parseInt(unitsCount, 10) || 1,
        conditionGrade,
        photoUrl: photoUrl || mat.sampleImages?.[0]?.url || null,
        collectorId: state.collector.id,
        collectorName: state.collector.name,
        collectorLocation: state.collector.serviceArea || '',
        selectedBuyerId: null,
        selectedBuyerName: null,
        status: 'DRAFT',
        lifecycleStage: 'COLLECTED',
        settlementMode: 'CASH',
        grossBid: null,
        logisticsCost: null,
        netPayout: null,
        isOfflineQueued: networkState === 'OFFLINE',
        createdAt: now,
        qrCode: `EWB-QR-${lotId}-${Math.floor(10000 + Math.random() * 90000)}`,
        events: [
          {
            step: 'COLLECTED',
            timestamp: now,
            agent: state.collector.name,
            note: networkState === 'OFFLINE' ? 'Created offline on field device' : 'Created via voice/scan',
          },
        ],
      };

      return {
        ...state,
        activeLotDraft: draft,
        visibleOffers: [],
        selectedOfferIndex: null,
        pendingTransactionIntent: null,
      };
    }

    case AppActions.UPDATE_LOT_DRAFT: {
      if (!state.activeLotDraft) return state;
      const patch = action.payload;
      // Re-derive materialName if materialId is patched
      let materialName = state.activeLotDraft.materialName;
      if (patch.materialId && patch.materialId !== state.activeLotDraft.materialId) {
        const mat = MATERIAL_TAXONOMY.find((m) => m.id === patch.materialId);
        if (mat) materialName = mat.name;
      }
      return {
        ...state,
        activeLotDraft: {
          ...state.activeLotDraft,
          ...patch,
          materialName: patch.materialName || materialName,
        },
      };
    }

    case AppActions.QUOTE_LOT: {
      // Called after offers are fetched. Sets visibleOffers and updates draft status.
      if (!state.activeLotDraft) return state;
      const { offers } = action.payload;
      const now = new Date().toISOString();
      return {
        ...state,
        visibleOffers: offers,
        selectedOfferIndex: null,
        activeLotDraft: {
          ...state.activeLotDraft,
          status: 'QUOTED',
          lifecycleStage: 'BIDDED',
          grossBid: offers[0]?.grossBid || null,
          logisticsCost: offers[0]?.logisticsCost || null,
          netPayout: offers[0]?.netPayout || null,
          events: [
            ...state.activeLotDraft.events,
            {
              step: 'BIDDED',
              timestamp: now,
              agent: 'Reverse Marketplace',
              note: `${offers.length} eligible recyclers matched`,
            },
          ],
        },
      };
    }

    case AppActions.SELECT_OFFER_INDEX:
      return { ...state, selectedOfferIndex: action.payload.index };

    case AppActions.SET_VISIBLE_OFFERS:
      return { ...state, visibleOffers: action.payload.offers };

    case AppActions.ARM_TRANSACTION_INTENT:
      return { ...state, pendingTransactionIntent: action.payload.intent };

    case AppActions.DISARM_TRANSACTION_INTENT:
      return { ...state, pendingTransactionIntent: null };

    case AppActions.COMMIT_LOT: {
      // Physical hold confirmed — finalize the lot and move to lots[]
      const { nonce, offerId } = action.payload;
      if (!state.activeLotDraft || !state.pendingTransactionIntent) return state;

      const intent = state.pendingTransactionIntent;
      // Safety: verify the intentId matches and hasn't expired
      if (intent.intentId !== action.payload.intentId) {
        console.error('[appReducer] COMMIT_LOT: intentId mismatch — rejected');
        return state;
      }
      if (intent.expiresAt < Date.now()) {
        console.error('[appReducer] COMMIT_LOT: TransactionIntent expired — rejected');
        return state;
      }

      const now = new Date().toISOString();
      const offer = state.visibleOffers.find((o) => o.offerId === offerId || o.id === offerId)
        || state.visibleOffers[state.selectedOfferIndex ?? 0];

      const committed = {
        ...state.activeLotDraft,
        status: 'ACCEPTED',
        lifecycleStage: 'MATCHED',
        selectedBuyerId: offer?.recyclerId || offer?.buyerId || null,
        selectedBuyerName: offer?.recyclerName || offer?.buyerName || null,
        grossBid: offer?.grossBid || intent.quotedAmount,
        logisticsCost: offer?.logisticsCost || 0,
        netPayout: offer?.netPayout || intent.quotedAmount,
        settledAt: now,
        transactionNonce: nonce,
        events: [
          ...state.activeLotDraft.events,
          {
            step: 'MATCHED',
            timestamp: now,
            agent: state.collector.name,
            note: `Accepted ${offer?.recyclerName || 'recycler'} (Net ₹${offer?.netPayout || intent.quotedAmount})`,
          },
        ],
      };

      return {
        ...state,
        lots: [committed, ...state.lots],
        activeLotDraft: null,
        visibleOffers: [],
        selectedOfferIndex: null,
        pendingTransactionIntent: null,
      };
    }

    case AppActions.CANCEL_DRAFT:
      return {
        ...state,
        activeLotDraft: null,
        visibleOffers: [],
        selectedOfferIndex: null,
        pendingTransactionIntent: null,
      };

    case AppActions.ADD_LOT:
      return { ...state, lots: [action.payload.lot, ...state.lots] };

    case AppActions.CONFIRM_INTAKE: {
      const { lotId, actualWeightKg, paymentMode = 'CASH', netPayout, qualityGrade, moistureDeductionPct } = action.payload;
      const now = new Date().toISOString();
      let payoutAdded = 0;
      const updated = state.lots.map((lot) => {
        if (lot.lotId !== lotId) return lot;
        const rate = lot.grossBid / (lot.reportedWeightKg || 1);
        const finalNet = netPayout !== undefined ? Number(netPayout) : Math.max(0, Math.round(rate * actualWeightKg - (lot.logisticsCost || 0)));
        payoutAdded = finalNet;
        return {
          ...lot,
          actualIntakeWeightKg: parseFloat(actualWeightKg),
          status: 'SETTLED',
          lifecycleStage: 'INTAKE_CONFIRMED',
          settledAt: now,
          netPayout: finalNet,
          settlementMode: paymentMode,
          qualityGrade: qualityGrade || lot.conditionGrade || 'STANDARD',
          moistureDeductionPct: moistureDeductionPct !== undefined ? moistureDeductionPct : 0,
          events: [
            ...lot.events,
            { step: 'HANDED_OVER', timestamp: now, agent: 'Field Intake Partner',
              note: `Physical handover verified. Scale: ${actualWeightKg} kg.` },
            { step: 'INTAKE_CONFIRMED', timestamp: now, agent: lot.selectedBuyerName || 'Authorized Recycler',
              note: `Barcoded and entered into EPR compliance register. Net settled: ₹${finalNet.toLocaleString('en-IN')}.` },
          ],
        };
      });
      const collectorUpdate = {
        ...state.collector,
        monthlyEarningsInr: (state.collector.monthlyEarningsInr || 0) + (payoutAdded || 0),
        totalLotsCompleted: (state.collector.totalLotsCompleted || 0) + 1,
      };
      return { ...state, lots: updated, collector: collectorUpdate };
    }

    case AppActions.ADD_BUY_REQUEST:
      return { ...state, buyRequests: [action.payload.request, ...state.buyRequests] };

    // ── Voice state (ephemeral) ───────────────────────────────────────────
    case AppActions.SET_VOICE_PHASE:
      return { ...state, voicePhase: action.payload.phase };

    case AppActions.SET_VOICE_UI:
      return {
        ...state,
        voicePhase:             action.payload.phase             ?? state.voicePhase,
        voiceTranscript:        action.payload.transcript        ?? state.voiceTranscript,
        voiceDetectedLanguage:  action.payload.detectedLanguage  ?? state.voiceDetectedLanguage,
        voiceSpokenResponse:    action.payload.spokenResponse    ?? state.voiceSpokenResponse,
        voiceActivityTrace:     action.payload.activityTrace     ?? state.voiceActivityTrace,
        voicePreparedCard:      action.payload.preparedCard      ?? state.voicePreparedCard,
        voiceClarification:     action.payload.clarification     ?? state.voiceClarification,
        voiceConfirmationLevel: action.payload.confirmationLevel ?? state.voiceConfirmationLevel,
        voiceDurationMs:        action.payload.durationMs        ?? state.voiceDurationMs,
      };

    case AppActions.CLEAR_VOICE_STATE:
      return {
        ...state,
        voicePhase: 'IDLE',
        voiceTranscript: '',
        voiceDetectedLanguage: null,
        voiceSpokenResponse: null,
        voiceActivityTrace: [],
        voicePreparedCard: null,
        voiceClarification: null,
        voiceConfirmationLevel: 'TAP_TO_CONFIRM',
        voiceDurationMs: 0,
      };

    // ── Collector ─────────────────────────────────────────────────────────
    case AppActions.UPDATE_COLLECTOR:
      return { ...state, collector: { ...state.collector, ...action.payload } };

    // ── Undo ──────────────────────────────────────────────────────────────
    case AppActions.PUSH_UNDO: {
      const stack = [action.payload, ...state.undoStack].slice(0, MAX_UNDO_STACK);
      return { ...state, undoStack: stack };
    }
    case AppActions.POP_UNDO:
      return { ...state, undoStack: state.undoStack.slice(1) };
    case AppActions.CLEAR_UNDO_STACK:
      return { ...state, undoStack: [] };

    // ── IndexedDB hydration (fired once on mount by AppStateContext) ──────
    case '__HYDRATE_LOTS__':
      return { ...state, lots: action.payload.lots };

    case '__HYDRATE_BUY_REQUESTS__':
      return { ...state, buyRequests: action.payload.buyRequests };

    // ── LocalStorage Reset & Cross-Tab Sync ──────────────────────────────
    case AppActions.RESET_DEMO_DATA:
    case AppActions.LOAD_SEED_DATA: {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('ewb_lots', JSON.stringify(INITIAL_LOTS_SEED));
          window.localStorage.setItem('ewb_buyRequests', JSON.stringify(BUYER_DEMANDS_SEED));
          window.localStorage.setItem('ewb_collector', JSON.stringify(COLLECTOR_SEED));
          window.localStorage.removeItem('ewb_anomalies');
        } catch (e) {
          console.warn('[appReducer] Error writing seed data to localStorage:', e);
        }
      }
      return {
        ...state,
        lots: INITIAL_LOTS_SEED,
        buyRequests: BUYER_DEMANDS_SEED,
        collector: { ...COLLECTOR_SEED },
        activeLotDraft: null,
        visibleOffers: [],
        selectedOfferIndex: null,
        pendingTransactionIntent: null,
        syncQueue: [],
        syncToast: {
          title: 'CANONICAL SEED DATASET LOADED',
          message: 'All 3 CPCB lots, demand orders, and collector wallet populated from raw seed.'
        }
      };
    }

    case AppActions.RESET_TO_EMPTY: {
      const emptyCollector = {
        ...DEFAULT_COLLECTOR,
        totalLotsCompleted: 0,
        monthlyWeightKg: 0,
        monthlyEarningsInr: 0,
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('ewb_lots', JSON.stringify([]));
          window.localStorage.setItem('ewb_buyRequests', JSON.stringify([]));
          window.localStorage.setItem('ewb_collector', JSON.stringify(emptyCollector));
          window.localStorage.removeItem('ewb_anomalies');
        } catch (e) {
          console.warn('[appReducer] Error clearing localStorage:', e);
        }
      }
      return {
        ...state,
        lots: [],
        buyRequests: [],
        collector: emptyCollector,
        activeLotDraft: null,
        visibleOffers: [],
        selectedOfferIndex: null,
        pendingTransactionIntent: null,
        syncQueue: [],
        syncToast: {
          title: 'EMPTY STATE UI ACTIVATED',
          message: 'Database reset: 0 lots, 0 demands. Clean slate UI ready for new collections.'
        }
      };
    }

    case AppActions.SYNC_FROM_STORAGE: {
      const { lots, buyRequests, collector, language, activePersona } = action.payload || {};
      return {
        ...state,
        ...(lots ? { lots } : {}),
        ...(buyRequests ? { buyRequests } : {}),
        ...(collector ? { collector } : {}),
        ...(language ? { language } : {}),
        ...(activePersona ? { activePersona } : {}),
      };
    }

    default:
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[appReducer] Unknown action:', action.type);
      }
      return state;
  }
}
