# PLAYTEST BOT 7/9 — Combat juice / hit feel

**Build:** LIVE `main` `c9a29fc` · **v1.18.190 / SW 400** · #330 juice already on main  
**Window:** 2026-09-18 until ~18:36 Amsterdam  
**Share URL:** `speel.html` (local probe: `index.html?nosplash=1`)  
**Versus:** retired — no hub tile. **No `origin/main` from this run.**

Flappy bar for this lane: **snap the punch/KO**, not UI chrome. Reduced-motion if testable.

## Method

| Pass | What |
|------|------|
| Smoke | `npm run smoke:juice-feel` → **SMOKE_OK** |
| Hands-on | Training + Avontuur + Opties «Minder beweging» + 390px (computer-use) |
| Probe | Headless Chrome on the same SHA: start Training / Avontuur, force connected hits + one kill, dump `__sf` floaters / toasts / `freezeT` / `shakeT` / squash |

Hands-on died early in Avontuur (0 kills) and never saw a KO card. The probe **did** land a first-kill KO. Training robot death is a **round result**, not `onMonsterKilled` — no KO snap there (by design of the kill hook).

## Scorecard

| Check | Result | Evidence |
|-------|--------|----------|
| Punch / kick snap | **Pass (soft)** | Damage floater + squash + hit-confirm. Hit-stop is real but short (~34ms punch) — easy to miss. |
| Combo juice | **Pass** | Training: `Combo ×3 — door!` floater, 0 toasts on the flurry. Robot 96→64 HP. |
| KO confirm | **Pass** | One `KO` floater (`#e8f0ff`). No `+XP` on the kill. `freezeT=0.058`, `shakeT=0.16`, `juiceKillSnap` timestamp set. |
| Horde camera-spam | **Pass (code + 12-hit probe)** | Kill shake gated 90ms; 12 rapid hits did not add toasts. |
| UI spam on **hits** | **Pass** | Hits do not toast. |
| UI spam on **first KO** | **P1 miss** | Same frame as KO: toast **and** canvas banner for dex-discover, plus `LEVEL 1` banner. |
| Reduced-motion | **Pass** | `save.reducedMotion`: `shakeT=0`, `hitSquashT=0`, KO text stays, freeze stays (matches `docs/COMBAT-JUICE.md`). |
| Versus | **Pass** | `data-hub="versus"` absent. Hub: adventure / arcade / collect / buildings / gear / pets / summon. |
| 390px | **Pass (layout)** | Fight readable. DevTools-open shot also showed `body.reduced-motion`. |

## Findings (draft — do not merge)

### P1 — First-kill chrome sits on the KO

`_onMonsterKilledInner` still does **banner + toast** on a new dex id (`banner.newDex` 2.0s + `toast.dexDiscover` 3200ms) while juice paints the single KO.

Measured first Avontuur kill (`kipophol`):

- floaters: **`KO` only** (good — no stacked `+XP`)
- toast: `Gewoon: Kip op Hol ontdekt! +3 HP`
- banners: `LEVEL 1` + `Nieuw Gewoon: Kip op Hol! +3 max HP`

That is the opposite of “juice the core action, not UI chrome.” Later kills are clean. **First kill is the one new players feel.**

Suggested (not this PR): keep KO + freeze; drop **either** the toast **or** the banner on first discover (toast-queue already exists — do not add a third layer). Pet-tame / gear-drop use the same toast+banner pattern — same risk, not observed this session.

### P2 — Training has no KO snap

RabbitRobot death goes through `updateTraining` → round banner / `ROBOT WINT` result. `juiceKillSnap` only runs from `onMonsterKilled`. Training still has punch squash + damage floaters; the **kill** does not get the Adventure KO punch.

Leave unless we want a one-shot `KO` floater on robot death (feel only, no XP floater).

### P2 — Hit-stop is easy to miss

`applyHitStop` punch base is **0.034s** (kick 0.044). After ~80ms the probe already saw `freezeT < 0`. Hands-on: “present but subtle.” Not sluggish — also not a Street-Fighter freeze. Fine if we want snappy; do not lengthen without a horde retest.

### P2 (other lanes — do not steal)

| Seen | Owner |
|------|--------|
| Aim-tutorial sheet (`MIK MET DE LOOPBALK`) covers the first Training/Avontuur fight — KO/hits hide under it | first-30s / aim-tutorial (#328), not juice |
| `SLAM — spring!` / `CHARGE` HUD chip center-top during Avontuur | telegraph (#332) |
| Lose `Nog één keer` fat gold CTA | retry (#323/#326) |

### P3 — `Beschermd!` can stack

`Fighter.takeDamage` i-frame path floaters `Beschermd!` with **no rate-limit**. Hands-on saw a stack vs RabbitRobot. Hits themselves stay toast-free.

### P3 — Gear drop still toasts (code, not seen)

`pickup` gear still `UI.toast(toast.gearDrop, 3600)` **and** `juiceEquipCombat`. Juice lane said no extra toast on equip. Not reproduced (no world drop this session).

## Reduced-motion (tested)

Toggle: Opties → **Minder beweging** (`#setReducedMotion` / `save.reducedMotion`) **or** `prefers-reduced-motion`.

| Signal | Default | RM |
|--------|---------|----|
| KO text | yes | yes |
| `freezeT` on kill | 0.058 | 0.058 (spec: freeze stays) |
| `shakeT` | 0.16 | **0** |
| Hit squash | >0 | **0** |
| Hit particles / confirm ring | yes | skipped (`applyHitConfirmFx` returns after haptic) |
| Haptic | yes | yes (not motion) |

OS `prefers-reduced-motion` was **not** emulated; in-game toggle + `body.reduced-motion` class were.

## Out of scope

Versus, payments, retry timing, landscape HOME/camera, telegraph redesign, native Android.

## Lead pick-list

1. **P1** — First-kill dex toast+banner vs KO (unique leftover for a juice follow-up).  
2. P2 Training KO snap — optional.  
3. Do not restage telegraphs / retry / aim-tutorial here.
