import { Tool } from './toolBase.js';
import { TAU, dist, mulberry32 } from '../util.js';
import { sfx } from '../audio.js';
import { greenFizz, floatText } from '../juice.js';

export class Spray extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Hold to aim, release on the infection to spray!';
    const rng = mulberry32(this.level.id * 71 + 3);
    this.markers = [];
    for (let i = 0; i < this.level.sprayTargets; i++) {
      let p, tries = 0;
      do { p = this.hoof.randInside(0.7); tries++; }
      while (tries < 20 && this.markers.some(m => dist(m.x, m.y, p.x, p.y) < 70));
      this.markers.push({ x: p.x, y: p.y, treated: false, phase: rng() * TAU });
    }
    this.aiming = false;
    this.done = this.markers.length === 0;
  }

  movesLeft() { return this.markers.filter(m => !m.treated).length; }

  onPointer(e) {
    this.trackPointer(e);
    if (e.type === 'down') this.aiming = true;
    if (e.type === 'up' && this.aiming) {
      this.aiming = false;
      this.game.spendMove(); // every spray release is a committed action
      sfx.spray();
      if (this.game.isFlinching()) { this.game.mistake('The hoof jerked!'); return; }
      const hit = this.markers.find(m => !m.treated && dist(m.x, m.y, e.x, e.y) < 34);
      if (hit) {
        hit.treated = true;
        greenFizz(hit.x, hit.y);
        floatText(hit.x, hit.y, 'Treated!', '#7ddb8a');
        if (this.markers.every(m => m.treated)) this.done = true;
      } else {
        this.game.mistake('Missed the infection!');
      }
    }
  }

  render(ctx) {
    const t = performance.now();
    for (const m of this.markers) {
      if (m.treated) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#7ddb8a';
        ctx.beginPath(); ctx.arc(m.x, m.y, 14, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }
      const pulse = 1 + Math.sin(t / 220 + m.phase) * 0.18;
      ctx.fillStyle = 'rgba(190,60,80,.8)';
      ctx.beginPath(); ctx.arc(m.x, m.y, 15 * pulse, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,150,150,.55)';
      ctx.beginPath(); ctx.arc(m.x - 3, m.y - 3, 7 * pulse, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,120,.8)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, m.y, 26, t / 800 + m.phase, t / 800 + m.phase + TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (this.aiming) {
      // reticle
      ctx.strokeStyle = '#aef0b8';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.px, this.py, 30, 0, TAU); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.px - 40, this.py); ctx.lineTo(this.px - 20, this.py);
      ctx.moveTo(this.px + 20, this.py); ctx.lineTo(this.px + 40, this.py);
      ctx.moveTo(this.px, this.py - 40); ctx.lineTo(this.px, this.py - 20);
      ctx.moveTo(this.px, this.py + 20); ctx.lineTo(this.px, this.py + 40);
      ctx.stroke();
      // bottle
      ctx.save();
      ctx.translate(this.px + 44, this.py + 48);
      ctx.fillStyle = '#4a9dd8';
      ctx.fillRect(-10, -18, 20, 34);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(-6, -30, 12, 12);
      ctx.restore();
    }
  }

  progress() {
    const n = this.markers.length || 1;
    return this.markers.filter(m => m.treated).length / n;
  }
}
