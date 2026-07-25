'use strict';
/* =========================================================================
   STICKMAN FIGHTER — Monster Arena
   Stickman-vechtgame voor iPad (touch) en desktop (toetsenbord).
   Modi: Avontuur, Training, Versus 2P, Muur, Mats (coinrun).
   Audio (sfx + bgm) is procedureel via Web Audio — rechtenvrij.
   d20 c4 d5: horde FX scaling, pause perf strip helpers.
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

