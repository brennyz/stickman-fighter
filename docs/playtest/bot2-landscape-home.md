# PLAYTEST BOT 2/9 — landscape HOME/BEGIN (844×390)

**Draft findings only. Do not merge to main.**

| | |
|---|---|
| Bot | 2/9 — landscape HOME/BEGIN |
| Live | `c9a29fc` · **v1.18.190** · **SW 400** |
| Surfaces | GitHub Pages `speel.html` / `index.html` + local checkout of the same SHA |
| Viewport | **844×390** landscape phone (portrait 390×844 no-regress) |
| Versus | Retired — no tile, not tested |
| Share URL | `https://brennyz.github.io/stickman-fighter/speel.html` |
| Window | until ~18:36 Amsterdam · 2026-09-18 |

## Verdict

**No P0.** SPELEN and Avontuur are fully on-screen and ≥44px at 844×390. FOMO/Vandaag does **not cover or hide** play (`visibility` stays painted; sheet docks left).

**P1:** while Vandaag is open, a real pointer tap on Avontuur does **not** start play. `#318` hub lock (`inert` + `pointer-events: none` on `.menu-chrome`) still applies on short landscape even though `#329` paints the tiles.

`npm run smoke:landscape-begin` → **SMOKE_OK** (geometry only; it does not pointer-tap through FOMO).

## What passed

| Step | Result | Geometry (local = live) |
|------|--------|-------------------------|
| `speel.html` ▶ SPELEN / PLAY | Fully visible, hit-testable | 229×82 at (308,258)–(536,340) |
| Begin title-gate SPELEN | 2-column vista \| SPELEN; FOMO hidden on gate; tap opens HOME | 338×91 at (458,52)–(796,143); right edge 796 ≤ 808 gutter |
| HOME Avontuur | Featured tile + SPEEL badge, first in the right column | 552×60 at (244,10)–(796,70) |
| Avontuur tap (FOMO closed) | Starts Adventure · Level 1 combat (`body.is-playing`) | see `local-avontuur-tap.png` |
| FOMO vs paint | Sheet left (~200px); **no overlap** with Avontuur | `overlapPlay: false` · `landingVis: visible` |
| Versus | Absent | no `[data-hub="versus"]` |
| Portrait 390×844 | Begin + HOME Avontuur still on-screen (smoke) | no regress |

## P1 — FOMO locks the play tile

**Repro (844×390, first HOME / forced Vandaag):**

1. Open `index.html` → SPELEN → HOME.
2. Open Vandaag (`UI.showFomoRitual(true)` or first-open ritual).
3. Avontuur stays fully visible to the right of the sheet (screenshot).
4. Pointer-tap the Avontuur tile → **HOME stays**; combat does not start.
5. Dismiss Vandaag (×) → tap Avontuur → Level 1 starts.

**Why:** `_syncFomoHubLock` sets `inert` on `.menu-chrome`. Landscape CSS restores `visibility: visible` on `.menu-landing-body` but does **not** restore `pointer-events` and does not skip `inert`. Portrait 390 lock from #318 is unchanged and still correct there.

**Play path while the sheet is open:** × / backdrop, or the Vandaag CTA (often **Naar oproepen** when daily summons remain — not Avontuur).

**Suggested follow-up (not this PR):** on `(orientation: landscape) and (max-height: 520px)` only, skip `inert` on `.menu-chrome` and set `pointer-events: auto` on `.menu-landing-body` / `.hub-tile-adventure` so the painted play tile is tappable. Keep the portrait hub lock.

## P3 (not blocking)

- Landscape HOME meta-dock (Muziek / missies / opties) sits under the 390px fold in the 844×390 shot. Play tile is above the fold.
- Begin subtitle `Start het gevecht` is tight under SPELEN.
- Vandaag CTA wraps to “Naar / oproepen”; mission row still says “power-ups” in NL. Copy lane, not layout.

## Evidence

Harness: `scripts/playtest-landscape-home-bot2.mjs`  
JSON: `docs/playtest/bot2-landscape-home/report.json`

| Shot | File |
|------|------|
| Begin SPELEN | `docs/playtest/bot2-landscape-home/local-begin.png` |
| HOME Avontuur | `docs/playtest/bot2-landscape-home/local-home.png` |
| FOMO left, Avontuur clear | `docs/playtest/bot2-landscape-home/local-fomo.png` |
| Pointer tap Avontuur with FOMO — still HOME | `docs/playtest/bot2-landscape-home/local-fomo-after-avontuur-tap.png` |
| After dismiss, tap starts Level 1 | `docs/playtest/bot2-landscape-home/local-avontuur-tap.png` |
| speel.html PLAY | `docs/playtest/bot2-landscape-home/local-speel.png` |
| Live Pages (same SHA) | `live-*.png` in the same folder |

Live Pages `game.js` reports `APP_VERSION = 1.18.190` / `SW_CACHE_REV = 400` (last-modified 2026-09-18 16:06 UTC).
