import { Tool, alongStroke } from './toolBase.js';
import { sfx } from '../audio.js';
import { dirtBurst } from '../juice.js';

export class Scraper extends Tool {
  constructor(game) {
    super(game);
    this.hint = 'Swipe to scrape off the mud!';
    this.sampleT = 0;
    this.remaining = 1;
    this.layersDone = 0;
    this.total = Math.max(1, this.hoof.mud.length);
    this.sfxT = 0;
    this.done = this.hoof.mud.length === 0;
  }

  movesLeft() { return 0; }

  onPointer(e) {
    this.trackPointer(e);
    if (e.type === 'move' && e.down) {
      alongStroke(e, 6, (x, y) => this.hoof.eraseTopMud(x, y, 24));
      if (this.hoof.contains(e.x, e.y) && Math.random() < 0.3) {
        dirtBurst(e.x, e.y);
        if (this.sfxT <= 0) { sfx.scrape(); this.sfxT = 0.08; }
      }
    }
  }

  update(dt) {
    this.sfxT -= dt;
    if (this.done) return;
    this.sampleT += dt;
    if (this.sampleT < 0.25) return; // keep getImageData off the hot path
    this.sampleT = 0;
    this.remaining = this.hoof.topMudRemaining();
    if (this.remaining <= 0.08) {
      this.hoof.popTopMud();
      this.layersDone++;
      this.remaining = 1;
      sfx.pop();
      dirtBurst(this.hoof.cx, this.hoof.cy);
      if (this.hoof.mud.length === 0) this.done = true;
    }
  }

  progress() { return (this.layersDone + (1 - this.remaining)) / this.total; }

  render(ctx) {
    if (!this.pdown) return;
    // hoof pick following the finger
    ctx.save();
    ctx.translate(this.px, this.py);
    ctx.rotate(-0.6);
    ctx.fillStyle = '#7a5c3a';
    ctx.fillRect(-4, -52, 9, 52);
    ctx.fillStyle = '#b8bec8';
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(10, 12); ctx.lineTo(2, 16); ctx.lineTo(-8, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
