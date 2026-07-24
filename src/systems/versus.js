/* ========================== VERSUS / 2 SPELERS ========================== */
/** Saga-hints: parodie-vibes, geen officiële manga/IP-namen. */
const VS_SAGAS = {
  all: { id: 'all', label: 'Alle', emoji: '⭐', blurb: 'Hele roster — kies P1, dan P2.' },
  ki: { id: 'ki', label: 'Ki-saga', emoji: '🔥', blurb: 'Ki-golven & power spikes — classic shōnen-energy (eigen sticks).' },
  scroll: { id: 'scroll', label: 'Scroll-saga', emoji: '📜', blurb: 'Ninja-steps & jutsu — headband-hints, geen echte IP.' },
  tide: { id: 'tide', label: 'Tide-saga', emoji: '🌊', blurb: 'Rekkende reach & crew-slagen — zee-legends parodie.' },
  cape: { id: 'cape', label: 'Cape-saga', emoji: '🦸', blurb: 'Serious streak & blink-rushes — one-serious-hit humor.' },
  dawn: { id: 'dawn', label: 'Dawn-saga', emoji: '☀️', blurb: 'Holy tilt & zware aura — sin-at-dawn vibes.' },
};
function vsSagaMeta(id) { return VS_SAGAS[id] || VS_SAGAS.scroll; }

/** Saga-iconen als inline SVG (art-upgrade 4/4) — vervangt emoji-chips. */
const SAGA_ICON_SVG = {
  all: '<path d="M12 3l2 6h6l-5 4 2 6-5-3.6L7 19l2-6-5-4h6z" fill="currentColor" stroke="none"/>',
  ki: '<path d="M12 3c3 3.5 5.5 6 5.5 10a5.5 5.5 0 01-11 0c0-2 .8-3.6 2-5.4.4 1.4 1 2.2 2 2.9C10.2 8 10.8 5.5 12 3z" fill="currentColor" stroke="none"/>',
  scroll: '<path d="M7 4h11v14H7z"/><path d="M7 4a2 2 0 00-2 2v12a2 2 0 002 2h11"/><path d="M10 8h5M10 12h5"/>',
  tide: '<path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',
  cape: '<path d="M12 3l7 4-2 13-5 2-5-2L5 7z"/><path d="M12 3v19"/>',
  dawn: '<circle cx="12" cy="14" r="4.5"/><path d="M12 5.5V3M5.5 8L4 6.5M18.5 8L20 6.5M3 14h2M19 14h2"/>',
};
function sagaIconSvg(id) {
  const body = SAGA_ICON_SVG[id] || SAGA_ICON_SVG.all;
  return '<svg viewBox="0 0 24 24" style="width:1.05em;height:1.05em;vertical-align:-0.16em" ' +
    'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
}
function rosterFlair(r) { return r.flair || r.tag; }

/** Deel 2 — vijf saga-icon sticks (parodie per saga) */
const SAGA_ICON_IDS = ['kiball', 'scrollkid', 'tidecrew', 'zipcape', 'dawnlance'];
function sagaIconEntries() {
  return SAGA_ICON_IDS.map(id => vsRosterEntry(id));
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
  { id: 'hero', name: 'Stick Ninja', tag: 'Balanced', saga: 'scroll', flair: 'Headband rookie · balanced kunai',
    styleId: 'classic', weapon: 'kunai',
    hpMul: 1, spdMul: 1, dmgMul: 1, crit: 0.08, critMul: 1.5, sig: 'balanced', unlock: () => true },
  { id: 'konoha', name: 'Konoha', tag: 'Snel', saga: 'scroll', flair: 'Leaf sprint · shuriken flurry',
    styleId: 'konoha', weapon: 'shuriken',
    hpMul: 0.95, spdMul: 1.08, dmgMul: 0.95, crit: 0.07, critMul: 1.48, sig: 'shuriken',
    unlock: () => styleUnlocked(STYLES.find(s => s.id === 'konoha')) },
  { id: 'shadow', name: 'Schaduw', tag: 'Chidori', saga: 'scroll', flair: 'Lightning step · chidori charge',
    styleId: 'shadow', weapon: 'zwaard',
    hpMul: 1, spdMul: 1, dmgMul: 1.05, special: 'chidori', crit: 0.1, critMul: 1.55, sig: 'assassin',
    unlock: () => save.lvl >= 15 },
  { id: 'gold', name: 'Legende', tag: 'Zwaar', saga: 'ki', flair: 'Golden aura · hammer ki-break',
    styleId: 'gold', weapon: 'hamer',
    hpMul: 1.15, spdMul: 0.92, dmgMul: 1.12, crit: 0.05, critMul: 2.0, sig: 'heavy', unlock: () => save.lvl >= 25 },
  { id: 'chakra', name: 'Chakra', tag: 'Rinnegan', saga: 'scroll', flair: 'Glow pupil · rinne ripples',
    styleId: 'chakra', weapon: 'laser',
    hpMul: 0.9, spdMul: 1, dmgMul: 0.92, special: 'rinnegan', crit: 0.09, critMul: 1.52, sig: 'rinne',
    unlock: () => save.trainWins >= 3 },
  { id: 'guvve', name: 'Guvvedukkie', tag: 'Quak', saga: 'tide', flair: 'Quack crew · bonk stick',
    styleId: 'guvve', weapon: 'guvve',
    hpMul: 1.08, spdMul: 0.98, dmgMul: 1.15, crit: 0.05, critMul: 1.55, sig: 'quak', unlock: () => dexCount() >= 8 },
  { id: 'rabbit', name: 'RabbitRobot', tag: 'CPU-killer', saga: 'cape', flair: 'Serious bot · training rival',
    styleId: null, weapon: 'vuist',
    hpMul: 1.05, spdMul: 1.05, dmgMul: 1.08, isRobot: true, special: 'chidori', crit: 0.06, critMul: 1.45,
    unlock: () => save.trainWins >= 1 },
  { id: 'akatsuki', name: 'Akatsuki', tag: 'Rinne', saga: 'dawn', flair: 'Crimson cloak · rinne pressure',
    styleId: 'akatsuki', weapon: 'ketting',
    hpMul: 1.1, spdMul: 0.96, dmgMul: 1.1, special: 'rinnegan', crit: 0.1, critMul: 1.55, sig: 'rinne',
    unlock: () => save.lvl >= 12 },
  { id: 'brawler', name: 'Barve', tag: 'Tank', saga: 'tide', flair: 'Deck brawler · wide swings',
    styleId: 'classic', weapon: 'knuppel',
    hpMul: 1.2, spdMul: 0.88, dmgMul: 1.08, crit: 0.06, critMul: 1.48, sig: 'tank', unlock: () => true },
  { id: 'sand', name: 'Woestijn', tag: 'Bereik', saga: 'tide', flair: 'Desert reach · spear tide',
    styleId: 'sand', weapon: 'speer',
    hpMul: 1, spdMul: 1.02, dmgMul: 1, crit: 0.08, critMul: 1.5, sig: 'reach', unlock: () => save.lvl >= 8 },
  { id: 'speedster', name: 'Speedster', tag: 'Combo', saga: 'cape', flair: 'Blink combo · serious speed',
    styleId: 'konoha', weapon: 'nunchaku',
    hpMul: 0.9, spdMul: 1.12, dmgMul: 0.95, crit: 0.08, critMul: 1.45, sig: 'combo', unlock: () => save.lvl >= 13 },
  { id: 'samurai', name: 'Samurai', tag: 'Kenjutsu', saga: 'dawn', flair: 'Blade oath · crit cuts',
    styleId: 'samurai', weapon: 'zwaard',
    hpMul: 1.05, spdMul: 0.98, dmgMul: 1.08, crit: 0.08, critMul: 1.5, sig: 'kenjutsu', unlock: () => save.lvl >= 20 },
  { id: 'golem', name: 'Rotsbonk', tag: 'Muur', saga: 'ki', flair: 'Stone tank · ki-proof hide',
    styleId: null, bodyColor: '#9a917f', weapon: 'hamer',
    hpMul: 1.32, spdMul: 0.78, dmgMul: 1.06, crit: 0.04, critMul: 1.65, sig: 'tank', unlock: () => save.lvl >= 22 },
  { id: 'cyber', name: 'Cyber', tag: 'Laser', saga: 'scroll', flair: 'Visor ninja · laser kunai',
    styleId: 'cyber', weapon: 'laser',
    hpMul: 0.92, spdMul: 1.06, dmgMul: 1.05, special: 'chidori', crit: 0.09, critMul: 1.52, sig: 'shuriken',
    unlock: () => save.lvl >= 18 },
  { id: 'storm', name: 'Storm', tag: 'Bliksem', saga: 'ki', flair: 'Thunder charge · ki bolt',
    styleId: 'storm', weapon: 'donder',
    hpMul: 1, spdMul: 1.1, dmgMul: 0.98, special: 'chidori', crit: 0.1, critMul: 1.5, sig: 'storm',
    unlock: () => save.trainWins >= 5 },
  { id: 'fox', name: 'Vlamvos', tag: 'Hit & run', saga: 'tide', flair: 'Fox run · boomerang tide',
    styleId: 'fox', weapon: 'boemerang',
    hpMul: 0.88, spdMul: 1.14, dmgMul: 0.9, crit: 0.06, critMul: 1.5, sig: 'hitrun', unlock: () => dexCount() >= 12 },
  { id: 'void', name: 'Void', tag: 'Rinnegan', saga: 'dawn', flair: 'Void sin · gravity rip',
    styleId: 'void', weapon: 'void',
    hpMul: 1.12, spdMul: 1.04, dmgMul: 1.15, special: 'rinnegan', crit: 0.12, critMul: 1.65, sig: 'rinne',
    unlock: () => save.lvl >= 40 },
  { id: 'dragon', name: 'Kristallo', tag: 'Baas', saga: 'ki', flair: 'Crystal ki · boss spike',
    styleId: 'gold', weapon: 'donder',
    hpMul: 1.08, spdMul: 0.94, dmgMul: 1.18, crit: 0.11, critMul: 1.75, sig: 'boss', unlock: () => save.unlocked >= 45 },
  { id: 'kiball', name: 'Ki-Ball Stick', tag: 'Ki icon', saga: 'ki', flair: 'Orange trainee · ki-ball spam',
    styleId: 'gold', bodyColor: '#ff9a42', weapon: 'donder', special: 'rasengan',
    hpMul: 1.02, spdMul: 1.04, dmgMul: 1.06, crit: 0.1, critMul: 1.52, sig: 'storm', unlock: () => save.lvl >= 6 },
  { id: 'scrollkid', name: 'Scroll Kid', tag: 'Ninja icon', saga: 'scroll', flair: 'Scroll dash · clone feint',
    styleId: 'konoha', weapon: 'kunai', special: 'rasengan',
    hpMul: 0.92, spdMul: 1.1, dmgMul: 0.96, crit: 0.12, critMul: 1.48, sig: 'assassin', unlock: () => true },
  { id: 'tidecrew', name: 'Tide Crew', tag: 'Crew icon', saga: 'tide', flair: 'Crew hat energy · stretch hits',
    styleId: 'sand', weapon: 'boemerang',
    hpMul: 1.06, spdMul: 1.02, dmgMul: 1.04, crit: 0.08, critMul: 1.5, sig: 'reach', unlock: () => save.lvl >= 10 },
  { id: 'zipcape', name: 'Zip Cape', tag: 'Hero icon', saga: 'cape', flair: 'Serious zip · one-blink rush',
    styleId: 'classic', bodyColor: '#ffe259', weapon: 'nunchaku', special: 'chidori',
    hpMul: 0.82, spdMul: 1.18, dmgMul: 0.92, crit: 0.14, critMul: 1.62, sig: 'combo', unlock: () => save.trainWins >= 2 },
  { id: 'dawnlance', name: 'Dawn Lance', tag: 'Sin icon', saga: 'dawn', flair: 'Holy lance · dawn rinne',
    styleId: 'samurai', weapon: 'speer', special: 'rinnegan',
    hpMul: 1.08, spdMul: 1.02, dmgMul: 1.1, crit: 0.11, critMul: 1.58, sig: 'rinne', unlock: () => save.lvl >= 30 },
];
const vsRosterEntry = id => VS_ROSTER.find(r => r.id === id) || VS_ROSTER[0];
function vsUnlocked(r) { return !r.unlock || r.unlock(); }
function vsUnlockHint(r) {
  if (!r || vsUnlocked(r)) return '';
  const hints = {
    konoha: 'Unlock Konoha-stijl',
    shadow: 'Reach Lv 15',
    gold: 'Reach Lv 25',
    chakra: 'Win 3× training',
    guvve: '8 monsters in boek',
    rabbit: 'Win 1× training',
    akatsuki: 'Reach Lv 12',
    sand: 'Reach Lv 8',
    speedster: 'Reach Lv 13',
    samurai: 'Reach Lv 20',
    golem: 'Reach Lv 22',
    cyber: 'Reach Lv 18',
    storm: 'Win 5× training',
    fox: '12 monsters in boek',
    void: 'Reach Lv 40',
    dragon: 'Unlock level 45+',
    kiball: 'Reach Lv 6',
    tidecrew: 'Reach Lv 10',
    zipcape: 'Win 2× training',
    dawnlance: 'Reach Lv 30',
  };
  return hints[r.id] || 'Keep playing to unlock';
}
function normalizeVsPick(id, fallback) {
  const r = vsRosterEntry(id);
  if (r.id === id && vsUnlocked(r)) return id;
  const fb = vsRosterEntry(fallback);
  return vsUnlocked(fb) ? fallback : 'hero';
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
    rosterId: entry.id,
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
    if (pad.keys['arrowleft'] || pad.keys['a']) m -= 1;
    if (pad.keys['arrowright'] || pad.keys['d']) m += 1;
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

let vsSelect = { p1: 'hero', p2: 'rabbit' };

