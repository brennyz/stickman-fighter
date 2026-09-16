/* ====================== CATALOG W2 STUB SILHOUETTES ==================== */
/**
 * Placeholder shapes until the pixel-art partner fills MONSTER_ART_SLOTS.
 * Distinct per `shape` so woods/crypt/scrap/frost/sea read differently in-fight.
 * Replace a case in drawCatalogStubArt — keep this fallback.
 */

function catalogStubEye(c, x, y, s) {
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
  c.fillStyle = '#1a1a2a';
  c.beginPath(); c.arc(x - s * 0.28, y, s * 0.48, 0, TAU); c.fill();
}

function catalogStubMark(c, art, r, dark) {
  const letters = String(art || '??').slice(0, 2).toUpperCase();
  c.fillStyle = dark;
  c.globalAlpha *= 0.85;
  c.font = 'bold ' + Math.max(7, Math.round(r * 0.42)) + 'px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(letters, 0, r * 0.08);
  c.globalAlpha = 1;
}

function drawCatalogShape(c, shape, r, t, body, dark, telegraph, motion) {
  const feel = (typeof monsterPixelMotion === 'function')
    ? monsterPixelMotion({ shape, type: shape, art: motion && motion.art }, r, t, telegraph, motion)
    : { ox: 0, oy: (typeof motionReduced === 'function' && motionReduced()) ? 0 : Math.sin(t * 4.2) * r * 0.03, sx: 1, sy: 1 };
  const warn = telegraph ? 1.08 : 1;
  c.save();
  c.translate(feel.ox, feel.oy);
  c.scale(feel.sx, feel.sy);
  c.fillStyle = body;
  switch (shape) {
    case 'flyer': {
      const flap = Math.sin(t * 10) * 0.45;
      c.fillStyle = dark;
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * r * 0.35, -r * 0.15);
        c.rotate(s * (0.4 + flap));
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(s * r * 1.35, -r * 0.55);
        c.lineTo(s * r * 1.05, r * 0.28);
        c.closePath();
        c.fill();
        c.restore();
      }
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, 0, r * 0.78 * warn, r * 0.62, 0, 0, TAU); c.fill();
      catalogStubEye(c, -r * 0.22, -r * 0.08, r * 0.14);
      break;
    }
    case 'hopper': {
      c.beginPath(); c.ellipse(0, r * 0.08, r * 1.05, r * 0.72 * warn, 0, 0, TAU); c.fill();
      c.fillStyle = dark;
      c.fillRect(-r * 0.7, r * 0.45, r * 0.28, r * 0.4);
      c.fillRect(r * 0.38, r * 0.45, r * 0.28, r * 0.4);
      catalogStubEye(c, -r * 0.28, -r * 0.05, r * 0.15);
      catalogStubEye(c, r * 0.18, -r * 0.05, r * 0.15);
      break;
    }
    case 'tank': {
      c.beginPath();
      c.moveTo(-r * 1.05, r * 0.7);
      c.lineTo(-r * 0.95, -r * 0.35);
      c.lineTo(r * 0.95, -r * 0.3);
      c.lineTo(r * 1.05, r * 0.7);
      c.closePath();
      c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.arc(-r * 0.55, -r * 0.55, r * 0.32, 0, TAU); c.fill();
      catalogStubEye(c, -r * 0.62, -r * 0.58, r * 0.12);
      break;
    }
    case 'shooter': {
      c.beginPath(); c.ellipse(0, r * 0.1, r * 0.7, r * 0.85 * warn, 0, 0, TAU); c.fill();
      c.fillStyle = telegraph ? '#ffd75e' : dark;
      c.beginPath(); c.arc(0, -r * 0.85, r * 0.22, 0, TAU); c.fill();
      catalogStubEye(c, -r * 0.18, -r * 0.1, r * 0.14);
      catalogStubEye(c, r * 0.2, -r * 0.1, r * 0.14);
      break;
    }
    case 'swimmer': {
      const wag = Math.sin(t * 5) * 0.08;
      c.save(); c.rotate(wag);
      c.beginPath(); c.ellipse(0, 0, r * 1.15 * warn, r * 0.52, 0, 0, TAU); c.fill();
      c.fillStyle = dark;
      c.beginPath();
      c.moveTo(r * 0.95, 0);
      c.lineTo(r * 1.5, -r * 0.28);
      c.lineTo(r * 1.5, r * 0.28);
      c.closePath();
      c.fill();
      catalogStubEye(c, -r * 0.55, -r * 0.08, r * 0.12);
      c.restore();
      break;
    }
    case 'undead': {
      c.fillRect(-r * 0.38, -r * 0.15, r * 0.76, r * 0.95);
      c.beginPath(); c.arc(0, -r * 0.45, r * 0.48, 0, TAU); c.fill();
      c.fillStyle = dark;
      c.fillRect(-r * 0.18, -r * 0.55, r * 0.12, r * 0.16);
      c.fillRect(r * 0.06, -r * 0.55, r * 0.12, r * 0.16);
      c.fillRect(-r * 0.16, -r * 0.22, r * 0.32, r * 0.08);
      break;
    }
    case 'insect': {
      c.beginPath(); c.ellipse(-r * 0.45, 0, r * 0.38, r * 0.32, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0.05 * r, 0, r * 0.42, r * 0.38, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(r * 0.5, 0, r * 0.34, r * 0.3, 0, 0, TAU); c.fill();
      c.strokeStyle = dark;
      c.lineWidth = Math.max(1.5, r * 0.08);
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(0, r * 0.1); c.lineTo(s * r * 0.85, r * 0.55); c.stroke();
      }
      catalogStubEye(c, -r * 0.55, -r * 0.08, r * 0.1);
      break;
    }
    case 'mech': {
      c.fillRect(-r * 0.7, -r * 0.55, r * 1.4, r * 1.15);
      c.fillStyle = dark;
      c.fillRect(-r * 0.7, -r * 0.55, r * 1.4, r * 0.22);
      c.fillStyle = telegraph ? '#ffd75e' : '#7cf5ff';
      c.beginPath(); c.arc(-r * 0.18, -r * 0.08, r * 0.16, 0, TAU); c.fill();
      break;
    }
    case 'quad':
    default: {
      c.beginPath(); c.ellipse(0, 0, r * warn, r * 0.68, 0, 0, TAU); c.fill();
      c.fillStyle = dark;
      for (const x of [-0.55, 0.2]) {
        c.fillRect(r * x, r * 0.4, r * 0.22, r * 0.42);
      }
      c.fillStyle = body;
      c.beginPath();
      c.moveTo(-r * 0.85, -r * 0.15);
      c.lineTo(-r * 1.25, -r * 0.05);
      c.lineTo(-r * 0.8, r * 0.15);
      c.closePath();
      c.fill();
      catalogStubEye(c, -r * 0.45, -r * 0.12, r * 0.13);
      break;
    }
  }
  c.restore();
}

function drawCatalogStubArt(c, art, r, t, body, dark, telegraph, motion) {
  if (!c) return;
  r = clamp(Number(r) || 22, 6, 120);
  const slot = (typeof MONSTER_ART_SLOTS !== 'undefined' && MONSTER_ART_SLOTS[art]) || { shape: 'quad' };
  const bag = Object.assign({ art }, motion || {});
  drawCatalogShape(c, slot.shape || 'quad', r, t, body || '#888', dark || '#444', telegraph, bag);
  catalogStubMark(c, art, r, dark || '#333');
  if (slot.pixelStatus === 'stub') {
    c.save();
    c.strokeStyle = 'rgba(255,215,94,.45)';
    c.lineWidth = Math.max(1, r * 0.05);
    c.setLineDash([3, 3]);
    c.beginPath(); c.ellipse(0, 0, r * 1.2, r * 0.95, 0, 0, TAU); c.stroke();
    c.restore();
  }
}
