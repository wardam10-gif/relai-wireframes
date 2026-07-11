// Stars: 3 = flawless & fast, 2 = a couple of slips, 1 = got it done
export function starRating(mistakes, timeFrac) {
  if (mistakes === 0 && timeFrac >= 0.3) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export function coinsFor(level, stars, isReplay) {
  const starMult = [0, 1.0, 1.3, 1.6][stars];
  let c = (20 + 2 * level.id) * starMult;
  if (level.isGate) c *= 2;
  if (level.bonus) c *= 2;
  if (isReplay) c *= 0.25; // grind valve: replays always pay something
  return Math.round(c);
}

export function rescueCost(levelId) {
  return 40 + 3 * levelId;
}

// What each rescue option grants (moves, seconds)
export const RESCUE = {
  ad:    { moves: 3, time: 15 },
  coins: { moves: 3, time: 15 },
  iap:   { moves: 5, time: 30 },
};

export const IAP_PRICE = '$1.99';
export const IAP_NAME = "Farrier's Golden Kit";
export const MAX_ADS_PER_ATTEMPT = 2;
