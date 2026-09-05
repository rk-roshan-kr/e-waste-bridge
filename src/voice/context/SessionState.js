/**
 * SessionState.js - Per-Session Conversational State Container
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * PURPOSE: Multi-turn conversation tracking within a single app session.
 * Survives across turns; destroyed when the app unmounts or session ends.
 *
 * NOT for: domain business state (use AppState/LotStore)
 * NOT for: user preferences (use PersistentProfile)
 * NOT for: cross-session memory (use PersistentProfile)
 */

export class SessionState {
  constructor() {
    this.reset();
  }

  reset() {
    /**
     * What question the agent asked and is waiting for an answer to.
     * e.g. 'ASK_WEIGHT' | 'ASK_MATERIAL' | 'ASK_CONFIRM' | null
     */
    this.pendingQuestion = null;

    /**
     * Fields needed to complete current action that the user hasn't provided.
     * e.g. ['weightKg'] when user said "sell laptop" but no weight given.
     */
    this.missingFields = [];

    /** Last material mentioned by user (for reference resolution). */
    this.lastMaterialMentioned = null;   // string | null, e.g. 'laptops'

    /** Last weight mentioned by user (kg). */
    this.lastWeightMentioned = null;     // number | null

    /** Which offer has been selected (offerIndex). */
    this.confirmedOfferIndex = null;     // number | null

    /** True when policy gate has been armed: user said "accept" and we're waiting for physical confirm. */
    this.confirmationArmed = false;

    /** The offer being considered for acceptance. */
    this.pendingOfferSnapshot = null;    // Offer | null
  }

  /**
   * Mark that the agent asked a question and is waiting for the user's answer.
   * @param {string} question  e.g. 'ASK_WEIGHT'
   * @param {string[]} missing Missing field names
   */
  awaitAnswer(question, missing = []) {
    this.pendingQuestion = question;
    this.missingFields = missing;
  }

  /** Clear pending question after it's been resolved. */
  clearPendingQuestion() {
    this.pendingQuestion = null;
    this.missingFields = [];
  }

  /** Record last spoken material for reference resolution. */
  setLastMaterial(materialName) {
    this.lastMaterialMentioned = materialName || null;
  }

  /** Record last spoken weight. */
  setLastWeight(kg) {
    this.lastWeightMentioned = typeof kg === 'number' ? kg : null;
  }

  /** Arm the confirmation gate. */
  armConfirmation(offerIndex, offerSnapshot) {
    this.confirmationArmed = true;
    this.confirmedOfferIndex = offerIndex;
    this.pendingOfferSnapshot = offerSnapshot || null;
  }

  /** Disarm confirmation (cancelled or committed). */
  disarmConfirmation() {
    this.confirmationArmed = false;
    this.confirmedOfferIndex = null;
    this.pendingOfferSnapshot = null;
  }

  /** Snapshot of current state (for debugging / telemetry). */
  toJSON() {
    return {
      pendingQuestion:      this.pendingQuestion,
      missingFields:        [...this.missingFields],
      lastMaterialMentioned: this.lastMaterialMentioned,
      lastWeightMentioned:  this.lastWeightMentioned,
      confirmedOfferIndex:  this.confirmedOfferIndex,
      confirmationArmed:    this.confirmationArmed,
    };
  }
}

export const sessionState = new SessionState();
