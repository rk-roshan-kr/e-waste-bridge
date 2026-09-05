/**
 * VoiceState.js - Conversational Runtime Finite State Machine & Types
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export const TurnStates = Object.freeze({
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PAUSED_WAITING: 'PAUSED_WAITING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
  WAITING_FOR_CONFIRMATION: 'WAITING_FOR_CONFIRMATION',
  WAITING_FOR_CLARIFICATION: 'WAITING_FOR_CLARIFICATION',
  ERROR_RECOVERY: 'ERROR_RECOVERY'
});

export const AudioStates = Object.freeze({
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  MUTED: 'MUTED',
  ERROR: 'ERROR'
});

export function createInitialTurnState(sessionId = `session_${Date.now()}`) {
  return {
    sessionId,
    state: TurnStates.IDLE,
    rawSegments: [],
    interimTranscript: '',
    committedTranscript: '',
    speechStartedAt: 0,
    lastSpeechAt: 0,
    silenceDurationMs: 0,
    eotScore: 0.0,
    waitingForContinuation: false,
    bargeInActive: false,
    diagnostics: {
      vadActivity: false,
      asrConfidence: 1.0,
      activeTool: null,
      pipelineLatencyMs: 0
    }
  };
}
