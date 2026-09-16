# Playtest harden — cycles

Lane: **Grok 4.6 only** · one PR: **playtest-harden-cycles**  
Branch: `cursor/playtest-harden-cycles-a78c`  
Base / live target: `origin/main` **v1.18.172 / SW 382**  
Play URL: https://brennyz.github.io/stickman-fighter/speel.html

**Rules:** Android-first (Chrome / TWA). No Versus. No new features — only P0/P1 playtest findings. No nuclear CSS (`display:none !important` on all `.screen`, MutationObservers, canvas z-war). Share URL stays `speel.html`.

This file is the **stub checklist**. Findings land in follow-up messages. Until a cycle has P0/P1 packets, do not large-change game code.

## Process

1. Playtest batch arrives (cycle below).
2. Investigate on current `main` (and this branch if already diverged).
3. Fix P0/P1 only on this branch. Park P2/P3 unless they are one-liners next to a P0/P1.
4. Tick the cycle boxes + append the **Findings log**.
5. Smoke the cycle scripts. Rebuild `game.js` only when `src/` changes.
6. Update this PR (do not open a second harden PR).

Issue packet (from playtest):

```
Titel:
Apparaat: (merk + Android + Chrome of TWA)
Versie in menu: v… · SW v…
Modus:
Stappen:
Verwacht / Gebeurde:
Altijd / soms:
Screenshot: ja/nee
Verdacht: play-laag / touch / FX / save / audio / i18n / anders
```

## Cycle A — HOME / Upgrades / Options

Hub tiles, `#upgradeScreen`, `#settingsScreen` (aim color/radius, Lite FX, language, Verse versie).

- [x] Findings received
- [x] P0/P1 investigated on main
- [x] Fixes on this branch (if any)
- [x] Smoke: `smoke:upgrades` · `smoke:menu` · `smoke:p0p3-uiux` · `smoke:aim-indicator` · `smoke:unify-ui` · `smoke:pwa`

**Open P0/P1:** Cycle 1 P1 — «Verse versie» only in hidden diag. **Fix:** Opties → Hulp shows `btnForceFresh` (no version clutter). Auto-apply on HOME + short toast. Bottom `#netStatus` stay. Diag/version stay 5-tap.

## Cycle B — Summons

`#summonScreen` · daily chest · HOME `#btnSummons` · back to hub without stuck canvas.

- [x] Findings received
- [x] P0/P1 investigated on main
- [x] Fixes on this branch (if any)
- [x] Smoke: `smoke:summon` · `smoke:playtest-p1`

**Open P0/P1:** Cycle 2 P1 no skip/close — `#btnSummonSkip` during pull. P2 nested X-scroll — `.summon-rail` no longer a nested scroller.

## Cycle C — Gear / motion

`#gearScreen` · HOME `#btnGearHome` · 5 slots · doll/overlays · world-drop silhouettes + living motion.

- [x] Findings received
- [x] P0/P1 investigated on main
- [x] Fixes on this branch (if any)
- [x] Smoke: `smoke:gear` · `smoke:gear-screen` · `smoke:equip-look` · `smoke:gear-drops`

**Open P0/P1:** Cycle 3 P2 — detached orange Stip-pin near feet. **Fix:** pin kind on chest/shoulder (not back-cape); skip generic doll cape for pin/aura/hanger.

## Cycle D — Buildings

`#buildingsScreen` · HOME `#btnBuildings` · 5 factories (`stick_lighter` … `echo_whistle`) · collect vs upgrade · wallet chips · pixel life.

- [x] Findings received
- [x] P0/P1 investigated on main
- [x] Fixes on this branch (if any)
- [x] Smoke: `smoke:buildings` · `smoke:buildings-ui` · `smoke:buildings-powers` · `smoke:building-pixels`

**Open P0/P1:** Cycle 4 P2 — list «0/1 Vonken» vs Build 20 PC. **Fix:** unbuilt rows show build cost (PC), not hopper 0/cap.

## Cycle E — Seasons

`#seasonOverlay` · packs classic / jungle / halloween (+ winter/zomer if present) · safe zones vs pads · story beats · BGM switch.

- [ ] Findings received
- [ ] P0/P1 investigated on main
- [ ] Fixes on this branch (if any)
- [ ] Smoke: `smoke:seasons` · `smoke:season` · `smoke:season-art` · `smoke:audio-themes`

**Open P0/P1:** _(none yet)_

## Cycle F — Combat / FOMO / i18n

Adventure + Training feel · `#fomoRitual` (todayKey / streak / missions) · EN/DE/NL chrome (FR/ES if leak). Versus retired — do not re-test or restore.

- [x] Findings received
- [x] P0/P1 investigated on main
- [x] Fixes on this branch (if any)
- [x] Smoke: `smoke:training` · `smoke:adventure` · `smoke:fomo-pra` · `smoke:i18n-locale` · `smoke:i18n-switch` · `smoke:toast-queue` · `smoke:aim-tutorial`

**Open P0/P1:** Cycle 6 P1 — MASTER BUFF/WAVE banners at 31% covered the playfield; next-wave chips + pause ring sat on 390px strike pads. **Fix:** banners in a slim top strip (cap 26px on phones); skip redundant WAVE n/m banner on portrait; hint / pause ring / next-wave sit above `touchClusterTopY`. EN a11y: `#btnBuildings` aria stays locked to the visible title after lang-bar click (not only `setLang()`).

## Baseline smoke (2026-09-16, no findings yet)

Ran on this branch (docs-only, same `game.js` as `origin/main` v1.18.172 / SW 382). All green:

- A: `smoke:upgrades` · `smoke:menu` · `smoke:nav` · `smoke:p0p3-uiux` · `smoke:aim-indicator` · `smoke:unify-ui`
- B: `smoke:summon` · `smoke:playtest-p1`
- C: `smoke:gear` · `smoke:gear-screen` · `smoke:equip-look` · `smoke:gear-drops`
- D: `smoke:buildings` · `smoke:buildings-ui` · `smoke:buildings-powers` · `smoke:building-pixels`
- E: `smoke:seasons` · `smoke:season` · `smoke:season-art` · `smoke:audio-themes`
- F: `smoke:training` · `smoke:adventure` · `smoke:fomo-pra` · `smoke:i18n-locale` · `smoke:i18n-switch` · `smoke:toast-queue` · `smoke:aim-tutorial`
- Boot: `npm run check` · `npm run smoke` · `npm run check:critical`

Note (main, not a new bug): `smoke:buildings-powers` still prints `systems overlay skipped: Identifier 'BUILDINGS_SCHEMA' has already been declared` then `SMOKE_OK`. Live Pages `speel.html` / `game.js?v=382` is **v1.18.172**.

## Findings log

| When | Cycle | Pri | Title | Status |
|------|-------|-----|-------|--------|
| 2026-09-16 | A | P1 | Verse versie not visible — only hidden DOM/debug | fixed on branch |
| 2026-09-16 | A | — | HOME Upgrades 1-tap · Online save GESYNCHRONISEERD · no banner over logo | PASS |
| 2026-09-16 | B | — | Summons snappy | PASS |
| 2026-09-16 | B | P1 | No skip/close during pull | fixed on branch |
| 2026-09-16 | B | P2 | Nested horizontal scroll awkward | fixed on branch |
| 2026-09-16 | C | — | Uitrusting 5/5 · ready pose · idle bob | PASS |
| 2026-09-16 | C | P2 | Orange Stip-pin orphan near feet/right | fixed on branch |
| 2026-09-16 | D | — | HOME Fabrieken 1/5 · list→detail · unlocks | PASS |
| 2026-09-16 | D | P2 | List 0/1 Vonken vs Build 20 PC | fixed on branch |
| 2026-09-16 | F | P1 | Combat HUD / WAVE overlays + 390px strike-hint vs pads | fixed on branch |
| 2026-09-16 | F | P2 | EN HOME Fabrieken + Terug naar menu a11y leftovers | fixed on branch |

## Out of scope

- Versus / 2P-on-one-screen
- New systems, catalog ids, or content beyond a bugfix
- iOS / App Store / share-URL / tunnel / secrets
- Damage-formula retunes without a playtest packet
- Silent push to `origin/main` (user trigger **«merge main»**)
