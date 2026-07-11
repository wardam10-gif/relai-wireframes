# Hoof Hero — 100-Level Design Table

This table is **generated** from the formulas in [`src/levels.js`](../src/levels.js) — that file is the single source of truth. View it live in-game at `index.html?dumpLevels`.

## Structure

- **100 levels**, each tuned so perfect play takes ~22–28s against a 36–48s timer ("~30 seconds per level").
- **26 gate levels** (every 3–5 levels): longer (60–90s of content), tighter tolerances, minimal move slack. Running out of moves/time opens the rescue modal: watch a (stubbed) rewarded ad, spend coins, or a (stubbed) $1.99 IAP. Replaying earlier levels for coins is always possible, so nobody is permanently blocked.
- **5 bonus levels** (goat/sheep): no fail state, 25s speed rounds, double coins.

## Phases

| Phase | Levels | Theme | New unlocks |
|---|---|---|---|
| 1 | 1–10 | Tutorial Cows | L1 scraper, L3 brush, L5 nippers, L8 rasp |
| 2 | 11–25 | Muddy Farm Cows | L11 hoof knife, L13 flinch hazard, L14 tweezers/stones |
| 3 | 26–40 | Diseased Hooves | L26 treatment spray, L29 bandage, L30 over-rasp penalty |
| 4 | 41–50 | Cow Finale | max cow parameters |
| 5 | 51–65 | Horse Country | L51 shoe prying, L53 nailing (tolerances relax 15% for L51–56) |
| 6 | 66–85 | Mixed Mastery | alternating cow/horse, combined conditions |
| 7 | 86–100 | Expert Farrier | draft horses (bigger hooves), 6–7 step procedures |

## Gate tiers

| Tier | Gates | Timer | Move slack | Squeeze |
|---|---|---|---|---|
| T1 speed bumps | 4, 8, 12 | 60s | +2 | longer content; teaches the rescue modal |
| T2 precision walls | 15, 19, 23, 27, 30, 34 | 65s | +1 | tolerances ×0.8, flinch every ≤10s |
| T3 move starvation | 38, 42, 46, 50, 54, 58 | 70s | +1 | +1 stone (every pull attempt costs a move) |
| T4 twitchy patients | 62, 65, 69, 73, 77, 80 | 80s | +1 | flinch every 7s, shoeing under pressure |
| T5 the gauntlet | 84, 88, 92, 95, 100 | 90s | +1 / **+0 from 92** | 92/95/100 are perfect-or-rescue; L100 = all-tools draft-horse finale |

## Difficulty formulas (t = (L−1)/99)

- mudLayers = 1 + ⌊L/14⌋ (cap 5) · clipSegments = 3 + ⌊L/12⌋ (cap 11) · knifePaths = 1 + ⌊(L−11)/20⌋ (cap 4)
- raspTarget = 8 + 14t · stones = 1 + ⌊(L−14)/30⌋ (cap 3) · sprayTargets = 2 + ⌊(L−26)/22⌋ (cap 6)
- guideTolerance 34→18px · quickDistance 40→22px · knifePathWidth 34→22px · nailTolerance 26→16px
- flinch interval 20s→8s (from L13) · flinch duration 400→900ms
- moveBudget = perfectMoves + 3 (normal) / + gate slack · coins = (20 + 2L) × starMult(1/1.3/1.6) × 2 if gate/bonus, ×0.25 on replay
- rescue cost = 40 + 3L coins (or ad: free ×2 per attempt, or IAP stub)

## The table

| L | Phase | Animal | Kind | Steps | Timer | Moves (perfect) | Mud | Clips | Paths | Stones | Spray | Shoe | Tol px | Title |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | cow |  | scrape | 36s | 3 (0) | 1 |  |  |  |  |  | 34 |  |
| 2 | 1 | cow |  | scrape | 36s | 3 (0) | 1 |  |  |  |  |  | 34 |  |
| 3 | 1 | cow |  | scrape→brush | 36s | 3 (0) | 1 |  |  |  |  |  | 34 |  |
| 4 | 1 | cow | GATE T1 | scrape→brush | 60s | 2 (0) | 2 |  |  |  |  |  | 34 | The Mud Pit |
| 5 | 1 | cow |  | scrape→brush→nippers | 39s | 6 (3) | 1 | 3 |  |  |  |  | 33 |  |
| 6 | 1 | cow |  | scrape→brush→nippers | 39s | 6 (3) | 1 | 3 |  |  |  |  | 33 |  |
| 7 | 1 | cow |  | scrape→brush→nippers | 39s | 6 (3) | 1 | 3 |  |  |  |  | 33 |  |
| 8 | 1 | cow | GATE T1 | scrape→nippers→rasp | 60s | 7 (5) | 2 | 5 |  |  |  |  | 33 | Rasp Rodeo |
| 9 | 1 | cow |  | scrape→nippers→rasp | 39s | 6 (3) | 1 | 3 |  |  |  |  | 33 |  |
| 10 | 1 | cow |  | scrape→nippers→rasp | 39s | 6 (3) | 1 | 3 |  |  |  |  | 33 |  |
| 11 | 2 | cow |  | scrape→brush→nippers→knife | 42s | 7 (4) | 1 | 3 | 1 |  |  |  | 32 |  |
| 12 | 2 | cow | GATE T1 | scrape→brush→nippers→rasp | 60s | 8 (6) | 2 | 6 |  |  |  |  | 32 | Stubborn Bessie |
| 13 | 2 | cow |  | scrape→brush→knife→rasp | 42s | 4 (1) | 1 |  | 1 |  |  |  | 32 |  |
| 14 | 2 | cow |  | scrape→brush→nippers→tweezers | 42s | 8 (5) | 2 | 4 |  | 1 |  |  | 32 |  |
| 15 | 2 | cow | GATE T2 | scrape→brush→knife→rasp | 65s | 3 (2) | 3 |  | 2 |  |  |  | 26 | The Quick & The Dead |
| 16 | 2 | cow |  | scrape→brush→nippers→tweezers | 42s | 8 (5) | 2 | 4 |  | 1 |  |  | 32 |  |
| 17 | 2 | cow |  | scrape→brush→nippers→rasp | 42s | 7 (4) | 2 | 4 |  |  |  |  | 31 |  |
| 18 | 2 | cow |  | scrape→brush→tweezers→rasp | 42s | 4 (1) | 2 |  |  | 1 |  |  | 31 |  |
| 19 | 2 | cow | GATE T2 | scrape→nippers→knife→rasp | 65s | 9 (8) | 3 | 6 | 2 |  |  |  | 25 | Deep Muck |
| 20 | 2 | goat | BONUS | scrape→brush | 25s | 99 (0) | 2 |  |  |  |  |  | 31 | Bonus: Goat Dash |
| 21 | 2 | cow |  | scrape→brush→nippers→knife | 42s | 8 (5) | 2 | 4 | 1 |  |  |  | 31 |  |
| 22 | 2 | cow |  | scrape→brush→knife→rasp | 42s | 4 (1) | 2 |  | 1 |  |  |  | 31 |  |
| 23 | 2 | cow | GATE T2 | scrape→brush→knife→rasp | 65s | 3 (2) | 3 |  | 2 |  |  |  | 24 | Thorn in the Hoof |
| 24 | 2 | cow |  | scrape→nippers→tweezers→rasp | 42s | 9 (6) | 2 | 5 |  | 1 |  |  | 30 |  |
| 25 | 2 | cow |  | scrape→nippers→knife→tweezers | 42s | 10 (7) | 2 | 5 | 1 | 1 |  |  | 30 |  |
| 26 | 3 | cow |  | scrape→knife→tweezers→rasp→spray | 45s | 7 (4) | 2 |  | 1 | 1 | 2 |  | 30 |  |
| 27 | 3 | cow | GATE T2 | scrape→brush→nippers→knife→spray | 65s | 13 (12) | 3 | 7 | 2 |  | 3 |  | 24 | The Infection |
| 28 | 3 | cow |  | scrape→brush→tweezers→rasp→spray | 45s | 6 (3) | 3 |  |  | 1 | 2 |  | 30 |  |
| 29 | 3 | cow |  | scrape→brush→tweezers→rasp→bandage | 45s | 4 (1) | 3 |  |  | 1 |  |  | 29 |  |
| 30 | 3 | cow | GATE T2 | scrape→nippers→knife→tweezers→rasp | 65s | 11 (10) | 4 | 7 | 2 | 1 |  |  | 23 | Steady Hands |
| 31 | 3 | cow |  | scrape→nippers→tweezers→rasp→spray | 45s | 11 (8) | 3 | 5 |  | 1 | 2 |  | 29 |  |
| 32 | 3 | cow |  | scrape→brush→rasp→spray→bandage | 45s | 5 (2) | 3 |  |  |  | 2 |  | 29 |  |
| 33 | 3 | goat | BONUS | scrape→brush | 25s | 99 (0) | 2 |  |  |  |  |  | 29 | Bonus: Goat Dash |
| 34 | 3 | cow | GATE T2 | scrape→nippers→knife→rasp→bandage | 65s | 11 (10) | 4 | 7 | 3 |  |  |  | 23 | Swamp Feet |
| 35 | 3 | cow |  | scrape→nippers→tweezers→spray→bandage | 45s | 11 (8) | 3 | 5 |  | 1 | 2 |  | 29 |  |
| 36 | 3 | cow |  | scrape→brush→nippers→knife→tweezers | 45s | 12 (9) | 3 | 6 | 2 | 1 |  |  | 28 |  |
| 37 | 3 | cow |  | scrape→brush→nippers→tweezers→spray | 45s | 12 (9) | 3 | 6 |  | 1 | 2 |  | 28 |  |
| 38 | 3 | cow | GATE T3 | scrape→brush→knife→rasp→bandage | 70s | 4 (3) | 4 |  | 3 |  |  |  | 22 | Stone Cold |
| 39 | 3 | cow |  | scrape→brush→nippers→tweezers→rasp | 45s | 10 (7) | 3 | 6 |  | 1 |  |  | 28 |  |
| 40 | 3 | cow |  | scrape→nippers→rasp→spray→bandage | 45s | 11 (8) | 3 | 6 |  |  | 2 |  | 28 |  |
| 41 | 4 | cow |  | scrape→nippers→knife→spray→bandage | 45s | 13 (10) | 3 | 6 | 2 |  | 2 |  | 28 |  |
| 42 | 4 | cow | GATE T3 | scrape→nippers→knife→spray→bandage | 70s | 15 (14) | 5 | 8 | 3 |  | 3 |  | 22 | Double Trouble |
| 43 | 4 | cow |  | scrape→knife→rasp→spray→bandage | 45s | 7 (4) | 4 |  | 2 |  | 2 |  | 27 |  |
| 44 | 4 | cow |  | scrape→brush→nippers→knife→spray | 45s | 13 (10) | 4 | 6 | 2 |  | 2 |  | 27 |  |
| 45 | 4 | cow |  | scrape→brush→tweezers→rasp→spray | 45s | 7 (4) | 4 |  |  | 2 | 2 |  | 27 |  |
| 46 | 4 | cow | GATE T3 | scrape→nippers→tweezers→rasp→spray | 70s | 15 (14) | 5 | 8 |  | 3 | 3 |  | 22 | The Long Trim |
| 47 | 4 | sheep | BONUS | scrape→brush | 25s | 99 (0) | 2 |  |  |  |  |  | 27 | Bonus: Sheep Dash |
| 48 | 4 | cow |  | scrape→knife→tweezers→rasp→bandage | 45s | 7 (4) | 4 |  | 2 | 2 |  |  | 26 |  |
| 49 | 4 | cow |  | scrape→brush→nippers→rasp→bandage | 45s | 10 (7) | 4 | 7 |  |  |  |  | 26 |  |
| 50 | 4 | cow | GATE T3 | scrape→nippers→knife→tweezers→spray | 70s | 20 (19) | 5 | 9 | 3 | 3 | 4 |  | 21 | Cow Graduation |
| 51 | 5 | horse |  | scrape→brush→spray→bandage→shoe | 45s | 8 (5) | 4 |  |  |  | 3 | pry2 | 30 |  |
| 52 | 5 | horse |  | scrape→tweezers→rasp→bandage→shoe | 45s | 7 (4) | 4 |  |  | 2 |  | pry2 | 30 |  |
| 53 | 5 | horse |  | scrape→knife→tweezers→spray→shoe | 45s | 17 (14) | 4 |  | 3 | 2 | 3 | pry2+nail4 | 30 |  |
| 54 | 5 | horse | GATE T3 | scrape→brush→knife→tweezers→shoe | 70s | 14 (13) | 5 |  | 4 | 3 |  | pry2+nail4 | 23 | Iron Debut |
| 55 | 5 | horse |  | scrape→nippers→knife→bandage→shoe | 45s | 19 (16) | 4 | 7 | 3 |  |  | pry2+nail4 | 29 |  |
| 56 | 5 | horse |  | scrape→brush→nippers→tweezers→shoe | 45s | 18 (15) | 5 | 7 |  | 2 |  | pry2+nail4 | 29 |  |
| 57 | 5 | horse |  | scrape→brush→nippers→bandage→shoe | 45s | 16 (13) | 5 | 7 |  |  |  | pry2+nail4 | 25 |  |
| 58 | 5 | horse | GATE T3 | scrape→brush→tweezers→bandage→shoe | 70s | 10 (9) | 5 |  |  | 3 |  | pry2+nail4 | 20 | Nail Biter |
| 59 | 5 | horse |  | scrape→brush→nippers→knife→shoe | 45s | 19 (16) | 5 | 7 | 3 |  |  | pry2+nail4 | 25 |  |
| 60 | 5 | horse |  | scrape→brush→knife→tweezers→shoe | 45s | 14 (11) | 5 |  | 3 | 2 |  | pry2+nail4 | 24 |  |
| 61 | 5 | horse |  | scrape→knife→spray→bandage→shoe | 45s | 15 (12) | 5 |  | 3 |  | 3 | pry2+nail4 | 24 |  |
| 62 | 5 | horse | GATE T4 | scrape→nippers→tweezers→spray→shoe | 80s | 24 (23) | 5 | 10 |  | 3 | 4 | pry2+nail4 | 19 | The Kicker |
| 63 | 5 | horse |  | scrape→nippers→spray→bandage→shoe | 45s | 20 (17) | 5 | 8 |  |  | 3 | pry2+nail4 | 24 |  |
| 64 | 5 | horse |  | scrape→rasp→spray→bandage→shoe | 45s | 12 (9) | 5 |  |  |  | 3 | pry2+nail4 | 24 |  |
| 65 | 5 | horse | GATE T4 | scrape→knife→tweezers→spray→shoe | 80s | 19 (18) | 5 |  | 4 | 3 | 4 | pry2+nail5 | 19 | Wild Stallion |
| 66 | 6 | horse |  | scrape→brush→tweezers→rasp→bandage→shoe | 48s | 12 (9) | 5 |  |  | 2 |  | pry2+nail5 | 23 |  |
| 67 | 6 | cow |  | scrape→brush→nippers→knife→rasp→spray | 48s | 17 (14) | 5 | 8 | 3 |  | 3 |  | 23 |  |
| 68 | 6 | horse |  | scrape→knife→tweezers→rasp→spray→shoe | 48s | 18 (15) | 5 |  | 3 | 2 | 3 | pry2+nail5 | 23 |  |
| 69 | 6 | cow | GATE T4 | scrape→brush→nippers→tweezers→spray→bandage | 80s | 18 (17) | 5 | 10 |  | 3 | 4 |  | 18 | Mudslide |
| 70 | 6 | sheep | BONUS | scrape→brush | 25s | 99 (0) | 2 |  |  |  |  |  | 23 | Bonus: Sheep Dash |
| 71 | 6 | cow |  | scrape→nippers→knife→tweezers→rasp→bandage | 48s | 17 (14) | 5 | 8 | 4 | 2 |  |  | 23 |  |
| 72 | 6 | horse |  | scrape→knife→tweezers→spray→bandage→shoe | 48s | 20 (17) | 5 |  | 4 | 2 | 4 | pry2+nail5 | 23 |  |
| 73 | 6 | cow | GATE T4 | scrape→nippers→knife→tweezers→spray→bandage | 80s | 24 (23) | 5 | 11 | 4 | 3 | 5 |  | 18 | The Perfectionist |
| 74 | 6 | horse |  | scrape→brush→knife→rasp→bandage→shoe | 48s | 14 (11) | 5 |  | 4 |  |  | pry2+nail5 | 22 |  |
| 75 | 6 | cow |  | scrape→brush→nippers→knife→rasp→bandage | 48s | 16 (13) | 5 | 9 | 4 |  |  |  | 22 |  |
| 76 | 6 | horse |  | scrape→nippers→tweezers→rasp→spray→shoe | 48s | 27 (24) | 5 | 9 |  | 3 | 4 | pry3+nail5 | 22 |  |
| 77 | 6 | cow | GATE T4 | scrape→brush→knife→tweezers→spray→bandage | 80s | 13 (12) | 5 |  | 4 | 3 | 5 |  | 18 | Fever Hooves |
| 78 | 6 | horse |  | scrape→brush→knife→tweezers→rasp→shoe | 48s | 19 (16) | 5 |  | 4 | 3 |  | pry3+nail6 | 22 |  |
| 79 | 6 | cow |  | scrape→brush→tweezers→rasp→spray→bandage | 48s | 10 (7) | 5 |  |  | 3 | 4 |  | 21 |  |
| 80 | 6 | horse | GATE T4 | scrape→nippers→knife→tweezers→bandage→shoe | 80s | 28 (27) | 5 | 11 | 4 | 3 |  | pry3+nail6 | 17 | Thunderhoof |
| 81 | 6 | cow |  | scrape→brush→nippers→knife→tweezers→bandage | 48s | 19 (16) | 5 | 9 | 4 | 3 |  |  | 21 |  |
| 82 | 6 | goat | BONUS | scrape→brush | 25s | 99 (0) | 2 |  |  |  |  |  | 21 | Bonus: Goat Dash |
| 83 | 6 | cow |  | scrape→nippers→knife→rasp→spray→bandage | 48s | 20 (17) | 5 | 9 | 4 |  | 4 |  | 21 |  |
| 84 | 6 | horse | GATE T5 | scrape→nippers→tweezers→spray→bandage→shoe | 90s | 30 (29) | 5 | 12 |  | 3 | 5 | pry3+nail6 | 17 | The Gauntlet |
| 85 | 6 | cow |  | scrape→brush→knife→tweezers→spray→bandage | 48s | 14 (11) | 5 |  | 4 | 3 | 4 |  | 20 |  |
| 86 | 7 | horse |  | scrape→nippers→knife→rasp→spray→bandage→shoe | 48s | 30 (27) | 5 | 10 | 4 |  | 4 | pry3+nail6 | 20 |  |
| 87 | 7 | horse |  | scrape→nippers→knife→rasp→spray→bandage→shoe | 48s | 30 (27) | 5 | 10 | 4 |  | 4 | pry3+nail6 | 20 |  |
| 88 | 7 | horse | GATE T5 | scrape→nippers→knife→tweezers→rasp→spray→shoe | 90s | 34 (33) | 5 | 12 | 4 | 3 | 5 | pry3+nail6 | 16 | The Gauntlet II |
| 89 | 7 | horse |  | scrape→brush→nippers→knife→spray→bandage→shoe | 48s | 31 (28) | 5 | 10 | 4 |  | 4 | pry3+nail7 | 20 |  |
| 90 | 7 | horse |  | scrape→nippers→knife→tweezers→rasp→spray→shoe | 48s | 34 (31) | 5 | 10 | 4 | 3 | 4 | pry3+nail7 | 20 |  |
| 91 | 7 | horse |  | scrape→brush→nippers→tweezers→spray→bandage→shoe | 48s | 30 (27) | 5 | 10 |  | 3 | 4 | pry3+nail7 | 19 |  |
| 92 | 7 | horse | GATE T5 | scrape→brush→nippers→knife→tweezers→spray→shoe | 90s | 35 (35) | 5 | 12 | 4 | 3 | 6 | pry3+nail7 | 15 | No Room for Error |
| 93 | 7 | horse |  | scrape→nippers→knife→rasp→spray→bandage→shoe | 48s | 32 (29) | 5 | 10 | 4 |  | 5 | pry3+nail7 | 19 |  |
| 94 | 7 | horse |  | scrape→brush→knife→tweezers→rasp→bandage→shoe | 48s | 20 (17) | 5 |  | 4 | 3 |  | pry3+nail7 | 19 |  |
| 95 | 7 | horse | GATE T5 | scrape→nippers→knife→rasp→spray→bandage→shoe | 90s | 32 (32) | 5 | 12 | 4 |  | 6 | pry3+nail7 | 15 | Master Farrier Exam |
| 96 | 7 | horse |  | scrape→knife→tweezers→rasp→spray→bandage→shoe | 48s | 25 (22) | 5 |  | 4 | 3 | 5 | pry3+nail7 | 19 |  |
| 97 | 7 | horse |  | scrape→brush→nippers→tweezers→rasp→spray→shoe | 48s | 32 (29) | 5 | 11 |  | 3 | 5 | pry3+nail7 | 18 |  |
| 98 | 7 | horse |  | scrape→knife→tweezers→rasp→spray→bandage→shoe | 48s | 25 (22) | 5 |  | 4 | 3 | 5 | pry3+nail7 | 18 |  |
| 99 | 7 | horse |  | scrape→brush→nippers→tweezers→rasp→bandage→shoe | 48s | 27 (24) | 5 | 11 |  | 3 |  | pry3+nail7 | 18 |  |
| 100 | 7 | horse | GATE T5 | scrape→brush→nippers→rasp→spray→bandage→shoe | 90s | 31 (31) | 5 | 12 |  | 3 | 6 | pry3+nail7 | 14 | The Legendary Draft Horse |
