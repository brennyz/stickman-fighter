# Building pixel ID map (locked = #292)

Mega-merge **3 of 4** — art + wire only. Canonical ids **exact-match** systems **#292**.

**Art v2.1** (prop-first silhouettes, shared ink `#0a0c14` + lifted walls `#5a6788`). One card per id — the wire map has no idle/active slot, so there are **no state variants**.

## Motion (factory life)

Brendon asked for more realism via motion. Life is **inside the card/stroke SVGs** so it still runs when the file is an `<img>` on Android Chrome / TWA. **SMIL** (`<animate>` / `<animateTransform>`) is the Chrome-`<img>` path; CSS `@keyframes` + `prefers-reduced-motion` cover inline/object embeds. No JS, no filters, no extra files, no new `buildingId`s.

| id | life | how |
|----|------|-----|
| `stick_lighter` | chimney / flame flicker + match-tip + fuel-window flash | `steps(2)` opacity, ~1.1s |
| `woodchip_glue` | vat glow pulse + drip + hopper chip twinkle | glow ease 2.4s; drip `steps(2)` |
| `chipping_wood` | chipper spin hint + flying chips | 8-step 360° on teeth only, 3.2s |
| `bamboo_boesa` | steam fade + boiler highlight pulse | steam `steps(3)`; glow ease |
| `echo_whistle` | mill paddle wiggle + staggered echo rings | ±14° `steps(2)`; ring opacity |
| HOME hub pixel | tiny flame flicker + vat glint + ring pulse | same classes, fewer pixels |
| strokes | matching accent-only flicker / drip / spin / steam / toot | one cheap loop each |

Android-safe choices: one or two groups per icon, `steps()` so we do not interpolate pixels, no `filter`/`blur`/`will-change`. `@media (prefers-reduced-motion: reduce)` turns animations off — the still silhouette stays.

Still frames (`_preview/*-192.png`) flatten the life layers so print/sheet shots stay readable.

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
