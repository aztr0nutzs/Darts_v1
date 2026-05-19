// MAIN MENU — Claude Design board 01.
// Black-first canvas, dominant hero blaster, one orange DEPLOY CTA, restrained
// secondary navigation. NO blue/cyber backgrounds, NO bloom, NO multi-CTA stacks.
// Loadout / Arenas / Multiplayer mount as internal sub-views via NavRow.

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { GameMode, DartType, ArenaMeta } from '../App';
import { GUNS, type GunType } from '../lib/guns';
import type { ArenaId } from './ArenaScene';
import { getBlasterAsset } from '../lib/assetRegistry';
import type {
  MultiplayerConnectionStatus,
  MultiplayerRuntimeConfig,
} from '../lib/runtimeConfig';
import { TOKENS } from '../lib/designTokens';
import { CornerTicks, PrimaryCta, NavRow, Kicker, HazardTape } from './redesign/chrome';
import LoadoutScreen from './redesign/LoadoutScreen';

export interface MainMenuProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  roomId: string;
  setRoomId: (id: string) => void;
  socket: any;
  connectionStatus: MultiplayerConnectionStatus;
  socketUrl: string | null;
  multiplayerConfigSource: MultiplayerRuntimeConfig['source'];
  multiplayerConfigReason?: string;
  roomError: string | null;
  onRetryMultiplayer: () => void;
  setIsMultiplayerWaiting: (b: boolean) => void;
  startGame: (mode: GameMode, arenaId?: ArenaId) => void;
  selectedArenaId: ArenaId;
  selectedArena: ArenaMeta;
  arenas: ArenaMeta[];
  onSelectArena: (arenaId: ArenaId) => void;
  setShowUpgradeMenu: (b: boolean) => void;
  credits: number;
  unlockedGuns: string[];
  currentGun: GunType;
  setCurrentGun: (gun: GunType) => void;
  primaryGunId: string;
  secondaryGunId: string | null;
  setPrimaryGunId: (id: string) => void;
  setSecondaryGunId: (id: string | null) => void;
  buyGun: (gun: GunType) => void;
  unlockedDarts: string[];
  currentDart: DartType;
  setCurrentDart: (dart: DartType) => void;
  buyDart: (dart: DartType) => void;
}

type MenuView = 'main' | 'loadout' | 'arenas' | 'multiplayer';

export default function MainMenu(props: MainMenuProps) {
  const {
    gameMode,
    setGameMode,
    roomId,
    setRoomId,
    socket,
    connectionStatus,
    socketUrl,
    multiplayerConfigSource,
    multiplayerConfigReason,
    roomError,
    onRetryMultiplayer,
    setIsMultiplayerWaiting,
    startGame,
    selectedArenaId,
    selectedArena,
    arenas,
    onSelectArena,
    setShowUpgradeMenu,
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
  } = props;

  const [view, setView] = React.useState<MenuView>('main');
  const [showDeployBriefing, setShowDeployBriefing] = React.useState(false);

  const blasterAsset = React.useMemo(() => getBlasterAsset(currentGun.id), [currentGun.id]);

  const isMultiplayerReady = connectionStatus === 'connected' && Boolean(socket);
  const isMultiplayerConnecting = connectionStatus === 'connecting';
  const multiplayerStatusLabel =
    connectionStatus === 'not_configured'
      ? 'BACKEND URL REQUIRED'
      : connectionStatus === 'connection_failed'
      ? 'BACKEND UNREACHABLE'
      : connectionStatus === 'connected'
      ? 'BACKEND CONNECTED'
      : connectionStatus === 'connecting'
      ? 'CONNECTING TO BACKEND'
      : 'BACKEND DISCONNECTED';
  const multiplayerStatusDetail =
    connectionStatus === 'not_configured'
      ? multiplayerConfigReason ?? 'Set VITE_SOCKET_URL to enable multiplayer in this runtime.'
      : connectionStatus === 'connection_failed'
      ? roomError ?? 'Unable to connect to the configured Socket.IO backend.'
      : connectionStatus === 'connected'
      ? `Socket.IO: ${socketUrl ?? 'same origin'}`
      : connectionStatus === 'connecting'
      ? `Socket.IO: ${socketUrl ?? 'same origin'}`
      : 'The multiplayer socket disconnected. Retry before creating or joining a room.';

  // Game modes shown as compact mono chips on the main menu. Single primary
  // DEPLOY CTA fires whichever mode is currently selected — no per-mode
  // mega-buttons.
  const modes: { id: GameMode; label: string; sub: string }[] = [
    { id: 'classic',    label: 'STANDARD',   sub: '60S PRECISION' },
    { id: 'timeAttack', label: 'BLITZ',      sub: '30S OVERDRIVE' },
    { id: 'endless',    label: 'SURVIVAL',   sub: 'GAUNTLET' },
    { id: 'targetRush', label: 'ASSAULT',    sub: '50 TARGETS' },
    { id: 'hardcore',   label: 'HARDCORE',   sub: '1-HIT KO' },
    { id: 'multiplayer', label: 'CO-OP',      sub: 'ONLINE TEAM' },
  ];
  const currentModeLabel = modes.find((m) => m.id === gameMode)?.label ?? 'STANDARD';

  // ── LOADOUT SUB-VIEW ──────────────────────────────────────────────────
  if (view === 'loadout') {
    return (
      <LoadoutScreen
        credits={credits}
        unlockedGuns={unlockedGuns}
        currentGun={currentGun}
        setCurrentGun={setCurrentGun}
        buyGun={buyGun}
        primaryGunId={primaryGunId}
        secondaryGunId={secondaryGunId}
        setPrimaryGunId={setPrimaryGunId}
        setSecondaryGunId={setSecondaryGunId}
        unlockedDarts={unlockedDarts}
        currentDart={currentDart}
        setCurrentDart={setCurrentDart}
        buyDart={buyDart}
        onBack={() => setView('main')}
        onConfirm={() => setView('main')}
      />
    );
  }

  // ── ARENAS SUB-VIEW (light) ───────────────────────────────────────────
  if (view === 'arenas') {
    return <ArenasPanel onBack={() => setView('main')} arenas={arenas} selectedArenaId={selectedArenaId} onSelectArena={onSelectArena} gameMode={gameMode} />;
  }

  // ── MULTIPLAYER SUB-VIEW ──────────────────────────────────────────────
  if (view === 'multiplayer') {
    return (
      <MultiplayerPanel
        onBack={() => setView('main')}
        roomId={roomId}
        setRoomId={setRoomId}
        statusLabel={multiplayerStatusLabel}
        statusDetail={multiplayerStatusDetail}
        ready={isMultiplayerReady}
        connecting={isMultiplayerConnecting}
        configSource={multiplayerConfigSource}
        onConnect={() => {
          if (!isMultiplayerReady) return;
          if (!roomId) {
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomId(newRoomId);
            socket.emit('join-room', newRoomId);
          } else {
            socket.emit('join-room', roomId);
          }
          setGameMode('multiplayer');
          setIsMultiplayerWaiting(true);
        }}
        onRetry={onRetryMultiplayer}
        showRetry={connectionStatus === 'connection_failed' || connectionStatus === 'disconnected'}
      />
    );
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 overflow-y-auto custom-scrollbar select-none"
      style={{
        background: TOKENS.bg,
        color: TOKENS.textHi,
        fontFamily: TOKENS.fontUi,
      }}
    >
      {/* BG STACK — ghost wordmark + horizon hairline + corner hazard tape */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          style={{
            position: 'absolute',
            left: -20,
            top: '24%',
            font: `900 italic clamp(280px, 60vw, 720px)/0.78 ${TOKENS.fontDisplay}`,
            letterSpacing: '-0.04em',
            color: '#fff',
            opacity: 0.035,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          DARTS
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '58%',
            height: 1,
            background: TOKENS.hairlineHi,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(58% - 5px)',
            width: 120,
            height: 10,
            background: TOKENS.orange,
          }}
        />
        <HazardTape
          width={340}
          height={50}
          rotate={-12}
          style={{ position: 'absolute', left: -30, bottom: -30 }}
        />
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 1080,
          padding: `${Math.min(40, TOKENS.safeTop)}px 24px ${TOKENS.safeBottom}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* TOP BAR */}
        <div
          className="flex justify-between items-center"
          style={{
            font: `500 13px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textMute,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
          }}
        >
          <span>
            <span style={{ color: TOKENS.orange }}>◆</span>&nbsp;&nbsp;DARTS · v2.6
          </span>
          <span>
            PILOT&nbsp;<span style={{ color: TOKENS.textHi }}>K-7 “HALO”</span>
          </span>
        </div>

        {/* TITLE BLOCK */}
        <div style={{ marginTop: 28 }}>
          <Kicker bordered color={TOKENS.orange} size={13}>
            ARCADE COMBAT · S2
          </Kicker>
          <div
            style={{
              marginTop: 22,
              font: `900 italic clamp(120px, 22vw, 240px)/0.82 ${TOKENS.fontDisplay}`,
              letterSpacing: '-0.04em',
              color: TOKENS.textHi,
              textShadow: '0 6px 0 #000',
            }}
          >
            DARTS
          </div>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              font: `500 13px/1 ${TOKENS.fontMono}`,
              color: TOKENS.textMute,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 56, height: 2, background: TOKENS.textHi }} />
            FOAM. FURY. PRECISION.
          </div>
        </div>

        {/* HERO — spec column + dominant blaster + focal frame */}
        <div
          className="relative"
          style={{
            marginTop: 36,
            height: 360,
          }}
        >
          {/* Spec column */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 24,
              width: 200,
              zIndex: 2,
            }}
          >
            <div
              style={{
                font: `500 12px/1 ${TOKENS.fontMono}`,
                color: TOKENS.orange,
                letterSpacing: '.28em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              EQUIPPED · 01
            </div>
            <div
              style={{
                font: `700 italic 36px/0.95 ${TOKENS.fontDisplay}`,
                color: TOKENS.textHi,
                letterSpacing: '.02em',
                textTransform: 'uppercase',
              }}
            >
              {currentGun.name.split(/\s+/)[0]}
              <br />
              {currentGun.name.split(/\s+/).slice(1).join(' ') || ' '}
            </div>
            <div style={{ marginTop: 14, height: 1, background: TOKENS.hairlineHi, width: 120 }} />
            <div
              style={{
                marginTop: 14,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '6px 14px',
                font: `500 12px/1.3 ${TOKENS.fontMono}`,
                color: TOKENS.textMute,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
              }}
            >
              <span>CLASS</span>
              <span style={{ color: TOKENS.textHi }}>{currentGun.aesthetic}</span>
              <span>RPM</span>
              <span style={{ color: TOKENS.textHi }}>{Math.round(60000 / Math.max(60, currentGun.fireRate))}</span>
              <span>MAG</span>
              <span style={{ color: TOKENS.textHi }}>{currentGun.maxAmmo}</span>
              <span>MODE</span>
              <span style={{ color: TOKENS.textHi }}>{currentGun.fireMode.toUpperCase()}</span>
            </div>
          </div>

          {/* Focal frame */}
          <div
            style={{
              position: 'absolute',
              left: 216,
              right: 0,
              top: 20,
              bottom: 20,
              border: `1px solid ${TOKENS.hairline}`,
              pointerEvents: 'none',
            }}
          >
            <CornerTicks color={TOKENS.orange} size={22} />
          </div>

          {/* Blaster — dominant, slight tilt, hard shadow, gentle Y-bob */}
          <motion.img
            key={blasterAsset.id}
            src={blasterAsset.src}
            alt={blasterAsset.label}
            draggable={false}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28 }}
            className="animate-hero-bob"
            style={
              {
                position: 'absolute',
                right: -40,
                top: 0,
                width: 'min(78%, 820px)',
                height: 'auto',
                transform: 'rotate(-6deg)',
                filter: 'drop-shadow(0 24px 0 rgba(0,0,0,0.6))',
                pointerEvents: 'none',
                '--hero-rot': '-6deg',
              } as React.CSSProperties
            }
          />
        </div>

        {/* MODE CHIP ROW — compact, mono. The selected chip drives DEPLOY. */}
        <div
          style={{
            marginTop: 28,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {modes.map((m) => {
            const active = gameMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (m.id === 'multiplayer') {
                    setGameMode('multiplayer');
                    setView('multiplayer');
                    return;
                  }
                  setGameMode(m.id);
                }}
                className="select-none"
                style={{
                  background: active ? 'rgba(255,106,26,0.08)' : 'transparent',
                  border: `1px solid ${active ? TOKENS.orange : TOKENS.hairline}`,
                  color: active ? TOKENS.orange : TOKENS.text,
                  padding: '8px 12px',
                  font: `700 12px/1 ${TOKENS.fontMono}`,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  minWidth: 96,
                }}
              >
                <span>{m.label}</span>
                <span style={{ font: `500 10px/1 ${TOKENS.fontMono}`, color: TOKENS.textMute, letterSpacing: '.18em' }}>
                  {m.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* PRIMARY CTA */}
        <div style={{ marginTop: 24, position: 'relative', zIndex: 2 }}>
          <PrimaryCta
            label="DEPLOY"
            sub={`QUICK PLAY · ${currentModeLabel}`}
            onClick={() => {
              if (gameMode === 'multiplayer') {
                setView('multiplayer');
                return;
              }
              setShowDeployBriefing(true);
            }}
            height={140}
            notch={22}
          />
        </div>

        {/* SECONDARY NAV — index | label | hint | chevron */}
        <div style={{ marginTop: 24, position: 'relative', zIndex: 2 }}>
          <NavRow
            index="02"
            label="LOADOUT"
            hint={`${unlockedGuns.length} BLASTERS · ${unlockedDarts.length} DARTS`}
            onClick={() => setView('loadout')}
          />
          <NavRow
            index="03"
            label="ARENAS"
            hint={`${selectedArena.name} · SOLO SELECT`}
            onClick={() => setView('arenas')}
          />
          <NavRow
            index="04"
            label="MULTIPLAYER"
            hint={
              connectionStatus === 'connected'
                ? 'BACKEND CONNECTED'
                : connectionStatus === 'connecting'
                ? 'CONNECTING…'
                : 'OFFLINE'
            }
            onClick={() => {
              setGameMode('multiplayer');
              setView('multiplayer');
            }}
          />
          <NavRow
            index="05"
            label="UPGRADES"
            hint={`${credits.toLocaleString()} CACHE`}
            onClick={() => setShowUpgradeMenu(true)}
          />
        </div>



        <AnimatePresence>
          {showDeployBriefing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[90] flex items-center justify-center px-4"
              style={{ background: 'rgba(0,0,0,0.84)' }}
            >
              <motion.div
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                style={{ width: 'min(720px, 100%)', background: TOKENS.bgPanelSolid, border: `1px solid ${TOKENS.hairlineHi}`, padding: 20 }}
              >
                <Kicker color={TOKENS.orange} size={12}>MATCH BRIEFING</Kicker>
                <div style={{ marginTop: 12, display: 'grid', gap: 8, font: `600 12px/1.3 ${TOKENS.fontMono}`, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                  <div>ARENA: <span style={{ color: TOKENS.textHi }}>{selectedArena.name}</span></div>
                  <div>MODE: <span style={{ color: TOKENS.textHi }}>{currentModeLabel}</span></div>
                  <div>PRIMARY: <span style={{ color: TOKENS.textHi }}>{currentGun.name}</span></div>
                  <div>DART: <span style={{ color: TOKENS.textHi }}>{currentDart.name}</span></div>
                  <div>BOSS WARNING: <span style={{ color: TOKENS.orange }}>{selectedArena.bossName ?? 'UNKNOWN THREAT'}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="button" onClick={() => setShowDeployBriefing(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${TOKENS.hairlineHi}`, color: TOKENS.text, padding: '12px 14px' }}>CANCEL</button>
                  <button type="button" onClick={() => { setShowDeployBriefing(false); startGame(gameMode, selectedArenaId); }} style={{ flex: 1, background: TOKENS.orange, border: 'none', color: '#111', fontWeight: 800, padding: '12px 14px' }}>START MATCH</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 36,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            font: `500 11px/1 ${TOKENS.fontMono}`,
            color: TOKENS.textDim,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span>BUILD 4A · STABLE</span>
          <span style={{ color: TOKENS.cyan }}>◇ LIVE OPS</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Sub-views ────────────────────────────────────────────────────────────

function MultiplayerPanel({
  onBack,
  roomId,
  setRoomId,
  statusLabel,
  statusDetail,
  ready,
  connecting,
  configSource,
  onConnect,
  onRetry,
  showRetry,
}: {
  onBack: () => void;
  roomId: string;
  setRoomId: (id: string) => void;
  statusLabel: string;
  statusDetail: string;
  ready: boolean;
  connecting: boolean;
  configSource: MultiplayerRuntimeConfig['source'];
  onConnect: () => void;
  onRetry: () => void;
  showRetry: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[55] overflow-y-auto custom-scrollbar select-none"
      style={{ background: TOKENS.bg, color: TOKENS.textHi, fontFamily: TOKENS.fontUi }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1080, padding: `40px 24px 56px`, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            font: `500 13px/1 ${TOKENS.fontMono}`,
            color: TOKENS.text,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            padding: 0,
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ color: TOKENS.textHi, marginRight: 8 }}>‹</span>BACK
        </button>

        <div style={{ marginTop: 28 }}>
          <Kicker color={TOKENS.orange} size={14}>NETWORK · MULTIPLAYER</Kicker>
          <div
            style={{
              marginTop: 14,
              font: `900 italic 76px/0.88 ${TOKENS.fontDisplay}`,
              color: TOKENS.textHi,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
            }}
          >
            JOIN
            <br />
            SQUAD
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            padding: '18px 20px',
            border: `1px solid ${ready ? TOKENS.green : TOKENS.magenta}55`,
            borderLeft: `3px solid ${ready ? TOKENS.green : TOKENS.magenta}`,
            background: TOKENS.bgTranslucent,
          }}
        >
          <div
            style={{
              font: `700 12px/1 ${TOKENS.fontMono}`,
              color: ready ? TOKENS.green : TOKENS.magenta,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
            }}
          >
            {statusLabel}
          </div>
          <div
            style={{
              marginTop: 8,
              font: `500 13px/1.4 ${TOKENS.fontMono}`,
              color: TOKENS.text,
            }}
          >
            {statusDetail}
          </div>
          {configSource === 'same_origin' && (
            <div
              style={{
                marginTop: 6,
                font: `500 11px/1 ${TOKENS.fontMono}`,
                color: TOKENS.textDim,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              Using same-origin web fallback
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 10,
            alignItems: 'stretch',
          }}
        >
          <input
            type="text"
            placeholder="ROOM_KEY"
            disabled={!ready}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            style={{
              background: 'transparent',
              border: `1px solid ${TOKENS.hairlineHi}`,
              color: TOKENS.orange,
              padding: '14px 16px',
              font: `700 18px/1 ${TOKENS.fontMono}`,
              letterSpacing: '.30em',
              textTransform: 'uppercase',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={onConnect}
            disabled={!ready}
            style={{
              background: ready ? TOKENS.orange : TOKENS.bgRaised,
              color: ready ? TOKENS.textOnOrange : TOKENS.textDim,
              border: 'none',
              padding: '0 24px',
              font: `700 14px/1 ${TOKENS.fontMono}`,
              letterSpacing: '.30em',
              textTransform: 'uppercase',
              cursor: ready ? 'pointer' : 'not-allowed',
            }}
          >
            {connecting ? 'SYNCING…' : 'SYNC'}
          </button>
        </div>

        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              marginTop: 12,
              background: 'transparent',
              border: `1px solid ${TOKENS.orange}`,
              color: TOKENS.orange,
              padding: '12px 0',
              font: `700 13px/1 ${TOKENS.fontMono}`,
              letterSpacing: '.30em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            RETRY BACKEND CONNECTION
          </button>
        )}

        <AnimatePresence>
          {/* spacer */}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ArenasPanel({
  onBack,
  arenas,
  selectedArenaId,
  onSelectArena,
  gameMode,
}: {
  onBack: () => void;
  arenas: ArenaMeta[];
  selectedArenaId: ArenaId;
  onSelectArena: (arenaId: ArenaId) => void;
  gameMode: GameMode;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[55] overflow-y-auto custom-scrollbar select-none" style={{ background: TOKENS.bg, color: TOKENS.textHi, fontFamily: TOKENS.fontUi }}>
      <div className="mx-auto" style={{ maxWidth: 1080, padding: `40px 24px 56px`, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', font: `500 13px/1 ${TOKENS.fontMono}`, color: TOKENS.text, letterSpacing: '.22em', textTransform: 'uppercase', padding: 0, alignSelf: 'flex-start' }}>
          <span style={{ color: TOKENS.textHi, marginRight: 8 }}>‹</span>BACK
        </button>
        <div style={{ marginTop: 28 }}>
          <Kicker color={TOKENS.orange} size={14}>ARENAS · 03 LIVE MAPS</Kicker>
          <div style={{ marginTop: 14, font: `900 italic 76px/0.88 ${TOKENS.fontDisplay}`, color: TOKENS.textHi, letterSpacing: '.02em', textTransform: 'uppercase' }}>ARENAS</div>
          <div style={{ marginTop: 10, font: `500 11px/1.4 ${TOKENS.fontMono}`, color: TOKENS.textMute, letterSpacing: '.12em', textTransform: 'uppercase' }}>Arena selection applies to solo modes only.</div>
        </div>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {arenas.map((a) => {
            const selected = selectedArenaId === a.id;
            return (
              <button key={a.id} type="button" onClick={() => onSelectArena(a.id)} style={{ textAlign: 'left', position: 'relative', background: selected ? 'rgba(249,115,22,0.08)' : TOKENS.bgTranslucent, border: `1px solid ${selected ? TOKENS.orange : TOKENS.hairline}`, padding: '18px', cursor: 'pointer' }}>
                <span style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 48, background: selected ? TOKENS.orange : TOKENS.textDim }} />
                <div style={{ font: `500 11px/1 ${TOKENS.fontMono}`, color: TOKENS.textMute, letterSpacing: '.22em', textTransform: 'uppercase' }}>{a.difficultyLabel}</div>
                <div style={{ marginTop: 8, font: `900 italic 24px/1 ${TOKENS.fontDisplay}`, color: TOKENS.textHi, letterSpacing: '.04em', textTransform: 'uppercase' }}>{a.name}</div>
                <div style={{ marginTop: 10, font: `500 10px/1.3 ${TOKENS.fontMono}`, color: TOKENS.text }}>BOSS: {a.bossName ?? 'NONE'} · BIAS: {a.targetBiasSummary}</div>
                <div style={{ marginTop: 10, font: `700 10px/1 ${TOKENS.fontMono}`, color: selected ? TOKENS.orange : TOKENS.textDim, letterSpacing: '.18em', textTransform: 'uppercase' }}>{selected ? 'SELECTED' : 'SELECT'}</div>
              </button>
            );
          })}
          <div style={{ position: 'relative', background: TOKENS.bgTranslucent, border: `1px dashed ${TOKENS.hairline}`, padding: '18px', opacity: 0.7 }}>
            <div style={{ font: `500 11px/1 ${TOKENS.fontMono}`, color: TOKENS.textMute, letterSpacing: '.22em', textTransform: 'uppercase' }}>FUTURE EXPANSION</div>
            <div style={{ marginTop: 8, font: `900 italic 24px/1 ${TOKENS.fontDisplay}`, color: TOKENS.textHi, letterSpacing: '.04em', textTransform: 'uppercase' }}>REACTOR CORE</div>
            <div style={{ marginTop: 10, font: `500 10px/1.3 ${TOKENS.fontMono}`, color: TOKENS.textDim }}>Not a playable arena in the current build.</div>
          </div>
        </div>
        {gameMode === 'multiplayer' && (
          <div style={{ marginTop: 18, font: `500 11px/1.4 ${TOKENS.fontMono}`, color: TOKENS.orange, letterSpacing: '.14em', textTransform: 'uppercase' }}>Multiplayer arena comes from the host/server state.</div>
        )}
      </div>
    </motion.div>
  );
}
