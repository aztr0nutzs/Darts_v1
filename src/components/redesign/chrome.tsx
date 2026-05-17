// Shared chrome for the Darts redesign screens.
// Black-first panels, hairline borders, hard-edge notches, top-tick accents.
// No glow, no blur fog, no decorative animation.

import React from 'react';
import { TOKENS, ctaClipPath, ctaShadow } from '../../lib/designTokens';

// ── CornerTicks ─────────────────────────────────────────────────────────────
// Four 22-28px orange ticks at the corners of a focal box. Used around the
// hero blaster on the Main Menu and Loadout screens.
export function CornerTicks({
  color = TOKENS.orange,
  size = 22,
  thickness = 2,
}: { color?: string; size?: number; thickness?: number }) {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <span
          key={c}
          aria-hidden
          style={{
            position: 'absolute',
            ...(c.includes('t') ? { top: -1 } : { bottom: -1 }),
            ...(c.includes('l') ? { left: -1 } : { right: -1 }),
            width: size,
            height: size,
            borderTop:    c.includes('t') ? `${thickness}px solid ${color}` : 'none',
            borderBottom: c.includes('b') ? `${thickness}px solid ${color}` : 'none',
            borderLeft:   c.includes('l') ? `${thickness}px solid ${color}` : 'none',
            borderRight:  c.includes('r') ? `${thickness}px solid ${color}` : 'none',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

// ── PrimaryCta ──────────────────────────────────────────────────────────────
// The signature notched orange bar (DEPLOY, EQUIP, NEXT MISSION). Hard shadow,
// no glow. Single primary action — never duplicated on a screen.
export function PrimaryCta({
  label,
  sub,
  onClick,
  disabled,
  height = 140,
  notch = 22,
  className = '',
}: {
  label: string;
  sub?: string;
  onClick?: () => void;
  disabled?: boolean;
  height?: number;
  notch?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`block w-full text-left select-none transition-transform active:translate-y-[3px] disabled:opacity-50 disabled:active:translate-y-0 ${className}`}
      style={{
        position: 'relative',
        height,
        background: TOKENS.orange,
        color: TOKENS.textOnOrange,
        clipPath: ctaClipPath(notch),
        boxShadow: disabled ? 'none' : ctaShadow,
        padding: '0 36px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 5,
          height: '54%',
          background: TOKENS.textOnOrange,
          marginRight: 24,
          flexShrink: 0,
        }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            font: `900 italic 44px/1 ${TOKENS.fontDisplay}`,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            style={{
              marginTop: 8,
              font: `700 14px/1 ${TOKENS.fontMono}`,
              letterSpacing: '.22em',
              opacity: 0.72,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </span>
        )}
      </span>
      <span
        aria-hidden
        style={{
          marginLeft: 'auto',
          font: `900 italic 56px/1 ${TOKENS.fontDisplay}`,
        }}
      >
        ›
      </span>
    </button>
  );
}

// ── SecondaryCta ───────────────────────────────────────────────────────────
// Hairline-bordered ghost variant. Same notch shape as PrimaryCta.
export function SecondaryCta({
  label,
  sub,
  onClick,
  disabled,
  height = 140,
  notch = 22,
}: {
  label: string;
  sub?: string;
  onClick?: () => void;
  disabled?: boolean;
  height?: number;
  notch?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="block w-full text-left select-none disabled:opacity-50"
      style={{
        position: 'relative',
        height,
        background: 'transparent',
        color: TOKENS.textHi,
        border: `1.5px solid ${TOKENS.hairlineHi}`,
        clipPath: ctaClipPath(notch),
        padding: '0 24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          font: `900 italic 34px/1 ${TOKENS.fontDisplay}`,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {sub && (
        <span
          style={{
            marginTop: 6,
            font: `500 13px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textMute,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
          }}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

// ── NavRow ─────────────────────────────────────────────────────────────────
// Secondary navigation row: index | label | hint | chevron with a single hairline divider.
export function NavRow({
  index,
  label,
  hint,
  onClick,
  hot,
}: {
  index: string;
  label: string;
  hint?: string;
  onClick?: () => void;
  hot?: boolean;
}) {
  const [hover, setHover] = React.useState(false);
  const isHot = Boolean(hot || hover);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block w-full text-left select-none"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '20px 0',
        borderBottom: `1px solid ${TOKENS.hairline}`,
        background: 'transparent',
        border: 0,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: TOKENS.hairline,
        cursor: 'pointer',
        width: '100%',
        transition: 'background-color 120ms ease',
      }}
    >
      <span
        style={{
          minWidth: 48,
          font: `500 18px/1 ${TOKENS.fontMono}`,
          color: isHot ? TOKENS.orange : TOKENS.textDim,
          letterSpacing: '.16em',
          transition: 'color 120ms ease',
        }}
      >
        {index}
      </span>
      <span
        style={{
          flex: 1,
          font: `700 italic 32px/1 ${TOKENS.fontDisplay}`,
          letterSpacing: '.06em',
          color: TOKENS.textHi,
          textTransform: 'uppercase',
          transform: isHot ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform 120ms ease',
        }}
      >
        {label}
      </span>
      {hint && (
        <span
          style={{
            font: `500 14px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textMute,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
          }}
        >
          {hint}
        </span>
      )}
      <span
        aria-hidden
        style={{
          marginLeft: 8,
          font: `700 26px/1 ${TOKENS.fontMono}`,
          color: isHot ? TOKENS.orange : TOKENS.textDim,
          transition: 'color 120ms ease',
        }}
      >
        ›
      </span>
    </button>
  );
}

// ── HudModule ──────────────────────────────────────────────────────────────
// Black translucent panel with a colored top-tick and a label/value stack.
// Sized to the parent. No glow, no inner gradient.
export function HudModule({
  label,
  value,
  sub,
  align = 'left',
  accent = TOKENS.textHi,
  tickColor,
  mono = true,
  valueSize = 44,
  enableBlur = true,
}: {
  label: string;
  value: string | number;
  sub?: string;
  align?: 'left' | 'center' | 'right';
  accent?: string;
  tickColor?: string;
  mono?: boolean;
  valueSize?: number;
  enableBlur?: boolean;
}) {
  const tick = tickColor || accent;
  return (
    <div
      style={{
        position: 'relative',
        background: TOKENS.bgTranslucent,
        border: `1px solid ${TOKENS.hairline}`,
        padding: '12px 16px 14px',
        textAlign: align,
        backdropFilter: enableBlur ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: enableBlur ? 'blur(8px)' : undefined,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: -1,
          [align === 'right' ? 'right' : 'left']: 0,
          height: 3,
          width: 36,
          background: tick,
        }}
      />
      <div
        style={{
          font: `500 12px/1 ${TOKENS.fontUi}`,
          color: TOKENS.textMute,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          font: mono
            ? `700 ${valueSize}px/1 ${TOKENS.fontMono}`
            : `900 italic ${valueSize}px/1 ${TOKENS.fontDisplay}`,
          color: accent,
          letterSpacing: mono ? '.02em' : '.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 4,
            font: `500 11px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textMute,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Kicker ─────────────────────────────────────────────────────────────────
// Small uppercase mono kicker. Optional 1px bordered chip.
export function Kicker({
  children,
  color = TOKENS.orange,
  bordered,
  size = 14,
}: {
  children: React.ReactNode;
  color?: string;
  bordered?: boolean;
  size?: number;
}) {
  if (bordered) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          border: `1px solid ${color}`,
          color,
          font: `700 ${size}px/1 ${TOKENS.fontMono}`,
          letterSpacing: '.30em',
          textTransform: 'uppercase',
        }}
      >
        <span aria-hidden style={{ width: 6, height: 6, background: color, display: 'inline-block' }} />
        {children}
      </span>
    );
  }
  return (
    <span
      style={{
        font: `700 ${size}px/1 ${TOKENS.fontMono}`,
        color,
        letterSpacing: '.30em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

// ── HazardTape ─────────────────────────────────────────────────────────────
// Orange/black 45° diagonal stripe band. Decorative anchor — used sparingly.
export function HazardTape({
  width = 340,
  height = 46,
  rotate = -12,
  style,
}: {
  width?: number;
  height?: number;
  rotate?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        background: `repeating-linear-gradient(45deg, ${TOKENS.orange} 0 20px, #000 20px 40px)`,
        transform: `rotate(${rotate}deg)`,
        opacity: 0.9,
        ...style,
      }}
    />
  );
}
