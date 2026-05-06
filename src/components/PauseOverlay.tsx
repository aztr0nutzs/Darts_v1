import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Home, Settings, ShieldAlert, Cpu } from 'lucide-react';
import { GunType } from './Gun';

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
      className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8 select-none"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
      >
        {/* Left/Top Area: Stats & Status */}
        <div className="flex-1 bg-slate-950 p-6 sm:p-10 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col relative overflow-hidden">
          {/* subtle background styling */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-widest uppercase">System Paused</h2>
          </div>

          <div className="flex flex-col gap-4 flex-1 relative z-10">
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
              <span className="text-[10px] sm:text-xs font-black text-slate-500 tracking-[0.2em] uppercase mb-1 block">Current Run</span>
              <div className="text-3xl sm:text-4xl font-black italic text-cyan-400 drop-shadow-md leading-none">{stats.score.toLocaleString()} SCORE</div>
              <div className="flex justify-between mt-3 text-xs sm:text-sm font-bold text-slate-300">
                <span>MODE: <span className="text-orange-400 uppercase">{gameMode}</span></span>
                <span>TIME: {Math.floor(stats.timeLeft / 60)}:{(stats.timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
               <span className="text-[10px] sm:text-xs font-black text-slate-500 tracking-[0.2em] uppercase mb-1 block">Hardware Status</span>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
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
        <div className="w-full md:w-[320px] bg-slate-900 p-6 sm:p-10 flex flex-col justify-center gap-3 relative z-10">
           <button 
             onClick={onResume}
             className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black italic text-lg sm:text-xl py-4 sm:py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-3 active:scale-[0.98]"
           >
             <Play className="w-6 h-6 fill-slate-900" />
             <span>RESUME</span>
           </button>

           <button 
             onClick={onRestart}
             className="w-full bg-slate-800 border-[1.5px] border-slate-700 hover:border-orange-500 hover:bg-slate-800/80 text-white font-black italic text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
           >
             <RotateCcw className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
             <span>RESTART</span>
           </button>

           <button 
             onClick={onSettings}
             className="w-full bg-slate-800 border-[1.5px] border-slate-700 hover:border-white/50 hover:bg-slate-800/80 text-white font-black italic text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
           >
             <Settings className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
             <span>SETTINGS</span>
           </button>

           <div className="h-px w-full bg-slate-800 my-2" />

           <button 
             onClick={onMainMenu}
             className="w-full bg-slate-950 border-[1.5px] border-slate-800 hover:border-red-500/50 hover:bg-red-950/30 text-slate-400 hover:text-red-400 font-black italic text-sm sm:text-base py-4 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
           >
             <Home className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-red-400" />
             <span>MAIN MENU</span>
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
