import { TargetData } from '../components/Target';

export type WaveObjective = 'score' | 'survival' | 'accuracy' | 'hit_count' | 'timed_rush';

export interface WaveConfig {
  id: number;
  name: string;
  objective: WaveObjective;
  objectiveValue: number; 
  duration?: number; 
  targetPool: string[]; 
  spawnRateMs: number; 
  maxConcurrent: number; 
  swarmChance: number;
  bossTypes?: string[];
}

export const WAVES: WaveConfig[] = [
  {
    id: 1,
    name: 'BASIC TRAINING',
    objective: 'hit_count',
    objectiveValue: 15,
    targetPool: ['standard', 'moving', 'bonus'],
    spawnRateMs: 1200,
    maxConcurrent: 3,
    swarmChance: 0
  },
  {
    id: 2,
    name: 'SKIRMISH',
    objective: 'hit_count',
    objectiveValue: 20,
    targetPool: ['standard', 'moving', 'armored', 'shielded'],
    spawnRateMs: 900,
    maxConcurrent: 5,
    swarmChance: 0.1
  },
  {
    id: 3,
    name: 'DRONE ASSAULT',
    objective: 'timed_rush',
    objectiveValue: 25,
    duration: 30, // 30 seconds
    targetPool: ['drone', 'moving', 'standard', 'exploding'],
    spawnRateMs: 700,
    maxConcurrent: 6,
    swarmChance: 0.3
  },
  {
    id: 4,
    name: 'HEAVY RESISTANCE',
    objective: 'survival',
    objectiveValue: 0,
    duration: 30,
    targetPool: ['heavy_armor', 'shielded', 'reflector', 'hostile'],
    spawnRateMs: 1000,
    maxConcurrent: 4,
    swarmChance: 0.1,
    bossTypes: ['sentinel_bot']
  },
  {
    id: 5,
    name: 'QUANTUM SHADOWS',
    objective: 'hit_count',
    objectiveValue: 25,
    targetPool: ['phase_target', 'teleporting', 'decoy', 'standard'],
    spawnRateMs: 800,
    maxConcurrent: 5,
    swarmChance: 0.2
  },
  {
    id: 6,
    name: 'OVERWHELM',
    objective: 'score',
    objectiveValue: 10000,
    targetPool: ['kinetic_swarm', 'hostile', 'drone', 'exploding', 'moving'],
    spawnRateMs: 400,
    maxConcurrent: 8,
    swarmChance: 0.5,
    bossTypes: ['orbital_array', 'warp_gate']
  }
];

export class GameplayDirector {
  private waveIndex: number = 0;
  private currentWave: WaveConfig;
  private waveStartTime: number = 0;
  private waveTargetsHit: number = 0;
  private waveScoreStart: number = 0;
  private idCounter: number = 0;
  
  constructor() {
    this.currentWave = WAVES[0];
  }

  startMatch() {
    this.waveIndex = 0;
    this.startWave(this.waveIndex);
  }

  startWave(index: number, currentScore: number = 0) {
    this.waveIndex = Math.min(index, WAVES.length - 1);
    this.currentWave = WAVES[this.waveIndex];
    this.waveStartTime = Date.now();
    this.waveTargetsHit = 0;
    this.waveScoreStart = currentScore;
  }

  getWaveConfig() {
    return this.currentWave;
  }

  getWaveIndex() {
    return this.waveIndex;
  }

  handleTargetDestroyed(type: string) {
    this.waveTargetsHit++;
  }

  // Returns true if wave is completed
  checkWaveCompletion(currentScore: number, accuracy: number): boolean {
    const wave = this.currentWave;
    const elapsed = (Date.now() - this.waveStartTime) / 1000;
    
    switch (wave.objective) {
      case 'hit_count':
        return this.waveTargetsHit >= wave.objectiveValue;
      case 'score':
        return (currentScore - this.waveScoreStart) >= wave.objectiveValue;
      case 'survival':
        return elapsed >= (wave.duration || 30);
      case 'accuracy':
        return this.waveTargetsHit >= wave.objectiveValue && accuracy >= 70;
      case 'timed_rush':
        return this.waveTargetsHit >= wave.objectiveValue; 
    }
    return false;
  }
  
  generateSpawn(activeTargetCount: number, weaponType: string): TargetData[] {
    if (activeTargetCount >= this.currentWave.maxConcurrent) return [];
    
    // Weapon Training logic:
    // If weapon is short range (shotgun), spawn closer (lower Y / specific behavior if 3D, here we just use what we have - maybe bigger targets).
    // If weapon is sniper, spawn 'elite' or 'sniper' targets more often.
    
    let spawnCount = 1;
    let typePool = [...this.currentWave.targetPool];
    
    if (weaponType === 'auto') {
      // Swarm moments for auto blasters
      if (Math.random() < 0.3) {
        spawnCount = 3;
        typePool = ['moving', 'drone', 'standard'];
      }
    } else if (weaponType === 'heavy') {
      if (Math.random() < 0.4) {
        typePool.push('armored', 'heavy_armor');
      }
    } else if (weaponType === 'precision') {
      typePool.push('phase_target', 'teleporting', 'erratic');
    }

    if (Math.random() < this.currentWave.swarmChance) {
      spawnCount = 3;
      typePool.push('moving', 'drone');
    }

    // Boss spawn check
    if (this.currentWave.bossTypes && this.currentWave.bossTypes.length > 0 && Math.random() < 0.05 && activeTargetCount === 0) {
      const boss = this.currentWave.bossTypes[Math.floor(Math.random() * this.currentWave.bossTypes.length)] as TargetData['type'];
      return [this.createTarget(boss)];
    }

    // Occasional powerups
    if (Math.random() < 0.08) {
      const p = Math.random();
      if (p > 0.66) typePool.push('powerup_damage');
      else if (p > 0.33) typePool.push('powerup_rapid');
      else typePool.push('powerup_shield');
    }

    const spawns: TargetData[] = [];
    for (let i = 0; i < spawnCount; i++) {
        const type = typePool[Math.floor(Math.random() * typePool.length)] as TargetData['type'];
        spawns.push(this.createTarget(type));
    }
    return spawns;
  }

  private createTarget(type: TargetData['type']): TargetData {
    this.idCounter++;
    
    let points = 20;
    let hp = 10;
    let lifespan = 4000;
    let scale = 1;

    switch (type) {
      case 'warp_gate': points = 500; lifespan = 15000; hp = 500; break;
      case 'orbital_array': points = 300; lifespan = 12000; hp = 250; break;
      case 'aether_pylon': points = 450; lifespan = 10000; hp = 400; break;
      case 'code_matrix': points = 200; lifespan = 8000; hp = 150; break;
      case 'kinetic_swarm': points = 350; lifespan = 10000; hp = 200; break;
      case 'hostile': points = 100; lifespan = 8000; hp = 40; break;
      case 'sentinel_bot': points = 250; lifespan = 7000; hp = 120; break;
      case 'phase_target': points = 150; lifespan = 6000; hp = 80; break;
      case 'shielded': points = 80; lifespan = 6500; hp = 60; break;
      case 'heavy_armor': points = 150; lifespan = 8000; hp = 150; break;
      case 'armored': points = 50; lifespan = 5000; hp = 40; break;
      case 'reflector': points = 120; lifespan = 7000; hp = 80; break;
      case 'teleporting': points = 90; lifespan = 5000; hp = 30; break;
      case 'decoy': points = 10; lifespan = 3000; hp = 10; break;
      case 'erratic': points = 200; lifespan = 5000; hp = 100; break;
      case 'drone': points = 25; lifespan = 4000; hp = 10; break;
      case 'exploding': points = 40; lifespan = 3000; hp = 10; break;
      case 'powerup_damage':
      case 'powerup_rapid':
      case 'powerup_shield': points = 0; lifespan = 4000; hp = 10; break;
      case 'moving': points = 30; lifespan = 4500; hp = 10; break;
      case 'bonus': points = 75; lifespan = 2500; hp = 10; break;
      default: points = 15; lifespan = 3500; hp = 10; break;
    }

    return {
      id: `target-dir-${this.idCounter}`,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 50,
      type,
      createdAt: Date.now(),
      lifespan,
      points,
      hp,
      maxHp: hp,
      scale
    };
  }
}
