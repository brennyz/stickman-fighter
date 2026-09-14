/* ======================== BUILDINGS HOME UI ======================== */
/** List/detail screen for 5 factories. Binds BuildingsSys via buildings-bridge.js. */

function buildingsEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildingsArtHtml(view) {
  const pixel = view.art || '';
  const svg = view.artSvg || ('assets/buildings/' + view.id + '.svg');
  const hub = view.artHub || 'assets/buttons/hub/buildings.svg';
  const alt = buildingsEscape(view.name);
  return '<img class="buildings-art-img" data-buildings-art="' + buildingsEscape(view.id) + '"'
    + ' src="' + buildingsEscape(svg) + '" alt="' + alt + '" width="64" height="64"'
    + ' decoding="async" draggable="false"'
    + ' onerror="this.onerror=null;this.src=\'' + buildingsEscape(hub) + '\'">';
}

if (typeof UI === 'object' && UI) {
  UI.buildingsTick = 0;

  UI.openBuildings = function openBuildings() {
    this.stopBuildingsTick();
    this.safeOpen('buildingsScreen', () => this.renderBuildings(), {
      msg: (typeof tOr === 'function') ? tOr('buildings.loadFail', 'Fabrieken laden mislukt') : 'Fabrieken laden mislukt',
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

  UI.renderBuildings = function renderBuildings() {
    const list = document.getElementById('buildingsList');
    const detail = document.getElementById('buildingsDetail');
    const note = document.getElementById('buildingsApiNote');
    const head = document.getElementById('buildingsScreenHead');
    const sub = document.getElementById('buildingsScreenSub');
    if (head && typeof t === 'function') head.textContent = t('buildings.title');
    if (sub && typeof t === 'function') sub.textContent = t('buildings.sub');
    if (note) {
      const live = typeof buildingsHasSystemsApi === 'function' && buildingsHasSystemsApi();
      note.hidden = live;
      note.textContent = live
        ? ((typeof t === 'function') ? t('buildings.liveNote') : '')
        : ((typeof t === 'function') ? t('buildings.stubNote') : '');
    }
    const rows = (typeof buildingsList === 'function') ? buildingsList() : [];
    let sel = (typeof buildingsSelectedId === 'function') ? buildingsSelectedId() : (rows[0] && rows[0].id);
    if (!rows.some((r) => r.id === sel)) sel = rows[0] && rows[0].id;
    if (list) {
      list.innerHTML = '';
      for (const view of rows) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hub-tile buildings-row'
          + (view.id === sel ? ' hub-tile-featured buildings-row-sel' : '')
          + (view.locked ? ' buildings-row-locked' : '')
          + (view.canCollect ? ' buildings-row-ready' : '');
        btn.dataset.buildingId = view.id;
        if (view.id === sel) btn.setAttribute('data-hub-badge', view.canCollect
          ? ((typeof t === 'function') ? t('buildings.collect') : 'Oogsten')
          : ((typeof t === 'function') ? t('buildings.level', { n: view.level }) : ('Lv ' + view.level)));
        const lockBit = view.locked
          ? buildingsEscape(view.lockHint || ((typeof t === 'function') ? t('buildings.locked') : ''))
          : ((typeof t === 'function') ? t('buildings.level', { n: view.level }) : ('Lv ' + view.level));
        const stock = view.locked
          ? ''
          : (view.pending + '/' + view.capacity + ' ' + buildingsEscape(view.resourceLabel));
        btn.innerHTML =
          '<span class="hub-tile-ico">' + buildingsArtHtml(view) + '</span>'
          + '<span class="hub-tile-title">' + buildingsEscape(view.name) + '</span>'
          + '<span class="hub-tile-sub">' + buildingsEscape(view.sub) + '</span>'
          + '<span class="hub-tile-stat">' + lockBit + (stock ? ' · ' + stock : '') + '</span>';
        if (typeof bindPress === 'function') {
          bindPress(btn, () => {
            if (typeof AudioSys !== 'undefined') { try { AudioSys.sfx('select'); } catch (_) {} }
            if (typeof buildingsSelect === 'function') buildingsSelect(view.id);
            UI.renderBuildings();
          });
        } else {
          btn.addEventListener('click', () => {
            if (typeof buildingsSelect === 'function') buildingsSelect(view.id);
            UI.renderBuildings();
          });
        }
        list.appendChild(btn);
      }
    }
    const view = rows.find((r) => r.id === sel) || rows[0];
    if (detail) this.paintBuildingsDetail(detail, view);
  };

  UI.paintBuildingsDetail = function paintBuildingsDetail(host, view) {
    if (!host) return;
    if (!view) {
      host.innerHTML = '';
      return;
    }
    const locked = !!view.locked;
    const pct = view.capacity ? Math.min(100, Math.round((view.pending / view.capacity) * 100)) : 0;
    const eta = (!locked && view.pending < view.capacity && view.nextMs > 0)
      ? ((typeof t === 'function') ? t('buildings.nextIn', { t: buildingsFormatEta(view.nextMs) }) : '')
      : '';
    const collectLbl = (typeof t === 'function') ? t('buildings.collect') : 'Oogsten';
    const collectSub = locked
      ? buildingsEscape(view.lockHint)
      : (view.canCollect
        ? ((typeof t === 'function') ? t('buildings.collectSub', { n: view.pending, res: view.resourceLabel }) : String(view.pending))
        : ((typeof t === 'function') ? t('buildings.collectEmpty') : ''));
    const upLbl = (typeof t === 'function') ? t('buildings.upgrade') : 'Upgrade';
    const upSub = view.upgradeHint || '';
    host.innerHTML =
      '<div class="buildings-detail-art">' + buildingsArtHtml(view) + '</div>'
      + '<div class="buildings-detail-meta">'
      + '<div class="buildings-detail-name">' + buildingsEscape(view.name)
      + ' <span class="buildings-lv">' + ((typeof t === 'function') ? t('buildings.level', { n: view.level }) : ('Lv ' + view.level)) + '</span></div>'
      + '<div class="buildings-detail-sub">' + buildingsEscape(view.sub) + '</div>'
      + (locked
        ? '<div class="buildings-lock">' + buildingsEscape(view.lockHint) + '</div>'
        : '<div class="buildings-stock">'
          + '<div class="buildings-stock-bar" role="progressbar" aria-valuenow="' + view.pending + '" aria-valuemax="' + view.capacity + '">'
          + '<span style="width:' + pct + '%"></span></div>'
          + '<div class="buildings-stock-lbl">'
          + ((typeof t === 'function') ? t('buildings.stored', { n: view.pending, cap: view.capacity }) : (view.pending + '/' + view.capacity))
          + (eta ? ' · ' + buildingsEscape(eta) : '')
          + '</div></div>')
      + '</div>'
      + '<div class="buildings-cta-row">'
      + '<button type="button" class="btn mode-btn b-continue big-touch buildings-cta" id="btnBuildingCollect"'
      + (view.canCollect ? '' : ' disabled') + '>'
      + '<span class="ico"><img src="assets/buttons/chrome/claim.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
      + '<div>' + buildingsEscape(collectLbl) + '<small>' + buildingsEscape(collectSub) + '</small></div></button>'
      + '<button type="button" class="btn mode-btn b-gray big-touch buildings-cta" id="btnBuildingUpgrade"'
      + (view.canUpgrade ? '' : ' disabled') + '>'
      + '<span class="ico"><img src="assets/buttons/modes/upgrades.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
      + '<div>' + buildingsEscape(upLbl) + '<small>' + buildingsEscape(upSub) + '</small></div></button>'
      + '</div>';
    const collectBtn = document.getElementById('btnBuildingCollect');
    const upBtn = document.getElementById('btnBuildingUpgrade');
    if (collectBtn && typeof bindPress === 'function') {
      bindPress(collectBtn, () => UI.doBuildingCollect(view.id));
    }
    if (upBtn && typeof bindPress === 'function') {
      bindPress(upBtn, () => UI.doBuildingUpgrade(view.id));
    }
  };

  UI.doBuildingCollect = function doBuildingCollect(id) {
    if (typeof AudioSys !== 'undefined') { try { AudioSys.init(); AudioSys.sfx('claim'); } catch (_) { try { AudioSys.sfx('select'); } catch (__) {} } }
    const res = (typeof buildingsCollect === 'function') ? buildingsCollect(id) : { ok: false };
    if (res && res.ok) {
      try { this.toast(res.message || ((typeof t === 'function') ? t('buildings.collectDone', { n: res.amount || 0, res: '' }) : 'ok'), 2400, { tone: 'ok' }); } catch (_) {}
    } else {
      try { this.toast((res && res.message) || ((typeof t === 'function') ? t('buildings.collectEmpty') : ''), 2200, { tone: 'warn' }); } catch (_) {}
    }
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };

  UI.doBuildingUpgrade = function doBuildingUpgrade(id) {
    if (typeof AudioSys !== 'undefined') { try { AudioSys.init(); AudioSys.sfx('select'); } catch (_) {} }
    const res = (typeof buildingsUpgrade === 'function') ? buildingsUpgrade(id) : { ok: false };
    if (res && res.ok) {
      try { if (typeof AudioSys !== 'undefined') AudioSys.sfx('levelup'); } catch (_) {}
      try { this.toast(res.message || '', 2600, { tone: 'ok' }); } catch (_) {}
    } else {
      try { this.toast((res && res.message) || '', 2200, { tone: 'warn' }); } catch (_) {}
    }
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };
}
