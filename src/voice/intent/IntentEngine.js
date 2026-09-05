/**
 * IntentEngine.js - Vernacular Intent Classification & Semantic Equivalence Engine
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { entityExtractor } from './EntityExtractor.js';
import { ContextEngine } from '../context/ContextEngine.js';
import { detectNonEWaste } from '../../services/voiceAgentEngine.js';

export class IntentEngine {
  classify(cleanText, context = {}) {
    if (!cleanText || typeof cleanText !== 'string') {
      return { intent: 'UNKNOWN', confidence: 0.0, entities: {} };
    }

    const lower = cleanText.toLowerCase().trim();

    // 0. Non-E-Waste Guard (Vegetables, Grains, General Scrap)
    const nonEWaste = detectNonEWaste(lower);
    if (nonEWaste && nonEWaste.detected) {
      return {
        intent: 'REJECT_NON_EWASTE',
        confidence: 0.99,
        entities: {
          rejectedItem: nonEWaste.item,
          category: nonEWaste.category,
          categoryKey: nonEWaste.categoryKey
        }
      };
    }

    const entities = entityExtractor.extract(cleanText);

    // 1. Consequential Action: Accept Offer
    if (/\b(accept|manzoor|pakka karo|confirm karo|soda pakka|le lo|deal done)\b/i.test(lower)) {
      const referencedOffer = ContextEngine.resolveReference(lower, context);
      return {
        intent: 'REQUEST_ACCEPT_OFFER',
        confidence: 0.98,
        entities: {
          ...entities,
          offerIndex: referencedOffer ? referencedOffer.index : (context.selectedOfferIndex ?? 0)
        }
      };
    }

    // 2. Offer Explanation: "Beech wala kyun?" / "Explain"
    if (/\b(kyun|why|karan|reason|batao|explain)\b/i.test(lower) && context.screen === 'MARKETPLACE') {
      const referencedOffer = ContextEngine.resolveReference(lower, context);
      return {
        intent: 'EXPLAIN_OFFER',
        confidence: 0.95,
        entities: {
          offerIndex: referencedOffer ? referencedOffer.index : 1
        }
      };
    }

    // 3. Offer Selection / Card Grounding: "Beech wala", "Pahla wala", "Second one"
    if (context.screen === 'MARKETPLACE') {
      const referencedOffer = ContextEngine.resolveReference(lower, context);
      if (referencedOffer) {
        return {
          intent: 'SELECT_OFFER',
          confidence: 0.96,
          entities: {
            offerIndex: referencedOffer.index,
            offer: referencedOffer.offer,
            reason: referencedOffer.reason
          }
        };
      }
    }

    // 4. Stepper Update: "Weight 7 kilo kar do" / "actually 11 kilo"
    if (entities.weightKg !== undefined && (context.screen === 'SCANNER' || /\b(kar do|badlo|karo|change|wajan|weight)\b/i.test(lower))) {
      return {
        intent: 'UPDATE_DRAFT',
        confidence: 0.94,
        entities
      };
    }

    // 5. Colloquial Buyer Search: "buyer dikhao", "kaun kharidega?", "koi lene wala hai?"
    if (/\b(buyer|kharidega|lene wala|dhoondo|dikhao|bhechna|sell|market|kisko bechu)\b/i.test(lower)) {
      return {
        intent: 'FIND_BUYERS',
        confidence: 0.97,
        entities
      };
    }

    // 6. Market Rates Query: "aaj ka bhav", "market rate kya hai"
    if (/\b(rate|bhav|daam|price|msp|benchmark)\b/i.test(lower)) {
      return {
        intent: 'QUERY_RATES',
        confidence: 0.92,
        entities
      };
    }

    // 7. Navigation: "Cancel", "Roko", "Wapas jao"
    if (/\b(cancel|roko|wapas|piche|back|chhod do|band karo)\b/i.test(lower)) {
      return {
        intent: 'CANCEL_BACK',
        confidence: 0.99,
        entities: {}
      };
    }

    // 8. General Lot Creation if material and/or weight is present
    if (entities.material || entities.weightKg) {
      return {
        intent: 'CREATE_DRAFT_LOT',
        confidence: 0.90,
        entities
      };
    }

    return {
      intent: 'UNKNOWN',
      confidence: 0.40,
      entities
    };
  }
}

export const intentEngine = new IntentEngine();
