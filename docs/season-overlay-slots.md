# Season overlay slots — art contract

**Aligned with CSS/story PR** [`docs/SEASON-ASSET-SLOTS.md`](https://github.com/brennyz/stickman-fighter/blob/cursor/season-overlays-09c7/docs/SEASON-ASSET-SLOTS.md) (#279).

**Art bot owns:** pixel files under `assets/seasons/{pack}/`.  
**CSS/story bot owns:** calendar, picker, flavor copy — **do not rename these slots**.  
**Out of scope:** gear-equip art, FOMO, Versus.

Live play URL stays [`speel.html`](https://brennyz.github.io/stickman-fighter/speel.html).

## Tokens

| Token | Pack folder | When it applies |
|-------|-------------|-----------------|
| `jungle` | `assets/seasons/jungle/` | `?season=jungle` or `save.seasonPref` / calendar |
| `halloween` | `assets/seasons/halloween/` | 15 Oct – 5 Nov, or `?season=halloween` |
| `winter` | `assets/seasons/winter/` | 1 Dec – 6 Jan — **CSS fallbacks until PNGs land** |
| `summer` | `assets/seasons/summer/` | 21 Jun – 20 Aug — **CSS fallbacks until PNGs land** |
| `classic` | — | overlay off (`?season=none` / `classic`) |

`document.body.dataset.season` and `html[data-season]` are the switch.

## Slot IDs (stable — match #279)

Host: `#seasonOverlay` (not a `.screen`; `aria-hidden`; **`pointer-events: none`**).

| `data-season-slot` | CSS class | CSS variable | File | Safe zone |
|--------------------|-----------|--------------|------|-----------|
| `corner-tl` | `.season-art-tl` | `--season-art-corner-tl` | `corner-tl.png` | Top-left bezel |
| `corner-tr` | `.season-art-tr` | `--season-art-corner-tr` | `corner-tr.png` | Top-right; **clear disc for pause** |
| `corner-bl` | `.season-art-bl` | `--season-art-corner-bl` | `corner-bl.png` | Above `--season-safe-bottom` (joystick band) |
| `corner-br` | `.season-art-br` | `--season-art-corner-br` | `corner-br.png` | Above attack-pad band |
| `banner` | `.season-art-banner` | `--season-art-banner` | `banner.png` | Thin top strip; hidden on short phones |
| `vignette` | `.season-vignette` | `--season-art-vignette` | `vignette.png` | Translucent corners only |
| `ground-trim` | `.season-art-ground` | `--season-art-ground-trim` | `ground-trim.png` | Bottom moss/pumpkins **above** dock/pads |
| `motif` | `.season-art-motif` | `--season-art-motif` | `motif.png` | Small emblem, low opacity |

SVG sources sit next to each PNG (same stem). Regenerator writes both.

`window.__sfSeasonArtPresent` lists shipped files so #279 can set `--season-art-*` without 404s.

## Safety

1. Host and every slot: `pointer-events: none`.
2. During `body.is-playing`: overlay **stays visible**. Safe-zone tokens keep corners off pause + combat pads. Vignette is weaker.
3. Menu/settings/hub: hide BL/BR + ground-trim on `#seasonOverlay` so HOME/toggles stay clear.
4. `--season-safe-bottom` keeps ground/BL/BR off Android pads.
5. `image-rendering: pixelated` + nested PNGs under `assets/seasons/<id>/`.
6. Overlay show/hide is owned by `styles/seasons.css`. Flat `season-*-corner-*.png` paths are deprecated.

## Preview / QA

- `assets/seasons/preview.html`
- `index.html?season=jungle` · `index.html?season=halloween`
- `python3 scripts/gen-season-pixel-art.py`
- `npm run smoke:season`
