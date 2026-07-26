/* ================================= UI ================================== */
/** Long-press skip-gamble timers — bump gen on re-render / leave level screen. */
let _levelHoldGen = 0;
function bumpLevelHoldGen() { _levelHoldGen++; }
function levelHoldGenStale(gen) { return gen !== _levelHoldGen; }
function levelScreenActive() {
  const el = document.getElementById('levelScreen');
  return !!(el && el.classList.contains('active'));
}

function appendItemUpgradeButton(el, cat, id, rerender) {
  if (!itemUpgradeEligible(cat, id) || !itemCanUpgrade(cat, id)) return;
  const cost = itemUpgradeCost(cat, id);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn claim-btn';
  btn.textContent = t('ui.itemUpgrade') + ` (${cost})`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    safeUiAction(() => {
      if (!tryItemUpgrade(cat, id)) return;
      AudioSys.sfx('levelup');
      const name = itemUpgradeLabel(cat, id);
      const lv = itemUpgradeLevel(cat, id);
      UI.toast(t('toast.itemUpgraded', { name, lv, detail: itemUpgradeSummary(cat, id) }), 3200);
      rerender();
    }, 'itemUp/' + cat + '/' + id, 'Upgrade mislukt');
  });
  el.appendChild(btn);
}

function itemUpgradeCardParts(cat, id, color) {
  if (!itemUpgradeEligible(cat, id)) return { canUp: false, lv: 0, max: 0, html: '' };
  const lv = itemUpgradeLevel(cat, id);
  const max = itemUpgradeMax(cat, id);
  const shards = itemUpgradeShards(cat, id);
  const cost = itemUpgradeCost(cat, id);
  const canUp = itemCanUpgrade(cat, id);
  const now = itemUpgradeSummary(cat, id);
  const next = itemUpgradePreview(cat, id);
  const shardLine = cost != null ? t('ui.itemShards', { cur: shards, cost }) : t('ui.itemMax');
  return {
    canUp, lv, max,
    html:
      `<div class="skill-card-body"><div class="cname" style="color:${color}">${itemUpgradeLabel(cat, id)} ` +
      `<span class="rar-pill" style="color:${color};border-color:${color}">${t('ui.itemLevel', { lv, max })}</span></div>` +
      `<div class="cinfo">${shardLine}</div>` +
      `<div class="cinfo" style="opacity:.88;font-size:12px;margin-top:4px"><b>${t('ui.itemNow')}:</b> ${now}</div>` +
      (next ? `<div class="cinfo" style="opacity:.75;font-size:11px;margin-top:3px"><b>${t('ui.itemNext')}:</b> ${next}</div>` : '') +
      `</div>`,
  };
}

function drawUpgradeItemIcon(cat, id, cv) {
  if (!cv) return;
  const cc = cv.getContext('2d');
  if (!cc) return;
  cc.clearRect(0, 0, cv.width, cv.height);
  if (cat === 'weapon') {
    const w = WEAPONS.find((x) => x.id === id);
    if (!w) return;
    cc.translate(10, 40);
    cc.rotate(-0.6);
    if (w.id === 'vuist') {
      cc.strokeStyle = '#f2f5ff'; cc.lineWidth = 5; cc.lineCap = 'round';
      cc.beginPath(); cc.moveTo(2, 8); cc.lineTo(24, -6); cc.stroke();
      cc.fillStyle = '#f2f5ff'; cc.beginPath(); cc.arc(28, -9, 7, 0, TAU); cc.fill();
    } else {
      drawWeaponShape(cc, w.id, 0.2);
    }
  } else if (cat === 'pet') {
    const p = petDef(id);
    const sp = p ? SPECIES[p.speciesId] : null;
    if (!sp) return;
    cc.translate(32, 38);
    cc.scale(0.55, 0.55);
    drawMonsterArt(cc, sp, sp.size, 1.2, false, false);
  } else if (cat === 'style') {
    const st = styleById(id);
    cc.translate(36, 58);
    cc.scale(0.85, 0.85);
    const preview = new Fighter({ isPlayer: true, x: 0, y: 0, color: st.body, style: st, scale: 0.9 });
    preview.animT = 0.4;
    preview.draw(cc);
  }
}

function appendUpgradeOrbRow(el, lv, max, color) {
  const row = document.createElement('div');
  row.className = 'upgrade-orb-row';
  row.setAttribute('aria-hidden', 'true');
  const n = Math.min(Math.max(Number(max) || 0, 0), 8);
  const filled = Math.min(Math.max(Number(lv) || 0, 0), n);
  for (let i = 0; i < n; i++) {
    const orb = document.createElement('span');
    orb.className = 'upgrade-orb' + (i < filled ? ' lit' : '');
    if (i < filled) orb.style.setProperty('--orb-c', color || '#ffd75e');
    row.appendChild(orb);
  }
  el.appendChild(row);
}

function buildUpgradeItemCard(cat, id, color, rerender) {
  const card = itemUpgradeCardParts(cat, id, color);
  const el = document.createElement('div');
  el.className = 'card skill-card upgrade-polish-card' + (card.canUp ? ' claimable' : '') + (card.lv >= card.max ? ' claimed' : '');
  el.style.borderColor = color + '88';
  el.style.setProperty('--up-accent', color || '#c792ff');
  const iconWrap = document.createElement('div');
  iconWrap.className = 'upgrade-icon-orb';
  iconWrap.style.setProperty('--orb-c', color || '#c792ff');
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  drawUpgradeItemIcon(cat, id, cv);
  iconWrap.appendChild(cv);
  el.appendChild(iconWrap);
  const wrap = document.createElement('div');
  wrap.innerHTML = card.html;
  while (wrap.firstChild) el.appendChild(wrap.firstChild);
  appendUpgradeOrbRow(el, card.lv, card.max, color);
  appendItemUpgradeButton(el, cat, id, rerender);
  return el;
}

function charSelectFightReady() {
  if (!vsSelect.p1 || !vsSelect.p2) return false;
  if ((UI.charPickStep || 1) !== 2) return false;
  if (vsSelect.p1 === vsSelect.p2) return false;
  return true;
}

function scrollCharFightIntoView() {
  requestAnimationFrame(() => {
    try {
      const dock = document.getElementById('charFightDock');
      const btn = document.getElementById('btnCharFight');
      (dock || btn)?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    } catch (_) {}
  });
}

function syncCharFightBtn() {
  const fightBtn = document.getElementById('btnCharFight');
  if (!fightBtn) return;
  const ready = charSelectFightReady();
  fightBtn.classList.toggle('char-fight-ready', ready);
  fightBtn.classList.toggle('char-fight-off', !ready);
  fightBtn.setAttribute('aria-disabled', ready ? 'false' : 'true');
}

function pickVsRosterId(id) {
  try {
    const r = vsRosterEntry(id);
    if (!vsUnlocked(r)) return;
    AudioSys.sfx('select');
    UI.charPreviewHoverId = null;
    if (UI.charPickStep === 1) {
      vsSelect.p1 = id;
      if (vsSelect.p2 === id) {
        const alt = VS_ROSTER.find((x) => x.id !== id && vsUnlocked(x));
        if (alt) vsSelect.p2 = alt.id;
      }
      UI.charPickStep = 2;
    } else {
      vsSelect.p2 = id;
    }
    UI.renderCharSelect();
    if (UI.charPickStep === 2) scrollCharFightIntoView();
  } catch (err) {
    sfReportError('charPick', err, 'Vechter kiezen mislukt — tik opnieuw');
  }
}

function bindCollectionPickGrid(grid, opts) {
  if (!grid || grid.dataset.sfPickGridBound) return;
  grid.dataset.sfPickGridBound = '1';
  const sel = opts.selector;
  let lastPick = 0;
  let lastTouchAt = 0;
  const debounce = opts.debounceMs || 320;
  const fire = (card) => {
    if (!card || !card.dataset.id) return;
    const now = Date.now();
    if (now - lastPick < debounce) return;
    lastPick = now;
    opts.onPick(card, { scrollGesture: !uiTapAllowed() });
  };
  grid.addEventListener('click', (e) => {
    if (Date.now() - lastTouchAt < 480) return;
    if (typeof PointerEvent !== 'undefined' && e.pointerType && e.pointerType !== 'mouse') return;
    const card = e.target.closest(sel);
    if (!card) return;
    fire(card);
  });
  const onTouchPick = (e) => {
    const card = touchEndedOnSelector(e, sel);
    if (!card) return;
    if (e.cancelable) e.preventDefault();
    lastTouchAt = Date.now();
    fire(card);
  };
  if (typeof PointerEvent !== 'undefined') {
    grid.addEventListener('pointerup', onTouchPick);
  } else {
    grid.addEventListener('touchend', onTouchPick, { passive: false });
  }
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest(sel);
    if (!card || card.classList.contains('locked')) return;
    e.preventDefault();
    fire(card);
  });
  if (!IS_TOUCH && opts.onHover) {
    grid.addEventListener('pointerover', (e) => {
      const card = e.target.closest(sel);
      if (!card || !card.dataset.id) return;
      opts.onHover(card.dataset.id);
    });
  }
}

function bindPreviewEquipHost(host, opts) {
  if (!host || host.dataset.sfEquipHostBound) return;
  host.dataset.sfEquipHostBound = '1';
  let lastEquip = 0;
  let lastTouchAt = 0;
  const debounce = opts.debounceMs || 320;
  const runEquip = (e) => {
    const now = Date.now();
    if (now - lastEquip < debounce) return;
    if (e && !uiTapAllowed(e)) return;
    lastEquip = now;
    opts.onEquip();
  };
  host.addEventListener('click', (e) => {
    if (Date.now() - lastTouchAt < 480) return;
    if (typeof PointerEvent !== 'undefined' && e.pointerType && e.pointerType !== 'mouse') return;
    if (!e.target.closest(opts.btnSelector)) return;
    runEquip(e);
  });
  const onTouchEquip = (e) => {
    if (!e.target.closest(opts.btnSelector)) return;
    if (!uiTapAllowed(e)) return;
    if (e.cancelable) e.preventDefault();
    lastTouchAt = Date.now();
    runEquip(e);
  };
  if (typeof PointerEvent !== 'undefined') {
    host.addEventListener('pointerup', onTouchEquip);
  } else {
    host.addEventListener('touchend', onTouchEquip, { passive: false });
  }
}

function initSkillScreenChrome() {
  if (window.__sfSkillChrome) return;
  window.__sfSkillChrome = true;
  UI.skillSagaFilter = 'all';
  UI.skillBehaviorFilter = 'all';
  UI.skillSortMode = 'level';
  UI.skillPreviewId = save.skill || 'rasengan';
  UI.superPreviewId = save.super || 'ketsbam';

  const sagaBar = document.getElementById('skillSagaBar');
  if (sagaBar && !sagaBar.dataset.sfSkillSagaBound) {
    sagaBar.dataset.sfSkillSagaBound = '1';
    sagaBar.querySelectorAll('[data-saga]').forEach((btn) => {
      bindPress(btn, () => {
        AudioSys.sfx('select');
        UI.skillSagaFilter = btn.dataset.saga || 'all';
        UI.renderSkills();
      });
    });
  }
  const behBar = document.getElementById('skillBehaviorBar');
  if (behBar && !behBar.dataset.sfSkillBehBound) {
    behBar.dataset.sfSkillBehBound = '1';
    behBar.querySelectorAll('[data-behavior]').forEach((btn) => {
      bindPress(btn, () => {
        AudioSys.sfx('select');
        UI.skillBehaviorFilter = btn.dataset.behavior || 'all';
        UI.renderSkills();
      });
    });
  }
  const sortBtn = document.getElementById('btnSkillSort');
  if (sortBtn && !sortBtn.dataset.sfSkillSortBound) {
    sortBtn.dataset.sfSkillSortBound = '1';
    bindPress(sortBtn, () => {
      const modes = ['level', 'dmg', 'name'];
      const cur = UI.skillSortMode || 'level';
      UI.skillSortMode = modes[(modes.indexOf(cur) + 1) % modes.length];
      AudioSys.sfx('select');
      UI.renderSkills();
    });
  }

  bindPreviewEquipHost(document.getElementById('skillPreview'), {
    btnSelector: '#skillEquipBtn',
    onEquip: () => equipSkill(UI.skillPreviewId),
  });

  bindCollectionPickGrid(document.getElementById('skillGrid'), {
    selector: '.skill-card',
    onPick: (card, meta) => runSkillCard(card, meta),
    onHover: (id) => {
      if (UI.skillPreviewId === id) return;
      pickSkillPreview(id, true);
    },
  });

  bindCollectionPickGrid(document.getElementById('superGrid'), {
    selector: '.super-card',
    onPick: (card, meta) => runSuperCard(card, meta),
    onHover: (id) => {
      if (UI.superPreviewId === id) return;
      pickSuperPreview(id, true);
    },
  });

  bindPreviewEquipHost(document.getElementById('superPreview'), {
    btnSelector: '#superEquipBtn',
    onEquip: () => equipSuper(UI.superPreviewId),
  });
}

function equipSkill(id) {
  if (!id || !uiTapAllowed() || UI._skillEquipBusy) return;
  const sk = skillById(id);
  if (!skillUnlocked(sk)) return;
  if (save.skill === id) return;
  UI._skillEquipBusy = true;
  try {
    safeUiAction(() => {
      save.skill = id;
      if (typeof JUTSU_SKILL_IDS !== 'undefined' && JUTSU_SKILL_IDS.includes(id)) {
        save.activeJutsu = id;
      }
      if (!persistOrToast('skill')) return;
      AudioSys.sfx(skillSfxId(sk));
      UI.renderSkills();
      UI.renderMenu();
      UI.renderModeHub();
      UI.toast(t('toast.skillEquipped', { name: skillLabel(sk) }), 2200);
      UI._skillArmId = null;
    }, 'pickSkill/' + id, 'Skill kiezen mislukt');
  } finally {
    UI._skillEquipBusy = false;
  }
}

function pickSuperPreview(id, silent) {
  if (!id) return;
  UI.superPreviewId = id;
  updateSuperPreview();
  if (!silent) {
    const sp = superById(id);
    if (sp) try { AudioSys.init(); AudioSys.sfx(superSfxId(sp, 'finish')); } catch (_) {}
  }
}

function equipSuper(id) {
  if (!id || !uiTapAllowed() || UI._superEquipBusy) return;
  const sp = superById(id);
  if (!superUnlocked(sp)) return;
  if (save.super === id) return;
  UI._superEquipBusy = true;
  try {
    safeUiAction(() => {
      save.super = id;
      if (!persistOrToast('super')) return;
      AudioSys.sfx(superSfxId(sp, 'finish'));
      UI.renderSkills();
      UI.renderMenu();
      UI.renderModeHub();
      UI.toast(t('toast.superEquipped', { name: superLabel(sp) }), 2200);
      UI._superArmId = null;
    }, 'pickSuper/' + id, 'Super kiezen mislukt');
  } finally {
    UI._superEquipBusy = false;
  }
}

function playSkillPreviewSfx(id) {
  const now = Date.now();
  if (now - (UI._skillPreviewSfxT || 0) <= 420) return;
  UI._skillPreviewSfxT = now;
  try { AudioSys.init(); AudioSys.sfx(id); } catch (_) {}
}

function playSuperPreviewSfx(sp) {
  const now = Date.now();
  if (now - (UI._superPreviewSfxT || 0) <= 420) return;
  UI._superPreviewSfxT = now;
  try { AudioSys.init(); AudioSys.sfx(superSfxId(sp, 'charge')); } catch (_) {}
}

function runSuperCard(card, meta) {
  if (!card || !card.dataset.id) return;
  const id = card.dataset.id;
  const sp = superById(id);
  const now = Date.now();
  pickSuperPreview(id, true);
  if (meta && meta.scrollGesture) {
    playSuperPreviewSfx(sp);
    return;
  }
  if (!superUnlocked(sp)) {
    playSuperPreviewSfx(sp);
    return;
  }
  const armed = UI._superArmId === id && (now - (UI._superArmT || 0)) < 520;
  UI._superArmId = id;
  UI._superArmT = now;
  if (armed && save.super !== id) {
    equipSuper(id);
    return;
  }
  playSuperPreviewSfx(sp);
}

function updateSuperPreview() {
  const host = document.getElementById('superPreview');
  if (!host) return;
  const id = UI.superPreviewId || save.super || 'ketsbam';
  const sp = superById(id);
  const ok = superUnlocked(sp);
  const active = save.super === sp.id;
  let lockLine = '';
  if (!ok) {
    lockLine = superSkillGated(sp)
      ? t('ui.superIslandGate', { lvl: sp.needLvl })
      : (sp.needLvl ? t('ui.superNeedLvl', { lvl: sp.needLvl }) : superLabel(sp, 'hint'));
  }
  const foot = ok
    ? (active
      ? `<span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">${t('ui.superActive')}</span>`
      : `<button type="button" class="btn mode-btn b-skills" id="superEquipBtn" style="min-height:44px;padding:10px 18px">${t('ui.superEquipBtn')}</button>`)
    : `<span class="skill-preview-lock">${lockLine}</span>`;
  const statLabels = {
    pow: t('super.stat.pow'),
    rad: t('super.stat.rad'),
    cd: t('super.stat.cd'),
    charge: t('super.stat.charge'),
  };
  const statRows = superStatRows(sp).map(row =>
    `<div class="skill-stat-row">${statLabels[row.key] || row.key}
      <span class="skill-stat-val">${row.text}</span>
      <span class="skill-stat-track"><i style="width:${Math.round(row.pct * 100)}%;background:${sp.color}"></i></span></div>`
  ).join('');
  const tags = superTags(sp).map(tag =>
    `<span class="skill-tag" style="border-color:${sp.color}66;color:${sp.color}">${tag}</span>`
  ).join('');
  host.innerHTML =
    `<div class="skill-preview-top">` +
    `<div class="skill-preview-orb"><canvas id="superPreviewCanvas" width="88" height="88"></canvas></div>` +
    `<div class="skill-preview-body">` +
    `<div class="skill-preview-name" style="color:${sp.color}">${superLabel(sp)}</div>` +
    `<div class="skill-preview-banner">${superFinishBanner(sp)} · ${superBehaviorLabelI18n(sp)}</div>` +
    `<div class="skill-tag-row">${tags}</div>` +
    `<div class="skill-preview-tip">${superLabel(sp, 'tooltip') || superCombatLine(sp)}</div>` +
    `</div></div>` +
    `<div class="skill-stat-grid">${statRows}</div>` +
    `<div class="skill-preview-foot">${foot}</div>`;
  const cv = document.getElementById('superPreviewCanvas');
  if (cv) {
    const cc = cv.getContext('2d');
    cc.clearRect(0, 0, 88, 88);
    cc.save();
    cc.translate(44, 44);
    drawSuperIcon(cc, sp.icon || 'star', 28, sp.color, sp.color2);
    cc.restore();
  }
}

function renderSupers() {
  const sumEl = document.getElementById('superSummary');
  if (sumEl) {
    const unlocked = superUnlockedCount();
    const active = equippedSuper();
    sumEl.style.display = 'block';
    sumEl.innerHTML =
      `${t('ui.superSummaryHead')} <b>${unlocked}/${SUPERS.length}</b> · ${t('ui.superSummaryActive')} ` +
      `<b style="color:${active.color}">${superLabel(active)}</b>` +
      `<div style="margin-top:6px;font-size:12px;opacity:.85">${t('ui.superSummarySub')}</div>`;
  }
  const nextEl = document.getElementById('superNextUnlock');
  if (nextEl) {
    const next = superNextUnlock();
    if (next && !superUnlocked(next)) {
      nextEl.style.display = 'block';
      const need = Math.max(0, (next.needLvl || 1) - save.lvl);
      if (superSkillGated(next) && save.lvl >= (next.needLvl || 1)) {
        nextEl.innerHTML = t('ui.superNextIsland', { name: superLabel(next), cap: adventureWeaponCap() });
      } else if (need > 0) {
        nextEl.innerHTML = t('ui.superNextUnlock', { name: superLabel(next), lvl: next.needLvl, need });
      } else {
        nextEl.innerHTML = t('ui.superNextUnlockSoon', { name: superLabel(next), lvl: next.needLvl });
      }
    } else {
      nextEl.style.display = 'none';
      nextEl.innerHTML = '';
    }
  }
  const previewId = UI.superPreviewId || save.super || 'ketsbam';
  if (!SUPERS.some(s => s.id === previewId)) UI.superPreviewId = save.super || 'ketsbam';
  updateSuperPreview();
  const grid = document.getElementById('superGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const sp of SUPERS) {
    const ok = superUnlocked(sp);
    const el = document.createElement('div');
    el.className = 'style-card skill-card super-card' + (save.super === sp.id ? ' sel' : '') + (ok ? '' : ' locked') +
      (UI.superPreviewId === sp.id ? ' preview-hov' : '');
    el.dataset.id = sp.id;
    el.style.borderColor = ok ? sp.color + '88' : '';
    el.title = superLabel(sp, 'tooltip') || superLabel(sp, 'hint') || superLabel(sp);
    const cv = document.createElement('canvas');
    cv.width = 72; cv.height = 72;
    const cc = cv.getContext('2d');
    cc.save();
    if (!ok) cc.globalAlpha = 0.45;
    cc.translate(36, 38);
    drawSuperIcon(cc, sp.icon || 'star', 22, sp.color, sp.color2);
    cc.restore();
    el.appendChild(cv);
    const cap = document.createElement('div');
    cap.style.fontSize = '13px';
    cap.style.color = sp.color;
    cap.textContent = superLabel(sp);
    el.appendChild(cap);
    const beh = document.createElement('div');
    beh.className = 'skill-beh-badge';
    beh.style.color = sp.color;
    beh.textContent = superBehaviorLabelI18n(sp) + ' · Lv ' + (sp.needLvl || 1);
    el.appendChild(beh);
    const bonus = document.createElement('div');
    bonus.style.fontSize = '11px';
    bonus.style.fontWeight = '800';
    bonus.style.color = ok ? '#ffd75e' : '#8fa3d9';
    bonus.style.marginTop = '3px';
    bonus.textContent = superCombatLine(sp);
    bonus.style.opacity = ok ? '1' : '0.55';
    el.appendChild(bonus);
    const sub = document.createElement('div');
    sub.style.fontSize = '11px';
    sub.style.fontWeight = '600';
    sub.style.opacity = '0.75';
    sub.style.marginTop = '4px';
      sub.textContent = ok ? (save.super === sp.id ? t('ui.superActive') : t('ui.superPickHint'))
      : (superSkillGated(sp) ? t('ui.superIslandGate', { lvl: sp.needLvl }) : superLabel(sp, 'hint'));
    el.setAttribute('role', 'button');
    el.tabIndex = ok ? 0 : -1;
    el.appendChild(sub);
    grid.appendChild(el);
  }
}

function runSkillCard(card, meta) {
  if (!card || !card.dataset.id) return;
  const id = card.dataset.id;
  const sk = skillById(id);
  const now = Date.now();
  pickSkillPreview(id, true);
  if (meta && meta.scrollGesture) {
    playSkillPreviewSfx(id);
    return;
  }
  if (!skillUnlocked(sk)) {
    playSkillPreviewSfx(id);
    return;
  }
  const armed = UI._skillArmId === id && (now - (UI._skillArmT || 0)) < 520;
  UI._skillArmId = id;
  UI._skillArmT = now;
  if (armed && save.skill !== id) {
    equipSkill(id);
    return;
  }
  playSkillPreviewSfx(id);
}

function updateSkillPreview() {
  const host = document.getElementById('skillPreview');
  if (!host) return;
  const id = UI.skillPreviewId || save.skill || 'rasengan';
  const sk = skillById(id);
  const ok = skillUnlocked(sk);
  const active = save.skill === sk.id;
  const statLabels = {
    dmg: t('skill.stat.dmg'),
    wind: t('skill.stat.wind'),
    spd: t('skill.stat.spd'),
    kb: t('skill.stat.kb'),
  };
  const statRows = skillStatRows(sk).map(row =>
    `<div class="skill-stat-row">${statLabels[row.key] || row.key}
      <span class="skill-stat-val">${row.text}</span>
      <span class="skill-stat-track"><i style="width:${Math.round(row.pct * 100)}%;background:${sk.color}"></i></span></div>`
  ).join('');
  const tags = skillTags(sk).map(tag =>
    `<span class="skill-tag" style="border-color:${sk.color}66;color:${sk.color}">${tag}</span>`
  ).join('');
  let lockLine = '';
  if (!ok) {
    lockLine = skillSkillGated(sk)
      ? t('ui.skillIslandGate', { lvl: sk.needLvl })
      : (sk.needLvl ? t('ui.skillNeedLvl', { lvl: sk.needLvl }) : skillLabel(sk, 'hint'));
  }
  const foot = ok
    ? (active
      ? `<span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">${t('ui.skillActive')}</span>`
      : `<button type="button" class="btn mode-btn b-skills" id="skillEquipBtn" style="min-height:44px;padding:10px 18px">${t('ui.skillEquipBtn')}</button>`)
    : `<span class="skill-preview-lock">${lockLine}</span>`;
  host.innerHTML =
    `<div class="skill-preview-top">` +
    `<div class="skill-preview-orb"><canvas id="skillPreviewCanvas" width="88" height="88"></canvas></div>` +
    `<div class="skill-preview-body">` +
    `<div class="skill-preview-name" style="color:${sk.color}">${skillLabel(sk)}</div>` +
    `<div class="skill-preview-banner">${sk.banner || ''} · ${vsSagaMeta(sk.saga).label}</div>` +
    `<div class="skill-tag-row">${tags}</div>` +
    `<div class="skill-preview-tip">${skillLabel(sk, 'tooltip') || skillCombatLine(sk)}</div>` +
    `</div></div>` +
    `<div class="skill-stat-grid">${statRows}</div>` +
    `<div class="skill-preview-foot">${foot}</div>`;
  const cv = document.getElementById('skillPreviewCanvas');
  if (cv && typeof drawJutsuOrb === 'function') {
    const cc = cv.getContext('2d');
    cc.clearRect(0, 0, 88, 88);
    cc.translate(44, 46);
    drawJutsuOrb(cc, 0, 0, 30, performance.now() * 0.001 * 3, sk.id, ok ? 1 : 0.42);
  }
  const equipBtn = document.getElementById('skillEquipBtn');
  if (equipBtn) equipBtn.type = 'button';
}

function pickSkillPreview(id, silent) {
  if (!id) return;
  UI.skillPreviewId = id;
  updateSkillPreview();
  const grid = document.getElementById('skillGrid');
  if (grid) {
    grid.querySelectorAll('.skill-card').forEach(c => {
      c.classList.toggle('preview-hov', c.dataset.id === id);
    });
  }
  const now = Date.now();
  if (!silent && now - (UI._skillPreviewSfxT || 0) > 420) {
    UI._skillPreviewSfxT = now;
    try { AudioSys.init(); AudioSys.sfx(id); } catch (_) {}
  }
}

function initCharSelectChrome() {
  if (window.__sfCharChrome) return;
  UI.charSagaFilter = 'all';
  const grid = document.getElementById('charGrid');
  const runPick = (card) => {
    if (!card || card.classList.contains('locked') || !card.dataset.id) return;
    pickVsRosterId(card.dataset.id);
  };
  if (grid) {
    bindCollectionPickGrid(grid, {
      selector: '.char-card',
      onPick: (card, meta) => {
        if (meta && meta.scrollGesture) return;
        runPick(card);
      },
    });
    grid.addEventListener('pointerover', (e) => {
      const card = e.target.closest('.char-card');
      if (!card || !card.dataset.id) return;
      if (UI.charPreviewHoverId === card.dataset.id) return;
      UI.charPreviewHoverId = card.dataset.id;
      grid.querySelectorAll('.char-card.preview-hov').forEach(c => c.classList.remove('preview-hov'));
      if (!card.classList.contains('locked')) card.classList.add('preview-hov');
      else card.classList.add('preview-hov');
      updateCharStatPreview();
    });
    grid.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.char-card');
      if (!card || !card.dataset.id) return;
      UI.charPreviewHoverId = card.dataset.id;
      grid.querySelectorAll('.char-card.preview-hov').forEach(c => c.classList.remove('preview-hov'));
      card.classList.add('preview-hov');
      updateCharStatPreview();
    });
    grid.addEventListener('pointerleave', (e) => {
      if (e.relatedTarget && grid.contains(e.relatedTarget)) return;
      UI.charPreviewHoverId = null;
      grid.querySelectorAll('.char-card.preview-hov').forEach(c => c.classList.remove('preview-hov'));
      updateCharStatPreview();
    });
  }
  const sagaBar = document.getElementById('charSagaBar');
  if (sagaBar && !sagaBar.dataset.sfSagaBound) {
    sagaBar.dataset.sfSagaBound = '1';
    sagaBar.querySelectorAll('[data-saga]').forEach((btn) => {
      bindPress(btn, () => {
        AudioSys.sfx('select');
        UI.charSagaFilter = btn.dataset.saga || 'all';
        UI.renderCharSelect();
      });
    });
  }
  const sortBtn = document.getElementById('btnCharSort');
  if (sortBtn && !sortBtn.dataset.sfSortBound) {
    sortBtn.dataset.sfSortBound = '1';
    const sortLabels = {
      name: 'naam', tot: 'TOT', str: 'STR', rng: 'RNG', meleeDps: 'mDPS', rangeDps: 'rDPS',
      hp: 'HP', spd: 'SPD', dmg: 'DMG',
    };
    const cycleSort = () => {
      const order = ['name', 'tot', 'str', 'rng', 'meleeDps', 'rangeDps', 'hp', 'spd', 'dmg'];
      const i = order.indexOf(UI.charSortMode || 'name');
      UI.charSortMode = order[(i + 1) % order.length];
      sortBtn.textContent = 'Sort: ' + (sortLabels[UI.charSortMode] || 'naam');
      UI.renderCharSelect();
    };
    bindPress(sortBtn, () => { AudioSys.sfx('select'); cycleSort(); });
    sortBtn.textContent = 'Sort: ' + (sortLabels[UI.charSortMode || 'name'] || 'naam');
  }
  const fightBtn = document.getElementById('btnCharFight');
  bindPress(fightBtn, () => {
    if (!charSelectFightReady()) {
      if ((UI.charPickStep || 1) === 1) {
        try { UI.toast(t('toast.charPickP1First'), 2400); } catch (_) {}
      } else if (vsSelect.p1 === vsSelect.p2) {
        try { UI.toast(t('toast.charPickDifferent'), 2600); } catch (_) {}
      }
      scrollCharFightIntoView();
      return;
    }
    AudioSys.sfx('bell');
    startGame('versus', { p1: vsSelect.p1, p2: vsSelect.p2 });
  });
  const iconRow = document.getElementById('charIconRow');
  if (iconRow) {
    bindCollectionPickGrid(iconRow, {
      selector: '.char-icon-chip:not(.locked)',
      onPick: (chip, meta) => {
        if (meta && meta.scrollGesture) return;
        if (chip.dataset.id) pickVsRosterId(chip.dataset.id);
      },
    });
  }
  const clashBtn = document.getElementById('btnCharSagaClash');
  bindPress(clashBtn, () => {
    AudioSys.sfx('select');
    const duo = pickSagaIconClash();
    if (!duo) {
      try { UI.toast(t('toast.charSagaUnlock'), 2800); } catch (_) {}
      return;
    }
    vsSelect.p1 = duo.a.id;
    vsSelect.p2 = duo.b.id;
    UI.charPickStep = 2;
    UI.renderCharSelect();
    scrollCharFightIntoView();
    UI.toast(t('toast.charSagaClash', { a: duo.a.name, b: duo.b.name }), 2600);
  });
  window.__sfCharChrome = true;
}

/** Prestatie-iconen als inline SVG (art-upgrade 4/4) — vervangt emoji. */
const ACH_ICON_SVG = {
  first_win: '<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 5H4c0 3 1.5 5 3 5M17 5h3c0 3-1.5 5-3 5"/><path d="M12 14v3M8 20h8M10 17h4v3h-4z"/>',
  lv10: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
  dex10: '<path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2z"/><path d="M12 6v14"/>',
  dexFull: '<path d="M5 4h11v16H5z"/><path d="M16 6h3v14h-3"/><path d="M8 8h5M8 12h5"/>',
  dex100: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  dexHalf: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5l-1.6 4-4 1.6 1.6-4z" fill="currentColor"/>',
  dexTiers: '<path d="M12 3l6 5-6 13L6 8z"/><path d="M6 8h12M9 8l3 13M15 8l-3 13"/>',
  dexMythic: '<path d="M12 3l1.8 5.4L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.6z" fill="currentColor"/>',
  train5: '<rect x="6" y="8" width="12" height="10" rx="2"/><path d="M9 8V5.5M15 8V5.5"/><circle cx="9.5" cy="12.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="12.5" r="1.2" fill="currentColor"/>',
  wall100: '<path d="M4 6h16M4 11h16M4 16h16M4 6v14h16V6M9 6v5M15 11v5M9 16v4"/>',
  combo8: '<path d="M13 3L6 13h5l-2 8 7-10h-5z" fill="currentColor" stroke="none"/>',
  lv50: '<path d="M4 17l1.5-9L9 12l3-6 3 6 3.5-4L20 17z"/><path d="M5 20h14"/>',
  daily7: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M8 4v4M16 4v4"/><path d="M9 15l2 2 4-4"/>',
  vs5: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>',
  vs_roster: '<circle cx="9" cy="9" r="4"/><rect x="12" y="12" width="8" height="8" rx="2"/>',
  saga_icons: '<path d="M12 3l2 6h6l-5 4 2 6-5-3.6L7 19l2-6-5-4h6z" fill="currentColor" stroke="none"/>',
};
function achIconSvg(id) {
  const body = ACH_ICON_SVG[id] || ACH_ICON_SVG.first_win;
  return '<svg viewBox="0 0 24 24" style="width:1.2em;height:1.2em;vertical-align:-0.24em;margin-right:2px" ' +
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
}

/** Mini SVG-vinkje (art-upgrade 4/4) — vervangt ✔-glyphs in lijsten. */
const SVG_CHECK_MINI =
  '<svg viewBox="0 0 24 24" style="width:1em;height:1em;vertical-align:-0.14em" fill="none" ' +
  'stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13l5 5L20 7"/></svg>';

/** Inline SVG-slotje (art-upgrade 2/4) — vervangt 🔒 in level/wapen-lijsten. */
const SVG_LOCK_ICON =
  '<svg viewBox="0 0 24 24" style="width:1.15em;height:1.15em;vertical-align:-0.2em" fill="none" stroke="currentColor" stroke-width="2">' +
  '<rect x="6" y="11" width="12" height="9" rx="2" fill="rgba(0,0,0,.3)"/><path d="M9 11V8a3 3 0 016 0v3"/></svg>';

const MODE_HUB_META = {
  arcade: { badge: 'SOLO', badgeClass: 'badge-solo', title: 'Arcade', sub: 'Snelle sessies · high scores · geen voortgang verlies' },
  collect: { badge: 'COLLECTIE', badgeClass: 'badge-meta', title: 'Verzameling', sub: 'Wapens · dex & ei-pets · stijlen · monsterboek' },
};

function hubForPlayMode(mode) {
  if (mode === 'adventure') return 'adventure';
  if (mode === 'versus') return 'versus';
  if (mode === 'training' || mode === 'wall' || mode === 'coinrun') return 'arcade';
  return null;
}

function hubTileStatLine(hub) {
  switch (hub) {
    case 'adventure': {
      const cur = currentAdvIsland();
      const prog = islandProgress(cur);
      return t('island.progress', {
        cur, name: islandLabel(cur, 'name'), cleared: prog.cleared, total: prog.total,
        unlocked: save.unlocked, max: MAX_LEVEL,
      });
    }
    case 'arcade': {
      const bits = [];
      if (save.trainWins > 0) bits.push(`${save.trainWins} train`);
      if (save.bestWall > 0) bits.push(`muur ${save.bestWall}`);
      const mats = save.stats?.matsCoinBest || 0;
      if (mats > 0) bits.push(`mats ${mats}`);
      const pc = petCoinsBalance();
      if (pc > 0) bits.push(`${pc} pet 🪙`);
      return bits.length ? bits.join(' · ') : t('hub.modes3');
    }
    case 'versus': {
      const w = save.stats?.vsWins || 0;
      const m = save.stats?.vsMatches || 0;
      return m > 0 ? t('hub.vsRecord', { w, m }) : t('hub.fightersLocal');
    }
    case 'collect':
      return `${weaponUnlockedCount()}/${WEAPONS.length} wap · dex ${petTamedCount()} · ${petCoinsBalance()} pet 🪙`;
    default:
      return '';
  }
}

function audioMixStatusLine(inPause) {
  const mPct = volPct(save.musicVol, 0.85);
  const sPct = volPct(save.sfxVol, 1);
  const bits = [];
  if (!save.music && !save.sfx) {
    bits.push(t('audio.allMuted'));
    return bits.join(' · ');
  }
  if (!save.music) bits.push(t('audio.musicOff'));
  else {
    bits.push(t('audio.musicPct', { pct: mPct }));
    if (inPause) bits.push(t('audio.pauseDuck'));
  }
  if (!save.sfx) bits.push(t('audio.sfxOff'));
  else bits.push(t('audio.sfxPct', { pct: sPct }));
  if (inPause && save.music && typeof AudioSys !== 'undefined') {
    const track = songLabel(AudioSys.currentSongId());
    if (track) bits.push(t('audio.pauseTrack', { track }));
  }
  return bits.join(' · ');
}

function levelTileTip(n, pick, infoLv, boss, best, fails) {
  let tip = t('ui.levelTipWaves', { waves: infoLv.waves.length, starHint: starHintLine() });
  if (boss) tip += pick * LEVELS_PER_ISLAND === n ? t('ui.levelTipIslandBoss') : t('ui.levelTipMidBoss');
  if (best > 0) tip += t('ui.levelTipYourStars', { stars: '★'.repeat(best), empty: '☆'.repeat(3 - best) });
  if (fails > 0) {
    tip += t('ui.levelTipFails', { n: fails });
    if (fails >= 5) tip += t('ui.levelTipMasterActive');
  }
  tip += t('ui.levelTipTap');
  return tip;
}

const UI = {
  screens: ['menuScreen', 'modeHubScreen', 'levelScreen', 'gambleScreen', 'weaponScreen', 'petScreen', 'styleScreen', 'upgradeScreen', 'skillScreen', 'settingsScreen', 'missionsScreen', 'charSelectScreen', 'dexScreen', 'helpScreen', 'installScreen', 'resultScreen', 'pauseScreen'],
  modeHubId: 'arcade',
  charPickStep: 1,
  charSagaFilter: 'all',
  skillSagaFilter: 'all',
  skillBehaviorFilter: 'all',
  skillSortMode: 'level',
  skillPreviewId: 'rasengan',
  weaponPreviewId: null,
  charSortMode: 'name',
  charPreviewHoverId: null,
  dexRarityFilter: 'all',
  achFilter: 'all',
  petTab: 'dex',
  advIslandPick: 0,
  lastResult: null,
  pauseSubDefault: 'Rasengan klaar — moto! · voortgang blijft op dit apparaat',

  activeScreen() {
    return this.screens.find(sid => document.getElementById(sid)?.classList.contains('active')) || null;
  },

  BACK_LABELS: {},

  syncBackLabels() {
    const active = this.activeScreen();
    if (!active || active === 'charSelectScreen') return;
    const el = document.getElementById(active);
    if (!el) return;
    const back = el.querySelector('.back-btn[data-back], .back-btn[data-back-gamble], #installBack');
    if (!back) return;
    const label = this.BACK_LABELS[active];
    if (label) back.textContent = label;
  },

  resetInnerScrolls(screenEl) {
    if (!screenEl) return;
    const scrollables = screenEl.querySelectorAll(
      '.char-grid-scroll, .menu-landing-scroll, .mode-hub-body, .island-bar, .grid, #weaponList, .skill-grid-scroll, [data-scroll-reset]'
    );
    scrollables.forEach((el) => {
      try {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      } catch (_) {}
    });
  },

  scrollNavTop(screenEl) {
    if (!screenEl) return;
    try {
      screenEl.scrollTop = 0;
      screenEl.scrollLeft = 0;
    } catch (_) {}
    this.resetInnerScrolls(screenEl);
  },

  charSelectBackToP1() {
    this.charPickStep = 1;
    this.renderCharSelect();
    requestAnimationFrame(() => {
      try { this.scrollNavTop(document.getElementById('charSelectScreen')); } catch (_) {}
    });
  },

  refreshPauseSubtitle() {
    const sub = document.querySelector('#pauseScreen .subtitle');
    const vsRestart = document.getElementById('pauseVsRestart');
    if (vsRestart) {
      vsRestart.style.display = (game?.mode === 'versus' && (state === 'play' || state === 'pause')) ? 'flex' : 'none';
    }
    if (!sub) return;
    const onboardEl = document.getElementById('pauseOnboardLine');
    if (onboardEl) {
      const hint = (game && typeof pauseOnboardHintLine === 'function')
        ? pauseOnboardHintLine(game.mode)
        : '';
      if (hint) {
        onboardEl.textContent = hint;
        onboardEl.style.display = 'block';
      } else {
        onboardEl.textContent = '';
        onboardEl.style.display = 'none';
      }
    }
    if (game?.mode === 'versus' && game.p2) {
      const a = vsRosterEntry(game.p1Pick).name;
      const b = vsRosterEntry(game.p2Pick).name;
      let tag = '';
      if (game.roundsP1 === 1 && game.roundsP2 === 1) tag = ' · beslissende ronde';
      else if (game.roundsP1 === 1 || game.roundsP2 === 1) tag = ' · match point';
      sub.textContent = `2P ${game.roundsP1}-${game.roundsP2} · ronde ${game.round} · ${a} vs ${b}${tag}`;
    } else {
      sub.textContent = this.pauseSubDefault;
    }
    this.renderPauseRunLoot();
  },

  renderPauseRunLoot() {
    const el = document.getElementById('pauseRunLoot');
    if (!el) return;
    const loot = game && game.runLoot;
    const html = formatRunLootHtml(loot, game && game.mode);
    if (html) {
      el.innerHTML = html;
      el.style.display = 'block';
    } else {
      el.innerHTML = '';
      el.style.display = 'none';
    }
  },

  safeOpen(screenId, renderFn, opts) {
    opts = opts || {};
    const el = document.getElementById(screenId);
    if (!el) {
      sfReportError('safeOpen/' + screenId, new Error('missing screen DOM'), 'Scherm niet gevonden — terug naar menu');
      try { this.goMenu(); } catch (_) { ensureVisibleScreen(); }
      return;
    }
    this.show(screenId);
    if (renderFn) {
      try { renderFn(); } catch (err) {
        sfReportError(renderFn.name || screenId, err, opts.msg || 'Scherm laden mislukt — herlaad via Verse versie');
      }
    }
  },

  show(id) {
    try {
      if (!id) {
        if (state === 'play' && !game) {
          sfReportError('UI.show/play', new Error('no game ref'), 'Gevecht niet geladen — terug naar menu');
          try { this.goMenu(); } catch (_) { ensureVisibleScreen(); }
          syncPlayLayer();
          return;
        }
        try { clearScreensForPlay(); } catch (_) {}
      } else {
        const target = document.getElementById(id);
        if (!target) {
          sfReportError('UI.show/' + id, new Error('missing screen DOM'), 'Scherm niet gevonden — terug naar menu');
          try { this.goMenu(); } catch (_) { ensureVisibleScreen(); }
          syncPlayLayer();
          return;
        }
        target.classList.add('active');
      }
      for (const s of this.screens) {
        if (id && s === id) continue;
        const scr = document.getElementById(s);
        if (scr) scr.classList.remove('active');
      }
      if (id) {
        const el = document.getElementById(id);
        requestAnimationFrame(() => {
          try {
            this.scrollNavTop(el);
            this.syncBackLabels();
          } catch (_) {}
        });
        if (id === 'pauseScreen') {
          try { this.refreshPauseSubtitle(); } catch (_) {}
          try { this.renderPauseToggles(); } catch (_) {}
          try { this.renderPausePerfStrip(); } catch (_) {}
          try {
            paintPausePixelBackdrop(0);
            startPausePixelBackdropLoop();
          } catch (_) {}
        }
        if (id === 'helpScreen') {
          try { this.renderHelp(); } catch (err) { sfReportError('renderHelp', err); }
        }
        if (id === 'skillScreen') {
          this.skillPreviewId = save.skill || 'rasengan';
          this.superPreviewId = save.super || 'ketsbam';
        }
        if (id === 'levelScreen') {
          if (!this.advIslandPick) this.advIslandPick = currentAdvIsland();
          try { applyIslandOnboarding(); } catch (_) {}
        }
      } else if (game?.mode === 'versus') {
        try { this.refreshPauseSubtitle(); } catch (_) {}
      }
      const pauseBtn = document.getElementById('pauseBtn');
      if (pauseBtn) pauseBtn.classList.toggle('show', !id && !!game && !game.over && state !== 'result');
    } catch (err) {
      sfReportError('UI.show/' + (id || 'play'), err, 'Schermwissel mislukt — terug naar menu');
      try { this.goMenu(); } catch (_) { ensureVisibleScreen(); }
    }
    syncPlayLayer();
    if (id) ensureVisibleScreen();
  },

  renderHelp() {
    const host = document.getElementById('helpModeChips');
    const islHost = document.getElementById('helpIslandBlock');
    if (islHost) {
      const cur = currentAdvIsland();
      const cap = adventureWeaponCap();
      const rows = ADVENTURE_ISLANDS.map((isl) => {
        const prog = islandProgress(isl.id);
        const ok = islandUnlocked(isl.id);
        const wCap = ISLAND_WEAPON_CAPS[isl.id - 1];
        const pct = Math.round(prog.cleared / prog.total * 100);
        return `<div class="help-island-row${cur === isl.id ? ' cur' : ''}${ok ? '' : ' locked'}">` +
          `<span class="help-island-ico" style="color:${isl.accent}">${isl.icon}</span>` +
          `<div class="help-island-body"><b>${islandLabel(isl.id, 'name')}</b> · ${islandLabel(isl.id, 'sub')}` +
          `<div class="help-island-sub">${ok
            ? t('ui.helpIslandProg', { cleared: prog.cleared, total: prog.total, stars: prog.stars, maxStars: prog.maxStars, cap: wCap })
            : t('ui.helpIslandLocked', { lv: isl.id * LEVELS_PER_ISLAND })}</div>` +
          `<div class="island-prog-track"><i style="width:${pct}%;background:${isl.accent}"></i></div></div></div>`;
      }).join('');
      islHost.innerHTML =
        `<div class="step-card help-island-card">` +
        `<b>${t('ui.helpIslandTitle')}</b> — ${t('ui.helpIslandIntro', { cap, cur })}` +
        `<div class="help-island-grid">${rows}</div>` +
        `<div style="margin-top:10px;opacity:.88;line-height:1.45">${t('ui.helpMasterBuff')}</div></div>`;
    }
    if (!host) return;
    const touch = IS_TOUCH ? t('ui.helpTouch') : t('ui.helpKeyboard');
    const prog = onboardingProgress();
    const next = nextUntriedMode();
    const modes = [
      { id: 'adventure', label: 'Avontuur', tip: '5 eilanden × 10 levels · skill gate wapens · Meester-buff na 5× verlies · dobbel-gok vóór level' },
      { id: 'training', label: 'Training', tip: 'Combo-trainer ×5/×8/×10 · lasers · Chidori-telegraph' },
      { id: 'wall', label: 'Muur', tip: '60s · combo ×3/×5/×8 hints · record-tempo + projectie in HUD · 5s waarschuwing' },
      { id: 'versus', label: '2 spelers', tip: 'P1 links P2 rechts · best-of-3 · rematch in pauze' },
      { id: 'coinrun', label: 'Mats', tip: '45s munten · mik ↑ · vliegers +3' },
    ];
    let html = `<div style="font-size:12px;opacity:.85;margin-bottom:8px">${t('ui.helpOnboardHead', { seen: prog.seen, total: prog.total })}</div>`;
    if (next) {
      html += `<div class="step-card" style="margin:6px 0;padding:10px 12px;border-color:rgba(124,245,255,.45)">` +
        `<b>${t('ui.helpTryNext', { mode: next.label })}</b>` +
        `<div style="opacity:.88;margin-top:4px">${t('ui.helpTrySub')}</div></div>`;
    }
    html += modes.map((m) => {
      const seen = modeOnboardingSeen(m.id);
      const highlight = next && next.id === m.id ? ' border-color:rgba(124,245,255,.5)' : '';
      const firstMin = modeFirstMinuteLine(m.id);
      return `<div class="step-card" style="margin:6px 0;padding:10px 12px${highlight}">` +
        `<b>${m.label}</b>${seen ? ` <span style="color:#7cfc8a;font-size:11px">${t('ui.helpHintSeen')}</span>` : ` <span style="color:#ffd75e;font-size:11px">${t('ui.helpHintNot')}</span>`}` +
        `<div style="opacity:.92;margin-top:4px;color:#ffd75e;font-size:12px">${firstMin}</div>` +
        `<div style="opacity:.75;margin-top:4px;font-size:11px">${m.tip} · ${touch}</div></div>`;
    }).join('');
    host.innerHTML = html;
  },

  syncTouchClass() {
    document.body.classList.toggle('big-touch', save.bigTouch !== false);
    refreshA11yUi();
  },

  goBack() {
    try {
      AudioSys.sfx('select');
      const active = this.screens.find(sid => document.getElementById(sid)?.classList.contains('active'));
      if (active === 'charSelectScreen' && this.charPickStep === 2) {
        this.charSelectBackToP1();
        return;
      }
      if (active === 'pauseScreen' && game) {
        try { Input.releaseAll(); } catch (_) {}
        state = 'play';
        AudioSys.setPaused(false);
        if (save.music && AudioSys.desiredSong) AudioSys.play(AudioSys.desiredSong);
        this.show(null);
        return;
      }
      if (active === 'gambleScreen') {
        try { cancelGambleStart(); } catch (_) {}
        this.safeOpen('levelScreen', () => this.renderLevels());
        return;
      }
      if (active === 'modeHubScreen') {
        this.renderMenu();
        this.show('menuScreen');
        return;
      }
      if (active === 'levelScreen') {
        bumpLevelHoldGen();
        try { cancelGambleStart(); } catch (_) {}
        this.renderMenu();
        this.show('menuScreen');
        return;
      }
      if (active === 'charSelectScreen') {
        this.renderMenu();
        this.show('menuScreen');
        return;
      }
      if (active === 'weaponScreen' || active === 'petScreen' || active === 'styleScreen' || active === 'skillScreen' || active === 'upgradeScreen' || active === 'dexScreen') {
        this.openModeHub('collect');
        return;
      }
      if (active === 'missionsScreen' || active === 'settingsScreen' || active === 'helpScreen' || active === 'installScreen') {
        if (active === 'missionsScreen' && !save.missionsIntroSeen) {
          save.missionsIntroSeen = true;
          persist();
        }
        this.renderMenu();
        this.show('menuScreen');
        return;
      }
      if (active === 'resultScreen') {
        this.goMenu();
        return;
      }
      this.goMenu();
    } catch (err) {
      sfReportError('goBack', err, 'Menu-navigatie mislukt — terug naar hoofdmenu');
      this.goMenu();
    }
  },

  toast(msg, ms) {
    const host = document.getElementById('toastHost');
    if (!host) return;
    if (this._toastHide) {
      clearTimeout(this._toastHide);
      this._toastHide = null;
    }
    if (typeof host.replaceChildren === 'function') host.replaceChildren();
    else host.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    this._toastHide = setTimeout(() => {
      el.remove();
      this._toastHide = null;
    }, ms || 2800);
  },

  goMenu() {
    try {
      try { cancelGambleStart(); } catch (_) {}
      bumpLevelHoldGen();
      const active = this.screens.find(sid => document.getElementById(sid)?.classList.contains('active'));
      if (active === 'missionsScreen' && !save.missionsIntroSeen) {
        save.missionsIntroSeen = true;
        persist();
      }
      if (game) {
        game._resultToken = (game._resultToken || 0) + 1;
        game._pendingResult = false;
        try {
          if (typeof clearTideBattleState === 'function') clearTideBattleState(game, { restoreMusic: true });
        } catch (_) {
          try { if (typeof cancelTideBattleMusicPending === 'function') cancelTideBattleMusicPending(game); } catch (_) {}
        }
      }
      game = null;
      state = 'menu';
      window.__sfLoopErr = false;
      try { Input.releaseAll(); } catch (_) {}
      Input.dualMode = false;
      Input.layout(W, H);
      this.charPickStep = 1;
      this.syncTouchClass();
      this.renderMenu();
      this.show('menuScreen');
      requestAnimationFrame(() => {
        try { this.scrollNavTop(document.getElementById('menuScreen')); } catch (_) {}
      });
      AudioSys.setPaused(false);
      playMenuBgm(true);
      scheduleResize();
      if (window.StickInstall) window.StickInstall.refreshMenuButton();
    } catch (err) {
      sfReportError('goMenu', err, 'Kon menu niet openen — herlaad de pagina');
      try { Input.releaseAll(); } catch (_) {}
      if (game) {
        try {
          if (typeof clearTideBattleState === 'function') clearTideBattleState(game, { restoreMusic: true });
        } catch (_) {
          try { if (typeof cancelTideBattleMusicPending === 'function') cancelTideBattleMusicPending(game); } catch (_) {}
        }
      }
      game = null;
      state = 'menu';
      window.__sfLoopErr = false;
      syncPlayLayer();
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('menuScreen')?.classList.add('active');
      try { playMenuBgm(true); } catch (_) {}
    }
  },

  renderCharSelect() {
    initCharSelectChrome();
    this.charPickStep = this.charPickStep || 1;
    const filter = this.charSagaFilter || 'all';
    if (this.charPreviewHoverId) {
      const h = vsRosterEntry(this.charPreviewHoverId);
      if (!vsUnlocked(h) || (filter !== 'all' && (h.saga || 'scroll') !== filter)) {
        this.charPreviewHoverId = null;
      }
    }
    const sagaMeta = vsSagaMeta(filter);
    const screen = document.getElementById('charSelectScreen');
    if (screen) {
      screen.classList.toggle('pick-step-1', this.charPickStep === 1);
      screen.classList.toggle('pick-step-2', this.charPickStep === 2);
    }
    const stepEl = document.getElementById('charPickStep');
    const stepBadge = document.getElementById('charPickStepBadge');
    if (stepEl) {
      stepEl.textContent = this.charPickStep === 1 ? t('ui.charSub1') : t('ui.charSub2');
    }
    if (stepBadge) {
      stepBadge.textContent = this.charPickStep === 1 ? t('ui.charStep1') : t('ui.charStep2');
    }
    const blurbEl = document.getElementById('charSagaBlurb');
    if (blurbEl) blurbEl.textContent = filter === 'all'
      ? t('ui.charBlurbAll')
      : sagaMeta.blurb;
    const sagaBar = document.getElementById('charSagaBar');
    if (sagaBar) {
      sagaBar.querySelectorAll('[data-saga]').forEach((btn) => {
        const sid = btn.dataset.saga || 'all';
        btn.classList.toggle('active', sid === filter);
        const c = vsSagaUnlockedCounts(sid);
        let badge = btn.querySelector('.saga-count');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'saga-count';
          btn.appendChild(badge);
        }
        badge.textContent = ` (${c.unlocked}/${c.total})`;
      });
    }
    const grid = document.getElementById('charGrid');
    if (!grid) return;
    const p1Lbl = document.getElementById('charP1Label');
    const p2Lbl = document.getElementById('charP2Label');
    const e1 = vsRosterEntry(vsSelect.p1);
    const e2 = vsRosterEntry(vsSelect.p2);
    if (p1Lbl) {
      p1Lbl.textContent = (this.charPickStep === 1 ? '▶ ' : '') + 'P1: ' + e1.name;
      p1Lbl.classList.toggle('active', this.charPickStep === 1);
      p1Lbl.setAttribute('aria-pressed', this.charPickStep === 1 ? 'true' : 'false');
    }
    if (p2Lbl) {
      p2Lbl.textContent = (this.charPickStep === 2 ? '▶ ' : '') + 'P2: ' + e2.name;
      p2Lbl.classList.toggle('active', this.charPickStep === 2);
      p2Lbl.setAttribute('aria-pressed', this.charPickStep === 2 ? 'true' : 'false');
    }
    const statEl = document.getElementById('charStatPreview');
    if (statEl) updateCharStatPreview();
    this.renderCharIconRow();
    grid.innerHTML = '';
    const rosterBase = filter === 'all'
      ? VS_ROSTER
      : VS_ROSTER.filter(r => (r.saga || 'scroll') === filter);
    const roster = sortVsRoster(rosterBase, UI.charSortMode || 'name');
    if (!roster.length) {
      const empty = document.createElement('div');
      empty.className = 'char-grid-empty';
      empty.textContent = t('ui.charEmpty');
      grid.appendChild(empty);
    }
    for (const r of roster) {
      const ok = vsUnlocked(r);
      const el = document.createElement('div');
      const sel1 = vsSelect.p1 === r.id;
      const sel2 = vsSelect.p2 === r.id;
      const focus = ok && ((this.charPickStep === 1 && !sel1) || (this.charPickStep === 2 && !sel2));
      const isFeatured = VS_FEATURED_IDS.includes(r.id) || r.featured;
      el.className = 'char-card' + (ok ? '' : ' locked') + (isFeatured ? ' saga-icon featured' : '') + (sel1 ? ' p1sel' : '') + (sel2 ? ' p2sel' : '') +
        (focus ? ' pick-hint' : '') + (this.charPreviewHoverId === r.id ? ' preview-hov' : '');
      el.dataset.id = r.id;
      el.setAttribute('role', 'button');
      if (ok) el.setAttribute('aria-label', r.name + ', ' + rosterFlair(r));
      const cv = document.createElement('canvas');
      cv.width = 80; cv.height = 80;
      const cc = cv.getContext('2d');
      cc.translate(40, 62); cc.scale(0.95, 0.95);
      const prev = buildVsFighter(r, 0, 1);
      prev.draw(cc);
      el.appendChild(cv);
      const saga = vsSagaMeta(r.saga || 'scroll');
      const badge = document.createElement('div');
      badge.className = 'char-saga';
      badge.textContent = saga.label.replace('-saga', '');
      el.appendChild(badge);
      const cap = document.createElement('div');
      cap.className = 'char-name';
      cap.textContent = r.name;
      el.appendChild(cap);
      const tag = document.createElement('div');
      tag.className = 'char-tag';
      tag.textContent = ok ? r.tag : t('ui.charLocked');
      el.appendChild(tag);
      const flair = document.createElement('div');
      flair.className = 'char-flair';
      flair.textContent = ok ? rosterFlair(r) : vsUnlockHint(r);
      el.appendChild(flair);
      if (sel1 || sel2) {
        const pickBadge = document.createElement('div');
        pickBadge.className = 'char-pick-badge' + (sel1 && sel2 ? ' both' : sel1 ? ' p1' : ' p2');
        pickBadge.textContent = sel1 && sel2 ? 'P1+P2' : (sel1 ? 'P1' : 'P2');
        el.appendChild(pickBadge);
      }
      if (ok && focus) {
        const nowBadge = document.createElement('div');
        nowBadge.className = 'char-pick-now';
        nowBadge.textContent = this.charPickStep === 1 ? t('ui.charPickNow1') : t('ui.charPickNow2');
        el.appendChild(nowBadge);
      }
      if (ok) {
        const mini = document.createElement('div');
        mini.className = 'char-mini-stat';
        const st = vsFighterStats(r);
        mini.textContent = `STR ${st.str} · RNG ${st.rng} · mDPS ${st.meleeDps} · rDPS ${st.rangeDps}`;
        el.appendChild(mini);
      }
      grid.appendChild(el);
    }
    requestAnimationFrame(() => {
      const hint = grid.querySelector('.char-card.pick-hint:not(.locked)');
      const pick = hint || grid.querySelector(
        this.charPickStep === 1 ? '.char-card.p1sel' : '.char-card.p2sel'
      );
      if (pick) pick.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    const fightBtn = document.getElementById('btnCharFight');
    if (fightBtn) {
      fightBtn.disabled = !(vsSelect.p1 && vsSelect.p2);
      fightBtn.setAttribute('aria-disabled', fightBtn.disabled ? 'true' : 'false');
    }
    const backBtn = document.getElementById('charSelectBack');
    if (backBtn) {
      backBtn.textContent = this.charPickStep === 2 ? t('ui.charBackP1') : t('ui.charBackMenu');
    }
    const bindPickPill = (id, step) => {
      const pill = document.getElementById(id);
      if (!pill || pill.dataset.bound) return;
      pill.dataset.bound = '1';
      bindPress(pill, () => {
        AudioSys.sfx('select');
        this.charPickStep = step;
        this.renderCharSelect();
        requestAnimationFrame(() => {
          try { this.scrollNavTop(document.getElementById('charSelectScreen')); } catch (_) {}
        });
      });
    };
    bindPickPill('charP1Label', 1);
    bindPickPill('charP2Label', 2);
    const swapBtn = document.getElementById('btnCharSwap');
    if (swapBtn && !swapBtn.dataset.bound) {
      swapBtn.dataset.bound = '1';
      bindPress(swapBtn, () => {
        AudioSys.sfx('select');
        const p1Hold = vsSelect.p1;
        vsSelect.p1 = vsSelect.p2;
        vsSelect.p2 = p1Hold;
        this.renderCharSelect();
        UI.toast(t('toast.charSwap'), 1800);
      });
    }
    const rnd = document.getElementById('btnCharRandom');
    if (rnd && !rnd.dataset.bound) {
      rnd.dataset.bound = '1';
      bindPress(rnd, () => {
        AudioSys.sfx('select');
        const pool = pickCharPoolFiltered();
        if (pool.length < 2) {
          UI.toast(t('toast.charNotEnough'), 2400);
          return;
        }
        const a = choice(pool);
        let b = choice(pool);
        for (let i = 0; i < 8 && b.id === a.id; i++) b = choice(pool);
        vsSelect.p1 = a.id;
        vsSelect.p2 = b.id;
        this.charPickStep = 2;
        this.charPreviewHoverId = null;
        this.renderCharSelect();
        scrollCharFightIntoView();
        const sa = vsFighterStats(a);
        const sb = vsFighterStats(b);
        UI.toast(t('toast.charRandom', {
          a: a.name, b: b.name, hp1: sa.hp, hp2: sb.hp, tot1: vsOverallRating(sa), tot2: vsOverallRating(sb),
        }), 2800);
      });
    }
    const rndFair = document.getElementById('btnCharRandomFair');
    if (rndFair && !rndFair.dataset.bound) {
      rndFair.dataset.bound = '1';
      bindPress(rndFair, () => {
        AudioSys.sfx('select');
        const duo = pickBalancedRandomDuo();
        if (!duo) {
          UI.toast(t('toast.charNotEnough'), 2400);
          return;
        }
        vsSelect.p1 = duo.a.id;
        vsSelect.p2 = duo.b.id;
        this.charPickStep = 2;
        this.charPreviewHoverId = null;
        this.renderCharSelect();
        scrollCharFightIntoView();
        const sa = vsFighterStats(duo.a);
        const sb = vsFighterStats(duo.b);
        const diff = duo.ratingDiff != null ? duo.ratingDiff : Math.abs(vsOverallRating(sa) - vsOverallRating(sb));
        UI.toast(t('toast.charFair', { a: duo.a.name, b: duo.b.name, diff }), 3000);
      });
    }
  },

  renderCharIconRow() {
    const row = document.getElementById('charIconRow');
    if (!row) return;
    row.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'char-icon-row-title';
    label.textContent = t('ui.charBig5Title');
    row.appendChild(label);
    const hint = document.createElement('div');
    hint.className = 'char-icon-row-hint';
    hint.textContent = t('ui.charBig5Hint');
    row.appendChild(hint);
    const strip = document.createElement('div');
    strip.className = 'char-icon-strip';
    strip.setAttribute('data-char-scroll', '');
    for (const id of VS_FEATURED_IDS) {
      const r = vsRosterEntry(id);
      const ok = vsUnlocked(r);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'char-icon-chip' + (ok ? '' : ' locked') +
        (vsSelect.p1 === id ? ' p1sel' : '') + (vsSelect.p2 === id ? ' p2sel' : '');
      chip.dataset.id = id;
      const cv = document.createElement('canvas');
      cv.width = 56; cv.height = 56;
      const cc = cv.getContext('2d');
      cc.translate(28, 44); cc.scale(0.82, 0.82);
      buildVsFighter(r, 0, 1).draw(cc);
      chip.appendChild(cv);
      const cap = document.createElement('span');
      cap.className = 'char-icon-name';
      cap.textContent = r.name;
      chip.appendChild(cap);
      if (ok) {
        const st = vsFighterStats(r);
        const stat = document.createElement('span');
        stat.className = 'char-icon-stat';
        stat.textContent = `STR${st.str} RNG${st.rng}`;
        chip.appendChild(stat);
      }
      strip.appendChild(chip);
    }
    row.appendChild(strip);
  },

  openModeHub(id) {
    if (!MODE_HUB_META[id]) return;
    this.modeHubId = id;
    this.safeOpen('modeHubScreen', () => this.renderModeHub(), { msg: 'Hub laden mislukt' });
  },

  renderModeHub() {
    const meta = MODE_HUB_META[this.modeHubId];
    if (!meta) return;
    const badge = document.getElementById('modeHubBadge');
    const title = document.getElementById('modeHubTitle');
    const sub = document.getElementById('modeHubSub');
    const stepEl = document.getElementById('modeHubStep');
    const isArcade = this.modeHubId === 'arcade';
    if (badge) {
      badge.textContent = t(isArcade ? 'hub.solo' : 'hub.collection');
      badge.className = 'menu-badge ' + meta.badgeClass;
    }
    if (title) title.textContent = t(isArcade ? 'hub.arcadeTitle' : 'hub.collectTitle');
    if (sub) sub.textContent = t(isArcade ? 'hub.arcadeSub' : 'hub.collectSub');
    if (stepEl) stepEl.textContent = t('hub.step');
    document.querySelectorAll('[data-hub-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.hubPanel !== this.modeHubId;
    });
    const setStat = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt || '';
    };
    if (this.modeHubId === 'arcade') {
      setStat('hubStatTraining', (() => {
        const rec = save.stats.trainMaxCombo || 0;
        if (save.trainWins > 0) {
          return t('ui.hubStatTrainWins', {
            wins: save.trainWins,
            rec: rec ? ` · ${t('ui.hubStatTrainRecOnly', { n: rec })}` : '',
          });
        }
        if (rec > 0) return t('ui.hubStatTrainRecOnly', { n: rec });
        return t('ui.hubStatNotPlayed');
      })());
      setStat('hubStatWall', save.bestWall > 0 ? t('ui.hubStatWallRec', { n: save.bestWall }) : t('ui.hubStatWallEmpty'));
      const mats = save.stats?.matsCoinBest || 0;
      const pc = petCoinsBalance();
      setStat('hubStatMats', mats > 0 || pc > 0
        ? t('ui.hubStatCoinsBest', { n: mats, pet: pc > 0 ? t('ui.hubStatCoinsPet', { n: pc }) : '' })
        : t('ui.hubStatCoinsEmpty'));
    } else if (this.modeHubId === 'collect') {
      setStat('hubStatWeapons', t('ui.hubStatWeapons', { n: weaponUnlockedCount(), total: WEAPONS.length }));
      const skillLv = totalAllUpgradeLevels();
      const ready = countAllUpgradesReady();
      setStat('hubStatUpgrades', ready > 0
        ? t('ui.upgradeReady', { n: ready })
        : (skillLv > 0 ? t('ui.hubStatSkillLv', { n: skillLv }) : t('ui.hubStatSkillShards')));
      const petsN = petTamedCount();
      const eggsN = eggOwnedCount();
      const pc = petCoinsBalance();
      setStat('hubStatPets', eggsN > 0 || petsN > 0 || pc > 0
        ? t('ui.hubStatPetsFull', { pets: petsN, total: PET_ROSTER.length, coins: pc, eggs: eggsN, eggTotal: EGG_ROSTER.length })
        : t('ui.hubStatPetsEmpty', { total: PET_ROSTER.length }));
      const stylesN = STYLES.filter(s => styleUnlocked(s)).length;
      setStat('hubStatStyle', `${stylesN}/${STYLES.length} outfits`);
      const skillsN = skillUnlockedCount();
      const activeSk = skillById(save.skill || 'rasengan');
      const activeSp = equippedSuper();
      setStat('hubStatSkills', skillsN > 0
        ? `${skillsN}/${SKILLS.length} · ${skillLabel(activeSk)} · ${superLabel(activeSp)}`
        : `${SKILLS.length} specials`);
      setStat('hubStatDex', `${dexCount()}/${SPECIES_ORDER.length} · +max HP`);
    }
  },

  renderMenu() {
    try {
    this.syncTouchClass();
    const need = xpNeed(save.lvl);
    const w = weaponById(save.weapon);
    const st = styleById(save.style || 'classic');
    const pct = Math.round(save.xp / need * 100);
    ensureDaily();
    const dailyTasks = (save.daily && Array.isArray(save.daily.tasks)) ? save.daily.tasks : [];
    const readyClaim = claimableDailyTasks().length;
    const bonusReady = dailyTasks.length > 0 && dailyTasks.every(t => t.claimed) && !save.daily.dayBonusClaimed;
    const missAlert = readyClaim > 0 || bonusReady;
    const profileEl = document.getElementById('menuProfileBar');
    if (profileEl) {
      profileEl.innerHTML =
        `<span class="prof-row"><b>Lv ${save.lvl}</b><span>${weaponLabel(w)}</span>` +
        `<span style="color:${(skillById(save.skill || 'rasengan').color)}">${skillLabel(skillById(save.skill || 'rasengan'))}</span>` +
        `<span style="color:${equippedSuper().color}">${superLabel(equippedSuper())}</span>` +
        `<span style="color:${st.accent}">${styleLabel(st)}</span></span>` +
        `<span style="display:block;margin-top:3px;opacity:.82;font-size:11px">${adventureProgressLine()}</span>` +
        `<span class="prof-xp" aria-hidden="true"><span style="width:${pct}%"></span></span>` +
        `<span class="prof-foot">${save.xp}/${need} XP${missAlert ? ' · ' + t('ui.menuMissionReady') : ''}</span>`;
      profileEl.classList.toggle('has-alert', missAlert);
    }
    const statsEl = document.getElementById('menuStats');
    if (statsEl) statsEl.textContent = '';
    const cont = document.getElementById('btnContinue');
    const lp = save.lastPlay;
    const featHub = lp?.mode ? hubForPlayMode(lp.mode) : null;
    if (cont) {
      if (lp && lp.mode) {
        const labels = {
          adventure: t('modes.adventure') + ` Lv ${lp.level || 1}`,
          training: t('modes.training'), wall: t('modes.wall'), versus: t('modes.versus'), coinrun: t('modes.coinrun'),
        };
        cont.style.display = 'flex';
        const contDiv = cont.querySelector('div');
        if (contDiv) {
          contDiv.innerHTML = `${t('menu.continue')}<small>${labels[lp.mode] || lp.mode}</small>`;
        }
      } else cont.style.display = 'none';
    }
    document.querySelectorAll('[data-hub]').forEach((el) => {
      el.classList.toggle('hub-tile-featured', el.dataset.hub === featHub);
    });
    document.querySelectorAll('[data-hub-stat]').forEach((el) => {
      el.textContent = hubTileStatLine(el.dataset.hubStat);
    });
    document.getElementById('togMusic')?.classList.toggle('off', !save.music);
    document.getElementById('togSfx')?.classList.toggle('off', !save.sfx);
    const verLine = document.getElementById('menuVerLine');
    if (verLine) verLine.textContent = 'v' + APP_VERSION + ' · arcade · SW v' + SW_CACHE_REV;
    const missEl = document.getElementById('menuDailyHint');
    const hubHintEl = document.getElementById('menuHubHint');
    const dailyLine = dailyStatusLine();
    if (missEl) missEl.textContent = dailyLine;
    const tipEl = document.getElementById('menuTipLine');
    let hintLine = dailyLine;
    if (tipEl) {
      const prog = onboardingProgress();
      const next = nextUntriedMode();
      if (next) {
        tipEl.textContent = t('ui.menuFirstMinuteNext', { seen: prog.seen, total: prog.total, next: next.label });
        hintLine = tipEl.textContent;
      } else if (prog.seen < prog.total) {
        tipEl.textContent = t('ui.menuFirstMinutePartial', { seen: prog.seen, total: prog.total });
        hintLine = tipEl.textContent;
      } else {
        const i = Math.floor(Date.now() / 8000);
        tipEl.textContent = d20TipAt(i);
        hintLine = tipEl.textContent;
      }
    }
    if (hubHintEl) hubHintEl.textContent = hintLine;
    const missBtn = document.getElementById('btnMissions');
    const missLbl = document.getElementById('btnMissionsLbl');
    if (missBtn) {
      missBtn.classList.toggle('tog-alert', missAlert);
      if (missLbl) {
        const chip = dailyMenuChipLine();
        missLbl.textContent = chip || t('menu.missions');
      }
    }
    const playLinkEl = document.getElementById('menuPlayLink');
    if (playLinkEl) {
      if (location.hostname.endsWith('.github.io')) {
        playLinkEl.textContent = '✓ GitHub Pages — Deel link (Android + iPad)';
      } else if (!playLinkEl.dataset.loaded) {
        playLinkEl.dataset.loaded = '1';
        loadHostingBundle().then(({ hosting }) => {
          const u = pickStablePlayUrl(hosting);
          if (u) {
            playLinkEl.innerHTML =
              `Deel met vrienden: <a href="${u}" style="color:#7cf5ff;font-weight:800">${u.replace(/^https:\/\//, '')}</a>`;
          }
        }).catch(() => {});
      }
    }
    if (typeof renderLangSwitch === 'function') renderLangSwitch();
    } catch (err) {
      sfReportError('renderMenu', err, 'Menu kon niet ververst worden');
    }
  },

  renderMissions() {
    ensureDaily();
    const dailyHost = document.getElementById('dailyList');
    const achHost = document.getElementById('achList');
    if (!dailyHost || !achHost) return;
    const tasks = (save.daily && Array.isArray(save.daily.tasks)) ? save.daily.tasks : [];
    const readyN = tasks.filter(t => t.done && !t.claimed).length;
    const claimedN = tasks.filter(t => t.claimed).length;
    const doneN = tasks.filter(t => t.done).length;
    let nextUpId = null;
    let nextUpPct = -1;
    for (const t of tasks) {
      if (t.done || t.claimed) continue;
      const def = dailyDef(t.id);
      if (!def) continue;
      const pct = t.progress / def.goal;
      if (pct > nextUpPct) { nextUpPct = pct; nextUpId = t.id; }
    }
    const sub = document.getElementById('missionsSub');
    const introEl = document.getElementById('missionsIntroLine');
    if (introEl) {
      if (!save.missionsIntroSeen) {
        introEl.style.display = 'block';
        introEl.textContent = t('missionsUi.introLine');
      } else {
        introEl.style.display = 'none';
        introEl.textContent = '';
      }
    }
    const step = dailyFlowStep();
    if (sub) {
      const streak = dailyStreakLine();
      if (step === 0) {
        sub.textContent = streak
          ? t('missionsUi.subDayDoneStreak', { streak })
          : t('missionsUi.subDayDone');
      } else {
        const pending = dailyUnclaimedXp();
        const base = step === 2
          ? t('missionsUi.subStep2', { xp: pending })
          : (step === 3
            ? t('missionsUi.subStep3')
            : t('missionsUi.subStep1', { xp: dailyPotentialXp() }));
        sub.textContent = streak ? `${base} · ${streak}` : base;
      }
    }
    const flowHost = document.getElementById('missionsFlowBar');
    if (flowHost) {
      flowHost.innerHTML = dailyFlowBarHtml(step);
    }
    const planHost = document.getElementById('missionsTodayPlan');
    if (planHost) {
      const earned = dailyEarnedXpToday();
      const maxXp = dailyPotentialXp();
      const next = dailyNextActionLine();
      let claimCall = '';
      if (readyN > 0) {
        const xpSum = claimableDailyTasks().reduce((n, task) => n + (dailyDef(task.id)?.xp || 0), 0);
        claimCall = `<div class="mission-claim-call">${t('missionsUi.claimCall', {
          n: readyN, xp: xpSum,
        })}</div>`;
      } else if (step === 3) {
        claimCall = `<div class="mission-claim-call mission-claim-call-bonus">${t('missionsUi.claimCallBonus')}</div>`;
      }
      planHost.innerHTML =
        claimCall +
        `<div class="mission-plan-next"><b>${t('missionsUi.planNow')}</b> ${next}</div>` +
        `<div class="mission-plan-xp">${t('missionsUi.planEarned', { earned, max: maxXp })}` +
        (step === 0 ? ` · ${t('missionsUi.planReset', { reset: dailyResetCountdown() })}` : '') +
        '</div>';
    }
    const sum = document.getElementById('missionsSummary');
    if (sum) {
      sum.style.display = 'block';
      const bonusLeft = !save.daily.dayBonusClaimed;
      const streak = dailyStreakLine();
      sum.innerHTML = t('missionsUi.summaryDone', { done: doneN, claimed: claimedN }) +
        (readyN ? ` · <b style="color:#ffd75e">${t('missionsUi.summaryReady', { n: readyN })}</b>` : '') +
        (bonusLeft
          ? (claimedN === 3
            ? ` · <b style="color:#7cfc8a">${t('missionsUi.summaryBonusReady')}</b>`
            : ` · ${claimedN === 2 ? t('missionsUi.summaryBonusAfter1') : t('missionsUi.summaryBonusAfterN', { n: 3 - claimedN })}`)
          : ` · dagbonus ${SVG_CHECK_MINI}`) +
        (streak ? ` · <b style="color:#7cf5ff">${streak}</b>` : '') +
        ` · ${t('missionsUi.summaryMax', { xp: dailyPotentialXp() })}`;
    }
    const claimAll = document.getElementById('dailyClaimAllBtn');
    if (claimAll) {
      claimAll.style.display = readyN >= 1 ? 'flex' : 'none';
      claimAll.classList.toggle('mission-claim-pulse', readyN >= 1);
      const lab = claimAll.querySelector('div');
      if (lab) {
        const xpSum = claimableDailyTasks().reduce((n, task) => n + (dailyDef(task.id)?.xp || 0), 0);
        const afterClaim = 3 - claimedN - readyN;
        lab.innerHTML = t('missionsUi.claimAllBtn') + `<small>+${xpSum} XP` +
          (afterClaim > 0
            ? (afterClaim === 1
              ? ` · ${t('missionsUi.claimAllAfter1')}`
              : ` · ${t('missionsUi.claimAllAfterN', { n: afterClaim })}`)
            : ` · ${t('missionsUi.claimAllThenBonus')}`) +
          '</small>';
      }
    }
    dailyHost.innerHTML = '';
    for (const task of tasks) {
      const def = dailyDef(task.id);
      if (!def) continue;
      const el = document.createElement('div');
      const claimable = task.done && !task.claimed;
      const isNextUp = !task.done && !task.claimed && task.id === nextUpId;
      const almost = !task.done && !task.claimed && (task.progress / def.goal) >= 0.75;
      el.className = 'step-card mission-card' +
        (claimable ? ' claimable' : '') +
        (task.claimed ? ' claimed' : '') +
        (isNextUp ? ' next-up' : '') +
        (almost ? ' almost' : '');
      const pct = Math.min(100, Math.round(task.progress / def.goal * 100));
      let status;
      if (task.claimed) status = `<span style="color:#7cfc8a">${SVG_CHECK_MINI} ${t('missionsUi.dailyClaimed')} · ${t('missionsUi.dailyClaimedXp', { xp: def.xp })}</span>`;
      else if (task.done) status = `<span style="color:#ffd75e">${t('missionsUi.dailyReady')}</span>`;
      else status = `<span style="opacity:.85">${t('missionsUi.dailyProgress', { cur: task.progress, goal: def.goal })}</span>`;
      const playHint = dailyHint(def.id);
      const playTarget = DAILY_PLAY_TARGETS[def.id];
      const remainder = dailyTaskRemainderText(task, def);
      const modePill = playTarget
        ? `<span class="mission-mode-pill">${dailyModeLabel(playTarget.mode)}</span> `
        : '';
      const almostTag = almost ? ` <span class="almost-tag">${t('missionsUi.dailyAlmost')}</span>` : '';
      el.innerHTML = `${modePill}<b>${dailyText(def.id)}</b>${isNextUp ? ` <span class="next-up-tag">${t('missionsUi.dailyNextUp')}</span>` : ''}${almostTag}<br>${status}` +
        (remainder && !task.done ? `<div style="color:#7cf5ff;font-size:12px;margin-top:4px;font-weight:700">${remainder}</div>` : '') +
        (playHint && !task.done ? `<div style="opacity:.75;font-size:12px;margin-top:4px">${playHint}</div>` : '') +
        `<div style="opacity:.8;font-size:13px;margin-top:4px">${t('missionsUi.dailyReward', { xp: def.xp })}</div>` +
        `<div class="xpline" style="margin-top:8px"><div style="width:${pct}%"></div></div>`;
      if (claimable) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn claim-btn';
        btn.innerHTML = t('missionsUi.dailyClaimBtn', { xp: def.xp }) +
          `<small>${dailyClaimPathHint(claimedN, readyN)}</small>`;
        bindPress(btn, () => safeUiAction(() => {
          AudioSys.sfx('select');
          claimDailyTask(task.id);
        }, 'claimDaily/' + task.id, 'Claim mislukt — probeer opnieuw'));
        el.appendChild(btn);
      } else if (!task.done && playTarget) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn mission-play-btn';
        btn.textContent = t('missionsUi.dailyPlayBtn', { mode: dailyModeLabel(playTarget.mode) });
        bindPress(btn, () => safeUiAction(() => goDailyPlayTarget(task.id), 'dailyPlay/' + task.id, 'Kon modus niet openen'));
        el.appendChild(btn);
      }
      dailyHost.appendChild(el);
    }
    const bonusBtn = document.getElementById('dailyBonusBtn');
    if (bonusBtn) {
      const ready = claimedN === 3 && !save.daily.dayBonusClaimed;
      const label = bonusBtn.querySelector('div');
      bonusBtn.classList.toggle('mission-bonus-pulse', ready);
      if (save.daily.dayBonusClaimed) {
        bonusBtn.style.display = 'flex';
        bonusBtn.disabled = true;
        bonusBtn.classList.add('done');
        if (label) label.innerHTML = t('missionsUi.bonusClaimed') + `<small>${t('missionsUi.bonusTomorrow')}</small>`;
      } else {
        bonusBtn.classList.remove('done');
        bonusBtn.style.display = 'flex';
        bonusBtn.disabled = !ready;
        bonusBtn.style.opacity = ready ? '1' : '0.45';
        if (label) {
          const streakN = save.stats.dailyBonusCount || 0;
          const streakHint = ready
            ? (streakN >= 6
              ? t('missionsUi.bonusStreakAlmost')
              : t('missionsUi.bonusStreakHint', { n: streakN + 1 }))
            : '';
          label.innerHTML = ready
            ? t('missionsUi.bonusClaimBtn') + `<small>${t('missionsUi.bonusTap')}${streakHint ? ' · ' + streakHint : ''}</small>`
            : t('missionsUi.bonusNeed') + `<small>${(3 - claimedN) === 1 ? t('missionsUi.bonusNeed1') : t('missionsUi.bonusNeedN', { n: 3 - claimedN })}</small>`;
        }
      }
    }
    const achSum = document.getElementById('achSummary');
    const gotN = Object.keys(save.achievements).length;
    const nearN = ACHIEVEMENTS.filter(a => !save.achievements[a.id] && achievementProgressFrac(a) >= 0.5).length;
    if (achSum) {
      achSum.textContent = t('missionsUi.achSummary', { got: gotN, total: ACHIEVEMENTS.length }) +
        (nearN ? ` · ${t('missionsUi.achNear', { n: nearN })}` : '');
    }
    const achFilterHost = document.getElementById('achFilterBar');
    if (achFilterHost) {
      const cur = this.achFilter || 'all';
      const mk = (id, label) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-ach-filter="${id}">${label}</button>`;
      achFilterHost.innerHTML =
        mk('all', t('missionsUi.filterAll')) + mk('near', t('missionsUi.filterNear')) +
        mk('open', t('missionsUi.filterOpen')) + mk('done', t('missionsUi.filterDone'));
      achFilterHost.querySelectorAll('[data-ach-filter]').forEach((btn) => {
        bindPress(btn, () => {
          AudioSys.sfx('select');
          UI.achFilter = btn.dataset.achFilter || 'all';
          UI.renderMissions();
        });
      });
    }
    const achSpot = document.getElementById('achSpotlight');
    if (achSpot) {
      const near = nearestAchievement();
      const showSpot = step === 0 && near;
      if (showSpot) {
        const pct = Math.min(100, Math.round(near.frac * 100));
        achSpot.style.display = 'block';
        achSpot.innerHTML =
          `<div class="mission-spot-title">${t('missionsUi.spotlightTitle')}</div>` +
          `<b>${achIconSvg(near.ach.id)} ${achLabel(near.ach, 'name')}</b>` +
          `<div class="mission-spot-desc">${achLabel(near.ach, 'desc')}${near.hint ? ` · ${near.hint}` : ''}</div>` +
          `<div class="xpline" style="margin-top:8px;height:6px"><div style="width:${pct}%"></div></div>` +
          `<div class="mission-spot-foot">${t('missionsUi.spotlightFoot', { pct })}</div>`;
      } else {
        achSpot.style.display = 'none';
        achSpot.innerHTML = '';
      }
    }
    achHost.innerHTML = '';
    const today = todayKey();
    const achSortKey = (ach) => {
      const got = save.achievements[ach.id];
      if (got === today) return [0, 0, ach.name];
      if (!got) {
        const p = achievementProgressFrac(ach);
        if (p >= 0.5) return [1, -p, ach.name];
        if (p > 0) return [2, -p, ach.name];
        return [3, 0, ach.name];
      }
      return [4, got, ach.name];
    };
    const sortedAch = [...ACHIEVEMENTS].sort((a, b) => {
      const ka = achSortKey(a);
      const kb = achSortKey(b);
      for (let i = 0; i < 3; i++) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return 1;
      }
      return 0;
    });
    for (const ach of sortedAch) {
      const got = save.achievements[ach.id];
      const frac = achievementProgressFrac(ach);
      const filter = this.achFilter || 'all';
      if (filter === 'near' && (got || frac < 0.5)) continue;
      if (filter === 'open' && got) continue;
      if (filter === 'done' && !got) continue;
      const el = document.createElement('div');
      const isNew = got === today;
      const near = !got && frac >= 0.5;
      el.className = 'card' + (got ? '' : ' locked') + (isNew ? ' ach-card new' : '') + (near ? ' ach-near' : '');
      el.style.borderColor = got ? (isNew ? '#7cf5ff' : '#ffd75e') : undefined;
      const pct = Math.min(100, Math.round(frac * 100));
      const progBar = got ? '' : `<div class="xpline" style="margin-top:6px;height:5px"><div style="width:${pct}%"></div></div>`;
      el.innerHTML = `<div class="cname">${achIconSvg(ach.id)} ${achLabel(ach, 'name')}${isNew ? ' · ' + t('missionsUi.badgeNew') : ''}${near ? ' · ' + t('missionsUi.badgeNear') : ''}</div>` +
        `<div class="cinfo">${achLabel(ach, 'desc')}${got ? ` · ${SVG_CHECK_MINI} ` + got : (() => {
          const hint = achievementProgressHint(ach);
          return hint ? ' · ' + hint : ' · ' + t('missionsUi.stillOpen');
        })()}</div>${progBar}`;
      achHost.appendChild(el);
    }
  },

  renderHosting() {
    const linkEl = document.getElementById('hostingLink');
    const hintEl = document.getElementById('hostingHint');
    const curEl = document.getElementById('hostingCurrent');
    const badgeEl = document.getElementById('hostingHostBadge');
    const openBtn = document.getElementById('btnOpenPlayLink');
    if (!linkEl) return;
    loadHostingBundle()
      .then(({ hosting, liveUrl }) => {
        const stable = withShareRevParam(
          canonicalPagesPlayUrl(hosting) || (!isTunnelHostUrl(liveUrl) && liveUrl) || headLiveFromPage(),
          (hosting && hosting.shareCacheRev) || SW_CACHE_REV,
        );
        const short = (u) => String(u || '').replace(/^https:\/\//, '');
        if (stable && !isTunnelHostUrl(stable)) {
          linkEl.innerHTML =
            `<div style="opacity:.8;margin-bottom:4px">Vaste speel-link (GitHub Pages) — deel deze</div>` +
            `<a href="${stable}" style="color:#7cf5ff;font-weight:800" rel="noopener">${short(stable)}</a>`;
        } else {
          linkEl.textContent = withShareRevParam('https://brennyz.github.io/stickman-fighter/speel.html', SW_CACHE_REV);
        }
        const kind = playHostKind();
        if (badgeEl) {
          const labels = {
            pages: 'GitHub Pages — stabiele deel-link',
            tunnel: 'Tunnel (dev) — deel nooit deze URL',
            netlify: 'Netlify — export save bij URL-wissel',
            local: 'Lokaal — deel GitHub Pages met vrienden',
            file: 'Lokaal bestand — deel GitHub Pages',
            other: 'Online host',
          };
          const colors = {
            pages: '#6ee06e',
            tunnel: '#ffb86a',
            netlify: '#7cf5ff',
            local: '#a8b8e8',
            file: '#a8b8e8',
            other: '#cfe0ff',
          };
          badgeEl.innerHTML =
            `<span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;color:${colors[kind] || '#cfe0ff'};background:rgba(0,0,0,.28);border:1px solid ${colors[kind] || '#cfe0ff'}55">Speel via: ${labels[kind] || kind}</span>`;
        }
        if (openBtn) {
          openBtn.classList.toggle('tog-alert', kind === 'tunnel');
          const lab = openBtn.querySelector('div');
          if (lab) {
            lab.innerHTML = kind === 'tunnel'
              ? 'Open GitHub Pages (deel-link)<small>Tunnel is alleen thuis-dev</small>'
              : 'Open vaste link<small>speel.html op GitHub Pages</small>';
          }
        }
        const onTunnel = onTunnelHost();
        if (curEl) {
          // Tunnel-URL nooit tonen op Pages — voorkomt per ongeluk delen met vrienden
          if (onTunnel && location.protocol !== 'file:') {
            curEl.style.display = 'block';
            curEl.textContent =
              'Dev-sessie (niet delen): ' + location.href.split('?')[0].split('#')[0] +
              ' · Deel alleen de Pages-link hierboven';
          } else {
            curEl.style.display = 'none';
            curEl.textContent = '';
          }
        }
        let hint = hosting.stableHint || '';
        if (!hint) {
          if (stable && String(stable).includes('github.io')) {
            hint = 'Primair: GitHub Pages — bookmark speel.html (Safari → Delen → Zet op beginscherm). Tunnel is alleen thuis-dev.';
          } else if (location.hostname.endsWith('.github.io')) hint = 'Je speelt via GitHub Pages — deel speel.html met vrienden.';
          else if (location.hostname.endsWith('.netlify.app')) hint = 'Netlify-host — export save bij URL-wissel.';
          else hint = 'Gebruik de vaste Pages-link hierboven; tunnel nooit als deel-link.';
        }
        if (onTunnel) {
          hint += ' Tunnel offline/503? Open de vaste GitHub Pages-link (primair).';
        }
        if (hosting.netlifyUrl && hosting.netlifyReadyAfter) {
          hint += ` Netlify (${hosting.netlifyUrl}) kan Forbidden geven tot ~${hosting.netlifyReadyAfter}.`;
        }
        if (hintEl) hintEl.textContent = hint;
      })
      .catch(() => {
        linkEl.textContent = 'https://brennyz.github.io/stickman-fighter/speel.html';
        if (hintEl) hintEl.textContent = 'Primair: GitHub Pages speel.html — export save bij URL-wissel.';
      });
  },

  renderLevels() {
    try {
    bumpLevelHoldGen();
    const bar = document.getElementById('levelIslandBar');
    const info = document.getElementById('levelIslandInfo');
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    const pick = this.advIslandPick || currentAdvIsland();
    this.advIslandPick = pick;
    if (bar) {
      bar.innerHTML = '';
      for (const isl of ADVENTURE_ISLANDS) {
        const ok = islandUnlocked(isl.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'island-tab' + (pick === isl.id ? ' active' : '') + (ok ? '' : ' locked');
        btn.style.setProperty('--isl-accent', isl.accent);
        const prog = islandProgress(isl.id);
        const pct = Math.round(prog.cleared / prog.total * 100);
        const islName = islandLabel(isl.id, 'name');
        const islSub = islandLabel(isl.id, 'sub');
        btn.innerHTML = `<span class="island-tab-ico">${isl.icon}</span>` +
          `<span class="island-tab-n">${isl.id}</span><span class="island-tab-name">${islName}</span>` +
          `<span class="island-prog-track island-tab-prog"><i style="width:${pct}%;background:${isl.accent}"></i></span>` +
          (ok ? '' : `<span class="island-tab-lock">${SVG_LOCK_ICON}</span>`);
        btn.title = ok ? `${islName} · ${islSub}` : t('ui.helpIslandLocked', { lv: isl.id * LEVELS_PER_ISLAND });
        if (ok) {
          bindPress(btn, () => safeUiAction(() => {
            AudioSys.sfx('select');
            UI.advIslandPick = isl.id;
            UI.renderLevels();
          }, 'pickIsland/' + isl.id, t('ui.errPickIsland')));
        }
        bar.appendChild(btn);
      }
    }
    const islMeta = ADVENTURE_ISLANDS[pick - 1] || ADVENTURE_ISLANDS[0];
    const range = islandLevelRange(pick);
    const wCap = adventureWeaponCapForLevel(range.start);
    const prog = islandProgress(pick);
    const pct = Math.round(prog.cleared / prog.total * 100);
    if (info) {
      const mb = save.advMasterBuff;
      info.innerHTML =
        `<div class="island-info-head">` +
        `<span class="island-info-ico">${islMeta.icon}</span>` +
        `<div class="island-info-text">` +
        `<b style="color:${islMeta.accent}">${islandLabel(islMeta.id, 'name')}</b> · ${islandLabel(islMeta.id, 'sub')}` +
        `<div class="island-info-sub">${t('ui.islandInfoSub', { cap: wCap, cleared: prog.cleared, total: prog.total, stars: prog.stars })}` +
        (pick < 5 ? t('ui.islandBossGate', { lv: pick * LEVELS_PER_ISLAND }) : '') +
        `</div></div></div>` +
        `<div class="island-prog-track island-info-prog" title="${t('island.levelsProg')}"><i style="width:${pct}%;background:${islMeta.accent}"></i></div>` +
        `<div class="island-prog-track island-info-stars" title="${t('island.starsProg')}"><i style="width:${Math.round(prog.stars / Math.max(1, prog.maxStars) * 100)}%"></i></div>` +
        (() => {
          const onboard = adventureIslandHintLine();
          const mbLine = mb && mb >= range.start && mb <= range.end
            ? `<span class="island-info-chip master">${t('ui.masterBuffChip', { lv: mb })}</span>`
            : '';
          const chips = [
            onboard ? `<span class="island-info-chip onboard">${onboard}</span>` : '',
            mbLine,
          ].filter(Boolean).join('');
          return chips ? `<div class="island-info-chips">${chips}</div>` : '';
        })();
    }
    grid.innerHTML = '';
    for (let n = range.start; n <= range.end; n++) {
      const el = document.createElement('div');
      const boss = !!BOSS_AT[n];
      const locked = n > save.unlocked;
      const infoLv = buildLevel(n);
      const rar = rarityOf(infoLv.rarityCap);
      const fails = advFailCount(n);
      el.className = 'lvl' + (boss ? ' boss' : '') + (locked ? ' locked' : '') + (n < save.unlocked ? ' cleared' : '') +
        (!locked && n === save.unlocked ? ' lvl-current' : '') +
        (save.advMasterBuff === n ? ' master-buff' : '');
      el.style.boxShadow = locked ? 'none' : `0 5px 0 rgba(0,0,0,.35), 0 0 0 2px ${rar.color}55`;
      const waveStrip = infoLv.waves.map((_, wi) => {
        const meta = infoLv.waveMeta && infoLv.waveMeta[wi];
        const trait = meta && meta.trait;
        const isBossPip = boss && wi === infoLv.waves.length - 1;
        let cls = 'lvl-wave-dot';
        if (isBossPip) cls += ' boss';
        else if (trait === 'flyers') cls += ' trait-fly';
        else if (trait === 'rush') cls += ' trait-rush';
        else if (trait === 'elite') cls += ' trait-elite';
        return `<i class="${cls}"></i>`;
      }).join('');
      el.innerHTML = locked
        ? SVG_LOCK_ICON
        : `${n}${boss ? `<small>${t('ui.boss')}</small>` : `<small style="color:${rar.color}">${rarityLabel(infoLv.rarityCap)}</small>`}` +
          `<span class="lvl-wave-strip" aria-hidden="true">${waveStrip}</span>` +
          (save.stars[n] ? `<span class="lvl-stars">${'★'.repeat(save.stars[n])}</span>` : '') +
          (fails > 0 && !locked ? `<span class="lvl-fails">${fails}/5</span>` : '') +
          (save.advMasterBuff === n ? '<span class="lvl-master">+20%</span>' : '');
      if (!locked) {
        const best = save.stars[n] || 0;
        el.title = levelTileTip(n, pick, infoLv, boss, best, fails);
        let holdT = null;
        let holdSkip = false;
        let holdX = 0;
        let holdY = 0;
        el.addEventListener('pointerdown', (e) => {
          const tapId = e.pointerId;
          const holdGen = _levelHoldGen;
          holdSkip = false;
          holdX = e.clientX;
          holdY = e.clientY;
          holdT = setTimeout(() => {
            holdT = null;
            if (levelHoldGenStale(holdGen) || !levelScreenActive()) return;
            if (!uiTapAllowed({ pointerId: tapId })) return;
            holdSkip = true;
            safeUiAction(() => {
              AudioSys.sfx('select');
              try { cancelGambleStart(); } catch (_) {}
              pendingAdvLevel = n;
              lastGambleRoll = null;
              startAdventureFromGamble(true);
              try { UI.toast(t('toast.skipGamble'), 1400); } catch (_) {}
            }, 'skipGamble/' + n, t('ui.errStart'));
          }, 520);
        }, { passive: true });
        const cancelHold = () => { if (holdT) { clearTimeout(holdT); holdT = null; } };
        el.addEventListener('pointermove', (e) => {
          if (!holdT) return;
          const slop = typeof uiTapSlopPx === 'function' ? uiTapSlopPx() : 12;
          if (Math.hypot(e.clientX - holdX, e.clientY - holdY) > slop) cancelHold();
        }, { passive: true });
        el.addEventListener('pointerup', cancelHold);
        el.addEventListener('pointercancel', cancelHold);
        el.addEventListener('click', (e) => {
          if (holdSkip) { holdSkip = false; return; }
          if (!uiTapAllowed(e)) return;
          safeUiAction(() => gokGooiStartLevel(n), 'gokStart/' + n, 'Level starten mislukt');
        });
      }
      grid.appendChild(el);
    }
    } catch (err) {
      sfReportError('renderLevels', err, 'Level-overzicht laden mislukt — herlaad via Verse versie');
    }
  },

  renderGamble(levelN) {
    const head = document.getElementById('gambleHead');
    const diceRow = document.getElementById('gambleDiceRow');
    const sumLine = document.getElementById('gambleSumLine');
    const outEl = document.getElementById('gambleOutcome');
    if (head) head.textContent = t('ui.gambleHead', { island: islandLabel(islandFromLevel(levelN), 'name'), level: levelN });
    const ctx = document.getElementById('gambleIslandCtx');
    if (ctx) {
      const cap = adventureWeaponCapForLevel(levelN);
      ctx.textContent = t('ui.gambleCtx', { cap });
    }
    const onboardEl = document.getElementById('gambleOnboardLine');
    if (onboardEl) {
      const hint = gambleOnboardHintLine();
      if (hint) {
        onboardEl.style.display = 'block';
        onboardEl.textContent = hint;
      } else {
        onboardEl.style.display = 'none';
        onboardEl.textContent = '';
      }
    }
    const g = lastGambleRoll;
    const face = (d) => (typeof gambleDiceFace === 'function' ? gambleDiceFace(d) : '?');
    if (g && diceRow) {
      diceRow.textContent = `${face(g.d1)} ${face(g.d2)}`;
      if (sumLine) sumLine.textContent = t('ui.gambleSumRoll', { d1: g.d1, d2: g.d2, sum: g.sum });
    } else {
      if (diceRow) diceRow.textContent = '? ?';
      if (sumLine) sumLine.textContent = t('ui.gambleSumDefault');
    }
    if (outEl) {
      if (!g) outEl.textContent = t('ui.gamblePreview');
      else {
        outEl.textContent = gambleOutcomeLabelFromKey(g);
        const col = g.outcome === 'superBoss' || g.outcome === 'miniBoss' ? '#ffb0b8'
          : (g.outcome === 'superAlly' || g.outcome === 'ally') ? (GAMBLE_ALLIES[g.allyId]?.color || '#7cf5ff') : '#8fa3d9';
        outEl.style.color = col;
      }
    }
  },

  hideGambleRollFlash() {
    const el = document.getElementById('levelRollFlash');
    if (!el) return;
    el.classList.remove('visible');
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
  },

  showGambleRollFlash(g) {
    const el = document.getElementById('levelRollFlash');
    if (!el || !g) return;
    if (typeof state !== 'undefined' && state === 'play' && typeof game !== 'undefined' && game) {
      this.hideGambleRollFlash();
      return;
    }
    const diceEl = document.getElementById('levelRollDice');
    const sumEl = document.getElementById('levelRollSum');
    const outEl = document.getElementById('levelRollOutcome');
    const face = (d) => (typeof gambleDiceFace === 'function' ? gambleDiceFace(d) : '?');
    if (diceEl) diceEl.textContent = `${face(g.d1)} ${face(g.d2)}`;
    if (sumEl) sumEl.textContent = t('ui.gambleSumRoll', { d1: g.d1, d2: g.d2, sum: g.sum });
    if (outEl) {
      outEl.textContent = typeof gambleOutcomeLabelFromKey === 'function'
        ? gambleOutcomeLabelFromKey(g)
        : (g.outcome || '');
      const col = g.outcome === 'superBoss' || g.outcome === 'miniBoss' ? '#ffb0b8'
        : (g.outcome === 'superAlly' || g.outcome === 'ally') ? (GAMBLE_ALLIES[g.allyId]?.color || '#7cf5ff') : '#8fa3d9';
      outEl.style.color = col;
    }
    el.hidden = false;
    el.removeAttribute('hidden');
    el.setAttribute('aria-hidden', 'false');
    el.classList.add('visible');
  },

  renderWeapons() {
    const sumEl = document.getElementById('weaponSummary');
    if (sumEl) {
      const unlocked = weaponUnlockedCount();
      const advUsable = weaponAdventureUsableCount();
      const br = weaponRarityBreakdown();
      const tierChips = Object.keys(RARITIES).map(rid => {
        const rar = RARITIES[rid];
        const n = br[rid] || 0;
        if (!n) return '';
        return `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color};margin:2px">${rarityLabel(rid)} ${n}</span>`;
      }).filter(Boolean).join(' ');
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Verzameld <b>${unlocked}/${WEAPONS.length}</b> · avontuur <b>${advUsable}</b> bruikbaar` +
        ` · actief <b>${weaponLabel(save.weapon)}</b>` +
        ` · eiland-skill gate: Lv <b>${adventureWeaponCap()}</b>` +
        ((save.stats.weaponFinishers || 0) > 0 ? ` · finishers <b>${save.stats.weaponFinishers}</b>` : '') +
        (tierChips ? `<div style="margin-top:6px;line-height:1.7">${tierChips}</div>` : '');
    }
    const mastEl = document.getElementById('weaponMasteryStrip');
    if (mastEl) {
      const top = weaponMasteryTopList(3);
      if (!top.length) {
        mastEl.style.display = 'none';
        mastEl.innerHTML = '';
      } else {
        mastEl.style.display = 'block';
        mastEl.innerHTML = '<div style="font-size:12px;opacity:.85;margin-bottom:6px">Top stijl-meesterschap</div>' +
          top.map(e =>
            `<span class="rar-pill" style="color:${e.tier.color};border-color:${e.tier.color};margin:2px 4px 2px 0">` +
            `${e.name} · ${e.tier.name} · ${e.finishers}×</span>`
          ).join('') +
          '<div style="font-size:11px;opacity:.65;margin-top:6px">Tiers: Leerling → Virtuoos (3) → Meester (10) → Legende (25)</div>';
      }
    }
    const previewId = this.weaponPreviewId || save.weapon || 'vuist';
    this.paintWeaponPreview(previewId);
    const list = document.getElementById('weaponList');
    if (!list) return;
    list.innerHTML = '';
    for (const base of WEAPONS) {
      const w = applySummonTier(base);
      const lvlLocked = !weaponUnlockedByLevel(base);
      const islandLocked = weaponSkillGated(base);
      const locked = lvlLocked;
      const rar = rarityOf(w.rarity);
      const selected = save.weapon === w.id;
      const previewing = previewId === w.id;
      const el = document.createElement('div');
      el.className = 'card rar-' + w.rarity + (selected ? ' sel' : '') +
        (locked ? ' locked' : '') + (islandLocked && !lvlLocked ? ' island-gated' : '') +
        ((selected || previewing) && !locked ? ' weapon-glow' : '');
      el.style.borderColor = rar.color + (selected ? '' : '66');
      el.style.setProperty('--wp-glow', rar.glow);
      if (w.summoned) el.style.boxShadow = `0 0 14px ${rar.glow}`;
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      if (!locked && rar.order >= 3 && !motionReduced()) {
        cc.save();
        cc.fillStyle = rar.glow;
        cc.beginPath();
        cc.arc(32, 32, 26, 0, TAU);
        cc.fill();
        cc.restore();
      }
      cc.translate(10, 40); cc.rotate(-0.6);
      if (w.id === 'vuist') {
        cc.strokeStyle = '#f2f5ff'; cc.lineWidth = 5; cc.lineCap = 'round';
        cc.beginPath(); cc.moveTo(2, 8); cc.lineTo(24, -6); cc.stroke();
        cc.fillStyle = '#f2f5ff'; cc.beginPath(); cc.arc(28, -9, 7, 0, TAU); cc.fill();
      } else drawWeaponShape(cc, w.id, 0.2);
      el.appendChild(cv);
      const info = document.createElement('div');
      const summonBadge = w.summoned
        ? ` <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">✦ Summon</span>`
        : '';
      const statLine = w.summoned
        ? `${weaponDesc(w)} · schade x${base.dmg} → <b style="color:${rar.color}">x${w.dmg}</b> · bereik ${w.range} · snelheid x${w.speed}`
        : `${weaponDesc(w)} · schade x${w.dmg} · bereik ${w.range} · snelheid x${w.speed}`;
      const labels = weaponMoveLabels(w.id);
      const mast = (save.weaponMastery || {})[w.id];
      const finCount = mast && mast.finishers ? mast.finishers : 0;
      const tier = finCount > 0 ? weaponMasteryTier(w.id) : null;
      const tierBadge = tier && finCount >= 3
        ? ` <span class="rar-pill" style="color:${tier.color};border-color:${tier.color}">${tier.name}</span>`
        : '';
      const mastLine = finCount ? ` · ${finCount}× finisher` : '';
      const upLv = weaponUpgradeEligible(base) ? itemUpgradeLevel('weapon', w.id) : 0;
      const upMax = weaponUpgradeEligible(base) ? itemUpgradeMax('weapon', w.id) : 0;
      const upBadge = upLv > 0
        ? ` <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">↑ Lv ${upLv}/${upMax}</span>`
        : '';
      const upLine = weaponUpgradeEligible(base) && (upLv > 0 || itemUpgradeShards('weapon', w.id) > 0)
        ? `<div class="cinfo" style="opacity:.82;font-size:12px;margin-top:3px">${weaponUpgradeSummary(w.id)}</div>`
        : '';
      const moveLine = labels
        ? `① ${labels[0]} · ② ${labels[1]} · ③ ${labels[2]} finisher${mastLine}`
        : (isThrowWeapon(w.id) ? 'Werp-projectiel — geen melee-combo' : '');
      const islandLine = islandLocked && !lvlLocked
        ? `<div class="cinfo" style="opacity:.82;font-size:12px;margin-top:3px;color:#ffd75e">${t('ui.weaponIslandPick', { cap: adventureWeaponCap() })}</div>`
        : '';
      info.innerHTML = `<div class="cname">${weaponLabel(w)} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(w.rarity)}</span>${summonBadge}${tierBadge}${upBadge}</div>
        <div class="cinfo">${statLine}</div>` +
        upLine +
        (moveLine ? `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${moveLine}</div>` : '') +
        islandLine;
      el.appendChild(info);
      if (weaponUpgradeEligible(base)) appendItemUpgradeButton(el, 'weapon', w.id, () => this.renderWeapons());
      const right = document.createElement('div');
      right.className = 'right';
      right.innerHTML = lvlLocked
        ? `${SVG_LOCK_ICON} Lv ${base.unlock}`
        : (islandLocked
          ? t('ui.weaponIslandCapShort', { cap: adventureWeaponCap() })
          : (selected ? '&#10004; gekozen' : 'kies'));
      el.appendChild(right);
      el.addEventListener('pointerenter', () => {
        if (locked) return;
        if (this.weaponPreviewId === w.id) return;
        this.weaponPreviewId = w.id;
        this.paintWeaponPreview(w.id);
      });
      if (!locked) bindPress(el, () => {
        if (!uiTapAllowed()) return;
        safeUiAction(() => {
          save.weapon = w.id;
          this.weaponPreviewId = w.id;
          if (!persistOrToast('wapen')) return;
          playWeaponPickFeedback(w.id);
          if (islandLocked) UI.toast(t('toast.weaponIslandCap', { cap: adventureWeaponCap() }), 2800);
          this.renderWeapons();
        }, 'pickWeapon/' + w.id, 'Wapen kiezen mislukt');
      });
      list.appendChild(el);
    }
  },

  paintWeaponPreview(weaponId) {
    const host = document.getElementById('weaponPreview');
    const cv = document.getElementById('weaponPreviewCanvas');
    const nameEl = document.getElementById('weaponPreviewName');
    const rarEl = document.getElementById('weaponPreviewRar');
    const statsEl = document.getElementById('weaponPreviewStats');
    if (!host || !cv) return;
    const base = WEAPONS.find(w => w.id === weaponId) || WEAPONS[0];
    if (!base) { host.hidden = true; return; }
    const w = applySummonTier(base);
    const rar = rarityOf(w.rarity);
    const locked = !weaponUnlockedByLevel(base);
    host.hidden = false;
    host.classList.toggle('is-glow', !locked);
    host.style.setProperty('--wp-glow', rar.glow);
    host.style.setProperty('--wp-color', rar.color);
    if (nameEl) {
      nameEl.textContent = locked ? '???' : weaponLabel(w);
      nameEl.style.color = locked ? '#8fa3d9' : '#fff';
    }
    if (rarEl) {
      rarEl.innerHTML = locked
        ? `<span class="rar-pill" style="color:#8fa3d9;border-color:#8fa3d9">Lv ${base.unlock}</span>`
        : `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(w.rarity)}</span>` +
          (save.weapon === w.id ? ' <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">Actief</span>' : '');
    }
    if (statsEl) {
      statsEl.textContent = locked
        ? 'Nog vergrendeld — level verder in avontuur'
        : `${weaponDesc(w)} · x${w.dmg} dmg · bereik ${w.range} · spd x${w.speed}`;
    }
    const c = cv.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, cv.width, cv.height);
    c.imageSmoothingEnabled = true;
    if (!locked) {
      const g = c.createRadialGradient(60, 62, 8, 60, 62, 52);
      g.addColorStop(0, rar.glow);
      g.addColorStop(0.55, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 120, 120);
      if (!motionReduced() && rar.order >= 2) {
        c.strokeStyle = rar.color;
        c.globalAlpha = 0.35;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(60, 62, 40, 0, TAU);
        c.stroke();
        c.globalAlpha = 1;
      }
    } else {
      c.fillStyle = 'rgba(20,24,36,.55)';
      c.fillRect(8, 8, 104, 104);
    }
    c.save();
    c.translate(28, 78);
    c.rotate(-0.55);
    c.scale(1.55, 1.55);
    if (locked) c.globalAlpha = 0.35;
    if (w.id === 'vuist') {
      c.strokeStyle = '#f2f5ff'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(2, 8); c.lineTo(24, -6); c.stroke();
      c.fillStyle = '#f2f5ff'; c.beginPath(); c.arc(28, -9, 7, 0, TAU); c.fill();
    } else if (typeof drawWeaponShape === 'function') {
      drawWeaponShape(c, w.id, performance.now() / 1000);
    }
    c.restore();
  },

  openUpgrades(tab) {
    this.upgradeTab = tab || 'skills';
    this.safeOpen('upgradeScreen', () => this.renderUpgrades(), {
      msg: 'Upgrades laden mislukt — herlaad via Verse versie',
    });
  },

  renderUpgrades() {
    const tab = this.upgradeTab || 'skills';
    const head = document.getElementById('upgradeScreenHead');
    const sub = document.getElementById('upgradeScreenSub');
    if (head) head.textContent = t('ui.skillHead');
    const subKeys = {
      skills: 'ui.upgradeSubSkills',
      weapon: 'ui.upgradeSubWeapons',
      pet: 'ui.upgradeSubPets',
      style: 'ui.upgradeSubStyle',
    };
    if (sub) sub.textContent = t(subKeys[tab] || 'ui.skillSub');
    const bar = document.getElementById('upgradeTabBar');
    if (bar) {
      const tabs = [
        { id: 'skills', label: t('ui.skillTabSkills'), ready: countSkillUpgradesReady() },
        { id: 'weapon', label: t('ui.skillTabWeapons'), ready: countItemUpgradesReady('weapon') },
        { id: 'pet', label: t('ui.skillTabPets'), ready: countItemUpgradesReady('pet') },
        { id: 'style', label: t('ui.skillTabStyle'), ready: countItemUpgradesReady('style') },
      ];
      bar.innerHTML = tabs.map((tb) =>
        `<button type="button" role="tab" aria-selected="${tab === tb.id ? 'true' : 'false'}" ` +
        `class="dex-filter-btn${tab === tb.id ? ' active' : ''}" data-upgrade-tab="${tb.id}">${tb.label}` +
        (tb.ready > 0 ? `<span class="upgrade-tab-badge">${tb.ready}</span>` : '') +
        `</button>`
      ).join('');
      if (!bar.dataset.bound) {
        bar.dataset.bound = '1';
        bar.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-upgrade-tab]');
          if (!btn) return;
          AudioSys.sfx('select');
          UI.upgradeTab = btn.getAttribute('data-upgrade-tab') || 'skills';
          UI.renderUpgrades();
        });
      }
    }
    const sumEl = document.getElementById('upgradeSummary');
    if (sumEl) {
      const skillShards = save.stats?.skillShards || 0;
      const itemShards = save.stats?.itemShards || 0;
      const ready = countAllUpgradesReady();
      sumEl.style.display = 'block';
      if (tab === 'skills') {
        const activeJ = activeJutsuId();
        const activeName = `<b style="color:${SKILL_DEFS[activeJ]?.color || '#7cf5ff'}">${skillLabel(activeJ)}</b>`;
        sumEl.innerHTML =
          `${t('ui.jutsuActive', { name: activeName })} · ` +
          `Totaal <b>${totalAllUpgradeLevels()}</b> upgrade-levels · ` +
          `<b>${skillShards}</b> skill · <b>${itemShards}</b> item shards` +
          (ready > 0 ? ` · <b style="color:#ffd75e">${t('ui.upgradeReady', { n: ready })}</b>` : '') +
          `<div class="upgrade-shard-hint">${t('ui.upgradeShardHint')}</div>` +
          `<div style="font-size:11px;opacity:.72;margin-top:4px">${t('ui.jutsuSelectHint')}</div>`;
      } else {
        sumEl.innerHTML =
          `Totaal <b>${totalAllUpgradeLevels()}</b> upgrade-levels · ` +
          `<b>${skillShards}</b> skill · <b>${itemShards}</b> item shards` +
          (ready > 0 ? ` · <b style="color:#ffd75e">${t('ui.upgradeReady', { n: ready })}</b>` : '') +
          `<div class="upgrade-shard-hint">${t('ui.upgradeShardHint')}</div>` +
          `<div style="font-size:11px;opacity:.72;margin-top:4px">Standaard max Lv ${UPGRADE_MAX_STANDARD} · mythische/extreme max Lv ${UPGRADE_MAX_EXTREME}</div>`;
      }
    }
    if (tab === 'skills') this.renderUpgradeSkills();
    else this.renderUpgradeItems(tab);
  },

  renderUpgradeSkills() {
    const list = document.getElementById('skillList');
    if (!list) return;
    list.innerHTML = '';
    const groups = [
      { id: 'jutsu', title: t('ui.skillGroupJutsu'), ids: JUTSU_SKILL_IDS },
      { id: 'utility', title: t('ui.skillGroupUtility'), ids: SKILL_IDS.filter((id) => SKILL_DEFS[id].group === 'utility') },
    ];
    for (const g of groups) {
      const hdr = document.createElement('div');
      hdr.className = 'skill-group-head';
      hdr.textContent = g.title;
      list.appendChild(hdr);
      for (const id of g.ids) {
        const def = SKILL_DEFS[id];
        const lv = skillLevel(id);
        const maxLv = skillMaxLevel(id);
        const shards = skillShards(id);
        const cost = skillUpgradeCost(id);
        const canUp = skillCanUpgrade(id);
        const equipped = def.group === 'jutsu' && activeJutsuId() === id;
        const unlocked = def.group === 'jutsu' ? jutsuSkillUnlocked(id) : (lv >= 1 || id === 'rasengan');
        const el = document.createElement('div');
        el.className = 'card skill-card upgrade-polish-card' + (canUp ? ' claimable' : '') + (lv >= maxLv ? ' claimed' : '') + (equipped ? ' sel' : '');
        el.style.borderColor = def.color + (equipped ? '' : '88');
        el.style.setProperty('--up-accent', def.color);
        const name = skillLabel(id);
        const now = skillUpgradeSummary(id);
        const next = skillNextStepPreview(id);
        const shardLine = cost != null
          ? t('ui.skillShards', { cur: shards, cost })
          : t('ui.skillMax');
        const desc = skillDesc(id);
        const statusLine = def.group === 'jutsu'
          ? (equipped ? t('ui.skillEquipped') : (unlocked ? t('ui.skillEquipHint') : t('ui.skillLocked', { lv: 1 })))
          : (lv >= 1 ? t('ui.skillPassiveActive') : t('ui.skillPassiveLocked', { lv: 1 }));
        el.innerHTML =
          `<div class="upgrade-icon-orb skill-orb-swatch" style="--orb-c:${def.color}" aria-hidden="true">` +
          `<span class="upgrade-swatch-core" style="background:${def.color}"></span></div>` +
          `<div class="skill-card-body"><div class="cname" style="color:${def.color}">${name} ` +
          `<span class="rar-pill" style="color:${def.color};border-color:${def.color}">${t('ui.skillLevel', { lv, max: maxLv })}</span>` +
          (equipped ? ` <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">${t('ui.skillEquipped')}</span>` : '') +
          `</div>` +
          (desc ? `<div class="cinfo" style="opacity:.82;font-size:12px">${desc}</div>` : '') +
          `<div class="cinfo">${shardLine}</div>` +
          `<div class="cinfo" style="opacity:.78;font-size:11px;margin-top:3px">${statusLine}</div>` +
          `<div class="cinfo" style="opacity:.88;font-size:12px;margin-top:4px"><b>${t('ui.skillNow')}:</b> ${now}</div>` +
          (next ? `<div class="cinfo" style="opacity:.75;font-size:11px;margin-top:3px"><b>${t('ui.skillNext')}:</b> ${next}</div>` : '') +
          (def.group === 'jutsu' ? `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:4px">${equipped ? t('ui.jutsuEquipped') : t('ui.jutsuTapEquip')}</div>` : '') +
          `</div>`;
        appendUpgradeOrbRow(el, lv, maxLv, def.color);
        if (def.group === 'jutsu' && unlocked && !equipped) {
          const eqBtn = document.createElement('button');
          eqBtn.type = 'button';
          eqBtn.className = 'btn claim-btn';
          eqBtn.textContent = t('ui.skillEquip');
          eqBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            safeUiAction(() => {
              if (!setActiveJutsu(id)) return;
              AudioSys.sfx('select');
              this.renderUpgrades();
            }, 'equipJutsu/' + id, 'Jutsu kiezen mislukt');
          });
          el.appendChild(eqBtn);
        }
        if (canUp) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn claim-btn';
          btn.textContent = t('ui.skillUpgrade') + ` (${cost})`;
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            safeUiAction(() => {
              if (!trySkillUpgrade(id)) return;
              AudioSys.sfx('levelup');
              const nlv = skillLevel(id);
              UI.toast(t('toast.skillUpgraded', { name, lv: nlv, detail: skillUpgradeSummary(id) }), 3200);
              this.renderUpgrades();
            }, 'skillUp/' + id, 'Upgrade mislukt');
          });
          el.appendChild(btn);
        }
        list.appendChild(el);
      }
    }
  },

  renderUpgradeItems(cat) {
    const list = document.getElementById('skillList');
    if (!list) return;
    list.innerHTML = '';
    let items = [];
    if (cat === 'weapon') {
      items = WEAPONS.filter((w) => weaponUpgradeEligible(w)).map((w) => ({
        id: w.id, color: rarityOf(w.rarity).color,
      }));
    } else if (cat === 'pet') {
      items = PET_ROSTER.filter((p) => petUpgradeEligible(p)).map((p) => {
        const sp = SPECIES[p.speciesId];
        return { id: p.id, color: sp ? rarityOf(sp.rarity).color : '#7cf5ff' };
      });
    } else if (cat === 'style') {
      items = STYLES.filter((st) => styleUpgradeEligible(st)).map((st) => ({
        id: st.id, color: st.accent || '#c792ff',
      }));
    }
    items.sort((a, b) => itemUpgradeLevel(cat, b.id) - itemUpgradeLevel(cat, a.id));
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'step-card upgrade-empty';
      const emptyKeys = {
        weapon: 'ui.upgradeEmptyWeapons',
        pet: 'ui.upgradeEmptyPets',
        style: 'ui.upgradeEmptyStyle',
      };
      empty.textContent = t(emptyKeys[cat] || 'ui.skillSub');
      list.appendChild(empty);
      return;
    }
    for (const it of items) {
      list.appendChild(buildUpgradeItemCard(cat, it.id, it.color, () => this.renderUpgrades()));
    }
  },

  renderDex() {
    const sumEl = document.getElementById('dexSummary');
    if (sumEl) {
      const totalHp = dexHpBonus();
      const kills = dexTotalKills();
      const br = dexRarityBreakdown();
      const tierChips = Object.keys(RARITIES).map(rid => {
        const rar = RARITIES[rid];
        const n = br[rid] || 0;
        if (!n) return '';
        return `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color};margin:2px">${rarityLabel(rid)} ${n}</span>`;
      }).filter(Boolean).join(' ');
      const cosmetic = dexCosmeticProgressLines();
      const cosmeticHtml = cosmetic.length
        ? `<div class="dex-cosmetic-row">${cosmetic.map(c => {
            const pct = Math.min(100, Math.round(c.cur / c.goal * 100));
            return `<div class="dex-cosmetic-chip"><b>${c.name}</b> ${c.cur}/${c.goal} ${c.label}` +
              `<div class="xpline" style="margin-top:5px;height:6px"><div style="width:${pct}%"></div></div></div>`;
          }).join('')}</div>`
        : '';
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Boek <b>${dexCount()}/${SPECIES_ORDER.length}</b> · kills <b>${kills}</b> · bonus max HP <b>+${totalHp}</b>` +
        ` · rariteiten <b>${dexRarityTierCount()}/6</b>` +
        `<div class="dex-mini-row">${dexMiniStat('HP', totalHp, SPECIES_ORDER.length * 25, '#6ee06e')}` +
        `${dexMiniStat('Kills', kills, 150, '#ffd75e')}</div>` +
        (tierChips ? `<div style="margin-top:6px;line-height:1.7">${tierChips}</div>` : '') +
        cosmeticHtml +
        dexNextAchievementHtml();
    }
    const bindFilterBar = (host, attr, stateKey, mkButtons, renderFn) => {
      if (!host) return;
      host.innerHTML = mkButtons();
      host.querySelectorAll(`[${attr}]`).forEach((btn) => {
        bindPress(btn, () => {
          AudioSys.sfx('select');
          UI[stateKey] = btn.getAttribute(attr) || 'all';
          (renderFn || (() => UI.renderDex())).call(UI);
        });
      });
    };
    const rarityTotals = dexRarityTotals();
    bindFilterBar(document.getElementById('dexFilterBar'), 'data-dex-filter', 'dexRarityFilter', () => {
      const cur = this.dexRarityFilter || 'all';
      const mk = (id, label, color) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-dex-filter="${id}"` +
        (color ? ` style="--dex-filter-color:${color}"` : '') + `>${label}</button>`;
      return mk('all', `Alle ${dexCount()}/${SPECIES_ORDER.length}`) +
        Object.keys(RARITIES).map(rid => {
          const rar = RARITIES[rid];
          const n = (dexRarityBreakdown()[rid] || 0);
          const tot = rarityTotals[rid] || 0;
          return mk(rid, `${rarityLabel(rid)} ${n}/${tot}`, rar.color);
        }).join('');
    });
    bindFilterBar(document.getElementById('dexTypeFilterBar'), 'data-dex-type-filter', 'dexTypeFilter', () => {
      const cur = this.dexTypeFilter || 'all';
      const mk = (id, label) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-dex-type-filter="${id}">${label}</button>`;
      const types = [];
      const seen = new Set();
      for (const id of SPECIES_ORDER) {
        const t = SPECIES[id].type;
        if (!seen.has(t)) { seen.add(t); types.push(t); }
      }
      return mk('all', 'Alle types') +
        types.map(t => mk(t, MONSTER_TYPE_LABEL[t] || t)).join('');
    });
    bindFilterBar(document.getElementById('dexSortBar'), 'data-dex-sort', 'dexSortKey', () => {
      const cur = this.dexSortKey || 'book';
      const mk = (id, label) =>
        `<button type="button" class="dex-filter-btn${cur === id ? ' active' : ''}" data-dex-sort="${id}">${label}</button>`;
      return mk('book', 'Boek') + mk('rarity', 'Rariteit') + mk('unlock', 'Unlock Lv') + mk('kills', 'Kills');
    });
    const list = document.getElementById('dexList');
    if (!list) return;
    list.innerHTML = '';
    const filter = this.dexRarityFilter || 'all';
    const typeFilter = this.dexTypeFilter || 'all';
    const sortKey = this.dexSortKey || 'book';
    const topKillId = dexTopKillId();
    for (const id of dexSortedIds(filter, typeFilter, sortKey)) {
      const sp = SPECIES[id];
      const kills = save.dex[id] || 0;
      const rar = rarityOf(sp.rarity);
      const unlockLv = UNLOCK_AT[id];
      const canMeet = !kills && unlockLv != null && unlockLv <= save.unlocked;
      const el = document.createElement('div');
      el.className = 'card' + (kills ? '' : ' locked') + (canMeet ? ' dex-available' : '') +
        (kills && rar.order >= 3 ? ' dex-glow' : '');
      el.style.borderColor = kills ? rar.color : (canMeet ? '#7cf5ff88' : undefined);
      if (kills && rar.order >= 3) el.style.setProperty('--dex-glow', rar.glow);
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      cc.translate(32, 36);
      const sc = 22 / sp.size;
      cc.scale(sc, sc);
      if (kills) drawMonsterArt(cc, sp, sp.size, 1.3, false, false);
      else {
        cc.globalAlpha = 0.9;
        drawMonsterArt(cc, Object.assign({}, sp, { c1: '#20242e', c2: '#14161e' }), sp.size, 1.3, false, false);
      }
      el.appendChild(cv);
      const info = document.createElement('div');
      const hpB = rarityHpBonus(sp.rarity);
      const typeLbl = MONSTER_TYPE_LABEL[sp.type] || sp.type;
      const statRow = kills
        ? `<div class="dex-mini-row">${dexMiniStat('HP', sp.hp, DEX_REF_STATS.hp, '#6ee06e')}` +
          `${dexMiniStat('ATK', sp.dmg, DEX_REF_STATS.dmg, '#ff7a4d')}` +
          `${dexMiniStat('SPD', sp.speed, DEX_REF_STATS.speed, '#7cf5ff')}</div>`
        : '';
      const lockHint = kills
        ? ''
        : (canMeet
          ? `<div style="color:#7cf5ff;font-size:12px;margin-top:4px">Verschijnt in avontuur · unlock Lv ${unlockLv}</div>`
          : (unlockLv != null
            ? `<div style="opacity:.72;font-size:12px;margin-top:4px">Unlock Lv ${unlockLv}</div>`
            : ''));
      const petLine = PET_BY_SPECIES[id]
        ? `<div style="font-size:12px;margin-top:4px;color:${isPetTamed(PET_BY_SPECIES[id].id) ? '#7cf5ff' : '#8fa3d9'}">${petProgressLine(id)}</div>`
        : '';
      info.innerHTML = `<div class="cname">${kills ? sp.name : '???'} ${kills ? `<span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(sp.rarity)}</span>` : ''}${id === topKillId ? ` <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">${t('ui.topHunter')}</span>` : ''}</div>
        <div class="cinfo">${kills ? `${typeLbl} · basis HP ${sp.hp} · dmg ${sp.dmg} · spd ${sp.speed} · ${sp.xp} XP · Lv ${unlockLv || '?'}` : 'Nog niet verslagen'}</div>${lockHint}${petLine}${statRow}`;
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      right.style.color = rar.color;
      right.innerHTML = kills ? `${kills}x verslagen<br>+${hpB} max HP` : (canMeet ? 'Speel avontuur' : '');
      el.appendChild(right);
      list.appendChild(el);
    }
  },

  renderPets() {
    const tab = this.petTab || 'dex';
    const bar = document.getElementById('petTabBar');
    if (bar) {
      bar.innerHTML =
        `<button type="button" class="dex-filter-btn${tab === 'dex' ? ' active' : ''}" data-pet-tab="dex">Dex · ${petTamedCount()}/${PET_ROSTER.length}</button>` +
        `<button type="button" class="dex-filter-btn${tab === 'egg' ? ' active' : ''}" data-pet-tab="egg">Ei arcade · ${eggOwnedCount()}/${EGG_ROSTER.length}</button>`;
      bar.querySelectorAll('[data-pet-tab]').forEach((btn) => {
        bindPress(btn, () => {
          AudioSys.sfx('select');
          UI.petTab = btn.getAttribute('data-pet-tab') || 'dex';
          UI.renderPets();
        });
      });
    }
    const dexPanel = document.getElementById('petDexPanel');
    const eggPanel = document.getElementById('petEggPanel');
    if (dexPanel) dexPanel.style.display = tab === 'dex' ? '' : 'none';
    if (eggPanel) eggPanel.style.display = tab === 'egg' ? '' : 'none';
    if (tab === 'egg') {
      this.renderEggPets();
      return;
    }
    this.renderDexPets();
  },

  renderDexPets() {
    const sumEl = document.getElementById('petSummary');
    if (sumEl) {
      const tamed = petTamedCount();
      const active = activePetDef();
      const wallet = petCoinsBalance();
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        t('ui.petSummaryTamed', {
          tamed,
          total: PET_ROSTER.length,
          active: active ? SPECIES[active.speciesId].name : t('ui.petNone'),
          wallet,
        }) +
        `<div style="margin-top:6px;font-size:12px;opacity:.85">${t('ui.petCoinTip')}</div>`;
    }
    const list = document.getElementById('petList');
    if (!list) return;
    list.innerHTML = '';
    for (const def of PET_ROSTER) {
      const sp = SPECIES[def.speciesId];
      if (!sp) continue;
      const rar = rarityOf(sp.rarity);
      const kills = save.dex[def.speciesId] || 0;
      const need = petKillNeed(def.speciesId);
      const tamed = isPetTamed(def.id);
      const active = save.activePet === def.id;
      const cost = petCoinCost(def.id);
      const canBuy = canBuyPetWithCoins(def.id);
      const el = document.createElement('div');
      el.className = 'card' + (tamed ? '' : ' locked') + (active ? ' sel' : '') + (canBuy ? ' dex-available' : '');
      el.style.borderColor = tamed ? rar.color : undefined;
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      cc.translate(32, 38);
      cc.scale(0.55, 0.55);
      if (tamed) drawMonsterArt(cc, sp, sp.size, 1.2, false, false);
      else {
        cc.globalAlpha = 0.45;
        drawMonsterArt(cc, Object.assign({}, sp, { c1: '#20242e', c2: '#14161e' }), sp.size, 1.2, false, false);
      }
      el.appendChild(cv);
      const info = document.createElement('div');
      const badge = active ? ' <span class="rar-pill" style="color:#7cf5ff;border-color:#7cf5ff">ACTIEF</span>' : '';
      const upLv = tamed ? itemUpgradeLevel('pet', def.id) : 0;
      const upMax = tamed ? itemUpgradeMax('pet', def.id) : 0;
      const upBadge = upLv > 0 ? ` <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">↑ Lv ${upLv}/${upMax}</span>` : '';
      info.innerHTML = `<div class="cname">${sp.name} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(sp.rarity)}</span>${badge}${upBadge}</div>` +
        `<div class="cinfo">${def.perk}</div>` +
        `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${tamed
          ? 'Getemd · assist in avontuur'
          : (canBuy
            ? `Kopen: ${cost} pet coins`
            : `Temmen: ${Math.min(kills, need)}/${need} kills · of ${cost} 🪙`)}</div>` +
        (tamed && (upLv > 0 || itemUpgradeShards('pet', def.id) > 0)
          ? `<div class="cinfo" style="opacity:.82;font-size:12px;margin-top:3px">${petUpgradeSummary(def.id)}</div>` : '');
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      if (tamed) {
        right.innerHTML = active ? '&#10004; actief' : 'uitrusten';
      } else if (canBuy) {
        right.innerHTML = `kopen<br>${cost} 🪙`;
        right.style.color = '#ff9ad5';
      } else {
        right.textContent = kills > 0 ? `${need - kills} kills` : `${cost} 🪙`;
        right.style.opacity = '0.7';
      }
      el.appendChild(right);
      if (tamed) {
        bindPress(el, () => {
          safeUiAction(() => {
            if (active) {
              equipPet(null);
              UI.toast(t('toast.petNone'), 1400);
            } else {
              equipPet(def.id);
              AudioSys.sfx('select');
              UI.toast(t('toast.petFollow', { name: sp.name }), 2200);
            }
            this.renderPets();
          }, 'equipPet/' + def.id, 'Pet kiezen mislukt');
        });
      } else if (canBuy) {
        bindPress(el, () => {
          safeUiAction(() => {
            const res = buyPetWithCoins(def.id);
            if (!res) {
              UI.toast(t('toast.petNoCoins'), 1800);
              return;
            }
            AudioSys.sfx('summon');
            UI.toast(t('toast.petBought', { name: sp.name }), 2600);
            this.renderPets();
          }, 'buyPet/' + def.id, 'Pet kopen mislukt');
        });
      }
      list.appendChild(el);
    }
  },

  renderEggPets() {
    ensureEggDaily();
    const sum = eggProgressSummary();
    const sumEl = document.getElementById('eggSummary');
    if (sumEl) {
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Verzameld <b>${sum.owned}/${sum.total}</b> · actief <b>${sum.activeName}</b> · <b>${sum.daily}</b>` +
        `<div style="margin-top:6px;font-size:12px;opacity:.85">Cosmetisch — geen combat-boost. 1 dag-ei + bonus-ei na je eerste avontuur-win vandaag.</div>`;
    }
    const crackBtn = document.getElementById('eggCrackBtn');
    if (crackBtn) {
      const ready = canCrackDailyEgg();
      crackBtn.style.display = ready ? '' : 'none';
      crackBtn.innerHTML =
        `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><ellipse cx="12" cy="13" rx="7" ry="9" fill="#ffd75e" opacity=".35"/><path d="M8 10c2-3 6-3 8 0"/></svg></span>` +
        `<div>Dag-ei openen<small>Gratis arcade-pull · vandaag</small></div>`;
      if (!crackBtn.dataset.bound) {
        crackBtn.dataset.bound = '1';
        bindPress(crackBtn, () => {
          safeUiAction(() => {
            const res = crackDailyEgg();
            if (!res) {
              UI.toast(t('toast.eggAlreadyOpened'), 2200);
              return;
            }
            try { AudioSys.sfx('diceRoll'); } catch (_) {}
            const rar = rarityOf(res.def.rarity);
            UI.toast(res.duplicate
              ? t('toast.eggDuplicateUi', { name: res.def.name })
              : t('toast.eggHatch', { name: res.def.name, rarity: rarityLabel(res.def.rarity) }), 3600);
            this.renderPets();
            this.renderMenu();
          }, 'crackDailyEgg', 'Ei openen mislukt');
        });
      }
    }
    const list = document.getElementById('eggList');
    if (!list) return;
    list.innerHTML = '';
    for (const def of EGG_ROSTER) {
      const rar = rarityOf(def.rarity);
      const owned = isEggOwned(def.id);
      const active = save.activeEggPet === def.id;
      const el = document.createElement('div');
      el.className = 'card' + (owned ? '' : ' locked') + (active ? ' sel' : '');
      el.style.borderColor = owned ? rar.color : undefined;
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const cc = cv.getContext('2d');
      cc.translate(32, 36);
      drawEggPetArt(cc, def, 18, 1.1, 0, 0, !owned);
      el.appendChild(cv);
      const info = document.createElement('div');
      const badge = active ? ' <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">ACTIEF</span>' : '';
      info.innerHTML = `<div class="cname">${def.name} <span class="rar-pill" style="color:${rar.color};border-color:${rar.color}">${rarityLabel(def.rarity)}</span>${badge}</div>` +
        `<div class="cinfo">${def.perk}</div>` +
        `<div class="cinfo" style="opacity:.78;font-size:12px;margin-top:3px">${owned ? 'Cosmetisch metgezel' : 'Nog niet uitgekomen'}</div>`;
      el.appendChild(info);
      const right = document.createElement('div');
      right.className = 'right';
      if (owned) {
        right.innerHTML = active ? '&#10004; actief' : 'uitrusten';
      } else {
        right.textContent = '???';
        right.style.opacity = '0.7';
      }
      el.appendChild(right);
      if (owned) {
        bindPress(el, () => {
          safeUiAction(() => {
            if (active) {
              equipEggPet(null);
              UI.toast(t('toast.eggNone'), 1400);
            } else {
              equipEggPet(def.id);
              AudioSys.sfx('select');
              UI.toast(t('toast.eggFloat', { name: def.name }), 2200);
            }
            this.renderPets();
          }, 'equipEggPet/' + def.id, 'Ei-pet kiezen mislukt');
        });
      }
      list.appendChild(el);
    }
  },

  renderStyle() {
    const sumEl = document.getElementById('styleSummary');
    if (sumEl) {
      const unlocked = STYLES.filter(s => styleUnlocked(s)).length;
      const active = styleById(save.style || 'classic');
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `Outfits <b>${unlocked}/${STYLES.length}</b> · actief <b>${styleLabel(active)}</b>` +
        `<div style="margin-top:6px;font-size:12px;opacity:.85">Elke stijl heeft een eigen bonus — hover of lees de tooltip. Cosmetisch + lichte combat-perks.</div>`;
    }
    const grid = document.getElementById('styleGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const st of STYLES) {
      const ok = styleUnlocked(st);
      const el = document.createElement('div');
      el.className = 'style-card' + (save.style === st.id ? ' sel' : '') + (ok ? '' : ' locked');
      el.style.borderColor = ok ? st.accent + '88' : '';
      el.title = styleLabel(st, 'tooltip') || styleLabel(st, 'hint') || styleLabel(st);
      const cv = document.createElement('canvas');
      cv.width = 72; cv.height = 72;
      const cc = cv.getContext('2d');
      cc.translate(36, 58); cc.scale(0.85, 0.85);
      const preview = new Fighter({ isPlayer: true, x: 0, y: 0, color: st.body, style: st, scale: 0.9 });
      preview.animT = 0.4;
      preview.draw(cc);
      el.appendChild(cv);
      const cap = document.createElement('div');
      cap.style.fontSize = '13px';
      cap.style.color = st.accent;
      cap.textContent = styleLabel(st);
      el.appendChild(cap);
      const bonus = document.createElement('div');
      bonus.style.fontSize = '11px';
      bonus.style.fontWeight = '800';
      bonus.style.color = ok ? '#7cf5ff' : '#8fa3d9';
      bonus.style.marginTop = '3px';
      bonus.textContent = styleCombatLine(st);
      bonus.style.opacity = ok ? '1' : '0.55';
      el.appendChild(bonus);
      const tip = document.createElement('div');
      tip.style.fontSize = '10px';
      tip.style.opacity = '0.72';
      tip.style.marginTop = '4px';
      tip.style.lineHeight = '1.35';
      tip.textContent = styleLabel(st, 'tooltip') || styleLabel(st, 'hint');
      el.appendChild(tip);
      const sub = document.createElement('div');
      sub.style.fontSize = '11px';
      sub.style.fontWeight = '600';
      sub.style.opacity = '0.75';
      sub.style.marginTop = '4px';
      sub.textContent = ok ? (save.style === st.id ? t('ui.styleActive') : t('ui.stylePick'))
        : (styleSkillGated(st) ? t('ui.styleIslandGate', { cap: adventureWeaponCap(), need: st.needLvl || '?' }) : styleLabel(st, 'hint'));
      el.appendChild(sub);
      if (ok) {
        bindPress(el, () => {
          safeUiAction(() => {
            save.style = st.id;
            if (!persistOrToast('stijl')) return;
            AudioSys.sfx('select');
            this.renderStyle();
            this.renderMenu();
            UI.toast(t('toast.styleEquipped', { name: styleLabel(st) }), 2200);
          }, 'pickStyle/' + st.id, 'Stijl kiezen mislukt');
        });
      }
      grid.appendChild(el);
    }
  },

  renderSkills() {
    initSkillScreenChrome();
    renderSupers();
    const sumEl = document.getElementById('skillSummary');
    if (sumEl) {
      const unlocked = skillUnlockedCount();
      const active = skillById(save.skill || 'rasengan');
      const sagaChips = SKILL_SAGA_ORDER.map(sid => {
        const c = skillSagaCounts(sid);
        const meta = vsSagaMeta(sid);
        return `<span class="rar-pill" style="color:#cfe0ff;border-color:rgba(255,255,255,.22);margin:2px">${meta.label} ${c.unlocked}/${c.total}</span>`;
      }).join(' ');
      sumEl.style.display = 'block';
      sumEl.innerHTML =
        `${t('ui.skillSummaryHead')} <b>${unlocked}/${SKILLS.length}</b> · ${t('ui.skillSummaryActive')} ` +
        `<b style="color:${active.color}">${skillLabel(active)}</b> · ${t('ui.skillGateLine', { cap: adventureWeaponCap() })}` +
        `<div style="margin-top:6px;line-height:1.7">${sagaChips}</div>` +
        `<div style="margin-top:6px;font-size:12px;opacity:.85">${t('ui.skillSummarySub')}</div>`;
    }
    const nextEl = document.getElementById('skillNextUnlock');
    if (nextEl) {
      const next = skillNextUnlock();
      if (next && !skillUnlocked(next)) {
        nextEl.style.display = 'block';
        const need = Math.max(0, (next.needLvl || 1) - save.lvl);
        if (skillSkillGated(next) && save.lvl >= (next.needLvl || 1)) {
          nextEl.innerHTML = t('ui.skillNextIsland', { name: skillLabel(next), cap: adventureWeaponCap() });
        } else if (need > 0) {
          nextEl.innerHTML = t('ui.skillNextUnlock', { name: skillLabel(next), lvl: next.needLvl, need });
        } else {
          nextEl.innerHTML = t('ui.skillNextUnlockSoon', { name: skillLabel(next), lvl: next.needLvl });
        }
      } else {
        nextEl.style.display = 'none';
        nextEl.innerHTML = '';
      }
    }
    const saga = UI.skillSagaFilter || 'all';
    const behavior = UI.skillBehaviorFilter || 'all';
    const blurbEl = document.getElementById('skillSagaBlurb');
    if (blurbEl) blurbEl.textContent = skillSagaBlurb(saga);
    const sagaBar = document.getElementById('skillSagaBar');
    if (sagaBar) {
      sagaBar.querySelectorAll('[data-saga]').forEach((btn) => {
        const sid = btn.dataset.saga || 'all';
        btn.classList.toggle('active', sid === saga);
        const c = skillSagaCounts(sid);
        let badge = btn.querySelector('.saga-count');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'saga-count';
          btn.appendChild(badge);
        }
        badge.textContent = ` (${c.unlocked}/${c.total})`;
      });
    }
    const behBar = document.getElementById('skillBehaviorBar');
    if (behBar) {
      const behLabels = {
        all: t('ui.skillBehAll'),
        orb: t('skill.behavior.orb'),
        dash: t('skill.behavior.dash'),
        beam: t('skill.behavior.beam'),
        disc: t('skill.behavior.disc'),
        pull: t('skill.behavior.pull'),
        meteor: t('skill.behavior.meteor'),
      };
      behBar.querySelectorAll('[data-behavior]').forEach((btn) => {
        const id = btn.dataset.behavior || 'all';
        if (behLabels[id]) btn.textContent = behLabels[id];
        btn.classList.toggle('active', id === behavior);
      });
    }
    const sortBtn = document.getElementById('btnSkillSort');
    if (sortBtn) {
      const mode = UI.skillSortMode || 'level';
      sortBtn.textContent = t('ui.skillSort_' + mode);
    }
    const previewId = UI.skillPreviewId || save.skill || 'rasengan';
    const filtered = sortSkills(skillsForFilters(saga, behavior), UI.skillSortMode || 'level');
    if (!filtered.some(s => s.id === previewId)) {
      UI.skillPreviewId = filtered[0] ? filtered[0].id : (save.skill || 'rasengan');
    }
    updateSkillPreview();
    const grid = document.getElementById('skillGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'char-grid-empty';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = t('ui.skillEmptyFilter');
      grid.appendChild(empty);
      return;
    }
    for (const sk of filtered) {
      const ok = skillUnlocked(sk);
      const el = document.createElement('div');
      el.className = 'style-card skill-card' + (save.skill === sk.id ? ' sel' : '') + (ok ? '' : ' locked') +
        (UI.skillPreviewId === sk.id ? ' preview-hov' : '');
      el.dataset.id = sk.id;
      el.style.borderColor = ok ? sk.color + '88' : '';
      el.title = skillLabel(sk, 'tooltip') || skillLabel(sk, 'hint') || skillLabel(sk);
      const cv = document.createElement('canvas');
      cv.width = 72; cv.height = 72;
      const cc = cv.getContext('2d');
      cc.translate(36, 38);
      if (typeof drawJutsuOrb === 'function') {
        drawJutsuOrb(cc, 0, 0, 22, 0.6, sk.id, ok ? 1 : 0.45);
      } else {
        cc.fillStyle = sk.color;
        cc.beginPath(); cc.arc(0, 0, 20, 0, TAU); cc.fill();
      }
      el.appendChild(cv);
      const cap = document.createElement('div');
      cap.style.fontSize = '13px';
      cap.style.color = sk.color;
      cap.textContent = skillLabel(sk);
      el.appendChild(cap);
      const beh = document.createElement('div');
      beh.className = 'skill-beh-badge';
      beh.style.color = sk.color;
      beh.textContent = skillBehaviorLabelI18n(sk) + ' · ×' + (sk.dmgMul || 2).toFixed(1);
      el.appendChild(beh);
      const bonus = document.createElement('div');
      bonus.style.fontSize = '11px';
      bonus.style.fontWeight = '800';
      bonus.style.color = ok ? '#7cf5ff' : '#8fa3d9';
      bonus.style.marginTop = '3px';
      bonus.textContent = skillCombatLine(sk);
      bonus.style.opacity = ok ? '1' : '0.55';
      el.appendChild(bonus);
      const sub = document.createElement('div');
      sub.style.fontSize = '11px';
      sub.style.fontWeight = '600';
      sub.style.opacity = '0.75';
      sub.style.marginTop = '4px';
      sub.textContent = ok ? (save.skill === sk.id ? t('ui.skillActive') : t('ui.skillPickHint'))
        : (skillSkillGated(sk) ? t('ui.skillIslandGate', { lvl: sk.needLvl }) : skillLabel(sk, 'hint'));
      el.setAttribute('role', 'button');
      el.tabIndex = ok ? 0 : -1;
      el.appendChild(sub);
      grid.appendChild(el);
    }
    requestAnimationFrame(() => {
      const fKey = (UI.skillSagaFilter || 'all') + '|' + (UI.skillBehaviorFilter || 'all') + '|' + (UI.skillSortMode || 'level');
      const shouldScroll = UI._skillScrollFilterKey !== fKey;
      UI._skillScrollFilterKey = fKey;
      if (!shouldScroll) return;
      const pick = grid.querySelector('.skill-card.preview-hov, .skill-card.sel');
      if (pick) pick.scrollIntoView({ block: 'nearest', behavior: IS_TOUCH ? 'auto' : 'smooth' });
    });
  },

  renderSettings() {
    renderLangSwitch();
    const verEl = document.getElementById('setAppVersion');
    if (verEl) {
      const fps = Perf.emaMs > 0 ? Math.round(1000 / Perf.emaMs) : 0;
      const perfNote = save.liteFx
        ? 'Lite FX'
        : (Perf.tier >= 2 ? `adaptief zwaar · ~${fps} fps` : Perf.tier >= 1 ? `adaptief · ~${fps} fps` : `vloeiend · ~${fps} fps`);
      verEl.textContent = `v${APP_VERSION} · SW v${SW_CACHE_REV} · ${perfNote}`;
    }
    const perfEl = document.getElementById('setPerfLine');
    if (perfEl) {
      const p = perfFxSummary();
      perfEl.textContent = formatPerfStripLine(p);
    }
    const healthEl = document.getElementById('saveHealthLine');
    if (healthEl) {
      const h = saveHealthSummary();
      const sizeLine = (h.primaryBytes || h.backupBytes)
        ? ` · ~${formatSaveBytes(h.primaryBytes || h.backupBytes)}`
        : '';
      let statusPrimary = h.primaryCorrupt
        ? '⚠ Hoofd-save corrupt'
        : (h.primaryValid ? `${SVG_CHECK_MINI} Save OK` : (h.primaryOk ? '⚠ Save onleesbaar' : '⚠ Geen primary save'));
      if (h.drift && h.backupOk) {
        statusPrimary += h.driftDetail
          ? ` · ${h.driftDetail} — tik Herstel backup`
          : ' · hoofd/backup verschillen — tik Herstel backup';
      }
      if (h.backupCorrupt && h.backupOk === false && h.primaryValid) {
        statusPrimary += ' · backup corrupt (hoofd OK)';
      }
      let healthHtml =
        `<b>Lv ${h.lvl}</b> · unlock ${h.unlocked} · boek ${h.dex} · kills ${h.kills}` +
        (h.summons ? ` · ✦ ${h.summons} summon` : '') +
        (h.pets ? ` · pet ${h.pets}` : '') +
        (h.eggs ? ` · ei ${h.eggs}` : '') +
        `${sizeLine}<br>` +
        statusPrimary +
        (h.backupOk ? ` · ${SVG_CHECK_MINI} Backup (Lv ${h.backupLvl})` : ' · ⚠ Geen backup');
      if (h.drift && h.backupOk) {
        healthHtml += `<br><span style="opacity:.85;color:#ffd75e">Drift: ${h.driftDetail || 'hoofd ≠ backup'} — Herstel backup óf Sync backup</span>`;
      }
      if (h.saveAgeDays != null && h.saveAgeDays >= 14) {
        healthHtml += `<br><span style="opacity:.75;color:#ffb0b8">Laatste save ${h.saveAgeDays} dagen geleden — export als vangnet</span>`;
      }
      if (h.stampAt) {
        let stampLabel = '';
        try {
          const d = new Date(h.stampAt);
          if (!Number.isNaN(d.getTime())) {
            stampLabel = d.toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' });
          }
        } catch (_) {}
        if (stampLabel) {
          healthHtml += `<br><span style="opacity:.7">Laatst opgeslagen: ${stampLabel}</span>`;
        }
      }
      healthEl.innerHTML = healthHtml +
        `<br><span style="opacity:.75">Export schema v${h.exportSchema || SAVE_EXPORT_SCHEMA} · keys vast: ${SAVE_KEY} + backup (niet hernoemen)</span>`;
    }
    const exportHint = document.getElementById('saveExportHint');
    if (exportHint) {
      exportHint.textContent = `Export bevat: ${saveExportSummaryLine()} · key ${SAVE_KEY}`;
    }
    bindSavePortPreview();
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const mPct = volPct(save.musicVol, 0.85);
    const sPct = volPct(save.sfxVol, 1);
    setVal('setMusicVol', mPct);
    setVal('setSfxVol', sPct);
    const lblM = document.getElementById('setMusicVolLbl');
    const lblS = document.getElementById('setSfxVolLbl');
    if (lblM) lblM.textContent = mPct + '%';
    if (lblS) lblS.textContent = sPct + '%';
    ['setShake', 'setHaptics', 'setComboHud', 'setBigTouch', 'setReducedMotion', 'setLiteFx', 'setHighContrast'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const keys = ['shake', 'haptics', 'comboHud', 'bigTouch', 'reducedMotion', 'liteFx', 'highContrast'];
      const key = keys[i];
      let off = save[key] === false;
      if (key === 'reducedMotion') off = !save.reducedMotion && !systemPrefersReducedMotion();
      if (key === 'highContrast') off = !save.highContrast && !systemPrefersMoreContrast();
      el.classList.toggle('off', off);
    });
    document.getElementById('togMusic')?.classList.toggle('off', !save.music);
    document.getElementById('togSfx')?.classList.toggle('off', !save.sfx);
    const audioEl = document.getElementById('settingsAudioStatus');
    if (audioEl) {
      const base = audioMixStatusLine(state === 'pause');
      let sampleLine = t('settings.sfxSamplesLoad');
      if (AudioSys._samplesReady) sampleLine = t('settings.sfxSamplesOn') + ` (${AudioSys._sampleCount})`;
      else if (AudioSys._sampleLoadStarted && !AudioSys._sampleCount) sampleLine = t('settings.sfxSamplesOff');
      audioEl.textContent = base + ' · ' + sampleLine;
    }
    const a11yEl = document.getElementById('a11yStatusLine');
    if (a11yEl) a11yEl.textContent = a11yStatusText();
  },

  renderPausePerfStrip() {
    const el = document.getElementById('pausePerfStrip');
    if (!el) return;
    if (!game || state !== 'pause') {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.textContent = formatPerfStripLine();
    el.style.display = 'block';
  },

  renderPauseToggles() {
    const togM = document.getElementById('pauseTogMusic');
    const togS = document.getElementById('pauseTogSfx');
    togM?.classList.toggle('off', !save.music);
    togS?.classList.toggle('off', !save.sfx);
    if (togM) togM.setAttribute('aria-pressed', save.music ? 'true' : 'false');
    if (togS) togS.setAttribute('aria-pressed', save.sfx ? 'true' : 'false');
    document.getElementById('togMusic')?.classList.toggle('off', !save.music);
    document.getElementById('togSfx')?.classList.toggle('off', !save.sfx);
    const pm = document.getElementById('pauseMusicVol');
    const ps = document.getElementById('pauseSfxVol');
    const pmL = document.getElementById('pauseMusicVolLbl');
    const psL = document.getElementById('pauseSfxVolLbl');
    const mPct = volPct(save.musicVol, 0.85);
    const sPct = volPct(save.sfxVol, 1);
    if (pm && document.activeElement !== pm) pm.value = String(mPct);
    if (ps && document.activeElement !== ps) ps.value = String(sPct);
    if (pmL) pmL.textContent = mPct + '%';
    if (psL) psL.textContent = sPct + '%';
    const statusEl = document.getElementById('pauseAudioStatus');
    if (statusEl) {
      let line = audioMixStatusLine(true);
      if (typeof navigator.onLine === 'boolean' && !navigator.onLine) {
        line += ' · Offline — save op dit apparaat';
      }
      statusEl.textContent = line;
    }
  },

  hideVersionUpdateDialog() {
    const ov = document.getElementById('versionUpdateOverlay');
    if (ov) ov.hidden = true;
    const actions = document.getElementById('versionUpdateActions');
    if (actions) actions.replaceChildren();
  },

  _versionUpdateBtn(label, cls, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn mode-btn big-touch ' + (cls || 'b-gray');
    const div = document.createElement('div');
    div.textContent = label;
    btn.appendChild(div);
    btn.addEventListener('click', () => {
      try { AudioSys.sfx('select'); } catch (_) {}
      this.hideVersionUpdateDialog();
      onClick();
    });
    return btn;
  },

  showVersionUpdateBeforeReload(opts) {
    opts = opts || {};
    const ov = document.getElementById('versionUpdateOverlay');
    const title = document.getElementById('versionUpdateTitle');
    const body = document.getElementById('versionUpdateBody');
    const actions = document.getElementById('versionUpdateActions');
    if (!ov || !title || !body || !actions) {
      if (opts.onSkip) opts.onSkip();
      return;
    }
    title.textContent = t('versionUpdate.beforeTitle');
    body.textContent = opts.hasProgress
      ? t('versionUpdate.beforeBodyProgress', { summary: opts.summary || '', version: APP_VERSION })
      : t('versionUpdate.beforeBodyFresh', { version: APP_VERSION });
    actions.replaceChildren();
    if (opts.hasProgress) {
      actions.appendChild(this._versionUpdateBtn(t('versionUpdate.backupAndGo'), 'b-continue', () => {
        if (opts.onBackup) opts.onBackup();
      }));
    }
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.goWithout'), 'b-gray', () => {
      if (opts.onSkip) opts.onSkip();
    }));
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.cancel'), 'b-gray', () => {
      if (opts.onCancel) opts.onCancel();
    }));
    ov.hidden = false;
  },

  showVersionUpdateRestore(opts) {
    opts = opts || {};
    const stash = opts.stash;
    const ov = document.getElementById('versionUpdateOverlay');
    const title = document.getElementById('versionUpdateTitle');
    const body = document.getElementById('versionUpdateBody');
    const actions = document.getElementById('versionUpdateActions');
    if (!ov || !title || !body || !actions || !stash) return;
    title.textContent = t('versionUpdate.afterTitle');
    body.textContent = t('versionUpdate.afterBody', {
      from: stash.fromApp || '?',
      to: APP_VERSION,
      stashSummary: stash.summary || saveExportSummaryLine(stash.save),
      currentSummary: opts.currentSummary || saveExportSummaryLine(),
    });
    actions.replaceChildren();
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.useStash'), 'b-continue', () => {
      if (opts.onUse) opts.onUse();
    }));
    actions.appendChild(this._versionUpdateBtn(t('versionUpdate.keepCurrent'), 'b-gray', () => {
      if (opts.onSkip) opts.onSkip();
    }));
    ov.hidden = false;
  },

  showResult(win, data) {
    if (!data) return;
    // Actief gevecht → geen stale resultaat over nieuwe run heen
    if (state === 'play' && game && !game.over) return;
    // Na win/lose: altijd resultaat — ook na pauze→menu terwijl gameRef nog pending was
    if (state === 'menu' && game && !game.over) return;
    try {
    this.lastResult = data;
    const title = document.getElementById('resTitle');
    if (!title) throw new Error('result DOM missing');
    title.textContent = data.title;
    title.className = 'bigres ' + (win ? 'win' : 'lose');
    const detailEl = document.getElementById('resDetail');
    if (detailEl) detailEl.textContent = data.detail;
    const lootEl = document.getElementById('resLoot');
    if (lootEl) {
      const html = formatRunLootHtml(game && game.runLoot, data.mode);
      if (html) {
        lootEl.innerHTML = html;
        lootEl.style.display = 'block';
      } else {
        lootEl.innerHTML = '';
        lootEl.style.display = 'none';
      }
    }
    const xpEl = document.getElementById('resXp');
    if (xpEl) {
      xpEl.textContent = t('result.xp', {
        xp: data.xp, lvl: save.lvl, cur: save.xp, need: xpNeed(save.lvl),
      });
    }
    const tipEl = document.getElementById('resTip');
    if (tipEl) tipEl.textContent = data.tip || '';
    const starsEl = document.getElementById('resStars');
    if (starsEl) {
      const n = win && data.stars ? data.stars : 0;
      const prev = data.prevStars ?? 0;
      if (!n) {
        starsEl.textContent = '';
        starsEl.className = 'stars-big';
      } else {
        const delta = n > prev ? n - prev : 0;
        starsEl.className = 'stars-big' + (delta ? ' stars-improved' : '') + (n >= 3 ? ' stars-perfect' : '');
        starsEl.innerHTML = '★'.repeat(n) + '☆'.repeat(3 - n) +
          (delta ? `<small class="stars-delta">${t('result.starGain', { n: delta })}</small>` : '');
      }
    }
    const nextBtn = document.getElementById('resNext');
    if (nextBtn) {
      nextBtn.style.display = (win && data.mode === 'adventure' && data.level < MAX_LEVEL) ? 'flex' : 'none';
    }
    const again = document.getElementById('resAgain');
    if (again) {
      const label = again.querySelector('div');
      if (label) {
        if (data.mode === 'versus') label.innerHTML = t('result.rematch') + '<small>' + t('result.rematchSub') + '</small>';
        else if (data.mode === 'training') label.innerHTML = t('result.again') + '<small>vs RabbitRobot</small>';
        else label.textContent = t('result.again');
      }
    }
    state = 'result';
    scheduleResize();
    document.getElementById('pauseBtn')?.classList.remove('show');
    this.show('resultScreen');
    AudioSys.setPaused(false);
    playMenuBgm(true);
    AudioSys.applyVolumes();
    } catch (err) {
      sfReportError('showResult', err, 'Resultaat hiccup — probeer Opnieuw / Menu');
      // NOOIT stil naar startscherm: forceer result-screen best-effort
      try {
        state = 'result';
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const rs = document.getElementById('resultScreen');
        if (rs) {
          rs.classList.add('active');
          const title = document.getElementById('resTitle');
          if (title && data && data.title) title.textContent = data.title;
        } else {
          ensureVisibleScreen();
        }
      } catch (_) {
        try { ensureVisibleScreen(); } catch (__) {}
      }
    }
  },
};

