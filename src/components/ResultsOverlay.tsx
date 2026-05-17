// Results / Mission Summary — Claude Design board 04.
// Massive rank moment, restrained stat grid, weapon recall strip, one orange
// primary CTA + one ghost secondary CTA. NO confetti, NO third button,
// NO continuous animation after reveal.

import React from 'react';
import { motion } from 'motion/react';
import type { GameMode } from '../App';
import { TOKENS } from '../lib/designTokens';
import { PrimaryCta, SecondaryCta, Kicker, HazardTape } from './redesign/chrome';
import { GUNS } from '../lib/guns';
import { getBlasterAsset } from '../lib/assetRegistry';

interface ResultsOverlayProps {
  gameState: 'menu' | 'playing' | 'gameover' | 'paused';
  gameMode: GameMode;
  score: number;
  targetsHit: number;
  totalShots: number;
  combo: number;
  maxCombo: number;
  weakPointHits: number;
  shotsFiredPerWeapon: Record<string, number>;
  earnedCredits: number;
  waveReached?: number;
  onRestart: () => void;
  onMenu: () => void;
  multiplayerState?: any;
  socketId?: string;
  isHost?: boolean;
  onRematch?: () => void;
}

function rankFor(score: number, accuracy: number, combo: number): { letter: string; pct: string; victory: boolean } {
  const composite = score * 0.0006 + accuracy * 0.6 + combo * 2;
  if (composite >= 120) return { letter: 'S', pct: 'TOP 4%', victory: true };
  if (composite >= 80) return { letter: 'A', pct: 'TOP 12%', victory: true };
  if (composite >= 50) return { letter: 'B', pct: 'TOP 24%', victory: true };
  if (composite >= 30) return { letter: 'C', pct: 'TOP 38%', victory: true };
  if (composite >= 15) return { letter: 'D', pct: 'TOP 55%', victory: false };
  return { letter: 'E', pct: 'TOP 80%', victory: false };
}

// Tick the score number from 0 → final over `duration` ms with ease-out.
function useScoreTick(final: number, duration = 800): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const ease = 1 - Math.pow(1 - k, 3);
      setV(Math.round(final * ease));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [final, duration]);
  return v;
}

export default function ResultsOverlay({
  gameMode,
  score,
  targetsHit,
  totalShots,
  combo,
  maxCombo,
  weakPointHits,
  shotsFiredPerWeapon,
  earnedCredits,
  waveReached,
  onRestart,
  onMenu,
  multiplayerState,
  socketId,
  onRematch,
}: ResultsOverlayProps) {
  const accuracy = totalShots > 0 ? Math.round((targetsHit / totalShots) * 100) : 0;
  const isMultiplayer = gameMode === 'multiplayer';
  const players = multiplayerState?.players
    ? Object.values(multiplayerState.players).sort((a: any, b: any) => b.score - a.score)
    : [];
  const localPlayerRank = players.findIndex((p: any) => p.id === socketId) + 1;
  const rank = rankFor(score, accuracy, maxCombo);
  const isWinner = isMultiplayer ? localPlayerRank === 1 : rank.victory;
  const tickedScore = useScoreTick(score, 800);

  // Pick the most-used gun id and map to a real GUN entry for the weapon recall strip.
  const favWeaponId = Object.entries(shotsFiredPerWeapon).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favGun = (favWeaponId && Object.values(GUNS).find((g) => g.id === favWeaponId)) || Object.values(GUNS)[0];
  const favAsset = getBlasterAsset(favGun.id);
  const favShots = (favWeaponId && shotsFiredPerWeapon[favWeaponId]) || totalShots;

  const stats: { l: string; v: string; sub: string; c: string }[] = [
    { l: 'ACCURACY', v: `${accuracy}%`, sub: `${targetsHit} / ${totalShots || '—'} HITS`, c: TOKENS.cyan },
    { l: 'CRITS', v: String(weakPointHits), sub: 'WEAK POINTS', c: TOKENS.magenta },
    { l: 'BEST COMBO', v: `×${maxCombo}`, sub: combo >= 8 ? 'UNSTOPPABLE' : 'STREAK', c: TOKENS.yellow },
    {
      l: gameMode === 'endless' ? 'WAVES' : 'TARGETS',
      v: gameMode === 'endless' ? String(waveReached ?? '—') : String(targetsHit),
      sub: gameMode === 'endless' ? 'SURVIVED' : 'NEUTRALIZED',
      c: TOKENS.orange,
    },
    { l: 'SHOTS', v: String(totalShots), sub: 'FIRED', c: TOKENS.textHi },
    { l: 'CACHE', v: `+${earnedCredits.toLocaleString()}`, sub: 'EARNED', c: TOKENS.textHi },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar select-none"
      style={{ background: TOKENS.bg, color: TOKENS.textHi, fontFamily: TOKENS.fontUi }}
    >
      {/* Background watermark rank — sits behind, no glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -80,
          top: 140,
          font: `900 italic clamp(560px, 100vw, 1100px)/0.78 ${TOKENS.fontDisplay}`,
          color: isWinner ? TOKENS.orange : TOKENS.magenta,
          opacity: 0.08,
          letterSpacing: '-0.08em',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {rank.letter}
      </div>

      {/* Diagonal hazard tape — only on victory */}
      {isWinner && (
        <HazardTape
          width={460}
          height={42}
          rotate={-4}
          style={{ position: 'absolute', left: -30, top: 110 }}
        />
      )}

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 1080,
          padding: `40px 24px 56px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            font: `500 12px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textMute,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
          }}
        >
          <span>{(gameMode === 'endless' ? 'SURVIVAL' : gameMode === 'timeAttack' ? 'BLITZ' : gameMode === 'targetRush' ? 'ASSAULT' : 'WAREHOUSE RUSH').toUpperCase()}</span>
          <span>
            <span style={{ color: isWinner ? TOKENS.orange : TOKENS.magenta }}>●</span>&nbsp;&nbsp;
            {isWinner ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </span>
        </div>

        {/* HEADER */}
        <div style={{ marginTop: 24 }}>
          <Kicker color={TOKENS.orange} size={14}>DEBRIEF · RUN</Kicker>
          <div
            style={{
              marginTop: 12,
              font: `900 italic clamp(72px, 14vw, 132px)/0.88 ${TOKENS.fontDisplay}`,
              color: isWinner ? TOKENS.textHi : TOKENS.magenta,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
            }}
          >
            {isWinner ? 'VICTORY.' : 'DOWN.'}
          </div>
        </div>

        {/* RANK + SCORE — hero moment */}
        <div
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          {/* Rank — slam in */}
          <div style={{ position: 'relative' }}>
            <div
              key={`rank-${rank.letter}`}
              className="animate-rank-slam"
              style={{
                font: `900 italic clamp(180px, 32vw, 360px)/0.82 ${TOKENS.fontDisplay}`,
                color: isWinner ? TOKENS.orange : TOKENS.magenta,
                letterSpacing: '-0.05em',
                textShadow: '0 10px 0 #000',
                lineHeight: 0.82,
              }}
            >
              {rank.letter}
            </div>
            <div
              style={{
                marginTop: 6,
                display: 'inline-block',
                padding: '6px 12px',
                background: isWinner ? TOKENS.orange : TOKENS.magenta,
                color: TOKENS.textOnOrange,
                font: `700 14px/1 ${TOKENS.fontMono}`,
                letterSpacing: '.28em',
                textTransform: 'uppercase',
              }}
            >
              RANK · {rank.pct}
            </div>
          </div>

          {/* Score */}
          <div style={{ paddingTop: 18 }}>
            <div
              style={{
                font: `500 13px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.28em',
                textTransform: 'uppercase',
              }}
            >
              FINAL SCORE
            </div>
            <div
              style={{
                marginTop: 14,
                font: `700 clamp(80px, 18vw, 160px)/0.9 ${TOKENS.fontMono}`,
                color: TOKENS.textHi,
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tickedScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* STAT GRID — 3×2 */}
        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.l}
              className="animate-stat-rise"
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${TOKENS.hairline}`,
                padding: '16px 18px 18px',
                animationDelay: `${i * 60 + 420}ms`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: -1,
                  height: 3,
                  width: 38,
                  background: s.c,
                }}
              />
              <div
                style={{
                  font: `500 12px/1 ${TOKENS.fontUi}`,
                  color: TOKENS.textMute,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  marginTop: 10,
                  font: `700 clamp(36px, 6vw, 56px)/1 ${TOKENS.fontMono}`,
                  color: s.c,
                  letterSpacing: '.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  marginTop: 8,
                  font: `500 11px/1 ${TOKENS.fontMono}`,
                  color: TOKENS.textMute,
                  letterSpacing: '.20em',
                  textTransform: 'uppercase',
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* WEAPON RECALL STRIP */}
        <div
          style={{
            position: 'relative',
            marginTop: 28,
            height: 200,
            background: 'rgba(255,255,255,0.015)',
            border: `1px solid ${TOKENS.hairline}`,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: -1,
              height: 3,
              width: 64,
              background: TOKENS.orange,
            }}
          />
          <div style={{ position: 'absolute', left: 24, top: 20, width: '52%' }}>
            <div
              style={{
                font: `500 12px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.28em',
                textTransform: 'uppercase',
              }}
            >
              WEAPON USED
            </div>
            <div
              style={{
                marginTop: 8,
                font: `900 italic 34px/1 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {favGun.name.toUpperCase()}
            </div>
            <div
              style={{
                marginTop: 10,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '4px 12px',
                font: `500 13px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
              }}
            >
              <span>SHOTS</span>
              <span style={{ color: TOKENS.textHi }}>{favShots}</span>
              <span>DARTS</span>
              <span style={{ color: TOKENS.textHi }}>{favGun.dartType.name.toUpperCase()}</span>
              <span>XP</span>
              <span style={{ color: TOKENS.cyan }}>+{Math.round(earnedCredits * 0.7).toLocaleString()}</span>
            </div>
          </div>
          <img
            src={favAsset.src}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              position: 'absolute',
              right: -30,
              top: -10,
              width: '52%',
              maxWidth: 460,
              height: 'auto',
              transform: 'rotate(-4deg)',
              filter: 'drop-shadow(0 14px 0 rgba(0,0,0,0.6))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* REWARDS ROW */}
        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {[
            { l: 'XP', v: `+${Math.round(earnedCredits * 0.7).toLocaleString()}`, c: TOKENS.cyan },
            { l: 'CACHE', v: `+${earnedCredits.toLocaleString()}`, c: TOKENS.yellow },
            { l: 'STREAK', v: isWinner ? '+1 WIN' : 'BROKEN', c: TOKENS.orange },
          ].map((r) => (
            <div
              key={r.l}
              style={{
                background: TOKENS.bgTranslucent,
                border: `1px solid ${TOKENS.hairline}`,
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  font: `500 11px/1 ${TOKENS.fontMono}`,
                  color: TOKENS.textMute,
                  letterSpacing: '.26em',
                  textTransform: 'uppercase',
                }}
              >
                {r.l}
              </div>
              <div
                style={{
                  marginTop: 6,
                  font: `700 26px/1 ${TOKENS.fontMono}`,
                  color: r.c,
                  letterSpacing: '.02em',
                }}
              >
                {r.v}
              </div>
            </div>
          ))}
        </div>

        {/* Squad results (multiplayer only) */}
        {isMultiplayer && players.length > 0 && (
          <div
            style={{
              marginTop: 16,
              background: TOKENS.bgTranslucent,
              border: `1px solid ${TOKENS.hairline}`,
              padding: '14px 18px',
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
                letterSpacing: '.28em',
                textTransform: 'uppercase',
              }}
            >
              SQUAD RESULTS
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {players.map((p: any, i: number) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${TOKENS.hairline}`,
                    font: `700 14px/1 ${TOKENS.fontMono}`,
                    color: p.id === socketId ? TOKENS.textHi : TOKENS.text,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span>
                    #{i + 1}&nbsp;&nbsp;{String(p.id).substring(0, 8)}
                    {p.id === socketId && (
                      <span
                        style={{
                          marginLeft: 8,
                          background: TOKENS.cyan,
                          color: TOKENS.bg,
                          padding: '2px 6px',
                          font: `700 10px/1 ${TOKENS.fontMono}`,
                          letterSpacing: '.18em',
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </span>
                  <span style={{ color: TOKENS.orange }}>{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs — one orange primary, one ghost secondary. NO third button. */}
        <div
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <PrimaryCta
            label={isMultiplayer ? 'REMATCH' : 'NEXT MISSION'}
            sub={isMultiplayer ? 'SAME SQUAD · SAME ARENA' : `RESTART · ${(gameMode === 'endless' ? 'SURVIVAL' : gameMode === 'timeAttack' ? 'BLITZ' : 'STANDARD').toUpperCase()}`}
            onClick={isMultiplayer ? (onRematch ?? onRestart) : onRestart}
            height={120}
            notch={22}
          />
          <SecondaryCta
            label="MENU"
            sub="EXIT TO BASE"
            onClick={onMenu}
            height={120}
            notch={22}
          />
        </div>
      </div>
    </motion.div>
  );
}
