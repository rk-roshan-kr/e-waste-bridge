/**
 * InteractionTypes.js - Unified Interaction Event & Feedback Contracts
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { InputSources } from '../commands/commandTypes.js';

export const FeedbackChannels = Object.freeze({
  VISUAL: 'VISUAL',
  AUDIO: 'AUDIO',
  HAPTIC: 'HAPTIC'
});

export const FeedbackStatuses = Object.freeze({
  ACK: 'ACK',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  HOLD_PROGRESS: 'HOLD_PROGRESS'
});

export function createInteractionEvent({
  source = InputSources.VOICE,
  action,
  target = null,
  payload = {},
  screenContext = {},
  timestamp = Date.now()
}) {
  return {
    id: `event_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
    source,
    action,
    target,
    payload,
    screenContext,
    timestamp
  };
}
