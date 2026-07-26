# assets/buttons — menu & chrome iconen

**Leidend document:** [`../../ASSET-STYLE.md`](../../ASSET-STYLE.md)

## Mappen

| Pad | Inhoud |
|-----|--------|
| `hub/` | Hoofdmenu: adventure, arcade, versus, collect, continue |
| `modes/` | Mode-rijen: training, wall, mats, weapons, pets, style, skills, upgrades, dex |
| `chrome/` | Dock, home, settings, pause, save, gamble, claim, … |

## Regels

- Alleen **SVG**, `viewBox="0 0 24 24"`, stroke-first, geen emoji.
- Bestandsnaam = rol (`adventure.svg`), overschrijven bij update.
- Wire-in: `<img src="assets/buttons/…">` in `index.html`.

## Status

| Set | Status |
|-----|--------|
| **hub** | Live |
| **modes** | Live |
| **chrome** | Live (dock + home + **back/pause/swap** + settings + gamble + claim) |
| **ui/** (saga/ach/island/lock/check) | Live |

Harden: SW precache alle `assets/buttons/**/*.svg` + `assets/ui/*.svg`, CSS sizes/HC, `hardenButtonIcons()` error-class.

Preview: `node scripts/render-button-previews.mjs` → `assets/buttons/_preview/`.
