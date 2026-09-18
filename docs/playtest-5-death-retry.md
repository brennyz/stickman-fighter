# PLAYTEST BOT 5/9 — DEATH→RETRY (draft)

**Lane:** 5 of 9 · death → retry  
**Build:** LIVE `main` `c9a29fc` · **v1.18.190** · **SW 400**  
**Window:** until ~18:36 Amsterdam · 2026-09-18  
**Share URL:** `speel.html`  
**Out of scope:** Versus · Training/Wall/Coinrun · merge to main

## Contract (what this bot checks)

| Check | Pass |
|-------|------|
| Die in Avontuur | Result screen, not HOME maze |
| Fat **Nog één keer** | Gold primary, fat tap (portrait ≥72px, landscape ≥64px) |
| CTA in **< 3s** | Death → result visible |
| Same-level rematch | Instant, **no dice flash** |
| Killer tip | Named killer + fail cue (`SLAM` / `CHARGE` / vlieger / `SCHIET` / `VUUR`) → retry |
| Portrait **and** landscape | 390×844, 844×390, plus tablet/desktop spot |

## Status

Measurements running on this branch (`scripts/playtest-death-retry.mjs`). Fill after the pass.

## Findings

_(pending first instrumented pass)_

## Not this lane

Versus retired. No push to `origin/main`.
