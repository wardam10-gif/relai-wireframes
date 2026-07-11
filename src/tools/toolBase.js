// Tool interface. gameplay.js drives: onPointer(e) -> update(dt) -> render(ctx).
// A tool signals completion via this.done; movesLeft() feeds the fail check.

export class Tool {
  constructor(game) {
    this.game = game;
    this.hoof = game.hoof;
    this.level = game.level;
    this.done = false;
    this.px = 0; this.py = 0; this.pdown = false;
    this.hint = '';
  }
  movesLeft() { return 0; }
  trackPointer(e) { this.px = e.x; this.py = e.y; this.pdown = e.down; }
  onPointer(e) { this.trackPointer(e); }
  update(dt) {}
  render(ctx) {}
  progress() { return this.done ? 1 : 0; }
}

// Interpolate brush stamps so fast swipes don't leave gaps
export function alongStroke(e, step, fn) {
  const x0 = e.x - e.dx, y0 = e.y - e.dy;
  const len = Math.hypot(e.dx, e.dy);
  const n = Math.max(1, Math.ceil(len / step));
  for (let i = 1; i <= n; i++) fn(x0 + (e.dx * i) / n, y0 + (e.dy * i) / n);
}
