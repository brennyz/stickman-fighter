/* ============================== GEAR LOADOUT =========================== */
/**
 * Stickman character loadout — systems API (stable IDs for the gear-UI lane).
 *
 * Slots (5): head · chest · hands · legs · back
 * Save bag (schema 1): { schema, equipped:{slot:id|null}, owned:{id:{at,src}} }
 * Legacy: slot `charm` and `charm_*` ids migrate → `back` / `back_*`.
 *
 * Flags (explicit, never infer from kind alone):
 *   vanity   — true  → combat MUST ignore mods
 *   hasStats — true  → may carry combat mods
 * Rule: gearItemHasCombatStats === hasStats && !vanity && mods
 *
 * MOST cosmetics are vanity. SOME cosmetics have stats. Armour has stats.
 * Every lootable item has BOTH unlockLvl (save.lvl) AND unlockDays (account age).
 *
 * World-drop lane (sibling src/data/gear-world.js):
 *   grant is can-own-locked (gates not re-checked); rolls use lootable / allowLocked.
 *   rollGearDrop is implemented here so systems + spawners share one picker.
 *
 * Equip API (#295 + #307):
 *   gearEquipState / gearCanEquip → ok | vanity-ok | already-equipped | locked | not-owned | wrong-slot | unknown
 *   gearEquipItem(id, s, now, expectSlot) OR gearEquipItem(id, { expectSlot? })
 *   gearSlotInventory(slot, save) → owned + locked preview + gate copy.
 */
const GEAR_SCHEMA = 1;
const GEAR_MS_PER_DAY = 86400000;
const GEAR_CREATED_MIN_MS = 1704067200000; /* 2024-01-01 */
const GEAR_VETERAN_BACKDATE_DAYS = 90;
const GEAR_OWNED_CAP = 240;
const GEAR_SRC_MAX = 16;
const GEAR_SLOT_IDS = ['head', 'chest', 'hands', 'legs', 'back'];
const GEAR_SLOT_ALIASES = { charm: 'back', accessory: 'back', aura: 'back' };
const GEAR_ID_ALIASES = {
  charm_pin_dot: 'back_pin_dot',
  charm_pin_star: 'back_pin_star',
  charm_leaf: 'back_leaf',
  charm_aura_glow: 'back_aura_glow',
  charm_cape_shadow: 'back_cape_shadow',
  charm_void: 'back_void',
  g_head_cloth: 'head_wrap_cloth',
  g_body_iron: 'chest_plate_iron',
  g_hands_tape: 'hands_gloves_tape',
  g_feet_wraps: 'legs_wrap',
  g_cosmetic_shadowcloak: 'back_cape_shadow',
};
const GEAR_SLOTS = [
  { id: 'head',  name: 'Hoofd',  nameEn: 'Head',  kindHint: 'armour',   accent: '#7cf5ff' },
  { id: 'chest', name: 'Borst',  nameEn: 'Chest', kindHint: 'armour',   accent: '#ffd75e' },
  { id: 'hands', name: 'Handen', nameEn: 'Hands', kindHint: 'armour',   accent: '#5ad06a' },
  { id: 'legs',  name: 'Benen',  nameEn: 'Legs',  kindHint: 'armour',   accent: '#c47aff' },
  { id: 'back',  name: 'Rug',    nameEn: 'Back',  kindHint: 'cosmetic', accent: '#ff6b9d' },
];
const GEAR_KINDS = ['armour', 'cosmetic'];
const GEAR_MOD_KEYS = [
  'maxHp', 'dmgMul', 'defMul', 'energyMul', 'critBonus', 'kbMul',
  'techniqueMul', 'shieldWave', 'blockMul', 'xpMul', 'speedMul',
  'weaponRange', 'advDmgMul',
];
const GEAR_BALANCE = {
  schema: 1,
  maxHpCap: 24,
  dmgMulCap: 1.12,
  defMulFloor: 0.88,
  energyMulCap: 1.10,
  critBonusCap: 0.06,
  kbMulCap: 1.10,
  techniqueMulCap: 1.10,
  shieldWaveCap: 1.2,
  blockMulFloor: 0.80,
  xpMulCap: 1.08,
  speedMulCap: 1.08,
  weaponRangeCap: 1.08,
  advDmgMulCap: 1.10,
};
const GEAR_RARITY_LOOK = {
  common:    ['#c8d0dc', '#9db1e3'],
  uncommon:  ['#8fd98a', '#2d6b36'],
  rare:      ['#7eb6ff', '#2a7fc0'],
  epic:      ['#c792ff', '#6b3aa0'],
  legendary: ['#ffd75e', '#c97a20'],
  mythic:    ['#ff6b9d', '#8a2048'],
  nightmare: ['#c47aff', '#4a2068'],
  hell:      ['#ff6a3d', '#8a2010'],
};

function emptyGearEquipped() {
  const o = {};
  for (const id of GEAR_SLOT_IDS) o[id] = null;
  return o;
}
function emptyGearBag() {
  return { schema: GEAR_SCHEMA, equipped: emptyGearEquipped(), owned: {} };
}
function gearSlotById(id) {
  const canon = GEAR_SLOT_ALIASES[id] || id;
  return GEAR_SLOTS.find((s) => s.id === canon) || null;
}
function gearCanonSlot(id) {
  if (GEAR_SLOT_IDS.includes(id)) return id;
  return GEAR_SLOT_ALIASES[id] || null;
}
function gearCanonItemId(id) {
  if (typeof id !== 'string') return '';
  const trimmed = id.slice(0, 48);
  return GEAR_ID_ALIASES[trimmed] || trimmed;
}

function _gearLook(tint, accent, layer) {
  return { tint: tint || '#c8d0dc', accent: accent || tint || '#9db1e3', layer: layer || 'body' };
}

function _gearItem(def) {
  const vanity = def.vanity === true;
  const rawMods = (!vanity && def.mods && typeof def.mods === 'object' && !Array.isArray(def.mods))
    ? def.mods : null;
  const mods = rawMods ? {} : null;
  if (rawMods) {
    for (const k of GEAR_MOD_KEYS) {
      if (rawMods[k] == null) continue;
      const n = Number(rawMods[k]);
      if (Number.isFinite(n)) mods[k] = n;
    }
    if (!Object.keys(mods).length) {
      /* empty after strip */
    }
  }
  const hasModKeys = !!(mods && Object.keys(mods).length);
  const hasStats = vanity ? false : (def.hasStats === true || hasModKeys);
  const rar = (def.rarity && GEAR_RARITY_LOOK[def.rarity]) ? def.rarity : 'common';
  const tintPair = GEAR_RARITY_LOOK[rar];
  return {
    id: def.id,
    slot: def.slot,
    kind: def.kind === 'armour' ? 'armour' : 'cosmetic',
    name: def.name,
    nameEn: def.nameEn || def.name,
    desc: def.desc || '',
    descEn: def.descEn || def.desc || '',
    rarity: rar,
    vanity,
    hasStats: hasStats && hasModKeys,
    mods: hasStats && hasModKeys ? mods : null,
    unlockLvl: Math.max(1, Math.floor(Number(def.unlockLvl) || 1)),
    unlockDays: Math.max(1, Math.floor(Number(def.unlockDays) || 1)),
    needAdvUnlocked: def.needAdvUnlocked != null ? Math.max(1, Math.floor(Number(def.needAdvUnlocked) || 1)) : null,
    needDiff: def.needDiff === 'nightmare' || def.needDiff === 'hell' ? def.needDiff : null,
    starter: def.starter === true,
    droppable: def.droppable !== false && def.starter !== true,
    look: def.look || _gearLook(tintPair[0], tintPair[1], def.slot),
  };
}

/** flags: v=vanity, s=hasStats, 1=starter. kind a=armour c=cosmetic */
function _g(slot, suffix, kind, flags, rar, lvl, days, name, nameEn, desc, descEn, mods, extra) {
  extra = extra || {};
  const vanity = flags.indexOf('v') !== -1;
  return _gearItem({
    id: slot + '_' + suffix,
    slot,
    kind: kind === 'a' ? 'armour' : 'cosmetic',
    vanity,
    hasStats: !vanity && (flags.indexOf('s') !== -1 || !!(mods && Object.keys(mods).length)),
    rarity: rar,
    unlockLvl: lvl,
    unlockDays: days,
    name,
    nameEn,
    desc,
    descEn,
    mods: vanity ? null : mods,
    starter: flags.indexOf('1') !== -1,
    needAdvUnlocked: extra.adv,
    needDiff: extra.diff,
    look: extra.look,
  });
}

const GEAR_ITEMS = [
  /* ════════ HEAD ════════ */
  _g('head', 'wrap_cloth', 'c', 'v1', 'common', 1, 1, 'Linnen wrap', 'Linen wrap', 'Eenvoudige hoofddoek. Alleen look.', 'Simple head wrap. Look only.'),
  _g('head', 'bandana_blue', 'c', 'v', 'common', 2, 2, 'Blauwe bandana', 'Blue bandana', 'Katoenen doek. Geen stats.', 'Cotton wrap. No stats.'),
  _g('head', 'beanie_wool', 'c', 'v', 'common', 4, 2, 'Wollen muts', 'Wool beanie', 'Warm en nutteloos in gevecht.', 'Warm and useless in a fight.'),
  _g('head', 'hat_paper', 'c', 'v', 'uncommon', 5, 3, 'Papieren hoed', 'Paper hat', 'Feestmuts. Geen stats.', 'Party hat. No stats.'),
  _g('head', 'crown_cardboard', 'c', 'v', 'uncommon', 7, 4, 'Kartonnen kroon', 'Cardboard crown', 'Koning voor één dag.', 'King for a day.'),
  _g('head', 'mask_fox', 'c', 'v', 'uncommon', 9, 5, 'Vossenmasker', 'Fox mask', 'Oranje karton. Alleen look.', 'Orange cardboard. Look only.'),
  _g('head', 'horns_foam', 'c', 'v', 'uncommon', 11, 5, 'Foam-hoorns', 'Foam horns', 'Feestwinkel-duivel.', 'Party-store devil.'),
  _g('head', 'hat_chef', 'c', 'v', 'rare', 13, 6, 'Koksmuts', 'Chef hat', 'Quiche, geen crits.', 'Quiche, not crits.'),
  _g('head', 'hood_rain', 'c', 'v', 'rare', 15, 7, 'Regenhood', 'Rain hood', 'Natte look. Geen stats.', 'Wet look. No stats.'),
  _g('head', 'helm_pumpkin', 'c', 'v', 'rare', 17, 8, 'Pompoenhelm', 'Pumpkin helm', 'Halloween-emmer op je kop.', 'Halloween bucket on your head.'),
  _g('head', 'halo_wire', 'c', 'v', 'epic', 22, 11, 'Draad-halo', 'Wire halo', 'Heilige knutsel. Geen zegen.', 'Holy craft. No blessing.'),
  _g('head', 'visor_toy', 'c', 'v', 'epic', 26, 13, 'Speelgoed-visor', 'Toy visor', 'Plastic sci-fi. Alleen look.', 'Plastic sci-fi. Look only.'),
  _g('head', 'hood_void_paint', 'c', 'v', 'legendary', 34, 18, 'Void-hood (verf)', 'Void hood (paint)', 'Zwarte verf. Geen leegte-kracht.', 'Black paint. No void power.'),
  _g('head', 'mask_dream', 'c', 'v', 'nightmare', 53, 30, 'Droommasker', 'Dream mask', 'Nachtmerrie-look. Geen stats.', 'Nightmare look. No stats.', null, { adv: 51, diff: 'nightmare' }),
  _g('head', 'horns_sulfur', 'c', 'v', 'hell', 63, 40, 'Zwavelhoorns', 'Sulfur horns', 'Hel-look. Geen brand.', 'Hell look. No burn.', null, { adv: 61, diff: 'hell' }),
  _g('head', 'visor_neon', 'c', 's', 'rare', 18, 8, 'Neon-visor', 'Neon visor', 'Cosmetisch visier mét energy.', 'Cosmetic visor that also boosts energy.', { energyMul: 1.03 }),
  _g('head', 'circlet_focus', 'c', 's', 'epic', 28, 14, 'Focus-cirkel', 'Focus circlet', 'Sieraad mét energy-regen.', 'Ornament that also speeds energy.', { energyMul: 1.04 }),
  _g('head', 'helm_lucky', 'c', 's', 'legendary', 38, 20, 'Gelukshelm', 'Lucky helm', 'Cosmetische helm mét crit.', 'Cosmetic helm that also adds crit.', { critBonus: 0.02 }),
  _g('head', 'helm_tin', 'a', 's', 'common', 3, 2, 'Tinnen helm', 'Tin helm', 'Licht blik. Kleine HP-bonus.', 'Light tin. Small HP bonus.', { maxHp: 4 }),
  _g('head', 'helm_bronze', 'a', 's', 'uncommon', 8, 4, 'Bronzen helm', 'Bronze helm', 'Zwaarder blik. Meer HP.', 'Heavier tin. More HP.', { maxHp: 6 }),
  _g('head', 'helm_iron', 'a', 's', 'rare', 12, 6, 'IJzeren helm', 'Iron helm', 'HP + minder chip.', 'HP + less chip.', { maxHp: 8, defMul: 0.97 }),
  _g('head', 'helm_steel', 'a', 's', 'rare', 20, 10, 'Stalen helm', 'Steel helm', 'Stevige schedelplaat.', 'Sturdy skull plate.', { maxHp: 9, defMul: 0.96 }),
  _g('head', 'helm_knight', 'a', 's', 'epic', 30, 15, 'Ridderhelm', 'Knight helm', 'Visier + mitigatie.', 'Visor + mitigation.', { maxHp: 10, defMul: 0.95 }),
  _g('head', 'helm_crystal', 'a', 's', 'legendary', 42, 22, 'Kristalhelm', 'Crystal helm', 'Scherven-pantser. HP + shield.', 'Shard plate. HP + shield.', { maxHp: 8, shieldWave: 0.4 }),
  _g('head', 'helm_void', 'a', 's', 'mythic', 48, 28, 'Void-helm', 'Void helm', 'Technique-focus + HP.', 'Technique focus + HP.', { maxHp: 6, techniqueMul: 1.03 }),
  _g('head', 'helm_nightmare', 'a', 's', 'nightmare', 55, 32, 'Nachtmerrie-helm', 'Nightmare helm', 'Droomplaat. HP + crit.', 'Dream plate. HP + crit.', { maxHp: 8, critBonus: 0.02 }, { adv: 51, diff: 'nightmare' }),
  _g('head', 'helm_hell', 'a', 's', 'hell', 65, 42, 'Hel-helm', 'Hell helm', 'Zwavelplaat. HP + schade.', 'Sulfur plate. HP + damage.', { maxHp: 10, dmgMul: 1.03 }, { adv: 61, diff: 'hell' }),

  /* ════════ CHEST ════════ */
  _g('chest', 'shirt_plain', 'c', 'v1', 'common', 1, 1, 'Gewoon shirt', 'Plain shirt', 'Basis-hemd. Alleen look.', 'Basic shirt. Look only.'),
  _g('chest', 'hoodie_gray', 'c', 'v', 'common', 3, 2, 'Grijze hoodie', 'Gray hoodie', 'Zacht. Geen stats.', 'Soft. No stats.'),
  _g('chest', 'vest_denim', 'c', 'v', 'common', 5, 3, 'Spijker-gilet', 'Denim vest', 'Jaren-90 look.', '90s look.'),
  _g('chest', 'coat_red', 'c', 'v', 'uncommon', 8, 4, 'Rode jas', 'Red coat', 'Flair-jas. Geen combat-bonus.', 'Flair coat. No combat bonus.'),
  _g('chest', 'gi_white', 'c', 'v', 'uncommon', 10, 5, 'Witte gi', 'White gi', 'Dojo-katoen. Alleen look.', 'Dojo cotton. Look only.'),
  _g('chest', 'jacket_bomber', 'c', 'v', 'uncommon', 12, 6, 'Bomberjack', 'Bomber jacket', 'Oranje nylon. Geen stats.', 'Orange nylon. No stats.'),
  _g('chest', 'tunic_leaf', 'c', 'v', 'rare', 14, 7, 'Blad-tuniek', 'Leaf tunic', 'Bos-cosplay.', 'Forest cosplay.'),
  _g('chest', 'shirt_stripe', 'c', 'v', 'rare', 16, 8, 'Streepshirt', 'Stripe shirt', 'Scheidsrechter-look.', 'Ref look.'),
  _g('chest', 'poncho_rain', 'c', 'v', 'rare', 19, 9, 'Regenponcho', 'Rain poncho', 'Plas-proof. Geen stats.', 'Puddle-proof. No stats.'),
  _g('chest', 'robe_star', 'c', 'v', 'epic', 24, 12, 'Sterrenmantel', 'Star robe', 'Glitter-stof. Alleen look.', 'Glitter cloth. Look only.'),
  _g('chest', 'capelet_gold', 'c', 'v', 'epic', 27, 14, 'Gouden schouder', 'Gold capelet', 'Bladgoud. Geen stats.', 'Gold leaf. No stats.'),
  _g('chest', 'jacket_void_paint', 'c', 'v', 'legendary', 36, 19, 'Void-jas (verf)', 'Void jacket (paint)', 'Zwarte verf. Geen leegte.', 'Black paint. No void.'),
  _g('chest', 'coat_dream', 'c', 'v', 'nightmare', 54, 31, 'Droomjas', 'Dream coat', 'Nachtmerrie-look. Geen stats.', 'Nightmare look. No stats.', null, { adv: 51, diff: 'nightmare' }),
  _g('chest', 'robe_ash', 'c', 'v', 'hell', 64, 41, 'As-mantel', 'Ash robe', 'Hel-look. Geen brand.', 'Hell look. No burn.', null, { adv: 61, diff: 'hell' }),
  _g('chest', 'vest_lucky', 'c', 's', 'uncommon', 10, 5, 'Geluksvest', 'Lucky vest', 'Cosmetisch vest mét schade.', 'Cosmetic vest that also adds damage.', { dmgMul: 1.02 }),
  _g('chest', 'sash_energy', 'c', 's', 'rare', 21, 10, 'Energy-sjerp', 'Energy sash', 'Sjerp mét energy-regen.', 'Sash that also speeds energy.', { energyMul: 1.03 }),
  _g('chest', 'coat_shadow_stat', 'c', 's', 'epic', 32, 16, 'Schaduwjas+', 'Shadow coat+', 'Cosmetische jas mét mitigatie.', 'Cosmetic coat that also mitigates.', { defMul: 0.97 }),
  _g('chest', 'vest_padded', 'a', 's', 'common', 4, 2, 'Gewatteerd vest', 'Padded vest', 'Zacht pantser. Extra max HP.', 'Soft armour. Extra max HP.', { maxHp: 6 }),
  _g('chest', 'mail_copper', 'a', 's', 'uncommon', 9, 4, 'Koperen maliën', 'Copper mail', 'Rinkelend HP.', 'Jingly HP.', { maxHp: 7 }),
  _g('chest', 'plate_iron', 'a', 's', 'rare', 16, 8, 'IJzeren plaat', 'Iron plate', 'Echt pantser. HP + mitigatie.', 'Real plate. HP + mitigation.', { maxHp: 10, defMul: 0.95 }),
  _g('chest', 'cuirass_steel', 'a', 's', 'rare', 22, 11, 'Stalen kuras', 'Steel cuirass', 'Zwaarder. Meer HP.', 'Heavier. More HP.', { maxHp: 11, defMul: 0.95 }),
  _g('chest', 'plate_knight', 'a', 's', 'epic', 31, 15, 'Ridderplaat', 'Knight plate', 'Volle borst. HP + blok.', 'Full chest. HP + block.', { maxHp: 12, blockMul: 0.92 }),
  _g('chest', 'vest_crystal', 'a', 's', 'legendary', 43, 23, 'Kristalvest', 'Crystal vest', 'Scherven + shield-golf.', 'Shards + wave shield.', { maxHp: 8, shieldWave: 0.5 }),
  _g('chest', 'plate_void', 'a', 's', 'mythic', 49, 29, 'Void-plaat', 'Void plate', 'Technique + HP.', 'Technique + HP.', { maxHp: 7, techniqueMul: 1.03 }),
  _g('chest', 'plate_nightmare', 'a', 's', 'nightmare', 56, 33, 'Nachtmerrie-plaat', 'Nightmare plate', 'Droomkuras. HP + schade.', 'Dream cuirass. HP + damage.', { maxHp: 10, dmgMul: 1.03 }, { adv: 51, diff: 'nightmare' }),
  _g('chest', 'plate_hell', 'a', 's', 'hell', 66, 43, 'Hel-plaat', 'Hell plate', 'Lava-kuras. HP + mitigatie.', 'Lava cuirass. HP + mitigation.', { maxHp: 12, defMul: 0.94 }, { adv: 61, diff: 'hell' }),

  /* ════════ HANDS ════════ */
  _g('hands', 'wrap', 'c', 'v1', 'common', 1, 1, 'Handwraps', 'Hand wraps', 'Tape om de vuisten. Alleen look.', 'Tape on the fists. Look only.'),
  _g('hands', 'mittens_wool', 'c', 'v', 'common', 3, 2, 'Wollen wanten', 'Wool mittens', 'Warm. Geen stats.', 'Warm. No stats.'),
  _g('hands', 'rings_plastic', 'c', 'v', 'common', 5, 3, 'Plastic ringen', 'Plastic rings', 'Speelgoed-bling.', 'Toy bling.'),
  _g('hands', 'gloves_sparkle', 'c', 'v', 'uncommon', 7, 4, 'Glitter-handschoenen', 'Sparkle gloves', 'Disco-look. Geen stats.', 'Disco look. No stats.'),
  _g('hands', 'claws_toy', 'c', 'v', 'uncommon', 9, 5, 'Speelgoed-klauwen', 'Toy claws', 'Halloween-winkel.', 'Halloween shop.'),
  _g('hands', 'gloves_chef', 'c', 'v', 'uncommon', 11, 5, 'Ovenwanten', 'Oven mitts', 'Geen brandwonden. Geen dmg.', 'No burns. No dmg.'),
  _g('hands', 'wraps_gold', 'c', 'v', 'rare', 14, 7, 'Gouden wraps', 'Gold wraps', 'Foil-tape. Alleen look.', 'Foil tape. Look only.'),
  _g('hands', 'gloves_pixel', 'c', 'v', 'rare', 17, 8, 'Pixel-handschoenen', 'Pixel gloves', '8-bit look.', '8-bit look.'),
  _g('hands', 'cuffs_bell', 'c', 'v', 'rare', 19, 9, 'Bel-manchetten', 'Bell cuffs', 'Rinkel. Geen stats.', 'Jingle. No stats.'),
  _g('hands', 'gloves_opera', 'c', 'v', 'epic', 25, 13, 'Opera-handschoenen', 'Opera gloves', 'Lang satijn. Alleen look.', 'Long satin. Look only.'),
  _g('hands', 'claws_void_paint', 'c', 'v', 'legendary', 35, 18, 'Void-klauwen (verf)', 'Void claws (paint)', 'Zwarte nagellak.', 'Black nail polish.'),
  _g('hands', 'wraps_dream', 'c', 'v', 'nightmare', 54, 31, 'Droomwraps', 'Dream wraps', 'Nachtmerrie-look. Geen stats.', 'Nightmare look. No stats.', null, { adv: 51, diff: 'nightmare' }),
  _g('hands', 'gaunt_ash_paint', 'c', 'v', 'hell', 64, 41, 'As-wanten (look)', 'Ash mitts (look)', 'Hel-look. Geen brand.', 'Hell look. No burn.', null, { adv: 61, diff: 'hell' }),
  _g('hands', 'gloves_tape', 'a', 's', 'uncommon', 6, 3, 'Tape-handschoenen', 'Tape gloves', 'Steviger greep. Kleine schade.', 'Firmer grip. Small damage.', { dmgMul: 1.02 }),
  _g('hands', 'bracer_focus', 'c', 's', 'rare', 14, 7, 'Focus-bracer', 'Focus bracer', 'Sieraad-bracer mét energy.', 'Ornamental bracer that also speeds energy.', { energyMul: 1.04 }),
  _g('hands', 'wraps_monk', 'c', 's', 'epic', 29, 14, 'Monnik-wraps', 'Monk wraps', 'Cosmetisch mét technique.', 'Cosmetic wraps that also boost techniques.', { techniqueMul: 1.03 }),
  _g('hands', 'gloves_grip', 'c', 's', 'legendary', 37, 19, 'Grip-handschoenen', 'Grip gloves', 'Cosmetisch mét schade.', 'Cosmetic gloves that also add damage.', { dmgMul: 1.02 }),
  _g('hands', 'bracer_leather', 'a', 's', 'common', 5, 2, 'Leren bracer', 'Leather bracer', 'Licht leer. +HP.', 'Light leather. +HP.', { maxHp: 3 }),
  _g('hands', 'gauntlet_iron', 'a', 's', 'rare', 20, 10, 'IJzeren want', 'Iron gauntlet', 'Zware hand. Meer schade.', 'Heavy hand. More damage.', { dmgMul: 1.03 }),
  _g('hands', 'gauntlet_steel', 'a', 's', 'rare', 23, 11, 'Stalen want', 'Steel gauntlet', 'Schade + HP.', 'Damage + HP.', { dmgMul: 1.02, maxHp: 4 }),
  _g('hands', 'fists_spike', 'a', 's', 'epic', 31, 15, 'Spike-vuisten', 'Spike fists', 'Prik. Meer schade.', 'Poke. More damage.', { dmgMul: 1.03, kbMul: 1.04 }),
  _g('hands', 'gauntlet_crystal', 'a', 's', 'legendary', 44, 24, 'Kristal-want', 'Crystal gauntlet', 'Energy + HP.', 'Energy + HP.', { energyMul: 1.03, maxHp: 4 }),
  _g('hands', 'gauntlet_void', 'a', 's', 'mythic', 48, 28, 'Void-want', 'Void gauntlet', 'Technique + schade.', 'Technique + damage.', { techniqueMul: 1.03, dmgMul: 1.02 }),
  _g('hands', 'gauntlet_nightmare', 'a', 's', 'nightmare', 57, 34, 'Nachtmerrie-want', 'Nightmare gauntlet', 'Droomklauw. Schade + crit.', 'Dream claw. Damage + crit.', { dmgMul: 1.03, critBonus: 0.02 }, { adv: 51, diff: 'nightmare' }),
  _g('hands', 'gauntlet_hell', 'a', 's', 'hell', 67, 44, 'Hel-want', 'Hell gauntlet', 'Lava-hand. Schade + kb.', 'Lava hand. Damage + knockback.', { dmgMul: 1.04, kbMul: 1.05 }, { adv: 61, diff: 'hell' }),

  /* ════════ LEGS ════════ */
  _g('legs', 'wrap', 'c', 'v1', 'common', 1, 1, 'Beenwraps', 'Leg wraps', 'Doek om de kuiten. Alleen look.', 'Cloth on the calves. Look only.'),
  _g('legs', 'socks_plain', 'c', 'v', 'common', 2, 2, 'Witte sokken', 'White socks', 'Sport-look. Geen stats.', 'Gym look. No stats.'),
  _g('legs', 'shorts_stripe', 'c', 'v', 'common', 4, 2, 'Streep-short', 'Stripe shorts', 'Scheidsrechter-benen.', 'Ref legs.'),
  _g('legs', 'socks_lucky', 'c', 'v', 'uncommon', 6, 3, 'Gelukssokken', 'Lucky socks', 'Gestreepte sokken. Geen stats.', 'Striped socks. No stats.'),
  _g('legs', 'pants_baggy', 'c', 'v', 'uncommon', 8, 4, 'Wijde broek', 'Baggy pants', 'Skate-look.', 'Skate look.'),
  _g('legs', 'boots_clown', 'c', 'v', 'uncommon', 10, 5, 'Clownslaarzen', 'Clown boots', 'Groot en nutteloos.', 'Big and useless.'),
  _g('legs', 'tabi_white', 'c', 'v', 'rare', 13, 6, 'Witte tabi', 'White tabi', 'Ninja-sok. Alleen look.', 'Ninja sock. Look only.'),
  _g('legs', 'sneakers_check', 'c', 'v', 'rare', 16, 8, 'Ruit-sneakers', 'Check sneakers', 'Skate shop. Geen stats.', 'Skate shop. No stats.'),
  _g('legs', 'wrap_gold', 'c', 'v', 'rare', 18, 9, 'Gouden beenwraps', 'Gold leg wraps', 'Foil. Alleen look.', 'Foil. Look only.'),
  _g('legs', 'bells_ankle', 'c', 'v', 'epic', 24, 12, 'Enkelbellen', 'Ankle bells', 'Rinkel. Geen stats.', 'Jingle. No stats.'),
  _g('legs', 'boots_platform', 'c', 'v', 'epic', 27, 14, 'Plateau-laarzen', 'Platform boots', 'Hoog. Geen speed.', 'Tall. No speed.'),
  _g('legs', 'wraps_void_paint', 'c', 'v', 'legendary', 36, 19, 'Void-wraps (verf)', 'Void wraps (paint)', 'Zwarte verf.', 'Black paint.'),
  _g('legs', 'socks_dream', 'c', 'v', 'nightmare', 54, 31, 'Droomsokken', 'Dream socks', 'Nachtmerrie-look. Geen stats.', 'Nightmare look. No stats.', null, { adv: 51, diff: 'nightmare' }),
  _g('legs', 'boots_ash_paint', 'c', 'v', 'hell', 64, 41, 'As-laarzen (look)', 'Ash boots (look)', 'Hel-look. Geen brand.', 'Hell look. No burn.', null, { adv: 61, diff: 'hell' }),
  _g('legs', 'boots_sprint', 'c', 's', 'rare', 15, 7, 'Sprint-sneakers', 'Sprint sneakers', 'Cosmetisch mét loopsnelheid.', 'Cosmetic sneakers that also add run speed.', { speedMul: 1.04 }),
  _g('legs', 'greaves_steady', 'c', 's', 'epic', 28, 14, 'Standvast-scheen', 'Steady greaves', 'Cosmetisch mét mitigatie.', 'Cosmetic greaves that also mitigate.', { defMul: 0.97 }),
  _g('legs', 'boots_dash', 'c', 's', 'legendary', 39, 21, 'Dash-laarzen', 'Dash boots', 'Cosmetisch mét speed + XP.', 'Cosmetic boots that also add speed + XP.', { speedMul: 1.03, xpMul: 1.02 }),
  _g('legs', 'boots_soft', 'a', 's', 'common', 5, 2, 'Zachte laarzen', 'Soft boots', 'Lichte tred. Iets sneller.', 'Light step. A bit faster.', { speedMul: 1.03 }),
  _g('legs', 'greaves_leather', 'a', 's', 'uncommon', 8, 4, 'Leren scheen', 'Leather greaves', 'Licht leer. +HP.', 'Light leather. +HP.', { maxHp: 4 }),
  _g('legs', 'greaves_iron', 'a', 's', 'rare', 18, 9, 'IJzeren scheen', 'Iron greaves', 'Scheenplaat. HP + mitigatie.', 'Shin plate. HP + mitigation.', { maxHp: 5, defMul: 0.97 }),
  _g('legs', 'boots_steel', 'a', 's', 'rare', 21, 10, 'Stalen laarzen', 'Steel boots', 'Zwaar. HP + kb.', 'Heavy. HP + knockback.', { maxHp: 5, kbMul: 1.04 }),
  _g('legs', 'greaves_knight', 'a', 's', 'epic', 30, 15, 'Ridder-scheen', 'Knight greaves', 'HP + blok.', 'HP + block.', { maxHp: 6, blockMul: 0.93 }),
  _g('legs', 'greaves_crystal', 'a', 's', 'legendary', 44, 24, 'Kristal-scheen', 'Crystal greaves', 'Speed + shield.', 'Speed + shield.', { speedMul: 1.03, shieldWave: 0.3 }),
  _g('legs', 'greaves_void', 'a', 's', 'mythic', 49, 29, 'Void-scheen', 'Void greaves', 'Technique + speed.', 'Technique + speed.', { techniqueMul: 1.02, speedMul: 1.03 }),
  _g('legs', 'greaves_nightmare', 'a', 's', 'nightmare', 58, 34, 'Nachtmerrie-scheen', 'Nightmare greaves', 'Droomplaat. Speed + crit.', 'Dream plate. Speed + crit.', { speedMul: 1.04, critBonus: 0.02 }, { adv: 51, diff: 'nightmare' }),
  _g('legs', 'greaves_hell', 'a', 's', 'hell', 68, 45, 'Hel-scheen', 'Hell greaves', 'Lava-plaat. HP + schade.', 'Lava plate. HP + damage.', { maxHp: 6, dmgMul: 1.03 }, { adv: 61, diff: 'hell' }),

  /* ════════ BACK ════════ */
  _g('back', 'pin_dot', 'c', 'v1', 'common', 1, 1, 'Stip-pin', 'Dot pin', 'Klein speldje. Alleen look.', 'Tiny pin. Look only.'),
  _g('back', 'pin_star', 'c', 'v', 'uncommon', 8, 4, 'Ster-pin', 'Star pin', 'Glitter-speld. Geen stats.', 'Glitter pin. No stats.'),
  _g('back', 'backpack_school', 'c', 'v', 'common', 3, 2, 'Schooltas', 'School backpack', 'Boeken, geen pantser.', 'Books, not armour.'),
  _g('back', 'scarf_long', 'c', 'v', 'common', 4, 2, 'Lange sjaal', 'Long scarf', 'Wappert. Geen stats.', 'Flutters. No stats.'),
  _g('back', 'cape_red', 'c', 'v', 'uncommon', 9, 5, 'Rode cape', 'Red cape', 'Superheld-vilt.', 'Superhero felt.'),
  _g('back', 'tail_fox', 'c', 'v', 'uncommon', 11, 5, 'Vossenstaart', 'Fox tail', 'Clip-on. Alleen look.', 'Clip-on. Look only.'),
  _g('back', 'banner_leaf', 'c', 'v', 'rare', 14, 7, 'Bladvlag', 'Leaf banner', 'Bos-vaandel.', 'Forest banner.'),
  _g('back', 'kite_paper', 'c', 'v', 'rare', 16, 8, 'Papieren vlieger', 'Paper kite', 'Wappert achter je.', 'Trails behind you.'),
  _g('back', 'balloon_party', 'c', 'v', 'rare', 18, 9, 'Feestballon', 'Party balloon', 'Helium-look. Geen stats.', 'Helium look. No stats.'),
  _g('back', 'wings_cardboard', 'c', 'v', 'epic', 23, 12, 'Kartonnen vleugels', 'Cardboard wings', 'Knutsel-engel.', 'Craft angel.'),
  _g('back', 'aura_glow', 'c', 'v', 'rare', 20, 10, 'Gloed-aura', 'Glow aura', 'Zachte aura. Geen combat-bonus.', 'Soft aura. No combat bonus.'),
  _g('back', 'cape_shadow', 'c', 'v', 'epic', 25, 12, 'Schaduwcape', 'Shadow cape', 'Cape-look. Geen stats.', 'Cape look. No stats.'),
  _g('back', 'cape_void_paint', 'c', 'v', 'legendary', 36, 19, 'Void-cape (verf)', 'Void cape (paint)', 'Zwarte verf. Geen leegte.', 'Black paint. No void.'),
  _g('back', 'wings_dream', 'c', 'v', 'nightmare', 54, 31, 'Droomvleugels', 'Dream wings', 'Nachtmerrie-look. Geen stats.', 'Nightmare look. No stats.', null, { adv: 51, diff: 'nightmare' }),
  _g('back', 'wings_ash', 'c', 'v', 'hell', 64, 41, 'As-vleugels', 'Ash wings', 'Hel-look. Geen brand.', 'Hell look. No burn.', null, { adv: 61, diff: 'hell' }),
  _g('back', 'leaf', 'c', 's', 'uncommon', 12, 6, 'Blad-hanger', 'Leaf charm', 'Rug-hanger mét +HP.', 'Back charm that also adds HP.', { maxHp: 3 }),
  _g('back', 'cape_lucky', 'c', 's', 'rare', 22, 11, 'Gelukscape', 'Lucky cape', 'Cosmetische cape mét XP.', 'Cosmetic cape that also adds XP.', { xpMul: 1.03 }),
  _g('back', 'void', 'c', 's', 'legendary', 40, 14, 'Void-hanger', 'Void charm', 'Rug-hanger mét technique.', 'Back charm that also boosts techniques.', { techniqueMul: 1.03 }, { adv: 40 }),
  _g('back', 'pack_leather', 'a', 's', 'common', 6, 3, 'Leren pack', 'Leather pack', 'Licht. +HP.', 'Light. +HP.', { maxHp: 4 }),
  _g('back', 'plate_back', 'a', 's', 'uncommon', 10, 5, 'Rugplaat', 'Back plate', 'IJzer achter. HP + mitigatie.', 'Iron behind. HP + mitigation.', { maxHp: 5, defMul: 0.98 }),
  _g('back', 'shell_turtle', 'a', 's', 'rare', 19, 9, 'Schildpad-schelp', 'Turtle shell', 'Tank-look mét HP.', 'Tank look with HP.', { maxHp: 8, defMul: 0.96 }),
  _g('back', 'banner_iron', 'a', 's', 'rare', 24, 12, 'IJzeren vaandel', 'Iron banner', 'Vaandel mét kb.', 'Banner with knockback.', { kbMul: 1.05, maxHp: 3 }),
  _g('back', 'wing_steel', 'a', 's', 'epic', 33, 16, 'Stalen vleugel', 'Steel wing', 'Reach + HP.', 'Reach + HP.', { weaponRange: 1.04, maxHp: 4 }),
  _g('back', 'crystal_shard', 'a', 's', 'legendary', 45, 24, 'Kristalscherf', 'Crystal shard', 'Shield-golf + energy.', 'Wave shield + energy.', { shieldWave: 0.4, energyMul: 1.03 }),
  _g('back', 'void_spine', 'a', 's', 'mythic', 50, 30, 'Void-ruggengraat', 'Void spine', 'Technique + schade.', 'Technique + damage.', { techniqueMul: 1.04, dmgMul: 1.02 }),
  _g('back', 'wings_nightmare', 'a', 's', 'nightmare', 59, 35, 'Nachtmerrie-vleugels', 'Nightmare wings', 'Droomvleugel. Speed + crit.', 'Dream wing. Speed + crit.', { speedMul: 1.03, critBonus: 0.02 }, { adv: 51, diff: 'nightmare' }),
  _g('back', 'wings_hell', 'a', 's', 'hell', 69, 46, 'Hel-vleugels', 'Hell wings', 'Lava-vleugel. Schade + HP.', 'Lava wing. Damage + HP.', { dmgMul: 1.03, maxHp: 6 }, { adv: 61, diff: 'hell' }),
];

const GEAR_BY_ID = Object.create(null);
for (const it of GEAR_ITEMS) {
  if (GEAR_BY_ID[it.id]) continue;
  GEAR_BY_ID[it.id] = it;
}

function gearItemById(id) {
  return GEAR_BY_ID[gearCanonItemId(id)] || null;
}
function gearItemsForSlot(slot) {
  const canon = gearCanonSlot(slot) || slot;
  return GEAR_ITEMS.filter((it) => it.slot === canon);
}
function gearItemIsVanity(item) {
  return !!(item && item.vanity === true);
}
function gearItemHasCombatStats(item) {
  return !!(item && item.hasStats === true && item.vanity !== true && item.mods && typeof item.mods === 'object');
}

function gearNowMs(now) {
  const n = Number(now);
  return Number.isFinite(n) && n > 1e11 ? Math.floor(n) : Date.now();
}

function saveLooksVeteran(s) {
  if (!s || typeof s !== 'object') return false;
  if ((Number(s.lvl) || 1) > 1) return true;
  if ((Number(s.unlocked) || 1) > 1) return true;
  const st = s.stats && typeof s.stats === 'object' ? s.stats : null;
  if (st && ((Number(st.kills) || 0) > 0 || (Number(st.advWins) || 0) > 0)) return true;
  if (s.gear && s.gear.owned && typeof s.gear.owned === 'object' && Object.keys(s.gear.owned).length > 5) return true;
  return false;
}

function sanitizeCreatedAt(raw, s, now) {
  const tNow = gearNowMs(now);
  const n = Number(raw);
  if (Number.isFinite(n) && n > 1e11) {
    return Math.max(GEAR_CREATED_MIN_MS, Math.min(tNow, Math.floor(n)));
  }
  if (saveLooksVeteran(s)) {
    return Math.max(GEAR_CREATED_MIN_MS, tNow - GEAR_VETERAN_BACKDATE_DAYS * GEAR_MS_PER_DAY);
  }
  return tNow;
}

function gearAccountCreatedAt(s) {
  const st = s || (typeof save !== 'undefined' ? save : null);
  const n = st ? Number(st.createdAt) : 0;
  if (Number.isFinite(n) && n >= GEAR_CREATED_MIN_MS) return Math.floor(n);
  return 0;
}

function gearAccountAgeDays(s, now) {
  const created = gearAccountCreatedAt(s);
  const t = gearNowMs(now);
  if (!created) return 1;
  if (t < created) return 1;
  return Math.max(1, Math.floor((t - created) / GEAR_MS_PER_DAY) + 1);
}

function gearUnlockContext(s, now) {
  const st = s || (typeof save !== 'undefined' ? save : null);
  const cleared = (st && st.advCleared && typeof st.advCleared === 'object') ? st.advCleared : {};
  return {
    lvl: st ? Math.max(1, Math.floor(Number(st.lvl) || 1)) : 1,
    days: gearAccountAgeDays(st, now),
    unlocked: st ? Math.max(1, Math.floor(Number(st.unlocked) || 1)) : 1,
    nightmareOk: !!cleared.normal,
    hellOk: !!cleared.nightmare,
    now: gearNowMs(now),
  };
}

function gearGateState(item, s, now) {
  const ctx = (s && s._gearUnlockCtx) ? s._gearUnlockCtx : gearUnlockContext(s, now);
  const out = {
    ok: false,
    lootable: false,
    levelOk: false,
    timeOk: false,
    advOk: true,
    diffOk: true,
    needLvl: item ? item.unlockLvl : 1,
    needDays: item ? item.unlockDays : 1,
    haveLvl: ctx.lvl,
    haveDays: ctx.days,
    reasons: [],
  };
  if (!item) {
    out.reasons.push('unknown');
    return out;
  }
  out.levelOk = ctx.lvl >= item.unlockLvl;
  out.timeOk = ctx.days >= item.unlockDays;
  if (!out.levelOk) out.reasons.push('level');
  if (!out.timeOk) out.reasons.push('time');
  if (item.needAdvUnlocked != null) {
    out.advOk = ctx.unlocked >= item.needAdvUnlocked;
    if (!out.advOk) out.reasons.push('adventure');
  }
  if (item.needDiff === 'nightmare') {
    out.diffOk = !!ctx.nightmareOk;
    if (!out.diffOk) out.reasons.push('diff');
  } else if (item.needDiff === 'hell') {
    out.diffOk = !!ctx.hellOk;
    if (!out.diffOk) out.reasons.push('diff');
  }
  out.ok = out.levelOk && out.timeOk && out.advOk && out.diffOk;
  out.lootable = out.ok;
  out.state = out.ok ? 'ok' : 'locked';
  return out;
}

function gearGateCopy(item, s, now) {
  const tr = (key, fallback, vars) => {
    if (typeof tOr === 'function') return tOr(key, fallback, vars);
    if (vars && vars.n != null) return String(fallback).split('{n}').join(String(vars.n));
    return fallback;
  };
  if (!item) return '';
  if (!gearItemOwned(item.id, s)) return tr('gear.lockOwned', 'Nog niet gevonden');
  const gate = gearGateState(item, s, now);
  if (!gate || gate.ok) return '';
  const why = (gate.reasons && gate.reasons[0]) || 'locked';
  if (why === 'level') return tr('gear.lockLevel', 'Lv {n}', { n: gate.needLvl });
  if (why === 'time') return tr('gear.lockDays', '{n} dagen', { n: gate.needDays });
  if (why === 'adventure') {
    const n = item.needAdvUnlocked != null ? item.needAdvUnlocked : gate.needLvl;
    return tr('gear.lockAdv', 'Avontuur Lv {n}', { n });
  }
  if (why === 'diff') return tr('gear.lockDiff', 'Nog niet vrij');
  return tr('gear.pillLock', 'LOCK');
}

function gearItemLootable(item, s, now) {
  return gearGateState(item, s, now).lootable;
}
function gearItemUnlocked(item, s, now) {
  return gearItemLootable(item, s, now);
}

function _isForbiddenKey(k) {
  return k === '__proto__' || k === 'constructor' || k === 'prototype';
}

function migrateGearRaw(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { schema: 0, equipped: {}, owned: {} };
  const equippedIn = (raw.equipped && typeof raw.equipped === 'object' && !Array.isArray(raw.equipped))
    ? raw.equipped
    : raw;
  const equipped = {};
  for (const [k, v] of Object.entries(equippedIn)) {
    if (_isForbiddenKey(k)) continue;
    const slot = gearCanonSlot(k);
    if (!slot) continue;
    if (typeof v !== 'string' || !v) continue;
    equipped[slot] = gearCanonItemId(v);
  }
  let ownedSrc = raw.owned;
  const owned = {};
  if (Array.isArray(ownedSrc)) {
    for (const id of ownedSrc) {
      if (typeof id !== 'string') continue;
      const canon = gearCanonItemId(id);
      if (!canon || _isForbiddenKey(canon)) continue;
      owned[canon] = { at: 0, src: 'grant' };
    }
  } else if (ownedSrc && typeof ownedSrc === 'object') {
    for (const [k, v] of Object.entries(ownedSrc)) {
      if (_isForbiddenKey(k)) continue;
      const canon = gearCanonItemId(k);
      if (!canon) continue;
      if (v === 1 || v === true || typeof v === 'number') {
        owned[canon] = { at: 0, src: 'grant' };
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        owned[canon] = {
          at: Number(v.at) || 0,
          src: typeof v.src === 'string' ? v.src : 'grant',
        };
      }
    }
  }
  return { schema: Number(raw.schema) || 0, equipped, owned };
}

function sanitizeGearOwnedEntry(raw, now) {
  const tNow = gearNowMs(now);
  const entry = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const at = Math.floor(Number(entry.at) || 0);
  return {
    at: at > 1e11 ? Math.max(GEAR_CREATED_MIN_MS, Math.min(tNow, at)) : 0,
    src: typeof entry.src === 'string' ? entry.src.replace(/[^\w\-]/g, '').slice(0, GEAR_SRC_MAX) || 'grant' : 'grant',
  };
}

function sanitizeGearSave(raw, s, now) {
  try {
    const st = s || {};
    const migrated = migrateGearRaw(raw);
    const owned = {};
    const ids = Object.keys(migrated.owned);
    ids.sort();
    let n = 0;
    for (const id of ids) {
      if (n >= GEAR_OWNED_CAP) break;
      if (!GEAR_BY_ID[id]) continue;
      owned[id] = sanitizeGearOwnedEntry(migrated.owned[id], now);
      n++;
    }
    const bag = { schema: GEAR_SCHEMA, equipped: emptyGearEquipped(), owned };
    for (const slot of GEAR_SLOT_IDS) {
      const id = migrated.equipped[slot];
      if (typeof id !== 'string') continue;
      const item = GEAR_BY_ID[id];
      if (!item || item.slot !== slot) continue;
      if (!owned[id]) continue;
      if (!gearItemLootable(item, st, now)) continue;
      bag.equipped[slot] = id;
    }
    return bag;
  } catch (_) {
    return emptyGearBag();
  }
}

function ensureGearSave(s) {
  const st = s || (typeof save !== 'undefined' ? save : null);
  if (!st || typeof st !== 'object') return emptyGearBag();
  if (typeof DEFAULT_SAVE !== 'undefined' && st === DEFAULT_SAVE) return emptyGearBag();
  if (!st.gear || typeof st.gear !== 'object' || Array.isArray(st.gear)) st.gear = emptyGearBag();
  if (!st.gear.equipped || typeof st.gear.equipped !== 'object' || Array.isArray(st.gear.equipped)) {
    st.gear.equipped = emptyGearEquipped();
  }
  if (!st.gear.owned || typeof st.gear.owned !== 'object' || Array.isArray(st.gear.owned)) {
    st.gear.owned = {};
  }
  st.gear.schema = GEAR_SCHEMA;
  return st.gear;
}

function gearItemOwned(id, s) {
  const canon = gearCanonItemId(id);
  if (!canon) return false;
  const st = s || (typeof save !== 'undefined' ? save : null);
  const owned = st && st.gear && st.gear.owned;
  return !!(owned && typeof owned === 'object' && owned[canon]);
}

function gearOwnedList(s) {
  const st = s || (typeof save !== 'undefined' ? save : null);
  const owned = st && st.gear && st.gear.owned;
  const out = [];
  if (!owned || typeof owned !== 'object') return out;
  for (const id of Object.keys(owned)) {
    if (_isForbiddenKey(id)) continue;
    const item = GEAR_BY_ID[id];
    if (item) out.push(item);
  }
  return out;
}

function gearEquippedId(slot, s) {
  const canon = gearCanonSlot(slot);
  if (!canon) return null;
  const st = s || (typeof save !== 'undefined' ? save : null);
  const id = st && st.gear && st.gear.equipped ? st.gear.equipped[canon] : null;
  return typeof id === 'string' ? id : null;
}

function gearEquippedItem(slot, s) {
  return gearItemById(gearEquippedId(slot, s));
}

function gearItemUsable(item, s, now) {
  if (!item) return false;
  return gearItemOwned(item.id, s) && gearItemUnlocked(item, s, now);
}

function gearCanGrant(id, s, now) {
  const item = gearItemById(id);
  if (!item) return { ok: false, reason: 'unknown' };
  if (gearItemOwned(item.id, s)) return { ok: true, already: true, item };
  const gate = gearGateState(item, s, now);
  if (!gate.ok) return { ok: false, reason: 'gated', gate, item };
  return { ok: true, item };
}

const GEAR_EQUIP_STATES = {
  OK: 'ok',
  VANITY_OK: 'vanity-ok',
  ALREADY_EQUIPPED: 'already-equipped',
  LOCKED: 'locked',
  NOT_OWNED: 'not-owned',
  WRONG_SLOT: 'wrong-slot',
  UNKNOWN: 'unknown',
  EMPTY: 'empty',
  NOSAVE: 'nosave',
};

function _gearIsSaveLike(obj) {
  return !!(obj && typeof obj === 'object' && !Array.isArray(obj) && (
    obj.gear != null || obj.lvl != null || obj.createdAt != null
    || obj.unlocked != null || obj.advCleared != null
    || obj.coins != null || obj.weapon != null
  ));
}

function _gearIsEquipOpts(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (_gearIsSaveLike(obj)) return false;
  const keys = Object.keys(obj);
  if (!keys.length) return true;
  return keys.every((k) => k === 'expectSlot' || k === 'now');
}

function _gearParseCall(sOrOpts, now, expectSlot) {
  if (_gearIsEquipOpts(sOrOpts)) {
    return {
      s: (typeof save !== 'undefined' ? save : null),
      now: sOrOpts.now != null ? sOrOpts.now : now,
      expectSlot: sOrOpts.expectSlot != null ? sOrOpts.expectSlot : expectSlot,
    };
  }
  return {
    s: sOrOpts || (typeof save !== 'undefined' ? save : null),
    now,
    expectSlot,
  };
}

function _gearEquipResult(partial) {
  const item = partial.item || null;
  const state = partial.state || GEAR_EQUIP_STATES.UNKNOWN;
  const ok = partial.ok === true;
  return {
    ok,
    state,
    reason: state,
    item,
    slot: partial.slot || (item && item.slot) || null,
    owned: !!partial.owned,
    equipped: !!partial.equipped,
    vanity: !!(item && item.vanity === true),
    appliesStats: !!(item && gearItemHasCombatStats(item) && ok),
    gate: partial.gate || null,
    label: partial.label || '',
    canEquip: ok && state !== GEAR_EQUIP_STATES.ALREADY_EQUIPPED,
  };
}

/** Canonical equip-flow state. expectSlot (optional) → wrong-slot if mismatch. */
function gearEquipState(id, s, now, expectSlot) {
  const parsed = _gearParseCall(s, now, expectSlot);
  const item = gearItemById(id);
  if (!item) return _gearEquipResult({ ok: false, state: GEAR_EQUIP_STATES.UNKNOWN });
  if (parsed.expectSlot != null && parsed.expectSlot !== '') {
    const want = gearCanonSlot(parsed.expectSlot);
    if (!want || want !== item.slot) {
      return _gearEquipResult({
        ok: false,
        state: GEAR_EQUIP_STATES.WRONG_SLOT,
        item,
        owned: gearItemOwned(item.id, parsed.s),
        label: (typeof tOr === 'function') ? tOr('gear.lockSlot', 'Verkeerd slot') : 'Verkeerd slot',
      });
    }
  }
  const owned = gearItemOwned(item.id, parsed.s);
  if (!owned) {
    return _gearEquipResult({
      ok: false,
      state: GEAR_EQUIP_STATES.NOT_OWNED,
      item,
      gate: gearGateState(item, parsed.s, parsed.now),
      owned: false,
      label: gearGateCopy(item, parsed.s, parsed.now),
    });
  }
  const gate = gearGateState(item, parsed.s, parsed.now);
  if (!gate.ok) {
    return _gearEquipResult({
      ok: false,
      state: GEAR_EQUIP_STATES.LOCKED,
      item,
      gate,
      owned: true,
      label: gearGateCopy(item, parsed.s, parsed.now),
    });
  }
  const wearing = gearEquippedId(item.slot, parsed.s) === item.id;
  if (wearing) {
    return _gearEquipResult({
      ok: true,
      state: GEAR_EQUIP_STATES.ALREADY_EQUIPPED,
      item,
      gate,
      owned: true,
      equipped: true,
    });
  }
  if (item.vanity === true) {
    return _gearEquipResult({
      ok: true,
      state: GEAR_EQUIP_STATES.VANITY_OK,
      item,
      gate,
      owned: true,
    });
  }
  return _gearEquipResult({
    ok: true,
    state: GEAR_EQUIP_STATES.OK,
    item,
    gate,
    owned: true,
  });
}

function gearCanEquip(id, s, now, expectSlot) {
  return gearEquipState(id, s, now, expectSlot);
}

function _persistGearIfLive(st) {
  try {
    if (typeof save !== 'undefined' && st === save && typeof persist === 'function') persist();
  } catch (_) {}
}

function _gearGrantInto(s, id, src, now) {
  /* can-own-locked: write owned even if unequippable. Rolls filter via lootable. */
  const item = gearItemById(id);
  if (!item) return { ok: false, reason: 'unknown' };
  if (gearItemOwned(item.id, s)) return { ok: true, already: true, item };
  const bag = ensureGearSave(s);
  if (Object.keys(bag.owned).length >= GEAR_OWNED_CAP) return { ok: false, reason: 'full', item };
  const at = gearNowMs(now);
  bag.owned[item.id] = {
    at,
    src: typeof src === 'string' ? src.replace(/[^\w\-]/g, '').slice(0, GEAR_SRC_MAX) || 'grant' : 'grant',
  };
  return { ok: true, item };
}

function grantStarterGear(s, now) {
  const st = s || (typeof save !== 'undefined' ? save : null);
  if (!st || typeof st !== 'object') return;
  if (typeof DEFAULT_SAVE !== 'undefined' && st === DEFAULT_SAVE) return;
  const tNow = gearNowMs(now);
  const bag = ensureGearSave(st);
  const justGranted = [];
  for (const item of GEAR_ITEMS) {
    if (!item.starter) continue;
    if (bag.owned[item.id]) continue;
    if (!gearItemLootable(item, st, tNow)) continue;
    bag.owned[item.id] = { at: tNow, src: 'starter' };
    justGranted.push(item.id);
  }
  for (const slot of GEAR_SLOT_IDS) {
    if (bag.equipped[slot]) continue;
    const pick = GEAR_ITEMS.find((it) => it.slot === slot && it.starter && justGranted.indexOf(it.id) >= 0);
    if (pick) bag.equipped[slot] = pick.id;
  }
}

function gearGrantItem(id, src, s, now) {
  const st = s || (typeof save !== 'undefined' ? save : null);
  if (!st) return { ok: false, reason: 'nosave' };
  const result = _gearGrantInto(st, id, src || 'grant', now);
  if (result.ok && !result.already) _persistGearIfLive(st);
  return result;
}

function gearEquipItem(id, s, now, expectSlot) {
  const parsed = _gearParseCall(s, now, expectSlot);
  const st = parsed.s;
  if (!st) return _gearEquipResult({ ok: false, state: GEAR_EQUIP_STATES.NOSAVE });
  const can = gearEquipState(id, st, parsed.now, parsed.expectSlot);
  if (!can.ok) return can;
  const bag = ensureGearSave(st);
  bag.equipped[can.item.slot] = can.item.id;
  _persistGearIfLive(st);
  return {
    ok: true,
    state: can.state,
    reason: can.state,
    item: can.item,
    slot: can.item.slot,
    owned: true,
    equipped: true,
    vanity: can.vanity,
    appliesStats: can.appliesStats,
    gate: can.gate,
    label: '',
    canEquip: false,
  };
}

function gearUnequipSlot(slot, s) {
  const st = s || (typeof save !== 'undefined' ? save : null);
  if (!st) return { ok: false, state: GEAR_EQUIP_STATES.NOSAVE, reason: 'nosave' };
  const canon = gearCanonSlot(slot);
  if (!canon) return { ok: false, state: GEAR_EQUIP_STATES.WRONG_SLOT, reason: 'badslot', slot: null };
  const bag = ensureGearSave(st);
  const prevId = typeof bag.equipped[canon] === 'string' ? bag.equipped[canon] : null;
  bag.equipped[canon] = null;
  _persistGearIfLive(st);
  return {
    ok: true,
    state: prevId ? GEAR_EQUIP_STATES.OK : GEAR_EQUIP_STATES.EMPTY,
    reason: prevId ? 'ok' : 'empty',
    slot: canon,
    prevId,
  };
}

/** Owned items + locked/not-owned preview for one slot. Schema 1, no new save shape. */
function gearSlotInventory(slot, s, now) {
  const parsed = _gearIsEquipOpts(s)
    ? { s: (typeof save !== 'undefined' ? save : null), now: s.now != null ? s.now : now }
    : { s: s || (typeof save !== 'undefined' ? save : null), now };
  const canon = gearCanonSlot(slot);
  const st = parsed.s;
  if (!canon) return { slot: null, equippedId: null, items: [] };
  const equippedId = gearEquippedId(canon, st);
  const items = [];
  for (const item of gearItemsForSlot(canon)) {
    const eq = gearEquipState(item.id, st, parsed.now, canon);
    const owned = !!eq.owned;
    items.push({
      id: item.id,
      item,
      slot: canon,
      owned,
      locked: eq.state === GEAR_EQUIP_STATES.LOCKED || eq.state === GEAR_EQUIP_STATES.NOT_OWNED,
      preview: !owned || eq.state === GEAR_EQUIP_STATES.LOCKED,
      equipped: eq.state === GEAR_EQUIP_STATES.ALREADY_EQUIPPED,
      vanity: item.vanity === true,
      hasStats: item.hasStats === true && item.vanity !== true,
      appliesStats: !!(eq.ok && gearItemHasCombatStats(item)),
      state: eq.state,
      ok: eq.ok,
      canEquip: !!eq.canEquip,
      gate: eq.gate,
      label: eq.label,
    });
  }
  items.sort((a, b) => {
    if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
    if (a.owned !== b.owned) return a.owned ? -1 : 1;
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    return String(a.id).localeCompare(String(b.id));
  });
  return { slot: canon, equippedId, items };
}

function _emptyGearMods() {
  return {
    maxHp: 0, dmgMul: 1, defMul: 1, energyMul: 1, critBonus: 0, kbMul: 1,
    techniqueMul: 1, shieldWave: 0, blockMul: 1, xpMul: 1, speedMul: 1,
    weaponRange: 1, advDmgMul: 1,
  };
}

function gearCombatMods(s) {
  const acc = _emptyGearMods();
  const st = s || (typeof save !== 'undefined' ? save : null);
  if (!st || !st.gear || !st.gear.equipped) return acc;
  for (const slot of GEAR_SLOT_IDS) {
    const item = gearItemById(st.gear.equipped[slot]);
    if (!item || item.slot !== slot) continue;
    if (!gearItemHasCombatStats(item)) continue;
    if (!gearItemUsable(item, st)) continue;
    const m = item.mods;
    if (m.maxHp) acc.maxHp += m.maxHp;
    if (m.dmgMul) acc.dmgMul *= m.dmgMul;
    if (m.defMul) acc.defMul *= m.defMul;
    if (m.energyMul) acc.energyMul *= m.energyMul;
    if (m.critBonus) acc.critBonus += m.critBonus;
    if (m.kbMul) acc.kbMul *= m.kbMul;
    if (m.techniqueMul) acc.techniqueMul *= m.techniqueMul;
    if (m.shieldWave) acc.shieldWave += m.shieldWave;
    if (m.blockMul) acc.blockMul *= m.blockMul;
    if (m.xpMul) acc.xpMul *= m.xpMul;
    if (m.speedMul) acc.speedMul *= m.speedMul;
    if (m.weaponRange) acc.weaponRange *= m.weaponRange;
    if (m.advDmgMul) acc.advDmgMul *= m.advDmgMul;
  }
  const B = GEAR_BALANCE;
  acc.maxHp = Math.min(acc.maxHp, B.maxHpCap);
  acc.dmgMul = Math.min(acc.dmgMul, B.dmgMulCap);
  acc.defMul = Math.max(acc.defMul, B.defMulFloor);
  acc.energyMul = Math.min(acc.energyMul, B.energyMulCap);
  acc.critBonus = Math.min(acc.critBonus, B.critBonusCap);
  acc.kbMul = Math.min(acc.kbMul, B.kbMulCap);
  acc.techniqueMul = Math.min(acc.techniqueMul, B.techniqueMulCap);
  acc.shieldWave = Math.min(acc.shieldWave, B.shieldWaveCap);
  acc.blockMul = Math.max(acc.blockMul, B.blockMulFloor);
  acc.xpMul = Math.min(acc.xpMul, B.xpMulCap);
  acc.speedMul = Math.min(acc.speedMul, B.speedMulCap);
  acc.weaponRange = Math.min(acc.weaponRange, B.weaponRangeCap);
  acc.advDmgMul = Math.min(acc.advDmgMul, B.advDmgMulCap);
  return acc;
}

function applyGearBonusesToPlayer(game, player) {
  if (!game || !player) return;
  const m = gearCombatMods();
  game.gearMods = m;
  if (m.defMul && m.defMul !== 1) game.styleDefMul = (game.styleDefMul || 1) * m.defMul;
  if (m.advDmgMul && m.advDmgMul !== 1) game.styleAdvDmgMul = (game.styleAdvDmgMul || 1) * m.advDmgMul;
  if (m.energyMul && m.energyMul !== 1) game.styleEnergyMul = (game.styleEnergyMul || 1) * m.energyMul;
  if (m.critBonus) game.styleCritBonus = (game.styleCritBonus || 0) + m.critBonus;
  if (m.kbMul && m.kbMul !== 1) game.styleKbMul = (game.styleKbMul || 1) * m.kbMul;
  if (m.techniqueMul && m.techniqueMul !== 1) game.styleTechniqueMul = (game.styleTechniqueMul || 1) * m.techniqueMul;
  if (m.shieldWave) game.styleShieldWave = (game.styleShieldWave || 0) + m.shieldWave;
  if (m.blockMul && m.blockMul !== 1) game.styleBlockMul = (game.styleBlockMul || 1) * m.blockMul;
  if (m.xpMul && m.xpMul !== 1) game.styleXpMul = (game.styleXpMul || 1) * m.xpMul;
  if (m.maxHp) {
    player.maxhp += m.maxHp;
    player.hp += m.maxHp;
  }
  if (m.speedMul && m.speedMul !== 1) {
    player.speed = Math.round(player.speed * m.speedMul);
  }
}

function applyGearToSpec(fighter, spec) {
  if (!spec || !fighter || !fighter.isPlayer) return spec;
  const m = (typeof game !== 'undefined' && game && game.gearMods) ? game.gearMods : gearCombatMods();
  if (m.dmgMul && m.dmgMul !== 1) spec.dmg = Math.round(spec.dmg * m.dmgMul);
  if (m.kbMul && m.kbMul !== 1) spec.kb = (spec.kb || 0) * m.kbMul;
  if (m.weaponRange && spec.kind === 'weapon') {
    spec.range = (spec.range || 40) * m.weaponRange;
    spec.r = (spec.r || 24) * Math.sqrt(m.weaponRange);
  }
  if (m.techniqueMul && spec.kind === 'special') spec.dmg = Math.round(spec.dmg * m.techniqueMul);
  return spec;
}

function gearCombatLine(item) {
  if (!gearItemHasCombatStats(item)) return '';
  const parts = [];
  const m = item.mods;
  if (m.maxHp) parts.push((m.maxHp > 0 ? '+' : '') + m.maxHp + ' HP');
  if (m.dmgMul && m.dmgMul !== 1) parts.push((m.dmgMul > 1 ? '+' : '') + Math.round((m.dmgMul - 1) * 100) + '% dmg');
  if (m.defMul && m.defMul !== 1) parts.push((m.defMul < 1 ? '−' : '+') + Math.round(Math.abs(1 - m.defMul) * 100) + '% dmg in');
  if (m.energyMul && m.energyMul !== 1) parts.push((m.energyMul > 1 ? '+' : '') + Math.round((m.energyMul - 1) * 100) + '% energy');
  if (m.critBonus) parts.push('+' + Math.round(m.critBonus * 100) + '% crit');
  if (m.speedMul && m.speedMul !== 1) parts.push((m.speedMul > 1 ? '+' : '') + Math.round((m.speedMul - 1) * 100) + '% speed');
  if (m.techniqueMul && m.techniqueMul !== 1) parts.push((m.techniqueMul > 1 ? '+' : '') + Math.round((m.techniqueMul - 1) * 100) + '% tech');
  if (m.kbMul && m.kbMul !== 1) parts.push((m.kbMul > 1 ? '+' : '') + Math.round((m.kbMul - 1) * 100) + '% kb');
  if (m.xpMul && m.xpMul !== 1) parts.push((m.xpMul > 1 ? '+' : '') + Math.round((m.xpMul - 1) * 100) + '% XP');
  if (m.weaponRange && m.weaponRange !== 1) parts.push((m.weaponRange > 1 ? '+' : '') + Math.round((m.weaponRange - 1) * 100) + '% reach');
  if (m.advDmgMul && m.advDmgMul !== 1) parts.push((m.advDmgMul > 1 ? '+' : '') + Math.round((m.advDmgMul - 1) * 100) + '% adv');
  if (m.shieldWave) parts.push('+' + m.shieldWave + 's shield/golf');
  if (m.blockMul && m.blockMul !== 1) parts.push((m.blockMul < 1 ? '−' : '+') + Math.round(Math.abs(1 - m.blockMul) * 100) + '% blok');
  return parts.join(' · ');
}

function gearItemLabel(item, field) {
  if (!item) return '';
  const lang = (typeof getLang === 'function') ? getLang() : 'nl';
  if (field === 'desc') return lang === 'nl' ? (item.desc || item.descEn || '') : (item.descEn || item.desc || '');
  return lang === 'nl' ? (item.name || item.nameEn || item.id) : (item.nameEn || item.name || item.id);
}

function gearSlotLabel(slot) {
  const meta = gearSlotById(slot);
  if (!meta) return slot;
  if (typeof t === 'function') {
    const key = 'gear.slot.' + meta.id;
    const v = t(key);
    if (v && v !== key) return v;
  }
  const lang = (typeof getLang === 'function') ? getLang() : 'nl';
  return lang === 'nl' ? meta.name : meta.nameEn;
}

function gearTooltipModel(item, s, now) {
  if (!item) return null;
  const gate = gearGateState(item, s, now);
  const eq = gearEquipState(item.id, s, now, item.slot);
  const applies = !!(eq.ok && gearItemHasCombatStats(item));
  return {
    id: item.id,
    slot: item.slot,
    kind: item.kind,
    name: gearItemLabel(item),
    desc: gearItemLabel(item, 'desc'),
    rarity: item.rarity,
    vanity: item.vanity === true,
    hasStats: item.hasStats === true && item.vanity !== true,
    appliesStats: applies,
    combatLine: applies ? gearCombatLine(item) : '',
    mods: applies ? Object.assign({}, item.mods) : null,
    unlockLvl: item.unlockLvl,
    unlockDays: item.unlockDays,
    gate,
    owned: !!eq.owned,
    equipped: eq.state === GEAR_EQUIP_STATES.ALREADY_EQUIPPED,
    state: eq.state,
    canEquip: !!eq.canEquip,
    lockLabel: eq.label,
    starter: !!item.starter,
    look: item.look || null,
  };
}

function gearTooltipLines(item, s, now) {
  const model = gearTooltipModel(item, s, now);
  if (!model) return [];
  const lines = [model.name, model.desc];
  if (model.vanity) lines.push(typeof t === 'function' ? t('gear.flagVanity') : 'Look only — no stats');
  else if (model.appliesStats) lines.push(model.combatLine);
  if (!model.gate.ok) {
    if (!model.gate.levelOk) {
      lines.push((typeof t === 'function' ? t('gear.needLvl', { n: model.unlockLvl }) : ('Lv ' + model.unlockLvl)));
    }
    if (!model.gate.timeOk) {
      lines.push((typeof t === 'function' ? t('gear.needDays', { n: model.unlockDays }) : ('Day ' + model.unlockDays)));
    }
  }
  return lines.filter(Boolean);
}

function gearDropEligible(ctx) {
  ctx = ctx || {};
  const st = ctx.save || (typeof save !== 'undefined' ? save : null);
  const now = ctx.now;
  const out = [];
  for (const item of GEAR_ITEMS) {
    if (!item.droppable) continue;
    if (gearItemOwned(item.id, st)) continue;
    if (!gearItemLootable(item, st, now)) continue;
    if (ctx.slot && item.slot !== gearCanonSlot(ctx.slot) && item.slot !== ctx.slot) continue;
    if (ctx.kind && item.kind !== ctx.kind) continue;
    out.push(item);
  }
  return out;
}

function pickGearDropCandidate(ctx) {
  const list = gearDropEligible(ctx);
  if (!list.length) return null;
  let best = list[0];
  let bestOrder = (typeof rarityOf === 'function' ? rarityOf(best.rarity).order : 0);
  for (let i = 1; i < list.length; i++) {
    const ord = (typeof rarityOf === 'function' ? rarityOf(list[i].rarity).order : 0);
    if (ord < bestOrder) { best = list[i]; bestOrder = ord; }
  }
  return best;
}

const GEAR_DROP_WEIGHT = {
  common: 1, uncommon: 0.55, rare: 0.28, epic: 0.12,
  legendary: 0.05, mythic: 0.035, nightmare: 0.022, hell: 0.016,
};

function gearDropWeight(item, zone) {
  let w = GEAR_DROP_WEIGHT[item && item.rarity] || 0.2;
  if (zone && item && item.needDiff === zone) w *= 2.4;
  else if (zone === 'hell' && item && item.needDiff === 'nightmare') w *= 1.25;
  return w;
}

function pickWeightedGearItem(list, zone) {
  if (!list || !list.length) return null;
  let total = 0;
  for (const it of list) total += gearDropWeight(it, zone);
  if (!(total > 0)) return list[0];
  let r = Math.random() * total;
  for (const it of list) {
    r -= gearDropWeight(it, zone);
    if (r <= 0) return it;
  }
  return list[0];
}

/** Zone may satisfy needDiff for a *drop* (can-own-locked). Equip still uses gearGateState. */
function gearZoneSatisfiesDiff(item, zone) {
  if (!item || !item.needDiff) return true;
  if (item.needDiff === 'nightmare') return zone === 'nightmare' || zone === 'hell';
  if (item.needDiff === 'hell') return zone === 'hell';
  return false;
}

function gearItemLootableForDrop(item, s, now, zone) {
  if (!item) return false;
  const gate = gearGateState(item, s, now);
  if (!gate.levelOk || !gate.timeOk || !gate.advOk) return false;
  if (gate.diffOk) return true;
  return gearZoneSatisfiesDiff(item, zone);
}

function rollGearDrop(ctx) {
  ctx = ctx || {};
  const st = ctx.save || (typeof save !== 'undefined' ? save : null);
  const now = ctx.now;
  const zone = ctx.zone === 'nightmare' || ctx.zone === 'hell' ? ctx.zone : null;
  const exclude = ctx.excludeIds && typeof ctx.excludeIds === 'object' ? ctx.excludeIds : null;
  const list = [];
  for (const item of GEAR_ITEMS) {
    if (!item.droppable) continue;
    if (exclude && (exclude[item.id] || (exclude.indexOf && exclude.indexOf(item.id) !== -1))) continue;
    if (!ctx.allowOwned && gearItemOwned(item.id, st)) continue;
    if (!ctx.allowLocked && !gearItemLootableForDrop(item, st, now, zone)) continue;
    if (ctx.slot && item.slot !== gearCanonSlot(ctx.slot) && item.slot !== ctx.slot) continue;
    if (ctx.kind && item.kind !== ctx.kind) continue;
    list.push(item);
  }
  return pickWeightedGearItem(list, zone);
}

function gearRenderDescriptor(s) {
  const slots = [];
  for (const id of GEAR_SLOT_IDS) {
    const raw = gearEquippedItem(id, s);
    const item = (raw && raw.slot === id) ? raw : null;
    slots.push({
      slot: id,
      itemId: item ? item.id : null,
      kind: item ? item.kind : null,
      vanity: item ? item.vanity === true : true,
      hasStats: item ? (item.hasStats === true && item.vanity !== true) : false,
      appliesStats: !!(item && gearItemHasCombatStats(item)),
      tint: item && item.look ? item.look.tint : null,
      accent: item && item.look ? item.look.accent : null,
      layer: item && item.look ? item.look.layer : id,
    });
  }
  return { schema: GEAR_SCHEMA, slots };
}

function gearOwnedCount(s) {
  return gearOwnedList(s).length;
}
function gearCatalogCount() {
  return GEAR_ITEMS.length;
}
