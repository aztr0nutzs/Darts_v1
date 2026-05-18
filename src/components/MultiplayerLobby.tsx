// Multiplayer Lobby — Claude Design board (squad bay).
// Black-first lobby with hairline structure, top-tick accents, and meaningful
// status color. Green = connected/ready, yellow = pending, magenta = failure.
// No blue/cyan animated backdrop, no glowing pills, no glassy dialog energy.

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Socket } from 'socket.io-client';
import type { MultiplayerConnectionStatus } from '../lib/runtimeConfig';
import { TOKENS } from '../lib/designTokens';
import { PrimaryCta, Kicker } from './redesign/chrome';

interface MultiplayerLobbyProps {
  roomId: string;
  multiplayerState: any;
  socket: Socket | null;
  connectionStatus: MultiplayerConnectionStatus;
  roomError: string | null;
  socketUrl: string | null;
  onRetry: () => void;
  onLeave: () => void;
  onReady: () => void;
}

interface LobbyPlayer {
  id: string;
  ready?: boolean;
}

export default function MultiplayerLobby({
  roomId,
  multiplayerState,
  socket,
  connectionStatus,
  roomError,
  socketUrl,
  onRetry,
  onLeave,
  onReady,
}: MultiplayerLobbyProps) {
  const players: LobbyPlayer[] = multiplayerState?.players
    ? (Object.values(multiplayerState.players) as LobbyPlayer[])
    : [];
  const localPlayer = players.find((p) => p.id === socket?.id);
  const isHost = players.length > 0 && players[0].id === socket?.id;
  const isConnected = connectionStatus === 'connected' && Boolean(socket);
  const isConnecting = connectionStatus === 'connecting';
  const isFailed = connectionStatus === 'connection_failed';
  const isUnavailable = connectionStatus === 'not_configured';

  const statusColor = isConnected
    ? TOKENS.green
    : isConnecting
    ? TOKENS.yellow
    : isFailed || isUnavailable
    ? TOKENS.magenta
    : TOKENS.textMute;

  const statusLabel = isUnavailable
    ? 'BACKEND UNAVAILABLE'
    : isFailed
    ? 'BACKEND FAILED'
    : isConnected
    ? 'BACKEND LINKED'
    : isConnecting
    ? 'LINKING…'
    : 'DISCONNECTED';

  const readyCount = players.filter((p) => p.ready).length;
  const totalSlots = 4;

  const copyRoomCode = () => {
    navigator.clipboard?.writeText(roomId).catch(() => {});
  };

  const canReady = isConnected && !localPlayer?.ready;
  const readyLabel = !isConnected
    ? 'BACKEND OFFLINE'
    : localPlayer?.ready
    ? 'READY · STANDBY'
    : 'CONFIRM READY';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar select-none"
      style={{
        background: TOKENS.bg,
        color: TOKENS.textHi,
        fontFamily: TOKENS.fontUi,
      }}
    >
      {/* BG STACK — ghost wordmark + horizon hairline, no animation */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          style={{
            position: 'absolute',
            left: -20,
            top: '32%',
            font: `900 italic clamp(220px, 48vw, 560px)/0.78 ${TOKENS.fontDisplay}`,
            letterSpacing: '-0.04em',
            color: '#fff',
            opacity: 0.035,
            whiteSpace: 'nowrap',
          }}
        >
          SQUAD
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '62%',
            height: 1,
            background: TOKENS.hairlineHi,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(62% - 4px)',
            width: 96,
            height: 8,
            background: TOKENS.orange,
          }}
        />
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: 1080,
          padding: '40px 24px 56px',
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
          <button
            type="button"
            onClick={onLeave}
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
            <span style={{ color: TOKENS.textHi, marginRight: 8 }}>‹</span>DISCONNECT
          </button>
          <span>NETWORK · LOBBY</span>
          <span style={{ color: statusColor }}>● {statusLabel}</span>
        </div>

        {/* HEADER */}
        <div style={{ marginTop: 26 }}>
          <Kicker color={TOKENS.orange} size={14}>SQUAD BAY · ROOM</Kicker>
          <div
            style={{
              marginTop: 12,
              font: `900 italic clamp(64px, 12vw, 116px)/0.88 ${TOKENS.fontDisplay}`,
              color: TOKENS.textHi,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
            }}
          >
            LOBBY.
          </div>
        </div>

        {/* MAIN GRID — room/status (left) + roster (right) */}
        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
            gap: 12,
          }}
          className="lobby-grid"
        >
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Room Code panel */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${TOKENS.hairline}`,
                padding: '20px 22px',
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
                ROOM CODE
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    font: `900 italic clamp(36px, 6vw, 48px)/1 ${TOKENS.fontDisplay}`,
                    color: TOKENS.orange,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {roomId || '——————'}
                </span>
                <button
                  type="button"
                  onClick={copyRoomCode}
                  disabled={!roomId}
                  aria-label="Copy room code"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${TOKENS.hairlineHi}`,
                    color: TOKENS.cyan,
                    padding: '8px 12px',
                    font: `700 11px/1 ${TOKENS.fontMono}`,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    cursor: roomId ? 'pointer' : 'not-allowed',
                    opacity: roomId ? 1 : 0.4,
                  }}
                >
                  COPY
                </button>
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '6px 14px',
                  font: `500 12px/1.4 ${TOKENS.fontMono}`,
                  color: TOKENS.textMute,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                }}
              >
                <span>HOST</span>
                <span style={{ color: TOKENS.textHi }}>{isHost ? 'YOU' : players[0]?.id?.substring(0, 8) || 'PENDING'}</span>
                <span>SLOTS</span>
                <span style={{ color: TOKENS.textHi }}>{players.length} / {totalSlots}</span>
                <span>READY</span>
                <span style={{ color: TOKENS.textHi }}>{readyCount} / {players.length || 0}</span>
              </div>
            </div>

            {/* Connection status panel */}
            <div
              style={{
                position: 'relative',
                background: TOKENS.bgTranslucent,
                border: `1px solid ${statusColor}55`,
                borderLeft: `3px solid ${statusColor}`,
                padding: '14px 18px',
              }}
            >
              <div
                style={{
                  font: `700 11px/1 ${TOKENS.fontMono}`,
                  color: statusColor,
                  letterSpacing: '.28em',
                  textTransform: 'uppercase',
                }}
              >
                {statusLabel}
              </div>
              <div
                style={{
                  marginTop: 8,
                  font: `500 12px/1.4 ${TOKENS.fontMono}`,
                  color: TOKENS.text,
                  wordBreak: 'break-all',
                }}
              >
                {socketUrl ?? 'Socket URL not configured'}
              </div>
              {roomError && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '8px 10px',
                    border: `1px solid ${TOKENS.magenta}55`,
                    borderLeft: `3px solid ${TOKENS.magenta}`,
                    background: 'rgba(0,0,0,0.4)',
                    font: `700 11px/1.4 ${TOKENS.fontMono}`,
                    color: TOKENS.magenta,
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                  }}
                >
                  ERR · {roomError}
                </div>
              )}
              {!isConnected && !isUnavailable && (
                <button
                  type="button"
                  onClick={onRetry}
                  style={{
                    marginTop: 12,
                    background: 'transparent',
                    border: `1px solid ${TOKENS.yellow}`,
                    color: TOKENS.yellow,
                    padding: '10px 14px',
                    font: `700 11px/1 ${TOKENS.fontMono}`,
                    letterSpacing: '.28em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  RETRY BACKEND
                </button>
              )}
            </div>

            {/* Disconnect — restrained ghost (the leave path also lives in the top bar) */}
            <button
              type="button"
              onClick={onLeave}
              style={{
                background: 'transparent',
                border: `1px solid ${TOKENS.magenta}55`,
                color: TOKENS.magenta,
                padding: '14px',
                font: `700 12px/1 ${TOKENS.fontMono}`,
                letterSpacing: '.30em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              DISCONNECT SESSION
            </button>
          </div>

          {/* RIGHT COLUMN — roster + ready CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${TOKENS.hairline}`,
                padding: '18px 18px 14px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                aria-hidden
                style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 56, background: TOKENS.cyan }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    font: `500 11px/1 ${TOKENS.fontMono}`,
                    color: TOKENS.cyan,
                    letterSpacing: '.28em',
                    textTransform: 'uppercase',
                  }}
                >
                  SQUAD ROSTER
                </div>
                <div
                  style={{
                    font: `700 12px/1 ${TOKENS.fontMono}`,
                    color: TOKENS.textHi,
                    letterSpacing: '.24em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {players.length} / {totalSlots}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence initial={false}>
                  {Array.from({ length: totalSlots }).map((_, idx) => {
                    const p = players[idx];
                    if (!p) {
                      return (
                        <div
                          key={`slot-${idx}`}
                          style={{
                            border: `1px dashed ${TOKENS.hairline}`,
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: TOKENS.textDim,
                            font: `500 12px/1 ${TOKENS.fontMono}`,
                            letterSpacing: '.24em',
                            textTransform: 'uppercase',
                          }}
                        >
                          <span>
                            <span style={{ color: TOKENS.textDim, marginRight: 14 }}>
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            EMPTY SLOT
                          </span>
                          <span style={{ color: TOKENS.textDim }}>·</span>
                        </div>
                      );
                    }
                    const isYou = p.id === socket?.id;
                    const isLeader = idx === 0;
                    const ready = Boolean(p.ready);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          position: 'relative',
                          background: isYou ? 'rgba(25,224,255,0.04)' : 'rgba(255,255,255,0.015)',
                          border: `1px solid ${isYou ? TOKENS.cyan + '55' : TOKENS.hairline}`,
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        {isYou && (
                          <span
                            aria-hidden
                            style={{
                              position: 'absolute', left: 0, top: -1, height: 3, width: 32, background: TOKENS.cyan,
                            }}
                          />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                          <span
                            style={{
                              font: `700 14px/1 ${TOKENS.fontMono}`,
                              color: TOKENS.textDim,
                              letterSpacing: '.22em',
                              minWidth: 28,
                            }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                font: `900 italic 18px/1 ${TOKENS.fontDisplay}`,
                                color: TOKENS.textHi,
                                letterSpacing: '.04em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {p.id.substring(0, 8)}
                            </div>
                            <div
                              style={{
                                marginTop: 4,
                                font: `500 10px/1 ${TOKENS.fontMono}`,
                                color: TOKENS.textMute,
                                letterSpacing: '.22em',
                                textTransform: 'uppercase',
                              }}
                            >
                              OP_ID 0x{p.id.substring(8, 12) || '----'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isYou && (
                            <span
                              style={{
                                background: TOKENS.cyan,
                                color: TOKENS.bg,
                                padding: '4px 8px',
                                font: `700 10px/1 ${TOKENS.fontMono}`,
                                letterSpacing: '.22em',
                              }}
                            >
                              YOU
                            </span>
                          )}
                          {isLeader && (
                            <span
                              style={{
                                border: `1px solid ${TOKENS.orange}`,
                                color: TOKENS.orange,
                                padding: '4px 8px',
                                font: `700 10px/1 ${TOKENS.fontMono}`,
                                letterSpacing: '.22em',
                              }}
                            >
                              HOST
                            </span>
                          )}
                          <span
                            style={{
                              padding: '6px 10px',
                              background: ready ? TOKENS.green : 'transparent',
                              border: `1px solid ${ready ? TOKENS.green : TOKENS.hairlineHi}`,
                              color: ready ? TOKENS.bg : TOKENS.textMute,
                              font: `700 10px/1 ${TOKENS.fontMono}`,
                              letterSpacing: '.24em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {ready ? 'READY' : 'WAITING'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* READY PROGRESS */}
            <div
              style={{
                position: 'relative',
                background: TOKENS.bgTranslucent,
                border: `1px solid ${TOKENS.hairline}`,
                padding: '12px 16px',
              }}
            >
              <span
                aria-hidden
                style={{ position: 'absolute', left: 0, top: -1, height: 3, width: 32, background: TOKENS.green }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  font: `500 11px/1 ${TOKENS.fontMono}`,
                  color: TOKENS.textMute,
                  letterSpacing: '.26em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                <span>READY STATE</span>
                <span style={{ color: TOKENS.textHi }}>{readyCount} / {players.length || 0}</span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: 6,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${TOKENS.hairline}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${(readyCount / Math.max(1, players.length)) * 100}%`,
                    background: TOKENS.green,
                    transition: 'width 220ms ease-out',
                  }}
                />
              </div>
            </div>

            {/* READY CTA */}
            <div style={{ marginTop: 4 }}>
              <PrimaryCta
                label={readyLabel}
                sub={isHost && players.length < 2 ? 'HOST NEEDS 2+ OPERATIVES' : 'CONFIRM TO LOCK IN'}
                onClick={onReady}
                disabled={!canReady}
                height={104}
                notch={20}
              />
              {isHost && players.length < 2 && (
                <div
                  style={{
                    marginTop: 8,
                    font: `500 11px/1.4 ${TOKENS.fontMono}`,
                    color: TOKENS.yellow,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚠ HOST REQUIRES 2+ SQUAD MEMBERS
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stack columns on narrow screens */}
      <style>{`
        @media (max-width: 760px) {
          .lobby-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  );
}
