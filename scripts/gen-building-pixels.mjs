#!/usr/bin/env node
/**
 * Stickman-pixel factory icons (32×32 crisp SVG) + preview sheet.
 * Source of truth for assets/buildings/*.svg — run: node scripts/gen-building-pixels.mjs
 *
 * Harden pass: 1px halo, 2px outlines, bigger signature props, lighter walls
 * so cards stay readable at 32×32 on Android.
 */
import fs from 'fs';
import path from 'path';
import { deflateSync, crc32 } from 'zlib';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/buildings');

/** ASSET-STYLE tokens + a few pixel extras (wood / flame / steam / glue). */
const C = {
  k: '#14161e',
  p: '#1a2030',
  m: '#333c55',
  l: '#4a5570',
  wall: '#5c6b8a',
  hi: '#8a97b3',
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

/** Chunky 2px outline — reads at 32×32 on a phone card. */
function outlineBox2(px, x, y, w, h, fill, edge = C.k) {
  rect(px, x, y, w, h, fill);
  hline(px, x, y, w, edge);
  if (h > 2) hline(px, x, y + 1, w, edge);
  hline(px, x, y + h - 1, w, edge);
  if (h > 2) hline(px, x, y + h - 2, w, edge);
  vline(px, x, y, h, edge);
  if (w > 2) vline(px, x + 1, y, h, edge);
  vline(px, x + w - 1, y, h, edge);
  if (w > 2) vline(px, x + w - 2, y, h, edge);
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

/** Ring but only pixels with x >= minX (keeps echo rings off the mill). */
function ringRight(px, cx, cy, r, c, minX) {
  const r2 = r * r;
  const i2 = (r - 1) * (r - 1);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (cx + x < minX) continue;
      const d = x * x + y * y;
      if (d <= r2 && d >= i2) set(px, cx + x, cy + y, c);
    }
  }
}

/** 1px dark halo around any painted pixel — stamps the silhouette. */
function halo(px, color = C.k) {
  const marks = [];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (px[y][x]) continue;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && px[ny][nx]) {
          marks.push([x, y]);
          break;
        }
      }
    }
  }
  for (const [x, y] of marks) set(px, x, y, color);
}

function encodeSvg(px) {
  const used = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const byColor = new Map();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const c = px[y][x];
      if (!c || used[y][x]) continue;
      let w = 1;
      while (x + w < SIZE && px[y][x + w] === c && !used[y][x + w]) w++;
      let h = 1;
      grow: while (y + h < SIZE) {
        for (let i = 0; i < w; i++) {
          if (px[y + h][x + i] !== c || used[y + h][x + i]) break grow;
        }
        h++;
      }
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) used[y + j][x + i] = true;
      }
      const d = `M${x} ${y}h${w}v${h}h-${w}z`;
      if (!byColor.has(c)) byColor.set(c, []);
      byColor.get(c).push(d);
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

/** Stick-Lighter — giant gold Zippo IS the factory + huge flame + matches. */
function paintStickLighter() {
  const px = blank();
  paintGround(px);

  // crossed matches (left) — read as "stick" even at 16px
  vline(px, 3, 10, 16, C.t);
  vline(px, 4, 11, 14, C.w);
  rect(px, 2, 6, 3, 4, C.f);
  set(px, 3, 5, C.y);
  set(px, 3, 6, C.r);
  set(px, 4, 6, C.y);

  vline(px, 6, 13, 13, C.w);
  vline(px, 7, 14, 11, C.h);
  rect(px, 5, 9, 3, 4, C.o);
  set(px, 6, 8, C.f);
  set(px, 6, 9, C.r);

  // huge flame spike (unique skyline)
  set(px, 17, 0, C.y);
  hline(px, 16, 1, 3, C.y);
  set(px, 15, 1, C.f);
  set(px, 19, 1, C.f);
  hline(px, 15, 2, 5, C.f);
  set(px, 17, 2, C.y);
  set(px, 14, 2, C.r);
  set(px, 20, 2, C.r);
  hline(px, 14, 3, 7, C.f);
  hline(px, 16, 3, 3, C.y);
  set(px, 13, 3, C.r);
  set(px, 21, 3, C.r);
  hline(px, 14, 4, 7, C.f);
  hline(px, 16, 4, 3, C.y);
  set(px, 17, 4, C.y);
  hline(px, 15, 5, 5, C.f);
  set(px, 17, 5, C.y);

  // lighter cap
  outlineBox2(px, 13, 6, 11, 5, C.o);
  rect(px, 15, 7, 7, 2, C.g);
  set(px, 18, 7, C.y);

  // flint wheel
  outlineBox(px, 14, 10, 9, 4, C.hi);
  hline(px, 15, 11, 7, C.y);
  hline(px, 15, 12, 7, C.g);
  set(px, 18, 11, C.i);

  // gold factory body (not a grey box)
  outlineBox2(px, 8, 13, 18, 17, C.o);
  rect(px, 10, 15, 14, 13, C.g);
  hline(px, 10, 18, 14, C.o);
  hline(px, 10, 19, 14, C.v);
  // roof lip
  hline(px, 7, 13, 20, C.k);
  hline(px, 8, 14, 18, C.o);

  // windows — bright, 3×2
  [[11, 16], [18, 16]].forEach(([x, y]) => {
    rect(px, x, y, 3, 2, C.c);
    set(px, x, y, C.i);
  });
  [[11, 21], [18, 21]].forEach(([x, y]) => {
    rect(px, x, y, 3, 2, C.y);
    set(px, x, y, C.i);
  });

  // stick door
  outlineBox2(px, 14, 22, 6, 8, C.w);
  vline(px, 16, 24, 5, C.t);
  set(px, 18, 26, C.t);

  stickman(px, 28, 25, C.k, C.y);
  halo(px);
  return px;
}

/** Woodchip-Glue — hopper of chips + giant dripping lime vat. */
function paintWoodchipGlue() {
  const px = blank();
  paintGround(px);

  // small shed (backdrop only — vat + hopper own the silhouette)
  outlineBox(px, 9, 16, 10, 14, C.wall);
  rect(px, 11, 18, 6, 11, C.hi);
  rect(px, 12, 19, 2, 2, C.c);
  outlineBox(px, 12, 24, 4, 6, C.h);

  // hopper (left) — tall wood funnel (1px outline so tan fill stays visible)
  outlineBox(px, 1, 7, 10, 4, C.o);
  rect(px, 3, 8, 6, 2, C.y);
  outlineBox(px, 2, 10, 8, 10, C.t);
  rect(px, 4, 12, 4, 6, C.w);
  // chips in hopper
  [[3, 12, C.t], [5, 12, C.o], [6, 13, C.t], [4, 14, C.y], [7, 14, C.h], [5, 15, C.t], [3, 16, C.o], [6, 16, C.t]].forEach(([x, y, c]) => {
    set(px, x, y, c);
    set(px, x + 1, y, c);
  });
  // funnel
  hline(px, 3, 20, 6, C.k);
  hline(px, 4, 21, 4, C.h);
  hline(px, 5, 22, 2, C.k);

  // pipe hopper → vat
  hline(px, 7, 22, 8, C.hi);
  hline(px, 7, 23, 8, C.k);
  set(px, 14, 22, C.q);

  // GIANT glue vat (right) — the silhouette
  disk(px, 24, 21, 8, C.k);
  disk(px, 24, 21, 7, C.j);
  disk(px, 24, 20, 6, C.q);
  disk(px, 23, 18, 3, C.y);
  set(px, 22, 17, C.i);
  set(px, 23, 17, C.i);
  // rim
  hline(px, 17, 14, 14, C.k);
  hline(px, 18, 13, 12, C.hi);
  hline(px, 19, 12, 10, C.k);
  // thick drips
  rect(px, 21, 27, 2, 3, C.q);
  rect(px, 26, 26, 2, 4, C.q);
  set(px, 21, 29, C.j);
  set(px, 27, 29, C.j);

  // chip pile (left ground)
  set(px, 2, 28, C.t);
  set(px, 3, 28, C.w);
  set(px, 4, 27, C.o);
  set(px, 5, 28, C.t);
  set(px, 3, 29, C.t);
  set(px, 1, 29, C.w);

  stickman(px, 13, 25, C.k, C.i);
  halo(px);
  return px;
}

/** Chipping-Wood — huge cyan saw chewing a thick log, chips flying. */
function paintChippingWood() {
  const px = blank();
  paintGround(px);

  // shed (left backdrop, shorter so the saw owns the skyline)
  outlineBox(px, 1, 12, 14, 10, C.wall);
  rect(px, 3, 14, 10, 7, C.hi);
  hline(px, 1, 12, 14, C.k);
  hline(px, 2, 13, 12, C.w);
  rect(px, 4, 15, 4, 3, C.c);
  set(px, 4, 15, C.i);
  set(px, 7, 16, C.i);

  // thick log feeding in
  rect(px, 0, 20, 17, 7, C.w);
  hline(px, 0, 20, 17, C.t);
  hline(px, 0, 21, 17, C.t);
  hline(px, 0, 25, 17, C.h);
  hline(px, 0, 26, 17, C.h);
  set(px, 3, 22, C.h);
  set(px, 7, 23, C.t);
  set(px, 11, 22, C.h);
  // cut-face rings
  set(px, 16, 22, C.o);
  set(px, 16, 23, C.y);
  set(px, 16, 24, C.o);

  // GIANT circular saw
  disk(px, 22, 19, 9, C.k);
  disk(px, 22, 19, 8, C.i);
  disk(px, 22, 19, 7, C.c);
  disk(px, 22, 19, 5, C.d);
  disk(px, 22, 19, 2, C.k);
  const teeth = [
    [22, 10], [27, 12], [30, 16], [31, 19], [30, 23], [27, 26],
    [22, 28], [17, 26], [14, 23], [13, 19], [14, 15], [17, 12],
  ];
  teeth.forEach(([x, y]) => {
    set(px, x, y, C.i);
    set(px, x, y - 1, C.c);
  });
  // hub bolt
  set(px, 22, 19, C.g);
  set(px, 21, 19, C.o);
  set(px, 23, 19, C.o);
  set(px, 22, 18, C.o);
  set(px, 22, 20, C.o);

  // flying chips (2×2, high contrast)
  [[24, 4, C.t], [27, 6, C.o], [29, 3, C.y], [26, 8, C.w], [30, 8, C.h], [23, 7, C.t]].forEach(([x, y, c]) => {
    rect(px, x, y, 2, 2, c);
  });

  stickman(px, 6, 24, C.k, C.i);
  halo(px);
  return px;
}

/** Bamboo-Boesa — thick bamboo grove + fat smiling copper kettle. */
function paintBambooBoesa() {
  const px = blank();
  paintGround(px);

  const stalk = (x, top) => {
    vline(px, x, top, 30 - top, C.b);
    vline(px, x + 1, top, 30 - top, C.e);
    vline(px, x + 2, top, 30 - top, C.n);
    vline(px, x + 3, top, 30 - top, C.b);
    for (let y = top + 3; y < 30; y += 5) {
      hline(px, x, y, 4, C.h);
    }
    set(px, x - 1, top + 1, C.n);
    set(px, x + 4, top + 2, C.n);
    set(px, x - 1, top + 2, C.e);
    set(px, x + 4, top + 6, C.e);
    set(px, x - 1, top + 7, C.n);
  };
  stalk(1, 7);
  stalk(6, 11);
  stalk(10, 5);

  // fat copper kettle
  disk(px, 22, 20, 9, C.k);
  disk(px, 22, 20, 8, C.v);
  disk(px, 22, 19, 7, C.o);
  disk(px, 20, 16, 3, C.g);
  set(px, 19, 15, C.y);
  set(px, 20, 14, C.y);
  // rivets
  [[15, 18], [29, 18], [15, 23], [29, 23], [22, 12], [14, 20], [30, 20]].forEach(([x, y]) => {
    set(px, x, y, C.k);
    set(px, x, y - 1, C.g);
  });

  // face — 2×2 eyes + wide smile
  rect(px, 18, 18, 2, 2, C.k);
  rect(px, 24, 18, 2, 2, C.k);
  set(px, 18, 18, C.i);
  set(px, 24, 18, C.i);
  hline(px, 19, 24, 6, C.k);
  set(px, 18, 23, C.k);
  set(px, 25, 23, C.k);

  // pressure whistle
  outlineBox2(px, 20, 6, 5, 6, C.g);
  rect(px, 21, 7, 3, 3, C.y);
  hline(px, 19, 9, 7, C.k);
  set(px, 22, 5, C.i);

  // steam / boesa puffs (bigger)
  disk(px, 16, 3, 3, C.s);
  disk(px, 23, 2, 3, C.i);
  disk(px, 28, 4, 2, C.s);
  set(px, 13, 4, C.s);
  set(px, 26, 1, C.i);

  // stand
  vline(px, 15, 27, 3, C.k);
  vline(px, 29, 27, 3, C.k);
  hline(px, 15, 27, 15, C.k);

  stickman(px, 14, 25, C.k, C.i);
  halo(px);
  return px;
}

/** Echo-Whistle — thick mill blades + gold horn + echo rings. */
function paintEchoWhistle() {
  const px = blank();
  paintGround(px);

  // mill tower
  outlineBox(px, 5, 14, 12, 16, C.wall);
  rect(px, 7, 16, 8, 13, C.hi);
  // peaked roof
  for (let i = 0; i < 6; i++) {
    hline(px, 4 + i, 13 - i, 14 - i * 2, i === 0 ? C.k : C.w);
  }
  hline(px, 4, 13, 14, C.k);

  // door + window
  outlineBox2(px, 8, 22, 6, 8, C.h);
  set(px, 12, 26, C.t);
  rect(px, 8, 17, 4, 3, C.c);
  set(px, 8, 17, C.i);
  set(px, 11, 18, C.i);

  // thick windmill blades (3px cross)
  const cx = 10;
  const cy = 8;
  hline(px, cx - 8, cy - 1, 17, C.d);
  hline(px, cx - 8, cy, 17, C.i);
  hline(px, cx - 8, cy + 1, 17, C.d);
  vline(px, cx - 1, cy - 7, 16, C.d);
  vline(px, cx, cy - 7, 16, C.i);
  vline(px, cx + 1, cy - 7, 16, C.d);
  // paddles — pink / purple, chunky
  rect(px, cx + 5, cy - 3, 5, 7, C.x);
  rect(px, cx - 9, cy - 3, 5, 7, C.x);
  rect(px, cx - 3, cy - 8, 7, 5, C.u);
  rect(px, cx - 3, cy + 3, 7, 5, C.u);
  disk(px, cx, cy, 3, C.g);
  disk(px, cx, cy, 1, C.k);

  // giant gold whistle horn
  outlineBox2(px, 16, 17, 7, 6, C.g);
  rect(px, 18, 18, 4, 3, C.y);
  rect(px, 22, 18, 3, 3, C.o);
  set(px, 24, 19, C.k);

  // echo rings — right side only so the mill stays readable
  ringRight(px, 24, 20, 4, C.u, 22);
  ringRight(px, 25, 20, 6, C.c, 22);
  ringRight(px, 26, 20, 8, C.u, 23);

  stickman(px, 3, 25, C.k, C.i);
  halo(px);
  return px;
}

/** HOME tile — factory district with 3 distinct rooftops. */
function paintHubBuildings() {
  const px = blank();
  paintGround(px);

  // left shed + steam
  outlineBox(px, 1, 18, 9, 12, C.wall);
  rect(px, 3, 20, 5, 9, C.hi);
  rect(px, 3, 21, 3, 3, C.c);
  set(px, 3, 21, C.i);
  vline(px, 7, 12, 6, C.hi);
  vline(px, 8, 12, 6, C.a);
  set(px, 7, 10, C.s);
  set(px, 8, 9, C.i);
  set(px, 6, 9, C.s);

  // mid factory + flame chimney
  outlineBox(px, 10, 13, 12, 17, C.hi);
  rect(px, 12, 15, 8, 14, C.d);
  rect(px, 12, 16, 3, 3, C.g);
  rect(px, 17, 16, 3, 3, C.g);
  set(px, 12, 16, C.y);
  set(px, 17, 16, C.y);
  outlineBox(px, 13, 23, 6, 7, C.w);
  vline(px, 15, 6, 7, C.hi);
  vline(px, 16, 6, 7, C.a);
  set(px, 15, 4, C.y);
  set(px, 16, 3, C.y);
  set(px, 15, 5, C.f);
  set(px, 16, 4, C.f);
  set(px, 17, 5, C.r);

  // right mill + flag
  outlineBox(px, 22, 16, 9, 14, C.wall);
  rect(px, 24, 18, 5, 11, C.hi);
  rect(px, 24, 19, 3, 3, C.u);
  set(px, 24, 19, C.i);
  vline(px, 28, 10, 6, C.hi);
  set(px, 28, 8, C.r);
  set(px, 29, 8, C.g);
  set(px, 29, 9, C.g);

  stickman(px, 16, 24, C.k, C.y);
  halo(px);
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
  const card = (b, extra = '') => `
<figure data-id="${b.id}">
  <div class="zoom${extra}"><img src="${b.file}" alt="${b.name}" width="96" height="96"></div>
  <figcaption>${b.name}<small>${b.id}</small></figcaption>
</figure>`;

  const sizes = items.map((b) => `
<figure data-id="${b.id}-sizes">
  <div class="ladder">
    <img src="${b.file}" alt="" width="32" height="32">
    <img src="${b.file}" alt="" width="48" height="48">
    <img src="${b.file}" alt="${b.name}" width="96" height="96">
  </div>
  <figcaption>${b.name}<small>32 · 48 · 96</small></figcaption>
</figure>`).join('');

  const figs = items.map((b) => card(b)).join('');
  const sils = items.map((b) => card(b, ' sil')).join('');

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
  .zoom img,.ladder img{image-rendering:pixelated}
  .zoom img{width:96px;height:96px}
  .zoom.sil{background:#ffd75e}
  .zoom.sil img{filter:brightness(0)}
  .phone{width:128px;height:168px;border-radius:18px;padding-top:18px;background:linear-gradient(180deg,#1c2438,#121826);
    box-shadow:0 8px 0 #07090f, inset 0 0 0 2px #333c55}
  figcaption{font-size:12px;font-weight:700;text-align:center}
  figcaption small{display:block;font-weight:600;opacity:.6;margin-top:2px}
  .hub{background:linear-gradient(180deg,#3a3040,#1a2030)}
  .ladder{display:flex;align-items:flex-end;gap:10px;padding:10px 12px;border-radius:16px;
    background:linear-gradient(180deg,#2a3348,#1a2030);box-shadow:0 6px 0 #0a0d18}
</style>
</head><body>
<h1>Fabrieken — stickman pixel</h1>
<p class="sub">Locked ids (#292): stick_lighter · woodchip_glue · chipping_wood · bamboo_boesa · echo_whistle · harden pass · not the share URL</p>
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
<figure data-id="buildings-phone">
  <div class="zoom phone"><img src="hub-buildings.svg" alt="Buildings phone" width="72" height="72"></div>
  <figcaption>Phone card<small>hub · Android card</small></figcaption>
</figure>
</div>
<h2>Building cards (5 factories)</h2>
<div class="grid">${figs}</div>
<h2>Android sizes (32 · 48 · 96)</h2>
<div class="grid">${sizes}</div>
<h2>Silhouette proof</h2>
<div class="grid">${sils}</div>
</body></html>
`;
  fs.writeFileSync(path.join(outDir, 'preview.html'), html);
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function hexToRgba(hex) {
  const n = hex.slice(1);
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
    255,
  ];
}

function fillRect(rgba, sheetW, x, y, w, h, color) {
  const [r, g, b, a] = color;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = ((y + j) * sheetW + x + i) * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = a;
    }
  }
}

function blitSprite(rgba, sheetW, px, destX, destY, scale) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!px[y][x]) continue;
      const [r, g, b, a] = hexToRgba(px[y][x]);
      for (let j = 0; j < scale; j++) {
        for (let i = 0; i < scale; i++) {
          const o = ((destY + y * scale + j) * sheetW + destX + x * scale + i) * 4;
          rgba[o] = r;
          rgba[o + 1] = g;
          rgba[o + 2] = b;
          rgba[o + 3] = a;
        }
      }
    }
  }
}

function writePngSheet(sprites, dest, scale, cols) {
  const pad = 16;
  const inset = 8;
  const sprite = SIZE * scale;
  const cell = sprite + inset * 2 + pad;
  const rows = Math.ceil(sprites.length / cols);
  const w = pad + cols * cell;
  const h = pad + rows * cell;
  const rgba = Buffer.alloc(w * h * 4, 0);
  const bgSheet = hexToRgba('#0e1424');
  const card = hexToRgba('#1a2030');
  fillRect(rgba, w, 0, 0, w, h, bgSheet);
  sprites.forEach((s, n) => {
    const col = n % cols;
    const row = Math.floor(n / cols);
    const x0 = pad + col * cell;
    const y0 = pad + row * cell;
    fillRect(rgba, w, x0, y0, sprite + inset * 2, sprite + inset * 2, card);
    blitSprite(rgba, w, s.px, x0 + inset, y0 + inset, scale);
  });
  fs.writeFileSync(dest, encodePng(w, h, rgba));
}

function writeSelfContainedSheet(items, dest) {
  const cells = items.map((b) => {
    const inner = b.svg.replace(/<\/?svg[^>]*>/g, '').trim();
    return `<figure>
      <div class="cell">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="160" height="160" shape-rendering="crispEdges">${inner}</svg>
      </div>
      <figcaption>${b.name}<small>${b.id}</small></figcaption>
    </figure>`;
  }).join('');
  const html = `<!DOCTYPE html>
<html lang="nl"><head>
<meta charset="utf-8">
<title>Building pixels — sheet</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:28px 24px 36px}
  h1{font-family:Georgia,serif;color:#ffd75e;font-size:26px;margin:0 0 6px}
  .sub{opacity:.7;margin:0 0 20px;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:720px}
  figure{margin:0;text-align:center}
  .cell{width:176px;height:176px;margin:0 auto;border-radius:20px;
    background:linear-gradient(180deg,#2a3348,#1a2030);
    box-shadow:0 8px 0 #0a0d18, inset 0 0 0 1px rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:center}
  svg{image-rendering:pixelated}
  figcaption{margin-top:8px;font-size:13px;font-weight:700}
  figcaption small{display:block;opacity:.55;font-weight:600;margin-top:2px}
</style>
</head><body>
<h1>Fabrieken — harden pass</h1>
<p class="sub">32×32 stickman-pixel · locked #292 ids · Android card zoom</p>
<div class="grid">${cells}</div>
</body></html>`;
  fs.writeFileSync(dest, html);
}

function writeZoomSheet(items, dest) {
  const cells = items.map((b) => {
    const inner = b.svg.replace(/<\/?svg[^>]*>/g, '').trim();
    return `<figure>
      <div class="cell">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="256" height="256" shape-rendering="crispEdges">${inner}</svg>
      </div>
      <figcaption>${b.name}<small>${b.id} · 8× zoom</small></figcaption>
    </figure>`;
  }).join('');
  const html = `<!DOCTYPE html>
<html lang="nl"><head>
<meta charset="utf-8">
<title>Building pixels — zoom</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:28px 24px 36px}
  h1{font-family:Georgia,serif;color:#ffd75e;font-size:26px;margin:0 0 6px}
  .sub{opacity:.7;margin:0 0 20px;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;max-width:980px}
  figure{margin:0;text-align:center}
  .cell{width:280px;height:280px;margin:0 auto;border-radius:24px;
    background:linear-gradient(180deg,#2a3348,#1a2030);
    box-shadow:0 10px 0 #0a0d18, inset 0 0 0 1px rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:center}
  svg{image-rendering:pixelated}
  figcaption{margin-top:10px;font-size:14px;font-weight:700}
  figcaption small{display:block;opacity:.55;font-weight:600;margin-top:2px}
</style>
</head><body>
<h1>Fabrieken — 8× zoom</h1>
<p class="sub">Pixel-crisp · halo + 2px outline · not the share URL</p>
<div class="grid">${cells}</div>
</body></html>`;
  fs.writeFileSync(dest, html);
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const all = [...BUILDINGS, HUB];
  const painted = [];
  for (const b of all) {
    const px = b.paint();
    const svg = encodeSvg(px);
    const dest = path.join(outDir, b.file);
    fs.writeFileSync(dest, svg);
    const kb = (Buffer.byteLength(svg) / 1024).toFixed(2);
    console.log(`OK ${b.id} → assets/buildings/${b.file} (${kb} KB)`);
    painted.push({ ...b, px, svg });
  }
  for (const a of FILE_ALIASES) {
    const svg = encodeSvg(a.paint());
    fs.writeFileSync(path.join(outDir, a.file), svg);
    console.log(`OK alias ${a.of} → assets/buildings/${a.file}`);
  }
  writePreview(BUILDINGS);
  console.log('OK preview → assets/buildings/preview.html');

  const previewDir = path.join(outDir, '_preview');
  fs.mkdirSync(previewDir, { recursive: true });
  writeSelfContainedSheet(painted, path.join(previewDir, 'sheet.html'));
  writeZoomSheet(painted, path.join(previewDir, 'zoom-sheet.html'));
  writePngSheet(painted, path.join(previewDir, 'sheet-3x.png'), 3, 3);
  writePngSheet(painted, path.join(previewDir, 'native-32.png'), 1, 6);
  writePngSheet(painted, path.join(previewDir, 'zoom-8x.png'), 8, 3);
  console.log('OK sheets → assets/buildings/_preview/');
}

main();
