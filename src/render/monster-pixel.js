/* ===================== MONSTER PIXEL ART (roster double) =============== */
/** 32×32 stickman-pixel sprites. Tinted with species c1/c2. Fallback: canvas art. */

const MONSTER_PIXEL_FILE = {
  art: (id) => './assets/monsters/art-' + id + '.svg',
  species: (id) => './assets/monsters/sp-' + id + '.svg',
};

function monsterPixelKey(sp) {
  if (!sp) return null;
  const pixel = sp.pixel;
  if (pixel && typeof MONSTER_PIXEL_SPECIES !== 'undefined' && MONSTER_PIXEL_SPECIES[pixel]) {
    return { kind: 'species', id: pixel, map: MONSTER_PIXEL_SPECIES[pixel] };
  }
  if (pixel && typeof MONSTER_PIXEL_ART !== 'undefined' && MONSTER_PIXEL_ART[pixel]) {
    return { kind: 'art', id: pixel, map: MONSTER_PIXEL_ART[pixel] };
  }
  const sid = sp.id;
  if (sid && typeof MONSTER_PIXEL_SPECIES !== 'undefined' && MONSTER_PIXEL_SPECIES[sid]) {
    return { kind: 'species', id: sid, map: MONSTER_PIXEL_SPECIES[sid] };
  }
  const art = sp.art;
  if (art && typeof MONSTER_PIXEL_ART !== 'undefined' && MONSTER_PIXEL_ART[art]) {
    return { kind: 'art', id: art, map: MONSTER_PIXEL_ART[art] };
  }
  return null;
}

function monsterPixelPalette(sp, flash, telegraph) {
  const body = flash ? '#ffffff' : (telegraph ? '#ffdd66' : (sp && sp.c1) || '#c98850');
  const dark = flash ? '#dddddd' : (telegraph ? '#c97a20' : (sp && sp.c2) || '#6b4a28');
  return {
    B: body,
    D: dark,
    W: '#f4f7ff',
    K: '#1a1a2a',
    A: flash ? '#fff6d8' : '#ffe9c9',
    H: 'rgba(255,255,255,.42)',
    P: flash ? '#ffd0d8' : '#ff8aa0',
    O: flash ? '#ffd9a8' : '#ff9a42',
    N: flash ? '#8a90a0' : '#14161e',
  };
}

/**
 * Paint a 32×32 map centered on current transform (art already faces left).
 * Returns true if a map was drawn.
 */
function drawMonsterPixelArt(c, sp, r, t, flash, telegraph) {
  if (!c || !sp) return false;
  const slot = monsterPixelKey(sp);
  if (!slot || !slot.map) return false;
  r = (typeof clamp === 'function') ? clamp(Number(r) || 24, 6, 120) : Math.max(6, Math.min(120, Number(r) || 24));
  const n = (typeof MONSTER_PIXEL_SIZE === 'number' && MONSTER_PIXEL_SIZE > 0) ? MONSTER_PIXEL_SIZE : 32;
  const map = slot.map;
  if (typeof map !== 'string' || map.length < n * n) return false;
  const pal = monsterPixelPalette(sp, flash, telegraph);
  const cell = (r * 2.15) / n;
  const bob = (typeof motionReduced === 'function' && motionReduced())
    ? 0
    : Math.sin((Number(t) || 0) * 5) * r * 0.03;
  const ox = -n * cell * 0.5;
  const oy = -n * cell * 0.52 + bob;
  const prevSmooth = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  if (c.imageSmoothingQuality) c.imageSmoothingQuality = 'low';
  let painted = 0;
  for (let y = 0; y < n; y++) {
    const rowOff = y * n;
    let x = 0;
    while (x < n) {
      const ch = map.charAt(rowOff + x);
      if (ch === '.' || !pal[ch]) { x++; continue; }
      let w = 1;
      while (x + w < n && map.charAt(rowOff + x + w) === ch) w++;
      c.fillStyle = pal[ch];
      c.fillRect(
        Math.round(ox + x * cell),
        Math.round(oy + y * cell),
        Math.max(1, Math.ceil(cell * w)),
        Math.max(1, Math.ceil(cell))
      );
      painted += w;
      x += w;
    }
  }
  c.imageSmoothingEnabled = prevSmooth;
  return painted > 12;
}

function monsterPixelCoverage() {
  const artN = (typeof MONSTER_PIXEL_ART === 'object' && MONSTER_PIXEL_ART)
    ? Object.keys(MONSTER_PIXEL_ART).length
    : 0;
  const spN = (typeof MONSTER_PIXEL_SPECIES === 'object' && MONSTER_PIXEL_SPECIES)
    ? Object.keys(MONSTER_PIXEL_SPECIES).length
    : 0;
  return { art: artN, species: spN };
}
