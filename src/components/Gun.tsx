import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type AmmoType = {
  id: string;
  name: string;
  damage: number;
  speed: number;
  blastRadius: number;
  color: string;
  shape: 'dart' | 'mega' | 'rival' | 'vortex' | 'rocket';
};

export const AMMO: Record<string, AmmoType> = {
  standard_dart: { id: 'dart', name: 'Elite Dart', damage: 10, speed: 600, blastRadius: 0, color: '#f97316', shape: 'dart' },
  heavy_dart: { id: 'heavy', name: 'Mega Dart', damage: 25, speed: 450, blastRadius: 0, color: '#ef4444', shape: 'mega' },
  rival_ball: { id: 'rival', name: 'Rival Round', damage: 15, speed: 700, blastRadius: 0, color: '#eab308', shape: 'rival' },
  aether_pulse: { id: 'aether', name: 'Aether Pulse', damage: 40, speed: 600, blastRadius: 20, color: '#22c55e', shape: 'vortex' },
  vortex_disc: { id: 'vortex', name: 'Vortex Disc', damage: 12, speed: 400, blastRadius: 0, color: '#22d3ee', shape: 'vortex' },
};

export type GunType = {
  id: string;
  name: string;
  maxAmmo: number;
  reloadTime: number;
  dartType: AmmoType;
  color: string;
  accent: string;
  unlockCost: number;
  recoil: number;
  fireMode: 'semi' | 'burst' | 'auto';
  fireRate: number; 
  accuracy: number; 
  zoomInADS: number; 
  description: string;
  aesthetic: 'modern' | 'rusty' | 'tactical' | 'prototype' | 'classic';
};

const GUN_SPRITE_POSITIONS: Record<string, { x: number, y: number }> = {
  peacemaker: { x: 0, y: 0 },
  rusty_rev: { x: 1, y: 0 },
  compact_slinger: { x: 2, y: 0 },
  iron_grip: { x: 3, y: 0 },
  boomer: { x: 0, y: 1 },
  popper: { x: 1, y: 1 },
  heavy_dart_p: { x: 2, y: 1 },
  mini_sprayer: { x: 3, y: 1 },
  tactical_shotty: { x: 0, y: 2 },
  urban_carbine: { x: 1, y: 2 },
  slide_prime: { x: 2, y: 2 },
  scout_rifle: { x: 3, y: 2 },
  triple_threat: { x: 0, y: 3 },
  protoscope: { x: 1, y: 3 },
  aether_core: { x: 2, y: 3 },
  early_blaster: { x: 3, y: 3 },
};

export const GUNS: Record<string, GunType> = {
  peacemaker: {
    id: 'peacemaker',
    name: 'Basic Peacemaker',
    maxAmmo: 6,
    reloadTime: 1500,
    dartType: AMMO.standard_dart,
    color: '#1e40af',
    accent: '#f97316',
    unlockCost: 0,
    recoil: 15,
    fireMode: 'semi',
    fireRate: 300,
    accuracy: 0.8,
    zoomInADS: 1.2,
    description: 'RELIABLE_SIDEARM_STAPLE',
    aesthetic: 'modern'
  },
  rusty_rev: {
    id: 'rusty_rev',
    name: 'Rusty Revolutionary',
    maxAmmo: 5,
    reloadTime: 2500,
    dartType: AMMO.heavy_dart,
    color: '#78350f',
    accent: '#92400e',
    unlockCost: 400,
    recoil: 35,
    fireMode: 'semi',
    fireRate: 800,
    accuracy: 0.7,
    zoomInADS: 1.1,
    description: 'SCRAP_IRON_POWERHOUSE',
    aesthetic: 'rusty'
  },
  compact_slinger: {
    id: 'compact_slinger',
    name: 'Compact Slinger',
    maxAmmo: 12,
    reloadTime: 1000,
    dartType: AMMO.standard_dart,
    color: '#22c55e',
    accent: '#f97316',
    unlockCost: 800,
    recoil: 8,
    fireMode: 'auto',
    fireRate: 100,
    accuracy: 0.6,
    zoomInADS: 1.1,
    description: 'HIGH_MOBILITY_POPPER',
    aesthetic: 'modern'
  },
  iron_grip: {
    id: 'iron_grip',
    name: 'Iron-Grip Rev',
    maxAmmo: 6,
    reloadTime: 1800,
    dartType: AMMO.rival_ball,
    color: '#0f172a',
    accent: '#f97316',
    unlockCost: 1500,
    recoil: 20,
    fireMode: 'semi',
    fireRate: 400,
    accuracy: 0.95,
    zoomInADS: 1.3,
    description: 'TACTICAL_PRECISION_REV',
    aesthetic: 'tactical'
  },
  boomer: {
    id: 'boomer',
    name: 'Break-Action Boomer',
    maxAmmo: 2,
    reloadTime: 2000,
    dartType: AMMO.heavy_dart,
    color: '#166534',
    accent: '#2563eb',
    unlockCost: 2500,
    recoil: 50,
    fireMode: 'semi',
    fireRate: 200,
    accuracy: 0.5,
    zoomInADS: 1.2,
    description: 'DOUBLE_BARREL_IMPACT',
    aesthetic: 'classic'
  },
  popper: {
    id: 'popper',
    name: 'Slide-Action Popper',
    maxAmmo: 15,
    reloadTime: 1200,
    dartType: AMMO.rival_ball,
    color: '#3b82f6',
    accent: '#94a3b8',
    unlockCost: 3500,
    recoil: 12,
    fireMode: 'semi',
    fireRate: 150,
    accuracy: 0.85,
    zoomInADS: 1.2,
    description: 'RAPID_SLIDE_FED_UNIT',
    aesthetic: 'modern'
  },
  heavy_dart_p: {
    id: 'heavy_dart_p',
    name: 'Heavy Dart P.',
    maxAmmo: 25,
    reloadTime: 3000,
    dartType: AMMO.heavy_dart,
    color: '#1e3a8a',
    accent: '#fbbf24',
    unlockCost: 5000,
    recoil: 25,
    fireMode: 'auto',
    fireRate: 250,
    accuracy: 0.75,
    zoomInADS: 1.3,
    description: 'DRUM_FED_SUPPRESSION',
    aesthetic: 'modern'
  },
  mini_sprayer: {
    id: 'mini_sprayer',
    name: 'Mini-Sprayer',
    maxAmmo: 40,
    reloadTime: 1500,
    dartType: AMMO.standard_dart,
    color: '#e2e8f0',
    accent: '#f97316',
    unlockCost: 6500,
    recoil: 10,
    fireMode: 'auto',
    fireRate: 60,
    accuracy: 0.65,
    zoomInADS: 1.1,
    description: 'URBAN_CLOSE_QUARTERS',
    aesthetic: 'modern'
  },
  tactical_shotty: {
    id: 'tactical_shotty',
    name: 'Tactical Shotty',
    maxAmmo: 8,
    reloadTime: 2500,
    dartType: AMMO.heavy_dart,
    color: '#0f172a',
    accent: '#3b82f6',
    unlockCost: 8000,
    recoil: 45,
    fireMode: 'semi',
    fireRate: 600,
    accuracy: 0.4,
    zoomInADS: 1.2,
    description: 'WIDE_CORE_CLEARANCE',
    aesthetic: 'tactical'
  },
  urban_carbine: {
    id: 'urban_carbine',
    name: 'Urban Carbine',
    maxAmmo: 30,
    reloadTime: 2000,
    dartType: AMMO.rival_ball,
    color: '#334155',
    accent: '#f97316',
    unlockCost: 10000,
    recoil: 18,
    fireMode: 'auto',
    fireRate: 120,
    accuracy: 0.9,
    zoomInADS: 1.4,
    description: 'BALANCED_STRIKE_FORCE',
    aesthetic: 'tactical'
  },
  slide_prime: {
    id: 'slide_prime',
    name: 'Slide-Prime S.',
    maxAmmo: 10,
    reloadTime: 2000,
    dartType: AMMO.standard_dart,
    color: '#1e3a8a',
    accent: '#475569',
    unlockCost: 12500,
    recoil: 22,
    fireMode: 'semi',
    fireRate: 400,
    accuracy: 0.92,
    zoomInADS: 1.5,
    description: 'LEVER_TECH_HYBRID',
    aesthetic: 'classic'
  },
  scout_rifle: {
    id: 'scout_rifle',
    name: 'Scout Rifle',
    maxAmmo: 5,
    reloadTime: 2800,
    dartType: AMMO.heavy_dart,
    color: '#166534',
    accent: '#d97706',
    unlockCost: 15000,
    recoil: 40,
    fireMode: 'semi',
    fireRate: 1200,
    accuracy: 1.0,
    zoomInADS: 3.0,
    description: 'LONG_RANGE_PRECISION',
    aesthetic: 'classic'
  },
  triple_threat: {
    id: 'triple_threat',
    name: 'Triple-Threat',
    maxAmmo: 3,
    reloadTime: 2200,
    dartType: AMMO.heavy_dart,
    color: '#b91c1c',
    accent: '#22c55e',
    unlockCost: 18000,
    recoil: 60,
    fireMode: 'semi',
    fireRate: 500,
    accuracy: 0.8,
    zoomInADS: 1.2,
    description: 'THREE_STAGE_HEAVY_CELL',
    aesthetic: 'prototype'
  },
  protoscope: {
    id: 'protoscope',
    name: 'Prototype Scope',
    maxAmmo: 20,
    reloadTime: 1800,
    dartType: AMMO.vortex_disc,
    color: '#fde047',
    accent: '#2563eb',
    unlockCost: 22000,
    recoil: 15,
    fireMode: 'auto',
    fireRate: 150,
    accuracy: 0.94,
    zoomInADS: 2.0,
    description: 'EXPERIMENTAL_OPTIC_DRIVE',
    aesthetic: 'prototype'
  },
  aether_core: {
    id: 'aether_core',
    name: 'Aether-Core Concept',
    maxAmmo: 50,
    reloadTime: 3500,
    dartType: AMMO.aether_pulse,
    color: '#ca8a04',
    accent: '#22c55e',
    unlockCost: 35000,
    recoil: 20,
    fireMode: 'auto',
    fireRate: 100,
    accuracy: 0.88,
    zoomInADS: 1.4,
    description: 'ENERGY_CELL_STABILIZED',
    aesthetic: 'rusty'
  },
  early_blaster: {
    id: 'early_blaster',
    name: 'Early Blaster',
    maxAmmo: 1,
    reloadTime: 3000,
    dartType: AMMO.heavy_dart,
    color: '#78350f',
    accent: '#f97316',
    unlockCost: 50000,
    recoil: 80,
    fireMode: 'semi',
    fireRate: 2000,
    accuracy: 0.98,
    zoomInADS: 1.5,
    description: 'THE_ORIGINAL_FORCE',
    aesthetic: 'classic'
  },
};

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
}

const BlasterSVG = ({ gun, isFront = false, isBack = false }: { gun: GunType, isFront?: boolean, isBack?: boolean }) => {
  const primary = gun.color || '#2563eb';
  const primaryLight = isFront ? '#60a5fa' : primary;
  const primaryDark = isBack ? '#0f172a' : '#1d4ed8';
  
  const accent = gun.accent || '#f97316';
  const accentDark = isBack ? '#ea580c' : accent;

  // Determine Gun Class Shapes
  let hasStock = true;
  let barrelLength = 'medium'; // short, medium, long, bulky, double
  let magType = 'standard'; // none, small, standard, drum, tube
  let opticType = 'iron'; // iron, reflex, scope, proto
  let bodyType = 'standard'; // standard, compact, heavy

  if (gun.id === 'peacemaker' || gun.id === 'rusty_rev' || gun.id === 'iron_grip') {
    hasStock = false;
    barrelLength = 'short';
    magType = 'small';
    bodyType = 'compact';
    opticType = 'iron';
  } else if (gun.id === 'compact_slinger' || gun.id === 'mini_sprayer') {
    hasStock = false;
    barrelLength = 'short';
    magType = 'standard';
    bodyType = 'compact';
    opticType = 'reflex';
  } else if (gun.id === 'boomer') {
    hasStock = true;
    barrelLength = 'double';
    magType = 'none';
    opticType = 'iron';
  } else if (gun.id === 'tactical_shotty' || gun.id === 'popper') {
    hasStock = true;
    barrelLength = 'thick';
    magType = 'tube';
    opticType = 'iron';
  } else if (gun.id === 'scout_rifle') {
    hasStock = true;
    barrelLength = 'long';
    magType = 'small';
    opticType = 'scope';
  } else if (gun.id === 'urban_carbine' || gun.id === 'slide_prime') {
    hasStock = true;
    barrelLength = 'medium';
    magType = 'standard';
    opticType = 'reflex';
  } else if (gun.id === 'heavy_dart_p' || gun.id === 'aether_core' || gun.id === 'triple_threat' || gun.id === 'early_blaster') {
    hasStock = true;
    barrelLength = 'bulky';
    magType = 'drum';
    bodyType = 'heavy';
    opticType = 'proto';
  } else if (gun.id === 'protoscope') {
    hasStock = true;
    barrelLength = 'medium';
    magType = 'drum';
    opticType = 'scope';
  }

  // Paths
  const renderMuzzle = () => {
    switch (barrelLength) {
      case 'short': return <path d="M 170 150 L 210 150 L 210 200 L 170 190 Z" fill="url(#orangeGrad)"/>;
      case 'double': return <path d="M 50 140 L 120 140 L 120 210 L 50 210 Z" fill="url(#orangeGrad)"/>;
      case 'thick': return <path d="M 90 140 L 140 140 L 140 220 L 90 220 Z" fill="url(#orangeGrad)"/>;
      case 'long': return <path d="M 30 160 L 90 160 L 90 190 L 30 190 Z" fill="url(#orangeGrad)"/>;
      case 'bulky': return <polygon points="30,130 100,140 100,230 30,240" fill="url(#orangeGrad)"/>;
      default: return <path d="M 50 140 L 140 140 L 140 210 L 50 200 Z" fill="url(#orangeGrad)"/>;
    }
  };

  const renderBarrel = () => {
    switch (barrelLength) {
      case 'short': return <path d="M 210 160 L 260 160 L 260 210 L 210 210 Z" fill="url(#grayGrad)"/>;
      case 'double': return (
        <g>
          <path d="M 120 140 L 260 150 L 260 170 L 120 170 Z" fill="url(#grayGrad)"/>
          <path d="M 120 180 L 260 180 L 260 210 L 120 200 Z" fill="url(#grayGrad)"/>
        </g>
      );
      case 'thick': return <path d="M 140 145 L 260 145 L 260 230 L 140 220 Z" fill="url(#grayGrad)"/>;
      case 'long': return <path d="M 90 165 L 260 165 L 260 195 L 90 195 Z" fill="url(#grayGrad)"/>;
      case 'bulky': return <path d="M 100 135 L 260 140 L 260 240 L 100 230 Z" fill="url(#grayGrad)"/>;
      default: return <path d="M 130 150 L 260 150 L 260 220 L 130 220 Z" fill="url(#grayGrad)"/>;
    }
  };

  const renderBody = () => {
    switch (bodyType) {
      case 'compact': return <path d="M 260 150 L 400 150 L 420 240 L 330 240 L 290 280 L 260 280 Z" fill={`url(#${isFront ? 'bodyGradF' : (isBack ? 'bodyGradB' : 'bodyGradC')})`}/>;
      case 'heavy': return <path d="M 240 120 L 520 120 L 540 260 L 390 260 L 350 300 L 240 300 Z" fill={`url(#${isFront ? 'bodyGradF' : (isBack ? 'bodyGradB' : 'bodyGradC')})`}/>;
      default: return <path d="M 240 145 L 480 145 L 500 240 L 390 240 L 350 280 L 280 280 L 250 220 Z" fill={`url(#${isFront ? 'bodyGradF' : (isBack ? 'bodyGradB' : 'bodyGradC')})`}/>;
    }
  };

  const renderOptic = () => {
    switch (opticType) {
      case 'reflex': return (
        <g>
          <path d="M 300 110 L 330 110 L 340 145 L 290 145 Z" fill={isBack ? "#020617" : "#1e293b"} />
          {!isBack && <circle cx="315" cy="125" r="8" fill="#38bdf8" opacity="0.6"/>}
        </g>
      );
      case 'scope': return (
        <g>
          <path d="M 220 100 L 380 100 L 380 120 L 220 120 Z" fill={isBack ? "#020617" : "#1e293b"} />
          <path d="M 210 90 L 240 90 L 240 130 L 210 130 Z" fill="url(#orangeGrad)" />
          <path d="M 350 95 L 390 95 L 390 125 L 350 125 Z" fill={isBack ? "#020617" : "#1e293b"} />
          {!isBack && <circle cx="225" cy="110" r="10" fill="#38bdf8" opacity="0.6"/>}
        </g>
      );
      case 'proto': return (
        <g>
          <polygon points="280,145 320,80 380,80 340,145" fill={isBack ? "#020617" : "#1e293b"} />
          {!isBack && <circle cx="340" cy="100" r="12" fill="#ef4444" opacity="0.8"/>}
        </g>
      );
      default: return ( // iron
        <g>
          <path d="M 280 130 L 300 130 L 300 145 L 280 145 Z" fill={isBack ? "#020617" : "#1e293b"} />
          <path d="M 420 135 L 440 135 L 440 145 L 420 145 Z" fill={isBack ? "#020617" : "#1e293b"} />
        </g>
      );
    }
  };

  const renderMag = () => {
    switch (magType) {
      case 'none': return null;
      case 'tube': return <path d="M 140 220 L 280 220 L 280 235 L 140 235 Z" fill="url(#grayGrad)" />;
      case 'small': return <path d="M 270 280 L 300 280 L 290 320 L 260 320 Z" fill="url(#orangeGrad)" />;
      case 'drum': return <circle cx="320" cy="310" r="50" fill="url(#grayGrad)" />;
      default: return (
        <g>
          <path d="M 290 280 L 350 280 L 330 380 L 295 380 Z" fill="url(#orangeGrad)"/>
          <path d="M 292 280 L 348 280 L 328 378 L 297 378 Z" fill="url(#gloss)" opacity="0.5"/>
          {[...Array(4)].map((_, i) => (
             <line key={`mag-${i}`} x1="305" y1={300 + i * 20} x2="330" y2={300 + i * 20} stroke="#c2410c" strokeWidth="4" strokeLinecap="round"/>
          ))}
        </g>
      );
    }
  };

  const renderGrip = () => {
    return (
      <g>
        <path d="M 370 240 L 420 240 L 480 340 L 410 340 L 370 240 Z" fill={isBack ? "#020617" : "#0f172a"}/>
        {[...Array(5)].map((_, i) => (
           <line key={`grip-${i}`} x1={385 + i * 5} y1={255 + i * 15} x2={415 + i * 5} y2={265 + i * 15} stroke="#1e293b" strokeWidth="3" strokeLinecap="round"/>
        ))}
      </g>
    );
  };

  const renderStock = () => {
    if (!hasStock) return null;
    return (
      <g>
        <path d="M 480 145 L 600 145 L 600 220 L 530 220 L 530 260 L 460 260 Z" fill="url(#grayGrad)"/>
        <path d="M 485 150 L 595 150 L 595 215 L 530 215" fill="url(#gloss)"/>
        <path d="M 580 145 L 580 340 L 600 340 L 600 145 Z" fill={isBack ? "#1e293b" : "url(#orangeGrad)"} />
      </g>
    );
  };

  return (
    <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 drop-shadow-2xl overflow-visible">
      <defs>
        <linearGradient id={isFront ? "bodyGradF" : (isBack ? "bodyGradB" : "bodyGradC")} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryLight} />
          <stop offset="50%" stopColor={primary} />
          <stop offset="100%" stopColor={primaryDark} />
        </linearGradient>
        <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor={accent} />
          <stop offset="100%" stopColor={accentDark} />
        </linearGradient>
        <linearGradient id="grayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isBack ? "#334155" : "#94a3b8"} />
          <stop offset="50%" stopColor={isBack ? "#1e293b" : "#64748b"} />
          <stop offset="100%" stopColor={isBack ? "#0f172a" : "#475569"} />
        </linearGradient>
        <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="20%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <g>
        {renderBarrel()}
        {renderMuzzle()}
        {renderOptic()}
        {renderMag()}
        {renderBody()}
        {renderGrip()}
        {renderStock()}

        {/* Top Rail Base (Gray/Black) deeply segmented */}
        <path d="M 220 135 L 430 135 L 430 145 L 220 145 Z" fill={isBack ? "#020617" : "#1e293b"}/>
        <path d="M 220 135 L 430 135 L 430 140 L 220 140 Z" fill="url(#gloss)"/>

        {/* Cyber Glow / Tech Accent */}
        {!isBack && gun.aesthetic !== 'rusty' && gun.aesthetic !== 'classic' && (
           <circle cx="380" cy="180" r="4" fill="#38bdf8" filter="blur(1px)"/>
        )}

        {/* Hand/Glove Gripping the Blaster (Only shown on Middle/Front layers) */}
        {isFront && (
          <g>
            {/* Glove base */}
            <path d="M 380 230 Q 360 280 430 350 Q 480 320 440 230 Z" fill="#1e293b" />
            {/* Glove knuckles/fingers */}
            <path d="M 390 280 Q 370 260 380 240" stroke="#334155" strokeWidth="15" strokeLinecap="round" fill="none"/>
            <path d="M 405 295 Q 385 270 395 245" stroke="#334155" strokeWidth="15" strokeLinecap="round" fill="none"/>
            <path d="M 420 310 Q 400 280 410 250" stroke="#334155" strokeWidth="15" strokeLinecap="round" fill="none"/>
            <path d="M 435 325 Q 415 290 425 260" stroke="#334155" strokeWidth="15" strokeLinecap="round" fill="none"/>
            {/* Glove Highlights */}
            <path d="M 385 285 Q 440 330 440 240" stroke="#475569" strokeWidth="4" fill="none" opacity="0.5"/>
          </g>
        )}
      </g>
    </svg>
  );
};

export default function Gun({ 
  gun, 
  isShooting, 
  isReloading, 
  isFlinching = false, 
  mouseX = 0, 
  mouseY = 0,
  recoilBuildup = 0,
  isADS = false,
  muzzleRef
}: GunProps) {
  const isSniper = gun.id === 'scout_rifle';
  const isHeavy = gun.aesthetic === 'prototype' || gun.aesthetic === 'rusty';
  const hasMissile = gun.dartType.id === 'heavy';
  const isRusty = gun.aesthetic === 'rusty';
  const isTactical = gun.aesthetic === 'tactical';
  const isModern = gun.aesthetic === 'modern';
  const isClassic = gun.aesthetic === 'classic';

  // Determine Gun Class Shapes to find Muzzle offset
  let barrelLength = 'medium';
  if (gun.id === 'peacemaker' || gun.id === 'rusty_rev' || gun.id === 'iron_grip') {
    barrelLength = 'short';
  } else if (gun.id === 'compact_slinger' || gun.id === 'mini_sprayer') {
    barrelLength = 'short';
  } else if (gun.id === 'boomer') {
    barrelLength = 'double';
  } else if (gun.id === 'tactical_shotty' || gun.id === 'popper') {
    barrelLength = 'thick';
  } else if (gun.id === 'scout_rifle') {
    barrelLength = 'long';
  } else if (gun.id === 'heavy_dart_p' || gun.id === 'aether_core' || gun.id === 'triple_threat' || gun.id === 'early_blaster') {
    barrelLength = 'bulky';
  }

  const getMuzzleCoords = () => {
    switch (barrelLength) {
      case 'short': return { x: 170, y: 175 };
      case 'double': return { x: 50, y: 175 };
      case 'thick': return { x: 90, y: 180 };
      case 'long': return { x: 30, y: 175 };
      case 'bulky': return { x: 30, y: 185 };
      default: return { x: 50, y: 175 };
    }
  };

  const muzzleCoords = getMuzzleCoords();

  // Calculate sway based on mouse position
  const swayX = mouseX * 30; 
  const swayY = mouseY * 15; 
  const swayRotateY = mouseX * 15; 
  const swayRotateX = mouseY * -10; 

  return (
    <motion.div 
      className="absolute bottom-[-5vh] right-[-2vw] z-50 pointer-events-none origin-bottom-right"
      style={{ x: 0 }}
      animate={{
        x: isADS ? swayX * 0.15 - 120 : swayX,
        y: isReloading ? 400 : (isADS ? -120 : (isFlinching ? [swayY, swayY + 60, swayY - 10, swayY] : (isShooting ? [swayY, swayY + gun.recoil * 3 + (recoilBuildup * 8), swayY] : [swayY, swayY - 6, swayY]))),
        rotateZ: isFlinching ? [0, -12, 6, 0] : (isShooting ? [swayRotateY, swayRotateY - (gun.recoil * 0.9), swayRotateY] : [swayRotateY, swayRotateY - 0.4, swayRotateY]),
        rotateX: isFlinching ? [0, -30, 0] : (isShooting ? [swayRotateX, swayRotateX - (gun.recoil * 1.5 + (recoilBuildup * 2)), swayRotateX] : swayRotateX),
        rotateY: isADS ? swayRotateY * 0.1 : swayRotateY,
        scale: isADS ? 2.8 : (isReloading ? 0.8 : 1.35),
      }}
      transition={{ 
        duration: isFlinching ? 0.25 : (isShooting ? 0.08 : 3.5), 
        times: isShooting ? [0, 0.15, 1] : undefined,
        ease: isFlinching ? "easeInOut" : (isShooting ? "easeOut" : "easeInOut"),
        repeat: isFlinching || isShooting ? 0 : Infinity,
      }}
    >
      <AnimatePresence>
        {isShooting && (
          <motion.div
            initial={{ opacity: 1, scale: 0.5, y: -40, x: -60, rotate: Math.random() * 360 }}
            animate={{ opacity: 0, scale: 5, y: -120, x: -100, rotate: Math.random() * 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="absolute top-[10%] left-[10%] -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none mix-blend-screen"
          >
            {/* High-tech Muzzle Flash */}
            <div className={`w-64 h-64 rounded-full blur-xl bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,${gun.accent}dd_40%,transparent_80%)]`} />
            <div className={`absolute inset-0 flex items-center justify-center`}>
               <div className="w-1 h-96 bg-white blur-sm rotate-45 transform" />
               <div className="w-1 h-96 bg-white blur-sm -rotate-45 transform" />
            </div>
            <div className={`absolute inset-0 rotate-45 border-[8px] border-${gun.accent} opacity-80 blur-md scale-150 rounded-full`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case Ejection Effect */}
      <AnimatePresence>
        {isShooting && (
           <motion.div
              initial={{ x: 200, y: 150, rotate: 0, scale: 1, opacity: 1 }}
              animate={{ x: 350 + Math.random() * 100, y: 250 + Math.random() * 100, rotate: 360 * 2, scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute pointer-events-none z-[110]"
           >
              <div className="w-8 h-3 rounded-md bg-yellow-600 shadow-[0_0_10px_#ca8a04] border border-yellow-800" />
           </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="relative w-[300px] h-[300px] pointer-events-none origin-bottom-right" 
        style={{ 
          transform: 'translateX(20%) translateY(20%) scale(1.5)'
        }}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            perspective: '1500px',
            transformStyle: 'preserve-3d',
          }}
        >
           <motion.div
             className="absolute inset-0 origin-right"
             style={{ transformStyle: 'preserve-3d' }}
             animate={{
               rotateY: isADS ? -20 : -55 + (mouseX * -5),
               rotateX: isADS ? -5 : 5 + (mouseY * 5) - (isShooting ? 5 : 0) - (isFlinching ? 15 : 0),
               rotateZ: isADS ? 0 : -5 + (mouseX * 5) + (isShooting ? 3 : 0),
               x: isADS ? -50 : (isShooting ? 15 : 0),
               y: isReloading ? 400 : (isADS ? -50 : (isShooting ? 15 : 0)),
               z: isADS ? 150 : (isShooting ? -20 : 0),
             }}
             transition={{
                duration: isShooting ? 0.12 : (isADS ? 0.3 : 0.8),
                ease: "easeOut"
             }}
           >
              {/* Layer 1: Back/Dark shadow */}
              <div className="absolute inset-0" style={{ transform: 'translateZ(-15px)' }}>
                <BlasterSVG gun={gun} isBack={true} />
              </div>
              
              {/* Layer 2: Core Body */}
              <div className="absolute inset-0" style={{ transform: 'translateZ(0px)' }}>
                <BlasterSVG gun={gun} />
              </div>

              {/* Layer 3: Details & Front */}
              <div className="absolute inset-0" style={{ transform: 'translateZ(15px)' }}>
                <BlasterSVG gun={gun} isFront={true} />
                {muzzleRef && (
                  <div 
                    ref={muzzleRef} 
                    className="absolute w-2 h-2" 
                    style={{ left: muzzleCoords.x, top: muzzleCoords.y }} 
                  />
                )}
              </div>

              {/* Layer 4: Foregrip / Hand wrapper */}
              <div className="absolute inset-0" style={{ transform: 'translateZ(25px)' }}>
                <svg width="600" height="400" viewBox="0 0 600 400">
                  <path d="M 330 250 Q 360 220, 390 230 Q 390 280, 360 320 Q 320 300, 330 250 Z" fill="#0f172a" />
                  <path d="M 400 230 Q 420 230, 440 260 Q 430 310, 400 310 Z" fill="#0f172a" />
                  <path d="M 370 240 Q 390 240, 410 270" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" fill="none" />
                </svg>
              </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
