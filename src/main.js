import { W, H } from './util.js';
import { scenes } from './scenes/sceneManager.js';
import { Menu } from './scenes/menu.js';
import { Gameplay } from './scenes/gameplay.js';
import { MapScene } from './scenes/map.js';
import { initInput } from './input.js';
import { initAudio } from './audio.js';
import { LEVELS, GATES, BONUS_LEVELS, PHASE_NAMES } from './levels.js';
import { save } from './save.js';

const params = new URLSearchParams(location.search);

// ---------------------------------------------------------------------------
// ?dumpLevels — render the generated 100-level design table instead of the game
// ---------------------------------------------------------------------------
if (params.has('dumpLevels')) {
  document.body.style.overflow = 'auto';
  document.getElementById('game').remove();
  const cols = ['id', 'phase', 'animal', 'kind', 'steps', 'timerSec', 'moveBudget', 'perfectMoves',
    'mudLayers', 'scrubSpots', 'clipSegments', 'knifePaths', 'raspTarget', 'stones', 'sprayTargets',
    'wrapTurns', 'shoe', 'guideTolerancePx', 'quickDistancePx', 'knifePathWidth', 'flinchIntervalSec', 'title'];
  const rows = LEVELS.map(lv => {
    const cls = lv.isGate ? 'gate' : lv.bonus ? 'bonus' : '';
    const cells = cols.map(c => {
      let v;
      if (c === 'kind') v = lv.isGate ? `GATE T${lv.tier}` : lv.bonus ? 'BONUS' : '';
      else if (c === 'steps') v = lv.steps.join('>');
      else if (c === 'shoe') v = lv.shoe ? `pry${lv.shoe.pryPoints}/nail${lv.shoe.nailCount}` : '';
      else if (c === 'phase') v = `${lv.phase} ${PHASE_NAMES[lv.phase]}`;
      else v = lv[c] ?? '';
      return `<td>${v}</td>`;
    }).join('');
    return `<tr class="${cls}">${cells}</tr>`;
  }).join('\n');
  document.body.innerHTML =
    `<table class="levels"><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>${rows}</table>`;
} else {
  boot();
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let cssScale = 1;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    cssScale = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = `${W * cssScale}px`;
    canvas.style.height = `${H * cssScale}px`;
    canvas.width = Math.round(W * cssScale * dpr);
    canvas.height = Math.round(H * cssScale * dpr);
    ctx.setTransform(cssScale * dpr, 0, 0, cssScale * dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  initInput(canvas, e => {
    if (e.type === 'down') initAudio();
    const top = scenes.top();
    if (top && top.onPointer) top.onPointer(e);
  });

  // dev shortcut: ?level=N jumps straight into a level
  const startLevel = parseInt(params.get('level'), 10);
  if (startLevel >= 1 && startLevel <= 100) {
    scenes.replace(new Gameplay(startLevel));
  } else {
    scenes.replace(new Menu());
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const top = scenes.top();
    if (top && top.update) top.update(dt);
    ctx.clearRect(0, 0, W, H);
    for (const s of scenes.all()) if (s.render) s.render(ctx);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // test hooks for the Playwright verify script (harmless in a prototype)
  window.__HOOF__ = {
    levels: LEVELS,
    gates: GATES,
    bonus: BONUS_LEVELS,
    save,
    scenes,
    loadLevel(n) { scenes.replace(new Gameplay(n)); },
    gotoMap() { scenes.replace(new MapScene()); },
    top() { return scenes.top(); },
  };
}
