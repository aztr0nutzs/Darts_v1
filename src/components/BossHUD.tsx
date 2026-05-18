// Boss HUD — Claude Design board (event-grade overlay).
// Black-first dramatic boss presentation. Sharp hairlines, segmented HP bar,
// magenta as the designated danger color. No soft blur, no glow clouds, no
// gradient pulsing. Intro/phase/victory are short, hard-cut events.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BossState } from '../lib/BossEncounter';
import { TOKENS } from '../lib/designTokens';

interface BossHUDProps {
  boss: BossState | null;
  /** Whether the boss was just defeated (show victory banner) */
  bossDefeated: boolean;
  /** When true, skip backdrop-filter blur passes — used by reducedEffects. */
  reducedEffects?: boolean;
}

// ── Intro Banner ─────────────────────────────────────────────────────────
function BossIntroBanner({ name, enableBlur }: { name: string; enableBlur: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-x-0 top-[28%] z-[80] flex items-center justify-center pointer-events-none"
    >
      <div
        style={{
          position: 'relative',
          minWidth: 'min(82vw, 720px)',
          background: TOKENS.bgTranslucentHi,
          border: `1px solid ${TOKENS.magenta}`,
          borderLeft: `4px solid ${TOKENS.magenta}`,
          padding: '20px 28px 22px',
          backdropFilter: enableBlur ? 'blur(6px)' : undefined,
          WebkitBackdropFilter: enableBlur ? 'blur(6px)' : undefined,
        }}
      >
        <span
          aria-hidden
          style={{ position: 'absolute', left: -1, top: -1, height: 4, width: 96, background: TOKENS.magenta }}
        />
        <div
          style={{
            font: `700 12px/1 ${TOKENS.fontMono}`,
            color: TOKENS.magenta,
            letterSpacing: '.42em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          ⚠ THREAT DETECTED · BOSS ENCOUNTER
        </div>
        <div
          style={{
            font: `900 italic clamp(36px, 6vw, 64px)/0.9 ${TOKENS.fontDisplay}`,
            color: TOKENS.textHi,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            textShadow: '0 4px 0 #000',
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 10,
            font: `500 11px/1 ${TOKENS.fontMono}`,
            color: TOKENS.text,
            letterSpacing: '.28em',
            textTransform: 'uppercase',
          }}
        >
          DESTROY THE WEAK POINTS
        </div>
      </div>
    </motion.div>
  );
}

// ── Victory Banner ───────────────────────────────────────────────────────
function BossVictoryBanner({ enableBlur }: { enableBlur: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-0 top-[32%] z-[80] flex items-center justify-center pointer-events-none"
    >
      <div
        style={{
          position: 'relative',
          minWidth: 'min(70vw, 560px)',
          background: TOKENS.bgTranslucentHi,
          border: `1px solid ${TOKENS.green}`,
          borderLeft: `4px solid ${TOKENS.green}`,
          padding: '18px 24px 20px',
          textAlign: 'center',
          backdropFilter: enableBlur ? 'blur(6px)' : undefined,
          WebkitBackdropFilter: enableBlur ? 'blur(6px)' : undefined,
        }}
      >
        <span
          aria-hidden
          style={{ position: 'absolute', left: -1, top: -1, height: 4, width: 96, background: TOKENS.green }}
        />
        <div
          style={{
            font: `700 12px/1 ${TOKENS.fontMono}`,
            color: TOKENS.green,
            letterSpacing: '.42em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          ✓ TARGET NEUTRALISED
        </div>
        <div
          style={{
            font: `900 italic clamp(36px, 6vw, 56px)/0.9 ${TOKENS.fontDisplay}`,
            color: TOKENS.textHi,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            textShadow: '0 4px 0 #000',
          }}
        >
          BOSS DOWN
        </div>
      </div>
    </motion.div>
  );
}

// ── Phase Transition Alert ───────────────────────────────────────────────
function PhaseTransitionAlert({ phase, enableBlur }: { phase: number; enableBlur: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[75] pointer-events-none"
    >
      <div
        style={{
          position: 'relative',
          background: TOKENS.bgTranslucentHi,
          border: `1px solid ${TOKENS.magenta}`,
          borderLeft: `3px solid ${TOKENS.magenta}`,
          padding: '10px 18px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          backdropFilter: enableBlur ? 'blur(6px)' : undefined,
          WebkitBackdropFilter: enableBlur ? 'blur(6px)' : undefined,
        }}
      >
        <span
          aria-hidden
          style={{ width: 8, height: 8, background: TOKENS.magenta }}
        />
        <span
          style={{
            font: `700 12px/1 ${TOKENS.fontMono}`,
            color: TOKENS.magenta,
            letterSpacing: '.34em',
            textTransform: 'uppercase',
          }}
        >
          PHASE {String(phase).padStart(2, '0')} ENGAGED
        </span>
      </div>
    </motion.div>
  );
}

// ── BossHUD Root ─────────────────────────────────────────────────────────
export default function BossHUD({ boss, bossDefeated, reducedEffects }: BossHUDProps) {
  const enableBlur = reducedEffects !== true;
  const [showIntro, setShowIntro] = useState(false);
  const [showPhaseAlert, setShowPhaseAlert] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [phaseAlertNum, setPhaseAlertNum] = useState(1);

  useEffect(() => {
    if (boss && !boss.introShown) {
      setShowIntro(true);
      const timer = setTimeout(() => {
        setShowIntro(false);
        if (boss) boss.introShown = true;
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [boss?.id]);

  useEffect(() => {
    if (boss?.phaseTransitionAlert) {
      setPhaseAlertNum(boss.phase);
      setShowPhaseAlert(true);
      boss.phaseTransitionAlert = false;
      const timer = setTimeout(() => setShowPhaseAlert(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [boss?.phaseTransitionAlert, boss?.phase]);

  useEffect(() => {
    if (bossDefeated) {
      setShowVictory(true);
      const timer = setTimeout(() => setShowVictory(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [bossDefeated]);

  if (!boss && !showVictory) return null;

  const hpRatio = boss ? boss.currentHp / boss.maxHp : 0;
  const hpPct = Math.max(0, hpRatio * 100);
  const hpColor =
    hpRatio > 0.6
      ? TOKENS.magenta
      : hpRatio > 0.3
      ? TOKENS.orange
      : TOKENS.yellow;

  const weakPointExposed = boss?.weakPoints?.some((wp) => wp.exposed) ?? false;
  const segments = 12;

  return (
    <>
      <AnimatePresence>
        {showIntro && boss && <BossIntroBanner name={boss.displayName} enableBlur={enableBlur} />}
      </AnimatePresence>
      <AnimatePresence>
        {showPhaseAlert && <PhaseTransitionAlert phase={phaseAlertNum} enableBlur={enableBlur} />}
      </AnimatePresence>
      <AnimatePresence>
        {showVictory && <BossVictoryBanner enableBlur={enableBlur} />}
      </AnimatePresence>

      {/* Persistent BOSS dock — top-center during encounter */}
      {boss && boss.behaviorState !== 'defeated' && (
        <div
          className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
          style={{ width: 'min(72vw, 560px)' }}
        >
          <div
            style={{
              position: 'relative',
              background: TOKENS.bgTranslucentHi,
              border: `1px solid ${TOKENS.magenta}55`,
              borderLeft: `3px solid ${TOKENS.magenta}`,
              padding: '12px 16px 14px',
              backdropFilter: enableBlur ? 'blur(8px)' : undefined,
              WebkitBackdropFilter: enableBlur ? 'blur(8px)' : undefined,
            }}
          >
            {/* Top-tick magenta accent */}
            <span
              aria-hidden
              style={{ position: 'absolute', left: -1, top: -1, height: 3, width: 56, background: TOKENS.magenta }}
            />

            {/* Header row — name + phase ticks */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                <span
                  style={{
                    font: `700 10px/1 ${TOKENS.fontMono}`,
                    color: TOKENS.magenta,
                    letterSpacing: '.36em',
                    textTransform: 'uppercase',
                  }}
                >
                  BOSS
                </span>
                <span
                  style={{
                    font: `900 italic 18px/1 ${TOKENS.fontDisplay}`,
                    color: TOKENS.textHi,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {boss.displayName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    font: `500 10px/1 ${TOKENS.fontMono}`,
                    color: TOKENS.textMute,
                    letterSpacing: '.28em',
                    textTransform: 'uppercase',
                  }}
                >
                  PHASE
                </span>
                {[1, 2, 3].map((p) => {
                  const active = p <= boss.phase;
                  const current = p === boss.phase;
                  return (
                    <span
                      key={p}
                      aria-hidden
                      style={{
                        width: 12,
                        height: 12,
                        background: active ? TOKENS.magenta : 'transparent',
                        border: `1px solid ${active ? TOKENS.magenta : TOKENS.hairlineHi}`,
                        outline: current ? `1px solid ${TOKENS.textHi}` : 'none',
                        outlineOffset: 1,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Segmented HP bar */}
            <div
              style={{
                position: 'relative',
                height: 18,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${TOKENS.hairlineHi}`,
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  background: hpColor,
                }}
                initial={false}
                animate={{ width: `${hpPct}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
              {/* Segment dividers */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {Array.from({ length: segments - 1 }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={{
                      flex: 1,
                      borderRight: `1px solid rgba(0,0,0,0.6)`,
                    }}
                  />
                ))}
                <span style={{ flex: 1 }} />
              </div>
              {/* HP read */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: `700 11px/1 ${TOKENS.fontMono}`,
                  color: TOKENS.textHi,
                  letterSpacing: '.18em',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 1px 0 #000',
                }}
              >
                {boss.currentHp} / {boss.maxHp}
              </div>
            </div>

            {/* Sub-info row */}
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                font: `500 10px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
              }}
            >
              <span>
                <span style={{ color: TOKENS.magenta, marginRight: 8 }}>▣</span>
                {boss.behaviorState.replace(/_/g, ' ')}
              </span>
              {weakPointExposed && (
                <span style={{ color: TOKENS.yellow }}>
                  ◆ WEAK POINT EXPOSED
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
