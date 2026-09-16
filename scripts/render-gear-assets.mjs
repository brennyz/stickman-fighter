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

function cellHtml(it) {
  const svg = fs.readFileSync(path.join(outDir, it.id + '.svg'), 'utf8');
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const gate = [
    `Lv ${it.unlockLvl || 1}`,
    it.unlockDays ? `${it.unlockDays}d` : null,
    it.needDiff || null,
  ].filter(Boolean).join(' · ');
  return `<div class="cell">
    <div class="tile"><img src="${uri}" alt=""></div>
    <b>${it.id}</b>
    <span>${(it.nameEn || it.name)} · ${it.slot} · ${it.rarity}</span>
    <span class="gate">${gate}</span>
  </div>`;
}
const cells = items.map(cellHtml).join('\n');
const sampleItems = items.filter((_, i) => i < 24 || (i % 8 === 0)).slice(0, 32);
const sampleCells = sampleItems.map(cellHtml).join('\n');

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Stickman gear pixel preview</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:28px 32px 40px}
  h1{font-family:Georgia,serif;color:#ffd75e;font-size:26px;margin:0 0 6px}
  .sub{opacity:.7;margin:0 0 22px;font-size:13px;max-width:760px;line-height:1.45}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
  .cell{display:flex;flex-direction:column;align-items:center;gap:6px}
  .tile{width:96px;height:96px;border-radius:14px;background:linear-gradient(180deg,#2a3348,#1a2030);
    box-shadow:0 6px 0 #0a0d18, inset 0 0 0 1px rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:center;image-rendering:pixelated}
  .tile img{width:72px;height:72px;image-rendering:pixelated;image-rendering:crisp-edges}
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
const sampleHtml = html.replace(cells, sampleCells).replace('gear pixels', 'gear pixels (sample)');
const sampleSheet = path.join(previewDir, '_sample.html');
fs.writeFileSync(sampleSheet, sampleHtml, 'utf8');

function svgUri(id) {
  const svg = fs.readFileSync(path.join(outDir, id + '.svg'), 'utf8');
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

const pickupIds = [
  { id: 'head_bandana_blue', scale: 2, ring: null, label: 'common' },
  { id: 'chest_plate_iron', scale: 2.25, ring: '#7eb6ff', label: 'rare' },
  { id: 'back_wings_hell', scale: 2.75, ring: '#ff6a3d', label: 'hell · superBoss' },
];
const pickupOrbs = pickupIds.map((p, i) => {
  const it = items.find((x) => x.id === p.id);
  const acc = (it && it.look && it.look.accent) || '#c792ff';
  const px = 32 + (p.scale * 16);
  const ring = p.ring
    ? `<div class="ring" style="width:${px + 14}px;height:${px + 14}px;border-color:${p.ring}"></div>`
    : '';
  return `<div class="orb-wrap" style="left:${40 + i * 110}px;top:${380 + (i % 2) * 40}px">
    <div class="orb" style="width:${px + 8}px;height:${px + 8}px;background:${acc}">${ring}
      <img src="${svgUri(p.id)}" alt="" style="width:${px}px;height:${px}px">
    </div>
    <span>${p.label}</span>
  </div>`;
}).join('\n');

const pickupHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Gear pickup mock — Android 390</title>
<style>
  html,body{margin:0;background:#151b33;color:#e8f0ff;font-family:system-ui,sans-serif}
  .phone{width:390px;height:844px;margin:0 auto;position:relative;overflow:hidden;
    background:linear-gradient(180deg,#1c2744,#0e1424 70%)}
  .ground{position:absolute;left:0;right:0;bottom:0;height:220px;
    background:linear-gradient(180deg,transparent,#0a0d18)}
  h1{margin:18px 16px 4px;font-size:15px;color:#ffd75e}
  .sub{margin:0 16px 12px;font-size:11px;opacity:.7}
  .orb-wrap{position:absolute;display:flex;flex-direction:column;align-items:center;gap:6px}
  .orb{border-radius:50%;display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 16px currentColor;position:relative;border:2px solid #fff}
  .ring{position:absolute;border-radius:50%;border:2px solid;pointer-events:none}
  .orb img{image-rendering:pixelated;image-rendering:crisp-edges}
  .orb-wrap span{font-size:10px;font-weight:800;opacity:.8}
</style></head><body>
<div class="phone">
  <h1>Pickup feel · max 3 orbs</h1>
  <p class="sub">390×844 · unique silhouettes · rare+ ring</p>
  ${pickupOrbs}
  <div class="ground"></div>
</div>
</body></html>`;
const pickupPage = path.join(previewDir, '_pickup.html');
fs.writeFileSync(pickupPage, pickupHtml, 'utf8');

const compareIds = [
  'head_wrap_cloth', 'head_bandana_blue', 'head_beanie_wool', 'head_hat_paper', 'head_crown_cardboard',
  'head_helm_knight', 'head_helm_nightmare', 'head_helm_hell',
  'chest_shirt_plain', 'chest_hoodie_gray', 'chest_vest_denim', 'chest_plate_iron', 'chest_plate_hell',
  'hands_wrap', 'hands_mittens_wool', 'hands_rings_plastic', 'hands_gauntlet_hell',
  'legs_wrap', 'legs_socks_plain', 'legs_shorts_stripe', 'legs_boots_clown', 'legs_greaves_hell',
  'back_pin_dot', 'back_backpack_school', 'back_scarf_long', 'back_cape_red', 'back_wings_hell',
];
const compareCells = compareIds.map((id) => {
  const it = items.find((x) => x.id === id);
  return cellHtml(it || { id, nameEn: id, slot: '', rarity: '', unlockLvl: 1 });
}).join('\n');
const compareHtml = html.replace(cells, compareCells).replace('gear pixels', 'gear pixels (distinct set)');
const comparePage = path.join(previewDir, '_compare.html');
fs.writeFileSync(comparePage, compareHtml, 'utf8');

const chromeBin = fs.existsSync('/opt/google/chrome/chrome')
  ? '/opt/google/chrome/chrome'
  : (process.env.CHROME_PATH || '');
const png = path.join(previewDir, 'all.png');
const samplePng = path.join(previewDir, 'sample.png');
const pickupPng = path.join(previewDir, 'pickup-android.png');
const comparePng = path.join(previewDir, 'distinct-set.png');
if (chromeBin && fs.existsSync(chromeBin)) {
  const userData = path.join(previewDir, '.chrome-ud');
  fs.mkdirSync(userData, { recursive: true });
  const shot = (out, page, w, h) => spawnSync(chromeBin, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--hide-scrollbars', `--user-data-dir=${userData}`,
    `--screenshot=${out}`, `--window-size=${w},${h}`,
    'file://' + page,
  ], { encoding: 'utf8' });
  const r = shot(samplePng, sampleSheet, 1280, 1100);
  if (r.status !== 0) {
    console.warn('chrome preview skip:', (r.stderr || r.stdout || '').slice(0, 200));
  }
  shot(png, sheet, 1400, 3600);
  shot(pickupPng, pickupPage, 390, 844);
  shot(comparePng, comparePage, 1280, 1600);
}

console.log(JSON.stringify({
  ok: true,
  items: items.length,
  sheet: 'assets/gear/_preview/_sheet.html',
  sample: fs.existsSync(samplePng) ? 'assets/gear/_preview/sample.png' : null,
  png: fs.existsSync(png) ? 'assets/gear/_preview/all.png' : null,
  pickup: fs.existsSync(pickupPng) ? 'assets/gear/_preview/pickup-android.png' : null,
  compare: fs.existsSync(comparePng) ? 'assets/gear/_preview/distinct-set.png' : null,
}));
