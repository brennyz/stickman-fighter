#!/usr/bin/env node
/**
 * Smoke: summons screen — no blue-screen regression.
 * Open hub → summonScreen active (fullscreen), canvas hidden, not is-playing.
 * Pull random → counters drop, no spoiler toast, center card after delay, is-pulling.
 * Leave to adventure → screens cleared, is-playing.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = '/tmp/sf-summon-smoke';
fs.mkdirSync(outDir, { recursive: true });

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser']
  .find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('SMOKE_FAIL no chrome');
  process.exit(1);
}

async function getPuppeteer() {
  try {
    return await import('puppeteer-core');
  } catch (_) {
    await new Promise((resolve, reject) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('npm install failed'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

async function run() {
  let server = null;
  try { server = await ensureSmokeServer(8787); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(smokeBaseUrl(8787) + '?sfsmoke=1', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__sfBooted && typeof UI !== 'undefined' && typeof openChestSummon === 'function', { timeout: 30000 });

    const openSnap = await page.evaluate(() => {
      UI.openSummonHub();
      const summon = document.getElementById('summonScreen');
      const game = document.getElementById('game');
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      const rect = summon ? summon.getBoundingClientRect() : null;
      return {
        active: actives,
        summonActive: !!(summon && summon.classList.contains('active')),
        canvasVis: game ? game.style.visibility : null,
        isPlaying: document.body.classList.contains('is-playing'),
        state: typeof state !== 'undefined' ? state : null,
        where: !!(document.getElementById('summonWhereStrip')),
        centerCard: !!(document.getElementById('summonCenterCard')),
        left: typeof chestSummonsLeft === 'function' ? chestSummonsLeft() : -1,
        fullW: rect ? Math.round(rect.width) : 0,
        fullH: rect ? Math.round(rect.height) : 0,
        hasPull: !!document.getElementById('btnChestPull'),
        hasSkip: !!document.getElementById('summonSkipHint'),
        hasGlance: !!document.getElementById('summonGlance'),
        glanceOdds: (document.getElementById('summonOdds') || {}).textContent || '',
        pipOn: document.querySelectorAll('#summonPips .summon-pip.is-on').length,
        pipAll: document.querySelectorAll('#summonPips .summon-pip').length,
        glanceFn: typeof chestGlanceState === 'function',
        logHelper: typeof chestPullLogLine === 'function',
        logJunk: (typeof chestPullLogLine === 'function')
          ? chestPullLogLine({ kind: 'weapon', type: 'junk', nice: false })
          : '',
        logEgg: (typeof chestPullLogLine === 'function')
          ? chestPullLogLine({ kind: 'pet', type: 'egg', id: 'egg_cloud', rarity: 'uncommon' })
          : '',
        kindFn: typeof chestPullKindId === 'function',
        kindWeapon: (typeof chestPullKindId === 'function') ? chestPullKindId({ type: 'weapon_unlock' }) : '',
        kindEgg: (typeof chestPullKindId === 'function') ? chestPullKindId({ type: 'egg' }) : '',
        kindBadge: !!document.getElementById('summonCardKind'),
        homeTile: !!document.getElementById('btnSummons'),
        collectTile: !!document.getElementById('btnCollectSummons'),
        collectHub: !!document.querySelector('[data-hub-panel="collect"] [data-hub="summon"]'),
        weaponsJump: !!document.getElementById('btnWeaponsGotoSummon'),
        petsJump: !!document.getElementById('btnPetsGotoSummon'),
        skipFn: typeof summonRevealShouldSkip === 'function',
        hasCancel: !!document.getElementById('btnSummonCancel'),
        hasLogHead: !!document.getElementById('summonLogHead'),
        noX10: !document.getElementById('btnChestPull10') && !document.querySelector('[data-pull="x10"]'),
        logCap: (typeof SUMMON_LOG_SHOW === 'number') ? SUMMON_LOG_SHOW : 0,
        storeCap: (typeof CHEST_PULL_LOG_MAX === 'number') ? CHEST_PULL_LOG_MAX : 0,
        logNewestFn: typeof chestPullLogNewest === 'function',
      };
    });
    must(openSnap.summonActive, 'summonScreen not active: ' + JSON.stringify(openSnap.active));
    must(openSnap.active.length === 1 && openSnap.active[0] === 'summonScreen', 'expected only summonScreen: ' + JSON.stringify(openSnap.active));
    must(openSnap.canvasVis === 'hidden' || openSnap.canvasVis === '', 'canvas should be hidden on UI: ' + openSnap.canvasVis);
    must(!openSnap.isPlaying, 'body.is-playing must be false on summon screen');
    must(openSnap.state === 'menu', 'state should be menu, got ' + openSnap.state);
    must(openSnap.where && openSnap.centerCard, 'missing where-strip or center card');
    must(openSnap.left === 10, 'expected 10 summons, got ' + openSnap.left);
    
    must(openSnap.hasGlance && openSnap.glanceFn, 'missing summon glance strip / chestGlanceState');
    must(/14%/.test(openSnap.glanceOdds) && /30%/.test(openSnap.glanceOdds),
      'odds not one-glance: ' + openSnap.glanceOdds);
    must(/pity/i.test(openSnap.glanceOdds), 'pity status missing from glance: ' + openSnap.glanceOdds);
    must(openSnap.pipAll === 10 && openSnap.pipOn === 10, 'expected 10/10 pips, got ' + JSON.stringify(openSnap));
    must(openSnap.hasPull, 'missing btnChestPull');
    must(openSnap.hasSkip, 'missing summonSkipHint');
    must(openSnap.logHelper, 'missing chestPullLogLine');
    must(openSnap.logJunk && !/weapon_unlock|junk/i.test(openSnap.logJunk),
      'log line still raw: ' + openSnap.logJunk);
    must(openSnap.logEgg && /wolkje/i.test(openSnap.logEgg) && !/egg_cloud/.test(openSnap.logEgg),
      'egg log should use display name: ' + openSnap.logEgg);
    must(openSnap.kindFn && openSnap.kindWeapon === 'weapon' && openSnap.kindEgg === 'egg',
      'egg vs weapon kind helper missing: ' + JSON.stringify(openSnap));
    must(openSnap.kindBadge, 'missing #summonCardKind');
    must(openSnap.homeTile && openSnap.collectTile && openSnap.collectHub,
      'HOME/Collectie summons entry missing: ' + JSON.stringify(openSnap));
    must(openSnap.weaponsJump && openSnap.petsJump, 'weapon/pet Kist jumps missing');
    must(openSnap.skipFn, 'missing summonRevealShouldSkip');
    must(openSnap.hasCancel && openSnap.noX10, 'expected Stop, no x10 batch: ' + JSON.stringify(openSnap));
    must(openSnap.hasLogHead && openSnap.logNewestFn && openSnap.logCap === 4 && openSnap.storeCap === 5,
      'log cap / newest helper missing: ' + JSON.stringify(openSnap));
    const btnTxt = await page.evaluate(() => (document.getElementById('btnChestPull') || {}).textContent || '');
    must(/open kist/i.test(btnTxt), 'expected Open kist CTA, got: ' + btnTxt);
    const chrome = await page.evaluate(() => {
      const sub = document.getElementById('summonScreenSub');
      const where = document.getElementById('summonWhereStrip');
      const home = document.querySelector('#summonScreen > .sub-home-bar');
      const goto = document.querySelector('.summon-goto-row');
      const fatGoto = !!(goto && goto.querySelector('.btn.mode-btn'));
      const cs = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        return { display: s.display, vis: s.visibility, w: Math.round(el.getBoundingClientRect().width) };
      };
      return {
        sub: cs(sub),
        where: cs(where),
        home: cs(home),
        fatGoto,
        gotoText: goto ? (goto.textContent || '').replace(/\s+/g, ' ').trim() : '',
        gotoMinH: goto ? Math.min(...[...goto.querySelectorAll('.summon-goto-link')].map((b) => Math.round(b.getBoundingClientRect().height))) : 0,
        pullH: (() => {
          const b = document.getElementById('btnChestPull');
          return b ? Math.round(b.getBoundingClientRect().height) : 0;
        })(),
        vw: window.innerWidth,
      };
    });
    must(chrome.vw <= 400, 'expected phone viewport, got ' + chrome.vw);
    must(chrome.sub && chrome.sub.display === 'none', 'subtitle should hide on phone: ' + JSON.stringify(chrome.sub));
    must(chrome.where && (chrome.where.display === 'none' || chrome.where.w <= 2),
      'where-strip should be visually hidden: ' + JSON.stringify(chrome.where));
    must(chrome.home && chrome.home.display === 'none', 'home bar should hide on summon: ' + JSON.stringify(chrome.home));
    must(!chrome.fatGoto, 'collection jumps must be text links, not fat mode buttons');
    must(/wapens/i.test(chrome.gotoText) && /pets/i.test(chrome.gotoText),
      'expected Wapens · Pets links, got: ' + chrome.gotoText);
    must(chrome.gotoMinH >= 44, 'goto tap targets < 44px: ' + JSON.stringify(chrome));
    must(chrome.pullH >= 44, 'pull CTA tap target < 44px: ' + chrome.pullH);
    await page.evaluate(() => {
      const splash = document.getElementById('sfSplash');
      if (splash) { splash.hidden = true; splash.style.display = 'none'; }
      const fomo = document.getElementById('fomoRitual');
      if (fomo) fomo.hidden = true;
    });
    await page.screenshot({ path: path.join(outDir, 'summon-idle-phone.png') });
    const polish = await page.evaluate(() => {
      const css = [...document.styleSheets].flatMap(s => {
        try { return [...s.cssRules].map(r => r.cssText); } catch (_) { return []; }
      }).join('\n');
      return {
        stagePullable: !!(document.getElementById('summonStage')?.classList.contains('is-pullable')),
        videoCrop: /111\.12%/.test(css) || /111\.12%/.test(document.getElementById('summonVideo') && ''),
        hasSummonSongs: typeof playSummonBgm === 'function' && typeof endSummonBgm === 'function',
        rarityCardCss: /data-rarity=.rare./.test(css) || /summon-center-card/.test(css),
      };
    });
    // CSSOM may omit cross-origin; also check source via inline computed after pull
    must(polish.stagePullable, 'stage should be pullable when summons left');
    must(polish.hasSummonSongs, 'missing playSummonBgm/endSummonBgm');

    must(openSnap.fullW >= 360 && openSnap.fullH >= 700, 'summon screen not fullscreen-ish: ' + JSON.stringify(openSnap));

    const emptySnap = await page.evaluate(() => {
      const d = ensureChestDaily();
      const prev = d.left;
      d.left = 0;
      UI._chestPullBusy = false;
      UI._summonSkipReady = false;
      UI.renderSummon();
      const btn = document.getElementById('btnChestPull');
      const stage = document.getElementById('summonStage');
      const snap = {
        disabled: !!(btn && btn.disabled),
        emptyStage: !!(stage && stage.classList.contains('is-empty')),
        pipOn: document.querySelectorAll('#summonPips .summon-pip.is-on').length,
        quota: (document.getElementById('summonQuota') || {}).textContent || '',
      };
      d.left = prev;
      UI.renderSummon();
      return snap;
    });
    must(emptySnap.disabled && emptySnap.emptyStage && emptySnap.pipOn === 0,
      'empty state missing: ' + JSON.stringify(emptySnap));

    const logSnap = await page.evaluate(() => {
      const d = ensureChestDaily();
      const prev = (d.pulls || []).slice();
      d.pulls = [
        { type: 'junk', kind: 'weapon' },
        { type: 'coins', amount: 4 },
        { type: 'egg', id: 'egg_cloud', rarity: 'uncommon' },
        { type: 'weapon_unlock', id: 'knuppel', rarity: 'rare' },
        { type: 'pet_unlock', id: 'slymo', rarity: 'epic', nice: true },
        { type: 'xp', amount: 20 },
      ];
      UI.renderSummon();
      const chips = [...document.querySelectorAll('#summonLog .summon-log-chip')];
      const newest = chips[0];
      const snap = {
        n: chips.length,
        first: newest ? newest.textContent : '',
        newestMark: !!(newest && newest.classList.contains('is-newest')),
        head: (document.getElementById('summonLogHead') || {}).textContent || '',
        helperN: (typeof chestPullLogNewest === 'function') ? chestPullLogNewest(4).length : -1,
        helperFirst: (typeof chestPullLogNewest === 'function' && chestPullLogNewest(4)[0])
          ? chestPullLogNewest(4)[0].type : '',
      };
      d.pulls = prev;
      UI.renderSummon();
      return snap;
    });
    must(logSnap.n === 4, 'log should cap at 4 newest: ' + JSON.stringify(logSnap));
    must(logSnap.helperFirst === 'xp' && logSnap.newestMark,
      'newest-first missing: ' + JSON.stringify(logSnap));
    must(/nieuw/i.test(logSnap.head), 'log head should say newest: ' + logSnap.head);

    const pullStart = await page.evaluate(() => {
      const before = chestSummonsLeft();
      UI.doChestPull('random');
      UI.doChestPull('random');
      UI.doChestPull('random');
      return { before, afterPull: chestSummonsLeft() };
    });
    must(pullStart.afterPull === pullStart.before - 1,
      'duplicate tap spam changed leftover: ' + JSON.stringify(pullStart));

    const pullSnap = await page.evaluate(async (before) => {
      const toastBefore = (document.getElementById('toastHost') || {}).textContent || '';
      const midText = (document.getElementById('summonRevealText') || {}).textContent || '';
      const toastMid = (document.getElementById('toastHost') || {}).textContent || '';
      // Give the short clip a beat to start, then sample playback
      await new Promise((r) => setTimeout(r, 700));
      const vidEarly = document.getElementById('summonVideo');
      const stageEarly = document.getElementById('summonStage');
      const playEarly = vidEarly ? {
        display: getComputedStyle(vidEarly).display,
        paused: vidEarly.paused,
        t: Number(vidEarly.currentTime || 0),
        ready: vidEarly.readyState,
        hasVideoCls: document.getElementById('summonScreen')?.classList.contains('has-video'),
      } : null;
      let cropEarly = null;
      if (vidEarly && stageEarly && playEarly && playEarly.display === 'block') {
        const vs = getComputedStyle(vidEarly);
        const vw = parseFloat(vs.width);
        const vh = parseFloat(vs.height);
        const sr = stageEarly.getBoundingClientRect();
        cropEarly = {
          vw, vh, sw: sr.width, sh: sr.height,
          ratioW: sr.width > 0 ? vw / sr.width : 0,
          ratioH: sr.height > 0 ? vh / sr.height : 0,
          stagePct: sr.width / window.innerWidth,
          aspect: sr.height > 0 ? sr.width / sr.height : 0,
        };
      }
      // Card lands at ~1.5s of a 2.4s reveal; stay inside the pulling window
      await new Promise((r) => setTimeout(r, 1000));
      const reveal = document.getElementById('summonReveal');
      const card = document.getElementById('summonCenterCard');
      const stage = document.getElementById('summonStage');
      const rail = document.querySelector('.summon-rail');
      const screen = document.getElementById('summonScreen');
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      const stageRect = stage ? stage.getBoundingClientRect() : null;
      const railRect = rail ? rail.getBoundingClientRect() : null;
      const cardRect = card ? card.getBoundingClientRect() : null;
      let cardCenter = null;
      if (cardRect && stageRect && cardRect.width > 8 && stageRect.width > 8) {
        cardCenter = {
          dx: Math.abs((cardRect.left + cardRect.width / 2) - (stageRect.left + stageRect.width / 2)),
          dy: Math.abs((cardRect.top + cardRect.height / 2) - (stageRect.top + stageRect.height / 2)),
        };
      }
      const toastAfter = (document.getElementById('toastHost') || {}).textContent || '';
      return {
        before,
        after: chestSummonsLeft(),
        cardShow: !!(reveal && reveal.classList.contains('is-card-show')),
        cardOpacity: card ? getComputedStyle(card).opacity : null,
        cardName: (document.getElementById('summonCardName') || {}).textContent || '',
        cardCenter,
        stillSummon: actives[0] === 'summonScreen' && actives.length === 1,
        isPlaying: document.body.classList.contains('is-playing'),
        rarity: reveal ? reveal.dataset.rarity : null,
        stageW: stageRect ? Math.round(stageRect.width) : 0,
        stageH: stageRect ? Math.round(stageRect.height) : 0,
        railW: railRect ? Math.round(railRect.width) : 0,
        hasVideo: !!(screen && screen.classList.contains('has-video')),
        pulling: !!(screen && screen.classList.contains('is-pulling')),
        videoDisplay: (() => {
          const v = document.getElementById('summonVideo');
          return v ? getComputedStyle(v).display : null;
        })(),
        fallbackOk: (() => {
          const f = document.getElementById('summonStageFallback');
          return !!(f && getComputedStyle(f).display !== 'none');
        })(),
        midText,
        toastMid,
        toastAfter,
        toastBefore,
        playEarly,
        cropEarly,
        endText: (document.getElementById('summonRevealText') || {}).textContent || '',
        skipReady: !!(screen && screen.classList.contains('is-skip-ready')),
        logRaw: ((document.getElementById('summonLog') || {}).textContent || ''),
        cardKind: card ? (card.getAttribute('data-kind') || '') : '',
        kindBadge: (document.getElementById('summonCardKind') || {}).textContent || '',
        cancelVis: (() => {
          const b = document.getElementById('btnSummonCancel');
          if (!b) return false;
          const r = b.getBoundingClientRect();
          return !b.hidden && r.width >= 44 && r.height >= 44;
        })(),
        logChipN: document.querySelectorAll('#summonLog .summon-log-chip').length,
        newestChip: !!document.querySelector('#summonLog .summon-log-chip.is-newest'),
      };
    }, pullStart.before);
    must(pullSnap.after === pullStart.afterPull,
      'counter changed during reveal: ' + JSON.stringify(pullSnap));
    must(pullSnap.stillSummon, 'summon screen lost during pull');
    must(!pullSnap.isPlaying, 'is-playing flipped during pull');
    must(pullSnap.cardShow, 'center card not shown after reveal window');
    must(pullSnap.cardName.length > 0, 'empty center card name');
    must(pullSnap.skipReady, 'expected is-skip-ready after card lands');
    must(pullSnap.cardKind.length > 0, 'card missing data-kind: ' + JSON.stringify(pullSnap));
    must(pullSnap.kindBadge.length > 0, 'kind badge empty after pull');
    must(pullSnap.cancelVis, 'Stop cancel not visible during pull: ' + JSON.stringify(pullSnap));
    must(pullSnap.logChipN >= 1 && pullSnap.logChipN <= 4 && pullSnap.newestChip,
      'pull log should be newest-first and capped: ' + JSON.stringify(pullSnap));
    must(!/weapon_unlock|pet_unlock|weapon_ascend/.test(pullSnap.logRaw),
      'pull log still raw type ids: ' + pullSnap.logRaw);
    must(!/egg_/.test(pullSnap.logRaw), 'egg log still uses raw id: ' + pullSnap.logRaw);
    await page.screenshot({ path: path.join(outDir, 'summon-card-phone.png') });
    if (pullSnap.cardCenter) {
      must(pullSnap.cardCenter.dx <= 12, 'reward card not horizontally centered: ' + JSON.stringify(pullSnap.cardCenter));
      must(pullSnap.cardCenter.dy <= 18, 'reward card not vertically centered: ' + JSON.stringify(pullSnap.cardCenter));
    }
    must(/kist opent/i.test(pullSnap.midText), 'expected neutral mid text, got: ' + pullSnap.midText);
    // No spoiler toast during reveal (toast host should stay empty / unchanged vs result text)
    must(!pullSnap.toastMid || pullSnap.toastMid === pullSnap.toastBefore,
      'spoiler toast during reveal: ' + pullSnap.toastMid);
    must(pullSnap.stageW >= 280, 'summon stage too narrow: ' + pullSnap.stageW);
    must(pullSnap.videoDisplay === 'block' || pullSnap.fallbackOk || (pullSnap.playEarly && pullSnap.playEarly.display === 'block'),
      'video not visible and no fallback: ' + JSON.stringify(pullSnap));
    if (pullSnap.playEarly && pullSnap.playEarly.display === 'block') {
      must(pullSnap.playEarly.hasVideoCls, 'expected has-video class during play');
      const crop = pullSnap.cropEarly;
      must(crop && crop.ratioW >= 1.08, 'video should crop right (~112%) for watermark: ' + JSON.stringify(crop));
      must(crop && crop.ratioH <= 1.05, 'video height should stay ~100% so chest bottom is visible: ' + JSON.stringify(crop));
      must(crop && crop.aspect >= 1.6 && crop.aspect <= 1.9, 'stage should stay ~16:9 on large screens: ' + JSON.stringify(crop));
      must(crop && crop.stagePct <= 0.94, 'stage should be ~90% viewport wide: ' + JSON.stringify(crop));
      must(pullSnap.playEarly.t > 0.05, 'mp4 did not advance currentTime: ' + JSON.stringify(pullSnap.playEarly));
      must(!pullSnap.playEarly.paused, 'mp4 still paused after pull: ' + JSON.stringify(pullSnap.playEarly));
    }

    const reducedSnap = await page.evaluate(async () => {
      if (typeof save !== 'undefined') save.reducedMotion = true;
      try { if (typeof syncA11yClasses === 'function') syncA11yClasses(); } catch (_) {}
      UI.finishSummonReveal();
      UI.doChestPull('random');
      await new Promise((r) => setTimeout(r, 50));
      const reveal = document.getElementById('summonReveal');
      const screen = document.getElementById('summonScreen');
      const vid = document.getElementById('summonVideo');
      return {
        cardShow: !!(reveal && reveal.classList.contains('is-card-show')),
        skipReady: !!(screen && screen.classList.contains('is-skip-ready')),
        shake: !!(reveal && reveal.classList.contains('is-shake')),
        hasVideo: !!(screen && screen.classList.contains('has-video')),
        vidDisplay: vid ? getComputedStyle(vid).display : null,
        kind: (document.getElementById('summonCenterCard') || {}).getAttribute
          ? document.getElementById('summonCenterCard').getAttribute('data-kind')
          : '',
        bodyRm: document.body.classList.contains('reduced-motion'),
      };
    });
    must(reducedSnap.cardShow && reducedSnap.skipReady,
      'reduced-motion should land card immediately: ' + JSON.stringify(reducedSnap));
    must(!reducedSnap.shake, 'reduced-motion should skip chest shake: ' + JSON.stringify(reducedSnap));
    must(!reducedSnap.hasVideo && reducedSnap.vidDisplay !== 'block',
      'reduced-motion should skip reveal video: ' + JSON.stringify(reducedSnap));

    const navSnap = await page.evaluate(() => {
      UI.finishSummonReveal();
      UI.goMenu();
      UI.openModeHub('collect');
      const tile = document.getElementById('btnCollectSummons');
      const panel = document.querySelector('[data-hub-panel="collect"]');
      const home = document.getElementById('btnSummons');
      return {
        collectActive: !!(document.getElementById('modeHubScreen') && document.getElementById('modeHubScreen').classList.contains('active')),
        panelVisible: !!(panel && !panel.hidden),
        tile: !!(tile && tile.dataset.hub === 'summon'),
        featured: !!(tile && tile.classList.contains('hub-tile-featured')),
        home: !!(home && home.dataset.hub === 'summon'),
      };
    });
    must(navSnap.collectActive && navSnap.panelVisible && navSnap.tile && navSnap.featured,
      'Collectie missing one clear Summons entry: ' + JSON.stringify(navSnap));
    must(navSnap.home, 'HOME Summons tile missing after collect hub');

    const fomoSnap = await page.evaluate(() => {
      UI.goMenu();
      document.getElementById('menuScreen')?.classList.add('active');
      UI._fomoRitualHide = false;
      UI._fomoRitualForce = true;
      UI.showFomoRitual(true);
      const onMenu = {
        open: !document.getElementById('fomoRitual')?.hidden,
        body: document.body.classList.contains('fomo-open'),
      };
      UI.openSummonHub();
      const fomo = document.getElementById('fomoRitual');
      const summon = document.getElementById('summonScreen');
      let overlap = false;
      if (fomo && !fomo.hidden && summon && summon.classList.contains('active')) {
        const a = fomo.getBoundingClientRect();
        const b = summon.getBoundingClientRect();
        overlap = a.width > 2 && a.height > 2 && !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      }
      return {
        onMenu,
        hiddenOnSummon: !!(fomo && fomo.hidden),
        summonActive: !!(summon && summon.classList.contains('active')),
        bodyOpen: document.body.classList.contains('fomo-open'),
        overlap,
        fomoDisp: fomo ? getComputedStyle(fomo).display : null,
      };
    });
    must(fomoSnap.onMenu.open && fomoSnap.onMenu.body, 'FOMO sheet should open on HOME: ' + JSON.stringify(fomoSnap));
    must(fomoSnap.hiddenOnSummon && fomoSnap.summonActive && !fomoSnap.bodyOpen && !fomoSnap.overlap,
      'FOMO must not overlap summon chrome: ' + JSON.stringify(fomoSnap));

    const playSnap = await page.evaluate(() => {
      UI.goMenu();
      try {
        startGame('adventure', { level: 1 });
      } catch (e) {
        return { err: String(e && e.message || e) };
      }
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      const canvas = document.getElementById('game');
      return {
        actives,
        isPlaying: document.body.classList.contains('is-playing'),
        state: typeof state !== 'undefined' ? state : null,
        canvasVis: canvas ? canvas.style.visibility : null,
        hasGame: !!game,
      };
    });
    must(!playSnap.err, 'adventure start failed: ' + playSnap.err);
    must(playSnap.actives.length === 0, 'screens still active in play: ' + JSON.stringify(playSnap.actives));
    must(playSnap.isPlaying, 'body.is-playing missing after adventure start');
    must(playSnap.state === 'play', 'state not play');
    must(playSnap.canvasVis === 'visible' || playSnap.canvasVis === '', 'canvas not visible in play');
    must(playSnap.hasGame, 'game instance missing');

    const blocked = await page.evaluate(() => {
      UI.openSummonHub();
      const actives = [...document.querySelectorAll('.screen.active')].map((s) => s.id);
      return {
        actives,
        stillPlay: typeof state !== 'undefined' ? state === 'play' : false,
        isPlaying: document.body.classList.contains('is-playing'),
      };
    });
    must(blocked.actives.length === 0, 'summon opened mid-fight: ' + JSON.stringify(blocked));
    must(blocked.stillPlay && blocked.isPlaying, 'fight state lost when summon blocked');

    console.log('SMOKE_OK summon-screen', JSON.stringify({ openSnap, pullSnap, playSnap, blocked }));
  } finally {
    await browser.close();
    if (server && server.close) try { server.close(); } catch (_) {}
  }
}

run().catch((e) => {
  console.error('SMOKE_FAIL', e);
  process.exit(1);
});
