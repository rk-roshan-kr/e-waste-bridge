/**
 * TurnMemory.js - Cross-Turn Reference Ring Buffer
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * PURPOSE: Pronoun and deictic reference resolution across turns.
 * ("that one", "doosra", "nahi woh nahi" needs to know what was last said)
 *
 * SCOPE: Current voice session only. Destroyed on SESSION_END.
 * NOT for: domain state, user preferences, business data.
 */

const MAX_TURNS = 10;

export class TurnMemory {
  constructor() {
    this._turns = [];
  }

  /**
   * Record a committed turn.
   * @param {{ turnId: string, text: string, intent: string, entities: object, timestamp: number }} turn
   */
  push(turn) {
    this._turns.push({
      turnId:    turn.turnId    || `turn_${Date.now()}`,
      text:      turn.text      || '',
      intent:    turn.intent    || 'UNKNOWN',
      entities:  turn.entities  || {},
      timestamp: turn.timestamp || Date.now(),
    });
    if (this._turns.length > MAX_TURNS) {
      this._turns.shift();
    }
  }

  /** Most recent turn, or null. */
  get last() {
    return this._turns.length > 0 ? this._turns[this._turns.length - 1] : null;
  }

  /** Last N turns (most recent last). */
  lastN(n) {
    return this._turns.slice(-Math.min(n, MAX_TURNS));
  }

  /** Turn at offset from end: 0 = last, 1 = second-to-last */
  at(offsetFromEnd = 0) {
    const idx = this._turns.length - 1 - offsetFromEnd;
    return idx >= 0 ? this._turns[idx] : null;
  }

  /** Was the last intent one of the given types? */
  lastIntentWas(...intents) {
    return this.last ? intents.includes(this.last.intent) : false;
  }

  /** All stored turns (read-only copy). */
  get all() {
    return [...this._turns];
  }

  /** Number of stored turns. */
  get size() {
    return this._turns.length;
  }

  /** Destroy all turns (call on SESSION_END). */
  clear() {
    this._turns = [];
  }
}

export const turnMemory = new TurnMemory();
