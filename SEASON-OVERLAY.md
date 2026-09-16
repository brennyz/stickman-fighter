# Season overlay — CSS + story (pixel-art slots)

Thematic layers **on top of** the original Stickman screens. No Versus, no gear, no combat changes.

Live: https://brennyz.github.io/stickman-fighter/speel.html

Partner agents:

| Agent | Owns |
|-------|------|
| **This system (story + CSS)** | Season IDs, CSS tokens, overlay DOM, settings + persist, flavor i18n, story beats, `data-season` / audio hook, season-swap fade, **overlay show/hide** |
| **Pixel-art agent** | PNGs in `assets/seasons/<id>/<slot>.png` — drop files, uncomment `--season-art-*` in `styles/seasons.css` |
| **Audio agent** | Read `html[data-season-audio]` / `currentSeasonId()` / `sf-season-change` — do not invent IDs |

---

## One CSS owner

`styles/seasons.css` owns overlay **visibility**, safe zones, tokens, and `--season-art-*`.

`styles/season-overlays.css` is a **shim** (pointer-events + pixelated hint). It must **not** hide `#seasonOverlay` during play and must **not** set competing art URLs.

Canon art paths (nested only):

```
assets/seasons/<seasonId>/<slot>.png
```

Deprecated: flat `assets/seasons/season-<id>-corner-*.png`. Do not wire those in CSS.

---

## Player-facing

**Opties → Seizoen**

- `Auto` — local calendar (see windows below)
- `Klassiek` / Jungle / Halloween / Winter / Zomer
- Preference is `save.seasonPref` (same save as language / Lite FX)
- QA: `?season=winter` (or jungle / halloween / summer / classic) — preview only, not saved. A settings chip pick drops the query.

Classic = original screen (overlay hidden). Other seasons add a wash + corner decorations + short flavor. Taps go through.

Story beats (text only, `pointer-events: none`) sit on hub, island-select, and result. Menu keeps the existing blurb.

---

## Safety (do not break play)

- Overlay is a **direct `<body>` child**, never inside `.screen`
- Entire overlay: `pointer-events: none !important`
- `z-index: 22` — above `.screen` (20), below toasts (40) and pause (50)
- Reserved safe zones (CSS tokens): top / pause-right / combat-bottom / left
- **During play the overlay stays visible.** Vignette is weaker; corners sit outside pause + combat pads via `--season-safe-*`
- On menu/settings/hub, **BL/BR + ground-trim hide** so pumpkins/vines/frost never cover toggles or HOME
- Season swap fades overlay opacity only — never a full-screen flash, never blocks input
- No `display:none !important` on `.screen`, no `display:none !important` that kills `#seasonOverlay` during play, no canvas z-index fights

See `SCREEN-VISIBILITY-FUNNEL.md` layer **D2**.

---

## Season IDs (stable — do not rename)

| ID | Status | Calendar (local, first match) |
|----|--------|-------------------------------|
| `classic` | full | default outside other windows |
| `jungle` | full CSS + nested PNGs | 15 Apr – 31 May |
| `halloween` | full CSS + nested PNGs | 15 Oct – 5 Nov |
| `winter` | full CSS (PNG slots commented) | 1 Dec – 6 Jan |
| `summer` | full CSS (PNG slots commented) | 21 Jun – 20 Aug |

Aliases: `default` → `classic`. Pref `auto` resolves via calendar.

Winter / summer use CSS fallbacks (frost, icicles, snow wash / sun, heat haze, warm wash) until the pixel-art agent drops files. Do **not** invent new season IDs.

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
  ground-trim.png  optional bottom moss/frost (wired as --season-art-ground-trim)
```

Jungle/halloween nested files are wired in `styles/seasons.css`. Winter/summer `--season-art-*` lines stay **commented** until those PNGs exist.

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
--season-art-ground-trim
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
// e.detail = { id, pref, calendarId, slots, ids, beats, query }
AudioSys.seasonId()         // same as currentSeasonId
window.__sf.season          // snapshot + setPref
```

Do not block on missing stems. Classic = current menu/battle mix.

---

## Code map

| File | Role |
|------|------|
| `src/systems/seasons.js` | IDs, calendar, persist, apply, settings chips, story beats, swap class |
| `styles/seasons.css` | **Owner:** tokens, nested art urls, overlay show/hide, fallbacks, screen wash |
| `styles/season-overlays.css` | Shim only — no competing hide/art rules |
| `src/ui/season-overlay.js` | art-present map (nested paths); defers `data-season` to seasons.js |
| `src/core/storage.js` | `save.seasonPref` |
| `src/i18n/i18n.js` | `season.*` + `season.beat.*` keys (nl/en/de/fr/es) |
| `index.html` | `#seasonOverlay`, settings card, menu blurb, hub/level/result beats |

Out of scope: drawing PNGs, synth, cosmetics, Versus.
