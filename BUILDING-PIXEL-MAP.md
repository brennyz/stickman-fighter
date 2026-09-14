# Building pixel ID map (locked = #292)

Mega-merge **3 of 4** — art + wire only. Canonical ids **exact-match** systems **#292**.

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
