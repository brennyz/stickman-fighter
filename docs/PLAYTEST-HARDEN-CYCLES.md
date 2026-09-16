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

- [ ] Findings received
- [ ] P0/P1 investigated on main
- [ ] Fixes on this branch (if any)
- [ ] Smoke: `smoke:upgrades` · `smoke:menu` · `smoke:nav` · `smoke:p0p3-uiux` · `smoke:aim-indicator` · `smoke:unify-ui`

**Open P0/P1:** _(none yet)_

## Cycle B — Summons

`#summonScreen` · daily chest · HOME `#btnSummons` · back to hub without stuck canvas.

- [ ] Findings received
- [ ] P0/P1 investigated on main
- [ ] Fixes on this branch (if any)
- [ ] Smoke: `smoke:summon` · `smoke:playtest-p1`

**Open P0/P1:** _(none yet)_

## Cycle C — Gear / motion

`#gearScreen` · HOME `#btnGearHome` · 5 slots · doll/overlays · world-drop silhouettes + living motion.

- [ ] Findings received
- [ ] P0/P1 investigated on main
- [ ] Fixes on this branch (if any)
- [ ] Smoke: `smoke:gear` · `smoke:gear-screen` · `smoke:equip-look` · `smoke:gear-drops`

**Open P0/P1:** _(none yet)_

## Cycle D — Buildings

`#buildingsScreen` · HOME `#btnBuildings` · 5 factories (`stick_lighter` … `echo_whistle`) · collect vs upgrade · wallet chips · pixel life.

- [ ] Findings received
- [ ] P0/P1 investigated on main
- [ ] Fixes on this branch (if any)
- [ ] Smoke: `smoke:buildings` · `smoke:buildings-ui` · `smoke:buildings-powers` · `smoke:building-pixels`

**Open P0/P1:** _(none yet)_

## Cycle E — Seasons

`#seasonOverlay` · packs classic / jungle / halloween (+ winter/zomer if present) · safe zones vs pads · story beats · BGM switch.

- [ ] Findings received
- [ ] P0/P1 investigated on main
- [ ] Fixes on this branch (if any)
- [ ] Smoke: `smoke:seasons` · `smoke:season` · `smoke:season-art` · `smoke:audio-themes`

**Open P0/P1:** _(none yet)_

## Cycle F — Combat / FOMO / i18n

Adventure + Training feel · `#fomoRitual` (todayKey / streak / missions) · EN/DE/NL chrome (FR/ES if leak). Versus retired — do not re-test or restore.

- [ ] Findings received
- [ ] P0/P1 investigated on main
- [ ] Fixes on this branch (if any)
- [ ] Smoke: `smoke:training` · `smoke:adventure` · `smoke:fomo-pra` · `smoke:i18n-locale` · `smoke:i18n-switch` · `smoke:toast-queue` · `smoke:aim-tutorial`

**Open P0/P1:** _(none yet)_

## Findings log

| When | Cycle | Pri | Title | Status |
|------|-------|-----|-------|--------|
| — | — | — | Waiting for playtest follow-ups | parked |

## Out of scope

- Versus / 2P-on-one-screen
- New systems, catalog ids, or content beyond a bugfix
- iOS / App Store / share-URL / tunnel / secrets
- Damage-formula retunes without a playtest packet
- Silent push to `origin/main` (user trigger **«merge main»**)
