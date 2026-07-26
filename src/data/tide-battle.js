/* ============================== TIDE BATTLE ============================== */
/** Tide-boss per kill — UIT (zeldzame interrupt brak avontuur-flow). */
const TIDE_BATTLE_CHANCE = 0;
const TIDE_BOSS_IDS = [
  'tideKyuu', 'tideManda', 'tideGama', 'tideKatsu',
  'tideShuka', 'tideGyuu', 'tideEnma', 'tideGaruda', 'tideCerber',
];

function isTideBossId(id) {
  return typeof id === 'string' && TIDE_BOSS_IDS.includes(id) && !!SPECIES[id];
}

function pickTideBossId() {
  const valid = TIDE_BOSS_IDS.filter((id) => SPECIES[id]);
  if (!valid.length) return TIDE_BOSS_IDS[0];
  return valid[Math.floor(Math.random() * valid.length)];
}

function tideBattleCanRoll(game) {
  if (!game || game.mode !== 'adventure' || game.over) return false;
  if (game.tideBattleActive) return false;
  if (!game.player || !game.player.alive) return false;
  if (game.traveling || game.wavePause > 0) return false;
  if (game.inputLocked) return false;
  if ((game.ketsbamChargeT || 0) > 0) return false;
  if (!game.level || !game.monsters) return false;
  return true;
}

function rollTideBattleChance(game) {
  return false;
}

function tideBossSpawnOpts(game) {
  const lv = game && game.level ? game.level.n : 1;
  const baseHp = (game && game.level && game.level.hpMul) || 1;
  const baseDmg = (game && game.level && game.level.dmgMul) || 1;
  return {
    elite: true,
    superBoss: true,
    tideBoss: true,
    hpMul: baseHp * (1 + clamp(lv, 1, 500) * 0.012),
    dmgMul: baseDmg,
  };
}

function cancelTideBattleMusicPending(game) {
  if (!game || !game.tideBattleMusicT) return;
  try { clearTimeout(game.tideBattleMusicT); } catch (_) {}
  game.tideBattleMusicT = null;
}

function restoreTideBattleMusic(game) {
  if (!game) return;
  cancelTideBattleMusicPending(game);
  const prev = game.tideBattlePrevSong;
  game.tideBattlePrevSong = null;
  const fallbackKind = (game.level && game.level.boss) ? 'boss' : 'battle';
  const next = (prev && !(typeof isTideBgmId === 'function' ? isTideBgmId(prev) : prev === 'tideBattle') && SONGS[prev])
    ? prev
    : null;
  try {
    if (next) AudioSys.play(next);
    else if (typeof playFightBgm === 'function') playFightBgm(fallbackKind);
    else AudioSys.play(fallbackKind);
  } catch (_) {}
}

function reportTideBattleRecover(reason, err) {
  const now = Date.now();
  if (window.__sfTideRecoverT && now - window.__sfTideRecoverT < 6000) return;
  window.__sfTideRecoverT = now;
  const msg = reason === 'spawn'
    ? 'Tide Battle start mislukt — ga verder met avontuur'
    : 'Tide Battle hersteld — muziek/HUD gesynchroniseerd';
  if (typeof sfReportError === 'function') sfReportError('tideBattle/' + (reason || 'recover'), err, msg);
  else if (typeof userToast === 'function') userToast(msg, 3400);
}

function clearTideBattleState(game, opts) {
  opts = opts || {};
  if (!game) return;
  cancelTideBattleMusicPending(game);
  const wasActive = !!game.tideBattleActive;
  game.tideBattleActive = false;
  game.tideBattleBossId = null;
  game.tideBattleMon = null;
  if (opts.restoreMusic !== false && wasActive) restoreTideBattleMusic(game);
}

/** Houd tide-state consistent — voorkomt vastgelopen HUD/muziek na edge cases. */
function syncTideBattleState(game) {
  if (!game || game.mode !== 'adventure' || !game.tideBattleActive) return;
  const mon = game.tideBattleMon;
  if (!mon || !Array.isArray(game.monsters) || !game.monsters.includes(mon)) {
    clearTideBattleState(game, { restoreMusic: true });
    reportTideBattleRecover('sync');
    return;
  }
  if (!mon.alive) {
    if ((mon.deadT || 0) >= 0.35) {
      try {
        if (typeof game.finishTideBattle === 'function') game.finishTideBattle(true, mon);
        else clearTideBattleState(game, { restoreMusic: true });
      } catch (err) {
        console.error('[TideBattle] finish', err);
        clearTideBattleState(game, { restoreMusic: true });
        reportTideBattleRecover('finish', err);
      }
    }
    return;
  }
  if (!game.player || !game.player.alive || game.over) {
    clearTideBattleState(game, { restoreMusic: true });
    reportTideBattleRecover('abort');
  }
}

function beginTideBattleMusic(game) {
  if (!game) return;
  cancelTideBattleMusicPending(game);
  const cur = (AudioSys.song && AudioSys.song.id) || AudioSys.desiredSong;
  const onTide = typeof isTideBgmId === 'function' ? isTideBgmId(cur) : (cur === 'tideBattle');
  game.tideBattlePrevSong = (cur && !onTide && SONGS[cur]) ? cur
    : ((game.level && game.level.boss) ? 'boss' : 'battle');
  try { AudioSys.sting('tideBattleIntro'); } catch (_) {}
  game.tideBattleMusicT = setTimeout(() => {
    game.tideBattleMusicT = null;
    if (!game.tideBattleActive || game.over || game.mode !== 'adventure') return;
    try {
      if (typeof playFightBgm === 'function') playFightBgm('tideBattle');
      else AudioSys.play('tideBattle');
    } catch (_) {}
  }, 340);
}

function triggerTideBattleIntro(game, monster) {
  if (!game || !monster || !monster.sp) return;
  const name = monster.sp.name || 'Tide';
  monster.introT = 2.6;
  monster.introTier = 'tideBoss';
  beginTideBattleMusic(game);
  try {
    game.banner(t('banner.tideBattle', { name }), 2.4, '#4a9fff', 46);
    AudioSys.sfx('roar');
  } catch (_) {}
  const x = monster.x;
  const y = monster.y - (monster.size || 40) * 0.4;
  try {
    game.burst(x, y, '#4a9fff', motionReduced() || fxLite() ? 10 : 26);
    game.burst(x, y, '#ffd75e', 12);
    spawnFxRing(game, x, y, '#4a9fff', 24);
    game.shake(14, 0.45);
    game.freezeT = Math.max(game.freezeT || 0, 0.18);
    haptic(30);
  } catch (_) {}
}

function tideBattleRewardXp(game) {
  const n = game && game.level ? game.level.n : 1;
  return 140 + clamp(Math.floor(Number(n) || 1), 1, 500) * 12;
}

function tideBattleRewardCoins() {
  return 22;
}

function tideBattleSpawnX(game) {
  const px = game.player ? game.player.x : W * 0.5;
  const maxX = game.maxX || (typeof W === 'number' ? W - 80 : 600);
  const side = px > maxX * 0.55 ? -1 : 1;
  return clamp(px + side * rand(150, 230), 80, maxX);
}
