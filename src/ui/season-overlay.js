/* Season overlay — resolve pack token onto body[data-season].
   Slots + art: docs/season-overlay-slots.md · styles/season-overlays.css
   No FOMO, no gear, no Versus. Combat hides via CSS (body.is-playing). */

const SEASON_PACKS = { jungle: 1, halloween: 1 };

function calendarSeasonOverlay(now) {
  const d = now || new Date();
  const m = d.getMonth();
  const day = d.getDate();
  if (m === 9 || (m === 10 && day <= 2)) return 'halloween';
  return '';
}

function resolveSeasonOverlay() {
  try {
    const q = new URLSearchParams(location.search).get('season');
    if (q === 'none' || q === 'off' || q === '0') return '';
    if (q && SEASON_PACKS[q]) return q;
  } catch (_) {}
  try {
    const stored = localStorage.getItem('sfSeason');
    if (stored === 'none' || stored === '') return '';
    if (stored && SEASON_PACKS[stored]) return stored;
  } catch (_) {}
  return calendarSeasonOverlay();
}

function applySeasonOverlay() {
  const season = resolveSeasonOverlay();
  const body = typeof document !== 'undefined' ? document.body : null;
  if (!body) return season;
  if (season) body.setAttribute('data-season', season);
  else body.removeAttribute('data-season');
  body.classList.toggle('has-season-overlay', !!season);
  const host = document.getElementById('seasonOverlay');
  if (host) host.setAttribute('data-season-pack', season || '');
  return season;
}

try { applySeasonOverlay(); } catch (_) {}
try {
  window.__sfSeason = {
    resolve: resolveSeasonOverlay,
    apply: applySeasonOverlay,
    packs: Object.keys(SEASON_PACKS),
  };
} catch (_) {}
