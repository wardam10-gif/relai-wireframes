import { Tool, alongStroke } from './toolBase.js';
import { TAU, dist } from '../util.js';
import { sfx } from '../audio.js';
import { waterBurst, sparkle } from '../juice.js';

export class Brush extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Rub the grime spots to scrub them clean!';
    this.spots = [];
    const n = this.level.scrubSpots;
    for (let i = 0; i < n; i++) {
      let p, tries = 0;
      do { p = this.hoof.randInside(0.72); tries++; }
      while (tries < 20 && this.spots.some(s => dist(s.x, s.y, p.x, p.y) < 64));
      // "need" is pixels of rubbing; any drag motion over the spot counts
      this.spots.push({ x: p.x, y: p.y, got: 0, need: 280 * this.level.scrubRevs, done: false });
    }
    this.done = n === 0;
    this.sfxT = 0;
  }

  onPointer(e) {
    this.trackPointer(e);
    if (e.type !== 'move' || !e.down) return;
    alongStroke(e, 8, (x, y) => {
      for (const s of this.spots) {
        if (s.done || dist(s.x, s.y, x, y) > 64) continue;
        s.got += 8;
        if (Math.random() < 0.06) waterBurst(x, y);
        if (this.sfxT <= 0) { sfx.scrape(); this.sfxT = 0.1; }
        if (s.got >= s.need) {
          s.done = true;
          sfx.pop();
          sparkle(s.x, s.y);
          if (this.spots.every(sp => sp.done)) this.done = true;
        }
      }
    });
  }

  update(dt) { this.sfxT -= dt; }

  progress() {
    const tot = this.spots.reduce((a, s) => a + s.need, 0) || 1;
    return this.spots.reduce((a, s) => a + Math.min(s.got, s.need), 0) / tot;
  }

  render(ctx) {
    const pulse = 0.75 + Math.sin(performance.now() / 300) * 0.25;
    for (const s of this.spots) {
      if (s.done) continue;
      const k = 1 - Math.min(1, s.got / s.need);
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
