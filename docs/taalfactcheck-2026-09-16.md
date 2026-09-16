# Taalfactcheck 2026-09-16 — alle picker-talen (post-#283)

Audit van `main` na mega-merge / #283. Volgorde **Z→A**: **nl → fr → es → en → de**.

`SUPPORTED_LANGS` = `nl`, `en`, `de`, `fr`, `es`.

`t()` op main: **actieve taal → EN → NL** (comment + code in `src/i18n/i18n.js`). Geen Dutch-leak meer naar FR/ES/DE bij ontbrekende keys. `i18nList` zelfde volgorde.

Versus: **niet gefixt** (alleen genoteerd).

## Main-spotcheck (follow-up, zelfde PR)

Op `origin/main` (40e5ccc) staan deze P1’s nog. Op deze branch:

| # | Spotcheck | main | deze PR |
|---|-----------|------|---------|
| 1 | DE/FR/ES `buildings.*` namen+blurbs Engels | ja | **Gefixt** (NL-stijl lokale namen) |
| 2 | DE/FR/ES `fomo.*` helemaal Engels | ja | **Gefixt** |
| 3 | DE `titleGreet` Hi / `pause.sfx` Sound / `pressStart` insert coin / `hub.skillsSub` EN | ja | **Gefixt** Hallo / Ton / Münze einwerfen / Energie-Spezials |
| 4 | EN `result.advLose` = VERLOREN | ja (`i18n.js` + `CATALOG_EN`) | **Gefixt** → `YOU LOSE` (banner.lost ook). NL blijft VERLOREN. Geen DEFEATED (ambigu na loot). |
| 5 | `speel.html` 100% hardcoded NL | ja | **Gefixt** (`SPEEL_I18N` 5 talen) |
| 6 | FR/ES `install.title` = `App` | ja | **Gefixt** Ajouter comme app / Añadir como app (DE: Als App speichern) |

## Samenvatting per locale

| Locale | Chrome vs EN | Duidelijke bugs (deze PR) | Resterend |
|--------|--------------|---------------------------|-----------|
| **nl** | Broncatalogus | `help.title` was EN; landing hardcoded NL (OK als default) | index.html first-paint NL tot `applyLang` |
| **fr** | Overlay + i18n.js | FOMO EN; fabrieken EN; wapens EN via overlay; playLink/gear; dexBiome NL-leak | Diepe catalogus valt terug op EN |
| **es** | Overlay + i18n.js | Zelfde als FR + `Música off` / `Todo off` | Zelfde EN-fallback |
| **en** | Volledigste catalogus | dexBiome NL-leak; `result.advLose` was VERLOREN | Versus first-minute in `missions.js` blijft NL |
| **de** | Chrome + `CATALOG_DE_CHROME` | FOMO/fabrieken EN; Hi/Sound/insert coin; dexBiome | Diepe catalogus deels EN-fallback |

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
| en | `result.advLose` / `banner.lost` | Dutch `VERLOREN` in EN chrome + `CATALOG_EN` | P0 | **Gefixt** → `YOU LOSE` |
| en | `ui.dexBiome.wild/crypt/scrap/frost` | Ontbrak → `tOr` viel terug op NL `Woud/Crypte/Schroot/Vorst` | P1 | **Gefixt** Woods/Crypt/Scrap/Frost |
| en | `CATALOG_EN` chrome | Geen andere Dutch leftovers (charBig5Hint / Spiraal Orb al gepoetst in #283) | — | Geen actie |
| en | `index.html` first-paint | Korte NL-flash voor EN-spelers tot boot | P3 | Zie nl |
| de | `menu.titleGreet` | `Hi, {name}` | P2 | **Gefixt** → `Hallo, {name}` |
| de | `pause.sfx` | `Sound` | P2 | **Gefixt** → `Ton` |
| de | `menu.pressStart` | `insert coin` | P3 | **Gefixt** → `Münze einwerfen` |
| de | `hub.skillsSub` | EN `Energy specials · …` | P2 | **Gefixt** → `Energie-Spezials · …` |
| de | `install.title` | kort `App` | P3 | **Gefixt** → `Als App speichern` |
| fr | `install.title` | kort `App` | P2 | **Gefixt** → `Ajouter comme app` |
| es | `install.title` | kort `App` | P2 | **Gefixt** → `Añadir como app` |
| de | `ui.dexBiome.wild` e.d. | Filterchips `Woud/Crypte/Schroot/Vorst` (NL-fallback) | P1 | **Gefixt** Wald/Krypta/Schrott/Frost |
| fr | `ui.dexBiome.*` | Zelfde NL-fallback | P1 | **Gefixt** Bois/Crypte/Ferraille/Givre |
| es | `ui.dexBiome.*` | Zelfde NL-fallback | P1 | **Gefixt** Bosque/Cripta/Chatarra/Escarcha |
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

Versie: **v1.18.169 / SW 379**. Versus ongemoeid. Geen stille push naar `main`.

## Resterende gaten (niet in deze PR)

- Diepe `ui.*` / `hud.*` / gear-itemnamen in FR/ES: vallen terug op EN (beter dan NL).
- `index.html` first-paint blijft NL tot JS boot (P3).
- Versus first-minute strings in `missions.js` blijven NL-hardcoded.
- Arcade-smaak `insert coin` / skill-namen (`Spiral Orb`) bewust EN in alle talen.
