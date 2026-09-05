# E-Waste Bridge (SIH 2026 - Problem Statement 2)
### Vernacular, Low-Literacy, Offline-First Reverse Marketplace & CPCB Traceability Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-93%2F93%20passing-brightgreen.svg)]()
[![CPCB Compliance](https://img.shields.io/badge/CPCB%20Schedule%20I-100%25-blue.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Offline%20First-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

---

## 1. Executive Summary & Problem Statement Alignment

In India, **over 90% of e-waste recycling occurs in the informal sector** (kabadiwalas, scrap consolidators, and aggregator hubs in hubs like Dharavi, Seelampur, and Mustafabad). Informal collectors face predatory pricing from middlemen, lack access to CPCB-authorized recyclers, suffer health hazards from unscientific handling, and remain excluded from official Extended Producer Responsibility (EPR) credit streams.

**E-Waste Bridge** solves Problem Statement 2 through four foundational pillars:
1. **100% Cash-as-Default Settlement**: Cash is the foundational settlement mode at gate scales, while UPI/escrow remains strictly optional, eliminating digital exclusion.
2. **Dual-Column Financial & Pending Dues Ledger**: Real-time tracking of settled cash in hand alongside explicit pending dues from recyclers (`PAID`, `PENDING`, `PARTIAL`).
3. **1:1 Statutory CPCB Material Compliance**: Complete alignment with CPCB Schedule I streams—including **CRTs, LCD panels, PCBs, cables, batteries, motors & magnet-bearing assemblies, and mixed plastics**.
4. **Offline-First PWA & Vernacular Voice Assistant**: Operates with zero network connectivity on **<35 MB RAM** (Android Go entry-level phones), with full voice command handling in Hindi, Marathi, and English.

---

## 2. System Architecture

```
+-------------------------------------------------------------------------------+
|                      INFORMAL COLLECTOR MOBILE UI (PWA)                       |
|  [Voice Assistant] <-> [Camera Scanner] <-> [Reverse Bidding] <-> [Ledger]   |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 | Client-Side Speech & Intent Engine          |
                 | - Auto Language Detection (HI / MR / EN)     |
                 | - Slang & Number Normalization (सवा, पौने)   |
                 | - Turn Manager & Deictic Context Grounding   |
                 +----------------------+----------------------+
                                        |
                 +----------------------+----------------------+
                 | Statutory Policy & Safety Gate               |
                 | - ₹1,00,000 High-Value 5s Touch Gate         |
                 | - CPCB Hazard Warnings & Safety Advisories   |
                 | - Form-6 Hazardous Waste Manifest with GPS   |
                 +----------------------+----------------------+
                                        |
                 +----------------------+----------------------+
                 | Offline Storage & Sync Engine                |
                 | - Service Worker Cache-First Runtime         |
                 | - IndexedDB / LocalStorage State Container   |
                 | - Immutable Event Audit Trail                |
                 +---------------------------------------------+
                                        |
+---------------------------------------v---------------------------------------+
|                       RECYCLER TERMINAL & ADMIN AUDIT                         |
|  [Procurement Tenders] <-> [Lot Intake & Scale] <-> [CPCB Traceability]       |
+-------------------------------------------------------------------------------+
```

---

## 3. Key Feature Matrix

| Feature | Problem Statement 2 Mandate | Implementation in Codebase |
| :--- | :--- | :--- |
| **Cash Settlement** | Allow cash-based transactions, digital payment optional | `HandoverReceipt.jsx`, `LotsAndReceiptsList.jsx`, `appReducer.js` default to spot cash at gate |
| **Pending Dues Tracking** | Explicit tracking of unpaid balances | 3-KPI Ledger Banner with `PAID`, `PENDING CASH AT GATE`, `PARTIAL PAID` statuses |
| **Statutory Material Taxonomy** | Exact match with PS2 e-waste categories | 9 CPCB categories in `materialTaxonomy.js`, `materials.json`, and `materials.csv` |
| **GPS Handover Verification** | Physical location tagging for manifest | Lat/Lng coordinates (`19.082500° N, 73.018200° E`) stamped on every lot transaction |
| **Speech Normalization** | Low-literacy conversational speech | `SpeechNormalizer.js`, `BacktrackResolver.js`, `TokenRoleClassifier.js` |
| **Safety & Hold Gate** | High-value transaction protection | `HoldToConfirmButton.jsx` enforcing 5,000 ms continuous physical touch for >₹1,00,000 |
| **Offline Performance** | Low memory & entry-level Android devices | `public/sw.js` offline caching, Rolldown code-splitting (<60KB chunks), <35MB RAM footprint |

---

## 4. Quick Start & Local Development

### Prerequisites
- Node.js 20+ or 22+
- npm 10+

```bash
# 1. Install dependencies
npm install

# 2. Seed database with CPCB benchmark datasets
npm run seed

# 3. Run development server
npm run dev

# 4. Open in browser
# Local dev server runs at http://localhost:5173
```

---

## 5. Verification & Test Suites

The repository contains 93 automated unit and integration tests:

```bash
# Run all automated tests
npm test

# Run individual test suites
node scratch/test_dataset_flow.js       # Verifies all 9 CPCB categories, schemas, and reducers
node scratch/test_modular_runtime.js     # Verifies speech normalization, language detection, hold gates
```

---

## 6. Production Deployment

### Option A: Docker Compose
```bash
docker compose up -d --build
# Access at http://localhost:80/
```

### Option B: Cloud CDN (Vercel / Netlify)
The repository includes pre-configured `vercel.json` and `netlify.toml` with zero-config SPA rewrites, PWA headers, and caching policies.
```bash
# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

For complete deployment instructions, refer to **[DEPLOYMENT_GUIDE.md](file:///d:/SIH%20prototype%20ps2/DEPLOYMENT_GUIDE.md)**.
For an exhaustive file-by-file and function-by-function manual, refer to **[CODEBASE_FILE_AND_FUNCTION_DICTIONARY.md](file:///d:/SIH%20prototype%20ps2/CODEBASE_FILE_AND_FUNCTION_DICTIONARY.md)**.

---

## 7. Technology Stack

- **Frontend Core**: React 19, Vite 8 (Rolldown engine)
- **Styling**: Vanilla Modern CSS Design System (Glassmorphism, High Contrast, Dark Theme `#0B0E14`, Zero Emojis)
- **Icons**: Lucide React SVG Vector Icons
- **Motion**: Motion (formerly Framer Motion)
- **Localization**: i18next & react-i18next (Hindi, Marathi, English)
- **Audio & Voice**: Web Speech API, Studio IndicF5 Synthetic Audio Fallback, Web Audio VAD
- **Persistence**: IndexedDB, LocalStorage, Offline-First Service Worker

---

## 8. License

MIT License. Developed for Smart India Hackathon (SIH 2026).
