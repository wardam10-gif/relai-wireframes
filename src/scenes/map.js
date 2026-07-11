import { W, H, TAU, clamp, roundRect, pointInRect, dist } from '../util.js';
import { scenes } from './sceneManager.js';
import { save } from '../save.js';
import { LEVELS } from '../levels.js';

const TOP = 150;
const SPACING = 88;
const BACK_BTN = { x: 14, y: 14, w: 92, h: 44 };

export class MapScene {
  constructor() {
    this.name = 'map';
    this.nodes = LEVELS.map(lv => ({
      lv,
      x: W / 2 + Math.sin((lv.id - 1) * 0.55) * 150,
      y: TOP + (lv.id - 1) * SPACING,
    }));
    this.totalH = TOP + 99 * SPACING + 220;
    this.maxScroll = Math.max(0, this.totalH - H);
    this.scroll = clamp(TOP + (save.highestUnlocked - 1) * SPACING - H / 2, 0, this.maxScroll);
    this.dragged = 0;
  }

  onPointer(e) {
    if (e.type === 'down') {
      this.dragged = 0;
      this.downX = e.x; this.downY = e.y;
    } else if (e.type === 'move' && e.down) {
      this.scroll = clamp(this.scroll - e.dy, 0, this.maxScroll);
      this.dragged += Math.abs(e.dy);
    } else if (e.type === 'up' && this.dragged < 12) {
      if (pointInRect(e.x, e.y, BACK_BTN)) {
        import('./menu.js').then(({ Menu }) => scenes.replace(new Menu()));
        return;
      }
      const y = e.y + this.scroll;
      const node = this.nodes.find(n => dist(n.x, n.y, e.x, y) < 36);
      if (node && node.lv.id <= save.highestUnlocked) {
        import('./gameplay.js').then(({ Gameplay }) => scenes.replace(new Gameplay(node.lv.id)));
      }
    }
  }

  update() {}

  render(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3a4a30');
    g.addColorStop(1, '#241a10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(0, -this.scroll);

    // winding dirt path
    ctx.strokeStyle = 'rgba(160,130,90,.5)';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    this.nodes.forEach((n, i) => (i === 0 ? ctx.moveTo(n.x, n.y) : ctx.lineTo(n.x, n.y)));
    ctx.stroke();

    const t = performance.now();
    for (const n of this.nodes) {
      if (n.y - this.scroll < -60 || n.y - this.scroll > H + 60) continue;
      const { lv } = n;
      const unlocked = lv.id <= save.highestUnlocked;
      const beaten = (save.stars[lv.id] || 0) > 0;
      const isCurrent = lv.id === save.highestUnlocked && !beaten;
      const r = lv.isGate ? 33 : 27;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r + (isCurrent ? Math.sin(t / 250) * 3 : 0), 0, TAU);
      ctx.fillStyle = !unlocked ? '#4a453c'
        : lv.isGate ? (beaten ? '#8a4a3c' : '#c94a3a')
        : lv.bonus ? '#3a9d8a'
        : beaten ? '#5a9e64'
        : '#e0b64a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.textAlign = 'center';
      if (!unlocked) {
        ctx.fillStyle = '#8a857a';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.fillText('🔒', n.x, n.y + 7);
      } else {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${lv.isGate ? 22 : 19}px system-ui, sans-serif`;
        ctx.fillText(String(lv.id), n.x, n.y + 7);
      }
      if (lv.isGate) {
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText('⚑', n.x + r - 4, n.y - r + 6);
      }
      if (lv.bonus) {
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText({ goat: '🐐', sheep: '🐑' }[lv.bonus], n.x + r - 2, n.y - r + 8);
      }
      // stars under beaten levels
      if (beaten) {
        const s = save.stars[lv.id];
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = '#ffd23e';
        ctx.fillText('★'.repeat(s) + '☆'.repeat(3 - s), n.x, n.y + r + 18);
      }
      // gate titles beside the node
      if (lv.isGate && unlocked) {
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillStyle = '#ffb0a0';
        const side = n.x > W / 2 ? -1 : 1;
        ctx.textAlign = side === 1 ? 'left' : 'right';
        ctx.fillText(lv.title, n.x + side * (r + 12), n.y + 5);
      }
    }
    ctx.restore();

    // header
    ctx.fillStyle = 'rgba(20,14,8,.7)';
    ctx.fillRect(0, 0, W, 72);
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    roundRect(ctx, BACK_BTN.x, BACK_BTN.y, BACK_BTN.w, BACK_BTN.h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('‹ Menu', BACK_BTN.x + BACK_BTN.w / 2, BACK_BTN.y + 28);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.arc(W - 130, 36, 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8912a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(save.coins), W - 110, 43);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8dcc8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Level Map', W / 2, 44);
  }
}
