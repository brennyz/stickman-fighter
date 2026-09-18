# PLAYTEST BOT 5/9 — DEATH→RETRY (draft findings)

**Lane:** 5 of 9 · Avontuur death → retry  
**Build:** LIVE `main` `c9a29fc` · **v1.18.190** · **SW 400** (Pages `game.js?v=400` matches)  
**Window:** 2026-09-18 until ~18:36 Amsterdam  
**Share URL:** `speel.html`  
**Out of scope:** Versus · merge to `main` · damage/formula changes

Instrument: `scripts/playtest-death-retry.mjs` + `npm run smoke:lose-retry` + browser play (portrait 390×844, landscape 844×390).  
Shots: `/opt/cursor/artifacts/screenshots/playtest5-*-result.png`.

## Verdict

**Contract PASS.** Die → fat gold **Nog één keer** in **~720ms**, same-level rematch in **<70ms**, no dice, killer name + fail-cue tip first. Portrait and landscape both work. No P0 / P1.

| Check | 390×844 | 844×390 | 834×1194 | 1194×834 | 1280×800 |
|-------|--------:|--------:|---------:|---------:|---------:|
| Death → CTA | **725ms** | **730ms** | 715ms | 731ms | 711ms |
| Button height | **113** | **113** | 121 | 121 | 121 |
| Label | Nog één keer | Nog één keer | same | same | same |
| Killer | SlamToad | SlamToad / ChargeBoar | SlamToad | SlamToad | SlamToad |
| Tip lead | `SLAM → Nog één keer` | `SLAM` / `CHARGE →` | SLAM | SLAM | SLAM |
| Rematch play | 65ms L1 | 18ms L1 | 25ms | 39ms | 10ms |
| Dice flash | off | off | off | off | off |
| FOMO on result | hidden | hidden | hidden | hidden | hidden |
| Overflow | none | none | none | none | none |

`combatLoseResultMs` still *reports* 650 (compact) / 850 (desk) but the live delay is `resultShowDelayMs` = **700ms** everywhere. Still well under 3s.

Natural play (stand in L1): Kip op Hol / Bubbel / Kikkervis / Slymo deaths showed named killer + cue; tap-safe dark space retries; Hoofdmenu stays quiet and goes HOME.

## Findings

### P2 — Heat lecture stacks after ~5 fails

After a handful of deaths on the same save, the cyan tip becomes:

`SLAM → Nog één keer · SlamToad sloeg plat — spring de slam · begin · Lv 1: 5/10 · 5 Meester · 9 gevaar · 10 Satan`

Cue still leads (EX-032) so this is not a P1 bury. On a short landscape (844×390) that line is a number dump under the killer. Prefer: lose tip = **cue + killer advice + wave**; keep heat on the island card.

### P2 — First-loss dice lecture vs instant rematch

With `feltFirstPunch` set, portrait tip adds *“Eerste nederlaag: vóór elk level kun je dobbelen…”*. **Nog één keer** is `restartAdventureInstant` — no dice. The lecture is true for *island* start, false for this CTA. Drop or gate that once-tip when `instantRetry` is the path.

### P3 — Documented 650/850 lose delay is dead

`finishAdventure` computes `combatLoseResultMs()` then prefers `resultShowDelayMs()` (always 700 / 160 reduced). Smoke prints 650/850; measured CTA is ~720 on phone *and* desk. Either wire the helper or fix the contract table in `docs/COMBAT-DENSITY.md`.

### P3 — Official smoke missed landscape

`smoke:lose-retry` was 390 + 1280 only. This draft adds **844×390** (`phone-land-844`, scale 0.751 / maxAlive 14, fat ≥64). Playtest script already covers tablet + real-hit CHARGE.

### Not a bug

- Portrait empty band above the dock = Flappy-feel (CTA parked at the thumb).
- Landscape min-height media (56/64) loses to `body.big-touch .juice-cta-primary` **84px**; measured **113px**. Fat stays fat. Tight, not clipped.
- Wave text `begin` on some seeded deaths = finish before first tick. Live stand-still deaths showed `1/2 golven`.
- `ChargeBoar` on the real-hit row is a correct killer; an early checker looked for “Slam” only.

## Leftovers (not this bot)

| Item | Owner |
|------|--------|
| Trim heat / dice lecture on lose tip | copy / #326 follow |
| Wire or drop `combatLoseResultMs` | density + #323 delay |
| Versus rematch | retired — do not test |

## Prove

```bash
npm run smoke:lose-retry
node scripts/playtest-death-retry.mjs
```
