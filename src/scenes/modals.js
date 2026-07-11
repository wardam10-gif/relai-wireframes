import { W, H, roundRect, pointInRect, clamp } from '../util.js';
import { scenes } from './sceneManager.js';
import { save, persist } from '../save.js';
import { rescueCost, RESCUE, IAP_PRICE, IAP_NAME, MAX_ADS_PER_ATTEMPT } from '../economy.js';
import { sfx } from '../audio.js';

function drawButton(ctx, b, enabled = true) {
  ctx.globalAlpha = enabled ? 1 : 0.4;
  ctx.fillStyle = b.color;
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.3)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = b.textColor || '#fff';
  ctx.font = `bold ${b.fontSize || 20}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  if (b.sub) {
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(b.sub, b.x + b.w / 2, b.y + b.h / 2 + 22);
  }
  ctx.globalAlpha = 1;
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(10,7,4,.72)';
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------------------
export class RescueModal {
  constructor(game, kind) {
    this.name = 'rescue';
    this.game = game;
    this.kind = kind; // 'moves' | 'time'
    const bx = 60, bw = W - 120;
    this.btnAd = { x: bx, y: 380, w: bw, h: 74, color: '#4a9d5c', label: '📺 Watch Ad (FREE)', sub: `+${RESCUE.ad.moves} moves, +${RESCUE.ad.time}s` };
    this.btnCoins = { x: bx, y: 470, w: bw, h: 74, color: '#c9922e', label: `🪙 Use ${rescueCost(game.level.id)} coins`, sub: `+${RESCUE.coins.moves} moves, +${RESCUE.coins.time}s (you have ${save.coins})` };
    this.btnIap = { x: bx, y: 560, w: bw, h: 74, color: '#7a4ac9', label: `✨ ${IAP_NAME} — ${IAP_PRICE}`, sub: `+${RESCUE.iap.moves} moves, +${RESCUE.iap.time}s` };
    this.btnGiveUp = { x: bx + 60, y: 668, w: bw - 120, h: 52, color: 'rgba(255,255,255,.14)', label: 'Give Up', fontSize: 17 };
  }

  adAvailable() { return this.game.adsUsed < MAX_ADS_PER_ATTEMPT; }
  coinsAvailable() { return save.coins >= rescueCost(this.game.level.id); }

  onPointer(e) {
    if (e.type !== 'down') return;
    if (this.adAvailable() && pointInRect(e.x, e.y, this.btnAd)) {
      scenes.push(new AdStub(() => {
        this.game.adsUsed++;
        save.adsWatched++;
        persist();
        this.close(RESCUE.ad);
      }));
    } else if (this.coinsAvailable() && pointInRect(e.x, e.y, this.btnCoins)) {
      save.coins -= rescueCost(this.game.level.id);
      persist();
      sfx.coin();
      this.close(RESCUE.coins);
    } else if (pointInRect(e.x, e.y, this.btnIap)) {
      scenes.push(new IapStub(() => {
        save.iapCount++;
        persist();
        console.log('[funnel] iap_stub_purchase', { level: this.game.level.id, total: save.iapCount });
        this.close(RESCUE.iap);
      }));
    } else if (pointInRect(e.x, e.y, this.btnGiveUp)) {
      scenes.pop();
      this.game.giveUp();
    }
  }

  close(grant) {
    // this modal may be under an Ad/IAP stub; remove it wherever it is
    const stack = scenes.all();
    const i = stack.indexOf(this);
    if (i >= 0) stack.splice(i, 1);
    this.game.applyRescue(grant);
  }

  update() {}

  render(ctx) {
    dim(ctx);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText(this.kind === 'time' ? 'OUT OF TIME!' : 'OUT OF MOVES!', W / 2, 240);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillText('The hoof still needs work…', W / 2, 286);
    ctx.fillText('Keep going?', W / 2, 316);
    drawButton(ctx, { ...this.btnAd, sub: this.adAvailable() ? this.btnAd.sub : 'No more ads this attempt' }, this.adAvailable());
    drawButton(ctx, { ...this.btnCoins, sub: `+${RESCUE.coins.moves} moves, +${RESCUE.coins.time}s (you have ${save.coins})` }, this.coinsAvailable());
    drawButton(ctx, this.btnIap);
    drawButton(ctx, this.btnGiveUp);
  }
}

// ---------------------------------------------------------------------------
export class AdStub {
  constructor(onDone) {
    this.name = 'ad';
    this.onDone = onDone;
    this.t = 3;
  }
  update(dt) { this.t -= dt; }
  onPointer(e) {
    if (e.type !== 'down' || this.t > 0) return;
    const b = { x: W - 76, y: 24, w: 52, h: 52 };
    if (pointInRect(e.x, e.y, b)) {
      scenes.pop();
      this.onDone();
    }
  }
  render(ctx) {
    ctx.fillStyle = '#20242c';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = '110px system-ui, sans-serif';
    ctx.fillText('🐄', W / 2, H / 2 - 60);
    ctx.fillStyle = '#e8e8e8';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('Your Ad Here', W / 2, H / 2 + 30);
    ctx.fillStyle = '#9aa2ac';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('(rewarded ad stub — no real ad)', W / 2, H / 2 + 68);
    const ready = this.t <= 0;
    ctx.fillStyle = ready ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.1)';
    roundRect(ctx, W - 76, 24, 52, 52, 26);
    ctx.fill();
    ctx.fillStyle = ready ? '#fff' : '#888';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(ready ? '✕' : String(Math.ceil(this.t)), W - 50, 60);
    if (!ready) {
      ctx.fillStyle = '#9aa2ac';
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText(`Reward in ${Math.ceil(this.t)}…`, W / 2, H - 60);
    } else {
      ctx.fillStyle = '#7ddb8a';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.fillText('Tap ✕ to claim your reward', W / 2, H - 60);
    }
  }
}

// ---------------------------------------------------------------------------
export class IapStub {
  constructor(onBuy) {
    this.name = 'iap';
    this.onBuy = onBuy;
    this.state = 'sheet'; // sheet | spinner | success
    this.t = 0;
    this.btnBuy = { x: 90, y: 560, w: W - 180, h: 64, color: '#4a9d5c', label: `Buy — ${IAP_PRICE}` };
    this.btnCancel = { x: 150, y: 644, w: W - 300, h: 46, color: 'rgba(255,255,255,.14)', label: 'Cancel', fontSize: 16 };
  }
  update(dt) {
    if (this.state === 'spinner') {
      this.t += dt;
      if (this.t > 1) { this.state = 'success'; sfx.coin(); }
    }
  }
  onPointer(e) {
    if (e.type !== 'down') return;
    if (this.state === 'sheet') {
      if (pointInRect(e.x, e.y, this.btnBuy)) { this.state = 'spinner'; this.t = 0; }
      else if (pointInRect(e.x, e.y, this.btnCancel)) scenes.pop();
    } else if (this.state === 'success') {
      scenes.pop();
      this.onBuy();
    }
  }
  render(ctx) {
    dim(ctx);
    ctx.fillStyle = '#2c2620';
    roundRect(ctx, 40, 220, W - 80, 500, 24);
    ctx.fill();
    ctx.strokeStyle = '#7a4ac9';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = '84px system-ui, sans-serif';
    ctx.fillText('🧰', W / 2, 350);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 27px system-ui, sans-serif';
    ctx.fillText(IAP_NAME, W / 2, 410);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('+5 moves, +30 seconds', W / 2, 448);
    ctx.fillText('The deluxe rescue for stubborn hooves', W / 2, 476);
    ctx.fillStyle = '#9aa2ac';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('(stub purchase — nothing is charged)', W / 2, 510);
    if (this.state === 'sheet') {
      drawButton(ctx, this.btnBuy);
      drawButton(ctx, this.btnCancel);
    } else if (this.state === 'spinner') {
      const a = performance.now() / 120;
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(W / 2, 600, 26, a, a + 4.4);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#7ddb8a';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('Purchase successful! ✔', W / 2, 596);
      ctx.fillStyle = '#cbbfae';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Tap to continue', W / 2, 634);
    }
  }
}

// ---------------------------------------------------------------------------
export class PauseModal {
  constructor(game) {
    this.name = 'pause';
    this.game = game;
    const bx = 90, bw = W - 180;
    this.btnResume = { x: bx, y: 360, w: bw, h: 64, color: '#4a9d5c', label: 'Resume' };
    this.btnRestart = { x: bx, y: 444, w: bw, h: 64, color: '#c9922e', label: 'Restart Level' };
    this.btnQuit = { x: bx, y: 528, w: bw, h: 64, color: 'rgba(255,255,255,.14)', label: 'Back to Map' };
    this.btnSound = { x: bx, y: 612, w: bw, h: 52, color: 'rgba(255,255,255,.14)', label: '', fontSize: 16 };
  }
  onPointer(e) {
    if (e.type !== 'down') return;
    if (pointInRect(e.x, e.y, this.btnResume)) scenes.pop();
    else if (pointInRect(e.x, e.y, this.btnRestart)) {
      // game is a Gameplay instance; avoid importing it (module cycle)
      scenes.replace(new this.game.constructor(this.game.level.id));
    } else if (pointInRect(e.x, e.y, this.btnQuit)) {
      scenes.pop();
      this.game.giveUp();
    } else if (pointInRect(e.x, e.y, this.btnSound)) {
      save.sound = !save.sound;
      persist();
    }
  }
  update() {}
  render(ctx) {
    dim(ctx);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('PAUSED', W / 2, 300);
    drawButton(ctx, this.btnResume);
    drawButton(ctx, this.btnRestart);
    drawButton(ctx, this.btnQuit);
    drawButton(ctx, { ...this.btnSound, label: `Sound: ${save.sound ? 'ON' : 'OFF'}` });
  }
}
