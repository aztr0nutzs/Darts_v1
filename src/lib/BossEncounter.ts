// ─────────────────────────────────────────────────────────────────────────────
// BossEncounter.ts — Arena boss data model & phase state machine
//
// Each arena has exactly one memorable multi-phase boss.  The boss state is
// managed independently from the GameplayDirector wave system and injected
// into the game loop at predictable milestones (every 5th wave or arena
// finale).  The GameplayDirector triggers the encounter; this module owns
// the boss lifecycle.
// ─────────────────────────────────────────────────────────────────────────────

import type { TargetData } from '../components/Target';
import type { ArenaIdForDirector } from './GameplayDirector';

// ── Boss data structures ────────────────────────────────────────────────────

export type BossPhase = 1 | 2 | 3;

export interface WeakPoint {
  id: string;
  /** Offset from boss center in viewport % */
  offsetX: number;
  offsetY: number;
  /** Whether this weak point is currently exposed (hittable) */
  exposed: boolean;
  hp: number;
  maxHp: number;
}

export interface ArmorZone {
  id: string;
  offsetX: number;
  offsetY: number;
  /** Absorbs damage when active */
  active: boolean;
  hp: number;
  maxHp: number;
}

export type BossBehaviorState =
  | 'idle'
  | 'exposing_weakpoint'
  | 'moving_lateral'
  | 'spawning_minions'
  | 'shield_rotate'
  | 'vulnerable'
  | 'sniping'
  | 'decoy_phase'
  | 'shielded_core'
  | 'defeated';

export interface BossDefinition {
  id: string;
  arenaId: ArenaIdForDirector;
  displayName: string;
  maxHp: number;
  /** HP thresholds for phase transitions (percentage remaining) */
  phaseThresholds: [number, number]; // [phase2At, phase3At] e.g. [0.66, 0.33]
  /** Points awarded on defeat */
  points: number;
  /** Visual scale multiplier */
  scale: number;
}

export interface BossState {
  id: string;
  arenaId: ArenaIdForDirector;
  displayName: string;
  phase: BossPhase;
  maxHp: number;
  currentHp: number;
  weakPoints: WeakPoint[];
  armorZones: ArmorZone[];
  behaviorState: BossBehaviorState;
  /** Boss position in viewport % */
  x: number;
  y: number;
  /** Direction for lateral movement (+1 right, -1 left) */
  moveDir: number;
  /** Timestamp of last behavior tick */
  lastTickMs: number;
  /** Timestamp boss was spawned */
  spawnedAt: number;
  /** Whether intro banner has been shown */
  introShown: boolean;
  /** Whether phase transition alert is active */
  phaseTransitionAlert: boolean;
  /** Points awarded on defeat */
  points: number;
  scale: number;
  /** Tracks spawned support targets to avoid flooding */
  supportTargetCount: number;
  /** Max concurrent support targets */
  maxSupportTargets: number;
  /** Timer for periodic spawning behavior */
  nextSpawnMs: number;
  /** Timer for weak point cycling */
  nextWeakPointCycleMs: number;
}

// ── Boss definitions per arena ──────────────────────────────────────────────

export const BOSS_DEFINITIONS: Record<ArenaIdForDirector, BossDefinition> = {
  training: {
    id: 'foam_sentinel',
    arenaId: 'training',
    displayName: 'THE FOAM SENTINEL',
    maxHp: 800,
    phaseThresholds: [0.66, 0.33],
    points: 2000,
    scale: 2.2,
  },
  warehouse: {
    id: 'neon_swarm_core',
    arenaId: 'warehouse',
    displayName: 'THE NEON SWARM CORE',
    maxHp: 1000,
    phaseThresholds: [0.60, 0.30],
    points: 3000,
    scale: 2.4,
  },
  rooftop: {
    id: 'skyline_sniper_rig',
    arenaId: 'rooftop',
    displayName: 'THE SKYLINE SNIPER RIG',
    maxHp: 900,
    phaseThresholds: [0.65, 0.30],
    points: 2500,
    scale: 2.0,
  },
};

// ── Factory: create fresh boss state ────────────────────────────────────────

function makeWeakPoints(arenaId: ArenaIdForDirector): WeakPoint[] {
  switch (arenaId) {
    case 'training':
      return [
        { id: 'wp-top',    offsetX: 0, offsetY: -3, exposed: true,  hp: 80, maxHp: 80 },
        { id: 'wp-left',   offsetX: -4, offsetY: 0, exposed: false, hp: 80, maxHp: 80 },
        { id: 'wp-right',  offsetX: 4,  offsetY: 0, exposed: false, hp: 80, maxHp: 80 },
      ];
    case 'warehouse':
      return [
        { id: 'wp-core', offsetX: 0, offsetY: 0, exposed: false, hp: 120, maxHp: 120 },
      ];
    case 'rooftop':
      return [
        { id: 'wp-dish', offsetX: 0, offsetY: -2, exposed: true, hp: 100, maxHp: 100 },
      ];
  }
}

function makeArmorZones(arenaId: ArenaIdForDirector): ArmorZone[] {
  switch (arenaId) {
    case 'training':
      return [
        { id: 'armor-front', offsetX: 0, offsetY: 0, active: true, hp: 200, maxHp: 200 },
        { id: 'armor-left',  offsetX: -3, offsetY: 1, active: true, hp: 150, maxHp: 150 },
        { id: 'armor-right', offsetX: 3, offsetY: 1, active: true, hp: 150, maxHp: 150 },
      ];
    case 'warehouse':
      return [
        { id: 'shield-a', offsetX: -3, offsetY: 0, active: false, hp: 180, maxHp: 180 },
        { id: 'shield-b', offsetX: 3,  offsetY: 0, active: false, hp: 180, maxHp: 180 },
        { id: 'shield-c', offsetX: 0,  offsetY: 3, active: false, hp: 180, maxHp: 180 },
      ];
    case 'rooftop':
      return [
        { id: 'plate-front', offsetX: 0, offsetY: 1, active: false, hp: 200, maxHp: 200 },
      ];
  }
}

export function createBossState(arenaId: ArenaIdForDirector): BossState {
  const def = BOSS_DEFINITIONS[arenaId];
  const now = Date.now();
  return {
    id: def.id,
    arenaId,
    displayName: def.displayName,
    phase: 1,
    maxHp: def.maxHp,
    currentHp: def.maxHp,
    weakPoints: makeWeakPoints(arenaId),
    armorZones: makeArmorZones(arenaId),
    behaviorState: 'idle',
    x: 50,
    y: 42,
    moveDir: 1,
    lastTickMs: now,
    spawnedAt: now,
    introShown: false,
    phaseTransitionAlert: false,
    points: def.points,
    scale: def.scale,
    supportTargetCount: 0,
    maxSupportTargets: 4,
    nextSpawnMs: now + 3000,
    nextWeakPointCycleMs: now + 4000,
  };
}

// ── Phase transition logic ──────────────────────────────────────────────────

function resolvePhase(boss: BossState): BossPhase {
  const def = BOSS_DEFINITIONS[boss.arenaId];
  const hpRatio = boss.currentHp / boss.maxHp;
  if (hpRatio <= def.phaseThresholds[1]) return 3;
  if (hpRatio <= def.phaseThresholds[0]) return 2;
  return 1;
}

// ── Behavior state for each arena/phase combo ───────────────────────────────

function behaviorForPhase(arenaId: ArenaIdForDirector, phase: BossPhase): BossBehaviorState {
  switch (arenaId) {
    case 'training':
      if (phase === 1) return 'exposing_weakpoint';
      if (phase === 2) return 'moving_lateral';
      return 'spawning_minions';
    case 'warehouse':
      if (phase === 1) return 'spawning_minions';
      if (phase === 2) return 'shield_rotate';
      return 'vulnerable';
    case 'rooftop':
      if (phase === 1) return 'sniping';
      if (phase === 2) return 'decoy_phase';
      return 'shielded_core';
  }
}

// ── Boss tick: advance behavior per frame ───────────────────────────────────

export interface BossTickResult {
  boss: BossState;
  /** Support targets to spawn this tick */
  spawnTargets: TargetData[];
  /** Whether a phase transition just occurred */
  phaseChanged: boolean;
  /** Whether the boss was just defeated */
  defeated: boolean;
}

let bossTargetIdCounter = 0;

function makeSupportTarget(type: TargetData['type'], bossX: number, bossY: number): TargetData {
  bossTargetIdCounter++;
  const offsetX = (Math.random() - 0.5) * 30;
  const offsetY = (Math.random() - 0.5) * 20;
  return {
    id: `boss-support-${bossTargetIdCounter}`,
    x: Math.max(8, Math.min(92, bossX + offsetX)),
    y: Math.max(15, Math.min(75, bossY + offsetY)),
    type,
    createdAt: Date.now(),
    lifespan: 6000,
    points: 25,
    hp: 10,
    maxHp: 10,
    scale: 0.7,
  };
}

export function tickBoss(boss: BossState, activeSupportCount: number): BossTickResult {
  const now = Date.now();
  const dt = now - boss.lastTickMs;
  const spawnTargets: TargetData[] = [];
  let phaseChanged = false;

  // Phase check
  const newPhase = resolvePhase(boss);
  if (newPhase !== boss.phase) {
    boss.phase = newPhase;
    boss.behaviorState = behaviorForPhase(boss.arenaId, newPhase);
    boss.phaseTransitionAlert = true;
    phaseChanged = true;

    // Update weak points / armor on phase change
    if (boss.arenaId === 'training') {
      if (newPhase === 2) {
        // Expose side weak points
        boss.weakPoints.forEach(wp => { wp.exposed = true; });
      } else if (newPhase === 3) {
        boss.weakPoints.forEach(wp => { wp.exposed = true; });
        boss.armorZones.forEach(az => { az.active = false; });
      }
    } else if (boss.arenaId === 'warehouse') {
      if (newPhase === 2) {
        boss.armorZones.forEach(az => { az.active = true; });
        boss.weakPoints[0].exposed = false;
      } else if (newPhase === 3) {
        boss.armorZones.forEach(az => { az.active = false; });
        boss.weakPoints[0].exposed = true;
      }
    } else if (boss.arenaId === 'rooftop') {
      if (newPhase === 2) {
        boss.weakPoints[0].exposed = false;
      } else if (newPhase === 3) {
        boss.armorZones[0].active = true;
        boss.weakPoints[0].exposed = true;
      }
    }
  }

  boss.behaviorState = behaviorForPhase(boss.arenaId, boss.phase);

  // ── Per-arena behavior tick ──
  boss.supportTargetCount = activeSupportCount;

  // Movement
  if (boss.behaviorState === 'moving_lateral') {
    const speed = 0.015 * dt;
    boss.x += speed * boss.moveDir;
    if (boss.x > 75) { boss.moveDir = -1; }
    if (boss.x < 25) { boss.moveDir = 1; }
  }

  // Weak point cycling (training phase 1)
  if (boss.arenaId === 'training' && boss.phase === 1 && now >= boss.nextWeakPointCycleMs) {
    const exposed = boss.weakPoints.filter(wp => wp.exposed && wp.hp > 0);
    if (exposed.length > 0) {
      exposed.forEach(wp => { wp.exposed = false; });
    }
    const alive = boss.weakPoints.filter(wp => wp.hp > 0);
    if (alive.length > 0) {
      const pick = alive[Math.floor(Math.random() * alive.length)];
      pick.exposed = true;
    }
    boss.nextWeakPointCycleMs = now + 3500;
  }

  // Support spawning
  if (boss.behaviorState === 'spawning_minions' || boss.behaviorState === 'decoy_phase') {
    if (now >= boss.nextSpawnMs && activeSupportCount < boss.maxSupportTargets) {
      if (boss.arenaId === 'training') {
        // Phase 3: rapid pop-up mini-targets
        spawnTargets.push(makeSupportTarget('standard', boss.x, boss.y));
        if (Math.random() < 0.5) {
          spawnTargets.push(makeSupportTarget('moving', boss.x, boss.y));
        }
      } else if (boss.arenaId === 'warehouse') {
        // Phase 1: summon drones
        spawnTargets.push(makeSupportTarget('drone', boss.x, boss.y));
        if (Math.random() < 0.4) {
          spawnTargets.push(makeSupportTarget('drone', boss.x, boss.y));
        }
      } else if (boss.arenaId === 'rooftop') {
        // Phase 2: decoy targets on side lanes
        spawnTargets.push(makeSupportTarget('decoy', 20, boss.y));
        spawnTargets.push(makeSupportTarget('decoy', 80, boss.y));
      }
      boss.nextSpawnMs = now + 2500 + Math.random() * 1500;
    }
  }

  // Warehouse phase 3: core opens briefly after drone wave clears
  if (boss.arenaId === 'warehouse' && boss.phase === 3) {
    if (activeSupportCount === 0) {
      boss.weakPoints[0].exposed = true;
    } else {
      boss.weakPoints[0].exposed = false;
    }
  }

  // Shield rotation (warehouse phase 2)
  if (boss.behaviorState === 'shield_rotate') {
    const rotateIdx = Math.floor((now / 2000) % boss.armorZones.length);
    boss.armorZones.forEach((az, i) => {
      az.active = i === rotateIdx;
    });
  }

  const defeated = boss.currentHp <= 0;
  if (defeated) {
    boss.behaviorState = 'defeated';
  }

  boss.lastTickMs = now;

  return { boss, spawnTargets, phaseChanged, defeated };
}

// ── Boss damage resolution ──────────────────────────────────────────────────

export interface BossDamageResult {
  /** Damage actually applied */
  damageDealt: number;
  /** Which zone was hit */
  hitZone: 'weak_point' | 'armor' | 'body';
  /** Whether boss was destroyed */
  destroyed: boolean;
  /** Whether a weak point was destroyed */
  weakPointDestroyed: boolean;
}

/**
 * Apply damage to the boss.  Checks armor zones first, then weak points,
 * then body.  Distance is in viewport %, relative to boss center.
 */
export function damageBoss(
  boss: BossState,
  hitX: number,
  hitY: number,
  baseDamage: number,
): BossDamageResult {
  // Check weak points first (they reward precision)
  for (const wp of boss.weakPoints) {
    if (!wp.exposed || wp.hp <= 0) continue;
    const dx = hitX - (boss.x + wp.offsetX);
    const dy = hitY - (boss.y + wp.offsetY);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 4 * boss.scale) {
      const dmg = Math.round(baseDamage * 2.0);
      wp.hp = Math.max(0, wp.hp - dmg);
      boss.currentHp = Math.max(0, boss.currentHp - dmg);
      return {
        damageDealt: dmg,
        hitZone: 'weak_point',
        destroyed: boss.currentHp <= 0,
        weakPointDestroyed: wp.hp <= 0,
      };
    }
  }

  // Check armor zones (they reduce damage)
  for (const az of boss.armorZones) {
    if (!az.active || az.hp <= 0) continue;
    const dx = hitX - (boss.x + az.offsetX);
    const dy = hitY - (boss.y + az.offsetY);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 6 * boss.scale) {
      const dmg = Math.round(baseDamage * 0.25);
      az.hp = Math.max(0, az.hp - dmg);
      boss.currentHp = Math.max(0, boss.currentHp - dmg);
      return {
        damageDealt: dmg,
        hitZone: 'armor',
        destroyed: boss.currentHp <= 0,
        weakPointDestroyed: false,
      };
    }
  }

  // Body hit
  const dx = hitX - boss.x;
  const dy = hitY - boss.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= 8 * boss.scale) {
    const dmg = Math.round(baseDamage);
    boss.currentHp = Math.max(0, boss.currentHp - dmg);
    return {
      damageDealt: dmg,
      hitZone: 'body',
      destroyed: boss.currentHp <= 0,
      weakPointDestroyed: false,
    };
  }

  // Miss
  return { damageDealt: 0, hitZone: 'body', destroyed: false, weakPointDestroyed: false };
}

// ── Should boss encounter trigger? ──────────────────────────────────────────

/**
 * Deterministic boss trigger: boss appears at wave 5, 10, or the arena finale
 * (wave 12 in endless).  Returns true if the current wave should trigger a
 * boss encounter for the given arena.
 */
export function shouldTriggerBoss(waveNumber: number, _arenaId: ArenaIdForDirector): boolean {
  // Every 5th wave is a boss encounter
  return waveNumber > 0 && waveNumber % 5 === 0;
}
