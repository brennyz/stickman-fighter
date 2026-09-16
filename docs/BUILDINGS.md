# Buildings API — locked bind (partners)

**This PR owns:** catalog, `BUILDINGS_SCHEMA=1` save, island unlock, upgrade, timed tick/collect/cap, power *rank*.  
**Not this PR:** pixels, full UI, combat apply, Versus, merge to `main`.

Share URL stays `speel.html`. Android-first. Mega-merge batch only.

Module: `src/data/buildings.js` → `npm run build` → `game.js`.

---

## Frozen catalog (exactly five)

Do **not** ship sawmill / forge / neonlab / shrine / reactor.

| `id` | Display name | Island | Resource |
|---|---|---|---|
| `stick_lighter` | Stick-Lighter Factory | 1 | `spark` |
| `woodchip_glue` | Woodchip-Glue Factory | 2 | `glue` |
| `chipping_wood` | Chipping-Wood Factory | 3 | `chip` |
| `bamboo_boesa` | Bamboo-Boesa Boiler | 4 | `steam` |
| `echo_whistle` | Echo-Whistle Mill | 5 | `echo` |

Max level **10**. Level `0` / missing = not built.

`buildingPowerRank = floor((lvl - 1) / 2)` → ranks **0…4** at Lv 1/3/5/7/9 (unbuilt = `-1`).

---

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

| Field | Meaning |
|---|---|
| `factories[id].level` | 0..10 |
| `factories[id].lastTickAt` | epoch ms |
| `factories[id].stored` | hopper, capped at that level’s cap |
| `wallet[res]` | collected resource, cap `99999` |

Sanitize migrates the previous draft shape (`buildingRes`, flat `buildings.<id>`, aliases `bamboo_boesa_boiler` / `echo_whistle_mill` / `ember_sticks`…). Unknown ids stripped.

Unlock uses **`advUnlockedLevel('normal')`** (same math as islands): island N opens when unlock `> (N-1)*10`. Island 1 always open.

Offline production: **8 hours** max. Hopper cap ≈ 8h × rate.

---

## Exported bind API (hand this list to UI / pixels / powers)

### Data

| Name | Kind |
|---|---|
| `BUILDINGS_SCHEMA` | `1` |
| `BUILDING_IDS` | `['stick_lighter','woodchip_glue','chipping_wood','bamboo_boesa','echo_whistle']` |
| `BUILDINGS` | catalog array (defs + costs + `artHint` + `powers`) |
| `BUILDING_BY_ID` | `{ [id]: def }` |
| `buildingResourceIds` | `['spark','glue','chip','steam','echo']` |

### Predicates

| Name | Returns |
|---|---|
| `buildingUnlocked(id, save?)` | island open via `advUnlockedLevel` |
| `buildingBuilt(id, save?)` | level ≥ 1 |
| `buildingCanUpgrade(id, save?)` | built, &lt; max, unlocked, can pay |
| `buildingCanCollect(id, save?)` | hopper &gt; 0 after tick |
| `buildingCanBuild(id, save?)` | extra: not built + unlocked + can pay |

### Actions

| Name | Result |
|---|---|
| `buildingTickAll(save?, nowMs?)` | accrue hoppers |
| `buildingCollect(id, save?)` | `{ ok, amount, resourceId }` → wallet |
| `buildingBuild(id, save?)` | `{ ok, reason?, level? }` 0→1 |
| `buildingUpgrade(id, save?)` | `{ ok, reason?, level? }` L→L+1 |

Reasons: `unknown` · `locked` · `built` · `unbuilt` · `max` · `broke`.

Clock override: `globalThis.__sfBuildingNow = epochMs`.

### Powers / UI model

| Name | Returns |
|---|---|
| `buildingPowerRank(id\|level, save?)` | `floor((lvl-1)/2)` (`-1` if unbuilt) |
| `buildingWallet(resId?, save?)` | one amount, or full wallet if omitted |
| `buildingTooltipModel(id, save?)` | card row: name, island, level, rank, costs, pending, `artHint`, `powersUnlocked` |
| `buildingDescModel(id, save?)` | tooltip + `produceLine` + `powerLine` + `doesLine` + `unlockLine` + `nextLine` + `powersDetail` |
| `buildingWalletModel(save?)` | `{ petCoins, resources: [{ id, name, amount, rate, factoryId, built }] }` |
| `buildingArtSrc(id)` | `{ pixel, stroke, hub }` paths |
| `buildingCostLabel(cost)` | localized PC + resource cost string |

Power rows on each def: `{ rank, id, kind, combatHook, label, blurb }`. Unlocked when `buildingPowerRank(factory) >= rank`. Combat apply is the powers agent.

`buildingDescModel` is the UI “does what” helper — do not hardcode factory copy in the screen. Schema unchanged.

---

## Screen flow (this UX PR)

Overview (`#buildingsOverview` / `#buildingsList`) → tap card (`[data-factory-id]`) → detail (`#buildingsDetail`) → Upgrade opens `#buildingsUpgradeSheet`.

- Resource pill `[data-buildings-collect]` = one-tap collect when `buildingCanCollect` (overview and detail).
- Sticky `#buildingsWallet` always shows all five owned resources (+ pet coins).
- Upgrade is **not** inline on overview cards.
- HOME tile: Collectie hub `#btnBuildings` (HOME-stijl). Share URL stays `speel.html`.

---

## DOM stubs

```
#buildingsScreen
#buildingsWallet
#buildingsOverview #buildingsList [data-factory-id]
#buildingsDetail
#buildingsUpgradeSheet
```

`UI.openBuildings()` / `UI.renderBuildings()` paint overview → detail → upgrade. Collectie hub tile `#btnBuildings`.

Art: `def.artHint` + `ASSET-STYLE.md` (stroke-first, no emoji). Suggested files under `assets/buttons/modes/buildings-*.svg`.

---

## Tests

```
npm run smoke:buildings
```

Draft only — no solo merge to `main`.
