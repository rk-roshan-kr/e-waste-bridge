/**
 * VoiceEventTypes.js - Typed Event Constants for the Multimodal Interaction Bus
 * Part of E-Waste Bridge Architecture Blueprint v3
 * @level L1 L2 L3
 *
 * RULE: InteractionBus carries NOTIFICATIONS only.
 * Business actions travel via the Command API (VoiceAdapter → VoiceRuntime → CommandRouter).
 * Events MUST NOT trigger domain state mutations directly.
 */

export const VoiceEvents = Object.freeze({
  SESSION_START:        'SESSION_START',
  SESSION_END:          'SESSION_END',
  VOICE_STATE_CHANGE:   'VOICE_STATE_CHANGE',
  SPEECH_ONSET:         'SPEECH_ONSET',
  SPEECH_FRAME:         'SPEECH_FRAME',
  SPEECH_PAUSE:         'SPEECH_PAUSE',
  TRANSCRIPT_INTERIM:   'TRANSCRIPT_INTERIM',
  TRANSCRIPT_FINAL:     'TRANSCRIPT_FINAL',
  TURN_COMMITTED:       'TURN_COMMITTED',
  BARGE_IN:             'BARGE_IN',
  TTS_START:            'TTS_START',
  TTS_END:              'TTS_END',
  TTS_INTERRUPT:        'TTS_INTERRUPT',
  COMMAND_DISPATCHED:   'COMMAND_DISPATCHED',
  POLICY_GATE:          'POLICY_GATE',
  FEEDBACK_ACK:         'FEEDBACK_ACK',
});

export function createVoiceEvent(type, payload = {}, sessionId = '') {
  return { type, payload, timestamp: Date.now(), sessionId };
}

export const VoiceStates = Object.freeze({
  IDLE:                     'IDLE',
  LISTENING:                'LISTENING',
  PAUSED_WAITING:           'PAUSED_WAITING',
  PROCESSING:               'PROCESSING',
  SPEAKING:                 'SPEAKING',
  WAITING_FOR_CONFIRMATION: 'WAITING_FOR_CONFIRMATION',
  ERROR:                    'ERROR',
});
