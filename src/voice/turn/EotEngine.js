/**
 * EotEngine.js - End-of-Turn Semantic & Silence Evaluator
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export class EotEngine {
  constructor(config = {}) {
    this.minPauseCandidateMs = config.minPauseCandidateMs || 400;
    this.graceWindowMs = config.graceWindowMs || 500;
    this.maxThinkingPauseMs = config.maxThinkingPauseMs || 1800;
    this.eotThreshold = config.eotThreshold || 0.80;

    // Vernacular linguistic markers
    this.terminalTokens = ['karo', 'kar do', 'chahiye', 'dikhana', 'batao', 'hoga', 'hai', 'dekhna', 'suna', 'pakka'];
    this.incompleteTokens = ['aur', 'matlab', 'jisme', 'ki', 'ka', 'to', 'fir', 'lekin', 'waise'];
  }

  evaluate({ silenceDurationMs, currentText, screenContext = {} }) {
    if (!currentText || currentText.trim().length === 0) {
      return { eotScore: 0, isCandidate: false, shouldCommit: false };
    }

    if (silenceDurationMs < this.minPauseCandidateMs) {
      return { eotScore: 0.1, isCandidate: false, shouldCommit: false };
    }

    const tokens = currentText.toLowerCase().trim().split(/\s+/);
    const lastToken = tokens[tokens.length - 1];

    let grammarScore = 0.5; // neutral baseline
    if (this.terminalTokens.some(t => currentText.toLowerCase().endsWith(t))) {
      grammarScore = 0.9;
    } else if (this.incompleteTokens.includes(lastToken)) {
      grammarScore = 0.2;
    }

    // Silence duration score
    const silenceRatio = Math.min(silenceDurationMs / this.maxThinkingPauseMs, 1.0);
    const silenceScore = 0.4 + silenceRatio * 0.6;

    // Combined heuristic
    const eotScore = silenceScore * 0.5 + grammarScore * 0.5;
    const isCandidate = eotScore >= this.eotThreshold;
    const shouldCommit = isCandidate && (silenceDurationMs >= this.graceWindowMs);

    return {
      eotScore: parseFloat(eotScore.toFixed(2)),
      isCandidate,
      shouldCommit,
      silenceDurationMs
    };
  }
}
