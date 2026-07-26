/* ================================ GAME ================================= */
let game = null;

/** Pickup lifetime (sec) — shards langer zodat je ze kunt teruglopen. */
const SHARD_PICKUP_LIFE = 36;
const GENERIC_PICKUP_LIFE = 22;

/** Deferred UI (toast/banner) — negeer na menu-exit of nieuw gevecht. */
function gameUiTimerOk(ref, opts) {
  opts = opts || {};
  if (state === 'menu') return false;
  if (ref && game && game !== ref) return false;
  if (!opts.allowOver && ref && ref.over) return false;
  return true;
}

function adventureTelegraphHud(m) {
  if (!m || !m.alive) return null;
  if (m.telegraphT > 0) {
    if (m.sp.type === 'tank') return { label: 'SLAM — spring!', color: '#ff9a3d', frac: m.telegraphT / 0.55, max: 0.55 };
    if (m.sp.type === 'charge') {
      const max = m.enraged ? 0.28 : 0.45;
      return { label: 'CHARGE — uit de weg!', color: '#ffdd66', frac: m.telegraphT / max, max };
    }
  }
  if (m.sp.type === 'shoot' && m.shootCD > 0 && m.shootCD < 0.32) {
    return { label: 'SCHIET — side-step!', color: '#7cf5ff', frac: 1 - m.shootCD / 0.32, max: 0.32 };
  }
  if (m.sp.type === 'dragon' && m.shootCD > 0 && m.shootCD < 0.38) {
    return { label: 'VUUR — side-step!', color: '#ff7a4d', frac: 1 - m.shootCD / 0.38, max: 0.38 };
  }
  return null;
}

function drawTelegraphBar(c, game, tele, y) {
  const barW = Math.min(240, W - 48);
  const bx = (W - barW) / 2;
  c.fillStyle = 'rgba(0,0,0,.4)';
  game.rr(c, bx - 4, y - 14, barW + 8, 22, 8);
  c.fill();
  c.font = '800 11px sans-serif';
  c.textAlign = 'center';
  c.fillStyle = tele.color;
  c.fillText(tele.label, W / 2, y);
  c.fillStyle = 'rgba(255,255,255,.15)';
  game.rr(c, bx, y + 6, barW, 5, 3);
  c.fill();
  c.fillStyle = tele.color;
  game.rr(c, bx, y + 6, barW * clamp(tele.frac, 0, 1), 5, 3);
  c.fill();
}

/** Seconden actief naar rechts lopen om checkpoint-deel te unlocken. */
const PART_GATE_WALK_SEC = 3.35;
const PART_GATE_DECAY_MUL = 1.5;
const PART_GATE_IDLE_HINT = 1.35;
const PART_GATE_PLAYER_X = 0.28;

function partBoundaryWaveIdx(totalWaves, currentPart) {
  if (totalWaves < 1) return -1;
  // Korte levels (≤3 golven): geen checkpoint-tunnel tussen golf 1/2 en 2/2 — direct door.
  if (totalWaves < 4) return -1;
  const b1 = Math.max(0, Math.ceil(totalWaves / 3) - 1);
  if (currentPart === 1) return b1;
  if (currentPart === 2) {
    const b2 = Math.max(0, Math.ceil((2 * totalWaves) / 3) - 1);
    return Math.max(b1 + 1, b2);
  }
  return -1;
}

/** Checkpoint: joystick, toetsen én daadwerkelijke loop-rechts (vx) tellen mee. */
function partGateMoveSignal(g) {
  let mv = playerWalkInput();
  if (mv > 0.05) return mv;
  const p = g && g.player;
  if (p && (p.vx || 0) > 32) return Math.min(1, (p.vx || 0) / Math.max(80, p.speed || 260));
  if (typeof Input !== 'undefined' && Input.keys && (Input.keys.d || Input.keys.arrowright)) return 1;
  return mv;
}

function playerWalkInput() {
  if (typeof Input === 'undefined' || Input.dualMode) return 0;
  let mv = Input.move || 0;
  if (Math.abs(mv) < 0.08) {
    if (Input.keys.d || Input.keys.arrowright) mv = 1;
    else if (Input.keys.a || Input.keys.arrowleft) mv = -1;
  }
  return mv;
}

class Game {
  constructor(mode, opts) {
    opts = opts || {};
    this.mode = mode;
    this.t = 0;
    this.ground = playfieldGroundY(H, W);
    this.minX = 40; this.maxX = W - 40;
    this.shakeT = 0; this.shakeMag = 0; this.freezeT = 0;
    this.particles = []; this.floaters = []; this.projectiles = []; this.banners = [];
    this.monsters = [];
    this.inputLocked = false;
    this.playerHurtCd = 0;
    this.sessionXP = 0;
    this.over = false;
    this.maxCombo = 0;
    this.combo = 0;
    this.comboT = 0;
    this.runFinishers = 0;
    this.runLoot = createRunLoot();

    const st = playerStats();
    if (mode === 'adventure') {
      this.advDiff = normalizeAdvDiffId(opts.difficulty || currentAdvDiff());
    }
    if (mode !== 'versus') {
      const advLevel = mode === 'adventure' ? (opts.level || 1) : 0;
      const mb = mode === 'adventure' && masterBuffActive(advLevel, this.advDiff);
      const pst = mode === 'adventure' ? playerStats({ masterBuff: mb }) : st;
      const wpn = mode === 'adventure' ? playerWeaponForAdventure(advLevel) : playerWeapon();
      this.player = new Fighter({
        isPlayer: true, x: W * 0.25, y: this.ground,
        hp: pst.maxhp, maxhp: pst.maxhp, baseDmg: pst.dmg,
        weapon: wpn, color: '#f2f5ff',
        speed: Math.round(260 * (pst.speedMul || 1)),
        rosterId: 'hero',
        vsSpecial: activeJutsuId(),
      });
      applyPlayerStyle(this.player);
      applyStyleBonusesToPlayer(this, this.player);
      applyPlayerSkill(this.player);
      this.petDmgMul = 1;
      this.petEnergyMul = 1;
      this.petCritBonus = 0;
      this.petShieldWave = 0;
      applyPetBonusesToPlayer(this, this.player);
      spawnGamePet(this);
      spawnGameEggPet(this);
    }

    if (mode === 'adventure') {
      this.combo = 0; this.comboT = 0;
      this.killStreak = 0;
      this.pickups = [];
      this.dmgBuffT = 0; this.dmgBuffMul = 1;
      this.playerShieldT = 0;
      this.stageDmgMul = 1;
      this.stageEnergyMul = 1;
      this.stageAlly = null;
      this.stageHealBetween = 0;
      this.stageShieldPerWave = 0;
      this.stageCritBonus = 0;
      this.gambleRoll = null;
      this.gambleBossWave = 0;
      this.masterSwordT = 0;
      this._savedMasterWeapon = null;
      this.initAdventure(opts.level || 1, opts.gamble, opts.difficulty);
    } else if (mode === 'training') this.initTraining();
    else if (mode === 'wall') this.initWall();
    else if (mode === 'coinrun') this.initCoinRun();
    else if (mode === 'versus') this.initVersus(opts);
  }

  onResize() {
    this.ground = playfieldGroundY(H, W);
    this.maxX = W - 40;
    if (this.mode === 'versus' && this.p2) {
      applyVsArenaBounds(this);
      Input.dualMode = true;
      Input.layout(W, H);
      this.player.x = clampFighterX(this.player, this, vsSpawnX(1));
      this.player.y = this.ground;
      this.p2.x = clampFighterX(this.p2, this, vsSpawnX(2));
      this.p2.y = this.ground;
    }
    if (this.mode === 'wall') this.layoutWall(false);
  }

  /* --------------------------- AVONTUUR ------------------------------- */
  initAdventure(n, gamble, difficulty) {
    try { Input.dualMode = false; } catch (_) {}
    const diff = normalizeAdvDiffId(difficulty || currentAdvDiff());
    this.advDiff = diff;
    this.level = buildLevel(n, diff);
    this.theme = this.level.theme;
    this.waveIdx = -1;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.kills = 0;
    this.betweenT = 1.2;
    this.pickups = this.pickups || [];
    this.worldX = 0;
    this.traveling = false;
    this.progressSmooth = 0;
    this.stagePart = 1;
    this.partFlashT = 0;
    this.partGate = null;
    this.bossArriveT = 0;
    this.travelWasOn = false;
    this.bossBeatPlayed = false;
    this.waveTotal = 0;
    this.allyAssistT = 0;
    this.gambleRoll = gamble || null;
    this.ketsbamCd = 0;
    this.ketsbamSuperT = 0;
    this.ketsbamShow = false;
    this.ketsbamPulse = 0;
    this.ketsbamBuildT = 0;
    this.ketsbamBuildProg = 0;
    this.ketsbamChargeT = 0;
    this.ketsbamChargeDur = 0;
    this.ketsbamChargePulse = 0;
    this.tideBattleActive = false;
    this.tideBattleBossId = null;
    this.tideBattleMon = null;
    this.tideBattlePrevSong = null;
    this.tideBattleMusicT = null;
    applyGambleToStage(this, gamble);
    const diffMeta = advDiffMeta(diff);
    const startLabel = diff === 'normal'
      ? t('banner.levelStart', { n })
      : t('banner.levelStartDiff', { n, diff: advDiffLabel(diff) });
    this.banner(startLabel, 1.4, diffMeta.accent || '#ffd75e', 54);
    if (masterBuffActive(n, diff)) {
      const self = this;
      setTimeout(() => {
        try {
          if (!gameUiTimerOk(self)) return;
          self.banner(t('banner.masterBuff'), 2, '#c47aff', 40);
          self.floater(W * 0.5, 132, t('combat.masterBuffFloater'), '#c47aff', 14, 'hud');
        } catch (_) {}
      }, 1500);
    }
    const wCap = adventureWeaponCapForLevel(n);
    if (playerWeapon().unlock > wCap) {
      const self = this;
      setTimeout(() => {
        try {
          if (!gameUiTimerOk(self)) return;
          self.floater(W * 0.5, 148, t('combat.skillGate', { cap: wCap }), '#ffd75e', 13, 'hud');
        } catch (_) {}
      }, masterBuffActive(n, diff) ? 2800 : 1500);
    }
    if (gamble && gamble.outcome !== 'neutral') {
      const self = this;
      setTimeout(() => {
        try {
          if (!gameUiTimerOk(self)) return;
          self.banner(gambleOutcomeLabelFromKey(gamble).slice(0, 42), 2.2, '#7cf5ff', 34);
        } catch (_) {}
      }, 1600);
    }
    if (this.gambleBossWave > 0) {
      this.floater(W * 0.5, 100, t('combat.gambleSuperBoss', { n: this.gambleBossWave }), '#ffb0b8', 14, 'hud');
    }
    if (this.stageAlly) {
      const intro = this.stageAlly.id === 'tide'
        ? t('combat.tideAllyIntro', { name: this.stageAlly.name })
        : t('combat.allyHelps', { name: this.stageAlly.name });
      this.floater(W * 0.5, 118, intro, this.stageAlly.color || '#7cf5ff', 15);
    }
    ensureTipsSeen();
    if (!save.tipsSeen.partGate && n <= 8) {
      const self = this;
      setTimeout(() => {
        try {
          if (!gameUiTimerOk(self)) return;
          self.floater(W * 0.5, 124, t('combat.partGateIntro'), '#7cf5ff', 13);
        } catch (_) {}
      }, 2400);
    }
    this.allyAssistT = this.stageAlly ? 2.2 : 0;
    // Master Sword roll UIT — geen zeldzame interrupt midden in level
    try {
      if (typeof playFightBgm === 'function') playFightBgm(this.level.boss ? 'boss' : 'battle');
      else AudioSys.play(this.level.boss ? 'boss' : 'battle');
    } catch (_) {}
  }

  maybeRollMasterSword() {
    return; // UIT
  }

  activateMasterSword() {
    try {
      const p = this.player;
      if (!p || !canMasterSwordRoll(p.weapon)) return;
      this._savedMasterWeapon = p.weapon;
      p.weapon = buildMasterSwordWeapon(p.weapon);
      this.masterSwordT = MASTER_SWORD_DURATION;
      resetWeaponCombo(p);
      this.banner(t('banner.masterSword'), 2.4, '#7cf5ff', 52);
      this.floater(p.x, p.y - 132, t('combat.masterSwordGain'), '#ffd75e', 16);
      if (!fxLite() && !motionReduced()) {
        this.burst(p.x + p.face * 18, p.y - 52, '#6fd7ff', 14, { kind: 'spark', size: 2.8 });
        spawnFxRing(this, p.x, p.y - 48, '#7cf5ff', 12);
      }
      try { AudioSys.sting('masterSword'); AudioSys.sfx('masterSword'); } catch (_) {}
      haptic(26);
    } catch (err) {
      try { sfReportError('masterSword/on', err, 'Master Sword hiccup — speel door'); } catch (_) {}
    }
  }

  deactivateMasterSword(silent) {
    try {
      if (!this._savedMasterWeapon || !this.player) {
        this.masterSwordT = 0;
        this._savedMasterWeapon = null;
        return;
      }
      this.player.weapon = this._savedMasterWeapon;
      this._savedMasterWeapon = null;
      this.masterSwordT = 0;
      resetWeaponCombo(this.player);
      if (!silent) {
        this.floater(this.player.x, this.player.y - 120, t('combat.masterSwordFade'), '#9db1e3', 14);
      }
    } catch (err) {
      this.masterSwordT = 0;
      this._savedMasterWeapon = null;
      try { sfReportError('masterSword/off', err); } catch (_) {}
    }
  }

  nextWave() {
    if (!this.player?.alive) {
      if (!this.over) this.finishAdventure(false);
      return;
    }
    this.waveIdx++;
    if (this.waveIdx >= this.level.waves.length) { this.finishAdventure(true); return; }
    const wave = this.level.waves[this.waveIdx];
    const bossWave = isBossWave(this.level, this.waveIdx);
    this.spawnQueue = wave.slice();
    this.waveTotal = wave.length;
    this.spawnTimer = bossWave ? 1.0 : 0.45;
    this.wavePause = 0;
    if (this.stageShieldPerWave > 0 && this.player) {
      this.playerShieldT = Math.max(this.playerShieldT, this.stageShieldPerWave);
    }
    if (this.petShieldWave > 0 && this.player) {
      this.playerShieldT = Math.max(this.playerShieldT, this.petShieldWave);
    }
    if (this.styleShieldWave > 0 && this.player) {
      this.playerShieldT = Math.max(this.playerShieldT, this.styleShieldWave);
    }
    if (bossWave) {
      try {
        this.banner(t('banner.bossWave'), 2.2, '#ff6b6b', 58);
        if (typeof playFightBgm === 'function') playFightBgm('boss');
        else AudioSys.play('boss');
        AudioSys.sfx('roar');
      } catch (_) {}
      try {
        this.shake(10, 0.36);
        this.burst(W * 0.5, this.ground - 80, '#ff6b6b', fxLite() ? 12 : 26);
        spawnFxRing(this, W * 0.5, this.ground - 80, '#ffd75e', 20);
      } catch (_) {}
    } else if (wave.some(s => s.elite || s.superBoss)) {
      const hasSuper = wave.some(s => s.superBoss);
      try {
        this.banner(hasSuper ? t('banner.superBossWave') : t('banner.eliteWave'), 1.35, hasSuper ? '#ffd75e' : '#ffb0b8', 40);
        if (typeof playFightBgm === 'function') playFightBgm(hasSuper ? 'boss' : 'elite');
        else AudioSys.play(hasSuper ? 'boss' : 'elite');
        AudioSys.sfx('roar');
      } catch (_) {}
    } else {
      const meta = this.level.waveMeta && this.level.waveMeta[this.waveIdx];
      const trait = meta && meta.trait && (typeof waveTraitBanner === 'function' ? waveTraitBanner(meta.trait) : null);
      if (trait) {
        this.banner(trait.text, 1.2, trait.color, trait.size);
        if (meta.trait === 'flyers') {
          try { this.floater(W * 0.5, 108, t('combat.aimUp'), '#c47aff', 13); } catch (_) {}
        } else if (meta.trait === 'tide') {
          try {
            AudioSys.sfx('tideSurge');
            this.floater(W * 0.5, 108, t('combat.tideTraitTip'), '#6ee06e', 13);
            if (!fxLite() && this.player) {
              this.burst(this.player.x, this.player.y - 40, '#6ee06e', 8, { kind: 'spark', size: 2.2 });
            }
          } catch (_) {}
        }
      } else {
        this.banner(t('banner.waveN', { n: this.waveIdx + 1, total: this.level.waves.length }), 1.1, '#cfe0ff', 38);
      }
    }
  }

  startPartGate() {
    if (this.partGate || !this.player?.alive) return;
    const targetPart = Math.min(3, (this.stagePart || 1) + 1);
    this.partGate = {
      targetPart, progress: 0, t: 0, idleT: 0, milestone: 0, stepAcc: 0, idleHintShown: false,
    };
    this.wavePause = 1;
    this.wavePauseTotal = 1;
    if (this.player) {
      this.player.attack = null;
      this.player.face = 1;
      this.player.vx = Math.max(this.player.vx, this.player.speed * 0.35);
    }
    ensureTipsSeen();
    if (!save.tipsSeen.partGate) {
      save.tipsSeen.partGate = 1;
      persist();
      this.modeHintLine = IS_TOUCH ? t('hud.partGateTouch') : t('hud.partGateKb');
      this.hint = 5.5;
    }
    try { AudioSys.sfx('travel'); } catch (_) {}
    this.shake(motionReduced() ? 0 : 3, 0.12);
  }

  completePartGate() {
    if (!this.partGate || this.partGate.completing) return;
    this.partGate.completing = true;
    const part = this.partGate.targetPart;
    this.stagePart = part;
    this.partFlashT = motionReduced() ? 0.22 : 0.55;
    this.floater(W / 2, 96, t('combat.checkpoint', { part }), '#7cf5ff', 17);
    try { this.banner(t('combat.checkpoint', { part }), 1.15, '#7cf5ff', 40); } catch (_) {}
    const tw = Math.min(320, W * 0.5);
    const orbX = W / 2 - tw / 2 + clamp(this.progressSmooth || 0, 0, 1) * tw;
    if (!fxLite()) this.burst(orbX, 44, '#7cf5ff', motionReduced() ? 6 : 14, { kind: 'spark', size: 2.4 });
    try { AudioSys.sfx('checkpoint'); } catch (_) {}
    haptic(14);
    this.partGate = null;
    this.wavePause = 0.85;
    this.wavePauseTotal = 0.85;
    if (this.player) {
      this.player.attack = null;
      this.player.vx = Math.max(this.player.vx, 60);
    }
  }

  /** Dode vijanden direct van het veld — geen vastgelopen dood-animatie tussen golven. */
  purgeDeadMonsters() {
    if (!this.monsters || !this.monsters.length) return;
    this.monsters = this.monsters.filter((m) => m && m.alive);
  }

  /** Speler-jutsu orbs tussen golven opruimen — geen zwevende Rasengan na wave-clear. */
  purgePlayerProjectiles() {
    if (!this.projectiles?.length) return;
    this.projectiles = this.projectiles.filter((p) => p && p.from !== 'player' && p.from !== 'p1');
  }

  updatePartGate(dt) {
    if (!this.partGate || !this.player?.alive) {
      this.partGate = null;
      return;
    }
    const pg = this.partGate;
    const move = partGateMoveSignal(this);
    pg.t = (pg.t || 0) + dt;
    pg.walking = move > 0.05;
    if (pg.walking) {
      pg.idleT = 0;
      pg.idleHintShown = false;
      pg.progress = Math.min(1, (pg.progress || 0) + dt / PART_GATE_WALK_SEC);
      this.worldX = (this.worldX || 0) + dt * (115 + move * 175);
      const tick = Math.floor((pg.progress || 0) * 3);
      if (tick > (pg.milestone || 0)) {
        pg.milestone = tick;
        try { AudioSys.sfx('step'); } catch (_) {}
        if (tick < 3) haptic(5);
      }
      pg.stepAcc = (pg.stepAcc || 0) + dt;
      if (pg.stepAcc >= 0.34) {
        pg.stepAcc = 0;
        if (!fxLite() && !motionReduced()) {
          this.burst(this.player.x + 14, this.player.y - 6, '#c9b691', 2, { kind: 'spark', size: 2 });
        }
      }
    } else if (move < -0.05 && (pg.progress || 0) > 0) {
      pg.progress = Math.max(0, pg.progress - (dt / PART_GATE_WALK_SEC) * PART_GATE_DECAY_MUL);
      this.worldX = (this.worldX || 0) + dt * 16;
      pg.idleT = (pg.idleT || 0) + dt;
    } else {
      this.worldX = (this.worldX || 0) + dt * 24;
      pg.idleT = (pg.idleT || 0) + dt;
    }
    if (pg.idleT >= PART_GATE_IDLE_HINT && !pg.idleHintShown) {
      pg.idleHintShown = true;
      this.floater(this.player.x, this.player.y - 102, t('combat.partGateIdle'), '#ffd75e', 13);
      this.modeHintLine = IS_TOUCH ? t('hud.partGateTouch') : t('hud.partGateKb');
      this.hint = Math.max(this.hint || 0, 3.5);
    }
    const targetX = W * PART_GATE_PLAYER_X;
    if (this.player.x < targetX - 6) {
      this.player.x += (targetX - this.player.x) * Math.min(1, dt * 5);
    }
    if (pg.progress >= 1) this.completePartGate();
  }

  /** 0..1 voortgang door het level (golven + kills binnen golf). */
  stageProgress() {
    if (!this.level || !this.level.waves) return 0;
    const total = this.level.waves.length;
    if (this.waveIdx < 0) return 0;
    if (this.waveIdx >= total) return 1;
    let frac;
    if (this.wavePause > 0) {
      frac = 1;
    } else {
      const size = Math.max(1, this.waveTotal || 1);
      const remaining = this.spawnQueue.length + this.monsters.filter((m) => m.alive).length;
      frac = clamp(1 - remaining / size, 0, 1) * 0.85;
    }
    return clamp((this.waveIdx + frac) / total, 0, 1);
  }

  updateAdventure(dt) {
    syncTideBattleState(this);
    // Bewegend decor: tussen golven "loopt" de wereld door (à la beat 'em up)
    const travelPhase = this.wavePause > 0 || (this.betweenT > 0 && this.waveIdx < 0) || !!this.partGate;
    this.traveling = travelPhase && !!(this.player && this.player.alive) && !this.over;
    // Deel 3: camera-punch bij vertrek, zwaardere beat bij aankomst op de baas
    if (this.traveling && !this.travelWasOn) {
      this.shake(motionReduced() ? 2 : 5, 0.22);
      this.bossBeatPlayed = false;
      this._travelStepT = 0;
      try { AudioSys.sfx('travel'); } catch (_) {}
      if (!fxLite() && !motionReduced() && this.player) {
        this.burst(this.player.x - 18, this.player.y - 8, '#c9b691', 9, { kind: 'spark', size: 2.2 });
      }
    } else if (!this.traveling && this.travelWasOn) {
      if (isBossWave(this.level, this.waveIdx)) {
        this.shake(motionReduced() ? 3 : 9, 0.35);
        this.freezeT = Math.max(this.freezeT, 0.06);
        this.bossArriveT = motionReduced() ? 0.3 : 0.7;
        haptic(24);
        try { AudioSys.sfx('bossArrive'); } catch (_) {}
      }
    }
    this.travelWasOn = this.traveling;
    if (this.traveling) {
      this.worldX = (this.worldX || 0) + dt * (isBossWave(this.level, this.waveIdx + 1) ? 220 : 165);
      this._travelStepT = (this._travelStepT || 0) + dt;
      if (this._travelStepT >= 0.38) {
        this._travelStepT = 0;
        try { AudioSys.sfx('step'); } catch (_) {}
      }
    }
    // Baas-aankomst-beat: halverwege de reis naar de baas-golf één roar
    if (this.wavePause > 0 && isBossWave(this.level, this.waveIdx + 1) && !this.bossBeatPlayed) {
      const f = 1 - this.wavePause / (this.wavePauseTotal || 1);
      if (f > 0.45) {
        this.bossBeatPlayed = true;
        try { AudioSys.sfx('bossWait'); } catch (_) {}
        this.floater(W / 2, 120, t('combat.bossWaits'), '#ff8a9a', 15, 'hud');
      }
    }
    if (this.partFlashT > 0) this.partFlashT -= dt;
    if (this.bossArriveT > 0) this.bossArriveT -= dt;
    if (this.partGate) this.updatePartGate(dt);
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    try { AudioSys.setCombatHeat(Math.min(1, (this.combo || 0) / 12 + (this.killStreak || 0) / 14)); } catch (_) {}
    if (this.dmgBuffT > 0) {
      this.dmgBuffT -= dt;
      if (this.dmgBuffT <= 0) this.dmgBuffMul = 1;
    }
    if (this.playerShieldT > 0) this.playerShieldT -= dt;
    if (this.masterSwordT > 0) {
      this.masterSwordT -= dt;
      if (this.masterSwordT <= 0) this.deactivateMasterSword(false);
    }
    if (this.stageAlly && this.player && this.player.alive && this.monsters.some((m) => m.alive)) {
      this.allyAssistT = (this.allyAssistT || 0) - dt;
      if (this.allyAssistT <= 0) {
        const allyId = this.stageAlly.id;
        this.allyAssistT = allyId === 'dawn' ? 3.6 : (allyId === 'tide' ? 4.2 : 5);
        const tgt = this.monsters.reduce((best, m) => {
          if (!m.alive) return best;
          const d = Math.abs(m.x - this.player.x);
          return !best || d < Math.abs(best.x - this.player.x) ? m : best;
        }, null);
        if (tgt) {
          const dmg = Math.round(this.player.baseDmg * 0.38 * (this.stageDmgMul || 1));
          const kb = allyId === 'tide' ? 180 : 140;
          tgt.takeDamage(dmg, Math.sign(tgt.x - this.player.x) * kb, this);
          this.floater(tgt.x, tgt.y - tgt.size - 22, t('combat.allyHit', { name: this.stageAlly.name, dmg }), this.stageAlly.color || '#7cf5ff', 12);
          try {
            if (allyId === 'tide') {
              AudioSys.sfxAt('tideSurge', tgt.x);
              if (this.player) {
                const micro = Math.max(1, Math.round(this.player.maxhp * 0.012));
                this.player.hp = Math.min(this.player.maxhp, this.player.hp + micro);
              }
            } else {
              AudioSys.sfxAt(typeof jutsuSwooshSfx === 'function' ? jutsuSwooshSfx('rasengan') : 'skillSwoosh', tgt.x);
            }
          } catch (_) {}
          const burstN = allyId === 'tide' ? 9 : 6;
          if (!fxLite()) this.burst(tgt.x, tgt.y - tgt.size * 0.4, this.stageAlly.color || '#7cf5ff', burstN, { kind: 'spark', size: 2 });
        }
      }
    }
    const p = this.player;
    for (const pk of this.pickups) {
      pk.t += dt;
      pk.bob = Math.sin(pk.t * 5) * 6;
      pk.life -= dt;
      if (!p.alive) continue;
      const dy = (p.y - 48) - pk.y;
      if ((p.x - pk.x) ** 2 + dy ** 2 < 44 * 44) {
        try { this.collectPickup(pk); } catch (pickErr) {
          try { sfReportError('pickup', pickErr, 'Pickup hiccup — gevecht gaat door'); } catch (_) {}
          pk.life = 0;
        }
      }
    }
    this.pickups = this.pickups.filter(pk => pk.life > 0);
    if (this.betweenT > 0) {
      this.betweenT -= dt;
      if (this.betweenT <= 0 && this.waveIdx < 0 && this.player?.alive) this.nextWave();
    }
    if (this.spawnQueue.length) {
      const alive = this.monsters.filter((m) => m.alive).length;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && alive < ADVENTURE_MAX_ALIVE) {
        const bossWave = isBossWave(this.level, this.waveIdx);
        const meta = this.level.waveMeta && this.level.waveMeta[this.waveIdx];
        const spawnMul = (meta && meta.spawnMul) || 1;
        const queueLeft = this.spawnQueue.length;
        const batch = queueLeft > 28 ? 3 : queueLeft > 14 ? 2 : 1;
        const intervalMul = queueLeft > 20 ? 0.72 : queueLeft > 10 ? 0.86 : 1;
        this.spawnTimer = (bossWave ? 0.92 : 0.38) * spawnMul * intervalMul;
        for (let b = 0; b < batch && this.spawnQueue.length && this.monsters.filter((m) => m.alive).length < ADVENTURE_MAX_ALIVE; b++) {
          const def = this.spawnQueue.shift();
          if (!def || !def.sp || !SPECIES[def.sp]) continue;
          const side = Math.random() < 0.75 ? 1 : -1;
          const x = (side > 0 ? W + 40 : -40) + b * side * 32;
          const mon = new Monster(def.sp, x, this, {
            elite: !!(def.elite || def.superBoss),
            superBoss: !!def.superBoss,
            giant: !!def.giant,
            bossCore: !!def.bossCore,
            levelN: this.level.n,
            hpMul: this.level.hpMul,
            dmgMul: this.level.dmgMul,
            speedMul: this.level.speedMul || 1,
            advDiff: this.advDiff || this.level.diff || 'normal',
            enrageMul: this.level.enrageMul || 1,
            enrageAt: this.level.enrageAt != null ? this.level.enrageAt : 0.5,
          });
          this.monsters.push(mon);
          if (def.superBoss) {
            triggerSpecialEnemyIntro(this, mon, 'superBoss');
          } else if (def.bossCore) {
            triggerSpecialEnemyIntro(this, mon, 'boss');
          } else if (def.elite) {
            triggerSpecialEnemyIntro(this, mon, bossWave ? 'boss' : 'elite');
          } else if (def.giant && !fxLite()) {
            this.floater(mon.x, mon.y - mon.size - 28, t('combat.giant'), '#ffd75e', 13);
          }
        }
      } else if (alive >= ADVENTURE_MAX_ALIVE) {
        this.spawnTimer = Math.min(this.spawnTimer, 0.12);
      }
    } else if (this.waveIdx >= 0 && this.monsters.every(m => !m.alive) && this.player?.alive) {
      if (!this.wavePause && !this.partGate) {
        this.purgeDeadMonsters();
        this.purgePlayerProjectiles();
        const nextIsBoss = isBossWave(this.level, this.waveIdx + 1);
        const total = this.level.waves.length;
        const isLastWave = this.waveIdx >= total - 1;
        const boundary = partBoundaryWaveIdx(total, this.stagePart || 1);
        if (this.stagePart < 3 && this.waveIdx === boundary) {
          this.startPartGate();
        } else if (isLastWave) {
          // Duidelijk einde vóór resultaat-scherm (start → stage klaar)
          this.wavePause = motionReduced() ? 1.1 : 2.35;
          this.wavePauseTotal = this.wavePause;
          this._levelClearPending = true;
          try {
            this.banner(t('banner.levelClear', { n: this.level.n }), 2.1, '#7cfc8a', 52);
            AudioSys.sfx('win');
            if (!fxLite() && !motionReduced()) {
              this.burst(W * 0.5, this.ground - 70, '#7cfc8a', 18, { kind: 'spark', size: 2.6 });
              spawnFxRing(this, W * 0.5, this.ground - 70, '#ffd75e', 16);
            }
          } catch (_) {}
        } else {
          this.wavePause = nextIsBoss ? 2.15 : 1.55;
          this.wavePauseTotal = this.wavePause;
        }
        const waveHeal = Math.max(4, Math.round(this.player.maxhp * 0.06));
        this.player.hp = Math.min(this.player.maxhp, this.player.hp + waveHeal);
        this.player.energy = clamp(this.player.energy + 8, 0, 100);
        this.floater(this.player.x, this.player.y - 88, t('banner.waveClear', { heal: waveHeal }), '#6ee06e', 14);
        if (this.stageHealBetween > 0) {
          const heal = Math.max(8, Math.round(this.player.maxhp * this.stageHealBetween));
          this.player.hp = Math.min(this.player.maxhp, this.player.hp + heal);
          const allyName = this.stageAlly ? this.stageAlly.name : '';
          const healMsg = this.stageAlly && this.stageAlly.id === 'tide'
            ? t('combat.tideHeal', { heal, name: allyName })
            : t('combat.allyHeal', { heal });
          this.floater(this.player.x, this.player.y - 108, healMsg, '#6ee06e', 14);
          if (this.stageAlly && this.stageAlly.id === 'tide') {
            try { AudioSys.sfx('tideSurge'); } catch (_) {}
            if (!fxLite() && this.player) {
              this.burst(this.player.x, this.player.y - 52, '#6ee06e', 10, { kind: 'spark', size: 2.4 });
              this.burst(this.player.x, this.player.y - 68, '#7cf5ff', 5, { kind: 'spark', size: 1.8 });
            }
          }
        }
        try { AudioSys.sfx('waveClear'); } catch (_) {}
        if ((this.killStreak || 0) >= 5) {
          this.floater(W / 2, 112, t('combat.streakHold', { n: this.killStreak }), '#ffd75e', 15, 'hud');
        }
      }
      if (!this.partGate) {
        this.wavePause -= dt;
        if (this.wavePause <= 0) { this.wavePause = 0; this.nextWave(); }
      }
    }
    if (!this.player.alive && !this.over) this.finishAdventure(false);
  }

  finishAdventure(win) {
    if (this.over) return;
    clearTideBattleState(this, { restoreMusic: true });
    this.deactivateMasterSword(true);
    this.over = true;
    this.inputLocked = true;
    let stars = 0;
    const lv = this.level.n;
    const diff = normalizeAdvDiffId(this.advDiff || (this.level && this.level.diff) || currentAdvDiff());
    this.advDiff = diff;
    const prevStars = advStarsFor(lv, diff);
    if (win) {
      const bonus = Math.round((30 + lv * 10) * advXpMul(diff));
      this.grantXP(bonus);
      if (diff !== 'normal') {
        const coinN = Math.max(1, Math.round((3 + Math.floor(lv / 8)) * (typeof advPetCoinMul === 'function' ? advPetCoinMul(diff) : 1)));
        try {
          save.petCoins = (typeof petCoinsBalance === 'function' ? petCoinsBalance() : (save.petCoins || 0)) + coinN;
          this.petCoinsThisRun = (this.petCoinsThisRun || 0) + coinN;
          persist();
        } catch (_) {}
      }
      const unlocked = advUnlockedLevel(diff);
      if (lv === unlocked && unlocked < MAX_LEVEL) {
        setAdvUnlockedLevel(unlocked + 1, diff);
        persist();
      }
      if (lv % LEVELS_PER_ISLAND === 0) {
        if (diff === 'normal') {
          save.advIsland = Math.min(islandCount(), lv / LEVELS_PER_ISLAND);
          persist();
        }
        if (lv < MAX_LEVEL) {
          const nCap = adventureWeaponCapForLevel(lv + 1);
          const self = this;
          setTimeout(() => {
            try {
              if (!gameUiTimerOk(self, { allowOver: true })) return;
              UI.toast(t('toast.islandUnlock', { name: islandLabel(islandFromLevel(lv + 1), 'name'), cap: nCap }), 4200);
            } catch (_) {}
          }, 1700);
        }
      }
      if (lv === MAX_LEVEL) {
        const already = !!(save.advCleared && save.advCleared[diff]);
        markAdvDiffCleared(diff);
        persist();
        if (!already) {
          const self = this;
          setTimeout(() => {
            try {
              if (!gameUiTimerOk(self, { allowOver: true })) return;
              if (diff === 'normal') UI.toast(t('toast.diffUnlockNightmare'), 4800);
              else if (diff === 'nightmare') UI.toast(t('toast.diffUnlockHell'), 4800);
              else UI.toast(t('toast.diffHellCleared'), 4200);
            } catch (_) {}
          }, 1900);
        }
      }
      if (masterBuffLevel(diff) === lv) {
        setMasterBuffLevel(null, diff);
        persist();
      }
      const hpPct = this.player.hp / Math.max(1, this.player.maxhp);
      stars = starsFromHpPct(hpPct);
      if (stars > prevStars) { setAdvStarsFor(lv, stars, diff); persist(); }
      bumpStat('advWins', 1);
      bumpDaily('advWin', 1);
      try {
        const zwBoss = grantZoneBossClearWeapon(lv, diff);
        if (zwBoss) {
          try { noteRunLootWeapon(this.runLoot, zwBoss.id); } catch (_) {}
        }
      } catch (_) {}
      const eggBonus = maybeAdvEggBonus();
      if (eggBonus) {
        spawnGameEggPet(this);
        noteRunLootEgg(this.runLoot, eggBonus.def.name, eggBonus.duplicate);
        const rar = rarityOf(eggBonus.def.rarity);
        const self = this;
        setTimeout(() => {
          try {
            if (!gameUiTimerOk(self, { allowOver: true })) return;
            UI.toast(eggBonus.duplicate
              ? t('toast.eggDuplicate', { name: eggBonus.def.name })
              : t('toast.eggNew', { name: eggBonus.def.name, rar: rarityLabel(eggBonus.def.rarity) }), 3800);
          } catch (_) {}
        }, 1200);
      }
      checkAchievements();
      if (this._levelClearPending) {
        // Banner al getoond bij laatste golf — korte nabranding
        this._levelClearPending = false;
        try { AudioSys.sfx('bonus'); } catch (_) {}
      } else {
        AudioSys.sfx('win');
        this.banner(t('banner.levelClear', { n: lv }), 2, '#7cfc8a', 52);
      }
    } else {
      const hadMaster = masterBuffLevel(diff) === lv;
      const fails = bumpAdvFail(lv, diff);
      const gotMaster = fails >= 5 && !hadMaster;
      if (gotMaster) setMasterBuffLevel(lv, diff);
      persist();
      if (gotMaster) {
        const self = this;
        setTimeout(() => {
          try {
            if (!gameUiTimerOk(self, { allowOver: true })) return;
            UI.toast(t('toast.masterBuffGain'), 3800);
          } catch (_) {}
        }, 1500);
      }
      AudioSys.sfx('lose');
      this.banner(t('banner.lost'), 2, '#ff6b6b', 50);
    }
    // Resultaat-scherm altijd tonen (Volgende level / Opnieuw) — niet stil naar menu
    scheduleGameResult(this, win ? 1600 : 1400, () => UI.showResult(win, {
      title: win ? t('result.advWin') : t('result.advLose'),
      detail: (() => {
        const finishers = this.runFinishers ? t('result.finishersLine', { n: this.runFinishers }) : '';
        const streak = (this.sessionBestKillStreak || 0) >= 3
          ? t('result.streakLine', { n: this.sessionBestKillStreak }) : '';
        let base = win
          ? t('result.advDetailWin', { lv, kills: this.kills, stars, combo: this.maxCombo || 0, finishers, streak })
          : t('result.advDetailLose', { lv, kills: this.kills, combo: this.maxCombo || 0, finishers, streak });
        if (diff !== 'normal') {
          base = t('result.advDiffLine', { diff: advDiffLabel(diff) }) + base;
        }
        if (masterBuffActive(lv, diff) && !win) base += t('result.masterBuffActive');
        if (this.gambleRoll && this.gambleRoll.outcome !== 'neutral') {
          base += t('result.gambleLine', {
            text: gambleOutcomeLabelFromKey(this.gambleRoll).replace(/^[^!]+!?\s*/, '').slice(0, 48),
          });
        }
        return base;
      })(),
      xp: this.sessionXP,
      mode: 'adventure', level: this.level.n, win, stars, prevStars, difficulty: diff,
      tip: win ? (stars >= 3 ? t('result.perfectRun') : (stars > prevStars
        ? t('result.starImproved', { stars, prev: prevStars })
        : t('result.pickupsHelp', { hint: starHintLine() }))) : (() => {
        const prog = this.waveIdx >= 0 ? t('result.wavesProg', { cur: this.waveIdx + 1, total: this.level.waves.length }) : 'start';
        const base = this.player.hp <= 0
          ? t('result.lossBlockTip', { prog })
          : t('result.lossOrbTip', { prog });
        const once = onceResultTip('adventure', 'loss',
          t('result.lossGambleTip'));
        return once ? `${once} · ${base}` : base;
      })(),
    }));
  }

  onMonsterKilled(m) {
    // Kill-rewards + zeldzame rolls (summon/tide/dex-rariteit) mogen NOOIT de run crashen
    try {
      this._onMonsterKilledInner(m);
    } catch (err) {
      try { sfReportError('onMonsterKilled', err, 'Kill-reward hiccup — gevecht gaat door'); } catch (_) {}
    }
  }

  _onMonsterKilledInner(m) {
    if (!m) return;
    this.kills++;
    this.killStreak = (this.killStreak || 0) + 1;
    const ks = this.killStreak;
    if ([3, 5, 8, 12].includes(ks)) {
      const msgs = { 3: 'STREAK ×3', 5: 'ON FIRE!', 8: 'RAMPAGE!', 12: 'UNSTOPPABLE!' };
      try { this.floater(W / 2, 128, msgs[ks], ks >= 8 ? '#ff7a4d' : '#ffd75e', 17); } catch (_) {}
      try { AudioSys.sfx(ks >= 8 ? 'comboEpic' : 'combo'); } catch (_) {}
      if (!motionReduced() && !fxLite()) {
        try { spawnFxRing(this, m.x, m.y - m.size * 0.35, ks >= 8 ? '#ff7a4d' : '#ffd75e', 7 + ks * 0.35); } catch (_) {}
      }
      try { haptic(8 + Math.min(ks, 12)); } catch (_) {}
    }
    this.freezeT = Math.max(this.freezeT || 0, 0.045 + Math.min(ks, 12) * 0.002);
    try { this.shake(5, 0.18); } catch (_) {}
    try { haptic(12); } catch (_) {}
    const sp = m.sp || {};
    const rar = rarityOf(sp.rarity);
    const killRingR = m.superBoss ? 18 : (m.elite ? 14 : (m.giant ? 12 : 9));
    try { spawnFxRing(this, m.x, m.y - m.size * 0.32, rar.color, killRingR); } catch (_) {}
    if (!fxLite() && m.elite && !motionReduced()) {
      try { this.burst(m.x, m.y - m.size * 0.2, '#fff', 4, { kind: 'spark', size: 2.2 }); } catch (_) {}
    }
    const dropChance = m.elite ? 0.42 : 0.22;
    if (Math.random() < dropChance) {
      try { this.spawnPickup(m.x, m.y - m.size * 0.5); } catch (_) {}
    }
    if (this.mode === 'adventure') {
      try {
        const skillId = rollSkillShardDrop(m);
        if (skillId) {
          let dropTier = 'normal';
          if (m.superBoss) dropTier = 'superBoss';
          else if (m.elite) dropTier = 'elite';
          else if (m.giant) dropTier = 'giant';
          this.spawnPickup(m.x + rand(-18, 18), m.y - m.size * 0.35, { skillId, dropTier });
        }
      } catch (_) {}
      try {
        const itemDrop = rollItemShardDrop(m);
        if (itemDrop) {
          let dropTier = 'normal';
          if (m.superBoss) dropTier = 'superBoss';
          else if (m.elite) dropTier = 'elite';
          else if (m.giant) dropTier = 'giant';
          this.spawnPickup(m.x + rand(-22, 22), m.y - m.size * 0.45, { itemCat: itemDrop.cat, itemId: itemDrop.id, dropTier });
        }
      } catch (_) {}
      try {
        const zw = rollZoneWeaponDrop(this, m);
        if (zw) {
          try { noteRunLootWeapon(this.runLoot, zw.id); } catch (_) {}
        }
      } catch (_) {}
    }
    try { bumpStat('kills', 1); } catch (_) {}
    try { bumpDaily('kills', 1); } catch (_) {}
    if (m.elite) {
      try { bumpStat('bossKills', 1); } catch (_) {}
      try { bumpDaily('bossKill', 1); } catch (_) {}
    }
    const lvlScale = 1 + (this.level ? (this.level.n - 1) * 0.1 : 0);
    const rarMul = 1 + (rar.order || 0) * 0.15;
    const giantMul = m.giant ? GIANT_XP_MUL : 1;
    const bossMul = m.colossal ? COLOSSAL_XP_MUL : (m.bossCore ? 1.25 : 1);
    const xp = Math.round((sp.xp || 8) * lvlScale * rarMul * (m.elite ? 2 : 1) * giantMul * bossMul);
    try { this.grantXP(xp); } catch (_) {}
    try { this.floater(m.x, m.y - m.size - 30, `+${xp} XP`, rar.color, 16); } catch (_) {}
    if ((rar.order || 0) >= 3) {
      try { this.floater(m.x, m.y - m.size - 50, String(rar.name || 'EPIC').toUpperCase(), rar.color, 13); } catch (_) {}
    }
    if (this.player) {
      this.player.energy = clamp((this.player.energy || 0) + 12 + (rar.order || 0) * 2, 0, 100);
    }
    const tiersBefore = typeof dexRarityTierCount === 'function' ? dexRarityTierCount() : 0;
    const countBefore = typeof dexCount === 'function' ? dexCount() : 0;
    if (m.spId && save.dex && !save.dex[m.spId]) {
      save.dex[m.spId] = 0;
      try { persist(); } catch (_) {}
      try { AudioSys.sfx('newmonster'); } catch (_) {}
      const hpB = rarityHpBonus(sp.rarity);
      try { noteRunLootDex(this.runLoot, sp, hpB); } catch (_) {}
      try {
        this.banner(t('banner.newDex', { rar: rarityLabel(sp.rarity), name: sp.name || m.spId, hp: hpB }), 2.0, rar.color, 28);
      } catch (_) {}
      if (this.player) {
        this.player.maxhp += hpB;
        this.player.hp += hpB;
      }
      try { UI.toast(t('toast.dexDiscover', { rar: rarityLabel(sp.rarity), name: sp.name || m.spId, hp: hpB }), 3200); } catch (_) {}
    }
    if (m.spId && save.dex) {
      save.dex[m.spId] = (save.dex[m.spId] || 0) + 1;
      try { persist(); } catch (_) {}
    }
    try {
      const tame = maybeTamePet(m.spId);
      if (tame) {
        save.stats = save.stats || {};
        save.stats.petsTamed = petTamedCount();
        persist();
        spawnGamePet(this);
        noteRunLootPet(this.runLoot, tame.sp.name);
        this.banner(t('banner.pet', { name: tame.sp.name }), 2.2, tame.sp.c1, 36);
        UI.toast(t('toast.petTamed', { name: tame.sp.name, cur: tame.kills, need: tame.need }), 4200);
      }
    } catch (_) {}
    try { checkAchievements(); } catch (_) {}
    try {
      if (countBefore < dexCount()) {
        const half = Math.ceil(SPECIES_ORDER.length / 2);
        if (countBefore < half && dexCount() >= half) {
          UI.toast(t('toast.styleUnlockTome'), 3500);
        }
        if (tiersBefore < 4 && dexRarityTierCount() >= 4) {
          UI.toast(t('toast.styleUnlockCrystal'), 3500);
        }
      }
    } catch (_) {}
    if (m.tideBoss && this.tideBattleActive) {
      try { this.finishTideBattle(true, m); } catch (_) {}
      return;
    }
    // summon / tide / master-sword rolls UIT — stabiele adventure flow
  }

  maybeTideBattle(m) {
    return; // UIT — geen zeldzame tide-interrupt
  }

  /** Summon-ascend UIT — geen epic/legendary rariteit-rolls midden in gevecht. */
  maybeSummon(m) {
    return;
  }

  startTideBattle(spId) {
    if (this.mode !== 'adventure' || this.over) return;
    if (!isTideBossId(spId)) return;
    if (this.tideBattleActive) return;
    if (!this.player || !this.player.alive) return;
    try {
      this.tideBattleActive = true;
      this.tideBattleBossId = spId;
      const spawnX = tideBattleSpawnX(this);
      const mon = new Monster(spId, spawnX, this, tideBossSpawnOpts(this));
      if (!mon || !mon.sp) throw new Error('tide spawn invalid');
      this.monsters.push(mon);
      this.tideBattleMon = mon;
      triggerTideBattleIntro(this, mon);
      const firstTide = typeof tideBattleOnboardPending === 'function' && tideBattleOnboardPending();
      if (firstTide) {
        if (typeof markTideBattleOnboardSeen === 'function') markTideBattleOnboardSeen();
        this.modeHintLine = typeof tideBattleOnboardHintLine === 'function'
          ? tideBattleOnboardHintLine(mon.sp.name)
          : `Tide Battle — versla ${mon.sp.name}!`;
        this.hint = 9;
      }
      this.floater(W / 2, Math.max(100, (this.advHudBottom || 120) + 24), t('hud.tideBattleShort'), '#4a9fff', 18);
      if (!firstTide) {
        UI.toast(t('toast.tideBattle', { name: mon.sp.name }), 3200);
      }
    } catch (err) {
      console.error('[TideBattle] start', err);
      clearTideBattleState(this, { restoreMusic: true });
      reportTideBattleRecover('spawn', err);
    }
  }

  finishTideBattle(won, m) {
    if (!this.tideBattleActive) return;
    try {
      const bossId = (m && m.spId) || this.tideBattleBossId;
      clearTideBattleState(this, { restoreMusic: true });
      if (!won) return;
      const sp = (m && m.sp) || (bossId && SPECIES[bossId]) || null;
      if (!sp) return;
      const xp = tideBattleRewardXp(this);
      const coins = tideBattleRewardCoins();
      const p = this.player;
      const snap = {
        xp: save.xp,
        lvl: save.lvl,
        petCoins: save.petCoins || 0,
        tideWins: save.stats.tideBattleWins || 0,
        sessionXP: this.sessionXP || 0,
        maxhp: p ? p.maxhp : 0,
        baseDmg: p ? p.baseDmg : 0,
        hp: p ? p.hp : 0,
      };
      this.grantXP(xp, { deferPersist: true });
      save.petCoins = snap.petCoins + coins;
      save.stats.tideBattleWins = snap.tideWins + 1;
      if (!persistOrToast('tide-battle')) {
        save.xp = snap.xp;
        save.lvl = snap.lvl;
        save.petCoins = snap.petCoins;
        save.stats.tideBattleWins = snap.tideWins;
        this.sessionXP = snap.sessionXP;
        if (p) {
          p.maxhp = snap.maxhp;
          p.baseDmg = snap.baseDmg;
          p.hp = snap.hp;
        }
        return;
      }
      this.banner(t('banner.tideBattleWin'), 2.2, '#4a9fff', 44);
      UI.toast(t('toast.tideBattleWin', { xp, coins }), 4200);
      this.floater(W / 2, 140, `+${xp} XP · +${coins} 🪙`, '#4a9fff', 17);
      try { AudioSys.sfx('win'); } catch (_) {}
      checkAchievements();
    } catch (err) {
      console.error('[TideBattle] finish', err);
      clearTideBattleState(this, { restoreMusic: true });
      sfReportError('tideBattle/finish', err, 'Tide Battle beloning mislukt — voortgang veilig');
    }
  }

  spawnPickup(x, y, opts) {
    opts = opts || {};
    const pos = this.clampPickupPos(x, y);
    x = pos.x;
    y = pos.y;
    if (opts.skillId && SKILL_DEFS[opts.skillId]) {
      this.pickups.push({
        x, y, kind: 'skill_shard', skillId: opts.skillId, dropTier: opts.dropTier || 'normal',
        t: rand(0, TAU), life: SHARD_PICKUP_LIFE, bob: 0,
      });
      if (opts.dropTier && opts.dropTier !== 'normal') {
        try { AudioSys.sfxAt('bell', x); } catch (_) {}
      }
      return;
    }
    if (opts.itemCat && opts.itemId && itemUpgradeEligible(opts.itemCat, opts.itemId)) {
      this.pickups.push({
        x, y, kind: 'item_shard', itemCat: opts.itemCat, itemId: opts.itemId, dropTier: opts.dropTier || 'normal',
        t: rand(0, TAU), life: SHARD_PICKUP_LIFE, bob: 0,
      });
      if (opts.dropTier && opts.dropTier !== 'normal') {
        try { AudioSys.sfxAt('bell', x); } catch (_) {}
      }
      return;
    }
    const kind = choice(PICKUP_TYPES);
    this.pickups.push({ x, y, kind, t: rand(0, TAU), life: GENERIC_PICKUP_LIFE, bob: 0 });
  }

  /** Houd pickups (vooral shards) binnen het speelveld — geen spawns off-screen. */
  clampPickupPos(x, y) {
    const padX = 32;
    const minX = (this.minX != null ? this.minX : 40) + padX;
    const maxX = (this.maxX != null ? this.maxX : W - 40) - padX;
    const gy = this.ground != null ? this.ground : playfieldGroundY(H, W);
    const minY = gy - 168;
    const maxY = gy - 28;
    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
    };
  }

  collectPickup(pk) {
    if (pk._got) return;
    pk._got = true;
    const meta = PICKUP_META[pk.kind] || PICKUP_META.heal;
    const p = this.player;
    const rareDrop = pk.dropTier === 'superBoss' || pk.dropTier === 'elite' || pk.dropTier === 'giant';
    if (pk.kind === 'skill_shard' || pk.kind === 'item_shard') {
      if (rareDrop) {
        try { AudioSys.sfx('megaDrop'); } catch (_) {}
        haptic(pk.dropTier === 'superBoss' ? 28 : 18);
      } else {
        AudioSys.sfx('pickup');
        haptic(20);
      }
    } else {
      AudioSys.sfx('pickup');
      haptic(20);
    }
    switch (pk.kind) {
      case 'skill_shard': {
        const sid = pk.skillId;
        if (!sid || !SKILL_DEFS[sid]) break;
        addSkillShards(sid, 1);
        const def = SKILL_DEFS[sid];
        const col = def.color;
        const lbl = skillLabel(sid);
        this.floater(p.x, p.y - 100, t('combat.pickupSkillShard', { name: lbl }), col, 15);
        if (skillCanUpgrade(sid)) {
          try { UI.toast(t('toast.skillUpgradeReady', { name: lbl }), 2800); } catch (_) {}
        }
        break;
      }
      case 'item_shard': {
        const cat = pk.itemCat;
        const iid = pk.itemId;
        if (!cat || !iid || !itemUpgradeEligible(cat, iid)) break;
        if (addItemShards(cat, iid, 1) <= 0) break;
        const lbl = itemUpgradeLabel(cat, iid);
        const col = itemUpgradeColor(cat, iid);
        this.floater(p.x, p.y - 100, t('combat.pickupItemShard', { name: lbl }), col, 15);
        if (itemCanUpgrade(cat, iid)) {
          try { UI.toast(t('toast.itemUpgradeReady', { name: lbl }), 2800); } catch (_) {}
        }
        break;
      }
      case 'heal':
        p.hp = Math.min(p.maxhp, p.hp + Math.round(p.maxhp * 0.28));
        noteRunLootPickup(this.runLoot, 'heal');
        this.floater(p.x, p.y - 100, t('combat.pickupHp'), meta.color, 16);
        break;
      case 'rage':
        this.dmgBuffMul = 1.38;
        this.dmgBuffT = 9;
        noteRunLootPickup(this.runLoot, 'rage');
        this.floater(p.x, p.y - 100, t('combat.pickupRage'), meta.color, 16);
        break;
      case 'chakra':
        p.energy = 100;
        noteRunLootPickup(this.runLoot, 'chakra');
        this.floater(p.x, p.y - 100, t('combat.pickupChakra'), meta.color, 16);
        break;
      case 'shield':
        this.playerShieldT = 6.5;
        noteRunLootPickup(this.runLoot, 'shield');
        this.floater(p.x, p.y - 100, t('combat.pickupShield'), meta.color, 16);
        break;
    }
    this.banner(pickupLabel(pk.kind, pk.skillId, pk.itemCat, pk.itemId), 0.9,
      (pk.kind === 'skill_shard' && SKILL_DEFS[pk.skillId]) ? SKILL_DEFS[pk.skillId].color
        : (pk.kind === 'item_shard' && pk.itemCat && pk.itemId) ? itemUpgradeColor(pk.itemCat, pk.itemId)
          : meta.color, 28);
    this.burst(pk.x, pk.y,
      (pk.kind === 'skill_shard' && SKILL_DEFS[pk.skillId]) ? SKILL_DEFS[pk.skillId].color
        : (pk.kind === 'item_shard' && pk.itemCat && pk.itemId) ? itemUpgradeColor(pk.itemCat, pk.itemId)
          : meta.color, 14);
    bumpStat('pickups', 1);
    bumpDaily('pickups', 1);
    pk.life = 0;
  }

  /* --------------------------- TRAINING ------------------------------- */
  initTraining() {
    this.theme = 'dojo';
    this.roundsP = 0; this.roundsR = 0;
    this.trainRoundLog = [];
    this.round = 0;
    this.roundTimer = 60;
    this.phase = 'intro'; this.phaseT = 0;
    const diff = 1 + Math.min(save.trainWins * 0.15, 1.2) + (save.lvl - 1) * 0.03;
    this.robot = new Fighter({
      isRobot: true, name: 'RabbitRobot',
      x: W * 0.75, y: this.ground, face: -1,
      color: '#b8c4d8', lineW: 5.5,
      hp: 1, maxhp: 1,
      baseDmg: 8 + save.lvl * 1.3 + save.trainWins * 0.8,
      speed: 230 + Math.min(save.trainWins * 8, 80),
      weapon: weaponById('vuist'),
    });
    this.robot.aiDiff = diff;
    this.robotMaxHp = Math.round(110 + save.lvl * 9 + save.trainWins * 14);
    this.trainTelegraphT = 0;
    this.trainMeleeTelegraphT = 0;
    this.trainMeleeTelegraphMax = 0.32;
    this.trainTelegraphKind = null;
    this.trainLaserCd = rand(5, 8);
    this.trainLaserTelegraph = 0;
    this.trainComboBest = 0;
    this.trainComboGoals = {};
    this.startRound();
    AudioSys.play('training');
  }

  startRound() {
    this.round++;
    this.roundTimer = 60;
    const st = playerStats();
    this.player.hp = this.player.maxhp = st.maxhp;
    this.player.x = W * 0.25; this.player.y = this.ground; this.player.vx = 0; this.player.face = 1;
    this.player.attack = null; this.player.hurtT = 0; this.player.energy = 30;
    resetWeaponCombo(this.player);
    this.robot.hp = this.robot.maxhp = this.robotMaxHp;
    this.robot.x = W * 0.75; this.robot.y = this.ground; this.robot.vx = 0; this.robot.face = -1;
    this.robot.attack = null; this.robot.hurtT = 0; this.robot.deadT = 0;
    resetWeaponCombo(this.robot);
    this.phase = 'intro'; this.phaseT = 0;
    this.inputLocked = true;
    this.trainLaserCd = rand(4, 7);
    this.trainLaserTelegraph = 0;
    this.trainMeleeTelegraphT = 0;
    this.trainTelegraphKind = null;
    this.combo = 0;
    this.comboT = 0;
    this.banner(`RONDE ${this.round}`, 1.1, '#ffd75e', 52);
    AudioSys.sfx('bell');
  }

  updateTrainingLasers(dt) {
    if ((this.trainDummyGrace || 0) > 0) return;
    if (this.phase !== 'fight' || !this.robot?.alive || !this.player?.alive) return;
    if (this.robot.attack || this.robot.hurtT > 0) {
      if ((this.trainLaserCd || 0) <= 0.5) this.trainLaserCd = rand(1.8, 3.2);
      return;
    }
    if (this.trainLaserTelegraph > 0) {
      this.trainLaserTelegraph -= dt;
      this.trainTelegraphT = Math.max(this.trainTelegraphT || 0, this.trainLaserTelegraph);
      if (this.trainLaserTelegraph <= 0) this.fireTrainingLaser();
      return;
    }
    if ((this.trainLaserCd || 0) > 0) {
      this.trainLaserCd -= dt;
      return;
    }
    if (!this.player.onGround) {
      this.trainLaserCd = rand(2.5, 4.5);
      return;
    }
    const pLow = this.player.hp / Math.max(1, this.player.maxhp) < 0.32;
    if (pLow && Math.random() < 0.38) {
      this.trainLaserCd = rand(3.2, 5.5);
      return;
    }
    const diff = Math.min(1.5, (this.robot.aiDiff || 1) * (pLow ? 0.88 : 1));
    this.trainLaserTelegraph = 0.95;
    this.trainLaserCd = rand(8, 12) / diff;
    this.floater(this.robot.x, this.robot.y - 148, t('combat.earLaser'), '#ff9a9a', 15);
    haptic(8);
  }

  fireTrainingLaser() {
    const r = this.robot;
    if (!r || !r.alive) return;
    const dir = Math.sign(this.player.x - r.x) || -1;
    const y = r.y - 52;
    const dmg = Math.min(20, Math.round(8 + save.lvl * 0.35 + save.trainWins * 0.35));
    this.spawnProjectile({
      x: r.x + dir * 30, y,
      vx: dir * 480, vy: 0, r: 13, dmg,
      from: 'enemy', kind: 'robolaser', life: 0.6, grav: 0,
    });
    AudioSys.sfx('laser');
    this.shake(3, 0.1);
  }

  updateTraining(dt) {
    this.phaseT += dt;
    if (this.phase === 'intro') {
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner(t('banner.fight'), 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      if (this.comboT > 0) {
        this.comboT -= dt;
        if (this.comboT <= 0) this.combo = 0;
      }
      if (this.trainTelegraphT > 0) this.trainTelegraphT -= dt;
      if (this.trainMeleeTelegraphT > 0) this.trainMeleeTelegraphT -= dt;
      this.updateTrainingLasers(dt);
      this.roundTimer -= dt;
      const pDead = !this.player.alive, rDead = !this.robot.alive;
      if (pDead || rDead || this.roundTimer <= 0) {
        let pWin;
        const timedOut = !pDead && !rDead && this.roundTimer <= 0;
        if (rDead && !pDead) pWin = true;
        else if (pDead && !rDead) pWin = false;
        else pWin = (this.player.hp / Math.max(1, this.player.maxhp)) >= (this.robot.hp / Math.max(1, this.robot.maxhp));
        if (pWin) this.roundsP++; else this.roundsR++;
        this.trainRoundLog = this.trainRoundLog || [];
        this.trainRoundLog.push(pWin ? 'p' : 'r');
        this.trainComboBest = Math.max(this.trainComboBest || 0, this.trainRoundBest || 0);
        this.phase = 'roundend'; this.phaseT = 0;
        this.inputLocked = true;
        const roundCombo = this.trainRoundBest || 0;
        let msg = pWin ? t('banner.roundWon') : t('banner.roundLost');
        if (timedOut) {
          const hpP = Math.round(this.player.hp / Math.max(1, this.player.maxhp) * 100);
          const hpR = Math.round(this.robot.hp / Math.max(1, this.robot.maxhp) * 100);
          msg = t('banner.timeHpVs', { hp1: hpP, hp2: hpR, msg });
        }
        this.banner(msg, 1.6, pWin ? '#7cfc8a' : '#ff6b6b', 40);
        if (roundCombo >= 3) {
          this.floater(W / 2, 118, t('combat.roundCombo', { n: roundCombo }), '#ffd75e', 14, 'hud');
        }
        AudioSys.sfx(pWin ? 'win' : 'lose');
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseT > 2.2) {
        if (this.roundsP >= 2 || this.roundsR >= 2) this.finishTraining(this.roundsP >= 2);
        else this.startRound();
      }
    }
    this.robot.update(dt, this);
  }

  finishTraining(win) {
    if (this.over) return;
    this.over = true; this.inputLocked = true;
    let xp = 0;
    if (win) {
      save.trainWins++;
      persist();
      xp = 70 + Math.min(save.trainWins, 12) * 20;
      const best = this.trainComboBest || 0;
      if (best >= 10) xp += 30;
      else if (best >= 8) xp += 20;
      else if (best >= 5) xp += 10;
      this.grantXP(xp);
      bumpDaily('trainWin', 1);
      checkAchievements();
    }
    else { xp = 15; this.grantXP(xp); }
    const trainBest = this.trainComboBest || 0;
    const trainTip = win
      ? (trainBest >= 8
        ? `Combo-trainer: max ×${trainBest} — bonus XP!`
        : (save.trainWins === 3 ? 'Nieuwe stijl vrij: Chakra gloed — Instellingen → Stijl!' : 'Unlock stijlen door meer train-wins!'))
      : onceResultTip('training', 'loss', 'Spring tijdens CHIDORI-telegraph — robot mist · duck oor-lasers')
        || 'Tip: duck lasers · chakra vol → Rasengan';
    scheduleGameResult(this, 1400, () => UI.showResult(win, {
      title: win ? 'KAMPIOEN!' : 'ROBOT WINT...',
      detail: `RabbitRobot ${win ? 'verslagen' : 'was te sterk'} (${this.roundsP}-${this.roundsR}) · max combo ×${trainBest}` +
        (win ? ` · ${save.trainWins}x gewonnen` : ''),
      xp: this.sessionXP, mode: 'training', win,
      tip: trainTip,
    }));
  }

  initVersus(opts) {
    opts = opts || {};
    primePlayInput(true);
    this.theme = 'dojo';
    this.roundsP1 = 0;
    this.roundsP2 = 0;
    this.round = 0;
    this.vsRoundLog = [];
    this.p1Pick = normalizeVsPick(opts.p1 || vsSelect.p1, 'ryu');
    this.p2Pick = normalizeVsPick(opts.p2 || vsSelect.p2, 'ken');
    vsSelect.p1 = this.p1Pick;
    vsSelect.p2 = this.p2Pick;
    trackVsRosterUse(this.p1Pick, this.p2Pick);
    applyVsArenaBounds(this);
    this.matchFatality = false;
    this.pendingVsP1Win = null;
    this.player = buildVsFighter(vsRosterEntry(this.p1Pick), vsSpawnX(1), 1);
    this.p2 = buildVsFighter(vsRosterEntry(this.p2Pick), vsSpawnX(2), 2);
    this.startVsRound();
    AudioSys.play('versus');
  }

  startVsRound() {
    this.round++;
    this.roundTimer = 99;
    this.vsHints = this.vsHints || {};
    this.vsHints.timeLead = false;
    this.vsHints.mpToast = false;
    const e1 = vsRosterEntry(this.p1Pick);
    const e2 = vsRosterEntry(this.p2Pick);
    resetVsFighterRound(this.player, e1, this.ground, 1);
    resetVsFighterRound(this.p2, e2, this.ground, 2);
    this.phase = 'intro';
    this.phaseT = 0;
    this.inputLocked = true;
    const mp = this.roundsP1 === 1 || this.roundsP2 === 1;
    const decisive = this.roundsP1 === 1 && this.roundsP2 === 1;
    this.banner(decisive ? t('banner.roundDecisive', { n: this.round }) : (mp ? t('banner.roundMatchPoint', { n: this.round }) : t('banner.round', { n: this.round })), 1.1, decisive ? '#ff9a9a' : '#ffd75e', 52);
    AudioSys.sfx('bell');
  }

  updateVersus(dt) {
    this.phaseT += dt;
    if (this.phase === 'intro') {
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner(t('banner.fight'), 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      this.roundTimer -= dt;
      const hints = this.vsHints || (this.vsHints = {});
      // d3 c4: match-point toast once per round when someone is one win from match
      if (!hints.mpToast && this.phaseT > 0.4) {
        const mp1 = this.roundsP1 === 1 && this.roundsP2 < 2;
        const mp2 = this.roundsP2 === 1 && this.roundsP1 < 2;
        if (mp1 || mp2) {
          hints.mpToast = true;
          if (!(mp1 && mp2)) {
            this.floater(
              W / 2, 96,
              mp1 ? t('combat.vsMatchPointP1') : t('combat.vsMatchPointP2'),
              mp1 ? '#7cf5ff' : '#ffb0b8',
              15, 'hud'
            );
          }
        }
      }
      // d3 c4: HP-lead nudge in last 25s (TIME win reminder)
      if (!hints.timeLead && this.roundTimer <= 25 && this.roundTimer > 12) {
        hints.timeLead = true;
        const pct1 = this.player.hp / this.player.maxhp;
        const pct2 = this.p2.hp / this.p2.maxhp;
        const d = Math.round((pct1 - pct2) * 100);
        if (Math.abs(d) >= 8) {
          this.floater(
            W / 2, 108,
            d > 0 ? t('combat.vsHpLeadP1', { n: d }) : t('combat.vsHpLeadP2', { n: Math.abs(d) }),
            d > 0 ? '#7cf5ff' : '#ffb0b8',
            14, 'hud'
          );
        } else {
          this.floater(W / 2, 108, t('combat.vsHpEven'), '#ffd75e', 13, 'hud');
        }
      }
      const p1d = !this.player.alive, p2d = !this.p2.alive;
      if (p1d || p2d || this.roundTimer <= 0) {
        let p1Win;
        const timedOut = !p1d && !p2d && this.roundTimer <= 0;
        if (p2d && !p1d) p1Win = true;
        else if (p1d && !p2d) p1Win = false;
        else p1Win = (this.player.hp / this.player.maxhp) >= (this.p2.hp / this.p2.maxhp);
        const newP1 = p1Win ? this.roundsP1 + 1 : this.roundsP1;
        const newP2 = p1Win ? this.roundsP2 : this.roundsP2 + 1;
        const matchWin = newP1 >= 2 || newP2 >= 2;
        const koFinish = (p1d || p2d) && !timedOut && matchWin && !motionReduced();
        if (koFinish) {
          this.pendingVsP1Win = p1Win;
          this.fatalityWinner = p1Win ? this.player : this.p2;
          this.fatalityLoser = p1Win ? this.p2 : this.player;
          this.fatalityPerformed = false;
          this.fatalityStrikeT = 0;
          this.phase = 'fatality';
          this.phaseT = 0;
          this.inputLocked = true;
          this.banner(t('banner.vsFatality'), 2.8, '#ff3040', 54);
          AudioSys.sfx('roar');
        } else {
          if (p1Win) this.roundsP1++; else this.roundsP2++;
          this.vsRoundLog = this.vsRoundLog || [];
          this.vsRoundLog.push(p1Win ? 'p1' : 'p2');
          this.vsLastRoundP1Win = p1Win;
          this.vsLastTimedOut = timedOut;
          this.phase = 'roundend';
          this.phaseT = 0;
          this.inputLocked = true;
          let msg = p1Win ? t('banner.p1RoundWin') : t('banner.p2RoundWin');
          if (timedOut) {
            const hp1 = Math.round(this.player.hp / this.player.maxhp * 100);
            const hp2 = Math.round(this.p2.hp / this.p2.maxhp * 100);
            msg = t('banner.timeHpVs', { hp1, hp2, msg });
          }
          this.banner(msg, 1.5, p1Win ? '#7cf5ff' : '#ffb0b8', 38);
          AudioSys.sfx(p1Win ? 'win' : 'lose');
        }
      }
    } else if (this.phase === 'fatality') {
      this.updateFatality(dt);
    } else if (this.phase === 'roundend') {
      // d3 c4: punch/kick van P1 of P2 slaat countdown over (na 0.45s)
      if (this.phaseT > 0.45 && this.phaseT < 2.15) {
        const skip = (Input && (Input.take('punch') || Input.take('kick') || Input.take('weapon')))
          || (InputP2 && (InputP2.take('punch') || InputP2.take('kick') || InputP2.take('weapon')));
        if (skip) this.phaseT = 2.15;
      }
      if (this.phaseT > 2.2) {
        if (this.roundsP1 >= 2 || this.roundsP2 >= 2) this.finishVersus(this.roundsP1 >= 2);
        else this.startVsRound();
      }
    }
    if (this.p2) this.p2.update(dt, this);
  }

  updateFatality(dt) {
    this.phaseT += dt;
    if (this.fatalityStrikeT > 0) {
      this.fatalityStrikeT -= dt;
      if (this.fatalityStrikeT <= 0) this.endVsFatality();
      return;
    }
    if (this.phaseT > 3.5) {
      this.endVsFatality();
      return;
    }
    if (this.phaseT < 0.12) return;
    const win = this.fatalityWinner;
    if (!win) { this.endVsFatality(); return; }
    const pad = win.playerSlot === 2 ? InputP2 : Input;
    if (!pad) return;
    const strike = pad.take('weapon') || pad.take('punch') || pad.take('kick') || pad.take('special');
    if (strike) this.playVsFatality(win, this.fatalityLoser);
  }

  playVsFatality(winner, loser) {
    if (!winner || !loser || this.fatalityStrikeT > 0) return;
    this.fatalityPerformed = true;
    this.matchFatality = true;
    this.fatalityStrikeT = 1.55;
    winner.face = winner.x <= loser.x ? 1 : -1;
    winner.weaponComboIdx = 2;
    const wid = winner.weapon?.id || 'vuist';
    const labels = weaponMoveLabels(wid);
    const moveLabel = labels && labels[2] ? labels[2] : 'Finisher';
    const spec = winner.attackSpec(isThrowWeapon(wid) ? 'punch' : 'weapon');
    if (spec) {
      winner.attack = Object.assign({ t: 0, hasHit: true, fired: false, fatality: true }, spec);
      winner.attack.moveIdx = 2;
    }
    const hx = loser.x;
    const hy = loser.bodyY || loser.y - 45;
    this.floater(hx, hy - 92, t('banner.vsFatalityShout'), '#ff3040', 52);
    this.floater(winner.x + winner.face * 24, winner.y - 128, moveLabel + '!', '#ffb830', 18);
    try { AudioSys.sfx(weaponSwingSfx(winner.weapon, 'weapon')); } catch (_) {}
    try { AudioSys.sfx('comboEpic'); } catch (_) {}
    try { AudioSys.sfx('ketsbam'); } catch (_) {}
    this.shake(9, 0.22);
    if (!motionReduced()) this.freezeT = Math.max(this.freezeT || 0, 0.14);
    if (!fxLite()) {
      this.burst(hx, hy, '#ff3040', 14, { kind: 'spark', size: 3 });
      this.burst(hx, hy, '#ffb830', 10);
      spawnFxRing(this, hx, hy, '#ff3040', 16);
      spawnFxRing(this, hx, hy - 18, '#ffb830', 12);
    }
    if (save.haptics !== false) haptic(28);
    bumpStat('vsFatalities', 1);
    checkAchievements();
  }

  endVsFatality() {
    const p1Win = !!this.pendingVsP1Win;
    if (p1Win) this.roundsP1++; else this.roundsP2++;
    this.vsRoundLog = this.vsRoundLog || [];
    this.vsRoundLog.push(p1Win ? 'p1' : 'p2');
    this.vsLastRoundP1Win = p1Win;
    this.vsLastTimedOut = false;
    this.phase = 'roundend';
    this.phaseT = 0;
    this.inputLocked = true;
    let msg = p1Win ? t('banner.p1RoundWin') : t('banner.p2RoundWin');
    if (this.fatalityPerformed) msg = t('banner.vsFatalityWin', { msg });
    this.banner(msg, 1.5, p1Win ? '#7cf5ff' : '#ffb0b8', 40);
    AudioSys.sfx(p1Win ? 'win' : 'lose');
    this.fatalityWinner = null;
    this.fatalityLoser = null;
    this.pendingVsP1Win = null;
    this.fatalityPerformed = false;
    this.fatalityStrikeT = 0;
  }

  finishVersus(p1Win) {
    if (this.over) return;
    this.over = true;
    this.inputLocked = true;
    Input.dualMode = false;
    Input.layout(W, H);
    bumpStat('vsMatches', 1);
    if (p1Win) bumpStat('vsWins', 1);
    this.grantXP(p1Win ? 35 : 20);
    const close = (this.roundsP1 === 2 && this.roundsP2 === 1)
      || (this.roundsP2 === 2 && this.roundsP1 === 1);
    let tip = t('result.vsRematchTip');
    if (this.matchFatality) tip = t('result.vsFatalityRematchTip');
    else if (close) tip = t('result.vsCloseRematchTip');
    scheduleGameResult(this, 1200, () => UI.showResult(p1Win, {
      title: p1Win ? t('result.vsP1Win') : t('result.vsP2Win'),
      detail: `${vsRosterEntry(this.p1Pick).name} vs ${vsRosterEntry(this.p2Pick).name} · ${this.roundsP1}-${this.roundsP2}` +
        ((this.vsRoundLog || []).length ? ` · ${this.vsRoundLog.map((w, i) => `R${i + 1} ${w === 'p1' ? 'P1' : 'P2'}`).join(' · ')}` : '') +
        (this.matchFatality ? t('result.vsFatalityLine') : '') +
        (this.runFinishers ? ` · ${this.runFinishers} finishers` : ''),
      xp: this.sessionXP, mode: 'versus', win: p1Win, p1: this.p1Pick, p2: this.p2Pick,
      tip,
    }));
  }

  /* ------------------------------ MUUR -------------------------------- */
  initWall() {
    this.theme = 'sloop';
    this.wallTimer = 60;
    this.wallDuration = 60;
    this.wallComboWindow = 1.4;
    this.score = 0; this.combo = 0; this.comboT = 0; this.wallGen = 0;
    this.maxCombo = 0;
    this.wallRecordToast = false;
    this.wallHints = {
      half: false, quarter: false, five: false, comboWarn: false,
      nearRec: false, lostCombo: false, startCombo: false,
      combo3: false, combo5: false, combo8: false,
      pace45: false, pace20: false, nearRec2: false,
    };
    this.layoutWall(true);
    this.banner(t('banner.wallStart'), 1.5, '#ffd75e', 46);
    AudioSys.play('wall');
    this.phase = 'fight';
  }

  layoutWall(fresh) {
    // laag en breed, zodat elke steen bereikbaar is (ook springend)
    const bw = 62, bh = 34, cols = 4, rows = 5;
    this.wallX = W - cols * bw - 30;
    this.wallCols = cols;
    this.wallBrickW = bw;
    if (!fresh) return;
    this.bricks = [];
    const hpBase = 26 + this.wallGen * 10;
    for (let cRow = 0; cRow < rows; cRow++) {
      for (let col = 0; col < cols; col++) {
        this.bricks.push({
          x: this.wallX + col * bw, y: this.ground - (cRow + 1) * bh,
          w: bw - 3, h: bh - 3,
          hp: hpBase, maxhp: hpBase,
          hue: 18 + (((cRow * 7 + col * 13) % 5) - 2) * 4,
          bonus: Math.random() < 0.07,
          seed: cRow * 31 + col * 17,
        });
      }
    }
  }

  updateWall(dt) {
    try { AudioSys.setCombatHeat(Math.min(1, (this.combo || 0) / 10)); } catch (_) {}
    const prevTimer = this.wallTimer;
    this.wallTimer -= dt;
    const hints = this.wallHints || (this.wallHints = {});
    if (!hints.half && prevTimer > 30 && this.wallTimer <= 30) {
      hints.half = true;
      this.floater(W / 2, 108, t('combat.wallHalf'), '#7cf5ff', 15, 'hud');
    }
    if (!hints.quarter && prevTimer > 15 && this.wallTimer <= 15) {
      hints.quarter = true;
      this.floater(W / 2, 108, t('combat.wallLast15'), '#ffd75e', 15, 'hud');
      if (this.wallTimer < 10) AudioSys.sfx('bonus');
    }
    if (!hints.five && prevTimer > 5 && this.wallTimer <= 5) {
      hints.five = true;
      this.floater(W / 2, 108, t('combat.wallLast5'), '#ff6b6b', 15, 'hud');
      AudioSys.sfx('bonus');
    }
    const elapsed = (this.wallDuration || 60) - this.wallTimer;
    if (!hints.startCombo && elapsed > 2.5 && elapsed < 9 && this.combo === 0) {
      hints.startCombo = true;
      this.floater(W / 2, 132, t('combat.wallComboTipShort'), '#7cf5ff', 14, 'hud');
    }
    // d19 c4: pace-checkpoints — voor/achter record-tempo op 45s en 20s resterend
    const bestSaved = save.bestWall || 0;
    if (bestSaved > 0 && this.score > 0) {
      if (!hints.pace45 && prevTimer > 45 && this.wallTimer <= 45) {
        hints.pace45 = true;
        const d = wallRecordPaceDelta(this);
        if (d != null) {
          this.floater(
            W / 2, 100,
            d >= 0 ? t('combat.wallPaceOk', { n: d }) : t('combat.wallPacePush', { n: Math.abs(d) }),
            d >= 0 ? '#7cfc8a' : '#ffb06a',
            14, 'hud'
          );
        }
      }
      if (!hints.pace20 && prevTimer > 20 && this.wallTimer <= 20) {
        hints.pace20 = true;
        const d = wallRecordPaceDelta(this);
        if (d != null) {
          this.floater(
            W / 2, 100,
            d >= 0 ? t('combat.wallPaceOk', { n: d }) : t('combat.wallPacePush', { n: Math.abs(d) }),
            d >= 0 ? '#7cfc8a' : '#ff9a9a',
            15, 'hud'
          );
          if (d < 0) try { AudioSys.sfx('bell'); } catch (_) {}
        }
      }
    }
    const prevComboT = this.comboT;
    this.comboT -= dt;
    if (this.comboT <= 0) {
      if (this.combo >= 4 && !hints.lostCombo) {
        hints.lostCombo = true;
        this.floater(W / 2, 120, t('combat.wallComboLost'), '#ff9a9a', 14, 'hud');
      }
      this.combo = 0;
      hints.comboWarn = false;
    } else if (this.combo >= 3 && this.comboT > 0.55) {
      // Re-arm: mag opnieuw waarschuwen als combo weer veilig is
      hints.comboWarn = false;
    }
    if (!hints.comboWarn && this.combo >= 3 && prevComboT > 0.35 && this.comboT <= 0.35) {
      hints.comboWarn = true;
      this.floater(W / 2, 120, t('combat.wallComboLow'), '#ff9a9a', 13, 'hud');
    }
    if (!hints.nearRec && bestSaved > 0 && this.score > 0) {
      const gap = bestSaved - this.score;
      if (gap > 0 && gap <= 5) {
        hints.nearRec = true;
        this.floater(W / 2, 94, t('combat.wallNearRec', { gap }), '#7cfc8a', 16, 'hud');
        haptic(12);
      }
    }
    // d19 c4: extra nudge bij gap ≤2 in laatste 25s
    if (!hints.nearRec2 && bestSaved > 0 && this.wallTimer <= 25) {
      const gap = bestSaved - this.score;
      if (gap > 0 && gap <= 2) {
        hints.nearRec2 = true;
        this.floater(W / 2, 94, t('combat.wallNearRecFinal', { gap }), '#ffd75e', 16, 'hud');
        haptic(14);
      }
    }
    if (this.bricks.every(b => b.hp <= 0)) {
      this.wallGen++;
      this.grantXP(25);
      this.banner(t('banner.wallNewWall'), 1.4, '#7cfc8a', 34);
      AudioSys.sfx('win');
      this.layoutWall(true);
    }
    if (this.wallTimer <= 0 && !this.over) this.finishWall();
  }

  finishWall() {
    this.over = true; this.inputLocked = true;
    const best = Math.max(save.bestWall, this.score);
    const isRecord = this.score > save.bestWall;
    const prevBest = save.bestWall || 0;
    save.bestWall = best; persist();
    const xp = Math.round(this.score * 0.6);
    this.grantXP(xp);
    bumpDaily('wallBricks', this.score);
    checkAchievements();
    AudioSys.sfx(isRecord ? 'win' : 'bell');
    this.banner(t('banner.wallTime'), 1.5, '#ffd75e', 56);
    const pace = Math.round(this.score); // 60s run → stenen ≈ per minuut
    const paceDelta = wallRecordPaceDelta({ wallTimer: 0, wallDuration: this.wallDuration, score: this.score });
    const wallsCleared = this.wallGen || 0;
    let tip = isRecord ? t('result.wallRecordShare') : t('result.wallComboTip');
    if (!isRecord && best > 0) {
      const gap = best - this.score;
      if (gap > 0 && gap <= 3) tip = t('result.wallNearMiss', { gap });
      else if (gap > 0 && gap <= 15) tip = t('result.wallGapTip', { gap });
      else if ((this.maxCombo || 0) < 5) tip = t('result.wallComboBarTip');
      else if ((this.maxCombo || 0) >= 8) tip = t('result.wallStrongCombo', { n: this.maxCombo });
      else if (paceDelta != null && paceDelta < -3) tip = t('result.wallBehindPace');
      else if (paceDelta != null && paceDelta >= 3) tip = t('result.wallGoodPace');
    }
    scheduleGameResult(this, 1200, () => UI.showResult(true, {
      title: isRecord ? t('result.wallRecord') : t('result.wallTime'),
      detail: t('result.wallDetail', {
        score: this.score, pace, best, combo: this.maxCombo || 0,
        walls: wallsCleared > 0 ? t('result.wallWallsLine', { n: wallsCleared }) : '',
        paceDelta: paceDelta != null && prevBest > 0 && !isRecord
          ? t('result.wallPaceDelta', { delta: `${paceDelta >= 0 ? '+' : ''}${paceDelta}` }) : '',
      }),
      xp: this.sessionXP, mode: 'wall', win: true,
      tip,
    }));
  }

  /* ------------------------ MATS · MUNTJES BONUS ----------------------- */
  initCoinRun() {
    this.theme = 'cyber';
    this.coinTimer = 45;
    this.coinsCollected = 0;
    this.petCoinsThisRun = 0;
    this.coinPickups = [];
    this.flyers = [];
    this.coinSpawnAcc = 0;
    this.flyerSpawnAcc = 0;
    this.player.weapon = applySummonTier(weaponById('shuriken'));
    this.player.x = W * 0.28;
    this.player.face = 1;
    this.inputLocked = false;
    this.banner(t('banner.matsStart'), 1.5, '#ffd75e', 46);
    AudioSys.play('mats');
  }

  spawnCoinPickup() {
    this.coinPickups.push({
      x: rand(W * 0.15, W * 0.88),
      y: rand(this.ground - 220, this.ground - 60),
      bob: rand(0, TAU),
      got: false,
    });
  }

  spawnFlyer() {
    const fromLeft = Math.random() < 0.5;
    const y = rand(this.ground - 280, this.ground - 90);
    this.flyers.push({
      x: fromLeft ? -40 : W + 40,
      y,
      vx: (fromLeft ? 1 : -1) * rand(120, 200),
      vy: rand(-30, 40),
      r: 22,
      hp: 1,
      wobble: rand(0, TAU),
    });
  }

  updateCoinRun(dt) {
    this.coinTimer -= dt;
    this.coinSpawnAcc += dt;
    this.flyerSpawnAcc += dt;
    while (this.coinSpawnAcc >= 0.75) {
      this.coinSpawnAcc -= 0.75;
      this.spawnCoinPickup();
    }
    while (this.flyerSpawnAcc >= 1.6) {
      this.flyerSpawnAcc -= 1.6;
      if (this.flyers.length < 8) this.spawnFlyer();
    }
    const pl = this.player;
    for (const c of this.coinPickups) {
      if (c.got) continue;
      c.bob += dt * 5;
      if ((pl.bodyX - c.x) ** 2 + (pl.bodyY - (c.y + Math.sin(c.bob) * 6)) ** 2 < 42 * 42) {
        c.got = true;
        this.coinsCollected++;
        AudioSys.sfx('pickup');
        this.floater(c.x, c.y - 20, t('combat.coinPlus1'), '#ffd75e', 15);
        haptic(8);
      }
    }
    this.coinPickups = this.coinPickups.filter(c => !c.got);
    for (const fl of this.flyers) {
      fl.x += fl.vx * dt;
      fl.y += fl.vy * dt;
      fl.wobble += dt * 4;
      fl.vy += Math.sin(fl.wobble) * 40 * dt;
      if (fl.x < -80 || fl.x > W + 80) fl.hp = 0;
    }
    this.flyers = this.flyers.filter(f => f.hp > 0);
    if (this.coinTimer <= 0 && !this.over) this.finishCoinRun();
  }

  finishCoinRun() {
    this.over = true;
    this.inputLocked = true;
    const n = this.coinsCollected;
    const best = Math.max(save.stats.matsCoinBest || 0, n);
    const isRecord = n > (save.stats.matsCoinBest || 0);
    save.stats.matsCoinBest = best;
    const petEarned = matsPetCoinsFromRun(n);
    if (petEarned > 0) {
      save.petCoins = petCoinsBalance() + petEarned;
      this.petCoinsThisRun = petEarned;
      noteRunLootPetCoins(this.runLoot, petEarned);
    }
    persist();
    const xp = Math.round(n * 4 + 15);
    this.grantXP(xp);
    AudioSys.sfx(isRecord ? 'win' : 'bonus');
    this.banner(t('banner.bonusDone'), 1.4, '#7cfc8a', 40);
    const wallet = petCoinsBalance();
    scheduleGameResult(this, 1200, () => UI.showResult(true, {
      title: isRecord ? t('result.matsRecord') : t('result.matsDone'),
      detail: t('result.matsDetail', {
        n, best,
        pet: petEarned > 0 ? t('result.matsPetEarned', { n: petEarned, wallet }) : '',
        flyers: t('result.matsFlyers'),
      }),
      xp: this.sessionXP,
      mode: 'coinrun',
      win: true,
      tip: petEarned > 0
        ? t('result.matsPetTip')
        : t('result.matsControlTip'),
    }));
  }

  drawCoinRunLayer(c) {
    for (const cn of this.coinPickups) {
      const y = cn.y + Math.sin(cn.bob) * 6;
      c.save();
      c.translate(cn.x, y);
      c.fillStyle = '#ffd75e';
      c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill();
      c.strokeStyle = '#c97a20'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#2a1a00'; c.font = '900 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('$', 0, 1);
      c.restore();
    }
    for (const fl of this.flyers) {
      c.save();
      c.translate(fl.x, fl.y + Math.sin(fl.wobble) * 8);
      c.fillStyle = 'rgba(255,120,160,.85)';
      c.beginPath(); c.ellipse(0, 0, fl.r, fl.r * 0.65, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.font = '900 11px sans-serif'; c.textAlign = 'center';
      c.fillText('+3', 0, 4);
      c.restore();
    }
  }

  /* -------------------------- GEDEELDE LOGICA ------------------------- */
  grantXP(n, opts) {
    opts = opts || {};
    if (this.mode === 'adventure' && this.styleXpMul && this.styleXpMul !== 1) {
      n = Math.round(n * this.styleXpMul);
    }
    this.sessionXP += n;
    save.xp += n;
    while (save.xp >= xpNeed(save.lvl)) {
      try {
        if (!this.player) break;
        save.xp -= xpNeed(save.lvl);
        save.lvl++;
        noteRunLootLevelUp(this.runLoot, save.lvl);
        try { AudioSys.sfx('levelup'); } catch (_) {}
        this.banner(t('banner.levelUp', { lvl: save.lvl }), 1.8, '#ffd75e', 40);
        const st = playerStats();
        this.player.maxhp = st.maxhp;
        this.player.baseDmg = st.dmg;
        this.player.hp = Math.min(this.player.maxhp, this.player.hp + Math.round(this.player.maxhp * 0.45));
        const unlockedW = WEAPONS.find(w => w.unlock === save.lvl);
        if (unlockedW) {
          const self = this;
          setTimeout(() => {
            try {
              if (!gameUiTimerOk(self)) return;
              self.banner(t('banner.newWeapon', { name: weaponLabel(unlockedW) }), 2, '#c792ff', 32);
            } catch (_) {}
          }, 900);
          try { AudioSys.sfx('newmonster'); } catch (_) {}
        }
        const newStyle = STYLES.find(s => s.needLvl === save.lvl && styleUnlocked(s));
        if (newStyle) { try { UI.toast(t('toast.styleUnlock', { name: styleLabel(newStyle) }), 3500); } catch (_) {} }
        const newSkill = SKILLS.find(s => s.needLvl === save.lvl && skillUnlocked(s));
        if (newSkill) { try { UI.toast(t('toast.skillUnlock', { name: skillLabel(newSkill) }), 3500); } catch (_) {} }
        const newSuper = SUPERS.find(s => s.needLvl === save.lvl && superUnlocked(s));
        if (newSuper) { try { UI.toast(t('toast.superUnlock', { name: superLabel(newSuper) }), 3500); } catch (_) {} }
      } catch (lvlErr) {
        try { sfReportError('grantXP/level', lvlErr, 'Level-up hiccup — gevecht gaat door'); } catch (_) {}
        break;
      }
    }
    if (!opts.deferPersist) persist();
  }

  spawnJutsu(f, atk) {
    const jutsu = (atk && atk.jutsu) || fighterJutsuKind(f);
    const sk = skillById(jutsu);
    const jb = jutsuSkillBonuses(jutsu);
    const dmg = (atk ? atk.dmg : f.baseDmg * (sk.dmgMul || 2.8)) * jb.dmgMul;
    const from = this.projFrom(f);
    const critMeta = projCritMeta(f);
    const behavior = sk.behavior || 'orb';
    const speed = (sk.speed || 420) * jb.speedMul;
    const aim = projAimVelocity(f, behavior === 'dash' ? speed : speed * 0.9);
    const face = f.face || 1;
    const col = sk.color || '#7cf5ff';
    // Rasengan: altijd horizontaal (geen aim-tilt); Rinnegan-slash ook op torso-hoogte
    const rasenHoriz = jutsu === 'rasengan';
    const slashFlat = behavior === 'slash';
    const y0 = (rasenHoriz || slashFlat)
      ? (f.y - 50)
      : (f.y - 50 + clamp(aim.ny, -1, 0.5) * 36);

    const fireProj = (offX, offY, scale, opts) => {
      const sc = scale || 1;
      const ox = offX || 0;
      const oy = offY || 0;
      opts = opts || {};
      if (behavior === 'dash') {
        this.spawnProjectile(Object.assign({
          x: f.x + face * (36 + ox), y: y0 + oy,
          vx: aim.vx, vy: aim.vy * 0.85, r: ((sk.radius || 22) + jb.radius) * sc, dmg: dmg * sc,
          life: (sk.life || 0.35) * jb.lifeMul * sc, from, kind: sk.id, pierce: !!sk.pierce,
          hitSet: new Set(), pierceRepeat: jb.pierceRepeat,
        }, critMeta));
      } else if (behavior === 'slash') {
        // Lichtschits-golf: expandeert links én rechts, strook tapert met afstand
        // jb.radius = skill-upgrades → duidelijk dikkere strook per level
        const r0 = ((sk.radius || 42) + jb.radius * 1.35) * sc;
        const expand = (sk.speed || 720) * jb.speedMul * sc;
        const maxReach = (460 + jb.radius * 8) * sc;
        this.spawnProjectile(Object.assign({
          x: f.x + ox, y: y0 + oy,
          vx: 0, vy: 0, r: r0, r0, dmg: dmg * sc,
          from, kind: sk.id, pierce: sk.pierce !== false, hitSet: new Set(),
          life: (sk.life || 0.68) * jb.lifeMul * sc,
          spin: 0, slashWave: true, slashReach: 0, slashMaxReach: maxReach,
          slashExpand: expand, pierceRepeat: jb.pierceRepeat,
          kbMul: (sk.kb || 580) / 300,
        }, critMeta));
      } else if (behavior === 'pull' || behavior === 'meteor') {
        const sp = behavior === 'meteor' ? speed * 0.55 : speed;
        this.spawnProjectile(Object.assign({
          x: f.x + face * (38 + ox), y: y0 + oy,
          vx: aim.vx * (sp / speed), vy: aim.vy * 0.9, r: ((sk.radius || 30) + jb.radius) * sc, dmg: dmg * sc,
          from, kind: sk.id, pierce: !!sk.pierce, hitSet: new Set(), life: (sk.life || 1.05) * jb.lifeMul * sc,
          spin: 0, pull: !!sk.pull, pullMul: jb.pullMul || 1,
        }, critMeta));
      } else if (behavior === 'beam' || behavior === 'disc') {
        const beamSpeed = speed;
        const rx = behavior === 'disc' ? (sk.radius || 18) : (sk.radius || 32);
        this.spawnProjectile(Object.assign({
          x: f.x + face * (42 + ox), y: y0 + oy,
          vx: aim.vx || face * beamSpeed, vy: (aim.vy || 0) * 0.35, r: (rx + jb.radius) * sc, dmg: dmg * sc,
          from, kind: sk.id, pierce: sk.pierce !== false, hitSet: new Set(), life: (sk.life || 1.1) * jb.lifeMul * sc,
          spin: behavior === 'disc' ? 0.4 : 0,
        }, critMeta));
      } else if (rasenHoriz) {
        // Volledig horizontaal (geen aim) + optionele krul (↑/↓) in-vlucht
        const curl = opts.curl || 0;
        const vy0 = opts.vy0 != null ? opts.vy0 : 0;
        this.spawnProjectile(Object.assign({
          x: f.x + face * (40 + ox), y: y0 + oy,
          vx: face * speed, vy: vy0,
          r: ((sk.radius || 28) + jb.radius) * sc, dmg: dmg * sc,
          from, kind: sk.id, pierce: !!sk.pierce, hitSet: new Set(),
          life: (sk.life || 1.4) * jb.lifeMul * sc,
          spin: 0, pierceRepeat: jb.pierceRepeat,
          curl, curlAccel: curl ? (opts.curlAccel || 420) : 0, curlMaxVy: opts.curlMaxVy || 280,
        }, critMeta));
      } else {
        this.spawnProjectile(Object.assign({
          x: f.x + face * (40 + ox), y: y0 + oy,
          vx: aim.vx || face * speed, vy: aim.vy || 0, r: ((sk.radius || 28) + jb.radius) * sc, dmg: dmg * sc,
          from, kind: sk.id, pierce: !!sk.pierce, hitSet: new Set(), life: (sk.life || 1.4) * jb.lifeMul * sc,
          spin: 0, pierceRepeat: jb.pierceRepeat,
        }, critMeta));
      }
    };

    if (rasenHoriz && (f.isPlayer || f.playerSlot)) {
      const mode = typeof rasenganShotMode === 'function'
        ? rasenganShotMode(typeof skillLevel === 'function' ? skillLevel('rasengan') : 0)
        : 'single';
      if (mode === 'triple') {
        // → rechtdoor + ↑ krul + ↓ krul (duidelijke lanes)
        fireProj(0, 0, 1.05, { curl: 0 });
        fireProj(face * 8, -14, 0.92, { curl: -1, vy0: -120, curlAccel: 480, curlMaxVy: 300 });
        fireProj(face * 8, 14, 0.92, { curl: 1, vy0: 120, curlAccel: 480, curlMaxVy: 300 });
        try { this.banner(t('banner.rasenganTriple'), 1.15, col, 36); } catch (_) {
          this.banner('TRIPLE RASENGAN!', 1.15, col, 36);
        }
      } else if (mode === 'dual') {
        // ↑ + ↓ krul — start al met verticale snelheid zodat beide lanes zichtbaar zijn
        fireProj(face * 6, -12, 0.96, { curl: -1, vy0: -100, curlAccel: 440, curlMaxVy: 280 });
        fireProj(face * 6, 12, 0.96, { curl: 1, vy0: 100, curlAccel: 440, curlMaxVy: 280 });
        try { this.banner(t('banner.rasenganDual'), 1.0, col, 32); } catch (_) {
          this.banner('DUAL RASENGAN!', 1.0, col, 32);
        }
      } else {
        fireProj(0, 0, 1, { curl: 0 });
      }
      const liteCast = fxLite();
      this.burst(f.x + face * 30, y0, col, liteCast ? 8 : 16);
      spawnFxRing(this, f.x + face * 34, y0, col, mode === 'triple' ? 14 : 10);
      if (mode === 'dual' || mode === 'triple') {
        spawnFxRing(this, f.x + face * 38, y0, '#ffffff', liteCast ? 6 : 9);
        if (!liteCast) spawnFxRing(this, f.x + face * 44, y0, col, mode === 'triple' ? 18 : 13);
        this.burst(f.x + face * 32, y0 - 6, '#e8faff', liteCast ? 4 : 8, { kind: 'spark', size: 2.2 });
      }
      this.shake(mode === 'triple' ? 11 : 9, 0.28);
      this.freezeT = Math.max(this.freezeT, mode === 'triple' ? 0.08 : 0.06);
      AudioSys.sfx(skillSfxId(sk));
      if (f.isPlayer || f.playerSlot) haptic(mode === 'triple' ? 28 : 22);
    } else if (behavior === 'dash') {
      fireProj(0, 0, 1);
      f.vx = face * (sk.dashVx || 380) * jb.speedMul;
      this.shake(7, 0.2);
      AudioSys.sfx(skillSfxId(sk));
    } else if (behavior === 'slash') {
      fireProj(0, 0, 1);
      const liteCast = fxLite();
      this.burst(f.x, y0, col, liteCast ? 12 : 22);
      this.burst(f.x, y0, '#e8d0ff', liteCast ? 6 : 12, { kind: 'spark', size: 2.8 });
      this.burst(f.x - 28, y0, col, liteCast ? 5 : 10, { kind: 'spark', size: 2.2 });
      this.burst(f.x + 28, y0, col, liteCast ? 5 : 10, { kind: 'spark', size: 2.2 });
      spawnFxRing(this, f.x, y0, col, liteCast ? 10 : 16);
      spawnFxRing(this, f.x, y0, '#ffffff', liteCast ? 6 : 10);
      this.shake(11, 0.3);
      this.freezeT = Math.max(this.freezeT, 0.07);
      AudioSys.sfx(skillSfxId(sk));
      if (f.isPlayer || f.playerSlot) haptic(26);
    } else if (behavior === 'pull' || behavior === 'meteor') {
      fireProj(0, 0, 1);
      this.burst(f.x + face * 28, y0, col, behavior === 'meteor' ? 18 : 14);
      this.burst(f.x + face * 28, y0, '#ff6b9d', 8);
      this.shake(behavior === 'meteor' ? 10 : 8, 0.24);
      this.freezeT = Math.max(this.freezeT, behavior === 'meteor' ? 0.07 : 0.05);
      AudioSys.sfx(skillSfxId(sk));
      if (f.isPlayer || f.playerSlot) haptic(20);
    } else if (behavior === 'beam' || behavior === 'disc') {
      fireProj(0, 0, 1);
      this.burst(f.x + face * 34, y0, col, fxLite() ? 8 : 14);
      spawnFxRing(this, f.x + face * 38, y0, col, 12);
      this.shake(8, 0.26);
      this.freezeT = Math.max(this.freezeT, 0.05);
      AudioSys.sfx(skillSfxId(sk));
      if (f.isPlayer || f.playerSlot) haptic(18);
    } else {
      fireProj(0, 0, 1);
      this.burst(f.x + face * 30, y0, col, fxLite() ? 8 : 16);
      spawnFxRing(this, f.x + face * 34, y0, col, 10);
      this.shake(9, 0.28);
      this.freezeT = Math.max(this.freezeT, 0.06);
      AudioSys.sfx(skillSfxId(sk));
      if (f.isPlayer || f.playerSlot) haptic(22);
    }
    try {
      const swoosh = typeof jutsuSwooshSfx === 'function' ? jutsuSwooshSfx(jutsu) : 'skillSwoosh';
      if (this.mode === 'versus' && f.vsSaga === 'tide') AudioSys.sfx('tideSurge');
      AudioSys.sfxAt(swoosh, f.x + f.face * 40);
    } catch (_) {}
    // Rasengan multi-shot vervangt random extraShot
    if (!(rasenHoriz && (f.isPlayer || f.playerSlot))) {
      const extra = (atk && atk.extraShot) || jb.extraShot || 0;
      if (extra > 0 && Math.random() < extra) {
        fireProj(face * 12, rand(-8, 8), 0.72);
      }
    }
  }

  throwShuriken(f) {
    if (!canThrowShuriken(f, this)) {
      if (!this._shurikenWarnT || this.t - this._shurikenWarnT > 0.9) {
        this._shurikenWarnT = this.t;
        try {
          UI.toast(f._shurikenCd > 0 || f._boomerOut ? t('toast.shurikenWait') : t('toast.shurikenSpam'), 1600);
        } catch (_) {}
      }
      return;
    }
    noteShurikenThrow(f, this);
    const w = f.weapon;
    AudioSys.sfx(weaponThrowSfx(w.id));
    const boom = w.id === 'boemerang';
    const big = w.id === 'fuuma';
    const critMeta = projCritMeta(f);
    const aim = projAimVelocity(f, boom ? 480 : (big ? 500 : 560));
    if (boom) {
      f._boomerOut = true;
      f._shurikenCd = Math.max(f._shurikenCd || 0, 0.55);
      this.spawnProjectile(Object.assign({
        x: f.x + (f.face || 1) * 24,
        y: f.y - 52 + clamp(aim.ny, -1, 0.5) * 30,
        vx: aim.vx, vy: aim.vy, r: 16,
        dmg: f.baseDmg * w.dmg * 0.95,
        from: this.projFrom(f), kind: 'boemerang', life: 2.5, spin: 0,
        throwId: 'boemerang',
        hitSet: new Set(),
        returning: false,
        outT: 0,
        originX: f.x,
        originY: f.y - 52,
      }, critMeta));
      return;
    }
    this.spawnProjectile(Object.assign({
      x: f.x + (f.face || 1) * 24,
      y: f.y - 52 + clamp(aim.ny, -1, 0.5) * 30,
      vx: aim.vx, vy: aim.vy, r: big ? 14 : 10,
      dmg: f.baseDmg * w.dmg * (big ? 1.05 : 0.85),
      from: this.projFrom(f), kind: 'shuriken', life: big ? 1.55 : 1.4, spin: 0,
      throwId: w.id,
    }, critMeta));
  }

  spawnWave(f) { this.spawnJutsu(f, f.attackSpec('special')); }

  spawnEnemyJutsu(m) {
    const p = this.player;
    if (!p || !p.alive || !m.enemyJutsu || !m.alive) return;
    const dir = Math.sign(p.x - m.x) || m.face || 1;
    const j = m.enemyJutsu;
    const dmg = Math.round(m.dmg * (j === 'kamehame' ? 2.15 : j === 'chidori' ? 1.75 : 1.55));
    const y0 = m.y - m.size * 0.55;
    const lbl = j === 'chidori' ? 'CHIDORI!' : j === 'kamehame' ? 'KAMEHAME!' : 'RASENGAN!';
    const col = j === 'chidori' ? '#a8e0ff' : j === 'kamehame' ? '#7cf5ff' : '#7cf5ff';
    try {
      this.floater(m.x, m.y - m.size - 24, lbl, col, 14);
    } catch (_) {}
    if (j === 'rasengan') {
      this.spawnProjectile({
        x: m.x + dir * m.size, y: y0, vx: dir * 360, vy: 0, r: 22, dmg,
        from: 'enemy', kind: 'rasengan', life: 1.15, spin: 0, hitSet: new Set(),
      });
      try { AudioSys.sfx('rasengan'); } catch (_) {}
    } else if (j === 'chidori') {
      this.spawnProjectile({
        x: m.x + dir * m.size, y: y0, vx: dir * 500, vy: 0, r: 17, dmg,
        from: 'enemy', kind: 'chidori', life: 0.34, hitSet: new Set(),
      });
      try { AudioSys.sfx('chidori'); } catch (_) {}
    } else {
      const a = Math.atan2((p.y - 42) - y0, p.x - m.x);
      this.spawnProjectile({
        x: m.x + Math.cos(a) * m.size, y: y0 + Math.sin(a) * m.size,
        vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, r: 28, dmg,
        from: 'enemy', kind: 'kamehame', life: 1.05, spin: 0, hitSet: new Set(),
      });
      try { this.shake(7, 0.22); AudioSys.sfx('rasengan'); } catch (_) {}
    }
  }

  spawnProjectile(p) {
    if (!perfFxBudgetAllow(this, 1)) return;
    if (perfFxRoom(this, 'projectile') <= 0) return;
    this.projectiles.push(Object.assign({ life: 3, grav: 0, spin: 0 }, p));
  }

  projFrom(f) {
    if (this.mode === 'versus') return f.playerSlot === 2 ? 'p2' : 'p1';
    return f.isPlayer ? 'player' : 'enemy';
  }

  tryMelee(f, spec) {
    const { hx, hy } = meleeHitPoint(f, spec);
    const r = spec.r;
    let hit = false;

    if (this.mode === 'wall' && f.isPlayer) {
      let hits = 0;
      for (const b of this.bricks) {
        if (b.hp <= 0) continue;
        const cx = clamp(hx, b.x, b.x + b.w), cy = clamp(hy, b.y, b.y + b.h);
        if ((hx - cx) ** 2 + (hy - cy) ** 2 < r * r) {
          hits++;
          const hitRoll = rollHitDamage(f, spec, 1 + this.combo * 0.04);
          const dmg = hitRoll.dmg;
          if (hitRoll.crit) applyCritFx(this, cx, cy);
          b.hp -= dmg;
          this.burst(cx, cy, `hsl(${b.hue},45%,55%)`, 5);
          if (b.hp <= 0) {
            this.score++;
            this.combo++; this.comboT = this.wallComboWindow || 1.4;
            this.noteCombo();
            const wh = this.wallHints || {};
            if (this.combo === 3 && !wh.combo3) {
              wh.combo3 = true;
              this.floater(W * 0.5, 136, t('combat.wallCombo3', { pct: wallComboDmgPct(3) }), '#7cf5ff', 15, 'hud');
            } else if (this.combo === 5 && !wh.combo5) {
              wh.combo5 = true;
              this.floater(W * 0.5, 136, t('combat.wallCombo5', { pct: wallComboDmgPct(5) }), '#7cf5ff', 16, 'hud');
              AudioSys.sfx('combo');
            } else if (this.combo === 8 && !wh.combo8) {
              wh.combo8 = true;
              this.floater(W * 0.5, 136, t('combat.wallCombo8', { pct: wallComboDmgPct(8) }), '#ffd75e', 17, 'hud');
              AudioSys.sfx('combo');
              haptic(14);
            }
            if (!this.wallRecordToast && this.score > save.bestWall) {
              this.wallRecordToast = true;
              this.floater(W * 0.5, 118, t('combat.wallRecord'), '#ffd75e', 22, 'hud');
              haptic(18);
              AudioSys.sfx('bonus');
            }
            this.burst(b.x + b.w / 2, b.y + b.h / 2, `hsl(${b.hue},50%,45%)`, 14);
            AudioSys.sfxAt(b.bonus ? 'explode' : 'brick', b.x + b.w / 2);
            this.shake(b.bonus ? 6 : 3, b.bonus ? 0.16 : 0.12);
            this.floater(b.x + b.w / 2, b.y, this.combo > 1 ? `x${this.combo}!` : '+1', '#ffd75e', 16);
            if (b.bonus) {
              AudioSys.sfx('bonus');
              this.score += 5;
              this.burst(b.x + b.w / 2, b.y + b.h / 2, '#ffd75e', 22);
              this.floater(b.x + b.w / 2, b.y - 22, t('combat.bonus5'), '#7cf5ff', 18);
            }
          } else {
            AudioSys.sfxAt('crack', cx);
          }
          if (hits >= 3) break;
        }
      }
      if (hits > 0) {
        try { AudioSys.sfxAt(weaponHitSfx(f.weapon, spec.dmg), hx); } catch (_) {}
      }
      return hits > 0;
    }

    // monsters
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if ((hx - m.x) ** 2 + (hy - m.y) ** 2 < (r + m.size) ** 2) {
        let comboMul = 1;
        if (this.mode === 'adventure' && f.isPlayer) {
          this.combo = Math.min(12, this.combo + 1);
          const chainBonus = (f._chainKind === spec.kind && this.combo >= 2) ? 0.18 : 0;
          f._chainKind = spec.kind;
          this.comboT = 1.62 + chainBonus;
          this.noteCombo();
          comboMul = 1 + Math.min(this.combo, 8) * 0.07;
          trackCombo(this.combo);
          if (this.combo === 3 || this.combo === 6 || this.combo === 10) {
            AudioSys.sfx('combo');
            this.floater(f.x + f.face * 30, f.y - 120, t('combat.comboN', { n: this.combo }), '#ffd75e', 17, 'fx');
          }
        }
        const buff = f.isPlayer ? (this.dmgBuffMul || 1) * (this.stageDmgMul || 1) * (this.styleAdvDmgMul || 1) : 1;
        const finisher = spec.kind === 'weapon' && isWeaponFinisher(f, spec);
        const counter = f.isPlayer && isMonsterCounterWindow(m);
        const hitRoll = rollHitDamage(f, spec, comboMul * buff * (finisher ? WEAPON_FINISHER_MUL.dmg : 1));
        if (hitRoll.crit) applyCritFx(this, m.x, m.y);
        const kbHit = scaleKnockback(f.face * spec.kb * (finisher ? WEAPON_FINISHER_MUL.kb : 1), hitRoll.dmg, { crit: hitRoll.crit, kind: spec.kind });
        if (counter) {
          this.comboT = Math.min(2.2, this.comboT + 0.14);
          this.floater(m.x, m.y - m.size - 24, t('combat.counter'), '#ffd75e', 15, 'fx');
          if (m.jutsuTelegraphT > 0) m.jutsuTelegraphT = 0;
          if (m.telegraphT > 0) m.telegraphT = 0;
          if (m.dashT > 0) { m.dashT = 0; m.vx *= 0.35; }
        }
        m.takeDamage(hitRoll.dmg, kbHit, this, { crit: hitRoll.crit, kind: spec.kind });
        applyHitStop(this, spec, { crit: hitRoll.crit, combo: this.combo, heavy: hitRoll.dmg >= 18 });
        if (spec.kind === 'weapon' && typeof applyWeaponOnHitEffect === 'function') {
          try {
            applyWeaponOnHitEffect(this, f, m, { dmg: hitRoll.dmg, crit: hitRoll.crit, finisher });
          } catch (_) {}
        }
        if (counter) this.freezeT = Math.max(this.freezeT, 0.016);
        applyHitConfirmFx(this, hx, hy, spec);
        if (f.isPlayer && this.styleLightning && !fxLite()) {
          this.burst(m.x, m.y - m.size * 0.5, f.style?.accent || '#7cf5ff', 5, { kind: 'spark', size: 2 });
          if (f.style?.id === 'cyber') spawnFxRing(this, m.x, m.y - m.size * 0.3, '#4ecf6a', 6);
        }
        if (spec.dmg >= 18) this.shake(3, 0.11);
        if (spec.kind === 'weapon') bumpWeaponComboWindow(f, 0.12);
        if (spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id) && spec.moveIdx < 2) {
          f._weaponComboHits = (f._weaponComboHits || 0) + 1;
        }
        if ((f.isPlayer || f.playerSlot) && spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id)) {
          const labels = weaponMoveLabels(f.weapon.id);
          const idx = spec.moveIdx || 0;
          if (labels && labels[idx]) {
            const txt = finisher ? labels[idx] + '!' : labels[idx];
            const col = finisher ? '#ffb830' : (idx === 2 ? '#ffd75e' : 'rgba(255,255,255,.88)');
            this.floater(f.x + f.face * 24, f.y - (118 + idx * 5), txt, col, finisher ? 15 : (idx === 2 ? 13 : 11), 'style');
          }
          if (finisher) {
            trackWeaponFinisher(f.weapon.id, this);
            try { AudioSys.sfx(weaponFinisherSfx(f.weapon)); } catch (_) {}
            if (!fxLite()) {
              this.burst(hx, hy, f.style?.accent || '#ffb830', 8, { kind: 'spark', size: 2.5 });
              spawnFxRing(this, hx, hy, '#ffb830', 12);
            }
            f.energy = clamp(f.energy + WEAPON_FINISHER_MUL.energy, 0, 100);
            bumpWeaponComboWindow(f, 0.18);
          }
        }
        this.player.energy = clamp(this.player.energy + 8, 0, 100);
        try { AudioSys.sfxAt(weaponHitSfx(f.weapon, hitRoll.dmg), m.x); } catch (_) {}
        hit = true;
      }
    }
    // vechters (training / versus)
    const targets = [];
    if (this.mode === 'versus') {
      if (f.playerSlot === 1 && this.p2) targets.push(this.p2);
      if (f.playerSlot === 2 && this.player) targets.push(this.player);
    } else {
      if (f.isPlayer && this.robot) targets.push(this.robot);
      if (!f.isPlayer && f.isRobot) targets.push(this.player);
    }
    for (const tgt of targets) {
      if (!tgt.alive) continue;
      if ((hx - tgt.bodyX) ** 2 + (hy - tgt.bodyY) ** 2 < (r + tgt.bodyR) ** 2) {
        if (this.mode === 'training' && f.isPlayer) {
          this.combo = Math.min(12, this.combo + 1);
          f._chainKind = spec.kind;
          this.comboT = 1.55;
          this.trainComboBest = Math.max(this.trainComboBest || 0, this.combo);
          trackCombo(this.combo);
          const goals = this.trainComboGoals || (this.trainComboGoals = {});
          if ([3, 5, 8, 10].includes(this.combo) && !goals[this.combo]) {
            goals[this.combo] = 1;
            AudioSys.sfx('combo');
            const labels = {
              3: 'Combo ×3 — door!',
              5: 'Combo ×5 — netjes!',
              8: 'Combo ×8 — pro!',
              10: 'Combo ×10 — meester!',
            };
            this.floater(f.x + f.face * 30, f.y - 130, labels[this.combo], '#ffd75e', 16);
            haptic(8 + this.combo);
          }
        }
        const hitRoll = rollHitDamage(f, spec, 1);
        const kbHit = scaleKnockback(f.face * spec.kb, hitRoll.dmg, { crit: hitRoll.crit, kind: spec.kind });
        const counter = isCounterHitWindow(tgt);
        const dmg = tgt.takeDamage(hitRoll.dmg, kbHit, this, {
          unblockable: spec.unblockable, attacker: f, kind: spec.kind,
        });
        if (hitRoll.crit) applyCritFx(this, tgt.x, tgt.y);
        const col = tgt.playerSlot === 2 ? '#ffb0b8' : (tgt.isPlayer ? '#ff8080' : '#ffe680');
        this.floater(tgt.x, tgt.y - 115, (counter ? t('combat.counter') + ' ' : '') + '-' + dmg, col, 16);
        this.burst(tgt.bodyX, tgt.bodyY, col, 7);
        applyHitConfirmFx(this, hx, hy, spec);
        if (spec.kind === 'weapon') bumpWeaponComboWindow(f, 0.1);
        if (spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id) && spec.moveIdx < 2) {
          f._weaponComboHits = (f._weaponComboHits || 0) + 1;
        }
        if ((f.isPlayer || f.playerSlot) && spec.kind === 'weapon' && !isThrowWeapon(f.weapon.id)) {
          const labels = weaponMoveLabels(f.weapon.id);
          const idx = spec.moveIdx || 0;
          if (labels && labels[idx]) {
            const txt = finisher ? labels[idx] + '!' : labels[idx];
            this.floater(f.x + f.face * 24, f.y - (118 + idx * 5), txt, finisher ? '#ffb830' : '#ffd75e', finisher ? 14 : 11, 'style');
          }
          if (finisher) {
            trackWeaponFinisher(f.weapon.id, this);
            try { AudioSys.sfx(weaponFinisherSfx(f.weapon)); } catch (_) {}
            bumpWeaponComboWindow(f, 0.14);
          }
        }
        f.energy = clamp(f.energy + 9, 0, 100);
        applyHitStop(this, spec, { crit: hitRoll.crit, combo: this.combo, heavy: hitRoll.dmg >= 18 });
        if (counter) this.freezeT = Math.max(this.freezeT, 0.014);
        this.shake(spec.dmg > 20 ? 4 : 3, 0.12);
        if ((f.isPlayer || f.playerSlot) && save.haptics !== false) haptic(5);
        try { AudioSys.sfxAt(weaponHitSfx(f.weapon, hitRoll.dmg), tgt.x); } catch (_) {}
        hit = true;
      }
    }
    return hit;
  }

  update(dt) {
    // Solo-modes: nooit 2P-pads (primePlayInput(mode-string) was een regressie)
    if (this.mode !== 'versus' && typeof Input !== 'undefined' && Input.dualMode) {
      try { Input.dualMode = false; Input.layout(W, H); } catch (_) {}
    }
    if (this.playerHurtCd > 0) this.playerHurtCd -= dt;
    let ketsJustFinished = false;
    if (this.ketsbamChargeT > 0) {
      if (this.over || !this.player?.alive) {
        this.ketsbamChargeT = 0;
        this.ketsbamShow = false;
        this.ketsbamBuildT = 0;
        this.ketsbamBuildProg = 0;
        // Bij level-einde lock houden; anders altijd ontgrendelen
        this.inputLocked = !!this.over;
      } else {
        if (this.ketsbamCd > 0) this.ketsbamCd -= dt;
        if (this.ketsbamSuperT > 0) this.ketsbamSuperT -= dt;
        this.ketsbamChargeT -= dt;
        this.ketsbamChargePulse = (this.ketsbamChargePulse || 0) + dt;
        this.t += dt;
        this.player.vx = 0;
        this.player.update(dt, this);
        this.ketsbamChargeAcc = (this.ketsbamChargeAcc || 0) + dt;
        const dur = this.ketsbamChargeDur || KETSBAM_CHARGE_DUR;
        const prog = 1 - this.ketsbamChargeT / dur;
        const chargeSp = equippedSuper();
        const cCol = chargeSp.color || '#ffd75e';
        const cCol2 = chargeSp.color2 || '#ff9a3d';
        if (this.ketsbamChargeAcc >= 0.07 && !motionReduced()) {
          this.ketsbamChargeAcc = 0;
          const px = this.player.x;
          const py = this.player.y - 50;
          this.burst(px + rand(-20, 20), py + rand(-30, 10), prog > 0.6 ? '#fff8dc' : cCol,
            fxLite() ? 2 : 4, { kind: 'spark', size: 2 + prog * 2 });
          if (prog > 0.45 && !fxLite()) {
            this.burst(px, this.player.y + 2, cCol2, 2, { kind: 'ring' });
          }
        }
        if (this.ketsbamChargeT <= 0) {
          try {
            this.player.finishKetsbam(this);
          } catch (ketsErr) {
            // Charge klaar → finish mag nooit update laten crashen → startscherm
            try { sfReportError('ketsbam/finish', ketsErr); } catch (_) {}
            this.ketsbamChargeT = 0;
            this.inputLocked = false;
            this.ketsbamShow = false;
            this.ketsbamBuildT = 0;
            this.ketsbamBuildProg = 0;
          }
          // Zelfde frame door → wave-clear / Next voelt direct na 1e én 2e Kets
          ketsJustFinished = true;
        } else {
          return;
        }
      }
    }
    if (this.freezeT > 0 && !ketsJustFinished) {
      this.freezeT -= dt;
      this.t += dt;
      this.shakeT = Math.max(0, this.shakeT - dt);
      // Soft hit-stop: FX + adventure mogen door (2e Kets → golf/level-einde soepel)
      if (this.mode === 'adventure') {
        try { tickSuperFx(this, dt); } catch (_) {}
        if (!this.over && this.player?.alive) {
          try { this.updateAdventure(dt); } catch (_) {}
        }
      }
      for (const m of this.monsters) {
        try { if (!m.alive) m.update(dt, this); } catch (_) {}
      }
      this.monsters = this.monsters.filter(m => m.alive || m.deadT < 1);
      return;
    }
    if (ketsJustFinished && this.freezeT > 0) this.freezeT = Math.max(0, this.freezeT - dt);
    if (this.mode === 'adventure') this.updateKetsbam(dt);
    if (!ketsJustFinished) this.t += dt;
    if (this.hint > 0) this.hint -= dt;
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.bossPhase2Flash > 0) this.bossPhase2Flash -= dt;

    if (!this.player) return;
    try { this.player.update(dt, this); } catch (plErr) {
      try { sfReportError('player/update', plErr, 'Speler hiccup — speel door'); } catch (_) {}
    }
    if (this.pet) {
      try { this.pet.update(dt); } catch (petErr) {
        try { sfReportError('pet/update', petErr, 'Pet hiccup — speel door'); } catch (_) {}
      }
    }
    if (this.eggPet) {
      try { this.eggPet.update(dt); } catch (eggErr) {
        try { sfReportError('eggPet/update', eggErr, 'Ei-pet hiccup — speel door'); } catch (_) {}
      }
    }

    if (this.mode === 'adventure') {
      try { this.updateAdventure(dt); } catch (advErr) {
        try { sfReportError('adventure/update', advErr, 'Avontuur hiccup — speel door'); } catch (_) {}
      }
    } else if (this.mode === 'training') {
      try { this.updateTraining(dt); } catch (trErr) {
        try { sfReportError('training/update', trErr, 'Training hiccup — speel door'); } catch (_) {}
      }
    } else if (this.mode === 'versus') {
      try { this.updateVersus(dt); } catch (vsErr) {
        try { sfReportError('versus/update', vsErr, 'Versus hiccup — speel door'); } catch (_) {}
      }
    } else if (this.mode === 'wall') {
      try { this.updateWall(dt); } catch (wErr) {
        try { sfReportError('wall/update', wErr, 'Muur hiccup — speel door'); } catch (_) {}
      }
    } else if (this.mode === 'coinrun') {
      try { this.updateCoinRun(dt); } catch (crErr) {
        try { sfReportError('coinrun/update', crErr, 'Mats hiccup — speel door'); } catch (_) {}
      }
    }

    for (const m of this.monsters) {
      try { m.update(dt, this); } catch (monErr) {
        try { sfReportError('monster/update', monErr, 'Vijand hiccup — speel door'); } catch (_) {}
      }
    }
    try { if (typeof tickWeaponStatusEffects === 'function') tickWeaponStatusEffects(this, dt); } catch (_) {}
    if (this.player && this.player._wpnCritSurgeT > 0) this.player._wpnCritSurgeT -= dt;
    if (this.p2 && this.p2._wpnCritSurgeT > 0) this.p2._wpnCritSurgeT -= dt;
    this.monsters = this.monsters.filter(m => m.alive || m.deadT < 1);
    if (this.mode === 'adventure') tickSuperFx(this, dt);

    // projectielen
    try {
    for (const p of this.projectiles) {
      const skProj = skillExists(p.kind) ? skillById(p.kind) : null;
      p.life -= dt;
      const spinRate = skProj
        ? (skProj.behavior === 'pull' || skProj.behavior === 'meteor' ? 16
          : skProj.behavior === 'slash' ? 28
          : skProj.behavior === 'dash' ? 20 : skProj.behavior === 'disc' ? 24 : 22)
        : (p.kind === 'shuriken' ? 28 : p.kind === 'boemerang' ? 34 : 12);
      p.spin = (p.spin || 0) + dt * spinRate;
      p.vy += (p.grav || 0) * dt;
      // Rasengan-krul: vanuit horizontaal omhoog/omlaag buigen
      if (p.curl) {
        p.vy += p.curl * (p.curlAccel || 420) * dt;
        const lim = p.curlMaxVy || 280;
        if (p.vy > lim) p.vy = lim;
        if (p.vy < -lim) p.vy = -lim;
      }
      // Rinnegan lichtschits: expandeert links/rechts i.p.v. te vliegen
      if (p.slashWave) {
        const maxR = p.slashMaxReach || 460;
        p.slashReach = Math.min(maxR, (p.slashReach || 0) + (p.slashExpand || 720) * dt);
        // Tip-dikte: hoe verder, hoe smaller de strook
        const taper = clamp((p.slashReach || 0) / Math.max(1, maxR), 0, 1);
        p.r = Math.max(5, (p.r0 || 42) * (1 - taper * 0.82));
        if (!motionReduced()) {
          p._trailAcc = (p._trailAcc || 0) + dt;
          const interval = (save.liteFx || Perf.tier >= 1) ? 0.06 : 0.028;
          if (p._trailAcc >= interval) {
            p._trailAcc = 0;
            const col = (skProj && skProj.color) || '#c47aff';
            const reach = p.slashReach || 0;
            const tipH = Math.max(4, (p.r0 || 42) * (1 - taper * 0.82) * 0.55);
            const n = (save.liteFx || Perf.tier >= 1) ? 1 : 2;
            this.burst(p.x + reach, p.y + rand(-tipH, tipH), col, n, { kind: 'spark', size: 2.2 });
            this.burst(p.x - reach, p.y + rand(-tipH, tipH), col, n, { kind: 'spark', size: 2.2 });
          }
        }
      }
      // Boemerang: uitgooien → terugkeren naar thrower (kan opnieuw raken)
      if (p.kind === 'boemerang') {
        p.outT = (p.outT || 0) + dt;
        const owner = p.from === 'p2' ? this.p2
          : (p.from === 'player' || p.from === 'p1') ? this.player : null;
        if (!p.returning) {
          const ox = p.originX != null ? p.originX : p.x;
          const oy = p.originY != null ? p.originY : p.y;
          const dist = Math.hypot(p.x - ox, p.y - oy);
          if (p.outT >= 0.42 || dist >= 270
              || p.x < 12 || p.x > W - 12 || p.y < 10 || p.y > this.ground + 6) {
            p.returning = true;
            p.hitSet = new Set();
            try { AudioSys.sfx('wBoemerang'); } catch (_) {}
          }
        }
        if (p.returning) {
          if (owner && owner.alive) {
            const tx = owner.x + (owner.face || 1) * 6;
            const ty = owner.y - 52;
            const dx = tx - p.x, dy = ty - p.y;
            const d = Math.hypot(dx, dy) || 1;
            const spd = 560;
            p.vx = (dx / d) * spd;
            p.vy = (dy / d) * spd;
          } else {
            p.life = 0;
          }
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      // Rasengan: niet sterven op de grond — anders verdwijnt de ↓-krul meteen (dual/triple leek 1 schot)
      if (p.kind === 'rasengan') {
        const floorY = this.ground - (p.r || 16) * 0.35;
        if (p.y > floorY) {
          p.y = floorY;
          if (p.vy > 0) p.vy = 0;
          if (p.curl > 0) p.curl = 0;
        }
        if (p.y < 18) {
          p.y = 18;
          if (p.vy < 0) p.vy = 0;
          if (p.curl < 0) p.curl = 0;
        }
      }
      if (p.kind === 'boemerang' && p.returning && p.life > 0) {
        const owner = p.from === 'p2' ? this.p2
          : (p.from === 'player' || p.from === 'p1') ? this.player : null;
        if (owner && owner.alive) {
          const tx = owner.x + (owner.face || 1) * 6;
          const ty = owner.y - 52;
          if (Math.hypot(p.x - tx, p.y - ty) < 30) {
            p.life = 0;
            owner._boomerOut = false;
          }
        }
      }
      if (skProj && (skProj.behavior === 'orb' || skProj.behavior === 'pull' || skProj.behavior === 'meteor')) {
        const grow = (skProj.behavior === 'pull' || skProj.behavior === 'meteor') ? 2.5 : 4;
        p.r = Math.min((skProj.radius || 28) + 8, (p.r || skProj.radius) + dt * grow);
        if (!motionReduced()) {
          p._trailAcc = (p._trailAcc || 0) + dt;
          const interval = (save.liteFx || Perf.tier >= 1) ? 0.07 : 0.032;
          if (p._trailAcc >= interval) {
            p._trailAcc = 0;
            const n = (save.liteFx || Perf.tier >= 1) ? 1 : 2;
            const back = Math.sign(p.vx || 1) * 10;
            this.burst(p.x - back, p.y + rand(-4, 4), skProj.color || '#7cf5ff', n, { kind: 'spark', size: 2.4 });
          }
        }
      }
      if (p.kind === 'kamehame') {
        p.r = Math.min(44, (p.r || 28) + dt * 18);
        if (!motionReduced() && !fxLite()) {
          p._trailAcc = (p._trailAcc || 0) + dt;
          if (p._trailAcc >= 0.04) {
            p._trailAcc = 0;
            this.burst(p.x, p.y, '#7cf5ff', 1, { kind: 'spark', size: 2.6 });
          }
        }
      }
      if (p.from === 'enemy') {
        const pl = this.player;
        if (pl && pl.alive && this.playerHurtCd <= 0
            && projHitsTarget(p, pl.bodyX, pl.bodyY, pl.bodyR * 0.8)) {
          const hit = resolveProjHit(p);
          pl.takeDamage(hit.dmg, projKnockDir(p, pl.x) * 260, this);
          applyHitStop(this, { kind: skProj && (skProj.behavior === 'dash' || skProj.behavior === 'slash') ? 'special' : 'punch', dmg: hit.dmg },
            { crit: hit.crit, heavy: hit.dmg >= 18, playerHurt: true });
          this.floater(pl.x, pl.y - 115, '-' + hit.dmg, '#ff8080', 16);
          if (hit.crit) applyCritFx(this, pl.x, pl.y);
          if (skProj) this.burst(p.x, p.y, skProj.color || '#a8e0ff', 16);
          p.life = 0;
          this.burst(p.x, p.y, skProj ? (skProj.color || '#a8e0ff') : '#ff9a3d', 8);
        }
      } else if (p.from === 'p2' && this.p2) {
        const pl = this.player;
        if (pl && pl.alive && projHitsTarget(p, pl.bodyX, pl.bodyY, pl.bodyR * 0.8)) {
          projStrikeFighter(this, p, pl, '#ff8080');
        }
      } else if (p.from === 'p1' && this.p2) {
        const pl = this.p2;
        if (pl.alive && projHitsTarget(p, pl.bodyX, pl.bodyY, pl.bodyR * 0.8)) {
          projStrikeFighter(this, p, pl, '#ffb0b8');
        }
      } else {
        for (const m of this.monsters) {
          if (!m.alive) continue;
          const allowRehit = p._rehit && p._rehit.has(m);
          if (p.hitSet && p.hitSet.has(m) && !allowRehit) continue;
          if (projHitsTarget(p, m.x, m.y, m.size)) {
            const hit = resolveProjHit(p);
            const dir = projKnockDir(p, m.x);
            try { AudioSys.sfxAt(weaponHitSfx(p.throwId || 'shuriken', hit.dmg), m.x); } catch (_) {}
            m.takeDamage(hit.dmg, dir * 300 * (p.kbMul || 1), this, { skipHitSfx: true, crit: hit.crit });
            if (hit.crit) applyCritFx(this, m.x, m.y);
            if (p.throwId && typeof applyWeaponOnHitEffect === 'function') {
              const owner = this.player;
              if (owner && owner.weapon && owner.weapon.id === p.throwId && owner.weapon.effect) {
                try {
                  applyWeaponOnHitEffect(this, owner, m, { dmg: hit.dmg, crit: hit.crit, finisher: false });
                } catch (_) {}
              }
            }
            if (skProj) spawnJutsuImpactFx(this, m.x, m.y, p.kind, 'full');
            if (p.hitSet) p.hitSet.add(m); else p.life = 0;
          }
        }
        if (this.robot && this.robot.alive && !(p.hitSet && p.hitSet.has(this.robot))) {
          const rb = this.robot;
          if (projHitsTarget(p, rb.bodyX, rb.bodyY, rb.bodyR)) {
            const hit = resolveProjHit(p);
            const d = rb.takeDamage(hit.dmg, projKnockDir(p, rb.x) * 300 * (p.kbMul || 1), this);
            this.floater(rb.x, rb.y - 115, '-' + d, '#ffe680', 16);
            if (hit.crit) applyCritFx(this, rb.x, rb.y);
            if (p.hitSet) p.hitSet.add(rb); else p.life = 0;
          }
        }
        if (this.mode === 'wall' && this.bricks) {
          for (const b of this.bricks) {
            if (b.hp <= 0) continue;
            const bx = b.x + b.w * 0.5, by = b.y + b.h * 0.5;
            const hitBrick = p.slashWave
              ? projHitsTarget(p, bx, by, Math.max(b.w, b.h) * 0.45)
              : (p.x + p.r > b.x && p.x - p.r < b.x + b.w && p.y + p.r > b.y && p.y - p.r < b.y + b.h);
            if (hitBrick) {
              b.hp -= p.dmg;
              if (b.hp <= 0) { this.score++; AudioSys.sfx('brick'); this.burst(p.x, p.y, `hsl(${b.hue},50%,45%)`, 12); }
              if (!p.pierce) p.life = 0;
            }
          }
        }
        if (this.mode === 'coinrun' && this.flyers && (p.kind === 'shuriken' || p.kind === 'boemerang') && p.from === 'player') {
          for (const fl of this.flyers) {
            if (fl.hp <= 0) continue;
            if ((p.x - fl.x) ** 2 + (p.y - fl.y) ** 2 < (p.r + fl.r) ** 2) {
              fl.hp = 0;
              this.coinsCollected += 3;
              this.floater(fl.x, fl.y - 24, t('combat.coinPlus3'), '#ffd75e', 17);
              this.burst(fl.x, fl.y, '#ffd75e', 12);
              AudioSys.sfx('bonus');
              haptic(12);
              p.life = 0;
              break;
            }
          }
        }
      }
      if (p.kind === 'boemerang') {
        if (p.returning && (p.x < -100 || p.x > W + 100 || p.y > this.ground + 50)) {
          p.life = 0;
        }
      } else if (p.slashWave) {
        // Expanderende golf: blijft op plek tot life op is
        if ((p.slashReach || 0) >= (p.slashMaxReach || 460) && p.life > 0.12) {
          p.life = Math.min(p.life, 0.12);
        }
      } else if (p.kind === 'rasengan') {
        // Alleen zijranden — grond wordt hierboven afgehandeld
        if (p.x < -60 || p.x > W + 60) p.life = 0;
      } else if (p.y > this.ground + 10 || p.x < -60 || p.x > W + 60) {
        p.life = 0;
      }
    }
    } catch (projErr) {
      try { sfReportError('projectile/update', projErr, 'Projectiel hiccup — speel door'); } catch (_) {}
    }
    for (const p of this.projectiles) {
      if (p.life <= 0 && p.kind === 'boemerang') {
        const owner = p.from === 'p2' ? this.p2
          : (p.from === 'player' || p.from === 'p1') ? this.player : null;
        if (owner) owner._boomerOut = false;
      }
      if (p.life <= 0 && !p._impactFx && skillExists(p.kind)) {
        p._impactFx = true;
        spawnJutsuImpactFx(this, p.x, p.y, p.kind === 'kamehame' ? 'rasengan' : p.kind, 'small');
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0);

    // deeltjes & tekstjes
    for (const pt of this.particles) {
      pt.life -= dt;
      if (pt.kind !== 'ring') {
        pt.vy += (pt.grav || 900) * dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        if (pt.y > this.ground && pt.vy > 0) { pt.y = this.ground; pt.vy *= -0.4; }
      }
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const fl of this.floaters) {
      fl.life -= dt;
      fl.y -= (fl.vy || 40) * dt;
      if (fl.drift && !motionReduced()) fl.x += fl.drift * dt;
    }
    this.floaters = this.floaters.filter(f => f.life > 0);
    for (const b of this.banners) b.t += dt;
    this.banners = this.banners.filter(b => b.t < b.dur);
    this.trimFxCaps();
  }

  trimFxCaps() {
    const cap = fxCaps();
    const drop = (arr, max) => {
      if (arr.length > max) arr.splice(0, arr.length - max);
    };
    drop(this.particles, cap.particles);
    drop(this.floaters, cap.floaters);
    drop(this.projectiles, cap.projectiles);
    drop(this.banners, cap.banners);
    if (this.player && this.player.afterimages) drop(this.player.afterimages, cap.afterimages);
    if (this.p2 && this.p2.afterimages) drop(this.p2.afterimages, cap.afterimages);
    if (this.robot && this.robot.afterimages) drop(this.robot.afterimages, cap.afterimages);
  }

  noteCombo() {
    this.maxCombo = Math.max(this.maxCombo || 0, this.combo || 0);
    const comboSfx = (n) => (n >= 15 ? 'comboMega' : n >= 10 ? 'comboEpic' : 'combo');
    if (this.mode === 'wall' && (this.combo === 5 || this.combo === 8 || this.combo === 10)) {
      AudioSys.sfx(comboSfx(this.combo));
      const msg = this.combo === 8 ? t('combat.wallTempo') : t('combat.comboN', { n: this.combo });
      this.floater(W * 0.5, 130, msg, '#7cf5ff', 18, 'hud');
    }
    if (this.mode === 'adventure' && (this.combo === 6 || this.combo === 10)) {
      AudioSys.sfx(comboSfx(this.combo));
      this.floater(W * 0.5, 118, t('combat.comboN', { n: this.combo }), '#ffd75e', 16, 'hud');
    }
    if ([5, 10, 15].includes(this.combo) && this.player && !motionReduced()) {
      const col = this.combo >= 10 ? '#ffd75e' : '#7cf5ff';
      spawnFxRing(this, this.player.x, this.player.y - 50, col, 9 + this.combo * 0.35);
      if (this.combo === 5 || this.combo === 10 || this.combo === 15) AudioSys.sfx(comboSfx(this.combo));
    }
    if (this.combo === 3 || this.combo === 5 || this.combo === 8 || this.combo === 10) {
      haptic(14 + this.combo);
    }
  }

  shake(mag, dur) {
    if (save.shake === false || motionReduced()) return;
    this.shakeMag = mag; this.shakeT = Math.max(this.shakeT, dur);
  }
  burst(x, y, color, n, opts) {
    opts = opts || {};
    const kind = opts.kind || 'square';
    const floorN = kind === 'spark' ? 1 : 2;
    if (motionReduced()) n = Math.max(floorN, Math.floor(n * 0.45));
    else if (save.liteFx || Perf.tier >= 1) n = Math.max(kind === 'spark' ? 1 : 3, Math.floor(n * 0.65));
    if (Perf.tier >= 2) n = Math.max(floorN, Math.floor(n * 0.55));
    if (!perfFxBudgetAllow(this, Math.min(n, 4))) n = Math.max(floorN, Math.floor(n * 0.45));
    if (n <= 0 || perfFxRoom(this, 'particle') <= 0) return;
    ensureParticleRoom(this, Math.min(n, 12));
    const cap = fxCaps();
    const room = cap.particles - this.particles.length;
    n = Math.min(n, Math.max(0, room));
    if (n <= 0) return;
    const baseSize = opts.size || 0;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = kind === 'spark' ? rand(20, 90) : rand(60, 320);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (kind === 'spark' ? 40 : 120),
        life: kind === 'spark' ? rand(0.12, 0.28) : rand(0.3, 0.7),
        color,
        size: baseSize || rand(2, 5),
        kind,
        grav: kind === 'spark' ? 200 : 900,
      });
    }
  }
  floater(x, y, txt, color, size, layer) {
    if (!perfFxBudgetAllow(this, 1)) return;
    if (perfFxRoom(this, 'floater') <= 0) return;
    const cap = fxCaps();
    if (this.floaters.length >= cap.floaters) this.floaters.shift();
    const slot = layoutFloaterPos(this, x, y, txt, size, layer);
    this.floaters.push({
      x: slot.x, y: slot.y, txt, color,
      size: size || 15, life: 1.0,
      lane: slot.lane, layer: slot.layer,
      vy: 36 + slot.lane * 5,
      drift: slot.lane % 2 ? (slot.lane % 4 === 1 ? -14 : 14) : 0,
    });
  }
  banner(txt, dur, color, size) {
    if (!perfFxBudgetAllow(this, 1)) return;
    if (perfFxRoom(this, 'banner') <= 0) return;
    if (motionReduced()) {
      dur = Math.min(dur, 1.15);
      size = Math.min(size || 40, 32);
    }
    const lane = pickBannerLane(this.banners);
    this.banners = this.banners.filter((b) => b.lane !== lane);
    this.banners.push({
      txt, dur, color: color || '#fff', size: size || 40, t: 0, lane,
    });
  }

  drawBannerLine(c, b) {
    const k = b.t / b.dur;
    const calm = motionReduced();
    const pop = calm ? 1 : (k < 0.15 ? k / 0.15 : 1);
    const fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
    const lane = typeof b.lane === 'number' ? b.lane : 1;
    const laneScale = lane === 1 ? 1 : 0.92;
    const y = bannerLaneY(H, lane, b.size);
    c.save();
    c.globalAlpha = fade;
    c.translate(W / 2, y);
    c.scale(
      (calm ? 1 : (0.6 + pop * 0.4)) * laneScale,
      (calm ? 1 : (0.6 + pop * 0.4)) * laneScale,
    );
    if (!fxLite() && !calm) {
      c.shadowColor = b.color;
      c.shadowBlur = lane === 1 ? 14 : 9;
    }
    c.font = `900 ${b.size}px -apple-system, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const tw = c.measureText(b.txt).width;
    const ph = b.size * 1.05;
    const pw = tw + 28;
    c.fillStyle = 'rgba(6,10,24,.42)';
    this.rr(c, -pw * 0.5, -ph * 0.52, pw, ph, Math.min(10, ph * 0.22));
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.08)';
    c.lineWidth = 1.5;
    this.rr(c, -pw * 0.5, -ph * 0.52, pw, ph, Math.min(10, ph * 0.22));
    c.stroke();
    if (a11yHighContrast()) {
      fillHudText(c, b.txt, 0, 0, { fill: b.color, stroke: 'rgba(0,0,0,.9)', strokeW: 4 });
    } else {
      c.lineWidth = 8;
      c.strokeStyle = 'rgba(0,0,0,.55)';
      c.strokeText(b.txt, 0, 0);
      c.fillStyle = b.color;
      c.fillText(b.txt, 0, 0);
    }
    if (!fxLite() && !calm && fade > 0.35 && lane === 1) {
      c.globalAlpha = fade * 0.42;
      c.strokeStyle = b.color;
      c.lineWidth = 2.5;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-tw * 0.52, ph * 0.42);
      c.lineTo(tw * 0.52, ph * 0.42);
      c.stroke();
      const sweep = clamp((k - 0.12) / 0.55, 0, 1);
      if (sweep > 0 && sweep < 1) {
        c.save();
        c.globalAlpha = fade * 0.28 * (1 - Math.abs(sweep - 0.5) * 1.6);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = '#fff';
        const bandW = Math.max(18, tw * 0.14);
        const sx = -tw * 0.58 + (tw * 1.16 * sweep);
        c.beginPath();
        c.moveTo(sx, -b.size * 0.62);
        c.lineTo(sx + bandW, -b.size * 0.62);
        c.lineTo(sx + bandW * 0.55, b.size * 0.55);
        c.lineTo(sx - bandW * 0.2, b.size * 0.55);
        c.closePath();
        c.fill();
        c.restore();
      }
    }
    c.restore();
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
  }

  /* ------------------------------ TEKENEN ----------------------------- */
  draw(c) {
    if (!c || W < 8 || H < 8) return;
    if (this.mode !== 'versus' && typeof Input !== 'undefined' && Input.dualMode) {
      try { Input.dualMode = false; } catch (_) {}
    }
    c.save();
    if (this.shakeT > 0) {
      c.translate(rand(-1, 1) * this.shakeMag, rand(-1, 1) * this.shakeMag);
    }
    drawBackground(c, this.theme, this.t, this.ground, this.worldX || 0,
      this.mode === 'adventure' && this.level ? {
        pr: this.progressSmooth || 0,
        part: this.stagePart || 1,
        boss: !!this.level.boss,
      } : null);

    if (this.mode === 'versus' && this.vsMid) {
      c.save();
      c.strokeStyle = 'rgba(255,255,255,.09)';
      c.setLineDash([8, 12]);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(this.vsMid, this.ground - 100);
      c.lineTo(this.vsMid, H);
      c.stroke();
      c.setLineDash([]);
      const sx1 = vsSpawnX(1);
      const sx2 = vsSpawnX(2);
      const showPads = this.phase === 'intro'
        || (this.player && this.player.invulnT > 0.05)
        || (this.p2 && this.p2.invulnT > 0.05);
      if (showPads) {
        const drawPad = (sx, col, label) => {
          c.save();
          c.globalAlpha = this.phase === 'intro' ? 0.55 : 0.28;
          c.fillStyle = col;
          c.beginPath();
          c.ellipse(sx, this.ground - 2, 28, 8, 0, 0, TAU);
          c.fill();
          c.globalAlpha = this.phase === 'intro' ? 0.75 : 0.4;
          c.strokeStyle = col;
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(sx, this.ground - 2, 34, 10, 0, 0, TAU);
          c.stroke();
          if (this.phase === 'intro') {
            c.globalAlpha = 0.85;
            c.font = '800 9px sans-serif';
            c.fillStyle = col;
            c.textAlign = 'center';
            c.fillText(label, sx, this.ground - 78);
          }
          c.restore();
        };
        drawPad(sx1, '#7cf5ff', t('hud.spawnP1'));
        drawPad(sx2, '#ffb0b8', t('hud.spawnP2'));
      }
      if (this.phase === 'intro') {
        c.setLineDash([4, 8]);
        c.strokeStyle = 'rgba(124,245,255,.35)';
        c.beginPath(); c.moveTo(sx1, this.ground - 72); c.lineTo(sx1, H); c.stroke();
        c.strokeStyle = 'rgba(255,176,184,.35)';
        c.beginPath(); c.moveTo(sx2, this.ground - 72); c.lineTo(sx2, H); c.stroke();
        c.setLineDash([]);
      }
      c.font = '800 10px sans-serif';
      c.fillStyle = 'rgba(124,245,255,.5)';
      c.textAlign = 'left';
      c.fillText('P1', Math.max(10, this.minX), this.ground - 6);
      c.fillStyle = 'rgba(255,176,184,.5)';
      c.textAlign = 'right';
      c.fillText('P2', Math.min(W - 10, this.maxX), this.ground - 6);
      c.textAlign = 'center';
      c.restore();
    }

    if (this.mode === 'adventure' && this.pickups) {
      for (const pk of this.pickups) {
        const meta = PICKUP_META[pk.kind] || PICKUP_META.heal;
        const pkCol = (pk.kind === 'skill_shard' && pk.skillId && SKILL_DEFS[pk.skillId])
          ? SKILL_DEFS[pk.skillId].color
          : (pk.kind === 'item_shard' && pk.itemCat && pk.itemId)
            ? itemUpgradeColor(pk.itemCat, pk.itemId)
            : meta.color;
        const y = pk.y + (pk.bob || 0);
        c.save();
        const pkBlur = (save.liteFx || Perf.tier >= 1 || motionReduced()) ? 0 : 14;
        c.shadowColor = pkCol; c.shadowBlur = pkBlur;
        c.fillStyle = pkCol;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.stroke();
        drawPickupIcon(c, pk.kind, pk.x, y, pkCol);
        c.restore();
      }
    }

    if (this.mode === 'wall') this.drawWall(c);
    if (this.mode === 'coinrun') this.drawCoinRunLayer(c);

    if (this.mode === 'adventure') this.drawApproachingWave(c);
    if (this.mode === 'adventure') this.drawTravelSpeedLines(c);
    for (const m of this.monsters) m.draw(c);
    if (this.robot) this.robot.draw(c);
    if (this.p2) this.p2.draw(c);
    if (this.eggPet) this.eggPet.draw(c);
    if (this.pet) this.pet.draw(c);
    if (this.mode === 'adventure') drawSuperShieldBubble(this, c, this.player);
    this.player.draw(c);

    // projectielen
    for (const p of this.projectiles) {
      c.save();
      if (skillExists(p.kind)) {
        const skDraw = skillById(p.kind);
        if (!fxLite() && !motionReduced()) {
          if (skDraw.behavior === 'orb') {
            c.save();
            c.globalAlpha = 0.28 + Math.sin((p.spin || 0) * 2.1) * 0.12;
            c.strokeStyle = skDraw.color || '#7cf5ff';
            c.lineWidth = 2;
            c.beginPath();
            c.arc(p.x, p.y, p.r * (1.22 + Math.sin(p.spin * 1.4) * 0.06), 0, TAU);
            c.stroke();
            // Outer spiral whisper
            c.globalAlpha = 0.18 + Math.sin((p.spin || 0) * 3.2) * 0.08;
            c.lineWidth = 1.4;
            c.beginPath();
            c.arc(p.x, p.y, p.r * 1.45, p.spin || 0, (p.spin || 0) + Math.PI * 1.4);
            c.stroke();
            c.restore();
          } else if (skDraw.behavior === 'dash') {
            // Chidori flight — crackle trail behind the bolt
            const ang = Math.atan2(p.vy || 0, p.vx || 1);
            c.save();
            c.globalAlpha = 0.35;
            c.strokeStyle = skDraw.color || '#a8e0ff';
            c.lineWidth = 2;
            c.lineCap = 'round';
            for (let i = 0; i < 3; i++) {
              const back = 10 + i * 9;
              const wob = Math.sin((p.spin || 0) * 8 + i * 2.2) * 5;
              c.beginPath();
              c.moveTo(p.x, p.y);
              c.lineTo(
                p.x - Math.cos(ang) * back + Math.cos(ang + Math.PI / 2) * wob,
                p.y - Math.sin(ang) * back + Math.sin(ang + Math.PI / 2) * wob
              );
              c.stroke();
            }
            c.restore();
          }
        }
        if (p.slashWave || skDraw.behavior === 'slash') {
          drawRinneganSlashWave(c, p);
        } else {
          drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, p.kind, 1);
        }
      } else if (p.kind === 'shuriken') {
        c.translate(p.x, p.y); c.rotate(p.spin || 0);
        const big = p.throwId === 'fuuma';
        c.fillStyle = big ? '#9aa8bc' : '#c9d6e8';
        const tip = big ? 18 : 12;
        for (let i = 0; i < 4; i++) {
          c.rotate(Math.PI / 2);
          c.beginPath(); c.moveTo(0, 0); c.lineTo(big ? 5 : 3, big ? -5 : -3); c.lineTo(tip, 0); c.lineTo(big ? 5 : 3, big ? 5 : 3); c.closePath(); c.fill();
        }
        if (big) {
          c.fillStyle = '#3a4560'; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
        }
      } else if (p.kind === 'boemerang') {
        c.translate(p.x, p.y);
        c.rotate(p.spin || 0);
        c.strokeStyle = '#a86a30';
        c.lineWidth = 7;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(-16, -14);
        c.quadraticCurveTo(-4, -16, 0, 0);
        c.quadraticCurveTo(4, 16, 16, 14);
        c.stroke();
        c.strokeStyle = '#e0a868';
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(-12, -10);
        c.quadraticCurveTo(-3, -12, 0, 0);
        c.quadraticCurveTo(3, 12, 12, 10);
        c.stroke();
      } else if (p.kind === 'wave') {
        c.shadowColor = '#ffd75e'; c.shadowBlur = 16;
        c.fillStyle = 'rgba(255,215,94,.9)';
        c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 1.5, 0, 0, TAU); c.fill();
      } else if (p.kind === 'fire') {
        c.fillStyle = '#ff7a30';
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
        c.fillStyle = '#ffd166';
        c.beginPath(); c.arc(p.x - p.vx * 0.01, p.y, p.r * 0.55, 0, TAU); c.fill();
      } else if (p.kind === 'orb') {
        c.fillStyle = 'rgba(180,140,255,.9)';
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
      } else if (p.kind === 'ink') {
        c.fillStyle = 'rgba(42,24,64,.88)';
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
        c.fillStyle = 'rgba(180,120,255,.55)';
        c.beginPath(); c.arc(p.x - p.vx * 0.012, p.y - p.vy * 0.012, p.r * 0.55, 0, TAU); c.fill();
      } else { // laser / robolaser
        c.strokeStyle = p.kind === 'robolaser' ? '#ff5d5d' : '#7cf5ff'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); c.lineTo(p.x, p.y); c.stroke();
      }
      c.restore();
    }

    // deeltjes
    for (const pt of this.particles) {
      c.globalAlpha = clamp(pt.life * 2, 0, 1);
      if (pt.kind === 'ring') {
        const maxL = pt.maxLife || 0.34;
        const t = 1 - clamp(pt.life / maxL, 0, 1);
        const rr = pt.size * (1 + t * 1.1);
        c.strokeStyle = pt.color;
        c.lineWidth = 2.2 * (1 - t * 0.45);
        c.globalAlpha = clamp(pt.life * 3.2, 0, 0.88);
        c.beginPath();
        c.arc(pt.x, pt.y, rr, 0, TAU);
        c.stroke();
        if (fxLite() && t < 0.4) {
          c.globalAlpha = clamp(pt.life * 1.4, 0, 0.22);
          c.fillStyle = pt.color;
          c.beginPath();
          c.arc(pt.x, pt.y, rr * 0.72, 0, TAU);
          c.fill();
        }
        if (!fxLite() && t < 0.55) {
          c.globalAlpha = clamp(pt.life * 1.8, 0, 0.35);
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(pt.x, pt.y, pt.size * (0.55 + t * 0.65), 0, TAU);
          c.stroke();
        }
        continue;
      }
      c.fillStyle = pt.color;
      if (pt.kind === 'spark') {
        c.beginPath();
        c.arc(pt.x, pt.y, pt.size, 0, TAU);
        c.fill();
      } else if (pt.kind === 'star') {
        if (typeof drawStarShape === 'function') {
          drawStarShape(c, pt.x, pt.y, pt.size, pt.color, true);
        } else {
          c.beginPath();
          c.arc(pt.x, pt.y, pt.size * 0.45, 0, TAU);
          c.fill();
        }
      } else {
        c.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
    }
    c.globalAlpha = 1;

    // d20 polish #12 — baas fase-2 scherm kleurflits
    if (this.bossPhase2Flash > 0 && !motionReduced()) {
      const p = clamp(this.bossPhase2Flash / 0.55, 0, 1);
      c.save();
      c.globalAlpha = p * 0.32;
      c.fillStyle = this.bossPhase2Hue || '#ff3040';
      c.fillRect(0, 0, W, H);
      c.globalAlpha = p * 0.22;
      const g = c.createRadialGradient(W * 0.5, H * 0.42, 20, W * 0.5, H * 0.42, Math.max(W, H) * 0.55);
      g.addColorStop(0, '#ffd75e');
      g.addColorStop(0.45, '#ff6b6b');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      // Pixel edge ticks
      if (!fxLite() && p > 0.2) {
        c.globalAlpha = p * 0.55;
        c.fillStyle = '#ffb830';
        const px = 4;
        for (let i = 0; i < 10; i++) {
          c.fillRect(i * (W / 10) + 6, 8, px, px);
          c.fillRect(i * (W / 10) + 6, H - 12, px, px);
        }
      }
      c.restore();
    }

    // zwevende tekstjes — sorteer op diepte, outline voor leesbaarheid
    c.textAlign = 'center';
    const flDraw = this.floaters.slice().sort((a, b) => a.y - b.y);
    for (const fl of flDraw) {
      c.globalAlpha = clamp(fl.life * 1.6, 0, 1);
      c.font = `800 ${fl.size}px -apple-system, sans-serif`;
      if (a11yHighContrast() && typeof fillHudText === 'function') {
        fillHudText(c, fl.txt, fl.x, fl.y, { fill: fl.color, stroke: 'rgba(0,0,0,.9)', strokeW: 3 });
      } else {
        c.lineWidth = Math.max(3, fl.size * 0.22);
        c.strokeStyle = 'rgba(0,0,0,.52)';
        c.strokeText(fl.txt, fl.x, fl.y);
        c.fillStyle = fl.color;
        c.fillText(fl.txt, fl.x, fl.y);
      }
    }
    c.globalAlpha = 1;
    c.restore();

    this.drawChakraReadyFx(c);
    if (this.mode === 'adventure') {
      try { drawSuperFxLayer(this, c); } catch (_) {}
      try { this.drawKetsbamChargeAura(c); } catch (_) {}
      try { this.drawPartGateCue(c); } catch (_) {}
    }

    this.drawHUD(c);

    // banners — max 3 lanes, geen overlap
    const bannerDraw = this.banners.slice().sort((a, b) => (a.lane || 0) - (b.lane || 0));
    for (const b of bannerDraw) this.drawBannerLine(c, b);

    if (IS_TOUCH) {
      try { this.drawTouchControls(c); } catch (_) {}
    }
    if (this.mode === 'adventure') {
      try { this.drawKetsbamPrompt(c); } catch (_) {}
    }

    if (this.hint > 0) {
      c.globalAlpha = clamp(this.hint, 0, 1);
      let hintTxt = this.modeHintLine;
      if (!hintTxt) {
        const dualOk = Input.dualMode && this.mode === 'versus';
        if (dualOk && IS_TOUCH) {
          hintTxt = t('hud.hintDualTouch');
        } else if (dualOk) {
          hintTxt = t('hud.hintDualKb');
        } else if (IS_TOUCH) {
          hintTxt = t('hud.hintTouch');
        } else {
          hintTxt = t('hud.hintKb');
        }
      }
      c.font = '600 15px -apple-system, sans-serif';
      c.textAlign = 'center';
      const tw = c.measureText(hintTxt).width;
      const padX = 16;
      const hintY = (this.mode === 'adventure' && this.advHudBottom > 0)
        ? Math.max(H * 0.2, this.advHudBottom + 20)
        : H * 0.2;
      const pillY = hintY - 24;
      c.fillStyle = 'rgba(6,10,24,.78)';
      this.rr(c, W / 2 - tw / 2 - padX, pillY, tw + padX * 2, 30, 10);
      c.fill();
      c.strokeStyle = 'rgba(255,215,94,.35)';
      c.lineWidth = a11yHighContrast() ? 2.5 : 1.5;
      this.rr(c, W / 2 - tw / 2 - padX, pillY, tw + padX * 2, 30, 10);
      c.stroke();
      fillHudText(c, hintTxt, W / 2, hintY, {
        fill: '#fff',
        stroke: 'rgba(0,0,0,.85)',
        strokeW: a11yHighContrast() ? 3.5 : 0,
      });
      c.globalAlpha = 1;
    }
  }

  drawWall(c) {
    const lite = fxLite() || motionReduced() || (typeof Perf !== 'undefined' && Perf.tier >= 2);
    const prevSmooth = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      this.drawWallBrickTile(c, b, lite);
    }
    c.imageSmoothingEnabled = prevSmooth;
  }

  /** d20 polish #13 — Muur-modus tegel texture (pixel mortar + chips). */
  drawWallBrickTile(c, b, lite) {
    const dmg = 1 - b.hp / b.maxhp;
    const px = 3;
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    const w = Math.round(b.w);
    const h = Math.round(b.h);
    const hue = b.hue || 18;
    const L = 48 - dmg * 14;

    // Mortar frame
    c.fillStyle = `hsl(${hue}, 18%, ${22 - dmg * 4}%)`;
    c.fillRect(x - 1, y - 1, w + 2, h + 2);

    // Base tile body
    c.fillStyle = `hsl(${hue}, 42%, ${L}%)`;
    c.fillRect(x, y, w, h);

    // Pixel highlight rim (top + left)
    c.fillStyle = `hsla(${hue}, 50%, ${Math.min(72, L + 18)}%, .55)`;
    c.fillRect(x, y, w, px);
    c.fillRect(x, y, px, h);
    // Shadow rim (bottom + right)
    c.fillStyle = 'rgba(0,0,0,.28)';
    c.fillRect(x, y + h - px, w, px);
    c.fillRect(x + w - px, y, px, h);

    // Sub-tile mortar grooves (2×2 mini bricks)
    if (!lite) {
      const midX = x + Math.floor(w / 2);
      const midY = y + Math.floor(h / 2);
      c.fillStyle = 'rgba(0,0,0,.22)';
      c.fillRect(midX - 1, y + 1, 2, h - 2);
      c.fillRect(x + 1, midY - 1, w - 2, 2);
      // Subtle face variation per quadrant
      const seed = b.seed | 0;
      c.fillStyle = `hsla(${hue}, 38%, ${L + 6}%, .18)`;
      if (seed & 1) c.fillRect(x + px, y + px, midX - x - px * 2, midY - y - px * 2);
      if (seed & 2) c.fillRect(midX + 2, y + px, x + w - midX - px - 2, midY - y - px * 2);
      if (seed & 4) c.fillStyle = 'rgba(0,0,0,.12)';
      if (seed & 4) c.fillRect(x + px, midY + 2, midX - x - px * 2, y + h - midY - px - 2);
    }

    // Speckle grit (deterministic from seed)
    if (!lite) {
      const seed = b.seed | 0;
      for (let i = 0; i < 5; i++) {
        const sx = x + px + ((seed * (i + 3) * 17) % Math.max(1, w - px * 2));
        const sy = y + px + ((seed * (i + 5) * 13) % Math.max(1, h - px * 2));
        c.fillStyle = i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.16)';
        c.fillRect(sx, sy, px, px);
      }
    }

    // Damage chips — pixel corners/chunks missing
    if (dmg > 0.2) {
      c.fillStyle = `hsl(${hue}, 12%, ${14}%)`;
      const chips = dmg > 0.7 ? 5 : dmg > 0.4 ? 3 : 2;
      const seed = b.seed | 0;
      for (let i = 0; i < chips; i++) {
        const cx = x + ((seed * (i + 11) * 19) % Math.max(1, w - px));
        const cy = y + ((seed * (i + 7) * 23) % Math.max(1, h - px));
        c.fillRect(cx, cy, px + (i % 2), px);
      }
    }

    // Crack lines (kept, slightly thicker for pixel look)
    if (dmg > 0.25) {
      c.strokeStyle = 'rgba(0,0,0,.5)';
      c.lineWidth = 2;
      c.lineCap = 'square';
      const cx = x + (b.seed % Math.max(1, w));
      const cy = y + ((b.seed * 3) % Math.max(1, h));
      const n = dmg > 0.65 ? 4 : 2;
      for (let i = 0; i < n; i++) {
        const a = (b.seed + i * 2.4) % TAU;
        c.beginPath();
        c.moveTo(Math.round(cx), Math.round(cy));
        c.lineTo(
          Math.round(cx + Math.cos(a) * w * 0.4),
          Math.round(cy + Math.sin(a) * h * 0.5)
        );
        c.stroke();
      }
    }

    // Bonus gold pixel frame + star
    if (b.bonus) {
      c.fillStyle = 'rgba(255,215,94,.55)';
      c.fillRect(x, y, w, 2);
      c.fillRect(x, y + h - 2, w, 2);
      c.fillRect(x, y, 2, h);
      c.fillRect(x + w - 2, y, 2, h);
      for (let i = 0; i < w; i += px * 2) {
        c.fillStyle = '#ffd75e';
        c.fillRect(x + i, y, px, px);
        c.fillRect(x + i, y + h - px, px, px);
      }
      drawStarShape(c, x + w / 2, y + h / 2, 7, '#ffd75e', true);
    }
  }

  drawSuperMeterFill(c, x, y, w, h, pct, kind, t) {
    pct = clamp(pct, 0, 1);
    const ready = pct >= 1;
    const calm = motionReduced();
    c.save();
    if (kind === 'chidori') {
      const seg = 10;
      const segW = w / seg;
      for (let i = 0; i < seg; i++) {
        const segStart = i / seg;
        if (pct <= segStart) continue;
        const fill = Math.min(1, (pct - segStart) * seg);
        if (fill <= 0.01) continue;
        const flick = calm ? 0.85 : (0.7 + Math.sin(t * 24 + i * 1.9) * 0.3);
        c.fillStyle = ready ? `rgba(168,224,255,${flick})` : `rgba(80,160,255,${0.45 + fill * 0.45})`;
        this.rr(c, x + i * segW + 1, y + 1, Math.max(1, segW * fill - 2), h - 2, 2);
        c.fill();
      }
    } else if (kind === 'rinnegan') {
      const rings = 6;
      for (let i = 0; i < rings; i++) {
        const segStart = i / rings;
        if (pct <= segStart) continue;
        const fill = Math.min(1, (pct - segStart) * rings);
        const pulse = calm ? 0.7 : (0.55 + Math.sin(t * 9 + i * 1.1) * 0.25);
        c.fillStyle = ready ? `rgba(196,122,255,${pulse})` : `rgba(100,40,160,${0.35 + fill * 0.45})`;
        const rw = w / rings;
        this.rr(c, x + i * rw + 1, y + 1, Math.max(1, rw * fill - 2), h - 2, 3);
        c.fill();
      }
      if (pct > 0.2 && !fxLite() && !calm) {
        c.strokeStyle = `rgba(255,120,160,${0.25 + Math.sin(t * 6) * 0.12})`;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(x + w * pct * 0.5, y + h * 0.5, h * 1.4, t * 3, t * 3 + Math.PI);
        c.stroke();
      }
    } else {
      const fw = w * pct;
      if (fw > 1) {
        const g = c.createLinearGradient(x, y, x + fw, y + h);
        g.addColorStop(0, '#1a5cff');
        g.addColorStop(0.55, '#3db8ff');
        g.addColorStop(1, ready ? '#9af5ff' : '#5ad0ff');
        c.fillStyle = g;
        this.rr(c, x, y, fw, h, 5);
        c.fill();
        if (pct > 0.12 && !fxLite() && !calm) {
          c.strokeStyle = `rgba(230,250,255,${0.28 + Math.sin(t * 7) * 0.12})`;
          c.lineWidth = 1.2;
          const cx = x + fw * 0.55;
          const cy = y + h * 0.5;
          c.beginPath();
          for (let a = 0; a <= TAU * 1.6; a += 0.35) {
            const r = Math.min(fw, h * 2) * 0.22 * (a / (TAU * 1.6));
            const px = cx + Math.cos(a + t * 5) * r;
            const py = cy + Math.sin(a + t * 5) * r * 0.55;
            if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
          }
          c.stroke();
        }
      }
    }
    c.restore();
  }

  drawChakraReadyFx(c) {
    const fighters = [this.player];
    if (this.p2) fighters.push(this.p2);
    const calm = motionReduced();
    for (const f of fighters) {
      if (!f || !f.alive || f.energy < 100) continue;
      const kind = fighterJutsuKind(f);
      if (kind === 'rasengan' && (f.specialCd || 0) > 0) continue;
      if (calm) {
        c.save();
        c.globalAlpha = 0.42;
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : (kind === 'chidori' ? '#a8e0ff' : kind === 'rinnegan' ? '#c47aff' : '#7cf5ff');
        c.lineWidth = 2;
        c.beginPath();
        c.arc(f.x, f.y - 55, 36, 0, TAU);
        c.stroke();
        c.restore();
        continue;
      }
      const pulse = 0.35 + Math.sin(this.t * 7) * 0.15;
      c.save();
      c.globalAlpha = pulse;
      if (kind === 'chidori') {
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : '#a8e0ff';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(f.x, f.y - 55, 38 + Math.sin(this.t * 11) * 5, 0, TAU);
        c.stroke();
        c.globalAlpha = pulse * 0.6;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(f.x - 20, f.y - 60 + i * 12);
          c.lineTo(f.x + 28, f.y - 52 + i * 10);
          c.stroke();
        }
      } else if (kind === 'rinnegan') {
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : '#c47aff';
        c.lineWidth = 3;
        c.lineCap = 'round';
        // Tweerichtings lichtschits-pulse (klaar-signaal)
        for (const dir of [-1, 1]) {
          const len = 34 + Math.sin(this.t * 10) * 6;
          c.beginPath();
          c.moveTo(f.x, f.y - 55);
          c.lineTo(f.x + dir * len * 0.4, f.y - 55 + Math.sin(this.t * 14 + dir) * 4);
          c.lineTo(f.x + dir * len * 0.7, f.y - 55 - Math.sin(this.t * 11 + dir) * 3);
          c.lineTo(f.x + dir * len, f.y - 55);
          c.stroke();
        }
        c.fillStyle = '#e8d0ff';
        c.beginPath();
        c.arc(f.x, f.y - 55, 5 + Math.sin(this.t * 8) * 1.5, 0, TAU);
        c.fill();
      } else {
        c.strokeStyle = f.playerSlot === 2 ? '#ffb0b8' : '#7cf5ff';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(f.x, f.y - 55, 38 + Math.sin(this.t * 9) * 4, 0, TAU);
        c.stroke();
        c.globalAlpha = pulse * 0.5;
        c.beginPath();
        c.arc(f.x, f.y - 55, 48 + Math.sin(this.t * 6) * 3, this.t * 2, this.t * 2 + Math.PI * 1.2);
        c.stroke();
      }
      c.restore();
    }
  }

  /** d4 c4: huidige golf-trait pill (flyers/rush/elite) — zichtbaar tijdens gevecht. */
  drawAdvTraitChip(c, cx, cy, meta) {
    if (!meta || !meta.trait || meta.trait === 'boss') return cy;
    const banner = typeof waveTraitBanner === 'function' ? waveTraitBanner(meta.trait) : null;
    const label = (banner && banner.text) || meta.label;
    if (!label) return cy;
    const col = (banner && banner.color) || '#ffd75e';
    c.save();
    c.font = '800 10px -apple-system, sans-serif';
    const tw = c.measureText(label).width;
    const padX = 8;
    const w = tw + padX * 2;
    const h = 16;
    const x = cx - w / 2;
    const y = cy - h / 2;
    c.fillStyle = 'rgba(0,0,0,.45)';
    this.rr(c, x, y, w, h, 8);
    c.fill();
    c.strokeStyle = col + 'aa';
    c.lineWidth = 1.5;
    this.rr(c, x, y, w, h, 8);
    c.stroke();
    c.fillStyle = col;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, cx, cy + 0.5);
    c.restore();
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    return cy + h / 2 + 6;
  }

  /** d4 c4: sterren-buffer strip — HP% t.o.v. 2★/3★ drempels (hoek rechtsboven). */
  drawAdvStarBuffer(c, x, y, hpPct) {
    const barW = 50;
    const barH = 4;
    const pct = clamp(hpPct, 0, 1);
    c.save();
    c.fillStyle = 'rgba(0,0,0,.45)';
    this.rr(c, x, y, barW, barH, 2);
    c.fill();
    const fillCol = pct > STAR_HP.three ? '#6ee06e' : (pct > STAR_HP.two ? '#ffd75e' : '#ff8a9a');
    c.fillStyle = fillCol;
    this.rr(c, x, y, barW * pct, barH, 2);
    c.fill();
    c.strokeStyle = 'rgba(255,215,94,.65)';
    c.lineWidth = 1;
    for (const frac of [STAR_HP.two, STAR_HP.three]) {
      const tx = x + barW * frac;
      c.beginPath();
      c.moveTo(tx, y - 1);
      c.lineTo(tx, y + barH + 1);
      c.stroke();
    }
    c.restore();
  }

  /** Deel 2: volgende golf komt als silhouetten aanlopen tijdens de reis. */
  drawApproachingWave(c) {
    if (!(this.wavePause > 0) || !this.level) return;
    const nextIdx = this.waveIdx + 1;
    const next = this.level.waves[nextIdx];
    if (!next || !next.length) return;
    const totalPause = this.wavePauseTotal || 1.55;
    const f = clamp(1 - this.wavePause / totalPause, 0, 1);
    const count = Math.min(4, next.length);
    c.save();
    for (let i = 0; i < count; i++) {
      const def = next[i];
      const sp = SPECIES[def.sp];
      if (!sp) continue;
      const size = (sp.size || 24) * (def.elite ? 1.4 : 1) * (def.superBoss ? 1.32 : 1);
      const flying = sp.type === 'fly' || sp.type === 'dragon';
      const bob = Math.sin(this.t * 6 + i * 1.7) * (flying ? 8 : 2.5);
      // van ver (klein, rechts) naar dichtbij
      const x = W + 60 - f * (140 + i * 12) + i * 44;
      if (x > W + 50) continue;
      const y = flying ? this.ground - 120 + bob : this.ground - size * (0.55 + f * 0.45) + bob;
      const scale = 0.45 + f * 0.55;
      c.globalAlpha = 0.2 + f * 0.35;
      c.fillStyle = def.superBoss ? 'rgba(255,215,94,.9)' : (def.elite ? 'rgba(255,138,154,.85)' : (sp.c2 || '#20263f'));
      c.beginPath();
      c.ellipse(x, y, size * scale, size * scale * 0.88, 0, 0, TAU);
      c.fill();
      // ogen-glimp zodat het "iets levends" is
      c.globalAlpha = 0.35 + f * 0.5;
      c.fillStyle = '#fff';
      const eye = Math.max(1.6, size * scale * 0.13);
      c.beginPath(); c.arc(x - size * scale * 0.28, y - size * scale * 0.2, eye, 0, TAU); c.fill();
      c.beginPath(); c.arc(x + size * scale * 0.02, y - size * scale * 0.22, eye, 0, TAU); c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  /** Preview van volgende golf tijdens reis — kleine silhouet-chips. */
  drawNextWavePreview(c) {
    const nextIdx = this.waveIdx + 1;
    const next = this.level && this.level.waves[nextIdx];
    if (!next || !next.length) return;
    const meta = this.level.waveMeta && this.level.waveMeta[nextIdx];
    const chips = Math.min(5, next.length);
    const gap = 22;
    const x0 = W / 2 - ((chips - 1) * gap) / 2;
    const y = H - 52;
    c.save();
    c.font = '700 9px sans-serif';
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.textAlign = 'center';
    c.fillText(t('hud.nextWave'), W / 2, y - 14);
    for (let i = 0; i < chips; i++) {
      const def = next[i];
      const sp = SPECIES[def.sp];
      if (!sp) continue;
      const cx = x0 + i * gap;
      const flying = sp.type === 'fly' || sp.type === 'dragon';
      const col = def.superBoss ? '#ffd75e' : (def.elite ? '#ffb0b8' : (sp.c2 || '#8899bb'));
      const traitCol = meta && meta.trait === 'flyers' ? '#c47aff'
        : (meta && meta.trait === 'rush' ? '#ffb06a'
          : (meta && meta.trait === 'elite' ? '#ffb0b8' : null));
      c.fillStyle = col;
      c.globalAlpha = 0.75;
      c.beginPath();
      c.arc(cx, y + (flying ? -5 : 0), 6 + (def.elite ? 1.5 : 0), 0, TAU);
      c.fill();
      if (traitCol && i === 0) {
        c.strokeStyle = traitCol;
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, y + (flying ? -5 : 0), 9 + (def.elite ? 1 : 0), 0, TAU);
        c.stroke();
      }
      if (flying) {
        c.strokeStyle = 'rgba(196,122,255,.7)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(cx - 5, y - 2);
        c.lineTo(cx + 5, y - 2);
        c.stroke();
      }
    }
    if (meta && meta.label) {
      c.globalAlpha = 0.85;
      c.fillStyle = meta.trait === 'flyers' ? '#c47aff' : (meta.trait === 'rush' ? '#ffb06a' : '#ffb0b8');
      c.fillText(meta.label, W / 2, y + 16);
    }
    c.restore();
    c.globalAlpha = 1;
    c.textAlign = 'center';
  }

  /** Deel 3: speed-lines tijdens de reis — geeft vaart zonder echte camera. */
  drawTravelSpeedLines(c) {
    if (!this.traveling || fxLite() || motionReduced()) return;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,.16)';
    c.lineWidth = 2;
    c.lineCap = 'round';
    const scroll = this.worldX || 0;
    for (let i = 0; i < 7; i++) {
      const y = this.ground - 30 - ((i * 97) % Math.max(80, this.ground - 120));
      const len = 46 + (i * 31) % 60;
      const x = W - (((scroll * (2.4 + (i % 3) * 0.8)) + i * 240) % (W + len)) ;
      c.globalAlpha = 0.1 + (i % 3) * 0.05;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + len, y);
      c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  /** Checkpoint-tunnel: drie knipperende pijlen + voortgangsbalk — loop rechts door. */
  drawPartGateCue(c) {
    if (!this.partGate || !this.player?.alive) return;
    const pg = this.partGate;
    const prog = clamp(pg.progress || 0, 0, 1);
    const gt = pg.t || 0;
    const walking = !!pg.walking;
    const calm = motionReduced();
    const ui = touchUiScale(W, H);
    const px = this.player.x;
    const py = this.player.y - 72;
    const barW = Math.min(220, W * 0.42);
    const barH = Math.max(10, Math.round(12 * ui));

    c.save();
    // gloedpad op de grond
    c.globalAlpha = 0.22 + prog * 0.18;
    const pathGrad = c.createLinearGradient(px - 20, py, px + barW + 40, py);
    pathGrad.addColorStop(0, 'rgba(124,245,255,0)');
    pathGrad.addColorStop(0.35, 'rgba(124,245,255,0.55)');
    pathGrad.addColorStop(1, 'rgba(255,215,94,0.85)');
    c.fillStyle = pathGrad;
    c.beginPath();
    c.moveTo(px - 12, this.ground - 4);
    c.lineTo(px + barW + 52, this.ground - 4);
    c.lineTo(px + barW + 36, this.ground + 8);
    c.lineTo(px - 8, this.ground + 8);
    c.closePath();
    c.fill();

    // drie chevrons >>
    for (let i = 0; i < 3; i++) {
      const phase = gt * (calm ? 4 : (walking ? 9 : 5)) - i * 0.38;
      const blink = calm ? 0.75 : (walking
        ? (0.55 + Math.max(0, Math.sin(phase)) * 0.45)
        : (0.28 + Math.max(0, Math.sin(phase * 0.7)) * 0.35));
      const slide = calm ? 0 : Math.sin(phase * 0.9) * 6;
      const cx = px + 36 + i * (34 * ui) + slide + prog * 18;
      const cy = py + (i % 2 ? -6 : 6);
      const sz = (18 + i * 3) * ui;
      c.save();
      c.translate(cx, cy);
      c.globalAlpha = blink * (0.55 + prog * 0.45);
      c.fillStyle = i === 2 ? '#ffd75e' : '#7cf5ff';
      c.strokeStyle = 'rgba(0,0,0,.45)';
      c.lineWidth = 2.5 * ui;
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-sz * 0.45, -sz * 0.55);
      c.lineTo(sz * 0.2, 0);
      c.lineTo(-sz * 0.45, sz * 0.55);
      c.lineTo(-sz * 0.15, 0);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    // label + progress pill boven speler
    const label = t('combat.partGateWalk', { part: pg.targetPart });
    c.font = `900 ${Math.round(13 * ui)}px -apple-system,sans-serif`;
    c.textAlign = 'center';
    const tw = c.measureText(label).width;
    const pillW = Math.max(tw + 28, barW + 16);
    const pillX = px + 48 - pillW * 0.35;
    const pillY = py - 38;
    c.fillStyle = 'rgba(6,10,24,.82)';
    this.rr(c, pillX, pillY, pillW, 34 + barH, 12);
    c.fill();
    c.strokeStyle = 'rgba(124,245,255,.45)';
    c.lineWidth = 2;
    this.rr(c, pillX, pillY, pillW, 34 + barH, 12);
    c.stroke();
    c.fillStyle = '#fff';
    c.fillText(label, pillX + pillW * 0.5, pillY + 16);
    if (!walking && prog < 0.98) {
      c.font = `700 ${Math.round(10 * ui)}px -apple-system,sans-serif`;
      c.fillStyle = 'rgba(255,215,94,.88)';
      c.fillText(t('combat.partGateIdle'), pillX + pillW * 0.5, pillY + 28);
    }
    const bx = pillX + 10;
    const by = pillY + 24;
    c.fillStyle = 'rgba(255,255,255,.16)';
    this.rr(c, bx, by, pillW - 20, barH, barH * 0.45);
    c.fill();
    if (prog > 0.02) {
      const grad = c.createLinearGradient(bx, by, bx + (pillW - 20) * prog, by);
      grad.addColorStop(0, '#7cf5ff');
      grad.addColorStop(1, '#ffd75e');
      c.fillStyle = grad;
      this.rr(c, bx, by, (pillW - 20) * prog, barH, barH * 0.45);
      c.fill();
    }
    c.restore();
    c.textAlign = 'left';
  }

  /** Deel 3: checkpoint-flits + baas-aankomst overlays (boven de wereld, onder HUD-tekst). */
  drawStageBeatFx(c) {
    if (this.partFlashT > 0 && !motionReduced()) {
      const f = clamp(this.partFlashT / 0.5, 0, 1);
      const g = c.createRadialGradient(W / 2, 44, 10, W / 2, 44, H * 0.9);
      g.addColorStop(0, `rgba(124,245,255,${0.26 * f})`);
      g.addColorStop(0.4, `rgba(124,245,255,${0.09 * f})`);
      g.addColorStop(1, 'rgba(124,245,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    // Rustige rode hartslag terwijl je naar de baas-golf reist
    if (this.wavePause > 0 && isBossWave(this.level, this.waveIdx + 1) && !motionReduced()) {
      const f = clamp(1 - this.wavePause / (this.wavePauseTotal || 1), 0, 1);
      const beat = Math.max(0, Math.sin(this.t * 6.5));
      const a = 0.05 * f + beat * beat * 0.06 * f;
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(200,30,50,${a})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    if (this.bossArriveT > 0) {
      const f = clamp(this.bossArriveT / 0.7, 0, 1);
      const mul = motionReduced() ? 0.45 : 1;
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, `rgba(255,90,90,${0.1 * f * mul})`);
      g.addColorStop(1, `rgba(160,10,30,${0.28 * f * mul})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
  }

  /** Stage-voortgang: balk in 3 delen + lopend bolletje (vervangt wave-pips). */
  drawStageProgress(c, barY) {
    if (!this.level || !this.level.waves) return barY || 44;
    const total = this.level.waves.length;
    const tw = Math.min(320, W * 0.5);
    const x0 = W / 2 - tw / 2;
    const y = barY != null ? barY : 44;
    const target = this.stageProgress();
    if (this.progressSmooth == null) this.progressSmooth = target;
    this.progressSmooth += (target - this.progressSmooth) * (motionReduced() ? 0.25 : 0.09);
    if (Math.abs(target - this.progressSmooth) < 0.002) this.progressSmooth = target;
    const pr = clamp(this.progressSmooth, 0, 1);

    // 3 segmenten
    const segGap = 6;
    const segW = (tw - segGap * 2) / 3;
    for (let s = 0; s < 3; s++) {
      const sx = x0 + s * (segW + segGap);
      c.fillStyle = 'rgba(0,0,0,.5)';
      this.rr(c, sx - 1, y - 5, segW + 2, 10, 5); c.fill();
      c.fillStyle = 'rgba(255,255,255,.14)';
      this.rr(c, sx, y - 4, segW, 8, 4); c.fill();
      const f = clamp(pr * 3 - s, 0, 1);
      if (f > 0.01) {
        c.fillStyle = s === 2 && this.level.boss ? '#ff8a9a' : '#ffd75e';
        this.rr(c, sx, y - 4, segW * f, 8, 4); c.fill();
      }
    }
    // golf-streepjes
    c.fillStyle = 'rgba(255,255,255,.4)';
    for (let i = 1; i < total; i++) {
      const tx = x0 + (i / total) * tw;
      c.fillRect(tx - 1, y - 3, 2, 6);
    }
    // checkpoint-diamantjes op de deel-grenzen (deel 3-polish)
    for (let s = 1; s <= 2; s++) {
      const cx = x0 + s * (segW + segGap) - segGap / 2;
      const passed = pr * 3 >= s;
      const justFlash = passed && this.partFlashT > 0 && Math.min(3, 1 + Math.floor(pr * 3)) === s + 1;
      const r = justFlash && !motionReduced() ? 5.5 + Math.sin(this.t * 18) * 1.2 : (justFlash ? 5 : 4);
      c.save();
      c.translate(cx, y);
      c.rotate(Math.PI / 4);
      c.fillStyle = passed ? (justFlash ? '#bffaff' : '#7cf5ff') : 'rgba(255,255,255,.25)';
      c.fillRect(-r / 2, -r / 2, r, r);
      c.restore();
    }
    // baas-vlag aan het einde (getekend — art-upgrade 3/4)
    if (this.level.boss) {
      const fx0 = x0 + tw + 9;
      const wave = motionReduced() ? 0 : Math.sin(this.t * 5) * 1.2;
      c.strokeStyle = '#ff8a9a'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(fx0, y - 8); c.lineTo(fx0, y + 8); c.stroke();
      c.fillStyle = '#ff8a9a';
      c.beginPath();
      c.moveTo(fx0 + 1, y - 8);
      c.quadraticCurveTo(fx0 + 6, y - 7 + wave, fx0 + 11, y - 5);
      c.lineTo(fx0 + 1, y - 1);
      c.closePath();
      c.fill();
    }
    // bolletje
    const bx = x0 + pr * tw;
    const pulse = motionReduced() ? 0 : Math.sin(this.t * (this.traveling ? 12 : 6)) * 1.2;
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.beginPath(); c.arc(bx, y, 9.5 + pulse * 0.4, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(bx, y, 8 + pulse * 0.4, 0, TAU); c.fill();
    c.fillStyle = this.traveling ? '#7cf5ff' : '#ffd75e';
    c.beginPath(); c.arc(bx, y, 5 + pulse * 0.3, 0, TAU); c.fill();
    // deel-label
    c.font = '700 10px sans-serif';
    c.textAlign = 'left';
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.fillText(t('hud.part', { cur: Math.min(3, 1 + Math.floor(pr * 3)) }), x0 + tw + (this.level.boss ? 24 : 10), y + 3.5);
    // golf-pips (d4 c3): expliciete golf 1/N onder de balk
    const pipY = y + 16;
    const pipGap = Math.min(14, (tw - 8) / Math.max(1, total));
    const pipStart = W / 2 - ((total - 1) * pipGap) / 2;
    const cur = Math.max(0, this.waveIdx);
    for (let i = 0; i < total; i++) {
      const px = pipStart + i * pipGap;
      const isBossPip = this.level.boss && i === total - 1;
      const done = i < cur;
      const active = i === cur && this.waveIdx >= 0 && this.wavePause <= 0;
      const nextPause = i === cur + 1 && this.wavePause > 0;
      const pulseP = (active || nextPause) && !motionReduced() ? 1 + Math.sin(this.t * 8) * 0.12 : 1;
      const r = (done || active ? 3.5 : 3) * pulseP;
      c.beginPath();
      if (done) {
        c.fillStyle = isBossPip ? '#ff8a9a' : '#ffd75e';
        c.arc(px, pipY, r, 0, TAU);
        c.fill();
      } else {
        c.strokeStyle = isBossPip ? 'rgba(255,138,154,.85)' : (active || nextPause ? '#7cf5ff' : 'rgba(255,255,255,.35)');
        c.lineWidth = active || nextPause ? 2 : 1.2;
        c.arc(px, pipY, r, 0, TAU);
        c.stroke();
        if (active || nextPause) {
          c.fillStyle = 'rgba(124,245,255,.28)';
          c.fill();
        }
      }
    }
    c.font = '700 9px sans-serif';
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.textAlign = 'center';
    return pipY + 6;
  }

  countNearbyMonsters(radius) {
    const p = this.player;
    if (!p || !p.alive) return 0;
    let n = 0;
    const r2 = radius * radius;
    const py = p.y - 40;
    for (const m of this.monsters) {
      if (!m.alive) continue;
      const dx = m.x - p.x, dy = m.y - py;
      if (dx * dx + dy * dy <= r2) n++;
    }
    return n;
  }

  updateKetsbam(dt) {
    if (this.over || !this.player?.alive) {
      this.ketsbamShow = false;
      this.ketsbamBuildT = 0;
      this.ketsbamBuildProg = 0;
      return;
    }
    if (this.ketsbamChargeT > 0) {
      this.ketsbamShow = false;
      return;
    }
    if (this.ketsbamCd > 0) {
      this.ketsbamCd -= dt;
      // Tijdens CD: thermometer leeg houden — klaar = frisse fill voor 2e Kets
      this.ketsbamBuildT = 0;
      this.ketsbamBuildProg = 0;
      this.ketsbamShow = false;
      this.ketsbamPulse = 0;
      if (this.ketsbamSuperT > 0) this.ketsbamSuperT -= dt;
      return;
    }
    if (this.ketsbamSuperT > 0) this.ketsbamSuperT -= dt;
    const near = this.countNearbyMonsters(KETSBAM_DETECT_R);
    const stuck = this.player.hurtT > 0 && near >= 2;
    const swarmed = near >= KETSBAM_NEAR_MIN;
    const eligible = !this.inputLocked && !this.traveling && (swarmed || stuck);
    if (eligible) {
      this.ketsbamBuildT = Math.min(KETSBAM_BUILD_DUR, (this.ketsbamBuildT || 0) + dt);
    } else {
      this.ketsbamBuildT = Math.max(0, (this.ketsbamBuildT || 0) - dt * 2.2);
    }
    this.ketsbamBuildProg = clamp(this.ketsbamBuildT / KETSBAM_BUILD_DUR, 0, 1);
    this.ketsbamShow = eligible && this.ketsbamBuildProg >= 1;
    if (this.ketsbamShow && typeof ketsbamOnboardHintLine === 'function') {
      const kbHint = ketsbamOnboardHintLine();
      if (kbHint) {
        this.modeHintLine = kbHint;
        this.hint = Math.max(this.hint || 0, 8);
        if (typeof markKetsbamOnboardSeen === 'function') markKetsbamOnboardSeen();
      }
    }
    if (this.ketsbamShow || this.ketsbamBuildProg > 0) this.ketsbamPulse = (this.ketsbamPulse || 0) + dt;
    else this.ketsbamPulse = 0;
  }

  tryKetsbam() {
    try {
      if (this.ketsbamChargeT > 0 || !this.ketsbamShow || !this.player?.alive || this.over) return false;
      if (this.inputLocked || this.traveling) return false;
      return !!this.player.doKetsbam(this);
    } catch (err) {
      try { sfReportError('tryKetsbam', err); } catch (_) {}
      try {
        this.ketsbamChargeT = 0;
        this.ketsbamShow = false;
        this.inputLocked = !!this.over;
      } catch (_) {}
      return false;
    }
  }

  drawKetsbamChargeAura(c) {
    if (this.ketsbamChargeT <= 0 || !this.player?.alive) return;
    const f = this.player;
    const sp = equippedSuper();
    const dur = this.ketsbamChargeDur || KETSBAM_CHARGE_DUR;
    const prog = clamp(1 - this.ketsbamChargeT / dur, 0, 1);
    const px = f.x, py = f.y - 52;
    const calm = motionReduced();
    const lite = fxLite() || calm;
    const col = sp.color || '#ffd75e';
    const col2 = sp.color2 || '#ff9a3d';
    const pulse = calm ? 0 : (this.ketsbamChargePulse || this.ketsbamPulse || 0);

    c.save();
    const ringR = calm ? (28 + prog * 88) : (28 + prog * 88 + Math.sin(pulse * 11) * 7);
    c.globalAlpha = 0.22 + prog * 0.38;
    c.strokeStyle = col;
    c.lineWidth = 2.5 + prog * 3.5;
    c.beginPath();
    c.ellipse(px, f.y + 3, ringR, ringR * 0.22, 0, 0, TAU);
    c.stroke();

    const h = 80 + prog * 150;
    const grad = c.createLinearGradient(px, f.y, px, f.y - h);
    grad.addColorStop(0, `rgba(255,120,50,${0.2 + prog * 0.28})`);
    grad.addColorStop(0.5, `rgba(255,215,94,${0.28 + prog * 0.35})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = grad;
    c.fillRect(px - 18 - prog * 10, f.y - h, 36 + prog * 20, h);

    const rings = lite ? 2 : 4;
    for (let i = 0; i < rings; i++) {
      const r = calm
        ? (34 + i * 13 + prog * 22)
        : (34 + i * 13 + prog * 22 + Math.sin(pulse * 10 + i * 1.4) * 5);
      c.globalAlpha = (0.3 + prog * 0.28) * (1 - i * 0.17);
      c.strokeStyle = i % 2 ? '#fff8dc' : col2;
      c.lineWidth = 2 + prog * 2;
      c.beginPath();
      c.arc(px, py, r + 18 + prog * 28, 0, TAU);
      c.stroke();
    }

    if (!lite) {
      c.globalAlpha = 0.45 + prog * 0.35;
      c.strokeStyle = '#fff';
      c.lineWidth = 2;
      const spikes = calm ? 4 : 7;
      for (let i = 0; i < spikes; i++) {
        const a = pulse * 9 + i * (TAU / spikes);
        const len = 22 + prog * 44;
        c.beginPath();
        c.moveTo(px + Math.cos(a) * 18, py + Math.sin(a) * 10);
        c.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len * 0.55 - prog * 24);
        c.stroke();
      }
    }

    const chargeTxt = superChargeBanner(sp);
    c.globalAlpha = 0.85;
    c.font = `900 ${18 + prog * 8}px -apple-system, sans-serif`;
    c.textAlign = 'center';
    c.fillStyle = col;
    c.strokeStyle = 'rgba(0,0,0,.55)';
    c.lineWidth = 4;
    c.strokeText(chargeTxt, px, py - 58 - prog * 24);
    c.fillText(chargeTxt, px, py - 58 - prog * 24);
    c.restore();
  }

  drawKetsbamPrompt(c) {
    // Thermometer boven special-knop tijdens build + ready (speciale supers zichtbaar via kleur/label)
    const prog = this.ketsbamBuildProg || 0;
    if (prog <= 0 || !this.player?.alive) return;
    const sp = typeof equippedSuper === 'function' ? equippedSuper() : null;
    const ui = touchUiScale(W, H);
    const { cx, cy, w, h } = ketsbamPromptLayout(this);
    const ready = !!this.ketsbamShow;
    const calm = motionReduced();
    const pulse = this.ketsbamPulse || 0;
    const x = cx - w * 0.5;
    const y = cy - h * 0.5;
    const fillW = Math.max(2, w * prog);
    const col = (sp && sp.color) || '#ffd75e';
    const col2 = (sp && sp.color2) || '#ffb347';

    c.save();
    c.globalAlpha = ready ? 0.98 : 0.88;
    c.fillStyle = 'rgba(6,10,24,.78)';
    c.strokeStyle = ready ? (col + 'aa') : 'rgba(255,215,94,.45)';
    c.lineWidth = 2 * ui;
    this.rr(c, x, y, w, h, h * 0.45);
    c.fill();
    c.stroke();

    if (fillW > 1) {
      c.save();
      this.rr(c, x + 1.5, y + 1.5, w - 3, h - 3, (h - 3) * 0.42);
      c.clip();
      const grad = c.createLinearGradient(x, y, x + fillW, y);
      grad.addColorStop(0, col2);
      grad.addColorStop(0.55, col);
      grad.addColorStop(1, '#fff3a8');
      c.fillStyle = grad;
      c.fillRect(x + 1.5, y + 1.5, fillW - 3, h - 3);
      c.restore();
    }

    if (ready) {
      const dotR = Math.max(5, h * 0.42);
      const dotX = x + w + dotR * 0.55;
      const dotY = cy;
      const blink = calm ? 1 : (0.45 + Math.abs(Math.sin(pulse * 9)) * 0.55);
      c.globalAlpha = blink;
      c.fillStyle = '#ff3344';
      c.strokeStyle = '#fff';
      c.lineWidth = 1.5 * ui;
      c.beginPath();
      c.arc(dotX, dotY, dotR, 0, TAU);
      c.fill();
      c.stroke();
      c.globalAlpha = 0.95;
      c.font = `900 ${Math.round(10 * ui)}px -apple-system,sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      const label = (typeof superChargeBanner === 'function'
        ? superChargeBanner(sp)
        : 'KETS!').replace(/!$/, '');
      c.fillStyle = col;
      c.strokeStyle = 'rgba(0,0,0,.55)';
      c.lineWidth = 3 * ui;
      c.strokeText(label, cx, y - 3 * ui);
      c.fillText(label, cx, y - 3 * ui);
    } else if (prog > 0.08 && !calm) {
      c.globalAlpha = 0.35 + prog * 0.25;
      c.fillStyle = col;
      c.fillRect(x + fillW - 2, y + 2, 2, h - 4);
    }

    c.restore();
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
  }

  drawHUD(c) {
    this.advHudBottom = 0;
    if (this.mode === 'adventure') this.drawStageBeatFx(c);
    const p = this.player;
    if (this.mode === 'adventure' && (this.killStreak || 0) >= 8 && !motionReduced()) {
      const a = 0.045 + Math.min(0.07, (this.killStreak || 0) / 100);
      const g = c.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(255,122,77,${a})`);
      g.addColorStop(0.15, 'rgba(0,0,0,0)');
      g.addColorStop(0.85, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(255,122,77,${a})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    if (p && p.alive && p.maxhp > 0 && p.hp / p.maxhp < 0.28) {
      const calm = motionReduced();
      const a = calm ? 0.055 : (0.07 + Math.sin(this.t * 7) * 0.04);
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(180,20,40,${a})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    // spelerbalk (niet in 2P — eigen layout)
    const bw = Math.min(240, W * 0.32);
    const bx = Math.max(12, readSafeInsets().left + 8);
    const by = hudInsetTop();
    if (this.mode === 'adventure' && this.runLoot && runLootHasItems(this.runLoot)) {
      const short = runLootSummaryShort(this.runLoot);
      if (short) {
        c.font = '700 11px -apple-system, sans-serif';
        c.textAlign = 'right';
        c.fillStyle = 'rgba(255,255,255,.78)';
        c.fillText(t('runLoot.hudShort', { line: short }), W - Math.max(10, readSafeInsets().right + 8), by + 2);
        c.textAlign = 'left';
      }
    }
    if (this.mode !== 'versus') {
      c.fillStyle = 'rgba(0,0,0,.45)';
      this.rr(c, bx - 4, by - 4, bw + 8, 52, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, by, bw, 15, 6); c.fill();
      c.fillStyle = p.hp / p.maxhp > 0.35 ? '#6ee06e' : '#ff6b6b';
      this.rr(c, bx, by, bw * clamp(p.hp / p.maxhp, 0, 1), 15, 6); c.fill();
      if (this.mode === 'adventure' && masterBuffActive(this.level.n, this.advDiff)) {
        c.fillStyle = 'rgba(196,122,255,.28)';
        this.rr(c, bx - 2, by - 16, bw + 4, 13, 5); c.fill();
        c.font = '800 9px -apple-system, sans-serif';
        c.fillStyle = '#c47aff';
        c.textAlign = 'left';
        c.fillText(t('hud.masterShort'), bx + 4, by - 7);
      }
      if (this.mode === 'adventure') {
        c.strokeStyle = 'rgba(255,215,94,.5)';
        c.lineWidth = 1;
        for (const frac of [STAR_HP.two, STAR_HP.three]) {
          const tx = bx + bw * frac;
          c.beginPath();
          c.moveTo(tx, by + 1);
          c.lineTo(tx, by + 14);
          c.stroke();
        }
      }
      c.fillStyle = '#333c55'; this.rr(c, bx, by + 20, bw, 11, 5); c.fill();
      const jKind = fighterJutsuKind(p);
      this.drawSuperMeterFill(c, bx, by + 20, bw, 11, p.energy / 100, jKind, this.t);
      c.font = '800 10px -apple-system, sans-serif';
      c.fillStyle = 'rgba(255,255,255,.85)'; c.textAlign = 'left';
      c.fillText(t('hud.super'), bx + 6, by + 29);
      // getekend jutsu-icoontje (art-upgrade 3/4): bliksem / oog / orb
      const ix = bx + 6 + c.measureText(t('hud.super')).width + 9;
      const iy = by + 25.5;
      if (jKind === 'chidori') {
        c.fillStyle = '#a8e0ff';
        c.beginPath();
        c.moveTo(ix + 2, iy - 5.5);
        c.lineTo(ix - 2.5, iy + 1);
        c.lineTo(ix + 0.3, iy + 1);
        c.lineTo(ix - 1.5, iy + 5.5);
        c.lineTo(ix + 3.5, iy - 1);
        c.lineTo(ix + 0.7, iy - 1);
        c.closePath();
        c.fill();
      } else if (jKind === 'rinnegan') {
        c.strokeStyle = '#c47aff'; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(ix + 1, iy, 5.2, 3.2, 0, 0, TAU); c.stroke();
        c.fillStyle = '#c47aff';
        c.beginPath(); c.arc(ix + 1, iy, 1.7, 0, TAU); c.fill();
      } else {
        c.strokeStyle = '#7cf5ff'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(ix + 1, iy, 4.6, 0, TAU); c.stroke();
        c.fillStyle = '#7cf5ff';
        c.beginPath(); c.arc(ix + 1, iy, 2, 0, TAU); c.fill();
      }
      c.font = '800 13px -apple-system, sans-serif';
      c.fillStyle = '#fff';
      c.fillText(`Lv ${save.lvl}`, bx + bw + 12, by + 13);
      if (p.energy >= 100) {
        c.fillStyle = jKind === 'chidori' ? '#a8e0ff' : jKind === 'rinnegan' ? '#c47aff' : '#7cf5ff';
        c.fillText(jutsuLabel(jKind), bx + bw + 12, by + 32);
        c.strokeStyle = jKind === 'chidori' ? 'rgba(168,224,255,.55)' : jKind === 'rinnegan' ? 'rgba(196,122,255,.55)' : 'rgba(124,245,255,.55)';
        c.lineWidth = 2;
        c.beginPath();
        const joyR = motionReduced() ? 18 : 18 + Math.sin(this.t * 8) * 3;
        c.arc(bx + bw * 0.5, by + 25, joyR, 0, TAU);
        c.stroke();
      }
      const wFam = weaponMoveFamily(p.weapon.id);
      if (wFam) drawWeaponStylePips(c, bx + 10, by + 38, p);
      const eqSp = equippedSuper();
      c.save();
      c.translate(bx + 6, by + 44);
      c.scale(0.19, 0.19);
      drawSuperIcon(c, eqSp.icon || 'star', 16, eqSp.color, eqSp.color2);
      c.restore();
      c.font = '700 9px -apple-system,sans-serif';
      c.fillStyle = eqSp.color;
      c.textAlign = 'left';
      c.fillText(superLabel(eqSp), bx + 16, by + 48);
      if (this.ketsbamCd > 0) {
        c.fillStyle = 'rgba(255,255,255,.62)';
        c.fillText(Math.ceil(this.ketsbamCd) + 's', bx + bw - 20, by + 48);
      }
    }

    c.textAlign = 'center';
    if (this.mode === 'adventure') {
      const isl = islandMeta(islandFromLevel(this.level.n));
      const wCap = adventureWeaponCapForLevel(this.level.n);
      const wv = Math.max(1, this.waveIdx + 1);
      let hy = Math.max(28, hudInsetTop() + 4);
      this.advHudBottom = hy;

      c.font = '800 16px -apple-system, sans-serif';
      fillHudText(c, t('hud.levelWave', { n: this.level.n, wv: Math.min(wv, this.level.waves.length), total: this.level.waves.length }), W / 2, hy, {
        fill: a11yHighContrast() ? '#fff' : 'rgba(255,255,255,.9)',
      });
      hy += 17;

      if (this.advDiff && this.advDiff !== 'normal') {
        const dm = advDiffMeta(this.advDiff);
        const chip = advDiffShort(this.advDiff);
        c.font = '900 11px -apple-system, sans-serif';
        const tw = c.measureText(chip).width;
        const cx = W / 2;
        c.fillStyle = 'rgba(0,0,0,.45)';
        this.rr(c, cx - tw / 2 - 8, hy - 10, tw + 16, 14, 7); c.fill();
        c.strokeStyle = dm.accent;
        c.lineWidth = 1.5;
        this.rr(c, cx - tw / 2 - 8, hy - 10, tw + 16, 14, 7); c.stroke();
        c.fillStyle = dm.accent;
        c.fillText(chip, cx, hy);
        hy += 16;
      }

      c.font = '700 11px -apple-system, sans-serif';
      c.fillStyle = isl.accent;
      c.globalAlpha = 0.92;
      c.fillText(t('hud.islandWeapon', { name: islandLabel(islandFromLevel(this.level.n), 'name'), cap: wCap }), W / 2, hy);
      c.globalAlpha = 1;
      hy += 14;

      if (this.waveIdx >= 0 && this.wavePause <= 0) {
        const curMeta = this.level.waveMeta && this.level.waveMeta[this.waveIdx];
        hy = this.drawAdvTraitChip(c, W / 2, hy + 8, curMeta);
      }

      hy = this.drawStageProgress(c, hy + 4) + 10;

      const bossAlive = this.monsters.find(m => m.alive && (m.tideBoss || m.elite));
      if (this.tideBattleActive && this.tideBattleBossId) {
        const tideSp = SPECIES[this.tideBattleBossId];
        const tideMon = this.tideBattleMon;
        const tideName = (tideMon && tideMon.sp && tideMon.sp.name) || (tideSp && tideSp.name) || 'Tide';
        const tideHp = tideMon && tideMon.alive && tideMon.maxhp > 0
          ? ` · ${Math.round(100 * tideMon.hp / tideMon.maxhp)}%`
          : '';
        c.font = '700 11px sans-serif';
        c.fillStyle = '#4a9fff';
        const txt = t('hud.tideBattle', { name: tideName }) + tideHp;
        c.fillText(txt, W / 2 + 7, hy);
        drawMiniDie(c, W / 2 - c.measureText(txt).width / 2 - 3, hy - 3.5, 10, '#4a9fff');
        hy += 14;
      } else if (!bossAlive) {
        let ctxTxt = null;
        let ctxCol = null;
        let ctxDie = false;
        if (this.stageAlly) {
          c.font = '700 11px sans-serif';
          const col = this.stageAlly.color || '#7cf5ff';
          c.fillStyle = col;
          const txt = this.stageAlly.name;
          c.fillText(txt, W / 2 + 7, 62);
          if (this.stageAlly.id === 'tide' && typeof drawMiniWave === 'function') {
            drawMiniWave(c, W / 2 - c.measureText(txt).width / 2 - 3, 58.5, 10, col);
          } else {
            drawMiniDie(c, W / 2 - c.measureText(txt).width / 2 - 3, 58.5, 10, col);
          }
        } else if (this.eggPet && activeEggPetDef()) {
          ctxCol = this.eggPet.def?.c1 || '#ffd75e';
          ctxTxt = t('hud.eggPet', { name: this.eggPet.def?.name || t('hud.cosmetic') });
        } else if (this.pet && activePetDef()) {
          ctxCol = this.pet.sp?.c1 || '#7cf5ff';
          ctxTxt = t('hud.petActive', { name: this.pet.sp?.name || t('hud.petDefault') });
        } else if (this.gambleBossWave > 0) {
          ctxCol = '#ffb0b8';
          ctxTxt = t('hud.gambleBoss', { n: this.gambleBossWave });
          ctxDie = true;
        }
        if (ctxTxt) {
          c.font = '700 11px sans-serif';
          c.fillStyle = ctxCol;
          if (ctxDie) {
            c.fillText(ctxTxt, W / 2 + 7, hy);
            drawMiniDie(c, W / 2 - c.measureText(ctxTxt).width / 2 - 3, hy - 3.5, 10, ctxCol);
          } else {
            c.fillText(ctxTxt, W / 2, hy);
          }
          hy += 14;
        }
      }

      const starY = Math.max(24, hudInsetTop() + 2);
      if (p.alive) {
        const hpPct = p.hp / Math.max(1, p.maxhp);
        const proj = starsFromHpPct(hpPct);
        for (let i = 0; i < 3; i++) {
          drawStarShape(c, W - 52 + i * 19, starY, 8, '#ffd75e', i < proj);
        }
        this.drawAdvStarBuffer(c, W - 58, starY + 13, hpPct);
      }

      const rightX = W - Math.max(14, readSafeInsets().right + 8);
      let rightY = starY + 18;
      if ((this.killStreak || 0) >= 2) {
        c.textAlign = 'right';
        c.font = '800 12px sans-serif';
        fillHudText(c, t('hud.streak', { n: this.killStreak }), rightX, rightY, {
          fill: this.killStreak >= 8 ? '#ff7a4d' : '#ffd75e',
        });
        rightY += 15;
      }
      if (save.comboHud !== false && this.combo > 1) {
        const calm = motionReduced();
        const pulse = calm ? 1 : (1 + Math.sin(this.t * 10) * 0.08);
        const col = this.combo >= 8 ? '#ff7a4d' : '#ffd75e';
        c.save();
        c.textAlign = 'right';
        c.translate(rightX, rightY);
        c.scale(pulse, pulse);
        if (!fxLite() && !calm) {
          c.globalAlpha = 0.35 + Math.sin(this.t * 12) * 0.1;
          c.strokeStyle = col;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(-24, -2, 22 + Math.min(10, this.combo) + Math.sin(this.t * 14) * 2, 0, TAU);
          c.stroke();
          c.globalAlpha = 1;
        }
        c.font = '900 17px sans-serif';
        if (!calm) {
          c.shadowColor = col;
          c.shadowBlur = 10;
        }
        fillHudText(c, t('hud.combo', { n: this.combo }), 0, 0, { fill: col, strokeW: calm ? 4 : 3.5, align: 'right' });
        c.restore();
      }

      const boss = bossAlive;
      if (boss) {
        const bwid = Math.min(420, W * 0.5);
        c.fillStyle = 'rgba(0,0,0,.5)'; this.rr(c, W / 2 - bwid / 2 - 3, hy - 3, bwid + 6, 16, 8); c.fill();
        c.fillStyle = '#e04f5f'; this.rr(c, W / 2 - bwid / 2, hy, bwid * boss.hp / boss.maxhp, 10, 5); c.fill();
        hy += 18;
        c.font = '700 12px sans-serif';
        fillHudText(c, boss.sp.name.toUpperCase(), W / 2, hy, { fill: '#ffc8d0' });
        hy += 16;
      }

      c.textAlign = 'center';
      if (p.alive && !boss) {
        const hpPct = p.hp / Math.max(1, p.maxhp);
        const pct = Math.round(hpPct * 100);
        let starHint = t('hud.starZone');
        if (hpPct <= STAR_HP.two) starHint = t('hud.star2', { pct: Math.round(STAR_HP.two * 100) });
        else if (hpPct <= STAR_HP.three) starHint = t('hud.star3', { pct: Math.round(STAR_HP.three * 100) });
        c.font = '700 11px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        c.fillText(t('hud.hpPct', { pct, hint: starHint }), W / 2, hy);
        hy += 14;
      }
      if (this.waveIdx >= 0 && (this.spawnQueue.length > 0 || this.monsters.some((m) => m.alive))) {
        const rem = this.spawnQueue.length + this.monsters.filter((m) => m.alive).length;
        c.font = '700 11px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.62)';
        c.fillText(rem === 1 ? t('hud.enemiesLeft1') : t('hud.enemiesLeftN', { n: rem }), W / 2, hy);
        hy += 14;
      }
      if (this.dmgBuffT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#ff7a4d';
        c.fillText(t('hud.rage', { n: Math.ceil(this.dmgBuffT) }), W / 2, hy);
        hy += 16;
      }
      if (this.playerShieldT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#9fd8ff';
        c.fillText(t('hud.shield', { n: Math.ceil(this.playerShieldT) }), W / 2, hy);
        hy += 16;
      }
      if (this.masterSwordT > 0) {
        c.font = '900 14px sans-serif'; c.fillStyle = '#7cf5ff';
        if (!motionReduced()) { c.shadowColor = '#7cf5ff'; c.shadowBlur = 8; }
        c.fillText(t('hud.masterSword', { n: Math.ceil(this.masterSwordT) }), W / 2, hy);
        c.shadowBlur = 0;
        hy += 16;
      }
      this.advHudBottom = hy;

      if (this.wavePause > 0) {
        const nextBoss = isBossWave(this.level, this.waveIdx + 1);
        const sec = Math.max(0, this.wavePause);
        const totalPause = this.wavePauseTotal || 1.55;
        const pauseFrac = clamp(1 - this.wavePause / totalPause, 0, 1);
        const ringX = W / 2;
        const ringY = H - 78;
        const ringR = 24;
        if (!motionReduced()) {
          c.save();
          c.strokeStyle = nextBoss ? 'rgba(255,138,154,.22)' : 'rgba(124,245,255,.18)';
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(ringX, ringY, ringR, 0, TAU);
          c.stroke();
          c.strokeStyle = nextBoss ? '#ffb0b8' : '#7cf5ff';
          c.lineWidth = 3.5;
          c.lineCap = 'round';
          c.beginPath();
          c.arc(ringX, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + pauseFrac * TAU);
          c.stroke();
          c.restore();
        }
        c.font = '800 15px sans-serif';
        const pauseMsg = nextBoss ? t('hud.toBoss', { sec: sec.toFixed(1) }) : t('hud.walkNext', { sec: sec.toFixed(1) });
        fillHudText(c, pauseMsg, ringX, ringY, {
          fill: nextBoss ? '#ffc8d0' : '#d8e8ff',
        });
        this.drawNextWavePreview(c);
      }
      let advTele = null;
      for (const m of this.monsters) {
        advTele = adventureTelegraphHud(m);
        if (advTele) break;
      }
      if (advTele) drawTelegraphBar(c, this, advTele, bossAlive ? hy + 8 : hy);
    } else if (this.mode === 'training') {
      const r = this.robot;
      const half = Math.min(300, W * 0.36);
      if (this.phase === 'intro' && this.phaseT < 1.55) {
        const n = Math.ceil(Math.max(0.35, 1.55 - this.phaseT));
        c.font = '900 48px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.92)';
        c.fillText(String(n), W / 2, H * 0.4);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.65)';
        c.fillText(t('hud.spawnFair'), W / 2, H * 0.4 + 28);
      } else if (this.phase === 'roundend') {
        const left = Math.max(0, 2.2 - this.phaseT);
        c.font = '900 34px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.fillText(String(Math.ceil(left)), W / 2, H * 0.38);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        c.fillText(t('hud.nextRound'), W / 2, H * 0.38 + 26);
        const barW = Math.min(140, W * 0.24);
        c.fillStyle = 'rgba(0,0,0,.35)';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW, 5, 3);
        c.fill();
        c.fillStyle = '#7cf5ff';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW * clamp(left / 2.2, 0, 1), 5, 3);
        c.fill();
      }
      const tele = this.trainLaserTelegraph > 0
        ? { label: t('hud.earLaser'), frac: this.trainLaserTelegraph / 0.95, color: '#ff6b6b', max: 0.95 }
        : (this.trainTelegraphT > 0
          ? { label: t('hud.chidoriTele'), frac: this.trainTelegraphT / 0.85, color: '#7cf5ff', max: 0.85 }
          : (this.trainMeleeTelegraphT > 0
            ? {
              label: this.trainTelegraphKind === 'kick' ? t('hud.kickTele') : t('hud.punchTele'),
              frac: this.trainMeleeTelegraphT / (this.trainMeleeTelegraphMax || 0.32),
              color: '#ffb347',
              max: this.trainMeleeTelegraphMax || 0.32,
            }
            : null));
      if (tele) {
        const barW = Math.min(220, W - 48);
        const bx = (W - barW) / 2;
        c.fillStyle = 'rgba(0,0,0,.4)';
        this.rr(c, bx - 4, 88, barW + 8, 22, 8);
        c.fill();
        c.font = '800 11px sans-serif';
        c.textAlign = 'center';
        fillHudText(c, tele.label, W / 2, 102, { fill: tele.color, strokeW: a11yHighContrast() ? 3 : 0 });
        c.fillStyle = 'rgba(255,255,255,.15)';
        this.rr(c, bx, 108, barW, 5, 3);
        c.fill();
        c.fillStyle = tele.color;
        this.rr(c, bx, 108, barW * clamp(tele.frac, 0, 1), 5, 3);
        c.fill();
      }
      if (this.trainMeleeTelegraphT > 0 && r.alive && !this.trainLaserTelegraph && !this.trainTelegraphT) {
        const dir = Math.sign(this.player.x - r.x) || -1;
        c.save();
        c.globalAlpha = motionReduced() ? 0.38 : (0.3 + Math.sin(this.t * 22) * 0.15);
        c.strokeStyle = '#ffb347';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(r.x + dir * 28, r.y - 28, 22, 0, TAU);
        c.stroke();
        c.restore();
      }
      if (this.trainTelegraphT > 0 && r.alive) {
        c.save();
        c.globalAlpha = motionReduced() ? 0.42 : (0.35 + Math.sin(this.t * 18) * 0.2);
        c.strokeStyle = '#7cf5ff';
        c.lineWidth = 4;
        c.beginPath();
        c.arc(r.x, r.y - 48, 42 + (motionReduced() ? 0 : Math.sin(this.t * 14) * 6), 0, TAU);
        c.stroke();
        const dashDir = Math.sign(this.player.x - r.x) || -1;
        const dashLen = Math.min(200, Math.abs(this.player.x - r.x) + 40);
        c.globalAlpha = 0.35 + (this.trainTelegraphT / 0.85) * 0.35;
        c.strokeStyle = '#7cf5ff';
        c.lineWidth = 3;
        c.setLineDash([8, 10]);
        c.beginPath();
        c.moveTo(r.x, r.y - 22);
        c.lineTo(r.x + dashDir * dashLen, r.y - 22);
        c.stroke();
        c.setLineDash([]);
        c.restore();
      }
      if (this.trainLaserTelegraph > 0 && r.alive) {
        const ly = r.y - 52;
        c.save();
        c.globalAlpha = 0.25 + (this.trainLaserTelegraph / 0.95) * 0.45;
        c.strokeStyle = '#ff5d5d';
        c.lineWidth = 6;
        c.setLineDash([14, 10]);
        c.beginPath();
        c.moveTo(24, ly);
        c.lineTo(W - 24, ly);
        c.stroke();
        c.setLineDash([]);
        c.font = '800 13px sans-serif';
        c.textAlign = 'center';
        fillHudText(c, t('hud.earLaserShort'), W / 2, ly - 10, { fill: '#ffb0b8' });
        c.restore();
      }
      // robotbalk rechtsboven
      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, W - half - 20, by - 4, half + 8, 30, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, by, half, 15, 6); c.fill();
      c.fillStyle = '#ff8080';
      const frac = clamp(r.hp / r.maxhp, 0, 1);
      this.rr(c, W - 16 - half * frac, by, half * frac, 15, 6); c.fill();
      c.font = '800 13px sans-serif'; c.textAlign = 'right'; c.fillStyle = '#fff';
      const rPct = Math.round(frac * 100);
      c.fillText(t('hud.rabbitRobot', { pct: rPct }), W - 20, by + 30);
      // timer + rondepunten
      c.textAlign = 'center';
      c.font = '800 12px sans-serif';
      c.fillStyle = 'rgba(255,255,255,.65)';
      const decisiveRound = this.roundsP === 1 && this.roundsR === 1;
      const scoreLine = decisiveRound
        ? t('hud.decisiveRound', { s: this.roundsP, r: this.roundsR })
        : t('hud.roundInfo', { n: this.round, s: this.roundsP, r: this.roundsR });
      c.fillText(scoreLine, W / 2, 68);
      const tLeft = Math.ceil(Math.max(0, this.roundTimer));
      const urgent = this.roundTimer < 15 && this.phase === 'fight';
      c.font = urgent ? '900 28px sans-serif' : '900 26px sans-serif';
      c.fillStyle = urgent ? '#ff9a9a' : '#fff';
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, 40);
        c.scale(1 + Math.sin(this.t * 10) * 0.05, 1 + Math.sin(this.t * 10) * 0.05);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, 40);
      }
      const timerBarW = Math.min(160, W * 0.28);
      const timerFrac = clamp(this.roundTimer / 60, 0, 1);
      c.fillStyle = 'rgba(0,0,0,.35)';
      this.rr(c, W / 2 - timerBarW / 2, 46, timerBarW, 5, 3);
      c.fill();
      c.fillStyle = urgent ? '#ff6b6b' : '#7cf5ff';
      this.rr(c, W / 2 - timerBarW / 2, 46, timerBarW * timerFrac, 5, 3);
      c.fill();
      if (this.roundTimer < 12 && this.phase === 'fight') {
        c.font = '700 9px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.fillText(t('hud.timeHpWin'), W / 2, 58);
      }
      const mpP = this.roundsP === 1 && this.roundsR < 2;
      const mpR = this.roundsR === 1 && this.roundsP < 2;
      for (let i = 0; i < 2; i++) {
        const px = W / 2 - 34 - i * 18;
        c.fillStyle = i < this.roundsP ? '#7cfc8a' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(px, 82, 6, 0, TAU); c.fill();
        if (mpP && i === 1) {
          c.strokeStyle = '#ffd75e'; c.lineWidth = 2;
          c.beginPath(); c.arc(px, 82, 9, 0, TAU); c.stroke();
        }
        const rx = W / 2 + 34 + i * 18;
        c.fillStyle = i < this.roundsR ? '#ff6b6b' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(rx, 82, 6, 0, TAU); c.fill();
        if (mpR && i === 1) {
          c.strokeStyle = '#ffd75e'; c.lineWidth = 2;
          c.beginPath(); c.arc(rx, 82, 9, 0, TAU); c.stroke();
        }
      }
      if ((this.trainDummyGrace || 0) > 0) {
        c.textAlign = 'center';
        c.font = '800 12px sans-serif';
        c.fillStyle = '#7cf5ff';
        c.fillText(t('hud.dummyGrace', { n: this.trainDummyGrace.toFixed(1) }), W / 2, 118);
      }
      if (this.combo > 0 && this.comboT > 0 && save.comboHud !== false) {
        const col = this.combo >= 8 ? '#ff7a4d' : '#ffd75e';
        const nextGoal = this.combo < 5 ? 5 : this.combo < 8 ? 8 : this.combo < 10 ? 10 : 0;
        const rec = save.stats.trainMaxCombo || 0;
        c.textAlign = 'left';
        c.font = '800 13px sans-serif';
        c.fillStyle = col;
        c.fillText(t('hud.combo', { n: this.combo }), 16, 118);
        c.font = '700 10px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.65)';
        if (nextGoal) c.fillText(t('hud.goal', { n: nextGoal }), 16, 132);
        if (rec > 0) c.fillText(t('hud.record', { n: rec }), 16, nextGoal ? 146 : 132);
        const barW = Math.min(120, W * 0.28);
        const barY = nextGoal ? (rec > 0 ? 152 : 138) : (rec > 0 ? 146 : 132);
        c.fillStyle = 'rgba(255,255,255,.15)';
        this.rr(c, 16, barY, barW, 4, 2);
        c.fill();
        c.fillStyle = col;
        this.rr(c, 16, barY, barW * clamp(this.comboT / 1.55, 0, 1), 4, 2);
        c.fill();
        c.textAlign = 'center';
      }
    } else if (this.mode === 'wall') {
      const wallDur = this.wallDuration || 60;
      const tLeft = Math.ceil(Math.max(0, this.wallTimer));
      const urgent = this.wallTimer < 10;
      const barW = Math.min(220, W - 48);
      const barX = (W - barW) / 2;
      const timeFrac = clamp(this.wallTimer / wallDur, 0, 1);
      c.font = '700 9px sans-serif';
      c.textAlign = 'left';
      c.fillStyle = 'rgba(255,255,255,.45)';
      c.fillText(t('hud.time'), barX, 44);
      c.textAlign = 'center';
      c.fillStyle = 'rgba(0,0,0,.42)';
      this.rr(c, barX, 48, barW, 7, 4); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.22)';
      c.lineWidth = 1;
      for (const frac of [0.5, 0.25]) {
        const tx = barX + barW * frac;
        c.beginPath();
        c.moveTo(tx, 47);
        c.lineTo(tx, 56);
        c.stroke();
      }
      c.fillStyle = urgent ? '#ff6b6b' : '#7cf5ff';
      this.rr(c, barX, 48, Math.max(4, barW * timeFrac), 7, 4); c.fill();

      c.font = '900 30px sans-serif';
      c.fillStyle = urgent ? '#ff6b6b' : '#fff';
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, 36);
        c.scale(1 + Math.sin(this.t * 12) * 0.06, 1 + Math.sin(this.t * 12) * 0.06);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, 36);
      }
      if (this.wallGen > 0) {
        c.font = '800 12px sans-serif';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,215,94,.85)';
        c.fillText(t('hud.wallGen', { n: this.wallGen + 1 }), 16, 36);
        c.textAlign = 'center';
      }
      c.font = '800 17px sans-serif'; c.fillStyle = '#ffd75e';
      c.fillText(t('hud.stones', { n: this.score }), W / 2, 68);
      c.font = '700 13px sans-serif';
      const bestSaved = save.bestWall || 0;
      const rec = Math.max(bestSaved, this.score);
      const onPace = this.score > bestSaved;
      c.fillStyle = onPace ? '#7cfc8a' : 'rgba(255,255,255,.55)';
      if (bestSaved > 0 && this.score < bestSaved) {
        const gap = bestSaved - this.score;
        c.fillText(t('hud.recordGap', { best: bestSaved, gap }), W / 2, 86);
      } else {
        c.fillText(onPace && bestSaved > 0 ? t('hud.recordBroken', { rec }) : t('hud.recordLine', { rec }), W / 2, 86);
      }
      // d19 c4: record-chase meter (score → best) + expected-pace tick
      if (bestSaved > 0) {
        const chaseW = Math.min(180, W * 0.48);
        const chaseX = (W - chaseW) / 2;
        const chaseY = 90;
        const chaseFrac = clamp(this.score / Math.max(1, bestSaved), 0, 1.15);
        c.fillStyle = 'rgba(0,0,0,.38)';
        this.rr(c, chaseX, chaseY, chaseW, 5, 3); c.fill();
        c.fillStyle = onPace ? '#7cfc8a' : (chaseFrac >= 0.85 ? '#ffd75e' : '#7cf5ff');
        this.rr(c, chaseX, chaseY, Math.max(3, chaseW * Math.min(1, chaseFrac)), 5, 3); c.fill();
        // 100% notch
        c.strokeStyle = 'rgba(255,255,255,.55)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(chaseX + chaseW, chaseY - 1);
        c.lineTo(chaseX + chaseW, chaseY + 6);
        c.stroke();
        const elapsedChase = wallDur - this.wallTimer;
        if (elapsedChase > 2) {
          const expectedFrac = clamp(elapsedChase / wallDur, 0, 1);
          const tickX = chaseX + chaseW * expectedFrac;
          c.fillStyle = 'rgba(255,176,184,.9)';
          c.beginPath();
          c.moveTo(tickX, chaseY - 2);
          c.lineTo(tickX + 3.5, chaseY + 2.5);
          c.lineTo(tickX, chaseY + 7);
          c.lineTo(tickX - 3.5, chaseY + 2.5);
          c.closePath();
          c.fill();
        }
      }
      let showPaceDelta = false;
      const elapsed = wallDur - this.wallTimer;
      if (elapsed > 2 && this.score > 0) {
        const pace = Math.round((this.score / elapsed) * 60);
        const proj = Math.round(this.score + (this.wallTimer / elapsed) * this.score);
        c.font = '700 12px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.62)';
        c.fillText(t('hud.pace', { pace, proj }), W / 2, 112);
        const paceDelta = wallRecordPaceDelta(this);
        if (paceDelta != null && bestSaved > 0) {
          showPaceDelta = true;
          c.font = '700 11px sans-serif';
          c.fillStyle = paceDelta >= 0 ? '#7cfc8a' : '#ffb0b8';
          c.fillText(
            paceDelta >= 0 ? t('hud.paceAhead', { n: paceDelta }) : t('hud.paceBehind', { n: paceDelta }),
            W / 2, 126
          );
        }
      }
      const comboWin = this.wallComboWindow || 1.4;
      if (this.combo > 0 && this.comboT > 0) {
        const cFrac = clamp(this.comboT / comboWin, 0, 1);
        const cBarW = Math.min(160, W * 0.42);
        const cBarX = (W - cBarW) / 2;
        const cy = showPaceDelta ? (this.combo > 1 ? 172 : 156) : (this.combo > 1 ? 158 : 142);
        c.font = '700 9px sans-serif';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(124,245,255,.55)';
        c.fillText(t('hud.comboLabel'), cBarX, cy - 4);
        c.textAlign = 'center';
        c.fillStyle = 'rgba(0,0,0,.38)';
        this.rr(c, cBarX, cy, cBarW, 5, 3); c.fill();
        const lowCombo = cFrac < 0.25;
        c.fillStyle = lowCombo ? '#ff9a9a' : '#7cf5ff';
        if (lowCombo && !motionReduced()) {
          c.globalAlpha = 0.55 + Math.sin(this.t * 14) * 0.35;
        }
        this.rr(c, cBarX, cy, Math.max(3, cBarW * cFrac), 5, 3); c.fill();
        c.globalAlpha = 1;
      }
      if (this.combo > 1) {
        const pulse = motionReduced() ? 1 : (1 + Math.sin(this.t * 10) * 0.1);
        c.save();
        c.translate(W / 2, showPaceDelta ? 152 : 138);
        c.scale(pulse, pulse);
        c.font = '900 22px sans-serif'; c.fillStyle = '#7cf5ff';
        c.fillText(t('hud.combo', { n: this.combo }), 0, 0);
        c.font = '700 12px sans-serif'; c.fillStyle = 'rgba(124,245,255,.85)';
        c.fillText(t('hud.comboSmash', { pct: Math.min(this.combo, 12) * 4 }), 0, 18);
        c.restore();
      } else if (this.combo === 1 && this.comboT > 0) {
        c.font = '700 12px sans-serif';
        c.fillStyle = 'rgba(124,245,255,.75)';
        c.fillText(t('hud.comboActive'), W / 2, showPaceDelta ? 142 : 128);
      }
    } else if (this.mode === 'coinrun') {
      const tLeft = Math.ceil(Math.max(0, this.coinTimer));
      c.font = '900 30px sans-serif';
      c.fillStyle = this.coinTimer < 10 ? '#ff6b6b' : '#fff';
      c.fillText(String(tLeft), W / 2, 42);
      c.font = '800 18px sans-serif'; c.fillStyle = '#ffd75e';
      c.fillText(t('hud.coins', { n: this.coinsCollected }), W / 2, 70);
      c.font = '700 13px sans-serif'; c.fillStyle = 'rgba(255,255,255,.7)';
      c.fillText(t('hud.matsRecord', { n: save.stats.matsCoinBest || 0 }), W / 2, 90);
      const pendingPet = matsPetCoinsFromRun(this.coinsCollected);
      c.fillStyle = '#ff9ad5';
      c.fillText(t('hud.petCoins', { pending: pendingPet, wallet: petCoinsBalance() }), W / 2, 108);
      c.fillStyle = 'rgba(124,245,255,.85)';
      c.fillText(t('hud.matsHint'), W / 2, 128);
    } else if (this.mode === 'versus' && this.p2) {
      const p2 = this.p2;
      const half = Math.min(260, W * 0.38);
      const safeTop = hudInsetTop();
      const byVs = Math.max(by, safeTop + 42);
      const name1 = vsRosterEntry(this.p1Pick).name;
      const name2 = vsRosterEntry(this.p2Pick).name;
      if (this.phase === 'intro' && this.phaseT < 1.55) {
        const n = Math.ceil(Math.max(0.35, 1.55 - this.phaseT));
        if (typeof drawPixelVsBanner === 'function') {
          drawPixelVsBanner(c, W / 2, H * 0.28, Math.max(3, Math.round(Math.min(W, H) / 160)), this.t);
        }
        c.font = '900 48px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.92)';
        c.fillText(String(n), W / 2, H * 0.42);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.65)';
        c.fillText(t('hud.spawnFair'), W / 2, H * 0.42 + 28);
        c.font = '800 14px sans-serif';
        c.fillStyle = '#7cf5ff';
        c.fillText(name1, W * 0.28, H * 0.28);
        c.fillStyle = '#ffb0b8';
        c.fillText(name2, W * 0.72, H * 0.28);
      } else if (this.phase === 'roundend') {
        const left = Math.max(0, 2.2 - this.phaseT);
        const matchOver = this.roundsP1 >= 2 || this.roundsP2 >= 2;
        c.font = '900 34px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.fillText(String(Math.ceil(left)), W / 2, H * 0.38);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        c.fillText(matchOver ? t('hud.matchOver') : t('hud.nextRound'), W / 2, H * 0.38 + 26);
        if (this.vsLastRoundP1Win != null) {
          c.font = '800 12px sans-serif';
          c.fillStyle = this.vsLastRoundP1Win ? '#7cf5ff' : '#ffb0b8';
          c.fillText(
            this.vsLastRoundP1Win ? t('hud.roundWinnerP1') : t('hud.roundWinnerP2'),
            W / 2, H * 0.38 + 46
          );
        }
        c.font = '700 10px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.fillText(t('hud.roundSkipHint'), W / 2, H * 0.38 + 62);
        const barW = Math.min(140, W * 0.24);
        c.fillStyle = 'rgba(0,0,0,.35)';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 70, barW, 5, 3);
        c.fill();
        c.fillStyle = '#7cf5ff';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 70, barW * clamp(left / 2.2, 0, 1), 5, 3);
        c.fill();
      } else if (this.phase === 'fatality') {
        c.font = '900 44px sans-serif';
        c.fillStyle = '#ff3040';
        c.fillText(t('banner.vsFatalityShout'), W / 2, H * 0.34);
        c.font = '700 14px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.78)';
        c.fillText(t('hud.vsFatalityHint'), W / 2, H * 0.34 + 30);
        if (this.fatalityStrikeT <= 0) {
          const left = Math.max(0, 3.5 - this.phaseT);
          c.font = '800 12px sans-serif';
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.fillText(String(Math.ceil(left)), W / 2, H * 0.34 + 52);
        }
      }
      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, bx - 4, byVs - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, byVs, half, 14, 6); c.fill();
      const hp1Frac = clamp(p.hp / p.maxhp, 0, 1);
      const low1 = hp1Frac < 0.28 && this.phase === 'fight';
      c.fillStyle = hp1Frac > 0.35 ? '#6ee06e' : '#ff6b6b';
      if (low1 && !motionReduced()) c.globalAlpha = 0.65 + Math.sin(this.t * 11) * 0.3;
      this.rr(c, bx, byVs, half * hp1Frac, 14, 6); c.fill();
      c.globalAlpha = 1;
      c.font = '800 11px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#7cf5ff';
      const hp1Pct = Math.round(hp1Frac * 100);
      c.fillText(t('hud.p1Line', { name: name1, pct: hp1Pct }), bx, byVs + 30);
      c.fillStyle = '#333c55'; this.rr(c, bx, byVs + 34, half, 5, 3); c.fill();
      this.drawSuperMeterFill(c, bx, byVs + 34, half, 5, p.energy / 100, fighterJutsuKind(p), this.t);
      drawWeaponStylePips(c, bx + 8, byVs + 44, p);

      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, W - half - 20, byVs - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, byVs, half, 14, 6); c.fill();
      const frac2 = clamp(p2.hp / p2.maxhp, 0, 1);
      const low2 = frac2 < 0.28 && this.phase === 'fight';
      c.fillStyle = '#ff8080';
      if (low2 && !motionReduced()) c.globalAlpha = 0.65 + Math.sin(this.t * 11) * 0.3;
      this.rr(c, W - 16 - half * frac2, byVs, half * frac2, 14, 6); c.fill();
      c.globalAlpha = 1;
      c.textAlign = 'right'; c.fillStyle = '#ffb0b8';
      const hp2Pct = Math.round(frac2 * 100);
      c.fillText(t('hud.p2Line', { pct: hp2Pct, name: name2 }), W - 20, byVs + 30);
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, byVs + 34, half, 5, 3); c.fill();
      this.drawSuperMeterFill(c, W - half - 16, byVs + 34, half, 5, p2.energy / 100, fighterJutsuKind(p2), this.t);
      drawWeaponStylePips(c, W - half - 8, byVs + 44, p2);

      c.textAlign = 'center';
      const tLeft = Math.ceil(Math.max(0, this.roundTimer));
      const urgent = this.roundTimer < 15 && this.phase === 'fight';
      c.font = urgent ? '900 28px sans-serif' : '900 26px sans-serif';
      c.fillStyle = urgent ? '#ff9a9a' : '#fff';
      const timerY = byVs + 58;
      if (urgent && !motionReduced()) {
        c.save();
        c.translate(W / 2, timerY);
        c.scale(1 + Math.sin(this.t * 10) * 0.05, 1 + Math.sin(this.t * 10) * 0.05);
        c.fillText(String(tLeft), 0, 0);
        c.restore();
      } else {
        c.fillText(String(tLeft), W / 2, timerY);
      }
      c.font = '800 12px sans-serif'; c.fillStyle = 'rgba(255,255,255,.75)';
      const decisiveRound = this.roundsP1 === 1 && this.roundsP2 === 1;
      const scoreLine = decisiveRound
        ? t('hud.decisiveRound', { s: this.roundsP1, r: this.roundsP2 })
        : t('hud.roundInfo', { n: this.round, s: this.roundsP1, r: this.roundsP2 });
      c.fillText(scoreLine, W / 2, timerY + 18);
      // d3 c5: TOT rating chip (fairness preview, geen balance-tweak)
      if (this.phase === 'fight' || this.phase === 'intro') {
        const tot = vsMatchupTotShort(this.p1Pick, this.p2Pick);
        c.font = '700 9px sans-serif';
        c.fillStyle = tot.even ? 'rgba(255,215,94,.78)' : (tot.leadP1 ? 'rgba(124,245,255,.72)' : 'rgba(255,176,184,.72)');
        const totLine = tot.even
          ? t('hud.vsTotEven', { r1: tot.r1, r2: tot.r2 })
          : (tot.leadP1
            ? t('hud.vsTotLeadP1', { r1: tot.r1, r2: tot.r2, diff: tot.diff })
            : t('hud.vsTotLeadP2', { r1: tot.r1, r2: tot.r2, diff: tot.diff }));
        c.fillText(totLine, W / 2, timerY + 30);
      }
      // d3 c4: match-point side chip
      const mp1Only = this.roundsP1 === 1 && this.roundsP2 === 0;
      const mp2Only = this.roundsP2 === 1 && this.roundsP1 === 0;
      const showTot = this.phase === 'fight' || this.phase === 'intro';
      if ((mp1Only || mp2Only) && this.phase === 'fight') {
        c.font = '800 10px sans-serif';
        c.fillStyle = mp1Only ? '#7cf5ff' : '#ffb0b8';
        c.fillText(mp1Only ? t('hud.matchPointP1') : t('hud.matchPointP2'), W / 2, timerY + (showTot ? 42 : 32));
      }
      const timerBarW = Math.min(160, W * 0.28);
      const timerFrac = clamp(this.roundTimer / 99, 0, 1);
      const timerBarY = (mp1Only || mp2Only) && this.phase === 'fight'
        ? timerY + (showTot ? 50 : 38)
        : (showTot ? timerY + 38 : timerY + 24);
      c.fillStyle = 'rgba(0,0,0,.35)';
      this.rr(c, W / 2 - timerBarW / 2, timerBarY, timerBarW, 5, 3);
      c.fill();
      c.fillStyle = urgent ? '#ff6b6b' : '#7cf5ff';
      this.rr(c, W / 2 - timerBarW / 2, timerBarY, timerBarW * timerFrac, 5, 3);
      c.fill();
      if (this.roundTimer < 12 && this.phase === 'fight') {
        c.font = '700 10px sans-serif';
        c.fillStyle = 'rgba(255,215,94,.85)';
        c.fillText(t('hud.timeHpWin'), W / 2, timerBarY + 14);
        // live HP lead
        const lead = hp1Pct - hp2Pct;
        if (Math.abs(lead) >= 1) {
          c.font = '700 9px sans-serif';
          c.fillStyle = lead > 0 ? 'rgba(124,245,255,.8)' : 'rgba(255,176,184,.8)';
          c.fillText(
            lead > 0 ? t('hud.hpLeadP1', { n: lead }) : t('hud.hpLeadP2', { n: Math.abs(lead) }),
            W / 2, timerBarY + 26
          );
        }
      }
      const mp1 = this.roundsP1 === 1 && this.roundsP2 < 2;
      const mp2 = this.roundsP2 === 1 && this.roundsP1 < 2;
      let dotY = timerBarY + 14;
      if (this.roundTimer < 12 && this.phase === 'fight') dotY = timerBarY + 38;
      const log = this.vsRoundLog || [];
      if (log.length) {
        c.font = '700 9px sans-serif';
        c.textAlign = 'center';
        const chips = log.map((w, i) => `R${i + 1}:${w === 'p1' ? 'P1' : 'P2'}`).join(' · ');
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.fillText(chips, W / 2, dotY - 12);
      }
      for (let i = 0; i < 2; i++) {
        const litP1 = i < this.roundsP1;
        c.fillStyle = litP1 ? '#7cf5ff' : 'rgba(255,255,255,.22)';
        if (mp1 && i === 1) c.fillStyle = '#ffd75e';
        c.beginPath(); c.arc(W / 2 - 40 - i * 16, dotY, mp1 && i === 1 ? 6 : 5, 0, TAU); c.fill();
        const litP2 = i < this.roundsP2;
        c.fillStyle = litP2 ? '#ffb0b8' : 'rgba(255,255,255,.22)';
        if (mp2 && i === 1) c.fillStyle = '#ffd75e';
        c.beginPath(); c.arc(W / 2 + 40 + i * 16, dotY, mp2 && i === 1 ? 6 : 5, 0, TAU); c.fill();
      }
      if (p.invulnT > 0.05) {
        c.font = '700 9px sans-serif'; c.fillStyle = 'rgba(124,245,255,.75)'; c.textAlign = 'left';
        c.fillText(t('hud.spawnGrace', { n: p.invulnT.toFixed(1) }), bx, byVs + 52);
      }
      if (p2.invulnT > 0.05) {
        c.font = '700 9px sans-serif'; c.fillStyle = 'rgba(255,176,184,.75)'; c.textAlign = 'right';
        c.fillText(t('hud.spawnGrace', { n: p2.invulnT.toFixed(1) }), W - 20, byVs + 52);
      }
      if (p.energy >= 100) {
        const k1 = fighterJutsuKind(p);
        drawJutsuMiniIcon(c, k1, bx + half - 10, byVs + 9, jutsuAccentColor(k1, false));
      }
      if (p2.energy >= 100) {
        const k2 = fighterJutsuKind(p2);
        drawJutsuMiniIcon(c, k2, W - 26, byVs + 9, jutsuAccentColor(k2, true));
      }
    }
  }

  rr(c, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  drawSpecialBtnMeter(c, b, fighter, accent) {
    if (!fighter || b.id !== 'special') return;
    const pct = clamp(fighter.energy / 100, 0, 1);
    const kind = fighterJutsuKind(fighter);
    const ring = b.r + 4;
    c.save();
    c.globalAlpha = 0.28;
    c.strokeStyle = '#1a2030';
    c.lineWidth = 6;
    c.beginPath(); c.arc(0, 0, ring, 0, TAU); c.stroke();
    const calm = motionReduced();
    if (pct > 0.02) {
      c.globalAlpha = calm ? 0.82 : (kind === 'chidori' ? 0.75 + Math.sin(this.t * 18) * 0.12 : 0.82);
      c.strokeStyle = kind === 'chidori' ? '#7ec8ff' : kind === 'rinnegan' ? '#b06ae0' : accent || '#3db8ff';
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(0, 0, ring, -Math.PI / 2, -Math.PI / 2 + TAU * pct);
      c.stroke();
    }
    if (pct >= 1) {
      c.globalAlpha = 0.9;
      c.strokeStyle = kind === 'chidori' ? '#a8e0ff' : kind === 'rinnegan' ? '#c47aff' : '#7cf5ff';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, ring + 5 + (calm ? 0 : Math.sin(this.t * 8) * 2), 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  /** Combat touch-knop met press-squash (d9 / polish #4). Tekent op lokale (0,0). */
  drawTouchActionBtn(c, b, fighter, accent, opts) {
    opts = opts || {};
    const xf = typeof touchBtnPressXform === 'function'
      ? touchBtnPressXform(b)
      : { p: b.held ? 1 : 0, sx: b.held ? 0.89 : 1, sy: b.held ? 0.83 : 1, dy: b.held ? 3 : 0 };
    c.save();
    c.translate(b.x, b.y + xf.dy);
    c.scale(xf.sx, xf.sy);
    if (b.id === 'special') this.drawSpecialBtnMeter(c, b, fighter, accent || '#3db8ff');
    const heldA = opts.dual ? 0.85 : 0.85;
    const idleA = opts.dual ? 0.42 : 0.45;
    c.globalAlpha = idleA + (heldA - idleA) * (xf.p || 0);
    c.fillStyle = b.color;
    c.beginPath(); c.arc(0, 0, b.r, 0, TAU); c.fill();
    if (xf.p > 0.08) {
      c.globalAlpha = (opts.dual ? 0.55 : 0.6) * xf.p;
      c.strokeStyle = accent || '#fff';
      c.lineWidth = opts.dual ? 2 : 2.5;
      c.beginPath(); c.arc(0, 0, b.r + 3, 0, TAU); c.stroke();
    }
    c.globalAlpha = opts.dual ? 0.9 : (0.85 + 0.15 * (xf.p || 0));
    const jk = b.id === 'special'
      ? (fighter ? fighterJutsuKind(fighter) : 'rasengan')
      : null;
    if (!drawTouchBtnIcon(c, b.id, 0, 0, b.r, jk)) {
      c.font = `${b.r * (opts.dual ? 0.8 : 0.85)}px sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(b.label, 0, 2);
    }
    if (b.id === 'subst' && fighter && fighter.substCd > 0) {
      c.globalAlpha = 0.35;
      c.fillStyle = '#000';
      c.beginPath(); c.arc(0, 0, b.r, 0, TAU); c.fill();
    }
    if (b.id === 'special' && fighter && fighter.specialCd > 0
        && fighterJutsuKind(fighter) === 'rasengan') {
      c.globalAlpha = 0.4;
      c.fillStyle = '#000';
      c.beginPath(); c.arc(0, 0, b.r, 0, TAU); c.fill();
      c.globalAlpha = 0.95;
      c.fillStyle = '#7cf5ff';
      c.font = `800 ${Math.max(11, b.r * 0.42)}px sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(Math.ceil(fighter.specialCd) + 's', 0, 1);
    }
    c.restore();
  }

  drawTouchControls(c) {
    // NUCLEAR: solo modes NEVER show P1/P2 pads — dualMode leak looked like versus in adventure
    if (this.mode !== 'versus' && typeof Input !== 'undefined' && Input.dualMode) {
      try {
        Input.dualMode = false;
        Input.layout(W, H);
      } catch (_) {}
    }
    const ui = touchUiScale(W, H);
    const joyOuter = Math.round(52 * ui);
    const joyInner = Math.round(26 * ui);
    if (Input.dualMode && this.mode === 'versus') {
      const nz = typeof touchNeutralZoneBounds === 'function' ? touchNeutralZoneBounds() : null;
      if (nz) {
        c.save();
        c.fillStyle = 'rgba(255,255,255,.06)';
        c.fillRect(nz.lo, H * 0.58, nz.hi - nz.lo, H * 0.38);
        c.globalAlpha = 0.28;
        c.strokeStyle = 'rgba(255,255,255,.14)';
        c.setLineDash([6, 8]);
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(nz.lo, H * 0.6);
        c.lineTo(nz.lo, H - 8);
        c.moveTo(nz.hi, H * 0.6);
        c.lineTo(nz.hi, H - 8);
        c.stroke();
        c.restore();
      }
      this.drawPad(c, Input, this.player, 'P1', '#7cf5ff');
      this.drawPad(c, InputP2, this.p2 || this.player, 'P2', '#ffb0b8');
      return;
    }
    c.save();
    const j = Input.joy;
    const jx = j.active ? j.ox : (Input.joyHome?.x || 110), jy = j.active ? j.oy : (Input.joyHome?.y || H - 110);
    // d20 #19 — pixel ring + knob (was smooth arcs)
    if (typeof drawPixelJoyRing === 'function') {
      drawPixelJoyRing(c, jx, jy, joyOuter, '#e8ecf2', j.active ? 0.48 : 0.22, Math.max(3, Math.round(4 * ui)));
    } else {
      c.globalAlpha = j.active ? 0.5 : 0.22;
      c.strokeStyle = '#fff'; c.lineWidth = 3;
      c.beginPath(); c.arc(jx, jy, joyOuter, 0, TAU); c.stroke();
    }
    if (j.active) {
      c.save();
      const calm = motionReduced();
      c.globalAlpha = calm ? 0.35 : (0.32 + Math.sin(this.t * 14) * 0.1);
      c.strokeStyle = '#7cf5ff';
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(jx, jy, joyOuter + 7 + (calm ? 0 : Math.sin(this.t * 11) * 2), 0, TAU);
      c.stroke();
      c.restore();
    }
    drawJoyAimGuide(c, jx, jy, j, ui, '#7a9aaa');
    const kx = jx + (j.active ? j.dx : 0);
    const ky = jy + (j.active ? j.dy : 0);
    if (typeof drawPixelJoyKnob === 'function') {
      drawPixelJoyKnob(c, kx, ky, joyInner, '#d8dde4', j.active ? 0.62 : 0.28);
    } else {
      c.globalAlpha = j.active ? 0.65 : 0.3;
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(kx, ky, joyInner, 0, TAU); c.fill();
    }
    if (this.player) {
      drawPlayerAimIndicator(c, this.player, j.active ? 0.62 : 0.28);
    }
    for (const b of Input.buttons) {
      this.drawTouchActionBtn(c, b, this.player, '#fff', { dual: false });
    }
    c.textBaseline = 'alphabetic';
    c.restore();
  }

  drawPad(c, pad, fighter, label, accent) {
    c.save();
    const ui = touchUiScale(W, H);
    const joyOuter = Math.round(48 * ui);
    const joyInner = Math.round(22 * ui);
    const j = pad.joy;
    const jx = j.active ? j.ox : pad.joyHome.x, jy = j.active ? j.oy : pad.joyHome.y;
    if (typeof drawPixelJoyRing === 'function') {
      drawPixelJoyRing(c, jx, jy, joyOuter, accent, j.active ? 0.42 : 0.28, Math.max(3, Math.round(3.5 * ui)));
    } else {
      c.globalAlpha = 0.35;
      c.strokeStyle = accent;
      c.lineWidth = 3;
      c.beginPath(); c.arc(jx, jy, joyOuter, 0, TAU); c.stroke();
    }
    if (j.active) {
      c.save();
      const calm = motionReduced();
      c.globalAlpha = calm ? 0.4 : (0.38 + Math.sin(this.t * 14) * 0.12);
      c.strokeStyle = accent;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(jx, jy, joyOuter + 6 + (calm ? 0 : Math.sin(this.t * 11) * 2), 0, TAU);
      c.stroke();
      c.restore();
    }
    drawJoyAimGuide(c, jx, jy, j, ui, accent);
    const kx = jx + (j.active ? j.dx : 0);
    const ky = jy + (j.active ? j.dy : 0);
    if (typeof drawPixelJoyKnob === 'function') {
      drawPixelJoyKnob(c, kx, ky, joyInner, accent, j.active ? 0.52 : 0.26);
    } else {
      c.globalAlpha = j.active ? 0.55 : 0.25;
      c.fillStyle = accent;
      c.beginPath(); c.arc(kx, ky, joyInner, 0, TAU); c.fill();
    }
    if (fighter) drawPlayerAimIndicator(c, fighter, j.active ? 0.55 : 0.24);
    c.globalAlpha = 0.75;
    c.font = '900 11px sans-serif'; c.fillStyle = accent; c.textAlign = 'center';
    c.fillText(label, jx, jy - 58);
    for (const b of pad.buttons) {
      this.drawTouchActionBtn(c, b, fighter, accent, { dual: true });
    }
    c.textBaseline = 'alphabetic';
    c.restore();
  }
}

