# IMPROVEMENT PLAN — 10 fix-bot lanes · 2026-09-18

**FROZEN 18:40 CEST.** Pin LIVE `c9a29fc` / **v1.18.190** / **SW 400**.  
**Share:** `speel.html`. **Draft PRs only. No Versus. No merge main** until Brendon says «merge main».

Board: `PLAYTEST-REPORT-2026-09-18.md`.  
Each bot = **one 30-min slice**. Branch `cursor/<lane>-9e0e`. Smoke + 390 or 844 proof. Then STOP.

## MERGE FIRST — #342 TF-001 (not a new bot)

**When Brendon says «merge main», land `#342` / `cursor/playtest-telegraphs-51fa` first.**

Sticky lose-tip: Bubbel (hop slime) said `vlieger →` because `lastFailTele` kept a bat chip and `ensureAdventureFailTele` stole any alive flyer. Draft writes `lastFailTele` from **this** attacker only. Hop contact → empty cue. Also stops swim→CHARGE stamp (TF-004).

- Do **not** clone on a new branch.
- Do **not** retune density (0.50 / 12 / ×1.55 / batch 1 / gap 64).
- Prove after merge: slime after flyer leftover → tip is `Nog één keer · {name}` with **no** `vlieger`. `npm run smoke:telegraph-read` + `smoke:combat-density`.

Open P1s on this lane stay bots **5** (TF-003) and **6** (TF-002).

---

## Launch order (P1 stack)

| Bot | ID | P | Lane | One-liner |
|-----|----|---|------|-----------|
| **1** | EX-034 | P1 | visibility | Death **then** rotate → pin **dead** player |
| **2** | EX-036 | P1 | landscape-begin / FOMO | FOMO open must not `inert` Avontuur |
| **3** | PERF-01/02 | P1 | fxLite | Keep `fxSpawnLite` on touch **whole fight** |
| **4** | PERF-03/04 | P1 | juice | Gate `juiceKillSnap` + `applyHitStop` freeze |
| **5** | TF-003 | P1 | telegraph | CHARGE world ring readable on day sky |
| **6** | TF-002 | P1 | telegraph | Hop/fly need a visible wind |
| **7** | J-001 | P1 | juice | First-kill: toast **XOR** banner |
| **8** | MM-004 | P1 | summons | No 2.2s blank pull card |
| **9** | MM-005 | P1 | FOMO | Portrait sheet must not cover meta tiles |
| **10** | MM-010 | P1 | gear | 844 first paint shows slots, not doll-only |

Bots 1–7 are the fight loop. Bots 8–10 are the first meta slice (#340 MM-004/005/010).

**Wave 2 (launch next — #340 MM-001–003, now fully briefed):**

| Bot | ID | P | Lane | One-liner |
|-----|----|---|------|-----------|
| **11** | MM-001 | P1 | gear / EX-011 | Kill the 4k px one-page catalog (bottom sheet) |
| **12** | MM-002 | P1 | pets | First screen = list, not triple-egg chrome |
| **13** | MM-003 | P1 | factories / EX-016 | Label 390 wallet + pass `smoke:buildings-ui` |

**Wave 3 (launch with 10 / 12 / 8 — #340 landscape leftovers):**

| Bot | ID | P | Lane | One-liner |
|-----|----|---|------|-----------|
| **10** | MM-010 | P1 | gear | 844 first paint shows slots, not doll-only |
| **14** | MM-011 | P1 | pets | 844: ≥1 dex card on the fold (not 0) |
| **15** | MM-012 | P1 | summons | 844: `Open kist` fully on-screen |

**SKIP tablet-834** as a new owner (5 gear slots + 5 pet cards + on-screen CTA already). Do not start P2s until 1–15 are claimed.

---

## Bot 1 — EX-034 dead player pin (visibility)

**Source:** #336 case H. **Highest.**  
**Files:** `src/core/canvas.js` `pinPlayfieldBodies` · `src/game/game.js` `onResize` · draw path for fallen player.  
**Do not:** retune density, HUD, retry CTA, Versus.

**Bug:** Portrait death pose paints the stickman. Rotate to 844×390 (or back) **before** the VERLOREN sheet → player body gone, tiny enemy remains. Alive rotate (#341) is fine.

**Fix:** When `game.over` / player is down, `pinPlayfieldBodies` must keep a **visible corpse** on the painted floor (`game.ground`). Do not snap a fallen Y off-canvas (`y < 12` / `y > hh + 16`) into a state `drawCombatants` skips. Keep `scale > 0.2`. Re-paint actors after resize (existing recover path).

**Prove:**

1. Avontuur L1 390×844 → die (corpse visible).
2. Resize to 844×390 without tapping `Nog één keer`.
3. Player body still on the road. Enemy still there.
4. Extend `smoke:fighters-visible` or #336 `scripts/playtest-invisible-draw.mjs` with a dead+resize case.

---

## Bot 2 — EX-036 FOMO inert (landscape-begin)

**Source:** #338 · `docs/playtest/bot2-landscape-home.md`. Adjacent #318 hub lock / #329 paint.  
**Files:** `src/ui/ui.js` `_syncFomoHubLock` · landscape FOMO CSS (`.menu-landing-body` visibility vs `pointer-events`).  
**Do not:** restage #329 two-col SPELEN or left dock. Do not unlock the **portrait 390** hub lock. Do not steal bot 9 (MM-005 portrait cover). Do not touch combat camera.

**Visibility PASS (do not “fix” paint):** SPELEN 338×91 · Avontuur 552×60 · sheet left ~200 px · `overlapPlay: false`. × (48×48) recover is already clean — next tap starts L1 on local + live.

**Bug:** While Vandaag is open, pointer-tap Avontuur does **not** start play. `#318` sets `inert` + `pointer-events: none` on `.menu-chrome`. `#329` restored `visibility` on `.menu-landing-body` only. `smoke:landscape-begin` does **not** pointer-tap through FOMO (geometry only).

**Fix (short landscape only — `(orientation: landscape) and (max-height: 520px)`):**

- Skip `inert` on `.menu-chrome` when the sheet is a left dock, **and**
- Set `pointer-events: auto` on `.menu-landing-body` / `.hub-tile-adventure`.

Keep portrait `inert` lock.

**Prove:** 844×390 · FOMO open · **pointer-tap** Avontuur starts L1 (no × first). Portrait 390 FOMO still blocks hub chrome. Extend harness `scripts/playtest-fomo-dismiss-avontuur.mjs` or add a tap-through case to `smoke:landscape-begin`.

---

## Bot 3 — PERF-01/02 spawnLite whole fight (fxLite)

**Source:** #339 · `docs/PLAYTEST-PERF-MIDPHONE-2026-09-18.md`. Adjacent #327.  
**Files:** `fxSpawnLite()` (touch && `frames<90` clause) · `triggerSpecialEnemyIntro` in `src/data/monsters.js` · `docs/FX-LITE.md`.  
**Do not:** skip fighter `draw()`. Do not retune density. Do not wait for a hitch before the guard stays on. PERF-05 hint timing is P2 (same lane if time).

**#327 opener PASS:** first ~90 frames / wave-1: **4 sparks, freezeT 0**, pool prewarm 48, Lite cap 58. Fighters always draw.

**Bug:** `fxSpawnLite()` = `liteFx || reduced || tier≥1 || (touch && frames<90)`. Smooth opener stays **tier 0** (EMA never >22ms) → guard **false** after frame 90.

| Moment | spawnLite | particles | freezeT |
|--------|-----------|-----------|---------|
| Wave 1 / frames &lt; 90 | true | 4 | 0 |
| After 90, tier 0 elite | **false** | **26** | **0.10s** |
| After 90, colossal / super | **false** | **48** | **0.22s** (+ shake 16/0.55s) |

844 landscape: `W<720` is false; guard still trips via `IS_TOUCH` — same cliff.

**Fix:** Keep `fxSpawnLite()` **true on `fxTouchDevice()` for the whole fight** (or until a healthy-tier sample for N seconds). Not only 90 frames.

**Prove:** `npm run smoke:fx-lite` + `node scripts/smoke-playtest-perf-midphone.mjs`. Elite intro after t&gt;2s / frames&gt;90 on touch: spawnLite still true, freezeT 0, particles ≤4 (or Lite cap).

---

## Bot 4 — PERF-03 (+ PERF-04) gate freezes (juice)

**Source:** #339. **Gate both freezes** (`juiceKillSnap` P1 + `applyHitStop` P2 — same files, do both).  
**Files:** `src/systems/combat-juice.js` `juiceKillSnap` · `src/data/monsters.js` `applyHitStop`.  
**Do not:** restage retry CTA or first-kill toasts (bot 7). Do not drop KO floater / haptic.

**Bug:** Freeze is set **before** the shake rate-limit. Only `motionReduced()` skips. Measured with `save.liteFx = true`:

| Call | freezeT (Lite FX on) |
|------|----------------------|
| `juiceKillSnap` common | **0.058s** |
| `juiceKillSnap` elite | **0.075s** |
| `applyHitStop` punch | **0.034s** |
| `applyHitStop` heavy crit | **0.072s** |

Horde wave-clear = stacked 58ms hitches. Punch + kill on the same beat stacks PERF-04 + PERF-03.

**Fix:** If `fxLite()` **or** `fxSpawnLite()` **or** `fxTouchDevice()`, skip or cap `freezeT` (≤16ms). Keep squash + KO floater + haptic. Shake can stay rate-limited.

**Prove:** `npm run smoke:juice-feel` with Lite FX on → KO confirms, `freezeT` ≈ 0. `applyHitStop` punch does not add 34ms.

---

## Bot 5 — TF-003 CHARGE ring contrast (telegraph)

**Source:** #342 · `desk-charge-hud.webp`.  
**Files:** telegraph ring draw · `docs/COMBAT-TELEGRAPH.md`.  
**Do not:** change #314 density / interval / batch / gap. Do not change wind floors (0.32 desk / 0.38 phone). Do not restage TF-001 (merge #342).

**Bug:** HUD PASS (`CHARGE — uit de weg!` + 0.5 chip). World ring is a thin dark circle + faint yellow dash on day `landweg`. Contract wants high-contrast ring + arrow. Cyber/night may be fine.

**Fix:** Thicker / darker outline on light themes only. **No wind-time change.**

**Prove:** L1 day stage — ring readable without HUD. `npm run smoke:telegraph-read` + `smoke:combat-density` (numbers unchanged).

---

## Bot 6 — TF-002 hop/fly wind (telegraph)

**Source:** #342 · L1 default deaths (Moerasly / Kleiply / Kikkervis / Flapper).  
**Files:** hop + fly AI (`telegraphT` never set) · optional dive ring.  
**Do not:** retune horde size / 0.50 floor. Do not steal TF-001 from #342 (wrong `vlieger` label is already fixed there).

**Bug:** Neither hop nor fly sets `telegraphT`. HUD bar never appears. Standing still 2–5s → contact chips 5–7 (not a one-shot). On 390 the slime is small on a bright sky — first deaths feel random. “Body is the pipe” only if you see them.

**Fix:** Visual only — hop squash and/or fly dive ring (phone floor ≥0.38s). Empty fail cue on hop contact is correct after TF-001.

**Prove:** L1 390 — readable cue before contact. Density table unchanged. `smoke:combat-density` green.

---

## Bot 7 — J-001 first-kill chrome (juice)

**Source:** #344.  
**Files:** dex discover toast / `banner.newDex` · `onMonsterKilled`.  
**Do not:** remove KO floater / freeze. Do not touch retry.

**Bug:** First Avontuur kill fires `toast.dexDiscover` **and** `banner.newDex` on top of the KO snap. Later kills are clean.

**Fix:** Keep KO + freeze. Drop **either** the toast **or** the banner on first discover (one chrome, not two).

**Prove:** Fresh-ish save, first unique kill — one line of chrome, KO readable. `npm run smoke:juice-feel`.

---

## Bot 8 — MM-004 summon blank (summons)

**Source:** #340 · EX-010 still live after #313.  
**Files:** `src/ui/ui.js` `openSummonHub` / pull timers · `.summon-stage`.  
**Do not:** rebuild the video path. Landscape clip = MM-012 (bot leftover, not this slice unless easy). Skip tut-hide if it fights first-30s.

**Bug:** Timed pull **2208 ms**. At that frame `cardShow` is false — stage is a **dark card in rings**, no name. Quota becomes `9/10`. Reward name only under the fold (`Nieuwste · Schroot`). First-open tut still shows. Stage 209 px vs CTA 94 px (ratio 2.2). Open itself is fast (23–37 ms).

**Fix:** Paint name + rarity on the stage in **&lt;1 s**. Video may finish after. Hide tut after first visit (`tipsSeen.summonChest`).

**Prove:** 390 Oproepen → pull → name on stage before 1s. `npm run smoke:summon`.

---

## Bot 9 — MM-005 FOMO cover (FOMO)

**Source:** #340 · #322 / EX-021. Veteran HOME (`veteran-00-home.png`).  
**Files:** `#fomoRitual` portrait height · HOME tiles.  
**Do not:** restage landscape left dock (#329 PASS). Do not steal bot 2 (`inert` / pointer-events — that is 844).

**Bug:** Returning player: Vandaag sheet covers **Fabrieken / Uitrusting / Pets / Oproepen**. Tile `getBoundingClientRect` empty until dismiss. Only “Naar oproepen” is reachable. 834 tablet also covers. 844 left-dock keeps tiles.

**Fix:** Portrait sheet ≤40–48vh and/or dock under title so the four meta tiles stay painted **and** tappable, or one-tap × then tile (document it). Do not use nuclear `display:none` on `.screen`.

**Prove:** Veteran 390 HOME + Vandaag open → at least Fabrieken tap works, or × is the only blocker and tiles show after. `npm run smoke:fomo-pra`.

---

## Bot 10 — MM-010 gear landscape first paint (gear)

**Source:** #340 extra `land844` · `land844-vet-20-gear.png`. **MM-001 4k page is bot 11.**  
**Files:** `src/ui/ui.js` `renderGear` · `#gearScreen`.  
**Do not:** tablet-834 dual-pane (`min-width: 900` / `grid = none` — **skip as new owner**; 834 already shows 5 slots). Do not restage equip API.

**Bug:** 844×390 `clientH` 390. First paint = **doll only**. `#gearDollCanvas` measured y=−958 after scroll; first slot `head` y=**594**. ScrollH **3804**. Layout `none`. Slot tap → `#gearSheetTools` chip wall (`Alles27 Look15…`), **no item rows** on screen.

**Fix:** Short landscape (`max-height: 520px`): slot row in the **first viewport** (scroll the doll, not the slots). Optional: slot tap opens the same bottom sheet as bot 11 if that lands first — coordinate, don't fork two pickers.

**Prove:** 844×390 Uitrusting → `head` (or any slot) y &lt; 390 without scroll. `npm run smoke:gear-screen`.

---

## Bot 11 — MM-001 gear 4k catalog (gear / EX-011)

**Source:** #340 strongest 390 miss. Same lane as bot 10 — **this bot owns scroll**, 10 owns landscape first paint.  
**Files:** `src/ui/ui.js` `renderGear` · `#gearScreen` · `#gearSheetTools`.  
**Do not:** dual-pane at 834. Do not restage save.gear schema.

**Bug:** Fresh scrollHeight **4285 px**, veteran **3668 px**, tablet **3843 px**. One page = doll + hunt + weapon + 5 slots + 5 look-filters + 9 rarity chips + search + **27 head rows**. `#gearFilterDock` does not exist — tools are 248 px mid-page. Slot tap: `Alles27 Look15 Stats12 Slot26 Van jou1` then rarity wrap, then locked Hell rows first. `renderGear` itself is 7 ms (not a JS hitch).

**Fix:** Slot tap opens a **bottom sheet** (filters + owned-first rows). Kill the 4k page. Owned-first; lock Hell/Nightmare behind the fold.

**Prove:** 390 Uitrusting scrollHeight **&lt; 1600 px** (or sheet, not page). Slot tap shows rows without a chip wall. `npm run smoke:gear-screen`.

---

## Bot 12 — MM-002 pets fold (pets)

**Source:** #340. Unique leftover vs examinator EX-003 (combat follow — do not retest).  
**Files:** pets screen chrome · `src/ui` pets render.  
**Do not:** restage combat pet lerp. Landscape 0-cards = **bot 14 (MM-011)** — chrome collapse here helps both; don't fork two pets layouts.

**Bug:** Chrome to y≈530: title + Kist + wallet + hero + next-goal + 84 px `Dag-ei openen`. **Dex list not on first screen** (first card top ≈716). `Dag-ei klaar` said **three times**. Detail CTA y≈931–950 — “detail” shot looks like the list. Egg chip 74×36 is P2 MM-008. Tablet 834 already shows 5 cards.

**Fix:** One egg CTA. List visible under tabs on first paint. Detail **replaces** the chrome stack, not appends below it.

**Prove:** 390 Pets → ≥1 roster card on screen without scroll. `npm run smoke:pets-ui`.

---

## Bot 13 — MM-003 factories smoke (factories / EX-016)

**Source:** #340. LIVE `smoke:buildings-ui` **fails** (`doesShort: false`, `toastShort: false`).  
**Files:** `src/ui/buildings-ui.js` · wallet chips · does/toast copy.  
**Do not:** change factory ids (`stick_lighter` … `echo_whistle`). Do not restore landscape dual-pane (list XOR detail holds).

**Bug:** 390 wallet = six tiny columns: `PC 0` + five unlabeled `0`s. Veteran has rates (`+12/u`) but **no names**. Lock lines wrap `Dicht — speel Vuur-eiland (eiland 2) vrij`. Sheet repeats `Mis 20 PC` + full `Bouw Stok-Aansteker Fabriek?`. Collect toast `+96 Vonken · hopper vol (96)` fails `toastShort`; does-lines fail `doesShort` (length / “Kracht rank”). 834/844 already labeled.

**Fix:** Short wallet labels on 390 (name or 1–2 letter). Short does + toast so **`npm run smoke:buildings-ui` passes**.

**Prove:** 390 Fabrieken — each hopper chip has a name. Smoke green on this pin.

---

## Bot 14 — MM-011 landscape pets fold (pets)

**Source:** #340 extra `land844.screens.pets` · `land844-vet-30-pets.png`.  
**Files:** pets screen chrome · short-landscape CSS.  
**Do not:** tablet-834 (already **5 cards** on fold). Do not restage combat follow. Coordinate with bot 12 (390 chrome) — one collapse should help both.

**Bug:** 844×390: `cardsOnFold: 0` / 12. ScrollH **2311**. Stack: wallet y=233 · `#petsHero` y=293 h=110 **bottom 403** (hero clipped past 390) · `#petsNext` 411 · `#eggCrackBtn` 465 · `#petTabBar` 523. List never reaches the fold. Detail `Uitzetten` y=964.

**Fix:** On `(orientation: landscape) and (max-height: 520px)`, collapse hero/egg to one row so **≥1 dex card** (or the equipped pet) is on the first 390 px.

**Prove:** 844×390 Pets → `cardsOnFold ≥ 1`. `npm run smoke:pets-ui`.

---

## Bot 15 — MM-012 landscape Open kist clip (summons)

**Source:** #340 extra `land844.screens.summons` · `land844-vet-40-summons.png`.  
**Files:** `#btnChestPull` · `.summon-stage` · `max-height: 420px` landscape CSS.  
**Do not:** restage 390 2.2s blank (bot 8). Do not rebuild video. Skip tablet-834 (CTA on-screen, stage ratio 3.1).

**Bug:** 844×390: `#btnChestPull` y=326 h=100 **bottom 426** — clips **36 px** under the 390 fold. Stage 133 px (ratio 1.3). ScrollH 390 (page “fits”; the gold CTA does not). Pull ~1.6 s here.

**Fix:** `min()` the stage on short landscape so the gold `Open kist` sits fully above `env(safe-area-inset-bottom)` with ≥44 px height.

**Prove:** 844×390 Oproepen → `#btnChestPull.bottom ≤ 390` and the label `Open kist` is unclipped. `npm run smoke:summon`.

---

## Do not launch (this wave)

| Item | Why |
|------|-----|
| TF-001 | Already on #342 — land, don't clone |
| LC-001/002 | **#341 PASS.** P2 hop-rotate asymmetry only. Low priority. **No bot.** Alive rotate is fine (not EX-034). |
| EX-033 / DR-* | Retry **PASS**; delay contract / heat pile are P2 |
| F30-* | First-30s **PASS**; lang/Continue/FOMO flake are P2 |
| MM-006…009 | P2 from #340 (toast park, `Alles27`, egg 74×36, pity copy) |
| Tablet-834 owner | SKIP — confirms MM-001 1-col; clears MM-002/003 first-paint |
| EX-020 / IAP / Versus | Out of scope |
| #324 tablet midband | SKIP (already in #314) |
| #311 harden | Conflicts — leave |

---

## Merge note (not this PR)

**«merge main» order:** **#342 TF-001 first** (already coded), then fix-bot drafts 1→7 (fight), then 8→15 (meta). Versus stays retired. Share URL stays `speel.html`. Density stays #314.
