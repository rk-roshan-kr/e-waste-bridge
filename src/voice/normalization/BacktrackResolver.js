/**
 * BacktrackResolver.js - Multi-Field In-Utterance Backtracking & State Correction
 * Part of E-Waste Speech Intelligence Layer
 * Resolves corrections across Weight, Material, Price, and Offer Selection.
 */

import { DomainDictionary } from '../../data/domainDictionary.js';

export class BacktrackResolver {
  constructor() {
    this.backtrackMarkers = /\b(actually|nahi|no|badal kar|sorry|woh nahi|dus nahi|nahi nahi|wait)\b/i;
  }

  resolve(text) {
    if (!text || typeof text !== 'string') {
      return { text, wasCorrected: false, corrections: [] };
    }

    const match = text.match(this.backtrackMarkers);
    if (!match) {
      return { text, wasCorrected: false, corrections: [] };
    }

    const markerIndex = match.index;
    const preText = text.substring(0, markerIndex).trim();
    const postText = text.substring(markerIndex + match[0].length).trim();

    const corrections = [];

    // 1. Numeric Weight / Price Correction (e.g., "10 kilo... actually 11 kilo", "₹30... nahi ₹32")
    const preNumber = this.extractNumber(preText);
    const postNumber = this.extractNumber(postText);

    if (postNumber !== null && preNumber !== null && postNumber !== preNumber) {
      const isPrice = /₹|rupee|rupees|bhav|daam|rate/i.test(text);
      corrections.push({
        field: isPrice ? 'targetPrice' : 'weightKg',
        oldValue: preNumber,
        newValue: postNumber
      });

      // Swap the old number with the new number in preText so material context is preserved
      let replacedPre = preText.replace(new RegExp(`\\b(${preNumber}|dus|das|ek|do|teen|chaar|paanch|gyarah|barah|kilo)\\b`, 'gi'), (matched) => {
        if (/kilo/i.test(matched)) return 'kilo';
        return `${postNumber}`;
      });

      // Strip redundant number from start of postText
      const cleanPost = postText.replace(new RegExp(`^\\s*(${postNumber}|kilo|kg|hain|hai)\\s*`, 'i'), '').trim();
      const combined = `${replacedPre} ${cleanPost}`.replace(/\s+/g, ' ').trim();

      return {
        text: combined || postText,
        wasCorrected: true,
        previousValue: preNumber,
        correctedValue: postNumber,
        entityType: isPrice ? 'PRICE' : 'WEIGHT',
        corrections
      };
    }

    // 2. Material Correction (e.g., "Mobile... no, laptop")
    const preMaterial = this.extractMaterial(preText);
    const postMaterial = this.extractMaterial(postText);

    if (postMaterial && preMaterial && postMaterial !== preMaterial) {
      corrections.push({
        field: 'material',
        oldValue: preMaterial,
        newValue: postMaterial
      });

      return {
        text: postText,
        wasCorrected: true,
        previousValue: preMaterial,
        correctedValue: postMaterial,
        entityType: 'MATERIAL',
        corrections
      };
    }

    // 3. Offer Index Selection Correction (e.g., "Second... sorry, third buyer")
    const preIndex = this.extractOrdinalIndex(preText);
    const postIndex = this.extractOrdinalIndex(postText);

    if (postIndex !== null && preIndex !== null && postIndex !== preIndex) {
      corrections.push({
        field: 'offerIndex',
        oldValue: preIndex,
        newValue: postIndex
      });

      return {
        text: postText,
        wasCorrected: true,
        previousValue: preIndex,
        correctedValue: postIndex,
        entityType: 'OFFER_INDEX',
        corrections
      };
    }

    return { text, wasCorrected: false, corrections: [] };
  }

  extractNumber(str) {
    const digitMatch = str.match(/(\d+(\.\d+)?)/);
    if (digitMatch) {
      return parseFloat(digitMatch[1]);
    }
    const words = str.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (DomainDictionary.vernacularNumbers[word] !== undefined) {
        return DomainDictionary.vernacularNumbers[word];
      }
    }
    return null;
  }

  extractMaterial(str) {
    const lower = str.toLowerCase();
    for (const item of DomainDictionary.slangMappings) {
      for (const pat of item.patterns) {
        if (pat.test(lower)) {
          return item.canonicalEntity;
        }
      }
    }
    return null;
  }

  extractOrdinalIndex(str) {
    const lower = str.toLowerCase();
    if (/\b(first|pahla|pehla|1st|one)\b/i.test(lower)) return 0;
    if (/\b(second|doosra|2nd|two|beech)\b/i.test(lower)) return 1;
    if (/\b(third|teesra|3rd|three|last)\b/i.test(lower)) return 2;
    return null;
  }
}

export const backtrackResolver = new BacktrackResolver();
