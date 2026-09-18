/* ======================== BUILDINGS HOME UI ======================== */
/** Overview → detail → upgrade sheet. Consumes systems bind API when present:
 *  buildingDescModel · buildingWalletModel · buildingArtSrc · buildingCostLabel
 *  Do not re-declare those models here. */

function buildingsEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildingsTxt(key, fallback, params) {
  if (typeof tOr === 'function') return tOr(key, fallback, params);
  if (typeof t === 'function') {
    const s = t(key, params);
    if (s && s !== key) return s;
  }
  if (fallback && params && typeof params === 'object') {
    let out = String(fallback);
    for (const [k, v] of Object.entries(params)) out = out.split('{' + k + '}').join(String(v));
    return out;
  }
  return fallback || '';
}

function buildingsDesc(id, view) {
  if (typeof buildingDescModel === 'function') {
    try {
      const desc = buildingDescModel(id);
      if (desc) return desc;
    } catch (_) {}
  }
  if (view) return view;
  if (typeof buildingTooltipModel === 'function') {
    try { return buildingTooltipModel(id); } catch (_) {}
  }
  return null;
}

function buildingsClampDoes(line) {
  if (typeof buildingClampDoesLine === 'function') return buildingClampDoesLine(line);
  let s = String(line == null ? '' : line).replace(/\s+/g, ' ').trim();
  if (s.length <= 42 && !/Kracht rank|Power rank|hopper max/i.test(s)) return s;
  s = s.replace(/Kracht rank|Power rank|hopper max/gi, '').replace(/\s+/g, ' ').trim();
  if (s.length <= 42) return s;
  const sep = s.lastIndexOf(' · ');
  if (sep >= 8 && sep <= 42) return s.slice(0, sep).trim();
  let cut = s.slice(0, 42);
  const sp = cut.lastIndexOf(' ');
  if (sp >= 10) cut = cut.slice(0, sp);
  return cut.replace(/[·,\-–:]+$/g, '').trim();
}

function buildingsDoesLine(view) {
  const desc = buildingsDesc(view && view.id, view) || view || {};
  return buildingsClampDoes(desc.doesShort || desc.doesLine || view.doesLine || view.sub || view.blurb || '');
}

function buildingsWalletChipLabel(row) {
  const id = row && row.id;
  if (id) {
    const short = buildingsTxt('buildings.resShort.' + id, '');
    if (short && short !== 'buildings.resShort.' + id) return short;
  }
  return (row && (row.label || row.name)) || id || '';
}

function buildingsWalletSnap() {
  if (typeof buildingWalletModel === 'function') {
    try {
      const live = buildingWalletModel();
      if (live && typeof live === 'object') {
        return {
          petCoins: Math.max(0, Math.floor(Number(live.petCoins) || 0)),
          resources: (live.resources || []).map((row) => ({
            id: row.id,
            label: row.name || row.label || row.id,
            amount: Math.max(0, Math.floor(Number(row.amount) || 0)),
            rate: Math.max(0, Math.floor(Number(row.rate) || 0)),
          })),
        };
      }
    } catch (_) {}
  }
  const resIds = (typeof buildingResourceIds !== 'undefined' && buildingResourceIds && buildingResourceIds.length)
    ? buildingResourceIds.slice()
    : ['spark', 'glue', 'chip', 'steam', 'echo'];
  let bag = {};
  try {
    if (typeof buildingWallet === 'function') {
      const w = buildingWallet();
      if (w && typeof w === 'object') bag = w;
    }
  } catch (_) {}
  const pc = (typeof petCoinsBalance === 'function')
    ? petCoinsBalance()
    : Math.max(0, Math.floor(Number((typeof save !== 'undefined' && save && save.petCoins) || 0)));
  return {
    petCoins: Math.max(0, Math.floor(Number(pc) || 0)),
    resources: resIds.map((id) => ({
      id,
      label: (typeof buildingsResourceLabel === 'function') ? buildingsResourceLabel(id) : id,
      amount: Math.max(0, Math.floor(Number(bag[id]) || 0)),
      rate: 0,
    })),
  };
}

function buildingsArtSrcSnap(view) {
  const id = view && view.id;
  if (typeof buildingArtSrc === 'function' && id) {
    try {
      const raw = buildingArtSrc(id);
      if (raw && typeof raw === 'object' && (raw.pixel || raw.stroke || raw.hub)) return raw;
      if (typeof raw === 'string' && raw) {
        let stroke = raw;
        try { stroke = buildingArtSrc(id, 'stroke') || raw; } catch (_) {}
        return { pixel: raw, stroke, hub: 'assets/buttons/hub/buildings.svg' };
      }
    } catch (_) {}
  }
  if (view && view.artSrc && typeof view.artSrc === 'object') return view.artSrc;
  return {
    pixel: (view && view.art) || ('assets/buildings/pixel/' + id + '.png'),
    stroke: (view && view.artSvg) || ('assets/buildings/' + id + '.svg'),
    hub: (view && view.artHub) || 'assets/buttons/hub/buildings.svg',
  };
}

function buildingsArtHtml(view, klass) {
  const src = buildingsArtSrcSnap(view);
  const first = src.pixel || src.stroke || src.hub;
  const mid = src.stroke || src.hub;
  const last = src.hub || 'assets/buttons/hub/buildings.svg';
  const alt = buildingsEscape(view && view.name);
  const cls = klass || 'buildings-art-img';
  return '<img class="' + cls + '" data-buildings-art="' + buildingsEscape(view && view.id) + '"'
    + ' src="' + buildingsEscape(first) + '" alt="' + alt + '" width="64" height="64"'
    + ' decoding="async" draggable="false"'
    + ' onerror="if(!this.dataset.fb){this.dataset.fb=\'1\';this.src=\'' + buildingsEscape(mid)
    + '\'}else{this.onerror=null;this.src=\'' + buildingsEscape(last) + '\'}">';
}

function buildingsCostText(view) {
  if (!view) return '';
  if (view.nextCostLabel) return view.nextCostLabel;
  if (typeof buildingCostLabel === 'function' && view.nextCost) {
    try {
      const line = buildingCostLabel(view.nextCost);
      if (line) return line;
    } catch (_) {}
  }
  return view.upgradeHint || '';
}

function buildingsShortName(id, view) {
  const nameShortKey = 'buildings.' + id + '.nameShort';
  const nameShort = buildingsTxt(nameShortKey, '');
  if (nameShort && nameShort !== nameShortKey) return nameShort;
  const key = 'buildings.' + id + '.short';
  const named = buildingsTxt(key, '');
  if (named && named !== key) return named;
  try {
    const def = (typeof BUILDING_BY_ID === 'object' && BUILDING_BY_ID) ? BUILDING_BY_ID[id] : null;
    if (def && def.short) return def.short;
  } catch (_) {}
  const name = (view && view.name) || '';
  const stripped = String(name).replace(/\s+(Fabriek|Factory|Fabrik|Usine|Fábrica|Ketel|Boiler|Mill|molen|Mühle).*$/i, '').trim();
  return stripped || name || id || '';
}

function buildingsCostParts(view) {
  if (!view) return [];
  const cost = view.nextCost || {};
  const model = buildingsWalletSnap();
  const parts = [];
  const needPc = Math.max(0, Math.floor(Number(cost.petCoins) || 0));
  if (needPc) {
    const have = model.petCoins;
    parts.push({
      id: 'petCoins',
      need: needPc,
      have,
      ok: have >= needPc,
      label: buildingsTxt('buildings.costPc', '{n} PC', { n: needPc }),
    });
  }
  const resBag = (cost.resources && typeof cost.resources === 'object') ? cost.resources : {};
  for (const [rid, n] of Object.entries(resBag)) {
    const need = Math.max(0, Math.floor(Number(n) || 0));
    if (!need) continue;
    const have = ((model.resources || []).find((r) => r.id === rid) || {}).amount || 0;
    const rlabel = (typeof buildingsResourceLabel === 'function') ? buildingsResourceLabel(rid) : rid;
    parts.push({
      id: rid,
      need,
      have,
      ok: have >= need,
      label: buildingsTxt('buildings.costRes', '{n} {res}', { n: need, res: rlabel }),
    });
  }
  return parts;
}

function buildingsCostChipsHtml(view) {
  const parts = buildingsCostParts(view);
  if (!parts.length) return '';
  return '<div class="buildings-cost-chips" data-buildings-cost-chips>'
    + parts.map((p) =>
      '<span class="buildings-cost-chip ' + (p.ok ? 'is-ok' : 'is-short') + '" data-cost="' + buildingsEscape(p.id) + '">'
      + buildingsEscape(p.label) + '</span>').join('')
    + '</div>';
}

function buildingsIsUnbuilt(view) {
  return !!(view && !view.locked && !(view.built || view.level >= 1));
}

function buildingsIsMax(view) {
  return !!(view && !view.locked && !buildingsIsUnbuilt(view) && view.level >= view.maxLevel);
}

function buildingsNoneBuilt(rows) {
  return !!(rows && rows.length && rows.every((r) => !r || r.locked || buildingsIsUnbuilt(r)));
}

function buildingsEmptyStartHtml(rows) {
  if (!buildingsNoneBuilt(rows)) return '';
  const first = (rows || []).find((r) => r && r.id === 'stick_lighter')
    || (rows || []).find((r) => r && !r.locked)
    || null;
  if (!first || first.locked) {
    return '<p class="buildings-empty-start" data-buildings-empty="locked">'
      + buildingsEscape(buildingsTxt('buildings.emptyLocked', 'Speel Avontuur — dan Stok-Aansteker'))
      + '</p>';
  }
  const pc = first.nextCost && Math.max(0, Math.floor(Number(first.nextCost.petCoins) || 0));
  const cost = pc
    ? buildingsTxt('buildings.costPc', '{n} PC', { n: pc })
    : buildingsCostText(first);
  const name = buildingsShortName(first.id, first);
  const line = cost
    ? buildingsTxt('buildings.emptyStartCost', '{name} is open — tik Bouw ({cost})', { name, cost })
    : buildingsTxt('buildings.emptyStart', '{name} is open — tik Bouw', { name });
  return '<button type="button" class="buildings-empty-start" data-buildings-empty="'
    + buildingsEscape(first.id) + '" data-buildings-empty-open="' + buildingsEscape(first.id) + '">'
    + buildingsEscape(line) + '</button>';
}

function buildingsBrokeHint(view) {
  if (!view || view.locked || buildingsIsMax(view) || view.canUpgrade) return '';
  const missing = buildingsCostParts(view).filter((p) => !p.ok).map((p) => {
    const short = Math.max(0, p.need - p.have);
    if (p.id === 'petCoins') return short + ' PC';
    const rlabel = (typeof buildingsResourceLabel === 'function') ? buildingsResourceLabel(p.id) : p.id;
    return short + ' ' + rlabel;
  });
  if (!missing.length) return view.upgradeHint || buildingsCostText(view) || '';
  return buildingsTxt('buildings.brokeHint', 'Mis {cost} — speel of oogst eerst', { cost: missing.join(' + ') });
}

function buildingsHopperFull(view) {
  return !!(view && !view.locked && view.capacity > 0 && view.pending >= view.capacity);
}

function buildingsFmtAmt(n) {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  if (v >= 10000) return Math.floor(v / 1000) + 'k';
  return String(v);
}

function buildingsCollectLocked(id) {
  const lock = UI && UI._buildingsCollectBusy;
  return !!(lock && lock.until > Date.now() && (!id || lock.id === id || lock.id === '*'));
}

function buildingsOfflineHours() {
  const n = (typeof BUILDING_OFFLINE_HOURS === 'number') ? BUILDING_OFFLINE_HOURS : 8;
  return Math.max(1, Math.floor(Number(n) || 8));
}

function buildingsReadyRows(rows) {
  return (rows || []).filter((r) => r && !r.locked && r.canCollect);
}

function buildingsPillTip(view) {
  const h = buildingsOfflineHours();
  if (!view || view.locked) return buildingsTxt('buildings.pillTipLocked', 'Open of bouw eerst');
  if (buildingsIsUnbuilt(view)) return buildingsTxt('buildings.pillTipBuild', 'Tik Bouw — hopper start daarna');
  if (buildingsHopperFull(view)) {
    return buildingsTxt('buildings.pillTipFull', 'VOL · max {h}u offline', { h, n: buildingsFmtAmt(view.pending), cap: view.capacity || 0 });
  }
  if (view.canCollect) {
    return buildingsTxt('buildings.pillTipReady', '{n} klaar · max {h}u offline', { n: buildingsFmtAmt(view.pending), h });
  }
  return buildingsTxt('buildings.pillTip', 'Max {h}u offline · daarna VOL', { h });
}

function buildingsEta(view) {
  if (!view || view.locked || view.pending >= view.capacity || !(view.nextMs > 0)) return '';
  const t = (typeof buildingsFormatEta === 'function') ? buildingsFormatEta(view.nextMs) : '';
  return t ? buildingsTxt('buildings.nextIn', 'Volgende over {t}', { t }) : '';
}

function buildingsPillHtml(view, opts) {
  if (!view) return '';
  const ready = !!view.canCollect;
  const locked = !!view.locked;
  const unbuilt = buildingsIsUnbuilt(view);
  const full = buildingsHopperFull(view);
  const canUp = !locked && !unbuilt && !ready && !!view.canUpgrade;
  const flashing = !!(typeof UI === 'object' && UI && UI.buildingsFlash
    && UI.buildingsFlash.id === view.id && UI.buildingsFlash.until > Date.now());
  const cls = 'buildings-res-pill'
    + (ready ? ' is-collect' : ' is-empty')
    + (locked ? ' is-locked' : '')
    + (unbuilt && !ready ? ' is-build' : '')
    + (canUp ? ' is-upgrade' : '')
    + (full ? ' is-full' : '')
    + (flashing ? ' is-flash' : '');
  let label;
  if (locked) label = buildingsTxt('buildings.pillLocked', 'Slot');
  else if (unbuilt) label = buildingsTxt('buildings.pillBuild', 'Bouw');
  else if (full) label = buildingsTxt('buildings.pillFull', 'Vol {n}', { n: buildingsFmtAmt(view.pending) });
  else if (ready) label = buildingsTxt('buildings.pillReady', 'Oogst {n}', { n: buildingsFmtAmt(view.pending) });
  else if (canUp) label = buildingsTxt('buildings.pillUpgrade', 'Upgrade');
  else label = buildingsTxt('buildings.pillWait', '{n}/{cap}', { n: view.pending || 0, cap: view.capacity || 0 });
  const idAttr = (opts && opts.id) ? ' id="' + buildingsEscape(opts.id) + '"' : '';
  const tip = buildingsPillTip(view);
  return '<button type="button" class="' + cls + '"' + idAttr
    + ' data-buildings-collect="' + buildingsEscape(view.id) + '"'
    + ' title="' + buildingsEscape(tip) + '" aria-label="' + buildingsEscape(label + ' · ' + tip) + '"'
    + (ready ? '' : ' aria-disabled="true"')
    + '><span class="buildings-res-n">' + buildingsEscape(label) + '</span>'
    + '<small>' + buildingsEscape(view.resourceLabel || '') + '</small></button>';
}

if (typeof UI === 'object' && UI) {
  UI.buildingsTick = 0;
  UI.buildingsPane = 'list';
  UI.buildingsStep = 'harvest';
  UI.buildingsFlash = null;
  UI._buildingsDetailKey = '';
  UI._buildingsDelegates = false;
  UI._buildingsCollectBusy = null;
  UI._buildingsPillHold = null;

  UI.openBuildings = function openBuildings() {
    this.buildingsPane = 'list';
    this.buildingsView = 'list';
    this.buildingsStep = 'harvest';
    this.buildingsFlash = null;
    this._buildingsDetailKey = '';
    this._buildingsSheetFrom = 'list';
    this.stopBuildingsTick();
    this.ensureBuildingsDelegates();
    this.ensureBuildingsPillInfo();
    try { this.clearToasts(); } catch (_) {}
    this.safeOpen('buildingsScreen', () => this.renderBuildings(), {
      msg: buildingsTxt('buildings.loadFail', 'Could not load factories'),
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

  UI.ensureBuildingsDelegates = function ensureBuildingsDelegates() {
    if (this._buildingsDelegates) return;
    this._buildingsDelegates = true;
    const list = document.getElementById('buildingsList');
    const detail = document.getElementById('buildingsDetail');
    const handle = (e, fromDetail) => {
      const emptyBtn = e.target && e.target.closest && e.target.closest('[data-buildings-empty-open]');
      if (emptyBtn) {
        const startId = emptyBtn.getAttribute('data-buildings-empty-open');
        if (startId) UI.buildingsShowUpgradeStep(startId);
        return;
      }
      const allBtn = e.target && e.target.closest && e.target.closest('[data-buildings-collect-all]');
      if (allBtn) {
        UI.doBuildingCollectAll();
        return;
      }
      const pill = e.target && e.target.closest && e.target.closest('[data-buildings-collect]');
      if (pill) {
        const hold = UI._buildingsPillHold;
        if (hold && hold.shown && hold.until > Date.now()) return;
        const id = pill.getAttribute('data-buildings-collect');
        if (buildingsCollectLocked(id)) return;
        if (pill.classList.contains('is-collect')) {
          UI.doBuildingCollect(id);
        } else if (pill.classList.contains('is-build') || pill.classList.contains('is-upgrade')) {
          UI.buildingsShowUpgradeStep(id);
        } else if (pill.classList.contains('is-locked')) {
          UI.buildingsShowDetail(id);
        } else {
          UI.buildingsShowDetail(id);
        }
        return;
      }
      if (fromDetail) {
        const back = e.target && e.target.closest && e.target.closest('#btnBuildingsOverview,[data-buildings-overview]');
        if (back) { UI.buildingsShowList(); return; }
        const up = e.target && e.target.closest && e.target.closest('#btnBuildingUpgrade');
        if (up && !up.disabled) { UI.buildingsShowUpgradeStep(); return; }
        const play = e.target && e.target.closest && e.target.closest('#btnBuildingPlayIsland');
        if (play) { UI.buildingsGoAdventure(); return; }
        return;
      }
      const card = e.target && e.target.closest && e.target.closest('[data-factory-id]');
      if (!card || card.closest('#buildingsDetail')) return;
      const id = card.getAttribute('data-factory-id');
      if (id) {
        if (buildingsCollectLocked(id)) return;
        if (typeof AudioSys !== 'undefined') { try { AudioSys.sfx('select'); } catch (_) {} }
        UI.buildingsShowDetail(id);
      }
    };
    const bind = (el, fn) => {
      if (!el) return;
      if (typeof bindPress === 'function') bindPress(el, fn);
      else el.addEventListener('click', fn);
    };
    bind(list, (e) => handle(e, false));
    bind(detail, (e) => handle(e, true));
    const emptyHost = this.ensureBuildingsEmptyHost();
    bind(emptyHost, (e) => handle(e, false));
    const allHost = this.ensureBuildingsCollectAllHost();
    bind(allHost, (e) => handle(e, false));
  };

  UI.ensureBuildingsEmptyHost = function ensureBuildingsEmptyHost() {
    let host = document.getElementById('buildingsEmptyStart');
    if (host) return host;
    const overview = document.getElementById('buildingsOverview');
    if (!overview) return null;
    host = document.createElement('div');
    host.id = 'buildingsEmptyStart';
    host.className = 'buildings-empty-start-wrap';
    const listEl = document.getElementById('buildingsList');
    if (listEl && listEl.parentNode === overview) overview.insertBefore(host, listEl);
    else overview.insertBefore(host, overview.firstChild);
    return host;
  };

  UI.ensureBuildingsCollectAllHost = function ensureBuildingsCollectAllHost() {
    let host = document.getElementById('buildingsCollectAll');
    if (host) return host;
    const overview = document.getElementById('buildingsOverview');
    if (!overview) return null;
    host = document.createElement('div');
    host.id = 'buildingsCollectAll';
    host.className = 'buildings-collect-all-wrap';
    host.hidden = true;
    const empty = document.getElementById('buildingsEmptyStart');
    const listEl = document.getElementById('buildingsList');
    if (empty && empty.parentNode === overview) overview.insertBefore(host, empty.nextSibling);
    else if (listEl && listEl.parentNode === overview) overview.insertBefore(host, listEl);
    else overview.insertBefore(host, overview.firstChild);
    return host;
  };

  UI.paintBuildingsCollectAll = function paintBuildingsCollectAll(rows, pane) {
    const host = this.ensureBuildingsCollectAllHost();
    if (!host) return;
    const ready = buildingsReadyRows(rows);
    const show = pane === 'list' && ready.length >= 2;
    host.hidden = !show;
    if (!show) {
      host.innerHTML = '';
      return;
    }
    const n = ready.length;
    const aria = buildingsTxt('buildings.collectAllAria', 'Oogst {n} fabrieken', { n });
    host.innerHTML =
      '<button type="button" class="buildings-collect-all" data-buildings-collect-all="1" id="btnBuildingsCollectAll"'
      + ' aria-label="' + buildingsEscape(aria) + '">'
      + '<span>' + buildingsEscape(buildingsTxt('buildings.collectAll', 'Oogst {n}', { n })) + '</span></button>';
  };

  UI.ensureBuildingsPillInfo = function ensureBuildingsPillInfo() {
    const scr = document.getElementById('buildingsScreen');
    if (!scr || scr.dataset.sfPillInfo) return;
    scr.dataset.sfPillInfo = '1';
    let timer = 0;
    let holdEl = null;
    const clearTimer = () => { if (timer) { try { clearTimeout(timer); } catch (_) {} timer = 0; } };
    const onDown = (e) => {
      const pill = e.target && e.target.closest && e.target.closest('[data-buildings-collect]');
      if (!pill || !scr.contains(pill)) return;
      holdEl = pill;
      clearTimer();
      timer = setTimeout(() => {
        if (holdEl !== pill) return;
        const id = pill.getAttribute('data-buildings-collect');
        const view = (typeof buildingsGet === 'function') ? buildingsGet(id) : null;
        const tip = buildingsPillTip(view);
        UI._buildingsPillHold = { id, shown: true, until: Date.now() + 520 };
        UI.paintBuildingsPillTip(pill, tip);
      }, 420);
    };
    const onEnd = () => {
      clearTimer();
      holdEl = null;
    };
    scr.addEventListener('pointerdown', onDown, true);
    scr.addEventListener('pointerup', onEnd, true);
    scr.addEventListener('pointercancel', onEnd, true);
    scr.addEventListener('contextmenu', (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-buildings-collect]')) {
        if (e.preventDefault) e.preventDefault();
      }
    }, true);
  };

  UI.paintBuildingsPillTip = function paintBuildingsPillTip(anchor, text) {
    if (!text) return;
    let tip = document.getElementById('buildingsPillTip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'buildingsPillTip';
      tip.className = 'buildings-pill-tip';
      tip.setAttribute('role', 'status');
      const scr = document.getElementById('buildingsScreen') || document.body;
      scr.appendChild(tip);
    }
    tip.textContent = text;
    tip.hidden = false;
    tip.classList.add('is-on');
    try {
      const box = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
      const host = (tip.offsetParent || document.getElementById('buildingsScreen') || document.body).getBoundingClientRect();
      if (box) {
        const tipW = Math.min(tip.offsetWidth || 200, host.width - 16);
        const tipH = tip.offsetHeight || 32;
        let left = box.left - host.left;
        left = Math.max(8, Math.min(left, host.width - tipW - 8));
        let top = box.top - host.top - tipH - 8;
        if (top < 8) top = box.bottom - host.top + 8;
        top = Math.max(8, Math.min(top, host.height - tipH - 8));
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
        tip.style.maxWidth = Math.min(280, host.width - 16) + 'px';
      }
    } catch (_) {}
    if (this._buildingsPillTipHide) {
      try { clearTimeout(this._buildingsPillTipHide); } catch (_) {}
    }
    this._buildingsPillTipHide = setTimeout(() => {
      tip.classList.remove('is-on');
      tip.hidden = true;
    }, 1600);
  };

  UI.buildingsShowList = function buildingsShowList() {
    this.buildingsPane = 'list';
    this.buildingsView = 'list';
    this.buildingsStep = 'harvest';
    this._buildingsDetailKey = '';
    this.renderBuildings();
  };

  UI.buildingsShowDetail = function buildingsShowDetail(id) {
    if (buildingsCollectLocked(id)) return;
    if (typeof buildingsSelect === 'function') buildingsSelect(id);
    this.buildingsPane = 'detail';
    this.buildingsView = 'detail';
    this.buildingsStep = 'harvest';
    this.buildingsFocusId = id;
    this._buildingsDetailKey = '';
    this.renderBuildings();
  };

  UI.buildingsShowUpgradeStep = function buildingsShowUpgradeStep(id) {
    if (id) {
      if (typeof buildingsSelect === 'function') buildingsSelect(id);
      this.buildingsFocusId = id;
    }
    this._buildingsSheetFrom = this.buildingsPane === 'detail' ? 'detail' : 'list';
    this.buildingsStep = 'upgrade';
    this.buildingsView = 'upgrade';
    this._buildingsDetailKey = '';
    this.renderBuildings();
  };

  UI.openBuildingDetail = function openBuildingDetail(id) { return this.buildingsShowDetail(id); };
  UI.openBuildingUpgrade = function openBuildingUpgrade(id) {
    return this.buildingsShowUpgradeStep(id);
  };

  UI.buildingsGoBack = function buildingsGoBack() {
    if (this.buildingsStep === 'upgrade' || this.buildingsView === 'upgrade') {
      this.buildingsStep = 'harvest';
      if (this._buildingsSheetFrom === 'list') {
        this.buildingsShowList();
        return true;
      }
      this.buildingsView = 'detail';
      this.buildingsPane = 'detail';
      this._buildingsDetailKey = '';
      this.renderBuildings();
      return true;
    }
    if (this.buildingsPane === 'detail' || this.buildingsView === 'detail') {
      this.buildingsShowList();
      return true;
    }
    this.stopBuildingsTick();
    return false;
  };

  UI.buildingsGoAdventure = function buildingsGoAdventure() {
    this.stopBuildingsTick();
    this.buildingsPane = 'list';
    this.buildingsStep = 'harvest';
    if (typeof this.safeOpen === 'function') {
      this.safeOpen('levelScreen', () => this.renderLevels(), {
        msg: buildingsTxt('ui.errLoadAdventure', 'Avontuur laden mislukt'),
      });
      return;
    }
    try { this.show('levelScreen'); this.renderLevels(); } catch (_) {}
  };

  UI.paintBuildingsWallet = function paintBuildingsWallet(flashRes, rows) {
    const walletEl = document.getElementById('buildingsWallet');
    if (!walletEl) return;
    const model = buildingsWalletSnap();
    const hopper = {};
    for (const view of (rows || [])) {
      if (view && view.resourceId) hopper[view.resourceId] = view;
    }
    const chips = [];
    chips.push(
      '<span class="buildings-wallet-chip buildings-wallet-pc buildings-wallet-pill" data-res="petCoins">'
      + '<span class="buildings-wallet-lbl buildings-wallet-name">' + buildingsEscape(buildingsTxt('buildings.walletPc', 'PC')) + '</span>'
      + '<span class="buildings-wallet-amt">' + buildingsEscape(buildingsFmtAmt(model.petCoins)) + '</span></span>'
    );
    const pills = (model.resources || []).map((row) => {
      const site = hopper[row.id];
      const full = buildingsHopperFull(site);
      const flash = flashRes && flashRes === row.id ? ' is-flash' : '';
      const plus = (this.buildingsFlash && this.buildingsFlash.resId === row.id && this.buildingsFlash.until > Date.now())
        ? this.buildingsFlash.amount : 0;
      let hint = '';
      let hintCls = 'buildings-wallet-hint';
      if (plus > 0) {
        hint = buildingsTxt('buildings.walletPlus', '+{n}', { n: buildingsFmtAmt(plus) });
        hintCls += ' is-plus';
      } else if (full) {
        hint = buildingsTxt('buildings.walletFull', 'VOL');
        hintCls += ' is-full';
      } else if (row.rate > 0) {
        hint = buildingsTxt('buildings.walletRate', '+{n}/u', { n: row.rate });
      }
      const hintHtml = hint ? '<span class="' + hintCls + '">' + buildingsEscape(hint) + '</span>' : '';
      return '<span class="buildings-wallet-chip buildings-wallet-pill' + flash + (full ? ' is-full' : '') + '" data-res="' + buildingsEscape(row.id)
        + '" data-res-id="' + buildingsEscape(row.id) + '">'
        + '<span class="buildings-wallet-lbl buildings-wallet-name">' + buildingsEscape(buildingsWalletChipLabel(row)) + '</span>'
        + '<span class="buildings-wallet-amt">' + buildingsEscape(buildingsFmtAmt(row.amount)) + '</span>'
        + hintHtml + '</span>';
    });
    walletEl.classList.add('buildings-wallet');
    walletEl.setAttribute('data-wallet-labeled', '1');
    walletEl.innerHTML = chips[0] + pills.join('');
  };

  UI.renderBuildings = function renderBuildings(opts) {
    const quiet = !!(opts && opts.quiet);
    this.ensureBuildingsDelegates();
    const list = document.getElementById('buildingsList');
    const detail = document.getElementById('buildingsDetail');
    const note = document.getElementById('buildingsApiNote');
    const head = document.getElementById('buildingsScreenHead');
    const sub = document.getElementById('buildingsScreenSub');
    const scr = document.getElementById('buildingsScreen');
    if (head) head.textContent = buildingsTxt('buildings.title', 'Fabrieken');
    if (sub) {
      sub.textContent = this.buildingsPane === 'detail'
        ? buildingsTxt('buildings.detailSub', 'Pil = oogst of bouw · blad = bevestig')
        : buildingsTxt('buildings.sub', 'Tik de pil — oogst of bouw');
    }
    if (note) {
      const live = typeof buildingsHasSystemsApi === 'function' && buildingsHasSystemsApi();
      note.hidden = true;
      note.textContent = live ? '' : '';
    }
    let flashRes = null;
    if (this.buildingsFlash && this.buildingsFlash.until > Date.now()) {
      flashRes = this.buildingsFlash.resId;
    } else if (this.buildingsFlash) {
      this.buildingsFlash = null;
    }
    const rows = (typeof buildingsList === 'function') ? buildingsList() : [];
    this.paintBuildingsWallet(flashRes, rows);
    let sel = (typeof buildingsSelectedId === 'function') ? buildingsSelectedId() : (rows[0] && rows[0].id);
    if (this.buildingsFocusId && rows.some((r) => r.id === this.buildingsFocusId)) sel = this.buildingsFocusId;
    if (!rows.some((r) => r.id === sel)) sel = rows[0] && rows[0].id;
    const pane = this.buildingsPane === 'detail' ? 'detail' : 'list';
    const viewName = this.buildingsStep === 'upgrade' ? 'upgrade' : pane;
    this.buildingsView = viewName;
    if (scr) {
      scr.setAttribute('data-buildings-pane', pane);
      scr.setAttribute('data-buildings-view', viewName);
      scr.classList.toggle('buildings-pane-detail', pane === 'detail');
      scr.classList.toggle('buildings-pane-list', pane === 'list');
      scr.classList.toggle('buildings-sheet-open', viewName === 'upgrade');
    }
    const overview = document.getElementById('buildingsOverview');
    const sheet = document.getElementById('buildingsUpgradeSheet');
    if (overview) overview.hidden = false;
    if (sheet) {
      sheet.hidden = viewName !== 'upgrade';
      sheet.setAttribute('aria-hidden', viewName === 'upgrade' ? 'false' : 'true');
      sheet.classList.add('buildings-sheet', 'buildings-upgrade-sheet');
    }
    if (list) this.paintBuildingsList(list, rows, sel, quiet);
    const emptyHost = this.ensureBuildingsEmptyHost();
    if (emptyHost) {
      const showEmpty = pane === 'list' && buildingsNoneBuilt(rows);
      emptyHost.hidden = !showEmpty;
      emptyHost.innerHTML = showEmpty ? buildingsEmptyStartHtml(rows) : '';
    }
    this.paintBuildingsCollectAll(rows, pane);
    const view = rows.find((r) => r.id === sel) || rows[0];
    if (detail) {
      const key = (view && view.id || '') + ':' + (this.buildingsStep || 'harvest') + ':' + pane;
      if (quiet && key === this._buildingsDetailKey && detail.dataset.factoryId === (view && view.id)) {
        this.refreshBuildingsDetail(detail, view);
      } else {
        this.paintBuildingsDetail(detail, view);
        this._buildingsDetailKey = key;
      }
    }
  };

  UI.paintBuildingsList = function paintBuildingsList(list, rows, sel, quiet) {
    const have = [...list.querySelectorAll('.buildings-row')].map((el) => el.getAttribute('data-factory-id'));
    const want = rows.map((r) => r.id);
    if (have.join('|') !== want.join('|')) {
      list.innerHTML = '';
      for (const view of rows) {
        const card = document.createElement('article');
        card.className = 'buildings-card buildings-row';
        card.setAttribute('data-factory-id', view.id);
        card.dataset.buildingId = view.id;
        card.dataset.factoryId = view.id;
        list.appendChild(card);
      }
    }
    for (const view of rows) {
      const card = list.querySelector('[data-factory-id="' + view.id + '"]');
      if (!card) continue;
      card.className = 'buildings-card buildings-row'
        + (view.id === sel ? ' buildings-row-sel is-sel' : '')
        + (view.locked ? ' buildings-row-locked is-locked' : '')
        + (view.canCollect ? ' buildings-row-ready is-ready' : '')
        + (buildingsNoneBuilt(rows) && view.id === 'stick_lighter' && !view.locked ? ' is-start' : '');
      card.setAttribute('data-factory-id', view.id);
      card.dataset.buildingId = view.id;
      card.dataset.factoryId = view.id;
      const does = buildingsDoesLine(view);
      const lvBit = view.locked
        ? buildingsTxt('buildings.locked', 'Op slot')
        : (buildingsIsUnbuilt(view)
          ? buildingsTxt('buildings.unbuilt', 'Nog niet gebouwd')
          : buildingsTxt('buildings.level', 'Lv {n}', { n: view.level }));
      const short = buildingsShortName(view.id, view);
      card.classList.toggle('is-primary-collect', !!view.canCollect);
      card.classList.toggle('is-primary-build', buildingsIsUnbuilt(view) && !view.locked);
      card.classList.toggle('is-primary-upgrade', !view.locked && !buildingsIsUnbuilt(view) && !view.canCollect && !!view.canUpgrade);
      const nextHtml =
        '<button type="button" class="buildings-card-hit" data-factory-open="' + buildingsEscape(view.id) + '">'
        + '<span class="buildings-card-art hub-tile-ico">' + buildingsArtHtml(view) + '</span>'
        + '<span class="buildings-card-body">'
        + '<span class="buildings-card-kicker">' + buildingsEscape(lvBit) + '</span>'
        + '<span class="buildings-card-name">' + buildingsEscape(short) + '</span>'
        + '<span class="buildings-card-does">' + buildingsEscape(does) + '</span>'
        + '</span></button>'
        + buildingsPillHtml(view);
      if (quiet && card.querySelector('.buildings-card-does')) {
        const doesEl = card.querySelector('.buildings-card-does');
        const kickEl = card.querySelector('.buildings-card-kicker');
        const nameEl = card.querySelector('.buildings-card-name');
        const pill = card.querySelector('[data-buildings-collect]');
        if (doesEl) doesEl.textContent = does;
        if (kickEl) kickEl.textContent = lvBit;
        if (nameEl) nameEl.textContent = short;
        if (pill) {
          const wrap = document.createElement('div');
          wrap.innerHTML = buildingsPillHtml(view);
          if (wrap.firstChild) pill.replaceWith(wrap.firstChild);
        }
      } else {
        card.innerHTML = nextHtml;
      }
    }
  };

  UI.buildingsEffectHtml = function buildingsEffectHtml(view) {
    const desc = buildingsDesc(view && view.id, view) || view || {};
    const does = buildingsClampDoes(desc.doesShort || desc.doesLine || view.doesLine || '');
    const bits = [];
    bits.push('<div class="buildings-effect" data-buildings-effect="' + buildingsEscape(view && view.id) + '">');
    bits.push('<div class="buildings-effect-kicker">' + buildingsEscape(buildingsTxt('buildings.whatItDoes', 'Wat doet dit?')) + '</div>');
    if (does) bits.push('<p class="buildings-effect-does buildings-card-does">' + buildingsEscape(does) + '</p>');
    if (desc.nextLine) bits.push('<p class="buildings-effect-next">' + buildingsEscape(desc.nextLine) + '</p>');
    bits.push('</div>');
    return bits.join('');
  };

  UI.paintBuildingsDetail = function paintBuildingsDetail(host, view) {
    if (!host) return;
    if (!view) {
      host.innerHTML = '';
      delete host.dataset.factoryId;
      return;
    }
    host.dataset.factoryId = view.id;
    host.setAttribute('data-factory-id', view.id);
    const locked = !!view.locked;
    const unbuilt = buildingsIsUnbuilt(view);
    const atMax = buildingsIsMax(view);
    const pct = view.capacity ? Math.min(100, Math.round((view.pending / view.capacity) * 100)) : 0;
    const eta = buildingsEta(view);
    const flash = (this.buildingsFlash && this.buildingsFlash.id === view.id && this.buildingsFlash.until > Date.now())
      ? ('<div class="buildings-collect-flash" role="status">+' + buildingsEscape(this.buildingsFlash.amount)
        + ' ' + buildingsEscape(this.buildingsFlash.resLabel || view.resourceLabel) + '</div>')
      : '';
    const costHint = buildingsCostText(view);
    const broke = buildingsBrokeHint(view);
    const overviewLbl = buildingsTxt('buildings.overview', 'Overzicht');
    let cta = '<div class="buildings-cta-stack buildings-cta-row">';
    if (locked) {
      cta +=
        '<button type="button" class="btn mode-btn b-continue big-touch buildings-cta" id="btnBuildingPlayIsland">'
        + '<span class="ico"><img src="assets/buttons/hub/adventure.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEscape(buildingsTxt('buildings.goAdventure', 'Naar Avontuur'))
        + '<small>' + buildingsEscape(view.lockHint || buildingsTxt('buildings.nextPlay', 'Speel het eiland vrij')) + '</small></div></button>';
    } else if (atMax) {
      cta +=
        '<p class="buildings-max-hint" id="btnBuildingUpgrade" data-buildings-max="1">'
        + buildingsEscape(buildingsTxt('buildings.maxHint', 'Dit werk is klaar — oogst blijft lopen')) + '</p>';
    } else {
      const upOpenLbl = unbuilt
        ? buildingsTxt('buildings.buildOpen', 'Bouwen…')
        : buildingsTxt('buildings.upgradeOpen', 'Upgrade…');
      const upSub = view.canUpgrade
        ? (costHint || view.upgradeHint || '')
        : (broke || costHint || view.upgradeHint || '');
      cta +=
        '<button type="button" class="btn mode-btn b-gray big-touch buildings-cta buildings-cta-upgrade" id="btnBuildingUpgrade">'
        + '<span class="ico"><img src="assets/buttons/modes/upgrades.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEscape(upOpenLbl) + '<small>' + buildingsEscape(upSub) + '</small></div></button>';
    }
    cta += '</div>';
    host.innerHTML =
      '<button type="button" class="buildings-overview-btn" id="btnBuildingsOverview" data-buildings-overview="1">'
      + buildingsEscape('← ' + overviewLbl) + '</button>'
      + '<div class="buildings-detail-art">' + buildingsArtHtml(view, 'buildings-art-img buildings-art-lg') + '</div>'
      + '<div class="buildings-detail-meta">'
      + '<div class="buildings-detail-name">' + buildingsEscape(view.name)
      + ' <span class="buildings-lv">' + buildingsEscape(unbuilt
        ? buildingsTxt('buildings.unbuilt', 'Nog niet gebouwd')
        : (locked
          ? buildingsTxt('buildings.locked', 'Op slot')
          : buildingsTxt('buildings.level', 'Lv {n}', { n: view.level }))) + '</span></div>'
      + this.buildingsEffectHtml(view)
      + (locked
        ? '<div class="buildings-lock">' + buildingsEscape(view.lockHint) + '</div>'
        : '<div class="buildings-stock">'
          + buildingsPillHtml(view, { id: 'btnBuildingCollect' })
          + '<div class="buildings-stock-bar" role="progressbar" aria-valuenow="' + view.pending + '" aria-valuemax="' + view.capacity + '">'
          + '<span style="width:' + pct + '%"></span></div>'
          + '<div class="buildings-stock-lbl' + (buildingsHopperFull(view) ? ' is-full' : '') + '">'
          + buildingsEscape(buildingsHopperFull(view)
            ? buildingsTxt('buildings.storedFull', '{n}/{cap} VOL', { n: view.pending, cap: view.capacity })
            : buildingsTxt('buildings.stored', '{n}/{cap} opgeslagen', { n: view.pending, cap: view.capacity }))
          + (eta ? ' · ' + buildingsEscape(eta) : '')
          + '</div></div>')
      + flash
      + '</div>'
      + cta;
    this.paintBuildingsUpgradeSheet(view, this.buildingsStep === 'upgrade');
  };

  UI.paintBuildingsUpgradeSheet = function paintBuildingsUpgradeSheet(view, open) {
    const sheet = document.getElementById('buildingsUpgradeSheet');
    if (!sheet) return;
    if (!open || !view) {
      sheet.hidden = true;
      sheet.setAttribute('aria-hidden', 'true');
      sheet.innerHTML = '';
      return;
    }
    const unbuilt = buildingsIsUnbuilt(view);
    const atMax = buildingsIsMax(view);
    const broke = buildingsBrokeHint(view);
    const chips = atMax ? '' : buildingsCostChipsHtml(view);
    const desc = buildingsDesc(view.id, view) || {};
    const ask = unbuilt
      ? buildingsTxt('buildings.buildAsk', 'Bouw {name}?', { name: view.name })
      : buildingsTxt('buildings.upgradeAsk', 'Upgrade naar Lv {next}?', { next: (view.level || 0) + 1 });
    const canPay = !!view.canUpgrade && !atMax && !view.locked;
    const short = buildingsShortName(view.id, view);
    const title = unbuilt
      ? buildingsTxt('buildings.buildTitle', 'Bouw {name}', { name: short })
      : buildingsTxt('buildings.upgradeTitle', 'Upgrade {name}', { name: short });
    const confirmLbl = unbuilt
      ? buildingsTxt('buildings.pillBuild', 'Bouw')
      : buildingsTxt('buildings.upgradeConfirm', 'Bevestig');
    const confirmCls = 'btn mode-btn big-touch buildings-cta'
      + (canPay ? ' b-continue is-afford' : ' b-gray is-broke');
    sheet.hidden = false;
    sheet.setAttribute('aria-hidden', 'false');
    sheet.classList.add('buildings-sheet', 'buildings-upgrade-sheet');
    sheet.innerHTML =
      '<button type="button" class="buildings-sheet-backdrop" data-buildings-sheet-close></button>'
      + '<div class="buildings-sheet-panel" role="dialog" aria-modal="true">'
      + '<h3>' + buildingsEscape(title) + '</h3>'
      + (desc.nextLine ? '<p class="buildings-sheet-now buildings-next">' + buildingsEscape(desc.nextLine) + '</p>'
        : (desc.doesLine ? '<p class="buildings-sheet-now">' + buildingsEscape(buildingsClampDoes(desc.doesLine)) + '</p>' : ''))
      + '<p class="buildings-upgrade-ask buildings-sheet-why">' + buildingsEscape(atMax
        ? buildingsTxt('buildings.upgradeMax', 'Max level')
        : ask) + '</p>'
      + chips
      + (!canPay && broke ? '<p class="buildings-sheet-why">' + buildingsEscape(broke) + '</p>' : '')
      + '<div class="buildings-sheet-actions buildings-cta-stack">'
      + (atMax
        ? ''
        : ('<button type="button" class="' + confirmCls + '" id="btnBuildingUpgradeConfirm"'
          + (canPay ? '' : ' disabled') + '>'
          + buildingsEscape(confirmLbl) + '</button>'))
      + '<button type="button" class="btn mode-btn b-gray big-touch buildings-cta" data-buildings-sheet-close>'
      + buildingsEscape(buildingsTxt('buildings.sheetClose', 'Sluiten')) + '</button>'
      + '</div></div>';
    const close = () => UI.buildingsGoBack();
    sheet.querySelectorAll('[data-buildings-sheet-close]').forEach((el) => {
      if (typeof bindPress === 'function') bindPress(el, close);
      else el.addEventListener('click', close);
    });
    const doBtn = document.getElementById('btnBuildingUpgradeConfirm');
    if (doBtn && canPay) {
      if (typeof bindPress === 'function') bindPress(doBtn, () => UI.doBuildingUpgrade(view.id));
      else doBtn.addEventListener('click', () => UI.doBuildingUpgrade(view.id));
    }
  };

  UI.refreshBuildingsDetail = function refreshBuildingsDetail(host, view) {
    if (!host || !view) return;
    const bar = host.querySelector('.buildings-stock-bar span');
    const lbl = host.querySelector('.buildings-stock-lbl');
    const pill = host.querySelector('[data-buildings-collect]');
    const pct = view.capacity ? Math.min(100, Math.round((view.pending / view.capacity) * 100)) : 0;
    if (bar) bar.style.width = pct + '%';
    if (lbl) {
      const eta = buildingsEta(view);
      lbl.classList.toggle('is-full', buildingsHopperFull(view));
      lbl.textContent = (buildingsHopperFull(view)
        ? buildingsTxt('buildings.storedFull', '{n}/{cap} VOL', { n: view.pending, cap: view.capacity })
        : buildingsTxt('buildings.stored', '{n}/{cap} opgeslagen', { n: view.pending, cap: view.capacity }))
        + (eta ? ' · ' + eta : '');
    }
    if (pill) {
      const wrap = document.createElement('div');
      wrap.innerHTML = buildingsPillHtml(view, { id: 'btnBuildingCollect' });
      if (wrap.firstChild) pill.replaceWith(wrap.firstChild);
    }
    const effect = host.querySelector('[data-buildings-effect]');
    if (effect) {
      const wrap = document.createElement('div');
      wrap.innerHTML = this.buildingsEffectHtml(view);
      if (wrap.firstChild) effect.replaceWith(wrap.firstChild);
    }
    if (this.buildingsStep === 'upgrade') this.paintBuildingsUpgradeSheet(view, true);
  };

  UI.doBuildingCollect = function doBuildingCollect(id) {
    const now = Date.now();
    if (this._buildingsCollectBusy && this._buildingsCollectBusy.until > now) return;
    this._buildingsCollectBusy = { id, until: now + 480 };
    if (typeof AudioSys !== 'undefined') { try { AudioSys.init(); AudioSys.sfx('claim'); } catch (_) { try { AudioSys.sfx('select'); } catch (__) {} } }
    const before = (typeof buildingsGet === 'function') ? buildingsGet(id) : null;
    const cap = before && before.capacity ? before.capacity : 0;
    const wasFull = buildingsHopperFull(before);
    try { if (typeof haptic === 'function') haptic(10); } catch (_) {}
    const res = (typeof buildingsCollect === 'function') ? buildingsCollect(id) : { ok: false };
    const amount = Math.max(0, Math.floor(Number(res && res.amount) || 0));
    const ok = !!(res && res.ok && amount > 0);
    if (ok) {
      const label = (typeof buildingsResourceLabel === 'function')
        ? buildingsResourceLabel(res.resourceId)
        : (res.resourceId || '');
      const capped = wasFull || (cap > 0 && amount >= cap);
      this.buildingsFlash = {
        id,
        resId: res.resourceId,
        resLabel: label,
        amount,
        capped,
        cap,
        until: now + 2200,
      };
      const msg = capped
        ? buildingsTxt('buildings.collectCap', '+{n} {res} · hopper vol ({cap})', { n: amount, res: label, cap })
        : (res.message || buildingsTxt('buildings.collectDone', '+{n} {res}', { n: amount, res: label }));
      try { this.toast(msg, capped ? 2800 : 2400, { tone: 'ok' }); } catch (_) {}
    } else {
      try {
        this.toast((res && res.message) || buildingsTxt('buildings.collectEmpty', 'Nog niks klaar'), 2200, { tone: 'warn' });
      } catch (_) {}
    }
    this._buildingsDetailKey = '';
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };

  UI.doBuildingCollectAll = function doBuildingCollectAll() {
    const now = Date.now();
    if (this._buildingsCollectBusy && this._buildingsCollectBusy.until > now) return;
    const rows = (typeof buildingsList === 'function') ? buildingsList() : [];
    const ready = buildingsReadyRows(rows);
    if (ready.length < 2) return;
    this._buildingsCollectBusy = { id: '*', until: now + 480 };
    if (typeof AudioSys !== 'undefined') { try { AudioSys.init(); AudioSys.sfx('claim'); } catch (_) { try { AudioSys.sfx('select'); } catch (__) {} } }
    let parts = [];
    if (typeof collectAllBuildingResources === 'function') {
      try {
        const bag = collectAllBuildingResources({ silent: true });
        parts = (bag && bag.parts) || [];
      } catch (_) { parts = []; }
    }
    if (!parts.length) {
      for (const row of ready) {
        try {
          const one = (typeof buildingsCollect === 'function') ? buildingsCollect(row.id) : null;
          if (one && one.ok && one.amount > 0) parts.push(one);
        } catch (_) {}
      }
    }
    const total = parts.reduce((n, p) => n + Math.max(0, Math.floor(Number(p && p.amount) || 0)), 0);
    const k = parts.length;
    if (total > 0) {
      const first = parts[0] || {};
      this.buildingsFlash = {
        id: first.id || first.buildingId,
        resId: first.resourceId || first.resource,
        resLabel: (typeof buildingsResourceLabel === 'function')
          ? buildingsResourceLabel(first.resourceId || first.resource)
          : (first.resourceId || ''),
        amount: total,
        capped: false,
        cap: 0,
        until: now + 2200,
      };
      try {
        this.toast(buildingsTxt('buildings.collectAllDone', '+{n} · {k} klaar', { n: total, k }), 2200, { tone: 'ok' });
      } catch (_) {}
    } else {
      try { this.toast(buildingsTxt('buildings.collectEmpty', 'Nog niks klaar'), 1800, { tone: 'warn' }); } catch (_) {}
    }
    this._buildingsDetailKey = '';
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };

  UI.doBuildingUpgrade = function doBuildingUpgrade(id) {
    if (typeof AudioSys !== 'undefined') { try { AudioSys.init(); AudioSys.sfx('select'); } catch (_) {} }
    const res = (typeof buildingsUpgrade === 'function') ? buildingsUpgrade(id) : { ok: false };
    if (res && res.ok) {
      try { if (typeof AudioSys !== 'undefined') AudioSys.sfx('levelup'); } catch (_) {}
      const after = (typeof buildingsGet === 'function') ? buildingsGet(id) : null;
      const lv = Math.max(1, Math.floor(Number((res && res.level) != null ? res.level : (after && after.level)) || 1));
      const short = buildingsShortName(id, after);
      const msg = buildingsTxt('buildings.upgradeOkShort', '{short} · Lv {lv}', { short, lv });
      try { this.clearToasts(); } catch (_) {}
      try { this.toast(msg, 2000, { tone: 'ok' }); } catch (_) {}
      this.buildingsStep = 'harvest';
      if (this._buildingsSheetFrom === 'list') {
        this.buildingsView = 'list';
        this.buildingsPane = 'list';
      } else {
        this.buildingsView = 'detail';
        this.buildingsPane = 'detail';
      }
    } else {
      try { this.toast((res && res.message) || buildingsBrokeHint(buildingsGet && buildingsGet(id)) || '', 2200, { tone: 'warn' }); } catch (_) {}
    }
    this._buildingsDetailKey = '';
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };
}
