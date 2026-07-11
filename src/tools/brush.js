import { Tool } from './toolBase.js';
import { TAU, dist, normAngle, angleDiff } from '../util.js';
import { sfx } from '../audio.js';
import { waterBurst, sparkle } from '../juice.js';

export class Brush extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Scrub in circles to wash the grime!';
    this.spots = [];
    const n = this.level.scrubSpots;
    for (let i = 0; i < n; i++) {
      let p, tries = 0;
      do { p = this.hoof.randInside(0.72); tries++; }
      while (tries < 20 && this.spots.some(s => dist(s.x, s.y, p.x, p.y) < 64));
      this.spots.push({ x: p.x, y: p.y, revs: 0, need: this.level.scrubRevs, done: false, lastA: null });
    }
    this.done = n === 0;
  }

  onPointer(e) {
    this.trackPointer(e);
    if (e.type === 'down') for (const s of this.spots) s.lastA = null;
    if (e.type !== 'move' || !e.down) return;
    let best = null, bd = 84;
    for (const s of this.spots) {
      if (s.done) continue;
      const d = dist(s.x, s.y, e.x, e.y);
      if (d < bd) { bd = d; best = s; }
    }
    if (!best) return;
    const a = normAngle(Math.atan2(e.y - best.y, e.x - best.x));
    if (best.lastA !== null) {
      const d = Math.abs(angleDiff(a, best.lastA));
      if (d < 1.2) { // ignore jumps (crossing the center)
        best.revs += d / TAU;
        if (Math.random() < 0.15) waterBurst(e.x, e.y);
        if (best.revs >= best.need) {
          best.done = true;
          sfx.pop();
          sparkle(best.x, best.y);
          if (this.spots.every(s => s.done)) this.done = true;
        }
      }
    }
    best.lastA = a;
  }

  progress() {
    const tot = this.spots.reduce((a, s) => a + s.need, 0) || 1;
    return this.spots.reduce((a, s) => a + Math.min(s.revs, s.need), 0) / tot;
  }

  render(ctx) {
    const pulse = 0.75 + Math.sin(performance.now() / 300) * 0.25;
    for (const s of this.spots) {
      if (s.done) continue;
      const k = 1 - Math.min(1, s.revs / s.need);
      ctx.globalAlpha = 0.35 + 0.45 * k;
      ctx.fillStyle = '#4a5a3a';
      ctx.beginPath(); ctx.arc(s.x, s.y, 26 * (0.7 + 0.3 * k), 0, TAU); ctx.fill();
      ctx.globalAlpha = pulse * 0.9;
      ctx.strokeStyle = '#aee0ff';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, 34, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    if (this.pdown) {
      ctx.save();
      ctx.translate(this.px, this.py);
      ctx.fillStyle = '#c9743a';
      ctx.fillRect(-16, -10, 32, 14);
      ctx.fillStyle = '#f0e6d0';
      for (let i = -14; i <= 12; i += 5) ctx.fillRect(i, 4, 3, 10);
      ctx.restore();
    }
  }
}
