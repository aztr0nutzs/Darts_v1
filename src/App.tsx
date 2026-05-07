import React, { useState, useEffect, useCallback, useRef } from 'react';
import HUD from './components/HUD';
import Gun, { GUNS, GunType } from './components/Gun';
import Target, { TargetData } from './components/Target';
import Dart from './components/Dart';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react';
import { 
  Coins, Lock, Unlock, Heart, Target as TargetIcon, Timer, Infinity as InfinityIcon, Zap, Crosshair, Users, Shield, 
  Activity, Terminal, Settings, ShieldCheck, Wifi, LockOpen, Play, ArrowUpCircle, XCircle, Skull, 
  Trophy, RefreshCw, Home, ShieldPlus, Wind, Cpu
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { NerfReactor, FloatingOrb, ParticleSystem, DamageIndicator, ScanningLaser, CyberGridBackground, CRTOverlay } from './components/BackgroundElements';
import { sounds, HAPTIC, hapticForGun } from './lib/sounds';

import MainMenu from './components/MainMenu';
import { PauseOverlay } from './components/PauseOverlay';
import { InGameControls } from './components/InGameControls';
import { InGameSettingsPanel } from './components/InGameSettingsPanel';
import BootSequence from './components/BootSequence';
import CountdownOverlay from './components/CountdownOverlay';
import MultiplayerLobby from './components/MultiplayerLobby';
import ResultsOverlay from './components/ResultsOverlay';
import { GameplayDirector } from './lib/GameplayDirector';
import { resolveShotHit } from './lib/ShotResolver';
import ArenaScene, { ArenaId } from './components/ArenaScene';

export type DartType = {
  id: string;
  name: string;
  damage: number;
  speed: number;
  blastRadius: number;
  color: string;
  shape: 'laser' | 'plasma' | 'pulse' | 'rocket';
  unlockCost: number;
  description: string;
};

export const DART_TYPES: Record<string, DartType> = {
  standard: { id: 'standard', name: 'ELITE_PROX', damage: 15, speed: 800, blastRadius: 0, color: '#06b6d4', shape: 'laser', unlockCost: 0, description: 'STANDARD_ISSUE_PRECISION' },
  stinger: { id: 'stinger', name: 'STINGER_VOLT', damage: 10, speed: 1500, blastRadius: 0, color: '#fbbf24', shape: 'pulse', unlockCost: 1000, description: 'ULTRA_VELOCITY_VOLLEY' },
  plasma: { id: 'plasma', name: 'PLASMA_CORE', damage: 35, speed: 500, blastRadius: 0, color: '#a855f7', shape: 'plasma', unlockCost: 2500, description: 'THERMAL_ENERGY_BOLT' },
  vortex: { id: 'vortex', name: 'VORTEX_HELL', damage: 50, speed: 350, blastRadius: 80, color: '#ef4444', shape: 'rocket', unlockCost: 5000, description: 'AREA_DENIAL_ORDNANCE' },
  void: { id: 'void', name: 'VOID_SPIKE', damage: 100, speed: 400, blastRadius: 30, color: '#312e81', shape: 'laser', unlockCost: 12000, description: 'EXPERIMENTAL_SINGULARITY' },
};

export type GameMode = 'classic' | 'endless' | 'timeAttack' | 'targetRush' | 'multiplayer' | 'hardcore' | 'coop';

type DartData = {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  dartType: any;
};

type HitEffectData = {
  id: string;
  x: number;
  y: number;
  color: string;
  isDestroy?: boolean;
  isMiss?: boolean;
  isExplosion?: boolean;
  /** Authoritative hit-zone quality. Drives armor / weak-point / graze visuals. */
  quality?: 'graze' | 'armor' | 'body' | 'center' | 'weak_point';
  /** Optional shot trajectory origin in viewport % units — used to bias miss
      debris so it sprays away from the muzzle for directional consistency. */
  originX?: number;
  originY?: number;
};

type CombatTextData = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isCritical?: boolean;
};

function CombatText({ text, x, y, color, isCritical }: { key?: React.Key; text: string; x: number; y: number; color: string; isCritical?: boolean }) {
  return (
    <motion.div
      className={`absolute pointer-events-none z-50 font-black tracking-widest whitespace-nowrap ${isCritical ? 'chromatic' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
      initial={{ opacity: 1, scale: isCritical ? 2.5 : 1.5, y: 0, x: '-50%' }}
      animate={{ opacity: 0, scale: isCritical ? 1.5 : 1, y: -60, x: '-50%' }}
      transition={{ duration: isCritical ? 1 : 0.6, ease: "easeOut" }}
    >
      <span className={`${isCritical ? 'text-white text-5xl italic' : 'text-3xl italic'}`} style={{ color: isCritical ? undefined : color }}>
        {text}
      </span>
    </motion.div>
  );
}

function HitEffect({ x, y, color, isDestroy, isMiss, isExplosion, quality, originX, originY }: { key?: React.Key; x: number; y: number; color: string; isDestroy?: boolean; isMiss?: boolean; isExplosion?: boolean; quality?: 'graze' | 'armor' | 'body' | 'center' | 'weak_point'; originX?: number; originY?: number }) {
  if (isMiss) {
    const particleCount = 8;
    const spread = 50;
    // Trajectory direction (from muzzle to impact) drives debris spray so misses
    // feel directionally consistent with the shot. Falls back to bottom-center
    // when no origin is supplied.
    const ox = typeof originX === 'number' ? originX : 50;
    const oy = typeof originY === 'number' ? originY : 100;
    const trajRad = Math.atan2(y - oy, x - ox);
    const trajDeg = trajRad * 180 / Math.PI;
    // Stable scratch angle: orient streak roughly perpendicular to trajectory so
    // it reads as a glancing scrape on the wall.
    const scratchAngle = trajDeg + 90 + ((Math.round(x * 7) + Math.round(y * 11)) % 30 - 15);
    return (
      <div className="absolute pointer-events-none z-30" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
        {/* Wall puff — slightly stronger so misses still register as feedback */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0.85 }}
          animate={{ scale: 3.0, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-200 blur-md"
        />
        {/* Secondary darker dust ring */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0.55 }}
          animate={{ scale: 3.6, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-700/55 blur-lg"
        />
        {/* Trajectory-aligned smoke trail puff */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0.5 }}
          animate={{ scale: 1.7, opacity: 0, x: -Math.cos(trajRad) * 28, y: -Math.sin(trajRad) * 28 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 w-8 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-300/70 blur-sm"
          style={{ transform: `translate(-50%, -50%) rotate(${trajDeg}deg)` }}
        />
        {/* Sharp scratch streak on the wall — perpendicular to trajectory */}
        <motion.div
          initial={{ opacity: 0.8, scaleX: 0.2 }}
          animate={{ opacity: 0, scaleX: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-[1.5px] bg-stone-100 origin-left"
          style={{ transform: `translate(-50%, -50%) rotate(${scratchAngle}deg)` }}
        />
        {/* Foam bounce pieces — ricochet biased into a forward cone (±70° around
            the trajectory direction) so debris sprays away from the shot line. */}
        {[...Array(particleCount)].map((_, i) => {
          const cone = ((i / Math.max(1, particleCount - 1)) - 0.5) * (Math.PI * 70 / 90);
          const a = trajRad + cone + (Math.random() - 0.5) * 0.25;
          const r = spread + Math.random() * 24;
          return (
            <motion.div
              key={i}
              className="absolute rounded-sm w-3 h-2"
              style={{ backgroundColor: color }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: Math.random() * 360 }}
              animate={{
                x: Math.cos(a) * r,
                y: Math.sin(a) * r + 45,
                opacity: 0,
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 0.5 + Math.random() * 0.3, ease: 'easeOut' }}
            />
          );
        })}
        {/* Small grit/debris specks — also biased along trajectory */}
        {[...Array(6)].map((_, i) => {
          const cone = ((i / 5) - 0.5) * (Math.PI * 60 / 90);
          const a = trajRad + cone;
          const r = 20 + Math.random() * 50;
          return (
            <motion.div
              key={`d-${i}`}
              className="absolute w-[3px] h-[3px] rounded-full bg-zinc-400"
              initial={{ x: 0, y: 0, opacity: 0.9 }}
              animate={{
                x: Math.cos(a) * r,
                y: Math.sin(a) * r + 25 + Math.random() * 35,
                opacity: 0,
              }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          );
        })}
      </div>
    );
  }

  // Armor deflection — dart bounces off armored shell
  if (!isExplosion && !isDestroy && quality === 'armor') {
    return (
      <div className="absolute pointer-events-none z-40" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
        {/* Steely flash */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0.95 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-100 blur-[2px]"
        />
        {/* Spark burst */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-3 bg-amber-100"
            style={{ boxShadow: '0 0 6px #fde68a' }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: (i / 10) * 360 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 10) * (40 + Math.random() * 20),
              y: Math.sin((i * Math.PI * 2) / 10) * (40 + Math.random() * 20),
              opacity: 0,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        ))}
        {/* Deflection ring */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 border-slate-200/80"
        />
        {/* Bounced foam piece */}
        <motion.div
          className="absolute w-2.5 h-1.5 rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: 60, y: -40, opacity: 0, rotate: 540 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    );
  }

  // Weak-point hit — golden burst + crit indicator
  if (!isExplosion && quality === 'weak_point') {
    const particleCount = isDestroy ? 18 : 12;
    const spread = isDestroy ? 110 : 70;
    return (
      <div className="absolute pointer-events-none z-40" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
        {/* Bright core */}
        <motion.div
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-yellow-200 blur-md"
        />
        {/* Outer halo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0.9 }}
          animate={{ scale: 3.4, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-yellow-300"
        />
        {/* Radial spark spikes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`s-${i}`}
            className="absolute w-[2px] h-6 bg-yellow-200"
            style={{ boxShadow: '0 0 8px #fde047' }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: (i / 8) * 360 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 8) * 45,
              y: Math.sin((i * Math.PI * 2) / 8) * 45,
              opacity: 0,
            }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        ))}
        {/* Foam particles colored by dart */}
        {[...Array(particleCount)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${Math.random() > 0.5 ? 'w-3 h-3 rounded-full' : 'w-2 h-4 rounded-sm'}`}
            style={{ backgroundColor: i % 3 === 0 ? '#fde047' : color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / particleCount) * (spread + Math.random() * 20),
              y: Math.sin((i * Math.PI * 2) / particleCount) * (spread + Math.random() * 20),
              opacity: 0,
              rotate: Math.random() * 720,
            }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        ))}
      </div>
    );
  }

  // Graze — minimal clip with a single drifting flake
  if (!isExplosion && !isDestroy && quality === 'graze') {
    return (
      <div className="absolute pointer-events-none z-30" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
        <motion.div
          initial={{ scale: 0.4, opacity: 0.7 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
          style={{ backgroundColor: color, filter: 'blur(3px)', opacity: 0.5 }}
        />
        <motion.div
          className="absolute w-2 h-1 rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: 35, y: 20, opacity: 0, rotate: 360 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    );
  }

  if (isExplosion) {
    const particleCount = 24;
    const spread = 200;
    return (
      <div className="absolute pointer-events-none z-40" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
        {/* Core Shockwave - Plastic Ring */}
        <motion.div 
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-[10px] border-orange-400"
        />
        {/* Foam/Plastic Particles */}
        {[...Array(particleCount)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${Math.random() > 0.5 ? 'rounded-full w-6 h-6' : 'rounded-sm w-4 h-8'}`}
            style={{ backgroundColor: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f97316' : '#22c55e' }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / Math.max(1, particleCount)) * (spread + Math.random() * (spread / 1.5)),
              y: Math.sin((i * Math.PI * 2) / Math.max(1, particleCount)) * (spread + Math.random() * (spread / 1.5)) + (Math.random() * 100), // add gravity drop
              scale: 0.5,
              opacity: 0,
              rotate: Math.random() * 720
            }}
            transition={{ duration: 0.7 + Math.random() * 0.5, ease: "easeOut" }}
          />
        ))}
        {/* Smoke Puffs */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`smoke-${i}`}
            className="absolute bg-neutral-400 rounded-full blur-xl opacity-60"
            style={{ width: '60px', height: '60px' }}
            initial={{ x: 0, y: 0, scale: 0.5 }}
            animate={{
              x: Math.random() * 160 - 80,
              y: Math.random() * -150 - 20,
              scale: 2.5,
              opacity: 0
            }}
            transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
          />
        ))}
      </div>
    );
  }

  const particleCount = isDestroy ? 16 : 6;
  const spread = isDestroy ? 100 : 50;
  
  return (
    <div className="absolute pointer-events-none z-30" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
      <AnimatePresence>
        {[...Array(particleCount)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${isDestroy ? (Math.random() > 0.5 ? 'w-5 h-5' : 'w-3 h-6') : 'w-2 h-4'} ${Math.random() > 0.3 ? 'rounded-full' : 'rounded-sm'}`}
            style={{ backgroundColor: color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / particleCount) * (spread + Math.random() * (spread/2)),
              y: Math.sin((i * Math.PI * 2) / particleCount) * (spread + Math.random() * (spread/2)) + 40,
              scale: 0.2,
              opacity: 0,
              rotate: Math.random() * 720
            }}
            transition={{ duration: isDestroy ? 0.6 : 0.4, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
      <motion.div
        className="absolute rounded-full"
        style={{ backgroundColor: '#ffffff', filter: 'blur(4px)', width: isDestroy ? '60px' : '30px', height: isDestroy ? '60px' : '30px' }}
        initial={{ scale: 0.5, opacity: 0.8, x: '-50%', y: '-50%' }}
        animate={{ scale: isDestroy ? 2 : 1.5, opacity: 0, x: '-50%', y: '-50%' }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}

const ARENAS: { id: ArenaId; name: string; level: number; targetScore: number }[] = [
  { id: 'training',  name: "TRAINING BAY",     level: 1, targetScore: 25000 },
  { id: 'warehouse', name: "WAREHOUSE RUSH",   level: 2, targetScore: 30000 },
  { id: 'rooftop',   name: "SKYLINE ROOFTOP",  level: 3, targetScore: 45000 },
];

function CustomCrosshair({ x, y, isShooting, hitMarkerTime, hitMarkerType, ammo, maxAmmo, isReloading, scale, gun, buffs, settings }: { x: any, y: any, isShooting: boolean, hitMarkerTime: number, hitMarkerType: 'normal'|'crit'|'kill'|'armor', ammo: number, maxAmmo: number, isReloading: boolean, scale: any, gun: GunType, buffs: { damage: number, rapidFire: number, shield: number }, settings: any }) {
  // Extended flash window — 220ms for normal, 300ms for crit/kill so they read clearly
  const elapsed = Date.now() - hitMarkerTime;
  const flashWindow = (hitMarkerType === 'kill' || hitMarkerType === 'crit') ? 300 : 220;
  const showHit = settings.hitMarkers && elapsed < flashWindow;
  const hasDamageBuff = Date.now() < buffs.damage;
  const hasShieldBuff = Date.now() < buffs.shield;

  let hmColor = 'white';
  let hmShadow = 'rgba(255,255,255,0.8)';
  if (hitMarkerType === 'kill') { hmColor = '#ef4444'; hmShadow = 'rgba(239,68,68,0.9)'; }
  else if (hitMarkerType === 'crit') { hmColor = '#fde047'; hmShadow = 'rgba(253,224,71,0.9)'; }
  else if (hitMarkerType === 'armor') { hmColor = '#cbd5e1'; hmShadow = 'rgba(203,213,225,0.7)'; }

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[100]"
      style={{ x, y, translateX: '-50%', translateY: '-50%', scale }}
    >
      <motion.div
        animate={{
          scale: isShooting ? 1.6 : (showHit && hitMarkerType === 'kill' ? 2.2 : showHit && hitMarkerType === 'crit' ? 1.9 : showHit ? 1.4 : 1),
        }}
        transition={{ duration: 0.10, ease: 'easeOut' }}
        className="relative flex items-center justify-center w-16 h-16"
      >
        {/* Shield Aura Effect */}
        {hasShieldBuff && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/30 bg-cyan-400/5 blur-md"
          />
        )}

        {/* Damage Glow Effect */}
        {hasDamageBuff && (
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 20px rgba(239, 68, 68, 0.2)",
                "0 0 40px rgba(239, 68, 68, 0.5)",
                "0 0 20px rgba(239, 68, 68, 0.2)"
              ]
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute w-20 h-20 rounded-full border border-red-500/50"
          />
        )}

        {/* Kill confirmation: thick inner ring + outer halo + brief scale snap */}
        <AnimatePresence>
          {showHit && hitMarkerType === 'kill' && (
            <>
              <motion.div
                key="kill-ring"
                initial={{ scale: 0.55, opacity: 1 }}
                animate={{ scale: 3.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
                className="absolute w-16 h-16 rounded-full border-[3px] border-red-500 pointer-events-none"
                style={{ boxShadow: '0 0 26px rgba(239,68,68,0.8), inset 0 0 14px rgba(239,68,68,0.4)' }}
              />
              <motion.div
                key="kill-halo"
                initial={{ scale: 0.4, opacity: 0.7 }}
                animate={{ scale: 5.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="absolute w-16 h-16 rounded-full border border-red-300/70 pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        {/* Weak-point / crit golden ring + radial spike accents */}
        <AnimatePresence>
          {showHit && hitMarkerType === 'crit' && (
            <>
              <motion.div
                key="crit-ring"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 3.0, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
                className="absolute w-16 h-16 rounded-full border-[2.5px] border-yellow-300 pointer-events-none"
                style={{ boxShadow: '0 0 18px rgba(253,224,71,0.85)' }}
              />
              {/* Four radial spikes for crits — read as "sweet spot" */}
              {[0, 90, 180, 270].map(angle => (
                <motion.div
                  key={`crit-spike-${angle}`}
                  initial={{ opacity: 1, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.26, ease: 'easeOut' }}
                  className="absolute w-[2px] h-5 bg-yellow-200 pointer-events-none"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-26px)`,
                    boxShadow: '0 0 6px #fde047',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Armor block: chevron brackets pulse outward — reads as deflection */}
        <AnimatePresence>
          {showHit && hitMarkerType === 'armor' && (
            <motion.div
              key="armor-shell"
              initial={{ opacity: 0.95, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="absolute w-14 h-14 rounded-full pointer-events-none"
              style={{
                border: '2px dashed rgba(203,213,225,0.95)',
                boxShadow: '0 0 12px rgba(203,213,225,0.55)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Clean Center Dot & Outline */}
        <div className={`absolute w-1.5 h-1.5 rounded-full z-30 ${showHit ? '' : 'bg-orange-500 shadow-[0_0_8px_#f97316]'}`}
             style={showHit ? { backgroundColor: hmColor, boxShadow: `0 0 14px ${hmShadow}` } : {}}
        />
        <div className={`absolute w-3 h-3 rounded-full border border-cyan-400 opacity-60 ${!isShooting && !showHit ? 'animate-pulse' : ''} z-20`} />

        {settings.crosshairStyle === 'tactical' && (
          <>
            {/* 4 Brackets */}
            <div className={`absolute top-0 left-0 w-3 h-3 border-t-[1.5px] border-l-[1.5px] transition-all duration-100 ${isReloading ? 'border-red-500' : 'border-cyan-400 opacity-90'} shadow-[0_0_8px_rgba(34,211,238,0.4)] ${isShooting ? '-translate-x-1 -translate-y-1' : ''}`} />
            <div className={`absolute top-0 right-0 w-3 h-3 border-t-[1.5px] border-r-[1.5px] transition-all duration-100 ${isReloading ? 'border-red-500' : 'border-cyan-400 opacity-90'} shadow-[0_0_8px_rgba(34,211,238,0.4)] ${isShooting ? 'translate-x-1 -translate-y-1' : ''}`} />
            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-[1.5px] border-l-[1.5px] transition-all duration-100 ${isReloading ? 'border-red-500' : 'border-cyan-400 opacity-90'} shadow-[0_0_8px_rgba(34,211,238,0.4)] ${isShooting ? '-translate-x-1 translate-y-1' : ''}`} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-[1.5px] border-r-[1.5px] transition-all duration-100 ${isReloading ? 'border-red-500' : 'border-cyan-400 opacity-90'} shadow-[0_0_8px_rgba(34,211,238,0.4)] ${isShooting ? 'translate-x-1 translate-y-1' : ''}`} />

            {/* Hit Marker Lines — thicker and more vivid */}
            <AnimatePresence>
              {showHit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: hitMarkerType === 'kill' ? 1.4 : hitMarkerType === 'crit' ? 1.2 : 1.0 }}
                  exit={{ opacity: 0, scale: 1.8, transition: { duration: 0.12 } }}
                  className="absolute inset-0 flex items-center justify-center -rotate-45 pointer-events-none z-50"
                >
                  <div className="absolute top-0 left-1/2 w-[2.5px] h-4 -translate-x-1/2" style={{ backgroundColor: hmColor, boxShadow: `0 0 8px ${hmShadow}` }} />
                  <div className="absolute bottom-0 left-1/2 w-[2.5px] h-4 -translate-x-1/2" style={{ backgroundColor: hmColor, boxShadow: `0 0 8px ${hmShadow}` }} />
                  <div className="absolute left-0 top-1/2 h-[2.5px] w-4 -translate-y-1/2" style={{ backgroundColor: hmColor, boxShadow: `0 0 8px ${hmShadow}` }} />
                  <div className="absolute right-0 top-1/2 h-[2.5px] w-4 -translate-y-1/2" style={{ backgroundColor: hmColor, boxShadow: `0 0 8px ${hmShadow}` }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Tech Labels */}
            <div className="absolute top-8 text-[8px] font-black tracking-[0.2em] text-cyan-400 opacity-50 uppercase whitespace-nowrap">
              {gun.fireMode} // {ammo}
            </div>

            {/* Reloading Ring */}
            {isReloading && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 animate-[spin_1s_linear_infinite] pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" className="text-red-500/80" strokeDasharray="180" strokeDashoffset="0" />
              </svg>
            )}
          </>
        )}

        {settings.crosshairStyle === 'dot' && (
           <div className={`absolute w-8 h-8 rounded-full border border-orange-500/30 ${isShooting ? 'scale-150 opacity-0' : 'scale-100 opacity-100'} transition-all duration-150`} />
        )}

        {/* Hit Marker X — sharper scale pop + brighter glow per type */}
        <AnimatePresence>
          {showHit && (
            <motion.div
              initial={{ scale: 0.25, opacity: 0, rotate: 45 }}
              animate={{
                scale: hitMarkerType === 'kill' ? 2.2 : hitMarkerType === 'crit' ? 1.85 : hitMarkerType === 'armor' ? 1.1 : 1.4,
                opacity: 1,
                rotate: 45,
              }}
              exit={{ scale: 3.2, opacity: 0, transition: { duration: 0.14 } }}
              transition={{ type: 'spring', stiffness: 700, damping: 18 }}
              className="absolute pointer-events-none flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            >
              {/* Thicker stroke + double-glow on kill/crit so they pop. */}
              <div
                className={`${hitMarkerType === 'kill' ? 'w-12 h-[3.5px]' : hitMarkerType === 'crit' ? 'w-11 h-[3px]' : 'w-10 h-[2.5px]'} rounded-full absolute origin-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
                style={{ backgroundColor: hmColor, boxShadow: `0 0 14px ${hmShadow}, 0 0 28px ${hmShadow}` }}
              />
              <div
                className={`${hitMarkerType === 'kill' ? 'h-12 w-[3.5px]' : hitMarkerType === 'crit' ? 'h-11 w-[3px]' : 'h-10 w-[2.5px]'} rounded-full absolute origin-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
                style={{ backgroundColor: hmColor, boxShadow: `0 0 14px ${hmShadow}, 0 0 28px ${hmShadow}` }}
              />
              {/* Kill gets an extra diagonal cross under the X to read as a double-snap */}
              {hitMarkerType === 'kill' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                  animate={{ opacity: 0.85, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-9 h-[2px] rounded-full" style={{ backgroundColor: hmColor, boxShadow: `0 0 10px ${hmShadow}` }} />
                  <div className="h-9 w-[2px] rounded-full -mt-9 ml-[16px]" style={{ backgroundColor: hmColor, boxShadow: `0 0 10px ${hmShadow}` }} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function UpgradeMenu({ credits, upgrades, onUpgrade, onClose, currentGun, currentDart }: { credits: number, upgrades: any, onUpgrade: (type: string) => void, onClose: () => void, currentGun: GunType, currentDart: DartType }) {
  const costs = { damage: [500, 1000, 2000], reloadSpeed: [500, 1000, 2000], ammoCapacity: [500, 1000, 2000] };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl md:p-8"
    >
      {/* Background Grids */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#22d3ee_0%,transparent_70%)]" />
         <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="bg-black/90 border-2 border-cyan-500/30 w-full h-full md:h-auto md:max-w-5xl relative overflow-hidden flex flex-col md:flex-row">
        {/* Left Stats Panel */}
        <div className="w-full md:w-1/3 bg-zinc-950/50 border-r border-cyan-500/10 p-8 flex flex-col">
           <div className="mb-6">
              <div className="text-[10px] font-black text-cyan-500 tracking-[0.4em] uppercase mb-2 flex items-center gap-2">
                 <Activity className="w-4 h-4" /> CURRENT_CONFIG
              </div>
              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{currentGun.name}</h3>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">{currentGun.description}</p>
           </div>

           <div className="space-y-4 flex-1">
              {[
                { label: 'CALIBER', val: currentDart.name, color: 'text-yellow-500' },
                { label: 'DMG_MOD', val: `+${upgrades.damage * 5}`, color: 'text-orange-500' },
                { label: 'CY_SPEED', val: `-${upgrades.reloadSpeed * 10}%`, color: 'text-cyan-500' },
                { label: 'MAG_EXT', val: `+${upgrades.ammoCapacity * 2}`, color: 'text-green-500' },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                   <span className="text-[9px] font-black text-zinc-600">{stat.label}</span>
                   <span className={`text-xs font-black italic ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
           </div>

           <div className="mt-8 p-4 bg-cyan-950/20 border border-cyan-500/20">
              <div className="text-[8px] font-black text-cyan-400 mb-2">NEURAL_CALIBRATION_READY</div>
              <div className="h-1 bg-zinc-800 w-full overflow-hidden">
                 <motion.div 
                   animate={{ x: [-100, 100] }} 
                   transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                   className="h-full w-1/4 bg-cyan-400" 
                 />
              </div>
           </div>
        </div>

        {/* Right Upgrades Panel */}
        <div className="flex-1 p-8 md:p-10 flex flex-col">
          <div className="absolute -top-4 -right-4 bg-cyan-500 text-black px-4 py-1 font-black text-xs tracking-widest italic uppercase z-50">WEAPON_REFINEMENT_MODULE</div>
          
          <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
            <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">Upgrades</h2>
            <div className="flex items-center gap-3 bg-zinc-900/80 px-6 py-3 border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.05)]">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-black text-yellow-500 tracking-tighter">{credits.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-auto">
            {[
              { id: 'damage', name: 'Ballistic_Power', icon: Zap, color: 'text-orange-500', glow: 'shadow-orange-500/20' },
              { id: 'reloadSpeed', name: 'Reflex_Sync', icon: Wind, color: 'text-cyan-500', glow: 'shadow-cyan-500/20' },
              { id: 'ammoCapacity', name: 'Mag_Density', icon: ShieldPlus, color: 'text-green-500', glow: 'shadow-green-500/20' },
            ].map((item) => {
              const Icon = item.icon;
              const level = upgrades[item.id as keyof typeof upgrades];
              const cost = costs[item.id as keyof typeof costs][level];
              const isMax = level >= 3;
              const canAfford = credits >= cost;

              return (
                <div key={item.id} className="bg-zinc-950/40 border border-white/5 p-6 flex flex-col gap-4 relative group hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start">
                     <div className={`p-3 bg-black border border-white/5 ${item.glow} group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${item.color}`} />
                     </div>
                     <div className="text-[9px] font-black text-zinc-400 bg-black px-2 py-0.5 border border-zinc-800">LVL_0{level}</div>
                  </div>
                  <div className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{item.name}</div>
                  
                  <div className="flex gap-1.5 h-1.5">
                     {[1, 2, 3].map(i => (
                       <div key={i} className={`flex-1 transform -skew-x-12 ${i <= level ? item.color.replace('text', 'bg') : 'bg-white/5'} transition-all`} />
                     ))}
                  </div>

                  <button 
                    className={`mt-4 py-4 font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 relative overflow-hidden
                      ${isMax ? 'bg-zinc-900 text-zinc-700 cursor-default grayscale' : 
                        canAfford ? 'bg-white text-black hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98]' : 'bg-black text-zinc-800 border border-zinc-900 pointer-events-none'}`}
                    disabled={isMax || !canAfford}
                    onClick={() => onUpgrade(item.id)}
                  >
                    {isMax ? 'MAX_POTENTIAL' : (
                      <>
                        <ArrowUpCircle className="w-4 h-4" />
                        <span>UPGRADE: {cost}</span>
                      </>
                    )}
                    {canAfford && !isMax && (
                      <motion.div 
                        animate={{ x: ['100%', '-100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          
          <button 
            className="w-full bg-zinc-950 border border-white/10 text-white/40 font-black tracking-[0.7em] py-6 mt-8 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 uppercase text-xs" 
            onClick={onClose}
          >
            <XCircle className="w-5 h-5" />
            <span>EXIT_SYSTEM</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EnemyProjectile({ proj, onFinish }: { key?: React.Key, proj: any, onFinish: () => void }) {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= proj.duration) {
        clearInterval(interval);
        onFinish();
      }
      setNow(Date.now());
    }, 16);
    return () => clearInterval(interval);
  }, [proj.duration, onFinish]);

  const elapsed = now - proj.createdAt;
  const progress = Math.min(1, elapsed / proj.duration);
  
  const currentX = proj.x + (proj.targetX - proj.x) * progress;
  const currentY = proj.y + (proj.targetY - proj.y) * progress;
  const currentScale = 0.5 + progress * 2.5;

  return (
    <div 
      className="absolute pointer-events-none z-[100]"
      style={{ 
        left: `${currentX}%`, 
        top: `${currentY}%`,
        transform: `translate(-50%, -50%) scale(${currentScale})`
      }}
    >
      <div className="w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_15px_#f97316] animate-pulse" />
      <div className="absolute inset-0 bg-white/40 rounded-full scale-150 blur-sm" />
    </div>
  );
}

function DustParticles() {
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    duration: 10 + Math.random() * 20,
    delay: Math.random() * -20,
    size: 2 + Math.random() * 4,
    opacity: 0.1 + Math.random() * 0.3
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10" style={{ mixBlendMode: 'screen' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-200/50"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px rgba(6,182,212,0.4)`
          }}
          animate={{
            y: [-20, -100],
            x: [0, Math.random() * 50 - 25],
            opacity: [0, p.opacity, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [hasBooted, setHasBooted] = useState(false);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'paused'>('menu');
  const [showCountdown, setShowCountdown] = useState(false);
  const [currentArena, setCurrentArena] = useState(ARENAS[0]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentGun, setCurrentGun] = useState<GunType>(GUNS.peacemaker);
  const [currentDart, setCurrentDart] = useState<DartType>(DART_TYPES.standard);
  const [ammo, setAmmo] = useState(GUNS.peacemaker.maxAmmo);
  const [isReloading, setIsReloading] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [targets, setTargets] = useState<TargetData[]>([]);
  const targetsRef = useRef<TargetData[]>([]);
  const [darts, setDarts] = useState<DartData[]>([]);
  const [hitEffects, setHitEffects] = useState<HitEffectData[]>([]);
  const [enemyDarts, setEnemyDarts] = useState<any[]>([]);
  const [combo, setCombo] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [jammingIntensity, setJammingIntensity] = useState(0);
  const [activeBuffs, setActiveBuffs] = useState({ damage: 0, rapidFire: 0, shield: 0 });
  const [hitMarkerTime, setHitMarkerTime] = useState(0);
  const [hitMarkerType, setHitMarkerType] = useState<'normal' | 'crit' | 'kill' | 'armor'>('normal');
  const [damageDirection, setDamageDirection] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const muzzleRef = useRef<HTMLDivElement>(null);
  const [isFlinching, setIsFlinching] = useState(false);

  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [lives, setLives] = useState(5);
  const [targetsHit, setTargetsHit] = useState(0);
  const [totalShots, setTotalShots] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [weakPointHits, setWeakPointHits] = useState(0);
  const [shotsFiredPerWeapon, setShotsFiredPerWeapon] = useState<Record<string, number>>({});
  const targetGoal = 50;

  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);
  const [wave, setWave] = useState(1);
  const [maxWave, setMaxWave] = useState(3);
  const [targetScoreGoal, setTargetScoreGoal] = useState(25000);

  const [flash, setFlash] = useState(false);
  // Brief orange/white pulse on target kill — separate from damage flash
  const [killFlash, setKillFlash] = useState(false);
  // Hit-pause / micro time dilation: 'crit' = 50ms pulse, 'kill' = 80ms pulse.
  // Used to drive a brief punch-zoom + saturate overlay that simulates the
  // freeze-frame impact moment without halting the game loop.
  const [hitPause, setHitPause] = useState<null | 'crit' | 'kill'>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Briefly punch the screen with a saturate/contrast pulse to simulate the
  // freeze-frame "hit feel" used in critical & kill hits.
  const triggerHitPause = useCallback((kind: 'crit' | 'kill') => {
    setHitPause(kind);
    const ms = kind === 'kill' ? 80 : 50;
    setTimeout(() => setHitPause(null), ms);
  }, []);

  // Compute muzzle origin in viewport % (relative to game area). Used to give
  // miss effects a directionally-consistent debris spray.
  const getMuzzleOrigin = useCallback((): { x: number, y: number } => {
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 100 };
    if (muzzleRef.current) {
      const m = muzzleRef.current.getBoundingClientRect();
      return {
        x: ((m.left + m.width / 2 - rect.left) / rect.width) * 100,
        y: ((m.top + m.height / 2 - rect.top) / rect.height) * 100,
      };
    }
    return { x: 50, y: 100 };
  }, []);

  const [uiSettings, setUiSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dart_uiSettings');
      return saved ? JSON.parse(saved) : { leftHanded: false, hudScale: 'normal', crosshairStyle: 'tactical', hitMarkers: true, showFireButton: true, controlScale: 1.0, soundVolume: 0.7, hapticsEnabled: true, screenEffects: true };
    } catch {
      return { leftHanded: false, hudScale: 'normal', crosshairStyle: 'tactical', hitMarkers: true, showFireButton: true, controlScale: 1.0, soundVolume: 0.7, hapticsEnabled: true, screenEffects: true };
    }
  });

  useEffect(() => {
    localStorage.setItem('dart_uiSettings', JSON.stringify(uiSettings));
  }, [uiSettings]);

  // Sync master volume whenever the setting changes
  useEffect(() => {
    sounds.setVolume(uiSettings.soundVolume ?? 0.7);
  }, [uiSettings.soundVolume]);

  const takeDamage = useCallback((amount: number = 1) => {
    if (Date.now() < activeBuffs.shield) return; // Immune

    setLives(l => Math.max(0, l - amount));
    setDamageDirection(['top', 'right', 'bottom', 'left'][Math.floor(Math.random()*4)] as any);
    setFlash(true);
    setTimeout(() => setFlash(false), 50);
    setShakeIntensity(20);
    setTimeout(() => setShakeIntensity(0), 400);
    setTimeout(() => setDamageDirection(null), 500);
    setCombo(0);
    vibrate([100, 100, 100]);
    
    setIsFlinching(true);
    setTimeout(() => setIsFlinching(false), 300);
  }, [activeBuffs.shield]);

  const handleUpgrade = (type: string) => {
    const costs = { damage: [500, 1000, 2000], reloadSpeed: [500, 1000, 2000], ammoCapacity: [500, 1000, 2000] };
    const level = upgrades[type as keyof typeof upgrades];
    const cost = costs[type as keyof typeof costs][level];
    
    if (credits >= cost) {
      setCredits(c => c - cost);
      setUpgrades(prev => ({ ...prev, [type]: level + 1 }));
    }
  };

  // Multiplayer State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('connecting');
  const [roomId, setRoomId] = useState('');
  const [multiplayerState, setMultiplayerState] = useState<any>(null);
  const [isMultiplayerWaiting, setIsMultiplayerWaiting] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  // Cache of server fire-result responses keyed by clientFireId, used to
  // render hit/miss visuals after the dart finishes traveling.
  const pendingFireResults = useRef<Map<string, any>>(new Map());
  const gameModeRef = useRef<GameMode>('classic');

  // Persistence
  const [credits, setCredits] = useState(() => parseInt(localStorage.getItem('nerf_credits') || '0'));
  const [unlockedGuns, setUnlockedGuns] = useState<string[]>(() => {
    const saved = localStorage.getItem('nerf_unlocked');
    return saved ? JSON.parse(saved) : ['peacemaker'];
  });
  const [unlockedDarts, setUnlockedDarts] = useState<string[]>(() => {
    const saved = localStorage.getItem('nerf_unlocked_darts');
    return saved ? JSON.parse(saved) : ['standard'];
  });
  const [upgrades, setUpgrades] = useState<{ damage: number, reloadSpeed: number, ammoCapacity: number }>(() => {
    const saved = localStorage.getItem('nerf_upgrades');
    return saved ? JSON.parse(saved) : { damage: 0, reloadSpeed: 0, ammoCapacity: 0 };
  });

  const upgradedGun = {
    ...currentGun,
    maxAmmo: currentGun.maxAmmo + upgrades.ammoCapacity * 2,
    reloadTime: Math.max(500, currentGun.reloadTime - upgrades.reloadSpeed * 300),
    dartType: {
      ...currentDart,
      damage: currentDart.damage + currentGun.dartType.damage + upgrades.damage * 5
    }
  };

  useEffect(() => {
    setAmmo(currentGun.maxAmmo + upgrades.ammoCapacity * 2);
  }, [currentGun, upgrades.ammoCapacity]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const targetIdCounter = useRef(0);
  const dartIdCounter = useRef(0);
  const hitEffectIdCounter = useRef(0);
  const pointerDownPos = useRef({ x: 0, y: 0 });

  // Parallax values for main menu
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  
  const cursorX = useMotionValue(window.innerWidth / 2);
  const cursorY = useMotionValue(window.innerHeight / 2);
  const cursorSpringX = useSpring(cursorX, { stiffness: 800, damping: 40 });
  const cursorSpringY = useSpring(cursorY, { stiffness: 800, damping: 40 });
  
  const velocityX = useVelocity(cursorSpringX);
  const velocityY = useVelocity(cursorSpringY);
  const movement = useTransform([velocityX, velocityY], ([vx, vy]: number[]) => Math.sqrt(vx * vx + vy * vy));
  const crosshairScale = useTransform(movement, [0, 1000, 5000], [1, 1.5, 2]);

  const bgX = useTransform(springX, [-1, 1], ['-2%', '2%']);
  const bgY = useTransform(springY, [-1, 1], ['-2%', '2%']);
  const titleX = useTransform(springX, [-1, 1], ['-15px', '15px']);
  const titleY = useTransform(springY, [-1, 1], ['-15px', '15px']);
  const particleX = useTransform(springX, [-1, 1], ['-5%', '5%']);
  const particleY = useTransform(springY, [-1, 1], ['-5%', '5%']);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    
    if (gameState !== 'menu') return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 2;
    const y = (e.clientY / innerHeight - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  }, [gameState, mouseX, mouseY, cursorX, cursorY]);

  useEffect(() => {
    localStorage.setItem('nerf_credits', credits.toString());
    localStorage.setItem('nerf_unlocked', JSON.stringify(unlockedGuns));
    localStorage.setItem('nerf_unlocked_darts', JSON.stringify(unlockedDarts));
    localStorage.setItem('nerf_upgrades', JSON.stringify(upgrades));
  }, [credits, unlockedGuns, unlockedDarts, upgrades]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnectionStatus('connected');
      setRoomError(null);
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on("connect_error", () => {
      setConnectionStatus('error');
    });

    newSocket.on("room-error", (error: string) => {
      setRoomError(error);
    });

    newSocket.on("room-state", (state) => {
      setMultiplayerState(state);
      if (state.gameState === 'playing' && gameState !== 'playing') {
        startGame('multiplayer');
        setIsMultiplayerWaiting(false);
      }
      // Mirror server's authoritative target list whenever room-state arrives in MP.
      if (gameModeRef.current === 'multiplayer' && Array.isArray(state.targets)) {
        setTargets(state.targets.map((t: any) => ({
          id: t.id,
          type: t.type,
          x: t.x,
          y: t.y,
          createdAt: t.createdAt,
          lifespan: t.lifespan,
          hp: t.hp,
          maxHp: t.maxHp,
          points: t.points,
          scale: t.scale,
        })));
      }
    });

    newSocket.on("game-start", () => {
      startGame('multiplayer');
      setIsMultiplayerWaiting(false);
    });

    newSocket.on("new-target", (target: TargetData) => {
      setTargets(prev => {
        if (prev.some(t => t.id === target.id)) return prev;
        return [...prev, target];
      });
    });

    newSocket.on("target-update", ({ id, hp }: { id: string; hp: number }) => {
      setTargets(prev => prev.map(t => t.id === id ? { ...t, hp } : t));
    });

    newSocket.on("target-expired", ({ id }: { id: string }) => {
      setTargets(prev => prev.filter(t => t.id !== id));
    });

    newSocket.on("target-destroyed", (payload: any) => {
      const targetId = payload?.id ?? payload?.targetId;
      setTargets(prev => prev.filter(t => t.id !== targetId));
    });

    newSocket.on("fire-result", (result: any) => {
      if (result?.clientFireId) {
        pendingFireResults.current.set(result.clientFireId, result);
        // Auto-evict to avoid leaks
        setTimeout(() => pendingFireResults.current.delete(result.clientFireId), 4000);
      }
    });

    newSocket.on("wave-update", ({ waveIndex }: { waveIndex: number; name: string }) => {
      setWave(waveIndex + 1);
    });

    newSocket.on("game-over", () => {
      // Server has ended the match; client's local timer will also reach 0.
      // The existing game-over effect will pick this up via timeLeft.
    });

    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("connect_error");
      newSocket.off("room-error");
      newSocket.off("room-state");
      newSocket.off("game-start");
      newSocket.off("new-target");
      newSocket.off("target-update");
      newSocket.off("target-expired");
      newSocket.off("target-destroyed");
      newSocket.off("fire-result");
      newSocket.off("wave-update");
      newSocket.off("game-over");
      newSocket.disconnect();
    };
  }, []);

  // Keep a ref to gameMode so socket listeners (registered once) can branch correctly.
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  // Keep targetsRef in sync so fire() setTimeout closures always see current targets.
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  // Sync local score from authoritative server state during multiplayer.
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket || !multiplayerState?.players) return;
    const me = multiplayerState.players[socket.id];
    if (me && typeof me.score === 'number') {
      setScore(me.score);
    }
  }, [multiplayerState, gameMode, socket]);

  // Notify server when the player swaps weapons during a multiplayer match.
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket) return;
    socket.emit('weapon-switch', { roomId, weaponId: currentGun.id });
  }, [currentGun.id, gameMode, socket, roomId]);

  // Notify server when the player begins a reload during a multiplayer match.
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !socket) return;
    if (isReloading) {
      socket.emit('reload', { roomId });
    }
  }, [isReloading, gameMode, socket, roomId]);

  // Vibrate helper — respects haptics setting
  const vibrate = (pattern: number | number[]) => {
    if (!uiSettings.hapticsEnabled) return;
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const buyGun = (gun: GunType) => {
    if (credits >= gun.unlockCost && !unlockedGuns.includes(gun.id)) {
      setCredits(prev => prev - gun.unlockCost);
      setUnlockedGuns(prev => [...prev, gun.id]);
      setCurrentGun(gun);
      setAmmo(gun.maxAmmo);
      vibrate([50, 100, 50]);
    }
  };

  const buyDart = (dart: DartType) => {
    if (credits >= dart.unlockCost && !unlockedDarts.includes(dart.id)) {
      setCredits(prev => prev - dart.unlockCost);
      setUnlockedDarts(prev => [...prev, dart.id]);
      setCurrentDart(dart);
      vibrate([50, 100, 50]);
    }
  };

  const startGame = (mode: GameMode = gameMode) => {
    // Pick the arena first so the director can bias spawns to match the
    // arena's signature target mix from wave 1.
    const pickedArena = ARENAS[Math.floor(Math.random() * ARENAS.length)];
    directorRef.current.startMatch(mode, pickedArena.id);
    setGameMode(mode);
    setGameState('playing');
    setShowCountdown(true);
    setScore(0);
    setTimeLeft(mode === 'classic' || mode === 'multiplayer' ? 60 : mode === 'timeAttack' ? 30 : 0);
    setAmmo(currentGun.maxAmmo);
    setTargets([]);
    setDarts([]);
    setCombo(0);
    setLives(mode === 'hardcore' ? 1 : 5);
    setTargetsHit(0);
    setTotalShots(0);
    setMaxCombo(0);
    setWeakPointHits(0);
    setShotsFiredPerWeapon({});
    setEarnedCredits(0);
    setActiveBuffs({ damage: 0, rapidFire: 0, shield: 0 });
    setWave(1);
    setMaxWave(directorRef.current.getMaxWaves());
    setCurrentArena(pickedArena);
  };

  const [isADS, setIsADS] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [pointerSway, setPointerSway] = useState({ x: 0, y: 0 });
  const [breathSway, setBreathSway] = useState({ x: 0, y: 0 });
  const [recoilBuildup, setRecoilBuildup] = useState(0);
  const recoilRecoveryRef = useRef<number | null>(null);

  const [combatTexts, setCombatTexts] = useState<CombatTextData[]>([]);
  const [tracers, setTracers] = useState<{id: string, x: number, y: number}[]>([]);
  const tracerIdCounter = useRef(0);

  // Sound effects (Mocked for visual only currently, but can add realistic audio here)

  // Weapon Sway & Breath
  useEffect(() => {
    let frame: number;
    const updateSway = (time: number) => {
      if (gameState === 'playing') {
        const bx = Math.sin(time / 1500) * (isADS ? 0.05 : 0.2);
        const by = Math.cos(time / 1200) * (isADS ? 0.08 : 0.3);
        setBreathSway({ x: bx, y: by });
      }
      frame = requestAnimationFrame(updateSway);
    };
    frame = requestAnimationFrame(updateSway);
    return () => cancelAnimationFrame(frame);
  }, [gameState, isADS]);

  // Recoil Recovery
  useEffect(() => {
    if (!isFiring && recoilBuildup > 0) {
      const interval = setInterval(() => {
        setRecoilBuildup(prev => Math.max(0, prev - 0.1));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isFiring, recoilBuildup]);

  // Low-ammo warning — one beep per threshold crossing, not per shot
  const prevAmmoRef = useRef(ammo);
  useEffect(() => {
    const wasOk = prevAmmoRef.current > 2;
    prevAmmoRef.current = ammo;
    if (gameState !== 'playing' || !wasOk || ammo > 2 || ammo <= 0) return;
    sounds.playWarningBeep();
    vibrate(HAPTIC.LOW_AMMO);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ammo, gameState]);

  // Keyboard weapon switching
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 1-9 for weapon switching
      const num = parseInt(e.key);
      if (!isNaN(num) && num > 0 && num <= unlockedGuns.length) {
        const gunIdToSwitch = unlockedGuns[num - 1];
        const newGun = Object.values(GUNS).find(g => g.id === gunIdToSwitch);
        if (newGun && newGun.id !== currentGun.id) {
          setCurrentGun(newGun);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (unlockedGuns.length <= 1) return;
      const currentIndex = unlockedGuns.indexOf(currentGun.id);
      let nextIndex = currentIndex;
      if (e.deltaY > 0) {
        // Scroll down -> next weapon
        nextIndex = (currentIndex + 1) % unlockedGuns.length;
      } else if (e.deltaY < 0) {
        // Scroll up -> prev weapon
        nextIndex = (currentIndex - 1 + unlockedGuns.length) % unlockedGuns.length;
      }
      
      if (currentIndex !== nextIndex) {
        const newGun = Object.values(GUNS).find(g => g.id === unlockedGuns[nextIndex]);
        if (newGun) {
          setCurrentGun(newGun);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [gameState, unlockedGuns, currentGun.id]);

  const directorRef = useRef(new GameplayDirector());

  // Game Loop for spawning and removing targets
  useEffect(() => {
    if (gameState !== 'playing' || showCountdown) return;

    const director = directorRef.current;
    
    const spawnInterval = setInterval(() => {
      // Multiplayer is fully server-authoritative; skip client-side spawning.
      if (gameMode === 'multiplayer') return;

      setTargets(prev => {
        if (prev.length >= director.getWaveConfig().maxConcurrent) return prev;

        const newSpawns = director.generateSpawn(prev.length, currentGun.fireMode);
        if (newSpawns.length === 0) return prev;

        return [...prev, ...newSpawns];
      });
    }, director.getWaveConfig().spawnRateMs);

    const cleanupInterval = setInterval(() => {
      // Server expires targets in multiplayer; client just renders.
      if (gameMode === 'multiplayer') return;
      const now = Date.now();
      setTargets(prev => {
        let shouldReturnPrev = true;
        
        let newActive = prev.filter(t => now - t.createdAt < t.lifespan).map(t => {
          if (t.type === 'jammer') {
            // Jammers distort the screen more while alive
            shouldReturnPrev = false;
            setJammingIntensity(prevJam => Math.min(10, prevJam + 0.1));
          }

          if (t.type === 'hostile') {
            if (!t.nextFireTime) {
              shouldReturnPrev = false;
              return { ...t, nextFireTime: now + 1500 + Math.random() * 2000 };
            }
            if (now >= t.nextFireTime) {
              shouldReturnPrev = false;
              // Visual Fire Back
              const projId = `enemy-dart-${hitEffectIdCounter.current++}`;
              setEnemyDarts(prev => [...prev, {
                id: projId,
                x: t.x,
                y: t.y,
                targetX: 50, // Towards player center
                targetY: 90,
                createdAt: now,
                duration: 2000
              }]);
              
              sounds.playShot();
              return { ...t, nextFireTime: now + 2000 + Math.random() * 2000 };
            }
          } else if (t.type === 'drone') {
            if (!t.nextFireTime) {
              shouldReturnPrev = false;
              return { ...t, nextFireTime: now + 500 };
            }
            if (now >= t.nextFireTime) {
              shouldReturnPrev = false;
              const projId = `enemy-dart-${hitEffectIdCounter.current++}`;
              setEnemyDarts(prev => [...prev, {
                id: projId,
                x: t.x,
                y: t.y,
                targetX: 50 + (Math.random() * 20 - 10), // Area aim
                targetY: 90,
                createdAt: now,
                duration: 1500
              }]);
              return { ...t, nextFireTime: now + 1000 + Math.random() * 1000 };
            }
          } else if (t.type === 'reflector') {
            // Cycle reflector stance
            if (!t.nextFireTime) {
              shouldReturnPrev = false;
              return { ...t, nextFireTime: now + 2000 };
            }
            if (now >= t.nextFireTime) {
              shouldReturnPrev = false;
              // Stance flip: nextFireTime being in the future indicates REFLECTING mode
              // We'll use scale or something else to visual this if needed, but for now just the timer
              return { ...t, nextFireTime: now + 3000 }; 
            }
          }
          return t;
        });

        // Decay jamming intensity if no jammers or naturally over time
        const hasJammer = newActive.some(t => t.type === 'jammer');
        if (!hasJammer) {
          setJammingIntensity(prevJam => Math.max(0, prevJam - 0.5));
        }

        const expired = prev.filter(t => now - t.createdAt >= t.lifespan);
        
        if (expired.length > 0 && gameMode === 'endless') {
          setTimeout(() => {
            takeDamage(expired.length);
          }, 0);
        }
        
        if (expired.length === 0 && shouldReturnPrev) {
          return prev;
        }

        return newActive;
      });
    }, 100);

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (gameMode === 'classic' || gameMode === 'timeAttack' || gameMode === 'multiplayer') {
          return prev > 0 ? prev - 1 : 0;
        } else {
          return prev + 1;
        }
      });
      
      // Wave Progression logic (solo only; server drives waves in multiplayer).
      if (gameMode !== 'multiplayer') {
        setScore(currentScore => {
          setTargetsHit(hits => {
            setTotalShots(shots => {
               const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;
               if (director.checkWaveCompletion(currentScore, accuracy)) {
                  const nextId = director.getWaveIndex() + 1;
                  director.startWave(nextId, currentScore);
                  setWave(nextId + 1);
               }
               return shots;
            });
            return hits;
          });
          return currentScore;
        });
      }

    }, 1000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
      clearInterval(timerInterval);
    };
  }, [gameState, gameMode, showCountdown, multiplayerState, socket]);

  // Game Over Condition Check
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    let isGameOver = false;
    if ((gameMode === 'classic' || gameMode === 'timeAttack' || gameMode === 'multiplayer') && timeLeft <= 0) {
      isGameOver = true;
    } else if (gameMode === 'endless' && lives <= 0) {
      isGameOver = true;
    } else if (gameMode === 'targetRush' && targetsHit >= targetGoal) {
      isGameOver = true;
    }

    if (isGameOver) {
      setGameState('gameover');
      let earned = Math.floor(score / 10);
      if (gameMode === 'targetRush' && targetsHit >= targetGoal) {
         const timeBonus = Math.max(0, (120 - timeLeft) * 10);
         setScore(s => s + timeBonus);
         earned += Math.floor(timeBonus / 10);
      }
      setEarnedCredits(earned);
      setCredits(c => c + earned);
    }
  }, [timeLeft, lives, targetsHit, gameMode, gameState, score, targetGoal]);

  const reload = useCallback(() => {
    if (isReloading || ammo === currentGun.maxAmmo) return;
    
    setIsReloading(true);
    vibrate(HAPTIC.RELOAD_START);
    sounds.playReloadStart(currentGun.id);
    
    const reloadDuration = Date.now() < activeBuffs.rapidFire ? currentGun.reloadTime * 0.3 : currentGun.reloadTime;
    
    setTimeout(() => {
      setAmmo(currentGun.maxAmmo);
      setIsReloading(false);
      vibrate(HAPTIC.RELOAD_FINISH);
      sounds.playReloadFinish(currentGun.id);
    }, reloadDuration);
  }, [isReloading, ammo, currentGun, activeBuffs]);

  const handleShoot = useCallback((e?: React.PointerEvent | { clientX: number, clientY: number }) => {
    if (gameState !== 'playing' || isReloading || showCountdown) return;

    if (ammo <= 0) {
      setIsFiring(false);
      sounds.playEmptyClick();
      vibrate(HAPTIC.EMPTY);
      reload();
      return;
    }

    const fireMultiplayer = (pos: { x: number, y: number }) => {
      if (!socket || !gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();

      // Update local UI state immediately (optimistic) — server is the source of truth for hits/score.
      setRecoilBuildup(prev => Math.min(10, prev + 1));
      setTotalShots(prev => prev + 1);
      setShotsFiredPerWeapon(prev => ({ ...prev, [currentGun.id]: (prev[currentGun.id] || 0) + 1 }));
      sounds.playFire(currentGun.id);
      vibrate(hapticForGun(currentGun.id));
      setAmmo(prev => Math.max(0, prev - 1));
      setIsShooting(true);

      const recoilScale = isADS ? 0.3 : 1;
      setShakeIntensity((upgradedGun.recoil + Math.min(10, recoilBuildup) * 2) * recoilScale);

      const tid = `tracer-${tracerIdCounter.current++}`;
      setTracers(curr => [...curr, { id: tid, x: pos.x, y: pos.y }]);
      setTimeout(() => {
        setShakeIntensity(0);
        setIsShooting(false);
        setTracers(curr => curr.filter(t => t.id !== tid));
      }, 120);

      let startX = rect.width / 2;
      let startY = rect.height;
      if (muzzleRef.current) {
        const mRect = muzzleRef.current.getBoundingClientRect();
        startX = mRect.left + mRect.width / 2 - rect.left;
        startY = mRect.top + mRect.height / 2 - rect.top;
      }

      const baseAccuracy = upgradedGun.accuracy;
      const adsBonus = isADS ? 0.1 : 0;
      const recoilPenalty = recoilBuildup * 0.05;
      const currentAccuracy = Math.max(0.1, Math.min(0.99, baseAccuracy + adsBonus - recoilPenalty));
      const spread = (1 - currentAccuracy) * 200;
      const endX = (pos.x - rect.left) + (Math.random() * spread - spread / 2);
      const endY = (pos.y - rect.top) + (Math.random() * spread - spread / 2);

      const newDart: DartData = {
        id: `dart-${dartIdCounter.current++}`,
        startX, startY, endX, endY,
        dartType: upgradedGun.dartType,
      };
      setDarts(prev => [...prev, newDart]);

      const aimXPct = (endX / rect.width) * 100;
      const aimYPct = (endY / rect.height) * 100;
      const clientFireId = `cfid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      socket.emit('fire', {
        roomId,
        weaponId: currentGun.id,
        aimX: aimXPct,
        aimY: aimYPct,
        clientFireId,
        ts: Date.now(),
      });

      const travelMs = upgradedGun.dartType.speed;
      setTimeout(() => {
        const result = pendingFireResults.current.get(clientFireId);
        pendingFireResults.current.delete(clientFireId);

        if (!result || !result.accepted || !result.hit) {
          // Miss visual (also covers rate-limited / reloading drops)
          const effectId = `miss-${hitEffectIdCounter.current++}`;
          const muzzle = getMuzzleOrigin();
          setHitEffects(curr => [...curr, { id: effectId, x: aimXPct, y: aimYPct, color: upgradedGun.dartType.color, isMiss: true, originX: muzzle.x, originY: muzzle.y }]);
          setTimeout(() => setHitEffects(curr => curr.filter(h => h.id !== effectId)), 600);
          setCombo(0);
          return;
        }

        // Hit visuals driven by authoritative result.
        const isCrit = !!result.isCrit;
        const isDestroyed = !!result.destroyed;
        const isExplosion = isDestroyed && upgradedGun.dartType.shape === 'rocket';
        const damage = Number(result.damage ?? 0);
        const serverQuality: 'weak_point' | 'center' | 'body' | 'armor' | 'graze' | undefined = result.quality;

        const effectId = `hit-${hitEffectIdCounter.current++}`;
        setHitEffects(curr => [...curr, { id: effectId, x: aimXPct, y: aimYPct, color: currentGun.dartType.color, isDestroy: isDestroyed, isExplosion, quality: serverQuality }]);
        setHitMarkerTime(Date.now());
        if (isDestroyed) setHitMarkerType('kill');
        else if (serverQuality === 'armor') setHitMarkerType('armor');
        else if (isCrit || serverQuality === 'weak_point' || serverQuality === 'center') setHitMarkerType('crit');
        else setHitMarkerType('normal');
        setTimeout(() => setHitEffects(curr => curr.filter(h => h.id !== effectId)), isDestroyed || isExplosion ? 800 : 400);

        // Screen impact feedback — mirrors the singleplayer path so multiplayer
        // hits feel equally weighty.
        const isCritHit = isCrit || serverQuality === 'weak_point' || serverQuality === 'center';
        if (isExplosion) {
          setShakeIntensity(38);
          setFlash(true);
          setTimeout(() => setFlash(false), 100);
          setTimeout(() => setShakeIntensity(0), 500);
          triggerHitPause('kill');
        } else if (isDestroyed) {
          setShakeIntensity(18);
          setKillFlash(true);
          setTimeout(() => setKillFlash(false), 130);
          setTimeout(() => setShakeIntensity(0), 240);
          triggerHitPause('kill');
        } else if (isCritHit) {
          setShakeIntensity(10);
          setTimeout(() => setShakeIntensity(0), 130);
          triggerHitPause('crit');
        } else if (serverQuality === 'armor') {
          setShakeIntensity(3);
          setTimeout(() => setShakeIntensity(0), 80);
        } else {
          setShakeIntensity(5);
          setTimeout(() => setShakeIntensity(0), 100);
        }

        if (damage > 0) {
          const textId = `txt-${hitEffectIdCounter.current++}`;
          setCombatTexts(curr => [...curr, {
            id: textId,
            x: aimXPct + (Math.random() * 4 - 2),
            y: aimYPct - 5,
            text: `-${Math.round(damage)}`,
            color: isCrit ? '#facc15' : '#ffffff',
            isCritical: isCrit,
          }]);
          setTimeout(() => setCombatTexts(curr => curr.filter(t => t.id !== textId)), 1000);
        }

        if (isDestroyed) {
          vibrate([30, 50, 30]);
          setTargetsHit(th => th + 1);
          const points = Number(result.points ?? 0);
          if (points > 0) {
            const now = Date.now();
            let newCombo = combo;
            if (now - lastHitTime < 2000) newCombo += 1;
            else newCombo = 1;
            setCombo(newCombo);
            setMaxCombo(prev => Math.max(prev, newCombo));
            setLastHitTime(now);

            const cTextId = `pts-${hitEffectIdCounter.current++}`;
            setCombatTexts(prevText => [...prevText, {
              id: cTextId,
              x: typeof result.hitX === 'number' ? result.hitX : aimXPct,
              y: (typeof result.hitY === 'number' ? result.hitY : aimYPct) - 20,
              text: isCrit ? `CRIT! +${points}` : `+${points}`,
              color: isCrit ? '#facc15' : '#ffffff',
              isCritical: isCrit,
            }]);
            setTimeout(() => setCombatTexts(curr => curr.filter(t => t.id !== cTextId)), 1000);
          }
        } else {
          vibrate(20);
        }
      }, travelMs);
    };

    if (gameMode === 'multiplayer' && socket) {
      const targetPos = e ? { x: e.clientX, y: e.clientY } : pointerDownPos.current;
      if (upgradedGun.fireMode === 'burst') {
        let burstCount = 0;
        const burstInterval = setInterval(() => {
          fireMultiplayer(pointerDownPos.current);
          burstCount++;
          if (burstCount >= 3) clearInterval(burstInterval);
        }, upgradedGun.fireRate / 2);
      } else {
        fireMultiplayer(targetPos);
      }
      return;
    }

    const fire = (pos: { x: number, y: number }) => {
      setRecoilBuildup(prev => Math.min(10, prev + 1)); // Max recoil cap
      setTotalShots(prev => prev + 1);
      setShotsFiredPerWeapon(prev => ({ ...prev, [currentGun.id]: (prev[currentGun.id] || 0) + 1 }));
      
      sounds.playFire(currentGun.id);
      vibrate(hapticForGun(currentGun.id));

      setAmmo(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
      setIsShooting(true);
      
      const recoilScale = isADS ? 0.3 : 1;
      setShakeIntensity((upgradedGun.recoil + Math.min(10, recoilBuildup) * 2) * recoilScale);

      // Add Tracer
      const tid = `tracer-${tracerIdCounter.current++}`;
      setTracers(curr => [...curr, { id: tid, x: pos.x, y: pos.y }]);
      
      setTimeout(() => {
        setShakeIntensity(0);
        setIsShooting(false);
        setTracers(curr => curr.filter(t => t.id !== tid));
      }, 120);

      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        let startX = rect.width / 2;
        let startY = rect.height;

        if (muzzleRef.current) {
          const mRect = muzzleRef.current.getBoundingClientRect();
          startX = mRect.left + mRect.width / 2 - rect.left;
          startY = mRect.top + mRect.height / 2 - rect.top;
        }
        
        // Add spread based on accuracy and recoil buildup
        const baseAccuracy = upgradedGun.accuracy;
        const adsBonus = isADS ? 0.1 : 0;
        const recoilPenalty = recoilBuildup * 0.05;
        const currentAccuracy = Math.max(0.1, Math.min(0.99, baseAccuracy + adsBonus - recoilPenalty));
        const spread = (1 - currentAccuracy) * 200;
        
        const endX = (pos.x - rect.left) + (Math.random() * spread - spread / 2);
        const endY = (pos.y - rect.top) + (Math.random() * spread - spread / 2);

        const newDart: DartData = {
          id: `dart-${dartIdCounter.current++}`,
          startX,
          startY,
          endX,
          endY,
          dartType: upgradedGun.dartType
        };
        setDarts(prev => [...prev, newDart]);

        // Hit Resolver
        const travelMs = upgradedGun.dartType.speed;
        setTimeout(() => {
          const hitResult = resolveShotHit(endX, endY, rect.width, rect.height, targetsRef.current);

          if (hitResult) {
            handleTargetHit(hitResult.targetId, (endX / rect.width) * 100, (endY / rect.height) * 100, hitResult.quality);
          } else {
            sounds.playPlasticBounce();
            // Miss Effect — pass muzzle origin so debris sprays away from the
            // shot trajectory for directional consistency.
            const effectId = `miss-${hitEffectIdCounter.current++}`;
            const muzzle = getMuzzleOrigin();
            setHitEffects(curr => [...curr, {
              id: effectId,
              x: (endX / rect.width) * 100,
              y: (endY / rect.height) * 100,
              color: upgradedGun.dartType.color,
              isMiss: true,
              originX: muzzle.x,
              originY: muzzle.y,
            }]);
            setTimeout(() => {
               setHitEffects(curr => curr.filter(h => h.id !== effectId));
            }, 600);

            setCombo(0);

            setGameMode(currMode => {
               if (currMode === 'endless') {
                 takeDamage(1);
               }
               return currMode;
            });
          }
        }, travelMs);
      }
    };

    const targetPos = e ? { x: e.clientX, y: e.clientY } : pointerDownPos.current;

    if (upgradedGun.fireMode === 'semi') {
      fire(targetPos);
    } else if (upgradedGun.fireMode === 'burst') {
      let burstCount = 0;
      const burstInterval = setInterval(() => {
        fire(pointerDownPos.current); // Use live position for burst too
        burstCount++;
        if (burstCount >= 3) clearInterval(burstInterval);
      }, upgradedGun.fireRate / 2); // Burst is faster than full auto interval usually
    } else if (upgradedGun.fireMode === 'auto') {
      fire(targetPos);
    }
  }, [gameState, isReloading, ammo, reload, upgradedGun, isADS, gameMode, socket, roomId, currentGun, combo, lastHitTime, recoilBuildup]);

  // Support for fully automatic firing
  const autoFireInterval = useRef<number | null>(null);

  useEffect(() => {
    if (gameState !== 'playing' || upgradedGun.fireMode !== 'auto' || !isFiring) {
      if (autoFireInterval.current) {
        clearInterval(autoFireInterval.current);
        autoFireInterval.current = null;
      }
      return;
    }

    const handleAutoFire = () => {
      if (isReloading || ammo <= 0) {
        setIsFiring(false);
        return;
      }
      handleShoot();
    };

    if (!autoFireInterval.current) {
      autoFireInterval.current = window.setInterval(handleAutoFire, upgradedGun.fireRate);
    }

    return () => {
      if (autoFireInterval.current) clearInterval(autoFireInterval.current);
    };
  }, [isFiring, upgradedGun, isReloading, ammo, gameState, handleShoot]);

  const handleTargetHit = useCallback((id: string, hitX: number, hitY: number, quality: string = 'normal') => {
    if (gameState !== 'playing' || isReloading || ammo <= 0) return;

    setTargets(prev => {
      const targetIndex = prev.findIndex(t => t.id === id);
      if (targetIndex === -1) return prev;

      const target = prev[targetIndex];
      let damage = upgradedGun.dartType.damage;
      let isCrit = false;
      
      if (Date.now() < activeBuffs.damage) damage *= 2;

      // Hit quality modifiers
      if (quality === 'center' || quality === 'weak_point') {
        damage *= 1.5;
        isCrit = true;
        if (quality === 'weak_point') setWeakPointHits(w => w + 1);
      } else if (quality === 'graze') {
        damage *= 0.5;
      } else if (quality === 'armor') {
        damage *= 0.3;
      }

      // Dart-specific effectiveness
      if (target.type === 'heavy_armor') {
        if (upgradedGun.dartType.shape === 'dart' || upgradedGun.dartType.shape === 'vortex') {
          damage = Math.max(1, damage * 0.2); // Light munitions are ineffective
        } else if (upgradedGun.dartType.shape === 'rocket') {
          damage = damage * 2.5; // Rockets tear through heavy armor
        }
      }

      if (target.type === 'armored') {
        if (upgradedGun.dartType.shape === 'dart') {
          damage = Math.max(1, damage * 0.5);
        } else if (upgradedGun.dartType.shape === 'mega' || upgradedGun.dartType.shape === 'rocket') {
          damage = damage * 1.5;
        }
      }

      if (target.type === 'reflector') {
        const isReflecting = target.nextFireTime && target.nextFireTime > Date.now();
        if (isReflecting) {
           // Reflect damage back
           setTimeout(() => takeDamage(1), 0);
           const textId = `txt-${hitEffectIdCounter.current++}`;
           setCombatTexts(curr => [...curr, { id: textId, x: hitX, y: hitY - 5, text: `REFLECTED`, color: '#f43f5e' }]);
           setTimeout(() => setCombatTexts(curr => curr.filter(t => t.id !== textId)), 1000);
           return prev; // No damage to target
        }
      }

      if (target.type === 'jammer') {
        setJammingIntensity(prev => Math.min(20, prev + 5));
      }

      const newHp = target.hp - damage;
      const isDestroyed = newHp <= 0;

      const isExplosion = (target.type === 'exploding' && isDestroyed) || upgradedGun.dartType.shape === 'rocket';

      // Record damage text
      if (damage > 0) {
        const textId = `txt-${hitEffectIdCounter.current++}`;
        const isCriticalHit = isCrit || Date.now() < activeBuffs.damage;
        setCombatTexts(curr => [...curr, { id: textId, x: hitX + (Math.random()*4 - 2), y: hitY - 5, text: `-${Math.round(damage)}`, color: isCriticalHit ? '#facc15' : '#ffffff', isCritical: isCriticalHit }]);
        setTimeout(() => setCombatTexts(curr => curr.filter(t => t.id !== textId)), 1000);
      } else if (damage === 0 && target.type === 'shielded') {
        const textId = `txt-${hitEffectIdCounter.current++}`;
        setCombatTexts(curr => [...curr, { id: textId, x: hitX, y: hitY - 5, text: `BLOCKED`, color: '#38bdf8' }]);
        setTimeout(() => setCombatTexts(curr => curr.filter(t => t.id !== textId)), 1000);
      }

      // Spawn hit effect
      const effectId = `hit-${hitEffectIdCounter.current++}`;
      const effectQuality = (quality === 'graze' || quality === 'armor' || quality === 'body' || quality === 'center' || quality === 'weak_point')
        ? quality
        : undefined;
      setHitEffects(curr => [...curr, { id: effectId, x: hitX, y: hitY, color: currentGun.dartType.color, isDestroy: isDestroyed, isExplosion, quality: effectQuality }]);
      setHitMarkerTime(Date.now());
      if (isDestroyed) setHitMarkerType('kill');
      else if (isCrit) setHitMarkerType('crit');
      else if (quality === 'armor') setHitMarkerType('armor');
      else setHitMarkerType('normal');
      
      // Hit feedback — screen impulse scales with hit quality.
      // Tiers: minimal (normal) → moderate (heavy/crit) → sharp pulse (kill / explosion).
      if (isExplosion) {
        setShakeIntensity(38);
        setFlash(true);
        setTimeout(() => setFlash(false), 100);
        setTimeout(() => setShakeIntensity(0), 500);
        triggerHitPause('kill');
      } else if (isDestroyed) {
        // Kill confirmation: sharp pulse + orange kill flash + hit pause
        setShakeIntensity(18);
        setKillFlash(true);
        setTimeout(() => setKillFlash(false), 130);
        setTimeout(() => setShakeIntensity(0), 240);
        triggerHitPause('kill');
      } else if (quality === 'weak_point' || quality === 'center' || isCrit) {
        // Critical / weak-point hit: moderate shake + brief crit hit pause
        setShakeIntensity(10);
        setTimeout(() => setShakeIntensity(0), 130);
        triggerHitPause('crit');
      } else if (quality === 'armor') {
        // Armor block: tight, dry impulse — feels like a deflection
        setShakeIntensity(3);
        setTimeout(() => setShakeIntensity(0), 80);
      } else {
        // Normal body hit: minimal kick
        setShakeIntensity(5);
        setTimeout(() => setShakeIntensity(0), 100);
      }
      
      setTimeout(() => {
        setHitEffects(curr => curr.filter(h => h.id !== effectId));
      }, isDestroyed || isExplosion ? 800 : 400);

      if (newHp > 0) {
        // Target survives
        const newTargets = [...prev];
        let updatedTarget = { ...target, hp: newHp };
        
        if (target.type === 'teleporting') {
          updatedTarget.x = 15 + Math.random() * 70;
          updatedTarget.y = 15 + Math.random() * 50;
        }
        
        newTargets[targetIndex] = updatedTarget;
        sounds.playHit(quality);
        vibrate(HAPTIC.HIT);
        return newTargets;
      }

      // Target destroyed
      sounds.playTargetBreak();
      vibrate(HAPTIC.DESTROY);
      
      // Heavy shake on destruction ONLY for big entities
      if (target.type === 'heavy_armor' || target.type === 'exploding') {
        setShakeIntensity(10);
        setTimeout(() => setShakeIntensity(0), 300);
      }
      
      // Handle powerups
      if (target.type.startsWith('powerup_')) {
        // Power-up pickup visual
        const effectId = `pwr-${hitEffectIdCounter.current++}`;
        const pwrColor = target.type === 'powerup_damage' ? '#ef4444' : target.type === 'powerup_rapid' ? '#facc15' : '#38bdf8';
        setHitEffects(curr => [...curr, { id: effectId, x: hitX, y: hitY, color: pwrColor, isDestroy: true }]);
        setTimeout(() => setHitEffects(curr => curr.filter(h => h.id !== effectId)), 1000);
        
        vibrate(HAPTIC.POWERUP);

        if (target.type === 'powerup_damage') {
          setActiveBuffs(b => ({ ...b, damage: Date.now() + 10000 })); // 10 seconds
        } else if (target.type === 'powerup_rapid') {
          setActiveBuffs(b => ({ ...b, rapidFire: Date.now() + 10000 }));
        } else if (target.type === 'powerup_shield') {
          setActiveBuffs(b => ({ ...b, shield: Date.now() + 15000 }));
        }
      }
      
      // Handle combo & score
      const now = Date.now();
      
      // Decoy spawns fake targets (visual only or minor distraction)
      if (target.type === 'decoy' && isDestroyed) {
        for (let i = 0; i < 3; i++) {
           const decoyId = `decoy-${hitEffectIdCounter.current++}`;
           const decoy: TargetData = {
             id: decoyId,
             x: Math.max(5, Math.min(95, target.x + (Math.random() * 20 - 10))),
             y: Math.max(5, Math.min(95, target.y + (Math.random() * 20 - 10))),
             type: 'decoy',
             createdAt: Date.now(),
             lifespan: 1500,
             points: 5,
             hp: 1,
             maxHp: 1,
             scale: 0.8
           };
           setTargets(curr => [...curr, decoy]);
        }
      }
      let newCombo = combo;
      if (now - lastHitTime < 2000) {
        newCombo += 1;
      } else {
        newCombo = 1;
      }
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setLastHitTime(now);
      
      vibrate(HAPTIC.DESTROY);
      
      const comboMultiplier = Math.min(newCombo, 5);
      const isCriticalHitForScore = target.type === 'erratic' || isCrit || Date.now() < activeBuffs.damage;
      const qualityScoreBonus = quality === 'weak_point' ? 2.0 : quality === 'center' ? 1.5 : quality === 'graze' ? 0.75 : 1.0;
      const totalPoints = Math.round(target.points * comboMultiplier * (isCriticalHitForScore ? 2 : 1) * qualityScoreBonus);
      
      setScore(s => s + totalPoints);

      // Add satisfying combat text
      setCombatTexts(prevText => [
        ...prevText,
        {
          id: Math.random().toString(),
          x: target.x,
          y: target.y - 20,
          text: isCriticalHitForScore ? `CRIT! ${totalPoints}` : `+${totalPoints}`,
          color: isCriticalHitForScore ? '#facc15' : '#ffffff',
          isCritical: isCriticalHitForScore
        }
      ]);

      if (newCombo > 0 && newCombo % 5 === 0) {
        setHitEffects(prev => [...prev, { id: Math.random().toString(), x: target.x, y: target.y, color: '#06b6d4', isDestroy: true }]);
        setCombatTexts(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            x: target.x,
            y: target.y - 50,
            text: `${newCombo} COMBO!`,
            color: '#06b6d4',
            isCritical: true
          }
        ]);
      }

      // In multiplayer the server is authoritative for hits; this code path
      // only runs in solo modes (handleShoot returns early for multiplayer).

      let targetsToKeep = prev.filter(t => t.id !== id);

      // Handle splitting
      if (target.type === 'splitting') {
        const mini1: TargetData = {
          id: `target-${targetIdCounter.current++}`,
          x: Math.max(5, target.x - 15 + Math.random() * 10),
          y: Math.max(5, target.y - 15 + Math.random() * 10),
          type: 'standard',
          createdAt: Date.now(),
          lifespan: 2500,
          points: 15,
          hp: 10,
          maxHp: 10,
          scale: 0.6
        };
        const mini2: TargetData = {
          id: `target-${targetIdCounter.current++}`,
          x: Math.min(95, target.x + 5 + Math.random() * 10),
          y: Math.min(95, target.y + 5 + Math.random() * 10),
          type: 'standard',
          createdAt: Date.now(),
          lifespan: 2500,
          points: 15,
          hp: 10,
          maxHp: 10,
          scale: 0.6
        };
        targetsToKeep.push(mini1, mini2);
      }

      // Handle explosions
      if (target.type === 'exploding' || currentGun.dartType.blastRadius > 0) {
        const blastRadius = Math.max(target.type === 'exploding' ? 25 : 0, currentGun.dartType.blastRadius);
        
        targetsToKeep = targetsToKeep.filter(t => {
          const dist = Math.hypot(t.x - target.x, t.y - target.y);
          if (dist <= blastRadius) {
            // Destroyed by blast
            setScore(s => s + (t.points * comboMultiplier));
            return false;
          }
          return true;
        });
        vibrate(HAPTIC.EXPLOSION);
      }

      const destroyedCount = prev.length - targetsToKeep.length;
      if (destroyedCount > 0) {
        setTargetsHit(th => th + destroyedCount);
        // Let the director know what targets were destroyed
        for (let i = 0; i < destroyedCount; i++) {
           directorRef.current.handleTargetDestroyed(target.type);
        }
      }

      return targetsToKeep;
    });
  }, [gameState, isReloading, ammo, combo, lastHitTime, currentGun, gameMode, activeBuffs]);

  const removeDart = useCallback((id: string) => {
    setDarts(prev => prev.filter(d => d.id !== id));
  }, []);

  const tiltX = useTransform(cursorX, [0, window.innerWidth], [5, -5]);
  const tiltY = useTransform(cursorY, [0, window.innerHeight], [-5, 5]);

  const warnings: string[] = [];
  if (jammingIntensity > 5) warnings.push("SIGNAL_JAMMED");
  if (targets.some(t => t.type === 'hostile' && t.nextFireTime && (t.nextFireTime - Date.now()) < 1000)) warnings.push("MISSILE_LOCK");
  if (targets.some(t => t.type === 'reflector' && t.nextFireTime && t.nextFireTime > Date.now())) warnings.push("REFLECTOR_ACTIVE");

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-[#050505] select-none touch-none film-grain"
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence>
        {!hasBooted && (
          <BootSequence onComplete={() => setHasBooted(true)} />
        )}
      </AnimatePresence>

      {/* Screen Flash — damage/explosion */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="absolute inset-0 z-[200] bg-white mix-blend-overlay pointer-events-none"
            style={{ filter: "blur(20px)" }}
          />
        )}
      </AnimatePresence>

      {/* Kill confirmation flash — vignette pulse + center pop ring + accent
          color, fades quickly. Used as a satisfying "kill confirmed" beat. */}
      <AnimatePresence>
        {killFlash && (
          <>
            <motion.div
              key="kill-vignette"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute inset-0 z-[199] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 28%, rgba(249,115,22,0.55) 100%)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Center pop pulse — quick scale-up + fade */}
            <motion.div
              key="kill-pulse"
              initial={{ opacity: 0.85, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 z-[199] pointer-events-none flex items-center justify-center"
            >
              <div
                className="w-[42vmin] h-[42vmin] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(249,115,22,0.12) 35%, rgba(255,255,255,0) 70%)',
                  boxShadow: '0 0 80px 20px rgba(249,115,22,0.35)',
                  mixBlendMode: 'screen',
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hit pause / micro time-dilation visual — saturate + contrast pulse +
          tiny zoom punch. Triggered on critical and kill hits. The actual
          pause duration is 50ms (crit) / 80ms (kill); the overlay bridges it
          with a freeze-frame look without halting the game loop. */}
      <AnimatePresence>
        {hitPause && (
          <motion.div
            key={`hp-${hitPause}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: hitPause === 'kill' ? 0.16 : 0.10, ease: 'easeOut' }}
            className="absolute inset-0 z-[198] pointer-events-none"
            style={{
              background: hitPause === 'kill'
                ? 'radial-gradient(ellipse at center, rgba(255,235,200,0.10) 0%, rgba(0,0,0,0) 60%)'
                : 'radial-gradient(ellipse at center, rgba(255,255,200,0.08) 0%, rgba(0,0,0,0) 60%)',
              backdropFilter: hitPause === 'kill' ? 'saturate(1.55) contrast(1.18)' : 'saturate(1.35) contrast(1.10)',
              WebkitBackdropFilter: hitPause === 'kill' ? 'saturate(1.55) contrast(1.18)' : 'saturate(1.35) contrast(1.10)',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>

      {/* Background Arena — fully layered CSS scene, no external URLs */}
      <motion.div className="absolute inset-0 scale-110"
           style={{
             filter: 'brightness(0.78) contrast(1.08)',
             x: bgX,
             y: bgY
           }}
      >
        <ArenaScene arenaId={currentArena.id} parallaxX={mouseX} parallaxY={mouseY} />
        <motion.div className="absolute inset-0" style={{ x: tiltX, y: tiltY }}>
           <DustParticles />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80 pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.8)_120%)] pointer-events-none z-10" />

      {gameState === 'menu' && (
        <>
          <MainMenu 
            gameMode={gameMode}
            setGameMode={setGameMode}
            roomId={roomId}
            setRoomId={setRoomId}
            socket={socket}
            connectionStatus={connectionStatus}
            setIsMultiplayerWaiting={setIsMultiplayerWaiting}
            startGame={startGame}
            setShowUpgradeMenu={setShowUpgradeMenu}
            credits={credits}
            unlockedGuns={unlockedGuns}
            currentGun={currentGun}
            setCurrentGun={setCurrentGun}
            buyGun={buyGun}
            unlockedDarts={unlockedDarts}
            currentDart={currentDart}
            setCurrentDart={setCurrentDart}
            buyDart={buyDart}
          />

          {showUpgradeMenu && (
            <UpgradeMenu 
              credits={credits} 
              upgrades={upgrades} 
              onUpgrade={handleUpgrade} 
              onClose={() => setShowUpgradeMenu(false)} 
              currentGun={upgradedGun}
              currentDart={currentDart}
            />
          )}
        </>
      )}

      {isMultiplayerWaiting && (
        <MultiplayerLobby 
          roomId={roomId}
          multiplayerState={multiplayerState}
          socket={socket}
          connectionStatus={connectionStatus}
          roomError={roomError}
          onLeave={() => {
            socket?.emit('leave-room', roomId);
            setIsMultiplayerWaiting(false);
            setRoomError(null);
          }}
          onReady={() => socket?.emit('player-ready', roomId)}
        />
      )}
      <AnimatePresence>
        {gameState === 'gameover' && (
          <ResultsOverlay 
            gameState={gameState}
            gameMode={gameMode}
            score={score}
            targetsHit={targetsHit}
            totalShots={totalShots}
            combo={combo}
            maxCombo={maxCombo}
            weakPointHits={weakPointHits}
            shotsFiredPerWeapon={shotsFiredPerWeapon}
            earnedCredits={earnedCredits}
            waveReached={gameMode !== 'multiplayer' ? wave : undefined}
            onRestart={() => startGame(gameMode)}
            onMenu={() => setGameState('menu')}
            multiplayerState={multiplayerState}
            socketId={socket?.id}
            isHost={multiplayerState?.players && Object.keys(multiplayerState.players)[0] === socket?.id}
            onRematch={() => {
              if (gameMode === 'multiplayer') {
                socket?.emit('return-to-lobby', roomId);
                setIsMultiplayerWaiting(true);
                setGameState('menu');
              } else {
                startGame(gameMode);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCountdown && <CountdownOverlay onComplete={() => setShowCountdown(false)} />}
      </AnimatePresence>

      {/* Game Area Wrapper for stable coordinates */}
      <div ref={gameAreaRef} className="absolute inset-0 cursor-none">
        
        {/* Render Satisfying Hit Markers e.g. crosshair pulse */}
        <AnimatePresence>
          {hitEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ scale: effect.isDestroy ? 0.5 : 1.5, opacity: 1 }}
              animate={{ scale: effect.isDestroy ? 3 : 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute pointer-events-none z-30"
              style={{ left: `${effect.x}%`, top: `${effect.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div 
                className={`w-12 h-12 rounded-full border-2 blur-sm`}
                style={{ borderColor: effect.color, boxShadow: `0 0 15px ${effect.color}` }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Combat Text Rendering Layer */}
        <AnimatePresence>
           {combatTexts.map(ct => (
             <motion.div
               key={ct.id}
               initial={{ opacity: 0, y: 0, scale: 0.5 }}
               animate={{ opacity: 1, y: -100, scale: ct.isCritical ? 1.5 : 1 }}
               exit={{ opacity: 0, scale: 0 }}
               transition={{ duration: 0.8, ease: "backOut" }}
               className="absolute pointer-events-none z-[60] font-black italic select-none"
               style={{ left: `${ct.x}%`, top: `${ct.y}%`, color: ct.color, transform: 'translateX(-50%)' }}
             >
               <span className={`text-2xl drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] ${ct.isCritical ? 'text-4xl' : ''}`}>
                 {ct.text}
               </span>
             </motion.div>
           ))}
        </AnimatePresence>

        {gameState === 'playing' && (
          <>
            <motion.div 
               className="absolute inset-0 z-0 pointer-events-none"
               style={{
                 rotateX: tiltY,
                 rotateY: tiltX,
                 perspective: '1000px'
               }}
            >
              <CyberGridBackground />
              <ParticleSystem />
              <ScanningLaser />
            </motion.div>
            
            <DamageIndicator direction={damageDirection} />
            <CRTOverlay />
            
            {/* Enemy Projectiles */}
            {enemyDarts.map(proj => (
              <EnemyProjectile 
                key={proj.id} 
                proj={proj} 
                onFinish={() => {
                  setEnemyDarts(prev => prev.filter(p => p.id !== proj.id));
                  takeDamage(1);
                }} 
              />
            ))}
            <div className="absolute top-1/4 right-1/4 opacity-50">
              <NerfReactor onClick={() => console.log('Reactor clicked!')} />
            </div>
            <div className="absolute bottom-1/3 left-1/3">
              <FloatingOrb icon={Zap} color="yellow" delay={0} onClick={() => console.log('Orb clicked!')} />
            </div>
            <CustomCrosshair 
              x={cursorSpringX} 
              y={cursorSpringY} 
              isShooting={isShooting} 
              hitMarkerTime={hitMarkerTime} 
              hitMarkerType={hitMarkerType} 
              ammo={ammo}
              maxAmmo={currentGun.maxAmmo}
              isReloading={isReloading}
              scale={crosshairScale}
              gun={upgradedGun}
              buffs={activeBuffs}
              settings={uiSettings}
            />

            {/* Tracers */}
            <AnimatePresence>
              {tracers.map(tracer => (
                <motion.div 
                  key={tracer.id}
                  initial={{ opacity: 1, scale: 0, left: '50%', top: '100%' }}
                  animate={{ opacity: 0, scale: 2, left: tracer.x, top: tracer.y }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute pointer-events-none rounded-full blur-[1px] origin-center shadow-[0_0_20px_currentcolor] z-[90] transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                     color: upgradedGun?.accent || '#38bdf8',
                     backgroundColor: 'currentcolor',
                     width: upgradedGun?.dartType?.shape === 'rocket' ? 10 : 4,
                     height: upgradedGun?.dartType?.shape === 'rocket' ? 40 : 20,
                  }}
                />
              ))}
            </AnimatePresence>
          </>
        )}

        <motion.div
          className="absolute inset-0 origin-center"
          animate={{
            ...(shakeIntensity > 0 ? {
              x: [0, -shakeIntensity, shakeIntensity, -shakeIntensity/2, shakeIntensity/2, 0],
              y: [0, shakeIntensity, -shakeIntensity, shakeIntensity/2, -shakeIntensity/2, 0]
            } : { x: 0, y: 0 }),
            // Hit-pause adds a tiny zoom punch on top of the ADS scale so
            // critical / kill hits feel like a freeze-frame snap.
            scale: (isADS ? upgradedGun.zoomInADS : 1) * (hitPause === 'kill' ? 1.018 : hitPause === 'crit' ? 1.010 : 1),
            skewX: jammingIntensity > 0 ? [0, jammingIntensity, -jammingIntensity, 0] : 0,
            filter: jammingIntensity > 0 ? `hue-rotate(${jammingIntensity * 10}deg) brightness(${1 + jammingIntensity * 0.05})` : 'none'
          }}
          transition={{
            duration: jammingIntensity > 0 ? 0.1 : 0.2,
            ease: "easeOut",
            skewX: { repeat: jammingIntensity > 0 ? Infinity : 0, duration: 0.1 },
            scale: { duration: hitPause ? 0.06 : 0.2, ease: 'easeOut' },
          }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerMove={(e) => {
            pointerDownPos.current = { x: e.clientX, y: e.clientY };
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
            const rect = gameAreaRef.current?.getBoundingClientRect();
            if (rect) {
              const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
              setPointerSway({ x: nx, y: ny });
            }
          }}
          onPointerDown={(e) => {
            pointerDownPos.current = { x: e.clientX, y: e.clientY };
            if (e.button === 2) {
              setIsADS(true);
              return;
            }
            
            setIsFiring(true);
            handleShoot(e);
          }}
          onPointerUp={(e) => {
            if (e.button === 2) {
              setIsADS(false);
            } else {
              setIsFiring(false);
            }
          }}
          onPointerLeave={(e) => {
             setIsADS(false);
          }}
        >
          {['playing', 'paused'].includes(gameState) && (
            <>
              <HUD 
                score={score} 
                timeLeft={timeLeft} 
                ammo={ammo} 
                gun={upgradedGun} 
                dart={currentDart}
                isReloading={isReloading}
                combo={combo}
                credits={credits}
                gameMode={gameMode}
                lives={lives}
                targetsHit={targetsHit}
                targetGoal={targetGoal}
                activeBuffs={activeBuffs}
                wave={wave}
                maxWave={maxWave}
                waveName={directorRef.current.getWaveName()}
                targetScore={targetScoreGoal}
                levelName={currentArena.name}
                levelNumber={currentArena.level}
                targets={targets}
                warnings={warnings}
                totalShots={totalShots}
                incomingProjectiles={enemyDarts}
                multiplayerState={multiplayerState}
                socketId={socket?.id}
                settings={uiSettings}
                onReload={reload}
                onPause={() => setGameState('paused')}
                onSkill={(skill) => {
                  if (skill === 'rapidFire') {
                    setActiveBuffs(b => ({ ...b, rapidFire: Date.now() + 5000 }));
                  } else if (skill === 'shield') {
                    setActiveBuffs(b => ({ ...b, shield: Date.now() + 5000 }));
                  } else if (skill === 'blast') {
                    setActiveBuffs(b => ({ ...b, damage: Date.now() + 5000 }));
                  }
                }}
              />

              <InGameControls
                  onFire={() => handleShoot()}
                  onReload={reload}
                  onPause={() => setGameState('paused')}
                  onWeaponSwap={() => {
                      const currentIndex = unlockedGuns.indexOf(currentGun.id);
                      if (currentIndex !== -1) {
                         const nextIndex = (currentIndex + 1) % unlockedGuns.length;
                         const nextGunId = unlockedGuns[nextIndex];
                         const nextGun = Object.values(GUNS).find(g => g.id === nextGunId);
                         if (nextGun) setCurrentGun(nextGun);
                      }
                  }}
                  leftHanded={uiSettings.leftHanded}
                  buttonScale={uiSettings.controlScale}
                  opacity={1}
                  showFireButton={uiSettings.showFireButton}
              />
              
              <AnimatePresence>
                {targets.map(target => (
                  <Target 
                    key={target.id} 
                    target={target} 
                    onHit={handleTargetHit}
                    cursorPos={{ x: cursorX.get(), y: cursorY.get() }}
                  />
                ))}
              </AnimatePresence>

              {hitEffects.map(effect => (
                <HitEffect key={effect.id} x={effect.x} y={effect.y} color={effect.color} isDestroy={effect.isDestroy} isMiss={effect.isMiss} isExplosion={effect.isExplosion} quality={effect.quality} originX={effect.originX} originY={effect.originY} />
              ))}

              {combatTexts.map(ct => (
                <CombatText key={ct.id} x={ct.x} y={ct.y} text={ct.text} color={ct.color} isCritical={ct.isCritical} />
              ))}

              {darts.map(dart => (
                <Dart
                  key={dart.id}
                  id={dart.id}
                  startX={dart.startX}
                  startY={dart.startY}
                  endX={dart.endX}
                  endY={dart.endY}
                  dartType={dart.dartType}
                  onComplete={removeDart}
                />
              ))}

              <Gun 
                gun={upgradedGun} 
                isShooting={isShooting} 
                isReloading={isReloading} 
                isFlinching={isFlinching}
                mouseX={pointerSway.x + breathSway.x}
                mouseY={pointerSway.y + breathSway.y}
                recoilBuildup={recoilBuildup}
                isADS={isADS}
                muzzleRef={muzzleRef}
              />
            </>
          )}

          {gameState === 'paused' && (
            <PauseOverlay
              onResume={() => setGameState('playing')}
              onRestart={() => startGame(gameMode)}
              onMainMenu={() => setGameState('menu')}
              onSettings={() => setShowSettings(true)}
              stats={{ score, timeLeft, ammo }}
              gun={upgradedGun}
              gameMode={gameMode}
            />
          )}

          {showSettings && (
             <InGameSettingsPanel
               settings={uiSettings}
               setSettings={setUiSettings}
               onClose={() => setShowSettings(false)}
             />
          )}

        </motion.div>
      </div>
    </div>
  );
}
