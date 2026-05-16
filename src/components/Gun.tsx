import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getBlasterAsset } from '../lib/assetRegistry';
import type { Archetype, GunType } from '../lib/guns';

// ─── COMPONENT TYPES ─────────────────────────────────────────────────────────

interface GunProps {
  gun: GunType;
  isShooting: boolean;
  isReloading: boolean;
  isFlinching?: boolean;
  mouseX?: number;
  mouseY?: number;
  recoilBuildup?: number;
  isADS?: boolean;
  muzzleRef?: React.RefObject<HTMLDivElement | null>;
  weaponFeedback?: 'critical' | 'empty' | 'reload';
}

type Layer = 'back' | 'mid' | 'front';

// Muzzle position in SVG viewbox coords (700×380) — matches barrel tip
const MUZZLE_POS: Record<Archetype, { x: number; y: number }> = {
  pistol:   { x: 72,  y: 191 },
  revolver: { x: 62,  y: 191 },
  smg:      { x: 57,  y: 192 },
  double:   { x: 38,  y: 188 },
  shotgun:  { x: 37,  y: 178 },
  carbine:  { x: 37,  y: 189 },
  sniper:   { x: 22,  y: 188 },
  heavy:    { x: 28,  y: 190 },
};

// Approximate flash offset (px) in the outer motion.div space for each archetype.
// Tuned so the flash sits near the visual barrel tip after 3D perspective rotation.
const MUZZLE_FLASH_OFFSET: Record<Archetype, { left: number; top: number }> = {
  pistol:   { left: -32, top: 38 },
  revolver: { left: -36, top: 38 },
  smg:      { left: -38, top: 40 },
  double:   { left: -46, top: 36 },
  shotgun:  { left: -46, top: 32 },
  carbine:  { left: -46, top: 36 },
  sniper:   { left: -52, top: 36 },
  heavy:    { left: -50, top: 30 },
};

// Per-weapon overrides for muzzle flash position. Empty when archetype default
// already lines up; values nudge the bloom onto the exact visible barrel tip
// for guns whose body silhouette deviates (long sniper barrels, double-stack,
// drum-fed carbines). Falls back to MUZZLE_FLASH_OFFSET when not present.
const WEAPON_MUZZLE_OVERRIDE: Partial<Record<string, { left: number; top: number }>> = {
  scout_rifle:  { left: -58, top: 36 },
  protoscope:   { left: -54, top: 30 },
  boomer:       { left: -48, top: 30 },  // top barrel of double-barrel
  triple_threat:{ left: -54, top: 26 },
  aether_core:  { left: -52, top: 28 },
  early_blaster:{ left: -50, top: 32 },
  tactical_shotty: { left: -48, top: 30 },
  heavy_dart_p: { left: -48, top: 34 },
  urban_carbine:{ left: -48, top: 34 },
};

// Per-archetype "feel" profile — how each weapon class presents itself in the
// foreground. Drives skew, base size (foreground dominance), recoil weight and
// timing, and muzzle bloom scale. STATS ARE NOT TOUCHED — these only affect
// rendering, transform, and animation.
const ARCHETYPE_FEEL: Record<Archetype, {
  skewX: number;          // deg, perspective shear of the whole stack
  skewY: number;          // deg
  barrelBoost: number;    // front-layer scale > 1 → barrel reads larger than rear
  baseScale: number;      // 5–15% size bump for foreground dominance
  recoilMul: number;      // class-specific kick weight
  recoilDuration: number; // total recoil cycle (s) — heavies feel weightier
  flashScale: number;     // muzzle flash bloom multiplier
  depthPx: number;        // translateZ separation between back/front layers
}> = {
  pistol:   { skewX: -1.6, skewY:  0.7, barrelBoost: 1.05, baseScale: 1.06, recoilMul: 0.85, recoilDuration: 0.12, flashScale: 1.00, depthPx: 18 },
  revolver: { skewX: -2.0, skewY:  1.0, barrelBoost: 1.06, baseScale: 1.08, recoilMul: 1.05, recoilDuration: 0.15, flashScale: 1.10, depthPx: 20 },
  smg:      { skewX: -1.4, skewY:  0.5, barrelBoost: 1.04, baseScale: 1.07, recoilMul: 0.70, recoilDuration: 0.09, flashScale: 0.90, depthPx: 18 },
  double:   { skewX: -2.6, skewY:  1.4, barrelBoost: 1.09, baseScale: 1.10, recoilMul: 1.30, recoilDuration: 0.18, flashScale: 1.40, depthPx: 22 },
  shotgun:  { skewX: -2.8, skewY:  1.5, barrelBoost: 1.10, baseScale: 1.12, recoilMul: 1.35, recoilDuration: 0.18, flashScale: 1.50, depthPx: 24 },
  carbine:  { skewX: -2.2, skewY:  1.1, barrelBoost: 1.07, baseScale: 1.09, recoilMul: 0.92, recoilDuration: 0.12, flashScale: 1.05, depthPx: 22 },
  sniper:   { skewX: -2.4, skewY:  1.3, barrelBoost: 1.09, baseScale: 1.10, recoilMul: 1.20, recoilDuration: 0.20, flashScale: 1.20, depthPx: 24 },
  heavy:    { skewX: -3.0, skewY:  1.7, barrelBoost: 1.11, baseScale: 1.13, recoilMul: 1.55, recoilDuration: 0.22, flashScale: 1.60, depthPx: 26 },
};

// Adjust hex color brightness (factor > 1 = lighter, < 1 = darker)
function adj(hex: string, f: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >>  8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round(( n        & 255) * f)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ─── SVG GRADIENT DEFS ───────────────────────────────────────────────────────

function GunDefs({ u, p, a, isBack }: { u: string; p: string; a: string; isBack: boolean }) {
  const B = isBack;
  return (
    <defs>
      <linearGradient id={`bg_${u}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={B ? '#111827' : adj(p, 1.38)} />
        <stop offset="55%"  stopColor={B ? '#030712' : p} />
        <stop offset="100%" stopColor={B ? '#020408' : adj(p, 0.50)} />
      </linearGradient>
      <linearGradient id={`barrel_${u}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={B ? '#1e293b' : '#a1aec3'} />
        <stop offset="50%"  stopColor={B ? '#0f172a' : '#64748b'} />
        <stop offset="100%" stopColor={B ? '#020617' : '#2e3f58'} />
      </linearGradient>
      <linearGradient id={`acc_${u}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={B ? '#0f172a' : adj(a, 1.3)} />
        <stop offset="100%" stopColor={B ? '#020617' : adj(a, 0.65)} />
      </linearGradient>
      <linearGradient id={`dark_${u}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={B ? '#0a0f1a' : '#1e293b'} />
        <stop offset="100%" stopColor={B ? '#020408' : '#0f172a'} />
      </linearGradient>
      <linearGradient id={`grip_${u}`} x1="35%" y1="0%" x2="65%" y2="100%">
        <stop offset="0%"   stopColor={B ? '#06090f' : '#243045'} />
        <stop offset="100%" stopColor={B ? '#020408' : '#0a0f18'} />
      </linearGradient>
      <linearGradient id={`wood_${u}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor={B ? '#0f172a' : '#92400e'} />
        <stop offset="40%"  stopColor={B ? '#050912' : '#78350f'} />
        <stop offset="70%"  stopColor={B ? '#0f172a' : '#a16207'} />
        <stop offset="100%" stopColor={B ? '#050912' : '#651f0a'} />
      </linearGradient>
      <linearGradient id={`gloss_${u}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.44" />
        <stop offset="22%"  stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="55%"  stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

// ─── ARCHETYPE SVG BODIES ────────────────────────────────────────────────────

function PistolBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  return (
    <g>
      <rect x="80" y="175" width="178" height="35" fill={`url(#barrel_${u})`} rx="2" />
      <rect x="72" y="168" width="24" height="50" fill={`url(#acc_${u})`} rx="1" />
      <path d="M 112,152 L 380,152 L 385,218 L 258,218 L 120,225 Z" fill={`url(#bg_${u})`} />
      <rect x="115" y="148" width="262" height="6" fill={`url(#dark_${u})`} rx="1" />
      <path d="M 190,152 L 250,152 L 254,172 L 186,172 Z" fill="#040a14" />
      <path d="M 258,218 L 387,218 L 394,240 L 260,238 Z" fill={`url(#dark_${u})`} />
      <path d="M 308,238 Q 293,305 326,307 L 360,307 Q 393,305 378,238 Z"
            fill="none" stroke={`url(#dark_${u})`} strokeWidth="7" strokeLinejoin="round" />
      <line x1="320" y1="246" x2="318" y2="288" stroke="#4a5568" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 340,235 L 396,235 L 427,378 L 357,378 Z" fill={`url(#grip_${u})`} />
      <path d="M 352,233 L 381,233 L 367,373 L 347,373 Z" fill={`url(#acc_${u})`} />
      {[353, 365, 377, 389].map(x => (
        <line key={x} x1={x} y1="253" x2={x - 16} y2="375" stroke="#1a2535" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      ))}
      {[320, 331, 342, 353].map(x => (
        <line key={x} x1={x} y1="152" x2={x - 1} y2="218" stroke="#1a2535" strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
      ))}
      <rect x="112" y="147" width="12" height="7" fill={`url(#dark_${u})`} rx="1" />
      <rect x="347" y="147" width="18" height="7" fill={`url(#dark_${u})`} rx="1" />
      {isFront && <path d="M 115,152 L 376,152 L 373,163 L 115,160 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

function RevolverBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  const cx = 296, cy = 193, cr = 52;
  const holeR = 8, holeOffset = 32;
  const holes = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * holeOffset, y: cy + Math.sin(angle) * holeOffset };
  });
  return (
    <g>
      <rect x="68" y="174" width="160" height="34" fill={`url(#barrel_${u})`} rx="2" />
      <rect x="68" y="208" width="164" height="12" fill={`url(#dark_${u})`} rx="1" />
      <rect x="62" y="169" width="22" height="46" fill={`url(#acc_${u})`} rx="1" />
      <circle cx={cx} cy={cy} r={cr} fill={`url(#barrel_${u})`} />
      <circle cx={cx} cy={cy} r={cr - 4} fill="none" stroke={isFront ? '#475569' : '#1e293b'} strokeWidth="2" />
      {holes.map((h, i) => <circle key={i} cx={h.x} cy={h.y} r={holeR} fill="#030810" />)}
      <circle cx={cx} cy={cy} r={8} fill={`url(#dark_${u})`} />
      <path d="M 225,162 L 340,154 L 344,140 L 352,174 L 228,180 Z" fill={`url(#bg_${u})`} />
      <path d="M 225,180 L 352,178 L 372,232 L 225,232 Z" fill={`url(#bg_${u})`} />
      <path d="M 330,140 L 353,133 L 360,149 L 342,156 Z" fill={`url(#dark_${u})`} />
      <path d="M 278,228 Q 273,258 312,310 L 360,308 Q 395,255 370,228 Z" fill="none" stroke={`url(#dark_${u})`} strokeWidth="7" strokeLinejoin="round" />
      <path d="M 278,228 L 370,228 L 392,358 L 318,368 Z" fill={`url(#grip_${u})`} />
      {gun.aesthetic === 'rusty' && (
        <g opacity="0.35">
          <rect x="80"  y="180" width="18" height="6"  fill="#92400e" rx="1" />
          <rect x="110" y="175" width="10" height="3"  fill="#92400e" rx="1" />
          <rect x="230" y="162" width="25" height="5"  fill="#78350f" rx="1" />
        </g>
      )}
      {[345, 357, 369, 381].map(x => (
        <line key={x} x1={x} y1="246" x2={x - 14} y2="360" stroke="#1a2535" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      ))}
      {isFront && <path d="M 228,162 L 343,155 L 340,168 L 228,174 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

function SmgBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  return (
    <g>
      <rect x="62" y="175" width="156" height="35" fill={`url(#barrel_${u})`} rx="2" />
      <rect x="55" y="170" width="24" height="45" fill={`url(#acc_${u})`} rx="1" />
      <path d="M 78,170 L 192,158 L 192,242 L 78,213 Z" fill={`url(#bg_${u})`} />
      <path d="M 188,157 L 428,157 L 433,238 L 190,238 Z" fill={`url(#bg_${u})`} />
      <rect x="192" y="153" width="233" height="6" fill={`url(#dark_${u})`} rx="1" />
      <path d="M 208,153 L 228,142 L 240,148 L 220,158 Z" fill={`url(#dark_${u})`} />
      <rect x="62" y="210" width="132" height="30" fill={`url(#dark_${u})`} rx="1" />
      <path d="M 280,236 L 316,236 L 300,368 L 274,368 Z" fill={`url(#acc_${u})`} />
      <path d="M 343,234 L 383,234 L 411,360 L 347,360 Z" fill={`url(#grip_${u})`} />
      <path d="M 308,237 Q 295,298 325,300 L 358,300 Q 388,298 375,237 Z"
            fill="none" stroke={`url(#dark_${u})`} strokeWidth="7" strokeLinejoin="round" />
      <line x1="320" y1="244" x2="318" y2="282" stroke="#4a5568" strokeWidth="4" strokeLinecap="round" />
      {[350, 362, 374, 386].map(x => (
        <line key={x} x1={x} y1="250" x2={x - 16} y2="357" stroke="#1a2535" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      ))}
      {gun.id === 'mini_sprayer' && (
        <g>
          <rect x="188" y="157" width="240" height="15" fill={`url(#dark_${u})`} rx="1" />
          {[210, 240, 270, 300, 330, 360, 390].map(x => (
            <rect key={x} x={x} y="158" width="8" height="14" fill="#040a14" rx="1" />
          ))}
        </g>
      )}
      {isFront && <path d="M 192,157 L 423,157 L 420,168 L 192,165 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

function DoubleBarrelBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  return (
    <g>
      <rect x="43" y="155" width="225" height="37" fill={`url(#barrel_${u})`} rx="2" />
      <rect x="43" y="196" width="225" height="33" fill={`url(#barrel_${u})`} rx="2" />
      <rect x="37" y="152" width="25" height="40" fill={`url(#acc_${u})`} rx="1" />
      <rect x="37" y="196" width="25" height="37" fill={`url(#acc_${u})`} rx="1" />
      <path d="M 257,148 L 382,148 L 388,235 L 257,235 Z" fill={`url(#bg_${u})`} />
      <circle cx="262" cy="193" r="14" fill={`url(#dark_${u})`} />
      <circle cx="262" cy="193" r="7"  fill="#040a14" />
      <path d="M 318,148 L 340,132 L 350,140 L 330,148 Z" fill={`url(#dark_${u})`} />
      <path d="M 373,153 L 620,158 L 624,240 L 373,232 Z" fill={`url(#wood_${u})`} />
      {isFront && [165, 182, 199, 216].map(y => (
        <line key={y} x1="373" y1={y} x2="618" y2={y + 1} stroke={gun.aesthetic === 'rusty' ? '#7c2d12' : '#92400e'} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      ))}
      <rect x="608" y="151" width="18" height="92" fill={`url(#dark_${u})`} rx="2" />
      <path d="M 320,232 L 378,232 L 400,354 L 338,357 Z" fill={`url(#wood_${u})`} />
      {isFront && [254, 272, 290, 308, 326].map(y => (
        <line key={y} x1="322" y1={y} x2="396" y2={y + 2} stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      ))}
      {isFront && <path d="M 258,148 L 375,148 L 372,160 L 258,158 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

function ShotgunBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  return (
    <g>
      <rect x="43" y="157" width="220" height="42" fill={`url(#barrel_${u})`} rx="3" />
      <rect x="50" y="202" width="222" height="25" fill={`url(#barrel_${u})`} rx="2" />
      <rect x="35" y="152" width="30" height="76" fill={`url(#acc_${u})`} rx="2" />
      <path d="M 90,152 L 198,152 L 198,232 L 90,232 Z" fill={`url(#dark_${u})`} />
      {[108, 128, 148, 168].map(x => (
        <rect key={x} x={x} y="156" width="10" height="72" fill="#040a14" rx="1" />
      ))}
      <path d="M 252,148 L 432,148 L 438,258 L 252,258 Z" fill={`url(#bg_${u})`} />
      <rect x="255" y="145" width="174" height="5" fill={`url(#dark_${u})`} rx="1" />
      <path d="M 335,257 Q 320,315 352,318 L 382,318 Q 414,315 400,257 Z"
            fill="none" stroke={`url(#dark_${u})`} strokeWidth="7" strokeLinejoin="round" />
      <line x1="348" y1="264" x2="346" y2="300" stroke="#4a5568" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 362,254 L 412,254 L 440,373 L 374,375 Z" fill={`url(#grip_${u})`} />
      {[378, 390, 402, 414].map(x => (
        <line key={x} x1={x} y1="270" x2={x - 16} y2="372" stroke="#1a2535" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      ))}
      <path d="M 420,150 L 510,150 L 512,260 L 420,258 Z" fill={`url(#dark_${u})`} />
      <rect x="500" y="148" width="14" height="114" fill={`url(#barrel_${u})`} rx="2" />
      {isFront && <path d="M 252,148 L 426,148 L 422,160 L 252,158 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

function CarbineBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  const isDrum = gun.id === 'heavy_dart_p';
  return (
    <g>
      <rect x="43" y="170" width="146" height="37" fill={`url(#barrel_${u})`} rx="2" />
      <rect x="36" y="165" width="28" height="47" fill={`url(#acc_${u})`} rx="1" />
      <path d="M 42,164 L 193,164 L 193,214 L 42,214 Z" fill={`url(#dark_${u})`} />
      {[60, 85, 110, 135, 160].map(x => (
        <rect key={x} x={x} y="167" width="12" height="44" fill="#040a14" rx="1" />
      ))}
      <path d="M 182,151 L 462,151 L 468,248 L 184,248 Z" fill={`url(#bg_${u})`} />
      <rect x="186" y="147" width="272" height="6" fill={`url(#dark_${u})`} rx="1" />
      <circle cx="272" cy="160" r="6" fill={`url(#dark_${u})`} />
      <rect x="182" y="151" width="52" height="14" fill={`url(#barrel_${u})`} rx="1" />
      <path d="M 337,247 Q 322,308 354,310 L 384,310 Q 416,308 402,247 Z"
            fill="none" stroke={`url(#dark_${u})`} strokeWidth="7" strokeLinejoin="round" />
      <line x1="350" y1="254" x2="348" y2="292" stroke="#4a5568" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 356,244 L 400,244 L 424,368 L 360,368 Z" fill={`url(#grip_${u})`} />
      {[368, 380, 392, 404].map(x => (
        <line key={x} x1={x} y1="260" x2={x - 16} y2="365" stroke="#1a2535" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      ))}
      {isDrum ? (
        <g>
          <circle cx="318" cy="312" r="63" fill={`url(#barrel_${u})`} />
          <circle cx="318" cy="312" r="47" fill={`url(#acc_${u})`} />
          <circle cx="318" cy="312" r="12" fill={`url(#dark_${u})`} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <circle key={i} cx={318 + Math.cos(a) * 30} cy={312 + Math.sin(a) * 30} r="5" fill="#040a14" />;
          })}
        </g>
      ) : (
        <path d="M 298,246 L 340,246 L 326,382 L 300,382 Z" fill={`url(#acc_${u})`} />
      )}
      <path d="M 450,154 L 675,156 L 675,252 L 450,250 Z" fill={`url(#bg_${u})`} />
      <rect x="663" y="152" width="18" height="102" fill={`url(#dark_${u})`} rx="2" />
      {isFront && <path d="M 184,151 L 458,151 L 455,163 L 184,160 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

function SniperBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  const hasBipod = gun.id === 'scout_rifle';
  return (
    <g>
      <rect x="26" y="172" width="145" height="31" fill={`url(#barrel_${u})`} rx="1" />
      <rect x="22" y="167" width="28" height="42" fill={`url(#acc_${u})`} rx="1" />
      <path d="M 40,165 L 182,165 L 182,211 L 40,211 Z" fill={`url(#dark_${u})`} />
      {hasBipod && (
        <g>
          <line x1="52" y1="210" x2="40" y2="270" stroke={`url(#barrel_${u})`} strokeWidth="5" strokeLinecap="round" />
          <line x1="66" y1="210" x2="80" y2="270" stroke={`url(#barrel_${u})`} strokeWidth="5" strokeLinecap="round" />
          <rect x="32" y="266" width="18" height="6" fill={`url(#dark_${u})`} rx="2" />
          <rect x="74" y="266" width="18" height="6" fill={`url(#dark_${u})`} rx="2" />
        </g>
      )}
      <path d="M 158,154 L 450,154 L 456,242 L 160,242 Z" fill={`url(#bg_${u})`} />
      <rect x="163" y="148" width="280" height="8" fill={`url(#dark_${u})`} rx="1" />
      <rect x="198" y="116" width="198" height="34" fill={`url(#barrel_${u})`} rx="4" />
      <circle cx="210" cy="133" r="15" fill={`url(#dark_${u})`} />
      <circle cx="210" cy="133" r="9"  fill={gun.aesthetic === 'prototype' ? adj(gun.accent, 0.7) : '#0c1929'} />
      <circle cx="210" cy="133" r="4"  fill={gun.aesthetic === 'prototype' ? gun.accent : '#38bdf8'} opacity={isFront ? '0.8' : '0.3'} />
      <circle cx="388" cy="133" r="11" fill={`url(#dark_${u})`} />
      <circle cx="388" cy="133" r="6"  fill={gun.aesthetic === 'prototype' ? adj(gun.accent, 0.7) : '#0c1929'} />
      <rect x="290" y="116" width="28" height="8"  fill={`url(#dark_${u})`} rx="2" />
      <rect x="296" y="124" width="16" height="10" fill={`url(#dark_${u})`} rx="1" />
      <path d="M 335,154 L 350,137 L 360,142 L 348,157 Z" fill={`url(#dark_${u})`} />
      <path d="M 355,238 Q 340,298 372,300 L 402,300 Q 432,298 418,238 Z"
            fill="none" stroke={`url(#dark_${u})`} strokeWidth="7" strokeLinejoin="round" />
      <line x1="368" y1="245" x2="366" y2="282" stroke="#4a5568" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 358,238 L 400,238 L 426,365 L 362,365 Z" fill={`url(#grip_${u})`} />
      {[370, 382, 394, 406].map(x => (
        <line key={x} x1={x} y1="254" x2={x - 16} y2="362" stroke="#1a2535" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      ))}
      <path d="M 308,240 L 342,240 L 330,322 L 308,322 Z" fill={`url(#acc_${u})`} />
      <path d="M 440,157 L 688,160 L 688,248 L 440,246 Z" fill={`url(#bg_${u})`} />
      <path d="M 440,160 L 618,160 L 615,182 L 440,180 Z" fill={`url(#barrel_${u})`} />
      <rect x="676" y="155" width="18" height="95" fill={`url(#dark_${u})`} rx="2" />
      {isFront && <path d="M 161,154 L 446,154 L 443,166 L 161,162 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

function HeavyBody({ u, gun, isFront }: { u: string; gun: GunType; isFront: boolean }) {
  const isTriple = gun.id === 'triple_threat';
  const isAether = gun.id === 'aether_core';
  return (
    <g>
      <rect x="38" y="154" width="140" height="70" fill={`url(#barrel_${u})`} rx="3" />
      <path d="M 27,144 L 63,144 L 63,236 L 27,236 Z" fill={`url(#acc_${u})`} rx="2" />
      {[148, 160, 172, 184, 196, 208, 220].map(y => (
        <rect key={y} x="27" y={y} width="36" height="4" fill="#040a14" rx="1" />
      ))}
      {isTriple && (
        <g>
          <circle cx="36" cy="170" r="7" fill="#040a14" />
          <circle cx="36" cy="190" r="7" fill="#040a14" />
          <circle cx="36" cy="210" r="7" fill="#040a14" />
        </g>
      )}
      <path d="M 163,129 L 490,129 L 496,265 L 165,265 Z" fill={`url(#bg_${u})`} />
      <rect x="168" y="125" width="316" height="6" fill={`url(#dark_${u})`} rx="1" />
      <path d="M 282,129 L 308,115 L 322,122 L 302,132 Z" fill={`url(#dark_${u})`} />
      <circle cx="356" cy="285" r="67" fill={`url(#barrel_${u})`} />
      <circle cx="356" cy="285" r="50" fill={`url(#acc_${u})`} />
      <circle cx="356" cy="285" r="14" fill={`url(#dark_${u})`} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={356 + Math.cos(a) * 32} cy={285 + Math.sin(a) * 32} r="6" fill="#040a14" />;
      })}
      <path d="M 362,264 Q 346,322 378,325 L 412,325 Q 444,322 430,264 Z"
            fill="none" stroke={`url(#dark_${u})`} strokeWidth="8" strokeLinejoin="round" />
      <line x1="378" y1="272" x2="376" y2="308" stroke="#4a5568" strokeWidth="5" strokeLinecap="round" />
      <path d="M 387,262 L 430,262 L 452,375 L 390,375 Z" fill={`url(#grip_${u})`} />
      {[400, 413, 426, 439].map(x => (
        <line key={x} x1={x} y1="278" x2={x - 16} y2="372" stroke="#1a2535" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      ))}
      {isAether && isFront && (
        <g>
          <rect x="200" y="152" width="48" height="8"  fill={gun.accent} rx="2" opacity="0.8" />
          <rect x="390" y="152" width="48" height="8"  fill={gun.accent} rx="2" opacity="0.8" />
          <rect x="200" y="147" width="48" height="5"  fill={gun.accent} rx="2" opacity="0.35" style={{ filter: 'blur(2px)' }} />
          <rect x="390" y="147" width="48" height="5"  fill={gun.accent} rx="2" opacity="0.35" style={{ filter: 'blur(2px)' }} />
        </g>
      )}
      <path d="M 472,135 L 685,139 L 683,265 L 470,262 Z" fill={`url(#bg_${u})`} />
      <rect x="671" y="133" width="20" height="134" fill={`url(#dark_${u})`} rx="2" />
      {isFront && <path d="M 166,129 L 486,129 L 483,142 L 166,140 Z" fill={`url(#gloss_${u})`} />}
    </g>
  );
}

// ─── WEAPON SVG WRAPPER ───────────────────────────────────────────────────────

function WeaponSVG({ gun, layer, arch }: { gun: GunType; layer: Layer; arch: Archetype }) {
  const isBack  = layer === 'back';
  const isFront = layer === 'front';
  const u = `${gun.id}_${layer}`;

  const bodyProps = { u, gun, isFront };

  return (
    <svg
      width="700" height="380" viewBox="0 0 700 380"
      className="absolute top-0 left-0 overflow-visible"
      style={isBack ? { filter: 'brightness(0.18) blur(1.5px)' } : undefined}
    >
      <GunDefs u={u} p={gun.color} a={gun.accent} isBack={isBack} />

      {arch === 'pistol'   && <PistolBody      {...bodyProps} />}
      {arch === 'revolver' && <RevolverBody    {...bodyProps} />}
      {arch === 'smg'      && <SmgBody         {...bodyProps} />}
      {arch === 'double'   && <DoubleBarrelBody {...bodyProps} />}
      {arch === 'shotgun'  && <ShotgunBody     {...bodyProps} />}
      {arch === 'carbine'  && <CarbineBody     {...bodyProps} />}
      {arch === 'sniper'   && <SniperBody      {...bodyProps} />}
      {arch === 'heavy'    && <HeavyBody       {...bodyProps} />}

      {/* Grip / hand silhouette — front layer only */}
      {isFront && (
        <g>
          <path d="M 370,235 Q 348,282 418,352 Q 468,322 448,235 Z" fill="#1e293b" />
          <path d="M 382,288 Q 360,266 374,245" stroke="#2d3f55" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M 398,303 Q 376,278 390,255" stroke="#2d3f55" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M 414,318 Q 392,288 408,262" stroke="#2d3f55" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M 430,334 Q 408,300 424,272" stroke="#2d3f55" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M 377,295 Q 432,340 448,248" stroke="#374f68" strokeWidth="4" fill="none" opacity="0.5" />
        </g>
      )}

    </svg>
  );
}

// ─── BLASTER IMAGE OVERLAY ───────────────────────────────────────────────────
// Renders the provided blaster PNG on top of the SVG body. If the asset fails
// to load (404, CDN error, etc.) we hide the image and the SVG underneath
// remains as the visual fallback. This preserves all existing rigging and
// animations — recoil, sway, ADS, reload, muzzle flash positions — because we
// only paint a sprite on the same transform stack.
function BlasterImage({
  asset,
  archetype,
  onError,
}: {
  asset: ReturnType<typeof getBlasterAsset>;
  archetype: Archetype;
  onError: () => void;
}) {
  // Tuned per archetype so the sprite anchors near the SVG barrel/grip.
  const layout = ARCHETYPE_IMG_LAYOUT[archetype];

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
        // Soft contact + drop shadow so the cutout reads against any arena.
        filter:
          'drop-shadow(0 14px 12px rgba(0,0,0,0.55)) drop-shadow(0 2px 2px rgba(0,0,0,0.7))',
      }}
    >
      <img
        src={asset.src}
        alt={asset.label}
        draggable={false}
        loading="eager"
        decoding="async"
        onError={onError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          transform: layout.transform,
          imageRendering: 'auto',
        }}
      />
    </div>
  );
}

// Per-archetype anchor for the blaster image inside the 700×380 SVG viewbox.
// Coordinates are in the SVG local space (top/left in px relative to the
// 700×380 frame). Width/height keep the image readable at first-person scale.
const ARCHETYPE_IMG_LAYOUT: Record<Archetype, { left: number; top: number; width: number; height: number; transform: string }> = {
  pistol:   { left: 4,   top: 32,  width: 430, height: 310, transform: 'rotate(-2deg)' },
  revolver: { left: 4,   top: 32,  width: 430, height: 310, transform: 'rotate(-2deg)' },
  smg:      { left: -8,  top: 32,  width: 490, height: 310, transform: 'rotate(-2deg)' },
  double:   { left: -38, top: 32,  width: 690, height: 300, transform: 'rotate(-1deg)' },
  shotgun:  { left: -42, top: 28,  width: 640, height: 320, transform: 'rotate(-1deg)' },
  carbine:  { left: -42, top: 28,  width: 700, height: 310, transform: 'rotate(-1deg)' },
  sniper:   { left: -52, top: 28,  width: 760, height: 300, transform: 'rotate(-1deg)' },
  heavy:    { left: -52, top: 20,  width: 720, height: 340, transform: 'rotate(-1deg)' },
};

// ─── MAIN GUN COMPONENT ───────────────────────────────────────────────────────

export default function Gun({
  gun,
  isShooting,
  isReloading,
  isFlinching = false,
  mouseX = 0,
  mouseY = 0,
  recoilBuildup = 0,
  isADS = false,
  muzzleRef,
  weaponFeedback,
}: GunProps) {
  const arch = gun.archetype;
  const blasterAsset = React.useMemo(() => getBlasterAsset(gun.id), [gun.id]);
  const [assetFailed, setAssetFailed] = React.useState(false);
  const muzzle = MUZZLE_POS[arch];
  const feel = ARCHETYPE_FEEL[arch];
  const flashOffset = WEAPON_MUZZLE_OVERRIDE[gun.id] ?? MUZZLE_FLASH_OFFSET[arch];
  const heavyVisualMul = arch === 'heavy' || arch === 'shotgun' || arch === 'double' || arch === 'sniper' ? 1.08 : 1;
  const feedbackKick = weaponFeedback === 'critical'
    ? { x: -7, y: -11, z: 14, rz: -3.2, rx: -5.5, scale: 1.035, duration: 0.14 }
    : weaponFeedback === 'empty'
    ? { x: 3, y: -3, z: 2, rz: 1.4, rx: -1.2, scale: 1.008, duration: 0.09 }
    : weaponFeedback === 'reload'
    ? { x: -4, y: -7, z: 8, rz: -1.8, rx: -3.2, scale: 1.02, duration: 0.16 }
    : { x: 0, y: 0, z: 0, rz: 0, rx: 0, scale: 1, duration: 0 };

  const swayX = mouseX * 28;
  const swayY = mouseY * 14;
  const swayRY = mouseX * 14;
  const swayRX = mouseY * -9;

  // Directional lateral kick — heavier guns kick left more, scaled by class weight.
  const lateralKick = (gun.recoil * 0.18 + recoilBuildup * 0.5) * feel.recoilMul * heavyVisualMul;
  // Vertical kick — weapons recoil UP/BACK toward the viewer (negative Y in
  // screen space) to read as a weighted impulse rather than a downward drop.
  const verticalKick = (gun.recoil * 2.6 + recoilBuildup * 6.5) * feel.recoilMul * heavyVisualMul;
  // Z-axis impulse — the entire stack pulses backward toward the camera, then
  // settles; gives the recoil weight without changing firing logic.
  const depthKick = (gun.recoil * 0.18 + recoilBuildup * 0.4) * feel.recoilMul * heavyVisualMul;

  // 5–15% size boost for foreground dominance, varied per archetype.
  const idleScale = isADS ? 2.8 : (isReloading ? 0.8 : 1.35 * feel.baseScale);

  // Easing split: a sharp impulse followed by a slower elastic-feeling return.
  // The keyframe times keep the impulse at ~10% of the cycle, with the long
  // tail dedicated to settling. Tuned independently of fireRate (purely visual).
  const recoilTimes: [number, number, number, number] = [0, 0.10, 0.55, 1];
  const recoilEase: [number, number, number, number] = [0.08, 0.0, 0.55, 1.0];

  React.useEffect(() => {
    setAssetFailed(false);
  }, [blasterAsset.src]);

  return (
    <motion.div
      className="absolute bottom-[-3vh] right-[-1.5vw] z-[55] pointer-events-none origin-bottom-right"
      animate={{
        x:       isADS ? swayX * 0.12 - 120
                       : (isShooting
                           ? [swayX, swayX - lateralKick + feedbackKick.x, swayX + lateralKick * 0.25, swayX]
                           : weaponFeedback
                           ? [swayX, swayX + feedbackKick.x, swayX]
                           : [swayX, swayX + 1.6, swayX - 0.8, swayX]),
        y:       isReloading ? 400
                : isADS ? -120
                : isFlinching ? [swayY, swayY + 62, swayY - 8, swayY]
                : isShooting
                    // Negative Y = up/back toward viewer, with a soft overshoot before settling.
                    ? [swayY, swayY - verticalKick + feedbackKick.y, swayY + 4, swayY]
                    : weaponFeedback
                    ? [swayY, swayY + feedbackKick.y, swayY]
                    : [swayY, swayY - 6, swayY - 1, swayY],
        rotateZ: isFlinching ? [0, -11, 5, 0]
                : isShooting
                    ? [swayRY, swayRY - gun.recoil * 0.85 * feel.recoilMul * heavyVisualMul + feedbackKick.rz, swayRY + 1.6, swayRY]
                    : weaponFeedback
                    ? [swayRY, swayRY + feedbackKick.rz, swayRY]
                    : [swayRY, swayRY - 0.55, swayRY + 0.2, swayRY],
        rotateX: isFlinching ? [0, -28, 0]
                : isShooting
                    ? [swayRX, swayRX - (gun.recoil * 1.4 + recoilBuildup * 1.8) * feel.recoilMul * heavyVisualMul + feedbackKick.rx, swayRX + 2.4, swayRX]
                    : weaponFeedback
                    ? [swayRX, swayRX + feedbackKick.rx, swayRX]
                    : [swayRX, swayRX - 0.5, swayRX + 0.2, swayRX],
        rotateY: isADS ? swayRY * 0.08 : swayRY,
        scale:   isShooting ? [idleScale, idleScale * 1.04 * feedbackKick.scale, idleScale * 0.97, idleScale] : weaponFeedback ? [idleScale, idleScale * feedbackKick.scale, idleScale] : idleScale,
      }}
      transition={{
        duration: isFlinching ? 0.24
                : isShooting ? feel.recoilDuration
                : weaponFeedback ? feedbackKick.duration
                : 3.8,
        times:    isShooting ? recoilTimes
                : weaponFeedback ? [0, 0.38, 1]
                : (!isFlinching && !isADS && !isReloading) ? [0, 0.35, 0.7, 1]
                : undefined,
        ease:     isFlinching ? 'easeInOut'
                : isShooting ? recoilEase
                : weaponFeedback ? 'easeOut'
                : 'easeInOut',
        repeat:   isFlinching || isShooting || weaponFeedback ? 0 : Infinity,
      }}
    >
      {/* Muzzle flash — per-weapon (or per-archetype fallback) offset so the
          bloom originates exactly at the visible barrel tip. */}
      <AnimatePresence>
        {isShooting && (
          <motion.div
            key="flash"
            initial={{ opacity: 1, scale: 0.35 }}
            animate={{ opacity: 0, scale: 4.2 * feel.flashScale }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.11, ease: 'easeOut' }}
            className="absolute z-[100] pointer-events-none mix-blend-screen"
            style={{ left: flashOffset.left, top: flashOffset.top }}
          >
            {/* Core white-hot bloom */}
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 18%, ${gun.accent}ee 42%, transparent 72%)`,
                filter: 'blur(3px)',
              }}
            />
            {/* Secondary wider glow ring */}
            <motion.div
              initial={{ opacity: 0.7, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2.0 * feel.flashScale }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${gun.accent}88 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Foam dart ejection */}
      <AnimatePresence>
        {isShooting && (
          <motion.div
            key="dart"
            initial={{ x: 200, y: 140, rotate: 0, scale: 1, opacity: 1 }}
            animate={{ x: 360 + Math.random() * 80, y: 240 + Math.random() * 80, rotate: 720, scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            className="absolute pointer-events-none z-[110]"
          >
            <div className="w-7 h-2.5 rounded-full bg-orange-500 border border-orange-700 shadow-[0_0_6px_#f97316]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-layer pseudo-3D weapon stack with a per-archetype perspective shear.
          The skew gives each weapon class a distinct lean toward the viewer. */}
      <div
        className="relative w-[300px] h-[300px] pointer-events-none origin-bottom-right"
        style={{
          transform: `translateX(20%) translateY(20%) scale(1.5) skewX(${feel.skewX}deg) skewY(${feel.skewY}deg)`,
        }}
      >
        <div className="absolute inset-0" style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}>
          <motion.div
            className="absolute inset-0 origin-right"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{
              rotateY: isADS ? -18 : -52 + mouseX * -4,
              rotateX: isADS ? -4 : 6 + mouseY * 4 - (isShooting ? 6 : 0) - (isFlinching ? 14 : 0) + feedbackKick.rx * 0.5,
              rotateZ: isADS ? 0 : -4 + mouseX * 4 + (isShooting ? 2.5 : 0) + feedbackKick.rz * 0.45,
              x:       isADS ? -48 : (isShooting ? 14 : 0) + feedbackKick.x * 0.45,
              y:       isReloading ? 400 : (isADS ? -48 : (isShooting ? -10 : 0) + feedbackKick.y * 0.5),
              // Stack pulses backward (toward viewer ⇒ +Z) on shoot, settles to 0.
              z:       isADS ? 140 : (isShooting ? depthKick + 12 : 0) + feedbackKick.z,
            }}
            transition={{
              duration: isShooting ? feel.recoilDuration : weaponFeedback ? feedbackKick.duration : (isADS ? 0.28 : 0.75),
              ease: isShooting ? recoilEase : 'easeOut',
            }}
          >
            {/* Supplied blaster PNG is the primary weapon visual. The procedural
                SVG renders only as a failure fallback so it cannot obscure or
                cheapen the real asset art. */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translateZ(${feel.depthPx}px) scale(${feel.barrelBoost})`,
                transformOrigin: '20% 50%',
                filter: 'drop-shadow(0 12px 10px rgba(0,0,0,0.55)) drop-shadow(0 2px 2px rgba(0,0,0,0.7))',
              }}
            >
              {assetFailed ? (
                <WeaponSVG gun={gun} layer="front" arch={arch} />
              ) : (
                <BlasterImage asset={blasterAsset} archetype={arch} onError={() => setAssetFailed(true)} />
              )}
              {muzzleRef && (
                <div
                  ref={muzzleRef}
                  className="absolute w-2 h-2"
                  style={{ left: muzzle.x, top: muzzle.y }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
