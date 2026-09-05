/**
 * ContextEngine.js - Pure Functional Screen Context Projector
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { referenceResolver } from './ReferenceResolver.js';

export class ContextEngine {
  static buildContext(appState = {}) {
    const currentScreen = appState.currentScreen || 'HOME';
    const activeLotDraft = appState.activeLotDraft || null;
    const visibleOffers = Array.isArray(appState.visibleOffers) ? appState.visibleOffers : [];
    const selectedOfferIndex = appState.selectedOfferIndex ?? null;

    return {
      screen: currentScreen,
      selectedLot: appState.selectedLot || null,
      currentDraft: activeLotDraft ? {
        materialId: activeLotDraft.materialId,
        materialName: activeLotDraft.materialName || 'E-Waste Scrap',
        weightKg: activeLotDraft.weightKg || 5,
        unitsCount: activeLotDraft.unitsCount || 1,
        grade: activeLotDraft.grade || 'B'
      } : null,
      visibleOffers: visibleOffers.map((offer, idx) => ({
        index: idx,
        id: offer.id,
        buyerId: offer.buyerId,
        buyerName: offer.buyerName,
        ratePerKg: offer.ratePerKg,
        totalPayout: offer.totalPayout,
        logisticsCost: offer.logisticsCost,
        netPayout: offer.netPayout,
        distanceKm: offer.distanceKm,
        verified: Boolean(offer.verified),
        cpcbRegNo: offer.cpcbRegNo || ''
      })),
      selectedOfferIndex,
      availableActions: this.deriveAvailableActions(currentScreen, activeLotDraft, visibleOffers),
      language: appState.language || 'hi',
      timestamp: Date.now()
    };
  }

  static deriveAvailableActions(screen, draft, offers) {
    switch (screen) {
      case 'SCANNER':
        return ['UPDATE_WEIGHT', 'UPDATE_MATERIAL', 'FIND_BUYERS', 'NAVIGATE_BACK'];
      case 'MARKETPLACE':
        return ['SELECT_OFFER', 'REQUEST_ACCEPT_OFFER', 'FILTER_OFFERS', 'EXPLAIN_OFFER', 'NAVIGATE_BACK'];
      case 'RECEIPT':
        return ['NAVIGATE_TO_HOME', 'VIEW_LOTS'];
      case 'HOME':
      default:
        return ['CREATE_LOT_DRAFT', 'QUERY_MARKET_RATES', 'VIEW_LOTS'];
    }
  }

  static resolveReference(text, context) {
    return referenceResolver.resolveOfferReference(text, context.visibleOffers || []);
  }
}
