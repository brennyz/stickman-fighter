#!/usr/bin/env node
/**
 * PLAYTEST BOT 3/9 — landscape combat findings harness.
 * LIVE main c9a29fc v1.18.190 SW400. No Versus.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-playtest-landscape-combat';
fs.mkdirSync(outDir, { recursive: true });

function note(findings, sev, id, title, detail) {
  findings.push({ sev, id, title, detail });
}

async function getPuppeteer() {
  const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
  if (!chrome) throw new Error('no chrome');
  try {
    return { puppeteer: await import('puppeteer-core'), chrome };
  } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer-core'))));
    });
    return {
      puppeteer: await import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')),
      chrome,
    };
  }
}

/** Runs in page. Start a mode and snapshot camera/floor/pads. */
function pageEvalSnap(mode) {
  try {
    const splash = document.getElementById('sfSplash');
    if (splash) { splash.hidden = true; splash.style.display = 'none'; }
  } catch (_) {}
  try {
    if (typeof save !== 'undefined' && save) {
      save.tipsSeen = save.tipsSeen || {};
      save.tipsSeen.moveBarAim = 1;
      save.showTouchPads = true;
    }
  } catch (_) {}
  try { startGame(mode, { level: 1, gamble: null }); } catch (e) { return { ok: false, why: 'start:' + e }; }
  try { if (typeof forceGameResize === 'function') forceGameResize(); } catch (e) { return { ok: false, why: 'resize:' + e }; }
  const g = game;
  if (!g || !g.player) return { ok: false, why: 'no game' };
  try { g.inputLocked = false; g.partGate = null; g.traveling = false; } catch (_) {}
  try { Input.suppressUntil = 0; Input.dualMode = false; } catch (_) {}
  try { if (ctx && typeof g.draw === 'function') g.draw(ctx); } catch (e) { return { ok: false, why: 'draw:' + e }; }
  const snap = (typeof combatViewAlign === 'function') ? combatViewAlign(g) : {};
  const raw = (Input && Input.buttons) || [];
  const byId = {};
  for (const b of raw) {
    byId[b.id] = {
      id: b.id, x: Math.round(b.x), y: Math.round(b.y), r: Math.round(b.r),
      d: Math.round(b.r * 2), bottomGap: Math.round(H - (b.y + b.r)),
      rightGap: Math.round(W - (b.x + b.r)), leftGap: Math.round(b.x - b.r),
    };
  }
  let overlaps = 0;
  for (let i = 0; i < raw.length; i++) {
    for (let k = i + 1; k < raw.length; k++) {
      if (Math.hypot(raw[i].x - raw[k].x, raw[i].y - raw[k].y) < raw[i].r + raw[k].r - 1) overlaps++;
    }
  }
  const dpr = (typeof DPR === 'number' && DPR > 0) ? DPR : 1;
  let floorPx = null, bodyPx = null;
  try {
    const fx = Math.round(Math.min(W - 2, Math.max(1, g.player.x)) * dpr);
    const fy = Math.round(Math.min(H - 2, Math.max(1, g.ground + 3)) * dpr);
    const fp = ctx.getImageData(fx, fy, 1, 1).data;
    floorPx = { r: fp[0], g: fp[1], b: fp[2], a: fp[3], lum: fp[0] + fp[1] + fp[2] };
    const by = Math.round(Math.min(H - 2, Math.max(1, g.player.y - 36)) * dpr);
    const bp = ctx.getImageData(fx, by, 1, 1).data;
    bodyPx = { r: bp[0], g: bp[1], b: bp[2], a: bp[3], lum: bp[0] + bp[1] + bp[2] };
  } catch (_) {}
  return Object.assign({
    ok: true, mode: g.mode, theme: g.theme, t: g.t,
    phoneLand: (typeof touchPhoneLandscape === 'function') ? touchPhoneLandscape(W, H) : null,
    compact: (typeof combatDensityIsCompact === 'function') ? combatDensityIsCompact(W, H) : null,
    buttons: byId, overlaps,
    joy: Input && Input.joyHome ? { x: Math.round(Input.joyHome.x), y: Math.round(Input.joyHome.y) } : null,
    hud: (typeof hudSafeLayout === 'function') ? hudSafeLayout(W, H, g.mode) : null,
    floorPx, bodyPx,
    robot: g.robot ? { x: Math.round(g.robot.x), y: Math.round(g.robot.y) } : null,
    y: g.player.y, vy: g.player.vy, onGround: g.player.onGround,
  }, snap);
}

function resizeAndSnap() {
  try { if (typeof forceGameResize === 'function') forceGameResize(); } catch (e) { return { ok: false, why: 'resize:' + e }; }
  const g = game;
  if (!g || !g.player) return { ok: false, why: 'no game' };
  try { if (ctx && typeof g.draw === 'function') g.draw(ctx); } catch (e) { return { ok: false, why: 'draw:' + e }; }
  const snap = (typeof combatViewAlign === 'function') ? combatViewAlign(g) : {};
  const raw = (Input && Input.buttons) || [];
  const byId = {};
  for (const b of raw) {
    byId[b.id] = {
      id: b.id, x: Math.round(b.x), y: Math.round(b.y), r: Math.round(b.r),
      d: Math.round(b.r * 2), bottomGap: Math.round(H - (b.y + b.r)),
      rightGap: Math.round(W - (b.x + b.r)), leftGap: Math.round(b.x - b.r),
    };
  }
  let overlaps = 0;
  for (let i = 0; i < raw.length; i++) {
    for (let k = i + 1; k < raw.length; k++) {
      if (Math.hypot(raw[i].x - raw[k].x, raw[i].y - raw[k].y) < raw[i].r + raw[k].r - 1) overlaps++;
    }
  }
  const dpr = (typeof DPR === 'number' && DPR > 0) ? DPR : 1;
  let floorPx = null, bodyPx = null;
  try {
    const fx = Math.round(Math.min(W - 2, Math.max(1, g.player.x)) * dpr);
    const fy = Math.round(Math.min(H - 2, Math.max(1, g.ground + 3)) * dpr);
    const fp = ctx.getImageData(fx, fy, 1, 1).data;
    floorPx = { r: fp[0], g: fp[1], b: fp[2], a: fp[3], lum: fp[0] + fp[1] + fp[2] };
    const by = Math.round(Math.min(H - 2, Math.max(1, g.player.y - 36)) * dpr);
    const bp = ctx.getImageData(fx, by, 1, 1).data;
    bodyPx = { r: bp[0], g: bp[1], b: bp[2], a: bp[3], lum: bp[0] + bp[1] + bp[2] };
  } catch (_) {}
  return Object.assign({
    ok: true, mode: g.mode, theme: g.theme, t: g.t,
    phoneLand: (typeof touchPhoneLandscape === 'function') ? touchPhoneLandscape(W, H) : null,
    compact: (typeof combatDensityIsCompact === 'function') ? combatDensityIsCompact(W, H) : null,
    buttons: byId, overlaps,
    joy: Input && Input.joyHome ? { x: Math.round(Input.joyHome.x), y: Math.round(Input.joyHome.y) } : null,
    hud: (typeof hudSafeLayout === 'function') ? hudSafeLayout(W, H, g.mode) : null,
    floorPx, bodyPx,
    robot: g.robot ? { x: Math.round(g.robot.x), y: Math.round(g.robot.y) } : null,
    y: g.player.y, vy: g.player.vy, onGround: g.player.onGround,
  }, snap);
}

function packSnap(g) {
  const snap = (typeof combatViewAlign === 'function') ? combatViewAlign(g) : {};
  const raw = (Input && Input.buttons) || [];
  const btns = raw.map((b) => ({
    id: b.id, x: Math.round(b.x), y: Math.round(b.y), r: Math.round(b.r),
    d: Math.round(b.r * 2),
    bottomGap: Math.round(H - (b.y + b.r)),
    rightGap: Math.round(W - (b.x + b.r)),
    leftGap: Math.round(b.x - b.r),
    top: Math.round(b.y - b.r),
  }));
  const byId = {};
  for (const b of btns) byId[b.id] = b;
  let overlaps = 0;
  for (let i = 0; i < raw.length; i++) {
    for (let k = i + 1; k < raw.length; k++) {
      if (Math.hypot(raw[i].x - raw[k].x, raw[i].y - raw[k].y) < raw[i].r + raw[k].r - 1) overlaps++;
    }
  }
  const dpr = (typeof DPR === 'number' && DPR > 0) ? DPR : 1;
  const sample = (gx, gy) => {
    try {
      const x = Math.round(Math.min(W - 2, Math.max(1, gx)) * dpr);
      const y = Math.round(Math.min(H - 2, Math.max(1, gy)) * dpr);
      const px = ctx.getImageData(x, y, 1, 1).data;
      return { r: px[0], g: px[1], b: px[2], a: px[3], lum: px[0] + px[1] + px[2] };
    } catch (_) { return null; }
  };
  return Object.assign({
    ok: true,
    mode: g.mode,
    theme: g.theme,
    t: g.t,
    phoneLand: (typeof touchPhoneLandscape === 'function') ? touchPhoneLandscape(W, H) : null,
    compact: (typeof combatDensityIsCompact === 'function') ? combatDensityIsCompact(W, H) : null,
    buttons: byId,
    overlaps,
    joy: Input && Input.joyHome ? { x: Math.round(Input.joyHome.x), y: Math.round(Input.joyHome.y) } : null,
    hud: (typeof hudSafeLayout === 'function') ? hudSafeLayout(W, H, g.mode) : null,
    floorPx: sample(g.player.x, g.ground + 3),
    bodyPx: sample(g.player.x, g.player.y - 36),
    robot: g.robot ? { x: Math.round(g.robot.x), y: Math.round(g.robot.y) } : null,
    y: g.player.y,
    vy: g.player.vy,
    onGround: g.player.onGround,
  }, snap);
}

function firePadInPage(action) {
  const g = game;
  if (!g || !g.player) return { ok: false, why: 'no game' };
  g.inputLocked = false;
  g.player.attack = null;
  g.player.state = 'idle';
  g.player.invulnT = 0;
  g.player.hurtT = 0;
  Input.suppressUntil = 0;
  Input.pressed = {};
  Input.joy.active = false;
  const btn = (Input.buttons || []).find((b) => b.id === action);
  if (!btn) return { ok: false, why: 'no btn ' + action };
  try {
    Input.onDown(btn.x, btn.y, 900 + action.length);
    Input.onUp(900 + action.length);
    g.update(1 / 30);
  } catch (e) {
    return { ok: false, why: 'fire:' + e, threw: true };
  }
  return {
    ok: true,
    action,
    kind: g.player.attack && g.player.attack.kind,
    state: g.player.state,
    onGround: g.player.onGround,
    y: Math.round(g.player.y),
    ground: Math.round(g.ground),
    vy: g.player.vy,
    pressed: !!(Input.pressed && Input.pressed[action]),
  };
}

function judgeView(label, snap, findings, opts) {
  opts = opts || {};
  if (!snap || !snap.ok) {
    note(findings, 'P0', label + '-eval', label + ' evaluate failed', snap && snap.why);
    return;
  }
  if (Math.abs(snap.w - snap.vpW) > 2 || Math.abs(snap.h - snap.vpH) > 2) {
    note(findings, 'P0', label + '-wh', label + ' W/H != visual viewport', { w: snap.w, h: snap.h, vpW: snap.vpW, vpH: snap.vpH });
  }
  if (snap.letterbox && snap.letterbox.dead) {
    note(findings, 'P0', label + '-letterbox', label + ' letterbox dead zone', snap.letterbox);
  }
  if (!(snap.ground > 8 && snap.ground < snap.h)) {
    note(findings, 'P0', label + '-ground', label + ' ground off canvas', { ground: snap.ground, h: snap.h });
  }
  if (!snap.player) {
    note(findings, 'P0', label + '-player', label + ' no player');
  } else {
    if (snap.player.x < 0 || snap.player.x > snap.w) note(findings, 'P0', label + '-px', label + ' player X dead zone', snap.player);
    if (snap.player.y <= 8 || snap.player.y > snap.h + 1) note(findings, 'P0', label + '-py', label + ' player Y dead zone', snap.player);
    if (Math.abs(snap.player.y - snap.ground) > 8 && !opts.allowAir && snap.onGround !== false) {
      note(findings, 'P0', label + '-floor', label + ' player not on floor', { player: snap.player, ground: snap.ground, onGround: snap.onGround });
    } else if (snap.onGround === false && snap.player.y > 8 && snap.player.y < snap.h) {
      note(findings, 'P2', label + '-air', label + ' player airborne after rotate (still on canvas)', { player: snap.player, ground: snap.ground });
    }
  }
  if (snap.aligned === false) note(findings, 'P0', label + '-align', label + ' combatViewAlign.aligned=false', { aligned: snap.aligned, letterbox: snap.letterbox });
  if (snap.floorPx && snap.floorPx.a < 10) note(findings, 'P0', label + '-floor-a', label + ' floor pixel transparent', snap.floorPx);
  if (snap.floorPx && snap.floorPx.lum < 12) note(findings, 'P1', label + '-floor-black', label + ' floor pixel near-black', snap.floorPx);
  if (snap.bodyPx && snap.bodyPx.lum < 20 && snap.bodyPx.a > 10) {
    note(findings, 'P1', label + '-body-dark', label + ' player body pixel very dark', snap.bodyPx);
  }
  const punch = snap.buttons && snap.buttons.punch;
  const jump = snap.buttons && snap.buttons.jump;
  if (!punch || !jump) {
    note(findings, 'P0', label + '-pads', label + ' missing punch/jump', snap.buttons);
  } else {
    if (punch.d < 44) note(findings, 'P0', label + '-punch-44', label + ' punch <44px', punch);
    if (jump.d < 44) note(findings, 'P0', label + '-jump-44', label + ' jump <44px', jump);
    if (punch.bottomGap < 18) note(findings, 'P1', label + '-punch-nav', label + ' punch in gesture strip', punch);
    if (jump.bottomGap < 18) note(findings, 'P1', label + '-jump-nav', label + ' jump in gesture strip', jump);
    if (punch.rightGap < -1 || punch.leftGap < -1) note(findings, 'P0', label + '-punch-off', label + ' punch off-screen', punch);
    if (jump.rightGap < -1 || jump.leftGap < -1) note(findings, 'P0', label + '-jump-off', label + ' jump off-screen', jump);
    if (snap.hud && snap.hud.pause) {
      const p = snap.hud.pause;
      const hits = (b) => b.x + b.r > p.x && b.x - b.r < p.x + p.w && b.y + b.r > p.y && b.y - b.r < p.y + p.h;
      if (hits(punch)) note(findings, 'P0', label + '-punch-pause', label + ' punch overlaps pause', { punch, pause: p });
      if (hits(jump)) note(findings, 'P0', label + '-jump-pause', label + ' jump overlaps pause', { jump, pause: p });
    }
    if (snap.phoneLand && !(jump.x > punch.x)) note(findings, 'P1', label + '-thumb-order', label + ' phone-land jump not right of punch', { jump, punch });
    if (snap.phoneLand && punch.x < snap.w * 0.52) note(findings, 'P1', label + '-punch-thumb', label + ' punch not in right-thumb half', punch);
  }
  if (snap.overlaps > 0) note(findings, 'P0', label + '-overlap', label + ' overlapping pads', { overlaps: snap.overlaps });
  if (snap.joy && snap.h <= 500 && snap.joy.y + 40 > snap.h - 16) {
    note(findings, 'P1', label + '-joy-nav', label + ' joy sits in system nav', snap.joy);
  }
}

function summarize(snap) {
  if (!snap) return null;
  if (snap.ok === false) return snap;
  return {
    ok: snap.ok, mode: snap.mode, w: snap.w, h: snap.h,
    ground: snap.ground != null ? Math.round(snap.ground) : null,
    player: snap.player, aligned: snap.aligned, letterbox: snap.letterbox,
    phoneLand: snap.phoneLand, compact: snap.compact,
    punch: snap.buttons && snap.buttons.punch,
    jump: snap.buttons && snap.buttons.jump,
    joy: snap.joy,
    floorLum: snap.floorPx && snap.floorPx.lum,
    bodyLum: snap.bodyPx && snap.bodyPx.lum,
    t: snap.t, theme: snap.theme, robot: snap.robot,
    onGround: snap.onGround, y: snap.y,
  };
}

async function run() {
  const findings = [];
  const cases = {};
  let server = null;
  try { server = await ensureSmokeServer(8791); } catch (_) {}

  const { puppeteer, chrome } = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=844,390'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const base = (process.argv[2] || smokeBaseUrl(8791)).replace(/#.*$/, '');
  const url = base.includes('?') ? `${base}&nosplash=1` : `${base}?nosplash=1`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const views = [
    { id: 'phone-se-land', w: 667, h: 375, mobile: true },
    { id: 'phone-844x390', w: 844, h: 390, mobile: true },
    { id: 'pixel-land', w: 915, h: 412, mobile: true },
    { id: 'plus-land', w: 736, h: 414, mobile: true },
    { id: 'ipad-land', w: 1180, h: 820, mobile: true },
    { id: 'desk-1280', w: 1280, h: 720, mobile: false },
  ];

  for (const v of views) {
    await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 2, isMobile: v.mobile, hasTouch: true, isLandscape: true });
    const snap = await page.evaluate(pageEvalSnap, 'adventure');
    cases[v.id] = snap;
    judgeView(v.id, snap, findings);
    const punch = await page.evaluate(firePadInPage, 'punch');
    const jump = await page.evaluate(firePadInPage, 'jump');
    cases[v.id + '-punch'] = punch;
    cases[v.id + '-jump'] = jump;
    if (!punch || !punch.ok || punch.threw) note(findings, 'P0', v.id + '-punch-fire', v.id + ' punch tap failed', punch);
    else if (punch.kind !== 'punch' && !punch.pressed) note(findings, 'P0', v.id + '-punch-kind', v.id + ' punch tap did not start punch', punch);
    if (!jump || !jump.ok || jump.threw) note(findings, 'P0', v.id + '-jump-fire', v.id + ' jump tap failed', jump);
    else if (jump.onGround === true && Math.abs((jump.y || 0) - (jump.ground || 0)) < 2 && !(jump.vy < -10) && !jump.pressed) {
      note(findings, 'P0', v.id + '-jump-kind', v.id + ' jump tap did not leave ground', jump);
    }
    try { await page.screenshot({ path: path.join(outDir, v.id + '.png'), fullPage: false }); } catch (_) {}
  }

  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
  const train = await page.evaluate(pageEvalSnap, 'training');
  cases.training = train;
  judgeView('training-844x390', train, findings);
  const trainPunch = await page.evaluate(firePadInPage, 'punch');
  cases.trainingPunch = trainPunch;
  if (!trainPunch || trainPunch.kind !== 'punch') note(findings, 'P0', 'train-punch', 'Training landscape punch did not start', trainPunch);
  if (train.robot && Math.abs(train.robot.y - train.ground) > 10) note(findings, 'P1', 'train-robot-floor', 'Training robot not on floor', train.robot);
  try { await page.screenshot({ path: path.join(outDir, 'training-844x390.png'), fullPage: false }); } catch (_) {}

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false });
  const midSetup = await page.evaluate(() => {
    try {
      if (save) { save.tipsSeen = save.tipsSeen || {}; save.tipsSeen.moveBarAim = 1; save.showTouchPads = true; }
      startGame('adventure', { level: 1, gamble: null });
      forceGameResize();
    } catch (e) { return { ok: false, why: 'mid-start:' + e }; }
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no mid game' };
    try { Input.keys = Input.keys || {}; Input.keys.d = true; g.inputLocked = false; } catch (_) {}
    for (let i = 0; i < 54; i++) {
      try { g.update(1 / 30); } catch (e) { return { ok: false, why: 'mid-update:' + e }; }
    }
    return { ok: true, t: g.t, x: g.player.x, y: g.player.y, ground: g.ground };
  });
  cases.midSetup = midSetup;
  if (!midSetup || !midSetup.ok || !(midSetup.t > 0.4)) note(findings, 'P0', 'mid-setup', 'mid-fight setup failed', midSetup);

  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
  const midLand = await page.evaluate(resizeAndSnap);
  cases.midPortraitToLand = midLand;
  judgeView('mid-port→land', midLand, findings);
  const midPunch = await page.evaluate(firePadInPage, 'punch');
  const midJump = await page.evaluate(firePadInPage, 'jump');
  cases.midPunch = midPunch;
  cases.midJump = midJump;
  if (!midPunch || (midPunch.kind !== 'punch' && !midPunch.pressed)) note(findings, 'P0', 'mid-punch', 'After mid-fight rotate, punch tap failed', midPunch);
  if (!midJump || midJump.threw) note(findings, 'P0', 'mid-jump', 'After mid-fight rotate, jump tap threw', midJump);
  try { await page.screenshot({ path: path.join(outDir, 'mid-port-to-land.png'), fullPage: false }); } catch (_) {}

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false });
  const midPort = await page.evaluate(resizeAndSnap);
  cases.midLandToPort = midPort;
  judgeView('mid-land→port', midPort, findings);
  try { await page.screenshot({ path: path.join(outDir, 'mid-land-to-port.png'), fullPage: false }); } catch (_) {}

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false });
  const airSetup = await page.evaluate(() => {
    try { startGame('adventure', { level: 1, gamble: null }); forceGameResize(); } catch (e) { return { ok: false, why: String(e) }; }
    const g = game;
    g.inputLocked = false;
    Input.suppressUntil = 0;
    Input.press('jump');
    for (let i = 0; i < 8; i++) g.update(1 / 30);
    return { ok: true, y: g.player.y, ground: g.ground, vy: g.player.vy, onGround: g.player.onGround };
  });
  cases.airSetup = airSetup;
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
  const airRot = await page.evaluate(resizeAndSnap);
  cases.airRotate = airRot;
  if (airRot && airRot.ok) {
    if (airRot.player && (airRot.player.y <= 8 || airRot.player.y > airRot.h + 1)) {
      note(findings, 'P0', 'air-off', 'Airborne rotate put player off canvas', airRot.player);
    }
    if (airSetup && airSetup.ok && airSetup.vy < -20 && airRot.onGround === true && Math.abs(airRot.y - airRot.ground) < 2) {
      note(findings, 'P2', 'air-snap', 'Mid-jump rotate snaps fighter to new floor (cancels hop)', { before: airSetup, after: { y: airRot.y, ground: airRot.ground, onGround: airRot.onGround } });
    }
  }
  try { await page.screenshot({ path: path.join(outDir, 'airborne-rotate.png'), fullPage: false }); } catch (_) {}

  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
  const cyber = await page.evaluate(() => {
    try {
      startGame('adventure', { level: 13, gamble: null });
      forceGameResize();
      game.draw(ctx);
    } catch (e) { return { ok: false, why: String(e) }; }
    const g = game;
    const snap = (typeof combatViewAlign === 'function') ? combatViewAlign(g) : {};
    const raw = (Input && Input.buttons) || [];
    const byId = {};
    for (const b of raw) byId[b.id] = { id: b.id, x: Math.round(b.x), y: Math.round(b.y), r: Math.round(b.r), d: Math.round(b.r * 2), bottomGap: Math.round(H - (b.y + b.r)), rightGap: Math.round(W - (b.x + b.r)), leftGap: Math.round(b.x - b.r) };
    return Object.assign({ ok: true, mode: g.mode, theme: g.theme, buttons: byId, phoneLand: true }, snap);
  });
  cases.cyber = cyber;
  judgeView('cyber-844x390', cyber, findings);
  try { await page.screenshot({ path: path.join(outDir, 'cyber-844x390.png'), fullPage: false }); } catch (_) {}

  if (pageErrors.length) note(findings, 'P0', 'pageerror', 'pageerror during landscape playtest', pageErrors.slice(0, 3));

  await browser.close();
  if (server && server.close) try { server.close(); } catch (_) {}

  const p0 = findings.filter((f) => f.sev === 'P0');
  const p1 = findings.filter((f) => f.sev === 'P1');
  const p2 = findings.filter((f) => f.sev === 'P2');
  const report = {
    ok: p0.length === 0,
    bot: 'playtest-3-9-landscape-combat',
    build: { sha: 'c9a29fc', version: '1.18.190', sw: 400 },
    counts: { P0: p0.length, P1: p1.length, P2: p2.length, all: findings.length },
    findings,
    cases: {
      'phone-844x390': summarize(cases['phone-844x390']),
      'phone-se-land': summarize(cases['phone-se-land']),
      'pixel-land': summarize(cases['pixel-land']),
      'plus-land': summarize(cases['plus-land']),
      'ipad-land': summarize(cases['ipad-land']),
      'desk-1280': summarize(cases['desk-1280']),
      training: summarize(cases.training),
      midPortraitToLand: summarize(cases.midPortraitToLand),
      midLandToPort: summarize(cases.midLandToPort),
      airSetup: cases.airSetup,
      airRotate: summarize(cases.airRotate),
      cyber: summarize(cases.cyber),
      midPunch: cases.midPunch,
      midJump: cases.midJump,
      punch844: cases['phone-844x390-punch'],
      jump844: cases['phone-844x390-jump'],
    },
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (p0.length) {
    console.error('PLAYTEST_P0', p0.map((f) => f.id).join(','));
    process.exit(2);
  }
  console.log('PLAYTEST_OK landscape-combat bot 3/9 — no P0');
}

run().catch((e) => {
  console.error('PLAYTEST_FAIL', e && e.stack || e);
  process.exit(1);
});
