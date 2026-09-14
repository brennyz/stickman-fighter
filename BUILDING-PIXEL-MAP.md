# Building pixel ID map (locked)

Mega-merge **3 of 4** — art + wire only. Canonical ids match systems **#292**.

**Locked `buildingId` strings — quirky factories, not generic sawmill/forge:**

| buildingId | name | card | stroke (artHint) |
|------------|------|------|------------------|
| `stick_lighter` | Stick-Lighter Factory | `assets/buildings/stick_lighter.svg` | `assets/buttons/modes/buildings-stick-lighter.svg` |
| `woodchip_glue` | Woodchip-Glue Factory | `assets/buildings/woodchip_glue.svg` | `assets/buttons/modes/buildings-woodchip-glue.svg` |
| `chipping_wood` | Chipping-Wood Factory | `assets/buildings/chipping_wood.svg` | `assets/buttons/modes/buildings-chipping-wood.svg` |
| `bamboo_boesa_boiler` | Bamboo-Boesa Boiler | `assets/buildings/bamboo_boesa_boiler.svg` | `assets/buttons/modes/buildings-bamboo-boesa.svg` |
| `echo_whistle_mill` | Echo-Whistle Mill | `assets/buildings/echo_whistle_mill.svg` | `assets/buttons/modes/buildings-echo-whistle.svg` |

HOME tile: `buildings` → stroke `assets/buttons/hub/buildings.svg` · pixel `assets/buildings/hub-buildings.svg`

Preview: [assets/buildings/preview.html](assets/buildings/preview.html)

## Resolution

`resolveBuildingId(id)` accepts snake_case (locked), kebab-case, camelCase, and
a few leftover generic stubs from early partner drafts. **Return value is always
the locked snake_case id.**

```js
resolveBuildingId('stick_lighter')   // 'stick_lighter'
resolveBuildingId('stick-lighter')   // 'stick_lighter'
resolveBuildingId('stickLighter')    // 'stick_lighter'
buildingArtSrc('woodchip_glue')      // assets/buildings/woodchip_glue.svg
buildingArtSrc('chipping_wood', 'icon')
window.__sfBuildingArt.ids
```

Kebab-case SVG copies stay on disk so older probes do not 404.

## Compat only (not the locked names)

Early #290 / #291 stubs used generic ids. Those filenames still exist as
copies of the quirky art. Do **not** treat them as catalog names.

| leftover probe | → locked id |
|----------------|-------------|
| `forge` / `foundry` | `stick_lighter` |
| `dojo` / `sawmill` | `chipping_wood` |
| `tower` / `ranch` | `woodchip_glue` |
| `garden` | `bamboo_boesa_boiler` |
| `shrine` / `mill` | `echo_whistle_mill` |

## Files / size

- 32×32 crisp SVG cards (`shape-rendering=crispEdges`), typically &lt; 5 KB
- HOME + per-factory stroke icons are 24×24 ASSET-STYLE
- `npm run pixels:buildings` regenerates cards + preview

## Do not

- Implement loot / timers / HOME tile markup here (systems / powers / UI).
- Point the share URL at the preview — players stay on `speel.html`.
- Add Versus.
- Rename the locked ids to mill / forge / dojo / shrine.
