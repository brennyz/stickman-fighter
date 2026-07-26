/* ============================== SATAN ENCOUNTER ======================== */
/** Na 10× falen op hetzelfde level verschijnt Satan (reflect-baas). */
const SATAN_FAIL_THRESHOLD = 10;
const SATAN_REAPPEAR_GAP = 5;
const SATAN_REFLECT_RATIO = 0.85;
const SATAN_SPECIES_ID = 'satan';
/** Reflect + HP-tuning: ~85% van de duels wint Satan (speler sterft eerder). */
const SATAN_HP_VS_PLAYER = 1.35;
const SATAN_DIRECT_DMG_MUL = 0.55;

function satanFailCount(levelN) {
  return typeof advFailCount === 'function' ? advFailCount(levelN) : 0;
}

function satanLastAt(levelN) {
  if (!save || !save.advSatanAt || typeof save.advSatanAt !== 'object') return 0;
  const n = Math.floor(Number(save.advSatanAt[levelN]) || 0);
  return n > 0 ? n : 0;
}

function shouldTriggerSatan(levelN) {
  const fails = satanFailCount(levelN);
  if (fails < SATAN_FAIL_THRESHOLD) return false;
  const last = satanLastAt(levelN);
  if (!last) return true;
  return fails >= last + SATAN_REAPPEAR_GAP;
}

function markSatanEncounterStarted(levelN) {
  if (!save) return;
  if (!save.advSatanAt || typeof save.advSatanAt !== 'object') save.advSatanAt = {};
  save.advSatanAt[levelN] = satanFailCount(levelN);
  try { persist(); } catch (_) {}
}

function clearSatanEncounterProgress(levelN) {
  if (!save || !save.advSatanAt || typeof save.advSatanAt !== 'object') return;
  if (save.advSatanAt[levelN] != null) {
    delete save.advSatanAt[levelN];
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
  return {
    elite: true,
    satanBoss: true,
    reflectRatio: SATAN_REFLECT_RATIO,
    targetHp,
    dmgMul: SATAN_DIRECT_DMG_MUL,
    hpMul: 1,
  };
}

function satanSpawnX(game) {
  const px = game.player ? game.player.x : W * 0.5;
  const maxX = game.maxX || (typeof W === 'number' ? W - 80 : 600);
  const side = px > maxX * 0.55 ? -1 : 1;
  return clamp(px + side * rand(160, 240), 80, maxX);
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
