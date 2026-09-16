# Gear world drops — bind to PR #280

**Lane:** adventure drop tables + 16×16 pixel art.  
**Catalog:** systems PR **#280** (`cursor/gear-systems-4e04`) — **131 IDs**, slots `head / chest / hands / legs / back`.  
**Out of scope:** char-screen UI, combat-pose fine-tune, audio.

## Schema (do not fork)

```js
save.createdAt                 // account age; days = floor((now-createdAt)/86400000)+1
save.gear = {
  schema: 1,
  equipped: { head, chest, hands, legs, back },
  owned: { [id]: { at, src } }
}
save.ownedGear = { [id]: { gearId, at } }   // contract v1 mirror
```

Gates on every lootable item: **`unlockLvl` + `unlockDays`**. Optional `needAdvUnlocked`, `needDiff` (`nightmare`|`hell`).

Contract v1 (Grok): `ownedGear[id] = { gearId, at }`. Catalog IDs are **#280**, not provisional `g_*`.

- **World rolls** use `gearItemLootableForDrop` — level + time + adv, plus **zone** (`adventureDropZoneForLevel`) may satisfy `needDiff`.
- **Grant is can-own-locked** — `_gearGrantInto` does not re-check gates. Equip / UI still uses `gearGateState`.
- Island-boss / super-boss rolls may set `allowLocked` so a locked piece can land as owned.
- Starters (`droppable: false`) are never world-dropped.

## Files

| File | Role |
|------|------|
| `src/data/gear.js` | #280 catalog + gate/grant API + `rollGearDrop` |
| `src/data/gear-world.js` | kill / stage-clear / chest spawners + unique 16×16 pixels + pickup feel |
| `assets/gear/<id>.svg` | generated 16×16 from `gearPixelsToSvg`; **not** SW-precached |

## Hooks

| Source | Behaviour |
|--------|-----------|
| Adventure kill | `rollGearWorldDrop` → ground pickup (`kind:'gear'`) |
| Island-boss stage clear (`n % 10 === 0`) | `rollGearStageClearDrop` (`allowLocked`) |
| Daily chest consolation | ~16% `rollGearChestPull` (gated only) |
| Zone (NM island 51–60 / Hell 61–70, or 2.0/3.0 tab) | `needDiff` pieces enter the roll pool |

Android: max 3 gear orbs, skip Satan/Tide, 58px touch grab, canvas pixels (`imageSmoothingEnabled = false`).
Rare / epic+ pickups draw a thin rarity ring and scale 2.25–2.75 (elite / superBoss bump). Common stays scale 2.
Canvas-only motion (skipped when `motionReduced()` / `fxLite()` / `save.liteFx`):
- spawn pop (0.2s overshoot) + snappy bounce bob + ready tilt
- hell 3-frame fakkel on the sprite + tongue flicker
- void/crystal/aura double glow pulse + rarity-ring pulse
- collect snap (orb flies to the stickman, 0.16s) + fatter burst
Static SVGs stay still. Preview: `assets/gear/_preview/_pickup-motion.html`.

## Art preview

```bash
node scripts/render-gear-assets.mjs
# assets/gear/_preview/_sheet.html
```

IDs are exactly the #280 list (`head_wrap_cloth` … `back_wings_hell`).
