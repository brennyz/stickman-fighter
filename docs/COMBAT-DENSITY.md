# Adventure combat contract — phone vs desktop

**Lane:** mobile combat balance · **Modes:** Adventure only · **Not:** Versus, Training, Wall, Coinrun  
**Share URL:** `speel.html`  
**Android-first (web / PWA).** Draft #314. Desktop (`W ≥ 960`) stays legacy 1.0. No Android native.

This is the **viewport contract** for this lane. Phone gets a fair strip. Desktop does not get easier.

## Contract (what must stay true)

| Rule | Desktop 1280×800 | Phone 390×844 (and compact) |
|------|------------------|-----------------------------|
| Scale / horde | **1.00** — do not gut PC | Floor **0.50** — still a horde, not a pile-on |
| Max alive | **78** mouse / **54** touch | **~12** portrait (slots × 1.65 layers, live cap **8–14**) |
| Spawn batch / gap | Batch **3** · gap **32** | Batch **1** · gap **64** |
| Interval mul | **1.00** | **1.55** then clamp (see opener / sustain) |
| Wave **count** | Unchanged | **Same count** (stage length / XP) |
| HP / damage | Unchanged | Unchanged |
| Versus / Training / Wall / Coinrun | Untouched | Untouched |

Wide screens (`W ≥ 960`) always get scale `1.00`. Phone floor `0.50` means level 12 ≈ 12/wave vs 24 on desktop — still a horde, not 36 bodies in 390px. Early openers stay soft-capped (level 1 = 2 then 4).

## First 30s opener + minute-1+ sustain (P0)

Density muls stacked into **empty then spike** on 390px: wave 1 interval ≈ 2.58s, wave 2 ≈ 0.52s. After the 30s opener, raw ×1.55 still dumps after a wave-pause hole — sustain clamp holds the floor.

| Piece | Desktop | Phone first 30s | Phone after 30s / minute 1+ |
|-------|---------|-----------------|------------------------------|
| Spawn interval | Raw | Clamp **0.70–1.12s** | Sustain **0.62–1.05s** |
| Start hold `betweenT` | **1.2s** | **0.55s** | 1.2s |
| Between-wave `wavePause` | 1.55 / boss 2.15 | Same compact scale | **×0.56** (floor 0.82, cap 1.25) |
| Win-clear fanfare | 2.35 | **Unscaled** (not a combat spike) | Unscaled |
| First `spawnTimer` | 0.45 × intervalMul | Clamp 0.70–1.12 | Sustain 0.62–1.05 |
| Spawn edge | `W+40` / `-40` | `W+18` / `-18` | Same compact edge |
| Batch | Opener single-file | Opener single-file | Single-file |

| Piece | Tablet 834×1194 (mid-band) |
|-------|----------------------------|
| Scale / max alive | **0.806 / ~37** — between phone 0.50/~12 and desktop 1.0/78 |
| Spawn interval | First 30s clamp **0.66–1.22s**; after 30s **0.55–1.15s** (no 0.31s dump) |
| Start hold | **0.80s** |
| Between-wave pause | **×0.72** (floor 1.00, cap 1.60) |
| Spawn edge | `W+28` / `-28` |
| Batch | **2** |

Helpers: `combatCadenceBand`, `combatSmoothOpenInterval`, `combatWaveGapSec`, `combatOpenerHold`, `combatSpawnEdgeX`. Desktop never enters the clamp. Result CTA layout stays with #318/#323.

## Death → fail telegraph → Nog één keer (P0)

Readable last-hit cue, then a fat retry. Death → play again in under ~3s. No extra toasts.

| Piece | Desktop | Phone 390×844 |
|-------|---------|---------------|
| Lose result delay | **850ms** | **650ms** (reduced-motion **160ms**) |
| Win result delay | **1600ms** | **1600ms** (unchanged) |
| Lose banner | **1.1s** | **1.1s** + light shake |
| Retry label | **Nog één keer** | Same, min-height **72px** (`#resultScreen.lose-retry`) |
| Rematch | Instant same level, **no dice** | Same (`restartAdventureInstant`) |
| Tip | `{cue} → Nog één keer` | SLAM / CHARGE / vlieger / SCHIET / VUUR |
| FOMO sheet | Hidden on result | Hidden on result |

Win still uses `gokGooiStartLevel` (dice flash). Versus / Training rematch paths unchanged. #323 may still land its own CTA later — this lane owns the Adventure lose path on #314.

Helpers: `combatLoseResultMs`, `notePlayerFailTele`, `combatFailRetryTip`, `restartAdventureInstant`.

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
| iPad portrait 834×1194 | **0.806** | **~37** | 1.12 + clamp | 2 | 42 |
| Phone landscape 844×390 | 0.751 | **14** (compact cap) | 1.55 | 1 | 64 |
| Phone portrait 390×844 | **0.50** | **~12** | 1.55 | 1 | 64 |
| Android small 360×800 | **0.50** | **~10** | 1.55 | 1 | 64 |

## Fairness extras (examinator EX-1…6)

| Cue | Desktop (unchanged) | Phone / compact |
|-----|---------------------|-----------------|
| Charge wind | 0.45s (enrage floor **0.32s**) | ×1.28, floor **0.38s** |
| Charge trigger | 240px | ≤ 42% of W (~164px) — ring on-screen |
| Elite/boss intro | AI still fights | Aggression **held** until introT; banners cap 40px |
| Jump hit | legacy slop | **+10px** slop |
| Colossal size | ×**2.0** uncapped | ×**1.38** then 0.24-strip cap (~94px, lane ≥80px). HP/dmg same |
| Colossal wind | raw | Floor **0.46s** |
| Hell enrage walk | 1.32 × enrageMul (**1.7424**) | Extra ×0.52 → Hell **~1.386** |
| Floor loot | x unchanged | **40px** fan |
| Telegraph HUD | 2 bars · shoot/fire/ink use `telegraphT` | 2 bars portrait; short land **1 +N** |
| Flyer hover / melee | 110 / 130 · lift 88 | Short 844×390 hover ~84, lift **104**; tall phone hover 110, lift 96 |
| Part-gate hold-right | **3.35s** | **2.2s** |

## Code

| Piece | Where |
|-------|--------|
| Profile / cadence / opener / strike / lose CTA | `src/systems/combat-density.js` |
| Instant rematch | `restartAdventureInstant` in `src/systems/missions.js` |
| Wave size + boss pad | `buildLevel` in `src/data/monsters.js` |
| Live alive-cap + spacing + opener hold | `updateAdventure` / `nextWave` / `initAdventure` in `src/game/game.js` |
| Punch/kick prefer-strike | `claimTouchStrike` in `src/systems/input.js` |
| Fail telegraph record | `notePlayerFailTele` from `Fighter.takeDamage` |
| Test hook | `window.__sf.combatDensity` |
| Proof smoke | `npm run smoke:combat-density` |

Live cap (`adventureMaxAliveNow`) follows the current viewport so rotate-to-landscape can admit more walkers without rebuilding the wave list (compact still caps at 14). Wave **composition** is baked at `startGame` from the viewport at that moment.

## Prove

```bash
npm run smoke:combat-density
npm run smoke:lose-retry
npm run smoke:adventure
```

The density smoke prints the table, asserts desktop scale/cadence == legacy, asserts phone < desktop on mid-level spawn budget, asserts first-30s clamp + prefer-strike, asserts lose CTA 650/850 + fail tip, and greps Versus off the density path.

Measured `buildLevel` budgets (same wave **count**, fewer bodies on phone):

| Level | Desktop spawn bodies | Phone 390×844 | Waves |
|-------|---------------------:|--------------:|------:|
| 1 (opener) | 2 + 4 | 2 + 4 (unchanged) | 2 |
| 12 Normal | 112 | ~56 | 4 |
| 20 Hell 3.0 | 219 | still a horde (≥20) | same count |

`npm run smoke:adventure` on a 390×844 Chrome window still clears level 1 (spawnQ 2 then 4). `smoke:wave12` still advances 1→2. Training / Versus unchanged.

## Lane status — P0 reopen (density + retry)

Combat density on 390px was still a pile-on at floor 0.60 / ~17 alive. This pass tightens compact pressure and owns the Adventure lose CTA on #314.

**Leftovers** (not this PR):

| Item | Owner |
|------|--------|
| Tablet 834 mid-band cadence | **this PR** — 0.66–1.22 / 0.55–1.15 |
| Telegraph readability (rings / ranged wind / desktop floor) | sibling `docs/COMBAT-TELEGRAPH.md` — not density counts |
| Satan / tide duel cadence | special-duel path, not density spawn |
| Hell 20+ many-minute juice (feel, not counts) | later |
| Android native / TWA bump | out of scope |

Re-check: `npm run smoke:combat-density && npm run smoke:lose-retry && npm run smoke:adventure`.
