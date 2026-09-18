# PLAYTEST REPORT — 2026-09-18 · FROZEN

**Role:** Playtest lead. Rank only. Do **not** own every fix.  
**Status:** **FROZEN 18:40 CEST.** Deadline ~18:36 passed. No more playtest. No gameplay on this PR.  
**Pin:** LIVE `main` `c9a29fc` · **v1.18.190** · **SW 400**  
**Share:** https://brennyz.github.io/stickman-fighter/speel.html  
**Draft only. No Versus. No merge main.**

Fix bots launch from **`IMPROVEMENT-PLAN.md`** (10 lanes). This file is the board.

---

## Verdict (lead + sibling swarm #336–#344)

**No unique P0 on the live fight loop.** Alive fighters, landscape floor/pads, first-30s punch teach, fat-gold `Nog één keer`, and CHARGE HUD all hold on `c9a29fc`.

**Top P1 (launch first):** death **then** rotate → fallen player body gone (`#336` case H / **EX-034**). Pin the **dead** player on resize.

| Bar | Lead 390+844 | Sibling | Freeze |
|-----|--------------|---------|--------|
| Visibility (alive) | PASS day-farm | #336 A–G PASS | **P1 EX-034** dead+rotate |
| Landscape HOME | SPELEN/Avontuur on screen | #338 visible PASS | **P1 EX-036** FOMO `inert` |
| Landscape fight | Floor + pads + bodies | **#341 PASS** (no P0/P1) | P2 LC-001/002 only — **do not launch** |
| First 30s | `Tik slaan` on rematch | #343 PASS | P2 Continue / FOMO flake |
| Death-retry | Fat gold &lt;3s, rematch paints | #337 PASS ~730ms | P2 heat pile / unused 650ms |
| Fair telegraph | CHARGE HUD readable | #342 CHARGE PASS | **P1 TF-002/003** · TF-001 fixed on #342 |
| Feel | Punch snap + named floater | #344 soft PASS | **P1** first-kill toast+banner |
| Perf | (lead: no hitch on L1) | #339 P1 after ~90 frames | **PERF-01…03** |
| Meta menus | (not lead-owned) | **#340 ingested** | **MM-001–005 P1** + landscape 010–012 |

---

## Method (lead)

| Surface | Viewport | URL |
|---------|----------|-----|
| Share | 390×844 + 844×390 | `/speel.html` |
| Title → HOME → Avontuur | same | `/index.html?nosplash=1` · `?sfdebug=1` |
| First-30s reset | console | `__sf.resetFirstPunchTeach()` |
| Versus | — | **out of scope** |

Lead played Adventure on local pin `:8787`. Siblings filed #336–#344. Ingest closed at freeze.

---

## P0–P3 board (canonical EX / sibling IDs)

Status: `open` · `pass` · `fixed-on-draft` · `DELEGATED` · `out`

### P0

*None unique on this pin.* Alive combat paints. Do not invent a P0.

### P1 — fix-bot stack (see IMPROVEMENT-PLAN)

| ID | Status | Owner lane | Repro | Source |
|----|--------|------------|-------|--------|
| **EX-034** | **open · #336 H** | **visibility** | Die in portrait (corpse visible) → rotate to 844×390 **before** VERLOREN sheet → player body gone, tiny enemy remains. `pinPlayfieldBodies` / `onResize` must keep a **dead** player on the painted floor. | #336 |
| **EX-036** | open · **#338** | landscape-begin / FOMO | **Visibility PASS** (SPELEN 338×91 · Avontuur 552×60 · `overlapPlay: false` · sheet left ~200 px). **P1:** pointer-tap Avontuur while Vandaag open does **not** start play. `#318` hub lock (`inert` + `pointer-events: none` on `.menu-chrome`) still applies on short landscape after `#329` restored paint. × (48×48) → `inert` off → next tap starts L1 (local + live). `smoke:landscape-begin` is geometry only. | #338 |
| **PERF-01** | open · **#339** | fxLite | `fxSpawnLite` = `liteFx \|\| reduced \|\| tier≥1 \|\| (touch && frames<90)`. Smooth opener stays **tier 0** → guard dies at frame 90. Next elite: **26 particles + freezeT 0.10s** (`triggerSpecialEnemyIntro`). Wave-1 still 4 / 0. | #339 |
| **PERF-02** | open · **#339** | fxLite | Same cliff. Colossal / super-boss: **48 particles + freezeT 0.22s** + shake 16/0.55s. Satan/Tide skip freeze only while spawnLite still on. Same bot as PERF-01. | #339 |
| **PERF-03** | open · **#339** | juice | `juiceKillSnap` sets `freezeT` **before** shake rate-limit. Lite FX on: common **0.058s** · elite **0.075s**. Horde clear = stacked hitches. Shake limited; freeze not. | #339 |
| **TF-001** | **fixed-on-draft #342** | telegraph | Lose tip stole sticky `vlieger` from a prior bat chip. **Do not restage.** Land #342. | #342 |
| **TF-002** | open | telegraph | Hop/fly have no wind-up. L1 deaths are contact; body is the pipe. | #342 |
| **TF-003** | open | telegraph | CHARGE world ring washes out on day sky; HUD bar does the work. | #342 |
| **J-001** | open | juice | First Avontuur kill: `toast.dexDiscover` **and** `banner.newDex` stack on the KO snap. | #344 |
| **MM-001** | open · **#340** | gear / EX-011 | 390 one-page catalog **3668–4285 px** (~4–5 viewports). Doll + 5 slots + 14 filter chips + 27 locked rows. Filters are mid-page (`#gearSheetTools` 248 px), not a sheet. Tablet 834 still **3843 px** / no 900 dual-pane. Slot tap = chip wall (`Alles27 Look15`). | #340 |
| **MM-002** | open · **#340** | pets | 390 chrome stack ≈530 px (wallet + hero + triple “Dag-ei klaar” + 84 px crack). Dex list top ≈716 — **below the fold**. Detail CTAs y≈931. Softens on 834 (5 cards visible). | #340 |
| **MM-003** | open · **#340** | factories / EX-016 | 390 wallet = unlabeled dots (`PC 0` + five `0`s). Lock lines wrap `(eiland n)`. Upgrade sheet repeats “Mis 20 PC” / full factory name. **LIVE `smoke:buildings-ui` fails** (`doesShort`, `toastShort`). Labeled on 834/844 — phone-only. | #340 |
| **MM-004** | open · **#340** | summons / EX-010 | Pull **2208 ms**; stage is a dark card in rings; name only in the log (`Schroot`). Tut strip still on first open. Stage/CTA ratio 2.2. | #340 |
| **MM-005** | open · **#340** | FOMO / #322 | Veteran HOME: Vandaag covers Fabrieken / Uitrusting / Pets / Oproepen (`getBoundingClientRect` empty). Only “Naar oproepen”. Landscape left-dock keeps tiles (#329). | #340 |
| **MM-010** | open · **#340 land** | gear | 844×390 first paint = **doll only**. Slot `head` y=**594** (fold is 390). ScrollH **3804**. Layout `none` (dual-pane needs 900). Slot tap → chip wall, **no rows**. Skip tablet-834 (5 slots already on first paint). | #340 |
| **MM-011** | open · **#340 land** | pets | 844×390: **0 / 12** cards on fold. Chrome: wallet y=233 · hero y=293 (clipped, bottom 403) · egg y=465 · tabs y=523. ScrollH **2311**. Tablet 834 already **5 cards** — skip as new owner. | #340 |
| **MM-012** | open · **#340 land** | summons | 844×390: `#btnChestPull` y=326 h=100 **bottom 426** (clips 36 px under 390). Stage 133 px, ratio 1.3. Pull ~1.6 s (MM-004 timing is 390). Skip tablet-834 (CTA on-screen, ratio 3.1). | #340 |

### P2

| ID | Status | Lane | Symptom |
|----|--------|------|---------|
| EX-033 | open | death-retry | `combatLoseResultMs` 650/850 unused; live lose delay **700ms**. CTA still &lt;3s. |
| EX-018 | open | #318 UI | Landscape HOME: `Verder spelen` takes the featured slot; Avontuur is a thin row. |
| DR-heat | open | death-retry | After ~5 fails, cyan tip stacks heat (`5/10 · Meester · Satan`). Cue still leads. |
| DR-dice | open | death-retry | First-loss dice lecture on a CTA that skips dice. |
| F30-lang | open | first-30s / i18n | `speel.html` follows `navigator.language`; in-game `initLang()` forces NL. |
| F30-cont | open | first-30s / #318 | After first punch, Continue → `gokGooiStartLevel` (skips island). |
| F30-fomo | open | FOMO | `fomoRitualPending` true after punch; auto-sheet flaky unless `#menuScreen.active`. |
| LC-001 | open · **low** | landscape-combat | Mid-jump rotate *to* 844×390 snaps Y to new floor (old Y would be below `H`). Hop cancelled. Necessary. **No bot.** |
| LC-002 | open · **low** | landscape-combat | Landscape → portrait while airborne **keeps** the hop (still on canvas). Inverse of LC-001; looks correct. **No bot.** |
| PERF-04 | open · #339 | juice | `applyHitStop` only early-outs on `motionReduced()`. Punch freeze **0.034s** with Lite FX still on. Gate with PERF-03. |
| PERF-05 | open · #339 | fxLite | After 90 frames tier 0: spawnLite **and** `fxLite()` both false. Touch cap still 100. Auto Lite hint waits for **tier 2 + 120 frames** (after the hitch). |
| EX-012 | DELEGATED #314 | HUD | First-minute hint + stars + wave tight on 390. |

### P3 / out

| ID | Status | Notes |
|----|--------|-------|
| EX-020 | out | Android native / TWA |
| EX-026 | out | IAP |
| PERF-06 | P3 · #339 | Fight FX path no leak (24× training: pool 48, live 0). Leftover = menu `createElement('canvas')` on upgrades/pets/gear. |
| Versus | retired | Do not revive |
| LH-dock | P3 · #338 | Landscape HOME meta-dock under 390 fold — play tile above fold |
| LH-copy | P3 · #338 | “Naar / oproepen” wrap · NL “power-ups” on mission row |
| LC-pads | P3 · #341 | Phone-land pads sit on the 44px floor (no slack). iPad 3×2 jump-left is documented out of #331. |

### #341 landscape combat (canonical) — PASS · no bot

Source: `docs/playtest-landscape-combat-2026-09-18.md`. Smokes: `landscape-combat` · `landscape-touch` · `touch-btns`.

| Case | Result |
|------|--------|
| 844×390 start | W/H match · ground **312** · player **(211, 312)** · letterbox 0 · punch+jump 44px **both fire** |
| 667 / 736 / 915 land | aligned · pads ≥44px · punch/jump fire |
| Mid-fight rotate → 844 | t≈1.8 · player **(350, 312)** on floor · pads still fire |
| Training 844 | player + robot on floor · punch fires |
| Cyber lv13 844 | fighter visible · no letterbox |
| iPad 1180×820 | on floor · 3×2 pads (jump left of punch — out of #331) |

**P0 / P1: none.** Alive rotate is fine — do not confuse with **EX-034** (dead then rotate).

**P2 LC-001:** hop → short land snaps to new floor (old Y below `H`). Necessary. Leave.  
**P2 LC-002:** land → portrait keeps the hop. Inverse; looks correct.  
**Low priority. Do not launch a fix bot.**

### #339 PERF-01–06 (canonical)

Source: `docs/PLAYTEST-PERF-MIDPHONE-2026-09-18.md`. 390 touch DPR 2.2. No P0 (fighters draw).

| ID | P | Gate / number | Bot |
|----|---|---------------|-----|
| PERF-01 | P1 | After 90 frames tier 0: elite **26 + 0.10s** | **3** |
| PERF-02 | P1 | Same cliff: colossal **48 + 0.22s** | **3** |
| PERF-03 | P1 | `juiceKillSnap` Lite on: 58 / 75 ms | **4** |
| PERF-04 | P2 | `applyHitStop` punch 34 ms with Lite on | **4** (same PR) |
| PERF-05 | P2 | After opener, spawnLite and fxLite both false; hint waits tier 2 + 120 f | 3 leftover |
| PERF-06 | P3 | 24× training: pool OK. Menu UI canvases leftover | leave |

**Plan:** keep `fxSpawnLite()` on `fxTouchDevice()` **whole fight**; gate freezes on Lite / spawnLite / touch.

### #338 landscape HOME (canonical)

Source: `docs/playtest/bot2-landscape-home.md` on `cursor/playtest-landscape-home-147f`. 844×390. `smoke:landscape-begin` **SMOKE_OK** (geometry).

| Check | Result |
|-------|--------|
| `speel.html` SPELEN | PASS 229×82 |
| Title-gate SPELEN | PASS 2-col 338×91 · FOMO hidden on gate · right edge 796 ≤ 808 gutter |
| HOME Avontuur paint | PASS 552×60 featured + SPEEL · first in right column |
| FOMO vs paint | PASS sheet left ~200 px · `overlapPlay: false` · `landingVis: visible` |
| Avontuur tap, FOMO **closed** | PASS → L1 `body.is-playing` |
| Avontuur tap, FOMO **open** | **FAIL P1 EX-036** — HOME stays |
| × then Avontuur | PASS — `inert` cleared, `pointer-events: auto`, L1 local + live |
| Portrait 390 begin/HOME | PASS no-regress |
| Versus | absent |

**Why:** `_syncFomoHubLock` sets `inert` on `.menu-chrome`. Landscape CSS restores `visibility` on `.menu-landing-body` but **not** `pointer-events` and does not skip `inert`. Portrait #318 lock stays correct.

P3 (leave): meta-dock under 390 fold · SPELEN subtitle tight · “Naar / oproepen” wrap · offline toast on Avontuur after × (tap still started L1).

### #340 MM-001–005 (390 meta — canonical)

Source: `docs/PLAYTEST-META-MENUS-390.md` on `cursor/playtest-meta-menus-a006`. Fresh + veteran. Open 14–37 ms. Versus gone. Factory ids locked.

| ID | 390 | 834 tablet | 844 land | Bot |
|----|-----|------------|----------|-----|
| MM-001 gear scroll | **4285 / 3668 px** · 27 rows · chip wall | 3843 px · 5 slots visible · still 1 col | doll-only = MM-010 | **11** (scroll) · 10 (land paint) |
| MM-002 pets fold | chrome ≈530 · list y≈716 · triple egg | **5 cards** on fold | 0 cards = MM-011 | **12** |
| MM-003 factories | unlabeled dots · `smoke:buildings-ui` **FAIL** | labeled · fits | labeled | **13** |
| MM-004 summon blank | pull **2208 ms** · dark card · `Schroot` in log | pull ~1.6 s · tall stage | CTA clip = MM-012 | **8** |
| MM-005 FOMO cover | Vandaag covers 4 meta tiles | covers tiles | **left dock PASS** | **9** |

P2 from same PR (do not steal P1 bots): MM-006 factory toast parks on back; MM-007 filter label jam (`Alles27`); MM-008 egg chip 74×36; MM-009 pity copy.

### #340 MM-010/011/012 (844×390 — skip tablet-834)

Source: extra pass `docs/playtest-meta-390/extra-report.json`. Veteran only. 834 confirms MM-001 (still 1 col) and **clears** MM-002/003 first-paint — **not a new owner**.

| ID | 844×390 | Bot | Do not |
|----|---------|-----|--------|
| MM-010 | doll only · slots y=594 · scroll 3804 · tap = chips, no rows | **10** | 834 dual-pane / 900 grid |
| MM-011 | **0** cards on fold · hero clipped · scroll 2311 | **14** | 834 (5 cards already) |
| MM-012 | `Open kist` bottom 426 > 390 · stage ratio 1.3 | **15** | 834 CTA (on-screen) · 390 pull timing (bot 8) |

Older EX-001…032 stay on `EXAMINATOR.md`. Do not re-file.

---

## Sibling map (findings PRs — not fix PRs)

| PR | Lane | Freeze take |
|----|------|-------------|
| **#336** | invisible / draw | **EX-034 P1** dead+rotate. Alive PASS. |
| **#337** | death-retry | **PASS.** P2 heat / dice lecture / unused 650ms. |
| **#338** | landscape HOME | **Visibility PASS** (SPELEN/Avontuur ≥44 px, left dock, no overlap). **EX-036 P1** `#318` `inert` + `pointer-events:none` while sheet open. × recover PASS. Keep portrait hub lock. |
| **#339** | mid-phone perf | **#327 opener PASS** (4 sparks / 0 freeze). **PERF-01/02 P1** 90-frame cliff. **PERF-03/04** freeze ignores Lite. Plan: spawnLite on touch **whole fight**; gate `juiceKillSnap` + `applyHitStop`. PERF-05 P2 · PERF-06 P3. |
| **#340** | meta menus | **MM-001–005 P1 ingested** (gear scroll, pets fold, factories smoke, 2.2s blank, FOMO cover). Landscape 010–012 P1. Skip tablet-834 as new owner. Open times 14–37 ms — clunk is chrome/scroll, not JS. |
| **#341** | landscape combat | **PASS — no P0/P1.** Camera/floor/pads hold. 844 start ground 312 · player (211,312) · letterbox 0 · punch+jump 44px fire. Mid-fight rotate still on floor. Cyber lv13 visible. **LC-001/002 P2 low — no bot.** |
| **#342** | telegraph | **TF-001 fixed here (land).** TF-002/003 open P1. Density unchanged. |
| **#343** | first-30s | **PASS.** P2 lang / Continue / FOMO flake. |
| **#344** | juice | Soft PASS. **J-001 P1** first-kill chrome. |

---

## Lead play log (this run)

| Time CEST | Viewport | Path | Result |
|-----------|----------|------|--------|
| 18:08 | — | Pin `c9a29fc` · `cursor/playtest-lead-9e0e` · `:8787` | v1.18.190 / SW 400 |
| 18:12 | — | Code audit lose-delay | EX-033 P2 |
| 18:13–18:20 | 390×844 | speel → SPELEN → Avontuur → punch → die → retry | Fighters visible · `Tik slaan` · fat gold · rematch paints |
| 18:17–18:20 | 844×390 | HOME → fight → die | Floor under feet · pads fire · CHARGE HUD · gold CTA |
| 18:40 | — | Ingest #336–#344 · **FREEZE** | Board + 10-bot plan |
| 18:42 | — | **#340 deepen MM-001–005** | Gear 4k scroll · pets fold · factories smoke fail · summon 2.2s blank · FOMO cover. Wave-2 bots 11–13. |
| 18:44 | — | **#338 deepen EX-036** | Landscape HOME visibility PASS. P1: FOMO `inert` + `pointer-events:none` blocks Avontuur while sheet open. × recover PASS. |
| 18:46 | — | **#340 MM-010/011/012** | 844 gear doll-only · 0 pet cards · Open kist clipped. Wave-3 bots 14–15. Skip tablet-834. |
| 18:47 | — | **#339 PERF-01–06** | 90-frame spawnLite cliff · juice/hitStop ignore Lite. Bots 3–4: keep spawnLite on touch; gate freezes. |
| 18:48 | — | **#341 PASS** | Landscape combat camera/floor/pads. LC-001/002 hop asymmetry P2 — no bot. |

Lead evidence: `/opt/cursor/artifacts/playtest_adventure_390_and_844_first_pass.mp4`

---

## What must stay true (do not regress)

- `drawCombatants` + recover + contrast-lift (`#333`)
- `alignCombatPlayfield` / resize-before-spawn (`#325`)
- `pauseG` HUD (`#334`)
- Two-col title-gate + FOMO **left dock** (`#329`)
- Density floor **0.50** / max alive ~12 (`#314`) — telegraph bots do **not** retune
- `#resRetrySafe` + `restartAdventureInstant` + fat gold (`#323` / `#326`)
- First Avontuur skips island/dice/FOMO until `feltFirstPunch` (`#328`)
- Versus stays retired

---

## Lead notes for fix bots

1. One lane per bot. Lowest open ID in your lane. Do not steal a `fixed-on-draft`.
2. Adventure only. 390×844 and/or 844×390. No Versus. No IAP. No `main`.
3. Prove with a smoke or a 30-second rotate/die path. Then STOP.
4. Launch list = `IMPROVEMENT-PLAN.md` bots 1–10, wave-2 **11–13**, wave-3 **14–15** (MM-011/012). Skip tablet-834.
