/**
 * Repository.js - Base Repository Interface
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * RULE: Domain layer depends on this interface only.
 * Implementations (IndexedDBRepository, MemoryRepository) are injected.
 * The domain layer never knows where data lives.
 */

export class Repository {
  /** @returns {Promise<void>} */
  async save(entity)              { throw new Error('Not implemented'); }

  /** @returns {Promise<void>} */
  async saveAll(entities)         { throw new Error('Not implemented'); }

  /** @returns {Promise<object|null>} */
  async findById(id)              { throw new Error('Not implemented'); }

  /** @returns {Promise<object[]>} */
  async findAll()                 { throw new Error('Not implemented'); }

  /** @returns {Promise<object[]>} */
  async query(predicate)          { throw new Error('Not implemented'); }

  /** @returns {Promise<void>} */
  async delete(id)                { throw new Error('Not implemented'); }

  /** @returns {Promise<void>} */
  async clear()                   { throw new Error('Not implemented'); }

  /** @returns {Promise<number>} */
  async count()                   { throw new Error('Not implemented'); }
}

/**
 * MemoryRepository - In-memory fallback for SSR / test environments
 * Also used as the initial seed container during IndexedDB hydration.
 */
export class MemoryRepository extends Repository {
  constructor(initialData = []) {
    super();
    this._store = new Map();
    initialData.forEach((item) => {
      const key = item.lotId || item.eventId || item.commandId || item.id;
      if (key) this._store.set(key, item);
    });
  }

  async save(entity) {
    const key = entity.lotId || entity.eventId || entity.commandId || entity.id;
    this._store.set(key, { ...entity });
  }

  async saveAll(entities) {
    for (const e of entities) await this.save(e);
  }

  async findById(id) {
    return this._store.get(id) ?? null;
  }

  async findAll() {
    return [...this._store.values()];
  }

  async query(predicate) {
    return [...this._store.values()].filter(predicate);
  }

  async delete(id) {
    this._store.delete(id);
  }

  async clear() {
    this._store.clear();
  }

  async count() {
    return this._store.size;
  }
}
