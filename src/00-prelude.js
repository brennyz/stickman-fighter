'use strict';
/* =========================================================================
   STICKMAN FIGHTER
   Stickman-vechtgame voor iPad (touch) en desktop (toetsenbord).
   Modi: Avontuur, Training, Versus 2P, Muur, Mats (coinrun).
   Audio (sfx + bgm) is procedureel via Web Audio — rechtenvrij.
   d20 c4 d5: horde FX scaling, pause perf strip helpers.
   Mid-phone fxLite: particle pool + spawn hitch guard. Fighters always draw.
   ========================================================================= */

const TAU = Math.PI * 2;
const BANNER_LANES = 3;
const FX_CAP = { particles: 140, floaters: 28, projectiles: 48, banners: BANNER_LANES, afterimages: 12 };
const FX_POOL_PREWARM = 48;
const FX_POOL_MAX = 160;
const _fxParticlePool = [];
const Perf = {
  tier: 0,
  emaMs: 16.7,
  frames: 0,
  tick(frameMs) {
    this.frames++;
    if (typeof document !== 'undefined' && document.hidden) return;
    this.emaMs = this.emaMs * 0.9 + frameMs * 0.1;
    if (save.liteFx) {
      if (this.tier !== 1) {
        this.tier = 1;
        // Don't wipe scenery / force resize — pops houses & flashes screens
      }
      return;
    }
    const sampleEvery = IS_TOUCH ? 24 : 40;
    if (this.frames % sampleEvery !== 0) return;
    const heavyMs = IS_TOUCH ? 22 : 24;
    if (this.emaMs > heavyMs) this.tier = Math.min(2, this.tier + 1);
    else if (this.emaMs < 17.5 && this.tier > 0) this.tier -= 1;
    // Tier only throttles FX density — no clearCache/scheduleResize (eye-strain flashes)
    if (this.tier >= 2 && this.frames > 120 && !save.liteFx && !window.__sfLiteHint) {
      window.__sfLiteHint = 1;
      try { UI.toast(typeof t === 'function' ? t('toast.liteFxHint') : 'Traag? Instellingen → Lite FX', 4200, { tone: 'warn' }); } catch (_) {}
    }
  },
  reset() { this.tier = 0; this.emaMs = 16.7; this.frames = 0; },
  skipHeavyDraw() {
    // Never skip the whole fight frame — that left a blank/half canvas after resize
    // and made adventure backgrounds "fall away". Throttle particles inside draw instead.
    return false;
  },
  /** True when FX should be light (particles/weather) — does not skip background. */
  lightFxFrame() {
    if (typeof state === 'undefined' || state !== 'play') return false;
    if (this.tier >= 2 && (this.frames & 1) === 0) return true;
    const horde = perfHordeLoad();
    return horde.alive >= 34 && this.tier >= 1 && (this.frames & 1) === 0;
  },
  /** Hoofdmenu-landing zichtbaar — enige menu-scherm met canvas-animatie. */
  menuLandingVisible() {
    if (typeof state === 'undefined' || state !== 'menu') return false;
    try {
      const ms = document.getElementById('menuScreen');
      return !!(ms && ms.classList.contains('active'));
    } catch (_) {
      return false;
    }
  },
  /** Canvas mag getekend worden (gevecht of menu-backdrop). Pauze = canvas hidden → geen draw. */
  canvasDrawActive() {
    if (typeof state !== 'undefined' && state === 'play') return true;
    return this.menuLandingVisible();
  },
  /** Statische submenu's — verlaag rAF-work (~2 Hz i.p.v. 60 Hz). */
  loopIdleMode() {
    if (typeof state === 'undefined' || state === 'play') return false;
    return !this.menuLandingVisible();
  },
  /** Tab verborgen buiten play — langzamer rAF (~2 Hz) i.p.v. lege 60 Hz. */
  hiddenLoopMs() {
    if (typeof state !== 'undefined' && state === 'play') return 0;
    if (save.liteFx || this.tier >= 2) return 520;
    if (this.tier >= 1) return 420;
    return 360;
  },
};
function perfHordeLoad() {
  if (typeof game === 'undefined' || !game || game.mode !== 'adventure' || !game.monsters) {
    return { alive: 0, mul: 1 };
  }
  const alive = game.monsters.filter((m) => m.alive).length;
  let mul = 1;
  if (alive >= 40) mul = 0.5;
  else if (alive >= 28) mul = 0.65;
  else if (alive >= 18) mul = 0.78;
  else if (alive >= 10) mul = 0.9;
  return { alive, mul };
}
/** Mid-phone / compact viewport — tighter FX before Perf.tier has time to climb. */
function fxTouchDevice() {
  if (typeof window !== 'undefined' && window.__sfForceTouchFx) return true;
  if (typeof IS_TOUCH !== 'undefined' && IS_TOUCH) return true;
  if (typeof W === 'number' && W > 0 && W < 720) return true;
  return false;
}

/**
 * Spawn-hitch guard: liteFx, reduced-motion, Perf.tier, or first ~1.5s on mid phones.
 * Caps bursts / freeze only — never hides fighters.
 */
function fxSpawnLite() {
  if (typeof save !== 'undefined' && save && save.liteFx) return true;
  if (typeof motionReduced === 'function' && motionReduced()) return true;
  if (typeof Perf !== 'undefined' && Perf.tier >= 1) return true;
  if (fxTouchDevice() && typeof Perf !== 'undefined' && Perf.frames < 90) return true;
  return false;
}

function allocFxParticle() {
  const p = _fxParticlePool.pop();
  if (p) {
    p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
    p.life = 0; p.maxLife = 0; p.color = '#fff';
    p.size = 2; p.kind = 'square'; p.grav = 900;
    return p;
  }
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#fff', size: 2, kind: 'square', grav: 900 };
}

function releaseFxParticle(p) {
  if (!p || _fxParticlePool.length >= FX_POOL_MAX) return;
  _fxParticlePool.push(p);
}

function prewarmFxPool(n) {
  const want = n == null ? FX_POOL_PREWARM : n;
  const need = Math.max(0, want - _fxParticlePool.length);
  for (let i = 0; i < need; i++) {
    _fxParticlePool.push({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0,
      color: '#fff', size: 2, kind: 'square', grav: 900,
    });
  }
  return _fxParticlePool.length;
}

function fxPoolSize() {
  return _fxParticlePool.length;
}

function fxCaps() {
  let mul = 1;
  if (save.liteFx) mul = 0.42;
  else if (Perf.tier >= 2) mul = 0.42;
  else if (Perf.tier >= 1) mul = 0.62;
  else if (fxTouchDevice()) mul = 0.72;
  if (motionReduced()) mul *= 0.62;
  mul *= perfHordeLoad().mul;
  const floor = (fxTouchDevice() || save.liteFx)
    ? { particles: 16, floaters: 6, projectiles: 12, banners: 2, afterimages: 3 }
    : { particles: 24, floaters: 8, projectiles: 16, banners: 2, afterimages: 4 };
  const out = {};
  for (const k of Object.keys(FX_CAP)) {
    out[k] = Math.max(floor[k] || 2, Math.floor(FX_CAP[k] * mul));
  }
  return out;
}
/** Meet FX-ruimte vóór spawn — tier/lite per-frame budget. */
function perfFxRoom(g, type) {
  if (!g) return 0;
  const cap = fxCaps();
  const max = type === 'particle' ? cap.particles
    : type === 'floater' ? cap.floaters
      : type === 'banner' ? cap.banners
        : type === 'projectile' ? cap.projectiles : 0;
  const arr = type === 'particle' ? g.particles
    : type === 'floater' ? g.floaters
      : type === 'banner' ? g.banners
        : type === 'projectile' ? g.projectiles : null;
  if (!arr || !max) return 0;
  return Math.max(0, max - arr.length);
}
function perfFxBudgetAllow(g, cost) {
  cost = cost || 1;
  if (!g) return true;
  // Mid phones / first-second spawn must not get an unlimited FX dump.
  if (!save.liteFx && Perf.tier < 1 && perfHordeLoad().mul >= 0.95
    && !fxSpawnLite() && !fxTouchDevice()) return true;
  let maxPerFrame = save.liteFx ? 4 : (Perf.tier >= 2 ? 8 : (fxTouchDevice() ? 10 : 14));
  if (fxSpawnLite()) maxPerFrame = Math.min(maxPerFrame, 6);
  const horde = perfHordeLoad();
  if (horde.mul < 1) maxPerFrame = Math.max(3, Math.floor(maxPerFrame * horde.mul));
  if (g._fxBudgetFrame !== Perf.frames) {
    g._fxBudgetFrame = Perf.frames;
    g._fxBudgetUsed = 0;
  }
  if (g._fxBudgetUsed + cost > maxPerFrame) return false;
  g._fxBudgetUsed += cost;
  return true;
}
function perfFxSummary() {
  const caps = fxCaps();
  const fps = Perf.emaMs > 0 ? Math.round(1000 / Perf.emaMs) : 0;
  const dpr = typeof DPR !== 'undefined' ? DPR : 1;
  const horde = perfHordeLoad();
  return { fps, tier: Perf.tier, dpr, maxDpr: maxCanvasDpr(), caps, hordeAlive: horde.alive, hordeMul: horde.mul };
}
function formatPerfStripLine(p) {
  p = p || perfFxSummary();
  const tierNote = save.liteFx ? 'Lite FX' : `tier ${p.tier}`;
  const hordeNote = p.hordeAlive >= 10 ? ` · horde ${p.hordeAlive}` : '';
  return `~${p.fps} fps · ${tierNote} · DPR ${p.dpr.toFixed(2)}/${p.maxDpr}${hordeNote} · FX ${p.caps.particles}/${p.caps.floaters}`;
}

function pickBannerLane(banners) {
  const occupied = new Set();
  for (const b of banners) {
    if (typeof b.lane === 'number' && b.lane >= 0 && b.lane < BANNER_LANES) occupied.add(b.lane);
  }
  for (let i = 0; i < BANNER_LANES; i++) if (!occupied.has(i)) return i;
  let pick = 0;
  let best = -1;
  for (const b of banners) {
    const p = b.t / b.dur;
    if (p > best) { best = p; pick = b.lane; }
  }
  return pick;
}

function bannerLaneY(H, lane, size) {
  const baseY = H * 0.31;
  const step = Math.max(32, Math.min(48, H * 0.052));
  const mid = (BANNER_LANES - 1) * 0.5;
  const laneN = typeof lane === 'number' ? lane : 1;
  return baseY + (laneN - mid) * step;
}
function maxCanvasDpr() {
  const rm = motionReduced();
  if (save.liteFx || rm) return 1.25;
  if (typeof state !== 'undefined' && state !== 'play') return IS_TOUCH ? 1.15 : 1.25;
  if (Perf.tier >= 2) return 1;
  if (Perf.tier >= 1) return 1.35;
  return 2;
}
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const volPct = (v, d) => Math.round((Number(v ?? d)) * 100);
const choice = arr => arr[Math.floor(Math.random() * arr.length)];
const IS_TOUCH = (typeof window !== 'undefined' && ('ontouchstart' in window)) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

/**
 * Fight UI scheme — device-first (touch vs PC), save can override.
 * - showTouchPads true  → always draw pads (also on desktop)
 * - showTouchPads false → never draw pads (keyboard/legend only)
 * - auto (default)      → IS_TOUCH
 * Screen width alone is NOT used (touch laptops are wide).
 */
function useTouchFightPads() {
  if (typeof save !== 'undefined' && save) {
    if (save.showTouchPads === true) return true;
    if (save.showTouchPads === false) return false;
  }
  return !!IS_TOUCH;
}

/** Persistent keyboard legend during fights when not using touch pads (PC default). */
function useKbFightLegend() {
  if (typeof save !== 'undefined' && save && save.kbLegend === false) return false;
  return !useTouchFightPads();
}

/** Combat floaters: spreid over lagen zodat BAM/KETS/schade niet op elkaar stapelen. */
const FLOATER_LANE_H = 30;
const FLOATER_LANE_W = 40;
const FLOATER_CLUSTER_R = 112;
const FLOATER_MAX_LANES = 10;
const FLOATER_MERGE_R = 58;
const FLOATER_MERGE_LIFE = 0.68;

function floaterLayerBase(layer) {
  switch (layer) {
    case 'style': return { x: 0, y: -48, laneH: 24 };
    case 'fx': return { x: 0, y: -70, laneH: 28 };
    case 'hud': return { x: 0, y: 0, laneH: 32, clusterR: 176 };
    default: return { x: 0, y: 0 };
  }
}

/** Alleen pure −N chips (geen CRIT/XP/tekst) — display-merge, geen damage-formule. */
function parseDmgFloaterTxt(txt) {
  const s = String(txt == null ? '' : txt).trim();
  if (!s) return null;
  const minus = s.charAt(0);
  if (minus !== '-' && minus !== '−') return null;
  let n = 0;
  for (let i = 1; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) return null;
    n = n * 10 + (c - 48);
  }
  return n > 0 ? n : null;
}

function tryMergeDmgFloater(game, x, y, txt, color, size, layer) {
  layer = layer || 'dmg';
  const add = parseDmgFloaterTxt(txt);
  if (!add || !game || !game.floaters || !game.floaters.length) return false;
  const r2 = FLOATER_MERGE_R * FLOATER_MERGE_R;
  let best = null;
  let bestD = r2 + 1;
  for (const fl of game.floaters) {
    if ((fl.layer || 'dmg') !== layer) continue;
    if (!(fl.life > FLOATER_MERGE_LIFE)) continue;
    if (color && fl.color && fl.color !== color) continue;
    const other = parseDmgFloaterTxt(fl.txt);
    if (!other) continue;
    const dx = fl.x - x;
    const dy = fl.y - y;
    const d = dx * dx + dy * dy;
    if (d > r2) continue;
    if (d < bestD) { best = fl; bestD = d; }
  }
  if (!best) return false;
  const cur = parseDmgFloaterTxt(best.txt) || 0;
  best.txt = '-' + (cur + add);
  best.life = Math.min(1.12, best.life + 0.2);
  const nextSize = Math.max(best.size || 15, size || 15);
  best.size = Math.min(nextSize + 1, 20);
  return true;
}

function floaterTextHalfW(txt, size) {
  const len = String(txt || '').length;
  const fs = size || 15;
  return Math.max(18, fs * Math.min(len, 9) * 0.38);
}

function layoutFloaterPos(game, x, y, txt, size, layer) {
  layer = layer || 'dmg';
  const base = floaterLayerBase(layer);
  const laneH = base.laneH || FLOATER_LANE_H;
  const clusterR = base.clusterR || FLOATER_CLUSTER_R;
  x += base.x;
  y += base.y;
  const halfW = floaterTextHalfW(txt, size);
  const ww = (typeof W === 'number' && W > 0) ? W : 800;
  const minX = halfW + 10;
  const maxX = Math.max(minX, ww - halfW - 10);
  const list = game && game.floaters ? game.floaters : [];
  const sameLayer = (fl) => (fl.layer || 'dmg') === layer;

  for (let lane = 0; lane < FLOATER_MAX_LANES; lane++) {
    const sign = lane <= 0 ? 0 : (lane % 2 === 1 ? -1 : 1);
    const spread = lane <= 0 ? 0 : Math.ceil(lane / 2) * FLOATER_LANE_W * sign;
    const ty = y - lane * laneH;
    const tx = clamp(x + spread, minX, maxX);
    let hit = false;
    for (const fl of list) {
      if (fl.life <= 0.2 || !sameLayer(fl)) continue;
      const dx = fl.x - tx;
      const dy = fl.y - ty;
      if (dx * dx + dy * dy > clusterR * clusterR) continue;
      const flHalf = floaterTextHalfW(fl.txt, fl.size);
      if (Math.abs(dx) < halfW + flHalf + 10 && Math.abs(dy) < laneH * 0.95) {
        hit = true;
        break;
      }
    }
    if (!hit) return { x: tx, y: ty, lane, layer };
  }
  const lane = list.filter(sameLayer).length % FLOATER_MAX_LANES;
  return {
    x: clamp(x + Math.sin(lane * 0.9) * FLOATER_LANE_W * 1.4, minX, maxX),
    y: y - lane * laneH,
    lane,
    layer,
  };
}

