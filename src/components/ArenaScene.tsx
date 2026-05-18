import React from 'react';
import { motion, MotionValue, useMotionValue, useTransform } from 'motion/react';
import { getArenaSceneAssets } from '../lib/assetRegistry';

export type ArenaId = 'training' | 'warehouse' | 'rooftop';

// Optional concept-art plate behind the layered CSS scene. Errors silently to
// keep the original CSS arena visible if the image isn't reachable.
function ArenaArtPlate({ arenaId }: { arenaId: ArenaId }) {
  const [primaryFailed, setPrimaryFailed] = React.useState(false);
  const [detailFailed, setDetailFailed] = React.useState(false);
  const { primary, detail } = React.useMemo(() => getArenaSceneAssets(arenaId), [arenaId]);

  // Per-arena tone — masks blend the photographic concept into the CSS scene
  // rather than pasting one full-screen still that swallows everything. Every
  // arena now lands on a darker, desaturated plate so the world reads as
  // black-first rather than soft / cinematic / blue-washed.
  const tint =
    arenaId === 'warehouse'
      ? 'saturate(0.55) brightness(0.65) contrast(1.1)'
      : arenaId === 'rooftop'
      ? 'saturate(0.5) brightness(0.6) contrast(1.05)'
      : 'saturate(0.6) brightness(0.7) contrast(1.05)';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {!primaryFailed && (
        <img
          src={primary.src}
          alt=""
          aria-hidden
          draggable={false}
          loading="eager"
          decoding="async"
          onError={() => setPrimaryFailed(true)}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: 'cover',
            objectPosition: 'center 35%',
            opacity: 0.22,
            filter: tint,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {detail && !detailFailed && (
        <img
          src={detail.src}
          alt=""
          aria-hidden
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setDetailFailed(true)}
          className="absolute inset-x-0 top-0 w-full h-2/3"
          style={{
            objectFit: 'cover',
            objectPosition: 'center top',
            opacity: 0.12,
            filter: `${tint} blur(1.5px)`,
            mixBlendMode: 'lighten',
          }}
        />
      )}
      {/* Vignette pulls the art into the CSS midground without leaving any
          full-screen colored wash. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.92) 100%)',
        }}
      />
    </div>
  );
}

interface ArenaSceneProps {
  arenaId: ArenaId;
  /** Optional motion values driven by cursor / device tilt for parallax. */
  parallaxX?: MotionValue<number>;
  parallaxY?: MotionValue<number>;
}

/**
 * ArenaScene
 * Layered, fully-CSS arena background. Each arena renders:
 *   - background layer (sky / wall / cityscape)
 *   - midground layer (structures / racks / crates / skyline)
 *   - foreground layer (rails, target stands, platforms)
 *   - spawn doors / panels
 *   - floor with perspective grid
 *   - subtle parallax wired through useTransform on optional motion values
 * No external image URLs are used.
 */
export default function ArenaScene({ arenaId, parallaxX, parallaxY }: ArenaSceneProps) {
  // Stable fallback motion values so useTransform always receives one.
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const px: MotionValue<number> = parallaxX ?? fallbackX;
  const py: MotionValue<number> = parallaxY ?? fallbackY;

  const bgX = useTransform(px, [-1, 1], ['-1.5%', '1.5%']);
  const bgY = useTransform(py, [-1, 1], ['-1.5%', '1.5%']);
  const midX = useTransform(px, [-1, 1], ['-3.5%', '3.5%']);
  const midY = useTransform(py, [-1, 1], ['-3%', '3%']);
  const fgX = useTransform(px, [-1, 1], ['-6%', '6%']);
  const fgY = useTransform(py, [-1, 1], ['-4%', '4%']);

  if (arenaId === 'warehouse') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Concept-art plate (warehouse rush) */}
        <ArenaArtPlate arenaId="warehouse" />
        {/* Lighting identity: black-first industrial with a single warm key
            light overhead. No dual cyan + magenta radial bloom clouds. */}
        <ArenaLighting arenaId="warehouse" />
        {/* Background: deep black warehouse wall — no warm-brown wash */}
        <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#040405] via-[#0c0c0d] to-[#020203]" />
          {/* Corrugated roof beams — fainter so they read as structure not stripes */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0)_0,rgba(0,0,0,0)_60px,rgba(255,255,255,0.03)_60px,rgba(255,255,255,0.03)_62px)]" />
          {/* High-bay lights — pinpoints with restrained warm halo */}
          <div className="absolute top-2 left-1/4 w-1 h-1 rounded-full bg-amber-100 shadow-[0_0_18px_8px_rgba(254,243,199,0.10)]" />
          <div className="absolute top-2 right-1/4 w-1 h-1 rounded-full bg-amber-100 shadow-[0_0_18px_8px_rgba(254,243,199,0.10)]" />
          <div className="absolute top-2 left-1/2 w-1 h-1 rounded-full bg-amber-100 shadow-[0_0_22px_10px_rgba(254,243,199,0.12)]" />
        </motion.div>

        {/* Midground: storage racks + pallets along the back wall */}
        <motion.div className="absolute inset-0" style={{ x: midX, y: midY }}>
          <div className="absolute left-0 right-0 top-[30%] h-[40%] flex items-end justify-between px-[4%]">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col gap-1 opacity-80" style={{ transform: `perspective(800px) rotateY(${i < 3 ? 6 : -6}deg)` }}>
                {/* Rack uprights + shelves with stacked crates */}
                <div className="w-20 h-3 bg-zinc-700 border border-zinc-500 rounded-sm" />
                <div className="flex gap-1">
                  <div className="w-9 h-7 bg-amber-700 border border-amber-900 rounded-sm shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
                  <div className="w-9 h-7 bg-amber-800 border border-amber-900 rounded-sm shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
                </div>
                <div className="w-20 h-2 bg-zinc-800 border border-zinc-600 rounded-sm" />
                <div className="flex gap-1">
                  <div className="w-9 h-6 bg-zinc-600 border border-zinc-700 rounded-sm" />
                  <div className="w-9 h-6 bg-zinc-700 border border-zinc-800 rounded-sm" />
                </div>
                <div className="w-20 h-2 bg-zinc-800 border border-zinc-600 rounded-sm" />
              </div>
            ))}
          </div>
          {/* Hanging chains */}
          <div className="absolute top-0 left-[18%] w-px h-1/3 bg-zinc-500/50" />
          <div className="absolute top-0 left-[18%] w-3 h-3 -translate-x-1/2 translate-y-[33%] rounded bg-zinc-600/70 border border-zinc-400/50" />
          <div className="absolute top-0 right-[15%] w-px h-1/4 bg-zinc-500/50" />
        </motion.div>

        {/* Spawn doors: rolling shutters on back wall */}
        <div className="absolute inset-x-0 top-[55%] flex justify-around opacity-95">
          <ShutterDoor active />
          <ShutterDoor />
          <ShutterDoor active />
        </div>

        {/* Foreground: rails, target stands, crates */}
        <motion.div className="absolute inset-0" style={{ x: fgX, y: fgY }}>
          {/* Long rail across mid-stage where moving targets glide */}
          <div className="absolute left-[6%] right-[6%] top-[58%] h-[4px] rounded-full bg-gradient-to-r from-zinc-900 via-zinc-400 to-zinc-900 shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
          <div className="absolute left-[6%] right-[6%] top-[58%] h-1 -translate-y-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm" />
          {/* Target stands at lane positions */}
          {[12, 30, 50, 70, 88].map(x => (
            <div key={x} className="absolute" style={{ left: `${x}%`, top: '74%' }}>
              <div className="w-1 h-10 bg-zinc-700 mx-auto" />
              <div className="w-10 h-2 -mt-0.5 bg-zinc-900 border border-zinc-700 rounded-sm" />
            </div>
          ))}
          {/* Foreground crates (bottom edges) */}
          <div className="absolute bottom-3 left-[3%] w-20 h-12 bg-amber-800 border-2 border-amber-950 rounded-sm shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
            <div className="absolute inset-1 border border-amber-700/70" />
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px bg-amber-950" />
          </div>
          <div className="absolute bottom-1 right-[5%] w-24 h-14 bg-zinc-700 border-2 border-zinc-900 rounded-sm shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
            <div className="absolute inset-1 border border-zinc-600" />
          </div>
          {/* Industrial control panels + machinery — single cyan data accent,
              orange warning accent. No neon magenta club lighting. */}
          <IndustrialPanel x="22%" y="78%" tone="cyan" />
          <IndustrialPanel x="68%" y="80%" tone="amber" />
          <Machinery x="38%" y="82%" />
          {/* Thin accent rails — hard-edge hairlines, no blur halos */}
          <NeonRail orientation="horizontal" left="6%" right="6%" top="58%" color="#19E0FF" />
          <NeonRail orientation="vertical"   leftPx="3%" topPx="42%" length="22%" color="#FF6A1A" />
          <NeonRail orientation="vertical"   leftPx="97%" topPx="42%" length="22%" color="#FF6A1A" />
        </motion.div>

        <FloorPerspective tone="warehouse" />
      </div>
    );
  }

  if (arenaId === 'rooftop') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Concept-art plate (skyline rooftop) */}
        <ArenaArtPlate arenaId="rooftop" />
        {/* Lighting identity: dark night, sharp directional moon, no blue fog */}
        <ArenaLighting arenaId="rooftop" />
        {/* Background: black night sky, hairline horizon, no soft purple/navy */}
        <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-[#0a0a0c] to-[#000000]" />
          {/* Stars — sparse pinpoints */}
          <div className="absolute inset-0 opacity-70">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-px bg-white rounded-full"
                style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 40}%`, opacity: 0.28 + ((i * 7) % 7) / 14 }}
              />
            ))}
          </div>
          {/* Distant horizon — restrained warm sliver, no fuchsia blur */}
          <div className="absolute inset-x-0 top-[55%] h-6 bg-gradient-to-t from-orange-700/25 to-transparent" />
          <div className="absolute inset-x-0 top-[55%] h-px bg-white/10" />
        </motion.div>

        {/* Midground: city skyline silhouettes */}
        <motion.div className="absolute inset-x-0 bottom-[42%] top-[28%]" style={{ x: midX, y: midY }}>
          <div className="absolute inset-0 flex items-end gap-1 px-[3%]">
            {Array.from({ length: 18 }).map((_, i) => {
              const h = 30 + ((i * 23) % 70);
              const w = 4 + ((i * 11) % 6);
              return (
                <div key={i} className="relative bg-zinc-900 border-t-2 border-zinc-700/60" style={{ height: `${h}%`, width: `${w}%` }}>
                  {/* Lit windows */}
                  <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <div
                        key={j}
                        className="bg-amber-300/70"
                        style={{ opacity: ((i + j) * 13) % 100 < 40 ? 0.85 : 0.05 }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Spawn panels: building access vents on near rooftops */}
        <div className="absolute inset-x-0 top-[58%] flex justify-around">
          <RooftopVent />
          <RooftopVent active />
          <RooftopVent />
        </div>

        {/* Foreground: rooftop edge + AC units + rail */}
        <motion.div className="absolute inset-0" style={{ x: fgX, y: fgY }}>
          {/* Air conditioning units */}
          <div className="absolute bottom-[12%] left-[10%] w-24 h-14 bg-zinc-700 border-2 border-zinc-900 rounded-sm shadow-[0_6px_10px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-2 grid grid-cols-4 gap-px bg-zinc-900">
              {Array.from({ length: 16 }).map((_, i) => (<div key={i} className="bg-zinc-800" />))}
            </div>
          </div>
          <div className="absolute bottom-[10%] right-[8%] w-28 h-16 bg-zinc-800 border-2 border-zinc-900 rounded-sm shadow-[0_6px_10px_rgba(0,0,0,0.6)]">
            <div className="absolute top-1 left-1 right-1 h-2 bg-amber-700/80 rounded-sm" />
            <div className="absolute inset-x-2 top-4 bottom-2 grid grid-cols-5 gap-px">
              {Array.from({ length: 15 }).map((_, i) => (<div key={i} className="bg-zinc-900 border border-zinc-700/60" />))}
            </div>
          </div>
          {/* Rooftop edge guard rail */}
          <div className="absolute left-0 right-0 top-[64%] h-[3px] bg-gradient-to-r from-zinc-700 via-zinc-300 to-zinc-700 shadow-[0_2px_4px_rgba(0,0,0,0.7)]" />
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="absolute top-[64%] w-[2px] h-6 bg-zinc-500" style={{ left: `${5 + i * 11}%` }} />
          ))}
          {/* Sandbag platforms for boss spawn */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-3 rounded-md bg-amber-900 border border-amber-950 shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px bg-amber-700/80" />
          </div>
          {/* Rooftop identity props: vents, antennas, satellite dish */}
          <RoofVentBox x="32%" bottom="14%" />
          <RoofVentBox x="58%" bottom="16%" rotated />
          <Antenna x="20%" bottom="22%" height="20%" />
          <Antenna x="78%" bottom="26%" height="26%" blink />
          <Antenna x="48%" bottom="20%" height="14%" />
          <SatelliteDish x="86%" bottom="32%" />
          {/* Extra distant skyline silhouettes for parallax depth */}
          <DistantSkylineRow />
        </motion.div>

        <FloorPerspective tone="rooftop" />
      </div>
    );
  }

  // Default: training bay
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Concept-art plate (training bay) */}
      <ArenaArtPlate arenaId="training" />
      {/* Lighting identity: restrained neutral overhead, no cyan wash */}
      <ArenaLighting arenaId="training" />
      {/* Background: industrial training wall, near-black with hairline grid */}
      <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-[#0c0e11] to-[#020203]" />
        {/* Neutral hairline grid — replaces the cyan dot pattern wall */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Hazard banner across top — kept as a deliberate orange/black tape */}
        <div className="absolute top-0 left-0 right-0 h-5 bg-[repeating-linear-gradient(45deg,#FF6A1A_0,#FF6A1A_18px,#0a0a0a_18px,#0a0a0a_36px)] opacity-65 border-b border-[#FF6A1A]/40" />
        {/* Overhead floodlight — pinpoint, no large halo */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_18px_6px_rgba(255,255,255,0.10)]" />
      </motion.div>

      {/* Midground: range markers + signage — neutral chrome, single orange call-out */}
      <motion.div className="absolute inset-0" style={{ x: midX, y: midY }}>
        <div className="absolute left-[5%] top-[34%] px-3 py-1 bg-black/60 border border-zinc-600/70">
          <div className="text-[9px] font-black text-zinc-300 tracking-[0.3em]">RANGE-A</div>
        </div>
        <div className="absolute right-[5%] top-[34%] px-3 py-1 bg-black/60 border border-[#FF6A1A]/60">
          <div className="text-[9px] font-black text-[#FF8A3A] tracking-[0.3em]">BAY-04</div>
        </div>
        {/* Distance markers on back wall */}
        <div className="absolute left-1/2 top-[36%] -translate-x-1/2 flex gap-12 opacity-60">
          {['10m', '20m', '30m'].map(d => (
            <div key={d} className="px-2 py-0.5 border border-zinc-600 text-[8px] font-mono text-zinc-400">{d}</div>
          ))}
        </div>
        {/* Lane numbers strip — neutral hairline chips */}
        <div className="absolute inset-x-0 top-[44%] flex justify-around text-zinc-400 text-[10px] font-black tracking-widest">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="px-2 py-0.5 border border-zinc-700 bg-black/50">L{n}</div>
          ))}
        </div>
      </motion.div>

      {/* Spawn doors: panels at the far end of each lane */}
      <div className="absolute inset-x-0 top-[50%] flex justify-around">
        <SpawnPanel active />
        <SpawnPanel />
        <SpawnPanel active />
        <SpawnPanel />
        <SpawnPanel active />
      </div>

      {/* Foreground: target rails, lane stands, sandbags */}
      <motion.div className="absolute inset-0" style={{ x: fgX, y: fgY }}>
        {/* Sliding rail — neutral brushed steel, no cyan glow */}
        <div className="absolute left-[5%] right-[5%] top-[60%] h-[2px] bg-gradient-to-r from-zinc-900 via-zinc-400 to-zinc-900" />
        {/* Per-lane stands and floor pads */}
        {[12, 30, 50, 70, 88].map(x => (
          <div key={x} className="absolute" style={{ left: `${x}%`, top: '74%' }}>
            <div className="w-1 h-10 bg-zinc-700 mx-auto" />
            <div className="w-12 h-2 -mt-0.5 bg-zinc-900 border border-zinc-600 rounded-sm" />
          </div>
        ))}
        {/* Sandbag platform / boss spawn */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-44 h-4 rounded-md bg-amber-900 border-2 border-amber-950 shadow-[0_6px_10px_rgba(0,0,0,0.7)]">
          <div className="absolute inset-x-2 inset-y-0.5 grid grid-cols-5 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-amber-800 border border-amber-950 rounded-sm" />
            ))}
          </div>
        </div>
        {/* Training identity props: foam targets, crate stacks, simple a-frame stands */}
        <FoamTarget x="14%" bottom="22%" size={42} />
        <FoamTarget x="86%" bottom="22%" size={42} />
        <FoamTarget x="38%" bottom="14%" size={36} />
        <FoamTarget x="62%" bottom="14%" size={36} />
        <CrateStack x="6%" bottom="6%" tall />
        <CrateStack x="92%" bottom="6%" />
        <SimpleStand x="22%" bottom="10%" />
        <SimpleStand x="78%" bottom="10%" />
      </motion.div>

      <FloorPerspective tone="training" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ShutterDoor({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative w-24 h-28 border rounded-sm overflow-hidden ${active ? 'border-[#FF6A1A]/50' : 'border-zinc-800'}`}>
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_4px,transparent_4px,transparent_8px)]" />
      <div className="absolute bottom-1 left-1 right-1 h-1 bg-zinc-800 rounded-sm" />
      {/* Top-tick orange accent — static, no infinite scan band */}
      {active && (
        <span className="absolute left-0 top-0 h-[2px] w-8 bg-[#FF6A1A]" />
      )}
      <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${active ? 'bg-[#FF6A1A]' : 'bg-zinc-700'}`} />
    </div>
  );
}

function RooftopVent({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative w-20 h-16 border rounded-sm bg-zinc-900 ${active ? 'border-[#FF6A1A]/50' : 'border-zinc-800'}`}>
      <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="bg-zinc-950 border border-zinc-800" />))}
      </div>
      {/* Static orange accent — no infinite fuchsia pulse */}
      {active && (
        <span className="absolute left-0 top-0 h-[2px] w-6 bg-[#FF6A1A]" />
      )}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-zinc-800 rounded-t-sm" />
    </div>
  );
}

function SpawnPanel({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative w-16 h-20 border rounded-sm ${active ? 'border-[#19E0FF]/45' : 'border-zinc-800'}`}>
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-1 border border-zinc-800" />
      <div className="absolute top-1 left-1 right-1 flex justify-between">
        <div className={`w-1 h-1 rounded-full ${active ? 'bg-[#19E0FF]' : 'bg-zinc-700'}`} />
        <div className={`w-1 h-1 rounded-full ${active ? 'bg-[#FF6A1A]' : 'bg-zinc-700'}`} />
      </div>
      {/* Top-tick cyan accent for active lanes — no infinite scan blur */}
      {active && (
        <span className="absolute left-0 top-0 h-[2px] w-6 bg-[#19E0FF]" />
      )}
      <div className="absolute bottom-0 left-0 right-0 text-center text-[7px] font-black text-zinc-500">SPAWN</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-arena lighting overlay
// Layered above the CSS scene but below targets / HUD. Black-first now — each
// arena keeps just enough directional accent to preserve identity without
// painting a screen-wide cyan/blue wash.
//   training  → restrained neutral overhead, single orange accent
//   warehouse → low-saturation amber key from above, hairline cyan rim
//   rooftop   → small sharp moon disc + strong vignette, no blue fog
// All washes are kept under ~0.10 alpha and ≤ 40% radius so targets remain
// the brightest object on screen.
// ─────────────────────────────────────────────────────────────────────────────
function ArenaLighting({ arenaId }: { arenaId: ArenaId }) {
  if (arenaId === 'warehouse') {
    return (
      <div className="absolute inset-0 pointer-events-none z-[1]">
        {/* Single warm key from above — replaces the dual cyan + magenta wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 40% 28% at 50% 8%, rgba(254,243,199,0.12), transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* Hairline cyan rim along the back wall — data/system accent only */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 12% at 50% 36%, rgba(25,224,255,0.08), transparent 75%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* Strong vignette so edges fall to true black */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.92) 100%)',
          }}
        />
      </div>
    );
  }
  if (arenaId === 'rooftop') {
    return (
      <div className="absolute inset-0 pointer-events-none z-[1]">
        {/* Small sharp moon disc — no big blue halo, no linear gradient sweep */}
        <div
          className="absolute"
          style={{
            top: '5%',
            left: '14%',
            width: '64px',
            height: '64px',
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(241,245,249,0.78) 0%, rgba(241,245,249,0.18) 55%, rgba(241,245,249,0) 80%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* Cool vignette — no blue multiply on the whole frame */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 12%, transparent 22%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.92) 100%)',
          }}
        />
      </div>
    );
  }
  // training — neutral with a single restrained orange accent
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      {/* Soft overhead key light — broad, neutral, lower intensity */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 12%, rgba(255,255,255,0.14), transparent 75%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Tactical orange accent above the lane line (replaces cyan accent) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 30% 18% at 50% 22%, rgba(255,106,26,0.10), transparent 78%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Floor shadow diffuses onto the ground */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.22) 50%, transparent 100%)',
        }}
      />
      {/* Vignette so edges remain black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 92%)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Training-bay props
// ─────────────────────────────────────────────────────────────────────────────

function FoamTarget({ x, bottom, size = 36 }: { x: string; bottom: string; size?: number }) {
  return (
    <div
      className="absolute"
      style={{ left: x, bottom, width: size, height: size + 14, transform: 'translateX(-50%)' }}
    >
      {/* Bullseye disc on a stick */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 rounded-full border-2 border-zinc-200 bg-white shadow-[0_3px_6px_rgba(0,0,0,0.55)]"
           style={{ width: size, height: size }}>
        <div className="absolute inset-1 rounded-full bg-rose-500" />
        <div className="absolute inset-[18%] rounded-full bg-white" />
        <div className="absolute inset-[32%] rounded-full bg-rose-500" />
        <div className="absolute inset-[46%] rounded-full bg-zinc-900" />
      </div>
      {/* Stick */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[3px] bg-zinc-500" style={{ height: 14 }} />
      {/* Soft cast shadow */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-[80%] h-1 rounded-full bg-black/40 blur-[2px]" />
    </div>
  );
}

function CrateStack({ x, bottom, tall = false }: { x: string; bottom: string; tall?: boolean }) {
  return (
    <div className="absolute" style={{ left: x, bottom, transform: 'translateX(-50%)' }}>
      <div className="flex flex-col items-center gap-[2px]">
        {tall && (
          <div className="w-12 h-7 bg-amber-700 border-2 border-amber-950 rounded-sm shadow-[0_3px_6px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-1 border border-amber-800/80" />
          </div>
        )}
        <div className="w-14 h-9 bg-amber-700 border-2 border-amber-950 rounded-sm shadow-[0_3px_6px_rgba(0,0,0,0.55)] relative">
          <div className="absolute inset-1 border border-amber-800/80" />
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px bg-amber-950/70" />
        </div>
        <div className="w-16 h-10 bg-amber-800 border-2 border-amber-950 rounded-sm shadow-[0_3px_6px_rgba(0,0,0,0.55)] relative">
          <div className="absolute inset-1 border border-amber-900/80" />
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-[110%] h-1 rounded-full bg-black/45 blur-[2px]" />
    </div>
  );
}

function SimpleStand({ x, bottom }: { x: string; bottom: string }) {
  return (
    <div className="absolute" style={{ left: x, bottom, transform: 'translateX(-50%)' }}>
      {/* A-frame style stand */}
      <div className="relative w-12 h-10">
        <div className="absolute left-0  bottom-0 w-[3px] h-10 bg-zinc-500 origin-bottom rotate-[14deg]" />
        <div className="absolute right-0 bottom-0 w-[3px] h-10 bg-zinc-500 origin-bottom -rotate-[14deg]" />
        <div className="absolute inset-x-1 top-1 h-1 bg-zinc-700 rounded-sm" />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-[90%] h-1 rounded-full bg-black/40 blur-[2px]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Warehouse props
// ─────────────────────────────────────────────────────────────────────────────

function IndustrialPanel({ x, y, tone }: { x: string; y: string; tone: 'cyan' | 'amber' }) {
  const palette = tone === 'cyan'
    ? { border: 'border-[#19E0FF]/40',  led: 'bg-[#19E0FF]' }
    : { border: 'border-[#FF6A1A]/45',  led: 'bg-[#FF6A1A]' };
  return (
    <div
      className={`absolute w-20 h-14 bg-zinc-950/90 border ${palette.border} rounded-sm`}
      style={{ left: x, top: y, transform: 'translateX(-50%)' }}
    >
      <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800" />
        ))}
      </div>
      {/* Hard-edge LED — no infinite animate-pulse */}
      <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${palette.led}`} />
      <div className="absolute bottom-1 left-1 right-1 h-[2px] bg-zinc-800" />
    </div>
  );
}

function Machinery({ x, y }: { x: string; y: string }) {
  return (
    <div
      className="absolute"
      style={{ left: x, top: y, transform: 'translateX(-50%)' }}
    >
      <div className="relative w-28 h-12 bg-zinc-700 border-2 border-zinc-900 rounded-sm shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
        <div className="absolute -top-3 left-2 w-6 h-3 bg-zinc-700 border-2 border-zinc-900 rounded-t-sm" />
        <div className="absolute -top-3 right-3 w-3 h-3 bg-zinc-800 rounded-full border border-zinc-600" />
        <div className="absolute inset-1 border border-zinc-600/70" />
        <div className="absolute bottom-1 left-2 right-2 h-2 bg-cyan-400/30 border border-cyan-300/50" />
      </div>
    </div>
  );
}

// Thin accent rail — hard-edge hairline, no blur halo. Color from the token
// palette (cyan = data/system, orange = action). Used sparingly.
function NeonRail({
  orientation, left, right, top, leftPx, topPx, length, color,
}: {
  orientation: 'horizontal' | 'vertical';
  left?: string; right?: string; top?: string;
  leftPx?: string; topPx?: string; length?: string;
  color: string;
}) {
  if (orientation === 'horizontal') {
    return (
      <div className="absolute" style={{ left, right, top, height: '1px' }}>
        <div className="absolute inset-0" style={{ background: color, opacity: 0.55 }} />
      </div>
    );
  }
  return (
    <div className="absolute" style={{ left: leftPx, top: topPx, width: '1px', height: length }}>
      <div className="absolute inset-0" style={{ background: color, opacity: 0.5 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rooftop props
// ─────────────────────────────────────────────────────────────────────────────

function RoofVentBox({ x, bottom, rotated = false }: { x: string; bottom: string; rotated?: boolean }) {
  return (
    <div
      className="absolute"
      style={{
        left: x, bottom,
        transform: `translateX(-50%) ${rotated ? 'skewX(-3deg)' : ''}`,
      }}
    >
      <div className="relative w-20 h-10 bg-zinc-800 border-2 border-zinc-900 rounded-sm shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
        {/* Vent louvres */}
        <div className="absolute inset-1 grid grid-rows-3 gap-[2px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-700/70" />
          ))}
        </div>
        {/* Top cap */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-zinc-700 rounded-t-sm" />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-[110%] h-1 rounded-full bg-black/55 blur-[2px]" />
    </div>
  );
}

function Antenna({
  x, bottom, height, blink = false,
}: { x: string; bottom: string; height: string; blink?: boolean }) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: x, bottom, transform: 'translateX(-50%)', height }}
    >
      {/* Tip light */}
      <div className={`w-1.5 h-1.5 rounded-full ${blink ? 'bg-rose-500 animate-pulse' : 'bg-rose-400'}`}
           style={{ boxShadow: '0 0 8px rgba(244,63,94,0.7)' }} />
      {/* Mast */}
      <div className="w-[2px] flex-1 bg-zinc-500" />
      {/* Cross-struts */}
      <div className="relative w-4 -mt-[60%] -mb-1 self-center">
        <div className="absolute left-0 right-0 top-1/3 h-[1px] bg-zinc-600" />
        <div className="absolute left-0 right-0 top-2/3 h-[1px] bg-zinc-600" />
      </div>
    </div>
  );
}

function SatelliteDish({ x, bottom }: { x: string; bottom: string }) {
  return (
    <div className="absolute" style={{ left: x, bottom, transform: 'translateX(-50%)' }}>
      <div className="relative w-14 h-10">
        {/* Dish */}
        <div
          className="absolute left-0 top-0 w-12 h-12 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(244,244,245,0.3), rgba(63,63,70,0.95) 70%)',
            border: '2px solid rgba(24,24,27,0.95)',
            transform: 'rotate(-25deg) scaleY(0.55)',
          }}
        />
        {/* Mount */}
        <div className="absolute right-0 bottom-0 w-[3px] h-7 bg-zinc-600" />
        <div className="absolute right-[-2px] bottom-7 w-2 h-2 bg-zinc-500 rounded-full" />
      </div>
    </div>
  );
}

function DistantSkylineRow() {
  return (
    <div className="absolute inset-x-0 top-[40%] h-[10%] opacity-50 pointer-events-none">
      <div className="absolute inset-0 flex items-end gap-0.5 px-[2%]">
        {Array.from({ length: 26 }).map((_, i) => {
          const h = 30 + ((i * 17) % 70);
          const w = 2 + ((i * 7) % 4);
          return (
            <div
              key={i}
              className="bg-black/85 border-t border-zinc-800/40"
              style={{ height: `${h}%`, width: `${w}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function FloorPerspective({ tone }: { tone: 'training' | 'warehouse' | 'rooftop' }) {
  // Floor lines neutralised to a hairline white — each arena keeps its
  // identity via its props/lighting, not via a tinted grid wash.
  const palette = {
    training:  { line: 'rgba(255,255,255,0.10)', floor: 'linear-gradient(to top, #050507 0%, #0c0e11 60%, transparent 100%)' },
    warehouse: { line: 'rgba(255,255,255,0.08)', floor: 'linear-gradient(to top, #040405 0%, #0c0c0d 60%, transparent 100%)' },
    rooftop:   { line: 'rgba(255,255,255,0.08)', floor: 'linear-gradient(to top, #030305 0%, #0a0a0c 60%, transparent 100%)' },
  }[tone];
  return (
    <div className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none">
      <div className="absolute inset-0" style={{ background: palette.floor }} />
      {/* Perspective grid — neutral hairline, no colored wash */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          transform: 'perspective(700px) rotateX(60deg) translateY(20%) scale(1.6)',
          transformOrigin: 'center top',
          maskImage: 'linear-gradient(to top, black 30%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 90%)',
        }}
      />
      {/* Floor accent line at horizon */}
      <div className="absolute inset-x-0 top-[2%] h-px bg-white/10" />
    </div>
  );
}

