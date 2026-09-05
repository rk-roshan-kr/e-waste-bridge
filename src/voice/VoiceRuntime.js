/**
 * VoiceRuntime.js - Master Voice Orchestrator
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { audioSession } from './audio/AudioSession.js';
import { turnManager } from './turn/TurnManager.js';
import { asrEngine } from './asr/AsrEngine.js';
import { speechNormalizer } from './normalization/SpeechNormalizer.js';
import { ContextEngine } from './context/ContextEngine.js';
import { intentEngine } from './intent/IntentEngine.js';
import { commandRouter } from '../commands/CommandRouter.js';
import { PolicyEngine } from '../policy/PolicyEngine.js';
import { responseGenerator } from './response/ResponseGenerator.js';
import { ttsProvider } from './tts/TTSProvider.js';
import { interactionBus } from '../interaction/InteractionBus.js';
import { TurnStates } from './VoiceState.js';

export class VoiceRuntime {
  constructor() {
    this.isActive = false;
    this.currentContext = {};
    this.onTelemetryUpdate = null;
    this.onStateChange = null;
    this.onMorphingPillUpdate = null;
    this.commandDispatcher = null;
  }

  initialize({ getAppState, dispatchCommand, onTelemetry, onPillUpdate }) {
    this.getAppState = getAppState;
    this.commandDispatcher = dispatchCommand;
    this.onTelemetryUpdate = onTelemetry;
    this.onMorphingPillUpdate = onPillUpdate;

    // Connect Barge-In from TTS to TurnManager
    ttsProvider.registerBargeInHandler(() => {
      turnManager.handleBargeIn();
    });

    // Wire ASR interim & final tokens to TurnManager
    asrEngine.on('onInterim', (res) => {
      turnManager.onInterim(res.text);
      turnManager.onSpeechStop();
      if (this.onMorphingPillUpdate) {
        this.onMorphingPillUpdate({
          mode: 'STREAMING',
          text: turnManager.getAccumulatedText()
        });
      }
    });

    asrEngine.on('onFinal', (res) => {
      turnManager.onFinal(res.text);
      turnManager.onSpeechStop();
    });

    // Wire TurnManager events
    turnManager.on('onStateChange', (turnState) => {
      if (this.onStateChange) this.onStateChange(turnState);
      this.updateTelemetry();
    });

    turnManager.on('onTurnCommit', async ({ transcript, sessionId, eotScore }) => {
      await this.processCommittedTurn(transcript, eotScore);
    });

    turnManager.on('onBargeIn', () => {
      ttsProvider.stop();
    });

    // Initialize ASR engine
    asrEngine.initialize('hi');
  }

  async startListening() {
    this.isActive = true;
    const sessionOk = await audioSession.start();
    if (!sessionOk) {
      console.warn('[VoiceRuntime] Audio session failed to start');
      return false;
    }

    turnManager.startSession();
    asrEngine.start();
    this.updateTelemetry();
    return true;
  }

  stopListening() {
    this.isActive = false;
    asrEngine.stop();
    turnManager.cancelTurn();
    audioSession.stop();
    ttsProvider.stop();
    this.updateTelemetry();
  }

  async processCommittedTurn(rawTranscript, eotScore) {
    const startTime = Date.now();

    // 1. Context snapshot
    const appState = this.getAppState ? this.getAppState() : {};
    const context = ContextEngine.buildContext(appState);
    this.currentContext = context;

    // 2. Speech Normalization & Backtracking
    const norm = speechNormalizer.normalize(rawTranscript);
    const cleanText = norm.cleanText;

    if (norm.wasCorrected && this.onMorphingPillUpdate) {
      this.onMorphingPillUpdate({
        mode: 'CORRECTION',
        previousValue: norm.previousValue,
        correctedValue: norm.correctedValue
      });
    }

    // 3. Intent & Entity Extraction
    const parsedIntent = intentEngine.classify(cleanText, context);

    // 4. Command Routing
    const command = commandRouter.routeIntent(parsedIntent, context, 'VOICE');

    // 5. Policy Engine Gate
    let policyDecision = { allowed: true, requiresConfirmation: false };
    if (command) {
      policyDecision = PolicyEngine.evaluate(command, appState);
    }

    const latencyMs = Date.now() - startTime;

    // 6. Update Evaluator Telemetry
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        rawTranscript,
        cleanText,
        intent: parsedIntent.intent,
        confidence: parsedIntent.confidence,
        entities: parsedIntent.entities,
        screen: context.screen,
        commandType: command ? command.type : 'NONE',
        policyDecision: policyDecision.policyApplied || 'ALLOW',
        latencyMs,
        wasCorrected: norm.wasCorrected
      });
    }

    // 7. Execute or Request Confirmation
    if (command && policyDecision.allowed) {
      if (policyDecision.requiresConfirmation) {
        // High consequence gate: do NOT execute yet; prompt user for physical confirmation
        turnManager.setState(TurnStates.WAITING_FOR_CONFIRMATION);

        if (this.onMorphingPillUpdate) {
          this.onMorphingPillUpdate({
            mode: 'CONFIRMATION',
            confirmationType: policyDecision.confirmationType,
            promptText: policyDecision.promptText
          });
        }

        const response = responseGenerator.generate(command, {}, context.language);
        await ttsProvider.speak({
          text: policyDecision.promptText || response.text,
          audioKey: response.audioKey,
          language: context.language,
          onStart: () => turnManager.setState(TurnStates.SPEAKING),
          onEnd: () => {
            // Keep in WAITING_FOR_CONFIRMATION; do not listen again blindly!
          }
        });

      } else {
        // Normal low-risk / preparation action: execute immediately
        if (this.commandDispatcher) {
          const toolResult = this.commandDispatcher(command) || {};
          const response = responseGenerator.generate(command, toolResult, context.language);

          if (this.onMorphingPillUpdate) {
            this.onMorphingPillUpdate({
              mode: 'ACTION_RESULT',
              text: response.text,
              command
            });
          }

          await ttsProvider.speak({
            text: response.text,
            audioKey: response.audioKey,
            language: context.language,
            onStart: () => turnManager.setState(TurnStates.SPEAKING),
            onEnd: () => {
              // Automatically listen again for continuous natural dialogue
              if (this.isActive) {
                turnManager.startSession();
              }
            }
          });
        }
      }
    } else {
      // Unrecognized or blocked
      const fallbackText = 'माफ़ कीजिए, मुझे समझ नहीं आया। दोबारा बोलिए?';
      await ttsProvider.speak({
        text: fallbackText,
        audioKey: 'generic_ack_hi',
        language: context.language,
        onStart: () => turnManager.setState(TurnStates.SPEAKING),
        onEnd: () => {
          if (this.isActive) turnManager.startSession();
        }
      });
    }
  }

  updateTelemetry() {
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        runtimeState: this.isActive ? 'BRIDGE_LISTENING' : 'IDLE',
        turnState: turnManager.state.state,
        eotScore: turnManager.state.eotScore,
        bargeInArmed: ttsProvider.isPlaying()
      });
    }
  }
}

export const voiceRuntime = new VoiceRuntime();
