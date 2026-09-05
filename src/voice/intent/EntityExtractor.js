/**
 * EntityExtractor.js - E-Waste Entity Slot Extraction Engine
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { DomainDictionary } from '../../data/domainDictionary.js';

export class EntityExtractor {
  extract(text) {
    if (!text || typeof text !== 'string') return {};

    const lower = text.toLowerCase();
    const entities = {};

    // 1. Extract Material
    for (const item of DomainDictionary.slangMappings) {
      for (const pat of item.patterns) {
        if (pat.test(lower)) {
          entities.material = item.canonicalEntity;
          entities.cpcbCode = item.cpcbCode;
          entities.hazardous = item.hazardous;
          break;
        }
      }
      if (entities.material) break;
    }

    // 2. Extract Weight in kg
    const weightMatch = lower.match(/(\d+(\.\d+)?)\s*(kilo|kg|kilogram|kilos)?/i);
    if (weightMatch) {
      entities.weightKg = parseFloat(weightMatch[1]);
    } else {
      // Check vernacular number words
      const words = lower.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (DomainDictionary.vernacularNumbers[word] !== undefined) {
          if (i + 1 < words.length && /^(kilo|kg|kilogram|kilos)$/i.test(words[i + 1])) {
            entities.weightKg = DomainDictionary.vernacularNumbers[word];
            break;
          } else if (!entities.weightKg) {
            entities.weightKg = DomainDictionary.vernacularNumbers[word];
          }
        }
      }
    }

    // 3. Extract Units / Count
    const unitMatch = lower.match(/(\d+)\s*(piece|pieces|nag|unit|units|dabba)/i);
    if (unitMatch) {
      entities.unitsCount = parseInt(unitMatch[1], 10);
    }

    return entities;
  }
}

export const entityExtractor = new EntityExtractor();
