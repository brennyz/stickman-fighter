/* ============================== SEASONS ================================ */
/** CSS overlay + flavor only. No combat/gear. Pixel-art PNGs are a partner slot. */

const SEASON_IDS = ['classic', 'jungle', 'halloween', 'winter', 'summer'];
const SEASON_PREF_IDS = ['auto'].concat(SEASON_IDS);
const SEASON_DEFAULT_PREF = 'auto';
const SEASON_BEAT_SLOTS = ['hub', 'level', 'result'];

/** Calendar windows (local date). First match wins. Jungle = spring growth. */
const SEASON_CALENDAR = [
  { id: 'halloween', start: [10, 15], end: [11, 5] },
  { id: 'winter', start: [12, 1], end: [1, 6] },
  { id: 'summer', start: [6, 21], end: [8, 20] },
  { id: 'jungle', start: [4, 15], end: [5, 31] },
];

const SEASON_ART_SLOTS = [
  'vignette', 'motif', 'corner-tl', 'corner-tr', 'corner-bl', 'corner-br', 'banner',
];

let lastAppliedSeasonId = '';
let seasonSwapTimer = 0;
/** After a settings chip pick, ignore ?season= so preview does not fight save.seasonPref. */
let seasonQueryIgnored = false;

function normalizeSeasonPref(v) {
  const s = String(v == null ? '' : v).toLowerCase().trim();
  if (s === 'default') return 'classic';
  if (SEASON_PREF_IDS.includes(s)) return s;
  return SEASON_DEFAULT_PREF;
}

function normalizeSeasonId(v) {
  const s = String(v == null ? '' : v).toLowerCase().trim();
  if (s === 'default') return 'classic';
  return SEASON_IDS.includes(s) ? s : 'classic';
}

function seasonMd(month, day) {
  return (month * 100) + day;
}

function dateInSeasonWindow(month, day, start, end) {
  const t = seasonMd(month, day);
  const a = seasonMd(start[0], start[1]);
  const b = seasonMd(end[0], end[1]);
  if (a <= b) return t >= a && t <= b;
  return t >= a || t <= b;
}

function calendarSeasonId(when) {
  const d = when instanceof Date ? when : new Date();
  if (Number.isNaN(d.getTime())) return 'classic';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  for (let i = 0; i < SEASON_CALENDAR.length; i++) {
    const w = SEASON_CALENDAR[i];
    if (dateInSeasonWindow(month, day, w.start, w.end)) return w.id;
  }
  return 'classic';
}

/** QA / screenshots: ?season=winter|summer|jungle|halloween|classic — not persisted. */
function querySeasonOverride() {
  if (seasonQueryIgnored) return null;
  try {
    const q = new URLSearchParams(location.search).get('season');
    if (q == null || q === '') return null;
    const s = String(q).toLowerCase().trim();
    if (s === 'none' || s === 'off' || s === '0' || s === 'default') return 'classic';
    if (SEASON_IDS.includes(s)) return s;
    return null;
  } catch (_) {
    return null;
  }
}

function dismissSeasonQueryOverride() {
  seasonQueryIgnored = true;
  try {
    const u = new URL(location.href);
    if (!u.searchParams.has('season')) return;
    u.searchParams.delete('season');
    const next = u.pathname + (u.search || '') + (u.hash || '');
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', next);
    }
  } catch (_) {}
}

function currentSeasonPref() {
  try {
    return normalizeSeasonPref(typeof save !== 'undefined' && save ? save.seasonPref : SEASON_DEFAULT_PREF);
  } catch (_) {
    return SEASON_DEFAULT_PREF;
  }
}

function currentSeasonId() {
  const q = querySeasonOverride();
  if (q) return q;
  const pref = currentSeasonPref();
  if (pref !== 'auto') return normalizeSeasonId(pref);
  return calendarSeasonId();
}

function seasonLabel(id) {
  const key = 'season.' + normalizeSeasonId(id);
  return typeof t === 'function' ? t(key) : id;
}

function seasonPrefLabel(pref) {
  const p = normalizeSeasonPref(pref);
  if (p === 'auto') return typeof t === 'function' ? t('season.auto') : 'Auto';
  return seasonLabel(p);
}

function seasonBlurb(id) {
  const key = 'season.blurb.' + normalizeSeasonId(id);
  if (typeof tOr === 'function') return tOr(key, '');
  return typeof t === 'function' ? t(key) : '';
}

function seasonBeat(slot, id) {
  const sid = normalizeSeasonId(id);
  if (sid === 'classic') return '';
  const key = 'season.beat.' + slot + '.' + sid;
  if (typeof tOr === 'function') return tOr(key, '');
  if (typeof t !== 'function') return '';
  const text = t(key);
  return text && text !== key ? text : '';
}

function seasonSnapshot() {
  const pref = currentSeasonPref();
  const calendarId = calendarSeasonId();
  const id = currentSeasonId();
  return {
    id,
    pref,
    calendarId,
    slots: SEASON_ART_SLOTS.slice(),
    ids: SEASON_IDS.slice(),
    beats: SEASON_BEAT_SLOTS.slice(),
    query: querySeasonOverride(),
  };
}

function seasonRootEl() {
  try { return document.documentElement || document.body || null; } catch (_) { return null; }
}

function markSeasonSwap(fromId, toId) {
  if (!fromId || fromId === toId) return;
  const root = seasonRootEl();
  if (!root || !root.classList) return;
  try {
    root.classList.add('season-swapping');
    if (seasonSwapTimer) clearTimeout(seasonSwapTimer);
    seasonSwapTimer = setTimeout(() => {
      try { root.classList.remove('season-swapping'); } catch (_) {}
      seasonSwapTimer = 0;
    }, 480);
  } catch (_) {}
}

function syncSeasonDomAttrs(snap) {
  const root = seasonRootEl();
  if (root && root.dataset) {
    root.dataset.season = snap.id;
    root.dataset.seasonPref = snap.pref;
    root.dataset.seasonAudio = snap.id;
  }
  try {
    if (document.body && document.body.dataset) document.body.dataset.season = snap.id;
    if (document.body && document.body.classList) {
      document.body.classList.toggle('has-season-overlay', snap.id !== 'classic');
    }
  } catch (_) {}
}

function setSeasonText(id, text, hideEmpty) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
  if (hideEmpty) {
    const empty = !text;
    el.hidden = empty;
    if (empty) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }
}

function syncSeasonFlavorUi(snap) {
  const s = snap || seasonSnapshot();
  const name = seasonLabel(s.id);
  const blurb = seasonBlurb(s.id);
  setSeasonText('setSeasonLbl', typeof t === 'function' ? t('season.title') : 'Season');
  setSeasonText('seasonHint', typeof t === 'function' ? t('season.hint') : '');
  setSeasonText('seasonBlurb', blurb);
  let autoLine = '';
  if (typeof t === 'function') {
    if (s.query) {
      autoLine = typeof t === 'function' ? t('season.queryNow', { name }) : name;
    } else {
      autoLine = s.pref === 'auto'
        ? t('season.autoSuggest', { name })
        : t('season.calendarNow', { name: seasonLabel(s.calendarId) });
    }
  }
  setSeasonText('seasonAutoHint', autoLine);
  const menu = document.getElementById('seasonMenuBlurb');
  if (menu) {
    const show = s.id !== 'classic' && blurb;
    menu.textContent = show ? blurb : '';
    menu.hidden = !show;
    if (!show) menu.setAttribute('hidden', '');
    else menu.removeAttribute('hidden');
  }
  const beats = [
    ['seasonHubBeat', 'hub'],
    ['seasonLevelBeat', 'level'],
    ['seasonResultBeat', 'result'],
  ];
  for (let i = 0; i < beats.length; i++) {
    const line = seasonBeat(beats[i][1], s.id);
    setSeasonText(beats[i][0], line, true);
  }
}

function applySeasonTheme(opts) {
  const snap = seasonSnapshot();
  markSeasonSwap(lastAppliedSeasonId, snap.id);
  lastAppliedSeasonId = snap.id;
  syncSeasonDomAttrs(snap);
  syncSeasonFlavorUi(snap);
  if (typeof renderSeasonSwitch === 'function') {
    try { renderSeasonSwitch(); } catch (_) {}
  }
  try {
    document.dispatchEvent(new CustomEvent('sf-season-change', { detail: snap }));
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && window.__sfSeason && typeof window.__sfSeason.apply === 'function') {
      window.__sfSeason.apply();
    }
  } catch (_) {}
  if (opts && opts.toast && typeof UI !== 'undefined' && UI.toast && typeof t === 'function') {
    UI.toast(t('season.picked', { name: seasonLabel(snap.id) }), 2000, { tone: 'ok' });
  }
  return snap;
}

function setSeasonPref(pref, opts) {
  const next = normalizeSeasonPref(pref);
  if (typeof save === 'undefined' || !save) return currentSeasonId();
  dismissSeasonQueryOverride();
  if (save.seasonPref === next) {
    applySeasonTheme();
    return currentSeasonId();
  }
  save.seasonPref = next;
  try { if (typeof persist === 'function') persist(); } catch (_) {}
  applySeasonTheme(opts);
  return currentSeasonId();
}

function renderSeasonSwitch() {
  const bar = document.getElementById('seasonSwitchBar');
  if (!bar) return;
  const cur = currentSeasonPref();
  const chips = ['auto'].concat(SEASON_IDS);
  bar.innerHTML = chips.map((id) => {
    const label = seasonPrefLabel(id);
    const active = cur === id ? ' active' : '';
    return `<button type="button" class="dex-filter-btn season-chip${active}" data-season-pref="${id}">${label}</button>`;
  }).join('');
  bar.querySelectorAll('[data-season-pref]').forEach((btn) => {
    const id = btn.getAttribute('data-season-pref');
    if (!id || btn.dataset.seasonBound) return;
    btn.dataset.seasonBound = '1';
    const pick = () => {
      if (id === currentSeasonPref()) return;
      const run = () => {
        setSeasonPref(id, { toast: true });
        try { if (typeof AudioSys !== 'undefined' && AudioSys.sfx) AudioSys.sfx('select'); } catch (_) {}
        try { if (typeof UI !== 'undefined' && UI.renderSettings) UI.renderSettings(); } catch (_) {}
      };
      if (typeof safeUiAction === 'function') safeUiAction(run, 'setSeason/' + id);
      else run();
    };
    if (typeof bindPress === 'function') bindPress(btn, pick);
    else btn.addEventListener('click', pick);
  });
}

function initSeasonTheme() {
  try {
    if (typeof save !== 'undefined' && save) save.seasonPref = normalizeSeasonPref(save.seasonPref);
  } catch (_) {}
  applySeasonTheme();
}
