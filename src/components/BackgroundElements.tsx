import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Swords } from 'lucide-react';

export const NerfReactor = ({ onClick }: { onClick: () => void }) => (
  <motion.div 
    className="absolute w-64 h-64 rounded-full border-4 border-cyan-500/30 flex items-center justify-center cursor-pointer hover:border-cyan-400"
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    onClick={onClick}
  >
    <div className="w-48 h-48 rounded-full border-2 border-blue-400/50 flex items-center justify-center">
      <div className="w-32 h-32 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute w-16 h-16 bg-cyan-400 rounded-full shadow-[0_0_40px_rgba(34,211,238,0.8)]" />
    </div>
  </motion.div>
);

export const FloatingOrb = ({ icon: Icon, color, delay, onClick }: { icon: any, color: string, delay: number, onClick: () => void }) => (
  <motion.div 
    className={`absolute p-4 rounded-full bg-black/40 border border-${color}-500/50 backdrop-blur-sm cursor-pointer hover:scale-110`}
    animate={{ y: [0, -20, 0] }}
    transition={{ duration: 4, repeat: Infinity, delay }}
    onClick={onClick}
  >
    <Icon className={`w-8 h-8 text-${color}-400`} />
    <div className={`absolute inset-0 rounded-full blur-md bg-${color}-500/30 animate-pulse`} />
  </motion.div>
);

export const ParticleSystem = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-white rounded-full"
        initial={{ 
          x: Math.random() * 100 + '%', 
          y: Math.random() * 100 + '%',
          opacity: Math.random() * 0.5 + 0.2
        }}
        animate={{ 
          y: [null, Math.random() * 100 - 50 + '%'],
          opacity: [null, 0]
        }}
        transition={{ 
          duration: Math.random() * 5 + 5, 
          repeat: Infinity,
          ease: "linear"
        }}
      />
    ))}
  </div>
);

export const DamageIndicator = ({ direction }: { direction: 'left' | 'right' | 'top' | 'bottom' | null }) => {
  if (!direction) return null;
  
  const rotation = { left: 'rotate-180', right: 'rotate-0', top: '-rotate-90', bottom: 'rotate-90' }[direction];
  
  return (
    <motion.div 
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 ${rotation}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-64 overflow-hidden translate-x-16">
        <div className="w-64 h-64 rounded-full border-l-[16px] border-red-500/80 filter blur-[2px] -translate-x-32" />
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 -translate-x-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-red-500 border-b-[12px] border-b-transparent animate-pulse" />
    </motion.div>
  );
};

export const CyberGridBackground = () => (
  <div className="absolute inset-0 bg-[#020617] overflow-hidden z-0" style={{ perspective: '1000px' }}>
    {/* Deep Space / Cyber Void Gradient */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#020617_80%)]" />
    
    {/* 3D Animated Grid Floor */}
    <div className="absolute bottom-[-10%] left-[-50%] w-[200%] h-[80%] origin-bottom" style={{ transform: 'rotateX(75deg)' }}>
      <motion.div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.15) 2px, transparent 2px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 2px, transparent 2px)
          `,
          backgroundSize: '80px 80px'
        }}
        animate={{ y: [0, 80] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {/* Grid fade at the horizon */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#020617_60%] to-[#020617]" />
    </div>

    {/* Distant Cyber City / Horizon Glow */}
    <div className="absolute top-[40%] left-0 w-full h-[20%] bg-gradient-to-t from-cyan-500/20 to-transparent blur-2xl" />
    <div className="absolute top-[45%] left-0 w-full h-[5%] bg-gradient-to-t from-cyan-400/40 to-transparent blur-md" />
  </div>
);

export const ScanningLaser = () => (
  <motion.div 
    className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-10"
    animate={{ top: ['0%', '100%', '0%'] }}
    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
  />
);

export const DynamicLighting = () => (
  <motion.div 
    className="absolute inset-0 pointer-events-none z-0"
    animate={{ 
      background: [
        'radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.1), transparent 50%)',
        'radial-gradient(circle at 80% 70%, rgba(255, 140, 0, 0.1), transparent 50%)',
        'radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.1), transparent 50%)'
      ]
    }}
    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
  />
);

export const CRTOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden mix-blend-overlay opacity-30">
    {/* Scanlines */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    {/* Vignette */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]" />
    {/* CRT Curve shadow */}
    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
  </div>
);

