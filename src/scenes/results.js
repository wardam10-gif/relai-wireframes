import { W, H, TAU, clamp, roundRect, pointInRect, easeOutCubic } from '../util.js';
import { scenes } from './sceneManager.js';
import { save } from '../save.js';
import { starBurst } from '../juice.js';

export class Results {
  constructor(level, stars, coins) {
    this.name = 'results';
    this.level = level;
    this.stars = stars;
    this.coins = coins;
    this.t = 0;
    this.burstDone = [false, false, false];
    const bx = 70, bw = W - 140;
    this.btnNext = { x: bx, y: 560, w: bw, h: 68 };
    this.btnReplay = { x: bx, y: 646, w: bw, h: 54 };
    this.btnMap = { x: bx, y: 718, w: bw, h: 54 };
  }

  update(dt) { this.t += dt; }

  async goto(sceneName, levelId) {
    // lazy imports dodge the gameplay<->results module cycle
    if (sceneName === 'gameplay') {
      const { Gameplay } = await import('./gameplay.js');
      scenes.replace(new Gameplay(levelId));
    } else {
      const { MapScene } = await import('./map.js');
      scenes.replace(new MapScene());
    }
  }

  onPointer(e) {
    if (e.type !== 'down' || this.t < 0.6) return;
    if (this.level.id < 100 && pointInRect(e.x, e.y, this.btnNext)) this.goto('gameplay', this.level.id + 1);
    else if (pointInRect(e.x, e.y, this.btnReplay)) this.goto('gameplay', this.level.id);
    else if (pointInRect(e.x, e.y, this.btnMap)) this.goto('map');
  }

  render(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2c3e2a');
    g.addColorStop(1, '#17110c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#7ddb8a';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(this.level.id === 100 ? 'LEGENDARY!' : 'HOOF HEALED!', W / 2, 160);
    ctx.fillStyle = '#cbbfae';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(`Level ${this.level.id}${this.level.title ? ' — ' + this.level.title : ''}`, W / 2, 200);

    // stars pop in one by one
    for (let i = 0; i < 3; i++) {
      const delay = 0.3 + i * 0.35;
      const k = clamp((this.t - delay) / 0.3, 0, 1);
      const earned = i < this.stars;
      const x = W / 2 + (i - 1) * 90;
      const y = 300 + (i === 1 ? -18 : 0);
      const size = (i === 1 ? 46 : 38) * (earned ? easeOutCubic(k) : 1);
      if (earned && k >= 1 && !this.burstDone[i]) {
        this.burstDone[i] = true;
        starBurst(x, y);
      }
      this.drawStar(ctx, x, y, size, earned && k > 0 ? '#ffd23e' : 'rgba(255,255,255,.15)');
    }

    // coins tally
    const ck = clamp((this.t - 1.3) / 0.7, 0, 1);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.arc(W / 2 - 60, 420, 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8912a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`+${Math.round(this.coins * ck)}`, W / 2 - 30, 432);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#cbbfae';
    ctx.textAlign = 'center';
    ctx.fillText(`Total: ${save.coins} coins`, W / 2, 470);

    const btn = (b, label, color, enabled = true) => {
      ctx.globalAlpha = enabled ? 1 : 0.35;
      ctx.fillStyle = color;
      roundRect(ctx, b.x, b.y, b.w, b.h, 14);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 8);
      ctx.globalAlpha = 1;
    };
    btn(this.btnNext, this.level.id < 100 ? `Next: Level ${this.level.id + 1} ▶` : 'You beat the game!', '#4a9d5c', this.level.id < 100);
    btn(this.btnReplay, 'Replay (25% coins)', 'rgba(255,255,255,.16)');
    btn(this.btnMap, 'Level Map', 'rgba(255,255,255,.16)');
  }

  drawStar(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}
