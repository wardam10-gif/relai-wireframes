import { Tool } from './toolBase.js';
import { TAU, dist, easeOutCubic } from '../util.js';
import { sfx } from '../audio.js';
import { sparks, sparkle, floatText } from '../juice.js';

// Horseshoe kit: three sub-stages in one step.
//   pry   — flick the pry bar outward at each clip point to pop the old shoe
//   place — drag the new shoe from the tray onto the ghost outline
//   nail  — tap the numbered nail holes in order
export class Shoe extends Tool {
  constructor(game) {
    super(game);
    const cfg = this.level.shoe;
    this.cfg = cfg;
    this.stage = 'pry';
    this.hint = 'Flick outward at the glowing clips to pry the old shoe off!';

    const { hoof } = this;
    this.shoeR = { x: hoof.rx * 0.8, y: hoof.ry * 0.72 };
    this.shoeTarget = { x: hoof.cx, y: hoof.cy - hoof.ry * 0.1 };

    this.pryPts = [];
    for (let i = 0; i < cfg.pryPoints; i++) {
      // clips around the toe arc (top half of the shoe)
      const a = Math.PI + ((i + 0.5) / cfg.pryPoints) * Math.PI;
      this.pryPts.push({
        x: this.shoeTarget.x + Math.cos(a) * this.shoeR.x,
        y: this.shoeTarget.y + Math.sin(a) * this.shoeR.y,
        a, popped: false,
      });
    }
    this.armed = null;
    this.armX = 0; this.armY = 0;

    this.fallT = -1;          // old shoe falling animation
    this.tray = { x: hoof.cx, y: 760 };
    this.dragging = false;
    this.dragX = this.tray.x; this.dragY = this.tray.y;
    this.placed = false;

    this.nails = [];
    for (let i = 0; i < cfg.nailCount; i++) {
      const a = Math.PI + ((i + 0.5) / cfg.nailCount) * Math.PI;
      this.nails.push({
        x: this.shoeTarget.x + Math.cos(a) * this.shoeR.x,
        y: this.shoeTarget.y + Math.sin(a) * this.shoeR.y,
        driven: false,
      });
    }
    this.nailIdx = 0;
  }

  movesLeft() {
    if (this.stage === 'pry') return this.pryPts.filter(p => !p.popped).length + this.cfg.nailCount;
    if (this.stage === 'nail') return this.cfg.nailCount - this.nailIdx;
    return this.cfg.nailCount;
  }

  onPointer(e) {
    this.trackPointer(e);

    if (this.stage === 'pry') {
      if (e.type === 'down') {
        const p = this.pryPts.find(p => !p.popped && dist(p.x, p.y, e.x, e.y) < 42);
        if (p) { this.armed = p; this.armX = e.x; this.armY = e.y; }
      } else if (e.type === 'move' && e.down && this.armed) {
        const dx = e.x - this.armX, dy = e.y - this.armY;
        const len = Math.hypot(dx, dy);
        // flick must go outward from the shoe center
        const outX = Math.cos(this.armed.a), outY = Math.sin(this.armed.a);
        if (len > 46 && (dx * outX + dy * outY) / len > 0.35) {
          if (this.game.isFlinching()) {
            this.game.mistake('The hoof jerked!');
          } else {
            this.armed.popped = true;
            this.game.spendMove();
            sfx.clank();
            sparks(this.armed.x, this.armed.y);
            if (this.pryPts.every(p => p.popped)) {
              this.fallT = 0;
              sfx.thud();
            }
          }
          this.armed = null;
        }
      } else if (e.type === 'up') {
        this.armed = null;
      }
      return;
    }

    if (this.stage === 'place') {
      if (e.type === 'down' && dist(this.dragX, this.dragY, e.x, e.y) < 70) {
        this.dragging = true;
      } else if (e.type === 'move' && e.down && this.dragging) {
        this.dragX = e.x; this.dragY = e.y;
      } else if (e.type === 'up' && this.dragging) {
        this.dragging = false;
        if (dist(this.dragX, this.dragY, this.shoeTarget.x, this.shoeTarget.y) < 26) {
          this.placed = true;
          this.dragX = this.shoeTarget.x; this.dragY = this.shoeTarget.y;
          sfx.clank();
          sparkle(this.shoeTarget.x, this.shoeTarget.y);
          if (this.cfg.nailCount === 0) {
            this.done = true;
          } else {
            this.stage = 'nail';
            this.hint = 'Tap the glowing nail holes in order!';
          }
        } else {
          this.dragX = this.tray.x; this.dragY = this.tray.y; // back to the tray
          sfx.thud();
        }
      }
      return;
    }

    if (this.stage === 'nail' && e.type === 'down') {
      const cur = this.nails[this.nailIdx];
      if (!cur) return;
      this.game.spendMove(); // every nail tap is a committed action
      if (!this.game.isFlinching() && dist(cur.x, cur.y, e.x, e.y) <= this.cfg.nailTolerancePx) {
        cur.driven = true;
        this.nailIdx++;
        sfx.clank();
        sparks(cur.x, cur.y);
        if (this.nailIdx >= this.nails.length) {
          this.done = true;
          floatText(this.hoof.cx, this.hoof.cy, 'Shod!', '#7ddb8a');
        }
      } else {
        this.game.mistake(this.game.isFlinching() ? 'The hoof jerked!' : 'Mis-nailed!');
      }
    }
  }

  update(dt) {
    if (this.fallT >= 0 && this.stage === 'pry') {
      this.fallT += dt;
      if (this.fallT > 0.7) {
        this.stage = 'place';
        this.hint = 'Drag the new shoe onto the outline!';
      }
    }
  }

  drawShoe(ctx, x, y, alpha = 1, old = false) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = old ? '#5f6470' : '#aab2c0';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(x, y, this.shoeR.x, this.shoeR.y, 0, Math.PI * 0.92, Math.PI * 2.08);
    ctx.stroke();
    ctx.strokeStyle = old ? '#494d58' : '#7e8694';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(x, y, this.shoeR.x, this.shoeR.y, 0, Math.PI * 0.92, Math.PI * 2.08);
    ctx.stroke();
    ctx.restore();
  }

  render(ctx) {
    const t = performance.now();

    if (this.stage === 'pry') {
      let fy = 0, frot = 0, alpha = 1;
      if (this.fallT >= 0) {
        const k = easeOutCubic(Math.min(1, this.fallT / 0.7));
        fy = k * 400; frot = k * 0.5; alpha = 1 - k;
      }
      ctx.save();
      ctx.translate(this.shoeTarget.x, this.shoeTarget.y + fy);
      ctx.rotate(frot);
      ctx.translate(-this.shoeTarget.x, -this.shoeTarget.y);
      this.drawShoe(ctx, this.shoeTarget.x, this.shoeTarget.y, alpha, true);
      ctx.restore();
      if (this.fallT < 0) {
        for (const p of this.pryPts) {
          if (p.popped) continue;
          const pulse = 0.6 + Math.sin(t / 250) * 0.3;
          ctx.globalAlpha = pulse;
          ctx.fillStyle = '#ffd23e';
          ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
          // outward arrow
          ctx.strokeStyle = '#ffd23e';
          ctx.lineWidth = 3;
          const ox = Math.cos(p.a), oy = Math.sin(p.a);
          ctx.beginPath();
          ctx.moveTo(p.x + ox * 18, p.y + oy * 18);
          ctx.lineTo(p.x + ox * 38, p.y + oy * 38);
          ctx.stroke();
        }
      }
      return;
    }

    if (this.stage === 'place') {
      // ghost outline
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(this.shoeTarget.x, this.shoeTarget.y, this.shoeR.x, this.shoeR.y, 0, Math.PI * 0.92, Math.PI * 2.08);
      ctx.stroke();
      ctx.setLineDash([]);
      // tray
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath();
      ctx.ellipse(this.tray.x, this.tray.y, 110, 40, 0, 0, TAU);
      ctx.fill();
      this.drawShoe(ctx, this.dragX, this.dragY);
      return;
    }

    // nail stage
    this.drawShoe(ctx, this.shoeTarget.x, this.shoeTarget.y);
    this.nails.forEach((n, i) => {
      if (n.driven) {
        ctx.fillStyle = '#3d424c';
        ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, TAU); ctx.fill();
        return;
      }
      const active = i === this.nailIdx;
      const pulse = active ? 0.7 + Math.sin(t / 200) * 0.3 : 0.35;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = active ? '#ffd23e' : '#d8d8d8';
      ctx.beginPath(); ctx.arc(n.x, n.y, active ? 12 : 8, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1d1812';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), n.x, n.y);
      ctx.textBaseline = 'alphabetic';
    });
  }

  progress() {
    const total = this.cfg.pryPoints + 1 + this.cfg.nailCount;
    let done = this.pryPts.filter(p => p.popped).length;
    if (this.placed) done += 1;
    done += this.nailIdx;
    return done / total;
  }
}
