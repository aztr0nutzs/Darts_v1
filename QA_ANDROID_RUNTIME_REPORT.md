# Android Packaged Runtime QA Report

**Date:** 2026-05-18 (UTC)
**Branch / HEAD:** `claude/black-first-ui-redesign-Adsw7` (synced to `main` at `4b973a8`)
**Scope:** Android-packaged WebView runtime verification of the redesigned
build after the black-first / performance-budget passes (PRs #18 – #21).

## Status

⚠️ **Android runtime was NOT executed for this commit.** The current
managed remote-execution environment does not provide:

- Android SDK / build tools
- An Android emulator
- A physical Android device with `adb` access
- The ability to launch a system service such as `qemu-system-x86_64`

This report does **not** claim Android visual verification. It explicitly
flags the gap so a reader does not mistake browser evidence for
Android-packaged-WebView evidence. To regenerate Android evidence later,
follow the procedure in the next section on a machine that does provide
those tools.

The previous Android QA report (pre-redesign, 2026-05-16) and its
emulator-captured screenshots are now stale because they were captured
against a build with the old blue/cyan UI. They have been moved to
`qa-archive/outdated-before-redesign/` and labelled there. They must not
be referenced as evidence for the current build.

## Procedure (when an Android host is available)

```bash
# 1. Web build + path checks
npm install
npm run lint
npm run build

# 2. Sync the freshly built web assets into the Android app
cd android
./gradlew syncWebAssets   # on Windows: .\gradlew.bat syncWebAssets

# 3. Build the debug APK
./gradlew assembleDebug

# 4. Boot an emulator (or attach a device) and install
emulator -avd <your-avd-name> &
adb wait-for-device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 5. Launch + capture
adb shell am start -n com.darts.app/.MainActivity   # adjust package if it differs
# Then use `adb exec-out screencap -p > qa-android-screenshots/01_android_launch.png`
# while stepping through the redesigned surfaces.

# 6. Logcat (capture during the same session)
adb logcat -d > qa-android-startup-logcat.txt
```

Once the run completes, replace this report with the captured commands,
emulator/device identifiers, screenshots, logcat excerpts, and a final
verdict — and remove this "not executed" notice.

## Surfaces to capture

When the run is performed, capture (at minimum):

- `01_android_launch.png` — initial boot sequence on Android
- `02_android_main_menu.png` — redesigned main menu after boot completes
- `03_android_gameplay.png` — gameplay HUD with the mobile control overlay
- `04_android_settings.png` — in-game settings panel via pause → SETTINGS
- `05_android_multiplayer.png` — Multiplayer entry sub-view from main menu
  (or the post-join lobby if a peer is available)

## Why this is here even though it could not be run

The strict rule for this task is: do **not** claim Android runtime was
verified unless it was actually launched. This document records that
**fact** rather than silently omitting it. Browser-side runtime evidence
for the redesigned UI is still recorded in `QA_LIVE_TEST_REPORT.md` and
in `qa-screenshots-current/`.

## Related artifacts

- Current browser QA: `QA_LIVE_TEST_REPORT.md`, `qa-screenshots-current/`
- Previous (pre-redesign, stale) Android evidence:
  `qa-archive/outdated-before-redesign/screenshots/android/` and
  `qa-archive/outdated-before-redesign/logs/qa-android-*.txt`.
