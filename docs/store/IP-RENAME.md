# IP / trademark rename — Stickman Fighter

**Doel:** geen herkenbare anime-/game-merknamen meer in code, UI of saves. Stickman blijft OK. Generieke Engelse/Nederlandse namen.

## Banned tokens (grep + verwijder/hernoem)

`rasengan`, `chidori`, `rinnegan`, `kamehameha`, `galick`, `spirit.?bomb`, `final.?flash`, `bankai`, `getsuga`, `cero`, `getsuga`, `akatsuki`, `8.?gates|acht.?poorten|eight.?gates`, `jutsu`, `chakra`, `naruto`, `goku`, `vegeta`, `bleach`, `ichigo`, `one.?piece`, `luffy`, `saitama`, `one.?punch`, `ryu`, `ken`, `hadouken`, `shoryuken`, `street.?fighter`, `master.?sword|master_sword`, `zelda`, `nintendo`, `namco`, `capcom`, `bandai`, `shonen`, `shonen`

## Rename map (skills / ids)

| Oud id / label | Nieuw id | UI-naam (NL) | UI-naam (EN) |
|----------------|----------|--------------|--------------|
| rasengan | spiral_orb | Spiraal Orb | Spiral Orb |
| chidori | lightning_pierce | Bliksemprik | Lightning Pierce |
| rinnegan | void_gaze | Leegteblik | Void Gaze |
| kamehameha | wave_cannon | Golfkanon | Wave Cannon |
| galick_gun | violet_blast | Violetschot | Violet Blast |
| spirit_bomb | energy_sphere | Energiesfeer | Energy Sphere |
| final_flash | solar_beam | Zonnestraal | Solar Beam |
| bankai | blade_ascend | Lemmet-opstijging | Blade Ascend |
| getsuga | moon_slash | Maanslag | Moon Slash |
| cero | void_beam | Leegtestraal | Void Beam |
| 8_gates / acht poorten | iron_surge | IJzerstoot | Iron Surge |
| akatsuki_style | crimson_pact | Crimson Pact | Crimson Pact |
| master_sword / Master Sword | dawnblade | Dageraadkling | Dawnblade |
| Street Flair / Ryu/Ken style | arcade_flair | Arcade Flair | Arcade Flair |

## UI woorden

| Oud | Nieuw |
|-----|-------|
| Jutsu | Technique / Techniek |
| Chakra | Energy / Energie |
| activeJutsu | activeTechnique (migrate saves) |
| ENEMY_JUTSU_KINDS | ENEMY_TECHNIQUE_KINDS |

## Agents

| Agent | Branch | Scope |
|-------|--------|-------|
| **IP-A** anime/skills | `cursor/ip-anime-rename-2125` | skills.js, catalog i18n skills, game.js skill FX/comments, monsters enemy techniques, storage activeJutsu migration, skillUpgrade UI |
| **IP-B** fighters/versus | `cursor/ip-fighter-rename-2125` | versus.js Ryu/Ken/Street, summons master_sword, fighter comments, any Capcom/Nintendo leftovers |

Beide: bump BUILD_ID + SW_CACHE_VERSION, rebuild game.js, PR → main.
Na merge: `rg -i 'rasengan|chidori|kamehameha|bankai|master_sword|ryu|hadouken|jutsu|chakra|namco|nintendo' src game.js` moet leeg zijn (behalve dit doc / CHANGELOG note).
