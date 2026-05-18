// Pause Overlay — Claude Design board (command overlay).
// Black-first command card. One orange PRIMARY CTA (Resume). Secondary actions
// are restrained ghost rows. Matches MainMenu / ResultsOverlay language.
// No glassy cyan cards, no glowing dividers, no rounded mobile-app energy.

import React from 'react';
import { motion } from 'motion/react';
import { TOKENS } from '../lib/designTokens';
import { PrimaryCta, Kicker } from './redesign/chrome';

interface PauseStats {
  score: number;
  timeLeft: number;
  ammo: number;
}

interface PauseGun {
  name: string;
  fireMode: string;
  maxAmmo: number;
}

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onSettings: () => void;
  stats: PauseStats;
  gun: PauseGun;
  gameMode: string;
}

function formatMode(mode: string): string {
  switch (mode) {
    case 'timeAttack': return 'BLITZ';
    case 'endless':    return 'SURVIVAL';
    case 'targetRush': return 'ASSAULT';
    case 'hardcore':   return 'HARDCORE';
    case 'coop':       return 'CO-OP';
    case 'classic':    return 'STANDARD';
    default:           return mode.toUpperCase();
  }
}

export function PauseOverlay({
  onResume,
  onRestart,
  onMainMenu,
  onSettings,
  stats,
  gun,
  gameMode,
}: PauseOverlayProps) {
  const mins = Math.floor(stats.timeLeft / 60);
  const secs = stats.timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      className="absolute inset-0 z-[200] flex items-center justify-center select-none"
      style={{
        background: 'rgba(0,0,0,0.94)',
        color: TOKENS.textHi,
        fontFamily: TOKENS.fontUi,
        padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="relative w-full overflow-y-auto custom-scrollbar"
        style={{
          maxWidth: 640,
          maxHeight: '90vh',
          background: TOKENS.bg,
          border: `1px solid ${TOKENS.hairlineHi}`,
          padding: '28px 28px 32px',
        }}
      >
        {/* Top-tick accent */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: -1,
            top: -1,
            height: 4,
            width: 96,
            background: TOKENS.orange,
          }}
        />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <Kicker color={TOKENS.orange} size={12}>SYSTEM · PAUSED</Kicker>
            <div
              style={{
                marginTop: 10,
                font: `900 italic clamp(44px, 7vw, 64px)/0.9 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.02em',
                textTransform: 'uppercase',
              }}
            >
              PAUSED.
            </div>
          </div>
          <span
            style={{
              font: `500 11px/1 ${TOKENS.fontMono}`,
              color: TOKENS.textDim,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              marginTop: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: TOKENS.yellow }}>●</span>&nbsp;&nbsp;HOLD
          </span>
        </div>

        {/* RUN SUMMARY — score / mode / time / mag */}
        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          {[
            { l: 'SCORE',  v: stats.score.toLocaleString(), c: TOKENS.textHi, tick: TOKENS.yellow },
            { l: 'TIME',   v: timeStr,                       c: TOKENS.textHi, tick: TOKENS.cyan   },
            { l: 'MODE',   v: formatMode(gameMode),          c: TOKENS.orange, tick: TOKENS.orange },
            { l: 'MAG',    v: `${stats.ammo}/${gun.maxAmmo}`, c: TOKENS.orange, tick: TOKENS.orange },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${TOKENS.hairline}`,
                padding: '12px 14px 14px',
              }}
            >
              <span
                aria-hidden
                style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 32, background: s.tick }}
              />
              <div
                style={{
                  font: `500 11px/1 ${TOKENS.fontMono}`,
                  color: TOKENS.textMute,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  marginTop: 6,
                  font: `700 26px/1 ${TOKENS.fontMono}`,
                  color: s.c,
                  letterSpacing: '.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* WEAPON LINE */}
        <div
          style={{
            marginTop: 8,
            background: TOKENS.bgTranslucent,
            border: `1px solid ${TOKENS.hairline}`,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                font: `500 10px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.28em',
                textTransform: 'uppercase',
              }}
            >
              EQUIPPED
            </div>
            <div
              style={{
                marginTop: 6,
                font: `900 italic 22px/1 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {gun.name}
            </div>
          </div>
          <div
            style={{
              font: `700 11px/1 ${TOKENS.fontMono}`,
              color: TOKENS.cyan,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {gun.fireMode}
          </div>
        </div>

        {/* PRIMARY CTA — single orange Resume */}
        <div style={{ marginTop: 22 }}>
          <PrimaryCta
            label="RESUME"
            sub="CONTINUE MISSION"
            onClick={onResume}
            height={100}
            notch={20}
          />
        </div>

        {/* SECONDARY ACTIONS — restrained ghost rows */}
        <div
          style={{
            marginTop: 8,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          <SecondaryButton label="RESTART" sub="REPLAY" onClick={onRestart} />
          <SecondaryButton label="SETTINGS" sub="CONFIG" onClick={onSettings} />
          <SecondaryButton
            label="EXIT"
            sub="TO MENU"
            onClick={onMainMenu}
            danger
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Compact ghost button — shared shape with the rest of the redesign.
function SecondaryButton({
  label,
  sub,
  onClick,
  danger,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="select-none"
      style={{
        background: 'transparent',
        border: `1px solid ${danger ? TOKENS.magenta + '55' : TOKENS.hairlineHi}`,
        color: danger ? TOKENS.magenta : TOKENS.textHi,
        padding: '14px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        minHeight: 64,
        position: 'relative',
      }}
    >
      <span
        style={{
          font: `900 italic 18px/1 ${TOKENS.fontDisplay}`,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          font: `500 10px/1 ${TOKENS.fontMono}`,
          color: TOKENS.textMute,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
        }}
      >
        {sub}
      </span>
    </button>
  );
}
