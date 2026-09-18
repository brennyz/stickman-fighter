/* ======================== BUILDINGS HOME UI ======================== */
/** List → detail → upgrade. Consumes systems #297 bind API when present:
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

if (typeof UI === 'object' && UI) {
  UI.buildingsTick = 0;
  UI.buildingsPane = 'list';
  UI.buildingsStep = 'harvest';
  UI.buildingsFlash = null;
  UI._buildingsDetailKey = '';
  UI._buildingsRowBound = {};

  UI.openBuildings = function openBuildings() {
    this.buildingsPane = 'list';
    this.buildingsView = 'list';
    this.buildingsStep = 'harvest';
    this.buildingsFlash = null;
    this._buildingsDetailKey = '';
    this._buildingsRowBound = {};
    this.stopBuildingsTick();
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

  UI.paintBuildingsWallet = function paintBuildingsWallet(flashRes) {
    const walletEl = document.getElementById('buildingsWallet');
    if (!walletEl) return;
    const model = buildingsWalletSnap();
    const chips = [];
    chips.push(
      '<span class="buildings-wallet-chip buildings-wallet-pc" data-res="petCoins">'
      + '<span class="buildings-wallet-lbl">' + buildingsEscape(buildingsTxt('buildings.walletPc', 'PC')) + '</span>'
      + '<span class="buildings-wallet-amt">' + buildingsEscape(model.petCoins) + '</span></span>'
    );
    for (const row of (model.resources || [])) {
      const flash = flashRes && flashRes === row.id ? ' is-flash' : '';
      chips.push(
        '<span class="buildings-wallet-chip' + flash + '" data-res="' + buildingsEscape(row.id)
        + '" data-res-id="' + buildingsEscape(row.id) + '">'
        + '<span class="buildings-wallet-lbl">' + buildingsEscape(row.label) + '</span>'
        + '<span class="buildings-wallet-amt">' + buildingsEscape(row.amount) + '</span></span>'
      );
    }
    walletEl.classList.add('buildings-wallet');
    walletEl.innerHTML = chips.join('');
  };

  UI.renderBuildings = function renderBuildings(opts) {
    const quiet = !!(opts && opts.quiet);
    const list = document.getElementById('buildingsList');
    const detail = document.getElementById('buildingsDetail');
    const note = document.getElementById('buildingsApiNote');
    const head = document.getElementById('buildingsScreenHead');
    const sub = document.getElementById('buildingsScreenSub');
    const scr = document.getElementById('buildingsScreen');
    if (head) head.textContent = buildingsTxt('buildings.title', 'Fabrieken');
    if (sub) {
      sub.textContent = this.buildingsPane === 'detail'
        ? buildingsTxt('buildings.detailSub', 'Tik Oogsten · upgrade is een aparte stap')
        : buildingsTxt('buildings.sub', 'Tik een fabriek · oogst · upgrade');
    }
    if (note) {
      const live = typeof buildingsHasSystemsApi === 'function' && buildingsHasSystemsApi();
      note.hidden = live;
      note.textContent = live
        ? buildingsTxt('buildings.liveNote', '')
        : buildingsTxt('buildings.stubNote', '');
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
    if (!rows.some((r) => r.id === sel)) sel = rows[0] && rows[0].id;
    const pane = this.buildingsPane === 'detail' ? 'detail' : 'list';
    const viewName = this.buildingsStep === 'upgrade' ? 'upgrade' : pane;
    this.buildingsView = viewName;
    if (scr) {
      scr.setAttribute('data-buildings-pane', pane);
      scr.setAttribute('data-buildings-view', viewName);
      scr.classList.toggle('buildings-pane-detail', pane === 'detail');
      scr.classList.toggle('buildings-pane-list', pane === 'list');
    }
    const overview = document.getElementById('buildingsOverview');
    const sheet = document.getElementById('buildingsUpgradeSheet');
    if (overview) overview.hidden = pane !== 'list';
    if (sheet) {
      sheet.hidden = viewName !== 'upgrade';
      sheet.setAttribute('aria-hidden', viewName === 'upgrade' ? 'false' : 'true');
    }
    if (list) this.paintBuildingsList(list, rows, sel);
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

  UI.paintBuildingsList = function paintBuildingsList(list, rows, sel) {
    const have = [...list.querySelectorAll('.buildings-row')].map((el) => el.getAttribute('data-factory-id'));
    const want = rows.map((r) => r.id);
    if (have.join('|') !== want.join('|')) {
      list.innerHTML = '';
      this._buildingsRowBound = {};
      for (const view of rows) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hub-tile buildings-row';
        btn.setAttribute('data-factory-id', view.id);
        btn.dataset.buildingId = view.id;
        btn.dataset.factoryId = view.id;
        list.appendChild(btn);
      }
    }
    for (const view of rows) {
      const btn = list.querySelector('[data-factory-id="' + view.id + '"]');
      if (!btn) continue;
      btn.className = 'hub-tile buildings-row'
        + (view.id === sel ? ' hub-tile-featured buildings-row-sel' : '')
        + (view.locked ? ' buildings-row-locked' : '')
        + (view.canCollect ? ' buildings-row-ready' : '');
      btn.setAttribute('data-factory-id', view.id);
      btn.dataset.buildingId = view.id;
      btn.dataset.factoryId = view.id;
      if (view.id === sel) {
        btn.setAttribute('data-hub-badge', view.canCollect
          ? buildingsTxt('buildings.collect', 'Oogsten')
          : buildingsTxt('buildings.level', 'Lv {n}', { n: view.level }));
      } else {
        btn.removeAttribute('data-hub-badge');
      }
      const lockBit = view.locked
        ? buildingsEscape(view.lockHint || buildingsTxt('buildings.locked', 'Op slot'))
        : buildingsTxt('buildings.level', 'Lv {n}', { n: view.level });
      const desc = buildingsDesc(view.id, view) || view;
      const does = desc.doesLine || view.sub || '';
      const stock = view.locked
        ? ''
        : (view.pending + '/' + view.capacity + ' ' + buildingsEscape(view.resourceLabel));
      btn.innerHTML =
        '<span class="hub-tile-ico">' + buildingsArtHtml(view) + '</span>'
        + '<span class="hub-tile-title">' + buildingsEscape(view.nameShort || view.name) + '</span>'
        + '<span class="hub-tile-sub">' + buildingsEscape(does) + '</span>'
        + '<span class="hub-tile-stat">' + lockBit + (stock ? ' · ' + stock : '') + '</span>';
      if (!this._buildingsRowBound[view.id]) {
        this._buildingsRowBound[view.id] = true;
        const id = view.id;
        const open = () => {
          if (typeof AudioSys !== 'undefined') { try { AudioSys.sfx('select'); } catch (_) {} }
          UI.buildingsShowDetail(id);
        };
        if (typeof bindPress === 'function') bindPress(btn, open);
        else btn.addEventListener('click', open);
      }
    }
  };

  UI.buildingsEffectHtml = function buildingsEffectHtml(view) {
    const desc = buildingsDesc(view && view.id, view) || view || {};
    const bits = [];
    bits.push('<div class="buildings-effect" data-buildings-effect="' + buildingsEscape(view.id) + '">');
    bits.push('<div class="buildings-effect-kicker">' + buildingsEscape(buildingsTxt('buildings.whatItDoes', 'Wat doet dit?')) + '</div>');
    if (desc.blurb) bits.push('<p class="buildings-effect-blurb">' + buildingsEscape(desc.blurb) + '</p>');
    if (desc.produceLine) bits.push('<p class="buildings-effect-now">' + buildingsEscape(desc.produceLine) + '</p>');
    if (desc.powerLine) bits.push('<p class="buildings-effect-now">' + buildingsEscape(desc.powerLine) + '</p>');
    else if (desc.doesLine) bits.push('<p class="buildings-effect-now">' + buildingsEscape(desc.doesLine) + '</p>');
    else if (desc.currentPowerLabel) {
      bits.push('<p class="buildings-effect-now">' + buildingsEscape(buildingsTxt(
        'buildings.powerNow', '{label} — {blurb}',
        { label: desc.currentPowerLabel, blurb: desc.currentPowerBlurb || '' }
      )) + '</p>');
    } else if (!(desc.built || view.built || view.level >= 1)) {
      bits.push('<p class="buildings-effect-now">' + buildingsEscape(buildingsTxt('buildings.powerNone', 'Bouw dit werk om de power te ontgrendelen')) + '</p>');
    }
    if (desc.nextLine) bits.push('<p class="buildings-effect-next">' + buildingsEscape(desc.nextLine) + '</p>');
    else if (desc.nextPower) {
      bits.push('<p class="buildings-effect-next">' + buildingsEscape(buildingsTxt(
        'buildings.powerNext', 'Volgende @ rank {n}: {label}',
        { n: desc.nextPower.rank, label: desc.nextPower.label || desc.nextPower.id }
      )) + '</p>');
    }
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
    const unbuilt = !locked && !(view.built || view.level >= 1);
    const step = this.buildingsStep === 'upgrade' ? 'upgrade' : 'harvest';
    const pct = view.capacity ? Math.min(100, Math.round((view.pending / view.capacity) * 100)) : 0;
    const eta = (!locked && view.pending < view.capacity && view.nextMs > 0)
      ? buildingsTxt('buildings.nextIn', 'Volgende over {t}', { t: (typeof buildingsFormatEta === 'function') ? buildingsFormatEta(view.nextMs) : '' })
      : '';
    const collectLbl = buildingsTxt('buildings.collect', 'Oogsten');
    const collectSub = locked
      ? (view.lockHint || '')
      : (unbuilt
        ? buildingsTxt('buildings.unbuilt', 'Nog niet gebouwd')
        : (view.canCollect
          ? buildingsTxt('buildings.collectSub', '{n} {res} klaar', { n: view.pending, res: view.resourceLabel })
          : buildingsTxt('buildings.collectEmpty', 'Nog niks klaar')));
    const flash = (this.buildingsFlash && this.buildingsFlash.id === view.id && this.buildingsFlash.until > Date.now())
      ? ('<div class="buildings-collect-flash" role="status">+' + buildingsEscape(this.buildingsFlash.amount)
        + ' ' + buildingsEscape(this.buildingsFlash.resLabel || view.resourceLabel) + '</div>')
      : '';
    const costHint = buildingsCostText(view);
    const upOpenLbl = unbuilt
      ? buildingsTxt('buildings.buildOpen', 'Bouwen…')
      : buildingsTxt('buildings.upgradeOpen', 'Upgrade…');
    const upAsk = unbuilt
      ? buildingsTxt('buildings.buildAsk', 'Bouw {name}?', { name: view.name })
      : buildingsTxt('buildings.upgradeAsk', 'Upgrade naar Lv {next}?', { next: (view.level || 0) + 1 });
    const overviewLbl = buildingsTxt('buildings.overview', 'Overzicht');
    let cta = '';
    if (step === 'upgrade') {
      cta =
        '<div class="buildings-upgrade-step">'
        + '<p class="buildings-upgrade-ask">' + buildingsEscape(upAsk) + '</p>'
        + (costHint ? '<p class="buildings-upgrade-cost">' + buildingsEscape(costHint) + '</p>' : '')
        + '<button type="button" class="btn mode-btn b-continue big-touch buildings-cta buildings-cta-upgrade" id="btnBuildingUpgradeConfirm"'
        + (view.canUpgrade ? '' : ' disabled') + '>'
        + '<span class="ico"><img src="assets/buttons/modes/upgrades.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEscape(buildingsTxt('buildings.upgradeConfirm', 'Bevestig'))
        + '<small>' + buildingsEscape(costHint || view.upgradeHint || '') + '</small></div></button>'
        + '<button type="button" class="btn mode-btn b-gray big-touch buildings-cta" id="btnBuildingUpgradeBack">'
        + '<div>' + buildingsEscape(buildingsTxt('buildings.upgradeBack', 'Terug naar oogst')) + '</div></button>'
        + '</div>';
    } else {
      cta =
        '<div class="buildings-cta-stack">'
        + '<button type="button" class="btn mode-btn b-continue big-touch buildings-cta buildings-cta-collect" id="btnBuildingCollect"'
        + (view.canCollect ? '' : ' disabled') + '>'
        + '<span class="ico"><img src="assets/buttons/chrome/claim.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEscape(collectLbl) + '<small>' + buildingsEscape(collectSub) + '</small></div></button>'
        + '<button type="button" class="btn mode-btn b-gray big-touch buildings-cta buildings-cta-upgrade" id="btnBuildingUpgrade"'
        + ((locked || (!view.canUpgrade && !unbuilt && view.level >= view.maxLevel)) ? ' disabled' : '') + '>'
        + '<span class="ico"><img src="assets/buttons/modes/upgrades.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + buildingsEscape(upOpenLbl) + '<small>' + buildingsEscape(costHint || view.upgradeHint || '') + '</small></div></button>'
        + '</div>';
    }
    host.innerHTML =
      '<button type="button" class="buildings-overview-btn" id="btnBuildingsOverview">'
      + buildingsEscape('← ' + overviewLbl) + '</button>'
      + '<div class="buildings-detail-art">' + buildingsArtHtml(view, 'buildings-art-img buildings-art-lg') + '</div>'
      + '<div class="buildings-detail-meta">'
      + '<div class="buildings-detail-name">' + buildingsEscape(view.name)
      + ' <span class="buildings-lv">' + buildingsEscape(unbuilt
        ? buildingsTxt('buildings.unbuilt', 'Nog niet gebouwd')
        : buildingsTxt('buildings.level', 'Lv {n}', { n: view.level })) + '</span></div>'
      + '<div class="buildings-detail-sub">' + buildingsEscape(view.sub) + '</div>'
      + this.buildingsEffectHtml(view)
      + (locked
        ? '<div class="buildings-lock">' + buildingsEscape(view.lockHint) + '</div>'
        : '<div class="buildings-stock">'
          + '<div class="buildings-stock-bar" role="progressbar" aria-valuenow="' + view.pending + '" aria-valuemax="' + view.capacity + '">'
          + '<span style="width:' + pct + '%"></span></div>'
          + '<div class="buildings-stock-lbl">'
          + buildingsEscape(buildingsTxt('buildings.stored', '{n}/{cap} opgeslagen', { n: view.pending, cap: view.capacity }))
          + (eta ? ' · ' + buildingsEscape(eta) : '')
          + '</div></div>')
      + flash
      + '</div>'
      + cta;
    const overviewBtn = document.getElementById('btnBuildingsOverview');
    const collectBtn = document.getElementById('btnBuildingCollect');
    const upBtn = document.getElementById('btnBuildingUpgrade');
    const upConfirm = document.getElementById('btnBuildingUpgradeConfirm');
    const upBack = document.getElementById('btnBuildingUpgradeBack');
    const bind = (el, fn) => {
      if (!el) return;
      if (typeof bindPress === 'function') bindPress(el, fn);
      else el.addEventListener('click', fn);
    };
    bind(overviewBtn, () => UI.buildingsShowList());
    bind(collectBtn, () => UI.doBuildingCollect(view.id));
    bind(upBtn, () => UI.buildingsShowUpgradeStep());
    bind(upConfirm, () => UI.doBuildingUpgrade(view.id));
    bind(upBack, () => { UI.buildingsGoBack(); });
    this.paintBuildingsUpgradeSheet(view, step === 'upgrade');
  };

  UI.paintBuildingsUpgradeSheet = function paintBuildingsUpgradeSheet(view, open) {
    const sheet = document.getElementById('buildingsUpgradeSheet');
    if (!sheet) return;
    if (!open || !view) {
      sheet.hidden = true;
      sheet.innerHTML = '';
      return;
    }
    const costHint = buildingsCostText(view);
    const unbuilt = !(view.built || view.level >= 1);
    const ask = unbuilt
      ? buildingsTxt('buildings.buildAsk', 'Bouw {name}?', { name: view.name })
      : buildingsTxt('buildings.upgradeAsk', 'Upgrade naar Lv {next}?', { next: (view.level || 0) + 1 });
    const desc = buildingsDesc(view.id, view) || {};
    sheet.hidden = false;
    sheet.setAttribute('aria-hidden', 'false');
    sheet.innerHTML =
      '<button type="button" class="buildings-sheet-backdrop" data-buildings-sheet-close></button>'
      + '<div class="buildings-sheet-panel" role="dialog" aria-modal="true">'
      + '<h3>' + buildingsEscape(buildingsTxt('buildings.upgradeTitle', 'Upgrade {name}', { name: view.name })) + '</h3>'
      + (desc.nextLine ? '<p class="buildings-upgrade-ask">' + buildingsEscape(desc.nextLine) + '</p>' : '')
      + '<p class="buildings-upgrade-ask">' + buildingsEscape(ask) + '</p>'
      + (costHint ? '<p class="buildings-upgrade-cost">' + buildingsEscape(costHint) + '</p>' : '')
      + '<button type="button" class="btn mode-btn b-continue big-touch buildings-cta" id="btnBuildingUpgradeDo"'
      + (view.canUpgrade ? '' : ' disabled') + '>'
      + buildingsEscape(buildingsTxt('buildings.upgradeConfirm', 'Bevestig')) + '</button>'
      + '<button type="button" class="btn mode-btn b-gray big-touch buildings-cta" data-buildings-sheet-close>'
      + buildingsEscape(buildingsTxt('buildings.sheetClose', 'Sluiten')) + '</button>'
      + '</div>';
    const close = () => UI.buildingsGoBack();
    sheet.querySelectorAll('[data-buildings-sheet-close]').forEach((el) => {
      if (typeof bindPress === 'function') bindPress(el, close);
      else el.addEventListener('click', close);
    });
    const doBtn = document.getElementById('btnBuildingUpgradeDo');
    if (doBtn) {
      if (typeof bindPress === 'function') bindPress(doBtn, () => UI.doBuildingUpgrade(view.id));
      else doBtn.addEventListener('click', () => UI.doBuildingUpgrade(view.id));
    }
  };

  UI.refreshBuildingsDetail = function refreshBuildingsDetail(host, view) {
    if (!host || !view) return;
    const bar = host.querySelector('.buildings-stock-bar span');
    const lbl = host.querySelector('.buildings-stock-lbl');
    const collectBtn = document.getElementById('btnBuildingCollect');
    const pct = view.capacity ? Math.min(100, Math.round((view.pending / view.capacity) * 100)) : 0;
    if (bar) bar.style.width = pct + '%';
    if (lbl) {
      const eta = (!view.locked && view.pending < view.capacity && view.nextMs > 0)
        ? buildingsTxt('buildings.nextIn', 'Volgende over {t}', { t: (typeof buildingsFormatEta === 'function') ? buildingsFormatEta(view.nextMs) : '' })
        : '';
      lbl.textContent = buildingsTxt('buildings.stored', '{n}/{cap} opgeslagen', { n: view.pending, cap: view.capacity })
        + (eta ? ' · ' + eta : '');
    }
    if (collectBtn) {
      collectBtn.disabled = !view.canCollect;
      const small = collectBtn.querySelector('small');
      if (small) {
        small.textContent = view.locked
          ? (view.lockHint || '')
          : (view.canCollect
            ? buildingsTxt('buildings.collectSub', '{n} {res} klaar', { n: view.pending, res: view.resourceLabel })
            : buildingsTxt('buildings.collectEmpty', 'Nog niks klaar'));
      }
    }
    const effect = host.querySelector('[data-buildings-effect]');
    if (effect) {
      const wrap = document.createElement('div');
      wrap.innerHTML = this.buildingsEffectHtml(view);
      if (wrap.firstChild) effect.replaceWith(wrap.firstChild);
    }
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
    } else {
      try { this.toast((res && res.message) || '', 2200, { tone: 'warn' }); } catch (_) {}
    }
    this._buildingsDetailKey = '';
    this.renderBuildings();
    try { this.renderMenu(); } catch (_) {}
  };
}
