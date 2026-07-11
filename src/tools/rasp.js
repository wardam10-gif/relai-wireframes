import { Tool } from './toolBase.js';
import { sfx } from '../audio.js';
import { filings } from '../juice.js';
import { roundRect } from '../util.js';

export class Rasp extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'File back and forth to smooth the edge!';
    const { hoof } = this;
    this.zone = {
      x: hoof.cx - hoof.rx - 20,
      y: hoof.cy + hoof.ry * 0.45,
      w: hoof.rx * 2 + 40,
      h: hoof.ry * 0.55 + 50,
    };
    this.count = 0;
    this.lastSign = 0;
    this.fouled = false;
    this.finished = false;
    this.done = this.level.raspTarget === 0;
  }

  inZone(x, y) {
    const z = this.zone;
    return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
  }

  onPointer(e) {
    this.trackPointer(e);
    if (e.type !== 'move' || !e.down || !this.inZone(e.x, e.y)) return;
    if (Math.abs(e.dx) < 4) return;
    const sign = Math.sign(e.dx);
    if (this.lastSign !== 0 && sign !== this.lastSign) {
      this.count++;
      filings(e.x, e.y);
      sfx.scrape();
      if (!this.finished && this.count >= this.level.raspTarget) {
        this.finished = true;
        this.done = true;
        sfx.ding();
      } else if (this.finished && this.level.overRaspPenalty && !this.fouled &&
                 this.count > this.level.raspTarget + 10) {
        this.fouled = true;
        this.game.mistake('Over-rasped! Easy does it.');
      }
    }
    this.lastSign = sign;
  }

  render(ctx) {
    const k = Math.min(1, this.count / (this.level.raspTarget || 1));
    if (!this.done) {
      // rough edge overlay along the heel, fading as you smooth it
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#8a6a45';
      ctx.lineWidth = 5;
      ctx.beginPath();
      const { hoof } = this;
      for (let a = Math.PI * 0.15; a <= Math.PI * 0.85; a += 0.12) {
        const jag = (a * 37 % 1) * 10;
        const p = hoof.rimPoint(a, 3 + jag);
        a <= Math.PI * 0.16 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 300);
      ctx.fillStyle = '#ffe98a';
      roundRect(ctx, this.zone.x, this.zone.y, this.zone.w, this.zone.h, 16);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // progress meter
    const mx = 90, my = 700, mw = 300, mh = 16;
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    roundRect(ctx, mx, my, mw, mh, 8); ctx.fill();
    ctx.fillStyle = this.finished ? '#7ddb8a' : '#ffd23e';
    if (k > 0) { roundRect(ctx, mx, my, mw * k, mh, 8); ctx.fill(); }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMOOTH', mx + mw / 2, my - 6);

    if (this.pdown) {
      ctx.save();
      ctx.translate(this.px, this.py);
      ctx.fillStyle = '#9aa2ac';
      roundRect(ctx, -34, -9, 68, 18, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(60,60,70,.6)';
      ctx.lineWidth = 1.5;
      for (let i = -28; i <= 28; i += 7) {
        ctx.beginPath(); ctx.moveTo(i, -7); ctx.lineTo(i + 4, 7); ctx.stroke();
      }
      ctx.restore();
    }
  }

  progress() { return Math.min(1, this.count / (this.level.raspTarget || 1)); }
}
