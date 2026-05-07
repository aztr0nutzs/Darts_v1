// ─────────────────────────────────────────────────────────────────────────────
// BossHUD.tsx — Boss encounter HUD overlay
//
// Shows boss intro banner, HP bar, phase indicator, phase transition alerts,
// and boss name during an active boss encounter.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Shield, AlertTriangle } from 'lucide-react';
import type { BossState } from '../lib/BossEncounter';

interface BossHUDProps {
  boss: BossState | null;
  /** Whether the boss was just defeated (show victory banner) */
  bossDefeated: boolean;
}

function BossIntroBanner({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      exit={{ scaleX: 0, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-[30%] z-[80] flex items-center justify-center pointer-events-none"
    >
      <div className="relative flex flex-col items-center">
        {/* Decorative lines */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '80vw' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent mb-3"
        />

        <div className="flex items-center gap-4">
          <Skull className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_red]" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black tracking-[0.5em] uppercase text-red-400/80 mb-1">
              BOSS ENCOUNTER
            </span>
            <motion.span
              initial={{ letterSpacing: '0.5em', opacity: 0 }}
              animate={{ letterSpacing: '0.15em', opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl sm:text-5xl font-black text-white italic tracking-[0.15em] drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
            >
              {name}
            </motion.span>
          </div>
          <Skull className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_red]" />
        </div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '80vw' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent mt-3"
        />

        {/* Sub-text */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-[10px] font-black text-red-300/60 tracking-[0.3em] uppercase mt-2"
        >
          DESTROY THE WEAK POINTS
        </motion.span>
      </div>
    </motion.div>
  );
}

function BossVictoryBanner() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      exit={{ scaleX: 0, opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-x-0 top-[35%] z-[80] flex items-center justify-center pointer-events-none"
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60vw' }}
          transition={{ duration: 0.5 }}
          className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent mb-3"
        />
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          className="text-4xl sm:text-6xl font-black text-emerald-400 italic tracking-wider drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]"
        >
          BOSS DEFEATED
        </motion.span>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60vw' }}
          transition={{ duration: 0.5 }}
          className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent mt-3"
        />
      </div>
    </motion.div>
  );
}

function PhaseTransitionAlert({ phase }: { phase: number }) {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[75] flex items-center gap-2 bg-red-600/90 border border-red-400 px-6 py-2 shadow-[0_0_20px_red] backdrop-blur pointer-events-none"
    >
      <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
      <span className="text-sm font-black tracking-[0.3em] uppercase text-white">
        PHASE {phase} ENGAGED
      </span>
      <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
    </motion.div>
  );
}

export default function BossHUD({ boss, bossDefeated }: BossHUDProps) {
  const [showIntro, setShowIntro] = useState(false);
  const [showPhaseAlert, setShowPhaseAlert] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [phaseAlertNum, setPhaseAlertNum] = useState(1);

  // Intro banner
  useEffect(() => {
    if (boss && !boss.introShown) {
      setShowIntro(true);
      const timer = setTimeout(() => {
        setShowIntro(false);
        if (boss) boss.introShown = true;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [boss?.id]);

  // Phase transition alert
  useEffect(() => {
    if (boss?.phaseTransitionAlert) {
      setPhaseAlertNum(boss.phase);
      setShowPhaseAlert(true);
      boss.phaseTransitionAlert = false;
      const timer = setTimeout(() => setShowPhaseAlert(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [boss?.phaseTransitionAlert, boss?.phase]);

  // Victory banner
  useEffect(() => {
    if (bossDefeated) {
      setShowVictory(true);
      const timer = setTimeout(() => setShowVictory(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [bossDefeated]);

  if (!boss && !showVictory) return null;

  const hpRatio = boss ? boss.currentHp / boss.maxHp : 0;
  const hpColor = hpRatio > 0.5 ? '#ef4444' : hpRatio > 0.25 ? '#f97316' : '#fbbf24';

  return (
    <>
      {/* Intro Banner */}
      <AnimatePresence>
        {showIntro && boss && <BossIntroBanner name={boss.displayName} />}
      </AnimatePresence>

      {/* Phase Alert */}
      <AnimatePresence>
        {showPhaseAlert && <PhaseTransitionAlert phase={phaseAlertNum} />}
      </AnimatePresence>

      {/* Victory Banner */}
      <AnimatePresence>
        {showVictory && <BossVictoryBanner />}
      </AnimatePresence>

      {/* Boss HP Bar — persistent at top-center during encounter */}
      {boss && boss.behaviorState !== 'defeated' && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-[70] pointer-events-none w-[70vw] max-w-[500px]">
          <div className="bg-black/85 border border-red-500/40 backdrop-blur-md px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            {/* Header row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-black text-red-400 tracking-[0.2em] uppercase">
                  {boss.displayName}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-zinc-500 tracking-widest">PHASE</span>
                {[1, 2, 3].map(p => (
                  <div
                    key={p}
                    className={`w-3 h-3 rounded-sm ${
                      p <= boss.phase
                        ? 'bg-red-500 border border-red-400 shadow-[0_0_6px_red]'
                        : 'bg-zinc-800 border border-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* HP Bar */}
            <div className="relative w-full h-4 bg-zinc-900 border border-zinc-700 rounded-sm overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 bottom-0 rounded-sm"
                style={{
                  background: `linear-gradient(90deg, ${hpColor}, ${hpColor}dd)`,
                  boxShadow: `0 0 12px ${hpColor}80`,
                }}
                initial={{ width: '100%' }}
                animate={{ width: `${Math.max(0, hpRatio * 100)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
              {/* Section dividers */}
              <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="w-px h-full bg-black/40" />
                ))}
              </div>
              {/* HP text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-white/90 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {boss.currentHp} / {boss.maxHp}
                </span>
              </div>
            </div>

            {/* Sub-info */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[8px] font-black text-zinc-600 tracking-widest uppercase">
                {boss.behaviorState.replace(/_/g, ' ')}
              </span>
              {boss.weakPoints.some(wp => wp.exposed) && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-[8px] font-black text-yellow-400 tracking-widest uppercase flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  WEAK POINT EXPOSED
                </motion.span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
