# EXAMINATOR — living board (Stickman Fighter)

**Role:** Klöpping-style conductor. Playtest desktop + mobile (~390px), rank issues, fix P0s, leave a pick-list for sibling workers.

**Share URL:** `speel.html` — never `ipad.html` or tunnel links.  
**Versus:** retired. Do not revive.  
**Factory ids (locked):** `stick_lighter` · `woodchip_glue` · `chipping_wood` · `bamboo_boesa` · `echo_whistle`  
**This sprint:** mobile **web** viewport only. Native Android APK / TWA / Play upload = **out of scope** (see bottom).

**Baseline playtested:** v1.18.172 / SW 382 (`origin/main` `a7a4b74`)  
**This draft PR:** v1.18.173 / SW 383 · branch `cursor/examinator-p0-bb6c` · **do not merge to main**

How to pick work: take the **lowest open EX-id** in your lane. Mark `in-progress` / `done` here when you start/finish. Do not steal a `done` item unless the owner asks to change it.

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
| EX-010 | P1 | open | summons | Chest stage still large vs CTA; video path can feel slow/clunky after first tap | `styles/main.css` `.summon-stage` · `src/ui/ui.js` `openSummonHub` / pull timers |
| EX-011 | P1 | open | gear | 131-item catalog + LOOK/STAT chips still a long one-page scroll; filters wrap ok at 390 but picker is busy | `src/ui/ui.js` `renderGear` · `#gearScreen` |
| EX-012 | P1 | open | combat HUD | First-minute hint + star bar + wave label stack tight on 390; floaters can crowd left | `src/game/game.js` `drawHud` / floaters |
| EX-013 | P1 | open | i18n | Monster *names* stay Dutch proper-nouns on EN/DE/FR/ES (Slymo ok; `Piepvleugel` less so) | `src/data/monsters.js` SPECIES.name · i18n `species.*` |
| EX-014 | P2 | open | i18n | `gambleOutcomeLabel()` hardcoded Dutch; EN players see “Pech! Super-baas…” | `src/data/monsters.js` ~1130 |
| EX-015 | P2 | open | i18n | FR/ES `pressStart` still `insert coin`; DE is fine (`Münze einwerfen`) | `src/i18n/i18n.js` fr/es menu |
| EX-016 | P2 | open | factories | Long factory names wrap; “Wat doet dit?” block is wordy on 390 | `src/ui/buildings-ui.js` · `buildings.stick_lighter` blurb |
| EX-017 | P2 | open | A–Z | Collectie tile counts mix formats (`1/63 vrij` vs `12 dier - munten`) | `src/ui/ui.js` hub stats |
| EX-018 | P2 | open | A–Z | “Verder spelen” continue banner stays on HOME after a run | `#btnContinue` / `menu.continue` |
| EX-019 | P3 | open | i18n | Gear chips LOOK/STAT still English tokens in FR/ES (short on purpose) | catalog-locales overlays |
| EX-020 | P3 | open | Android native | TWA / Play / APK signing, back-gesture, display-cutout, install prompt — **next sprint** | `native/android/` · `docs/store/` |
| EX-021 | P2 | open | FOMO / HOME | First-open «Vandaag» ritual sheet covers HOME tiles on 390px (by design, still blocks the grid until dismiss) | `src/systems/missions.js` FOMO ritual · `#fomoRitual` |

---

## Fixed this PR (do not redo)

| ID | P | Status | Fix |
|----|---|--------|-----|
| EX-001 | P0 | **done** | Phone/tablet horde scale. Same wave math as desk was drowning 390px (`ADVENTURE_HORDE_MUL=6`, `MAX_ALIVE` 54). Now `adventureHordeProfile()`: phone ≤8 alive / ≤12 per wave / slower spawn; tablet mid; desk keeps 6× horde. |
| EX-002 | P0 | **done** | i18n leaks: NL gear pills LOOK/STAT/LOCK → SIER/STAT/VAST; EN `gear.wearing` no longer falls back to `aan`; DE OPTIK/SPERRE; summon card copy via `tOr` (egg/coins/XP/fail); NL `pressStart` `gooi een munt`. |
| EX-003 | P0 | **done** | Pets lagged (lerp 8/7). Follow 16–20 + snap if >150px behind. Egg-pet same. |
| EX-004 | P0 | **done** | Factories: kill landscape dual-pane (list XOR detail). Wallet chips wrap at 390. |
| EX-005 | P1 | **done** | Combat first-minute hint wraps on narrow `W` instead of one overflowing pill. |
| EX-006 | P1 | **partial** | Summons: hide `summon-where` + shrink stage at ≤430px. Full chest/video rebuild = EX-010. |

---

## Playtest log (2026-09-18)

**Method:** local `python3 serve.py` → `http://127.0.0.1:8787/index.html` + `/speel.html`.  
Desktop ~1280×800 and phone 390×844 (Puppeteer + computer-use). Versus tile absent.

| Surface | 390px | Desktop | Notes |
|---------|-------|---------|-------|
| Title gate / SPELEN | ok | ok | Android-first landing on `speel.html` |
| HOME hub | tiles stack; FOMO «Vandaag» sheet covers grid on first open (EX-021) | 2-col | NL/EN/DE switch clean on chrome |
| Factories | list→detail | **was** dual-pane clutter | ids confirmed |
| Gear | pills wrap risk | long scroll | LOOK/STAT English tokens (fixed NL) |
| Summons | chest-heavy | sparse CTA | EX-010 still open |
| Adventure Lv1 | 2+3/4 mobs | same | opener already soft |
| Adventure Lv10/20 | **96 / 214 mobs, 54 alive** pre-fix | same counts | EX-001 |
| Pets | not visible enough in short fight | lag in code | EX-003 |

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
- Offline SW on Android Chrome after this cache rev (383) — player taps «Verse versie»

---

## Agent handshake

```bash
./scripts/agent-status.sh
./scripts/github-sync-status.sh
# after a pick: edit this table, then
./scripts/agent-log.sh "EX-0xx: one line" --wish "optional"
```
