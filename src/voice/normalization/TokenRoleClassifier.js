/**
 * TokenRoleClassifier.js - Linguistic Role Classifier for Speech Tokens
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * PURPOSE: Assigns a linguistic role to a token BEFORE any removal or transformation.
 * This prevents the filler filter from destroying meaningful speech like "woh wala buyer".
 *
 * Token roles:
 *   FILLER   - Safe to strip (um, uh, matlab, yaani...)
 *   DEICTIC  - Reference word — must NOT be stripped ("woh wala", "ye wala")
 *   PRONOUN  - Pronoun reference ("woh", "ye", "iska")
 *   CONTENT  - Domain content word — must be preserved
 *
 * RULE: FillerFilter strips only FILLER-role tokens.
 * ReferenceResolver consumes DEICTIC + PRONOUN tokens.
 */

export const TokenRoles = Object.freeze({
  FILLER:  'FILLER',
  DEICTIC: 'DEICTIC',
  PRONOUN: 'PRONOUN',
  CONTENT: 'CONTENT',
});

// Deictic phrase patterns — these contain "woh/ye/wala" but carry reference meaning
// Must be tested BEFORE standalone pronoun patterns
const DEICTIC_PATTERNS = [
  /\b(woh\s+wala|woh\s+waali|ye\s+wala|ye\s+waali|yeh\s+wala|yeh\s+waali)\b/i,
  /\b(te\s+wala|to\s+wala|ha\s+wala|tya\s+cha)\b/i,   // Marathi deictics
  /\b(iska|uska|inका|unka|iske|uske)\b/i,
  /\b(this\s+one|that\s+one|the\s+one)\b/i,
];

// Standalone pronouns (not paired with wala) — pass to ReferenceResolver
const PRONOUN_PATTERNS = [
  /^(woh|yeh|ye|iska|uska|wahi|yahi)$/i,
  /^(to|te|ha|ti)$/i,  // Marathi pronouns in isolation
];

// Pure fillers: safe to strip when appearing alone (not part of a deictic phrase)
const FILLER_TOKENS = new Set([
  'um', 'uh', 'hmm', 'hm',
  'matlab', 'yaani', 'yani', 'samjhe',
  'arre', 'waise', 'acha', 'accha',
  // Marathi
  'म्हणजे', 'ते', 'बरं', 'ना', 'हं',
]);

export class TokenRoleClassifier {
  /**
   * Classify a single token given its surrounding text context.
   *
   * @param {string} token   - The token to classify
   * @param {string} context - The full utterance (for pattern matching)
   * @returns {string} One of TokenRoles.*
   */
  classifyToken(token, context = '') {
    const t = (token || '').trim();
    const ctx = (context || '').toLowerCase();
    const tLow = t.toLowerCase();

    // 1. Check if token is part of a deictic phrase in the full context
    //    e.g. "woh" in "woh wala buyer" is DEICTIC, not a pronoun
    for (const pattern of DEICTIC_PATTERNS) {
      if (pattern.test(ctx)) {
        // Does this token appear inside a matched deictic phrase?
        const match = ctx.match(pattern);
        if (match && match[0].includes(tLow)) {
          return TokenRoles.DEICTIC;
        }
      }
    }

    // 2. Standalone pronoun (after ruling out deictic context)
    for (const pattern of PRONOUN_PATTERNS) {
      if (pattern.test(tLow)) {
        return TokenRoles.PRONOUN;
      }
    }

    // 3. Pure filler
    if (FILLER_TOKENS.has(tLow)) {
      return TokenRoles.FILLER;
    }

    // 4. Everything else is content
    return TokenRoles.CONTENT;
  }

  /**
   * Classify every token in an utterance.
   *
   * @param {string} text
   * @returns {{ token: string, role: string }[]}
   */
  classifyAll(text) {
    if (!text || typeof text !== 'string') return [];
    return text.split(/\s+/).filter(Boolean).map((token) => ({
      token,
      role: this.classifyToken(token, text),
    }));
  }

  /**
   * Return only the tokens that are safe to remove (FILLER).
   * Used by FillerFilter before doing any replacement.
   *
   * @param {string} text
   * @returns {string[]} Token strings that may be stripped
   */
  getSafeFillers(text) {
    return this.classifyAll(text)
      .filter(({ role }) => role === TokenRoles.FILLER)
      .map(({ token }) => token);
  }

  /**
   * Check if the utterance contains a deictic phrase (for ReferenceResolver hand-off).
   * @param {string} text
   * @returns {boolean}
   */
  hasDeictic(text) {
    const lower = (text || '').toLowerCase();
    return DEICTIC_PATTERNS.some((p) => p.test(lower));
  }
}

export const tokenRoleClassifier = new TokenRoleClassifier();
