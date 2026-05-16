export type MultiplayerConnectionStatus =
  | 'not_configured'
  | 'connecting'
  | 'connected'
  | 'connection_failed'
  | 'disconnected';

export interface MultiplayerRuntimeConfig {
  socketUrl: string | null;
  source: 'env' | 'same_origin' | 'not_configured';
  reason?: string;
}

const APP_ASSETS_HOST = 'appassets.androidplatform.net';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeSocketUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return trimTrailingSlash(url.toString());
  } catch {
    return null;
  }
}

export function resolveMultiplayerRuntimeConfig(): MultiplayerRuntimeConfig {
  const configuredUrl = import.meta.env.VITE_SOCKET_URL?.trim();
  if (configuredUrl) {
    const socketUrl = normalizeSocketUrl(configuredUrl);
    if (socketUrl) {
      return { socketUrl, source: 'env' };
    }

    return {
      socketUrl: null,
      source: 'not_configured',
      reason: 'VITE_SOCKET_URL must be an absolute http:// or https:// URL.',
    };
  }

  const { protocol, host, origin } = window.location;
  if (protocol === 'file:' || host === APP_ASSETS_HOST) {
    return {
      socketUrl: null,
      source: 'not_configured',
      reason: 'Packaged Android builds require VITE_SOCKET_URL to point at a reachable Socket.IO backend.',
    };
  }

  if (protocol === 'http:' || protocol === 'https:') {
    return { socketUrl: trimTrailingSlash(origin), source: 'same_origin' };
  }

  return {
    socketUrl: null,
    source: 'not_configured',
    reason: 'Unsupported runtime origin for multiplayer Socket.IO.',
  };
}
