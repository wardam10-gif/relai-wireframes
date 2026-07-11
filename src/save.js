const KEY = 'hoofHero.save.v1';

function fresh() {
  return {
    version: 1,
    coins: 0,
    highestUnlocked: 1,
    stars: {},        // levelId -> best stars 1..3
    iapCount: 0,
    adsWatched: 0,
    sound: true,
  };
}

function load() {
  try {
    if (new URLSearchParams(location.search).has('reset')) localStorage.removeItem(KEY);
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.version === 1) return Object.assign(fresh(), s);
  } catch (e) { /* corrupted or unavailable storage -> fresh save */ }
  return fresh();
}

export const save = load();

let timer = null;
export function persist() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* storage full/blocked */ }
  }, 500);
}
