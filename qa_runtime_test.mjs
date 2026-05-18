// Truth-of-record browser QA for the current black-first redesign.
// Drives the live dev server (http://localhost:3000) through the actual
// redesigned UI: Boot → Main Menu → Loadout → Multiplayer Lobby → Gameplay
// → Pause → Settings → Mobile controls. Captures fresh screenshots into
// qa-screenshots-current/ and dumps every browser console / page error /
// failed network request into qa-runtime-errors.json so anyone reviewing
// the report can see exactly what was logged at capture time.
//
// Selectors target redesign-stable surfaces (DEPLOY primary CTA, NavRow
// labels LOADOUT / MULTIPLAYER, PAUSED. title, SETTINGS row in the pause
// overlay, RESUME CTA, etc.) and read directly from the rendered DOM
// rather than relying on coordinates, so the script is robust to layout
// breakpoints.

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = 'qa-screenshots-current';
const URL = process.env.QA_URL ?? 'http://localhost:3000';

fs.mkdirSync(OUT, { recursive: true });

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await desktop.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(`[desktop] ${m.text()}`);
});
page.on('pageerror', (e) => pageErrors.push(`[desktop] ${String(e)}`));
page.on('requestfailed', (r) =>
  failedRequests.push(`[desktop] ${r.url()} :: ${r.failure()?.errorText ?? 'unknown'}`)
);

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`captured ${file}`);
}

async function clickByText(text, { timeout = 1500 } = {}) {
  const loc = page.getByText(text, { exact: false }).first();
  if (await loc.count()) {
    await loc.click({ timeout }).catch(() => {});
    await page.waitForTimeout(450);
    return true;
  }
  return false;
}

await page.goto(URL, { waitUntil: 'domcontentloaded' });

// ── 01 BOOT ──────────────────────────────────────────────────────────────
// Boot sequence runs ~2.2 s. Snap mid-progress.
await page.waitForTimeout(900);
await shot('01_boot.png');

// Click BYPASS to skip remaining boot if it hasn't auto-completed.
await clickByText('BYPASS');
await page.waitForTimeout(900);

// ── 02 MAIN MENU ─────────────────────────────────────────────────────────
await page.waitForSelector('text=DEPLOY', { timeout: 5000 });
await shot('02_main_menu.png');

// ── 03 LOADOUT ───────────────────────────────────────────────────────────
await clickByText('LOADOUT');
await page.waitForSelector('text=SLOT · 01', { timeout: 5000 });
await shot('03_loadout.png');
await clickByText('BACK');
await page.waitForTimeout(400);

// ── 07 MULTIPLAYER LOBBY (entered via menu sub-view) ─────────────────────
await clickByText('MULTIPLAYER');
await page.waitForTimeout(700);
await shot('07_multiplayer_lobby.png');
await clickByText('BACK');
await page.waitForTimeout(400);

// ── 04 GAMEPLAY HUD ──────────────────────────────────────────────────────
// Select BLITZ (30 s mode) so the match completes inside the QA budget and
// the Results screen is reachable. Then DEPLOY and wait through the full
// CountdownOverlay (3 → 2 → 1 → GO ≈ 4.5 s) before snapping the HUD.
const blitzChip = page.getByText('BLITZ', { exact: false }).first();
if (await blitzChip.count()) await blitzChip.click().catch(() => {});
await page.waitForTimeout(250);

await clickByText('DEPLOY');
await page.waitForTimeout(5200);
await page.mouse.move(800, 500);
await page.waitForTimeout(400);
await shot('04_gameplay_hud.png');

// ── 05 PAUSE OVERLAY (via HUD Pause button) ─────────────────────────────
// The redesigned HUD exposes the pause control as a 32 × 32 button with
// aria-label="Pause" in the top-right corner. Escape is intentionally not
// bound to pause in this build.
const pauseBtn = page.locator('button[aria-label="Pause"]').first();
let pausedVisible = 0;
if (await pauseBtn.count()) {
  // Locator click first (works in most environments).
  await pauseBtn.click({ force: true, timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(500);
  pausedVisible = await page.getByText('PAUSED.', { exact: false }).count();
  if (!pausedVisible) {
    // Headless fallback: dispatch a native click via JS. Pointer events on
    // the HUD wrapper are 'none' with the button itself set to 'auto'; on
    // some headless configurations Playwright's hit-testing rejects the
    // synthesised pointer event even with { force: true }. Going through
    // HTMLElement.click() side-steps the hit-test entirely.
    await page.evaluate(() => {
      const el = document.querySelector('button[aria-label="Pause"]');
      if (el instanceof HTMLElement) el.click();
    });
    await page.waitForTimeout(500);
    pausedVisible = await page.getByText('PAUSED.', { exact: false }).count();
  }
}
if (pausedVisible) {
  await shot('05_pause_overlay.png');
  // ── 06 SETTINGS PANEL ──────────────────────────────────────────────────
  await clickByText('SETTINGS');
  await page.waitForTimeout(550);
  const settingsVisible = await page.getByText('SYSTEM · CONFIG', { exact: false }).count();
  if (settingsVisible) {
    await shot('06_settings_panel.png');
    await clickByText('APPLY');
    await page.waitForTimeout(400);
  } else {
    console.warn('settings panel did not appear — 06_settings_panel.png skipped');
  }
  await clickByText('RESUME');
  await page.waitForTimeout(500);
} else {
  console.warn('PAUSE overlay did not appear — 05/06 shots skipped');
}

// ── 08 RESULTS SCREEN (wait out BLITZ timer) ─────────────────────────────
// Total BLITZ length = 30 s. By this point we've burned ~12–15 s in
// gameplay/pause/settings; wait the remainder generously plus a small
// post-timeout grace so the ResultsOverlay rank-slam reveal has finished.
let resultsCaptured = false;
const resultsDeadline = Date.now() + 40_000;
while (Date.now() < resultsDeadline) {
  const resultsOnScreen = await page.locator('text=DEBRIEF · RUN').count();
  if (resultsOnScreen) {
    await page.waitForTimeout(900); // let rank slam settle
    await shot('08_results_screen.png');
    resultsCaptured = true;
    break;
  }
  await page.waitForTimeout(750);
}
if (!resultsCaptured) {
  console.warn('results overlay did not appear inside 40 s budget — 08_results_screen.png skipped');
}

// Boss HUD is intentionally not driven from this script. Boss encounters
// Deterministic Boss HUD capture (DEV-only QA trigger):
//   ?qaBoss=training | ?qaBoss=warehouse | ?qaBoss=rooftop
// The app gates this path behind import.meta.env.DEV and auto-spawns the
// real boss state in active gameplay so we can capture proof screenshots.
async function captureBossHudShot(arenaId, filename) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  p.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`[boss-${arenaId}] ${m.text()}`);
  });
  p.on('pageerror', (e) => pageErrors.push(`[boss-${arenaId}] ${String(e)}`));
  p.on('requestfailed', (r) =>
    failedRequests.push(`[boss-${arenaId}] ${r.url()} :: ${r.failure()?.errorText ?? 'unknown'}`)
  );

  await p.goto(`${URL}?qaBoss=${arenaId}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  const bypass = p.getByText('BYPASS', { exact: false }).first();
  if (await bypass.count()) await bypass.click().catch(() => {});
  await p.waitForTimeout(900);

  const deploy = p.getByText('DEPLOY', { exact: false }).first();
  if (await deploy.count()) await deploy.click().catch(() => {});
  await p.waitForTimeout(5600); // countdown + boss spawn effect

  await p.waitForSelector('text=BOSS', { timeout: 6000 });
  await p.screenshot({ path: path.join(OUT, filename), fullPage: false });
  console.log(`captured ${path.join(OUT, filename)}`);
  await ctx.close();
}

await captureBossHudShot('training', '11_boss_hud_training.png');
await captureBossHudShot('warehouse', '12_boss_hud_warehouse.png');
await captureBossHudShot('rooftop', '13_boss_hud_rooftop.png');

// ── 10 MOBILE CONTROLS ───────────────────────────────────────────────────
const mobile = await browser.newContext({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
});
const mp = await mobile.newPage();
mp.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(`[mobile] ${m.text()}`);
});
mp.on('pageerror', (e) => pageErrors.push(`[mobile] ${String(e)}`));
mp.on('requestfailed', (r) =>
  failedRequests.push(`[mobile] ${r.url()} :: ${r.failure()?.errorText ?? 'unknown'}`)
);
await mp.goto(URL, { waitUntil: 'domcontentloaded' });
await mp.waitForTimeout(900);
// Skip boot on mobile too.
const mBypass = mp.getByText('BYPASS', { exact: false }).first();
if (await mBypass.count()) await mBypass.click().catch(() => {});
await mp.waitForTimeout(900);
// Ensure SHOW FIRE BUTTON is on so the octagon FIRE renders. The default
// in code is `showFireButton: true`, so this is just defensive. Wait the
// full countdown so the HUD + controls are visible, not the blackout
// mid-countdown frame.
const deployMobile = mp.getByText('DEPLOY', { exact: false }).first();
if (await deployMobile.count()) {
  await deployMobile.click().catch(() => {});
  await mp.waitForTimeout(5400);
  // Tap once to ensure the playfield is interactive and HUD is on-screen.
  await mp.touchscreen.tap(206, 600).catch(() => {});
  await mp.waitForTimeout(400);
}
await mp.screenshot({ path: path.join(OUT, '10_mobile_controls.png'), fullPage: false });
console.log(`captured ${path.join(OUT, '10_mobile_controls.png')}`);
await mobile.close();

// ── Write error inventory ────────────────────────────────────────────────
fs.writeFileSync(
  'qa-runtime-errors.json',
  JSON.stringify({ consoleErrors, pageErrors, failedRequests }, null, 2)
);
console.log('wrote qa-runtime-errors.json');

await browser.close();
console.log('done.');
