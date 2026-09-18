# Buildings UI — HOME tile + list/detail (batch 2 of 4)

**This PR owns presentation only.** Systems (catalog, timers, save schema, combat powers)
live in the partner PR / `docs/BUILDINGS.md`. Pixel art lives in the art partner PR.

Mega-merge: **do not merge this branch to `main` alone.**

## What this PR ships

- HOME hub tile (`data-hub="buildings"`) in the same 2-col style as Arcade / Collectie
- `#buildingsScreen` **overview cards → detail → upgrade sheet** for **5 factories** (Android portrait: list first)
- Sticky `#buildingsWallet` pills always show PC + spark / glue / chip / steam / echo (0 included)
- Each card has a **does-line** from `buildingDescModel` (produce + power, no hardcoded factory copy)
- Collect = one tap on the resource pill `[data-buildings-collect]` (overview and detail). **Bouw / Upgrade** on the pill opens the sheet (skip detail). Empty-start banner also opens the build sheet. Card body = more info only.
- Upgrade is a **bottom sheet** (`#buildingsUpgradeSheet`), never mashed into collect. Broke/max/locked have a next step (cost hint, max copy, or **Naar Avontuur**)
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
4. Wallet chips under the title always show **labeled** PC + Vonk / Lijm / Chip / Stoom / Echo (readable amounts, including 0). At 390px the six chips sit in a 3×2 grid — never unlabeled dots.
5. Tap a factory → **detail**: does-line + produce/power, hopper, **collect pill**. Upgrade… opens the sheet — not a twin collect button.
6. One-tap pill credits spark / glue / chip / steam / echo; toast `+N` and the matching wallet pill flashes `+N`. Hopper at cap: gold **VOL** on pill + wallet (rate paused) and toast `+N · hopper vol (cap)`. Empty collect never opens detail (no double-tap race).
7. First open (nothing built): one-line **empty start** — `Stok-Aansteker is open — tik Bouw (20 PC)` / EN `Lighter is open — tap Build (20 PC)`. Tap opens stick_lighter. No wall of text.
8. Upgrade… → sheet with does/next + **red/green cost chips** (wallet covers = green, short = red). Confirm is `is-afford` / `is-broke`. Success toast is short (`Lighter · Lv 4`), not the full factory name. Unbuilt uses **Bouwen…**. Locked factory: **Naar Avontuur**. Max: status line, harvest still runs. EN/DE overlays use locale keys (`costPc`, `islandFallback`, `sheetClose`) — no Dutch leftovers.
9. ← Overzicht or Back closes sheet → detail → list; Back on the list returns to KIES JE PAD. Versus tile must stay gone.
10. When **2+ hoppers are ready**, a one-tap collect-all bar sits above the list (`#buildingsCollectAll`). One centered label: NL `Oogst n` · EN `Collect n` · DE `Ernte n` · FR `Récolter n` · ES `Recolectar n`. Hidden at 0–1 ready.
11. Long-press (or `title`) on a resource pill shows one line: `Max 8u offline · daarna VOL` (ready/full variants). Does not collect. Tip stays above the pill (clamped).
12. First-build sheet title is **Bouw {short}** / EN **Build {short}** with confirm **Bouw / Build**. Already-built sheet stays **Upgrade {short}** + **Bevestig / Confirm**.

## DONE (#312) — draft, do not merge

P0–P3 shipped. No unique leftovers on this lane. **Do not merge to main** until «merge main».

FOMO Vandaag vs HOME toast dock at 390 is **#322** (`cursor/fomo-vandaag-home-d443`) — not factories copy. `#fomoRitual` lives inside `#menuScreen` (`display:none` when Fabrieken is `.active`); `openBuildings` already `clearToasts()`.

| Status | Item |
|--------|------|
| done | Overview cards → detail → upgrade sheet; factory ids frozen |
| done | One-tap collect pill; hopper VOL; collect lock; wallet +N |
| done | Empty-start + Bouw/Upgrade pill skip detail; `_buildingsSheetFrom` |
| done | Cost chips red/green; short Lv toast; 390 walk |
| done | Collect-all (2+) + EN/DE/FR/ES; 8h pill tip clamped |
| done | openBuildings clears toasts (welcome vs title) |
| done | Collect-all single centered label (no “all ready” subtitle) |
| done | First-build sheet `buildTitle` + `pillBuild` (not Upgrade/Bevestig) |
| done | MM-003: 390 wallet labeled (`resShort`); does-lines ≤42; upgrade toast `upgradeOkShort` (clears queue) |
| other lane | FOMO sheet / HOME dock → #322 |

Share / playtest stays **`speel.html`**. No Versus. No `origin/main` until user says «merge main».

Debug without adventure progress: in console
`save.unlocked = 70; persist(); location.reload()` then all five unlock.
