import { W, H, TAU, roundRect, pointInRect } from '../util.js';
import { scenes } from './sceneManager.js';
import { save, persist } from '../save.js';

const PLAY_BTN = { x: 110, y: 560, w: W - 220, h: 84 };
const SOUND_BTN = { x: 160, y: 672, w: W - 320, h: 50 };

export class Menu {
  constructor() { this.name = 'menu'; }

  onPointer(e) {
    if (e.type !== 'down') return;
    if (pointInRect(e.x, e.y, PLAY_BTN)) {
      import('./map.js').then(({ MapScene }) => scenes.replace(new MapScene()));
    } else if (pointInRect(e.x, e.y, SOUND_BTN)) {
      save.sound = !save.sound;
      persist();
    }
  }

  update() {}

  render(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8fb8d8');
    g.addColorStop(0.55, '#c8d8a8');
    g.addColorStop(0.56, '#6a8a4a');
    g.addColorStop(1, '#3a5228');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // sun
    ctx.fillStyle = 'rgba(255,240,180,.9)';
    ctx.beginPath(); ctx.arc(W - 90, 100, 46, 0, TAU); ctx.fill();

    // cow face
    const cx = W / 2, cy = 330;
    const bob = Math.sin(performance.now() / 600) * 6;
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = '#f5f0e6';
    ctx.strokeStyle = 'rgba(60,40,25,.4)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy, 92, 76, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2f28';
    ctx.beginPath(); ctx.ellipse(cx - 46, cy - 30, 26, 34, 0.5, 0, TAU); ctx.fill();
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#f5f0e6';
      ctx.beginPath(); ctx.ellipse(cx + s * 88, cy - 42, 26, 14, s * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8b8b0';
      ctx.beginPath(); ctx.ellipse(cx + s * 88, cy - 42, 14, 7, s * 0.5, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#e8b8b0';
    ctx.beginPath(); ctx.ellipse(cx, cy + 34, 52, 32, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a4030';
    ctx.beginPath(); ctx.arc(cx - 20, cy + 30, 6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 20, cy + 30, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1d12';
    ctx.beginPath(); ctx.arc(cx - 28, cy - 14, 8, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 28, cy - 14, 8, 0, TAU); ctx.fill();
    ctx.restore();

    // title
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(40,25,10,.35)';
    ctx.font = 'bold 68px system-ui, sans-serif';
    ctx.fillText('HOOF HERO', W / 2 + 4, 140 + 4);
    ctx.fillStyle = '#fff8e8';
    ctx.fillText('HOOF HERO', W / 2, 140);
    ctx.fillStyle = '#4a3a20';
    ctx.font = 'bold 21px system-ui, sans-serif';
    ctx.fillText('scrape · trim · heal · shoe', W / 2, 182);

    // play
    const pulse = 1 + Math.sin(performance.now() / 400) * 0.02;
    ctx.save();
    ctx.translate(W / 2, PLAY_BTN.y + PLAY_BTN.h / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#4a9d5c';
    roundRect(ctx, -PLAY_BTN.w / 2, -PLAY_BTN.h / 2, PLAY_BTN.w, PLAY_BTN.h, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText('PLAY', 0, 12);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,.18)';
    roundRect(ctx, SOUND_BTN.x, SOUND_BTN.y, SOUND_BTN.w, SOUND_BTN.h, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`Sound: ${save.sound ? 'ON' : 'OFF'}`, W / 2, SOUND_BTN.y + 32);

    const done = Object.keys(save.stars).length;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${done}/100 hooves healed · ${save.coins} coins`, W / 2, 780);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('prototype build — add ?reset to the URL to wipe progress', W / 2, 812);
  }
}
