# Building pixel ID map (locked = #292)

Mega-merge **3 of 4** — art + wire only. Canonical ids **exact-match** systems **#292**.

**Art v2.2** (prop-first silhouettes, shared ink `#0a0c14` + lifted walls `#5a6788`). One card per id — the wire map has no idle/active slot, so there are **no state variants**.

## Motion (factory life)

Owner lock: **one tiny loop per factory**, low amplitude, **1.2–2.5s**, pause-friendly (first keyframe = rest). Life is **inside the card/stroke SVGs** so it still runs when the file is an `<img>` on Android Chrome / TWA. **SMIL** (`<animate>` / `<animateTransform>`) is the Chrome-`<img>` path; CSS `@keyframes` + `prefers-reduced-motion` cover inline/object embeds. No JS, no filters, no extra files, no new `buildingId`s. Silhouette stays readable if animations are ignored.

| id | life (one loop) | how |
|----|-----------------|-----|
| `stick_lighter` | flame **tip** opacity + 1px drop (not the whole building) | `flicker` 1.4s `steps(2)` · 1 → .62 |
| `woodchip_glue` | vat highlight **shimmer** (drip stays still) | `glow` 2.2s ease · 1 → .62 |
| `chipping_wood` | **one tooth** bite-tick on the log face | `tick` 1.6s translate −1px |
| `bamboo_boesa` | copper boiler glow + optional chimney puff on the **same** pulse | `glow` 2.2s ease · 1 → .62 |
| `echo_whistle` | echo **rings** opacity (no mill spin — cheaper) | `echo` 2.2s ease · .88 → .4 |
| HOME hub pixel | **one shared** micro-pulse on skyline accents (flame tip, vat hi, ring) | `pulse` 2.4s ease · 1 → .74 |
| strokes | matching accent-only loop (same class / timing) | one group each |

Android-safe: one `<g>` per icon, `steps()` or low-amp ease, no `filter`/`blur`/`will-change`. `@media (prefers-reduced-motion: reduce)` turns CSS off; SMIL still starts at the rest frame.

Still frames (`_preview/*-192.png`) flatten life layers. `_preview/life-sheet.png` is rest \| mid so the moving pixels are obvious.

**Locked `buildingId` strings:**

| buildingId | name | card | stroke (`artHint.iconFile`) |
|------------|------|------|------------------------------|
| `stick_lighter` | Stick-Lighter Factory | `assets/buildings/stick_lighter.svg` | `assets/buttons/modes/buildings-stick-lighter.svg` |
| `woodchip_glue` | Woodchip-Glue Factory | `assets/buildings/woodchip_glue.svg` | `assets/buttons/modes/buildings-woodchip-glue.svg` |
| `chipping_wood` | Chipping-Wood Factory | `assets/buildings/chipping_wood.svg` | `assets/buttons/modes/buildings-chipping-wood.svg` |
| `bamboo_boesa` | Bamboo-Boesa Boiler | `assets/buildings/bamboo_boesa.svg` | `assets/buttons/modes/buildings-bamboo-boesa.svg` |
| `echo_whistle` | Echo-Whistle Mill | `assets/buildings/echo_whistle.svg` | `assets/buttons/modes/buildings-echo-whistle.svg` |

HOME tile: `buildings` → stroke `assets/buttons/hub/buildings.svg` · pixel `assets/buildings/hub-buildings.svg`

Preview: [assets/buildings/preview.html](assets/buildings/preview.html)

## Resolution

`resolveBuildingId` always returns a locked id.

```js
resolveBuildingId('bamboo_boesa')          // 'bamboo_boesa'
resolveBuildingId('bamboo_boesa_boiler')   // 'bamboo_boesa'  (draft alias)
resolveBuildingId('echo_whistle_mill')     // 'echo_whistle'
buildingArtSrc('echo_whistle')             // assets/buildings/echo_whistle.svg
window.__sfBuildingArt.ids
```

## Compat only (not catalog names)

| leftover probe | → locked id |
|----------------|-------------|
| `bamboo_boesa_boiler` | `bamboo_boesa` |
| `echo_whistle_mill` | `echo_whistle` |
| kebab / camelCase of the locked ids | same locked id |
| `forge` / `foundry` | `stick_lighter` |
| `dojo` / `sawmill` | `chipping_wood` |
| `tower` / `ranch` | `woodchip_glue` |
| `garden` | `bamboo_boesa` |
| `shrine` / `mill` | `echo_whistle` |

Do **not** treat mill / forge / dojo / shrine as catalog names.

## Do not

- Merge to main (mega-merge batch).
- Point the share URL at the preview — players stay on `speel.html`.
- Add Versus.
