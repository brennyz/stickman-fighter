/* =============================== INPUT ================================= */
const SHURIKEN_CD = 0.4;
const SHURIKEN_BURST_WINDOW = 1.35;
const SHURIKEN_BURST_MAX = 3;

function inputPadForFighter(f) {
  if (f && f.playerSlot === 2) return InputP2;
  return Input;
}

/** Joystick / toetsen → genormaliseerde mikrichting (−y = omhoog). */
function fighterAimNorm(f) {
  const pad = inputPadForFighter(f);
  const face = (f && f.face) || 1;
  let nx = face * 0.82;
  let ny = -0.2;
  if (pad && pad.joy && pad.joy.active) {
    const jx = pad.joy.dx;
    const jy = pad.joy.dy;
    // Verticale mik los van horizontale looprichting — joy ↑ blijft duidelijk
    if (Math.abs(jy) >= JOY_AIM_DEAD_PX) {
      ny = clamp(jy / JOY_MAX_PX, -1.05, 0.78);
      if (ny < -0.14) ny = clamp(ny * 1.38, -1.15, 0);
    }
    if (Math.abs(jx) >= JOY_DEAD_PX) nx = clamp(jx / JOY_MAX_PX, -1, 1);
    else nx = face * 0.72;
  }
  if (pad && pad.keys) {
    const up = !!(pad.keys.arrowup || pad.keys.w);
    const down = !!(pad.keys.arrowdown || pad.keys.s);
    if (up && !down) ny = -0.95;
    if (down && !up) ny = 0.62;
  }
  const len = Math.hypot(nx, ny) || 1;
  return { nx: nx / len, ny: ny / len };
}

function aimVisualColor(ny) {
  if (ny < -0.42) return '#7cf5ff';
  if (ny > 0.22) return '#ffb06a';
  return '#e8f0ff';
}

function drawJoyAimGuide(c, jx, jy, j, ui, accent) {
  const outer = Math.round(48 * ui);
  c.save();
  c.globalAlpha = j.active ? 0.44 : 0.2;
  c.strokeStyle = accent || '#fff';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(jx, jy - outer + 6);
  c.lineTo(jx - 6, jy - outer + 16);
  c.lineTo(jx + 6, jy - outer + 16);
  c.closePath();
  c.stroke();
  c.beginPath();
  c.moveTo(jx, jy + outer - 6);
  c.lineTo(jx - 6, jy + outer - 16);
  c.lineTo(jx + 6, jy + outer - 16);
  c.closePath();
  c.stroke();
  const barX = jx + outer + Math.round(8 * ui);
  const barH = outer * 1.3;
  c.globalAlpha = 0.26;
  c.beginPath();
  c.moveTo(barX, jy - barH / 2);
  c.lineTo(barX, jy + barH / 2);
  c.stroke();
  c.fillStyle = '#aab4cc';
  c.beginPath();
  c.arc(barX, jy, 3, 0, TAU);
  c.fill();
  if (j.active && Math.abs(j.dy) >= JOY_AIM_DEAD_PX) {
    const t = clamp(-j.dy / JOY_MAX_PX, -1, 1);
    c.globalAlpha = 0.78;
    c.fillStyle = aimVisualColor(-t);
    c.beginPath();
    c.arc(barX, jy - t * (barH / 2 - 4), 5, 0, TAU);
    c.fill();
  }
  c.restore();
}

function drawPlayerAimIndicator(c, fighter, alpha) {
  if (!fighter || !fighter.alive) return;
  const aim = fighterAimNorm(fighter);
  const col = aimVisualColor(aim.ny);
  const ox = fighter.x;
  const oy = fighter.y - 52 + clamp(aim.ny, -1, 0.55) * 32;
  const len = 54;
  c.save();
  c.globalAlpha = alpha != null ? alpha : 0.5;
  c.strokeStyle = col;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(ox, oy);
  c.lineTo(ox + aim.nx * len, oy + aim.ny * len * 1.08);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.arc(ox + aim.nx * len, oy + aim.ny * len * 1.08, 5, 0, TAU);
  c.fill();
  const hit = meleeHitPoint(fighter, { range: 40 });
  c.globalAlpha *= 0.55;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(hit.hx - 6, hit.hy);
  c.lineTo(hit.hx + 6, hit.hy);
  c.moveTo(hit.hx, hit.hy - 6);
  c.lineTo(hit.hx, hit.hy + 6);
  c.stroke();
  c.restore();
}

/** Werpers / jutsu: snelheid in de mikrichting (joy ↑ = hoger gooien). */
function projAimVelocity(f, baseSpeed) {
  baseSpeed = baseSpeed || 520;
  const aim = fighterAimNorm(f);
  return {
    vx: aim.nx * baseSpeed,
    vy: aim.ny * baseSpeed * 1.05,
    nx: aim.nx,
    ny: aim.ny,
  };
}

/** Melee-hitpunt: joy/toets ↑ tilts de slag omhoog (flying + hoge vijanden). */
function meleeHitPoint(f, spec) {
  const aim = (f && f._aimAtAttack) || fighterAimNorm(f);
  const range = (spec && spec.range) || 40;
  const hx = f.x + f.face * range * (0.72 + Math.abs(aim.nx) * 0.18);
  const moveOff = (spec && spec.moveHitY) || 0;
  const hy = f.y - 48 + clamp(aim.ny, -1, 0.65) * 88 + moveOff;
  return { hx, hy, aim };
}

function canThrowShuriken(f, game) {
  if (!f || f._shurikenCd > 0) return false;
  const t = game ? game.t : 0;
  f._shurikenBurst = (f._shurikenBurst || []).filter(x => t - x < SHURIKEN_BURST_WINDOW);
  return f._shurikenBurst.length < SHURIKEN_BURST_MAX;
}

function noteShurikenThrow(f, game) {
  f._shurikenCd = SHURIKEN_CD;
  const t = game ? game.t : 0;
  f._shurikenBurst = f._shurikenBurst || [];
  f._shurikenBurst.push(t);
}

const JOY_DEAD_PX = 11;
const JOY_AIM_DEAD_PX = 7;
const JOY_MAX_PX = 58;
/** Geen pointermove meer → joy los (iPad mist soms pointerup) — alleen als touch weg is */
const JOY_STALE_MS = IS_TOUCH ? 2000 : 1600;

function btnHitSlop() {
  const base = (typeof save !== 'undefined' && save.bigTouch !== false) ? 14 : 10;
  if (IS_TOUCH && typeof W === 'number' && W > 0 && typeof H === 'number' && H > 0) {
    const ui = touchUiScale(W, H);
    return Math.round(base + (ui >= 1.02 ? 5 : 2));
  }
  return base;
}

/** Dichtstbijzijnde knop binnen slop — voorkomt verkeerde match bij overlap/slop (d9). */
function hitTouchButton(buttons, x, y) {
  const slop = btnHitSlop();
  let best = null;
  let bestD = Infinity;
  for (const b of buttons) {
    const d = Math.hypot(x - b.x, y - b.y);
    if (d <= b.r + slop && d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}

function joyGuardRadius(pad) {
  const ui = touchUiScale(W, H);
  return Math.round((pad && pad.side === 'p2' ? 54 : 58) * ui);
}

function pointInJoyZone(pad, x, y) {
  const home = (pad && pad.joyHome) || { x: 110, y: (H || 600) - 110 };
  return Math.hypot(x - home.x, y - home.y) <= joyGuardRadius(pad) + btnHitSlop() * 0.5;
}

function nearAnyTouchButton(buttons, x, y, extra) {
  const pad = extra || 0;
  const slop = btnHitSlop() + pad;
  for (const b of buttons) {
    if (Math.hypot(x - b.x, y - b.y) < b.r + slop) return true;
  }
  return false;
}

const TOUCH_BTN_META = {
  punch: { label: '\u{1F44A}', color: '#e0533f' },
  kick: { label: '\u{1F9B6}', color: '#3f8fe0' },
  weapon: { label: '\u{1F52A}', color: '#9b59d0' },
  special: { label: '\u{1F300}', color: '#3db8ff' },
  subst: { label: '\u{1F4A8}', color: '#c9a66b' },
  jump: { label: '\u2B06\uFE0F', color: '#43b25b' },
};

function touchBtn(id, x, y, rad) {
  const m = TOUCH_BTN_META[id];
  return { id, x, y, r: rad, label: m.label, color: m.color, held: false };
}

function shiftTouchButtons(buttons, dx) {
  if (!dx) return;
  for (const b of buttons) b.x += dx;
}

/** Knoppen mogen niet buiten de schermranden uitsteken. */
function clampButtonsToScreen(buttons, H) {
  let maxBy = -Infinity, maxBx = -Infinity;
  for (const b of buttons) {
    maxBy = Math.max(maxBy, b.y + b.r);
    maxBx = Math.max(maxBx, b.x + b.r);
  }
  const overY = maxBy - (H - 4);
  if (overY > 0) for (const b of buttons) b.y -= overY;
  const overX = maxBx - (W - 2);
  if (overX > 0) for (const b of buttons) b.x -= overX;
}

function layoutTouchButtonCluster(W, H, ui, safe, opts) {
  const side = opts.side || 'p1';
  const dual = !!opts.dual;
  const portraitTight = W < 420 && H > W * 1.02;
  const r = Math.max(20, Math.round((portraitTight ? 34 : 42) * ui));
  const rs = Math.max(17, Math.round((portraitTight ? 28 : 34) * ui));
  const bottomY = H - safe.bottom - Math.max(10, H * 0.02);
  const joyInset = Math.max((dual ? 48 : 64) + (side === 'p1' ? safe.left : safe.right), W * (portraitTight ? 0.09 : 0.12));
  const joyHome = side === 'p1'
    ? { x: joyInset, y: bottomY - (dual ? 6 : 8) }
    : { x: W - joyInset, y: bottomY - 6 };

  let buttons;
  if (!dual) {
    const marginR = Math.max(10 + safe.right, W * 0.035);
    const xR = W - marginR;
    if (portraitTight) {
      const rSmall = Math.max(18, Math.round(28 * ui));
      const rsSmall = Math.max(15, Math.round(24 * ui));
      const col = rSmall * 1.55 + 12;
      const gap = 6;
      const by = bottomY - rsSmall * 0.35;
      const xJump = xR - rsSmall * 0.15;
      const xMid = xR - col;
      const xFar = xR - col * 2.25;
      buttons = [
        touchBtn('jump', xJump, by, rsSmall),
        touchBtn('punch', xMid, by, rSmall),
        touchBtn('kick', xFar, by, rSmall),
        touchBtn('special', xJump, by - (rsSmall + rSmall + gap), rSmall),
        touchBtn('weapon', xMid, by - (rSmall + rSmall + gap), rSmall),
        touchBtn('subst', xFar, by - (rsSmall + rSmall + gap), rsSmall),
      ];
      const joyClear = joyHome.x + Math.round(50 * ui) + rSmall * 0.25;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
    } else {
      // Nette 3×2 grid zonder overlap (fix: punch/jump lagen op elkaar,
      // waardoor jump onbereikbaar was — hitButton pakt de eerste match).
      const gap = Math.max(8, Math.round(10 * ui));
      const colW = r * 2 + gap;
      const rowH = r * 2 + gap;
      const x1 = xR - r;
      const x2 = x1 - colW;
      const x3 = x2 - colW * 0.96;
      const yB = bottomY - r * 0.15;
      const yT = yB - rowH;
      buttons = [
        touchBtn('punch', x1, yB, r),
        touchBtn('kick', x2, yB, r),
        touchBtn('jump', x3, yB + (r - rs) * 0.4, rs),
        touchBtn('special', x1, yT, r),
        touchBtn('weapon', x2, yT, r),
        touchBtn('subst', x3, yT + (r - rs) * 0.4, rs),
      ];
      const joyClear = joyHome.x + Math.round(55 * ui) + r * 0.3;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
    }
    clampButtonsToScreen(buttons, H);
    return { joyHome, buttons };
  }

  const zoneEdge = portraitTight ? (side === 'p1' ? W * 0.44 : W * 0.56) : (side === 'p1' ? W * 0.48 : W * 0.52);
  const sign = side === 'p1' ? -1 : 1;
  if (portraitTight) {
    const rSmall = Math.max(17, Math.round(26 * ui));
    const rsSmall = Math.max(14, Math.round(22 * ui));
    const col = rSmall * 1.5 + 11;
    const gap = 5;
    const by = bottomY - rsSmall * 0.32;
    const edge = zoneEdge;
    const xNear = edge + sign * rsSmall * 0.2;
    const xMid = edge + sign * col;
    const xFar = edge + sign * col * 2.2;
    buttons = [
      touchBtn('jump', xNear, by, rsSmall),
      touchBtn('punch', xMid, by, rSmall),
      touchBtn('kick', xFar, by, rSmall),
      touchBtn('special', xNear, by - (rsSmall + rSmall + gap), rSmall),
      touchBtn('weapon', xMid, by - (rSmall + rSmall + gap), rSmall),
      touchBtn('subst', xFar, by - (rsSmall + rSmall + gap), rsSmall),
    ];
    if (side === 'p1') {
      const joyClear = joyHome.x + Math.round(46 * ui) + rSmall * 0.2;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
      const maxBx = Math.max(...buttons.map((b) => b.x + b.r));
      if (maxBx > W * 0.46 - 6) shiftTouchButtons(buttons, (W * 0.46 - 6) - maxBx);
    } else {
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < W * 0.54 + 6) shiftTouchButtons(buttons, (W * 0.54 + 6) - minBx);
      const maxBx = Math.max(...buttons.map((b) => b.x + b.r));
      const joyClear = W - joyHome.x + Math.round(46 * ui) + rSmall * 0.2;
      if (W - minBx < joyClear) shiftTouchButtons(buttons, -(joyClear - (W - minBx)));
      if (maxBx > W - 6) shiftTouchButtons(buttons, -(maxBx - (W - 6)));
    }
  } else {
    // 2P landscape: compacte 2×3 grid per kant — geen overlap
    const gapD = Math.max(6, Math.round(8 * ui));
    const rD = Math.max(19, Math.round(r * 0.88));
    const rsD = Math.max(16, Math.round(rs * 0.88));
    const colW2 = rD * 2 + gapD;
    const rowH2 = rD * 2 + gapD;
    const xIn = zoneEdge + sign * rD;
    const xOut = zoneEdge + sign * (rD + colW2);
    const yB2 = bottomY - rD * 0.15;
    const yM2 = yB2 - rowH2;
    const yT2 = yM2 - rowH2;
    buttons = [
      touchBtn('punch', xIn, yB2, rD),
      touchBtn('kick', xOut, yB2, rD),
      touchBtn('special', xIn, yM2, rD),
      touchBtn('weapon', xOut, yM2, rD),
      touchBtn('jump', xIn, yT2 + (rD - rsD) * 0.4, rsD),
      touchBtn('subst', xOut, yT2 + (rD - rsD) * 0.4, rsD),
    ];
    // joystick-clearance per kant
    if (side === 'p1') {
      const joyClear = joyHome.x + Math.round(55 * ui) + rD * 0.3;
      const minBx = Math.min(...buttons.map((b) => b.x - b.r));
      if (minBx < joyClear) shiftTouchButtons(buttons, joyClear - minBx);
    } else {
      const joyClearR = joyHome.x - Math.round(55 * ui) - rD * 0.3;
      const maxBx = Math.max(...buttons.map((b) => b.x + b.r));
      if (maxBx > joyClearR) shiftTouchButtons(buttons, joyClearR - maxBx);
    }
  }
  clampButtonsToScreen(buttons, H);
  return { joyHome, buttons };
}

/** 2P touch: middenstrook = geen joystick (minder mis-taps op split). */
function touchPadZone(x) {
  if (!Input.dualMode) return 'p1';
  const w = W || (typeof innerWidth === 'number' ? innerWidth : 800);
  const margin = IS_TOUCH ? (w < 420 ? 0.08 : 0.06) : 0.04;
  const lo = w * (0.5 - margin);
  const hi = w * (0.5 + margin);
  if (x >= lo && x <= hi) return 'neutral';
  return x < lo ? 'p1' : 'p2';
}

function relayoutTouchPads() {
  if (typeof W === 'undefined' || typeof H === 'undefined') return;
  try {
    Input.layout(W, H);
    if (typeof InputP2 !== 'undefined') InputP2.layout(W, H);
  } catch (_) {}
}

/** Reset touch pads before versus / after pause — voorkomt spook-vingers. */
function primePlayInput(dual) {
  Input.releaseAll();
  Input.dualMode = !!dual;
  relayoutTouchPads();
}

/** Voorkom dat scroll/slide over menu-tegels meteen selecteert (iPad). */
const TAP_SLOP_PX = IS_TOUCH ? 12 : 8;
const _uiTaps = new Map();
const _uiTapBlocked = new Set();
let _uiBlockClickAfterScroll = false;
const MAX_PAD_POINTERS = IS_TOUCH ? 8 : 12;

function uiTapScrollParents(fromEl) {
  const out = [];
  let el = fromEl;
  while (el && el !== document.documentElement) {
    if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
      out.push({ el, top: el.scrollTop, left: el.scrollLeft });
    }
    el = el.parentElement;
  }
  return out;
}

function uiTapSlopPx() {
  if (IS_TOUCH && typeof save !== 'undefined' && save.bigTouch !== false) return 16;
  return TAP_SLOP_PX;
}

function uiTapPointerId(e) {
  if (e && e.pointerId != null) return e.pointerId;
  const t = e && e.changedTouches && e.changedTouches[0];
  return t ? t.identifier : null;
}

function uiTapGuardMove(id, x, y) {
  const tap = _uiTaps.get(id);
  if (!tap) return;
  if (Math.hypot(x - tap.x, y - tap.y) > uiTapSlopPx()) tap.moved = true;
  if (tap.moved) return;
  for (const s of tap.scrolls) {
    if (Math.abs(s.el.scrollTop - s.top) > 1 || Math.abs(s.el.scrollLeft - s.left) > 1) {
      tap.moved = true;
      break;
    }
  }
}

function uiTapGuardFinish(cancelled, id) {
  const tap = _uiTaps.get(id);
  if (!tap) return;
  if (cancelled || tap.moved) _uiTapBlocked.add(id);
  else _uiTapBlocked.delete(id);
  if (cancelled || tap.moved) _uiBlockClickAfterScroll = true;
  _uiTaps.delete(id);
}

function uiTapAllowed(e) {
  const id = uiTapPointerId(e);
  if (id == null) return true;
  if (_uiTapBlocked.has(id)) {
    _uiTapBlocked.delete(id);
    return false;
  }
  const tap = _uiTaps.get(id);
  if (tap) return !tap.moved;
  return true;
}

function initUiTapScrollGuard() {
  if (window.__sfUiTapGuard) return;
  window.__sfUiTapGuard = true;
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    _uiTaps.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      moved: false,
      scrolls: uiTapScrollParents(e.target),
    });
    _uiTapBlocked.delete(e.pointerId);
  }, { passive: true, capture: true });
  document.addEventListener('pointermove', (e) => {
    if (!_uiTaps.has(e.pointerId)) return;
    uiTapGuardMove(e.pointerId, e.clientX, e.clientY);
  }, { passive: true, capture: true });
  document.addEventListener('pointerup', (e) => {
    if (!_uiTaps.has(e.pointerId)) return;
    uiTapGuardFinish(false, e.pointerId);
  }, { passive: true, capture: true });
  document.addEventListener('pointercancel', (e) => {
    if (!_uiTaps.has(e.pointerId)) return;
    uiTapGuardFinish(true, e.pointerId);
  }, { passive: true, capture: true });
  document.addEventListener('click', (e) => {
    if (!_uiBlockClickAfterScroll) return;
    _uiBlockClickAfterScroll = false;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, true);
}

function touchEndedOnSelector(e, selector) {
  if (!uiTapAllowed(e)) return null;
  const t = e.changedTouches && e.changedTouches[0];
  const fromTarget = e.target && e.target.closest ? e.target.closest(selector) : null;
  if (!fromTarget) return null;
  if (!t) return fromTarget;
  try {
    const top = document.elementFromPoint(t.clientX, t.clientY);
    const fromPoint = top && top.closest ? top.closest(selector) : null;
    if (fromPoint && fromPoint !== fromTarget) return null;
  } catch (_) {}
  return fromTarget;
}

function readSafeInsets() {
  try {
    const cs = getComputedStyle(document.documentElement);
    const px = (k) => parseFloat(cs.getPropertyValue(k)) || 0;
    return {
      top: px('--safe-top'),
      bottom: px('--safe-bottom'),
      left: px('--safe-left'),
      right: px('--safe-right'),
    };
  } catch (_) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

function syncViewportCssVars(vp) {
  vp = vp || viewportGameSize();
  try {
    const root = document.documentElement;
    root.style.setProperty('--vv-w', vp.w + 'px');
    root.style.setProperty('--vv-h', vp.h + 'px');
    root.style.setProperty('--vv-top', vp.offsetY + 'px');
    root.style.setProperty('--vv-left', vp.offsetX + 'px');
  } catch (_) {}
}

function viewportGameSize() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (vv && vv.width > 0 && vv.height > 0) {
    return {
      w: Math.max(1, Math.round(vv.width)),
      h: Math.max(1, Math.round(vv.height)),
      offsetX: Math.round(vv.offsetLeft || 0),
      offsetY: Math.round(vv.offsetTop || 0),
    };
  }
  return { w: Math.max(1, innerWidth), h: Math.max(1, innerHeight), offsetX: 0, offsetY: 0 };
}

function touchUiScale(W, H) {
  const base = (typeof save !== 'undefined' && save.bigTouch !== false) ? 1.1 : 1;
  const portrait = H > W * 1.04;
  const fit = portrait
    ? Math.min(W / 390, H / 660, W / H * 0.95)
    : Math.min(W / 400, H / 740);
  return clamp(fit * base, 0.62, 1.16);
}

function hudInsetTop() {
  return Math.max(readSafeInsets().top, 6) + 10;
}

function playfieldGroundY(H, W) {
  const portrait = H > W * 1.02;
  if (portrait && H < 480) return H * 0.68;
  if (portrait && H < 520) return H * 0.7;
  if (portrait && H < 640) return H * 0.72;
  if (portrait) return H * 0.73;
  return H * 0.78;
}

function pointerGameCoords(clientX, clientY) {
  const el = canvas;
  if (el && W > 0 && H > 0) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 2 && rect.height > 2) {
      return {
        x: clamp((clientX - rect.left) * (W / rect.width), 0, W),
        y: clamp((clientY - rect.top) * (H / rect.height), 0, H),
      };
    }
  }
  const vp = viewportGameSize();
  return {
    x: clamp(clientX - vp.offsetX, 0, W || vp.w),
    y: clamp(clientY - vp.offsetY, 0, H || vp.h),
  };
}

function ketsbamPromptCenter() {
  return { cx: W * 0.5, cy: H * 0.46 };
}

function ketsbamHitTest(x, y, g) {
  if (!g || !g.ketsbamShow) return false;
  const ui = touchUiScale(W, H);
  const { cx, cy } = ketsbamPromptCenter();
  const r = 58 * ui + btnHitSlop();
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function applyJoyDelta(pad, x, y, id) {
  if (!pad.joy.active || pad.joy.id !== id) return;
  let dx = x - pad.joy.ox;
  let dy = y - pad.joy.oy;
  // Zwevende stick: origin schuift mee aan de rand — makkelijker omkeren links/rechts
  if (Math.abs(dx) > JOY_MAX_PX) {
    pad.joy.ox += dx - Math.sign(dx) * JOY_MAX_PX;
    dx = Math.sign(dx) * JOY_MAX_PX;
  }
  if (Math.abs(dy) > JOY_MAX_PX) {
    pad.joy.oy += dy - Math.sign(dy) * JOY_MAX_PX;
    dy = Math.sign(dy) * JOY_MAX_PX;
  }
  if (Math.abs(dx) < JOY_DEAD_PX) dx = 0;
  if (Math.abs(dy) < JOY_DEAD_PX) dy = 0;
  pad.joy.dx = dx;
  pad.joy.dy = dy;
  pad.joy.lastAt = performance.now();
}

function makePad(side) {
  return {
    side,
    keys: {},
    pressed: {},
    activePointers: new Set(),
    joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, lastAt: 0 },
    buttons: [],
    btnPointers: {},
    pointerPads: {},
    joyHome: { x: 110, y: 0 },
    lastMoveTap: 0,
    lastMoveDir: 0,
    releaseJoy() {
      this.joy.active = false;
      this.joy.id = null;
      this.joy.dx = 0;
      this.joy.dy = 0;
      this.joy.lastAt = 0;
    },
    releaseAll() {
      this.releaseJoy();
      for (const b of this.buttons) b.held = false;
      this.btnPointers = {};
      this.pointerPads = {};
      this.activePointers.clear();
      this.keys = {};
    },
    refreshJoyHold(now) {
      if (this.joy.active && this.joy.id != null && this.activePointers.has(this.joy.id)) {
        this.joy.lastAt = now;
      }
    },
    hardenPointers(now) {
      const t = now || performance.now();
      if (this.joy.active) {
        if (this.joy.id == null || !this.activePointers.has(this.joy.id)) {
          this.releaseJoy();
        } else if (
          this.activePointers.size === 0
          && this.joy.lastAt
          && t - this.joy.lastAt > JOY_STALE_MS
        ) {
          this.releaseJoy();
        }
      }
      if (this.joy.active && this.activePointers.size === 0) {
        this.releaseJoy();
      }
      for (const pid of Object.keys(this.btnPointers)) {
        const n = Number(pid);
        if (!this.activePointers.has(n) && !this.activePointers.has(pid)) {
          const bid = this.btnPointers[pid];
          const b = this.buttons.find(q => q.id === bid);
          if (b) b.held = false;
          delete this.btnPointers[pid];
        }
      }
    },
    get move() {
      let m = padDigitalMove(this);
      if (this.joy.active) m += joyMoveAxis(this);
      return clamp(m, -1, 1);
    },
    press(action) { this.pressed[action] = true; },
    take(action) { const v = this.pressed[action]; this.pressed[action] = false; return !!v; },
    layout(W, H) {
      const ui = touchUiScale(W, H);
      const safe = readSafeInsets();
      const laid = layoutTouchButtonCluster(W, H, ui, safe, { side: this.side, dual: true });
      this.joyHome = laid.joyHome;
      this.buttons = laid.buttons;
    },
    hitButton(x, y) {
      return hitTouchButton(this.buttons, x, y);
    },
    ownsTouch(x, y, dual) {
      if (!dual) return this.side === 'p1';
      const z = touchPadZone(x);
      if (z === 'neutral') return false;
      return this.side === 'p1' ? z === 'p1' : z === 'p2';
    },
    onDown(x, y, id, dual) {
      if (!this.ownsTouch(x, y, dual)) return false;
      if (this.activePointers.size >= MAX_PAD_POINTERS && !this.activePointers.has(id)) return false;
      this.activePointers.add(id);
      if (dual) this.pointerPads[id] = this.side;
      const b = this.hitButton(x, y);
      if (b) {
        if (b.held) return true;
        this.btnPointers[id] = b.id;
        b.held = true;
        this.press(b.id);
        return true;
      }
      if (this.joy.active && this.joy.id !== id && !this.activePointers.has(this.joy.id)) {
        this.releaseJoy();
      }
      if (this.joy.active && this.joy.id !== id) return false;
      if (!this.joy.active) {
        if (!pointInJoyZone(this, x, y)) return false;
        if (nearAnyTouchButton(this.buttons, x, y, btnHitSlop())) return false;
        this.joy.active = true;
        this.joy.id = id;
        this.joy.ox = x;
        this.joy.oy = y;
        this.joy.dx = 0;
        this.joy.dy = 0;
        this.joy.lastAt = performance.now();
        return true;
      }
      return false;
    },
    onMove(x, y, id, dual) {
      if (!this.activePointers.has(id)) return;
      if (dual && this.pointerPads[id] && this.pointerPads[id] !== this.side) return;
      applyJoyDelta(this, x, y, id);
    },
    onUp(id) {
      this.activePointers.delete(id);
      delete this.pointerPads[id];
      if (this.joy.active && this.joy.id === id) {
        const dx = this.joy.dx;
        if (Math.abs(dx) > 22) {
          const now = performance.now();
          const dir = Math.sign(dx);
          if (now - this.lastMoveTap < 320 && this.lastMoveDir === dir) this.press('dash');
          this.lastMoveTap = now;
          this.lastMoveDir = dir;
        }
        this.releaseJoy();
      }
      const bid = this.btnPointers[id];
      if (bid) {
        const b = this.buttons.find(q => q.id === bid);
        if (b) b.held = false;
        delete this.btnPointers[id];
      }
    },
  };
}

const Input = makePad('p1');
const _padP1Methods = {
  onDown: Input.onDown,
  onMove: Input.onMove,
  onUp: Input.onUp,
  hardenPointers: Input.hardenPointers,
  refreshJoyHold: Input.refreshJoyHold,
  releaseAll: Input.releaseAll,
  layout: Input.layout,
};

Object.assign(Input, {
  dualMode: false,
  pointerPads: {},
  onDown(x, y, id) {
    AudioSys.init();
    if (this.dualMode) {
      const z = touchPadZone(x);
      if (z === 'neutral') return;
      this.pointerPads[id] = z;
      if (z === 'p2') {
        InputP2.onDown(x, y, id, true);
        return;
      }
      _padP1Methods.onDown.call(this, x, y, id, true);
      return;
    }
    if (this.activePointers.size >= MAX_PAD_POINTERS && !this.activePointers.has(id)) return;
    this.activePointers.add(id);
    const b = hitTouchButton(this.buttons, x, y);
    if (b) {
      if (b.held) return;
      this.btnPointers[id] = b.id;
      b.held = true;
      this.press(b.id);
      return;
    }
    if (!pointInJoyZone(this, x, y)) {
      if (this.joy.active && this.joy.id === id) this.releaseJoy();
      this.activePointers.delete(id);
      return;
    }
    if (nearAnyTouchButton(this.buttons, x, y, btnHitSlop())) {
      this.activePointers.delete(id);
      return;
    }
    if (this.joy.active && this.joy.id !== id && !this.activePointers.has(this.joy.id)) {
      this.releaseJoy();
    }
    if (this.joy.active && this.joy.id !== id) return;
    if (!this.joy.active) {
      this.joy.active = true;
      this.joy.id = id;
      this.joy.ox = x;
      this.joy.oy = y;
      this.joy.dx = 0;
      this.joy.dy = 0;
      this.joy.lastAt = performance.now();
    }
  },
  onMove(x, y, id) {
    if (this.dualMode) {
      const owner = this.pointerPads[id];
      if (owner === 'p2') {
        InputP2.onMove(x, y, id, true);
        return;
      }
      if (owner === 'p1') {
        _padP1Methods.onMove.call(this, x, y, id, true);
        return;
      }
      return;
    }
    if (!this.activePointers.has(id)) return;
    applyJoyDelta(this, x, y, id);
  },
  onUp(id) {
    if (this.dualMode) {
      const owner = this.pointerPads[id];
      if (owner === 'p2') InputP2.onUp(id);
      else if (owner === 'p1') _padP1Methods.onUp.call(this, id);
      delete this.pointerPads[id];
      return;
    }
    _padP1Methods.onUp.call(this, id);
  },
  hardenPointers(now) {
    _padP1Methods.hardenPointers.call(this, now);
    if (InputP2 && Input.dualMode) InputP2.hardenPointers(now);
  },
  releaseAll() {
    _padP1Methods.releaseAll.call(this);
    this.pointerPads = {};
    if (InputP2) InputP2.releaseAll();
  },
  endFrame() {
    const now = performance.now();
    _padP1Methods.refreshJoyHold.call(this, now);
    if (InputP2 && Input.dualMode) InputP2.refreshJoyHold.call(InputP2, now);
    this.hardenPointers(now);
    this.pressed = {};
    if (InputP2) InputP2.pressed = {};
  },
});

const InputP2 = makePad('p2');

Input.layout = function (W, H) {
  if (Input.dualMode) {
    _padP1Methods.layout.call(Input, W, H);
    InputP2.layout(W, H);
    return;
  }
  const ui = touchUiScale(W, H);
  const safe = readSafeInsets();
  const laid = layoutTouchButtonCluster(W, H, ui, safe, { side: 'p1', dual: false });
  Input.joyHome = laid.joyHome;
  Input.buttons = laid.buttons;
};

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  const now = performance.now();
  if (!Input.keys[k]) {
    if (k === 'w' || k === ' ' || (!Input.dualMode && k === 'arrowup')) Input.press('jump');
    if (k === 'j') Input.press('punch');
    if (k === 'k') Input.press('kick');
    if (k === 'l') Input.press('weapon');
    if (k === 'u' || k === 'i') Input.press('special');
    if (k === 'shift') Input.press('subst');
    if (k === 'e' && state === 'play' && game) game.tryKetsbam();
  }
  if (k === 'a' || (!Input.dualMode && k === 'arrowleft')) {
    if (now - Input.lastMoveTap < 300 && Input.lastMoveDir === -1) Input.press('dash');
    Input.lastMoveTap = now; Input.lastMoveDir = -1;
  }
  if (k === 'd' || (!Input.dualMode && k === 'arrowright')) {
    if (now - Input.lastMoveTap < 300 && Input.lastMoveDir === 1) Input.press('dash');
    Input.lastMoveTap = now; Input.lastMoveDir = 1;
  }
  if (Input.dualMode) {
    if (!InputP2.keys[k]) {
      if (k === 'arrowup') InputP2.press('jump');
      if (k === '1' || k === 'end') InputP2.press('punch');
      if (k === '2' || k === 'pagedown') InputP2.press('kick');
      if (k === '3') InputP2.press('weapon');
      if (k === '4') InputP2.press('special');
      if (k === '5') InputP2.press('subst');
    }
    if (k === 'arrowleft') {
      if (now - InputP2.lastMoveTap < 300 && InputP2.lastMoveDir === -1) InputP2.press('dash');
      InputP2.lastMoveTap = now; InputP2.lastMoveDir = -1;
    }
    if (k === 'arrowright') {
      if (now - InputP2.lastMoveTap < 300 && InputP2.lastMoveDir === 1) InputP2.press('dash');
      InputP2.lastMoveTap = now; InputP2.lastMoveDir = 1;
    }
    InputP2.keys[k] = true;
  }
  Input.keys[k] = true;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  Input.keys[k] = false;
  if (InputP2) InputP2.keys[k] = false;
});

