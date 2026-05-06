import React, { useEffect, useState } from 'react';
import { GunType } from './Gun';
import { DartType } from '../App';
import { 
  Zap, Clock, Shield, Wind, Pause, Users,
  Target as TargetIcon, Heart, Crosshair, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HUDProps {
  score: number;
  timeLeft: number;
  ammo: number;
  gun: GunType;
  dart: DartType;
  isReloading: boolean;
  combo: number;
  credits: number;
  gameMode: string;
  lives: number;
  targetsHit: number;
  targetGoal: number;
  activeBuffs: { damage: number, rapidFire: number, shield: number };
  wave?: number;
  maxWave?: number;
  waveName?: string;
  targetScore?: number;
  levelName?: string;
  levelNumber?: number;
  targets?: any[]; 
  warnings?: string[];
  totalShots?: number;
  incomingProjectiles?: any[];
  multiplayerState?: any;
  socketId?: string;
  settings?: any;
  onPause?: () => void;
  onSkill?: (skill: string) => void;
  onReload?: () => void;
}

const RadarMap = ({ targets = [], projectiles = [] }: { targets: any[], projectiles: any[] }) => {
  return (
    <div className="relative w-32 h-32 bg-black/60 border-2 border-cyan-500/50 rounded-full overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md">
      {/* Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[size:16px_16px]" style={{ backgroundPosition: 'center center' }} />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/50" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
      
      {/* Radar Sweep */}
      <motion.div 
        className="absolute top-1/2 left-1/2 w-16 h-16 origin-top-left marker"
        style={{ background: 'conic-gradient(from 0deg, rgba(6,182,212,0.4) 0%, transparent 60%)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Targets */}
      {targets.map(t => {
        // Map 0-100% range to 0-100% of radar, center is 50,50
        const mx = t.x;
        const my = t.y;
        return (
          <div 
            key={t.id}
            className="absolute rounded-full w-2 h-2 bg-orange-500 shadow-[0_0_5px_#f97316] animate-pulse"
            style={{ left: `${mx}%`, top: `${my}%`, transform: 'translate(-50%, -50%)' }}
          />
        );
      })}

      {/* Projectiles */}
      {projectiles.map(p => {
         // Projectiles could just be shown at their dest or moving? 
         // Just show warning dot
         return (
           <div 
             key={p.id}
             className="absolute rounded-full w-3 h-3 bg-red-600 border border-white animate-[ping_0.5s_infinite]"
             style={{ left: `${p.endX || 50}%`, top: `${p.endY || 50}%`, transform: 'translate(-50%, -50%)' }}
           />
         );
      })}
    </div>
  );
};

export default function HUD({ 
  score, timeLeft, ammo, gun, dart, isReloading, combo, credits, 
  gameMode, lives,  targetsHit, targetGoal, activeBuffs,
  wave = 2, maxWave = 3, waveName, targetScore = 45000,
  levelName = "SKYLINE ROOFTOP", levelNumber = 3,
  targets = [],
  warnings = [],
  totalShots = 0,
  incomingProjectiles = [],
  multiplayerState,
  socketId,
  settings = {},
  onPause,
  onSkill,
  onReload
}: HUDProps) {
  const [now, setNow] = useState(Date.now());
  const [pulseWarn, setPulseWarn] = useState(false);
  
  const scaleMap: Record<string, string> = {
    'small': 'scale-75 origin-top',
    'normal': 'scale-100 origin-top',
    'large': 'scale-110 origin-top'
  };
  const scaleClass = scaleMap[settings.hudScale] || 'scale-100 origin-top';

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (warnings.length > 0) {
      setPulseWarn(true);
      const to = setTimeout(() => setPulseWarn(false), 300);
      return () => clearTimeout(to);
    }
  }, [warnings]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const hasDamage = now < activeBuffs.damage;
  const hasRapid = now < activeBuffs.rapidFire;
  const hasShield = now < activeBuffs.shield;

  const accuracy = totalShots > 0 ? Math.round((targetsHit / totalShots) * 100) : 0;
  const players = multiplayerState?.players ? Object.values(multiplayerState.players).sort((a: any, b: any) => b.score - a.score) : [];

  const isLowAmmo = ammo <= gun.maxAmmo * 0.2 && ammo > 0;
  const isEmpty = ammo === 0;

  return (
    <div className={`absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 sm:p-6 font-sans text-white select-none overflow-hidden ${pulseWarn ? 'bg-red-500/10' : ''} transition-colors duration-100 ${scaleClass}`}>
      
      {/* Top HUD Area */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-between items-start">
          
          {/* Top Left: Player Status Cluster */}
          <div className="flex flex-col gap-2 relative">
            {/* Main Score/Time Panel */}
            <div className="bg-black/80 border-t border-r border-orange-500/50 pr-6 py-2 pb-3 rounded-br-2xl shadow-[5px_5px_0_rgba(249,115,22,0.2)] backdrop-blur-md relative overflow-hidden clip-path-slant">
               <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[0_0_15px_#f97316]" />
               
               <div className="flex gap-6 items-center pl-4">
                 {/* Score */}
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black tracking-[0.2em] text-orange-400 uppercase">Score</span>
                   <span className="text-2xl sm:text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] leading-none mt-1">
                     {score.toLocaleString()}
                   </span>
                 </div>
                 
                 <div className="w-px h-10 bg-white/20 skew-x-[-10deg]" />

                 {/* Timer */}
                 <div className="flex flex-col items-center">
                   <div className="flex items-center gap-1.5">
                     <Clock className={`w-3 h-3 ${timeLeft < 10 ? 'text-red-500' : 'text-cyan-400'}`} />
                     <span className="text-[9px] font-black tracking-[0.2em] text-cyan-400 uppercase">T-Minus</span>
                   </div>
                   <div className={`text-2xl sm:text-4xl font-black tracking-widest leading-none mt-1 ${timeLeft < 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_red]' : 'text-white'}`}>
                     {timeStr}
                   </div>
                 </div>

                 <div className="w-px h-10 bg-white/20 skew-x-[-10deg]" />

                 {/* Lives */}
                 {gameMode === 'endless' && (
                   <div className="flex flex-col items-center">
                     <span className="text-[9px] font-black tracking-[0.2em] text-red-400 uppercase mb-1">Integrity</span>
                     <div className="flex gap-1">
                       {Array.from({ length: 3 }).map((_, i) => (
                         <Heart key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < lives ? 'fill-red-500 text-red-500 shadow-[0_0_10px_red]' : 'text-slate-600'}`} />
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>

            {/* Sub Panel: Wave & Mission */}
            <div className="flex items-center gap-3 pl-4">
               <div className="bg-cyan-500/20 border border-cyan-500/50 px-3 py-1 skew-x-[-10deg] flex items-center gap-2">
                 <div className="skew-x-[10deg] flex items-baseline gap-1.5 relative z-10">
                   <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Wave</span>
                   <span className="text-xl font-black italic">{wave}</span>
                   {maxWave && <span className="text-xs text-cyan-500">/{maxWave}</span>}
                   {waveName && <span className="hidden sm:inline text-[9px] font-black text-cyan-400/70 tracking-[0.15em] uppercase ml-1">// {waveName}</span>}
                 </div>
               </div>
            </div>
            
          </div>

          {/* Top Center: Mission Strip */}
          <div className="hidden sm:flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-4 w-1/3 min-w-[300px]">
             {gameMode === 'multiplayer' ? (
                <div className="bg-black/80 border border-cyan-500/50 px-6 py-2 transform skew-x-[-10deg] backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                   <div className="skew-x-[10deg] flex flex-col gap-2">
                     <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="text-[10px] font-black text-cyan-400 tracking-[0.2em] uppercase">Squad Link Active</span>
                        <Users className="w-3 h-3 text-cyan-400" />
                     </div>
                     {players.slice(0,3).map((p: any, idx: number) => (
                        <div key={p.id} className={`flex items-center justify-between text-xs font-black ${p.id === socketId ? 'text-white' : 'text-white/50'}`}>
                           <span>#{idx + 1} {p.id.substring(0, 4)}</span>
                           <span>{p.score.toLocaleString()}</span>
                        </div>
                     ))}
                   </div>
                </div>
             ) : (
                <div className="w-full flex flex-col gap-2 relative">
                  <div className="bg-black/80 border-b-2 border-orange-500 px-6 py-3 flex flex-col items-center shadow-[0_5px_20px_rgba(249,115,22,0.15)] backdrop-blur-md rounded-b-xl">
                     <span className="text-[9px] font-black text-orange-400 tracking-[0.3em] uppercase drop-shadow-[0_0_5px_#f97316]">Sector // {levelName}</span>
                     <div className="text-base font-black italic tracking-widest mt-1">OBJECTIVE: NEUTRALIZE {targetGoal}</div>
                     <div className="w-full mt-3 bg-slate-900 border border-slate-700 h-2.5 rounded-full overflow-hidden relative">
                       <motion.div 
                         className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-orange-600 to-yellow-400 shadow-[0_0_10px_#facc15]"
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, (targetsHit / targetGoal) * 100)}%` }}
                       />
                       {/* Section markers */}
                       <div className="absolute inset-0 flex justify-evenly pointer-events-none opacity-30">
                          <div className="w-px h-full bg-white" />
                          <div className="w-px h-full bg-white" />
                          <div className="w-px h-full bg-white" />
                       </div>
                     </div>
                  </div>
                  
                  {/* Warning Banners */}
                  <AnimatePresence>
                    {warnings.map((msg, idx) => (
                       <motion.div 
                         key={msg}
                         initial={{ height: 0, opacity: 0, scaleY: 0 }}
                         animate={{ height: 'auto', opacity: 1, scaleY: 1 }}
                         exit={{ height: 0, opacity: 0, scaleY: 0 }}
                         className="bg-red-600/90 border border-red-400 px-4 py-1.5 flex justify-center items-center gap-2 shadow-[0_0_15px_red] backdrop-blur overflow-hidden origin-top"
                       >
                          <AlertTriangle className="w-4 h-4 text-white" />
                          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white animate-pulse">{msg}</span>
                          <AlertTriangle className="w-4 h-4 text-white" />
                       </motion.div>
                    ))}
                    {incomingProjectiles.length > 0 && (
                       <motion.div 
                         initial={{ scale: 0.9, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         exit={{ scale: 0.9, opacity: 0 }}
                         className="bg-red-600/90 border-r-4 border-l-4 border-white px-4 py-1 flex justify-center items-center mt-1 animate-[pulse_0.2s_infinite]"
                       >
                          <span className="text-[12px] font-black tracking-widest uppercase text-white text-center">INCOMING PROJECTILE</span>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             )}
          </div>

          {/* Top Right: Radar & Pause */}
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
             <button 
               onClick={onPause}
               className="bg-slate-900/80 hover:bg-slate-800 p-2.5 border-2 border-slate-700 hover:border-cyan-500 rounded shadow-xl transition-all hover:scale-105 active:scale-95"
             >
               <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
             </button>
             <div className="hidden sm:block mt-2">
               <RadarMap targets={targets} projectiles={incomingProjectiles} />
               <div className="text-[8px] font-black text-cyan-500 text-right mt-1 tracking-widest uppercase">TACTICAL RADAR ON</div>
             </div>
          </div>
        </div>
      </div>

      {/* Reticle Info (Bottom Center absolute) */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none opacity-80">
          {(isLowAmmo || isEmpty) && (
             <motion.div 
               animate={{ opacity: [1, 0, 1] }} 
               transition={{ duration: 0.5, repeat: Infinity }}
               className={`text-sm font-black tracking-[0.3em] uppercase mb-1 ${isEmpty ? 'text-red-500' : 'text-orange-400'}`}
             >
               {isEmpty ? 'EMPTY' : 'LOW AMMO'}
             </motion.div>
          )}
          {isReloading && (
             <div className="flex items-center gap-2 text-cyan-400 font-black text-xs tracking-widest uppercase bg-black/60 px-3 py-1 rounded">
               <Wind className="w-3 h-3 animate-spin" />
               RELOADING
             </div>
          )}
      </div>

      {/* Bottom HUD Area */}
      <div className={`flex justify-between items-end w-full mb-16 sm:mb-6 ${settings.leftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Bottom Left: Status Block */}
        <div className="flex flex-col justify-end gap-3 pointer-events-none pl-4 min-h-[150px]">
          {/* Combo Meter */}
          <AnimatePresence>
            {combo > 1 && (
              <motion.div 
                initial={{ x: settings.leftHanded ? 20 : -20, opacity: 0, skewX: 0 }}
                animate={{ x: 0, opacity: 1, skewX: -10 }}
                exit={{ x: settings.leftHanded ? 20 : -20, opacity: 0 }}
                className={`bg-cyan-500/20 border-l-4 border-cyan-400 p-3 pr-8 backdrop-blur-sm -skew-x-[10deg] origin-left shadow-[0_0_20px_rgba(34,211,238,0.2)]`}
              >
                <div className="skew-x-[10deg] flex flex-col">
                  <span className="text-[10px] font-black text-cyan-400 tracking-[0.2em] uppercase">Combo Chain</span>
                  <div className="text-3xl sm:text-5xl font-black italic drop-shadow-[0_0_10px_#22d3ee] leading-none text-white outline-text tracking-tighter">
                    x{combo}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Buffs */}
          <div className="flex gap-2 mb-2">
             <AnimatePresence>
                {hasDamage && (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-10 h-10 border-2 border-red-500 bg-red-900/50 flex items-center justify-center -skew-x-[10deg] shadow-[0_0_10px_red]">
                     <div className="skew-x-[10deg] text-red-500"><Zap className="w-5 h-5 fill-current" /></div>
                   </motion.div>
                )}
                {hasRapid && (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-10 h-10 border-2 border-orange-500 bg-orange-900/50 flex items-center justify-center -skew-x-[10deg] shadow-[0_0_10px_orange]">
                     <div className="skew-x-[10deg] text-orange-500"><Zap className="w-5 h-5" /></div>
                   </motion.div>
                )}
                {hasShield && (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-10 h-10 border-2 border-cyan-400 bg-cyan-900/50 flex items-center justify-center -skew-x-[10deg] shadow-[0_0_10px_cyan]">
                     <div className="skew-x-[10deg] text-cyan-400"><Shield className="w-5 h-5" /></div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
          
          <div className="bg-black/80 border border-slate-700/50 p-2 px-3 rounded flex gap-4 backdrop-blur w-max relative overflow-hidden">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Accuracy</span>
                <span className="text-sm font-black italic text-cyan-400">{accuracy}%</span>
             </div>
          </div>
        </div>

        {/* Bottom Right: Weapon Block */}
        <div className={`flex flex-col pointer-events-auto pr-4 ${settings.leftHanded ? 'items-start ml-4 pl-4' : 'items-end mr-4 pr-4'}`}>
           <div 
             className={`group relative overflow-hidden bg-black/80 border-t border-l border-b border-cyan-500/30 pl-6 pr-4 py-4 backdrop-blur-md cursor-pointer transition-all hover:bg-slate-900 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col ${settings.leftHanded ? 'items-start clip-path-weapon-l border-r border-l-0 pr-6 pl-4' : 'items-end clip-path-weapon-r'}`}
             onClick={() => { if (!isReloading && ammo < gun.maxAmmo) onReload?.(); }}
           >
             {/* Background decorative corner lines */}
             <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-cyan-500/20 to-transparent pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-16 h-1 mt-auto bg-cyan-500/20 pointer-events-none" />

             {/* Weapon Name & Fire Mode */}
             <div className={`flex items-baseline gap-3 mb-1 w-full ${settings.leftHanded ? 'justify-start' : 'justify-end'}`}>
                <span className="text-[9px] font-black text-cyan-500 tracking-widest uppercase border border-cyan-500/30 px-1.5 py-0.5 max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">
                  {gun.fireMode}
                </span>
                <span className="text-sm sm:text-base font-black text-white tracking-[0.2em] uppercase italic">
                  {gun.name}
                </span>
             </div>
             
             {/* Ammo Counters & Type */}
             <div className={`flex items-center gap-4 ${settings.leftHanded ? 'flex-row-reverse' : ''}`}>
               <div className="flex flex-col items-center opacity-80">
                  <div className="w-6 h-6 border-2 border-dashed border-cyan-500 rounded-full flex items-center justify-center p-0.5">
                     <div className="w-full h-full rounded-full" style={{ backgroundColor: gun.dartType.color || '#38bdf8' }} />
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-widest mt-1 text-cyan-300">{gun.dartType.id}</span>
               </div>
               
               <div className="flex items-baseline gap-1 relative">
                 <span className={`text-6xl sm:text-8xl font-black italic leading-none tracking-tighter ${isEmpty ? 'text-red-500 drop-shadow-[0_0_20px_red]' : isLowAmmo ? 'text-orange-400' : 'text-white'}`}>
                   {ammo}
                 </span>
                 <span className="text-2xl sm:text-4xl font-black text-cyan-600 italic leading-none top-0">/</span>
                 <span className="text-xl sm:text-3xl font-black text-cyan-600 italic leading-none">{gun.maxAmmo}</span>
                 
                 {/* Reload Ring Overlay */}
                 {isReloading && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <svg className="w-[120%] h-[120%] -rotate-90 animate-[spin_1.5s_linear_infinite]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" strokeWidth="4" className="opacity-20" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" strokeWidth="6" strokeDasharray="280" strokeDashoffset="280" strokeLinecap="round">
                           <animate attributeName="stroke-dashoffset" from="280" to="0" dur="1s" fill="freeze" />
                        </circle>
                      </svg>
                    </motion.div>
                 )}
               </div>
             </div>
             
             {/* Tactile Magazine Bars */}
             <div className={`flex gap-1 mt-4 w-full h-8 ${settings.leftHanded ? 'justify-start' : 'justify-end'}`}>
               {Array.from({ length: Math.min(gun.maxAmmo, 20) }).map((_, i) => {
                 const step = gun.maxAmmo > 20 ? gun.maxAmmo / 20 : 1;
                 const threshold = (i + 1) * step;
                 const hasBullet = threshold <= ammo || (i === 0 && ammo > 0);
                 
                 return (
                   <div 
                     key={i} 
                     className={`w-2 rounded-[1px] transform -skew-x-[15deg] transition-all duration-200
                       ${hasBullet && !isReloading ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-800 scale-y-75 opacity-50'}`}
                   />
                 );
               })}
             </div>
             
             {/* Reload Prompt */}
             <AnimatePresence>
               {(isEmpty || isLowAmmo) && !isReloading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={`mt-3 text-[10px] font-black uppercase tracking-widest ${isEmpty ? 'text-red-500 px-2 py-0.5 bg-red-950/50 rounded border border-red-500 animate-pulse' : 'text-orange-400 drop-shadow-[0_0_5px_orange]'}`}
                  >
                    {isEmpty ? 'CLICK TO RELOAD' : 'MAGAZINE LOW'}
                  </motion.div>
               )}
             </AnimatePresence>

           </div>
        </div>

      </div>
      
      {/* Dynamic styling for custom clip paths used above */}
      <style>{`
        .clip-path-slant {
          clip-path: polygon(0 0, 100% 0, 100% 70%, 95% 100%, 0 100%);
        }
        .clip-path-weapon-r {
          clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px);
        }
        .clip-path-weapon-l {
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
        }
      `}</style>
    </div>
  );
}

