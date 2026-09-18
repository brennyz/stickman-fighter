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
| Landscape fight | Floor + pads + bodies | #341 PASS | P2 hop-rotate only |
| First 30s | `Tik slaan` on rematch | #343 PASS | P2 Continue / FOMO flake |
| Death-retry | Fat gold &lt;3s, rematch paints | #337 PASS ~730ms | P2 heat pile / unused 650ms |
| Fair telegraph | CHARGE HUD readable | #342 CHARGE PASS | **P1 TF-002/003** · TF-001 fixed on #342 |
| Feel | Punch snap + named floater | #344 soft PASS | **P1** first-kill toast+banner |
| Perf | (lead: no hitch on L1) | #339 P1 after ~90 frames | **PERF-01…03** |
| Meta menus | (not lead-owned) | #340 MM-001…012 | P1 scroll / blank / cover |

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
| **EX-036** | open | landscape-begin / FOMO | 844×390: Vandaag sheet open → Avontuur is painted but `inert` + `pointer-events:none` on `.menu-chrome`. Tap does not start play. × dismiss restores. | #338 |
| **PERF-01** | open | fxLite | After first ~90 frames / `Perf.tier` still 0, `fxSpawnLite` drops → elite intro 26 particles + ~100ms freeze. | #339 |
| **PERF-02** | open | fxLite | Colossal / super-boss 48 particles + ~220ms freeze when spawnLite off. Same bot as PERF-01. | #339 |
| **PERF-03** | open | juice | `juiceKillSnap` freeze 58–75ms ignores Lite FX. | #339 |
| **TF-001** | **fixed-on-draft #342** | telegraph | Lose tip stole sticky `vlieger` from a prior bat chip. **Do not restage.** Land #342. | #342 |
| **TF-002** | open | telegraph | Hop/fly have no wind-up. L1 deaths are contact; body is the pipe. | #342 |
| **TF-003** | open | telegraph | CHARGE world ring washes out on day sky; HUD bar does the work. | #342 |
| **J-001** | open | juice | First Avontuur kill: `toast.dexDiscover` **and** `banner.newDex` stack on the KO snap. | #344 |
| **MM-001** | open | gear | 390 catalog one-page ~3668–4285 px scroll. | #340 |
| **MM-002** | open | pets | 390: list below fold, triple egg. | #340 |
| **MM-003** | open | factories | Phone wallet = unlabeled dots. LIVE `smoke:buildings-ui` still fails. | #340 |
| **MM-004** | open | summons | ~2.2s then dark card; name only in log. | #340 |
| **MM-005** | open | FOMO | Portrait Vandaag covers meta tiles. Landscape dock OK (#329). | #340 |
| **MM-010** | open | gear | 844×390 first paint = doll only (slots y≈594). | #340 |
| **MM-011** | open | pets | 844×390: 0 dex cards on the fold. | #340 |
| **MM-012** | open | summons | 844×390: gold `Open kist` clipped. | #340 |

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
| LC-001/002 | open | landscape-combat | Mid-jump rotate snaps Y on short land; inverse keeps hop. Leave. |
| PERF-04/05 | open | juice / fxLite | `applyHitStop` ignores Lite; mid-phone desktop-weight until EMA. |
| EX-012 | DELEGATED #314 | HUD | First-minute hint + stars + wave tight on 390. |

### P3 / out

| ID | Status | Notes |
|----|--------|-------|
| EX-020 | out | Android native / TWA |
| EX-026 | out | IAP |
| PERF-06 | open | Menu UI canvases leftover |
| Versus | retired | Do not revive |

Older EX-001…032 stay on `EXAMINATOR.md`. Do not re-file.

---

## Sibling map (findings PRs — not fix PRs)

| PR | Lane | Freeze take |
|----|------|-------------|
| **#336** | invisible / draw | **EX-034 P1** dead+rotate. Alive PASS. |
| **#337** | death-retry | **PASS.** P2 heat / dice lecture / unused 650ms. |
| **#338** | landscape HOME | Visible PASS. **EX-036 P1** FOMO inert. |
| **#339** | mid-phone perf | **PERF-01…03 P1.** Keep spawnLite; gate freezes. |
| **#340** | meta menus | MM-001…005 + 010…012 P1. Skip tablet-834 lane. |
| **#341** | landscape combat | **PASS.** P2 hop asymmetry only. |
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
4. Launch list = `IMPROVEMENT-PLAN.md` bots 1–10.
