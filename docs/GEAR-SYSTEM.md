# Gear system — schema & UI bind notes

Stable API for the **gear systems** lane. The parallel **gear UI** (char screen) should bind to these IDs only.

Live share URL stays `speel.html`. Versus is retired.

## Slots (5, stable)

| `id` | NL | EN |
|------|----|----|
| `head` | Hoofd | Head |
| `chest` | Borst | Chest |
| `hands` | Handen | Hands |
| `legs` | Benen | Legs |
| `back` | Rug | Back |

Legacy slot `charm` (and ids `charm_*`) migrate → `back` / `back_*`.

## Save schema (`GEAR_SCHEMA = 1`)

```json
{
  "createdAt": 1720000000000,
  "gear": {
    "schema": 1,
    "equipped": { "head": "head_wrap_cloth", "chest": null, "hands": null, "legs": null, "back": null },
    "owned": { "head_wrap_cloth": { "at": 1720000000000, "src": "starter" } }
  }
}
```

- `createdAt` — epoch ms, set once. Time gates use account age (`floor((now - createdAt) / 86400000) + 1`).
- Existing progress without `createdAt` is treated as **veteran** (backdated 90 days) so LIVE players are not time-locked on update.
- Future `createdAt` is clamped to now. Unknown item/slot ids are stripped.
- `owned` values may arrive as `1`, `true`, or `{at,src}`; arrays of ids are accepted. `__proto__` keys are dropped.
- Sanitize never throws; starter vanity items are granted when gates pass.

`SAVE_KEY` is unchanged (`stickfighter_save_v1`). Migration lives in `sanitizeSave` → `sanitizeCreatedAt` + `sanitizeGearSave` + `grantStarterGear`.

## Item flags

| Field | Meaning |
|-------|---------|
| `kind` | `armour` \| `cosmetic` |
| `vanity` | `true` → combat **must** ignore `mods` |
| `hasStats` | `true` → may apply `mods` |
| **apply rule** | `gearItemHasCombatStats(item)` = `hasStats && !vanity && mods` |

Most cosmetics are vanity. Some cosmetics have stats. Armour has stats. Balance clamps: `GEAR_BALANCE`.

Every lootable item has **both**:

- `unlockLvl` vs `save.lvl`
- `unlockDays` vs account age

Optional: `needAdvUnlocked`, `needDiff` (`nightmare` \| `hell`).

## UI bind helpers

```
GEAR_SLOT_IDS · GEAR_SLOTS · GEAR_ITEMS · GEAR_BY_ID · GEAR_SCHEMA
gearItemById(id) · gearItemsForSlot(slot) · gearSlotById(id)
gearUnlockContext(s, now) · gearGateState(item, s, now)
gearItemUnlocked / gearItemLootable / gearItemUsable
gearCanGrant(id) · gearCanEquip(id) · gearEquipState(id)
gearGrantItem · gearEquipItem(id, { expectSlot? }) · gearUnequipSlot
gearSlotInventory(slot, save)
gearTooltipModel · gearTooltipLines · gearCombatLine
gearRenderDescriptor(s)   // look tint/accent/layer — pixel art later
rollGearDrop(ctx)         // stub, always null until world spawners
```

DOM stub: `#gearScreen`, `#gearSlotRow` (`data-slot`), `#gearList` (`data-gear-id`).

## Out of scope here

Pixel art, world drop spawners, audio, broad i18n, FOMO redesign, Versus.
