/* ===================== DAGELIJKSE MISSIES & PRESTATIES ================= */
const DAILY_DEFS = [
  { id: 'kills12', type: 'kills', goal: 12, xp: 45, text: 'Versla 12 monsters' },
  { id: 'advwin', type: 'advWin', goal: 1, xp: 55, text: 'Win 1 avontuur-level' },
  { id: 'wall35', type: 'wallBricks', goal: 35, xp: 40, text: 'Sloop 35 muurstenen' },
  { id: 'trainwin', type: 'trainWin', goal: 1, xp: 60, text: 'Win training vs Robot' },
  { id: 'combo5', type: 'comboReach', goal: 5, xp: 35, text: 'Bereik combo ×5' },
  { id: 'pick3', type: 'pickups', goal: 3, xp: 30, text: 'Pak 3 power-ups' },
  { id: 'boss1', type: 'bossKill', goal: 1, xp: 50, text: 'Versla 1 baas-monster' },
];
const DAILY_PLAY_HINTS = {
  kills12: 'Speel Avontuur of Training',
  advwin: 'Menu → Avontuur, win het level',
  wall35: 'Menu → Muur slopen (combo helpt)',
  trainwin: 'Menu → Training vs RabbitRobot',
  combo5: 'Avontuur: snelle combo’s op monsters',
  pick3: 'Avontuur: groen/oranje/blauwe bolletjes',
  boss1: 'Avontuur: baas aan einde van een level',
};
const DAILY_PLAY_TARGETS = {
  kills12: { mode: 'adventure', label: 'Avontuur' },
  advwin: { mode: 'adventure', label: 'Avontuur' },
  wall35: { mode: 'wall', label: 'Muur' },
  trainwin: { mode: 'training', label: 'Training' },
  combo5: { mode: 'adventure', label: 'Avontuur' },
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
  { id: 'lv50', name: 'Legende', desc: 'Unlock level 50', icon: '👑',
    test: s => s.unlocked >= 50 },
  { id: 'daily7', name: 'Vastberaden', desc: '7 dagen dagbonus geclaimd', icon: '📅',
    test: s => (s.stats.dailyBonusCount || 0) >= 7 },
  { id: 'vs5', name: 'Duelist', desc: '5× 2-speler duel gespeeld', icon: '🥊',
    test: s => (s.stats.vsMatches || 0) >= 5 },
  { id: 'vs_roster', name: 'Vol roster', desc: 'Speel met 10+ verschillende vechters (2P)', icon: '🎭',
    test: s => (s.vsPlayedIds || []).length >= 10 },
  { id: 'saga_icons', name: 'Saga-legends', desc: 'Speel 2P met alle 5 saga-icon sticks', icon: '🌟',
    test: s => {
      const need = ['kiball', 'scrollkid', 'tidecrew', 'zipcape', 'dawnlance'];
      const played = s.vsPlayedIds || [];
      return need.every(id => played.includes(id));
    } },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function ensureDaily() {
  const dk = todayKey();
  if (!save.daily || save.daily.date !== dk) {
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
  for (const t of save.daily.tasks) {
    if (t.done) continue;
    const def = dailyDef(t.id);
    if (!def || def.type !== type) continue;
    if (type === 'comboReach' || type === 'wallBricks') {
      t.progress = Math.max(t.progress, amount);
    } else {
      t.progress += amount;
    }
    if (t.progress >= def.goal) { t.progress = def.goal; t.done = true; changed = true; UI.toast(`Missie klaar: ${def.text}`, 2800); }
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
    UI.toast(`+${def.xp} XP · ${def.text}`, 2600);
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
    UI.toast('Nog geen missie klaar om te claimen', 2400);
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
    ? `+${total} XP geclaimd`
    : `${ready.length} missies · +${total} XP`, 3200);
  setTimeout(() => dailyClaimFollowUpToast(), 450);
}

function claimDailyDayBonus() {
  ensureDaily();
  if (save.daily.dayBonusClaimed) {
    UI.toast('Dagbonus al geclaimd — morgen weer 3 nieuwe', 2800);
    return;
  }
  const left = save.daily.tasks.filter(t => !t.claimed).length;
  if (left > 0) {
    UI.toast(left === 1
      ? 'Nog 1 missie claimen voor de dagbonus'
      : `Nog ${left} missies claimen voor +80 XP dagbonus`, 3000);
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
  UI.toast('Dagbonus! +80 XP · tot morgen', 3400);
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
    UI.toast('Alles geclaimd — tik Dagbonus (+80 XP)', 3500);
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
    return '<div class="mission-flow-bar mission-flow-done">✓ Dag afgerond — morgen 3 nieuwe missies (middernacht)</div>';
  }
  const mk = (n, label, sub) => {
    const active = step === n ? ' active' : '';
    const done = step > n ? ' done' : '';
    return `<span class="mission-flow-pill${active}${done}"><b>${n}</b> ${label}<small>${sub}</small></span>`;
  };
  return `<div class="mission-flow-bar">${mk(1, 'Speel', 'doe missies')}` +
    `<span class="mission-flow-arrow">→</span>${mk(2, 'Claim', '+XP')}` +
    `<span class="mission-flow-arrow">→</span>${mk(3, 'Dagbonus', '+80 XP')}</div>`;
}

function dailyTaskRemainderText(t, def) {
  if (t.done || t.claimed) return '';
  const left = def.goal - t.progress;
  if (left <= 0) return '';
  if (def.type === 'kills') return `Nog ${left} kill${left === 1 ? '' : 's'}`;
  if (def.type === 'wallBricks') return `Nog ${left} steen${left === 1 ? '' : 'en'}`;
  if (def.type === 'comboReach') return `Nog combo ×${left}`;
  if (def.type === 'pickups') return `Nog ${left} pickup${left === 1 ? '' : 's'}`;
  if (def.type === 'advWin' || def.type === 'trainWin' || def.type === 'bossKill') return 'Nog 1 run';
  return `Nog ${left}`;
}

function dailyClaimFollowUpToast() {
  const left = claimableDailyTasks();
  if (left.length > 0) {
    const xp = left.reduce((n, t) => n + (dailyDef(t.id)?.xp || 0), 0);
    UI.toast(left.length === 1
      ? `Nog 1 missie klaar om te claimen (+${xp} XP)`
      : `Nog ${left.length} missies klaar · +${xp} XP`, 2600);
    return;
  }
  if (save.daily.tasks.every(t => t.claimed) && !save.daily.dayBonusClaimed) {
    UI.toast('Stap 3: tik Dagbonus (+80 XP)', 2800);
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
    case 'lv50': return Math.min(s.unlocked, 50) / 50;
    case 'daily7': return Math.min(s.stats.dailyBonusCount || 0, 7) / 7;
    case 'vs5': return Math.min(s.stats.vsMatches || 0, 5) / 5;
    case 'vs_roster': return Math.min((s.vsPlayedIds || []).length, 10) / 10;
    case 'saga_icons': {
      const need = ['kiball', 'scrollkid', 'tidecrew', 'zipcape', 'dawnlance'];
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
    case 'lv50': return `Unlock Lv ${Math.min(s.unlocked, 50)}/50`;
    case 'daily7': return `${Math.min(s.stats.dailyBonusCount || 0, 7)}/7 dagbonussen`;
    case 'vs5': return `${Math.min(s.stats.vsMatches || 0, 5)}/5 duels`;
    case 'vs_roster': return `${(s.vsPlayedIds || []).length}/10 vechters gespeeld`;
    case 'saga_icons': {
      const need = ['kiball', 'scrollkid', 'tidecrew', 'zipcape', 'dawnlance'];
      const played = s.vsPlayedIds || [];
      const n = need.filter(id => played.includes(id)).length;
      return `${n}/5 saga-icons in 2P`;
    }
    default: return '';
  }
}

function dailyStreakLine() {
  const n = save.stats.dailyBonusCount || 0;
  if (n <= 0) return '';
  return n >= 7 ? `${n}× dagbonus · Vastberaden!` : `${n}× dagbonus streak`;
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
    return `Vandaag klaar${streakBit} · ${achN}/${ACHIEVEMENTS.length} prestaties · morgen nieuwe missies`;
  }
  const step = dailyFlowStep();
  const stepHint = step === 2 ? 'Stap 2: claim XP'
    : (step === 3 ? 'Stap 3: dagbonus +80 XP' : 'Stap 1: speel missies');
  const pendingXp = dailyUnclaimedXp();
  if (ready > 0) {
    return `${stepHint} · +${pendingXp} XP klaar · ${done}/3 gedaan${streakBit}`;
  }
  if (claimed === 3) {
    return `${stepHint} — open Missies${streakBit} · ${achN}/${ACHIEVEMENTS.length} prestaties`;
  }
  if (done > 0 && pendingXp === 0) {
    return `${stepHint} · ${done}/3 klaar · max +${dailyPotentialXp()} XP vandaag${streakBit}`;
  }
  return `${stepHint} · ${done}/3 klaar · max +${dailyPotentialXp()} XP vandaag${streakBit}`;
}

function unlockAchievement(id) {
  if (save.achievements[id]) return;
  save.achievements[id] = todayKey();
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  persist();
  AudioSys.sfx('newmonster');
  UI.toast(`Prestatie: ${ach ? ach.name : id} — bekijk bij Missies`, 4000);
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
  return parts.join(' · ');
}

function saveExportSummaryLine(s) {
  const st = s || save;
  const summons = summonCountFromSave(st);
  return `Lv ${st.lvl} · unlock ${st.unlocked} · boek ${dexCountFromSave(st)} · kills ${dexTotalKillsFromSave(st)} · ${Object.keys(st.achievements || {}).length} prestaties` +
    (summons ? ` · ✦ ${summons} summon` : '');
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
    exportSchema: SAVE_EXPORT_SCHEMA,
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
    lines.push(`Export-samenvatting: Lv ${s.lvl} · unlock ${s.unlocked} · boek ${s.dex} · ${s.achievements} prestaties`);
  }
  const summonN = summonCountFromSave(next);
  const curSummonN = summonCountFromSave(save);
  if (summonN > curSummonN) lines.push(`+${summonN - curSummonN} summon-wapen(s) in import`);
  else if (summonN < curSummonN) lines.push(`Minder summons dan nu (${summonN} vs ${curSummonN})`);
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
  const final = sanitizeSave(clean);
  const warnings = importPreviewWarnings(final, meta);
  const rawMerged = Object.assign({}, DEFAULT_SAVE, parsed);
  rawMerged.stats = Object.assign({}, DEFAULT_SAVE.stats, parsed.stats || {});
  rawMerged.achievements = Object.assign({}, parsed.achievements || {});
  rawMerged.stars = Object.assign({}, parsed.stars || {});
  rawMerged.dex = Object.assign({}, parsed.dex || {});
  rawMerged.summons = Object.assign({}, parsed.summons || {});
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
  const { save: next } = previewImportSave(text);
  save = next;
  if (!persistOrToast('import')) throw new Error('Import gelukt maar opslaan mislukt — probeer opnieuw');
  checkAchievements();
  UI.renderMenu();
  if (UI.renderMissions) UI.renderMissions();
  if (UI.renderSettings) UI.renderSettings();
  userToast(`Save geïmporteerd · Lv ${save.lvl} · level ${save.unlocked}`, 3200);
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

/** Instant: level-tik → dobbel + vecht (geen tussen-scherm). */
function gokGooiStartLevel(n) {
  if (gokStartBusy) return;
  gokStartBusy = true;
  try {
    pendingAdvLevel = n;
    AudioSys.init();
    AudioSys.sfx('select');
    lastGambleRoll = rollStageGamble();
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    gokStartBusy = false;
    startAdventureFromGamble(false);
  } catch (err) {
    gokStartBusy = false;
    sfReportError('gokStart', err, 'Gok start mislukt — probeer opnieuw');
  }
}

function gokGooiStartFromScreen() {
  if (gokStartBusy) return;
  gokStartBusy = true;
  try {
    AudioSys.init();
    AudioSys.sfx('select');
    lastGambleRoll = rollStageGamble();
    UI.renderGamble(pendingAdvLevel || save.unlocked || 1);
    const sumLine = document.getElementById('gambleSumLine');
    if (sumLine) sumLine.textContent = 'START!';
    try { AudioSys.sting('modeAdventure'); } catch (_) {}
    const delay = (save.reducedMotion || (typeof motionReduced === 'function' && motionReduced())) ? 50 : 140;
    setTimeout(() => {
      gokStartBusy = false;
      startAdventureFromGamble(false);
    }, delay);
  } catch (err) {
    gokStartBusy = false;
    sfReportError('gokGooi', err, 'Gok start mislukt — probeer opnieuw');
  }
}

function vsFighterStats(entry) {
  const hp = Math.round(100 * entry.hpMul);
  const spd = Math.round(100 * entry.spdMul);
  const dmg = Math.round(100 * entry.dmgMul);
  let special = 'Rasengan';
  if (entry.isRobot) special = 'Robot · Chidori';
  else if (entry.special === 'chidori') special = 'Chidori';
  else if (entry.special === 'rinnegan') special = 'Rinnegan';
  const critPct = Math.round((entry.crit != null ? entry.crit : 0.08) * 100);
  return { hp, spd, dmg, wpn: weaponById(entry.weapon).name, special, critPct };
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
  if (s1.critPct >= s2.critPct + 3) hints.push('P1 meer crit');
  else if (s2.critPct >= s1.critPct + 3) hints.push('P2 meer crit');
  return hints.slice(0, 2).join(' · ');
}
function charStatPreviewPair() {
  const e1 = vsRosterEntry(vsSelect.p1);
  const e2 = vsRosterEntry(vsSelect.p2);
  const hover = UI.charPreviewHoverId ? vsRosterEntry(UI.charPreviewHoverId) : null;
  if (hover && UI.charPickStep === 1 && vsUnlocked(hover)) return [hover, e2, true];
  if (hover && UI.charPickStep === 2 && vsUnlocked(hover)) return [e1, hover, true];
  return [e1, e2, false];
}
function vsStatPreviewHtml(e1, e2, previewing) {
  const s1 = vsFighterStats(e1);
  const s2 = vsFighterStats(e2);
  const g1 = vsSagaMeta(e1.saga || 'scroll');
  const g2 = vsSagaMeta(e2.saga || 'scroll');
  const col = (name, s, theirs, accent, saga, flair, side) =>
    `<div class="vs-preview-col${previewing && ((UI.charPickStep === 1 && side === 'left') || (UI.charPickStep === 2 && side === 'right')) ? ' preview-live' : ''}" style="--accent:${accent}">` +
    `<div class="vs-preview-name">${name}${previewing && ((UI.charPickStep === 1 && side === 'left') || (UI.charPickStep === 2 && side === 'right')) ? ' <span class="vs-preview-tag">preview</span>' : ''}</div>` +
    `<div class="vs-preview-wpn">${sagaIconSvg(saga.id)} ${saga.label} · ${s.wpn} · ${s.special} · ${s.critPct}% crit</div>` +
    `<div class="vs-preview-flair">${flair}</div>` +
    `${vsStatBar('HP', s.hp, '#6ee06e', vsStatDeltaTag(s.hp, theirs.hp))}` +
    `${vsStatBar('SPD', s.spd, '#7cf5ff', vsStatDeltaTag(s.spd, theirs.spd))}` +
    `${vsStatBar('DMG', s.dmg, '#ff7a4d', vsStatDeltaTag(s.dmg, theirs.dmg))}</div>`;
  const hint = vsMatchupHint(s1, s2);
  return `<div class="vs-preview-duo">${col(e1.name, s1, s2, '#7cf5ff', g1, rosterFlair(e1), 'left')}` +
    `<div class="vs-preview-vs">VS</div>${col(e2.name, s2, s1, '#ffb0b8', g2, rosterFlair(e2), 'right')}</div>` +
    (hint ? `<div class="vs-matchup-hint">${hint}</div>` : '') +
    (previewing ? '<div class="vs-matchup-hint" style="opacity:.75">Tik kaart om te kiezen · stats zijn relatief, geen dmg-tweak</div>' : '');
}
function updateCharStatPreview() {
  const statEl = document.getElementById('charStatPreview');
  if (!statEl) return;
  const [a, b, previewing] = charStatPreviewPair();
  statEl.innerHTML = vsStatPreviewHtml(a, b, previewing);
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
  const pages = canonicalPagesPlayUrl(hosting);
  if (pages) return pages;
  const gh = githubPagesRootUrl();
  if (gh) return gh + 'speel.html';
  if (location.hostname.endsWith('.github.io')) {
    const base = location.href.split('?')[0].split('#')[0];
    return base.replace(/\/(ipad|index|speel)\.html$/i, '/') + 'speel.html';
  }
  // Never share a tunnel URL — fall back to configured/non-tunnel live only
  if (liveUrl && !isTunnelHostUrl(liveUrl)) {
    return liveUrl.replace(/\/ipad\.html$/i, '/speel.html').replace(/\/$/, '/speel.html');
  }
  if (location.protocol !== 'file:' && !onTunnelHost()) {
    const href = location.href.split('?')[0].split('#')[0];
    return href.replace(/\/ipad\.html$/i, '/').replace(/\/index\.html$/i, '/');
  }
  return 'https://brennyz.github.io/stickman-fighter/speel.html';
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
    userToast('Welkom! Menu → Tips · per modus één korte hint bovenin (geen toast-stapel)', 3800);
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

