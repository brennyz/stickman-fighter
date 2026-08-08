/* ========================== FIGHTER MOVE ========================== */
/**
 * Shared player movement — used by adventure/training/wall and Input pads.
 * Lived in versus.js historically; kept here after local 2P retire so touch
 * pads and keyboard move keep working.
 */
function fighterMoveXBounds(f, game) {
  const ww = typeof W === 'number' && W > 0 ? W : 800;
  let min = (game && game.minX != null) ? game.minX : 40;
  let max = (game && game.maxX != null) ? game.maxX : ww - 40;
  if (game && game.mode === 'wall' && f && f.isPlayer && game.wallX != null) {
    const cols = game.wallCols || 4;
    const bw = game.wallBrickW || 62;
    const wallFace = game.wallX + cols * bw;
    max = Math.min(max, wallFace - 12);
  }
  if (game && game.mode === 'versus' && f && f.playerSlot === 1) max = Math.min(max, game.p1MaxX ?? max);
  if (game && game.mode === 'versus' && f && f.playerSlot === 2) min = Math.max(min, game.p2MinX ?? min);
  return { min, max };
}

function clampFighterX(f, game, x) {
  const b = fighterMoveXBounds(f, game);
  return clamp(Number(x) || 0, b.min, b.max);
}

/** Beweging — hardened: snappy keyboard-turn, analog joy, lichte hurt-control. */
const MOVE_ACCEL = 0.00068;
const MOVE_FLIP_ACCEL = 0.0048;
const MOVE_DIGITAL_ACCEL_MUL = 2.4;
const MOVE_STOP_DECAY = 0.0018;
const MOVE_AIR_MUL = 0.78;
const MOVE_ATTACK_RECOVER_MUL = 0.76;
const MOVE_HURT_MUL = 0.88;

function padDigitalMove(pad) {
  if (!pad || !pad.keys) return 0;
  let m = 0;
  const dual = typeof Input !== 'undefined' && Input && Input.dualMode;
  if (pad.side === 'p1') {
    if (dual) {
      if (pad.keys['a']) m -= 1;
      if (pad.keys['d']) m += 1;
    } else {
      if (pad.keys['arrowleft'] || pad.keys['a']) m -= 1;
      if (pad.keys['arrowright'] || pad.keys['d']) m += 1;
    }
  } else {
    if (pad.keys['arrowleft']) m -= 1;
    if (pad.keys['arrowright']) m += 1;
  }
  return clamp(m, -1, 1);
}

function joyMoveAxis(pad) {
  if (!pad || !pad.joy || !pad.joy.active) return 0;
  const dead = typeof JOY_DEAD_PX === 'number' ? JOY_DEAD_PX : 11;
  const max = typeof JOY_MAX_PX === 'number' ? JOY_MAX_PX : 58;
  const jx = pad.joy.dx || 0;
  if (Math.abs(jx) < dead) return 0;
  const t = clamp(jx / Math.max(1, max), -1, 1);
  return Math.sign(t) * Math.pow(Math.abs(t), 0.78);
}

function applyFighterMove(f, mv, dt, opts) {
  if (!f) return;
  opts = opts || {};
  const canAct = opts.canAct !== false;
  const spd = f.speed || 260;
  let targetVx = (mv || 0) * spd;
  if (!f.onGround) targetVx *= MOVE_AIR_MUL;

  const flip = f.vx !== 0 && mv !== 0 && Math.sign(f.vx) !== Math.sign(mv);
  let accel = flip ? MOVE_FLIP_ACCEL : MOVE_ACCEL;
  if (f.isPlayer || f.playerSlot) accel *= flip ? 1.3 : 1.14;
  if (opts.digital) accel *= MOVE_DIGITAL_ACCEL_MUL;

  if (flip && f.onGround && Math.abs(f.vx) > 30) {
    f.vx *= opts.digital ? 0.1 : 0.16;
  }

  const lerpPow = opts.digital && canAct && Math.abs(mv) > 0.45 ? accel * 2.5 : accel;
  const safeDt = Math.max(0, Number(dt) || 0);
  f.vx = lerp(f.vx || 0, targetVx, 1 - Math.pow(lerpPow, safeDt));

  if (flip && canAct && Math.abs(mv) > 0.1 && f.onGround) {
    f.vx += mv * spd * (opts.digital ? 0.34 : 0.24);
  }
  if (canAct && Math.abs(mv) < 0.035 && f.onGround) {
    f.vx = lerp(f.vx, 0, 1 - Math.pow(MOVE_STOP_DECAY, safeDt));
  }
  if (Math.abs(mv) > 0.05) f.face = mv > 0 ? 1 : -1;
}
