import { W, H, TAU } from './util.js';

// Lightweight shared pools of visual feedback: particles, floating text,
// screen shake, red vignette flash. Owned per-gameplay-scene via reset().

const particles = [];
const floats = [];
let shakeT = 0, shakeDur = 0, shakeMag = 0;
let vignette = 0;

export function resetJuice() {
  particles.length = 0;
  floats.length = 0;
  shakeT = 0; vignette = 0;
}

export function screenShake(mag = 8, ms = 250) {
  shakeMag = mag; shakeDur = ms / 1000; shakeT = shakeDur;
}

export function vignetteFlash() { vignette = 1; }

export function spawnParticles(x, y, { count = 10, colors = ['#6e5138'], speed = 120, life = 0.7, size = 5, gravity = 300, spread = TAU, baseAngle = 0 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = baseAngle + (Math.random() - 0.5) * spread;
    const s = speed * (0.4 + Math.random() * 0.9);
    particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: life * (0.6 + Math.random() * 0.6), t: 0,
      size: size * (0.5 + Math.random()),
      color: colors[(Math.random() * colors.length) | 0],
      gravity,
    });
  }
}

export function dirtBurst(x, y)   { spawnParticles(x, y, { count: 8, colors: ['#5a4632', '#6e5138', '#3f3126'], speed: 140 }); }
export function waterBurst(x, y)  { spawnParticles(x, y, { count: 6, colors: ['#7ec8e3', '#b3e5f5'], speed: 90, gravity: 400, size: 4 }); }
export function sparkle(x, y)     { spawnParticles(x, y, { count: 14, colors: ['#ffe98a', '#fff6d0', '#ffd23e'], speed: 160, gravity: 40, life: 0.5, size: 4 }); }
export function filings(x, y)     { spawnParticles(x, y, { count: 4, colors: ['#d8c9a8', '#c4b18a'], speed: 60, gravity: 250, size: 3, life: 0.4 }); }
export function greenFizz(x, y)   { spawnParticles(x, y, { count: 12, colors: ['#7ddb8a', '#b8f0c0'], speed: 70, gravity: -60, life: 0.8, size: 4 }); }
export function sparks(x, y)      { spawnParticles(x, y, { count: 8, colors: ['#ffd23e', '#ff9d2e'], speed: 200, gravity: 500, life: 0.3, size: 3 }); }

export function floatText(x, y, text, color = '#fff', big = false) {
  floats.push({ x, y, text, color, t: 0, life: 1.1, big });
}

export function starBurst(x, y) {
  spawnParticles(x, y, { count: 24, colors: ['#ffd23e', '#ffe98a', '#fff'], speed: 240, gravity: 100, life: 0.8, size: 5 });
}

export function updateJuice(dt) {
  if (shakeT > 0) shakeT -= dt;
  if (vignette > 0) vignette = Math.max(0, vignette - dt * 2.2);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.t += dt;
    if (f.t >= f.life) floats.splice(i, 1);
  }
}

export function getShakeOffset() {
  if (shakeT <= 0) return { x: 0, y: 0 };
  const k = shakeMag * (shakeT / shakeDur);
  return { x: (Math.random() - 0.5) * 2 * k, y: (Math.random() - 0.5) * 2 * k };
}

export function renderJuice(ctx) {
  for (const p of particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const f of floats) {
    const k = f.t / f.life;
    ctx.globalAlpha = 1 - k * k;
    ctx.font = `bold ${f.big ? 34 : 22}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.lineWidth = 4;
    const y = f.y - 46 * k;
    ctx.strokeText(f.text, f.x, y);
    ctx.fillText(f.text, f.x, y);
  }
  ctx.globalAlpha = 1;
}

export function renderVignette(ctx) {
  if (vignette <= 0) return;
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.62);
  g.addColorStop(0, 'rgba(200,30,30,0)');
  g.addColorStop(1, `rgba(200,30,30,${0.55 * vignette})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
