import { TargetData } from '../components/Target';
import { shouldTriggerBoss } from './BossEncounter';

// Arena identifier mirrors ArenaScene's ArenaId without creating a circular
// component import.  Kept in sync manually since both sets are tiny.
export type ArenaIdForDirector = 'training' | 'warehouse' | 'rooftop';

export type WaveObjective = 'score' | 'survival' | 'accuracy' | 'hit_count' | 'timed_rush';
export type WaveIntensity = 'rest' | 'build' | 'normal' | 'intense' | 'boss';

// Signature wave classification.  'standard' = the default 12-wave library.
// The other entries identify the three signature wave patterns added on top
// of the existing system to create memorable gameplay moments.
export type WaveType = 'standard' | 'swarm_rush' | 'sniper_lane' | 'armored_wall';

export interface WaveConfig {
  id: number;
  name: string;
  objective: WaveObjective;
  objectiveValue: number;
  duration?: number;
  targetPool: TargetData['type'][];
  spawnRateMs: number;
  maxConcurrent: number;
  swarmChance: number;
  intensity: WaveIntensity;
  bossTypes?: TargetData['type'][];
  powerupChance: number;
  depthBias: 'close' | 'mid' | 'far' | 'any';
  lanePattern: 'center' | 'spread' | 'flanks' | 'any';
  waveType?: WaveType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Spawn layout — named lanes corresponding to physical arena features.
// Targets are placed in plausible areas (rails, lanes, drone air-zone, boss
// platform) instead of random empty space.
// ─────────────────────────────────────────────────────────────────────────────

export type SpawnLane =
  | 'left_rail'
  | 'close_lane'
  | 'mid_lane'
  | 'far_lane'
  | 'right_rail'
  | 'drone_lane'
  | 'boss_platform';

interface LaneRect {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
}

// Coordinates are viewport % (0-100) and tuned to match ArenaScene layouts:
//   floor stands sit ~top:74%, sliding rail at top:60%, spawn doors at top:50%.
const LANE_RECTS: Record<SpawnLane, LaneRect> = {
  // Outer rails — moving / shielded / reflector targets glide along these
  left_rail:     { xMin:  6, xMax: 18, yMin: 40, yMax: 64 },
  right_rail:    { xMin: 82, xMax: 94, yMin: 40, yMax: 64 },
  // Three depth-banded lanes across the centre
  close_lane:    { xMin: 22, xMax: 78, yMin: 56, yMax: 70 },
  mid_lane:      { xMin: 22, xMax: 78, yMin: 38, yMax: 54 },
  far_lane:      { xMin: 22, xMax: 78, yMin: 22, yMax: 36 },
  // Air zone reserved for drones / phantoms
  drone_lane:    { xMin: 12, xMax: 88, yMin: 12, yMax: 30 },
  // Centre boss platform (sandbag platform in the foreground)
  boss_platform: { xMin: 38, xMax: 62, yMin: 60, yMax: 70 },
};

const DEPTH_TO_LANES: Record<'close' | 'mid' | 'far' | 'any', SpawnLane[]> = {
  close: ['close_lane', 'left_rail', 'right_rail'],
  mid:   ['mid_lane', 'left_rail', 'right_rail'],
  far:   ['far_lane', 'drone_lane'],
  any:   ['close_lane', 'mid_lane', 'far_lane', 'left_rail', 'right_rail'],
};

/**
 * Choose a believable lane for a given target type.  Falls back to
 * `defaultLane` when the type isn't strongly typed to a fixture.
 */
function laneForType(type: TargetData['type'], defaultLane: SpawnLane): SpawnLane {
  switch (type) {
    case 'drone':
    case 'phantom':
      return 'drone_lane';
    case 'moving':
      // Moving targets ride a rail; pick one of the side rails when the
      // default would put them in mid-air.
      return defaultLane === 'left_rail' || defaultLane === 'right_rail'
        ? defaultLane
        : (Math.random() < 0.5 ? 'left_rail' : 'right_rail');
    case 'reflector':
      // Reflectors prefer side rails (mirror-mounted on lane edges)
      return Math.random() < 0.5 ? 'left_rail' : 'right_rail';
    case 'orbital_array':
    case 'warp_gate':
    case 'neural_grid':
    case 'kinetic_swarm':
    case 'astro_hive':
    case 'aether_pylon':
    case 'sentinel_bot':
    case 'phase_target':
      // Bosses/large structures occupy the boss platform
      return 'boss_platform';
    case 'powerup_damage':
    case 'powerup_rapid':
    case 'powerup_shield':
      // Powerups float in the close lane so the player can grab them
      return 'close_lane';
    default:
      return defaultLane;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Weapon profiles mapped from gun IDs in Gun.tsx
// ─────────────────────────────────────────────────────────────────────────────

type WeaponProfile = 'precision' | 'heavy' | 'auto' | 'standard';

const WEAPON_PROFILES: Record<string, WeaponProfile> = {
  scout_rifle:  'precision',
  slide_prime:  'precision',
  iron_grip:    'precision',
  protoscope:   'precision',
  popper:       'precision',
  boomer:       'heavy',
  tactical_shotty: 'heavy',
  rusty_rev:    'heavy',
  heavy_dart_p: 'heavy',
  triple_threat:'heavy',
  compact_slinger: 'auto',
  mini_sprayer: 'auto',
  urban_carbine: 'auto',
  aether_core:  'auto',
  early_blaster: 'auto',
};

// ─────────────────────────────────────────────────────────────────────────────
// Arena spawn bias — extra target types appended to the wave's pool when the
// match is staged in a given arena.  Each arena gets a distinct gameplay flavor
// without overriding the curated wave progression: bias entries are *added*
// alongside existing pool entries, so wave structure stays intact.
//
//   training  → "standard + moving" — readable, clean shooting-bay feel.
//   warehouse → "drones + erratic + splitting" — cluttered close-quarters.
//   rooftop   → "sniper + shielded + teleporting" — long-range precision.
// ─────────────────────────────────────────────────────────────────────────────

const ARENA_TYPE_BIAS: Record<ArenaIdForDirector, TargetData['type'][]> = {
  training:  ['standard', 'standard', 'moving'],
  warehouse: ['drone', 'drone', 'erratic', 'splitting'],
  rooftop:   ['phase_target', 'shielded', 'teleporting'],
};

// Per-arena depth + swarm tweaks.  Mild adjustments only — never overriding a
// wave's intent, just nudging the feel.
const ARENA_TUNING: Record<ArenaIdForDirector, { depthShift?: 'close' | 'mid' | 'far'; swarmDelta?: number }> = {
  training:  { swarmDelta: -0.05 },
  warehouse: { swarmDelta:  0.10 },
  rooftop:   { depthShift: 'far', swarmDelta: -0.10 },
};

// ─────────────────────────────────────────────────────────────────────────────
// 12-wave library
// ─────────────────────────────────────────────────────────────────────────────

export const WAVES: WaveConfig[] = [
  // ── Wave 1: CALIBRATION — gentle intro ────────────────────────────
  {
    id: 1, name: 'CALIBRATION',
    objective: 'hit_count', objectiveValue: 10,
    targetPool: ['standard', 'standard', 'moving', 'bonus'],
    spawnRateMs: 900, maxConcurrent: 4, swarmChance: 0.08,
    intensity: 'rest', powerupChance: 0.05,
    depthBias: 'mid', lanePattern: 'spread',
  },
  // ── Wave 2: SKIRMISH — build-up ───────────────────────────────────
  {
    id: 2, name: 'SKIRMISH',
    objective: 'hit_count', objectiveValue: 18,
    targetPool: ['standard', 'moving', 'moving', 'drone', 'armored', 'bonus'],
    spawnRateMs: 780, maxConcurrent: 5, swarmChance: 0.16,
    intensity: 'build', powerupChance: 0.07,
    depthBias: 'any', lanePattern: 'spread',
  },
  // ── Wave 3: ARMOR BREACH — introduce armored foes ─────────────────
  {
    id: 3, name: 'ARMOR BREACH',
    objective: 'hit_count', objectiveValue: 18,
    targetPool: ['armored', 'armored', 'shielded', 'heavy_armor', 'standard', 'bonus'],
    spawnRateMs: 820, maxConcurrent: 5, swarmChance: 0.10,
    intensity: 'normal', powerupChance: 0.06,
    depthBias: 'mid', lanePattern: 'spread',
  },
  // ── Wave 4: DRONE SWARM — fast, intense ───────────────────────────
  {
    id: 4, name: 'DRONE SWARM',
    objective: 'timed_rush', objectiveValue: 25, duration: 30,
    targetPool: ['drone', 'drone', 'moving', 'exploding', 'standard'],
    spawnRateMs: 650, maxConcurrent: 7, swarmChance: 0.35,
    intensity: 'intense', powerupChance: 0.08,
    depthBias: 'far', lanePattern: 'any',
  },
  // ── Wave 5: RECON PAUSE — rest after swarm ────────────────────────
  {
    id: 5, name: 'RECON PAUSE',
    objective: 'hit_count', objectiveValue: 8,
    targetPool: ['bonus', 'bonus', 'standard', 'moving', 'powerup_rapid'],
    spawnRateMs: 950, maxConcurrent: 3, swarmChance: 0,
    intensity: 'rest', powerupChance: 0.22,
    depthBias: 'mid', lanePattern: 'center',
  },
  // ── Wave 6: HEAVY LINE — armored wall ─────────────────────────────
  {
    id: 6, name: 'HEAVY LINE',
    objective: 'survival', objectiveValue: 0, duration: 35,
    targetPool: ['heavy_armor', 'shielded', 'reflector', 'hostile', 'armored'],
    spawnRateMs: 1050, maxConcurrent: 5, swarmChance: 0.10,
    intensity: 'normal', bossTypes: ['sentinel_bot'],
    powerupChance: 0.06, depthBias: 'close', lanePattern: 'spread',
  },
  // ── Wave 7: QUANTUM SHADOWS — tricky evasive targets ──────────────
  {
    id: 7, name: 'QUANTUM SHADOWS',
    objective: 'hit_count', objectiveValue: 22,
    targetPool: ['phase_target', 'teleporting', 'decoy', 'erratic', 'standard'],
    spawnRateMs: 850, maxConcurrent: 5, swarmChance: 0.15,
    intensity: 'normal', powerupChance: 0.07,
    depthBias: 'any', lanePattern: 'any',
  },
  // ── Wave 8: HOSTILE INCURSION — enemies fire back ─────────────────
  {
    id: 8, name: 'HOSTILE INCURSION',
    objective: 'survival', objectiveValue: 0, duration: 30,
    targetPool: ['hostile', 'hostile', 'jammer', 'drone', 'exploding'],
    spawnRateMs: 800, maxConcurrent: 6, swarmChance: 0.25,
    intensity: 'intense', powerupChance: 0.08,
    depthBias: 'mid', lanePattern: 'flanks',
  },
  // ── Wave 9: SURGE — score burst push ──────────────────────────────
  {
    id: 9, name: 'SURGE',
    objective: 'score', objectiveValue: 8000,
    targetPool: ['kinetic_swarm', 'exploding', 'moving', 'drone', 'hostile'],
    spawnRateMs: 500, maxConcurrent: 8, swarmChance: 0.45,
    intensity: 'intense', powerupChance: 0.07,
    depthBias: 'far', lanePattern: 'any',
  },
  // ── Wave 10: SUPPLY DROP — accuracy rest moment ───────────────────
  {
    id: 10, name: 'SUPPLY DROP',
    objective: 'accuracy', objectiveValue: 8,
    targetPool: ['bonus', 'bonus', 'standard', 'standard'],
    spawnRateMs: 1800, maxConcurrent: 2, swarmChance: 0,
    intensity: 'rest', powerupChance: 0.32,
    depthBias: 'mid', lanePattern: 'spread',
  },
  // ── Wave 11: SENTINEL PROTOCOL — boss wave ────────────────────────
  {
    id: 11, name: 'SENTINEL PROTOCOL',
    objective: 'survival', objectiveValue: 0, duration: 40,
    targetPool: ['drone', 'hostile', 'armored', 'moving'],
    spawnRateMs: 900, maxConcurrent: 6, swarmChance: 0.20,
    intensity: 'boss', bossTypes: ['sentinel_bot', 'phase_target'],
    powerupChance: 0.06, depthBias: 'any', lanePattern: 'flanks',
  },
  // ── Wave 12: ORBITAL ASSAULT — climax boss wave ───────────────────
  {
    id: 12, name: 'ORBITAL ASSAULT',
    objective: 'score', objectiveValue: 15000,
    targetPool: ['kinetic_swarm', 'hostile', 'drone', 'exploding', 'moving'],
    spawnRateMs: 450, maxConcurrent: 9, swarmChance: 0.50,
    intensity: 'boss', bossTypes: ['orbital_array', 'warp_gate', 'neural_grid'],
    powerupChance: 0.08, depthBias: 'any', lanePattern: 'any',
  },

  // ─────────────────────────────────────────────────────────────────
  // SIGNATURE WAVES — injected on top of the curated mode sequences
  // by GameplayDirector via weighted chance.  They are intentionally
  // excluded from MODE_SEQUENCES so the base 12-wave progression is
  // never altered when these are absent.
  // ─────────────────────────────────────────────────────────────────

  // ── Wave 13: SWARM RUSH — short, frantic multi-lane burst ─────────
  {
    id: 13, name: 'SWARM RUSH',
    waveType: 'swarm_rush',
    objective: 'timed_rush', objectiveValue: 30, duration: 9,
    targetPool: ['drone', 'drone', 'drone', 'moving', 'moving', 'bonus'],
    spawnRateMs: 280, maxConcurrent: 10, swarmChance: 0.70,
    intensity: 'intense', powerupChance: 0.05,
    depthBias: 'any', lanePattern: 'any',
  },
  // ── Wave 14: SNIPER LANE — rewards accuracy on far small targets ──
  {
    id: 14, name: 'SNIPER LANE',
    waveType: 'sniper_lane',
    objective: 'accuracy', objectiveValue: 12,
    targetPool: ['phase_target', 'teleporting', 'drone', 'erratic'],
    spawnRateMs: 1700, maxConcurrent: 3, swarmChance: 0,
    intensity: 'normal', powerupChance: 0.04,
    depthBias: 'far', lanePattern: 'center',
  },
  // ── Wave 15: ARMORED WALL — sustained fire vs heavy targets ───────
  {
    id: 15, name: 'ARMORED WALL',
    waveType: 'armored_wall',
    objective: 'survival', objectiveValue: 0, duration: 32,
    targetPool: ['heavy_armor', 'heavy_armor', 'shielded', 'armored'],
    spawnRateMs: 1500, maxConcurrent: 4, swarmChance: 0.05,
    intensity: 'normal', bossTypes: ['sentinel_bot'],
    powerupChance: 0.05, depthBias: 'mid', lanePattern: 'spread',
  },
];

// Array indices of signature wave entries inside WAVES (0-based).
const SIGNATURE_WAVE_INDEX = {
  swarm_rush:   12,
  sniper_lane:  13,
  armored_wall: 14,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Mode → wave sequence index arrays (0-based into WAVES)
// ─────────────────────────────────────────────────────────────────────────────

const MODE_SEQUENCES: Record<string, number[]> = {
  // classic: curated 6-wave arc that fits a 60-second match
  classic:    [0, 1, 2, 3, 4, 5],
  // endless: all 12, then procedural escalation past the end
  endless:    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  // timeAttack: 5 fast-paced waves for a 30-second sprint
  timeAttack: [0, 3, 2, 7, 5],
  // targetRush: hit-count waves with lots of spawns
  targetRush: [0, 1, 3, 6, 8],
  // hardcore: full 12-wave gauntlet, no rest
  hardcore:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-type stat table
// ─────────────────────────────────────────────────────────────────────────────

interface TargetStats {
  points: number;
  hp: number;
  lifespan: number;
  scale: number;
}

const TARGET_STATS: Partial<Record<TargetData['type'], TargetStats>> = {
  warp_gate:      { points: 500, hp: 500, lifespan: 15000, scale: 1.8 },
  orbital_array:  { points: 300, hp: 250, lifespan: 12000, scale: 1.6 },
  aether_pylon:   { points: 450, hp: 400, lifespan: 10000, scale: 1.5 },
  neural_grid:    { points: 350, hp: 300, lifespan: 11000, scale: 1.6 },
  code_matrix:    { points: 200, hp: 150, lifespan:  8000, scale: 1.4 },
  kinetic_swarm:  { points: 350, hp: 200, lifespan: 10000, scale: 1.5 },
  gravity_tower:  { points: 200, hp: 150, lifespan:  8000, scale: 1.4 },
  data_sphere:    { points: 200, hp: 150, lifespan:  8000, scale: 1.4 },
  bot_sentry:     { points: 200, hp: 150, lifespan:  8000, scale: 1.4 },
  hostile:        { points: 100, hp:  40, lifespan:  8000, scale: 1.0 },
  sentinel_bot:   { points: 250, hp: 120, lifespan:  7000, scale: 1.5 },
  astro_hive:     { points: 300, hp: 200, lifespan:  9000, scale: 1.5 },
  phase_target:   { points: 150, hp:  80, lifespan:  6000, scale: 1.0 },
  shielded:       { points:  80, hp:  60, lifespan:  6500, scale: 1.0 },
  heavy_armor:    { points: 150, hp: 150, lifespan:  8000, scale: 1.1 },
  armored:        { points:  50, hp:  40, lifespan:  5000, scale: 1.0 },
  reflector:      { points: 120, hp:  80, lifespan:  7000, scale: 1.0 },
  teleporting:    { points:  90, hp:  30, lifespan:  5000, scale: 0.9 },
  erratic:        { points: 200, hp: 100, lifespan:  5000, scale: 0.9 },
  decoy:          { points:  10, hp:  10, lifespan:  3000, scale: 0.8 },
  drone:          { points:  25, hp:  10, lifespan:  4000, scale: 0.8 },
  exploding:      { points:  40, hp:  10, lifespan:  3000, scale: 1.0 },
  jammer:         { points:  60, hp:  30, lifespan:  5000, scale: 1.0 },
  moving:         { points:  30, hp:  10, lifespan:  4500, scale: 1.0 },
  bonus:          { points:  75, hp:  10, lifespan:  2500, scale: 0.8 },
  powerup_damage: { points:   0, hp:  10, lifespan:  4000, scale: 0.9 },
  powerup_rapid:  { points:   0, hp:  10, lifespan:  4000, scale: 0.9 },
  powerup_shield: { points:   0, hp:  10, lifespan:  4000, scale: 0.9 },
};

const DEFAULT_STATS: TargetStats = { points: 15, hp: 10, lifespan: 3500, scale: 1.0 };

// ─────────────────────────────────────────────────────────────────────────────
// GameplayDirector class
// ─────────────────────────────────────────────────────────────────────────────

export class GameplayDirector {
  private sequenceIndex: number = 0;  // position within the mode's wave sequence
  private currentWave: WaveConfig;
  private waveStartTime: number = 0;
  private waveTargetsHit: number = 0;
  private waveScoreStart: number = 0;
  private idCounter: number = 0;
  private mode: string = 'classic';
  private sequence: number[] = MODE_SEQUENCES.classic;
  // Tracks the last sequence index that ran a signature wave so the same
  // injection cannot fire on consecutive waves.
  private lastSignatureSeqIndex: number = -2;
  // Active arena, used to bias spawn selection toward the arena's signature
  // target mix.  Defaults to training when not set.
  private arenaId: ArenaIdForDirector = 'training';

  // ── Boss encounter integration ──────────────────────────────────────────
  // Tracks whether a boss encounter is currently active.  When active the
  // director pauses normal wave progression and target spawning to let the
  // boss own the stage.  The App layer manages the boss lifecycle; the
  // director only gates spawns and wave advancement.
  private bossActive: boolean = false;
  private bossDefeatedThisMatch: boolean = false;

  constructor() {
    this.currentWave = WAVES[0];
  }

  startMatch(mode: string = 'classic', arenaId?: ArenaIdForDirector) {
    this.mode = mode;
    if (arenaId) this.arenaId = arenaId;
    this.sequence = MODE_SEQUENCES[mode] ?? MODE_SEQUENCES.classic;
    this.sequenceIndex = 0;
    this.lastSignatureSeqIndex = -2;
    this.bossActive = false;
    this.bossDefeatedThisMatch = false;
    this._applySequenceIndex(0, 0);
  }

  setArena(arenaId: ArenaIdForDirector) {
    this.arenaId = arenaId;
  }

  // ── Boss encounter helpers ──────────────────────────────────────────────

  /** Returns the active arena id. */
  getArenaId(): ArenaIdForDirector {
    return this.arenaId;
  }

  /**
   * Check if the current wave number should trigger a boss encounter.
   * Uses deterministic rules: every 5th wave (1-indexed) spawns the boss.
   * Boss is not triggered in multiplayer (server would need full boss state).
   */
  shouldSpawnBoss(waveNumber: number): boolean {
    if (this.bossActive) return false;
    if (this.mode === 'multiplayer') return false;
    return shouldTriggerBoss(waveNumber, this.arenaId);
  }

  /** Called by App when a boss encounter starts.  Pauses normal spawning. */
  setBossActive(active: boolean) {
    this.bossActive = active;
    if (!active) {
      this.bossDefeatedThisMatch = true;
    }
  }

  /** Whether a boss encounter is currently running. */
  isBossActive(): boolean {
    return this.bossActive;
  }

  startWave(seqIndex: number, currentScore: number = 0) {
    this._applySequenceIndex(seqIndex, currentScore);
  }

  getWaveIndex() {
    return this.sequenceIndex;
  }

  getWaveName(): string {
    return this.currentWave.name;
  }

  getMaxWaves(): number {
    return this.sequence.length;
  }

  getWaveConfig(): WaveConfig {
    return this._effectiveConfig();
  }

  handleTargetDestroyed(_type: string) {
    this.waveTargetsHit++;
  }

  checkWaveCompletion(currentScore: number, accuracy: number): boolean {
    const wave = this.currentWave;
    const elapsed = (Date.now() - this.waveStartTime) / 1000;

    switch (wave.objective) {
      case 'hit_count':  return this.waveTargetsHit >= wave.objectiveValue;
      case 'score':      return (currentScore - this.waveScoreStart) >= wave.objectiveValue;
      case 'survival':   return elapsed >= (wave.duration ?? 30);
      case 'accuracy':   return this.waveTargetsHit >= wave.objectiveValue && accuracy >= 70;
      case 'timed_rush': return this.waveTargetsHit >= wave.objectiveValue;
    }
    return false;
  }

  generateSpawn(activeTargetCount: number, weaponId: string): TargetData[] {
    // When a boss encounter is active the director yields all spawning to the
    // boss behavior system.  Normal wave targets are suppressed.
    if (this.bossActive) return [];

    const config = this._effectiveConfig();
    if (activeTargetCount >= config.maxConcurrent) return [];

    const profile: WeaponProfile = WEAPON_PROFILES[weaponId] ?? 'standard';
    let typePool = [...config.targetPool];
    let depthBias = config.depthBias;
    let swarmChance = config.swarmChance;

    // ── Weapon training: tune spawns to match the equipped weapon ──
    if (profile === 'precision') {
      // Precision rifles reward accurate long-range shots
      typePool.push('phase_target', 'teleporting', 'erratic');
      depthBias = 'far';
      swarmChance = Math.max(0, swarmChance - 0.08);
    } else if (profile === 'heavy') {
      // Heavy blasters are rewarded with armored targets they can crack
      typePool.push('armored', 'heavy_armor', 'armored', 'shielded');
      if (depthBias === 'far') depthBias = 'mid'; // bring targets closer
      swarmChance = Math.max(swarmChance, 0.12);
    } else if (profile === 'auto') {
      // Auto-blasters excel in swarms
      typePool.push('drone', 'moving', 'bonus');
      swarmChance = Math.min(0.9, swarmChance + 0.22);
    }

    // ── Arena bias: append the arena's signature targets to the pool and
    //    nudge depth / swarm to match the arena's feel.  Bias never replaces
    //    wave content — it stacks alongside it so curated progression stays
    //    intact even with arena flavour applied.
    const arenaBias = ARENA_TYPE_BIAS[this.arenaId];
    if (arenaBias?.length) {
      typePool = typePool.concat(arenaBias);
    }
    const arenaTune = ARENA_TUNING[this.arenaId];
    if (arenaTune?.depthShift && depthBias === 'any') depthBias = arenaTune.depthShift;
    if (typeof arenaTune?.swarmDelta === 'number') {
      swarmChance = Math.max(0, Math.min(0.9, swarmChance + arenaTune.swarmDelta));
    }

    // ── Boss spawn: when the arena clears, give the boss a stage ───
    if (config.bossTypes?.length && activeTargetCount === 0 && Math.random() < 0.06) {
      const boss = config.bossTypes[Math.floor(Math.random() * config.bossTypes.length)];
      return [this._makeTarget(boss, depthBias, config.lanePattern)];
    }

    // ── Powerup injection ─────────────────────────────────────────
    if (this.mode !== 'hardcore' && Math.random() < config.powerupChance) {
      const r = Math.random();
      const pu: TargetData['type'] = r > 0.66 ? 'powerup_damage' : r > 0.33 ? 'powerup_rapid' : 'powerup_shield';
      typePool.push(pu);
    }

    // ── Swarm burst ───────────────────────────────────────────────
    let spawnCount = 1;
    if (Math.random() < swarmChance) {
      // SWARM RUSH bursts saturate multiple lanes simultaneously to sell
      // the signature multi-lane feel; other waves keep the original 3.
      spawnCount = config.waveType === 'swarm_rush' ? 4 : profile === 'auto' ? 4 : 3;
      typePool.push('moving', 'drone');
    }

    const spawns: TargetData[] = [];
    for (let i = 0; i < spawnCount; i++) {
      if (activeTargetCount + spawns.length >= config.maxConcurrent) break;
      const type = typePool[Math.floor(Math.random() * typePool.length)];
      spawns.push(this._makeTarget(type, depthBias, config.lanePattern));
    }
    return spawns;
  }

  // ── Private helpers ────────────────────────────────────────────────

  private _applySequenceIndex(seqIndex: number, currentScore: number) {
    // Allow the sequence to loop from a mid-point for classic/timeAttack
    const loopStart = this.mode === 'endless' || this.mode === 'hardcore' ? 0 : 2;
    const clampedIndex = seqIndex < this.sequence.length
      ? seqIndex
      : loopStart + ((seqIndex - loopStart) % Math.max(1, this.sequence.length - loopStart));

    this.sequenceIndex = clampedIndex;

    const waveArrayIndex = this.sequence[clampedIndex] ?? this.sequence[this.sequence.length - 1];
    this.currentWave = { ...WAVES[waveArrayIndex] };

    // Signature wave injection: replaces the resolved base wave with one of
    // the three signature patterns when wave-number gating + weighted RNG
    // succeed.  Base mode sequences are untouched, so progression is fully
    // preserved when nothing is injected.
    const injected = this._maybeInjectSignatureWave(clampedIndex);
    if (injected) {
      this.currentWave = injected;
      this.lastSignatureSeqIndex = clampedIndex;
    }

    this.waveStartTime = Date.now();
    this.waveTargetsHit = 0;
    this.waveScoreStart = currentScore;
  }

  /**
   * Decide whether to override the current wave with a signature pattern.
   * Returns the chosen WaveConfig, or null to keep the base wave.
   *
   * Triggers depend on:
   *   • wave number  — earliest opt-in is wave 3, gating ramps up
   *   • intensity    — never overrides 'rest' or 'boss' slots
   *   • adjacency    — never back-to-back signature waves
   *   • weighted RNG — base chance scaled by wave number / mode
   */
  private _maybeInjectSignatureWave(seqIndex: number): WaveConfig | null {
    if (seqIndex < 2) return null;
    if (this.lastSignatureSeqIndex === seqIndex - 1) return null;

    const baseIntensity = this.currentWave.intensity;
    if (baseIntensity === 'rest' || baseIntensity === 'boss') return null;

    const waveNumber = seqIndex + 1;

    let chance = 0;
    if (waveNumber >= 3) chance = 0.22;
    if (waveNumber >= 6) chance = 0.28;
    if (waveNumber >= 9) chance = 0.33;
    if (this.mode === 'hardcore') chance += 0.10;

    if (Math.random() >= chance) return null;

    // Weighted pick — biases keep the early game readable, push variety later:
    //   swarm_rush:   strongest in waves 3–6 (intro burst moment)
    //   armored_wall: peaks mid-arc (waves 4–9)
    //   sniper_lane:  more likely from wave 6 onwards (mastery test)
    const swarmW  = waveNumber <= 6 ? 3 : 1;
    const armorW  = waveNumber >= 4 && waveNumber <= 9 ? 3 : 2;
    const sniperW = waveNumber >= 6 ? 3 : 1;
    const total = swarmW + armorW + sniperW;
    const r = Math.random() * total;

    let pickIdx: number;
    if (r < swarmW) pickIdx = SIGNATURE_WAVE_INDEX.swarm_rush;
    else if (r < swarmW + armorW) pickIdx = SIGNATURE_WAVE_INDEX.armored_wall;
    else pickIdx = SIGNATURE_WAVE_INDEX.sniper_lane;

    return { ...WAVES[pickIdx] };
  }

  private _effectiveConfig(): WaveConfig {
    // For endless mode past the known waves, escalate difficulty procedurally.
    if (this.mode === 'endless' && this.sequenceIndex >= this.sequence.length) {
      return this._proceduralEndlessConfig();
    }

    let config = { ...this.currentWave };

    // Hardcore: 50% faster, no rest breathing room
    if (this.mode === 'hardcore') {
      config.spawnRateMs = Math.round(config.spawnRateMs * 0.55);
      config.swarmChance = Math.min(0.9, config.swarmChance + 0.12);
      config.powerupChance = 0;
      config.maxConcurrent = Math.min(12, config.maxConcurrent + 1);
    }

    // TimeAttack: tighter windows, everything moves faster
    if (this.mode === 'timeAttack') {
      config.spawnRateMs = Math.round(config.spawnRateMs * 0.75);
      config.maxConcurrent = Math.min(10, config.maxConcurrent + 1);
    }

    return config;
  }

  private _proceduralEndlessConfig(): WaveConfig {
    const overflow = this.sequenceIndex - this.sequence.length;
    const escalation = Math.floor(overflow / 2);

    const bossCandidates: TargetData['type'][] = [
      'orbital_array', 'warp_gate', 'neural_grid', 'kinetic_swarm', 'sentinel_bot'
    ];
    const elitePool: TargetData['type'][] = [
      'kinetic_swarm', 'hostile', 'drone', 'exploding', 'moving', 'heavy_armor'
    ];
    if (overflow >= 3) elitePool.push('orbital_array', 'warp_gate');
    if (overflow >= 5) elitePool.push('neural_grid', 'aether_pylon', 'gravity_tower');

    return {
      id: 12 + overflow + 1,
      name: overflow % 2 === 0 ? 'ENDLESS SURGE' : 'CRITICAL MASS',
      objective: overflow % 3 === 0 ? 'survival' : 'score',
      objectiveValue: overflow % 3 === 0 ? 0 : 10000 + escalation * 3000,
      duration: 30,
      targetPool: elitePool,
      spawnRateMs: Math.max(280, 450 - escalation * 25),
      maxConcurrent: Math.min(12, 9 + Math.floor(escalation / 2)),
      swarmChance: Math.min(0.85, 0.5 + escalation * 0.05),
      intensity: overflow % 4 === 0 ? 'boss' : 'intense',
      bossTypes: overflow % 4 === 0 ? [bossCandidates[escalation % bossCandidates.length]] : undefined,
      powerupChance: 0.05,
      depthBias: 'any',
      lanePattern: 'any',
    };
  }

  private _makeTarget(type: TargetData['type'], depthBias: WaveConfig['depthBias'], lanePattern: WaveConfig['lanePattern']): TargetData {
    this.idCounter++;

    // Pick a default lane that respects the wave's depth bias and pattern
    const candidateLanes = this._candidateLanes(depthBias, lanePattern);
    const defaultLane = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];

    // Then route each target type to a believable fixture (rail, drone air,
    // boss platform, etc.).  Falls back to the default lane otherwise.
    const lane: SpawnLane = laneForType(type, defaultLane);
    const rect = LANE_RECTS[lane];
    const x = rect.xMin + Math.random() * (rect.xMax - rect.xMin);
    const y = rect.yMin + Math.random() * (rect.yMax - rect.yMin);

    const stats = TARGET_STATS[type] ?? DEFAULT_STATS;

    return {
      id: `tgt-${this.idCounter}`,
      x,
      y,
      type,
      createdAt: Date.now(),
      lifespan: stats.lifespan,
      points: stats.points,
      hp: stats.hp,
      maxHp: stats.hp,
      scale: stats.scale,
    };
  }

  /** Combine wave depth bias with lane pattern to a list of candidate lanes. */
  private _candidateLanes(depthBias: WaveConfig['depthBias'], lanePattern: WaveConfig['lanePattern']): SpawnLane[] {
    const depthLanes = DEPTH_TO_LANES[depthBias] ?? DEPTH_TO_LANES.any;

    switch (lanePattern) {
      case 'center':
        // Centred: drop side rails entirely, prefer mid_lane
        return depthLanes.filter(l => l !== 'left_rail' && l !== 'right_rail');
      case 'flanks':
        // Flanks: only side rails plus the air-zone for drones
        return ['left_rail', 'right_rail', ...(depthLanes.includes('drone_lane') ? ['drone_lane' as SpawnLane] : [])];
      case 'spread':
        return depthLanes;
      default:
        return depthLanes;
    }
  }
}
