/**
 * SyncQueueRepository.js - Offline Command Queue (IndexedDB)
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * Stores commands created while offline.
 * On network restore: flush queue → CommandBus → backend.
 *
 * CONFLICT POLICY (v4 spec P1-9):
 *   Each queued command carries: commandId, aggregateId, expectedVersion,
 *   createdAt, deviceId, causationId.
 *   On sync, server evaluates:
 *     ACCEPT   — command applied successfully
 *     REJECT   — constraint violated
 *     MERGE    — partial application (e.g. weight differs slightly)
 *     REVIEW   — manual intervention needed
 *
 *   Client records server response in 'syncStatus' field.
 */

import { openDB, withTransaction } from '../db.js';
import { MemoryRepository } from '../Repository.js';

export const SyncStatus = Object.freeze({
  PENDING:        'PENDING',
  SYNCING:        'SYNCING',
  ACCEPTED:       'ACCEPTED',
  REJECTED:       'REJECTED',
  REQUIRES_REVIEW: 'REQUIRES_REVIEW',
});

class SyncQueueRepositoryImpl {
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
        console.error('[SyncQueueRepository] IndexedDB init failed:', err);
        this._db = null;
      }
    })();
    return this._initPromise;
  }

  /**
   * Enqueue an offline command.
   */
  async enqueue(command) {
    await this._init();
    const entry = {
      commandId:       command.commandId || `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      type:            command.type,
      payload:         command.payload || {},
      source:          command.source || 'VOICE',
      aggregateId:     command.payload?.lotId || null,
      expectedVersion: command.expectedVersion || null,
      causationId:     command.causationId || null,
      deviceId:        'web',
      createdAt:       Date.now(),
      syncStatus:      SyncStatus.PENDING,
      syncAttempts:    0,
      lastAttemptAt:   null,
      serverResponse:  null,
    };

    this._memory._store.set(entry.commandId, entry);

    if (this._db) {
      try {
        await withTransaction(this._db, 'syncQueue', 'readwrite', (tx) => {
          tx.objectStore('syncQueue').put(entry);
        });
      } catch (err) {
        console.error('[SyncQueueRepository] enqueue error:', err);
      }
    }

    return entry;
  }

  /**
   * Get all PENDING commands ordered by createdAt (FIFO).
   */
  async getPending() {
    await this._init();
    return [...this._memory._store.values()]
      .filter((c) => c.syncStatus === SyncStatus.PENDING)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Mark a command's sync status (after server response).
   */
  async updateStatus(commandId, syncStatus, serverResponse = null) {
    await this._init();
    const entry = this._memory._store.get(commandId);
    if (!entry) return;

    const updated = {
      ...entry,
      syncStatus,
      syncAttempts:  entry.syncAttempts + 1,
      lastAttemptAt: Date.now(),
      serverResponse,
    };
    this._memory._store.set(commandId, updated);

    if (this._db) {
      try {
        await withTransaction(this._db, 'syncQueue', 'readwrite', (tx) => {
          tx.objectStore('syncQueue').put(updated);
        });
      } catch (err) {
        console.error('[SyncQueueRepository] updateStatus error:', err);
      }
    }
  }

  /**
   * Remove all ACCEPTED commands (successful sync cleanup).
   */
  async flushAccepted() {
    await this._init();
    const accepted = [...this._memory._store.values()]
      .filter((c) => c.syncStatus === SyncStatus.ACCEPTED);

    accepted.forEach((c) => this._memory._store.delete(c.commandId));

    if (this._db && accepted.length > 0) {
      try {
        await withTransaction(this._db, 'syncQueue', 'readwrite', (tx) => {
          const store = tx.objectStore('syncQueue');
          accepted.forEach((c) => store.delete(c.commandId));
        });
      } catch (err) {
        console.error('[SyncQueueRepository] flushAccepted error:', err);
      }
    }

    return accepted.length;
  }

  async count() {
    await this._init();
    return this._memory._store.size;
  }

  async pendingCount() {
    const pending = await this.getPending();
    return pending.length;
  }

  async findAll() {
    await this._init();
    return [...this._memory._store.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  async clear() {
    await this._init();
    this._memory._store.clear();
    if (this._db) {
      try {
        await withTransaction(this._db, 'syncQueue', 'readwrite', (tx) => {
          tx.objectStore('syncQueue').clear();
        });
      } catch (err) {
        console.error('[SyncQueueRepository] clear error:', err);
      }
    }
  }
}

export const syncQueueRepository = new SyncQueueRepositoryImpl();
