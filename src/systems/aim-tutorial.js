/* ======================== MOVE-BAR AIM TUTORIAL ======================== */
/** First-combat overlay: teach that the move bar aims high vs low. */
const AIM_TUTORIAL_TIP = 'moveBarAim';
const AIM_TUTORIAL_AUTO_SEC = 20;
const AIM_TUTORIAL_MODES = { adventure: 1, training: 1 };

function aimTutorialTxt(key, fallback) {
  try {
    if (typeof t === 'function') {
      const v = t('aimTut.' + key);
      if (v && v !== 'aimTut.' + key) return v;
    }
  } catch (_) {}
  return fallback;
}

function aimTutorialSeen() {
  try {
    if (typeof ensureTipsSeen === 'function') ensureTipsSeen();
    else if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
    return !!(save.tipsSeen && save.tipsSeen[AIM_TUTORIAL_TIP]);
  } catch (_) {
    return false;
  }
}

function markAimTutorialSeen() {
  try {
    if (typeof ensureTipsSeen === 'function') ensureTipsSeen();
    else if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
    if (save.tipsSeen[AIM_TUTORIAL_TIP]) return;
    save.tipsSeen[AIM_TUTORIAL_TIP] = 1;
    if (typeof persist === 'function') persist();
  } catch (_) {}
}

/** Retest: wipe the seen flag. Console: __sf.resetAimTutorial() */
function resetAimTutorialFlag() {
  try {
    if (typeof ensureTipsSeen === 'function') ensureTipsSeen();
    else if (!save.tipsSeen || typeof save.tipsSeen !== 'object') save.tipsSeen = {};
    if (save.tipsSeen) delete save.tipsSeen[AIM_TUTORIAL_TIP];
    if (typeof persist === 'function') persist();
    return true;
  } catch (_) {
    return false;
  }
}

function aimTutorialShouldOffer(mode) {
  if (!AIM_TUTORIAL_MODES[mode] || aimTutorialSeen()) return false;
  // MASTERGAME first-30s: punch first — no aim text wall on first Avontuur.
  try {
    if (mode === 'adventure' && typeof firstPunchPending === 'function' && firstPunchPending()) {
      return false;
    }
  } catch (_) {}
  return true;
}

function aimTutorialActive(g) {
  return !!(g && g.aimTut && !g.aimTut.done);
}

function beginAimTutorial(g) {
  if (!g || g.aimTut || !aimTutorialShouldOffer(g.mode)) return false;
  g.aimTut = {
    t: 0,
    done: false,
    layout: null,
    demoNy: -0.55,
  };
  g.hint = 0;
  return true;
}

function maybeStartAimTutorial(g) {
  try { return beginAimTutorial(g); } catch (_) { return false; }
}

function finishAimTutorial(g, reason) {
  if (!g || !g.aimTut || g.aimTut.done) return;
  g.aimTut.done = true;
  g.aimTut.reason = reason || 'ok';
  g.aimTut = null;
  markAimTutorialSeen();
  if (g.hint < 4 && g.modeHintLine) g.hint = 4.5;
  try { if (typeof haptic === 'function') haptic(8); } catch (_) {}
  try { if (typeof AudioSys !== 'undefined') AudioSys.sfx('select'); } catch (_) {}
}

function updateAimTutorial(g, dt) {
  if (!aimTutorialActive(g)) return;
  if (g.over) {
    finishAimTutorial(g, 'over');
    return;
  }
  const tut = g.aimTut;
  tut.t += dt;
  const calm = typeof motionReduced === 'function' && motionReduced();
  if (calm) tut.demoNy = -0.55;
  else tut.demoNy = Math.sin(tut.t * 1.35) * 0.82;
  if (tut.t >= AIM_TUTORIAL_AUTO_SEC) finishAimTutorial(g, 'timeout');
}

function aimTutRoundRect(c, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function aimTutWrap(c, text, maxW) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function aimTutJoyPos() {
  try {
    if (typeof Input !== 'undefined' && Input) {
      const j = Input.joy;
      if (j && j.active) return { x: j.ox, y: j.oy, active: true, dx: j.dx || 0, dy: j.dy || 0 };
      const home = Input.joyHome;
      if (home) return { x: home.x, y: home.y, active: false, dx: 0, dy: 0 };
    }
  } catch (_) {}
  return { x: 110, y: (typeof H === 'number' ? H : 640) - 110, active: false, dx: 0, dy: 0 };
}

function aimTutLiveNy(g) {
  try {
    if (g && g.player && typeof fighterAimNorm === 'function') {
      const pad = typeof Input !== 'undefined' ? Input : null;
      if (pad && pad.joy && pad.joy.active && Math.abs(pad.joy.dy) >= 7) {
        return fighterAimNorm(g.player).ny;
      }
      if (pad && pad.keys && (pad.keys.w || pad.keys.arrowup || pad.keys.s || pad.keys.arrowdown)) {
        return fighterAimNorm(g.player).ny;
      }
    }
  } catch (_) {}
  return null;
}

function aimTutorialLayout() {
  const ui = typeof touchUiScale === 'function' ? touchUiScale(W, H) : 1;
  const joy = aimTutJoyPos();
  const portrait = H > W * 1.05;
  const cardW = Math.min(W - 20, portrait ? 420 : 460);
  const cardH = Math.min(portrait ? H * 0.42 : H * 0.58, Math.round(292 * Math.max(0.9, Math.min(ui, 1.05))));
  let cardX = Math.round((W - cardW) / 2);
  let cardY = Math.round(Math.max(12, Math.min(H * 0.1, joy.y - cardH - 28)));
  if (cardY + cardH > joy.y - 36) {
    cardX = Math.round(Math.min(W - cardW - 10, Math.max(10, joy.x + 70)));
    cardY = Math.round(Math.max(10, (H - cardH) * 0.12));
  }
  const btnH = Math.max(44, Math.round(46 * ui));
  const gotW = Math.min(cardW - 28, 220);
  const gotX = cardX + (cardW - gotW) / 2;
  const gotY = cardY + cardH - btnH - 12;
  const skipW = Math.max(72, Math.round(88 * ui));
  const skipH = Math.max(28, Math.round(30 * ui));
  const skipX = cardX + cardW - skipW - 10;
  const skipY = cardY + 8;
  return { cardX, cardY, cardW, cardH, gotX, gotY, gotW, gotH: btnH, skipX, skipY, skipW, skipH, joy, ui };
}

function pointInAimRect(x, y, r, slop) {
  if (!r) return false;
  const s = slop || 0;
  return x >= r.x - s && x <= r.x + r.w + s && y >= r.y - s && y <= r.y + r.h + s;
}

function handleAimTutorialPointer(x, y, g) {
  if (!aimTutorialActive(g)) return false;
  const lay = (g.aimTut && g.aimTut.layout) || aimTutorialLayout();
  const slop = typeof btnHitSlop === 'function' ? btnHitSlop() : 12;
  try {
    if (typeof pointInJoyZone === 'function' && typeof Input !== 'undefined' && pointInJoyZone(Input, x, y)) {
      return false;
    }
  } catch (_) {}
  if (pointInAimRect(x, y, { x: lay.gotX, y: lay.gotY, w: lay.gotW, h: lay.gotH }, slop)) {
    finishAimTutorial(g, 'gotit');
    return true;
  }
  if (pointInAimRect(x, y, { x: lay.skipX, y: lay.skipY, w: lay.skipW, h: lay.skipH }, slop + 4)) {
    finishAimTutorial(g, 'skip');
    return true;
  }
  if (pointInAimRect(x, y, { x: lay.cardX, y: lay.cardY, w: lay.cardW, h: lay.cardH }, 4)) {
    return true;
  }
  return false;
}

function handleAimTutorialKey(e) {
  try {
    if (typeof game === 'undefined' || !aimTutorialActive(game)) return false;
    const k = (e && e.key) ? String(e.key).toLowerCase() : '';
    if (k === 'escape') {
      finishAimTutorial(game, 'skip');
      return true;
    }
    if (k === 'enter' || k === ' ') {
      finishAimTutorial(game, 'gotit');
      return true;
    }
  } catch (_) {}
  return false;
}

function drawAimTutChevron(c, x, y, dir, color, scale) {
  const s = scale || 1;
  c.save();
  c.fillStyle = color;
  c.beginPath();
  if (dir < 0) {
    c.moveTo(x, y - 11 * s);
    c.lineTo(x + 10 * s, y + 5 * s);
    c.lineTo(x - 10 * s, y + 5 * s);
  } else {
    c.moveTo(x, y + 11 * s);
    c.lineTo(x + 10 * s, y - 5 * s);
    c.lineTo(x - 10 * s, y - 5 * s);
  }
  c.closePath();
  c.fill();
  c.restore();
}

/** High flyer silhouette (bat-ish) — canvas-only, no new assets. */
function drawAimTutFlyer(c, x, y, color, pulse) {
  c.save();
  c.translate(x, y);
  c.scale(1 + (pulse || 0) * 0.06, 1 + (pulse || 0) * 0.06);
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(0, 2, 7, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-7, 0);
  c.quadraticCurveTo(-22, -14, -26, 2);
  c.quadraticCurveTo(-16, -2, -7, 6);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(7, 0);
  c.quadraticCurveTo(22, -14, 26, 2);
  c.quadraticCurveTo(16, -2, 7, 6);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(10,12,20,.55)';
  c.beginPath();
  c.arc(-2.5, 0, 1.6, 0, Math.PI * 2);
  c.arc(2.5, 0, 1.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Low crawler silhouette (slug-ish). */
function drawAimTutCrawler(c, x, y, color, pulse) {
  c.save();
  c.translate(x, y);
  c.scale(1 + (pulse || 0) * 0.05, 1 + (pulse || 0) * 0.05);
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(0, 6, 22, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(-10, 1, 8, 7, -0.3, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-14, -4);
  c.quadraticCurveTo(-16, -16, -12, -20);
  c.moveTo(-8, -4);
  c.quadraticCurveTo(-8, -14, -4, -18);
  c.stroke();
  c.fillStyle = '#7cf5ff';
  c.beginPath();
  c.arc(-12, -20, 2.2, 0, Math.PI * 2);
  c.arc(-4, -18, 2.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawAimTutMiniBar(c, cx, cy, ny, ui) {
  const h = 72 * ui;
  const x = Math.round(cx);
  c.save();
  c.strokeStyle = 'rgba(232,240,255,.35)';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(cx, cy, 22 * ui, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = 'rgba(232,240,255,.22)';
  c.beginPath();
  c.arc(cx + 2, cy + ny * 14, 9 * ui, 0, Math.PI * 2);
  c.fill();
  const barX = x + 30;
  c.fillStyle = 'rgba(255,255,255,.16)';
  c.fillRect(barX, cy - h / 2, 5, h);
  const ay = cy + ny * (h / 2 - 6);
  c.fillStyle = ny < -0.18 ? '#7cf5ff' : (ny > 0.18 ? '#ffb06a' : '#e8f0ff');
  c.fillRect(barX - 3, ay - 5, 11, 10);
  drawAimTutChevron(c, cx, cy - 34 * ui, -1, '#7cf5ff', ui);
  drawAimTutChevron(c, cx, cy + 34 * ui, 1, '#ffb06a', ui);
  c.restore();
}

function drawAimTutorial(c, g) {
  if (!c || !aimTutorialActive(g)) return;
  const lay = aimTutorialLayout();
  g.aimTut.layout = lay;
  const { cardX, cardY, cardW, cardH, gotX, gotY, gotW, gotH, skipX, skipY, skipW, skipH, joy, ui } = lay;
  const liveNy = aimTutLiveNy(g);
  const ny = liveNy != null ? liveNy : (g.aimTut.demoNy || 0);
  const highOn = ny < -0.2;
  const lowOn = ny > 0.2;
  const pulse = (typeof motionReduced === 'function' && motionReduced()) ? 0 : (0.5 + Math.sin((g.aimTut.t || 0) * 5) * 0.5);
  const title = aimTutorialTxt('title', 'AIM WITH THE MOVE BAR');
  const body = aimTutorialTxt('body', 'Drag the bar up or down to hit high and low monsters.');
  const high = aimTutorialTxt('high', 'HIGH');
  const low = aimTutorialTxt('low', 'LOW');
  const tryLine = aimTutorialTxt('try', 'Try it: drag up and down');
  const got = aimTutorialTxt('gotIt', 'Got it');
  const skip = aimTutorialTxt('skip', 'Skip');
  const touchPads = typeof useTouchFightPads === 'function' ? useTouchFightPads() : (typeof IS_TOUCH !== 'undefined' && IS_TOUCH);
  const kb = touchPads ? '' : aimTutorialTxt('kbHint', 'W/↑ high · S/↓ low · Enter = continue');

  c.save();
  c.globalAlpha = 0.42;
  c.fillStyle = '#060814';
  c.fillRect(0, 0, W, H);
  c.restore();

  // Spotlight the real move bar (joystick + vertical aim ticks).
  c.save();
  const ring = Math.round(58 * ui);
  c.globalAlpha = 0.22 + pulse * 0.16;
  c.strokeStyle = '#ffd75e';
  c.lineWidth = 4;
  c.beginPath();
  c.arc(joy.x, joy.y, ring + 8 + pulse * 4, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 0.9;
  drawAimTutChevron(c, joy.x, joy.y - ring - 16, -1, '#7cf5ff', 1.35 * ui);
  drawAimTutChevron(c, joy.x, joy.y + ring + 16, 1, '#ffb06a', 1.35 * ui);
  c.font = '900 ' + Math.round(11 * ui) + 'px -apple-system, sans-serif';
  c.textAlign = 'center';
  c.fillStyle = '#7cf5ff';
  c.fillText(high, joy.x, joy.y - ring - 28);
  c.fillStyle = '#ffb06a';
  c.fillText(low, joy.x, joy.y + ring + 36);
  c.restore();

  c.save();
  c.globalAlpha = 0.94;
  c.fillStyle = '#1a2030';
  aimTutRoundRect(c, cardX, cardY, cardW, cardH, 14);
  c.fill();
  c.strokeStyle = 'rgba(255,215,94,.55)';
  c.lineWidth = 2;
  aimTutRoundRect(c, cardX, cardY, cardW, cardH, 14);
  c.stroke();

  c.fillStyle = 'rgba(255,255,255,.08)';
  aimTutRoundRect(c, skipX, skipY, skipW, skipH, 8);
  c.fill();
  c.font = '700 ' + Math.round(12 * ui) + 'px -apple-system, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#9db1e3';
  c.fillText(skip, skipX + skipW / 2, skipY + skipH / 2);

  c.textBaseline = 'alphabetic';
  c.fillStyle = '#ffd75e';
  const titleSize = cardW < 320 ? 16 : 18;
  c.font = '900 ' + titleSize + 'px -apple-system, sans-serif';
  c.textAlign = 'center';
  const titleLines = aimTutWrap(c, title, cardW - 36);
  let ty = cardY + skipH + 28;
  for (const line of titleLines.slice(0, 2)) {
    c.fillText(line, cardX + cardW / 2, ty);
    ty += titleSize + 5;
  }

  c.fillStyle = '#e8f0ff';
  c.font = '600 14px -apple-system, sans-serif';
  const bodyLines = aimTutWrap(c, body, cardW - 32);
  ty += 8;
  for (const line of bodyLines.slice(0, 3)) {
    c.fillText(line, cardX + cardW / 2, ty);
    ty += 18;
  }

  const visY = ty + 28;
  const midX = cardX + cardW * 0.28;
  drawAimTutMiniBar(c, midX, visY + 8, ny, Math.max(0.85, ui));
  const foeX = cardX + cardW * 0.68;
  c.globalAlpha = highOn ? 1 : 0.38;
  drawAimTutFlyer(c, foeX, visY - 18, '#7cf5ff', highOn ? pulse : 0);
  c.globalAlpha = 1;
  c.fillStyle = highOn ? '#7cf5ff' : '#9db1e3';
  c.font = '900 12px -apple-system, sans-serif';
  c.fillText(high, foeX + 36, visY - 14);
  c.globalAlpha = lowOn ? 1 : 0.38;
  drawAimTutCrawler(c, foeX, visY + 42, '#ffb06a', lowOn ? pulse : 0);
  c.globalAlpha = 1;
  c.fillStyle = lowOn ? '#ffb06a' : '#9db1e3';
  c.fillText(low, foeX + 36, visY + 48);

  c.fillStyle = '#ffd75e';
  c.font = '600 13px -apple-system, sans-serif';
  const tryY = gotY - 16;
  c.fillText(tryLine, cardX + cardW / 2, tryY);
  if (kb) {
    c.fillStyle = '#9db1e3';
    c.font = '600 11px -apple-system, sans-serif';
    c.fillText(kb, cardX + cardW / 2, tryY + 14);
  }

  c.fillStyle = '#ffd75e';
  aimTutRoundRect(c, gotX, gotY, gotW, gotH, 12);
  c.fill();
  c.fillStyle = '#1a1408';
  c.font = '900 16px -apple-system, sans-serif';
  c.textBaseline = 'middle';
  c.fillText(got, gotX + gotW / 2, gotY + gotH / 2);
  c.restore();
}
