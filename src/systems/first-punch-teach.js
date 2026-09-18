/* ======================== FIRST-30s PUNCH TEACH ======================== */
/** MASTERGAME: first Avontuur teaches by punching — short nudge, no text wall. */

const FIRST_PUNCH_NUDGE_SEC = 2.6;
const FIRST_PUNCH_NUDGE_WINDOW = 30;
const FIRST_PUNCH_NUDGE_DELAY_FIRST = 0.85;
const FIRST_PUNCH_NUDGE_DELAY_LATER = 3;

function firstPunchTeachPending(g) {
  return !!(g && g._juiceTeach && !g._juiceTaught && !g.over);
}

function firstPunchTeachNudgeDelay(g) {
  try {
    if (g && g.mode === 'adventure' && typeof firstPunchPending === 'function' && firstPunchPending()) {
      return FIRST_PUNCH_NUDGE_DELAY_FIRST;
    }
  } catch (_) {}
  return FIRST_PUNCH_NUDGE_DELAY_LATER;
}

function firstPunchTeachNudgeLine() {
  const touch = typeof useTouchFightPads === 'function'
    ? useTouchFightPads()
    : (typeof IS_TOUCH !== 'undefined' && IS_TOUCH);
  if (typeof tOr === 'function') {
    return tOr(touch ? 'juice.strikeNudge' : 'juice.strikeNudgeKb', touch ? 'Tik slaan' : 'Druk J');
  }
  return touch ? 'Tik slaan' : 'Druk J';
}

function firstPunchTeachLanded(g) {
  if (!g) return false;
  return (g.combo || 0) > 0 || (g.maxCombo || 0) > 0 || (g.kills || 0) > 0;
}

function updateFirstPunchTeach(g) {
  if (!firstPunchTeachPending(g)) return;
  if (firstPunchTeachLanded(g)) {
    g._juiceTaught = true;
    return;
  }
  if (g._juiceNudged) return;
  if (g.t < firstPunchTeachNudgeDelay(g) || g.t >= FIRST_PUNCH_NUDGE_WINDOW) return;
  if ((g.hint || 0) > 0) return;
  g._juiceNudged = true;
  g.modeHintLine = firstPunchTeachNudgeLine();
  g.hint = FIRST_PUNCH_NUDGE_SEC;
}

function firstPunchTeachShouldPulsePunch(g) {
  try {
    if (!firstPunchTeachPending(g)) return false;
    if (g.mode !== 'adventure') return false;
    if (typeof firstPunchPending === 'function' && !firstPunchPending()) return false;
    return true;
  } catch (_) {
    return false;
  }
}

/** Retest: wipe the first-punch flag. Console: __sf.resetFirstPunchTeach() */
function resetFirstPunchTeachFlag() {
  try {
    if (typeof save === 'undefined' || !save) return false;
    save.feltFirstPunch = false;
    if (typeof persist === 'function') persist();
    return true;
  } catch (_) {
    return false;
  }
}
