/* ======================== PETS HOME UI ======================== */
/** First-class pets screen: wallet + hero + next-goal + list→detail.
 *  Dex pets (combat assist) and egg pets (cosmetic). No Versus. */

function petsEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function petsTxt(key, fallback, params) {
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

function petsSpeciesName(def) {
  if (!def) return '';
  const sp = (typeof SPECIES !== 'undefined') ? SPECIES[def.speciesId] : null;
  return (sp && sp.name) || def.id;
}

function petsIsNarrow() {
  try {
    return typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(max-width: 480px)').matches;
  } catch (_) {
    return false;
  }
}

function petsRarityPill(rid) {
  const rar = (typeof rarityOf === 'function') ? rarityOf(rid) : { color: '#8fa3d9' };
  const label = (typeof rarityLabel === 'function') ? rarityLabel(rid) : rid;
  return '<span class="rar-pill" style="color:' + petsEscape(rar.color)
    + ';border-color:' + petsEscape(rar.color) + '">' + petsEscape(label) + '</span>';
}

if (typeof UI === 'object' && UI) {
  UI.petTab = UI.petTab || 'dex';
  UI.petFilter = UI.petFilter || 'all';
  UI.petsPane = UI.petsPane || 'list';
  UI.petsSelId = UI.petsSelId || null;
  UI.petsSelKind = UI.petsSelKind || 'dex';
  UI._petsRowBound = {};
  UI._petsHeroRaf = 0;
  UI._petsHeroT = 0;

  UI.openPets = function openPets(tab, opts) {
    if (tab && typeof tab === 'object' && !Array.isArray(tab)) {
      opts = tab;
      tab = opts.tab || opts.kind || null;
    }
    opts = opts || {};
    this.petTab = tab || this.petTab || 'dex';
    this.petsPane = 'list';
    this.petsSelId = null;
    if (opts.from === 'home' || opts.from === 'equip') {
      const active = (typeof activePetDef === 'function') ? activePetDef() : null;
      const firstId = (typeof tamedPetIds === 'function' && tamedPetIds()[0]) || null;
      const pick = active || ((typeof petDef === 'function' && firstId) ? petDef(firstId) : null);
      if (pick) {
        this.petsSelKind = 'dex';
        this.petsSelId = pick.id;
        if (opts.from === 'equip') this.petsPane = 'detail';
      }
    }
    this.safeOpen('petScreen', () => this.renderPets(), {
      msg: petsTxt('ui.errLoadScreen', 'Could not load screen'),
    });
  };

  UI.petsGoBack = function petsGoBack() {
    if (this.petsPane === 'detail') {
      this.petsShowList();
      return true;
    }
    this.stopPetsHeroTick();
    return false;
  };

  UI.petsShowList = function petsShowList() {
    this.petsPane = 'list';
    this.renderPets();
  };

  UI.petsShowDetail = function petsShowDetail(kind, id) {
    this.petsPane = 'detail';
    this.petsSelKind = kind || this.petTab || 'dex';
    this.petsSelId = id || null;
    this.renderPets();
  };

  UI.startPetsHeroTick = function startPetsHeroTick() {
    this.stopPetsHeroTick();
    if (typeof motionReduced === 'function' && motionReduced()) return;
    let n = 0;
    const step = (ts) => {
      const scr = document.getElementById('petScreen');
      if (!scr || !scr.classList.contains('active')) {
        this._petsHeroRaf = 0;
        return;
      }
      this._petsHeroT = (ts || 0) / 1000;
      n++;
      if (n % 4 === 1) this.paintPetsHero(true);
      this._petsHeroRaf = requestAnimationFrame(step);
    };
    this._petsHeroRaf = requestAnimationFrame(step);
  };

  UI.stopPetsHeroTick = function stopPetsHeroTick() {
    if (this._petsHeroRaf) {
      try { cancelAnimationFrame(this._petsHeroRaf); } catch (_) {}
      this._petsHeroRaf = 0;
    }
  };

  UI.paintPetsWallet = function paintPetsWallet() {
    const el = document.getElementById('petsWallet');
    if (!el) return;
    const w = (typeof petsWalletModel === 'function') ? petsWalletModel() : {
      petCoins: (typeof petCoinsBalance === 'function') ? petCoinsBalance() : 0,
      tamed: (typeof petTamedCount === 'function') ? petTamedCount() : 0,
      total: (typeof PET_ROSTER !== 'undefined') ? PET_ROSTER.length : 0,
      eggs: (typeof eggOwnedCount === 'function') ? eggOwnedCount() : 0,
      eggTotal: (typeof EGG_ROSTER !== 'undefined') ? EGG_ROSTER.length : 0,
      dailyReady: false,
    };
    const chip = (cls, lbl, amt) =>
      '<span class="pets-wallet-chip ' + cls + '">'
      + '<span class="pets-wallet-lbl">' + petsEscape(lbl) + '</span>'
      + '<span class="pets-wallet-amt">' + petsEscape(amt) + '</span></span>';
    const eggChip = w.dailyReady
      ? '<button type="button" class="pets-wallet-chip pets-wallet-egg is-ready" data-pets-wallet="egg">'
        + '<span class="pets-wallet-lbl">' + petsEscape(petsTxt('pets.walletEggReady', 'Egg')) + '</span>'
        + '<span class="pets-wallet-amt">' + petsEscape(petsTxt('pets.ready', 'ready')) + '</span></button>'
      : chip('pets-wallet-egg', petsTxt('pets.walletEgg', 'Egg'), w.eggs + '/' + w.eggTotal);
    el.classList.add('pets-wallet');
    el.innerHTML =
      chip('pets-wallet-pc', petsTxt('pets.walletPc', 'PC'), w.petCoins)
      + chip('pets-wallet-dex', petsTxt('pets.walletDex', 'Dex'), w.tamed + '/' + w.total)
      + eggChip;
    const eggAct = el.querySelector('[data-pets-wallet="egg"]');
    if (eggAct && typeof bindPress === 'function') {
      bindPress(eggAct, () => {
        try { AudioSys.sfx('select'); } catch (_) {}
        UI.doCrackDailyEgg();
      });
    }
  };

  UI.paintPetsNext = function paintPetsNext() {
    const el = document.getElementById('petsNext');
    if (!el) return;
    const goal = (typeof petsNextGoal === 'function') ? petsNextGoal() : null;
    const line = (typeof petsNextGoalLine === 'function')
      ? petsNextGoalLine()
      : petsTxt('pets.nextHint', 'Hunt in the monster book or play coin bonus');
    el.textContent = line;
    el.hidden = !line;
    const act = !!(goal && (goal.kind === 'egg' || goal.kind === 'claim' || goal.kind === 'buy'));
    el.classList.toggle('is-act', act);
    el.disabled = !act;
    el.dataset.petsNext = (goal && goal.kind) || '';
    el.dataset.petsNextId = (goal && goal.id) || '';
    if (!el.dataset.bound && typeof bindPress === 'function') {
      el.dataset.bound = '1';
      bindPress(el, () => {
        if (el.disabled) return;
        try { AudioSys.sfx('select'); } catch (_) {}
        const kind = el.dataset.petsNext;
        const id = el.dataset.petsNextId;
        if (kind === 'egg') {
          UI.doCrackDailyEgg();
          return;
        }
        if ((kind === 'claim' || kind === 'buy') && id) {
          UI.petTab = 'dex';
          UI.petsShowDetail('dex', id);
        }
      });
    }
  };

  UI.paintPetsCrackCta = function paintPetsCrackCta() {
    const crackBtn = document.getElementById('eggCrackBtn');
    if (!crackBtn) return;
    if (typeof ensureEggDaily === 'function') {
      try { ensureEggDaily(); } catch (_) {}
    }
    const ready = (typeof canCrackDailyEgg === 'function') ? canCrackDailyEgg() : false;
    crackBtn.hidden = !ready;
    crackBtn.disabled = !ready;
    crackBtn.classList.toggle('is-ready', ready);
    crackBtn.classList.toggle('is-wait', !ready);
    if (ready) {
      crackBtn.innerHTML =
        '<span class="ico"><img src="assets/buttons/chrome/egg.svg" alt="" width="28" height="28" decoding="async" draggable="false"></span>'
        + '<div>' + petsEscape(petsTxt('pets.crackEgg', 'Open daily egg'))
        + '<small>' + petsEscape(petsTxt('pets.crackEggSub', 'Free arcade pull')) + '</small></div>';
    }
    if (!crackBtn.dataset.bound && typeof bindPress === 'function') {
      crackBtn.dataset.bound = '1';
      bindPress(crackBtn, () => UI.doCrackDailyEgg());
    }
  };

  UI.doCrackDailyEgg = function doCrackDailyEgg() {
    const run = () => {
      const ready = (typeof canCrackDailyEgg === 'function') ? canCrackDailyEgg() : false;
      if (!ready) {
        UI.petTab = 'egg';
        UI.petsPane = 'list';
        UI.renderPets();
        return;
      }
      const res = (typeof crackDailyEgg === 'function') ? crackDailyEgg() : null;
      if (!res) {
        UI.toast(petsTxt('toast.eggAlreadyOpened', 'Egg already opened today'), 2200);
        UI.renderPets();
        return;
      }
      try { AudioSys.sfx('diceRoll'); } catch (_) {}
      const name = (typeof eggLabel === 'function') ? eggLabel(res.def, 'name') : res.def.name;
      UI.toast(res.duplicate
        ? petsTxt('toast.eggDuplicateUi', 'Duplicate egg: {name} (+10 XP)', { name })
        : petsTxt('toast.eggHatch', 'Hatched {name} · {rarity}', {
          name,
          rarity: (typeof rarityLabel === 'function') ? rarityLabel(res.def.rarity) : res.def.rarity,
        }), 3600);
      UI.petTab = 'egg';
      UI.petsSelKind = 'egg';
      UI.petsSelId = res.def.id;
      UI.petsPane = 'detail';
      UI.renderPets();
      if (typeof UI.renderMenu === 'function') UI.renderMenu();
    };
    if (typeof safeUiAction === 'function') {
      safeUiAction(run, 'crackDailyEgg', petsTxt('ui.errEggCrack', 'Could not open egg'));
    } else run();
  };

  UI.paintPausePetChip = function paintPausePetChip() {
    const chip = document.getElementById('pausePetChip');
    const lbl = document.getElementById('pausePetChipLbl');
    if (!chip) return;
    if (typeof game !== 'undefined' && game && game.mode === 'versus') {
      chip.hidden = true;
      return;
    }
    chip.hidden = false;
    const ids = (typeof tamedPetIds === 'function') ? tamedPetIds() : [];
    const active = (typeof activePetDef === 'function') ? activePetDef() : null;
    if (!ids.length) {
      chip.disabled = true;
      chip.classList.add('is-empty');
      if (lbl) {
        lbl.textContent = petsIsNarrow()
          ? petsTxt('pets.pauseNoneHint', 'No pet yet · hunt or buy')
          : petsTxt('pets.pauseNone', 'No pet yet');
      }
      return;
    }
    chip.disabled = false;
    chip.classList.remove('is-empty');
    const name = petsSpeciesName(active || ((typeof petDef === 'function') ? petDef(ids[0]) : null));
    if (!active) {
      if (lbl) lbl.textContent = petsTxt('pets.pauseEquip', 'Equip · {name}', { name });
    } else if (ids.length > 1) {
      if (lbl) lbl.textContent = petsTxt('pets.pauseCycle', 'Swap · {name}', { name });
    } else {
      if (lbl) lbl.textContent = petsTxt('pets.pauseActive', '{name} follows', { name });
    }
  };

  UI.paintPetsHero = function paintPetsHero(quiet) {
    const nameEl = document.getElementById('petsHeroName');
    const perkEl = document.getElementById('petsHeroPerk');
    const bonusEl = document.getElementById('petsHeroBonus');
    const cv = document.getElementById('petsHeroCanvas');
    const tab = this.petTab || 'dex';
    const t = this._petsHeroT || 1.2;
    if (tab === 'egg') {
      const def = (typeof activeEggPetDef === 'function') ? activeEggPetDef() : null;
      const narrowEgg = petsIsNarrow();
      if (nameEl) nameEl.textContent = def
        ? ((typeof eggLabel === 'function') ? eggLabel(def, 'name') : def.name)
        : petsTxt(narrowEgg ? 'pets.heroEmptyShort' : 'pets.heroEmptyEgg', 'No egg');
      if (perkEl) perkEl.textContent = def
        ? ((typeof eggLabel === 'function') ? eggLabel(def, 'perk') : (def.perk || ''))
        : ((typeof petsNextGoalLine === 'function')
          ? petsNextGoalLine()
          : petsTxt(narrowEgg ? 'pets.emptyEggFirst' : 'pets.heroEggHint', 'Open the daily egg'));
      if (bonusEl) bonusEl.textContent = def
        ? petsTxt('pets.eggCosmeticHero', 'Look only — no combat boost')
        : '';
      if (cv) {
        const cc = cv.getContext('2d');
        cc.clearRect(0, 0, cv.width, cv.height);
        cc.save();
        cc.translate(cv.width / 2, cv.height / 2 + 8);
        if (typeof drawEggPetArt === 'function') {
          drawEggPetArt(cc, def || { id: 'egg_pebble', name: '?', rarity: 'common', c1: '#3a4050', c2: '#20242e', pattern: 'speckle' }, 28, t, 0, 0, !def);
        }
        cc.restore();
      }
      return;
    }
    const def = (typeof activePetDef === 'function') ? activePetDef() : null;
    const sp = def && typeof SPECIES !== 'undefined' ? SPECIES[def.speciesId] : null;
    const narrow = petsIsNarrow();
    if (nameEl) nameEl.textContent = def && sp
      ? sp.name
      : petsTxt(narrow ? 'pets.heroEmptyShort' : 'pets.heroEmpty', 'No pet');
      if (perkEl) perkEl.textContent = def
        ? ((typeof petPerkLine === 'function') ? petPerkLine(def) : (def.perk || ''))
        : ((typeof petsNextGoalLine === 'function')
          ? petsNextGoalLine()
          : petsTxt(narrow ? 'pets.emptyFirst' : 'pets.heroFollows', 'Tame via kills or buy with PC'));
    if (bonusEl) {
      bonusEl.textContent = def
        ? ((typeof petLiveBonusLine === 'function') ? petLiveBonusLine(def) : '')
        : '';
    }
    if (cv) {
      const cc = cv.getContext('2d');
      cc.clearRect(0, 0, cv.width, cv.height);
      cc.save();
      cc.translate(cv.width / 2, cv.height / 2 + 18);
      cc.scale(1.15, 1.15);
      if (def && sp && typeof drawMonsterArt === 'function') {
        drawMonsterArt(cc, sp, sp.size, t, false, false);
      } else {
        cc.strokeStyle = 'rgba(124,245,255,.45)';
        cc.lineWidth = 2;
        cc.setLineDash([5, 4]);
        cc.beginPath();
        cc.arc(0, -8, 28, 0, Math.PI * 2);
        cc.stroke();
        cc.setLineDash([]);
        cc.fillStyle = 'rgba(232,240,255,.55)';
        cc.font = '800 13px Nunito, sans-serif';
        cc.textAlign = 'center';
        cc.fillText('?', 0, -2);
      }
      cc.restore();
    }
    if (!quiet) { /* name/perk already set */ }
  };

  UI.renderPets = function renderPets() {
    const tab = this.petTab || 'dex';
    const scr = document.getElementById('petScreen');
    if (scr) {
      scr.classList.add('pets-screen');
      scr.setAttribute('data-pets-tab', tab);
      scr.setAttribute('data-pets-pane', this.petsPane === 'detail' ? 'detail' : 'list');
    }
    const bar = document.getElementById('petTabBar');
    if (bar) {
      const tamed = (typeof petTamedCount === 'function') ? petTamedCount() : 0;
      const eggs = (typeof eggOwnedCount === 'function') ? eggOwnedCount() : 0;
      const petTotal = (typeof PET_ROSTER !== 'undefined') ? PET_ROSTER.length : 0;
      const eggTotal = (typeof EGG_ROSTER !== 'undefined') ? EGG_ROSTER.length : 0;
      const narrowTabs = petsIsNarrow();
      bar.innerHTML =
        '<button type="button" class="dex-filter-btn' + (tab === 'dex' ? ' active' : '') + '" data-pet-tab="dex" role="tab" aria-selected="' + (tab === 'dex' ? 'true' : 'false') + '">'
        + petsEscape(petsTxt('pets.tabDex', 'Dex · {n}/{total}', { n: tamed, total: petTotal })) + '</button>'
        + '<button type="button" class="dex-filter-btn' + (tab === 'egg' ? ' active' : '') + '" data-pet-tab="egg" role="tab" aria-selected="' + (tab === 'egg' ? 'true' : 'false') + '">'
        + petsEscape(petsTxt(narrowTabs ? 'pets.tabEggShort' : 'pets.tabEgg', 'Egg · {n}/{total}', { n: eggs, total: eggTotal })) + '</button>';
      bar.querySelectorAll('[data-pet-tab]').forEach((btn) => {
        if (typeof bindPress === 'function') {
          bindPress(btn, () => {
            try { AudioSys.sfx('select'); } catch (_) {}
            UI.petTab = btn.getAttribute('data-pet-tab') || 'dex';
            UI.petsPane = 'list';
            UI.petsSelKind = UI.petTab;
            UI.petsSelId = null;
            UI.renderPets();
          });
        }
      });
    }
    const dexPanel = document.getElementById('petDexPanel');
    const eggPanel = document.getElementById('petEggPanel');
    if (dexPanel) dexPanel.style.display = tab === 'dex' ? '' : 'none';
    if (eggPanel) eggPanel.style.display = tab === 'egg' ? '' : 'none';
    this.paintPetsWallet();
    this.paintPetsNext();
    this.paintPetsCrackCta();
    this.paintPetsHero(false);
    if (tab === 'egg') this.renderEggPets();
    else this.renderDexPets();
    this.paintPetsDetail();
    this.startPetsHeroTick();
  };

  UI.renderDexPets = function renderDexPets() {
    if (!this.petFilter || ['all', 'ready', 'progress', 'tamed'].indexOf(this.petFilter) < 0) {
      this.petFilter = 'all';
    }
    const filterBar = document.getElementById('petFilterBar');
    if (filterBar) {
      const filters = [
        ['all', petsTxt('pets.filterAll', 'All')],
        ['ready', petsTxt('pets.filterReady', 'Ready')],
        ['progress', petsTxt('pets.filterProgress', 'In progress')],
        ['tamed', petsTxt('pets.filterTamed', 'Tamed')],
      ];
      filterBar.innerHTML = filters.map(([key, label]) =>
        '<button type="button" class="dex-filter-btn pets-filter-btn' + (this.petFilter === key ? ' active' : '')
        + '" data-pet-filter="' + key + '" role="tab" aria-selected="' + (this.petFilter === key ? 'true' : 'false') + '">'
        + petsEscape(label) + '</button>'
      ).join('');
      filterBar.querySelectorAll('[data-pet-filter]').forEach((btn) => {
        if (typeof bindPress === 'function') {
          bindPress(btn, () => {
            try { AudioSys.sfx('select'); } catch (_) {}
            UI.petFilter = btn.getAttribute('data-pet-filter') || 'all';
            UI.renderPets();
          });
        }
      });
    }
    const sumEl = document.getElementById('petSummary');
    if (sumEl) {
      const pBr = (typeof petRarityBreakdown === 'function') ? petRarityBreakdown() : {};
      const pTotals = (typeof petRarityTotals === 'function') ? petRarityTotals() : {};
      const petChips = (typeof RARITIES !== 'undefined')
        ? Object.keys(RARITIES).map((rid) => {
          const rar = RARITIES[rid];
          const n = pBr[rid] || 0;
          const tot = pTotals[rid] || 0;
          if (!tot) return '';
          return '<span class="rar-pill" style="color:' + petsEscape(rar.color) + ';border-color:'
            + petsEscape(rar.color) + '">' + petsEscape((typeof rarityLabel === 'function') ? rarityLabel(rid) : rid)
            + ' ' + n + '/' + tot + '</span>';
        }).filter(Boolean).join(' ')
        : '';
      if (petChips) {
        sumEl.style.display = 'block';
        sumEl.className = 'pets-rar-strip';
        sumEl.innerHTML = petChips;
      } else {
        sumEl.style.display = 'none';
        sumEl.innerHTML = '';
      }
    }
    const list = document.getElementById('petList');
    if (!list) return;
    const rows = (typeof petsFilterRoster === 'function')
      ? petsFilterRoster(this.petFilter)
      : PET_ROSTER.slice();
    const countEl = document.getElementById('petFilterCount');
    if (countEl) {
      countEl.textContent = rows.length
        ? petsTxt('pets.filterCount', '{n} pets', { n: rows.length })
        : petsTxt('pets.emptyFilter', 'Nothing in this filter');
    }
    if (!this.petsSelId && rows[0]) this.petsSelId = rows[0].id;
    if (this.petsSelId && !rows.some((d) => d.id === this.petsSelId) && rows[0]) this.petsSelId = rows[0].id;
    list.innerHTML = '';
    this._petsRowBound = {};
    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'pets-empty';
      const tamed = (typeof petTamedCount === 'function') ? petTamedCount() : 0;
      const title = (this.petFilter === 'tamed' && !tamed)
        ? petsTxt('pets.emptyFirst', 'Tame via kills or buy with PC')
        : petsTxt('pets.emptyFilter', 'Nothing in this filter');
      empty.innerHTML = '<p class="pets-empty-copy">' + petsEscape(title) + '</p>';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn mode-btn big-touch pets-empty-btn';
      btn.textContent = petsTxt('pets.emptyFilterAct', 'Show all');
      if (typeof bindPress === 'function') {
        bindPress(btn, () => {
          try { AudioSys.sfx('select'); } catch (_) {}
          UI.petFilter = 'all';
          UI.renderPets();
        });
      }
      empty.appendChild(btn);
      list.appendChild(empty);
      return;
    }
    for (const def of rows) {
      list.appendChild(this.paintDexPetCard(def));
    }
  };

  UI.paintDexPetCard = function paintDexPetCard(def) {
    const sp = SPECIES[def.speciesId];
    const st = (typeof petStatusOf === 'function') ? petStatusOf(def) : { tamed: false, active: false, kills: 0, need: 1, cost: 0, canBuy: false, canClaim: false, pct: 0, status: 'locked' };
    const rar = (typeof rarityOf === 'function' && sp) ? rarityOf(sp.rarity) : { color: '#8fa3d9' };
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'card pets-card'
      + (st.tamed ? '' : ' locked')
      + (st.active ? ' sel' : '')
      + (this.petsSelId === def.id ? ' pets-card-sel' : '')
      + (st.canBuy || st.canClaim ? ' dex-available pets-card-ready' : '');
    el.setAttribute('data-pet-id', def.id);
    el.setAttribute('role', 'listitem');
    if (st.tamed) el.style.borderColor = rar.color;
    const cv = document.createElement('canvas');
    const thumb = petsIsNarrow() ? 48 : 64;
    cv.width = thumb; cv.height = thumb;
    cv.setAttribute('aria-hidden', 'true');
    const cc = cv.getContext('2d');
    cc.translate(thumb / 2, thumb * 0.6);
    cc.scale(0.55, 0.55);
    if (sp && typeof drawMonsterArt === 'function' && (st.tamed || !petsIsNarrow())) {
      if (!st.tamed) cc.globalAlpha = 0.72;
      drawMonsterArt(cc, sp, sp.size, 1.2, false, false);
    } else if (!st.tamed) {
      cc.strokeStyle = 'rgba(232,240,255,.4)';
      cc.lineWidth = 3;
      if (typeof cc.setLineDash === 'function') cc.setLineDash([4, 3]);
      cc.beginPath();
      cc.arc(0, -10, 20, 0, Math.PI * 2);
      cc.stroke();
    }
    const info = document.createElement('div');
    info.className = 'pets-card-body';
    const badge = st.active
      ? ' <span class="rar-pill pets-pill-on" style="color:#7cf5ff;border-color:#7cf5ff">' + petsEscape(petsTxt('ui.petActive', 'active').toUpperCase()) + '</span>'
      : '';
    const upLv = st.tamed && typeof itemUpgradeLevel === 'function' ? itemUpgradeLevel('pet', def.id) : 0;
    const upMax = st.tamed && typeof itemUpgradeMax === 'function' ? itemUpgradeMax('pet', def.id) : 0;
    const upBadge = upLv > 0
      ? ' <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">↑ Lv ' + upLv + '/' + upMax + '</span>'
      : '';
    const petEntry = st.tamed && save.pets ? save.pets[def.id] : null;
    const chestPetSk = petEntry && typeof petEntry.skill === 'string' ? petEntry.skill : null;
    const chestPetBadge = chestPetSk
      ? ' <span class="rar-pill" style="color:#ffd75e;border-color:#ffd75e">' + petsEscape(petsTxt('ui.weaponChestBadge', 'Chest')) + '</span>'
      : '';
    let statusLine;
    if (st.tamed) {
      statusLine = st.active
        ? petsTxt('pets.listActive', 'On')
        : petsTxt('pets.listTamed', 'Tamed');
    } else if (st.canClaim) {
      statusLine = petsTxt('pets.claim', 'tame');
    } else if (st.canBuy) {
      statusLine = petsTxt('pets.buyCta', 'Buy · {cost} PC', { cost: st.cost });
    } else {
      statusLine = petsTxt('pets.listLocked', '{cur}/{need} · {cost} PC', {
        cur: Math.min(st.kills, st.need), need: st.need, cost: st.cost,
      });
    }
    const barPct = st.tamed ? 100 : st.pct;
    info.innerHTML =
      '<div class="cname">' + petsEscape(sp ? sp.name : def.id) + ' '
      + petsRarityPill(sp ? sp.rarity : 'common') + badge + chestPetBadge + upBadge + '</div>'
      + '<div class="cinfo pets-status">' + statusLine + '</div>'
      + '<div class="pets-bar" aria-hidden="true"><span style="width:' + barPct + '%"></span></div>';
    const right = document.createElement('div');
    right.className = 'right';
    if (st.tamed) {
      right.innerHTML = st.active
        ? ((typeof SVG_CHECK_MINI !== 'undefined' ? SVG_CHECK_MINI : '✓') + ' ' + petsEscape(petsTxt('ui.petActive', 'active')))
        : petsEscape(petsTxt('ui.petEquip', 'equip'));
    } else if (st.canClaim) {
      right.textContent = petsTxt('pets.claim', 'tame');
      right.style.color = '#7cfc8a';
    } else if (st.canBuy) {
      right.innerHTML = petsEscape(petsTxt('ui.petBuy', 'buy')) + '<br>' + st.cost
        + (typeof SVG_COIN_ICON !== 'undefined' ? (' ' + SVG_COIN_ICON) : ' PC');
      right.style.color = '#ff9ad5';
    } else {
      right.textContent = st.kills > 0
        ? petsTxt('pets.killsLeft', '{n} kills left', { n: Math.max(0, st.need - st.kills) })
        : (st.cost + ' PC');
      right.style.opacity = '0.7';
    }
    el.appendChild(cv);
    el.appendChild(info);
    el.appendChild(right);
    const id = def.id;
    if (typeof bindPress === 'function') {
      bindPress(el, () => {
        try { AudioSys.sfx('select'); } catch (_) {}
        UI.petsShowDetail('dex', id);
      });
    }
    return el;
  };

  UI.renderEggPets = function renderEggPets() {
    if (typeof ensureEggDaily === 'function') ensureEggDaily();
    const sum = (typeof eggProgressSummary === 'function') ? eggProgressSummary() : { owned: 0, total: 0, activeName: '', daily: '' };
    const sumEl = document.getElementById('eggSummary');
    if (sumEl) {
      sumEl.style.display = 'block';
      if (petsIsNarrow()) {
        sumEl.innerHTML = petsTxt('pets.eggSumShort', '{owned}/{total} · {daily}', {
          owned: '<b>' + sum.owned + '</b>', total: '<b>' + sum.total + '</b>',
          daily: '<b>' + petsEscape(sum.daily) + '</b>',
        });
      } else {
        sumEl.innerHTML =
          petsTxt('ui.eggSummary', 'Collected {owned}/{total} · active {active} · {daily}', {
            owned: '<b>' + sum.owned + '</b>', total: '<b>' + sum.total + '</b>',
            active: '<b>' + petsEscape(sum.activeName) + '</b>', daily: '<b>' + petsEscape(sum.daily) + '</b>',
          })
          + '<div class="pets-tip">' + petsTxt('ui.eggSummaryHint', 'Cosmetic — no combat boost. 1 daily egg + bonus egg after your first adventure win today.') + '</div>';
      }
    }
    const list = document.getElementById('eggList');
    if (!list) return;
    list.innerHTML = '';
    if (typeof EGG_ROSTER === 'undefined') return;
    if (!this.petsSelId) {
      const first = EGG_ROSTER.find((e) => (typeof isEggOwned === 'function') && isEggOwned(e.id)) || EGG_ROSTER[0];
      if (first) this.petsSelId = first.id;
    }
    for (const def of EGG_ROSTER) {
      list.appendChild(this.paintEggPetCard(def));
    }
  };

  UI.paintEggPetCard = function paintEggPetCard(def) {
    const rar = (typeof rarityOf === 'function') ? rarityOf(def.rarity) : { color: '#8fa3d9' };
    const owned = (typeof isEggOwned === 'function') ? isEggOwned(def.id) : false;
    const active = save.activeEggPet === def.id;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'card pets-card'
      + (owned ? '' : ' locked')
      + (active ? ' sel' : '')
      + (this.petsSelId === def.id ? ' pets-card-sel' : '');
    el.setAttribute('data-egg-id', def.id);
    el.setAttribute('role', 'listitem');
    if (owned) el.style.borderColor = rar.color;
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    cv.setAttribute('aria-hidden', 'true');
    const cc = cv.getContext('2d');
    cc.translate(32, 36);
    if (typeof drawEggPetArt === 'function') drawEggPetArt(cc, def, 18, 1.1, 0, 0, !owned);
    const name = (typeof eggLabel === 'function') ? eggLabel(def, 'name') : def.name;
    const perk = (typeof eggLabel === 'function') ? eggLabel(def, 'perk') : def.perk;
    const info = document.createElement('div');
    info.className = 'pets-card-body';
    const badge = active
      ? ' <span class="rar-pill pets-pill-on" style="color:#ffd75e;border-color:#ffd75e">' + petsEscape(petsTxt('ui.petActive', 'active').toUpperCase()) + '</span>'
      : '';
    info.innerHTML =
      '<div class="cname">' + petsEscape(name) + ' ' + petsRarityPill(def.rarity) + badge + '</div>'
      + '<div class="cinfo pets-status">' + petsEscape(owned
        ? perk
        : petsTxt('ui.eggUnhatched', '???')) + '</div>';
    const right = document.createElement('div');
    right.className = 'right';
    if (owned) {
      right.innerHTML = active
        ? ('✓ ' + petsEscape(petsTxt('ui.petActive', 'active')))
        : petsEscape(petsTxt('ui.petEquip', 'equip'));
    } else {
      right.textContent = '???';
      right.style.opacity = '0.7';
    }
    el.appendChild(cv);
    el.appendChild(info);
    el.appendChild(right);
    const id = def.id;
    if (owned && typeof bindPress === 'function') {
      bindPress(el, () => {
        try { AudioSys.sfx('select'); } catch (_) {}
        UI.petsShowDetail('egg', id);
      });
    } else if (typeof bindPress === 'function') {
      bindPress(el, () => {
        try { AudioSys.sfx('select'); } catch (_) {}
        UI.petsShowDetail('egg', id);
      });
    }
    return el;
  };

  UI.paintPetsDetail = function paintPetsDetail() {
    const detail = document.getElementById('petDetail');
    if (!detail) return;
    const tab = this.petTab || 'dex';
    if (tab === 'egg') this.paintEggDetail(detail);
    else this.paintDexDetail(detail);
  };

  UI.paintDexDetail = function paintDexDetail(detail) {
    const def = (typeof petDef === 'function') ? petDef(this.petsSelId) : null;
    const rosterDef = def || (typeof PET_ROSTER !== 'undefined' && PET_ROSTER[0]) || null;
    if (!rosterDef) {
      detail.innerHTML = '';
      return;
    }
    const sp = SPECIES[rosterDef.speciesId];
    const st = (typeof petStatusOf === 'function') ? petStatusOf(rosterDef) : {};
    const rar = (sp && typeof rarityOf === 'function') ? rarityOf(sp.rarity) : { color: '#8fa3d9' };
    const perk = (typeof petPerkLine === 'function') ? petPerkLine(rosterDef) : (rosterDef.perk || '');
    const live = st.tamed && (typeof petLiveBonusLine === 'function') ? petLiveBonusLine(rosterDef) : '';
    const upLine = st.tamed && typeof petUpgradeSummary === 'function' ? petUpgradeSummary(rosterDef.id) : '';
    const cd = rosterDef.cd || 5;
    let cta = '';
    if (st.tamed && st.active) {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta pets-cta-unequip" data-pets-act="unequip">'
        + petsEscape(petsTxt('pets.unequipCta', 'Unequip')) + '</button>';
    } else if (st.tamed) {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta pets-cta-equip" data-pets-act="equip">'
        + petsEscape(petsTxt('pets.equipCta', 'Equip')) + '</button>';
    } else if (st.canClaim) {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta pets-cta-claim" data-pets-act="claim">'
        + petsEscape(petsTxt('pets.claimCta', 'Tame now')) + '</button>';
    } else if (st.canBuy) {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta pets-cta-buy" data-pets-act="buy">'
        + petsEscape(petsTxt('pets.buyCta', 'Buy · {cost} PC', { cost: st.cost })) + '</button>';
    } else {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta" data-pets-act="hint" disabled>'
        + petsEscape(petsTxt('pets.needMore', '{cur}/{need} kills · {cost} PC', {
          cur: Math.min(st.kills || 0, st.need || 0), need: st.need || 0, cost: st.cost || 0,
        })) + '</button>';
    }
    detail.innerHTML =
      '<button type="button" class="pets-overview-btn" data-pets-act="list">' + petsEscape(petsTxt('pets.backList', '← Overview')) + '</button>'
      + '<div class="pets-detail-art"><canvas id="petsDetailCanvas" width="96" height="96" aria-hidden="true"></canvas></div>'
      + '<div class="pets-detail-name">' + petsEscape(sp ? sp.name : rosterDef.id)
      + ' ' + petsRarityPill(sp ? sp.rarity : 'common') + '</div>'
      + '<div class="pets-effect">'
      + '<div class="pets-effect-kicker">' + petsEscape(petsTxt('pets.doesTitle', 'What does this do?')) + '</div>'
      + '<p class="pets-effect-blurb">' + petsEscape(perk) + '</p>'
      + (live ? '<p class="pets-effect-now">' + petsEscape(live) + '</p>' : '')
      + '<p class="pets-effect-assist">' + petsEscape(petsTxt('pets.assistLine', 'Assist · cooldown {cd}s', { cd: cd })) + '</p>'
      + (upLine && upLine !== '—' ? '<p class="pets-effect-up">' + petsEscape(upLine) + '</p>' : '')
      + '</div>'
      + '<div class="pets-stock-lbl">' + petsEscape(st.tamed
        ? petsTxt('ui.petTamedAssist', 'Tamed · assist in adventure')
        : petsTxt('pets.killBar', '{cur}/{need} kills', { cur: Math.min(st.kills || 0, st.need || 1), need: st.need || 1 }))
      + '</div>'
      + '<div class="pets-bar pets-bar-lg" aria-hidden="true"><span style="width:' + (st.tamed ? 100 : (st.pct || 0)) + '%;background:' + petsEscape(rar.color || '#ffd75e') + '"></span></div>'
      + '<div class="pets-cta-stack">' + cta + '</div>';
    const cv = document.getElementById('petsDetailCanvas');
    if (cv && sp && typeof drawMonsterArt === 'function') {
      const cc = cv.getContext('2d');
      cc.translate(48, 58);
      cc.scale(0.85, 0.85);
      if (st.tamed) drawMonsterArt(cc, sp, sp.size, 1.2, false, false);
      else {
        cc.globalAlpha = 0.72;
        drawMonsterArt(cc, sp, sp.size, 1.2, false, false);
      }
    }
    this.bindPetsDetailActs(detail, 'dex', rosterDef.id);
  };

  UI.paintEggDetail = function paintEggDetail(detail) {
    const def = (typeof eggDef === 'function') ? eggDef(this.petsSelId) : null;
    const rosterDef = def || (typeof EGG_ROSTER !== 'undefined' && EGG_ROSTER[0]) || null;
    if (!rosterDef) {
      detail.innerHTML = '';
      return;
    }
    const owned = (typeof isEggOwned === 'function') ? isEggOwned(rosterDef.id) : false;
    const active = save.activeEggPet === rosterDef.id;
    const name = (typeof eggLabel === 'function') ? eggLabel(rosterDef, 'name') : rosterDef.name;
    const perk = (typeof eggLabel === 'function') ? eggLabel(rosterDef, 'perk') : rosterDef.perk;
    const rar = (typeof rarityOf === 'function') ? rarityOf(rosterDef.rarity) : { color: '#8fa3d9' };
    let cta = '';
    if (owned && active) {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta pets-cta-unequip" data-pets-act="unequip">'
        + petsEscape(petsTxt('pets.unequipCta', 'Unequip')) + '</button>';
    } else if (owned) {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta pets-cta-equip" data-pets-act="equip">'
        + petsEscape(petsTxt('pets.equipCta', 'Equip')) + '</button>';
    } else {
      cta = '<button type="button" class="btn mode-btn big-touch pets-cta" disabled>'
        + petsEscape(petsTxt('pets.eggLockedCta', 'Hatch from daily egg')) + '</button>';
    }
    detail.innerHTML =
      '<button type="button" class="pets-overview-btn" data-pets-act="list">' + petsEscape(petsTxt('pets.backList', '← Overview')) + '</button>'
      + '<div class="pets-detail-art"><canvas id="petsDetailCanvas" width="96" height="96" aria-hidden="true"></canvas></div>'
      + '<div class="pets-detail-name">' + petsEscape(owned ? name : '???') + ' ' + petsRarityPill(rosterDef.rarity) + '</div>'
      + '<div class="pets-effect">'
      + '<div class="pets-effect-kicker">' + petsEscape(petsTxt('pets.doesTitle', 'What does this do?')) + '</div>'
      + '<p class="pets-effect-blurb">' + petsEscape(owned ? perk : petsTxt('ui.eggUnhatched', 'Not hatched yet')) + '</p>'
      + '<p class="pets-effect-now">' + petsEscape(petsTxt('pets.eggCosmeticHero', 'Look only — no combat boost')) + '</p>'
      + '</div>'
      + '<div class="pets-cta-stack">' + cta + '</div>';
    const cv = document.getElementById('petsDetailCanvas');
    if (cv && typeof drawEggPetArt === 'function') {
      const cc = cv.getContext('2d');
      cc.translate(48, 50);
      drawEggPetArt(cc, rosterDef, 26, 1.2, 0, 0, !owned);
    }
    void rar;
    this.bindPetsDetailActs(detail, 'egg', rosterDef.id);
  };

  UI.bindPetsDetailActs = function bindPetsDetailActs(detail, kind, id) {
    detail.querySelectorAll('[data-pets-act]').forEach((btn) => {
      const act = btn.getAttribute('data-pets-act');
      if (typeof bindPress !== 'function') return;
      bindPress(btn, () => {
        if (act === 'list') {
          UI.petsShowList();
          return;
        }
        const run = () => {
          if (kind === 'egg') {
            if (act === 'equip') {
              if (typeof equipEggPet === 'function') equipEggPet(id);
              const def = eggDef(id);
              UI.toast(petsTxt('toast.eggFloat', '{name} floats with you', {
                name: def ? ((typeof eggLabel === 'function') ? eggLabel(def, 'name') : def.name) : id,
              }), 2200);
            } else if (act === 'unequip') {
              if (typeof equipEggPet === 'function') equipEggPet(null);
              UI.toast(petsTxt('toast.eggNone', 'No egg companion'), 1400);
            }
          } else if (act === 'equip') {
            if (typeof equipPet === 'function') equipPet(id);
            const def = petDef(id);
            UI.toast(petsTxt('toast.petFollow', '{name} follows you', { name: petsSpeciesName(def) }), 2200);
          } else if (act === 'unequip') {
            if (typeof equipPet === 'function') equipPet(null);
            UI.toast(petsTxt('toast.petNone', 'No pet following'), 1400);
          } else if (act === 'buy') {
            const res = (typeof buyPetWithCoins === 'function') ? buyPetWithCoins(id) : null;
            if (!res) {
              UI.toast(petsTxt('toast.petNoCoins', 'Not enough pet coins'), 1800);
              return;
            }
            try { AudioSys.sfx('summon'); } catch (_) {}
            UI.toast(petsTxt('toast.petBought', 'Bought {name}', { name: petsSpeciesName(res.def) }), 2600);
          } else if (act === 'claim') {
            const res = (typeof claimPetFromDex === 'function') ? claimPetFromDex(id) : null;
            if (!res) {
              UI.toast(petsTxt('toast.petNoClaim', 'Not enough kills yet'), 1800);
              return;
            }
            try { AudioSys.sfx('summon'); } catch (_) {}
            UI.toast(petsTxt('toast.petTamed', '{name} tamed — companion!', {
              name: petsSpeciesName(res.def),
              cur: res.kills,
              need: res.need,
            }), 2600);
          }
          try { AudioSys.sfx('select'); } catch (_) {}
          UI.renderPets();
          if (typeof UI.renderMenu === 'function') UI.renderMenu();
        };
        if (typeof safeUiAction === 'function') {
          safeUiAction(run, 'pets/' + act + '/' + id, petsTxt('ui.errPetPick', 'Pet action failed'));
        } else run();
      });
    });
  };
}
