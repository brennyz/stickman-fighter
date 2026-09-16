#!/usr/bin/env node
/**
 * Stickman-pixel factory icons (32×32 crisp SVG) + preview sheet + PNG zooms.
 * Source of truth for assets/buildings/*.svg — run: node scripts/gen-building-pixels.mjs
 *
 * Art v2.1: prop-first silhouettes + in-SVG factory life (CSS, img-safe).
 * No idle/active variants — wire map has a single card slot.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/buildings');
const previewDir = path.join(outDir, '_preview');

/**
 * Shared set palette. Brighter walls + inkier outline than v1 so the icons
 * pop on the game chrome (#0e1424) without looking like five grey sheds.
 */
const C = {
  k: '#0a0c14', // ink outline (stronger than v1 #14161e)
  p: '#1a2030',
  m: '#333c55',
  l: '#5a6788', // wall (lifted from #4a5570)
  hili: '#7b8aaa', // rim
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
  b: '#3d8a38',
  h: '#4a3018',
  a: '#6a7388',
  q: '#d4e05a',
  j: '#8a9a2a',
  v: '#b87333',
  x: '#ffb0b8',
  glueHi: '#f3f7a8',
  copperHi: '#e8a44a',
  purpleHi: '#e0c0ff',
  flameCore: '#fff6c0',
  groundDeep: '#2a1c10',
};

const SIZE = 32;

function blank() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function set(px, x, y, c) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  px[y][x] = c;
}

function get(px, x, y) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  return px[y][x];
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

function oval(px, cx, cy, rx, ry, c) {
  const rx2 = rx * rx || 1;
  const ry2 = ry * ry || 1;
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / rx2 + (y * y) / ry2 <= 1) set(px, cx + x, cy + y, c);
    }
  }
}

function ring(px, cx, cy, r, c, thickness = 1) {
  const r2 = r * r;
  const i2 = Math.max(0, r - thickness) * Math.max(0, r - thickness);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r2 && d >= i2) set(px, cx + x, cy + y, c);
    }
  }
}

/** Dark halo around every filled pixel — keeps the set readable on #0e1424. */
function silhouetteHalo(px, edge = C.k) {
  const add = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (px[y][x]) continue;
      if (get(px, x - 1, y) || get(px, x + 1, y) || get(px, x, y - 1) || get(px, x, y + 1)) {
        add.push([x, y]);
      }
    }
  }
  for (const [x, y] of add) set(px, x, y, edge);
}

/** Left/top rim on wall pixels so blocks read as volume, not flat grey. */
function rimLight(px, walls, rim = C.hili) {
  const wall = new Set(walls);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!wall.has(px[y][x])) continue;
      const left = get(px, x - 1, y);
      const top = get(px, x, y - 1);
      if (left === C.k || top === C.k || left == null || top == null) {
        set(px, x, y, rim);
      }
    }
  }
}

function pane(px, x, y, lit = C.g, hi = C.y) {
  rect(px, x, y, 2, 2, lit);
  set(px, x, y, hi);
}

function paintGround(px) {
  hline(px, 1, 30, 30, C.h);
  hline(px, 0, 30, 1, C.groundDeep);
  hline(px, 31, 30, 1, C.groundDeep);
  hline(px, 2, 31, 28, C.groundDeep);
}

/** Tiny stickman — flavor, never the hero. */
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

function flame(px, cx, tipY) {
  // chunky teardrop — must read at 32×32
  set(px, cx, tipY, C.flameCore);
  hline(px, cx - 1, tipY + 1, 3, C.y);
  set(px, cx, tipY + 1, C.flameCore);
  hline(px, cx - 2, tipY + 2, 5, C.f);
  hline(px, cx - 1, tipY + 2, 3, C.y);
  set(px, cx, tipY + 2, C.flameCore);
  hline(px, cx - 3, tipY + 3, 7, C.f);
  hline(px, cx - 2, tipY + 3, 5, C.y);
  set(px, cx, tipY + 3, C.flameCore);
  set(px, cx - 3, tipY + 3, C.r);
  set(px, cx + 3, tipY + 3, C.r);
  hline(px, cx - 2, tipY + 4, 5, C.f);
  hline(px, cx - 1, tipY + 4, 3, C.y);
  hline(px, cx - 1, tipY + 5, 3, C.f);
  set(px, cx, tipY + 5, C.r);
  set(px, cx - 4, tipY + 2, C.f);
  set(px, cx + 4, tipY + 1, C.y);
  set(px, cx + 5, tipY + 3, C.f);
}

/** Stick-Lighter — the factory IS a giant zippo, flame reads first. */
function paintStickLighter() {
  const px = blank();
  paintGround(px);

  // brick plinth / factory skirt
  outlineBox(px, 8, 22, 17, 8, C.m);
  rect(px, 9, 23, 15, 6, C.l);
  pane(px, 10, 24, C.c, C.s);
  pane(px, 21, 24, C.c, C.s);
  outlineBox(px, 14, 24, 5, 6, C.w);
  vline(px, 16, 25, 4, C.t);
  set(px, 15, 26, C.t);

  // giant lighter body
  outlineBox(px, 12, 9, 11, 14, C.o);
  rect(px, 13, 10, 9, 12, C.g);
  rect(px, 14, 11, 7, 10, C.y);
  // flint wheel
  outlineBox(px, 15, 11, 5, 3, C.a);
  rect(px, 16, 12, 3, 1, C.i);
  set(px, 17, 12, C.g);
  // fuel window
  outlineBox(px, 15, 15, 5, 4, C.k);
  rect(px, 16, 16, 3, 2, C.c);
  set(px, 17, 16, C.s);
  // metal band
  hline(px, 13, 20, 9, C.o);
  hline(px, 13, 21, 9, C.v);

  // hinged cap — overlaps the top-right so it reads as an open zippo lid
  outlineBox(px, 19, 5, 8, 5, C.o);
  rect(px, 20, 6, 6, 3, C.copperHi);
  rect(px, 19, 8, 3, 2, C.v); // hinge into the body

  // flame (hero) — core stays static; sparks / window live in life layers
  flame(px, 16, 0);
  set(px, 21, 4, C.f);

  const sparks = blank();
  set(sparks, 12, 0, C.y);
  set(sparks, 20, 1, C.f);
  set(sparks, 11, 2, C.r);
  set(sparks, 21, 3, C.y);
  set(sparks, 22, 2, C.f);
  const tips = blank();
  set(tips, 5, 10, C.y);
  set(tips, 6, 10, C.f);
  set(tips, 8, 12, C.y);
  set(tips, 17, 16, C.i); // fuel-window flash

  // 2px matchsticks (stick-lighter, not a generic forge)
  rect(px, 5, 14, 2, 10, C.t);
  rect(px, 5, 12, 2, 2, C.f);
  set(px, 5, 11, C.y);
  set(px, 6, 11, C.y);
  rect(px, 8, 16, 2, 8, C.w);
  rect(px, 8, 14, 2, 2, C.o);
  set(px, 8, 13, C.f);
  set(px, 9, 13, C.f);
  rect(px, 3, 18, 2, 6, C.t);
  rect(px, 3, 16, 2, 2, C.r);

  stickman(px, 2, 25, C.k, C.y);
  rimLight(px, [C.l, C.m, C.g]);
  return scene(px, [
    { cls: 'flicker', px: sparks },
    { cls: 'flicker2', px: tips },
  ]);
}

/** Woodchip-Glue — hopper of chips feeding a dripping lime vat. */
function paintWoodchipGlue() {
  const px = blank();
  paintGround(px);

  // hopper sits ON the vat (industrial tank) — chips read first
  outlineBox(px, 15, 2, 15, 8, C.w);
  rect(px, 16, 3, 13, 6, C.t);
  [[17, 3, C.o], [19, 3, C.h], [21, 3, C.w], [23, 3, C.o], [25, 3, C.h], [27, 3, C.w],
   [18, 4, C.h], [20, 4, C.o], [22, 4, C.w], [24, 4, C.t], [26, 4, C.o],
   [17, 5, C.w], [19, 5, C.o], [21, 5, C.h], [23, 5, C.o], [25, 5, C.w], [27, 5, C.h],
   [18, 6, C.o], [20, 6, C.h], [22, 6, C.t], [24, 6, C.o], [26, 6, C.w],
   [19, 7, C.h], [21, 7, C.o], [23, 7, C.w], [25, 7, C.o]].forEach(([x, y, c]) => set(px, x, y, c));
  // funnel into vat
  hline(px, 17, 10, 11, C.k);
  hline(px, 18, 11, 9, C.h);
  hline(px, 19, 12, 7, C.k);

  // tiny shed left (support, not the hero)
  outlineBox(px, 1, 19, 8, 11, C.m);
  rect(px, 2, 20, 6, 9, C.l);
  pane(px, 3, 21, C.c, C.s);
  outlineBox(px, 3, 24, 3, 6, C.h);

  // GIANT glue vat
  disk(px, 22, 21, 8, C.k);
  disk(px, 22, 21, 7, C.j);
  oval(px, 22, 20, 6, 5, C.q);
  oval(px, 22, 19, 5, 3, C.glueHi);
  // bubbles
  set(px, 19, 18, C.i);
  set(px, 23, 17, C.i);
  set(px, 25, 19, C.y);
  set(px, 20, 20, C.q);
  // rim
  hline(px, 16, 14, 13, C.k);
  hline(px, 17, 13, 11, C.a);
  hline(px, 18, 12, 9, C.i);
  // drips (static legs + animated drop)
  vline(px, 19, 28, 2, C.q);
  set(px, 19, 29, C.j);
  vline(px, 25, 28, 2, C.q);
  set(px, 25, 29, C.j);
  set(px, 22, 28, C.glueHi);

  const glow = blank();
  oval(glow, 22, 19, 4, 3, C.glueHi);
  set(glow, 21, 18, C.i);
  set(glow, 23, 17, C.y);
  const drip = blank();
  set(drip, 22, 27, C.q);
  set(drip, 22, 29, C.j);
  const chips = blank();
  set(chips, 20, 4, C.o);
  set(chips, 24, 5, C.y);
  set(chips, 26, 6, C.h);

  // chip pile
  set(px, 2, 28, C.t);
  set(px, 3, 28, C.w);
  set(px, 4, 28, C.o);
  set(px, 3, 27, C.h);
  set(px, 5, 29, C.t);
  set(px, 13, 28, C.o);
  set(px, 14, 29, C.w);

  stickman(px, 7, 25, C.k, C.i);
  rimLight(px, [C.l, C.m]);
  return scene(px, [
    { cls: 'glow', px: glow },
    { cls: 'drip', px: drip },
    { cls: 'flicker2', px: chips },
  ]);
}

/** Chipping-Wood — toothy chipper eating a log, chips flying. */
function paintChippingWood() {
  const px = blank();
  paintGround(px);

  // shed (support)
  outlineBox(px, 1, 12, 12, 18, C.m);
  rect(px, 2, 13, 10, 16, C.l);
  rect(px, 1, 11, 12, 2, C.w);
  hline(px, 1, 11, 12, C.k);
  pane(px, 4, 15, C.c, C.s);
  // open bay so the log/saw read as one machine
  rect(px, 10, 18, 4, 11, C.p);

  // log feeding the teeth
  rect(px, 0, 19, 16, 5, C.w);
  hline(px, 0, 19, 16, C.t);
  hline(px, 0, 23, 16, C.h);
  set(px, 2, 20, C.h);
  set(px, 5, 21, C.t);
  set(px, 8, 20, C.h);
  set(px, 11, 21, C.t);
  // cut face
  vline(px, 15, 19, 5, C.t);
  set(px, 15, 21, C.o);
  set(px, 14, 21, C.y);

  // GIANT circular chipper
  disk(px, 21, 17, 9, C.k);
  disk(px, 21, 17, 8, C.i);
  disk(px, 21, 17, 7, C.d);
  disk(px, 21, 17, 5, C.a);
  disk(px, 21, 17, 2, C.k);
  set(px, 21, 17, C.g);
  set(px, 20, 17, C.o);
  set(px, 22, 17, C.o);
  // teeth live on the spin layer so the chipper can step
  const teeth = [
    [21, 8], [26, 10], [29, 14], [29, 20], [26, 24],
    [21, 26], [16, 24], [13, 20], [13, 14], [16, 10],
  ];
  const blade = blank();
  teeth.forEach(([x, y]) => {
    rect(blade, x - 1, y - 1, 2, 2, C.c);
    set(blade, x, y, C.i);
  });

  // flying chips
  [[26, 4, C.t], [28, 6, C.w], [30, 3, C.o], [27, 8, C.h],
   [30, 7, C.t], [24, 3, C.w], [29, 10, C.o]].forEach(([x, y, c]) => {
    set(px, x, y, c);
    set(px, x + 1, y, c);
  });
  const chips = blank();
  [[27, 3, C.t], [30, 5, C.o], [25, 5, C.w]].forEach(([x, y, c]) => {
    set(chips, x, y, c);
    set(chips, x + 1, y, c);
  });

  // sawdust puff
  set(px, 6, 8, C.s);
  set(px, 7, 7, C.i);
  set(px, 8, 8, C.s);

  stickman(px, 5, 25, C.k, C.i);
  rimLight(px, [C.l, C.m, C.d]);
  return scene(px, [
    { cls: 'spin', px: blade, origin: [21, 17] },
    { cls: 'flicker2', px: chips },
  ]);
}

/** Bamboo-Boesa — grove + round copper boiler with a whistle-face. */
function paintBambooBoesa() {
  const px = blank();
  paintGround(px);

  const stalk = (x, top) => {
    vline(px, x, top, 30 - top, C.b);
    vline(px, x + 1, top, 30 - top, C.e);
    vline(px, x + 2, top, 30 - top, C.b);
    for (let y = top + 5; y < 30; y += 6) hline(px, x, y, 3, C.h);
    set(px, x - 1, top + 1, C.n);
    set(px, x + 3, top + 2, C.n);
  };
  stalk(2, 6);
  stalk(6, 2);
  stalk(10, 7);

  // boiler body (hero)
  disk(px, 22, 20, 8, C.k);
  disk(px, 22, 20, 7, C.v);
  disk(px, 22, 19, 6, C.o);
  disk(px, 21, 18, 3, C.copperHi);
  // rivets
  [[16, 17], [28, 17], [16, 23], [28, 23], [22, 13], [15, 20], [29, 20]].forEach(([x, y]) => {
    set(px, x, y, C.k);
    set(px, x, y - 1, C.g);
  });

  // face — readable at 32
  set(px, 19, 18, C.i);
  set(px, 25, 18, C.i);
  set(px, 19, 19, C.k);
  set(px, 25, 19, C.k);
  hline(px, 20, 23, 5, C.k);
  set(px, 19, 22, C.k);
  set(px, 25, 22, C.k);

  // pressure whistle stacks (signature)
  outlineBox(px, 20, 4, 4, 8, C.g);
  rect(px, 21, 5, 2, 6, C.y);
  outlineBox(px, 25, 6, 3, 6, C.o);
  rect(px, 26, 7, 1, 4, C.copperHi);
  hline(px, 20, 11, 8, C.k);

  // one static puff so the stack still reads; extras live in steam/glow
  disk(px, 23, 2, 2, C.i);
  const steam = blank();
  disk(steam, 18, 3, 2, C.s);
  disk(steam, 27, 4, 2, C.s);
  set(steam, 16, 5, C.s);
  set(steam, 25, 1, C.i);
  set(steam, 29, 2, C.s);
  const glow = blank();
  disk(glow, 21, 18, 2, C.y);
  set(glow, 22, 9, C.i);

  // stand
  vline(px, 16, 27, 3, C.k);
  vline(px, 28, 27, 3, C.k);
  hline(px, 16, 27, 13, C.k);

  stickman(px, 14, 25, C.k, C.i);
  return scene(px, [
    { cls: 'steam', px: steam },
    { cls: 'glow', px: glow },
  ]);
}

/** Echo-Whistle — organ-pipe mill shouting cyan/purple rings. */
function paintEchoWhistle() {
  const px = blank();
  paintGround(px);

  // pipe cluster (the mill IS the whistle)
  const pipe = (x, top, w, body, hi) => {
    outlineBox(px, x, top, w, 30 - top, C.k);
    rect(px, x + 1, top + 1, w - 2, 28 - top, body);
    vline(px, x + 1, top + 1, 28 - top, hi);
    // mouth cap
    hline(px, x, top, w, C.i);
    hline(px, x + 1, top + 1, w - 2, hi);
  };
  pipe(5, 10, 4, C.u, C.purpleHi);
  pipe(9, 3, 5, C.u, C.purpleHi);
  pipe(14, 8, 4, C.d, C.i);

  // mill hub stays; paddles wiggle on a life layer
  disk(px, 11, 4, 1, C.g);
  set(px, 11, 4, C.k);
  const paddles = blank();
  rect(paddles, 6, 2, 4, 3, C.x);
  rect(paddles, 13, 2, 4, 3, C.x);
  rect(paddles, 10, 0, 3, 2, C.u);

  // factory skirt / door under pipes
  outlineBox(px, 5, 22, 13, 8, C.m);
  rect(px, 6, 23, 11, 6, C.l);
  outlineBox(px, 9, 24, 4, 6, C.h);
  set(px, 12, 26, C.t);
  pane(px, 6, 24, C.c, C.s);

  // horn / whistle mouth pointing right
  outlineBox(px, 17, 16, 6, 6, C.g);
  rect(px, 18, 17, 4, 4, C.y);
  rect(px, 21, 18, 3, 2, C.o);
  set(px, 23, 19, C.k);

  // inner ring static; outer rings pulse
  ring(px, 25, 19, 3, C.c);
  const ringA = blank();
  ring(ringA, 26, 19, 5, C.u);
  const ringB = blank();
  ring(ringB, 27, 19, 7, C.c);
  // keep horn readable over rings
  outlineBox(px, 17, 16, 6, 6, C.g);
  rect(px, 18, 17, 4, 4, C.y);
  rect(px, 21, 18, 3, 2, C.o);

  stickman(px, 2, 25, C.k, C.i);
  rimLight(px, [C.l, C.m, C.u]);
  return scene(px, [
    { cls: 'wiggle', px: paddles, origin: [11, 4] },
    { cls: 'echo', px: ringA },
    { cls: 'echo2', px: ringB },
  ]);
}

/** HOME tile — factory district: all five signatures in one skyline. */
function paintHubBuildings() {
  const px = blank();
  paintGround(px);

  // bamboo sliver
  vline(px, 1, 8, 22, C.b);
  vline(px, 2, 8, 22, C.e);
  vline(px, 3, 8, 22, C.b);
  hline(px, 1, 13, 3, C.h);
  hline(px, 1, 20, 3, C.h);
  set(px, 0, 9, C.n);

  // stick-lighter + flame
  outlineBox(px, 5, 15, 7, 15, C.m);
  rect(px, 6, 16, 5, 13, C.l);
  pane(px, 6, 18, C.g, C.y);
  outlineBox(px, 6, 8, 5, 7, C.o);
  rect(px, 7, 9, 3, 5, C.g);
  flame(px, 8, 1);
  outlineBox(px, 7, 23, 3, 7, C.w);
  const sparks = blank();
  set(sparks, 5, 1, C.f);
  set(sparks, 11, 0, C.y);
  set(sparks, 10, 3, C.r);

  // glue vat
  disk(px, 16, 24, 5, C.k);
  disk(px, 16, 24, 4, C.q);
  disk(px, 16, 23, 3, C.glueHi);
  set(px, 15, 22, C.i);
  hline(px, 13, 19, 7, C.a);

  // chipping saw — chunky teeth so it is not a plus
  disk(px, 21, 17, 5, C.k);
  disk(px, 21, 17, 4, C.i);
  disk(px, 21, 17, 3, C.d);
  set(px, 21, 17, C.g);
  [[21, 12], [25, 14], [26, 17], [25, 20], [21, 22], [17, 20], [16, 17], [17, 14]]
    .forEach(([x, y]) => { set(px, x, y, C.c); set(px, x, y - 1, C.i); });

  // echo pipes + ring
  outlineBox(px, 24, 9, 4, 21, C.k);
  rect(px, 25, 10, 2, 19, C.u);
  outlineBox(px, 28, 13, 3, 17, C.k);
  rect(px, 29, 14, 1, 15, C.purpleHi);
  ring(px, 28, 17, 3, C.c);
  set(px, 25, 8, C.s);
  const vatGlow = blank();
  set(vatGlow, 15, 22, C.i);
  set(vatGlow, 16, 21, C.y);
  const toot = blank();
  ring(toot, 28, 17, 3, C.c);

  stickman(px, 12, 25, C.k, C.y);
  rimLight(px, [C.l, C.m]);
  return scene(px, [
    { cls: 'flicker', px: sparks },
    { cls: 'glow', px: vatGlow },
    { cls: 'echo', px: toot },
  ]);
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

/**
 * In-file CSS so motion runs when the SVG is an <img> (Android Chrome / TWA).
 * steps() keeps the pixel crunch; no filters, no JS, no extra HTTP.
 * prefers-reduced-motion leaves the static silhouette.
 */
const LIFE_CSS = `<style>@media (prefers-reduced-motion:no-preference){.flicker{animation:flicker 1.05s steps(2,end) infinite}.flicker2{animation:flicker 1.4s steps(2,end) infinite reverse}.glow{animation:glow 2.4s ease-in-out infinite}.drip{animation:drip 1.55s steps(2,end) infinite}.spin{transform-box:fill-box;transform-origin:center;animation:spin 3.2s steps(8,end) infinite}.wiggle{transform-box:fill-box;transform-origin:center;animation:wiggle 2.8s steps(2,end) infinite}.steam{animation:steam 2.5s steps(3,end) infinite}.echo{animation:echo 2.1s ease-in-out infinite}.echo2{animation:echo 2.7s ease-in-out .35s infinite}}@keyframes flicker{50%{opacity:.22}}@keyframes glow{0%,100%{opacity:.3}50%{opacity:.92}}@keyframes drip{0%,100%{opacity:1}50%{opacity:.15}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes wiggle{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}@keyframes steam{0%{opacity:.85}100%{opacity:0}}@keyframes echo{0%,100%{opacity:.22}50%{opacity:1}}</style>`;

function scene(base, layers) {
  return { base, layers: (layers || []).filter((L) => L && L.px) };
}

function encodePaths(px) {
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
  return [...byColor.entries()]
    .map(([c, ds]) => `<path fill="${c}" d="${ds.join('')}"/>`)
    .join('');
}

function asScene(sceneOrPx) {
  if (sceneOrPx && sceneOrPx.base) return sceneOrPx;
  return { base: sceneOrPx, layers: [] };
}

function flatten(sceneOrPx) {
  const { base, layers } = asScene(sceneOrPx);
  const out = blank();
  const stamp = (src) => {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (src[y][x]) out[y][x] = src[y][x];
      }
    }
  };
  stamp(base);
  for (const L of layers) stamp(L.px);
  return out;
}

/** SMIL is what Chrome/Android actually run on SVG-as-<img>; CSS covers inline + reduced-motion. */
function lifeAnim(cls, origin) {
  const [ox, oy] = origin || [16, 16];
  if (cls === 'flicker') {
    return '<animate attributeName="opacity" values="1;.22;1" dur="1.05s" repeatCount="indefinite" calcMode="discrete"/>';
  }
  if (cls === 'flicker2') {
    return '<animate attributeName="opacity" values="1;.22;1" dur="1.4s" repeatCount="indefinite" calcMode="discrete"/>';
  }
  if (cls === 'glow') {
    return '<animate attributeName="opacity" values=".3;.92;.3" dur="2.4s" repeatCount="indefinite"/>';
  }
  if (cls === 'drip') {
    return '<animate attributeName="opacity" values="1;.15;1" dur="1.55s" repeatCount="indefinite" calcMode="discrete"/>';
  }
  if (cls === 'spin') {
    return `<animateTransform attributeName="transform" type="rotate" values="0 ${ox} ${oy};45 ${ox} ${oy};90 ${ox} ${oy};135 ${ox} ${oy};180 ${ox} ${oy};225 ${ox} ${oy};270 ${ox} ${oy};315 ${ox} ${oy};360 ${ox} ${oy}" dur="3.2s" repeatCount="indefinite" calcMode="discrete"/>`;
  }
  if (cls === 'wiggle') {
    return `<animateTransform attributeName="transform" type="rotate" values="-14 ${ox} ${oy};14 ${ox} ${oy};-14 ${ox} ${oy}" dur="2.8s" repeatCount="indefinite" calcMode="discrete"/>`;
  }
  if (cls === 'steam') {
    return '<animate attributeName="opacity" values=".85;0;.85" dur="2.5s" repeatCount="indefinite" calcMode="discrete"/>';
  }
  if (cls === 'echo' || cls === 'echo2') {
    const dur = cls === 'echo2' ? '2.7s' : '2.1s';
    return `<animate attributeName="opacity" values=".22;1;.22" dur="${dur}" repeatCount="indefinite"/>`;
  }
  return '';
}

function encodeSvg(sceneOrPx) {
  const { base, layers } = asScene(sceneOrPx);
  const layerXml = layers
    .map((L) => {
      const paths = encodePaths(L.px);
      if (!paths) return '';
      return `<g class="${L.cls}">${lifeAnim(L.cls, L.origin)}${paths}</g>`;
    })
    .join('');
  const css = layers.length ? LIFE_CSS : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" shape-rendering="crispEdges">${css}${encodePaths(base)}${layerXml}</svg>\n`;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(px, scale, bg = '#0e1424') {
  const w = SIZE * scale;
  const h = SIZE * scale;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  const parse = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const bgRgb = bg ? parse(bg) : null;
  for (let y = 0; y < h; y++) {
    const row = y * (w * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const hex = px[(y / scale) | 0][(x / scale) | 0];
      const i = row + 1 + x * 4;
      if (!hex) {
        if (bgRgb) {
          raw[i] = bgRgb[0]; raw[i + 1] = bgRgb[1]; raw[i + 2] = bgRgb[2]; raw[i + 3] = 255;
        }
      } else {
        const [r, g, b] = parse(hex);
        raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function writePreview(items) {
  const card = (b, cls = '') => `
<figure data-id="${b.id}">
  <div class="zoom ${cls}"><img src="${b.file}" alt="${b.name}" width="96" height="96"></div>
  <figcaption>${b.name}<small>${b.id}</small></figcaption>
</figure>`;

  const zoom192 = (b) => `
<figure data-id="${b.id}-192">
  <div class="zoom z192"><img src="${b.file}" alt="${b.name}" width="192" height="192"></div>
  <figcaption>${b.name}</figcaption>
</figure>`;

  const native32 = (b) => `
<figure data-id="${b.id}-32">
  <div class="zoom z32"><img src="${b.file}" alt="${b.name}" width="32" height="32"></div>
  <figcaption>${b.name}</figcaption>
</figure>`;

  const phone = (b) => `
<article class="phone" data-id="${b.id}-card">
  <img src="${b.file}" alt="${b.name}" width="64" height="64">
  <div><strong>${b.name}</strong><span>${b.id}</span></div>
</article>`;

  const html = `<!DOCTYPE html>
<html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stickman Fighter — building pixels</title>
<style>
  :root { --bg:#0e1424; --ink:#e8f0ff; --gold:#ffd75e; --dim:#9db1e3; --card:#1a2030; --card2:#2a3348; }
  html,body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,sans-serif}
  body{padding:28px 22px 48px;max-width:1100px}
  h1{font-family:Georgia,serif;color:var(--gold);font-size:26px;margin:0 0 4px}
  .sub{opacity:.72;margin:0 0 20px;font-size:13px;line-height:1.45}
  h2{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:28px 0 12px}
  .sheet{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 16px}
  @media (max-width:720px){ .sheet{grid-template-columns:repeat(2,minmax(0,1fr))} }
  figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px}
  .zoom{width:128px;height:128px;border-radius:22px;background:linear-gradient(180deg,var(--card2),var(--card));
    box-shadow:0 7px 0 #070a12, inset 0 0 0 1px rgba(255,255,255,.08);
    display:flex;align-items:center;justify-content:center;image-rendering:pixelated}
  .zoom img{width:96px;height:96px;image-rendering:pixelated}
  .zoom.z192{width:220px;height:220px;border-radius:28px}
  .zoom.z192 img{width:192px;height:192px}
  .zoom.z32{width:64px;height:64px;border-radius:14px}
  .zoom.z32 img{width:32px;height:32px}
  .zoom.hub{background:linear-gradient(180deg,#3a3040,var(--card))}
  figcaption{font-size:13px;font-weight:700;text-align:center;letter-spacing:.01em}
  figcaption small{display:block;font-weight:600;opacity:.55;margin-top:2px;font-size:11px}
  .phones{display:grid;gap:10px}
  .phone{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;
    background:linear-gradient(180deg,var(--card2),var(--card));
    box-shadow:0 4px 0 #070a12, inset 0 0 0 1px rgba(255,255,255,.07)}
  .phone img{width:64px;height:64px;image-rendering:pixelated;flex:none}
  .phone strong{display:block;font-size:14px}
  .phone span{display:block;font-size:11px;opacity:.55;margin-top:2px}
  .zooms,.natives,.strokes{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
  .natives{grid-template-columns:repeat(auto-fill,minmax(90px,1fr))}
  .strokes{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
  .strokes .zoom img{width:48px;height:48px;image-rendering:auto}
  .note{margin-top:28px;font-size:12px;opacity:.55}
</style>
</head><body>
<h1>Fabrieken — stickman pixel</h1>
<p class="sub">Locked ids (#292): stick_lighter · woodchip_glue · chipping_wood · bamboo_boesa · echo_whistle.
Art v2.1: prop-first silhouettes + in-SVG factory life (flicker / glow / spin hint). CSS inside the SVG so <code>&lt;img&gt;</code> on Android still moves. <code>prefers-reduced-motion</code> freezes the still. No idle/active variants. Not the share URL.</p>

<h2>Sheet — display names</h2>
<div class="sheet">
${items.map((b) => card(b)).join('')}
<figure data-id="buildings">
  <div class="zoom hub"><img src="hub-buildings.svg" alt="Buildings" width="96" height="96"></div>
  <figcaption>Buildings<small>HOME hub</small></figcaption>
</figure>
</div>

<h2>Android cards (~64px art)</h2>
<div class="phones">
${items.map(phone).join('')}
</div>

<h2>192px zoom</h2>
<div class="zooms">
${items.map(zoom192).join('')}
<figure data-id="buildings-192">
  <div class="zoom z192 hub"><img src="hub-buildings.svg" alt="Buildings" width="192" height="192"></div>
  <figcaption>Buildings</figcaption>
</figure>
</div>

<h2>32×32 native</h2>
<div class="natives">
${items.map(native32).join('')}
<figure data-id="buildings-32">
  <div class="zoom z32 hub"><img src="hub-buildings.svg" alt="Buildings" width="32" height="32"></div>
  <figcaption>Buildings</figcaption>
</figure>
</div>

<h2>HOME + factory strokes</h2>
<div class="strokes">
<figure data-id="buildings-stroke">
  <div class="zoom hub"><img src="../buttons/hub/buildings.svg" alt="Buildings stroke" width="48" height="48"></div>
  <figcaption>Buildings<small>HOME stroke</small></figcaption>
</figure>
<figure><div class="zoom"><img src="../buttons/modes/buildings-stick-lighter.svg" alt="" width="48" height="48"></div><figcaption>Stick-Lighter Factory</figcaption></figure>
<figure><div class="zoom"><img src="../buttons/modes/buildings-woodchip-glue.svg" alt="" width="48" height="48"></div><figcaption>Woodchip-Glue Factory</figcaption></figure>
<figure><div class="zoom"><img src="../buttons/modes/buildings-chipping-wood.svg" alt="" width="48" height="48"></div><figcaption>Chipping-Wood Factory</figcaption></figure>
<figure><div class="zoom"><img src="../buttons/modes/buildings-bamboo-boesa.svg" alt="" width="48" height="48"></div><figcaption>Bamboo-Boesa Boiler</figcaption></figure>
<figure><div class="zoom"><img src="../buttons/modes/buildings-echo-whistle.svg" alt="" width="48" height="48"></div><figcaption>Echo-Whistle Mill</figcaption></figure>
</div>
<p class="note">Motion lives in the SVG files (not this page’s CSS). Regenerate with <code>npm run pixels:buildings</code> · map: BUILDING-PIXEL-MAP.md · share URL stays speel.html</p>
</body></html>
`;
  fs.writeFileSync(path.join(outDir, 'preview.html'), html);
}

function writeShotSheet(items) {
  const cell = (src, name) => `
<figure>
  <div class="tile"><img src="../${src}" alt="${name}"></div>
  <figcaption>${name}</figcaption>
</figure>`;
  const html = `<!DOCTYPE html>
<html lang="nl"><head>
<meta charset="utf-8">
<title>Factory pixel sheet</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:36px 40px 40px;width:1040px;box-sizing:border-box}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 24px}
  figure{margin:0;text-align:center}
  .tile{width:240px;height:240px;margin:0 auto;border-radius:36px;
    background:#141a2b;display:flex;align-items:center;justify-content:center}
  .tile img{width:176px;height:176px;image-rendering:pixelated}
  figcaption{margin-top:12px;font-size:16px;font-weight:600;letter-spacing:.01em}
</style></head><body>
<div class="grid">
${items.map((b) => cell(b.file, b.name)).join('')}
${cell(HUB.file, 'HOME hub')}
</div>
</body></html>`;
  fs.writeFileSync(path.join(previewDir, 'sheet.html'), html);

  const zooms = `<!DOCTYPE html>
<html lang="nl"><head>
<meta charset="utf-8">
<title>Factory pixel zooms</title>
<style>
  html,body{margin:0;background:#0e1424;color:#e8f0ff;font-family:system-ui,sans-serif}
  body{padding:28px 32px;width:1280px;box-sizing:border-box}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  figure{margin:0;text-align:center}
  .tile{width:220px;height:220px;margin:0 auto;border-radius:28px;
    background:#141a2b;display:flex;align-items:center;justify-content:center}
  .tile img{width:192px;height:192px;image-rendering:pixelated}
  figcaption{margin-top:10px;font-size:15px;font-weight:600}
</style></head><body>
<div class="grid">
${[...items, HUB].map((b) => `
<figure><div class="tile"><img src="../${b.file}" alt="${b.name}"></div><figcaption>${b.name}</figcaption></figure>`).join('')}
</div>
</body></html>`;
  fs.writeFileSync(path.join(previewDir, 'zooms.html'), zooms);
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });
  const all = [...BUILDINGS, HUB];
  for (const b of all) {
    const painted = b.paint();
    const svg = encodeSvg(painted);
    fs.writeFileSync(path.join(outDir, b.file), svg);
    const kb = (Buffer.byteLength(svg) / 1024).toFixed(2);
    console.log(`OK ${b.id} → assets/buildings/${b.file} (${kb} KB)`);
    const flat = flatten(painted);
    fs.writeFileSync(path.join(previewDir, `${b.id}-192.png`), encodePng(flat, 6));
    fs.writeFileSync(path.join(previewDir, `${b.id}-32.png`), encodePng(flat, 1));
  }
  for (const a of FILE_ALIASES) {
    fs.writeFileSync(path.join(outDir, a.file), encodeSvg(a.paint()));
    console.log(`OK alias ${a.of} → assets/buildings/${a.file}`);
  }
  writePreview(BUILDINGS);
  writeShotSheet(BUILDINGS);
  console.log('OK preview → assets/buildings/preview.html');
}

main();
