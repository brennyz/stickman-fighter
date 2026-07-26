/* ========================== VERSUS / 2 SPELERS ========================== */
/** Saga-hints: parodie-vibes, geen officiële manga/IP-namen. */
const VS_SAGAS = {
  all: { id: 'all', label: 'Alle', blurb: 'Alle 20 vechters — kies P1, dan P2.' },
  fighter: { id: 'fighter', label: 'Street', blurb: 'Ryu & Ken — classic white/red gi duel.' },
  ki: { id: 'ki', label: 'Ki', blurb: 'Ki-golven & power spikes — Goku vibes.' },
  scroll: { id: 'scroll', label: 'Scroll', blurb: 'Ninja & demon fox — headband hints.' },
  tide: { id: 'tide', label: 'Tide', blurb: 'Reach & crew — rubber stretch slagen.' },
  cape: { id: 'cape', label: 'Cape', blurb: 'Serious hero — bald one-punch blink.' },
  dawn: { id: 'dawn', label: 'Dawn', blurb: 'Holy lance & void sin aura.' },
};
function vsSagaMeta(id) { return VS_SAGAS[id] || VS_SAGAS.scroll; }

/** Saga-iconen via ASSET-STYLE files (assets/ui/saga-*.svg). */
function sagaIconSvg(id) {
  const key = (VS_SAGAS[id] ? id : 'all');
  return `<img class="saga-ico" src="assets/ui/saga-${key}.svg" alt="" width="16" height="16" decoding="async" draggable="false">`;
}
function rosterFlair(r) { return r.flair || r.tag; }

/** Featured legends — snel kiezen bovenaan character select. */
const VS_FEATURED_IDS = ['ryu', 'ken', 'goku', 'onepunchman', 'aruskankou', 'kutjankorio', 'xavi'];
const SAGA_ICON_IDS = VS_FEATURED_IDS;
const VS_ROSTER_MAX = 20;
const VS_ROSTER_MIGRATE = {
  kiball: 'goku', scrollkid: 'aruskankou', zipcape: 'onepunchman', tidecrew: 'rubber',
  dawnlance: 'lance', spikyki: 'goku', bandana: 'aruskankou', hero: 'stick',
};
function migrateVsRosterId(id) {
  if (!id || typeof id !== 'string') return 'ryu';
  return VS_ROSTER_MIGRATE[id] || id;
}
function sagaIconEntries() {
  return VS_FEATURED_IDS.map(id => vsRosterEntry(id));
}
function pickCharPoolFiltered() {
  const filter = UI.charSagaFilter || 'all';
  let pool = VS_ROSTER.filter(vsUnlocked);
  if (filter !== 'all') pool = pool.filter(r => (r.saga || 'scroll') === filter);
  return pool;
}
function pickSagaIconClash() {
  const icons = sagaIconEntries().filter(vsUnlocked);
  if (icons.length < 2) return null;
  const a = choice(icons);
  const diff = icons.filter(r => r.id !== a.id && r.saga !== a.saga);
  const b = diff.length ? choice(diff) : choice(icons.filter(r => r.id !== a.id));
  return { a, b };
}

const VS_SIG_LABELS = {
  balanced: 'Balanced all-round',
  shuriken: 'Wapen-crit focus',
  assassin: 'Kick-assassin',
  heavy: 'Zware crit-slagen',
  combo: 'Combo-kick chain',
  kenjutsu: 'Kenjutsu crit',
  hitrun: 'Hit & run kicks',
  quak: 'Quak punch',
  rinne: 'Rinne jutsu boost',
  boss: 'Baas-crit',
  storm: 'Storm kicks',
  tank: 'Tank punch + kb',
  reach: 'Reach wapen',
};

function vsSagaUnlockedCounts(sagaId) {
  const list = sagaId === 'all' ? VS_ROSTER : VS_ROSTER.filter(r => (r.saga || 'scroll') === sagaId);
  return { unlocked: list.filter(vsUnlocked).length, total: list.length };
}

function charRosterNextUnlock() {
  for (const r of VS_ROSTER) {
    if (!vsUnlocked(r)) return { name: r.name, hint: vsUnlockHint(r) };
  }
  return null;
}

/** Willekeurig duo met vergelijkbare overall-rating (fair match, geen dmg-tweak). */
function pickBalancedRandomDuo() {
  const pool = pickCharPoolFiltered();
  if (pool.length < 2) return null;
  const rated = pool.map(r => ({ r, rating: vsOverallRating(vsFighterStats(r)) }));
  const a = choice(rated);
  let best = null;
  let bestDiff = 999;
  for (const x of rated) {
    if (x.r.id === a.r.id) continue;
    const d = Math.abs(x.rating - a.rating);
    if (d < bestDiff) { bestDiff = d; best = x; }
  }
  if (!best) {
    const rest = rated.filter(x => x.r.id !== a.r.id);
    best = rest.length ? choice(rest) : null;
  }
  if (!best) return null;
  return { a: a.r, b: best.r, ratingDiff: bestDiff };
}

const VS_ROSTER = [
  { id: 'ryu', name: 'Ryu', tag: 'Street · balanced', saga: 'fighter', flair: 'White gi · hadou stance · all-round',
    styleId: 'classic', weapon: 'vuist', bodyColor: '#f0f0f8', gi: 'white',
    hpMul: 1, spdMul: 1, dmgMul: 1.02, crit: 0.09, critMul: 1.5, sig: 'balanced', unlock: () => true, featured: true },
  { id: 'ken', name: 'Ken', tag: 'Street · fire kicks', saga: 'fighter', flair: 'Red gi · blazing shoryu · combo rush',
    styleId: 'konoha', weapon: 'nunchaku', bodyColor: '#ff5555', gi: 'red',
    hpMul: 0.94, spdMul: 1.1, dmgMul: 1.06, crit: 0.11, critMul: 1.52, sig: 'combo', unlock: () => true, featured: true },
  { id: 'goku', name: 'Goku', tag: 'Ki · melee DPS', saga: 'ki', flair: 'Orange trainee · ki-ball rush · high STR',
    styleId: 'gold', bodyColor: '#ff9a42', weapon: 'donder', special: 'rasengan',
    hpMul: 1.02, spdMul: 1.08, dmgMul: 1.14, crit: 0.09, critMul: 1.55, sig: 'heavy', unlock: () => true, featured: true },
  { id: 'xavi', name: 'Xavi', tag: 'Tide · control', saga: 'tide', flair: 'Midfield maestro · spear reach · tempo passes',
    styleId: 'sand', weapon: 'speer', bodyColor: '#5a8fd4',
    hpMul: 1.04, spdMul: 1.04, dmgMul: 0.98, crit: 0.08, critMul: 1.48, sig: 'reach', unlock: () => true, featured: true },
  { id: 'aruskankou', name: 'Aruskankou', tag: 'Scroll · electric', saga: 'scroll', flair: 'Trainer spark · shuriken storm · crit chain',
    styleId: 'konoha', weapon: 'shuriken', bodyColor: '#ffe259',
    hpMul: 0.92, spdMul: 1.1, dmgMul: 1.0, crit: 0.13, critMul: 1.55, sig: 'shuriken', unlock: () => true, featured: true },
  { id: 'kutjankorio', name: 'Kutjankorio', tag: 'Scroll · fox demon', saga: 'scroll', flair: 'Red chakra fox · void claw · rinne burst',
    styleId: 'fox', weapon: 'void', special: 'rinnegan', bodyColor: '#e84848',
    hpMul: 1.06, spdMul: 1.06, dmgMul: 1.12, crit: 0.11, critMul: 1.6, sig: 'rinne', unlock: () => true, featured: true },
  { id: 'onepunchman', name: 'One Punch Man', tag: 'Cape · bald', saga: 'cape', flair: 'Bald hero · serious punch · one-hit blur',
    styleId: 'classic', weapon: 'vuist', bodyColor: '#ffe8c8', bald: true, gi: 'hero',
    hpMul: 0.82, spdMul: 1.2, dmgMul: 1.18, crit: 0.06, critMul: 2.0, sig: 'heavy', unlock: () => true, featured: true },
  { id: 'stick', name: 'Stick Ninja', tag: 'Balanced', saga: 'scroll', flair: 'Headband rookie · balanced kunai',
    styleId: 'classic', weapon: 'kunai',
    hpMul: 1, spdMul: 1, dmgMul: 1, crit: 0.08, critMul: 1.5, sig: 'balanced', unlock: () => true },
  { id: 'rabbit', name: 'RabbitRobot', tag: 'CPU rival', saga: 'cape', flair: 'Serious bot · training rival · ear lasers',
    styleId: null, weapon: 'vuist', isRobot: true, special: 'chidori',
    hpMul: 1.05, spdMul: 1.05, dmgMul: 1.08, crit: 0.06, critMul: 1.45, unlock: () => true },
  { id: 'rubber', name: 'Rubber Crew', tag: 'Tide · range', saga: 'tide', flair: 'Stretch captain · boomerang reach · range DPS',
    styleId: 'sand', weapon: 'boemerang',
    hpMul: 1.08, spdMul: 0.98, dmgMul: 1.04, crit: 0.07, critMul: 1.48, sig: 'reach', unlock: () => true },
  { id: 'shadow', name: 'Schaduw', tag: 'Chidori', saga: 'scroll', flair: 'Lightning step · chidori charge',
    styleId: 'shadow', weapon: 'zwaard', special: 'chidori',
    hpMul: 1, spdMul: 1.02, dmgMul: 1.06, crit: 0.1, critMul: 1.55, sig: 'assassin', unlock: () => true },
  { id: 'lance', name: 'Holy Lance', tag: 'Dawn · lancer', saga: 'dawn', flair: 'Sin lance · spear reach · holy thrust',
    styleId: 'samurai', weapon: 'speer', special: 'rinnegan',
    hpMul: 1.1, spdMul: 0.96, dmgMul: 1.1, crit: 0.1, critMul: 1.58, sig: 'kenjutsu', unlock: () => true },
  { id: 'barve', name: 'Barve', tag: 'Tank', saga: 'tide', flair: 'Deck brawler · wide club swings',
    styleId: 'classic', weapon: 'knuppel',
    hpMul: 1.22, spdMul: 0.86, dmgMul: 1.1, crit: 0.06, critMul: 1.48, sig: 'tank', unlock: () => true },
  { id: 'konoha', name: 'Konoha', tag: 'Snel', saga: 'scroll', flair: 'Leaf sprint · shuriken flurry',
    styleId: 'konoha', weapon: 'shuriken',
    hpMul: 0.95, spdMul: 1.08, dmgMul: 0.96, crit: 0.08, critMul: 1.48, sig: 'shuriken', unlock: () => true },
  { id: 'storm', name: 'Storm', tag: 'Bliksem', saga: 'ki', flair: 'Thunder charge · ki bolt axe',
    styleId: 'storm', weapon: 'donder', special: 'chidori',
    hpMul: 1, spdMul: 1.1, dmgMul: 1.0, crit: 0.1, critMul: 1.5, sig: 'storm', unlock: () => true },
  { id: 'guvve', name: 'Guvvedukkie', tag: 'Quak', saga: 'tide', flair: 'Quack crew · bonk stick',
    styleId: 'guvve', weapon: 'guvve',
    hpMul: 1.08, spdMul: 0.98, dmgMul: 1.14, crit: 0.05, critMul: 1.55, sig: 'quak', unlock: () => true },
  { id: 'samurai', name: 'Samurai', tag: 'Kenjutsu', saga: 'dawn', flair: 'Blade oath · crit cuts',
    styleId: 'samurai', weapon: 'zwaard',
    hpMul: 1.05, spdMul: 0.98, dmgMul: 1.08, crit: 0.09, critMul: 1.52, sig: 'kenjutsu', unlock: () => true },
  { id: 'akatsuki', name: 'Akatsuki', tag: 'Rinne', saga: 'dawn', flair: 'Crimson cloak · rinne pressure',
    styleId: 'akatsuki', weapon: 'ketting', special: 'rinnegan',
    hpMul: 1.1, spdMul: 0.96, dmgMul: 1.1, crit: 0.1, critMul: 1.55, sig: 'rinne', unlock: () => true },
  { id: 'cyber', name: 'Cyber', tag: 'Laser', saga: 'scroll', flair: 'Visor ninja · laser kunai',
    styleId: 'cyber', weapon: 'laser', special: 'chidori',
    hpMul: 0.92, spdMul: 1.06, dmgMul: 1.05, crit: 0.09, critMul: 1.52, sig: 'shuriken', unlock: () => true },
  { id: 'void', name: 'Void', tag: 'Rinnegan', saga: 'dawn', flair: 'Void sin · gravity rip',
    styleId: 'void', weapon: 'void', special: 'rinnegan',
    hpMul: 1.12, spdMul: 1.04, dmgMul: 1.14, crit: 0.12, critMul: 1.65, sig: 'rinne', unlock: () => true },
];
const vsRosterEntry = id => {
  id = migrateVsRosterId(id);
  return VS_ROSTER.find(r => r.id === id) || VS_ROSTER[0];
};
function vsUnlocked(r) { return !r.unlock || r.unlock(); }
function vsUnlockHint(r) {
  if (!r || vsUnlocked(r)) return '';
  return 'Keep playing to unlock';
}
function normalizeVsPick(id, fallback) {
  id = migrateVsRosterId(id);
  fallback = migrateVsRosterId(fallback);
  const r = vsRosterEntry(id);
  if (r.id === id && vsUnlocked(r)) return id;
  const fb = vsRosterEntry(fallback);
  return vsUnlocked(fb) ? fallback : 'ryu';
}
function trackVsRosterUse(p1, p2) {
  if (!Array.isArray(save.vsPlayedIds)) save.vsPlayedIds = [];
  for (const id of [p1, p2]) {
    if (VS_ROSTER.some(r => r.id === id) && !save.vsPlayedIds.includes(id)) {
      save.vsPlayedIds.push(id);
    }
  }
  if (save.vsPlayedIds.length > 32) save.vsPlayedIds = save.vsPlayedIds.slice(-32);
  persist();
  checkAchievements();
}

function systemPrefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}
function systemPrefersMoreContrast() {
  try { return window.matchMedia('(prefers-contrast: more)').matches; } catch (_) { return false; }
}
function motionReduced() {
  return !!save.reducedMotion || systemPrefersReducedMotion();
}
function a11yHighContrast() {
  return !!save.highContrast || systemPrefersMoreContrast() || motionReduced();
}
function syncA11yClasses() {
  document.body.classList.toggle('reduced-motion', motionReduced());
  document.body.classList.toggle('high-contrast', a11yHighContrast());
  document.body.classList.toggle('lite-fx', !!(typeof save !== 'undefined' && save && save.liteFx));
}
function a11yStatusText() {
  const bits = [];
  if (motionReduced()) {
    bits.push(save.reducedMotion ? t('settings.a11yMotionOn') : t('settings.a11yMotionOs'));
  }
  if (a11yHighContrast()) {
    bits.push(save.highContrast ? t('settings.a11yContrastOn') : t('settings.a11yContrastOs'));
  }
  return bits.length ? bits.join(' · ') : t('settings.a11yDefault');
}
function refreshA11yUi() {
  syncA11yClasses();
  try {
    const el = document.getElementById('a11yStatusLine');
    if (el) el.textContent = a11yStatusText();
    const active = document.getElementById('settingsScreen')?.classList.contains('active');
    if (active && typeof UI !== 'undefined' && UI.renderSettings) UI.renderSettings();
  } catch (_) {}
}

/** Canvas HUD-tekst met optionele stroke bij hoog contrast (geen flits). */
function fillHudText(c, text, x, y, opts) {
  opts = opts || {};
  const align = opts.align || c.textAlign || 'center';
  c.textAlign = align;
  const fill = opts.fill || '#fff';
  if (a11yHighContrast()) {
    c.lineWidth = opts.strokeW || 3.5;
    c.strokeStyle = opts.stroke || 'rgba(0,0,0,.88)';
    c.strokeText(text, x, y);
  }
  c.fillStyle = fill;
  c.fillText(text, x, y);
}

function buildVsFighter(entry, x, slot) {
  const st = entry.styleId ? styleById(entry.styleId) : null;
  const hp = Math.round(100 * entry.hpMul);
  const f = new Fighter({
    isPlayer: true,
    playerSlot: slot,
    name: entry.name,
    x, y: (typeof H === 'number' && H > 0 ? H : 520) * 0.78,
    face: slot === 1 ? 1 : -1,
    hp, maxhp: hp,
    baseDmg: Math.round(12 * entry.dmgMul),
    speed: Math.round(260 * entry.spdMul),
    weapon: weaponById(entry.weapon),
    color: entry.bodyColor || (st ? st.body : '#b8c4d8'),
    style: st,
    isRobot: !!entry.isRobot,
    vsSpecial: entry.special || 'rasengan',
    vsSaga: entry.saga || 'scroll',
    rosterId: entry.id,
    bald: !!entry.bald,
    gi: entry.gi || null,
  });
  if (entry.isRobot) f.isRobot = true;
  f.energy = 35;
  return f;
}

function applyVsArenaBounds(game) {
  const pad = Math.max(28, W * 0.04);
  const gap = Math.max(32, W * 0.035);
  game.vsMid = W * 0.5;
  game.p1MaxX = game.vsMid - gap * 0.5;
  game.p2MinX = game.vsMid + gap * 0.5;
  game.minX = pad;
  game.maxX = W - pad;
}

function fighterMoveXBounds(f, game) {
  let min = game.minX ?? 40;
  let max = game.maxX ?? W - 40;
  if (game.mode === 'wall' && f.isPlayer && game.wallX != null) {
    const cols = game.wallCols || 4;
    const bw = game.wallBrickW || 62;
    const wallFace = game.wallX + cols * bw;
    max = Math.min(max, wallFace - 12);
  }
  if (game.mode === 'versus' && f.playerSlot === 1) max = Math.min(max, game.p1MaxX ?? max);
  if (game.mode === 'versus' && f.playerSlot === 2) min = Math.max(min, game.p2MinX ?? min);
  return { min, max };
}

function clampFighterX(f, game, x) {
  const b = fighterMoveXBounds(f, game);
  return clamp(x, b.min, b.max);
}

/** Beweging — hardened: snappy keyboard-turn, analog joy, lichte hurt-control. */
const MOVE_ACCEL = 0.00068;
const MOVE_FLIP_ACCEL = 0.0048;
const MOVE_DIGITAL_ACCEL_MUL = 2.4;
const MOVE_STOP_DECAY = 0.0018;
const MOVE_AIR_MUL = 0.78;
const MOVE_ATTACK_RECOVER_MUL = 0.76;
const MOVE_HURT_MUL = 0.88;

function padDigitalMove(pad) {
  if (!pad) return 0;
  let m = 0;
  if (pad.side === 'p1') {
    if (Input.dualMode) {
      if (pad.keys['a']) m -= 1;
      if (pad.keys['d']) m += 1;
    } else {
      if (pad.keys['arrowleft'] || pad.keys['a']) m -= 1;
      if (pad.keys['arrowright'] || pad.keys['d']) m += 1;
    }
  } else {
    if (pad.keys['arrowleft']) m -= 1;
    if (pad.keys['arrowright']) m += 1;
  }
  return clamp(m, -1, 1);
}

function joyMoveAxis(pad) {
  if (!pad || !pad.joy.active) return 0;
  const jx = pad.joy.dx;
  if (Math.abs(jx) < JOY_DEAD_PX) return 0;
  const t = clamp(jx / JOY_MAX_PX, -1, 1);
  return Math.sign(t) * Math.pow(Math.abs(t), 0.78);
}

function applyFighterMove(f, mv, dt, opts) {
  opts = opts || {};
  const canAct = opts.canAct !== false;
  let targetVx = mv * f.speed;
  if (!f.onGround) targetVx *= MOVE_AIR_MUL;

  const flip = f.vx !== 0 && mv !== 0 && Math.sign(f.vx) !== Math.sign(mv);
  let accel = flip ? MOVE_FLIP_ACCEL : MOVE_ACCEL;
  if (f.isPlayer || f.playerSlot) accel *= flip ? 1.3 : 1.14;
  if (opts.digital) accel *= MOVE_DIGITAL_ACCEL_MUL;

  if (flip && f.onGround && Math.abs(f.vx) > 30) {
    f.vx *= opts.digital ? 0.1 : 0.16;
  }

  const lerpPow = opts.digital && canAct && Math.abs(mv) > 0.45 ? accel * 2.5 : accel;
  f.vx = lerp(f.vx, targetVx, 1 - Math.pow(lerpPow, dt));

  if (flip && canAct && Math.abs(mv) > 0.1 && f.onGround) {
    f.vx += mv * f.speed * (opts.digital ? 0.34 : 0.24);
  }
  if (canAct && Math.abs(mv) < 0.035 && f.onGround) {
    f.vx = lerp(f.vx, 0, 1 - Math.pow(MOVE_STOP_DECAY, dt));
  }
  if (Math.abs(mv) > 0.05) f.face = mv > 0 ? 1 : -1;
}

function vsSpawnX(slot) {
  const pad = Math.max(40, W * 0.08);
  const usable = Math.max(80, W - pad * 2);
  return slot === 1 ? pad + usable * 0.2 : W - pad - usable * 0.2;
}

function resetVsFighterRound(f, entry, ground, slot) {
  const hp = Math.round(100 * entry.hpMul);
  f.hp = f.maxhp = hp;
  f.baseDmg = Math.round(12 * entry.dmgMul);
  f.x = vsSpawnX(slot);
  f.y = ground;
  f.vx = 0;
  f.vy = 0;
  f.onGround = true;
  f.face = slot === 1 ? 1 : -1;
  f.state = 'idle';
  f.animT = 0;
  f.attack = null;
  f.hurtT = 0;
  f.deadT = 0;
  f.blocking = false;
  f.blockT = 0;
  f.energy = 40;
  f.substCd = 0;
  f.invulnT = 0.55;
  // alive is een getter (hp > 0) — hp is hierboven al gereset
  f.hitFlashT = 0;
  f.afterimages = [];
  f.dashCd = 0;
  resetWeaponCombo(f);
}

let vsSelect = { p1: 'ryu', p2: 'ken' };

/** d3 c5 — korte TOT-preview voor HUD/pauze (geen dmg-tweak). */
function vsMatchupTotShort(p1Id, p2Id) {
  const s1 = vsFighterStats(vsRosterEntry(p1Id));
  const s2 = vsFighterStats(vsRosterEntry(p2Id));
  const r1 = vsOverallRating(s1);
  const r2 = vsOverallRating(s2);
  const diff = Math.abs(r1 - r2);
  return { r1, r2, diff, even: diff <= 4, leadP1: r1 > r2 };
}

/** d3 c5 — wissel P1/P2 kant mid-match; score volgt de pad-kant. */
function swapVsSides(game) {
  if (!game || game.mode !== 'versus' || !game.p2) return false;
  const holdP1 = game.p1Pick;
  game.p1Pick = game.p2Pick;
  game.p2Pick = holdP1;
  vsSelect.p1 = game.p1Pick;
  vsSelect.p2 = game.p2Pick;
  const rp1 = game.roundsP1;
  game.roundsP1 = game.roundsP2;
  game.roundsP2 = rp1;
  if (Array.isArray(game.vsRoundLog)) {
    game.vsRoundLog = game.vsRoundLog.map(w => (w === 'p1' ? 'p2' : 'p1'));
  }
  applyVsArenaBounds(game);
  game.player = buildVsFighter(vsRosterEntry(game.p1Pick), vsSpawnX(1), 1);
  game.p2 = buildVsFighter(vsRosterEntry(game.p2Pick), vsSpawnX(2), 2);
  game.startVsRound();
  return true;
}

