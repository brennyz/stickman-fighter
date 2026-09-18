/**
 * Combat juice — punch / kick / kill / equip snap.
 * Flappy-like: juice the core action, not UI chrome (no extra toasts / HUD spam).
 * Versus retired. Reduced-motion skips shake / squash / particles; haptic + KO text stay.
 */
function juiceNowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

function juiceGapOk(store, key, minMs) {
  if (!store) return false;
  const now = juiceNowMs();
  if ((now - (store[key] || 0)) < minMs) return false;
  store[key] = now;
  return true;
}

/** Impact squash on the body that just got hit. Feel only — hitboxes stay. */
function juiceApplyHitSquash(target, opts) {
  if (!target) return;
  if (typeof motionReduced === 'function' && motionReduced()) return;
  opts = opts || {};
  const heavy = !!(opts.heavy || opts.crit);
  const dur = opts.counter ? 0.12 : (heavy ? 0.11 : 0.07);
  const amt = opts.counter ? 0.16 : (heavy ? 0.14 : 0.09);
  target.hitSquashT = Math.max(target.hitSquashT || 0, dur);
  target.hitSquashAmt = Math.max(target.hitSquashAmt || 0, amt);
}

function juiceTickSquash(target, dt) {
  if (!target) return;
  if ((target.hitSquashT || 0) > 0) target.hitSquashT -= dt;
}

function juiceDrawSquash(c, target) {
  if (!c || !target) return;
  if (typeof motionReduced === 'function' && motionReduced()) return;
  const t = target.hitSquashT || 0;
  if (t <= 0) return;
  const amt = target.hitSquashAmt || 0.1;
  const k = Math.min(1, t / 0.11);
  c.scale(1 + amt * k, Math.max(0.72, 1 - amt * 0.85 * k));
}

/**
 * Kill snap: one freeze (desktop) + rate-limited shake/haptic so a horde does not camera-spam.
 * Lite FX / touch skip freeze hitch — haptic + KO text stay.
 * Caller still paints the single KO floater.
 */
function juiceKillSnap(game, m) {
  if (!game) return;
  const elite = !!(m && (m.elite || m.bossCore || m.superBoss || m.satanBoss || m.colossal));
  const skipFreeze = (typeof fxSkipFreeze === 'function')
    ? fxSkipFreeze()
    : ((typeof fxLite === 'function' && fxLite())
      || (typeof fxSpawnLite === 'function' && fxSpawnLite())
      || (typeof fxTouchDevice === 'function' && fxTouchDevice()));
  if (!skipFreeze) {
    game.freezeT = Math.max(game.freezeT || 0, elite ? 0.075 : 0.058);
  }
  if (!juiceGapOk(game, '_juiceKillSnapAt', elite ? 60 : 90)) return;
  try { game.shake(elite ? 7 : 5, elite ? 0.22 : 0.16); } catch (_) {}
  try { if (typeof haptic === 'function') haptic(elite ? 16 : 12); } catch (_) {}
}

/** World-drop / pickup equip: snap in the fight, not a second toast. */
function juiceEquipCombat(game, x, y) {
  if (!game) return;
  try { if (typeof haptic === 'function') haptic(14); } catch (_) {}
  if (typeof applyHitConfirmFx === 'function') {
    try { applyHitConfirmFx(game, x, y, { kind: 'special' }, { force: true, haptic: false }); } catch (_) {}
  }
  if (typeof motionReduced === 'function' && motionReduced()) return;
  game.freezeT = Math.max(game.freezeT || 0, 0.04);
  try { game.shake(3, 0.1); } catch (_) {}
}

/** Gear-screen doll punch. Reduced-motion CSS keeps a static highlight. */
function juiceEquipMenu(doll) {
  if (!doll) return;
  try {
    doll.classList.remove('juice-flash');
    void doll.offsetWidth;
    doll.classList.add('juice-flash');
  } catch (_) {}
}
