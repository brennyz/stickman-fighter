/* ============ IN-GAME ART HELPERS (art-upgrade 3/4) ==================== */
/** Getekend pickup-icoon (hart/vlam/spiraal/schild) ipv tekstlabel. */
function drawPickupIcon(c, kind, x, y, tint) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#0a0d18';
  if (kind === 'heal') {
    c.beginPath();
    c.moveTo(0, 6.5);
    c.bezierCurveTo(-9.5, -1.5, -5, -9.5, 0, -4);
    c.bezierCurveTo(5, -9.5, 9.5, -1.5, 0, 6.5);
    c.fill();
  } else if (kind === 'rage') {
    c.beginPath();
    c.moveTo(0.5, -8);
    c.quadraticCurveTo(6.5, -1.5, 3.5, 4);
    c.quadraticCurveTo(2.5, 7, -0.5, 7);
    c.quadraticCurveTo(-5, 7, -4.5, 2);
    c.quadraticCurveTo(-6.5, -2, 0.5, -8);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath();
    c.ellipse(-0.5, 3, 2, 3, 0, 0, TAU);
    c.fill();
  } else if (kind === 'energy') {
    c.strokeStyle = '#0a0d18';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    for (let a = 0; a < TAU * 1.55; a += 0.22) {
      const rr = 1.2 + a * 1.35;
      const sx = Math.cos(a) * rr, sy = Math.sin(a) * rr;
      if (a === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
    }
    c.stroke();
  } else if (kind === 'skill_shard' || kind === 'item_shard') {
    const fill = tint || (kind === 'item_shard' ? '#c792ff' : '#ffd75e');
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(6.5, -1);
    c.lineTo(4, 7);
    c.lineTo(-4, 7);
    c.lineTo(-6.5, -1);
    c.closePath();
    c.fill();
    c.strokeStyle = '#0a0d18';
    c.lineWidth = 1.6;
    c.stroke();
    if (kind === 'item_shard') {
      c.fillStyle = '#0a0d18';
      c.beginPath();
      c.arc(0, 0, 2.2, 0, TAU);
      c.fill();
    }
  } else {
    c.beginPath();
    c.moveTo(0, -8);
    c.quadraticCurveTo(7, -6.5, 7, -2.5);
    c.quadraticCurveTo(7, 3.5, 0, 8);
    c.quadraticCurveTo(-7, 3.5, -7, -2.5);
    c.quadraticCurveTo(-7, -6.5, 0, -8);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -5);
    c.lineTo(0, 4.5);
    c.stroke();
  }
  c.restore();
}

/** Vijfpuntige ster (gevuld of outline) ipv ★/☆ tekst-glyphs. */
function drawStarShape(c, x, y, r, color, filled) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  if (filled) { c.fillStyle = color; c.fill(); }
  else { c.strokeStyle = color; c.lineWidth = 1.6; c.stroke(); }
  c.restore();
}

/** Mini-dobbelsteen voor gamble-HUD-regels ipv 🎲. */
function drawMiniDie(c, x, y, s, color) {
  c.save();
  c.fillStyle = color;
  const half = s / 2;
  c.beginPath();
  if (c.roundRect) c.roundRect(x - half, y - half, s, s, s * 0.24);
  else c.rect(x - half, y - half, s, s);
  c.fill();
  c.fillStyle = '#0a0d18';
  const d = s * 0.22, pr = Math.max(0.8, s * 0.11);
  for (const [dx, dy] of [[-d, -d], [d, d], [0, 0]]) {
    c.beginPath();
    c.arc(x + dx, y + dy, pr, 0, TAU);
    c.fill();
  }
  c.restore();
}

/** Mini-golf-icoon voor Tide bondgenoot-HUD. */
function drawMiniWave(c, x, y, s, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = Math.max(1.2, s * 0.14);
  c.lineCap = 'round';
  const w = s * 0.9;
  c.beginPath();
  c.moveTo(x - w, y);
  c.bezierCurveTo(x - w * 0.55, y - s * 0.35, x - w * 0.15, y + s * 0.35, x, y);
  c.bezierCurveTo(x + w * 0.15, y - s * 0.35, x + w * 0.55, y + s * 0.35, x + w, y);
  c.stroke();
  c.beginPath();
  c.moveTo(x - w * 0.75, y + s * 0.22);
  c.bezierCurveTo(x - w * 0.35, y - s * 0.12, x - w * 0.05, y + s * 0.42, x + w * 0.25, y + s * 0.22);
  c.stroke();
  c.restore();
}

