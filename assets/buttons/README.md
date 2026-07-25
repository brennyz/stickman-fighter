# assets/buttons — menu & chrome iconen

**Leidend document:** [`../../ASSET-STYLE.md`](../../ASSET-STYLE.md)

## Mappen

| Pad | Inhoud |
|-----|--------|
| `hub/` | Hoofdmenu tegels: adventure, arcade, versus, collect (+ continue) |
| `modes/` | Mode-rijen: training, wall, mats, weapons, pets, style, skills, upgrades, dex |
| `chrome/` | Navigatie & acties: home, back, claim, bonus, pause, settings |

## Regels

- Alleen **SVG**, `viewBox="0 0 24 24"`, stroke-first, geen emoji.
- Bestandsnaam = rol (`adventure.svg`), overschrijven bij update.
- Wire-in: vervang inline SVG in `index.html` (zie ASSET-STYLE inventaris).

## Status

| Set | Status |
|-----|--------|
| **hub** | Live — `adventure`, `arcade`, `versus`, `collect`, `continue` |
| modes | Nog niet — volgende batch |
| chrome | Nog niet — dock (muziek/missies/opties/tips/verse) na modes |

Volgorde voor afmaken: **hub → chrome (startscherm-dock) → modes** · daarna harden-pass.
