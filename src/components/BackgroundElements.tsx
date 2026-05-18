import React from 'react';
import { motion } from 'motion/react';

/**
 * ACTIVE GAMEPLAY VISUALS ONLY.
 *
 * This module intentionally exports only live, redesign-approved overlays.
 * Legacy neon/cyber backgrounds were moved to:
 *   src/components/legacy/LegacyBackgroundElements.tsx
 *
 * Do not add full-screen cyan/glass/scanning background constructs here.
 */

export const DamageIndicator = ({ direction }: { direction: 'left' | 'right' | 'top' | 'bottom' | null }) => {
  if (!direction) return null;

  const rotation = { left: 'rotate-180', right: 'rotate-0', top: '-rotate-90', bottom: 'rotate-90' }[direction];

  return (
    <motion.div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 ${rotation}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-64 overflow-hidden translate-x-16">
        <div className="w-64 h-64 rounded-full border-l-[16px] border-red-500/80 filter blur-[2px] -translate-x-32" />
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 -translate-x-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-red-500 border-b-[12px] border-b-transparent animate-pulse" />
    </motion.div>
  );
};
