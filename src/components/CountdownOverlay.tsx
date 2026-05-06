import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      sounds.playCountdown();
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      sounds.playMatchStart();
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 2, rotate: 20 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          className="relative"
        >
          {count > 0 ? (
            <div className="flex flex-col items-center">
              <span className="text-9xl md:text-[200px] font-black italic text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] leading-none">
                {count}
              </span>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-cyan-400 font-black tracking-[0.5em] text-xl mt-4 uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              >
                Get Ready
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-9xl md:text-[200px] font-black italic text-orange-500 drop-shadow-[0_0_80px_rgba(249,115,22,0.8)] leading-none uppercase">
                GO!
              </span>
              <motion.div
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1.2 }}
                 className="text-white font-black tracking-[1em] text-2xl mt-4 uppercase drop-shadow-[0_0_15px_white]"
              >
                STRIKE NOW
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Decorative lines */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '100vw' }}
        className="absolute h-1 bg-white/20 top-1/2 -translate-y-1/2"
      />
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: '100vh' }}
        className="absolute w-1 bg-white/20 left-1/2 -translate-x-1/2"
      />
    </div>
  );
}
