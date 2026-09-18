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

## Bewust niet

- Versus first-minute / char-sort (`Sort: naam`) — Versus freeze.
- Arcade `insert coin` / skill-namen (`Spiral Orb`) blijven merk-EN.
- Diepe FR/ES itemnamen blijven EN-fallback (beter dan NL).
- `speel.html` SPEEL_I18N 5 talen — geen wijziging (al dekken).

## Android layout

- Factory list: `nameShort` + `-webkit-line-clamp: 2`.
- FOMO CTA: `white-space: normal` (geen clip op DE/FR).
- HUD telegraphs ingekort (geen KICK-over-HUD).

Versie: **v1.18.173 / SW 383**. Draft PR, geen main-merge. Deel-URL `speel.html`.
