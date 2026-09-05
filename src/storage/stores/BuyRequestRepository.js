/**
 * BuyRequestRepository.js - Standing Buyer Demand Persistence
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 */

import { openDB, withTransaction } from '../db.js';
import { MemoryRepository } from '../Repository.js';
import { INITIAL_BUY_REQUESTS } from '../../data/buyerDemand.js';

class BuyRequestRepositoryImpl {
  constructor() {
    this._memory = new MemoryRepository(INITIAL_BUY_REQUESTS);
    this._db = null;
    this._initPromise = null;
  }

  async _init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      try {
        this._db = await openDB();
        if (!this._db) return;
        const existing = await this.count();
        if (existing === 0) {
          await this.saveAll(INITIAL_BUY_REQUESTS);
        }
      } catch (err) {
        console.error('[BuyRequestRepository] init failed:', err);
        this._db = null;
      }
    })();
    return this._initPromise;
  }

  async save(req) {
    await this._init();
    this._memory._store.set(req.id, { ...req });
    if (!this._db) return;
    try {
      await withTransaction(this._db, 'buyRequests', 'readwrite', (tx) => {
        tx.objectStore('buyRequests').put({ ...req });
      });
    } catch (err) { console.error('[BuyRequestRepository] save error:', err); }
  }

  async saveAll(reqs) {
    await this._init();
    reqs.forEach((r) => this._memory._store.set(r.id, { ...r }));
    if (!this._db) return;
    try {
      await withTransaction(this._db, 'buyRequests', 'readwrite', (tx) => {
        const store = tx.objectStore('buyRequests');
        reqs.forEach((r) => store.put({ ...r }));
      });
    } catch (err) { console.error('[BuyRequestRepository] saveAll error:', err); }
  }

  async findAll() {
    await this._init();
    return [...this._memory._store.values()];
  }

  async findByMaterial(materialId) {
    await this._init();
    return [...this._memory._store.values()].filter((r) => r.materialId === materialId);
  }

  async count() {
    await this._init();
    return this._memory._store.size;
  }

  async hydrate() {
    await this._init();
    return this.findAll();
  }
}

export const buyRequestRepository = new BuyRequestRepositoryImpl();
