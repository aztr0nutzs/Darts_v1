import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Swords } from 'lucide-react';
import { getTargetAsset } from '../lib/assetRegistry';
import { MountFrame, getMountType } from './TargetMounts';

export type TargetData = {
  id: string;
  x: number;
  y: number;
  type: 
    | 'standard' | 'moving' | 'bonus' | 'armored' | 'exploding' | 'erratic' | 'splitting' | 'teleporting' | 'heavy_armor' | 'powerup_damage' | 'powerup_rapid' | 'powerup_shield' | 'hostile' | 'shielded' | 'drone' | 'jammer' | 'reflector' | 'decoy' | 'phantom'
    | 'orbital_array' | 'code_matrix' | 'gravity_tower' | 'data_sphere' | 'warp_gate' | 'bot_sentry'
    | 'kinetic_swarm' | 'aether_pylon' | 'astro_hive' | 'neural_grid' | 'sentinel_bot' | 'phase_target';
  createdAt: number;
  lifespan: number;
  points: number;
  hp: number;
  maxHp: number;
  scale?: number;
  nextFireTime?: number;
};

interface TargetProps {
  key?: React.Key;
  target: TargetData;
  onHit: (id: string, x: number, y: number) => void;
  cursorPos?: { x: number, y: number };
}

// ─── ASSET-BACKED TARGET RENDERER ────────────────────────────────────────────
// Layers the provided target image on top of the existing CSS body without
// disturbing hit zones (data-hit-zone is set on inner CSS nodes). If the image
// fails to load we hide it; the CSS body underneath still renders.
function TargetImageOverlay({
  type,
  hpPercentage,
  flash,
  shielded,
}: {
  type: string;
  hpPercentage: number;
  flash: boolean;
  shielded: boolean;
}) {
  const [failed, setFailed] = React.useState(false);
  const asset = React.useMemo(() => getTargetAsset(type), [type]);
  if (failed) return null;

  const damaged = hpPercentage < 0.5;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Drop shadow / contact pad */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-black/60 blur-md rounded-full" />
      {/* Mount/stand sliver behind the image so floating targets still feel grounded */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1.5 bg-zinc-900/70 border border-zinc-700 rounded-full" />
      <img
        src={asset.src}
        alt={asset.label}
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="relative max-w-[140%] max-h-[140%] w-[140%] h-[140%] select-none"
        style={{
          objectFit: 'contain',
          objectPosition: 'center',
          filter: `drop-shadow(0 6px 8px rgba(0,0,0,0.55)) ${damaged ? 'saturate(0.85) brightness(0.92)' : ''}`.trim(),
          mixBlendMode: 'normal',
        }}
      />
      {/* Hit flash overlay */}
      {flash && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)',
            mixBlendMode: 'screen',
          }}
        />
      )}
      {/* Damaged overlay */}
      {damaged && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 6px)',
            mixBlendMode: 'multiply',
            opacity: 0.7,
          }}
        />
      )}
      {/* Optional shield ring for shielded types */}
      {shielded && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-12%] rounded-full border-2 border-cyan-300/60 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
          style={{ mixBlendMode: 'screen' }}
        />
      )}
    </div>
  );
}

function PowerupCardBackdrop({ type }: { type: string }) {
  const [failed, setFailed] = React.useState(false);
  const asset = React.useMemo(() => getTargetAsset(type), [type]);
  if (failed) return null;
  return (
    <img
      src={asset.src}
      alt=""
      aria-hidden
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
      style={{ objectFit: 'cover', objectPosition: 'center', mixBlendMode: 'screen' }}
    />
  );
}

function HexNode({ color, score, active }: { color: string, score: number, active?: boolean, key?: React.Key }) {
  return (
    <div className={`relative w-8 h-9 flex items-center justify-center transition-all ${active ? 'scale-110' : 'opacity-40 scale-90'}`}>
       <svg viewBox="0 0 100 115.47" className={`absolute inset-0 w-full h-full fill-slate-900 stroke-2 ${active ? color : 'stroke-slate-700'}`}>
         <polygon points="50,0 100,28.87 100,86.6 50,115.47 0,86.6 0,28.87" />
       </svg>
       {active && <div className={`absolute inset-2 blur-sm rounded-full opacity-60 ${color === 'stroke-orange-500' ? 'bg-orange-500' : 'bg-cyan-500'}`} />}
       <span className="relative z-10 text-[8px] font-black">{score}</span>
    </div>
  );
}

export default function Target({ target, onHit, cursorPos }: TargetProps) {
  // Target type checks (kept minimal — most behavior is keyed off target.type directly)
  const isErratic = target.type === 'erratic';
  const isMoving = target.type === 'moving';
  const isHostile = target.type === 'hostile';
  const isDrone = target.type === 'drone';
  const isReflector = target.type === 'reflector';
  const isPhantom = target.type === 'phantom';
  const isPowerupDamage = target.type === 'powerup_damage';
  const isPowerupRapid = target.type === 'powerup_rapid';
  const isPowerupShield = target.type === 'powerup_shield';
  const isPowerup = isPowerupDamage || isPowerupRapid || isPowerupShield;

  const prevHp = React.useRef(target.hp);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [flash, setFlash] = React.useState(false);
  // 0 = none, 1 = light, 2 = medium, 3 = heavy
  const [hitTier, setHitTier] = React.useState(0);
  // Secondary settle-wobble that plays after the flash clears
  const [settling, setSettling] = React.useState(false);
  // Directional recoil unit vector (away from incoming shot) captured at hit time
  const [recoilDir, setRecoilDir] = React.useState<{ x: number, y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    const dmg = prevHp.current - target.hp;
    if (dmg > 0) {
      const ratio = dmg / target.maxHp;
      const tier = ratio > 0.25 ? 3 : ratio > 0.10 ? 2 : 1;
      setHitTier(tier);
      setFlash(true);

      // Capture directional recoil from cursor → target center (target gets pushed
      // away from the incoming shot). Falls back to a slight downward push.
      let dirX = 0, dirY = 0.4;
      if (cursorPos && rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const vx = cx - cursorPos.x;
        const vy = cy - cursorPos.y;
        const len = Math.max(1, Math.sqrt(vx * vx + vy * vy));
        dirX = vx / len;
        dirY = vy / len;
      }
      setRecoilDir({ x: dirX, y: dirY });

      const flashMs = tier === 3 ? 200 : tier === 2 ? 155 : 110;
      setTimeout(() => {
        setFlash(false);
        // After flash ends, run a short settle wobble for medium/heavy
        if (tier >= 2) {
          setSettling(true);
          setTimeout(() => setSettling(false), tier === 3 ? 700 : 500);
        }
      }, flashMs);
    }
    prevHp.current = target.hp;
  }, [target.hp, target.maxHp]);

  const baseScale = target.scale || 1;
  const hpPercentage = target.hp / target.maxHp;
  const mountType = React.useMemo(() => getMountType(target.type), [target.type]);

  // Charging / Attack Logic
  const isReflecting = isReflector && target.nextFireTime && target.nextFireTime > Date.now();
  const timeUntilAttack = target.nextFireTime ? Math.max(0, target.nextFireTime - Date.now()) : 2000;
  const attackProgress = Math.max(0, Math.min(1, 1 - (timeUntilAttack / 2000)));
  const isCharging = (isHostile || isDrone) && attackProgress > 0.5;

  // Phantom Reveal Logic
  const dist = cursorPos ? Math.sqrt(
    Math.pow((cursorPos.x / window.innerWidth * 100) - target.x, 2) + 
    Math.pow((cursorPos.y / window.innerHeight * 100) - target.y, 2)
  ) : 100;
  const isRevealed = dist < 15;

  // Scaled hit reactions by damage magnitude
  const hitScaleBoost = hitTier === 3 ? 1.48 : hitTier === 2 ? 1.30 : 1.18;
  const hitRotate = hitTier === 3
    ? [0, -14, 14, -8, 7, -3, 2, 0]
    : hitTier === 2
    ? [0, -8, 8, -4, 3, 0]
    : [0, -4, 4, -2, 0];
  const hitFilter = hitTier === 3
    ? 'brightness(2.2) drop-shadow(0 0 22px rgba(255,255,255,0.95))'
    : hitTier === 2
    ? 'brightness(1.8) drop-shadow(0 0 14px white)'
    : 'brightness(1.5) drop-shadow(0 0 8px white)';
  // Post-flash settling rotation
  const settleRotate = hitTier === 3 ? [0, -5, 4, -2, 1, 0] : [0, -3, 2, -1, 0];

  let animateProps: any = {
    scale: flash ? baseScale * hitScaleBoost : baseScale,
    opacity: 1,
    rotate: flash ? hitRotate : (settling ? settleRotate : 0),
    filter: flash ? hitFilter : 'none',
  };
  // Spring stiffness increases with hit strength for a snappier reaction
  const hitStiffness = hitTier === 3 ? 420 : hitTier === 2 ? 320 : 260;
  let transitionProps: any = {
    type: 'spring',
    stiffness: flash ? hitStiffness : 260,
    damping: flash ? (hitTier === 3 ? 6 : 8) : 9,
  };

  if (isMoving || target.type === 'bot_sentry') {
    animateProps.x = ["-50%", "50%", "-50%"];
    // easeInOut gives inertia: slow at ends, fast in middle (weight simulation)
    transitionProps = { ...transitionProps, x: { repeat: Infinity, duration: 4, ease: "easeInOut" } };
  } else if (isErratic || target.type === 'sentinel_bot') {
    animateProps.x = ["-30%", "30%", "-20%", "40%", "-30%"];
    animateProps.y = ["-20%", "40%", "-40%", "20%", "-20%"];
    // Offset y timing so motion feels unpredictable but still physically believable
    transitionProps = {
      ...transitionProps,
      x: { repeat: Infinity, duration: 2.3, ease: "easeInOut" },
      y: { repeat: Infinity, duration: 1.7, ease: "easeInOut" },
    };
  } else if (isDrone || target.type === 'kinetic_swarm') {
    animateProps.scale = [baseScale, baseScale * 1.05, baseScale];
    animateProps.rotate = [0, 2, -2, 0];
    transitionProps = { ...transitionProps, scale: { repeat: Infinity, duration: 2 }, rotate: { repeat: Infinity, duration: 4 } };
  } else if (isPhantom) {
    animateProps.opacity = isRevealed ? 0.8 : 0.05;
    animateProps.scale = isRevealed ? baseScale : baseScale * 0.8;
    transitionProps = { ...transitionProps, opacity: { duration: 0.3 } };
  }

  // Visual Theme mapping 
  const nerdBlue = 'text-cyan-400 border-cyan-400 shadow-[0_0_20px_#22d3ee]';

  const renderInner = () => {
    switch (target.type) {
      // ── Standard foam bullseye plate on stand ──────────────────────
      case 'standard':
        return (
          <div className="relative w-24 h-32 flex flex-col items-center justify-end">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-4 border-amber-700 shadow-[0_8px_18px_rgba(0,0,0,0.6)] flex items-center justify-center" data-hit-zone="body">
              <div className="absolute inset-2 rounded-full border-4 border-red-600" />
              <div className="absolute inset-5 rounded-full border-4 border-amber-50 bg-red-600" />
              <div className="absolute inset-8 rounded-full border-2 border-red-600 bg-amber-50" />
              <div className="w-3 h-3 rounded-full bg-red-700 shadow-[0_0_6px_rgba(255,0,0,0.6)] z-10" data-hit-zone="weak_point" />
            </div>
            <div className="w-1.5 h-6 bg-zinc-700 -mt-1" />
            <div className="w-12 h-3 rounded-full bg-zinc-800 border border-zinc-600 shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
          </div>
        );

      // ── Moving rail-mounted sliding foam target ────────────────────
      case 'moving':
        return (
          <div className="relative w-32 h-28 flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-200 to-orange-50 border-4 border-orange-700 shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center" data-hit-zone="body">
              <div className="absolute inset-2 rounded-full border-4 border-orange-600" />
              <div className="absolute inset-5 rounded-full bg-amber-50 border-2 border-orange-700" />
              <div className="absolute inset-7 rounded-full bg-orange-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-50 z-10" data-hit-zone="weak_point" />
            </div>
            {/* Rail mounting bracket */}
            <div className="w-8 h-2 bg-zinc-700 -mt-1 rounded-b-sm" />
            {/* Rail */}
            <div className="absolute -bottom-1 left-[-40%] w-[180%] h-1.5 bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 rounded-full shadow-inner" />
            <div className="absolute -bottom-3 left-[-40%] w-[180%] h-1 bg-zinc-800/60 blur-sm" />
          </div>
        );

      // ── Bonus shiny trophy can ─────────────────────────────────────
      case 'bonus':
        return (
          <div className="relative w-20 h-28 flex flex-col items-center justify-end">
            <div className="relative w-18 h-24 w-[72px] rounded-md bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 border-2 border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.6)] overflow-hidden" data-hit-zone="body">
              <div className="absolute top-1 left-1 right-1 h-2 bg-yellow-100/70 rounded-sm" />
              <div className="absolute inset-x-2 top-6 bottom-6 bg-yellow-900/30 border-y border-yellow-200 flex items-center justify-center">
                <span className="text-[10px] font-black italic text-yellow-100 tracking-widest">BONUS</span>
              </div>
              <div className="absolute bottom-1 left-1 right-1 h-2 bg-yellow-900/60 rounded-sm" />
              <div className="absolute top-0 left-1 w-1 h-full bg-white/60 blur-[1px]" data-hit-zone="weak_point" />
            </div>
            <div className="w-12 h-2 rounded-full bg-zinc-800 border border-zinc-600" />
          </div>
        );

      // ── Armored padded foam dummy ──────────────────────────────────
      case 'armored':
        return (
          <div className="relative w-24 h-32 flex flex-col items-center">
            {/* Helmet */}
            <div className="w-12 h-10 rounded-t-full bg-zinc-700 border-2 border-zinc-500 relative">
              <div className="absolute inset-x-2 top-3 h-2 bg-red-500/70 rounded-sm" data-hit-zone="weak_point" />
            </div>
            {/* Body w/ armor plates */}
            <div className="relative w-20 h-20 bg-gradient-to-b from-zinc-600 to-zinc-800 border-2 border-zinc-500 rounded-md mt-[-4px] shadow-[0_0_10px_rgba(0,0,0,0.6)]" data-hit-zone="armor">
              <div className="absolute inset-1 grid grid-cols-2 gap-1">
                <div className="bg-zinc-500 border border-zinc-400 rounded-sm" />
                <div className="bg-zinc-500 border border-zinc-400 rounded-sm" />
                <div className="bg-zinc-500 border border-zinc-400 rounded-sm" />
                <div className="bg-zinc-500 border border-zinc-400 rounded-sm" />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-600 border-2 border-amber-50 shadow-[0_0_8px_rgba(220,38,38,0.6)]" data-hit-zone="body">
                <div className="absolute inset-1.5 rounded-full bg-amber-50" />
              </div>
            </div>
            {/* Stand */}
            <div className="w-2 h-3 bg-zinc-700" />
            <div className="w-10 h-2 rounded-full bg-zinc-900 border border-zinc-700" />
          </div>
        );

      // ── Heavy armor large training dummy with thick pads ───────────
      case 'heavy_armor':
        return (
          <div className="relative w-32 h-44 flex flex-col items-center">
            {/* Reinforced helmet */}
            <div className="w-16 h-12 rounded-t-2xl bg-zinc-800 border-4 border-zinc-500 relative shadow-[0_0_12px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-x-2 top-3 h-3 bg-orange-500/80 rounded-sm shadow-[0_0_6px_#f97316]" data-hit-zone="weak_point" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-zinc-600" />
            </div>
            {/* Thick padded body */}
            <div className="relative w-28 h-28 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-4 border-zinc-500 rounded-lg mt-[-6px] shadow-[0_0_18px_rgba(0,0,0,0.7)]" data-hit-zone="armor">
              {/* Heavy strapping */}
              <div className="absolute inset-x-0 top-3 h-1 bg-zinc-500 opacity-70" />
              <div className="absolute inset-x-0 bottom-3 h-1 bg-zinc-500 opacity-70" />
              <div className="absolute inset-y-0 left-3 w-1 bg-zinc-500 opacity-70" />
              <div className="absolute inset-y-0 right-3 w-1 bg-zinc-500 opacity-70" />
              {/* Pad blocks */}
              <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-zinc-600 border border-zinc-400/50 rounded-sm" />
                ))}
              </div>
              {/* Center bullseye */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-600 border-4 border-amber-900 shadow-[0_0_10px_rgba(0,0,0,0.6)]" data-hit-zone="body">
                <div className="absolute inset-1 rounded-full bg-amber-50" />
                <div className="absolute inset-3 rounded-full bg-red-600" />
                <div className="absolute inset-[40%] rounded-full bg-amber-50" />
              </div>
            </div>
            {/* Heavy base */}
            <div className="w-2.5 h-3 bg-zinc-700" />
            <div className="w-16 h-3 rounded-md bg-zinc-900 border-2 border-zinc-700 shadow-[0_4px_10px_rgba(0,0,0,0.6)]" />
          </div>
        );

      // ── Exploding foam pop canister ────────────────────────────────
      case 'exploding':
        return (
          <div className="relative w-20 h-28 flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="relative w-16 h-20 rounded-md bg-gradient-to-b from-red-600 via-red-800 to-zinc-900 border-2 border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.5)] overflow-hidden"
              data-hit-zone="body"
            >
              {/* Hazard stripes */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.6)_6px,rgba(0,0,0,0.6)_12px)]" />
              <div className="absolute inset-x-1 top-2 bottom-2 bg-red-700/80 border border-yellow-500 flex flex-col items-center justify-center gap-1">
                <div className="text-[8px] font-black text-yellow-300 tracking-widest">DANGER</div>
                <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center" data-hit-zone="weak_point">
                  <span className="text-black font-black text-sm">!</span>
                </div>
              </div>
            </motion.div>
            {/* Cap / fuse */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]" />
            <div className="w-12 h-2 rounded-md bg-zinc-900 border border-zinc-600" />
          </div>
        );

      // ── Hostile toy sentry turret ──────────────────────────────────
      case 'hostile':
        return (
          <div className="relative w-24 h-28 flex flex-col items-center">
            {/* Sensor head */}
            <div className="relative w-16 h-12 rounded-t-2xl bg-gradient-to-b from-red-700 to-red-900 border-2 border-zinc-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <div className="absolute inset-x-2 top-2 h-3 rounded-sm bg-zinc-900 border border-red-400 flex items-center justify-center">
                <motion.div
                  animate={{ x: ['-30%', '30%', '-30%'] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_red]"
                  data-hit-zone="weak_point"
                />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-red-500 animate-pulse" />
            </div>
            {/* Barrel */}
            <div className="relative -mt-1 w-2 h-6 bg-zinc-700 border border-zinc-500 rounded-sm" data-hit-zone="armor">
              {isCharging && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              )}
            </div>
            {/* Body */}
            <div className="w-20 h-12 bg-zinc-800 border-2 border-zinc-600 rounded-md flex items-center justify-center relative" data-hit-zone="body">
              <div className="absolute inset-1 grid grid-cols-3 gap-1 opacity-70">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-zinc-700 border border-zinc-500 rounded-sm" />
                ))}
              </div>
              <div className="relative w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_red]" />
            </div>
            {/* Tripod */}
            <div className="w-16 h-2 rounded-full bg-zinc-900 border border-zinc-700" />
          </div>
        );

      // ── Shielded bullseye behind transparent shield ring ───────────
      case 'shielded':
        return (
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Bullseye core */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-4 border-amber-700 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10" data-hit-zone="body">
              <div className="absolute inset-2 rounded-full border-4 border-red-600" />
              <div className="absolute inset-5 rounded-full bg-red-600" />
              <div className="absolute inset-[42%] rounded-full bg-amber-50" data-hit-zone="weak_point" />
            </div>
            {/* Shield ring (transparent with shimmer) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-4 border-cyan-400/60 bg-cyan-300/10 backdrop-blur-[1px] shadow-[0_0_25px_rgba(34,211,238,0.4)]"
              data-hit-zone="armor"
            >
              <div className="absolute inset-1 rounded-full border border-cyan-200/40" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
            </motion.div>
          </div>
        );

      // ── Drone small toy hover drone ────────────────────────────────
      case 'drone':
        return (
          <div className="relative w-24 h-16 flex items-center justify-center">
            {/* Body */}
            <div className="relative w-12 h-7 rounded-full bg-gradient-to-b from-zinc-600 to-zinc-900 border border-zinc-400 shadow-[0_0_12px_rgba(0,0,0,0.6)] flex items-center justify-center z-10" data-hit-zone="body">
              <div className="w-3 h-2 rounded-full bg-red-500 shadow-[0_0_6px_red]" data-hit-zone="weak_point" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            {/* Rotors */}
            {[
              { side: 'left-0 top-0', spinner: 'top-1 left-1' },
              { side: 'right-0 top-0', spinner: 'top-1 right-1' },
              { side: 'left-0 bottom-0', spinner: 'bottom-1 left-1' },
              { side: 'right-0 bottom-0', spinner: 'bottom-1 right-1' },
            ].map((r, i) => (
              <div key={i} className={`absolute ${r.side} w-6 h-6`}>
                <div className="absolute inset-0 rounded-full border border-zinc-500/60 bg-zinc-900/40" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-1 rounded-full"
                >
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-300/60" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-cyan-300/60" />
                </motion.div>
              </div>
            ))}
            {/* Hover shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-black/50 blur-sm" />
          </div>
        );

      // ── Erratic wobbling spring-mounted target ─────────────────────
      case 'erratic':
        return (
          <div className="relative w-20 h-32 flex flex-col items-center justify-end">
            <motion.div
              animate={{ rotate: [-8, 8, -6, 6, -8] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 border-4 border-purple-900 shadow-[0_4px_14px_rgba(126,34,206,0.5)] flex items-center justify-center origin-bottom"
              data-hit-zone="body"
            >
              <div className="absolute inset-2 rounded-full border-4 border-amber-50" />
              <div className="absolute inset-5 rounded-full bg-amber-50" />
              <div className="absolute inset-[42%] rounded-full bg-purple-700 shadow-[0_0_6px_rgba(168,85,247,0.6)]" data-hit-zone="weak_point" />
            </motion.div>
            {/* Spring */}
            <div className="relative w-3 h-8 flex flex-col justify-between -mt-1">
              <div className="h-1 bg-zinc-400 rounded-full" />
              <div className="h-1 bg-zinc-500 rounded-full" />
              <div className="h-1 bg-zinc-400 rounded-full" />
              <div className="h-1 bg-zinc-500 rounded-full" />
              <div className="h-1 bg-zinc-400 rounded-full" />
            </div>
            <div className="w-12 h-2 rounded-full bg-zinc-900 border border-zinc-700" />
          </div>
        );

      // ── Splitting breakaway double target ──────────────────────────
      case 'splitting':
        return (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Left half */}
            <motion.div
              animate={{ x: hpPercentage < 0.5 ? -12 : 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
              className="absolute left-0 top-0 w-14 h-28 overflow-hidden"
              data-hit-zone="body"
            >
              <div className="absolute right-0 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 border-4 border-emerald-900">
                <div className="absolute inset-3 rounded-full border-4 border-amber-50" />
                <div className="absolute inset-6 rounded-full bg-amber-50" />
                <div className="absolute inset-[44%] rounded-full bg-emerald-800" />
              </div>
            </motion.div>
            {/* Right half */}
            <motion.div
              animate={{ x: hpPercentage < 0.5 ? 12 : 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
              className="absolute right-0 top-0 w-14 h-28 overflow-hidden"
              data-hit-zone="body"
            >
              <div className="absolute left-0 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 border-4 border-emerald-900">
                <div className="absolute inset-3 rounded-full border-4 border-amber-50" />
                <div className="absolute inset-6 rounded-full bg-amber-50" />
                <div className="absolute inset-[44%] rounded-full bg-emerald-800" />
              </div>
            </motion.div>
            {/* Split seam glow */}
            <div className="absolute left-1/2 top-2 bottom-2 w-[2px] -translate-x-1/2 bg-amber-200/80 shadow-[0_0_6px_#fde68a]" data-hit-zone="weak_point" />
          </div>
        );

      // ── Teleporting portal-frame target with bullseye ──────────────
      case 'teleporting':
        return (
          <div className="relative w-28 h-32 flex items-center justify-center">
            {/* Portal frame */}
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute inset-0 rounded-[55%] border-[6px] border-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.6)]"
              data-hit-zone="armor"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-[55%] bg-[conic-gradient(from_0deg,#7e22ce,#d946ef,#a855f7,#7e22ce)] opacity-60 blur-md"
            />
            {/* Bullseye core */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-4 border-fuchsia-700 z-10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]" data-hit-zone="body">
              <div className="absolute inset-2 rounded-full bg-fuchsia-600" />
              <div className="absolute inset-4 rounded-full bg-amber-50" />
              <div className="absolute inset-[42%] rounded-full bg-fuchsia-800" data-hit-zone="weak_point" />
            </div>
          </div>
        );

      // ── Jammer signal crate ────────────────────────────────────────
      case 'jammer':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="relative w-20 h-20 bg-gradient-to-b from-zinc-700 to-zinc-900 border-2 border-amber-500 rounded-md shadow-[0_0_15px_rgba(245,158,11,0.4)]" data-hit-zone="body">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(245,158,11,0.15)_4px,rgba(245,158,11,0.15)_8px)] rounded-md" />
              <div className="absolute top-1 left-1 right-1 flex justify-between items-center">
                <div className="text-[7px] font-black text-amber-300 tracking-widest">JMR-04</div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_4px_#facc15]" />
              </div>
              {/* Antenna */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-zinc-600">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-amber-300"
                />
              </div>
              {/* Core dish */}
              <div className="absolute inset-3 top-5 bg-zinc-800 border border-amber-600 rounded-sm flex items-center justify-center" data-hit-zone="weak_point">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]"
                />
              </div>
              <div className="absolute bottom-1 left-1 right-1 flex justify-between text-[7px] font-mono text-amber-400/70">
                <span>SIG</span>
                <span>///</span>
                <span>JAM</span>
              </div>
            </div>
          </div>
        );

      // ── Reflector mirrored shield plate ────────────────────────────
      case 'reflector':
        return (
          <div className="relative w-28 h-32 flex flex-col items-center justify-end">
            {/* Mirror plate */}
            <div className="relative w-24 h-24 rounded-md bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 border-4 border-slate-600 shadow-[0_0_18px_rgba(148,163,184,0.6)] overflow-hidden" data-hit-zone="armor">
              <motion.div
                animate={{ x: ['-100%', '120%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-y-0 w-1/3 bg-white/60 blur-md skew-x-12"
              />
              <div className="absolute inset-2 border-2 border-slate-200/70 rounded-sm" />
              {/* Center bullseye still hittable */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-600 border-2 border-amber-50" data-hit-zone="body">
                <div className="absolute inset-1 rounded-full bg-amber-50" />
                <div className="absolute inset-[35%] rounded-full bg-red-700" data-hit-zone="weak_point" />
              </div>
              {isReflecting && (
                <motion.div
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                  className="absolute inset-0 bg-cyan-200/40"
                />
              )}
            </div>
            {/* Stand */}
            <div className="w-2 h-3 bg-zinc-700" />
            <div className="w-12 h-2 rounded-full bg-zinc-900 border border-zinc-700" />
          </div>
        );

      // ── Decoy cardboard fake target ────────────────────────────────
      case 'decoy':
        return (
          <div className="relative w-20 h-28 flex flex-col items-center">
            <div className="relative w-18 h-24 w-[72px] bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-amber-900 shadow-[0_4px_8px_rgba(0,0,0,0.4)] rounded-sm" data-hit-zone="body">
              {/* Cardboard texture */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.08)_3px,rgba(0,0,0,0.08)_4px)]" />
              {/* Painted human silhouette */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-zinc-800/80" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-10 h-10 bg-zinc-800/80 rounded-md" />
              {/* Painted bullseye */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-red-600 bg-amber-100" data-hit-zone="weak_point">
                <div className="absolute inset-[30%] rounded-full bg-red-600" />
              </div>
              {/* DECOY stamp */}
              <div className="absolute bottom-0 left-0 right-0 text-center text-[7px] font-black text-red-700/80 tracking-widest -rotate-3 mix-blend-multiply">DECOY</div>
            </div>
            {/* Lean stand */}
            <div className="w-10 h-1.5 bg-zinc-700 rounded-full -mt-0.5" />
          </div>
        );

      // ── Phantom translucent stealth target ─────────────────────────
      case 'phantom':
        return (
          <div className={`relative w-24 h-32 flex flex-col items-center transition-opacity duration-300 ${isRevealed ? 'opacity-100' : 'opacity-30'}`}>
            <div className="relative w-20 h-20 rounded-full border-2 border-cyan-200/70 bg-cyan-200/10 backdrop-blur-[2px] shadow-[0_0_18px_rgba(165,243,252,0.3)]" data-hit-zone="body">
              <div className="absolute inset-2 rounded-full border-2 border-cyan-300/60" />
              <div className="absolute inset-5 rounded-full border-2 border-cyan-300/60" />
              <div className="absolute inset-[42%] rounded-full bg-cyan-200/60 shadow-[0_0_8px_#67e8f9]" data-hit-zone="weak_point" />
              {/* Glitch lines */}
              <motion.div
                animate={{ y: ['-100%', '100%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-x-0 h-[2px] bg-cyan-300/70 mix-blend-screen"
              />
            </div>
            <div className="w-1.5 h-4 bg-cyan-200/40" />
            <div className="w-10 h-1.5 rounded-full bg-cyan-100/30 blur-[1px]" />
          </div>
        );

      // ── Powerup pickup crates rendered above (handled in outer JSX) ─
      // Cases listed for completeness; outer wrapper renders icon crate.
      case 'powerup_damage':
      case 'powerup_rapid':
      case 'powerup_shield':
        return null;

      case 'orbital_array':
        return (
          <div className="relative w-40 h-40 flex items-center justify-center">
             <div className={`absolute inset-0 rounded-full border-[10px] ${nerdBlue} bg-blue-900/40`} />
             <div className="absolute inset-4 rounded-full border-4 border-orange-500 shadow-[0_0_15px_#f97316]" data-hit-zone="armor" />
             <div className="absolute inset-8 rounded-full border-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" data-hit-zone="weak_point" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-white italic" data-hit-zone="weak_point">100</div>
             {/* Thruster Vents */}
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 border-2 border-cyan-300 rounded-sm" />
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-4 bg-orange-500 rounded-custom" />
             <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-600 rounded-full" />
             <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-600 rounded-full" />
          </div>
        );
      case 'code_matrix':
        return (
          <div className="relative w-36 h-48 bg-slate-900 border-4 border-cyan-500 rounded-xl p-4 flex flex-col gap-2 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
             <div className="text-[8px] font-black text-cyan-400 mb-1 opacity-60">MATRIX_INPUT_V.04</div>
             <div className="grid grid-cols-3 gap-2">
                {[75, 75, 125, 75, 125, 75].map((s, i) => (
                  <HexNode key={i} color={i % 2 === 0 ? 'stroke-orange-500' : 'stroke-cyan-500'} score={s} active={hpPercentage > 0.3} />
                ))}
             </div>
             <div className="mt-auto flex justify-between items-end">
                <div className="w-16 h-1 bg-cyan-900 rounded-full">
                  <motion.div animate={{ width: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-cyan-400" />
                </div>
                <div className="text-[10px] font-black text-orange-500 animate-pulse">OVERRICE</div>
             </div>
          </div>
        );
      case 'warp_gate':
        return (
          <div className="relative w-44 h-44 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-8 border-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)]" />
             <div className="absolute inset-4 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
                  transition={{ rotate: { duration: 5, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity } }}
                  className="absolute inset-0 bg-[conic-gradient(from_0deg,#1e1b4b,#3b82f6,#60a5fa,#1e1b4b)] opacity-80 blur-xl" 
                />
             </div>
             <div className="absolute bottom-[-10px] w-24 h-12 bg-slate-800 border-t-4 border-blue-500 rounded-t-2xl flex items-center justify-center">
                <span className="text-xl font-black text-white italic">100</span>
             </div>
          </div>
        );
      case 'kinetic_swarm':
        return (
          <div className="relative w-48 h-48 flex items-center justify-center">
             <div className="w-20 h-20 rounded-full border-4 border-blue-500 bg-slate-900 flex items-center justify-center shadow-[0_0_20px_#3b82f6]" data-hit-zone="weak_point">
                <div className="text-[10px] font-black text-blue-400 text-center uppercase pointer-events-none">SWARM<br/><span className="text-xl text-white">500</span></div>
             </div>
             {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
               <div key={angle} className="absolute" style={{ transform: `rotate(${angle}deg) translateY(-80px)` }} data-hit-zone="armor">
                  <div className="w-2 h-12 bg-slate-700" />
                  <div className="w-10 h-10 -translate-x-4 rounded-full border-2 border-orange-400 bg-slate-900 flex items-center justify-center shadow-[0_0_10px_#fb923c]">
                     <span className="text-[10px] font-black text-white" style={{ transform: `rotate(${-angle}deg)` }}>50</span>
                  </div>
               </div>
             ))}
          </div>
        );
      case 'aether_pylon':
        return (
          <div className="relative w-28 h-56 flex flex-col items-center">
             <div className="w-full h-8 bg-orange-500 rounded-xl rounded-b-none border-b-2 border-slate-900" data-hit-zone="armor" />
             <div className="w-3/4 flex-1 bg-slate-900 border-x-4 border-blue-500 relative overflow-hidden" data-hit-zone="weak_point">
                <motion.div 
                  animate={{ y: [-100, 100], opacity: [0.2, 0.6, 0.2] }} 
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-400 blur-2xl" 
                />
                <div className="absolute inset-4 border border-blue-400/30 flex items-center justify-center">
                   <div className="text-3xl font-black text-blue-400 drop-shadow-[0_0_10px_#60a5fa] animate-pulse">300</div>
                </div>
             </div>
             <div className="w-full h-12 bg-orange-500 rounded-xl rounded-t-none border-t-4 border-slate-900 p-2 flex justify-between">
                <div className="text-[8px] font-black bg-blue-900 px-1 rounded">100</div>
                <div className="text-[8px] font-black bg-blue-900 px-1 rounded">50</div>
             </div>
          </div>
        );
      case 'gravity_tower':
        return (
          <div className="relative w-24 h-64 flex flex-col items-center">
             <div className="w-full h-12 bg-blue-600 rounded-t-xl border-b-4 border-slate-900 flex items-center justify-center">
                <span className="text-[10px] font-black text-white px-2 py-0.5 bg-orange-500 rounded">NERD</span>
             </div>
             <div className="w-16 flex-1 bg-blue-500 relative border-x-4 border-slate-800">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,0,0,0.1)_20px,rgba(0,0,0,0.1)_40px)]" />
                {[50, 100, 50, 150, 150].map((s, i) => (
                  <div key={i} className={`absolute w-12 h-12 rounded-lg border-2 border-orange-500 bg-slate-900 flex items-center justify-center shadow-[0_0_10px_#f97316]`}
                    style={{ 
                      top: `${20 + i * 15}%`, 
                      left: i % 2 === 0 ? '-30px' : '40px',
                      transform: 'rotate(45deg)'
                    }}
                  >
                     <span className="text-xs font-black text-white" style={{ transform: 'rotate(-45deg)' }}>{s}</span>
                  </div>
                ))}
             </div>
             <div className="w-32 h-16 bg-blue-600 rounded-xl border-t-4 border-slate-800 flex items-center justify-center">
                <div className="text-[10px] font-black text-white drop-shadow-[0_0_5px_white]">GRAVITY_SENSOR</div>
             </div>
          </div>
        );
      case 'data_sphere':
        return (
          <div className="relative w-44 h-44 flex items-center justify-center scale-90">
             <div className="absolute inset-0 bg-blue-600 rounded-full border-4 border-slate-900" />
             <div className="absolute inset-2 grid grid-cols-3 gap-1 rotate-12">
                {[50, 100, 150, 50, 100, 150, 50, 100, 150].map((s, i) => (
                  <div key={i} className={`w-full h-full flex items-center justify-center bg-slate-900/40 border border-orange-400 rounded-sm`}>
                    <span className="text-[10px] font-black text-orange-400">{s}</span>
                  </div>
                ))}
             </div>
             <div className="absolute bottom-[-15px] w-28 h-12 bg-blue-600 border-2 border-slate-800 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-black text-white">DATA_CORE</span>
             </div>
          </div>
        );
      case 'bot_sentry':
        return (
          <div className="relative w-40 h-48 flex flex-col items-center">
             <div className="w-32 h-32 bg-blue-500 border-4 border-slate-900 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                <div className="absolute top-2 w-16 h-4 bg-orange-500 rounded-full" />
                <div className="w-20 h-20 rounded-full border-4 border-orange-500 bg-slate-900 flex items-center justify-center shadow-[0_0_20px_#f97316]">
                   <span className="text-3xl font-black text-white italic">200</span>
                </div>
                {/* Antennas */}
                <div className="absolute -top-10 left-4 w-1 h-12 bg-slate-600 origin-bottom rotate-[-20deg]" />
                <div className="absolute -top-10 right-4 w-1 h-12 bg-slate-600 origin-bottom rotate-[20deg]" />
             </div>
             <div className="w-full flex justify-between mt-auto">
                <div className="w-12 h-12 bg-slate-800 border-4 border-orange-400 rounded-full" />
                <div className="w-12 h-12 bg-slate-800 border-4 border-orange-400 rounded-full translate-y-2" />
                <div className="w-12 h-12 bg-slate-800 border-4 border-orange-400 rounded-full" />
             </div>
          </div>
        );
      case 'astro_hive':
        return (
          <div className="relative w-48 h-64 flex flex-col items-center justify-center">
             <div className="relative w-20 h-56 bg-slate-800 border-x-4 border-purple-500 rounded-full" data-hit-zone="armor">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-4 border-purple-400 rounded-full flex items-center justify-center bg-slate-900 shadow-[0_0_30px_#c084fc]" data-hit-zone="weak_point">
                   <span className="text-3xl font-black text-white italic">200</span>
                </div>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="absolute left-1/2 -translate-x-1/2 w-16 h-18" style={{ top: `${15 + i * 20}%`, transform: `translateX(${i % 2 === 0 ? '-80px' : '30px'})` }}>
                     <HexNode color="stroke-purple-500" score={i * 25 + 25} active={true} />
                  </div>
                ))}
             </div>
             <div className="mt-auto w-32 h-10 bg-slate-800 border-t-4 border-purple-600 rounded-t-3xl" />
          </div>
        );
      case 'neural_grid':
        return (
          <div className="relative w-56 h-40 bg-slate-900 border-4 border-blue-500 rounded-xl p-4 grid grid-cols-4 gap-2 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
             <div className="col-span-2 row-span-2 bg-blue-900/40 border-2 border-cyan-400 rounded-lg flex items-center justify-center" data-hit-zone="weak_point">
                <div className="text-center">
                   <div className="text-[8px] font-black text-cyan-400 pointer-events-none">NEURAL_TAG</div>
                   <div className="text-3xl font-black text-white pointer-events-none">500</div>
                </div>
             </div>
             {[150, 150, 75, 75].map((s, i) => (
                <div key={i} className="bg-slate-800 border-2 border-orange-500 rounded flex items-center justify-center group-hover:scale-105 transition-transform">
                   <span className="text-[10px] font-black text-white">{s}</span>
                </div>
             ))}
             <div className="col-span-2 h-4 bg-orange-600 rounded-full mt-auto flex items-center justify-center">
                <span className="text-[8px] font-black text-white tracking-widest">NEURAL-GRID</span>
             </div>
          </div>
        );
      case 'sentinel_bot':
        return (
          <div className="relative w-40 h-44 flex flex-col items-center">
             <div className="w-32 h-28 bg-slate-800 border-4 border-blue-500 rounded-xl relative flex items-center justify-center" data-hit-zone="armor">
                <div className="absolute -top-4 w-20 h-4 bg-orange-600 rounded-full flex items-center justify-center">
                   <div className="flex gap-1" data-hit-zone="weak_point">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                   </div>
                </div>
                <div className="text-center pointer-events-none" data-hit-zone="weak_point">
                   <div className="text-[10px] font-black text-blue-400 pointer-events-none">SENTINEL</div>
                   <div className="text-3xl font-black text-white pointer-events-none">200</div>
                </div>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-10 bg-orange-500 rounded border-2 border-slate-900 flex items-center justify-center">
                   <span className="text-[10px] font-black text-white italic">100</span>
                </div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-10 bg-orange-500 rounded border-2 border-slate-900 flex items-center justify-center">
                   <span className="text-[10px] font-black text-white italic">50</span>
                </div>
             </div>
             {/* Spider Legs */}
             <div className="flex gap-8 -mt-2">
                <div className="w-2 h-10 bg-slate-700 origin-top rotate-[-20deg]" />
                <div className="w-2 h-10 bg-slate-700 origin-top rotate-[20deg]" />
             </div>
          </div>
        );
      case 'phase_target':
        return (
          <div className="relative w-40 h-40 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-x-[12px] border-y-[6px] border-blue-500 rotate-45 shadow-[0_0_30px_#3b82f6]" data-hit-zone="armor" />
             <div className="absolute inset-4 rounded-full border-4 border-blue-400 opacity-60" />
             <div className="absolute inset-8 rounded-full border-8 border-orange-500 flex items-center justify-center bg-slate-900 shadow-[0_0_20px_#f97316]" data-hit-zone="weak_point">
                <div className="text-center">
                   <div className="text-[8px] font-black text-orange-400 mb-1">PHASE-CORE</div>
                   <div className="text-2xl font-black text-white italic underline">200</div>
                </div>
             </div>
             {[50, 100, 150].map((s, i) => (
                <div key={i} className="absolute font-black text-white text-[10px]" style={{ transform: `translateY(${i * 20 - 70}px)` }}>{s}</div>
             ))}
          </div>
        );
      // ── Safe default fallback: a basic foam bullseye on a stand ───
      default:
        return (
          <div className="relative w-24 h-32 flex flex-col items-center justify-end">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-4 border-zinc-700 shadow-[0_4px_10px_rgba(0,0,0,0.5)]" data-hit-zone="body">
              <div className="absolute inset-2 rounded-full border-4 border-red-600" />
              <div className="absolute inset-5 rounded-full bg-red-600" />
              <div className="absolute inset-[42%] rounded-full bg-amber-50" data-hit-zone="weak_point" />
            </div>
            <div className="w-1.5 h-5 bg-zinc-700" />
            <div className="w-10 h-2 rounded-full bg-zinc-900 border border-zinc-700" />
          </div>
        );
    }
  };

  // Directional recoil offset (px) when flash is active — kicks the target away
  // from the incoming shot, then springs back in transitionProps.
  const recoilMag = flash ? (hitTier === 3 ? 18 : hitTier === 2 ? 12 : 7) : 0;
  const recoilX = recoilDir.x * recoilMag;
  const recoilY = recoilDir.y * recoilMag;

  return (
    <motion.div
      ref={rootRef}
      className="absolute cursor-crosshair z-20 group"
      style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ scale: 0, opacity: 0, x: "-50%", y: "-50%", rotate: -12 }}
      animate={animateProps}
      exit={{ scale: 0, opacity: 0, rotate: 15, transition: { duration: 0.18, ease: 'easeIn' } }}
      transition={transitionProps}
      data-target="true"
      data-target-id={target.id}
      data-hit-zone="body"
    >
      {isPowerup ? (
        <motion.div
          className="relative"
          animate={{ x: recoilX, y: recoilY }}
          transition={{ type: 'spring', stiffness: 600, damping: 14 }}
        >
          <div className={`relative flex items-center justify-center w-16 h-16 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] border-2 backdrop-blur-sm animate-pulse overflow-hidden
            ${isPowerupDamage ? 'bg-red-950/90 border-red-500 shadow-red-500/50 text-red-500' : ''}
            ${isPowerupRapid ? 'bg-yellow-950/90 border-yellow-400 shadow-yellow-400/50 text-yellow-400' : ''}
            ${isPowerupShield ? 'bg-blue-950/90 border-blue-400 shadow-blue-400/50 text-blue-400' : ''}
          `}>
            <PowerupCardBackdrop type={target.type} />
            <div className="absolute inset-0 bg-current opacity-20 rounded-xl" />
            {isPowerupDamage && <Swords className="w-8 h-8 relative z-10" />}
            {isPowerupRapid && <Zap className="w-8 h-8 relative z-10" />}
            {isPowerupShield && <Shield className="w-8 h-8 relative z-10" />}
          </div>
          <MountFrame mountType={mountType} hitTier={hitTier} flash={flash} settling={settling} />
        </motion.div>
      ) : (
        <motion.div
          className="relative"
          animate={{ x: recoilX, y: recoilY }}
          transition={{ type: 'spring', stiffness: 600, damping: 14 }}
        >
          {renderInner()}

          {/* Physical mounting / grounding frame anchored below the target.
              Adds base plate, rail, hinge, or hover anchor depending on type
              along with a soft contact shadow and hit-driven physical reaction. */}
          <MountFrame mountType={mountType} hitTier={hitTier} flash={flash} settling={settling} />

          {/* Asset-backed visual on top of the CSS body. Hides on error so the
              CSS structure underneath remains the working fallback. */}
          <TargetImageOverlay
            type={target.type}
            hpPercentage={hpPercentage}
            flash={flash}
            shielded={target.type === 'shielded'}
          />

          {/* Impact flash + recoil ring on hit — intensity scales with hit tier */}
          {flash && (
            <>
              <motion.div
                className="absolute inset-[-6px] rounded-full pointer-events-none z-40"
                style={{
                  boxShadow: hitTier === 3
                    ? '0 0 56px 22px rgba(255,255,255,0.85)'
                    : hitTier === 2
                    ? '0 0 36px 12px rgba(255,255,255,0.6)'
                    : '0 0 20px 6px rgba(255,255,255,0.42)',
                }}
                initial={{ opacity: 1, scale: 0.8 }}
                animate={{ opacity: 0, scale: hitTier === 3 ? 2.2 : hitTier === 2 ? 1.7 : 1.25 }}
                transition={{ duration: hitTier === 3 ? 0.35 : 0.22, ease: 'easeOut' }}
              />
              {/* Bright highlight halo — overlays the silhouette in white/gold */}
              <motion.div
                className="absolute inset-[-2px] rounded-full pointer-events-none z-40"
                style={{
                  background: hitTier === 3
                    ? 'radial-gradient(circle, rgba(255,235,150,0.55) 0%, rgba(255,255,255,0) 65%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%)',
                  mixBlendMode: 'screen',
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: hitTier === 3 ? 0.3 : 0.18, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute rounded-full border-2 pointer-events-none z-40"
                style={{
                  inset: hitTier === 3 ? '-16px' : '-10px',
                  borderColor: hitTier === 3 ? 'rgba(255,220,80,0.95)' : 'rgba(255,255,255,0.8)',
                }}
                initial={{ opacity: 0.95, scale: 0.5 }}
                animate={{ opacity: 0, scale: hitTier === 3 ? 2.4 : 1.8 }}
                transition={{ duration: hitTier === 3 ? 0.45 : 0.32, ease: 'easeOut' }}
              />
              {/* Heavy hit: extra shockwave ring + a directional impact streak */}
              {hitTier === 3 && (
                <>
                  <motion.div
                    className="absolute inset-[-24px] rounded-full border border-white/40 pointer-events-none z-40"
                    initial={{ opacity: 0.65, scale: 0.4 }}
                    animate={{ opacity: 0, scale: 3.0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute left-1/2 top-1/2 pointer-events-none z-40"
                    style={{
                      width: 90,
                      height: 4,
                      marginLeft: -45,
                      marginTop: -2,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,235,150,0.9) 50%, rgba(255,255,255,0) 100%)',
                      transform: `rotate(${Math.atan2(-recoilDir.y, -recoilDir.x) * 180 / Math.PI}deg)`,
                      transformOrigin: 'center',
                    }}
                    initial={{ opacity: 0.9, scaleX: 0.3 }}
                    animate={{ opacity: 0, scaleX: 1.4 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  />
                </>
              )}
            </>
          )}

          {/* Universal HP / Lock-on Overlays */}
          {isCharging && (
            <motion.div 
              className="absolute -inset-4 rounded-full border-2 border-orange-500/50 pointer-events-none z-50"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-0.5 bg-orange-600 text-[8px] font-black italic rounded">LOCK-ON</div>
            </motion.div>
          )}

          {/* Target Health HUD (Radial) */}
          {hpPercentage < 1 && (
             <svg className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none -rotate-90 z-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="6" />
                <circle 
                  cx="50" cy="50" r="48" 
                  fill="none" 
                  stroke={hpPercentage > 0.5 ? '#22c55e' : hpPercentage > 0.25 ? '#eab308' : '#ef4444'} 
                  strokeWidth="4" 
                  strokeDasharray="301.59"
                  strokeDashoffset={301.59 * (1 - hpPercentage)} 
                  className="transition-all duration-300 ease-out"
                />
             </svg>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
