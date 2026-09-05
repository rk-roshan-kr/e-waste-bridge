// PDR Dataset 4 (Transactions) & Dataset 5 (Traceability Ledger)
// Includes verifiable state machine events & immutable mock hashes

import { SAMPLE_LOT_PHOTOS } from "./samplePhotos.js";

export const INITIAL_LOTS = [
  {
    lotId: "EW-2041",
    materialId: "laptops",
    materialName: "Laptops & Notebooks",
    reportedWeightKg: 12.4,
    actualIntakeWeightKg: 12.4,
    unitsCount: 6,
    photoUrl: SAMPLE_LOT_PHOTOS.laptops,
    conditionGrade: "SCRAP",
    collectorId: "col-ramesh-74",
    collectorName: "Ramesh Pawar",
    collectorLocation: "Dharavi Sector 3, Mumbai",
    selectedBuyerId: "rec-apex",
    selectedBuyerName: "Apex E-Recovery Ltd.",
    status: "SETTLED",
    lifecycleStage: "HANDED_OVER", // node 5
    settlementMode: "CASH",
    grossBid: 3100,
    logisticsCost: 160,
    netPayout: 2940,
    createdAt: "2026-09-04T08:15:00Z",
    settledAt: "2026-09-04T11:42:00Z",
    qrCode: "EWB-QR-EW2041-99824X",
    events: [
      { step: "COLLECTED", timestamp: "2026-09-04T08:15:00Z", agent: "Ramesh Pawar", note: "Lot drafted and photographed offline" },
      { step: "VERIFIED", timestamp: "2026-09-04T08:18:00Z", agent: "System AI Engine", note: "Category classified as ITC-LAP, 96% confidence" },
      { step: "BIDDED", timestamp: "2026-09-04T08:45:00Z", agent: "Reverse Marketplace", note: "3 eligible CPCB recyclers submitted bids" },
      { step: "MATCHED", timestamp: "2026-09-04T08:48:00Z", agent: "Ramesh Pawar", note: "Accepted Apex E-Recovery (Net ₹2,940 in hand)" },
      { step: "HANDED_OVER", timestamp: "2026-09-04T11:30:00Z", agent: "Driver Sunil (Apex EV)", note: "Physical handover & digital weight scale verification" },
      { step: "INTAKE_CONFIRMED", timestamp: "2026-09-04T11:40:00Z", agent: "Intake Officer", note: "Weighed 12.4kg. Non-tamper barcode attached." },
      { step: "RECYCLED", timestamp: null, agent: "Scheduled Smelter Line 2", note: "Queue for mechanical de-soldering" }
    ]
  },
  {
    lotId: "EW-2040",
    materialId: "smartphones",
    materialName: "Mobile Phones & Smartphones",
    reportedWeightKg: 8.1,
    actualIntakeWeightKg: 8.2,
    unitsCount: 38,
    photoUrl: SAMPLE_LOT_PHOTOS.smartphones,
    conditionGrade: "SCRAP",
    collectorId: "col-ramesh-74",
    collectorName: "Ramesh Pawar",
    collectorLocation: "Kurla West, Mumbai",
    selectedBuyerId: "rec-maha-green",
    selectedBuyerName: "MahaGreen Dismantlers",
    status: "CLOSED",
    lifecycleStage: "RECYCLED", // node 7
    settlementMode: "CASH",
    grossBid: 3200,
    logisticsCost: 120,
    netPayout: 3080,
    createdAt: "2026-09-03T14:10:00Z",
    settledAt: "2026-09-03T17:00:00Z",
    qrCode: "EWB-QR-EW2040-77123A",
    events: [
      { step: "COLLECTED", timestamp: "2026-09-03T14:10:00Z", agent: "Ramesh Pawar", note: "Lot created" },
      { step: "VERIFIED", timestamp: "2026-09-03T14:12:00Z", agent: "System AI Engine", note: "Classified as TEL-MOB" },
      { step: "BIDDED", timestamp: "2026-09-03T14:30:00Z", agent: "Marketplace RFQ", note: "2 bids received" },
      { step: "MATCHED", timestamp: "2026-09-03T14:35:00Z", agent: "Ramesh Pawar", note: "Matched with MahaGreen" },
      { step: "HANDED_OVER", timestamp: "2026-09-03T16:30:00Z", agent: "Pickup Agent", note: "Handover confirmed" },
      { step: "INTAKE_CONFIRMED", timestamp: "2026-09-03T16:45:00Z", agent: "MahaGreen Yard", note: "Verified weight 8.2kg" },
      { step: "RECYCLED", timestamp: "2026-09-04T06:00:00Z", agent: "Dismantling Line", note: "Batteries segregated; shredding complete" }
    ]
  },
  {
    lotId: "EW-2038",
    materialId: "pcb",
    materialName: "Mixed PCBs & Motherboards",
    reportedWeightKg: 5.2,
    actualIntakeWeightKg: null,
    unitsCount: 16,
    photoUrl: SAMPLE_LOT_PHOTOS.pcb,
    conditionGrade: "DAMAGED",
    collectorId: "col-ramesh-74",
    collectorName: "Ramesh Pawar",
    collectorLocation: "Bandra East, Mumbai",
    selectedBuyerId: null,
    selectedBuyerName: null,
    status: "BIDDING_ACTIVE",
    lifecycleStage: "BIDDED", // node 3
    settlementMode: "CASH",
    grossBid: 1950,
    logisticsCost: 150,
    netPayout: 1800,
    createdAt: "2026-09-04T15:00:00Z",
    biddingExpiresAt: "2026-09-04T16:30:00Z",
    qrCode: "EWB-QR-EW2038-55239B",
    events: [
      { step: "COLLECTED", timestamp: "2026-09-04T15:00:00Z", agent: "Ramesh Pawar", note: "Lot created via photo scan" },
      { step: "VERIFIED", timestamp: "2026-09-04T15:02:00Z", agent: "System AI Engine", note: "Classified as HGB-PCB, High Hazard" },
      { step: "BIDDED", timestamp: "2026-09-04T15:05:00Z", agent: "Reverse Marketplace", note: "Open Bidding Window active (2 bids in queue)" }
    ]
  }
];
