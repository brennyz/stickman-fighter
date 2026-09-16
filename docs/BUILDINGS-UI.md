# Buildings UI — HOME tile + list/detail (batch 2 of 4)

**This PR owns presentation only.** Systems (catalog, timers, save schema, combat powers)
live in the partner PR / `docs/BUILDINGS.md`. Pixel art lives in the art partner PR.

Mega-merge: **do not merge this branch to `main` alone.**

## What this PR ships

- HOME hub tile (`data-hub="buildings"`) in the same 2-col style as Arcade / Collectie
- `#buildingsScreen` **list → detail** for **5 factories** (Android portrait: list first; tap a row for detail)
- `#buildingsWallet` chips for PC + spark / glue / chip / steam / echo
- Per factory: short “wat doet dit?” copy from `buildingTooltipModel` (blurb + power rank)
- Collect = one tap (`Oogsten`) with toast + wallet flash. Upgrade is a **separate step** (not mashed into collect)
- Adapter `buildingsApi()` — prefers live `BUILDING_IDS` / `buildingCollect`; stub only if those symbols are missing

Share / playtest URL stays **`speel.html`**. No Versus. Android-first (portrait list, detail under).

## Coordination with systems #297

Systems draft [PR #297](https://github.com/brennyz/stickman-fighter/pull/297) (`cursor/buildings-ux-flow-e580`, base `catalog-1419`) **owns** the bind helpers:

- `buildingDescModel(id)` — produce / power / does / next lines (`docs/BUILDINGS.md`)
- `buildingWalletModel()` — `{ petCoins, resources[{ id, name, amount, rate }] }`
- `buildingArtSrc(id)` — `{ pixel, stroke, hub }` (pixels module may still expose a string slot form)
- `buildingCostLabel(cost)`

This UI PR **consumes those symbols when present**. It does **not** re-declare them. Fallback uses `buildingTooltipModel` + `buildingWallet` + pixel/SVG paths so this branch still boots on `main` before mega-merge.

DOM aligned: `#buildingsOverview` · `#buildingsUpgradeSheet` · sticky `#buildingsWallet`.

Rebasing this branch onto catalog-1419 / #297 is not practical (different base, two complete UIs). Mega-merge later.

## Systems API (consume, do not fork)

Preferred global (systems PR):

```js
BuildingsSys = {
  list(): FactoryView[],
  get(id: string): FactoryView | null,
  collect(id: string): { ok, amount?, resourceId?, message? },
  upgrade(id: string): { ok, level?, message? },
  hubStat(): string,
  select?(id: string): void,
  selectedId?(): string,
}
```

Also accepted as loose globals: `listBuildings`, `getBuilding`, `collectBuilding`,
`upgradeBuilding`, `buildingsHubStat`.

### FactoryView (normalized by the UI bridge)

| Field | Meaning |
|-------|---------|
| `id` | `stick_lighter` · `woodchip_glue` · `chipping_wood` · `bamboo_boesa` · `echo_whistle` |
| `name` / `sub` | Display strings (already localized by systems, or i18n keys) |
| `world` | Adventure island id 1–7 (lock gate) |
| `locked` / `lockHint` | World lock |
| `level` / `maxLevel` | Upgrade level |
| `pending` / `capacity` / `nextMs` | Timed stockpile |
| `resourceId` / `resourceLabel` | What Collect grants |
| `canCollect` / `canUpgrade` | CTA enable |
| `upgradeCost` / `upgradeHint` | Upgrade CTA |
| `art` | Optional pixel/SVG path (art partner) |

UI also probes `assets/buildings/pixel/{id}.png` then `assets/buildings/{id}.svg`.

## Stub (until systems merges)

`src/systems/buildings-bridge.js` keeps a **separate** `localStorage` bag
(`sf-buildings-stub-v1`) so it does **not** fight `sanitizeSave` / `DEFAULT_SAVE`.
Systems owns `save.buildings` when it lands.

Stub factories / world gates (aligned to the locked #292 catalog; mill/forge copy is not shipped):

| id | Display | Unlocks with island |
|----|---------|---------------------|
| stick_lighter | Stick-Lighter | 1 Oost-eiland (always) |
| woodchip_glue | Woodchip-Glue | 2 Vuur-eiland |
| chipping_wood | Chipping-Wood | 3 Neon-eiland |
| bamboo_boesa | Bamboo-Boesa Boiler | 4 Tempel-eiland |
| echo_whistle | Echo-Whistle Mill | 5 Finale-eiland |

When `BUILDING_IDS` + `buildingCollect` are present, the HOME screen binds that live systems API instead of the stub.

## speel.html test steps (Android-first)

1. Open `speel.html` → SPELEN → HOME (`index.html`).
2. After Avontuur / Arcade / Collectie, tap **Fabrieken / Buildings**.
3. Portrait starts on the **list** (5 factories: Stick-Lighter … Echo-Whistle Mill). Stick-Lighter is unlocked; others lock until that island is open.
4. Wallet chips under the title always show **PC + Vonken / Lijm / Snippers / Stoom / Echo** (readable amounts, including 0).
5. Tap a factory → **detail**: “Wat doet dit?” blurb + current/next power, hopper bar, **Oogsten** (primary). Upgrade is a second control that opens a confirm step — not a twin collect button.
6. Oogsten once credits the factory resource (spark / glue / chip / steam / echo); toast `+N` and the matching wallet chip flashes. Empty hopper stays disabled.
7. Upgrade… → confirm (pet coins + factory resources from `nextCost`). Unbuilt factories use **Bouwen…**. Locked factory: CTAs disabled, lock copy names the world.
8. ← Overzicht or Back returns to the list; Back on the list returns to KIES JE PAD. Versus tile must stay gone.

Debug without adventure progress: in console
`save.unlocked = 70; persist(); location.reload()` then all five unlock.
