import { chromium } from 'playwright';
import fs from 'fs';

const shots = 'qa-screenshots';
const consoleErrors=[]; const pageErrors=[]; const failedRequests=[];
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('console', m=>{ if(m.type()==='error') consoleErrors.push(m.text()); });
page.on('pageerror', e=> pageErrors.push(String(e)));
page.on('requestfailed', r=> failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));

async function snap(name){ await page.screenshot({path:`${shots}/${name}`, fullPage:true}); }
async function clickText(txt){ const loc = page.getByText(txt,{exact:false}).first(); if(await loc.count()) { await loc.click({timeout:2000}).catch(()=>{}); await page.waitForTimeout(600);} }

await page.goto('http://localhost:3000', {waitUntil:'networkidle'});
await page.waitForTimeout(1500);
await snap('01-home.png');

for (const t of ['ENTER','START','PLAY','CONTINUE']) await clickText(t);
await snap('02-main-menu.png');

for (const t of ['CLASSIC','SOLO','SINGLE']) await clickText(t);
await snap('03-arena-select.png');
for (const t of ['TRAINING','NEXT','CONTINUE','SELECT']) await clickText(t);
await snap('04-weapon-select.png');
for (const t of ['PICK','SELECT','CONTINUE','NEXT']) await clickText(t);
await snap('05-dart-select.png');

await clickText('SETTINGS');
await snap('06-settings.png');
await clickText('CLOSE');

for (const t of ['START MATCH','START','BEGIN','LAUNCH']) await clickText(t);
await page.mouse.click(800,450);
await page.keyboard.press('KeyR').catch(()=>{});
await page.waitForTimeout(1500);
await snap('07-gameplay-training.png');
await page.keyboard.press('Escape').catch(()=>{});
await page.waitForTimeout(700);
await snap('10-pause-menu.png');
await clickText('RESUME');

for (const arena of ['WAREHOUSE','ROOFTOP']){
  await page.keyboard.press('Escape').catch(()=>{});
  await clickText('EXIT'); await clickText('MENU'); await clickText('BACK');
  await clickText('PLAY'); await clickText('CLASSIC');
  await clickText(arena); await clickText('CONTINUE'); await clickText('START');
  await page.waitForTimeout(1200);
  await snap(arena==='WAREHOUSE'?'08-gameplay-warehouse.png':'09-gameplay-rooftop.png');
}

// Multiplayer attempt
await page.keyboard.press('Escape').catch(()=>{});
for (const t of ['EXIT','MENU','BACK']) await clickText(t);
await clickText('MULTIPLAYER');
await page.waitForTimeout(1000);
await snap('15-multiplayer-lobby.png');
await clickText('CREATE'); await clickText('READY'); await clickText('START');
await page.waitForTimeout(1200);
await snap('16-multiplayer-gameplay.png');

// mobile
const m = await browser.newContext({ viewport:{width:390,height:844} });
const mp = await m.newPage();
mp.on('console', m=>{ if(m.type()==='error') consoleErrors.push('[mobile] '+m.text()); });
await mp.goto('http://localhost:3000'); await mp.waitForTimeout(1500);
await mp.screenshot({path:`${shots}/mobile-main-menu.png`, fullPage:true});
await mp.getByText('SETTINGS',{exact:false}).first().click().catch(()=>{});
await mp.waitForTimeout(600);
await mp.screenshot({path:`${shots}/mobile-settings.png`, fullPage:true});
await mp.keyboard.press('Escape').catch(()=>{});
await mp.getByText('PLAY',{exact:false}).first().click().catch(()=>{});
await mp.waitForTimeout(1200);
await mp.screenshot({path:`${shots}/mobile-gameplay.png`, fullPage:true});
await mp.keyboard.press('Escape').catch(()=>{});
await mp.waitForTimeout(600);
await mp.screenshot({path:`${shots}/mobile-pause-results.png`, fullPage:true});
await m.close();

fs.writeFileSync('qa-runtime-errors.json', JSON.stringify({consoleErrors,pageErrors,failedRequests},null,2));
await browser.close();
