/**
 * FillerFilter.js - Context-Sensitive Vernacular Filler Word Removal
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * CRITICAL RULE: Never strip a token without first checking its linguistic role.
 * "woh wala buyer" must NOT become " wala buyer" — "woh wala" is a DEICTIC phrase.
 * TokenRoleClassifier determines which tokens are safe to remove.
 *
 * Only tokens classified as FILLER are removed.
 * DEICTIC, PRONOUN, and CONTENT tokens pass through untouched.
 */

import { tokenRoleClassifier, TokenRoles } from './TokenRoleClassifier.js';

export class FillerFilter {
  /**
   * Remove only FILLER-role tokens from the utterance.
   * Context-sensitive: uses the full utterance for role classification.
   *
   * @param {string} text - Raw utterance
   * @returns {string} Cleaned text with only fillers removed
   */
  clean(text) {
    if (!text || typeof text !== 'string') return '';

    // Classify every token in context of the full utterance
    const classified = tokenRoleClassifier.classifyAll(text);

    // Rebuild utterance, replacing only FILLER tokens with a space
    const cleaned = classified
      .map(({ token, role }) => role === TokenRoles.FILLER ? '' : token)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }
}

export const fillerFilter = new FillerFilter();
