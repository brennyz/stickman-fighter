# Buildings API — factories (partner bind)

**Owner this PR:** data model, save, unlock/upgrade, timed resources, power *hooks*.  
**Not this PR:** pixel art, full UI, combat application, Versus, merge to `main`.

Live share URL stays `speel.html`. Android-first. Mega-merge batch only.

Canonical module: `src/data/buildings.js` → bundled into `game.js`.  
Global bind object: **`BUILDING_API`** (also the same-named functions on the game scope).

---

## Catalog (exactly five — IDs are frozen)

List order **is** island unlock order (`worldUnlock` 1…5). Do not invent sawmill/forge/neonlab/shrine/reactor.

| `buildingId` | Display name | Island | Resource | Theme |
|---|---|---|---|---|
| `stick_lighter` | Stick-Lighter Factory | 1 East | `ember_sticks` | ember / matches |
| `woodchip_glue` | Woodchip-Glue Factory | 2 Fire | `glue_pots` | sticky paste |
| `chipping_wood` | Chipping-Wood Factory | 3 Neon | `wood_chips` | chipper |
| `bamboo_boesa_boiler` | Bamboo-Boesa Boiler | 4 Temple* | `boesa_steam` | fire-bamboo kettle |
| `echo_whistle_mill` | Echo-Whistle Mill | 5 Finale | `echo_notes` | sound / taunt |

\*Boiler flavor is fire-bamboo; it **unlocks** when island 4 is open (Normal campaign). Island 1 is always open.

Levels: **1…5** (`BUILDING_MAX_LEVEL`). Level `0` = not built.

---

## Save schema

`DEFAULT_SAVE` keys (export schema still **v3** — additive):

```js
buildings: {
  // only owned / in-progress sites are persisted
  stick_lighter: { level: 1, lastTickAt: 1710000000000, stored: 12 },
},
buildingRes: {
  ember_sticks: 4,   // collected wallet (not the hopper)
  glue_pots: 0,
  wood_chips: 0,
  boesa_steam: 0,
  echo_notes: 0,
}
```

| Field | Meaning |
|---|---|
| `level` | 0..5. 0 / missing = unbuilt |
| `lastTickAt` | epoch ms of last production tick |
| `stored` | uncollected hopper, capped per level |
| `buildingRes[id]` | collected resource wallet, cap `99999` |

Sanitize (`sanitizeBuildingSave` / `sanitizeSave`):

- unknown `buildingId` / resource ids stripped
- level clamped 0..5
- `stored` clamped to that level’s cap
- epoch junk / future-far timestamps zeroed
- earned sites are **kept** even if the island is later locked (progress persistable)

Offline production: max **8 hours** (`BUILDING_OFFLINE_HOURS`). Hopper cap is ~8–10h of that level’s rate.

---

## Unlock + upgrade rules

**World unlock** (Normal campaign, same math as `islandUnlocked`):

```
island 1 → always
island N → save.unlocked > (N - 1) * 10
```

So island 2 opens at adventure unlock **11** (boss 10 beaten), island 3 at **21**, etc.

| Action | Requires | Pays |
|---|---|---|
| **Build** (0→1) | world unlocked, not built, can pay `buildCost` | pet coins + listed resources |
| **Upgrade** (L→L+1) | built, L < 5, world still unlocked, can pay `upgradeCosts[L-1]` | pet coins + own (or prior) resource |
| **Collect** | built, `stored` > 0 | moves hopper → `buildingRes` |

Later factories cost a dab of the previous factory’s resource at **build** time (glue needs ember sticks, chipper needs glue pots, …). Upgrades cost the factory’s **own** resource.

Reason codes from `tryBuildBuilding` / `tryUpgradeBuilding`:

`unknown` · `locked` · `built` · `unbuilt` · `max` · `broke`

---

## Bind API

### Catalog / lookup

```js
BUILDING_API.catalog          // frozen 5-row defs
BUILDING_API.ids              // ['stick_lighter', …]
BUILDING_API.resources        // ['ember_sticks', …]
BUILDING_API.powers           // flat power rows (buildingId + hook)
BUILDING_API.byId(id)
BUILDING_API.powerById(powerId)
```

Same functions without the prefix: `buildingById`, `buildingPowerById`, `BUILDING_CATALOG`, …

### World / level / costs

```js
buildingWorldUnlocked(id, save?)
buildingLevel(id, save?)
buildingMaxLevel(id)
buildingOwned(id, save?)
buildingCanBuild(id, save?)
buildingCanUpgrade(id, save?)
buildingBuildCost(id)             // { petCoins, resources: {…} }
buildingUpgradeCost(id, save?)    // next cost or null
tryBuildBuilding(id, save?)       // { ok, reason?, level? }
tryUpgradeBuilding(id, save?)     // { ok, reason?, level? }
```

`save?` defaults to the live `save`. Helpers persist when they mutate the live save.

### Timed resources

```js
tickBuildings(save?, nowMs?)      // accrue hoppers (capped, 8h offline)
buildingOutputRate(id, save?)     // units / hour at current level
buildingStorageCap(id, save?)
buildingPendingAmount(id, save?)  // hopper after a tick
collectBuilding(id, save?)        // { ok, amount, resourceId }
collectAllBuildings(save?)        // { ok, total, gained }
buildingWallet(resId, save?)
buildingWalletAll(save?)
```

Clock override for tests: `globalThis.__sfBuildingNow = epochMs`.

### Powers (hooks only — combat partner applies)

```js
buildingUnlockedPowers(save?)     // ['spark_kindle', …]
buildingHasPower(powerId, save?)
buildingNextPower(id, save?)
```

Each power row:

```js
{
  id, buildingId, atLevel,   // 1 | 3 | 5
  kind: 'passive' | 'active' | 'taunt',
  combatHook,                // see table
  label, blurb
}
```

| `powerId` | Factory | Lv | `kind` | `combatHook` | Intent (powers agent) |
|---|---|---|---|---|---|
| `spark_kindle` | stick_lighter | 1 | passive | `onFirstMeleeHit` | first melee chip / wave leaves ember |
| `kindle_trail` | stick_lighter | 3 | passive | `onMoveTick` | ember crumbs while walking |
| `matchstick_storm` | stick_lighter | 5 | active | `onActiveCast` | lit-stick cone |
| `sticky_soles` | woodchip_glue | 1 | passive | `onKnockback` | less KB |
| `glue_trap` | woodchip_glue | 3 | active | `onActiveCast` | slow puddle |
| `chip_golem` | woodchip_glue | 5 | passive | `onWaveStart` | chip-armor shield |
| `splinter_edge` | chipping_wood | 1 | passive | `onWeaponHit` | bonus splinter |
| `sawdust_cloud` | chipping_wood | 3 | active | `onActiveCast` | miss haze |
| `chipper_fury` | chipping_wood | 5 | passive | `onComboStep` | combo splinters |
| `boiler_hiss` | bamboo_boesa_boiler | 1 | passive | `onAuraTick` | heat aura |
| `bamboo_burst` | bamboo_boesa_boiler | 3 | active | `onActiveCast` | steam knock |
| `boesa_overheat` | bamboo_boesa_boiler | 5 | passive | `onLowHp` | low-HP fire chip |
| `taunt_toot` | echo_whistle_mill | 1 | taunt | `onActiveCast` | nearest foe faces you |
| `echo_ridge` | echo_whistle_mill | 3 | passive | `onKill` | sound-stun ripple |
| `whistle_chorus` | echo_whistle_mill | 5 | taunt | `onActiveCast` | area taunt + brief stun |

**Powers agent:** read `buildingHasPower` / `unlockedPowers` only. Do not rename ids. Do not implement Versus.

### UI / art bind

```js
listBuildingsForUi(save?)   // one row per factory, ready for cards
UI.openBuildings()          // stub screen #buildingsScreen
UI.renderBuildings()
```

Optional hub tile: `#btnBuildings` is already bound in `src/boot/start.js` if the UI partner adds the button.

Each `listBuildingsForUi` row includes `artHint`:

```js
{
  shape, motif, palette,   // ASSET-STYLE tokens — stroke-first, no emoji
  iconFile,                // suggested path under assets/buttons/modes/
  iconHint                 // 24×24 viewBox
}
```

**Art partner:** follow `ASSET-STYLE.md`. Place SVGs at `artHint.iconFile`. Do not ship emoji or glassmorph “AI” buttons.

**UI partner:** full screen, collect-hub tile, i18n polish. Stub is enough to exercise build / upgrade / collect.

---

## i18n keys

`buildings.title` · `buildings.sub` · `buildings.build` · `buildings.collect` · `buildings.upgrade`  
`buildings.lockedWorld` `{n}` · `buildings.rateLine` `{n,pending,cap}`  
`buildings.<buildingId>.name` / `.blurb`  
`buildings.res.<resourceId>`

NL + EN shipped. Other langs fall back.

---

## Tests

```
npm run smoke:buildings
```

Covers: exact 5 ids/names, island 1–5 gates, build/upgrade/broke/lock, hopper tick + 8h cap, collect → wallet, power unlocks at 1/3/5, sanitize of junk keys.

---

## Out of scope

- Drawing pixels / new hub SVG (art agent)
- Full collect-hub layout (UI agent)
- Applying `combatHook` in `attackSpec` / projectiles (powers agent)
- Versus
- Silent `git push origin main` — mega-merge batch only
