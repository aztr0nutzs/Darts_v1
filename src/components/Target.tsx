import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Swords, Crosshair, Radar } from 'lucide-react';

export type TargetData = {
  id: string;
  x: number;
  y: number;
  type: 
    | 'standard' | 'moving' | 'bonus' | 'armored' | 'exploding' | 'erratic' | 'splitting' | 'teleporting' | 'heavy_armor' | 'powerup_damage' | 'powerup_rapid' | 'powerup_shield' | 'hostile' | 'shielded' | 'drone' | 'jammer' | 'reflector' | 'decoy' | 'phantom'
    | 'orbital_array' | 'code_matrix' | 'gravity_tower' | 'data_sphere' | 'warp_gate' | 'bot_sentry'
    | 'kinetic_swarm' | 'aether_pylon' | 'astro_hive' | 'neural_grid' | 'sentinel_bot' | 'phase_target';
  createdAt: number;
  lifespan: number;
  points: number;
  hp: number;
  maxHp: number;
  scale?: number;
  nextFireTime?: number;
};

interface TargetProps {
  key?: React.Key;
  target: TargetData;
  onHit: (id: string, x: number, y: number) => void;
  cursorPos?: { x: number, y: number };
}

function HexNode({ color, score, active }: { color: string, score: number, active?: boolean, key?: React.Key }) {
  return (
    <div className={`relative w-8 h-9 flex items-center justify-center transition-all ${active ? 'scale-110' : 'opacity-40 scale-90'}`}>
       <svg viewBox="0 0 100 115.47" className={`absolute inset-0 w-full h-full fill-slate-900 stroke-2 ${active ? color : 'stroke-slate-700'}`}>
         <polygon points="50,0 100,28.87 100,86.6 50,115.47 0,86.6 0,28.87" />
       </svg>
       {active && <div className={`absolute inset-2 blur-sm rounded-full opacity-60 ${color === 'stroke-orange-500' ? 'bg-orange-500' : 'bg-cyan-500'}`} />}
       <span className="relative z-10 text-[8px] font-black">{score}</span>
    </div>
  );
}

export default function Target({ target, onHit, cursorPos }: TargetProps) {
  // Target type checks
  const isNerdSet = ['orbital_array', 'code_matrix', 'gravity_tower', 'data_sphere', 'warp_gate', 'bot_sentry'].includes(target.type);
  const isNerfSet = ['kinetic_swarm', 'aether_pylon', 'astro_hive', 'neural_grid', 'sentinel_bot', 'phase_target'].includes(target.type);
  const isSpecial = isNerdSet || isNerfSet;
  
  const isBonus = target.type === 'bonus';
  const isArmored = target.type === 'armored';
  const isExploding = target.type === 'exploding';
  const isErratic = target.type === 'erratic';
  const isMoving = target.type === 'moving';
  const isSplitting = target.type === 'splitting';
  const isTeleporting = target.type === 'teleporting';
  const isHeavyArmor = target.type === 'heavy_armor';
  const isHostile = target.type === 'hostile';
  const isDrone = target.type === 'drone';
  const isJammer = target.type === 'jammer';
  const isReflector = target.type === 'reflector';
  const isDecoy = target.type === 'decoy';
  const isPhantom = target.type === 'phantom';
  const isShielded = target.type === 'shielded';
  const isPowerupDamage = target.type === 'powerup_damage';
  const isPowerupRapid = target.type === 'powerup_rapid';
  const isPowerupShield = target.type === 'powerup_shield';
  const isPowerup = isPowerupDamage || isPowerupRapid || isPowerupShield;

  const prevHp = React.useRef(target.hp);
  const [flash, setFlash] = React.useState(false);

  React.useEffect(() => {
    if (target.hp < prevHp.current) {
       setFlash(true);
       setTimeout(() => setFlash(false), 120);
    }
    prevHp.current = target.hp;
  }, [target.hp]);

  const baseScale = target.scale || 1;
  const hpPercentage = target.hp / target.maxHp;

  // Charging / Attack Logic
  const isReflecting = isReflector && target.nextFireTime && target.nextFireTime > Date.now();
  const timeUntilAttack = target.nextFireTime ? Math.max(0, target.nextFireTime - Date.now()) : 2000;
  const attackProgress = Math.max(0, Math.min(1, 1 - (timeUntilAttack / 2000)));
  const isCharging = (isHostile || isDrone) && attackProgress > 0.5;

  // Phantom Reveal Logic
  const dist = cursorPos ? Math.sqrt(
    Math.pow((cursorPos.x / window.innerWidth * 100) - target.x, 2) + 
    Math.pow((cursorPos.y / window.innerHeight * 100) - target.y, 2)
  ) : 100;
  const isRevealed = dist < 15;

  let animateProps: any = { 
    scale: flash ? baseScale * 1.3 : baseScale, 
    opacity: 1,
    rotate: flash ? [0, -5, 5, 0] : 0,
    filter: flash ? 'brightness(1.5) drop-shadow(0 0 10px white)' : 'none'
  };
  let transitionProps: any = { type: "spring", stiffness: 200, damping: 10 };

  if (isMoving || target.type === 'bot_sentry') {
    animateProps.x = ["-50%", "50%", "-50%"];
    transitionProps = { ...transitionProps, x: { repeat: Infinity, duration: 4, ease: "linear" } };
  } else if (isErratic || target.type === 'sentinel_bot') {
    animateProps.x = ["-30%", "30%", "-20%", "40%", "-30%"];
    animateProps.y = ["-20%", "40%", "-40%", "20%", "-20%"];
    transitionProps = { ...transitionProps, x: { repeat: Infinity, duration: 2 }, y: { repeat: Infinity, duration: 1.8 } };
  } else if (isDrone || target.type === 'kinetic_swarm') {
    animateProps.scale = [baseScale, baseScale * 1.05, baseScale];
    animateProps.rotate = [0, 2, -2, 0];
    transitionProps = { ...transitionProps, scale: { repeat: Infinity, duration: 2 }, rotate: { repeat: Infinity, duration: 4 } };
  } else if (isPhantom) {
    animateProps.opacity = isRevealed ? 0.8 : 0.05;
    animateProps.scale = isRevealed ? baseScale : baseScale * 0.8;
    transitionProps = { ...transitionProps, opacity: { duration: 0.3 } };
  }

  // Visual Theme mapping 
  const nerdBlue = 'text-cyan-400 border-cyan-400 shadow-[0_0_20px_#22d3ee]';
  const nerdOrange = 'text-orange-500 border-orange-500 shadow-[0_0_20px_#f97316]';
  const nerfBlue = 'text-blue-500 border-blue-500 shadow-[0_0_20px_#3b82f6]';
  const nerfOrange = 'text-orange-400 border-orange-400 shadow-[0_0_20px_#fb923c]';

  const renderInner = () => {
    switch (target.type) {
      case 'orbital_array':
        return (
          <div className="relative w-40 h-40 flex items-center justify-center">
             <div className={`absolute inset-0 rounded-full border-[10px] ${nerdBlue} bg-blue-900/40`} />
             <div className="absolute inset-4 rounded-full border-4 border-orange-500 shadow-[0_0_15px_#f97316]" data-hit-zone="armor" />
             <div className="absolute inset-8 rounded-full border-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" data-hit-zone="weak_point" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-white italic" data-hit-zone="weak_point">100</div>
             {/* Thruster Vents */}
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 border-2 border-cyan-300 rounded-sm" />
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-4 bg-orange-500 rounded-custom" />
             <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-600 rounded-full" />
             <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-600 rounded-full" />
          </div>
        );
      case 'code_matrix':
        return (
          <div className="relative w-36 h-48 bg-slate-900 border-4 border-cyan-500 rounded-xl p-4 flex flex-col gap-2 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
             <div className="text-[8px] font-black text-cyan-400 mb-1 opacity-60">MATRIX_INPUT_V.04</div>
             <div className="grid grid-cols-3 gap-2">
                {[75, 75, 125, 75, 125, 75].map((s, i) => (
                  <HexNode key={i} color={i % 2 === 0 ? 'stroke-orange-500' : 'stroke-cyan-500'} score={s} active={hpPercentage > 0.3} />
                ))}
             </div>
             <div className="mt-auto flex justify-between items-end">
                <div className="w-16 h-1 bg-cyan-900 rounded-full">
                  <motion.div animate={{ width: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-cyan-400" />
                </div>
                <div className="text-[10px] font-black text-orange-500 animate-pulse">OVERRICE</div>
             </div>
          </div>
        );
      case 'warp_gate':
        return (
          <div className="relative w-44 h-44 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-8 border-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)]" />
             <div className="absolute inset-4 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
                  transition={{ rotate: { duration: 5, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity } }}
                  className="absolute inset-0 bg-[conic-gradient(from_0deg,#1e1b4b,#3b82f6,#60a5fa,#1e1b4b)] opacity-80 blur-xl" 
                />
             </div>
             <div className="absolute bottom-[-10px] w-24 h-12 bg-slate-800 border-t-4 border-blue-500 rounded-t-2xl flex items-center justify-center">
                <span className="text-xl font-black text-white italic">100</span>
             </div>
          </div>
        );
      case 'kinetic_swarm':
        return (
          <div className="relative w-48 h-48 flex items-center justify-center">
             <div className="w-20 h-20 rounded-full border-4 border-blue-500 bg-slate-900 flex items-center justify-center shadow-[0_0_20px_#3b82f6]" data-hit-zone="weak_point">
                <div className="text-[10px] font-black text-blue-400 text-center uppercase pointer-events-none">SWARM<br/><span className="text-xl text-white">500</span></div>
             </div>
             {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
               <div key={angle} className="absolute" style={{ transform: `rotate(${angle}deg) translateY(-80px)` }} data-hit-zone="armor">
                  <div className="w-2 h-12 bg-slate-700" />
                  <div className="w-10 h-10 -translate-x-4 rounded-full border-2 border-orange-400 bg-slate-900 flex items-center justify-center shadow-[0_0_10px_#fb923c]">
                     <span className="text-[10px] font-black text-white" style={{ transform: `rotate(${-angle}deg)` }}>50</span>
                  </div>
               </div>
             ))}
          </div>
        );
      case 'aether_pylon':
        return (
          <div className="relative w-28 h-56 flex flex-col items-center">
             <div className="w-full h-8 bg-orange-500 rounded-xl rounded-b-none border-b-2 border-slate-900" data-hit-zone="armor" />
             <div className="w-3/4 flex-1 bg-slate-900 border-x-4 border-blue-500 relative overflow-hidden" data-hit-zone="weak_point">
                <motion.div 
                  animate={{ y: [-100, 100], opacity: [0.2, 0.6, 0.2] }} 
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-400 blur-2xl" 
                />
                <div className="absolute inset-4 border border-blue-400/30 flex items-center justify-center">
                   <div className="text-3xl font-black text-blue-400 drop-shadow-[0_0_10px_#60a5fa] animate-pulse">300</div>
                </div>
             </div>
             <div className="w-full h-12 bg-orange-500 rounded-xl rounded-t-none border-t-4 border-slate-900 p-2 flex justify-between">
                <div className="text-[8px] font-black bg-blue-900 px-1 rounded">100</div>
                <div className="text-[8px] font-black bg-blue-900 px-1 rounded">50</div>
             </div>
          </div>
        );
      case 'gravity_tower':
        return (
          <div className="relative w-24 h-64 flex flex-col items-center">
             <div className="w-full h-12 bg-blue-600 rounded-t-xl border-b-4 border-slate-900 flex items-center justify-center">
                <span className="text-[10px] font-black text-white px-2 py-0.5 bg-orange-500 rounded">NERD</span>
             </div>
             <div className="w-16 flex-1 bg-blue-500 relative border-x-4 border-slate-800">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,0,0,0.1)_20px,rgba(0,0,0,0.1)_40px)]" />
                {[50, 100, 50, 150, 150].map((s, i) => (
                  <div key={i} className={`absolute w-12 h-12 rounded-lg border-2 border-orange-500 bg-slate-900 flex items-center justify-center shadow-[0_0_10px_#f97316]`}
                    style={{ 
                      top: `${20 + i * 15}%`, 
                      left: i % 2 === 0 ? '-30px' : '40px',
                      transform: 'rotate(45deg)'
                    }}
                  >
                     <span className="text-xs font-black text-white" style={{ transform: 'rotate(-45deg)' }}>{s}</span>
                  </div>
                ))}
             </div>
             <div className="w-32 h-16 bg-blue-600 rounded-xl border-t-4 border-slate-800 flex items-center justify-center">
                <div className="text-[10px] font-black text-white drop-shadow-[0_0_5px_white]">GRAVITY_SENSOR</div>
             </div>
          </div>
        );
      case 'data_sphere':
        return (
          <div className="relative w-44 h-44 flex items-center justify-center scale-90">
             <div className="absolute inset-0 bg-blue-600 rounded-full border-4 border-slate-900" />
             <div className="absolute inset-2 grid grid-cols-3 gap-1 rotate-12">
                {[50, 100, 150, 50, 100, 150, 50, 100, 150].map((s, i) => (
                  <div key={i} className={`w-full h-full flex items-center justify-center bg-slate-900/40 border border-orange-400 rounded-sm`}>
                    <span className="text-[10px] font-black text-orange-400">{s}</span>
                  </div>
                ))}
             </div>
             <div className="absolute bottom-[-15px] w-28 h-12 bg-blue-600 border-2 border-slate-800 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-black text-white">DATA_CORE</span>
             </div>
          </div>
        );
      case 'bot_sentry':
        return (
          <div className="relative w-40 h-48 flex flex-col items-center">
             <div className="w-32 h-32 bg-blue-500 border-4 border-slate-900 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                <div className="absolute top-2 w-16 h-4 bg-orange-500 rounded-full" />
                <div className="w-20 h-20 rounded-full border-4 border-orange-500 bg-slate-900 flex items-center justify-center shadow-[0_0_20px_#f97316]">
                   <span className="text-3xl font-black text-white italic">200</span>
                </div>
                {/* Antennas */}
                <div className="absolute -top-10 left-4 w-1 h-12 bg-slate-600 origin-bottom rotate-[-20deg]" />
                <div className="absolute -top-10 right-4 w-1 h-12 bg-slate-600 origin-bottom rotate-[20deg]" />
             </div>
             <div className="w-full flex justify-between mt-auto">
                <div className="w-12 h-12 bg-slate-800 border-4 border-orange-400 rounded-full" />
                <div className="w-12 h-12 bg-slate-800 border-4 border-orange-400 rounded-full translate-y-2" />
                <div className="w-12 h-12 bg-slate-800 border-4 border-orange-400 rounded-full" />
             </div>
          </div>
        );
      case 'astro_hive':
        return (
          <div className="relative w-48 h-64 flex flex-col items-center justify-center">
             <div className="relative w-20 h-56 bg-slate-800 border-x-4 border-purple-500 rounded-full" data-hit-zone="armor">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-4 border-purple-400 rounded-full flex items-center justify-center bg-slate-900 shadow-[0_0_30px_#c084fc]" data-hit-zone="weak_point">
                   <span className="text-3xl font-black text-white italic">200</span>
                </div>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="absolute left-1/2 -translate-x-1/2 w-16 h-18" style={{ top: `${15 + i * 20}%`, transform: `translateX(${i % 2 === 0 ? '-80px' : '30px'})` }}>
                     <HexNode color="stroke-purple-500" score={i * 25 + 25} active={true} />
                  </div>
                ))}
             </div>
             <div className="mt-auto w-32 h-10 bg-slate-800 border-t-4 border-purple-600 rounded-t-3xl" />
          </div>
        );
      case 'neural_grid':
        return (
          <div className="relative w-56 h-40 bg-slate-900 border-4 border-blue-500 rounded-xl p-4 grid grid-cols-4 gap-2 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
             <div className="col-span-2 row-span-2 bg-blue-900/40 border-2 border-cyan-400 rounded-lg flex items-center justify-center" data-hit-zone="weak_point">
                <div className="text-center">
                   <div className="text-[8px] font-black text-cyan-400 pointer-events-none">NEURAL_TAG</div>
                   <div className="text-3xl font-black text-white pointer-events-none">500</div>
                </div>
             </div>
             {[150, 150, 75, 75].map((s, i) => (
                <div key={i} className="bg-slate-800 border-2 border-orange-500 rounded flex items-center justify-center group-hover:scale-105 transition-transform">
                   <span className="text-[10px] font-black text-white">{s}</span>
                </div>
             ))}
             <div className="col-span-2 h-4 bg-orange-600 rounded-full mt-auto flex items-center justify-center">
                <span className="text-[8px] font-black text-white tracking-widest">NEURAL-GRID</span>
             </div>
          </div>
        );
      case 'sentinel_bot':
        return (
          <div className="relative w-40 h-44 flex flex-col items-center">
             <div className="w-32 h-28 bg-slate-800 border-4 border-blue-500 rounded-xl relative flex items-center justify-center" data-hit-zone="armor">
                <div className="absolute -top-4 w-20 h-4 bg-orange-600 rounded-full flex items-center justify-center">
                   <div className="flex gap-1" data-hit-zone="weak_point">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                   </div>
                </div>
                <div className="text-center pointer-events-none" data-hit-zone="weak_point">
                   <div className="text-[10px] font-black text-blue-400 pointer-events-none">SENTINEL</div>
                   <div className="text-3xl font-black text-white pointer-events-none">200</div>
                </div>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-10 bg-orange-500 rounded border-2 border-slate-900 flex items-center justify-center">
                   <span className="text-[10px] font-black text-white italic">100</span>
                </div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-10 bg-orange-500 rounded border-2 border-slate-900 flex items-center justify-center">
                   <span className="text-[10px] font-black text-white italic">50</span>
                </div>
             </div>
             {/* Spider Legs */}
             <div className="flex gap-8 -mt-2">
                <div className="w-2 h-10 bg-slate-700 origin-top rotate-[-20deg]" />
                <div className="w-2 h-10 bg-slate-700 origin-top rotate-[20deg]" />
             </div>
          </div>
        );
      case 'phase_target':
        return (
          <div className="relative w-40 h-40 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-x-[12px] border-y-[6px] border-blue-500 rotate-45 shadow-[0_0_30px_#3b82f6]" data-hit-zone="armor" />
             <div className="absolute inset-4 rounded-full border-4 border-blue-400 opacity-60" />
             <div className="absolute inset-8 rounded-full border-8 border-orange-500 flex items-center justify-center bg-slate-900 shadow-[0_0_20px_#f97316]" data-hit-zone="weak_point">
                <div className="text-center">
                   <div className="text-[8px] font-black text-orange-400 mb-1">PHASE-CORE</div>
                   <div className="text-2xl font-black text-white italic underline">200</div>
                </div>
             </div>
             {[50, 100, 150].map((s, i) => (
                <div key={i} className="absolute font-black text-white text-[10px]" style={{ transform: `translateY(${i * 20 - 70}px)` }}>{s}</div>
             ))}
          </div>
        );
    }
  };

  return (
    <motion.div
      className="absolute cursor-crosshair z-20 group"
      style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ scale: 0, opacity: 0, x: "-50%", y: "-50%", rotate: -90 }}
      animate={animateProps}
      exit={{ scale: 0, opacity: 0, rotate: 90 }}
      transition={transitionProps}
      data-target="true"
      data-target-id={target.id}
      data-hit-zone="body"
    >
      {isPowerup ? (
        <div className={`relative flex items-center justify-center w-16 h-16 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] border-2 backdrop-blur-sm animate-pulse
          ${isPowerupDamage ? 'bg-red-950/90 border-red-500 shadow-red-500/50 text-red-500' : ''}
          ${isPowerupRapid ? 'bg-yellow-950/90 border-yellow-400 shadow-yellow-400/50 text-yellow-400' : ''}
          ${isPowerupShield ? 'bg-blue-950/90 border-blue-400 shadow-blue-400/50 text-blue-400' : ''}
        `}>
          <div className="absolute inset-0 bg-current opacity-20 rounded-xl" />
          {isPowerupDamage && <Swords className="w-8 h-8" />}
          {isPowerupRapid && <Zap className="w-8 h-8" />}
          {isPowerupShield && <Shield className="w-8 h-8" />}
        </div>
      ) : (
        <div className="relative">
          {renderInner()}
          
          {/* Universal HP / Lock-on Overlays */}
          {isCharging && (
            <motion.div 
              className="absolute -inset-4 rounded-full border-2 border-orange-500/50 pointer-events-none z-50"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-0.5 bg-orange-600 text-[8px] font-black italic rounded">LOCK-ON</div>
            </motion.div>
          )}

          {/* Target Health HUD (Radial) */}
          {hpPercentage < 1 && (
             <svg className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none -rotate-90 z-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="6" />
                <circle 
                  cx="50" cy="50" r="48" 
                  fill="none" 
                  stroke={hpPercentage > 0.5 ? '#22c55e' : hpPercentage > 0.25 ? '#eab308' : '#ef4444'} 
                  strokeWidth="4" 
                  strokeDasharray="301.59"
                  strokeDashoffset={301.59 * (1 - hpPercentage)} 
                  className="transition-all duration-300 ease-out"
                />
             </svg>
          )}
        </div>
      )}
    </motion.div>
  );
}
