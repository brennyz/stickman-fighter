/* ============================ MONSTERS ================================= */
const SPECIES = {
  slymo:     { name: 'Slymo',     art: 'slime',    size: 17, hp: 30,  dmg: 6,  speed: 60,  type: 'hop',    xp: 8,  rarity: 'common',    c1: '#5ad06a', c2: '#2e8f3c' },
  bubbel:    { name: 'Bubbel',    art: 'slime',    size: 15, hp: 28,  dmg: 5,  speed: 70,  type: 'hop',    xp: 9,  rarity: 'common',    c1: '#7cf5ff', c2: '#2f8fc0' },
  flapper:   { name: 'Flapper',   art: 'bat',      size: 14, hp: 24,  dmg: 5,  speed: 95,  type: 'fly',    xp: 9,  rarity: 'common',    c1: '#8a6cf0', c2: '#5a3fb0' },
  piepvleugel:{ name: 'Piepvleugel', art: 'bat',   size: 13, hp: 22,  dmg: 6,  speed: 115, type: 'fly',    xp: 10, rarity: 'uncommon',  c1: '#ff9ad5', c2: '#c04590' },
  stekelra:  { name: 'Stekelra',  art: 'hedgehog', size: 15, hp: 40,  dmg: 9,  speed: 70,  type: 'charge', xp: 12, rarity: 'uncommon',  c1: '#c98850', c2: '#8a5a30' },
  ijzerstek: { name: 'Ijzerstek', art: 'hedgehog', size: 16, hp: 52,  dmg: 11, speed: 65,  type: 'charge', xp: 16, rarity: 'rare',      c1: '#9fb2c8', c2: '#5f7189' },
  spooki:    { name: 'Spooki',    art: 'ghost',    size: 16, hp: 34,  dmg: 7,  speed: 55,  type: 'shoot',  xp: 13, rarity: 'uncommon',  c1: '#cfe6ff', c2: '#7aa8cf' },
  nachtwolk: { name: 'Nachtwolk', art: 'ghost',    size: 18, hp: 48,  dmg: 10, speed: 50,  type: 'shoot',  xp: 18, rarity: 'rare',      c1: '#6b5cff', c2: '#2e2266' },
  blikkert:  { name: 'Blikkert',  art: 'can',      size: 16, hp: 46,  dmg: 8,  speed: 45,  type: 'shoot',  xp: 14, rarity: 'uncommon',  c1: '#9fb2c8', c2: '#5f7189' },
  laserblik: { name: 'Laserblik', art: 'can',      size: 17, hp: 58,  dmg: 12, speed: 50,  type: 'shoot',  xp: 20, rarity: 'rare',      c1: '#ff6b6b', c2: '#8a2020' },
  vlamvos:   { name: 'Vlamvos',   art: 'fox',      size: 16, hp: 38,  dmg: 9,  speed: 130, type: 'charge', xp: 15, rarity: 'rare',      c1: '#ff8c42', c2: '#d05a1e' },
  stormvos:  { name: 'Stormvos',  art: 'fox',      size: 17, hp: 55,  dmg: 13, speed: 150, type: 'charge', xp: 24, rarity: 'epic',      c1: '#7cf5ff', c2: '#2a7fc0' },
  rotsbonk:  { name: 'Rotsbonk',  art: 'golem',    size: 25, hp: 95,  dmg: 14, speed: 30,  type: 'tank',   xp: 24, rarity: 'epic',      c1: '#9a917f', c2: '#6b6355' },
  magmabon:  { name: 'Magmabon',  art: 'golem',    size: 28, hp: 130, dmg: 18, speed: 28,  type: 'tank',   xp: 36, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  vlamdraak: { name: 'Vlamdraak', art: 'dragon',   size: 30, hp: 170, dmg: 16, speed: 70,  type: 'dragon', xp: 48, rarity: 'legendary', c1: '#e04f4f', c2: '#93262b' },
  kristallo: { name: 'Kristallo', art: 'dragon',   size: 34, hp: 280, dmg: 20, speed: 85,  type: 'dragon', xp: 75, rarity: 'legendary', c1: '#6fd7ff', c2: '#2f7fc0' },
  schaduwvorst:{ name: 'Schaduwvorst', art: 'dragon', size: 36, hp: 340, dmg: 24, speed: 95, type: 'dragon', xp: 95, rarity: 'mythic', c1: '#2a1840', c2: '#b06ae0' },
  voidkonijn:{ name: 'Voidkonijn', art: 'fox',     size: 20, hp: 220, dmg: 22, speed: 140, type: 'charge', xp: 110, rarity: 'mythic',  c1: '#ff6b9d', c2: '#5a1040' },
  guvvedrak: { name: 'Guvvedrak', art: 'dragon',   size: 38, hp: 420, dmg: 28, speed: 100, type: 'dragon', xp: 140, rarity: 'mythic',  c1: '#ffe259', c2: '#43b25b' },
  /* --- Deel 1/2 horde-expansie: +40 soorten --- */
  moerasly:    { name: 'Moerasly',    art: 'slime',    size: 16, hp: 32,  dmg: 6,  speed: 58,  type: 'hop',    xp: 8,  rarity: 'common',    c1: '#4a8f52', c2: '#1e4a28' },
  paddensly:   { name: 'Paddensly',   art: 'slime',    size: 18, hp: 36,  dmg: 7,  speed: 52,  type: 'hop',    xp: 10, rarity: 'uncommon',  c1: '#7ad06a', c2: '#3a7a42' },
  giftbub:     { name: 'Giftbub',     art: 'slime',    size: 15, hp: 30,  dmg: 8,  speed: 64,  type: 'hop',    xp: 11, rarity: 'uncommon',  c1: '#b06ae0', c2: '#5a3080' },
  frostbub:    { name: 'Frostbub',    art: 'slime',    size: 17, hp: 42,  dmg: 9,  speed: 62,  type: 'hop',    xp: 14, rarity: 'rare',      c1: '#a8e0ff', c2: '#3a7fc0' },
  lavablob:    { name: 'Lavablo',     art: 'slime',    size: 19, hp: 55,  dmg: 11, speed: 55,  type: 'hop',    xp: 20, rarity: 'epic',      c1: '#ff7043', c2: '#8a2818' },
  toxbub:      { name: 'Toxbub',      art: 'slime',    size: 18, hp: 48,  dmg: 10, speed: 60,  type: 'hop',    xp: 17, rarity: 'rare',      c1: '#9fd06a', c2: '#4a7030' },
  voidsly:     { name: 'Voidsly',     art: 'slime',    size: 20, hp: 88,  dmg: 14, speed: 68,  type: 'hop',    xp: 42, rarity: 'mythic',    c1: '#5a1040', c2: '#ff6b9d' },
  dwergvleerm: { name: 'Dwergvleerm', art: 'bat',      size: 12, hp: 20,  dmg: 5,  speed: 105, type: 'fly',    xp: 8,  rarity: 'common',    c1: '#6b7690', c2: '#3a4258' },
  piekbout:    { name: 'Piekbout',    art: 'hedgehog', size: 14, hp: 36,  dmg: 8,  speed: 72,  type: 'charge', xp: 10, rarity: 'common',    c1: '#a3763f', c2: '#6b4a28' },
  koperblik:   { name: 'Koperblik',   art: 'can',      size: 15, hp: 42,  dmg: 7,  speed: 48,  type: 'shoot',  xp: 9,  rarity: 'common',    c1: '#c98850', c2: '#7a5030' },
  nachtschaduw:{ name: 'Nachtschaduw',art: 'bat',      size: 14, hp: 26,  dmg: 6,  speed: 100, type: 'fly',    xp: 10, rarity: 'uncommon',  c1: '#2a1840', c2: '#5a3fb0' },
  kegelbeest:  { name: 'Kegelbeest',  art: 'hedgehog', size: 16, hp: 44,  dmg: 10, speed: 68,  type: 'charge', xp: 13, rarity: 'uncommon',  c1: '#d4a574', c2: '#8a6030' },
  roestblik:   { name: 'Roestblik',   art: 'can',      size: 16, hp: 50,  dmg: 9,  speed: 46,  type: 'shoot',  xp: 12, rarity: 'uncommon',  c1: '#b86a4a', c2: '#6a3820' },
  zandgeest:   { name: 'Zandgeest',   art: 'ghost',    size: 15, hp: 36,  dmg: 7,  speed: 52,  type: 'shoot',  xp: 11, rarity: 'uncommon',  c1: '#e8c98a', c2: '#8a6030' },
  mistgeest:   { name: 'Mistgeest',   art: 'ghost',    size: 17, hp: 38,  dmg: 8,  speed: 54,  type: 'shoot',  xp: 12, rarity: 'uncommon',  c1: '#dfe8ff', c2: '#7aa8cf' },
  ijsvos:      { name: 'Ijsvos',      art: 'fox',      size: 16, hp: 42,  dmg: 10, speed: 125, type: 'charge', xp: 14, rarity: 'uncommon',  c1: '#a8e0ff', c2: '#3a7fc0' },
  oervaamp:    { name: 'Oervaamp',    art: 'bat',      size: 15, hp: 28,  dmg: 7,  speed: 108, type: 'fly',    xp: 13, rarity: 'rare',      c1: '#ffd75e', c2: '#c97a20' },
  kristaldrek: { name: 'Kristaldrek', art: 'hedgehog', size: 17, hp: 56,  dmg: 12, speed: 66,  type: 'charge', xp: 17, rarity: 'rare',      c1: '#6fd7ff', c2: '#2f7fc0' },
  plasmafles:  { name: 'Plasmafles',  art: 'can',      size: 18, hp: 62,  dmg: 13, speed: 52,  type: 'shoot',  xp: 19, rarity: 'rare',      c1: '#7cf5ff', c2: '#2a7fc0' },
  zielenschemer:{ name: 'Zielenschemer', art: 'ghost', size: 18, hp: 52,  dmg: 10, speed: 50,  type: 'shoot',  xp: 17, rarity: 'rare',      c1: '#c47aff', c2: '#5a2080' },
  bliksemvos:  { name: 'Bliksemvos',  art: 'fox',      size: 17, hp: 52,  dmg: 12, speed: 145, type: 'charge', xp: 20, rarity: 'rare',      c1: '#ffe259', c2: '#c97a20' },
  granietkolos:{ name: 'Granietkolos',art: 'golem',    size: 26, hp: 105, dmg: 15, speed: 32,  type: 'tank',   xp: 22, rarity: 'rare',      c1: '#8a8478', c2: '#5a5548' },
  gloeidrake:  { name: 'Gloeidrake',  art: 'dragon',   size: 28, hp: 155, dmg: 17, speed: 72,  type: 'dragon', xp: 28, rarity: 'rare',      c1: '#ff9a42', c2: '#c04018' },
  stormer:     { name: 'Stormer',     art: 'bat',      size: 16, hp: 32,  dmg: 9,  speed: 118, type: 'fly',    xp: 18, rarity: 'epic',      c1: '#7cf5ff', c2: '#2a7fc0' },
  thorndrake:  { name: 'Thorndrake',  art: 'hedgehog', size: 18, hp: 68,  dmg: 13, speed: 70,  type: 'charge', xp: 22, rarity: 'epic',      c1: '#5ad06a', c2: '#2a6030' },
  stoomkan:    { name: 'Stoomkan',    art: 'can',      size: 18, hp: 66,  dmg: 14, speed: 48,  type: 'shoot',  xp: 21, rarity: 'epic',      c1: '#dfe8ff', c2: '#6a7080' },
  banjaa:      { name: 'Banjaa',      art: 'ghost',    size: 19, hp: 62,  dmg: 12, speed: 48,  type: 'shoot',  xp: 22, rarity: 'epic',      c1: '#ffb0b8', c2: '#8a3040' },
  asvos:       { name: 'Asvos',       art: 'fox',      size: 18, hp: 58,  dmg: 14, speed: 148, type: 'charge', xp: 26, rarity: 'epic',      c1: '#9a917f', c2: '#4a4038' },
  sliksteen:   { name: 'Sliksteen',   art: 'golem',    size: 29, hp: 145, dmg: 19, speed: 29,  type: 'tank',   xp: 32, rarity: 'epic',      c1: '#6b5344', c2: '#3a2820' },
  stormwyrm:   { name: 'Stormwyrm',   art: 'dragon',   size: 32, hp: 195, dmg: 19, speed: 88,  type: 'dragon', xp: 38, rarity: 'epic',      c1: '#6fd7ff', c2: '#2a5080' },
  schimmervleerm:{ name: 'Schimmervleerm', art: 'bat', size: 17, hp: 38,  dmg: 10, speed: 112, type: 'fly',    xp: 24, rarity: 'legendary', c1: '#b06ae0', c2: '#5a2080' },
  ijzerklauw:  { name: 'Ijzerklauw',  art: 'hedgehog', size: 19, hp: 78,  dmg: 14, speed: 68,  type: 'charge', xp: 28, rarity: 'legendary', c1: '#9fb2c8', c2: '#4a5568' },
  ethergeest:  { name: 'Ethergeest',  art: 'ghost',    size: 20, hp: 72,  dmg: 13, speed: 46,  type: 'shoot',  xp: 30, rarity: 'legendary', c1: '#7cf5ff', c2: '#2a7fc0' },
  vuurstorm:   { name: 'Vuurstorm',   art: 'fox',      size: 19, hp: 68,  dmg: 15, speed: 152, type: 'charge', xp: 32, rarity: 'legendary', c1: '#ff7043', c2: '#a02818' },
  obsidianaut: { name: 'Obsidianaut', art: 'golem',    size: 30, hp: 165, dmg: 21, speed: 27,  type: 'tank',   xp: 40, rarity: 'legendary', c1: '#2a1840', c2: '#6a5080' },
  titanbonk:   { name: 'Titanbonk',   art: 'golem',    size: 32, hp: 185, dmg: 22, speed: 26,  type: 'tank',   xp: 44, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  zeewyrm:     { name: 'Zeewyrm',     art: 'dragon',   size: 35, hp: 260, dmg: 22, speed: 92,  type: 'dragon', xp: 55, rarity: 'legendary', c1: '#4a9fff', c2: '#1a4080' },
  neondrake:   { name: 'Neondrake',   art: 'dragon',   size: 36, hp: 310, dmg: 24, speed: 98,  type: 'dragon', xp: 72, rarity: 'mythic',    c1: '#7cf5ff', c2: '#ff6b9d' },
  etherwyrm:   { name: 'Etherwyrm',   art: 'dragon',   size: 37, hp: 360, dmg: 26, speed: 102, type: 'dragon', xp: 88, rarity: 'mythic',    c1: '#c47aff', c2: '#2a1840' },
  omegadrake:  { name: 'Omegadrake',  art: 'dragon',   size: 39, hp: 400, dmg: 27, speed: 105, type: 'dragon', xp: 120, rarity: 'mythic',   c1: '#ffe259', c2: '#e04f4f' },
  /* --- Deel 2/2 horde-expansie: +55 soorten (114 totaal = 6× bestiary) --- */
    kleiply: { name: 'Kleiply', art: 'slime', size: 15, hp: 30, dmg: 5, speed: 56, type: 'hop', xp: 7, rarity: 'common', c1: '#4a8f52', c2: '#1e4a28' },
    spinbub: { name: 'Spinbub', art: 'slime', size: 15, hp: 32, dmg: 6, speed: 58, type: 'hop', xp: 8, rarity: 'common', c1: '#7ad06a', c2: '#3a7a42' },
    hongerly: { name: 'Hongerly', art: 'slime', size: 16, hp: 38, dmg: 7, speed: 60, type: 'hop', xp: 10, rarity: 'uncommon', c1: '#b06ae0', c2: '#5a3080' },
    parelsly: { name: 'Parelsly', art: 'slime', size: 17, hp: 39, dmg: 6, speed: 62, type: 'hop', xp: 10, rarity: 'uncommon', c1: '#a8e0ff', c2: '#3a7fc0' },
    modderblob: { name: 'Modderblob', art: 'slime', size: 17, hp: 41, dmg: 8, speed: 64, type: 'hop', xp: 12, rarity: 'rare', c1: '#ff7043', c2: '#8a2818' },
    crystalbub: { name: 'Crystalbub', art: 'slime', size: 15, hp: 48, dmg: 9, speed: 65, type: 'hop', xp: 14, rarity: 'epic', c1: '#6fd7ff', c2: '#2f7fc0' },
    chaosly: { name: 'Chaosly', art: 'slime', size: 16, hp: 58, dmg: 10, speed: 58, type: 'hop', xp: 19, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
    zwerm: { name: 'Zwerm', art: 'bat', size: 13, hp: 24, dmg: 5, speed: 105, type: 'fly', xp: 8, rarity: 'common', c1: '#6b7690', c2: '#3a4258' },
    karmijnvleerm: { name: 'Karmijnvleerm', art: 'bat', size: 14, hp: 26, dmg: 6, speed: 108, type: 'fly', xp: 9, rarity: 'common', c1: '#8a6cf0', c2: '#5a3fb0' },
    echovleerm: { name: 'Echovleerm', art: 'bat', size: 15, hp: 31, dmg: 6, speed: 96, type: 'fly', xp: 11, rarity: 'uncommon', c1: '#2a1840', c2: '#5a3fb0' },
    spiegelvleerm: { name: 'Spiegelvleerm', art: 'bat', size: 15, hp: 32, dmg: 7, speed: 99, type: 'fly', xp: 12, rarity: 'uncommon', c1: '#ff9ad5', c2: '#c04590' },
    voidvleerm: { name: 'Voidvleerm', art: 'bat', size: 13, hp: 34, dmg: 8, speed: 102, type: 'fly', xp: 13, rarity: 'rare', c1: '#7cf5ff', c2: '#2a7fc0' },
    duskwing: { name: 'Duskwing', art: 'bat', size: 14, hp: 46, dmg: 10, speed: 108, type: 'fly', xp: 20, rarity: 'legendary', c1: '#ffd75e', c2: '#c97a20' },
    glimwing: { name: 'Glimwing', art: 'bat', size: 16, hp: 58, dmg: 13, speed: 111, type: 'fly', xp: 28, rarity: 'mythic', c1: '#b06ae0', c2: '#5a2080' },
    bronzenstek: { name: 'Bronzenstek', art: 'hedgehog', size: 15, hp: 40, dmg: 9, speed: 68, type: 'charge', xp: 10, rarity: 'common', c1: '#a3763f', c2: '#6b4a28' },
    koperstek: { name: 'Koperstek', art: 'hedgehog', size: 16, hp: 42, dmg: 8, speed: 70, type: 'charge', xp: 11, rarity: 'common', c1: '#c98850', c2: '#8a5a30' },
    froststek: { name: 'Froststek', art: 'hedgehog', size: 16, hp: 49, dmg: 10, speed: 72, type: 'charge', xp: 13, rarity: 'uncommon', c1: '#6fd7ff', c2: '#2f7fc0' },
    kolossstek: { name: 'Kolossstek', art: 'hedgehog', size: 14, hp: 52, dmg: 10, speed: 64, type: 'charge', xp: 14, rarity: 'rare', c1: '#5ad06a', c2: '#2a6030' },
    thornox: { name: 'Thornox', art: 'hedgehog', size: 15, hp: 62, dmg: 13, speed: 66, type: 'charge', xp: 18, rarity: 'epic', c1: '#9fb2c8', c2: '#4a5568' },
    spineclaw: { name: 'Spineclaw', art: 'hedgehog', size: 16, hp: 76, dmg: 16, speed: 68, type: 'charge', xp: 24, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
    quillfang: { name: 'Quillfang', art: 'hedgehog', size: 17, hp: 92, dmg: 17, speed: 70, type: 'charge', xp: 34, rarity: 'mythic', c1: '#ff6b9d', c2: '#5a1040' },
    spookvlam: { name: 'Spookvlam', art: 'ghost', size: 15, hp: 38, dmg: 7, speed: 52, type: 'shoot', xp: 11, rarity: 'uncommon', c1: '#cfe6ff', c2: '#7aa8cf' },
    koudspook: { name: 'Koudspook', art: 'ghost', size: 16, hp: 44, dmg: 9, speed: 54, type: 'shoot', xp: 14, rarity: 'rare', c1: '#6b5cff', c2: '#2e2266' },
    spiraalgeest: { name: 'Spiraalgeest', art: 'ghost', size: 17, hp: 46, dmg: 9, speed: 50, type: 'shoot', xp: 15, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
    wispgeest: { name: 'Wispgeest', art: 'ghost', size: 16, hp: 54, dmg: 11, speed: 50, type: 'shoot', xp: 17, rarity: 'epic', c1: '#ffb0b8', c2: '#8a3040' },
    nexusgeest: { name: 'Nexusgeest', art: 'ghost', size: 17, hp: 68, dmg: 12, speed: 54, type: 'shoot', xp: 22, rarity: 'legendary', c1: '#7cf5ff', c2: '#2a7fc0' },
    mistwraith: { name: 'Mistwraith', art: 'ghost', size: 18, hp: 72, dmg: 14, speed: 55, type: 'shoot', xp: 26, rarity: 'mythic', c1: '#2a1840', c2: '#b06ae0' },
    palewraith: { name: 'Palewraith', art: 'ghost', size: 16, hp: 56, dmg: 10, speed: 52, type: 'shoot', xp: 18, rarity: 'epic', c1: '#dfe8ff', c2: '#6a7080' },
    olieblik: { name: 'Olieblik', art: 'can', size: 15, hp: 44, dmg: 7, speed: 48, type: 'shoot', xp: 9, rarity: 'common', c1: '#c98850', c2: '#7a5030' },
    batterijkan: { name: 'Batterijkan', art: 'can', size: 16, hp: 46, dmg: 8, speed: 46, type: 'shoot', xp: 10, rarity: 'common', c1: '#9fb2c8', c2: '#5f7189' },
    schrootblik: { name: 'Schrootblik', art: 'can', size: 16, hp: 52, dmg: 9, speed: 47, type: 'shoot', xp: 12, rarity: 'uncommon', c1: '#b86a4a', c2: '#6a3820' },
    turboblok: { name: 'Turboblok', art: 'can', size: 17, hp: 58, dmg: 11, speed: 49, type: 'shoot', xp: 15, rarity: 'rare', c1: '#ff6b6b', c2: '#8a2020' },
    ionkan: { name: 'Ionkan', art: 'can', size: 18, hp: 64, dmg: 13, speed: 51, type: 'shoot', xp: 18, rarity: 'epic', c1: '#7cf5ff', c2: '#2a7fc0' },
    quantumkan: { name: 'Quantumkan', art: 'can', size: 18, hp: 72, dmg: 14, speed: 50, type: 'shoot', xp: 22, rarity: 'legendary', c1: '#ffd75e', c2: '#c97a20' },
    omegacan: { name: 'Omegacan', art: 'can', size: 19, hp: 82, dmg: 16, speed: 48, type: 'shoot', xp: 28, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
    zilvervos: { name: 'Zilvervos', art: 'fox', size: 16, hp: 44, dmg: 10, speed: 125, type: 'charge', xp: 13, rarity: 'uncommon', c1: '#dfe8ff', c2: '#6a7080' },
    maanvos: { name: 'Maanvos', art: 'fox', size: 16, hp: 50, dmg: 11, speed: 130, type: 'charge', xp: 16, rarity: 'rare', c1: '#ffe259', c2: '#c97a20' },
    jadevos: { name: 'Jadevos', art: 'fox', size: 17, hp: 52, dmg: 12, speed: 132, type: 'charge', xp: 17, rarity: 'rare', c1: '#43b25b', c2: '#2a6030' },
    stellarvos: { name: 'Stellarvos', art: 'fox', size: 17, hp: 58, dmg: 14, speed: 138, type: 'charge', xp: 20, rarity: 'epic', c1: '#ff7043', c2: '#a02818' },
    kosmischvos: { name: 'Kosmischvos', art: 'fox', size: 18, hp: 66, dmg: 15, speed: 142, type: 'charge', xp: 24, rarity: 'legendary', c1: '#7cf5ff', c2: '#2a7fc0' },
    emberfox: { name: 'Emberfox', art: 'fox', size: 17, hp: 60, dmg: 13, speed: 135, type: 'charge', xp: 21, rarity: 'epic', c1: '#ff8c42', c2: '#d05a1e' },
    shadowfox: { name: 'Shadowfox', art: 'fox', size: 19, hp: 78, dmg: 18, speed: 145, type: 'charge', xp: 30, rarity: 'mythic', c1: '#5a1040', c2: '#ff6b9d' },
    leisteen: { name: 'Leisteen', art: 'golem', size: 25, hp: 98, dmg: 14, speed: 31, type: 'tank', xp: 20, rarity: 'uncommon', c1: '#8a8478', c2: '#5a5548' },
    marmerbonk: { name: 'Marmerbonk', art: 'golem', size: 26, hp: 108, dmg: 15, speed: 30, type: 'tank', xp: 22, rarity: 'rare', c1: '#9a917f', c2: '#6b6355' },
    koraalbonk: { name: 'Koraalbonk', art: 'golem', size: 27, hp: 115, dmg: 16, speed: 29, type: 'tank', xp: 24, rarity: 'rare', c1: '#e8c98a', c2: '#8a6030' },
    barnsteen: { name: 'Barnsteen', art: 'golem', size: 28, hp: 132, dmg: 18, speed: 28, type: 'tank', xp: 28, rarity: 'epic', c1: '#ff7043', c2: '#8a2020' },
    adamantbonk: { name: 'Adamantbonk', art: 'golem', size: 29, hp: 158, dmg: 20, speed: 27, type: 'tank', xp: 34, rarity: 'legendary', c1: '#2a1840', c2: '#6a5080' },
    basaltbonk: { name: 'Basaltbonk', art: 'golem', size: 28, hp: 138, dmg: 19, speed: 28, type: 'tank', xp: 30, rarity: 'epic', c1: '#9fb2c8', c2: '#4a5568' },
    titanrock: { name: 'Titanrock', art: 'golem', size: 31, hp: 175, dmg: 22, speed: 26, type: 'tank', xp: 38, rarity: 'mythic', c1: '#ffd75e', c2: '#8a6020' },
    mistwyrm: { name: 'Mistwyrm', art: 'dragon', size: 28, hp: 165, dmg: 17, speed: 76, type: 'dragon', xp: 26, rarity: 'rare', c1: '#6fd7ff', c2: '#2a5080' },
    sandwyrm: { name: 'Sandwyrm', art: 'dragon', size: 29, hp: 172, dmg: 18, speed: 78, type: 'dragon', xp: 28, rarity: 'rare', c1: '#e8c98a', c2: '#8a6030' },
    frostwyrm: { name: 'Frostwyrm', art: 'dragon', size: 30, hp: 188, dmg: 19, speed: 82, type: 'dragon', xp: 32, rarity: 'epic', c1: '#a8e0ff', c2: '#3a7fc0' },
    chaoswyrm: { name: 'Chaoswyrm', art: 'dragon', size: 32, hp: 225, dmg: 22, speed: 88, type: 'dragon', xp: 42, rarity: 'legendary', c1: '#b06ae0', c2: '#5a2080' },
    prismewyrm: { name: 'Prismewyrm', art: 'dragon', size: 33, hp: 240, dmg: 23, speed: 90, type: 'dragon', xp: 48, rarity: 'legendary', c1: '#7cf5ff', c2: '#ff6b9d' },
    apexwyrm: { name: 'Apexwyrm', art: 'dragon', size: 35, hp: 285, dmg: 25, speed: 95, type: 'dragon', xp: 58, rarity: 'mythic', c1: '#ffe259', c2: '#e04f4f' },
  /* --- Tide zee-expansie: haaien & octo's --- */
  rifhaai: { name: 'Rifhaai', art: 'shark', size: 18, hp: 34, dmg: 8, speed: 118, type: 'swim', xp: 10, rarity: 'common', c1: '#6a9fc8', c2: '#2a5080' },
  snelvin: { name: 'Snelvin', art: 'shark', size: 17, hp: 32, dmg: 7, speed: 128, type: 'swim', xp: 11, rarity: 'common', c1: '#8fb8d8', c2: '#3a6088' },
  hamerkop: { name: 'Hamerkop', art: 'shark', size: 19, hp: 42, dmg: 10, speed: 105, type: 'swim', xp: 13, rarity: 'uncommon', c1: '#7aa8cf', c2: '#2f6088' },
  tijvin: { name: 'Tijvin', art: 'shark', size: 20, hp: 52, dmg: 12, speed: 115, type: 'swim', xp: 17, rarity: 'rare', c1: '#5a8fd4', c2: '#1a4080' },
  neonhaai: { name: 'Neonhaai', art: 'shark', size: 22, hp: 68, dmg: 14, speed: 120, type: 'swim', xp: 26, rarity: 'epic', c1: '#7cf5ff', c2: '#2a7fc0' },
  abysshaai: { name: 'Abysshaai', art: 'shark', size: 24, hp: 95, dmg: 16, speed: 122, type: 'swim', xp: 38, rarity: 'legendary', c1: '#2a5080', c2: '#0a1830' },
  levihaai: { name: 'Levihaai', art: 'shark', size: 26, hp: 120, dmg: 18, speed: 108, type: 'swim', xp: 52, rarity: 'mythic', c1: '#4a9fff', c2: '#0a2040' },
  octo: { name: 'Octo', art: 'octo', size: 16, hp: 30, dmg: 6, speed: 52, type: 'swim', xp: 9, rarity: 'common', c1: '#c47aff', c2: '#5a2080' },
  inktvissie: { name: 'Inktvissie', art: 'octo', size: 17, hp: 36, dmg: 7, speed: 48, type: 'swim', xp: 11, rarity: 'uncommon', c1: '#b06ae0', c2: '#4a1870' },
  koraalocto: { name: 'Koraalocto', art: 'octo', size: 18, hp: 44, dmg: 9, speed: 50, type: 'swim', xp: 14, rarity: 'uncommon', c1: '#ff9ad5', c2: '#8a3060' },
  dieptocto: { name: 'Dieptocto', art: 'octo', size: 19, hp: 58, dmg: 11, speed: 46, type: 'swim', xp: 20, rarity: 'rare', c1: '#6b5cff', c2: '#2e2266' },
  stormocto: { name: 'Stormocto', art: 'octo', size: 21, hp: 72, dmg: 13, speed: 54, type: 'swim', xp: 28, rarity: 'epic', c1: '#7cf5ff', c2: '#2a7fc0' },
  krakenling: { name: 'Krakenling', art: 'octo', size: 28, hp: 155, dmg: 17, speed: 42, type: 'swim', xp: 48, rarity: 'legendary', c1: '#2a1840', c2: '#6ee06e' },
  voidocto: { name: 'Voidocto', art: 'octo', size: 24, hp: 98, dmg: 15, speed: 50, type: 'swim', xp: 42, rarity: 'mythic', c1: '#5a1040', c2: '#ff6b9d' },
  /* Satan — stall-baas na 10× falen; nooit in normale golven */
  satan: { name: 'Satan', art: 'satan', size: 96, hp: 220, dmg: 18, speed: 78, type: 'charge', xp: 160, rarity: 'mythic', c1: '#ff3040', c2: '#2a0810' },
  /* --- Boerderij op hol: reuzen-boerderijdieren --- */
  holkoe: { name: 'Holkoe', art: 'cow', size: 34, hp: 57, dmg: 8, speed: 38, type: 'tank', xp: 10, rarity: 'common', c1: '#c98850', c2: '#6b4a28' },
  razendeholkoe: { name: 'Razende Holkoe', art: 'cow', size: 35, hp: 90, dmg: 11, speed: 41, type: 'tank', xp: 18, rarity: 'uncommon', c1: '#d4a574', c2: '#6b4a28' },
  stampkoe: { name: 'Stampkoe', art: 'cow', size: 36, hp: 122, dmg: 13, speed: 44, type: 'tank', xp: 26, rarity: 'rare', c1: '#ff9ad5', c2: '#8a3060' },
  melkkolos: { name: 'Melkkolos', art: 'cow', size: 37, hp: 154, dmg: 16, speed: 47, type: 'tank', xp: 34, rarity: 'epic', c1: '#43b25b', c2: '#1e4a28' },
  boerenbonk: { name: 'Boerenbonk', art: 'cow', size: 38, hp: 186, dmg: 18, speed: 50, type: 'tank', xp: 42, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  woesteholkoe: { name: 'Woeste Holkoe', art: 'cow', size: 39, hp: 218, dmg: 21, speed: 53, type: 'tank', xp: 50, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
  razendzwijn: { name: 'Razend Zwijn', art: 'pig', size: 30, hp: 50, dmg: 8, speed: 95, type: 'charge', xp: 10, rarity: 'common', c1: '#7ad06a', c2: '#2a6030' },
  modderzwijn: { name: 'Modderzwijn', art: 'pig', size: 31, hp: 78, dmg: 11, speed: 103, type: 'charge', xp: 18, rarity: 'uncommon', c1: '#ff7043', c2: '#8a2020' },
  stootzwijn: { name: 'Stootzwijn', art: 'pig', size: 32, hp: 106, dmg: 13, speed: 111, type: 'charge', xp: 26, rarity: 'rare', c1: '#ffb0b8', c2: '#8a3040' },
  spekzwaai: { name: 'Spekzwaai', art: 'pig', size: 33, hp: 134, dmg: 16, speed: 119, type: 'charge', xp: 34, rarity: 'epic', c1: '#e04f4f', c2: '#8a2020' },
  knorbonker: { name: 'Knorbonker', art: 'pig', size: 34, hp: 162, dmg: 18, speed: 127, type: 'charge', xp: 42, rarity: 'legendary', c1: '#505868', c2: '#202830' },
  reuzenzwijn: { name: 'Reuzenzwijn', art: 'pig', size: 35, hp: 190, dmg: 21, speed: 135, type: 'charge', xp: 50, rarity: 'mythic', c1: '#9a917f', c2: '#4a4038' },
  kipophol: { name: 'Kip op Hol', art: 'chicken', size: 28, hp: 50, dmg: 8, speed: 95, type: 'fly', xp: 10, rarity: 'common', c1: '#43b25b', c2: '#1e4a28' },
  vliegkip: { name: 'Vliegkip', art: 'chicken', size: 29, hp: 78, dmg: 11, speed: 99, type: 'fly', xp: 18, rarity: 'uncommon', c1: '#ffd75e', c2: '#8a6020' },
  pikstorm: { name: 'Pikstorm', art: 'chicken', size: 30, hp: 106, dmg: 13, speed: 103, type: 'fly', xp: 26, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
  kippenkolos: { name: 'Kippenkolos', art: 'chicken', size: 31, hp: 134, dmg: 16, speed: 107, type: 'fly', xp: 34, rarity: 'epic', c1: '#c98850', c2: '#6b4a28' },
  woestekip: { name: 'Woeste Kip', art: 'chicken', size: 32, hp: 162, dmg: 18, speed: 111, type: 'fly', xp: 42, rarity: 'legendary', c1: '#d4a574', c2: '#6b4a28' },
  snavelstorm: { name: 'Snavelstorm', art: 'chicken', size: 33, hp: 190, dmg: 21, speed: 115, type: 'fly', xp: 50, rarity: 'mythic', c1: '#ff9ad5', c2: '#8a3060' },
  razendeschaap: { name: 'Razende Schaap', art: 'sheep', size: 32, hp: 57, dmg: 8, speed: 38, type: 'tank', xp: 10, rarity: 'common', c1: '#e04f4f', c2: '#8a2020' },
  wolkolos: { name: 'Wolkolos', art: 'sheep', size: 33, hp: 90, dmg: 11, speed: 41, type: 'tank', xp: 18, rarity: 'uncommon', c1: '#505868', c2: '#202830' },
  stampwol: { name: 'Stampwol', art: 'sheep', size: 34, hp: 122, dmg: 13, speed: 44, type: 'tank', xp: 26, rarity: 'rare', c1: '#9a917f', c2: '#4a4038' },
  boerenschrik: { name: 'Boerenschrik', art: 'sheep', size: 35, hp: 154, dmg: 16, speed: 47, type: 'tank', xp: 34, rarity: 'epic', c1: '#7ad06a', c2: '#2a6030' },
  donsbeest: { name: 'Donsbeest', art: 'sheep', size: 36, hp: 186, dmg: 18, speed: 50, type: 'tank', xp: 42, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  schaaptitan: { name: 'Schaap Titan', art: 'sheep', size: 37, hp: 218, dmg: 21, speed: 53, type: 'tank', xp: 50, rarity: 'mythic', c1: '#ffb0b8', c2: '#8a3040' },
  holpaard: { name: 'Holpaard', art: 'horse', size: 36, hp: 50, dmg: 8, speed: 95, type: 'charge', xp: 10, rarity: 'common', c1: '#c98850', c2: '#6b4a28' },
  galopgevaar: { name: 'Galopgevaar', art: 'horse', size: 37, hp: 78, dmg: 11, speed: 103, type: 'charge', xp: 18, rarity: 'uncommon', c1: '#d4a574', c2: '#6b4a28' },
  stampveulen: { name: 'Stampveulen', art: 'horse', size: 38, hp: 106, dmg: 13, speed: 111, type: 'charge', xp: 26, rarity: 'rare', c1: '#ff9ad5', c2: '#8a3060' },
  renkolos: { name: 'Renkolos', art: 'horse', size: 39, hp: 134, dmg: 16, speed: 119, type: 'charge', xp: 34, rarity: 'epic', c1: '#43b25b', c2: '#1e4a28' },
  boerenrenner: { name: 'Boerenrenner', art: 'horse', size: 40, hp: 162, dmg: 18, speed: 127, type: 'charge', xp: 42, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  stormhengst: { name: 'Stormhengst', art: 'horse', size: 41, hp: 190, dmg: 21, speed: 135, type: 'charge', xp: 50, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
  kopstootgeit: { name: 'Kopstootgeit', art: 'goat', size: 30, hp: 50, dmg: 8, speed: 95, type: 'charge', xp: 10, rarity: 'common', c1: '#7ad06a', c2: '#2a6030' },
  berggeitboos: { name: 'Berggeit Boos', art: 'goat', size: 31, hp: 78, dmg: 11, speed: 103, type: 'charge', xp: 18, rarity: 'uncommon', c1: '#ff7043', c2: '#8a2020' },
  hoornram: { name: 'Hoornram', art: 'goat', size: 32, hp: 106, dmg: 13, speed: 111, type: 'charge', xp: 26, rarity: 'rare', c1: '#ffb0b8', c2: '#8a3040' },
  geitenkolos: { name: 'Geitenkolos', art: 'goat', size: 33, hp: 134, dmg: 16, speed: 119, type: 'charge', xp: 34, rarity: 'epic', c1: '#e04f4f', c2: '#8a2020' },
  razendebok: { name: 'Razende Bok', art: 'goat', size: 34, hp: 162, dmg: 18, speed: 127, type: 'charge', xp: 42, rarity: 'legendary', c1: '#505868', c2: '#202830' },
  steenbokstorm: { name: 'Steenbok Storm', art: 'goat', size: 35, hp: 190, dmg: 21, speed: 135, type: 'charge', xp: 50, rarity: 'mythic', c1: '#9a917f', c2: '#4a4038' },
  kwakophol: { name: 'Kwak op Hol', art: 'duck', size: 28, hp: 50, dmg: 8, speed: 62, type: 'hop', xp: 10, rarity: 'common', c1: '#43b25b', c2: '#1e4a28' },
  razendeeend: { name: 'Razende Eend', art: 'duck', size: 29, hp: 78, dmg: 11, speed: 66, type: 'hop', xp: 18, rarity: 'uncommon', c1: '#ffd75e', c2: '#8a6020' },
  vlotkwak: { name: 'Vlotkwak', art: 'duck', size: 30, hp: 106, dmg: 13, speed: 70, type: 'hop', xp: 26, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
  eendenkolos: { name: 'Eendenkolos', art: 'duck', size: 31, hp: 134, dmg: 16, speed: 74, type: 'hop', xp: 34, rarity: 'epic', c1: '#c98850', c2: '#6b4a28' },
  snavelduiker: { name: 'Snavelduiker', art: 'duck', size: 32, hp: 162, dmg: 18, speed: 78, type: 'hop', xp: 42, rarity: 'legendary', c1: '#d4a574', c2: '#6b4a28' },
  kwaktitan: { name: 'Kwak Titan', art: 'duck', size: 33, hp: 190, dmg: 21, speed: 82, type: 'hop', xp: 50, rarity: 'mythic', c1: '#ff9ad5', c2: '#8a3060' },
  haanophol: { name: 'Haan op Hol', art: 'rooster', size: 29, hp: 50, dmg: 8, speed: 95, type: 'fly', xp: 10, rarity: 'common', c1: '#e04f4f', c2: '#8a2020' },
  kraairoep: { name: 'Kraairoep', art: 'rooster', size: 30, hp: 78, dmg: 11, speed: 99, type: 'fly', xp: 18, rarity: 'uncommon', c1: '#505868', c2: '#202830' },
  kamstoot: { name: 'Kamstoot', art: 'rooster', size: 31, hp: 106, dmg: 13, speed: 103, type: 'fly', xp: 26, rarity: 'rare', c1: '#9a917f', c2: '#4a4038' },
  hanenkolos: { name: 'Hanenkolos', art: 'rooster', size: 32, hp: 134, dmg: 16, speed: 107, type: 'fly', xp: 34, rarity: 'epic', c1: '#7ad06a', c2: '#2a6030' },
  vuurhaan: { name: 'Vuurhaan', art: 'rooster', size: 33, hp: 162, dmg: 18, speed: 111, type: 'fly', xp: 42, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  zonnekam: { name: 'Zonnekam', art: 'rooster', size: 34, hp: 190, dmg: 21, speed: 115, type: 'fly', xp: 50, rarity: 'mythic', c1: '#ffb0b8', c2: '#8a3040' },
  koppigeezel: { name: 'Koppige Ezel', art: 'donkey', size: 33, hp: 57, dmg: 8, speed: 38, type: 'tank', xp: 10, rarity: 'common', c1: '#c98850', c2: '#6b4a28' },
  stampzel: { name: 'Stampzel', art: 'donkey', size: 34, hp: 90, dmg: 11, speed: 41, type: 'tank', xp: 18, rarity: 'uncommon', c1: '#d4a574', c2: '#6b4a28' },
  boerenezel: { name: 'Boerenezel', art: 'donkey', size: 35, hp: 122, dmg: 13, speed: 44, type: 'tank', xp: 26, rarity: 'rare', c1: '#ff9ad5', c2: '#8a3060' },
  ezelkolos: { name: 'Ezelkolos', art: 'donkey', size: 36, hp: 154, dmg: 16, speed: 47, type: 'tank', xp: 34, rarity: 'epic', c1: '#43b25b', c2: '#1e4a28' },
  hardhoofd: { name: 'Hardhoofd', art: 'donkey', size: 37, hp: 186, dmg: 18, speed: 50, type: 'tank', xp: 42, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  molenzwaai: { name: 'Molenzwaai', art: 'donkey', size: 38, hp: 218, dmg: 21, speed: 53, type: 'tank', xp: 50, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
  gansophol: { name: 'Gans op Hol', art: 'goose', size: 30, hp: 50, dmg: 8, speed: 95, type: 'charge', xp: 10, rarity: 'common', c1: '#7ad06a', c2: '#2a6030' },
  sissendegans: { name: 'Sissende Gans', art: 'goose', size: 31, hp: 78, dmg: 11, speed: 103, type: 'charge', xp: 18, rarity: 'uncommon', c1: '#ff7043', c2: '#8a2020' },
  vleugelram: { name: 'Vleugelram', art: 'goose', size: 32, hp: 106, dmg: 13, speed: 111, type: 'charge', xp: 26, rarity: 'rare', c1: '#ffb0b8', c2: '#8a3040' },
  ganzenkolos: { name: 'Ganzenkolos', art: 'goose', size: 33, hp: 134, dmg: 16, speed: 119, type: 'charge', xp: 34, rarity: 'epic', c1: '#e04f4f', c2: '#8a2020' },
  nesthoeder: { name: 'Nesthoeder', art: 'goose', size: 34, hp: 162, dmg: 18, speed: 127, type: 'charge', xp: 42, rarity: 'legendary', c1: '#505868', c2: '#202830' },
  stormgans: { name: 'Stormgans', art: 'goose', size: 35, hp: 190, dmg: 21, speed: 135, type: 'charge', xp: 50, rarity: 'mythic', c1: '#9a917f', c2: '#4a4038' },
  /* --- Dierentuin-uitbraak: reuzen-dierentuindieren --- */
  reuzenolifant: { name: 'Reuzenolifant', art: 'elephant', size: 43, hp: 69, dmg: 10, speed: 38, type: 'tank', xp: 14, rarity: 'common', c1: '#43b25b', c2: '#1e4a28' },
  stampolifant: { name: 'Stampolifant', art: 'elephant', size: 44, hp: 101, dmg: 13, speed: 41, type: 'tank', xp: 22, rarity: 'uncommon', c1: '#ffd75e', c2: '#8a6020' },
  slurfkolos: { name: 'Slurfkolos', art: 'elephant', size: 45, hp: 133, dmg: 15, speed: 44, type: 'tank', xp: 30, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
  ivoiretitan: { name: 'Ivoire Titan', art: 'elephant', size: 46, hp: 166, dmg: 18, speed: 47, type: 'tank', xp: 38, rarity: 'epic', c1: '#c98850', c2: '#6b4a28' },
  woesteolifant: { name: 'Woeste Olifant', art: 'elephant', size: 47, hp: 198, dmg: 20, speed: 50, type: 'tank', xp: 46, rarity: 'legendary', c1: '#d4a574', c2: '#6b4a28' },
  mammoetstorm: { name: 'Mammoetstorm', art: 'elephant', size: 48, hp: 230, dmg: 23, speed: 53, type: 'tank', xp: 54, rarity: 'mythic', c1: '#ff9ad5', c2: '#8a3060' },
  razendeleeuw: { name: 'Razende Leeuw', art: 'lion', size: 37, hp: 60, dmg: 10, speed: 95, type: 'charge', xp: 14, rarity: 'common', c1: '#e04f4f', c2: '#8a2020' },
  manenstorm: { name: 'Manenstorm', art: 'lion', size: 38, hp: 88, dmg: 13, speed: 103, type: 'charge', xp: 22, rarity: 'uncommon', c1: '#505868', c2: '#202830' },
  savannekoning: { name: 'Savannekoning', art: 'lion', size: 39, hp: 116, dmg: 15, speed: 111, type: 'charge', xp: 30, rarity: 'rare', c1: '#9a917f', c2: '#4a4038' },
  leeuwenkolos: { name: 'Leeuwenkolos', art: 'lion', size: 40, hp: 144, dmg: 18, speed: 119, type: 'charge', xp: 38, rarity: 'epic', c1: '#7ad06a', c2: '#2a6030' },
  woestemanen: { name: 'Woeste Manen', art: 'lion', size: 41, hp: 172, dmg: 20, speed: 127, type: 'charge', xp: 46, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  koningsklauw: { name: 'Koningsklauw', art: 'lion', size: 42, hp: 200, dmg: 23, speed: 135, type: 'charge', xp: 54, rarity: 'mythic', c1: '#ffb0b8', c2: '#8a3040' },
  razendetijger: { name: 'Razende Tijger', art: 'tiger', size: 36, hp: 60, dmg: 10, speed: 95, type: 'charge', xp: 14, rarity: 'common', c1: '#c98850', c2: '#6b4a28' },
  streepstorm: { name: 'Streepstorm', art: 'tiger', size: 37, hp: 88, dmg: 13, speed: 103, type: 'charge', xp: 22, rarity: 'uncommon', c1: '#d4a574', c2: '#6b4a28' },
  jungleklauw: { name: 'Jungleklauw', art: 'tiger', size: 38, hp: 116, dmg: 15, speed: 111, type: 'charge', xp: 30, rarity: 'rare', c1: '#ff9ad5', c2: '#8a3060' },
  tijgerkolos: { name: 'Tijgerkolos', art: 'tiger', size: 39, hp: 144, dmg: 18, speed: 119, type: 'charge', xp: 38, rarity: 'epic', c1: '#43b25b', c2: '#1e4a28' },
  nachtstreep: { name: 'Nachtstreep', art: 'tiger', size: 40, hp: 172, dmg: 20, speed: 127, type: 'charge', xp: 46, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  vuurtijger: { name: 'Vuurtijger', art: 'tiger', size: 41, hp: 200, dmg: 23, speed: 135, type: 'charge', xp: 54, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
  langegiraffe: { name: 'Lange Giraffe', art: 'giraffe', size: 41, hp: 69, dmg: 10, speed: 38, type: 'tank', xp: 14, rarity: 'common', c1: '#7ad06a', c2: '#2a6030' },
  nekkolos: { name: 'Nekkolos', art: 'giraffe', size: 42, hp: 101, dmg: 13, speed: 41, type: 'tank', xp: 22, rarity: 'uncommon', c1: '#ff7043', c2: '#8a2020' },
  savannetoren: { name: 'Savanne Toren', art: 'giraffe', size: 43, hp: 133, dmg: 15, speed: 44, type: 'tank', xp: 30, rarity: 'rare', c1: '#ffb0b8', c2: '#8a3040' },
  giraffenreus: { name: 'Giraffenreus', art: 'giraffe', size: 44, hp: 166, dmg: 18, speed: 47, type: 'tank', xp: 38, rarity: 'epic', c1: '#e04f4f', c2: '#8a2020' },
  hoogkijk: { name: 'Hoogkijk', art: 'giraffe', size: 45, hp: 198, dmg: 20, speed: 50, type: 'tank', xp: 46, rarity: 'legendary', c1: '#505868', c2: '#202830' },
  wolkennek: { name: 'Wolkennek', art: 'giraffe', size: 46, hp: 230, dmg: 23, speed: 53, type: 'tank', xp: 54, rarity: 'mythic', c1: '#9a917f', c2: '#4a4038' },
  razendnijlpaard: { name: 'Razend Nijlpaard', art: 'hippo', size: 41, hp: 69, dmg: 10, speed: 38, type: 'tank', xp: 14, rarity: 'common', c1: '#43b25b', c2: '#1e4a28' },
  rivierkolos: { name: 'Rivierkolos', art: 'hippo', size: 42, hp: 101, dmg: 13, speed: 41, type: 'tank', xp: 22, rarity: 'uncommon', c1: '#ffd75e', c2: '#8a6020' },
  gapendekaak: { name: 'Gapende Kaak', art: 'hippo', size: 43, hp: 133, dmg: 15, speed: 44, type: 'tank', xp: 30, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
  nijltitan: { name: 'Nijl Titan', art: 'hippo', size: 44, hp: 166, dmg: 18, speed: 47, type: 'tank', xp: 38, rarity: 'epic', c1: '#c98850', c2: '#6b4a28' },
  modderhip: { name: 'Modderhip', art: 'hippo', size: 45, hp: 198, dmg: 20, speed: 50, type: 'tank', xp: 46, rarity: 'legendary', c1: '#d4a574', c2: '#6b4a28' },
  waterton: { name: 'Waterton', art: 'hippo', size: 46, hp: 230, dmg: 23, speed: 53, type: 'tank', xp: 54, rarity: 'mythic', c1: '#ff9ad5', c2: '#8a3060' },
  razendeneushoorn: { name: 'Razende Neushoorn', art: 'rhino', size: 39, hp: 60, dmg: 10, speed: 95, type: 'charge', xp: 14, rarity: 'common', c1: '#e04f4f', c2: '#8a2020' },
  hoornram2: { name: 'Hoornram', art: 'rhino', size: 40, hp: 88, dmg: 13, speed: 103, type: 'charge', xp: 22, rarity: 'uncommon', c1: '#505868', c2: '#202830' },
  pantserstoot: { name: 'Pantserstoot', art: 'rhino', size: 41, hp: 116, dmg: 15, speed: 111, type: 'charge', xp: 30, rarity: 'rare', c1: '#9a917f', c2: '#4a4038' },
  rhinokolos: { name: 'Rhino Kolos', art: 'rhino', size: 42, hp: 144, dmg: 18, speed: 119, type: 'charge', xp: 38, rarity: 'epic', c1: '#7ad06a', c2: '#2a6030' },
  ijzervel: { name: 'IJzervel', art: 'rhino', size: 43, hp: 172, dmg: 20, speed: 127, type: 'charge', xp: 46, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  stampneus: { name: 'Stampneus', art: 'rhino', size: 44, hp: 200, dmg: 23, speed: 135, type: 'charge', xp: 54, rarity: 'mythic', c1: '#ffb0b8', c2: '#8a3040' },
  woestegorilla: { name: 'Woeste Gorilla', art: 'gorilla', size: 38, hp: 69, dmg: 10, speed: 38, type: 'tank', xp: 14, rarity: 'common', c1: '#c98850', c2: '#6b4a28' },
  vuistberg: { name: 'Vuistberg', art: 'gorilla', size: 39, hp: 101, dmg: 13, speed: 41, type: 'tank', xp: 22, rarity: 'uncommon', c1: '#d4a574', c2: '#6b4a28' },
  junglereus: { name: 'Jungle Reus', art: 'gorilla', size: 40, hp: 133, dmg: 15, speed: 44, type: 'tank', xp: 30, rarity: 'rare', c1: '#ff9ad5', c2: '#8a3060' },
  apenkolos: { name: 'Apenkolos', art: 'gorilla', size: 41, hp: 166, dmg: 18, speed: 47, type: 'tank', xp: 38, rarity: 'epic', c1: '#43b25b', c2: '#1e4a28' },
  zilverrug: { name: 'Zilverrug', art: 'gorilla', size: 42, hp: 198, dmg: 20, speed: 50, type: 'tank', xp: 46, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  trommelborst: { name: 'Trommelborst', art: 'gorilla', size: 43, hp: 230, dmg: 23, speed: 53, type: 'tank', xp: 54, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
  razendezebra: { name: 'Razende Zebra', art: 'zebra', size: 35, hp: 60, dmg: 10, speed: 95, type: 'charge', xp: 14, rarity: 'common', c1: '#7ad06a', c2: '#2a6030' },
  streepgalop: { name: 'Streepgalop', art: 'zebra', size: 36, hp: 88, dmg: 13, speed: 103, type: 'charge', xp: 22, rarity: 'uncommon', c1: '#ff7043', c2: '#8a2020' },
  savanneren: { name: 'Savanne Ren', art: 'zebra', size: 37, hp: 116, dmg: 15, speed: 111, type: 'charge', xp: 30, rarity: 'rare', c1: '#ffb0b8', c2: '#8a3040' },
  zebrakolos: { name: 'Zebra Kolos', art: 'zebra', size: 38, hp: 144, dmg: 18, speed: 119, type: 'charge', xp: 38, rarity: 'epic', c1: '#e04f4f', c2: '#8a2020' },
  zwartwitstorm: { name: 'Zwartwit Storm', art: 'zebra', size: 39, hp: 172, dmg: 20, speed: 127, type: 'charge', xp: 46, rarity: 'legendary', c1: '#505868', c2: '#202830' },
  hoefstamp: { name: 'Hoefstamp', art: 'zebra', size: 40, hp: 200, dmg: 23, speed: 135, type: 'charge', xp: 54, rarity: 'mythic', c1: '#9a917f', c2: '#4a4038' },
  razendebeer: { name: 'Razende Beer', art: 'bear', size: 39, hp: 69, dmg: 10, speed: 38, type: 'tank', xp: 14, rarity: 'common', c1: '#43b25b', c2: '#1e4a28' },
  klauwberg: { name: 'Klauwberg', art: 'bear', size: 40, hp: 101, dmg: 13, speed: 41, type: 'tank', xp: 22, rarity: 'uncommon', c1: '#ffd75e', c2: '#8a6020' },
  bosreus: { name: 'Bosreus', art: 'bear', size: 41, hp: 133, dmg: 15, speed: 44, type: 'tank', xp: 30, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
  berenkolos: { name: 'Berenkolos', art: 'bear', size: 42, hp: 166, dmg: 18, speed: 47, type: 'tank', xp: 38, rarity: 'epic', c1: '#c98850', c2: '#6b4a28' },
  honingslok: { name: 'Honingslok', art: 'bear', size: 43, hp: 198, dmg: 20, speed: 50, type: 'tank', xp: 46, rarity: 'legendary', c1: '#d4a574', c2: '#6b4a28' },
  winterklauw: { name: 'Winterklauw', art: 'bear', size: 44, hp: 230, dmg: 23, speed: 53, type: 'tank', xp: 54, rarity: 'mythic', c1: '#ff9ad5', c2: '#8a3060' },
  razendekrokodil: { name: 'Razende Krokodil', art: 'croc', size: 37, hp: 60, dmg: 10, speed: 88, type: 'swim', xp: 14, rarity: 'common', c1: '#e04f4f', c2: '#8a2020' },
  kaakklem: { name: 'Kaakklem', art: 'croc', size: 38, hp: 88, dmg: 13, speed: 93, type: 'swim', xp: 22, rarity: 'uncommon', c1: '#505868', c2: '#202830' },
  rivierschrik: { name: 'Rivierschrik', art: 'croc', size: 39, hp: 116, dmg: 15, speed: 98, type: 'swim', xp: 30, rarity: 'rare', c1: '#9a917f', c2: '#4a4038' },
  krokodiltitan: { name: 'Krokodil Titan', art: 'croc', size: 40, hp: 144, dmg: 18, speed: 103, type: 'swim', xp: 38, rarity: 'epic', c1: '#7ad06a', c2: '#2a6030' },
  schubbenmuil: { name: 'Schubbenmuil', art: 'croc', size: 41, hp: 172, dmg: 20, speed: 108, type: 'swim', xp: 46, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  snapkrokodil: { name: 'Snapkrokodil', art: 'croc', size: 42, hp: 200, dmg: 23, speed: 113, type: 'swim', xp: 54, rarity: 'mythic', c1: '#ffb0b8', c2: '#8a3040' },
  razendekangoeroe: { name: 'Razende Kangoeroe', art: 'kangaroo', size: 35, hp: 60, dmg: 10, speed: 95, type: 'charge', xp: 14, rarity: 'common', c1: '#c98850', c2: '#6b4a28' },
  sprongstoot: { name: 'Sprongstoot', art: 'kangaroo', size: 36, hp: 88, dmg: 13, speed: 103, type: 'charge', xp: 22, rarity: 'uncommon', c1: '#d4a574', c2: '#6b4a28' },
  buidelbonk: { name: 'Buidelbonk', art: 'kangaroo', size: 37, hp: 116, dmg: 15, speed: 111, type: 'charge', xp: 30, rarity: 'rare', c1: '#ff9ad5', c2: '#8a3060' },
  kangokolos: { name: 'Kango Kolos', art: 'kangaroo', size: 38, hp: 144, dmg: 18, speed: 119, type: 'charge', xp: 38, rarity: 'epic', c1: '#43b25b', c2: '#1e4a28' },
  hopklauw: { name: 'Hopklauw', art: 'kangaroo', size: 39, hp: 172, dmg: 20, speed: 127, type: 'charge', xp: 46, rarity: 'legendary', c1: '#ffd75e', c2: '#8a6020' },
  outbackram: { name: 'Outback Ram', art: 'kangaroo', size: 40, hp: 200, dmg: 23, speed: 135, type: 'charge', xp: 54, rarity: 'mythic', c1: '#c47aff', c2: '#5a2080' },
  woestepanda: { name: 'Woeste Panda', art: 'panda', size: 36, hp: 69, dmg: 10, speed: 38, type: 'tank', xp: 14, rarity: 'common', c1: '#7ad06a', c2: '#2a6030' },
  bamboebonk: { name: 'Bamboe Bonk', art: 'panda', size: 37, hp: 101, dmg: 13, speed: 41, type: 'tank', xp: 22, rarity: 'uncommon', c1: '#ff7043', c2: '#8a2020' },
  zwartwitreus: { name: 'Zwartwit Reus', art: 'panda', size: 38, hp: 133, dmg: 15, speed: 44, type: 'tank', xp: 30, rarity: 'rare', c1: '#ffb0b8', c2: '#8a3040' },
  pandakolos: { name: 'Panda Kolos', art: 'panda', size: 39, hp: 166, dmg: 18, speed: 47, type: 'tank', xp: 38, rarity: 'epic', c1: '#e04f4f', c2: '#8a2020' },
  rolbeer: { name: 'Rolbeer', art: 'panda', size: 40, hp: 198, dmg: 20, speed: 50, type: 'tank', xp: 46, rarity: 'legendary', c1: '#505868', c2: '#202830' },
  tempelpanda: { name: 'Tempelpanda', art: 'panda', size: 41, hp: 230, dmg: 23, speed: 53, type: 'tank', xp: 54, rarity: 'mythic', c1: '#9a917f', c2: '#4a4038' },
  razendeflamingo: { name: 'Razende Flamingo', art: 'flamingo', size: 33, hp: 60, dmg: 10, speed: 95, type: 'fly', xp: 14, rarity: 'common', c1: '#43b25b', c2: '#1e4a28' },
  rozestorm: { name: 'Roze Storm', art: 'flamingo', size: 34, hp: 88, dmg: 13, speed: 99, type: 'fly', xp: 22, rarity: 'uncommon', c1: '#ffd75e', c2: '#8a6020' },
  eenpoot: { name: 'Eenpoot', art: 'flamingo', size: 35, hp: 116, dmg: 15, speed: 103, type: 'fly', xp: 30, rarity: 'rare', c1: '#c47aff', c2: '#5a2080' },
  flamingokolos: { name: 'Flamingo Kolos', art: 'flamingo', size: 36, hp: 144, dmg: 18, speed: 107, type: 'fly', xp: 38, rarity: 'epic', c1: '#c98850', c2: '#6b4a28' },
  lagunevlam: { name: 'Lagune Vlam', art: 'flamingo', size: 37, hp: 172, dmg: 20, speed: 111, type: 'fly', xp: 46, rarity: 'legendary', c1: '#d4a574', c2: '#6b4a28' },
  nekzwaai: { name: 'Nekzwaai', art: 'flamingo', size: 38, hp: 200, dmg: 23, speed: 115, type: 'fly', xp: 54, rarity: 'mythic', c1: '#ff9ad5', c2: '#8a3060' },
  razendekameel: { name: 'Razende Kameel', art: 'camel', size: 37, hp: 69, dmg: 10, speed: 38, type: 'tank', xp: 14, rarity: 'common', c1: '#e04f4f', c2: '#8a2020' },
  bultbonk: { name: 'Bultbonk', art: 'camel', size: 38, hp: 101, dmg: 13, speed: 41, type: 'tank', xp: 22, rarity: 'uncommon', c1: '#505868', c2: '#202830' },
  woestijnreus: { name: 'Woestijnreus', art: 'camel', size: 39, hp: 133, dmg: 15, speed: 44, type: 'tank', xp: 30, rarity: 'rare', c1: '#9a917f', c2: '#4a4038' },
  kameelkolos: { name: 'Kameel Kolos', art: 'camel', size: 40, hp: 166, dmg: 18, speed: 47, type: 'tank', xp: 38, rarity: 'epic', c1: '#7ad06a', c2: '#2a6030' },
  zandgalop: { name: 'Zandgalop', art: 'camel', size: 41, hp: 198, dmg: 20, speed: 50, type: 'tank', xp: 46, rarity: 'legendary', c1: '#ff7043', c2: '#8a2020' },
  oasestamp: { name: 'Oase Stamp', art: 'camel', size: 42, hp: 230, dmg: 23, speed: 53, type: 'tank', xp: 54, rarity: 'mythic', c1: '#ffb0b8', c2: '#8a3040' },
    /* Tide Battle — alleen via 0.05% kill-roll, nooit in normale golven */
    tideKyuu: { name: 'Negenstaart Vos', art: 'tideFox', size: 38, hp: 340, dmg: 26, speed: 88, type: 'charge', xp: 120, rarity: 'mythic', c1: '#ff7a20', c2: '#8a2010' },
    tideManda: { name: 'Paarse Reuzenslang', art: 'tideSnake', size: 36, hp: 320, dmg: 24, speed: 72, type: 'shoot', xp: 115, rarity: 'mythic', c1: '#9b59d4', c2: '#4a2080' },
    tideGama: { name: 'Bergpad Kolos', art: 'tideToad', size: 40, hp: 380, dmg: 28, speed: 58, type: 'tank', xp: 125, rarity: 'mythic', c1: '#6a8a4a', c2: '#3a5028' },
    tideKatsu: { name: 'Slak Matriarch', art: 'tideSlug', size: 34, hp: 360, dmg: 22, speed: 48, type: 'tank', xp: 118, rarity: 'mythic', c1: '#d4a8ff', c2: '#7a5090' },
    tideShuka: { name: 'Zandgeest Tanuki', art: 'tideTanuki', size: 37, hp: 350, dmg: 25, speed: 65, type: 'tank', xp: 122, rarity: 'mythic', c1: '#e8c98a', c2: '#8a6830' },
    tideGyuu: { name: 'Octo-Ox Ravager', art: 'tideOx', size: 39, hp: 400, dmg: 30, speed: 70, type: 'charge', xp: 130, rarity: 'mythic', c1: '#8a3030', c2: '#402020' },
    tideEnma: { name: 'Wijze Aap Heer', art: 'tideMonkey', size: 35, hp: 330, dmg: 27, speed: 95, type: 'charge', xp: 120, rarity: 'mythic', c1: '#c97a20', c2: '#6a4010' },
    tideGaruda: { name: 'Stormarend', art: 'tideHawk', size: 34, hp: 310, dmg: 26, speed: 110, type: 'fly', xp: 118, rarity: 'mythic', c1: '#7cf5ff', c2: '#2a6090' },
    tideCerber: { name: 'Driekoppige Jachthond', art: 'tideHound', size: 36, hp: 345, dmg: 29, speed: 92, type: 'charge', xp: 124, rarity: 'mythic', c1: '#505868', c2: '#202830' },
};
const SPECIES_ORDER = Object.keys(SPECIES).sort((a, b) =>
  (rarityOf(SPECIES[a].rarity).order - rarityOf(SPECIES[b].rarity).order) || SPECIES[a].name.localeCompare(SPECIES[b].name)
);

function speciesPowerScore(spId) {
  const sp = SPECIES[spId];
  if (!sp) return 0;
  return rarityOf(sp.rarity).order * 100 + sp.hp + sp.dmg * 5;
}

let _speciesTop10Threshold = null;
function speciesTop10Threshold() {
  if (_speciesTop10Threshold != null) return _speciesTop10Threshold;
  const scores = Object.keys(SPECIES).map(speciesPowerScore).sort((a, b) => a - b);
  _speciesTop10Threshold = scores[Math.floor(scores.length * 0.9)] ?? scores[scores.length - 1];
  return _speciesTop10Threshold;
}

function pickEnemyJutsu(spId, levelN) {
  if (levelN < ENEMY_JUTSU_MIN_LEVEL) return null;
  if (speciesPowerScore(spId) < speciesTop10Threshold()) return null;
  return ENEMY_JUTSU_KINDS[Math.floor(Math.random() * ENEMY_JUTSU_KINDS.length)];
}

const WORLD_THEMES = [
  'landweg','landweg','landweg','bos','bos',
  'bos','grot','grot','grot','vulkaan',
  'vulkaan','vulkaan','cyber','cyber','cyber',
  'dojo','dojo','grot','vulkaan','cyber',
  'landweg','bos','grot','vulkaan','cyber',
  'dojo','sloop','cyber','vulkaan','grot',
  'cyber','cyber','vulkaan','dojo','cyber',
  'cyber','vulkaan','dojo','cyber','cyber',
  'cyber','vulkaan','dojo','cyber','cyber',
  'cyber','cyber','cyber','cyber','cyber',
  /* Nachtmerrie 51–60 */
  'nachtmerrie','nachtmerrie','nachtmerrie','nachtmerrie','nachtmerrie',
  'nachtmerrie','nachtmerrie','nachtmerrie','nachtmerrie','nachtmerrie',
  /* Hel 61–70 */
  'hel','hel','hel','hel','hel',
  'hel','hel','hel','hel','hel',
];
const UNLOCK_AT = {
  slymo: 1, bubbel: 1, flapper: 2, piepvleugel: 5, stekelra: 3, ijzerstek: 9,
  spooki: 4, nachtwolk: 14, blikkert: 6, laserblik: 18, vlamvos: 8, stormvos: 22,
  rotsbonk: 10, magmabon: 28, vlamdraak: 15, kristallo: 25, schaduwvorst: 35,
  voidkonijn: 40, guvvedrak: 48,
  moerasly: 1, dwergvleerm: 2, piekbout: 2, koperblik: 3, paddensly: 4, giftbub: 5,
  kegelbeest: 5, roestblik: 6, zandgeest: 7, mistgeest: 8, ijsvos: 9, toxbub: 10,
  nachtschaduw: 11, oervaamp: 12, kristaldrek: 13, plasmafles: 14, zielenschemer: 15,
  bliksemvos: 16, granietkolos: 17, gloeidrake: 18, frostbub: 19, lavablob: 20,
  stormer: 21, thorndrake: 22, stoomkan: 23, banjaa: 24, asvos: 25, sliksteen: 26,
  stormwyrm: 27, schimmervleerm: 29, ijzerklauw: 30, ethergeest: 31, vuurstorm: 32,
  obsidianaut: 33, titanbonk: 34, zeewyrm: 36, voidsly: 38, neondrake: 40,
  etherwyrm: 43, omegadrake: 46,
  kleiply: 1, spinbub: 2, hongerly: 4, parelsly: 6, modderblob: 4, crystalbub: 6, chaosly: 8, zwerm: 10, karmijnvleerm: 7, echovleerm: 9, spiegelvleerm: 11, voidvleerm: 13, duskwing: 11, glimwing: 13, bronzenstek: 15, koperstek: 17, froststek: 14, kolossstek: 16, thornox: 18, spineclaw: 20, quillfang: 18, spookvlam: 20, koudspook: 22, spiraalgeest: 24, wispgeest: 21, nexusgeest: 23, mistwraith: 25, palewraith: 27, olieblik: 25, batterijkan: 27, schrootblik: 29, turboblok: 30, ionkan: 28, quantumkan: 30, omegacan: 32, zilvervos: 34, maanvos: 32, jadevos: 34, stellarvos: 36, kosmischvos: 37, emberfox: 35, shadowfox: 37, leisteen: 39, marmerbonk: 41, koraalbonk: 39, barnsteen: 41, adamantbonk: 43, basaltbonk: 44, titanrock: 42, mistwyrm: 44, sandwyrm: 46, frostwyrm: 48, chaoswyrm: 46, prismewyrm: 48, apexwyrm: 50,
  rifhaai: 8, snelvin: 9, octo: 8, inktvissie: 10, hamerkop: 12, koraalocto: 14, tijvin: 16, dieptocto: 18, stormocto: 22, neonhaai: 24, abysshaai: 32, krakenling: 38, levihaai: 44, voidocto: 40,
  /* boerderij op hol */
  holkoe: 1, razendeholkoe: 6, stampkoe: 11, melkkolos: 17, boerenbonk: 22, woesteholkoe: 27, razendzwijn: 3, modderzwijn: 8, stootzwijn: 13, spekzwaai: 19, knorbonker: 24, reuzenzwijn: 29, kipophol: 1, vliegkip: 6, pikstorm: 11, kippenkolos: 17, woestekip: 22, snavelstorm: 27, razendeschaap: 3, wolkolos: 8, stampwol: 13, boerenschrik: 19, donsbeest: 24, schaaptitan: 29, holpaard: 1, galopgevaar: 6, stampveulen: 11, renkolos: 17, boerenrenner: 22, stormhengst: 27, kopstootgeit: 3, berggeitboos: 8, hoornram: 13, geitenkolos: 19, razendebok: 24, steenbokstorm: 29, kwakophol: 1, razendeeend: 6, vlotkwak: 11, eendenkolos: 17, snavelduiker: 22, kwaktitan: 27, haanophol: 3, kraairoep: 8, kamstoot: 13, hanenkolos: 19, vuurhaan: 24, zonnekam: 29, koppigeezel: 1, stampzel: 6, boerenezel: 11, ezelkolos: 17, hardhoofd: 22, molenzwaai: 27, gansophol: 3, sissendegans: 8, vleugelram: 13, ganzenkolos: 19, nesthoeder: 24, stormgans: 29,
  /* dierentuin-uitbraak */
  reuzenolifant: 10, stampolifant: 16, slurfkolos: 23, ivoiretitan: 29, woesteolifant: 36, mammoetstorm: 42, razendeleeuw: 9, manenstorm: 15, savannekoning: 22, leeuwenkolos: 28, woestemanen: 30, koningsklauw: 36, razendetijger: 7, streepstorm: 13, jungleklauw: 20, tijgerkolos: 26, nachtstreep: 33, vuurtijger: 39, langegiraffe: 14, nekkolos: 20, savannetoren: 22, giraffenreus: 28, hoogkijk: 35, wolkennek: 41, razendnijlpaard: 8, rivierkolos: 14, gapendekaak: 21, nijltitan: 27, modderhip: 34, waterton: 40, razendeneushoorn: 6, hoornram2: 12, pantserstoot: 19, rhinokolos: 25, ijzervel: 32, stampneus: 38, woestegorilla: 9, vuistberg: 15, junglereus: 22, apenkolos: 28, zilverrug: 30, trommelborst: 36, razendezebra: 7, streepgalop: 13, savanneren: 20, zebrakolos: 26, zwartwitstorm: 33, hoefstamp: 39, razendebeer: 10, klauwberg: 16, bosreus: 18, berenkolos: 24, honingslok: 31, winterklauw: 37, razendekrokodil: 8, kaakklem: 14, rivierschrik: 21, krokodiltitan: 27, schubbenmuil: 34, snapkrokodil: 40, razendekangoeroe: 6, sprongstoot: 12, buidelbonk: 19, kangokolos: 25, hopklauw: 32, outbackram: 38, woestepanda: 9, bamboebonk: 15, zwartwitreus: 22, pandakolos: 28, rolbeer: 30, tempelpanda: 36, razendeflamingo: 7, rozestorm: 13, eenpoot: 20, flamingokolos: 26, lagunevlam: 33, nekzwaai: 39, razendekameel: 10, bultbonk: 16, woestijnreus: 18, kameelkolos: 24, zandgalop: 31, oasestamp: 37,

};
/** Avontuur horde: 6× meer spawns + reuzen + volledig monsterboek (~2× diversiteit: boerderij + dierentuin). */
const ADVENTURE_HORDE_MUL = 6;
const ADVENTURE_HORDE_MAX_PER_WAVE = 36;
const ADVENTURE_MAX_ALIVE = IS_TOUCH ? 54 : 78;
const GIANT_SPAWN_CHANCE = 0.15;
const GIANT_SIZE_MUL = 1.52;
const GIANT_HP_MUL = 1.34;
const GIANT_DMG_MUL = 1.14;
const GIANT_XP_MUL = 1.3;
/** Flagship baas (BOSS_AT elite / super-baas): groter + tankier. */
const BOSS_CORE_SIZE_MUL = 1.25;
const BOSS_CORE_HP_MUL = 2.85;
const BOSS_CORE_DMG_MUL = 1.18;
/** Soms ~2× zo groot als huidige baas, met extra HP. */
const COLOSSAL_CHANCE = 0.42;
const COLOSSAL_SIZE_MUL = 2.0;
const COLOSSAL_HP_MUL = 1.9;
const COLOSSAL_DMG_MUL = 1.12;
const COLOSSAL_XP_MUL = 1.45;

const SEA_ARTS = new Set(['shark', 'octo']);
const FARM_ARTS = new Set(['cow', 'pig', 'chicken', 'sheep', 'horse', 'goat', 'duck', 'rooster', 'donkey', 'goose']);
const ZOO_ARTS = new Set(['elephant', 'lion', 'tiger', 'giraffe', 'hippo', 'rhino', 'gorilla', 'zebra', 'bear', 'croc', 'kangaroo', 'panda', 'flamingo', 'camel']);
const BEAST_SIZE_ARTS = new Set([...FARM_ARTS, ...ZOO_ARTS]);
/** Boerderij/dierentuin: vaker reuzen-variant (al groot, nog groter). */
const BEAST_GIANT_BONUS = 0.28;

function farmSpeciesPool(levelN, maxRarityOrder) {
  return Object.keys(UNLOCK_AT).filter((id) => {
    const sp = SPECIES[id];
    if (!sp || !FARM_ARTS.has(sp.art)) return false;
    if (UNLOCK_AT[id] > levelN) return false;
    return rarityOf(sp.rarity).order <= maxRarityOrder;
  });
}

function zooSpeciesPool(levelN, maxRarityOrder) {
  return Object.keys(UNLOCK_AT).filter((id) => {
    const sp = SPECIES[id];
    if (!sp || !ZOO_ARTS.has(sp.art)) return false;
    if (UNLOCK_AT[id] > levelN) return false;
    return rarityOf(sp.rarity).order <= maxRarityOrder;
  });
}


function seaSpeciesPool(levelN, maxRarityOrder) {
  return Object.keys(UNLOCK_AT).filter((id) => {
    const sp = SPECIES[id];
    if (!sp || !SEA_ARTS.has(sp.art)) return false;
    if (UNLOCK_AT[id] > levelN) return false;
    return rarityOf(sp.rarity).order <= maxRarityOrder;
  });
}

function tideWaveSeaPick(seaPool, levelN, maxRarityOrder) {
  if (!seaPool || !seaPool.length) return null;
  return weightedPick(seaPool, levelN);
}

/** Nood-ontsnapping als je omringd / stunlocked bent — thermometer boven special-knop. */
const KETSBAM_DETECT_R = 148;
const KETSBAM_NEAR_MIN = 3;
const KETSBAM_BLAST_R = 192;
const KETSBAM_CD = 9;
/** Gradual fill (thermometer) before KETS is ready to tap. */
const KETSBAM_BUILD_DUR = 3.8;
const KETSBAM_CHARGE_DUR = 1.2;
const KETSBAM_INVULN = 1.15;
const KETSBAM_SUPER_ARMOR = 0.95;
/** Top-10 baas-golven: flagship bazen overleven minstens 3s. */
const BOSS_SAFETY_DUR = 3;
/** Vanaf dit level mogen top-10% soorten vijandelijke jutsu gebruiken. */
const ENEMY_JUTSU_MIN_LEVEL = 20;
const ENEMY_JUTSU_KINDS = ['rasengan', 'chidori', 'kamehame'];
/** Min. gap tussen speler-hits door contact/projectiles — anti stunlock-keten */
const PLAYER_HURT_CHAIN_CD = 0.42;
const BOSS_AT = {
  5:  [{ sp: 'rotsbonk', elite: true }, { sp: 'slymo' }, { sp: 'bubbel' }],
  10: [{ sp: 'vlamdraak', elite: true }, { sp: 'vlamvos' }],
  15: [{ sp: 'kristallo', elite: true }, { sp: 'stormvos' }],
  20: [{ sp: 'magmabon', elite: true }, { sp: 'laserblik' }, { sp: 'nachtwolk' }],
  25: [{ sp: 'kristallo', elite: true }, { sp: 'vlamdraak', elite: true }],
  30: [{ sp: 'schaduwvorst', elite: true }, { sp: 'nachtwolk' }, { sp: 'stormvos' }],
  35: [{ sp: 'schaduwvorst', elite: true }, { sp: 'magmabon', elite: true }],
  40: [{ sp: 'voidkonijn', elite: true }, { sp: 'schaduwvorst' }],
  45: [{ sp: 'voidkonijn', elite: true }, { sp: 'guvvedrak' }],
  50: [{ sp: 'guvvedrak', elite: true }, { sp: 'voidkonijn', elite: true }, { sp: 'schaduwvorst', elite: true }],
  55: [{ sp: 'voidkonijn', elite: true }, { sp: 'neondrake', elite: true }, { sp: 'schaduwvorst' }],
  60: [{ sp: 'guvvedrak', elite: true }, { sp: 'omegadrake', elite: true }, { sp: 'voidkonijn', elite: true }],
  65: [{ sp: 'omegadrake', elite: true }, { sp: 'etherwyrm', elite: true }, { sp: 'neondrake' }],
  70: [{ sp: 'guvvedrak', elite: true }, { sp: 'omegadrake', elite: true }, { sp: 'apexwyrm', elite: true }, { sp: 'voidkonijn', elite: true }],
};

function weightedPick(pool, n, rarityBias) {
  const safe = (pool || []).filter((id) => SPECIES[id]);
  const use = safe.length ? safe : ['slymo'];
  const bias = Number(rarityBias) || 0;
  const weights = use.map(id => {
    const o = rarityOf(SPECIES[id].rarity).order;
    return Math.max(0.3, 1.5 - o * 0.22 + Math.min(n, 45) * 0.012 * o + bias * o * 0.35);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < use.length; i++) { r -= weights[i]; if (r <= 0) return use[i]; }
  return use[use.length - 1];
}
const STAR_HP = { three: 0.72, two: 0.38 };
function starsFromHpPct(hpPct) {
  if (hpPct > STAR_HP.three) return 3;
  if (hpPct > STAR_HP.two) return 2;
  return 1;
}
function starHintLine() {
  return t('ui.starHint', {
    three: Math.round(STAR_HP.three * 100),
    two: Math.round(STAR_HP.two * 100),
  });
}
function scaleKnockback(kb, dmg, opts) {
  opts = opts || {};
  let mul = 1;
  if (dmg >= 22) mul += 0.22;
  else if (dmg >= 18) mul += 0.14;
  else if (dmg >= 12) mul += 0.06;
  if (opts.crit) mul += 0.1;
  if (opts.kind === 'kick') mul += 0.08;
  if (opts.kind === 'special') mul += 0.12;
  return kb * Math.min(mul, 1.38);
}
function applyHitStop(game, spec, opts) {
  if (!game || motionReduced()) return;
  opts = opts || {};
  if (opts.chip) {
    game.freezeT = Math.max(game.freezeT, 0.018);
    return;
  }
  if (opts.playerHurt) {
    if (game.mode === 'adventure' || game.mode === 'training' || game.mode === 'wall') {
      return;
    }
    const dmg = spec && spec.dmg != null ? spec.dmg : 8;
    let base = dmg >= 18 ? 0.018 : 0.01;
    if (opts.heavy) base += 0.004;
    if (game.mode === 'versus') base += 0.004;
    game.freezeT = Math.max(game.freezeT, Math.min(base, 0.028));
    if (opts.heavy || dmg >= 18) {
      try {
        const x = game.player ? game.player.x : (typeof W !== 'undefined' ? W * 0.5 : 0);
        AudioSys.sfxAt('hitstop', x);
      } catch (_) {}
    }
    return;
  }
  const kind = spec && spec.kind ? spec.kind : 'punch';
  let base = kind === 'special' ? 0.052 : kind === 'kick' ? 0.038 : 0.026;
  if (opts.heavy || (spec && spec.dmg >= 18)) base += 0.008;
  if (opts.crit) base += 0.014;
  if (opts.combo >= 6) base += 0.006;
  if (opts.combo >= 10) base += 0.006;
  if (game.mode === 'versus') base += 0.006;
  base = Math.min(base, 0.072);
  game.freezeT = Math.max(game.freezeT, base);
  if (opts.crit || opts.heavy || (spec && spec.dmg >= 18)) {
    try {
      const x = game.player ? game.player.x : (typeof W !== 'undefined' ? W * 0.5 : 0);
      AudioSys.sfxAt('hitstop', x);
    } catch (_) {}
  }
}
function isBossWave(level, waveIdx) {
  return !!(level && level.boss && waveIdx === level.waves.length - 1);
}

function rollWaveGiant(n, elite, spId, giantBonus) {
  if (elite || n < 2) return false;
  let chance = GIANT_SPAWN_CHANCE + (Number(giantBonus) || 0);
  const sp = spId && SPECIES[spId];
  if (sp && typeof BEAST_SIZE_ARTS !== 'undefined' && BEAST_SIZE_ARTS.has(sp.art)) {
    chance = Math.min(0.55, chance + BEAST_GIANT_BONUS);
  }
  return Math.random() < chance;
}

function maxRarityForAdvLevel(n, diff) {
  const meta = typeof advDiffMeta === 'function' ? advDiffMeta(diff) : { order: 0, rarityBoost: 0 };
  let maxRarity = n >= 61 ? 7 : n >= 51 ? 6 : n >= 45 ? 5 : n >= 32 ? 4 : n >= 20 ? 3 : n >= 10 ? 2 : n >= 4 ? 1 : 0;
  maxRarity = Math.min(7, maxRarity + (meta.rarityBoost || 0));
  if ((meta.order || 0) >= 1) {
    maxRarity = Math.max(maxRarity, Math.min(7, meta.order + Math.floor((n - 1) / 8)));
  }
  if ((meta.order || 0) >= 2) {
    maxRarity = Math.max(maxRarity, Math.min(7, 2 + Math.floor((n - 1) / 6)));
  }
  return maxRarity;
}

function buildLevel(n, diffId) {
  const diff = typeof advDiffMeta === 'function' ? advDiffMeta(diffId) : {
    id: 'normal', order: 0, hpMul: 1, dmgMul: 1, rarityBoost: 0, eliteBonus: 0, giantBonus: 0,
    theme: null, speedMul: 1, enrageMul: 1, enrageAt: 0.5, hordeMul: 1, model: '1.0',
  };
  const hpMul = (1 + (n - 1) * 0.14) * (diff.hpMul || 1);
  const dmgMul = (1 + (n - 1) * 0.08) * (diff.dmgMul || 1);
  const maxRarity = maxRarityForAdvLevel(n, diff.id);
  const rarityBias = diff.order || 0;
  const eliteChance = 0.14 + (diff.eliteBonus || 0);
  const fightPool = Object.keys(UNLOCK_AT).filter(id => {
    const sp = SPECIES[id];
    return sp && UNLOCK_AT[id] <= n && rarityOf(sp.rarity).order <= maxRarity && id !== 'guvvedrak';
  });
  const pool = fightPool.length ? fightPool : ['slymo'];
  const flyPool = pool.filter((id) => {
    const t = SPECIES[id] && SPECIES[id].type;
    return t === 'fly' || t === 'dragon';
  });
  const waves = [];
  const waveMeta = [];
  const waveCount = Math.min(2 + Math.floor(n / 5) + (diff.order >= 2 ? 1 : 0), 6);
  const basePerWave = 2 + Math.floor(n / 4);
  const hordeScale = (diff.hordeMul || 1);
  const perWave = Math.min(
    Math.max(2, Math.ceil(basePerWave * ADVENTURE_HORDE_MUL * hordeScale)),
    ADVENTURE_HORDE_MAX_PER_WAVE
  );
  for (let w = 0; w < waveCount; w++) {
    const list = [];
    for (let i = 0; i < perWave; i++) {
      const sp = weightedPick(pool, n, rarityBias);
      if (!SPECIES[sp]) continue;
      const rareElite = rarityOf(SPECIES[sp].rarity).order >= 3 && Math.random() < eliteChance;
      list.push({ sp, elite: rareElite, giant: rollWaveGiant(n, rareElite, sp, diff.giantBonus) });
    }
    const meta = { trait: null, spawnMul: 1, label: '' };
    const roll = Math.random();
    // Model 3.0: pijn-golf — meer elites + reuzen
    if (diff.order >= 2 && roll < 0.26) {
      meta.trait = 'pain';
      meta.spawnMul = 0.78;
      meta.label = 'pain';
      for (let i = 0; i < list.length; i++) {
        if (Math.random() < 0.45) list[i].elite = true;
        if (Math.random() < 0.35) {
          list[i].giant = true;
        }
      }
      if (list.length) {
        const sp = weightedPick(pool, n, rarityBias + 1);
        list.push({ sp, elite: true, giant: rollWaveGiant(n, true, sp, (diff.giantBonus || 0) + 0.1) });
      }
    // Model 2.0+: ember/rush — snellere spawn + vuur-druk
    } else if (diff.order >= 1 && roll < 0.34) {
      meta.trait = 'ember';
      meta.spawnMul = 0.68;
      meta.label = 'ember';
      for (let i = 0; i < Math.min(3, list.length); i++) {
        const ix = Math.floor(Math.random() * list.length);
        list[ix].elite = list[ix].elite || Math.random() < 0.4;
      }
    } else if (flyPool.length && n >= 3 && roll < 0.22) {
      list[Math.floor(Math.random() * list.length)].sp = weightedPick(flyPool, n, rarityBias);
      meta.trait = 'flyers';
      meta.label = 'Vliegers — mik omhoog!';
    } else if (roll < 0.36) {
      meta.trait = 'rush';
      meta.spawnMul = 0.76;
      meta.label = 'rush';
    } else if (n >= 8 && roll < 0.48) {
      meta.trait = 'tide';
      meta.spawnMul = 0.84;
      meta.label = 'tide';
      const seaPool = seaSpeciesPool(n, maxRarity);
      if (seaPool.length) {
        for (let i = 0; i < list.length; i++) {
          if (Math.random() < 0.58) list[i].sp = tideWaveSeaPick(seaPool, n, maxRarity);
        }
      }
    } else if (n >= 3 && roll < 0.58) {
      meta.trait = 'ranch';
      meta.spawnMul = 0.88;
      meta.label = 'ranch';
      const farmPool = farmSpeciesPool(n, maxRarity);
      if (farmPool.length) {
        for (let i = 0; i < list.length; i++) {
          if (Math.random() < 0.72) {
            const fp = weightedPick(farmPool, n, rarityBias);
            list[i].sp = fp;
            list[i].giant = list[i].giant || rollWaveGiant(n, !!list[i].elite, fp, diff.giantBonus);
          }
        }
      }
    } else if (n >= 5 && roll < 0.70) {
      meta.trait = 'safari';
      meta.spawnMul = 0.86;
      meta.label = 'safari';
      const zooPool = zooSpeciesPool(n, maxRarity);
      if (zooPool.length) {
        for (let i = 0; i < list.length; i++) {
          if (Math.random() < 0.72) {
            const zp = weightedPick(zooPool, n, rarityBias);
            list[i].sp = zp;
            list[i].giant = true; // dierentuin: altijd grote grote versies
          }
        }
      }
    } else if (n >= 7 && roll < 0.76) {
      const sp = weightedPick(pool, n, rarityBias);
      list.push({ sp, elite: true, giant: rollWaveGiant(n, true, sp, diff.giantBonus) });
      meta.trait = 'elite';
      meta.label = 'Extra elite';
    }
    waves.push(list);
    waveMeta.push(meta);
  }
  // Soft live A3: golf 1 milder — minder mobs, geen rush/pain/ember, langzamere spawn.
  if (waves[0] && waves[0].length) {
    const softCap = n <= 3
      ? Math.max(4, Math.ceil(perWave * 0.42))
      : n <= 8
        ? Math.max(5, Math.ceil(perWave * 0.55))
        : Math.max(6, Math.ceil(perWave * 0.72));
    if (waves[0].length > softCap) waves[0] = waves[0].slice(0, softCap);
    if (n <= 5) {
      for (let i = 0; i < waves[0].length; i++) {
        waves[0][i].elite = false;
        if (n <= 2) waves[0][i].giant = false;
      }
    }
    if (waveMeta[0]) {
      const harsh = waveMeta[0].trait === 'rush' || waveMeta[0].trait === 'ember' || waveMeta[0].trait === 'pain';
      if (harsh && n <= 8) {
        waveMeta[0].trait = null;
        waveMeta[0].label = '';
      }
      waveMeta[0].spawnMul = Math.max(waveMeta[0].spawnMul || 1, n <= 8 ? 1.22 : 1.1);
    }
  }
  if (BOSS_AT[n]) {
    const bossWave = BOSS_AT[n].map(x => Object.assign({}, x, { bossCore: !!x.elite }));
    const hordePad = Math.min(3 + Math.floor(n / 8) + (diff.order || 0) * 2, 12);
    for (let i = 0; i < hordePad; i++) {
      const elite = Math.random() < (0.1 + (diff.eliteBonus || 0) * 0.5);
      const bsp = weightedPick(pool, n, rarityBias);
      bossWave.push({ sp: bsp, elite, giant: rollWaveGiant(n, elite, bsp, diff.giantBonus) });
    }
    waves.push(bossWave);
    waveMeta.push({ trait: 'boss', spawnMul: 1, label: 'Baas-golf' });
  }
  let theme = WORLD_THEMES[n - 1] || (n >= 61 ? 'hel' : (n >= 51 ? 'nachtmerrie' : 'cyber'));
  if (diff.theme) theme = diff.theme;
  const rarityCap = ['common','uncommon','rare','epic','legendary','mythic','nightmare','hell'][maxRarity] || 'mythic';
  return {
    n, waves, waveMeta, hpMul, dmgMul, theme, boss: !!BOSS_AT[n], rarityCap,
    diff: diff.id || 'normal',
    speedMul: diff.speedMul || 1,
    model: diff.model || '1.0',
    enrageMul: diff.enrageMul || 1,
    enrageAt: diff.enrageAt != null ? diff.enrageAt : 0.5,
  };
}

const WAVE_TRAIT_BANNER = {
  flyers: { key: 'banner.flyerWave', color: '#c47aff', size: 40 },
  rush: { key: 'banner.rushWave', color: '#ffb06a', size: 40 },
  elite: { key: 'banner.eliteTraitWave', color: '#ffb0b8', size: 40 },
  tide: { key: 'banner.tideWave', color: '#6ee06e', size: 40 },
  ranch: { key: 'banner.ranchWave', color: '#e8c98a', size: 40 },
  safari: { key: 'banner.safariWave', color: '#43b25b', size: 40 },
  ember: { key: 'banner.emberWave', color: '#ff7a4d', size: 42 },
  pain: { key: 'banner.painWave', color: '#ff3a2a', size: 44 },
};

function waveTraitBanner(trait) {
  const m = WAVE_TRAIT_BANNER[trait];
  if (!m || typeof t !== 'function') return null;
  return { text: t(m.key), color: m.color, size: m.size };
}

/** Avontuur: 2× d6 gok vóór level — super-baas of super-bondgenoot (alleen dit level). */
const GAMBLE_ALLIES = {
  ki: { id: 'ki', name: 'Ki-sage', dmgMul: 1.2, energyRate: 1.4, color: '#7cf5ff' },
  scroll: { id: 'scroll', name: 'Scroll-meester', dmgMul: 1.16, maxHpBonus: 32, color: '#ffd75e' },
  tide: { id: 'tide', name: 'Tide-elite', dmgMul: 1.14, healBetweenWaves: 0.1, color: '#6ee06e' },
  cape: { id: 'cape', name: 'Cape-held', dmgMul: 1.18, shieldStart: 3.5, color: '#ffb0b8' },
  dawn: { id: 'dawn', name: 'Dawn-waker', dmgMul: 1.24, critBonus: 0.07, color: '#c47aff' },
};
const GAMBLE_ALLY_IDS = Object.keys(GAMBLE_ALLIES);

function pickSuperBossSpecies(levelN) {
  const pool = SPECIES_ORDER.filter((id) => {
    if (id === 'satan' || (typeof isTideBossId === 'function' && isTideBossId(id))) return false;
    const o = rarityOf(SPECIES[id].rarity).order;
    return o >= 3 && (UNLOCK_AT[id] == null || UNLOCK_AT[id] <= levelN);
  });
  if (!pool.length) return 'magmabon';
  return pool[Math.floor(Math.random() * pool.length)];
}

function rollStageGamble() {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const sum = d1 + d2;
  let outcome = 'neutral';
  if (sum <= 3) outcome = 'superBoss';
  else if (sum <= 5) outcome = 'miniBoss';
  else if (sum >= 12) outcome = 'superAlly';
  else if (sum >= 9) outcome = 'ally';
  const allyId = GAMBLE_ALLY_IDS[Math.floor(Math.random() * GAMBLE_ALLY_IDS.length)];
  return { d1, d2, sum, outcome, allyId };
}

function gambleDiceFace(d) {
  return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][d - 1] || '?';
}

function gambleRollToastLine(g) {
  if (!g) return '';
  const faces = `${gambleDiceFace(g.d1)} ${gambleDiceFace(g.d2)} = ${g.sum}`;
  if (g.outcome === 'neutral') return t('ui.gambleRollNeutral', { faces });
  const label = typeof gambleOutcomeLabelFromKey === 'function'
    ? gambleOutcomeLabelFromKey(g).replace(/^[^!]+!?\s*/, '').slice(0, 40)
    : '';
  return label ? t('ui.gambleRollOutcome', { faces, label }) : faces;
}

function gambleOutcomeLabel(g) {
  if (!g) return '';
  if (g.outcome === 'superBoss') return 'Pech! Super-baas in een willekeurige golf';
  if (g.outcome === 'miniBoss') return 'Risico: extra elite-super in een golf';
  if (g.outcome === 'superAlly') {
    const a = GAMBLE_ALLIES[g.allyId];
    return `Jackpot! Super-bondgenoot: ${a ? a.name : 'Sage'} (sterk buff)`;
  }
  if (g.outcome === 'ally') {
    const a = GAMBLE_ALLIES[g.allyId];
    return `Geluk! Bondgenoot: ${a ? a.name : 'Sage'} (buff dit level)`;
  }
  return 'Neutraal — gewoon level (geen extra gok-effect)';
}

/** Intro-lied + FX voor elite / baas / super-baas (avontuur). */
function triggerSpecialEnemyIntro(game, monster, kind) {
  if (!game || !monster) return;
  const tier = kind || (monster.superBoss ? 'superBoss' : (monster.bossCore ? 'boss' : (monster.elite ? 'elite' : 'boss')));
  const name = (monster.sp && monster.sp.name) || 'Baas';
  const rar = rarityOf(monster.sp?.rarity || 'rare');
  const bigBoss = !!(monster.bossCore || monster.superBoss || tier === 'superBoss');
  const colossal = !!monster.colossal;
  const col = tier === 'superBoss' ? '#ffd75e' : (tier === 'boss' ? '#ff6b6b' : (rar.color || '#ffb0b8'));
  let introDur = tier === 'superBoss' ? 2.4 : (tier === 'boss' ? 2.0 : 1.55);
  if (bigBoss) introDur = colossal ? 3.6 : (tier === 'superBoss' ? 3.2 : 2.85);
  monster.introDur = introDur;
  monster.introT = introDur;
  monster.introTier = tier;
  const waveKey = `${game.mode || 'x'}:${game.waveIdx}:${tier === 'superBoss' ? 'super' : (bigBoss ? 'bossCore' : 'special')}`;
  const firstOfWave = tier === 'superBoss' || bigBoss || game._specialIntroKey !== waveKey;
  if (firstOfWave) game._specialIntroKey = waveKey;

  if (firstOfWave) {
    try {
      if (tier === 'superBoss') {
        if (game.gambleBossWave > 0) {
          try { AudioSys.sfx('bossTurn'); } catch (_) {}
        }
        AudioSys.sting('superBossIntro');
        if (typeof playFightBgm === 'function') playFightBgm('boss');
        else AudioSys.play('boss');
        const title = typeof t === 'function' ? t('banner.superBossTitle') : 'SUPER BAAS';
        game.banner(title, 2.8, col, bigBoss ? 68 : 44);
        game.banner(colossal
          ? (typeof t === 'function' ? t('banner.colossalBossName', { name }) : `COLOSSALE ${name}!`)
          : (typeof t === 'function' ? t('banner.bossName', { name }) : name), 2.5, '#fff', bigBoss ? 52 : 40);
      } else if (tier === 'boss') {
        AudioSys.sting('bossIntro');
        if (typeof playFightBgm === 'function') playFightBgm('boss');
        else AudioSys.play('boss');
        if (bigBoss) {
          const title = typeof t === 'function' ? t('banner.bossTitle') : 'BAAS';
          game.banner(title, 2.6, col, 64);
          game.banner(colossal
            ? (typeof t === 'function' ? t('banner.colossalBossName', { name }) : `COLOSSALE ${name}!`)
            : (typeof t === 'function' ? t('banner.bossName', { name }) : `${name}!`), 2.35, '#fff', 50);
        } else {
          game.banner(typeof t === 'function' ? t('banner.bossNamed', { name }) : `BAAS — ${name}!`, 1.8, col, 42);
        }
      } else {
        AudioSys.sting('eliteIntro');
        if (typeof playFightBgm === 'function') playFightBgm('elite');
        else AudioSys.play('elite');
        game.banner(typeof t === 'function' ? t('banner.eliteNamed', { name }) : `ELITE — ${name}!`, 1.5, col, 38);
      }
    } catch (_) {}
    try { AudioSys.sfx('roar'); } catch (_) {}
  } else {
    try { game.floater(monster.x, monster.y - monster.size - 20, name, col, 14); } catch (_) {}
  }

  const x = monster.x, y = monster.y - (monster.size || 40) * 0.4;
  const burstN = motionReduced() || fxLite()
    ? 8
    : (firstOfWave ? (tier === 'superBoss' || colossal ? 34 : (bigBoss ? 26 : 18)) : 8);
  try {
    game.burst(x, y, col, burstN);
    if (firstOfWave) {
      game.burst(x, y, '#fff', Math.ceil(burstN * 0.35));
      spawnFxRing(game, x, y, col, tier === 'superBoss' || colossal ? 26 : (bigBoss ? 20 : 14));
      if (tier !== 'elite') spawnFxRing(game, x, y - 20, '#fff', bigBoss ? 14 : 10);
      if (colossal) spawnFxRing(game, x, y - 36, '#ffd75e', 16);
      const shakeAmt = colossal ? 16 : (tier === 'superBoss' ? 14 : (bigBoss ? 11 : (tier === 'boss' ? 9 : 6)));
      const shakeDur = colossal ? 0.55 : (tier === 'superBoss' ? 0.48 : (bigBoss ? 0.38 : (tier === 'boss' ? 0.28 : 0.22)));
      game.shake(shakeAmt, shakeDur);
      game.freezeT = Math.max(game.freezeT || 0, colossal ? 0.22 : (tier === 'superBoss' ? 0.18 : (bigBoss ? 0.14 : 0.1)));
      haptic(colossal ? 36 : (tier === 'superBoss' ? 28 : (bigBoss ? 22 : 16)));
    }
  } catch (_) {}
}

function applyGambleToStage(game, g) {
  if (!game || !g || !game.level) return;
  game.stageDmgMul = 1;
  game.stageEnergyMul = 1;
  game.stageAlly = null;
  game.stageHealBetween = 0;
  game.stageShieldPerWave = 0;
  game.stageCritBonus = 0;
  game.gambleBossWave = 0;
  const pot = g.outcome === 'superAlly' ? 1.22 : 1;
  if (g.outcome === 'superBoss' || g.outcome === 'miniBoss') {
    const wi = Math.floor(Math.random() * game.level.waves.length);
    const sp = pickSuperBossSpecies(game.level.n);
    game.level.waves[wi].push({
      sp,
      elite: true,
      superBoss: g.outcome === 'superBoss',
      bossCore: g.outcome === 'superBoss',
    });
    game.gambleBossWave = wi + 1;
  }
  if (g.outcome === 'ally' || g.outcome === 'superAlly') {
    const ally = GAMBLE_ALLIES[g.allyId] || GAMBLE_ALLIES.ki;
    game.stageAlly = ally;
    game.stageDmgMul = (ally.dmgMul || 1) * pot;
    game.stageEnergyMul = (ally.energyRate || 1) * (g.outcome === 'superAlly' ? 1.12 : 1);
    const hpBonus = Math.round((ally.maxHpBonus || 0) * pot);
    if (hpBonus > 0 && game.player) {
      game.player.maxhp += hpBonus;
      game.player.hp = Math.min(game.player.maxhp, game.player.hp + hpBonus);
    }
    game.stageHealBetween = (ally.healBetweenWaves || 0) * pot;
    game.stageShieldPerWave = (ally.shieldStart || 0) * pot;
    game.stageCritBonus = (ally.critBonus || 0) * pot;
    if (ally.id === 'tide' && game.level && game.level.waveMeta && game.level.waves) {
      const slots = game.level.waveMeta.map((m, i) => ({ m, i })).filter((x) => x.m.trait !== 'boss');
      if (slots.length) {
        const pick = slots[Math.floor(Math.random() * slots.length)];
        pick.m.trait = 'tide';
        pick.m.spawnMul = Math.min(pick.m.spawnMul || 1, 0.82);
        pick.m.label = 'tide';
        const maxOrd = rarityOf(game.level.rarityCap || 'mythic').order;
        const seaPool = seaSpeciesPool(game.level.n, maxOrd);
        const wave = game.level.waves[pick.i];
        if (seaPool.length && wave) {
          for (let j = 0; j < wave.length; j++) {
            if (Math.random() < 0.62) {
              const sp = tideWaveSeaPick(seaPool, game.level.n, maxOrd);
              if (sp) wave[j].sp = sp;
            }
          }
        }
      }
    }
  }
}

let pendingAdvLevel = null;
let lastGambleRoll = null;

