/* ============================== WAPENS ================================= */
const WEAPONS = [
  { id: 'vuist',     name: 'Vuisten',         dmg: 1.0,  range: 38, speed: 1.0,  unlock: 1,  rarity: 'common',    desc: 'Fist arts basics' },
  { id: 'kunai',     name: 'Kunai',           dmg: 1.35, range: 52, speed: 1.15, unlock: 2,  rarity: 'common',    desc: 'Klassieke ninja-mes' },
  { id: 'shuriken',  name: 'Shuriken',        dmg: 1.25, range: 64, speed: 1.35, unlock: 3,  rarity: 'common',    desc: 'Gooit scherpe sterren' },
  { id: 'tanto',     name: 'Tanto',           dmg: 1.22, range: 44, speed: 1.28, unlock: 4,  rarity: 'common',    desc: 'Korte blade · snel' },
  { id: 'zwaard',    name: 'Ninja-zwaard',    dmg: 1.55, range: 58, speed: 0.95, unlock: 5,  rarity: 'uncommon',  desc: 'Blade arts alleskunner' },
  { id: 'sai',       name: 'Sai',             dmg: 1.42, range: 46, speed: 1.22, unlock: 6,  rarity: 'uncommon',  desc: 'Driepuntig · pareren' },
  { id: 'knuppel',   name: 'Knuppel',         dmg: 1.8,  range: 50, speed: 0.72, unlock: 7,  rarity: 'uncommon',  desc: 'Rauwe slagkracht' },
  { id: 'waaier',    name: 'Strijdwaaier',    dmg: 1.48, range: 56, speed: 1.12, unlock: 9,  rarity: 'uncommon',  desc: 'Waaier-snede · stijlvol' },
  { id: 'speer',     name: 'Speer',           dmg: 1.6,  range: 78, speed: 0.8,  unlock: 10, rarity: 'uncommon',  desc: 'Enorm bereik' },
  { id: 'tonfa',     name: 'Tonfa',           dmg: 1.52, range: 50, speed: 1.28, unlock: 12, rarity: 'rare',      desc: 'Zijhandvat · flurry' },
  { id: 'nunchaku',  name: 'Nunchaku',        dmg: 1.3,  range: 48, speed: 1.4,  unlock: 13, rarity: 'rare',      desc: 'Bliksemsnel' },
  { id: 'kama',      name: 'Kama',            dmg: 1.68, range: 54, speed: 1.14, unlock: 15, rarity: 'rare',      desc: 'Sikkel · haak-slagen' },
  { id: 'boemerang', name: 'Boemerang',       dmg: 1.7,  range: 70, speed: 1.05, unlock: 16, rarity: 'rare',      desc: 'Gooi · komt terug' },
  { id: 'zeis',      name: 'Schaduwzeis',     dmg: 1.95, range: 74, speed: 0.82, unlock: 18, rarity: 'rare',      desc: 'Lange boog · duister' },
  { id: 'hamer',     name: 'Mokerhamer',      dmg: 2.6,  range: 52, speed: 0.55, unlock: 20, rarity: 'epic',      desc: 'Sloopt alles' },
  { id: 'drietand',  name: 'Drietand',        dmg: 2.05, range: 76, speed: 0.88, unlock: 22, rarity: 'epic',      desc: 'Drie punten · prikken' },
  { id: 'ketting',   name: 'Kettingzwaard',   dmg: 2.1,  range: 68, speed: 0.95, unlock: 24, rarity: 'epic',      desc: 'Bereik + druk' },
  { id: 'bostaf',    name: 'Bo-staf',         dmg: 1.9,  range: 72, speed: 1.08, unlock: 26, rarity: 'epic',      desc: 'Lange staf · tempo' },
  { id: 'laser',     name: 'Energy-kling',    dmg: 2.3,  range: 62, speed: 1.15, unlock: 28, rarity: 'legendary', desc: 'Blauw brandende kling' },
  { id: 'fuuma',     name: 'Fūma-shuriken',   dmg: 1.95, range: 72, speed: 1.18, unlock: 30, rarity: 'legendary', desc: 'Grote werpster' },
  { id: 'kristal',   name: 'Kristalkling',    dmg: 2.45, range: 60, speed: 1.05, unlock: 32, rarity: 'legendary', desc: 'Scherven-snede' },
  { id: 'donder',    name: 'Bliksem-bijl',    dmg: 2.8,  range: 58, speed: 0.7,  unlock: 34, rarity: 'legendary', desc: 'Als Lightning Pierce, maar een bijl' },
  { id: 'vlamzweep', name: 'Vlamzweep',       dmg: 2.55, range: 78, speed: 1.0,  unlock: 36, rarity: 'legendary', desc: 'Vuurlijn · lang bereik' },
  { id: 'void',      name: 'Voidklaauw',      dmg: 2.5,  range: 64, speed: 1.25, unlock: 40, rarity: 'mythic',    desc: 'Mythische klauw' },
  { id: 'sterkling', name: 'Sterkling',       dmg: 2.75, range: 66, speed: 1.12, unlock: 44, rarity: 'mythic',    desc: 'Hemelmetaal · krits' },
  { id: 'guvve',     name: 'Guvvedukkie-stok', dmg: 3.1,  range: 66, speed: 1.0,  unlock: 48, rarity: 'mythic',    desc: 'Quak. Bitte. Boom.' },

  /* —— Nachtmerrie-only (eiland 6 · Lv 51–60) —— */
  { id: 'nachtkaars', name: 'Nachtkaars', dmg: 3.2, range: 58, speed: 1.08, unlock: 51, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'burn', effectLabel: 'Brandende angst',
    desc: 'Drippy wax · brand DoT' },
  { id: 'droomprikker', name: 'Droomprikker', dmg: 3.05, range: 62, speed: 1.22, unlock: 52, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'drowsy', effectLabel: 'Slaperige prik',
    desc: 'Naald van slapeloosheid' },
  { id: 'spooklepel', name: 'Spooklepel', dmg: 3.15, range: 54, speed: 1.18, unlock: 52, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'flipkb', effectLabel: 'Omgekeerde klap',
    desc: 'Eet je bang · flip-kb' },
  { id: 'nachtmerriesok', name: 'Nachtmerrie-sok', dmg: 3.0, range: 50, speed: 1.32, unlock: 53, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'confuse', effectLabel: 'Sok-slap',
    desc: 'Natte sok · verwarring' },
  { id: 'echotrompet', name: 'Echo-trompet', dmg: 3.25, range: 72, speed: 0.95, unlock: 54, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'echo', effectLabel: 'Echo-boom',
    desc: 'Blaast een schaduw-echo' },
  { id: 'schaduwbanaan', name: 'Schaduw-banaan', dmg: 3.1, range: 60, speed: 1.2, unlock: 54, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'slip', effectLabel: 'Schil-slip',
    desc: 'Valpartij verzekerd' },
  { id: 'voidvork', name: 'Void-vork', dmg: 3.35, range: 56, speed: 1.1, unlock: 55, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'lifesteal', effectLabel: 'Leegte-hap',
    desc: 'Steelt HP uit de leegte' },
  { id: 'angstaccordeon', name: 'Angst-accordeon', dmg: 3.2, range: 70, speed: 0.9, unlock: 56, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'pull', effectLabel: 'Zuig-akkoord',
    desc: 'Trekt monsters dichterbij' },
  { id: 'slaapkussen', name: 'Slaap-kussen', dmg: 3.4, range: 52, speed: 0.85, unlock: 56, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'freeze', effectLabel: 'Kussen-knockout',
    desc: 'Pluizig · korte freeze' },
  { id: 'spooktoaster', name: 'Spook-toaster', dmg: 3.45, range: 58, speed: 1.05, unlock: 57, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'popburn', effectLabel: 'Toast-pop',
    desc: 'Pop! · brand + knal' },
  { id: 'droomspiegel', name: 'Droomspiegel', dmg: 3.3, range: 64, speed: 1.15, unlock: 58, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'critsurge', effectLabel: 'Spiegel-krit',
    desc: 'Weerspiegelt krits' },
  { id: 'nachtuilvleugel', name: 'Nachtuil-vleugel', dmg: 3.15, range: 68, speed: 1.28, unlock: 58, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'flutter', effectLabel: 'Vleugel-flurry',
    desc: 'Fladder-multi-hit' },
  { id: 'waanballon', name: 'Waanballon', dmg: 3.5, range: 55, speed: 1.0, unlock: 59, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'balloon', effectLabel: 'POP-finisher',
    desc: 'Finisher = knal' },
  { id: 'schriktandwiel', name: 'Schrik-tandwiel', dmg: 3.55, range: 62, speed: 0.92, unlock: 60, rarity: 'nightmare',
    dropZone: 'nightmare', effect: 'bleed', effectLabel: 'Tandwiel-bleed',
    desc: 'Rammelende DoT' },

  /* —— Hel-only (eiland 7 · Lv 61–70) —— */
  { id: 'hellevork', name: 'Hellevork', dmg: 3.7, range: 66, speed: 1.05, unlock: 61, rarity: 'hell',
    dropZone: 'hell', effect: 'inferno', effectLabel: 'Zwavel-brand',
    desc: 'Drie hete tanden' },
  { id: 'lavalepel', name: 'Lava-lepel', dmg: 3.65, range: 58, speed: 1.12, unlock: 62, rarity: 'hell',
    dropZone: 'hell', effect: 'magma', effectLabel: 'Magma-plas',
    desc: 'Schept lava onder voeten' },
  { id: 'duiveltrommel', name: 'Duivel-trommel', dmg: 3.8, range: 70, speed: 0.82, unlock: 62, rarity: 'hell',
    dropZone: 'hell', effect: 'quake', effectLabel: 'Hel-beuk',
    desc: 'AOE aardbeving' },
  { id: 'zwavelzeep', name: 'Zwavel-zeep', dmg: 3.55, range: 52, speed: 1.3, unlock: 63, rarity: 'hell',
    dropZone: 'hell', effect: 'soapburn', effectLabel: 'Glad + heet',
    desc: 'Uitglijden in de hel' },
  { id: 'infernoijsje', name: 'Inferno-ijsje', dmg: 3.75, range: 54, speed: 1.15, unlock: 64, rarity: 'hell',
    dropZone: 'hell', effect: 'frostfire', effectLabel: 'IJs → vuur',
    desc: 'Eerst koud, dan heet' },
  { id: 'helhamsterwiel', name: 'Hel-hamsterwiel', dmg: 3.6, range: 64, speed: 1.25, unlock: 64, rarity: 'hell',
    dropZone: 'hell', effect: 'spinchaos', effectLabel: 'Wiel-chaos',
    desc: 'Rolt over alles' },
  { id: 'brimstonebanaan', name: 'Brimstone-banaan', dmg: 3.7, range: 60, speed: 1.18, unlock: 65, rarity: 'hell',
    dropZone: 'hell', effect: 'explodepeel', effectLabel: 'Explosieve schil',
    desc: 'Banaan die knalt' },
  { id: 'demondoekje', name: 'Demon-doekje', dmg: 3.85, range: 50, speed: 1.35, unlock: 66, rarity: 'hell',
    dropZone: 'hell', effect: 'execute', effectLabel: 'Wipe-execute',
    desc: 'Veegt lage HP weg' },
  { id: 'asaccordeon', name: 'As-accordeon', dmg: 3.8, range: 74, speed: 0.88, unlock: 66, rarity: 'hell',
    dropZone: 'hell', effect: 'ashpull', effectLabel: 'As-zuiging',
    desc: 'Trekt + brandt' },
  { id: 'chiliketting', name: 'Chili-ketting', dmg: 3.75, range: 76, speed: 1.08, unlock: 67, rarity: 'hell',
    dropZone: 'hell', effect: 'chainburn', effectLabel: 'Chili-ketting',
    desc: 'Brand springt over' },
  { id: 'helgitaar', name: 'Hel-gitaar', dmg: 3.9, range: 72, speed: 0.95, unlock: 68, rarity: 'hell',
    dropZone: 'hell', effect: 'sonic', effectLabel: 'Sonic-solo',
    desc: 'Powerchord-AOE' },
  { id: 'pyroeend', name: 'Pyro-eend', dmg: 4.0, range: 68, speed: 1.02, unlock: 69, rarity: 'hell',
    dropZone: 'hell', effect: 'quakboom', effectLabel: 'QUAK-BOOM',
    desc: 'Guvve’s hel-cousin' },
  { id: 'apocalypslepel', name: 'Apocalyps-lepel', dmg: 4.2, range: 70, speed: 0.78, unlock: 70, rarity: 'hell',
    dropZone: 'hell', effect: 'meteor', effectLabel: 'Lepel-meteor',
    desc: 'Eet de wereld leeg' },
];
const weaponById = id => WEAPONS.find(w => w.id === id) || WEAPONS[0];

const WEAPON_DROP_ZONES = {
  nightmare: { id: 'nightmare', name: 'Nachtmerrie', minLevel: 51, maxLevel: 60, color: '#c47aff', accent: '#2a1840' },
  hell: { id: 'hell', name: 'Hel', minLevel: 61, maxLevel: 70, color: '#ff6a3d', accent: '#5a1010' },
};

function weaponDropZoneOf(w) {
  const id = typeof w === 'string' ? w : (w && w.dropZone);
  return (id && WEAPON_DROP_ZONES[id]) || null;
}

function adventureDropZoneForLevel(levelN, diffId) {
  const n = Math.floor(Number(levelN) || 0);
  const diff = typeof normalizeAdvDiffId === 'function'
    ? normalizeAdvDiffId(diffId)
    : (diffId || 'normal');
  // Difficulty modes 2.0 / 3.0: drops volgen de tab, niet alleen eiland 6–7
  if (diff === 'hell') return 'hell';
  if (diff === 'nightmare') return 'nightmare';
  if (n >= 61 && n <= 70) return 'hell';
  if (n >= 51 && n <= 60) return 'nightmare';
  return null;
}

function zoneWeaponsFor(zone) {
  return WEAPONS.filter(w => w.dropZone === zone);
}

const WEAPON_EFFECT_LIGHT = {
  burn: ['#ff8c42', '#ffd75e'], popburn: ['#ff6a3d', '#ffe259'], inferno: ['#ff4d2a', '#ffd75e'],
  magma: ['#ff6a3d', '#ff8c42'], soapburn: ['#ffd75e', '#ff8c42'], chainburn: ['#ff6a3d', '#ffe259'],
  ashpull: ['#ff8c42', '#c47aff'], frostfire: ['#7cf5ff', '#ff6a3d'], freeze: ['#7cf5ff', '#e8ffff'],
  drowsy: ['#c47aff', '#7cf5ff'], slip: ['#ffe259', '#c47aff'], flipkb: ['#c47aff', '#ff6b9d'],
  confuse: ['#ff6b9d', '#c47aff'], spinchaos: ['#ff6a3d', '#c47aff'], echo: ['#c47aff', '#ffd75e'],
  sonic: ['#ff6b9d', '#ffe259'], quake: ['#ffd75e', '#ff6a3d'], meteor: ['#ff6a3d', '#fff0a0'],
  quakboom: ['#ffe259', '#ff8c42'], explodepeel: ['#ff6a3d', '#ffe259'], balloon: ['#ff6b9d', '#fff'],
  lifesteal: ['#6ee06e', '#ff6b9d'], pull: ['#b06ae0', '#7cf5ff'], critsurge: ['#ffd75e', '#fff8d0'],
  flutter: ['#c47aff', '#e8d0ff'], bleed: ['#ff4d6d', '#ffb0b8'], execute: ['#ff6a3d', '#fff'],
};

function isDawnbladeWeapon(w) {
  const id = typeof w === 'string' ? w : (w && w.id);
  return !!(w && (w.dawnblade || w.masterSword || id === 'dawnblade' || id === 'master_sword'));
}

/** Licht-FX voor speciale wapens (zone / effect / legendary+ / summon / dawnblade). */
function weaponLightFx(w) {
  const base = typeof w === 'string' ? weaponById(w) : (w || null);
  if (!base || !base.id || base.id === 'vuist') return null;
  if (isDawnbladeWeapon(base)) {
    return { color: '#6fd7ff', color2: '#e8f8ff', pulse: 1.15, special: true };
  }
  if (base.effect && WEAPON_EFFECT_LIGHT[base.effect]) {
    const [color, color2] = WEAPON_EFFECT_LIGHT[base.effect];
    return { color, color2, pulse: base.dropZone === 'hell' ? 1.25 : 1.12, special: true };
  }
  if (base.dropZone === 'hell') return { color: '#ff6a3d', color2: '#ffd75e', pulse: 1.22, special: true };
  if (base.dropZone === 'nightmare') return { color: '#c47aff', color2: '#7cf5ff', pulse: 1.1, special: true };
  const rar = typeof rarityOf === 'function' ? rarityOf(base.rarity) : null;
  if (rar && rar.order >= 4) {
    return { color: rar.color, color2: '#fff8e8', pulse: 0.9 + rar.order * 0.04, special: true };
  }
  if (base.summoned && rar) {
    return { color: rar.color, color2: '#ffffff', pulse: 0.95, special: true };
  }
  return null;
}

function isSpecialLightWeapon(w) {
  return !!weaponLightFx(w);
}

function weaponEffectLabel(w) {
  const base = typeof w === 'string' ? weaponById(w) : w;
  if (!base || !base.effect) return '';
  if (base.effectLabel) return base.effectLabel;
  return String(base.effect);
}

/** Zone-wapens: alleen via drop in Nachtmerrie/Hel (save.zoneWeapons). */
function weaponZoneUnlocked(w) {
  const base = typeof w === 'string' ? weaponById(w) : w;
  if (!base || !base.dropZone) return true;
  return !!(typeof save !== 'undefined' && save.zoneWeapons && save.zoneWeapons[base.id]);
}

function grantZoneWeapon(weaponId, opts) {
  opts = opts || {};
  const w = weaponById(weaponId);
  if (!w || !w.dropZone) return false;
  if (!save.zoneWeapons || typeof save.zoneWeapons !== 'object') save.zoneWeapons = {};
  if (save.zoneWeapons[w.id]) return false;
  save.zoneWeapons[w.id] = 1;
  try { persist(); } catch (_) {}
  if (!opts.silent) {
    try {
      const zone = weaponDropZoneOf(w);
      const col = zone ? zone.color : '#c47aff';
      if (typeof UI !== 'undefined' && UI && typeof UI.toast === 'function') {
        UI.toast(`${zone ? zone.name : 'Zone'}: ${weaponLabel(w)}!`, 3800);
      }
      if (typeof game !== 'undefined' && game && typeof game.banner === 'function') {
        game.banner(weaponLabel(w), 2.1, col, 34);
      }
      if (typeof AudioSys !== 'undefined' && AudioSys && typeof AudioSys.sfx === 'function') {
        AudioSys.sfx('newmonster');
      }
    } catch (_) {}
  }
  return true;
}

function rollZoneWeaponDrop(game, monster) {
  if (!game || game.mode !== 'adventure' || !game.level) return null;
  const diff = (game.advDiff || (game.level && game.level.diff) || 'normal');
  const zone = adventureDropZoneForLevel(game.level.n, diff);
  if (!zone) return null;
  const pool = zoneWeaponsFor(zone).filter(w => !weaponZoneUnlocked(w));
  if (!pool.length) return null;
  let chance = 0.045;
  if (monster) {
    if (monster.superBoss) chance = 0.55;
    else if (monster.elite) chance = 0.18;
    else if (monster.giant) chance = 0.09;
  }
  if (game.level.boss && monster && monster.elite) chance = Math.max(chance, 0.28);
  // Nightmare 2.0 / Hell 3.0: dropMul versnelt zone-collectie
  if (typeof advDropChanceMul === 'function') {
    chance = Math.min(0.72, chance * advDropChanceMul(diff));
  }
  if (Math.random() > chance) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (grantZoneWeapon(pick.id)) return pick;
  return null;
}

/** Garantie-drop bij eilandbaas-clear (Lv 60 / 70) of hard-diff eilandbaas (10/20/…/70). */
function grantZoneBossClearWeapon(levelN, diffId) {
  const n = Math.floor(Number(levelN) || 0);
  const diff = typeof normalizeAdvDiffId === 'function'
    ? normalizeAdvDiffId(diffId)
    : (diffId || 'normal');
  const zone = adventureDropZoneForLevel(n, diff);
  if (!zone) return null;
  const isIslandBoss = n > 0 && n % 10 === 0;
  const isLegacyZoneBoss = n === 60 || n === 70;
  // Normal: alleen zone-eilandbazen 60/70. Hard diffs: elke eilandbaas.
  if (diff === 'normal' && !isLegacyZoneBoss) return null;
  if (diff !== 'normal' && !isIslandBoss) return null;
  const pool = zoneWeaponsFor(zone).filter(w => !weaponZoneUnlocked(w));
  if (!pool.length) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (grantZoneWeapon(pick.id)) return pick;
  return null;
}

/* —— On-hit effecten voor zone-wapens —— */
function applyWeaponOnHitEffect(game, fighter, target, hit) {
  if (!game || !fighter || !target || !target.alive) return;
  // Alleen monsters (niet versus/training fighters) — burn/bleed verwachten size/sp
  if (!target.sp || !(target.size > 0)) return;
  const w = fighter.weapon;
  if (!w || !w.effect) return;
  // DoT / splash-rehit mag geen nieuwe effect-keten starten
  if (hit && (hit.kind === 'dot' || hit.skipEffect)) return;
  const effect = w.effect;
  const dmg = (hit && hit.dmg) || 10;
  const finisher = !!(hit && hit.finisher);
  const x = target.x, y = target.y - (target.size || 20) * 0.4;
  const label = weaponEffectLabel(w);
  const floater = (txt, col) => {
    try { game.floater(x, y - 18, txt, col || '#ff6b9d', 13, 'fx'); } catch (_) {}
  };

  switch (effect) {
    case 'burn':
    case 'inferno':
    case 'popburn':
    case 'magma':
    case 'soapburn':
    case 'chainburn':
    case 'ashpull': {
      const ticks = effect === 'inferno' ? 5 : (effect === 'magma' ? 4 : 3);
      const tickDmg = Math.max(2, Math.round(dmg * (effect === 'inferno' ? 0.22 : 0.14)));
      target.wpnBurnT = Math.max(target.wpnBurnT || 0, ticks * 0.55);
      target.wpnBurnDmg = Math.max(target.wpnBurnDmg || 0, tickDmg);
      target.wpnBurnTick = 0.55;
      if (effect === 'popburn' || effect === 'magma') {
        try { game.burst(x, y, '#ff6a3d', 10, { kind: 'spark', size: 2.4 }); } catch (_) {}
      }
      if (effect === 'soapburn' || effect === 'ashpull') {
        try { applySuperMonsterSlow(target, 1.1, 0.45); } catch (_) {}
      }
      if (effect === 'chainburn' || effect === 'ashpull') {
        for (const m of game.monsters || []) {
          if (!m.alive || m === target) continue;
          if ((m.x - target.x) ** 2 + (m.y - target.y) ** 2 < 140 * 140) {
            m.wpnBurnT = Math.max(m.wpnBurnT || 0, 1.4);
            m.wpnBurnDmg = Math.max(m.wpnBurnDmg || 0, Math.round(tickDmg * 0.7));
            m.wpnBurnTick = 0.5;
          }
        }
      }
      if (effect === 'ashpull' || effect === 'pull') {
        const dir = Math.sign(fighter.x - target.x) || 1;
        target.vx = (target.vx || 0) + dir * 180;
      }
      floater(label || '🔥', '#ff6a3d');
      break;
    }
    case 'drowsy':
    case 'slip':
    case 'freeze':
    case 'frostfire': {
      const slow = effect === 'freeze' ? 0.08 : 0.35;
      const dur = effect === 'freeze' ? 1.35 : 1.05;
      try { applySuperMonsterSlow(target, dur, slow); } catch (_) {}
      if (effect === 'freeze') {
        try { game.freezeT = Math.max(game.freezeT || 0, 0.04); } catch (_) {}
        try { game.burst(x, y, '#7cf5ff', 8, { kind: 'spark', size: 2 }); } catch (_) {}
      }
      if (effect === 'frostfire') {
        target.wpnBurnT = Math.max(target.wpnBurnT || 0, 2.0);
        target.wpnBurnDmg = Math.max(target.wpnBurnDmg || 0, Math.round(dmg * 0.16));
        target.wpnBurnTick = 0.5;
      }
      floater(label || '💤', effect === 'frostfire' ? '#ff8c42' : '#7cf5ff');
      break;
    }
    case 'flipkb':
    case 'confuse':
    case 'spinchaos': {
      target.face = -(target.face || 1);
      target.vx = -(target.vx || 0) * 1.35 - (fighter.face || 1) * 90;
      if (effect === 'spinchaos') {
        target.superSlowT = Math.max(target.superSlowT || 0, 0.7);
        target.superSlowMul = Math.min(target.superSlowMul || 1, 0.4);
      }
      floater(label || '‽', '#c47aff');
      break;
    }
    case 'echo':
    case 'quake':
    case 'sonic':
    case 'meteor':
    case 'quakboom':
    case 'explodepeel':
    case 'balloon': {
      const r = effect === 'meteor' ? 170 : (effect === 'quake' || effect === 'sonic' ? 150 : 120);
      const aoeMul = effect === 'meteor' ? 0.55 : (effect === 'balloon' && !finisher ? 0.2 : 0.38);
      if (effect === 'balloon' && !finisher) break;
      for (const m of game.monsters || []) {
        if (!m.alive) continue;
        const dist2 = (m.x - target.x) ** 2 + (m.y - target.y) ** 2;
        if (dist2 > r * r) continue;
        const splash = Math.max(3, Math.round(dmg * aoeMul * (m === target ? 0.35 : 1)));
        if (m !== target) {
          try { m.takeDamage(splash, (fighter.face || 1) * 120, game, { kind: 'weapon', skipHitSfx: true, quiet: true }); } catch (_) {}
        }
      }
      try {
        const col = effect === 'quakboom' ? '#ffe259' : (effect === 'sonic' ? '#ff6b9d' : '#ff6a3d');
        game.burst(x, y, col, effect === 'meteor' ? 22 : 14, { kind: 'spark', size: 3 });
        spawnFxRing(game, x, y, col, r * 0.35);
      } catch (_) {}
      floater(label || 'BOOM', '#ffd75e');
      break;
    }
    case 'lifesteal': {
      if (fighter.isPlayer || fighter.playerSlot) {
        const heal = Math.max(2, Math.round(dmg * 0.18));
        fighter.hp = Math.min(fighter.maxhp, (fighter.hp || 0) + heal);
        floater(`+${heal}`, '#6ee06e');
      }
      break;
    }
    case 'pull': {
      const dir = Math.sign(fighter.x - target.x) || 1;
      target.vx = (target.vx || 0) + dir * 220;
      floater(label || '←', '#b06ae0');
      break;
    }
    case 'critsurge': {
      fighter._wpnCritSurgeT = Math.max(fighter._wpnCritSurgeT || 0, 2.4);
      floater(label || 'CRIT↑', '#ffd75e');
      break;
    }
    case 'flutter': {
      if (!game._wpnFlutterQueue) game._wpnFlutterQueue = [];
      game._wpnFlutterQueue.push({
        t: 0.12, left: 2, target, dmg: Math.max(2, Math.round(dmg * 0.28)), face: fighter.face || 1, owner: fighter,
      });
      floater(label || '···', '#c47aff');
      break;
    }
    case 'bleed': {
      target.wpnBleedT = Math.max(target.wpnBleedT || 0, 2.6);
      target.wpnBleedDmg = Math.max(target.wpnBleedDmg || 0, Math.round(dmg * 0.12));
      target.wpnBleedTick = 0.45;
      floater(label || '🩸', '#ff4d6d');
      break;
    }
    case 'execute': {
      const pct = target.hp / Math.max(1, target.maxhp);
      if (pct <= 0.18) {
        try { target.takeDamage(target.hp + 1, (fighter.face || 1) * 200, game, { kind: 'weapon', crit: true }); } catch (_) {}
        floater('WIPE!', '#ff6a3d');
        try { game.burst(x, y, '#ff6a3d', 16, { kind: 'spark', size: 3 }); } catch (_) {}
      }
      break;
    }
    default:
      break;
  }
}

function tickWeaponStatusEffects(game, dt) {
  if (!game || !game.monsters) return;
  for (const m of game.monsters) {
    if (!m.alive) continue;
    if (m.wpnBurnT > 0) {
      m.wpnBurnT -= dt;
      m.wpnBurnTick = (m.wpnBurnTick || 0) - dt;
      if (m.wpnBurnTick <= 0) {
        m.wpnBurnTick = 0.55;
        const d = Math.max(1, m.wpnBurnDmg || 2);
        try { m.takeDamage(d, 0, game, { kind: 'dot', skipHitSfx: true, quiet: true }); } catch (_) {}
        try { game.burst(m.x, m.y - m.size * 0.4, '#ff6a3d', 3, { kind: 'spark', size: 1.5 }); } catch (_) {}
      }
    }
    if (m.wpnBleedT > 0) {
      m.wpnBleedT -= dt;
      m.wpnBleedTick = (m.wpnBleedTick || 0) - dt;
      if (m.wpnBleedTick <= 0) {
        m.wpnBleedTick = 0.45;
        const d = Math.max(1, m.wpnBleedDmg || 2);
        try { m.takeDamage(d, 0, game, { kind: 'dot', skipHitSfx: true, quiet: true }); } catch (_) {}
      }
    }
  }
  if (game._wpnFlutterQueue && game._wpnFlutterQueue.length) {
    for (let i = game._wpnFlutterQueue.length - 1; i >= 0; i--) {
      const q = game._wpnFlutterQueue[i];
      q.t -= dt;
      if (q.t > 0) continue;
      if (!q.target || !q.target.alive || q.left <= 0) {
        game._wpnFlutterQueue.splice(i, 1);
        continue;
      }
      try { q.target.takeDamage(q.dmg, q.face * 40, game, { kind: 'dot', skipHitSfx: true, quiet: true }); } catch (_) {}
      try { game.burst(q.target.x, q.target.y - q.target.size * 0.3, '#c47aff', 4, { kind: 'spark', size: 1.8 }); } catch (_) {}
      q.left -= 1;
      q.t = 0.1;
      if (q.left <= 0) game._wpnFlutterQueue.splice(i, 1);
    }
  }
}
