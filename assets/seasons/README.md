# Seasonal pixel overlays

Stickman-pixel props for **overlay slots**. Live CSS owner is `#277` `styles/seasons.css` (nested urls). `styles/season-overlays.css` is a shim only.

Canon pack (nested — wire `--season-art-*` here):

```
assets/seasons/<seasonId>/
  corner-tl.png … corner-tr/bl/br.png
  banner.png  vignette.png  ground-trim.png  motif.png
```

Deprecated leftovers (do not wire): `season-jungle-corner-*.png` / `season-halloween-*.png` at this folder root.

Folder packs (same slots + vignette / ground-trim / motif):

| Pack | Folder | Props |
|------|--------|-------|
| Jungle | `jungle/` | Vines, leaves, ferns, gold fruit |
| Halloween | `halloween/` | Cobwebs, bats, pumpkins, candles |

Slot files: `corner-tl` · `corner-tr` · `corner-bl` · `corner-br` · `banner` · `vignette` · `ground-trim` · `motif`

Each folder slot ships `.png` plus `.svg` source. Extra `rail-*` / `crest` SVGs are leftovers for sheets only.

Regenerate: `python3 scripts/gen-season-pixel-art.py`

Preview: `preview.html`

Winter/summer have **full CSS fallbacks** (frost / sun) in `styles/seasons.css`. PNG folders stay empty until the pixel-art agent drops files — do not uncomment `--season-art-*` until those exist.

Overlay stays `pointer-events: none`.
