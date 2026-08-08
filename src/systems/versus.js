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

/** Safe stubs — versus UI is retired; dead call sites must not throw. */
function vsSpawnX(slot) {
  const pad = Math.max(40, (typeof W === 'number' && W > 0 ? W : 800) * 0.08);
  const ww = typeof W === 'number' && W > 0 ? W : 800;
  const usable = Math.max(80, ww - pad * 2);
  return slot === 1 ? pad + usable * 0.2 : ww - pad - usable * 0.2;
}
function buildVsFighter(entry, x, slot) {
  if (!entry) return null;
  const st = entry.styleId ? styleById(entry.styleId) : null;
  const hp = Math.round(100 * (entry.hpMul || 1));
  const f = new Fighter({
    isPlayer: true,
    playerSlot: slot,
    name: entry.name || 'Fighter',
    x, y: (typeof H === 'number' && H > 0 ? H : 520) * 0.78,
    face: slot === 1 ? 1 : -1,
    hp, maxhp: hp,
    baseDmg: Math.round(12 * (entry.dmgMul || 1)),
    speed: Math.round(260 * (entry.spdMul || 1)),
    weapon: weaponById(entry.weapon),
    color: entry.bodyColor || (st ? st.body : '#b8c4d8'),
    style: st,
    isRobot: !!entry.isRobot,
    vsSpecial: entry.special || 'spiral_orb',
    vsSaga: entry.saga || 'scroll',
    rosterId: entry.id,
    bald: !!entry.bald,
    gi: entry.gi || null,
  });
  if (entry.isRobot) f.isRobot = true;
  f.energy = 35;
  return f;
}

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
