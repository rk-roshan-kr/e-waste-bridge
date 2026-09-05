import React from "react";

// =========================================================
// Two-Way Context Bridge between Agent & Active Phone Screen
// =========================================================
export const CollectorAgentBridgeContext = React.createContext({
  screenContext: {},
  setScreenContext: () => {},
  voiceCommandAction: null,
  dispatchVoiceAction: () => {},
  onTriggerVoice: () => {},
  handleCloseVoice: () => {},
  handleProcessUtterance: () => {},
  voiceUI: { phase: "IDLE" },
  visibleTranscript: "",
  interimTranscript: "",
  micAudioLevel: 0,
  isContinuousListening: false,
  isSpeaking: false
});

export function useCollectorAgentBridge() {
  return React.useContext(CollectorAgentBridgeContext);
}

export default CollectorAgentBridgeContext;
