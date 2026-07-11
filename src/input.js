import { W, H } from './util.js';

// Pointer Events only: unifies touch + mouse. Single active pointer.
// Delivers logical-coordinate events to the handler:
//   { type: 'down'|'move'|'up', x, y, dx, dy, down }

export function initInput(canvas, handler) {
  let activeId = null;
  let last = null;

  const toLogical = e => {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height),
    };
  };

  canvas.addEventListener('pointerdown', e => {
    if (activeId !== null) return;
    activeId = e.pointerId;
    // some mobile webviews throw here; capture is a nicety, not a requirement
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = toLogical(e);
    last = p;
    handler({ type: 'down', x: p.x, y: p.y, dx: 0, dy: 0, down: true });
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== activeId || !last) return;
    const p = toLogical(e);
    handler({ type: 'move', x: p.x, y: p.y, dx: p.x - last.x, dy: p.y - last.y, down: true });
    last = p;
    e.preventDefault();
  });

  const end = e => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    last = null;
    const p = toLogical(e);
    handler({ type: 'up', x: p.x, y: p.y, dx: 0, dy: 0, down: false });
    e.preventDefault();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}
