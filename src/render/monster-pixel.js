/* ===================== MONSTER PIXEL ART (roster double) =============== */
/** 32×32 stickman-pixel sprites. Tinted with species c1/c2. Fallback: canvas art. */

const MONSTER_PIXEL_FILE = {
  art: (id) => './assets/monsters/art-' + id + '.svg',
  species: (id) => './assets/monsters/sp-' + id + '.svg',
};

function monsterPixelKey(sp) {
  if (!sp) return null;
  const art = sp.art;
  if (
    art &&
    typeof MONSTER_ART_SLOTS !== 'undefined' &&
    MONSTER_ART_SLOTS[art] &&
    MONSTER_ART_SLOTS[art].pixelStatus === 'pixel' &&
    typeof MONSTER_PIXEL_ART !== 'undefined' &&
    MONSTER_PIXEL_ART[art]
  ) {
    return { kind: 'art', id: art, map: MONSTER_PIXEL_ART[art] };
  }
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
  if (art && typeof MONSTER_PIXEL_ART !== 'undefined' && MONSTER_PIXEL_ART[art]) {
    return { kind: 'art', id: art, map: MONSTER_PIXEL_ART[art] };
  }
  return null;
}

function monsterPixelPhase(sp, motion) {
  if (motion && typeof motion.hopT === 'number') return motion.hopT * 7.9;
  const id = (sp && (sp.id || sp.art || '')) + '';
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 6283) / 1000;
}

function monsterPixelFeel(sp) {
  const slot = (typeof MONSTER_ART_SLOTS !== 'undefined' && sp && MONSTER_ART_SLOTS[sp.art]) || {};
  const shape = (sp && sp.shape) || slot.shape || '';
  const type = (sp && sp.type) || slot.type || '';
  if (shape === 'flyer' || type === 'fly' || type === 'dragon') return { amp: 0.038, freq: 6.1 };
  if (shape === 'hopper' || type === 'hop') return { amp: 0.036, freq: 5.8 };
  if (shape === 'swimmer' || type === 'swim') return { amp: 0.024, freq: 4.2 };
  if (shape === 'tank' || type === 'tank') return { amp: 0.016, freq: 3.2 };
  if (shape === 'undead') return { amp: 0.018, freq: 3.6 };
  if (shape === 'mech' || type === 'shoot') return { amp: 0.014, freq: 3.8 };
  if (shape === 'insect') return { amp: 0.022, freq: 5.2 };
  return { amp: 0.028, freq: 4.8 };
}

/** Visual-only transform. Hitboxes stay on the entity. */
function monsterPixelMotion(sp, r, t, telegraph, motion) {
  const out = { ox: 0, oy: 0, sx: 1, sy: 1 };
  if (typeof motionReduced === 'function' && motionReduced()) return out;
  const feel = monsterPixelFeel(sp);
  const phase = monsterPixelPhase(sp, motion);
  const amp = Math.min(0.038, feel.amp);
  let bob = Math.sin((Number(t) || 0) * feel.freq + phase) * r * amp;
  const telT = motion && Number(motion.telegraphT);
  const telMax = motion && Number(motion.telegraphMax);
  const dashT = motion && Number(motion.dashT);
  const techT = motion && Number(motion.techniqueTelegraphT);
  const winding = !!(telegraph || (telT > 0) || (techT > 0));
  if (winding) {
    const frac = (telT > 0 && telMax > 0)
      ? Math.max(0, Math.min(1, telT / telMax))
      : (techT > 0 ? Math.max(0, Math.min(1, techT / 0.7)) : 0.45);
    const wind = 1 - frac;
    out.sx = 1 + wind * 0.08;
    out.sy = 1 - wind * 0.07;
    out.ox = -r * (0.03 + wind * 0.055);
    bob *= 0.28;
  } else if (dashT > 0) {
    const p = Math.max(0, Math.min(1, dashT / 0.5));
    out.sx = 1 + p * 0.055;
    out.sy = 1 - p * 0.035;
    out.ox = -r * 0.045 * p;
    bob *= 0.18;
  }
  out.ox = Math.round(out.ox);
  out.oy = Math.round(bob);
  return out;
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
function drawMonsterPixelArt(c, sp, r, t, flash, telegraph, motion) {
  if (!c || !sp) return false;
  const slot = monsterPixelKey(sp);
  if (!slot || !slot.map) return false;
  r = (typeof clamp === 'function') ? clamp(Number(r) || 24, 6, 120) : Math.max(6, Math.min(120, Number(r) || 24));
  const n = (typeof MONSTER_PIXEL_SIZE === 'number' && MONSTER_PIXEL_SIZE > 0) ? MONSTER_PIXEL_SIZE : 32;
  const map = slot.map;
  if (typeof map !== 'string' || map.length < n * n) return false;
  const pal = monsterPixelPalette(sp, flash, telegraph);
  const feel = monsterPixelMotion(sp, r, t, telegraph, motion);
  const cell = (r * 2.15) / n;
  const cellX = cell * feel.sx;
  const cellY = cell * feel.sy;
  const ox = -n * cellX * 0.5 + feel.ox;
  const oy = -n * cellY * 0.52 + feel.oy;
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
        Math.round(ox + x * cellX),
        Math.round(oy + y * cellY),
        Math.max(1, Math.ceil(cellX * w)),
        Math.max(1, Math.ceil(cellY))
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
