/**
 * InteractionBus.js - Centralized Multimodal Event Emitter
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  DISCIPLINE RULES (enforced by architecture, not by code)       ║
 * ║                                                                  ║
 * ║  Events carry NOTIFICATIONS only.                               ║
 * ║  Commands travel via the Command API (VoiceAdapter → Runtime).  ║
 * ║  Subscribers MUST NOT perform domain mutations on receipt.      ║
 * ║  A subscriber that causes a payment, navigation, or lot update  ║
 * ║  directly from a bus event is a BUG.                            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { VoiceEvents, createVoiceEvent } from './VoiceEventTypes.js';

export { VoiceEvents, createVoiceEvent };

class InteractionBusEmitter {
  constructor() {
    /** @type {Set<Function>} Normal priority subscribers */
    this._subscribers = new Set();
    /** @type {Set<Function>} High-priority subscribers (BARGE_IN etc.) */
    this._prioritySubscribers = new Set();
  }

  /**
   * Subscribe to all bus events.
   * @param {Function} callback  - Called with the event object
   * @param {boolean}  priority  - If true, called before normal subscribers (use for BARGE_IN)
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback, priority = false) {
    const set = priority ? this._prioritySubscribers : this._subscribers;
    set.add(callback);
    return () => set.delete(callback);
  }

  /**
   * Emit a typed voice event.
   * @param {string} type     - One of VoiceEvents.*
   * @param {object} payload  - Event-specific data
   * @param {string} [sessionId]
   */
  emit(type, payload = {}, sessionId = '') {
    const event = createVoiceEvent(type, payload, sessionId);
    // Priority subscribers first (for barge-in latency)
    this._prioritySubscribers.forEach((cb) => {
      try { cb(event); } catch (err) { console.error('[InteractionBus] Priority subscriber error:', err); }
    });
    // Normal subscribers
    this._subscribers.forEach((cb) => {
      try { cb(event); } catch (err) { console.error('[InteractionBus] Subscriber error:', err); }
    });
  }

  /**
   * @deprecated Use emit(VoiceEvents.*, payload) instead.
   * Kept for backward compatibility with code that calls interactionBus.emit({ type, ... }).
   */
  emitRaw(event) {
    this._prioritySubscribers.forEach((cb) => { try { cb(event); } catch (e) {} });
    this._subscribers.forEach((cb) => { try { cb(event); } catch (e) {} });
  }
}

export const interactionBus = new InteractionBusEmitter();

