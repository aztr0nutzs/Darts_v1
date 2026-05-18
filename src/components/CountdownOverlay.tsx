import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let step = 3;
    let cancelled = false;

    const runStep = () => {
      if (cancelled) return;
      setCount(step);

      if (step > 0) {
        sounds.playCountdown();
        step -= 1;
        window.setTimeout(runStep, 1000);
        return;
      }

      sounds.playMatchStart();
      window.setTimeout(() => {
        if (!cancelled) onCompleteRef.current();
      }, 800);
    };

    // Parent rerenders used to recreate the inline onComplete callback and
    // restart this timer. The sequence now runs once per mount and calls the
    // latest callback through a ref.
    runStep();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <div className="absolute inset-0 bg-black/55" />
      
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
              <span className="text-9xl md:text-[200px] font-black italic text-[#f5f5f4] leading-none">
                {count}
              </span>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-amber-300/90 font-black tracking-[0.45em] text-xl mt-4 uppercase"
              >
                Get Ready
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-9xl md:text-[200px] font-black italic text-orange-500 leading-none uppercase">
                GO!
              </span>
              <motion.div
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1.2 }}
                 className="text-[#fafaf9] font-black tracking-[0.9em] text-2xl mt-4 uppercase"
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
        className="absolute h-[2px] bg-orange-500/35 top-1/2 -translate-y-1/2"
      />
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: '100vh' }}
        className="absolute w-[2px] bg-stone-200/20 left-1/2 -translate-x-1/2"
      />
    </div>
  );
}
