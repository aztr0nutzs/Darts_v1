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
      className="absolute inset-0 z-[250] flex items-center justify-center bg-black/95 p-4 sm:p-8 select-none"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-3xl bg-[#050505] border border-white/10 rounded-md shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-800">
           <div className="flex items-center gap-3">
              <Settings2 className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-widest uppercase">System Settings</h2>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-[#111] hover:bg-[#171717] flex items-center justify-center transition-colors border border-white/10 hover:border-slate-500"
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
               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Handedness</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Flips mobile control layout</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('leftHanded', false)} className={`px-4 py-2 rounded-sm text-xs font-bold transition-all ${!settings.leftHanded ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>RIGHT</button>
                   <button onClick={() => updateSetting('leftHanded', true)} className={`px-4 py-2 rounded-sm text-xs font-bold transition-all ${settings.leftHanded ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>LEFT</button>
                 </div>
               </div>

               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Control Size</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Scales on-screen buttons</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('controlScale', 0.85)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.controlScale === 0.85 ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>S</button>
                   <button onClick={() => updateSetting('controlScale', 1.0)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.controlScale === 1.0 ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>M</button>
                   <button onClick={() => updateSetting('controlScale', 1.15)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.controlScale === 1.15 ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>L</button>
                 </div>
               </div>
               
               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Fire Button</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Show dedicated fire button</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('showFireButton', false)} className={`px-4 py-2 rounded-sm text-xs font-bold transition-all ${!settings.showFireButton ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>HIDE</button>
                   <button onClick={() => updateSetting('showFireButton', true)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${settings.showFireButton ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>SHOW</button>
                 </div>
               </div>
             </div>
          </div>

          <div className="h-px bg-white/10" />
          
          {/* Display & HUD */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Display & Audio</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               
               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Crosshair</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Targeting reticle style</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('crosshairStyle', 'tactical')} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.crosshairStyle === 'tactical' ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>TACTICAL</button>
                   <button onClick={() => updateSetting('crosshairStyle', 'dot')} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.crosshairStyle === 'dot' ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>DOT</button>
                 </div>
               </div>

               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Hit Markers</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Visual feedback on hits</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('hitMarkers', false)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${!settings.hitMarkers ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>OFF</button>
                   <button onClick={() => updateSetting('hitMarkers', true)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.hitMarkers ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>ON</button>
                 </div>
               </div>

               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Screen Effects</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Flash, shake & lens effects</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('screenEffects', false)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.screenEffects === false ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>OFF</button>
                   <button onClick={() => updateSetting('screenEffects', true)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${settings.screenEffects !== false ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>ON</button>
                 </div>
               </div>

             </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Audio & Haptics */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Audio & Haptics</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Sound Volume</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Master volume for all SFX</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('soundVolume', 0)} className={`px-3 py-2 rounded-sm text-[10px] font-bold transition-all ${(settings.soundVolume ?? 0.7) === 0 ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>OFF</button>
                   <button onClick={() => updateSetting('soundVolume', 0.35)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${(settings.soundVolume ?? 0.7) === 0.35 ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'}`}>LOW</button>
                   <button onClick={() => updateSetting('soundVolume', 0.7)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${(settings.soundVolume ?? 0.7) === 0.7 ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'}`}>MED</button>
                   <button onClick={() => updateSetting('soundVolume', 1.0)} className={`px-3 py-2 rounded-md text-[10px] font-bold transition-all ${(settings.soundVolume ?? 0.7) === 1.0 ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'}`}>MAX</button>
                 </div>
               </div>

               <div className="bg-black p-4 rounded-md border border-white/10 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="font-bold text-white mb-1">Haptic Feedback</span>
                   <span className="text-[10px] sm:text-xs text-slate-500">Vibration on fire, hit, reload</span>
                 </div>
                 <div className="flex bg-black p-1 rounded-md border border-white/10">
                   <button onClick={() => updateSetting('hapticsEnabled', false)} className={`px-4 py-2 rounded-sm text-xs font-bold transition-all ${settings.hapticsEnabled === false ? 'bg-[#222] text-white' : 'text-slate-400 hover:text-white'}`}>OFF</button>
                   <button onClick={() => updateSetting('hapticsEnabled', true)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${settings.hapticsEnabled !== false ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'}`}>ON</button>
                 </div>
               </div>
             </div>
          </div>

        </div>
        
        <div className="p-6 bg-black border-t border-white/10">
           <button 
             onClick={onClose}
             className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black italic text-lg py-4 rounded-md transition-all"
           >
             APPLY & CLOSE
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
