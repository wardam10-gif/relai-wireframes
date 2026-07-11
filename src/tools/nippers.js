import { Tool, alongStroke } from './toolBase.js';
import { TAU, dist } from '../util.js';
import { sfx } from '../audio.js';
import { spawnParticles, floatText } from '../juice.js';

export class Nippers extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Clip on the dotted line — avoid the red quick!';
    this.strokeFoul = false;
    this.done = this.hoof.overgrowth.every(s => s.cut);
  }

  movesLeft() { return this.hoof.overgrowth.filter(s => !s.cut).length; }

  onPointer(e) {
    this.trackPointer(e);
    if (e.type === 'down') this.strokeFoul = false;
    if (e.type !== 'move' || !e.down) return;
    const { hoof, level } = this;
    alongStroke(e, 8, (x, y) => {
      if (this.done) return;
      const theta = Math.atan2(y - hoof.cy, x - hoof.cx);
      const r = dist(hoof.cx, hoof.cy, x, y);
      const rimR = hoof.radiusAt(theta);
      const seg = hoof.segmentAt(theta);
      if (!seg || seg.cut) return;
      if (Math.abs(r - rimR) <= level.guideTolerancePx) {
        // committed cut attempt
        if (this.game.isFlinching()) {
          if (!this.strokeFoul) { this.strokeFoul = true; this.game.mistake('The hoof jerked!'); }
          return;
        }
        seg.cut = true;
        this.game.spendMove();
        sfx.chunk();
        spawnParticles(seg.mid.x, seg.mid.y, {
          count: 7, colors: ['#c7a86f', '#8a713f'], speed: 220,
          baseAngle: Math.atan2(seg.mid.y - hoof.cy, seg.mid.x - hoof.cx), spread: 1.2, gravity: 500, size: 7,
        });
        if (this.hoof.overgrowth.every(s => s.cut)) this.done = true;
      } else if (!this.strokeFoul &&
                 r < rimR - level.quickDistancePx &&
                 r > rimR - level.quickDistancePx - 28) {
        this.strokeFoul = true;
        this.game.mistake('You cut into the quick!');
        floatText(x, y, 'Too deep!', '#ff6b5e');
      }
    });
  }

  render(ctx) {
    const { hoof, level } = this;
    // guide line over uncut segments
    ctx.setLineDash([7, 7]);
    ctx.lineWidth = 3;
    for (const seg of hoof.overgrowth) {
      if (seg.cut) continue;
      ctx.strokeStyle = '#ffe98a';
      ctx.beginPath();
      for (let a = seg.a0; a <= seg.a1 + 0.001; a += 0.08) {
        const p = hoof.rimPoint(a, 4);
        a === seg.a0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // quick line (danger boundary)
    if (hoof.overgrowth.some(s => !s.cut)) {
      ctx.strokeStyle = 'rgba(255,80,70,.65)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let a = 0; a <= TAU + 0.001; a += 0.08) {
        const p = hoof.rimPoint(a, -level.quickDistancePx);
        a === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (this.pdown) {
      ctx.save();
      ctx.translate(this.px, this.py);
      ctx.rotate(0.4);
      ctx.strokeStyle = '#9aa2ac';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-16, -40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(16, -40); ctx.stroke();
      ctx.fillStyle = '#c8ced8';
      ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(0, 14); ctx.lineTo(8, 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  progress() {
    const n = this.hoof.overgrowth.length || 1;
    return this.hoof.overgrowth.filter(s => s.cut).length / n;
  }
}
