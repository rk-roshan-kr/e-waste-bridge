/**
 * ReferenceResolver.js - Deictic & Relative Screen Reference Resolver
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export class ReferenceResolver {
  resolveOfferReference(text, visibleOffers = []) {
    if (!visibleOffers || visibleOffers.length === 0) return null;
    const lower = (text || '').toLowerCase().trim();

    // 1. "Pahla wala" / "First one" / "Top one"
    if (/\b(pahla|pehla|first|top|1st|ek number|one)\b/i.test(lower)) {
      return { index: 0, offer: visibleOffers[0], reason: 'POSITIONAL_FIRST' };
    }

    // 2. "Beech wala" / "Middle one" / "Second one" / "Do number wala"
    if (/\b(beech wala|middle|second|2nd|do number|center)\b/i.test(lower)) {
      const idx = visibleOffers.length >= 2 ? 1 : 0;
      return { index: idx, offer: visibleOffers[idx], reason: 'POSITIONAL_MIDDLE' };
    }

    // 3. "Teesra wala" / "Last one" / "Third one"
    if (/\b(teesra|third|3rd|teen number|last|aakhri)\b/i.test(lower)) {
      const idx = visibleOffers.length >= 3 ? 2 : visibleOffers.length - 1;
      return { index: idx, offer: visibleOffers[idx], reason: 'POSITIONAL_LAST' };
    }

    // 4. "Sabse achha wala" / "Best rate" / "Highest payout"
    if (/\b(sabse achha|best|highest|top payout|sabse zyada)\b/i.test(lower)) {
      let bestIdx = 0;
      let maxNet = -Infinity;
      visibleOffers.forEach((o, i) => {
        if ((o.netPayout || o.totalPayout || 0) > maxNet) {
          maxNet = o.netPayout || o.totalPayout || 0;
          bestIdx = i;
        }
      });
      return { index: bestIdx, offer: visibleOffers[bestIdx], reason: 'EXTREMA_BEST_PAYOUT' };
    }

    // 5. "Sabse paas wala" / "Nearest buyer"
    if (/\b(sabse paas|nearest|closest|kam doori)\b/i.test(lower)) {
      let nearestIdx = 0;
      let minDistance = Infinity;
      visibleOffers.forEach((o, i) => {
        const dist = typeof o.distanceKm === 'number' ? o.distanceKm : 999;
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      });
      return { index: nearestIdx, offer: visibleOffers[nearestIdx], reason: 'EXTREMA_NEAREST' };
    }

    // 6. "Ye wala" / "This one" -> default to index 0 or first verified
    if (/\b(ye wala|yeh wala|this one|select this)\b/i.test(lower)) {
      return { index: 0, offer: visibleOffers[0], reason: 'DEICTIC_THIS' };
    }

    // 7. Multi-turn negation correction: "No, not that one. The second one"
    if (/\b(not that|doosra|second one|woh nahi)\b/i.test(lower)) {
      const idx = visibleOffers.length > 1 ? 1 : 0;
      return { index: idx, offer: visibleOffers[idx], reason: 'CORRECTION_ALTERNATIVE' };
    }

    return null;
  }
}

export const referenceResolver = new ReferenceResolver();
