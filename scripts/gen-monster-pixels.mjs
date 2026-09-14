#!/usr/bin/env node
/**
 * Generate 32×32 stickman-pixel monster SVGs + JS maps.
 * Source of truth for family (art) and flagship species slots.
 * Run: node scripts/gen-monster-pixels.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'monsters');
const jsOut = path.join(root, 'src', 'data', 'monster-pixel-maps.js');
const mapOut = path.join(root, 'MONSTER-PIXEL-MAP.md');
const previewOut = path.join(outDir, 'preview.html');

const N = 32;
const CH = {
  empty: '.',
  body: 'B',
  dark: 'D',
  eye: 'W',
  pupil: 'K',
  accent: 'A',
  hi: 'H',
  pink: 'P',
  orange: 'O',
  ink: 'N',
};

const PREVIEW_PAL = {
  B: '#c98850',
  D: '#6b4a28',
  W: '#f4f7ff',
  K: '#1a1a2a',
  A: '#ffe9c9',
  H: 'rgba(255,255,255,.42)',
  P: '#ff8aa0',
  O: '#ff9a42',
  N: '#14161e',
};

const FAMILY_PREVIEW = {
  slime: { B: '#5ad06a', D: '#2e8f3c' },
  bat: { B: '#8a6cf0', D: '#5a3fb0' },
  hedgehog: { B: '#c98850', D: '#8a5a30' },
  ghost: { B: '#cfe6ff', D: '#7aa8cf' },
  can: { B: '#9fb2c8', D: '#5f7189' },
  fox: { B: '#ff8c42', D: '#d05a1e' },
  golem: { B: '#9a917f', D: '#6b6355' },
  dragon: { B: '#e04f4f', D: '#93262b' },
  shark: { B: '#6a9fc8', D: '#2a5080' },
  octo: { B: '#c47aff', D: '#5a2080' },
  cow: { B: '#c98850', D: '#6b4a28' },
  pig: { B: '#ffb0b8', D: '#8a3040' },
  chicken: { B: '#ffe9c9', D: '#c98850' },
  sheep: { B: '#e8eef8', D: '#6b7690' },
  horse: { B: '#8a5a30', D: '#4a3018' },
  goat: { B: '#d4a574', D: '#6b4a28' },
  duck: { B: '#ffd75e', D: '#c97a20' },
  rooster: { B: '#e04f4f', D: '#8a2020' },
  donkey: { B: '#9a917f', D: '#4a4038' },
  goose: { B: '#e8eef8', D: '#5a7088' },
  elephant: { B: '#8a8478', D: '#4a453c' },
  lion: { B: '#e0a040', D: '#8a5018' },
  tiger: { B: '#ff8c42', D: '#1a1a2a' },
  giraffe: { B: '#e0b050', D: '#8a6020' },
  hippo: { B: '#8a7a88', D: '#4a3a48' },
  rhino: { B: '#7a8088', D: '#3a4048' },
  gorilla: { B: '#4a4038', D: '#201810' },
  zebra: { B: '#e8eef8', D: '#1a1a2a' },
  bear: { B: '#8a5a30', D: '#3a2010' },
  croc: { B: '#4a8f52', D: '#1e4a28' },
  kangaroo: { B: '#c98850', D: '#6b4a28' },
  panda: { B: '#e8eef8', D: '#1a1a2a' },
  flamingo: { B: '#ff9ad5', D: '#c04590' },
  camel: { B: '#d4a574', D: '#8a6030' },
};

/** W2 catalog art → #282 map (first-paint aliases). Keep in sync with MONSTER_PIXEL_ALIAS. */
const W2_PIXEL_ALIAS = {
  wolf: { pixel: 'fox', high: 'voidkonijn' },
  owl: { pixel: 'bat' },
  frog: { pixel: 'slime', high: 'voidsly' },
  snake: { pixel: 'croc', high: 'razendekrokodil' },
  boar: { pixel: 'pig', high: 'razendzwijn' },
  raven: { pixel: 'bat' },
  moose: { pixel: 'cow', high: 'holkoe' },
  beaver: { pixel: 'pig' },
  badger: { pixel: 'hedgehog' },
  stag: { pixel: 'horse', high: 'holpaard' },
  lynx: { pixel: 'tiger', high: 'razendetijger' },
  mole: { pixel: 'slime', high: 'frostbub' },
  skeleton: { pixel: 'ghost' },
  mummy: { pixel: 'golem' },
  beetle: { pixel: 'hedgehog' },
  wasp: { pixel: 'bat' },
  spider: { pixel: 'octo' },
  wisp: { pixel: 'ghost' },
  gargoyle: { pixel: 'dragon', high: 'omegadrake' },
  lich: { pixel: 'ghost' },
  drone: { pixel: 'can' },
  bot: { pixel: 'can' },
  scrapdog: { pixel: 'fox', high: 'voidkonijn' },
  cog: { pixel: 'can' },
  turret: { pixel: 'can' },
  rivet: { pixel: 'golem' },
  junkbat: { pixel: 'bat' },
  piston: { pixel: 'golem' },
  penguin: { pixel: 'duck', high: 'kwakophol' },
  yeti: { pixel: 'bear', high: 'razendebeer' },
  walrus: { pixel: 'hippo', high: 'razendnijlpaard' },
  seal: { pixel: 'duck' },
  crab: { pixel: 'hedgehog' },
  turtle: { pixel: 'golem' },
  squid: { pixel: 'octo', high: 'voidocto' },
  ray: { pixel: 'shark', high: 'levihaai' },
};

function grid() {
  return Array.from({ length: N }, () => Array(N).fill(CH.empty));
}

function inb(x, y) {
  return x >= 0 && y >= 0 && x < N && y < N;
}

function set(g, x, y, v) {
  x = Math.round(x); y = Math.round(y);
  if (inb(x, y)) g[y][x] = v;
}

function fillRect(g, x, y, w, h, v) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) set(g, x + i, y + j, v);
  }
}

function fillEllipse(g, cx, cy, rx, ry, v) {
  const rxi = Math.max(1, Math.round(rx));
  const ryi = Math.max(1, Math.round(ry));
  for (let y = -ryi; y <= ryi; y++) {
    for (let x = -rxi; x <= rxi; x++) {
      if ((x * x) / (rxi * rxi) + (y * y) / (ryi * ryi) <= 1.02) set(g, cx + x, cy + y, v);
    }
  }
}

function fillTri(g, x1, y1, x2, y2, x3, y3, v) {
  const minx = Math.floor(Math.min(x1, x2, x3));
  const maxx = Math.ceil(Math.max(x1, x2, x3));
  const miny = Math.floor(Math.min(y1, y2, y3));
  const maxy = Math.ceil(Math.max(y1, y2, y3));
  const area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
  if (!area) return;
  for (let y = miny; y <= maxy; y++) {
    for (let x = minx; x <= maxx; x++) {
      const w1 = ((x2 - x) * (y3 - y) - (x3 - x) * (y2 - y)) / area;
      const w2 = ((x3 - x) * (y1 - y) - (x1 - x) * (y3 - y)) / area;
      const w3 = 1 - w1 - w2;
      if (w1 >= -0.02 && w2 >= -0.02 && w3 >= -0.02) set(g, x, y, v);
    }
  }
}

function stamp(g, ox, oy, rows, v) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '.' && row[x] !== ' ') set(g, ox + x, oy + y, v || row[x]);
    }
  }
}

function eyes(g, x, y, s) {
  fillEllipse(g, x, y, s, s, CH.eye);
  set(g, x - Math.max(0, s - 1), y, CH.pupil);
}

function outline(g) {
  const next = g.map((row) => row.slice());
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (g[y][x] !== CH.empty) continue;
      let n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (inb(x + dx, y + dy) && g[y + dy][x + dx] !== CH.empty && g[y + dy][x + dx] !== CH.ink) n++;
      }
      if (n) next[y][x] = CH.ink;
    }
  }
  return next;
}

function encode(g) {
  return g.map((row) => row.join('')).join('');
}

function mapToGrid(map) {
  const g = grid();
  for (let i = 0; i < map.length; i++) {
    g[Math.floor(i / N)][i % N] = map[i];
  }
  return g;
}

function applyMarks(map, marks) {
  const g = mapToGrid(map);
  for (const m of marks) {
    if (m.kind === 'pixel') set(g, m.x, m.y, m.v);
    else if (m.kind === 'rect') fillRect(g, m.x, m.y, m.w, m.h, m.v);
    else if (m.kind === 'ell') fillEllipse(g, m.x, m.y, m.rx, m.ry, m.v);
  }
  return encode(g);
}

/* ---------- family silhouettes (face LEFT) ---------- */

function artSlime() {
  const g = grid();
  fillEllipse(g, 16, 19, 10, 8, CH.body);
  fillEllipse(g, 12, 14, 3, 2, CH.hi);
  eyes(g, 11, 17, 2);
  eyes(g, 17, 17, 2);
  fillRect(g, 12, 21, 5, 1, CH.dark);
  set(g, 11, 20, CH.dark);
  set(g, 17, 20, CH.dark);
  return outline(g);
}

function artBat() {
  const g = grid();
  fillTri(g, 3, 14, 12, 10, 12, 18, CH.dark);
  fillTri(g, 29, 14, 20, 10, 20, 18, CH.dark);
  fillEllipse(g, 16, 16, 6, 6, CH.body);
  fillTri(g, 11, 11, 10, 6, 14, 11, CH.dark);
  fillTri(g, 21, 11, 22, 6, 18, 11, CH.dark);
  eyes(g, 13, 15, 2);
  eyes(g, 18, 15, 2);
  set(g, 15, 19, CH.pink);
  set(g, 16, 19, CH.pink);
  return outline(g);
}

function artHedgehog() {
  const g = grid();
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * 0.15 + (i / 6) * Math.PI * 0.95;
    const x = 17 + Math.cos(a) * 10;
    const y = 16 - Math.sin(a) * 10;
    fillTri(g, 16, 16, x, y, 16 + Math.cos(a + 0.35) * 7, 16 - Math.sin(a + 0.35) * 7, CH.dark);
  }
  fillEllipse(g, 16, 18, 8, 7, CH.body);
  fillEllipse(g, 8, 19, 3, 2, CH.dark);
  eyes(g, 11, 16, 2);
  return outline(g);
}

function artGhost() {
  const g = grid();
  fillEllipse(g, 16, 13, 8, 8, CH.body);
  fillRect(g, 8, 13, 16, 10, CH.body);
  for (let i = 0; i < 4; i++) {
    fillEllipse(g, 10 + i * 4, 24, 2, 2 + (i % 2), CH.body);
  }
  eyes(g, 13, 13, 2);
  eyes(g, 19, 13, 2);
  fillEllipse(g, 16, 18, 2, 2, CH.dark);
  return outline(g);
}

function artCan() {
  const g = grid();
  fillRect(g, 10, 8, 12, 18, CH.body);
  fillRect(g, 10, 8, 12, 3, CH.dark);
  fillRect(g, 10, 23, 12, 3, CH.dark);
  fillRect(g, 15, 4, 2, 4, CH.dark);
  fillEllipse(g, 16, 3, 2, 2, CH.orange);
  fillEllipse(g, 15, 14, 3, 3, CH.ink);
  fillEllipse(g, 15, 14, 1, 1, CH.hi);
  return outline(g);
}

function artFox() {
  const g = grid();
  fillEllipse(g, 22, 16, 5, 3, CH.orange);
  fillEllipse(g, 15, 17, 8, 6, CH.body);
  fillTri(g, 10, 12, 8, 6, 13, 13, CH.body);
  fillTri(g, 16, 12, 17, 6, 19, 13, CH.body);
  fillTri(g, 7, 17, 4, 19, 9, 20, CH.dark);
  eyes(g, 11, 15, 2);
  return outline(g);
}

function artGolem() {
  const g = grid();
  fillRect(g, 9, 8, 14, 18, CH.body);
  fillRect(g, 11, 5, 10, 5, CH.body);
  fillEllipse(g, 6, 16, 3, 3, CH.dark);
  fillEllipse(g, 26, 18, 3, 3, CH.dark);
  set(g, 13, 10, CH.accent);
  set(g, 18, 10, CH.accent);
  fillRect(g, 12, 14, 1, 6, CH.dark);
  fillRect(g, 18, 13, 1, 5, CH.dark);
  return outline(g);
}

function artDragon() {
  const g = grid();
  fillTri(g, 16, 12, 4, 6, 14, 16, CH.dark);
  fillTri(g, 16, 12, 28, 6, 18, 16, CH.dark);
  fillEllipse(g, 16, 17, 8, 6, CH.body);
  fillEllipse(g, 9, 11, 4, 3, CH.body);
  fillTri(g, 5, 11, 2, 13, 7, 14, CH.body);
  fillTri(g, 10, 7, 11, 3, 13, 8, CH.accent);
  fillEllipse(g, 24, 18, 5, 2, CH.body);
  eyes(g, 8, 10, 1);
  fillEllipse(g, 14, 20, 4, 3, CH.accent);
  return outline(g);
}

function artShark() {
  const g = grid();
  fillEllipse(g, 16, 16, 11, 5, CH.body);
  fillTri(g, 16, 11, 18, 5, 21, 12, CH.dark);
  fillTri(g, 26, 16, 31, 13, 31, 20, CH.body);
  fillTri(g, 6, 17, 2, 20, 8, 19, CH.dark);
  eyes(g, 10, 14, 1);
  set(g, 6, 17, CH.eye);
  return outline(g);
}

function artOcto() {
  const g = grid();
  fillEllipse(g, 16, 12, 8, 7, CH.body);
  for (let i = 0; i < 6; i++) {
    const x = 8 + i * 3;
    fillRect(g, x, 18, 2, 7 + (i % 3), CH.dark);
    set(g, x, 25 + (i % 3), CH.pink);
  }
  eyes(g, 13, 11, 2);
  eyes(g, 19, 11, 2);
  return outline(g);
}

function artCow() {
  const g = grid();
  fillEllipse(g, 17, 18, 10, 7, CH.body);
  fillEllipse(g, 8, 15, 5, 4, CH.dark);
  fillTri(g, 6, 12, 4, 7, 8, 13, CH.dark);
  fillTri(g, 10, 12, 12, 7, 9, 13, CH.dark);
  fillEllipse(g, 5, 17, 2, 2, CH.accent);
  fillEllipse(g, 22, 22, 3, 2, CH.pink);
  fillEllipse(g, 14, 16, 2, 2, CH.dark);
  fillEllipse(g, 20, 15, 2, 1, CH.dark);
  eyes(g, 7, 14, 1);
  fillRect(g, 12, 24, 2, 3, CH.dark);
  fillRect(g, 22, 24, 2, 3, CH.dark);
  return outline(g);
}

function artPig() {
  const g = grid();
  fillEllipse(g, 16, 18, 9, 7, CH.body);
  fillEllipse(g, 8, 17, 4, 4, CH.dark);
  fillEllipse(g, 5, 18, 3, 2, CH.pink);
  set(g, 4, 17, CH.dark);
  set(g, 6, 18, CH.dark);
  fillRect(g, 24, 16, 4, 2, CH.dark);
  set(g, 27, 15, CH.pink);
  eyes(g, 8, 15, 1);
  fillRect(g, 12, 24, 2, 3, CH.dark);
  fillRect(g, 20, 24, 2, 3, CH.dark);
  return outline(g);
}

function artChicken() {
  const g = grid();
  fillEllipse(g, 16, 18, 6, 6, CH.body);
  fillEllipse(g, 11, 12, 4, 4, CH.body);
  fillTri(g, 7, 13, 3, 14, 8, 16, CH.orange);
  fillTri(g, 11, 8, 9, 4, 13, 9, CH.pink);
  fillTri(g, 12, 8, 12, 3, 15, 9, CH.pink);
  fillEllipse(g, 20, 16, 4, 2, CH.dark);
  eyes(g, 10, 11, 1);
  fillRect(g, 14, 24, 2, 3, CH.orange);
  fillRect(g, 17, 24, 2, 3, CH.orange);
  return outline(g);
}

function artSheep() {
  const g = grid();
  fillEllipse(g, 16, 17, 9, 8, CH.body);
  fillEllipse(g, 10, 14, 3, 3, CH.body);
  fillEllipse(g, 21, 14, 3, 3, CH.body);
  fillEllipse(g, 16, 11, 4, 3, CH.body);
  fillEllipse(g, 7, 18, 3, 3, CH.dark);
  eyes(g, 6, 17, 1);
  fillRect(g, 12, 24, 2, 3, CH.dark);
  fillRect(g, 20, 24, 2, 3, CH.dark);
  return outline(g);
}

function artHorse() {
  const g = grid();
  fillEllipse(g, 18, 18, 8, 6, CH.body);
  fillRect(g, 8, 12, 4, 8, CH.body);
  fillEllipse(g, 6, 16, 4, 3, CH.dark);
  fillRect(g, 16, 8, 2, 8, CH.dark);
  fillTri(g, 16, 8, 14, 5, 18, 8, CH.dark);
  eyes(g, 6, 14, 1);
  fillRect(g, 13, 23, 2, 4, CH.dark);
  fillRect(g, 22, 23, 2, 4, CH.dark);
  return outline(g);
}

function artGoat() {
  const g = grid();
  fillEllipse(g, 17, 18, 8, 6, CH.body);
  fillEllipse(g, 8, 15, 4, 4, CH.dark);
  fillTri(g, 6, 12, 4, 6, 8, 13, CH.accent);
  fillTri(g, 10, 12, 12, 6, 9, 13, CH.accent);
  fillRect(g, 7, 19, 1, 3, CH.dark);
  eyes(g, 7, 14, 1);
  fillRect(g, 13, 23, 2, 4, CH.dark);
  fillRect(g, 21, 23, 2, 4, CH.dark);
  return outline(g);
}

function artDuck() {
  const g = grid();
  fillEllipse(g, 16, 19, 7, 5, CH.body);
  fillEllipse(g, 10, 13, 4, 4, CH.body);
  fillEllipse(g, 6, 14, 3, 2, CH.orange);
  eyes(g, 10, 12, 1);
  fillRect(g, 14, 24, 2, 3, CH.orange);
  fillRect(g, 18, 24, 2, 3, CH.orange);
  fillEllipse(g, 22, 18, 3, 2, CH.dark);
  return outline(g);
}

function artRooster() {
  const g = grid();
  fillEllipse(g, 15, 17, 6, 6, CH.body);
  fillEllipse(g, 10, 11, 4, 4, CH.body);
  fillTri(g, 6, 12, 2, 13, 7, 15, CH.orange);
  fillTri(g, 10, 7, 8, 2, 12, 8, CH.pink);
  fillTri(g, 12, 7, 13, 1, 15, 8, CH.pink);
  fillTri(g, 21, 14, 28, 10, 24, 20, CH.dark);
  fillTri(g, 21, 16, 29, 16, 24, 22, CH.orange);
  eyes(g, 9, 10, 1);
  fillRect(g, 13, 23, 2, 4, CH.orange);
  fillRect(g, 17, 23, 2, 4, CH.orange);
  return outline(g);
}

function artDonkey() {
  const g = grid();
  fillEllipse(g, 18, 18, 8, 6, CH.body);
  fillRect(g, 9, 13, 4, 7, CH.body);
  fillEllipse(g, 7, 16, 3, 3, CH.dark);
  fillTri(g, 8, 12, 6, 4, 10, 12, CH.dark);
  fillTri(g, 12, 12, 14, 4, 11, 12, CH.dark);
  eyes(g, 7, 15, 1);
  fillRect(g, 14, 23, 2, 4, CH.dark);
  fillRect(g, 22, 23, 2, 4, CH.dark);
  return outline(g);
}

function artGoose() {
  const g = grid();
  fillEllipse(g, 17, 20, 8, 5, CH.body);
  fillRect(g, 9, 10, 3, 10, CH.body);
  fillEllipse(g, 8, 9, 3, 3, CH.body);
  fillEllipse(g, 4, 10, 3, 2, CH.orange);
  eyes(g, 8, 8, 1);
  fillRect(g, 14, 24, 2, 3, CH.orange);
  fillRect(g, 20, 24, 2, 3, CH.orange);
  fillEllipse(g, 24, 18, 3, 2, CH.dark);
  return outline(g);
}

function artElephant() {
  const g = grid();
  fillEllipse(g, 18, 17, 9, 8, CH.body);
  fillEllipse(g, 8, 14, 5, 5, CH.dark);
  fillRect(g, 5, 16, 3, 9, CH.dark);
  fillEllipse(g, 5, 25, 2, 2, CH.dark);
  fillEllipse(g, 4, 13, 3, 4, CH.body);
  fillEllipse(g, 12, 12, 3, 4, CH.body);
  eyes(g, 7, 13, 1);
  fillRect(g, 13, 24, 3, 4, CH.dark);
  fillRect(g, 22, 24, 3, 4, CH.dark);
  return outline(g);
}

function artLion() {
  const g = grid();
  fillEllipse(g, 16, 16, 10, 9, CH.orange);
  fillEllipse(g, 16, 17, 7, 6, CH.body);
  fillEllipse(g, 9, 15, 4, 4, CH.body);
  fillTri(g, 6, 16, 3, 18, 8, 19, CH.dark);
  eyes(g, 8, 14, 1);
  fillRect(g, 13, 23, 2, 4, CH.dark);
  fillRect(g, 20, 23, 2, 4, CH.dark);
  return outline(g);
}

function artTiger() {
  const g = grid();
  fillEllipse(g, 16, 18, 10, 6, CH.body);
  fillEllipse(g, 8, 16, 4, 4, CH.body);
  fillTri(g, 5, 16, 2, 18, 7, 19, CH.dark);
  for (const x of [12, 16, 20, 24]) fillRect(g, x, 14, 1, 8, CH.dark);
  fillTri(g, 8, 12, 7, 8, 10, 13, CH.body);
  fillTri(g, 11, 12, 12, 8, 13, 13, CH.body);
  eyes(g, 7, 15, 1);
  fillRect(g, 12, 23, 2, 4, CH.dark);
  fillRect(g, 21, 23, 2, 4, CH.dark);
  return outline(g);
}

function artGiraffe() {
  const g = grid();
  fillEllipse(g, 18, 22, 8, 5, CH.body);
  fillRect(g, 10, 6, 3, 16, CH.body);
  fillEllipse(g, 9, 6, 3, 3, CH.dark);
  fillRect(g, 8, 3, 1, 3, CH.accent);
  fillRect(g, 11, 3, 1, 3, CH.accent);
  fillEllipse(g, 14, 12, 2, 2, CH.dark);
  fillEllipse(g, 20, 20, 2, 2, CH.dark);
  eyes(g, 8, 5, 1);
  fillRect(g, 14, 26, 2, 3, CH.dark);
  fillRect(g, 22, 26, 2, 3, CH.dark);
  return outline(g);
}

function artHippo() {
  const g = grid();
  fillEllipse(g, 17, 18, 10, 7, CH.body);
  fillEllipse(g, 8, 18, 6, 5, CH.dark);
  fillRect(g, 3, 18, 6, 4, CH.dark);
  set(g, 4, 17, CH.pink);
  set(g, 7, 17, CH.pink);
  eyes(g, 10, 14, 1);
  fillRect(g, 13, 24, 3, 3, CH.dark);
  fillRect(g, 22, 24, 3, 3, CH.dark);
  return outline(g);
}

function artRhino() {
  const g = grid();
  fillEllipse(g, 18, 18, 9, 7, CH.body);
  fillEllipse(g, 9, 16, 5, 4, CH.dark);
  fillTri(g, 5, 14, 1, 12, 7, 17, CH.accent);
  eyes(g, 9, 14, 1);
  fillRect(g, 13, 24, 3, 4, CH.dark);
  fillRect(g, 22, 24, 3, 4, CH.dark);
  return outline(g);
}

function artGorilla() {
  const g = grid();
  fillEllipse(g, 17, 16, 7, 8, CH.body);
  fillEllipse(g, 11, 12, 5, 5, CH.dark);
  fillEllipse(g, 7, 20, 4, 4, CH.dark);
  fillEllipse(g, 24, 20, 4, 4, CH.dark);
  eyes(g, 9, 11, 1);
  fillRect(g, 14, 23, 3, 4, CH.dark);
  fillRect(g, 20, 23, 3, 4, CH.dark);
  return outline(g);
}

function artZebra() {
  const g = grid();
  fillEllipse(g, 18, 18, 8, 6, CH.body);
  fillRect(g, 9, 12, 4, 8, CH.body);
  fillEllipse(g, 7, 16, 3, 3, CH.dark);
  for (const x of [12, 16, 20, 24]) fillRect(g, x, 14, 1, 8, CH.dark);
  fillRect(g, 10, 8, 2, 5, CH.dark);
  eyes(g, 7, 14, 1);
  fillRect(g, 14, 23, 2, 4, CH.dark);
  fillRect(g, 22, 23, 2, 4, CH.dark);
  return outline(g);
}

function artBear() {
  const g = grid();
  fillEllipse(g, 16, 17, 9, 8, CH.body);
  fillEllipse(g, 10, 12, 3, 3, CH.body);
  fillEllipse(g, 20, 12, 3, 3, CH.body);
  fillEllipse(g, 10, 16, 3, 3, CH.dark);
  eyes(g, 12, 15, 1);
  fillEllipse(g, 9, 18, 2, 2, CH.accent);
  fillRect(g, 12, 24, 3, 3, CH.dark);
  fillRect(g, 20, 24, 3, 3, CH.dark);
  return outline(g);
}

function artCroc() {
  const g = grid();
  fillEllipse(g, 18, 18, 9, 5, CH.body);
  fillRect(g, 3, 17, 10, 4, CH.body);
  for (let x = 4; x < 12; x += 2) set(g, x, 17, CH.eye);
  fillTri(g, 18, 13, 20, 8, 22, 14, CH.dark);
  eyes(g, 12, 16, 1);
  fillRect(g, 14, 22, 3, 3, CH.dark);
  fillRect(g, 24, 21, 3, 3, CH.dark);
  return outline(g);
}

function artKangaroo() {
  const g = grid();
  fillEllipse(g, 16, 16, 6, 7, CH.body);
  fillEllipse(g, 12, 9, 4, 4, CH.body);
  fillTri(g, 8, 10, 5, 11, 9, 13, CH.dark);
  fillTri(g, 22, 18, 28, 22, 20, 24, CH.dark);
  fillEllipse(g, 14, 24, 3, 3, CH.dark);
  eyes(g, 11, 8, 1);
  fillRect(g, 18, 22, 2, 5, CH.dark);
  return outline(g);
}

function artPanda() {
  const g = grid();
  fillEllipse(g, 16, 18, 9, 8, CH.body);
  fillEllipse(g, 10, 12, 3, 3, CH.dark);
  fillEllipse(g, 21, 12, 3, 3, CH.dark);
  fillEllipse(g, 11, 16, 3, 2, CH.dark);
  fillEllipse(g, 18, 16, 3, 2, CH.dark);
  eyes(g, 11, 16, 1);
  eyes(g, 18, 16, 1);
  fillEllipse(g, 15, 20, 2, 2, CH.dark);
  fillRect(g, 12, 25, 3, 3, CH.dark);
  fillRect(g, 20, 25, 3, 3, CH.dark);
  return outline(g);
}

function artFlamingo() {
  const g = grid();
  fillEllipse(g, 18, 16, 5, 4, CH.body);
  fillRect(g, 12, 6, 2, 10, CH.pink);
  fillEllipse(g, 11, 5, 3, 2, CH.pink);
  fillTri(g, 8, 5, 5, 6, 9, 7, CH.orange);
  fillEllipse(g, 22, 14, 4, 2, CH.dark);
  eyes(g, 11, 4, 1);
  fillRect(g, 17, 20, 2, 8, CH.orange);
  set(g, 16, 27, CH.orange);
  return outline(g);
}

function artCamel() {
  const g = grid();
  fillEllipse(g, 18, 18, 9, 6, CH.body);
  fillEllipse(g, 16, 12, 4, 4, CH.body);
  fillRect(g, 8, 12, 3, 8, CH.body);
  fillEllipse(g, 6, 15, 3, 3, CH.dark);
  eyes(g, 6, 13, 1);
  fillRect(g, 13, 23, 2, 4, CH.dark);
  fillRect(g, 22, 23, 2, 4, CH.dark);
  return outline(g);
}

const ART_BUILDERS = {
  slime: artSlime,
  bat: artBat,
  hedgehog: artHedgehog,
  ghost: artGhost,
  can: artCan,
  fox: artFox,
  golem: artGolem,
  dragon: artDragon,
  shark: artShark,
  octo: artOcto,
  cow: artCow,
  pig: artPig,
  chicken: artChicken,
  sheep: artSheep,
  horse: artHorse,
  goat: artGoat,
  duck: artDuck,
  rooster: artRooster,
  donkey: artDonkey,
  goose: artGoose,
  elephant: artElephant,
  lion: artLion,
  tiger: artTiger,
  giraffe: artGiraffe,
  hippo: artHippo,
  rhino: artRhino,
  gorilla: artGorilla,
  zebra: artZebra,
  bear: artBear,
  croc: artCroc,
  kangaroo: artKangaroo,
  panda: artPanda,
  flamingo: artFlamingo,
  camel: artCamel,
};

/** Flagship species — family sprite + a readable extra mark. */
const SPECIES_VARIANTS = {
  holkoe: { art: 'cow', marks: [{ kind: 'ell', x: 15, y: 16, rx: 2, ry: 2, v: CH.dark }, { kind: 'ell', x: 21, y: 14, rx: 2, ry: 1, v: CH.dark }] },
  razendzwijn: { art: 'pig', marks: [{ kind: 'tri', x: 6, y: 14, v: CH.accent }] },
  kipophol: { art: 'chicken', marks: [{ kind: 'pixel', x: 20, y: 14, v: CH.orange }] },
  razendeschaap: { art: 'sheep', marks: [{ kind: 'ell', x: 16, y: 17, rx: 2, ry: 2, v: CH.pink }] },
  holpaard: { art: 'horse', marks: [{ kind: 'rect', x: 16, y: 7, w: 2, h: 4, v: CH.orange }] },
  kopstootgeit: { art: 'goat', marks: [{ kind: 'pixel', x: 5, y: 6, v: CH.accent }, { kind: 'pixel', x: 12, y: 6, v: CH.accent }] },
  kwakophol: { art: 'duck', marks: [{ kind: 'ell', x: 6, y: 14, rx: 3, ry: 2, v: CH.orange }] },
  haanophol: { art: 'rooster', marks: [{ kind: 'pixel', x: 13, y: 2, v: CH.pink }] },
  koppigeezel: { art: 'donkey', marks: [{ kind: 'rect', x: 6, y: 3, w: 1, h: 3, v: CH.dark }] },
  gansophol: { art: 'goose', marks: [{ kind: 'rect', x: 9, y: 8, w: 2, h: 3, v: CH.orange }] },
  reuzenolifant: { art: 'elephant', marks: [{ kind: 'rect', x: 5, y: 18, w: 2, h: 4, v: CH.dark }] },
  razendeleeuw: { art: 'lion', marks: [{ kind: 'ell', x: 16, y: 16, rx: 11, ry: 10, v: CH.orange }] },
  razendetijger: { art: 'tiger', marks: [{ kind: 'rect', x: 14, y: 13, w: 1, h: 8, v: CH.ink }] },
  langegiraffe: { art: 'giraffe', marks: [{ kind: 'ell', x: 14, y: 10, rx: 2, ry: 2, v: CH.dark }] },
  razendnijlpaard: { art: 'hippo', marks: [{ kind: 'rect', x: 3, y: 19, w: 5, h: 2, v: CH.pink }] },
  razendeneushoorn: { art: 'rhino', marks: [{ kind: 'pixel', x: 2, y: 11, v: CH.accent }] },
  woestegorilla: { art: 'gorilla', marks: [{ kind: 'ell', x: 17, y: 14, rx: 3, ry: 2, v: CH.accent }] },
  razendezebra: { art: 'zebra', marks: [{ kind: 'rect', x: 18, y: 14, w: 1, h: 8, v: CH.ink }] },
  razendebeer: { art: 'bear', marks: [{ kind: 'ell', x: 16, y: 18, rx: 3, ry: 2, v: CH.orange }] },
  razendekrokodil: { art: 'croc', marks: [{ kind: 'pixel', x: 5, y: 16, v: CH.eye }, { kind: 'pixel', x: 7, y: 16, v: CH.eye }] },
  razendekangoeroe: { art: 'kangaroo', marks: [{ kind: 'ell', x: 16, y: 18, rx: 2, ry: 2, v: CH.pink }] },
  woestepanda: { art: 'panda', marks: [{ kind: 'ell', x: 16, y: 20, rx: 3, ry: 2, v: CH.dark }] },
  razendeflamingo: { art: 'flamingo', marks: [{ kind: 'rect', x: 12, y: 6, w: 2, h: 3, v: CH.orange }] },
  razendekameel: { art: 'camel', marks: [{ kind: 'ell', x: 20, y: 11, rx: 3, ry: 3, v: CH.body }] },
  voidsly: { art: 'slime', marks: [{ kind: 'ell', x: 16, y: 19, rx: 4, ry: 3, v: CH.pink }] },
  frostbub: { art: 'slime', marks: [{ kind: 'pixel', x: 10, y: 12, v: CH.hi }, { kind: 'pixel', x: 22, y: 14, v: CH.hi }] },
  lavablob: { art: 'slime', marks: [{ kind: 'ell', x: 16, y: 22, rx: 3, ry: 2, v: CH.orange }] },
  voidkonijn: { art: 'fox', marks: [{ kind: 'tri', x: 10, y: 6, v: CH.pink }] },
  omegadrake: { art: 'dragon', marks: [{ kind: 'ell', x: 16, y: 10, rx: 3, ry: 2, v: CH.accent }] },
  levihaai: { art: 'shark', marks: [{ kind: 'rect', x: 16, y: 8, w: 2, h: 4, v: CH.dark }] },
  voidocto: { art: 'octo', marks: [{ kind: 'ell', x: 16, y: 12, rx: 3, ry: 2, v: CH.pink }] },
};

function buildSpecies(id, spec, artMaps) {
  const base = artMaps[spec.art];
  if (!base) throw new Error('missing art for ' + id);
  const marks = (spec.marks || []).filter((m) => m.kind !== 'tri');
  if (spec.art === 'lion' && id === 'razendeleeuw') {
    const g = mapToGrid(base);
    fillEllipse(g, 16, 16, 11, 10, CH.orange);
    fillEllipse(g, 16, 17, 7, 6, CH.body);
    fillEllipse(g, 9, 15, 4, 4, CH.body);
    eyes(g, 8, 14, 1);
    return encode(g);
  }
  return applyMarks(base, marks);
}

function palFor(art, extra) {
  const fam = FAMILY_PREVIEW[art] || {};
  return Object.assign({}, PREVIEW_PAL, fam, extra || {});
}

function svgFromMap(map, pal) {
  const byFill = new Map();
  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) {
      const ch = map[y * N + x];
      if (ch === CH.empty) { x++; continue; }
      let w = 1;
      while (x + w < N && map[y * N + x + w] === ch) w++;
      const fill = pal[ch] || '#888';
      const d = `M${x} ${y}h${w}v1h-${w}z`;
      byFill.set(fill, (byFill.get(fill) || '') + d);
      x += w;
    }
  }
  const paths = [...byFill.entries()].map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}" shape-rendering="crispEdges">${paths.join('')}</svg>\n`;
}

function jsEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function emitJs(artMaps, speciesMaps) {
  const lines = [];
  lines.push('/* GENERATED by scripts/gen-monster-pixels.mjs — do not hand-edit */');
  lines.push('/* 32×32 stickman-pixel maps (1024 chars). . empty B body D dark W eye K pupil');
  lines.push('   A accent H highlight P pink O orange N ink outline */');
  lines.push('const MONSTER_PIXEL_SIZE = 32;');
  lines.push('const MONSTER_PIXEL_ART = {');
  for (const [id, map] of Object.entries(artMaps)) {
    lines.push(`  ${id}: '${jsEscape(map)}',`);
  }
  lines.push('};');
  lines.push('const MONSTER_PIXEL_SPECIES = {');
  for (const [id, map] of Object.entries(speciesMaps)) {
    lines.push(`  ${id}: '${jsEscape(map)}',`);
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

function emitPreview(artMaps, speciesMaps) {
  const cards = [];
  const add = (id, file, art, kind) => {
    cards.push(`<figure data-id="${id}" data-kind="${kind}" data-art="${art}"><div class="zoom"><img src="${file}" alt="${id}" width="96" height="96"></div><figcaption>${id}<small>${kind} · ${art}</small></figcaption></figure>`);
  };
  for (const id of Object.keys(artMaps)) add(id, `art-${id}.svg`, id, 'art');
  for (const [id, spec] of Object.entries(SPECIES_VARIANTS)) add(id, `sp-${id}.svg`, spec.art, 'species');
  const aliasRows = Object.entries(W2_PIXEL_ALIAS).map(([art, a]) =>
    `<tr><td><code>${art}</code></td><td><code>${a.pixel}</code></td><td>${a.high ? `<code>${a.high}</code>` : '—'}</td></tr>`).join('');
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Monster pixel preview — Stickman Fighter</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; font: 14px/1.4 ui-sans-serif, system-ui; background: #151b33; color: #e8f0ff; }
  h1 { font-size: 1.2rem; margin: 16px 20px 4px; }
  p { margin: 0 20px 16px; color: #9db1e3; max-width: 72ch; }
  section { padding: 8px 16px 24px; }
  h2 { font-size: .95rem; color: #ffd75e; margin: 18px 4px 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 10px; }
  figure { margin: 0; background: #1a2030; border: 1px solid #333c55; border-radius: 10px; padding: 8px; text-align: center; }
  .zoom { image-rendering: pixelated; background:
    linear-gradient(45deg,#20283c 25%,transparent 25%),
    linear-gradient(-45deg,#20283c 25%,transparent 25%),
    linear-gradient(45deg,transparent 75%,#20283c 75%),
    linear-gradient(-45deg,transparent 75%,#20283c 75%);
    background-size: 12px 12px; background-position: 0 0,0 6px,6px -6px,-6px 0;
    border-radius: 6px; padding: 8px; }
  .zoom img { width: 96px; height: 96px; image-rendering: pixelated; }
  figcaption { margin-top: 6px; font-weight: 700; }
  figcaption small { display: block; font-weight: 500; color: #9db1e3; }
  table { border-collapse: collapse; margin: 8px 4px 16px; font-size: 13px; }
  th, td { border: 1px solid #333c55; padding: 4px 8px; text-align: left; }
  th { color: #ffd75e; }
</style>
</head>
<body>
<h1>Monster pixel set</h1>
<p>32×32 stickman-pixel sprites for the doubled farm/zoo roster plus classic families.
Combat tints <code>B</code>/<code>D</code> with each species <code>c1</code>/<code>c2</code>.
W2 woods/crypt/scrap/frost/sea species reuse these maps via <code>sp.pixel</code> aliases (no unique P1 drawers yet).
Share URL stays <code>speel.html</code>.</p>
<section>
<h2>Art-family slots (${Object.keys(artMaps).length})</h2>
<div class="grid">${cards.filter((_, i) => i < Object.keys(artMaps).length).join('')}</div>
<h2>Flagship species slots (${Object.keys(speciesMaps).length})</h2>
<div class="grid">${cards.filter((_, i) => i >= Object.keys(artMaps).length).join('')}</div>
<h2>W2 catalog aliases → #282 maps</h2>
<table><thead><tr><th>W2 art</th><th>.pixel</th><th>mythic+</th></tr></thead><tbody>${aliasRows}</tbody></table>
</section>
</body>
</html>`;
}

function emitMapping(artMaps, speciesMaps) {
  const artRows = Object.keys(artMaps).map((id) =>
    `| \`${id}\` | art | \`assets/monsters/art-${id}.svg\` | all SPECIES with \`art:'${id}'\` without a species pixel |`);
  const spRows = Object.entries(SPECIES_VARIANTS).map(([id, spec]) =>
    `| \`${id}\` | species | \`assets/monsters/sp-${id}.svg\` | \`${id}\` (art \`${spec.art}\`) |`);
  const aliasRows = Object.entries(W2_PIXEL_ALIAS).map(([art, a]) =>
    `| \`${art}\` | \`${a.pixel}\` | ${a.high ? `\`${a.high}\`` : '—'} |`);
  return `# Monster pixel ID map

#282 farm/zoo/classic maps plus **W2 catalog aliases** (PR #284). First paint reuses existing maps — unique P1 silhouettes are optional later.

Editor: [Monster editor double roster](https://cursor.com/agents/bc-43a25a67-7182-5f4f-ab63-6412cd05e154)

Resolution order in combat / dex:

1. Dedicated W2 map when \`MONSTER_ART_SLOTS[sp.art].pixelStatus === 'pixel'\` (none yet)
2. \`sp.pixel\` if it names a species or art map (W2 aliases + #282 flagships)
3. \`sp.id\` species map (flagship)
4. \`sp.art\` family map
5. canvas stub / \`drawBeastArt\` / \`drawMonsterArt\` fallback

Preview: [assets/monsters/preview.html](assets/monsters/preview.html)

## W2 art → #282 pixel alias

Every W2 \`art\` ID points at an existing map via \`SPECIES[id].pixel\`. Mythic+ may use \`high\`. No blank stub if the alias map is loaded.

| W2 art | .pixel (common–legendary) | .pixel mythic+ |
|--------|---------------------------|----------------|
${aliasRows.join('\n')}

## #282 slots

| provisionalId | kind | file | wires to |
|---------------|------|------|----------|
${artRows.join('\n')}
${spRows.join('\n')}

## Coverage

- **${Object.keys(artMaps).length} art families** — farm (10) + zoo (14) + classic/sea (10).
- **${Object.keys(speciesMaps).length} flagship species** — farm/zoo commons + a few mythic/void variants.
- **36 W2 art IDs** aliased onto the maps above (see table). Unique drawers later: keep the W2 \`art\` ID, add a map, set \`pixelStatus='pixel'\`.
- Files are 32×32 crisp SVG (RLE rects), typically 1–3 KB.
- Combat paint is from JS maps (no Image decode) so a missing SVG never blanks a fighter.

## Do not

- Change hitboxes / \`sp.size\` / AI here.
- Point share URL at this preview — players stay on \`speel.html\`.
`;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const artMaps = {};
  for (const [id, fn] of Object.entries(ART_BUILDERS)) {
    artMaps[id] = encode(fn());
  }
  const speciesMaps = {};
  for (const [id, spec] of Object.entries(SPECIES_VARIANTS)) {
    speciesMaps[id] = buildSpecies(id, spec, artMaps);
  }

  for (const [id, rows] of Object.entries(artMaps)) {
    fs.writeFileSync(path.join(outDir, `art-${id}.svg`), svgFromMap(rows, palFor(id)));
  }
  for (const [id, spec] of Object.entries(SPECIES_VARIANTS)) {
    fs.writeFileSync(path.join(outDir, `sp-${id}.svg`), svgFromMap(speciesMaps[id], palFor(spec.art)));
  }

  const keepSvg = new Set([
    ...Object.keys(artMaps).map((id) => `art-${id}.svg`),
    ...Object.keys(SPECIES_VARIANTS).map((id) => `sp-${id}.svg`),
  ]);
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.svg') && !keepSvg.has(f)) fs.unlinkSync(path.join(outDir, f));
  }

  fs.writeFileSync(jsOut, emitJs(artMaps, speciesMaps));
  fs.writeFileSync(previewOut, emitPreview(artMaps, speciesMaps));
  fs.writeFileSync(mapOut, emitMapping(artMaps, speciesMaps));

  const nArt = Object.keys(artMaps).length;
  const nSp = Object.keys(speciesMaps).length;
  const bytes = fs.readdirSync(outDir)
    .filter((f) => f.endsWith('.svg'))
    .reduce((s, f) => s + fs.statSync(path.join(outDir, f)).size, 0);
  console.log(`monster-pixels: ${nArt} art + ${nSp} species · ${bytes} bytes SVG · ${path.relative(root, jsOut)}`);
}

main();
