/**
 * EventLogRepository.js - Append-Only Event Log (IndexedDB)
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * RULE: Events are append-only. Never update or delete an event.
 * delete() is provided ONLY for test/reset purposes and is guarded.
 *
 * Correct terminology:
 *   Client: "append-only event log" — hash-linked records.
 *   Production: server-authoritative ledger with signed timestamps.
 *   This client log is a local cache of eventually-consistent events.
 */

import { openDB, promisifyRequest, withTransaction } from '../db.js';
import { MemoryRepository } from '../Repository.js';

/**
 * Create a new event record with hash linking.
 * SHA-256 is computed over (eventId + previousHash + payload).
 * This provides integrity detection — NOT tamper-proof security on the client.
 */
export async function createEventRecord({
  aggregateId,
  aggregateType = 'LOT',
  eventType,
  actor,
  actorType = 'COLLECTOR',
  source = 'SYSTEM',
  payload = {},
  previousEventId = null,
  previousHash = null,
  commandId = null,
  deviceId = 'web',
}) {
  const eventId   = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
  const timestamp = Date.now();
  const hashInput = `${eventId}|${previousHash || ''}|${JSON.stringify(payload)}`;

  let eventHash = '';
  try {
    const msgBuffer = new TextEncoder().encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    eventHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    // crypto.subtle not available (non-secure context) — use simple hash
    eventHash = String(hashInput.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0) >>> 0);
  }

  return {
    eventId,
    aggregateId,
    aggregateType,
    eventType,
    schemaVersion: '1',
    timestamp,
    actor:          actor || 'SYSTEM',
    actorType,
    source,
    payload,
    previousEventId,
    previousHash,
    eventHash,
    commandId,
    deviceId,
  };
}

class EventLogRepositoryImpl {
  constructor() {
    this._memory = new MemoryRepository();
    this._db = null;
    this._initPromise = null;
  }

  async _init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      try {
        this._db = await openDB();
      } catch (err) {
        console.error('[EventLogRepository] IndexedDB init failed:', err);
        this._db = null;
      }
    })();
    return this._initPromise;
  }

  /**
   * Append an event. Resolves the previous event hash automatically.
   */
  async append(eventData) {
    await this._init();
    const allEvents = await this.findByAggregate(eventData.aggregateId);
    const lastEvent = allEvents.sort((a, b) => a.timestamp - b.timestamp).at(-1);

    const record = await createEventRecord({
      ...eventData,
      previousEventId: lastEvent?.eventId || null,
      previousHash:    lastEvent?.eventHash || null,
    });

    this._memory._store.set(record.eventId, record);

    if (this._db) {
      try {
        await withTransaction(this._db, 'events', 'readwrite', (tx) => {
          tx.objectStore('events').put(record);
        });
      } catch (err) {
        console.error('[EventLogRepository] append error:', err);
      }
    }

    return record;
  }

  async findByAggregate(aggregateId) {
    await this._init();
    return [...this._memory._store.values()]
      .filter((e) => e.aggregateId === aggregateId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async findAll() {
    await this._init();
    return [...this._memory._store.values()].sort((a, b) => a.timestamp - b.timestamp);
  }

  async count() {
    await this._init();
    return this._memory._store.size;
  }

  /** Test/reset only — events should never be deleted in production */
  async clearForTesting() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[EventLogRepository] clear() is not allowed in production');
    }
    this._memory._store.clear();
    if (this._db) {
      await withTransaction(this._db, 'events', 'readwrite', (tx) => {
        tx.objectStore('events').clear();
      });
    }
  }
}

export const eventLogRepository = new EventLogRepositoryImpl();
