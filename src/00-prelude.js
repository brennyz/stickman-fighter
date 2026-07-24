'use strict';
/* =========================================================================
   STICKMAN FIGHTER — Monster Arena
   Stickman-vechtgame voor iPad (touch) en desktop (toetsenbord).
   Modi: Avontuur, Training, Versus 2P, Muur, Mats (coinrun).
   Audio (sfx + bgm) is procedureel via Web Audio — rechtenvrij.
   d20 c4: volPct prelude, menuBackdropLiteFlags, motionReduced guards.
   ========================================================================= */

const TAU = Math.PI * 2;
const FX_CAP = { particles: 140, floaters: 28, projectiles: 48, banners: 5, afterimages: 12 };
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
    return state === 'play' && this.tier >= 2 && (this.frames & 1) === 0;
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
  /** Canvas mag getekend worden (gevecht of menu-backdrop). */
  canvasDrawActive() {
    if (typeof state !== 'undefined' && state === 'play' && typeof game !== 'undefined' && game) return true;
    return this.menuLandingVisible();
  },
  /** Statische submenu's — verlaag rAF-work (~2 Hz i.p.v. 60 Hz). */
  loopIdleMode() {
    if (typeof state === 'undefined' || state === 'play') return false;
    return !this.menuLandingVisible();
  },
};
function fxCaps() {
  let mul = 1;
  if (save.liteFx) mul = 0.55;
  else if (Perf.tier >= 2) mul = 0.42;
  else if (Perf.tier >= 1) mul = 0.68;
  if (motionReduced()) mul *= 0.62;
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
      : type === 'banner' ? cap.banners : 0;
  const arr = type === 'particle' ? g.particles
    : type === 'floater' ? g.floaters
      : type === 'banner' ? g.banners : null;
  if (!arr || !max) return 0;
  return Math.max(0, max - arr.length);
}
function perfFxBudgetAllow(g, cost) {
  cost = cost || 1;
  if (!g) return true;
  if (!save.liteFx && Perf.tier < 1) return true;
  const maxPerFrame = save.liteFx ? 5 : (Perf.tier >= 2 ? 9 : 14);
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
  return { fps, tier: Perf.tier, dpr, maxDpr: maxCanvasDpr(), caps };
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

