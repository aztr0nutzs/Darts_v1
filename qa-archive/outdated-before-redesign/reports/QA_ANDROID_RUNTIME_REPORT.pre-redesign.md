# Android Packaged Runtime QA Report

Date: 2026-05-16

Scope: Android-packaged WebView runtime validation for the local asset launch path. This validation used the Android debug APK on an emulator and did not substitute localhost browser testing for Android/WebView runtime evidence.

## Summary

The Android debug APK was built, installed, and launched on emulator `emulator-5554` (`sdk_gphone64_x86_64`). The app loaded `https://appassets.androidplatform.net/assets/index.html` through the Android packaged WebView path, rendered the React app, applied CSS, loaded packaged game assets, and allowed interaction through menu, gameplay, settings, and multiplayer-unavailable screens.

The previous white blank screen symptom was not reproduced during this emulator run. The first captured launch surface was black, then the main menu rendered. No missing JavaScript or CSS bundle errors were found in Logcat.

## Commands Run

| Command | Result |
| --- | --- |
| `npm ci` | Failed. `npm` hit `EPERM: operation not permitted, unlink` on `node_modules\lightningcss-win32-x64-msvc\lightningcss.win32-x64-msvc.node`. |
| `npm run lint` after failed `npm ci` | Failed because dependencies were partially removed and `tsc` was not available. |
| `npm install` | Passed. Restored dependencies. Warnings included cleanup `EPERM` entries for native package temp directories and `npm audit` reported 3 vulnerabilities. |
| `npm run lint` | Passed (`tsc --noEmit`). |
| `npm run build` | Passed. Vite built `dist/index.html`, `dist/assets/index-Fu4X4noK.css`, and `dist/assets/index-CzofQ7zB.js`. Android asset path checks passed. |
| `.\gradlew.bat syncWebAssets` from `android` | Passed. Rebuilt web assets and copied them into Android generated assets. |
| `.\gradlew.bat assembleDebug` from `android` | Passed. Debug APK produced at `android/app/build/outputs/apk/debug/app-debug.apk`. |
| Android emulator launch | Passed. AVD `Medium_Phone_API_36.1` booted as `emulator-5554`. |
| `adb -s emulator-5554 install -r android\app\build\outputs\apk\debug\app-debug.apk` | Passed with `Success`. |
| App launch via `adb -s emulator-5554 shell monkey -p com.nerfgame 1` | Passed. `com.nerfgame/.MainActivity` became resumed/visible. |

## Packaged Asset Verification

Android generated asset root:

`android/app/build/generated/assets/web`

Confirmed files and directories:

- `index.html` exists.
- JavaScript bundle exists: `assets/index-CzofQ7zB.js`.
- CSS bundle exists: `assets/index-Fu4X4noK.css`.
- `game-assets` exists with `arenas`, `blasters`, `darts`, and `targets`.
- `blasters.png` exists.

Built `index.html` uses relative asset references compatible with the appassets WebView loading path:

```html
<script type="module" crossorigin src="./assets/index-CzofQ7zB.js"></script>
<link rel="stylesheet" crossorigin href="./assets/index-Fu4X4noK.css">
```

Static reference check result:

```json
{
  "indexRefs": ["./assets/index-CzofQ7zB.js", "./assets/index-Fu4X4noK.css"],
  "missingIndexRefs": [],
  "rootAbsoluteRefs": [],
  "gameAssetRefCount": 35,
  "missingGameAssets": []
}
```

## Android Runtime Evidence

The APK was launched on the emulator. Startup Logcat confirmed the Android packaged URL:

```text
I/DartStrike: Loading: https://appassets.androidplatform.net/assets/index.html
I/DartStrike: Page loaded: https://appassets.androidplatform.net/assets/index.html
```

WebView remote debugging confirmed the active page target URL:

```text
https://appassets.androidplatform.net/assets/index.html
```

JavaScript execution was confirmed by the rendered React DOM and successful interaction with runtime UI through WebView debugging. Screenshots captured menu, gameplay, settings, and multiplayer unavailable states from the Android app.

## White-Screen Validation

- Did the app render instead of showing blank white? Yes. The launch capture showed a black loading surface, and the app then rendered the main menu.
- Did JavaScript execute? Yes. React rendered and menu/game/settings/multiplayer interactions worked inside the Android WebView.
- Did CSS apply? Yes. Screenshots show the styled main menu, gameplay HUD, settings modal, and multiplayer screen.
- Did asset images load? Yes for packaged game assets. Static checks found all referenced game assets on disk, and rendered Android screenshots show visual game/menu assets.
- Did Logcat contain missing JavaScript or CSS errors? No missing JS or CSS bundle errors were found.

## Logcat Findings

Captured logs:

- `qa-android-startup-logcat.txt`
- `qa-android-after-wait-logcat.txt`
- `qa-android-gameplay-logcat.txt`
- `QA_ANDROID_LOGCAT_FULL.txt`

Relevant diagnostics:

- App loaded through `https://appassets.androidplatform.net/assets/index.html`.
- Page load completed for the appassets URL.
- No `JS [` WebChromeClient console errors were found in the filtered startup/gameplay logs.
- No missing bundled JavaScript or CSS asset errors were found.

Observed non-blocking resource errors:

```text
W/DartStrike: Asset loader miss: https://appassets.androidplatform.net/favicon.ico
E/DartStrike: Resource error url=https://appassets.androidplatform.net/favicon.ico code=-2 desc=net::ERR_NAME_NOT_RESOLVED mainFrame=false
E/DartStrike: Resource error url=https://grain-y.com/images/noise.png code=-2 desc=net::ERR_NAME_NOT_RESOLVED mainFrame=false
```

The favicon miss and external decorative `grain-y.com/images/noise.png` request did not prevent the app from rendering. The external image request is still an offline-cleanliness issue for a fully packaged runtime.

Other Chromium/system logs included tile memory warnings and unrelated Android/Play Store messages. These did not block launch or rendering in this run.

## Screenshots

Created in `qa-android-screenshots/`:

- `01_android_launch.png` - Android launch/loading surface; black, not white.
- `02_android_main_menu.png` - Rendered main menu.
- `03_android_gameplay.png` - Rendered gameplay.
- `04_android_settings.png` - Rendered settings modal.
- `05_android_multiplayer_unavailable_or_connected.png` - Multiplayer screen showing backend URL required.

Boss screen was not captured because practical boss access was not reached during this QA run.

## Remaining Limitations / Blockers

- `npm ci` did not complete because Windows held a native `lightningcss` binary open and `npm` could not unlink it. `npm install` restored dependencies, after which lint/build passed.
- A packaged/offline-clean runtime still attempts to request `https://grain-y.com/images/noise.png`; this should be bundled or removed if zero external asset errors are required.
- `favicon.ico` is requested but not packaged under the appassets root.
- Validation was performed on the Android emulator `emulator-5554`; a physical phone appeared later but was not used for this report.
- Boss screen screenshot was not captured.
