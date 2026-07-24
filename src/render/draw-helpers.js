/* ============================ TEKENHULPEN ============================== */
function seg(x, y, ang, len) { return [x + Math.cos(ang) * len, y + Math.sin(ang) * len]; }

function drawWeaponShape(c, id, spin, moveIdx) {
  // getekend langs +x vanaf de hand (0,0); c is al getransleerd/geroteerd
  c.lineCap = 'round';
  const mi = ((moveIdx || 0) % 3 + 3) % 3;
  if (mi) {
    c.save();
    if (mi === 1) c.rotate(0.22);
    else if (mi === 2) c.rotate(-0.12);
  }
  switch (id) {
    case 'zwaard':
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, 0); c.lineTo(46, 0); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(8, -1); c.lineTo(42, -1); c.stroke();
      c.strokeStyle = '#a67c2e'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, -7); c.lineTo(4, 7); c.stroke();
      break;
    case 'master_sword':
      c.save();
      c.shadowColor = '#6fd7ff'; c.shadowBlur = 16;
      c.strokeStyle = '#3a9fd4'; c.lineWidth = 6; c.beginPath(); c.moveTo(6, 0); c.lineTo(64, 0); c.stroke();
      c.strokeStyle = '#e8f8ff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(12, -1.5); c.lineTo(60, -1.5); c.stroke();
      c.strokeStyle = 'rgba(180,235,255,.55)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(12, 1.5); c.lineTo(60, 1.5); c.stroke();
      c.restore();
      c.fillStyle = '#ffd75e'; c.fillRect(0, -9, 11, 18);
      c.strokeStyle = '#c97a20'; c.lineWidth = 2; c.strokeRect(0, -9, 11, 18);
      c.fillStyle = '#6a4a9a'; c.fillRect(-7, -6, 9, 12);
      c.fillStyle = '#8a6030';
      c.beginPath(); c.moveTo(5.5, -3); c.lineTo(3.5, 1); c.lineTo(7.5, 1); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(5.5, 2.5); c.lineTo(2.5, 7); c.lineTo(8.5, 7); c.closePath(); c.fill();
      c.strokeStyle = '#4db8ff'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(11, -12); c.lineTo(11, 12); c.stroke();
      break;
    case 'kunai':
      c.strokeStyle = '#7a8494'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(34, 0); c.stroke();
      c.fillStyle = '#c9d6e8';
      c.beginPath(); c.moveTo(34, -7); c.lineTo(52, 0); c.lineTo(34, 7); c.closePath(); c.fill();
      c.strokeStyle = '#a67c2e'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, -5); c.lineTo(8, 5); c.stroke();
      c.beginPath(); c.arc(2, 0, 3, 0, TAU); c.stroke();
      break;
    case 'shuriken': {
      const rot = spin * 18;
      c.save(); c.translate(28, 0); c.rotate(rot);
      c.fillStyle = '#b8c4d4';
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(4, -4); c.lineTo(16, 0); c.lineTo(4, 4); c.closePath(); c.fill();
      }
      c.fillStyle = '#5a6784'; c.beginPath(); c.arc(0, 0, 3.5, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'knuppel':
      c.strokeStyle = '#8a5a30'; c.lineWidth = 6; c.beginPath(); c.moveTo(2, 0); c.lineTo(22, 0); c.stroke();
      c.lineWidth = 11; c.beginPath(); c.moveTo(22, 0); c.lineTo(40, 0); c.stroke();
      break;
    case 'speer':
      c.strokeStyle = '#a3763f'; c.lineWidth = 4; c.beginPath(); c.moveTo(-14, 0); c.lineTo(58, 0); c.stroke();
      c.fillStyle = '#c9d6e8'; c.beginPath(); c.moveTo(58, -6); c.lineTo(74, 0); c.lineTo(58, 6); c.closePath(); c.fill();
      break;
    case 'nunchaku': {
      c.strokeStyle = '#4a3520'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(22, 0); c.stroke();
      const a = 0.7 + Math.sin(spin * 14) * 1.1;
      const [jx, jy] = seg(22, 0, 0, 7);
      c.strokeStyle = '#889'; c.lineWidth = 1.5;
      const [ex, ey] = seg(jx, jy, a, 9);
      c.beginPath(); c.moveTo(jx, jy); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = '#4a3520'; c.lineWidth = 5;
      const [fx, fy] = seg(ex, ey, a, 22);
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(fx, fy); c.stroke();
      break;
    }
    case 'hamer':
      c.strokeStyle = '#7a5c34'; c.lineWidth = 5; c.beginPath(); c.moveTo(2, 0); c.lineTo(40, 0); c.stroke();
      c.fillStyle = '#6d7787'; c.fillRect(34, -12, 16, 24);
      c.fillStyle = '#8f9aab'; c.fillRect(34, -12, 16, 6);
      break;
    case 'laser':
      c.save();
      c.shadowColor = '#4ff3ff'; c.shadowBlur = 12;
      c.strokeStyle = '#4ff3ff'; c.lineWidth = 6; c.beginPath(); c.moveTo(6, 0); c.lineTo(50, 0); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(6, 0); c.lineTo(50, 0); c.stroke();
      c.restore();
      c.strokeStyle = '#39404f'; c.lineWidth = 6; c.beginPath(); c.moveTo(-4, 0); c.lineTo(6, 0); c.stroke();
      break;
    case 'boemerang':
      c.strokeStyle = '#c98850'; c.lineWidth = 5;
      c.beginPath(); c.arc(22, 0, 18, -2.2, 0.5); c.stroke();
      c.beginPath(); c.arc(22, 0, 10, -2.0, 0.3); c.stroke();
      break;
    case 'ketting':
      c.strokeStyle = '#8899aa'; c.lineWidth = 3;
      for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(8 + i * 10, Math.sin(i + spin * 8) * 2, 4, 0, TAU); c.stroke(); }
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 5; c.beginPath(); c.moveTo(52, -2); c.lineTo(68, 0); c.lineTo(52, 2); c.stroke();
      break;
    case 'donder':
      c.strokeStyle = '#7a5c34'; c.lineWidth = 6; c.beginPath(); c.moveTo(2, 0); c.lineTo(34, 0); c.stroke();
      c.fillStyle = '#ffd75e';
      c.beginPath(); c.moveTo(34, -14); c.lineTo(58, -4); c.lineTo(40, 0); c.lineTo(58, 4); c.lineTo(34, 14); c.lineTo(38, 0); c.closePath(); c.fill();
      break;
    case 'void':
      c.save(); c.shadowColor = '#ff6b9d'; c.shadowBlur = 14;
      c.strokeStyle = '#ff6b9d'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(28, -10); c.lineTo(48, 0); c.lineTo(28, 10); c.closePath(); c.stroke();
      c.fillStyle = 'rgba(90,16,64,.7)'; c.fill();
      c.restore();
      break;
    case 'guvve':
      c.strokeStyle = '#43b25b'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(36, 0); c.stroke();
      c.fillStyle = '#ffe259'; c.beginPath(); c.ellipse(48, 0, 14, 10, 0, 0, TAU); c.fill();
      c.fillStyle = '#222'; c.beginPath(); c.arc(52, -2, 2, 0, TAU); c.fill();
      c.strokeStyle = '#ff8c42'; c.lineWidth = 2; c.beginPath(); c.moveTo(58, 0); c.lineTo(68, 2); c.stroke();
      break;
    case 'tanto':
      c.strokeStyle = '#6a7484'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(28, 0); c.stroke();
      c.fillStyle = '#dce4f0';
      c.beginPath(); c.moveTo(28, -5); c.lineTo(44, 0); c.lineTo(28, 5); c.closePath(); c.fill();
      c.strokeStyle = '#8a6030'; c.lineWidth = 3; c.beginPath(); c.moveTo(4, -5); c.lineTo(4, 5); c.stroke();
      break;
    case 'sai':
      c.strokeStyle = '#a8b4c4'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(40, 0); c.stroke();
      c.beginPath(); c.moveTo(10, 0); c.lineTo(22, -10); c.stroke();
      c.beginPath(); c.moveTo(10, 0); c.lineTo(22, 10); c.stroke();
      c.fillStyle = '#c9d6e8'; c.beginPath(); c.moveTo(40, -4); c.lineTo(50, 0); c.lineTo(40, 4); c.closePath(); c.fill();
      break;
    case 'waaier': {
      c.save();
      const open = 0.55 + Math.sin(spin * 6) * 0.12;
      for (let i = -3; i <= 3; i++) {
        const a = i * 0.22 * open;
        c.strokeStyle = i === 0 ? '#e8c98a' : '#c97a20';
        c.lineWidth = i === 0 ? 3 : 2;
        c.beginPath(); c.moveTo(4, 0); c.lineTo(4 + Math.cos(a) * 38, Math.sin(a) * 38); c.stroke();
      }
      c.fillStyle = 'rgba(255,215,94,.25)';
      c.beginPath(); c.moveTo(4, 0);
      c.arc(4, 0, 36, -0.7 * open, 0.7 * open);
      c.closePath(); c.fill();
      c.restore();
      break;
    }
    case 'tonfa':
      c.strokeStyle = '#5a4030'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(42, 0); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(12, 0); c.lineTo(12, 14); c.stroke();
      break;
    case 'kama':
      c.strokeStyle = '#6a5030'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(34, 0); c.stroke();
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 3.5;
      c.beginPath(); c.arc(34, -2, 14, -0.2, 2.4); c.stroke();
      break;
    case 'zeis':
      c.strokeStyle = '#3a3048'; c.lineWidth = 4; c.beginPath(); c.moveTo(-8, 0); c.lineTo(48, 0); c.stroke();
      c.strokeStyle = '#b06ae0'; c.lineWidth = 4;
      c.beginPath(); c.arc(48, -6, 18, -0.4, 2.6); c.stroke();
      c.strokeStyle = '#e0c0ff'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(48, -6, 14, -0.2, 2.4); c.stroke();
      break;
    case 'drietand':
      c.strokeStyle = '#7a8494'; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, 0); c.lineTo(50, 0); c.stroke();
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(50, 0); c.lineTo(66, 0); c.stroke();
      c.beginPath(); c.moveTo(50, 0); c.lineTo(62, -10); c.stroke();
      c.beginPath(); c.moveTo(50, 0); c.lineTo(62, 10); c.stroke();
      break;
    case 'bostaf':
      c.strokeStyle = '#8a6030'; c.lineWidth = 5; c.beginPath(); c.moveTo(-20, 0); c.lineTo(58, 0); c.stroke();
      c.strokeStyle = '#c9a66b'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-16, -4); c.lineTo(-16, 4); c.stroke();
      c.beginPath(); c.moveTo(54, -4); c.lineTo(54, 4); c.stroke();
      break;
    case 'fuuma': {
      const rot = spin * 14;
      c.save(); c.translate(30, 0); c.rotate(rot);
      c.fillStyle = '#9aa8bc';
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(6, -7); c.lineTo(22, 0); c.lineTo(6, 7); c.closePath(); c.fill();
      }
      c.fillStyle = '#3a4560'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'kristal':
      c.save(); c.shadowColor = '#7cf5ff'; c.shadowBlur = 10;
      c.fillStyle = 'rgba(124,245,255,.55)';
      c.beginPath(); c.moveTo(8, 0); c.lineTo(28, -10); c.lineTo(52, 0); c.lineTo(28, 10); c.closePath(); c.fill();
      c.strokeStyle = '#e8ffff'; c.lineWidth = 2; c.stroke();
      c.restore();
      c.strokeStyle = '#5a6784'; c.lineWidth = 5; c.beginPath(); c.moveTo(-2, 0); c.lineTo(8, 0); c.stroke();
      break;
    case 'vlamzweep': {
      c.strokeStyle = '#5a3020'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(14, 0); c.stroke();
      c.save(); c.shadowColor = '#ff8c42'; c.shadowBlur = 10;
      c.strokeStyle = '#ff6b3f'; c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(14, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(14 + i * 8, Math.sin(spin * 10 + i) * 6);
      }
      c.stroke();
      c.strokeStyle = '#ffd75e'; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(14, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(14 + i * 8, Math.sin(spin * 10 + i + 0.4) * 3);
      }
      c.stroke();
      c.restore();
      break;
    }
    case 'sterkling':
      c.save(); c.shadowColor = '#ffd75e'; c.shadowBlur = 12;
      c.strokeStyle = '#ffd75e'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, 0); c.lineTo(50, 0); c.stroke();
      c.strokeStyle = '#fff8d0'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, -1); c.lineTo(46, -1); c.stroke();
      c.restore();
      c.fillStyle = '#c97a20';
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * TAU / 5;
        const r = i % 2 === 0 ? 7 : 3;
        const x = 10 + Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath(); c.fill();
      break;
  }
  if (mi) c.restore();
}

function fxLite() {
  return !!(save.liteFx || Perf.tier >= 2 || (typeof motionReduced === 'function' && motionReduced()));
}

function ensureParticleRoom(game, slots) {
  if (!game || slots <= 0) return true;
  const cap = fxCaps();
  let room = cap.particles - game.particles.length;
  if (room >= slots) return true;
  let need = slots - room;
  for (let i = 0; i < game.particles.length && need > 0; ) {
    const p = game.particles[i];
    if (p.kind === 'ring') { i++; continue; }
    game.particles.splice(i, 1);
    need--;
    room++;
  }
  return room >= slots;
}

function spawnFxRing(game, x, y, color, baseR) {
  if (!game || motionReduced()) return;
  if (!perfFxBudgetAllow(game, 1) || perfFxRoom(game, 'particle') <= 0) return;
  if (!ensureParticleRoom(game, 1)) return;
  const lite = fxLite();
  const life = lite ? 0.22 : 0.34;
  const size = (baseR || 12) * (lite ? 0.62 : 1);
  game.particles.push({
    x, y, vx: 0, vy: 0, life, maxLife: life,
    color: color || '#7cf5ff',
    size,
    kind: 'ring',
    grav: 0,
  });
}

function drawJutsuOrb(c, x, y, r, spin, kind, alpha) {
  const lite = fxLite();
  c.save();
  c.translate(x, y);
  c.globalAlpha = alpha == null ? 1 : alpha;
  if (kind === 'chidori') {
    c.shadowColor = '#a8e0ff'; c.shadowBlur = lite ? 8 : 18;
    c.fillStyle = 'rgba(200,240,255,.55)';
    c.beginPath(); c.arc(0, 0, r * 0.9, 0, TAU); c.fill();
    c.strokeStyle = '#e8f7ff'; c.lineWidth = 2;
    const bolts = lite ? 4 : 7;
    for (let i = 0; i < bolts; i++) {
      const a = spin + i * (TAU / bolts);
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      c.lineTo(Math.cos(a + 0.4) * r * 1.3, Math.sin(a + 0.4) * r * 1.3);
      c.stroke();
    }
  } else if (kind === 'rinnegan') {
    c.shadowColor = '#c47aff'; c.shadowBlur = lite ? 10 : 24;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(40,10,60,.95)');
    grd.addColorStop(0.35, 'rgba(120,40,180,.85)');
    grd.addColorStop(0.7, 'rgba(200,80,255,.45)');
    grd.addColorStop(1, 'rgba(80,20,120,.1)');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,120,160,.85)'; c.lineWidth = 2;
    for (let ring = 0; ring < (lite ? 2 : 4); ring++) {
      c.beginPath();
      c.arc(0, 0, r * (0.35 + ring * 0.18), spin * (1 + ring * 0.2), spin * (1 + ring * 0.2) + Math.PI * 1.35);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,90,120,.9)';
    const tomoe = lite ? 3 : 6;
    for (let i = 0; i < tomoe; i++) {
      const a = spin * 2 + i * (TAU / tomoe);
      c.beginPath();
      c.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.12, 0, TAU);
      c.fill();
    }
  } else {
    // Rasengan: chakra-bol + draaiende buitenringen
    c.shadowColor = '#3db8ff'; c.shadowBlur = lite ? 8 : 22;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(220,250,255,.95)');
    grd.addColorStop(0.45, 'rgba(80,190,255,.75)');
    grd.addColorStop(1, 'rgba(30,120,255,.15)');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(180,235,255,.9)'; c.lineWidth = 2;
    const ellipses = lite ? 2 : 5;
    for (let i = 0; i < ellipses; i++) {
      const a0 = spin + i * 1.1;
      c.beginPath();
      c.ellipse(0, 0, r * 0.95, r * (0.35 + (i % 3) * 0.12), a0, 0, TAU);
      c.stroke();
    }
    // Outer chakra arcs (juice) — één boog in Lite FX
    c.strokeStyle = 'rgba(124,245,255,.8)';
    c.lineWidth = lite ? 2 : 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, r * 1.14, spin, spin + Math.PI * 1.35);
    c.stroke();
    if (!lite) {
      c.strokeStyle = 'rgba(160,230,255,.55)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(0, 0, r * 1.28, -spin * 1.35, -spin * 1.35 + Math.PI * 1.05);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.beginPath(); c.arc(-r * 0.2, -r * 0.2, r * 0.18, 0, TAU); c.fill();
  }
  c.restore();
}

