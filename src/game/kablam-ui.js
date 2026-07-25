/** KABLAM! nood-ontsnapping UI — vecht-poep cursor + random stickman-smile. */
const KABLAM_PROMPT_R_BASE = 46;
const KABLAM_HIT_PAD = 12;
const KABLAM_SMILE_STYLES = ['grin', 'smirk', 'toothy', 'beam', 'wink'];

function kablamPromptRadius(ui, pulse) {
  return KABLAM_PROMPT_R_BASE * ui * (pulse || 1);
}

function kablamPromptHitRadius(ui) {
  return kablamPromptRadius(ui, 1) + 10 * ui + btnHitSlop() + KABLAM_HIT_PAD;
}

function pickKablamStickFace() {
  const pool = (typeof VS_ROSTER !== 'undefined' ? VS_ROSTER : []).filter((r) => !r.isRobot);
  const entry = pool[Math.floor(Math.random() * pool.length)] || pool[0] || { bodyColor: '#eef5ff' };
  const style = KABLAM_SMILE_STYLES[Math.floor(Math.random() * KABLAM_SMILE_STYLES.length)];
  return { color: entry.bodyColor || '#eef5ff', style, bald: !!entry.bald };
}

function drawKablamPoopCursor(c, s) {
  c.save();
  c.fillStyle = '#7a4f2a';
  c.strokeStyle = '#4a3018';
  c.lineWidth = 2.2 * s;
  c.lineJoin = 'round';

  const blob = (bx, by, rx, ry) => {
    c.beginPath();
    c.ellipse(bx, by, rx, ry, 0, 0, TAU);
    c.fill();
    c.stroke();
  };
  blob(0, 10 * s, 15 * s, 11 * s);
  blob(0, -2 * s, 12 * s, 10 * s);
  blob(0, -13 * s, 9 * s, 8 * s);
  c.strokeStyle = '#5a3818';
  c.lineWidth = 1.8 * s;
  c.beginPath();
  c.arc(0, -15 * s, 3.2 * s, 0, TAU * 1.25);
  c.stroke();

  const fist = (fx, fy) => {
    c.fillStyle = '#ffd75e';
    c.strokeStyle = '#c05820';
    c.lineWidth = 2 * s;
    c.beginPath();
    c.arc(fx, fy, 5.5 * s, 0, TAU);
    c.fill();
    c.stroke();
    c.strokeStyle = '#8a4010';
    c.lineWidth = 1.4 * s;
    c.beginPath();
    c.moveTo(fx - 3 * s, fy - 1 * s);
    c.lineTo(fx + 3 * s, fy - 1 * s);
    c.stroke();
  };
  fist(-18 * s, 4 * s);
  fist(18 * s, -1 * s);

  c.fillStyle = '#fff8ef';
  c.strokeStyle = '#2a2018';
  c.lineWidth = 1.6 * s;
  c.beginPath();
  c.moveTo(11 * s, 16 * s);
  c.lineTo(24 * s, 30 * s);
  c.lineTo(15 * s, 21 * s);
  c.lineTo(8 * s, 27 * s);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}

function drawKablamStickSmile(c, face, s, pulse) {
  if (!face) return;
  const bob = Math.sin(pulse * 8) * 1.5 * s;
  const hx = 30 * s;
  const hy = -24 * s + bob;
  c.save();
  c.strokeStyle = face.color;
  c.fillStyle = face.color;
  c.lineWidth = 2.4 * s;
  c.lineCap = 'round';

  if (face.bald) {
    c.fillStyle = '#ffe8c8';
    c.beginPath();
    c.arc(hx, hy, 8.5 * s, 0, TAU);
    c.fill();
    c.strokeStyle = face.color;
    c.stroke();
  } else {
    c.beginPath();
    c.arc(hx, hy, 8.5 * s, 0, TAU);
    c.stroke();
  }

  c.strokeStyle = '#1a2030';
  c.lineWidth = 1.6 * s;
  const eyeY = hy - 1.5 * s;
  if (face.style === 'wink') {
    c.beginPath();
    c.arc(hx - 3 * s, eyeY, 1.2 * s, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(hx + 2 * s, eyeY);
    c.lineTo(hx + 4.5 * s, eyeY);
    c.stroke();
  } else {
    c.fillStyle = '#1a2030';
    c.beginPath();
    c.arc(hx - 3 * s, eyeY, 1.1 * s, 0, TAU);
    c.arc(hx + 3 * s, eyeY, 1.1 * s, 0, TAU);
    c.fill();
  }

  c.strokeStyle = '#1a2030';
  c.lineWidth = 1.8 * s;
  c.beginPath();
  if (face.style === 'grin' || face.style === 'beam') {
    c.arc(hx, hy + 2 * s, 4.5 * s, 0.12 * Math.PI, 0.88 * Math.PI);
  } else if (face.style === 'smirk') {
    c.arc(hx + 1.5 * s, hy + 2.5 * s, 4 * s, 0.05 * Math.PI, 0.72 * Math.PI);
  } else if (face.style === 'toothy') {
    c.arc(hx, hy + 1.5 * s, 4 * s, 0.18 * Math.PI, 0.82 * Math.PI);
    c.stroke();
    c.lineWidth = 1.2 * s;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(hx + i * 2.2 * s, hy + 4 * s);
      c.lineTo(hx + i * 2.2 * s, hy + 5.6 * s);
      c.stroke();
    }
    c.restore();
    return;
  } else {
    c.arc(hx, hy + 2 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  c.stroke();
  c.restore();
}

function drawKablamIcon(c, scale, pulse, calm, face, spin) {
  if (!calm && spin) c.rotate(spin);
  drawKablamPoopCursor(c, scale);
  drawKablamStickSmile(c, face, scale, pulse);
  if (!calm && spin) c.rotate(-spin);
}

function drawKablamLabel(c, text, x, y, size, fill) {
  c.save();
  c.font = `900 ${size}px "Black Ops One", Bangers, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = Math.max(3, size * 0.28);
  c.strokeStyle = 'rgba(0,0,0,.55)';
  c.strokeText(text, x, y);
  c.fillStyle = fill || '#fff';
  c.fillText(text, x, y);
  c.restore();
}
