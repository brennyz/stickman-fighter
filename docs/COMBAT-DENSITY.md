# Adventure combat contract — phone vs desktop

**Lane:** mobile combat balance · **Modes:** Adventure only · **Not:** Versus, Training, Wall, Coinrun  
**Share URL:** `speel.html`  
**Android-first.** Draft #314. Desktop (`W ≥ 960`) stays legacy 1.0.

This is the **final viewport contract** for this lane. Phone gets a fair strip. Desktop does not get easier.

## Contract (what must stay true)

| Rule | Desktop 1280×800 | Phone 390×844 (and compact) |
|------|------------------|-----------------------------|
| Scale / horde | **1.00** — do not gut PC | Floor **0.60** — still a horde, not a pile-on |
| Max alive | **78** mouse / **54** touch | **~17** portrait (slots × layers, live cap) |
| Spawn batch / gap | Batch **3** · gap **32** | Batch **1** · gap **56** |
| Interval mul | **1.00** | **1.38** then clamp (see opener / sustain) |
| Wave **count** | Unchanged | **Same count** (stage length / XP) |
| HP / damage | Unchanged | Unchanged |
| Versus / Training / Wall / Coinrun | Untouched | Untouched |

Wide screens (`W ≥ 960`) always get scale `1.00`. Phone floor `0.60` means level 12 ≈ 15/wave vs 24 on desktop — still a horde, not 36 bodies in 390px. Early openers stay soft-capped (level 1 = 2 then 4).

## First 30s opener + minute-1+ sustain (P0)

Density muls stacked into **empty then spike** on 390px: wave 1 interval ≈ 2.58s, wave 2 ≈ 0.52s. After the 30s opener, raw ×1.38 still dumped (~0.38s) after a ~2.2s wave-pause hole.

| Piece | Desktop | Phone first 30s | Phone after 30s / minute 1+ |
|-------|---------|-----------------|------------------------------|
| Spawn interval | Raw | Clamp **0.70–1.12s** | Sustain **0.62–1.05s** |
| Start hold `betweenT` | **1.2s** | **0.55s** | 1.2s |
| Between-wave `wavePause` | 1.55 / boss 2.15 | Same compact scale | **×0.56** (floor 0.82, cap 1.25) |
| Win-clear fanfare | 2.35 | **Unscaled** (not a combat spike) | Unscaled |
| First `spawnTimer` | 0.45 × intervalMul | Clamp 0.70–1.12 | Sustain 0.62–1.05 |
| Spawn edge | `W+40` / `-40` | `W+18` / `-18` | Same compact edge |
| Batch | Opener single-file | Opener single-file | Single-file |

Helpers: `combatSmoothOpenInterval`, `combatWaveGapSec`, `combatOpenerHold`, `combatSpawnEdgeX`. Desktop never enters the clamp.

## Tablet mid-band 834px (follow-up)

iPad portrait 834×1194 is **not** compact (scale 0.806, batch **2**, gap 42). Raw opener ≈ 2.10s then wave-2 ≈ 0.43s; minute 1+ long-queue ≈ **0.31s** with batch 2. Milder clamp than phone — still a pair, not a dump.

| Piece | Desktop | Tablet 834 | Phone 390 |
|-------|---------|------------|-----------|
| First 30s interval | raw | **0.66–1.22s** | 0.70–1.12s |
| After 30s / minute 1+ | raw | **0.55–1.15s** | 0.62–1.05s |
| Start hold | 1.2s | **0.80s** | 0.55s |
| Wave gap | 1.55 | **×0.72** (~1.12s) | ×0.56 (~0.87s) |
| Spawn edge | W+40 | **W+28** | W+18 |
| Swipe / prefer-strike | no | **no** (phone-only) | yes |

Wide `W ≥ 960` stays 1.0. Versus out.

## Death result CTA — leave #323 alone

#323 owns Flappy-feel retry (`Nog één keer` in ~700ms). This lane does **not** change `scheduleGameResult(win ? 1600 : 1400)`, `showResult`, result CSS, or rematch routing. Combat-only.

## Touch punch / kick vs joy (P0)

| Piece | Desktop | Phone 390×844 |
|-------|---------|---------------|
| Swipe / move pad | Joy circle only | 1P left-bottom **34% × below 62%** (was 42% × 55%) |
| Punch / kick claim | Hit slop only | **Prefer-strike:** punch/kick win the band toward the joy (`r+32`, closer than joy + 8px) |
| Dual / Versus | No extra pad | No extra pad |

Kick sits on the inner column of the right cluster (closest strike to the joy). A near-miss used to die in `nearAnyTouchButton` or become a swipe. `claimTouchStrike` fires punch/kick first.

## Density table

| Viewport | Scale | Max alive | Interval × | Batch max | Gap |
|----------|------:|----------:|-----------:|----------:|----:|
| Desktop 1280×800 (mouse) | **1.00** | **78** | 1.00 | 3 | 32 |
| Desktop 1280×800 (touch laptop) | **1.00** | **54** | 1.00 | 3 | 32 |
| iPad landscape ≥960 | **1.00** | 54 (touch) | 1.00 | 3 | 32 |
| iPad portrait 834×1194 | 0.806 | 42 | 1.12 | 2 | 42 |
| Phone landscape 844×390 | 0.751 | 33 | 1.38 | 1 | 56 |
| Phone portrait 390×844 | **0.60** | **17** | 1.38 | 1 | 56 |
| Android small 360×800 | **0.60** | 15 | 1.38 | 1 | 56 |

## Fairness extras (examinator EX-1…6)

| Cue | Desktop (unchanged) | Phone / compact |
|-----|---------------------|-----------------|
| Charge wind | 0.45s (enrage 0.28) | ×1.28, floor **0.38s** |
| Charge trigger | 240px | ≤ 42% of W (~164px) — ring on-screen |
| Elite/boss intro | AI still fights | Aggression **held** until introT; banners cap 40px |
| Jump hit | legacy slop | **+10px** slop |
| Colossal size | ×**2.0** uncapped | ×**1.38** then 0.24-strip cap (~94px, lane ≥80px). HP/dmg same |
| Colossal wind | raw | Floor **0.46s** |
| Hell enrage walk | 1.32 × enrageMul (**1.7424**) | Extra ×0.52 → Hell **~1.386** |
| Floor loot | x unchanged | **40px** fan |
| Telegraph HUD | 2 bars | 2 bars portrait; short land **1 +N** |
| Flyer hover / melee | 110 / 130 · lift 88 | Short 844×390 hover ~84, lift **104**; tall phone hover 110, lift 96 |
| Part-gate hold-right | **3.35s** | **2.2s** |

## Code

| Piece | Where |
|-------|--------|
| Profile / cadence / opener / strike | `src/systems/combat-density.js` |
| Wave size + boss pad | `buildLevel` in `src/data/monsters.js` |
| Live alive-cap + spacing + opener hold | `updateAdventure` / `nextWave` / `initAdventure` in `src/game/game.js` |
| Punch/kick prefer-strike | `claimTouchStrike` in `src/systems/input.js` |
| Test hook | `window.__sf.combatDensity` |
| Proof smoke | `npm run smoke:combat-density` |

Live cap (`adventureMaxAliveNow`) follows the current viewport so rotate-to-landscape can admit more walkers without rebuilding the wave list. Wave **composition** is baked at `startGame` from the viewport at that moment.

## Prove

```bash
npm run smoke:combat-density
npm run smoke:adventure
```

The density smoke prints the table, asserts desktop scale/cadence == legacy, asserts phone < desktop on mid-level spawn budget, asserts first-30s clamp + prefer-strike, and greps Versus off the density path.

Measured `buildLevel` budgets (same wave **count**, fewer bodies on phone):

| Level | Desktop spawn bodies | Phone 390×844 | Waves |
|-------|---------------------:|--------------:|------:|
| 1 (opener) | 2 + 4 | 2 + 4 (unchanged) | 2 |
| 12 Normal | 112 | 67 | 4 |
| 20 Hell 3.0 | 219 | 136 | still a horde |

`npm run smoke:adventure` on a 390×844 Chrome window still clears level 1 (spawnQ 2 then 4). `smoke:wave12` still advances 1→2. Training / Versus unchanged.

## Lane status — DONE

Phone density **#314** and tablet 834 cadence **#324** are **done**. Desktop 1.0 unchanged. Versus out. No further combat P0 on this lane.

**Owned elsewhere / later (not this lane):**

| Item | Owner |
|------|--------|
| Death result CTA timing / `Nog één keer` | **#323** |
| Examinator leftovers | **#320** |
| Satan / tide duel cadence | special-duel path |
| Hell 20+ many-minute juice | later |

Re-check: `npm run smoke:combat-density && npm run smoke:adventure`.
