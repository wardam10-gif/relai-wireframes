import { clamp, mulberry32 } from './util.js';

// ---------------------------------------------------------------------------
// Level generation: 100 levels from formulas over L, with hand-tuned gates.
// Deterministic (seeded PRNG) so the table is stable across reloads.
// See docs/levels.md for the design writeup.
// ---------------------------------------------------------------------------

export const GATES = [4, 8, 12, 15, 19, 23, 27, 30, 34, 38, 42, 46, 50, 54, 58, 62, 65, 69, 73, 77, 80, 84, 88, 92, 95, 100];

export const BONUS_LEVELS = { 20: 'goat', 33: 'goat', 47: 'sheep', 70: 'sheep', 82: 'goat' };

export const UNLOCKS = {
  scrape: 1, brush: 3, nippers: 5, rasp: 8, knife: 11,
  tweezers: 14, spray: 26, bandage: 29, shoe: 51,
};

// Canonical procedure order — steps always appear in this sequence
const ORDER = ['scrape', 'brush', 'nippers', 'knife', 'tweezers', 'rasp', 'spray', 'bandage', 'shoe'];

export const GATE_TITLES = {
  4: 'The Mud Pit', 8: 'Rasp Rodeo', 12: 'Stubborn Bessie',
  15: 'The Quick & The Dead', 19: 'Deep Muck', 23: 'Thorn in the Hoof',
  27: 'The Infection', 30: 'Steady Hands', 34: 'Swamp Feet',
  38: 'Stone Cold', 42: 'Double Trouble', 46: 'The Long Trim', 50: 'Cow Graduation',
  54: 'Iron Debut', 58: 'Nail Biter', 62: 'The Kicker', 65: 'Wild Stallion',
  69: 'Mudslide', 73: 'The Perfectionist', 77: 'Fever Hooves', 80: 'Thunderhoof',
  84: 'The Gauntlet', 88: 'The Gauntlet II', 92: 'No Room for Error',
  95: 'Master Farrier Exam', 100: 'The Legendary Draft Horse',
};

export function gateTier(L) {
  if (L <= 12) return 1;
  if (L <= 34) return 2;
  if (L <= 58) return 3;
  if (L <= 80) return 4;
  return 5;
}

const GATE_TIMER = { 1: 60, 2: 65, 3: 70, 4: 80, 5: 90 };
// Extra moves above a perfect run. Tier 5 finale gates are perfect-or-rescue.
function gateSlack(L) {
  const tier = gateTier(L);
  if (tier === 1) return 2;
  if (tier === 5 && L >= 92) return 0;
  return 1;
}

export function phaseOf(L) {
  if (L <= 10) return 1;
  if (L <= 25) return 2;
  if (L <= 40) return 3;
  if (L <= 50) return 4;
  if (L <= 65) return 5;
  if (L <= 85) return 6;
  return 7;
}

export const PHASE_NAMES = {
  1: 'Tutorial Cows', 2: 'Muddy Farm Cows', 3: 'Diseased Hooves',
  4: 'Cow Finale', 5: 'Horse Country', 6: 'Mixed Mastery', 7: 'Expert Farrier',
};

const PHASE_STEP_TARGET = { 1: 3, 2: 4, 3: 5, 4: 5, 5: 5, 6: 6, 7: 7 };

function animalFor(L, phase, bonus) {
  if (bonus) return bonus;
  if (L <= 50) return 'cow';
  if (phase === 6) return (L % 2 === 0) ? 'horse' : 'cow';
  return 'horse';
}

function pickSteps(L, animal, bonus, rng) {
  if (bonus) return ['scrape', 'brush']; // bonus speed rounds stay simple
  const pool = ORDER.filter(s => UNLOCKS[s] <= L && (s !== 'shoe' || animal === 'horse'));
  const target = Math.min(pool.length, PHASE_STEP_TARGET[phaseOf(L)]);
  const chosen = new Set(['scrape']);
  // A tool always stars in the level where it unlocks
  for (const s of pool) if (UNLOCKS[s] === L) chosen.add(s);
  if (animal === 'horse' && L >= 51) chosen.add('shoe'); // shoeing is the point of horse levels
  const rest = pool.filter(s => !chosen.has(s));
  while (chosen.size < target && rest.length) {
    chosen.add(rest.splice((rng() * rest.length) | 0, 1)[0]);
  }
  return ORDER.filter(s => chosen.has(s));
}

function genLevel(L) {
  const rng = mulberry32(L * 7919);
  const t = (L - 1) / 99;
  const phase = phaseOf(L);
  const bonus = BONUS_LEVELS[L] || null;
  const isGate = GATES.includes(L) && !bonus;
  const animal = animalFor(L, phase, bonus);
  const steps = pickSteps(L, animal, bonus, rng);
  const has = s => steps.includes(s);

  const lv = {
    id: L, phase, animal, bonus, isGate,
    tier: isGate ? gateTier(L) : 0,
    title: isGate ? GATE_TITLES[L] : (bonus ? `Bonus: ${bonus[0].toUpperCase() + bonus.slice(1)} Dash` : null),
    steps,

    // Content volume (only for included steps)
    mudLayers: has('scrape') ? (bonus ? 2 : clamp(1 + Math.floor(L / 14), 1, 5)) : 0,
    mudCoverage: 0.55 + 0.4 * t,
    scrubSpots: has('brush') ? clamp(2 + Math.floor(L / 18), 2, 7) : 0,
    scrubRevs: L < 40 ? 1.5 : 2.5,
    clipSegments: has('nippers') ? clamp(3 + Math.floor(L / 12), 3, 11) : 0,
    knifePaths: has('knife') ? clamp(1 + Math.floor((L - 11) / 20), 1, 4) : 0,
    raspTarget: has('rasp') ? 8 + Math.round(14 * t) : 0,
    stones: has('tweezers') ? clamp(1 + Math.floor((L - 14) / 30), 1, 3) : 0,
    sprayTargets: has('spray') ? clamp(2 + Math.floor((L - 26) / 22), 2, 6) : 0,
    wrapTurns: has('bandage') ? (L < 60 ? 2 : 3) : 0,
    shoe: has('shoe') ? {
      pryPoints: clamp(2 + Math.floor((L - 51) / 25), 2, 3),
      nailCount: L < 53 ? 0 : clamp(4 + Math.floor((L - 53) / 12), 4, 8),
      nailTolerancePx: Math.round(26 - 10 * ((L - 51) / 49)),
    } : null,

    // Precision screws — the real difficulty curve
    guideTolerancePx: Math.round(34 - 16 * t),
    quickDistancePx: Math.round(40 - 18 * t),
    knifePathWidth: Math.round(34 - 12 * t),
    sensitiveZones: has('knife') ? clamp(Math.floor((L - 11) / 25), 0, 2) : 0,
    stoneWiggle: 0.3 + 0.6 * t,
    flinchIntervalSec: (L < 13 || bonus) ? 0 : Math.round(20 - 12 * t),
    flinchDurationMs: 400 + Math.round(500 * t),

    overRaspPenalty: L >= 30,
  };

  // Horses get a gentler re-introduction while shoeing is new (levels 51-56)
  if (animal === 'horse' && L >= 51 && L <= 56) {
    lv.guideTolerancePx = Math.round(lv.guideTolerancePx * 1.15);
    lv.quickDistancePx = Math.round(lv.quickDistancePx * 1.15);
    lv.knifePathWidth = Math.round(lv.knifePathWidth * 1.15);
  }

  // ---- Gate overrides: longer, tighter, meaner -----------------------------
  if (isGate) {
    const tier = lv.tier;
    if (lv.mudLayers) lv.mudLayers = clamp(lv.mudLayers + 1, 1, 5);
    if (lv.scrubSpots) lv.scrubSpots = clamp(lv.scrubSpots + 2, 2, 8);
    if (lv.clipSegments) lv.clipSegments = clamp(lv.clipSegments + 2, 3, 12);
    if (lv.knifePaths) lv.knifePaths = clamp(lv.knifePaths + 1, 1, 4);
    if (lv.raspTarget) lv.raspTarget += 6;
    if (lv.stones && tier >= 3) lv.stones = clamp(lv.stones + 1, 1, 3);
    if (lv.sprayTargets) lv.sprayTargets = clamp(lv.sprayTargets + 1, 2, 7);
    if (tier >= 2) {
      lv.guideTolerancePx = Math.round(lv.guideTolerancePx * 0.8);
      lv.quickDistancePx = Math.round(lv.quickDistancePx * 0.8);
      lv.knifePathWidth = Math.round(lv.knifePathWidth * 0.8);
    }
    if (lv.flinchIntervalSec) {
      lv.flinchIntervalSec = tier >= 4 ? 7 : Math.min(lv.flinchIntervalSec, 10);
    }
    if (L === 100) { // finale: everything, twin hazards
      lv.stones = 3;
      lv.sensitiveZones = 2;
    }
  }

  // ---- Budgets --------------------------------------------------------------
  lv.perfectMoves =
    lv.clipSegments + lv.knifePaths + lv.stones + lv.sprayTargets +
    (lv.shoe ? lv.shoe.pryPoints + lv.shoe.nailCount : 0);
  lv.moveBudget = bonus ? 99 : lv.perfectMoves + (isGate ? gateSlack(L) : 3);
  lv.timerSec = bonus ? 25 : (isGate ? GATE_TIMER[lv.tier] : clamp(30 + 3 * steps.length, 36, 48));

  return lv;
}

export const LEVELS = [];
for (let L = 1; L <= 100; L++) LEVELS.push(genLevel(L));

export function generateLevels() { return LEVELS; }
