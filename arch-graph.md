# System Architecture & Modular Dataflow Graphs
## E-Waste Bridge: Autonomous Vernacular Voice & Reverse Logistics Platform
**Smart India Hackathon 2026 | Problem Statement 2 (SIH PS2)**

---

## 1. High-Level Modular System Architecture (Executive Slide)

```mermaid
graph TB
    subgraph S1 ["1. EDGE PERCEPTION & AUDIO INGESTION"]
        MIC["Hardware Microphone"] --> GAIN["Web Audio GainNode (1.4x - 3.5x)"]
        GAIN --> ANL["AnalyserNode (128 FFT, RMS Level)"]
        ANL --> VAD["Real-Time VAD & TurnManager"]
        ANL --> CALIB["Voice Calibration Wizard (3s Silence / 2s Gap / 10s Voice)"]
        VAD --> NORM["SpeechNormalizer (Fractions, Backtracking, Fillers)"]
        NORM --> LANG["LanguageDetector (Hindi, Marathi, English)"]
    end

    subgraph S2 ["2. SINGLE ADAPTER GATEWAY"]
        LANG --> ADAPT["VoiceAdapter (Idempotency & Noise Suppression)"]
    end

    subgraph S3 ["3. COGNITIVE INTENT & POLICY ENGINE"]
        ADAPT --> AGENT["VoiceAgentEngine (Domain Intent Classifier)"]
        AGENT --> POLICY["PolicyEngine & CPCB Rule 14 Safety Guards"]
        POLICY --> HIGHVAL["High-Value Policy Gate (>= 1L INR: 5,000ms Touch-and-Hold)"]
        POLICY --> HAZARD["CPCB Hazard Interceptor (Battery Fire, Acid, Burning)"]
        POLICY --> REJECT["Non-E-Waste Rejection Guard (Aloo, Pyaz, Raddi)"]
    end

    subgraph S4 ["4. MARKETPLACE & REVERSE LOGISTICS"]
        AGENT --> LOGISTICS["LogisticsEngine (3-Bidder Competitive Routing)"]
        LOGISTICS --> NET["Net Payout Calculator (Gross - Logistics - Fee)"]
        NET --> STORE["LotStore (Deterministic Lot State Machine)"]
    end

    subgraph S5 ["5. AUDITABLE LEDGER & OFFLINE RESILIENCE"]
        STORE --> APPSTATE["AppState & AppReducer (Single Source of Truth)"]
        APPSTATE --> OFFLINE["Encrypted Offline Sync Queue (Local Storage)"]
        APPSTATE --> LEDGER["Fintech Balance & Pending Dues Sync"]
    end

    subgraph S6 ["6. VERNACULAR SPEECH SYNTHESIS (TTS)"]
        AGENT --> TTSNORM["TTSNormalizer (Devanagari Currency & Numbers)"]
        TTSNORM --> TTS["TTSProvider (Sweet Female Neural Voice Hierarchy)"]
        TTS --> SWARA["Microsoft Swara (Hindi Female, Natural)"]
        TTS --> AAROHI["Microsoft Aarohi (Marathi Female, Natural)"]
        TTS --> NEERJA["Microsoft Neerja (English Female, Natural)"]
        TTS --> AUDIOBANK["IndicF5 Studio Audio Bank (Pre-Synthesized)"]
    end

    subgraph S7 ["7. USER INTERFACE & PHYSICAL FEEDBACK"]
        AGENT --> CARDS["Prepared Interactive Cards (Lot Prep, Negotiation, Ledger)"]
        CARDS --> PHONE["CollectorPhoneWrapper (Bottom Voice Orb)"]
        FEEDBACK["FeedbackDispatcher (Haptics & Tones)"] --> PHONE
        TTS --> SPEAKER["Device Speaker Output"]
    end

    classDef edge fill:#F4F9F4,stroke:#1B7943,stroke-width:2px,color:#12151A;
    classDef gate fill:#FFFBEB,stroke:#D97706,stroke-width:2px,color:#12151A;
    classDef core fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#12151A;
    classDef synth fill:#FDF4FF,stroke:#9333EA,stroke-width:2px,color:#12151A;
    classDef ui fill:#F8FAFC,stroke:#475569,stroke-width:2px,color:#12151A;

    class MIC,GAIN,ANL,VAD,CALIB,NORM,LANG edge;
    class ADAPT,POLICY,HIGHVAL,HAZARD,REJECT gate;
    class AGENT,LOGISTICS,NET,STORE,APPSTATE,OFFLINE,LEDGER core;
    class TTSNORM,TTS,SWARA,AAROHI,NEERJA,AUDIOBANK synth;
    class CARDS,PHONE,FEEDBACK,SPEAKER ui;
```

---

## 2. Edge Audio Processing & Turn Management (Deep-Dive Slide)

```mermaid
flowchart TD
    subgraph INTAKE ["Microphone Hardware & Web Audio Subsystem"]
        STREAM["navigator.mediaDevices.getUserMedia()"] --> GAIN["GainNode: micCalibration.gain (1.4x - 3.5x)"]
        GAIN --> ANALYSER["AnalyserNode: getFloatTimeDomainData()"]
        ANALYSER --> RMS["RMS Calculation: level = Math.min(100, round(rms * 650))"]
    end

    subgraph CALIBRATION ["Voice Calibration Subsystem (VoiceCalibrationModal.jsx)"]
        RMS --> CAL_CHECK{"Is Calibration Modal Open?"}
        CAL_CHECK -- Yes --> VU["Update Live VU Meter at 25 fps"]
        VU --> P1["Phase 1: Measure Silence Floor (3s, 75 samples)"]
        P1 --> P2["Phase 2: Preparation Gap (2s countdown)"]
        P2 --> P3["Phase 3: Sample Vocal Peak (10s, 250 samples)"]
        P3 --> CALC["Compute: threshold = max(2, round(floor + (peak - floor) * 0.22))"]
        CALC --> SAVE["Save to localStorage & update gainNode live"]
    end

    subgraph VAD_LOGIC ["Voice Activity Detection & Anti-Interruption Gate"]
        CAL_CHECK -- No --> VAD_GATE{"level >= speechThreshold?"}
        VAD_GATE -- Yes --> VOICE_START["Mark speech start, set state = LISTENING"]
        VAD_GATE -- No --> SILENCE{"Silence >= 450ms?"}
        SILENCE -- Yes --> HOLD_CHECK{"Is User Holding Mic Button?"}
        HOLD_CHECK -- Yes --> WAIT["Suppress Commit: User Still Holding Button"]
        HOLD_CHECK -- No --> COMMIT["Debounce 250ms & Trigger Turn Commit"]
    end

    subgraph NORMALIZER ["Vernacular Speech Normalization (SpeechNormalizer.js)"]
        COMMIT --> STRIP["Strip Fillers: 'um', 'uh', 'matlab', 'hmmm'"]
        STRIP --> REPAIR["Detect Backtracking: 'nahi nahi 12 kilo' -> 12 kg"]
        REPAIR --> FRACTION["Convert Fractions: 'dhai' -> 2.5, 'dedh' -> 1.5, 'sawa' -> +0.25"]
        FRACTION --> DIALECT["Slang Normalization: 'laptop ka maal' -> ITEW2 Laptop"]
        DIALECT --> LANG_DET["Detect Spoken Language: Hindi / Marathi / English"]
    end

    LANG_DET --> ROUTER["Forward Clean Transcript to VoiceAdapter"]
```

---

## 3. Cognitive Agent & Statutory Policy Enforcement (Security & Compliance Slide)

```mermaid
flowchart TD
    INCOMING["Clean Spoken Utterance + Active Context"] --> ROUTE["VoiceAdapter.processTranscript()"]
    ROUTE --> CLASSIFY["VoiceAgentEngine.classifyUtteranceIntent()"]

    subgraph INTENTS ["Intent Classification Matrix"]
        CLASSIFY --> I_SELL["CREATE_LOT: Sell scrap with weight & item"]
        CLASSIFY --> I_PRICE["PRICE_INQUIRY: Check market rates / bhav"]
        CLASSIFY --> I_EARN["CHECK_EARNINGS: Monthly earnings & dues"]
        CLASSIFY --> I_CAM["TRIGGER_CAMERA: Optical scan photo trigger"]
        CLASSIFY --> I_CONV["HOW_ARE_YOU / AUDIBILITY: Conversational check"]
        CLASSIFY --> I_REJ["REJECT_NON_EWASTE: Agricultural / non-electronic"]
        CLASSIFY --> I_HAZ["SAFETY_HAZARD: Lithium swelling / wire burning"]
    end

    subgraph POLICIES ["PolicyEngine Verification & Statutory Gates"]
        I_SELL --> VAL_CHECK{"Net Payout >= 1,00,000 INR?"}
        VAL_CHECK -- Yes --> HIGH_GATE["ENFORCE: 5,000ms Physical Touch-and-Hold"]
        HIGH_GATE --> HOLD_TIMER{"Hold Duration == 5,000ms?"}
        HOLD_TIMER -- Released Early --> REJECT_HOLD["Reject: INSUFFICIENT_HOLD_DURATION"]
        HOLD_TIMER -- Full 5s --> AUTH_COMMIT["Authorize High-Value Order Placement"]
        VAL_CHECK -- No --> TAP_GATE["Standard Single Physical Tap Authorization"]

        I_HAZ --> ENV_GATE["CPCB Rule 14 Violation Gate"]
        ENV_GATE --> BLOCK_HAZ["Block Transaction & Render Hazardous Protocol Card"]

        I_REJ --> NON_EW_GATE["CPCB Schedule I Material Check"]
        NON_EW_GATE --> BLOCK_NON["Block with Vernacular Audio Explanation"]
    end

    subgraph DISPATCH ["Action Dispatcher & State Transition"]
        TAP_GATE --> PREP_CARD["Prepare Interactive Action Card"]
        AUTH_COMMIT --> PREP_CARD
        BLOCK_HAZ --> PREP_CARD
        BLOCK_NON --> PREP_CARD
        I_EARN --> EARN_CARD["Synchronize with Dashboard Balance & Lots"]
        I_CONV --> CONV_CARD["Render Warm Conversational Reply + Quick Chips"]
    end

    PREP_CARD --> EXECUTE["Forward to UI & Trigger Sweet Neural TTS"]
    EARN_CARD --> EXECUTE
    CONV_CARD --> EXECUTE
```

---

## 4. Reverse Logistics, Marketplace Bidding & Lot Lifecycle (Business Slide)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Voice Intent parsed (e.g. 15 kg Laptops)
    
    state DRAFT {
        [*] --> MaterialIdentified
        MaterialIdentified --> QuantityValidated : Extract kg or units
        QuantityValidated --> CPCB_Classification : Map to Schedule I code (ITEW2)
    }

    DRAFT --> QUOTED : LogisticsEngine.generateMarketplaceOffers()

    state QUOTED {
        [*] --> QueryDistanceMatrix : Fetch recyclers within 15 km
        QueryDistanceMatrix --> ComputeBids : Recycler 1 (GreenTech), Recycler 2 (Apex), Recycler 3 (EcoGreen)
        ComputeBids --> NetDeduction : Net = Gross - LogisticsCost - PlatformFee
        NetDeduction --> DeicticGrounding : Resolve 'Beech wala' or 'Sabse achha wala'
    }

    QUOTED --> ACCEPTED : Physical Tap or 5,000ms Hold Authorization
    QUOTED --> CANCELLED : Collector declines or aborts

    state ACCEPTED {
        [*] --> LockBuyerOffer : Lock rate & generate unique QR code
        LockBuyerOffer --> GenerateCPCB_Pass : Create electronic manifest & custody record
        GenerateCPCB_Pass --> SchedulePickup : Assign transit window & notification
    }

    ACCEPTED --> SETTLED : Physical Intake weigh-in verified at recycling yard
    
    state SETTLED {
        [*] --> InstantCashSettlement : Immediate digital / cash disbursement
        InstantCashSettlement --> LedgerSync : Update collector.monthlyEarningsInr
        LedgerSync --> GreenCreditAudit : CPCB EPR credit points generated
    }

    SETTLED --> [*]
    CANCELLED --> [*]
```

---

## 5. Sweet Female Neural Voice & Speech Synthesis (Voice Persona Slide)

```mermaid
flowchart LR
    subgraph INPUT_TEXT ["Response Text Generator"]
        RAW_RESP["Spoken Response Text (Hindi / Marathi / English)"]
    end

    subgraph NORMALIZER ["TTSNormalizer Subsystem"]
        RAW_RESP --> SYMB["Expand Currency: '₹2,960' -> 'दोन हजार नऊशे साठ रुपये'"]
        SYMB --> NUMS["Expand Numbers & Decimals: '46.5 kg' -> '46.5 किलोग्राम'"]
        NUMS --> LATIN["Phonetic Latin Transliteration for Indian Accents"]
    end

    subgraph AUDIO_CACHE ["Layer 1: Pre-Synthesized Studio Audio Bank"]
        LATIN --> BANK_CHECK{"Precomputed IndicF5 Clip in Bank?"}
        BANK_CHECK -- Hit --> PLAY_MP3["Play AI4Bharat Studio Clip (0ms Latency)"]
    end

    subgraph NEURAL_SYNTH ["Layer 2: Sweet Female Neural Browser Fallback"]
        BANK_CHECK -- Miss --> VOICE_SEL["selectSweetFemaleVoice()"]
        
        VOICE_SEL --> BAN_MALE["Strict Male Voice Filter: isMaleVoice() == FALSE"]
        BAN_MALE --> LANG_SWITCH{"Target Language"}

        LANG_SWITCH -- Hindi --> SWARA["1. Microsoft Swara Online (Natural)<br/>2. Google Hindi Female<br/>3. Lekha / Kalpana"]
        LANG_SWITCH -- Marathi --> AAROHI["1. Microsoft Aarohi Online (Natural)<br/>2. Google Marathi Female<br/>3. Microsoft Swara Devanagari"]
        LANG_SWITCH -- English --> NEERJA["1. Microsoft Neerja Online (Natural)<br/>2. Apple Veena / Sangeeta<br/>3. Google Indian English Female"]

        SWARA --> PROSODY["Acoustic Prosody Tuning"]
        AAROHI --> PROSODY
        NEERJA --> PROSODY

        PROSODY --> PITCH["pitch = 1.16 (Warm feminine harmonics, eliminates robotic drone)"]
        PROSODY --> RATE["rate = 0.88 (Gentle, unhurried, reassuring cadence)"]
        PROSODY --> VOL["volume = 1.0 (Crisp vernacular clarity)"]

        PITCH --> UTTER["window.speechSynthesis.speak(utterance)"]
        RATE --> UTTER
        VOL --> UTTER
    end

    subgraph BARGE_IN ["Barge-In Interrupt Controller"]
        UTTER --> AUDIO_OUT["Audio Playback to User"]
        PLAY_MP3 --> AUDIO_OUT
        MIC_INT["User begins speaking / presses mic"] -.-> ABORT["ttsProvider.stop(): Immediate Audio & Synthesis Abort"]
    end
```

---

## 6. Full Codebase Component Mapping Matrix

| Layer | Primary Source File | Core Classes & Functions | Purpose & Responsibility |
| :--- | :--- | :--- | :--- |
| **Edge Audio** | `src/components/collector/CollectorPhoneWrapper.jsx` | `startLiveMicAudio()`, `updateVolume()` | Web Audio API setup, gain boosting, real-time RMS metering. |
| **Calibration** | `src/components/collector/VoiceCalibrationModal.jsx` | `startAutoCalibration()`, `applyPreset()` | 3s silence, 2s gap, 10s voice peak, adaptive threshold auto-tuning. |
| **Turn Manager** | `src/voice/turn/TurnManager.js` | `TurnManager`, `onInterim()`, `commitTurn()` | Concurrency control, pause buffers, anti-interruption hold logic. |
| **Normalizer** | `src/voice/normalization/SpeechNormalizer.js` | `SpeechNormalizer.normalize()` | Devanagari numerals, vernacular fractions, filler stripping, repairs. |
| **Single Adapter** | `src/voice/VoiceAdapter.js` | `processTranscript()`, `resetAdapterSession()` | Single gateway, noise artifact filtering, idempotency guards. |
| **Agent Engine** | `src/services/voiceAgentEngine.js` | `processAgentUtterance()`, `classifyUtteranceIntent()` | Intent classification, entity extraction, prepared card generation. |
| **Policy Engine** | `src/voice/policy/PolicyEngine.js` | `PolicyEngine.evaluate()` | Statutory gates: 5,000ms hold for $\ge$ ₹1L, CPCB safety blocks. |
| **Lot State** | `src/domain/lots/LotStore.js` | `LotStore`, `LotStatus` | Deterministic lifecycle: DRAFT $\to$ QUOTED $\to$ ACCEPTED $\to$ SETTLED. |
| **TTS Engine** | `src/voice/tts/TTSProvider.js` | `TTSProvider`, `selectSweetFemaleVoice()` | Male voice blocking, Swara/Aarohi/Neerja selection, prosody shaping. |
| **Phonetics** | `src/voice/tts/TTSNormalizer.js` | `normalizeForTTS()` | Converts currency symbols and decimals into phonetic Devanagari text. |
| **Audio Bank** | `src/data/indicF5AudioBank.js` | `IndicF5AudioBank.findMatch()` | Zero-latency studio audio playback for standard vernacular phrases. |
| **App State** | `src/context/MarketplaceContext.jsx` | `MarketplaceProvider`, `useMarketplace()` | Global state shim, offline synchronization queue, fintech sync. |

---

## 7. Key System Differentiators for Hackathon Evaluation

1. **100% Zero-Paid-API Architecture**: Operates entirely on client-side Web Audio API, browser neural synthesis, and local Whisper without paying external speech API costs.
2. **CPCB Statutory Guard Rails**: Programmatically enforces E-Waste Management Rules 2022 (Hazardous waste interception, Rule 14 manifest tracking, and 5-second hold confirmation on transactions $\ge$ ₹1,00,000).
3. **True Vernacular Inclusion**: Handles Indian vernacular fractions (*सवा, पौने, डेढ़, ढाई*), mid-sentence corrections (*"नहीं नहीं 12 किलो"*), and Devanagari financial readouts.
4. **Sweet, Empathetic Audio Persona**: Completely eliminates robotic male desktop synthesizers, utilizing warm neural female voices tuned to unhurried, reassuring prosody (*pitch 1.16, rate 0.88*).
5. **Field Resilience**: Encrypted offline-first queue preserves transactions in disconnected scrap yard environments and automatically flushes when reconnected.
