#!/usr/bin/env node
/**
 * Mobile fight buttons — two regressions guarded here.
 *
 * 1. Adventure tags the player rosterId 'hero'. vsRosterEntry() is a null stub
 *    after versus retire; combatEntryFor dereferenced that null inside
 *    attackSpec, so punch/weapon/kick threw every frame (joystick still moved).
 * 2. touchUiScale folded a W/H aspect term into portrait, pinning tall phones
 *    to the scale floor: 36px buttons hugging the bottom gesture strip.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-touch-buttons';
fs.mkdirSync(outDir, { recursive: true });
const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('SMOKE_FAIL no chrome'); process.exit(1); }

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8788); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.emulate({
    viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const base = process.argv[2] || smokeBaseUrl(8788);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const errors = [];
    const note = (label, e) => errors.push(label + ':' + (e && e.message ? e.message : e));

    let profile = null;
    try {
      profile = combatEntryFor({ rosterId: 'hero', isPlayer: true });
    } catch (e) {
      return { ok: false, why: 'combatEntryFor(hero) threw', err: String(e) };
    }
    if (!profile || typeof profile.crit !== 'number') {
      return { ok: false, why: 'combatEntryFor(hero) missing crit', profile };
    }

    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    if (!g || !g.player) return { ok: false, why: 'no game' };

    g.inputLocked = false;
    g.partGate = null;
    g.traveling = false;
    g.over = false;
    g.player.invulnT = 0;
    g.player.hurtT = 0;
    g.player.attack = null;
    g.player.state = 'idle';
    Input.suppressUntil = 0;
    Input.dualMode = false;
    if (typeof Input.layout === 'function') Input.layout(W, H);

    const ids = (Input.buttons || []).map((b) => b.id);
    const need = ['punch', 'weapon', 'kick'];
    const missingBtns = need.filter((id) => !ids.includes(id));

    // Reachability: 44px minimum target, clear of the bottom gesture strip.
    const MIN_DIAMETER = 44;
    const MIN_BOTTOM_GAP = 18;
    const layout = (Input.buttons || []).map((b) => ({
      id: b.id,
      diameter: Math.round(b.r * 2),
      bottomGap: Math.round(H - (b.y + b.r)),
      rightGap: Math.round(W - (b.x + b.r)),
    }));
    const tooSmall = layout.filter((b) => b.diameter < MIN_DIAMETER).map((b) => b.id + ':' + b.diameter);
    const tooLow = layout.filter((b) => b.bottomGap < MIN_BOTTOM_GAP).map((b) => b.id + ':' + b.bottomGap);
    const offScreen = layout.filter((b) => b.rightGap < -1).map((b) => b.id + ':' + b.rightGap);

    const overlaps = [];
    const btns = Input.buttons || [];
    for (let i = 0; i < btns.length; i++) {
      for (let k = i + 1; k < btns.length; k++) {
        const a = btns[i];
        const b = btns[k];
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 1) overlaps.push(a.id + '/' + b.id);
      }
    }

    const fire = (action) => {
      g.player.attack = null;
      g.player.state = 'idle';
      g.player.invulnT = 0;
      Input.suppressUntil = 0;
      Input.pressed = {};
      const btn = (Input.buttons || []).find((b) => b.id === action);
      try {
        if (btn) {
          Input.onDown(btn.x, btn.y, 700 + action.length);
          Input.onUp(700 + action.length);
        } else {
          Input.press(action);
        }
      } catch (e) {
        note(action + '.down', e);
        return { kind: null, threw: true };
      }
      try {
        g.update(1 / 30);
      } catch (e) {
        note(action + '.update', e);
        return { kind: null, threw: true };
      }
      return {
        kind: g.player.attack && g.player.attack.kind,
        threw: false,
        pressedLeft: !!(Input.pressed && Input.pressed[action]),
      };
    };

    const punch = fire('punch');
    const kick = fire('kick');
    const weapon = fire('weapon');

    // Canvas-coord path: punch button mapped through pointerGameCoords identity
    let canvasPunch = { kind: null, threw: false };
    try {
      g.player.attack = null;
      g.player.state = 'idle';
      g.player.invulnT = 0;
      Input.suppressUntil = 0;
      Input.pressed = {};
      const punchBtn = (Input.buttons || []).find((b) => b.id === 'punch');
      if (punchBtn && typeof pointerGameCoords === 'function' && canvas) {
        const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
        const clientX = rect.left + (punchBtn.x / Math.max(1, W)) * (rect.width || W);
        const clientY = rect.top + (punchBtn.y / Math.max(1, H)) * (rect.height || H);
        const p = pointerGameCoords(clientX, clientY);
        Input.onDown(p.x, p.y, 801);
        Input.onUp(801);
        g.update(1 / 30);
        canvasPunch = { kind: g.player.attack && g.player.attack.kind, threw: false };
      }
    } catch (e) {
      note('canvasPunch', e);
      canvasPunch = { kind: null, threw: true };
    }

    // Layout sweep — pads are a pure function of W/H, so probe more devices
    // than the one emulated viewport (phone → tall phone → landscape → iPad).
    const sweep = [];
    const probes = [
      ['iphone-se', 320, 568], ['android-small', 360, 800], ['pixel', 390, 844],
      ['iphone-max', 430, 932], ['phone-landscape', 844, 390], ['small-landscape', 568, 320],
      ['ipad-portrait', 820, 1180], ['ipad-landscape', 1180, 820],
    ];
    const realW = W;
    const realH = H;
    for (const [label, pw, ph] of probes) {
      try {
        W = pw; H = ph;
        Input.layout(pw, ph);
        const bs = Input.buttons || [];
        let minDia = Infinity;
        let minBottom = Infinity;
        let overlap = 0;
        let outside = 0;
        for (let i = 0; i < bs.length; i++) {
          minDia = Math.min(minDia, bs[i].r * 2);
          minBottom = Math.min(minBottom, ph - (bs[i].y + bs[i].r));
          if (bs[i].x + bs[i].r > pw + 1 || bs[i].x - bs[i].r < -1) outside++;
          for (let k = i + 1; k < bs.length; k++) {
            if (Math.hypot(bs[i].x - bs[k].x, bs[i].y - bs[k].y) < bs[i].r + bs[k].r - 1) overlap++;
          }
        }
        sweep.push({
          label, w: pw, h: ph,
          minDia: Math.round(minDia),
          minBottom: Math.round(minBottom),
          overlap, outside,
          ok: minDia >= MIN_DIAMETER && minBottom >= MIN_BOTTOM_GAP && overlap === 0 && outside === 0,
        });
      } catch (e) {
        sweep.push({ label, ok: false, err: String(e) });
      }
    }
    W = realW; H = realH;
    Input.layout(realW, realH);
    const sweepBad = sweep.filter((s) => !s.ok).map((s) => s.label);

    // Icon UX: punch/kick/weapon must draw distinct, high-ink glyphs (not empty/emoji fallback).
    const iconAudit = {};
    const iconFail = [];
    if (typeof drawTouchBtnIcon !== 'function') {
      iconFail.push('drawTouchBtnIcon missing');
    } else {
      const off = document.createElement('canvas');
      off.width = 72;
      off.height = 72;
      const ctx = off.getContext('2d');
      const finger = (id) => {
        ctx.clearRect(0, 0, 72, 72);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 72, 72);
        const drew = drawTouchBtnIcon(ctx, id, 36, 36, 28, 'spiral_orb');
        const data = ctx.getImageData(0, 0, 72, 72).data;
        let bright = 0;
        let hash = 0;
        for (let i = 0; i < data.length; i += 4) {
          const lum = data[i] + data[i + 1] + data[i + 2];
          if (lum > 160 && data[i + 3] > 40) bright++;
          hash = (hash * 33 + data[i] + data[i + 1] * 3 + data[i + 2] * 7) | 0;
        }
        return { drew: !!drew, bright, hash };
      };
      for (const id of ['punch', 'kick', 'weapon']) {
        iconAudit[id] = finger(id);
        if (!iconAudit[id].drew) iconFail.push(id + ':fallback');
        if (iconAudit[id].bright < 90) iconFail.push(id + ':thin:' + iconAudit[id].bright);
      }
      if (iconAudit.punch.hash === iconAudit.kick.hash) iconFail.push('punch==kick');
      if (iconAudit.punch.hash === iconAudit.weapon.hash) iconFail.push('punch==weapon');
      if (iconAudit.kick.hash === iconAudit.weapon.hash) iconFail.push('kick==weapon');
      if (typeof drawStrikeHudChip === 'function') {
        ctx.clearRect(0, 0, 72, 72);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 72, 72);
        const chipOk = drawStrikeHudChip(ctx, 'punch', 36, 36, 16);
        if (!chipOk) iconFail.push('chip:false');
      } else {
        iconFail.push('drawStrikeHudChip missing');
      }
    }

    // Cycle 6 P1: MASTER/WAVE banners stay in the top chrome; next-wave /
    // pause-ring / strike-hint pill stay above the 390px pad cluster.
    const hudAudit = {};
    const hudFail = [];
    try {
      Input.layout(W, H);
      const padTop = typeof touchClusterTopY === 'function' ? touchClusterTopY() : H;
      const b0 = typeof bannerLaneY === 'function' ? bannerLaneY(H, 0, 26) : H * 0.31;
      const b1 = typeof bannerLaneY === 'function' ? bannerLaneY(H, 1, 26) : H * 0.31;
      const b2 = typeof bannerLaneY === 'function' ? bannerLaneY(H, 2, 26) : H * 0.31;
      const bannerMax = Math.max(b0, b1, b2);
      const cap = typeof combatBannerMaxSize === 'function' ? combatBannerMaxSize(58) : 58;
      const hintY = typeof combatHintAnchorY === 'function' ? combatHintAnchorY(g, W, H) : H * 0.2;
      const ringY = typeof wavePauseRingY === 'function' ? wavePauseRingY(H) : H - 78;
      const previewY = typeof nextWavePreviewY === 'function' ? nextWavePreviewY(H) : H - 52;
      hudAudit.padTop = Math.round(padTop);
      hudAudit.bannerMax = Math.round(bannerMax);
      hudAudit.bannerCap = cap;
      hudAudit.hintY = Math.round(hintY);
      hudAudit.ringY = Math.round(ringY);
      hudAudit.previewY = Math.round(previewY);
      if (bannerMax > H * 0.22) hudFail.push('bannerMidField:' + Math.round(bannerMax));
      if (cap > 28) hudFail.push('bannerTooBig:' + cap);
      if (hintY + 16 > padTop) hudFail.push('hintOverPads:' + Math.round(hintY) + '>' + Math.round(padTop));
      if (ringY + 24 > padTop) hudFail.push('ringOverPads:' + Math.round(ringY) + '>' + Math.round(padTop));
      if (previewY + 10 > padTop) hudFail.push('previewOverPads:' + Math.round(previewY) + '>' + Math.round(padTop));
    } catch (e) {
      hudFail.push('hudAudit:' + (e && e.message ? e.message : e));
    }

    const punchOk = punch.kind === 'punch' && !punch.threw;
    const kickOk = kick.kind === 'kick' && !kick.threw;
    // vuist weapon maps to punch; any started attack counts
    const weaponOk = !!weapon.kind && !weapon.threw;
    const canvasOk = !canvasPunch.threw && (canvasPunch.kind === 'punch' || canvasPunch.kind == null);

    const ok = punchOk && kickOk && weaponOk && !canvasPunch.threw
      && missingBtns.length === 0
      && tooSmall.length === 0
      && tooLow.length === 0
      && offScreen.length === 0
      && overlaps.length === 0
      && sweepBad.length === 0
      && iconFail.length === 0
      && hudFail.length === 0
      && errors.length === 0
      && g.player.rosterId === 'hero';

    return {
      ok,
      punch,
      kick,
      weapon,
      canvasPunch,
      canvasOk,
      punchOk,
      kickOk,
      weaponOk,
      iconAudit,
      iconFail,
      hudAudit,
      hudFail,
      missingBtns,
      layout,
      tooSmall,
      tooLow,
      offScreen,
      overlaps,
      sweep,
      sweepBad,
      uiScale: typeof touchUiScale === 'function' ? Number(touchUiScale(W, H).toFixed(3)) : null,
      viewport: { W, H },
      ids,
      rosterId: g.player.rosterId,
      profile,
      errors: errors.slice(0, 8),
      app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
      sw: typeof SW_CACHE_REV !== 'undefined' ? SW_CACHE_REV : null,
    };
  });

  await browser.close();
  if (server) try { server.close(); } catch (_) {}

  if (pageErrors.length) {
    result.pageErrors = pageErrors.slice(0, 5);
    result.ok = false;
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('SMOKE_OK touch-buttons');
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
