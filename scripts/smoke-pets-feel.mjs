#!/usr/bin/env node
/**
 * Combat pet feel: snappy follow, assist telegraph, no Versus.
 * Damage / CD numbers stay the same. Mobile web + desktop PWA.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const petSrc = fs.readFileSync(path.join(root, 'src/entities/pet.js'), 'utf8');
const eggSrc = fs.readFileSync(path.join(root, 'src/entities/egg-pet.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

must(petSrc.includes('function companionFollow'), 'companionFollow helper missing');
must(petSrc.includes('Math.exp(-omega'), 'follow must use exp smoothing (not sluggish dt*8)');
must(petSrc.includes('predY'), 'jump vy predict missing');
must(petSrc.includes('flipped'), 'face-flip snap missing');
must(petSrc.includes('this.windT'), 'assist telegraph windT missing');
must(petSrc.includes('setLineDash'), 'telegraph intent dash missing');
must(petSrc.includes('Math.max(24'), 'telegraph ring must have a readable min radius');
must(petSrc.includes('petPickAssistTarget'), 'shared assist target pick missing');
must(petSrc.includes('petAssistRange'), 'training-wide assist range missing');
must(petSrc.includes('this.lungeT'), 'hit lunge juice missing');
must(petSrc.includes('fromEquip'), 'equip juice hook missing');
must(!/dt \* follow/.test(petSrc) || petSrc.includes('companionFollow'), 'old lerp follow still on combat pet');
must(eggSrc.includes('companionFollow'), 'egg pet must share snappy follow');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');
must(!/native\/android/.test(petSrc), 'no Android native in pet feel');

console.log('SMOKE_OK pets-feel: static follow + telegraph + juice');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) process.exit(0);

const outDir = '/tmp/sf-pets-feel';
fs.mkdirSync(outDir, { recursive: true });

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

async function runBrowser() {
  const port = Number(process.env.SF_PETS_FEEL_PORT || 8796);
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(() => {
    try {
      if (typeof companionFollow !== 'function') return { ok: false, why: 'companionFollow missing' };
      if (typeof Pet !== 'function' && typeof spawnGamePet !== 'function') {
        return { ok: false, why: 'Pet spawn missing' };
      }
      save.pets = save.pets || {};
      save.pets.pet_slymo = { at: Date.now(), kills: 12 };
      save.activePet = 'pet_slymo';
      save.reducedMotion = false;
      save.tipsSeen = save.tipsSeen || {};
      save.tipsSeen.moveBarAim = 1;
      if (typeof persist === 'function') persist();
      startGame('training');
      const g = game;
      if (!g || !g.player || !g.pet) return { ok: false, why: 'training pet missing' };
      const p = g.player;
      g.pet.x = p.x - 200;
      g.pet.y = p.y;
      const startGap = Math.abs(g.pet.x - p.x);
      for (let i = 0; i < 14; i++) g.pet.update(1 / 60);
      const endGap = Math.abs(g.pet.x - p.x);
      if (endGap > startGap * 0.45) {
        return { ok: false, why: 'follow still sluggish', startGap, endGap };
      }
      p.face = -1;
      g.pet._followFace = 1;
      const beforeFlip = g.pet.x;
      for (let i = 0; i < 10; i++) g.pet.update(1 / 60);
      const flipDelta = g.pet.x - beforeFlip;
      if (flipDelta < 18) {
        return { ok: false, why: 'face-flip follow too slow', flipDelta };
      }
      p.face = 1;
      p.vy = -420;
      p.onGround = false;
      const y0 = g.pet.y;
      for (let i = 0; i < 8; i++) g.pet.update(1 / 60);
      if (!(g.pet.y < y0 - 6)) {
        return { ok: false, why: 'jump follow did not lift', y0, y: g.pet.y };
      }
      p.vy = 0;
      p.onGround = true;
      g.over = false;
      g.inputLocked = false;
      g.phase = 'fight';
      if (g.robot) {
        g.robot.alive = true;
        g.robot.x = p.x + 80;
      }
      g.pet.assistT = 0.08;
      g.pet.update(1 / 60);
      if (!(g.pet.windT > 0.05)) {
        return {
          ok: false,
          why: 'telegraph did not wind',
          windT: g.pet.windT,
          assistT: g.pet.assistT,
          locked: g.inputLocked,
          mode: g.mode,
        };
      }
      if (g.robot) {
        g.robot.alive = true;
        g.robot.x = p.x + 2400;
        g.pet.assistT = 0;
        g.pet.assistCd = 5;
        g.pet.update(1 / 60);
        if (g.pet.assistT > 0.2) {
          return { ok: false, why: 'missed range burned full CD', assistT: g.pet.assistT };
        }
        g.robot.x = p.x + 80;
        g.pet.assistT = 0;
        g.pet.update(1 / 60);
        if (!(g.pet.flashT > 0) || !(g.pet.lungeT > 0)) {
          return { ok: false, why: 'assist juice missing', flashT: g.pet.flashT, lungeT: g.pet.lungeT };
        }
      }
      if (document.querySelector('[data-hub="versus"]')) return { ok: false, why: 'versus tile' };
      return { ok: true, startGap, endGap, windT: g.pet.windT };
    } catch (err) {
      return { ok: false, why: String(err && err.message || err) };
    }
  });

  if (result.ok) {
    await page.evaluate(() => {
      const splash = document.getElementById('sfSplash') || document.getElementById('splash');
      if (splash) splash.style.display = 'none';
      document.body.classList.add('is-playing');
      const g = game;
      if (!g || !g.pet || !g.player) return;
      g.over = false;
      g.inputLocked = false;
      g.pet.windT = 1;
      g.pet.windX = (g.robot && g.robot.x) || (g.player.x + 90);
      try { g.draw(ctx); } catch (_) {
        try { g.pet.draw(ctx); } catch (__) {}
      }
    });
    await new Promise((r) => setTimeout(r, 40));
    const shot = '/tmp/pets_assist_telegraph_readable.png';
    try {
      const cv = await page.$('#game');
      if (cv) await cv.screenshot({ path: shot });
      else await page.screenshot({ path: shot, fullPage: false });
      console.log('SMOKE_SHOT', shot);
    } catch (err) {
      console.log('SMOKE_SHOT_FAIL', String(err && err.message || err));
    }
  }

  await browser.close();
  if (server) try { server.close(); } catch (_) {}
  if (!result.ok) {
    console.error('SMOKE_FAIL pets-feel browser', result);
    process.exit(1);
  }
  console.log('SMOKE_OK pets-feel browser', result);
}

runBrowser().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
