import { TargetData } from '../components/Target';

// ─────────────────────────────────────────────────────────────────────────────
// Hit quality
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hit quality from innermost to outermost zone.
 * 'weak_point' – explicit soft-spot on boss/armored targets (crit)
 * 'center'     – tight bullseye, ~40 % of body radius (crit)
 * 'body'       – solid hit, full damage
 * 'armor'      – outer armored shell, heavily reduced damage
 * 'graze'      – barely clipped, half damage, reduced score
 */
export type HitQuality = 'weak_point' | 'center' | 'body' | 'armor' | 'graze';

export interface ShotHitResult {
  targetId: string;
  quality: HitQuality;
  /** Distance from target center in pixels (useful for debug / effects). */
  distPx: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hitbox definitions
// All radii are expressed as % of viewport WIDTH so they scale with the game
// area. At runtime they are converted to pixels before comparison so the
// hitboxes are circular in pixel space.
//
// Zone layout (inner → outer):
//   weakRadius  → 'weak_point'   (only when hasWeakPoint)
//   centerRadius→ 'center'       (tight bullseye)
//   bodyRadius  → 'body'         (solid hit)
//   armorRadius → 'armor'        (only when hasArmor; outer shell between
//                                  bodyRadius and armorRadius)
//   grazeRadius → 'graze'
//   beyond grazeRadius → miss
// ─────────────────────────────────────────────────────────────────────────────

export interface HitboxDef {
  grazeRadius: number;
  armorRadius: number;
  bodyRadius: number;
  centerRadius: number;
  weakRadius: number;
  hasArmor: boolean;
  hasWeakPoint: boolean;
}

const DEFAULT_HB: HitboxDef = {
  grazeRadius: 5.5,
  armorRadius: 0,
  bodyRadius: 4.0,
  centerRadius: 2.0,
  weakRadius: 0,
  hasArmor: false,
  hasWeakPoint: false,
};

// Shorthand builders
const basic = (gr: number, br: number, cr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, bodyRadius: br, centerRadius: cr });

const armored = (gr: number, ar: number, br: number, cr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, armorRadius: ar, bodyRadius: br, centerRadius: cr, hasArmor: true });

const weak = (gr: number, br: number, cr: number, wr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, bodyRadius: br, centerRadius: cr, weakRadius: wr, hasWeakPoint: true });

const armoredWeak = (gr: number, ar: number, br: number, cr: number, wr: number): HitboxDef =>
  ({ ...DEFAULT_HB, grazeRadius: gr, armorRadius: ar, bodyRadius: br, centerRadius: cr, weakRadius: wr, hasArmor: true, hasWeakPoint: true });

// Per-type definitions. Radii are % of viewport width.
const HITBOX_DEFS: Partial<Record<TargetData['type'], HitboxDef>> = {
  // ── Standard / simple types ─────────────────────────────────────────────
  standard:         basic(5.5, 4.0, 2.0),
  // Moving targets drift ±~2 % from their base x; slightly wider graze
  // compensates so players tracking the visual don't feel cheated.
  moving:           basic(6.0, 4.0, 2.0),
  bonus:            basic(4.5, 3.0, 1.5),   // small, fleeting – reward accuracy
  erratic:          basic(5.5, 4.0, 2.0),
  splitting:        basic(5.5, 4.0, 2.0),
  teleporting:      basic(5.0, 3.5, 1.8),   // small penalty for teleporting
  decoy:            basic(4.5, 3.0, 1.5),   // small, low-value – punish waste
  phantom:          basic(5.5, 4.0, 2.0),
  drone:            basic(4.5, 3.0, 1.5),   // fast and small
  exploding:        basic(5.5, 4.0, 2.0),
  hostile:          basic(6.0, 4.5, 2.2),   // slightly larger active enemy
  jammer:           basic(5.5, 4.0, 2.0),

  // ── Powerups: generous hitbox so collection feels rewarding ─────────────
  powerup_damage:   basic(5.0, 3.8, 2.0),
  powerup_rapid:    basic(5.0, 3.8, 2.0),
  powerup_shield:   basic(5.0, 3.8, 2.0),

  // ── Armored – inner core bypasses armor shell on precise shots ──────────
  //   armorRadius > bodyRadius: shots between bodyRadius and armorRadius = armor
  armored:          armored(6.0, 5.5, 3.5, 1.8),
  heavy_armor:      armored(6.5, 6.0, 3.5, 1.8),
  shielded:         armored(6.0, 5.5, 3.5, 1.8),
  reflector:        armored(6.0, 5.5, 4.0, 2.0),  // reflective shell is wide

  // ── Boss / special targets with explicit weak points ────────────────────
  // Larger visuals → larger hitboxes; weak point at inner core
  orbital_array:    armoredWeak(9.5, 8.5, 6.5, 3.5, 2.5),
  kinetic_swarm:    armoredWeak(10.0, 9.0, 7.0, 3.5, 2.5),
  sentinel_bot:     armoredWeak(7.5, 7.0, 5.0, 2.5, 1.5),
  phase_target:     armoredWeak(7.5, 7.0, 5.0, 2.5, 1.5),

  warp_gate:        weak(9.5, 7.0, 3.5, 2.5),
  astro_hive:       weak(8.5, 6.5, 3.5, 2.5),
  neural_grid:      weak(9.0, 7.0, 3.5, 2.5),

  code_matrix:      basic(8.0, 6.0, 3.0),
  gravity_tower:    basic(8.0, 6.0, 3.0),
  data_sphere:      basic(8.0, 6.0, 3.0),
  bot_sentry:       basic(8.0, 6.0, 3.0),
  aether_pylon:     basic(8.5, 6.5, 3.5),
};

/** Returns the hitbox definition for a target type, falling back to the default. */
export function getHitboxDef(type: TargetData['type']): HitboxDef {
  return HITBOX_DEFS[type] ?? DEFAULT_HB;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shot resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine which target (if any) a dart endpoint hits.
 *
 * Coordinates are in pixels relative to the game area top-left so the
 * comparison is done in a flat pixel space (no aspect-ratio distortion on
 * circular hitboxes).  Hitbox radii are scaled by `target.scale`.
 *
 * @param endXPx   Dart endpoint X in game-area pixels (after spread is applied)
 * @param endYPx   Dart endpoint Y in game-area pixels (after spread is applied)
 * @param gameW    Game area width  (px)
 * @param gameH    Game area height (px)
 * @param targets  Current live targets (use a ref so the closure stays fresh)
 * @returns Closest matching hit, or null for a complete miss.
 */
export function resolveShotHit(
  endXPx: number,
  endYPx: number,
  gameW: number,
  gameH: number,
  targets: TargetData[],
): ShotHitResult | null {
  let bestResult: ShotHitResult | null = null;
  let bestDist = Infinity;

  for (const target of targets) {
    // Convert target % position to pixels in game-area space.
    const targetXPx = (target.x / 100) * gameW;
    const targetYPx = (target.y / 100) * gameH;

    const dxPx = endXPx - targetXPx;
    const dyPx = endYPx - targetYPx;
    const distPx = Math.sqrt(dxPx * dxPx + dyPx * dyPx);

    const hb = getHitboxDef(target.type);
    const scale = target.scale ?? 1;

    // Convert % radii to pixels.  Radii are defined as % of viewport WIDTH so
    // they are proportional to the horizontal layout regardless of screen shape.
    const toPx = (pct: number) => (pct / 100) * gameW * scale;
    const grazePx  = toPx(hb.grazeRadius);

    if (distPx > grazePx) continue; // outside outermost zone – skip

    const weakPx   = toPx(hb.weakRadius);
    const centerPx = toPx(hb.centerRadius);
    const bodyPx   = toPx(hb.bodyRadius);
    const armorPx  = toPx(hb.armorRadius);

    let quality: HitQuality;
    if (hb.hasWeakPoint && distPx <= weakPx) {
      quality = 'weak_point';
    } else if (distPx <= centerPx) {
      quality = 'center';
    } else if (distPx <= bodyPx) {
      quality = 'body';
    } else if (hb.hasArmor && distPx <= armorPx) {
      quality = 'armor';
    } else {
      quality = 'graze';
    }

    // Take the closest-centre target when multiple overlap.
    if (distPx < bestDist) {
      bestDist = distPx;
      bestResult = { targetId: target.id, quality, distPx };
    }
  }

  return bestResult;
}
