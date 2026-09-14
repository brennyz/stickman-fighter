# Season overlay slots — contract (art + CSS pair)

**Art bot owns:** pixel packs under `assets/seasons/{pack}/` and wiring those files onto the slots below.  
**CSS/story bot owns:** season calendar copy, extra tokens, motion — **do not rename these IDs**.  
**Out of scope here:** gear-equip art, FOMO, Versus.

Live play URL stays [`speel.html`](https://brennyz.github.io/stickman-fighter/speel.html).

## Tokens

| Token | Pack folder | When it applies |
|-------|-------------|-----------------|
| `jungle` | `assets/seasons/jungle/` | `?season=jungle` or `localStorage.sfSeason=jungle` |
| `halloween` | `assets/seasons/halloween/` | October 1 – November 2, or `?season=halloween` |

`document.body.dataset.season` is the switch. `?season=none` forces off.

## Slot IDs (stable)

Host: `#seasonOverlay` (not a `.screen`; `aria-hidden`; **`pointer-events: none`**).

| DOM `id` | `data-season-slot` | CSS variable | File (per pack) | Safe zone |
|----------|--------------------|--------------|-----------------|-----------|
| `seasonSlotCornerTL` | `corner-tl` | `--season-art-corner-tl` | `corner-tl.svg` | Top-left bezel; beside title, never over tiles |
| `seasonSlotCornerTR` | `corner-tr` | `--season-art-corner-tr` | `corner-tr.svg` | Top-right bezel |
| `seasonSlotRailL` | `rail-l` | `--season-art-rail-l` | `rail-l.svg` | Left edge; **hidden below 560px** (Android) |
| `seasonSlotRailR` | `rail-r` | `--season-art-rail-r` | `rail-r.svg` | Right edge; **hidden below 560px** |
| `seasonSlotCornerBL` | `corner-bl` | `--season-art-corner-bl` | `corner-bl.svg` | Bottom-left corner hug; behind dock |
| `seasonSlotCornerBR` | `corner-br` | `--season-art-corner-br` | `corner-br.svg` | Bottom-right corner hug; behind dock |
| `seasonSlotCrest` | `crest` | `--season-art-crest` | `crest.svg` | Tiny top-center watermark; low opacity |

## Safety (must keep)

1. Host and every slot: `pointer-events: none` — never steal taps.
2. Hidden during `body.is-playing` (combat HUD / pads stay clean).
3. Visible only on `#menuScreen.active` or `#modeHubScreen.active`.
4. Art stays in corners / thin rails — **not** on hub tiles, dock, lang bar, pause, or title text.
5. `z-index` 21 = above `.screen` paint, below pause (50) / toasts / splash.
6. `image-rendering: pixelated` + even CSS sizes (64 / 72) for retina.

## Preview

- Pack sheets: `assets/seasons/jungle/_sheet.svg`, `assets/seasons/halloween/_sheet.svg`
- Interactive mock: `assets/seasons/preview.html`
- In-game QA: `index.html?season=jungle` and `index.html?season=halloween`

Regenerate art: `python3 scripts/gen-season-pixel-art.py`
