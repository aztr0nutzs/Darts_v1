import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crosshair, Timer, Infinity as InfinityIcon, Skull, Zap, Users, Shield, 
  Terminal, LockOpen, Wifi, ShieldCheck, Coins, Cpu, Lock, Play, Settings, Target as TargetIcon
} from 'lucide-react';
import { GameMode, DartType, DART_TYPES } from '../App';
import { GUNS, type GunType } from '../lib/guns';
import { getArenaAsset, getBlasterAsset, getDartAsset } from '../lib/assetRegistry';
import type { MultiplayerConnectionStatus, MultiplayerRuntimeConfig } from '../lib/runtimeConfig';

function BlasterCardThumb({ gunId }: { gunId: string }) {
  const [failed, setFailed] = React.useState(false);
  const asset = React.useMemo(() => getBlasterAsset(gunId), [gunId]);
  if (failed) return null;
  return (
    <img
      src={asset.src}
      alt=""
      aria-hidden
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-24 h-16 sm:w-32 sm:h-20 shrink-0 select-none"
      style={{ objectFit: 'contain', objectPosition: 'center' }}
    />
  );
}

function DartCardThumb({ shape }: { shape: DartType['shape'] }) {
  const [failed, setFailed] = React.useState(false);
  // Map menu shape ids ('laser' | 'plasma' | 'pulse' | 'rocket') to the
  // closest provided dart sprite. Defaults to standard dart on miss.
  const fallbackShape =
    shape === 'rocket'
      ? 'rocket'
      : shape === 'plasma'
      ? 'vortex'
      : shape === 'pulse'
      ? 'rival'
      : 'dart';
  const asset = React.useMemo(() => getDartAsset(`dart_${fallbackShape}`), [fallbackShape]);
  if (failed) return null;
  return (
    <img
      src={asset.src}
      alt=""
      aria-hidden
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-10 h-10 shrink-0 select-none"
      style={{ objectFit: 'contain', objectPosition: 'center' }}
    />
  );
}

export interface MainMenuProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  roomId: string;
  setRoomId: (id: string) => void;
  socket: any;
  connectionStatus: MultiplayerConnectionStatus;
  socketUrl: string | null;
  multiplayerConfigSource: MultiplayerRuntimeConfig['source'];
  multiplayerConfigReason?: string;
  roomError: string | null;
  onRetryMultiplayer: () => void;
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
  socketUrl,
  multiplayerConfigSource,
  multiplayerConfigReason,
  roomError,
  onRetryMultiplayer,
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
  const isMultiplayerReady = connectionStatus === 'connected' && Boolean(socket);
  const isMultiplayerConnecting = connectionStatus === 'connecting';
  const multiplayerStatusLabel =
    connectionStatus === 'not_configured'
      ? 'Backend URL required'
      : connectionStatus === 'connection_failed'
      ? 'Backend unreachable'
      : connectionStatus === 'connected'
      ? 'Backend connected'
      : connectionStatus === 'connecting'
      ? 'Connecting to backend'
      : 'Backend disconnected';
  const multiplayerStatusDetail =
    connectionStatus === 'not_configured'
      ? (multiplayerConfigReason ?? 'Set VITE_SOCKET_URL to enable multiplayer in this runtime.')
      : connectionStatus === 'connection_failed'
      ? (roomError ?? 'Unable to connect to the configured Socket.IO backend.')
      : connectionStatus === 'connected'
      ? `Socket.IO: ${socketUrl ?? 'same origin'}`
      : connectionStatus === 'connecting'
      ? `Socket.IO: ${socketUrl ?? 'same origin'}`
      : 'The multiplayer socket disconnected. Retry before creating or joining a room.';

  const gameModes = [
    { id: 'classic', name: 'STANDARD', icon: Crosshair, desc: '60s_PRECISION', tag: 'RECOMMENDED', color: 'from-cyan-600 to-cyan-900', border: 'border-cyan-500' },
    { id: 'timeAttack', name: 'BLITZ', icon: Timer, desc: '30s_OVERDRIVE', tag: 'FAST', color: 'from-orange-500 to-orange-800', border: 'border-orange-500' },
    { id: 'endless', name: 'SURVIVAL', icon: InfinityIcon, desc: 'HOSTILE_GAUNTLET', tag: 'ENDLESS', color: 'from-red-600 to-red-900', border: 'border-red-500' },
    { id: 'hardcore', name: 'HARDCORE', icon: Skull, desc: 'LETHAL_SPLAY', tag: '1-HIT_KO', color: 'from-zinc-700 to-zinc-950', border: 'border-zinc-500' },
    { id: 'targetRush', name: 'ASSAULT', icon: Zap, desc: '50_TARGET_PURGE', tag: 'RUSH', color: 'from-fuchsia-600 to-fuchsia-900', border: 'border-fuchsia-500' },
    { id: 'multiplayer', name: 'NETWORK', icon: Users, desc: 'PVP_CONJUNCTION', tag: 'PVP', color: 'from-yellow-600 to-yellow-900', border: 'border-yellow-500' },
    { id: 'coop', name: 'CO-OP', icon: Shield, desc: 'DUAL_SYNC', tag: 'TEAM', color: 'from-emerald-600 to-emerald-900', border: 'border-emerald-500' },
  ];
  const currentBlasterAsset = getBlasterAsset(currentGun.id);
  const arenaOverview = getArenaAsset('arena_overview');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col pt-8 md:pt-10 pb-20 items-center bg-black overflow-x-hidden overflow-y-auto font-sans custom-scrollbar select-none"
    >
      {/* Black-first shell: artwork sits inside panels instead of coloring the whole screen blue. */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.055)_0,rgba(255,255,255,0)_220px)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col min-h-full">
        
        {/* PREMIUM TITLE HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 mb-8 md:mb-10 mt-2 items-end">
          <div className="flex flex-col items-start">
          <motion.div 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 px-4 py-1.5 bg-[#070707] border border-white/10 mb-5"
          >
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connection_failed' || connectionStatus === 'not_configured' ? 'bg-red-500' : 'bg-orange-500'}`} />
            <span className="text-[10px] sm:text-xs font-bold text-slate-300 tracking-widest uppercase">
              {connectionStatus === 'connected' ? 'SYNCED_LIVE' : connectionStatus === 'connecting' ? 'SYNCING...' : 'OFFLINE_MODE'}
            </span>
          </motion.div>

          <div className="relative text-left">
            <h1 className="text-6xl sm:text-8xl lg:text-[9rem] font-black italic uppercase text-white leading-[0.82] -skew-x-12 relative z-10">
              DART<span className="text-orange-500">STRIKE</span>
            </h1>
          </div>
          
          <div className="mt-4 text-cyan-400 font-bold tracking-[0.35em] md:tracking-[0.65em] text-xs md:text-sm uppercase">
            TACTICAL ASSAULT ARENA
          </div>
          </div>
          <div className="relative hidden lg:block h-56 border border-white/10 bg-[#050505] overflow-hidden">
            <img src={arenaOverview.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale contrast-125" />
            <img src={currentBlasterAsset.src} alt={currentBlasterAsset.label} className="absolute right-[-7%] bottom-[-18%] w-[118%] h-[105%] object-contain object-right-bottom drop-shadow-[0_22px_18px_rgba(0,0,0,0.85)]" />
            <div className="absolute left-5 top-5 text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">Equipped</div>
            <div className="absolute left-5 bottom-5 max-w-[55%] text-2xl font-black italic uppercase leading-none text-white">{currentGun.name}</div>
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
                    className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-md border transition-all overflow-hidden text-left
                      ${isSelected ? `bg-[#0a0a0a] ${mode.border} active:scale-[0.98]` 
                      : 'bg-[#050505] border-white/10 hover:border-slate-500 hover:bg-[#090909] active:scale-[0.98]'}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`p-3 rounded-lg flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-orange-500 text-black' : 'bg-[#111] text-slate-400 group-hover:text-slate-200 group-hover:bg-[#171717]'}`}>
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
                  className="bg-[#050505] border border-yellow-500/30 rounded-md p-5 relative overflow-hidden"
                >
                   <div className="flex items-center gap-3 mb-4 text-xs font-black text-yellow-500 tracking-[0.2em] uppercase">
                       <Wifi className={`w-4 h-4 ${isMultiplayerConnecting ? 'animate-pulse' : ''}`} />
                       <span>Network Link</span>
                    </div>
                    <div className={`mb-4 rounded-lg border p-3 text-xs font-bold ${
                      isMultiplayerReady
                        ? 'border-green-500/30 bg-green-500/10 text-green-300'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                    }`}>
                      <div className="uppercase tracking-widest">{multiplayerStatusLabel}</div>
                      <div className="mt-1 text-[11px] normal-case tracking-normal text-slate-300">{multiplayerStatusDetail}</div>
                      {multiplayerConfigSource === 'same_origin' && (
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">Using same-origin web fallback</div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                       <div className="relative flex-1">
                         <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                          type="text" 
                           placeholder="ROOM_KEY" 
                          disabled={!isMultiplayerReady}
                          className="w-full bg-slate-950 border border-slate-700 text-yellow-400 font-bold px-12 py-3 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none tracking-widest placeholder:text-slate-600 transition-all font-mono"
                          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                          value={roomId}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (roomId && isMultiplayerReady) {
                            socket.emit('join-room', roomId);
                            setIsMultiplayerWaiting(true);
                          }
                        }}
                        disabled={!roomId || !isMultiplayerReady}
                        className={`font-black px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                          isMultiplayerReady && roomId
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <LockOpen className="w-5 h-5" />
                        <span className="tracking-widest uppercase text-sm">SYNC</span>
                      </button>
                    </div>
                    {(connectionStatus === 'connection_failed' || connectionStatus === 'disconnected') && (
                      <button
                        onClick={onRetryMultiplayer}
                        className="mt-3 w-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-yellow-400 transition-colors hover:bg-yellow-500/20"
                      >
                        Retry Backend Connection
                      </button>
                    )}
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
              
              <div className="flex items-center gap-2 bg-[#050505] border border-white/10 px-4 py-2 rounded-md relative overflow-hidden group">
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
                        className={`group relative p-4 rounded-md border transition-all flex justify-between items-center overflow-hidden min-h-[112px]
                          ${isSelected ? 'bg-[#0a0a0a] border-cyan-500 scale-[1.01]' : 
                            isUnlocked ? 'bg-[#050505] border-white/10 hover:border-cyan-500/50 hover:bg-[#090909]' : 'bg-[#030303] border-white/5 opacity-70 grayscale'}`}
                      >
                        <div className="flex items-center gap-3 z-10 min-w-0">
                          <BlasterCardThumb gunId={g.id} />
                          <div className="flex flex-col items-start min-w-0">
                            <span className={`text-xl sm:text-2xl font-black italic tracking-tight leading-none mb-1 truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{g.name}</span>
                            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-70">
                              <Cpu className="w-3 h-3 text-cyan-400" />
                              <span className={isSelected ? 'text-cyan-200' : 'text-slate-400'}>{g.fireMode}</span>
                              <span className={isSelected ? 'text-cyan-200' : 'text-slate-400'}>// {g.maxAmmo} MAX</span>
                            </div>
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
                            <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          ) : null}
                        </div>

                        {isSelected && <div className="absolute inset-y-0 left-0 w-1 bg-cyan-400" />}
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
                        className={`group relative p-4 rounded-md border transition-all flex flex-col justify-between h-[120px] overflow-hidden
                          ${isSelected ? 'bg-[#0a0a0a] border-orange-500 scale-[1.01]' : 
                            isUnlocked ? 'bg-[#050505] border-white/10 hover:border-orange-500/50 hover:bg-[#090909]' : 'bg-[#030303] border-white/5 opacity-70 grayscale'}`}
                      >
                         <div className="flex justify-between items-start z-10 w-full mb-2 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <DartCardThumb shape={d.shape} />
                              <span className={`text-base sm:text-lg font-black italic tracking-tight leading-none truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{d.name}</span>
                            </div>
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-[#050505] border border-white/10 hover:bg-[#101010] hover:border-slate-500 text-slate-300 font-bold px-8 py-5 rounded-md transition-all active:scale-95 group"
          >
            <Settings className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
            <span className="tracking-widest uppercase text-sm sm:text-base">UPGRADES</span>
          </button>

          <button 
            onClick={() => {
              if (gameMode === 'multiplayer') {
                if (!isMultiplayerReady) return;
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
            disabled={gameMode === 'multiplayer' && !isMultiplayerReady}
            className={`flex-[2] sm:flex-none flex items-center justify-center gap-4 font-black px-12 py-5 rounded-xl transition-all active:scale-[0.98] group overflow-hidden relative ${
              gameMode === 'multiplayer' && !isMultiplayerReady
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                : 'bg-orange-500 hover:bg-orange-400 text-black'
            }`}
          >
            <Play className="w-8 h-8 fill-slate-900 relative z-10 group-hover:scale-110 transition-transform" />
            <span className="text-xl sm:text-2xl tracking-tight italic uppercase relative z-10">
              {gameMode === 'multiplayer' ? 'HOST/JOIN MATCH' : 'START MISSION'}
            </span>
          </button>

        </div>
      </div>
    </motion.div>
  );
}
