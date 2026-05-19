// Loadout / Blaster Select — Claude Design board 03.
// Hero blaster dominates. Restrained 4-stat strip. Roster as 3-col grid.
// Premium weapon vault, one blaster owns the screen at a time.

import React from 'react';
import { motion } from 'motion/react';
import { TOKENS } from '../../lib/designTokens';
import { CornerTicks, PrimaryCta, Kicker } from './chrome';
import { GUNS, type GunType } from '../../lib/guns';
import { getBlasterAsset } from '../../lib/assetRegistry';
import type { DartType } from '../../App';
import { DART_TYPES } from '../../App';

type Stat = { l: string; v: string; sub?: string; bar: number; c: string };

// Derive 4 marketing-style bars from gun spec. Pure UI — does not affect game.
function statsFor(gun: GunType): Stat[] {
  const damage = gun.dartType.damage;
  const damageBar = Math.min(1, damage / 50);
  const fireRpm = Math.round(60000 / Math.max(60, gun.fireRate));
  const fireBar = Math.min(1, fireRpm / 800);
  const range = Math.round(18 + gun.accuracy * 24);
  const rangeBar = Math.min(1, range / 42);
  const capBar = Math.min(1, gun.maxAmmo / 50);
  return [
    { l: 'DAMAGE',    v: String(damage),  bar: damageBar, c: TOKENS.orange },
    { l: 'FIRE RATE', v: String(fireRpm), sub: 'RPM', bar: fireBar,  c: TOKENS.yellow },
    { l: 'RANGE',     v: String(range),   sub: 'M',   bar: rangeBar, c: TOKENS.cyan },
    { l: 'CAPACITY',  v: String(gun.maxAmmo), sub: `/${gun.maxAmmo * 4}`, bar: capBar, c: TOKENS.textHi },
  ];
}

function tierLabel(cost: number): string {
  if (cost === 0) return 'I';
  if (cost < 3000) return 'II';
  if (cost < 12000) return 'III';
  return 'IV';
}

export interface LoadoutScreenProps {
  credits: number;
  unlockedGuns: string[];
  currentGun: GunType;
  setCurrentGun: (g: GunType) => void;
  primaryGunId: string;
  secondaryGunId: string | null;
  setPrimaryGunId: (id: string) => void;
  setSecondaryGunId: (id: string | null) => void;
  buyGun: (g: GunType) => void;
  unlockedDarts: string[];
  currentDart: DartType;
  setCurrentDart: (d: DartType) => void;
  buyDart: (d: DartType) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export default function LoadoutScreen({
  credits,
  unlockedGuns,
  currentGun,
  setCurrentGun,
  primaryGunId,
  secondaryGunId,
  setPrimaryGunId,
  setSecondaryGunId,
  buyGun,
  unlockedDarts,
  currentDart,
  setCurrentDart,
  buyDart,
  onBack,
  onConfirm,
}: LoadoutScreenProps) {
  const blasterAsset = React.useMemo(() => getBlasterAsset(currentGun.id), [currentGun.id]);
  const stats = React.useMemo(() => statsFor(currentGun), [currentGun]);
  const roster = React.useMemo(() => Object.values(GUNS).slice(0, 6), []);
  const [page, setPage] = React.useState(0);
  const pageSize = 6;
  const allGuns = React.useMemo(() => Object.values(GUNS), []);
  const pageCount = Math.max(1, Math.ceil(allGuns.length / pageSize));
  const visible = allGuns.slice(page * pageSize, page * pageSize + pageSize);
  void roster;

  const nameParts = currentGun.name.toUpperCase().split(/\s+/);
  const line1 = nameParts.slice(0, 1).join(' ');
  const line2 = nameParts.slice(1).join(' ') || ' ';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-[55] overflow-y-auto custom-scrollbar select-none"
      style={{ background: TOKENS.bg, color: TOKENS.textHi, fontFamily: TOKENS.fontUi }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 1080, minHeight: '100vh', padding: `40px ${Math.min(40, TOKENS.pad)}px 56px` }}
      >
        {/* Ghost mega-numeral background */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -20,
            top: 360,
            font: `900 italic 720px/0.78 ${TOKENS.fontDisplay}`,
            color: '#fff',
            opacity: 0.035,
            letterSpacing: '-0.05em',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          01
        </div>

        {/* Horizon hairline + orange tick */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 1,
            background: TOKENS.hairlineHi,
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(50% - 4px)',
            width: 120,
            height: 8,
            background: TOKENS.orange,
            pointerEvents: 'none',
          }}
        />

        {/* TOP BAR */}
        <div
          className="relative flex justify-between items-center"
          style={{
            font: `500 13px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textMute,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              color: TOKENS.text,
              letterSpacing: 'inherit',
              textTransform: 'inherit',
              padding: 0,
            }}
          >
            <span style={{ color: TOKENS.textHi, marginRight: 8 }}>‹</span>BACK
          </button>
          <span>LOADOUT · PRIMARY / SECONDARY</span>
          <span style={{ color: TOKENS.cyan }}>◇ CACHE {credits.toLocaleString()}</span>
        </div>

        {/* HEADER — slot kicker + 2-line name + tier badge */}
        <div className="relative mt-8 flex justify-between items-end">
          <div>
            <div
              style={{
                font: `700 16px/1 ${TOKENS.fontMono}`,
                color: TOKENS.orange,
                letterSpacing: '.30em',
                textTransform: 'uppercase',
              }}
            >
              SLOT · 01 — PRIMARY
            </div>
            <div
              style={{
                marginTop: 14,
                font: `900 italic 76px/0.88 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.02em',
                textTransform: 'uppercase',
              }}
            >
              {line1}
              <br />
              {line2}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2" style={{ paddingBottom: 8 }}>
            <Kicker bordered color={TOKENS.orange} size={14}>
              TIER · {tierLabel(currentGun.unlockCost)}
            </Kicker>
            <span
              style={{
                font: `500 12px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              {currentGun.aesthetic.toUpperCase()} · STD ISSUE
            </span>
          </div>
        </div>

        {/* HERO BLASTER — dominant, slight tilt, hard shadow, corner ticks */}
        <div
          className="relative"
          style={{ marginTop: 24, marginLeft: -24, marginRight: -24, height: 360 }}
        >
          {/* Caliper rail */}
          <div style={{ position: 'absolute', left: 24, top: 40, bottom: 40, width: 64 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: TOKENS.hairlineHi }} />
            {[0, 25, 50, 75, 100].map((p, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: `${p}%`,
                  width: 18,
                  height: 1,
                  background: i === 2 ? TOKENS.orange : TOKENS.hairlineHi,
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                left: 28,
                top: '46%',
                font: `700 12px/1 ${TOKENS.fontMono}`,
                color: TOKENS.orange,
                letterSpacing: '.18em',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                whiteSpace: 'nowrap',
              }}
            >
              RANGE · {18 + Math.round(currentGun.accuracy * 24)}M
            </div>
          </div>

          {/* Focal box + corner ticks */}
          <div style={{ position: 'absolute', left: 96, right: 24, top: 30, bottom: 30, pointerEvents: 'none' }}>
            <CornerTicks color={TOKENS.orange} size={26} />
          </div>

          {/* Blaster */}
          <motion.img
            key={blasterAsset.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            src={blasterAsset.src}
            alt={blasterAsset.label}
            draggable={false}
            style={
              {
                position: 'absolute',
                left: '50%',
                top: 30,
                width: '92%',
                maxWidth: 900,
                height: 'auto',
                transform: 'translateX(-50%) rotate(-4deg)',
                filter: 'drop-shadow(0 22px 0 rgba(0,0,0,0.65))',
                pointerEvents: 'none',
                '--hero-rot': '-4deg',
              } as React.CSSProperties
            }
          />
        </div>

        {/* STATS STRIP — 4 columns */}
        <div className="relative" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {stats.map((s) => (
            <div
              key={s.l}
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${TOKENS.hairline}`,
                padding: '14px 14px 16px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: -1,
                  height: 3,
                  width: 32,
                  background: s.c,
                }}
              />
              <div
                style={{
                  font: `500 11px/1 ${TOKENS.fontUi}`,
                  color: TOKENS.textMute,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                }}
              >
                {s.l}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    font: `700 30px/1 ${TOKENS.fontMono}`,
                    color: TOKENS.textHi,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.v}
                </span>
                {s.sub && (
                  <span
                    style={{
                      font: `500 12px/1 ${TOKENS.fontMono}`,
                      color: TOKENS.textMute,
                      letterSpacing: '.12em',
                    }}
                  >
                    {s.sub}
                  </span>
                )}
              </div>
              <div
                style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.06)', position: 'relative' }}
              >
                <div style={{ position: 'absolute', inset: 0, width: `${s.bar * 100}%`, background: s.c }} />
              </div>
            </div>
          ))}
        </div>

        {/* ROSTER — 3 columns × 2 rows. Active = orange border + top tick. */}
        <div className="relative" style={{ marginTop: 28 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
              font: `500 13px/1 ${TOKENS.fontMono}`,
              color: TOKENS.textMute,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
            }}
          >
            <span>ROSTER · {Math.min(allGuns.length, (page + 1) * pageSize)} / {allGuns.length}</span>
            <span style={{ display: 'inline-flex', gap: 18, color: TOKENS.textHi }}>
              <button
                type="button"
                onClick={() => setPage((p) => (p - 1 + pageCount) % pageCount)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label="Previous roster page"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p + 1) % pageCount)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label="Next roster page"
              >
                ›
              </button>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {visible.map((g) => {
              const isUnlocked = unlockedGuns.includes(g.id);
              const isActive = currentGun.id === g.id;
              const isPrimary = primaryGunId === g.id;
              const isSecondary = secondaryGunId === g.id;
              const asset = getBlasterAsset(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => (isUnlocked ? setCurrentGun(g) : buyGun(g))}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isUnlocked) return;
                    if (primaryGunId !== g.id) {
                      setPrimaryGunId(g.id);
                      setCurrentGun(g);
                      if (secondaryGunId === g.id) setSecondaryGunId(null);
                      return;
                    }
                    if (secondaryGunId === g.id) {
                      setSecondaryGunId(null);
                    } else {
                      setSecondaryGunId(g.id);
                    }
                  }}
                  className="select-none"
                  style={{
                    position: 'relative',
                    background: isActive ? 'rgba(255,106,26,0.06)' : 'rgba(255,255,255,0.015)',
                    border: isActive ? `1.5px solid ${TOKENS.orange}` : `1px solid ${TOKENS.hairline}`,
                    padding: '12px 12px 10px',
                    height: 160,
                    opacity: isUnlocked ? 1 : 0.45,
                    cursor: 'pointer',
                    textAlign: 'left',
                    overflow: 'hidden',
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: -1,
                        top: -1,
                        height: 3,
                        width: 38,
                        background: TOKENS.orange,
                      }}
                    />
                  )}
                  <img
                    src={asset.src}
                    alt=""
                    aria-hidden
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 16,
                      margin: '0 auto',
                      width: '88%',
                      height: 78,
                      objectFit: 'contain',
                      filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.6)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 12,
                      right: 12,
                      bottom: 10,
                      font: `700 italic 12px/1.2 ${TOKENS.fontDisplay}`,
                      color: isActive ? TOKENS.textHi : TOKENS.text,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.name}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        font: `500 10px/1 ${TOKENS.fontMono}`,
                        color: isActive ? TOKENS.orange : TOKENS.textDim,
                        letterSpacing: '.22em',
                      }}
                    >
                      {isUnlocked ? `${isPrimary ? 'P ' : ''}${isSecondary ? 'S ' : ''}${g.archetype.toUpperCase()}` : `◇ ${g.unlockCost.toLocaleString()}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECONDARY SLOTS — Dart Type (only one in scope, but matches design 2-col layout) */}
        <div
          className="relative"
          style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          {/* Secondary Blaster — surface current dart's color/name for visual parity */}
          <div
            style={{
              position: 'relative',
              background: TOKENS.bgTranslucent,
              border: `1px solid ${TOKENS.hairline}`,
              padding: '14px 16px',
            }}
          >
            <span style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 32, background: TOKENS.cyan }} />
            <div
              style={{
                font: `500 11px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              SLOT · 02 SECONDARY
            </div>
            <div
              style={{
                marginTop: 6,
                font: `900 italic 22px/1 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}
            >
{secondaryGunId ? (Object.values(GUNS).find((g) => g.id === secondaryGunId)?.name ?? 'UNRESOLVED') : 'EMPTY SLOT'}
            </div>
            <div
              style={{
                marginTop: 4,
                font: `500 11px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
              }}
            >
{secondaryGunId ? 'EQUIPPED FOR SWAP' : 'LONG-PRESS A BLASTER CARD TO ASSIGN'}
            </div>
          </div>

          {/* Dart Type — picker right here, not a modal */}
          <div
            style={{
              position: 'relative',
              background: TOKENS.bgTranslucent,
              border: `1px solid ${TOKENS.hairline}`,
              padding: '14px 16px',
            }}
          >
            <span style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 32, background: TOKENS.cyan }} />
            <div
              style={{
                font: `500 11px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              SLOT · 03 DART TYPE
            </div>
            <div
              style={{
                marginTop: 6,
                font: `900 italic 22px/1 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}
            >
              {currentDart.name.replace(/_/g, ' ')}
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              {Object.values(DART_TYPES).map((d) => {
                const isUnlocked = unlockedDarts.includes(d.id);
                const isActive = currentDart.id === d.id;
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => (isUnlocked ? setCurrentDart(d) : buyDart(d))}
                    aria-label={d.name}
                    style={{
                      width: 22,
                      height: 22,
                      background: isActive ? d.color : 'transparent',
                      border: `1px solid ${isActive ? d.color : TOKENS.hairlineHi}`,
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      opacity: isUnlocked ? 1 : 0.4,
                      padding: 0,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="relative" style={{ marginTop: 28, marginBottom: 8 }}>
          <PrimaryCta
            label="EQUIP"
            sub={`CONFIRM LOADOUT · P:${(Object.values(GUNS).find((g) => g.id === primaryGunId)?.name ?? currentGun.name).toUpperCase()}${secondaryGunId ? ` · S:${(Object.values(GUNS).find((g) => g.id === secondaryGunId)?.name ?? 'NONE').toUpperCase()}` : ' · S:EMPTY'}`}
            onClick={onConfirm}
            height={120}
            notch={22}
          />
        </div>
      </div>
    </motion.div>
  );
}
