import React from 'react';
import { motion, MotionValue, useMotionValue, useTransform } from 'motion/react';

export type ArenaId = 'training' | 'warehouse' | 'rooftop';

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
        {/* Background: dim warehouse wall */}
        <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#171615] to-[#0c0a08]" />
          {/* Corrugated roof beams */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0)_0,rgba(0,0,0,0)_60px,rgba(255,255,255,0.04)_60px,rgba(255,255,255,0.04)_62px)]" />
          {/* High-bay light cones */}
          <div className="absolute top-2 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_50px_30px_rgba(254,243,199,0.18)]" />
          <div className="absolute top-2 right-1/4 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_50px_30px_rgba(254,243,199,0.18)]" />
          <div className="absolute top-2 left-1/2 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_60px_36px_rgba(254,243,199,0.20)]" />
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
        </motion.div>

        <FloorPerspective tone="warehouse" />
      </div>
    );
  }

  if (arenaId === 'rooftop') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background: dusk sky + distant skyline */}
        <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0d2e] via-[#3a1b3d] to-[#0a0a14]" />
          {/* Stars / city haze */}
          <div className="absolute inset-0 opacity-80">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-px bg-white/70 rounded-full"
                style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 40}%`, opacity: 0.3 + ((i * 7) % 7) / 10 }}
              />
            ))}
          </div>
          {/* Distant horizon glow */}
          <div className="absolute inset-x-0 top-[55%] h-12 bg-gradient-to-t from-orange-600/40 via-fuchsia-700/20 to-transparent blur-xl" />
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
        </motion.div>

        <FloorPerspective tone="rooftop" />
      </div>
    );
  }

  // Default: training bay
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background: training-bay wall with safety stripes */}
      <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#101418] via-[#1a1f24] to-[#0a0d11]" />
        {/* Hex pattern wall */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(34,211,238,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Hazard banner across top */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-[repeating-linear-gradient(45deg,#facc15_0,#facc15_18px,#0a0a0a_18px,#0a0a0a_36px)] opacity-70 border-b-2 border-yellow-600" />
        {/* Cyan floodlight */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-200 shadow-[0_0_60px_40px_rgba(165,243,252,0.18)]" />
      </motion.div>

      {/* Midground: range markers + signage */}
      <motion.div className="absolute inset-0" style={{ x: midX, y: midY }}>
        <div className="absolute left-[5%] top-[34%] px-3 py-1 bg-cyan-900/60 border border-cyan-400/60 backdrop-blur-sm">
          <div className="text-[9px] font-black text-cyan-300 tracking-[0.3em]">RANGE-A</div>
        </div>
        <div className="absolute right-[5%] top-[34%] px-3 py-1 bg-amber-900/60 border border-amber-400/60 backdrop-blur-sm">
          <div className="text-[9px] font-black text-amber-300 tracking-[0.3em]">BAY-04</div>
        </div>
        {/* Distance markers on back wall */}
        <div className="absolute left-1/2 top-[36%] -translate-x-1/2 flex gap-12 opacity-60">
          {['10m', '20m', '30m'].map(d => (
            <div key={d} className="px-2 py-0.5 border border-zinc-500 text-[8px] font-mono text-zinc-300">{d}</div>
          ))}
        </div>
        {/* Lane numbers strip */}
        <div className="absolute inset-x-0 top-[44%] flex justify-around text-cyan-400/60 text-[10px] font-black tracking-widest">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="px-2 py-0.5 border border-cyan-400/30 bg-black/40">L{n}</div>
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
        {/* Sliding rail */}
        <div className="absolute left-[5%] right-[5%] top-[60%] h-[3px] rounded-full bg-gradient-to-r from-cyan-900 via-cyan-300 to-cyan-900 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
        {/* Per-lane stands and floor pads */}
        {[12, 30, 50, 70, 88].map(x => (
          <div key={x} className="absolute" style={{ left: `${x}%`, top: '74%' }}>
            <div className="w-1 h-10 bg-cyan-900 mx-auto" />
            <div className="w-12 h-2 -mt-0.5 bg-zinc-900 border border-cyan-500/40 rounded-sm" />
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
    <div className={`relative w-24 h-28 border-2 rounded-md overflow-hidden ${active ? 'border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.4)]' : 'border-zinc-700'}`}>
      <div className="absolute inset-0 bg-zinc-900" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_4px,transparent_4px,transparent_8px)]" />
      <div className="absolute bottom-1 left-1 right-1 h-1 bg-zinc-700 rounded-sm" />
      {active && (
        <motion.div
          animate={{ y: ['100%', '-100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-2 bg-cyan-300/40 blur-sm"
        />
      )}
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
    </div>
  );
}

function RooftopVent({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative w-20 h-16 border-2 rounded-sm bg-zinc-800 ${active ? 'border-fuchsia-400/70 shadow-[0_0_15px_rgba(232,121,249,0.4)]' : 'border-zinc-700'}`}>
      <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="bg-zinc-900 border border-zinc-700/70" />))}
      </div>
      {active && (
        <motion.div
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute inset-0 bg-fuchsia-400/20"
        />
      )}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-zinc-700 rounded-t-sm" />
    </div>
  );
}

function SpawnPanel({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative w-16 h-20 border-2 rounded-sm ${active ? 'border-cyan-400/70 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-zinc-700'}`}>
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-1 border border-cyan-400/30" />
      <div className="absolute top-1 left-1 right-1 flex justify-between">
        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
        <div className={`w-1 h-1 rounded-full ${active ? 'bg-amber-400 animate-pulse' : 'bg-zinc-700'}`} />
      </div>
      {active && (
        <motion.div
          animate={{ y: ['100%', '-100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-1 h-1 bg-cyan-300/60 blur-[1px]"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 text-center text-[7px] font-black text-cyan-300/60">SPAWN</div>
    </div>
  );
}

function FloorPerspective({ tone }: { tone: 'training' | 'warehouse' | 'rooftop' }) {
  const palette = {
    training:  { line: 'rgba(34,211,238,0.18)', floor: 'linear-gradient(to top, #0a0d11 0%, #131820 60%, transparent 100%)' },
    warehouse: { line: 'rgba(180,83,9,0.18)',   floor: 'linear-gradient(to top, #0a0a08 0%, #181612 60%, transparent 100%)' },
    rooftop:   { line: 'rgba(217,70,239,0.16)', floor: 'linear-gradient(to top, #08070d 0%, #1a1326 60%, transparent 100%)' },
  }[tone];
  return (
    <div className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none">
      <div className="absolute inset-0" style={{ background: palette.floor }} />
      {/* Perspective grid */}
      <div
        className="absolute inset-0 opacity-70"
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

