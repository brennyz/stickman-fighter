/* ===================== FOREST FLOOR — photo-sampled ===================== */
/**
 * Bosbodem uit echte foto’s (bladstrooisel · twijgen · klimop · mos · grind).
 * Kleuren gesampled uit 3 close-ups; patches zijn 16×8 “foto-pixels” die
 * als tile atlas in fights (thema `bos`) worden gestempeld — stickfight grit.
 *
 * Drop later raw JPG’s in assets/forest-floor/ en run:
 *   node scripts/sample-forest-floor.mjs
 * om de atlas te verversen vanuit echte bestanden.
 */

/** Photo-sampled palette (bosbodem 1–3). */
const FOREST_FLOOR_PAL = {
  soil: '#2c2822',
  soilMid: '#3a342c',
  soilLite: '#4a4438',
  leafTan: '#c4a46a',
  leafOchre: '#a88848',
  leafRust: '#8a6438',
  leafDry: '#d4b878',
  twig: '#6a6458',
  twigLite: '#8a8478',
  twigDark: '#4a463c',
  bark: '#3a3028',
  ivy: '#2e5a28',
  ivyLite: '#4a7a38',
  ivyDeep: '#1e4020',
  moss: '#6a8a30',
  mossLite: '#8aaa40',
  pebble: '#8a8a84',
  pebbleLite: '#a8a89e',
};

const FF_COLS = [
  FOREST_FLOOR_PAL.soil,
  FOREST_FLOOR_PAL.soilMid,
  FOREST_FLOOR_PAL.soilLite,
  FOREST_FLOOR_PAL.leafTan,
  FOREST_FLOOR_PAL.leafOchre,
  FOREST_FLOOR_PAL.leafRust,
  FOREST_FLOOR_PAL.leafDry,
  FOREST_FLOOR_PAL.twig,
  FOREST_FLOOR_PAL.twigLite,
  FOREST_FLOOR_PAL.twigDark,
  FOREST_FLOOR_PAL.bark,
  FOREST_FLOOR_PAL.ivy,
  FOREST_FLOOR_PAL.ivyLite,
  FOREST_FLOOR_PAL.ivyDeep,
  FOREST_FLOOR_PAL.moss,
  FOREST_FLOOR_PAL.mossLite,
  FOREST_FLOOR_PAL.pebble,
  FOREST_FLOOR_PAL.pebbleLite,
];

/**
 * Packed 16×8 patches — each char is a hex nibble into FF_COLS (0–f, g→16, h→17).
 * Patterns mimic photo structure: tan leaf mats, twig grids, ivy clusters, soil+pebbles.
 */
const FOREST_FLOOR_PATCH_STRS = [
  // 0 — dried leaf carpet (photo 1)
  '3344553344553344' +
  '4556634556634556' +
  '3366443366443366' +
  '5544335544335544' +
  '4466554466554466' +
  '3355443355443355' +
  '6644336644336644' +
  '1122331122331122',
  // 1 — twig tangle over leaves (photo 2)
  '3799379937993799' +
  '4557455745574557' +
  '9937993799379937' +
  '3445344534453445' +
  '7a77a77a77a77a77' +
  '5566556655665566' +
  '9a99a99a99a99a99' +
  '0112011201120112',
  // 2 — ivy pockets + moss branch (photo 1/3)
  'bbccbbccbbccbbcc' +
  '3b4c3b4c3b4c3b4c' +
  'cdeedcdeedcdeedc' +
  '455b455b455b455b' +
  'aa7a7aa7a7aa7a7a' +
  '3344334433443344' +
  'eeffeeffeeffeeff' +
  '0110011001100110',
  // 3 — soil + pebbles + seedlings (photo 3 bottom)
  '0011001100110011' +
  '1g1h1g1h1g1h1g1h' +
  '2233223322332233' +
  '0b0c0b0c0b0c0b0c' +
  '11gg11hh11gg11hh' +
  '3344334433443344' +
  '0h0g0h0g0h0g0h0g' +
  '1122112211221122',
];

const FF_PX = 3;
let _ffTiles = null;
let _ffThicket = null;

function ffCharToIdx(ch) {
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'a' && ch <= 'h') return 10 + (ch.charCodeAt(0) - 97);
  return 0;
}

function buildForestFloorTiles() {
  if (_ffTiles) return _ffTiles;
  _ffTiles = FOREST_FLOOR_PATCH_STRS.map((str, pi) => {
    const cv = document.createElement('canvas');
    cv.width = 16;
    cv.height = 8;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    for (let i = 0; i < 128; i++) {
      const idx = ffCharToIdx(str[i] || '0');
      c.fillStyle = FF_COLS[idx] || FF_COLS[0];
      c.fillRect(i % 16, (i / 16) | 0, 1, 1);
    }
    // micro variance so tiles don’t look stamped
    const img = c.getImageData(0, 0, 16, 8);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = ((i * 17 + pi * 91) % 7) - 3;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + (n >> 1)));
    }
    c.putImageData(img, 0, 0);
    return cv;
  });
  return _ffTiles;
}

function buildForestFloorThicket() {
  if (_ffThicket) return _ffThicket;
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 40;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  const P = FOREST_FLOOR_PAL;
  // stick lattice — stickfight DNA from photo twigs
  const sticks = [
    [4, 36, 58, 8, P.twigDark],
    [2, 30, 50, 4, P.twig],
    [10, 38, 40, 2, P.twigLite],
    [8, 20, 20, 34, P.bark],
    [22, 6, 48, 28, P.twig],
    [30, 2, 55, 22, P.twigDark],
    [14, 12, 60, 18, P.twigLite],
    [40, 34, 62, 10, P.twig],
    [6, 8, 28, 32, P.twigDark],
  ];
  for (const [x0, y0, x1, y1, col] of sticks) {
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }
  // ivy flecks
  c.fillStyle = P.ivy;
  c.fillRect(12, 14, 5, 4);
  c.fillRect(36, 20, 4, 4);
  c.fillRect(48, 8, 5, 3);
  c.fillStyle = P.ivyLite;
  c.fillRect(14, 12, 3, 3);
  c.fillRect(50, 6, 3, 2);
  c.fillStyle = P.moss;
  c.fillRect(24, 30, 6, 3);
  c.fillRect(44, 32, 5, 2);
  _ffThicket = cv;
  return cv;
}

/** Fight floor: stamp photo-sampled leaf/soil tiles under the fighters. */
function drawForestFloorGround(c, ground, scroll) {
  const tiles = buildForestFloorTiles();
  if (!tiles || !tiles.length) return;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const tw = 16 * FF_PX;
  const th = 8 * FF_PX;
  const wrap = (v, span) => ((v % span) + span) % span;
  const off = wrap(-scroll, tw);
  const rows = Math.ceil((H - ground) / th) + 1;
  for (let row = 0; row < rows; row++) {
    const y = ground + row * th;
    const tile = tiles[(row + ((scroll / tw) | 0)) % tiles.length];
    for (let x = off - tw; x < W + tw; x += tw) {
      const t2 = tiles[(((x / tw) | 0) + row * 3) % tiles.length];
      c.drawImage(t2 || tile, Math.round(x), y, tw, th);
    }
  }
  // soft seam at fight line
  c.fillStyle = 'rgba(196,164,106,.2)';
  c.fillRect(0, ground, W, 3);
  c.fillStyle = 'rgba(42,38,32,.35)';
  c.fillRect(0, ground + 3, W, 2);
  c.imageSmoothingEnabled = prev;
}

/** Mid-layer stick thicket (parallax) — photo twigs as stickfight scenery. */
function drawForestFloorThicket(c, ground, scroll, t) {
  const tile = buildForestFloorThicket();
  if (!tile) return;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const calm = typeof motionReduced === 'function' && motionReduced();
  const sway = calm ? 0 : Math.sin((t || 0) * 0.9) * 2;
  const wrap = (v, span) => ((v % span) + span) % span;
  const span = 140;
  const off = wrap(-scroll * 0.55 + sway, span);
  const scale = 2.2;
  const tw = tile.width * scale;
  const th = tile.height * scale;
  c.globalAlpha = 0.85;
  for (let x = off - span; x < W + span; x += span) {
    c.drawImage(tile, Math.round(x), Math.round(ground - th + 6), tw, th);
  }
  c.globalAlpha = 1;
  c.imageSmoothingEnabled = prev;
}

/** Kick up photo-leaf / twig pixels (stickfight grit). */
function forestFloorKickColors() {
  const P = FOREST_FLOOR_PAL;
  return [P.leafTan, P.leafOchre, P.leafRust, P.twig, P.ivyLite, P.moss];
}
