# AGENTS.md

## Repository Coding Standards & Rules

### 1. No Emojis in Code
- Strictly forbid emojis across all source files, components, tests, scratch scripts, comments, docstrings, and strings.
- Use clean typography, SVG icons (Lucide / custom SVG sprites), or bracketed labels (e.g. `[PASS]`, `[Simulate Voice]`, `[Verified]`).

### 2. Vernacular Voice & Audio Persona
- Maintain warm, respectful, sweet female neural voices for speech synthesis (TTS) across Hindi, Marathi, and Indian English.
- Exclude robotic male desktop synthesizers.
- Prosody: pitch elevated (1.16), unhurried cadence (0.88), full volume (1.0).

### 3. Verification & Testing
- Every modification to voice, state, or logistics logic must preserve 100% pass rates on all automated test harnesses.
