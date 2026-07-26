/* ============================== SATAN ENCOUNTER ======================== */
/** Na 10× falen op hetzelfde level (per moeilijkheid) verschijnt Satan. */
const SATAN_FAIL_THRESHOLD = 10;
/** UI-danger: één fail vóór Satan (9× = rood + !). */
const SATAN_DANGER_FAILS = 9;
const SATAN_REAPPEAR_GAP = 5;
const SATAN_REFLECT_RATIO = 0.85;
const SATAN_SPECIES_ID = 'satan';
/** Reflect + HP-tuning: ~85% van de duels wint Satan (speler sterft eerder). */
const SATAN_HP_VS_PLAYER = 1.35;
const SATAN_DIRECT_DMG_MUL = 0.55;
/** Dikke SVG-portrait (UI + canvas). */
const SATAN_SVG_URL = 'assets/ui/satan.svg';
const SATAN_MARK_URL = 'assets/ui/satan-mark.svg';
/** Art-hoogte ≈ 2.35 × size → size ≈ 0.21 × min(W,H) ≈ half scherm. */
const SATAN_SCREEN_FRAC = 0.21;
const SATAN_SIZE_MIN = 88;
const SATAN_SIZE_MAX = 200;

let _satanSvgImg = null;
let _satanSvgReady = false;
let _satanSvgFailed = false;

function ensureSatanSvg() {
  if (_satanSvgFailed) return null;
  if (_satanSvgImg) return _satanSvgImg;
  if (typeof Image === 'undefined') return null;
  try {
    _satanSvgImg = new Image();
    _satanSvgImg.decoding = 'async';
    _satanSvgImg.onload = () => { _satanSvgReady = true; };
    _satanSvgImg.onerror = () => { _satanSvgReady = false; _satanSvgFailed = true; };
    _satanSvgImg.src = SATAN_SVG_URL;
  } catch (_) {
    _satanSvgFailed = true;
    return null;
  }
  return _satanSvgImg;
}

function satanSvgReady() {
  ensureSatanSvg();
  return !!(
    _satanSvgReady &&
    _satanSvgImg &&
    _satanSvgImg.complete &&
    _satanSvgImg.naturalWidth > 0
  );
}

/** Combat-radius zodat Satan ~halve schermhoogte vult (clamp tegen HUD/ground). */
function satanCombatSize(game) {
  const ww = typeof W === 'number' && W > 0 ? W : 800;
  const hh = typeof H === 'number' && H > 0 ? H : 600;
  const m = Math.min(ww, hh);
  let raw = Math.round(m * SATAN_SCREEN_FRAC);
  // Half-screen art (~2.35×r) mag HUD + ground niet overschrijven
  try {
    const g = game && game.ground > 0 ? game.ground : (hh * 0.82);
    const hud = (game && game.advHudBottom) || Math.max(88, hh * 0.12);
    const room = Math.max(70, g - hud - 20);
    raw = Math.min(raw, Math.floor(room / 1.55));
  } catch (_) {}
  if (typeof clamp === 'function') return clamp(raw, SATAN_SIZE_MIN, SATAN_SIZE_MAX);
  return Math.max(SATAN_SIZE_MIN, Math.min(SATAN_SIZE_MAX, raw));
}

function satanEscAttr(s) {
  // Geen regex-literals met quotes — die breken stripLiterals in check-undefined-calls.
  return String(s == null ? '' : s)
    .split('&').join('&amp;')
    .split('"').join('&quot;')
    .split('<').join('&lt;')
    .split('>').join('&gt;');
}

/**
 * Teken dikke SVG-Satan op canvas (centered). Fallback: false → caller tekent vector.
 * Art-hoogte ≈ 2.35 × r (hoorns tot cape).
 */
function drawSatanSvgArt(c, r, t, flash, telegraph) {
  if (!c || !(r > 0)) return false;
  ensureSatanSvg();
  if (!satanSvgReady()) return false;
  const h = r * 2.35;
  const w = h * (160 / 200);
  const bob = Math.sin((t || 0) * 2.2) * r * 0.02;
  c.save();
  try {
    if (flash) c.globalAlpha = 0.92;
    else if (telegraph) c.globalAlpha = 0.88 + Math.sin((t || 0) * 14) * 0.08;
    c.drawImage(_satanSvgImg, -w * 0.5, -h * 0.52 + bob, w, h);
  } catch (_) {
    c.restore();
    return false;
  }
  c.restore();
  return true;
}

function satanPortraitHtml(opts) {
  opts = opts || {};
  const compact = !!opts.compact;
  const cls = compact ? 'adv-satan-mark' : 'adv-satan-portrait';
  const src = compact ? SATAN_MARK_URL : SATAN_SVG_URL;
  const wh = compact
    ? 'width="18" height="18"'
    : 'width="72" height="90"';
  return `<img class="${cls}" src="${satanEscAttr(src)}" alt="" ${wh} decoding="async" draggable="false">`;
}

function satanDiffId(diff) {
  return typeof normalizeAdvDiffId === 'function'
    ? normalizeAdvDiffId(diff || (typeof currentAdvDiff === 'function' ? currentAdvDiff() : 'normal'))
    : (diff || 'normal');
}

function satanFailCount(levelN, diff) {
  if (typeof advFailCount === 'function') return advFailCount(levelN, satanDiffId(diff));
  return (save && save.advFails && save.advFails[levelN]) || 0;
}

function satanLastAt(levelN, diff) {
  const d = satanDiffId(diff);
  const n = Math.floor(Number(levelN) || 0);
  if (d === 'normal') {
    if (!save || !save.advSatanAt || typeof save.advSatanAt !== 'object') return 0;
    const v = Math.floor(Number(save.advSatanAt[n]) || 0);
    return v > 0 ? v : 0;
  }
  if (typeof ensureAdvHardBag !== 'function') return 0;
  const bag = ensureAdvHardBag(d);
  if (!bag.satanAt || typeof bag.satanAt !== 'object') return 0;
  const v = Math.floor(Number(bag.satanAt[n]) || 0);
  return v > 0 ? v : 0;
}

function shouldTriggerSatan(levelN, diff) {
  const fails = satanFailCount(levelN, diff);
  if (fails < SATAN_FAIL_THRESHOLD) return false;
  const last = satanLastAt(levelN, diff);
  if (!last) return true;
  return fails >= last + SATAN_REAPPEAR_GAP;
}

/**
 * Hitte-tier voor adventure-UI (temperatuur-meter).
 * cool → warm → hot (meester) → danger (9) → satan (10+ / klaar).
 */
function satanHeatTier(fails) {
  const n = clamp(Math.floor(Number(fails) || 0), 0, 99);
  if (n >= SATAN_FAIL_THRESHOLD) return 'satan';
  if (n >= SATAN_DANGER_FAILS) return 'danger';
  if (n >= 5) return 'hot';
  if (n >= 3) return 'warm';
  if (n >= 1) return 'cool';
  return 'none';
}

function satanHeatPct(fails) {
  const n = clamp(Math.floor(Number(fails) || 0), 0, 99);
  return clamp(Math.round((n / SATAN_FAIL_THRESHOLD) * 100), 0, 100);
}

function satanHeatForLevel(levelN, diff) {
  const d = satanDiffId(diff);
  const fails = satanFailCount(levelN, d);
  const tier = satanHeatTier(fails);
  const pending = shouldTriggerSatan(levelN, d);
  return {
    levelN: levelN,
    diff: d,
    fails,
    tier,
    pct: satanHeatPct(fails),
    danger: tier === 'danger' || tier === 'satan' || pending,
    bang: fails >= SATAN_DANGER_FAILS || pending,
    satanReady: pending || tier === 'satan',
    master: fails >= 5,
  };
}

/** Hoogste hitte op een eiland (voor info-paneel). */
function satanHeatForIsland(islandId, diff) {
  const d = satanDiffId(diff);
  const range = typeof islandLevelRange === 'function'
    ? islandLevelRange(islandId)
    : { start: 1, end: 10 };
  let best = null;
  for (let n = range.start; n <= range.end; n++) {
    const h = satanHeatForLevel(n, d);
    if (!best || h.fails > best.fails || (h.fails === best.fails && h.satanReady && !best.satanReady)) {
      best = h;
    }
  }
  const unlocked = typeof advUnlockedLevel === 'function' ? advUnlockedLevel(d) : (save && save.unlocked) || 1;
  return best || satanHeatForLevel(unlocked, d);
}

function satanHeatLabel(heat) {
  if (!heat) return '';
  if (typeof t !== 'function') {
    if (heat.satanReady) return 'Satan komt';
    if (heat.tier === 'danger') return 'Gevaar!';
    if (heat.tier === 'hot') return 'Hitte';
    if (heat.tier === 'warm') return 'Warm';
    if (heat.tier === 'cool') return 'Koel';
    return 'Hitte';
  }
  if (heat.satanReady) return t('ui.heatSatanReady');
  if (heat.tier === 'danger') return t('ui.heatDanger');
  if (heat.tier === 'hot') return t('ui.heatHot');
  if (heat.tier === 'warm') return t('ui.heatWarm');
  if (heat.tier === 'cool') return t('ui.heatCool');
  return t('ui.heatIdle');
}

function satanHeatTip(heat) {
  if (!heat || typeof t !== 'function') return '';
  if (heat.satanReady) return t('ui.heatTipSatan', { lv: heat.levelN, n: heat.fails });
  if (heat.tier === 'danger') return t('ui.heatTipDanger', { lv: heat.levelN, n: heat.fails });
  if (heat.fails > 0) return t('ui.heatTipFails', { lv: heat.levelN, n: heat.fails, max: SATAN_FAIL_THRESHOLD });
  return t('ui.heatTipIdle');
}

function markSatanEncounterStarted(levelN, diff) {
  if (!save) return;
  const d = satanDiffId(diff);
  const n = Math.floor(Number(levelN) || 0);
  const fails = satanFailCount(n, d);
  if (d === 'normal') {
    if (!save.advSatanAt || typeof save.advSatanAt !== 'object') save.advSatanAt = {};
    save.advSatanAt[n] = fails;
  } else if (typeof ensureAdvHardBag === 'function') {
    const bag = ensureAdvHardBag(d);
    if (!bag.satanAt || typeof bag.satanAt !== 'object') bag.satanAt = {};
    bag.satanAt[n] = fails;
  }
  try { persist(); } catch (_) {}
}

function clearSatanEncounterProgress(levelN, diff) {
  if (!save) return;
  const d = satanDiffId(diff);
  const n = Math.floor(Number(levelN) || 0);
  let changed = false;
  if (d === 'normal') {
    if (save.advSatanAt && typeof save.advSatanAt === 'object' && save.advSatanAt[n] != null) {
      delete save.advSatanAt[n];
      changed = true;
    }
  } else if (typeof ensureAdvHardBag === 'function') {
    const bag = ensureAdvHardBag(d);
    if (bag.satanAt && bag.satanAt[n] != null) {
      delete bag.satanAt[n];
      changed = true;
    }
  }
  if (changed) {
    try { persist(); } catch (_) {}
  }
}

function adventureSpecialDuelActive(game) {
  if (!game) return false;
  return !!(game.satanPending || game.satanActive || (game.tideBattleActive && game.tideFromSatan));
}

function clearSatanState(game) {
  if (!game) return;
  game.satanPending = false;
  game.satanActive = false;
  game.satanMon = null;
  game.satanDelayT = 0;
}

function satanSpawnOpts(game) {
  const p = game && game.player;
  const sp = SPECIES[SATAN_SPECIES_ID];
  const baseHp = (sp && sp.hp) || 220;
  const targetHp = p && p.maxhp > 0
    ? Math.round(p.maxhp * SATAN_HP_VS_PLAYER)
    : Math.round(baseHp * 1.4);
  ensureSatanSvg();
  return {
    elite: true,
    satanBoss: true,
    reflectRatio: SATAN_REFLECT_RATIO,
    targetHp,
    dmgMul: SATAN_DIRECT_DMG_MUL,
    hpMul: 1,
    sizeOverride: satanCombatSize(game),
  };
}

function satanSpawnX(game) {
  const px = game.player ? game.player.x : W * 0.5;
  const maxX = game.maxX || (typeof W === 'number' ? W - 80 : 600);
  const gap = Math.max(180, satanCombatSize(game) * 1.6);
  const side = px > maxX * 0.55 ? -1 : 1;
  return clamp(px + side * rand(gap * 0.85, gap * 1.15), 80, maxX);
}

/** Na resize: houd half-scherm footprint stabiel. */
function refreshSatanCombatScale(game) {
  if (!game || !game.satanActive || !game.satanMon || !game.satanMon.alive) return;
  const mon = game.satanMon;
  const next = satanCombatSize(game);
  if (!(next > 0) || Math.abs(next - mon.size) < 2) return;
  mon.size = next;
  try {
    if (!mon.flying && game.ground > 0) mon.y = game.ground - mon.size;
  } catch (_) {}
}

function triggerSatanIntro(game, monster) {
  if (!game || !monster || !monster.sp) return;
  const name = monster.sp.name || 'Satan';
  monster.introT = 2.8;
  monster.introTier = 'satanBoss';
  try {
    AudioSys.sting('bossIntro');
    AudioSys.play('boss');
    game.banner(t('banner.satan', { name }), 2.6, '#ff3040', 48);
    AudioSys.sfx('roar');
  } catch (_) {}
  const x = monster.x;
  const y = monster.y - (monster.size || 40) * 0.4;
  try {
    game.burst(x, y, '#ff3040', motionReduced() || fxLite() ? 12 : 30);
    game.burst(x, y, '#ffd75e', 14);
    spawnFxRing(game, x, y, '#ff3040', 26);
    spawnFxRing(game, x, y - 18, '#1a0a10', 14);
    game.shake(16, 0.5);
    game.freezeT = Math.max(game.freezeT || 0, 0.2);
    haptic(34);
  } catch (_) {}
}

function reportSatanRecover(reason, err) {
  const now = Date.now();
  if (window.__sfSatanRecoverT && now - window.__sfSatanRecoverT < 6000) return;
  window.__sfSatanRecoverT = now;
  const msg = reason === 'spawn'
    ? 'Satan-gevecht start mislukt — avontuur gaat verder'
    : 'Satan-gevecht hersteld';
  if (typeof sfReportError === 'function') sfReportError('satan/' + (reason || 'recover'), err, msg);
  else if (typeof userToast === 'function') userToast(msg, 3400);
}

function syncSatanState(game) {
  if (!game || game.mode !== 'adventure') return;
  if (game.satanPending) {
    if (!game.player || !game.player.alive || game.over) {
      clearSatanState(game);
      return;
    }
    return;
  }
  if (!game.satanActive) return;
  const mon = game.satanMon;
  if (!mon || !Array.isArray(game.monsters) || !game.monsters.includes(mon)) {
    clearSatanState(game);
    reportSatanRecover('sync');
    return;
  }
  if (!mon.alive) {
    if ((mon.deadT || 0) >= 0.35) {
      try {
        if (typeof game.finishSatanEncounter === 'function') game.finishSatanEncounter(true, mon);
        else clearSatanState(game);
      } catch (err) {
        console.error('[Satan] finish', err);
        clearSatanState(game);
        reportSatanRecover('finish', err);
      }
    }
    return;
  }
  if (!game.player || !game.player.alive || game.over) {
    clearSatanState(game);
  }
}
