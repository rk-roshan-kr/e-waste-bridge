import React, { useState } from "react";
import { AppStateProvider } from "./state/AppStateContext";
import { MarketplaceProvider, useMarketplace } from "./context/MarketplaceContext";
import AppHeader from "./components/shared/AppHeader";
import CollectorPhoneWrapper from "./components/collector/CollectorPhoneWrapper";
import CollectorHome from "./components/collector/CollectorHome";
import MaterialScanner from "./components/collector/MaterialScanner";
import ReverseMarketplace from "./components/collector/ReverseMarketplace";
import HandoverReceipt from "./components/collector/HandoverReceipt";
import LotsAndReceiptsList from "./components/collector/LotsAndReceiptsList";
import RecyclerTerminal from "./components/recycler/RecyclerTerminal";
import TraceabilityCenter from "./components/admin/TraceabilityCenter";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { motion, AnimatePresence } from "motion/react";

function MainPrototype() {
  const { activePersona, setActivePersona, syncToast, lots } = useMarketplace();

  // Collector internal view state: 'HOME' | 'SCANNER' | 'MARKETPLACE' | 'LOTS_LIST' | 'RECEIPT'
  const [collectorView, setCollectorView] = useState("HOME");
  const [activeScanMaterialId, setActiveScanMaterialId] = useState(null);
  const [activeLotDraft, setActiveLotDraft] = useState(null);
  const [currentSettledLot, setCurrentSettledLot] = useState(null);

  // Cross-persona deep-link lot targets
  const [targetRecyclerLotId, setTargetRecyclerLotId] = useState(null);
  const [targetAdminLotId, setTargetAdminLotId] = useState(null);

  // Handlers for Collector Flow
  const handleStartSell = (materialId = null) => {
    setActiveScanMaterialId(materialId);
    setCollectorView("SCANNER");
  };

  const handleOffersReady = (draft) => {
    setActiveLotDraft(draft);
    setCollectorView("MARKETPLACE");
  };

  const handleAcceptOffer = (lot, offer) => {
    setCurrentSettledLot(lot);
    setCollectorView("RECEIPT");
  };

  const handleViewLotFromHome = (lot) => {
    if (lot) {
      setCurrentSettledLot(lot);
      setCollectorView("RECEIPT");
    } else {
      setCollectorView("LOTS_LIST");
    }
  };

  const handleViewLotsTab = () => {
    setCollectorView("LOTS_LIST");
  };

  const handleOpenRecyclerTerminal = (lot) => {
    if (lot?.lotId) {
      setTargetRecyclerLotId(lot.lotId);
    }
    setActivePersona("recycler");
  };

  const handleOpenAdminTrace = (lotId) => {
    if (lotId) {
      setTargetAdminLotId(lotId);
    }
    setActivePersona("admin");
  };

  return (
    <div className="app-wrapper">
      {/* Universal Top Bar (Judge Demo Shell) */}
      <AppHeader />

      {/* Persona View Router */}
      <main style={{ flex: 1, padding: activePersona === "collector" ? "4px 0" : "16px 20px" }}>
        <AnimatePresence mode="wait">
          {activePersona === "collector" && (
            <motion.div
              key="collector-persona"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <CollectorPhoneWrapper
                currentView={collectorView}
                onNavigateHome={() => setCollectorView("HOME")}
                onStartSellWithCategory={handleStartSell}
                onViewLots={handleViewLotsTab}
                activeLotDraft={activeLotDraft}
                currentSettledLot={currentSettledLot}
              >
                <ErrorBoundary onReset={() => setCollectorView("HOME")}>
                  {collectorView === "HOME" && (
                    <CollectorHome
                      onStartSell={handleStartSell}
                      onViewLot={handleViewLotFromHome}
                      onViewLotsList={() => setCollectorView("LOTS_LIST")}
                    />
                  )}

                  {collectorView === "SCANNER" && (
                    <MaterialScanner
                      initialMaterialId={activeScanMaterialId}
                      onBack={() => setCollectorView("HOME")}
                      onOffersReady={handleOffersReady}
                    />
                  )}

                  {collectorView === "MARKETPLACE" && (
                    <ReverseMarketplace
                      lotDraft={
                        activeLotDraft || {
                          materialId: "laptops",
                          weightKg: 10,
                          photoUrl: "",
                          conditionGrade: "Used",
                          material: { name: "Laptops", hazardLevel: "MEDIUM" }
                        }
                      }
                      onBack={() => setCollectorView("SCANNER")}
                      onAcceptOffer={handleAcceptOffer}
                    />
                  )}

                  {collectorView === "LOTS_LIST" && (
                    <LotsAndReceiptsList
                      onSelectLot={(lot) => {
                        setCurrentSettledLot(lot);
                        setCollectorView("RECEIPT");
                      }}
                      onBackHome={() => setCollectorView("HOME")}
                      onNewLot={() => handleStartSell(null)}
                    />
                  )}

                  {collectorView === "RECEIPT" && (
                    <HandoverReceipt
                      lot={currentSettledLot || (lots && lots[0])}
                      onBack={() => setCollectorView("LOTS_LIST")}
                      onDone={() => setCollectorView("HOME")}
                      onOpenRecyclerTerminal={handleOpenRecyclerTerminal}
                    />
                  )}
                </ErrorBoundary>
              </CollectorPhoneWrapper>
            </motion.div>
          )}

          {activePersona === "recycler" && (
            <motion.div
              key="recycler-persona"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <RecyclerTerminal
                targetLotId={targetRecyclerLotId}
                onClearTargetLot={() => setTargetRecyclerLotId(null)}
                onOpenAdminTrace={handleOpenAdminTrace}
                onOpenCollector={() => setActivePersona("collector")}
              />
            </motion.div>
          )}

          {activePersona === "admin" && (
            <motion.div
              key="admin-persona"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TraceabilityCenter
                targetLotId={targetAdminLotId}
                onOpenRecyclerTerminal={(lotId) => {
                  if (lotId) setTargetRecyclerLotId(lotId);
                  setActivePersona("recycler");
                }}
                onOpenCollector={() => setActivePersona("collector")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="sync-toast-banner">
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>
              {syncToast.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-light)" }}>
              {syncToast.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { InteractionFeedbackProvider } from "./context/InteractionFeedbackContext";

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <MarketplaceProvider>
          <InteractionFeedbackProvider>
            <MainPrototype />
          </InteractionFeedbackProvider>
        </MarketplaceProvider>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
