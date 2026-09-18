/* ============================== CANVAS ================================= */
const canvas = document.getElementById('game');
const ctx = canvas ? canvas.getContext('2d') : null;
if (!canvas || !ctx) {
  try { sfReportError('canvas', new Error('2d context unavailable')); } catch (_) {}
}
let W = innerWidth, H = innerHeight, DPR = 1;
let resizeDebounce = null;
let lastResizeKey = '';
const canvasPointers = new Set();

function clearCanvasPointers() {
  canvasPointers.clear();
}

function releaseCanvasPointer(id) {
  if (!canvasPointers.has(id)) return;
  canvasPointers.delete(id);
  Input.onUp(id);
}

function resize() {
  const vp = viewportGameSize();
  syncViewportCssVars(vp);
  const newDpr = Math.min(devicePixelRatio || 1, maxCanvasDpr());
  // Do NOT include Perf.tier — tier bumps must not recreate/blank the canvas mid-fight
  // (that + skipHeavyDraw caused adventure backgrounds to vanish for a frame).
  const sizeKey = vp.w + 'x' + vp.h + '@' + newDpr;
  if (sizeKey === lastResizeKey) return;
  lastResizeKey = sizeKey;
  try { if (typeof menuBgCacheInvalidate === 'function') menuBgCacheInvalidate(); } catch (_) {}
  DPR = newDpr;
  W = vp.w;
  H = vp.h;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.left = vp.offsetX + 'px';
  canvas.style.top = vp.offsetY + 'px';
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  Input.layout(W, H);
  try { if (typeof refreshSatanCombatScale === 'function' && typeof game !== 'undefined') refreshSatanCombatScale(game); } catch (_) {}
  try { if (typeof refreshAdventureBossScale === 'function' && typeof game !== 'undefined') refreshAdventureBossScale(game); } catch (_) {}
  if (game) game.onResize();
}
function scheduleResize() {
  if (resizeDebounce) clearTimeout(resizeDebounce);
  const delay = IS_TOUCH ? (Perf.tier >= 2 ? 175 : 140) : 100;
  resizeDebounce = setTimeout(() => {
    resizeDebounce = null;
    if (window.__sfResizeT) cancelAnimationFrame(window.__sfResizeT);
    window.__sfResizeT = requestAnimationFrame(() => {
      window.__sfResizeT = null;
      resize();
    });
  }, delay);
}

/** Force canvas + touch-pad layout (level-start; debounced resize kan 140ms wachten). */
function forceGameResize() {
  lastResizeKey = '';
  resize();
}

/** Pop leftover clip/transform after a mid-frame throw so the next fight paint is on-canvas. */
function resetFightCanvas(c) {
  if (!c) return;
  try {
    for (let i = 0; i < 24; i++) c.restore();
  } catch (_) {}
  try {
    const dpr = (typeof DPR === 'number' && DPR > 0) ? DPR : 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.shadowBlur = 0;
    if ('filter' in c) c.filter = 'none';
  } catch (_) {}
}

function playfieldSizeNow() {
  const ww = (typeof W === 'number' && W > 8) ? W : 800;
  const hh = (typeof H === 'number' && H > 8) ? H : 520;
  return { w: ww, h: hh };
}

/** Keep fighters/mobs on the painted ground after rotate / late visualViewport. */
function pinPlayfieldBodies(game) {
  if (!game) return;
  const { w: ww, h: hh } = playfieldSizeNow();
  let gy = Number(game.ground);
  if (!Number.isFinite(gy) || gy < 24 || gy > hh) {
    gy = (typeof playfieldGroundY === 'function') ? playfieldGroundY(hh, ww) : hh * 0.72;
  }
  if (!Number.isFinite(gy) || gy < 24) gy = Math.max(80, hh * 0.7);
  if (gy > hh - 12) gy = Math.max(80, hh - 28);
  game.ground = gy;
  game.minX = 40;
  game.maxX = Math.max(80, ww - 40);
  const pinFighter = (f, fallbackX) => {
    if (!f) return;
    if (!(f.scale > 0.2 && Number.isFinite(f.scale))) f.scale = 1;
    if (!f.face) f.face = 1;
    if (!Number.isFinite(f.x)) f.x = fallbackX;
    f.x = clamp(f.x, game.minX, game.maxX);
    if (!Number.isFinite(f.y) || f.y > hh + 16 || f.y < 12) f.y = gy;
    else if (f.y > gy) f.y = gy;
  };
  pinFighter(game.player, ww * 0.25);
  pinFighter(game.p2, ww * 0.72);
  pinFighter(game.robot, ww * 0.7);
  if (game.monsters) {
    for (const m of game.monsters) {
      if (!m) continue;
      if (!Number.isFinite(m.x)) m.x = ww * 0.65;
      m.x = clamp(m.x, 16, ww - 16);
      if (!Number.isFinite(m.y) || m.y > hh + 40 || m.y < 8) {
        m.y = (m.flying || (m.sp && (m.sp.type === 'fly' || m.sp.type === 'dragon')))
          ? gy - 110
          : gy;
      } else if (!m.flying && !m.swimming && m.y > gy + 8) {
        m.y = gy;
      }
    }
  }
  if (game.pet) {
    if (!Number.isFinite(game.pet.x)) game.pet.x = (game.player && game.player.x) || ww * 0.2;
    if (!Number.isFinite(game.pet.y) || game.pet.y > hh + 20 || game.pet.y < 8) game.pet.y = gy;
  }
  if (game.eggPet) {
    if (!Number.isFinite(game.eggPet.x)) game.eggPet.x = (game.player && game.player.x) || ww * 0.2;
    if (!Number.isFinite(game.eggPet.y) || game.eggPet.y > hh + 20 || game.eggPet.y < 8) game.eggPet.y = gy;
  }
}

/** Dark style bodies (#1a2040 cyber, void, samurai) vanish on night/cyber stages. */
function fighterCombatStroke(color) {
  const col = color || '#f2f5ff';
  const m = /^#([0-9a-f]{6})$/i.exec(String(col));
  if (!m) return col;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum >= 0.38) return col;
  const lift = 0.55 + (0.42 - lum);
  const mix = (ch) => Math.min(255, Math.round(ch + (255 - ch) * lift));
  const hex = (v) => v.toString(16).padStart(2, '0');
  return '#' + hex(mix(r)) + hex(mix(g)) + hex(mix(b));
}

function drawFighterFallback(c, f) {
  if (!c || !f) return;
  const { w: ww, h: hh } = playfieldSizeNow();
  const x = Number.isFinite(f.x) ? f.x : ww * 0.25;
  const y = Number.isFinite(f.y) ? f.y : (hh * 0.72);
  const col = fighterCombatStroke(f.color || '#f2f5ff');
  c.save();
  c.globalAlpha = 1;
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.arc(x, y - 70, 11, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(x, y - 58);
  c.lineTo(x, y - 22);
  c.moveTo(x - 18, y - 46);
  c.lineTo(x + 18, y - 46);
  c.moveTo(x, y - 22);
  c.lineTo(x - 14, y);
  c.moveTo(x, y - 22);
  c.lineTo(x + 14, y);
  c.stroke();
  c.restore();
}

function drawMonsterFallback(c, m) {
  if (!c || !m) return;
  const { w: ww, h: hh } = playfieldSizeNow();
  const x = Number.isFinite(m.x) ? m.x : ww * 0.65;
  const y = Number.isFinite(m.y) ? m.y : (hh * 0.72);
  const r = (m.size > 4 && Number.isFinite(m.size)) ? m.size : 22;
  const col = (m.sp && m.sp.c1) || '#ffb0b8';
  c.save();
  c.globalAlpha = 1;
  c.fillStyle = col;
  c.strokeStyle = '#f2f5ff';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(x, y - r * 0.35, r, r * 0.85, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.restore();
}
addEventListener('resize', scheduleResize);
addEventListener('orientationchange', () => {
  if (state === 'play') try { Input.releaseAll(); } catch (_) {}
  setTimeout(resize, 60);
  scheduleResize();
});
if (typeof window !== 'undefined' && window.visualViewport) {
  window.visualViewport.addEventListener('resize', scheduleResize);
  window.visualViewport.addEventListener('scroll', scheduleResize);
}
window.addEventListener('pageshow', () => scheduleResize());

canvas.addEventListener('pointerdown', e => {
  if (state !== 'play' || !game) return;
  e.preventDefault();
  canvasPointers.add(e.pointerId);
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  try {
    const p = pointerGameCoords(e.clientX, e.clientY);
    if (typeof handleAimTutorialPointer === 'function' && handleAimTutorialPointer(p.x, p.y, game)) return;
    if (ketsbamHitTest(p.x, p.y, game) && game.tryKetsbam()) return;
    Input.onDown(p.x, p.y, e.pointerId);
  } catch (err) {
    try { sfReportError('canvas/pointerdown', err); } catch (_) {}
  }
});
canvas.addEventListener('pointermove', e => {
  if (state !== 'play' || !game) return;
  if (!canvasPointers.has(e.pointerId)) return;
  e.preventDefault();
  try {
    const p = pointerGameCoords(e.clientX, e.clientY);
    Input.onMove(p.x, p.y, e.pointerId);
  } catch (err) {
    try { sfReportError('canvas/pointermove', err); } catch (_) {}
  }
});
canvas.addEventListener('pointerup', e => {
  if (state !== 'play' || !game) return;
  e.preventDefault();
  releaseCanvasPointer(e.pointerId);
});
canvas.addEventListener('pointercancel', e => {
  if (state !== 'play' || !game) return;
  releaseCanvasPointer(e.pointerId);
});
canvas.addEventListener('lostpointercapture', e => {
  if (state !== 'play' || !game) return;
  releaseCanvasPointer(e.pointerId);
});
function onGlobalPointerEnd(e) {
  if (state !== 'play' || !game) return;
  releaseCanvasPointer(e.pointerId);
}
window.addEventListener('pointerup', onGlobalPointerEnd);
window.addEventListener('pointercancel', onGlobalPointerEnd);
window.addEventListener('blur', () => {
  if (state === 'play') {
    clearCanvasPointers();
    try { Input.releaseAll(); } catch (_) {}
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'play') {
    clearCanvasPointers();
    try { Input.releaseAll(); } catch (_) {}
  }
});
document.addEventListener('gesturestart', e => {
  if (state === 'play') e.preventDefault();
});
document.addEventListener('pointerdown', () => AudioSys.init(), { once: false });

const _releaseAllInput = Input.releaseAll.bind(Input);
Input.releaseAll = function releaseAllWithCanvasClear() {
  clearCanvasPointers();
  _releaseAllInput();
};
