#!/usr/bin/env node
/**
 * Top-20 strongest spawn FX: ranking, procedural SFX, light shudder,
 * other species unchanged, reduced-motion skips shake.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const outDir = '/tmp/sf-top20-spawn';
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
  try { server = await ensureSmokeServer(8787); } catch (_) {}

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const base = process.argv[2] || smokeBaseUrl(8787);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 25000 });

  const result = await page.evaluate(() => {
    const need = ['speciesPowerScore', 'speciesTop20Ranked', 'isTop20StrongestSpecies',
      'triggerTop20SpawnFx', 'spawnTop20ForTest', 'Monster'];
    const missing = need.filter((n) => typeof globalThis[n] !== 'function');
    if (missing.length) return { ok: false, why: 'missing:' + missing.join(',') };

    const ids = speciesTop20Ranked();
    if (!Array.isArray(ids) || ids.length !== 20) {
      return { ok: false, why: 'count:' + (ids && ids.length) };
    }
    const uniq = new Set(ids);
    if (uniq.size !== 20) return { ok: false, why: 'dup-ids' };

    const scores = ids.map((id) => speciesPowerScore(id));
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[i - 1]) return { ok: false, why: 'not-sorted' };
    }

    const all = Object.keys(SPECIES);
    const cutoff = scores[scores.length - 1];
    const strongerOutside = all.filter((id) => !uniq.has(id) && speciesPowerScore(id) > cutoff);
    if (strongerOutside.length) return { ok: false, why: 'leak:' + strongerOutside.join(',') };

    if (isTop20StrongestSpecies('slymo') || isTop20StrongestSpecies('bubbel')) {
      return { ok: false, why: 'weak-flagged' };
    }
    const topId = ids[0];
    if (!isTop20StrongestSpecies(topId)) return { ok: false, why: 'top-unflagged' };

    const played = [];
    const origSfx = AudioSys.sfx.bind(AudioSys);
    AudioSys.sfx = (name) => { played.push(name); try { origSfx(name); } catch (_) {} };

    startGame('training');
    const g = game;
    if (!g || g.mode !== 'training') return { ok: false, why: 'training-not-started' };
    g.phase = 'fight';
    g.phaseT = 2;
    g.inputLocked = false;
    g.over = false;
    g.trainDummyGrace = 0;
    save.shake = true;
    save.reducedMotion = false;
    save.sfx = true;
    AudioSys.init();

    played.length = 0;
    g._top20SpawnFxAt = null;
    g.shakeT = 0;
    g.shakeMag = 0;
    const weak = new Monster('slymo', g.maxX - 80, g, {});
    g.monsters.push(weak);
    const weakFx = g._lastTop20SpawnFx;
    const weakShake = g.shakeT;
    if (played.includes('top20Spawn')) return { ok: false, why: 'slymo-sfx' };
    if (weakFx && weakFx.id === 'slymo') return { ok: false, why: 'slymo-logged' };
    if (weakShake > 0) return { ok: false, why: 'slymo-shake' };

    played.length = 0;
    g._top20SpawnFxAt = null;
    g._lastTop20SpawnFx = null;
    g.shakeT = 0;
    g.shakeMag = 0;
    const strong = spawnTop20ForTest(g, topId);
    if (!strong || strong.spId !== topId) return { ok: false, why: 'spawn-fail' };
    if (!played.includes('top20Spawn')) return { ok: false, why: 'no-sfx:' + played.join(',') };
    if (!g._lastTop20SpawnFx || g._lastTop20SpawnFx.id !== topId) {
      return { ok: false, why: 'no-log' };
    }
    if (!(g.shakeT > 0) || !(g.shakeMag > 0) || g.shakeMag > 6) {
      return { ok: false, why: `shake ${g.shakeMag}/${g.shakeT}` };
    }
    const strongShake = { mag: g.shakeMag, t: g.shakeT };

    played.length = 0;
    g._top20SpawnFxAt = g.t;
    const dup = new Monster(topId, g.maxX - 100, g, {});
    g.monsters.push(dup);
    if (played.includes('top20Spawn')) return { ok: false, why: 'debounce-fail' };

    save.reducedMotion = true;
    g._top20SpawnFxAt = null;
    g.shakeT = 0;
    g.shakeMag = 0;
    g.t += 1;
    const quiet = spawnTop20ForTest(g, topId);
    if (!quiet) return { ok: false, why: 'rm-spawn' };
    if (g.shakeT > 0 || g.shakeMag > 0) return { ok: false, why: 'rm-shake' };
    if (!played.includes('top20Spawn')) return { ok: false, why: 'rm-no-sfx' };

    const sampleMapped = typeof sampleMapForSfx === 'function' && sampleMapForSfx('top20Spawn');
    if (sampleMapped) return { ok: false, why: 'sample-mapped' };

    AudioSys.sfx = origSfx;
    save.reducedMotion = false;

    return {
      ok: true,
      top20: ids,
      topScore: scores[0],
      cutoff,
      topId,
      weakShake,
      strongShake,
      sfxOnce: played.filter((n) => n === 'top20Spawn').length >= 1,
    };
  });

  await browser.close();
  try { if (server) server.close(); } catch (_) {}

  if (pageErrors.length) {
    console.error('SMOKE_FAIL pageerror', pageErrors[0]);
    process.exit(1);
  }
  if (!result || !result.ok) {
    console.error('SMOKE_FAIL', result && result.why);
    process.exit(1);
  }
  console.log('SMOKE_OK top20-spawn', result.topId, 'n=' + result.top20.length,
    'score=' + result.topScore, 'shake=' + result.strongShake.mag);
}

run().catch((err) => {
  console.error('SMOKE_FAIL', err && err.message);
  process.exit(1);
});
