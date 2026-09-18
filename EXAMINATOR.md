# EXAMINATOR — living board (Stickman Fighter)

**Role:** Klöpping-style conductor. Playtest desktop + mobile (~390px), rank issues, fix unique leftovers, leave a pick-list for sibling workers.

**Share URL:** `speel.html` — never `ipad.html` or tunnel links.  
**Versus:** retired. Do not revive.  
**Factory ids (locked):** `stick_lighter` · `woodchip_glue` · `chipping_wood` · `bamboo_boesa` · `echo_whistle`  
**This sprint:** mobile **web** viewport only. Native Android APK / TWA / Play upload = **out of scope** (see bottom).

**Baseline playtested:** v1.18.172 / SW 382 (`origin/main` `a7a4b74`)  
**This draft PR:** v1.18.174 / SW 384 · branch `cursor/examinator-p0-bb6c` · **#320 — do not merge to main**

How to pick work: take the **lowest open EX-id** in your lane. Mark `in-progress` / `done` / `DELEGATED #PR` here when you start/finish. Do not steal a `done` or `DELEGATED` item unless the owner asks to change it.

---

## Sibling draft map (do not duplicate)

| PR | Branch | Lane | EX they own |
|----|--------|------|-------------|
| **#314** | `cursor/mobile-combat-density-2236` | density / HUD | EX-001 remainder · **EX-012** |
| **#313** | `cursor/summons-cleanup-18b8` | summons | **EX-010** · EX-006 remainder · FOMO HOME-only / `fomo-open` chrome |
| **#315** | `cursor/gear-screens-ux-a278` | gear | **EX-011** · **EX-019** |
| **#319** | `cursor/pets-catchup-bc19` | pets | collection Pets screen (EX-003 follow already on #320) |
| **#312** | `cursor/factories-ux-unclunky-d443` | factories | **EX-016** · factory sheet UX (EX-004 list XOR already on #320) |
| **#317** | `cursor/i18n-layout-copy-f2a3` | i18n layout | factories/FOMO/HUD/gear **layout** copy — **not** EX-013/014/015 |
| **#316** | `cursor/juice-feel-f8cf` | juice | KO confirm / empty CTAs / reduced-motion |
| **#318** | `cursor/ui-layout-polish-7643` | UI | **EX-017** · **EX-018** · HOME/Collectie chrome |

---

## Priority key

| Rank | Meaning |
|------|---------|
| **P0** | Breaks Android-first play or owner-named pain (i18n leak, text overflow, phone horde, unusable factory/gear, pets that cannot keep up, summons that feel broken) |
| **P1** | Clunky / ugly but flow still works |
| **P2** | A–Z polish, copy consistency |
| **P3** | Nice-to-have / future Android native |

---

## Open EX list (siblings pick next)

| ID | P | Status | Owner lane | Symptom | Where to start |
|----|---|--------|------------|---------|----------------|
| EX-010 | P1 | **DELEGATED #313** | summons | Chest stage still large vs CTA; video path can feel slow/clunky after first tap | `styles/main.css` `.summon-stage` · `src/ui/ui.js` `openSummonHub` / pull timers |
| EX-011 | P1 | **DELEGATED #315** | gear | 131-item catalog + LOOK/STAT chips still a long one-page scroll; filters wrap ok at 390 but picker is busy | `src/ui/ui.js` `renderGear` · `#gearScreen` |
| EX-012 | P1 | **DELEGATED #314** | combat HUD | First-minute hint + star bar + wave label stack tight on 390; floaters can crowd left. #320 already wraps hint (EX-005); **do not re-tune density here** | `docs/COMBAT-DENSITY.md` on #314 |
| EX-016 | P2 | **DELEGATED #312** | factories | Long factory names wrap; “Wat doet dit?” block is wordy on 390 | `src/ui/buildings-ui.js` · `buildings.stick_lighter` blurb |
| EX-017 | P2 | **DELEGATED #318** | A–Z | Collectie tile counts mix formats (`1/63 vrij` vs `12 dier - munten`) | `src/ui/ui.js` hub stats |
| EX-018 | P2 | **DELEGATED #318** | A–Z | “Verder spelen” continue banner stays on HOME after a run | `#btnContinue` / `menu.continue` |
| EX-019 | P3 | **DELEGATED #315** | i18n | Gear chips LOOK/STAT still English tokens in FR/ES (short on purpose) | catalog-locales overlays |
| EX-020 | P3 | open | Android native | TWA / Play / APK signing, back-gesture, display-cutout, install prompt — **next sprint** | `native/android/` · `docs/store/` |

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
| EX-021 | P2 | **done** | 390px FOMO sheet compact + HOME tiles stay tappable (backdrop only lower half). **Does not** restage #313 HOME-only / `fomo-open` chrome hide. |

---

## Playtest log (2026-09-18)

**Method:** local `python3 serve.py` → `http://127.0.0.1:8787/index.html` + `/speel.html`.  
Desktop ~1280×800 and phone 390×844 (Puppeteer + computer-use). Versus tile absent.

| Surface | 390px | Desktop | Notes |
|---------|-------|---------|-------|
| Title gate / SPELEN | ok | ok | Android-first landing on `speel.html` |
| HOME hub | tiles usable above compact FOMO sheet (EX-021) | 2-col | NL/EN/DE switch clean on chrome |
| Factories | list→detail | dual-pane killed on #320 | ids confirmed; further copy = #312 |
| Gear | pills wrap | long scroll | LOOK/STAT leftover FR/ES = #315 |
| Summons | chest-heavy | sparse CTA | EX-010 = #313 |
| Adventure Lv1 | 2+3/4 mobs | same | opener already soft |
| Adventure Lv10/20 | phone scaled | desk 96 / 214 | EX-001 + #314 |
| Pets | follow snap | follow snap | collection screen = #319 |
| Gamble toast | locale | locale | EX-014 |
| Species names | Peepwing on EN | same | EX-013 |

Probe (pre-fix, v1.18.172):

```
390 / 1280  hordeMul=6  maxPerWave=36  maxAlive=54 vs 78
Lv10 total 96   Lv20 total 214
EN gear.wearing → "aan"   NL pills LOOK/STAT/LOCK
factory ids stick_lighter…echo_whistle  OK
```

---

## Constraints for every worker

1. No Versus.  
2. Do not rename factory ids.  
3. No secrets. Do not commit tunnel `health.json` / `hosting.json` / `LIVE-LINK.txt`.  
4. Edit `src/`, then `npm run build` → committed `game.js`.  
5. Draft PR only unless the owner says **«merge main»**.  
6. Share URL stays `https://brennyz.github.io/stickman-fighter/speel.html`.

---

## Future Android gaps (out of scope this sprint)

- Bubblewrap / TWA `appVersionName` still 1.18.172 until a Play drop  
- Predictive back, display-cutout, installability QA on a real device  
- Play Console store listing / data-safety (docs exist, not this PR)  
- Offline SW on Android Chrome after this cache rev (384) — player taps «Verse versie»

---

## Agent handshake

```bash
./scripts/agent-status.sh
./scripts/github-sync-status.sh
# after a pick: edit this table, then
./scripts/agent-log.sh "EX-0xx: one line" --wish "optional"
```
