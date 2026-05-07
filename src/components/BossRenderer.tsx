// ─────────────────────────────────────────────────────────────────────────────
// BossRenderer.tsx — Visual rendering for arena boss encounters
//
// Each boss has a unique, dramatic visual that changes across phases.
// Bosses are significantly larger than normal targets and show armor plates,
// weak points, and phase-specific visual effects.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BossState } from '../lib/BossEncounter';
import { REACTION_PROFILES } from './TargetMounts';

interface BossRendererProps {
  boss: BossState;
  cursorPos?: { x: number; y: number };
}

// ── Shared sub-components ───────────────────────────────────────────────────

function BossHpRing({ ratio, color }: { ratio: number; color: string }) {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - ratio);
  return (
    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.3s ease-out', filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

function WeakPointMarker({ exposed, scale }: { exposed: boolean; scale: number }) {
  if (!exposed) return null;
  return (
    <motion.div
      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.2, repeat: Infinity }}
      className="absolute w-5 h-5 rounded-full border-2 border-yellow-400 bg-yellow-400/30"
      style={{
        boxShadow: '0 0 12px rgba(250,204,21,0.7), inset 0 0 6px rgba(250,204,21,0.4)',
        transform: `scale(${scale})`,
      }}
      data-hit-zone="weak_point"
    />
  );
}

function ArmorPlate({ active, color = 'zinc' }: { active: boolean; color?: string; key?: React.Key }) {
  const bg = active
    ? 'bg-gradient-to-b from-zinc-500 to-zinc-700 border-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.4)]'
    : 'bg-zinc-800/40 border-zinc-700/40';
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.3, scale: active ? 1 : 0.9 }}
      className={`rounded-sm border-2 ${bg} transition-all`}
      data-hit-zone={active ? 'armor' : undefined}
    />
  );
}

function PhaseGlow({ phase, color }: { phase: number; color: string }) {
  return (
    <motion.div
      key={`phase-glow-${phase}`}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute inset-[-20%] rounded-full pointer-events-none"
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
}

// ── Training Boss: The Foam Sentinel ────────────────────────────────────────

function FoamSentinel({ boss }: { boss: BossState }) {
  const hpRatio = boss.currentHp / boss.maxHp;
  const isDamaged = hpRatio < 0.5;

  return (
    <div className="relative w-48 h-56 flex flex-col items-center justify-center">
      <PhaseGlow phase={boss.phase} color="rgba(251,191,36,0.3)" />
      <BossHpRing ratio={hpRatio} color="#f59e0b" />

      {/* Main body — oversized foam dummy torso */}
      <div className="relative w-40 h-44 flex flex-col items-center">
        {/* Helmet / head */}
        <motion.div
          animate={boss.phase >= 2 ? { x: [0, -3, 3, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-20 h-14 rounded-t-2xl bg-gradient-to-b from-amber-200 to-amber-100 border-4 border-amber-700 shadow-[0_4px_12px_rgba(0,0,0,0.6)] z-10"
        >
          {/* Visor */}
          <div className="absolute inset-x-3 top-4 h-4 bg-zinc-900 border border-amber-500 rounded-sm flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-8 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_red]"
            />
          </div>
          {/* Top weak point */}
          {boss.weakPoints[0]?.exposed && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <WeakPointMarker exposed scale={boss.scale * 0.5} />
            </div>
          )}
        </motion.div>

        {/* Torso with armor plates */}
        <div className="relative w-36 h-28 bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 border-4 border-amber-700 rounded-lg -mt-2 shadow-[0_8px_20px_rgba(0,0,0,0.7)]" data-hit-zone="body">
          {/* Armor grid */}
          <div className="absolute inset-2 grid grid-cols-3 grid-rows-2 gap-1">
            {boss.armorZones.map((az) => (
              <ArmorPlate key={az.id} active={az.active} />
            ))}
            {/* Fill remaining cells */}
            <div className="bg-amber-600/30 border border-amber-500/30 rounded-sm" />
            <div className="bg-amber-600/30 border border-amber-500/30 rounded-sm" />
            <div className="bg-amber-600/30 border border-amber-500/30 rounded-sm" />
          </div>

          {/* Center bullseye */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-600 border-4 border-white shadow-[0_0_12px_rgba(239,68,68,0.6)] z-10">
            <div className="absolute inset-1 rounded-full bg-white" />
            <div className="absolute inset-[30%] rounded-full bg-red-600" />
            <div className="absolute inset-[45%] rounded-full bg-white" />
          </div>

          {/* Side weak points (phase 2+) */}
          {boss.weakPoints[1]?.exposed && (
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <WeakPointMarker exposed scale={boss.scale * 0.4} />
            </div>
          )}
          {boss.weakPoints[2]?.exposed && (
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2">
              <WeakPointMarker exposed scale={boss.scale * 0.4} />
            </div>
          )}

          {/* Damage cracks overlay */}
          {isDamaged && (
            <div className="absolute inset-0 pointer-events-none rounded-lg"
              style={{
                background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 8px)',
                mixBlendMode: 'multiply',
              }}
            />
          )}
        </div>

        {/* Stand */}
        <div className="w-3 h-4 bg-zinc-700 -mt-1" />
        <div className="w-20 h-3 rounded-full bg-zinc-900 border border-zinc-700 shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
      </div>

      {/* Phase 3: spinning mini-target spawners */}
      {boss.phase === 3 && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-15%] pointer-events-none"
        >
          {[0, 90, 180, 270].map(angle => (
            <motion.div
              key={angle}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: angle / 360 }}
              className="absolute w-4 h-4 rounded-full bg-amber-400 border-2 border-amber-700 shadow-[0_0_8px_#f59e0b]"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}deg) translateY(-90px) translate(-50%, -50%)`,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Warehouse Boss: The Neon Swarm Core ─────────────────────────────────────

function NeonSwarmCore({ boss }: { boss: BossState }) {
  const hpRatio = boss.currentHp / boss.maxHp;
  const coreExposed = boss.weakPoints[0]?.exposed;

  return (
    <div className="relative w-52 h-52 flex items-center justify-center">
      <PhaseGlow phase={boss.phase} color="rgba(6,182,212,0.3)" />
      <BossHpRing ratio={hpRatio} color="#06b6d4" />

      {/* Outer shell */}
      <motion.div
        animate={boss.phase === 2 ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-2 rounded-full border-[6px] border-cyan-500/60 bg-zinc-900/80"
        style={{ boxShadow: '0 0 30px rgba(6,182,212,0.4), inset 0 0 20px rgba(6,182,212,0.15)' }}
      >
        {/* Shield panels */}
        {boss.armorZones.map((az, i) => {
          const angle = i * 120;
          return (
            <motion.div
              key={az.id}
              animate={{ opacity: az.active ? [0.6, 1, 0.6] : 0.15, scale: az.active ? 1 : 0.8 }}
              transition={{ duration: 1.5, repeat: az.active ? Infinity : 0 }}
              className="absolute w-10 h-4 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}deg) translateY(-60px) translate(-50%, -50%)`,
                background: az.active
                  ? 'linear-gradient(90deg, rgba(6,182,212,0.8), rgba(168,85,247,0.8))'
                  : 'rgba(63,63,70,0.3)',
                boxShadow: az.active ? '0 0 12px rgba(6,182,212,0.6)' : 'none',
              }}
              data-hit-zone={az.active ? 'armor' : undefined}
            />
          );
        })}
      </motion.div>

      {/* Inner machinery ring */}
      <div className="absolute inset-10 rounded-full border-4 border-fuchsia-500/40 bg-zinc-950/80">
        {/* Hexagonal internal detail */}
        <div className="absolute inset-2 rounded-full border-2 border-cyan-300/20" />
        <div className="absolute inset-4 rounded-full border border-fuchsia-400/20" />
      </div>

      {/* Core */}
      <motion.div
        animate={coreExposed
          ? { scale: [1, 1.15, 1], opacity: 1 }
          : { scale: 0.85, opacity: 0.3 }
        }
        transition={{ duration: 1, repeat: coreExposed ? Infinity : 0 }}
        className="relative w-16 h-16 rounded-full z-10 flex items-center justify-center"
        style={{
          background: coreExposed
            ? 'radial-gradient(circle, rgba(250,204,21,0.9) 0%, rgba(249,115,22,0.7) 60%, rgba(6,182,212,0.4) 100%)'
            : 'radial-gradient(circle, rgba(63,63,70,0.5) 0%, rgba(24,24,27,0.8) 100%)',
          boxShadow: coreExposed ? '0 0 30px rgba(250,204,21,0.6), 0 0 60px rgba(6,182,212,0.3)' : 'none',
        }}
        data-hit-zone={coreExposed ? 'weak_point' : undefined}
      >
        {coreExposed && (
          <span className="text-xs font-black text-white tracking-wider animate-pulse">CORE</span>
        )}
      </motion.div>

      {/* Drone spawn ports (phase 1) */}
      {boss.phase === 1 && (
        <>
          {[45, 135, 225, 315].map(angle => (
            <motion.div
              key={`port-${angle}`}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: angle / 400 }}
              className="absolute w-3 h-3 rounded-full bg-fuchsia-500 border border-fuchsia-300"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}deg) translateY(-85px) translate(-50%, -50%)`,
                boxShadow: '0 0 8px rgba(217,70,239,0.6)',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ── Rooftop Boss: The Skyline Sniper Rig ────────────────────────────────────

function SkylineSniperRig({ boss }: { boss: BossState }) {
  const hpRatio = boss.currentHp / boss.maxHp;
  const wpExposed = boss.weakPoints[0]?.exposed;
  const shielded = boss.armorZones[0]?.active;

  return (
    <div className="relative w-44 h-60 flex flex-col items-center justify-center">
      <PhaseGlow phase={boss.phase} color="rgba(168,85,247,0.3)" />
      <BossHpRing ratio={hpRatio} color="#a855f7" />

      {/* Antenna mast */}
      <div className="relative w-4 h-16 bg-gradient-to-b from-zinc-400 to-zinc-600 rounded-t-sm">
        {/* Tip blinker */}
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_red]"
        />
        {/* Cross struts */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-zinc-500" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-zinc-500" />
      </div>

      {/* Dish / turret head */}
      <motion.div
        animate={boss.phase === 1
          ? { rotateY: [0, 15, -15, 0] }
          : boss.phase === 3
            ? { rotateY: [0, 5, -5, 0] }
            : {}
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-32 h-20 rounded-xl bg-gradient-to-b from-zinc-600 to-zinc-800 border-4 border-zinc-500 shadow-[0_6px_18px_rgba(0,0,0,0.7)]"
        data-hit-zone="body"
      >
        {/* Dish concave */}
        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-slate-200/20 via-slate-400/10 to-transparent overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '120%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 w-1/3 bg-white/20 blur-md skew-x-12"
          />
        </div>

        {/* Weak point (sensor/lens) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {wpExposed ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-8 h-8 rounded-full bg-fuchsia-500 border-2 border-white shadow-[0_0_20px_rgba(217,70,239,0.8)]"
              data-hit-zone="weak_point"
            >
              <div className="absolute inset-1 rounded-full bg-white/60" />
              <div className="absolute inset-[35%] rounded-full bg-fuchsia-700" />
            </motion.div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-600" />
          )}
        </div>

        {/* Shield plate (phase 3) */}
        {shielded && (
          <motion.div
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-[-4px] rounded-xl border-4 border-fuchsia-400/60 bg-fuchsia-400/10 z-20 pointer-events-none"
            style={{ boxShadow: '0 0 20px rgba(217,70,239,0.4)' }}
          />
        )}
      </motion.div>

      {/* Base / mounting bracket */}
      <div className="w-24 h-8 bg-zinc-700 border-2 border-zinc-600 rounded-b-lg -mt-1 flex items-center justify-center">
        <div className="text-[7px] font-black text-fuchsia-300 tracking-widest">SNIPER RIG</div>
      </div>

      {/* Tripod legs */}
      <div className="flex gap-8 -mt-1">
        <div className="w-[3px] h-8 bg-zinc-500 origin-top rotate-[12deg]" />
        <div className="w-[3px] h-8 bg-zinc-500" />
        <div className="w-[3px] h-8 bg-zinc-500 origin-top -rotate-[12deg]" />
      </div>

      {/* Phase 2: side decoy indicator dots */}
      {boss.phase === 2 && (
        <>
          <motion.div
            animate={{ x: [-8, 8, -8], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-[-20px] top-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"
          />
          <motion.div
            animate={{ x: [8, -8, 8], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute right-[-20px] top-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"
          />
        </>
      )}
    </div>
  );
}

// ── Main BossRenderer ───────────────────────────────────────────────────────

export default function BossRenderer({ boss, cursorPos }: BossRendererProps) {
  const baseScale = boss.scale;
  const profile = REACTION_PROFILES.boss;
  const prevHp = React.useRef(boss.currentHp);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [hitPulse, setHitPulse] = React.useState(0);
  const [recoilDir, setRecoilDir] = React.useState({ x: 0, y: 0.25 });

  React.useEffect(() => {
    if (boss.currentHp < prevHp.current) {
      let dirX = 0;
      let dirY = 0.25;
      if (cursorPos && rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const vx = cx - cursorPos.x;
        const vy = cy - cursorPos.y;
        const len = Math.max(1, Math.hypot(vx, vy));
        dirX = vx / len;
        dirY = vy / len;
      }
      setRecoilDir({ x: dirX, y: dirY });
      setHitPulse(n => n + 1);
    }
    prevHp.current = boss.currentHp;
  }, [boss.currentHp, cursorPos]);

  if (boss.behaviorState === 'defeated') return null;

  return (
    <motion.div
      ref={rootRef}
      className="absolute z-20 pointer-events-auto"
      style={{
        left: `${boss.x}%`,
        top: `${boss.y}%`,
        transform: `translate(-50%, -50%) scale(${baseScale})`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: hitPulse > 0 ? [baseScale, baseScale * 1.08, baseScale * 0.98, baseScale] : baseScale,
        opacity: 1,
        x: hitPulse > 0 ? [0, recoilDir.x * profile.recoilDistance, recoilDir.x * -3, 0] : 0,
        y: hitPulse > 0 ? [0, recoilDir.y * profile.recoilDistance, recoilDir.y * -3, 0] : 0,
        rotate: hitPulse > 0 ? [0, -profile.wobbleAmplitude, profile.wobbleAmplitude * 0.7, -profile.wobbleAmplitude * 0.25, 0] : 0,
      }}
      exit={{ scale: 0, opacity: 0, filter: 'brightness(3) blur(8px)' }}
      transition={{ type: 'spring', stiffness: profile.recoverySpeed, damping: 16, duration: profile.wobbleDuration }}
    >
      {/* Phase indicator ring */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 z-30">
        {[1, 2, 3].map(p => (
          <div
            key={p}
            className={`w-2 h-2 rounded-full border ${
              p <= boss.phase
                ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_#f59e0b]'
                : 'bg-zinc-800 border-zinc-600'
            }`}
          />
        ))}
      </div>

      {/* Arena-specific boss visual */}
      <AnimatePresence mode="wait">
        {boss.arenaId === 'training' && <FoamSentinel boss={boss} />}
        {boss.arenaId === 'warehouse' && <NeonSwarmCore boss={boss} />}
        {boss.arenaId === 'rooftop' && <SkylineSniperRig boss={boss} />}
      </AnimatePresence>

      {/* Boss name label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[8px] font-black text-white/60 tracking-[0.2em] uppercase bg-black/60 px-2 py-0.5 rounded-sm">
          {boss.displayName}
        </span>
      </div>
    </motion.div>
  );
}
