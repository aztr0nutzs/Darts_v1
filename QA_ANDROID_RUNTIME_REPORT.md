# Android Packaged Runtime QA Report

**Date:** 2026-05-18 (UTC)
**Scope:** Current-cycle Android packaged runtime verification attempt for the
latest Darts build.

## Executive status

⚠️ **Android runtime launch is still blocked in this environment.**

What was completed:
- Web build, lint, and packaging checks succeeded.
- Android web-asset sync task succeeded.

What failed:
- Android debug APK compile failed because no Android SDK is installed/configured.
- No `adb` binary and no emulator binary are present, so install/launch/logcat
  runtime validation could not be executed.

No Android screenshots are claimed in this run.

## Commands run and outcomes

```bash
npm ci
npm run lint
npm run build
npm run android:sync:web
cd android && sh gradlew assembleDebug
which adb
which emulator
```

Results:
- `npm ci` ✅
- `npm run lint` ✅
- `npm run build` ✅
- `npm run android:sync:web` ✅ (including Gradle `:app:syncWebAssets`)
- `sh gradlew assembleDebug` ❌
  - Failure: `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path ...`
- `which adb` ❌ (not found)
- `which emulator` ❌ (not found)

## Required runtime questions (truthful answers)

- **Did the app launch on Android?** No.
- **Was the white-screen issue absent?** Not verifiable (app did not launch).
- **Did JS render on Android runtime?** Not verifiable.
- **Did CSS apply on Android runtime?** Not verifiable.
- **Did core visuals load on Android runtime?** Not verifiable.
- **Did screenshots reflect the current build?** No Android screenshots captured in this environment.
- **Any remaining Android-specific issues?** Primary blocker is missing Android SDK + no adb/emulator tools in environment.

## Runtime logs / logcat

- No device/emulator runtime session was available.
- No logcat output exists for this cycle in this environment.

## Screenshot status

Target folder for successful runs remains:
- `qa-android-screenshots-current/`

Expected captures when Android host is available:
- `01_android_launch.png`
- `02_android_main_menu.png`
- `03_android_loadout.png`
- `04_android_gameplay_hud.png`
- `05_android_settings.png`
- `06_android_multiplayer_lobby_or_unavailable.png`
- `07_android_boss_hud.png` (if deterministic trigger path is used)

## Remaining release blockers (Android)

1. Install/configure Android SDK and set `ANDROID_HOME` (or `sdk.dir` in
   `android/local.properties`).
2. Provision emulator or physical device with `adb` access.
3. Re-run APK build/install/launch and capture fresh current-cycle screenshots.
4. Capture and attach logcat for startup/render/runtime networking validation.

Until those are complete, Android runtime confidence remains **blocked**.
