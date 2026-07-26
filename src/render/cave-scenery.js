/* ===================== CAVE SCENERY — photo-sampled pixel ===================== */
/**
 * Grotfoto’s → stickfight grit (thema `grot`).
 * Palet uit 4 refs: donkere watergrot, amber-rotswand, stalactiet-gordijn, grote zaal.
 * Geen raw photos in fights — 16×8 tiles + canvas decor, imageSmoothing off.
 */

const CAVE_PAL = {
  void: '#07090e',
  deep: '#10141c',
  rock: '#1a2028',
  rockMid: '#2a323c',
  rockLite: '#3a4450',
  strata: '#4a3a2c',
  amber: '#c48840',
  amberHot: '#e8a858',
  amberDeep: '#8a5a28',
  ochre: '#a87848',
  sand: '#c4a878',
  mineral: '#e8e0d0',
  mineralHot: '#f4f0e4',
  wet: '#121828',
  water: '#0c1420',
  reflect: '#2a3850',
  glowGreen: '#a8c840',
  glowGreenHot: '#d0e868',
  crystal: '#7cf0ff',
  crystalHot: '#d8fbff',
  spotlight: '#e8f0ff',
};

const CAVE_COLS = [
  CAVE_PAL.void,
  CAVE_PAL.deep,
  CAVE_PAL.rock,
  CAVE_PAL.rockMid,
  CAVE_PAL.rockLite,
  CAVE_PAL.strata,
  CAVE_PAL.amber,
  CAVE_PAL.amberHot,
  CAVE_PAL.amberDeep,
  CAVE_PAL.ochre,
  CAVE_PAL.sand,
  CAVE_PAL.mineral,
  CAVE_PAL.mineralHot,
  CAVE_PAL.wet,
  CAVE_PAL.water,
  CAVE_PAL.reflect,
  CAVE_PAL.glowGreen,
  CAVE_PAL.glowGreenHot,
];

/**
 * Packed 16×8 patches — char → CAVE_COLS (0–9, a–h).
 * 0 wet charcoal · 1 amber strata · 2 mineral grit · 3 green-glow ledge
 */
const CAVE_FLOOR_PATCH_STRS = [
  // 0 — wet charcoal floor + cool flecks (water-grot foto)
  '0011001100110011' +
  '1122112211221122' +
  '00dd00dd00dd00dd' +
  '2233223322332233' +
  '1d1e1d1e1d1e1d1e' +
  '0011001100110011' +
  '3322332233223322' +
  '0d0e0d0e0d0e0d0e',
  // 1 — amber rock strata (warm-lit wall foto)
  '5588558855885588' +
  '6699669966996699' +
  '8558855885588558' +
  '996a996a996a996a' +
  '5588558855885588' +
  '6a556a556a556a55' +
  '8899889988998899' +
  '2552255225522552',
  // 2 — mineral / stalactite grit (white curtain foto)
  '22bb22bb22bb22bb' +
  '3bcb3bcb3bcb3bcb' +
  'bbccbbccbbccbbcc' +
  '2233223322332233' +
  'c2b2c2b2c2b2c2b2' +
  '11bb11bb11bb11bb' +
  '3344334433443344' +
  '0b0c0b0c0b0c0b0c',
  // 3 — ochre cavern + green glow pools (photo 1/4)
  '2255225522552255' +
  '9a99a99a99a99a99' +
  '55gg55hh55gg55hh' +
  '3344334433443344' +
  'g2h2g2h2g2h2g2h2' +
  '5588558855885588' +
  '22hh22gg22hh22gg' +
  '0110011001100110',
];

const CAVE_PX = 3;
const CAVE_TILE_W = 16;
const CAVE_TILE_H = 8;
let _caveTiles = null;
let _caveStrip = null;
let _caveStripRows = 0;

function caveWrap(v, span) {
  if (!span) return 0;
  return ((v % span) + span) % span;
}

function caveCharToIdx(ch) {
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'a' && ch <= 'h') return 10 + (ch.charCodeAt(0) - 97);
  return 0;
}

function caveLiteMode() {
  return (typeof fxLite === 'function' && fxLite())
    || (typeof Perf !== 'undefined' && Perf.tier >= 2)
    || (typeof save !== 'undefined' && save && save.liteFx);
}

function buildCaveFloorTiles() {
  if (_caveTiles) return _caveTiles;
  _caveTiles = [];
  for (let pi = 0; pi < CAVE_FLOOR_PATCH_STRS.length; pi++) {
    const str = CAVE_FLOOR_PATCH_STRS[pi];
    const cv = document.createElement('canvas');
    cv.width = CAVE_TILE_W;
    cv.height = CAVE_TILE_H;
    const c = cv.getContext('2d');
    if (!c) continue;
    c.imageSmoothingEnabled = false;
    for (let i = 0; i < CAVE_TILE_W * CAVE_TILE_H; i++) {
      const idx = caveCharToIdx(str[i] || '0');
      c.fillStyle = CAVE_COLS[idx] || CAVE_COLS[0];
      c.fillRect(i % CAVE_TILE_W, (i / CAVE_TILE_W) | 0, 1, 1);
    }
    try {
      const img = c.getImageData(0, 0, CAVE_TILE_W, CAVE_TILE_H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = ((i * 19 + pi * 73) % 7) - 3;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + (n >> 1)));
      }
      c.putImageData(img, 0, 0);
    } catch (_) {}
    _caveTiles.push(cv);
  }
  return _caveTiles;
}

function ensureCaveFloorStrip(needH) {
  const tiles = buildCaveFloorTiles();
  if (!tiles.length) return null;
  const tw = CAVE_TILE_W * CAVE_PX;
  const th = CAVE_TILE_H * CAVE_PX;
  const rows = Math.max(2, Math.min(6, Math.ceil(needH / th) + 1));
  if (_caveStrip && _caveStripRows === rows) return _caveStrip;
  const cols = 4;
  const cv = document.createElement('canvas');
  cv.width = tw * cols;
  cv.height = th * rows;
  const c = cv.getContext('2d');
  if (!c) return null;
  c.imageSmoothingEnabled = false;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ti = caveWrap(col + row * 3, tiles.length);
      c.drawImage(tiles[ti], col * tw, row * th, tw, th);
    }
  }
  _caveStrip = cv;
  _caveStripRows = rows;
  return cv;
}

function drawCaveFloorGroundLite(c, ground) {
  const P = CAVE_PAL;
  const h = Math.max(8, H - ground);
  c.fillStyle = P.deep;
  c.fillRect(0, ground, W, h);
  c.fillStyle = P.rockMid;
  c.fillRect(0, ground, W, Math.ceil(h * 0.22));
  c.fillStyle = P.amberDeep;
  c.fillRect(0, ground + Math.ceil(h * 0.35), W, 3);
  c.fillStyle = 'rgba(232,168,88,.18)';
  c.fillRect(0, ground, W, 2);
}

/** Fight floor: photo-mapped rock / wet stone tiles. */
function drawCaveFloorGround(c, ground, scroll) {
  if (ground >= H - 2) return;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;

  if (caveLiteMode()) {
    drawCaveFloorGroundLite(c, ground);
    c.imageSmoothingEnabled = prev;
    return;
  }

  const needH = Math.max(24, H - ground);
  const strip = ensureCaveFloorStrip(needH);
  if (!strip) {
    drawCaveFloorGroundLite(c, ground);
    c.imageSmoothingEnabled = prev;
    return;
  }

  const sw = strip.width;
  const sh = Math.min(strip.height, needH + CAVE_TILE_H * CAVE_PX);
  const off = caveWrap(-scroll, sw);
  for (let x = off - sw; x < W + sw; x += sw) {
    c.drawImage(strip, 0, 0, sw, sh, Math.round(x), ground, sw, sh);
  }
  // wet seam + amber catch-light at fight line
  c.fillStyle = 'rgba(232,168,88,.22)';
  c.fillRect(0, ground, W, 3);
  c.fillStyle = 'rgba(12,20,32,.45)';
  c.fillRect(0, ground + 3, W, 2);
  c.imageSmoothingEnabled = prev;
}

/**
 * Reflective water pool band (foto 1–3) — dark mirror under the fight line.
 * Drawn after floor so it reads as a flooded ledge strip.
 */
function drawCaveWaterBand(c, ground, scroll, t) {
  if (caveLiteMode()) return;
  const P = CAVE_PAL;
  const bandH = Math.min(28, Math.max(14, Math.round((H - ground) * 0.22)));
  const y0 = ground + Math.max(10, Math.round((H - ground) * 0.42));
  if (y0 + bandH > H) return;
  const calm = typeof motionReduced === 'function' && motionReduced();
  const shimmer = calm ? 0 : Math.sin((t || 0) * 2.2) * 0.04;

  c.fillStyle = P.water;
  c.fillRect(0, y0, W, bandH);
  c.fillStyle = P.wet;
  c.fillRect(0, y0, W, 3);
  // amber wall reflection streaks
  const span = 56;
  const off = caveWrap(-scroll * 0.4, span);
  for (let x = off - span; x < W + span; x += span) {
    c.fillStyle = `rgba(232,168,88,${(0.12 + shimmer).toFixed(3)})`;
    c.fillRect(Math.round(x + 8), y0 + 4, 10, bandH - 8);
    c.fillStyle = `rgba(232,224,208,${(0.08 + shimmer * 0.5).toFixed(3)})`;
    c.fillRect(Math.round(x + 28), y0 + 6, 4, bandH - 10);
    c.fillStyle = `rgba(168,200,64,${(0.06 + shimmer * 0.4).toFixed(3)})`;
    c.fillRect(Math.round(x + 40), y0 + 8, 6, 4);
  }
  c.fillStyle = 'rgba(232,240,255,.08)';
  c.fillRect(0, y0 + 1, W, 1);
}

/**
 * Stalactite curtain + ground spikes (foto 3) + amber glow pockets (foto 1/2).
 */
function drawCaveStalactiteDecor(c, ground, scroll, t, dX, dSpan) {
  const P = CAVE_PAL;
  const lite = caveLiteMode();
  const calm = typeof motionReduced === 'function' && motionReduced();
  const n = lite ? 5 : 8;

  // Ceiling rock band
  c.fillStyle = P.deep;
  c.fillRect(0, 0, W, 10);
  c.fillStyle = P.rock;
  c.fillRect(0, 8, W, 6);

  for (let i = 0; i < n; i++) {
    const x = dX((i * 0.13 + 0.03) * dSpan);
    const tall = 48 + (i % 4) * 22;
    const half = 10 + (i % 3) * 4;
    // dark rock cone
    c.fillStyle = i % 2 ? P.rock : P.deep;
    c.beginPath();
    c.moveTo(x - half, 0);
    c.lineTo(x, tall);
    c.lineTo(x + half, 0);
    c.closePath();
    c.fill();
    // mineral highlight edge (stalactite curtain)
    c.fillStyle = P.mineral;
    c.beginPath();
    c.moveTo(x - 2, 4);
    c.lineTo(x, tall * 0.85);
    c.lineTo(x + 3, 4);
    c.closePath();
    c.fill();
    if (!lite && i % 3 === 0) {
      c.fillStyle = P.mineralHot;
      c.fillRect(Math.round(x) - 1, 6, 2, Math.round(tall * 0.35));
    }
  }

  // Ground stalagmites
  const mN = lite ? 3 : 5;
  for (let i = 0; i < mN; i++) {
    const x = dX((i * 0.2 + 0.1) * dSpan);
    const h = 18 + (i % 3) * 10;
    c.fillStyle = P.rockMid;
    c.beginPath();
    c.moveTo(x - 8, ground);
    c.lineTo(x, ground - h);
    c.lineTo(x + 8, ground);
    c.closePath();
    c.fill();
    c.fillStyle = P.mineral;
    c.fillRect(Math.round(x) - 1, ground - h, 2, Math.round(h * 0.55));
  }

  // Amber / green glow ledges (photo 1+2)
  if (!lite) {
    for (let i = 0; i < 4; i++) {
      const x = dX((i * 0.24 + 0.08) * dSpan);
      const y = 28 + (i % 2) * 18;
      const pulse = calm ? 0.55 : 0.45 + Math.sin((t || 0) * 3 + i) * 0.2;
      c.fillStyle = i % 2
        ? `rgba(232,168,88,${pulse.toFixed(2)})`
        : `rgba(168,200,64,${(pulse * 0.85).toFixed(2)})`;
      c.fillRect(Math.round(x), y, 14, 4);
      c.fillRect(Math.round(x) + 3, y - 3, 8, 3);
      // reflection speck on ground
      c.fillStyle = i % 2
        ? 'rgba(232,168,88,.2)'
        : 'rgba(168,200,64,.16)';
      c.fillRect(Math.round(x) + 2, ground - 4, 10, 3);
    }
  }
}

/** Kick dust: charcoal + amber + mineral. */
function caveKickColors() {
  const P = CAVE_PAL;
  return [P.rockLite, P.amber, P.mineral, P.ochre, P.glowGreen, P.sand];
}

/**
 * Menu hero vista — dark cavern with water mirror + amber wall + stalactite curtain.
 * Photo DNA: still pool, warm rock light, needle minerals, deep void.
 */
function drawMenuCaveVista(c, w, h, t, opts) {
  opts = opts || {};
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const lite = !!opts.lite;
  const calm = typeof motionReduced === 'function' && motionReduced();
  const P = CAVE_PAL;
  const wrap = (v, span) => ((v % span) + span) % span;
  const waterY = Math.round(h * 0.58);
  const pSlow = calm ? 0 : t * 5;

  // Void ceiling / deep sky
  const sky = c.createLinearGradient(0, 0, 0, waterY);
  sky.addColorStop(0, P.void);
  sky.addColorStop(0.45, P.deep);
  sky.addColorStop(1, P.rock);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, waterY);

  // Far stratified rock wall (amber lit right side)
  c.fillStyle = P.rockMid;
  c.fillRect(0, Math.round(h * 0.22), w, Math.round(h * 0.36));
  const wallOff = Math.round(wrap(-pSlow, 40) - 20);
  for (let i = 0; i < 10; i++) {
    const x = Math.round(i * (w / 9) + wallOff * 0.3);
    const bandY = Math.round(h * 0.28) + (i % 3) * 8;
    c.fillStyle = i > 5 ? P.amberDeep : P.strata;
    c.fillRect(x, bandY, Math.round(w / 8), 5);
    if (i > 6) {
      c.fillStyle = P.amber;
      c.fillRect(x + 4, bandY - 2, Math.round(w / 12), 3);
      c.fillStyle = P.amberHot;
      c.fillRect(x + 8, bandY - 3, 6, 2);
    }
  }

  // Stalactite curtain
  const stN = lite ? 7 : 12;
  for (let i = 0; i < stN; i++) {
    const x = Math.round(wrap(i * (w / stN) + pSlow * 0.4, w + 20) - 10);
    const tall = Math.round(h * (0.18 + (i % 4) * 0.05));
    c.fillStyle = P.rock;
    c.beginPath();
    c.moveTo(x - 6, 0);
    c.lineTo(x, tall);
    c.lineTo(x + 6, 0);
    c.closePath();
    c.fill();
    c.fillStyle = P.mineral;
    c.fillRect(x - 1, 2, 2, Math.round(tall * 0.7));
  }

  // Spotlight flecks
  if (!lite) {
    for (let i = 0; i < 5; i++) {
      const x = Math.round(wrap(i * 0.2 * w + pSlow * 1.2, w));
      const y = Math.round(h * 0.18 + (i % 3) * 14);
      c.fillStyle = 'rgba(232,240,255,.35)';
      c.fillRect(x, y, 3, 3);
    }
  }

  // Water mirror
  c.fillStyle = P.water;
  c.fillRect(0, waterY, w, h - waterY);
  c.fillStyle = P.wet;
  c.fillRect(0, waterY, w, 4);
  // reflected amber + stalactites (ghosted)
  for (let i = 0; i < (lite ? 4 : 7); i++) {
    const x = Math.round(wrap(i * (w / 7) + pSlow * 0.35, w));
    c.fillStyle = 'rgba(232,168,88,.18)';
    c.fillRect(x, waterY + 8, 16, Math.round((h - waterY) * 0.55));
    c.fillStyle = 'rgba(232,224,208,.14)';
    c.beginPath();
    c.moveTo(x + 4, waterY + 4);
    c.lineTo(x + 8, waterY + 28 + (i % 3) * 8);
    c.lineTo(x + 12, waterY + 4);
    c.closePath();
    c.fill();
  }
  // green glow pockets reflected
  c.fillStyle = 'rgba(168,200,64,.22)';
  c.fillRect(Math.round(w * 0.12), waterY + 12, 18, 6);
  c.fillRect(Math.round(w * 0.7), waterY + 18, 14, 5);
  c.fillStyle = P.glowGreenHot;
  c.fillRect(Math.round(w * 0.14), waterY + 10, 8, 3);

  // Near ledge
  c.fillStyle = P.rockLite;
  c.fillRect(0, waterY - 8, w, 8);
  c.fillStyle = P.amber;
  c.fillRect(0, waterY - 3, w, 2);

  c.imageSmoothingEnabled = prev;
  return { groundY: waterY };
}
