# 🐄 Hoof Hero

A satisfying **hoof cleaning & trimming** mobile game prototype — inspired by viral farrier / hoof-restoration videos. Scrape the mud, clip the overgrowth, pare the diseased sole, pull the stones, treat, wrap, and (for horses) fit a brand-new shoe. Fruit-Ninja-style gestures meet surgery-game procedures.

**Playable HTML5 prototype** — portrait, phone-first, works with touch or mouse. No build step, no dependencies at runtime.

## Play it

```bash
python3 -m http.server 8080
# open http://localhost:8080 (best in a mobile viewport / on your phone)
```

Useful URLs:
- `?level=N` — jump straight to level N (dev shortcut)
- `?dumpLevels` — view the generated 100-level design table
- `?reset` — wipe saved progress

## The game

- **100 levels**, ~30 seconds each, difficulty rising from tutorial cows to legendary draft horses.
- **8 tools** unlocked progressively: hoof pick, brush, nippers (mind the red *quick* line!), rasp, hoof knife, tweezers, treatment spray + bandage, and the horseshoe kit (pry → place → nail).
- **Moves system**: precision actions cost moves; mistakes (cutting the quick, mis-nailing, wobbling a stone out) cost extra — and the animal flinches on a timer from level 13.
- **26 gate levels** every 3–5 levels: longer, harder, tuned so you may run out of moves. Rescue options: watch a (stubbed) rewarded ad, spend earned coins, or a (stubbed) $1.99 IAP. Replaying old levels for coins means you're never hard-blocked.
- **Bonus rounds** (goats & sheep): no fail state, double coins.
- Stars, coins, and progress persist in `localStorage`.

See [docs/levels.md](docs/levels.md) for the full level table, phase breakdown, gate tiers, and difficulty formulas (generated from `src/levels.js`).

## Code layout

```
index.html, css/style.css      shell + letterboxed portrait canvas (480×854 logical)
src/main.js                    boot, rAF loop, DPR scaling, ?dumpLevels, test hooks
src/input.js                   Pointer Events → unified touch/mouse strokes
src/levels.js                  100-level generator: formulas + gate overrides (seeded PRNG)
src/hoof.js                    procedural hoof: layered offscreen canvases, scratch-off erasing
src/economy.js, src/save.js    stars/coins/rescue costs, localStorage save
src/juice.js, src/audio.js     particles, screen shake, WebAudio synth sfx (no assets)
src/scenes/                    menu, level map, gameplay, results, modals (rescue/ad/IAP stubs)
src/tools/                     one module per tool mechanic
scripts/verify.mjs             Playwright smoke test (needs `npm i` + chromium)
```

## Verify

```bash
npm install                    # playwright-core (dev only)
python3 -m http.server 8080 &  # serve the game
npm run verify                 # boots the game, checks level data, plays level 1
```

Built as a prototype — wrap in Capacitor/TWA later for app stores, swap the ad/IAP stubs for real SDKs.
