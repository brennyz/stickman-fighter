# PLAYTEST BOT 6/9 — Telegraphs / fair fail

**Build playtested:** LIVE `origin/main` `c9a29fc` · **v1.18.190 / SW 400**  
**This draft:** v1.18.191 / SW 401 · `cursor/playtest-telegraphs-51fa`  
**Until:** ~18:36 Amsterdam · **No Versus · no main · density numbers report-only**  
**Share:** `speel.html`

Lane owns readable wind-ups, unfair one-shots, HUD cues. Spawn scale / maxAlive / interval / batch / gap stay with #314.

## Density report (unchanged)

From `npm run smoke:combat-density` on `c9a29fc`:

| Viewport | Scale | Max alive | Interval × | Batch | Gap |
|----------|------:|----------:|-----------:|------:|----:|
| Desktop 1280×800 mouse | **1.00** | **78** | 1.00 | 3 | 32 |
| Phone 390×844 | **0.50** | **12** | **1.55** | **1** | **64** |
| Phone land 844×390 | 0.751 | 14 | 1.55 | 1 | 64 |
| Tablet 834×1194 | 0.806 | 37 | 1.12 | 2 | 42 |

Wind floors (also unchanged by this PR except fail-cue write):

| Cue | Desk | Phone |
|-----|------|-------|
| Charge / enrage / shark floor | 0.45 / **0.32** / **0.32** | **0.38** |
| Ranged (shoot/fire/ink) | ≥ **0.40** (0.42 measured on 0.42 base) | ≥ **0.46** (0.5376 on 0.42×1.28) |
| HUD slots | 2 | 2 portrait · **1 +N** short land |
| Ring scale | 1.00 | **1.22** |

## Method

- `python3 serve.py` → `http://127.0.0.1:8787/index.html?nosplash=1`
- Computer-use: desktop 1280×800 + phone 390×844 Adventure (no Versus tile)
- Contract smokes: `smoke:telegraph-read` + `smoke:combat-density` green on LIVE
- Code read of `notePlayerFailTele` / `ensureAdventureFailTele` / hop+fly AI (no wind)

## What passed

| Check | Desk | 390 |
|-------|------|-----|
| Versus tile | absent | absent |
| CHARGE HUD | **CHARGE — uit de weg!** + **0.5** chip, yellow plate | same cue on lose (`CHARGE →`) when the killer was a charger |
| World ring | present; yellow lane dash visible | not captured mid-wind (deaths were contact) |
| Lose CTA | fat gold **Nog één keer** | same |
| Killer name | `#resKiller` (Bubbel / Moerasly / Holpaard / Kikkervis) | same |
| Hop/slime one-shot from full HP | no — 5–7 dmg chips (`Kikkervis −7`) | no |
| Density numbers | not retuned | not retuned |

CHARGE proof: `docs/playtest-telegraph-6/desk-charge-hud.webp`

## Findings (ranked)

### P1 TF-001 — Fail cue lies: slime kill says `vlieger →`

Reproduced desk **and** 390. Killer `#resKiller` = **Bubbel** (hop slime). Tip lead = **vlieger → Nog één keer · Bubbel tikt je uit**.

Cause (LIVE):

1. `notePlayerFailTele` only wrote when it found a kind — a bat chip left `lastFailTele = flyer`, then a slime kill did not clear it.
2. If kind was empty it scanned **any alive flyer** and stamped `flyer`.

Fair-fail miss: you learn the wrong pipe.

**Fix in this draft:** always write `lastFailTele` from **this** attacker (`combatFailTeleKind`). No leftover, no other-bat steal. Hop contact → empty cue (Moerasly path). Smoke: slime after flyer leftover must be `''`.

Proof: `desk-bubbel-vlieger-wrong.webp` (before). After-fix: slime death should match Moerasly (`desk-moerasly-contact.webp`) — **Nog één keer · {name} tikt je uit**, no vlieger.

### P1 TF-002 — Hop / fly have no wind-up (L1 default deaths)

L1 opener is hop + fly. Neither sets `telegraphT`. HUD bar never appears. Deaths in 2–5s standing still:

- **Moerasly / Kleiply / Kikkervis** — contact, no prefix (`desk-moerasly-contact.webp`, `phone-kikkervis-contact.webp`)
- **Flapper / “vlieger”** — contact in air; tip can say `vlieger →` but there was no dodge bar

This is the Flappy “body is the pipe” case **if** you see them. On 390 the slime is small on a bright sky; first deaths feel random until you learn “don’t stand on them”. Not a density change — optional later: hop squash / fly dive ring (visual only).

### P1 TF-003 — World CHARGE ring washes out on day sky

HUD bar is the readable cue. World ring is a thin dark circle + faint yellow dash (`desk-charge-hud.webp`). Contract wants high-contrast ring + arrow. On cyber/night it may be fine; on default day stage the plate at mid-HUD does the work. Leftover: thicker / darker outline (no wind-time change).

### P2 TF-004 — `ensureAdventureFailTele` mapped every `swim` → CHARGE

LIVE: if `lastFailTele` was empty, `lastHurtBy.type === 'swim'` became CHARGE. Ink/octo blob would coach the wrong dodge. This draft stops that stamp; shark dash still tags charge on the hit via `art === 'shark'`. Not seen in L1 play (no sea wave).

### P2 TF-005 — SLAM / SCHIET / VUUR / INKT not seen in L1 window

L1 roster is hop/fly. Those winds exist in code + smoke (tank/shoot/dragon/octo `telegraphKind`, HUD labels, ranged floors). Session did not reach golem/dragon/octo. Multi-bar 2-stack / land 1+N only smoke-proved, not photographed.

### P2 TF-006 — Heat lecture after many L1 fails

After ~7 fails, 390 lose tip grew `Lv 1: 7/10 · 5 Meester · 9 gevaar · 10 Satan` behind the fail lead. EX-032 already puts heat last; still long on 390. Sibling lose-copy / #320 — not retuned here.

## Unfair one-shots?

No full-HP one-shot observed. Contact chips ~5–7 on ~100 HP. CHARGE dash is ×1.3 but still a chip from full. Unfair feel on L1 is **untelegraphed contact + wrong vlieger label**, not a 100→0 slam.

## Out of scope (left)

| Item | Owner |
|------|--------|
| Density 0.50 / ×1.55 / batch 1 / gap 64 | #314 — reported only |
| Nog één keer size / `<3s` | #323 / #326 |
| First-30s teach copy | #328 |
| Landscape 844×390 1+N photo | not finished before 18:36 |
| Versus | retired |

## Prove

```bash
npm run smoke:telegraph-read
npm run smoke:combat-density
```
