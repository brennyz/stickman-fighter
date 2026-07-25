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
  const sizeKey = vp.w + 'x' + vp.h + '@' + newDpr + 't' + Perf.tier;
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
  const p = pointerGameCoords(e.clientX, e.clientY);
  if (ketsbamHitTest(p.x, p.y, game) && game.tryKetsbam()) return;
  Input.onDown(p.x, p.y, e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (state !== 'play' || !game) return;
  if (!canvasPointers.has(e.pointerId)) return;
  e.preventDefault();
  const p = pointerGameCoords(e.clientX, e.clientY);
  Input.onMove(p.x, p.y, e.pointerId);
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
