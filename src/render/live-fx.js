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
const LIVE_TIP_X = {
  vlamzweep: 60, nachtkaars: 36, laser: 50, donder: 50, sterkling: 48,
  kristal: 50, hellevork: 52, lavalepel: 52, pyroeend: 68, chiliketting: 54,
};

function liveFxQuiet() {
  if (typeof motionReduced === 'function' && motionReduced()) return true;
  return false;
}

function liveFxLite() {
  return liveFxQuiet() || (typeof fxLite === 'function' && fxLite());
}

/** Street Fighter–like guard: weight back, knees bent, hands up. */
function applyReadyStance(P, t, opts) {
  if (!P) return P;
  const calm = !!(opts && opts.calm) || liveFxQuiet();
  const breathe = calm ? 0 : Math.sin((t || 0) * 2.15);
  const shift = calm ? 0 : Math.sin((t || 0) * 1.32);
  P.hipY = -42.6 + breathe * 1.55;
  P.lean = 0.11 + shift * 0.038;
  P.headB = breathe * 0.75 + shift * 0.28;
  P.legs = [
    [2.02 + shift * 0.03, 1.86],
    [1.20 - shift * 0.04, 1.46 + breathe * 0.03],
  ];
  P.arms = [
    [2.22, -1.42 + breathe * 0.05],
    [0.70 + breathe * 0.035, -0.92 + shift * 0.03],
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

function drawWeaponFlameTip(c, t, tipX, lite, cols) {
  const flicker = 0.72 + 0.28 * Math.sin(t * 13.5) + (lite ? 0 : 0.07 * Math.sin(t * 29));
  const h = (lite ? 7 : 11) * flicker;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = cols[0] || '#ff6b3f';
  c.globalAlpha = lite ? 0.7 : 0.88;
  c.beginPath();
  c.moveTo(tipX - 2.4, 1.2);
  c.quadraticCurveTo(tipX + 3, -h * 0.35, tipX + h * 0.2, -h);
  c.quadraticCurveTo(tipX + 7, 0.4, tipX - 2.4, 1.2);
  c.fill();
  c.fillStyle = cols[1] || '#ffd75e';
  c.globalAlpha = 0.9;
  c.beginPath();
  c.moveTo(tipX - 0.6, 0.4);
  c.quadraticCurveTo(tipX + 1.4, -h * 0.28, tipX + 2.2, -h * 0.52);
  c.quadraticCurveTo(tipX + 3.2, -0.2, tipX - 0.6, 0.4);
  c.fill();
  c.restore();
}

function drawWeaponSparkTip(c, t, tipX, lite, cols) {
  if (lite && (Math.sin(t * 11) < 0.15)) return;
  const pulse = 0.45 + 0.55 * Math.max(0, Math.sin(t * 16));
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = cols[0] || '#7cf5ff';
  c.globalAlpha = 0.35 + pulse * 0.5;
  c.lineWidth = lite ? 1.1 : 1.6;
  c.beginPath();
  c.moveTo(tipX - 2, -5 * pulse);
  c.lineTo(tipX + 6, 1);
  c.lineTo(tipX - 1, 5 * pulse);
  c.stroke();
  if (!lite) {
    c.strokeStyle = cols[1] || '#fff8d0';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(tipX, -3);
    c.lineTo(tipX + 8, 0);
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
  const tip = LIVE_TIP_X[id] || 44;
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
