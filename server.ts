import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import path from "path";

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
  waveIndex: number;
  waveStartMs: number;
  matchStartMs: number;
  totalDestroyedThisWave: number;
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
    waveIndex: room.waveIndex,
    waveName: WAVES[room.waveIndex]?.name ?? '',
    targets: room.targets.map(publicTarget),
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

function generateSpawn(room: Room): ServerTarget[] {
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
  const io = new Server(httpServer, {
    cors: { origin: "*" },
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

  function scheduleWaveSpawn(roomId: string, room: Room) {
    if (room.spawnTimer) clearInterval(room.spawnTimer);
    const wave = WAVES[room.waveIndex];
    room.spawnTimer = setInterval(() => {
      if (room.gameState !== 'playing') return;
      const spawns = generateSpawn(room);
      for (const t of spawns) {
        room.targets.push(t);
        io.to(roomId).emit('new-target', publicTarget(t));
      }
    }, wave.spawnRateMs);
  }

  function checkWaveProgression(room: Room): boolean {
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

      // Wave progression
      if (checkWaveProgression(room) && room.waveIndex < WAVES.length - 1) {
        room.waveIndex += 1;
        room.waveStartMs = now;
        room.totalDestroyedThisWave = 0;
        io.to(roomId).emit('wave-update', {
          waveIndex: room.waveIndex,
          name: WAVES[room.waveIndex].name,
        });
        scheduleWaveSpawn(roomId, room);
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
    room.waveIndex = 0;
    room.waveStartMs = Date.now();
    room.matchStartMs = Date.now();
    room.totalDestroyedThisWave = 0;
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

    scheduleWaveSpawn(roomId, room);
    scheduleTick(roomId, room);
    room.matchEndTimer = setTimeout(() => endMatch(roomId, room), MATCH_DURATION_MS);

    io.to(roomId).emit('game-start');
    io.to(roomId).emit('wave-update', { waveIndex: 0, name: WAVES[0].name });
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
          waveIndex: 0,
          waveStartMs: 0,
          matchStartMs: 0,
          totalDestroyedThisWave: 0,
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

      // Hitbox: closest target whose center is within its radius of the aim
      let bestTarget: ServerTarget | null = null;
      let bestDist = Infinity;
      for (const t of room.targets) {
        const dx = aimX - t.x;
        const dy = aimY - t.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= t.radius && d < bestDist) {
          bestTarget = t;
          bestDist = d;
        }
      }

      if (!bestTarget) {
        socket.emit('fire-result', { clientFireId, accepted: true, hit: false });
        return;
      }

      // Damage with center bonus
      const isCrit = bestDist < bestTarget.radius * 0.4;
      let damage = spec.damage;
      if (isCrit) damage = Math.round(damage * 1.5);

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
