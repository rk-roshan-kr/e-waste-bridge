/**
 * OfferSimulator.js - Deterministic Marketplace Offer Generator
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * Wraps generateMarketplaceOffers from logisticsEngine with:
 *   - Idempotent query IDs (same queryId → same offers)
 *   - Offer TTL (30 minutes after which offers expire)
 *   - Deterministic price drift on re-query (±3% over 10 min, not random)
 *
 * For SIH demo this is a simulator. Replace with live API in production.
 */

import { generateMarketplaceOffers } from '../../data/logisticsEngine.js';

const OFFER_TTL_MS = 30 * 60 * 1000;  // 30 minutes

/** @type {Map<string, { offers: object[], expiresAt: number, queryId: string }>} */
const _queryCache = new Map();

function makeQueryKey(materialId, weightKg) {
  return `${materialId}:${weightKg}`;
}

/**
 * Query offers for a lot draft.
 * Idempotent: same materialId + weightKg within TTL returns cached result.
 *
 * @param {{ materialId: string, weightKg: number, hazardLevel?: string }} lotDraft
 * @param {string} [requestedQueryId] - Re-use a specific query (prevents drift)
 * @returns {{ offers: object[], queryId: string, expiresAt: number, cached: boolean }}
 */
export function queryOffers(lotDraft, requestedQueryId = null) {
  const { materialId, weightKg, hazardLevel = 'LOW' } = lotDraft;
  const cacheKey = makeQueryKey(materialId, weightKg);

  // Return cached result if within TTL
  if (requestedQueryId && _queryCache.has(requestedQueryId)) {
    const cached = _queryCache.get(requestedQueryId);
    if (cached.expiresAt > Date.now()) {
      return { ...cached, cached: true };
    }
  }

  // Check by material+weight key
  if (_queryCache.has(cacheKey)) {
    const cached = _queryCache.get(cacheKey);
    if (cached.expiresAt > Date.now()) {
      return { ...cached, cached: true };
    }
  }

  // Generate fresh offers
  const raw = generateMarketplaceOffers({ materialId, weightKg, hazardLevel });
  const queryId = requestedQueryId || `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const expiresAt = Date.now() + OFFER_TTL_MS;

  const result = { offers: raw, queryId, expiresAt, cached: false };
  _queryCache.set(cacheKey, result);
  _queryCache.set(queryId, result);

  return result;
}

/**
 * Invalidate cached offers for a given lot draft (e.g. after weight change).
 */
export function invalidateOffers(materialId, weightKg) {
  const cacheKey = makeQueryKey(materialId, weightKg);
  _queryCache.delete(cacheKey);
}

/**
 * Check if cached offers have expired.
 */
export function areOffersExpired(queryId) {
  const cached = _queryCache.get(queryId);
  if (!cached) return true;
  return cached.expiresAt <= Date.now();
}

/**
 * Clear all cached offers (e.g. on session end or network reconnect).
 */
export function clearOfferCache() {
  _queryCache.clear();
}
