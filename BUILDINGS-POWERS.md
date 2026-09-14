# Buildings — powers + timed resources

Lane **4 of 4** (mega-merge batch). Android-first. No Versus. **Do not merge to `main`** until Brendon says «merge main».

Binds **against systems PR #292** (`docs/BUILDINGS.md`, `src/data/buildings.js`). This PR does **not** fork a second catalog. When systems is in the bundle we call `buildingTickAll` / `buildingCollect` / `sanitizeBuildingSave` / `buildingPowerRank`. When it is not (this branch lands first), the same schema/ids/rates/8h cap run locally.

## Frozen ids (exact match #292)

| `id` | Display | Island | Resource | Combat apply (rank 0–4 @ Lv 1/3/5/7/9) |
|------|---------|--------|----------|----------------------------------------|
| `stick_lighter` | Stick-Lighter Factory | 1 | `spark` | crit +1…5% · DMG from rank 2 |
| `woodchip_glue` | Woodchip-Glue Factory | 2 | `glue` | shield/wave · incoming def from rank 2 |
| `chipping_wood` | Chipping-Wood Factory | 3 | `chip` | DMG +2…12% · speed from rank 2 |
| `bamboo_boesa` | Bamboo-Boesa Boiler | 4 | `steam` | +4…20 HP · adventure heal-between from rank 2 |
| `echo_whistle` | Echo-Whistle Mill | 5 | `echo` | energy ×1.04…1.16 · technique from rank 2 |

`buildingPowerRank = floor((lvl − 1) / 2)` → **−1** unbuilt, **0…4** at Lv 1/3/5/7/9. Max level **10**.

Aliases in: `bamboo_boesa_boiler` / `echo_whistle_mill`, kebab pixel names, old dojo/forge bag keys, wallet `embers`/`chips`/`echoes` → `spark`/`chip`/`echo`.

## Save (`BUILDINGS_SCHEMA = 1`)

```js
save.buildings = {
  schema: 1,
  factories: {
    stick_lighter: { level: 3, lastTickAt: 1710000000000, stored: 12 },
  },
  wallet: { spark: 4, glue: 0, chip: 0, steam: 0, echo: 0 },
};
```

No starter auto-Lv1 (systems: missing / Lv0 = unbuilt). Versus untouched.

Sanitize also accepts the previous powers bag `{ lastTickAt, byId: { id: { level, pending, stock } } }` and `{ levels, pending, stock }` — `pending` → hopper `stored`, `stock` → `wallet[resource]`.

## Accrual (systems rates, 8h cap)

Same curve as #292: start rate × `1.22^(level−1)`, rounded; hopper cap = **8 hours** × current rate.

| Building | Resource | Lv1 /h | Lv10 /h | Lv1 hopper cap |
|----------|----------|--------|---------|----------------|
| stick_lighter | spark | 8 | 48 | 64 |
| woodchip_glue | glue | 6 | 36 | 48 |
| chipping_wood | chip | 10 | 60 | 80 |
| bamboo_boesa | steam | 7 | 42 | 56 |
| echo_whistle | echo | 5 | 29 | 40 |

- **Online:** `maybeTickBuildings` → `buildingTickAll` when present, else local integer-unit tick (~1s).
- **Offline / tab hidden:** same helpers on boot + `visibilitychange`. Wall-clock clamp **8h**, then hopper cap.
- Clock rollback: `lastTickAt` snaps to now; no refund.
- **Collect:** `buildingCollect(id)` / `collectBuildingResource(id)` moves `floor(stored)` → `wallet[resourceId]`.

Combat apply: `applyBuildingPowersToPlayer` after pets. Caps: DMG ×1.12, crit +5%, HP +20, energy ×1.16, incoming def ≥0.92. Starter (if systems builds Lv1 lighter later) is +1% crit only.

## UI bind (HOME tile is another lane)

Prefer systems names when mega-merged:

- `BUILDING_IDS`, `buildingTooltipModel(id)`, `buildingWallet(res?)`, `buildingCanCollect(id)`
- `buildingTickAll`, `buildingCollect`, `buildingBuild`, `buildingUpgrade`

This PR still ships compat: `BUILDING_FACTORY_IDS`, `collectBuildingResource`, `tickBuildingResources`, `setBuildingLevel`, `buildingPowerBonus`, `applyBuildingPowersToPlayer`.

DOM: `#buildingsScreen` `#buildingsWallet` `[data-factory-id="stick_lighter"]`.

## Verify

```bash
npm run smoke:buildings-powers
```

Expect: `5 factories · #292 bag · spark/chip/echo · 8h cap · collect→wallet · powers`.

Manual: `setBuildingLevel('chipping_wood', 5)` then Training — small DMG bump; RabbitRobot still plays. Close the tab 10+ minutes, reopen, `save.buildings.factories.stick_lighter.stored` went up if built. Collect once — `wallet.spark` rises, hopper drops.

Not silent `main`. Sibling: systems **#292**, pixels **#289**. Mega-merge only.
