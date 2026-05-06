// ─────────────────────────────────────────────────────────────────────────────
// Layered toy-blaster sound engine — Web Audio synthesis, no assets required
// ─────────────────────────────────────────────────────────────────────────────

type WeaponProfile =
  | 'semi_pistol'
  | 'heavy_blaster'
  | 'auto_blaster'
  | 'precision_rifle'
  | 'energy_blaster'
  | 'classic_blaster';

const WEAPON_SOUND_PROFILES: Record<string, WeaponProfile> = {
  peacemaker:      'semi_pistol',
  rusty_rev:       'heavy_blaster',
  compact_slinger: 'auto_blaster',
  iron_grip:       'semi_pistol',
  boomer:          'heavy_blaster',
  popper:          'semi_pistol',
  heavy_dart_p:    'heavy_blaster',
  mini_sprayer:    'auto_blaster',
  tactical_shotty: 'heavy_blaster',
  urban_carbine:   'auto_blaster',
  slide_prime:     'semi_pistol',
  scout_rifle:     'precision_rifle',
  triple_threat:   'heavy_blaster',
  protoscope:      'energy_blaster',
  aether_core:     'energy_blaster',
  early_blaster:   'classic_blaster',
};

// ─────────────────────────────────────────────────────────────────────────────
// Named haptic patterns — import and pass to vibrate() in App.tsx
// ─────────────────────────────────────────────────────────────────────────────

export const HAPTIC = {
  FIRE_LIGHT:     [15]           as number[],
  FIRE_HEAVY:     [35, 10, 20]   as number[],
  FIRE_AUTO:      [8]            as number[],
  FIRE_PRECISION: [25]           as number[],
  RELOAD_START:   [40, 100, 60]  as number[],
  RELOAD_FINISH:  [80]           as number[],
  HIT:            [20]           as number[],
  DESTROY:        [30, 50, 30]   as number[],
  EXPLOSION:      [100, 50, 100] as number[],
  LOW_AMMO:       [100, 50, 100] as number[],
  PLAYER_DAMAGE:  [100, 100, 100]as number[],
  EMPTY:          [25]           as number[],
  UI_CONFIRM:     [50]           as number[],
  POWERUP:        [50, 150, 50]  as number[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Weapon profile → haptic pattern mapping
// ─────────────────────────────────────────────────────────────────────────────

export function hapticForGun(gunId: string): number[] {
  const profile = WEAPON_SOUND_PROFILES[gunId] ?? 'semi_pistol';
  switch (profile) {
    case 'heavy_blaster': return HAPTIC.FIRE_HEAVY;
    case 'auto_blaster':  return HAPTIC.FIRE_AUTO;
    case 'precision_rifle': return HAPTIC.FIRE_PRECISION;
    default:              return HAPTIC.FIRE_LIGHT;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SoundEngine
// ─────────────────────────────────────────────────────────────────────────────

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume = 0.7;

  private init(): boolean {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return false;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
    }
  }

  // ── Primitive building blocks ───────────────────────────────────────────

  // Filtered white noise burst — the core of all mechanical/physical sounds
  private noiseBurst(
    t: number,
    duration: number,
    peakGain: number,
    filterFreq = 2000,
    filterType: BiquadFilterType = 'lowpass',
    filterQ = 1,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const sr = this.ctx.sampleRate;
    const frames = Math.ceil(sr * duration);
    const buf = this.ctx.createBuffer(1, frames, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filt = this.ctx.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.setValueAtTime(filterFreq, t);
    filt.Q.setValueAtTime(filterQ, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(peakGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(filt);
    filt.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  // Pitched oscillator with frequency sweep and gain envelope
  private oscTone(
    t: number,
    duration: number,
    freqStart: number,
    freqEnd: number,
    peakGain: number,
    type: OscillatorType = 'sine',
    attackTime = 0.005,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    }

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  // ── Fire sounds — layered per weapon profile ───────────────────────────

  playFire(gunId = 'peacemaker') {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    const profile: WeaponProfile = WEAPON_SOUND_PROFILES[gunId] ?? 'semi_pistol';

    switch (profile) {
      case 'semi_pistol': {
        // Trigger click transient (high bandpass crack)
        this.noiseBurst(t,        0.014, 0.55, 4000, 'bandpass', 3);
        // Foam dart launch — low filtered thump with pitch drop
        this.noiseBurst(t + 0.01, 0.12,  0.48, 320,  'lowpass');
        // Body resonance — the plastic blaster frame shakes
        this.oscTone(t + 0.01,   0.10,  140,  45,  0.28, 'triangle', 0.003);
        break;
      }
      case 'heavy_blaster': {
        // Trigger click
        this.noiseBurst(t,        0.015, 0.65, 3500, 'bandpass', 2);
        // Heavy dart thump — deeper noise burst
        this.noiseBurst(t + 0.01, 0.18,  0.75, 180,  'lowpass');
        // Low body resonance
        this.oscTone(t + 0.01,   0.20,  80,   30,  0.45, 'sine',     0.002);
        // Body knock overtone
        this.oscTone(t + 0.01,   0.07,  200,  60,  0.28, 'triangle', 0.001);
        break;
      }
      case 'auto_blaster': {
        // Light rapid pop — shorter, lighter, faster cycling
        this.noiseBurst(t,        0.07,  0.38, 500,  'bandpass', 2);
        this.oscTone(t,           0.05,  120,  50,  0.18, 'triangle', 0.002);
        break;
      }
      case 'precision_rifle': {
        // Sharp crack — narrow bandpass transient
        this.noiseBurst(t,        0.012, 0.85, 1200, 'bandpass', 5);
        // Dart hiss — high-pass tail simulating fast projectile
        this.noiseBurst(t + 0.01, 0.24,  0.22, 900,  'highpass');
        // Mechanical resonance of the bolt
        this.oscTone(t,           0.15,  160,  40,  0.38, 'triangle', 0.001);
        break;
      }
      case 'energy_blaster': {
        // Flywheel spin-up
        this.oscTone(t,           0.12,  280,  90,  0.32, 'sawtooth', 0.008);
        // Energy pulse burst
        this.noiseBurst(t + 0.06, 0.10,  0.38, 1200, 'bandpass', 4);
        // Charge tone
        this.oscTone(t + 0.06,   0.09,  350,  80,  0.18, 'sine',     0.003);
        break;
      }
      case 'classic_blaster': {
        // Toy-like pop — Nerf classic
        this.noiseBurst(t,        0.09,  0.48, 400,  'bandpass', 2);
        this.oscTone(t,           0.08,  100,  50,  0.28, 'square',   0.003);
        break;
      }
    }
  }

  // Legacy alias — used by hostile/drone fire-back code
  playShot() {
    this.playFire('peacemaker');
  }

  // ── Empty chamber ──────────────────────────────────────────────────────

  playEmptyClick() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Dry mechanical click — striker hits an empty chamber
    this.noiseBurst(t, 0.025, 0.42, 3500, 'bandpass', 6);
    this.oscTone(t, 0.04, 80, 40, 0.18, 'square', 0.001);
  }

  // ── Reload sounds ──────────────────────────────────────────────────────

  playReloadStart(gunId = 'peacemaker') {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    const isHeavy = WEAPON_SOUND_PROFILES[gunId] === 'heavy_blaster';

    // Magazine release click
    this.noiseBurst(t,        0.04,  0.48, 2500, 'bandpass', 4);
    // Slide/prime retraction sweep (heavier guns go lower)
    this.oscTone(t + 0.04,   0.18,  isHeavy ? 280 : 340, 90, 0.42, 'triangle', 0.005);
    // Spring tension creak
    this.oscTone(t + 0.10,   0.12,  600,  200, 0.14, 'sine', 0.01);
  }

  playMagInsert() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Plastic magazine seating thunk
    this.noiseBurst(t, 0.06, 0.58, 380, 'lowpass');
    this.oscTone(t, 0.05, 250, 80, 0.38, 'triangle', 0.002);
  }

  playSlidePrime() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Slide forward
    this.noiseBurst(t,       0.028, 0.52, 3000, 'bandpass', 3);
    // Spring return ping
    this.oscTone(t + 0.02,  0.09,  180,  350,  0.28, 'triangle', 0.005);
  }

  playReloadFinish(gunId = 'peacemaker') {
    if (!this.init() || !this.ctx) return;
    // Mag insert
    this.playMagInsert();
    // Slide prime slightly after the mag seats
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const t2 = this.ctx.currentTime;
      this.noiseBurst(t2,       0.030, 0.58, 3200, 'bandpass', 3);
      this.oscTone(t2 + 0.02,  0.07,  200,  400,  0.32, 'triangle', 0.004);
    }, 130);
  }

  // ── Target feedback ────────────────────────────────────────────────────

  playHit(quality = 'body') {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;

    if (quality === 'weak_point') {
      // Satisfying high-pitch ring — bullseye
      this.oscTone(t,      0.20, 900, 600, 0.32, 'sine',     0.003);
      this.noiseBurst(t,   0.05, 0.38, 3000, 'bandpass', 5);
    } else if (quality === 'center') {
      // Solid ring
      this.oscTone(t,      0.13, 600, 400, 0.28, 'sine',     0.003);
      this.noiseBurst(t,   0.04, 0.28, 2000, 'bandpass', 3);
    } else if (quality === 'graze') {
      // Soft plastic brush
      this.noiseBurst(t,   0.07, 0.18, 900,  'highpass', 1);
    } else if (quality === 'armor') {
      // Dull metal clunk — shot absorbed by armor
      this.noiseBurst(t,   0.09, 0.28, 280,  'lowpass', 2);
      this.oscTone(t,      0.07, 150,  80,   0.22, 'square', 0.002);
    } else {
      // body — clean pop
      this.noiseBurst(t,   0.07, 0.26, 1200, 'bandpass', 2);
      this.oscTone(t,      0.06, 400,  200,  0.18, 'sine',   0.003);
    }
  }

  playTargetBreak() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Plastic crack + shatter
    this.noiseBurst(t,        0.05,  0.68, 2500, 'bandpass', 3);
    this.noiseBurst(t + 0.04, 0.18,  0.38, 600,  'lowpass');
    this.oscTone(t,           0.13,  350,  80,   0.32, 'triangle', 0.002);
    // Debris scatter crinkle
    this.oscTone(t + 0.06,   0.12,  800,  200,  0.14, 'sine',     0.006);
  }

  playPlasticBounce() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Foam dart hitting a hard surface — soft thud + short ring
    this.noiseBurst(t,       0.04,  0.28, 800,  'bandpass', 3);
    this.oscTone(t,          0.07,  180,  60,   0.18, 'triangle', 0.002);
  }

  // ── UI / game state ────────────────────────────────────────────────────

  playCountdown() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.oscTone(t,    0.13, 440, 440, 0.26, 'sine', 0.005);
    this.noiseBurst(t, 0.02, 0.10, 2000, 'bandpass', 3);
  }

  playMatchStart() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Rising three-note fanfare
    this.oscTone(t,        0.12, 660,  880,  0.38, 'sine', 0.010);
    this.oscTone(t + 0.10, 0.14, 880,  1100, 0.42, 'sine', 0.010);
    this.oscTone(t + 0.22, 0.28, 1100, 1320, 0.48, 'sine', 0.010);
    this.noiseBurst(t + 0.22, 0.14, 0.18, 2000, 'bandpass', 2);
  }

  playUIConfirm() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.oscTone(t,        0.08, 600, 900,  0.22, 'sine', 0.005);
    this.oscTone(t + 0.06, 0.10, 900, 1200, 0.18, 'sine', 0.005);
  }

  playWarningBeep() {
    if (!this.init() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Double pulse — low ammo / incoming threat
    this.oscTone(t,        0.08, 880,  880,  0.28, 'square', 0.004);
    this.oscTone(t + 0.14, 0.08, 1100, 1100, 0.28, 'square', 0.004);
  }
}

export const sounds = new SoundEngine();
