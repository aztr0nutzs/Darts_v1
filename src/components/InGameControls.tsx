import React from 'react';
import { motion } from 'motion/react';
import { Crosshair, RefreshCw, Hand, Shield, Settings, Focus, Crosshair as AimCircle, Target, ArrowRight } from 'lucide-react';

export function InGameControls({ 
  onFire, 
  onReload, 
  onPause, 
  onWeaponSwap,
  leftHanded,
  buttonScale,
  opacity,
  showFireButton = false
}: any) {
  
  const layoutClass = leftHanded ? 'left-4 sm:left-8 flex-row-reverse' : 'right-4 sm:right-8 flex-row';
  const sideClass = leftHanded ? 'flex-row-reverse left-4 sm:left-8' : 'flex-row right-4 sm:right-8';

  return (
    <div 
      className="absolute bottom-4 sm:bottom-8 pointer-events-none z-50 flex items-end justify-between w-full px-4 sm:px-8"
      style={{ opacity, transform: `scale(${buttonScale})`, transformOrigin: 'bottom' }}
    >
      <div className={`pointer-events-auto flex items-end gap-2 sm:gap-4 ${leftHanded ? 'order-1' : 'order-1'}`}>
         {/* Movement / Assist Area (left or right depending on handedness) */}
         {/* If Left-handed, this is on the right. If Right-handed, this is on the left. */}
      </div>

      <div className={`pointer-events-auto flex items-end gap-2 sm:gap-4 ${leftHanded ? 'order-0' : 'order-2'}`}>
        {!showFireButton && (
           <button 
             onPointerDown={(e) => { e.stopPropagation(); onReload(); }}
             className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center hover:bg-slate-700 active:scale-90 shadow-lg backdrop-blur-sm transition-transform"
           >
             <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
           </button>
        )}

        <button 
           onPointerDown={(e) => { e.stopPropagation(); onWeaponSwap(); }}
           className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center hover:bg-slate-700 active:scale-90 shadow-lg backdrop-blur-sm transition-transform mb-2 sm:mb-4"
        >
           <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
        </button>

        {showFireButton && (
          <button 
            onPointerDown={(e) => { e.stopPropagation(); onFire(); }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-cyan-600/80 border-4 border-cyan-400 flex items-center justify-center hover:bg-cyan-500 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.5)] backdrop-blur-sm transition-transform"
          >
            <Target className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
          </button>
        )}
      </div>

      <div className={`absolute top-4 sm:top-8 pointer-events-auto ${leftHanded ? 'right-4 sm:right-8' : 'left-4 sm:left-8'}`}>
        {/* Pause Button was moved to HUD, we can have settings quick toggle here if needed */}
      </div>
    </div>
  );
}
