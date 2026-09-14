/* ====================== MONSTER CATALOG W2 (editor) ==================== */
/**
 * Data-driven family table — expands into SPECIES + UNLOCK_AT.
 * Pixel partner fills art slots in docs/MONSTER-ART-SLOTS.md
 * (`pixelStatus: 'stub'` until canvas/pixel art lands).
 *
 * Do not edit SPECIES by hand for wave-2 beasts — add a family row here.
 */
const MONSTER_CATALOG_RARITIES = [
  { rarity: 'common',    size: 0, hp: 1.00, dmg: 1.00, speed: 1.00, xp: 1.00, unlockAdd: 0 },
  { rarity: 'uncommon',  size: 1, hp: 1.42, dmg: 1.24, speed: 1.05, xp: 1.55, unlockAdd: 5 },
  { rarity: 'rare',      size: 2, hp: 1.88, dmg: 1.48, speed: 1.10, xp: 2.15, unlockAdd: 10 },
  { rarity: 'epic',      size: 3, hp: 2.38, dmg: 1.72, speed: 1.14, xp: 2.80, unlockAdd: 16 },
  { rarity: 'legendary', size: 4, hp: 2.92, dmg: 1.96, speed: 1.18, xp: 3.50, unlockAdd: 22 },
  { rarity: 'mythic',    size: 5, hp: 3.50, dmg: 2.20, speed: 1.22, xp: 4.25, unlockAdd: 28 },
  { rarity: 'nightmare', size: 6, hp: 4.15, dmg: 2.48, speed: 1.26, xp: 5.15, unlockAdd: 'nm' },
  { rarity: 'hell',      size: 7, hp: 4.90, dmg: 2.80, speed: 1.30, xp: 6.10, unlockAdd: 'hell' },
];

/** Art slot registry — one ID per silhouette. Pixel partner owns these. */
const MONSTER_ART_SLOTS = {
  wolf:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Tanden eerst, vragen later.' },
  owl:       { biome: 'wild',  type: 'fly',    shape: 'flyer',   priority: 1, pixelStatus: 'stub', blurb: 'Draait de kop, dan jij.' },
  frog:      { biome: 'wild',  type: 'hop',    shape: 'hopper',  priority: 1, pixelStatus: 'stub', blurb: 'Eén sprong, twee problemen.' },
  snake:     { biome: 'wild',  type: 'charge', shape: 'swimmer', priority: 1, pixelStatus: 'stub', blurb: 'Geen benen, wél tempo.' },
  boar:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Slagtanden als bumper.' },
  raven:     { biome: 'wild',  type: 'fly',    shape: 'flyer',   priority: 2, pixelStatus: 'stub', blurb: 'Krast alsof hij gelijk heeft.' },
  moose:     { biome: 'wild',  type: 'tank',   shape: 'tank',    priority: 2, pixelStatus: 'stub', blurb: 'Gewei breder dan je plan.' },
  beaver:    { biome: 'wild',  type: 'tank',   shape: 'quad',    priority: 2, pixelStatus: 'stub', blurb: 'Bouwt een dam van jouw combo.' },
  badger:    { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 2, pixelStatus: 'stub', blurb: 'Graaft eerst, bijt daarna.' },
  stag:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 2, pixelStatus: 'stub', blurb: 'Woud-koning met piek-gewei.' },
  lynx:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 2, pixelStatus: 'stub', blurb: 'Pluimoor, scherpe mening.' },
  mole:      { biome: 'wild',  type: 'hop',    shape: 'hopper',  priority: 3, pixelStatus: 'stub', blurb: 'Komt van onder. Altijd.' },
  skeleton:  { biome: 'crypt', type: 'charge', shape: 'undead',  priority: 1, pixelStatus: 'stub', blurb: 'Rammelt, maar raakt wél.' },
  mummy:     { biome: 'crypt', type: 'tank',   shape: 'undead',  priority: 1, pixelStatus: 'stub', blurb: 'Verband als pantser.' },
  beetle:    { biome: 'crypt', type: 'hop',    shape: 'insect',  priority: 1, pixelStatus: 'stub', blurb: 'Schild-kever, weinig praat.' },
  wasp:      { biome: 'crypt', type: 'fly',    shape: 'insect',  priority: 1, pixelStatus: 'stub', blurb: 'Angel eerst, excuses nooit.' },
  spider:    { biome: 'crypt', type: 'shoot',  shape: 'insect',  priority: 1, pixelStatus: 'stub', blurb: 'Web + afstand = irritant.' },
  wisp:      { biome: 'crypt', type: 'shoot',  shape: 'shooter', priority: 2, pixelStatus: 'stub', blurb: 'Dwaallicht met slechte bedoelingen.' },
  gargoyle:  { biome: 'crypt', type: 'fly',    shape: 'flyer',   priority: 2, pixelStatus: 'stub', blurb: 'Steen die dacht dat hij kon vliegen.' },
  lich:      { biome: 'crypt', type: 'shoot',  shape: 'undead',  priority: 2, pixelStatus: 'stub', blurb: 'Te veel botten, te veel magie.' },
  drone:     { biome: 'scrap', type: 'fly',    shape: 'mech',    priority: 1, pixelStatus: 'stub', blurb: 'Zoemt, mikt, piept.' },
  bot:       { biome: 'scrap', type: 'shoot',  shape: 'mech',    priority: 1, pixelStatus: 'stub', blurb: 'Blik met een laser-mening.' },
  scrapdog:  { biome: 'scrap', type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Roest-hond. Kwispelt met ketting.' },
  cog:       { biome: 'scrap', type: 'hop',    shape: 'mech',    priority: 2, pixelStatus: 'stub', blurb: 'Tandwiel dat terugbijt.' },
  turret:    { biome: 'scrap', type: 'shoot',  shape: 'shooter', priority: 2, pixelStatus: 'stub', blurb: 'Blijft staan. Jij beweegt.' },
  rivet:     { biome: 'scrap', type: 'tank',   shape: 'tank',    priority: 2, pixelStatus: 'stub', blurb: 'Klinknagels en slechte ideeën.' },
  junkbat:   { biome: 'scrap', type: 'fly',    shape: 'flyer',   priority: 3, pixelStatus: 'stub', blurb: 'Vleermuis van sloopafval.' },
  piston:    { biome: 'scrap', type: 'charge', shape: 'mech',    priority: 2, pixelStatus: 'stub', blurb: 'Hydrauliek met een deadline.' },
  penguin:   { biome: 'frost', type: 'hop',    shape: 'hopper',  priority: 1, pixelStatus: 'stub', blurb: 'Waddelt. Tot hij sprint.' },
  yeti:      { biome: 'frost', type: 'tank',   shape: 'tank',    priority: 1, pixelStatus: 'stub', blurb: 'Sneeuwman die terugslaat.' },
  walrus:    { biome: 'frost', type: 'tank',   shape: 'tank',    priority: 2, pixelStatus: 'stub', blurb: 'Slagtand-zee. Zwaar.' },
  seal:      { biome: 'frost', type: 'hop',    shape: 'hopper',  priority: 3, pixelStatus: 'stub', blurb: 'Glibbert uit je timing.' },
  crab:      { biome: 'sea',   type: 'swim',   shape: 'insect',  priority: 1, pixelStatus: 'stub', blurb: 'Schaar links, schaar rechts.' },
  turtle:    { biome: 'sea',   type: 'swim',   shape: 'tank',    priority: 1, pixelStatus: 'stub', blurb: 'Schild. Daarna nog een schild.' },
  squid:     { biome: 'sea',   type: 'swim',   shape: 'swimmer', priority: 1, pixelStatus: 'stub', blurb: 'Armen genoeg voor iedereen.' },
  ray:       { biome: 'sea',   type: 'swim',   shape: 'swimmer', priority: 2, pixelStatus: 'stub', blurb: 'Glijdt alsof water optioneel is.' },
};

const WILD_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'wild' || MONSTER_ART_SLOTS[id].biome === 'frost'));
const CRYPT_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'crypt'));
const SCRAP_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'scrap'));
const CATALOG_SEA_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'sea'));

function catalogColors(pairs) {
  return pairs.map((p) => ({ c1: p[0], c2: p[1] }));
}

/** Compact family rows: names[i] matches rarity i (common → hell). */
const MONSTER_FAMILIES_W2 = [
  { art: 'wolf', unlock: 2, base: { size: 22, hp: 50, dmg: 10, speed: 108, xp: 12 },
    names: [['wolfling','Wolfling'],['nachtwolf','Nachtwolf'],['roedelwolf','Roedelwolf'],['stormwolf','Stormwolf'],['maanklauw','Maanklauw'],['voidwolf','Voidwolf'],['nmwolf','Nachtmerrie-Wolf'],['helwolf','Hel-Wolf']],
    colors: catalogColors([['#8a8478','#3a3830'],['#505868','#202830'],['#9a917f','#4a4038'],['#7cf5ff','#2a7fc0'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'owl', unlock: 3, base: { size: 18, hp: 36, dmg: 8, speed: 100, xp: 11 },
    names: [['uilkuiken','Uilkuiken'],['nachtuil','Nachtuil'],['bosuil','Bosuil'],['stormuil','Stormuil'],['maanuil','Maanuil'],['voiduil','Voiduil'],['nmuil','Nachtmerrie-Uil'],['heluil','Hel-Uil']],
    colors: catalogColors([['#c98850','#6b4a28'],['#2a1840','#5a3fb0'],['#43b25b','#1e4a28'],['#7cf5ff','#2a7fc0'],['#ffe259','#c97a20'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'frog', unlock: 1, base: { size: 16, hp: 34, dmg: 7, speed: 62, xp: 9 },
    names: [['kikkervis','Kikkervis'],['moeraskikker','Moeraskikker'],['springkik','Springkik'],['stormkikker','Stormkikker'],['koningskik','Koningskik'],['voidkikker','Voidkikker'],['nmkikker','Nachtmerrie-Kikker'],['helkikker','Hel-Kikker']],
    colors: catalogColors([['#5ad06a','#2e8f3c'],['#4a8f52','#1e4a28'],['#7ad06a','#3a7a42'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#b06ae0','#5a2080'],['#ff3040','#2a0810']]) },
  { art: 'snake', unlock: 4, base: { size: 20, hp: 44, dmg: 11, speed: 96, xp: 13 },
    names: [['slingerling','Slingerling'],['graslang','Graslang'],['bijtlang','Bijtlang'],['stormslang','Stormslang'],['kronkelvorst','Kronkelvorst'],['voidslang','Voidslang'],['nmslang','Nachtmerrie-Slang'],['helslang','Hel-Slang']],
    colors: catalogColors([['#43b25b','#1e4a28'],['#5ad06a','#2a6030'],['#c98850','#6b4a28'],['#7cf5ff','#2a7fc0'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'boar', unlock: 3, base: { size: 24, hp: 58, dmg: 11, speed: 102, xp: 13 },
    names: [['keilerjong','Keilerjong'],['boskeiler','Boskeiler'],['stoottand','Stoottand'],['stormkeiler','Stormkeiler'],['slagtandvorst','Slagtandvorst'],['voidkeiler','Voidkeiler'],['nmkeiler','Nachtmerrie-Keiler'],['helkeiler','Hel-Keiler']],
    colors: catalogColors([['#9a917f','#4a4038'],['#6b5344','#3a2820'],['#c98850','#6b4a28'],['#ff7043','#8a2020'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'raven', unlock: 5, base: { size: 16, hp: 32, dmg: 8, speed: 112, xp: 11 },
    names: [['kraailing','Kraailing'],['nachtkras','Nachtkras'],['stormraaf','Stormraaf'],['asraaf','Asraaf'],['maankraai','Maankraai'],['voidraaf','Voidraaf'],['nmraaf','Nachtmerrie-Raaf'],['helraaf','Hel-Raaf']],
    colors: catalogColors([['#505868','#202830'],['#2a1840','#5a3fb0'],['#7cf5ff','#2a7fc0'],['#9a917f','#4a4038'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'moose', unlock: 8, base: { size: 32, hp: 78, dmg: 13, speed: 42, xp: 16 },
    names: [['elandkalf','Elandkalf'],['woudeland','Woudeland'],['takelhorn','Takelhorn'],['stormeland','Stormeland'],['krooneland','Krooneland'],['voideland','Voideland'],['nmeland','Nachtmerrie-Eland'],['heleland','Hel-Eland']],
    colors: catalogColors([['#c98850','#6b4a28'],['#8a5a30','#4a3020'],['#d4a574','#8a6030'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'beaver', unlock: 4, base: { size: 20, hp: 52, dmg: 9, speed: 48, xp: 12 },
    names: [['beverpup','Beverpup'],['dambever','Dambever'],['knaagster','Knaagster'],['stormbever','Stormbever'],['damkolos','Damkolos'],['voidbever','Voidbever'],['nmbever','Nachtmerrie-Bever'],['helbever','Hel-Bever']],
    colors: catalogColors([['#c98850','#6b4a28'],['#6b5344','#3a2820'],['#9a917f','#4a4038'],['#7cf5ff','#2a7fc0'],['#43b25b','#1e4a28'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'badger', unlock: 6, base: { size: 20, hp: 54, dmg: 11, speed: 92, xp: 13 },
    names: [['dassenwelp','Dassenwelp'],['nachtdas','Nachtdas'],['graverdas','Graverdas'],['stormdas','Stormdas'],['zilverdas','Zilverdas'],['voiddas','Voiddas'],['nmdas','Nachtmerrie-Das'],['heldas','Hel-Das']],
    colors: catalogColors([['#9a917f','#4a4038'],['#505868','#202830'],['#8a8478','#3a3830'],['#7cf5ff','#2a7fc0'],['#dfe8ff','#6a7080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'stag', unlock: 7, base: { size: 26, hp: 60, dmg: 12, speed: 100, xp: 14 },
    names: [['hertkalf','Hertkalf'],['woudhert','Woudhert'],['geweihorn','Geweihorn'],['stormhert','Stormhert'],['kroonhert','Kroonhert'],['voidhert','Voidhert'],['nmhert','Nachtmerrie-Hert'],['helhert','Hel-Hert']],
    colors: catalogColors([['#d4a574','#8a6030'],['#43b25b','#1e4a28'],['#c98850','#6b4a28'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#c47aff','#5a2080'],['#ff3040','#2a0810']]) },
  { art: 'lynx', unlock: 6, base: { size: 20, hp: 48, dmg: 12, speed: 118, xp: 14 },
    names: [['loswelp','Loswelp'],['boslos','Boslos'],['klauwlos','Klauwlos'],['stormlos','Stormlos'],['schaduwlos','Schaduwlos'],['voidlos','Voidlos'],['nmlos','Nachtmerrie-Los'],['hellos','Hel-Los']],
    colors: catalogColors([['#e8c98a','#8a6030'],['#c98850','#6b4a28'],['#ff8c42','#d05a1e'],['#7cf5ff','#2a7fc0'],['#2a1840','#5a3fb0'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'mole', unlock: 2, base: { size: 15, hp: 38, dmg: 8, speed: 58, xp: 10 },
    names: [['molpup','Molpup'],['graafmol','Graafmol'],['tunnelmol','Tunnelmol'],['stormmol','Stormmol'],['diepmol','Diepmol'],['voidmol','Voidmol'],['nmmol','Nachtmerrie-Mol'],['helmol','Hel-Mol']],
    colors: catalogColors([['#6b5344','#3a2820'],['#9a917f','#4a4038'],['#8a8478','#5a5548'],['#7cf5ff','#2a7fc0'],['#2a1840','#6a5080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'skeleton', unlock: 8, base: { size: 20, hp: 42, dmg: 10, speed: 88, xp: 13 },
    names: [['rammelbeen','Rammelbeen'],['knerpbot','Knerpbot'],['grafwacht','Grafwacht'],['stormskelet','Stormskelet'],['grafheer','Grafheer'],['voidskelet','Voidskelet'],['nmskelet','Nachtmerrie-Skelet'],['helskelet','Hel-Skelet']],
    colors: catalogColors([['#dfe8ff','#6a7080'],['#9fb2c8','#5f7189'],['#cfe6ff','#7aa8cf'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'mummy', unlock: 10, base: { size: 22, hp: 70, dmg: 11, speed: 40, xp: 16 },
    names: [['windseling','Windseling'],['zandmummie','Zandmummie'],['grafdoek','Grafdoek'],['stormmummie','Stormmummie'],['faraokolos','Faraokolos'],['voidmummie','Voidmummie'],['nmmummie','Nachtmerrie-Mummie'],['helmummie','Hel-Mummie']],
    colors: catalogColors([['#e8c98a','#8a6030'],['#d4a574','#8a6030'],['#c98850','#6b4a28'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'beetle', unlock: 5, base: { size: 16, hp: 40, dmg: 8, speed: 64, xp: 11 },
    names: [['keverling','Keverling'],['pantskever','Pantskever'],['hoornkever','Hoornkever'],['stormkever','Stormkever'],['schildkever','Schildkever'],['voidkever','Voidkever'],['nmkever','Nachtmerrie-Kever'],['helkever','Hel-Kever']],
    colors: catalogColors([['#43b25b','#1e4a28'],['#5a8a40','#2a5020'],['#c98850','#6b4a28'],['#7cf5ff','#2a7fc0'],['#9fb2c8','#4a5568'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'wasp', unlock: 7, base: { size: 14, hp: 28, dmg: 9, speed: 120, xp: 12 },
    names: [['wespje','Wespje'],['steekwesp','Steekwesp'],['zwermwesp','Zwermwesp'],['stormwesp','Stormwesp'],['koninginneangel','Koninginneangel'],['voidwesp','Voidwesp'],['nmwesp','Nachtmerrie-Wesp'],['helwesp','Hel-Wesp']],
    colors: catalogColors([['#ffe259','#c97a20'],['#ffd75e','#8a6020'],['#ff8c42','#d05a1e'],['#7cf5ff','#2a7fc0'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'spider', unlock: 9, base: { size: 18, hp: 46, dmg: 10, speed: 54, xp: 14 },
    names: [['spinling','Spinling'],['webspinner','Webspinner'],['gifspin','Gifspin'],['stormspin','Stormspin'],['nestmoeder','Nestmoeder'],['voidspin','Voidspin'],['nmspin','Nachtmerrie-Spin'],['helspin','Hel-Spin']],
    colors: catalogColors([['#6b5344','#3a2820'],['#505868','#202830'],['#9fd06a','#4a7030'],['#7cf5ff','#2a7fc0'],['#b06ae0','#5a3080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'wisp', unlock: 11, base: { size: 15, hp: 38, dmg: 9, speed: 52, xp: 14 },
    names: [['wispling','Wispling'],['dwaallicht','Dwaallicht'],['zielewisp','Zielewisp'],['stormwisp','Stormwisp'],['etherwisp','Etherwisp'],['voidwisp','Voidwisp'],['nmwisp','Nachtmerrie-Wisp'],['helwisp','Hel-Wisp']],
    colors: catalogColors([['#cfe6ff','#7aa8cf'],['#7cf5ff','#2a7fc0'],['#c47aff','#5a2080'],['#6fd7ff','#2a5080'],['#a8e0ff','#3a7fc0'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'gargoyle', unlock: 14, base: { size: 24, hp: 72, dmg: 13, speed: 78, xp: 18 },
    names: [['steengarg','Steengarg'],['nachtgarg','Nachtgarg'],['daksteek','Daksteek'],['stormgarg','Stormgarg'],['kathedraalkolos','Kathedraalkolos'],['voidgarg','Voidgarg'],['nmgarg','Nachtmerrie-Garg'],['helgarg','Hel-Garg']],
    colors: catalogColors([['#8a8478','#5a5548'],['#2a1840','#5a3fb0'],['#9a917f','#4a4038'],['#7cf5ff','#2a7fc0'],['#9fb2c8','#4a5568'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'lich', unlock: 16, base: { size: 22, hp: 68, dmg: 14, speed: 50, xp: 20 },
    names: [['lichling','Lichling'],['grafmagus','Grafmagus'],['botvorst','Botvorst'],['stormlich','Stormlich'],['doodsheer','Doodsheer'],['voidlich','Voidlich'],['nmlich','Nachtmerrie-Lich'],['hellich','Hel-Lich']],
    colors: catalogColors([['#c47aff','#5a2080'],['#6b5cff','#2e2266'],['#dfe8ff','#6a7080'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'drone', unlock: 12, base: { size: 16, hp: 36, dmg: 9, speed: 118, xp: 13 },
    names: [['droneling','Droneling'],['zweefblik','Zweefblik'],['lasdrone','Lasdrone'],['stormdrone','Stormdrone'],['zwermkoning','Zwermkoning'],['voiddrone','Voiddrone'],['nmdrone','Nachtmerrie-Drone'],['heldrone','Hel-Drone']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#7cf5ff','#2a7fc0'],['#ff6b6b','#8a2020'],['#6fd7ff','#2a5080'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'bot', unlock: 10, base: { size: 18, hp: 50, dmg: 10, speed: 48, xp: 13 },
    names: [['tandwieling','Tandwieling'],['schroefbot','Schroefbot'],['lasbot','Lasbot'],['stormbot','Stormbot'],['corebot','Corebot'],['voidbot','Voidbot'],['nmbot','Nachtmerrie-Bot'],['helbot','Hel-Bot']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#b86a4a','#6a3820'],['#ff6b6b','#8a2020'],['#7cf5ff','#2a7fc0'],['#ffd75e','#c97a20'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'scrapdog', unlock: 11, base: { size: 20, hp: 52, dmg: 12, speed: 110, xp: 15 },
    names: [['schroefhond','Schroefhond'],['roesthond','Roesthond'],['knipkaak','Knipkaak'],['stormhond','Stormhond'],['kettingbek','Kettingbek'],['voidhond','Voidhond'],['nmhond','Nachtmerrie-Hond'],['helschroef','Hel-Schroef']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#b86a4a','#6a3820'],['#c98850','#7a5030'],['#7cf5ff','#2a7fc0'],['#505868','#202830'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'cog', unlock: 9, base: { size: 15, hp: 36, dmg: 8, speed: 66, xp: 11 },
    names: [['tandwielpup','Tandwielpup'],['ratelrad','Ratelrad'],['stoomslof','Stoomslof'],['stormrad','Stormrad'],['megavertanding','Megavertanding'],['voidrad','Voidrad'],['nmrad','Nachtmerrie-Rad'],['helrad','Hel-Rad']],
    colors: catalogColors([['#c98850','#7a5030'],['#9a917f','#4a4038'],['#dfe8ff','#6a7080'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'turret', unlock: 14, base: { size: 18, hp: 58, dmg: 12, speed: 36, xp: 16 },
    names: [['torentje','Torentje'],['piektor','Piektor'],['laserkop','Laserkop'],['stormtoren','Stormtoren'],['bastionoog','Bastionoog'],['voidtoren','Voidtoren'],['nmtoren','Nachtmerrie-Toren'],['heltoren','Hel-Toren']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#ff6b6b','#8a2020'],['#7cf5ff','#2a7fc0'],['#6fd7ff','#2a5080'],['#ffd75e','#c97a20'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'rivet', unlock: 15, base: { size: 26, hp: 88, dmg: 14, speed: 30, xp: 18 },
    names: [['klinknagel','Klinknagel'],['lasplaat','Lasplaat'],['stoombonk','Stoombonk'],['stormklink','Stormklink'],['ijzerkolos','Ijzerkolos'],['voidklink','Voidklink'],['nmklink','Nachtmerrie-Klink'],['helklink','Hel-Klink']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#b86a4a','#6a3820'],['#dfe8ff','#6a7080'],['#7cf5ff','#2a7fc0'],['#9a917f','#4a4038'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'junkbat', unlock: 13, base: { size: 15, hp: 30, dmg: 8, speed: 116, xp: 12 },
    names: [['blikvleerm','Blikvleerm'],['schroefvleugel','Schroefvleugel'],['roestflap','Roestflap'],['stormjunk','Stormjunk'],['sloopvleugel','Sloopvleugel'],['voidjunk','Voidjunk'],['nmjunk','Nachtmerrie-Junk'],['heljunk','Hel-Junk']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#b86a4a','#6a3820'],['#c98850','#7a5030'],['#7cf5ff','#2a7fc0'],['#505868','#202830'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'piston', unlock: 16, base: { size: 22, hp: 64, dmg: 13, speed: 98, xp: 17 },
    names: [['zuigerling','Zuigerling'],['stoomstoot','Stoomstoot'],['hydrauliek','Hydrauliek'],['stormzuiger','Stormzuiger'],['perskolos','Perskolos'],['voidzuiger','Voidzuiger'],['nmzuiger','Nachtmerrie-Zuiger'],['helzuiger','Hel-Zuiger']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#dfe8ff','#6a7080'],['#c98850','#7a5030'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'penguin', unlock: 4, base: { size: 17, hp: 40, dmg: 8, speed: 70, xp: 11 },
    names: [['pinguinkuiken','Pinguinkuiken'],['waddleping','Waddleping'],['ijssteek','Ijssteek'],['stormping','Stormping'],['keizerping','Keizerping'],['voidping','Voidping'],['nmping','Nachtmerrie-Ping'],['helping','Hel-Ping']],
    colors: catalogColors([['#505868','#202830'],['#dfe8ff','#6a7080'],['#a8e0ff','#3a7fc0'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'yeti', unlock: 12, base: { size: 30, hp: 92, dmg: 15, speed: 36, xp: 20 },
    names: [['yetiling','Yetiling'],['sneeuwbom','Sneeuwbom'],['bergvuist','Bergvuist'],['stormyeti','Stormyeti'],['ijsreus','Ijsreus'],['voidyeti','Voidyeti'],['nmyeti','Nachtmerrie-Yeti'],['helyeti','Hel-Yeti']],
    colors: catalogColors([['#dfe8ff','#6a7080'],['#a8e0ff','#3a7fc0'],['#9fb2c8','#5f7189'],['#7cf5ff','#2a7fc0'],['#cfe6ff','#7aa8cf'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'walrus', unlock: 10, base: { size: 28, hp: 84, dmg: 13, speed: 34, xp: 17 },
    names: [['walruspup','Walruspup'],['slagtandzee','Slagtandzee'],['ijsbonk','Ijsbonk'],['stormwalrus','Stormwalrus'],['slagtandkolos','Slagtandkolos'],['voidwalrus','Voidwalrus'],['nmwalrus','Nachtmerrie-Walrus'],['helwalrus','Hel-Walrus']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#cfe6ff','#7aa8cf'],['#a8e0ff','#3a7fc0'],['#7cf5ff','#2a7fc0'],['#dfe8ff','#6a7080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'seal', unlock: 5, base: { size: 18, hp: 42, dmg: 8, speed: 72, xp: 11 },
    names: [['zeehondpup','Zeehondpup'],['glibberzee','Glibberzee'],['ijsduik','Ijsduik'],['stormzeehond','Stormzeehond'],['ijsvel','Ijsvel'],['voidzeehond','Voidzeehond'],['nmzeehond','Nachtmerrie-Zeehond'],['helzeehond','Hel-Zeehond']],
    colors: catalogColors([['#cfe6ff','#7aa8cf'],['#a8e0ff','#3a7fc0'],['#7cf5ff','#2a7fc0'],['#6fd7ff','#2a5080'],['#dfe8ff','#6a7080'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'crab', unlock: 8, base: { size: 17, hp: 40, dmg: 9, speed: 70, xp: 12 },
    names: [['krabling','Krabling'],['schaarkrab','Schaarkrab'],['pantserschaar','Pantserschaar'],['stormkrab','Stormkrab'],['koningsschaar','Koningsschaar'],['voidkrab','Voidkrab'],['nmkrab','Nachtmerrie-Krab'],['helkrab','Hel-Krab']],
    colors: catalogColors([['#ff7043','#8a2020'],['#e04f4f','#8a2020'],['#c98850','#6b4a28'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'turtle', unlock: 9, base: { size: 22, hp: 72, dmg: 10, speed: 40, xp: 15 },
    names: [['schildpadjong','Schildpadjong'],['rifschild','Rifschild'],['pantserduik','Pantserduik'],['stormschild','Stormschild'],['eilandrug','Eilandrug'],['voidschild','Voidschild'],['nmschild','Nachtmerrie-Schild'],['helschild','Hel-Schild']],
    colors: catalogColors([['#43b25b','#1e4a28'],['#4a9fff','#1a4080'],['#5ad06a','#2a6030'],['#7cf5ff','#2a7fc0'],['#e8c98a','#8a6030'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'squid', unlock: 11, base: { size: 20, hp: 48, dmg: 10, speed: 58, xp: 14 },
    names: [['inktling','Inktling'],['dieptarm','Dieptarm'],['grijparm','Grijparm'],['storminkt','Storminkt'],['krakentent','Krakentent'],['voidinkt','Voidinkt'],['nminkt','Nachtmerrie-Inkt'],['helinkt','Hel-Inkt']],
    colors: catalogColors([['#c47aff','#5a2080'],['#6b5cff','#2e2266'],['#b06ae0','#4a1870'],['#7cf5ff','#2a7fc0'],['#2a1840','#6ee06e'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'ray', unlock: 10, base: { size: 20, hp: 46, dmg: 9, speed: 92, xp: 13 },
    names: [['rogling','Rogling'],['zandrog','Zandrog'],['glijvin','Glijvin'],['stormrog','Stormrog'],['manteltitaan','Manteltitaan'],['voidrog','Voidrog'],['nmrog','Nachtmerrie-Rog'],['helrog','Hel-Rog']],
    colors: catalogColors([['#6a9fc8','#2a5080'],['#e8c98a','#8a6030'],['#8fb8d8','#3a6088'],['#7cf5ff','#2a7fc0'],['#4a9fff','#1a4080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
];

function catalogUnlockFor(step, familyUnlock) {
  const base = Number(familyUnlock) || 1;
  if (step.unlockAdd === 'nm') return Math.max(51, base + 36);
  if (step.unlockAdd === 'hell') return Math.max(61, base + 42);
  return Math.min(50, Math.max(1, base + (Number(step.unlockAdd) || 0)));
}

function expandMonsterCatalog(families) {
  const species = {};
  const unlockAt = {};
  const collisions = [];
  const list = families || MONSTER_FAMILIES_W2;
  for (const fam of list) {
    const slot = MONSTER_ART_SLOTS[fam.art] || {};
    const names = fam.names || [];
    if (names.length !== MONSTER_CATALOG_RARITIES.length) {
      throw new Error('[MonsterCatalog] family ' + fam.art + ' needs ' + MONSTER_CATALOG_RARITIES.length + ' names');
    }
    for (let i = 0; i < MONSTER_CATALOG_RARITIES.length; i++) {
      const step = MONSTER_CATALOG_RARITIES[i];
      const pair = names[i];
      const id = pair[0];
      const name = pair[1];
      if (species[id] || (typeof SPECIES !== 'undefined' && SPECIES[id])) {
        collisions.push(id);
        continue;
      }
      const col = (fam.colors && fam.colors[i]) || { c1: '#888', c2: '#444' };
      const b = fam.base || {};
      species[id] = {
        name,
        art: fam.art,
        artSlot: fam.art,
        catalog: 'w2',
        biome: slot.biome || fam.biome || 'classic',
        pixelStatus: slot.pixelStatus || 'stub',
        size: Math.round((b.size || 18) + step.size),
        hp: Math.round((b.hp || 40) * step.hp),
        dmg: Math.round((b.dmg || 8) * step.dmg),
        speed: Math.round((b.speed || 70) * step.speed),
        type: slot.type || fam.type || 'charge',
        xp: Math.round((b.xp || 10) * step.xp),
        rarity: step.rarity,
        c1: col.c1,
        c2: col.c2,
      };
      unlockAt[id] = catalogUnlockFor(step, fam.unlock);
    }
  }
  if (collisions.length) {
    throw new Error('[MonsterCatalog] id collision: ' + collisions.join(','));
  }
  return { species, unlockAt, familyCount: list.length, speciesCount: Object.keys(species).length };
}

function listMonsterArtSlots() {
  return Object.keys(MONSTER_ART_SLOTS).map((id) => {
    const s = MONSTER_ART_SLOTS[id];
    const used = (typeof SPECIES !== 'undefined')
      ? Object.keys(SPECIES).filter((spId) => SPECIES[spId].art === id)
      : [];
    return {
      art: id,
      biome: s.biome,
      type: s.type,
      shape: s.shape,
      priority: s.priority,
      pixelStatus: s.pixelStatus,
      species: used,
      count: used.length,
    };
  });
}

function catalogSpeciesPool(levelN, maxRarityOrder, arts) {
  const set = arts instanceof Set ? arts : new Set(arts || []);
  return Object.keys(UNLOCK_AT).filter((id) => {
    const sp = SPECIES[id];
    if (!sp || !set.has(sp.art)) return false;
    if (UNLOCK_AT[id] > levelN) return false;
    return rarityOf(sp.rarity).order <= maxRarityOrder;
  });
}

function wildSpeciesPool(levelN, maxRarityOrder) {
  return catalogSpeciesPool(levelN, maxRarityOrder, WILD_ARTS);
}
function cryptSpeciesPool(levelN, maxRarityOrder) {
  return catalogSpeciesPool(levelN, maxRarityOrder, CRYPT_ARTS);
}
function scrapSpeciesPool(levelN, maxRarityOrder) {
  return catalogSpeciesPool(levelN, maxRarityOrder, SCRAP_ARTS);
}

function applyCatalogWave(list, pool, n, rarityBias, giantForce) {
  if (!pool || !pool.length || !list || !list.length) return;
  for (let i = 0; i < list.length; i++) {
    if (Math.random() < 0.72) {
      const sp = weightedPick(pool, n, rarityBias);
      list[i].sp = sp;
      if (giantForce) list[i].giant = true;
      else list[i].giant = list[i].giant || rollWaveGiant(n, !!list[i].elite, sp, 0);
    }
  }
}
