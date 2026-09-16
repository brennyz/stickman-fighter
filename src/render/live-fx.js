/* ======================== LIVE FX / READY POSE ======================== */
/**
 * Look-only motion. Shared by menu dolls and combat draw.
 * Cheap canvas paths — no particles array, no WebGL, no video.
 * Skip or shrink when motionReduced / fxLite (Android).
 */
const LIVE_FLAME_IDS = {
  vlamzweep: 1, nachtkaars: 1, hellevork: 1, lavalepel: 1, infernoijsje: 1,
  pyroeend: 1, spooktoaster: 1, chiliketting: 1, brimstonebanaan: 1,
  zwavelzeep: 1, asaccordeon: 1, helgitaar: 1, apocalypslepel: 1,
  duiveltrommel: 1,
};
const LIVE_SPARK_IDS = {
  donder: 1, laser: 1, sterkling: 1, kristal: 1, dawnblade: 1, master_sword: 1,
};
const LIVE_FLAME_EFFECTS = {
  burn: 1, popburn: 1, inferno: 1, magma: 1, soapburn: 1, chainburn: 1,
  frostfire: 1, explodepeel: 1, quakboom: 1,
};
/** Tip in weapon-local space (hand at 0,0, blade +x). y offsets sit on the wick, not the shaft. */
const LIVE_TIP = {
  vlamzweep: { x: 60, y: 0 },
  nachtkaars: { x: 36, y: -18 },
  laser: { x: 50, y: 0 },
  donder: { x: 50, y: -4 },
  sterkling: { x: 48, y: 0 },
  kristal: { x: 50, y: 0 },
  hellevork: { x: 52, y: -6 },
  lavalepel: { x: 52, y: -4 },
  pyroeend: { x: 68, y: 6 },
  chiliketting: { x: 54, y: 0 },
  infernoijsje: { x: 48, y: -6 },
  brimstonebanaan: { x: 46, y: -4 },
};

function liveTip(id) {
  return LIVE_TIP[id] || { x: 44, y: 0 };
}

function liveFxQuiet() {
  if (typeof motionReduced === 'function' && motionReduced()) return true;
  return false;
}

function liveFxLite() {
  return liveFxQuiet() || (typeof fxLite === 'function' && fxLite());
}

/** Street Fighter–like guard: weight back, knees bent, hands up — readable at combat scale. */
function applyReadyStance(P, t, opts) {
  if (!P) return P;
  const calm = !!(opts && opts.calm) || liveFxQuiet();
  const breathe = calm ? 0 : Math.sin((t || 0) * 2.15);
  const shift = calm ? 0 : Math.sin((t || 0) * 1.32);
  P.hipY = -40.2 + breathe * 1.7;
  P.lean = 0.18 + shift * 0.045;
  P.headB = breathe * 0.7 + shift * 0.32;
  P.legs = [
    [2.32 + shift * 0.035, 1.78],
    [0.92 - shift * 0.045, 1.28 + breathe * 0.04],
  ];
  P.arms = [
    [2.48, -1.72 + breathe * 0.06],
    [0.28 + breathe * 0.04, -1.42 + shift * 0.045],
  ];
  P.ready = true;
  return P;
}

function weaponLiveKind(w) {
  const base = typeof w === 'string'
    ? (typeof weaponById === 'function' ? weaponById(w) : { id: w })
    : (w || null);
  const id = base && base.id;
  if (!id || id === 'vuist') return null;
  if (LIVE_FLAME_IDS[id] || (base.effect && LIVE_FLAME_EFFECTS[base.effect])) {
    return 'flame';
  }
  if (LIVE_SPARK_IDS[id]) return 'spark';
  if (typeof weaponLightFx === 'function' && weaponLightFx(base)) return 'pulse';
  return null;
}

function weaponLiveColors(w) {
  const base = typeof w === 'string'
    ? (typeof weaponById === 'function' ? weaponById(w) : { id: w })
    : (w || null);
  if (typeof weaponLightFx === 'function') {
    const light = weaponLightFx(base);
    if (light) return [light.color || '#ff8c42', light.color2 || '#ffd75e'];
  }
  return ['#ff6b3f', '#ffd75e'];
}

function drawWeaponFlameTip(c, t, tip, lite, cols) {
  const x = tip.x;
  const y = tip.y;
  const flicker = 0.70 + 0.30 * Math.sin(t * 13.5) + (lite ? 0 : 0.09 * Math.sin(t * 29));
  const wobble = lite ? 0 : Math.sin(t * 21) * 1.4;
  const h = (lite ? 11 : 17) * flicker;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const glow = c.createRadialGradient(x, y - 2, 1, x + wobble * 0.3, y - h * 0.35, h * 0.95);
  glow.addColorStop(0, cols[1] || '#ffd75e');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = lite ? 0.5 : 0.72;
  c.fillStyle = glow;
  c.beginPath();
  c.arc(x + wobble * 0.25, y - h * 0.22, h * 0.72, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = cols[0] || '#ff6b3f';
  c.globalAlpha = lite ? 0.78 : 0.92;
  c.beginPath();
  c.moveTo(x - 3.2, y + 1.4);
  c.quadraticCurveTo(x + wobble + 2.2, y - h * 0.38, x + wobble * 0.6, y - h);
  c.quadraticCurveTo(x + 6.5, y + 0.6, x - 3.2, y + 1.4);
  c.fill();
  c.fillStyle = cols[1] || '#ffd75e';
  c.globalAlpha = 0.95;
  c.beginPath();
  c.moveTo(x - 1.1, y + 0.4);
  c.quadraticCurveTo(x + wobble * 0.5 + 1.2, y - h * 0.32, x + 1.6, y - h * 0.58);
  c.quadraticCurveTo(x + 3.6, y - 0.1, x - 1.1, y + 0.4);
  c.fill();
  if (!lite) {
    c.fillStyle = '#fff6c8';
    c.globalAlpha = 0.85;
    c.beginPath();
    c.arc(x + wobble * 0.2, y - h * 0.22, 1.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawWeaponSparkTip(c, t, tip, lite, cols) {
  if (lite && (Math.sin(t * 11) < 0.15)) return;
  const x = tip.x;
  const y = tip.y;
  const pulse = 0.45 + 0.55 * Math.max(0, Math.sin(t * 16));
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = cols[0] || '#7cf5ff';
  c.globalAlpha = 0.4 + pulse * 0.55;
  c.lineWidth = lite ? 1.2 : 1.8;
  c.beginPath();
  c.moveTo(x - 3, y - 7 * pulse);
  c.lineTo(x + 8, y + 1);
  c.lineTo(x - 2, y + 7 * pulse);
  c.stroke();
  if (!lite) {
    c.strokeStyle = cols[1] || '#fff8d0';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(x, y - 4);
    c.lineTo(x + 10, y);
    c.stroke();
  }
  c.restore();
}

/** Call in weapon local space (hand at 0,0, blade +x) after the silhouette. */
function drawWeaponLiveFx(c, id, spin) {
  if (!c || liveFxQuiet()) return;
  const kind = weaponLiveKind(id);
  if (!kind || kind === 'pulse') return;
  const lite = liveFxLite();
  const cols = weaponLiveColors(id);
  const tip = liveTip(id);
  const t = Number.isFinite(spin) ? spin : 0;
  if (kind === 'flame') drawWeaponFlameTip(c, t, tip, lite, cols);
  else if (kind === 'spark') drawWeaponSparkTip(c, t, tip, lite, cols);
}

function lookClothSway(bones, amp) {
  if (liveFxQuiet()) return 0;
  const a = (amp == null ? 2.6 : amp) * (liveFxLite() ? 0.4 : 1);
  const t = bones && Number.isFinite(bones.animT) ? bones.animT : 0;
  return Math.sin(t * 3.05 + 0.4) * a;
}

const LiveFxApi = {
  ready: applyReadyStance,
  weaponKind: weaponLiveKind,
  drawWeapon: drawWeaponLiveFx,
  clothSway: lookClothSway,
  quiet: liveFxQuiet,
};

if (typeof globalThis !== 'undefined') globalThis.LiveFxApi = LiveFxApi;
