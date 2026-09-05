# E-Waste Bridge: Complete Codebase File & Function Dictionary
**Problem Statement 2: E-Waste Management & Informal Sector Formalization**
*Smart India Hackathon (SIH 2026) | Master Technical Reference Manual*
*Authoritative Architectural & Code-Level Documentation for Every File and Function*

---

## Table of Contents
1. [Executive Architectural Summary & PS2 Invariants](#1-executive-architectural-summary--ps2-invariants)
2. [Project Root & Infrastructure Configuration](#2-project-root--infrastructure-configuration)
3. [Core Application Entry & Lifecycle](#3-core-application-entry--lifecycle)
4. [CQRS Command Subsystem (`src/commands/`)](#4-cqrs-command-subsystem-srccommands)
5. [Domain State Machines & Logic (`src/domain/`)](#5-domain-state-machines--logic-srcdomain)
6. [Statutory Policy & Safety Gate Engine (`src/policy/`)](#6-statutory-policy--safety-gate-engine-srcpolicy)
7. [Storage, IndexedDB & Offline Repositories (`src/storage/`)](#7-storage-indexeddb--offline-repositories-srcstorage)
8. [Global Application State & Contexts (`src/state/` & `src/context/`)](#8-global-application-state--contexts-srcstate--srccontext)
9. [Vernacular Voice & Audio Processing Pipeline (`src/voice/`)](#9-vernacular-voice--audio-processing-pipeline-srcvoice)
10. [Event Buses, Dispatchers & Services (`src/services/` & `src/interaction/`)](#10-event-buses-dispatchers--services-srcservices--srcinteraction)
11. [CPCB Datasets & Relational Database Layer (`src/data/` & `src/database/`)](#11-cpcb-datasets--relational-database-layer-srcdata--srcdatabase)
12. [React UI Components (`src/components/`)](#12-react-ui-components-srccomponents)
13. [Vernacular Localization Assets (`src/locales/`)](#13-vernacular-localization-assets-srclocales)
14. [PWA Service Worker & Public Assets (`public/`)](#14-pwa-service-worker--public-assets-public)
15. [CLI Scripts & Automation (`scripts/` & `reset.js` & `seed.js`)](#15-cli-scripts--automation-scripts--resetjs--seedjs)

---

## 1. Executive Architectural Summary & PS2 Invariants

E-Waste Bridge is an **Offline-First Progressive Web Application (PWA)** built specifically to formalize the unorganized e-waste ecosystem in India (kabadiwalas, scrap aggregators, waste pickers). The system is engineered around **four statutory mandates** from Problem Statement 2:

1. **100% Cash-as-Default Settlement**: Cash is the foundational settlement mode at gate scales (`isLotNotSettled` logic, Cash Settlement Guarantee Voucher). Digital payments (UPI/Escrow) remain strictly optional and are never a prerequisite for lot creation or handover.
2. **Dual-Column Financial & Pending Dues Ledger**: The ledger (`LotsAndReceiptsList.jsx` and `CollectorHome.jsx`) explicitly tracks paid earnings vs pending dues across three distinct settlement statuses: `PAID`, `PENDING`, and `PARTIAL`.
3. **Exact CPCB Statutory Taxonomy Match**: 1:1 parity with the 7 explicit streams specified in PS2:
   - CRTs (`crt`)
   - LCD Panels (`lcd_panels`)
   - PCBs (`pcb`)
   - Cables (`cables`)
   - Batteries (`batteries`)
   - Motors & Magnet-Bearing Assemblies (`motors_magnets`)
   - Mixed Plastics & ABS Casings (`abs_plastic`)
   plus consumer streams (Smartphones, Laptops).
4. **Ultra-Low Memory Footprint (<35 MB RAM)**: Targeted for entry-level Android devices (Android Go, 2GB RAM), using Rolldown code-splitting (<60KB chunks) and an offline-first Cache-First Service Worker (`public/sw.js`).

---

## 2. Project Root & Infrastructure Configuration

### 2.1 `package.json`
* **Path**: `d:/SIH prototype ps2/package.json`
* **Role**: Defines NPM dependencies, scripts, build tools, and module metadata.
* **Key Scripts**:
  - `dev`: Runs `vite` development server with hot module replacement (HMR).
  - `build`: Runs `vite build` using Rolldown bundling and code-splitting.
  - `preview`: Serves production `dist/` directory locally.
  - `lint`: Runs `oxlint` for high-performance static analysis.
  - `seed`: Executes `node scripts/seed.js` to populate canonical CPCB datasets and SQL dumps.
  - `reset`: Executes `node scripts/reset.js` to purge database and reset to pristine empty state.
  - `test`: Executes test suites `scratch/test_dataset_flow.js` and `scratch/test_modular_runtime.js`.
  - `docker:build`: Builds container image `ewaste-bridge:latest`.
  - `docker:run`: Runs containerized app detached on port 80.
* **Dependencies**: React 19 (`react`, `react-dom`), `motion`, `lucide-react`, `i18next`, `react-i18next`.

### 2.2 `vite.config.js`
* **Path**: `d:/SIH prototype ps2/vite.config.js`
* **Role**: Bundler configuration with function-based Rolldown chunking for strict memory budgets.
* **Functions & Configuration**:
  - `manualChunks(id)`: Evaluates module paths to isolate vendor dependencies into isolated, cacheable chunks:
    - `vendor-react`: `react`, `react-dom` (~181 KB, 57 KB gzip).
    - `vendor-motion`: `motion` (~121 KB, 39 KB gzip).
    - `vendor-icons`: `lucide-react` (~16 KB, 5 KB gzip).
    - `vendor-i18n`: `i18next`, `react-i18next` (~56 KB, 18 KB gzip).
    - `index`: Application logic and UI code.

### 2.3 `Dockerfile`
* **Path**: `d:/SIH prototype ps2/Dockerfile`
* **Role**: Production multi-stage container build specification.
* **Stages**:
  - `builder`: `node:22-alpine` compiles production assets via `npm ci` and `npm run build`.
  - `runner`: `nginx:1.27-alpine` serves static files from `/usr/share/nginx/html` with custom `nginx.conf`.
  - `HEALTHCHECK`: Runs `wget -qO- http://localhost:80/healthz` every 30 seconds.

### 2.4 `nginx.conf`
* **Path**: `d:/SIH prototype ps2/nginx.conf`
* **Role**: Production web server configuration with caching, compression, and security headers.
* **Directives & Rules**:
  - `gzip`: Level 6 compression for JS, CSS, JSON, SVG, and HTML.
  - `try_files $uri $uri/ /index.html`: Client-side SPA routing fallback.
  - Caching Rules:
    - `/sw.js` & `/manifest.webmanifest`: `Cache-Control: no-cache, no-store, must-revalidate` (instant PWA updates).
    - `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (1-year immutable cache).
    - `/datasets/*`: `Cache-Control: public, max-age=300, stale-while-revalidate=86400` (5-minute fresh, 24-hour SWR).
  - Security Headers: `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`, and `Permissions-Policy microphone=(self), camera=(self), geolocation=(self)`.

### 2.5 `docker-compose.yml`
* **Path**: `d:/SIH prototype ps2/docker-compose.yml`
* **Role**: Orchestrates single-command deployment with container limits (memory limit: 256MB).

### 2.6 `vercel.json` & `netlify.toml`
* **Paths**: `d:/SIH prototype ps2/vercel.json`, `d:/SIH prototype ps2/netlify.toml`
* **Role**: Cloud CDN configurations for Vercel and Netlify with exact caching headers and SPA wildcard rewrites.

### 2.7 `index.html`
* **Path**: `d:/SIH prototype ps2/index.html`
* **Role**: Single page HTML entry point.
* **Features**:
  - Viewport: `user-scalable=no, viewport-fit=cover` (native app feel).
  - PWA tags: `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`.
  - Inline Service Worker registration script targeting `/sw.js`.

---

## 3. Core Application Entry & Lifecycle

### 3.1 `src/main.jsx`
* **Path**: `d:/SIH prototype ps2/src/main.jsx`
* **Role**: Mounts the React component tree into DOM `#root`.
* **Imports**: `React`, `ReactDOM.createRoot`, `./App.jsx`, `./index.css`, `./i18n.js`.
* **Execution**: Initializes StrictMode and bootstraps the React application.

### 3.2 `src/App.jsx`
* **Path**: `d:/SIH prototype ps2/src/App.jsx`
* **Role**: Root application container and persona router.
* **Hooks & State**:
  - `useAppState()`: Extracts `activePersona`, `currentScreen`, and `lots`.
  - `useAppDispatch()`: Dispatches UI-level navigation and persona actions.
* **Exported Components**:
  - `App()`: Renders `AppStateProvider` wrapping either `CollectorPhoneWrapper` (Collector Persona), `RecyclerTerminal` (Recycler Persona), or `TraceabilityCenter` (Admin Persona) based on `activePersona`.

### 3.3 `src/i18n.js`
* **Path**: `d:/SIH prototype ps2/src/i18n.js`
* **Role**: Configures `i18next` localization for Hindi (`hi`), Marathi (`mr`), and English (`en`).
* **Functions & Setup**:
  - `i18n.use(initReactI18next).init()`: Initializes translation resources from `src/locales/*.json`. Sets default fallback to `'hi'`.

### 3.4 `src/index.css` & `src/App.css`
* **Paths**: `d:/SIH prototype ps2/src/index.css`, `d:/SIH prototype ps2/src/App.css`
* **Role**: Pure Vanilla CSS design system.
* **Tokens & Utilities**: Dark aesthetic (`#0B0E14`), high-contrast emerald borders (`#10B981`), amber safety alerts (`#F59E0B`), glassmorphism frosted glass backgrounds (`backdrop-filter: blur(12px)`), zero emojis (100% Lucide SVG vector iconography).

---

## 4. CQRS Command Subsystem (`src/commands/`)

The application enforces strict **CQRS (Command Query Responsibility Segregation)**: React components never mutate domain data directly; they dispatch typed commands through the `CommandBus`.

### 4.1 `CommandBus.js`
* **Path**: `d:/SIH prototype ps2/src/commands/CommandBus.js`
* **Role**: Central synchronous command dispatcher with idempotency and offline gating.
* **Exported Functions**:
  - `initCommandBus(dispatch, getState)`:
    - *Parameters*: `dispatch` (React reducer dispatcher), `getState` (closure returning latest AppState snapshot).
    - *Role*: Wires the CommandBus to the global `AppStateProvider` during mount.
  - `resetCommandBusSession()`:
    - *Parameters*: None.
    - *Role*: Clears the internal `_processedIds` set on session reboot.
  - `executeCommand(command)`:
    - *Parameters*: `command` (`{ type, payload, commandId, source, timestamp }`).
    - *Returns*: `{ success: boolean, action?: object, policyDecision?: object, error?: string }`.
    - *Logic*:
      1. Guards against uninitialized state.
      2. Enforces idempotency via `_processedIds.has(commandId)`.
      3. Evaluates offline guard: blocks financial commands (`REQUEST_ACCEPT_OFFER`, `COMMIT_TRANSACTION`) if `state.onlineStatus === 'OFFLINE'`.
      4. Invokes `PolicyEngine.evaluate(command, state)`.
      5. Routes command to reducer action via `_routeToAction()`.
      6. Emits `VoiceEvents.COMMAND_DISPATCHED` on `interactionBus`.
  - `_routeToAction(type, payload, state, policyDecision)`:
    - *Parameters*: Command metadata, state snapshot, policy decision.
    - *Returns*: Corresponding `AppActions` object for the reducer.

### 4.2 `CommandRouter.js`
* **Path**: `d:/SIH prototype ps2/src/commands/CommandRouter.js`
* **Role**: Translates NLP voice intents into validated, typed application commands.
* **Class `CommandRouter`**:
  - `routeIntent(parsedIntent, context, source = 'VOICE')`:
    - *Parameters*: `parsedIntent` (`{ intent, entities }`), `context` (active UI snapshot), `source` (`'VOICE'|'TOUCH'|'CAMERA'`).
    - *Returns*: Typed command object or `null`.
    - *Supported Intents*: `FIND_BUYERS`, `CREATE_DRAFT_LOT`, `UPDATE_DRAFT`, `SELECT_OFFER`, `EXPLAIN_OFFER`, `REQUEST_ACCEPT_OFFER`, `CANCEL_BACK`, `QUERY_RATES`.
* **Exported Singleton**: `commandRouter`.

### 4.3 `commandSchemas.js`
* **Path**: `d:/SIH prototype ps2/src/commands/commandSchemas.js`
* **Role**: Runtime validation schemas for commands.
* **Exported Functions**:
  - `validateCommand(command)`: Checks required fields (`type`, `source`, `timestamp`) and asserts payload types. Throws `TypeError` on malformed structures.

### 4.4 `commandTypes.js`
* **Path**: `d:/SIH prototype ps2/src/commands/commandTypes.js`
* **Role**: Immutable frozen enums for command types and input sources.
* **Exported Constants**:
  - `CommandTypes`: `CREATE_LOT_DRAFT`, `UPDATE_WEIGHT`, `UPDATE_MATERIAL`, `FIND_BUYERS`, `SELECT_OFFER`, `EXPLAIN_OFFER`, `REQUEST_ACCEPT_OFFER`, `COMMIT_TRANSACTION`, `NAVIGATE_TO`, `NAVIGATE_BACK`, `QUERY_MARKET_RATES`.
  - `InputSources`: `VOICE`, `TOUCH`, `CAMERA`, `SYSTEM`.

---

## 5. Domain State Machines & Logic (`src/domain/`)

### 5.1 `src/domain/lots/LotStore.js`
* **Path**: `d:/SIH prototype ps2/src/domain/lots/LotStore.js`
* **Role**: The single owner of lot lifecycle business state.
* **Class `LotStore`**:
  - `createLot(commandId, { materialId, materialName, weightKg, unitsCount, grade })`: Instantiates new lot with status `DRAFT`.
  - `updateLot(commandId, lotId, patch)`: Mutates fields on a draft lot.
  - `quoteLot(commandId, lotId, { hazardLevel })`: Invokes logistics engine to generate recycler bids; transitions lot to `QUOTED`.
  - `acceptOffer(commandId, lotId, offerId)`: Arms confirmation gate; transitions lot to `ACCEPTED`.
  - `settleLot(commandId, lotId, nonce)`: Validates cryptographic authorization nonce; transitions lot to `SETTLED`.
  - `cancelLot(commandId, lotId)`: Transitions lot to `CANCELLED`.
  - `getLot(lotId)`, `getAllLots()`, `getActiveDraft()`: Query accessors.
* **Exported Singleton**: `lotStore`.
* **Exported Enums**: `LotStatus` (`DRAFT`, `QUOTED`, `ACCEPTED`, `SETTLED`, `CANCELLED`).

### 5.2 `src/domain/marketplace/NegotiationState.js`
* **Path**: `d:/SIH prototype ps2/src/domain/marketplace/NegotiationState.js`
* **Role**: State machine tracking user negotiation and offer selection intent.
* **Class `NegotiationState`**:
  - `selectOffer(offerIndex, offer, lotId)`: Transitions to `SELECTED`.
  - `armAcceptance()`: Transitions to `ACCEPTANCE_ARMED` (waiting for physical touch gate).
  - `commit(nonce)`: Transitions to `COMMITTED`.
  - `cancel(reason)`: Transitions to `CANCELLED`.
  - `snapshot()`: Returns immutable state object.
* **Exported Singleton**: `negotiationState`.
* **Exported Enums**: `NegotiationStatus`.

### 5.3 `src/domain/marketplace/OfferSimulator.js`
* **Path**: `d:/SIH prototype ps2/src/domain/marketplace/OfferSimulator.js`
* **Role**: Deterministic generator for recycler bids with 30-minute TTL caching.
* **Exported Functions**:
  - `queryOffers(lotDraft, requestedQueryId)`: Generates/retrieves offers with idempotency and deterministic price drift.
  - `invalidateOffers(materialId, weightKg)`: Purges cache on lot modifications.
  - `areOffersExpired(queryId)`: Checks offer freshness.
  - `clearOfferCache()`: Wipes offer cache on session termination.

### 5.4 `src/domain/pricing/PriceOracle.js`
* **Path**: `d:/SIH prototype ps2/src/domain/pricing/PriceOracle.js`
* **Role**: Benchmark price accessor with deterministic session drift (±3% over 10 minutes, non-random).
* **Exported Functions**:
  - `getBenchmark(materialId)`: Returns current benchmark rate, base rate, timestamp, age, and confidence (`HIGH`|`MEDIUM`|`LOW`).
  - `estimateGrossValue(materialId, weightKg)`: Computes total gross estimate.

---

## 6. Statutory Policy & Safety Gate Engine (`src/policy/`)

### 6.1 `PolicyEngine.js`
* **Path**: `d:/SIH prototype ps2/src/policy/PolicyEngine.js`
* **Role**: Deterministic legal, financial, and CPCB compliance evaluator.
* **Class `PolicyEngine`**:
  - `static evaluate(command, appState)`:
    - Evaluates confirmation prerequisites via `ConfirmationPolicy`.
    - Evaluates CPCB verification: blocks unverified buyers missing statutory registration numbers (`UNVERIFIED_BUYER_BLOCKED`).
    - Returns `{ allowed, requiresConfirmation, confirmationType, durationMs, promptText, policyApplied }`.
  - `static authorizeCommit({ confirmationType, actualHoldDurationMs })`:
    - Enforces that `PHYSICAL_HOLD_5S` must have sustained contact for at least 4,900 ms.
    - Returns `{ authorized: true, nonce: 'tx_...' }` or rejection reason `INSUFFICIENT_HOLD_DURATION`.

### 6.2 `ConfirmationPolicy.js`
* **Path**: `d:/SIH prototype ps2/src/policy/ConfirmationPolicy.js`
* **Role**: Evaluates the risk and consequence level of financial actions.
* **Class `ConfirmationPolicy`**:
  - `HIGH_VALUE_THRESHOLD`: Set to **₹1,00,000 INR**.
  - `static evaluate(command)`:
    - If `REQUEST_ACCEPT_OFFER` and `netPayout >= 100000`: requires `PHYSICAL_HOLD_5S` (5-second touch hold).
    - If `REQUEST_ACCEPT_OFFER` and `netPayout < 100000`: requires `PHYSICAL_TAP`.
    - Low-risk/reversible commands return `NONE`.

---

## 7. Storage, IndexedDB & Offline Repositories (`src/storage/`)

### 7.1 `db.js`
* **Path**: `d:/SIH prototype ps2/src/storage/db.js`
* **Role**: IndexedDB initialization, schema definition, and transaction helpers.
* **Database Name**: `ewb_v4` (Version 1).
* **Object Stores**:
  - `lots`: Primary key `lotId`, indexes on `status`, `createdAt`, `collectorId`, `materialId`.
  - `events`: Append-only audit log, primary key `eventId`, indexes on `aggregateId`, `timestamp`, `eventType`.
  - `syncQueue`: Offline command queue, primary key `commandId`, indexes on `createdAt`, `status`.
  - `buyRequests`: Standing procurement tenders, primary key `id`.
* **Exported Functions**:
  - `openDB()`: Opens and migrates IndexedDB database.
  - `promisifyRequest(request)`: Wraps native `IDBRequest` into a Promise.
  - `withTransaction(db, storeNames, mode, callback)`: Safely executes a transaction and resolves upon `oncomplete`.

### 7.2 `Repository.js`
* **Path**: `d:/SIH prototype ps2/src/storage/Repository.js`
* **Role**: Abstract Base Repository interface and `MemoryRepository` fallback for SSR/tests.
* **Methods**: `save(e)`, `saveAll(es)`, `findById(id)`, `findAll()`, `query(predicate)`, `delete(id)`, `clear()`, `count()`.

### 7.3 `stores/LotRepository.js`
* **Path**: `d:/SIH prototype ps2/src/storage/stores/LotRepository.js`
* **Role**: Manages persistent lots across IndexedDB and synchronous memory cache. Seeds initial lots from `INITIAL_LOTS` if empty.
* **Exported Singleton**: `lotRepository`.

### 7.4 `stores/SyncQueueRepository.js`
* **Path**: `d:/SIH prototype ps2/src/storage/stores/SyncQueueRepository.js`
* **Role**: Persistent queue for commands generated while offline.
* **Methods**:
  - `enqueue(command)`: Saves offline command with `syncStatus: 'PENDING'`.
  - `getPending()`: Retrieves FIFO-ordered pending queue.
  - `updateStatus(commandId, syncStatus, serverResponse)`: Updates status after server synchronization.
  - `flushAccepted()`: Cleans up accepted commands.
* **Exported Singleton**: `syncQueueRepository`.

### 7.5 `stores/EventLogRepository.js` & `BuyRequestRepository.js`
* **Paths**: `d:/SIH prototype ps2/src/storage/stores/EventLogRepository.js`, `d:/SIH prototype ps2/src/storage/stores/BuyRequestRepository.js`
* **Role**: Implements append-only event logging for Form-6 chain-of-custody audits and storage for standing procurement tenders.

---

## 8. Global Application State & Contexts (`src/state/` & `src/context/`)

### 8.1 `AppState.js`
* **Path**: `d:/SIH prototype ps2/src/state/AppState.js`
* **Role**: Defines canonical `INITIAL_APP_STATE` object.
* **Key Fields**:
  - `lots`: Array of all active and historical lots.
  - `activeLotDraft`: Current lot being created in scanner.
  - `visibleOffers`: Bids returned from reverse marketplace.
  - `collector`: User profile (`id`, `name`, `monthlyEarnings`, `totalDivertedKg`, `lotsCompleted`).
  - `activePersona`: Active role (`'COLLECTOR'|'RECYCLER'|'ADMIN'`).
  - `onlineStatus`: Connectivity indicator (`'ONLINE'|'OFFLINE'`).
  - `language`: Spoken/UI language code (`'hi'|'mr'|'en'`).
  - `transactionIntent`: Armed financial transaction details.

### 8.2 `appReducer.js`
* **Path**: `d:/SIH prototype ps2/src/state/appReducer.js`
* **Role**: Pure reducer function executing state transitions in response to `AppActions`.
* **Key Handlers**:
  - `CREATE_LOT_DRAFT`: Initializes new lot in draft state.
  - `UPDATE_LOT_DRAFT`: Updates weight, material, units.
  - `COMMIT_LOT`: Slices lot into `lots` array, adds earnings, records GPS coordinates.
  - `RESET_TO_EMPTY`: Zeroes state for testing and clean-slate demonstration.
  - `LOAD_SEED_DATA`: Rehydrates canonical CPCB sample lots.
  - `SYNC_FROM_STORAGE`: Synchronizes multi-tab updates via storage events.

### 8.3 `AppActions.js`
* **Path**: `d:/SIH prototype ps2/src/state/AppActions.js`
* **Role**: Frozen enumeration of all allowable action types.

### 8.4 `AppStateContext.jsx`
* **Path**: `d:/SIH prototype ps2/src/state/AppStateContext.jsx`
* **Role**: React context provider injecting state, dispatch, and multi-tab synchronization.
* **Exported Hooks**:
  - `useAppState()`: Accesses state snapshot.
  - `useAppDispatch()`: Accesses dispatch function.

### 8.5 `selectors.js`
* **Path**: `d:/SIH prototype ps2/src/state/selectors.js`
* **Role**: Memoized selectors extracting derived domain data.
* **Exported Selectors**:
  - `selectActiveLots(state)`: Returns non-settled lots.
  - `selectSettledLots(state)`: Returns completed lots.
  - `selectTotalSettledEarnings(state)`: Sums cash collected.
  - `selectTotalPendingDues(state)`: Sums unpaid balances across pending lots.

### 8.6 Context Bridges (`src/context/`)
* **`CollectorAgentBridgeContext.jsx`**: Bridges the collector UI screen context with the voice assistant.
* **`InteractionFeedbackContext.jsx`**: Provides audio-haptic feedback dispatching.
* **`MarketplaceContext.jsx`**: Context provider managing real-time recycler bidding states.

---

## 9. Vernacular Voice & Audio Processing Pipeline (`src/voice/`)

### 9.1 `VoiceRuntime.js`
* **Path**: `d:/SIH prototype ps2/src/voice/VoiceRuntime.js`
* **Role**: Master orchestrator integrating audio capture, turn management, normalization, intent routing, and TTS playback.
* **Methods**:
  - `initialize(config)`: Connects audio sessions, barge-in detection, and telemetry.
  - `startListening()`: Activates VAD and ASR engine.
  - `stopListening()`: Suspends audio session and halts recognition.
  - `processCommittedTurn(rawTranscript, eotScore)`: Executes the full 7-stage NLP processing pipeline.
  - `updateTelemetry()`: Broadcasts latency and state metrics to UI modals.

### 9.2 `VoiceAdapter.js`
* **Path**: `d:/SIH prototype ps2/src/voice/VoiceAdapter.js`
* **Role**: Bridges Web Speech API / Whisper transcription with the `CommandBus`.
* **Methods**:
  - `processTranscript(rawText)`: Runs hallucination filter (`SpeechNormalizer.isNoiseArtifact`), normalizes text, extracts intent, and calls `executeCommand()`.

### 9.3 Speech Normalization Subsystem (`src/voice/normalization/`)
* **`SpeechNormalizer.js`**:
  - Master sanitization engine: coordinates language detection, filler cleaning, slang mapping, and backtracking.
  - `static isNoiseArtifact(raw)`: Authoritative hallucination detector filtering Whisper silence artifacts ("thank you for watching", "amara.org", repetitive loops).
* **`BacktrackResolver.js`**:
  - Resolves self-corrections within a single utterance (e.g., *"10 kilo... nahi 12 kilo"* -> extracts `12 kg` and marks `wasCorrected: true`).
* **`TokenRoleClassifier.js`**:
  - Classifies words into semantic roles (`QUANTITY`, `UNIT`, `MATERIAL`, `ACTION`, `FILLER`, `CORRECTION`).
* **`FillerFilter.js`**:
  - Strips colloquial conversational fillers (e.g., *"uh"*, *"um"*, *"मतलब"*, *"यार"*, *"अरे"*).
* **`CorrectionMemory.js`**:
  - Client-side memory mapping user-specific colloquialisms to canonical names.

### 9.4 Turn Management & VAD (`src/voice/turn/` & `src/voice/audio/`)
* **`TurnManager.js`**:
  - Manages conversational states (`IDLE`, `LISTENING`, `PAUSED_WAITING`, `PROCESSING`, `SPEAKING`). Allows collectors to pause mid-sentence without cutting off recognition.
* **`HeuristicEotDetector.js`**:
  - End-Of-Turn detector calculating completion probabilities based on grammatical cues and acoustic silence.
* **`AudioSession.js` & `VadEngine.js`**:
  - Low-level Web Audio API manager with Voice Activity Detection and acoustic echo cancellation.

### 9.5 Language Understanding & TTS (`src/voice/understanding/`, `src/voice/intent/`, `src/voice/tts/`)
* **`LanguageDetector.js`**:
  - Auto-detects spoken Hindi, Marathi, or English even if UI language is set differently.
* **`IntentEngine.js` & `EntityExtractor.js`**:
  - Classifies conversational utterances into structured intents with numeric extraction supporting Indian vernacular fractions (*सवा* = 1.25, *डेढ़* = 1.5, *ढाई* = 2.5).
* **`TTSProvider.js` & `ResponseGenerator.js`**:
  - Generates natural vernacular spoken responses using pre-rendered studio synthetic audio clips (`indicF5AudioBank.js`) or Web Speech synthesis fallback.

---

## 10. Event Buses, Dispatchers & Services (`src/services/` & `src/interaction/`)

### 10.1 `InteractionBus.js`
* **Path**: `d:/SIH prototype ps2/src/interaction/InteractionBus.js`
* **Role**: Decoupled Pub/Sub event bus for cross-cutting voice, tactile, and policy events.
* **Exported Singleton**: `interactionBus`.
* **Events**: `POLICY_GATE`, `COMMAND_DISPATCHED`, `STATE_CHANGE`, `BARGE_IN`.

### 10.2 `voiceAgentEngine.js` & `voiceIntentEngine.js`
* **Paths**: `d:/SIH prototype ps2/src/services/voiceAgentEngine.js`, `d:/SIH prototype ps2/src/services/voiceIntentEngine.js`
* **Role**: Comprehensive service wrappers managing live mic input, audio visualizer levels, and streaming transcription fallbacks.

### 10.3 `feedbackDispatcher.js`
* **Path**: `d:/SIH prototype ps2/src/services/feedbackDispatcher.js`
* **Role**: Coordinates simultaneous audio chimes and haptic vibrations (`navigator.vibrate`) for low-literacy collectors.

---

## 11. CPCB Datasets & Relational Database Layer (`src/data/` & `src/database/`)

### 11.1 `src/data/materialTaxonomy.js`
* **Path**: `d:/SIH prototype ps2/src/data/materialTaxonomy.js`
* **Role**: Master CPCB Schedule I e-waste material taxonomy.
* **9 Statutory Streams**:
  1. `smartphones`: Telecom & Consumer (TEL-MOB), CPCB ITEW1.
  2. `laptops`: IT & Computing (ITC-LAP), CPCB ITEW2.
  3. `pcb`: High-grade Circuit Boards (PCB-HIGH), CPCB Schedule I.
  4. `batteries`: Lithium-Ion & Lead-Acid (BAT-LION), Hazardous Waste Rules.
  5. `cables`: Copper & Insulated Wiring (CAB-COP), CPCB Secondary Metals.
  6. `crt`: Cathode Ray Tubes & Leaded Glass (CRT-GLS), CPCB Toxic Stream.
  7. `lcd_panels`: Flat Displays with Mercury Backlights (DISP-LCD), CPCB Schedule I.
  8. `abs_plastic`: Mixed Plastics & ABS Casings (POL-MIX), Polymers.
  9. `motors_magnets`: Motors & Magnet-Bearing Assemblies (EEM-MOT), Rare-Earth Magnets (NdFeB).

### 11.2 `src/database/dbService.js`
* **Path**: `d:/SIH prototype ps2/src/database/dbService.js`
* **Role**: Relational database abstraction layer interfacing SQLite / IndexedDB schemas with JSON datasets.

### 11.3 `src/database/seedData.js`
* **Path**: `d:/SIH prototype ps2/src/database/seedData.js`
* **Role**: Canonical seed data generator exporting standard CPCB benchmarks, authorized recyclers, and field research dossiers.

### 11.4 `schema.sql` & `seed_dump.sql`
* **Paths**: `d:/SIH prototype ps2/src/database/schema.sql`, `d:/SIH prototype ps2/src/database/seed_dump.sql`
* **Role**: Production PostgreSQL / SQLite DDL schemas and insert statements for enterprise database hydration.

---

## 12. React UI Components (`src/components/`)

### 12.1 Collector Components (`src/components/collector/`)
* **`CollectorHome.jsx`**:
  - Main dashboard for informal collectors.
  - Renders **Split Hero Balance Card**: Left side displays Total Settled Cash (`₹89,450`), Right side displays interactive Pending Dues Widget (`₹3,000`), clickable to jump directly to pending transactions.
  - Action cards: *Sell E-Waste (कैमरा स्कैनर)*, *My Lots & Earnings (मेरे लॉट और कमाई)*, *Price Board (भाव सूची)*, *Safety Advisories (सुरक्षा निर्देश)*, *Field Research (फील्ड रिसर्च)*, and *AI Stack Inspector (AI स्टैक)*.
* **`LotsAndReceiptsList.jsx`**:
  - Financial earnings and pending dues ledger.
  - Displays 3-KPI Summary Banner: `CASH PAID` (`₹totalSettledEarnings`), `PENDING DUES` (`₹totalPendingDues`), and `WEIGHT` (`totalDivertedWeight kg`).
  - Filter tabs: `ALL`, `PENDING DUES (बाकी रोकड़)`, `QUOTED`, `COMPLETED`.
  - Color-coded badges: `PAID & SETTLED (नकद जमा पूर्ण)`, `PENDING CASH AT GATE (बाकी रोकड़: ₹X)`, `PARTIAL PAID (अंशतः जमा)`.
  - Footers displaying payment settlement mode: `Spot Cash in Hand (Default)` vs `UPI Escrow (Optional)`.
* **`HandoverReceipt.jsx`**:
  - Statutory Form-6 Hazardous Waste Manifest receipt modal.
  - Features real-time GPS coordinate stamping (`19.082500° N, 73.018200° E`).
  - Features **Cash Settlement Guarantee Voucher** (`DEFAULT SETTLEMENT: SPOT CASH IN HAND / हस्ते रोख प्रदान हमी`), guaranteeing spot cash at intake scales.
* **`MaterialScanner.jsx`**:
  - Camera OCR and simulated image classification interface with live voice command support.
* **`ReverseMarketplace.jsx`**:
  - Displays transparent bids from CPCB-authorized recyclers, showing gross price, logistics deductions, and net collector payout.
* **`SmartNegotiationModal.jsx`**:
  - Simulates bilateral counter-offer negotiations between collector and recycler.
* **`PriceBoardModal.jsx`**:
  - Displays live CPCB benchmark rates and 7-day price time series with trend percentages.
* **`SafetyModal.jsx`**:
  - Visual, low-literacy safety guides detailing handling procedures for toxic chemicals, leaded glass, and lithium fire hazards.
* **`FieldResearchModal.jsx`**:
  - Documents primary field research dossiers from Dharavi scrap clusters, proving a +40.8% net income improvement.
* **`AIStackInspectorModal.jsx`**:
  - Technical debugging console showing real-time ASR transcriptions, intent classifications, and policy evaluation decisions for hackathon evaluators.
* **`CollectorPhoneWrapper.jsx`**:
  - Mobile phone shell wrapping the collector experience with an Android-style status bar and persistent hold-to-speak voice interaction.

### 12.2 Recycler & Admin Components
* **`RecyclerTerminal.jsx`**:
  - Enterprise portal for authorized recyclers to publish procurement bids, accept incoming deliveries, conduct physical gate scale weigh-ins, and confirm cash disbursements.
* **`TraceabilityCenter.jsx`**:
  - CPCB regulatory audit portal tracking end-to-end mass balance, EPR target compliance, and illegal processing anomaly detection across states.

### 12.3 Shared UI Primitives (`src/components/shared/`)
* **`HoldToConfirmButton.jsx`**:
  - High-value statutory safety button requiring **5,000 ms of continuous physical touch** for transactions >= ₹1,00,000. Prevents accidental verbal commits.
* **`HoldToSpeakButton.jsx`**:
  - Push-to-talk microphone button with dynamic audio-level ripple animation.
* **`AppHeader.jsx`**:
  - Top navigation bar featuring persona switching, language toggle (`HI`/`MR`/`EN`), and offline status indicator.
* **`ErrorBoundary.jsx`**:
  - React error boundary providing graceful vernacular crash recovery.

---

## 13. Vernacular Localization Assets (`src/locales/`)

* **`en.json`**: Complete English translation dictionary.
* **`hi.json`**: Colloquial Hindi localization tailored for North Indian scrap hubs (Dharavi, Seelampur, Mayapuri).
* **`mr.json`**: Colloquial Marathi localization tailored for Maharashtra scrap aggregators (Kurla, Bhiwandi, Pune).

---

## 14. PWA Service Worker & Public Assets (`public/`)

### 14.1 `public/sw.js`
* **Path**: `d:/SIH prototype ps2/public/sw.js`
* **Role**: Production offline-first Service Worker.
* **Strategies**:
  - Pre-caches all core assets and all 11 datasets during `install`.
  - **Stale-While-Revalidate** for all `/datasets/*.json` requests.
  - **Cache-First with Network Fallback** for static JS, CSS, and fonts.
  - **Navigation Fallback** to `/index.html` ensuring full offline operation when disconnected.

### 14.2 `public/manifest.webmanifest`
* **Path**: `d:/SIH prototype ps2/public/manifest.webmanifest`
* **Role**: Progressive Web App manifest configuring standalone mobile installation.

---

## 15. CLI Scripts & Automation (`scripts/` & `reset.js` & `seed.js`)

* **`scripts/seed.js`**: Generates and exports canonical JSON, CSV, and SQL dataset files.
* **`scripts/reset.js`**: Wipes active database tables and resets the prototype to a pristine empty state.
* **`scratch/test_dataset_flow.js`**: 52-point automated verification suite asserting schema integrity, CPCB material taxonomy parity, and reducer transitions.
* **`scratch/test_modular_runtime.js`**: 41-point automated test suite verifying speech normalizer backtracking, auto language detection, pause tolerance, and ₹1L hold gates.

---
*End of Master Codebase File & Function Dictionary — SIH 2026 Problem Statement 2*
