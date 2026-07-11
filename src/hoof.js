import { W, H, TAU, clamp, normAngle, mulberry32, makeCanvas } from './util.js';

// ---------------------------------------------------------------------------
// Procedural hoof: a stack of full-canvas offscreen layers composited each
// frame. Bottom-up: base hoof -> disease patches -> mud layers. Overgrowth
// polygons and the guide/quick lines live on top as vector shapes.
// Scratch-off erasing = destination-out round brush on the topmost layer.
// ---------------------------------------------------------------------------

const SAMPLE = 56;
const sampleCanvas = makeCanvas(SAMPLE, SAMPLE);
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

export class Hoof {
  constructor(level) {
    this.level = level;
    this.rng = mulberry32(level.id * 104729 + 7);

    const sizeMult =
      level.bonus ? 0.62 :
      level.animal === 'horse' ? (level.id >= 86 ? 1.08 : 1.0) : 0.94;

    this.cx = W / 2;
    this.cy = 460;
    this.rx = 148 * sizeMult;
    this.ry = 168 * sizeMult;

    this.hoofPath = this.buildPath();
    this.base = this.makeBase();
    this.disease = level.knifePaths > 0 ? makeCanvas(W, H) : null;
    this.diseaseInit = 0;

    this.mud = [];
    this.mudInit = [];
    this.mudTotal = level.mudLayers;
    for (let i = 0; i < level.mudLayers; i++) this.makeMudLayer(i);

    this.overgrowth = level.clipSegments > 0 ? this.makeOvergrowth() : [];
  }

  // Elliptical radius at angle theta (gameplay geometry approximates the
  // hoof outline as an ellipse even when the visual shape is cloven)
  radiusAt(theta) {
    const { rx, ry } = this;
    const c = Math.cos(theta), s = Math.sin(theta);
    return (rx * ry) / Math.sqrt((ry * c) ** 2 + (rx * s) ** 2);
  }

  rimPoint(theta, extra = 0) {
    const r = this.radiusAt(theta) + extra;
    return { x: this.cx + Math.cos(theta) * r, y: this.cy + Math.sin(theta) * r };
  }

  contains(x, y, shrink = 1) {
    const dx = (x - this.cx) / (this.rx * shrink);
    const dy = (y - this.cy) / (this.ry * shrink);
    return dx * dx + dy * dy <= 1;
  }

  randInside(rFrac = 0.7) {
    const a = this.rng() * TAU;
    const r = Math.sqrt(this.rng()) * rFrac;
    return { x: this.cx + Math.cos(a) * this.rx * r, y: this.cy + Math.sin(a) * this.ry * r };
  }

  buildPath() {
    const p = new Path2D();
    const { cx, cy, rx, ry } = this;
    const jitter = () => 1 + (this.rng() - 0.5) * 0.06;
    if (this.level.animal === 'horse') {
      // single rounded oval, slightly wider at the toe (top)
      p.moveTo(cx, cy - ry);
      p.bezierCurveTo(cx + rx * 0.95 * jitter(), cy - ry, cx + rx * jitter(), cy - ry * 0.2, cx + rx * 0.92, cy + ry * 0.45);
      p.bezierCurveTo(cx + rx * 0.75, cy + ry * 0.95, cx + rx * 0.3, cy + ry * jitter(), cx, cy + ry);
      p.bezierCurveTo(cx - rx * 0.3, cy + ry * jitter(), cx - rx * 0.75, cy + ry * 0.95, cx - rx * 0.92, cy + ry * 0.45);
      p.bezierCurveTo(cx - rx * jitter(), cy - ry * 0.2, cx - rx * 0.95 * jitter(), cy - ry, cx, cy - ry);
    } else {
      // cloven (cow/goat/sheep): two lobes with a central cleft
      for (const side of [-1, 1]) {
        const lx = cx + side * rx * 0.5;
        const lrx = rx * 0.52, lry = ry * 0.98;
        p.moveTo(lx, cy - lry);
        p.bezierCurveTo(lx + lrx * jitter(), cy - lry * 0.9, lx + lrx * jitter(), cy + lry * 0.5, lx + lrx * 0.6, cy + lry * 0.92);
        p.bezierCurveTo(lx + lrx * 0.25, cy + lry * jitter(), lx - lrx * 0.25, cy + lry * jitter(), lx - lrx * 0.6, cy + lry * 0.92);
        p.bezierCurveTo(lx - lrx * jitter(), cy + lry * 0.5, lx - lrx * jitter(), cy - lry * 0.9, lx, cy - lry);
      }
    }
    return p;
  }

  makeBase() {
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.clip(this.hoofPath);
    const g = ctx.createRadialGradient(this.cx, this.cy - 20, 20, this.cx, this.cy, Math.max(this.rx, this.ry) * 1.2);
    g.addColorStop(0, '#e9d0b3');
    g.addColorStop(0.65, '#d3ab84');
    g.addColorStop(1, '#a67c52');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // speckle texture
    for (let i = 0; i < 140; i++) {
      const p = this.randInside(0.95);
      ctx.fillStyle = this.rng() > 0.5 ? 'rgba(120,85,55,.12)' : 'rgba(255,240,220,.1)';
      ctx.fillRect(p.x, p.y, 2 + this.rng() * 3, 2 + this.rng() * 3);
    }
    if (this.level.animal === 'horse') {
      // frog: the V-shaped pad at the heel
      ctx.fillStyle = '#c09a76';
      ctx.strokeStyle = 'rgba(90,60,40,.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy - this.ry * 0.15);
      ctx.lineTo(this.cx + this.rx * 0.3, this.cy + this.ry * 0.75);
      ctx.quadraticCurveTo(this.cx, this.cy + this.ry * 0.55, this.cx - this.rx * 0.3, this.cy + this.ry * 0.75);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    // hoof wall outline
    ctx.strokeStyle = '#6e4f33';
    ctx.lineWidth = 7;
    ctx.stroke(this.hoofPath);
    ctx.strokeStyle = 'rgba(255,235,210,.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke(this.hoofPath);
    return c;
  }

  makeDisease() {
    // blobs get painted along knife paths by the knife tool setup (so paring
    // visually clears them); this just prepares the canvas + counts pixels
    this.diseaseInit = this.countAlpha(this.disease);
  }

  paintDiseaseBlob(x, y, r, purple) {
    const ctx = this.disease.getContext('2d');
    ctx.save();
    ctx.clip(this.hoofPath);
    ctx.fillStyle = purple ? 'rgba(122,92,126,.88)' : 'rgba(107,125,79,.88)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(
        x + (this.rng() - 0.5) * r, y + (this.rng() - 0.5) * r,
        r * (0.5 + this.rng() * 0.6), r * (0.4 + this.rng() * 0.5),
        this.rng() * TAU, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  makeMudLayer(depth) {
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const shades = ['#6e5138', '#5a4632', '#4d3a2a', '#3f3126', '#332821'];
    ctx.save();
    ctx.clip(this.hoofPath);
    ctx.fillStyle = shades[Math.min(depth, shades.length - 1)];
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const p = this.randInside(0.98);
      ctx.fillStyle = this.rng() > 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(150,115,80,.2)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + this.rng() * 6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // partial coverage: pre-clear some blobs so early levels are lighter work
    const cov = this.level.mudCoverage;
    if (cov < 0.97) {
      ctx.globalCompositeOperation = 'destination-out';
      const holes = Math.round((1 - cov) * 14);
      for (let i = 0; i < holes; i++) {
        const p = this.randInside(0.9);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20 + this.rng() * 30, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    this.mud.push(c);
    this.mudInit.push(this.countAlpha(c));
  }

  countAlpha(layer) {
    sampleCtx.clearRect(0, 0, SAMPLE, SAMPLE);
    const bx = this.cx - this.rx - 30, by = this.cy - this.ry - 30;
    const bw = this.rx * 2 + 60, bh = this.ry * 2 + 60;
    sampleCtx.drawImage(layer, bx, by, bw, bh, 0, 0, SAMPLE, SAMPLE);
    const data = sampleCtx.getImageData(0, 0, SAMPLE, SAMPLE).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 64) n++;
    return n;
  }

  eraseBrush(layer, x, y, r) {
    const ctx = layer.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  eraseTopMud(x, y, r = 24) {
    if (this.mud.length) this.eraseBrush(this.mud[this.mud.length - 1], x, y, r);
  }

  topMudRemaining() {
    const i = this.mud.length - 1;
    if (i < 0) return 0;
    const init = this.mudInit[i] || 1;
    return this.countAlpha(this.mud[i]) / init;
  }

  popTopMud() { this.mud.pop(); this.mudInit.pop(); }

  eraseDisease(x, y, r = 20) {
    if (this.disease) this.eraseBrush(this.disease, x, y, r);
  }

  makeOvergrowth() {
    const n = this.level.clipSegments;
    const segs = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
      const pts = [];
      const steps = 5;
      for (let k = 0; k <= steps; k++) {
        const a = a0 + (a1 - a0) * (k / steps);
        const out = 16 + this.rng() * 22;
        const p = this.rimPoint(a, k === 0 || k === steps ? 2 : out);
        pts.push(p);
      }
      for (let k = steps; k >= 0; k--) {
        const a = a0 + (a1 - a0) * (k / steps);
        pts.push(this.rimPoint(a, -2));
      }
      const mid = this.rimPoint((a0 + a1) / 2, 12);
      segs.push({ a0, a1, pts, mid, cut: false });
    }
    return segs;
  }

  segmentAt(theta) {
    if (!this.overgrowth.length) return null;
    const n = this.overgrowth.length;
    const idx = Math.floor(normAngle(theta) / (TAU / n)) % n;
    return this.overgrowth[idx];
  }

  draw(ctx) {
    ctx.drawImage(this.base, 0, 0);
    if (this.disease) ctx.drawImage(this.disease, 0, 0);
    for (const m of this.mud) ctx.drawImage(m, 0, 0);
    for (const seg of this.overgrowth) {
      if (seg.cut) continue;
      ctx.beginPath();
      ctx.moveTo(seg.pts[0].x, seg.pts[0].y);
      for (let i = 1; i < seg.pts.length; i++) ctx.lineTo(seg.pts[i].x, seg.pts[i].y);
      ctx.closePath();
      ctx.fillStyle = '#c7a86f';
      ctx.fill();
      ctx.strokeStyle = '#8a713f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Simple leg + head above the hoof; sells the flinch + end-of-level mood
  drawAnimal(ctx, mood = 'calm') {
    const { cx } = this;
    const legTop = 60;
    const legW = this.rx * 0.75;
    const colors = {
      cow: { hide: '#f5f0e6', patch: '#3a2f28', muzzle: '#e8b8b0' },
      horse: { hide: '#8a5a33', patch: '#6e4426', muzzle: '#c9a186' },
      goat: { hide: '#d8d3c8', patch: '#a89f8e', muzzle: '#c9bfae' },
      sheep: { hide: '#efe9dd', patch: '#d8cfbe', muzzle: '#d8b8a8' },
    }[this.level.animal];

    // leg
    ctx.fillStyle = colors.hide;
    ctx.strokeStyle = 'rgba(60,40,25,.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - legW / 2, legTop);
    ctx.quadraticCurveTo(cx - legW / 2 - 14, this.cy - this.ry * 0.7, cx - legW * 0.62, this.cy - this.ry + 14);
    ctx.lineTo(cx + legW * 0.62, this.cy - this.ry + 14);
    ctx.quadraticCurveTo(cx + legW / 2 + 14, this.cy - this.ry * 0.7, cx + legW / 2, legTop);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (this.level.animal === 'cow') {
      ctx.fillStyle = colors.patch;
      ctx.beginPath();
      ctx.ellipse(cx - 18, legTop + 90, 26, 42, 0.4, 0, TAU);
      ctx.fill();
    }

    // head peeking in below the HUD bar
    const hx = 78, hy = 196;
    ctx.save();
    if (mood === 'alert') ctx.translate(Math.sin(performance.now() / 40) * 3, 0);
    ctx.fillStyle = colors.hide;
    ctx.strokeStyle = 'rgba(60,40,25,.4)';
    ctx.beginPath();
    ctx.ellipse(hx, hy, 52, 42, -0.15, 0, TAU);
    ctx.fill(); ctx.stroke();
    // ears
    for (const s of [-1, 1]) {
      ctx.beginPath();
      const wig = mood === 'alert' ? Math.sin(performance.now() / 60) * 6 : 0;
      ctx.ellipse(hx + s * 44, hy - 26 + wig * s, 17, 9, s * 0.6, 0, TAU);
      ctx.fill(); ctx.stroke();
    }
    // muzzle
    ctx.fillStyle = colors.muzzle;
    ctx.beginPath();
    ctx.ellipse(hx - 8, hy + 18, 26, 17, -0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#5a4030';
    ctx.beginPath(); ctx.arc(hx - 16, hy + 16, 3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(hx - 2, hy + 18, 3, 0, TAU); ctx.fill();
    // eyes
    if (mood === 'happy') {
      ctx.strokeStyle = '#2a1d12';
      ctx.lineWidth = 3;
      for (const s of [0, 1]) {
        ctx.beginPath();
        ctx.arc(hx - 14 + s * 30, hy - 8, 7, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    } else if (mood === 'ouch') {
      ctx.strokeStyle = '#2a1d12';
      ctx.lineWidth = 3;
      for (const s of [0, 1]) {
        const ex = hx - 14 + s * 30, ey = hy - 8;
        ctx.beginPath();
        ctx.moveTo(ex - 6, ey - 6); ctx.lineTo(ex + 6, ey + 6);
        ctx.moveTo(ex + 6, ey - 6); ctx.lineTo(ex - 6, ey + 6);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#2a1d12';
      ctx.beginPath(); ctx.arc(hx - 14, hy - 8, 5.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + 16, hy - 8, 5.5, 0, TAU); ctx.fill();
    }
    if (mood === 'alert') {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = 5;
      ctx.strokeText('!', hx + 62, hy - 34);
      ctx.fillText('!', hx + 62, hy - 34);
    }
    ctx.restore();
  }
}
