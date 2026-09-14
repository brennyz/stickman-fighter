# Seasonal pixel overlays

Stickman-pixel **corner / rail / crest** props. Not buttons, not gear, not combat HUD.

**Contract (slot IDs):** [`docs/season-overlay-slots.md`](../../docs/season-overlay-slots.md)  
**Style:** [`ASSET-STYLE.md`](../../ASSET-STYLE.md) palettes (green / gold / purple / pumpkin). Chunky integer pixels, SVG, retina-safe.

## Packs

| Pack | Folder | Props |
|------|--------|-------|
| Jungle | `jungle/` | Vines, leaves, ferns, gold fruit |
| Halloween | `halloween/` | Cobwebs, bats, pumpkins, candles |

Each pack has the **same filenames** as the slot IDs: `corner-tl.svg`, `corner-tr.svg`, `rail-l.svg`, `rail-r.svg`, `corner-bl.svg`, `corner-br.svg`, `crest.svg`.

`_sheet.svg` is a labeled preview only (not wired in-game).

## Rules

- Small files, `shape-rendering="crispEdges"`.
- Transparent background — sit **behind / around** UI.
- Replace = overwrite the same path. No `v2` names.
- Regenerator: `python3 scripts/gen-season-pixel-art.py`
