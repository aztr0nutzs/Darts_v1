import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Cpu, Zap, Shield, Activity, 
  ChevronRight, Terminal, Radio
} from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_STAGES = [
  { label: "INITIATING ARENA SYSTEM", icon: Shield, duration: 800 },
  { label: "CALIBRATING TARGET GRID", icon: Target, duration: 1000 },
  { label: "PRESSURIZING DART CHAMBER", icon: Zap, duration: 600 },
  { label: "LOADING FOAM MAGAZINE", icon: Cpu, duration: 900 },
  { label: "SYNCING BLASTER HUD", icon: Activity, duration: 700 },
  { label: "READY", icon: ChevronRight, duration: 500 },
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let stageIndex = 0;
    
    const runNextStage = () => {
      if (stageIndex >= BOOT_STAGES.length) {
        setIsFinished(true);
        setTimeout(onComplete, 800);
        return;
      }

      setCurrentStage(stageIndex);
      const stage = BOOT_STAGES[stageIndex];
      
      const startProgress = (stageIndex / BOOT_STAGES.length) * 100;
      const endProgress = ((stageIndex + 1) / BOOT_STAGES.length) * 100;
      
      let startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const ratio = Math.min(elapsed / stage.duration, 1);
        setProgress(startProgress + (endProgress - startProgress) * ratio);
        
        if (ratio >= 1) {
          clearInterval(interval);
          stageIndex++;
          runNextStage();
        }
      }, 16);
    };

    runNextStage();
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e3a8a_0%,transparent_70%)] opacity-20" />
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[image:var(--grain-url)]" style={{ '--grain-url': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opactiy='0.15'/%3E%3C/svg%3E")` } as any} />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/20 animate-scan" style={{ animation: 'scan 4s linear infinite' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-8">
        
        {/* RETICLE DECORATION */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 w-64 h-64 border border-cyan-500/10 rounded-full flex items-center justify-center"
        >
          <div className="w-48 h-48 border border-orange-500/10 rounded-full" />
          <Target className="absolute w-8 h-8 text-cyan-500/20" />
        </motion.div>

        {/* LOGO REVEAL */}
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="mb-12 text-center"
        >
          <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            DART<span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600">STRIKE</span>
          </h1>
          <div className="text-[10px] font-bold tracking-[0.5em] text-cyan-400 opacity-60 mt-2 uppercase">
            Tactical Simulation // V5.0
          </div>
        </motion.div>

        {/* LOADING BOX */}
        <div className="w-full bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                {React.createElement(BOOT_STAGES[Math.min(currentStage, BOOT_STAGES.length - 1)].icon, { className: "w-5 h-5 text-cyan-400" })}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 tracking-wider">SYSTEM_CHECK</span>
                <span className="text-xs font-bold text-white tracking-widest truncate max-w-[180px]">
                  {BOOT_STAGES[Math.min(currentStage, BOOT_STAGES.length - 1)].label}
                </span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-xs font-black text-white italic">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* PROGRESS CHANNELS */}
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: progress >= (i + 1) * (100/6) ? '100%' : (progress > i * (100/6) ? `${(progress - i * (100/6)) * 6}%` : '0%') }}
                  className={`h-full ${currentStage === i ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : 'bg-cyan-500'}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
             <div className="flex items-center gap-2 text-[8px] font-black text-cyan-500/40">
                <Terminal className="w-2.5 h-2.5" />
                <span>0xAF82_LOAD_SEQ_STABLE</span>
             </div>
             <div className="flex items-center gap-2 text-[8px] font-black text-cyan-500/40">
                <Radio className="w-2.5 h-2.5" />
                <span>COMMS_ENCRYPTED_256BIT</span>
             </div>
          </div>
        </div>

        {/* SKIP OPTION */}
        <button 
          onClick={onComplete}
          className="mt-8 text-[10px] font-black text-slate-600 hover:text-white tracking-[0.3em] uppercase transition-colors"
        >
          [ TAP TO BYPASS ]
        </button>
      </div>

      {/* FINAL READY FLASH */}
      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
