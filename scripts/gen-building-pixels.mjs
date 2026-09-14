#!/usr/bin/env node
/**
 * Stickman-pixel factory icons (32×32 crisp SVG) + preview sheet.
 * Source of truth for assets/buildings/*.svg — run: node scripts/gen-building-pixels.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/buildings');

/** ASSET-STYLE tokens + a few pixel extras (wood / flame / steam / glue). */
const C = {
  k: '#14161e',
  p: '#1a2030',
  m: '#333c55',
  l: '#4a5570',
  i: '#e8f0ff',
  d: '#9db1e3',
  g: '#ffd75e',
  o: '#c97a20',
  c: '#7cf5ff',
  n: '#7cfc8a',
  e: '#4ecf6a',
  r: '#ff6b6b',
  u: '#c792ff',
  w: '#6b4a28',
  t: '#c98850',
  f: '#ff8a3d',
  y: '#ffe08a',
  s: '#c8e8ff',
  b: '#5a9e4a',
  h: '#4a3018',
  a: '#6a7388',
  q: '#d4e05a',
  j: '#8a9a2a',
  v: '#b87333',
  x: '#ffb0b8',
};

const SIZE = 32;

function blank() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function set(px, x, y, c) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  px[y][x] = c;
}

function rect(px, x, y, w, h, c) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) set(px, x + i, y + j, c);
  }
}

function hline(px, x, y, w, c) { rect(px, x, y, w, 1, c); }
function vline(px, x, y, h, c) { rect(px, x, y, 1, h, c); }

function outlineBox(px, x, y, w, h, fill, edge = C.k) {
  rect(px, x, y, w, h, fill);
  hline(px, x, y, w, edge);
  hline(px, x, y + h - 1, w, edge);
  vline(px, x, y, h, edge);
  vline(px, x + w - 1, y, h, edge);
}

function disk(px, cx, cy, r, c) {
  const r2 = r * r;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r2) set(px, cx + x, cy + y, c);
    }
  }
}

function ring(px, cx, cy, r, c) {
  const r2 = r * r;
  const i2 = (r - 1) * (r - 1);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r2 && d >= i2) set(px, cx + x, cy + y, c);
    }
  }
}

function encodeSvg(px) {
  const byColor = new Map();
  for (let y = 0; y < SIZE; y++) {
    let x = 0;
    while (x < SIZE) {
      const c = px[y][x];
      if (!c) { x++; continue; }
      let x2 = x + 1;
      while (x2 < SIZE && px[y][x2] === c) x2++;
      const d = `M${x} ${y}h${x2 - x}v1h-${x2 - x}z`;
      if (!byColor.has(c)) byColor.set(c, []);
      byColor.get(c).push(d);
      x = x2;
    }
  }
  const paths = [...byColor.entries()]
    .map(([c, ds]) => `<path fill="${c}" d="${ds.join('')}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" shape-rendering="crispEdges">${paths}</svg>\n`;
}

function paintGround(px) {
  hline(px, 1, 30, 30, C.h);
  hline(px, 2, 31, 28, C.p);
}

/** Tiny stickman (head + body + legs) — stickman-pixel flavor. */
function stickman(px, x, y, ink = C.k, skin = C.i) {
  set(px, x, y, skin);
  set(px, x, y + 1, ink);
  set(px, x - 1, y + 2, ink);
  set(px, x, y + 2, ink);
  set(px, x + 1, y + 2, ink);
  set(px, x, y + 3, ink);
  set(px, x - 1, y + 4, ink);
  set(px, x + 1, y + 4, ink);
}

/** Stick-Lighter — matchstick factory + giant lighter chimney. */
function paintStickLighter() {
  const px = blank();
  paintGround(px);

  // factory block
  outlineBox(px, 5, 16, 22, 14, C.m);
  rect(px, 6, 17, 20, 12, C.l);
  hline(px, 5, 16, 22, C.k);
  rect(px, 4, 14, 24, 3, C.m);
  hline(px, 4, 14, 24, C.k);
  hline(px, 4, 16, 24, C.k);

  // windows
  [[7, 19], [12, 19], [17, 19], [22, 19]].forEach(([x, y]) => {
    rect(px, x, y, 2, 2, C.g);
    set(px, x, y, C.y);
  });
  [[7, 23], [22, 23]].forEach(([x, y]) => rect(px, x, y, 2, 2, C.c));

  // stick door
  outlineBox(px, 13, 23, 6, 7, C.w);
  vline(px, 16, 24, 5, C.t);
  set(px, 14, 26, C.t);

  // wood-stick pile on roof
  rect(px, 8, 12, 5, 2, C.w);
  rect(px, 9, 11, 4, 1, C.t);
  set(px, 7, 13, C.h);
  set(px, 13, 13, C.h);

  // giant lighter body
  outlineBox(px, 16, 6, 7, 9, C.i);
  rect(px, 17, 7, 5, 7, C.d);
  rect(px, 18, 8, 3, 2, C.g); // flint wheel
  set(px, 19, 8, C.y);
  hline(px, 17, 11, 5, C.k);
  rect(px, 17, 12, 5, 2, C.o); // metal band

  // cap
  outlineBox(px, 17, 3, 5, 4, C.o);
  rect(px, 18, 4, 3, 2, C.g);

  // flame
  set(px, 19, 2, C.f);
  set(px, 18, 1, C.f);
  set(px, 19, 1, C.y);
  set(px, 20, 1, C.f);
  set(px, 19, 0, C.y);
  set(px, 18, 2, C.r);
  set(px, 20, 2, C.r);

  // extra matchsticks leaning
  vline(px, 10, 8, 5, C.t);
  set(px, 10, 7, C.r);
  set(px, 10, 6, C.f);
  vline(px, 12, 9, 4, C.w);
  set(px, 12, 8, C.o);

  stickman(px, 3, 25, C.k, C.y);

  return px;
}

/** Woodchip-Glue — hopper of chips feeding a dripping glue vat. */
function paintWoodchipGlue() {
  const px = blank();
  paintGround(px);

  // main shed
  outlineBox(px, 8, 15, 14, 15, C.m);
  rect(px, 9, 16, 12, 13, C.l);
  rect(px, 7, 13, 16, 3, C.w);
  hline(px, 7, 13, 16, C.k);
  hline(px, 7, 15, 16, C.k);

  // windows
  rect(px, 11, 18, 2, 2, C.c);
  rect(px, 17, 18, 2, 2, C.c);

  // door
  outlineBox(px, 13, 23, 4, 7, C.h);
  set(px, 16, 26, C.t);

  // hopper (left)
  rect(px, 2, 10, 8, 2, C.k);
  rect(px, 3, 11, 6, 1, C.t);
  rect(px, 3, 12, 6, 6, C.w);
  vline(px, 2, 12, 6, C.k);
  vline(px, 9, 12, 6, C.k);
  // funnel
  hline(px, 3, 18, 6, C.k);
  hline(px, 4, 19, 4, C.h);
  hline(px, 5, 20, 2, C.k);
  // chips in hopper
  set(px, 4, 13, C.t);
  set(px, 6, 13, C.o);
  set(px, 5, 14, C.t);
  set(px, 7, 14, C.h);
  set(px, 4, 15, C.o);
  set(px, 6, 16, C.t);
  set(px, 3, 16, C.h);

  // pipe hopper → vat
  hline(px, 7, 21, 14, C.a);
  hline(px, 7, 22, 14, C.k);
  set(px, 20, 21, C.q);

  // glue vat (right)
  disk(px, 25, 22, 5, C.k);
  disk(px, 25, 22, 4, C.j);
  disk(px, 25, 21, 3, C.q);
  set(px, 24, 20, C.y);
  set(px, 25, 20, C.i);
  // drips
  set(px, 24, 27, C.q);
  set(px, 24, 28, C.q);
  set(px, 24, 29, C.j);
  set(px, 27, 27, C.q);
  set(px, 27, 28, C.j);
  // vat rim
  hline(px, 21, 17, 9, C.k);
  hline(px, 22, 16, 7, C.a);

  // chip pile
  set(px, 3, 28, C.t);
  set(px, 4, 28, C.w);
  set(px, 5, 28, C.t);
  set(px, 4, 27, C.o);
  set(px, 6, 29, C.t);
  set(px, 2, 29, C.w);

  stickman(px, 12, 25, C.k, C.i);

  return px;
}

/** Chipping-Wood — sawmill chewing a log, chips flying. */
function paintChippingWood() {
  const px = blank();
  paintGround(px);

  // shed
  outlineBox(px, 3, 14, 16, 16, C.m);
  rect(px, 4, 15, 14, 14, C.l);
  rect(px, 2, 12, 18, 3, C.w);
  hline(px, 2, 12, 18, C.k);
  // open bay
  rect(px, 14, 20, 5, 9, C.p);

  // window
  rect(px, 6, 17, 3, 2, C.c);
  set(px, 6, 17, C.i);

  // log feeding in
  rect(px, 0, 22, 16, 4, C.w);
  hline(px, 0, 22, 16, C.t);
  hline(px, 0, 25, 16, C.h);
  set(px, 2, 23, C.h);
  set(px, 6, 24, C.t);
  set(px, 10, 23, C.h);
  // log rings on cut face
  set(px, 15, 23, C.t);
  set(px, 15, 24, C.o);

  // circular saw
  disk(px, 21, 20, 7, C.k);
  disk(px, 21, 20, 6, C.i);
  disk(px, 21, 20, 5, C.d);
  disk(px, 21, 20, 2, C.k);
  // teeth
  const teeth = [
    [21, 13], [26, 15], [28, 20], [26, 25], [21, 27], [16, 25], [14, 20], [16, 15],
  ];
  teeth.forEach(([x, y]) => {
    set(px, x, y, C.c);
    set(px, x, y - 1, C.i);
  });
  // hub bolt
  set(px, 21, 20, C.g);
  set(px, 20, 20, C.o);
  set(px, 22, 20, C.o);

  // flying chips
  [[25, 8, C.t], [27, 10, C.w], [29, 7, C.o], [24, 11, C.t], [28, 13, C.w], [30, 11, C.h]].forEach(([x, y, c]) => {
    set(px, x, y, c);
    set(px, x + 1, y, c);
  });

  // sawdust puff on roof
  set(px, 8, 9, C.a);
  set(px, 9, 8, C.s);
  set(px, 10, 9, C.a);
  set(px, 11, 7, C.s);

  stickman(px, 7, 25, C.k, C.i);

  return px;
}

/** Bamboo-Boesa Boiler — bamboo grove + round boiler with a whistle-face. */
function paintBambooBoesa() {
  const px = blank();
  paintGround(px);

  const stalk = (x, top) => {
    vline(px, x, top, 30 - top, C.b);
    vline(px, x + 1, top, 30 - top, C.e);
    vline(px, x + 2, top, 30 - top, C.b);
    for (let y = top + 3; y < 30; y += 5) {
      hline(px, x, y, 3, C.h);
    }
    // leaves
    set(px, x - 1, top + 1, C.n);
    set(px, x + 3, top + 2, C.n);
    set(px, x - 1, top + 6, C.e);
  };
  stalk(2, 8);
  stalk(6, 12);
  stalk(10, 6);

  // boiler body
  disk(px, 22, 20, 8, C.k);
  disk(px, 22, 20, 7, C.v);
  disk(px, 22, 19, 6, C.o);
  // highlight
  set(px, 18, 16, C.g);
  set(px, 19, 15, C.y);
  // rivets
  [[17, 18], [27, 18], [17, 23], [27, 23], [22, 14], [16, 20], [28, 20]].forEach(([x, y]) => {
    set(px, x, y, C.k);
    set(px, x, y - 1, C.g);
  });

  // quirky face
  set(px, 19, 19, C.k);
  set(px, 25, 19, C.k);
  set(px, 19, 18, C.i);
  set(px, 25, 18, C.i);
  // smile
  hline(px, 20, 23, 5, C.k);
  set(px, 19, 22, C.k);
  set(px, 25, 22, C.k);

  // pressure whistle
  outlineBox(px, 21, 8, 3, 5, C.g);
  rect(px, 21, 7, 3, 1, C.o);
  hline(px, 20, 10, 5, C.k);
  set(px, 22, 6, C.i);

  // steam / boesa puffs
  disk(px, 18, 4, 2, C.s);
  disk(px, 23, 3, 2, C.s);
  disk(px, 27, 5, 2, C.i);
  set(px, 16, 5, C.s);
  set(px, 25, 2, C.i);

  // little stand
  vline(px, 16, 27, 3, C.k);
  vline(px, 28, 27, 3, C.k);
  hline(px, 16, 27, 13, C.k);

  stickman(px, 14, 25, C.k, C.i);

  return px;
}

/** Echo-Whistle Mill — mill + blades + whistle shouting echo rings. */
function paintEchoWhistle() {
  const px = blank();
  paintGround(px);

  // mill tower
  outlineBox(px, 7, 14, 10, 16, C.m);
  rect(px, 8, 15, 8, 14, C.l);
  // roof
  for (let i = 0; i < 6; i++) {
    hline(px, 6 + i, 13 - i, 12 - i * 2, i === 0 ? C.k : C.w);
  }
  set(px, 11, 8, C.k);
  vline(px, 11, 5, 4, C.h);

  // door + window
  outlineBox(px, 10, 23, 4, 7, C.h);
  set(px, 13, 26, C.t);
  rect(px, 10, 17, 3, 2, C.c);
  set(px, 10, 17, C.i);

  // windmill blades (cross)
  const cx = 12, cy = 10;
  hline(px, cx - 7, cy, 15, C.i);
  hline(px, cx - 7, cy - 1, 15, C.d);
  vline(px, cx, cy - 7, 15, C.i);
  vline(px, cx - 1, cy - 7, 15, C.d);
  // blade paddles
  rect(px, cx + 5, cy - 2, 4, 5, C.x);
  rect(px, cx - 8, cy - 2, 4, 5, C.x);
  rect(px, cx - 2, cy - 8, 5, 4, C.u);
  rect(px, cx - 2, cy + 5, 5, 4, C.u);
  disk(px, cx, cy, 2, C.g);
  set(px, cx, cy, C.k);

  // giant whistle on the wall
  outlineBox(px, 17, 18, 5, 4, C.g);
  rect(px, 18, 19, 3, 2, C.y);
  rect(px, 21, 19, 2, 2, C.o);
  set(px, 22, 20, C.k);

  // echo rings (right)
  ring(px, 24, 20, 4, C.u);
  ring(px, 25, 20, 6, C.c);
  ring(px, 26, 20, 8, C.u);
  // clip rings that would cover the mill too much — punch a few pixels back
  rect(px, 8, 15, 8, 10, C.l);
  outlineBox(px, 7, 14, 10, 16, C.m);
  rect(px, 8, 15, 8, 14, C.l);
  outlineBox(px, 10, 23, 4, 7, C.h);
  set(px, 13, 26, C.t);
  rect(px, 10, 17, 3, 2, C.c);
  outlineBox(px, 17, 18, 5, 4, C.g);
  rect(px, 18, 19, 3, 2, C.y);
  rect(px, 21, 19, 2, 2, C.o);

  stickman(px, 5, 25, C.k, C.i);

  return px;
}

/** HOME tile pixel — factory district (3 chimneys). */
function paintHubBuildings() {
  const px = blank();
  paintGround(px);

  // left shed
  outlineBox(px, 2, 18, 9, 12, C.m);
  rect(px, 3, 19, 7, 10, C.l);
  rect(px, 4, 21, 2, 2, C.c);
  vline(px, 8, 12, 6, C.a);
  set(px, 8, 10, C.s);
  set(px, 7, 9, C.s);

  // mid factory
  outlineBox(px, 11, 14, 10, 16, C.m);
  rect(px, 12, 15, 8, 14, C.l);
  rect(px, 13, 17, 2, 2, C.g);
  rect(px, 17, 17, 2, 2, C.g);
  outlineBox(px, 14, 24, 4, 6, C.w);
  vline(px, 16, 8, 6, C.a);
  set(px, 16, 6, C.f);
  set(px, 16, 5, C.y);
  set(px, 17, 6, C.r);

  // right mill-ish
  outlineBox(px, 22, 16, 8, 14, C.m);
  rect(px, 23, 17, 6, 12, C.l);
  rect(px, 24, 19, 2, 2, C.u);
  vline(px, 27, 11, 5, C.a);
  set(px, 27, 9, C.s);
  set(px, 28, 8, C.i);

  stickman(px, 15, 25, C.k, C.y);

  return px;
}

const BUILDINGS = [
  {
    id: 'stick_lighter',
    file: 'stick_lighter.svg',
    name: 'Stick-Lighter Factory',
    nameNl: 'Stok-Aansteker Fabriek',
    accent: C.g,
    paint: paintStickLighter,
  },
  {
    id: 'woodchip_glue',
    file: 'woodchip_glue.svg',
    name: 'Woodchip-Glue Factory',
    nameNl: 'Houtsnipper-Lijm Fabriek',
    accent: C.q,
    paint: paintWoodchipGlue,
  },
  {
    id: 'chipping_wood',
    file: 'chipping_wood.svg',
    name: 'Chipping-Wood Factory',
    nameNl: 'Versnipper-Hout Fabriek',
    accent: C.c,
    paint: paintChippingWood,
  },
  {
    id: 'bamboo_boesa',
    file: 'bamboo_boesa.svg',
    name: 'Bamboo-Boesa Boiler',
    nameNl: 'Bamboe-Boesa Ketel',
    accent: C.e,
    paint: paintBambooBoesa,
  },
  {
    id: 'echo_whistle',
    file: 'echo_whistle.svg',
    name: 'Echo-Whistle Mill',
    nameNl: 'Echo-Fluitmolen',
    accent: C.u,
    paint: paintEchoWhistle,
  },
];

const HUB = {
  id: 'buildings',
  file: 'hub-buildings.svg',
  name: 'Buildings',
  nameNl: 'Fabrieken',
  accent: C.g,
  paint: paintHubBuildings,
};

/** kebab-case copies + leftover generic stubs (not locked names). */
const FILE_ALIASES = [
  { file: 'stick-lighter.svg', paint: paintStickLighter, of: 'stick_lighter' },
  { file: 'woodchip-glue.svg', paint: paintWoodchipGlue, of: 'woodchip_glue' },
  { file: 'chipping-wood.svg', paint: paintChippingWood, of: 'chipping_wood' },
  { file: 'bamboo-boesa.svg', paint: paintBambooBoesa, of: 'bamboo_boesa' },
  { file: 'bamboo-boesa-boiler.svg', paint: paintBambooBoesa, of: 'bamboo_boesa' },
  { file: 'bamboo_boesa_boiler.svg', paint: paintBambooBoesa, of: 'bamboo_boesa' },
  { file: 'echo-whistle.svg', paint: paintEchoWhistle, of: 'echo_whistle' },
  { file: 'echo-whistle-mill.svg', paint: paintEchoWhistle, of: 'echo_whistle' },
  { file: 'echo_whistle_mill.svg', paint: paintEchoWhistle, of: 'echo_whistle' },
  { file: 'forge.svg', paint: paintStickLighter, of: 'stick_lighter' },
  { file: 'foundry.svg', paint: paintStickLighter, of: 'stick_lighter' },
  { file: 'dojo.svg', paint: paintChippingWood, of: 'chipping_wood' },
  { file: 'ranch.svg', paint: paintWoodchipGlue, of: 'woodchip_glue' },
  { file: 'tower.svg', paint: paintWoodchipGlue, of: 'woodchip_glue' },
  { file: 'garden.svg', paint: paintBambooBoesa, of: 'bamboo_boesa' },
  { file: 'mill.svg', paint: paintEchoWhistle, of: 'echo_whistle' },
  { file: 'shrine.svg', paint: paintEchoWhistle, of: 'echo_whistle' },
];

function writePreview(items) {
  const figs = items.map((b) => `
<figure data-id="${b.id}">
  <div class="zoom"><img src="${b.file}" alt="${b.name}" width="96" height="96"></div>
  <figcaption>${b.name}<small>${b.id}</small></figcaption>
</figure>`).join('');

  const html = `<!DOCTYPE html>
<html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stickman Fighter — building pixels</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:24px 20px 40px}
  h1{font-family:Georgia,serif;color:#ffd75e;font-size:24px;margin:0 0 4px}
  .sub{opacity:.7;margin:0 0 18px;font-size:13px}
  h2{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9db1e3;margin:22px 0 10px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px}
  figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px}
  .zoom{width:112px;height:112px;border-radius:16px;background:linear-gradient(180deg,#2a3348,#1a2030);
    box-shadow:0 6px 0 #0a0d18, inset 0 0 0 1px rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:center;image-rendering:pixelated}
  .zoom img{width:96px;height:96px;image-rendering:pixelated}
  figcaption{font-size:12px;font-weight:700;text-align:center}
  figcaption small{display:block;font-weight:600;opacity:.6;margin-top:2px}
  .hub{background:linear-gradient(180deg,#3a3040,#1a2030)}
</style>
</head><body>
<h1>Fabrieken — stickman pixel</h1>
<p class="sub">Locked ids (#292): stick_lighter · woodchip_glue · chipping_wood · bamboo_boesa · echo_whistle · not the share URL</p>
<h2>HOME tile</h2>
<div class="grid">
<figure data-id="buildings">
  <div class="zoom hub"><img src="hub-buildings.svg" alt="Buildings" width="96" height="96"></div>
  <figcaption>Buildings<small>buildings · hub pixel</small></figcaption>
</figure>
<figure data-id="buildings-stroke">
  <div class="zoom hub"><img src="../buttons/hub/buildings.svg" alt="Buildings stroke" width="48" height="48"></div>
  <figcaption>HOME stroke<small>assets/buttons/hub/buildings.svg</small></figcaption>
</figure>
</div>
<h2>Building cards (5 factories)</h2>
<div class="grid">${figs}</div>
</body></html>
`;
  fs.writeFileSync(path.join(outDir, 'preview.html'), html);
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const all = [...BUILDINGS, HUB];
  for (const b of all) {
    const svg = encodeSvg(b.paint());
    const dest = path.join(outDir, b.file);
    fs.writeFileSync(dest, svg);
    const kb = (Buffer.byteLength(svg) / 1024).toFixed(2);
    console.log(`OK ${b.id} → assets/buildings/${b.file} (${kb} KB)`);
  }
  for (const a of FILE_ALIASES) {
    const svg = encodeSvg(a.paint());
    fs.writeFileSync(path.join(outDir, a.file), svg);
    console.log(`OK alias ${a.of} → assets/buildings/${a.file}`);
  }
  writePreview(BUILDINGS);
  console.log('OK preview → assets/buildings/preview.html');
}

main();
