# Adventure combat density (mobile fairness)

**Lane:** mobile combat balance · **Modes:** Adventure only · **Not:** Versus, Training, Wall, Coinrun  
**Share URL:** `speel.html`

## Problem

Adventure used the same horde math on every screen:

- `perWave = min(ceil((2 + floor(n/4)) × 6 × hordeMul), 36)`
- simultaneous alive cap `54` (touch) / `78` (mouse)
- spawn cadence `0.38s` with batches of 2–3 and `32px` gaps

A 390×844 phone has ~⅓ the fight-strip width of a 1280×800 desktop. The same 24–36 mobs arrive as a pile-on. Desktop was fine; the phone was not.

## Rule

Scale **spawn counts**, **spacing**, and **simultaneous threats** by playfield size. Do **not** shorten wave count (stage length / XP pacing). Do **not** change HP/damage. Do **not** touch Versus.

| Viewport | Scale | Max alive | Interval × | Batch max | Gap |
|----------|------:|----------:|-----------:|----------:|----:|
| Desktop 1280×800 (mouse) | **1.00** | **78** | 1.00 | 3 | 32 |
| Desktop 1280×800 (touch laptop) | **1.00** | **54** | 1.00 | 3 | 32 |
| iPad landscape ≥960 | **1.00** | 54 (touch) | 1.00 | 3 | 32 |
| iPad portrait 834×1194 | 0.806 | 42 | 1.12 | 2 | 42 |
| Phone landscape 844×390 | 0.751 | 33 | 1.38 | 1 | 56 |
| Phone portrait 390×844 | **0.60** | **17** | 1.38 | 1 | 56 |
| Android small 360×800 | **0.60** | 15 | 1.38 | 1 | 56 |

Wide screens (`W ≥ 960`) always get scale `1.00` — desktop difficulty is unchanged.

Phone floor is **0.60**: still a horde (level 12 ≈ 15/wave vs 24 on desktop), just not 36 bodies in 390px. Early openers stay soft-capped (level 1 wave 1 = 2, wave 2 = 4).

## Code

| Piece | Where |
|-------|--------|
| Profile / cadence | `src/systems/combat-density.js` |
| Wave size + boss pad | `buildLevel` in `src/data/monsters.js` |
| Live alive-cap + spacing | `updateAdventure` in `src/game/game.js` |
| Test hook | `window.__sf.combatDensity` |
| Proof smoke | `npm run smoke:combat-density` |

Live cap (`adventureMaxAliveNow`) follows the current viewport so rotate-to-landscape can admit more walkers without rebuilding the wave list. Wave **composition** is baked at `startGame` from the viewport at that moment.

## Prove

```bash
npm run smoke:combat-density
```

The smoke prints the table above, asserts desktop scale/cadence == legacy, asserts phone < desktop on mid-level spawn budget, and greps Versus off the density path.

Measured `buildLevel` budgets (same wave **count**, fewer bodies on phone):

| Level | Desktop spawn bodies | Phone 390×844 | Waves |
|-------|---------------------:|--------------:|------:|
| 1 (opener) | 2 + 4 | 2 + 4 (unchanged) | 2 |
| 12 Normal | 112 | 67 | 4 |
| 20 Hell 3.0 | 219 | 136 | still a horde |

`npm run smoke:adventure` on a 390×844 Chrome window still clears level 1 (spawnQ 2 then 4). `smoke:wave12` still advances 1→2. Training / touch buttons unchanged.

## Examinator pass (390px, after density)

| Cue | Desktop (unchanged) | Phone 390×844 |
|-----|---------------------|---------------|
| Charge wind | 0.45s (enrage 0.28) | ×1.28, floor **0.38s** (enrage shark 0.20 → 0.38) |
| Charge trigger | 240px | ≤ 42% of W (~164px) so the ring is **on-screen** |
| Elite/boss intro | AI still fights | Aggression **held** until introT ends; banners cap 40px |
| Jump hit | legacy slop | **+10px** slop (dodge is the telegraph answer) |
| Swipe dead-zone | joy circle only | 1P left-bottom **42% × below 55%** is a move pad |

Versus / dual pads are not used.

## Colossal bosses on 390px (EX-1)

Desktop colossal stays **size ×2.0**, uncapped. Phone uses **×1.38** then a playfield cap (`0.24 × strip`, min 64) so a Guvvedrak-scale body (~168 radius) fits ~94px and leaves **≥80px** of ground if centered. HP/damage muls are unchanged. Compact colossal winds floor at **0.46s**. Resize refits via `refreshAdventureBossScale` (Satan keeps its own scaler).

## Remaining mobile overwhelm (EX)

Still true after density + telegraph + colossal fit:

1. **HUD shows one telegraph** (`adventureTelegraphHud` breaks on the first). Two elites winding at once = one bar.
2. **Flyers / aim-up** on short landscape (844×390): vertical fight space is still tight.
3. **Hell enrage walk speed** is not scaled — only the wind floor. Late Hell on a phone is still the hard lane.
4. **Part-gate “hold right”** on portrait still asks for a long right-walk with the left stick.
5. **Pickup clutter** after a thinner wave is better, but gear + shards can still stack on the 390px floor.

Re-check after play: `npm run smoke:combat-density && npm run smoke:adventure`.
