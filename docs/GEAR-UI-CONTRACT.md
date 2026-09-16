# Gear UI ↔ systems contract v2

UI lane binds **#280** (`src/data/gear.js`, `docs/GEAR-SYSTEM.md`). Do not redeclare those symbols.

## Slots (order)

`GEAR_SLOT_IDS` = `head` · `chest` · `hands` · `legs` · `back`

Weapon stays `save.weapon` — **aside** on the char screen, never a 6th equipment slot.

Draw overlay (back → front): `back → legs → chest → head → hands → weapon → pet`.

## Save (`GEAR_SCHEMA = 1`)

```js
save.createdAt // epoch ms, account age for time gates
save.gear = { schema: 1, equipped: {head,chest,hands,legs,back}, owned: { [id]: { at, src } } }
```

Legacy flat `save.equipment` / `save.ownedGear` / `gearEquipped` / `gearOwned` migrate into `save.gear` then drop.

Equip requires **owned + unlocked + slot match**. Sanitize strips locked / wrong-slot / unknown ids.

## Bind helpers (systems)

`gearItemById` · `gearItemsForSlot` · `gearGateState` · `gearEquipState` · `gearCanEquip` · `gearTooltipModel` · `gearEquipItem` · `gearUnequipSlot` · `gearSlotInventory` · `gearRenderDescriptor` · `sanitizeGearSave` · `grantStarterGear`

Equip states (`GEAR_EQUIP_STATES`): `ok` · `vanity-ok` · `already-equipped` · `locked` · `not-owned` · `wrong-slot` · `unknown`

```
gearEquipState(id, save, now, expectSlot)
gearCanEquip(...)              // alias → gearEquipState
gearEquipItem(id, { expectSlot? })   // also (id, save, now, expectSlot)
gearSlotInventory(slot, save)  // owned + locked preview + gate copy
```

UI wrappers (non-colliding): `listGearSlots` · `listGearItems` · `listGearSlotInventory` · `gearSheetRows` · `getEquippedGear` · `equipGear` · `unequipGear` · `gearFilterItems` · `gearFilterInventory`

## LOOK vs STAT

From `gearTooltipModel`: **LOOK** if vanity / `!appliesStats`. **STAT** if `appliesStats` (`hasStats && !vanity && mods`). Locked items never show fake stats.

## Lock copy

| Gate | Label |
|------|--------|
| `level` | `Lv n` |
| `time` | `n dagen` / `n days` (account age) |
| `adventure` | Avontuur Lv n |
| `diff` | Nog niet vrij |
| not owned | `Not found yet` / `Nog niet gevonden` |

## Catalog UX

131 items. Filter chips (all / LOOK / STAT / LOCK / owned) + rarity + search. **One page-scroll** (no nested picker `max-height`). Tap item = equip/unequip. HOME tile `#btnGearHome` (`data-hub="gear"`) is 1 tap from HOME.

## UI IDs

`#gearScreen` · `#btnGear` · `#btnGearHome` · `#gearDollCanvas` · `#gearSlotList` (`data-slot`) · `#gearWeaponAside` · `#gearDetail` · `#gearFilterBar` · `#gearFilterQ` · `#gearPicker` (`data-gear-id`)
