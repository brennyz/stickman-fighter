/* ============================== FARM / ZOO BEAST ART =================== */
/** Reuzen-boerderij- & dierentuindieren (arcade silhouetten). */

const BEAST_ARTS = new Set([
  'cow', 'pig', 'chicken', 'sheep', 'horse', 'goat', 'duck', 'rooster', 'donkey', 'goose',
  'elephant', 'lion', 'tiger', 'giraffe', 'hippo', 'rhino', 'gorilla', 'zebra', 'bear', 'croc',
  'kangaroo', 'panda', 'flamingo', 'camel',
]);

function beastEye(c, x, y, s) {
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
  c.fillStyle = '#1a1a2a';
  c.beginPath(); c.arc(x - s * 0.28, y, s * 0.48, 0, TAU); c.fill();
}

function drawBeastArt(c, art, r, t, body, dark, flash, telegraph) {
  if (!c || !art) return;
  r = clamp(Number(r) || 28, 8, 120);
  t = Number(t) || 0;
  body = body || '#c98850';
  dark = dark || '#6b4a28';
  try {
    switch (art) {
      case 'cow': drawBeastCow(c, r, t, body, dark, telegraph); break;
      case 'pig': drawBeastPig(c, r, t, body, dark); break;
      case 'chicken': drawBeastChicken(c, r, t, body, dark); break;
      case 'sheep': drawBeastSheep(c, r, t, body, dark); break;
      case 'horse': drawBeastHorse(c, r, t, body, dark, telegraph); break;
      case 'goat': drawBeastGoat(c, r, t, body, dark, telegraph); break;
      case 'duck': drawBeastDuck(c, r, t, body, dark); break;
      case 'rooster': drawBeastRooster(c, r, t, body, dark); break;
      case 'donkey': drawBeastDonkey(c, r, t, body, dark); break;
      case 'goose': drawBeastGoose(c, r, t, body, dark); break;
      case 'elephant': drawBeastElephant(c, r, t, body, dark, telegraph); break;
      case 'lion': drawBeastLion(c, r, t, body, dark); break;
      case 'tiger': drawBeastTiger(c, r, t, body, dark); break;
      case 'giraffe': drawBeastGiraffe(c, r, t, body, dark); break;
      case 'hippo': drawBeastHippo(c, r, t, body, dark, telegraph); break;
      case 'rhino': drawBeastRhino(c, r, t, body, dark, telegraph); break;
      case 'gorilla': drawBeastGorilla(c, r, t, body, dark, telegraph); break;
      case 'zebra': drawBeastZebra(c, r, t, body, dark); break;
      case 'bear': drawBeastBear(c, r, t, body, dark, telegraph); break;
      case 'croc': drawBeastCroc(c, r, t, body, dark); break;
      case 'kangaroo': drawBeastKangaroo(c, r, t, body, dark, telegraph); break;
      case 'panda': drawBeastPanda(c, r, t, body, dark); break;
      case 'flamingo': drawBeastFlamingo(c, r, t, body, dark); break;
      case 'camel': drawBeastCamel(c, r, t, body, dark); break;
      default: break;
    }
  } catch (err) {
    console.error('[BeastArt]', art, err);
    c.fillStyle = body;
    c.beginPath(); c.ellipse(0, 0, r, r * 0.82, 0, 0, TAU); c.fill();
  }
}

function drawBeastCow(c, r, t, body, dark, telegraph) {
  const stomp = telegraph ? -r * 0.06 : Math.sin(t * 4) * r * 0.02;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, stomp, r * 1.15, r * 0.72, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.ellipse(-r * 0.95, -r * 0.15 + stomp, r * 0.48, r * 0.42, -0.2, 0, TAU); c.fill();
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(sx * r * 0.15 - r * 0.95, -r * 0.45 + stomp);
    c.lineTo(sx * r * 0.55 - r * 0.95, -r * 0.95 + stomp);
    c.lineTo(sx * r * 0.05 - r * 0.95, -r * 0.55 + stomp);
    c.closePath(); c.fill();
  }
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(-r * 1.25, r * 0.05 + stomp, r * 0.22, r * 0.16, 0, 0, TAU); c.fill();
  c.fillStyle = '#ff8aa0';
  c.beginPath(); c.ellipse(r * 0.55, r * 0.35 + stomp, r * 0.28, r * 0.22, 0, 0, TAU); c.fill();
  beastEye(c, -r * 1.05, -r * 0.25 + stomp, r * 0.12);
}

function drawBeastPig(c, r, t, body, dark) {
  const bounce = Math.sin(t * 5) * r * 0.03;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, bounce, r * 1.05, r * 0.78, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.ellipse(-r * 0.95, bounce, r * 0.42, r * 0.38, 0, 0, TAU); c.fill();
  c.fillStyle = '#ff9ab8';
  c.beginPath(); c.ellipse(-r * 1.28, r * 0.08 + bounce, r * 0.28, r * 0.2, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.arc(-r * 1.35, r * 0.02 + bounce, r * 0.06, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 1.22, r * 0.08 + bounce, r * 0.06, 0, TAU); c.fill();
  c.strokeStyle = dark; c.lineWidth = Math.max(2, r * 0.1); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(r * 0.85, 0 + bounce);
  c.quadraticCurveTo(r * 1.35, -r * 0.35 + Math.sin(t * 8) * 4, r * 1.15, r * 0.25 + bounce);
  c.stroke();
  beastEye(c, -r * 0.95, -r * 0.15 + bounce, r * 0.12);
}

function drawBeastChicken(c, r, t, body, dark) {
  const flap = Math.sin(t * 10) * 0.35;
  c.fillStyle = dark;
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * r * 0.15, -r * 0.1); c.rotate(s * (0.4 + flap));
    c.beginPath(); c.ellipse(s * r * 0.55, 0, r * 0.55, r * 0.22, 0, 0, TAU); c.fill();
    c.restore();
  }
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.15, r * 0.72, r * 0.65, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 0.55, -r * 0.35, r * 0.38, 0, TAU); c.fill();
  c.fillStyle = '#e04f4f';
  c.beginPath();
  c.moveTo(-r * 0.55, -r * 0.7); c.lineTo(-r * 0.7, -r * 1.05); c.lineTo(-r * 0.4, -r * 0.72);
  c.lineTo(-r * 0.55, -r * 1.15); c.lineTo(-r * 0.35, -r * 0.7);
  c.closePath(); c.fill();
  c.fillStyle = '#ff9a42';
  c.beginPath(); c.moveTo(-r * 0.9, -r * 0.3); c.lineTo(-r * 1.2, -r * 0.2); c.lineTo(-r * 0.88, -r * 0.12); c.closePath(); c.fill();
  beastEye(c, -r * 0.65, -r * 0.4, r * 0.1);
}

function drawBeastSheep(c, r, t, body, dark) {
  const puff = 1 + Math.sin(t * 3) * 0.03;
  c.fillStyle = body;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    c.beginPath();
    c.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.4, r * 0.42 * puff, 0, TAU);
    c.fill();
  }
  c.beginPath(); c.ellipse(0, 0, r * 0.95 * puff, r * 0.72 * puff, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.ellipse(-r * 0.95, -r * 0.05, r * 0.38, r * 0.36, 0, 0, TAU); c.fill();
  beastEye(c, -r * 1.05, -r * 0.12, r * 0.1);
}

function drawBeastHorse(c, r, t, body, dark, telegraph) {
  const rear = telegraph ? -0.12 : Math.sin(t * 6) * 0.03;
  c.save(); c.rotate(rear);
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0.1 * r, 0.1 * r, r * 1.1, r * 0.58, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.95, -r * 0.35, r * 0.42, r * 0.55, -0.35, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 1.25, -r * 0.55, r * 0.38, r * 0.32, -0.2, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-r * 1.15, -r * 0.85); c.lineTo(-r * 1.05, -r * 1.25); c.lineTo(-r * 0.85, -r * 0.78);
  c.closePath(); c.fill();
  c.strokeStyle = dark; c.lineWidth = Math.max(2, r * 0.16); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(r * 0.9, 0);
  c.quadraticCurveTo(r * 1.4, -r * 0.4 + Math.sin(t * 7) * 5, r * 1.55, r * 0.15);
  c.stroke();
  beastEye(c, -r * 1.3, -r * 0.6, r * 0.1);
  c.restore();
}

function drawBeastGoat(c, r, t, body, dark, telegraph) {
  const tilt = telegraph ? -0.15 : Math.sin(t * 5) * 0.04;
  c.save(); c.rotate(tilt);
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.08, r * 0.95, r * 0.62, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.9, -r * 0.2, r * 0.4, r * 0.38, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(sx * r * 0.12 - r * 0.9, -r * 0.45);
    c.quadraticCurveTo(sx * r * 0.55 - r * 0.9, -r * 1.15, sx * r * 0.2 - r * 0.9, -r * 0.55);
    c.closePath(); c.fill();
  }
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(-r * 1.15, r * 0.05, r * 0.16, r * 0.12, 0, 0, TAU); c.fill();
  beastEye(c, -r * 0.95, -r * 0.28, r * 0.1);
  c.restore();
}

function drawBeastDuck(c, r, t, body, dark) {
  const bob = Math.sin(t * 4) * r * 0.04;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.15 + bob, r * 0.85, r * 0.5, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 0.55, -r * 0.25 + bob, r * 0.32, 0, TAU); c.fill();
  c.fillStyle = '#ff9a42';
  c.beginPath(); c.moveTo(-r * 0.85, -r * 0.22 + bob); c.lineTo(-r * 1.25, -r * 0.15 + bob); c.lineTo(-r * 0.85, -r * 0.08 + bob); c.closePath(); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.ellipse(r * 0.55, r * 0.05 + bob, r * 0.35, r * 0.18, 0.3, 0, TAU); c.fill();
  beastEye(c, -r * 0.6, -r * 0.32 + bob, r * 0.09);
}

function drawBeastRooster(c, r, t, body, dark) {
  const flap = Math.sin(t * 11) * 0.45;
  c.fillStyle = dark;
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * r * 0.1, -r * 0.05); c.rotate(s * (0.5 + flap));
    c.beginPath(); c.moveTo(0, 0); c.lineTo(s * r * 1.2, -r * 0.55); c.lineTo(s * r * 0.9, r * 0.2); c.closePath(); c.fill();
    c.restore();
  }
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.1, r * 0.7, r * 0.62, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 0.5, -r * 0.4, r * 0.36, 0, TAU); c.fill();
  c.fillStyle = '#e04f4f';
  for (let i = 0; i < 3; i++) {
    const x = -r * 0.65 + i * r * 0.16;
    c.beginPath();
    c.moveTo(x, -r * 0.7); c.lineTo(x - r * 0.08, -r * 1.15); c.lineTo(x + r * 0.1, -r * 0.7);
    c.closePath(); c.fill();
  }
  c.fillStyle = '#ff9a42';
  c.beginPath(); c.moveTo(-r * 0.85, -r * 0.35); c.lineTo(-r * 1.2, -r * 0.25); c.lineTo(-r * 0.82, -r * 0.15); c.closePath(); c.fill();
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(r * 0.55, 0);
  c.lineTo(r * 1.15, -r * 0.35 + Math.sin(t * 6) * 4);
  c.lineTo(r * 0.95, r * 0.25);
  c.closePath(); c.fill();
  beastEye(c, -r * 0.58, -r * 0.45, r * 0.1);
}

function drawBeastDonkey(c, r, t, body, dark) {
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.1, r * 1.0, r * 0.58, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.9, -r * 0.25, r * 0.4, r * 0.48, -0.25, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(sx * r * 0.12 - r * 0.85, -r * 0.55);
    c.lineTo(sx * r * 0.08 - r * 0.85, -r * 1.2);
    c.lineTo(sx * r * 0.28 - r * 0.85, -r * 0.55);
    c.closePath(); c.fill();
  }
  c.strokeStyle = dark; c.lineWidth = Math.max(2, r * 0.12); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(r * 0.85, 0);
  c.quadraticCurveTo(r * 1.25, r * 0.2 + Math.sin(t * 5) * 3, r * 1.15, r * 0.4);
  c.stroke();
  beastEye(c, -r * 1.0, -r * 0.35, r * 0.1);
}

function drawBeastGoose(c, r, t, body, dark) {
  const bob = Math.sin(t * 3.5) * r * 0.03;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0.1 * r, r * 0.2 + bob, r * 0.9, r * 0.48, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.35, -r * 0.35 + bob, r * 0.28, r * 0.55, -0.4, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 0.65, -r * 0.75 + bob, r * 0.28, 0, TAU); c.fill();
  c.fillStyle = '#ff9a42';
  c.beginPath(); c.moveTo(-r * 0.9, -r * 0.72 + bob); c.lineTo(-r * 1.25, -r * 0.68 + bob); c.lineTo(-r * 0.9, -r * 0.58 + bob); c.closePath(); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.ellipse(r * 0.7, r * 0.05 + bob, r * 0.32, r * 0.16, 0.25, 0, TAU); c.fill();
  beastEye(c, -r * 0.7, -r * 0.8 + bob, r * 0.09);
}

function drawBeastElephant(c, r, t, body, dark, telegraph) {
  const sway = telegraph ? r * 0.08 : Math.sin(t * 2.5) * r * 0.03;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0.1 * r, 0.05 * r, r * 1.15, r * 0.85, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.85, -r * 0.35, r * 0.55, r * 0.5, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (const sx of [-1, 1]) {
    c.beginPath(); c.ellipse(sx * r * 0.55 - r * 0.85, -r * 0.55, r * 0.28, r * 0.38, sx * 0.2, 0, TAU); c.fill();
  }
  c.strokeStyle = body; c.lineWidth = Math.max(3, r * 0.22); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-r * 1.15, -r * 0.15);
  c.quadraticCurveTo(-r * 1.55 + sway, r * 0.35, -r * 1.25 + sway * 0.5, r * 0.85);
  c.stroke();
  c.fillStyle = '#ffe9c9';
  c.beginPath();
  c.moveTo(-r * 1.15, r * 0.05); c.lineTo(-r * 1.55, r * 0.35); c.lineTo(-r * 1.05, r * 0.25);
  c.closePath(); c.fill();
  beastEye(c, -r * 0.95, -r * 0.4, r * 0.1);
}

function drawBeastLion(c, r, t, body, dark) {
  const mane = 1 + Math.sin(t * 4) * 0.04;
  c.fillStyle = dark;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.4 - r * 0.15);
    c.lineTo(Math.cos(a) * r * 1.15 * mane, Math.sin(a) * r * 1.0 * mane - r * 0.15);
    c.lineTo(Math.cos(a + 0.35) * r * 0.45, Math.sin(a + 0.35) * r * 0.4 - r * 0.15);
    c.closePath(); c.fill();
  }
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0.15 * r, r * 0.25, r * 0.95, r * 0.55, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 0.55, -r * 0.15, r * 0.48, 0, TAU); c.fill();
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(-r * 0.7, r * 0.05, r * 0.22, r * 0.16, 0, 0, TAU); c.fill();
  beastEye(c, -r * 0.7, -r * 0.25, r * 0.11);
}

function drawBeastTiger(c, r, t, body, dark) {
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.08, r * 1.1, r * 0.58, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.95, -r * 0.2, r * 0.45, r * 0.42, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (let i = 0; i < 5; i++) {
    const x = -r * 0.5 + i * r * 0.32;
    c.fillRect(x, -r * 0.25, r * 0.1, r * 0.7);
  }
  c.beginPath();
  c.moveTo(-r * 0.7, -r * 0.55); c.lineTo(-r * 0.85, -r * 1.0); c.lineTo(-r * 0.5, -r * 0.55);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(-r * 1.05, -r * 0.5); c.lineTo(-r * 1.15, -r * 0.95); c.lineTo(-r * 0.85, -r * 0.5);
  c.closePath(); c.fill();
  c.strokeStyle = dark; c.lineWidth = Math.max(2, r * 0.14); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(r * 0.95, 0);
  c.quadraticCurveTo(r * 1.45, -r * 0.25 + Math.sin(t * 6) * 4, r * 1.35, r * 0.2);
  c.stroke();
  beastEye(c, -r * 1.05, -r * 0.3, r * 0.1);
}

function drawBeastGiraffe(c, r, t, body, dark) {
  const sway = Math.sin(t * 2) * 0.05;
  c.save(); c.rotate(sway);
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0.2 * r, r * 0.45, r * 0.85, r * 0.45, 0, 0, TAU); c.fill();
  c.fillRect(-r * 0.35, -r * 0.95, r * 0.35, r * 1.35);
  c.beginPath(); c.ellipse(-r * 0.45, -r * 1.05, r * 0.38, r * 0.28, -0.2, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.arc(-r * 0.1 + (i % 2) * r * 0.15, -r * 0.2 + i * r * 0.28, r * 0.12, 0, TAU);
    c.fill();
  }
  c.beginPath();
  c.moveTo(-r * 0.55, -r * 1.25); c.lineTo(-r * 0.5, -r * 1.45); c.lineTo(-r * 0.35, -r * 1.22);
  c.closePath(); c.fill();
  beastEye(c, -r * 0.55, -r * 1.08, r * 0.08);
  c.restore();
}

function drawBeastHippo(c, r, t, body, dark, telegraph) {
  const open = telegraph ? 0.25 : 0.08 + Math.sin(t * 2) * 0.04;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, 0, r * 1.15, r * 0.78, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.95, r * 0.1, r * 0.55, r * 0.42, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.ellipse(-r * 1.25, r * 0.2 + open * r, r * 0.4, r * 0.18, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff';
  c.fillRect(-r * 1.35, r * 0.05, r * 0.1, r * 0.18);
  c.fillRect(-r * 1.15, r * 0.05, r * 0.1, r * 0.18);
  beastEye(c, -r * 0.85, -r * 0.2, r * 0.1);
}

function drawBeastRhino(c, r, t, body, dark, telegraph) {
  const charge = telegraph ? -0.12 : Math.sin(t * 3) * 0.02;
  c.save(); c.rotate(charge);
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.05, r * 1.15, r * 0.7, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.95, -r * 0.1, r * 0.5, r * 0.45, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-r * 1.25, -r * 0.15); c.lineTo(-r * 1.75, -r * 0.55); c.lineTo(-r * 1.15, r * 0.05);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(-r * 1.05, -r * 0.35); c.lineTo(-r * 1.25, -r * 0.7); c.lineTo(-r * 0.9, -r * 0.3);
  c.closePath(); c.fill();
  beastEye(c, -r * 1.0, -r * 0.25, r * 0.1);
  c.restore();
}

function drawBeastGorilla(c, r, t, body, dark, telegraph) {
  const raise = telegraph ? -r * 0.2 : Math.sin(t * 2.5) * r * 0.03;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.15 + raise * 0.3, r * 0.95, r * 0.85, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(0, -r * 0.55 + raise, r * 0.5, 0, TAU); c.fill();
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(0, -r * 0.35 + raise, r * 0.35, r * 0.32, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (const sx of [-1, 1]) {
    c.beginPath(); c.ellipse(sx * r * 0.95, r * 0.25 + raise * 0.5, r * 0.35, r * 0.55, sx * 0.25, 0, TAU); c.fill();
  }
  beastEye(c, -r * 0.15, -r * 0.55 + raise, r * 0.1);
  beastEye(c, r * 0.15, -r * 0.55 + raise, r * 0.1);
}

function drawBeastZebra(c, r, t, body, dark) {
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.1, r * 1.05, r * 0.55, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.95, -r * 0.3, r * 0.4, r * 0.5, -0.3, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (let i = 0; i < 6; i++) {
    const x = -r * 0.7 + i * r * 0.28;
    c.beginPath();
    c.moveTo(x, -r * 0.35); c.lineTo(x + r * 0.1, r * 0.55); c.lineTo(x + r * 0.2, -r * 0.35);
    c.closePath(); c.fill();
  }
  c.beginPath();
  c.moveTo(-r * 1.05, -r * 0.7); c.lineTo(-r * 1.0, -r * 1.15); c.lineTo(-r * 0.8, -r * 0.7);
  c.closePath(); c.fill();
  c.strokeStyle = dark; c.lineWidth = Math.max(2, r * 0.12); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(r * 0.9, 0);
  c.quadraticCurveTo(r * 1.35, -r * 0.2 + Math.sin(t * 6) * 3, r * 1.25, r * 0.2);
  c.stroke();
  beastEye(c, -r * 1.05, -r * 0.4, r * 0.09);
}

function drawBeastBear(c, r, t, body, dark, telegraph) {
  const up = telegraph ? -r * 0.12 : 0;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.1 + up * 0.3, r * 1.0, r * 0.8, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 0.15, -r * 0.45 + up, r * 0.55, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.arc(-r * 0.5, -r * 0.85 + up, r * 0.2, 0, TAU); c.fill();
  c.beginPath(); c.arc(r * 0.2, -r * 0.85 + up, r * 0.2, 0, TAU); c.fill();
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(-r * 0.15, -r * 0.25 + up, r * 0.28, r * 0.22, 0, 0, TAU); c.fill();
  for (const sx of [-1, 1]) {
    c.fillStyle = body;
    c.beginPath(); c.ellipse(sx * r * 0.95, r * 0.15 + up * 0.4, r * 0.32, r * 0.48, sx * 0.2, 0, TAU); c.fill();
  }
  beastEye(c, -r * 0.35, -r * 0.55 + up, r * 0.1);
  beastEye(c, r * 0.05, -r * 0.55 + up, r * 0.1);
}

function drawBeastCroc(c, r, t, body, dark) {
  const wag = Math.sin(t * 4) * 0.06;
  c.save(); c.rotate(wag);
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, 0, r * 1.25, r * 0.48, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 1.15, 0, r * 0.55, r * 0.32, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  for (let i = 0; i < 5; i++) {
    const x = -r * 0.6 + i * r * 0.3;
    c.beginPath();
    c.moveTo(x, -r * 0.35); c.lineTo(x + r * 0.08, -r * 0.55); c.lineTo(x + r * 0.16, -r * 0.35);
    c.closePath(); c.fill();
  }
  c.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    c.fillRect(-r * 1.45 + i * r * 0.14, -r * 0.05, r * 0.08, r * 0.12);
  }
  c.strokeStyle = body; c.lineWidth = Math.max(3, r * 0.2); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(r * 1.1, 0);
  c.quadraticCurveTo(r * 1.6, Math.sin(t * 5) * r * 0.15, r * 1.85, 0);
  c.stroke();
  beastEye(c, -r * 1.2, -r * 0.15, r * 0.1);
  c.restore();
}

function drawBeastKangaroo(c, r, t, body, dark, telegraph) {
  const hop = telegraph ? -r * 0.15 : Math.sin(t * 6) * r * 0.05;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0.1 * r, r * 0.15 + hop, r * 0.7, r * 0.85, 0.15, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.35, -r * 0.55 + hop, r * 0.4, r * 0.38, -0.2, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-r * 0.45, -r * 0.85 + hop); c.lineTo(-r * 0.55, -r * 1.25 + hop); c.lineTo(-r * 0.25, -r * 0.85 + hop);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(-r * 0.2, -r * 0.85 + hop); c.lineTo(-r * 0.15, -r * 1.22 + hop); c.lineTo(0, -r * 0.85 + hop);
  c.closePath(); c.fill();
  c.fillStyle = '#ffe9c9';
  c.beginPath(); c.ellipse(0.15 * r, r * 0.35 + hop, r * 0.28, r * 0.32, 0, 0, TAU); c.fill();
  c.strokeStyle = body; c.lineWidth = Math.max(3, r * 0.18); c.lineCap = 'round';
  c.beginPath();
  c.moveTo(r * 0.45, r * 0.4 + hop);
  c.quadraticCurveTo(r * 1.0, r * 0.7 + hop, r * 0.85, r * 1.0 + hop);
  c.stroke();
  beastEye(c, -r * 0.45, -r * 0.6 + hop, r * 0.09);
}

function drawBeastPanda(c, r, t, body, dark) {
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.2, r * 0.95, r * 0.8, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(0, -r * 0.4, r * 0.55, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.arc(-r * 0.4, -r * 0.85, r * 0.22, 0, TAU); c.fill();
  c.beginPath(); c.arc(r * 0.4, -r * 0.85, r * 0.22, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.22, -r * 0.45, r * 0.2, r * 0.16, -0.3, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(r * 0.22, -r * 0.45, r * 0.2, r * 0.16, 0.3, 0, TAU); c.fill();
  for (const sx of [-1, 1]) {
    c.beginPath(); c.ellipse(sx * r * 0.85, r * 0.25, r * 0.28, r * 0.4, sx * 0.25, 0, TAU); c.fill();
  }
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(-r * 0.22, -r * 0.45, r * 0.08, 0, TAU); c.fill();
  c.beginPath(); c.arc(r * 0.22, -r * 0.45, r * 0.08, 0, TAU); c.fill();
  c.fillStyle = '#1a1a2a';
  c.beginPath(); c.arc(-r * 0.24, -r * 0.45, r * 0.04, 0, TAU); c.fill();
  c.beginPath(); c.arc(r * 0.2, -r * 0.45, r * 0.04, 0, TAU); c.fill();
}

function drawBeastFlamingo(c, r, t, body, dark) {
  const bob = Math.sin(t * 3) * r * 0.04;
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0.15 * r, r * 0.35 + bob, r * 0.55, r * 0.35, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.15, -r * 0.25 + bob, r * 0.18, r * 0.55, -0.35, 0, TAU); c.fill();
  c.beginPath(); c.arc(-r * 0.45, -r * 0.7 + bob, r * 0.26, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath(); c.moveTo(-r * 0.7, -r * 0.7 + bob); c.lineTo(-r * 1.1, -r * 0.55 + bob); c.lineTo(-r * 0.7, -r * 0.55 + bob); c.closePath(); c.fill();
  c.strokeStyle = '#ffe259'; c.lineWidth = Math.max(2, r * 0.1);
  c.beginPath(); c.moveTo(0, r * 0.55 + bob); c.lineTo(r * 0.1, r * 1.15 + bob); c.stroke();
  beastEye(c, -r * 0.5, -r * 0.75 + bob, r * 0.07);
}

function drawBeastCamel(c, r, t, body, dark) {
  const sway = Math.sin(t * 2.2) * 0.03;
  c.save(); c.rotate(sway);
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, r * 0.2, r * 1.1, r * 0.5, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.15, -r * 0.25, r * 0.4, r * 0.45, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(r * 0.35, -r * 0.15, r * 0.35, r * 0.4, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 0.95, -r * 0.25, r * 0.38, r * 0.48, -0.25, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(-r * 1.25, -r * 0.45, r * 0.32, r * 0.28, 0, 0, TAU); c.fill();
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-r * 1.3, -r * 0.7); c.lineTo(-r * 1.25, -r * 1.05); c.lineTo(-r * 1.1, -r * 0.68);
  c.closePath(); c.fill();
  beastEye(c, -r * 1.3, -r * 0.5, r * 0.09);
  c.restore();
}
