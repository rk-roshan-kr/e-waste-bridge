// PDR Dataset 2: Price Benchmark Dataset
// Reference: Regional scrap quotes, formal recycler tender records, CPCB compliance baseline

export const PRICE_BENCHMARKS = [
  {
    materialId: "smartphones",
    region: "MH-MMR (Mumbai Metro)",
    benchmarkRatePerKg: 380,
    minRatePerKg: 340,
    maxRatePerKg: 420,
    unit: "kg",
    lastUpdated: "2026-09-04T09:30:00Z",
    freshnessScore: 0.98,
    sampleTransactionsCount: 142,
    priceTrend: "UP_4_PCT",
    source: "Aggregated CPCB Recycler Intake Index"
  },
  {
    materialId: "laptops",
    region: "MH-MMR (Mumbai Metro)",
    benchmarkRatePerKg: 210,
    minRatePerKg: 190,
    maxRatePerKg: 240,
    unit: "kg",
    lastUpdated: "2026-09-04T10:15:00Z",
    freshnessScore: 0.95,
    sampleTransactionsCount: 98,
    priceTrend: "STABLE",
    source: "Authorized Refurbisher & Smelter Log"
  },
  {
    materialId: "pcb",
    region: "MH-MMR (Mumbai Metro)",
    benchmarkRatePerKg: 350,
    minRatePerKg: 310,
    maxRatePerKg: 420,
    unit: "kg",
    lastUpdated: "2026-09-04T11:00:00Z",
    freshnessScore: 0.99,
    sampleTransactionsCount: 215,
    priceTrend: "UP_8_PCT",
    source: "Precious Metal Recovery Benchmark (Gold/Copper London Metal Exchange indexed)"
  },
  {
    materialId: "batteries",
    region: "MH-MMR (Mumbai Metro)",
    benchmarkRatePerKg: 95,
    minRatePerKg: 80,
    maxRatePerKg: 110,
    unit: "kg",
    lastUpdated: "2026-09-04T08:00:00Z",
    freshnessScore: 0.92,
    sampleTransactionsCount: 64,
    priceTrend: "STABLE",
    source: "Authorized Battery Recycler Portal"
  },
  {
    materialId: "cables",
    region: "MH-MMR (Mumbai Metro)",
    benchmarkRatePerKg: 180,
    minRatePerKg: 165,
    maxRatePerKg: 205,
    unit: "kg",
    lastUpdated: "2026-09-04T12:00:00Z",
    freshnessScore: 0.96,
    sampleTransactionsCount: 180,
    priceTrend: "UP_2_PCT",
    source: "Secondary Copper Smelter Rate Sheet"
  },
  {
    materialId: "crt",
    region: "MH-MMR (Mumbai Metro)",
    benchmarkRatePerKg: 45,
    minRatePerKg: 35,
    maxRatePerKg: 55,
    unit: "kg",
    lastUpdated: "2026-09-03T18:00:00Z",
    freshnessScore: 0.88,
    sampleTransactionsCount: 38,
    priceTrend: "DOWN_3_PCT",
    source: "Leaded Glass Smelting Partner Bulletin"
  },
  {
    materialId: "abs_plastic",
    region: "MH-MMR (Mumbai Metro)",
    benchmarkRatePerKg: 30,
    minRatePerKg: 26,
    maxRatePerKg: 34,
    unit: "kg",
    lastUpdated: "2026-09-04T13:30:00Z",
    freshnessScore: 0.94,
    sampleTransactionsCount: 76,
    priceTrend: "UP_5_PCT",
    source: "Polymer Pelletizer & Extruder Daily Sheet"
  }
];

export function getBenchmarkForMaterial(materialId) {
  return (
    PRICE_BENCHMARKS.find((b) => b.materialId === materialId) || {
      benchmarkRatePerKg: 100,
      minRatePerKg: 70,
      maxRatePerKg: 130,
      freshnessScore: 0.75,
      priceTrend: "STABLE"
    }
  );
}
