# Season overlay — asset slots (pixel-art partner)

Stickman Fighter paints **thematic CSS layers on top of the original screens**.
This run ships **CSS + story/flavor only**. A separate pixel-art agent drops PNGs
into the slots below. Missing files are fine — CSS fallbacks stay visible.

Live play: https://brennyz.github.io/stickman-fighter/speel.html  
Code: `src/systems/seasons.js` · tokens: `styles/main.css` (`--season-*`)  
Preview without saving: `index.html?season=jungle` (also `halloween`, `winter`, `summer`, `classic`).

## Seasons (ids)

| id | Status | Flavor |
|----|--------|--------|
| `classic` | shipped | Original look — overlay hidden |
| `jungle` | shipped | Vines / canopy wash |
| `halloween` | shipped | Pumpkins / spooky wash |
| `winter` | hook (CSS) | Frost / snow-edge |
| `summer` | hook (CSS) | Heat haze / sun-edge |

Players pick a season in **Settings**. Preference persists on `save.season`.

**Do not** change combat, gear, Versus, or share-URL. Overlay is `pointer-events: none`.

## Folder + file names (stable)

```
assets/seasons/<season-id>/<slot>.png
```

Use **kebab-case**. Overwrite the same path — never `v2` in the filename.

### Slots (every season)

| Slot file | CSS hook | Suggested size | Placement / safe zone |
|-----------|----------|----------------|------------------------|
| `corner-tl.png` | `--season-art-corner-tl` · `.season-art-tl` | 256×256 (or 128×128) | Top-left, **outside** HUD. Keep subject in the outer 70%. Transparent center-right. |
| `corner-tr.png` | `--season-art-corner-tr` · `.season-art-tr` | 256×256 | Top-right. Leave a **clear disc** ~64 CSS-px for the pause button. |
| `corner-bl.png` | `--season-art-corner-bl` · `.season-art-bl` | 256×256 | Bottom-left. During play sits **above** the joystick band (`--season-safe-bottom`). |
| `corner-br.png` | `--season-art-corner-br` · `.season-art-br` | 256×256 | Bottom-right. Same play safe-band as BL (attack pads). |
| `banner.png` | `--season-art-banner` · `.season-art-banner` | 640×160 | Thin top strip under the status bar. Menu only-ish; hidden/shrunk in play. |
| `vignette.png` | `--season-art-vignette` · `.season-vignette` | 512×512 (tile-ok) | Soft full-bleed multiply. **Must stay translucent.** Center 50% should be empty/alpha. |
| `ground-trim.png` | `--season-art-ground-trim` · `.season-art-ground` | 720×96 | Bottom edge moss / frost / pumpkins. Play: stays above touch pads. |
| `motif.png` | `--season-art-motif` · `.season-art-motif` | 192×192 | Small repeating emblem (leaf, pumpkin, flake, sun). Low opacity. |

Optional later (hooks reserved, not wired): `audio-bed` is **not** an image — audio partner reads `getSeasonId()` / `window.__sf.season` / `AudioSys.seasonId`.

## Style (match ASSET-STYLE.md)

- Pixel-art, chunky, readable at ~80–140 CSS-px.
- Transparent background. No opaque full-screen plates.
- Palette follows season tokens (`--season-accent`, `--season-wash`).
- **No emoji**, no UI buttons, no text in the PNG (we localize flavor in JS).
- Android-first: test at 360×800 and 412×915. Corners must not cover tiles.

## How the game uses a slot

1. `applySeasonTheme()` sets `--season-art-<slot>: url("assets/seasons/<id>/<slot>.png")`.
2. CSS paints the URL as `background-image`. 404 = empty; CSS motifs remain.
3. Every season layer is `pointer-events: none !important` (decor never steals taps).

Do **not** add these PNGs to `sw.js` precache until they exist (404s in the install cache).
JS only sets `--season-art-*` urls when `SEASON_ART_PRESENT` lists the file — Android must not prefetch 404s.

## Audio hook (no tracks in this PR)

```js
getSeasonId()          // 'classic' | 'jungle' | 'halloween' | 'winter' | 'summer'
window.__sf.season     // same id after boot
AudioSys.seasonId      // mirrored string — pick beds later, do not ship full audio here
document 'sf-season'   // CustomEvent detail.id
```

## Out of scope

Drawing the PNGs · full seasonal audio · cosmetics/gear · Versus · changing island combat.
