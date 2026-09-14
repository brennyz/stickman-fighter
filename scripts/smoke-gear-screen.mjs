#!/usr/bin/env node
/**
 * Gear char-screen: bind to #280 systems API + save.gear + filter/scroll.
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

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src/data/gear.js'), 'utf8');
const uiAdapt = fs.readFileSync(path.join(root, 'src/systems/gear.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');

must(/id="gearScreen"/.test(html), 'missing #gearScreen');
must(/id="btnGear"/.test(html), 'missing Collection Character tile');
must(/id="gearSlotList"/.test(html), 'missing #gearSlotList');
must(/id="gearWeaponAside"/.test(html), 'missing weapon aside');
must(/id="gearDollCanvas"/.test(html), 'missing stickman preview');
must(/id="gearFilterBar"/.test(html) && /id="gearFilterQ"/.test(html), 'filter bar + search required for 131 catalog');
must(!/data-gear-slot="arms"/.test(html) && !/data-gear-slot="aura"/.test(html), 'legacy arms/aura slots must not be in HTML');
must(/hub-tile-gear/.test(html), 'Character tile must use HOME hub-tile chrome');

must(/const GEAR_SLOT_IDS = \['head', 'chest', 'hands', 'legs', 'back'\]/.test(data), 'GEAR_SLOT_IDS contract');
must(/function gearTooltipModel/.test(data), 'gearTooltipModel missing');
must(/function gearEquipItem/.test(data), 'gearEquipItem missing');
must(/function gearRenderDescriptor/.test(data), 'gearRenderDescriptor missing');
must(/function sanitizeGearSave/.test(data), 'sanitizeGearSave missing');
must(/gearEquipItem/.test(uiAdapt) && /gearTooltipModel/.test(uiAdapt) && /gearRenderDescriptor/.test(uiAdapt), 'UI adapter must bind systems helpers');
must(/merged\.gear/.test(storage) && /out\.gear = sanitizeGearSave/.test(storage), 'storage must wire save.gear');
must(/createdAt: 0/.test(storage), 'DEFAULT_SAVE.createdAt missing');
must(/equipment: \{ head: null, chest: null, hands: null, legs: null, back: null \}/.test(storage), 'DEFAULT_SAVE.equipment missing');
must(/ownedGear: \{\}/.test(storage), 'DEFAULT_SAVE.ownedGear missing');
must(/gear: \{ schema: 1/.test(storage), 'DEFAULT_SAVE.gear missing');
must(/renderGear/.test(ui) && /gearScreen/.test(ui), 'UI must render + navigate gearScreen');
must(/gearEquipItem/.test(ui) && /gearTooltipModel/.test(ui) && /gearRenderDescriptor/.test(ui), 'renderGear must call systems bind helpers');
must(/btnGear',\s*'hub\.gear'/.test(i18n), 'Character tile must be i18n-wired');
must(/--menu-tile-solid/.test(css.match(/\.gear-slot-card \{[\s\S]*?\}/)?.[0] || ''), 'slot cards must use HOME tiles');
must(/min-height:\s*max\(56px,\s*var\(--touch-min\)\)/.test(css), 'Android touch floor missing on slot cards');
must(!/\.gear-picker \{[\s\S]{0,160}max-height/.test(css), 'picker must not nest-scroll (one page scroll)');
must(/save\.equipment/.test(uiAdapt) && /ownedGear/.test(uiAdapt), 'v1 save.equipment + ownedGear missing');
must(/needLvl/.test(uiAdapt) && /needTrain/.test(uiAdapt) && /needDex/.test(uiAdapt) && /needTime/.test(uiAdapt), 'v1 item lock fields missing');
must(/\.gear-filter-btn/.test(css), 'filter chips CSS missing');
must(!/\.screen\s*\{\s*display:\s*none\s*!important/.test(css), 'nuclear display:none forbidden');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) {
  console.log('SMOKE_OK gear-screen (static only, no chrome)');
  process.exit(0);
}

const outDir = '/tmp/sf-gear-ui';
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

async function run() {
  const port = Number(process.env.SF_GEAR_PORT || 8799);
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
      const ids = (typeof GEAR_SLOT_IDS !== 'undefined') ? GEAR_SLOT_IDS.slice() : [];
      if (ids.join(',') !== 'head,chest,hands,legs,back') {
        return { ok: false, why: 'GEAR_SLOT_IDS', ids };
      }
      if (typeof GEAR_ITEMS === 'undefined' || GEAR_ITEMS.length < 100) {
        return { ok: false, why: 'catalog too small', n: typeof GEAR_ITEMS === 'undefined' ? 0 : GEAR_ITEMS.length };
      }
      if (typeof gearTooltipModel !== 'function' || typeof gearEquipItem !== 'function' || typeof gearRenderDescriptor !== 'function') {
        return { ok: false, why: 'systems bind helpers missing' };
      }

      UI.openModeHub('collect');
      const tile = document.getElementById('btnGear');
      if (!tile || tile.hidden) return { ok: false, why: 'btnGear missing on collect hub' };
      UI.safeOpen('gearScreen', () => UI.renderGear());
      const screen = document.getElementById('gearScreen');
      if (!screen || !screen.classList.contains('active')) return { ok: false, why: 'gearScreen not active' };
      const cards = [...document.querySelectorAll('#gearSlotList [data-slot]')];
      if (cards.length !== 5) return { ok: false, why: 'need 5 slot cards', n: cards.length };
      const cardIds = cards.map((c) => c.getAttribute('data-slot'));
      if (cardIds.join(',') !== 'head,chest,hands,legs,back') return { ok: false, why: 'card ids', cardIds };
      const tooSmall = cards.filter((c) => c.getBoundingClientRect().height < 44);
      if (tooSmall.length) return { ok: false, why: 'touch <44', h: tooSmall[0].getBoundingClientRect().height };
      const titleEl = cards[0] && cards[0].querySelector('.gear-slot-title');
      const subEl = cards[0] && cards[0].querySelector('.gear-slot-sub');
      if (!titleEl || !subEl) return { ok: false, why: 'slot title/sub missing' };
      const titleBox = titleEl.getBoundingClientRect();
      const subBox = subEl.getBoundingClientRect();
      if (Math.abs(titleBox.top - subBox.top) < 8) {
        return { ok: false, why: 'slot title/sub stacked inline', title: titleEl.textContent, sub: subEl.textContent };
      }

      const chips = [...document.querySelectorAll('#gearFilterBar [data-gear-filter]')];
      if (chips.length < 5) return { ok: false, why: 'filter chips', n: chips.length };
      const q = document.getElementById('gearFilterQ');
      if (!q) return { ok: false, why: 'search missing' };

      if (!save.equipment || !save.ownedGear) return { ok: false, why: 'v1 save.equipment / ownedGear missing' };
      if (!save.gear || save.gear.schema !== 1 || !save.gear.equipped || !save.gear.owned) {
        return { ok: false, why: 'save.gear mirror missing after boot' };
      }
      if (save.equipment.head !== 'head_wrap_cloth' && save.gear.equipped.head !== 'head_wrap_cloth') {
        return { ok: false, why: 'starter head not equipped', head: save.equipment.head };
      }

      const desc = gearRenderDescriptor(save);
      if (!desc || !desc.slots || desc.slots.length !== 5) return { ok: false, why: 'gearRenderDescriptor' };
      const tip = gearTooltipModel(gearItemById('head_wrap_cloth'));
      if (!tip || !tip.vanity || tip.appliesStats) return { ok: false, why: 'tooltip vanity starter', tip };

      const locked = gearEquipItem('head_helm_iron');
      if (locked && locked.ok) return { ok: false, why: 'lvl-gated helm must refuse at default lvl' };
      if (save.equipment.head === 'head_helm_iron' || save.gear.equipped.head === 'head_helm_iron') {
        return { ok: false, why: 'locked item leaked into slot' };
      }

      const missing = gearEquipItem('head_bandana_blue');
      if (missing && missing.ok) return { ok: false, why: 'unowned/gated bandana must refuse' };

      unequipGear('head');
      if (save.equipment.head) return { ok: false, why: 'unequip did not clear equipment.head' };
      const wear = equipGear('head_wrap_cloth');
      if (!wear || !wear.ok) return { ok: false, why: 're-equip starter failed', wear };
      if (save.equipment.head !== 'head_wrap_cloth') return { ok: false, why: 'save.equipment.head not set' };
      if (!save.ownedGear.head_wrap_cloth) return { ok: false, why: 'ownedGear starter missing' };

      const dirty = sanitizeGearSave({
        schema: 1,
        equipped: { head: 'head_helm_iron', chest: null, hands: null, legs: null, back: null },
        owned: { head_helm_iron: { at: 1, src: 'grant' } },
      }, Object.assign({}, save, { lvl: 1, gear: save.gear }), Date.now());
      if (dirty.equipped.head === 'head_helm_iron') return { ok: false, why: 'sanitize kept locked helm' };

      UI.gearFilter = 'look';
      UI.renderGear();
      const lookCards = [...document.querySelectorAll('#gearPicker [data-gear-id]')];
      if (!lookCards.length) return { ok: false, why: 'LOOK filter empty' };
      const lookStatLeak = lookCards.some((c) => {
        const it = gearItemById(c.getAttribute('data-gear-id'));
        return it && gearItemHasCombatStats(it);
      });
      if (lookStatLeak) return { ok: false, why: 'LOOK filter showed STAT item' };

      UI.gearFilter = 'all';
      UI.gearFilterQ = 'helm';
      UI.renderGear();
      const searched = [...document.querySelectorAll('#gearPicker [data-gear-id]')];
      if (!searched.length) return { ok: false, why: 'search helm empty' };
      if (searched.some((c) => !/helm/i.test(c.textContent + c.getAttribute('data-gear-id')))) {
        return { ok: false, why: 'search leaked non-helm' };
      }

      UI.gearFilterQ = '';
      UI.renderGear();
      const aside = document.getElementById('gearWeaponAside');
      if (!aside || !aside.textContent) return { ok: false, why: 'weapon aside empty' };
      const look = [...document.querySelectorAll('.gear-pill-vanity')];
      const stat = [...document.querySelectorAll('.gear-pill-stat')];
      if (!look.length || !stat.length) return { ok: false, why: 'LOOK/STAT pills missing' };

      return {
        ok: true,
        ids,
        catalog: GEAR_ITEMS.length,
        aside: aside.textContent.slice(0, 80),
        cards: cardIds,
        lookN: lookCards.length,
      };
    } catch (e) {
      return { ok: false, why: String(e && e.stack || e) };
    }
  });

  await browser.close();
  try { if (server && server.close) server.close(); } catch (_) {}
  if (!result || !result.ok) {
    console.error('SMOKE_FAIL gear-screen', result);
    process.exit(1);
  }
  console.log('SMOKE_OK gear-screen', result.cards.join(','), result.catalog, result.aside);
}

run().catch((err) => {
  console.error('SMOKE_FAIL gear-screen', err);
  process.exit(1);
});
