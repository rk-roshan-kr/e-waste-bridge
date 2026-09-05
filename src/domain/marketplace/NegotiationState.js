/**
 * NegotiationState.js - Offer Negotiation State Machine
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * State transitions:
 *   NONE → SELECTED → ACCEPTANCE_ARMED → COMMITTED | CANCELLED
 *
 * IMPORTANT: This tracks negotiation state, not lot state.
 * LotStore tracks DRAFT/QUOTED/ACCEPTED/SETTLED.
 * NegotiationState tracks the user's selection and confirmation intent.
 */

export const NegotiationStatus = Object.freeze({
  NONE:             'NONE',              // No offer selected
  SELECTED:         'SELECTED',          // User selected an offer (voice/touch)
  ACCEPTANCE_ARMED: 'ACCEPTANCE_ARMED',  // User said "accept" — waiting for physical confirm
  COMMITTED:        'COMMITTED',         // Transaction committed (physical gate passed)
  CANCELLED:        'CANCELLED',         // User cancelled or policy blocked
});

export class NegotiationState {
  constructor() {
    this.reset();
  }

  reset() {
    this.status = NegotiationStatus.NONE;
    this.selectedOfferIndex = null;
    this.selectedOfferId = null;
    this.selectedOffer = null;
    this.lotId = null;
    this.armedAt = null;
    this.committedAt = null;
    this.transactionNonce = null;
    this.cancelReason = null;
  }

  // ── Transitions ──────────────────────────────────────────────────────────

  /**
   * User selected an offer (by voice or touch).
   */
  selectOffer(offerIndex, offer, lotId) {
    this.status = NegotiationStatus.SELECTED;
    this.selectedOfferIndex = offerIndex;
    this.selectedOfferId = offer?.offerId || null;
    this.selectedOffer = offer || null;
    this.lotId = lotId || null;
    this.cancelReason = null;
    return this.snapshot();
  }

  /**
   * User accepted offer verbally — policy gate armed.
   * Physical confirmation is still required.
   */
  armAcceptance() {
    if (this.status !== NegotiationStatus.SELECTED) {
      console.warn('[NegotiationState] armAcceptance called without SELECTED offer');
    }
    this.status = NegotiationStatus.ACCEPTANCE_ARMED;
    this.armedAt = Date.now();
    return this.snapshot();
  }

  /**
   * Physical confirmation gate passed — commit.
   * @param {string} nonce - Authorization nonce from PolicyEngine.authorizeCommit()
   */
  commit(nonce) {
    if (this.status !== NegotiationStatus.ACCEPTANCE_ARMED) {
      return { success: false, reason: 'Must be ACCEPTANCE_ARMED to commit' };
    }
    this.status = NegotiationStatus.COMMITTED;
    this.committedAt = Date.now();
    this.transactionNonce = nonce;
    return { success: true, snapshot: this.snapshot() };
  }

  /**
   * Cancel negotiation (user said cancel, policy blocked, or timeout).
   */
  cancel(reason = 'USER_CANCELLED') {
    this.status = NegotiationStatus.CANCELLED;
    this.cancelReason = reason;
    return this.snapshot();
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  get isArmed() {
    return this.status === NegotiationStatus.ACCEPTANCE_ARMED;
  }

  get isCommitted() {
    return this.status === NegotiationStatus.COMMITTED;
  }

  get hasSelection() {
    return this.selectedOfferId != null;
  }

  snapshot() {
    return {
      status:             this.status,
      selectedOfferIndex: this.selectedOfferIndex,
      selectedOfferId:    this.selectedOfferId,
      selectedOffer:      this.selectedOffer,
      lotId:              this.lotId,
      armedAt:            this.armedAt,
      committedAt:        this.committedAt,
      transactionNonce:   this.transactionNonce,
      cancelReason:       this.cancelReason,
    };
  }
}

export const negotiationState = new NegotiationState();
