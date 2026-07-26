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
must(!/<svg[\s>]/.test(html), 'inline <svg> still in index.html — should be assets/ files');

const uiSaga = ['all', 'fighter', 'ki', 'scroll', 'tide', 'cape', 'dawn'];
for (const name of uiSaga) {
  const rel = `assets/ui/saga-${name}.svg`;
  must(fs.existsSync(path.join(root, rel)), `missing file ${rel}`);
  must(html.includes(rel), `index.html missing ref ${rel}`);
  must(sw.includes(`./${rel}`) || sw.includes(rel), `sw.js missing precache ${rel}`);
}
for (const name of ['lock', 'check']) {
  const rel = `assets/ui/${name}.svg`;
  must(fs.existsSync(path.join(root, rel)), `missing file ${rel}`);
  must(sw.includes(`./${rel}`) || sw.includes(rel), `sw.js missing precache ${rel}`);
}
const uiDir = path.join(root, 'assets/ui');
const uiCount = fs.existsSync(uiDir)
  ? fs.readdirSync(uiDir).filter((f) => f.endsWith('.svg')).length
  : 0;
must(uiCount >= 25, `expected ≥25 ui SVGs, got ${uiCount}`);
must(/assets\/ui\//.test(fs.readFileSync(path.join(root, 'src/systems/versus.js'), 'utf8')), 'versus.js missing assets/ui saga refs');
must(/assets\/ui\//.test(fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8')), 'ui.js missing assets/ui ach/lock refs');
must(/assets\/ui\/island-/.test(storage), 'storage.js missing island file icons');

/** Invalid encoding (e.g. Windows-1252 en-dash) breaks Safari/iPad <img> SVG loads. */
function assertUtf8Svgs(dir, base = 'assets/buttons') {
  const abs = path.join(root, base, dir);
  const dec = new TextDecoder('utf-8', { fatal: true });
  for (const name of fs.readdirSync(abs).filter((f) => f.endsWith('.svg'))) {
    const buf = fs.readFileSync(path.join(abs, name));
    let text;
    try {
      text = dec.decode(buf);
    } catch (e) {
      must(false, `non-utf8 SVG ${base}/${dir}/${name}`);
    }
    must(/<svg[\s>]/.test(text), `empty/invalid SVG ${base}/${dir}/${name}`);
    must(/(<path|<circle|<rect|<ellipse|<polygon)/.test(text), `no shapes in ${base}/${dir}/${name}`);
  }
}
assertUtf8Svgs('hub');
assertUtf8Svgs('modes');
assertUtf8Svgs('chrome');
assertUtf8Svgs('.', 'assets/ui');

const rev = storage.match(/SW_CACHE_REV\s*=\s*(\d+)/);
const cache = sw.match(/stickfighter-app-v(\d+)/);
must(rev && cache && rev[1] === cache[1], `SW mismatch storage=${rev && rev[1]} sw=${cache && cache[1]}`);

const svgCount = fs.readdirSync(path.join(root, 'assets/buttons/hub')).filter((f) => f.endsWith('.svg')).length
  + fs.readdirSync(path.join(root, 'assets/buttons/modes')).filter((f) => f.endsWith('.svg')).length
  + fs.readdirSync(path.join(root, 'assets/buttons/chrome')).filter((f) => f.endsWith('.svg')).length;
must(svgCount >= 40, `expected ≥40 button SVGs, got ${svgCount}`);

console.log(`SMOKE_OK menu + ${svgCount} button SVGs + ${uiCount} ui SVGs wired & precached`);
