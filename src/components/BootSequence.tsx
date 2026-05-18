// Boot Sequence — Claude Design board (pre-roll).
// Black-first deliberate title presentation. No spinning reticles, no fake
// "scan" glow, no rounded glassy dialog. Hairline progress + crisp stage
// readout + DARTS wordmark. Mirrors MainMenu / Results visual language.

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TOKENS } from '../lib/designTokens';
import { Kicker } from './redesign/chrome';

interface BootSequenceProps {
  onComplete: () => void;
}

// Stage labels are deliberately tactical/sparse — they are read as a hairline
// log strip, not a "cyber" loading screen.
const BOOT_STAGES = [
  { code: '01', label: 'ARENA SYSTEM' },
  { code: '02', label: 'TARGET GRID' },
  { code: '03', label: 'DART CHAMBER' },
  { code: '04', label: 'FOAM MAGAZINE' },
  { code: '05', label: 'BLASTER HUD' },
  { code: '06', label: 'READY' },
] as const;

// Total run length kept tight (≈ 2.2s) to preserve startup time.
const STAGE_MS = 360;

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let stageIndex = 0;
    let stageInterval: number | null = null;
    let finishTimeout: number | null = null;

    const runNextStage = () => {
      if (stageIndex >= BOOT_STAGES.length) {
        setIsFinished(true);
        finishTimeout = window.setTimeout(() => onCompleteRef.current(), 360);
        return;
      }
      setCurrentStage(stageIndex);
      const startProgress = (stageIndex / BOOT_STAGES.length) * 100;
      const endProgress = ((stageIndex + 1) / BOOT_STAGES.length) * 100;
      const startTime = performance.now();
      stageInterval = window.setInterval(() => {
        const elapsed = performance.now() - startTime;
        const ratio = Math.min(elapsed / STAGE_MS, 1);
        setProgress(startProgress + (endProgress - startProgress) * ratio);
        if (ratio >= 1) {
          if (stageInterval !== null) window.clearInterval(stageInterval);
          stageInterval = null;
          stageIndex += 1;
          runNextStage();
        }
      }, 24);
    };
    runNextStage();

    return () => {
      if (stageInterval !== null) window.clearInterval(stageInterval);
      if (finishTimeout !== null) window.clearTimeout(finishTimeout);
    };
  }, []);

  const stage = BOOT_STAGES[Math.min(currentStage, BOOT_STAGES.length - 1)];
  const pct = Math.round(progress);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: 'easeInOut' }}
      className="fixed inset-0 z-[1000] overflow-hidden select-none"
      style={{
        background: TOKENS.bg,
        color: TOKENS.textHi,
        fontFamily: TOKENS.fontUi,
      }}
    >
      {/* Restrained background structure — ghost wordmark + single hairline.
          No glow clouds, no rotating reticles, no animated gradients. */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            font: `900 italic clamp(280px, 60vw, 720px)/0.78 ${TOKENS.fontDisplay}`,
            letterSpacing: '-0.04em',
            color: '#fff',
            opacity: 0.035,
            whiteSpace: 'nowrap',
          }}
        >
          DARTS
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '64%',
            height: 1,
            background: TOKENS.hairlineHi,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(64% - 4px)',
            width: 80,
            height: 8,
            background: TOKENS.orange,
          }}
        />
      </div>

      {/* Top bar — system marker on left, build tag on right */}
      <div
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          top: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          font: `500 12px/1 ${TOKENS.fontMono}`,
          color: TOKENS.textMute,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
        }}
      >
        <span>
          <span style={{ color: TOKENS.orange }}>◆</span>&nbsp;&nbsp;DARTS · BOOT
        </span>
        <span>BUILD 4A · STABLE</span>
      </div>

      {/* Center hero — wordmark + tagline */}
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 1080,
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
        >
          <Kicker bordered color={TOKENS.orange} size={13}>
            COLD START · INITIALISING
          </Kicker>
          <div
            style={{
              marginTop: 18,
              font: `900 italic clamp(96px, 18vw, 200px)/0.86 ${TOKENS.fontDisplay}`,
              letterSpacing: '-0.04em',
              color: TOKENS.textHi,
              textShadow: '0 6px 0 #000',
            }}
          >
            DARTS
          </div>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              font: `500 13px/1 ${TOKENS.fontMono}`,
              color: TOKENS.textMute,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 56, height: 2, background: TOKENS.textHi }} />
            FOAM. FURY. PRECISION.
          </div>
        </motion.div>

        {/* Stage readout + segmented hairline progress */}
        <div style={{ marginTop: 56 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              font: `500 12px/1 ${TOKENS.fontMono}`,
              color: TOKENS.textMute,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <span>
              <span style={{ color: TOKENS.orange }}>{stage.code}</span>
              <span style={{ margin: '0 12px', color: TOKENS.textDim }}>/</span>
              <span style={{ color: TOKENS.textHi }}>{stage.label}</span>
            </span>
            <span
              style={{
                font: `700 22px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textHi,
                letterSpacing: '.04em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pct.toString().padStart(3, '0')}%
            </span>
          </div>

          {/* Segmented progress — 6 hard-edged cells, no glow */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOOT_STAGES.length}, 1fr)`,
              gap: 6,
            }}
          >
            {BOOT_STAGES.map((_, i) => {
              const segStart = (i / BOOT_STAGES.length) * 100;
              const segEnd = ((i + 1) / BOOT_STAGES.length) * 100;
              const segRange = segEnd - segStart;
              const segFill = Math.max(0, Math.min(1, (progress - segStart) / segRange));
              const isCurrent = i === currentStage;
              const isDone = progress >= segEnd;
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    height: 6,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${TOKENS.hairline}`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${segFill * 100}%`,
                      background: isDone ? TOKENS.textHi : isCurrent ? TOKENS.orange : TOKENS.textDim,
                      transition: 'width 60ms linear',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Stage log strip */}
          <div
            style={{
              marginTop: 18,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 22px',
              font: `500 11px/1.6 ${TOKENS.fontMono}`,
              color: TOKENS.textDim,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
            }}
          >
            {BOOT_STAGES.map((s, i) => {
              const isDone = i < currentStage;
              const isActive = i === currentStage;
              return (
                <span
                  key={s.code}
                  style={{
                    color: isDone ? TOKENS.text : isActive ? TOKENS.orange : TOKENS.textDim,
                  }}
                >
                  <span style={{ color: isActive ? TOKENS.orange : TOKENS.textDim }}>
                    {isDone ? '✓' : isActive ? '›' : '·'}
                  </span>
                  &nbsp;{s.code} {s.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Skip control */}
        <div style={{ marginTop: 40 }}>
          <button
            type="button"
            onClick={() => onCompleteRef.current()}
            style={{
              background: 'transparent',
              border: `1px solid ${TOKENS.hairlineHi}`,
              color: TOKENS.text,
              padding: '12px 18px',
              font: `700 11px/1 ${TOKENS.fontMono}`,
              letterSpacing: '.30em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            BYPASS · TAP TO CONTINUE
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          font: `500 11px/1 ${TOKENS.fontMono}`,
          color: TOKENS.textDim,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
        }}
      >
        <span>0xAF82 · LOAD_SEQ_STABLE</span>
        <span style={{ color: TOKENS.cyan }}>◇ LIVE OPS</span>
      </div>

      {/* Final flash — single hard cut, no continuous animation */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-0 z-50"
            style={{ background: TOKENS.bg }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
