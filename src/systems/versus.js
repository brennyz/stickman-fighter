/* ========================== VERSUS (retired) ========================== */
/**
 * Local 2P versus is retired for store launch (felt unfinished; local-only).
 * Online multiplayer can return later without this local roster.
 * Keep stubs so older saves / dead call sites do not crash.
 */
const VERSUS_RETIRED = true;
const VS_SAGAS = {
  all: { id: 'all', label: '—', blurb: '' },
};
function vsSagaMeta(id) { return VS_SAGAS[id] || VS_SAGAS.all; }
function sagaIconSvg() { return ''; }
function rosterFlair(r) { return (r && (r.flair || r.tag)) || ''; }

const VS_FEATURED_IDS = [];
const SAGA_ICON_IDS = VS_FEATURED_IDS;
const VS_ROSTER_MAX = 0;
const VS_ROSTER_MIGRATE = {};
function migrateVsRosterId(id) { return id || null; }
function sagaIconEntries() { return []; }
function pickCharPoolFiltered() { return []; }
function pickSagaIconClash() { return null; }

const VS_SIG_LABELS = {};

function vsSagaUnlockedCounts() { return { unlocked: 0, total: 0 }; }
function charRosterNextUnlock() { return null; }
function pickBalancedRandomDuo() { return null; }

/** Empty roster — no trademark character ids ship in the bundle. */
const VS_ROSTER = [];

function vsRosterEntry() { return null; }
function vsUnlocked() { return false; }
function vsUnlockHint() { return ''; }
function normalizeVsPick() { return null; }
function markVsPlayed() {}

function applyVsArenaBounds() {}
function resetVsFighterRound() {}

let vsSelect = { p1: null, p2: null };

function vsMatchupTotShort() { return ''; }
function swapVsSides() {}

function toastVersusRetired() {
  try {
    UI.toast(t('toast.versusRetired') || '2-speler lokaal is uit — later online multiplayer', 3200);
  } catch (_) {
    try { UI.toast('2-speler lokaal is uit — later online multiplayer', 3200); } catch (__) {}
  }
}
