// In-Game HUD — Claude Design board 02.
// Three primary modules (SCORE / TIME / DARTS) at top. Compact objective line.
// Boss dock right, combo stamp left — both only when active. Black-translucent
// panels, hairline borders, top-tick accents. NO blue/cyber chrome, NO glow,
// NO continuously animated gradients.

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pause } from 'lucide-react';
import type { GunType } from '../lib/guns';
import type { DartType } from '../App';
import { TOKENS } from '../lib/designTokens';
import { HudModule } from './redesign/chrome';

interface HUDProps {
  score: number;
  timeLeft: number;
  ammo: number;
  gun: GunType;
  dart: DartType;
  isReloading: boolean;
  combo: number;
  credits: number;
  gameMode: string;
  lives: number;
  targetsHit: number;
  targetGoal: number;
  activeBuffs: { damage: number; rapidFire: number; shield: number };
  wave?: number;
  maxWave?: number;
  waveName?: string;
  targetScore?: number;
  levelName?: string;
  levelNumber?: number;
  targets?: any[];
  warnings?: string[];
  totalShots?: number;
  incomingProjectiles?: any[];
  multiplayerState?: any;
  socketId?: string;
  settings?: any;
  onPause?: () => void;
  onSkill?: (skill: string) => void;
  onReload?: () => void;
}

export default function HUD({
  score,
  timeLeft,
  ammo,
  gun,
  dart,
  isReloading,
  combo,
  gameMode,
  lives,
  targetsHit,
  targetGoal,
  wave = 2,
  maxWave = 3,
  waveName,
  levelName = 'WAREHOUSE RUSH',
  warnings = [],
  totalShots = 0,
  incomingProjectiles = [],
  multiplayerState,
  socketId,
  settings = {},
  onPause,
}: HUDProps) {
  const [, setNow] = useState(Date.now());
  const [pulseWarn, setPulseWarn] = useState(false);
  const prevScoreRef = useRef(score);

  // Score-pulse trigger key — used in animation keyframe via React render.
  const [scoreFlash, setScoreFlash] = useState(0);
  useEffect(() => {
    if (score > prevScoreRef.current) setScoreFlash((n) => n + 1);
    prevScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (warnings.length > 0) {
      setPulseWarn(true);
      const to = setTimeout(() => setPulseWarn(false), 250);
      return () => clearTimeout(to);
    }
  }, [warnings]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const lowTime = timeLeft <= 10;

  const accuracy = totalShots > 0 ? Math.round((targetsHit / totalShots) * 100) : 0;
  const isLowAmmo = ammo > 0 && ammo <= gun.maxAmmo * 0.2;
  const isEmpty = ammo === 0;

  // Reduced-effects mode disables every backdrop-filter blur in this HUD —
  // the three top modules, the objective bar, the multiplayer squad strip,
  // and the weapon callout. The backgrounds stay translucent so the layout
  // is identical; the blur pass is just skipped.
  // Default to crisp panels. Blur can be opt-in via settings.hudBlur=true and
  // is always disabled by reducedEffects.
  const enableBlur = settings.reducedEffects !== true && settings.hudBlur === true;

  const scaleMap: Record<string, string> = {
    small: 'scale-90 origin-top',
    normal: 'scale-100 origin-top',
    large: 'scale-105 origin-top',
  };
  const scaleClass = scaleMap[settings.hudScale] ?? 'scale-100 origin-top';

  const players = multiplayerState?.players
    ? Object.values(multiplayerState.players).sort((a: any, b: any) => b.score - a.score)
    : [];

  const showCombo = combo >= 3;
  const objectiveProgress = targetGoal > 0 ? Math.min(1, targetsHit / targetGoal) : 0;

  // Approximate boss state from warnings/incoming for visual surface only —
  // the canonical boss UI is BossHUD. We just show the compact phase dock.
  const bossActive = (warnings && warnings.some((w) => /boss/i.test(w))) || (incomingProjectiles && incomingProjectiles.length >= 3);

  return (
    <div
      className={`absolute inset-0 z-40 pointer-events-none select-none ${scaleClass} ${pulseWarn ? 'bg-red-500/5' : ''} transition-colors duration-100`}
      style={{
        color: TOKENS.textHi,
        fontFamily: TOKENS.fontUi,
      }}
    >
      {/* ── Dark gradient bands seat HUD chrome over the arena ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 220,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 260,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 100%)',
          }}
        />
      </div>

      {/* ── TOP STATUS BAR ── */}
      <div
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          top: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          font: `500 12px/1 ${TOKENS.fontMono}`,
          color: TOKENS.textMute,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        <span>
          <span style={{ color: TOKENS.orange }}>●</span>&nbsp;&nbsp;LIVE
        </span>
        {wave != null && (
          <span>
            WAVE&nbsp;<span style={{ color: TOKENS.textHi }}>{String(wave).padStart(2, '0')}</span>
            {maxWave ? <> / {String(maxWave).padStart(2, '0')}</> : null}
            {waveName ? (
              <span style={{ color: TOKENS.textDim, marginLeft: 12 }}>
                · {waveName.toUpperCase()}
              </span>
            ) : null}
          </span>
        )}
        <button
          type="button"
          onClick={onPause}
          aria-label="Pause"
          style={{
            background: TOKENS.bgTranslucent,
            border: `1px solid ${TOKENS.hairline}`,
            width: 32,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: TOKENS.textHi,
            pointerEvents: 'auto',
            padding: 0,
          }}
        >
          <Pause className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── PRIMARY HUD ROW: SCORE | TIME | DARTS ── */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: 56,
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.9fr 1.2fr',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          key={`score-${scoreFlash}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1.04, 1] }}
          transition={{ duration: 0.18 }}
        >
          <HudModule
            label="SCORE"
            value={score.toLocaleString()}
            sub={gameMode === 'endless' ? `INTEGRITY ${lives}` : `× ${combo} STREAK`}
            accent={TOKENS.textHi}
            tickColor={TOKENS.yellow}
            valueSize={36}
            enableBlur={enableBlur}
          />
        </motion.div>
        <HudModule
          label="TIME"
          value={timeStr}
          sub={lowTime ? 'CRITICAL' : 'CLOCK'}
          align="center"
          accent={lowTime ? TOKENS.magenta : TOKENS.textHi}
          tickColor={TOKENS.cyan}
          valueSize={36}
          enableBlur={enableBlur}
        />
        <HudModule
          label="DARTS"
          value={`${ammo}/${gun.maxAmmo}`}
          sub={isReloading ? 'RELOADING' : isEmpty ? 'EMPTY' : isLowAmmo ? 'LOW MAG' : (dart?.name?.toUpperCase?.() ?? 'STD FOAM')}
          align="right"
          accent={isEmpty ? TOKENS.magenta : isLowAmmo ? TOKENS.orange : TOKENS.orange}
          tickColor={TOKENS.orange}
          valueSize={36}
          enableBlur={enableBlur}
        />
      </div>

      {/* ── OBJECTIVE LINE ── */}
      {targetGoal > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: 196,
            background: TOKENS.bgTranslucent,
            border: `1px solid ${TOKENS.hairline}`,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            pointerEvents: 'none',
            backdropFilter: enableBlur ? 'blur(6px)' : undefined,
            WebkitBackdropFilter: enableBlur ? 'blur(6px)' : undefined,
          }}
        >
          <span
            style={{
              font: `700 11px/1 ${TOKENS.fontMono}`,
              color: TOKENS.cyan,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
            }}
          >
            OBJ
          </span>
          <span
            style={{
              font: `600 14px/1 ${TOKENS.fontUi}`,
              color: TOKENS.textHi,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            HIT {targetGoal} TARGETS
          </span>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', position: 'relative', margin: '0 4px' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${objectiveProgress * 100}%`,
                background: TOKENS.cyan,
                transition: 'width 180ms ease-out',
              }}
            />
          </div>
          <span
            style={{
              font: `700 14px/1 ${TOKENS.fontMono}`,
              color: TOKENS.textHi,
              letterSpacing: '.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {targetsHit}
            <span style={{ color: TOKENS.textMute }}>/{targetGoal}</span>
          </span>
        </div>
      )}

      {/* ── COMBO STAMP (left rail) — only when combo ≥ 3 ── */}
      <AnimatePresence>
        {showCombo && (
          <motion.div
            key={`combo-${combo}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{
              position: 'absolute',
              left: 16,
              top: 256,
              background: TOKENS.bgTranslucentHi,
              border: `1px solid ${TOKENS.hairline}`,
              padding: '14px 18px',
              minWidth: 160,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                font: `500 11px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.28em',
                textTransform: 'uppercase',
              }}
            >
              COMBO
            </div>
            <div
              style={{
                marginTop: 6,
                font: `900 italic 56px/1 ${TOKENS.fontDisplay}`,
                color: TOKENS.yellow,
                letterSpacing: '.02em',
              }}
            >
              ×{combo}
            </div>
            <div
              style={{
                marginTop: 4,
                font: `700 11px/1 ${TOKENS.fontMono}`,
                color: TOKENS.yellow,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              {combo >= 8 ? 'UNSTOPPABLE' : combo >= 5 ? 'RAMPAGE' : 'STREAK'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOSS DOCK (right rail) — only when active ── */}
      <AnimatePresence>
        {bossActive && (
          <motion.div
            key="boss-dock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              right: 16,
              top: 256,
              width: 220,
              background: TOKENS.bgTranslucentHi,
              border: `1px solid ${TOKENS.magenta}55`,
              borderLeft: `3px solid ${TOKENS.magenta}`,
              padding: '14px 16px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                font: `700 11px/1 ${TOKENS.fontMono}`,
                color: TOKENS.magenta,
                letterSpacing: '.32em',
                textTransform: 'uppercase',
              }}
            >
              BOSS · PHASE {Math.max(1, wave - 1).toString().padStart(2, '0')}
            </div>
            <div
              style={{
                marginTop: 8,
                font: `900 italic 26px/0.95 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}
            >
              {(waveName ?? 'CHAOS GLADIATOR').toUpperCase()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MULTIPLAYER COMPACT SQUAD STRIP ── */}
      {gameMode === 'multiplayer' && players.length > 0 && (
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: 256,
            background: TOKENS.bgTranslucentHi,
            border: `1px solid ${TOKENS.hairline}`,
            padding: '10px 14px',
            minWidth: 200,
            pointerEvents: 'none',
            backdropFilter: enableBlur ? 'blur(6px)' : undefined,
            WebkitBackdropFilter: enableBlur ? 'blur(6px)' : undefined,
          }}
        >
          <span
            aria-hidden
            style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 38, background: TOKENS.cyan }}
          />
          <div
            style={{
              font: `500 11px/1 ${TOKENS.fontMono}`,
              color: TOKENS.cyan,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            SQUAD LINK
          </div>
          {players.slice(0, 3).map((p: any, i: number) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                font: `700 13px/1.5 ${TOKENS.fontMono}`,
                color: p.id === socketId ? TOKENS.textHi : TOKENS.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>
                #{i + 1} {String(p.id).substring(0, 4)}
              </span>
              <span>{p.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── WARNING BANNERS ── */}
      <AnimatePresence>
        {warnings.slice(0, 1).map((msg) => (
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: 244,
              background: 'rgba(0,0,0,0.85)',
              border: `1px solid ${TOKENS.magenta}66`,
              borderLeft: `3px solid ${TOKENS.magenta}`,
              padding: '8px 14px',
              font: `700 12px/1 ${TOKENS.fontMono}`,
              color: TOKENS.magenta,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              pointerEvents: 'none',
            }}
          >
            {msg}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── RETICLE — sharp cross + corner ticks + solid orange dot ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '48%',
          transform: 'translate(-50%, -50%)',
          width: 72,
          height: 72,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.45)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.45)' }} />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 8,
            height: 8,
            background: TOKENS.orange,
          }}
        />
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <div
            key={c}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              ...(c.includes('t') ? { top: 0 } : { bottom: 0 }),
              ...(c.includes('l') ? { left: 0 } : { right: 0 }),
              borderTop: c.includes('t') ? `2px solid ${TOKENS.textHi}` : 'none',
              borderBottom: c.includes('b') ? `2px solid ${TOKENS.textHi}` : 'none',
              borderLeft: c.includes('l') ? `2px solid ${TOKENS.textHi}` : 'none',
              borderRight: c.includes('r') ? `2px solid ${TOKENS.textHi}` : 'none',
            }}
          />
        ))}
      </div>

      {/* ── BOTTOM: WEAPON CALLOUT (left) ── */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 116,
          maxWidth: 320,
          background: TOKENS.bgTranslucentHi,
          border: `1px solid ${TOKENS.hairline}`,
          padding: '12px 16px',
          pointerEvents: 'none',
          backdropFilter: enableBlur ? 'blur(6px)' : undefined,
          WebkitBackdropFilter: enableBlur ? 'blur(6px)' : undefined,
        }}
      >
        <span
          aria-hidden
          style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 56, background: TOKENS.orange }}
        />
        <div
          style={{
            font: `500 11px/1 ${TOKENS.fontMono}`,
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
            font: `900 italic 26px/1 ${TOKENS.fontDisplay}`,
            color: TOKENS.textHi,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {gun.name.toUpperCase()}
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            gap: 14,
            font: `500 12px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textMute,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
          }}
        >
          <span>
            ACC&nbsp;<span style={{ color: TOKENS.textHi }}>{accuracy}%</span>
          </span>
          <span>
            HIT&nbsp;<span style={{ color: TOKENS.textHi }}>{targetsHit}</span>
          </span>
          <span style={{ color: TOKENS.textMute }}>
            {levelName.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
