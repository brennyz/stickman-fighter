# Playtest 9/9 — PERFORMANCE / MID-PHONE

**Build:** LIVE `c9a29fc` · **v1.18.190** · **SW 400**  
**When:** 2026-09-18 · until ~18:36 Amsterdam  
**Share URL:** `speel.html`  
**Modes:** Adventure / Training / Wall / Coinrun · **Versus out**  
**No main.** Draft findings only.

Lane: hitch on spawn, `fxLite` / `#327` contract, long sessions, memory.

Numbers from `npm run smoke:fx-lite` + `node scripts/smoke-playtest-perf-midphone.mjs` (390×844, DPR 2.2, touch). Browser pass on the same checkout at 390×844 and 844×390.

Raw JSON: [`playtest-perf-midphone-2026-09-18.json`](./playtest-perf-midphone-2026-09-18.json).

---

## Verdict

**#327 holds the opener.** Wave-1 / first ~90 frames on mid-phone: **4 sparks, 0 freeze**, fighters always draw, pool prewarm 48, Lite FX cap **58** particles.

**The hitch comes back.** After ~1.5s, if `Perf.tier` is still 0 (smooth opener → EMA never climbs), `fxSpawnLite()` turns off. Wave 2+ elite intro dumps **26 particles + 100ms freeze**. Colossal / super-boss: **48 particles + 220ms freeze**.

**Lite FX does not skip kill/hit freeze.** `#330` `juiceKillSnap` still sets `freezeT` 58–75ms on every kill. `applyHitStop` still 34–72ms. Only `motionReduced()` skips those.

**Long session / memory: no leak in the fight FX path.** 24× `startGame('training')`: pool ≤48, live particles 0 at end, scenery cache 2. Leftover risk is **menu UI canvases** (upgrades/pets/gear), not the particle pool.

No P0 (no black screen, no missing fighters, no Versus).

---

## What already works (#327)

| Check | Result |
|--------|--------|
| `fxSpawnLite()` first ~90 frames on touch / `W<720` | **true** |
| Wave-1 elite intro | **4 particles, freezeT 0** |
| Lite FX elite intro | **4 particles, freezeT 0** |
| `fxCaps` Lite FX | **58 / 11 / 20** (particles / floaters / projectiles) |
| `fxCaps` mid-phone default | **100 / 20 / 34** |
| Lite burst of 34 | clamped (**9** in `smoke:fx-lite`, **18** without pinning tier 2) |
| Particle pool | prewarm **48**, max **160**, recycle on death |
| Fighters / monsters / pet | always `draw()` — `skipFx` only skips particles |
| Satan / Tide intros | honor `fxSpawnLite` (no freeze when on) |
| Settings → Lite FX | present; hint toast after 120 frames at tier 2 |

Contract: [`docs/FX-LITE.md`](./FX-LITE.md).

---

## Findings

### PERF-01 — P1 — Elite intro hitch after first ~90 frames

`fxSpawnLite()` is `liteFx || reduced-motion || Perf.tier>=1 || (touch && frames<90)`.

A mid-phone that **stays at tier 0** (opener is smooth, EMA never >22ms) loses the guard at frame 90. Next elite / boss intro is the **full desktop dump**:

| Moment | spawnLite | particles | freezeT |
|--------|-----------|-----------|---------|
| Wave 1 / frames < 90 | true | 4 | 0 |
| After 90 frames, tier 0 | false | **26** | **0.10s** |

Hook: `triggerSpecialEnemyIntro` in `src/data/monsters.js`.

**Fix sketch (not in this PR):** keep `fxSpawnLite()` true on `fxTouchDevice()` for the whole fight, or at least until the player has opted out / tier has been sampled as healthy for N seconds. Do not require a hitch before the guard stays on.

### PERF-02 — P1 — Colossal / super-boss 220ms freeze when guard is off

Same gate. Super-boss + colossal after 90 frames / tier 0:

- **48 particles** (34 + white burst + rings; cap 100 so it all lands)
- **freezeT 0.22s**
- shake 16 / 0.55s

On a mid-phone that just cleared wave 1 cleanly, the first big spawn is a visible stutter. Satan/Tide skip freeze only while `spawnLite` is still on — same cliff.

### PERF-03 — P1 — `juiceKillSnap` freeze ignores Lite FX

`src/systems/combat-juice.js` sets freeze **before** the shake rate-limit:

```js
game.freezeT = Math.max(game.freezeT || 0, elite ? 0.075 : 0.058);
if (!juiceGapOk(...)) return; // shake/haptic only
```

Measured with `save.liteFx = true`:

- common kill **0.058s**
- elite/boss kill **0.075s**

Horde wave-clear = stacked 58ms hitches even with Lite FX on. Shake is rate-limited; **freeze is not**.

**Fix sketch:** skip or shrink `freezeT` when `fxLite()` / `fxSpawnLite()` / `fxTouchDevice()`. Keep KO floater + haptic.

### PERF-04 — P2 — `applyHitStop` ignores Lite FX

`src/data/monsters.js` `applyHitStop`: only `motionReduced()` returns early.

| Hit | freezeT |
|-----|---------|
| punch | 0.034s |
| heavy crit combo 10 | 0.072s |
| punch + Lite FX | **0.034s** (unchanged) |

Combines with PERF-03: punch hitch + kill hitch on the same beat.

### PERF-05 — P2 — Mid-phone after opener is desktop-weight FX

`fxLite()` = `save.liteFx || Perf.tier>=2 || motionReduced()`.

After 90 frames at tier 0 (typical if the opener was smooth):

- `fxSpawnLite()` **false**
- `fxLite()` **false**
- touch cap still 100, budget 10/frame

Death bursts, crit rings (`applyCritFx` 9–15), travel dust, skill trails all run full-fat until EMA climbs. Tier 1 turns spawnLite back on but **still not** `fxLite()` (needs tier 2).

Lite FX setting is the only player-facing escape. The auto hint waits for **tier 2 and 120 frames** — after the hitch already happened.

### PERF-06 — P3 — Long session memory: fight path OK, menu canvases leftover

24× training restart (same VM):

| Metric | Value |
|--------|--------|
| ok starts | 24/24 |
| max live particles | 21 |
| end live particles | 0 |
| pool | 27 mid-cycle → **48** at end (prewarm refill) |
| scenery cache keys | **2** (training theme) |
| pool max constant | 160 |

`SceneryArt` evicts (lite 16 / full 28). Cave + forest strips rebuild only when row count changes. Menu vista = 2 persistent 640×280 buffers. Satan SVG = one global `Image`.

**Leftover:** `src/ui/ui.js` `createElement('canvas')` on upgrades / pets / gear / icon paints (64×64 and similar). Not a fight leak; a long hub session that opens Collectie / Upgrades / Uitrusting repeatedly can churn GPU canvases. No cap, no reuse.

`speciesTop20Ranked()` still runs sync on every `startGame` — cheap after first call, but it sits on the spawn hitch stack next to `forceGameResize()` ×2.

---

## Browser / mid-phone notes

- **390×844 portrait:** HOME hub paints (not black/blue). Training: player + RabbitRobot both draw, HUD + pads up, first second not frozen. Matches #327 opener.
- **844×390 landscape:** fight layer up, pads reachable. `W` is 844 so `W<720` is false; guard still trips via `IS_TOUCH`. Same 90-frame cliff. One shot showed only the robot in frame (player maybe off-camera left) — camera/#325, not an FX dump.
- **Pause audio chips** (Klassiek / Jungle / …) are **not** Lite FX. Lite FX lives under Instellingen. Default **off**.
- Console: AudioContext + `navigator.vibrate` gated until gesture — expected. No fight crash.
- Versus not opened.

This VM/desktop Chrome is **not** a mid-SoC Android. PERF-01/02 are **code-path** hitches (`freezeT` + particle dump). On a real mid-phone they read as a stutter; here they are a 1–2 frame pause.

---

## Suggested next PR (not this one)

1. **P1:** `fxSpawnLite()` stay on for `fxTouchDevice()` for the whole fight (or until a healthy-tier sample), not only 90 frames.  
2. **P1:** Gate `juiceKillSnap` / `applyHitStop` freeze on `fxLite()` / touch.  
3. **P2:** Auto-hint Lite FX earlier (tier 1, or first elite intro on touch).  
4. **P3:** Reuse icon canvases in UI; don’t sync-rank top-20 on every `startGame`.

Do **not** skip fighter `draw()`. Do **not** bring Versus back. Do **not** push `origin/main` until «merge main».

---

## How to re-run

```bash
npm run smoke:fx-lite
node scripts/smoke-playtest-perf-midphone.mjs
```
