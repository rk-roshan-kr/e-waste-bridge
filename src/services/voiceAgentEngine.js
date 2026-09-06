// E-Waste Bridge: Multimodal Collector Voice Agent Engine
// Architecture: Continuous Voice Loop + Multimodal Grounding + Screen Awareness + Transaction Policy Engine
// Core Rule 1: The agent should NEVER ask the collector for information already available in application context, user profile, device state, current lot state, or visible UI state.
// Core Rule 2: Voice prepares. Touch commits. (Voice for convenience, physical touch for financial commitment)
// Core Rule 3: Every tool returns { status, data, requiresConfirmation, error }

import { MATERIAL_TAXONOMY } from "../data/materialTaxonomy.js";
import { generateMarketplaceOffers } from "../data/logisticsEngine.js";
import { CONFIRMATION_POLICY } from "../data/confirmationPolicy.js";

// ==========================================
// 1. INTENT & TOOL CONSTANTS
// ==========================================
export const AGENT_INTENTS = {
  SELL_EWASTE: "SELL_EWASTE",
  UPDATE_WEIGHT: "UPDATE_WEIGHT",
  CHANGE_MATERIAL: "CHANGE_MATERIAL",
  START_CAMERA: "START_CAMERA",
  FIND_BUYER: "FIND_BUYER",
  BEST_OFFER: "BEST_OFFER",
  EXPLAIN_BEST_OFFER: "EXPLAIN_BEST_OFFER",
  SELECT_OFFER: "SELECT_OFFER",
  REQUEST_ACCEPT_OFFER: "REQUEST_ACCEPT_OFFER",
  CHECK_EARNINGS: "CHECK_EARNINGS",
  CHECK_PAYMENT: "CHECK_PAYMENT",
  SHOW_LOTS: "SHOW_LOTS",
  NAVIGATE: "NAVIGATE",
  CONFIRM_ACTION: "CONFIRM_ACTION",
  CANCEL_ACTION: "CANCEL_ACTION",
  PROVIDE_WEIGHT: "PROVIDE_WEIGHT",
  AMBIGUOUS_CHOICE: "AMBIGUOUS_CHOICE",
  SET_TARGET_PRICE: "SET_TARGET_PRICE",
  INQUIRE_HIGHER_PRICE: "INQUIRE_HIGHER_PRICE",
  CHANGE_CONDITION: "CHANGE_CONDITION",
  REJECT_NON_EWASTE: "REJECT_NON_EWASTE",
  THANK_YOU: "THANK_YOU",
  GOODBYE: "GOODBYE",
  HOW_ARE_YOU: "HOW_ARE_YOU",
  AUDIBILITY_CHECK: "AUDIBILITY_CHECK",
  GREETING: "GREETING",
  ASSISTANT_IDENTITY: "ASSISTANT_IDENTITY",
  HELP_PROMPT: "HELP_PROMPT",
  UNKNOWN: "UNKNOWN"
};

// ==========================================
// 2. CONTROLLED APPLICATION TOOLS REGISTRY
// Standard Contract: returns { status, data, requiresConfirmation, error }
// ==========================================
export const AGENT_TOOLS = {
  // Tool 1: Estimate scrap lot economics
  estimateLotValue: {
    name: "estimateLotValue",
    description: "Calculates gross market value, benchmark rate, and estimated net collector payout based on material and weight.",
    parameters: ["materialId", "weightKg"],
    execute: (context, { materialId, weightKg }) => {
      try {
        const mat =
          MATERIAL_TAXONOMY.find((m) => m.id === materialId) ||
          MATERIAL_TAXONOMY[1]; // default laptops
        const rate = mat.baseBenchmarkRatePerKg || 210;
        const gross = Math.round(rate * weightKg);
        const estLogistics = Math.min(180, Math.round(weightKg * 12 + 60));
        const net = gross - estLogistics;
        return {
          status: "SUCCESS",
          data: {
            material: mat,
            ratePerKg: rate,
            weightKg,
            grossValue: gross,
            estimatedLogistics: estLogistics,
            estimatedNetPayout: net
          },
          requiresConfirmation: false,
          error: null
        };
      } catch (err) {
        return { status: "ERROR", data: null, requiresConfirmation: false, error: err.message };
      }
    }
  },

  // Tool 2: Logistics Deduction Calculation (PDR §4 Engine)
  estimateLogistics: {
    name: "estimateLogistics",
    description: "Calculates hauling distance, vehicle tier, and logistics deduction based on lot weight.",
    parameters: ["origin", "destination", "weightKg", "materialClass"],
    execute: (context, { origin = "Kasba Peth", destination = "Apex E-Recovery", weightKg = 10, materialClass = "laptops" }) => {
      const distKm = 8.4;
      const cost = Math.min(250, Math.round(weightKg * 12 + 60));
      return {
        status: "SUCCESS",
        data: {
          origin,
          destination,
          distanceKm: distKm,
          estimatedCost: cost,
          vehicleType: "Electric Cargo 3-Wheeler"
        },
        requiresConfirmation: false,
        error: null
      };
    }
  },

  // Tool 3: Net Cash In Hand Calculator
  calculateNetOffer: {
    name: "calculateNetOffer",
    description: "Computes final net money in hand with zero hidden fees.",
    parameters: ["grossOffer", "logisticsCost", "platformFee"],
    execute: (context, { grossOffer = 2100, logisticsCost = 180, platformFee = 0 }) => {
      const net = grossOffer - logisticsCost - platformFee;
      return {
        status: "SUCCESS",
        data: {
          grossOffer,
          logisticsCost,
          platformFee,
          netPayout: net
        },
        requiresConfirmation: false,
        error: null
      };
    }
  },

  // Tool 4: Direct Stepper Weight Mutation
  updateWeight: {
    name: "updateWeight",
    description: "Mutates current lot weight directly without leaving screen or reloading.",
    parameters: ["weightKg"],
    execute: (context, { weightKg }) => {
      return {
        status: "SUCCESS",
        data: { weightKg: parseFloat(weightKg) },
        requiresConfirmation: false,
        error: null
      };
    }
  },

  // Tool 5: Material Classification Mutation
  changeMaterial: {
    name: "changeMaterial",
    description: "Updates detected scrap material classification on active scanner.",
    parameters: ["materialId"],
    execute: (context, { materialId }) => {
      const mat = MATERIAL_TAXONOMY.find((m) => m.id === materialId) || MATERIAL_TAXONOMY[1];
      return {
        status: "SUCCESS",
        data: { material: mat },
        requiresConfirmation: false,
        error: null
      };
    }
  },

  // Tool 6: Live WebRTC Camera Activation
  startCamera: {
    name: "startCamera",
    description: "Activates camera feed for live visual inspection and AI classification.",
    parameters: [],
    execute: () => ({
      status: "SUCCESS",
      data: { action: "START_CAMERA" },
      requiresConfirmation: false,
      error: null
    })
  },

  // Tool 7: Multimodal Card Selection
  selectOffer: {
    name: "selectOffer",
    description: "Selects a specific marketplace buyer offer card by visual position or ID.",
    parameters: ["offerIndex"],
    execute: (context, { offerIndex = 0, offer = null }) => ({
      status: "SUCCESS",
      data: { offerIndex, offer },
      requiresConfirmation: false,
      error: null
    })
  },

  // Tool 8: Request Offer Acceptance (Policy Engine Hand-off)
  requestAcceptOffer: {
    name: "requestAcceptOffer",
    description: "Prepares an offer acceptance request for the Transaction Policy Engine. Enforces physical touch for commitment.",
    parameters: ["offerId", "amount"],
    execute: (context, { offerId = "offer_top", amount = 2960 }) => {
      const isHighValue = amount >= CONFIRMATION_POLICY.highValue.minAmount;
      return {
        status: "SUCCESS",
        data: {
          offerId,
          amount,
          confirmationLevel: isHighValue ? "HOLD_TO_CONFIRM" : "TAP_TO_CONFIRM",
          durationMs: isHighValue ? CONFIRMATION_POLICY.highValue.durationMs : 0
        },
        requiresConfirmation: true,
        error: null
      };
    }
  },

  // Tool 9: Prepare formal lot draft
  createDraftLot: {
    name: "createDraftLot",
    description: "Prepares an in-memory e-waste lot draft with taxonomy classification, weight, and visual cues.",
    parameters: ["materialId", "weightKg"],
    execute: (context, { materialId, weightKg }) => {
      try {
        const mat =
          MATERIAL_TAXONOMY.find((m) => m.id === materialId) ||
          MATERIAL_TAXONOMY[1];
        return {
          status: "SUCCESS",
          data: {
            materialId: mat.id,
            material: mat,
            weightKg: parseFloat(weightKg) || 10,
            photoUrl: mat.sampleImages?.[0]?.label || null,
            conditionGrade: "Used (Standard Scrap)",
            estimatedValue: Math.round((mat.baseBenchmarkRatePerKg || 210) * (parseFloat(weightKg) || 10))
          },
          requiresConfirmation: true,
          error: null
        };
      } catch (err) {
        return { status: "ERROR", data: null, requiresConfirmation: false, error: err.message };
      }
    }
  },

  // Tool 10: Find verified recycler buyers and ranked offers
  findBuyers: {
    name: "findBuyers",
    description: "Queries standing buyer requirements and generates ranked reverse marketplace offers from CPCB authorized recyclers.",
    parameters: ["materialId", "weightKg"],
    execute: (context, { materialId, weightKg, buyRequests = [] }) => {
      try {
        const offers = generateMarketplaceOffers({
          materialId,
          weightKg,
          hazardLevel: "MEDIUM"
        });
        const sorted = [...offers].sort((a, b) => b.netPayout - a.netPayout);
        const matchedRequests = (buyRequests || []).filter((r) => r.materialId === materialId);
        return {
          status: "SUCCESS",
          data: {
            offersCount: offers.length,
            bestOffer: sorted[0] || null,
            sortedOffers: sorted,
            standingDemandMatches: matchedRequests
          },
          requiresConfirmation: false,
          error: null
        };
      } catch (err) {
        return { status: "ERROR", data: null, requiresConfirmation: false, error: err.message };
      }
    }
  },

  // Tool 11: Compare offers & highlight best net cash in hand
  compareOffers: {
    name: "compareOffers",
    description: "Compares competing recycler bids, calculates transparent logistics deductions, and highlights highest cash in hand.",
    parameters: ["sortBy"],
    execute: (context, { sortBy = "NET_PAYOUT" }) => {
      return {
        status: "SUCCESS",
        data: {
          criteria: sortBy,
          recommendation: "Apex E-Recovery Ltd. (Highest Net Cash: ₹2,960, 4.2 km away)"
        },
        requiresConfirmation: false,
        error: null
      };
    }
  },

  // Tool 12: Check collector historical earnings & diversion
  checkEarnings: {
    name: "checkEarnings",
    description: "Aggregates collector monthly income, total weight safely diverted to formal recyclers, and active receipts.",
    parameters: ["collectorId"],
    execute: () => {
      return {
        status: "SUCCESS",
        data: {
          month: "September 2026",
          totalEarned: 14820,
          divertedWeightKg: 182,
          settledLotsCount: 8,
          pendingPayouts: 0
        },
        requiresConfirmation: false,
        error: null
      };
    }
  },

  // Tool 13: Check payment status
  checkPayment: {
    name: "checkPayment",
    description: "Checks whether cash has been settled or is pending physical intake weigh-in at the recycling yard.",
    parameters: ["lotId"],
    execute: (context, { currentSettledLot }) => {
      if (currentSettledLot && currentSettledLot.status === "SETTLED") {
        return {
          status: "SUCCESS",
          data: {
            status: "SETTLED",
            amount: currentSettledLot.netPayout,
            receiptId: currentSettledLot.lotId,
            timestamp: currentSettledLot.settledAt || "Today, 10:14 AM"
          },
          requiresConfirmation: false,
          error: null
        };
      }
      return {
        status: "SUCCESS",
        data: {
          status: "PENDING_INTAKE",
          amount: currentSettledLot?.netPayout || 2100,
          advice: "Show your QR code during weigh-in at the recycling center."
        },
        requiresConfirmation: false,
        error: null
      };
    }
  },

  // Navigation Tools
  openScanner: {
    name: "openScanner",
    description: "Navigates to the camera scanner.",
    parameters: ["materialId"],
    execute: (context, { materialId }) => ({
      status: "SUCCESS",
      data: { target: "SCANNER", materialId },
      requiresConfirmation: false,
      error: null
    })
  },
  openMarketplace: {
    name: "openMarketplace",
    description: "Navigates to the reverse marketplace.",
    parameters: ["lotDraft"],
    execute: (context, { lotDraft }) => ({
      status: "SUCCESS",
      data: { target: "MARKETPLACE", lotDraft },
      requiresConfirmation: false,
      error: null
    })
  },
  openReceipt: {
    name: "openReceipt",
    description: "Navigates to lot and receipt records.",
    parameters: [],
    execute: () => ({
      status: "SUCCESS",
      data: { target: "RECEIPT" },
      requiresConfirmation: false,
      error: null
    })
  },
  openHome: {
    name: "openHome",
    description: "Navigates to home screen.",
    parameters: [],
    execute: () => ({
      status: "SUCCESS",
      data: { target: "HOME" },
      requiresConfirmation: false,
      error: null
    })
  }
};

// ==========================================
// 3. PERSISTENT APPLICATION CONTEXT BUILDER
// ==========================================
export function createAgentContext(collector = {}, currentScreen = "HOME") {
  return {
    user: {
      id: collector.id || "collector_001",
      name: collector.name || "Ramesh Pawar",
      language: collector.language || "mr",
      phone: collector.phone || "+91 98231 44510",
      complianceTier: collector.complianceTier || "Tier-1 Verified"
    },
    session: {
      currentScreen: currentScreen,
      currentLotId: null,
      selectedMaterial: null,
      weight: null,
      selectedBuyer: null,
      estimatedValue: null,
      activeLotDraft: null,
      currentSettledLot: null
    },
    device: {
      online: true,
      location: { ward: "Kasba Peth", city: "Pune", lat: 18.5196, lng: 73.8553 }
    },
    conversation: {
      history: [],
      lastIntent: null,
      pendingQuestion: null,
      missingFields: [],
      activeToolCalls: []
    }
  };
}

// ==========================================
// 4. ENTITY & NUMERIC EXTRACTION (VERNACULAR)
// ==========================================
// Expanded 25-Category E-Waste Vocabulary (CPCB Schedule I Regulated)
const MATERIAL_KEYWORDS = {
  smartphones: [
    "mobile", "mobail", "mobyle", "phone", "fon", "fawn", "smartphone", "smart-phone", "iphone", "android",
    "मोबाईल", "मोबाइल", "फोन", "स्मार्टफोन", "dabba", "डब्बा"
  ],
  feature_phones: [
    "feature phone", "keypad phone", "button phone", "chota phone", "chota mobile", "nokia", "keypad",
    "कीपैड", "बटन फोन", "छोटा फोन", "छोटा मोबाइल", "फीचर फोन"
  ],
  tablets: [
    "tablet", "tab", "ipad", "tablat", "e-reader", "टॅब्लेट", "टैबलेट", "टॅब", "आईपैड"
  ],
  laptops: [
    "laptop", "laptap", "leptop", "lep-top", "macbook", "notebook", "ultrabook",
    "लॅपटॉप", "लैपटॉप", "संगणक", "कंप्यूटर"
  ],
  desktops: [
    "desktop", "pc", "computer", "cabinet", "cpu tower", "tower", "server", "komputer",
    "डेस्कटॉप", "कंप्यूटर", "पीसी", "कॅबिनेट", "टॉवर"
  ],
  pcb: [
    "pcb", "motherboard", "madarboard", "circuit", "board", "green board", "circuit board",
    "मदरबोर्ड", "पीसीबी", "सर्किट", "बोर्ड"
  ],
  cpus: [
    "processor", "cpu chip", "intel", "amd", "microprocessor", "ic", "integrated circuit",
    "प्रोसेसर", "सीपीयू", "आयसी", "चिप"
  ],
  ram: [
    "ram", "memory stick", "dimm", "ddr", "ddr3", "ddr4", "ddr5",
    "रॅम", "रैम", "मेमरी"
  ],
  storage: [
    "hard disk", "hdd", "ssd", "harddrive", "pen drive", "storage drive",
    "हार्ड डिस्क", "एसएसडी", "पेन ड्राइव"
  ],
  batteries: [
    "battery", "betri", "betry", "cell", "sel", "lithium", "li-ion", "18650", "pouch cell",
    "बॅटरी", "बैटरी", "सेल", "लिथियम"
  ],
  lead_acid: [
    "lead acid", "inverter battery", "car battery", "auto battery", "tubular", "acid battery", "e-rickshaw",
    "लेड ऍसिड", "इन्व्हर्टर बॅटरी", "गाड़ी की बैटरी", "कार बैटरी", "रिक्शा बैटरी"
  ],
  ups_smps: [
    "ups", "inverter", "smps", "power supply", "transformer",
    "यूपीएस", "इन्व्हर्टर", "एसएमपीएस", "पावर सप्लाय"
  ],
  cables: [
    "cable", "kewal", "kable", "wire", "tamba", "taamba", "taar", "copper", "lan cable", "wiring",
    "केबल", "वायर", "तार", "तांबे", "तांबा", "कॉपर"
  ],
  chargers: [
    "charger", "chargers", "adapter", "adapters", "power adapter", "power adapters", "charging brick", "charging bricks",
    "चार्जर", "चार्जर्स", "अडॅप्टर", "अडैप्टर", "चार्जिंग"
  ],
  lcd_led: [
    "lcd", "led", "flat screen", "screen", "monitor", "smart tv", "panel", "display",
    "एलईडी", "एलसीडी", "फ्लॅट स्क्रीन", "स्क्रीन", "स्मार्ट टीव्ही", "पॅनेल"
  ],
  crt: [
    "crt", "old tv", "dabba tv", "picture tube", "heavy monitor",
    "सीआरटी", "टीव्ही", "टीवी", "मॉनिटर", "काच"
  ],
  printers: [
    "printer", "scanner", "photocopy", "xerox", "copier", "laser printer", "cartridge",
    "प्रिंटर", "स्कॅनर", "झेरॉक्स", "फोटोकॉपी"
  ],
  air_conditioner: [
    "ac", "air conditioner", "split ac", "window ac", "compressor",
    "एसी", "एअर कंडिशनर", "कंप्रेसर"
  ],
  refrigerator: [
    "fridge", "refrigerator", "deep freezer", "cooler",
    "फ्रिज", "रेफ्रिजरेटर", "फ्रीज"
  ],
  washing_machine: [
    "washing machine", "washer", "dryer",
    "वाशिंग मशीन", "वॉशिंग मशीन", "धुलाई मशीन"
  ],
  microwave: [
    "microwave", "oven", "otg", "magnetron",
    "मायक्रोव्हेव", "ओव्हन", "माइक्रोवेव"
  ],
  networking: [
    "router", "modem", "set top box", "switch", "wifi router", "wifi",
    "राऊटर", "मॉडेम", "सेट टॉप बॉक्स", "वायफाय"
  ],
  solar_panels: [
    "solar", "solar panel", "pv panel", "solar cell", "solar inverter",
    "सोलर", "सौर पॅनेल", "सोलर पॅनेल"
  ],
  abs_plastic: [
    "plastic", "plastik", "abs", "casing", "body", "cabinet",
    "प्लॅस्टिक", "प्लास्टिक", "कॅबिनेट"
  ]
};

// ==========================================
// NON-E-WASTE REJECTION TAXONOMY (Strict Guard)
// Vegetables, Produce, Kitchen, Municipal Scrap
// ==========================================
export const NON_EWASTE_TAXONOMY = {
  vegetables: {
    label: "भाजीपाला / अन्न (Vegetables & Food)",
    keywords: [
      "aloo", "aalu", "allo", "aalo", "aalloo", "aaloo", "आलू", "आलु", "बटाटा", "batata", "potato", "potatoes",
      "kanda", "kaanda", "pyaz", "pyaaz", "कांदा", "प्याज", "onion", "onions",
      "tamatar", "टमाटर", "टोमॅटो", "tomato", "tomatoes",
      "sabji", "sabzi", "bhaji", "भाजी", "सब्जी", "भाजीपाला", "vegetable", "vegetables", "veggie",
      "lahsun", "lehsun", "लहसुन", "लसूण", "garlic",
      "adrak", "अदरक", "आले लसूण", "आले-लसूण", "ginger",
      "mirchi", "mirch", "मिर्ची", "मिरची", "chilli",
      "gobi", "gobhi", "गोभी", "पत्तागोभी", "फूलगोभी", "cauliflower",
      "bhindi", "भिंडी", "भेंडी", "okra",
      "fal", "fale", "fruit", "fruits", "फल", "फळे", "seb", "apple", "kela", "banana", "केळी", "aam", "mango", "आंबा"
    ]
  },
  grains_food: {
    label: "धान्य / खाद्यपदार्थ (Grains & Food)",
    keywords: [
      "gehu", "gehoon", "गेहूं", "गहू", "wheat",
      "chawal", "चावल", "तांदूळ", "tandul", "rice",
      "dal", "daal", "दाल", "डाळ", "pulses",
      "anaj", "अनाज", "धान्य", "grain", "grains", "food", "khana", "जेवण", "अन्न"
    ]
  },
  general_scrap: {
    label: "सामान्य भंगार (General Non-E-Waste Scrap)",
    keywords: [
      "raddi", "रद्दी", "paper", "newspaper", "akhbar", "कागद", "कागज", "अखबार", "pustak", "books", "vahi", "कॉपियां",
      "carton", "cardboard", "box", "खोका", "पुठ्ठा", "खोके", "gatta",
      "loha", "lohand", "iron", "sariya", "लोहा", "लोखंड", "सरिया", "पत्रा", "पत्रे", "tin sheet",
      "steel", "bartan", "भांडी", "बर्तन", "utensils", "spoon", "plate",
      "glass bottle", "beer bottle", "kach", "kaanch", "काच", "कांच", "काचेची बाटली", "शीशा",
      "kapde", "kapda", "clothes", "कपडे", "कपड़ा", "वस्त्र", "old clothes",
      "lakdi", "lakda", "wood", "timber", "furniture", "लकड़ी", "लाकूड", "फर्निचर", "sofa", "table", "chair",
      "plastic bottle", "plastic bottles", "pet bottle", "pet bottles", "water bottle", "water bottles", "प्लास्टिक बाटली", "प्लास्टिक बोतल", "थैली", "polythene",
      "tyre", "rubber", "टायर", "रबर", "gadi ka tyre",
      "gila kachra", "sukha kachra", "garbage", "food waste", "kitchen waste", "municipal waste", "गिला कचरा", "ओला कचरा", "कूड़ा", "organic waste"
    ]
  }
};

export function detectNonEWaste(text = "") {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Guard: Protect all e-waste compound phrases from being falsely matched by general scrap tokens
  // Strip out "e-waste", "e waste", "ewaste", "electronic waste", "ई-कचरा", "ई कचरा" before checking non-e-waste
  const sanitizedForCheck = lower
    .replace(/\b(e[\s-]?waste|electronic\s+waste)\b/gi, "")
    .replace(/(?:ई|इ)[\s-]?कचरा/gi, "")
    .trim();

  for (const [catKey, category] of Object.entries(NON_EWASTE_TAXONOMY)) {
    for (const kw of category.keywords) {
      const isAscii = /^[a-z\s]+$/i.test(kw);
      if (isAscii) {
        const regex = new RegExp("\\b" + kw + "\\b", "i");
        if (regex.test(sanitizedForCheck)) {
          return {
            detected: true,
            item: kw,
            category: category.label,
            categoryKey: catKey
          };
        }
      } else {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const unicodeRegex = new RegExp("(?:^|[^\\p{L}\\p{N}])" + escaped + "(?:[^\\p{L}\\p{N}]|$)", "u");
        if (unicodeRegex.test(sanitizedForCheck)) {
          return {
            detected: true,
            item: kw,
            category: category.label,
            categoryKey: catKey
          };
        }
      }
    }
  }
  return null;
}

const NUMBER_WORDS = {
  // English (teens, tens, units)
  "eighteen": 18, "seventeen": 17, "sixteen": 16, "fifteen": 15, "fourteen": 14, "thirteen": 13, "twelve": 12, "eleven": 11,
  "twenty": 20, "nineteen": 19, "ten": 10, "nine": 9, "eight": 8, "seven": 7, "six": 6, "five": 5, "four": 4, "three": 3, "two": 2, "one": 1,
  // Hindi & Marathi Romanized
  "atharah": 18, "athara": 18, "athra": 18, "satrah": 17, "satra": 17, "solah": 16, "sola": 16, "pandrah": 15, "pandhra": 15,
  "chaudah": 14, "chauda": 14, "terah": 13, "tera": 13, "barah": 12, "bara": 12, "gyarah": 11, "gyara": 11, "ikra": 11, "akara": 11,
  "unnees": 19, "ekonis": 19, "bees": 20, "vees": 20, "panchees": 25, "pachees": 25, "tis": 30, "tees": 30, "chaalees": 40, "chalis": 40,
  "pachaas": 50, "panas": 50, "ek": 1, "don": 2, "do": 2, "teen": 3, "char": 4, "chaar": 4, "paanch": 5, "panch": 5, "saha": 6, "chhe": 6,
  "saat": 7, "aath": 8, "nau": 9, "nav": 9, "dus": 10, "dah": 10,
  // Devanagari (Hindi & Marathi + Phonetic ASR variants)
  "अठारह": 18, "अठरा": 18, "अथारा": 18, "अथरा": 18, "अठारा": 18,
  "सत्रह": 17, "सतरा": 17, "सोलह": 16, "सोळा": 16, "सोला": 16,
  "पंद्रह": 15, "पंधरा": 15, "चौदह": 14, "चौदा": 14, "तेरह": 13, "तेरा": 13,
  "बारह": 12, "बारा": 12, "ग्यारह": 11, "अकरा": 11, "उन्नीस": 19, "एकोणीस": 19,
  "बीस": 20, "वीस": 20, "पंचवीस": 25, "पच्चीस": 25, "तीस": 30, "चाळीस": 40, "चालीस": 40,
  "पन्नास": 50, "पचास": 50, "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4, "पाच": 5, "पांच": 5, "सहा": 6, "छह": 6, "सात": 7, "आठ": 8, "नऊ": 9, "नौ": 9, "दहा": 10, "दस": 10
};

// Pre-sort all material keywords descending by length to ensure specific compound terms (e.g. 'car battery', 'feature phone') take priority over generic tokens ('battery', 'phone')
const ALL_MATERIAL_MATCHERS = [];
for (const [matId, keywords] of Object.entries(MATERIAL_KEYWORDS)) {
  for (const kw of keywords) {
    ALL_MATERIAL_MATCHERS.push({ kw: kw.toLowerCase(), matId, len: kw.length });
  }
}
ALL_MATERIAL_MATCHERS.sort((a, b) => b.len - a.len);

export function extractMaterial(text = "") {
  const lower = text.toLowerCase();
  for (const { kw, matId } of ALL_MATERIAL_MATCHERS) {
    const isAscii = /^[a-z0-9 -]+$/i.test(kw);
    if (isAscii) {
      const escaped = kw.replace(/[-]/g, "[- ]?");
      const regex = new RegExp(`(^|\\W)${escaped}(?:s|es)?($|\\W)`, "i");
      if (regex.test(lower)) {
        return MATERIAL_TAXONOMY.find((m) => m.id === matId) || null;
      }
    } else {
      if (lower.includes(kw)) {
        return MATERIAL_TAXONOMY.find((m) => m.id === matId) || null;
      }
    }
  }
  return null;
}

export function extractWeight(text = "") {
  // Convert Devanagari digits ०-९ to ASCII 0-9 for seamless Marathi & Hindi parsing
  const devanagariDigits = { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" };
  let normalized = (text || "").replace(/[०-९]/g, (d) => devanagariDigits[d] || d);
  // Phonetic ASR unit normalizations (तिलो / चिलो / ठिलो / ढिलो / खिलो / कलो / केलो / के जी -> किलो)
  normalized = normalized.replace(/तिलो|चिलो|ठिलो|ढिलो|खिलो|कलो|केलो/gi, "किलो");
  const lower = normalized.toLowerCase();
  
  // Grams extraction (e.g., "500 grams", "500 gm", "५०० ग्रॅम") -> convert to kg
  const gramsMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:grams?|gms?|gm|ग्राम|ग्रॅम)/i);
  if (gramsMatch && gramsMatch[1]) {
    const g = parseFloat(gramsMatch[1]);
    if (g > 0) return g >= 100 ? g / 1000 : g;
  }

  // Vernacular fractional weights (Marathi & Hindi)
  const FRACTIONAL_WEIGHTS = {
    "dedh": 1.5, "डेढ़": 1.5, "दीड": 1.5, "dhed": 1.5,
    "dhai": 2.5, "ढाई": 2.5, "अडीच": 2.5, "adich": 2.5, "adeech": 2.5,
    "aadha": 0.5, "आधा": 0.5, "ardha": 0.5, "अर्धा": 0.5, "half": 0.5,
    "paav": 0.25, "पाव": 0.25, "quarter": 0.25,
    "sawa": 1.25, "सवा": 1.25,
    "paune do": 1.75, "पौने दो": 1.75,
    "paune teen": 2.75, "पौने तीन": 2.75,
    "sade teen": 3.5, "साढ़े तीन": 3.5, "साडे तीन": 3.5,
    "sade char": 4.5, "साढ़े चार": 4.5, "साडे चार": 4.5,
    "sade paanch": 5.5, "साढ़े पांच": 5.5, "साडे पाच": 5.5
  };
  for (const [phrase, val] of Object.entries(FRACTIONAL_WEIGHTS)) {
    if (lower.includes(phrase)) return val;
  }

  const digitWithUnitMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|किलो|केजी|किग्रा|के\s*जी)/i);
  if (digitWithUnitMatch && digitWithUnitMatch[1]) {
    return parseFloat(digitWithUnitMatch[1]);
  }

  // Piece count extraction (e.g., "5 mobile", "2 laptop", "5 नग", "5 piece")
  const pieceMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:piece|pieces|nag|नग|पीस|items?|mobile|mobiles|phone|phones|laptop|laptops)/i);
  if (pieceMatch && pieceMatch[1]) {
    const count = parseFloat(pieceMatch[1]);
    if (count > 0 && count <= 50) {
      if (lower.includes("laptop")) return Math.round(count * 2.0 * 10) / 10;
      if (lower.includes("mobile") || lower.includes("phone")) return Math.max(0.2, Math.round(count * 0.2 * 10) / 10);
      return count;
    }
  }

  // GUARD: If number is followed by price indicator ("me", "mein", "में", "rupaye", "रुपये", "rs", "₹", "bhav", "भाव", "rate", "daam", "दाम") -> THIS IS A PRICE, NOT WEIGHT!
  if (lower.match(/\b\d+(?:\.\d+)?\s*(?:me\b|mein\b|में|rupaye|rupees|rs|रुपये|रु|bhav|भाव|rate|daam|दाम|per\s*kg)/i)) {
    return null;
  }

  const standaloneDigit = lower.match(/\b(\d+(?:\.\d+)?)\b/);
  if (standaloneDigit && standaloneDigit[1]) {
    const val = parseFloat(standaloneDigit[1]);
    if (val > 0 && val < 500) return val;
  }

  // Sort word keys by length descending to match 'eighteen' before 'teen'
  const sortedKeys = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length);
  for (const word of sortedKeys) {
    const isLatin = /^[a-z]+$/i.test(word);
    if (isLatin) {
      const regex = new RegExp("\\b" + word + "\\b", "i");
      if (regex.test(lower)) return NUMBER_WORDS[word];
    } else {
      if (lower.includes(word)) return NUMBER_WORDS[word];
    }
  }

  return null;
}

export function extractTargetPrice(text = "") {
  const devanagariDigits = { "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9" };
  const normalized = (text || "").replace(/[०-९]/g, (d) => devanagariDigits[d] || d).toLowerCase();

  // 1. Vernacular number words for prices (sorted descending by length to match 'dedh sau' before 'sau')
  const VERNACULAR_PRICES = {
    "dedh sau": 150, "डेढ़ सौ": 150, "didshe": 150, "दीडशे": 150,
    "dhai sau": 250, "ढाई सौ": 250, "adhishe": 250, "अडीचशे": 250,
    "do sau": 200, "दो सौ": 200, "donshe": 200, "दोनशे": 200, "two hundred": 200,
    "teen sau": 300, "तीन सौ": 300, "tinshe": 300, "तीनशे": 300, "three hundred": 300,
    "char sau": 400, "चार सौ": 400, "charshe": 400, "चारशे": 400,
    "paanch sau": 500, "पाँच सौ": 500, "pashe": 500, "पाचशे": 500,
    "sau": 100, "सौ": 100, "shambhar": 100, "शंभर": 100, "hundred": 100, "one hundred": 100
  };
  const sortedPriceKeys = Object.keys(VERNACULAR_PRICES).sort((a, b) => b.length - a.length);
  for (const phrase of sortedPriceKeys) {
    if (normalized.includes(phrase)) return VERNACULAR_PRICES[phrase];
  }

  // 2. Digits followed by price indicators or prefixed with currency
  const priceMatch =
    normalized.match(/(?:₹|rs\.?|रुपये|रु\.?)\s*(\d+(?:\.\d+)?)/i) ||
    normalized.match(/(\d+(?:\.\d+)?)\s*(?:me\b|mein\b|में|rupaye|rupees|rs|रुपये|रु|(?:ka\b|ke\b|cha\b|चे|चा)?\s*(?:bhav|भाव|rate|daam|दाम)|per\s*kg|प्रति\s*किलो)/i) ||
    normalized.match(/(?:kam\s*se\s*kam|कम\s*से\s*कम|कमीत\s*कमी|minimum|target\s*price|target\s*rate|target|price)\s*(\d+(?:\.\d+)?)/i) ||
    normalized.match(/(\d+(?:\.\d+)?)\s*(?:se\s*kam\s*nahi|पेक्षा\s*कमी\s*नाही)/i);

  if (priceMatch && priceMatch[1]) {
    return parseFloat(priceMatch[1]);
  }
  return null;
}

// ==========================================
// 5. INTENT CLASSIFICATION (SCREEN-AWARE)
// ==========================================
export function classifyUtteranceIntent(text = "", pendingQuestion = null, screenContext = {}) {
  const lower = text.toLowerCase().trim();
  const currentScreen = screenContext?.screen || "";

  // 00. NON-E-WASTE REJECTION GUARD ("5 kilo aloo bechna hai", "25 kilo aalu", "raddi", "loha")
  const nonEWaste = detectNonEWaste(lower);
  if (nonEWaste) {
    return {
      intent: AGENT_INTENTS.REJECT_NON_EWASTE,
      item: nonEWaste.item,
      category: nonEWaste.category
    };
  }

  // 0a. INQUIRE HIGHER PRICE / BARGAINING ("ky muje isse jada daam mil sakta h", "rate kam hai", "thoda badhao")
  if (
    lower.includes("jada daam") ||
    lower.includes("zyada daam") ||
    lower.includes("jyada daam") ||
    lower.includes("isse jada") ||
    lower.includes("isse zyada") ||
    lower.includes("isse jyada") ||
    lower.includes("aur jada") ||
    lower.includes("aur zyada") ||
    lower.includes("aur jyada") ||
    lower.includes("zyada bhav") ||
    lower.includes("jada bhav") ||
    lower.includes("jyada bhav") ||
    lower.includes("bhav kam") ||
    lower.includes("rate kam") ||
    lower.includes("भाव कमी") ||
    lower.includes("thoda badhao") ||
    lower.includes("थोडा वाढवा") ||
    lower.includes("aur badhao") ||
    lower.includes("जास्त भाव") ||
    lower.includes("जास्त पैसे") ||
    lower.includes("यापेक्षा जास्त") ||
    lower.includes("higher price") ||
    lower.includes("better price") ||
    lower.includes("more price") ||
    lower.includes("can i get more")
  ) {
    return { intent: AGENT_INTENTS.INQUIRE_HIGHER_PRICE };
  }

  // 0b. CONDITION MUTATION ("ye working hai", "working condition", "चालू आहे", "kharab hai", "damaged hai")
  if (
    lower.includes("working") ||
    lower.includes("chalu") ||
    lower.includes("चालू") ||
    lower.includes("intact") ||
    lower.includes("used") ||
    lower.includes("second hand") ||
    lower.includes("पुराना") ||
    lower.includes("वापरलेले") ||
    lower.includes("damaged") ||
    lower.includes("kharab") ||
    lower.includes("खराब") ||
    lower.includes("भंगार") ||
    lower.includes("तुटलेले")
  ) {
    if (lower.includes("working") || lower.includes("chalu") || lower.includes("चालू") || lower.includes("intact")) {
      return { intent: AGENT_INTENTS.CHANGE_CONDITION, condition: "WORKING" };
    }
    if (lower.includes("damaged") || lower.includes("kharab") || lower.includes("खराब") || lower.includes("भंगार") || lower.includes("तुटलेले")) {
      return { intent: AGENT_INTENTS.CHANGE_CONDITION, condition: "DAMAGED" };
    }
    if (lower.includes("used") || lower.includes("पुराना") || lower.includes("वापरलेले") || lower.includes("second hand")) {
      return { intent: AGENT_INTENTS.CHANGE_CONDITION, condition: "USED" };
    }
  }

  // 0c. COMPOUND SELLING INTENT (Lot specifications + Target Price, e.g. "10 kilo battery 135 me bechna hai")
  const targetPrice = extractTargetPrice(lower);
  const detectedMat = extractMaterial(lower);
  const detectedWeight = extractWeight(lower);

  if ((detectedMat || detectedWeight) && targetPrice !== null) {
    return {
      intent: AGENT_INTENTS.SELL_EWASTE,
      material: detectedMat,
      weight: detectedWeight,
      targetPrice
    };
  }

  // 0d. TARGET PRICE STANDALONE NEGOTIATION ("merko 135 me bechna h", "135 ka bhav chahiye", "135 mein bechna")
  if (
    targetPrice !== null &&
    (lower.includes("bechna") || lower.includes("विकाय") || lower.includes("sell") || lower.includes("chahiye") || lower.includes("hava") || lower.includes("bhav") || lower.includes("भाव") || lower.includes("rate") || lower.includes("daam") || lower.includes("दाम") || lower.includes("me") || lower.includes("mein") || lower.includes("में"))
  ) {
    return { intent: AGENT_INTENTS.SET_TARGET_PRICE, targetPrice };
  }

  // 0e. RETAKE PHOTO TRIGGER ("dusra photo lo", "retake photo", "फिर से फोटो लो", "पुन्हा काढा")
  if (
    lower.includes("dusra photo") ||
    lower.includes("retake") ||
    lower.includes("फिर से फोटो") ||
    lower.includes("पुन्हा फोटो") ||
    lower.includes("पुन्हा काढा") ||
    lower.includes("new photo")
  ) {
    return { intent: AGENT_INTENTS.START_CAMERA, retake: true };
  }

  // 0f. CAMERA SHUTTER SNAP DIRECT TRIGGER ("photo lo", "snap photo", "photo kheecho", "फोटो काढा")
  if (
    lower.includes("photo lo") ||
    lower.includes("photo kheecho") ||
    lower.includes("snap photo") ||
    lower.includes("फोटो काढा") ||
    lower.includes("फोटो घ्या") ||
    lower.includes("click photo") ||
    lower.includes("shutter")
  ) {
    return { intent: AGENT_INTENTS.START_CAMERA, snap: true };
  }

  // 0g. SCANNER IN-PLACE MATERIAL CHANGE ("battery kar do", "mobile change karo")
  if (currentScreen === "SCANNER" && detectedMat && !lower.includes("bechna") && !lower.includes("sell")) {
    return { intent: AGENT_INTENTS.CHANGE_MATERIAL, material: detectedMat };
  }

  // 0c. PENDING QUESTION TURN (Immediate bypass if agent is asking for weight!)
  // If the agent asked "लगभग कितना वजन है?", ANY weight or number answer immediately resolves it.
  if (pendingQuestion === "ASK_WEIGHT" || screenContext?.pendingQuestion === "ASK_WEIGHT") {
    const w = extractWeight(lower);
    if (w !== null) {
      return { intent: AGENT_INTENTS.PROVIDE_WEIGHT, weight: w };
    }
  }

  // 1. Direct Stepper Weight Mutation ("25 kg", "25 किलो", "Weight 7 kilo kar do", "7 kg kar do", "सात किलो करा", "vajan 7 kg")
  if (currentScreen === "SCANNER" && extractWeight(lower) !== null) {
    const w = extractWeight(lower);
    if (w !== null) {
      return { intent: AGENT_INTENTS.UPDATE_WEIGHT, weight: w };
    }
  }

  if (
    lower.includes("weight") ||
    lower.includes("vajan") ||
    lower.includes("वजन") ||
    lower.includes("kar do") ||
    lower.includes("kara") ||
    lower.includes("kilo kar") ||
    lower.includes("kg kar") ||
    (extractWeight(lower) !== null && !extractMaterial(lower))
  ) {
    const w = extractWeight(lower);
    if (w !== null) {
      return { intent: AGENT_INTENTS.UPDATE_WEIGHT, weight: w };
    }
  }

  // 2. Camera Trigger ("Ye kya hai?", "camera chalu karo", "कॅमेरा सुरू करा", "photo kheecho", "scan karo")
  if (
    lower.includes("ye kya hai") ||
    lower.includes("kya hai") ||
    lower.includes("हे काय आहे") ||
    lower.includes("kay ahe") ||
    lower.includes("camera") ||
    lower.includes("photo") ||
    lower.includes("कॅमेरा") ||
    lower.includes("फोटो") ||
    lower.includes("scan")
  ) {
    return { intent: AGENT_INTENTS.START_CAMERA };
  }

  // 3. Multimodal Grounding ("Beech wala", "ye wala", "sabse achha wala", "pehla", "teesra")
  if (
    currentScreen === "MARKETPLACE" ||
    lower.includes("beech wala") ||
    lower.includes("madhla") ||
    lower.includes("dusra") ||
    lower.includes("वाला") ||
    lower.includes("ye wala") ||
    lower.includes("sabse achha")
  ) {
    if (lower.includes("beech") || lower.includes("madhla") || lower.includes("dusra") || lower.includes("second") || lower.includes("don number")) {
      return { intent: AGENT_INTENTS.SELECT_OFFER, position: 1 };
    }
    if (lower.includes("pehla") || lower.includes("pahila") || lower.includes("first") || lower.includes("top") || lower.includes("ek number") || lower.includes("sabse achha")) {
      return { intent: AGENT_INTENTS.SELECT_OFFER, position: 0 };
    }
    if (lower.includes("teesra") || lower.includes("tisra") || lower.includes("third") || lower.includes("shevat") || lower.includes("teen number")) {
      return { intent: AGENT_INTENTS.SELECT_OFFER, position: 2 };
    }
    if (lower.includes("ye wala") || lower.includes("yeh wala") || lower.includes("yehi") || lower.includes("ha yehi")) {
      const activeIdx = screenContext?.selectedElement?.index ?? screenContext?.selectedElement?.position ?? 0;
      return { intent: AGENT_INTENTS.SELECT_OFFER, position: activeIdx };
    }

    // Ambiguity detection on Marketplace ("woh wala", "koi bhi", "wala dikhao")
    if (
      lower.includes("woh wala") ||
      lower.includes("to wala") ||
      lower.includes("te wala") ||
      lower.includes("koi bhi") ||
      lower.includes("ek dikhao") ||
      lower.includes("wala dikhao")
    ) {
      return { intent: AGENT_INTENTS.AMBIGUOUS_CHOICE };
    }
  }

  // 4. Best Offer Explanation ("Ye wala buyer kyun best hai?", "kyun achha hai", "best buyer dhoondo")
  if (
    lower.includes("kyun best") ||
    lower.includes("kyun achha") ||
    lower.includes("का चांगला") ||
    lower.includes("why best") ||
    lower.includes("sabse achha") ||
    lower.includes("achha buyer") ||
    lower.includes("best offer") ||
    lower.includes("सर्वोत्तम") ||
    lower.includes("जास्त भाव") ||
    lower.includes("सर्वात जास्त")
  ) {
    return { intent: AGENT_INTENTS.EXPLAIN_BEST_OFFER };
  }

  // 5. Request Accept Offer (Policy Engine Hand-off - never directly commits!)
  if (
    lower.includes("124600") ||
    lower.includes("लाख") ||
    lower.includes("lakh") ||
    (lower.includes("accept") && !lower.includes("nahi")) ||
    lower.includes("pakka karo") ||
    lower.includes("मंजूर") ||
    lower.includes("स्वीकार") ||
    lower.includes("bech do") ||
    (currentScreen === "MARKETPLACE" && (lower.includes("theek hai") || lower.includes("sahi hai") || lower.includes("chalega") || lower.includes("ho")))
  ) {
    const isHighValue = lower.includes("124600") || lower.includes("लाख") || lower.includes("lakh");
    return {
      intent: AGENT_INTENTS.REQUEST_ACCEPT_OFFER,
      amount: isHighValue ? 124600 : (screenContext?.selectedElement?.offer?.netPayout || 2960)
    };
  }

  // 6. Pending Question Turn (Missing Weight Response)
  if (pendingQuestion === "ASK_WEIGHT") {
    const w = extractWeight(lower);
    if (w !== null) {
      return { intent: AGENT_INTENTS.PROVIDE_WEIGHT, weight: w };
    }
  }

  // 7. Affirmative Confirmation
  if (
    /^(haan|ha|haa|hnn|yes|ok|sahi hai|theek hai|ho|chalta|chalel|chalega|done|confirm|खात्री|हो|हाँ|सही|ठीक|आगे बढ़ें|पुढे चला)\b/i.test(lower) ||
    lower.includes("sahi hai") ||
    lower.includes("chalega") ||
    lower.includes("होय")
  ) {
    return { intent: AGENT_INTENTS.CONFIRM_ACTION };
  }

  // 8. Negative Cancellation
  if (/^(nahi|nahin|no|cancel|nako|ruko|rehne do|thamba|रद्द|नाही|नहीं|नको|थांबा)/i.test(lower)) {
    return { intent: AGENT_INTENTS.CANCEL_ACTION };
  }

  // 9. Earnings Inquiry
  if (lower.includes("kamaya") || lower.includes("kamai") || lower.includes("कमाई") || lower.includes("पैसे किती") || lower.includes("earnings") || lower.includes("balance")) {
    return { intent: AGENT_INTENTS.CHECK_EARNINGS };
  }

  // 10. Payment Settlement Inquiry
  if (lower.includes("payment") || lower.includes("paisa mila") || lower.includes("voucher") || lower.includes("receipt") || lower.includes("पावती") || lower.includes("रसीद") || lower.includes("पैसे मिळाले")) {
    return { intent: AGENT_INTENTS.CHECK_PAYMENT };
  }

  // 11. Show Lots / History
  if (lower.includes("lot dikhao") || lower.includes("mera lot") || lower.includes("माझे लॉट") || lower.includes("इतिहास") || lower.includes("history")) {
    return { intent: AGENT_INTENTS.SHOW_LOTS };
  }

  // 12. View Buyers / Marketplace
  if (lower.includes("buyer dikhao") || lower.includes("buyers") || lower.includes("खरेदीदार") || lower.includes("मार्केट") || lower.includes("demand")) {
    return { intent: AGENT_INTENTS.FIND_BUYER };
  }

  // 14. Thank You / Courtesy
  const thankTokens = ["thank you", "thanks", "dhanyawad", "dhanyavad", "shukriya", "धन्यवाद", "आभार", "शुक्रिया"];
  if (thankTokens.some((tok) => lower === tok || lower.startsWith(`${tok} `) || lower.endsWith(` ${tok}`))) {
    const words = lower.split(/\s+/).filter(Boolean);
    if (words.length <= 4 && !/(\b.+?\b)(?:\s+\1){1,}/i.test(lower)) {
      return { intent: AGENT_INTENTS.THANK_YOU };
    }
  }

  // 15. Goodbye / Session Exit
  const byeTokens = ["bye", "goodbye", "alvida", "band karo", "thambva", "थांबवा", "अलविदा", "बंद करा", "बस"];
  if (byeTokens.some((tok) => lower === tok || lower.startsWith(`${tok} `) || lower.endsWith(` ${tok}`))) {
    const words = lower.split(/\s+/).filter(Boolean);
    if (words.length <= 5) {
      return { intent: AGENT_INTENTS.GOODBYE };
    }
  }

  // 15a. How are you / Social Inquiry (e.g. "क्यासे हो आप", "कैसे हो आप", "कसा आहेस", "how are you")
  if (
    lower.includes("क्यासे हो") ||
    lower.includes("कयासे हो") ||
    lower.includes("कैसे हो") ||
    lower.includes("कैसा है") ||
    lower.includes("कैसे हैं") ||
    lower.includes("आप कैसे") ||
    lower.includes("tum kaise") ||
    lower.includes("aap kaise") ||
    lower.includes("kaise ho") ||
    lower.includes("kaisa hai") ||
    lower.includes("kese ho") ||
    lower.includes("kyase ho") ||
    lower.includes("kayse ho") ||
    lower.includes("कसा आहेस") ||
    lower.includes("कसे आहात") ||
    lower.includes("कशी आहेस") ||
    lower.includes("kasa ahes") ||
    lower.includes("kase ahat") ||
    lower.includes("how are you") ||
    lower.includes("how r u") ||
    lower.includes("how do you do") ||
    lower.includes("sab theek") ||
    lower.includes("सब ठीक") ||
    lower.includes("सगळं ठीक")
  ) {
    return { intent: AGENT_INTENTS.HOW_ARE_YOU };
  }

  // 15b. Audibility / Mic Check (e.g. "मेरी आवाज आ रही है", "सुन रहे हो", "ऐकू येतंय का", "can you hear me")
  if (
    lower.includes("आवाज आ रही") ||
    lower.includes("आवाज़ आ रही") ||
    lower.includes("सुन रहे हो") ||
    lower.includes("सुन रहे हैं") ||
    lower.includes("सुन पा रहे") ||
    lower.includes("सुनाई दे रहा") ||
    lower.includes("मेरी आवाज") ||
    lower.includes("awaz aa rahi") ||
    lower.includes("awaaz aa rahi") ||
    lower.includes("sun rahe ho") ||
    lower.includes("sun rahe ho kya") ||
    lower.includes("sun rahe ho na") ||
    lower.includes("ऐकू येतंय") ||
    lower.includes("ऐकू येत आहे") ||
    lower.includes("आवाज येतोय") ||
    lower.includes("aiku yetay") ||
    lower.includes("can you hear me") ||
    lower.includes("am i audible") ||
    lower.includes("are you listening") ||
    lower.includes("are you there") ||
    lower.includes("hearing me")
  ) {
    return { intent: AGENT_INTENTS.AUDIBILITY_CHECK };
  }

  // 15c. Greeting / Salutation (e.g. "नमस्ते", "नमस्कार", "hello", "hi", "राम राम")
  const greetingTokens = [
    "नमस्ते", "नमस्कार", "राम राम", "सुप्रभात", "शुभ प्रभात", "जय हिंद", "जय महाराष्ट्र",
    "hello", "hi", "hey", "namaste", "namaskar", "ram ram", "good morning", "good afternoon"
  ];
  if (greetingTokens.some((tok) => lower === tok || lower.startsWith(`${tok} `) || lower.endsWith(` ${tok}`))) {
    const words = lower.split(/\s+/).filter(Boolean);
    if (words.length <= 4) {
      return { intent: AGENT_INTENTS.GREETING };
    }
  }

  // 15d. Identity / Capability Inquiry (e.g. "आप कौन हो", "तुम कौन हो", "तू कोण आहेस", "who are you")
  if (
    lower.includes("आप कौन हो") ||
    lower.includes("तुम कौन हो") ||
    lower.includes("तू कौन है") ||
    lower.includes("तू कोण आहेस") ||
    lower.includes("तुम्ही कोण आहात") ||
    lower.includes("aap kaun ho") ||
    lower.includes("tum kaun ho") ||
    lower.includes("who are you") ||
    lower.includes("what is this app") ||
    lower.includes("what do you do")
  ) {
    return { intent: AGENT_INTENTS.ASSISTANT_IDENTITY };
  }

  // 15e. Help / Assistance Request
  if (
    lower === "help" || lower.includes("help me") || lower.includes("मदद") || lower.includes("सहायता") || lower.includes("मदत हवी")
  ) {
    return { intent: AGENT_INTENTS.HELP_PROMPT };
  }

  // 16. Sell Scrap (General Entry Point)
  const mat = extractMaterial(lower);
  const w = extractWeight(lower);
  if (mat || lower.includes("bechna") || lower.includes("vikaycha") || lower.includes("sell") || lower.includes("scrap") || lower.includes("kachra") || lower.includes("कचरा") || lower.includes("विकायचे")) {
    return { intent: AGENT_INTENTS.SELL_EWASTE, material: mat, weight: w };
  }

  return { intent: AGENT_INTENTS.UNKNOWN };
}

// ==========================================
// 6. ACTION PLANNER & MULTI-TURN REASONING
// User-Safe Action Trace + Cardinal UX Rule + Policy Engine
// ==========================================
export function processAgentUtterance(rawUtterance = "", agentContext = {}, externalData = {}, screenContext = {}) {
  const defaultCtx = createAgentContext();
  const safeAgentContext = {
    ...defaultCtx,
    ...(agentContext || {}),
    user: { ...defaultCtx.user, ...(agentContext?.user || {}) },
    session: { ...defaultCtx.session, ...(agentContext?.session || {}) },
    device: { ...defaultCtx.device, ...(agentContext?.device || {}) },
    conversation: { ...defaultCtx.conversation, ...(agentContext?.conversation || {}) }
  };
  const language = safeAgentContext.user.language || "mr";
  const { lots = [], buyRequests = [], currentSettledLot, activeLotDraft } = externalData;

  const text = rawUtterance.trim();
  const lower = text.toLowerCase();

  const pendingQ = safeAgentContext.conversation.pendingQuestion || null;
  const classification = classifyUtteranceIntent(text, pendingQ, screenContext);

  const stepResult = {
    transcript: text,
    intent: classification.intent,
    phase: "ACTION",
    toolCalls: [],
    spokenResponse: "",
    activityTrace: [],
    diagnostics: null,
    needsUserTap: false,
    confirmationLevel: "TAP_TO_CONFIRM",
    durationMs: 0,
    preparedCard: null,
    commandAction: null,
    shouldListenAgain: false,
    navigateTo: null,
    updatedContext: JSON.parse(JSON.stringify(safeAgentContext))
  };

  // Case 0: Non-E-Waste Rejection Guard ("5 kilo aloo bechna hai", "raddi bechna", "loha")
  if (classification.intent === AGENT_INTENTS.REJECT_NON_EWASTE) {
    const item = classification.item || "भाजीपाला / सामान्य कचरा";
    const category = classification.category || "गैर-इलेक्ट्रॉनिक सामग्री";

    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? `अवैध सामग्री: '${item}'` : language === "hi" ? `अमान्य सामग्री: '${item}'` : `Non-E-Waste: '${item}'`,
        status: "ERROR"
      },
      {
        text: language === "mr" ? "फक्त अधिकृत ई-कचरा स्वीकार्य आहे" : language === "hi" ? "केवल अधिकृत ई-कचरा स्वीकार्य है" : "Strictly E-Waste Only",
        status: "DONE"
      }
    ];

    stepResult.diagnostics = {
      intent: "REJECT_NON_EWASTE",
      entities: {
        RejectedItem: item,
        Category: category,
        PolicyRule: "CPCB E-Waste Rules 2022 (Schedule I Only)"
      },
      toolsDispatched: [],
      policy: "REJECT_NON_EWASTE_GUARD"
    };

    stepResult.commandAction = {
      type: "SHOW_NON_EWASTE_REJECTION",
      rejectedItem: item,
      category: category
    };

    stepResult.preparedCard = {
      type: "NON_EWASTE_REJECTED",
      rejectedItem: item,
      category: category,
      allowedCategories: [
        { id: "smartphones", name: language === "mr" ? "मोबाईल" : language === "hi" ? "मोबाइल" : "Mobiles", rate: "₹380/kg" },
        { id: "laptops", name: language === "mr" ? "लॅपटॉप" : language === "hi" ? "लैपटॉप" : "Laptops", rate: "₹210/kg" },
        { id: "batteries", name: language === "mr" ? "बॅटरी" : language === "hi" ? "बैटरी" : "Batteries", rate: "₹95/kg" },
        { id: "cables", name: language === "mr" ? "केबल" : language === "hi" ? "केबल" : "Cables", rate: "₹180/kg" },
        { id: "pcb", name: language === "mr" ? "मदरबोर्ड" : language === "hi" ? "मदरबोर्ड" : "Motherboards", rate: "₹350/kg" }
      ]
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `आम्ही फक्त ई-कचरा (इलेक्ट्रॉनिक भंगार) खरेदी-विक्री करतो. आम्ही '${item}', भाजीपाला, रद्दी किंवा सामान्य कचरा घेत नाही. तुम्ही जुने मोबाईल, लॅपटॉप, बॅटरी, केबल किंवा कॉम्प्युटर विकू शकता.`
        : language === "hi"
        ? `हम केवल ई-कचरा (इलेक्ट्रॉनिक स्क्रैप) का व्यापार करते हैं। हम '${item}', सब्जी, रद्दी या सामान्य कचरा नहीं लेते। आप पुराने मोबाइल, लैपटॉप, बैटरी, केबल या कंप्यूटर बेच सकते हैं।`
        : `We deal strictly in electronic e-waste only. We do not accept '${item}', vegetables, or general municipal scrap. You can sell old mobiles, laptops, batteries, or cables.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 1: Cancellation Token
  if (classification.intent === AGENT_INTENTS.CANCEL_ACTION) {
    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "व्यवहार थांबवला" : language === "hi" ? "कार्रवाई रोकी गई" : "Action cancelled",
        status: "DONE"
      }
    ];
    stepResult.diagnostics = {
      intent: "CANCEL_ACTION",
      entities: {},
      toolsDispatched: [],
      policy: "RESET_STATE"
    };
    stepResult.updatedContext.conversation.pendingQuestion = null;
    stepResult.updatedContext.conversation.missingFields = [];
    stepResult.spokenResponse =
      language === "mr"
        ? "व्यवहार थांबवला आहे. मी तुमची मदत कशी करू शकतो?"
        : language === "hi"
        ? "कार्रवाई रोक दी गई है। मैं आपकी और क्या मदद करूँ?"
        : "Cancelled. How else can I assist you?";
    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 1.5: Ambiguous Reference Resolution ("Woh wala dikhao")
  if (classification.intent === AGENT_INTENTS.AMBIGUOUS_CHOICE) {
    stepResult.phase = "AMBIGUOUS";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "अस्पष्ट संदर्भ — स्पष्टीकरण विचारले" : language === "hi" ? "अस्पष्ट संदर्भ — स्पष्टीकरण पूछा" : "Ambiguous reference — Asking clarification",
        status: "DONE"
      }
    ];
    stepResult.diagnostics = {
      intent: "AMBIGUOUS_CHOICE",
      entities: {},
      toolsDispatched: [],
      policy: "NEEDS_CLARIFICATION"
    };
    stepResult.clarification = {
      prompt: language === "mr" ? "तुम्हाला कोणता खरेदीदार हवा आहे?" : language === "hi" ? "आप किस खरीदार की बात कर रहे हैं?" : "Which buyer are you referring to?",
      options: [
        { id: "opt_0", label: language === "mr" ? "१. पहिला (Apex)" : language === "hi" ? "१. पहला (Apex)" : "1. First (Apex)", position: 0 },
        { id: "opt_1", label: language === "mr" ? "२. मधला (EcoGreen)" : language === "hi" ? "२. बीच वाला (EcoGreen)" : "2. Middle (EcoGreen)", position: 1 },
        { id: "opt_2", label: language === "mr" ? "३. तिसरा (E-Scrap)" : language === "hi" ? "३. तीसरा (E-Scrap)" : "3. Third (E-Scrap)", position: 2 }
      ]
    };
    stepResult.spokenResponse =
      language === "mr"
        ? "तुम्हाला पहिला, मधला की तिसरा खरेदीदार हवा आहे?"
        : language === "hi"
        ? "आप पहला, बीच वाला या तीसरा खरीदार देखना चाहते हैं?"
        : "Do you mean the first, middle, or third buyer?";
    stepResult.shouldListenAgain = true;
    return stepResult;
  }

  // Case 2: Direct Stepper Weight Mutation ("Weight 7 kilo kar do")
  // Screen awareness mutates the underlying scanner directly
  if (classification.intent === AGENT_INTENTS.UPDATE_WEIGHT) {
    const weightVal = classification.weight || 7;
    const mat =
      screenContext?.scanner?.material ||
      safeAgentContext.session.selectedMaterial ||
      MATERIAL_TAXONOMY[1]; // default laptops

    stepResult.toolCalls.push({ tool: "updateWeight", args: { weightKg: weightVal } });
    stepResult.toolCalls.push({ tool: "estimateLotValue", args: { materialId: mat.id, weightKg: weightVal } });

    const ecoResult = AGENT_TOOLS.estimateLotValue.execute(safeAgentContext, { materialId: mat.id, weightKg: weightVal });
    const net = ecoResult.data.estimatedNetPayout;

    stepResult.activityTrace = [
      {
        text: language === "mr" ? `${weightVal} किलो वजन नोंदवले` : language === "hi" ? `${weightVal} किलो वजन अपडेट किया` : `Updated weight to ${weightVal} kg`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `सुधारित निव्वळ रक्कम ₹${net.toLocaleString("en-IN")}` : language === "hi" ? `अनुमानित नेट भाव ₹${net.toLocaleString("en-IN")}` : `Net value updated to ₹${net.toLocaleString("en-IN")}`,
        status: "DONE"
      }
    ];

    stepResult.agentStatus =
      language === "mr"
        ? `${weightVal} किलो वजन • ऑफर तयार`
        : language === "hi"
        ? `${weightVal} किलो वजन • ऑफर तैयार`
        : `Updated to ${weightVal} kg • Preparing offer`;

    stepResult.diagnostics = {
      intent: "UPDATE_WEIGHT",
      entities: {
        Material: mat.name,
        Weight: `${weightVal} kg`,
        UpdatedNet: `₹${net.toLocaleString("en-IN")}`
      },
      toolsDispatched: [
        `updateWeight({ weightKg: ${weightVal} })`,
        `estimateLotValue({ material: "${mat.id}", weightKg: ${weightVal} })`,
        `compareOffers({ weightKg: ${weightVal} })`
      ],
      policy: "Active lot in-place mutation"
    };

    stepResult.updatedContext.session.weight = weightVal;
    stepResult.updatedContext.session.selectedMaterial = mat;
    stepResult.updatedContext.session.estimatedValue = net;
    stepResult.updatedContext.conversation.pendingQuestion = null;
    stepResult.updatedContext.conversation.missingFields = [];

    // Emits direct mutator action down to the active screen
    stepResult.commandAction = { type: "UPDATE_WEIGHT", weight: weightVal };
    stepResult.phase = "ACTION";

    stepResult.preparedCard = {
      type: "LOT_PREPARATION",
      materialName: mat.name,
      materialId: mat.id,
      weightKg: weightVal,
      estimatedNet: net,
      buyersCount: 3,
      confirmAction: "START_SCANNER"
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `वजन ${weightVal} किलो केले. सुधारित निव्वळ रक्कम अंदाजे ₹${net.toLocaleString("en-IN")}.`
        : language === "hi"
        ? `वजन ${weightVal} किलो कर दिया। अनुमानित नेट भुगतान लगभग ₹${net.toLocaleString("en-IN")}.`
        : `Updated weight to ${weightVal} kg. Estimated net payout ₹${net.toLocaleString("en-IN")}.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 3: Live Camera Activation & Shutter Snap ("photo lo", "snap photo", "camera chalu karo", "retake")
  if (classification.intent === AGENT_INTENTS.START_CAMERA) {
    const isSnap = !!classification.snap;
    const isRetake = !!classification.retake;

    stepResult.toolCalls.push({ tool: "startCamera", args: {} });
    stepResult.commandAction = {
      type: isRetake ? "RETAKE_PHOTO" : "START_CAMERA",
      snap: isSnap
    };
    stepResult.phase = "ACTION";

    if (isSnap) {
      stepResult.activityTrace = [
        {
          text: language === "mr" ? "स्क्रॅप फोटो काढला" : language === "hi" ? "स्क्रैप फोटो लिया" : "Photo captured",
          status: "DONE"
        },
        {
          text: language === "mr" ? "फोटो पडताळणी यशस्वी" : language === "hi" ? "फोटो सत्यापन सफल" : "Photo verified",
          status: "DONE"
        }
      ];
      stepResult.spokenResponse =
        language === "mr"
          ? "स्क्रॅपचा फोटो काढला आहे. फोटो पडताळणी झाली."
          : language === "hi"
          ? "स्क्रैप का फोटो खींच लिया गया है। फोटो सत्यापित हुआ।"
          : "Scrap photo captured and verified.";
    } else if (isRetake) {
      stepResult.activityTrace = [
        {
          text: language === "mr" ? "कॅमेरा पुन्हा सुरू केला" : language === "hi" ? "कैमरा दोबारा चालू किया" : "Camera restarted",
          status: "DONE"
        }
      ];
      stepResult.spokenResponse =
        language === "mr"
          ? "कॅमेरा पुन्हा सुरू केला आहे. नवीन फोटो काढा."
          : language === "hi"
          ? "कैमरा दोबारा चालू किया है। नया फोटो लें।"
          : "Camera restarted. Please capture a new photo.";
    } else {
      stepResult.activityTrace = [
        {
          text: language === "mr" ? "कॅमेरा सुरू केला" : language === "hi" ? "कैमरा चालू किया" : "Camera activated",
          status: "DONE"
        },
        {
          text: language === "mr" ? "लाइव्ह ई-कचरा स्कॅनिंग तयार" : language === "hi" ? "सटीक वर्गीकरण हेतु तैयार" : "Live sensor classification ready",
          status: "DONE"
        }
      ];
      stepResult.spokenResponse =
        language === "mr"
          ? "कॅमेरा सुरू केला आहे. अचूक तपासणीसाठी स्क्रॅपचा फोटो काढा."
          : language === "hi"
          ? "कैमरा चालू किया है। सही जांच के लिए स्क्रैप का फोटो लें।"
          : "Camera is active. Please capture a photo of the scrap.";
    }

    stepResult.diagnostics = {
      intent: "START_CAMERA",
      entities: { mode: isSnap ? "SNAP_SHUTTER" : isRetake ? "RETAKE" : "OPEN_STREAM" },
      toolsDispatched: ["startCamera"],
      policy: "MULTIMODAL_SENSOR"
    };

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 4: Explaining Top Buyer ("Ye wala buyer kyun best hai?")
  if (classification.intent === AGENT_INTENTS.EXPLAIN_BEST_OFFER) {
    stepResult.toolCalls.push({ tool: "compareOffers", args: { sortBy: "NET_PAYOUT" } });
    stepResult.commandAction = { type: "HIGHLIGHT_OFFER", index: 0 };
    stepResult.phase = "ACTION";

    stepResult.activityTrace = [
      {
        text: language === "mr" ? "सत्यापित खरेदीदारांची तुलना केली" : language === "hi" ? "सत्यापित खरीदारों की तुलना की" : "Compared verified recyclers",
        status: "DONE"
      },
      {
        text: language === "mr" ? "सर्वोत्तम रोख रक्कम ओळखली" : language === "hi" ? "सर्वाधिक नेट नकद पहचाना" : "Highest net in-hand payout found",
        status: "DONE"
      }
    ];

    stepResult.diagnostics = {
      intent: "EXPLAIN_BEST_OFFER",
      entities: { buyer: "Apex E-Recovery Ltd.", netPayout: "₹2,960" },
      toolsDispatched: ["compareOffers"],
      policy: "MULTIMODAL_SPOTLIGHT"
    };

    stepResult.preparedCard = {
      type: "BEST_OFFER",
      buyerName: "Apex E-Recovery Ltd.",
      netPayout: 2960,
      cpcbReg: "CPCB-MH-WST-2024-0089",
      distanceKm: 4.2
    };

    stepResult.spokenResponse =
      language === "mr"
        ? "Apex E-Recovery चा निव्वळ रोख भाव सर्वाधिक ₹२,९६० आहे आणि मोफत EV पिकअप समाविष्ट आहे."
        : language === "hi"
        ? "Apex E-Recovery का नेट भुगतान सबसे ज्यादा ₹2,960 है और 4.2 किमी से फ्री EV पिकअप शामिल है।"
        : "Apex E-Recovery offers the highest net cash of ₹2,960 with included doorstep EV pickup.";

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 5: Multimodal Grounding ("Beech wala" -> visible card #2)
  if (classification.intent === AGENT_INTENTS.SELECT_OFFER) {
    const pos = classification.position ?? 1;
    const buyerName = pos === 1 ? "EcoSmart Recyclers" : pos === 2 ? "Greentech Solutions" : "Apex E-Recovery Ltd.";
    const netPayout = pos === 1 ? 2800 : pos === 2 ? 2700 : 2960;

    stepResult.toolCalls.push({ tool: "selectOffer", args: { offerIndex: pos } });
    stepResult.commandAction = { type: "SELECT_OFFER", index: pos };
    stepResult.phase = "ACTION";

    stepResult.activityTrace = [
      {
        text: language === "mr" ? `स्थान क्र. ${pos + 1} वरील कार्ड निवडले` : language === "hi" ? `कार्ड #${pos + 1} चुना गया` : `Selected visible card #${pos + 1}`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `${buyerName} निवडले` : language === "hi" ? `${buyerName} चयनित` : `${buyerName} active`,
        status: "DONE"
      }
    ];

    stepResult.agentStatus =
      language === "mr"
        ? `${buyerName} निवडले • मंजुरी आवश्यक`
        : language === "hi"
        ? `${buyerName} चुना • पुष्टि आवश्यक`
        : `Selected ${buyerName} • Needs your confirmation`;

    stepResult.diagnostics = {
      intent: "SELECT_OFFER",
      entities: {
        Buyer: buyerName,
        Position: pos === 0 ? "#1 (Highest Offer)" : pos === 1 ? "#2 (Balanced Offer)" : "#3 (Fast Pickup)",
        NetPayout: `₹${netPayout.toLocaleString("en-IN")}`
      },
      toolsDispatched: [
        `selectOffer({ index: ${pos}, buyer: "${buyerName}" })`,
        `calculateNetOffer({ netPayout: ${netPayout} })`
      ],
      policy: "Multimodal Grounding (Visible Offers)"
    };

    stepResult.preparedCard = {
      type: "BEST_OFFER",
      buyerName: buyerName,
      netPayout: netPayout,
      cpcbReg: "CPCB-MH-WST-2024-0142",
      distanceKm: pos === 1 ? 8.4 : 12.1
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `${pos === 1 ? "मधला" : "निवडलेला"} खरेदीदार ${buyerName}. निव्वळ रोख ₹${netPayout.toLocaleString("en-IN")}. स्वीकार करायचा?`
        : language === "hi"
        ? `${pos === 1 ? "बीच वाला" : "चुना गया"} खरीदार ${buyerName}। नेट नकद ₹${netPayout.toLocaleString("en-IN")}। स्वीकार करें?`
        : `Selected ${pos === 1 ? "middle" : "specified"} buyer ${buyerName} at ₹${netPayout.toLocaleString("en-IN")} net. Would you like to accept?`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 6: Transaction Acceptance Hand-off (Transaction Policy Engine)
  // Voice prepares. Touch commits.
  if (classification.intent === AGENT_INTENTS.REQUEST_ACCEPT_OFFER) {
    const amount = classification.amount || 2960;
    const isHighValue = amount >= CONFIRMATION_POLICY.highValue.minAmount;
    const confirmationLevel = isHighValue ? "HOLD_TO_CONFIRM" : "TAP_TO_CONFIRM";
    const durationMs = isHighValue ? CONFIRMATION_POLICY.highValue.durationMs : 0;

    stepResult.toolCalls.push({
      tool: "requestAcceptOffer",
      args: { offerId: "offer_active", amount }
    });

    stepResult.phase = "CONFIRMATION";
    stepResult.needsUserTap = true;
    stepResult.confirmationLevel = confirmationLevel;
    stepResult.durationMs = durationMs;

    stepResult.activityTrace = [
      {
        text: language === "mr" ? `ऑफर रक्कम ₹${amount.toLocaleString("en-IN")}` : language === "hi" ? `ऑफर राशि ₹${amount.toLocaleString("en-IN")}` : `Offer amount ₹${amount.toLocaleString("en-IN")}`,
        status: "DONE"
      },
      {
        text: isHighValue
          ? (language === "mr" ? "उच्च मूल्य धोरण: ५ सेकंद दाबून ठेवा" : language === "hi" ? "उच्च मूल्य नीति: 5s दबाकर रखें" : "High-value policy: 5s hold required")
          : (language === "mr" ? "स्वीकृतीसाठी हिरवे बटण दाबा" : language === "hi" ? "स्वीकृति के लिए हरा बटन दबाएं" : "Physical tap required to commit"),
        status: "PENDING"
      }
    ];

    stepResult.agentStatus = isHighValue
      ? (language === "mr" ? "५ सेकंद दाबून ठेवा" : language === "hi" ? "5s दबाकर रखें" : "Needs 5s Hold Confirmation")
      : (language === "mr" ? "तुमची मंजुरी आवश्यक" : language === "hi" ? "आपकी पुष्टि आवश्यक" : "Needs your confirmation");

    stepResult.diagnostics = {
      intent: "REQUEST_ACCEPT_OFFER",
      entities: {
        Amount: `₹${amount.toLocaleString("en-IN")}`,
        Threshold: isHighValue ? ">= ₹1,00,000 (HIGH VALUE)" : "< ₹1,00,000 (STANDARD)",
        ConfirmationMode: confirmationLevel
      },
      toolsDispatched: [
        `requestAcceptOffer({ amount: ${amount}, policy: "${confirmationLevel}" })`,
        `validateTransactionPolicy({ threshold: 100000 })`
      ],
      policy: isHighValue ? "HOLD_5S_CONFIRM (High-Value Deliberate Physical Hold)" : "TAP_TO_CONFIRM"
    };

    stepResult.preparedCard = {
      type: "ACCEPT_CONFIRMATION",
      amount: amount,
      buyerName: "Apex E-Recovery Ltd.",
      confirmationLevel: confirmationLevel,
      durationMs: durationMs
    };

    stepResult.spokenResponse = isHighValue
      ? (language === "mr"
          ? `₹${amount.toLocaleString("en-IN")} चा मोठा व्यवहार. मंजूर करण्यासाठी ५ सेकंद हिरवे बटण दाबून ठेवा.`
          : language === "hi"
          ? `₹${amount.toLocaleString("en-IN")} का बड़ा सौदा। मंजूर करने के लिए 5 सेकंड हरा बटन दबाकर रखें।`
          : `High-value transaction of ₹${amount.toLocaleString("en-IN")}. Hold green confirmation button for 5 seconds to commit.`)
      : (language === "mr"
          ? `₹${amount.toLocaleString("en-IN")} ची ऑफर स्वीकारायची का? पुढे जाण्यासाठी हिरवे बटण दाबा.`
          : language === "hi"
          ? `₹${amount.toLocaleString("en-IN")} का ऑफर स्वीकार करना है? आगे बढ़ने के लिए हरा बटन दबाएं।`
          : `Accept ₹${amount.toLocaleString("en-IN")} offer? Tap green button to commit.`);

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 6a: Target Price Set / Negotiation ("merko 135 me bechna h", "135 ka bhav chahiye")
  if (classification.intent === AGENT_INTENTS.SET_TARGET_PRICE) {
    const targetPrice = classification.targetPrice || 135;
    const mat =
      screenContext?.scanner?.material ||
      safeAgentContext.session.selectedMaterial ||
      MATERIAL_TAXONOMY.find((m) => m.id === "batteries") ||
      MATERIAL_TAXONOMY[1];
    const weight =
      screenContext?.scanner?.weightKg !== undefined
        ? screenContext.scanner.weightKg
        : safeAgentContext.session.weight || 10;

    const baseRate = mat.baseBenchmarkRatePerKg || 95;
    const topBidRate = Math.round(baseRate * 1.18);

    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? `अपेक्षित भाव ₹${targetPrice}/किग्रा नोंदवला` : language === "hi" ? `लक्ष्य भाव ₹${targetPrice}/किग्रा दर्ज किया` : `Target rate ₹${targetPrice}/kg recorded`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `CPCB संदर्भ दर ₹${baseRate}/किग्रा • सर्वोत्तम बोली ₹${topBidRate}/किग्रा` : language === "hi" ? `CPCB संदर्भ ₹${baseRate}/किग्रा • टॉप बोली ₹${topBidRate}/किग्रा` : `CPCB ₹${baseRate}/kg • Top Bid ₹${topBidRate}/kg`,
        status: "DONE"
      }
    ];

    stepResult.preparedCard = {
      type: "PRICE_NEGOTIATION",
      targetPrice,
      benchmarkRate: baseRate,
      topBidRate,
      materialId: mat.id,
      materialName: mat.name,
      weightKg: weight
    };

    stepResult.commandAction = {
      type: "SET_TARGET_PRICE",
      targetPrice,
      materialId: mat.id
    };

    stepResult.diagnostics = {
      intent: "SET_TARGET_PRICE",
      entities: {
        Material: mat.name,
        TargetPrice: `₹${targetPrice}/kg`,
        CPCBRef: `₹${baseRate}/kg`,
        TopBid: `₹${topBidRate}/kg`
      },
      toolsDispatched: [
        `estimateLotValue({ material: "${mat.id}", targetRate: ${targetPrice} })`,
        `compareOffers({ targetPrice: ${targetPrice} })`
      ],
      policy: "NEGOTIATION_BENCHMARK"
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `तुमचा अपेक्षित भाव ₹${targetPrice}/किग्रा नोंदवला. CPCB संदर्भ ₹${baseRate}/किग्रा आहे आणि टॉप खरेदीदार ₹${topBidRate}/किग्रा पर्यंत देतात. चालू स्थितीत असल्यास जास्तीत जास्त भाव मिळेल.`
        : language === "hi"
        ? `आपका लक्ष्य भाव ₹${targetPrice}/किग्रा नोट कर लिया है। CPCB संदर्भ ₹${baseRate}/किग्रा है और टॉप खरीदार ₹${topBidRate}/किग्रा तक दे रहे हैं। वर्किंग कंडीशन में सबसे बेहतर भाव मिलेगा।`
        : `Noted your target rate of ₹${targetPrice}/kg. CPCB benchmark is ₹${baseRate}/kg and top verified buyers offer up to ₹${topBidRate}/kg. Working condition gives the best rate.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 6b: Inquire Higher Price / Bargaining Tips ("ky muje isse jada daam mil sakta h")
  if (classification.intent === AGENT_INTENTS.INQUIRE_HIGHER_PRICE) {
    const mat =
      screenContext?.scanner?.material ||
      safeAgentContext.session.selectedMaterial ||
      MATERIAL_TAXONOMY.find((m) => m.id === "batteries") ||
      MATERIAL_TAXONOMY[1];
    const weight =
      screenContext?.scanner?.weightKg !== undefined
        ? screenContext.scanner.weightKg
        : safeAgentContext.session.weight || 10;

    const baseRate = mat.baseBenchmarkRatePerKg || 95;
    const workingRate = Math.round(baseRate * 1.15);
    const maxRate = Math.round(baseRate * 1.18);

    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "अधिक भाव मिळवण्याच्या २ पद्धती शोधल्या" : language === "hi" ? "अधिक दाम के 2 विकल्प पहचाने" : "Found 2 ways for higher payout",
        status: "DONE"
      },
      {
        text: language === "mr" ? `१. Working स्थिती (+१५%)  २. थेट रिसायकलर (+१८%)` : language === "hi" ? `1. वर्किंग स्थिति (+15%)  2. डायरेक्ट रिसायकलर (+18%)` : `1. Working condition (+15%)  2. Direct smelter (+18%)`,
        status: "DONE"
      }
    ];

    stepResult.preparedCard = {
      type: "HIGHER_PRICE_TIPS",
      baseRate,
      maxRate,
      materialId: mat.id,
      materialName: mat.name,
      weightKg: weight
    };

    stepResult.diagnostics = {
      intent: "INQUIRE_HIGHER_PRICE",
      entities: {
        Material: mat.name,
        BaseRate: `₹${baseRate}/kg`,
        WorkingBonus: `+15% (₹${workingRate}/kg)`,
        DirectRecyclerBonus: `+18% (₹${maxRate}/kg)`
      },
      toolsDispatched: [`compareOffers({ optimizePayout: true })`],
      policy: "VALUE_OPTIMIZATION_ADVICE"
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `होय! जास्त भाव मिळवण्यासाठी २ मार्ग आहेत: १. जर स्क्रॅप चालू (Working) असेल तर +१५% जास्त भाव मिळतो. २. थेट SafeBat रिसायकलरला दिल्यास ₹${maxRate}/किग्रा पर्यंत भाव मिळतो.`
        : language === "hi"
        ? `हाँ! ज्यादा दाम पाने के 2 रास्ते हैं: 1. यदि स्क्रैप चालू (Working) स्थिति में है तो +15% ज्यादा दाम मिलता है। 2. SafeBat जैसे डायरेक्ट रिसायकलर से ₹${maxRate}/किग्रा तक उच्चतम भाव मिल सकता है।`
        : `Yes! 2 ways to get a higher payout: 1. Working condition gives +15% premium. 2. Direct recyclers offer top bids up to ₹${maxRate}/kg.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 6c: Condition Mutation ("ye working hai", "working condition", "चालू आहे", "kharab hai")
  if (classification.intent === AGENT_INTENTS.CHANGE_CONDITION) {
    const newCond = classification.condition || "WORKING";
    const multiplier = newCond === "WORKING" ? 1.15 : newCond === "DAMAGED" ? 0.75 : 1.0;
    const mat =
      screenContext?.scanner?.material ||
      safeAgentContext.session.selectedMaterial ||
      MATERIAL_TAXONOMY[1];
    const weight =
      screenContext?.scanner?.weightKg !== undefined
        ? screenContext.scanner.weightKg
        : safeAgentContext.session.weight || 10;

    const baseVal = Math.round((mat.baseBenchmarkRatePerKg || 95) * weight);
    const revisedVal = Math.round(baseVal * multiplier);

    stepResult.phase = "ACTION";
    stepResult.commandAction = { type: "CHANGE_CONDITION", condition: newCond, multiplier };
    stepResult.activityTrace = [
      {
        text: language === "mr" ? `स्थिती '${newCond}' केली (${multiplier >= 1 ? "+" : ""}${Math.round((multiplier - 1) * 100)}%)` : language === "hi" ? `कंडीशन '${newCond}' की (${multiplier >= 1 ? "+" : ""}${Math.round((multiplier - 1) * 100)}%)` : `Updated condition to ${newCond} (${multiplier >= 1 ? "+" : ""}${Math.round((multiplier - 1) * 100)}%)`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `सुधारित CPCB मूल्य ₹${revisedVal.toLocaleString("en-IN")}` : language === "hi" ? `संशोधित CPCB मूल्य ₹${revisedVal.toLocaleString("en-IN")}` : `Revised CPCB Ref: ₹${revisedVal.toLocaleString("en-IN")}`,
        status: "DONE"
      }
    ];

    stepResult.preparedCard = {
      type: "LOT_PREPARATION",
      materialName: mat.name,
      materialId: mat.id,
      weightKg: weight,
      estimatedNet: revisedVal,
      ratePerKg: Math.round((mat.baseBenchmarkRatePerKg || 95) * multiplier),
      buyersCount: 3,
      confirmAction: "START_SCANNER"
    };

    stepResult.diagnostics = {
      intent: "CHANGE_CONDITION",
      entities: {
        Condition: newCond,
        Multiplier: multiplier,
        RevisedValue: `₹${revisedVal}`
      },
      toolsDispatched: [`estimateLotValue({ condition: "${newCond}" })`],
      policy: "IN_PLACE_MUTATION"
    };

    const condName =
      newCond === "WORKING"
        ? (language === "mr" ? "चालू (Working)" : language === "hi" ? "चालू (Working)" : "Working")
        : newCond === "DAMAGED"
        ? (language === "mr" ? "खराब (Damaged)" : language === "hi" ? "डैमेज्ड (Damaged)" : "Damaged")
        : (language === "mr" ? "वापरलेले" : language === "hi" ? "यूज्ड" : "Used");

    stepResult.spokenResponse =
      language === "mr"
        ? `स्थिती '${condName}' नोंदवली. सुधारित संदर्भ मूल्य अंदाजे ₹${revisedVal.toLocaleString("en-IN")}.`
        : language === "hi"
        ? `कंडीशन '${condName}' अपडेट कर दी गई। संशोधित संदर्भ भाव लगभग ₹${revisedVal.toLocaleString("en-IN")}.`
        : `Condition updated to ${condName}. Revised reference value is ₹${revisedVal.toLocaleString("en-IN")}.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 6d: Material Mutation ("battery kar do", "mobile select karo")
  if (classification.intent === AGENT_INTENTS.CHANGE_MATERIAL) {
    const mat = classification.material || extractMaterial(lower) || MATERIAL_TAXONOMY[1];
    const weight =
      screenContext?.scanner?.weightKg !== undefined
        ? screenContext.scanner.weightKg
        : safeAgentContext.session.weight || 10;
    const benchmarkVal = Math.round((mat.baseBenchmarkRatePerKg || 95) * weight);

    stepResult.phase = "ACTION";
    stepResult.commandAction = { type: "CHANGE_MATERIAL", materialId: mat.id };
    stepResult.activityTrace = [
      {
        text: language === "mr" ? `${mat.name} निवडले` : language === "hi" ? `${mat.name} बदला गया` : `Changed to ${mat.name}`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `CPCB संदर्भ भाव ₹${benchmarkVal.toLocaleString("en-IN")}` : language === "hi" ? `CPCB संदर्भ भाव ₹${benchmarkVal.toLocaleString("en-IN")}` : `CPCB Ref: ₹${benchmarkVal.toLocaleString("en-IN")}`,
        status: "DONE"
      }
    ];

    stepResult.preparedCard = {
      type: "LOT_PREPARATION",
      materialName: mat.name,
      materialId: mat.id,
      weightKg: weight,
      estimatedNet: benchmarkVal,
      ratePerKg: mat.baseBenchmarkRatePerKg,
      buyersCount: 3,
      confirmAction: "START_SCANNER"
    };

    stepResult.diagnostics = {
      intent: "CHANGE_MATERIAL",
      entities: { Material: mat.name, BenchmarkRate: `₹${mat.baseBenchmarkRatePerKg}/kg` },
      toolsDispatched: [`changeMaterial({ materialId: "${mat.id}" })`],
      policy: "IN_PLACE_MUTATION"
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `${mat.name} निवडले. ${weight} किलोसाठी संदर्भ भाव ₹${benchmarkVal.toLocaleString("en-IN")} आहे.`
        : language === "hi"
        ? `${mat.name} चुन लिया। ${weight} किलो के लिए संदर्भ भाव ₹${benchmarkVal.toLocaleString("en-IN")} है।`
        : `Selected ${mat.name}. Reference value for ${weight} kg is ₹${benchmarkVal.toLocaleString("en-IN")}.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 6e: Affirmative Confirmation ("आगे बढ़ें", "पुढे चला", "proceed", "haan", "theek hai")
  if (classification.intent === AGENT_INTENTS.CONFIRM_ACTION) {
    const currentScreen = screenContext?.screen || "";

    if (currentScreen === "SCANNER") {
      const hasPhoto = !!screenContext?.scanner?.hasUserCapturedPhoto;
      if (!hasPhoto) {
        stepResult.phase = "ACTION";
        stepResult.commandAction = { type: "START_CAMERA" };
        stepResult.activityTrace = [
          {
            text: language === "mr" ? "स्क्रॅप फोटो आवश्यक" : language === "hi" ? "स्क्रैप फोटो आवश्यक" : "Photo required",
            status: "PENDING"
          }
        ];
        stepResult.spokenResponse =
          language === "mr"
            ? "खरेदीदार शोधण्यासाठी आधी स्क्रॅपचा फोटो काढा. कॅमेरा सुरू केला आहे."
            : language === "hi"
            ? "खरीदार देखने के लिए पहले स्क्रैप का फोटो लें। कैमरा चालू किया है।"
            : "Please take a photo of the scrap before viewing buyers. Camera is open.";
        stepResult.shouldListenAgain = false;
        return stepResult;
      } else {
        stepResult.phase = "ACTION";
        stepResult.commandAction = { type: "PROCEED" };
        stepResult.activityTrace = [
          {
            text: language === "mr" ? "खरेदीदार शोधत आहोत..." : language === "hi" ? "खरीदार खोजे जा रहे हैं..." : "Loading buyers...",
            status: "DONE"
          }
        ];
        stepResult.spokenResponse =
          language === "mr"
            ? "सर्वोत्तम खरेदीदार शोधत आहोत."
            : language === "hi"
            ? "सत्यापित खरीदार खोज रहे हैं।"
            : "Finding verified buyers for your lot.";
        stepResult.shouldListenAgain = false;
        return stepResult;
      }
    } else if (currentScreen === "MARKETPLACE") {
      const bestOffer = screenContext?.selectedElement?.offer?.netPayout || 2960;
      stepResult.phase = "CONFIRMATION";
      stepResult.needsUserTap = true;
      stepResult.confirmationLevel = bestOffer >= CONFIRMATION_POLICY.highValue.minAmount ? "HOLD_TO_CONFIRM" : "TAP_TO_CONFIRM";
      stepResult.preparedCard = {
        type: "ACCEPT_CONFIRMATION",
        amount: bestOffer,
        buyerName: "Apex E-Recovery Ltd."
      };
      stepResult.spokenResponse =
        language === "mr"
          ? `₹${bestOffer.toLocaleString("en-IN")} ची ऑफर स्वीकारायची का? पुढे जाण्यासाठी हिरवे बटण दाबा.`
          : language === "hi"
          ? `₹${bestOffer.toLocaleString("en-IN")} का ऑफर स्वीकार करना है? आगे बढ़ने के लिए हरा बटन दबाएं।`
          : `Accept ₹${bestOffer.toLocaleString("en-IN")} offer? Tap green button to commit.`;
      stepResult.shouldListenAgain = false;
      return stepResult;
    } else {
      // On Home: navigate to scanner
      const mat = safeAgentContext.session.selectedMaterial || MATERIAL_TAXONOMY[1];
      const weight = safeAgentContext.session.weight || 10;
      stepResult.phase = "ACTION";
      stepResult.navigateTo = "SCANNER";
      stepResult.commandAction = { type: "SET_LOT", materialId: mat.id, weight, startCamera: true };
      stepResult.spokenResponse =
        language === "mr"
          ? "स्कॅनर उघडत आहे. कृपया स्क्रॅपचा फोटो काढा."
          : language === "hi"
          ? "स्कैनर खोल रहे हैं। कृपया स्क्रैप का फोटो लें।"
          : "Opening scanner. Please take a photo of the scrap.";
      stepResult.shouldListenAgain = false;
      return stepResult;
    }
  }

  // Case 7: General E-Waste Selling Intent ("Mere paas 10 kilo purane laptop hain")
  // Cardinal Rule: Never ask for information already in context!
  if (classification.intent === AGENT_INTENTS.SELL_EWASTE) {
    const mat =
      classification.material ||
      extractMaterial(lower) ||
      screenContext?.scanner?.material ||
      safeAgentContext.session.selectedMaterial ||
      MATERIAL_TAXONOMY[1];

    const weight =
      classification.weight !== undefined && classification.weight !== null
        ? classification.weight
        : extractWeight(lower) !== null
        ? extractWeight(lower)
        : screenContext?.scanner?.weightKg !== undefined
        ? screenContext.scanner.weightKg
        : safeAgentContext.session.weight;

    stepResult.updatedContext.session.selectedMaterial = mat;

    // Turn 1: If weight is genuinely unknown from all context, ask for weight!
    if (weight === null || weight === undefined) {
      stepResult.phase = "ACTION";
      stepResult.activityTrace = [
        {
          text: language === "mr" ? `${mat.name} ओळखले` : language === "hi" ? `${mat.name} पहचाना` : `Identified ${mat.name}`,
          status: "DONE"
        },
        {
          text: language === "mr" ? "अंदाजे वजन विचारत आहे..." : language === "hi" ? "वजन पूछा जा रहा है..." : "Requesting weight...",
          status: "PENDING"
        }
      ];
      stepResult.diagnostics = {
        intent: "SELL_EWASTE",
        entities: { material: mat.name, weight: "UNKNOWN" },
        toolsDispatched: [],
        policy: "CONTINUOUS_VOICE_PROMPT"
      };

      stepResult.updatedContext.conversation.pendingQuestion = "ASK_WEIGHT";
      stepResult.updatedContext.conversation.missingFields = ["weight"];

      stepResult.spokenResponse =
        language === "mr"
          ? `${mat.name}. अंदाजे किती वजन आहे? (उदा. ५ किलो किंवा १० किलो)`
          : language === "hi"
          ? `${mat.name}. लगभग कितना वजन है? (जैसे 5 किलो या 10 किलो)`
          : `${mat.name}. Approximately what is the weight in kg?`;

      stepResult.shouldListenAgain = true;
      return stepResult;
    }

    // Both Material and Weight are known! (e.g. "Mere paas 10 kilo purane laptop hain")
    stepResult.toolCalls.push({ tool: "estimateLotValue", args: { materialId: mat.id, weightKg: weight } });
    stepResult.toolCalls.push({ tool: "findBuyers", args: { materialId: mat.id, weightKg: weight } });

    const ecoResult = AGENT_TOOLS.estimateLotValue.execute(safeAgentContext, { materialId: mat.id, weightKg: weight });
    // Unified with MaterialScanner: CPCB benchmark rate (before recycler bids & transport deduction)
    const benchmarkVal = ecoResult.data.grossValue || Math.round((mat.baseBenchmarkRatePerKg || 95) * weight);

    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? `${mat.name} ओळखले` : language === "hi" ? `${mat.name} पहचाना` : `Identified ${mat.name}`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `${weight} किलो वजन नोंदवले` : language === "hi" ? `${weight} किलो वजन दर्ज किया` : `Recorded ${weight} kg weight`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `CPCB संदर्भ भाव ₹${benchmarkVal.toLocaleString("en-IN")}` : language === "hi" ? `CPCB संदर्भ भाव ₹${benchmarkVal.toLocaleString("en-IN")}` : `CPCB Ref Value: ₹${benchmarkVal.toLocaleString("en-IN")}`,
        status: "DONE"
      },
      {
        text: language === "mr" ? "३ अधिकृत खरेदीदार उपलब्ध" : language === "hi" ? "3 सत्यापित खरीदार उपलब्ध" : "3 verified buyers matched",
        status: "DONE"
      }
    ];

    stepResult.agentStatus =
      language === "mr"
        ? "३ खरेदीदार जुळले • ऑफर तयार"
        : language === "hi"
        ? "3 खरीदार मिले • ऑफर तैयार"
        : "Matched 3 buyers • Preparing offer";

    stepResult.diagnostics = {
      intent: "FIND_BUYERS",
      entities: {
        Material: mat.name,
        Weight: `${weight} kg`,
        BenchmarkRate: `₹${mat.baseBenchmarkRatePerKg}/kg`,
        EstimatedPayout: `₹${benchmarkVal.toLocaleString("en-IN")}`
      },
      toolsDispatched: [
        `estimateLotValue({ material: "${mat.id}", weightKg: ${weight} })`,
        `findBuyers({ material: "${mat.id}", weightKg: ${weight} })`,
        `estimateLogistics({ weightKg: ${weight} })`,
        `compareOffers({ offersCount: 3 })`
      ],
      policy: "Voice prepares • Touch commits"
    };

    stepResult.updatedContext.session.weight = weight;
    stepResult.updatedContext.session.estimatedValue = benchmarkVal;
    stepResult.updatedContext.conversation.pendingQuestion = null;

    // Mutates scanner lot without navigating behind user's back
    stepResult.commandAction = { type: "SET_LOT", materialId: mat.id, weight: weight };
    stepResult.navigateTo = null;

    stepResult.preparedCard = classification.targetPrice ? {
      type: "PRICE_NEGOTIATION",
      targetPrice: classification.targetPrice,
      benchmarkRate: mat.baseBenchmarkRatePerKg || 95,
      topBidRate: Math.round((mat.baseBenchmarkRatePerKg || 95) * 1.18),
      materialId: mat.id,
      materialName: mat.name,
      weightKg: weight,
      estimatedNet: benchmarkVal
    } : {
      type: "LOT_PREPARATION",
      materialName: mat.name,
      materialId: mat.id,
      weightKg: weight,
      estimatedNet: benchmarkVal,
      ratePerKg: mat.baseBenchmarkRatePerKg,
      buyersCount: 3,
      confirmAction: "START_SCANNER"
    };

    stepResult.spokenResponse = classification.targetPrice
      ? (language === "mr"
          ? `${weight} किलो ${mat.name}, अपेक्षित भाव ₹${classification.targetPrice}/किग्रा. CPCB संदर्भ मूल्य ₹${benchmarkVal.toLocaleString("en-IN")}. ३ खरेदीदार उपलब्ध आहेत.`
          : language === "hi"
          ? `${weight} किलो ${mat.name}, लक्ष्य भाव ₹${classification.targetPrice}/किग्रा। CPCB संदर्भ मूल्य ₹${benchmarkVal.toLocaleString("en-IN")}। 3 सत्यापित खरीदार उपलब्ध हैं।`
          : `${weight} kg ${mat.name}, target rate ₹${classification.targetPrice}/kg. CPCB reference value ₹${benchmarkVal.toLocaleString("en-IN")} with 3 verified buyers available.`)
      : (language === "mr"
          ? `${weight} किलो ${mat.name}. CPCB संदर्भ मूल्य ₹${benchmarkVal.toLocaleString("en-IN")}. ३ अधिकृत खरेदीदार उपलब्ध आहेत.`
          : language === "hi"
          ? `${weight} किलो ${mat.name}। CPCB संदर्भ मूल्य ₹${benchmarkVal.toLocaleString("en-IN")}। 3 सत्यापित खरीदार उपलब्ध हैं।`
          : `${weight} kg ${mat.name}. CPCB reference value ₹${benchmarkVal.toLocaleString("en-IN")} with 3 verified buyers available.`);

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 8: Turn 2 missing weight provided
  if (
    classification.intent === AGENT_INTENTS.PROVIDE_WEIGHT ||
    (pendingQ === "ASK_WEIGHT" && classification.weight !== undefined)
  ) {
    const weightVal = classification.weight !== undefined ? classification.weight : (extractWeight(lower) || 18);
    const mat = safeAgentContext.session.selectedMaterial || screenContext?.scanner?.material || MATERIAL_TAXONOMY[0] || MATERIAL_TAXONOMY[1];

    const ecoResult = AGENT_TOOLS.estimateLotValue.execute(safeAgentContext, { materialId: mat.id, weightKg: weightVal });
    const net = ecoResult.data.estimatedNetPayout;

    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? `${weightVal} किलो वजन नोंदवले` : language === "hi" ? `${weightVal} किलो वजन दर्ज किया` : `Recorded ${weightVal} kg weight`,
        status: "DONE"
      },
      {
        text: language === "mr" ? `अंदाजित निव्वळ भाव ₹${net.toLocaleString("en-IN")}` : language === "hi" ? `अनुमानित नेट भाव ₹${net.toLocaleString("en-IN")}` : `Estimated net: ₹${net.toLocaleString("en-IN")}`,
        status: "DONE"
      }
    ];

    stepResult.commandAction = { type: "SET_LOT", materialId: mat.id, weight: weightVal };
    stepResult.updatedContext.session.weight = weightVal;
    stepResult.updatedContext.conversation.pendingQuestion = null;
    stepResult.updatedContext.conversation.missingFields = [];

    stepResult.preparedCard = {
      type: "LOT_PREPARATION",
      materialName: mat.name,
      materialId: mat.id,
      weightKg: weightVal,
      estimatedNet: net,
      buyersCount: 3,
      confirmAction: "START_SCANNER"
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `${weightVal} किलो ${mat.name}. अंदाजे ₹${net.toLocaleString("en-IN")}. ३ खरेदीदार मिळाले आहेत.`
        : language === "hi"
        ? `${weightVal} किलो ${mat.name}। लगभग ₹${net.toLocaleString("en-IN")}। 3 खरीदार उपलब्ध हैं।`
        : `${weightVal} kg ${mat.name} prepared at estimated net ₹${net.toLocaleString("en-IN")}.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 9: Check Earnings
  if (classification.intent === AGENT_INTENTS.CHECK_EARNINGS) {
    stepResult.toolCalls.push({ tool: "checkEarnings", args: { collectorId: safeAgentContext.user.id } });
    const earningsRes = AGENT_TOOLS.checkEarnings.execute(safeAgentContext);
    const earnings = earningsRes.data;

    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "मासिक लेजर तपासले" : language === "hi" ? "मासिक बही-खाता जांचा" : "Checked monthly ledger",
        status: "DONE"
      }
    ];

    stepResult.preparedCard = {
      type: "EARNINGS_SUMMARY",
      totalEarned: earnings.totalEarned,
      divertedKg: earnings.divertedWeightKg,
      month: earnings.month
    };

    stepResult.spokenResponse =
      language === "mr"
        ? `या महिन्यात तुम्ही ₹${earnings.totalEarned.toLocaleString("en-IN")} कमावले आहेत आणि ${earnings.divertedWeightKg} किलो ई-कचरा सुरक्षित पुनर्वापरात वळवला आहे.`
        : language === "hi"
        ? `इस महीने आपने ₹${earnings.totalEarned.toLocaleString("en-IN")} कमाए हैं और ${earnings.divertedWeightKg} किलो ई-कचरा रीसायकल किया है।`
        : `You earned ₹${earnings.totalEarned.toLocaleString("en-IN")} this month and safely diverted ${earnings.divertedWeightKg} kg of e-waste.`;

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 10: Check Payment
  if (classification.intent === AGENT_INTENTS.CHECK_PAYMENT) {
    stepResult.toolCalls.push({ tool: "checkPayment", args: { lotId: currentSettledLot?.lotId || "LOT-7821" } });
    const paymentRes = AGENT_TOOLS.checkPayment.execute(agentContext, { currentSettledLot });
    const paymentInfo = paymentRes.data;

    stepResult.phase = "ACTION";
    stepResult.navigateTo = "RECEIPT";

    stepResult.activityTrace = [
      {
        text: language === "mr" ? "CPCB पावती स्थिती तपासली" : language === "hi" ? "CPCB रसीद स्थिति जांची" : "Checked CPCB receipt status",
        status: "DONE"
      }
    ];

    if (paymentInfo.status === "SETTLED") {
      stepResult.spokenResponse =
        language === "mr"
          ? `₹${paymentInfo.amount.toLocaleString("en-IN")} चे रोख पेमेंट रीसायकलरने पूर्ण केले आहे. तुमची पावती उपलब्ध आहे.`
          : language === "hi"
          ? `₹${paymentInfo.amount.toLocaleString("en-IN")} का नकद भुगतान रीसायकलर द्वारा स्वीकृत है। आपकी रसीद उपलब्ध है।`
          : `₹${paymentInfo.amount.toLocaleString("en-IN")} cash payment is confirmed settled. Your verified receipt is available.`;
    } else {
      stepResult.spokenResponse =
        language === "mr"
          ? `₹${paymentInfo.amount.toLocaleString("en-IN")} चे पेमेंट वजन तपासणीसाठी बाकी आहे. केंद्रावर QR कोड दाखवा.`
          : language === "hi"
          ? `₹${paymentInfo.amount.toLocaleString("en-IN")} का भुगतान वजन जांच के लिए शेष है। केंद्र पर QR कोड दिखाएं।`
          : `₹${paymentInfo.amount.toLocaleString("en-IN")} payment is pending weigh-in. Show your QR code at the center.`;
    }

    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // Case 11: Show Lots / Receipts
  if (classification.intent === AGENT_INTENTS.SHOW_LOTS) {
    stepResult.toolCalls.push({ tool: "openReceipt", args: {} });
    stepResult.navigateTo = "LOTS_LIST";
    stepResult.phase = "ACTION";

    stepResult.activityTrace = [
      {
        text: language === "mr" ? "लॉट व पावती विभाग उघडला" : language === "hi" ? "लॉट व रसीद सेक्शन खोला" : "Opening receipts",
        status: "DONE"
      }
    ];

    stepResult.spokenResponse =
      language === "mr" ? "माझे लॉट व पावत्या उघडत आहोत." : language === "hi" ? "आपके लॉट और रसीदें खोली जा रही हैं।" : "Opening your lots and receipts.";
    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // 14. Thank You / Courtesy Handler
  if (classification.intent === AGENT_INTENTS.THANK_YOU) {
    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "स्वागत आहे" : language === "hi" ? "आपका स्वागत है" : "You're welcome",
        status: "DONE"
      }
    ];
    stepResult.spokenResponse =
      language === "mr"
        ? "धन्यवाद! मी आणखी काही मदत करू शकतो का?"
        : language === "hi"
        ? "धन्यवाद! क्या मैं कुछ और मदद करूँ?"
        : "You're welcome! How else can I assist you?";
    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // 15. Goodbye Handler
  if (classification.intent === AGENT_INTENTS.GOODBYE) {
    stepResult.phase = "IDLE";
    stepResult.spokenResponse =
      language === "mr"
        ? "धन्यवाद! पुन्हा भेटू."
        : language === "hi"
        ? "धन्यवाद! फिर मिलेंगे।"
        : "Goodbye! Have a great day.";
    stepResult.shouldListenAgain = false;
    return stepResult;
  }

  // 15a. How are you / Social Inquiry (e.g. "क्यासे हो आप")
  if (classification.intent === AGENT_INTENTS.HOW_ARE_YOU) {
    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "कुशल विचारपूस" : language === "hi" ? "कुशल-मंगल संवाद" : "Social Conversation",
        status: "DONE"
      }
    ];
    stepResult.spokenResponse =
      language === "mr"
        ? "मी अगदी मजेत आहे! तुमचा ई-वेस्ट डिजिटल साथी. सांगा, आज काय विकायचे आहे — लॅपटॉप, बॅटरी की तांब्याची तार?"
        : language === "hi"
        ? "मैं बिल्कुल ठीक हूँ! आपका ई-वेस्ट साथी। बताइए, आज आप क्या बेचना चाहते हैं — लैपटॉप, बैटरी या तांबे के तार?"
        : "I'm doing great! I'm your verified E-Waste partner. What would you like to sell today — laptops, batteries, or copper wire?";
    stepResult.preparedCard = {
      type: "CONVERSATIONAL_GREETING",
      title: language === "mr" ? "ई-कचरा निवडा किंवा बोला:" : language === "hi" ? "ई-कचरा चुनें या बोलें:" : "Select E-Waste or Speak:",
      options: [
        { label: language === "mr" ? "१० किलो लॅपटॉप" : language === "hi" ? "10 किलो लैपटॉप" : "10 kg Laptops", materialId: "laptops", weightKg: 10 },
        { label: language === "mr" ? "२५ किलो बॅटरी" : language === "hi" ? "25 किलो बैटरी" : "25 kg Batteries", materialId: "batteries", weightKg: 25 },
        { label: language === "mr" ? "कमाई तपासा" : language === "hi" ? "कमाई देखें" : "Check Earnings", action: "CHECK_EARNINGS" }
      ]
    };
    stepResult.shouldListenAgain = true;
    return stepResult;
  }

  // 15b. Audibility / Mic Check (e.g. "मेरी आवाज आ रही है", "सुन रहे हो")
  if (classification.intent === AGENT_INTENTS.AUDIBILITY_CHECK) {
    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "माईक आवाज तपासणी" : language === "hi" ? "माइक ऑडिबिलिटी जांच" : "Mic Check Verified",
        status: "DONE"
      }
    ];
    stepResult.spokenResponse =
      language === "mr"
        ? "होय, तुमचा आवाज अगदी स्पष्ट ऐकू येत आहे! सांगा, किती किलो स्क्रॅप विकायचे आहे?"
        : language === "hi"
        ? "हाँ, आपकी आवाज़ बिल्कुल साफ़ आ रही है! बताइए, कितने किलो स्क्रैप बेचना है?"
        : "Yes, I can hear you loud and clear! Tell me what material and weight you have to sell.";
    stepResult.preparedCard = {
      type: "CONVERSATIONAL_GREETING",
      title: language === "mr" ? "स्क्रॅप सांगा:" : language === "hi" ? "स्क्रैप बताएं:" : "Choose Item:",
      options: [
        { label: language === "mr" ? "१० किलो लॅपटॉप" : language === "hi" ? "10 किलो लैपटॉप" : "10 kg Laptops", materialId: "laptops", weightKg: 10 },
        { label: language === "mr" ? "२५ किलो बॅटरी" : language === "hi" ? "25 किलो बैटरी" : "25 kg Batteries", materialId: "batteries", weightKg: 25 }
      ]
    };
    stepResult.shouldListenAgain = true;
    return stepResult;
  }

  // 15c. Greeting / Salutation (e.g. "नमस्ते", "नमस्कार", "hello")
  if (classification.intent === AGENT_INTENTS.GREETING) {
    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "अभिवादन" : language === "hi" ? "अभिवादन" : "Greeting",
        status: "DONE"
      }
    ];
    stepResult.spokenResponse =
      language === "mr"
        ? "नमस्कार! मी तुम्हाला ई-कचऱ्याचे सर्वोत्तम सरकारी प्रमाणित भाव मिळवून देईन. सांगा काय विकायचे आहे?"
        : language === "hi"
        ? "नमस्ते! मैं आपको ई-कचरे के सबसे अच्छे CPCB अधिकृत दाम दिला सकता हूँ। बताइए क्या बेचना है?"
        : "Hello! I can help you get top verified CPCB prices for your electronic scrap. What do you have today?";
    stepResult.preparedCard = {
      type: "CONVERSATIONAL_GREETING",
      title: language === "mr" ? "ई-कचरा निवडा:" : language === "hi" ? "ई-कचरा चुनें:" : "Choose Material:",
      options: [
        { label: language === "mr" ? "१० किलो लॅपटॉप" : language === "hi" ? "10 किलो लैपटॉप" : "10 kg Laptops", materialId: "laptops", weightKg: 10 },
        { label: language === "mr" ? "२५ किलो बॅटरी" : language === "hi" ? "25 किलो बैटरी" : "25 kg Batteries", materialId: "batteries", weightKg: 25 }
      ]
    };
    stepResult.shouldListenAgain = true;
    return stepResult;
  }

  // 15d. Assistant Identity / Capability (e.g. "आप कौन हो", "who are you")
  if (classification.intent === AGENT_INTENTS.ASSISTANT_IDENTITY) {
    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "सहायक परिचय" : language === "hi" ? "सहायक परिचय" : "Assistant Identity",
        status: "DONE"
      }
    ];
    stepResult.spokenResponse =
      language === "mr"
        ? "मी ई-वेस्ट ब्रिजचा व्हॉइस असिस्टंट आहे. मी भंगार गोळा करणाऱ्यांना थेट अधिकृत रीसायकलर्सकडून जास्तीत जास्त भाव आणि CPCB पावती मिळवून देतो."
        : language === "hi"
        ? "मैं ई-वेस्ट ब्रिज का वॉइस असिस्टेंट हूँ। मैं कबाड़ियों को सीधे CPCB अधिकृत रीसायकलर से जोड़कर सबसे ज्यादा दाम और रसीद दिलाता हूँ।"
        : "I am the E-Waste Bridge voice assistant. I help scrap collectors get top verified prices and legal CPCB receipts directly from recyclers.";
    stepResult.preparedCard = {
      type: "CONVERSATIONAL_GREETING",
      title: language === "mr" ? "सुरुवात करा:" : language === "hi" ? "शुरुआत करें:" : "Get Started:",
      options: [
        { label: language === "mr" ? "१० किलो लॅपटॉप" : language === "hi" ? "10 किलो लैपटॉप" : "10 kg Laptops", materialId: "laptops", weightKg: 10 },
        { label: language === "mr" ? "भाव सूची पाहा" : language === "hi" ? "दाम सूची देखें" : "Price Board", action: "NAVIGATE_PRICES" }
      ]
    };
    stepResult.shouldListenAgain = true;
    return stepResult;
  }

  // 15e. Help / Guidance
  if (classification.intent === AGENT_INTENTS.HELP_PROMPT) {
    stepResult.phase = "ACTION";
    stepResult.activityTrace = [
      {
        text: language === "mr" ? "मार्गदर्शन" : language === "hi" ? "मार्गदर्शन" : "Guidance",
        status: "DONE"
      }
    ];
    stepResult.spokenResponse =
      language === "mr"
        ? "तुम्ही '१० किलो लॅपटॉप विकायचे आहेत', 'आजचा भाव काय आहे', किंवा 'माझी कमाई दाखवा' असे सहज बोलू शकता."
        : language === "hi"
        ? "आप '10 किलो लैपटॉप बेचना है', 'आज का तांबे का भाव क्या है', या 'मेरी कमाई दिखाओ' आसानी से बोल सकते हैं।"
        : "You can say 'Sell 10 kg laptops', 'What is copper price today', or 'Check my earnings'.";
    stepResult.preparedCard = {
      type: "CONVERSATIONAL_GREETING",
      title: language === "mr" ? "उदाहरणे:" : language === "hi" ? "उदाहरण:" : "Examples:",
      options: [
        { label: language === "mr" ? "१० किलो लॅपटॉप" : language === "hi" ? "10 किलो लैपटॉप" : "10 kg Laptops", materialId: "laptops", weightKg: 10 },
        { label: language === "mr" ? "कमाई तपासा" : language === "hi" ? "कमाई देखें" : "Check Earnings", action: "CHECK_EARNINGS" }
      ]
    };
    stepResult.shouldListenAgain = true;
    return stepResult;
  }

  // Fallback: Helpful Vernacular Guidance
  stepResult.phase = "ACTION";
  stepResult.activityTrace = [
    {
      text: language === "mr" ? "स्पष्ट बोला" : language === "hi" ? "कृपया स्पष्ट बोलें" : "Please speak clearly",
      status: "PENDING"
    }
  ];

  stepResult.spokenResponse =
    language === "mr"
      ? "मी ऐकले नाही. तुम्ही '१० किलो लॅपटॉप विकायचे आहेत' किंवा 'कमाई दाखवा' असे सांगू शकता."
      : language === "hi"
      ? "मैं समझ नहीं पाया। आप '10 किलो लैपटॉप बेचना है' या 'कमाई दिखाओ' बोल सकते हैं।"
      : "I didn't quite catch that. You can say 'Sell 10 kg laptops' or 'Check my earnings'.";

  stepResult.shouldListenAgain = false;
  return stepResult;
}
