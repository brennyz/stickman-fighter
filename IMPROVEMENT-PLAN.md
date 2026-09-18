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

Bots 1–7 are the fight loop. Bots 8–10 are meta. Do not start P2s until these ten are claimed.

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

**Source:** #340. Adjacent EX-010 / #313.  
**Files:** `src/ui/ui.js` `openSummonHub` / pull timers · `.summon-stage`.  
**Do not:** rebuild the video path. Landscape clip = leftover MM-012 (not this bot unless easy).

**Bug:** Tap pull → ~2.2s blank/dark card; name appears in the log first.

**Fix:** Show name/rarity plate immediately; video can finish after. Target ready ≤2–3s (`#313` contract).

**Prove:** 390 summons → first card has a name before 1s. `npm run smoke:summon`.

---

## Bot 9 — MM-005 FOMO cover (FOMO)

**Source:** #340. Adjacent EX-021 / #322.  
**Files:** `#fomoRitual` portrait height · HOME tiles.  
**Do not:** restage landscape left dock (#329). Do not steal bot 2 (`inert`).

**Bug:** Portrait Vandaag sheet covers Collectie / Fabrieken / Pets tiles. Landscape dock keeps tiles.

**Fix:** Portrait sheet ≤40–48vh (existing #322 cap) and/or dock under title so hub tiles stay tappable while open.

**Prove:** 390 HOME + Vandaag open → Fabrieken/Pets tap works **or** sheet is clearly modal with one × and tiles visible after. `npm run smoke:fomo-pra`.

---

## Bot 10 — MM-010 gear landscape first paint (gear)

**Source:** #340. MM-001 (4000px scroll) is the same lane — **first paint first**, scroll if time.  
**Files:** `src/ui/ui.js` `renderGear` · `#gearScreen`.  
**Do not:** tablet-834 dual-pane (skip). Do not restage equip API.

**Bug:** 844×390 first paint = doll only; slots sit at y≈594 (below the fold).

**Fix:** On short landscape, slot row / sheet must paint in the first viewport (scroll the doll, not the slots).

**Prove:** 844×390 Uitrusting → ≥1 slot visible without scroll. Optional: 390 catalog no longer a 4000px single page (filter-first). `npm run smoke:gear-screen`.

---

## Do not launch (this wave)

| Item | Why |
|------|-----|
| TF-001 | Already on #342 — land, don't clone |
| LC-001/002 | P2 hop-rotate asymmetry — #341 PASS |
| EX-033 / DR-* | Retry **PASS**; delay contract / heat pile are P2 |
| F30-* | First-30s **PASS**; lang/Continue/FOMO flake are P2 |
| MM-002/003/011/012 | P1 leftovers after bots 8–10 |
| EX-020 / IAP / Versus | Out of scope |
| #324 tablet midband | SKIP (already in #314) |
| #311 harden | Conflicts — leave |

---

## Merge note (not this PR)

If Brendon says **«merge main»** later, suggested order: **#342 TF-001** first, then fix-bot drafts 1→7 (fight), then 8→10 (meta). Versus stays retired. Share URL stays `speel.html`.
