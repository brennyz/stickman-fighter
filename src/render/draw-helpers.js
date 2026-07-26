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
    case 'boemerang': {
      // Klassieke L/V-boemerang (niet speer-achtig); spin roteert in hand & als projectiel.
      c.save();
      c.translate(24, 0);
      c.rotate((spin || 0) * 12);
      c.strokeStyle = '#a86a30';
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-20, -18);
      c.quadraticCurveTo(-6, -20, 0, 0);
      c.quadraticCurveTo(6, 20, 20, 18);
      c.stroke();
      c.strokeStyle = '#e0a868';
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(-16, -14);
      c.quadraticCurveTo(-4, -15, 0, 0);
      c.quadraticCurveTo(4, 15, 16, 14);
      c.stroke();
      c.fillStyle = '#6a4020';
      c.beginPath(); c.arc(0, 0, 3.2, 0, TAU); c.fill();
      c.restore();
      break;
    }
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
  return !!(save.liteFx || Perf.tier >= 2 || motionReduced());
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

/**
 * Pet / egg-pet / summon appear sparkles — rings + sparks + twinkle stars.
 * opts: { color2, big }
 */
function spawnCompanionSparkles(game, x, y, color, opts) {
  if (!game || typeof game.burst !== 'function') return;
  if (motionReduced()) {
    game.burst(x, y, color || '#7cf5ff', 4, { kind: 'spark', size: 2 });
    return;
  }
  opts = opts || {};
  const lite = fxLite();
  const col = color || '#7cf5ff';
  const col2 = opts.color2 || '#ffffff';
  const big = !!opts.big;
  const n = lite ? (big ? 8 : 5) : (big ? 18 : 11);
  game.burst(x, y, col, n, { kind: 'spark', size: big ? 2.6 : 2.1 });
  game.burst(x, y, col2, Math.max(2, Math.ceil(n * 0.4)), { kind: 'spark', size: big ? 2.0 : 1.55 });
  spawnFxRing(game, x, y, col, lite ? 7 : (big ? 16 : 11));
  if (!lite && big) spawnFxRing(game, x, y - 10, col2, 9);
  if (lite || !ensureParticleRoom(game, 3)) return;
  if (!perfFxBudgetAllow(game, 2) || perfFxRoom(game, 'particle') <= 0) return;
  const stars = big ? 7 : 4;
  for (let i = 0; i < stars; i++) {
    if (perfFxRoom(game, 'particle') <= 0) break;
    const a = (i / stars) * TAU + Math.random() * 0.5;
    const sp = 35 + Math.random() * (big ? 70 : 45);
    game.particles.push({
      x: x + Math.cos(a) * 6,
      y: y + Math.sin(a) * 4,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.7 - 55,
      life: 0.32 + Math.random() * 0.22,
      maxLife: 0.55,
      color: i % 2 ? col2 : col,
      size: (big ? 3.2 : 2.6) + Math.random() * 2.2,
      kind: 'star',
      grav: 90,
    });
  }
}

/** Jutsu impact burst — Lite FX capped; scale 'small' for projectile fade-out. */
function spawnJutsuImpactFx(game, x, y, kind, scale) {
  if (!game || motionReduced()) return;
  const sk = skillById(kind);
  const col = sk.color || '#7cf5ff';
  const lite = fxLite();
  const small = scale === 'small';
  const n = lite ? (small ? 4 : 6) : (small ? 8 : 14);
  game.burst(x, y, col, n, { kind: 'spark', size: small ? 2.2 : 2.8 });
  spawnFxRing(game, x, y, col, lite ? 6 : (small ? 8 : 14));
  if (!lite && !small && (sk.behavior === 'pull' || sk.behavior === 'meteor')) {
    game.burst(x, y, '#ff6b9d', 6);
  }
  if (!lite && !small && (kind === 'rasengan' || sk.behavior === 'orb')) {
    spawnFxRing(game, x, y, '#ffffff', 10);
  }
  if (!lite && !small && (kind === 'chidori' || sk.behavior === 'dash')) {
    game.burst(x, y, '#e8f7ff', 8, { kind: 'spark', size: 1.8 });
  }
}

/**
 * Hand-charge aura while winding up a jutsu (Rasengan spiral / Chidori crackle).
 * g = charge progress 0..1, animT = fighter anim clock.
 */
function drawJutsuChargeAura(c, hx, hy, g, animT, kind) {
  const sk = skillById(kind);
  const behavior = sk.behavior || 'orb';
  const col = sk.color || '#7cf5ff';
  const calm = motionReduced();
  const lite = fxLite() || calm;
  const ox = hx + 14;
  const oy = hy;
  const spin = animT * (8 + g * 20);

  drawJutsuOrb(c, ox, oy, 8 + g * 16, spin, kind, 0.55 + g * 0.45);

  c.save();
  if (behavior === 'dash' || kind === 'chidori') {
    // Chidori — crackling sheath + jagged bolts from the palm
    const halo = c.createRadialGradient(ox, oy, 2, ox, oy, 22 + g * 28);
    halo.addColorStop(0, `rgba(232,247,255,${0.35 + g * 0.4})`);
    halo.addColorStop(0.45, `rgba(168,224,255,${0.22 + g * 0.28})`);
    halo.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(ox, oy, 22 + g * 28, 0, TAU);
    c.fill();

    c.lineCap = 'round';
    c.lineJoin = 'round';
    const bolts = lite ? 4 : 8;
    for (let i = 0; i < bolts; i++) {
      const a = animT * (12 + g * 10) + i * (TAU / bolts);
      const len = 14 + g * 26 + (calm ? 0 : Math.sin(animT * 28 + i) * 4);
      c.strokeStyle = i % 2
        ? `rgba(255,255,255,${0.45 + g * 0.4})`
        : `rgba(168,224,255,${0.35 + g * 0.45})`;
      c.lineWidth = i % 2 ? 1.4 : 2.2;
      c.beginPath();
      c.moveTo(ox + Math.cos(a) * 4, oy + Math.sin(a) * 3);
      const mx = ox + Math.cos(a + 0.35) * len * 0.55;
      const my = oy + Math.sin(a + 0.35) * len * 0.45 + (calm ? 0 : Math.sin(animT * 40 + i * 2) * 3);
      c.lineTo(mx, my);
      c.lineTo(ox + Math.cos(a + 0.15) * len, oy + Math.sin(a) * len * 0.55);
      c.stroke();
    }
    if (!lite) {
      c.strokeStyle = `rgba(200,240,255,${0.25 + g * 0.35})`;
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const a = animT * 16 + i * 2.1;
        c.beginPath();
        c.moveTo(hx + 4, hy - 2);
        c.quadraticCurveTo(
          hx + 8 + Math.cos(a) * 10,
          hy - 8 + Math.sin(a * 1.3) * 6,
          ox + Math.cos(a) * (10 + g * 8),
          oy + Math.sin(a) * (6 + g * 6)
        );
        c.stroke();
      }
    }
  } else if (behavior === 'pull' || behavior === 'meteor' || kind === 'rinnegan') {
    c.strokeStyle = `rgba(196,122,255,${0.4 + g * 0.45})`;
    c.lineWidth = 2;
    for (let ring = 0; ring < (lite ? 2 : 3); ring++) {
      c.beginPath();
      c.arc(ox, oy, 10 + g * 16 + ring * 4, animT * (6 + ring), animT * (6 + ring) + Math.PI * 1.1);
      c.stroke();
    }
    c.fillStyle = `rgba(255,100,140,${0.35 + g * 0.4})`;
    for (let i = 0; i < 3; i++) {
      const a = animT * 8 + i * (TAU / 3);
      c.beginPath();
      c.arc(ox + Math.cos(a) * (8 + g * 12), oy + Math.sin(a) * (8 + g * 10), 2.5 + g * 2, 0, TAU);
      c.fill();
    }
  } else {
    // Rasengan — cyan halo + orbiting motes + spiral rings
    const halo = c.createRadialGradient(ox, oy, 2, ox, oy, 20 + g * 26);
    halo.addColorStop(0, `rgba(255,255,255,${0.4 + g * 0.35})`);
    halo.addColorStop(0.4, `rgba(124,245,255,${0.28 + g * 0.32})`);
    halo.addColorStop(1, 'rgba(80,180,220,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(ox, oy, 20 + g * 26, 0, TAU);
    c.fill();

    c.strokeStyle = `rgba(124,245,255,${0.35 + g * 0.4})`;
    c.lineWidth = lite ? 1.6 : 2.2;
    c.lineCap = 'round';
    const spirals = lite ? 2 : 4;
    for (let i = 0; i < spirals; i++) {
      const a0 = spin * (0.35 + i * 0.12) + i * 0.9;
      c.beginPath();
      c.arc(ox, oy, 9 + g * 10 + i * 3.5, a0, a0 + Math.PI * (1.1 + g * 0.35));
      c.stroke();
    }

    c.fillStyle = `rgba(124,245,255,${0.3 + g * 0.4})`;
    const motes = lite ? 4 : 7;
    for (let i = 0; i < motes; i++) {
      const a = animT * (10 + g * 6) + i * (TAU / motes);
      const rr = 10 + g * 14 + (i % 3) * 2;
      const mx = ox + Math.cos(a) * rr;
      const my = oy + Math.sin(a) * (6 + g * 8) * (0.85 + (i % 2) * 0.2);
      c.beginPath();
      c.arc(mx, my, 1.6 + g * 2.2, 0, TAU);
      c.fill();
      if (!lite) {
        c.fillStyle = `rgba(255,255,255,${0.2 + g * 0.25})`;
        c.beginPath();
        c.arc(mx - Math.cos(a) * 3, my - Math.sin(a) * 2, 1 + g, 0, TAU);
        c.fill();
        c.fillStyle = `rgba(124,245,255,${0.3 + g * 0.4})`;
      }
    }
  }
  c.restore();
}

function drawJutsuOrb(c, x, y, r, spin, kind, alpha) {
  const sk = skillById(kind);
  const behavior = sk.behavior || 'orb';
  const col = sk.color || '#7cf5ff';
  const lite = fxLite();
  const calm = motionReduced();
  c.save();
  c.translate(x, y);
  c.globalAlpha = alpha == null ? 1 : alpha;
  if (behavior === 'dash') {
    c.shadowColor = col; c.shadowBlur = lite ? 8 : 20;
    const core = c.createRadialGradient(0, 0, 0, 0, 0, r);
    core.addColorStop(0, 'rgba(255,255,255,.95)');
    core.addColorStop(0.35, col.length === 7 ? col + 'cc' : 'rgba(200,240,255,.8)');
    core.addColorStop(1, col.length === 7 ? col + '22' : 'rgba(120,180,255,.15)');
    c.fillStyle = core;
    c.beginPath(); c.arc(0, 0, r * 0.95, 0, TAU); c.fill();
    c.strokeStyle = '#e8f7ff'; c.lineWidth = 2;
    c.lineCap = 'round';
    const bolts = lite ? 4 : 9;
    for (let i = 0; i < bolts; i++) {
      const a = spin + i * (TAU / bolts);
      const jagged = calm ? 0 : Math.sin(spin * 6 + i * 2.3) * 0.18;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15);
      c.lineTo(
        Math.cos(a + 0.25 + jagged) * r * 0.75,
        Math.sin(a + 0.25 + jagged) * r * 0.75
      );
      c.lineTo(Math.cos(a + 0.45) * r * 1.35, Math.sin(a + 0.45) * r * 1.35);
      c.stroke();
    }
    if (!lite) {
      c.strokeStyle = 'rgba(255,255,255,.55)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(0, 0, r * 1.18, spin * 1.4, spin * 1.4 + Math.PI * 1.2);
      c.stroke();
    }
  } else if (behavior === 'beam' || behavior === 'disc') {
    c.shadowColor = col; c.shadowBlur = lite ? 8 : 16;
    c.fillStyle = col;
    c.globalAlpha = (alpha == null ? 1 : alpha) * 0.75;
    c.beginPath(); c.ellipse(0, 0, r * 1.35, r * (behavior === 'disc' ? 0.55 : 0.75), spin * 0.2, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, r * 1.2, r * (behavior === 'disc' ? 0.45 : 0.65), spin * 0.2, 0, TAU); c.stroke();
  } else if (behavior === 'pull' || behavior === 'meteor') {
    c.shadowColor = col; c.shadowBlur = lite ? 10 : 24;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, col + 'ee');
    grd.addColorStop(0.5, col + '99');
    grd.addColorStop(1, col + '22');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,120,160,.85)'; c.lineWidth = 2;
    for (let ring = 0; ring < (lite ? 2 : 4); ring++) {
      c.beginPath();
      c.arc(0, 0, r * (0.35 + ring * 0.18), spin * (1 + ring * 0.2), spin * (1 + ring * 0.2) + Math.PI * 1.35);
      c.stroke();
    }
    if (kind === 'rinnegan') {
      c.fillStyle = 'rgba(255,90,120,.9)';
      const tomoe = lite ? 3 : 6;
      for (let i = 0; i < tomoe; i++) {
        const a = spin * 2 + i * (TAU / tomoe);
        c.beginPath();
        c.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.12, 0, TAU);
        c.fill();
      }
    }
  } else {
    c.shadowColor = col; c.shadowBlur = lite ? 8 : 24;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(255,255,255,.95)');
    grd.addColorStop(0.35, col + 'dd');
    grd.addColorStop(0.7, col + '88');
    grd.addColorStop(1, col + '18');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = 2;
    const ellipses = lite ? 2 : 6;
    for (let i = 0; i < ellipses; i++) {
      const a0 = spin + i * 0.95;
      c.beginPath();
      c.ellipse(0, 0, r * 0.95, r * (0.32 + (i % 3) * 0.11), a0, 0, TAU);
      c.stroke();
    }
    // Inner spiral ribbon (Rasengan signature)
    if (!lite) {
      c.strokeStyle = 'rgba(255,255,255,.55)';
      c.lineWidth = 1.5;
      c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        const a = spin * 1.6 + t * Math.PI * 3.2;
        const rr = r * (0.12 + t * 0.78);
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr * 0.72;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }
    c.strokeStyle = col;
    c.lineWidth = lite ? 2 : 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, r * 1.14, spin, spin + Math.PI * 1.35);
    c.stroke();
    if (!lite && !calm) {
      c.strokeStyle = 'rgba(255,255,255,.4)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, 0, r * 1.28, -spin * 0.8, -spin * 0.8 + Math.PI * 0.9);
      c.stroke();
    }
  }
  c.restore();
}

/**
 * d20 #19 — Chunky pixel joystick outer ring (forgotten gap vs smooth arcs).
 */
function drawPixelJoyRing(c, cx, cy, r, color, alpha, thickness) {
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const a0 = c.globalAlpha;
  c.globalAlpha = (alpha == null ? 1 : alpha) * a0;
  const chunk = Math.max(2, Math.round(r / 14));
  const thick = Math.max(chunk, Math.round(thickness || chunk * 1.5));
  const n = Math.max(20, Math.round(r * 1.35));
  c.fillStyle = color || '#fff';
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU;
    for (let t = 0; t < thick; t += chunk) {
      const rr = r - t;
      const x = Math.round(cx + Math.cos(ang) * rr);
      const y = Math.round(cy + Math.sin(ang) * rr);
      c.fillRect(x - (chunk >> 1), y - (chunk >> 1), chunk, chunk);
    }
  }
  const tick = Math.max(chunk + 1, Math.round(r * 0.12));
  const inset = r - thick;
  c.fillRect(Math.round(cx - (chunk >> 1)), Math.round(cy - r - 1), chunk, tick);
  c.fillRect(Math.round(cx - (chunk >> 1)), Math.round(cy + inset), chunk, tick);
  c.fillRect(Math.round(cx - r - 1), Math.round(cy - (chunk >> 1)), tick, chunk);
  c.fillRect(Math.round(cx + inset), Math.round(cy - (chunk >> 1)), tick, chunk);
  c.globalAlpha = a0;
  c.imageSmoothingEnabled = prev;
}

/** Chunky pixel joystick knob (filled disc). */
function drawPixelJoyKnob(c, cx, cy, r, color, alpha) {
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const a0 = c.globalAlpha;
  c.globalAlpha = (alpha == null ? 1 : alpha) * a0;
  const chunk = Math.max(2, Math.round(r / 5.5));
  const r2 = r * r;
  c.fillStyle = color || '#fff';
  for (let y = -r; y <= r; y += chunk) {
    for (let x = -r; x <= r; x += chunk) {
      if (x * x + y * y <= r2) {
        c.fillRect(Math.round(cx + x - (chunk >> 1)), Math.round(cy + y - (chunk >> 1)), chunk, chunk);
      }
    }
  }
  c.fillStyle = 'rgba(255,255,255,.28)';
  const hr = Math.max(chunk, Math.round(r * 0.35));
  for (let y = -hr; y <= 0; y += chunk) {
    for (let x = -hr; x <= 0; x += chunk) {
      if (x * x + y * y <= hr * hr) {
        c.fillRect(
          Math.round(cx + x - r * 0.25 - (chunk >> 1)),
          Math.round(cy + y - r * 0.25 - (chunk >> 1)),
          chunk, chunk
        );
      }
    }
  }
  c.globalAlpha = a0;
  c.imageSmoothingEnabled = prev;
}

