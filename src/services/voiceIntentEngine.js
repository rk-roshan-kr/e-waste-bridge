// E-Waste Bridge: Structured Multimodal Voice Intent Engine
// Browser Speech Input -> Local Intent & Entity Extraction -> Visual Confirmation -> Application Action
// 100% deterministic, zero-cloud dependency, handles colloquial dialects & code-switching

import { MATERIAL_TAXONOMY } from "../data/materialTaxonomy";

export const INTENT_TYPES = {
  SELL_SCRAP: "SELL_SCRAP",
  VIEW_BUYERS: "VIEW_BUYERS",
  BEST_OFFER: "BEST_OFFER",
  ACCEPT_OFFER: "ACCEPT_OFFER",
  CHECK_PAYMENT: "CHECK_PAYMENT",
  CHECK_EARNINGS: "CHECK_EARNINGS",
  SHOW_LOTS: "SHOW_LOTS",
  START_CAMERA: "START_CAMERA",
  NAVIGATE_HOME: "NAVIGATE_HOME",
  CONFIRM_ACTION: "CONFIRM_ACTION",
  CANCEL_ACTION: "CANCEL_ACTION",
  RECYCLER_DEMAND: "RECYCLER_DEMAND",
  UNKNOWN: "UNKNOWN"
};

const MATERIAL_KEYWORDS = {
  smartphones: [
    "mobile", "mobail", "mobyle", "phone", "fon", "fawn", "smartphone", "smart-phone",
    "मोबाईल", "मोबाइल", "फोन", "स्मार्टफोन", "dabba", "डब्बा"
  ],
  laptops: [
    "laptop", "laptap", "leptop", "lep-top", "computer", "komputer", "pc",
    "लॅपटॉप", "लैपटॉप", "संगणक", "कंप्यूटर"
  ],
  pcb: [
    "pcb", "motherboard", "madarboard", "circuit", "board", "green board",
    "मदरबोर्ड", "पीसीबी", "सर्किट", "बोर्ड"
  ],
  pcb_mixed: [
    "pcb", "motherboard", "madarboard", "circuit", "board", "green board",
    "मदरबोर्ड", "पीसीबी", "सर्किट", "बोर्ड"
  ],
  batteries: [
    "battery", "betri", "betry", "cell", "sel", "lithium", "li-ion",
    "बॅटरी", "बैटरी", "सेल", "लिथियम"
  ],
  lithium_batteries: [
    "battery", "betri", "betry", "cell", "sel", "lithium", "li-ion",
    "बॅटरी", "बैटरी", "सेल", "लिथियम"
  ],
  cables: [
    "cable", "kewal", "kable", "wire", "tamba", "taamba", "taar", "copper",
    "केबल", "वायर", "तार", "तांबे", "तांबा"
  ],
  cables_copper: [
    "cable", "kewal", "kable", "wire", "tamba", "taamba", "taar", "copper",
    "केबल", "वायर", "तार", "तांबे", "तांबा"
  ],
  motors_magnets: [
    "motor", "magnet", "chumbak", "chumbak scrap", "rare earth", "neodymium", "fan motor", "stator",
    "मोटर", "चुंबक", "मॅग्नेट", "मॅग्नेट स्क्रॅप"
  ],
  crt: [
    "crt", "tv", "monitor", "screen", "tube",
    "सीआरटी", "टीव्ही", "टीवी", "मॉनिटर", "काच"
  ],
  crt_monitors: [
    "crt", "tv", "monitor", "screen", "tube",
    "सीआरटी", "टीव्ही", "टीवी", "मॉनिटर", "काच"
  ],
  abs_plastic: [
    "plastic", "plastik", "abs", "casing", "body", "cabinet",
    "प्लॅस्टिक", "प्लास्टिक", "कॅबिनेट"
  ]
};

const NUMBER_WORDS = {
  "ek": 1, "एक": 1, "one": 1,
  "don": 2, "do": 2, "दोन": 2, "दो": 2, "two": 2,
  "teen": 3, "तीन": 3, "three": 3,
  "char": 4, "chaar": 4, "चार": 4, "four": 4,
  "paanch": 5, "panch": 5, "पाच": 5, "पांच": 5, "five": 5,
  "saha": 6, "chhe": 6, "सहा": 6, "छह": 6, "six": 6,
  "saat": 7, "सात": 7, "seven": 7,
  "aath": 8, "आठ": 8, "eight": 8,
  "nau": 9, "nav": 9, "नऊ": 9, "नौ": 9, "nine": 9,
  "dus": 10, "dah": 10, "दहा": 10, "दस": 10, "ten": 10,
  "pandhra": 15, "pandrah": 15, "पंधरा": 15, "पंद्रह": 15, "fifteen": 15,
  "vees": 20, "bees": 20, "वीस": 20, "बीस": 20, "twenty": 20,
  "panchees": 25, "pachees": 25, "पंचवीस": 25, "पच्चीस": 25, "twenty five": 25,
  "tis": 30, "tees": 30, "तीस": 30, "thirty": 30,
  "panas": 50, "pachaas": 50, "पन्नास": 50, "पचास": 50, "fifty": 50
};

export function extractMaterial(text = "") {
  const lower = text.toLowerCase();
  for (const [matId, keywords] of Object.entries(MATERIAL_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return MATERIAL_TAXONOMY.find((m) => m.id === matId) || null;
      }
    }
  }
  return null;
}

export function extractWeight(text = "") {
  const lower = text.toLowerCase();
  
  const digitMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|किलो|केजी)/i);
  if (digitMatch && digitMatch[1]) {
    return parseFloat(digitMatch[1]);
  }

  const standaloneDigit = lower.match(/\b(\d+(?:\.\d+)?)\b/);
  if (standaloneDigit && standaloneDigit[1]) {
    const val = parseFloat(standaloneDigit[1]);
    if (val > 0 && val < 500) return val;
  }

  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    if (lower.includes(word)) {
      return num;
    }
  }

  return null;
}

export function extractPrice(text = "") {
  const lower = text.toLowerCase();
  const match = lower.match(/(?:rupaye|rs|inr|₹|दर|भाव|रुपये|रूपये)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:rupaye|rs|inr|₹|तक|tak)/i);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Returns a structured command from speech input
 */
export function parseVoiceIntent(transcript = "", language = "mr") {
  const raw = transcript.trim();
  const lower = raw.toLowerCase();

  // 1. Confirmation Tokens
  if (
    /^(haan|ha|haa|hnn|yes|ok|sahi hai|theek hai|ho|chalta|chalel|chalega|done|confirm|खात्री|हो|हाँ|सही|ठीक|स्वीकार)/i.test(lower) ||
    lower.includes("sahi hai") ||
    lower.includes("chalega") ||
    lower.includes("karo confirm") ||
    lower.includes("होय")
  ) {
    return {
      intent: INTENT_TYPES.CONFIRM_ACTION,
      entities: {},
      confidence: 0.98,
      requiresConfirmation: false,
      action: "EXECUTE_CONFIRMED",
      raw,
      language
    };
  }

  // 2. Cancellation Tokens
  if (
    /^(nahi|nahin|no|cancel|nako|ruko|rehne do|thamba|रद्द|नाही|नहीं|नको|थांबा)/i.test(lower)
  ) {
    return {
      intent: INTENT_TYPES.CANCEL_ACTION,
      entities: {},
      confidence: 0.98,
      requiresConfirmation: false,
      action: "ABORT",
      raw,
      language
    };
  }

  // 3. Recycler Demand Procurement Intent
  if (
    (lower.includes("chahiye") || lower.includes("खरीदना") || lower.includes("मागणी") || lower.includes("requirement") || lower.includes("procure") || lower.includes("buy") || lower.includes("order") || lower.includes("purchase") || lower.includes("खरेदी") || lower.includes("tak") || lower.includes("rate")) &&
    (lower.includes("kilo") || lower.includes("kg") || lower.includes("plastic") || lower.includes("pcb") || lower.includes("battery") || lower.includes("laptop") || lower.includes("mobile"))
  ) {
    const mat = extractMaterial(lower) || MATERIAL_TAXONOMY[6]; // default ABS plastic
    const qty = extractWeight(lower) || 50;
    const price = extractPrice(lower) || (mat.baseBenchmarkRatePerKg || 30);

    return {
      intent: INTENT_TYPES.RECYCLER_DEMAND,
      entities: {
        material: mat.id,
        materialName: mat.name,
        quantity: qty,
        unit: "kg",
        targetPrice: price,
        validityDays: 7
      },
      confidence: 0.92,
      requiresConfirmation: true,
      action: "OPEN_BUY_DEMAND_MODAL",
      raw,
      language
    };
  }

  // 4. Earnings Inquiry
  if (
    lower.includes("kamaya") ||
    lower.includes("kamai") ||
    lower.includes("कमाई") ||
    lower.includes("पैसे किती") ||
    lower.includes("earnings") ||
    lower.includes("balance") ||
    lower.includes("aaj kitna")
  ) {
    return {
      intent: INTENT_TYPES.CHECK_EARNINGS,
      entities: {},
      confidence: 0.95,
      requiresConfirmation: false,
      action: "SHOW_EARNINGS_MODAL",
      raw,
      language
    };
  }

  // 5. Payment / Settlement Inquiry (State-Aware)
  if (
    lower.includes("payment") ||
    lower.includes("paisa mila") ||
    lower.includes("voucher") ||
    lower.includes("receipt") ||
    lower.includes("पावती") ||
    lower.includes("रसीद") ||
    lower.includes("पैसे मिळाले") ||
    lower.includes("bhugtan")
  ) {
    return {
      intent: INTENT_TYPES.CHECK_PAYMENT,
      entities: {},
      confidence: 0.93,
      requiresConfirmation: false,
      action: "NAVIGATE_RECEIPT",
      raw,
      language
    };
  }

  // 6. Best Buyer Inquiry
  if (
    lower.includes("sabse achha") ||
    lower.includes("achha buyer") ||
    lower.includes("zyada paisa") ||
    lower.includes("best offer") ||
    lower.includes("सर्वोत्तम") ||
    lower.includes("जास्त भाव") ||
    lower.includes("सर्वात जास्त") ||
    lower.includes("top buyer")
  ) {
    return {
      intent: INTENT_TYPES.BEST_OFFER,
      entities: {},
      confidence: 0.94,
      requiresConfirmation: false,
      action: "HIGHLIGHT_BEST_OFFER",
      raw,
      language
    };
  }

  // 7. Consequential Action: Accept Offer (Mandatory Confirmation)
  if (
    lower.includes("accept") ||
    lower.includes("pakka karo") ||
    lower.includes("deal pakka") ||
    lower.includes("स्वीकार") ||
    lower.includes("मंजूर") ||
    lower.includes("bech do") ||
    lower.includes("viko")
  ) {
    return {
      intent: INTENT_TYPES.ACCEPT_OFFER,
      entities: {},
      confidence: 0.96,
      requiresConfirmation: true,
      action: "CONFIRM_ACCEPT_OFFER",
      raw,
      language
    };
  }

  // 8. Show Lots / Transactions
  if (
    lower.includes("lot dikhao") ||
    lower.includes("mera lot") ||
    lower.includes("pichla transaction") ||
    lower.includes("माझे लॉट") ||
    lower.includes("इतिहास") ||
    lower.includes("transactions") ||
    lower.includes("history")
  ) {
    return {
      intent: INTENT_TYPES.SHOW_LOTS,
      entities: {},
      confidence: 0.94,
      requiresConfirmation: false,
      action: "NAVIGATE_LOTS",
      raw,
      language
    };
  }

  // 9. Buyer Demand View
  if (
    lower.includes("buyer dikhao") ||
    lower.includes("buyers") ||
    lower.includes("kharidar") ||
    lower.includes("खरेदीदार") ||
    lower.includes("मार्केट") ||
    lower.includes("marketplace")
  ) {
    return {
      intent: INTENT_TYPES.VIEW_BUYERS,
      entities: {},
      confidence: 0.91,
      requiresConfirmation: false,
      action: "NAVIGATE_MARKETPLACE",
      raw,
      language
    };
  }

  // 10. Camera Scan
  if (
    lower.includes("camera") ||
    lower.includes("photo") ||
    lower.includes("foto") ||
    lower.includes("फोटो") ||
    lower.includes("कॅमेरा")
  ) {
    return {
      intent: INTENT_TYPES.START_CAMERA,
      entities: {},
      confidence: 0.95,
      requiresConfirmation: false,
      action: "LAUNCH_CAMERA",
      raw,
      language
    };
  }

  // 11. Scrap Selling (Primary Entry Point)
  const matchedMat = extractMaterial(lower);
  const matchedWeight = extractWeight(lower);

  if (
    matchedMat ||
    lower.includes("bechna") ||
    lower.includes("vikaycha") ||
    lower.includes("sell") ||
    lower.includes("scrap") ||
    lower.includes("kachra") ||
    lower.includes("कचरा") ||
    lower.includes("विकायचे") ||
    lower.includes("बेचना")
  ) {
    const mat = matchedMat || MATERIAL_TAXONOMY[0];
    const qty = matchedWeight || mat.sampleImages[0]?.weightEst || 10.0;
    return {
      intent: INTENT_TYPES.SELL_SCRAP,
      entities: {
        material: mat.id,
        materialName: mat.name,
        quantity: qty,
        unit: "kg"
      },
      confidence: 0.93,
      requiresConfirmation: true,
      action: "PREPARE_LOT",
      raw,
      language
    };
  }

  // Fallback
  return {
    intent: INTENT_TYPES.UNKNOWN,
    entities: {},
    confidence: 0.3,
    requiresConfirmation: false,
    action: "PROMPT_HELP",
    raw,
    language
  };
}

/**
 * Builds state-aware verbal response and visual confirmation card props
 */
export function buildVoiceResponse(command, language = "mr", contextState = {}) {
  const { currentSettledLot, activeLotDraft } = contextState;

  if (command.intent === INTENT_TYPES.SELL_SCRAP) {
    const matName = command.entities.materialName || "Scrap";
    const weight = command.entities.quantity || 10;

    if (language === "mr") {
      return {
        spoken: `${matName} चा लॉट तयार करायचा आहे का? वजन अंदाजे ${weight} किलो. 'हो' बोलून पुष्टी करा.`,
        title: `${weight} kg ${matName}`,
        actionLabel: `${weight} किलो ${matName} चा लॉट तयार करा`,
        confirmText: "हो, सुरू करा",
        cancelText: "रद्द करा",
        nextStep: "SCANNER"
      };
    }
    if (language === "hi") {
      return {
        spoken: `${matName} का लॉट बनाना है? लगभग ${weight} किलो. 'हाँ' बोलकर कन्फर्म करें.`,
        title: `${weight} kg ${matName}`,
        actionLabel: `${weight} किलो ${matName} का लॉट बनाएं`,
        confirmText: "हाँ, शुरू करें",
        cancelText: "रद्द करें",
        nextStep: "SCANNER"
      };
    }
    return {
      spoken: `Create a lot for ${weight} kg of ${matName}? Say 'Yes' to confirm.`,
      title: `${weight} kg ${matName}`,
      actionLabel: `Prepare ${weight} kg ${matName} Lot`,
      confirmText: "Yes, Proceed",
      cancelText: "Cancel",
      nextStep: "SCANNER"
    };
  }

  // Consequential: Accept Offer
  if (command.intent === INTENT_TYPES.ACCEPT_OFFER) {
    const amount = activeLotDraft?.selectedOffer?.netPayout || 2450;
    const buyer = activeLotDraft?.selectedOffer?.recyclerName || "Verified Recycler";

    if (language === "mr") {
      return {
        spoken: `तुम्हाला ₹${amount} ची ${buyer} ची ऑफर स्वीकारायची आहे का? 'हो' बोलून पुष्टी करा.`,
        title: `ऑफर स्वीकारा: ₹${amount}`,
        actionLabel: `${buyer} ची ₹${amount} ऑफर स्वीकारा`,
        confirmText: "हो, स्वीकारा",
        cancelText: "रद्द करा",
        nextStep: "RECEIPT"
      };
    }
    if (language === "hi") {
      return {
        spoken: `क्या आपको ₹${amount} का ${buyer} का ऑफर स्वीकार करना है? 'हाँ' बोलकर कन्फर्म करें.`,
        title: `ऑफर स्वीकारें: ₹${amount}`,
        actionLabel: `${buyer} का ₹${amount} ऑफर स्वीकारें`,
        confirmText: "हाँ, स्वीकार करें",
        cancelText: "रद्द करें",
        nextStep: "RECEIPT"
      };
    }
    return {
      spoken: `Do you want to accept the ₹${amount} offer from ${buyer}? Say 'Yes' to confirm.`,
      title: `Accept Offer: ₹${amount}`,
      actionLabel: `Accept ₹${amount} offer from ${buyer}`,
      confirmText: "Yes, Accept",
      cancelText: "Cancel",
      nextStep: "RECEIPT"
    };
  }

  // State-Aware Payment Status
  if (command.intent === INTENT_TYPES.CHECK_PAYMENT) {
    const isSettled = currentSettledLot && currentSettledLot.status === "SETTLED";
    const amount = currentSettledLot?.netPayout || 2940;

    if (isSettled) {
      if (language === "mr") {
        return {
          spoken: `₹${amount} चे रोख पेमेंट रिसायकलरने पूर्ण केले आहे. तुमची प्रमाणित पावती तयार आहे.`,
          title: `रोख पेमेंट प्रमाणित: ₹${amount}`,
          actionLabel: "प्रमाणित पावती व ट्रॅक कोड",
          confirmText: "पावती पाहा",
          cancelText: "बंद करा",
          nextStep: "RECEIPT"
        };
      }
      if (language === "hi") {
        return {
          spoken: `₹${amount} का नकद सेटलमेंट रीसायकलर ने कन्फर्म कर दिया है. आपकी प्रमाणित रसीद उपलब्ध है.`,
          title: `नकद भुगतान प्रमाणित: ₹${amount}`,
          actionLabel: "प्रमाणित रसीद और ट्रैक कोड",
          confirmText: "रसीद देखें",
          cancelText: "बंद करें",
          nextStep: "RECEIPT"
        };
      }
      return {
        spoken: `₹${amount} cash settlement was confirmed by the recycler. Your verified receipt is available.`,
        title: `Cash Settled: ₹${amount}`,
        actionLabel: "Verified Receipt & Trace Code",
        confirmText: "View Receipt",
        cancelText: "Close",
        nextStep: "RECEIPT"
      };
    } else {
      // Payment Pending State
      if (language === "mr") {
        return {
          spoken: `₹${amount} चे पेमेंट अद्याप बाकी आहे. पुनर्वापर केंद्रावर वजन करताना QR कोड दाखवा.`,
          title: `पेमेंट बाकी: ₹${amount}`,
          actionLabel: "काट्यावर वजन व पैसे बाकी",
          confirmText: "पावती पाहा",
          cancelText: "बंद करा",
          nextStep: "RECEIPT"
        };
      }
      if (language === "hi") {
        return {
          spoken: `₹${amount} का सेटलमेंट अभी पेंडिंग है. रीसायकल केंद्र पर तौल के समय QR कोड दिखाएं.`,
          title: `भुगतान शेष: ₹${amount}`,
          actionLabel: "वजन जांच व भुगतान लंबित",
          confirmText: "रसीद देखें",
          cancelText: "बंद करें",
          nextStep: "RECEIPT"
        };
      }
      return {
        spoken: `₹${amount} settlement is pending intake weigh-in. Show your QR code at the facility.`,
        title: `Settlement Pending: ₹${amount}`,
        actionLabel: "Pending Weigh-in at Center",
        confirmText: "View Code",
        cancelText: "Close",
        nextStep: "RECEIPT"
      };
    }
  }

  // Earnings Summary
  if (command.intent === INTENT_TYPES.CHECK_EARNINGS) {
    if (language === "mr") {
      return {
        spoken: "या महिन्यात तुम्ही ₹१४,८२० रोख रक्कम कमावली आहे आणि १८२ किलो ई-कचरा सुरक्षित पुनर्वापराकडे पाठवला आहे.",
        title: "या महिन्याची कमाई: ₹१४,८२०",
        actionLabel: "१८२ किलो कचरा पुनर्वापरात वळवला",
        confirmText: "ठीक आहे",
        cancelText: "बंद करा",
        nextStep: "HOME"
      };
    }
    if (language === "hi") {
      return {
        spoken: "इस महीने आपने ₹14,820 नकद कमाए हैं और 182 किलो ई-कचरा सुरक्षित रीसायकल किया है.",
        title: "इस माह की कमाई: ₹14,820",
        actionLabel: "182 किलो कचरा रीसायकल किया",
        confirmText: "ठीक है",
        cancelText: "बंद करें",
        nextStep: "HOME"
      };
    }
    return {
      spoken: "You earned ₹14,820 cash this month and diverted 182 kg of e-waste safely.",
      title: "Monthly Earnings: ₹14,820",
      actionLabel: "182 kg Diverted Safely",
      confirmText: "OK",
      cancelText: "Close",
      nextStep: "HOME"
    };
  }

  // Best Net Offer
  if (command.intent === INTENT_TYPES.BEST_OFFER) {
    if (language === "mr") {
      return {
        spoken: "३ अधिकृत खरेदीदार मिळाले आहेत. सर्वात जास्त ₹२,४५० 'महाग्रीन' देत आहे. ऑफर पाहायची का?",
        title: "सर्वोत्तम नेट ऑफर: ₹२,४५०",
        actionLabel: "महाग्रीन • पिकअप खर्च वजा करून हातात निव्वळ रोख",
        confirmText: "हो, ऑफर दाखवा",
        cancelText: "नाही",
        nextStep: "MARKETPLACE"
      };
    }
    if (language === "hi") {
      return {
        spoken: "3 सत्यापित खरीदार मिले हैं. सबसे अच्छा नेट ऑफर ₹2,450 महाग्रीन का है. क्या ऑफर देखना है?",
        title: "सर्वोत्तम नेट ऑफर: ₹2,450",
        actionLabel: "महाग्रीन • पिकअप काटकर शुद्ध नकद",
        confirmText: "हाँ, ऑफर दिखाएं",
        cancelText: "नहीं",
        nextStep: "MARKETPLACE"
      };
    }
    return {
      spoken: "Found 3 verified buyers. Best net payout is ₹2,450 from MahaGreen. View offers?",
      title: "Best Net Offer: ₹2,450",
      actionLabel: "MahaGreen • Net Cash in Hand",
      confirmText: "Yes, View Offers",
      cancelText: "No",
      nextStep: "MARKETPLACE"
    };
  }

  // Recycler Procurement Intent
  if (command.intent === INTENT_TYPES.RECYCLER_DEMAND) {
    const qty = command.entities.quantity || 50;
    const price = command.entities.targetPrice || 30;
    const matName = command.entities.materialName || "ABS Plastic";

    return {
      spoken: `${qty} kg ${matName} ₹${price}/kg par Buy Requirement create ki ja rahi hai. Confirm karein.`,
      title: `Buy Requirement: ${qty} kg ${matName}`,
      actionLabel: `Post standing demand @ ₹${price}/kg`,
      confirmText: "Confirm Post",
      cancelText: "Cancel",
      nextStep: "RECYCLER_DEMAND"
    };
  }

  // Default fallback
  if (language === "mr") {
    return {
      spoken: "मला समजले नाही. तुम्ही '१० किलो लॅपटॉप विकायचे आहेत' किंवा 'कमाई दाखवा' असे सांगू शकता.",
      title: "आवाज सहाय्यक मदत",
      actionLabel: "उदा. '१० किलो लॅपटॉप' किंवा 'माझे लॉट'",
      confirmText: "पुन्हा प्रयत्न करा",
      cancelText: "बंद करा",
      nextStep: "HOME"
    };
  }
  if (language === "hi") {
    return {
      spoken: "माफ कीजिए, समझ नहीं आया. आप '10 किलो लैपटॉप बेचना है' या 'कमाई दिखाओ' बोल सकते हैं.",
      title: "आवाज सहायक सहायता",
      actionLabel: "उदा. '10 किलो लैपटॉप' या 'मेरे लॉट'",
      confirmText: "दोबारा बोलें",
      cancelText: "बंद करें",
      nextStep: "HOME"
    };
  }
  return {
    spoken: "I didn't catch that. You can say 'Sell 10 kg laptop' or 'Show my earnings'.",
    title: "Voice Assistant Help",
    actionLabel: "e.g. 'Sell 10 kg laptop' or 'Show earnings'",
    confirmText: "Try Again",
    cancelText: "Close",
    nextStep: "HOME"
  };
}

// Re-export Collector Voice Agent with persistent application context & tool calling
export {
  createAgentContext,
  processAgentUtterance,
  AGENT_TOOLS,
  AGENT_INTENTS
} from "./voiceAgentEngine";
