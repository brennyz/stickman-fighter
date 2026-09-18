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

function buildingsDoesLine(view) {
  const desc = buildingsDesc(view && view.id, view) || view || {};
  return desc.doesLine || view.doesLine || view.sub || view.blurb || '';
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

function buildingsIsUnbuilt(view) {
  return !!(view && !view.locked && !(view.built || view.level >= 1));
}

function buildingsIsMax(view) {
  return !!(view && !view.locked && !buildingsIsUnbuilt(view) && view.level >= view.maxLevel);
}

function buildingsBrokeHint(view) {
  if (!view || view.locked || buildingsIsMax(view) || view.canUpgrade) return '';
  const cost = view.nextCost || {};
  const model = buildingsWalletSnap();
  const missing = [];
  const needPc = Math.max(0, Math.floor(Number(cost.petCoins) || 0) - model.petCoins);
  if (needPc > 0) missing.push(needPc + ' PC');
  const resBag = cost.resources && typeof cost.resources === 'object' ? cost.resources : {};
  for (const [rid, n] of Object.entries(resBag)) {
    const need = Math.max(0, Math.floor(Number(n) || 0));
    const have = ((model.resources || []).find((r) => r.id === rid) || {}).amount || 0;
    if (have < need) {
      const label = (typeof buildingsResourceLabel === 'function') ? buildingsResourceLabel(rid) : rid;
      missing.push((need - have) + ' ' + label);
    }
  }
  if (!missing.length) return view.upgradeHint || buildingsCostText(view) || '';
  return buildingsTxt('buildings.brokeHint', 'Mis {cost} — speel of oogst eerst', { cost: missing.join(' + ') });
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
  const cls = 'buildings-res-pill'
    + (ready ? ' is-collect' : ' is-empty')
    + (locked ? ' is-locked' : '')
    + (unbuilt && !ready ? ' is-build' : '');
  let label;
  if (locked) label = buildingsTxt('buildings.pillLocked', 'Slot');
  else if (unbuilt) label = buildingsTxt('buildings.pillBuild', 'Bouw');
  else if (ready) label = buildingsTxt('buildings.pillReady', 'Oogst {n}', { n: view.pending });
  else label = buildingsTxt('buildings.pillWait', '{n}/{cap}', { n: view.pending || 0, cap: view.capacity || 0 });
  const idAttr = (opts && opts.id) ? ' id="' + buildingsEscape(opts.id) + '"' : '';
  return '<button type="button" class="' + cls + '"' + idAttr
    + ' data-buildings-collect="' + buildingsEscape(view.id) + '"'
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

  UI.openBuildings = function openBuildings() {
    this.buildingsPane = 'list';
    this.buildingsView = 'list';
    this.buildingsStep = 'harvest';
    this.buildingsFlash = null;
    this._buildingsDetailKey = '';
    this.stopBuildingsTick();
    this.ensureBuildingsDelegates();
    this.safeOpen('buildingsScreen', () => this.renderBuildings(), {
      msg: buildingsTxt('buildings.loadFail', 'Fabrieken laden mislukt'),
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
      const pill = e.target && e.target.closest && e.target.closest('[data-buildings-collect]');
      if (pill) {
        const id = pill.getAttribute('data-buildings-collect');
        if (pill.classList.contains('is-collect')) {
          UI.doBuildingCollect(id);
        } else if (fromDetail && pill.classList.contains('is-build')) {
          UI.buildingsShowUpgradeStep();
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
  };

  UI.buildingsShowList = function buildingsShowList() {
    this.buildingsPane = 'list';
    this.buildingsView = 'list';
    this.buildingsStep = 'harvest';
    this._buildingsDetailKey = '';
    this.renderBuildings();
  };

  UI.buildingsShowDetail = function buildingsShowDetail(id) {
    if (typeof buildingsSelect === 'function') buildingsSelect(id);
    this.buildingsPane = 'detail';
    this.buildingsView = 'detail';
    this.buildingsStep = 'harvest';
    this.buildingsFocusId = id;
    this._buildingsDetailKey = '';
    this.renderBuildings();
  };

  UI.buildingsShowUpgradeStep = function buildingsShowUpgradeStep() {
    this.buildingsStep = 'upgrade';
    this.buildingsView = 'upgrade';
    this._buildingsDetailKey = '';
    this.renderBuildings();
  };

  UI.openBuildingDetail = function openBuildingDetail(id) { return this.buildingsShowDetail(id); };
  UI.openBuildingUpgrade = function openBuildingUpgrade(id) {
    if (id && typeof buildingsSelect === 'function') buildingsSelect(id);
    return this.buildingsShowUpgradeStep();
  };

  UI.buildingsGoBack = function buildingsGoBack() {
    if (this.buildingsStep === 'upgrade' || this.buildingsView === 'upgrade') {
      this.buildingsStep = 'harvest';
      this.buildingsView = 'detail';
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

  UI.paintBuildingsWallet = function paintBuildingsWallet(flashRes) {
    const walletEl = document.getElementById('buildingsWallet');
    if (!walletEl) return;
    const model = buildingsWalletSnap();
    const chips = [];
    chips.push(
      '<span class="buildings-wallet-chip buildings-wallet-pc buildings-wallet-pill" data-res="petCoins">'
      + '<span class="buildings-wallet-lbl buildings-wallet-name">' + buildingsEscape(buildingsTxt('buildings.walletPc', 'PC')) + '</span>'
      + '<span class="buildings-wallet-amt">' + buildingsEscape(model.petCoins) + '</span></span>'
    );
    const pills = (model.resources || []).map((row) => {
      const flash = flashRes && flashRes === row.id ? ' is-flash' : '';
      const rate = row.rate > 0
        ? '<span class="buildings-wallet-hint">' + buildingsEscape(buildingsTxt('buildings.walletRate', '+{n}/u', { n: row.rate })) + '</span>'
        : '';
      return '<span class="buildings-wallet-chip buildings-wallet-pill' + flash + '" data-res="' + buildingsEscape(row.id)
        + '" data-res-id="' + buildingsEscape(row.id) + '">'
        + '<span class="buildings-wallet-lbl buildings-wallet-name">' + buildingsEscape(row.label) + '</span>'
        + '<span class="buildings-wallet-amt">' + buildingsEscape(row.amount) + '</span>'
        + rate + '</span>';
    });
    walletEl.classList.add('buildings-wallet');
    walletEl.innerHTML =
      '<div class="buildings-wallet-pc-line">' + chips[0] + '</div>'
      + '<div class="buildings-wallet-row">' + pills.join('') + '</div>';
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
        ? buildingsTxt('buildings.detailSub', 'Oogst op de pil · upgrade opent het blad')
        : buildingsTxt('buildings.sub', 'Tik een fabriek · oogst op de pil · upgrade');
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
    this.paintBuildingsWallet(flashRes);
    const rows = (typeof buildingsList === 'function') ? buildingsList() : [];
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
        + (view.canCollect ? ' buildings-row-ready is-ready' : '');
      card.setAttribute('data-factory-id', view.id);
      card.dataset.buildingId = view.id;
      card.dataset.factoryId = view.id;
      const does = buildingsDoesLine(view);
      const lvBit = view.locked
        ? buildingsTxt('buildings.locked', 'Op slot')
        : (buildingsIsUnbuilt(view)
          ? buildingsTxt('buildings.unbuilt', 'Nog niet gebouwd')
          : buildingsTxt('buildings.level', 'Lv {n}', { n: view.level }));
      const nextHtml =
        '<button type="button" class="buildings-card-hit" data-factory-open="' + buildingsEscape(view.id) + '">'
        + '<span class="buildings-card-art hub-tile-ico">' + buildingsArtHtml(view) + '</span>'
        + '<span class="buildings-card-body">'
        + '<span class="buildings-card-name">' + buildingsEscape(view.name)
        + ' <span class="buildings-card-lv">' + buildingsEscape(lvBit) + '</span></span>'
        + '<span class="buildings-card-does">' + buildingsEscape(does) + '</span>'
        + '</span></button>'
        + buildingsPillHtml(view);
      if (quiet && card.querySelector('.buildings-card-does')) {
        const doesEl = card.querySelector('.buildings-card-does');
        const lvEl = card.querySelector('.buildings-card-lv');
        const pill = card.querySelector('[data-buildings-collect]');
        if (doesEl) doesEl.textContent = does;
        if (lvEl) lvEl.textContent = lvBit;
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
    const does = desc.doesLine || view.doesLine || '';
    const bits = [];
    bits.push('<div class="buildings-effect" data-buildings-effect="' + buildingsEscape(view && view.id) + '">');
    bits.push('<div class="buildings-effect-kicker">' + buildingsEscape(buildingsTxt('buildings.whatItDoes', 'Wat doet dit?')) + '</div>');
    if (does) bits.push('<p class="buildings-effect-does buildings-card-does">' + buildingsEscape(does) + '</p>');
    if (desc.blurb && desc.blurb !== does) {
      bits.push('<p class="buildings-effect-blurb">' + buildingsEscape(desc.blurb) + '</p>');
    }
    if (desc.produceLine) bits.push('<p class="buildings-effect-now">' + buildingsEscape(desc.produceLine) + '</p>');
    if (desc.powerLine) bits.push('<p class="buildings-effect-now">' + buildingsEscape(desc.powerLine) + '</p>');
    else if (desc.currentPowerLabel) {
      bits.push('<p class="buildings-effect-now">' + buildingsEscape(buildingsTxt(
        'buildings.powerNow', '{label} — {blurb}',
        { label: desc.currentPowerLabel, blurb: desc.currentPowerBlurb || '' }
      )) + '</p>');
    }
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
          + '<div class="buildings-stock-lbl">'
          + buildingsEscape(buildingsTxt('buildings.stored', '{n}/{cap} opgeslagen', { n: view.pending, cap: view.capacity }))
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
    const costHint = buildingsCostText(view);
    const unbuilt = buildingsIsUnbuilt(view);
    const atMax = buildingsIsMax(view);
    const broke = buildingsBrokeHint(view);
    const desc = buildingsDesc(view.id, view) || {};
    const ask = unbuilt
      ? buildingsTxt('buildings.buildAsk', 'Bouw {name}?', { name: view.name })
      : buildingsTxt('buildings.upgradeAsk', 'Upgrade naar Lv {next}?', { next: (view.level || 0) + 1 });
    const canPay = !!view.canUpgrade && !atMax && !view.locked;
    sheet.hidden = false;
    sheet.setAttribute('aria-hidden', 'false');
    sheet.classList.add('buildings-sheet', 'buildings-upgrade-sheet');
    sheet.innerHTML =
      '<button type="button" class="buildings-sheet-backdrop" data-buildings-sheet-close></button>'
      + '<div class="buildings-sheet-panel" role="dialog" aria-modal="true">'
      + '<h3>' + buildingsEscape(buildingsTxt('buildings.upgradeTitle', 'Upgrade {name}', { name: view.name })) + '</h3>'
      + (desc.doesLine ? '<p class="buildings-sheet-now">' + buildingsEscape(desc.doesLine) + '</p>' : '')
      + (desc.nextLine ? '<p class="buildings-sheet-now buildings-next">' + buildingsEscape(desc.nextLine) + '</p>' : '')
      + '<p class="buildings-upgrade-ask buildings-sheet-why">' + buildingsEscape(atMax
        ? buildingsTxt('buildings.upgradeMax', 'Max level')
        : ask) + '</p>'
      + (costHint ? '<p class="buildings-upgrade-cost buildings-sheet-cost">' + buildingsEscape(costHint) + '</p>' : '')
      + (!canPay && broke ? '<p class="buildings-sheet-why">' + buildingsEscape(broke) + '</p>' : '')
      + '<div class="buildings-sheet-actions buildings-cta-stack">'
      + (atMax
        ? ''
        : ('<button type="button" class="btn mode-btn b-continue big-touch buildings-cta" id="btnBuildingUpgradeConfirm"'
          + (canPay ? '' : ' disabled') + '>'
          + buildingsEscape(buildingsTxt('buildings.upgradeConfirm', 'Bevestig')) + '</button>'))
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
      lbl.textContent = buildingsTxt('buildings.stored', '{n}/{cap} opgeslagen', { n: view.pending, cap: view.capacity })
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
    if (typeof AudioSys !== 'undefined') { try { AudioSys.init(); AudioSys.sfx('claim'); } catch (_) { try { AudioSys.sfx('select'); } catch (__) {} } }
    const res = (typeof buildingsCollect === 'function') ? buildingsCollect(id) : { ok: false };
    if (res && res.ok) {
      const label = (typeof buildingsResourceLabel === 'function')
        ? buildingsResourceLabel(res.resourceId)
        : (res.resourceId || '');
      this.buildingsFlash = {
        id,
        resId: res.resourceId,
        resLabel: label,
        amount: res.amount || 0,
        until: Date.now() + 1800,
      };
      try {
        this.toast(res.message || buildingsTxt('buildings.collectDone', '+{n} {res}', { n: res.amount || 0, res: label }), 2400, { tone: 'ok' });
      } catch (_) {}
    } else {
      try {
        this.toast((res && res.message) || buildingsTxt('buildings.collectEmpty', 'Nog niks klaar'), 2200, { tone: 'warn' });
      } catch (_) {}
      if (id) this.buildingsShowDetail(id);
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
      try { this.toast(res.message || '', 2600, { tone: 'ok' }); } catch (_) {}
      this.buildingsStep = 'harvest';
      this.buildingsView = 'detail';
      this.buildingsPane = 'detail';
    } else {
      try { this.toast((res && res.message) || buildingsBrokeHint(buildingsGet && buildingsGet(id)) || '', 2200, { tone: 'warn' }); } catch (_) {}
    }
    this._buildingsDetailKey = '';
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };
}
