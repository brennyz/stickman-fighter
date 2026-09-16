/* Season overlay — resolve pack token onto body[data-season].
   Slot contract matches CSS pair #279: docs/SEASON-ASSET-SLOTS.md
   Art files: assets/seasons/<id>/<slot>.png
   Combat hides pixel slots via CSS (body.is-playing). No gear, no FOMO.

   IIFE so mega-merge with src/systems/seasons.js does not redeclare
   const SEASON_ART_SLOTS (that module owns calendar/pref theme). */
(function (root) {
  'use strict';

  const SEASON_PACKS = { jungle: 1, halloween: 1, winter: 1, summer: 1 };
  const SEASON_ART_SLOTS = [
    'corner-tl', 'corner-tr', 'corner-bl', 'corner-br',
    'banner', 'vignette', 'ground-trim', 'motif',
  ];
  const SEASON_ART_PRESENT = {
    jungle: { 'corner-tl': 1, 'corner-tr': 1, 'corner-bl': 1, 'corner-br': 1, banner: 1, vignette: 1, 'ground-trim': 1, motif: 1 },
    halloween: { 'corner-tl': 1, 'corner-tr': 1, 'corner-bl': 1, 'corner-br': 1, banner: 1, vignette: 1, 'ground-trim': 1, motif: 1 },
    /* winter/summer: CSS fallbacks only until partner PNGs land */
  };

  function calendarSeasonOverlay(now) {
    try {
      if (typeof calendarSeasonId === 'function') {
        const id = calendarSeasonId(now);
        return (id && id !== 'classic' && SEASON_PACKS[id]) ? id : '';
      }
    } catch (_) {}
    const d = now || new Date();
    const m = d.getMonth();
    const day = d.getDate();
    if (m === 9 || (m === 10 && day <= 2)) return 'halloween';
    return '';
  }

  function resolveSeasonOverlay() {
    try {
      const q = new URLSearchParams(location.search).get('season');
      if (q === 'none' || q === 'off' || q === '0' || q === 'classic') return '';
      if (q && SEASON_PACKS[q]) return q;
    } catch (_) {}
    try {
      if (typeof currentSeasonId === 'function') {
        const id = currentSeasonId();
        if (id && id !== 'classic' && SEASON_PACKS[id]) return id;
        if (id === 'classic') return '';
      }
    } catch (_) {}
    try {
      const stored = localStorage.getItem('sfSeason');
      if (stored === 'none' || stored === '' || stored === 'classic') return '';
      if (stored && SEASON_PACKS[stored]) return stored;
    } catch (_) {}
    return calendarSeasonOverlay();
  }

  function seasonArtUrl(sid, slot) {
    if (!SEASON_ART_SLOTS.includes(slot)) return '';
    if (!SEASON_ART_PRESENT[sid] || !SEASON_ART_PRESENT[sid][slot]) return '';
    return 'assets/seasons/' + sid + '/' + slot + '.png';
  }

  function applySeasonOverlay() {
    const season = resolveSeasonOverlay();
    const body = typeof document !== 'undefined' ? document.body : null;
    const rootEl = typeof document !== 'undefined' ? document.documentElement : null;
    const owned = typeof applySeasonTheme === 'function';
    if (!owned) {
      if (body) {
        if (season) body.setAttribute('data-season', season);
        else body.removeAttribute('data-season');
      }
      if (rootEl) {
        if (season) rootEl.setAttribute('data-season', season);
        else rootEl.removeAttribute('data-season');
      }
    }
    if (body) body.classList.toggle('has-season-overlay', !!season);
    if (rootEl) {
      SEASON_ART_SLOTS.forEach((slot) => {
        const url = season ? seasonArtUrl(season, slot) : '';
        if (url) rootEl.style.setProperty('--season-art-' + slot, 'url("' + url + '")');
        else rootEl.style.removeProperty('--season-art-' + slot);
      });
    }
    const host = document.getElementById('seasonOverlay');
    if (host) {
      host.setAttribute('data-season-pack', season || '');
      host.setAttribute('aria-hidden', 'true');
      host.style.pointerEvents = 'none';
    }
    return season;
  }

  try { applySeasonOverlay(); } catch (_) {}
  try {
    document.addEventListener('sf-season-change', function () {
      try { applySeasonOverlay(); } catch (_) {}
    });
  } catch (_) {}
  try {
    root.__sfSeason = {
      resolve: resolveSeasonOverlay,
      apply: applySeasonOverlay,
      packs: Object.keys(SEASON_PACKS),
      slots: SEASON_ART_SLOTS,
      present: SEASON_ART_PRESENT,
    };
    root.__sfSeasonArtPresent = SEASON_ART_PRESENT;
  } catch (_) {}
})(typeof window !== 'undefined' ? window : this);
