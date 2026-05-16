import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import type { AmmoType } from '../lib/guns';
import { getDartAsset } from '../lib/assetRegistry';

// Soft texture sourced from the provided dart sheet. Used as a subtle accent
// on the CSS projectile so projectile colors match the asset palette without
// breaking the existing animation system.
function DartSpriteAccent({ shape }: { shape: AmmoType['shape'] }) {
  const [failed, setFailed] = React.useState(false);
  const asset = React.useMemo(() => {
    // Map shape -> dart asset id ("dart_<shape>")
    return getDartAsset(`dart_${shape}`);
  }, [shape]);
  if (failed) return null;
  const offset = asset.spriteOffset;
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-full opacity-70"
      style={{
        backgroundImage: `url('${asset.src}')`,
        backgroundSize: offset?.size ?? 'cover',
        backgroundPosition: offset ? `${offset.x} ${offset.y}` : 'center',
        backgroundRepeat: 'no-repeat',
        mixBlendMode: 'screen',
        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
      }}
      onError={() => setFailed(true)}
    />
  );
}

interface DartProps {
  key?: React.Key;
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  dartType: AmmoType;
  onComplete: (id: string) => void;
}

export default function Dart({ id, startX, startY, endX, endY, dartType, onComplete }: DartProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id);
    }, dartType.speed);
    return () => clearTimeout(timer);
  }, [id, dartType.speed, onComplete]);

  // Calculate angle
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
  const distance = Math.hypot(endX - startX, endY - startY);

  const isRocket = dartType.shape === 'rocket';
  const isVortex = dartType.shape === 'vortex';
  const isMega = dartType.shape === 'mega';

  // Gravity arc: heavier projectiles drop more. Rockets have a dramatic arc.
  const dropAmount = isRocket ? 70 : isMega ? 55 : 22;

  // Offset control point slightly towards the shooter to make close-range shots
  // look like they travel through 3D space rather than straight across 2D.
  const travelFrac = 0.42;
  const controlPointX = startX + (endX - startX) * travelFrac;
  const controlPointY = startY + (endY - startY) * travelFrac - dropAmount;

  // Depth scaling: projectile starts large (close) and shrinks as it recedes.
  // More dramatic range improves perceived perspective.
  const startScale = isRocket ? 2.8 : isMega ? 2.6 : 2.2;
  const endScale   = isRocket ? 0.25 : isMega ? 0.28 : 0.32;

  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`trail-${id}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${angle})`}>
            <stop offset="0%" stopColor={dartType.color} stopOpacity="0.55" />
            <stop offset="60%" stopColor={dartType.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Motion trail — widens for heavier projectiles */}
        {!isVortex && (
          <motion.path
            d={`M ${startX} ${startY} Q ${controlPointX} ${controlPointY} ${endX} ${endY}`}
            stroke={`url(#trail-${id})`}
            strokeWidth={isMega ? 18 : isRocket ? 28 : 9}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0.7 }}
            animate={{ pathLength: 1, opacity: 0 }}
            transition={{ duration: dartType.speed / 1000, ease: "easeOut" }}
          />
        )}
      </svg>

      {/* Dart Projectile — perspective-scaled (large near camera, small far) */}
      <motion.div
        className="absolute z-40 pointer-events-none drop-shadow-md"
        initial={{
          x: startX,
          y: startY,
          scale: startScale,
          rotate: isVortex ? 0 : angle + 90,
        }}
        animate={{
          x: endX,
          y: endY,
          scale: endScale,
          rotate: isVortex ? 1080 : angle + 90,
        }}
        transition={{
          duration: dartType.speed / 1000,
          ease: "easeIn",
        }}
      >
        {dartType.shape === 'dart' && (
          <div className="flex flex-col items-center animate-[wobble_0.1s_ease-in-out_infinite]">
             <div className="w-3 h-4 rounded-t-full" style={{ backgroundColor: dartType.color }} />
             <div className="w-3 h-10 bg-blue-600 rounded-b-sm border-x border-blue-800" />
          </div>
        )}
        
        {dartType.shape === 'mega' && (
          <div className="flex flex-col items-center animate-[wobble_0.15s_ease-in-out_infinite]">
             <div className="w-5 h-6 rounded-t-full shadow-inner" style={{ backgroundColor: dartType.color }} />
             <div className="w-5 h-16 bg-red-600 rounded-b-sm border-x border-red-800" />
          </div>
        )}
        
        {dartType.shape === 'rival' && (
          <div className="relative w-8 h-8 rounded-full" style={{ backgroundColor: dartType.color, backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }}>
            <DartSpriteAccent shape="rival" />
          </div>
        )}

        {dartType.shape === 'vortex' && (
          <div className="relative w-12 h-12 rounded-full border-[6px]" style={{ borderColor: dartType.color, backgroundColor: '#fff', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-black/20" />
            </div>
            {/* Spinning blades/markings */}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-black/10 -translate-x-1/2" />
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-black/10 -translate-y-1/2" />
            <DartSpriteAccent shape="vortex" />
          </div>
        )}
        
        {dartType.shape === 'rocket' && (
          <svg width="40" height="100" viewBox="0 0 40 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[wobble_0.2s_ease-in-out_infinite]">
            <rect x="10" y="20" width="20" height="60" fill="#475569" />
            <path d="M 10 20 L 20 0 L 30 20 Z" fill="#f97316" />
            <path d="M 0 70 L 10 50 L 10 80 Z" fill="#cbd5e1" />
            <path d="M 40 70 L 30 50 L 30 80 Z" fill="#cbd5e1" />
            <path d="M 15 80 L 25 80 L 20 95 Z" fill="#ef4444" opacity="0.8" />
          </svg>
        )}
      </motion.div>
    </>
  );
}
