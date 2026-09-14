/* ============================== SEASONS =============================== */
/** CSS + flavor overlay only. Never steals taps. Pixel-art partner fills slots later. */

const SEASON_IDS = ['classic', 'jungle', 'halloween', 'winter', 'summer'];
const SEASON_DEFAULT = 'classic';
/** Slots the pixel-art partner may drop as PNG (optional; CSS fallbacks always paint). */
const SEASON_ART_SLOTS = [
  'corner-tl', 'corner-tr', 'corner-bl', 'corner-br',
  'banner', 'vignette', 'ground-trim', 'motif',
];
const SEASON_THEME_COLORS = {
  classic: '#151b33',
  jungle: '#14261a',
  halloween: '#1a1024',
  winter: '#121828',
  summer: '#221a10',
};
/** Empty until partner ships files — never prefetch 404 PNGs on Android. */
const SEASON_ART_PRESENT = {};
let _seasonIgnoreQuery = false;
let _seasonPageshowBound = false;

function normalizeSeasonId(id) {
  return SEASON_IDS.includes(id) ? id : SEASON_DEFAULT;
}

function seasonIdFromQuery() {
  if (_seasonIgnoreQuery) return null;
  try {
    const q = new URLSearchParams(location.search).get('season');
    if (q && SEASON_IDS.includes(q)) return q;
  } catch (_) {}
  return null;
}

function getSeasonId() {
  const q = seasonIdFromQuery();
  if (q) return q;
  return normalizeSeasonId(typeof save !== 'undefined' && save && save.season);
}

function persistedSeasonId() {
  return normalizeSeasonId(typeof save !== 'undefined' && save && save.season);
}

function seasonLabel(id) {
  const sid = normalizeSeasonId(id);
  if (typeof t === 'function') {
    const v = t('season.' + sid + '.name');
    if (v && v !== 'season.' + sid + '.name') return v;
  }
  return sid;
}

function seasonFlavorText(id) {
  const sid = normalizeSeasonId(id || getSeasonId());
  if (typeof t === 'function') {
    const v = t('season.' + sid + '.flavor');
    if (v && v !== 'season.' + sid + '.flavor') return v;
  }
  return '';
}

function seasonStoryText(id) {
  const sid = normalizeSeasonId(id || getSeasonId());
  if (typeof t === 'function') {
    const v = t('season.' + sid + '.story');
    if (v && v !== 'season.' + sid + '.story') return v;
  }
  return '';
}

function seasonArtUrl(seasonId, slot) {
  const sid = normalizeSeasonId(seasonId);
  if (!SEASON_ART_SLOTS.includes(slot)) return '';
  if (!SEASON_ART_PRESENT[sid] || !SEASON_ART_PRESENT[sid][slot]) return '';
  return 'assets/seasons/' + sid + '/' + slot + '.png';
}

function hardenSeasonPointerEvents(el) {
  if (!el) return;
  try {
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('role', 'presentation');
    el.style.pointerEvents = 'none';
    el.style.touchAction = 'none';
    const nodes = el.querySelectorAll('*');
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].style.pointerEvents = 'none';
      nodes[i].setAttribute('aria-hidden', 'true');
    }
  } catch (_) {}
}

function ensureSeasonOverlay() {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById('seasonOverlay');
  if (el) {
    hardenSeasonPointerEvents(el);
    return el;
  }
  try {
    el = document.createElement('div');
    el.id = 'seasonOverlay';
    el.className = 'season-overlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="season-vignette"></div>' +
      '<div class="season-wash"></div>' +
      '<div class="season-css-layer">' +
        '<span class="season-motif season-motif-a"></span>' +
        '<span class="season-motif season-motif-b"></span>' +
        '<span class="season-motif season-motif-c"></span>' +
        '<span class="season-motif season-motif-d"></span>' +
        '<span class="season-float season-float-1"></span>' +
        '<span class="season-float season-float-2"></span>' +
        '<span class="season-float season-float-3"></span>' +
      '</div>' +
      '<div class="season-art-slot season-art-tl" data-season-slot="corner-tl"></div>' +
      '<div class="season-art-slot season-art-tr" data-season-slot="corner-tr"></div>' +
      '<div class="season-art-slot season-art-bl" data-season-slot="corner-bl"></div>' +
      '<div class="season-art-slot season-art-br" data-season-slot="corner-br"></div>' +
      '<div class="season-art-slot season-art-banner" data-season-slot="banner"></div>' +
      '<div class="season-art-slot season-art-ground" data-season-slot="ground-trim"></div>' +
      '<div class="season-art-slot season-art-motif" data-season-slot="motif"></div>';
    const pause = document.getElementById('pauseBtn');
    if (pause && pause.parentNode) pause.parentNode.insertBefore(el, pause.nextSibling);
    else if (document.body) document.body.insertBefore(el, document.body.firstChild);
    hardenSeasonPointerEvents(el);
  } catch (_) {
    return null;
  }
  return el;
}

function applySeasonTheme() {
  const id = getSeasonId();
  ensureSeasonOverlay();
  try {
    document.documentElement.setAttribute('data-season', id);
    if (document.body) document.body.setAttribute('data-season', id);
  } catch (_) {}
  try {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', SEASON_THEME_COLORS[id] || SEASON_THEME_COLORS.classic);
  } catch (_) {}
  try {
    const root = document.documentElement;
    if (root && root.style) {
      root.style.setProperty('--season-id', id);
      SEASON_ART_SLOTS.forEach((slot) => {
        const url = seasonArtUrl(id, slot);
        if (url) root.style.setProperty('--season-art-' + slot, 'url("' + url + '")');
        else root.style.removeProperty('--season-art-' + slot);
      });
    }
  } catch (_) {}
  try {
    document.querySelectorAll('[data-season-flavor]').forEach((el) => {
      const line = seasonFlavorText(id);
      el.textContent = line;
      el.hidden = !line || id === 'classic';
    });
    document.querySelectorAll('[data-season-story]').forEach((el) => {
      const line = seasonStoryText(id);
      el.textContent = line;
      if (el.hasAttribute('data-season-story-always')) el.hidden = !line;
      else el.hidden = !line || id === 'classic';
    });
  } catch (_) {}
  try {
    if (typeof AudioSys !== 'undefined' && AudioSys) AudioSys.seasonId = id;
  } catch (_) {}
  try {
    if (window.__sf) window.__sf.season = id;
  } catch (_) {}
  try {
    document.dispatchEvent(new CustomEvent('sf-season', { detail: { id } }));
  } catch (_) {}
  if (!_seasonPageshowBound && typeof window !== 'undefined') {
    _seasonPageshowBound = true;
    try {
      window.addEventListener('pageshow', () => {
        try { applySeasonTheme(); } catch (_) {}
      });
    } catch (_) {}
  }
}

function setSeason(id) {
  const next = normalizeSeasonId(id);
  if (typeof save === 'undefined' || !save) return false;
  _seasonIgnoreQuery = true;
  save.season = next;
  let ok = true;
  if (typeof persist === 'function') {
    try { ok = persist() !== false; } catch (_) { ok = false; }
  }
  applySeasonTheme();
  return ok;
}

function renderSeasonSwitch() {
  const bar = document.getElementById('seasonSwitchBar');
  if (!bar) return;
  const cur = getSeasonId();
  bar.innerHTML = SEASON_IDS.map((code) =>
    `<button type="button" class="dex-filter-btn season-chip${cur === code ? ' active' : ''}" data-season="${code}">${seasonLabel(code)}</button>`
  ).join('');
  bar.querySelectorAll('[data-season]').forEach((btn) => {
    const code = btn.getAttribute('data-season');
    if (!code) return;
    const pick = () => {
      if (code === persistedSeasonId() && !seasonIdFromQuery()) return;
      const run = () => {
        setSeason(code);
        if (typeof AudioSys !== 'undefined') AudioSys.sfx('select');
        if (typeof UI !== 'undefined' && UI.toast && typeof t === 'function') {
          UI.toast(t('settings.seasonChanged', { name: seasonLabel(code) }), 1800, { tone: 'ok' });
        }
        if (typeof UI !== 'undefined' && UI.renderSettings) UI.renderSettings();
      };
      if (typeof safeUiAction === 'function') {
        safeUiAction(run, 'setSeason/' + code, (typeof t === 'function' && t('ui.langSwitchFail')) || 'Season switch failed');
      } else run();
    };
    if (typeof bindPress === 'function') bindPress(btn, pick);
    else btn.addEventListener('click', pick);
  });
  const hint = document.getElementById('settingsSeasonHint');
  if (hint && typeof t === 'function') hint.textContent = t('settings.seasonHint');
  const story = document.getElementById('settingsSeasonStory');
  if (story) {
    story.textContent = seasonStoryText(cur);
    story.hidden = !story.textContent;
  }
}
