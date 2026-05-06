import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crosshair, Timer, Infinity as InfinityIcon, Skull, Zap, Users, Shield, 
  Terminal, LockOpen, Wifi, ShieldCheck, Coins, Cpu, Lock, Play, Settings, Target as TargetIcon
} from 'lucide-react';
import { GameMode, DartType, DART_TYPES } from '../App';
import { GUNS, GunType } from './Gun';

export interface MainMenuProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  roomId: string;
  setRoomId: (id: string) => void;
  socket: any;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  setIsMultiplayerWaiting: (b: boolean) => void;
  startGame: (mode: GameMode) => void;
  setShowUpgradeMenu: (b: boolean) => void;
  credits: number;
  unlockedGuns: string[];
  currentGun: GunType;
  setCurrentGun: (gun: GunType) => void;
  buyGun: (gun: GunType) => void;
  unlockedDarts: string[];
  currentDart: DartType;
  setCurrentDart: (dart: DartType) => void;
  buyDart: (dart: DartType) => void;
}

export default function MainMenu({
  gameMode,
  setGameMode,
  roomId,
  setRoomId,
  socket,
  connectionStatus,
  setIsMultiplayerWaiting,
  startGame,
  setShowUpgradeMenu,
  credits,
  unlockedGuns,
  currentGun,
  setCurrentGun,
  buyGun,
  unlockedDarts,
  currentDart,
  setCurrentDart,
  buyDart
}: MainMenuProps) {

  const gameModes = [
    { id: 'classic', name: 'STANDARD', icon: Crosshair, desc: '60s_PRECISION', tag: 'RECOMMENDED', color: 'from-cyan-600 to-cyan-900', border: 'border-cyan-500' },
    { id: 'timeAttack', name: 'BLITZ', icon: Timer, desc: '30s_OVERDRIVE', tag: 'FAST', color: 'from-orange-500 to-orange-800', border: 'border-orange-500' },
    { id: 'endless', name: 'SURVIVAL', icon: InfinityIcon, desc: 'HOSTILE_GAUNTLET', tag: 'ENDLESS', color: 'from-red-600 to-red-900', border: 'border-red-500' },
    { id: 'hardcore', name: 'HARDCORE', icon: Skull, desc: 'LETHAL_SPLAY', tag: '1-HIT_KO', color: 'from-zinc-700 to-zinc-950', border: 'border-zinc-500' },
    { id: 'targetRush', name: 'ASSAULT', icon: Zap, desc: '50_TARGET_PURGE', tag: 'RUSH', color: 'from-fuchsia-600 to-fuchsia-900', border: 'border-fuchsia-500' },
    { id: 'multiplayer', name: 'NETWORK', icon: Users, desc: 'PVP_CONJUNCTION', tag: 'PVP', color: 'from-yellow-600 to-yellow-900', border: 'border-yellow-500' },
    { id: 'coop', name: 'CO-OP', icon: Shield, desc: 'DUAL_SYNC', tag: 'TEAM', color: 'from-emerald-600 to-emerald-900', border: 'border-emerald-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col pt-10 md:pt-16 pb-24 items-center bg-[#070b14] overflow-x-hidden overflow-y-auto font-sans custom-scrollbar select-none"
    >
      {/* VIVID PREMIUM BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e3a8a_0%,#020617_80%)] opacity-80" />
        
        {/* Technological Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxyZWN0IHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] mask-image:linear-gradient(to_bottom,white,transparent)" />
        
        {/* Glow Effects */}
        <div className="absolute -top-[20%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-orange-600/10 rounded-full blur-[100px] md:blur-[150px] mix-blend-screen animate-pulse" />
        <div className="absolute top-[20%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-cyan-500/10 rounded-full blur-[100px] md:blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col min-h-full">
        
        {/* PREMIUM TITLE HEADER */}
        <div className="flex flex-col items-center mb-10 md:mb-16 mt-4">
          <motion.div 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 mb-6 backdrop-blur-md shadow-lg"
          >
            <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${connectionStatus === 'connected' ? 'bg-green-500 shadow-green-500' : connectionStatus === 'error' ? 'bg-red-500 shadow-red-500' : 'bg-orange-500 shadow-orange-500'}`} />
            <span className="text-[10px] sm:text-xs font-bold text-slate-300 tracking-widest uppercase">
              {connectionStatus === 'connected' ? 'SYNCED_LIVE' : connectionStatus === 'connecting' ? 'SYNCING...' : 'OFFLINE_MODE'}
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
          </motion.div>

          <div className="relative text-center">
            <h1 className="text-6xl sm:text-8xl lg:text-[10rem] font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] leading-none -skew-x-12 relative z-10">
              DART<span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]">STRIKE</span>
            </h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-12 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent blur-xl z-0" />
          </div>
          
          <div className="mt-2 text-cyan-400 font-bold tracking-[0.5em] md:tracking-[1em] text-xs md:text-sm uppercase opacity-80 decoration-2 underline-offset-8 decoration-cyan-500/50 underline">
            TACTICAL ASSAULT ARENA
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1">
          
          {/* LEFT COLUMN: GAME MODES */}
          <div className="flex flex-col gap-6 lg:w-[35%] shrink-0">
            <div className="flex justify-between items-end mb-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]" />
                <h2 className="text-xl md:text-2xl font-black text-white italic tracking-wider">SELECT MODE</h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {gameModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = gameMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id as GameMode)}
                    className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 transition-all overflow-hidden text-left
                      ${isSelected ? `bg-gradient-to-br ${mode.color} ${mode.border} shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02] active:scale-[0.98]` 
                      : 'bg-slate-900/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 active:scale-[0.98]'}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`p-3 rounded-lg flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'}`}>
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xl sm:text-2xl font-black italic tracking-tight leading-none mb-1 ${isSelected ? 'text-white drop-shadow-md' : 'text-slate-300'}`}>
                          {mode.name}
                        </span>
                        <span className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {mode.desc}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="relative z-10 px-2 py-1 rounded bg-white/20 text-[9px] sm:text-[10px] font-black text-white tracking-wider border border-white/30 truncate max-w-[80px] sm:max-w-none text-center">
                        {mode.tag}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[30px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* MULTIPLAYER INPUT PANEL */}
            <AnimatePresence>
              {gameMode === 'multiplayer' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="bg-slate-900/80 border border-yellow-500/30 rounded-xl p-5 relative overflow-hidden backdrop-blur-md"
                >
                   <div className="flex items-center gap-3 mb-4 text-xs font-black text-yellow-500 tracking-[0.2em] uppercase">
                      <Wifi className="w-4 h-4 animate-pulse" />
                      <span>Network Link</span>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="ROOM_KEY" 
                          className="w-full bg-slate-950 border border-slate-700 text-yellow-400 font-bold px-12 py-3 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none tracking-widest placeholder:text-slate-600 transition-all font-mono"
                          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                          value={roomId}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (roomId && socket) {
                            socket.emit('join-room', roomId);
                            setIsMultiplayerWaiting(true);
                          }
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <LockOpen className="w-5 h-5" />
                        <span className="tracking-widest uppercase text-sm">SYNC</span>
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: LOADOUT & ARENA */}
          <div className="flex flex-col gap-6 lg:w-[65%] shrink-0">
            
            {/* CREDITS HEADER */}
            <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]" />
                <h2 className="text-xl md:text-2xl font-black text-white italic tracking-wider">LOADOUT</h2>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Coins className="w-5 h-5 text-yellow-500" />
                <div className="text-xl font-black text-yellow-500 tracking-tighter shadow-black drop-shadow-md">{credits.toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PRIMARY BLASTER */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase ml-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> 
                  Primary Blaster
                </div>
                
                <div className="grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.values(GUNS).map((g) => {
                    const isUnlocked = unlockedGuns.includes(g.id);
                    const isSelected = currentGun.id === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => isUnlocked ? setCurrentGun(g) : buyGun(g)}
                        className={`group relative p-4 rounded-xl border-2 transition-all flex justify-between items-center overflow-hidden
                          ${isSelected ? 'bg-gradient-to-r from-cyan-900/40 to-slate-900/80 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.15)] scale-[1.02]' : 
                            isUnlocked ? 'bg-slate-900/60 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800' : 'bg-slate-950/80 border-slate-800/50 opacity-70 grayscale'}`}
                      >
                        <div className="flex flex-col items-start z-10">
                          <span className={`text-xl sm:text-2xl font-black italic tracking-tight leading-none mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{g.name}</span>
                          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-70">
                            <Cpu className="w-3 h-3 text-cyan-400" />
                            <span className={isSelected ? 'text-cyan-200' : 'text-slate-400'}>{g.fireMode}</span>
                            <span className={isSelected ? 'text-cyan-200' : 'text-slate-400'}>// {g.maxAmmo} MAX</span>
                          </div>
                        </div>

                        <div className="z-10 flex flex-col items-end">
                          {!isUnlocked ? (
                            <div className="flex flex-col items-end gap-1">
                               <Lock className="w-4 h-4 text-slate-500" />
                               <div className="flex items-center gap-1 text-xs font-black text-yellow-500 bg-yellow-950/40 px-2 py-1 rounded">
                                 <Coins className="w-3 h-3" /> {g.unlockCost}
                               </div>
                            </div>
                          ) : isSelected ? (
                            <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          ) : null}
                        </div>

                        {isSelected && <div className="absolute inset-y-0 left-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TACTICAL DARTS */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase ml-1 flex items-center gap-2">
                  <TargetIcon className="w-4 h-4 text-orange-400" /> 
                  Tactical Darts
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.values(DART_TYPES).map((d) => {
                    const isUnlocked = unlockedDarts.includes(d.id);
                    const isSelected = currentDart.id === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => isUnlocked ? setCurrentDart(d) : buyDart(d)}
                        className={`group relative p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-[120px] overflow-hidden
                          ${isSelected ? 'bg-gradient-to-br from-orange-900/40 to-slate-900/80 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] scale-[1.02]' : 
                            isUnlocked ? 'bg-slate-900/60 border-slate-700 hover:border-orange-500/50 hover:bg-slate-800' : 'bg-slate-950/80 border-slate-800/50 opacity-70 grayscale'}`}
                      >
                         <div className="flex justify-between items-start z-10 w-full mb-2">
                            <span className={`text-base sm:text-lg font-black italic tracking-tight leading-none ${isSelected ? 'text-white' : 'text-slate-300'}`}>{d.name}</span>
                            {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                         </div>

                         <div className="flex items-center gap-1.5 opacity-80 z-10 mb-auto">
                            <Zap className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-400' : 'text-slate-500'}`} />
                            <span className={`text-xs font-bold ${isSelected ? 'text-orange-200' : 'text-slate-400'}`}>DMG: {d.damage}</span>
                         </div>

                         <div className="z-10 mt-auto">
                            {!isUnlocked ? (
                               <div className="flex items-center gap-1 text-[11px] font-black text-yellow-500 bg-yellow-950/40 px-2 py-0.5 rounded w-fit">
                                 <Coins className="w-3 h-3" /> {d.unlockCost}
                               </div>
                            ) : isSelected ? (
                               <div className="text-[9px] font-black tracking-widest text-orange-400 bg-orange-500/20 px-2 py-1 rounded w-fit uppercase">
                                  EQUIPPED
                               </div>
                            ) : null}
                         </div>

                         {isSelected && <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-400 shadow-[0_0_10px_#f97316]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION BAR / FIXED ON MOBILE */}
        <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-stretch justify-end gap-4 w-full self-end pb-8">
          
          <button 
            onClick={() => setShowUpgradeMenu(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 hover:border-slate-500 text-slate-300 font-bold px-8 py-5 rounded-xl transition-all shadow-lg active:scale-95 group"
          >
            <Settings className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
            <span className="tracking-widest uppercase text-sm sm:text-base">UPGRADES</span>
          </button>

          <button 
            onClick={() => {
              if (gameMode === 'multiplayer') {
                if (!socket) return;
                if (!roomId) {
                  const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                  setRoomId(newRoomId);
                  socket.emit('join-room', newRoomId);
                } else {
                  socket.emit('join-room', roomId);
                }
                setIsMultiplayerWaiting(true);
              } else {
                startGame(gameMode);
              }
            }}
            className="flex-[2] sm:flex-none flex items-center justify-center gap-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black px-12 py-5 rounded-xl transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] active:scale-[0.98] group overflow-hidden relative"
          >
            <Play className="w-8 h-8 fill-slate-900 relative z-10 group-hover:scale-110 transition-transform" />
            <span className="text-xl sm:text-2xl tracking-tight italic uppercase relative z-10">
              {gameMode === 'multiplayer' ? 'HOST/JOIN MATCH' : 'START MISSION'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>

        </div>
      </div>
    </motion.div>
  );
}
