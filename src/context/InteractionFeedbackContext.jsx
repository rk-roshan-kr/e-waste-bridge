import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import feedbackDispatcher, {
  emitInputAck,
  emitStateChange,
  emitSuccess,
  emitCancelled,
  emitAmbiguity,
  emitMilestone
} from "../services/feedbackDispatcher";

const InteractionFeedbackContext = createContext({
  lastEvent: null,
  undoState: null,
  activeClarification: null,
  cancelledState: null,
  triggerAck: () => {},
  triggerStateChange: () => {},
  triggerSuccess: () => {},
  triggerCancelled: () => {},
  triggerAmbiguous: () => {},
  triggerMilestone: () => {},
  executeUndo: () => {},
  clearClarification: () => {},
  clearUndo: () => {}
});

export function InteractionFeedbackProvider({ children }) {
  const [lastEvent, setLastEvent] = useState(null);
  const [undoState, setUndoState] = useState(null);
  const [activeClarification, setActiveClarification] = useState(null);
  const [cancelledState, setCancelledState] = useState(null);

  // Subscribe to global dispatcher events
  useEffect(() => {
    const unsubscribe = feedbackDispatcher.subscribe((event) => {
      setLastEvent(event);

      // Handle reversible undo actions (4.5s lifespan)
      if (event.undoable && event.onUndo) {
        setUndoState({
          id: event.id,
          message: event.message || "Action updated",
          onUndo: event.onUndo,
          expiresAt: Date.now() + 4500
        });
      }

      // Handle ambiguity clarification
      if (event.status === "AMBIGUOUS" && event.payload?.options?.length) {
        setActiveClarification({
          prompt: event.payload.prompt,
          options: event.payload.options,
          action: event.action
        });
      }

      // Handle cancelled state (intentional stop)
      if (event.status === "CANCELLED") {
        setCancelledState({
          message: event.message || "Transaction not committed",
          timestamp: Date.now()
        });
        setTimeout(() => setCancelledState(null), 3000);
      }
    });

    return unsubscribe;
  }, []);

  // Expire undo automatically after 4.5s
  useEffect(() => {
    if (!undoState) return;
    const remaining = Math.max(100, undoState.expiresAt - Date.now());
    const timer = setTimeout(() => {
      setUndoState(null);
    }, remaining);
    return () => clearTimeout(timer);
  }, [undoState]);

  const executeUndo = useCallback(() => {
    if (undoState && typeof undoState.onUndo === "function") {
      try {
        undoState.onUndo();
        emitInputAck("TOUCH", "undo_button");
        feedbackDispatcher.playTone(700, 0.04, "sine", 0.03);
      } catch (err) {
        console.error("Failed to execute undo:", err);
      }
      setUndoState(null);
    }
  }, [undoState]);

  const clearClarification = useCallback(() => {
    setActiveClarification(null);
  }, []);

  const clearUndo = useCallback(() => {
    setUndoState(null);
  }, []);

  return (
    <InteractionFeedbackContext.Provider
      value={{
        lastEvent,
        undoState,
        activeClarification,
        cancelledState,
        triggerAck: emitInputAck,
        triggerStateChange: emitStateChange,
        triggerSuccess: emitSuccess,
        triggerCancelled: emitCancelled,
        triggerAmbiguous: emitAmbiguity,
        triggerMilestone: emitMilestone,
        executeUndo,
        clearClarification,
        clearUndo
      }}
    >
      {children}
    </InteractionFeedbackContext.Provider>
  );
}

export function useInteractionFeedback() {
  return useContext(InteractionFeedbackContext);
}

export default InteractionFeedbackContext;
