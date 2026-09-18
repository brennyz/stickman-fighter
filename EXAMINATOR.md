# EXAMINATOR — living board (Stickman Fighter)

**Role:** Klöpping-style conductor. Playtest desktop + mobile (~390px), rank issues, fix unique leftovers, leave a pick-list for sibling workers.

**Share URL:** `speel.html` — never `ipad.html` or tunnel links.  
**Versus:** retired. Do not revive.  
**Factory ids (locked):** `stick_lighter` · `woodchip_glue` · `chipping_wood` · `bamboo_boesa` · `echo_whistle`  
**This sprint:** mobile **web** viewport only. Native Android APK / TWA / Play upload = **out of scope** (see bottom).

**Baseline playtested:** v1.18.172 / SW 382 (`origin/main` `a7a4b74`)  
**This draft PR:** v1.18.178 / SW 388 · branch `cursor/examinator-p0-bb6c` · **#320 — hold draft until ~16:30 Amsterdam — do not merge to main**

How to pick work: take the **lowest open EX-id** in your lane. Mark `in-progress` / `done` / `DELEGATED #PR` here when you start/finish. Do not steal a `done` or `DELEGATED` item unless the owner asks to change it.

---

## Mega-merge hold (~16:30 Amsterdam, 2026-09-18)

All feature drafts stay **open / draft**. #320 stays draft until that window. No silent `main`.

| PR | Lane | Mergeable (15:51 CEST) | EX / note |
|----|------|-----------|-----------|
| **#320** | EXAMINATOR (this) | MERGEABLE | Unique leftovers + FEEL 023/024/027/028. Retry stripped for #323. |
| **#323** | Flappy retry | MERGEABLE | **EX-022** — `Nog één keer` / `restartAdventureInstant` / ~700ms / `#resRetrySafe` |
| **#314** | density / HUD | MERGEABLE | **EX-012** · horde remainder. Title also mentions retry — **do not fight #323** |
| **#324** | tablet mid-band | UNKNOWN / draft | Follow-up on #314 cadence |
| **#321** | HUD keep-out | MERGEABLE | Phone pause/bars/sheets — density cousin of **EX-012** |
| **#313** | summons | MERGEABLE · DONE | **EX-010** · EX-006 remainder |
| **#315** | gear | MERGEABLE | **EX-011** · **EX-019** |
| **#319** | pets | MERGEABLE | Pets collection + combat feel (EX-003 follow already on #320) |
| **#312** | factories | MERGEABLE · near-DONE | **EX-016** · sheet UX (EX-004 list XOR on #320) |
| **#317** | i18n layout | MERGEABLE · DONE | factories/FOMO/HUD/gear **layout** copy — not EX-013/014/015/024/027/028 |
| **#316** | juice | MERGEABLE | **EX-025** + first-HOME welcome kill. Retry API stays **#323**. Do not restage welcome here. |
| **#318** | UI | MERGEABLE | **EX-017** · **EX-018** · HOME/Collectie chrome · welcome-vs-FOMO stack |
| **#322** | FOMO cover | MERGEABLE | Also working EX-021 HOME cover. #320 compact sheet already landed |
| **#311** | playtest-harden | MERGEABLE | Older harden cycle — not a FEEL owner |

Suggested merge order if Brendon says **«merge main»** after 16:30: i18n #317 → retry #323 → examinator #320 → density #314/#321 then #324 (if mergeable) → factories #312 → gear #315 → summons #313 → pets #319 → juice #316 → UI #318 → FOMO #322. Versus stays retired.

**390 sibling-retest (this branch, 15:51 CEST) — no new unique P0 to steal:**

| Seen on 390 | Rank | Owner |
|-------------|------|--------|
| Welcome toast overlaps logo (22px) + Avontuur tile (16px) | P1 (near-P0 first tap) | **DELEGATED #316** (kills welcome) / **#318** (don’t stack on FOMO). Do not restage. |
| Lose Opnieuw + Hoofdmenu same height (89px) | P0 feel retry | **DELEGATED #323** |
| Pause chip visible in fight | HUD keep-out | **DELEGATED #321** |
| Named lose `VERLOREN · {long name}` wraps in Bangers | P1 fair-fail | **#320 EX-028** (this PR) |

---

## Sibling draft map (do not duplicate)

| PR | Branch | Lane | EX they own |
|----|--------|------|-------------|
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

---

## FEEL bar (Flappy-inspired)

Stickman is judged against a one-tap arcade loop — not a store sim. Payments / IAP stay **out of scope** until Android Play is live (note only; see EX-026).

| Bar | Pass looks like | Stickman now |
|-----|-----------------|--------------|
| **Fair fail** | You know *why* you died (pipe, not RNG). Next try feels earned. | **#320 EX-024 + EX-027 + EX-028:** VERLOREN + `#resKiller` name; tip leads with killer. Gamble lecture waits until after first punch. |
| **&lt;3s retry** | Death → next flap in under three seconds. | **DELEGATED #323**. #320 does **not** ship Opnieuw-primary / 380ms / lose-gamble-skip. |
| **One primary CTA** | One tap does the core verb (flap / retry). | HOME hub = many tiles (OK). Lose retry CTA = **#323**. |
| **Juice on core action** | Punch / kick / jump has snap, hit-stop, audio. | **DELEGATED #316**. Do not restage. |
| **First-30s teach-by-doing** | Learn by playing, not by reading. | **#320 EX-023:** first Avontuur skips island + gamble + FOMO until `feltFirstPunch`. Aim tutorial stays. HUD = **#314/#321**. |

No unique FEEL P1 left on #320 after EX-028. Next feel work is sibling-owned (#323 retry, #316 juice/welcome, #314/#321 HUD).

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
| EX-022 | P0 | **DELEGATED #323** | FEEL / retry | Death → fight under 3s + one primary CTA. Do **not** restage on #320 | `src/systems/missions.js` on #323 |
| EX-025 | P2 | **DELEGATED #316** | FEEL / juice | Punch/kick/KO snap, empty-collection CTA, reduced-motion | `docs` / `smoke:juice-feel` on #316 |
| EX-026 | P3 | open · **IAP out of scope** | payments | No coins-for-cash / Play Billing until Android Play is live. Do not add IAP. Note only. | `docs/store/` · `native/android/` |

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
| EX-023 | P1 | **done** | First-30s: `firstPunchPending()` until `save.feltFirstPunch`. First Avontuur → lv1, no island, `gamble: null`. FOMO off until first punch. |
| EX-024 | P1 | **done** | Fair fail: `lastHurtBy` → `result.advLoseBy` = `VERLOREN · {name}` + killed-by tip (NL/EN/DE/FR/ES). |
| EX-027 | P1 | **done** | First-loss tip no longer leads with gamble lecture. Killer first; `lossGambleTip` waits until after first punch (once-flag not burned). |
| EX-028 | P1 | **done** | 390 named-lose: Bangers stays `VERLOREN` / `YOU LOSE`; killer name on `#resKiller` so long species don’t wrap the title. |

---

## Playtest log (2026-09-18) — retest after EX-023/024

**Method:** `python3 serve.py` → `http://127.0.0.1:8787/index.html?nosplash=1` + `/speel.html`.  
Phone 390×844 Puppeteer (fresh `localStorage`) + computer-use. Versus tile absent.

| Surface | 390px after 023/024 | Regression? |
|---------|---------------------|-------------|
| Title / `speel.html` | SPELEN landing; no Versus copy | none |
| HOME fresh | tiles tappable; **no FOMO** while `firstPunchPending` | none |
| Avontuur first tap | `state=play` lv1, `gamble: null`, no island | none |
| First 4s fight | 2 mobs, HP 100, 1.35s spawn grace | no instant-death on 390 (desktop one-shot earlier was desk + walk-in) |
| Lose title | `VERLOREN · Kip op Hol` | none |
| Lose tip (pre-027) | gamble lecture **buried** the flyer tip | **P1 — fixed EX-027** |
| After `feltFirstPunch` | FOMO may return; Avontuur → **Kies een eiland** | intended, not a regress |
| Continue banner | shows after a run | **EX-018 / #318** — not ours |
| Lose CTAs | Opnieuw + Hoofdmenu twin | **EX-022 / #323** — not ours |
| Factories / gear / summons / training | screens open; training plays | none |
| Pets follow | unchanged 16/20 | none |
| Horde | phone Lv10 wave ≤12; desk horde intact | none |

No P0 regression from EX-023/024. Unique leftover FEEL P1 was the first-loss gamble lecture (EX-027).

---

## Constraints for every worker

1. No Versus.  
2. Do not rename factory ids.  
3. No secrets. Do not commit tunnel `health.json` / `hosting.json` / `LIVE-LINK.txt`.  
4. Edit `src/`, then `npm run build` → committed `game.js`.  
5. Draft PR only unless the owner says **«merge main»**. Hold #320 until ~16:30 Amsterdam.  
6. Share URL stays `https://brennyz.github.io/stickman-fighter/speel.html`.

---

## Future Android gaps (out of scope this sprint)

- Bubblewrap / TWA `appVersionName` still 1.18.172 until a Play drop  
- Predictive back, display-cutout, installability QA on a real device  
- Play Console store listing / data-safety (docs exist, not this PR)  
- Offline SW on Android Chrome after this cache rev (387) — player taps «Verse versie»
- **Payments / IAP** — out of scope until Play is live (EX-026). No shop, no Billing SDK on this sprint.

---

## Agent handshake

```bash
./scripts/agent-status.sh
./scripts/github-sync-status.sh
# after a pick: edit this table, then
./scripts/agent-log.sh "EX-0xx: one line" --wish "optional"
```
