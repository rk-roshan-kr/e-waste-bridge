// E-Waste Bridge: Progressive Risk-Based Confirmation Policy
// Design Principle: "Voice for convenience. Touch for commitment."

export const CONFIRMATION_POLICY = {
  lowRisk: "VOICE_OR_TAP",
  transaction: "TAP",
  highValue: {
    threshold: 100000, // ₹1 Lakh
    method: "HOLD_TO_CONFIRM",
    durationMs: 5000 // 5 seconds hold as specified by user
  }
};

/**
 * Determines required confirmation method based on action type and monetary value
 */
export function getConfirmationMethod(actionType, valueInr = 0) {
  if (actionType === "DELETE_RECORD" || actionType === "CANCEL_TRANSACTION") {
    return "HOLD_TO_CONFIRM";
  }

  if (actionType === "ACCEPT_OFFER" || actionType === "CONFIRM_INTAKE") {
    if (valueInr >= CONFIRMATION_POLICY.highValue.threshold) {
      return "HOLD_TO_CONFIRM";
    }
    return "TAP";
  }

  if (actionType === "PREPARE_LOT" || actionType === "SUBMIT_LOT" || actionType === "CHANGE_WEIGHT") {
    return "TAP";
  }

  // Low-risk: navigation, browsing, inquiries
  return "VOICE_OR_TAP";
}
