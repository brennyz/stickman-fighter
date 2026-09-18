# PLAYTEST REPORT — 2026-09-18

**Role:** Playtest lead (swarm conductor). Rank issues. Do **not** own every fix.  
**Pin:** LIVE `main` `c9a29fc` · **v1.18.190** · **SW 400** · `stickfighter-app-v400`  
**Share:** https://brennyz.github.io/stickman-fighter/speel.html  
**Local:** `http://127.0.0.1:8787/speel.html` and `/index.html?nosplash=1` (this clone = pin).  
**Deadline:** ~18:36 Europe/Amsterdam · **Draft PR only · no Versus · no merge main.**

Playtest build is the mega-merge of #333 visibility, #325 landscape camera, #334 pauseG HUD, #329 landscape SPELEN, #332 telegraph, #331 landscape touch, #328 first-30s, #330 juice, #326 fat gold retry, #327 fxLite.

---

## Method

| Surface | Viewport | URL |
|---------|----------|-----|
| Share landing | 390×844 + 844×390 | `/speel.html` |
| Title-gate → HOME → Avontuur | same | `/index.html?nosplash=1` (+ `?sfdebug=1` if blue) |
| First-30s reset | console | `__sf.resetFirstPunchTeach()` then Avontuur |
| Versus | — | **out of scope** (retired) |

Critical path per viewport: SPELEN → Avontuur → first 30s (see you / them / punch teach) → take a hit (named? telegraph?) → die → `Nog één keer` &lt;3s fat gold → rematch paints fighters.

Focus bars: **visibility · landscape · first 30s · death-retry · fair telegraphs · feel.**

---

## Sibling lanes (do not steal)

New EX-ids start at **EX-033**. Older EX-001…032 stay on their owners (`EXAMINATOR.md`). Pick the **lowest open EX in your lane**.

| Lane | Owns | Do not restage |
|------|------|----------------|
| **visibility** | `drawCombatants` · recover · contrast-lift · `smoke:fighters-visible` | HUD throw (EX-029 done) |
| **landscape-combat** | `alignCombatPlayfield` · floor/camera · `smoke:landscape-combat` | touch pads |
| **landscape-begin** | title-gate two-col SPELEN · FOMO left dock · `smoke:landscape-begin` | combat camera |
| **landscape-touch** | 844×390 pads · `docs/LANDSCAPE-TOUCH.md` | HUD pause gutter (#321) |
| **telegraph** | wind-up rings/bars · `docs/COMBAT-TELEGRAPH.md` | density 0.50 (#314) |
| **first-30s** | `first-punch-teach.js` · island/FOMO skip | aim-tutorial wall |
| **death-retry** | `#resRetrySafe` · `restartAdventureInstant` · fat gold | juice toasts |
| **juice** | hit/kill/equip snap · `docs/COMBAT-JUICE.md` | retry CTA |
| **fxLite** | particle caps · Lite-FX toast parking | actor draw |
| **density / HUD** | horde 0.50 · `hudSafeLayout` | result copy |
| **i18n / FOMO / gear / pets / factories** | chrome only | fight loop |

---

## Board — P0–P3 (filling during playtest)

Status: `open` · `playtest-lead` · `lane` · `sibling` · `pass`

| ID | P | Status | Owner lane | Repro | Notes |
|----|---|--------|------------|-------|-------|
| EX-033 | P2 | open · code-audit | death-retry | `finishAdventure` computes `combatLoseResultMs()` (650 compact / 850 desk) then **ignores** it and uses `resultShowDelayMs` → always **700ms** lose. | Contract drift vs `docs/COMBAT-DENSITY.md`. Confirm CTA still &lt;3s in playtest. Do not retune density. |
| EX-034 | — | reserved | visibility | 390 + 844 Avontuur: player + mobs painted? recover after rotate? cyber-night contrast? | Playtest in progress |
| EX-035 | — | reserved | landscape-combat | 844×390: floor under feet, camera not sky-only, entities on playfield | Playtest in progress |
| EX-036 | — | reserved | landscape-begin | 844×390: SPELEN / Avontuur tappable, FOMO not covering primary | Playtest in progress |
| EX-037 | — | reserved | landscape-touch | 844×390: jump/punch/kick ≥44px, joy above nav, swipe still works | Playtest in progress |
| EX-038 | — | reserved | first-30s | Reset teach → Avontuur: no island/dice/FOMO before first punch; nudge “Tik slaan” / “Druk J” | Playtest in progress |
| EX-039 | — | reserved | death-retry | Death → fat gold `Nog één keer` visible &lt;3s; tap-safe; rematch same level no dice | Playtest in progress |
| EX-040 | — | reserved | telegraph | Charge/slam/shot readable before contact; lose tip names cue / killer | Playtest in progress |
| EX-041 | — | reserved | juice / feel | Punch/kick/jump snap; hit-stop; named `-N` floater (EX-030) | Playtest in progress |

Older leftovers still open for siblings (do not re-file):

| ID | P | Status | Lane |
|----|---|--------|------|
| EX-010 | P1 | DELEGATED #313 | summons |
| EX-011 | P1 | DELEGATED #315 | gear |
| EX-012 | P1 | DELEGATED #314 | combat HUD stack |
| EX-016 | P2 | DELEGATED #312 | factories copy |
| EX-017 | P2 | DELEGATED #318 | Collectie counts |
| EX-018 | P2 | DELEGATED #318 | Verder spelen banner |
| EX-020 | P3 | open | Android native (out of this swarm) |
| EX-025 | P2 | #316 + #330 | juice |
| EX-026 | P3 | IAP out of scope | payments |
| EX-031 | P1 | DELEGATED fxLite / #318 | Lite-FX toast on VERLOREN |

---

## Playtest log

| Time CEST | Viewport | Path | Result |
|-----------|----------|------|--------|
| 18:08 | — | Pin `c9a29fc` · branch `cursor/playtest-lead-9e0e` · serve `:8787` | build confirmed v1.18.190 / SW 400 |
| 18:12 | — | Code audit lose-delay | EX-033 filed (P2) |
| *filling* | 390×844 | speel → Avontuur → die → retry | *in progress* |
| *filling* | 844×390 | title-gate / HOME / fight / retry | *in progress* |

---

## Pass / fail bars (lead judgement after play)

| Bar | Pass looks like | Status |
|-----|-----------------|--------|
| Visibility | See you, them, HP | *pending play* |
| Landscape HOME | One tap SPELEN / Avontuur | *pending play* |
| Landscape fight | Floor + bodies + pads | *pending play* |
| First 30s | Learn by punching, not reading | *pending play* |
| Death-retry | Fat gold CTA &lt;3s, rematch paints | *pending play* |
| Fair telegraph | You saw the pipe | *pending play* |
| Feel | Punch has snap | *pending play* |

---

## Lead notes for sibling playtesters

1. **Do not fix everything.** Take one lane. Mark the EX `in-progress` on this board (or comment on the draft PR).
2. Stay on **Adventure**. No Versus. No IAP. No `main`.
3. Prove on **390×844 and/or 844×390**. Desktop-only findings are P2 unless the fight is invisible.
4. If two of you see the same symptom, **keep the lower EX-id** and add a “also seen” note.
5. End-of-window tasks live in `IMPROVEMENT-PLAN.md` (30-min bot slices).
