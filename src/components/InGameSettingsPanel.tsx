import React from 'react';
import { motion } from 'motion/react';
import { Settings2, X, Monitor, Hand, Volume2, Maximize, MousePointer2 } from 'lucide-react';

export function InGameSettingsPanel({ settings, setSettings, onClose }: any) {
  
  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8 select-none"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/50 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-800">
           <div className="flex items-center gap-3">
              <Settings2 className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-widest uppercase">System Settings</h2>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-700/50 hover:border-slate-500"
           >
             <X className="w-5 h-5 text-slate-400 hover:text-white" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col gap-8 custom-scrollbar">
          
          {/* Controls Config */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Hand className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Controls</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Handedness</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Flips mobile control layout</span>
                 </div>
                 <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                   <button onClick={() => updateSetting('leftHanded', false)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${!settings.leftHanded ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>RIGHT</button>
                   <button onClick={() => updateSetting('leftHanded', true)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${settings.leftHanded ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>LEFT</button>
                 </div>
               </div>

               <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Control Size</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Scales on-screen buttons</span>
                 </div>
                 <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                   <button onClick={() => updateSetting('controlScale', 0.85)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${settings.controlScale === 0.85 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>S</button>
                   <button onClick={() => updateSetting('controlScale', 1.0)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${settings.controlScale === 1.0 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>M</button>
                   <button onClick={() => updateSetting('controlScale', 1.15)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${settings.controlScale === 1.15 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>L</button>
                 </div>
               </div>
               
               <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Fire Button</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Show dedicated fire button</span>
                 </div>
                 <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                   <button onClick={() => updateSetting('showFireButton', false)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${!settings.showFireButton ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>HIDE</button>
                   <button onClick={() => updateSetting('showFireButton', true)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${settings.showFireButton ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>SHOW</button>
                 </div>
               </div>
             </div>
          </div>

          <div className="h-px bg-slate-800" />
          
          {/* Display & HUD */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Display & Audio</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               
               <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Crosshair</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Targeting reticle style</span>
                 </div>
                 <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                   <button onClick={() => updateSetting('crosshairStyle', 'tactical')} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${settings.crosshairStyle === 'tactical' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>TACTICAL</button>
                   <button onClick={() => updateSetting('crosshairStyle', 'dot')} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${settings.crosshairStyle === 'dot' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>DOT</button>
                 </div>
               </div>

               <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Hit Markers</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Visual feedback on hits</span>
                 </div>
                 <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                   <button onClick={() => updateSetting('hitMarkers', false)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${!settings.hitMarkers ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>OFF</button>
                   <button onClick={() => updateSetting('hitMarkers', true)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${settings.hitMarkers ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>ON</button>
                 </div>
               </div>

             </div>
          </div>

        </div>
        
        <div className="p-6 bg-slate-950 border-t border-slate-800">
           <button 
             onClick={onClose}
             className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black italic text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
           >
             APPLY & CLOSE
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
