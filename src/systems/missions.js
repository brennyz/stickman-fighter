/* ===================== DAGELIJKSE MISSIES & PRESTATIES ================= */
const DAILY_DEFS = [
  { id: 'kills12', type: 'kills', goal: 12, xp: 45, text: 'Versla 12 monsters' },
  { id: 'advwin', type: 'advWin', goal: 1, xp: 55, text: 'Win 1 avontuur-level' },
  { id: 'wall35', type: 'wallBricks', goal: 35, xp: 40, text: 'Sloop 35 muurstenen' },
  { id: 'trainwin', type: 'trainWin', goal: 1, xp: 60, text: 'Win training vs Robot' },
  { id: 'combo5', type: 'comboReach', goal: 5, xp: 35, text: 'Bereik combo ×5' },
  { id: 'finisher3', type: 'weaponFinisher', goal: 3, xp: 42, text: 'Land 3 wapen-finishers' },
  { id: 'pick3', type: 'pickups', goal: 3, xp: 30, text: 'Pak 3 power-ups' },
  { id: 'boss1', type: 'bossKill', goal: 1, xp: 50, text: 'Versla 1 baas-monster' },
];
const DAILY_PLAY_HINTS = {
  kills12: 'Speel Avontuur of Training',
  advwin: 'Menu → Avontuur, win het level',
  wall35: 'Menu → Muur slopen (combo helpt)',
  trainwin: 'Menu → Training vs RabbitRobot',
  combo5: 'Avontuur: snelle combo’s op monsters',
  finisher3: 'Avontuur/Training: ①+② raken, dan finisher ③',
  pick3: 'Avontuur: groen/oranje/blauwe bolletjes',
  boss1: 'Avontuur: baas aan einde van een level',
};
const DAILY_PLAY_TARGETS = {
  kills12: { mode: 'adventure', label: 'Avontuur' },
  advwin: { mode: 'adventure', label: 'Avontuur' },
  wall35: { mode: 'wall', label: 'Muur' },
  trainwin: { mode: 'training', label: 'Training' },
  combo5: { mode: 'adventure', label: 'Avontuur' },
  finisher3: { mode: 'adventure', label: 'Avontuur' },
  pick3: { mode: 'adventure', label: 'Avontuur' },
  boss1: { mode: 'adventure', label: 'Avontuur' },
};
function goDailyPlayTarget(taskId) {
  try {
    const t = DAILY_PLAY_TARGETS[taskId];
    if (!t) return;
    AudioSys.init();
    AudioSys.sfx('select');
    if (t.mode === 'adventure') {
      UI.renderLevels();
      UI.show('levelScreen');
    } else if (t.mode === 'training') {
      startGame('training');
    } else if (t.mode === 'wall') {
      startGame('wall');
    }
  } catch (err) {
    sfReportError('dailyPlay', err, 'Kon modus niet openen — kies handmatig in menu');
  }
}
const ACHIEVEMENTS = [
  { id: 'first_win', name: 'Eerste triomf', desc: 'Win je eerste level', icon: '🏆',
    test: s => s.stats.advWins >= 1 },
  { id: 'lv10', name: 'Groeiende ninja', desc: 'Bereik vechter Lv 10', icon: '⬆️',
    test: s => s.lvl >= 10 },
  { id: 'dex10', name: 'Monsterkenner', desc: '10 soorten in monsterboek', icon: '📖',
    test: s => Object.keys(s.dex).length >= 10 },
  { id: 'dexFull', name: 'Encyclopedie', desc: 'Alle monster-soorten ontdekt', icon: '📚',
    test: s => Object.keys(s.dex).length >= SPECIES_ORDER.length },
  { id: 'dex100', name: 'Jager', desc: '100 monster-kills geregistreerd', icon: '🎯',
    test: s => {
      let n = 0;
      for (const v of Object.values(s.dex || {})) n += v || 0;
      return n >= 100;
    } },
  { id: 'dexHalf', name: 'Veldgids', desc: 'Helft van alle soorten ontdekt', icon: '🧭',
    test: s => Object.keys(s.dex || {}).length >= Math.ceil(SPECIES_ORDER.length / 2) },
  { id: 'dexTiers', name: 'Rariteitenjager', desc: '4 verschillende rariteiten in boek', icon: '💎',
    test: () => dexRarityTierCount() >= 4 },
  { id: 'dexMythic', name: 'Mythe-zoeker', desc: 'Eén mythisch monster ontdekt', icon: '✨',
    test: s => {
      for (const id of Object.keys(s.dex || {})) {
        const sp = SPECIES[id];
        if (sp && sp.rarity === 'mythic') return true;
      }
      return false;
    } },
  { id: 'train5', name: 'Robotbreker', desc: '5× training gewonnen', icon: '🤖',
    test: s => s.trainWins >= 5 },
  { id: 'wall100', name: 'Sloper', desc: 'Muurrecord 100+', icon: '🧱',
    test: s => s.bestWall >= 100 },
  { id: 'combo8', name: 'Combo-koning', desc: 'Combo ×8 bereikt', icon: '⚡',
    test: s => s.stats.maxCombo >= 8 },
  { id: 'finisher10', name: 'Stijl-meester', desc: '10 wapen-finishers geland', icon: '⚔',
    test: s => (s.stats.weaponFinishers || 0) >= 10 },
  { id: 'finisher1', name: 'Eerste stijl', desc: 'Land je eerste wapen-finisher', icon: '🗡',
    test: s => (s.stats.weaponFinishers || 0) >= 1 },
  { id: 'weaponMaster25', name: 'Wapen-legende', desc: '25 finishers met één wapen', icon: '👑',
    test: s => Object.values(s.weaponMastery || {}).some(m => (m.finishers || 0) >= 25) },
  { id: 'finisher50', name: 'Combo-sensei', desc: '50 finishers totaal', icon: '✨',
    test: s => (s.stats.weaponFinishers || 0) >= 50 },
  { id: 'streak10', name: 'Onstuitbaar', desc: 'Kill streak ×10 in avontuur', icon: '🔥',
    test: s => (s.stats.maxKillStreak || 0) >= 10 },
  { id: 'trainCombo10', name: 'Dummy-meester', desc: 'Training combo ×10', icon: '🎯',
    test: s => (s.stats.trainMaxCombo || 0) >= 10 },
  { id: 'lv50', name: 'Legende', desc: 'Unlock level 50', icon: '👑',
    test: s => s.unlocked >= 50 },
  { id: 'daily7', name: 'Vastberaden', desc: '7 dagen dagbonus geclaimd', icon: '📅',
    test: s => (s.stats.dailyBonusCount || 0) >= 7 },
  { id: 'vs5', name: 'Duelist', desc: '5× 2-speler duel gespeeld', icon: '🥊',
    test: s => (s.stats.vsMatches || 0) >= 5 },
  { id: 'vs_roster', name: 'Vol roster', desc: 'Speel met 10+ verschillende vechters (2P)', icon: '🎭',
    test: s => (s.vsPlayedIds || []).length >= 10 },
  { id: 'saga_icons', name: 'Saga-legends', desc: 'Speel 2P met alle 7 legend picks', icon: '🌟',
    test: s => {
      const need = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
      const played = s.vsPlayedIds || [];
      return need.every(id => played.includes(id));
    } },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function ensureDaily() {
  const dk = todayKey();
  if (!save.daily || save.daily.date !== dk || !Array.isArray(save.daily.tasks) || !save.daily.tasks.length) {
    const order = [...DAILY_DEFS].sort((a, b) => {
      const h = (s) => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 33 + s.charCodeAt(i)) | 0; return x; };
      return h(dk + a.id) - h(dk + b.id);
    });
    save.daily = {
      date: dk,
      tasks: order.slice(0, 3).map(d => ({ id: d.id, progress: 0, done: false, claimed: false })),
      allClaimed: false,
      dayBonusClaimed: false,
    };
    persist();
  }
  return save.daily;
}
function dailyDef(id) { return DAILY_DEFS.find(d => d.id === id); }

function bumpDaily(type, amount) {
  ensureDaily();
  let changed = false;
  for (const task of save.daily.tasks) {
    if (task.done) continue;
    const def = dailyDef(task.id);
    if (!def || def.type !== type) continue;
    if (type === 'comboReach' || type === 'wallBricks') {
      task.progress = Math.max(task.progress, amount);
    } else {
      task.progress += amount;
    }
    if (task.progress >= def.goal) { task.progress = def.goal; task.done = true; changed = true; UI.toast(t('toast.missionDone', { text: dailyText(def.id) }), 2800); }
    else changed = true;
  }
  if (changed) { persist(); checkAchievements(); if (UI.renderMissions) UI.renderMissions(); }
}

function claimableDailyTasks() {
  ensureDaily();
  return save.daily.tasks.filter(t => t.done && !t.claimed && dailyDef(t.id));
}

function claimDailyTask(taskId, opts) {
  opts = opts || {};
  ensureDaily();
  const t = save.daily.tasks.find(x => x.id === taskId);
  const def = dailyDef(taskId);
  if (!t || !def || !t.done || t.claimed) return 0;
  t.claimed = true;
  grantMetaXP(def.xp);
  if (!opts.silent) {
    AudioSys.sfx('bonus');
    UI.toast(t('toast.claimXp', { xp: def.xp, text: dailyText(taskId) }), 2600);
  }
  if (!persistOrToast('missie-claim')) return 0;
  if (!opts.skipRefresh) {
    checkDailyAllBonus();
    UI.renderMissions();
    if (!opts.silent && !opts.skipFollowUp) {
      setTimeout(() => dailyClaimFollowUpToast(), 420);
    }
  }
  return def.xp;
}

function claimAllDailyReady() {
  ensureDaily();
  const ready = claimableDailyTasks();
  if (!ready.length) {
    UI.toast(t('toast.noMissionReady'), 2400);
    return;
  }
  let total = 0;
  for (const t of ready) total += claimDailyTask(t.id, { silent: true, skipRefresh: true });
  AudioSys.sfx('bonus');
  persist();
  checkDailyAllBonus();
  UI.renderMissions();
  UI.renderMenu();
  UI.toast(ready.length === 1
    ? t('toast.claimBatch1', { total })
    : t('toast.claimBatchN', { n: ready.length, total }), 3200);
  setTimeout(() => dailyClaimFollowUpToast(), 450);
}

function claimDailyDayBonus() {
  ensureDaily();
  if (save.daily.dayBonusClaimed) {
    UI.toast(t('toast.dayBonusAlready'), 2800);
    return;
  }
  const left = save.daily.tasks.filter(t => !t.claimed).length;
  if (left > 0) {
    UI.toast(left === 1
      ? t('toast.dayBonusNeed1')
      : t('toast.dayBonusNeedN', { n: left }), 3000);
    return;
  }
  save.daily.dayBonusClaimed = true;
  save.stats.dailyBonusCount = (save.stats.dailyBonusCount || 0) + 1;
  grantMetaXP(80);
  AudioSys.sfx('win');
  if (!persistOrToast('dagbonus')) return;
  checkAchievements();
  UI.renderMissions();
  UI.renderMenu();
  UI.toast(t('toast.dayBonusDone'), 3400);
}

function grantMetaXP(n) {
  save.xp += n;
  while (save.xp >= xpNeed(save.lvl)) {
    save.xp -= xpNeed(save.lvl);
    save.lvl++;
    AudioSys.sfx('levelup');
  }
  persistOrToast('XP');
  UI.renderMenu();
}

function checkDailyAllBonus() {
  ensureDaily();
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    UI.toast(t('toast.allClaimedTapBonus'), 3500);
  }
}

function dailyUnclaimedXp() {
  ensureDaily();
  let xp = claimableDailyTasks().reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) xp += 80;
  return xp;
}

function dailyPotentialXp() {
  ensureDaily();
  return save.daily.tasks.reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0) + 80;
}

function dailyFlowStep() {
  ensureDaily();
  if (save.daily.dayBonusClaimed) return 0;
  if (claimableDailyTasks().length > 0) return 2;
  if (save.daily.tasks.every(t => t.claimed)) return 3;
  return 1;
}

function dailyFlowBarHtml(step) {
  if (step === 0) {
    return `<div class="mission-flow-bar mission-flow-done">${t('missionsUi.flowDone')}</div>`;
  }
  const mk = (n, label, sub) => {
    const active = step === n ? ' active' : '';
    const done = step > n ? ' done' : '';
    return `<span class="mission-flow-pill${active}${done}"><b>${n}</b> ${label}<small>${sub}</small></span>`;
  };
  return `<div class="mission-flow-bar">${mk(1, t('missionsUi.flowPlay'), t('missionsUi.flowPlaySub'))}` +
    `<span class="mission-flow-arrow">→</span>${mk(2, t('missionsUi.flowClaim'), t('missionsUi.flowClaimSub'))}` +
    `<span class="mission-flow-arrow">→</span>${mk(3, t('missionsUi.flowBonus'), t('missionsUi.flowBonusSub'))}</div>`;
}

function dailyTaskRemainderText(task, def) {
  if (task.done || task.claimed) return '';
  const left = def.goal - task.progress;
  if (left <= 0) return '';
  if (def.type === 'kills') return left === 1 ? t('missionsUi.remainderKills1') : t('missionsUi.remainderKillsN', { n: left });
  if (def.type === 'wallBricks') return left === 1 ? t('missionsUi.remainderBricks1') : t('missionsUi.remainderBricksN', { n: left });
  if (def.type === 'comboReach') return t('missionsUi.remainderCombo', { n: left });
  if (def.type === 'pickups') return left === 1 ? t('missionsUi.remainderPickups1') : t('missionsUi.remainderPickupsN', { n: left });
  if (def.type === 'advWin' || def.type === 'trainWin' || def.type === 'bossKill') return t('missionsUi.remainderRun');
  return t('missionsUi.remainderGeneric', { n: left });
}

function dailyClaimFollowUpToast() {
  const left = claimableDailyTasks();
  if (left.length > 0) {
    const xp = left.reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
    UI.toast(left.length === 1
      ? t('toast.followUp1', { xp })
      : t('toast.followUpN', { n: left.length, xp }), 2600);
    return;
  }
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    UI.toast(t('toast.followUpBonus'), 2800);
  }
}

function achievementProgressFrac(ach) {
  const s = save;
  switch (ach.id) {
    case 'first_win': return Math.min(s.stats.advWins || 0, 1);
    case 'lv10': return Math.min(s.lvl, 10) / 10;
    case 'dex10': return Math.min(Object.keys(s.dex || {}).length, 10) / 10;
    case 'dexFull': return Object.keys(s.dex || {}).length / SPECIES_ORDER.length;
    case 'dex100': {
      let n = 0;
      for (const v of Object.values(s.dex || {})) n += v || 0;
      return Math.min(n, 100) / 100;
    }
    case 'dexHalf': return Object.keys(s.dex || {}).length / Math.ceil(SPECIES_ORDER.length / 2);
    case 'dexTiers': return dexRarityTierCount() / 4;
    case 'dexMythic': {
      for (const id of Object.keys(s.dex || {})) {
        const sp = SPECIES[id];
        if (sp && sp.rarity === 'mythic') return 1;
      }
      return 0;
    }
    case 'train5': return Math.min(s.trainWins, 5) / 5;
    case 'wall100': return Math.min(s.bestWall, 100) / 100;
    case 'combo8': return Math.min(s.stats.maxCombo || 0, 8) / 8;
    case 'finisher10': return Math.min(s.stats.weaponFinishers || 0, 10) / 10;
    case 'finisher1': return Math.min(s.stats.weaponFinishers || 0, 1);
    case 'finisher50': return Math.min(s.stats.weaponFinishers || 0, 50) / 50;
    case 'weaponMaster25': {
      let best = 0;
      for (const m of Object.values(s.weaponMastery || {})) best = Math.max(best, m.finishers || 0);
      return Math.min(best, 25) / 25;
    }
    case 'streak10': return Math.min(s.stats.maxKillStreak || 0, 10) / 10;
    case 'trainCombo10': return Math.min(s.stats.trainMaxCombo || 0, 10) / 10;
    case 'lv50': return Math.min(s.unlocked, 50) / 50;
    case 'daily7': return Math.min(s.stats.dailyBonusCount || 0, 7) / 7;
    case 'vs5': return Math.min(s.stats.vsMatches || 0, 5) / 5;
    case 'vs_roster': return Math.min((s.vsPlayedIds || []).length, 10) / 10;
    case 'saga_icons': {
      const need = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
      const played = s.vsPlayedIds || [];
      return need.filter(id => played.includes(id)).length / need.length;
    }
    default: return 0;
  }
}

function achievementProgressHint(ach) {
  const s = save;
  switch (ach.id) {
    case 'first_win': return `${Math.min(s.stats.advWins || 0, 1)}/1 level-win`;
    case 'lv10': return `Lv ${Math.min(s.lvl, 10)}/10`;
    case 'dex10': return `${Object.keys(s.dex || {}).length}/10 soorten`;
    case 'dexFull': return `${Object.keys(s.dex || {}).length}/${SPECIES_ORDER.length} soorten`;
    case 'dex100': {
      let n = 0;
      for (const v of Object.values(s.dex || {})) n += v || 0;
      return `${Math.min(n, 100)}/100 kills in boek`;
    }
    case 'dexHalf': return `${Object.keys(s.dex || {}).length}/${Math.ceil(SPECIES_ORDER.length / 2)} soorten`;
    case 'dexTiers': return `${dexRarityTierCount()}/4 rariteiten`;
    case 'train5': return `${Math.min(s.trainWins, 5)}/5 training-wins`;
    case 'wall100': return `${Math.min(s.bestWall, 100)}/100 muur-score`;
    case 'combo8': return `×${Math.min(s.stats.maxCombo || 0, 8)}/8 combo`;
    case 'finisher10': return `${Math.min(s.stats.weaponFinishers || 0, 10)}/10 finishers`;
    case 'finisher1': return `${Math.min(s.stats.weaponFinishers || 0, 1)}/1 finisher`;
    case 'finisher50': return `${Math.min(s.stats.weaponFinishers || 0, 50)}/50 finishers`;
    case 'weaponMaster25': {
      let best = 0;
      for (const m of Object.values(s.weaponMastery || {})) best = Math.max(best, m.finishers || 0);
      return `${Math.min(best, 25)}/25 op één wapen`;
    }
    case 'streak10': return `streak ×${Math.min(s.stats.maxKillStreak || 0, 10)}/10`;
    case 'trainCombo10': return `train ×${Math.min(s.stats.trainMaxCombo || 0, 10)}/10`;
    case 'lv50': return `Unlock Lv ${Math.min(s.unlocked, 50)}/50`;
    case 'daily7': return `${Math.min(s.stats.dailyBonusCount || 0, 7)}/7 dagbonussen`;
    case 'vs5': return `${Math.min(s.stats.vsMatches || 0, 5)}/5 duels`;
    case 'vs_roster': return `${(s.vsPlayedIds || []).length}/10 vechters gespeeld`;
    case 'saga_icons': {
      const need = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
      const played = s.vsPlayedIds || [];
      const n = need.filter(id => played.includes(id)).length;
      return `${n}/7 legends in 2P`;
    }
    default: return '';
  }
}

function dailyStreakLine() {
  const n = save.stats.dailyBonusCount || 0;
  if (n <= 0) return '';
  return n >= 7 ? t('missionsUi.streakDone', { n }) : t('missionsUi.streakLine', { n });
}

function dailyStatusLine() {
  ensureDaily();
  const tasks = save.daily.tasks;
  const done = tasks.filter(t => t.done).length;
  const claimed = tasks.filter(t => t.claimed).length;
  const ready = tasks.filter(t => t.done && !t.claimed).length;
  const achN = Object.keys(save.achievements).length;
  const streak = dailyStreakLine();
  const streakBit = streak ? ` · ${streak}` : '';
  if (save.daily.dayBonusClaimed) {
    return t('missionsUi.statusDone', {
      streak: streakBit,
      ach: achN,
      total: ACHIEVEMENTS.length,
    });
  }
  const step = dailyFlowStep();
  const stepHint = step === 2 ? t('missionsUi.statusStep2')
    : (step === 3 ? t('missionsUi.statusStep3') : t('missionsUi.statusStep1'));
  const pendingXp = dailyUnclaimedXp();
  if (ready > 0) {
    return t('missionsUi.statusReady', {
      hint: stepHint, xp: pendingXp, done, streak: streakBit,
    });
  }
  if (claimed === 3) {
    return t('missionsUi.statusAllClaimed', {
      hint: stepHint, streak: streakBit, ach: achN, total: ACHIEVEMENTS.length,
    });
  }
  return t('missionsUi.statusDefault', {
    hint: stepHint, done, xp: dailyPotentialXp(), streak: streakBit,
  });
}

function unlockAchievement(id) {
  if (save.achievements[id]) return;
  save.achievements[id] = todayKey();
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  persist();
  AudioSys.sfx('newmonster');
  UI.toast(t('toast.achievementUnlock', { name: ach ? achLabel(ach, 'name') : id }), 4000);
  if (UI.renderMissions) UI.renderMissions();
}

function checkAchievements() {
  for (const ach of ACHIEVEMENTS) {
    if (!save.achievements[ach.id] && ach.test(save)) unlockAchievement(ach.id);
  }
}

function bumpStat(key, n) {
  save.stats[key] = (save.stats[key] || 0) + (n || 1);
  persist();
}

function trackCombo(n) {
  if (n > (save.stats.maxCombo || 0)) save.stats.maxCombo = n;
  bumpDaily('comboReach', n);
}

function trackKillStreak(n) {
  if (n > (save.stats.maxKillStreak || 0)) {
    save.stats.maxKillStreak = n;
    persist();
    checkAchievements();
  }
}

function trackTrainCombo(n) {
  if (n > (save.stats.trainMaxCombo || 0)) {
    save.stats.trainMaxCombo = n;
    persist();
    checkAchievements();
  }
}

function saveSanitizeNotes(before, after) {
  const notes = [];
  if (!before || !after) return notes;
  const num = (v) => Math.floor(Number(v) || 0);
  if (num(before.lvl) !== after.lvl) notes.push(`Lv ${num(before.lvl)}→${after.lvl}`);
  if (num(before.unlocked) !== after.unlocked) notes.push(`unlock ${num(before.unlocked)}→${after.unlocked}`);
  if (before.weapon !== after.weapon) notes.push('wapen reset');
  if (before.style !== after.style) notes.push('stijl reset');
  const stripCount = Object.keys(before).filter(k => !(k in DEFAULT_SAVE) && k !== '_exportMeta').length;
  if (stripCount) notes.push(`${stripCount} onbekend veld verwijderd`);
  const badDex = Object.keys(before.dex || {}).filter(k => !SPECIES[k]).length;
  if (badDex) notes.push(`${badDex} ongeldige dex-entry`);
  const badSummon = Object.keys(before.summons || {}).filter(k => {
    const w = WEAPONS.find(x => x.id === k);
    const v = before.summons[k];
    return !w || (v !== 'epic' && v !== 'legendary');
  }).length;
  if (badSummon) notes.push(`${badSummon} ongeldige summon`);
  if (typeof PET_BY_ID !== 'undefined') {
    const badPet = Object.keys(before.pets || {}).filter(k => !PET_BY_ID[k]).length;
    if (badPet) notes.push(`${badPet} ongeldige pet`);
    if (before.activePet && before.activePet !== after.activePet) notes.push('actieve pet reset');
  }
  if (typeof EGG_BY_ID !== 'undefined') {
    const badEgg = Object.keys(before.eggPets || {}).filter(k => !EGG_BY_ID[k]).length;
    if (badEgg) notes.push(`${badEgg} ongeldig ei-pet`);
    if (before.activeEggPet && before.activeEggPet !== after.activeEggPet) notes.push('actief ei reset');
  }
  if (before.eggDaily && !after.eggDaily) notes.push('ei-dag reset');
  if (!Number.isFinite(Number(before.musicVol)) || !Number.isFinite(Number(before.sfxVol))) {
    notes.push('volume gecorrigeerd');
  }
  return notes;
}

function saveDriftDetail() {
  const diag = saveStorageDiagnostics();
  if (!diag.drift) return '';
  const p = readSaveJson(localStorage.getItem(SAVE_KEY));
  const b = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
  if (!p || !b) return '';
  const parts = [];
  if (p.lvl !== b.lvl) parts.push(`Lv ${p.lvl} vs backup ${b.lvl}`);
  if (p.unlocked !== b.unlocked) parts.push(`unlock ${p.unlocked} vs ${b.unlocked}`);
  const pd = Object.keys(p.dex || {}).length, bd = Object.keys(b.dex || {}).length;
  if (pd !== bd) parts.push(`boek ${pd} vs ${bd}`);
  if (typeof PET_BY_ID !== 'undefined') {
    const pp = petCountFromSave(p), bp = petCountFromSave(b);
    if (pp !== bp) parts.push(`pets ${pp} vs ${bp}`);
  }
  if (typeof EGG_BY_ID !== 'undefined') {
    const pe = eggCountFromSave(p), be = eggCountFromSave(b);
    if (pe !== be) parts.push(`ei ${pe} vs ${be}`);
  }
  if (p.style !== b.style) parts.push('stijl verschilt');
  return parts.join(' · ');
}

function saveExportSummaryLine(s) {
  const st = s || save;
  const summons = summonCountFromSave(st);
  const pets = petCountFromSave(st);
  const eggs = eggCountFromSave(st);
  let line = `Lv ${st.lvl} · unlock ${st.unlocked} · boek ${dexCountFromSave(st)} · kills ${dexTotalKillsFromSave(st)} · ${Object.keys(st.achievements || {}).length} prestaties`;
  if (summons) line += ` · ✦ ${summons} summon`;
  if (pets) line += ` · pet ${pets}`;
  if (eggs) line += ` · ei ${eggs}`;
  const pc = Math.max(0, Math.floor(Number(st.petCoins) || 0));
  if (pc) line += ` · ${pc} pet coins`;
  return line;
}

function updateSaveImportPreview(text) {
  const previewEl = document.getElementById('saveImportPreview');
  if (!previewEl) return;
  if (typeof text !== 'string' || !text.trim()) {
    previewEl.style.display = 'none';
    previewEl.textContent = '';
    previewEl.style.color = '#ffd75e';
    return;
  }
  try {
    const { save: next, meta, warnings } = previewImportSave(text);
    previewEl.style.display = 'block';
    previewEl.style.color = '#ffd75e';
    const metaLine = meta && meta.app ? ` · export v${meta.app}` : '';
    const warnLine = warnings && warnings.length ? '\n' + warnings.join(' · ') : '';
    previewEl.textContent =
      `Preview: ${saveExportSummaryLine(next)}${metaLine}.${warnLine} Import 2× om te laden.`;
  } catch (e) {
    previewEl.style.display = 'block';
    previewEl.style.color = '#ffb0b8';
    previewEl.textContent = (e && e.message) ? e.message : 'Ongeldige save-JSON';
  }
}

let savePortPreviewT = null;
function bindSavePortPreview() {
  const ta = document.getElementById('savePortText');
  if (!ta || ta.dataset.previewBound) return;
  ta.dataset.previewBound = '1';
  ta.addEventListener('input', () => {
    clearTimeout(savePortPreviewT);
    savePortPreviewT = setTimeout(() => updateSaveImportPreview(ta.value), 420);
  });
}

function formatSaveBytes(n) {
  const b = Math.max(0, Math.floor(Number(n) || 0));
  if (b < 1024) return b + ' B';
  return (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB';
}

async function promptVersionUpdateBeforeReload() {
  if (state === 'play' || state === 'pause' || state === 'result') {
    try { recoverToMenu(); } catch (_) {
      game = null;
      state = 'menu';
    }
  }
  return new Promise((resolve) => {
    UI.showVersionUpdateBeforeReload({
      hasProgress: saveHasProgress(),
      summary: saveExportSummaryLine(),
      onBackup: () => {
        if (!stashSaveForVersionUpdate()) {
          UI.toast(t('versionUpdate.stashFail'), 3600);
          resolve(false);
          return;
        }
        UI.toast(t('versionUpdate.stashOk'), 2800);
        resolve(true);
      },
      onSkip: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

async function runVersionUpdateWithSavePrompt() {
  AudioSys.init();
  AudioSys.sfx('select');
  const proceed = await promptVersionUpdateBeforeReload();
  if (!proceed) return;
  const go = () => {
    if (typeof window.forceFreshVersion === 'function') return window.forceFreshVersion();
    const u = new URL(location.href);
    u.searchParams.set('fresh', String(Date.now()));
    location.replace(u.toString());
    return Promise.resolve();
  };
  safeAsync(go(), 'forceFresh', t('versionUpdate.fail'));
}

function maybeOfferVersionUpdateSave() {
  if (!versionUpdateRestorePending()) return;
  const stash = peekVersionUpdateSave();
  if (!stash) {
    clearVersionUpdateSave();
    return;
  }
  setTimeout(() => {
    try {
      UI.showVersionUpdateRestore({
        stash,
        currentSummary: saveExportSummaryLine(),
        onUse: () => {
          if (applyVersionUpdateSave()) {
            AudioSys.sfx('win');
            UI.toast(t('versionUpdate.applied', {
              from: stash.fromApp || '?',
              to: APP_VERSION,
              summary: saveExportSummaryLine(),
            }), 4800);
          } else {
            UI.toast(t('versionUpdate.applyFail'), 3600);
          }
        },
        onSkip: () => {
          clearVersionUpdateSave();
          UI.toast(t('versionUpdate.keptCurrent'), 3200);
        },
      });
    } catch (err) {
      sfReportError('versionRestoreOffer', err);
    }
  }, 900);
}

function saveStorageDiagnostics() {
  let primaryRaw = null;
  let backupRaw = null;
  try { primaryRaw = localStorage.getItem(SAVE_KEY); } catch (_) {}
  try { backupRaw = localStorage.getItem(SAVE_BACKUP_KEY); } catch (_) {}
  const primaryBytes = primaryRaw ? primaryRaw.length : 0;
  const backupBytes = backupRaw ? backupRaw.length : 0;
  const primaryParsed = readSaveJson(primaryRaw);
  const backupParsed = readSaveJson(backupRaw);
  let stampAt = null;
  let stampBytes = null;
  try {
    const st = JSON.parse(localStorage.getItem(SAVE_STAMP_KEY) || 'null');
    if (st && typeof st === 'object') {
      stampAt = typeof st.at === 'string' ? st.at : null;
      stampBytes = Number(st.bytes) || null;
    }
  } catch (_) {}
  let drift = false;
  if (primaryParsed && backupParsed) {
    drift = (primaryParsed.lvl !== backupParsed.lvl)
      || (primaryParsed.unlocked !== backupParsed.unlocked);
  }
  const primaryCorrupt = !!(primaryRaw && primaryRaw.length > 0 && !primaryParsed);
  const backupCorrupt = !!(backupRaw && backupRaw.length > 0 && !backupParsed);
  return {
    primaryBytes,
    backupBytes,
    primaryValid: !!primaryParsed,
    backupValid: !!backupParsed,
    primaryCorrupt,
    backupCorrupt,
    drift,
    stampAt,
    stampBytes,
  };
}

function summonCountFromSave(s) {
  return Object.keys((s && s.summons) || {}).length;
}

function petCountFromSave(s) {
  if (!s || !s.pets || typeof PET_BY_ID === 'undefined') return 0;
  return Object.keys(s.pets).filter(k => PET_BY_ID[k]).length;
}

function eggCountFromSave(s) {
  if (!s || !s.eggPets || typeof EGG_BY_ID === 'undefined') return 0;
  return Object.keys(s.eggPets).filter(k => EGG_BY_ID[k]).length;
}

function saveAgeDays(stampAt) {
  if (!stampAt) return null;
  try {
    const d = new Date(stampAt);
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  } catch (_) {
    return null;
  }
}

function exportSaveJson() {
  const clean = sanitizeSave(save);
  const payload = Object.assign({}, clean, {
    _exportMeta: {
      schema: SAVE_EXPORT_SCHEMA,
      app: APP_VERSION,
      exportedAt: new Date().toISOString(),
      key: SAVE_KEY,
      backupKey: SAVE_BACKUP_KEY,
      summary: {
        lvl: clean.lvl,
        unlocked: clean.unlocked,
        dex: dexCountFromSave(clean),
        kills: dexTotalKillsFromSave(clean),
        achievements: Object.keys(clean.achievements || {}).length,
        summons: summonCountFromSave(clean),
        pets: petCountFromSave(clean),
        eggs: eggCountFromSave(clean),
        style: clean.style || 'classic',
      },
      note: 'Stickman Fighter save — plak in Instellingen → Import (2× tikken). Wissel van URL? Export vóór en import ná.',
    },
  });
  return JSON.stringify(payload, null, 2);
}

function saveHealthSummary() {
  const diag = saveStorageDiagnostics();
  let backupOk = false;
  let backupLvl = null;
  try {
    const b = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
    if (b) {
      backupOk = true;
      backupLvl = clamp(Math.floor(Number(b.lvl) || 1), 1, 500);
    }
  } catch (_) {}
  let primaryOk = false;
  try { primaryOk = !!localStorage.getItem(SAVE_KEY); } catch (_) {}
  return {
    primaryOk,
    backupOk,
    backupLvl,
    lvl: save.lvl,
    unlocked: save.unlocked,
    dex: dexCount(),
    kills: dexTotalKills(),
    primaryBytes: diag.primaryBytes,
    backupBytes: diag.backupBytes,
    primaryValid: diag.primaryValid,
    backupValid: diag.backupValid,
    primaryCorrupt: diag.primaryCorrupt,
    backupCorrupt: diag.backupCorrupt,
    drift: diag.drift,
    driftDetail: saveDriftDetail(),
    stampAt: diag.stampAt,
    summons: summonCountFromSave(save),
    pets: petCountFromSave(save),
    eggs: eggCountFromSave(save),
    exportSchema: SAVE_EXPORT_SCHEMA,
    saveAgeDays: saveAgeDays(diag.stampAt),
  };
}

function importPreviewWarnings(next, meta) {
  const lines = [];
  if (meta && meta.key && meta.key !== SAVE_KEY) {
    lines.push(`Verkeerde save-key (“${meta.key}”) — verwacht ${SAVE_KEY}`);
  } else if (!meta || !meta.key) {
    lines.push(`Geen export-key — wordt gecontroleerd tegen ${SAVE_KEY}`);
  }
  const schema = meta && Number(meta.schema);
  if (!schema || schema < SAVE_EXPORT_SCHEMA) {
    lines.push(`Oudere export-schema${schema ? ' v' + schema : ''} — wordt gemigreerd naar v${SAVE_EXPORT_SCHEMA}`);
  }
  if (meta && meta.exportedAt) {
    try {
      const d = new Date(meta.exportedAt);
      if (!Number.isNaN(d.getTime())) {
        lines.push('Export: ' + d.toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }));
      }
    } catch (_) {}
  }
  if (meta && meta.app) lines.push('App-versie export: v' + meta.app);
  if (meta && meta.summary && typeof meta.summary === 'object') {
    const s = meta.summary;
    let sum = `Export-samenvatting: Lv ${s.lvl} · unlock ${s.unlocked} · boek ${s.dex} · ${s.achievements} prestaties`;
    if (s.summons) sum += ` · ✦ ${s.summons}`;
    if (s.pets) sum += ` · pet ${s.pets}`;
    if (s.eggs) sum += ` · ei ${s.eggs}`;
    if (s.style && s.style !== 'classic') sum += ` · stijl ${s.style}`;
    lines.push(sum);
  }
  const summonN = summonCountFromSave(next);
  const curSummonN = summonCountFromSave(save);
  if (summonN > curSummonN) lines.push(`+${summonN - curSummonN} summon-wapen(s) in import`);
  else if (summonN < curSummonN) lines.push(`Minder summons dan nu (${summonN} vs ${curSummonN})`);
  const petN = petCountFromSave(next);
  const curPetN = petCountFromSave(save);
  if (petN > curPetN) lines.push(`+${petN - curPetN} dex-pet(s) in import`);
  else if (petN < curPetN) lines.push(`Minder pets dan nu (${petN} vs ${curPetN})`);
  const eggN = eggCountFromSave(next);
  const curEggN = eggCountFromSave(save);
  if (eggN > curEggN) lines.push(`+${eggN - curEggN} ei-pet(s) in import`);
  else if (eggN < curEggN) lines.push(`Minder ei-pets dan nu (${eggN} vs ${curEggN})`);
  if (next.style !== save.style) {
    lines.push(`Stijl ${save.style || 'classic'} → ${next.style || 'classic'}`);
  }
  if (next.lvl < save.lvl || next.unlocked < save.unlocked) {
    lines.push('Lager niveau/unlock dan huidige save op dit apparaat');
  } else if (next.lvl > save.lvl || next.unlocked > save.unlocked) {
    lines.push('Hogere voortgang dan huidige save — goed voor overzet');
  }
  return lines;
}

function previewImportSave(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Plak eerst save-JSON in het vak');
  if (text.length > 120000) throw new Error('Save te groot of ongeldig');
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) {
    throw new Error('Geen geldige JSON — controleer plaksel');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Ongeldige save-structuur');
  }
  const meta = parsed._exportMeta;
  delete parsed._exportMeta;
  const clean = sanitizeSave(Object.assign({}, DEFAULT_SAVE, parsed));
  clean.stats = Object.assign({}, DEFAULT_SAVE.stats, parsed.stats || {});
  clean.achievements = Object.assign({}, parsed.achievements || {});
  clean.stars = Object.assign({}, parsed.stars || {});
  clean.dex = Object.assign({}, parsed.dex || {});
  clean.summons = Object.assign({}, parsed.summons || {});
  clean.pets = Object.assign({}, parsed.pets || {});
  clean.eggPets = Object.assign({}, parsed.eggPets || {});
  if (parsed.eggDaily && typeof parsed.eggDaily === 'object') clean.eggDaily = Object.assign({}, parsed.eggDaily);
  if (typeof parsed.activePet === 'string') clean.activePet = parsed.activePet;
  if (typeof parsed.activeEggPet === 'string') clean.activeEggPet = parsed.activeEggPet;
  const final = sanitizeSave(clean);
  const warnings = importPreviewWarnings(final, meta);
  const rawMerged = Object.assign({}, DEFAULT_SAVE, parsed);
  rawMerged.stats = Object.assign({}, DEFAULT_SAVE.stats, parsed.stats || {});
  rawMerged.achievements = Object.assign({}, parsed.achievements || {});
  rawMerged.stars = Object.assign({}, parsed.stars || {});
  rawMerged.dex = Object.assign({}, parsed.dex || {});
  rawMerged.summons = Object.assign({}, parsed.summons || {});
  rawMerged.pets = Object.assign({}, parsed.pets || {});
  rawMerged.eggPets = Object.assign({}, parsed.eggPets || {});
  if (parsed.eggDaily && typeof parsed.eggDaily === 'object') rawMerged.eggDaily = Object.assign({}, parsed.eggDaily);
  if (typeof parsed.activePet === 'string') rawMerged.activePet = parsed.activePet;
  if (typeof parsed.activeEggPet === 'string') rawMerged.activeEggPet = parsed.activeEggPet;
  const repairNotes = saveSanitizeNotes(rawMerged, final);
  if (repairNotes.length) warnings.push('Reparatie: ' + repairNotes.slice(0, 3).join(' · '));
  return { save: final, meta, warnings };
}
function sfReportError(where, err, userMsg) {
  console.error('[Stickman]', where, err);
  const now = Date.now();
  if (!window.__sfErrToastT || now - window.__sfErrToastT > 4500) {
    window.__sfErrToastT = now;
    userToast(userMsg || 'Er ging iets mis — terug naar menu');
  }
}
function syncPlayLayer() {
  const el = document.getElementById('game');
  if (!el) return;
  const canvasHits = state === 'play' && !!game;
  el.style.pointerEvents = canvasHits ? 'auto' : 'none';
  el.style.visibility = canvasHits ? 'visible' : 'hidden';
  el.style.touchAction = canvasHits ? 'none' : 'manipulation';
  document.body.classList.toggle('is-playing', canvasHits);
  document.body.style.overflow = canvasHits ? 'hidden' : '';
  try { if (typeof updateNetStatus === 'function') updateNetStatus(); } catch (_) {}
}

function ensureMenuScreenActive() {
  if (state !== 'menu') return;
  const active = document.querySelector('.screen.active');
  if (!active) {
    try { UI.show('menuScreen'); } catch (_) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('menuScreen')?.classList.add('active');
      syncPlayLayer();
    }
  }
}

function dismissTunnelOverlayIfStatic() {
  const o = document.getElementById('tunnelBootOverlay');
  if (!o) return;
  o.hidden = true;
  o.setAttribute('hidden', '');
  o.style.cssText = 'display:none!important;pointer-events:none!important;visibility:hidden!important';
  try { o.remove(); } catch (_) {}
}

function recoverToMenu() {
  try {
    // Al in menu zonder game? Niet schermen wegslingeren (menu-loop fout
    // mag navigatie/scroll niet elke frame terugzetten naar hoofdmenu).
    if (state === 'menu' && !game) {
      window.__sfLoopErr = false;
      syncPlayLayer();
      ensureMenuScreenActive();
      return;
    }
    try { clearGameResultTimer(game); } catch (_) {}
    try { cancelGambleStart(); } catch (_) {}
    game = null;
    state = 'menu';
    window.__sfLoopErr = false;
    Input.dualMode = false;
    try { Input.releaseAll(); } catch (_) {}
    try { Input.layout(W, H); } catch (_) {}
    try { if (InputP2) InputP2.layout(W, H); } catch (_) {}
    document.body.classList.remove('is-playing');
    syncPlayLayer();
    try { UI.goMenu(); } catch (_) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('menuScreen')?.classList.add('active');
      const pb = document.getElementById('pauseBtn');
      if (pb) pb.classList.remove('show');
    }
    try { playMenuBgm(true); } catch (_) {}
  } catch (err) {
    console.error('[Stickman] recoverToMenu', err);
    state = 'menu';
    game = null;
    syncPlayLayer();
  }
}
function importSaveJson(text) {
  if (state === 'play' || state === 'pause') {
    try { recoverToMenu(); } catch (_) {
      game = null;
      state = 'menu';
      try { syncPlayLayer(); } catch (_) {}
    }
  }
  const { save: next, warnings } = previewImportSave(text);
  save = next;
  if (!persistOrToast('import')) throw new Error('Import gelukt maar opslaan mislukt — probeer opnieuw');
  checkAchievements();
  UI.renderMenu();
  if (UI.renderMissions) UI.renderMissions();
  if (UI.renderSettings) UI.renderSettings();
  const repair = (warnings || []).find(w => w.startsWith('Reparatie:'));
  userToast(repair
    ? `Save geïmporteerd · Lv ${save.lvl} · ${repair.replace('Reparatie: ', '')}`
    : `Save geïmporteerd · Lv ${save.lvl} · level ${save.unlocked}`, 3400);
}

function exportSaveFilename() {
  return `stickfighter-save-Lv${save.lvl}-unlock${save.unlocked}.json`;
}

function recordLastPlay(mode, opts) {
  opts = opts || {};
  const lp = { mode };
  if (mode === 'adventure') lp.level = opts.level || (game && game.level && game.level.n) || save.unlocked;
  if (mode === 'versus') { lp.p1 = opts.p1 || vsSelect.p1; lp.p2 = opts.p2 || vsSelect.p2; }
  save.lastPlay = lp;
  persist();
}

function resumeLastPlay() {
  const lp = save.lastPlay;
  if (!lp || !lp.mode) return false;
  try {
    if (lp.mode === 'adventure') {
      gokGooiStartLevel(lp.level || 1);
    } else if (lp.mode === 'versus') {
      startGame('versus', { p1: lp.p1, p2: lp.p2 });
    } else {
      startGame(lp.mode);
    }
    return true;
  } catch (err) {
    sfReportError('resumeLastPlay', err, 'Verder spelen mislukt — kies een modus');
    return false;
  }
}

function startAdventureFromGamble(skipGamble) {
  try {
    const level = pendingAdvLevel || save.unlocked || 1;
    const gamble = skipGamble ? null : lastGambleRoll;
    pendingAdvLevel = null;
    startGame('adventure', { level, gamble });
  } catch (err) {
    sfReportError('gambleStart', err, 'Avontuur starten mislukt — kies level opnieuw');
  }
}

let gokStartBusy = false;
let gokScreenTimer = null;

function cancelGambleStart() {
  if (gokScreenTimer) {
    clearTimeout(gokScreenTimer);
    gokScreenTimer = null;
  }
  gokStartBusy = false;
}

function playGambleRollSfx(g) {
  try { AudioSys.sfx('diceRoll'); } catch (_) {}
  setTimeout(() => {
    try { AudioSys.sfx('gamble'); } catch (_) {}
  }, motionReduced() ? 40 : 120);
  if (!g) return;
  const delay = motionReduced() ? 60 : 220;
  setTimeout(() => {
    try {
      if (g.outcome === 'superAlly' || g.outcome === 'ally') AudioSys.sfx('gambleWin');
      else if (g.outcome === 'superBoss' || g.outcome === 'miniBoss') AudioSys.sfx('gambleBoss');
    } catch (_) {}
  }, delay);
}

/** Instant: level-tik → dobbel-flash → vecht (geen tussen-scherm). */
function gokGooiStartLevel(n) {
  if (gokStartBusy) return;
  cancelGambleStart();
  gokStartBusy = true;
  try {
    pendingAdvLevel = n;
    AudioSys.init();
    lastGambleRoll = rollStageGamble();
    playGambleRollSfx(lastGambleRoll);
    try {
      const line = typeof gambleRollToastLine === 'function' ? gambleRollToastLine(lastGambleRoll) : '';
      if (line) UI.toast(line, motionReduced() ? 900 : 1400);
    } catch (_) {}
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    const delay = motionReduced() ? 80 : 420;
    gokScreenTimer = setTimeout(() => {
      gokScreenTimer = null;
      gokStartBusy = false;
      startAdventureFromGamble(false);
    }, delay);
  } catch (err) {
    cancelGambleStart();
    sfReportError('gokStart', err, 'Gok start mislukt — probeer opnieuw');
  }
}

function gokGooiStartFromScreen() {
  if (gokStartBusy) return;
  cancelGambleStart();
  gokStartBusy = true;
  try {
    AudioSys.init();
    lastGambleRoll = rollStageGamble();
    playGambleRollSfx(lastGambleRoll);
    UI.renderGamble(pendingAdvLevel || save.unlocked || 1);
    const sumLine = document.getElementById('gambleSumLine');
    if (sumLine) sumLine.textContent = 'START!';
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    const delay = motionReduced() ? 50 : 140;
    gokScreenTimer = setTimeout(() => {
      gokScreenTimer = null;
      gokStartBusy = false;
      startAdventureFromGamble(false);
    }, delay);
  } catch (err) {
    cancelGambleStart();
    sfReportError('gokGooi', err, 'Gok start mislukt — probeer opnieuw');
  }
}

function vsWeaponRangeFactor(w) {
  if (!w) return 0.25;
  if (typeof isThrowWeapon === 'function' && isThrowWeapon(w.id)) return 1;
  if (w.id === 'boemerang') return 0.88;
  if (w.range >= 74) return 0.72;
  if (w.range >= 58) return 0.48;
  return 0.22;
}
function vsFighterStats(entry) {
  const w = weaponById(entry.weapon);
  const hp = Math.round(100 * entry.hpMul);
  const spd = Math.round(100 * entry.spdMul);
  const dmg = Math.round(100 * entry.dmgMul);
  const crit = entry.crit != null ? entry.crit : 0.08;
  const critMul = entry.critMul != null ? entry.critMul : 1.5;
  const critPct = Math.round(crit * 100);
  const str = Math.round(Math.min(100, dmg * (w.dmg || 1) * (0.72 + crit * critMul * 0.35)));
  const rng = Math.round(Math.min(100, ((w.range || 38) / 78) * 100));
  const meleeScale = (typeof isThrowWeapon === 'function' && isThrowWeapon(w.id)) ? 0.38
    : (w.id === 'boemerang' ? 0.52 : 1);
  const meleeDps = Math.round(Math.min(100, (dmg * (w.speed || 1) * spd) / 88 * meleeScale));
  const rangeDps = Math.round(Math.min(100, (dmg * (w.speed || 1) * rng) / 72 * vsWeaponRangeFactor(w) * (0.82 + crit * 0.9)));
  let special = 'Rasengan';
  if (entry.isRobot) special = 'Robot · Chidori';
  else if (entry.special === 'chidori') special = 'Chidori';
  else if (entry.special === 'rinnegan') special = 'Rinnegan';
  const sigKey = entry.sig || 'balanced';
  const sig = VS_SIG_LABELS[sigKey] || sigKey;
  return { hp, spd, dmg, str, rng, meleeDps, rangeDps, wpn: w.name, special, critPct, sig, sigKey };
}
function vsOverallRating(s) {
  return Math.round((s.str + s.rng + s.meleeDps + s.rangeDps + s.hp * 0.35 + s.spd * 0.25) / 4.6);
}
function vsPlayedBefore(id) {
  return Array.isArray(save.vsPlayedIds) && save.vsPlayedIds.includes(id);
}
function vsUnlockedCount() {
  return VS_ROSTER.filter(vsUnlocked).length;
}
function sortVsRoster(list, mode) {
  const arr = list.slice();
  const statSort = ['hp', 'spd', 'dmg', 'str', 'rng', 'meleeDps', 'rangeDps', 'tot'];
  if (statSort.includes(mode)) {
    arr.sort((a, b) => {
      const sa = vsFighterStats(a);
      const sb = vsFighterStats(b);
      const key = mode === 'tot' ? null : mode;
      const va = key ? sa[key] : vsOverallRating(sa);
      const vb = key ? sb[key] : vsOverallRating(sb);
      const d = vb - va;
      return d !== 0 ? d : a.name.localeCompare(b.name);
    });
  } else {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  }
  return arr;
}
function vsStatBar(label, pct, color, deltaHtml) {
  const p = Math.min(100, Math.max(6, pct));
  return `<div class="vs-stat-col"><span class="vs-stat-l">${label}${deltaHtml || ''}</span>` +
    `<span class="vs-stat-track"><i style="width:${p}%;background:${color}"></i></span></div>`;
}
function vsStatDeltaTag(mine, theirs, invert) {
  const d = mine - theirs;
  if (Math.abs(d) < 3) return '';
  const better = invert ? d < 0 : d > 0;
  const sign = d > 0 ? '+' : '';
  return `<span class="vs-stat-delta${better ? ' up' : ' down'}">${sign}${d}</span>`;
}
function vsMatchupHint(s1, s2) {
  const hints = [];
  if (s1.spd >= s2.spd + 8) hints.push('P1 sneller');
  else if (s2.spd >= s1.spd + 8) hints.push('P2 sneller');
  if (s1.hp >= s2.hp + 8) hints.push('P1 tankier');
  else if (s2.hp >= s1.hp + 8) hints.push('P2 tankier');
  if (s1.dmg >= s2.dmg + 8) hints.push('P1 harder hits');
  else if (s2.dmg >= s1.dmg + 8) hints.push('P2 harder hits');
  if (s1.str >= s2.str + 8) hints.push('P1 sterker (STR)');
  else if (s2.str >= s1.str + 8) hints.push('P2 sterker (STR)');
  if (s1.rng >= s2.rng + 8) hints.push('P1 meer reach');
  else if (s2.rng >= s1.rng + 8) hints.push('P2 meer reach');
  if (s1.meleeDps >= s2.meleeDps + 8) hints.push('P1 melee DPS');
  else if (s2.meleeDps >= s1.meleeDps + 8) hints.push('P2 melee DPS');
  if (s1.rangeDps >= s2.rangeDps + 8) hints.push('P1 range DPS');
  else if (s2.rangeDps >= s1.rangeDps + 8) hints.push('P2 range DPS');
  if (s1.critPct >= s2.critPct + 3) hints.push('P1 meer crit');
  else if (s2.critPct >= s1.critPct + 3) hints.push('P2 meer crit');
  if (s1.sigKey !== s2.sigKey) hints.push(`${s1.sig.split(' ')[0]} vs ${s2.sig.split(' ')[0]}`);
  return hints.slice(0, 3).join(' · ');
}
function vsMatchupMeter(s1, s2) {
  const r1 = vsOverallRating(s1);
  const r2 = vsOverallRating(s2);
  const total = Math.max(1, r1 + r2);
  const p1pct = Math.round(r1 / total * 100);
  let label = 'Gelijk spel';
  if (p1pct >= 58) label = 'P1 licht favoriet';
  else if (p1pct <= 42) label = 'P2 licht favoriet';
  return `<div class="vs-matchup-meter" aria-hidden="true">` +
    `<span class="vs-meter-p1">P1 ${p1pct}%</span>` +
    `<span class="vs-meter-track"><i style="width:${p1pct}%"></i></span>` +
    `<span class="vs-meter-p2">P2 ${100 - p1pct}%</span></div>` +
    `<div class="vs-matchup-hint">${label} · TOT preview</div>`;
}
function charStatPreviewPair() {
  const e1 = vsRosterEntry(vsSelect.p1);
  const e2 = vsRosterEntry(vsSelect.p2);
  const hover = UI.charPreviewHoverId ? vsRosterEntry(UI.charPreviewHoverId) : null;
  if (hover && UI.charPickStep === 1) return [hover, e2, true, !vsUnlocked(hover)];
  if (hover && UI.charPickStep === 2) return [e1, hover, true, !vsUnlocked(hover)];
  return [e1, e2, false, false];
}
function vsStatPreviewHtml(e1, e2, previewing, lockedPreview) {
  const s1 = vsFighterStats(e1);
  const s2 = vsFighterStats(e2);
  const g1 = vsSagaMeta(e1.saga || 'scroll');
  const g2 = vsSagaMeta(e2.saga || 'scroll');
  const step = UI.charPickStep === 2 ? 'Stap 2 · kies P2' : 'Stap 1 · kies P1';
  const counts = vsSagaUnlockedCounts(UI.charSagaFilter || 'all');
  const next = charRosterNextUnlock();
  const prog = next
    ? ` · volgende unlock: <b>${next.name}</b> (${next.hint})`
    : ' · roster compleet!';
  const head = `<div class="vs-preview-head">${step} · ${counts.unlocked}/${counts.total} in filter · ${vsUnlockedCount()}/${VS_ROSTER.length} totaal${prog}</div>`;
  const col = (entry, s, theirs, accent, saga, flair, side, locked) => {
    const live = previewing && !locked && ((UI.charPickStep === 1 && side === 'left') || (UI.charPickStep === 2 && side === 'right'));
    const played = !locked && vsPlayedBefore(entry.id) ? '<span class="vs-played-chip">gespeeld</span>' : '';
    const lockNote = locked ? `<div class="vs-preview-lock">${SVG_LOCK_ICON} ${vsUnlockHint(entry)}</div>` : '';
    return `<div class="vs-preview-col${live ? ' preview-live' : ''}${locked ? ' preview-locked' : ''}" style="--accent:${accent}">` +
    `<div class="vs-preview-name">${entry.name}${played}${live ? ' <span class="vs-preview-tag">preview</span>' : ''}${locked ? ' <span class="vs-preview-tag locked">locked</span>' : ''}</div>` +
    lockNote +
    `<div class="vs-preview-wpn">${sagaIconSvg(saga.id)} ${saga.label} · ${s.wpn} · ${s.special}</div>` +
    `<div class="vs-preview-sig">${s.sig} · ${s.critPct}% crit</div>` +
    `<div class="vs-preview-flair">${flair}</div>` +
    `${vsStatBar('TOT', vsOverallRating(s), '#ffd75e')}` +
    `${vsStatBar('STR', s.str, '#ff9a42', locked ? '' : vsStatDeltaTag(s.str, theirs.str))}` +
    `${vsStatBar('RNG', s.rng, '#c792ff', locked ? '' : vsStatDeltaTag(s.rng, theirs.rng))}` +
    `${vsStatBar('mDPS', s.meleeDps, '#ff7a4d', locked ? '' : vsStatDeltaTag(s.meleeDps, theirs.meleeDps))}` +
    `${vsStatBar('rDPS', s.rangeDps, '#7cf5ff', locked ? '' : vsStatDeltaTag(s.rangeDps, theirs.rangeDps))}` +
    `${vsStatBar('HP', s.hp, '#6ee06e', locked ? '' : vsStatDeltaTag(s.hp, theirs.hp))}` +
    `${vsStatBar('SPD', s.spd, '#9db1e3', locked ? '' : vsStatDeltaTag(s.spd, theirs.spd))}</div>`;
  };
  const hint = lockedPreview ? 'Unlock om te kiezen — stats zijn preview' : vsMatchupHint(s1, s2);
  const meter = lockedPreview ? '' : vsMatchupMeter(s1, s2);
  return head + `<div class="vs-preview-duo">${col(e1, s1, s2, '#7cf5ff', g1, rosterFlair(e1), 'left', lockedPreview && UI.charPickStep === 1)}` +
    `<div class="vs-preview-vs">VS</div>${col(e2, s2, s1, '#ffb0b8', g2, rosterFlair(e2), 'right', lockedPreview && UI.charPickStep === 2)}</div>` +
    meter +
    (hint ? `<div class="vs-matchup-hint">${hint}</div>` : '') +
    (previewing && !lockedPreview ? '<div class="vs-matchup-hint" style="opacity:.75">Tik kaart om te kiezen · stats zijn relatief, geen dmg-tweak</div>' : '');
}
function updateCharStatPreview() {
  const statEl = document.getElementById('charStatPreview');
  if (!statEl) return;
  const [a, b, previewing, lockedPreview] = charStatPreviewPair();
  statEl.innerHTML = vsStatPreviewHtml(a, b, previewing, lockedPreview);
}

function copyPlayLink() {
  safeAsync((async () => {
    const url = await resolveSharePlayUrl();
    try {
      await navigator.clipboard.writeText(url);
      UI.toast('GitHub Pages-link gekopieerd — deel speel.html (niet de tunnel)', 3600);
    } catch (_) {
      UI.toast(url, 4500);
    }
  })(), 'copyLink', 'Link kopiëren mislukt — zie Instellingen → Deel link');
}

function sharePlayLink() {
  safeAsync((async () => {
    const url = await resolveSharePlayUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Stickman Fighter',
          text: 'Gratis stickman vechtspel — open de link, tik SPELEN (Android + iPad + PC)',
          url,
        });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      UI.toast('Pages-link gekopieerd — stuur naar vrienden (Chrome op Android)', 3600);
    } catch (_) {
      UI.toast(url, 4500);
    }
  })(), 'shareLink', 'Delen mislukt — kopieer link via Instellingen');
}

function isTunnelHostUrl(u) {
  return /\.loca\.lt\b|trycloudflare\.com\b/i.test(String(u || ''));
}

function onTunnelHost() {
  return isTunnelHostUrl(location.hostname) || /\.loca\.lt$/i.test(location.hostname);
}

function playHostKind() {
  if (location.protocol === 'file:') return 'file';
  const h = location.hostname;
  if (/\.github\.io$/i.test(h)) return 'pages';
  if (/\.netlify\.app$/i.test(h)) return 'netlify';
  if (onTunnelHost()) return 'tunnel';
  if (/^localhost$|^127\./.test(h)) return 'local';
  return 'other';
}

/** Append ?v=SW rev on speel.html share links so friends skip stale PWA cache. */
function withShareRevParam(url, rev) {
  if (!url || typeof url !== 'string') return url;
  const base = url.split('#')[0].split('?')[0];
  if (!/\/speel\.html$/i.test(base)) return url;
  const v = rev != null ? rev : (typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : 0);
  if (!v) return url;
  return base + '?v=' + v;
}

/** Canonical share/play URL — always GitHub Pages when configured; never a tunnel. */
function canonicalPagesPlayUrl(hosting) {
  const j = hosting || {};
  const candidates = [
    j.bookmarkShare,
    j.pagesSpeel,
    j.primary && String(j.primary).includes('github.io')
      ? String(j.primary).replace(/\/?$/, '/') + 'speel.html'
      : '',
    j.githubPages ? String(j.githubPages).replace(/\/?$/, '/') + 'speel.html' : '',
    j.stable && String(j.stable).includes('github.io')
      ? String(j.stable).replace(/\/?$/, '/') + 'speel.html'
      : '',
  ];
  for (const c of candidates) {
    if (c && !isTunnelHostUrl(c)) return c;
  }
  return '';
}

function firstNonTunnelHttps(liveTxt) {
  return (liveTxt || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^https:\/\//i.test(l) && !isTunnelHostUrl(l)) || '';
}

function resolveBundleLiveUrl(hosting, liveTxt) {
  const pages = canonicalPagesPlayUrl(hosting);
  if (pages) return pages;
  const fromTxt = firstNonTunnelHttps(liveTxt);
  if (fromTxt) return fromTxt;
  return pages;
}

async function loadHostingBundle() {
  const [hosting, liveTxt] = await Promise.all([
    fetch('./hosting.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
    fetch('./LIVE-LINK.txt?t=' + Date.now(), { cache: 'no-store' }).then(r => r.text()).catch(() => ''),
  ]);
  const liveUrl = resolveBundleLiveUrl(hosting, liveTxt);
  return { hosting, liveUrl, liveTxt };
}

/** Stable URL for menu/settings — Pages only (tunnel never “the” play link). */
function pickStablePlayUrl(hosting) {
  const pages = canonicalPagesPlayUrl(hosting);
  if (pages) return pages;
  const j = hosting || {};
  const fallback = j.bookmarkPages || j.stable || '';
  return isTunnelHostUrl(fallback) ? '' : fallback;
}

function githubPagesRootUrl() {
  if (!location.hostname.endsWith('.github.io')) return '';
  const seg = location.pathname.split('/').filter(Boolean)[0];
  return seg ? `${location.origin}/${seg}/` : `${location.origin}/`;
}

async function resolveSharePlayUrl() {
  const { hosting, liveUrl } = await loadHostingBundle();
  const rev = (hosting && hosting.shareCacheRev) || SW_CACHE_REV;
  let url = '';
  if (hosting && hosting.shareOnlyPages) {
    const pagesOnly = canonicalPagesPlayUrl(hosting);
    url = pagesOnly || 'https://brennyz.github.io/stickman-fighter/speel.html';
  } else {
    const pages = canonicalPagesPlayUrl(hosting);
    if (pages) url = pages;
    else {
      const gh = githubPagesRootUrl();
      if (gh) url = gh + 'speel.html';
      else if (location.hostname.endsWith('.github.io')) {
        const base = location.href.split('?')[0].split('#')[0];
        url = base.replace(/\/(ipad|index|speel)\.html$/i, '/') + 'speel.html';
      } else if (liveUrl && !isTunnelHostUrl(liveUrl)) {
        url = liveUrl.replace(/\/ipad\.html$/i, '/speel.html').replace(/\/$/, '/speel.html');
      } else if (location.protocol !== 'file:' && !onTunnelHost()) {
        const href = location.href.split('?')[0].split('#')[0];
        url = href.replace(/\/ipad\.html$/i, '/').replace(/\/index\.html$/i, '/');
      } else {
        url = 'https://brennyz.github.io/stickman-fighter/speel.html';
      }
    }
  }
  return withShareRevParam(url, rev);
}

function headLiveFromPage() {
  if (location.protocol === 'file:') return '';
  return location.origin + location.pathname.replace(/\/[^/]*$/, '/');
}

function ensureTipsSeen() {
  if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
}

function modeOnboardingSeen(mode) {
  ensureTipsSeen();
  return !!(save.tipsSeen['onboard_' + mode] || save.tipsSeen['mode_' + mode]);
}

const ONBOARD_MODES = [
  { id: 'adventure', label: 'Avontuur' },
  { id: 'training', label: 'Training' },
  { id: 'wall', label: 'Muur' },
  { id: 'versus', label: '2 spelers' },
  { id: 'coinrun', label: 'Mats' },
];

function onboardingProgress() {
  const seen = ONBOARD_MODES.filter(m => modeOnboardingSeen(m.id)).length;
  return { seen, total: ONBOARD_MODES.length };
}

function nextUntriedMode() {
  return ONBOARD_MODES.find(m => !modeOnboardingSeen(m.id)) || null;
}

/** Eén result-tip per modus+uitkomst — geen herhaling, geen toast. */
function onceResultTip(mode, kind, tip) {
  if (!tip) return '';
  ensureTipsSeen();
  const key = 'result_' + mode + '_' + kind;
  if (save.tipsSeen[key]) return '';
  save.tipsSeen[key] = 1;
  persist();
  return tip;
}

function applyIslandOnboarding() {
  ensureTipsSeen();
  if (save.tipsSeen.islands) return;
  save.tipsSeen.islands = 1;
  persist();
}

/** Eén regel op level-scherm — geen toast (eilanden-uitleg). */
function adventureIslandHintLine() {
  ensureTipsSeen();
  if (!save.tipsSeen.islands || save.tipsSeen.islandsHint) return '';
  save.tipsSeen.islandsHint = 1;
  persist();
  return 'Eerste keer avontuur: 5×10 levels · skill gate per eiland · Meester-buff na 5× verlies op één level';
}

/** Eén hint per modus: in-gevecht regel, geen extra toast (geen stapel met welcome). */
function applyModeOnboarding(mode, g) {
  if (!g || !mode) return;
  ensureTipsSeen();
  const key = 'onboard_' + mode;
  if (save.tipsSeen[key]) return;
  save.tipsSeen[key] = 1;
  save.tipsSeen['mode_' + mode] = 1;
  save.tipsSeen['hint_' + mode] = 1;
  if (mode === 'adventure' || mode === 'training') save.tipsSeen.chakra = 1;
  if (mode === 'coinrun') save.tipsSeen.hint_coinrun = 1;
  persist();
  const touch = IS_TOUCH;
  const lines = {
    adventure: touch
      ? 'Eerste minuut: links lopen · rechts slaan · joy ↑ mik op vliegers · vol chakra = SUPER'
      : 'Eerste minuut: A/D · J/K/L · mik omhoog op vliegers · chakra vol → U',
    training: touch
      ? 'Eerste minuut: ontwijk rode laser · blokkeer dichtbij · chakra vol → SUPER'
      : 'Eerste minuut: ontwijk lasers · Shift = substitutie · chakra vol → U',
    wall: touch
      ? '60s · combo ×3/×5/×8 hints · record-tempo + projectie in HUD'
      : '60s · combo-milestones · voor/achter record-tempo · 5s countdown',
    versus: touch
      ? 'Eerste minuut: P1 links · P2 rechts · liggend iPad werkt het best'
      : 'Eerste minuut: P1 WASD+JKL · P2 pijltjes+1-5 · best-of-3',
    coinrun: touch
      ? '45s munten · joy ↑ mik · roze vlieger = +3 · max 3 shuriken snel'
      : 'Munten pakken · joy ↑ = hoger mikken · max 3 shuriken snel',
  };
  g.modeHintLine = lines[mode] || lines.adventure;
  g.hint = 8;
}

function maybeWelcomeToast() {
  ensureTipsSeen();
  if (save.tipsSeen.welcome) return;
  const prog = onboardingProgress();
  if (prog.seen > 0 || save.lvl > 1) {
    save.tipsSeen.welcome = 1;
    persist();
    return;
  }
  save.tipsSeen.welcome = 1;
  persist();
  setTimeout(() => {
    if (state === 'play') return;
    userToast(t('toast.welcome'), 3800);
  }, 2800);
}

/** Level-pacing v1.14.3: iets rustiger — +15% vroeg, oplopend tot +50% vanaf ~Lv 18. */
const xpNeed = (lvl) => {
  const base = 60 + (lvl - 1) * 40;
  const pace = 1.15 + Math.min(0.35, (lvl - 1) * 0.02);
  return Math.round(base * pace / 5) * 5;
};
const dexCount = () => Object.keys(save.dex).length;
function dexCountFromSave(s) {
  return Object.keys((s && s.dex) || {}).length;
}
function dexRarityTierCount() {
  return dexRarityTierCountFromSave(save);
}
function dexRarityTierCountFromSave(s) {
  const tiers = new Set();
  for (const id of Object.keys((s && s.dex) || {})) {
    const sp = SPECIES[id];
    if (sp && sp.rarity) tiers.add(sp.rarity);
  }
  return tiers.size;
}
function dexRarityBreakdown() {
  const counts = {};
  for (const id of Object.keys(RARITIES)) counts[id] = 0;
  for (const id of Object.keys(save.dex || {})) {
    const sp = SPECIES[id];
    if (sp && counts[sp.rarity] != null) counts[sp.rarity]++;
  }
  return counts;
}
function dexRarityTotals() {
  const counts = {};
  for (const id of Object.keys(RARITIES)) counts[id] = 0;
  for (const id of SPECIES_ORDER) {
    const sp = SPECIES[id];
    if (sp && counts[sp.rarity] != null) counts[sp.rarity]++;
  }
  return counts;
}
const DEX_ACH_IDS = ['dex10', 'dexHalf', 'dexTiers', 'dex100', 'dexMythic', 'dexFull'];
function dexNextAchievementHtml() {
  let best = null, bestFrac = -1;
  for (const id of DEX_ACH_IDS) {
    if (save.achievements[id]) continue;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) continue;
    const frac = achievementProgressFrac(ach);
    if (frac >= 1) continue;
    if (frac > bestFrac) { bestFrac = frac; best = ach; }
  }
  if (!best) return '';
  const pct = Math.min(100, Math.round(bestFrac * 100));
  const hint = achievementProgressHint(best);
  return `<div class="dex-ach-next" style="margin-top:10px;padding:8px 10px;border-radius:12px;background:rgba(255,215,94,.06);border:1px solid rgba(255,215,94,.2)">` +
    `<div style="font-size:11px;font-weight:800;color:#ffd75e;margin-bottom:4px">Volgende prestatie · ${best.name}</div>` +
    `<div style="font-size:12px;opacity:.85">${best.desc}${hint ? ' · ' + hint : ''}</div>` +
    `<div class="xpline" style="margin-top:6px;height:6px"><div style="width:${pct}%"></div></div></div>`;
}
function dexSortedIds(rarityFilter, typeFilter, sortKey) {
  let ids = SPECIES_ORDER.filter(id => {
    const sp = SPECIES[id];
    if (rarityFilter !== 'all' && sp.rarity !== rarityFilter) return false;
    if (typeFilter !== 'all' && sp.type !== typeFilter) return false;
    return true;
  });
  if (sortKey === 'rarity') {
    ids.sort((a, b) => {
      const ra = rarityOf(SPECIES[a].rarity).order;
      const rb = rarityOf(SPECIES[b].rarity).order;
      if (ra !== rb) return rb - ra;
      return SPECIES_ORDER.indexOf(a) - SPECIES_ORDER.indexOf(b);
    });
  } else if (sortKey === 'unlock') {
    ids.sort((a, b) => (UNLOCK_AT[a] || 999) - (UNLOCK_AT[b] || 999));
  } else if (sortKey === 'kills') {
    ids.sort((a, b) => {
      const ka = save.dex[a] || 0, kb = save.dex[b] || 0;
      if (ka && kb) return kb - ka;
      if (ka) return -1;
      if (kb) return 1;
      return (UNLOCK_AT[a] || 999) - (UNLOCK_AT[b] || 999);
    });
  }
  return ids;
}
function dexTopKillId() {
  let topId = null, topN = 0;
  for (const id of Object.keys(save.dex || {})) {
    const n = save.dex[id] || 0;
    if (n > topN) { topN = n; topId = id; }
  }
  return topN >= 3 ? topId : null;
}
function weaponUnlockedCount() {
  let n = 0;
  for (const w of WEAPONS) if (weaponUnlockedByLevel(w)) n++;
  return n;
}
function weaponAdventureUsableCount() {
  let n = 0;
  for (const w of WEAPONS) if (weaponUsableNow(w)) n++;
  return n;
}
function weaponRarityBreakdown() {
  const counts = {};
  for (const id of Object.keys(RARITIES)) counts[id] = 0;
  for (const w of WEAPONS) {
    if (weaponUnlockedByLevel(w) && counts[w.rarity] != null) counts[w.rarity]++;
  }
  return counts;
}
function dexCosmeticProgressLines() {
  const out = [];
  const half = Math.ceil(SPECIES_ORDER.length / 2);
  const checks = [
    { styleId: 'crystal', cur: dexRarityTierCount(), goal: 4, label: 'rariteiten', name: 'Kristallijn' },
    { styleId: 'tome', cur: dexCount(), goal: half, label: 'soorten', name: 'Boekmeester' },
    { styleId: 'hunter', cur: dexTotalKills(), goal: 75, label: 'kills', name: 'Jagerlook' },
  ];
  for (const c of checks) {
    const st = STYLES.find(s => s.id === c.styleId);
    if (!st || styleUnlocked(st)) continue;
    out.push(c);
  }
  return out;
}
const dexTotalKills = () => {
  let n = 0;
  for (const id of Object.keys(save.dex)) n += save.dex[id] || 0;
  return n;
};
function dexTotalKillsFromSave(s) {
  let n = 0;
  for (const id of Object.keys((s && s.dex) || {})) n += s.dex[id] || 0;
  return n;
}
const MONSTER_TYPE_LABEL = {
  hop: 'Hups', fly: 'Vlieg', charge: 'Charge', shoot: 'Schiet', tank: 'Tank', dragon: 'Draak',
};
const DEX_REF_STATS = { hp: 420, dmg: 28, speed: 150 };
function dexMiniStat(label, val, max, color) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return `<span class="dex-mini-stat" title="${label} ${val}"><span class="dex-mini-l">${label}</span>` +
    `<span class="dex-mini-track"><i style="width:${pct}%;background:${color}"></i></span></span>`;
}
function dexHpBonus() {
  let bonus = 0;
  for (const id of Object.keys(save.dex)) {
    const sp = SPECIES[id];
    if (sp) bonus += rarityHpBonus(sp.rarity);
  }
  if (save.style === 'tome') bonus += dexCount();
  return bonus;
}
function playerStats(opts) {
  opts = opts || {};
  const mul = opts.masterBuff ? 1.2 : 1;
  return {
    maxhp: Math.round((100 + (save.lvl - 1) * 12 + dexHpBonus()) * mul),
    dmg: Math.round((10 + (save.lvl - 1) * 2 + Math.floor(rarityOf(playerWeapon().rarity).order * 0.5)) * mul),
    speedMul: mul,
  };
}

