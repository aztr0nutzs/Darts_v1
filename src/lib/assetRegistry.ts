// ─────────────────────────────────────────────────────────────────────────────
// Asset Registry
// Centralized typed maps for arenas, targets, blasters, and darts. Every helper
// returns a safe fallback so the existing CSS/SVG renderers can take over if an
// image asset fails to load or no mapping exists.
// All asset paths are resolved via BASE_URL for dev/build/Android compatibility.
// ─────────────────────────────────────────────────────────────────────────────


function resolvePublicAsset(path: string): string {
  const normalized = path.replace(/^\/+/, '');
  const baseUrl = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
  return `${baseUrl}${normalized}`;
}

export type FallbackStyle =
  | 'cyber-bullseye'
  | 'cyber-portal'
  | 'cyber-orb'
  | 'cyber-card'
  | 'cyber-pylon';

export type WeaponFallbackType =
  | 'pistol' | 'revolver' | 'smg' | 'double' | 'shotgun' | 'carbine' | 'sniper' | 'heavy';

export type DartFallbackType = 'dart' | 'mega' | 'rival' | 'vortex' | 'rocket';

// ─── ARENAS ──────────────────────────────────────────────────────────────────

export type ArenaAssetEntry = {
  id: string;
  label: string;
  src: string;
  fallbackStyle: 'training' | 'warehouse' | 'rooftop' | 'overview';
  /** Suggested arena it best art-directs (training | warehouse | rooftop | menu). */
  recommended?: 'training' | 'warehouse' | 'rooftop' | 'menu';
};

export const arenaAssets = {
  arena_overview: {
    id: 'arena_overview',
    label: 'Arena Overview',
    src: resolvePublicAsset('game-assets/arenas/arena_overview.png'),
    fallbackStyle: 'overview',
    recommended: 'menu',
  },
  arena_gameplay_01: {
    id: 'arena_gameplay_01',
    label: 'Training Bay Concept',
    src: resolvePublicAsset('game-assets/arenas/arena_gameplay_01.png'),
    fallbackStyle: 'training',
    recommended: 'training',
  },
  arena_gameplay_02: {
    id: 'arena_gameplay_02',
    label: 'Training Lanes',
    src: resolvePublicAsset('game-assets/arenas/arena_gameplay_02.png'),
    fallbackStyle: 'training',
    recommended: 'training',
  },
  arena_gameplay_03: {
    id: 'arena_gameplay_03',
    label: 'Warehouse Rush',
    src: resolvePublicAsset('game-assets/arenas/arena_gameplay_03.png'),
    fallbackStyle: 'warehouse',
    recommended: 'warehouse',
  },
  arena_gameplay_04: {
    id: 'arena_gameplay_04',
    label: 'Skyline Rooftop',
    src: resolvePublicAsset('game-assets/arenas/arena_gameplay_04.png'),
    fallbackStyle: 'rooftop',
    recommended: 'rooftop',
  },
} as const;

export type ArenaAssetId = keyof typeof arenaAssets;

// ─── TARGETS ─────────────────────────────────────────────────────────────────

export type TargetAssetEntry = {
  id: string;
  label: string;
  src: string;
  fallbackStyle: FallbackStyle;
};

export const targetAssets = {
  // Master sheets / cards (collated reference art)
  targets_master:        { id: 'targets_master',        label: 'Targets Master Sheet',  src: resolvePublicAsset('game-assets/targets/targets_master.png'),        fallbackStyle: 'cyber-card'     },
  target_card_master_01: { id: 'target_card_master_01', label: 'Target Card 01',         src: resolvePublicAsset('game-assets/targets/target_card_master_01.png'), fallbackStyle: 'cyber-card'     },
  target_card_master_02: { id: 'target_card_master_02', label: 'Target Card 02',         src: resolvePublicAsset('game-assets/targets/target_card_master_02.png'), fallbackStyle: 'cyber-card'     },
  target_card_master_03: { id: 'target_card_master_03', label: 'Target Card 03',         src: resolvePublicAsset('game-assets/targets/target_card_master_03.png'), fallbackStyle: 'cyber-card'     },
  target_card_master_04: { id: 'target_card_master_04', label: 'Target Card 04',         src: resolvePublicAsset('game-assets/targets/target_card_master_04.png'), fallbackStyle: 'cyber-card'     },
  target_card_master_05: { id: 'target_card_master_05', label: 'Target Card 05',         src: resolvePublicAsset('game-assets/targets/target_card_master_05.png'), fallbackStyle: 'cyber-card'     },
  target_card_master_06: { id: 'target_card_master_06', label: 'Target Card 06',         src: resolvePublicAsset('game-assets/targets/target_card_master_06.png'), fallbackStyle: 'cyber-card'     },
  // Individual gameplay targets
  target_leaderboard:    { id: 'target_leaderboard',    label: 'Leaderboard Pylon',      src: resolvePublicAsset('game-assets/targets/target_leaderboard.png'),    fallbackStyle: 'cyber-pylon'    },
  target_warp_gate:      { id: 'target_warp_gate',      label: 'Warp Gate',              src: resolvePublicAsset('game-assets/targets/target_warp_gate.png'),      fallbackStyle: 'cyber-portal'   },
  target_rhythm:         { id: 'target_rhythm',         label: 'Rhythm Hazard',          src: resolvePublicAsset('game-assets/targets/target_rhythm.png'),         fallbackStyle: 'cyber-bullseye' },
  target_crystal_hive:   { id: 'target_crystal_hive',   label: 'Crystal Hive',           src: resolvePublicAsset('game-assets/targets/target_crystal_hive.png'),   fallbackStyle: 'cyber-card'     },
  target_scout_drone:    { id: 'target_scout_drone',    label: 'Scout Drone',            src: resolvePublicAsset('game-assets/targets/target_scout_drone.png'),    fallbackStyle: 'cyber-orb'      },
  target_chaos_gladiator:{ id: 'target_chaos_gladiator',label: 'Chaos Gladiator',        src: resolvePublicAsset('game-assets/targets/target_chaos_gladiator.png'),fallbackStyle: 'cyber-card'     },
  target_orbital_array:  { id: 'target_orbital_array',  label: 'Orbital Array',          src: resolvePublicAsset('game-assets/targets/target_orbital_array.png'),  fallbackStyle: 'cyber-bullseye' },
  target_data_sphere:    { id: 'target_data_sphere',    label: 'Data Sphere',            src: resolvePublicAsset('game-assets/targets/target_data_sphere.png'),    fallbackStyle: 'cyber-orb'      },
  target_sky_stacks:     { id: 'target_sky_stacks',     label: 'Sky Stacks',             src: resolvePublicAsset('game-assets/targets/target_sky_stacks.png'),     fallbackStyle: 'cyber-pylon'    },
  target_quantum_target: { id: 'target_quantum_target', label: 'Quantum Target',         src: resolvePublicAsset('game-assets/targets/target_quantum_target.png'), fallbackStyle: 'cyber-bullseye' },
} as const;

export type TargetAssetId = keyof typeof targetAssets;

// Game-internal target type → asset id mapping.
export const TARGET_TYPE_ASSET_MAP: Record<string, TargetAssetId> = {
  standard:        'target_quantum_target',
  moving:          'target_sky_stacks',
  bonus:           'target_crystal_hive',
  armored:         'target_chaos_gladiator',
  heavy_armor:     'target_data_sphere',
  exploding:       'target_rhythm',
  hostile:         'target_scout_drone',
  shielded:        'target_warp_gate',
  drone:           'target_scout_drone',
  erratic:         'target_rhythm',
  splitting:       'target_sky_stacks',
  teleporting:     'target_warp_gate',
  jammer:          'target_data_sphere',
  reflector:       'target_orbital_array',
  decoy:           'target_quantum_target',
  phantom:         'target_warp_gate',
  // Cyber variants reuse the closest concept art.
  orbital_array:   'target_orbital_array',
  code_matrix:     'target_data_sphere',
  gravity_tower:   'target_sky_stacks',
  data_sphere:     'target_data_sphere',
  warp_gate:       'target_warp_gate',
  bot_sentry:      'target_chaos_gladiator',
  kinetic_swarm:   'target_orbital_array',
  aether_pylon:    'target_leaderboard',
  astro_hive:      'target_crystal_hive',
  neural_grid:     'target_data_sphere',
  sentinel_bot:    'target_chaos_gladiator',
  phase_target:    'target_warp_gate',
  // Pickup crates use a card-style master image.
  powerup_damage:  'target_card_master_04',
  powerup_rapid:   'target_card_master_05',
  powerup_shield:  'target_card_master_06',
};

// ─── BLASTERS ────────────────────────────────────────────────────────────────

export type BlasterAssetEntry = {
  id: string;
  label: string;
  src: string;
  fallbackType: WeaponFallbackType;
  /**
   * Per-weapon muzzle offset relative to the rendered image (px, image-local).
   * Used by Gun.tsx to anchor the muzzle-flash precisely at the barrel tip
   * when the asset image is shown.
   */
  muzzleOffset?: { x: number; y: number };
};

export const blasterAssets = {
  blasters_master: {
    id: 'blasters_master',
    label: 'Blasters Master Sheet',
    src: resolvePublicAsset('game-assets/blasters/blasters_master.png'),
    fallbackType: 'pistol',
  },
  lucky_peacemaster: {
    id: 'lucky_peacemaster',
    label: 'Lucky Peacemaster',
    src: resolvePublicAsset('game-assets/blasters/blaster_lucky_peacemaster.png'),
    fallbackType: 'revolver',
    muzzleOffset: { x: 56, y: 132 },
  },
  plasma_pistol: {
    id: 'plasma_pistol',
    label: 'Plasma Pistol',
    src: resolvePublicAsset('game-assets/blasters/blaster_plasma_pistol.png'),
    fallbackType: 'pistol',
    muzzleOffset: { x: 50, y: 132 },
  },
  scout_rifle: {
    id: 'scout_rifle',
    label: 'Scout Rifle',
    src: resolvePublicAsset('game-assets/blasters/blaster_scout_rifle.png'),
    fallbackType: 'sniper',
    muzzleOffset: { x: 32, y: 130 },
  },
  double_blaster: {
    id: 'double_blaster',
    label: 'Double Blaster',
    src: resolvePublicAsset('game-assets/blasters/blaster_double_blaster.png'),
    fallbackType: 'double',
    muzzleOffset: { x: 38, y: 128 },
  },
  shadow_smg: {
    id: 'shadow_smg',
    label: 'Shadow SMG',
    src: resolvePublicAsset('game-assets/blasters/blaster_shadow_smg.png'),
    fallbackType: 'smg',
    muzzleOffset: { x: 42, y: 130 },
  },
  pulse_pistol: {
    id: 'pulse_pistol',
    label: 'Pulse Pistol',
    src: resolvePublicAsset('game-assets/blasters/blaster_pulse_pistol.png'),
    fallbackType: 'pistol',
    muzzleOffset: { x: 50, y: 130 },
  },
  dart_shotgun: {
    id: 'dart_shotgun',
    label: 'Dart Shotgun',
    src: resolvePublicAsset('game-assets/blasters/blaster_dart_shotgun.png'),
    fallbackType: 'shotgun',
    muzzleOffset: { x: 32, y: 128 },
  },
  hyper_carbine: {
    id: 'hyper_carbine',
    label: 'Hyper Carbine',
    src: resolvePublicAsset('game-assets/blasters/blaster_hyper_carbine.png'),
    fallbackType: 'carbine',
    muzzleOffset: { x: 32, y: 130 },
  },
  glow_launcher: {
    id: 'glow_launcher',
    label: 'Glow Launcher',
    src: resolvePublicAsset('game-assets/blasters/blaster_glow_launcher.png'),
    fallbackType: 'heavy',
    muzzleOffset: { x: 30, y: 130 },
  },
  turbo_pump: {
    id: 'turbo_pump',
    label: 'Turbo Pump',
    src: resolvePublicAsset('game-assets/blasters/blaster_turbo_pump.png'),
    fallbackType: 'shotgun',
    muzzleOffset: { x: 30, y: 130 },
  },
  sniper_scope: {
    id: 'sniper_scope',
    label: 'Sniper Scope',
    src: resolvePublicAsset('game-assets/blasters/blaster_sniper_scope.png'),
    fallbackType: 'sniper',
    muzzleOffset: { x: 22, y: 128 },
  },
} as const;

export type BlasterAssetId = keyof typeof blasterAssets;

/**
 * Mapping from in-game weapon ids (Gun.tsx GUNS) to the closest provided
 * blaster art. Documented here so the visual contract is reviewable in one
 * place.
 *
 *   peacemaker     -> lucky_peacemaster
 *   rusty_rev      -> lucky_peacemaster   (aesthetic 'rusty' revolver)
 *   compact_slinger-> shadow_smg
 *   iron_grip      -> pulse_pistol        (tactical revolver/pistol)
 *   boomer         -> double_blaster
 *   popper         -> plasma_pistol
 *   heavy_dart_p   -> hyper_carbine
 *   mini_sprayer   -> shadow_smg
 *   tactical_shotty-> dart_shotgun
 *   urban_carbine  -> hyper_carbine
 *   slide_prime    -> plasma_pistol
 *   scout_rifle    -> scout_rifle
 *   triple_threat  -> glow_launcher
 *   protoscope     -> sniper_scope
 *   aether_core    -> glow_launcher
 *   early_blaster  -> turbo_pump
 */
export const GUN_ID_BLASTER_MAP: Record<string, BlasterAssetId> = {
  peacemaker:      'lucky_peacemaster',
  rusty_rev:       'lucky_peacemaster',
  compact_slinger: 'shadow_smg',
  iron_grip:       'pulse_pistol',
  boomer:          'double_blaster',
  popper:          'plasma_pistol',
  heavy_dart_p:    'hyper_carbine',
  mini_sprayer:    'shadow_smg',
  tactical_shotty: 'dart_shotgun',
  urban_carbine:   'hyper_carbine',
  slide_prime:     'plasma_pistol',
  scout_rifle:     'scout_rifle',
  triple_threat:   'glow_launcher',
  protoscope:      'sniper_scope',
  aether_core:     'glow_launcher',
  early_blaster:   'turbo_pump',
};

// ─── DARTS ───────────────────────────────────────────────────────────────────

export type DartAssetEntry = {
  id: string;
  label: string;
  src: string;
  fallbackType: DartFallbackType;
  /** Optional CSS background-position when cropping from the master sheet. */
  spriteOffset?: { x: string; y: string; size: string };
};

export const dartAssets = {
  darts_tier1_master: {
    id: 'darts_tier1_master',
    label: 'Darts Tier-1 Master',
    src: resolvePublicAsset('game-assets/darts/darts_tier1_master.png'),
    fallbackType: 'dart',
  },
  // Per-shape entries crop from the master sheet; positions are tuned for the
  // 4×3 grid of the provided tier-1 sheet.
  dart_standard: {
    id: 'dart_standard',
    label: 'Elite Dart',
    src: resolvePublicAsset('game-assets/darts/darts_tier1_master.png'),
    fallbackType: 'dart',
    spriteOffset: { x: '0%', y: '0%', size: '400% 300%' },
  },
  dart_mega: {
    id: 'dart_mega',
    label: 'Mega Dart',
    src: resolvePublicAsset('game-assets/darts/darts_tier1_master.png'),
    fallbackType: 'mega',
    spriteOffset: { x: '33.33%', y: '0%', size: '400% 300%' },
  },
  dart_rival: {
    id: 'dart_rival',
    label: 'Rival Round',
    src: resolvePublicAsset('game-assets/darts/darts_tier1_master.png'),
    fallbackType: 'rival',
    spriteOffset: { x: '66.67%', y: '0%', size: '400% 300%' },
  },
  dart_vortex: {
    id: 'dart_vortex',
    label: 'Vortex Disc',
    src: resolvePublicAsset('game-assets/darts/darts_tier1_master.png'),
    fallbackType: 'vortex',
    spriteOffset: { x: '100%', y: '0%', size: '400% 300%' },
  },
  dart_rocket: {
    id: 'dart_rocket',
    label: 'Rocket',
    src: resolvePublicAsset('game-assets/darts/darts_tier1_master.png'),
    fallbackType: 'rocket',
    spriteOffset: { x: '0%', y: '50%', size: '400% 300%' },
  },
} as const;

export type DartAssetId = keyof typeof dartAssets;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// All helpers are total — they always return a valid entry, falling back to a
// safe default when the requested id is unknown. This means callers never need
// to special-case `undefined`; they can use the registry result as the source
// of truth and rely on the existing CSS/SVG renderers if the image src 404s.

const DEFAULT_BLASTER: BlasterAssetEntry = blasterAssets.lucky_peacemaster;
const DEFAULT_TARGET: TargetAssetEntry = targetAssets.target_quantum_target;
const DEFAULT_ARENA: ArenaAssetEntry = arenaAssets.arena_overview;
const DEFAULT_DART: DartAssetEntry = dartAssets.dart_standard;

export function getBlasterAsset(id: string): BlasterAssetEntry {
  if (id in blasterAssets) {
    return blasterAssets[id as BlasterAssetId];
  }
  const mapped = GUN_ID_BLASTER_MAP[id];
  if (mapped && mapped in blasterAssets) {
    return blasterAssets[mapped];
  }
  return DEFAULT_BLASTER;
}

export function getTargetAsset(type: string): TargetAssetEntry {
  if (type in targetAssets) {
    return targetAssets[type as TargetAssetId];
  }
  const mapped = TARGET_TYPE_ASSET_MAP[type];
  if (mapped && mapped in targetAssets) {
    return targetAssets[mapped];
  }
  return DEFAULT_TARGET;
}

export function getArenaAsset(id: string): ArenaAssetEntry {
  if (id in arenaAssets) {
    return arenaAssets[id as ArenaAssetId];
  }
  // Find first arena entry whose recommended scene matches the supplied id.
  for (const entry of Object.values(arenaAssets)) {
    if (entry.recommended === id) return entry;
  }
  return DEFAULT_ARENA;
}

export function getDartAsset(id: string): DartAssetEntry {
  if (id in dartAssets) {
    return dartAssets[id as DartAssetId];
  }
  // Resolve by ammo shape (dart | mega | rival | vortex | rocket).
  for (const entry of Object.values(dartAssets)) {
    if (entry.fallbackType === id) return entry;
  }
  return DEFAULT_DART;
}

/** Resolve the layered set of arenas to use for a given scene id. */
export function getArenaSceneAssets(sceneId: 'training' | 'warehouse' | 'rooftop'): {
  primary: ArenaAssetEntry;
  detail?: ArenaAssetEntry;
} {
  switch (sceneId) {
    case 'warehouse':
      return { primary: arenaAssets.arena_gameplay_03, detail: arenaAssets.arena_overview };
    case 'rooftop':
      return { primary: arenaAssets.arena_gameplay_04, detail: arenaAssets.arena_overview };
    case 'training':
    default:
      return { primary: arenaAssets.arena_gameplay_01, detail: arenaAssets.arena_gameplay_02 };
  }
}
