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
      UI.safeOpen('levelScreen', () => UI.renderLevels());
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
  { id: 'vsFatality1', name: 'Afronden!', desc: 'Land een versus fatality op match-KO', icon: '💀',
    test: s => (s.stats.vsFatalities || 0) >= 1 },
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
    if (task.progress >= def.goal) {
      task.progress = def.goal;
      task.done = true;
      changed = true;
      notifyDailyMissionDone(def.id);
    }
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
  const task = save.daily.tasks.find(x => x.id === taskId);
  const def = dailyDef(taskId);
  if (!task || !def || !task.done || task.claimed) return 0;
  const snap = { xp: save.xp, lvl: save.lvl, claimed: task.claimed, intro: save.missionsIntroSeen };
  task.claimed = true;
  grantMetaXP(def.xp, { deferPersist: true });
  if (!save.missionsIntroSeen) {
    save.missionsIntroSeen = true;
  }
  if (!opts.silent) {
    AudioSys.sfx('bonus');
    const leftClaims = save.daily.tasks.filter(x => !x.claimed).length;
    const path = leftClaims === 0
      ? t('toast.claimPathBonus')
      : (leftClaims === 1
        ? t('toast.claimPath1')
        : t('toast.claimPathN', { n: leftClaims }));
    UI.toast(t('toast.claimXp', { xp: def.xp, text: dailyText(taskId) }) + ' · ' + path, 2800);
  }
  if (!persistOrToast('missie-claim')) {
    task.claimed = snap.claimed;
    save.xp = snap.xp;
    save.lvl = snap.lvl;
    save.missionsIntroSeen = snap.intro;
    return 0;
  }
  UI.renderMenu();
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
  let claimed = 0;
  for (const task of ready) {
    const xp = claimDailyTask(task.id, { silent: true, skipRefresh: true });
    if (xp > 0) {
      total += xp;
      claimed++;
    }
  }
  if (claimed === 0) {
    UI.toast(t('toast.noMissionReady'), 2400);
    return;
  }
  if (claimed === ready.length && !save.missionsIntroSeen) save.missionsIntroSeen = true;
  AudioSys.sfx('bonus');
  if (!persistOrToast('claim-all')) return;
  checkDailyAllBonus();
  UI.renderMissions();
  UI.renderMenu();
  const leftClaims = save.daily.tasks.filter(x => !x.claimed).length;
  const path = leftClaims === 0
    ? t('toast.claimPathBonus')
    : (leftClaims === 1
      ? t('toast.claimPath1')
      : t('toast.claimPathN', { n: leftClaims }));
  UI.toast((claimed === 1
    ? t('toast.claimBatch1', { total })
    : t('toast.claimBatchN', { n: claimed, total })) + ' · ' + path, 3400);
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
  const snap = {
    xp: save.xp,
    lvl: save.lvl,
    dayBonusClaimed: save.daily.dayBonusClaimed,
    dailyBonusCount: save.stats.dailyBonusCount || 0,
  };
  save.daily.dayBonusClaimed = true;
  save.stats.dailyBonusCount = snap.dailyBonusCount + 1;
  grantMetaXP(80, { deferPersist: true });
  AudioSys.sfx('win');
  if (!persistOrToast('dagbonus')) {
    save.daily.dayBonusClaimed = snap.dayBonusClaimed;
    save.stats.dailyBonusCount = snap.dailyBonusCount;
    save.xp = snap.xp;
    save.lvl = snap.lvl;
    return;
  }
  UI.renderMenu();
  checkAchievements();
  UI.renderMissions();
  UI.renderMenu();
  const n = save.stats.dailyBonusCount || 0;
  const streakBit = n >= 7
    ? t('toast.dayBonusStreakDone', { n })
    : t('toast.dayBonusStreak', { n, left: Math.max(0, 7 - n) });
  UI.toast(t('toast.dayBonusDone') + ' · ' + streakBit, 3600);
}

function grantMetaXP(n, opts) {
  opts = opts || {};
  save.xp += n;
  while (save.xp >= xpNeed(save.lvl)) {
    save.xp -= xpNeed(save.lvl);
    save.lvl++;
    AudioSys.sfx('levelup');
  }
  if (!opts.deferPersist) {
    persistOrToast('XP');
    UI.renderMenu();
  }
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
    const xp = left.reduce((n, task) => n + (dailyDef(task.id)?.xp || 0), 0);
    UI.toast(left.length === 1
      ? t('toast.followUp1', { xp })
      : t('toast.followUpN', { n: left.length, xp }), 2600);
    return;
  }
  if (save.daily.tasks.every(task => task.claimed) && !save.daily.dayBonusClaimed) {
    UI.toast(t('toast.followUpBonus'), 2800);
    return;
  }
  if (save.daily.dayBonusClaimed) {
    UI.toast(t('toast.followUpDone', { reset: dailyResetCountdown() }), 2600);
  }
}

/** d13 c4: korte claim-pad regel voor kaarten (naar dagbonus). */
function dailyClaimPathHint(claimedN, readyN) {
  const afterThis = claimedN + 1;
  if (afterThis >= 3) return t('missionsUi.claimPathOpensBonus');
  const left = 3 - afterThis;
  return left === 1
    ? t('missionsUi.claimPathAfter1')
    : t('missionsUi.claimPathAfterN', { n: left });
}

/** d13 c5: geen toast-stack midden in gevecht — floater in play, toast in menu. */
function notifyDailyMissionDone(taskId) {
  const text = dailyText(taskId);
  const msg = t('toast.missionDone', { text });
  if (state === 'play' && game && typeof game.floater === 'function') {
    try {
      const short = t('missionsUi.missionDoneFloater', { text });
      game.floater(typeof W !== 'undefined' ? W * 0.5 : 400, 72, short, '#ffd75e', 13, 'hud');
    } catch (_) {
      UI.toast(msg, 2400);
    }
    return;
  }
  UI.toast(msg, 2800);
}

function achievementPlayTarget(ach) {
  if (!ach) return null;
  switch (ach.id) {
    case 'first_win':
    case 'combo8':
    case 'streak10':
    case 'finisher1':
    case 'finisher10':
    case 'finisher50':
    case 'weaponMaster25':
    case 'dex10':
    case 'dexFull':
    case 'dex100':
    case 'dexHalf':
    case 'dexTiers':
    case 'dexMythic':
    case 'lv10':
    case 'lv50':
      return { mode: 'adventure' };
    case 'train5':
    case 'trainCombo10':
      return { mode: 'training' };
    case 'wall100':
      return { mode: 'wall' };
    case 'vs5':
    case 'vsFatality1':
    case 'vs_roster':
    case 'saga_icons':
      return { mode: 'versus' };
    default:
      return null;
  }
}

function goAchievementPlayTarget(ach) {
  const target = achievementPlayTarget(ach);
  if (!target) return;
  try {
    AudioSys.init();
    AudioSys.sfx('select');
    if (target.mode === 'adventure') {
      UI.safeOpen('levelScreen', () => UI.renderLevels());
    } else if (target.mode === 'training') {
      startGame('training');
    } else if (target.mode === 'wall') {
      startGame('wall');
    } else if (target.mode === 'versus') {
      UI.charPickStep = 1;
      UI.safeOpen('charSelectScreen', () => UI.renderCharSelect());
    }
  } catch (err) {
    sfReportError('achPlay/' + (ach && ach.id), err, 'Kon modus niet openen — kies handmatig in menu');
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
    case 'vsFatality1': return Math.min(s.stats.vsFatalities || 0, 1);
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
    case 'vsFatality1': return `${Math.min(s.stats.vsFatalities || 0, 1)}/1 fatality`;
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

function dailyEarnedXpToday() {
  ensureDaily();
  let xp = save.daily.tasks.filter(t => t.claimed).reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
  if (save.daily.dayBonusClaimed) xp += 80;
  return xp;
}

function dailyResetCountdown() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ms = Math.max(0, midnight - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h <= 0 && m <= 1) return t('missionsUi.resetSoon');
  if (h <= 0) return t('missionsUi.resetMinutes', { m });
  if (m <= 0) return t('missionsUi.resetHoursOnly', { h });
  return t('missionsUi.resetHours', { h, m });
}

function dailyNextActionLine() {
  ensureDaily();
  const step = dailyFlowStep();
  if (step === 0) return t('missionsUi.nextDone', { reset: dailyResetCountdown() });
  if (step === 2) {
    const ready = claimableDailyTasks();
    const xp = ready.reduce((n, task) => n + (dailyDef(task.id)?.xp || 0), 0);
    if (ready.length === 1) {
      return t('missionsUi.nextClaim1', { text: dailyText(ready[0].id), xp });
    }
    return t('missionsUi.nextClaimN', { n: ready.length, xp });
  }
  if (step === 3) return t('missionsUi.nextBonus');
  let best = null;
  let bestPct = -1;
  for (const task of save.daily.tasks) {
    if (task.done || task.claimed) continue;
    const def = dailyDef(task.id);
    if (!def) continue;
    const pct = task.progress / def.goal;
    if (pct > bestPct) { bestPct = pct; best = task; }
  }
  if (!best) return t('missionsUi.nextPlayGeneric');
  const def = dailyDef(best.id);
  const target = DAILY_PLAY_TARGETS[best.id];
  const mode = target ? dailyModeLabel(target.mode) : '';
  const remainder = dailyTaskRemainderText(best, def);
  return t('missionsUi.nextPlay', {
    text: dailyText(best.id),
    mode,
    remainder: remainder ? ` · ${remainder}` : '',
  });
}

function nearestAchievement() {
  let best = null;
  let bestFrac = -1;
  for (const ach of ACHIEVEMENTS) {
    if (save.achievements[ach.id]) continue;
    const frac = achievementProgressFrac(ach);
    if (frac > bestFrac) { bestFrac = frac; best = ach; }
  }
  if (!best || bestFrac < 0.2) return null;
  return { ach: best, frac: bestFrac, hint: achievementProgressHint(best) };
}

function dailyMenuChipLine() {
  ensureDaily();
  if (save.daily.dayBonusClaimed) return '';
  const bonusReady = save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed;
  if (bonusReady) return t('ui.menuMissionBonus');
  const ready = claimableDailyTasks().length;
  if (ready > 0) return t('ui.menuMissionClaim', { xp: dailyUnclaimedXp() });
  const done = save.daily.tasks.filter(t => t.done).length;
  const claimed = save.daily.tasks.filter(t => t.claimed).length;
  if (done === 0) return t('ui.menuMissionStart');
  return t('ui.menuMissionProgress', { done, claimed });
}

function unlockAchievement(id) {
  if (save.achievements[id]) return;
  save.achievements[id] = todayKey();
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  persist();
  try { AudioSys.sfx('newmonster'); } catch (_) {}
  try { UI.toast(t('toast.achievementUnlock', { name: ach ? achLabel(ach, 'name') : id }), 4000); } catch (_) {}
  // Nooit missions-DOM rebuilden midden in een gevecht
  try {
    if (state === 'menu' && UI.renderMissions) UI.renderMissions();
  } catch (_) {}
}

function checkAchievements() {
  try {
    for (const ach of ACHIEVEMENTS) {
      try {
        if (!save.achievements[ach.id] && ach.test(save)) unlockAchievement(ach.id);
      } catch (err) {
        try { sfReportError('ach/' + (ach && ach.id), err); } catch (_) {}
      }
    }
  } catch (_) {}
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
  if (typeof countSkillUpgradeLevels === 'function') {
    const skB = countSkillUpgradeLevels(before);
    const skA = countSkillUpgradeLevels(after);
    if (skA < skB) notes.push(`skill-upgrades ${skB}→${skA} Lv`);
  }
  if (typeof countItemUpgradeLevels === 'function') {
    const itB = countItemUpgradeLevels(before);
    const itA = countItemUpgradeLevels(after);
    if (itA < itB) notes.push(`item-upgrades ${itB}→${itA} Lv`);
  }
  return notes;
}

function saveDriftDetail() {
  const diag = saveStorageDiagnostics();
  if (!diag.drift) return '';
  let p = null, b = null;
  try {
    p = readSaveJson(localStorage.getItem(SAVE_KEY));
    b = readSaveJson(localStorage.getItem(SAVE_BACKUP_KEY));
  } catch (_) { return ''; }
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

/* ---------- Run-buit (naast XP) — overzicht in pauze + resultaat ---------- */
function createRunLoot() {
  return {
    summons: [],
    dex: [],
    pets: [],
    eggs: [],
    pickups: { heal: 0, rage: 0, chakra: 0, shield: 0 },
    petCoins: 0,
    hpBonus: 0,
    levelUps: 0,
    weapons: [],
    finishers: 0,
  };
}

function noteRunLootSummon(loot, weaponId, tier) {
  if (!loot) return;
  loot.summons.push({ id: weaponId, tier: tier || 'epic' });
}

function noteRunLootDex(loot, sp, hpBonus) {
  if (!loot || !sp) return;
  loot.dex.push({ name: sp.name, rarity: sp.rarity });
  loot.hpBonus += Math.max(0, Math.floor(Number(hpBonus) || 0));
}

function noteRunLootPet(loot, name) {
  if (!loot || !name) return;
  loot.pets.push({ name: String(name).slice(0, 32) });
}

function noteRunLootEgg(loot, name, duplicate) {
  if (!loot || !name) return;
  loot.eggs.push({ name: String(name).slice(0, 32), duplicate: !!duplicate });
}

function noteRunLootPickup(loot, kind) {
  if (!loot || !kind || !loot.pickups) return;
  if (loot.pickups[kind] != null) loot.pickups[kind]++;
}

function noteRunLootPetCoins(loot, n) {
  if (!loot) return;
  loot.petCoins += Math.max(0, Math.floor(Number(n) || 0));
}

function noteRunLootFinisher(loot) {
  if (!loot) return;
  loot.finishers++;
}

function noteRunLootLevelUp(loot, newLvl) {
  if (!loot) return;
  loot.levelUps++;
  const w = WEAPONS.find(x => x.unlock === newLvl);
  if (w) loot.weapons.push(w.id);
}

function runLootHasItems(loot) {
  if (!loot) return false;
  if (loot.summons.length || loot.dex.length || loot.pets.length || loot.eggs.length) return true;
  if (loot.petCoins > 0 || loot.hpBonus > 0 || loot.levelUps > 0 || loot.weapons.length) return true;
  if (loot.finishers > 0) return true;
  const pk = loot.pickups || {};
  return (pk.heal || 0) + (pk.rage || 0) + (pk.chakra || 0) + (pk.shield || 0) > 0;
}

function runLootSummaryShort(loot) {
  if (!runLootHasItems(loot)) return '';
  const parts = [];
  if (loot.summons.length) parts.push(`✦${loot.summons.length}`);
  if (loot.dex.length) parts.push(`📖${loot.dex.length}`);
  if (loot.pets.length) parts.push(`🐾${loot.pets.length}`);
  if (loot.eggs.length) parts.push(`🥚${loot.eggs.length}`);
  const pk = loot.pickups || {};
  const pickN = (pk.heal || 0) + (pk.rage || 0) + (pk.chakra || 0) + (pk.shield || 0);
  if (pickN) parts.push(`💊${pickN}`);
  if (loot.finishers) parts.push(`③${loot.finishers}`);
  if (loot.levelUps) parts.push(`↑${loot.levelUps}`);
  if (loot.petCoins) parts.push(`🪙${loot.petCoins}`);
  return parts.join(' · ');
}

function escRunLootHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatRunLootHtml(loot, mode) {
  if (!runLootHasItems(loot)) return '';
  const rows = [];
  const push = (ico, text, color) => {
    rows.push(`<div class="run-loot-row"><span class="run-loot-ico">${ico}</span>` +
      `<span class="run-loot-txt"${color ? ` style="color:${escRunLootHtml(color)}"` : ''}>${escRunLootHtml(text)}</span></div>`);
  };
  for (const s of loot.summons) {
    const w = weaponById(s.id);
    const rar = rarityOf(s.tier);
    push('✦', t('runLoot.summonLine', { name: weaponLabel(w), rar: rar.name }), rar.color);
  }
  for (const d of loot.dex) {
    const col = (typeof rarityOf === 'function' && d.rarity) ? rarityOf(d.rarity).color : '#7cf5ff';
    push('📖', t('runLoot.dexLine', { name: d.name, rar: rarityLabel(d.rarity) }), col);
  }
  if (loot.hpBonus > 0) {
    push('❤', t('runLoot.hpBonusLine', { n: loot.hpBonus }), '#6ee06e');
  }
  for (const p of loot.pets) {
    push('🐾', t('runLoot.petLine', { name: p.name }), '#7cf5ff');
  }
  for (const e of loot.eggs) {
    push('🥚', e.duplicate ? t('runLoot.eggDupLine', { name: e.name }) : t('runLoot.eggLine', { name: e.name }), '#ffd75e');
  }
  const pk = loot.pickups || {};
  if (pk.heal) push('💚', t('runLoot.pickupLine', { kind: t('pickup.heal'), n: pk.heal }), '#6ee06e');
  if (pk.rage) push('🔥', t('runLoot.pickupLine', { kind: t('pickup.rage'), n: pk.rage }), '#ff7a4d');
  if (pk.chakra) push('🌀', t('runLoot.pickupLine', { kind: t('pickup.chakra'), n: pk.chakra }), '#7cf5ff');
  if (pk.shield) push('🛡', t('runLoot.pickupLine', { kind: t('pickup.shield'), n: pk.shield }), '#9fd8ff');
  if (loot.finishers) push('③', t('runLoot.finishersLine', { n: loot.finishers }), '#ffb830');
  if (loot.levelUps) {
    push('↑', t('runLoot.levelUpLine', { n: loot.levelUps }), '#ffd75e');
    for (const wid of loot.weapons) {
      push('⚔', t('runLoot.weaponLine', { name: weaponLabel(weaponById(wid)) }), '#c792ff');
    }
  }
  if (loot.petCoins) push('🪙', t('runLoot.petCoinsLine', { n: loot.petCoins }), '#ffd75e');
  if (!rows.length) return '';
  const head = mode === 'adventure' ? t('runLoot.headAdv') : t('runLoot.head');
  return `<div class="run-loot-head">${escRunLootHtml(head)}</div><div class="run-loot-lines">${rows.join('')}</div>`;
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

function openSaveImportFilePicker() {
  const input = document.getElementById('saveImportFile');
  if (!input) return false;
  try { input.value = ''; } catch (_) {}
  input.click();
  return true;
}

function applySaveImportText(text, sourceLabel) {
  const ta = document.getElementById('savePortText');
  if (!ta) return false;
  ta.value = text;
  window.__sfImportConfirm = false;
  updateSaveImportPreview(text);
  if (sourceLabel) {
    userToast(`Save geladen uit ${sourceLabel} — tik Import voor preview`, 3200);
  }
  return true;
}

function readSaveImportFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('Geen bestand gekozen')); return; }
    if (file.size > 120000) { reject(new Error('Save-bestand te groot (>120 KB)')); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Bestand lezen mislukt'));
    reader.readAsText(file);
  });
}

function bindSaveImportFile() {
  const input = document.getElementById('saveImportFile');
  if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    safeAsync((async () => {
      const text = await readSaveImportFile(file);
      if (!text.trim()) throw new Error('Bestand is leeg');
      applySaveImportText(text, file.name || 'bestand');
      AudioSys.sfx('select');
    })(), 'importSaveFile', 'Importbestand lezen mislukt');
    try { input.value = ''; } catch (_) {}
  });
}

function runImportSaveClick() {
  const ta = document.getElementById('savePortText');
  const previewEl = document.getElementById('saveImportPreview');
  if (!ta || !ta.value.trim()) {
    if (openSaveImportFilePicker()) return;
    userToast('Kies een exportbestand of plak save-JSON in het vak', 2800);
    return;
  }
  try {
    previewImportSave(ta.value);
    if (!window.__sfImportConfirm) {
      window.__sfImportConfirm = true;
      updateSaveImportPreview(ta.value);
      UI.toast('Import-preview — tik Import nogmaals om te laden', 3600);
      setTimeout(() => { window.__sfImportConfirm = false; }, 8000);
      return;
    }
    window.__sfImportConfirm = false;
    if (previewEl) { previewEl.style.display = 'none'; previewEl.textContent = ''; }
    importSaveJson(ta.value);
    AudioSys.sfx('win');
  } catch (e) {
    window.__sfImportConfirm = false;
    if (previewEl) { previewEl.style.display = 'none'; previewEl.textContent = ''; }
    UI.toast((e && e.message) ? e.message : 'Ongeldige save — controleer JSON', 3200);
  }
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
    drift = saveProgressScore(primaryParsed) !== saveProgressScore(backupParsed);
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
    // Default mag NOOIT "terug naar menu" beloven — fight blijft vaak staan
    userToast(userMsg || 'Hiccup — spel gaat door');
  }
}

/** Na update-hiccup: input/Kets niet laten hangen — gevecht moet door kunnen. */
function recoverFightHiccup(g) {
  if (!g) return;
  try {
    g.inputLocked = !!g.over;
    g.ketsbamChargeT = 0;
    g.ketsbamShow = false;
    g.ketsbamBuildT = 0;
    g.ketsbamBuildProg = 0;
  } catch (_) {}
}
/** Tijdens gevecht: strip .screen.active — ochtend-aanpak: geen !important display-kills. */
function clearScreensForPlay() {
  document.querySelectorAll('.screen.active').forEach((s) => s.classList.remove('active'));
  if (typeof UI !== 'undefined' && UI.screens) {
    for (const sid of UI.screens) {
      document.getElementById(sid)?.classList.remove('active');
    }
  }
}

/**
 * CANONIEKE play-laag (ochtend-route — NIET “nuclear lids” terugzetten).
 *
 * Contract:
 * 1. Menu/collections = .screen.active (CSS display:flex). Canvas visibility:hidden.
 * 2. Play = state=play + game + body.is-playing; canvas visibility:visible; geen .screen.active.
 * 3. Dobbel-flash leeft IN #levelScreen → verdwijnt met het scherm. Niet buiten .screen zetten.
 * 4. Nooit display:none !important op alle .screen zetten — dat breekt adventure/collections.
 * 5. Loop mag tijdens play/pause NOOIT drawMenuBackdrop (#151b33) tekenen.
 */
function syncPlayLayer() {
  const el = document.getElementById('game');
  if (!el) return;
  const canvasHits = state === 'play' && !!game;
  if (canvasHits) {
    clearScreensForPlay();
    try { if (typeof UI !== 'undefined' && UI.hideGambleRollFlash) UI.hideGambleRollFlash(); } catch (_) {}
  }
  el.style.pointerEvents = canvasHits ? 'auto' : 'none';
  el.style.visibility = canvasHits ? 'visible' : 'hidden';
  el.style.touchAction = canvasHits ? 'none' : 'manipulation';
  // Geen inline z-index/opacity/display — CSS body.is-playing + .screen.active is genoeg
  if (!canvasHits) {
    el.style.opacity = '';
    el.style.zIndex = '';
    el.style.display = '';
  }
  document.body.classList.toggle('is-playing', canvasHits);
  document.body.style.overflow = canvasHits ? 'hidden' : '';
  try {
    const pb = document.getElementById('pauseBtn');
    if (pb) pb.classList.toggle('show', !!(canvasHits && state === 'play' && game && !game.over));
  } catch (_) {}
  try { syncMenuHubStage(); } catch (_) {}
  try { if (typeof updateNetStatus === 'function') updateNetStatus(); } catch (_) {}
}

/** Hub full-bleed stage: alleen zichtbaar op actieve menu-landing — nooit tijdens play. */
function syncMenuHubStage() {
  const menu = document.getElementById('menuScreen');
  const stage = menu && menu.querySelector ? menu.querySelector('.menu-stage') : null;
  const live = !!(typeof Perf !== 'undefined' && Perf.menuLandingVisible && Perf.menuLandingVisible());
  document.body.classList.toggle('menu-hub-live', live);
  if (!stage) return;
  stage.setAttribute('aria-hidden', 'true');
  if (live) {
    stage.hidden = false;
    stage.style.visibility = '';
    stage.style.opacity = '';
  } else {
    stage.hidden = true;
  }
}

/** ASSET-STYLE file icons: mark broken loads without killing the button. */
function hardenButtonIcons(root) {
  try {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('img[src*="assets/buttons/"]').forEach((img) => {
      if (img.dataset.sfIconHard) return;
      img.dataset.sfIconHard = '1';
      img.decoding = img.decoding || 'async';
      img.draggable = false;
      img.addEventListener('error', () => {
        img.classList.add('sf-icon-broken');
      }, { once: true });
    });
  } catch (_) {}
}

function syncPlayLayerWithoutGuard() {
  syncPlayLayer();
}

function playLayerBroken() {
  if (!(state === 'play' && game)) return false;
  if (activeScreenEl()) return true;
  if (!document.body.classList.contains('is-playing')) return true;
  const el = document.getElementById('game');
  if (!el) return true;
  try {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return true;
  } catch (_) {
    if (el.style.visibility === 'hidden') return true;
  }
  return false;
}

function forcePlayCanvasVisible(where) {
  if (!(state === 'play' && game)) return false;
  clearScreensForPlay();
  try { if (typeof UI !== 'undefined' && UI.hideGambleRollFlash) UI.hideGambleRollFlash(); } catch (_) {}
  syncPlayLayer();
  try {
    if (ctx && game && typeof game.draw === 'function') game.draw(ctx);
  } catch (_) {}
  if (where) console.warn('[Stickman] forcePlayCanvas', where);
  return true;
}

function activeScreenEl() {
  if (typeof UI !== 'undefined' && UI.screens) {
    for (const sid of UI.screens) {
      const el = document.getElementById(sid);
      if (el && el.classList.contains('active')) return el;
    }
  }
  return document.querySelector('.screen.active');
}

/** True als .screen.active ook echt zichtbare UI heeft (niet alleen blauw deksel). */
function screenLooksUsable(el) {
  if (!el) return false;
  try {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    // Geen opacity-check: fadeIn start op 0 en gaf valse "kapot" tijdens boot.
    const nodes = el.querySelectorAll(
      'button, .hub-tile, .head, h1, h2, .settings-card, .btn, .lvl, .char-card, .mode-btn, .wrow'
    );
    if (!nodes.length) return false;
    let sized = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].clientWidth > 8 && nodes[i].clientHeight > 8) sized++;
    }
    if (sized > 0) return true;
    // Boot / smoke / pre-layout (0×0): markup aanwezig → nog niet als kapot markeren
    if (el.clientWidth < 40 || el.clientHeight < 40) return true;
    // Scherm heeft formaat maar kinderen niet → leeg blauw deksel
    return false;
  } catch (_) {}
  return false;
}

function isUiVisible() {
  // Tijdens play telt een open .screen NIET als “zichtbaar” — dat IS het zwarte deksel.
  if (state === 'play' && game) {
    const el = document.getElementById('game');
    return !!(el && el.style.visibility !== 'hidden' && document.body.classList.contains('is-playing')
      && !activeScreenEl());
  }
  const active = activeScreenEl();
  if (!active) return false;
  return screenLooksUsable(active);
}

/** Dump UI/canvas state — op iPad: Safari Web Inspector of console toast. */
function sfDebugScreen(opts) {
  opts = opts || {};
  const canvas = document.getElementById('game');
  const flash = document.getElementById('levelRollFlash');
  const active = [];
  document.querySelectorAll('.screen.active').forEach((s) => active.push(s.id || '?'));
  const cs = canvas ? getComputedStyle(canvas) : null;
  const activeEl = activeScreenEl();
  const info = {
    version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?',
    sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : '?',
    state: typeof state !== 'undefined' ? state : '?',
    mode: (typeof game !== 'undefined' && game && game.mode) || null,
    isPlaying: document.body.classList.contains('is-playing'),
    activeScreens: active,
    screenUsable: screenLooksUsable(activeEl),
    playBroken: typeof playLayerBroken === 'function' ? playLayerBroken() : false,
    canvas: canvas ? {
      visibility: canvas.style.visibility || cs.visibility,
      display: canvas.style.display || cs.display,
      opacity: canvas.style.opacity || cs.opacity,
      zIndex: canvas.style.zIndex || cs.zIndex,
      pointerEvents: canvas.style.pointerEvents || cs.pointerEvents,
      w: typeof W !== 'undefined' ? W : 0,
      h: typeof H !== 'undefined' ? H : 0,
    } : null,
    rollFlash: flash ? {
      hidden: flash.hidden,
      visibleClass: flash.classList.contains('visible'),
      z: getComputedStyle(flash).zIndex,
    } : null,
    loopErr: !!window.__sfLoopErr,
  };
  console.warn('[Stickman] sfDebugScreen', info);
  const line = `v${info.version} · ${info.state}` +
    (info.mode ? `/${info.mode}` : '') +
    ` · play=${info.isPlaying ? 'Y' : 'N'}` +
    ` · screens=${active.join(',') || '—'}` +
    ` · usable=${info.screenUsable ? 'Y' : 'N'}` +
    ` · z=${info.canvas ? info.canvas.zIndex : '?'}` +
    ` · flash=${info.rollFlash && info.rollFlash.visibleClass ? 'ON' : 'off'}`;
  if (opts.toast !== false) {
    try { userToast(line, 5200); } catch (_) {
      try { UI.toast(line, 5200); } catch (__) {}
    }
  }
  if (opts.fix) {
    try {
      if (typeof UI !== 'undefined' && UI.hideGambleRollFlash) UI.hideGambleRollFlash();
      // In gevecht: canvas vrijmaken. Anders (menu/settings “blauw deksel”): hard naar menu.
      if (state === 'play' && game) {
        forcePlayCanvasVisible('sfDebugFix');
        if (typeof blackScreenGuard === 'function') blackScreenGuard('sfDebugFix');
        userToast('Canvas geforceerd zichtbaar — speel verder of tik strip → MENU', 3600);
      } else {
        recoverToMenu({ force: true });
        userToast('Menu geforceerd — settings/deksel weg', 3600);
      }
    } catch (err) {
      console.error('[Stickman] sfDebug fix', err);
      try { recoverToMenu({ force: true }); } catch (_) {}
    }
  }
  return info;
}

function sfDebugOverlayTick() {
  let el = document.getElementById('sfDebugStrip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sfDebugStrip';
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = 'position:fixed;left:4px;right:4px;bottom:4px;z-index:9999;font:11px/1.35 monospace;' +
      'background:rgba(0,0,0,.82);color:#7cf5ff;padding:8px 10px;border-radius:10px;pointer-events:auto;' +
      'max-height:32vh;overflow:auto;white-space:pre-wrap;touch-action:manipulation;' +
      'border:1px solid rgba(124,245,255,.35)';
    el.title = 'Tik → forceer hoofdmenu';
    const go = (e) => {
      try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (_) {}
      try { recoverToMenu({ force: true }); } catch (_) {
        try { sfDebugScreen({ fix: true, toast: true }); } catch (__) {}
      }
    };
    el.addEventListener('click', go, { passive: false });
    el.addEventListener('touchend', go, { passive: false });
    document.body.appendChild(el);
  }
  const d = sfDebugScreen({ toast: false });
  el.textContent = [
    `SF DEBUG v${d.version} SW${d.sw}`,
    `state=${d.state} mode=${d.mode || '—'} isPlaying=${d.isPlaying}`,
    `screens=${(d.activeScreens && d.activeScreens.join(',')) || '—'} usable=${d.screenUsable ? 'Y' : 'N'}`,
    `playBroken=${d.playBroken ? 'Y' : 'N'}`,
    d.canvas ? `canvas vis=${d.canvas.visibility} z=${d.canvas.zIndex} ${d.canvas.w}x${d.canvas.h}` : 'canvas=MISSING',
    d.rollFlash ? `flash hidden=${d.rollFlash.hidden} vis=${d.rollFlash.visibleClass}` : 'flash=—',
    'TIK DEZE STRIP → hoofdmenu  ·  __sf.debug({fix:true})',
  ].join('\n');
}

function wireSfDebugTools() {
  window.sfDebugScreen = sfDebugScreen;
  if (window.__sf) {
    window.__sf.debug = sfDebugScreen;
    window.__sf.fixPlayLayer = () => sfDebugScreen({ fix: true });
    window.__sf.goMenu = () => recoverToMenu({ force: true });
  }
  let want = false;
  try {
    want = new URLSearchParams(location.search).get('sfdebug') === '1'
      || localStorage.getItem('sf_debug_screen') === '1';
  } catch (_) {}
  if (!want) return;
  document.body.classList.add('sf-debug');
  sfDebugOverlayTick();
  if (!window.__sfDebugTimer) {
    window.__sfDebugTimer = setInterval(() => {
      try { sfDebugOverlayTick(); } catch (_) {}
    }, 800);
  }
}

/** Detecteer en herstel volledig zwart scherm (geen UI, geen canvas). */
function blackScreenGuard(where) {
  if (window.__sfBlackGuardBusy) return;
  // Dobbel-flash / Gooi & start: nooit recover — dat annuleert de timer → startscherm.
  try {
    if (typeof gamblePending === 'function' && gamblePending()) return;
  } catch (_) {}
  // Play met game: altijd canvas vrijmaken van UI-deksel / wees-pauseBtn
  if (state === 'play' && game) {
    if (playLayerBroken()) {
      window.__sfBlackGuardBusy = true;
      try {
        console.warn('[Stickman] play cover guard:', where || '?');
        forcePlayCanvasVisible(where || 'blackGuard');
      } finally {
        window.__sfBlackGuardBusy = false;
      }
    }
    return;
  }
  if (isUiVisible()) return;
  window.__sfBlackGuardBusy = true;
  try {
    console.warn('[Stickman] black screen guard:', where || '?', 'state=', state,
      'active=', activeScreenEl() && activeScreenEl().id);
    if (state === 'play') {
      if (game?.tideBattleActive) {
        try { clearTideBattleState(game, { restoreMusic: true }); } catch (_) {
          try { cancelTideBattleMusicPending(game); } catch (_) {}
        }
      }
      state = 'menu';
      game = null;
    }
    // Actief maar leeg/onzichtbaar scherm (bv. settings blauw deksel) → hard menu
    try { recoverToMenu({ force: true }); } catch (_) {
      ensureVisibleScreen();
      if (!isUiVisible()) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('menuScreen')?.classList.add('active');
        syncPlayLayerWithoutGuard();
      }
    }
    if (!window.__sfBlackGuardToast || Date.now() - window.__sfBlackGuardToast > 5000) {
      window.__sfBlackGuardToast = Date.now();
      userToast('Scherm hersteld — tik opnieuw als iets hapert', 3800);
    }
  } finally {
    window.__sfBlackGuardBusy = false;
  }
}

function ensureMenuScreenActive() {
  if (state !== 'menu') return;
  try {
    if (typeof gamblePending === 'function' && gamblePending()) return;
  } catch (_) {}
  const active = activeScreenEl();
  if (active && screenLooksUsable(active)) {
    // Gezond submenu (settings/missies/…) mag blijven — alleen kapot deksel forceren
    if (active.id === 'menuScreen') return;
    return;
  }
  try { UI.show('menuScreen'); } catch (_) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('menuScreen')?.classList.add('active');
    syncPlayLayerWithoutGuard();
  }
}

/** Voorkom zwart scherm wanneer geen .screen.active (menu/pauze/result). */
function ensureVisibleScreen() {
  if (isUiVisible()) return;
  if (state === 'play') {
    if (game) {
      syncPlayLayerWithoutGuard();
      return;
    }
    state = 'menu';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('menuScreen')?.classList.add('active');
    syncPlayLayerWithoutGuard();
    return;
  }
  if (state === 'pause') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('pauseScreen')?.classList.add('active');
    syncPlayLayerWithoutGuard();
    return;
  }
  if (state === 'result') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (document.getElementById('resultScreen')) {
      document.getElementById('resultScreen').classList.add('active');
    } else {
      state = 'menu';
      document.getElementById('menuScreen')?.classList.add('active');
    }
    syncPlayLayerWithoutGuard();
    return;
  }
  ensureMenuScreenActive();
}

/** Veilig resultaat na gevecht — voorkomt ReferenceError + zwart scherm. */
function scheduleGameResult(gameRef, delayMs, showFn) {
  if (!gameRef || typeof showFn !== 'function') return;
  const token = (gameRef._resultToken || 0) + 1;
  gameRef._resultToken = token;
  gameRef._pendingResult = true;
  setTimeout(() => {
    safeUiAction(() => {
      if (!gameRef || gameRef._resultToken !== token) return;
      // Nieuw gevecht gestart → oude timer negeren (ook na over)
      if (game && game !== gameRef) return;
      // Menu = expliciete exit (pauze→stop, home, result→menu) — geen vertraagd resultaat
      if (state === 'menu') return;
      gameRef._pendingResult = false;
      showFn();
    }, 'scheduleGameResult', 'Resultaat laden mislukt — tik Menu of Opnieuw');
  }, Math.max(0, delayMs || 0));
}

function dismissTunnelOverlayIfStatic() {
  const o = document.getElementById('tunnelBootOverlay');
  if (!o) return;
  o.hidden = true;
  o.setAttribute('hidden', '');
  o.style.cssText = 'display:none!important;pointer-events:none!important;visibility:hidden!important';
  try { o.remove(); } catch (_) {}
}

function recoverToMenu(opts) {
  opts = opts || {};
  let force = !!opts.force;
  try {
    cancelGambleStart();
    // Al in menu zonder game? Alleen vroeg returnen als UI echt bruikbaar is —
    // anders blijf je steken op settingsScreen met alleen het blauwe deksel.
    if (state === 'menu' && !game && !force) {
      window.__sfLoopErr = false;
      syncPlayLayer();
      const active = activeScreenEl();
      if (active && screenLooksUsable(active)) return;
      force = true;
    }
    if (force && state === 'menu' && !game) {
      window.__sfLoopErr = false;
      document.body.classList.remove('is-playing');
      syncPlayLayer();
      try {
        if (typeof UI !== 'undefined' && UI.goMenu) UI.goMenu();
        else {
          document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
          document.getElementById('menuScreen')?.classList.add('active');
        }
      } catch (_) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('menuScreen')?.classList.add('active');
      }
      try { playMenuBgm(true); } catch (_) {}
      ensureVisibleScreen();
      return;
    }
    if (game && game.tideBattleActive) {
      try { clearTideBattleState(game, { restoreMusic: true }); } catch (_) {
        try { cancelTideBattleMusicPending(game); } catch (_) {}
        game.tideBattleActive = false;
        game.tideBattleBossId = null;
        game.tideBattleMon = null;
        game.tideBattlePrevSong = null;
      }
    }
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
    ensureVisibleScreen();
  } catch (err) {
    console.error('[Stickman] recoverToMenu', err);
    sfReportError('recoverToMenu', err, 'Herstel mislukt — herlaad de pagina als menu vastzit');
    state = 'menu';
    game = null;
    syncPlayLayer();
    try {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('menuScreen')?.classList.add('active');
    } catch (_) {}
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
    // Busy pas vrijgeven via cancel ná startGame (startGame roept cancel zelf)
    try { UI.hideGambleRollFlash(); } catch (_) {}
    startGame('adventure', { level, gamble });
  } catch (err) {
    cancelGambleStart();
    sfReportError('gambleStart', err, 'Avontuur starten mislukt — kies level opnieuw');
  }
}

/** Monotonic start-token — apart van SFX zodat cancel écht annuleert, niet per ongeluk. */
let gokStartBusy = false;
let gokScreenTimer = null;
let gambleStartGen = 0;
let gambleSfxGen = 0;
let gambleSfxT1 = null;
let gambleSfxT2 = null;

/** Dobbelworp loopt → geen herlaad/update mag hier tussen komen. */
function gamblePending() {
  return !!gokScreenTimer || gokStartBusy;
}

function cancelGambleStart() {
  gambleStartGen++;
  gambleSfxGen++;
  if (gambleSfxT1) { clearTimeout(gambleSfxT1); gambleSfxT1 = null; }
  if (gambleSfxT2) { clearTimeout(gambleSfxT2); gambleSfxT2 = null; }
  if (gokScreenTimer) {
    clearTimeout(gokScreenTimer);
    gokScreenTimer = null;
  }
  gokStartBusy = false;
  try { UI.hideGambleRollFlash(); } catch (_) {}
}

function playGambleRollSfx(g) {
  const gen = gambleSfxGen;
  try { AudioSys.sfx('diceRoll'); } catch (_) {}
  gambleSfxT1 = setTimeout(() => {
    gambleSfxT1 = null;
    if (gen !== gambleSfxGen) return;
    try { AudioSys.sfx('gamble'); } catch (_) {}
  }, motionReduced() ? 40 : 120);
  if (!g) return;
  const delay = motionReduced() ? 60 : 220;
  gambleSfxT2 = setTimeout(() => {
    gambleSfxT2 = null;
    if (gen !== gambleSfxGen) return;
    try {
      if (g.outcome === 'superAlly' || g.outcome === 'ally') AudioSys.sfx('gambleWin');
      else if (g.outcome === 'superBoss' || g.outcome === 'miniBoss') AudioSys.sfx('gambleBoss');
    } catch (_) {}
  }, delay);
}

/**
 * Level-tik of Continue → dobbel-flash → vecht.
 * NOOIT afbreken omdat levelScreen niet open staat (Continue komt van menu).
 * Alleen cancelGambleStart() (token bump) mag de start killen.
 */
function gokGooiStartLevel(n) {
  if (gokStartBusy) return;
  cancelGambleStart();
  gokStartBusy = true;
  const startGen = gambleStartGen;
  try {
    pendingAdvLevel = Math.max(1, Math.min(MAX_LEVEL, Number(n) || save.unlocked || 1));
    AudioSys.init();
    lastGambleRoll = rollStageGamble();
    playGambleRollSfx(lastGambleRoll);
    try {
      const line = typeof gambleRollToastLine === 'function' ? gambleRollToastLine(lastGambleRoll) : '';
      if (line) UI.toast(line, motionReduced() ? 900 : 1400);
    } catch (_) {}
    try { UI.showGambleRollFlash(lastGambleRoll); } catch (_) {}
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    const delay = motionReduced() ? 80 : 420;
    gokScreenTimer = setTimeout(() => {
      gokScreenTimer = null;
      // Alleen annuleren als gebruiker bewust cancelde (Terug / ander scherm)
      if (startGen !== gambleStartGen) { gokStartBusy = false; return; }
      if (state === 'play' && game) { gokStartBusy = false; return; }
      try { UI.hideGambleRollFlash(); } catch (_) {}
      try {
        startAdventureFromGamble(false);
      } catch (err) {
        cancelGambleStart();
        sfReportError('gokStart/timer', err, t('toast.errGambleStart'));
      }
    }, delay);
  } catch (err) {
    cancelGambleStart();
    sfReportError('gokStart', err, t('toast.errGambleStart'));
  }
}

function gokGooiStartFromScreen() {
  if (gokStartBusy) return;
  cancelGambleStart();
  gokStartBusy = true;
  const startGen = gambleStartGen;
  try {
    if (pendingAdvLevel == null) pendingAdvLevel = save.unlocked || 1;
    AudioSys.init();
    lastGambleRoll = rollStageGamble();
    playGambleRollSfx(lastGambleRoll);
    try { UI.renderGamble(pendingAdvLevel || save.unlocked || 1); } catch (_) {}
    const sumLine = document.getElementById('gambleSumLine');
    if (sumLine) sumLine.textContent = t('ui.gambleGoStart');
    try { UI.showGambleRollFlash(lastGambleRoll); } catch (_) {}
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    const delay = motionReduced() ? 50 : 140;
    gokScreenTimer = setTimeout(() => {
      gokScreenTimer = null;
      if (startGen !== gambleStartGen) { gokStartBusy = false; return; }
      if (state === 'play' && game) { gokStartBusy = false; return; }
      try { UI.hideGambleRollFlash(); } catch (_) {}
      try {
        startAdventureFromGamble(false);
      } catch (err) {
        cancelGambleStart();
        sfReportError('gokGooi/timer', err, t('toast.errGambleStart'));
      }
    }, delay);
  } catch (err) {
    cancelGambleStart();
    sfReportError('gokGooi', err, t('toast.errGambleStart'));
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

/** Effective cache-bust rev — never below live SW (hosting.json shareCacheRev can lag). */
function shareCacheRevFor(hosting) {
  const fromJson = Number(hosting && hosting.shareCacheRev) || 0;
  const live = typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : 0;
  return Math.max(fromJson, live);
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
  const rev = shareCacheRevFor(hosting);
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
  if (!save.tipsSeen || typeof save.tipsSeen !== 'object' || Array.isArray(save.tipsSeen)) {
    save.tipsSeen = typeof sanitizeTipsSeen === 'function' ? sanitizeTipsSeen(save.tipsSeen) : {};
  }
}

function modeOnboardingSeen(mode) {
  ensureTipsSeen();
  return !!(save.tipsSeen['onboard_' + mode] || save.tipsSeen['mode_' + mode]);
}

const ONBOARD_MODE_IDS = ['adventure', 'training', 'wall', 'versus', 'coinrun'];

function onboardingProgress() {
  const seen = ONBOARD_MODE_IDS.filter((id) => modeOnboardingSeen(id)).length;
  return { seen, total: ONBOARD_MODE_IDS.length };
}

function nextUntriedMode() {
  const id = ONBOARD_MODE_IDS.find((mid) => !modeOnboardingSeen(mid));
  if (!id) return null;
  return { id, label: dailyModeLabel(id) };
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
  return t('ui.islandFirstHint');
}

/** Eerste-minuut regel per modus — gedeeld door HUD-hint, Tips-scherm en help-chips. */
function modeFirstMinuteLine(mode) {
  const touch = IS_TOUCH;
  const key = 'ui.firstMinute' + (mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : 'Adventure');
  const localized = typeof t === 'function' ? t(key) : '';
  if (localized && localized !== key) return localized;
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
  return lines[mode] || lines.adventure;
}

/** Eén keer Ketsbam-uitleg — geen toast (avontuur ontsnapping). */
function ketsbamOnboardHintLine() {
  ensureTipsSeen();
  if (save.tipsSeen.ketsbamOnboard) return '';
  const key = IS_TOUCH ? 'ui.ketsbamOnboardTouch' : 'ui.ketsbamOnboardKb';
  const line = typeof t === 'function' ? t(key) : '';
  if (line && line !== key) return line;
  return IS_TOUCH
    ? 'Omringd? Tik het midden-symbool — Ketsbam-ontsnapping · 9s cooldown'
    : 'Omringd? E of midden-symbool = Ketsbam · 9s cooldown';
}

function markKetsbamOnboardSeen() {
  ensureTipsSeen();
  if (save.tipsSeen.ketsbamOnboard) return;
  save.tipsSeen.ketsbamOnboard = 1;
  persist();
}

function tideBattleOnboardPending() {
  ensureTipsSeen();
  return !save.tipsSeen.tideBattleOnboard;
}

function tideBattleOnboardHintLine(bossName) {
  const key = IS_TOUCH ? 'ui.tideBattleOnboardTouch' : 'ui.tideBattleOnboardKb';
  const line = typeof t === 'function' ? t(key, { name: bossName || 'baas' }) : '';
  if (line && line !== key) return line;
  return IS_TOUCH
    ? `Eerste Tide Battle: versla ${bossName || 'de baas'} — geen andere golven tot klaar`
    : `First Tide Battle: defeat ${bossName || 'the boss'} — waves pause until done`;
}

function markTideBattleOnboardSeen() {
  ensureTipsSeen();
  if (save.tipsSeen.tideBattleOnboard) return;
  save.tipsSeen.tideBattleOnboard = 1;
  persist();
}

/** Eén eerste-minuut regel per modus in pauze — geen toast. */
function pauseOnboardHintLine(mode) {
  if (!mode) return '';
  ensureTipsSeen();
  const key = 'pauseHint_' + mode;
  if (save.tipsSeen[key]) return '';
  save.tipsSeen[key] = 1;
  persist();
  return modeFirstMinuteLine(mode);
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
  g.modeHintLine = modeFirstMinuteLine(mode);
  g.hint = 8;
}

/** Eén regel op gok-scherm — geen toast. */
function gambleOnboardHintLine() {
  ensureTipsSeen();
  if (save.tipsSeen.gambleHint) return '';
  save.tipsSeen.gambleHint = 1;
  persist();
  const key = IS_TOUCH ? 'ui.gambleOnboardTouch' : 'ui.gambleOnboardKb';
  const line = typeof t === 'function' ? t(key) : '';
  return (line && line !== key) ? line
    : (IS_TOUCH
      ? 'Eerste keer gok: lage som = super-baas · hoge som = bondgenoot · Overslaan = normaal level'
      : 'Eerste keer: sum ≤5 super-baas · sum ≥9 ally buff · Skip = geen gok');
}

function maybeWelcomeToast() {
  ensureTipsSeen();
  if (save.tipsSeen.welcome) return;
  const prog = onboardingProgress();
  if (prog.seen > 0 || save.lvl > 1 || save.missionsIntroSeen) {
    save.tipsSeen.welcome = 1;
    persist();
    return;
  }
  save.tipsSeen.welcome = 1;
  persist();
  setTimeout(() => {
    if (state === 'play') return;
    if (onboardingProgress().seen > 0) return;
    userToast(t('toast.welcome'), 3800);
  }, 2800);
}

/** Level-pacing v1.14.3: iets rustiger — +15% vroeg, oplopend tot +50% vanaf ~Lv 18. */
const xpNeed = (lvl) => {
  const base = 60 + (lvl - 1) * 40;
  const pace = 1.15 + Math.min(0.35, (lvl - 1) * 0.02);
  return Math.round(base * pace / 5) * 5;
};
function dexBag() {
  const d = save.dex;
  return (d && typeof d === 'object' && !Array.isArray(d)) ? d : {};
}
const dexCount = () => Object.keys(dexBag()).length;
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
  const bag = dexBag();
  for (const id of Object.keys(bag)) n += bag[id] || 0;
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
  for (const id of Object.keys(dexBag())) {
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

