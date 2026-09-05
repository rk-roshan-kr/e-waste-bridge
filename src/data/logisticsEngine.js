// Logistics & Reverse Marketplace NET VALUE Engine
// Incorporates distance, weight, material class hazard surcharge, and pickup vehicle mode.
// Compliant with CPCB hazardous waste transport considerations under E-Waste Rules 2022.

import { RECYCLERS } from "./recyclers.js";
import { getBenchmarkForMaterial } from "./priceBenchmarks.js";

/**
 * Calculates Estimated Logistics Cost.
 * Formula:
 * baseDispatchFee + (distanceKm * perKmRate) + (weightKg * handlingPerKg) + hazardSurcharge
 */
export function calculateLogisticsCost({ distanceKm, weightKg, hazardLevel, pickupRequested = true }) {
  if (!pickupRequested) {
    // Collector self-drops at recycler yard: minimal handling check
    return 0;
  }

  const baseDispatchFee = 70; // Base vehicle mobilization (INR)
  const perKmRate = 16; // Standard commercial EV / light cargo per km in metro corridor
  const weightHandlingPerKg = weightKg > 20 ? 3.5 : 1.5;

  let hazardSurcharge = 0;
  if (hazardLevel === "CRITICAL") {
    hazardSurcharge = 120; // certified battery fire-safe transit container requirement
  } else if (hazardLevel === "HIGH") {
    hazardSurcharge = 60; // CRT glass / high lead boards handling
  }

  const rawCost = baseDispatchFee + distanceKm * perKmRate + weightKg * weightHandlingPerKg + hazardSurcharge;
  // Round to nearest 10 for clean presentation
  return Math.max(90, Math.round(rawCost / 10) * 10);
}

/**
 * Generates competing recycler bids for a given lot, calculating gross bid,
 * estimated logistics cost, and the collector's actual NET PAYOUT.
 */
export function generateMarketplaceOffers({ materialId, weightKg, hazardLevel }) {
  const benchmark = getBenchmarkForMaterial(materialId);
  const baseValue = Math.round(benchmark.benchmarkRatePerKg * weightKg);

  // Find eligible recyclers accepting this category
  const eligible = RECYCLERS.filter((r) => r.acceptedCategories.includes(materialId));

  const offers = eligible.map((recycler, index) => {
    // Determine dynamic gross bid based on recycler's multiplier & category interest
    let multiplier = recycler.biddingStrategy.multiplier;
    if (materialId === "pcb" && recycler.id === "rec-ecobirbal") multiplier = 1.14;
    if (materialId === "batteries" && recycler.id === "rec-safebat") multiplier = 1.18;

    // Slight dynamic variance per offer
    const grossBid = Math.round(baseValue * multiplier);
    
    // Calculate estimated logistics cost
    const logisticsCost = calculateLogisticsCost({
      distanceKm: recycler.distanceKm,
      weightKg,
      hazardLevel,
      pickupRequested: recycler.pickupCapability
    });

    // Net value in hand for collector
    const netPayout = grossBid - logisticsCost;

    // Expected landed cost for the recycler
    const recyclerLandedCost = grossBid + (recycler.pickupCapability ? logisticsCost : 0);

    return {
      offerId: `OFFER-${recycler.id.substring(4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      recyclerId: recycler.id,
      recyclerName: recycler.name,
      badge: recycler.badge,
      cpcbRegistrationNo: recycler.cpcbRegistrationNo,
      rating: recycler.rating,
      distanceKm: recycler.distanceKm,
      pickupVehicleType: recycler.pickupVehicleType,
      grossBid,
      logisticsCost,
      netPayout,
      recyclerLandedCost,
      paymentMode: "Cash (or Instant UPI)",
      settlementTime: "Immediate on Handover",
      isAuthorized: true,
      pickupIncluded: true,
      timestamp: new Date().toISOString()
    };
  });

  // Sort descending by netPayout by default
  return offers.sort((a, b) => b.netPayout - a.netPayout);
}
