# Buildings — powers + timed resources

Lane continues **#290** (mega-merge batch). Android-first. No Versus. **Do not merge to `main`** until Brendon says «merge main».

Full rank table, combat identities, and 8h daily rates: **[`docs/BUILDINGS-POWERS.md`](docs/BUILDINGS-POWERS.md)**.

Binds **against systems #292** (`docs/BUILDINGS.md`, `src/data/buildings.js`). Tick / collect prefer `buildingTickAll` / `buildingCollect`. Local fallback stays if this lane lands first.

## Frozen ids

| `id` | Resource | Identity (ranks 0–4 @ Lv 1/3/5/7/9) |
|------|----------|-------------------------------------|
| `stick_lighter` | `spark` | Ember / crit +2…10% — no DMG mul |
| `woodchip_glue` | `glue` | Sticky armor + wave shield · incoming from rank 2 |
| `chipping_wood` | `chip` | Splinter / DMG ×1.04…1.18 · speed from rank 2 |
| `bamboo_boesa` | `steam` | Steam survive +6…36 HP · heal-between from rank 2 |
| `echo_whistle` | `echo` | Taunt / energy ×1.06…1.24 · technique from rank 2 |

`buildingPowerRank = floor((lvl − 1) / 2)`. Max level **10**. Caps: DMG ×1.18, crit +10%, HP +36, energy ×1.24, incoming ≥0.88.

## Timed 2.0

#292 rates unchanged (Lv1 8/6/10/7/5 per hour, 8h hopper). Wall-clock online + offline. Collect zeros hopper first + re-entry lock (no double-pay). Fractional `stored` keeps short-session progress; collect still floors.

Lv5 8h hopper: spark 144 · glue 104 · chip 176 · steam 128 · echo 88 — about two mid-game upgrades. Worth opening daily.

## Verify

```bash
npm run smoke:buildings-powers
```

Share URL stays `speel.html`. Not silent `main`.
