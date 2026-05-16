import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import path from "path";
import {
  createBossState,
  damageBoss,
  shouldTriggerBoss,
  tickBoss,
  type ArenaIdForDirector,
  type BossState,
  type BossSupportTarget,
} from "./src/shared/BossModel";

// ============================================================
// Authoritative Game Constants
// Mirrors client weapons / targets so server can validate and award.
// ============================================================

type TargetType =
  | 'standard' | 'moving' | 'bonus' | 'armored' | 'exploding' | 'erratic'
  | 'splitting' | 'teleporting' | 'heavy_armor'
  | 'powerup_damage' | 'powerup_rapid' | 'powerup_shield'
  | 'hostile' | 'shielded' | 'drone' | 'jammer' | 'reflector' | 'decoy' | 'phantom'
  | 'orbital_array' | 'code_matrix' | 'gravity_tower' | 'data_sphere' | 'warp_gate' | 'bot_sentry'
  | 'kinetic_swarm' | 'aether_pylon' | 'astro_hive' | 'neural_grid' | 'sentinel_bot' | 'phase_target';

interface TargetSpec {
  hp: number;
  points: number;
  lifespan: number; // ms
  scale: number;
  radius: number;  // hit radius in viewport %
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared hitbox zone model
// Mirrors src/lib/ShotResolver.ts so the server reports the same zones the
// solo resolver produces. All radii are % of viewport width and scaled by
// target.scale at hit-test time. Inner → outer:
//   weak → center → body → armor → graze → miss
// ─────────────────────────────────────────────────────────────────────────────
type HitQuality = 'weak_point' | 'center' | 'body' | 'armor' | 'graze';

interface HitboxDef {
  grazeRadius: number;
  armorRadius: number;
  bodyRadius: number;
  centerRadius: number;
  weakRadius: number;
  hasArmor: boolean;
  hasWeakPoint: boolean;
}

const DEFAULT_HB: HitboxDef = {
  grazeRadius: 5.5, armorRadius: 0, bodyRadius: 4.0, centerRadius: 2.0,
  weakRadius: 0, hasArmor: false, hasWeakPoint: false,
};
const basicHB = (gr: number, br: number, cr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, bodyRadius: br, centerRadius: cr });
const armoredHB = (gr: number, ar: number, br: number, cr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, armorRadius: ar, bodyRadius: br, centerRadius: cr, hasArmor: true });
const weakHB = (gr: number, br: number, cr: number, wr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, bodyRadius: br, centerRadius: cr, weakRadius: wr, hasWeakPoint: true });
const armoredWeakHB = (gr: number, ar: number, br: number, cr: number, wr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, armorRadius: ar, bodyRadius: br, centerRadius: cr, weakRadius: wr, hasArmor: true, hasWeakPoint: true });

const HITBOX_DEFS: Partial<Record<TargetType, HitboxDef>> = {
  standard:         basicHB(5.5, 4.0, 2.0),
  moving:           basicHB(6.0, 4.0, 2.0),
  bonus:            basicHB(4.5, 3.0, 1.5),
  erratic:          basicHB(5.5, 4.0, 2.0),
  splitting:        basicHB(5.5, 4.0, 2.0),
  teleporting:      basicHB(5.0, 3.5, 1.8),
  decoy:            basicHB(4.5, 3.0, 1.5),
  phantom:          basicHB(5.5, 4.0, 2.0),
  drone:            basicHB(4.5, 3.0, 1.5),
  exploding:        basicHB(5.5, 4.0, 2.0),
  hostile:          basicHB(6.0, 4.5, 2.2),
  jammer:           basicHB(5.5, 4.0, 2.0),
  powerup_damage:   basicHB(5.0, 3.8, 2.0),
  powerup_rapid:    basicHB(5.0, 3.8, 2.0),
  powerup_shield:   basicHB(5.0, 3.8, 2.0),
  armored:          armoredHB(6.0, 5.5, 3.5, 1.8),
  heavy_armor:      armoredHB(6.5, 6.0, 3.5, 1.8),
  shielded:         armoredHB(6.0, 5.5, 3.5, 1.8),
  reflector:        armoredHB(6.0, 5.5, 4.0, 2.0),
  orbital_array:    armoredWeakHB(9.5, 8.5, 6.5, 3.5, 2.5),
  kinetic_swarm:    armoredWeakHB(10.0, 9.0, 7.0, 3.5, 2.5),
  sentinel_bot:     armoredWeakHB(7.5, 7.0, 5.0, 2.5, 1.5),
  phase_target:     armoredWeakHB(7.5, 7.0, 5.0, 2.5, 1.5),
  warp_gate:        weakHB(9.5, 7.0, 3.5, 2.5),
  astro_hive:       weakHB(8.5, 6.5, 3.5, 2.5),
  neural_grid:      weakHB(9.0, 7.0, 3.5, 2.5),
  code_matrix:      basicHB(8.0, 6.0, 3.0),
  gravity_tower:    basicHB(8.0, 6.0, 3.0),
  data_sphere:      basicHB(8.0, 6.0, 3.0),
  bot_sentry:       basicHB(8.0, 6.0, 3.0),
  aether_pylon:     basicHB(8.5, 6.5, 3.5),
};

function getHitboxDef(type: TargetType): HitboxDef {
  return HITBOX_DEFS[type] ?? DEFAULT_HB;
}

/** Determine which zone a shot landed in for a single target. */
function classifyHit(distPct: number, scale: number, hb: HitboxDef): HitQuality | null {
  const d = distPct;
  const grazeR  = hb.grazeRadius  * scale;
  if (d > grazeR) return null;
  const weakR   = hb.weakRadius   * scale;
  const centerR = hb.centerRadius * scale;
  const bodyR   = hb.bodyRadius   * scale;
  const armorR  = hb.armorRadius  * scale;
  if (hb.hasWeakPoint && d <= weakR) return 'weak_point';
  if (d <= centerR) return 'center';
  if (d <= bodyR)   return 'body';
  if (hb.hasArmor && d <= armorR) return 'armor';
  return 'graze';
}

/** Per-zone damage multipliers (server authoritative).  Mirrors the solo logic. */
const ZONE_DAMAGE_MULT: Record<HitQuality, number> = {
  weak_point: 2.0,
  center:     1.5,
  body:       1.0,
  armor:      0.35,
  graze:      0.5,
};

const TARGET_SPECS: Record<TargetType, TargetSpec> = {
  standard:        { hp: 10,  points: 15,  lifespan: 3500, scale: 1,    radius: 7 },
  moving:          { hp: 10,  points: 30,  lifespan: 4500, scale: 1,    radius: 7 },
  bonus:           { hp: 10,  points: 75,  lifespan: 2500, scale: 1,    radius: 7 },
  armored:         { hp: 40,  points: 50,  lifespan: 5000, scale: 1,    radius: 8 },
  exploding:       { hp: 10,  points: 40,  lifespan: 3000, scale: 1,    radius: 7 },
  erratic:         { hp: 100, points: 200, lifespan: 5000, scale: 1,    radius: 8 },
  splitting:       { hp: 20,  points: 60,  lifespan: 4000, scale: 1,    radius: 8 },
  teleporting:     { hp: 30,  points: 90,  lifespan: 5000, scale: 1,    radius: 7 },
  heavy_armor:     { hp: 150, points: 150, lifespan: 8000, scale: 1.1,  radius: 9 },
  powerup_damage:  { hp: 10,  points: 0,   lifespan: 4000, scale: 0.9,  radius: 6 },
  powerup_rapid:   { hp: 10,  points: 0,   lifespan: 4000, scale: 0.9,  radius: 6 },
  powerup_shield:  { hp: 10,  points: 0,   lifespan: 4000, scale: 0.9,  radius: 6 },
  hostile:         { hp: 40,  points: 100, lifespan: 8000, scale: 1.1,  radius: 8 },
  shielded:        { hp: 60,  points: 80,  lifespan: 6500, scale: 1,    radius: 8 },
  drone:           { hp: 10,  points: 25,  lifespan: 4000, scale: 0.9,  radius: 6 },
  jammer:          { hp: 30,  points: 60,  lifespan: 6000, scale: 1,    radius: 7 },
  reflector:       { hp: 80,  points: 120, lifespan: 7000, scale: 1,    radius: 8 },
  decoy:           { hp: 10,  points: 10,  lifespan: 3000, scale: 0.8,  radius: 6 },
  phantom:         { hp: 20,  points: 100, lifespan: 5000, scale: 1,    radius: 7 },
  orbital_array:   { hp: 250, points: 300, lifespan: 12000, scale: 1.3, radius: 11 },
  code_matrix:     { hp: 150, points: 200, lifespan: 8000,  scale: 1.2, radius: 10 },
  gravity_tower:   { hp: 200, points: 250, lifespan: 10000, scale: 1.3, radius: 10 },
  data_sphere:     { hp: 180, points: 220, lifespan: 9000,  scale: 1.2, radius: 10 },
  warp_gate:       { hp: 500, points: 500, lifespan: 15000, scale: 1.4, radius: 12 },
  bot_sentry:      { hp: 200, points: 250, lifespan: 10000, scale: 1.2, radius: 10 },
  kinetic_swarm:   { hp: 200, points: 350, lifespan: 10000, scale: 1.3, radius: 11 },
  aether_pylon:    { hp: 400, points: 450, lifespan: 10000, scale: 1.3, radius: 11 },
  astro_hive:      { hp: 220, points: 320, lifespan: 11000, scale: 1.3, radius: 11 },
  neural_grid:     { hp: 200, points: 280, lifespan: 9000,  scale: 1.2, radius: 10 },
  sentinel_bot:    { hp: 120, points: 250, lifespan: 7000,  scale: 1.1, radius: 9 },
  phase_target:    { hp: 80,  points: 150, lifespan: 6000,  scale: 1,   radius: 8 },
};

interface WeaponSpec {
  damage: number;
  fireRate: number;     // ms between shots (intended)
  reloadTime: number;   // ms
  maxAmmo: number;
  blastRadius: number;  // viewport % - 0 = no AoE
  fireMode: 'semi' | 'burst' | 'auto';
}

// Mirrors src/components/Gun.tsx GUNS table; damage is gun.dartType.damage.
const WEAPON_SPECS: Record<string, WeaponSpec> = {
  peacemaker:        { damage: 10, fireRate: 300,  reloadTime: 1500, maxAmmo: 6,  blastRadius: 0, fireMode: 'semi' },
  rusty_rev:         { damage: 25, fireRate: 800,  reloadTime: 2500, maxAmmo: 5,  blastRadius: 0, fireMode: 'semi' },
  compact_slinger:   { damage: 10, fireRate: 100,  reloadTime: 1000, maxAmmo: 12, blastRadius: 0, fireMode: 'auto' },
  iron_grip:         { damage: 15, fireRate: 400,  reloadTime: 1800, maxAmmo: 6,  blastRadius: 0, fireMode: 'semi' },
  boomer:            { damage: 25, fireRate: 200,  reloadTime: 2000, maxAmmo: 2,  blastRadius: 0, fireMode: 'semi' },
  popper:            { damage: 15, fireRate: 150,  reloadTime: 1200, maxAmmo: 15, blastRadius: 0, fireMode: 'semi' },
  heavy_dart_p:      { damage: 25, fireRate: 250,  reloadTime: 3000, maxAmmo: 25, blastRadius: 0, fireMode: 'auto' },
  mini_sprayer:      { damage: 10, fireRate: 60,   reloadTime: 1500, maxAmmo: 40, blastRadius: 0, fireMode: 'auto' },
  tactical_shotty:   { damage: 25, fireRate: 600,  reloadTime: 2500, maxAmmo: 8,  blastRadius: 0, fireMode: 'semi' },
  urban_carbine:     { damage: 15, fireRate: 120,  reloadTime: 2000, maxAmmo: 30, blastRadius: 0, fireMode: 'auto' },
  slide_prime:       { damage: 10, fireRate: 400,  reloadTime: 2000, maxAmmo: 10, blastRadius: 0, fireMode: 'semi' },
  scout_rifle:       { damage: 25, fireRate: 1200, reloadTime: 2800, maxAmmo: 5,  blastRadius: 0, fireMode: 'semi' },
  triple_threat:     { damage: 25, fireRate: 500,  reloadTime: 2200, maxAmmo: 3,  blastRadius: 0, fireMode: 'semi' },
  protoscope:        { damage: 12, fireRate: 150,  reloadTime: 1800, maxAmmo: 20, blastRadius: 0, fireMode: 'auto' },
  aether_core:       { damage: 40, fireRate: 100,  reloadTime: 3500, maxAmmo: 50, blastRadius: 6, fireMode: 'auto' },
  early_blaster:     { damage: 25, fireRate: 2000, reloadTime: 3000, maxAmmo: 1,  blastRadius: 0, fireMode: 'semi' },
};

interface WaveConfig {
  id: number;
  name: string;
  objective: 'score' | 'survival' | 'accuracy' | 'hit_count' | 'timed_rush';
  objectiveValue: number;
  duration?: number;
  targetPool: TargetType[];
  spawnRateMs: number;
  maxConcurrent: number;
  swarmChance: number;
  bossTypes?: TargetType[];
}

const WAVES: WaveConfig[] = [
  { id: 1, name: 'BASIC TRAINING',  objective: 'hit_count',  objectiveValue: 15,    targetPool: ['standard','moving','bonus'], spawnRateMs: 1200, maxConcurrent: 3, swarmChance: 0 },
  { id: 2, name: 'SKIRMISH',        objective: 'hit_count',  objectiveValue: 20,    targetPool: ['standard','moving','armored','shielded'], spawnRateMs: 900,  maxConcurrent: 5, swarmChance: 0.1 },
  { id: 3, name: 'DRONE ASSAULT',   objective: 'timed_rush', objectiveValue: 25, duration: 30, targetPool: ['drone','moving','standard','exploding'], spawnRateMs: 700, maxConcurrent: 6, swarmChance: 0.3 },
  { id: 4, name: 'HEAVY RESISTANCE',objective: 'survival',   objectiveValue: 0,  duration: 30, targetPool: ['heavy_armor','shielded','reflector','hostile'], spawnRateMs: 1000, maxConcurrent: 4, swarmChance: 0.1, bossTypes: ['sentinel_bot'] },
  { id: 5, name: 'QUANTUM SHADOWS', objective: 'hit_count',  objectiveValue: 25,    targetPool: ['phase_target','teleporting','decoy','standard'], spawnRateMs: 800, maxConcurrent: 5, swarmChance: 0.2 },
  { id: 6, name: 'OVERWHELM',       objective: 'score',      objectiveValue: 10000, targetPool: ['kinetic_swarm','hostile','drone','exploding','moving'], spawnRateMs: 400, maxConcurrent: 8, swarmChance: 0.5, bossTypes: ['orbital_array','warp_gate'] },
];

const MATCH_DURATION_MS = 60_000;
const MIN_FIRE_INTERVAL_MS = 50;          // hard floor independent of weapon
const FIRE_RATE_TOLERANCE = 0.7;          // accept fires at 70% of nominal interval to allow client jitter
const MAX_DROPPED_FIRES_PER_MATCH = 200;  // sanity log threshold
const ARENA_IDS: ArenaIdForDirector[] = ['training', 'warehouse', 'rooftop'];
const ANDROID_WEBVIEW_ORIGIN = 'https://appassets.androidplatform.net';

function parseOriginList(value?: string) {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildAllowedSocketOrigins() {
  const configuredOrigins = parseOriginList(process.env.SOCKET_CORS_ORIGINS);
  if (configuredOrigins.length > 0) return configuredOrigins;

  const origins = parseOriginList(process.env.APP_URL);
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    );
  }
  origins.push(ANDROID_WEBVIEW_ORIGIN);
  return [...new Set(origins)];
}

// ============================================================
// Types
// ============================================================

interface ServerTarget {
  id: string;
  type: TargetType;
  x: number;       // viewport %
  y: number;       // viewport %
  createdAt: number;
  lifespan: number;
  hp: number;
  maxHp: number;
  points: number;
  scale: number;
  radius: number;
}

interface PublicTarget {
  id: string;
  type: TargetType;
  x: number;
  y: number;
  createdAt: number;
  lifespan: number;
  hp: number;
  maxHp: number;
  points: number;
  scale: number;
}

interface PlayerState {
  id: string;
  ready: boolean;
  score: number;
  weaponId: string;
  ammo: number;
  lastFireTs: number;
  reloadingUntil: number;
  reloadTimer: NodeJS.Timeout | null;
  fireCount: number;
  hits: number;
  droppedFires: number;
}

interface Room {
  id: string;
  players: Record<string, PlayerState>;
  targets: ServerTarget[];
  gameState: 'waiting' | 'playing' | 'gameover';
  arenaId: ArenaIdForDirector;
  waveIndex: number;
  waveStartMs: number;
  matchStartMs: number;
  totalDestroyedThisWave: number;
  activeBoss: BossState | null;
  bossDefeated: boolean;
  bossEncounterWaveIndex: number | null;
  bossPhaseTransition: { phase: number; startedAt: number } | null;
  spawnTimer: NodeJS.Timeout | null;
  tickTimer: NodeJS.Timeout | null;
  matchEndTimer: NodeJS.Timeout | null;
  targetIdCounter: number;
}

// ============================================================
// Helpers
// ============================================================

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function sanitizeRoomId(raw: unknown): string {
  return String(raw ?? '').replace(/[^A-Z0-9]/gi, '').substring(0, 10).toUpperCase();
}

function sanitizeWeaponId(raw: unknown): string {
  const s = String(raw ?? 'peacemaker');
  return WEAPON_SPECS[s] ? s : 'peacemaker';
}

function publicTarget(t: ServerTarget): PublicTarget {
  return {
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
  };
}

function publicRoom(room: Room) {
  const players: Record<string, { id: string; ready: boolean; score: number }> = {};
  for (const [id, p] of Object.entries(room.players)) {
    players[id] = { id: p.id, ready: p.ready, score: p.score };
  }
  return {
    players,
    gameState: room.gameState,
    arenaId: room.arenaId,
    waveIndex: room.waveIndex,
    waveName: WAVES[room.waveIndex]?.name ?? '',
    targets: room.targets.map(publicTarget),
    activeBoss: room.activeBoss,
    bossDefeated: room.bossDefeated,
    score: 0, // legacy field used by old client
  };
}

function buildTarget(room: Room, type: TargetType): ServerTarget {
  const spec = TARGET_SPECS[type];
  room.targetIdCounter++;
  return {
    id: `srv-${room.id}-${room.targetIdCounter}`,
    type,
    x: 15 + Math.random() * 70,
    y: 15 + Math.random() * 50,
    createdAt: Date.now(),
    lifespan: spec.lifespan,
    hp: spec.hp,
    maxHp: spec.hp,
    points: spec.points,
    scale: spec.scale,
    radius: spec.radius,
  };
}

function buildBossSupportTarget(room: Room, target: BossSupportTarget): ServerTarget {
  const spec = TARGET_SPECS[target.type];
  room.targetIdCounter++;
  return {
    id: target.id || `srv-${room.id}-${room.targetIdCounter}`,
    type: target.type,
    x: target.x,
    y: target.y,
    createdAt: target.createdAt,
    lifespan: target.lifespan,
    hp: target.hp,
    maxHp: target.maxHp,
    points: target.points,
    scale: target.scale ?? spec.scale,
    radius: spec.radius,
  };
}

function isBossWaveIndex(waveIndex: number): boolean {
  const waveNumber = waveIndex + 1;
  return shouldTriggerBoss(waveNumber, 'training') || waveIndex === WAVES.length - 1;
}

function isBossWaveLocked(room: Room): boolean {
  return room.bossEncounterWaveIndex === room.waveIndex;
}

function generateSpawn(room: Room): ServerTarget[] {
  if (room.activeBoss || isBossWaveLocked(room)) return [];
  const wave = WAVES[room.waveIndex];
  if (room.targets.length >= wave.maxConcurrent) return [];

  let pool: TargetType[] = [...wave.targetPool];
  let spawnCount = 1;

  if (Math.random() < wave.swarmChance) {
    spawnCount = 3;
    pool = pool.concat(['moving', 'drone']);
  }

  if (wave.bossTypes && wave.bossTypes.length > 0 && room.targets.length === 0 && Math.random() < 0.05) {
    const bossType = wave.bossTypes[Math.floor(Math.random() * wave.bossTypes.length)];
    return [buildTarget(room, bossType)];
  }

  if (Math.random() < 0.08) {
    const r = Math.random();
    if (r > 0.66) pool.push('powerup_damage');
    else if (r > 0.33) pool.push('powerup_rapid');
    else pool.push('powerup_shield');
  }

  const out: ServerTarget[] = [];
  const room_max = wave.maxConcurrent - room.targets.length;
  spawnCount = Math.min(spawnCount, room_max);
  for (let i = 0; i < spawnCount; i++) {
    const t = pool[Math.floor(Math.random() * pool.length)];
    out.push(buildTarget(room, t));
  }
  return out;
}

// ============================================================
// Match lifecycle
// ============================================================

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const allowedSocketOrigins = buildAllowedSocketOrigins();
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedSocketOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Socket.IO origin not allowed: ${origin}`));
      },
      credentials: false,
    },
  });

  const rooms = new Map<string, Room>();

  function clearRoomTimers(room: Room) {
    if (room.spawnTimer) { clearInterval(room.spawnTimer); room.spawnTimer = null; }
    if (room.tickTimer) { clearInterval(room.tickTimer); room.tickTimer = null; }
    if (room.matchEndTimer) { clearTimeout(room.matchEndTimer); room.matchEndTimer = null; }
    for (const p of Object.values(room.players)) {
      if (p.reloadTimer) { clearTimeout(p.reloadTimer); p.reloadTimer = null; }
    }
  }

  function spawnBossEncounter(roomId: string, room: Room) {
    room.targets = [];
    room.activeBoss = createBossState(room.arenaId);
    room.bossDefeated = false;
    room.bossEncounterWaveIndex = room.waveIndex;
    room.bossPhaseTransition = null;
    io.to(roomId).emit('boss-spawned', { boss: room.activeBoss });
    io.to(roomId).emit('room-state', publicRoom(room));
  }

  function enterWave(roomId: string, room: Room, waveIndex: number, now: number) {
    room.waveIndex = waveIndex;
    room.waveStartMs = now;
    room.totalDestroyedThisWave = 0;
    room.activeBoss = null;
    room.bossDefeated = false;
    room.bossEncounterWaveIndex = null;
    room.bossPhaseTransition = null;
    room.targets = [];

    io.to(roomId).emit('wave-update', {
      waveIndex: room.waveIndex,
      name: WAVES[room.waveIndex].name,
    });

    if (isBossWaveIndex(room.waveIndex)) {
      spawnBossEncounter(roomId, room);
      scheduleWaveSpawn(roomId, room);
      return;
    }

    scheduleWaveSpawn(roomId, room);
  }

  function scheduleWaveSpawn(roomId: string, room: Room) {
    if (room.spawnTimer) clearInterval(room.spawnTimer);
    const wave = WAVES[room.waveIndex];
    room.spawnTimer = setInterval(() => {
      if (room.gameState !== 'playing') return;
      if (room.activeBoss || isBossWaveLocked(room)) return;
      const spawns = generateSpawn(room);
      for (const t of spawns) {
        room.targets.push(t);
        io.to(roomId).emit('new-target', publicTarget(t));
      }
    }, wave.spawnRateMs);
  }

  function checkWaveProgression(room: Room): boolean {
    if (isBossWaveLocked(room)) {
      return room.bossDefeated && !room.activeBoss;
    }
    const wave = WAVES[room.waveIndex];
    const elapsed = (Date.now() - room.waveStartMs) / 1000;
    const totalScore = Object.values(room.players).reduce((s, p) => s + p.score, 0);
    switch (wave.objective) {
      case 'hit_count':
      case 'timed_rush':
        return room.totalDestroyedThisWave >= wave.objectiveValue;
      case 'score':
        return totalScore >= wave.objectiveValue;
      case 'survival':
        return elapsed >= (wave.duration ?? 30);
      case 'accuracy': {
        const hits = Object.values(room.players).reduce((s, p) => s + p.hits, 0);
        const fires = Object.values(room.players).reduce((s, p) => s + p.fireCount, 0);
        const acc = fires > 0 ? Math.round((hits / fires) * 100) : 0;
        return room.totalDestroyedThisWave >= wave.objectiveValue && acc >= 70;
      }
    }
    return false;
  }

  function scheduleTick(roomId: string, room: Room) {
    if (room.tickTimer) clearInterval(room.tickTimer);
    room.tickTimer = setInterval(() => {
      if (room.gameState !== 'playing') return;
      const now = Date.now();

      // Expire targets
      const expiredIds: string[] = [];
      const stillAlive: ServerTarget[] = [];
      for (const t of room.targets) {
        if (now - t.createdAt >= t.lifespan) expiredIds.push(t.id);
        else stillAlive.push(t);
      }
      if (expiredIds.length > 0) {
        room.targets = stillAlive;
        for (const id of expiredIds) io.to(roomId).emit('target-expired', { id });
      }

      if (room.activeBoss) {
        const supportCount = room.targets.filter(t => t.id.startsWith('boss-support-')).length;
        const result = tickBoss(room.activeBoss, supportCount);
        room.activeBoss = result.boss;

        for (const support of result.spawnTargets) {
          const target = buildBossSupportTarget(room, support);
          room.targets.push(target);
          io.to(roomId).emit('new-target', publicTarget(target));
        }

        if (result.phaseChanged) {
          room.bossPhaseTransition = { phase: result.boss.phase, startedAt: now };
          io.to(roomId).emit('boss-phase-changed', { boss: result.boss, phase: result.boss.phase });
        }

        if (result.defeated) {
          room.activeBoss = null;
          room.bossDefeated = true;
          room.bossPhaseTransition = null;
          io.to(roomId).emit('boss-defeated', { boss: result.boss });
          io.to(roomId).emit('room-state', publicRoom(room));
        } else {
          io.to(roomId).emit('boss-updated', { boss: result.boss });
        }
      }

      // Wave progression
      if (checkWaveProgression(room) && room.waveIndex < WAVES.length - 1) {
        enterWave(roomId, room, room.waveIndex + 1, now);
      }
    }, 250);
  }

  function endMatch(roomId: string, room: Room) {
    if (room.gameState !== 'playing') return;
    room.gameState = 'gameover';
    clearRoomTimers(room);
    const finalPlayers: Record<string, { id: string; score: number; hits: number; fires: number }> = {};
    for (const [id, p] of Object.entries(room.players)) {
      finalPlayers[id] = { id: p.id, score: p.score, hits: p.hits, fires: p.fireCount };
    }
    io.to(roomId).emit('game-over', { players: finalPlayers });
    io.to(roomId).emit('room-state', publicRoom(room));
  }

  function startMatch(roomId: string, room: Room) {
    clearRoomTimers(room);
    room.gameState = 'playing';
    room.targets = [];
    room.arenaId = ARENA_IDS[Math.floor(Math.random() * ARENA_IDS.length)];
    room.waveIndex = 0;
    room.waveStartMs = Date.now();
    room.matchStartMs = Date.now();
    room.totalDestroyedThisWave = 0;
    room.activeBoss = null;
    room.bossDefeated = false;
    room.bossEncounterWaveIndex = null;
    room.bossPhaseTransition = null;
    room.targetIdCounter = 0;

    for (const p of Object.values(room.players)) {
      const spec = WEAPON_SPECS[p.weaponId] ?? WEAPON_SPECS.peacemaker;
      p.score = 0;
      p.ammo = spec.maxAmmo;
      p.lastFireTs = 0;
      p.reloadingUntil = 0;
      p.fireCount = 0;
      p.hits = 0;
      p.droppedFires = 0;
      if (p.reloadTimer) { clearTimeout(p.reloadTimer); p.reloadTimer = null; }
    }

    scheduleTick(roomId, room);
    room.matchEndTimer = setTimeout(() => endMatch(roomId, room), MATCH_DURATION_MS);

    io.to(roomId).emit('game-start');
    enterWave(roomId, room, 0, room.waveStartMs);
    io.to(roomId).emit('room-state', publicRoom(room));
  }

  function leaveRoom(socket: Socket, roomId: string) {
    socket.leave(roomId);
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.players[socket.id]) {
      const p = room.players[socket.id];
      if (p.reloadTimer) clearTimeout(p.reloadTimer);
      delete room.players[socket.id];
    }
    if (Object.keys(room.players).length === 0) {
      clearRoomTimers(room);
      rooms.delete(roomId);
    } else {
      io.to(roomId).emit('room-state', publicRoom(room));
    }
  }

  // ============================================================
  // Socket handlers
  // ============================================================

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (rawRoomId) => {
      const roomId = sanitizeRoomId(rawRoomId);
      if (!roomId) {
        socket.emit("room-error", "Invalid room code.");
        return;
      }
      socket.join(roomId);
      let room = rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          players: {},
          targets: [],
          gameState: 'waiting',
          arenaId: 'training',
          waveIndex: 0,
          waveStartMs: 0,
          matchStartMs: 0,
          totalDestroyedThisWave: 0,
          activeBoss: null,
          bossDefeated: false,
          bossEncounterWaveIndex: null,
          bossPhaseTransition: null,
          spawnTimer: null,
          tickTimer: null,
          matchEndTimer: null,
          targetIdCounter: 0,
        };
        rooms.set(roomId, room);
      }
      room.players[socket.id] = {
        id: socket.id,
        ready: false,
        score: 0,
        weaponId: 'peacemaker',
        ammo: WEAPON_SPECS.peacemaker.maxAmmo,
        lastFireTs: 0,
        reloadingUntil: 0,
        reloadTimer: null,
        fireCount: 0,
        hits: 0,
        droppedFires: 0,
      };
      io.to(roomId).emit("room-state", publicRoom(room));
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("player-ready", (rawRoomId) => {
      const roomId = sanitizeRoomId(rawRoomId);
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("room-error", "Room session expired or invalid.");
        return;
      }
      const p = room.players[socket.id];
      if (!p) return;
      p.ready = true;

      const players = Object.values(room.players);
      const allReady = players.every(pl => pl.ready);
      // Require at least 2 players to begin (parity with original behavior)
      if (allReady && players.length > 1 && room.gameState !== 'playing') {
        startMatch(roomId, room);
      } else {
        io.to(roomId).emit("room-state", publicRoom(room));
      }
    });

    socket.on("return-to-lobby", (rawRoomId) => {
      const roomId = sanitizeRoomId(rawRoomId);
      const room = rooms.get(roomId);
      if (!room) return;
      clearRoomTimers(room);
      room.gameState = 'waiting';
      room.targets = [];
      room.waveIndex = 0;
      room.totalDestroyedThisWave = 0;
      room.activeBoss = null;
      room.bossDefeated = false;
      room.bossEncounterWaveIndex = null;
      room.bossPhaseTransition = null;
      for (const p of Object.values(room.players)) {
        p.ready = false;
        p.score = 0;
      }
      io.to(roomId).emit("room-state", publicRoom(room));
    });

    socket.on("weapon-switch", (payload) => {
      const roomId = sanitizeRoomId(payload?.roomId);
      const weaponId = sanitizeWeaponId(payload?.weaponId);
      const room = rooms.get(roomId);
      const p = room?.players[socket.id];
      if (!p) return;
      p.weaponId = weaponId;
      const spec = WEAPON_SPECS[weaponId];
      // Clamp ammo to new weapon's max; do NOT auto-refill (prevents free reload via swap spam)
      p.ammo = clamp(p.ammo, 0, spec.maxAmmo);
    });

    socket.on("reload", (payload) => {
      const roomId = sanitizeRoomId(payload?.roomId);
      const room = rooms.get(roomId);
      const p = room?.players[socket.id];
      if (!room || !p) return;
      if (room.gameState !== 'playing') return;
      const spec = WEAPON_SPECS[p.weaponId] ?? WEAPON_SPECS.peacemaker;
      const now = Date.now();
      if (now < p.reloadingUntil) return;
      if (p.ammo >= spec.maxAmmo) return;
      p.reloadingUntil = now + spec.reloadTime;
      if (p.reloadTimer) clearTimeout(p.reloadTimer);
      p.reloadTimer = setTimeout(() => {
        const cur = room.players[socket.id];
        if (!cur) return;
        const curSpec = WEAPON_SPECS[cur.weaponId] ?? WEAPON_SPECS.peacemaker;
        cur.ammo = curSpec.maxAmmo;
        cur.reloadTimer = null;
      }, spec.reloadTime);
    });

    socket.on("fire", (payload) => {
      const roomId = sanitizeRoomId(payload?.roomId);
      const room = rooms.get(roomId);
      const p = room?.players[socket.id];
      const clientFireId: string = String(payload?.clientFireId ?? '');
      if (!room || !p) return;
      if (room.gameState !== 'playing') {
        socket.emit('fire-result', { clientFireId, accepted: false, reason: 'not-playing' });
        return;
      }

      const weaponId = sanitizeWeaponId(payload?.weaponId);
      if (p.weaponId !== weaponId) {
        // Treat as implicit weapon switch (clamp ammo only).
        p.weaponId = weaponId;
        const newSpec = WEAPON_SPECS[weaponId];
        p.ammo = clamp(p.ammo, 0, newSpec.maxAmmo);
      }
      const spec = WEAPON_SPECS[weaponId];
      const now = Date.now();

      // Reload check
      if (now < p.reloadingUntil) {
        p.droppedFires++;
        socket.emit('fire-result', { clientFireId, accepted: false, reason: 'reloading' });
        return;
      }

      // Fire-rate limit
      const minInterval = Math.max(MIN_FIRE_INTERVAL_MS, Math.floor(spec.fireRate * FIRE_RATE_TOLERANCE));
      if (now - p.lastFireTs < minInterval) {
        p.droppedFires++;
        socket.emit('fire-result', { clientFireId, accepted: false, reason: 'rate-limited' });
        return;
      }

      // Ammo check
      if (p.ammo <= 0) {
        p.droppedFires++;
        socket.emit('fire-result', { clientFireId, accepted: false, reason: 'empty' });
        return;
      }

      // Aim sanity
      const ax = Number(payload?.aimX);
      const ay = Number(payload?.aimY);
      if (!isFinite(ax) || !isFinite(ay)) {
        socket.emit('fire-result', { clientFireId, accepted: false, reason: 'bad-aim' });
        return;
      }
      const aimX = clamp(ax, 0, 100);
      const aimY = clamp(ay, 0, 100);

      // Accept the shot
      p.lastFireTs = now;
      p.ammo -= 1;
      p.fireCount += 1;

      if (room.activeBoss) {
        const bossResult = damageBoss(room.activeBoss, aimX, aimY, spec.damage);
        if (bossResult.damageDealt > 0) {
          const isCrit = bossResult.hitZone === 'weak_point';
          p.hits += 1;

          if (bossResult.destroyed) {
            const defeatedBoss = { ...room.activeBoss, behaviorState: 'defeated' as const, currentHp: 0 };
            const points = defeatedBoss.points;
            p.score += points;
            room.totalDestroyedThisWave += 1;
            room.activeBoss = null;
            room.bossDefeated = true;
            room.bossPhaseTransition = null;

            socket.emit('fire-result', {
              clientFireId,
              accepted: true,
              hit: true,
              targetId: defeatedBoss.id,
              targetType: 'boss',
              bossHit: true,
              damage: bossResult.damageDealt,
              destroyed: true,
              isCrit,
              quality: bossResult.hitZone,
              points,
              hitX: aimX,
              hitY: aimY,
            });
            io.to(roomId).emit('boss-defeated', { boss: defeatedBoss, playerId: socket.id, points });
            io.to(roomId).emit('room-state', publicRoom(room));
            return;
          }

          const ticked = tickBoss(room.activeBoss, room.targets.filter(t => t.id.startsWith('boss-support-')).length);
          room.activeBoss = ticked.boss;
          if (ticked.phaseChanged) {
            room.bossPhaseTransition = { phase: ticked.boss.phase, startedAt: now };
            io.to(roomId).emit('boss-phase-changed', { boss: ticked.boss, phase: ticked.boss.phase });
          }

          io.to(roomId).emit('boss-updated', { boss: room.activeBoss });
          socket.emit('fire-result', {
            clientFireId,
            accepted: true,
            hit: true,
            targetId: room.activeBoss.id,
            targetType: 'boss',
            bossHit: true,
            damage: bossResult.damageDealt,
            destroyed: false,
            isCrit,
            quality: bossResult.hitZone,
            hitX: aimX,
            hitY: aimY,
          });
          io.to(roomId).emit('room-state', publicRoom(room));
          return;
        }
      }

      // Zone-based hit-test (mirrors src/lib/ShotResolver.ts).  Pick the
      // closest target whose graze radius covers the shot.
      let bestTarget: ServerTarget | null = null;
      let bestDist = Infinity;
      let bestQuality: HitQuality = 'graze';
      for (const t of room.targets) {
        const dx = aimX - t.x;
        const dy = aimY - t.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const q = classifyHit(d, t.scale ?? 1, getHitboxDef(t.type));
        if (!q) continue;
        if (d < bestDist) {
          bestDist = d;
          bestTarget = t;
          bestQuality = q;
        }
      }

      if (!bestTarget) {
        socket.emit('fire-result', { clientFireId, accepted: true, hit: false });
        return;
      }

      // Damage scaled by hit-zone quality (weak_point/center are crits)
      const isCrit = bestQuality === 'center' || bestQuality === 'weak_point';
      const zoneMult = ZONE_DAMAGE_MULT[bestQuality];
      let damage = Math.max(1, Math.round(spec.damage * zoneMult));

      // Powerups award buff visuals only; no score from them
      bestTarget.hp -= damage;

      if (bestTarget.hp > 0) {
        io.to(roomId).emit('target-update', { id: bestTarget.id, hp: bestTarget.hp });
        socket.emit('fire-result', {
          clientFireId,
          accepted: true,
          hit: true,
          targetId: bestTarget.id,
          damage,
          destroyed: false,
          isCrit,
          quality: bestQuality,
          hitX: bestTarget.x,
          hitY: bestTarget.y,
        });
        return;
      }

      // Destroyed
      const destroyedId = bestTarget.id;
      const points = bestTarget.points;
      const hitX = bestTarget.x;
      const hitY = bestTarget.y;
      const destroyedType = bestTarget.type;

      // Remove target
      room.targets = room.targets.filter(t => t.id !== destroyedId);
      p.score += points;
      p.hits += 1;
      room.totalDestroyedThisWave += 1;

      // Splash damage from blastRadius weapons
      let splashIds: string[] = [];
      if (spec.blastRadius > 0) {
        const survivors: ServerTarget[] = [];
        for (const t of room.targets) {
          const d = Math.sqrt((t.x - hitX) ** 2 + (t.y - hitY) ** 2);
          if (d <= spec.blastRadius) {
            p.score += t.points;
            p.hits += 1;
            room.totalDestroyedThisWave += 1;
            splashIds.push(t.id);
          } else {
            survivors.push(t);
          }
        }
        room.targets = survivors;
      }

      io.to(roomId).emit('target-destroyed', {
        id: destroyedId,
        playerId: socket.id,
        points,
        hitX,
        hitY,
        targetType: destroyedType,
      });
      for (const sid of splashIds) {
        io.to(roomId).emit('target-destroyed', {
          id: sid,
          playerId: socket.id,
          points: 0,
          hitX,
          hitY,
          splash: true,
        });
      }

      socket.emit('fire-result', {
        clientFireId,
        accepted: true,
        hit: true,
        targetId: destroyedId,
        damage,
        destroyed: true,
        isCrit,
        quality: bestQuality,
        points,
        hitX,
        hitY,
      });

      io.to(roomId).emit('room-state', publicRoom(room));

      if (p.droppedFires > MAX_DROPPED_FIRES_PER_MATCH) {
        console.warn(`Player ${socket.id} in ${roomId} has dropped ${p.droppedFires} fires (anti-cheat).`);
      }
    });

    // Legacy event kept for backward compatibility (solo mode clients may emit it harmlessly).
    socket.on("target-hit", () => {
      // Server is authoritative; ignore client-claimed hits.
    });

    socket.on("spawn-target", () => {
      // Server is authoritative; ignore client-claimed spawns.
    });

    socket.on("leave-room", (rawRoomId) => {
      const roomId = sanitizeRoomId(rawRoomId);
      leaveRoom(socket, roomId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      rooms.forEach((room, roomId) => {
        if (room.players[socket.id]) {
          const p = room.players[socket.id];
          if (p.reloadTimer) clearTimeout(p.reloadTimer);
          delete room.players[socket.id];
          if (Object.keys(room.players).length === 0) {
            clearRoomTimers(room);
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit("room-state", publicRoom(room));
          }
        }
      });
    });
  });

  // API routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
