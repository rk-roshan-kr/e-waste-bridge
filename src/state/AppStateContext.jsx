import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from "react";
import { INITIAL_APP_STATE } from "./AppState.js";
import { appReducer } from "./appReducer.js";
import { initCommandBus, resetCommandBusSession } from "../commands/CommandBus.js";
import { lotRepository } from "../storage/stores/LotRepository.js";
import { buyRequestRepository } from "../storage/stores/BuyRequestRepository.js";
import { syncQueueRepository } from "../storage/stores/SyncQueueRepository.js";
import { eventLogRepository } from "../storage/stores/EventLogRepository.js";
import { AppActions } from "./AppActions.js";
import i18n from "../i18n.js";

/**
 * AppStateContext.jsx - Single Source of Truth Provider
 * Part of E-Waste Bridge Architecture Blueprint v4
 * @level L1 L2 L3
 *
 * Provides:
 *   state    — read-only AppState snapshot (hydrated from IndexedDB on mount)
 *   dispatch — AppAction dispatcher
 *
 * Persistence contract:
 *   lots         → IndexedDB (LotRepository)
 *   syncQueue    → IndexedDB (SyncQueueRepository)
 *   buyRequests  → IndexedDB (BuyRequestRepository)
 *   events       → IndexedDB (EventLogRepository)
 *   preferences  → localStorage (PersistentProfile, handled separately)
 *
 * localStorage['ewb_lots'] etc. are no longer written by this layer.
 */

export const AppStateContext  = createContext(null);
export const AppDispatchContext = createContext(null);

/** Repositories exposed for use by CommandBus and domain services */
export const repositories = {
  lots:       lotRepository,
  buyRequests: buyRequestRepository,
  syncQueue:  syncQueueRepository,
  events:     eventLogRepository,
};

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);

  // Stable ref so CommandBus always reads the latest state (no stale closure)
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const getState = useCallback(() => stateRef.current, []);

  // ── Wire CommandBus on mount ───────────────────────────────────────────────
  useEffect(() => {
    initCommandBus(dispatch, getState);
    resetCommandBusSession();
  }, [getState]);

  // ── Hydrate from IndexedDB on mount ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hydratedLots, hydratedBuyRequests, pendingQueue] = await Promise.all([
          lotRepository.hydrate(),
          buyRequestRepository.hydrate(),
          syncQueueRepository.getPending(),
        ]);
        if (cancelled) return;

        if (hydratedLots.length > 0) {
          dispatch({ type: AppActions.NAVIGATE_TO, payload: { screen: 'HOME' } }); // no-op, just triggers re-check
          // Inject hydrated lots by replacing the initial seed
          dispatch({ type: '__HYDRATE_LOTS__', payload: { lots: hydratedLots } });
        }
        if (hydratedBuyRequests.length > 0) {
          dispatch({ type: '__HYDRATE_BUY_REQUESTS__', payload: { buyRequests: hydratedBuyRequests } });
        }
        if (pendingQueue.length > 0) {
          dispatch({ type: '__HYDRATE_SYNC_QUEUE__', payload: { syncQueue: pendingQueue } });
        }
      } catch (err) {
        console.error('[AppStateContext] Hydration error:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist lots to IndexedDB & localStorage whenever state.lots changes ──
  useEffect(() => {
    if (!state.lots) return;
    try {
      window.localStorage?.setItem('ewb_lots', JSON.stringify(state.lots));
    } catch (err) {
      console.warn('[AppStateContext] localStorage ewb_lots write error:', err);
    }
    if (state.lots.length === 0) {
      lotRepository.clear().catch((err) => console.error('[AppStateContext] lot clear error:', err));
    } else {
      lotRepository.saveAll(state.lots).catch((err) =>
        console.error('[AppStateContext] lot persist error:', err)
      );
    }
  }, [state.lots]);

  // ── Persist buyRequests to localStorage on change ────────────────────────
  useEffect(() => {
    if (!state.buyRequests) return;
    try {
      window.localStorage?.setItem('ewb_buyRequests', JSON.stringify(state.buyRequests));
    } catch (err) {
      console.warn('[AppStateContext] localStorage ewb_buyRequests write error:', err);
    }
  }, [state.buyRequests]);

  // ── Persist collector profile & earnings to localStorage on change ────────
  useEffect(() => {
    if (!state.collector) return;
    try {
      window.localStorage?.setItem('ewb_collector', JSON.stringify(state.collector));
    } catch (err) {
      console.warn('[AppStateContext] localStorage ewb_collector write error:', err);
    }
  }, [state.collector]);

  // ── Persist activePersona to localStorage on change ──────────────────────
  useEffect(() => {
    if (!state.activePersona) return;
    try {
      window.localStorage?.setItem('ewb_activePersona', JSON.stringify(state.activePersona));
    } catch (err) {
      console.warn('[AppStateContext] localStorage ewb_activePersona write error:', err);
    }
  }, [state.activePersona]);

  // ── Persist language to localStorage & sync i18n ─────────────────────────
  useEffect(() => {
    if (!state.language) return;
    try {
      window.localStorage?.setItem('ewb_language', JSON.stringify(state.language));
    } catch (err) {
      console.warn('[AppStateContext] localStorage ewb_language write error:', err);
    }
    if (i18n.language !== state.language) {
      i18n.changeLanguage(state.language);
    }
  }, [state.language]);

  // ── Real-Time Multi-Tab / Multi-Window LocalStorage Synchronization ──────
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'ewb_lots') {
          const lots = JSON.parse(e.newValue);
          if (Array.isArray(lots)) dispatch({ type: AppActions.SYNC_FROM_STORAGE, payload: { lots } });
        } else if (e.key === 'ewb_buyRequests') {
          const buyRequests = JSON.parse(e.newValue);
          if (Array.isArray(buyRequests)) dispatch({ type: AppActions.SYNC_FROM_STORAGE, payload: { buyRequests } });
        } else if (e.key === 'ewb_collector') {
          const collector = JSON.parse(e.newValue);
          if (collector) dispatch({ type: AppActions.SYNC_FROM_STORAGE, payload: { collector } });
        } else if (e.key === 'ewb_activePersona') {
          const activePersona = JSON.parse(e.newValue);
          if (activePersona) dispatch({ type: AppActions.SYNC_FROM_STORAGE, payload: { activePersona } });
        } else if (e.key === 'ewb_language') {
          const language = JSON.parse(e.newValue);
          if (language) dispatch({ type: AppActions.SYNC_FROM_STORAGE, payload: { language } });
        }
      } catch (err) {
        console.warn('[AppStateContext] Cross-tab storage sync parse error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

/** Read the entire AppState. Use selectors.js to extract specific fields. */
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

/** Dispatch UI-only AppActions (voice phase, navigation, language).
 *  For domain mutations, use executeCommand() from CommandBus. */
export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error("useAppDispatch must be used within AppStateProvider");
  return ctx;
}

