/**
 * LotStore.js - Deterministic Lot State Machine
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * State transitions:
 *   DRAFT -> QUOTED -> ACCEPTED -> SETTLED
 *              \-> CANCELLED
 *
 * IMPORTANT: This is the single owner of lot business state.
 * VoiceRuntime produces Commands. LotStore executes them and updates state.
 * React/UI reads from LotStore via AppState selectors — never writes directly.
 */

import { generateMarketplaceOffers } from '../../data/logisticsEngine.js';

let _lotIdCounter = 1;

export const LotStatus = Object.freeze({
  DRAFT:     'DRAFT',
  QUOTED:    'QUOTED',
  ACCEPTED:  'ACCEPTED',
  SETTLED:   'SETTLED',
  CANCELLED: 'CANCELLED',
});

function newLotId() {
  return `LOT-${Date.now()}-${String(_lotIdCounter++).padStart(3, '0')}`;
}

function newDomainToolResult(toolName, commandId, status, data, stateUpdate = {}, error = null) {
  return { toolName, commandId, status, data, stateUpdate, error };
}

export class LotStore {
  constructor() {
    /** @type {Map<string, object>} lotId → lot object */
    this._lots = new Map();
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  getLot(lotId) {
    return this._lots.get(lotId) || null;
  }

  getAllLots() {
    return [...this._lots.values()];
  }

  getActiveDraft() {
    for (const lot of this._lots.values()) {
      if (lot.status === LotStatus.DRAFT) return lot;
    }
    return null;
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  /**
   * CREATE a new draft lot.
   */
  createLot(commandId, { materialId, materialName, weightKg, unitsCount = 1, grade = 'B' }) {
    const lotId = newLotId();
    const lot = {
      lotId,
      materialId:   materialId   || 'laptops',
      materialName: materialName || 'E-Waste Scrap',
      weightKg:     Number(weightKg) || 5,
      unitsCount:   Number(unitsCount) || 1,
      grade:        grade || 'B',
      status:       LotStatus.DRAFT,
      offers:       [],
      selectedOfferId: null,
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };
    this._lots.set(lotId, lot);
    return newDomainToolResult('createLot', commandId, 'SUCCESS', { lot }, { activeLotDraft: lot });
  }

  /**
   * UPDATE fields on an existing draft lot.
   */
  updateLot(commandId, lotId, patch = {}) {
    const lot = this._lots.get(lotId);
    if (!lot) {
      return newDomainToolResult('updateLot', commandId, 'ERROR', null, {}, `Lot ${lotId} not found`);
    }
    if (lot.status !== LotStatus.DRAFT) {
      return newDomainToolResult('updateLot', commandId, 'ERROR', null, {}, `Cannot update lot in status ${lot.status}`);
    }

    const updated = { ...lot, ...patch, updatedAt: new Date().toISOString() };
    this._lots.set(lotId, updated);
    return newDomainToolResult('updateLot', commandId, 'SUCCESS', { lot: updated }, { activeLotDraft: updated });
  }

  /**
   * QUOTE a lot: generate marketplace offers.
   */
  quoteLot(commandId, lotId, { hazardLevel = 'LOW' } = {}) {
    const lot = this._lots.get(lotId);
    if (!lot) {
      return newDomainToolResult('quoteLot', commandId, 'ERROR', null, {}, `Lot ${lotId} not found`);
    }

    const offers = generateMarketplaceOffers({
      materialId:  lot.materialId,
      weightKg:    lot.weightKg,
      hazardLevel: hazardLevel,
    });

    const updated = {
      ...lot,
      status:    LotStatus.QUOTED,
      offers,
      quotedAt:  new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._lots.set(lotId, updated);

    return newDomainToolResult('quoteLot', commandId, 'SUCCESS',
      { lot: updated, offers, buyersCount: offers.length, bestNetPayout: offers[0]?.netPayout || 0 },
      { activeLotDraft: updated, visibleOffers: offers }
    );
  }

  /**
   * ACCEPT an offer on a quoted lot.
   * This ARMS the confirmation gate — it does not commit.
   */
  acceptOffer(commandId, lotId, offerId) {
    const lot = this._lots.get(lotId);
    if (!lot) {
      return newDomainToolResult('acceptOffer', commandId, 'ERROR', null, {}, `Lot ${lotId} not found`);
    }
    if (lot.status !== LotStatus.QUOTED) {
      return newDomainToolResult('acceptOffer', commandId, 'ERROR', null, {}, `Lot must be QUOTED to accept offer`);
    }

    const offer = lot.offers.find((o) => o.offerId === offerId) || lot.offers[0];
    const updated = {
      ...lot,
      status:          LotStatus.ACCEPTED,
      selectedOfferId: offer?.offerId || offerId,
      updatedAt:       new Date().toISOString(),
    };
    this._lots.set(lotId, updated);

    return newDomainToolResult('acceptOffer', commandId, 'SUCCESS',
      { lot: updated, offer, requiresPhysicalConfirm: true },
      { activeLotDraft: updated }
    );
  }

  /**
   * SETTLE a lot: final commitment after physical confirmation gate passed.
   * @param {string} nonce - Authorization nonce from PolicyEngine.authorizeCommit()
   */
  settleLot(commandId, lotId, nonce) {
    if (!nonce || !nonce.startsWith('tx_')) {
      return newDomainToolResult('settleLot', commandId, 'ERROR', null, {}, 'Invalid transaction nonce');
    }

    const lot = this._lots.get(lotId);
    if (!lot) {
      return newDomainToolResult('settleLot', commandId, 'ERROR', null, {}, `Lot ${lotId} not found`);
    }
    if (lot.status !== LotStatus.ACCEPTED) {
      return newDomainToolResult('settleLot', commandId, 'ERROR', null, {}, `Lot must be ACCEPTED to settle`);
    }

    const offer = lot.offers.find((o) => o.offerId === lot.selectedOfferId);
    const settled = {
      ...lot,
      status:     LotStatus.SETTLED,
      nonce,
      netPayout:  offer?.netPayout || 0,
      settledAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };
    this._lots.set(lotId, settled);

    return newDomainToolResult('settleLot', commandId, 'SUCCESS',
      { lot: settled, netPayout: settled.netPayout, receiptReady: true },
      { activeLotDraft: null, selectedLot: settled }
    );
  }

  /**
   * CANCEL a lot (any non-settled status).
   */
  cancelLot(commandId, lotId) {
    const lot = this._lots.get(lotId);
    if (!lot) {
      return newDomainToolResult('cancelLot', commandId, 'ERROR', null, {}, `Lot ${lotId} not found`);
    }
    if (lot.status === LotStatus.SETTLED) {
      return newDomainToolResult('cancelLot', commandId, 'ERROR', null, {}, 'Cannot cancel a settled lot');
    }

    const cancelled = { ...lot, status: LotStatus.CANCELLED, updatedAt: new Date().toISOString() };
    this._lots.set(lotId, cancelled);
    return newDomainToolResult('cancelLot', commandId, 'SUCCESS', { lot: cancelled }, { activeLotDraft: null });
  }
}

export const lotStore = new LotStore();
