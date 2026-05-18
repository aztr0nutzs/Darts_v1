# Darts

Darts is a fast-paced React/WebView action game where the player clears timed waves, chains score multipliers, and survives escalating enemy patterns. The current app ships as:
- a local web runtime (Vite + Node/Socket.IO server), and
- an Android APK that runs the built web bundle inside a WebView.

## Project overview

### Core gameplay loop
1. Boot into the main menu and choose mode/loadout.
2. Deploy into a timed run.
3. Hit moving/variant targets, manage ammo + cooldowns, and react to boss phases.
4. End run and review mission results.

### Current feature set (high level)
- Single-player timed run flow (boot → menu → loadout → gameplay → pause/settings → results).
- Multiplayer entry/lobby flow backed by Socket.IO when backend is reachable.
- Centralized image asset registry for arenas, targets, blasters, and darts with fallback rendering.
- Android WebView packaging path with deterministic web asset sync into app assets.
- QA evidence structure for browser runtime and Android runtime reports/screenshots.

## Tech stack

- **Frontend/game runtime:** React 19 + TypeScript + Vite 6.
- **Backend/dev server:** Node + Express + Socket.IO (`server.ts`).
- **Android wrapper:** native Android app hosting a WebView (`MainActivity`) that loads packaged web assets through `WebViewAssetLoader` at `https://appassets.androidplatform.net/assets/index.html`.

## Local web setup

```bash
npm ci
npm run dev
```

Quality/build checks:

```bash
npm run lint
npm run build
```

Notes:
- `npm run dev` runs `tsx server.ts` (not `vite dev` directly).
- `npm run build` performs web build, Android asset-path checks, absolute-asset checks, and server bundle build.

## Android packaging flow

### 1) Build web artifacts
From repo root:

```bash
npm run build
```

### 2) Sync web build into Android assets
Either use the root script:

```bash
npm run android:sync:web
```

Or run directly:

```bash
cd android
./gradlew syncWebAssets
```

### 3) Build APK

```bash
cd android
./gradlew assembleDebug
```

### 4) Runtime loading model
- Android does **not** serve files from `file://`.
- Web assets are loaded via `WebViewAssetLoader` under `https://appassets.androidplatform.net/assets/`.
- This avoids file-origin quirks and keeps asset/module fetch behavior consistent with web semantics.

### Launch troubleshooting (Android)
- **Blank screen at launch:** verify web assets were synced after latest `npm run build`.
- **404/missing bundle in logcat:** re-run `./gradlew syncWebAssets` then rebuild APK.
- **Works in desktop browser but not APK:** verify paths are relative/public-asset-safe (the repo includes build checks for this).

## Multiplayer configuration

### Environment variable
- `VITE_SOCKET_URL` (optional for local browser dev, required for packaged Android multiplayer).

Example:

```env
VITE_SOCKET_URL="https://your-socket-backend.example"
```

### Behavior by runtime
- **Local browser (`http://`/`https://` origin):** if `VITE_SOCKET_URL` is unset, app falls back to same-origin Socket.IO.
- **Android packaged WebView (`appassets.androidplatform.net` origin):** same-origin fallback is not valid for Socket.IO backend, so set `VITE_SOCKET_URL` to a reachable remote backend.

### If backend is unavailable
- Multiplayer remains unavailable/disconnected and lobby/connect flows should surface connection failure state rather than crashing single-player runtime.

## Asset system

- Source assets live under `public/game-assets/` (arenas, targets, blasters, darts).
- `src/lib/assetRegistry.ts` is the canonical typed registry/mapping layer.
- Paths are generated through `resolvePublicAsset(...)` using Vite `BASE_URL`, so the same registry works in dev, production web builds, and Android packaged assets.
- Fallback styles/types are defined per asset category so gameplay visuals degrade safely if an image is missing.

## QA and testing workflow

### Browser QA
- Use `QA_LIVE_TEST_REPORT.md` as the current browser runtime evidence log.
- Current screenshots live in `qa-screenshots-current/`.
- Automated capture script: `qa_runtime_test.mjs`.

### Android QA
- Use `QA_ANDROID_RUNTIME_REPORT.md` for Android packaged runtime status/evidence.
- Keep stale evidence in `qa-archive/outdated-before-redesign/` only.

### Important warning
- Browser localhost validation is **not** equivalent to APK/WebView runtime validation.
- Always run Android packaging + device/emulator verification before claiming Android runtime pass.

## Troubleshooting

### Blank screen
- Confirm APK was built after a successful `npm run build`.
- Re-run asset sync (`./gradlew syncWebAssets`).
- Check logcat for WebView resource errors from `MainActivity`.

### Asset not loading
- Confirm asset exists under `public/game-assets/...`.
- Confirm reference is mapped in `src/lib/assetRegistry.ts`.
- Run `npm run build` to trigger path guards:
  - `check:android-asset-paths`
  - `check:no-absolute-game-assets`

### Multiplayer unavailable
- Verify `VITE_SOCKET_URL` is an absolute `http://` or `https://` URL.
- For Android, verify backend is publicly/reachably accessible from device network.
- Check backend/socket process health and CORS origin configuration.

### App feels slow
- Use production build (`npm run build`) and test packaged output, not only dev runtime.
- Compare browser vs Android WebView behavior; device GPU/CPU constraints can differ.
- Validate no repeated asset-load failures or reconnect loops in logs.
