# Monster art slots — pixel partner

A **separate** cloud agent owns pixel art. This file is the contract.

Live game draws **stub silhouettes** (`pixelStatus: 'stub'`) until you replace them.

## Where to edit

| What | File |
|------|------|
| Art slot IDs, biome, type, shape, blurbs | `src/data/monster-catalog.js` → `MONSTER_ART_SLOTS` |
| Family variants (8 rarities each) | `src/data/monster-catalog.js` → `MONSTER_FAMILIES_W2` |
| Stub silhouettes (meantime) | `src/render/catalog-art.js` → `drawCatalogStubArt` |
| Combat / book use `sp.art` | `src/entities/monster.js` → `drawMonsterArt` default branch |

Do **not** invent new `art` strings in `SPECIES` by hand. Add a family row; the expander writes SPECIES + UNLOCK_AT.

## How to fill pixels

1. Pick a **P1** slot from the table (priority `1` first).
2. Implement a real drawer in `src/render/catalog-art.js` (or a dedicated `src/render/<art>-art.js` wired from `drawCatalogStubArt`).
3. Set `MONSTER_ART_SLOTS[id].pixelStatus = 'pixel'`.
4. Keep the stub path as fallback (`default` / try/catch).
5. Rebuild: `npm run build` — do not edit `game.js` directly.
6. Species that share an art ID all pick up the new drawing (8 variants × colors `c1`/`c2`).

Runtime dump (browser console after boot):

```js
listMonsterArtSlots()
```

Each row: `{ art, biome, type, shape, priority, pixelStatus, species[], count }`.

## Slot IDs (36) — wave 2

`art` is the **stable ID**. Filenames / canvas cases must match exactly.

### P1 — fill first

| art | biome | type | shape | variants (ids) |
|-----|-------|------|-------|----------------|
| `wolf` | wild | charge | quad | wolfling … helwolf |
| `owl` | wild | fly | flyer | uilkuiken … heluil |
| `frog` | wild | hop | hopper | kikkervis … helkikker |
| `snake` | wild | charge | swimmer | slingerling … helslang |
| `boar` | wild | charge | quad | keilerjong … helkeiler |
| `skeleton` | crypt | charge | undead | rammelbeen … helskelet |
| `mummy` | crypt | tank | undead | windseling … helmummie |
| `beetle` | crypt | hop | insect | keverling … helkever |
| `wasp` | crypt | fly | insect | wespje … helwesp |
| `spider` | crypt | shoot | insect | spinling … helspin |
| `drone` | scrap | fly | mech | droneling … heldrone |
| `bot` | scrap | shoot | mech | tandwieling … helbot |
| `scrapdog` | scrap | charge | quad | schroefhond … helschroef |
| `penguin` | frost | hop | hopper | pinguinkuiken … helping |
| `yeti` | frost | tank | tank | yetiling … helyeti |
| `crab` | sea | swim | insect | krabling … helkrab |
| `turtle` | sea | swim | tank | schildpadjong … helschild |
| `squid` | sea | swim | swimmer | inktling … helinkt |

### P2

| art | biome | type | shape |
|-----|-------|------|-------|
| `raven` | wild | fly | flyer |
| `moose` | wild | tank | tank |
| `beaver` | wild | tank | quad |
| `badger` | wild | charge | quad |
| `stag` | wild | charge | quad |
| `lynx` | wild | charge | quad |
| `wisp` | crypt | shoot | shooter |
| `gargoyle` | crypt | fly | flyer |
| `lich` | crypt | shoot | undead |
| `cog` | scrap | hop | mech |
| `turret` | scrap | shoot | shooter |
| `rivet` | scrap | tank | tank |
| `piston` | scrap | charge | mech |
| `walrus` | frost | tank | tank |
| `ray` | sea | swim | swimmer |

### P3

| art | biome | type | shape |
|-----|-------|------|-------|
| `mole` | wild | hop | hopper |
| `junkbat` | scrap | fly | flyer |
| `seal` | frost | hop | hopper |

## Variant rule

Every art has **8** named species: common → hell.

- Nightmare unlocks at Adventure **51+**
- Hell unlocks at **61+**
- Colors come from the family `colors[]` (`c1` / `c2`) — keep those as tint, not extra art files.

## Existing arts (not this pass)

Classic / farm / zoo / sea / tide / satan already have drawers in `monster.js` + `beast-art.js` + `tide-art.js`. Do not rename those IDs.

## Out of scope

Gear cosmetics, audio seasons, Versus. Adventure + monster book + related spawns only.
