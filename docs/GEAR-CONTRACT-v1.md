# Gear contract v1 — locked (UI lane)

Systems lane: `bc-e509fd59`. UI consumes these IDs even if that PR is not on `main` yet.

## Slots (fixed order)

| id | NL | EN |
|----|----|----|
| `head` | Hoofd | Head |
| `chest` | Borst | Chest |
| `hands` | Handen | Hands |
| `legs` | Benen | Legs |
| `back` | Rug | Back |

Weapon stays `save.weapon` — **aside** on the char screen, never a 6th equipment slot.

Draw overlay (back → front): `back → legs → chest → head → hands → weapon → pet`.

## Item fields

`id`, `slotId`, `kind` (`armour`|`cosmetic`), `isCosmetic`, `hasStats`, `rarity`, `icon`, `needLvl`, `needTrain`, `needDex`, `needTime`, `mods?`, `draw`, `i18n`

- Cosmetic-first: `hasStats` is often false. Some cosmetics **do** have stats (`hasStats` + real `mods`). Vanity never applies combat.
- LOOK pill if `!hasStats`. STAT pill if `hasStats` (including stat cosmetics). Locked items: lock + condition, never fake stats.

## Lock copy

| Gate | Label |
|------|--------|
| `needLvl` | `Lv n` |
| `needTrain` | `n× training` |
| `needDex` | `n monsters` |
| `needTime` | `From date` / `Vanaf datum` |
| not owned | `Not found yet` / `Nog niet gevonden` |

## Save

```js
save.equipment = { head, chest, hands, legs, back }  // null | item id
save.ownedGear = { [id]: { at } }
```

`save.style` stays until a later migration. `save.gear` (systems #280) is a mirror when that catalog is present — UI still reads/writes the v1 bags.

Equip requires **owned + unlocked + slot match**. Sanitize strips locked / wrong-slot / unknown ids.

## UI

HOME tile `#btnGear` — title Character / Figuur, subtitle `Slots · look`, pill `equippedCount/5`.

Char screen: Back + title → hero stickman (draw-order) → 5 HOME slot cards → weapon aside → slot sheet (inventory filtered by `slotId`).

Touch ≥44×44. One page scroll.
