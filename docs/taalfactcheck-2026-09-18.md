# Taalfactcheck 2026-09-18 — LANGUAGE worker (layout-safe)

Post-mega-merge (`v1.18.172`) audit, Z→A: **nl → fr → es → en → de**. Versus ongemoeid.

`t()` blijft **actief → EN → NL**. Ontbrekende keys zonder catalogusregel vielen via `tOr(..., 'Nederlands')` terug op Dutch factory-copy.

## P1 — gefixt

| locale | key / locatie | probleem | fix |
|--------|---------------|----------|-----|
| * | `buildings.desc.*` / `islandFallback` / `lockedWorldNamed` / `costPc` | Alleen NL-fallbacks in `buildings.js` → EN/DE/FR/ES-kaarten toonden *Maakt … na unlock* | Keys in `i18n.js` voor nl/en/de/fr/es, kort voor 360px |
| * | factory `name` op list-cards | Lange namen (`Stock-Anzünder-Fabrik`, `Houtsnipper-Lijm Fabriek`) overlap/wrap op Android | `nameShort` + 2-line clamp; detail houdt volle naam |
| nl | FOMO catalog seed | Overlay `Naar summons` overschreef `Naar oproepen` | Terug naar oproepen / kist |
| de | FOMO chrome+overlay | `Zu Summons` overschreef `Zu Beschwörungen` | Korte Android-CTA `Zu Kisten` |
| fr/es | FOMO | `Vers les summons` / `A summons` | `Vers le coffre` / `Al cofre` |
| de/fr/es | HUD overlay | `KICK`/`PUNCH` overschreef gelokaliseerde chrome | TRITT/SCHLAG · PIED/POING · PATADA/PUÑO |
| de | `audio.sfxOff` / pause | leftover `Sound` | `Ton` |
| de/fr | `buildings.upgrade` | leftover `Upgrade` | Aufwerten / Améliorer |

## P2 — gefixt

| locale | key | fix |
|--------|-----|-----|
| fr/es | `ui.summonHead` ontbrak → EN Summons | Coffres / Cofres (+ korte pull/goto) |
| fr/es | gear chrome (pick/lock/filter) | Korte Android-strings |
| de | `saveSync: save OK` | Save ok |
| fr | bamboo-blurb `qui vapeur` | `qui étuve` |
| de/fr/es | `trainStyleUnlock` Energy glow | lokale wording |
| de overlay | `waveFunnel` “down”, `starBest` “best” | weg / Rekord |
| * | settings export ` · gear n` / ` · fabriek` | `ui.saveHealthGear` / `Factory` per locale |

## Bewust niet

- Versus first-minute / char-sort (`Sort: naam`) — Versus freeze.
- Arcade `insert coin` / skill-namen (`Spiral Orb`) blijven merk-EN.
- Diepe FR/ES itemnamen blijven EN-fallback (beter dan NL).
- `speel.html` SPEEL_I18N 5 talen — geen wijziging (al dekken).

## Android layout

- Factory list: `nameShort` + `-webkit-line-clamp: 2`.
- FOMO CTA: `white-space: normal` (geen clip op DE/FR).
- HUD telegraphs ingekort (geen KICK-over-HUD).

## Examiner P0 — pets + gear (zelfde draft)

| locale | key / locatie | probleem | fix |
|--------|---------------|----------|-----|
| en | `CATALOG_EN.gear` 2× | Tweede `gear:` veegde lock-keys weg → NL *Nog niet gevonden* | Eén gear-object |
| de/fr/es | `gear.lock*` / filter chrome | Alleen NL+EN → lock-regels in EN | Korte DE/FR/ES keys |
| fr/es | `ui.pet*` / `ui.egg*` | Overlay `ui` miste pet/egg → EN fallback | Overlay-keys + korte tip |
| * | `PET_ROSTER.perk` / `EGG_ROSTER.name` | Hardcoded NL in alle talen | `pets.perk.*` + `egg.name.*` / `egg.perk.*` |
| * | pets right-column `{n} kills` | EN leftover | `ui.petKillsLeft` |
| de | `gear.weaponAsideHint` | Te lang op ~390px | `Sammlung · kein 6. Slot` |
| nl | `ui.petCoinTip` / `pets.sub` / egg hint | Overflow op 390px | Ingekort + card/toast clamp |

## Examiner P0 — HUD + settings + style/season (zelfde draft)

| locale | key / locatie | probleem | fix |
|--------|---------------|----------|-----|
| fr/es | HOME `menu.summons` | Tile bleef EN *Summons* | Coffres / Cofres |
| fr/es | `ui.summonQuota` / empty | Overlay miste keys → EN *Today … summons* | coffres / cofres |
| de | `summonQuota` / `summonNoMore` | *Random-Summons* / *Keine Summons* | Kisten |
| de | HUD `kickTele` / `fighter.block` | leftover *block* / *BLOCK* | blocken / ABWEHR |
| * | settings import preview | `Preview:` + NL *Import 2×* + NL warnings | `ui.importPreview` + kind-keys |
| * | `persistOrToast('wapen'/'stijl')` | Dutch context in elke taal | `persistContextLabel` + `toast.persistCtx*` |
| de/es/nl | toast sync | leftover *Sync* | Abgleich / Copia / Online-save |
| * | style cards / season blurbs | Lange tooltip/blurb overlap 390px | 2–3 line clamp + kortere hint |

## Examiner P0 — factories + gear lock + DE buttons (zelfde draft)

| locale | key / locatie | probleem | fix |
|--------|---------------|----------|-----|
| * | `buildings.power.*.label/blurb` | Lookup `.label` miste → EN catalog *Spark Kindle* | 25 powers × 5 talen, korte labels |
| de/fr/nl | `desc.produceLocked` | leftover *Unlock* / *build* / *unlock* | frei / construire / vrij |
| fr/es | `toast.gearLocked` | Overlay miste key → EN *Still locked* | Encore verrouillé / Aún bloqueado |
| de | factory `nameShort` | Stock-Anzünder / Holzhäcksler overflow | Anzünder / Häcksler / Boesa / Pfeife |
| * | hub tiles / gear cards | DE compounds op 390px | 2-line clamp + ellipsis |

## Examiner P0 — style tips + result consistency (zelfde draft)

| locale | key / locatie | probleem | fix |
|--------|---------------|----------|-----|
| de/fr/es | `style.*` name/bonus/tooltip | leftover *Leaf-Bandana* / *energy* / *knockback* / *Void-Wanderer* / *Techniques* | Blatt-Bandana · Bandana feuille · Pañuelo hoja; Energie/énergie/energía; Rückstoß/recul/retroceso; Leerenwanderer |
| * | `result.advLose` / `trainLose` / `banner.lost` | FR/ES `DÉFAITE...` vs overlay `DÉFAITE`; FR `ROBOT GAGNE` vs `LE ROBOT GAGNE` | Zelfde titel in i18n + catalog + overlay; geen trailing dots |
| nl/fr/es | `result.advLoseKeep` | leftover *loot* / *run* | buit/ronde · butin/partie · botín/partida |
| * | `showResult` / `game.js` | Dutch `tOr` fallback *XP en loot van deze run* | `t('result.advLoseKeep')` |
| * | `toast.resultHiccup` | hardcoded NL bij result-fout | 5-talen key |
| nl | `STYLES` seed | *Unlock op Lv* / *Leaf bandana* / *Void-waker* | Vrij vanaf Lv · Blad-bandana · Leegte-loper |

Season beats waren al gelokaliseerd (DE Dschungel, ES Jungla). *Auto* / *Arcade* blijven merk-labels.

## Hardcoded Dutch audit (buiten nl-catalogs)

Grep `src/` zonder i18n: result-zichtbare fallbacks zijn weg. Residual (niet deze pass):

- `sfReportError(..., '… hiccup — speel door')` in `game.js` / `loop.js` — alleen bij crash-toast
- `missions.js` daily `label: 'Avontuur'` — fallback achter `t()`
- `scenery.js` `lab('menu.adventure', 'Avontuur')` — `t()` eerst
- veel `tOr(key, '… mislukt')` last-resort als de key bestaat niet

Versus ongemoeid. Arcade skill-namen blijven merk-EN.

## Examiner P0 — mission labels + errT + hiccups (zelfde draft)

| locale | key / locatie | probleem | fix |
|--------|---------------|----------|-----|
| * | `DAILY_PLAY_TARGETS.label` | Dead Dutch *Avontuur/Muur* | Alleen `mode`; UI via `dailyModeLabel` → `modes.*` |
| * | `dailyText` / `dailyHint` | Fallback naar NL `DAILY_DEFS` / `DAILY_PLAY_HINTS` | Leeg als catalog-key ontbreekt (`t()` doet EN→NL) |
| * | `modeFirstMinuteLine` + scenery `lab()` | Dutch hardcoded fallback | Geen NL last-resort |
| * | `tOr(..., '… mislukt')` / `safeUiAction` | Dutch last-resort in elke taal | `errT` + `toast.errRetry` / `ui.err*` (EN last-resort) |
| * | `sfReportError` hiccups | User-toast *Speler hiccup — speel door* | `toast.fightHiccup` / `toast.hiccupContinue` |

Technische `sfReportError(where, err)` zonder userMsg blijft console + gelokaliseerde default-toast.

Versie: **v1.18.178 / SW 388**. Draft PR, geen main-merge. Deel-URL `speel.html`.
