import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, CheckCircle2, Circle, Copy, LogOut, 
  Settings, Wifi, ShieldCheck, Activity, Terminal
} from 'lucide-react';
import type { Socket } from 'socket.io-client';
import type { MultiplayerConnectionStatus } from '../lib/runtimeConfig';

interface MultiplayerLobbyProps {
  roomId: string;
  multiplayerState: any;
  socket: Socket | null;
  connectionStatus: MultiplayerConnectionStatus;
  roomError: string | null;
  socketUrl: string | null;
  onRetry: () => void;
  onLeave: () => void;
  onReady: () => void;
}

export default function MultiplayerLobby({ 
  roomId, 
  multiplayerState, 
  socket, 
  connectionStatus,
  roomError,
  socketUrl,
  onRetry,
  onLeave, 
  onReady 
}: MultiplayerLobbyProps) {
  const players = multiplayerState?.players ? (Object.values(multiplayerState.players) as any[]) : [];
  const localPlayer = players.find((p: any) => p.id === socket?.id);
  const isHost = players.length > 0 && players[0].id === socket?.id;
  const isConnected = connectionStatus === 'connected' && Boolean(socket);
  const statusLabel =
    connectionStatus === 'not_configured'
      ? 'Unavailable'
      : connectionStatus === 'connection_failed'
      ? 'Failed'
      : connectionStatus === 'connected'
      ? 'Linked'
      : connectionStatus === 'connecting'
      ? 'Linking'
      : 'Disconnected';

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    // Could add a toast here
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4 md:p-8 overflow-y-auto"
    >
      {/* Black-first lobby shell; thin structure replaces blue animated backdrop. */}
      <div className="absolute inset-0 pointer-events-none opacity-100 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
        <div className="grid grid-cols-8 gap-4 p-8">
           {[...Array(64)].map((_, i) => (
             <div key={i} className="aspect-square border border-white/[0.025] rounded-sm" />
           ))}
        </div>
      </div>

      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Room Info */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-[#050505] border border-white/10 p-6 rounded-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 bg-[#111] flex items-center gap-2">
               {connectionStatus === 'connected' ? (
                 <>
                   <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">{statusLabel}</span>
                   <Wifi className="w-3 h-3 text-green-500" />
                 </>
               ) : connectionStatus === 'connecting' ? (
                 <>
                   <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">{statusLabel}</span>
                   <Activity className="w-3 h-3 text-yellow-500" />
                 </>
               ) : (
                 <>
                   <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{statusLabel}</span>
                   <Wifi className="w-3 h-3 text-red-500" />
                 </>
               )}
            </div>
            <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mb-2 block">TRANSMISSION_ID</span>
            <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4 flex items-center gap-3">
              {roomId}
              <button 
                onClick={copyRoomCode}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Copy Code"
              >
                <Copy className="w-4 h-4 text-cyan-400" />
              </button>
            </h2>

            {roomError && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-red-500/10 border border-red-500/40 p-2 rounded text-[10px] font-bold text-red-500 uppercase mb-4"
              >
                Error: {roomError}
              </motion.div>
            )}

            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className={`w-3 h-3 ${isConnected ? 'text-green-500' : 'text-slate-600'}`} /> {isConnected ? 'BACKEND_READY' : 'BACKEND_UNAVAILABLE'}</span>
              <span className="flex items-center gap-1.5"><Activity className={`w-3 h-3 ${isConnected ? 'text-cyan-500' : 'text-slate-600'}`} /> {socketUrl ?? 'NO_SOCKET_URL'}</span>
            </div>
            {!isConnected && connectionStatus !== 'not_configured' && (
              <button
                onClick={onRetry}
                className="mt-4 w-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-yellow-400 transition-colors hover:bg-yellow-500/20"
              >
                Retry Backend Connection
              </button>
            )}
          </div>

          <div className="bg-[#050505] border border-white/10 p-6 rounded-md flex-1">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">SYSTEM_OVERRIDE</span>
                <Terminal className="w-4 h-4 text-slate-600" />
             </div>
             <div className="space-y-3">
                <div className="p-3 bg-black border border-white/10 rounded-md flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-300 tracking-wider">WAITING_FOR_SQUAD</span>
                   <span className="text-xs font-black text-cyan-400">{players.length}/4</span>
                </div>
                <div className="p-3 bg-black border border-white/10 rounded-md flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-300 tracking-wider">GAME_MODE</span>
                   <span className="text-xs font-black text-orange-500">MULTIPLAYER_ARENA</span>
                </div>
                <div className="p-3 bg-black border border-white/10 rounded-md">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300 tracking-wider">READY_STATUS</span>
                      <span className="text-xs font-black text-white">{players.filter((p: any) => p.ready).length}/{players.length}</span>
                   </div>
                   <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(players.filter((p: any) => p.ready).length / Math.max(1, players.length)) * 100}%` }}
                        className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
                      />
                   </div>
                </div>
             </div>
          </div>

          <button 
            onClick={onLeave}
            className="w-full bg-red-950/20 border border-red-500/30 hover:bg-red-500/20 text-red-500 p-4 rounded-md font-black text-xs tracking-[0.5em] transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            DISCONNECT_SESSION
          </button>
        </div>

        {/* Right Column: Player List */}
        <div className="md:col-span-7 flex flex-col gap-4">
           <div className="bg-[#050505] border border-white/10 p-6 rounded-md flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Squad_Manifest</h3>
              </div>

              <div className="flex-1 space-y-3">
                 <AnimatePresence>
                    {players.map((p: any, idx: number) => (
                      <motion.div 
                        key={p.id}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className={`flex items-center justify-between p-4 rounded-md border ${p.id === socket?.id ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-black border-white/10'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${p.id === socket?.id ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                               {idx + 1}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                                  {p.id.substring(0, 8)}
                                  {p.id === socket?.id && <span className="text-[8px] bg-cyan-500 text-black px-1 rounded">YOU</span>}
                               </span>
                               <span className="text-[10px] font-bold text-slate-500">OPERATIVE_ID_0x{p.id.substring(8, 12)}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <AnimatePresence mode="wait">
                               {p.ready ? (
                                 <motion.div 
                                    key="ready"
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }} 
                                    className="bg-green-500/20 text-green-500 border border-green-500/40 px-3 py-1 rounded-full flex items-center gap-1.5"
                                 >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase">READY</span>
                                 </motion.div>
                               ) : (
                                 <motion.div 
                                    key="waiting"
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }}
                                    className="bg-slate-800 text-slate-500 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5"
                                 >
                                    <Circle className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase">WAITING</span>
                                 </motion.div>
                               )}
                            </AnimatePresence>
                            {idx === 0 && <span className="text-[10px] font-black text-orange-500 border border-orange-500/30 px-2 py-0.5 rounded">HOST</span>}
                         </div>
                      </motion.div>
                    ))}
                 </AnimatePresence>
                 
                 {players.length < 4 && (
                   <div className="p-4 rounded-md border border-dashed border-white/10 flex items-center justify-center text-slate-700 font-bold text-xs uppercase tracking-[0.3em]">
                      Waiting for reinforcement...
                   </div>
                 )}
              </div>

              <div className="mt-8">
                 <button 
                   onClick={onReady}
                   disabled={!isConnected || localPlayer?.ready}
                   className={`w-full py-5 rounded-md font-black text-lg tracking-[0.4em] italic uppercase transition-all relative overflow-hidden group
                    ${!isConnected || localPlayer?.ready 
                      ? 'bg-zinc-800 text-zinc-600 cursor-default grayscale' 
                      : 'bg-green-500 text-black hover:bg-green-400 active:scale-95'}`}
                 >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                       {!isConnected ? 'BACKEND_OFFLINE' : localPlayer?.ready ? 'MOD_READY' : 'CONFIRM_READY'}
                    </div>
                    {isConnected && !localPlayer?.ready && (
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                 </button>
                 {isHost && players.length < 2 && (
                   <p className="text-center text-[10px] font-bold text-orange-500 mt-2 uppercase">Host requires 2+ squad members to start</p>
                 )}
              </div>
           </div>
        </div>

      </div>
    </motion.div>
  );
}
