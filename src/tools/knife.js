import { Tool } from './toolBase.js';
import { TAU, dist, mulberry32 } from '../util.js';
import { sfx } from '../audio.js';
import { sparkle, filings, floatText } from '../juice.js';

export class Knife extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Trace the dotted path to pare away the bad sole!';
    const rng = mulberry32(this.level.id * 31 + 5);
    const { hoof } = this;

    this.paths = [];
    for (let i = 0; i < this.level.knifePaths; i++) {
      const a0 = rng() * TAU;
      const a1 = a0 + Math.PI * (0.7 + rng() * 0.6);
      const r0 = 0.45 + rng() * 0.25, r1 = 0.45 + rng() * 0.25;
      const p0 = { x: hoof.cx + Math.cos(a0) * hoof.rx * r0, y: hoof.cy + Math.sin(a0) * hoof.ry * r0 };
      const p1 = { x: hoof.cx + Math.cos(a1) * hoof.rx * r1, y: hoof.cy + Math.sin(a1) * hoof.ry * r1 };
      const cpx = hoof.cx + (rng() - 0.5) * hoof.rx * 0.6;
      const cpy = hoof.cy + (rng() - 0.5) * hoof.ry * 0.6;
      const pts = [];
      const N = 22;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * cpx + t * t * p1.x;
        const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * cpy + t * t * p1.y;
        pts.push({ x, y });
      }
      this.paths.push({ pts, idx: 0, checkpoint: 0, complete: false });
      // paint the disease this path will carve away
      for (let k = 0; k < pts.length; k += 3) {
        hoof.paintDiseaseBlob(pts[k].x, pts[k].y, 30, rng() > 0.5);
      }
    }

    // sensitive zones: pink no-go circles away from every path
    this.zones = [];
    for (let z = 0; z < this.level.sensitiveZones; z++) {
      let p, tries = 0;
      do { p = hoof.randInside(0.6); tries++; }
      while (tries < 30 && this.paths.some(path => path.pts.some(pt => dist(pt.x, pt.y, p.x, p.y) < 54)));
      if (tries < 30) this.zones.push({ x: p.x, y: p.y, r: 24 });
    }

    this.strayT = 0;
    this.strokeFoul = false;
    this.done = this.paths.length === 0;
  }

  movesLeft() { return this.paths.filter(p => !p.complete).length; }

  current() { return this.paths.find(p => !p.complete) || null; }

  onPointer(e) {
    this.trackPointer(e);
    if (e.type === 'down') { this.strokeFoul = false; this.strayT = 0; }
    if (e.type !== 'move' || !e.down) return;
    const path = this.current();
    if (!path) return;
    const width = this.level.knifePathWidth;

    // sensitive zone contact
    if (!this.strokeFoul) {
      for (const z of this.zones) {
        if (dist(z.x, z.y, e.x, e.y) < z.r + 6) {
          this.strokeFoul = true;
          this.game.mistake('That spot is sensitive!');
          floatText(e.x, e.y, 'Ouch!', '#ff6b5e');
          return;
        }
      }
    }

    // advance along the path while the blade stays on it
    let advanced = false;
    while (path.idx < path.pts.length && dist(path.pts[path.idx].x, path.pts[path.idx].y, e.x, e.y) <= width) {
      const pt = path.pts[path.idx];
      this.hoof.eraseDisease(pt.x, pt.y, width * 0.95);
      if (path.idx % 4 === 0) filings(pt.x, pt.y);
      path.idx++;
      if (path.idx % 5 === 0) path.checkpoint = path.idx;
      advanced = true;
    }
    if (advanced) {
      this.strayT = 0;
      if (path.idx >= path.pts.length) {
        path.complete = true;
        this.game.spendMove();
        sfx.ding();
        sparkle(e.x, e.y);
        if (!this.current()) this.done = true;
      }
    }
  }

  update(dt) {
    const path = this.current();
    if (!path || !this.pdown || path.idx === 0) { this.strayT = 0; return; }
    const target = path.pts[Math.min(path.idx, path.pts.length - 1)];
    if (dist(target.x, target.y, this.px, this.py) > this.level.knifePathWidth * 1.6) {
      this.strayT += dt;
      if (this.strayT > 0.15) {
        // slipped off the line: back to the last checkpoint
        path.idx = path.checkpoint;
        this.strayT = 0;
        sfx.thud();
      }
    } else {
      this.strayT = 0;
    }
  }

  render(ctx) {
    const path = this.current();
    for (const z of this.zones) {
      const pulse = 0.5 + Math.sin(performance.now() / 250) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff8fa0';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,140,.25)';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (path) {
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = '#fff2c8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = path.idx; k < path.pts.length; k++) {
        const p = path.pts[k];
        k === path.idx ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      const start = path.pts[Math.min(path.idx, path.pts.length - 1)];
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.arc(start.x, start.y, 9, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (this.pdown) {
      ctx.save();
      ctx.translate(this.px, this.py);
      ctx.rotate(-0.5);
      ctx.fillStyle = '#7a5c3a';
      ctx.fillRect(-4, -46, 9, 30);
      ctx.fillStyle = '#c8ced8';
      ctx.beginPath();
      ctx.moveTo(-3, -16); ctx.quadraticCurveTo(14, -2, 2, 12); ctx.lineTo(-4, 8); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  progress() {
    const tot = this.paths.reduce((a, p) => a + p.pts.length, 0) || 1;
    return this.paths.reduce((a, p) => a + (p.complete ? p.pts.length : p.idx), 0) / tot;
  }
}
