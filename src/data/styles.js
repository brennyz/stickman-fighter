/* ============================== STIJLEN ================================ */
const STYLES = [
  { id: 'classic', name: 'Klassiek', body: '#f2f5ff', accent: '#3db8ff', bandana: null,
    needLvl: 1, hint: 'Standaard ninja',
    tooltip: 'Basis ninja — geen bonus, wel de snelste unlock.',
    bonus: 'Geen combat-bonus' },
  { id: 'konoha', name: 'Konoha bandana', body: '#f2f5ff', accent: '#43b25b', bandana: '#2d6b36', plate: '#dfe8ff',
    needLvl: 5, hint: 'Unlock op Lv 5',
    tooltip: 'Leaf-dorp headband. Iets meer max HP — standvastig in lange levels.',
    bonus: '+5 max HP', mods: { maxHp: 5 } },
  { id: 'chakra', name: 'Chakra gloed', body: '#e8f4ff', accent: '#7cf5ff', bandana: '#3db8ff', glow: true,
    needTrain: 3, hint: 'Win 3× training',
    tooltip: 'Blauwe chakra-aura. Chakra laadt sneller — vaker Rasengan/Chidori.',
    bonus: '+8% chakra-regen', mods: { energyMul: 1.08 } },
  { id: 'akatsuki', name: 'Rode mantel', body: '#1a1424', accent: '#e04f4f', bandana: '#e04f4f', coat: true,
    needLvl: 12, hint: 'Unlock op Lv 12',
    tooltip: 'Rode mantel — agressieve slagen. Meer schade op melee en wapens.',
    bonus: '+4% schade', mods: { dmgMul: 1.04 } },
  { id: 'shadow', name: 'Schaduw-ninja', body: '#8fa3d9', accent: '#b06ae0', bandana: '#2a1840',
    needLvl: 15, hint: 'Unlock op Lv 15',
    tooltip: 'Schaduw-stappen. Extra crit-kans op alle hits.',
    bonus: '+3% crit', mods: { critBonus: 0.03 } },
  { id: 'guvve', name: 'Guvvedukkie', body: '#43b25b', accent: '#ffe259', bandana: '#2a8a38', duck: true,
    needDex: 8, hint: '8 monsters in boek',
    tooltip: 'Quack-cosplay. Bonus XP bij avontuur-kills — licht, geen grind.',
    bonus: '+6% avontuur-XP', mods: { xpMul: 1.06 } },
  { id: 'gold', name: 'Legendarisch', body: '#ffd75e', accent: '#c97a20', bandana: '#ffb830', glow: true,
    needLvl: 25, hint: 'Unlock op Lv 25',
    tooltip: 'Gouden outline + gloed. Sterkere knockback op kicks en specials.',
    bonus: '+10% knockback', mods: { kbMul: 1.1 } },
  { id: 'sand', name: 'Woestijn', body: '#e8c98a', accent: '#c97a20', bandana: '#8a6030',
    needLvl: 8, hint: 'Unlock op Lv 8',
    tooltip: 'Zandmantel — minder schade bij hits én sterker blok. Tank-stijl voor omringing.',
    bonus: '−14% schade · blok −25% chip', mods: { defMul: 0.86, blockMul: 0.75 } },
  { id: 'samurai', name: 'Samurai', body: '#2a2a35', accent: '#e04f4f', bandana: '#1a1a22', topknot: true,
    needLvl: 20, hint: 'Unlock op Lv 20',
    tooltip: 'Topknot + katana-houding. Wapen-combo’s raken iets verder.',
    bonus: '+8% wapen-reach', mods: { weaponRange: 1.08 } },
  { id: 'cyber', name: 'Cyber-ninja', body: '#1a2040', accent: '#7cf5ff', bandana: '#4ecf6a', visor: true, lightning: true,
    needLvl: 18, hint: 'Unlock op Lv 18',
    tooltip: 'Neon-visier + bliksem-flits bij melee. Snellere chakra en visuele chain-sparks.',
    bonus: 'Lightning FX · +6% chakra', mods: { energyMul: 1.06, lightning: true, dmgMul: 1.02 } },
  { id: 'fox', name: 'Vossen-ninja', body: '#ff8c42', accent: '#ffe259', bandana: '#d05a1e', fox: true,
    needDex: 12, hint: '12 monsters in boek',
    tooltip: 'Vossenoren — sneller op de grond. Ideaal voor kiting en shuriken.',
    bonus: '+5% loopsnelheid', mods: { speedMul: 1.05 } },
  { id: 'storm', name: 'Stormgeest', body: '#dfe8ff', accent: '#6fd7ff', bandana: '#2a7fc0', glow: true, lightning: true,
    needTrain: 5, hint: 'Win 5× training',
    tooltip: 'Storm-aura + zachte bliksem. Extra shield bij start van elke golf.',
    bonus: 'Lightning gloed · +0.8s shield/golf', mods: { shieldWave: 0.8, lightning: true } },
  { id: 'void', name: 'Void-waker', body: '#2a1840', accent: '#ff6b9d', bandana: '#5a1040', coat: true,
    needLvl: 40, hint: 'Unlock op Lv 40',
    tooltip: 'Void-mantel — zwaardere jutsu. Specials (Rasengan/Chidori/Rinnegan) raken harder.',
    bonus: '+8% jutsu-schade', mods: { jutsuMul: 1.08 } },
  { id: 'hunter', name: 'Jagerlook', body: '#6b5344', accent: '#5ad06a', bandana: '#3d5c32', hunter: true,
    needDexKills: 75, hint: '75 kills in monsterboek',
    tooltip: 'Jager-cape + groene accenten. Bonus schade vs monsters in avontuur.',
    bonus: '+6% vs monsters', mods: { advDmgMul: 1.06 } },
  { id: 'crystal', name: 'Kristallijn', body: '#e8f7ff', accent: '#6fd7ff', bandana: '#2f7fc0', glow: true, crystal: true,
    needDexTiers: 4, hint: '4 rariteiten in monsterboek',
    tooltip: 'Kristallen shard — reflecterende gloed. Korte shield elke golf.',
    bonus: '+1.0s shield/golf', mods: { shieldWave: 1.0 } },
  { id: 'tome', name: 'Boekmeester', body: '#f5efe6', accent: '#c98850', bandana: '#6b5344', tome: true,
    needDexHalf: true, hint: 'Helft van het monsterboek',
    tooltip: 'Monsterboek op je rug. Meer HP-bonus bij nieuwe dex-ontdekkingen (visueel + klein HP-top-up).',
    bonus: '+4 max HP · boek-wijsheid', mods: { maxHp: 4, dexHpBonus: 1 } },
];
const styleById = id => STYLES.find(s => s.id === id) || STYLES[0];

function styleMods(st) {
  return (st && st.mods) ? st.mods : {};
}

function styleCombatLine(st) {
  return st.bonus || st.hint || '';
}

function styleUnlocked(st) {
  if (st.id === 'classic') return true;
  if (styleSkillGated(st)) return false;
  if (st.needLvl && save.lvl >= st.needLvl) return true;
  if (st.needTrain && save.trainWins >= st.needTrain) return true;
  if (st.needDex && dexCount() >= st.needDex) return true;
  if (st.needDexKills && dexTotalKills() >= st.needDexKills) return true;
  if (st.needDexTiers && dexRarityTierCount() >= st.needDexTiers) return true;
  if (st.needDexHalf && typeof SPECIES_ORDER !== 'undefined' &&
      dexCount() >= Math.ceil(SPECIES_ORDER.length / 2)) return true;
  return false;
}

function applyStyleBonusesToPlayer(game, player) {
  if (!player) return;
  const st = styleById(save.style || 'classic');
  const m = styleMods(st);
  game.styleDefMul = m.defMul || 1;
  game.styleDmgMul = m.dmgMul || 1;
  game.styleAdvDmgMul = m.advDmgMul || 1;
  game.styleEnergyMul = m.energyMul || 1;
  game.styleCritBonus = m.critBonus || 0;
  game.styleKbMul = m.kbMul || 1;
  game.styleJutsuMul = m.jutsuMul || 1;
  game.styleShieldWave = m.shieldWave || 0;
  game.styleBlockMul = m.blockMul || 1;
  game.styleXpMul = m.xpMul || 1;
  game.styleLightning = !!(st.lightning || m.lightning);
  if (m.maxHp) {
    player.maxhp += m.maxHp;
    player.hp += m.maxHp;
  }
  if (m.speedMul && m.speedMul !== 1) {
    player.speed = Math.round(player.speed * m.speedMul);
  }
  if (m.weaponRange && m.weaponRange !== 1) {
    game.styleWeaponRange = m.weaponRange;
  } else {
    game.styleWeaponRange = 1;
  }
}

function applyPlayerStyle(fighter) {
  const st = styleById(save.style || 'classic');
  if (!styleUnlocked(st)) { save.style = 'classic'; persist(); }
  fighter.color = styleById(save.style).body;
  fighter.style = styleById(save.style);
  fighter.lineW = st.id === 'gold' ? 5 : 4.5;
}

function applyStyleToSpec(fighter, spec) {
  if (!spec || !fighter || !fighter.isPlayer) return spec;
  const m = styleMods(fighter.style);
  if (m.dmgMul && m.dmgMul !== 1) spec.dmg = Math.round(spec.dmg * m.dmgMul);
  if (m.kbMul && m.kbMul !== 1) spec.kb = (spec.kb || 0) * m.kbMul;
  if (m.weaponRange && spec.kind === 'weapon') {
    spec.range = (spec.range || 40) * m.weaponRange;
    spec.r = (spec.r || 24) * Math.sqrt(m.weaponRange);
  }
  if (m.jutsuMul && spec.kind === 'special') spec.dmg = Math.round(spec.dmg * m.jutsuMul);
  return spec;
}
