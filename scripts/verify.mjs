// Playwright smoke test: boots the game, checks level data, plays level 1's
// scrape step with synthetic swipes, and saves screenshots.
//   node scripts/verify.mjs [--shots-dir DIR]
// Requires: a static server on :8080 (python3 -m http.server 8080)
// and playwright-core (npm i playwright-core).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const BASE = process.env.GAME_URL || 'http://localhost:8080';
const SHOTS = process.argv.includes('--shots-dir')
  ? process.argv[process.argv.indexOf('--shots-dir') + 1]
  : 'shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
});

const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const fail = msg => { console.error('FAIL:', msg); process.exitCode = 1; };
const ok = msg => console.log('ok:', msg);

// --- menu ------------------------------------------------------------------
await page.goto(`${BASE}/index.html?reset`);
await page.waitForFunction(() => window.__HOOF__);
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/01-menu.png` });
ok('menu loaded');

// --- level data ------------------------------------------------------------
const data = await page.evaluate(() => {
  const { levels, gates } = window.__HOOF__;
  return {
    count: levels.length,
    gateCount: gates.length,
    gatesAreGates: gates.every(g => levels[g - 1].isGate || levels[g - 1].bonus),
    budgets: levels.every(l => l.bonus || l.moveBudget >= l.perfectMoves),
    steps: levels.every(l => l.steps.length >= 1 && l.steps[0] === 'scrape'),
    l100: levels[99],
  };
});
if (data.count !== 100) fail(`expected 100 levels, got ${data.count}`); else ok('100 levels generated');
if (data.gateCount !== 26) fail(`expected 26 gates, got ${data.gateCount}`); else ok('26 gate levels');
if (!data.gatesAreGates) fail('a gate id is not flagged isGate'); else ok('gate flags consistent');
if (!data.budgets) fail('a level has moveBudget < perfectMoves'); else ok('move budgets >= perfect play');
if (!data.steps) fail('a level has no scrape opener'); else ok('every level opens with scrape');
if (!(data.l100.isGate && data.l100.animal === 'horse')) fail('level 100 is not a horse gate'); else ok('level 100 finale looks right');

// --- map -------------------------------------------------------------------
await page.evaluate(() => window.__HOOF__.gotoMap());
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/02-map.png` });
ok('map rendered');

// --- play level 1 scrape step ----------------------------------------------
await page.evaluate(() => window.__HOOF__.loadLevel(1));
await page.waitForTimeout(300);
// canvas is letterboxed; convert logical -> client coords
const rect = await page.evaluate(() => {
  const r = document.getElementById('game').getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
const px = (lx, ly) => ({ x: rect.x + (lx / 480) * rect.w, y: rect.y + (ly / 854) * rect.h });

// tap through the intro banner
const c = px(240, 430);
await page.mouse.click(c.x, c.y);
await page.waitForTimeout(200);
await page.screenshot({ path: `${SHOTS}/03-gameplay-start.png` });

// zig-zag swipes across the hoof to scrape mud
for (let pass = 0; pass < 40; pass++) {
  const y = 300 + (pass % 8) * 40;
  const a = px(120, y), b = px(360, y + 18);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(a.x + ((b.x - a.x) * i) / 6, a.y + ((b.y - a.y) * i) / 6);
  }
  await page.mouse.up();
  const done = await page.evaluate(() => {
    const t = window.__HOOF__.top();
    return !t || t.name !== 'gameplay' || t.stepIdx > 0 || t.state === 'won';
  });
  if (done) break;
}
await page.waitForTimeout(300);
const after = await page.evaluate(() => {
  const t = window.__HOOF__.top();
  return { name: t.name, stepIdx: t.stepIdx ?? -1, state: t.state ?? '', mud: t.hoof ? t.hoof.mud.length : -1 };
});
if (after.name === 'gameplay' && after.stepIdx === 0 && after.mud > 0) {
  fail(`scrape step did not progress: ${JSON.stringify(after)}`);
} else {
  ok(`scrape step progressed: ${JSON.stringify(after)}`);
}
await page.screenshot({ path: `${SHOTS}/04-gameplay-mid.png` });

// --- gate level intro + rescue modal sanity ----------------------------------
await page.evaluate(() => window.__HOOF__.loadLevel(15));
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/05-gate-intro.png` });
await page.evaluate(() => {
  const t = window.__HOOF__.top();
  t.state = 'play';
  t.fail('moves');
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${SHOTS}/06-rescue-modal.png` });
const modal = await page.evaluate(() => window.__HOOF__.scenes.top().name);
if (modal !== 'rescue') fail(`expected rescue modal, got ${modal}`); else ok('rescue modal shows');

// --- dump table --------------------------------------------------------------
await page.goto(`${BASE}/index.html?dumpLevels`);
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/07-level-table.png`, fullPage: false });
ok('level table renders');

if (errors.length) {
  console.error('CONSOLE/PAGE ERRORS:');
  for (const e of errors) console.error('  ', e);
  process.exitCode = 1;
} else {
  ok('no console errors');
}

await browser.close();
console.log(process.exitCode ? 'VERIFY FAILED' : 'VERIFY PASSED');
