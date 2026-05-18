// In-Game Controls — Claude Design board (tactical mobile controls).
// Black-first hard-edged touch controls. Octagon FIRE is the dominant action
// (orange). RELOAD / SWAP are secondary ghost octagons with hairline borders.
// No round soft cyan glass buttons, no glow halos. Hit targets preserved.

import React from 'react';
import { TOKENS, octagonClipPath } from '../lib/designTokens';

interface InGameControlsProps {
  onFire: () => void;
  onReload: () => void;
  onPause: () => void;
  onWeaponSwap: () => void;
  leftHanded?: boolean;
  buttonScale?: number;
  opacity?: number;
  showFireButton?: boolean;
}

export function InGameControls({
  onFire,
  onReload,
  onWeaponSwap,
  leftHanded = false,
  buttonScale = 1,
  opacity = 1,
  showFireButton = false,
}: InGameControlsProps) {
  // FIRE button sizing — large enough to be a confident touch target even on
  // small phones (96px @ scale 1). Octagon clip preserves a hit-friendly hitbox
  // because pointer events fall back to the underlying button rect.
  const FIRE_SIZE = 108;
  const SECONDARY_SIZE = 76;
  const SWAP_SIZE = 64;

  return (
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none z-50 select-none"
      style={{
        opacity,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        className="flex items-end justify-between"
        style={{
          transform: `scale(${buttonScale})`,
          transformOrigin: leftHanded ? 'bottom left' : 'bottom right',
          flexDirection: leftHanded ? 'row-reverse' : 'row',
        }}
      >
        {/* Spacer left — reserved for movement / aim assist module */}
        <div className="pointer-events-none" style={{ width: 1 }} />

        {/* Action cluster — RELOAD + SWAP + FIRE */}
        <div
          className="pointer-events-auto flex items-end"
          style={{
            gap: 12,
            flexDirection: leftHanded ? 'row-reverse' : 'row',
          }}
        >
          {!showFireButton && (
            <TacticalButton
              label="RELOAD"
              size={SECONDARY_SIZE}
              accent={TOKENS.cyan}
              onPress={onReload}
              variant="ghost"
            />
          )}

          <TacticalButton
            label="SWAP"
            size={SWAP_SIZE}
            accent={TOKENS.yellow}
            onPress={onWeaponSwap}
            variant="ghost"
            style={{ marginBottom: SECONDARY_SIZE > 0 ? 6 : 0 }}
          />

          {showFireButton && (
            <TacticalButton
              label="FIRE"
              size={FIRE_SIZE}
              accent={TOKENS.orange}
              onPress={onFire}
              variant="solid"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── TacticalButton ─────────────────────────────────────────────────────────
// Hard-edge octagon button. Solid orange (FIRE) or hairline-bordered ghost
// (RELOAD/SWAP). Inner numeric/text label sits centered. No glow shadow.
function TacticalButton({
  label,
  size,
  accent,
  onPress,
  variant,
  style,
}: {
  label: string;
  size: number;
  accent: string;
  onPress: () => void;
  variant: 'solid' | 'ghost';
  style?: React.CSSProperties;
}) {
  const isSolid = variant === 'solid';
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPress();
      }}
      aria-label={label}
      className="block select-none active:translate-y-[2px]"
      style={{
        position: 'relative',
        width: size,
        height: size,
        padding: 0,
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        ...style,
      }}
    >
      {/* Outer octagon */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: isSolid ? accent : 'rgba(0,0,0,0.62)',
          clipPath: octagonClipPath(18),
        }}
      />
      {/* Inner octagon (hairline ring) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 4,
          background: isSolid ? accent : 'transparent',
          border: isSolid ? `2px solid ${TOKENS.textOnOrange}33` : `1.5px solid ${accent}`,
          clipPath: octagonClipPath(18),
        }}
      />
      {/* Centered label */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: `900 italic ${Math.max(11, Math.round(size * 0.18))}px/1 ${TOKENS.fontDisplay}`,
          color: isSolid ? TOKENS.textOnOrange : accent,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          textShadow: isSolid ? '0 1px 0 rgba(0,0,0,0.25)' : 'none',
        }}
      >
        {label}
      </span>
    </button>
  );
}
