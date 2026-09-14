# Gear contract — schema delta (UI lane)

Systems: `bc-e509fd59` · PR **#280** · `docs/GEAR-SYSTEM.md`.

## Save (only bag)

```js
save.createdAt                 // epoch ms, account age for unlockDays
save.gear = {
  schema: 1,
  equipped: { head, chest, hands, legs, back },  // null | item id
  owned: { [id]: { at, src } },
}
```

**Not** `save.equipment` / `save.ownedGear`. Legacy flats migrate into `save.gear` then drop.

Weapon stays `save.weapon` — aside, never a 6th equipment slot.

## Slots (fixed)

`head` · `chest` · `hands` · `legs` · `back`

Draw overlay (back → front): `back → legs → chest → head → hands → weapon → pet`.

## Flags / gates

- `vanity` + `hasStats` — combat mods only if `hasStats && !vanity && mods`
- Every lootable: `unlockLvl` + `unlockDays` (+ optional `needAdvUnlocked` / `needDiff`)

## Helpers (#280)

`GEAR_SLOT_IDS` · `gearItemById` · `gearGateState` · `gearTooltipModel` · `gearEquipItem` · `gearRenderDescriptor` · `rollGearDrop`

## DOM

`#gearScreen` · `[data-slot]` · `[data-gear-id]`

HOME tile `#btnGear` — **Uitrusting** / Gear, subtitle `Slots · look`, pill `equippedCount/5`.
