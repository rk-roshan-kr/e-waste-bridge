/**
 * PriceOracle.js - Benchmark Price Accessor with Deterministic Session Drift
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * Wraps priceBenchmarks.js with:
 *   - Deterministic ±3% drift over session time (NOT random — same timestamp = same price)
 *   - Confidence level reporting
 *   - Cache with staleness tracking
 *
 * For SIH: prices are simulated. In production: replace with live MSP API.
 */

import { getBenchmarkForMaterial } from '../../data/priceBenchmarks.js';

const SESSION_START = Date.now();
const MAX_DRIFT_PCT = 0.03;   // ±3% over 10 minutes
const DRIFT_PERIOD_MS = 10 * 60 * 1000;

/**
 * Compute deterministic drift factor for a given material.
 * Same material + same time = same factor. No randomness.
 *
 * @param {string} materialId
 * @returns {number} Multiplier near 1.0, max ±3%
 */
function driftFactor(materialId) {
  const elapsed = Math.min(Date.now() - SESSION_START, DRIFT_PERIOD_MS);
  const progress = elapsed / DRIFT_PERIOD_MS; // 0.0 → 1.0
  // Use material string hash for per-material variation (still deterministic)
  const hash = Array.from(materialId).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const direction = (hash % 2 === 0) ? 1 : -1;
  return 1.0 + direction * MAX_DRIFT_PCT * progress;
}

/**
 * Get current benchmark price for a material.
 *
 * @param {string} materialId - e.g. 'laptops', 'batteries', 'pcb'
 * @returns {{ ratePerKg: number, materialId: string, asOf: string, confidence: 'HIGH'|'MEDIUM'|'LOW' }}
 */
export function getBenchmark(materialId) {
  const base = getBenchmarkForMaterial(materialId);
  if (!base) {
    return { ratePerKg: 0, materialId, asOf: new Date().toISOString(), confidence: 'LOW' };
  }

  const rate = Math.round(base.benchmarkRatePerKg * driftFactor(materialId));
  const elapsedMin = Math.round((Date.now() - SESSION_START) / 60000);

  return {
    ratePerKg:  rate,
    baseRate:   base.benchmarkRatePerKg,
    materialId,
    asOf:       new Date().toISOString(),
    ageMinutes: elapsedMin,
    // Confidence degrades over time in session
    confidence: elapsedMin < 5 ? 'HIGH' : elapsedMin < 15 ? 'MEDIUM' : 'LOW',
  };
}

/**
 * Estimate gross value of a lot.
 * @param {string} materialId
 * @param {number} weightKg
 * @returns {{ grossValue: number, ratePerKg: number, confidence: string }}
 */
export function estimateGrossValue(materialId, weightKg) {
  const benchmark = getBenchmark(materialId);
  return {
    grossValue: Math.round(benchmark.ratePerKg * weightKg),
    ratePerKg:  benchmark.ratePerKg,
    confidence: benchmark.confidence,
  };
}
