/**
 * MorphingPill.jsx - Dynamic Interactive Voice Runtime Surface
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import React from 'react';
import { Mic, MicOff, X, Check, ArrowRight, RotateCcw, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MorphingPill({
  turnState = 'IDLE',
  pillData = {},
  micAudioLevel = 0,
  onClose,
  onMicToggle,
  onUndo,
  onViewOffers
}) {
  const isListening = turnState === 'LISTENING';
  const isPaused = turnState === 'PAUSED_WAITING';
  const isProcessing = turnState === 'PROCESSING';
  const isConfirming = turnState === 'WAITING_FOR_CONFIRMATION';

  return (
    <motion.div
      className="phone-voice-bottom-pill"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Dynamic Pill Content based on TurnState & PillData */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {/* State Icon Indicator */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: isConfirming ? 'rgba(239, 68, 68, 0.2)' : isListening ? 'rgba(163, 230, 53, 0.2)' : '#232936',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {isConfirming ? (
            <AlertTriangle size={15} color="#EF4444" />
          ) : isProcessing ? (
            <Loader2 size={15} color="var(--accent)" className="animate-spin" />
          ) : isListening ? (
            <Mic size={15} color="#A3E635" />
          ) : (
            <MicOff size={15} color="var(--muted)" />
          )}
        </div>

        {/* Text Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {pillData.mode === 'CORRECTION' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#FACC15', fontWeight: 700 }}>
                Weight changed: {pillData.previousValue} kg → {pillData.correctedValue} kg
              </span>
              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  style={{
                    background: 'rgba(250, 204, 21, 0.15)',
                    border: '1px solid #FACC15',
                    color: '#FACC15',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Undo
                </button>
              )}
            </div>
          ) : pillData.mode === 'STREAMING' ? (
            <div style={{ fontSize: 13, color: '#FFF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ● "{pillData.text}"
            </div>
          ) : isPaused ? (
            <div style={{ fontSize: 13, color: '#A3E635', fontWeight: 600 }}>
              Continue बोलिए...
            </div>
          ) : isProcessing ? (
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              समझ गया • Best buyer खोज रहा हूँ...
            </div>
          ) : isConfirming ? (
            <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>
              {pillData.promptText || 'सौदा पक्का करने के लिए 5 सेकंड दबा कर रखें'}
            </div>
          ) : pillData.mode === 'ACTION_RESULT' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: 12, color: '#FFF', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pillData.text}
              </span>
              {onViewOffers && (
                <button
                  type="button"
                  onClick={onViewOffers}
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: 8
                  }}
                >
                  View Offers
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Listening... बोलिए
            </div>
          )}
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: 4,
            marginLeft: 6
          }}
          aria-label="Close voice pill"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
