// Darts redesign — shared design token system.
// Mirrors the Claude Design package (Art Direction + Redesign Boards):
// black-first canvas, restrained Nerf orange, sparse cyan/yellow/magenta accents,
// hairline borders, hard-edge notches, no glow / no blur / no bloom.

import type { CSSProperties } from 'react';

export const TOKENS = {
  // ── COLOR ──────────────────────────────────────────────────────────────
  bg:           '#000000',
  bgRaised:     '#0B0B0C',
  bgPanel:      'rgba(16,16,18,0.78)',
  bgPanelSolid: '#101012',
  bgTranslucent: 'rgba(0,0,0,0.62)',
  bgTranslucentHi: 'rgba(0,0,0,0.78)',

  hairline:     '#1F1F22',
  hairlineHi:   '#2C2C30',

  textHi:       '#F5F1E8',
  text:         '#CFC9BD',
  textMute:     '#7A7570',
  textDim:      '#4A4641',
  textOnOrange: '#0A0A0A',

  // Accent palette — used purposefully, not decoratively
  orange:       '#FF6A1A',
  orangeHot:    '#FF8A3A',
  orangeShadow: 'rgba(255,106,26,0.45)',
  cyan:         '#19E0FF',
  yellow:       '#FFC83D',
  magenta:      '#FF2D7A',
  green:        '#37D67A',

  // ── TYPOGRAPHY ─────────────────────────────────────────────────────────
  fontDisplay:  '"Antonio", "Saira Condensed", system-ui, sans-serif',
  fontUi:       '"Saira", system-ui, sans-serif',
  fontMono:     '"JetBrains Mono", ui-monospace, monospace',

  // ── SPACING ────────────────────────────────────────────────────────────
  pad:          56,
  safeTop:      64,
  safeBottom:   56,
} as const;

// Corner-cut polygon used for the CTA bar shape (DEPLOY/EQUIP/NEXT MISSION).
export const ctaClipPath = (r = 22): string =>
  `polygon(0 0, calc(100% - ${r}px) 0, 100% ${r}px, 100% 100%, ${r}px 100%, 0 calc(100% - ${r}px))`;

// Octagon polygon used for FIRE / RELOAD buttons.
export const octagonClipPath = (p = 20): string => {
  const a = p;
  const b = 100 - p;
  return `polygon(${a}% 0, ${b}% 0, 100% ${a}%, 100% ${b}%, ${b}% 100%, ${a}% 100%, 0 ${b}%, 0 ${a}%)`;
};

// Top-tick accent — 3px colored stripe sitting on the top edge of a panel.
export const topTickStyle = (
  color: string,
  width = 36,
  side: 'left' | 'right' = 'left',
): CSSProperties => ({
  position: 'absolute',
  top: -1,
  [side]: 0,
  height: 3,
  width,
  background: color,
});

// Hard, flat orange drop-shadow used under the primary CTA. No blur.
export const ctaShadow = `0 14px 0 -4px ${TOKENS.orangeShadow}`;
