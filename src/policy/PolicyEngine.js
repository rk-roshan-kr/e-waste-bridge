/**
 * PolicyEngine.js - Deterministic Legal, Financial & Safety Policy Engine
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { ConfirmationPolicy, ConfirmationTypes } from './ConfirmationPolicy.js';

export class PolicyEngine {
  static evaluate(command, appState = {}) {
    if (!command) {
      return { allowed: false, reason: 'EMPTY_COMMAND' };
    }

    // 1. Evaluate Consequence & Confirmation
    const confirmation = ConfirmationPolicy.evaluate(command);

    // 2. Evaluate CPCB Verification
    if (command.type === 'REQUEST_ACCEPT_OFFER') {
      const { cpcbRegNo, verified } = command.payload || {};
      // If buyer is strictly non-compliant, we block or flag
      if (verified === false && !cpcbRegNo) {
        return {
          allowed: false,
          requiresConfirmation: false,
          reason: 'UNVERIFIED_BUYER_BLOCKED',
          message: 'इस खरीदार का CPCB रजिस्ट्रेशन मान्य नहीं है।'
        };
      }
    }

    return {
      allowed: true,
      requiresConfirmation: confirmation.required,
      confirmationType: confirmation.type,
      durationMs: confirmation.durationMs || 0,
      promptText: confirmation.promptText || '',
      policyApplied: confirmation.required ? confirmation.type : 'ALLOW_IMMEDIATE'
    };
  }

  static authorizeCommit({ confirmationType, actualHoldDurationMs = 0 }) {
    if (confirmationType === ConfirmationTypes.PHYSICAL_HOLD_5S) {
      if (actualHoldDurationMs < 4900) {
        return {
          authorized: false,
          reason: 'INSUFFICIENT_HOLD_DURATION',
          message: '5 सेकंड पूरा नहीं हुआ। सौदा रद्द किया गया।'
        };
      }
    }
    return { authorized: true, nonce: `tx_${Date.now()}` };
  }
}
