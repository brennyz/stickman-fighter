/**
 * Adventure combat density — viewport / safe-playfield scale.
 *
 * Phone playfields are ~1/3 the width of desktop, but used the same horde
 * counts (`ADVENTURE_HORDE_MUL` × wave size, up to 36, 54–78 alive). That
 * piles threats on top of the player. Scale spawn *counts*, *spacing*, and
 * *simultaneous alive* by playfield size.
 *
 * Rules:
 * - Desktop / wide tablets (width ≥ 960) stay at 1.0 — do not gut PC.
 * - Phone stays a horde (scale floor 0.60), just not a pile-on.
 * - Versus / training / wall / coinrun are untouched.
 * - Wave *count* (stage length) is not shortened.
 */
const COMBAT_DENSITY_REF_W = 1100;
const COMBAT_DENSITY_REF_H = 620;
const COMBAT_DENSITY_WIDE_W = 960;
const COMBAT_DENSITY_MIN = 0.60;
const COMBAT_DENSITY_MAX = 1;
const COMBAT_DENSITY_SLOT_PX = 55;
const ADVENTURE_MAX_ALIVE_DESKTOP = 78;
const ADVENTURE_MAX_ALIVE_TOUCH = 54;

function combatDensityClamp(v, a, b) {
  if (typeof clamp === 'function') return clamp(v, a, b);
  return v < a ? a : (v > b ? b : v);
}

function combatPlayfieldSize(opts) {
  opts = opts || {};
  let w = Number(opts.w);
  let h = Number(opts.h);
  if (!(w > 0)) {
    if (typeof W === 'number' && W > 80) w = W;
    else if (typeof viewportGameSize === 'function') w = viewportGameSize().w;
    else if (typeof innerWidth === 'number' && innerWidth > 0) w = innerWidth;
    else w = COMBAT_DENSITY_REF_W;
  }
  if (!(h > 0)) {
    if (typeof H === 'number' && H > 80) h = H;
    else if (typeof viewportGameSize === 'function') h = viewportGameSize().h;
    else if (typeof innerHeight === 'number' && innerHeight > 0) h = innerHeight;
    else h = COMBAT_DENSITY_REF_H;
  }
  return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
}

/** True when the fight strip is phone-small (portrait or short landscape). */
function combatDensityIsCompact(w, h) {
  return w < 520 || h < 430 || (w < 820 && h < 500);
}

function combatDensityIsTablet(w, h) {
  return !combatDensityIsCompact(w, h) && w < COMBAT_DENSITY_WIDE_W;
}

/**
 * 0.60–1.00 density factor. Width-weighted: side-spawns walk in across W.
 * Wide screens (≥960) always return 1 so desktop math is unchanged.
 */
function combatDensityScale(wOrOpts, h) {
  const sz = (wOrOpts && typeof wOrOpts === 'object')
    ? combatPlayfieldSize(wOrOpts)
    : combatPlayfieldSize({ w: wOrOpts, h: h });
  if (sz.w >= COMBAT_DENSITY_WIDE_W) return COMBAT_DENSITY_MAX;
  const widthRatio = sz.w / COMBAT_DENSITY_REF_W;
  const areaRatio = (sz.w * Math.min(sz.h, 780)) / (COMBAT_DENSITY_REF_W * COMBAT_DENSITY_REF_H);
  const raw = widthRatio * 0.78 + Math.sqrt(Math.max(0.18, areaRatio)) * 0.22;
  return combatDensityClamp(raw, COMBAT_DENSITY_MIN, COMBAT_DENSITY_MAX);
}

function combatDensityTouchCeil() {
  return (typeof IS_TOUCH !== 'undefined' && IS_TOUCH)
    ? ADVENTURE_MAX_ALIVE_TOUCH
    : ADVENTURE_MAX_ALIVE_DESKTOP;
}

function combatDensityProfile(wOrOpts, h) {
  const sz = (wOrOpts && typeof wOrOpts === 'object')
    ? combatPlayfieldSize(wOrOpts)
    : combatPlayfieldSize({ w: wOrOpts, h: h });
  const scale = combatDensityScale(sz);
  const compact = combatDensityIsCompact(sz.w, sz.h);
  const tablet = combatDensityIsTablet(sz.w, sz.h);
  const touchCeil = combatDensityTouchCeil();
  const slots = Math.max(4, Math.floor(sz.w / COMBAT_DENSITY_SLOT_PX));
  const layers = compact ? 2 : (tablet ? 2.4 : 3);
  const offscreen = compact ? 3 : (tablet ? 6 : 10);
  const fromSlots = Math.round(slots * layers + offscreen);
  const fromLegacy = Math.round(touchCeil * scale);
  let maxAlive;
  if (scale >= 0.98) {
    maxAlive = touchCeil;
  } else {
    maxAlive = Math.min(fromSlots, fromLegacy);
    maxAlive = combatDensityClamp(maxAlive, compact ? 10 : 14, touchCeil);
  }
  return {
    w: sz.w,
    h: sz.h,
    scale,
    compact: !!compact,
    tablet: !!tablet,
    maxAlive,
    spawnIntervalMul: compact ? 1.38 : (tablet ? 1.12 : 1),
    spawnGapPx: compact ? 56 : (tablet ? 42 : 32),
    spawnBatchMax: compact ? 1 : (tablet ? 2 : 3),
  };
}

function scaleAdventurePerWave(basePerWave, profile) {
  profile = profile || combatDensityProfile();
  const n = Math.ceil(Number(basePerWave) * (profile.scale || 1));
  return Math.max(2, n);
}

function scaleAdventureHordePad(basePad, profile) {
  profile = profile || combatDensityProfile();
  return Math.max(1, Math.round(Number(basePad) * (profile.scale || 1)));
}

function adventureMaxAliveNow(profile) {
  profile = profile || combatDensityProfile();
  return profile.maxAlive || combatDensityTouchCeil();
}

/** Cadence used by Adventure spawn loop. Desktop profile == legacy 0.38 / batch 3 / gap 32. */
function adventureSpawnCadence(queueLeft, opener, bossWave, spawnMul, profile) {
  profile = profile || combatDensityProfile();
  const batchWish = opener ? 1 : (queueLeft > 28 ? 3 : queueLeft > 14 ? 2 : 1);
  const batch = Math.max(1, Math.min(batchWish, profile.spawnBatchMax || 3));
  const pace = opener ? 1.55 : (queueLeft > 20 ? 0.72 : queueLeft > 10 ? 0.86 : 1);
  const base = bossWave ? 0.92 : (opener ? 0.78 : 0.38);
  const interval = base * (spawnMul || 1) * pace * (profile.spawnIntervalMul || 1);
  return {
    batch: opener ? 1 : batch,
    interval,
    gapPx: profile.spawnGapPx || 32,
  };
}

const COMBAT_TELEGRAPH_FLOOR = 0.38;

function asCombatProfile(profileOrSize) {
  if (!profileOrSize) return combatDensityProfile();
  if (typeof profileOrSize.compact === 'boolean' && typeof profileOrSize.scale === 'number') {
    return profileOrSize;
  }
  return combatDensityProfile(profileOrSize);
}

/** Compact phones: slightly longer dodge window. Desktop winds stay 1.0. */
function combatTelegraphMul(profile) {
  profile = asCombatProfile(profile);
  if (profile.compact) return 1.28;
  if (profile.tablet) return 1.10;
  return 1;
}

/**
 * Charge/shark telegraph trigger distance. On a 390px strip the legacy 240px
 * cue starts off-screen (ring invisible). Keep the cue on the playfield.
 */
function combatChargeTeleDist(base, profile) {
  profile = asCombatProfile(profile);
  const b = Number(base);
  const raw = b > 0 ? b : 240;
  if (!profile.compact) return raw;
  return Math.min(raw, Math.max(140, Math.round(profile.w * 0.42)));
}

function combatTankTeleReach(size, profile) {
  profile = asCombatProfile(profile);
  const extra = profile.compact ? 72 : 48;
  return (Number(size) || 40) + extra;
}

/** Elite/boss title card: freeze aggression on compact so the cue is readable. */
function combatIntroHolds(profile) {
  profile = asCombatProfile(profile);
  return !!profile.compact;
}

function combatBannerSize(base, profile) {
  profile = asCombatProfile(profile);
  const b = Number(base) || 40;
  if (!profile.compact) return b;
  return Math.min(b, 40);
}

/** Extra jump slop on compact — dodge is the telegraph answer. */
function combatJumpSlopExtra(profile) {
  profile = asCombatProfile(profile);
  return profile.compact ? 10 : 0;
}

/**
 * 1P compact: left-bottom playfield is a swipe/move pad so empty space after
 * a thinner horde is not a dead zone. Dual/Versus stays out.
 */
function combatJoySwipeAccepts(x, y, w, h, profile) {
  profile = asCombatProfile(profile || { w: w, h: h });
  if (!profile.compact) return false;
  if (typeof Input !== 'undefined' && Input && Input.dualMode) return false;
  const W0 = w > 0 ? w : profile.w;
  const H0 = h > 0 ? h : profile.h;
  return x < W0 * 0.42 && y > H0 * 0.55;
}

const COMBAT_ENRAGE_WALK_BASE = 1.32;
const COMBAT_ENRAGE_WALK_COMPACT = 0.52;
const COMBAT_PICKUP_GAP_COMPACT = 40;
const COMBAT_COLOSSAL_MUL_DESKTOP = 2;
const COMBAT_COLOSSAL_MUL_PHONE = 1.38;
const COMBAT_COLOSSAL_CAP_FRAC = 0.24;
const COMBAT_COLOSSAL_CAP_MIN = 64;

/**
 * Hell stacks speedMul 1.16 × enrage 1.32 × walk 1.32 ≈ 2.02×. On 390px that
 * deletes the dodge window after the density cut. Desktop stays raw.
 * Compact keeps a real enrage bump (Hell still > Normal desktop 1.32).
 */
function combatEnrageWalkMul(enrageMul, profile) {
  const raw = COMBAT_ENRAGE_WALK_BASE * (Number(enrageMul) > 0 ? Number(enrageMul) : 1);
  profile = asCombatProfile(profile);
  if (!profile.compact) return raw;
  const extra = Math.max(0, raw - 1);
  return 1 + extra * COMBAT_ENRAGE_WALK_COMPACT;
}

/** Compact: fan floor loot so gear + shards do not pile on one x. Desktop unchanged. */
function combatSpreadPickupX(x, others, profile, bounds) {
  profile = asCombatProfile(profile);
  const raw = Number(x);
  const nx0 = Number.isFinite(raw) ? raw : Math.round(profile.w * 0.5);
  if (!profile.compact) return Math.round(nx0);
  const minX = bounds && bounds.minX != null ? Number(bounds.minX) : 48;
  const maxX = bounds && bounds.maxX != null ? Number(bounds.maxX) : Math.max(minX + 8, profile.w - 48);
  let nx = combatDensityClamp(nx0, minX, maxX);
  const list = (others || []).filter((p) => p && p.life > 0 && !p._got && Number.isFinite(Number(p.x)));
  if (!list.length) return Math.round(nx);
  const gap = COMBAT_PICKUP_GAP_COMPACT;
  function free(tx) {
    return list.every((p) => Math.abs(Number(p.x) - tx) >= gap);
  }
  if (free(nx)) return Math.round(nx);
  for (let step = 1; step <= 10; step++) {
    const left = combatDensityClamp(nx - step * gap, minX, maxX);
    if (free(left)) return Math.round(left);
    const right = combatDensityClamp(nx + step * gap, minX, maxX);
    if (free(right)) return Math.round(right);
  }
  return Math.round(nx);
}

/** Desktop stays 2.0. Phone keeps a "huge" boss without eating the 390px strip. */
function combatColossalSizeMul(profile) {
  profile = asCombatProfile(profile);
  if (profile.compact) return COMBAT_COLOSSAL_MUL_PHONE;
  return COMBAT_COLOSSAL_MUL_DESKTOP;
}

function combatBossSizeCap(profile) {
  profile = asCombatProfile(profile);
  if (!profile.compact) return Infinity;
  const strip = Math.min(profile.w, Math.max(280, profile.h * 0.55));
  return Math.max(COMBAT_COLOSSAL_CAP_MIN, Math.round(strip * COMBAT_COLOSSAL_CAP_FRAC));
}

function combatFitBossSize(rawSize, profile) {
  profile = asCombatProfile(profile);
  const s = Math.max(1, Number(rawSize) || 40);
  if (!profile.compact) return Math.round(s);
  return Math.round(Math.min(s, combatBossSizeCap(profile)));
}

/** Leftover ground (px) if a body of `size` stands at mid-strip. */
function combatColossalFairLane(size, profile) {
  profile = asCombatProfile(profile);
  const contact = (Number(size) + 16) * 0.82;
  return Math.max(0, Math.round(profile.w - 2 * contact));
}

function applyCombatTelegraphWind(baseWind, profile, flags) {
  profile = asCombatProfile(profile);
  let w = Number(baseWind) * combatTelegraphMul(profile);
  if (profile.compact) w = Math.max(w, COMBAT_TELEGRAPH_FLOOR);
  if (profile.compact && flags && flags.colossal) w = Math.max(w, 0.46);
  return w;
}

/** Resize: keep baked colossal HP, refit radius to the current playfield. */
function refreshAdventureBossScale(game) {
  if (!game || game.mode !== 'adventure' || !game.monsters) return;
  for (const m of game.monsters) {
    if (!m || !m.alive || m.satanBoss) continue;
    if (!m.colossal || !(m._fitSizeRaw > 0)) continue;
    const next = combatFitBossSize(m._fitSizeRaw);
    if (!(next > 0) || Math.abs(next - m.size) < 1) continue;
    m.size = next;
    try {
      if (!m.flying && game.ground > 0) m.y = game.ground - m.size;
    } catch (_) {}
  }
}
