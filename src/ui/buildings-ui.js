/* ======================== BUILDINGS UX ======================== */
/** Overview → detail → upgrade sheet. Collect is one tap on the resource pill. */

function buildingsEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildingsT(key, fallback, params) {
  if (typeof tOr === 'function') return tOr(key, fallback, params);
  if (!params) return fallback || key;
  let out = String(fallback || key);
  for (const [k, v] of Object.entries(params)) out = out.split('{' + k + '}').join(String(v));
  return out;
}

function buildingsRow(id) {
  if (typeof buildingDescModel === 'function') return buildingDescModel(id);
  if (typeof buildingTooltipModel === 'function') return buildingTooltipModel(id);
  return null;
}

function buildingsArtHtml(row, size) {
  const src = (row && row.artSrc) || (typeof buildingArtSrc === 'function' ? buildingArtSrc(row && row.id) : null) || {};
  const pixel = src.pixel || ('assets/buildings/' + (row && row.id) + '.svg');
  const stroke = src.stroke || src.hub || 'assets/buttons/hub/buildings.svg';
  const w = size || 48;
  return '<img class="buildings-art-img" data-buildings-art="' + buildingsEsc(row && row.id) + '"'
    + ' src="' + buildingsEsc(pixel) + '" alt="" width="' + w + '" height="' + w + '"'
    + ' decoding="async" draggable="false"'
    + ' onerror="this.onerror=null;this.src=\'' + buildingsEsc(stroke) + '\'">';
}

function buildingsIds() {
  return (typeof BUILDING_IDS !== 'undefined' && BUILDING_IDS.length)
    ? BUILDING_IDS
    : ['stick_lighter', 'woodchip_glue', 'chipping_wood', 'bamboo_boesa', 'echo_whistle'];
}

if (typeof UI === 'object' && UI) {
  UI.buildingsView = UI.buildingsView || 'list';
  UI.buildingsFocusId = UI.buildingsFocusId || null;
  UI.buildingsTick = UI.buildingsTick || 0;

  UI.openBuildings = function openBuildings() {
    this.buildingsView = 'list';
    this.buildingsFocusId = null;
    this.stopBuildingsTick();
    this.safeOpen('buildingsScreen', () => this.renderBuildings(), {
      msg: buildingsT('buildings.loadFail', 'Fabrieken laden mislukt'),
    });
    this.startBuildingsTick();
  };

  UI.startBuildingsTick = function startBuildingsTick() {
    this.stopBuildingsTick();
    const self = this;
    this.buildingsTick = setInterval(() => {
      const scr = document.getElementById('buildingsScreen');
      if (!scr || !scr.classList.contains('active')) {
        self.stopBuildingsTick();
        return;
      }
      try { self.renderBuildings({ quiet: true }); } catch (_) {}
    }, 1000);
  };

  UI.stopBuildingsTick = function stopBuildingsTick() {
    if (this.buildingsTick) {
      try { clearInterval(this.buildingsTick); } catch (_) {}
      this.buildingsTick = 0;
    }
  };

  UI.buildingsGoBack = function buildingsGoBack() {
    if (this.buildingsView === 'upgrade') {
      this.buildingsView = 'detail';
      this.renderBuildings();
      return true;
    }
    if (this.buildingsView === 'detail') {
      this.buildingsView = 'list';
      this.buildingsFocusId = null;
      this.renderBuildings();
      return true;
    }
    this.stopBuildingsTick();
    return false;
  };

  UI.openBuildingDetail = function openBuildingDetail(id) {
    if (!id) return;
    this.buildingsView = 'detail';
    this.buildingsFocusId = id;
    try { if (typeof AudioSys !== 'undefined') AudioSys.sfx('select'); } catch (_) {}
    this.renderBuildings();
  };

  UI.openBuildingUpgrade = function openBuildingUpgrade(id) {
    if (!id) return;
    this.buildingsView = 'upgrade';
    this.buildingsFocusId = id;
    try { if (typeof AudioSys !== 'undefined') AudioSys.sfx('select'); } catch (_) {}
    this.renderBuildings();
  };

  UI.renderBuildings = function renderBuildings() {
    if (typeof buildingTickAll === 'function') buildingTickAll();
    const head = document.getElementById('buildingsScreenHead');
    const sub = document.getElementById('buildingsScreenSub');
    if (head) head.textContent = buildingsT('buildings.title', 'Fabrieken');
    if (sub) {
      sub.textContent = this.buildingsView === 'detail'
        ? buildingsT('buildings.subDetail', 'Tik Ophalen of Upgrade')
        : this.buildingsView === 'upgrade'
          ? buildingsT('buildings.subUpgrade', 'Kosten en wat het volgende level doet')
          : buildingsT('buildings.sub', 'Tik een fabriek · resource = ophalen');
    }
    this.paintBuildingsWallet();
    this.syncBuildingsPanes();
    this.bindBuildingsChrome();
    if (this.buildingsView === 'upgrade') this.paintBuildingsUpgrade(this.buildingsFocusId);
    else if (this.buildingsView === 'detail') this.paintBuildingsDetail(this.buildingsFocusId);
    else this.paintBuildingsOverview();
    this.syncBuildingsBackLabel();
  };

  UI.syncBuildingsPanes = function syncBuildingsPanes() {
    const overview = document.getElementById('buildingsOverview');
    const detail = document.getElementById('buildingsDetail');
    const sheet = document.getElementById('buildingsUpgradeSheet');
    const view = this.buildingsView || 'list';
    if (overview) overview.hidden = view !== 'list';
    if (detail) detail.hidden = view !== 'detail' && view !== 'upgrade';
    if (sheet) {
      sheet.hidden = view !== 'upgrade';
      sheet.setAttribute('aria-hidden', view === 'upgrade' ? 'false' : 'true');
    }
    const scr = document.getElementById('buildingsScreen');
    if (scr) scr.setAttribute('data-buildings-view', view);
  };

  UI.syncBuildingsBackLabel = function syncBuildingsBackLabel() {
    const back = document.querySelector('#buildingsScreen .back-btn[data-back]');
    if (!back) return;
    const ico = back.querySelector('.back-btn-ico');
    const label = this.buildingsView === 'list'
      ? buildingsT('back.collect', '← Collectie')
      : buildingsT('buildings.backList', '← Fabrieken');
    back.textContent = '';
    if (ico) back.appendChild(ico);
    back.appendChild(document.createTextNode(' ' + label.replace(/^←\s*/, '')));
  };

  UI.paintBuildingsWallet = function paintBuildingsWallet() {
    const host = document.getElementById('buildingsWallet');
    if (!host) return;
    const model = (typeof buildingWalletModel === 'function')
      ? buildingWalletModel()
      : { petCoins: Math.max(0, Math.floor(Number(save && save.petCoins) || 0)), resources: [] };
    const pc = model.petCoins || 0;
    let html = '<div class="buildings-wallet-pc">'
      + buildingsT('buildings.walletPc', 'Pet coins {n}', { n: pc })
      + '</div><div class="buildings-wallet-row">';
    const rows = model.resources && model.resources.length
      ? model.resources
      : (typeof buildingResourceIds !== 'undefined' ? buildingResourceIds : []).map((id) => ({
        id, name: id, amount: 0, rate: 0, built: false,
      }));
    for (const res of rows) {
      const hint = res.built && res.rate
        ? buildingsT('buildings.walletRate', '+{n}/uur', { n: res.rate })
        : buildingsT('buildings.walletIdle', '—');
      html += '<div class="buildings-wallet-pill" data-res-id="' + buildingsEsc(res.id) + '">'
        + '<span class="buildings-wallet-name">' + buildingsEsc(res.name) + '</span>'
        + '<b class="buildings-wallet-amt">' + buildingsEsc(res.amount) + '</b>'
        + '<span class="buildings-wallet-hint">' + buildingsEsc(hint) + '</span>'
        + '</div>';
    }
    html += '</div>';
    host.innerHTML = html;
    host.setAttribute('aria-label', buildingsT('buildings.walletAria', 'Je voorraad'));
  };

  UI.paintBuildingsOverview = function paintBuildingsOverview() {
    const list = document.getElementById('buildingsList');
    if (!list) return;
    const byId = {};
    list.querySelectorAll('[data-factory-id]').forEach((el) => {
      byId[el.getAttribute('data-factory-id')] = el;
    });
    for (const id of buildingsIds()) {
      const row = buildingsRow(id);
      if (!row) continue;
      let card = byId[id];
      if (!card) {
        card = document.createElement('div');
        card.setAttribute('role', 'listitem');
        list.appendChild(card);
      }
      card.setAttribute('data-factory-id', id);
      card.className = 'buildings-card'
        + (row.unlocked ? '' : ' is-locked')
        + (row.built ? ' is-built' : ' is-unbuilt')
        + (row.canCollect ? ' is-ready' : '');
      const lvBit = row.built
        ? buildingsT('buildings.levelOf', 'Lv {n}/{max}', { n: row.level, max: row.maxLevel })
        : (row.unlocked
          ? buildingsT('buildings.notBuilt', 'Niet gebouwd')
          : buildingsT('buildings.lockedShort', 'Op slot'));
      const pillCls = 'buildings-res-pill'
        + (row.canCollect ? ' is-collect' : '')
        + (row.built ? '' : ' is-empty');
      const pillLabel = row.built
        ? buildingsT('buildings.pillStored', '{res} {n}', { res: row.resourceName, n: row.pending })
        : buildingsT('buildings.pillRes', '{res}', { res: row.resourceName });
      card.innerHTML =
        '<button type="button" class="buildings-card-hit" data-factory-open="' + buildingsEsc(id) + '">'
        + '<span class="buildings-card-art">' + buildingsArtHtml(row, 56) + '</span>'
        + '<span class="buildings-card-body">'
        + '<span class="buildings-card-name">' + buildingsEsc(row.name) + '</span>'
        + '<span class="buildings-card-lv">' + buildingsEsc(lvBit) + '</span>'
        + '<span class="buildings-card-does">' + buildingsEsc(row.doesLine || row.produceLine || '') + '</span>'
        + '</span></button>'
        + '<button type="button" class="' + pillCls + '" data-buildings-collect="' + buildingsEsc(id) + '"'
        + (row.canCollect ? '' : ' disabled') + '>'
        + buildingsEsc(pillLabel) + '</button>';
    }
  };

  UI.paintBuildingsDetail = function paintBuildingsDetail(id) {
    const host = document.getElementById('buildingsDetail');
    if (!host) return;
    const row = buildingsRow(id);
    if (!row) {
      host.innerHTML = '';
      return;
    }
    const powers = (row.powersDetail || []).map((p) => {
      const on = p.unlocked ? ' is-on' : '';
      return '<li class="buildings-power' + on + '"><b>' + buildingsEsc(p.label) + '</b>'
        + ' <span>rank ' + p.rank + '</span><div>' + buildingsEsc(p.blurb) + '</div></li>';
    }).join('');
    const lockBlock = row.unlockLine
      ? '<div class="buildings-lock">' + buildingsEsc(row.unlockLine) + '</div>'
      : '';
    let primary = '';
    if (row.built) {
      primary += '<button type="button" class="btn mode-btn b-continue big-touch buildings-cta" id="btnBuildingCollect"'
        + (row.canCollect ? '' : ' disabled') + '>'
        + '<span class="ico"><img src="assets/buttons/chrome/claim.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEsc(buildingsT('buildings.collect', 'Ophalen'))
        + '<small>' + buildingsEsc(row.canCollect
          ? buildingsT('buildings.collectSub', '{n} {res} klaar', { n: row.pending, res: row.resourceName })
          : buildingsT('buildings.collectEmpty', 'Hopper leeg — wacht op productie'))
        + '</small></div></button>';
      primary += '<button type="button" class="btn mode-btn b-skills big-touch buildings-cta" id="btnBuildingUpgradeOpen"'
        + (row.level >= row.maxLevel ? ' disabled' : '') + '>'
        + '<span class="ico"><img src="assets/buttons/modes/upgrades.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEsc(buildingsT('buildings.upgrade', 'Upgrade'))
        + '<small>' + buildingsEsc(row.level >= row.maxLevel
          ? buildingsT('buildings.upgradeMax', 'Max level')
          : buildingsT('buildings.upgradeOpen', 'Kosten & volgend level'))
        + '</small></div></button>';
    } else if (row.unlocked) {
      primary += '<button type="button" class="btn mode-btn b-continue big-touch buildings-cta" id="btnBuildingBuild"'
        + (row.canBuild ? '' : ' disabled') + '>'
        + '<span class="ico"><img src="assets/buttons/hub/buildings.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEsc(buildingsT('buildings.build', 'Bouwen'))
        + '<small>' + buildingsEsc(row.nextCostLabel || buildingsT('buildings.buildHint', 'Bouwen als je het kunt betalen'))
        + '</small></div></button>';
    }
    host.innerHTML =
      '<div class="buildings-detail-art">' + buildingsArtHtml(row, 72) + '</div>'
      + '<div class="buildings-detail-name">' + buildingsEsc(row.name)
      + ' <span class="buildings-lv">' + buildingsEsc(row.built
        ? buildingsT('buildings.levelOf', 'Lv {n}/{max}', { n: row.level, max: row.maxLevel })
        : buildingsT('buildings.notBuilt', 'Niet gebouwd'))
      + '</span></div>'
      + '<p class="buildings-detail-blurb">' + buildingsEsc(row.blurb) + '</p>'
      + lockBlock
      + '<div class="buildings-detail-facts">'
      + '<div>' + buildingsEsc(row.produceLine) + '</div>'
      + '<div>' + buildingsEsc(row.powerLine) + '</div>'
      + (row.nextLine ? '<div class="buildings-next">' + buildingsEsc(row.nextLine) + '</div>' : '')
      + '</div>'
      + '<button type="button" class="'
      + (row.canCollect ? 'buildings-res-pill is-collect' : 'buildings-res-pill')
      + '" data-buildings-collect="' + buildingsEsc(row.id) + '">'
      + buildingsEsc(buildingsT('buildings.pillStored', '{res} {n}', { res: row.resourceName, n: row.pending || 0 }))
      + '</button>'
      + '<div class="buildings-cta-row">' + primary + '</div>'
      + (powers ? '<ul class="buildings-power-list">' + powers + '</ul>' : '');
  };

  UI.paintBuildingsUpgrade = function paintBuildingsUpgrade(id) {
    const host = document.getElementById('buildingsUpgradeSheet');
    if (!host) return;
    const row = buildingsRow(id);
    if (!row) {
      host.innerHTML = '';
      return;
    }
    const can = !!row.canUpgrade;
    const atMax = row.built && row.level >= row.maxLevel;
    const reason = !row.built
      ? buildingsT('buildings.needBuild', 'Eerst bouwen')
      : atMax
        ? buildingsT('buildings.upgradeMax', 'Max level')
        : can
          ? buildingsT('buildings.upgradeGo', 'Betaal en +1 level')
          : buildingsT('buildings.upgradeBroke', 'Niet genoeg — {cost}', { cost: row.nextCostLabel || '—' });
    host.innerHTML =
      '<button type="button" class="buildings-sheet-backdrop" data-buildings-sheet-close aria-label="'
      + buildingsEsc(buildingsT('buildings.sheetClose', 'Sluiten')) + '"></button>'
      + '<div class="buildings-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="buildingsUpgradeTitle">'
      + '<h3 id="buildingsUpgradeTitle">' + buildingsEsc(buildingsT('buildings.upgradeTitle', 'Upgrade {name}', { name: row.name })) + '</h3>'
      + '<p class="buildings-sheet-now">' + buildingsEsc(buildingsT('buildings.levelOf', 'Lv {n}/{max}', { n: row.level, max: row.maxLevel }))
      + (row.nextLine ? ' → ' + buildingsEsc(row.nextLine) : '') + '</p>'
      + '<p class="buildings-sheet-cost"><b>' + buildingsEsc(buildingsT('buildings.cost', 'Kosten')) + '</b> '
      + buildingsEsc(row.nextCostLabel || buildingsT('buildings.upgradeMax', 'Max level')) + '</p>'
      + '<p class="buildings-sheet-why">' + buildingsEsc(reason) + '</p>'
      + '<div class="buildings-sheet-actions">'
      + '<button type="button" class="btn tog" data-buildings-sheet-close>' + buildingsEsc(buildingsT('buildings.sheetClose', 'Sluiten')) + '</button>'
      + '<button type="button" class="btn mode-btn b-continue" id="btnBuildingUpgradeDo"'
      + (can ? '' : ' disabled') + '>' + buildingsEsc(buildingsT('buildings.upgrade', 'Upgrade')) + '</button>'
      + '</div></div>';
  };

  UI.bindBuildingsChrome = function bindBuildingsChrome() {
    const list = document.getElementById('buildingsList');
    if (list && !list.dataset.bound) {
      list.dataset.bound = '1';
      list.addEventListener('click', (e) => {
        const pill = e.target.closest('[data-buildings-collect]');
        if (pill) {
          e.preventDefault();
          e.stopPropagation();
          UI.doBuildingCollect(pill.getAttribute('data-buildings-collect'));
          return;
        }
        const open = e.target.closest('[data-factory-open], [data-factory-id]');
        if (open) {
          e.preventDefault();
          UI.openBuildingDetail(open.getAttribute('data-factory-open') || open.getAttribute('data-factory-id'));
        }
      });
    }
    const detail = document.getElementById('buildingsDetail');
    if (detail && !detail.dataset.bound) {
      detail.dataset.bound = '1';
      detail.addEventListener('click', (e) => {
        const pill = e.target.closest('[data-buildings-collect]');
        if (pill) {
          e.preventDefault();
          UI.doBuildingCollect(pill.getAttribute('data-buildings-collect'));
          return;
        }
        if (e.target.closest('#btnBuildingCollect')) {
          e.preventDefault();
          UI.doBuildingCollect(UI.buildingsFocusId);
          return;
        }
        if (e.target.closest('#btnBuildingUpgradeOpen')) {
          e.preventDefault();
          UI.openBuildingUpgrade(UI.buildingsFocusId);
          return;
        }
        if (e.target.closest('#btnBuildingBuild')) {
          e.preventDefault();
          UI.doBuildingBuild(UI.buildingsFocusId);
        }
      });
    }
    const sheet = document.getElementById('buildingsUpgradeSheet');
    if (sheet && !sheet.dataset.bound) {
      sheet.dataset.bound = '1';
      sheet.addEventListener('click', (e) => {
        if (e.target.closest('[data-buildings-sheet-close]')) {
          e.preventDefault();
          UI.buildingsView = 'detail';
          UI.renderBuildings();
          return;
        }
        if (e.target.closest('#btnBuildingUpgradeDo')) {
          e.preventDefault();
          UI.doBuildingUpgrade(UI.buildingsFocusId);
        }
      });
    }
  };

  UI.doBuildingCollect = function doBuildingCollect(id) {
    if (!id || typeof buildingCanCollect !== 'function' || !buildingCanCollect(id)) {
      try { this.toast(buildingsT('buildings.collectEmpty', 'Hopper leeg — wacht op productie'), 1800, { tone: 'warn' }); } catch (_) {}
      return;
    }
    try { if (typeof AudioSys !== 'undefined') { AudioSys.init(); AudioSys.sfx('claim'); } } catch (_) {}
    const res = (typeof buildingCollect === 'function') ? buildingCollect(id) : { ok: false };
    if (res && res.ok && res.amount > 0) {
      const label = (typeof buildingResourceLabel === 'function') ? buildingResourceLabel(res.resourceId) : (res.resourceId || '');
      try {
        this.toast(buildingsT('buildings.collectDone', '+{n} {res} in je voorraad', { n: res.amount, res: label }), 2400, { tone: 'ok' });
      } catch (_) {}
    }
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };

  UI.doBuildingBuild = function doBuildingBuild(id) {
    if (!id) return;
    try { if (typeof AudioSys !== 'undefined') { AudioSys.init(); AudioSys.sfx('select'); } } catch (_) {}
    const res = (typeof buildingBuild === 'function') ? buildingBuild(id) : { ok: false };
    if (res && res.ok) {
      try { if (typeof AudioSys !== 'undefined') AudioSys.sfx('levelup'); } catch (_) {}
      try { this.toast(buildingsT('buildings.buildDone', 'Gebouwd · Lv 1'), 2400, { tone: 'ok' }); } catch (_) {}
    } else {
      const why = (res && res.reason === 'broke')
        ? buildingsT('buildings.upgradeBroke', 'Niet genoeg — {cost}', { cost: '' })
        : buildingsT('buildings.buildFail', 'Bouwen lukte niet');
      try { this.toast(why, 2200, { tone: 'warn' }); } catch (_) {}
    }
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };

  UI.doBuildingUpgrade = function doBuildingUpgrade(id) {
    if (!id) return;
    try { if (typeof AudioSys !== 'undefined') { AudioSys.init(); AudioSys.sfx('select'); } } catch (_) {}
    const res = (typeof buildingUpgrade === 'function') ? buildingUpgrade(id) : { ok: false };
    if (res && res.ok) {
      try { if (typeof AudioSys !== 'undefined') AudioSys.sfx('levelup'); } catch (_) {}
      try {
        this.toast(buildingsT('buildings.upgradeDone', 'Upgrade · Lv {n}', { n: res.level }), 2400, { tone: 'ok' });
      } catch (_) {}
      this.buildingsView = 'detail';
    } else {
      try { this.toast(buildingsT('buildings.upgradeFail', 'Upgrade lukte niet'), 2200, { tone: 'warn' }); } catch (_) {}
    }
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };
}
