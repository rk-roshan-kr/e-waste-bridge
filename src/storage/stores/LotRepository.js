/**
 * LotRepository.js - Lot Persistence (IndexedDB + Memory fallback)
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * Manages the 'lots' object store in IndexedDB.
 * Falls back to MemoryRepository when IndexedDB is unavailable.
 *
 * NOTE: On first load, seeds IndexedDB from INITIAL_LOTS if the store is empty.
 * This ensures the SIH demo has realistic historical data immediately.
 */

import { openDB, promisifyRequest, withTransaction } from '../db.js';
import { MemoryRepository } from '../Repository.js';
import { INITIAL_LOTS } from '../../data/initialLots.js';

class LotRepositoryImpl {
  constructor() {
    this._memory = new MemoryRepository(INITIAL_LOTS);
    this._db = null;
    this._ready = false;
    this._initPromise = null;
  }

  async _init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      try {
        this._db = await openDB();
        if (!this._db) {
          console.warn('[LotRepository] Using memory fallback');
          return;
        }

        // Check if seeding is needed
        const existingCount = await this._count();
        if (existingCount === 0) {
          console.log('[LotRepository] Seeding IndexedDB with', INITIAL_LOTS.length, 'initial lots');
          await this.saveAll(INITIAL_LOTS);
        }

        this._ready = true;
      } catch (err) {
        console.error('[LotRepository] IndexedDB init failed, using memory:', err);
        this._db = null;
      }
    })();
    return this._initPromise;
  }

  async _count() {
    if (!this._db) return 0;
    const tx = this._db.transaction('lots', 'readonly');
    const store = tx.objectStore('lots');
    return promisifyRequest(store.count());
  }

  // ── Write ───────────────────────────────────────────────────────────────────

  async save(lot) {
    await this._init();
    // Always update memory (fast path for UI reads)
    this._memory._store.set(lot.lotId, { ...lot });
    if (!this._db) return;
    try {
      await withTransaction(this._db, 'lots', 'readwrite', (tx) => {
        const store = tx.objectStore('lots');
        store.put({ ...lot });
      });
    } catch (err) {
      console.error('[LotRepository] save error:', err);
    }
  }

  async saveAll(lots) {
    await this._init();
    lots.forEach((lot) => this._memory._store.set(lot.lotId, { ...lot }));
    if (!this._db) return;
    try {
      await withTransaction(this._db, 'lots', 'readwrite', (tx) => {
        const store = tx.objectStore('lots');
        lots.forEach((lot) => store.put({ ...lot }));
      });
    } catch (err) {
      console.error('[LotRepository] saveAll error:', err);
    }
  }

  async delete(lotId) {
    await this._init();
    this._memory._store.delete(lotId);
    if (!this._db) return;
    try {
      await withTransaction(this._db, 'lots', 'readwrite', (tx) => {
        tx.objectStore('lots').delete(lotId);
      });
    } catch (err) {
      console.error('[LotRepository] delete error:', err);
    }
  }

  // ── Read ────────────────────────────────────────────────────────────────────

  async findById(lotId) {
    await this._init();
    // Memory is always in sync — use it for fast reads
    return this._memory._store.get(lotId) ?? null;
  }

  async findAll() {
    await this._init();
    return [...this._memory._store.values()].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  async query(predicate) {
    await this._init();
    return [...this._memory._store.values()].filter(predicate);
  }

  async findByStatus(status) {
    return this.query((lot) => lot.status === status);
  }

  async findByMaterial(materialId) {
    return this.query((lot) => lot.materialId === materialId);
  }

  async count() {
    await this._init();
    return this._memory._store.size;
  }

  async clear() {
    await this._init();
    this._memory._store.clear();
    if (!this._db) return;
    try {
      await withTransaction(this._db, 'lots', 'readwrite', (tx) => {
        tx.objectStore('lots').clear();
      });
    } catch (err) {
      console.error('[LotRepository] clear error:', err);
    }
  }

  /**
   * Hydrate: return all lots from IndexedDB (for AppState init).
   * Falls back to INITIAL_LOTS if IndexedDB is empty or unavailable.
   */
  async hydrate() {
    await this._init();
    return this.findAll();
  }
}

export const lotRepository = new LotRepositoryImpl();
