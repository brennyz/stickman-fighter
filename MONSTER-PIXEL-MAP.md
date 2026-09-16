# Monster pixel ID map

#282 farm/zoo/classic maps plus **unique W2 P1 drawers** (Wave 3) and leftover W2/W3 aliases.

Editor: [Monster editor double roster](https://cursor.com/agents/bc-43a25a67-7182-5f4f-ab63-6412cd05e154)

Resolution order in combat / dex:

1. Dedicated map when `MONSTER_ART_SLOTS[sp.art].pixelStatus === 'pixel'` and `MONSTER_PIXEL_ART[art]` exists (W2 P1: `wolf`, `owl`, `frog`, `snake`, `boar`, `skeleton`, `mummy`, `beetle`, `wasp`, `spider`, `drone`, `bot`, `scrapdog`, `penguin`, `yeti`, `crab`, `turtle`, `squid`)
2. `sp.pixel` if it names a species or art map (W2 P2/P3 + W3 aliases + #282 flagships)
3. `sp.id` species map (flagship)
4. `sp.art` family map
5. canvas stub / `drawBeastArt` / `drawMonsterArt` fallback

Preview: [assets/monsters/preview.html](assets/monsters/preview.html)

## W2 P1 — dedicated maps

These 18 arts paint their own 32×32 map. `SPECIES[id].pixel` is omitted so combat/book do not reuse fox/bat/slime stand-ins.

## W2 P2/P3 art → #282 pixel alias

| W2 art | .pixel (common–legendary) | .pixel mythic+ |
|--------|---------------------------|----------------|
| `raven` | `bat` | — |
| `moose` | `cow` | `holkoe` |
| `beaver` | `pig` | — |
| `badger` | `hedgehog` | — |
| `stag` | `horse` | `holpaard` |
| `lynx` | `tiger` | `razendetijger` |
| `mole` | `slime` | `frostbub` |
| `wisp` | `ghost` | — |
| `gargoyle` | `dragon` | `omegadrake` |
| `lich` | `ghost` | — |
| `cog` | `can` | — |
| `turret` | `can` | — |
| `rivet` | `golem` | — |
| `junkbat` | `bat` | — |
| `piston` | `golem` | — |
| `walrus` | `hippo` | `razendnijlpaard` |
| `seal` | `duck` | — |
| `ray` | `shark` | `levihaai` |

## W3 art → #282 pixel alias

| W3 art | .pixel (common–legendary) | .pixel mythic+ |
|--------|---------------------------|----------------|
| `hawk` | `bat` | — |
| `ram` | `goat` | `kopstootgeit` |
| `cougar` | `tiger` | `razendetijger` |
| `weasel` | `fox` | `voidkonijn` |
| `porcupine` | `hedgehog` | — |
| `toad` | `slime` | `voidsly` |
| `ghoul` | `ghost` | — |
| `wraith` | `ghost` | — |
| `bonehound` | `fox` | `voidkonijn` |
| `revenant` | `golem` | — |
| `shade` | `ghost` | — |
| `welder` | `can` | — |
| `sawbot` | `can` | — |
| `rustmite` | `hedgehog` | — |
| `furnace` | `golem` | — |
| `coil` | `can` | — |
| `mammoth` | `elephant` | `reuzenolifant` |
| `urchin` | `hedgehog` | — |

## #282 slots

| provisionalId | kind | file | wires to |
|---------------|------|------|----------|
| `slime` | art | `assets/monsters/art-slime.svg` | all SPECIES with `art:'slime'` without a species pixel |
| `bat` | art | `assets/monsters/art-bat.svg` | all SPECIES with `art:'bat'` without a species pixel |
| `hedgehog` | art | `assets/monsters/art-hedgehog.svg` | all SPECIES with `art:'hedgehog'` without a species pixel |
| `ghost` | art | `assets/monsters/art-ghost.svg` | all SPECIES with `art:'ghost'` without a species pixel |
| `can` | art | `assets/monsters/art-can.svg` | all SPECIES with `art:'can'` without a species pixel |
| `fox` | art | `assets/monsters/art-fox.svg` | all SPECIES with `art:'fox'` without a species pixel |
| `golem` | art | `assets/monsters/art-golem.svg` | all SPECIES with `art:'golem'` without a species pixel |
| `dragon` | art | `assets/monsters/art-dragon.svg` | all SPECIES with `art:'dragon'` without a species pixel |
| `shark` | art | `assets/monsters/art-shark.svg` | all SPECIES with `art:'shark'` without a species pixel |
| `octo` | art | `assets/monsters/art-octo.svg` | all SPECIES with `art:'octo'` without a species pixel |
| `cow` | art | `assets/monsters/art-cow.svg` | all SPECIES with `art:'cow'` without a species pixel |
| `pig` | art | `assets/monsters/art-pig.svg` | all SPECIES with `art:'pig'` without a species pixel |
| `chicken` | art | `assets/monsters/art-chicken.svg` | all SPECIES with `art:'chicken'` without a species pixel |
| `sheep` | art | `assets/monsters/art-sheep.svg` | all SPECIES with `art:'sheep'` without a species pixel |
| `horse` | art | `assets/monsters/art-horse.svg` | all SPECIES with `art:'horse'` without a species pixel |
| `goat` | art | `assets/monsters/art-goat.svg` | all SPECIES with `art:'goat'` without a species pixel |
| `duck` | art | `assets/monsters/art-duck.svg` | all SPECIES with `art:'duck'` without a species pixel |
| `rooster` | art | `assets/monsters/art-rooster.svg` | all SPECIES with `art:'rooster'` without a species pixel |
| `donkey` | art | `assets/monsters/art-donkey.svg` | all SPECIES with `art:'donkey'` without a species pixel |
| `goose` | art | `assets/monsters/art-goose.svg` | all SPECIES with `art:'goose'` without a species pixel |
| `elephant` | art | `assets/monsters/art-elephant.svg` | all SPECIES with `art:'elephant'` without a species pixel |
| `lion` | art | `assets/monsters/art-lion.svg` | all SPECIES with `art:'lion'` without a species pixel |
| `tiger` | art | `assets/monsters/art-tiger.svg` | all SPECIES with `art:'tiger'` without a species pixel |
| `giraffe` | art | `assets/monsters/art-giraffe.svg` | all SPECIES with `art:'giraffe'` without a species pixel |
| `hippo` | art | `assets/monsters/art-hippo.svg` | all SPECIES with `art:'hippo'` without a species pixel |
| `rhino` | art | `assets/monsters/art-rhino.svg` | all SPECIES with `art:'rhino'` without a species pixel |
| `gorilla` | art | `assets/monsters/art-gorilla.svg` | all SPECIES with `art:'gorilla'` without a species pixel |
| `zebra` | art | `assets/monsters/art-zebra.svg` | all SPECIES with `art:'zebra'` without a species pixel |
| `bear` | art | `assets/monsters/art-bear.svg` | all SPECIES with `art:'bear'` without a species pixel |
| `croc` | art | `assets/monsters/art-croc.svg` | all SPECIES with `art:'croc'` without a species pixel |
| `kangaroo` | art | `assets/monsters/art-kangaroo.svg` | all SPECIES with `art:'kangaroo'` without a species pixel |
| `panda` | art | `assets/monsters/art-panda.svg` | all SPECIES with `art:'panda'` without a species pixel |
| `flamingo` | art | `assets/monsters/art-flamingo.svg` | all SPECIES with `art:'flamingo'` without a species pixel |
| `camel` | art | `assets/monsters/art-camel.svg` | all SPECIES with `art:'camel'` without a species pixel |
| `wolf` | art | `assets/monsters/art-wolf.svg` | all SPECIES with `art:'wolf'` without a species pixel |
| `owl` | art | `assets/monsters/art-owl.svg` | all SPECIES with `art:'owl'` without a species pixel |
| `frog` | art | `assets/monsters/art-frog.svg` | all SPECIES with `art:'frog'` without a species pixel |
| `snake` | art | `assets/monsters/art-snake.svg` | all SPECIES with `art:'snake'` without a species pixel |
| `boar` | art | `assets/monsters/art-boar.svg` | all SPECIES with `art:'boar'` without a species pixel |
| `skeleton` | art | `assets/monsters/art-skeleton.svg` | all SPECIES with `art:'skeleton'` without a species pixel |
| `mummy` | art | `assets/monsters/art-mummy.svg` | all SPECIES with `art:'mummy'` without a species pixel |
| `beetle` | art | `assets/monsters/art-beetle.svg` | all SPECIES with `art:'beetle'` without a species pixel |
| `wasp` | art | `assets/monsters/art-wasp.svg` | all SPECIES with `art:'wasp'` without a species pixel |
| `spider` | art | `assets/monsters/art-spider.svg` | all SPECIES with `art:'spider'` without a species pixel |
| `drone` | art | `assets/monsters/art-drone.svg` | all SPECIES with `art:'drone'` without a species pixel |
| `bot` | art | `assets/monsters/art-bot.svg` | all SPECIES with `art:'bot'` without a species pixel |
| `scrapdog` | art | `assets/monsters/art-scrapdog.svg` | all SPECIES with `art:'scrapdog'` without a species pixel |
| `penguin` | art | `assets/monsters/art-penguin.svg` | all SPECIES with `art:'penguin'` without a species pixel |
| `yeti` | art | `assets/monsters/art-yeti.svg` | all SPECIES with `art:'yeti'` without a species pixel |
| `crab` | art | `assets/monsters/art-crab.svg` | all SPECIES with `art:'crab'` without a species pixel |
| `turtle` | art | `assets/monsters/art-turtle.svg` | all SPECIES with `art:'turtle'` without a species pixel |
| `squid` | art | `assets/monsters/art-squid.svg` | all SPECIES with `art:'squid'` without a species pixel |
| `holkoe` | species | `assets/monsters/sp-holkoe.svg` | `holkoe` (art `cow`) |
| `razendzwijn` | species | `assets/monsters/sp-razendzwijn.svg` | `razendzwijn` (art `pig`) |
| `kipophol` | species | `assets/monsters/sp-kipophol.svg` | `kipophol` (art `chicken`) |
| `razendeschaap` | species | `assets/monsters/sp-razendeschaap.svg` | `razendeschaap` (art `sheep`) |
| `holpaard` | species | `assets/monsters/sp-holpaard.svg` | `holpaard` (art `horse`) |
| `kopstootgeit` | species | `assets/monsters/sp-kopstootgeit.svg` | `kopstootgeit` (art `goat`) |
| `kwakophol` | species | `assets/monsters/sp-kwakophol.svg` | `kwakophol` (art `duck`) |
| `haanophol` | species | `assets/monsters/sp-haanophol.svg` | `haanophol` (art `rooster`) |
| `koppigeezel` | species | `assets/monsters/sp-koppigeezel.svg` | `koppigeezel` (art `donkey`) |
| `gansophol` | species | `assets/monsters/sp-gansophol.svg` | `gansophol` (art `goose`) |
| `reuzenolifant` | species | `assets/monsters/sp-reuzenolifant.svg` | `reuzenolifant` (art `elephant`) |
| `razendeleeuw` | species | `assets/monsters/sp-razendeleeuw.svg` | `razendeleeuw` (art `lion`) |
| `razendetijger` | species | `assets/monsters/sp-razendetijger.svg` | `razendetijger` (art `tiger`) |
| `langegiraffe` | species | `assets/monsters/sp-langegiraffe.svg` | `langegiraffe` (art `giraffe`) |
| `razendnijlpaard` | species | `assets/monsters/sp-razendnijlpaard.svg` | `razendnijlpaard` (art `hippo`) |
| `razendeneushoorn` | species | `assets/monsters/sp-razendeneushoorn.svg` | `razendeneushoorn` (art `rhino`) |
| `woestegorilla` | species | `assets/monsters/sp-woestegorilla.svg` | `woestegorilla` (art `gorilla`) |
| `razendezebra` | species | `assets/monsters/sp-razendezebra.svg` | `razendezebra` (art `zebra`) |
| `razendebeer` | species | `assets/monsters/sp-razendebeer.svg` | `razendebeer` (art `bear`) |
| `razendekrokodil` | species | `assets/monsters/sp-razendekrokodil.svg` | `razendekrokodil` (art `croc`) |
| `razendekangoeroe` | species | `assets/monsters/sp-razendekangoeroe.svg` | `razendekangoeroe` (art `kangaroo`) |
| `woestepanda` | species | `assets/monsters/sp-woestepanda.svg` | `woestepanda` (art `panda`) |
| `razendeflamingo` | species | `assets/monsters/sp-razendeflamingo.svg` | `razendeflamingo` (art `flamingo`) |
| `razendekameel` | species | `assets/monsters/sp-razendekameel.svg` | `razendekameel` (art `camel`) |
| `voidsly` | species | `assets/monsters/sp-voidsly.svg` | `voidsly` (art `slime`) |
| `frostbub` | species | `assets/monsters/sp-frostbub.svg` | `frostbub` (art `slime`) |
| `lavablob` | species | `assets/monsters/sp-lavablob.svg` | `lavablob` (art `slime`) |
| `voidkonijn` | species | `assets/monsters/sp-voidkonijn.svg` | `voidkonijn` (art `fox`) |
| `omegadrake` | species | `assets/monsters/sp-omegadrake.svg` | `omegadrake` (art `dragon`) |
| `levihaai` | species | `assets/monsters/sp-levihaai.svg` | `levihaai` (art `shark`) |
| `voidocto` | species | `assets/monsters/sp-voidocto.svg` | `voidocto` (art `octo`) |

## Coverage

- **52 art families** — farm (10) + zoo (14) + classic/sea (10) + W2 P1 (18).
- **31 flagship species** — farm/zoo commons + a few mythic/void variants.
- **18 W2 P1 arts** have dedicated maps + `pixelStatus='pixel'`.
- **W2 P2/P3 + W3** stay aliased onto the #282 set until a later unique-pixel pass.
- Files are 32×32 crisp SVG (RLE rects), typically 1–3 KB.
- Combat paint is from JS maps (no Image decode) so a missing SVG never blanks a fighter.

## Do not

- Change hitboxes / `sp.size` / AI here.
- Point share URL at this preview — players stay on `speel.html`.
