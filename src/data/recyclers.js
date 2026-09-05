// PDR Dataset 3: Authorized Recycler Registry & Verification Dataset
// Reference: CPCB EPR Portal Register of Authorized Recyclers & Refurbishers

export const RECYCLERS = [
  {
    id: "rec-apex",
    name: "Apex E-Recovery Ltd.",
    badge: "CPCB Authorized • Grade A",
    cpcbRegistrationNo: "CPCB/EPR-REC/2023/MH-0149",
    validTill: "2028-03-31",
    status: "VERIFIED_ACTIVE",
    location: "Turbhe MIDC, Navi Mumbai",
    distanceKm: 4.8,
    pickupCapability: true,
    pickupVehicleType: "Tata Ace EV (1.2T)",
    rating: 4.9,
    completedTransactions: 342,
    acceptedCategories: ["smartphones", "laptops", "pcb", "cables"],
    intakeCapacityKgPerDay: 4000,
    currentIntakeKg: 2150,
    settlementModes: ["CASH_IMMEDIATE", "UPI_INSTANT", "NEFT"],
    spreadPolicy: "TIGHT_BENCHMARK", // competitive
    biddingStrategy: {
      multiplier: 1.05, // aggressive bidder
      pickupSurchargeRate: 25 // ₹25/km
    }
  },
  {
    id: "rec-ecobirbal",
    name: "EcoBirbal Circular Metals",
    badge: "CPCB Authorized • R-Refiner",
    cpcbRegistrationNo: "CPCB/EPR-REC/2022/MH-0082",
    validTill: "2027-12-31",
    status: "VERIFIED_ACTIVE",
    location: "Bhiwandi Logistics Hub, Thane",
    distanceKm: 14.2,
    pickupCapability: true,
    pickupVehicleType: "Eicher Pro 2049 (2.5T)",
    rating: 4.8,
    completedTransactions: 618,
    acceptedCategories: ["pcb", "laptops", "smartphones", "batteries"],
    intakeCapacityKgPerDay: 8000,
    currentIntakeKg: 5200,
    settlementModes: ["CASH_IMMEDIATE", "UPI_INSTANT"],
    spreadPolicy: "PREMIUM_FOR_PCB", // pays high for PCBs
    biddingStrategy: {
      multiplier: 1.09, // very high bid on PCBs
      pickupSurchargeRate: 20
    }
  },
  {
    id: "rec-maha-green",
    name: "MahaGreen Dismantlers",
    badge: "MPCB & CPCB Registered",
    cpcbRegistrationNo: "CPCB/EPR-REC/2024/MH-0311",
    validTill: "2029-06-30",
    status: "VERIFIED_ACTIVE",
    location: "Kurla Industrial Estate, Mumbai",
    distanceKm: 2.3, // very close!
    pickupCapability: true,
    pickupVehicleType: "Electric Cargo 3-Wheeler",
    rating: 4.7,
    completedTransactions: 194,
    acceptedCategories: ["smartphones", "laptops", "cables", "crt", "unknown"],
    intakeCapacityKgPerDay: 2000,
    currentIntakeKg: 1100,
    settlementModes: ["CASH_IMMEDIATE", "UPI_INSTANT"],
    spreadPolicy: "HYPERLOCAL_FAST",
    biddingStrategy: {
      multiplier: 1.02,
      pickupSurchargeRate: 15 // cheap local pickup
    }
  },
  {
    id: "rec-safebat",
    name: "SafeCell Battery Solutions",
    badge: "CPCB Hazardous Waste Recycler",
    cpcbRegistrationNo: "CPCB/HAZ-BAT/2023/MH-0044",
    validTill: "2027-09-30",
    status: "VERIFIED_ACTIVE",
    location: "Taloja Chemical Zone, Navi Mumbai",
    distanceKm: 22.0,
    pickupCapability: true,
    pickupVehicleType: "Hazardous Materials Certified Van",
    rating: 4.9,
    completedTransactions: 280,
    acceptedCategories: ["batteries"],
    intakeCapacityKgPerDay: 3000,
    currentIntakeKg: 1400,
    settlementModes: ["CASH_IMMEDIATE", "UPI_INSTANT"],
    spreadPolicy: "BATTERY_SPECIALIST",
    biddingStrategy: {
      multiplier: 1.12,
      pickupSurchargeRate: 30
    }
  }
];
