import { save } from './save.js';

let ac = null;

export function initAudio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  }
  if (ac.state === 'suspended') ac.resume();
}

function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null, delay = 0) {
  if (!ac || !save.sound) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  ding()    { tone(880, 0.12, 'sine', 0.18); tone(1320, 0.2, 'sine', 0.14, null, 0.07); },
  chunk()   { tone(170, 0.09, 'square', 0.2, 90); },
  thud()    { tone(90, 0.1, 'sine', 0.22, 50); },
  pop()     { tone(300, 0.09, 'square', 0.16, 700); },
  scrape()  { tone(120 + Math.random() * 60, 0.05, 'sawtooth', 0.05, 80); },
  moo()     { tone(200, 0.45, 'sawtooth', 0.16, 120); },
  neigh()   { tone(500, 0.35, 'sawtooth', 0.13, 260); },
  clank()   { tone(1400, 0.08, 'square', 0.14, 900); tone(700, 0.12, 'triangle', 0.1, null, 0.03); },
  spray()   { tone(2200, 0.15, 'sawtooth', 0.04, 1600); },
  coin()    { tone(990, 0.08, 'square', 0.12); tone(1320, 0.12, 'square', 0.12, null, 0.07); },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, null, i * 0.11));
  },
  fail()    { tone(300, 0.25, 'sawtooth', 0.14, 150); tone(200, 0.35, 'sawtooth', 0.13, 90, 0.18); },
};

export function animalCry(animal) {
  if (animal === 'horse') sfx.neigh(); else sfx.moo();
}
