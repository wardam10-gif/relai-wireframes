import { W, H, TAU, clamp, roundRect, pointInRect } from '../util.js';
import { LEVELS } from '../levels.js';
import { Hoof } from '../hoof.js';
import { scenes } from './sceneManager.js';
import { save, persist } from '../save.js';
import { starRating, coinsFor } from '../economy.js';
import { sfx, animalCry } from '../audio.js';
import {
  resetJuice, updateJuice, renderJuice, renderVignette, getShakeOffset,
  screenShake, vignetteFlash, floatText, sparkle,
} from '../juice.js';
import { Scraper } from '../tools/scraper.js';
import { Brush } from '../tools/brush.js';
import { Nippers } from '../tools/nippers.js';
import { Knife } from '../tools/knife.js';
import { Rasp } from '../tools/rasp.js';
import { Tweezers } from '../tools/tweezers.js';
import { Spray } from '../tools/spray.js';
import { Bandage } from '../tools/bandage.js';
import { Shoe } from '../tools/shoe.js';
import { Results } from './results.js';
import { RescueModal, PauseModal } from './modals.js';
import { MapScene } from './map.js';

const TOOL_CLASSES = {
  scrape: Scraper, brush: Brush, nippers: Nippers, knife: Knife,
  tweezers: Tweezers, rasp: Rasp, spray: Spray, bandage: Bandage, shoe: Shoe,
};

export const STEP_LABELS = {
  scrape: 'Scrape', brush: 'Wash', nippers: 'Clip', knife: 'Pare',
  tweezers: 'Extract', rasp: 'Rasp', spray: 'Treat', bandage: 'Wrap', shoe: 'Shoe',
};

const PAUSE_BTN = { x: W - 62, y: 12, w: 50, h: 42 };

export class Gameplay {
  constructor(levelId) {
    this.name = 'gameplay';
    this.level = LEVELS[levelId - 1];
  }

  enter() {
    resetJuice();
    const lv = this.level;
    this.hoof = new Hoof(lv);
    // all tools built upfront so their scene objects (disease, spots, stones)
    // exist from the start of the level
    this.tools = lv.steps.map(s => new TOOL_CLASSES[s](this));
    this.stepIdx = 0;
    this.timer = lv.timerSec;
    this.moves = lv.moveBudget;
    this.mistakes = 0;
    this.adsUsed = 0;
    this.state = 'intro';
    this.introT = 0;
    this.mood = 'calm';
    this.moodT = 0;
    // flinch scheduling
    this.flinchPhase = 'none'; // none | telegraph | jerk
    this.flinchT = lv.flinchIntervalSec > 0 ? lv.flinchIntervalSec * (0.8 + Math.random() * 0.4) : Infinity;
    this.jerkT = 0;
  }

  get tool() { return this.tools[this.stepIdx]; }

  isFlinching() { return this.flinchPhase === 'jerk'; }

  spendMove() {
    this.moves--;
    this.checkFail();
  }

  mistake(msg) {
    this.mistakes++;
    this.moves--; // penalty move on top of any attempt cost
    screenShake(10, 300);
    vignetteFlash();
    animalCry(this.level.animal);
    floatText(W / 2, 260, msg, '#ff6b5e');
    floatText(W - 90, 92, '-1 move', '#ff6b5e');
    this.mood = 'ouch';
    this.moodT = 1;
    this.checkFail();
  }

  movesNeeded() {
    let n = 0;
    for (let i = this.stepIdx; i < this.tools.length; i++) n += this.tools[i].movesLeft();
    return n;
  }

  checkFail() {
    if (this.state !== 'play' && this.state !== 'intro') return;
    if (this.level.bonus) return; // bonus rounds have no fail state
    if (this.moves <= 0 && this.movesNeeded() > 0) this.fail('moves');
  }

  fail(kind) {
    if (this.state === 'rescue') return;
    this.state = 'rescue';
    sfx.fail();
    scenes.push(new RescueModal(this, kind));
  }

  applyRescue(grant) {
    this.moves += grant.moves;
    this.timer += grant.time;
    this.state = 'play';
    floatText(W / 2, 300, `+${grant.moves} moves  +${grant.time}s`, '#7ddb8a', true);
  }

  giveUp() {
    scenes.replace(new MapScene());
  }

  stepDone() {
    sfx.ding();
    sparkle(this.hoof.cx, this.hoof.cy - this.hoof.ry * 0.5);
    this.stepIdx++;
    if (this.stepIdx >= this.tools.length) {
      this.win();
    } else {
      floatText(W / 2, 330, STEP_LABELS[this.level.steps[this.stepIdx]] + '!', '#ffe98a', true);
    }
  }

  win() {
    this.state = 'won';
    this.mood = 'happy';
    const lv = this.level;
    const timeFrac = lv.timerSec > 0 ? clamp(this.timer / lv.timerSec, 0, 1) : 0;
    const stars = lv.bonus ? 3 : starRating(this.mistakes, timeFrac);
    const isReplay = (save.stars[lv.id] || 0) > 0;
    const coins = coinsFor(lv, stars, isReplay);
    save.coins += coins;
    save.stars[lv.id] = Math.max(save.stars[lv.id] || 0, stars);
    save.highestUnlocked = Math.max(save.highestUnlocked, Math.min(100, lv.id + 1));
    persist();
    sfx.fanfare();
    scenes.replace(new Results(lv, stars, coins));
  }

  onPointer(e) {
    if (this.state === 'intro') {
      if (e.type === 'down') { this.state = 'play'; }
      return;
    }
    if (this.state !== 'play') return;
    if (e.type === 'down' && pointInRect(e.x, e.y, PAUSE_BTN)) {
      scenes.push(new PauseModal(this));
      return;
    }
    this.tool.onPointer(e);
    if (this.tool.done && this.state === 'play') this.stepDone();
  }

  update(dt) {
    updateJuice(dt);
    if (this.moodT > 0) {
      this.moodT -= dt;
      if (this.moodT <= 0 && this.mood !== 'happy') this.mood = 'calm';
    }
    if (this.state === 'intro') {
      this.introT += dt;
      if (this.introT > 1.6) this.state = 'play';
      return;
    }
    if (this.state !== 'play') return;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      if (this.level.bonus) { this.win(); return; } // bonus: score what you got
      this.fail('time');
      return;
    }

    // flinch scheduler
    if (this.flinchPhase === 'none') {
      this.flinchT -= dt;
      if (this.flinchT <= 0) {
        this.flinchPhase = 'telegraph';
        this.jerkT = 0.8;
        this.mood = 'alert';
        this.moodT = 99;
      }
    } else {
      this.jerkT -= dt;
      if (this.flinchPhase === 'telegraph' && this.jerkT <= 0) {
        this.flinchPhase = 'jerk';
        this.jerkT = this.level.flinchDurationMs / 1000;
      } else if (this.flinchPhase === 'jerk' && this.jerkT <= 0) {
        this.flinchPhase = 'none';
        this.mood = 'calm';
        this.moodT = 0;
        this.flinchT = this.level.flinchIntervalSec * (0.8 + Math.random() * 0.4);
      }
    }

    this.tool.update(dt);
    if (this.tool.done && this.state === 'play') this.stepDone();
  }

  flinchOffset() {
    if (this.flinchPhase !== 'jerk') return 0;
    const dur = this.level.flinchDurationMs / 1000;
    const k = clamp(1 - this.jerkT / dur, 0, 1);
    return 34 * Math.sin(Math.PI * k);
  }

  render(ctx) {
    const lv = this.level;
    // barn backdrop
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#8fb8d8');
    sky.addColorStop(0.45, '#c8d8c0');
    sky.addColorStop(0.46, '#7a5c3a');
    sky.addColorStop(1, '#5a4128');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // wood planks
    ctx.strokeStyle = 'rgba(0,0,0,.15)';
    ctx.lineWidth = 3;
    for (let y = H * 0.5; y < H; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const shake = getShakeOffset();
    ctx.save();
    ctx.translate(shake.x + this.flinchOffset(), shake.y);
    this.hoof.drawAnimal(ctx, this.mood);
    this.hoof.draw(ctx);
    this.tool.render(ctx);
    ctx.restore();

    this.renderHUD(ctx);
    renderJuice(ctx);
    renderVignette(ctx);

    if (this.state === 'intro') this.renderIntro(ctx);
  }

  renderHUD(ctx) {
    const lv = this.level;
    ctx.fillStyle = 'rgba(20,14,8,.55)';
    ctx.fillRect(0, 0, W, 136);

    // timer
    const urgent = this.timer < 10 && !lv.bonus;
    ctx.fillStyle = urgent ? '#ff6b5e' : '#fff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ${Math.ceil(this.timer)}s`, 16, 42);

    // coins
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.arc(W / 2 - 40, 30, 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8912a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(String(save.coins), W / 2 - 20, 38);

    // pause
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    roundRect(ctx, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(PAUSE_BTN.x + 15, PAUSE_BTN.y + 11, 6, 20);
    ctx.fillRect(PAUSE_BTN.x + 29, PAUSE_BTN.y + 11, 6, 20);

    // moves pips (horseshoes)
    if (!lv.bonus) {
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#d8ccb8';
      ctx.fillText('MOVES', 16, 70);
      const shown = Math.min(this.moves, 10);
      for (let i = 0; i < shown; i++) {
        const x = 106 + i * 26, y = 65;
        ctx.strokeStyle = this.moves <= 2 ? '#ff6b5e' : '#ffd23e';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, y, 9, Math.PI * 0.85, Math.PI * 2.15);
        ctx.stroke();
      }
      if (this.moves > 10) {
        ctx.fillStyle = '#ffd23e';
        ctx.fillText(`+${this.moves - 10}`, 106 + 10 * 26, 70);
      }
      if (this.moves <= 0) {
        ctx.fillStyle = '#ff6b5e';
        ctx.fillText('NONE!', 106, 70);
      }
    }

    // step strip
    const n = lv.steps.length;
    const stripW = n * 52;
    let sx = W / 2 - stripW / 2 + 26;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    lv.steps.forEach((s, i) => {
      const cx = sx + i * 52, cy = 104;
      const isDone = i < this.stepIdx, isActive = i === this.stepIdx;
      ctx.fillStyle = isDone ? '#5a9e64' : isActive ? '#ffd23e' : 'rgba(255,255,255,.2)';
      ctx.beginPath(); ctx.arc(cx, cy, isActive ? 17 : 14, 0, TAU); ctx.fill();
      if (isDone) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx - 2, cy + 5); ctx.lineTo(cx + 6, cy - 5); ctx.stroke();
      } else {
        ctx.fillStyle = isActive ? '#1d1812' : '#cbbfae';
        ctx.fillText(STEP_LABELS[s][0], cx, cy + 4);
      }
      if (isActive) {
        ctx.fillStyle = '#ffe98a';
        ctx.fillText(STEP_LABELS[s], cx, cy + 32);
      }
      if (i < n - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + 18, cy); ctx.lineTo(cx + 34, cy); ctx.stroke();
      }
    });

    // hint
    if (this.state === 'play' && this.stepIdx < this.tools.length) {
      ctx.fillStyle = 'rgba(20,14,8,.55)';
      roundRect(ctx, 24, H - 66, W - 48, 44, 12);
      ctx.fill();
      ctx.fillStyle = '#ffe9c8';
      ctx.font = '16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.tool.hint, W / 2, H - 38);
    }
  }

  renderIntro(ctx) {
    const lv = this.level;
    const a = clamp(this.introT < 1.3 ? 1 : (1.6 - this.introT) / 0.3, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(15,10,6,.72)';
    ctx.fillRect(0, H / 2 - 130, W, 240);
    ctx.textAlign = 'center';
    if (lv.isGate) {
      ctx.fillStyle = '#ff6b5e';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('⚑ GATE LEVEL ⚑', W / 2, H / 2 - 84);
    } else if (lv.bonus) {
      ctx.fillStyle = '#7ddb8a';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('BONUS ROUND — no pressure, double coins!', W / 2, H / 2 - 84);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(`Level ${lv.id}`, W / 2, H / 2 - 28);
    if (lv.title) {
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(lv.title, W / 2, H / 2 + 14);
    }
    ctx.fillStyle = '#cbbfae';
    ctx.font = '18px system-ui, sans-serif';
    const who = { cow: 'a cow', horse: 'a horse', goat: 'a goat', sheep: 'a sheep' }[lv.animal];
    ctx.fillText(`${lv.steps.length} steps • ${lv.timerSec}s • ${lv.bonus ? 'no move limit' : lv.moveBudget + ' moves'} • ${who}`, W / 2, H / 2 + 56);
    ctx.fillStyle = '#8fdba0';
    ctx.fillText('tap to start', W / 2, H / 2 + 92);
    ctx.globalAlpha = 1;
  }
}
