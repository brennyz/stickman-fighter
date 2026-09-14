# Seasonal pixel overlays

Stickman-pixel props for **overlay slots only**. Contract: [`docs/season-overlay-slots.md`](../../docs/season-overlay-slots.md) (aligned with CSS pair `#279`).

## Packs

| Pack | Folder | Props |
|------|--------|-------|
| Jungle | `jungle/` | Vines, leaves, ferns, gold fruit |
| Halloween | `halloween/` | Cobwebs, bats, pumpkins, candles |

## Slot files (every pack)

`corner-tl` · `corner-tr` · `corner-bl` · `corner-br` · `banner` · `vignette` · `ground-trim` · `motif`

Each slot ships `.png` (what CSS/JS `#279` loads) plus `.svg` source. Extra `rail-*` / `crest` SVGs are leftovers for sheets only.

Regenerate: `python3 scripts/gen-season-pixel-art.py`

Preview: `preview.html`
