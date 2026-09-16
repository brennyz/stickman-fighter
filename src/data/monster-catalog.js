/* ====================== MONSTER CATALOG W2+W3 (editor) ================= */
/**
 * Data-driven family table — expands into SPECIES + UNLOCK_AT.
 * All 36 W2 arts paint dedicated 32×32 maps (`pixelStatus: 'pixel'`).
 * W3 still reuses #282 maps via SPECIES[id].pixel aliases.
 *
 * Do not edit SPECIES by hand for catalog beasts — add a family row here.
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
  wolf:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'pixel', blurb: 'Tanden eerst, vragen later.' },
  owl:       { biome: 'wild',  type: 'fly',    shape: 'flyer',   priority: 1, pixelStatus: 'pixel', blurb: 'Draait de kop, dan jij.' },
  frog:      { biome: 'wild',  type: 'hop',    shape: 'hopper',  priority: 1, pixelStatus: 'pixel', blurb: 'Eén sprong, twee problemen.' },
  snake:     { biome: 'wild',  type: 'charge', shape: 'swimmer', priority: 1, pixelStatus: 'pixel', blurb: 'Geen benen, wél tempo.' },
  boar:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'pixel', blurb: 'Slagtanden als bumper.' },
  raven:     { biome: 'wild',  type: 'fly',    shape: 'flyer',   priority: 2, pixelStatus: 'pixel', blurb: 'Krast alsof hij gelijk heeft.' },
  moose:     { biome: 'wild',  type: 'tank',   shape: 'tank',    priority: 2, pixelStatus: 'pixel', blurb: 'Gewei breder dan je plan.' },
  beaver:    { biome: 'wild',  type: 'tank',   shape: 'quad',    priority: 2, pixelStatus: 'pixel', blurb: 'Bouwt een dam van jouw combo.' },
  badger:    { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 2, pixelStatus: 'pixel', blurb: 'Graaft eerst, bijt daarna.' },
  stag:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 2, pixelStatus: 'pixel', blurb: 'Woud-koning met piek-gewei.' },
  lynx:      { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 2, pixelStatus: 'pixel', blurb: 'Pluimoor, scherpe mening.' },
  mole:      { biome: 'wild',  type: 'hop',    shape: 'hopper',  priority: 3, pixelStatus: 'pixel', blurb: 'Komt van onder. Altijd.' },
  skeleton:  { biome: 'crypt', type: 'charge', shape: 'undead',  priority: 1, pixelStatus: 'pixel', blurb: 'Rammelt, maar raakt wél.' },
  mummy:     { biome: 'crypt', type: 'tank',   shape: 'undead',  priority: 1, pixelStatus: 'pixel', blurb: 'Verband als pantser.' },
  beetle:    { biome: 'crypt', type: 'hop',    shape: 'insect',  priority: 1, pixelStatus: 'pixel', blurb: 'Schild-kever, weinig praat.' },
  wasp:      { biome: 'crypt', type: 'fly',    shape: 'insect',  priority: 1, pixelStatus: 'pixel', blurb: 'Angel eerst, excuses nooit.' },
  spider:    { biome: 'crypt', type: 'shoot',  shape: 'insect',  priority: 1, pixelStatus: 'pixel', blurb: 'Web + afstand = irritant.' },
  wisp:      { biome: 'crypt', type: 'shoot',  shape: 'shooter', priority: 2, pixelStatus: 'pixel', blurb: 'Dwaallicht met slechte bedoelingen.' },
  gargoyle:  { biome: 'crypt', type: 'fly',    shape: 'flyer',   priority: 2, pixelStatus: 'pixel', blurb: 'Steen die dacht dat hij kon vliegen.' },
  lich:      { biome: 'crypt', type: 'shoot',  shape: 'undead',  priority: 2, pixelStatus: 'pixel', blurb: 'Te veel botten, te veel magie.' },
  drone:     { biome: 'scrap', type: 'fly',    shape: 'mech',    priority: 1, pixelStatus: 'pixel', blurb: 'Zoemt, mikt, piept.' },
  bot:       { biome: 'scrap', type: 'shoot',  shape: 'mech',    priority: 1, pixelStatus: 'pixel', blurb: 'Blik met een laser-mening.' },
  scrapdog:  { biome: 'scrap', type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'pixel', blurb: 'Roest-hond. Kwispelt met ketting.' },
  cog:       { biome: 'scrap', type: 'hop',    shape: 'mech',    priority: 2, pixelStatus: 'pixel', blurb: 'Tandwiel dat terugbijt.' },
  turret:    { biome: 'scrap', type: 'shoot',  shape: 'shooter', priority: 2, pixelStatus: 'pixel', blurb: 'Blijft staan. Jij beweegt.' },
  rivet:     { biome: 'scrap', type: 'tank',   shape: 'tank',    priority: 2, pixelStatus: 'pixel', blurb: 'Klinknagels en slechte ideeën.' },
  junkbat:   { biome: 'scrap', type: 'fly',    shape: 'flyer',   priority: 3, pixelStatus: 'pixel', blurb: 'Vleermuis van sloopafval.' },
  piston:    { biome: 'scrap', type: 'charge', shape: 'mech',    priority: 2, pixelStatus: 'pixel', blurb: 'Hydrauliek met een deadline.' },
  penguin:   { biome: 'frost', type: 'hop',    shape: 'hopper',  priority: 1, pixelStatus: 'pixel', blurb: 'Waddelt. Tot hij sprint.' },
  yeti:      { biome: 'frost', type: 'tank',   shape: 'tank',    priority: 1, pixelStatus: 'pixel', blurb: 'Sneeuwman die terugslaat.' },
  walrus:    { biome: 'frost', type: 'tank',   shape: 'tank',    priority: 2, pixelStatus: 'pixel', blurb: 'Slagtand-zee. Zwaar.' },
  seal:      { biome: 'frost', type: 'hop',    shape: 'hopper',  priority: 3, pixelStatus: 'pixel', blurb: 'Glibbert uit je timing.' },
  crab:      { biome: 'sea',   type: 'swim',   shape: 'insect',  priority: 1, pixelStatus: 'pixel', blurb: 'Schaar links, schaar rechts.' },
  turtle:    { biome: 'sea',   type: 'swim',   shape: 'tank',    priority: 1, pixelStatus: 'pixel', blurb: 'Schild. Daarna nog een schild.' },
  squid:     { biome: 'sea',   type: 'swim',   shape: 'swimmer', priority: 1, pixelStatus: 'pixel', blurb: 'Armen genoeg voor iedereen.' },
  ray:       { biome: 'sea',   type: 'swim',   shape: 'swimmer', priority: 2, pixelStatus: 'pixel', blurb: 'Glijdt alsof water optioneel is.' },
  /* Wave 3 — deepen wild / crypt / scrap (+ frost/sea). Stub + alias until unique pixels. */
  hawk:      { biome: 'wild',  type: 'fly',    shape: 'flyer',   priority: 1, pixelStatus: 'stub', blurb: 'Duikt alsof jij de muis bent.' },
  ram:       { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Hoorns eerst, excuses later.' },
  cougar:    { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Zachte poot, harde landing.' },
  weasel:    { biome: 'wild',  type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Te smal voor je timing.' },
  porcupine: { biome: 'wild',  type: 'tank',   shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Knuffelen is een slecht plan.' },
  toad:      { biome: 'wild',  type: 'hop',    shape: 'hopper',  priority: 1, pixelStatus: 'stub', blurb: 'Dikker dan een kikker. Nog steeds springt.' },
  ghoul:     { biome: 'crypt', type: 'charge', shape: 'undead',  priority: 1, pixelStatus: 'stub', blurb: 'Honger met een graf-adres.' },
  wraith:    { biome: 'crypt', type: 'fly',    shape: 'flyer',   priority: 1, pixelStatus: 'stub', blurb: 'Half lucht, helemaal lastig.' },
  bonehound: { biome: 'crypt', type: 'charge', shape: 'quad',    priority: 1, pixelStatus: 'stub', blurb: 'Kwispelt met een dijbeen.' },
  revenant:  { biome: 'crypt', type: 'tank',   shape: 'undead',  priority: 1, pixelStatus: 'stub', blurb: 'Was al dood. Komt toch.' },
  shade:     { biome: 'crypt', type: 'shoot',  shape: 'shooter', priority: 1, pixelStatus: 'stub', blurb: 'Schaduw die terugschiet.' },
  welder:    { biome: 'scrap', type: 'shoot',  shape: 'mech',    priority: 1, pixelStatus: 'stub', blurb: 'Vonken zijn het gesprek.' },
  sawbot:    { biome: 'scrap', type: 'charge', shape: 'mech',    priority: 1, pixelStatus: 'stub', blurb: 'Zaag als begroeting.' },
  rustmite:  { biome: 'scrap', type: 'hop',    shape: 'insect',  priority: 1, pixelStatus: 'stub', blurb: 'Klein. Eet metaal. En tempo.' },
  furnace:   { biome: 'scrap', type: 'tank',   shape: 'tank',    priority: 1, pixelStatus: 'stub', blurb: 'Loopende oven. Geen thermostaat.' },
  coil:      { biome: 'scrap', type: 'shoot',  shape: 'shooter', priority: 1, pixelStatus: 'stub', blurb: 'Spoel vol slechte ideeën.' },
  mammoth:   { biome: 'frost', type: 'tank',   shape: 'tank',    priority: 1, pixelStatus: 'stub', blurb: 'Wol + slagtand + deadline.' },
  urchin:    { biome: 'sea',   type: 'swim',   shape: 'insect',  priority: 1, pixelStatus: 'stub', blurb: 'Een bal stekels met een mening.' },
};

const WILD_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'wild'));
const FROST_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'frost'));
const CRYPT_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'crypt'));
const SCRAP_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'scrap'));
const CATALOG_SEA_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].biome === 'sea'));
const CATALOG_P1_PIXEL_ARTS = new Set(Object.keys(MONSTER_ART_SLOTS).filter((id) => MONSTER_ART_SLOTS[id].pixelStatus === 'pixel'));

/**
 * #282 provisional pixel IDs (art families + flagship SPECIES keys).
 * W3 keeps unique `art` for biome/waves; `sp.pixel` aliases these so
 * stub slots can tint existing #282 maps. Dedicated W2 slots skip aliases.
 * See MONSTER-PIXEL-MAP.md on cursor/monster-pixel-art-6c6b / PR #282.
 */
const MONSTER_PIXEL_PROVISIONAL = {
  art: [
    'slime', 'bat', 'hedgehog', 'ghost', 'can', 'fox', 'golem', 'dragon', 'shark', 'octo',
    'cow', 'pig', 'chicken', 'sheep', 'horse', 'goat', 'duck', 'rooster', 'donkey', 'goose',
    'elephant', 'lion', 'tiger', 'giraffe', 'hippo', 'rhino', 'gorilla', 'zebra', 'bear', 'croc',
    'kangaroo', 'panda', 'flamingo', 'camel',
  ],
  species: [
    'holkoe', 'razendzwijn', 'kipophol', 'razendeschaap', 'holpaard', 'kopstootgeit',
    'kwakophol', 'haanophol', 'koppigeezel', 'gansophol', 'reuzenolifant', 'razendeleeuw',
    'razendetijger', 'langegiraffe', 'razendnijlpaard', 'razendeneushoorn', 'woestegorilla',
    'razendezebra', 'razendebeer', 'razendekrokodil', 'razendekangoeroe', 'woestepanda',
    'razendeflamingo', 'razendekameel', 'voidsly', 'frostbub', 'lavablob', 'voidkonijn',
    'omegadrake', 'levihaai', 'voidocto',
  ],
};
const MONSTER_PIXEL_PROVISIONAL_SET = new Set([
  ...MONSTER_PIXEL_PROVISIONAL.art,
  ...MONSTER_PIXEL_PROVISIONAL.species,
]);

/** Closest #282 map per W2 art. `high` = mythic / nightmare / hell flagship. */
const MONSTER_PIXEL_ALIAS = {
  wolf: { pixel: 'fox', high: 'voidkonijn' },
  owl: { pixel: 'bat' },
  frog: { pixel: 'slime', high: 'voidsly' },
  snake: { pixel: 'croc', high: 'razendekrokodil' },
  boar: { pixel: 'pig', high: 'razendzwijn' },
  raven: { pixel: 'bat' },
  moose: { pixel: 'cow', high: 'holkoe' },
  beaver: { pixel: 'pig' },
  badger: { pixel: 'hedgehog' },
  stag: { pixel: 'horse', high: 'holpaard' },
  lynx: { pixel: 'tiger', high: 'razendetijger' },
  mole: { pixel: 'slime', high: 'frostbub' },
  skeleton: { pixel: 'ghost' },
  mummy: { pixel: 'golem' },
  beetle: { pixel: 'hedgehog' },
  wasp: { pixel: 'bat' },
  spider: { pixel: 'octo' },
  wisp: { pixel: 'ghost' },
  gargoyle: { pixel: 'dragon', high: 'omegadrake' },
  lich: { pixel: 'ghost' },
  drone: { pixel: 'can' },
  bot: { pixel: 'can' },
  scrapdog: { pixel: 'fox', high: 'voidkonijn' },
  cog: { pixel: 'can' },
  turret: { pixel: 'can' },
  rivet: { pixel: 'golem' },
  junkbat: { pixel: 'bat' },
  piston: { pixel: 'golem' },
  penguin: { pixel: 'duck', high: 'kwakophol' },
  yeti: { pixel: 'bear', high: 'razendebeer' },
  walrus: { pixel: 'hippo', high: 'razendnijlpaard' },
  seal: { pixel: 'duck' },
  crab: { pixel: 'hedgehog' },
  turtle: { pixel: 'golem' },
  squid: { pixel: 'octo', high: 'voidocto' },
  ray: { pixel: 'shark', high: 'levihaai' },
  hawk: { pixel: 'bat' },
  ram: { pixel: 'goat', high: 'kopstootgeit' },
  cougar: { pixel: 'tiger', high: 'razendetijger' },
  weasel: { pixel: 'fox', high: 'voidkonijn' },
  porcupine: { pixel: 'hedgehog' },
  toad: { pixel: 'slime', high: 'voidsly' },
  ghoul: { pixel: 'ghost' },
  wraith: { pixel: 'ghost' },
  bonehound: { pixel: 'fox', high: 'voidkonijn' },
  revenant: { pixel: 'golem' },
  shade: { pixel: 'ghost' },
  welder: { pixel: 'can' },
  sawbot: { pixel: 'can' },
  rustmite: { pixel: 'hedgehog' },
  furnace: { pixel: 'golem' },
  coil: { pixel: 'can' },
  mammoth: { pixel: 'elephant', high: 'reuzenolifant' },
  urchin: { pixel: 'hedgehog' },
};

function catalogPixelFor(art, rarity) {
  const slot = (typeof MONSTER_ART_SLOTS !== 'undefined' && MONSTER_ART_SLOTS[art]) || {};
  if (slot.pixelStatus === 'pixel') return null;
  const a = MONSTER_PIXEL_ALIAS[art];
  if (!a) return null;
  const order = (typeof rarityOf === 'function')
    ? rarityOf(rarity).order
    : ({ mythic: 5, nightmare: 6, hell: 7 }[rarity] || 0);
  const id = (order >= 5 && a.high) ? a.high : a.pixel;
  return (id && MONSTER_PIXEL_PROVISIONAL_SET.has(id)) ? id : (a.pixel || null);
}

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

/** Wave 3 — 18 families × 8 rarities = 144 species. Deepen wild/crypt/scrap + frost/sea. */
const MONSTER_FAMILIES_W3 = [
  { art: 'hawk', catalog: 'w3', unlock: 5, base: { size: 16, hp: 34, dmg: 9, speed: 116, xp: 12 },
    names: [['havikpup','Havikpup'],['nachthavik','Nachthavik'],['stormhavik','Stormhavik'],['ashavik','Ashavik'],['maanhavik','Maanhavik'],['voidhavik','Voidhavik'],['nmhavik','Nachtmerrie-Havik'],['helhavik','Hel-Havik']],
    colors: catalogColors([['#c98850','#6b4a28'],['#2a1840','#5a3fb0'],['#7cf5ff','#2a7fc0'],['#9a917f','#4a4038'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'ram', catalog: 'w3', unlock: 6, base: { size: 24, hp: 62, dmg: 12, speed: 88, xp: 14 },
    names: [['ramling','Ramling'],['bosram','Bosram'],['kopram','Kopram'],['stormram','Stormram'],['kroonram','Kroonram'],['voidram','Voidram'],['nmram','Nachtmerrie-Ram'],['helram','Hel-Ram']],
    colors: catalogColors([['#d4a574','#8a6030'],['#43b25b','#1e4a28'],['#c98850','#6b4a28'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'cougar', catalog: 'w3', unlock: 8, base: { size: 22, hp: 52, dmg: 13, speed: 122, xp: 15 },
    names: [['poemaling','Poemaling'],['bospoema','Bospoema'],['klauwpoema','Klauwpoema'],['stormpoema','Stormpoema'],['schaduwpoema','Schaduwpoema'],['voidpoema','Voidpoema'],['nmpoema','Nachtmerrie-Poema'],['helpoema','Hel-Poema']],
    colors: catalogColors([['#e8c98a','#8a6030'],['#c98850','#6b4a28'],['#ff8c42','#d05a1e'],['#7cf5ff','#2a7fc0'],['#2a1840','#5a3fb0'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'weasel', catalog: 'w3', unlock: 4, base: { size: 15, hp: 36, dmg: 9, speed: 128, xp: 11 },
    names: [['wezelling','Wezelling'],['boswezel','Boswezel'],['bijtwezel','Bijtwezel'],['stormwezel','Stormwezel'],['schaduwwezel','Schaduwwezel'],['voidwezel','Voidwezel'],['nmwezel','Nachtmerrie-Wezel'],['helwezel','Hel-Wezel']],
    colors: catalogColors([['#c98850','#6b4a28'],['#43b25b','#1e4a28'],['#ff8c42','#d05a1e'],['#7cf5ff','#2a7fc0'],['#2a1840','#5a3fb0'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'porcupine', catalog: 'w3', unlock: 7, base: { size: 18, hp: 58, dmg: 10, speed: 52, xp: 13 },
    names: [['quillpup','Quillpup'],['bosquill','Bosquill'],['pantsquill','Pantsquill'],['stormquill','Stormquill'],['koningquill','Koningquill'],['voidquill','Voidquill'],['nmquill','Nachtmerrie-Quill'],['helquill','Hel-Quill']],
    colors: catalogColors([['#c98850','#8a5a30'],['#43b25b','#1e4a28'],['#9fb2c8','#5f7189'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'toad', catalog: 'w3', unlock: 2, base: { size: 18, hp: 42, dmg: 8, speed: 54, xp: 10 },
    names: [['paddeling','Paddeling'],['moeraspadd','Moeraspadd'],['knorpadd','Knorpadd'],['stormpadd','Stormpadd'],['koningpadd','Koningpadd'],['voidpadd','Voidpadd'],['nmpadd','Nachtmerrie-Pad'],['helpadd','Hel-Pad']],
    colors: catalogColors([['#4a8f52','#1e4a28'],['#5ad06a','#2a6030'],['#c98850','#6b4a28'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#b06ae0','#5a2080'],['#ff3040','#2a0810']]) },
  { art: 'ghoul', catalog: 'w3', unlock: 10, base: { size: 21, hp: 56, dmg: 12, speed: 82, xp: 15 },
    names: [['ghoulling','Ghoulling'],['grafghoul','Grafghoul'],['bijtghoul','Bijtghoul'],['stormghoul','Stormghoul'],['grafvreter','Grafvreter'],['voidghoul','Voidghoul'],['nmghoul','Nachtmerrie-Ghoul'],['helghoul','Hel-Ghoul']],
    colors: catalogColors([['#8a8478','#3a3830'],['#6b5344','#3a2820'],['#9a917f','#4a4038'],['#7cf5ff','#2a7fc0'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'wraith', catalog: 'w3', unlock: 12, base: { size: 17, hp: 40, dmg: 11, speed: 108, xp: 16 },
    names: [['wraithling','Wraithling'],['nachtwraith','Nachtwraith'],['zielwraith','Zielwraith'],['stormwraith','Stormwraith'],['etherwraith','Etherwraith'],['voidwraith','Voidwraith'],['nmwraith','Nachtmerrie-Wraith'],['helwraith','Hel-Wraith']],
    colors: catalogColors([['#cfe6ff','#7aa8cf'],['#2a1840','#5a3fb0'],['#c47aff','#5a2080'],['#7cf5ff','#2a7fc0'],['#a8e0ff','#3a7fc0'],['#5a1040','#ff6b9d'],['#6b5cff','#2e2266'],['#ff3040','#2a0810']]) },
  { art: 'bonehound', catalog: 'w3', unlock: 11, base: { size: 20, hp: 54, dmg: 13, speed: 112, xp: 16 },
    names: [['bothond','Bothond'],['grafhond','Grafhond'],['knokhond','Knokhond'],['stormbothond','Stormbothond'],['grafbek','Grafbek'],['voidbothond','Voidbothond'],['nmbothond','Nachtmerrie-Bothond'],['helbothond','Hel-Bothond']],
    colors: catalogColors([['#dfe8ff','#6a7080'],['#9fb2c8','#5f7189'],['#cfe6ff','#7aa8cf'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'revenant', catalog: 'w3', unlock: 14, base: { size: 24, hp: 80, dmg: 14, speed: 38, xp: 19 },
    names: [['revenling','Revenling'],['grafrev','Grafrev'],['terugkeer','Terugkeer'],['stormrev','Stormrev'],['doodrev','Doodrev'],['voidrev','Voidrev'],['nmrev','Nachtmerrie-Rev'],['helrev','Hel-Rev']],
    colors: catalogColors([['#9a917f','#4a4038'],['#6b5344','#3a2820'],['#dfe8ff','#6a7080'],['#7cf5ff','#2a7fc0'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'shade', catalog: 'w3', unlock: 13, base: { size: 16, hp: 42, dmg: 11, speed: 56, xp: 16 },
    names: [['schimling','Schimling'],['grafschim','Grafschim'],['zielschim','Zielschim'],['stormschim','Stormschim'],['nachtschim','Nachtschim'],['voidschim','Voidschim'],['nmschim','Nachtmerrie-Schim'],['helschim','Hel-Schim']],
    colors: catalogColors([['#505868','#202830'],['#2a1840','#5a3fb0'],['#c47aff','#5a2080'],['#7cf5ff','#2a7fc0'],['#6b5cff','#2e2266'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'welder', catalog: 'w3', unlock: 12, base: { size: 18, hp: 48, dmg: 11, speed: 50, xp: 15 },
    names: [['vonkling','Vonkling'],['lasbrander','Lasbrander'],['vonkbot','Vonkbot'],['stormlas','Stormlas'],['kernlas','Kernlas'],['voidlas','Voidlas'],['nmlas','Nachtmerrie-Las'],['hellas','Hel-Las']],
    colors: catalogColors([['#ff9a42','#8a2020'],['#b86a4a','#6a3820'],['#ffd75e','#c97a20'],['#7cf5ff','#2a7fc0'],['#ff7043','#8a2020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'sawbot', catalog: 'w3', unlock: 13, base: { size: 20, hp: 56, dmg: 13, speed: 102, xp: 16 },
    names: [['zaagling','Zaagling'],['zaagbot','Zaagbot'],['knipzaag','Knipzaag'],['stormzaag','Stormzaag'],['megazaag','Megazaag'],['voidzaag','Voidzaag'],['nmzaag','Nachtmerrie-Zaag'],['helzaag','Hel-Zaag']],
    colors: catalogColors([['#9fb2c8','#5f7189'],['#b86a4a','#6a3820'],['#dfe8ff','#6a7080'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'rustmite', catalog: 'w3', unlock: 9, base: { size: 14, hp: 32, dmg: 8, speed: 78, xp: 11 },
    names: [['roestmijt','Roestmijt'],['schrootmijt','Schrootmijt'],['knaagmijt','Knaagmijt'],['stormmijt','Stormmijt'],['megamijt','Megamijt'],['voidmijt','Voidmijt'],['nmmijt','Nachtmerrie-Mijt'],['helmijt','Hel-Mijt']],
    colors: catalogColors([['#b86a4a','#6a3820'],['#9a917f','#4a4038'],['#c98850','#7a5030'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'furnace', catalog: 'w3', unlock: 16, base: { size: 28, hp: 96, dmg: 15, speed: 28, xp: 20 },
    names: [['ovenling','Ovenling'],['smeltoven','Smeltoven'],['stoofoven','Stoofoven'],['stormoven','Stormoven'],['kernoven','Kernoven'],['voidoven','Voidoven'],['nmoven','Nachtmerrie-Oven'],['heloven','Hel-Oven']],
    colors: catalogColors([['#ff7043','#8a2020'],['#b86a4a','#6a3820'],['#ffd75e','#c97a20'],['#7cf5ff','#2a7fc0'],['#ff9a42','#8a2818'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'coil', catalog: 'w3', unlock: 14, base: { size: 16, hp: 44, dmg: 12, speed: 46, xp: 16 },
    names: [['spoelling','Spoelling'],['vonkspoel','Vonkspoel'],['stroomspoel','Stroomspoel'],['stormspoel','Stormspoel'],['megaspoel','Megaspoel'],['voidspoel','Voidspoel'],['nmspoel','Nachtmerrie-Spoel'],['helspoel','Hel-Spoel']],
    colors: catalogColors([['#7cf5ff','#2a7fc0'],['#9fb2c8','#5f7189'],['#ffe259','#c97a20'],['#6fd7ff','#2a5080'],['#c47aff','#5a2080'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'mammoth', catalog: 'w3', unlock: 15, base: { size: 32, hp: 98, dmg: 16, speed: 32, xp: 21 },
    names: [['manmoetpup','Manmoetpup'],['sneeuwmanmoet','Sneeuwmanmoet'],['slagtandijs','Slagtandijs'],['stormmanmoet','Stormmanmoet'],['kroonmanmoet','Kroonmanmoet'],['voidmanmoet','Voidmanmoet'],['nmmanmoet','Nachtmerrie-Manmoet'],['helmanmoet','Hel-Manmoet']],
    colors: catalogColors([['#dfe8ff','#6a7080'],['#a8e0ff','#3a7fc0'],['#9fb2c8','#5f7189'],['#7cf5ff','#2a7fc0'],['#cfe6ff','#7aa8cf'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
  { art: 'urchin', catalog: 'w3', unlock: 8, base: { size: 15, hp: 38, dmg: 9, speed: 64, xp: 12 },
    names: [['zeeegel','Zeeegel'],['stekelegel','Stekelegel'],['rifegel','Rifegel'],['stormegel','Stormegel'],['koningsegel','Koningsegel'],['voidegel','Voidegel'],['nmegel','Nachtmerrie-Egel'],['helegel','Hel-Egel']],
    colors: catalogColors([['#c47aff','#5a2080'],['#ff7043','#8a2020'],['#43b25b','#1e4a28'],['#7cf5ff','#2a7fc0'],['#ffd75e','#8a6020'],['#5a1040','#ff6b9d'],['#2a1840','#b06ae0'],['#ff3040','#2a0810']]) },
];

function allMonsterCatalogFamilies() {
  return [].concat(MONSTER_FAMILIES_W2 || [], MONSTER_FAMILIES_W3 || []);
}

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
  const list = families || (typeof allMonsterCatalogFamilies === 'function' ? allMonsterCatalogFamilies() : MONSTER_FAMILIES_W2);
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
      const pixelId = catalogPixelFor(fam.art, step.rarity);
      species[id] = {
        name,
        art: fam.art,
        artSlot: fam.art,
        catalog: fam.catalog || 'w2',
        biome: slot.biome || fam.biome || 'classic',
        pixel: pixelId || undefined,
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
    const alias = MONSTER_PIXEL_ALIAS[id] || {};
    return {
      art: id,
      biome: s.biome,
      type: s.type,
      shape: s.shape,
      priority: s.priority,
      pixelStatus: s.pixelStatus,
      pixel: alias.pixel || null,
      pixelHigh: alias.high || null,
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
function frostSpeciesPool(levelN, maxRarityOrder) {
  return catalogSpeciesPool(levelN, maxRarityOrder, FROST_ARTS);
}
function cryptSpeciesPool(levelN, maxRarityOrder) {
  return catalogSpeciesPool(levelN, maxRarityOrder, CRYPT_ARTS);
}
function scrapSpeciesPool(levelN, maxRarityOrder) {
  return catalogSpeciesPool(levelN, maxRarityOrder, SCRAP_ARTS);
}
function reefSpeciesPool(levelN, maxRarityOrder) {
  return catalogSpeciesPool(levelN, maxRarityOrder, CATALOG_SEA_ARTS);
}

function applyCatalogWave(list, pool, n, rarityBias, giantForce, eliteBias) {
  if (!pool || !pool.length || !list || !list.length) return;
  const eliteP = Number(eliteBias) || 0;
  for (let i = 0; i < list.length; i++) {
    if (Math.random() < 0.76) {
      const sp = weightedPick(pool, n, rarityBias);
      list[i].sp = sp;
      if (eliteP && Math.random() < eliteP) list[i].elite = true;
      if (giantForce) list[i].giant = true;
      else list[i].giant = list[i].giant || rollWaveGiant(n, !!list[i].elite, sp, 0);
    }
  }
}

function biomeTelegraphMul(biome) {
  if (biome === 'crypt') return 1.16;
  if (biome === 'scrap') return 0.88;
  if (biome === 'frost') return 1.10;
  if (biome === 'wild') return 0.94;
  if (biome === 'sea') return 1.06;
  return 1;
}

function biomeTechniqueKind(biome) {
  if (biome === 'crypt') return 'spiral_orb';
  if (biome === 'scrap') return 'wave_cannon';
  if (biome === 'frost' || biome === 'wild') return 'lightning_pierce';
  if (biome === 'sea') return 'wave_cannon';
  return null;
}
