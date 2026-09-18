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
 * - Phone stays a horde (scale floor 0.50), just not a pile-on.
 * - Versus / training / wall / coinrun are untouched.
 * - Wave *count* (stage length) is not shortened.
 */
const COMBAT_DENSITY_REF_W = 1100;
const COMBAT_DENSITY_REF_H = 620;
const COMBAT_DENSITY_WIDE_W = 960;
const COMBAT_DENSITY_MIN = 0.50;
const COMBAT_DENSITY_MAX = 1;
const COMBAT_DENSITY_SLOT_PX = 64;
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
 * 0.50–1.00 density factor. Width-weighted: side-spawns walk in across W.
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
  const layers = compact ? 1.65 : (tablet ? 2.4 : 3);
  const offscreen = compact ? 2 : (tablet ? 6 : 10);
  const fromSlots = Math.round(slots * layers + offscreen);
  const fromLegacy = Math.round(touchCeil * scale);
  let maxAlive;
  if (scale >= 0.98) {
    maxAlive = touchCeil;
  } else {
    maxAlive = Math.min(fromSlots, fromLegacy);
    maxAlive = combatDensityClamp(maxAlive, compact ? 8 : 14, compact ? 14 : touchCeil);
  }
  return {
    w: sz.w,
    h: sz.h,
    scale,
    compact: !!compact,
    tablet: !!tablet,
    maxAlive,
    spawnIntervalMul: compact ? 1.55 : (tablet ? 1.12 : 1),
    spawnGapPx: compact ? 64 : (tablet ? 42 : 32),
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

const COMBAT_OPEN_SEC = 30;
const COMBAT_OPEN_MIN = 0.70;
const COMBAT_OPEN_MAX = 1.12;
const COMBAT_SUSTAIN_MIN = 0.62;
const COMBAT_SUSTAIN_MAX = 1.05;
const COMBAT_TAB_OPEN_MIN = 0.66;
const COMBAT_TAB_OPEN_MAX = 1.22;
const COMBAT_TAB_SUSTAIN_MIN = 0.55;
const COMBAT_TAB_SUSTAIN_MAX = 1.15;
const COMBAT_OPEN_HOLD_COMPACT = 0.55;
const COMBAT_OPEN_HOLD_TABLET = 0.80;
const COMBAT_OPEN_HOLD_DESK = 1.2;
const COMBAT_SPAWN_EDGE_COMPACT = 18;
const COMBAT_SPAWN_EDGE_TABLET = 28;
const COMBAT_SPAWN_EDGE_DESK = 40;

/** Compact/tablet cadence band. Desktop (wide) returns null = raw. */
function combatCadenceBand(elapsedSec, profile) {
  profile = asCombatProfile(profile);
  const t = Number(elapsedSec);
  if (!Number.isFinite(t)) return null;
  if (profile.compact) {
    return t < COMBAT_OPEN_SEC
      ? { min: COMBAT_OPEN_MIN, max: COMBAT_OPEN_MAX }
      : { min: COMBAT_SUSTAIN_MIN, max: COMBAT_SUSTAIN_MAX };
  }
  if (profile.tablet) {
    return t < COMBAT_OPEN_SEC
      ? { min: COMBAT_TAB_OPEN_MIN, max: COMBAT_TAB_OPEN_MAX }
      : { min: COMBAT_TAB_SUSTAIN_MIN, max: COMBAT_TAB_SUSTAIN_MAX };
  }
  return null;
}

/**
 * Spawn interval clamp. Desktop stays raw.
 * Phone: 0.70–1.12 first 30s, 0.62–1.05 after.
 * Tablet 834 mid-band: milder 0.66–1.22 / 0.55–1.15 (batch 2, no 0.31s dump).
 */
function combatSmoothOpenInterval(raw, elapsedSec, profile) {
  const n = Number(raw);
  if (!(n > 0)) return n;
  const band = combatCadenceBand(elapsedSec, profile);
  if (!band) return n;
  return combatDensityClamp(n, band.min, band.max);
}

/**
 * Between-wave hole. Desktop unchanged.
 * Win-clear fanfare (base ≥ 2.3) stays — that is not a combat spike.
 * Result CTA layout stays with #318/#323; lose delay is combatLoseResultMs.
 */
function combatWaveGapSec(base, elapsedSec, profile) {
  const n = Number(base);
  if (!(n > 0)) return n;
  profile = asCombatProfile(profile);
  if (n >= 2.3) return n;
  if (profile.compact) return combatDensityClamp(n * 0.56, 0.82, 1.25);
  if (profile.tablet) return combatDensityClamp(n * 0.72, 1.00, 1.60);
  return n;
}

/** First-30s wave hold. Desktop / after 30s stay 1.2s. */
function combatOpenerHold(elapsedSec, profile) {
  profile = asCombatProfile(profile);
  const t = Number(elapsedSec);
  if (!(t < COMBAT_OPEN_SEC)) return COMBAT_OPEN_HOLD_DESK;
  if (profile.compact) return COMBAT_OPEN_HOLD_COMPACT;
  if (profile.tablet) return COMBAT_OPEN_HOLD_TABLET;
  return COMBAT_OPEN_HOLD_DESK;
}

function combatSpawnEdgeOff(profile) {
  profile = asCombatProfile(profile);
  if (profile.compact) return COMBAT_SPAWN_EDGE_COMPACT;
  if (profile.tablet) return COMBAT_SPAWN_EDGE_TABLET;
  return COMBAT_SPAWN_EDGE_DESK;
}

/** Compact: spawn closer to the strip so the first walker is on-screen sooner. */
function combatSpawnEdgeX(side, profile) {
  profile = asCombatProfile(profile);
  const off = combatSpawnEdgeOff(profile);
  return side > 0 ? (profile.w + off) : -off;
}

/** Cadence used by Adventure spawn loop. Desktop profile == legacy 0.38 / batch 3 / gap 32. */
function adventureSpawnCadence(queueLeft, opener, bossWave, spawnMul, profile, elapsedSec) {
  profile = asCombatProfile(profile);
  const batchWish = opener ? 1 : (queueLeft > 28 ? 3 : queueLeft > 14 ? 2 : 1);
  const batch = Math.max(1, Math.min(batchWish, profile.spawnBatchMax || 3));
  const pace = opener ? 1.55 : (queueLeft > 20 ? 0.72 : queueLeft > 10 ? 0.86 : 1);
  const base = bossWave ? 0.92 : (opener ? 0.78 : 0.38);
  let interval = base * (spawnMul || 1) * pace * (profile.spawnIntervalMul || 1);
  interval = combatSmoothOpenInterval(interval, elapsedSec, profile);
  return {
    batch: opener ? 1 : batch,
    interval,
    gapPx: profile.spawnGapPx || 32,
    edgePx: combatSpawnEdgeOff(profile),
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
 * Tightened to 34% × below 62% so the band does not steal punch/kick near-misses.
 */
function combatJoySwipeAccepts(x, y, w, h, profile) {
  profile = asCombatProfile(profile || { w: w, h: h });
  if (!profile.compact) return false;
  if (typeof Input !== 'undefined' && Input && Input.dualMode) return false;
  const W0 = w > 0 ? w : profile.w;
  const H0 = h > 0 ? h : profile.h;
  return x < W0 * 0.34 && y > H0 * 0.62;
}

/**
 * Punch/kick win the ambiguous band between the joy pad and the right cluster.
 * Desktop / dual: no extra claim (legacy hit slop only).
 */
function combatPreferStrike(x, y, buttons, joyHome, profile) {
  profile = asCombatProfile(profile);
  if (!profile.compact) return null;
  if (typeof Input !== 'undefined' && Input && Input.dualMode) return null;
  const extra = 32;
  const list = buttons || [];
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (!b || (b.id !== 'punch' && b.id !== 'kick')) continue;
    const d = Math.hypot(x - b.x, y - b.y);
    if (d <= (Number(b.r) || 24) + extra && d < bestD) {
      bestD = d;
      best = b;
    }
  }
  if (!best) return null;
  const jx = joyHome && Number.isFinite(Number(joyHome.x)) ? Number(joyHome.x) : 64;
  const jy = joyHome && Number.isFinite(Number(joyHome.y)) ? Number(joyHome.y) : profile.h - 80;
  const joyD = Math.hypot(x - jx, y - jy);
  if (bestD + 8 <= joyD) return best;
  return null;
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

/** Short landscape (844×390): little air between HUD and ground. */
function combatIsShort(profile) {
  profile = asCombatProfile(profile);
  return profile.h < 430;
}

/**
 * Flyer/dragon hover above ground. Desktop stays 110/130.
 * Short strip caps so the body stays in the aim-up band, not the HUD.
 */
function combatFlyerHover(base, profile) {
  profile = asCombatProfile(profile);
  const b = Number(base) > 0 ? Number(base) : 110;
  if (profile.h >= 500) return b;
  const ground = profile.h * 0.78;
  const air = Math.max(90, ground - (profile.h < 430 ? 56 : 70));
  const cap = Math.max(54, Math.round(air * 0.34));
  return Math.max(54, Math.min(b, cap));
}

function combatFlyerBob(base, profile) {
  const b = Number(base) > 0 ? Number(base) : 42;
  if (!combatIsShort(profile)) return b;
  return Math.max(12, Math.round(b * 0.55));
}

function combatFlyerCeilY(profile) {
  profile = asCombatProfile(profile);
  return profile.h < 430 ? 56 : 72;
}

/** Melee aim-up lift (px). Desktop 88. Short/compact get a bit more reach. */
function combatMeleeAimLift(profile) {
  profile = asCombatProfile(profile);
  if (combatIsShort(profile)) return 104;
  if (profile.compact) return 96;
  return 88;
}

/** Extra ny gain after the legacy 1.38 so a short swipe still aims up. */
function combatJoyAimGain(profile) {
  profile = asCombatProfile(profile);
  if (combatIsShort(profile)) return 1.22;
  if (profile.compact) return 1.10;
  return 1;
}

function combatJoyAimDead(profile) {
  profile = asCombatProfile(profile);
  return combatIsShort(profile) ? 5 : 7;
}

/** Checkpoint hold-right. Desktop 3.35s. Compact/phone 2.2s. */
function combatPartGateWalkSec(profile) {
  profile = asCombatProfile(profile);
  if (profile.compact) return 2.2;
  return 3.35;
}

/** How many HUD telegraph bars fit. Short landscape keeps 1 + overflow chip. */
function combatTelegraphHudSlots(profile) {
  profile = asCombatProfile(profile);
  if (profile.h < 430) return 1;
  return 2;
}

function combatPickTelegraphHuds(teles, profile) {
  profile = asCombatProfile(profile);
  const list = (teles || []).slice().sort((a, b) => (Number(a.remain) || 99) - (Number(b.remain) || 99));
  const slots = combatTelegraphHudSlots(profile);
  const shown = list.slice(0, slots);
  const extra = list.length - shown.length;
  if (extra > 0 && shown[0]) shown[0].extra = extra;
  return shown;
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

const COMBAT_LOSE_MS_COMPACT = 650;
const COMBAT_LOSE_MS_DESK = 850;
const COMBAT_LOSE_MS_REDUCED = 160;

/** Death → result CTA. Compact ~650ms, desktop ~850ms, reduced-motion 160. Win stays 1600. */
function combatLoseResultMs(profile) {
  if (typeof motionReduced === 'function' && motionReduced()) return COMBAT_LOSE_MS_REDUCED;
  profile = asCombatProfile(profile);
  return profile.compact ? COMBAT_LOSE_MS_COMPACT : COMBAT_LOSE_MS_DESK;
}

function combatFailTeleKind(src) {
  if (!src) return '';
  if (typeof src === 'string') return src;
  const kind = src.kind || src.failKind || '';
  if (kind === 'slam' || kind === 'charge' || kind === 'flyer' || kind === 'fire') return kind;
  if (kind === 'laser' || kind === 'orb' || kind === 'ink' || kind === 'shoot') return 'shoot';
  const attacker = src.attacker || src.srcMon || src;
  const sp = attacker.sp || {};
  if (sp.type === 'tank') return 'slam';
  if (sp.type === 'charge' || (sp.type === 'swim' && sp.art === 'shark')) return 'charge';
  if (sp.type === 'fly' || sp.type === 'dragon' || attacker.flying) return 'flyer';
  if (sp.type === 'shoot') return 'shoot';
  if ((attacker.dashT || 0) > 0) return 'charge';
  if ((attacker.telegraphT || 0) > 0 && sp.type === 'tank') return 'slam';
  return '';
}

function combatFailCueLabel(kind) {
  const map = {
    slam: ['result.failTeleSlam', 'SLAM'],
    charge: ['result.failTeleCharge', 'CHARGE'],
    flyer: ['result.failTeleFlyer', 'vlieger'],
    shoot: ['result.failTeleShoot', 'SCHIET'],
    fire: ['result.failTeleFire', 'VUUR'],
  };
  const pair = map[kind];
  if (!pair) return '';
  return (typeof tOr === 'function') ? tOr(pair[0], pair[1]) : pair[1];
}

/**
 * Record the fail cue for THIS hit (Adventure). Always write — a slime
 * kill must not keep a leftover "vlieger" from an earlier bat chip, and
 * must not steal another alive flyer's label.
 */
function notePlayerFailTele(game, src) {
  if (!game || game.mode !== 'adventure') return;
  game.lastFailTele = combatFailTeleKind(src) || '';
}

/** One-line tip: "SLAM → Nog één keer". Empty when no cue (caller falls back). */
function combatFailRetryTip(game, fallback) {
  const again = (typeof tOr === 'function') ? tOr('result.againRetry', 'Nog één keer') : 'Nog één keer';
  const cue = combatFailCueLabel(game && game.lastFailTele);
  if (!cue) return fallback == null ? '' : fallback;
  if (typeof tOr === 'function') return tOr('result.failTeleTip', '{cue} → {again}', { cue: cue, again: again });
  return cue + ' → ' + again;
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
