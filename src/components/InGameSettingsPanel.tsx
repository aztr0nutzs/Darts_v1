// In-Game Settings Panel — Claude Design board (tactical panel).
// Black-first sectioned settings overlay. Hairline borders, segmented toggle
// rows, top-tick section accents. No glowing cyan shells, no rounded dialog
// chrome, no fake "system override" energy. Matches PauseOverlay / Results.

import React from 'react';
import { motion } from 'motion/react';
import { TOKENS } from '../lib/designTokens';
import { PrimaryCta, Kicker } from './redesign/chrome';

interface SettingsShape {
  leftHanded?: boolean;
  controlScale?: number;
  showFireButton?: boolean;
  crosshairStyle?: string;
  hitMarkers?: boolean;
  screenEffects?: boolean;
  soundVolume?: number;
  hapticsEnabled?: boolean;
  hudScale?: string;
}

interface InGameSettingsPanelProps {
  settings: SettingsShape;
  setSettings: (updater: (prev: SettingsShape) => SettingsShape) => void;
  onClose: () => void;
}

export function InGameSettingsPanel({ settings, setSettings, onClose }: InGameSettingsPanelProps) {
  const updateSetting = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      className="absolute inset-0 z-[250] flex items-center justify-center select-none"
      style={{
        background: 'rgba(0,0,0,0.96)',
        color: TOKENS.textHi,
        fontFamily: TOKENS.fontUi,
        padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 720,
          maxHeight: '90vh',
          background: TOKENS.bg,
          border: `1px solid ${TOKENS.hairlineHi}`,
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: -1,
            top: -1,
            height: 4,
            width: 96,
            background: TOKENS.cyan,
            zIndex: 1,
          }}
        />

        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 24px 18px',
            borderBottom: `1px solid ${TOKENS.hairline}`,
            gap: 12,
          }}
        >
          <div>
            <Kicker color={TOKENS.cyan} size={12}>SYSTEM · CONFIG</Kicker>
            <div
              style={{
                marginTop: 8,
                font: `900 italic clamp(32px, 5vw, 44px)/0.9 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.02em',
                textTransform: 'uppercase',
              }}
            >
              SETTINGS
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: 'transparent',
              border: `1px solid ${TOKENS.hairlineHi}`,
              color: TOKENS.textHi,
              width: 40,
              height: 40,
              cursor: 'pointer',
              font: `700 18px/1 ${TOKENS.fontMono}`,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY — scrollable section stack */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}
        >
          <Section label="CONTROLS" code="01" accent={TOKENS.orange}>
            <SegmentRow
              label="HANDEDNESS"
              hint="Flips on-screen control side"
              options={[
                { v: false, label: 'RIGHT' },
                { v: true,  label: 'LEFT'  },
              ]}
              value={Boolean(settings.leftHanded)}
              onChange={(v) => updateSetting('leftHanded', v)}
            />
            <SegmentRow
              label="CONTROL SIZE"
              hint="Scales touch buttons"
              options={[
                { v: 0.85, label: 'S' },
                { v: 1.0,  label: 'M' },
                { v: 1.15, label: 'L' },
              ]}
              value={settings.controlScale ?? 1.0}
              onChange={(v) => updateSetting('controlScale', v)}
            />
            <SegmentRow
              label="FIRE BUTTON"
              hint="Dedicated fire control"
              options={[
                { v: false, label: 'HIDE' },
                { v: true,  label: 'SHOW' },
              ]}
              value={Boolean(settings.showFireButton)}
              onChange={(v) => updateSetting('showFireButton', v)}
              activeColor={TOKENS.orange}
            />
          </Section>

          <Section label="HUD" code="02" accent={TOKENS.cyan}>
            <SegmentRow
              label="CROSSHAIR"
              hint="Reticle profile"
              options={[
                { v: 'tactical', label: 'TACTICAL' },
                { v: 'dot',      label: 'DOT'      },
              ]}
              value={settings.crosshairStyle ?? 'tactical'}
              onChange={(v) => updateSetting('crosshairStyle', v)}
            />
            <SegmentRow
              label="HIT MARKERS"
              hint="Visual feedback on hits"
              options={[
                { v: false, label: 'OFF' },
                { v: true,  label: 'ON'  },
              ]}
              value={Boolean(settings.hitMarkers)}
              onChange={(v) => updateSetting('hitMarkers', v)}
            />
            <SegmentRow
              label="SCREEN EFFECTS"
              hint="Flash, shake, lens"
              options={[
                { v: false, label: 'OFF' },
                { v: true,  label: 'ON'  },
              ]}
              value={settings.screenEffects !== false}
              onChange={(v) => updateSetting('screenEffects', v)}
            />
          </Section>

          <Section label="AUDIO · HAPTICS" code="03" accent={TOKENS.yellow}>
            <SegmentRow
              label="SOUND VOLUME"
              hint="Master SFX level"
              options={[
                { v: 0,    label: 'OFF' },
                { v: 0.35, label: 'LOW' },
                { v: 0.7,  label: 'MED' },
                { v: 1.0,  label: 'MAX' },
              ]}
              value={settings.soundVolume ?? 0.7}
              onChange={(v) => updateSetting('soundVolume', v)}
              activeColor={TOKENS.yellow}
            />
            <SegmentRow
              label="HAPTICS"
              hint="Vibration on fire, hit, reload"
              options={[
                { v: false, label: 'OFF' },
                { v: true,  label: 'ON'  },
              ]}
              value={settings.hapticsEnabled !== false}
              onChange={(v) => updateSetting('hapticsEnabled', v)}
              activeColor={TOKENS.yellow}
            />
          </Section>

          <Section label="PERFORMANCE" code="04" accent={TOKENS.magenta}>
            <SegmentRow
              label="HUD SCALE"
              hint="HUD module size"
              options={[
                { v: 'small',  label: 'SMALL'  },
                { v: 'normal', label: 'NORMAL' },
                { v: 'large',  label: 'LARGE'  },
              ]}
              value={settings.hudScale ?? 'normal'}
              onChange={(v) => updateSetting('hudScale', v)}
            />
          </Section>
        </div>

        {/* FOOTER CTA */}
        <div
          style={{
            padding: '16px 24px 24px',
            borderTop: `1px solid ${TOKENS.hairline}`,
            background: TOKENS.bg,
          }}
        >
          <PrimaryCta
            label="APPLY"
            sub="SAVE & CLOSE"
            onClick={onClose}
            height={92}
            notch={18}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
function Section({
  label,
  code,
  accent,
  children,
}: {
  label: string;
  code: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: `1px solid ${TOKENS.hairline}`,
        }}
      >
        <span
          style={{
            font: `700 12px/1 ${TOKENS.fontMono}`,
            color: accent,
            letterSpacing: '.28em',
          }}
        >
          {code}
        </span>
        <span
          style={{
            font: `700 12px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textHi,
            letterSpacing: '.28em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span style={{ flex: 1, height: 1, background: TOKENS.hairline }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

// ── SegmentRow ─────────────────────────────────────────────────────────────
// Label + hint on the left, hard-edged segmented selector on the right.
// Stacks below the label on narrow screens for mobile usability.
function SegmentRow<T>({
  label,
  hint,
  options,
  value,
  onChange,
  activeColor = TOKENS.cyan,
}: {
  label: string;
  hint?: string;
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  activeColor?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${TOKENS.hairline}`,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 140, flex: '1 1 160px' }}>
        <div
          style={{
            font: `700 13px/1 ${TOKENS.fontUi}`,
            color: TOKENS.textHi,
            letterSpacing: '.04em',
          }}
        >
          {label}
        </div>
        {hint && (
          <div
            style={{
              marginTop: 4,
              font: `500 11px/1.2 ${TOKENS.fontMono}`,
              color: TOKENS.textMute,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
            }}
          >
            {hint}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'inline-flex',
          border: `1px solid ${TOKENS.hairlineHi}`,
        }}
      >
        {options.map((opt, i) => {
          const active = opt.v === value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt.v)}
              style={{
                background: active ? activeColor : 'transparent',
                color: active ? TOKENS.textOnOrange : TOKENS.text,
                border: 'none',
                borderLeft: i === 0 ? 'none' : `1px solid ${TOKENS.hairlineHi}`,
                padding: '10px 14px',
                font: `700 12px/1 ${TOKENS.fontMono}`,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                minWidth: 48,
                minHeight: 40,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
