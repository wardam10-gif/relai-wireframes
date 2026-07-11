import { Tool } from './toolBase.js';
import { TAU, dist, angleDiff, clamp, mulberry32 } from '../util.js';
import { sfx } from '../audio.js';
import { spawnParticles, floatText } from '../juice.js';

export class Tweezers extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Hold the stone and pull along the arrow — steady!';
    const rng = mulberry32(this.level.id * 53 + 11);
    this.stones = [];
    for (let i = 0; i < this.level.stones; i++) {
      let p, tries = 0;
      do { p = this.hoof.randInside(0.55); tries++; }
      while (tries < 20 && this.stones.some(s => dist(s.x, s.y, p.x, p.y) < 80));
      const verts = [];
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU;
        const r = 12 + rng() * 8;
        verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      this.stones.push({ x: p.x, y: p.y, angle: rng() * TAU, out: false, verts });
    }
    this.holding = null;
    this.ext = 0;
    this.wobble = 0;
    this.done = this.stones.length === 0;
  }

  movesLeft() { return this.stones.filter(s => !s.out).length; }

  onPointer(e) {
    this.trackPointer(e);
    const { level } = this;

    if (e.type === 'down') {
      for (const s of this.stones) {
        if (!s.out && dist(s.x, s.y, e.x, e.y) < 44) {
          if (this.game.isFlinching()) { this.game.mistake('The hoof jerked!'); return; }
          this.holding = s;
          this.ext = 0;
          this.wobble = 0;
          this.game.spendMove(); // every extraction attempt costs a move
          return;
        }
      }
    }

    if (e.type === 'move' && e.down && this.holding) {
      const s = this.holding;
      const vx = e.x - s.x, vy = e.y - s.y;
      const len = Math.hypot(vx, vy);
      if (len < 14) return;
      const off = Math.abs(angleDiff(Math.atan2(vy, vx), s.angle));
      if (off <= 0.35) {
        this.ext = clamp(len / 90, 0, 1);
        this.wobble = Math.max(0, this.wobble - 0.01);
        if (this.ext >= 1) {
          s.out = true;
          this.holding = null;
          sfx.pop();
          spawnParticles(s.x, s.y, {
            count: 10, colors: ['#8a8f98', '#6a6f78'], speed: 260,
            baseAngle: s.angle, spread: 0.8, gravity: 600, size: 6,
          });
          floatText(s.x, s.y, 'Got it!', '#7ddb8a');
          if (this.stones.every(st => st.out)) this.done = true;
        }
      } else {
        this.wobble += (off - 0.3) * 0.12 * (0.5 + level.stoneWiggle);
        if (this.wobble >= 1) {
          this.holding = null;
          this.ext = 0;
          this.game.mistake('It re-lodged! Pull along the arrow.');
        }
      }
    }

    if (e.type === 'up' && this.holding) {
      this.holding = null; // slipped out of grip — the attempt move is spent
      this.ext = 0;
      sfx.thud();
    }
  }

  render(ctx) {
    for (const s of this.stones) {
      if (s.out) continue;
      const pullOff = this.holding === s ? this.ext * 20 : 0;
      const ox = s.x + Math.cos(s.angle) * pullOff;
      const oy = s.y + Math.sin(s.angle) * pullOff;
      // stone
      ctx.fillStyle = '#787d86';
      ctx.strokeStyle = '#4a4e56';
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.verts.forEach((v, i) => i === 0 ? ctx.moveTo(ox + v.x, oy + v.y) : ctx.lineTo(ox + v.x, oy + v.y));
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // pull-direction arrow
      const wob = Math.sin(performance.now() / 200) * 4;
      const ax = ox + Math.cos(s.angle) * (46 + wob);
      const ay = oy + Math.sin(s.angle) * (46 + wob);
      ctx.strokeStyle = '#ffd23e';
      ctx.fillStyle = '#ffd23e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ox + Math.cos(s.angle) * 24, oy + Math.sin(s.angle) * 24);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(s.angle);
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-4, -7); ctx.lineTo(-4, 7); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // wobble meter while holding
    if (this.holding) {
      const s = this.holding;
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(s.x - 30, s.y - 58, 60, 9);
      ctx.fillStyle = this.wobble > 0.6 ? '#ff6b5e' : '#ffd23e';
      ctx.fillRect(s.x - 30, s.y - 58, 60 * Math.min(1, this.wobble), 9);
    }
    if (this.pdown) {
      ctx.save();
      ctx.translate(this.px, this.py);
      ctx.rotate(0.5);
      ctx.strokeStyle = '#c8ced8';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -38); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -38); ctx.stroke();
      ctx.restore();
    }
  }

  progress() {
    const n = this.stones.length || 1;
    return this.stones.filter(s => s.out).length / n;
  }
}
