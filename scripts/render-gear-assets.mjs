#!/usr/bin/env node
/**
 * Write pixel-art SVGs + preview sheet from src/data/gear.js (single source).
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = fs.readFileSync(path.join(root, 'src/data/gear.js'), 'utf8');
const world = fs.readFileSync(path.join(root, 'src/data/gear-world.js'), 'utf8');
const sandbox = { Date, Math, Object, Array, String, Number, JSON, console };
vm.createContext(sandbox);
vm.runInContext(catalog + '\n' + world + '\nthis.GEAR_ITEMS=GEAR_ITEMS;this.gearPixelsToSvg=gearPixelsToSvg;', sandbox);

const items = sandbox.GEAR_ITEMS;
const toSvg = sandbox.gearPixelsToSvg;
if (!Array.isArray(items) || typeof toSvg !== 'function') {
  console.error('GEAR_ITEMS / gearPixelsToSvg missing');
  process.exit(1);
}

const outDir = path.join(root, 'assets/gear');
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  if (f.startsWith('g_') && f.endsWith('.svg')) fs.unlinkSync(path.join(outDir, f));
}

for (const it of items) {
  const svg = toSvg(it.id);
  if (!svg || !svg.includes('<rect')) {
    console.error('missing pixels for', it.id);
    process.exit(1);
  }
  fs.writeFileSync(path.join(outDir, it.id + '.svg'), svg, 'utf8');
}

const previewDir = path.join(outDir, '_preview');
fs.mkdirSync(previewDir, { recursive: true });

const cells = items.map((it) => {
  const svg = fs.readFileSync(path.join(outDir, it.id + '.svg'), 'utf8');
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const gate = [
    `Lv ${it.unlockLvl || 1}`,
    it.unlockDays ? `${it.unlockDays}d` : null,
    it.needDiff || it.dropZone || null,
  ].filter(Boolean).join(' · ');
  return `<div class="cell">
    <div class="tile"><img src="${uri}" alt=""></div>
    <b>${it.id}</b>
    <span>${it.name} · ${it.slot} · ${it.rarity}</span>
    <span class="gate">${gate}</span>
  </div>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Stickman gear pixel preview</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:28px 32px 40px}
  h1{font-family:Georgia,serif;color:#ffd75e;font-size:26px;margin:0 0 6px}
  .sub{opacity:.7;margin:0 0 22px;font-size:13px;max-width:760px;line-height:1.45}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .cell{display:flex;flex-direction:column;align-items:center;gap:6px}
  .tile{width:80px;height:80px;border-radius:14px;background:linear-gradient(180deg,#2a3348,#1a2030);
    box-shadow:0 6px 0 #0a0d18, inset 0 0 0 1px rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:center;image-rendering:pixelated}
  .tile img{width:56px;height:56px;image-rendering:pixelated;image-rendering:crisp-edges}
  b{font-size:10px;color:#7cf5ff;word-break:break-all;text-align:center}
  span{font-size:11px;font-weight:700;opacity:.85;text-align:center}
  .gate{opacity:.55;font-weight:600}
</style></head><body>
<h1>Stickman Fighter — gear pixels</h1>
<p class="sub">World-drop armour / cosmetics. Systems IDs <code>{slot}_{kind}_{slug}</code>,
slots head · chest · hands · legs · back. 16×16 ASSET-STYLE pixel.</p>
<div class="grid">${cells}</div>
</body></html>`;
const sheet = path.join(previewDir, '_sheet.html');
fs.writeFileSync(sheet, html, 'utf8');

const chromeBin = fs.existsSync('/opt/google/chrome/chrome')
  ? '/opt/google/chrome/chrome'
  : (process.env.CHROME_PATH || '');
const png = path.join(previewDir, 'all.png');
if (chromeBin && fs.existsSync(chromeBin)) {
  const userData = path.join(previewDir, '.chrome-ud');
  fs.mkdirSync(userData, { recursive: true });
  const r = spawnSync(chromeBin, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--hide-scrollbars', `--user-data-dir=${userData}`,
    `--screenshot=${png}`, '--window-size=1400,4800',
    'file://' + sheet,
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.warn('chrome preview skip:', (r.stderr || r.stdout || '').slice(0, 200));
  }
}

console.log(JSON.stringify({
  ok: true,
  items: items.length,
  sheet: 'assets/gear/_preview/_sheet.html',
  png: fs.existsSync(png) ? 'assets/gear/_preview/all.png' : null,
}));
