/**
 * db.js - IndexedDB Setup, Schema, and Migration
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * Database: "ewb_v4"
 * Version:  1
 *
 * Object Stores:
 *   lots          — keyPath: lotId       (all lot states)
 *   events        — keyPath: eventId     (append-only event log per lot)
 *   syncQueue     — keyPath: commandId   (offline command queue)
 *   buyRequests   — keyPath: id
 *
 * RULE: Only Repository classes open transactions against this DB.
 * No component or service imports db.js directly.
 *
 * MIGRATION STRATEGY:
 *   v1 → v1: initial schema
 *   Future: bump DB_VERSION, add onupgradeneeded branch.
 */

const DB_NAME    = 'ewb_v4';
const DB_VERSION = 1;

let _dbPromise = null;

export function openDB() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      // SSR / test environment — resolve null, repositories will use MemoryFallback
      console.warn('[db] indexedDB not available — using memory fallback');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // ── lots ────────────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('lots')) {
        const lotStore = db.createObjectStore('lots', { keyPath: 'lotId' });
        lotStore.createIndex('status',        'status',        { unique: false });
        lotStore.createIndex('createdAt',     'createdAt',     { unique: false });
        lotStore.createIndex('collectorId',   'collectorId',   { unique: false });
        lotStore.createIndex('materialId',    'materialId',    { unique: false });
      }

      // ── events (append-only event log) ───────────────────────────────────
      if (!db.objectStoreNames.contains('events')) {
        const evtStore = db.createObjectStore('events', { keyPath: 'eventId' });
        evtStore.createIndex('aggregateId',  'aggregateId',  { unique: false });
        evtStore.createIndex('timestamp',    'timestamp',    { unique: false });
        evtStore.createIndex('eventType',    'eventType',    { unique: false });
      }

      // ── syncQueue (offline command queue) ────────────────────────────────
      if (!db.objectStoreNames.contains('syncQueue')) {
        const qStore = db.createObjectStore('syncQueue', { keyPath: 'commandId' });
        qStore.createIndex('createdAt',      'createdAt',    { unique: false });
        qStore.createIndex('status',         'status',       { unique: false });
      }

      // ── buyRequests ───────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('buyRequests')) {
        const brStore = db.createObjectStore('buyRequests', { keyPath: 'id' });
        brStore.createIndex('materialId',    'materialId',   { unique: false });
        brStore.createIndex('status',        'status',       { unique: false });
      }
    };

    request.onsuccess  = (e) => resolve(e.target.result);
    request.onerror    = (e) => {
      console.error('[db] IndexedDB open error:', e.target.error);
      reject(e.target.error);
    };
    request.onblocked  = () => {
      console.warn('[db] IndexedDB blocked — another tab may be open');
    };
  });

  return _dbPromise;
}

/**
 * Low-level helper: wrap an IDBRequest in a Promise.
 */
export function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror   = (e) => reject(e.target.error);
  });
}

/**
 * Low-level helper: run a transaction and resolve when complete.
 * @param {IDBDatabase} db
 * @param {string|string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {Function} callback — receives (tx) and returns a value or Promise
 */
export async function withTransaction(db, storeNames, mode, callback) {
  if (!db) throw new Error('[db] No IndexedDB connection');
  const tx    = db.transaction(storeNames, mode);
  const result = await callback(tx);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(result);
    tx.onerror    = (e) => reject(e.target.error);
    tx.onabort    = (e) => reject(e.target.error || new Error('Transaction aborted'));
  });
}
