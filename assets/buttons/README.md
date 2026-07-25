# assets/buttons — menu & chrome iconen

**Leidend document:** [`../../ASSET-STYLE.md`](../../ASSET-STYLE.md)

## Mappen

| Pad | Inhoud |
|-----|--------|
| `hub/` | Hoofdmenu tegels: adventure, arcade, versus, collect |
| `modes/` | Mode-rijen: training, wall, mats, weapons, pets, style, skills, upgrades, dex |
| `chrome/` | Navigatie & acties: home, back, claim, bonus, pause, settings |

## Regels

- **Hub:** pixel-fill SVG, `viewBox="0 0 48 48"`, `COUNTRY_PAL` / scène-idee per tegel (`ASSET-STYLE.md`).
- **Chrome / dock:** stroke-first, `viewBox="0 0 24 24"`, geen emoji.
- Bestandsnaam = rol (`adventure.svg`), overschrijven bij update.
- Wire-in: vervang inline SVG in `index.html`; CSS `image-rendering: pixelated`.

## Status

- `hub/adventure.svg` — pixel countryside (eerste ship-test)
- Overige hub/modes/chrome — nog inline tot batch gevraagd
