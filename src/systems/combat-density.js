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
