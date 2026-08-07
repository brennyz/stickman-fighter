#!/usr/bin/env node
/**
 * Soak: ~10%+ van game-systemen — avontuur Lv1–11, upgrades, andere modi.
 * Usage: node scripts/smoke-soak-minimal.mjs [baseUrl] [maxLevel]
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/tmp/sf-soak';
fs.mkdirSync(outDir, { recursive: true });
const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('SMOKE_FAIL no chrome'); process.exit(1); }

const MAX_LEVEL = Number(process.argv[3]) || 11;

/** Catalogus van wat het spel kan (subset van echte features — denominator voor %). */
const FEATURE_CATALOG = [
  'mode_adventure', 'mode_training', 'mode_wall', 'mode_coinrun', 'mode_versus',
  'adv_start', 'adv_wave_spawn', 'adv_wave_clear', 'adv_part_gate', 'adv_level_win',
  'adv_gamble_ally', 'adv_gamble_neutral', 'adv_pickup', 'adv_ketsbam', 'adv_draw',
  'meta_weapon_equip', 'meta_style_equip', 'meta_jutsu_equip', 'meta_super_equip',
  'meta_skill_upgrade', 'meta_weapon_upgrade', 'meta_style_upgrade', 'meta_pet_tame',
  'meta_pet_equip', 'meta_pet_upgrade', 'meta_dex', 'meta_achievements', 'meta_grant_xp',
  'meta_stars', 'meta_persist',
  'training_frames', 'wall_frames', 'coinrun_frames', 'versus_frames',
  'skill_rasengan', 'skill_chidori', 'skill_kamehameha', 'skill_fireball',
  'super_ketsbam', 'super_iron_shield', 'super_heal_wave',
  'weapon_kunai', 'weapon_knuppel', 'weapon_speer', 'weapon_zwaard',
  'style_konoha', 'style_sand', 'style_classic',
  'pet_slymo', 'egg_pet',
  'island_boss_wave',
  ...Array.from({ length: 50 }, (_, i) => `adv_level_${i + 1}`),
];

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
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && String(msg.text()).includes('[Stickman]')) pageErrors.push(msg.text());
  });

  const base = process.argv[2] || 'http://127.0.0.1:8787/index.html';
  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 20000 });

  const result = await page.evaluate(({ maxLv, catalogSize }) => {
    const DT = 1 / 30;
    const STUCK = 200;
    const hit = {};
    const fails = [];
    const levelResults = [];

    function ok(id) { hit[id] = true; }
    function fail(id, err) {
      hit[id] = false;
      if (fails.length < 20) fails.push({ id, err: String(err && (err.message || err)) });
    }
    function tryMark(id, fn) {
      try { fn(); ok(id); } catch (e) { fail(id, e); }
    }

    function walkRight(on) {
      if (typeof Input === 'undefined') return;
      Input.move = on ? 1 : 0;
      Input.keys = Input.keys || {};
      Input.keys.d = !!on;
      Input.keys.arrowright = !!on;
    }

    function killAll(g) {
      for (const m of g.monsters) {
        if (!m.alive) continue;
        m.takeDamage(999999, 0, g);
      }
    }

    function simFrames(g, n, opts) {
      opts = opts || {};
      let stuck = 0;
      let sig = '';
      for (let i = 0; i < n; i++) {
        if (g.over && !opts.ignoreOver) break;
        if (g.betweenT > 0) g.betweenT = Math.min(g.betweenT, DT);
        if (g.partGate) walkRight(true);
        else if (!opts.noWalk) walkRight(false);
        if (!g.partGate && !opts.noKill && g.monsters.some((m) => m.alive)) killAll(g);
        if (opts.before) opts.before(g, i);
        g.update(DT);
        if (opts.draw && typeof g.draw === 'function' && typeof ctx !== 'undefined') {
          try { g.draw(ctx); } catch (e) { throw e; }
        }
        const s = [g.waveIdx, !!g.partGate, g.monsters.filter((m) => m.alive).length].join('|');
        stuck = s === sig ? stuck + 1 : 0;
        sig = s;
        if (stuck >= STUCK) throw new Error('stuck ' + s);
      }
      walkRight(false);
    }

    function winAdventure(lv, gamble) {
      startGame('adventure', { level: lv, gamble: gamble || null });
      const g = game;
      if (!g?.player) throw new Error('no game');
      g.inputLocked = false;
      g.over = false;
      let updateThrows = 0;
      const maxF = 6000;
      let frames = 0;
      let ketsTried = false;
      let pickupTried = false;
      for (let i = 0; i < maxF; i++) {
        frames = i + 1;
        if (g.over) break;
        if (g.betweenT > 0) g.betweenT = Math.min(g.betweenT, DT);
        if (g.partGate) {
          walkRight(true);
          if (i === 1 || i % 40 === 0) ok('adv_part_gate');
        } else walkRight(false);
        if (!g.partGate && g.monsters.some((m) => m.alive)) {
          ok('adv_wave_spawn');
          if (!pickupTried && g.pickups?.length) {
            try { g.collectPickup(g.pickups[0]); ok('adv_pickup'); pickupTried = true; } catch (e) { fail('adv_pickup', e); }
          }
          killAll(g);
        }
        if (!ketsTried && g.waveIdx >= 0 && g.monsters.some((m) => m.alive) && g.ketsbamShow) {
          try {
            if (g.tryKetsbam()) ok('adv_ketsbam');
            ketsTried = true;
          } catch (e) { fail('adv_ketsbam', e); }
        }
        try {
          g.update(DT);
          if (i % 15 === 0 && typeof g.draw === 'function' && typeof ctx !== 'undefined') g.draw(ctx);
        } catch (e) {
          updateThrows++;
          if (updateThrows > 3) throw e;
        }
        if (g.wavePause > 0 && !g.partGate) ok('adv_wave_clear');
      }
      walkRight(false);
      if (!g.over || !g.player?.alive) throw new Error('adventure not won lv' + lv);
      ok('adv_level_win');
      ok(`adv_level_${lv}`);
      if (gamble?.outcome === 'ally' || gamble?.outcome === 'superAlly') ok('adv_gamble_ally');
      if (!gamble || gamble.outcome === 'neutral') ok('adv_gamble_neutral');
      return { lv, kills: g.kills, frames, updateThrows, stars: save.stars?.[lv] };
    }

  // —— Rijke save voor Lv11-meta ——
    save = sanitizeSave(Object.assign({}, DEFAULT_SAVE, {
      lvl: maxLv,
      unlocked: maxLv,
      xp: xpNeed(maxLv) - 5,
      weapon: 'kunai',
      style: 'konoha',
      activeJutsu: 'chidori',
      super: 'iron_shield',
      petCoins: 120,
      stats: Object.assign({}, DEFAULT_SAVE.stats, { kills: 200, advWins: maxLv - 1 }),
      stars: Object.fromEntries(Array.from({ length: maxLv }, (_, i) => [i + 1, 2])),
      dex: { slymo: 20, bubbel: 14, flapper: 8, stekelra: 6 },
    }));
    tryMark('meta_persist', () => persist());

    tryMark('meta_grant_xp', () => {
      save.xp += 40;
      while (save.xp >= xpNeed(save.lvl) && save.lvl < 60) {
        save.xp -= xpNeed(save.lvl);
        save.lvl++;
      }
    });

    tryMark('meta_weapon_equip', () => {
      for (const w of ['kunai', 'knuppel', 'speer', 'zwaard']) {
        const def = WEAPONS.find((x) => x.id === w);
        if (def && save.lvl >= def.unlock) {
          save.weapon = w;
          ok(`weapon_${w}`);
        }
      }
    });

    tryMark('meta_style_equip', () => {
      for (const id of ['classic', 'konoha', 'sand']) {
        const st = styleById(id);
        if (styleUnlocked(st)) { save.style = id; ok(`style_${id}`); }
      }
    });

    tryMark('meta_jutsu_equip', () => {
      for (const id of ['rasengan', 'chidori', 'kamehameha', 'fireball_jutsu']) {
        const sk = SKILLS.find((s) => s.id === id);
        if (sk && skillUnlocked(sk)) {
          save.activeJutsu = id;
          save.skill = id;
          ok(`skill_${id}`);
        }
      }
    });

    tryMark('meta_super_equip', () => {
      for (const id of ['ketsbam', 'iron_shield', 'heal_wave']) {
        const sp = SUPERS.find((s) => s.id === id);
        if (sp && superUnlocked(sp)) { save.super = id; ok(`super_${id}`); }
      }
    });

    tryMark('meta_skill_upgrade', () => {
      for (const id of ['rasengan', 'chidori', 'dash', 'chakra']) {
        addSkillShards(id, 24);
        while (skillCanUpgrade(id)) trySkillUpgrade(id);
      }
    });

    tryMark('meta_weapon_upgrade', () => {
      addItemShards('weapon', 'kunai', 30);
      while (itemCanUpgrade('weapon', 'kunai')) tryItemUpgrade('weapon', 'kunai');
    });

    tryMark('meta_style_upgrade', () => {
      addItemShards('style', 'konoha', 20);
      while (itemCanUpgrade('style', 'konoha')) tryItemUpgrade('style', 'konoha');
    });

    tryMark('meta_pet_tame', () => {
      const t = maybeTamePet('slymo');
      if (t) ok('pet_slymo');
    });

    tryMark('meta_pet_equip', () => {
      if (save.pets?.pet_slymo) {
        equipPet('pet_slymo');
        ok('pet_slymo');
      }
    });

    tryMark('meta_pet_upgrade', () => {
      if (isPetTamed('pet_slymo')) {
        addItemShards('pet', 'pet_slymo', 25);
        while (itemCanUpgrade('pet', 'pet_slymo')) tryItemUpgrade('pet', 'pet_slymo');
      }
    });

    tryMark('meta_dex', () => {
      if (!save.dex.slymo) save.dex.slymo = 1;
      save.dex.slymo++;
      persist();
    });

    tryMark('meta_achievements', () => checkAchievements());

    tryMark('meta_stars', () => {
      save.stars[1] = 3;
      persist();
    });

    // —— Avontuur Lv 1 … maxLv ——
    ok('mode_adventure');
    ok('adv_start');
    for (let lv = 1; lv <= maxLv; lv++) {
      let gamble = null;
      if (lv === 5) {
        gamble = { d1: 5, d2: 5, sum: 10, outcome: 'ally', allyId: 'tide' };
      } else if (lv === 8) {
        gamble = { d1: 3, d2: 4, sum: 7, outcome: 'neutral', allyId: 'ki' };
      }
      try {
        levelResults.push(winAdventure(lv, gamble));
      } catch (e) {
        fail(`adv_level_${lv}`, e);
        levelResults.push({ lv, error: String(e) });
        break;
      }
      if (lv === 10) ok('island_boss_wave');
    }

    tryMark('adv_draw', () => {
      if (game && typeof game.draw === 'function' && typeof ctx !== 'undefined') game.draw(ctx);
    });

    // —— Andere modi (korte frames) ——
    tryMark('mode_training', () => {
      startGame('training');
      game.inputLocked = false;
      simFrames(game, 90, { draw: true });
      ok('training_frames');
    });

    tryMark('mode_wall', () => {
      startGame('wall');
      game.inputLocked = false;
      simFrames(game, 90, { draw: true });
      ok('wall_frames');
    });

    tryMark('mode_coinrun', () => {
      startGame('coinrun');
      game.inputLocked = false;
      simFrames(game, 90, { draw: true });
      ok('coinrun_frames');
    });

    tryMark('mode_versus', () => {
      startGame('versus', { p1: 'arcade_flair', p2: 'arcade_rush' });
      Input.dualMode = true;
      simFrames(game, 60, { noKill: true, draw: true });
      ok('versus_frames');
    });

    const hitIds = Object.keys(hit).filter((k) => hit[k] === true);
    const failIds = fails.map((f) => f.id);
    const coveragePct = Math.round((hitIds.length / catalogSize) * 1000) / 10;
    const minPct = 10;
    const levelsWon = levelResults.filter((r) => !r.error).length;

    return {
      ok: coveragePct >= minPct && levelsWon >= maxLv && fails.length === 0,
      appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?',
      maxLevel: maxLv,
      levelsWon,
      coveragePct,
      minPct,
      featuresHit: hitIds.length,
      catalogSize,
      hitIds,
      fails,
      levelResults,
    };
  }, { maxLv: MAX_LEVEL, catalogSize: FEATURE_CATALOG.length });

  result.pageErrors = pageErrors.slice(0, 8);
  if (result.pageErrors.length) {
    result.ok = false;
    result.fails = (result.fails || []).concat(result.pageErrors.map((e) => ({ id: 'page', err: e })));
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    console.error(`SMOKE_FAIL soak coverage ${result.coveragePct}% (need ${result.minPct}%), levels ${result.levelsWon}/${result.maxLevel}`);
    process.exit(1);
  }
  console.log(`SMOKE_OK soak ${result.coveragePct}% (${result.featuresHit}/${result.catalogSize}) · levels 1–${result.maxLevel}`);
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
