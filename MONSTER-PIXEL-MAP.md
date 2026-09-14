# Monster pixel ID map (provisional)

Editor agent: [Monster editor double roster](https://cursor.com/agents/bc-43a25a67-7182-5f4f-ab63-6412cd05e154) had no merged PR / roster IDs when this set shipped. These IDs match **current** `SPECIES` keys and `art` slots in `src/data/monsters.js`.

If the editor introduces new IDs, either:

1. Reuse the same string (preferred), or
2. Set `SPECIES[newId].pixel = '<provisionalId>'` (species or art key below).

Resolution order in combat / dex:

1. `sp.pixel` if it names a species or art map
2. `sp.id` species map (flagship)
3. `sp.art` family map
4. existing canvas `drawBeastArt` / `drawMonsterArt` fallback

Preview: [assets/monsters/preview.html](assets/monsters/preview.html)

## Slots

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

- **34 art families** — farm (10) + zoo (14) + classic/sea (10). Every existing farm/zoo/classic-expanded species tints one of these.
- **31 flagship species** — commons of the doubled farm/zoo roster plus a few mythic/void variants.
- Files are 32×32 crisp SVG (RLE rects), typically 1–3 KB.
- Combat paint is from JS maps (no Image decode) so a missing SVG never blanks a fighter.

## Do not

- Change hitboxes / `sp.size` / AI here.
- Point share URL at this preview — players stay on `speel.html`.
