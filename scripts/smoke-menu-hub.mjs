#!/usr/bin/env node
/**
 * Smoke: menu hub full-bleed layout contract (fase 1 harden).
 * Parses index.html — no browser. Fails if wireframe zones / IDs drift.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const menuMatch = html.match(/<div id="menuScreen"[\s\S]*?<\/div>\s*<div id="modeHubScreen"/);
if (!menuMatch) {
  console.error('SMOKE_FAIL menuScreen block not found before modeHubScreen');
  process.exit(1);
}
const menu = menuMatch[0];

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

must(/class="[^"]*\bmenu-video-overhaul\b/.test(menu), 'menuScreen missing menu-video-overhaul');
must(/class="[^"]*\bmenu-hub-landing\b/.test(menu), 'menuScreen missing menu-hub-landing');
must(/class="menu-stage"/.test(menu), 'missing .menu-stage (zone A)');
must(/id="menuHeroCanvas"/.test(menu), 'missing #menuHeroCanvas');
must(/class="menu-chrome"/.test(menu), 'missing .menu-chrome');
must(/class="[^"]*\bmenu-title-glass\b/.test(menu), 'missing title glass (zone B)');
must(/class="[^"]*\bmenu-game-grid\b/.test(menu) || /class="[^"]*\bhub-tile-grid\b/.test(menu), 'missing game grid (zone C)');
must((menu.match(/data-hub="/g) || []).length >= 4, 'expected ≥4 hub tiles');
must(/class="[^"]*\bmenu-utility-row\b/.test(menu), 'missing utility row');
must(/class="[^"]*\bmenu-lang-compact\b/.test(menu), 'missing lang compact (zone E)');
must(/id="menuLangBar"/.test(menu), 'missing #menuLangBar');
must(/class="[^"]*\bmenu-meta-dock\b/.test(menu), 'missing meta dock (zone D)');
must(/id="togMusic"/.test(menu) && /id="btnSettings"/.test(menu), 'missing meta dock buttons');
must(/id="btnContinue"/.test(menu), 'missing #btnContinue');
must(/id="menuProfileBar"/.test(menu), 'missing #menuProfileBar');

// Stage must be a sibling under menuScreen, not nested under chrome
const stageIdx = menu.indexOf('class="menu-stage"');
const chromeIdx = menu.indexOf('class="menu-chrome"');
must(stageIdx > 0 && chromeIdx > stageIdx, 'menu-stage must appear before menu-chrome');

// Play-layer safety: no nuclear display:none !important on .screen in overhaul CSS
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
must(!/\.screen\s*\{[^}]*display\s*:\s*none\s*!important/i.test(css), 'nuclear .screen display:none !important found');
must(/body\.is-playing #menuScreen \.menu-stage/.test(css), 'missing play-safe stage hide CSS');
must(/#menuScreen:not\(\.active\) \.menu-stage/.test(css), 'missing inactive-menu stage hide CSS');

// Version / SW alignment quick check
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const rev = storage.match(/SW_CACHE_REV\s*=\s*(\d+)/);
const cache = sw.match(/stickfighter-app-v(\d+)/);
must(rev && cache && rev[1] === cache[1], `SW mismatch storage=${rev && rev[1]} sw=${cache && cache[1]}`);


// Hub file icons (ASSET-STYLE batch)
const hubIcons = ['adventure', 'arcade', 'versus', 'collect', 'continue'];
for (const name of hubIcons) {
  const rel = `assets/buttons/hub/${name}.svg`;
  must(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
  must(html.includes(rel), `index.html missing <img> for ${rel}`);
}

console.log('SMOKE_OK menu hub layout + play-safe stage + hub SVGs');
