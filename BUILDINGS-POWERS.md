# Buildings — powers + timed resources

Lane **4 of 4** (mega-merge batch). Android-first. No Versus. **Do not merge to `main`** until Brendon says «merge main».

Hooks the buildings **systems** bag (`save.buildings`, `BUILDINGS_SCHEMA = 1`). If the systems catalog (`BUILDING_IDS` / `BUILDING_DEFS`) is already in the bundle, we bind those ids via alias + index. Otherwise we ship the fallback five factories so this PR is playable and testable alone.

## Five factories

| Id | Name | Combat / adventure power | Resource |
|----|------|--------------------------|----------|
| `dojo` | Dojo | Lv1 +2% DMG · Lv3 +4% · Lv5 +6% DMG +2% speed | **focus** |
| `forge` | Forge | Lv1 +1% crit · Lv3 +2% · Lv5 +3% crit +2% DMG | **scrap** |
| `garden` | Garden | Lv1 +4 HP · Lv3 +8 · Lv5 +12 HP +2% heal between adventure waves | **rations** |
| `tower` | Tower | Lv1 +0.35s shield/wave · Lv3 +0.70s · Lv5 +1.00s and −4% incoming (`defMul` 0.96) | **watch** |
| `shrine` | Shrine | Lv1 +4% energy · Lv3 +8% · Lv5 +10% energy +4% technique | **spirit** |

First-time bag (no `save.buildings` yet): **dojo starts at Lv1**, others Lv0. Existing systems levels are never overwritten. Power tiers stop at Lv5; resource rate still scales through Lv10.

Combat apply is the same shape as pets/styles (`applyBuildingPowersToPlayer` after pets). Caps: DMG ×1.12, crit +5%, HP +20, energy ×1.16, incoming def ≥0.92. Versus is not touched.

## Accrual rates (real time)

`rate/hour = base + (level − 1) × step` when `level ≥ 1`, else `0`.

| Building | Resource | Base /h | Extra /h per level | Pending cap | Stock cap |
|----------|----------|---------|--------------------|-------------|-----------|
| dojo | focus | 12 | +4 | 4 hours of current rate | 240 |
| forge | scrap | 10 | +3 | 4 hours | 200 |
| garden | rations | 16 | +5 | 4 hours | 320 |
| tower | watch | 8 | +3 | 4 hours | 160 |
| shrine | spirit | 6 | +2 | 4 hours | 120 |

Examples: dojo Lv1 = 12/h, pending cap 48. Dojo Lv5 = 28/h, pending cap 112.

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
      "dojo": { "level": 1, "pending": 3.25, "stock": 12, "lastCollectAt": 1720000100000 }
    }
  }
}
```

Also accepts systems-shaped `{ levels, pending, stock }` and flat `{ dojo: { lv: 2 } }`. Sanitize never throws. Unknown ids / `__proto__` stripped.

## UI bind (HOME tile lane)

Stable:

- `BUILDING_FACTORY_IDS`, `buildingCatalogIds()`, `buildingState(id)`, `buildingsHudModel()`
- `buildingTooltipModel(id)`, `collectBuildingResource(id)`, `collectAllBuildingResources()`
- `tickBuildingResources(nowMs)`, `setBuildingLevel(id, lv)` (systems / tests)
- `buildingPowerBonus()`, `applyBuildingPowersToPlayer(game, player)`

DOM convention for the UI lane: `[data-building-id="dojo"]` + collect control. This PR does **not** add a HOME tile (that is the UI lane).

## Verify

```bash
npm run smoke:buildings-powers
```

Expect: `5 factories · starter dojo Lv1 · offline delta · caps · collect · powers`.

Manual: set `save.buildings.byId.forge.level = 5` in a console, start Training — crit/dmg bump is small; RabbitRobot still plays. Close the tab 10+ minutes, reopen, `buildingState('dojo').pending` went up. Collect once — stock rises, pending drops.

Not silent `main`.
