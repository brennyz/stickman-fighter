# assets/buildings — factory pixel icons

32×32 stickman-pixel SVGs (**art v2.2**, prop-first + one SMIL life loop each). **Locked ids = systems #292.**
No idle/active variants — `buildingArtSrc` exposes one `card` per id.
Motion: SMIL inside each SVG (Android `<img>`); CSS + `prefers-reduced-motion` for inline. See `BUILDING-PIXEL-MAP.md`.

| File | buildingId |
|------|------------|
| `stick_lighter.svg` | `stick_lighter` |
| `woodchip_glue.svg` | `woodchip_glue` |
| `chipping_wood.svg` | `chipping_wood` |
| `bamboo_boesa.svg` | `bamboo_boesa` |
| `echo_whistle.svg` | `echo_whistle` |
| `hub-buildings.svg` | `buildings` (HOME pixel) |

Draft aliases (`bamboo_boesa_boiler.svg`, `echo_whistle_mill.svg`, kebab-case) still exist so old probes do not 404.

HOME stroke: `assets/buttons/hub/buildings.svg`  
Per-factory stroke: `assets/buttons/modes/buildings-*.svg`

Wire map: [`../../BUILDING-PIXEL-MAP.md`](../../BUILDING-PIXEL-MAP.md)  
Regenerate: `npm run pixels:buildings`  
Preview: `preview.html` (not the player share URL).
