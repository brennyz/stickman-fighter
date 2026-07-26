#!/usr/bin/env node
/**
 * Render ASSET-STYLE button/saga SVG sheets → PNG via headless Chrome.
 * Output: assets/buttons/_preview/all.png (+ _sheet.html)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/buttons/_preview');
const tmpHtml = path.join(outDir, '_sheet.html');
const png = path.join(outDir, 'all.png');

const sets = {
  hub: { title: 'Hub', dir: 'assets/buttons/hub' },
  modes: { title: 'Modes', dir: 'assets/buttons/modes' },
  chrome: { title: 'Chrome / nav', dir: 'assets/buttons/chrome' },
  saga: { title: 'Saga UI', dir: 'assets/ui', filter: (f) => f.startsWith('saga-') && f.endsWith('.svg') },
};

function listSvgs(dir, filter) {
  return fs.readdirSync(path.join(root, dir))
    .filter((f) => (filter ? filter(f) : f.endsWith('.svg')))
    .sort();
}

function dataUri(rel) {
  const svg = fs.readFileSync(path.join(root, rel), 'utf8');
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function section(meta) {
  const files = listSvgs(meta.dir, meta.filter);
  const cells = files.map((f) => {
    const src = dataUri(path.join(meta.dir, f));
    const label = f.replace(/\.svg$/, '');
    return `<div class="cell"><div class="tile"><img src="${src}" alt=""></div><span>${label}</span></div>`;
  }).join('\n');
  return `<h2>${meta.title}</h2><div class="grid">${cells}</div>`;
}

const html = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="utf-8">
<title>Stickman menu SVG preview</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:28px 32px 40px}
  h1{font-family:Georgia,serif;color:#ffd75e;font-size:28px;margin:0 0 6px;letter-spacing:.02em}
  .sub{opacity:.7;margin:0 0 22px;font-size:13px}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:.12em;color:#9db1e3;margin:22px 0 10px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:12px}
  .cell{display:flex;flex-direction:column;align-items:center;gap:8px}
  .tile{width:72px;height:72px;border-radius:16px;background:linear-gradient(180deg,#2a3348,#1a2030);
    box-shadow:0 6px 0 #0a0d18, inset 0 0 0 1px rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:center}
  .tile img{width:36px;height:36px}
  span{font-size:11px;font-weight:700;opacity:.85;text-align:center}
</style></head><body>
<h1>Stickman Fighter — menu SVG</h1>
<p class="sub">ASSET-STYLE nav · hub · modes · chrome · saga · stroke-first arcade</p>
${Object.values(sets).map(section).join('\n')}
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(tmpHtml, html, 'utf8');

const chromeBin = fs.existsSync('/opt/google/chrome/chrome')
  ? '/opt/google/chrome/chrome'
  : (process.env.CHROME_PATH || 'google-chrome');
const userData = path.join(outDir, '.chrome-ud');
fs.mkdirSync(userData, { recursive: true });
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  `--user-data-dir=${userData}`,
  '--window-size=1200,1100',
  `--screenshot=${png}`,
  `file://${tmpHtml}`,
];
const r = spawnSync(chromeBin, args, { encoding: 'utf8', timeout: 45000 });
if (r.error) {
  console.error(r.error);
  process.exit(1);
}
if (!fs.existsSync(png) || fs.statSync(png).size < 1000) {
  console.error('preview PNG missing or tiny');
  process.exit(1);
}
console.log('OK preview →', png, `(${fs.statSync(png).size} bytes)`);
console.log('HTML sheet →', tmpHtml);
