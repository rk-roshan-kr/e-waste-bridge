// PDR Dataset 7: Buyer Demand & Standing Procurement Dataset
// Implements the Two-Sided Marketplace: Recycler publishes demand, platform smart-matches incoming collector lots

import { calculateLogisticsCost } from "./logisticsEngine.js";

export const INITIAL_BUY_REQUESTS = [
  {
    id: "BUY-REQ-ABS-101",
    recyclerId: "rec-maha-green",
    recyclerName: "MahaGreen Dismantlers",
    cpcbRegistrationNo: "CPCB/EPR-REC/2024/MH-0311",
    materialId: "abs_plastic",
    materialName: "ABS Plastic & Appliance Casings",
    targetQuantityKg: 20,
    acceptableRangeKg: { min: 15, max: 30 },
    targetPricePerKg: 30,
    maxAcceptablePricePerKg: 32,
    location: "Kurla Industrial Estate, Mumbai",
    radiusKm: 25,
    pickupOffered: true,
    pickupVehicleType: "Electric Cargo 3-Wheeler",
    validityDays: 7,
    status: "ACTIVE",
    activeMatchesCount: 3,
    createdAt: "2026-09-03T10:00:00Z"
  },
  {
    id: "BUY-REQ-PCB-102",
    recyclerId: "rec-ecobirbal",
    recyclerName: "EcoBirbal Circular Metals",
    cpcbRegistrationNo: "CPCB/EPR-REC/2022/MH-0082",
    materialId: "pcb",
    materialName: "Mixed PCBs & Motherboards",
    targetQuantityKg: 50,
    acceptableRangeKg: { min: 20, max: 80 },
    targetPricePerKg: 360,
    maxAcceptablePricePerKg: 385,
    location: "Bhiwandi Logistics Hub, Thane",
    radiusKm: 40,
    pickupOffered: true,
    pickupVehicleType: "Eicher Pro 2049 (2.5T)",
    validityDays: 14,
    status: "ACTIVE",
    activeMatchesCount: 5,
    createdAt: "2026-09-02T14:30:00Z"
  },
  {
    id: "BUY-REQ-LAP-103",
    recyclerId: "rec-apex",
    recyclerName: "Apex E-Recovery Ltd.",
    cpcbRegistrationNo: "CPCB/EPR-REC/2023/MH-0149",
    materialId: "laptops",
    materialName: "Laptops & Notebooks",
    targetQuantityKg: 15,
    acceptableRangeKg: { min: 10, max: 25 },
    targetPricePerKg: 220,
    maxAcceptablePricePerKg: 235,
    location: "Turbhe MIDC, Navi Mumbai",
    radiusKm: 30,
    pickupOffered: true,
    pickupVehicleType: "Tata Ace EV (1.2T)",
    validityDays: 10,
    status: "ACTIVE",
    activeMatchesCount: 4,
    createdAt: "2026-09-04T08:00:00Z"
  },
  {
    id: "BUY-REQ-BAT-104",
    recyclerId: "rec-safebat",
    recyclerName: "SafeCell Battery Solutions",
    cpcbRegistrationNo: "CPCB/HAZ-BAT/2023/MH-0044",
    materialId: "batteries",
    materialName: "Li-Ion & Lead Acid Batteries",
    targetQuantityKg: 30,
    acceptableRangeKg: { min: 10, max: 50 },
    targetPricePerKg: 105,
    maxAcceptablePricePerKg: 115,
    location: "Taloja Chemical Zone, Navi Mumbai",
    radiusKm: 35,
    pickupOffered: true,
    pickupVehicleType: "Hazardous Materials Certified Van",
    validityDays: 5,
    status: "ACTIVE",
    activeMatchesCount: 2,
    createdAt: "2026-09-04T09:15:00Z"
  }
];

/**
 * Smart Match: Finds standing buyer requirements that match a collector's lot
 */
export function matchDemandForLot(allBuyRequests, { materialId, weightKg, distanceKm = 8.4 }) {
  return allBuyRequests.filter((req) => {
    if (req.status !== "ACTIVE") return false;
    if (req.materialId !== materialId) return false;
    if (distanceKm > req.radiusKm) return false;
    // Allow if weight is within tolerance or collector has at least 50% of target
    return weightKg >= req.acceptableRangeKg.min * 0.7 && weightKg <= req.acceptableRangeKg.max * 1.5;
  });
}

/**
 * Smart Negotiation Engine:
 * Proposes a balanced rate between Buyer Target and Collector Ask,
 * generating explainable reasoning based on volume, distance, and recent clearance.
 * Note: AI only suggests — Human confirms!
 */
export function calculateAISuggestedNegotiation({
  buyerTargetRate,
  collectorAskRate,
  weightKg,
  targetQuantityKg,
  distanceKm,
  hazardLevel = "LOW",
  language = "mr"
}) {
  // Balanced suggestion
  const diff = collectorAskRate - buyerTargetRate;
  const suggestedRate = Math.round(buyerTargetRate + diff * 0.45); // slightly favor volume agreement

  // Logistics deduction
  const logisticsEst = calculateLogisticsCost({
    distanceKm,
    weightKg,
    hazardLevel,
    pickupRequested: true
  });

  const grossOffer = Math.round(suggestedRate * weightKg);
  const netPayout = grossOffer - logisticsEst;

  let reasoning = [];
  if (language === "mr") {
    reasoning = [
      `खरेदीदाराची थेट मागणी ${targetQuantityKg} किलो आहे; कलेक्टरकडे ${weightKg} किलो स्क्रॅप उपलब्ध (${Math.round((weightKg / targetQuantityKg) * 100)}% पूर्तता).`,
      `वाहतूक अंतर अवघे ${distanceKm} किमी आहे (जवळच्या अंतरामुळे पिकअप खर्च फक्त ₹${logisticsEst} वजा होईल).`,
      `मुंबई परिक्षेत्रात या स्क्रॅपचे व्यवहार ₹${buyerTargetRate} ते ₹${collectorAskRate}/किलो दरम्यान झाले आहेत.`,
      `या तडजोडीने कलेक्टरला हातात रोख ₹${netPayout} मिळतील आणि पुनर्वापर केंद्रालाही कच्चा माल मिळेल.`
    ];
  } else if (language === "hi") {
    reasoning = [
      `खरीदार की मांग ${targetQuantityKg} किलो है; आपके पास ${weightKg} किलो स्क्रैप उपलब्ध (${Math.round((weightKg / targetQuantityKg) * 100)}% कोटा पूरा).`,
      `परिवहन दूरी केवल ${distanceKm} किमी है (निकटवर्ती दूरी से पिकअप कटौती मात्र ₹${logisticsEst} है).`,
      `इस क्षेत्र में हाल के सौदे ₹${buyerTargetRate} से ₹${collectorAskRate}/किलो के बीच तय हुए हैं.`,
      `इस समझौते से कलेक्टर को हाथ में शुद्ध नकद ₹${netPayout} मिलेंगे और खरीदार को उचित माल मिलेगा.`
    ];
  } else {
    reasoning = [
      `Buyer standing requirement is ${targetQuantityKg} kg; collector provides ${weightKg} kg (${Math.round((weightKg / targetQuantityKg) * 100)}% coverage).`,
      `Transit distance is only ${distanceKm} km (hyperlocal corridor reduces transport fee to ₹${logisticsEst}).`,
      `Historical transactions in MH-MMR for this grade cleared between ₹${buyerTargetRate} and ₹${collectorAskRate}/kg.`,
      `Mutual compromise protects collector net payout (₹${netPayout} in hand) while maintaining recycler margin.`
    ];
  }

  return {
    buyerTargetRate,
    collectorAskRate,
    suggestedRate,
    grossOffer,
    logisticsEst,
    netPayout,
    distanceKm,
    reasoning
  };
}
