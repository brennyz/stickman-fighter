'use strict';
/* =========================================================================
   STICKMAN FIGHTER — Monster Arena
   Stickman-vechtgame voor iPad (touch) en desktop (toetsenbord).
   Modi: Avontuur, Training, Versus 2P, Muur, Mats (coinrun).
   Audio (sfx + bgm) is procedureel via Web Audio — rechtenvrij.
   d20 c4 d5: horde FX scaling, pause perf strip helpers.
   ========================================================================= */

const TAU = Math.PI * 2;
const BANNER_LANES = 3;
const FX_CAP = { particles: 140, floaters: 28, projectiles: 48, banners: BANNER_LANES, afterimages: 12 };
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
        try { SceneryArt.clearCache(); } catch (_) {}
        scheduleResize();
      }
      return;
    }
    const sampleEvery = IS_TOUCH ? 24 : 40;
    if (this.frames % sampleEvery !== 0) return;
    const prev = this.tier;
    const heavyMs = IS_TOUCH ? 22 : 24;
    if (this.emaMs > heavyMs) this.tier = Math.min(2, this.tier + 1);
    else if (this.emaMs < 17.5 && this.tier > 0) this.tier -= 1;
    if (prev !== this.tier) {
      try { SceneryArt.clearCache(); } catch (_) {}
      scheduleResize();
    }
    if (this.tier >= 2 && this.frames > 120 && !save.liteFx && !window.__sfLiteHint) {
      window.__sfLiteHint = 1;
      try { UI.toast('Traag op iPad? Instellingen → Lite FX', 4200); } catch (_) {}
    }
  },
  reset() { this.tier = 0; this.emaMs = 16.7; this.frames = 0; },
  skipHeavyDraw() {
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
function fxCaps() {
  let mul = 1;
  if (save.liteFx) mul = 0.55;
  else if (Perf.tier >= 2) mul = 0.42;
  else if (Perf.tier >= 1) mul = 0.68;
  if (motionReduced()) mul *= 0.62;
  mul *= perfHordeLoad().mul;
  const floor = { particles: 24, floaters: 8, projectiles: 16, banners: 2, afterimages: 4 };
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
  if (!save.liteFx && Perf.tier < 1 && perfHordeLoad().mul >= 0.95) return true;
  let maxPerFrame = save.liteFx ? 5 : (Perf.tier >= 2 ? 9 : 14);
  const horde = perfHordeLoad();
  if (horde.mul < 1) maxPerFrame = Math.max(4, Math.floor(maxPerFrame * horde.mul));
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
const FLOATER_LANE_H = 22;
const FLOATER_LANE_W = 32;
const FLOATER_CLUSTER_R = 88;

function floaterLayerBase(layer) {
  switch (layer) {
    case 'style': return { x: 0, y: -40, laneH: 20 };
    case 'fx': return { x: 0, y: -58, laneH: 24 };
    case 'hud': return { x: 0, y: 0, laneH: 28, clusterR: 160 };
    default: return { x: 0, y: 0 };
  }
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
  const list = game && game.floaters ? game.floaters : [];
  const sameLayer = (fl) => (fl.layer || 'dmg') === layer;

  for (let lane = 0; lane < 8; lane++) {
    const sign = lane <= 0 ? 0 : (lane % 2 === 1 ? -1 : 1);
    const spread = lane <= 0 ? 0 : Math.ceil(lane / 2) * FLOATER_LANE_W * sign;
    const ty = y - lane * laneH;
    const tx = x + spread;
    let hit = false;
    for (const fl of list) {
      if (fl.life <= 0.2 || !sameLayer(fl)) continue;
      const dx = fl.x - tx;
      const dy = fl.y - ty;
      if (dx * dx + dy * dy > clusterR * clusterR) continue;
      const flHalf = floaterTextHalfW(fl.txt, fl.size);
      if (Math.abs(dx) < halfW + flHalf + 6 && Math.abs(dy) < laneH * 0.85) {
        hit = true;
        break;
      }
    }
    if (!hit) return { x: tx, y: ty, lane, layer };
  }
  const lane = list.filter(sameLayer).length % 8;
  return {
    x: x + Math.sin(lane * 0.9) * FLOATER_LANE_W * 1.4,
    y: y - lane * laneH,
    lane,
    layer,
  };
}

