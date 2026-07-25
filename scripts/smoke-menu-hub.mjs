#!/usr/bin/env node
/**
 * Smoke: menu hub layout + all ASSET-STYLE button SVG files wired in HTML.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const menuMatch = html.match(/<div id="menuScreen"[\s\S]*?<\/div>\s*<div id="modeHubScreen"/);
must(menuMatch, 'menuScreen block not found');
const menu = menuMatch[0];

must(/menu-video-overhaul/.test(menu), 'missing menu-video-overhaul');
must(/class="menu-stage"/.test(menu), 'missing .menu-stage');
must(/id="menuHeroCanvas"/.test(menu), 'missing #menuHeroCanvas');
must(/menu-title-glass/.test(menu), 'missing title glass');
must(/menu-meta-dock/.test(menu), 'missing meta dock');
must(/menu-lang-compact/.test(menu), 'missing lang compact');
must((menu.match(/data-hub="/g) || []).length >= 4, 'expected ≥4 hub tiles');
must(/body\.is-playing #menuScreen \.menu-stage/.test(css), 'missing play-safe stage hide');
must(/sf-icon-broken/.test(css), 'missing broken-icon CSS');
must(/function hardenButtonIcons/.test(fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8')), 'missing hardenButtonIcons');

const hub = ['adventure', 'arcade', 'versus', 'collect', 'continue'];
const modes = ['training', 'wall', 'mats', 'weapons', 'pets', 'style', 'skills', 'upgrades', 'dex'];
const chrome = [
  'music', 'missions', 'settings', 'help', 'refresh', 'install', 'home',
  'claim', 'bonus', 'next', 'thumb', 'play', 'sfx', 'dice', 'skip',
];

function checkSet(dir, names) {
  for (const name of names) {
    const rel = `assets/buttons/${dir}/${name}.svg`;
    must(fs.existsSync(path.join(root, rel)), `missing file ${rel}`);
    must(html.includes(rel), `index.html missing ref ${rel}`);
    must(sw.includes(`./${rel}`) || sw.includes(rel), `sw.js missing precache ${rel}`);
  }
}

checkSet('hub', hub);
checkSet('modes', modes);
checkSet('chrome', chrome);

must(!/class="(?:ico|tog-ico)"><svg/.test(html), 'inline ico/tog-ico SVG still present — should be file icons');

const rev = storage.match(/SW_CACHE_REV\s*=\s*(\d+)/);
const cache = sw.match(/stickfighter-app-v(\d+)/);
must(rev && cache && rev[1] === cache[1], `SW mismatch storage=${rev && rev[1]} sw=${cache && cache[1]}`);

const svgCount = fs.readdirSync(path.join(root, 'assets/buttons/hub')).filter((f) => f.endsWith('.svg')).length
  + fs.readdirSync(path.join(root, 'assets/buttons/modes')).filter((f) => f.endsWith('.svg')).length
  + fs.readdirSync(path.join(root, 'assets/buttons/chrome')).filter((f) => f.endsWith('.svg')).length;
must(svgCount >= 40, `expected ≥40 button SVGs, got ${svgCount}`);


// assets/ui — saga / islands / ach / chrome helpers
const uiRoot = path.join(root, 'assets/ui');
must(fs.existsSync(uiRoot), 'missing assets/ui');
const saga = ['all', 'fighter', 'ki', 'scroll', 'tide', 'cape', 'dawn'];
for (const name of saga) {
  const rel = `assets/ui/saga/${name}.svg`;
  must(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
  must(html.includes(rel), `index.html missing saga ${rel}`);
  must(sw.includes(`./${rel}`) || sw.includes(rel), `sw missing ${rel}`);
}
const islands = ['east', 'fire', 'neon', 'temple', 'finale'];
for (const name of islands) {
  const rel = `assets/ui/islands/${name}.svg`;
  must(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
  must(storage.includes(rel), `storage.js missing island ${rel}`);
  must(sw.includes(`./${rel}`) || sw.includes(rel), `sw missing ${rel}`);
}
for (const name of ['lock', 'check', 'star', 'star-empty', 'pause', 'dice-d20', 'coin']) {
  const rel = `assets/ui/${name}.svg`;
  must(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
  must(sw.includes(`./${rel}`) || sw.includes(rel), `sw missing ${rel}`);
}
must(html.includes('assets/ui/pause.svg'), 'pauseBtn should use pause.svg');
must(html.includes('assets/ui/dice-d20.svg'), 'btnD20Roll should use dice-d20.svg');
must(html.includes('assets/buttons/chrome/back.svg'), 'back buttons should use back.svg');
must(html.includes('assets/buttons/chrome/swap.svg'), 'swap should use swap.svg');
must(!/<div class="char-saga-bar" id="charSagaBar"[\s\S]*?<svg /.test(html), 'charSagaBar still has inline SVG');
const uiJs = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
must(/function achIconSvg/.test(uiJs) && /assets\/ui\/ach\//.test(uiJs), 'achIconSvg should load assets/ui/ach');
must(/function islandIconHtml/.test(uiJs), 'missing islandIconHtml');
must(/function starGlyphs/.test(uiJs), 'missing starGlyphs');
const vsJs = fs.readFileSync(path.join(root, 'src/systems/versus.js'), 'utf8');
must(/assets\/ui\/saga\//.test(vsJs), 'sagaIconSvg should load assets/ui/saga');
const achCount = fs.readdirSync(path.join(root, 'assets/ui/ach')).filter((f) => f.endsWith('.svg')).length;
must(achCount >= 20, `expected ≥20 ach SVGs, got ${achCount}`);

console.log(`SMOKE_OK menu + ${svgCount} button SVGs + ${achCount} ach SVGs wired & precached`);
