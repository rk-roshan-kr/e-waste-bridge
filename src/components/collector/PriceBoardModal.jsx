import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useMarketplace } from "../../context/MarketplaceContext";
import {
  X,
  Volume2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Laptop,
  Cpu,
  BatteryCharging,
  Cable,
  Tv,
  Layers,
  RotateCw,
  Scale
} from "lucide-react";
import { emitInputAck } from "../../services/feedbackDispatcher";
import { PRICE_BENCHMARKS_SEED, MATERIALS_SEED } from "../../database/seedData";

const MATERIAL_ICONS = {
  smartphones: <Smartphone size={18} />,
  laptops: <Laptop size={18} />,
  pcb: <Cpu size={18} />,
  batteries: <BatteryCharging size={18} />,
  cables: <Cable size={18} />,
  motors_magnets: <RotateCw size={18} />,
  crt: <Tv size={18} />,
  abs_plastic: <Layers size={18} />
};

export default function PriceBoardModal({ isOpen, onClose, onSelectMaterial }) {
  const { language, speakPrompt, t } = useMarketplace();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalTarget(document.getElementById("phone-screen-portal"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const target = portalTarget || (typeof document !== "undefined" ? document.getElementById("phone-screen-portal") : null);

  const handlePlayAudioBhav = () => {
    emitInputAck("TOUCH", "play_audio_bhav");
    setIsPlayingAudio(true);

    const speechText =
      language === "mr"
        ? "आजचे अधिकृत ई-कचरा दर: मोबाईल ३८० रुपये किलो, लॅपटॉप २१० रुपये, मदरबोर्ड ३५० रुपये, कॉपर केबल्स १८० रुपये, मोटर व मॅग्नेट १२० रुपये आणि बॅटरी ९५ रुपये किलो."
        : language === "hi"
        ? "आज के अधिकृत ई-कचरा भाव: मोबाइल ३८० रुपये किलो, लैपटॉप २१० रुपये, मदरबोर्ड ३५० रुपये, कॉपर केबल १८० रुपये, मोटर और चुंबक १२० रुपये तथा बैटरी ९५ रुपये किलो."
        : "Today's official CPCB e-waste benchmark rates: Smartphones 380 rupees per kg, Laptops 210 rupees, PCBs 350 rupees, Copper cables 180 rupees, Motors and magnets 120 rupees, and Batteries 95 rupees per kg.";

    speakPrompt(speechText);
    setTimeout(() => setIsPlayingAudio(false), 9000);
  };

  const handleRowClick = (matId) => {
    emitInputAck("TOUCH", "price_board_select_row", { materialId: matId });
    if (onSelectMaterial) {
      onSelectMaterial(matId);
    }
    onClose();
  };

  const modalMarkup = (
    <AnimatePresence>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: target ? "absolute" : "fixed",
          inset: 0,
          background: "rgba(10, 15, 29, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 95,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          borderRadius: target ? 36 : 0,
          overflow: "hidden",
          pointerEvents: "auto"
        }}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--surface)",
            width: "100%",
            maxWidth: target ? "100%" : 420,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            border: "1px solid var(--border)",
            borderBottom: "none",
            maxHeight: target ? "84%" : "88vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.35)",
            overflow: "hidden"
          }}
        >
          {/* Sheet Header */}
          <div
            style={{
              padding: "16px 18px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="text-sub-label" style={{ fontSize: 10 }}>
                  CPCB REFERENCE INDEX (MH-MMR)
                </span>
                <span
                  style={{
                    background: "#E6F4EA",
                    color: "#137333",
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 4
                  }}
                >
                  LIVE TODAY
                </span>
              </div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: "var(--graphite)",
                  margin: "2px 0 0 0"
                }}
              >
                {language === "mr"
                  ? "आजचा अधिकृत बाजार भाव (Bhav Board)"
                  : language === "hi"
                  ? "आज का अधिकृत बाजार भाव (Bhav Board)"
                  : "Today's Verified Scrap Rate Board"}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "var(--canvas)",
                border: "1px solid var(--border)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--graphite)"
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Audio Playback Hero Pill */}
          <div style={{ padding: "12px 18px 6px" }}>
            <button
              type="button"
              onClick={handlePlayAudioBhav}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: isPlayingAudio ? "#1B7943" : "var(--canvas)",
                color: isPlayingAudio ? "#FFFFFF" : "var(--graphite)",
                border: "1.5px solid",
                borderColor: isPlayingAudio ? "#1B7943" : "var(--border)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              id="btn-listen-bhav"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    background: isPlayingAudio ? "rgba(255,255,255,0.2)" : "rgba(27,121,67,0.1)",
                    color: isPlayingAudio ? "#FFFFFF" : "#1B7943",
                    borderRadius: "50%",
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Volume2 size={16} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>
                    {language === "mr"
                      ? "आजचे भाव आवाजात ऐका"
                      : language === "hi"
                      ? "आज के भाव बोलकर सुनें"
                      : "Listen to Scrap Rates Aloud"}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: isPlayingAudio ? "#D8F0E0" : "var(--muted)",
                      fontWeight: 600
                    }}
                  >
                    {isPlayingAudio
                      ? language === "mr" ? "आवाज सुरू आहे..." : "Speaking rates now..."
                      : language === "mr" ? "वाचता येत नसेल तर येथे टॅप करा" : "Tap to play vernacular voice readout"}
                  </div>
                </div>
              </div>
              <Sparkles size={16} color={isPlayingAudio ? "#FFFFFF" : "#1B7943"} />
            </button>
          </div>

          {/* Rates List Container */}
          <div
            style={{
              padding: "8px 18px 18px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}
          >
            {PRICE_BENCHMARKS_SEED.map((item) => {
              const matMeta = MATERIALS_SEED.find((m) => m.material_id === item.material_id) || {};
              const localizedName =
                language === "mr"
                  ? matMeta.name_mr || matMeta.name_en
                  : language === "hi"
                  ? matMeta.name_hi || matMeta.name_en
                  : matMeta.name_en;

              const isUp = item.trend_percentage > 0;
              const isDown = item.trend_percentage < 0;

              return (
                <div
                  key={item.benchmark_id}
                  onClick={() => handleRowClick(item.material_id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "var(--canvas)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        color: "var(--graphite)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        width: 34,
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {MATERIAL_ICONS[item.material_id] || <Scale size={16} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--graphite)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {localizedName}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span>Range: ₹{item.min_rate} - ₹{item.max_rate}</span>
                        <span>•</span>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{matMeta.cpcb_code}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#1B7943"
                      }}
                    >
                      ₹{item.prevailing_buying_rate}
                      <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>/kg</span>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 10,
                        fontWeight: 800,
                        color: isUp ? "#137333" : isDown ? "#B3261E" : "var(--muted)"
                      }}
                    >
                      {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
                      <span>{isUp ? `+${item.trend_percentage}%` : `${item.trend_percentage}%`}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Tap to sell hint */}
            <div
              style={{
                marginTop: 6,
                padding: "8px 12px",
                background: "var(--surface)",
                borderRadius: 8,
                border: "1px dashed var(--border)",
                fontSize: 11,
                color: "var(--muted)",
                textAlign: "center"
              }}
            >
              {language === "mr"
                ? "कोणत्याही दरावर टॅप करून थेट विक्री सुरू करा"
                : language === "hi"
                ? "किसी भी भाव पर टैप करके तुरंत बेचना शुरू करें"
                : "Tap any material rate to start selling immediately"}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return target ? createPortal(modalMarkup, target) : modalMarkup;
}
