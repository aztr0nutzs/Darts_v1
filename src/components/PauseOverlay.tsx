import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Home, Settings, ShieldAlert, Cpu } from 'lucide-react';

export function PauseOverlay({ 
  onResume, 
  onRestart, 
  onMainMenu, 
  onSettings, 
  stats, 
  gun, 
  gameMode 
}: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] flex items-center justify-center bg-black/92 p-4 sm:p-8 select-none"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#050505] border border-white/10 rounded-md shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
      >
        {/* Left/Top Area: Stats & Status */}
        <div className="flex-1 bg-black p-6 sm:p-10 border-b md:border-b-0 md:border-r border-white/10 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-widest uppercase">System Paused</h2>
          </div>

          <div className="flex flex-col gap-4 flex-1 relative z-10">
            <div className="bg-[#070707] rounded-md p-4 border border-white/10">
              <span className="text-[10px] sm:text-xs font-black text-slate-500 tracking-[0.2em] uppercase mb-1 block">Current Run</span>
              <div className="text-3xl sm:text-4xl font-black italic text-cyan-400 drop-shadow-md leading-none">{stats.score.toLocaleString()} SCORE</div>
              <div className="flex justify-between mt-3 text-xs sm:text-sm font-bold text-slate-300">
                <span>MODE: <span className="text-orange-400 uppercase">{gameMode}</span></span>
                <span>TIME: {Math.floor(stats.timeLeft / 60)}:{(stats.timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="bg-[#070707] rounded-md p-4 border border-white/10">
               <span className="text-[10px] sm:text-xs font-black text-slate-500 tracking-[0.2em] uppercase mb-1 block">Hardware Status</span>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded bg-[#111] flex items-center justify-center border border-white/10">
                    <Cpu className="w-5 h-5 text-cyan-500" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-base sm:text-lg font-black italic text-white leading-none mb-1">{gun.name}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{gun.fireMode} // Ammo: {stats.ammo}/{gun.maxAmmo}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right/Bottom Area: Actions */}
        <div className="w-full md:w-[320px] bg-[#070707] p-6 sm:p-10 flex flex-col justify-center gap-3 relative z-10">
           <button 
             onClick={onResume}
             className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black italic text-lg sm:text-xl py-4 sm:py-5 rounded-md transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
           >
             <Play className="w-6 h-6 fill-slate-900" />
             <span>RESUME</span>
           </button>

           <button 
             onClick={onRestart}
             className="w-full bg-[#111] border border-white/10 hover:border-orange-500 text-white font-black italic text-lg py-4 rounded-md transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
           >
             <RotateCcw className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
             <span>RESTART</span>
           </button>

           <button 
             onClick={onSettings}
             className="w-full bg-[#111] border border-white/10 hover:border-white/50 text-white font-black italic text-lg py-4 rounded-md transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
           >
             <Settings className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
             <span>SETTINGS</span>
           </button>

           <div className="h-px w-full bg-white/10 my-2" />

           <button 
             onClick={onMainMenu}
             className="w-full bg-black border border-white/10 hover:border-red-500/50 hover:bg-red-950/30 text-slate-400 hover:text-red-400 font-black italic text-sm sm:text-base py-4 rounded-md transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
           >
             <Home className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-red-400" />
             <span>MAIN MENU</span>
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
