/* ============================== TIDE BOSS ART ========================== */
function tideArtOutline(c, lw) {
  c.lineWidth = lw || Math.max(2, 2.2);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(8,12,24,.88)';
}

function tideArtFill(c, fill, stroke, lw) {
  if (!c) return;
  c.fillStyle = fill;
  try { c.fill(); } catch (_) { return; }
  if (stroke !== false) {
    tideArtOutline(c, lw);
    try { c.stroke(); } catch (_) {}
  }
}

function tideArtEye(c, x, y, s, opts) {
  opts = opts || {};
  c.fillStyle = opts.iris || '#ff3030';
  c.beginPath(); c.arc(x, y, s * (opts.slit ? 0.85 : 1), 0, TAU); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - s * 0.22, y - s * 0.12, s * 0.32, 0, TAU); c.fill();
  if (opts.slit) {
    c.fillStyle = '#101018';
    c.fillRect(x - s * 0.08, y - s * 0.55, s * 0.16, s * 1.1);
  } else {
    c.fillStyle = '#101018';
    c.beginPath(); c.arc(x + s * 0.08, y + s * 0.05, s * 0.22, 0, TAU); c.fill();
  }
}

function tideArtGlowRing(c, r, t, col) {
  if (motionReduced() || fxLite()) return;
  const pulse = 1 + Math.sin(t * 4.5) * 0.06;
  c.save();
  c.globalAlpha = 0.14 + Math.sin(t * 3) * 0.05;
  c.strokeStyle = col || '#4a9fff';
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(0, r * 0.15, r * 1.55 * pulse, r * 0.42 * pulse, 0, 0, TAU);
  c.stroke();
  c.restore();
}

function drawTideBossArt(c, art, r, t, body, dark, flash, telegraph) {
  if (!c || !art) return;
  r = clamp(Number(r) || 24, 8, 120);
  t = Number(t) || 0;
  body = body || '#4a9fff';
  dark = dark || '#203050';
  try {
    const breathe = 1 + Math.sin(t * 3.2) * 0.04;
    r *= breathe;
    tideArtGlowRing(c, r, t, flash ? '#fff' : '#4a9fff');
    switch (art) {
      case 'tideFox': drawTideFox(c, r, t, body, dark, flash); break;
      case 'tideSnake': drawTideSnake(c, r, t, body, dark, flash); break;
      case 'tideToad': drawTideToad(c, r, t, body, dark, flash); break;
      case 'tideSlug': drawTideSlug(c, r, t, body, dark, flash); break;
      case 'tideTanuki': drawTideTanuki(c, r, t, body, dark, flash); break;
      case 'tideOx': drawTideOx(c, r, t, body, dark, flash); break;
      case 'tideMonkey': drawTideMonkey(c, r, t, body, dark, flash, telegraph); break;
      case 'tideHawk': drawTideHawk(c, r, t, body, dark, flash); break;
      case 'tideHound': drawTideHound(c, r, t, body, dark, flash); break;
      default: break;
    }
  } catch (err) {
    console.error('[TideArt]', art, err);
    c.fillStyle = body;
    c.beginPath(); c.ellipse(0, 0, r, r * 0.82, 0, 0, TAU); c.fill();
  }
}

function drawTideFox(c, r, t, body, dark) {
  c.save();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU - Math.PI / 2;
    const wag = Math.sin(t * 5 + i * 0.65) * 0.14;
    c.save();
    c.rotate(a + wag);
    c.beginPath();
    c.moveTo(r * 0.15, 0);
    c.quadraticCurveTo(r * 1.35, -r * 0.18, r * 2.05, r * 0.02);
    c.quadraticCurveTo(r * 1.55, r * 0.18, r * 0.15, 0);
    c.closePath();
    tideArtFill(c, i % 2 ? body : dark, true, 2.4);
    c.restore();
  }
  c.beginPath(); c.ellipse(0, 0, r, r * 0.84, 0, 0, TAU);
  tideArtFill(c, body, true, 2.8);
  c.beginPath();
  c.moveTo(-r * 0.52, -r * 0.52); c.lineTo(-r * 0.78, -r * 1.22); c.lineTo(-r * 0.08, -r * 0.62); c.closePath();
  tideArtFill(c, dark, true, 2);
  c.beginPath();
  c.moveTo(r * 0.12, -r * 0.55); c.lineTo(r * 0.02, -r * 1.28); c.lineTo(r * 0.6, -r * 0.6); c.closePath();
  tideArtFill(c, dark, true, 2);
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(r * 0.08, r * 0.08, r * 0.42, r * 0.32, 0, 0, TAU); c.fill();
  tideArtEye(c, -r * 0.4, -r * 0.16, r * 0.12, { slit: true });
  tideArtEye(c, r * 0.06, -r * 0.18, r * 0.11, { slit: true });
  c.fillStyle = '#1a1020';
  c.beginPath(); c.moveTo(-r * 0.06, r * 0.06); c.lineTo(r * 0.02, r * 0.32); c.lineTo(r * 0.14, r * 0.04); c.closePath(); c.fill();
  c.restore();
}

function drawTideSnake(c, r, t, body, dark) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    pts.push({
      x: -r * 1.45 + i * r * 0.21,
      y: Math.sin(t * 3.8 + i * 0.5) * r * 0.24,
    });
  }
  for (let i = pts.length - 1; i > 0; i--) {
    const w = r * 0.34 * (0.55 + i / pts.length * 0.45);
    c.beginPath();
    c.moveTo(pts[i].x, pts[i].y - w * 0.5);
    c.lineTo(pts[i - 1].x, pts[i - 1].y - w * 0.48);
    c.lineTo(pts[i - 1].x, pts[i - 1].y + w * 0.48);
    c.lineTo(pts[i].x, pts[i].y + w * 0.5);
    c.closePath();
    tideArtFill(c, i % 3 ? body : dark, true, 1.8);
  }
  const hx = pts[0].x; const hy = pts[0].y;
  c.beginPath(); c.ellipse(hx, hy, r * 0.58, r * 0.44, -0.25, 0, TAU);
  tideArtFill(c, body, true, 2.6);
  tideArtEye(c, hx - r * 0.18, hy - r * 0.06, r * 0.09);
  tideArtEye(c, hx + r * 0.04, hy - r * 0.06, r * 0.085);
  c.fillStyle = dark;
  c.beginPath(); c.moveTo(hx - r * 0.38, hy + r * 0.06); c.lineTo(hx - r * 0.58, hy + r * 0.16); c.lineTo(hx - r * 0.32, hy + r * 0.14); c.closePath(); c.fill();
  for (let i = 1; i < 5; i++) {
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.beginPath(); c.ellipse(pts[i * 2].x, pts[i * 2].y - r * 0.08, r * 0.08, r * 0.05, 0, 0, TAU); c.fill();
  }
}

function drawTideToad(c, r, t, body, dark) {
  const squat = 1 + Math.sin(t * 2.5) * 0.03;
  c.beginPath(); c.ellipse(0, r * 0.18 * squat, r * 1.18, r * 0.88, 0, 0, TAU);
  tideArtFill(c, body, true, 2.8);
  for (const sx of [-1, 1]) {
    c.beginPath(); c.ellipse(sx * r * 0.58, -r * 0.32, r * 0.38, r * 0.58, sx * -0.15, 0, TAU);
    tideArtFill(c, dark, true, 2.2);
    c.fillStyle = '#233018';
    c.beginPath(); c.arc(sx * r * 0.58, -r * 0.58, r * 0.14, 0, TAU); c.fill();
  }
  c.fillStyle = '#d8f0b0';
  c.beginPath(); c.ellipse(0, r * 0.08, r * 0.78, r * 0.58, 0, 0, TAU); c.fill();
  tideArtEye(c, -r * 0.34, -r * 0.12, r * 0.15);
  tideArtEye(c, r * 0.34, -r * 0.12, r * 0.15);
  c.fillStyle = '#ffd75e';
  c.beginPath(); c.arc(0, r * 0.24, r * 0.09, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(8,12,24,.7)'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, r * 0.24, r * 0.09, 0.2, Math.PI - 0.2); c.stroke();
}

function drawTideSlug(c, r, t, body, dark) {
  c.beginPath(); c.ellipse(0, 0, r * 1.12, r * 0.68, 0, 0, TAU);
  tideArtFill(c, body, true, 2.6);
  c.fillStyle = 'rgba(255,255,255,.22)';
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.ellipse(-r * 0.55 + i * r * 0.28, -r * 0.12 + Math.sin(t * 2 + i) * 2, r * 0.11, r * 0.07, 0, 0, TAU); c.fill();
  }
  c.strokeStyle = dark; c.lineWidth = 2.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(r * 0.92, -r * 0.04); c.quadraticCurveTo(r * 1.28, 0, r * 0.92, r * 0.14); c.stroke();
  tideArtEye(c, -r * 0.22, -r * 0.06, r * 0.13);
  tideArtEye(c, r * 0.18, -r * 0.06, r * 0.11);
  c.fillStyle = 'rgba(196,122,255,.35)';
  c.beginPath(); c.ellipse(0, r * 0.22, r * 0.55, r * 0.18, 0, 0, TAU); c.fill();
}

function drawTideTanuki(c, r, t, body, dark) {
  c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, TAU);
  tideArtFill(c, body, true, 2.6);
  c.beginPath(); c.ellipse(0, r * 0.58, r * 0.58, r * 0.38, 0, 0, TAU);
  tideArtFill(c, dark, true, 2);
  for (const sx of [-1, 1]) {
    c.beginPath(); c.ellipse(sx * r * 0.58, -r * 0.58, r * 0.24, r * 0.38, sx * 0.25, 0, 0, TAU);
    tideArtFill(c, dark, true, 1.8);
  }
  c.fillStyle = '#2a2018';
  c.beginPath(); c.ellipse(0, -r * 0.02, r * 0.38, r * 0.3, 0, 0, TAU); c.fill();
  tideArtEye(c, -r * 0.26, -r * 0.16, r * 0.11);
  tideArtEye(c, r * 0.16, -r * 0.16, r * 0.1);
  c.strokeStyle = body; c.lineWidth = 3.5; c.lineCap = 'round';
  c.beginPath(); c.arc(0, r * 0.88, r * 0.48, Math.PI * 0.12, Math.PI * 0.88); c.stroke();
  c.fillStyle = 'rgba(255,215,94,.45)';
  for (let i = 0; i < 4; i++) {
    const a = t * 0.8 + i * 1.2;
    c.beginPath(); c.arc(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.2 - r * 0.5, 2.5, 0, TAU); c.fill();
  }
}

function drawTideOx(c, r, t, body, dark) {
  c.beginPath(); c.ellipse(0, 0, r, r * 0.76, 0, 0, TAU);
  tideArtFill(c, body, true, 2.8);
  for (const sx of [-1, 1]) {
    c.beginPath(); c.ellipse(sx * r * 0.18, -r * 0.74, r * 0.44, r * 0.3, sx * -0.15, 0, TAU);
    tideArtFill(c, dark, true, 2);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + t * 0.55;
    const len = r * (0.75 + Math.sin(t * 4 + i) * 0.08);
    c.strokeStyle = i % 2 ? '#6ec8ff' : '#4a9fff';
    c.lineWidth = r * 0.13; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.42);
    c.quadraticCurveTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 0.95, Math.cos(a) * len * 1.35, Math.sin(a) * len);
    c.stroke();
  }
  tideArtEye(c, -r * 0.3, -r * 0.1, r * 0.12);
  tideArtEye(c, r * 0.1, -r * 0.1, r * 0.11);
  c.fillStyle = dark;
  c.fillRect(-r * 0.08, r * 0.18, r * 0.16, r * 0.22);
}

function drawTideMonkey(c, r, t, body, dark, telegraph) {
  const raise = telegraph ? -r * 0.15 : Math.sin(t * 2.2) * r * 0.04;
  c.beginPath(); c.ellipse(0, raise, r * 0.88, r * 0.98, 0, 0, TAU);
  tideArtFill(c, body, true, 2.6);
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(0, r * 0.08 + raise, r * 0.58, r * 0.52, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(0, -r * 0.74 + raise, r * 0.4, Math.PI, 0);
  tideArtFill(c, dark, true, 2);
  c.fillStyle = '#ffd75e';
  c.beginPath(); c.moveTo(-r * 0.14, -r * 1.08 + raise); c.lineTo(0, -r * 1.38 + raise); c.lineTo(r * 0.14, -r * 1.08 + raise); c.closePath(); c.fill();
  for (const sx of [-1, 1]) {
    c.beginPath(); c.ellipse(sx * r * 0.78, r * 0.08 + raise, r * 0.34, r * 0.52, sx * 0.28, 0, TAU);
    tideArtFill(c, body, true, 2);
    c.fillStyle = '#ffe9c9';
    c.beginPath(); c.arc(sx * r * 0.95, r * 0.28 + raise, r * 0.14, 0, TAU); c.fill();
  }
  tideArtEye(c, -r * 0.2, -r * 0.12 + raise, r * 0.11);
  tideArtEye(c, r * 0.1, -r * 0.12 + raise, r * 0.1);
}

function drawTideHawk(c, r, t, body, dark) {
  const flap = Math.sin(t * 9) * 0.5;
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * r * 0.12, -r * 0.08); c.rotate(s * (0.62 + flap));
    c.beginPath(); c.moveTo(0, 0); c.lineTo(s * r * 1.85, -r * 0.58); c.lineTo(s * r * 1.45, r * 0.22); c.closePath();
    tideArtFill(c, dark, true, 2.2);
    c.restore();
  }
  c.beginPath(); c.ellipse(0, 0, r * 0.78, r * 0.58, 0, 0, TAU);
  tideArtFill(c, body, true, 2.4);
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.moveTo(-r * 0.82, -r * 0.04); c.lineTo(-r * 1.18, r * 0.06); c.lineTo(-r * 0.78, r * 0.14); c.closePath(); c.fill();
  c.fillStyle = '#ffd75e';
  c.beginPath(); c.moveTo(-r * 0.92, -r * 0.06); c.lineTo(-r * 1.02, -r * 0.24); c.lineTo(-r * 0.82, -r * 0.16); c.closePath(); c.fill();
  tideArtEye(c, -r * 0.32, -r * 0.06, r * 0.09, { iris: '#ffaa20' });
}

function drawTideHound(c, r, t, body, dark) {
  c.beginPath(); c.ellipse(0, r * 0.12, r * 0.98, r * 0.68, 0, 0, TAU);
  tideArtFill(c, body, true, 2.6);
  for (const hx of [-0.55, 0, 0.55]) {
    c.beginPath(); c.ellipse(hx * r, -r * 0.42, r * 0.4, r * 0.44, 0, 0, TAU);
    tideArtFill(c, body, true, 2);
    c.beginPath(); c.moveTo((hx - 0.12) * r, -r * 0.68); c.lineTo(hx * r, -r * 1.02); c.lineTo((hx + 0.12) * r, -r * 0.68); c.closePath();
    tideArtFill(c, dark, true, 1.8);
    tideArtEye(c, (hx - 0.08) * r, -r * 0.45, r * 0.06, { iris: '#ff4040' });
    tideArtEye(c, (hx + 0.05) * r, -r * 0.47, r * 0.055, { iris: '#ff4040' });
  }
  c.fillStyle = '#202830';
  c.beginPath(); c.ellipse(0, r * 0.06, r * 0.28, r * 0.2, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-r * 0.12, r * 0.18); c.lineTo(0, r * 0.32); c.lineTo(r * 0.12, r * 0.18); c.stroke();
}
