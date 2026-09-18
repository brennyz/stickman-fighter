# IMPROVEMENT PLAN — 10 fix-bot lanes · 2026-09-18

**FROZEN 18:40 CEST.** Pin LIVE `c9a29fc` / **v1.18.190** / **SW 400**.  
**Share:** `speel.html`. **Draft PRs only. No Versus. No merge main** until Brendon says «merge main».

Board: `PLAYTEST-REPORT-2026-09-18.md`.  
Each bot = **one 30-min slice**. Branch `cursor/<lane>-9e0e`. Smoke + 390 or 844 proof. Then STOP.

**Land-don't-restage:** #342 **TF-001** (sticky flyer lose-tip) is already fixed on that draft. Merge candidate. Do not clone.

---

## Launch order (P1 stack)

| Bot | ID | P | Lane | One-liner |
|-----|----|---|------|-----------|
| **1** | EX-034 | P1 | visibility | Death **then** rotate → pin **dead** player |
| **2** | EX-036 | P1 | landscape-begin / FOMO | FOMO open must not `inert` Avontuur |
| **3** | PERF-01/02 | P1 | fxLite | Keep `fxSpawnLite` on touch **whole fight** |
| **4** | PERF-03 | P1 | juice | Gate kill/hit freeze when Lite FX |
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

Do not start P2s (MM-006…009, F30-*, DR-*) until 1–13 are claimed. Skip tablet-834 as a new owner.

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

**Source:** #338.  
**Files:** `src/ui/ui.js` `_syncFomoHubLock` · FOMO CSS (`body.is-fomo` / `.menu-chrome`).  
**Do not:** restage #329 two-col SPELEN or left dock. Do not touch combat camera.

**Bug:** 844×390 Vandaag sheet docks left (visibility PASS) but sets `inert` on `.menu-chrome`. Avontuur looks tappable; pointer tap does nothing. × dismiss clears `inert` → play starts.

**Fix (pick one, short landscape only):**

- Do **not** set `inert` on `.menu-chrome` when the sheet is a left dock (`max-height: 520px` landscape), **or**
- Keep inert but make Avontuur a non-inert exception, **or**
- Pointer-tap on the painted Avontuur dismisses then starts (one gesture).

**Prove:** 844×390 · FOMO open · pointer-tap Avontuur starts L1 (or documented one-tap dismiss+play). `npm run smoke:landscape-begin`.

---

## Bot 3 — PERF-01/02 spawnLite whole fight (fxLite)

**Source:** #339.  
**Files:** `src/systems` fxLite / `fxSpawnLite` · `docs/FX-LITE.md`.  
**Do not:** change actor draw. Do not retune density.

**Bug:** #327 holds the opener (~90 frames / wave-1: 4 sparks, 0 freeze). Then `fxSpawnLite` drops while `Perf.tier` is still 0 → elite hitch (26 particles + ~100ms) and colossal hitch (48 + ~220ms).

**Fix:** On touch / compact / mid-phone, keep `fxSpawnLite === true` for the **whole fight**, not only the opener. Fighters always draw.

**Prove:** `npm run smoke:fx-lite`. Spawn an elite after t&gt;3s on 390 — no 100ms freeze, particle cap held.

---

## Bot 4 — PERF-03 juice freeze vs Lite (juice)

**Source:** #339. Adjacent PERF-04 (hit-stop) is P2 — do it only if time left.  
**Files:** `src/systems/combat-juice.js` `juiceKillSnap` / `applyHitStop`.  
**Do not:** restage retry CTA or first-kill toasts (bot 7).

**Bug:** `juiceKillSnap` freeze 58–75ms (and hit-stop 34–72ms) ignore Lite FX / spawnLite.

**Fix:** If `fxLite()` or `fxSpawnLite()`, skip or cap freeze (≤16ms) and keep squash/floater. Reduced-motion already skips shake.

**Prove:** `npm run smoke:juice-feel`. Lite FX on → KO still confirms, no 60ms hitch.

---

## Bot 5 — TF-003 CHARGE ring contrast (telegraph)

**Source:** #342.  
**Files:** telegraph ring draw · `docs/COMBAT-TELEGRAPH.md`.  
**Do not:** change #314 density 0.50 / interval / batch. Do not restage TF-001.

**Bug:** CHARGE HUD (`CHARGE — uit de weg!`) is readable. World ring washes out on day sky (`landweg`).

**Fix:** Darker plate / thicker stroke / 1.22× compact ring already exists — raise contrast on light themes only (`landweg` / `veld`).

**Prove:** L1 390 day stage — ring visible without HUD. `npm run smoke:telegraph-read`.

---

## Bot 6 — TF-002 hop/fly wind (telegraph)

**Source:** #342.  
**Files:** flyer hop / dive telegraph · HUD kind.  
**Do not:** retune horde size. Do not steal TF-001 from #342.

**Bug:** Hop/fly have no wind-up. L1 deaths are contact; the body is the pipe. CHARGE/SLAM already have rings.

**Fix:** Short hop squash or dive ring (phone floor ≥0.38s). Optional HUD `vlieger` only for **this** attack (TF-001 already stops leftover stamps).

**Prove:** L1 flyer/hop on 390 — readable cue before contact. Density table unchanged.

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

**Source:** #340 extra pass. **MM-001 scroll is bot 11** — do not steal the 4k catalog rewrite.  
**Files:** `src/ui/ui.js` `renderGear` · `#gearScreen`.  
**Do not:** tablet-834 dual-pane (`min-width: 900` — skip as new owner). Do not restage equip API.

**Bug:** 844×390 first paint = **doll only**. Slots start y≈594. Scroll still **3804 px**. Dual-pane CSS needs 900 px so 834 and 844 stay one column.

**Fix:** On short landscape (`max-height: 520px`), slot row / sheet in the **first viewport** (scroll the doll, not the slots).

**Prove:** 844×390 Uitrusting → ≥1 slot visible without scroll. `npm run smoke:gear-screen`.

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
**Do not:** restage combat pet lerp. Landscape 0-cards = MM-011 (same lane if time).

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

## Do not launch (this wave)

| Item | Why |
|------|-----|
| TF-001 | Already on #342 — land, don't clone |
| LC-001/002 | P2 hop-rotate asymmetry — #341 PASS |
| EX-033 / DR-* | Retry **PASS**; delay contract / heat pile are P2 |
| F30-* | First-30s **PASS**; lang/Continue/FOMO flake are P2 |
| MM-006…009 | P2 from #340 (toast park, `Alles27`, egg 74×36, pity copy) |
| MM-011/012 | P1 leftovers after bots 12 / 8 (0 pet cards land · Open kist clip) |
| EX-020 / IAP / Versus | Out of scope |
| #324 tablet midband | SKIP (already in #314) |
| #311 harden | Conflicts — leave |

---

## Merge note (not this PR)

If Brendon says **«merge main»** later, suggested order: **#342 TF-001** first, then fix-bot drafts 1→7 (fight), then 8→10 (meta). Versus stays retired. Share URL stays `speel.html`.
