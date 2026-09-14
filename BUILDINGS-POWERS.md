# Buildings — powers + timed resources

Lane **4 of 4** (mega-merge batch). Android-first. No Versus. **Do not merge to `main`** until Brendon says «merge main».

Keys the buildings **systems** bag (`save.buildings`, `BUILDINGS_SCHEMA = 1`) on the **locked factory ids**:

`stick_lighter` · `woodchip_glue` · `chipping_wood` · `bamboo_boesa` · `echo_whistle`

Kebab / longer pixel names (`stick-lighter`, `bamboo-boesa-boiler`, `echo-whistle-mill`) and the old dojo/forge labels alias in. If a systems catalog (`BUILDING_IDS` / `BUILDING_DEFS`) is already in the bundle, unknown ids still map by index.

## Five factories

| Id | Name | Combat / adventure power | Resource |
|----|------|--------------------------|----------|
| `stick_lighter` | Stick-Lighter | Lv1 +1% crit · Lv3 +2% · Lv5 +3% crit +2% DMG | **embers** |
| `woodchip_glue` | Woodchip-Glue | Lv1 +0.35s shield/wave · Lv3 +0.70s · Lv5 +1.00s and −4% incoming | **glue** |
| `chipping_wood` | Chipping-Wood | Lv1 +2% DMG · Lv3 +4% · Lv5 +6% DMG +2% speed | **chips** |
| `bamboo_boesa` | Bamboo-Boesa | Lv1 +4 HP · Lv3 +8 · Lv5 +12 HP +2% heal between adventure waves | **steam** |
| `echo_whistle` | Echo-Whistle | Lv1 +4% energy · Lv3 +8% · Lv5 +10% energy +4% technique | **echoes** |

First-time bag (no `save.buildings` yet): **`stick_lighter` starts at Lv1**, others Lv0. Existing systems levels are never overwritten. Power tiers stop at Lv5; resource rate still scales through Lv10.

Combat apply is the same shape as pets/styles (`applyBuildingPowersToPlayer` after pets). Caps: DMG ×1.12, crit +5%, HP +20, energy ×1.16, incoming def ≥0.92. Versus is not touched. Starter crit +1% is smaller than a style bonus.

## Accrual rates (real time)

`rate/hour = base + (level − 1) × step` when `level ≥ 1`, else `0`.

| Building | Resource | Base /h | Extra /h per level | Pending cap | Stock cap |
|----------|----------|---------|--------------------|-------------|-----------|
| stick_lighter | embers | 10 | +3 | 4 hours of current rate | 200 |
| woodchip_glue | glue | 8 | +3 | 4 hours | 160 |
| chipping_wood | chips | 12 | +4 | 4 hours | 240 |
| bamboo_boesa | steam | 16 | +5 | 4 hours | 320 |
| echo_whistle | echoes | 6 | +2 | 4 hours | 120 |

Examples: `chipping_wood` Lv1 = 12/h, pending cap 48. Lv5 = 28/h, pending cap 112.

- **Online:** `maybeTickBuildings` in the main loop (~1s), `Date.now()` (not fight `dt`).
- **Offline / tab hidden:** delta on boot + `visibilitychange` (show/hide). Wall-clock clamp **48h**, then pending cap still applies.
- Clock rollback: no refund; `lastTickAt` snaps to now.
- **Collect:** `collectBuildingResource(id)` / `collectAllBuildingResources()` moves `floor(pending)` → `stock` (stock cap). Remainder stays in pending.

## Save bag

```json
{
  "buildings": {
    "schema": 1,
    "lastTickAt": 1720000000000,
    "byId": {
      "stick_lighter": { "level": 1, "pending": 3.25, "stock": 12, "lastCollectAt": 1720000100000 }
    }
  }
}
```

Also accepts systems-shaped `{ levels, pending, stock }` and flat `{ stick_lighter: { lv: 2 } }`. Sanitize never throws. Unknown ids / `__proto__` stripped.

## UI bind (HOME tile lane)

Stable:

- `BUILDING_FACTORY_IDS`, `buildingCatalogIds()`, `buildingState(id)`, `buildingsHudModel()`
- `buildingTooltipModel(id)`, `collectBuildingResource(id)`, `collectAllBuildingResources()`
- `tickBuildingResources(nowMs)`, `setBuildingLevel(id, lv)` (systems / tests)
- `buildingPowerBonus()`, `applyBuildingPowersToPlayer(game, player)`

DOM convention: `[data-building-id="stick_lighter"]`. This PR does **not** add a HOME tile (that is the UI lane).

## Verify

```bash
npm run smoke:buildings-powers
```

Expect: `5 factories · starter stick_lighter Lv1 · offline delta · caps · collect · powers`.

Manual: `setBuildingLevel('chipping_wood', 5)` in a console, start Training — small DMG bump; RabbitRobot still plays. Close the tab 10+ minutes, reopen, `buildingState('stick_lighter').pending` went up. Collect once — stock rises, pending drops.

Not silent `main`.
