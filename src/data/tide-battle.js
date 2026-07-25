/* ============================== TIDE BATTLE ============================== */
/** Zeldzame tide-boss per kill — herkenbare summons, generieke namen (geen IP). */
const TIDE_BATTLE_CHANCE = 0.0005;
const TIDE_BOSS_IDS = [
  'tideKyuu', 'tideManda', 'tideGama', 'tideKatsu',
  'tideShuka', 'tideGyuu', 'tideEnma', 'tideGaruda', 'tideCerber',
];

function isTideBossId(id) {
  return TIDE_BOSS_IDS.includes(id);
}

function pickTideBossId() {
  return TIDE_BOSS_IDS[Math.floor(Math.random() * TIDE_BOSS_IDS.length)];
}

function rollTideBattleChance(game) {
  if (!game || game.mode !== 'adventure' || game.over) return false;
  if (game.tideBattleActive) return false;
  if (!game.player || !game.player.alive) return false;
  return Math.random() < TIDE_BATTLE_CHANCE;
}

function tideBossSpawnOpts(game) {
  const lv = game.level ? game.level.n : 1;
  return {
    elite: true,
    superBoss: true,
    tideBoss: true,
    hpMul: (game.level?.hpMul || 1) * (1 + lv * 0.012),
    dmgMul: game.level?.dmgMul || 1,
  };
}

function triggerTideBattleIntro(game, monster) {
  if (!game || !monster) return;
  const name = (monster.sp && monster.sp.name) || 'Tide';
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

function beginTideBattleMusic(game) {
  if (game) {
    game.tideBattlePrevSong = (AudioSys.song && AudioSys.song.id) || AudioSys.desiredSong
      || (game.level && game.level.boss ? 'boss' : 'battle');
  }
  try { AudioSys.sting('tideBattleIntro'); } catch (_) {}
  setTimeout(() => {
    try { AudioSys.play('tideBattle'); } catch (_) {}
  }, 340);
}

function restoreTideBattleMusic(game) {
  if (!game) return;
  const prev = game.tideBattlePrevSong;
  game.tideBattlePrevSong = null;
  if (!prev || prev === 'tideBattle') {
    try { AudioSys.play(game.level && game.level.boss ? 'boss' : 'battle'); } catch (_) {}
    return;
  }
  try { AudioSys.play(prev); } catch (_) {}
}

function tideBattleRewardXp(game) {
  const n = game.level ? game.level.n : 1;
  return 140 + n * 12;
}

function tideBattleRewardCoins() {
  return 22;
}
