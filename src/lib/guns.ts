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

export type Archetype = 'pistol' | 'revolver' | 'smg' | 'double' | 'shotgun' | 'carbine' | 'sniper' | 'heavy';

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
  archetype: Archetype;
};

export const GUNS: Record<string, GunType> = {
  peacemaker: {
    id: 'peacemaker', name: 'Basic Peacemaker', archetype: 'pistol',
    maxAmmo: 6, reloadTime: 1500, dartType: AMMO.standard_dart,
    color: '#1e40af', accent: '#f97316', unlockCost: 0,
    recoil: 15, fireMode: 'semi', fireRate: 300, accuracy: 0.80,
    zoomInADS: 1.2, description: 'RELIABLE_SIDEARM_STAPLE', aesthetic: 'modern',
  },
  rusty_rev: {
    id: 'rusty_rev', name: 'Rusty Revolutionary', archetype: 'revolver',
    maxAmmo: 5, reloadTime: 2500, dartType: AMMO.heavy_dart,
    color: '#78350f', accent: '#92400e', unlockCost: 400,
    recoil: 35, fireMode: 'semi', fireRate: 800, accuracy: 0.70,
    zoomInADS: 1.1, description: 'SCRAP_IRON_POWERHOUSE', aesthetic: 'rusty',
  },
  compact_slinger: {
    id: 'compact_slinger', name: 'Compact Slinger', archetype: 'smg',
    maxAmmo: 12, reloadTime: 1000, dartType: AMMO.standard_dart,
    color: '#22c55e', accent: '#f97316', unlockCost: 800,
    recoil: 8, fireMode: 'auto', fireRate: 100, accuracy: 0.60,
    zoomInADS: 1.1, description: 'HIGH_MOBILITY_POPPER', aesthetic: 'modern',
  },
  iron_grip: {
    id: 'iron_grip', name: 'Iron-Grip Rev', archetype: 'revolver',
    maxAmmo: 6, reloadTime: 1800, dartType: AMMO.rival_ball,
    color: '#0f172a', accent: '#f97316', unlockCost: 1500,
    recoil: 20, fireMode: 'semi', fireRate: 400, accuracy: 0.95,
    zoomInADS: 1.3, description: 'TACTICAL_PRECISION_REV', aesthetic: 'tactical',
  },
  boomer: {
    id: 'boomer', name: 'Break-Action Boomer', archetype: 'double',
    maxAmmo: 2, reloadTime: 2000, dartType: AMMO.heavy_dart,
    color: '#166534', accent: '#2563eb', unlockCost: 2500,
    recoil: 50, fireMode: 'semi', fireRate: 200, accuracy: 0.50,
    zoomInADS: 1.2, description: 'DOUBLE_BARREL_IMPACT', aesthetic: 'classic',
  },
  popper: {
    id: 'popper', name: 'Slide-Action Popper', archetype: 'pistol',
    maxAmmo: 15, reloadTime: 1200, dartType: AMMO.rival_ball,
    color: '#3b82f6', accent: '#94a3b8', unlockCost: 3500,
    recoil: 12, fireMode: 'semi', fireRate: 150, accuracy: 0.85,
    zoomInADS: 1.2, description: 'RAPID_SLIDE_FED_UNIT', aesthetic: 'modern',
  },
  heavy_dart_p: {
    id: 'heavy_dart_p', name: 'Heavy Dart P.', archetype: 'carbine',
    maxAmmo: 25, reloadTime: 3000, dartType: AMMO.heavy_dart,
    color: '#1e3a8a', accent: '#fbbf24', unlockCost: 5000,
    recoil: 25, fireMode: 'auto', fireRate: 250, accuracy: 0.75,
    zoomInADS: 1.3, description: 'DRUM_FED_SUPPRESSION', aesthetic: 'modern',
  },
  mini_sprayer: {
    id: 'mini_sprayer', name: 'Mini-Sprayer', archetype: 'smg',
    maxAmmo: 40, reloadTime: 1500, dartType: AMMO.standard_dart,
    color: '#e2e8f0', accent: '#f97316', unlockCost: 6500,
    recoil: 10, fireMode: 'auto', fireRate: 60, accuracy: 0.65,
    zoomInADS: 1.1, description: 'URBAN_CLOSE_QUARTERS', aesthetic: 'modern',
  },
  tactical_shotty: {
    id: 'tactical_shotty', name: 'Tactical Shotty', archetype: 'shotgun',
    maxAmmo: 8, reloadTime: 2500, dartType: AMMO.heavy_dart,
    color: '#0f172a', accent: '#3b82f6', unlockCost: 8000,
    recoil: 45, fireMode: 'semi', fireRate: 600, accuracy: 0.40,
    zoomInADS: 1.2, description: 'WIDE_CORE_CLEARANCE', aesthetic: 'tactical',
  },
  urban_carbine: {
    id: 'urban_carbine', name: 'Urban Carbine', archetype: 'carbine',
    maxAmmo: 30, reloadTime: 2000, dartType: AMMO.rival_ball,
    color: '#334155', accent: '#f97316', unlockCost: 10000,
    recoil: 18, fireMode: 'auto', fireRate: 120, accuracy: 0.90,
    zoomInADS: 1.4, description: 'BALANCED_STRIKE_FORCE', aesthetic: 'tactical',
  },
  slide_prime: {
    id: 'slide_prime', name: 'Slide-Prime S.', archetype: 'pistol',
    maxAmmo: 10, reloadTime: 2000, dartType: AMMO.standard_dart,
    color: '#1e3a8a', accent: '#475569', unlockCost: 12500,
    recoil: 22, fireMode: 'semi', fireRate: 400, accuracy: 0.92,
    zoomInADS: 1.5, description: 'LEVER_TECH_HYBRID', aesthetic: 'classic',
  },
  scout_rifle: {
    id: 'scout_rifle', name: 'Scout Rifle', archetype: 'sniper',
    maxAmmo: 5, reloadTime: 2800, dartType: AMMO.heavy_dart,
    color: '#166534', accent: '#d97706', unlockCost: 15000,
    recoil: 40, fireMode: 'semi', fireRate: 1200, accuracy: 1.00,
    zoomInADS: 3.0, description: 'LONG_RANGE_PRECISION', aesthetic: 'classic',
  },
  triple_threat: {
    id: 'triple_threat', name: 'Triple-Threat', archetype: 'heavy',
    maxAmmo: 3, reloadTime: 2200, dartType: AMMO.heavy_dart,
    color: '#b91c1c', accent: '#22c55e', unlockCost: 18000,
    recoil: 60, fireMode: 'semi', fireRate: 500, accuracy: 0.80,
    zoomInADS: 1.2, description: 'THREE_STAGE_HEAVY_CELL', aesthetic: 'prototype',
  },
  protoscope: {
    id: 'protoscope', name: 'Prototype Scope', archetype: 'sniper',
    maxAmmo: 20, reloadTime: 1800, dartType: AMMO.vortex_disc,
    color: '#fde047', accent: '#2563eb', unlockCost: 22000,
    recoil: 15, fireMode: 'auto', fireRate: 150, accuracy: 0.94,
    zoomInADS: 2.0, description: 'EXPERIMENTAL_OPTIC_DRIVE', aesthetic: 'prototype',
  },
  aether_core: {
    id: 'aether_core', name: 'Aether-Core Concept', archetype: 'heavy',
    maxAmmo: 50, reloadTime: 3500, dartType: AMMO.aether_pulse,
    color: '#ca8a04', accent: '#22c55e', unlockCost: 35000,
    recoil: 20, fireMode: 'auto', fireRate: 100, accuracy: 0.88,
    zoomInADS: 1.4, description: 'ENERGY_CELL_STABILIZED', aesthetic: 'rusty',
  },
  early_blaster: {
    id: 'early_blaster', name: 'Early Blaster', archetype: 'heavy',
    maxAmmo: 1, reloadTime: 3000, dartType: AMMO.heavy_dart,
    color: '#78350f', accent: '#f97316', unlockCost: 50000,
    recoil: 80, fireMode: 'semi', fireRate: 2000, accuracy: 0.98,
    zoomInADS: 1.5, description: 'THE_ORIGINAL_FORCE', aesthetic: 'classic',
  },
};
