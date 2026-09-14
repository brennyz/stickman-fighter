# Building pixel ID map (provisional)

Mega-merge **3 of 4** — art + wire only. Systems agent
([Buildings systems 5 factories](https://cursor.com/agents/bc-16152ee1-411f-541c-99e2-023e8a891419))
had no merged catalog when this set shipped.

**Reuse these `buildingId` strings.** If systems ships a different key, either:

1. Use the same kebab-case id (preferred), or
2. Add an alias in `BUILDING_PIXEL_ALIASES` (`src/data/building-pixels.js`).

Resolution: `resolveBuildingId(id)` → camelCase / snake / `factory-` prefix stripped → alias table → catalog.

Preview: [assets/buildings/preview.html](assets/buildings/preview.html)

UI HOME tile (2 of 4) should point at `assets/buttons/hub/buildings.svg` (stroke, 24×24).
Card faces use the 32×32 pixel SVGs below.

## HOME tile

| buildingId | slot | file |
|------------|------|------|
| `buildings` | hub stroke | `assets/buttons/hub/buildings.svg` |
| `buildings` | hub pixel | `assets/buildings/hub-buildings.svg` |

Aliases: `factory`, `factories`, `fabrieken`.

## Factory cards

| buildingId | name | file | accent |
|------------|------|------|--------|
| `stick-lighter` | Stick-Lighter | `assets/buildings/stick-lighter.svg` | `#ffd75e` |
| `woodchip-glue` | Woodchip-Glue | `assets/buildings/woodchip-glue.svg` | `#d4e05a` |
| `chipping-wood` | Chipping-Wood | `assets/buildings/chipping-wood.svg` | `#7cf5ff` |
| `bamboo-boesa-boiler` | Bamboo-Boesa Boiler | `assets/buildings/bamboo-boesa-boiler.svg` | `#4ecf6a` |
| `echo-whistle-mill` | Echo-Whistle Mill | `assets/buildings/echo-whistle-mill.svg` | `#c792ff` |

### Aliases (systems / UI)

| alias | → buildingId |
|-------|----------------|
| `stickLighter`, `sticklighter`, `lighter` | `stick-lighter` |
| `woodchipGlue`, `glue`, `wood-chip-glue` | `woodchip-glue` |
| `chippingWood`, `woodchipper`, `sawmill` | `chipping-wood` |
| `bambooBoesaBoiler`, `boesa`, `bamboo-boiler` | `bamboo-boesa-boiler` |
| `echoWhistleMill`, `whistle-mill`, `echo-mill` | `echo-whistle-mill` |

Prefixes `factory-`, `bldg-`, `building-` are stripped automatically
(`factory-stick-lighter` → `stick-lighter`).

## JS API (bundled)

```js
resolveBuildingId('woodchipGlue')          // 'woodchip-glue'
buildingArtSrc('stick-lighter')            // card SVG
buildingArtSrc('buildings', 'stroke')      // HOME tile
buildingArtMeta('echo-whistle-mill').accent
window.__sfBuildingArt.src(id, 'card')
```

## Files / size

- 32×32 crisp SVG (`shape-rendering=crispEdges`, path-RLE), typically &lt; 3 KB
- HOME stroke is 24×24 ASSET-STYLE (gold factory + chimney)
- `npm run pixels:buildings` regenerates cards + preview

## Do not

- Implement loot / timers / HOME tile markup here (systems / powers / UI agents).
- Point the share URL at the preview — players stay on `speel.html`.
- Add Versus.
