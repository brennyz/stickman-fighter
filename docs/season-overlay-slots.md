# Season overlay slots — art contract

**Aligned with CSS/story PR** [`docs/SEASON-ASSET-SLOTS.md`](https://github.com/brennyz/stickman-fighter/blob/cursor/season-overlays-09c7/docs/SEASON-ASSET-SLOTS.md) (#279).

**Art bot owns:** pixel files under `assets/seasons/{pack}/`.  
**CSS/story bot owns:** calendar, picker, flavor copy — **do not rename these slots**.  
**Out of scope:** gear-equip art, FOMO, Versus.

Live play URL stays [`speel.html`](https://brennyz.github.io/stickman-fighter/speel.html).

## Tokens

| Token | Pack folder | When it applies |
|-------|-------------|-----------------|
| `jungle` | `assets/seasons/jungle/` | `?season=jungle` or `localStorage.sfSeason=jungle` |
| `halloween` | `assets/seasons/halloween/` | October 1 – November 2, or `?season=halloween` |
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
2. Hidden during `body.is-playing`.
3. Visible only on `#menuScreen.active` or `#modeHubScreen.active`.
4. `--season-safe-bottom` (≥168px) keeps ground/BL/BR off Android pads and the meta dock.
5. `image-rendering: pixelated` + 4× PNG (retina-safe chunky scale).

## Preview / QA

- `assets/seasons/preview.html`
- `index.html?season=jungle` · `index.html?season=halloween`
- `python3 scripts/gen-season-pixel-art.py`
- `npm run smoke:season`
