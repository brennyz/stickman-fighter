# Monster art slots — pixel partner

A **separate** cloud agent owns leftover stub pixels. This file is the contract.

## W2 — dedicated maps (36)

All 36 W2 arts paint unique 32×32 stickman-pixel maps. `MONSTER_ART_SLOTS[id].pixelStatus = 'pixel'`. Combat / book resolve the dedicated `MONSTER_PIXEL_ART[art]` first — **no `sp.pixel` alias**.

P1 (18, from #298): `wolf` `owl` `frog` `snake` `boar` `skeleton` `mummy` `beetle` `wasp` `spider` `drone` `bot` `scrapdog` `penguin` `yeti` `crab` `turtle` `squid`

P2 (15): `raven` `moose` `beaver` `badger` `stag` `lynx` `wisp` `gargoyle` `lich` `cog` `turret` `rivet` `piston` `walrus` `ray`

P3 (3): `mole` `junkbat` `seal`

Canvas stub (`drawCatalogStubArt`) stays as fallback if a map is missing.

## Reuse #282 pixels — Wave 3 only

PR **#282** already shipped 34 art-family maps + 31 flagship species maps. Combat resolves:

1. Dedicated map when `pixelStatus === 'pixel'` and `MONSTER_PIXEL_ART[art]` exists
2. `sp.pixel` → `sp.id` → `sp.art` → canvas stub

**Wave 3** species keep unique `art` IDs (biome / woods-crypt-scrap-frost-reef waves) but set **`SPECIES[id].pixel`** to a provisional ID. Tint uses each species `c1`/`c2`.

Aliases live in `src/data/monster-catalog.js` → `MONSTER_PIXEL_ALIAS`.

| leftover `art` | `.pixel` (common–legendary) | `.pixel` mythic+ |
|----------------|-----------------------------|------------------|
| W3 `hawk` | `bat` | — |
| W3 `ram` | `goat` | `kopstootgeit` |
| W3 `cougar` | `tiger` | `razendetijger` |
| W3 `weasel` `bonehound` | `fox` | `voidkonijn` |
| W3 `porcupine` `rustmite` `urchin` | `hedgehog` | — |
| W3 `toad` | `slime` | `voidsly` |
| W3 `ghoul` `wraith` `shade` | `ghost` | — |
| W3 `revenant` `furnace` | `golem` | — |
| W3 `welder` `sawbot` `coil` | `can` | — |
| W3 `mammoth` | `elephant` | `reuzenolifant` |

## Where to edit

| What | File |
|------|------|
| Art slot IDs, biome, type, shape, blurbs | `src/data/monster-catalog.js` → `MONSTER_ART_SLOTS` |
| Family variants (8 rarities each) | `MONSTER_FAMILIES_W2` + `MONSTER_FAMILIES_W3` |
| Dedicated / stub silhouettes | `scripts/gen-monster-pixels.mjs` + `src/render/catalog-art.js` |
| Combat / book use `sp.art` | `src/entities/monster.js` → `drawMonsterArt` |

Do **not** invent new `art` strings in `SPECIES` by hand. Add a family row; the expander writes SPECIES + UNLOCK_AT.

## How to fill leftover pixels

1. Pick a **stub** slot (`pixelStatus: 'stub'`).
2. Implement a real drawer in `scripts/gen-monster-pixels.mjs`.
3. Set `MONSTER_ART_SLOTS[id].pixelStatus = 'pixel'`.
4. Keep the stub path as fallback (`default` / try/catch).
5. Rebuild: `npm run pixels && npm run build` — do not edit `game.js` directly.
6. Species that share an art ID all pick up the new drawing (8 variants × colors `c1`/`c2`).

Runtime dump (browser console after boot):

```js
listMonsterArtSlots()
```

Each row: `{ art, biome, type, shape, priority, pixelStatus, species[], count }`.

## Slot IDs — wave 2 (36) + wave 3 (18)

`art` is the **stable ID**. Filenames / canvas cases must match exactly.

### P1 — unique pixels shipped (#298)

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

### P2 — unique pixels shipped

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

### P3 — unique pixels shipped

| art | biome | type | shape |
|-----|-------|------|-------|
| `mole` | wild | hop | hopper |
| `junkbat` | scrap | fly | flyer |
| `seal` | frost | hop | hopper |

### Wave 3 — stub + alias (18 families)

| art | biome | type | shape | variants (ids) |
|-----|-------|------|-------|----------------|
| `hawk` | wild | fly | flyer | havikpup … helhavik |
| `ram` | wild | charge | quad | ramling … helram |
| `cougar` | wild | charge | quad | poemaling … helpoema |
| `weasel` | wild | charge | quad | wezelling … helwezel |
| `porcupine` | wild | tank | quad | quillpup … helquill |
| `toad` | wild | hop | hopper | paddeling … helpadd |
| `ghoul` | crypt | charge | undead | ghoulling … helghoul |
| `wraith` | crypt | fly | flyer | wraithling … helwraith |
| `bonehound` | crypt | charge | quad | bothond … helbothond |
| `revenant` | crypt | tank | undead | revenling … helrev |
| `shade` | crypt | shoot | shooter | schimling … helschim |
| `welder` | scrap | shoot | mech | vonkling … hellas |
| `sawbot` | scrap | charge | mech | zaagling … helzaag |
| `rustmite` | scrap | hop | insect | roestmijt … helmijt |
| `furnace` | scrap | tank | tank | ovenling … heloven |
| `coil` | scrap | shoot | shooter | spoelling … helspoel |
| `mammoth` | frost | tank | tank | manmoetpup … helmanmoet |
| `urchin` | sea | swim | insect | zeeegel … helegel |

## Variant rule

Every art has **8** named species: common → hell.

- Nightmare unlocks at Adventure **51+**
- Hell unlocks at **61+**
- Colors come from the family `colors[]` (`c1` / `c2`) — keep those as tint, not extra art files.

Catalog totals (expander only): **54 families × 8 = 432** species, plus the classic/farm/zoo roster in `monsters.js` (book **700+**).

## Existing arts (not this pass)

Classic / farm / zoo / sea / tide / satan already have drawers in `monster.js` + `beast-art.js` + `tide-art.js`. Do not rename those IDs.

## Out of scope

Gear cosmetics, audio seasons, Versus. Adventure + monster book + related spawns only.
