import React from 'react';
import { motion } from 'motion/react';

// Mount taxonomy. Each mount adds physical grounding (base plate, rail,
// hinge, hover anchor) without changing target logic, behavior, or any of
// the existing target visuals. The components are purely additive.
export type MountType =
  | 'stand'              // floor-mounted post + base plate
  | 'stand_reinforced'   // heavy / armored / large fixtures
  | 'stand_shield'       // standard stand + ground shimmer for shielded
  | 'rail'               // horizontal sliding rail w/ end anchors
  | 'hinge'              // pivoting hinge or portal frame anchor
  | 'drone';             // hover stabilizer with floor shadow

export function getMountType(type: string): MountType {
  switch (type) {
    case 'moving':
    case 'bot_sentry':
    case 'sentinel_bot':
      return 'rail';

    case 'drone':
    case 'kinetic_swarm':
      return 'drone';

    case 'teleporting':
    case 'warp_gate':
    case 'phase_target':
      return 'hinge';

    case 'armored':
    case 'heavy_armor':
    case 'reflector':
    case 'jammer':
    case 'orbital_array':
    case 'gravity_tower':
    case 'aether_pylon':
    case 'astro_hive':
    case 'neural_grid':
    case 'code_matrix':
    case 'data_sphere':
      return 'stand_reinforced';

    case 'shielded':
      return 'stand_shield';

    // Floating power-up pickups read as mounted via a small hover anchor.
    case 'powerup_damage':
    case 'powerup_rapid':
    case 'powerup_shield':
      return 'drone';

    default:
      return 'stand';
  }
}

interface MountProps {
  hitTier: number;   // 0-3, last hit intensity
  flash: boolean;    // hit flash currently active
  settling: boolean; // post-flash settle wobble
}

// Renders the mount visuals positioned below the existing target. Inherits
// target.scale via the parent motion wrapper's transform, so distant targets
// receive correspondingly smaller mounts and shadows automatically.
export function MountFrame(props: { mountType: MountType } & MountProps) {
  const { mountType, ...rest } = props;
  switch (mountType) {
    case 'rail':
      return <RailMount {...rest} />;
    case 'hinge':
      return <HingeMount {...rest} />;
    case 'drone':
      return <DroneAnchor {...rest} />;
    case 'stand_reinforced':
      return <StandMount variant="reinforced" {...rest} />;
    case 'stand_shield':
      return <StandMount variant="shielded" {...rest} />;
    default:
      return <StandMount variant="normal" {...rest} />;
  }
}

// ── StandMount ─────────────────────────────────────────────────────────────
function StandMount({
  variant,
  hitTier,
  flash,
  settling,
}: MountProps & { variant: 'normal' | 'reinforced' | 'shielded' }) {
  const active = flash || settling;
  const reinforced = variant === 'reinforced';
  const shielded = variant === 'shielded';
  const intensity = hitTier === 3 ? (reinforced ? 5 : 6) : hitTier === 2 ? (reinforced ? 2.5 : 3) : 1.4;

  const plateW = reinforced ? 92 : 60;
  const plateH = reinforced ? 14 : 9;
  const shadowW = reinforced ? 118 : 78;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ top: '100%', zIndex: 0 }}
      aria-hidden
    >
      {/* Soft contact shadow under base */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/55 blur-md"
        style={{ top: reinforced ? 12 : 9, width: shadowW, height: reinforced ? 10 : 8, opacity: 0.78 }}
      />
      {/* Darker contact-point spot at the mount-target connection */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/85 blur-[1.5px]"
        style={{ top: 0, width: reinforced ? 32 : 22, height: reinforced ? 4 : 3 }}
      />
      {/* Optional shield glow ring around the base plate */}
      {shielded && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: 8,
            width: 100,
            height: 16,
            background:
              'radial-gradient(ellipse at center, rgba(34,211,238,0.32) 0%, rgba(34,211,238,0) 70%)',
          }}
        />
      )}
      {/* Connection bracket + base plate (wobbles under hit) */}
      <motion.div
        className="relative mx-auto"
        animate={
          active
            ? { rotate: [0, -intensity * 0.18, intensity * 0.14, -intensity * 0.05, 0] }
            : { rotate: 0 }
        }
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ transformOrigin: '50% 0%' }}
      >
        {/* Connection collar */}
        <div
          className="mx-auto bg-gradient-to-b from-zinc-500 to-zinc-900 border-x border-zinc-400/70"
          style={{ width: reinforced ? 12 : 8, height: reinforced ? 6 : 4 }}
        />
        {/* Base plate with subtle 3D depth */}
        <div className="mx-auto relative" style={{ width: plateW, height: plateH }}>
          <div
            className="absolute inset-0 rounded-[3px] bg-gradient-to-b from-zinc-600 via-zinc-800 to-black border border-zinc-500/80"
            style={{
              boxShadow:
                '0 4px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 3px rgba(0,0,0,0.5)',
            }}
          />
          {/* Top edge highlight */}
          <div className="absolute inset-x-1 top-0 h-px bg-zinc-300/45" />
          {/* Bolts */}
          {reinforced ? (
            <>
              {[14, 38, 62, 86].map(x => (
                <div
                  key={x}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-400 border border-zinc-700"
                  style={{ left: `${x}%`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}
                />
              ))}
              {/* Side anchor flanges for reinforced mounts */}
              <div className="absolute -left-1.5 top-1 bottom-1 w-1.5 bg-zinc-700 border border-zinc-500/60 rounded-l-sm" />
              <div className="absolute -right-1.5 top-1 bottom-1 w-1.5 bg-zinc-700 border border-zinc-500/60 rounded-r-sm" />
            </>
          ) : (
            <>
              <div className="absolute left-[18%] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-zinc-500" />
              <div className="absolute right-[18%] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-zinc-500" />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── RailMount ──────────────────────────────────────────────────────────────
function RailMount({ hitTier, flash, settling }: MountProps) {
  const active = flash || settling;
  const intensity = hitTier === 3 ? 6 : hitTier === 2 ? 3 : 1.5;
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ top: '100%', zIndex: 0 }}
      aria-hidden
    >
      {/* Long contact shadow under rail */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/55 blur-md"
        style={{ top: 8, width: 230, height: 8, opacity: 0.7 }}
      />
      {/* Slider carriage + rail track (lateral vibration on hit) */}
      <motion.div
        animate={active ? { x: [0, -intensity, intensity * 0.7, -intensity * 0.35, 0] } : { x: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative"
      >
        {/* Carriage block riding the rail */}
        <div className="mx-auto relative" style={{ width: 36, height: 8 }}>
          <div
            className="absolute inset-0 rounded-sm bg-gradient-to-b from-zinc-500 via-zinc-700 to-zinc-900 border border-zinc-400/70"
            style={{
              boxShadow:
                '0 2px 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          />
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-zinc-300" />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-zinc-300" />
          {/* Center contact peg */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-1 h-1.5 rounded-sm bg-zinc-400 border border-zinc-700" />
        </div>
        {/* Rail track extends beyond the target footprint */}
        <div className="relative mt-0.5 mx-auto" style={{ width: 220 }}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-zinc-900 via-zinc-300 to-zinc-900 rounded-full"
               style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.5)' }} />
          <div className="absolute inset-x-0 top-1.5 h-px bg-zinc-800/80" />
          {/* End anchors bolted into the floor */}
          <div className="absolute -left-1.5 -top-1 w-3 h-4 bg-gradient-to-b from-zinc-600 to-zinc-900 border border-zinc-500 rounded-sm">
            <div className="absolute left-1/2 -translate-x-1/2 top-1 w-0.5 h-0.5 rounded-full bg-zinc-300" />
          </div>
          <div className="absolute -right-1.5 -top-1 w-3 h-4 bg-gradient-to-b from-zinc-600 to-zinc-900 border border-zinc-500 rounded-sm">
            <div className="absolute left-1/2 -translate-x-1/2 top-1 w-0.5 h-0.5 rounded-full bg-zinc-300" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── HingeMount ─────────────────────────────────────────────────────────────
function HingeMount({ hitTier, flash, settling }: MountProps) {
  const active = flash || settling;
  const intensity = hitTier === 3 ? 8 : hitTier === 2 ? 4 : 2;
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ top: '100%', zIndex: 0 }}
      aria-hidden
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/60 blur-md"
        style={{ top: 12, width: 100, height: 9 }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/85 blur-[2px]"
        style={{ top: 0, width: 16, height: 4 }}
      />
      <motion.div
        animate={active ? { rotate: [0, -intensity, intensity * 0.6, -intensity * 0.25, 0] } : { rotate: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: '50% 0%' }}
        className="relative"
      >
        {/* Pivot hub */}
        <div className="mx-auto relative" style={{ width: 16, height: 8 }}>
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-900 border border-zinc-500/80"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-300 border border-zinc-700" />
        </div>
        {/* Base plate */}
        <div className="mx-auto relative" style={{ width: 80, height: 11 }}>
          <div
            className="absolute inset-0 rounded-[3px] bg-gradient-to-b from-zinc-600 via-zinc-800 to-black border border-zinc-500/80"
            style={{
              boxShadow:
                '0 4px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 3px rgba(0,0,0,0.5)',
            }}
          />
          <div className="absolute inset-x-1 top-0 h-px bg-zinc-300/45" />
          <div className="absolute left-[14%] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-zinc-500" />
          <div className="absolute right-[14%] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-zinc-500" />
        </div>
      </motion.div>
    </div>
  );
}

// ── DroneAnchor ────────────────────────────────────────────────────────────
function DroneAnchor({ hitTier, flash, settling }: MountProps) {
  const active = flash || settling;
  const intensity = hitTier === 3 ? 6 : hitTier === 2 ? 3 : 1.5;
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ top: '100%', zIndex: 0 }}
      aria-hidden
    >
      {/* Stabilizer beam: target → ground (sits above the shadow) */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: 4,
          width: 1,
          height: 22,
          backgroundImage:
            'linear-gradient(to bottom, rgba(34,211,238,0.55) 0 2px, transparent 2px 5px)',
          backgroundSize: '1px 5px',
          backgroundRepeat: 'repeat-y',
          opacity: 0.55,
        }}
      />
      {/* Hover shadow drifts under stabilization wobble on hit */}
      <motion.div
        animate={active ? { x: [0, -intensity * 0.6, intensity * 0.4, -intensity * 0.2, 0] } : { x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: 26, width: 80, height: 12 }}
      >
        {/* Outer soft shadow (large/diffuse — far hover) */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/45 blur-md"
             style={{ width: 76, height: 9, top: 0 }} />
        {/* Inner darker shadow (focused contact point) */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/70 blur-[2px]"
             style={{ width: 38, height: 5, top: 2 }} />
        {/* Small floor mark */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-cyan-300/30 blur-[1px]"
             style={{ width: 10, height: 1.5, top: 4 }} />
      </motion.div>
    </div>
  );
}
