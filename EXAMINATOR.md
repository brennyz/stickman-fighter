# EXAMINATOR — living board (Stickman Fighter)

**Role:** Klöpping-style conductor. Playtest desktop + mobile (~390px), rank issues, fix unique leftovers, leave a pick-list for sibling workers.

**Share URL:** `speel.html` — never `ipad.html` or tunnel links.  
**Versus:** retired. Do not revive.  
**Factory ids (locked):** `stick_lighter` · `woodchip_glue` · `chipping_wood` · `bamboo_boesa` · `echo_whistle`  
**This sprint:** mobile **web** viewport only. Native Android APK / TWA / Play upload = **out of scope** (see bottom).

**Baseline playtested:** v1.18.189 / SW 399 (`origin/main` `aae6f73`)  
**This draft PR:** v1.18.190 / SW 400 · branch `cursor/examinator-feel-ba3c` · **FROZEN 17:54 CEST · DONE (code+smokes) / PARTIAL (no post-fix browser retest) · draft only — no main merge**

How to pick work: take the **lowest open EX-id** in your lane. Mark `in-progress` / `done` / `DELEGATED #PR` here when you start/finish. Do not steal a `done` or `DELEGATED` item unless the owner asks to change it.

---

## FROZEN 17:54 CEST — DONE / PARTIAL

**STOP.** Session deadline. No more feature work on this branch. Draft only. No `main`.

| Mark | Meaning |
|------|---------|
| **DONE** | Unique P0s EX-029 / EX-030 + P1 EX-032 in `src/` + `game.js`. `smoke:examinator`, `smoke:lose-retry`, `smoke:adventure`, `smoke:hud-phone` green. Board ranked. Trio lanes untouched. |
| **PARTIAL** | Post-fix Adventure desktop+390 browser retest not re-run (deadline). Pre-fix playtest proved `rightPad` wipe. |

---

## Post-merge feel pass (17:36–17:54 CEST, 2026-09-18)

Mega-merge already LIVE on main (`v1.18.189`). This run is a **new** conductor pass on the core fight loop. Draft only. **FROZEN.**

**Do not duplicate the P0 trio** (other agents own these — leave them):

| Lane | Agent | Why we skip |
|------|--------|-------------|
| invisible-render | P0 invisible stickman render | Canvas / pixel pipeline. Symptom overlap with EX-029 was a **HUD throw**, not missing strokes. |
| landscape HOME | P0 landscape HOME play button | HOME Avontuur hit-target in landscape. |
| landscape combat | P0 landscape combat camera/canvas | Camera / canvas in landscape fight. |

**Do not steal sibling feel lanes:** death-retry · telegraph · first-30s teach · combat juice · landscape touch · fxLite performance.

| Bar | Pass looks like | Stickman now (this playtest) |
|-----|-----------------|------------------------------|
| **Readability** | See you, them, HP, who hit you. | **P0 EX-029:** `rightPad` throw aborted `draw()`; loop catch painted sky-only → invisible fight, then VERLOREN. Fixed + HUD isolated. |
| **Fair fail** | You know *why* you died (pipe, not RNG). | Killer name on `#resKiller` still good (EX-024/028). Mid-fight was nameless `-N` → **EX-030** named floater + chip. |
| **&lt;3s retry** | Death → next flap in under three seconds. | **DELEGATED #323** / death-retry sibling. CTA present; retry looped into the broken draw. |
| **Juice on core action** | Punch / kick / jump has snap, hit-stop, audio. | **DELEGATED #316** / combat-juice sibling. Untestable until EX-029. |
| **First-30s teach-by-doing** | Learn by playing, not by reading. | Island skip still **EX-023**. Opener grace was silent → **EX-030**. Teach copy = first-30s sibling. |

---

## Unique P0 this PR

| ID | P | Status | Symptom | Fix |
|----|---|--------|---------|-----|
| **EX-029** | P0 | **done (this)** | Adventure `drawHUD` referenced undefined `rightPad`. `game.draw` threw every frame; loop catch wiped to sky+ground. Avontuur → hiccup → ~10s → VERLOREN with 0 kills. Desktop + 390. | Use `pauseG`. Drop unused `star0`. `try/catch` around `drawHUD` so a HUD leftover cannot wipe fighters. |
| **EX-030** | P0 | **done (this)** | Incoming hit was a nameless `-N`. Opener 1.35s grace had no HUD (versus shows Spawn Ns). First contact felt random. | `paintIncomingHurtRead` → `{name} −n` + `#lastHit` chip 2s. `openerGraceT` cyan chip on HP bar. One incoming floater (takeDamage). |
| **EX-032** | P1 | **done (this)** | Heat line (`Lv 1: 1/10 · Meester…`) led the lose tip and buried SLAM / `Nog één keer`. | Tip order: fail cue → killer → heat last. |

**uniqueP0 after this PR:** `[]` on this lane. Remaining fight-loop P0s are sibling-owned (trio / retry / juice / teach / telegraph).

---

## 390 + desktop playtest (2026-09-18, 17:40 CEST)

**Method:** `python3 serve.py` → `http://127.0.0.1:8787/speel.html` + `/index.html?nosplash=1`. Computer-use 1280×800 + 390×844. Versus tile absent.

| Surface | Before EX-029 | After EX-029/030 |
|---------|---------------|------------------|
| `speel.html` | SPELEN landing; no Versus | unchanged |
| HOME | tiles + Avontuur | unchanged — landscape HOME is **not ours** |
| Avontuur tap | draw throw · sky-only · hiccup toast | fight draws; HUD isolated |
| First 4s | invisible combat → unfair death | `Start n.s` / `Ready n.s` on HP bar |
| On hit | `-N` only (or double in training) | `{name} −n` + last-hit chip |
| Lose | VERLOREN + `#resKiller` (held) · Lite-FX toast parked on detail | killer line held; toast = #318/#316 |
| Retry CTA | huge `Nog één keer` &lt;1s | **DELEGATED #323** |
| Retry → fight | same broken draw | rematch should paint |

Lite-FX toast on VERLOREN (`Traag? Instellingen → Lite FX`) covers result detail — **P1, not unique** (toast parking #318 / fxLite sibling).

---

## Sibling draft map (do not duplicate)

| PR / agent | Branch | Lane | EX they own |
|------------|--------|------|-------------|
| P0 trio | *(live agents)* | invisible-render · landscape HOME · landscape combat | **leave** — not EX-029 |
| death-retry | *(live)* | Flappy retry | **EX-022** · `Nog één keer` · `restartAdventureInstant` · `#resRetrySafe` |
| telegraph | *(live)* | telegraph readability | wind-up bars — not hit name |
| first-30s teach | *(live)* | first-30s | EX-023 follow (island / teach copy) |
| combat juice | *(live)* | juice | **EX-025** punch/kick/KO snap |
| landscape touch | *(live)* | pads | combat buttons in landscape |
| fxLite | *(live)* | perf | Lite FX toast / caps |
| **#314** | `cursor/mobile-combat-density-2236` | density / HUD | EX-001 remainder · **EX-012** |
| **#321** | `cursor/mobile-hud-safe-5e71` | HUD keep-out | pause / bars / sheets on 390 — not result copy |
| **#324** | `cursor/tablet-midband-2236` | tablet cadence | #314 follow-up |
| **#313** | `cursor/summons-cleanup-18b8` | summons | **EX-010** · EX-006 remainder · FOMO HOME-only / `fomo-open` chrome |
| **#315** | `cursor/gear-screens-ux-a278` | gear | **EX-011** · **EX-019** |
| **#319** | `cursor/pets-catchup-bc19` | pets | collection Pets screen (EX-003 follow already on #320) |
| **#312** | `cursor/factories-ux-unclunky-d443` | factories | **EX-016** · factory sheet UX (EX-004 list XOR already on #320) |
| **#317** | `cursor/i18n-layout-copy-f2a3` | i18n layout | factories/FOMO/HUD/gear **layout** copy — **not** EX-013/014/015/024/027 |
| **#316** | `cursor/juice-feel-f8cf` | juice | KO confirm / empty CTAs / reduced-motion · **EX-025** |
| **#318** | `cursor/ui-layout-polish-7643` | UI | **EX-017** · **EX-018** · HOME/Collectie chrome |
| **#322** | `cursor/fomo-vandaag-home-d443` | FOMO cover | EX-021 remainder (HOME cover). #320 compact sheet already landed |
| **#323** | `cursor/flappy-retry-18b8` | Flappy retry | **EX-022** · `Nog één keer` · `restartAdventureInstant` · ~700ms · `#resRetrySafe` |

Suggested merge if Brendon says **«merge main»**: this draft after sibling P0 trio if they land first. Versus stays retired. Do not silent-push main.

---

## FEEL bar (Flappy-inspired)

Stickman is judged against a one-tap arcade loop — not a store sim. Payments / IAP stay **out of scope** until Android Play is live (note only; see EX-026).

| Bar | Pass looks like | Stickman now |
|-----|-----------------|--------------|
| **Fair fail** | You know *why* you died (pipe, not RNG). Next try feels earned. | **EX-024 + EX-027 + EX-028** on lose. **EX-030** names the hit mid-fight. |
| **&lt;3s retry** | Death → next flap in under three seconds. | **DELEGATED #323**. This PR does **not** restage Opnieuw / `#resRetrySafe`. |
| **One primary CTA** | One tap does the core verb (flap / retry). | HOME hub = many tiles (OK). Lose retry CTA = **#323**. |
| **Juice on core action** | Punch / kick / jump has snap, hit-stop, audio. | **DELEGATED #316**. Do not restage. |
| **First-30s teach-by-doing** | Learn by playing, not by reading. | **#328 + #320 EX-023:** first Avontuur skips island + gamble + FOMO until `feltFirstPunch`. Aim text wall deferred. Punch-button pulse + `juice.strikeNudge`. **EX-030** grace chip. HUD = **#314/#321**. |

---

## Priority key

| Rank | Meaning |
|------|---------|
| **P0** | Breaks Android-first play, owner-named pain, **or** a FEEL-bar miss that blocks the loop (retry &gt;3s, no primary retry CTA) |
| **P1** | Clunky / ugly but flow still works |
| **P2** | A–Z polish, copy consistency |
| **P3** | Nice-to-have / future Android native / IAP after Play |

---

## Open EX list (siblings pick next)

| ID | P | Status | Owner lane | Symptom | Where to start |
|----|---|--------|------------|---------|----------------|
| EX-010 | P1 | **DELEGATED #313** | summons | Chest stage still large vs CTA; video path can feel slow/clunky after first tap | `styles/main.css` `.summon-stage` · `src/ui/ui.js` `openSummonHub` / pull timers |
| EX-011 | P1 | **DELEGATED #315** | gear | 131-item catalog + LOOK/STAT chips still a long one-page scroll; filters wrap ok at 390 but picker is busy | `src/ui/ui.js` `renderGear` · `#gearScreen` |
| EX-012 | P1 | **DELEGATED #314** (+#321 keep-out) | combat HUD | First-minute hint + star bar + wave label stack tight on 390; floaters can crowd left. #320 already wraps hint (EX-005); **do not re-tune density here** | `docs/COMBAT-DENSITY.md` on #314 |
| EX-016 | P2 | **DELEGATED #312** | factories | Long factory names wrap; “Wat doet dit?” block is wordy on 390 | `src/ui/buildings-ui.js` · `buildings.stick_lighter` blurb |
| EX-017 | P2 | **DELEGATED #318** | A–Z | Collectie tile counts mix formats (`1/63 vrij` vs `12 dier - munten`) | `src/ui/ui.js` hub stats |
| EX-018 | P2 | **DELEGATED #318** | A–Z | “Verder spelen” continue banner stays on HOME after a run | `#btnContinue` / `menu.continue` |
| EX-019 | P3 | **DELEGATED #315** | i18n | Gear chips LOOK/STAT still English tokens in FR/ES (short on purpose) | catalog-locales overlays |
| EX-020 | P3 | open | Android native | TWA / Play / APK signing, back-gesture, display-cutout, install prompt — **next sprint** | `native/android/` · `docs/store/` |
| EX-022 | P0 | **DELEGATED #323** | FEEL / retry | Death → fight under 3s + one primary CTA. Do **not** restage on this PR | `src/systems/missions.js` on #323 |
| EX-025 | P2 | **DELEGATED #316** | FEEL / juice | Punch/kick/KO snap, empty-collection CTA, reduced-motion | `docs` / `smoke:juice-feel` on #316 |
| EX-026 | P3 | open · **IAP out of scope** | payments | No coins-for-cash / Play Billing until Android Play is live. Do not add IAP. Note only. | `docs/store/` · `native/android/` |
| EX-031 | P1 | **DELEGATED fxLite / #318** | toast | Lite-FX “Traag?” toast sits on VERLOREN detail | toast queue / `#resultScreen` |

---

## Fixed this PR (do not redo)

| ID | P | Status | Fix |
|----|---|--------|-----|
| EX-001 | P0 | **done** (#314 also owns density) | Phone/tablet horde scale. `adventureHordeProfile()`: phone ≤8 alive / ≤12 per wave / slower spawn; tablet mid; desk keeps 6× horde. |
| EX-002 | P0 | **done** | i18n leaks: NL gear pills LOOK/STAT/LOCK → SIER/STAT/VAST; EN `gear.wearing` no longer falls back to `aan`; DE OPTIK/SPERRE; summon card copy via `tOr`; NL `pressStart` `gooi een munt`. |
| EX-003 | P0 | **done** (#319 owns Pets screen) | Pets lagged (lerp 8/7). Follow 16–20 + snap if >150px behind. Egg-pet same. |
| EX-004 | P0 | **done** (#312 owns factory sheet) | Factories: kill landscape dual-pane (list XOR detail). Wallet chips wrap at 390. |
| EX-005 | P1 | **done** | Combat first-minute hint wraps on narrow `W` instead of one overflowing pill. |
| EX-006 | P1 | **partial → DELEGATED #313** | #320: hide `summon-where` + shrink stage at ≤430px. Full chest/video rebuild = #313. |
| EX-013 | P1 | **done** | `speciesLabel()` + EN/DE/FR/ES names for Dutch compounds (`Piepvleugel` → Peepwing / Piepflügel / Ailepiou / Alippiío). NL keeps SPECIES.name. Dex / HUD / banners / pets list wired. |
| EX-014 | P2 | **done** | `gambleOutcomeLabel()` uses `t('gamble.*')` — EN no longer sees “Pech! Super-baas…”. |
| EX-015 | P2 | **done** | FR `insère une pièce` · ES `inserta una moneda` (`menu.pressStart`). DE already `Münze einwerfen`. |
| EX-021 | P2 | **done** (+ #322 also) | 390px FOMO sheet compact + HOME tiles stay tappable. **Do not restage** #322/#313 chrome. |
| EX-023 | P1 | **done** | First-30s: `firstPunchPending()` until `save.feltFirstPunch`. First Avontuur → lv1, no island, `gamble: null`. FOMO off until first punch. Aim wall deferred; short punch nudge + pulse. |
| EX-024 | P1 | **done** | Fair fail: `lastHurtBy` → `result.advLoseBy` = `VERLOREN · {name}` + killed-by tip (NL/EN/DE/FR/ES). |
| EX-027 | P1 | **done** | First-loss tip no longer leads with gamble lecture. Killer first; `lossGambleTip` waits until after first punch (once-flag not burned). |
| EX-028 | P1 | **done** | 390 named-lose: Bangers stays `VERLOREN` / `YOU LOSE`; killer name on `#resKiller` so long species don’t wrap the title. |
| EX-029 | P0 | **done (this)** | `rightPad` → `pauseG`; `drawHUD` try/catch so HUD cannot wipe the fight. |
| EX-030 | P0 | **done (this)** | Named incoming hit + last-hit chip + opener grace chip. |
| EX-032 | P1 | **done (this)** | Lose tip: fail cue / retry first; heat last. |

---

## Constraints for every worker

1. No Versus.  
2. Do not rename factory ids.  
3. No secrets. Do not commit tunnel `health.json` / `hosting.json` / `LIVE-LINK.txt`.  
4. Edit `src/`, then `npm run build` → committed `game.js`.  
5. Draft PR only unless the owner says **«merge main»**.  
6. Share URL stays `https://brennyz.github.io/stickman-fighter/speel.html`.
7. Do **not** duplicate invisible-render or landscape-HOME lanes.

---

## Future Android gaps (out of scope this sprint)

- Bubblewrap / TWA `appVersionName` still 1.18.172 until a Play drop  
- Predictive back, display-cutout, installability QA on a real device  
- Play Console store listing / data-safety (docs exist, not this PR)  
- Offline SW on Android Chrome after this cache rev — player taps «Verse versie»
- **Payments / IAP** — out of scope until Play is live (EX-026). No shop, no Billing SDK on this sprint.

---

## Agent handshake

```bash
./scripts/agent-status.sh
./scripts/github-sync-status.sh
# after a pick: edit this table, then
./scripts/agent-log.sh "EX-0xx: one line" --wish "optional"
```
