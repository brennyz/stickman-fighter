#!/usr/bin/env node
/**
 * PLAYTEST BOT 6/9 — TELEGRAPHS / FAIR FAIL
 * LIVE c9a29fc v1.18.190 SW400. Report-only: does not retune density numbers.
 * Versus stays out.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/playtest-telegraph-6');
fs.mkdirSync(outDir, { recursive: true });

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('PLAYTEST_FAIL no chrome');
  process.exit(1);
}

async function getPuppeteer() {
  const cache = '/tmp/sf-adv-run';
  const npmBin = process.env.npm_execpath
    || ['/home/ubuntu/.nvm/versions/node/v22.22.2/bin/npm', '/usr/local/bin/npm']
      .find((p) => fs.existsSync(p))
    || 'npm';
  const nodeDir = path.dirname(npmBin);
  try {
    return await import('puppeteer-core');
  } catch (_) {
    fs.mkdirSync(cache, { recursive: true });
    await new Promise((res, rej) => {
      const p = spawn(npmBin, ['install', '--no-save', 'puppeteer-core@23'], {
        cwd: cache,
        stdio: 'inherit',
        env: Object.assign({}, process.env, {
          PATH: nodeDir + ':' + (process.env.PATH || ''),
        }),
      });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm puppeteer-core'))));
    });
    return import(path.join(cache, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

const CASES = [
  { id: 'charge', sp: 'stekelra', expectKind: 'charge', expectCue: /CHARGE/i },
  { id: 'slam', sp: 'rotsbonk', expectKind: 'slam', expectCue: /SLAM/i },
  { id: 'shoot', sp: 'spooki', expectKind: 'shoot', expectCue: /SCHIET|SHOT|TIR|DISPARO|SCHUSS/i },
  { id: 'fire', sp: 'vlamdraak', expectKind: 'fire', expectCue: /VUUR|FIRE|FEU|FUEGO|FEUER/i },
  { id: 'ink', sp: 'inktvissie', expectKind: 'ink', expectCue: /INKT|INK|SCHIET|SHOT/i },
  { id: 'shark', sp: 'rifhaai', expectKind: 'charge', expectCue: /CHARGE/i },
  { id: 'hop', sp: 'slymo', expectKind: '', expectCue: null, noWind: true },
  { id: 'fly', sp: 'flapper', expectKind: '', expectCue: /vlieger|flyer|volant|volador|Flieger/i, noWind: true },
];

const VIEWS = [
  { id: 'desk', w: 1280, h: 800, mobile: false },
  { id: 'phone', w: 390, h: 844, mobile: true },
  { id: 'land', w: 844, h: 390, mobile: true },
];

function pickInkId() {
  return 'inktvis';
}

async function runView(browser, view, base) {
  const page = await browser.newPage();
  await page.setViewport({
    width: view.w,
    height: view.h,
    deviceScaleFactor: view.mobile ? 2 : 1,
    isMobile: view.mobile,
    hasTouch: view.mobile,
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(base + (base.includes('?') ? '&' : '?') + 'nosplash=1', { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted && window.__sf, { timeout: 20000 });

  const probe = await page.evaluate((vw) => {
    const dens = window.__sf.combatDensity;
    const prof = dens.profile({ w: vw.w, h: vw.h });
    const winds = {
      charge: dens.telegraphWind(0.45, prof),
      chargeEnrage: dens.telegraphWind(0.28, prof),
      shark: dens.telegraphWind(0.20, prof),
      shoot: dens.telegraphWind(0.42, prof, { ranged: true }),
      fire: dens.telegraphWind(0.48, prof, { ranged: true }),
      ink: dens.telegraphWind(0.40, prof, { ranged: true }),
      slam: dens.telegraphWind(0.55, prof),
      colossal: dens.telegraphWind(0.45, prof, { colossal: true }),
    };
    return {
      version: window.__sf.version,
      swRev: window.__sf.swRev,
      profile: {
        scale: prof.scale,
        maxAlive: prof.maxAlive,
        spawnIntervalMul: prof.spawnIntervalMul,
        spawnBatchMax: prof.spawnBatchMax,
        spawnGapPx: prof.spawnGapPx,
        compact: !!prof.compact,
        tablet: !!prof.tablet,
        w: prof.w,
        h: prof.h,
      },
      readScale: dens.telegraphRead(prof),
      hudSlots: dens.teleHudSlots(prof),
      chargeDist: dens.chargeDist(240, prof),
      winds,
      versusRetired: typeof toastVersusRetired === 'function',
    };
  }, view);

  const cases = [];
  for (const spec of CASES) {
    const result = await page.evaluate((spec, view) => {
      const DT = 1 / 30;
      const log = { id: spec.id, sp: spec.sp, view: view.id, ok: false };
      const inkId = (typeof SPECIES !== 'undefined' && SPECIES.inktvis) ? 'inktvis'
        : (typeof SPECIES !== 'undefined' && Object.keys(SPECIES).find((k) => SPECIES[k] && SPECIES[k].type === 'swim' && SPECIES[k].art !== 'shark'))
          || spec.sp;
      const spId = spec.id === 'ink' ? inkId : spec.sp;
      log.sp = spId;
      if (typeof SPECIES === 'undefined' || !SPECIES[spId]) {
        log.why = 'missing species';
        return log;
      }

      startGame('adventure', { level: spec.id === 'fire' || spec.id === 'slam' ? 8 : 4, gamble: null });
      const g = game;
      if (!g || !g.player) return Object.assign(log, { why: 'no game' });
      g.inputLocked = false;
      g.over = false;
      g.spawnQueue = [];
      g.monsters = [];
      g.projectiles = g.projectiles || [];
      g.player.invulnT = 0;
      g.openerGraceT = 0;
      g.playerHurtCd = 0;
      g.player.x = Math.round((typeof W === 'number' ? W : view.w) * 0.42);
      g.player.y = g.ground - 8;
      g.player.hp = g.player.maxhp;

      const near = spec.id === 'shoot' || spec.id === 'fire' || spec.id === 'ink'
        ? g.player.x + 220
        : g.player.x + 70;
      const mon = new Monster(spId, near, g, {
        softTelegraph: false,
        advDiff: 'normal',
        levelN: 12,
      });
      mon.atkCD = 0;
      mon.shootCD = 0;
      mon.introT = 0;
      g.monsters.push(mon);

      const winds = [];
      let firstHud = null;
      let sawWind = false;
      let hitWhileNoTele = false;
      let firstHit = null;
      const hp0 = g.player.hp;
      let oneShot = false;

      for (let i = 0; i < 240; i++) {
        try { g.update(DT); } catch (e) {
          log.updateErr = String(e && (e.message || e));
          break;
        }
        const m = g.monsters[0];
        if (!m) break;
        if (m.telegraphT > 0 || m.techniqueTelegraphT > 0) {
          if (!sawWind) {
            sawWind = true;
            winds.push({
              t: Math.round(g.t * 100) / 100,
              kind: m.telegraphKind || '',
              infer: (typeof combatTelegraphKindOf === 'function') ? combatTelegraphKindOf(m) : '',
              teleT: Math.round((m.telegraphT || m.techniqueTelegraphT) * 1000) / 1000,
              teleMax: Math.round((m.telegraphMax || m.techniqueTelegraphMax || 0) * 1000) / 1000,
              dmg: m.dmg,
            });
            const huds = (typeof adventureTelegraphHuds === 'function') ? adventureTelegraphHuds(g.monsters) : [];
            firstHud = huds[0] || null;
            if (firstHud) {
              firstHud = {
                kind: firstHud.kind,
                label: firstHud.label,
                remain: Math.round((firstHud.remain || 0) * 100) / 100,
                extra: firstHud.extra || 0,
              };
            }
          }
        }
        if (g.player.hp < hp0 && !firstHit) {
          firstHit = {
            t: Math.round(g.t * 100) / 100,
            dmg: Math.round(hp0 - g.player.hp),
            hpAfter: g.player.hp,
            maxhp: g.player.maxhp,
            lastFail: g.lastFailTele || '',
            teleThen: !!(m && (m.telegraphT > 0 || m.techniqueTelegraphT > 0 || m.dashT > 0)),
            proj: (g.projectiles || []).filter((p) => p && p.from === 'enemy').length,
          };
          if (!sawWind && !(m && m.dashT > 0)) hitWhileNoTele = true;
          if (firstHit.dmg >= g.player.maxhp) oneShot = true;
        }
        if (sawWind && firstHit) break;
        if (spec.noWind && firstHit) break;
      }

      // Force a readable fail: drop HP and apply the tagged hit.
      const failKind = spec.expectKind || (spec.id === 'fly' ? 'flyer' : '');
      g.player.hp = Math.min(g.player.hp, 8);
      g.player.invulnT = 0;
      g.playerHurtCd = 0;
      try {
        g.player.takeDamage(g.player.hp + 4, 80, g, {
          attacker: mon,
          failKind: failKind || undefined,
          kind: failKind || spec.id,
        });
      } catch (e) {
        log.killErr = String(e && (e.message || e));
      }
      if (typeof notePlayerFailTele === 'function') {
        try { notePlayerFailTele(g, { attacker: mon, failKind: failKind, kind: failKind || spec.id }); } catch (_) {}
      }
      const tip = (typeof combatFailRetryTip === 'function') ? combatFailRetryTip(g, '') : '';
      const feel = (typeof adventureLoseFeelTip === 'function') ? adventureLoseFeelTip(g, { lv: g.level.n, diff: 'normal' }) : '';
      const hudPick = (typeof combatPickTelegraphHuds === 'function' && typeof adventureTelegraphHuds === 'function')
        ? combatPickTelegraphHuds(adventureTelegraphHuds(g.monsters))
        : [];

      log.ok = true;
      log.sawWind = sawWind;
      log.winds = winds;
      log.hud = firstHud;
      log.hudPickN = hudPick.length;
      log.firstHit = firstHit;
      log.hitWhileNoTele = hitWhileNoTele;
      log.oneShotFromFull = oneShot;
      log.lastFailTele = g.lastFailTele || '';
      log.failTip = tip;
      log.feelTip = feel;
      log.playerMax = g.player.maxhp;
      log.monDmg = mon.dmg;
      log.dashDmg = Math.round(mon.dmg * 1.3);
      log.pctOfHp = Math.round((mon.dmg / Math.max(1, g.player.maxhp)) * 100);
      return log;
    }, spec, view);

    if (result && result.sawWind) {
      try {
        const shot = path.join(outDir, `${view.id}-${spec.id}.png`);
        await page.screenshot({ path: shot, fullPage: false });
        result.shot = path.relative(root, shot);
      } catch (_) {}
    }
    cases.push(result);
  }

  const natural = await page.evaluate((view) => {
    const DT = 1 / 30;
    startGame('adventure', { level: 1, gamble: null });
    const g = game;
    if (!g || !g.player) return { why: 'no game' };
    g.inputLocked = false;
    const hits = [];
    const teles = [];
    for (let i = 0; i < 900; i++) {
      try { g.update(DT); } catch (e) {
        return { why: 'update ' + String(e && e.message) };
      }
      const alive = (g.monsters || []).filter((m) => m && m.alive);
      for (const m of alive) {
        if (m.telegraphT > 0 || m.techniqueTelegraphT > 0) {
          if (teles.length < 12) {
            teles.push({
              t: Math.round(g.t * 100) / 100,
              sp: m.spId,
              type: m.sp && m.sp.type,
              kind: m.telegraphKind || '',
              max: Math.round((m.telegraphMax || m.techniqueTelegraphMax || 0) * 1000) / 1000,
            });
          }
        }
      }
      if (g.player && !g.player.alive) {
        hits.push({
          t: Math.round(g.t * 100) / 100,
          lastFail: g.lastFailTele || '',
          lastHurt: g.lastHurtBy ? { name: g.lastHurtBy.name || g.lastHurtBy.spId, type: g.lastHurtBy.type } : null,
          tip: (typeof adventureLoseFeelTip === 'function') ? adventureLoseFeelTip(g, { lv: 1, diff: 'normal' }) : '',
        });
        break;
      }
    }
    return {
      t: Math.round(g.t * 10) / 10,
      over: !!g.over,
      hp: g.player ? Math.round(g.player.hp) : 0,
      maxhp: g.player ? g.player.maxhp : 0,
      kills: g.kills || 0,
      teleEvents: teles,
      death: hits[0] || null,
      openerTypes: (g.level && g.level.waves && g.level.waves[0] || []).map((d) => {
        const sp = SPECIES[d.sp];
        return { sp: d.sp, type: sp && sp.type };
      }),
    };
  }, view);

  const multi = await page.evaluate(() => {
    const mocks = [
      { alive: true, telegraphT: 0.40, telegraphMax: 0.45, telegraphKind: 'charge', sp: { type: 'charge' } },
      { alive: true, telegraphT: 0.22, telegraphMax: 0.45, telegraphKind: 'slam', sp: { type: 'tank' } },
      { alive: true, telegraphT: 0.50, telegraphMax: 0.50, telegraphKind: 'shoot', sp: { type: 'shoot' } },
    ];
    const raw = adventureTelegraphHuds(mocks);
    const pick = combatPickTelegraphHuds(raw);
    return {
      rawN: raw.length,
      shown: pick.map((p) => ({ kind: p.kind, remain: p.remain, extra: p.extra || 0 })),
      slots: combatTelegraphHudSlots(),
    };
  });

  await page.close();
  return { view: view.id, probe, cases, natural, multi, pageErrors };
}

async function main() {
  let server = null;
  try { server = await ensureSmokeServer(8787); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1280,800'],
  });
  const base = process.argv[2] || smokeBaseUrl(8787, '/index.html');
  const views = [];
  try {
    for (const v of VIEWS) views.push(await runView(browser, v, base));
  } finally {
    await browser.close();
    if (server && server.close) try { server.close(); } catch (_) {}
  }

  const report = {
    build: 'c9a29fc v1.18.190 SW400',
    lane: 'telegraphs / fair-fail',
    versus: 'out',
    densityUntouched: true,
    at: new Date().toISOString(),
    views,
  };
  const jsonPath = path.join(outDir, 'findings.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log('PLAYTEST_TELEGRAPH_JSON', jsonPath);
  for (const v of views) {
    console.log('VIEW', v.view, {
      scale: v.probe.profile.scale,
      maxAlive: v.probe.profile.maxAlive,
      winds: v.probe.winds,
      slots: v.probe.hudSlots,
      naturalDeath: v.natural && v.natural.death,
      errors: v.pageErrors,
    });
    for (const c of v.cases) {
      console.log('CASE', v.view, c.id, {
        sawWind: c.sawWind,
        winds: c.winds,
        hud: c.hud,
        hit: c.firstHit,
        hitWhileNoTele: c.hitWhileNoTele,
        oneShot: c.oneShotFromFull,
        fail: c.lastFailTele,
        tip: c.failTip,
        feel: c.feelTip,
        pct: c.pctOfHp,
      });
    }
  }
}

main().catch((err) => {
  console.error('PLAYTEST_FAIL', err);
  process.exit(1);
});
