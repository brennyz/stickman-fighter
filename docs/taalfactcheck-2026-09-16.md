# Taalfactcheck 2026-09-16 — alle picker-talen (post-#283)

Audit van `main` na mega-merge / #283. Volgorde **Z→A**: **nl → fr → es → en → de**.

`SUPPORTED_LANGS` = `nl`, `en`, `de`, `fr`, `es`.

`t()` op main: **actieve taal → EN → NL** (comment + code in `src/i18n/i18n.js`). Geen Dutch-leak meer naar FR/ES/DE bij ontbrekende keys. `i18nList` zelfde volgorde.

Versus: **niet gefixt** (alleen genoteerd).

## Samenvatting per locale

| Locale | Chrome vs EN | Duidelijke bugs (deze PR) | Resterend |
|--------|--------------|---------------------------|-----------|
| **nl** | Broncatalogus | `help.title` was EN; landing hardcoded NL (OK als default) | index.html first-paint NL tot `applyLang` |
| **fr** | Overlay + i18n.js | FOMO EN-stubs; fabrieksblurbs EN; wapennamen EN via #283-overlay; settings `playLink*` / mastery ontbrak | Catalogus-diepte (gear-items, some ui.*) valt terug op EN |
| **es** | Overlay + i18n.js | Zelfde als FR + `Música off` / `Todo off` | Zelfde EN-fallback voor diepe catalogus |
| **en** | Volledigste catalogus | Geen Dutch leftovers in CATALOG_EN chrome | Versus first-minute copy in `missions.js` is NL (niet aangeraakt) |
| **de** | Chrome + `CATALOG_DE_CHROME` | FOMO EN-stubs; fabrieksnamen/blurbs EN | Diepe catalogus deels EN-fallback (bewust na #283) |

## Findings (Z→A)

| locale | key / locatie | probleem | severity | suggested fix / status |
|--------|---------------|----------|----------|------------------------|
| nl | `help.title` (`i18n.js`) | EN stub `Tips & controls` in NL-helpkop | P2 | **Gefixt** → `Tips & besturing` |
| nl | `index.html` first-paint | Splash/hub HTML is NL tot `applyLang` / `syncTitleGateCopy` | P3 | Geen rewrite; `t()` overschrijft na boot. Documenteer. |
| nl | `speel.html` | Landing was 100% hardcoded NL; `#stepsIos` ontbrak → iOS `TypeError` | P0 | **Gefixt**: `SPEEL_I18N` nl+en+de+fr+es + `#stepsIos` + null-guard |
| nl | `privacy.html` | Alleen NL + korte EN | P2 | **Deels**: korte DE/FR/ES-blokken toegevoegd |
| fr | `fomo.*` (`i18n.js`) | Hele FOMO-sheet EN (`Today`, `Open summons`, …) | P1 | **Gefixt** FR + overlay |
| fr | `buildings.*.blurb` / namen | EN leftover (`A lopsided woodshed…`, `Stick-Lighter Factory`) | P1 | **Gefixt** FR namen + blurbs |
| fr | `weapon.*` overlay (`catalog-locales.js`) | #283 overlay zette EN namen (`Fists`, `Ninja sword`, `Energy blade`) over FR | P1 | **Gefixt** → Poings / Épée ninja / Lame d’énergie |
| fr | `settings.playLinkOk` e.d. | Keys ontbraken → EN fallback | P2 | **Gefixt** |
| fr | `gear.*` chrome | Ontbrak in i18n.js → EN `Loadout` | P2 | **Gefixt** |
| fr | `ui.continueLastMode` / `ui.gearHead` | Ontbrak in overlay → EN | P2 | **Gefixt** |
| fr | `result.advLose` | `DÉFAITE...` vs overlay `DÉFAITE` | P3 | **Gefixt** chrome ellipsis |
| fr | `pickup.energy` overlay | `ENERGY` EN | P3 | **Gefixt** → `ÉNERGIE` |
| fr | diepe `ui.*` / `hud.*` / gear-itemnamen | Coverage via EN-fallback (bewust) | P3 | Later vullen; geen architectuur |
| es | `fomo.*` | Zelfde EN-stubs als FR | P1 | **Gefixt** ES + overlay |
| es | `buildings.*` | Zelfde EN factory leftovers | P1 | **Gefixt** |
| es | `weapon.*` overlay | EN namen (`Fists`, `Club`, `Void claw`) | P1 | **Gefixt** → Puños / Garrote / Garra del vacío |
| es | `settings.playLink*` / mastery | Ontbrak → EN | P2 | **Gefixt** |
| es | `gear.*` chrome | Ontbrak → EN | P2 | **Gefixt** |
| es | `audio.musicOff` / `pause.audioMuteAll` | `Música off` / `Todo off` | P2 | **Gefixt** → apagada / apagado |
| es | `result.advLose` | `DERROTA...` | P3 | **Gefixt** |
| es | diepe catalogus | EN-fallback | P3 | Zelfde als FR |
| en | `CATALOG_EN` chrome | Geen Dutch leftovers gevonden (charBig5Hint / Spiraal Orb al gepoetst in #283) | — | Geen actie |
| en | `index.html` first-paint | Korte NL-flash voor EN-spelers tot boot | P3 | Zie nl |
| de | `fomo.*` | EN-stubs (`Today`, `Play adventure`) | P1 | **Gefixt** DE + overlay + `CATALOG_DE_CHROME` |
| de | `buildings.*` | EN factory namen/blurbs | P1 | **Gefixt** |
| de | `gear.*` chrome | Ontbrak in i18n.js (ui.gearHead zat al in DE chrome) | P2 | **Gefixt** slot-labels |
| de | `pickup.energy` / `shield` | `ENERGY` / `SHIELD` | P3 | **Gefixt** → ENERGIE / SCHILD |
| de | diepe catalogus | EN-fallback | P3 | OK na #283 |
| * | Versus `missions.js` first-minute | Hardcoded NL (`Eerste minuut: P1…`) — mixed als locale ≠ NL | P2 | **Niet gefixt** (Versus freeze) |
| * | Versus toast | `toast.versusRetired` wél in NL/EN/DE/FR/ES overlays | — | Geen actie |
| * | `t()` fallback | actief → EN → NL | — | Bevestigd, geen wijziging |

## Wat deze PR wijzigt

1. `docs/taalfactcheck-2026-09-16.md` — deze tabel.
2. `speel.html` — landing-i18n (nl/en/de/fr/es), `#stepsIos` terug, null-guard (geen `getElementById('stepsIos').classList.remove` literal — Android-first smokes blijven groen).
3. `privacy.html` — korte DE/FR/ES-samenvatting naast NL+EN.
4. `src/i18n/i18n.js` — FOMO, fabrieken, gear-chrome, FR/ES settings, NL help-titel, ES audio.
5. `src/i18n/catalog-locales.js` — FR/ES wapens + FOMO + continue/gear keys; DE FOMO overlay.
6. `src/i18n/catalog.js` — FR/ES wapennamen in basiscatalogus (overlay wint alsnog).
7. `src/i18n/catalog-de.js` — FOMO + pickup polish.
8. Smoke: `scripts/smoke-i18n-locale.mjs` extra asserts.

Versie: **v1.18.168 / SW 378**. Versus ongemoeid. Geen stille push naar `main`.

## Resterende gaten (niet in deze PR)

- Diepe `ui.*` / `hud.*` / gear-itemnamen in FR/ES: vallen terug op EN (beter dan NL).
- `index.html` first-paint blijft NL tot JS boot (P3).
- Versus first-minute strings in `missions.js` blijven NL-hardcoded.
- Arcade-smaak `insert coin` / skill-namen (`Spiral Orb`) bewust EN in alle talen.
