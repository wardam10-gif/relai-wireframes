import { Tool } from './toolBase.js';
import { TAU, normAngle, angleDiff, roundRect } from '../util.js';
import { sfx } from '../audio.js';
import { sparkle } from '../juice.js';

export class Bandage extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Drag in circles around the hoof to wrap it!';
    this.wraps = 0;
    this.partial = 0;      // radians of the current wrap
    this.dir = 0;          // locked direction: +1 / -1
    this.lastA = null;
    this.done = this.level.wrapTurns === 0;
  }

  onPointer(e) {
    this.trackPointer(e);
    if (this.done) return;
    if (e.type === 'down') { this.lastA = null; this.dir = 0; }
    if (e.type !== 'move' || !e.down) return;
    const a = normAngle(Math.atan2(e.y - this.hoof.cy, e.x - this.hoof.cx));
    if (this.lastA !== null) {
      const d = angleDiff(a, this.lastA);
      if (Math.abs(d) < 1.0) {
        if (this.dir === 0 && Math.abs(this.partial + d) > 0.4) this.dir = Math.sign(this.partial + d);
        if (this.dir !== 0 && Math.sign(d) !== this.dir && Math.abs(d) > 0.05) {
          // reversed: current band unravels
          if (this.partial > 0.6) sfx.thud();
          this.partial = 0;
        } else {
          this.partial += Math.abs(d);
        }
        if (this.partial >= TAU) {
          this.partial -= TAU;
          this.wraps++;
          sfx.pop();
          if (this.wraps >= this.level.wrapTurns) {
            this.done = true;
            sparkle(this.hoof.cx, this.hoof.cy - this.hoof.ry * 0.4);
            sfx.ding();
          }
        }
      }
    }
    this.lastA = a;
  }

  renderBands(ctx, count, partialFrac) {
    const { hoof } = this;
    const total = this.level.wrapTurns || 1;
    for (let i = 0; i < count + (partialFrac > 0 ? 1 : 0); i++) {
      const isPartial = i === count;
      const y = hoof.cy - hoof.ry * 0.45 + (i * (hoof.ry * 1.1)) / (total + 0.5);
      ctx.save();
      ctx.globalAlpha = isPartial ? 0.4 + 0.5 * partialFrac : 0.95;
      ctx.translate(hoof.cx, y);
      ctx.rotate(i % 2 === 0 ? 0.06 : -0.06);
      const w = (hoof.rx * 2 + 26) * (isPartial ? partialFrac : 1);
      ctx.fillStyle = '#f2ead8';
      ctx.strokeStyle = 'rgba(160,140,110,.6)';
      ctx.lineWidth = 2;
      roundRect(ctx, -w / 2, -14, w, 28, 10);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  render(ctx) {
    this.renderBands(ctx, this.wraps, this.partial / TAU);
    if (!this.done) {
      // circular guide hint
      ctx.setLineDash([8, 10]);
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.hoof.cx, this.hoof.cy, this.hoof.rx + 42, this.hoof.ry + 42, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Wraps: ${this.wraps}/${this.level.wrapTurns}`, this.hoof.cx, this.hoof.cy + this.hoof.ry + 74);
    }
  }

  progress() {
    return Math.min(1, (this.wraps + this.partial / TAU) / (this.level.wrapTurns || 1));
  }
}
