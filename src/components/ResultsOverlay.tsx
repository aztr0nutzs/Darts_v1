import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Target, Zap, Clock, Coins, 
  Home, RefreshCw, ChevronRight, Activity, 
  Terminal, Shield, Users, Crosshair, Award
} from 'lucide-react';
import { GameMode } from '../App';

interface ResultsOverlayProps {
  gameState: 'menu' | 'playing' | 'gameover' | 'paused';
  gameMode: GameMode;
  score: number;
  targetsHit: number;
  totalShots: number;
  combo: number;
  maxCombo: number;
  weakPointHits: number;
  shotsFiredPerWeapon: Record<string, number>;
  earnedCredits: number;
  onRestart: () => void;
  onMenu: () => void;
  multiplayerState?: any;
  socketId?: string;
  isHost?: boolean;
  onRematch?: () => void;
}

export default function ResultsOverlay({
  gameMode,
  score,
  targetsHit,
  totalShots,
  combo,
  maxCombo,
  weakPointHits,
  shotsFiredPerWeapon,
  earnedCredits,
  onRestart,
  onMenu,
  multiplayerState,
  socketId,
  isHost,
  onRematch
}: ResultsOverlayProps) {
  const accuracy = totalShots > 0 ? Math.round((targetsHit / totalShots) * 100) : 0;
  
  const isMultiplayer = gameMode === 'multiplayer';
  const players = multiplayerState?.players ? Object.values(multiplayerState.players).sort((a: any, b: any) => b.score - a.score) : [];
  const localPlayerRank = players.findIndex((p: any) => p.id === socketId) + 1;
  const isWinner = localPlayerRank === 1;

  let favoriteWeaponName = 'N/A';
  if (Object.keys(shotsFiredPerWeapon).length > 0) {
     favoriteWeaponName = Object.entries(shotsFiredPerWeapon).sort((a,b) => b[1] - a[1])[0][0].replace('_', ' ').toUpperCase();
  }

  const StatItem = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-2xl font-black italic tracking-tight ${color}`}>{value}</div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]/98 backdrop-blur-2xl p-4 md:p-8"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-full ${isWinner ? 'bg-[radial-gradient(circle_at_center,#facc1510_0%,transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,#1e3a8a_20%,transparent_70%)]'}`} />
        <div className="absolute inset-0 opacity-10 bg-[url('https://grain-y.com/images/noise.png')]" />
      </div>

      <div className="relative w-full max-w-5xl flex flex-col items-center h-[90vh] overflow-y-auto pr-4 custom-scrollbar">
        
        {/* Title Section */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-10 shrink-0"
        >
          <div className="text-[12px] font-black text-cyan-500 tracking-[0.6em] uppercase mb-2">MISSION_DEBRIEFING // 0xAF82</div>
          <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            {isMultiplayer ? (isWinner ? 'CHAMPION' : 'DEFEATED') : 'COMPLETED'}
          </h2>
          <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full shrink-0">
          
          {/* Main Stats Column */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatItem label="Precision_Rate" value={`${accuracy}%`} icon={Target} color="text-white" />
              <StatItem label="Entities_Neutralized" value={targetsHit} icon={Zap} color="text-cyan-400" />
              <StatItem label="Max_Sequence" value={`x${maxCombo}`} icon={ChevronRight} color="text-fuchsia-400" />
              <StatItem label="Combat_Score" value={score.toLocaleString()} icon={Activity} color="text-orange-500" />
              <StatItem label="Weak_Points" value={weakPointHits} icon={Crosshair} color="text-red-400" />
              <StatItem label="Fav_Weapon" value={favoriteWeaponName} icon={Award} color="text-purple-400" />
            </div>

            <div className="bg-slate-900/60 border-2 border-yellow-500/30 p-8 rounded-3xl relative overflow-hidden group">
               <div className="absolute -top-4 -right-4 bg-yellow-500 text-black px-4 py-1 font-black text-[10px] italic skew-x-[-20deg]">AWARDED</div>
               <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-yellow-500/60 tracking-[0.2em] uppercase block mb-1">RESOURCES_RECOVERED</span>
                    <div className="flex items-center gap-4">
                       <Coins className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                       <span className="text-5xl font-black text-white italic tracking-tighter">+{earnedCredits.toLocaleString()}</span>
                    </div>
                  </div>
                  <Trophy className="w-20 h-20 text-yellow-500/10 absolute -right-2 top-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
               </div>
            </div>
          </div>

          {/* Multiplayer/Social Column */}
          <div className="md:col-span-5 flex flex-col gap-4">
             {isMultiplayer ? (
               <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Squad_Results</h3>
                  </div>
                  <div className="space-y-2 flex-1">
                     {players.map((p: any, idx: number) => (
                       <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.id === socketId ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-black/40 border-slate-800'}`}>
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-black text-slate-500">#{idx + 1}</span>
                             <span className="text-xs font-bold text-white uppercase">{p.id.substring(0, 8)}</span>
                             {p.id === socketId && <span className="text-[8px] bg-cyan-500 text-black px-1 rounded">YOU</span>}
                          </div>
                          <span className="text-sm font-black text-orange-500">{p.score.toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
               </div>
             ) : (
               <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl flex-1 flex flex-col items-center justify-center text-center">
                  <Shield className="w-16 h-16 text-slate-800 mb-4" />
                  <p className="text-xs font-black text-slate-500 tracking-widest uppercase mb-2">Training_Complete</p>
                  <p className="text-[9px] font-bold text-slate-600 max-w-[200px] uppercase">All biometric data successfully uploaded to the central tac-net.</p>
               </div>
             )}

             <div className="flex flex-col gap-2 mt-auto pb-8">
               <button 
                 onClick={isMultiplayer ? onRematch : onRestart}
                 className="w-full bg-white text-black py-4 rounded-xl font-black italic text-lg tracking-widest uppercase hover:bg-cyan-500 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
               >
                 <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                 {isMultiplayer ? 'REQUEST_REMATCH' : 'RESTART_LEVEL'}
               </button>
               <button 
                 onClick={onMenu}
                 className="w-full bg-slate-800/50 hover:bg-slate-700/50 text-white/60 hover:text-white py-4 rounded-xl font-black italic text-xs tracking-[0.5em] uppercase transition-all flex items-center justify-center gap-3"
               >
                 <Home className="w-4 h-4" />
                 RETURN_TO_BASE
               </button>
             </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
