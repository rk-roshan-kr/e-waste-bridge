/**
 * ConfirmationPolicy.js - Evaluation of Action Consequence & Confirmation Method
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export const ConfirmationTypes = Object.freeze({
  NONE: 'NONE',
  PHYSICAL_TAP: 'PHYSICAL_TAP',
  PHYSICAL_HOLD_5S: 'PHYSICAL_HOLD_5S'
});

export class ConfirmationPolicy {
  static HIGH_VALUE_THRESHOLD = 100000; // ₹1,00,000 INR

  static evaluate(command) {
    if (!command || !command.type) {
      return { type: ConfirmationTypes.NONE, required: false };
    }

    if (command.type === 'REQUEST_ACCEPT_OFFER') {
      const netPayout = command.payload?.netPayout || 0;

      if (netPayout >= this.HIGH_VALUE_THRESHOLD) {
        return {
          type: ConfirmationTypes.PHYSICAL_HOLD_5S,
          required: true,
          durationMs: 5000,
          reason: 'HIGH_VALUE_TRANSACTION',
          threshold: this.HIGH_VALUE_THRESHOLD,
          promptText: `${netPayout.toLocaleString('en-IN')} रुपये का बड़ा सौदा है। पक्का करने के लिए 5 सेकंड दबा कर रखें।`
        };
      }

      return {
        type: ConfirmationTypes.PHYSICAL_TAP,
        required: true,
        durationMs: 0,
        reason: 'BINDING_OFFER_ACCEPTANCE',
        threshold: this.HIGH_VALUE_THRESHOLD,
        promptText: `${netPayout.toLocaleString('en-IN')} रुपये का सौदा पक्का करने के लिए कन्फर्म दबाएं।`
      };
    }

    // Low risk or reversible operations
    return { type: ConfirmationTypes.NONE, required: false };
  }
}
