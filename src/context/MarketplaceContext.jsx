/**
 * MarketplaceContext.jsx — COMPATIBILITY SHIM (V4 Migration)
 * Part of E-Waste Bridge Architecture Blueprint v4
 *
 * ╔════════════════════════════════════════════════════════════════╗
 * ║  THIS FILE IS A SHIM. DO NOT ADD BUSINESS LOGIC HERE.        ║
 * ║                                                               ║
 * ║  V4 Single Source of Truth: AppState (useReducer)            ║
 * ║  This shim reads from AppState and exposes the same API       ║
 * ║  that existed in V3 MarketplaceContext so existing components ║
 * ║  continue to work without changes during Phase 1 migration.   ║
 * ║                                                               ║
 * ║  DELETION SCHEDULE: End of Phase 5.                           ║
 * ║  All consumers will migrate to useAppState() + selectors.     ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

import React, { createContext, useContext } from "react";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";
import { TRANSLATIONS } from "../data/translations";
import { ttsProvider } from "../voice/tts/TTSProvider";
import { useAppState, useAppDispatch } from "../state/AppStateContext";
import { AppActions } from "../state/AppActions";
import { executeCommand } from "../commands/CommandBus";
import { MATERIAL_TAXONOMY } from "../data/materialTaxonomy";

const MarketplaceContext = createContext(null);

export function MarketplaceProvider({ children }) {
  // Shim: delegate state reads to AppState
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { t: i18nT } = useTranslation();

  // ── Language ──────────────────────────────────────────────────────────────
  const setLanguage = (lng) => {
    dispatch({ type: AppActions.SET_LANGUAGE, payload: { language: lng } });
    i18n.changeLanguage(lng);
  };

  // ── Network toggle (demo UI control) ─────────────────────────────────────
  const toggleNetworkState = () => {
    if (state.onlineStatus === "ONLINE") {
      dispatch({ type: AppActions.SET_ONLINE_STATUS, payload: { status: "OFFLINE" } });
      dispatch({
        type: AppActions.SET_SYNC_TOAST,
        payload: { title: "SIMULATING OFFLINE FIELD ENVIRONMENT", message: "No live network. Lots created will be preserved in encrypted local storage." }
      });
      setTimeout(() => dispatch({ type: AppActions.CLEAR_SYNC_TOAST }), 4000);
    } else {
      dispatch({ type: AppActions.SET_ONLINE_STATUS, payload: { status: "SYNCING" } });
      dispatch({
        type: AppActions.SET_SYNC_TOAST,
        payload: { title: "NETWORK RESTORED — SYNCING LOCAL QUEUE", message: `Synchronizing ${state.syncQueue.length} queued transaction(s)...` }
      });
      setTimeout(() => {
        // Flush sync queue into lots
        const queuedLots = state.syncQueue
          .filter((cmd) => cmd.type === "CREATE_LOT_DRAFT")
          .map((cmd) => cmd.payload);

        if (queuedLots.length > 0) {
          queuedLots.forEach((lot) =>
            dispatch({ type: AppActions.ADD_LOT, payload: { lot } })
          );
        }
        dispatch({ type: AppActions.FLUSH_SYNC_QUEUE, payload: { lots: [] } });
        dispatch({
          type: AppActions.SET_SYNC_TOAST,
          payload: { title: "SYNC COMPLETE", message: "All field transactions confirmed." }
        });
        setTimeout(() => dispatch({ type: AppActions.CLEAR_SYNC_TOAST }), 4000);
      }, 1500);
    }
  };

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speakPrompt = (textOrKey, targetLang = null) => {
    const textToSpeak =
      typeof textOrKey === "string" && textOrKey.includes(".")
        ? i18nT(textOrKey, { defaultValue: textOrKey })
        : textOrKey;
    let effectiveLang = targetLang || state.language;
    if (!targetLang && typeof textToSpeak === "string") {
      if (/[\u0900-\u097F]/.test(textToSpeak)) {
        effectiveLang = /ळ/.test(textToSpeak) || /\b(आहे|आहेत|झाला|पावती)\b/.test(textToSpeak) ? "mr" : "hi";
      }
    }
    ttsProvider.speak({ text: textToSpeak, audioKey: typeof textOrKey === "string" ? textOrKey : null, language: effectiveLang });
  };

  // ── Translation helper ────────────────────────────────────────────────────
  const t = (key, opts) => {
    if (!key) return "";
    const res = i18nT(key, opts);
    if (res && res !== key) return res;
    if (TRANSLATIONS[state.language]?.[key]) return TRANSLATIONS[state.language][key];
    return res || key;
  };
  if (TRANSLATIONS[state.language]) Object.assign(t, TRANSLATIONS[state.language]);

  // ── Domain methods (delegate to CommandBus / Reducer) ────────────────────
  const createNewLot = (params) => {
    const { materialId, weightKg, unitsCount = 1, selectedOffer, photoUrl, conditionGrade = 'SCRAP' } = params;
    const mat = MATERIAL_TAXONOMY.find((m) => m.id === materialId) || MATERIAL_TAXONOMY[0];
    const lotId = `EW-${Math.floor(2100 + Math.random() * 850)}`;
    const now = new Date().toISOString();
    const isOffline = state.onlineStatus === 'OFFLINE';

    const calcWeight = parseFloat(weightKg) || 10;
    const baseRate = mat.baseBenchmarkRatePerKg || 200;
    const gross = selectedOffer?.grossBid || Math.round(calcWeight * baseRate);
    const logistics = selectedOffer?.logisticsCost || 0;
    const net = selectedOffer?.netPayout || (gross - logistics);

    const newLot = {
      lotId,
      materialId: materialId || 'laptops',
      materialName: mat.name,
      reportedWeightKg: calcWeight,
      actualIntakeWeightKg: null,
      unitsCount: parseInt(unitsCount, 10) || 1,
      conditionGrade: conditionGrade || 'Used / Mixed Scrap',
      photoUrl: photoUrl || mat.sampleImages?.[0]?.url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
      collectorId: state.collector?.id || 'COL-1088',
      collectorName: state.collector?.name || 'Ramesh Kamble',
      collectorLocation: state.collector?.serviceArea || 'Dharavi Sector 5, Mumbai',
      selectedBuyerId: selectedOffer?.recyclerId || selectedOffer?.buyerId || 'REC-001',
      selectedBuyerName: selectedOffer?.recyclerName || selectedOffer?.buyerName || 'Apex E-Recovery Ltd.',
      status: isOffline ? 'OFFLINE_QUEUED' : 'ACCEPTED',
      lifecycleStage: isOffline ? 'COLLECTED' : 'MATCHED',
      settlementMode: 'CASH',
      grossBid: gross,
      logisticsCost: logistics,
      netPayout: net,
      isOfflineQueued: isOffline,
      createdAt: now,
      qrCode: `EWB-QR-${lotId}-${Math.floor(10000 + Math.random() * 90000)}`,
      events: [
        {
          step: 'COLLECTED',
          timestamp: now,
          agent: state.collector?.name || 'Ramesh Kamble',
          note: isOffline ? 'Collected offline on field mobile device' : 'Collected and verified via voice & optical scanner',
        },
        {
          step: 'MATCHED',
          timestamp: now,
          agent: selectedOffer?.recyclerName || 'Apex E-Recovery Ltd.',
          note: `Accepted instant offer: Net ₹${net.toLocaleString('en-IN')} (${selectedOffer?.recyclerName || 'Recycler'})`,
        },
      ],
    };

    if (isOffline) {
      dispatch({
        type: AppActions.ENQUEUE_OFFLINE_COMMAND,
        payload: {
          command: {
            commandId: `offline_${Date.now()}`,
            type: 'CREATE_LOT_DRAFT',
            payload: newLot,
            timestamp: Date.now()
          }
        }
      });
    }

    dispatch({ type: AppActions.ADD_LOT, payload: { lot: newLot } });

    dispatch({
      type: AppActions.SET_SYNC_TOAST,
      payload: {
        title: isOffline ? 'LOT STORED IN OFFLINE QUEUE' : 'LOT BROADCAST TO RECYCLER QUEUE',
        message: `${newLot.materialName} (${newLot.reportedWeightKg} kg) routed to ${newLot.selectedBuyerName}.`
      }
    });
    setTimeout(() => dispatch({ type: AppActions.CLEAR_SYNC_TOAST }), 3500);

    return newLot;
  };

  const confirmIntakeAndSettle = (lotId, actualWeightKg, paymentMode = "CASH", extra = {}) => {
    dispatch({ type: AppActions.CONFIRM_INTAKE, payload: { lotId, actualWeightKg, paymentMode, ...extra } });
  };

  const resetDemoData = () => {
    dispatch({ type: AppActions.RESET_DEMO_DATA });
  };

  const resetToEmpty = () => {
    dispatch({ type: AppActions.RESET_TO_EMPTY });
  };

  const loadSeedData = () => {
    dispatch({ type: AppActions.LOAD_SEED_DATA });
  };

  const createBuyRequest = (newRequest) => {
    const req = {
      id: `BUY-REQ-${Math.floor(100 + Math.random() * 900)}`,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      activeMatchesCount: 1,
      ...newRequest
    };
    dispatch({ type: AppActions.ADD_BUY_REQUEST, payload: { request: req } });
    dispatch({
      type: AppActions.SET_SYNC_TOAST,
      payload: { title: "PROCUREMENT DEMAND BROADCASTED", message: `Standing requirement for ${req.materialName} live on Demand Board.` }
    });
    setTimeout(() => dispatch({ type: AppActions.CLEAR_SYNC_TOAST }), 3500);
    return req;
  };

  // ── Shim value — mirrors original MarketplaceContext API exactly ──────────
  const value = {
    // Read from AppState
    activePersona:  state.activePersona,
    language:       state.language,
    networkState:   state.onlineStatus,
    offlineQueue:   state.syncQueue,
    lots:           state.lots,
    buyRequests:    state.buyRequests,
    collector:      state.collector,
    syncToast:      state.syncToast,

    // Setters (delegate to reducer)
    setActivePersona: (persona) => dispatch({ type: AppActions.SET_PERSONA, payload: { persona } }),
    setLanguage,
    setLots: (lotsOrFn) => {
      // Legacy: some components call setLots(fn). Support minimal form.
      const next = typeof lotsOrFn === "function" ? lotsOrFn(state.lots) : lotsOrFn;
      next.forEach((lot) => {
        if (!state.lots.find((l) => l.lotId === lot.lotId)) {
          dispatch({ type: AppActions.ADD_LOT, payload: { lot } });
        }
      });
    },
    setBuyRequests: () => {}, // deprecated — use createBuyRequest

    // Methods
    toggleNetworkState,
    createNewLot,
    confirmIntakeAndSettle,
    resetDemoData,
    resetToEmpty,
    loadSeedData,
    createBuyRequest,
    speakPrompt,
    t,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error("useMarketplace must be used within MarketplaceProvider");
  return ctx;
}
