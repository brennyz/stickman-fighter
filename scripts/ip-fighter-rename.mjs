#!/usr/bin/env node
/** IP-B: Street Fighter / Master Sword / Nintendo leftovers → store-safe names. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (...p) => path.join(root, ...p);

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, t) { fs.writeFileSync(p, t); }
function mustReplace(text, old, neu, label) {
  if (!text.includes(old)) throw new Error(`${label}: missing\n${old.slice(0, 120)}`);
  return text.replaceAll(old, neu);
}
function mustReplaceOnce(text, old, neu, label) {
  const n = text.split(old).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 occurrence, got ${n}\n${old.slice(0, 120)}`);
  return text.replace(old, neu);
}

// --- versus.js ---
{
  let t = read(rel('src/systems/versus.js'));
  t = mustReplace(t,
    "fighter: { id: 'fighter', label: 'Street', blurb: 'Ryu & Ken — classic white/red gi duel.' },",
    "fighter: { id: 'fighter', label: 'Arcade', blurb: 'Arcade Flair — classic white/red gi duel.' },",
    'versus-saga');
  t = mustReplace(t,
    "const VS_FEATURED_IDS = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];",
    "const VS_FEATURED_IDS = ['arcade_flair', 'arcade_rush', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];",
    'versus-featured');
  t = mustReplaceOnce(t,
`const VS_ROSTER_MIGRATE = {
  kiball: 'goku', scrollkid: 'aruskankou', zipcape: 'onepunchman', tidecrew: 'rubber',
  dawnlance: 'lance', spikyki: 'goku', bandana: 'aruskankou', hero: 'stick',
};`,
`const VS_ROSTER_MIGRATE = {
  kiball: 'goku', scrollkid: 'aruskankou', zipcape: 'onepunchman', tidecrew: 'rubber',
  dawnlance: 'lance', spikyki: 'goku', bandana: 'aruskankou', hero: 'stick',
  ryu: 'arcade_flair', ken: 'arcade_rush',
};`,
    'versus-migrate');
  t = mustReplace(t, "if (!id || typeof id !== 'string') return 'ryu';", "if (!id || typeof id !== 'string') return 'arcade_flair';", 'versus-def');
  t = mustReplaceOnce(t,
`  { id: 'ryu', name: 'Ryu', tag: 'Street · balanced', saga: 'fighter', flair: 'White gi · hadou stance · all-round',
    styleId: 'classic', weapon: 'vuist', bodyColor: '#f0f0f8', gi: 'white',
    hpMul: 1, spdMul: 1, dmgMul: 1.02, crit: 0.09, critMul: 1.5, sig: 'balanced', unlock: () => true, featured: true },
  { id: 'ken', name: 'Ken', tag: 'Street · fire kicks', saga: 'fighter', flair: 'Red gi · blazing shoryu · combo rush',
    styleId: 'konoha', weapon: 'nunchaku', bodyColor: '#ff5555', gi: 'red',
    hpMul: 0.94, spdMul: 1.1, dmgMul: 1.06, crit: 0.11, critMul: 1.52, sig: 'combo', unlock: () => true, featured: true },`,
`  { id: 'arcade_flair', name: 'Arcade Flair', tag: 'Arcade · balanced', saga: 'fighter', flair: 'White gi · wave stance · all-round',
    styleId: 'classic', weapon: 'vuist', bodyColor: '#f0f0f8', gi: 'white',
    hpMul: 1, spdMul: 1, dmgMul: 1.02, crit: 0.09, critMul: 1.5, sig: 'balanced', unlock: () => true, featured: true },
  { id: 'arcade_rush', name: 'Arcade Rush', tag: 'Arcade · fire kicks', saga: 'fighter', flair: 'Red gi · rising kick · combo rush',
    styleId: 'konoha', weapon: 'nunchaku', bodyColor: '#ff5555', gi: 'red',
    hpMul: 0.94, spdMul: 1.1, dmgMul: 1.06, crit: 0.11, critMul: 1.52, sig: 'combo', unlock: () => true, featured: true },`,
    'versus-roster');
  t = mustReplace(t, "return vsUnlocked(fb) ? fallback : 'ryu';", "return vsUnlocked(fb) ? fallback : 'arcade_flair';", 'versus-fb');
  t = mustReplace(t, "let vsSelect = { p1: 'ryu', p2: 'ken' };", "let vsSelect = { p1: 'arcade_flair', p2: 'arcade_rush' };", 'versus-select');
  write(rel('src/systems/versus.js'), t);
  console.log('OK versus.js');
}

// --- summons.js ---
{
  let t = read(rel('src/data/summons.js'));
  const pairs = [
    ['/** 2% per avontuur-level: zwaard → Master Sword — UIT (zorgde voor plotselinge run-breaks). */',
     '/** Avontuur-level: zwaard → Dawnblade — UIT (zorgde voor plotselinge run-breaks). */'],
    ['const MASTER_SWORD_DURATION = 15;', 'const DAWNBLADE_DURATION = 15;'],
    ['const MASTER_SWORD_CHANCE = 0;', 'const DAWNBLADE_CHANCE = 0;'],
    ['function canMasterSwordRoll(w) {', 'function canDawnbladeRoll(w) {'],
    ["w.id === 'vuist' || w.id === 'master_sword'", "w.id === 'vuist' || w.id === 'dawnblade'"],
    ['function buildMasterSwordWeapon(base) {', 'function buildDawnbladeWeapon(base) {'],
    ["    id: 'master_sword',\n    name: 'Master Sword',", "    id: 'dawnblade',\n    name: 'Dageraadkling',"],
    ['    masterSword: true,', '    dawnblade: true,'],
    ["    desc: 'Hyrules legendarische kling — unblockable',", "    desc: 'Legendarische dageraadkling — unblockable',"],
    ["  master_sword: 'wMaster',", "  dawnblade: 'wDawnblade',"],
    ["  if (id === 'master_sword') return 'wMaster';", "  if (id === 'dawnblade') return 'wDawnblade';"],
    ["|| id === 'master_sword') return 'hitEnergy';", "|| id === 'dawnblade') return 'hitEnergy';"],
    ["  master_sword: {\n    labels: ['Licht-slice', 'Zwaard-dans', 'Triforce-hak'],",
     "  dawnblade: {\n    labels: ['Licht-slice', 'Zwaard-dans', 'Dawn-hak'],"],
    ["  if (id === 'master_sword') return 'slash';", "  if (id === 'dawnblade') return 'slash';"],
  ];
  for (const [a, b] of pairs) t = mustReplace(t, a, b, 'summons');
  if (t.includes('master_sword') || t.includes('Master Sword') || t.includes('Hyrule') || t.includes('Triforce')) {
    throw new Error('summons leftovers');
  }
  write(rel('src/data/summons.js'), t);
  console.log('OK summons.js');
}

// --- simple id swaps ---
for (const f of ['src/data/upgrades.js', 'src/data/chest-summons.js']) {
  let t = read(rel(f));
  t = mustReplace(t, "'master_sword'", "'dawnblade'", f);
  write(rel(f), t);
  console.log('OK', f);
}

{
  let t = read(rel('src/entities/fighter.js'));
  t = mustReplace(t, 'w.masterSword || w.id === \'master_sword\'', "w.dawnblade || w.id === 'dawnblade'", 'fighter-spec');
  t = mustReplace(t, 'this.weapon.masterSword || this.weapon.id === \'master_sword\'', "this.weapon.dawnblade || this.weapon.id === 'dawnblade'", 'fighter-draw');
  t = mustReplace(t, '// RabbitRobot street-fighter AI', '// RabbitRobot arcade duel AI', 'fighter-ai');
  write(rel('src/entities/fighter.js'), t);
  console.log('OK fighter.js');
}

{
  let t = read(rel('src/render/draw-helpers.js'));
  t = mustReplace(t, "case 'master_sword':", "case 'dawnblade':", 'draw');
  write(rel('src/render/draw-helpers.js'), t);
  console.log('OK draw-helpers.js');
}

{
  let t = read(rel('src/systems/audio-samples.js'));
  t = mustReplace(t, '  wMaster:', '  wDawnblade:', 'samples-w');
  t = mustReplace(t, '  masterSword:', '  dawnblade:', 'samples-ms');
  write(rel('src/systems/audio-samples.js'), t);
  console.log('OK audio-samples.js');
}

{
  let t = read(rel('src/systems/audio.js'));
  t = mustReplace(t, "case 'masterSword':", "case 'dawnblade':", 'audio-ms');
  t = mustReplace(t, "case 'wMaster':", "case 'wDawnblade':", 'audio-wm');
  write(rel('src/systems/audio.js'), t);
  console.log('OK audio.js');
}

{
  let t = read(rel('src/boot/start.js'));
  t = mustReplace(t, "'ryu'", "'arcade_flair'", 'start-ryu');
  t = mustReplace(t, "'ken'", "'arcade_rush'", 'start-ken');
  write(rel('src/boot/start.js'), t);
  console.log('OK start.js');
}

{
  let t = read(rel('src/systems/missions.js'));
  const old = "['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi']";
  const neu = "['arcade_flair', 'arcade_rush', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi']";
  if ((t.split(old).length - 1) !== 3) throw new Error('missions need arrays');
  t = t.replaceAll(old, neu);
  write(rel('src/systems/missions.js'), t);
  console.log('OK missions.js');
}

// --- game.js ---
{
  let t = read(rel('src/game/game.js'));
  const pairs = [
    ['this.masterSwordT = 0;', 'this.dawnbladeT = 0;'],
    ['this._savedMasterWeapon', 'this._savedDawnWeapon'],
    ['// Master Sword roll UIT — geen zeldzame interrupt midden in level', '// Dawnblade roll UIT — geen zeldzame interrupt midden in level'],
    ['maybeRollMasterSword()', 'maybeRollDawnblade()'],
    ['activateMasterSword()', 'activateDawnblade()'],
    ['deactivateMasterSword(', 'deactivateDawnblade('],
    ['canMasterSwordRoll(', 'canDawnbladeRoll('],
    ['buildMasterSwordWeapon(', 'buildDawnbladeWeapon('],
    ['MASTER_SWORD_DURATION', 'DAWNBLADE_DURATION'],
    ['this.masterSwordT', 'this.dawnbladeT'],
    ["t('banner.masterSword')", "t('banner.dawnblade')"],
    ["t('combat.masterSwordGain')", "t('combat.dawnbladeGain')"],
    ["t('combat.masterSwordFade')", "t('combat.dawnbladeFade')"],
    ["t('hud.masterSword'", "t('hud.dawnblade'"],
    ["AudioSys.sting('masterSword'); AudioSys.sfx('masterSword')", "AudioSys.sting('dawnblade'); AudioSys.sfx('dawnblade')"],
    ["sfReportError('masterSword/on', err, 'Master Sword hiccup — speel door')", "sfReportError('dawnblade/on', err, 'Dawnblade hiccup — speel door')"],
    ["sfReportError('masterSword/off', err)", "sfReportError('dawnblade/off', err)"],
    ["normalizeVsPick(opts.p1 || vsSelect.p1, 'ryu')", "normalizeVsPick(opts.p1 || vsSelect.p1, 'arcade_flair')"],
    ["normalizeVsPick(opts.p2 || vsSelect.p2, 'ken')", "normalizeVsPick(opts.p2 || vsSelect.p2, 'arcade_rush')"],
    ['// summon / tide / master-sword rolls UIT', '// summon / tide / dawnblade rolls UIT'],
  ];
  for (const [a, b] of pairs) {
    if (!t.includes(a)) throw new Error(`game missing ${a}`);
    t = t.replaceAll(a, b);
  }
  for (const bad of ['masterSword', 'Master Sword', 'MASTER_SWORD', 'master_sword']) {
    if (t.includes(bad)) throw new Error(`game leftover ${bad}`);
  }
  write(rel('src/game/game.js'), t);
  console.log('OK game.js');
}

// --- i18n catalog (IP-B strings only) ---
{
  let t = read(rel('src/i18n/catalog.js'));
  const pairs = [
    ["    masterSword: 'MASTER SWORD!',\n    bossWave: 'BAAS-GOLF!',",
     "    dawnblade: 'DAGERAADKLING!',\n    bossWave: 'BAAS-GOLF!',"],
    ["    masterSword: 'MASTER SWORD!',\n    bossWave: 'BOSS WAVE!',",
     "    dawnblade: 'DAWNBLADE!',\n    bossWave: 'BOSS WAVE!',"],
    ["    masterSwordGain: 'Hyrules legendarische kling — 15s!',",
     "    dawnbladeGain: 'Legendarische dageraadkling — 15s!',"],
    ["    masterSwordFade: 'Master Sword vervaagt…',",
     "    dawnbladeFade: 'Dageraadkling vervaagt…',"],
    ['    masterSwordGain: "Hyrule\'s legendary blade — 15s!",',
     '    dawnbladeGain: "Legendary dawnblade — 15s!",'],
    ["    masterSwordFade: 'Master Sword fades…',",
     "    dawnbladeFade: 'Dawnblade fades…',"],
    ["    super: 'SUPER', masterShort: 'MEESTER +20%', masterSword: 'MASTER SWORD {n}s',",
     "    super: 'SUPER', masterShort: 'MEESTER +20%', dawnblade: 'DAGERAADKLING {n}s',"],
    ["    super: 'SUPER', masterShort: 'MASTER +20%', masterSword: 'MASTER SWORD {n}s',",
     "    super: 'SUPER', masterShort: 'MASTER +20%', dawnblade: 'DAWNBLADE {n}s',"],
    ["    charBig5Hint: 'Ryu · Ken · Goku · One Punch Man · Aruskankou · Kutjankorio · Xavi',",
     "    charBig5Hint: 'Arcade Flair · Arcade Rush · Goku · One Punch Man · Aruskankou · Kutjankorio · Xavi',"],
  ];
  for (const [a, b] of pairs) t = mustReplace(t, a, b, 'catalog');
  // tolerate alternate One Punch → Cape Hero already renamed elsewhere
  t = t.replaceAll(
    "charBig5Hint: 'Ryu · Ken · Goku · Cape Hero · Aruskankou · Kutjankorio · Xavi',",
    "charBig5Hint: 'Arcade Flair · Arcade Rush · Goku · Cape Hero · Aruskankou · Kutjankorio · Xavi',",
  );
  if (t.includes('masterSword') || t.includes('Master Sword') || t.includes('Hyrule') || t.includes('Ryu · Ken')) {
    throw new Error('catalog leftovers');
  }
  write(rel('src/i18n/catalog.js'), t);
  console.log('OK catalog.js');
}

// --- storage: version bump + save migrate ---
{
  let t = read(rel('src/core/storage.js'));
  t = mustReplace(t, "const APP_VERSION = '1.18.133';", "const APP_VERSION = '1.18.134';", 'ver');
  t = mustReplace(t, 'const SW_CACHE_REV = 343;', 'const SW_CACHE_REV = 344;', 'sw');
  const needle = "  if (!WEAPONS.some(w => w.id === out.weapon)) out.weapon = 'vuist';";
  if (!t.includes(needle)) throw new Error('storage weapon needle');
  if (!t.includes("out.weapon === 'master_sword'")) {
    t = mustReplaceOnce(t, needle,
`  // IP-B: master_sword easter-egg id → fall back (not a catalog weapon)
  if (out.weapon === 'master_sword' || out.weapon === 'dawnblade') out.weapon = 'zwaard';
  if (!WEAPONS.some(w => w.id === out.weapon)) out.weapon = 'vuist';`,
      'storage-weapon');
  }
  // migrate upgrade bags / chest bags keys if present
  if (!t.includes("bag.master_sword")) {
    const sumNeedle = '  // Summons: alleen bekende wapens, geldige tiers, en alleen echte upgrades';
    if (!t.includes(sumNeedle)) throw new Error('summons sanitize missing');
    t = mustReplaceOnce(t, sumNeedle,
`  // IP-B: migrate leftover master_sword keys in shard/upgrade bags
  for (const bagName of ['itemUpgrades', 'chestWeapons', 'zoneWeapons', 'summons']) {
    const bag = out[bagName];
    if (!bag || typeof bag !== 'object') continue;
    if (bag.master_sword != null && bag.dawnblade == null && bagName !== 'zoneWeapons') {
      // dawnblade is not a persistable catalog weapon — drop
    }
    if ('master_sword' in bag) delete bag.master_sword;
  }

  // Summons: alleen bekende wapens, geldige tiers, en alleen echte upgrades`,
      'storage-bags');
  }
  write(rel('src/core/storage.js'), t);
  console.log('OK storage.js');
}

console.log('IP-B rename script complete');
