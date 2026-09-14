# Seasonal pixel overlays

Stickman-pixel props for **overlay slots**. Live CSS is `#277` `styles/seasons.css` plus pack urls in `styles/season-overlays.css`.

Coordinator pack (flat files for `--season-art-*` / `data-season-slot`):

```
assets/seasons/
  season-jungle-corner-tl.png … corner-tr/bl/br.png  (96×96)
  season-jungle-banner.png                           (≤320×64)
  season-halloween-corner-tl.png … corner-tr/bl/br.png
  season-halloween-banner.png
```

Folder packs (same slots + vignette / ground-trim / motif):

| Pack | Folder | Props |
|------|--------|-------|
| Jungle | `jungle/` | Vines, leaves, ferns, gold fruit |
| Halloween | `halloween/` | Cobwebs, bats, pumpkins, candles |

Slot files: `corner-tl` · `corner-tr` · `corner-bl` · `corner-br` · `banner` · `vignette` · `ground-trim` · `motif`

Each folder slot ships `.png` plus `.svg` source. Extra `rail-*` / `crest` SVGs are leftovers for sheets only.

Regenerate: `python3 scripts/gen-season-pixel-art.py`

Preview: `preview.html`

Winter/summer stay hooks. Overlay stays `pointer-events: none`.
