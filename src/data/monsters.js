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
};
const SPECIES_ORDER = Object.keys(SPECIES).sort((a, b) =>
  (rarityOf(SPECIES[a].rarity).order - rarityOf(SPECIES[b].rarity).order) || SPECIES[a].name.localeCompare(SPECIES[b].name)
);

const WORLD_THEMES = [
  'veld','veld','veld','bos','bos',
  'bos','grot','grot','grot','vulkaan',
  'vulkaan','vulkaan','cyber','cyber','cyber',
  'dojo','dojo','grot','vulkaan','cyber',
  'veld','bos','grot','vulkaan','cyber',
  'dojo','sloop','cyber','vulkaan','grot',
  'cyber','cyber','vulkaan','dojo','cyber',
  'cyber','vulkaan','dojo','cyber','cyber',
  'cyber','vulkaan','dojo','cyber','cyber',
  'cyber','cyber','cyber','cyber','cyber',
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

};
/** Avontuur horde: 6× meer spawns + reuzen + volledig monsterboek (114 soorten). */
const ADVENTURE_HORDE_MUL = 6;
const ADVENTURE_HORDE_MAX_PER_WAVE = 36;
const ADVENTURE_MAX_ALIVE = IS_TOUCH ? 54 : 78;
const GIANT_SPAWN_CHANCE = 0.15;
const GIANT_SIZE_MUL = 1.52;
const GIANT_HP_MUL = 1.34;
const GIANT_DMG_MUL = 1.14;
const GIANT_XP_MUL = 1.3;
/** Nood-ontsnapping als je omringd / stunlocked bent — tik midden-KETS! */
const KETSBAM_DETECT_R = 148;
const KETSBAM_NEAR_MIN = 4;
const KETSBAM_BLAST_R = 192;
const KETSBAM_CD = 9;
const KETSBAM_INVULN = 1.15;
const KETSBAM_SUPER_ARMOR = 0.95;
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
};

function weightedPick(pool, n) {
  const weights = pool.map(id => {
    const o = rarityOf(SPECIES[id].rarity).order;
    return Math.max(0.3, 1.5 - o * 0.22 + Math.min(n, 45) * 0.012 * o);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
const STAR_HP = { three: 0.72, two: 0.38 };
function starsFromHpPct(hpPct) {
  if (hpPct > STAR_HP.three) return 3;
  if (hpPct > STAR_HP.two) return 2;
  return 1;
}
function starHintLine() {
  return `3★ >${Math.round(STAR_HP.three * 100)}% HP · 2★ >${Math.round(STAR_HP.two * 100)}% · 1★ = win`;
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
    const dmg = spec && spec.dmg != null ? spec.dmg : 8;
    let base = dmg >= 18 ? 0.04 : 0.026;
    if (opts.heavy) base += 0.006;
    if (game.mode === 'versus') base += 0.004;
    game.freezeT = Math.max(game.freezeT, Math.min(base, 0.048));
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
}
function isBossWave(level, waveIdx) {
  return !!(level && level.boss && waveIdx === level.waves.length - 1);
}

function rollWaveGiant(n, elite) {
  if (elite || n < 2) return false;
  return Math.random() < GIANT_SPAWN_CHANCE;
}

function buildLevel(n) {
  const hpMul = 1 + (n - 1) * 0.14;
  const dmgMul = 1 + (n - 1) * 0.08;
  const maxRarity = n >= 45 ? 5 : n >= 32 ? 4 : n >= 20 ? 3 : n >= 10 ? 2 : n >= 4 ? 1 : 0;
  const fightPool = Object.keys(UNLOCK_AT).filter(id =>
    UNLOCK_AT[id] <= n && rarityOf(SPECIES[id].rarity).order <= maxRarity && id !== 'guvvedrak'
  );
  const pool = fightPool.length ? fightPool : ['slymo'];
  const flyPool = pool.filter((id) => {
    const t = SPECIES[id] && SPECIES[id].type;
    return t === 'fly' || t === 'dragon';
  });
  const waves = [];
  const waveMeta = [];
  const waveCount = Math.min(2 + Math.floor(n / 5), 5);
  const basePerWave = 2 + Math.floor(n / 4);
  const perWave = Math.min(Math.max(2, Math.ceil(basePerWave * ADVENTURE_HORDE_MUL)), ADVENTURE_HORDE_MAX_PER_WAVE);
  for (let w = 0; w < waveCount; w++) {
    const list = [];
    for (let i = 0; i < perWave; i++) {
      const sp = weightedPick(pool, n);
      const rareElite = rarityOf(SPECIES[sp].rarity).order >= 3 && Math.random() < 0.14;
      list.push({ sp, elite: rareElite, giant: rollWaveGiant(n, rareElite) });
    }
    const meta = { trait: null, spawnMul: 1, label: '' };
    const roll = Math.random();
    if (flyPool.length && n >= 3 && roll < 0.22) {
      list[Math.floor(Math.random() * list.length)].sp = weightedPick(flyPool, n);
      meta.trait = 'flyers';
      meta.label = 'Vliegers — mik omhoog!';
    } else if (roll < 0.38) {
      meta.trait = 'rush';
      meta.spawnMul = 0.76;
      meta.label = 'Rush-golf';
    } else if (n >= 7 && roll < 0.52) {
      const sp = weightedPick(pool, n);
      list.push({ sp, elite: true, giant: rollWaveGiant(n, true) });
      meta.trait = 'elite';
      meta.label = 'Extra elite';
    }
    waves.push(list);
    waveMeta.push(meta);
  }
  if (BOSS_AT[n]) {
    const bossWave = BOSS_AT[n].map(x => Object.assign({}, x));
    const hordePad = Math.min(3 + Math.floor(n / 8), 10);
    for (let i = 0; i < hordePad; i++) {
      const elite = Math.random() < 0.1;
      bossWave.push({ sp: weightedPick(pool, n), elite, giant: rollWaveGiant(n, elite) });
    }
    waves.push(bossWave);
    waveMeta.push({ trait: 'boss', spawnMul: 1, label: 'Baas-golf' });
  }
  const theme = WORLD_THEMES[n - 1] || 'cyber';
  const rarityCap = ['common','uncommon','rare','epic','legendary','mythic'][maxRarity];
  return { n, waves, waveMeta, hpMul, dmgMul, theme, boss: !!BOSS_AT[n], rarityCap };
}

const WAVE_TRAIT_BANNER = {
  flyers: { text: 'VLIEGER-GOLF', color: '#c47aff', size: 40 },
  rush: { text: 'RUSH-GOLF', color: '#ffb06a', size: 40 },
  elite: { text: 'ELITE-GOLF', color: '#ffb0b8', size: 40 },
};

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
  const tier = kind || (monster.superBoss ? 'superBoss' : (monster.elite ? 'elite' : 'boss'));
  const name = (monster.sp && monster.sp.name) || 'Baas';
  const rar = rarityOf(monster.sp?.rarity || 'rare');
  const col = tier === 'superBoss' ? '#ffd75e' : (tier === 'boss' ? '#ff6b6b' : (rar.color || '#ffb0b8'));
  monster.introT = tier === 'superBoss' ? 2.4 : (tier === 'boss' ? 2.0 : 1.55);
  monster.introTier = tier;
  const waveKey = `${game.mode || 'x'}:${game.waveIdx}:${tier === 'superBoss' ? 'super' : 'special'}`;
  const firstOfWave = tier === 'superBoss' || game._specialIntroKey !== waveKey;
  if (firstOfWave) game._specialIntroKey = waveKey;

  if (firstOfWave) {
    try {
      if (tier === 'superBoss') {
        AudioSys.sting('superBossIntro');
        AudioSys.play('boss');
        game.banner(`SUPER BAAS — ${name}!`, 2.0, col, 44);
      } else if (tier === 'boss') {
        AudioSys.sting('bossIntro');
        AudioSys.play('boss');
        game.banner(`BAAS — ${name}!`, 1.8, col, 42);
      } else {
        AudioSys.sting('eliteIntro');
        AudioSys.play('elite');
        game.banner(`ELITE — ${name}!`, 1.5, col, 38);
      }
    } catch (_) {}
    try { AudioSys.sfx('roar'); } catch (_) {}
  } else {
    try { game.floater(monster.x, monster.y - monster.size - 20, name, col, 14); } catch (_) {}
  }

  const x = monster.x, y = monster.y - (monster.size || 40) * 0.4;
  const burstN = motionReduced() || fxLite()
    ? 8
    : (firstOfWave ? (tier === 'superBoss' ? 28 : 18) : 8);
  try {
    game.burst(x, y, col, burstN);
    if (firstOfWave) {
      game.burst(x, y, '#fff', Math.ceil(burstN * 0.35));
      spawnFxRing(game, x, y, col, tier === 'superBoss' ? 22 : 14);
      if (tier !== 'elite') spawnFxRing(game, x, y - 20, '#fff', 10);
      game.shake(tier === 'superBoss' ? 12 : (tier === 'boss' ? 9 : 6), tier === 'superBoss' ? 0.42 : 0.28);
      game.freezeT = Math.max(game.freezeT || 0, tier === 'superBoss' ? 0.16 : 0.1);
      haptic(tier === 'superBoss' ? 28 : 16);
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
  }
}

let pendingAdvLevel = null;
let lastGambleRoll = null;

