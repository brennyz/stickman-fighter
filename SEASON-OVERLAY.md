# Season overlay — CSS + story (pixel-art slots)

Thematic layers **on top of** the original Stickman screens. No Versus, no gear, no combat changes.

Live: https://brennyz.github.io/stickman-fighter/speel.html

Partner agents:

| Agent | Owns |
|-------|------|
| **This system** | Season IDs, CSS tokens, overlay DOM, settings + persist, flavor i18n, `data-season` / audio hook |
| **Pixel-art agent** | PNGs in `assets/seasons/<id>/<slot>.png` — drop files, uncomment `--season-art-*` in `styles/seasons.css` |
| **Audio agent** | Read `html[data-season-audio]` / `currentSeasonId()` / `sf-season-change` — do not invent IDs |

---

## Player-facing

**Opties → Seizoen**

- `Auto` — local calendar (see windows below)
- `Klassiek` / Jungle / Halloween / Winter / Zomer
- Preference is `save.seasonPref` (same save as language / Lite FX)

Classic = original screen (overlay hidden). Other seasons add a wash + corner decorations. Taps go through.

---

## Safety (do not break play)

- Overlay is a **direct `<body>` child**, never inside `.screen`
- Entire overlay: `pointer-events: none !important`
- `z-index: 22` — above `.screen` (20), below toasts (40) and pause (50)
- Reserved safe zones (CSS tokens): top / pause-right / combat-bottom / left
- During `body.is-playing` vignette is weaker and all four corners sit outside pause + combat pads
- On menu/settings, bottom corners stay hidden so pumpkins/vines never cover toggles or HOME
- No `display:none !important` on `.screen`, no canvas z-index fights

See `SCREEN-VISIBILITY-FUNNEL.md` layer **D2**.

---

## Season IDs (stable — do not rename)

| ID | Status | Calendar (local, first match) |
|----|--------|-------------------------------|
| `classic` | full | default outside other windows |
| `jungle` | full CSS | 15 Apr – 31 May |
| `halloween` | full CSS | 15 Oct – 5 Nov |
| `winter` | hook | 1 Dec – 6 Jan |
| `summer` | hook | 21 Jun – 20 Aug |

Aliases: `default` → `classic`. Pref `auto` resolves via calendar.

---

## Art slots (pixel-art agent)

Folder per season. **Overwrite the same path.** No version in the filename.

```
assets/seasons/<seasonId>/
  vignette.png     full-bleed wash, keep lots of alpha
  motif.png        tile 32×32 or 64×64, sparse
  corner-tl.png    128–256px, transparent, sits in TOP-LEFT safe corner
  corner-tr.png    same — leave pause button clear (top-right ~72px)
  corner-bl.png    same — ABOVE combat pads (~128px from bottom)
  corner-br.png    same
  banner.png       optional flavor strip (wired as --season-art-banner)
```

DOM hooks (already in `index.html`):

```html
<div data-season-slot="vignette">
<div data-season-slot="motif">
<div data-season-slot="corner-tl">
…
```

CSS variables on `html[data-season="<id>"]` in `styles/seasons.css`:

```
--season-art-vignette
--season-art-motif
--season-art-corner-tl
--season-art-corner-tr
--season-art-corner-bl
--season-art-corner-br
--season-art-banner
```

Until a PNG exists, leave the `url(...)` lines **commented**. CSS fallbacks (vines, pumpkins, frost, sun) keep the mood without 404s.

Style: follow `ASSET-STYLE.md` tokens. No emoji. Pixel art may be chunkier than menu SVG.

After adding PNGs: uncomment the matching `--season-art-*` lines, add files to `sw.js` ASSETS if they must be first-load, bump `SW_CACHE_REV`.

---

## Audio hook

```js
currentSeasonId()           // 'classic' | 'jungle' | …
document.documentElement.dataset.season
document.documentElement.dataset.seasonAudio
document.addEventListener('sf-season-change', (e) => e.detail)
// e.detail = { id, pref, calendarId, slots, ids }
AudioSys.seasonId()         // same as currentSeasonId
window.__sf.season          // snapshot + setPref
```

Do not block on missing stems. Classic = current menu/battle mix.

---

## Code map

| File | Role |
|------|------|
| `src/systems/seasons.js` | IDs, calendar, persist, apply, settings chips |
| `styles/seasons.css` | tokens, overlay, fallbacks |
| `src/core/storage.js` | `save.seasonPref` |
| `src/i18n/i18n.js` | `season.*` keys (nl/en/de/fr/es) |
| `index.html` | `#seasonOverlay`, settings card, menu blurb |

Out of scope: drawing PNGs, synth, cosmetics, Versus.
