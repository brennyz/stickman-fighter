/* ================================ GAME ================================= */
let game = null;

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
    this.sessionXP = 0;
    this.over = false;
    this.maxCombo = 0;
    this.combo = 0;
    this.comboT = 0;

    const st = playerStats();
    if (mode !== 'versus') {
      const advLevel = mode === 'adventure' ? (opts.level || 1) : 0;
      const mb = mode === 'adventure' && masterBuffActive(advLevel);
      const pst = mode === 'adventure' ? playerStats({ masterBuff: mb }) : st;
      const wpn = mode === 'adventure' ? playerWeaponForAdventure(advLevel) : playerWeapon();
      this.player = new Fighter({
        isPlayer: true, x: W * 0.25, y: this.ground,
        hp: pst.maxhp, maxhp: pst.maxhp, baseDmg: pst.dmg,
        weapon: wpn, color: '#f2f5ff',
        speed: Math.round(260 * (pst.speedMul || 1)),
        rosterId: 'hero',
      });
      applyPlayerStyle(this.player);
    }

    if (mode === 'adventure') {
      this.combo = 0; this.comboT = 0;
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
      this.initAdventure(opts.level || 1, opts.gamble);
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
  initAdventure(n, gamble) {
    this.level = buildLevel(n);
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
    applyGambleToStage(this, gamble);
    this.banner(`LEVEL ${n}`, 1.4, '#ffd75e', 54);
    if (masterBuffActive(n)) {
      setTimeout(() => {
        try {
          if (this.over) return;
          this.banner('MEESTER-BUFF +20%', 2, '#c47aff', 40);
          this.floater(W * 0.5, 132, '5× verloren — HP, snelheid & schade ↑', '#c47aff', 14);
        } catch (_) {}
      }, 1500);
    }
    const wCap = adventureWeaponCapForLevel(n);
    if (playerWeapon().unlock > wCap) {
      setTimeout(() => {
        try {
          if (this.over) return;
          this.floater(W * 0.5, 148, `Eiland-skill gate: max wapen Lv ${wCap}`, '#ffd75e', 13);
        } catch (_) {}
      }, masterBuffActive(n) ? 2800 : 1500);
    }
    if (gamble && gamble.outcome !== 'neutral') {
      setTimeout(() => {
        try {
          if (this.over) return;
          this.banner(gambleOutcomeLabel(gamble).slice(0, 42), 2.2, '#7cf5ff', 34);
        } catch (_) {}
      }, 1600);
    }
    if (this.gambleBossWave > 0) {
      this.floater(W * 0.5, 100, `Super-baas mogelijk golf ${this.gambleBossWave}`, '#ffb0b8', 14);
    }
    if (this.stageAlly) {
      this.floater(W * 0.5, 118, `${this.stageAlly.name} helpt je!`, this.stageAlly.color || '#7cf5ff', 15);
    }
    this.allyAssistT = this.stageAlly ? 2.2 : 0;
    setTimeout(() => { try { if (!this.over) this.maybeRollMasterSword(); } catch (_) {} }, 900);
    AudioSys.play(this.level.boss ? 'boss' : 'battle');
  }

  maybeRollMasterSword() {
    if (this.mode !== 'adventure' || this.over || !this.player || !this.player.alive) return;
    if (this.masterSwordT > 0) return;
    const w = this.player.weapon;
    if (!canMasterSwordRoll(w)) return;
    if (Math.random() >= MASTER_SWORD_CHANCE) return;
    this.activateMasterSword();
  }

  activateMasterSword() {
    const p = this.player;
    if (!p || !canMasterSwordRoll(p.weapon)) return;
    this._savedMasterWeapon = p.weapon;
    p.weapon = buildMasterSwordWeapon(p.weapon);
    this.masterSwordT = MASTER_SWORD_DURATION;
    resetWeaponCombo(p);
    this.banner('MASTER SWORD!', 2.4, '#7cf5ff', 52);
    this.floater(p.x, p.y - 132, 'Hyrules legendarische kling — 15s!', '#ffd75e', 16);
    if (!fxLite() && !motionReduced()) {
      this.burst(p.x + p.face * 18, p.y - 52, '#6fd7ff', 14, { kind: 'spark', size: 2.8 });
      spawnFxRing(this, p.x, p.y - 48, '#7cf5ff', 12);
    }
    try { AudioSys.sting('bonus'); AudioSys.sfx('bonus'); } catch (_) {}
    haptic(26);
  }

  deactivateMasterSword(silent) {
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
      this.floater(this.player.x, this.player.y - 120, 'Master Sword vervaagt…', '#9db1e3', 14);
    }
  }

  nextWave() {
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
    if (bossWave) {
      this.banner('BAAS-GOLF!', 1.8, '#ff6b6b', 50);
      AudioSys.play('boss');
      AudioSys.sfx('roar');
      try {
        this.shake(8, 0.3);
        this.burst(W * 0.5, this.ground - 80, '#ff6b6b', fxLite() ? 12 : 22);
        spawnFxRing(this, W * 0.5, this.ground - 80, '#ffd75e', 18);
      } catch (_) {}
    } else if (wave.some(s => s.elite || s.superBoss)) {
      const hasSuper = wave.some(s => s.superBoss);
      this.banner(hasSuper ? 'SUPER-BAAS GOLF' : 'ELITE-GOLF', 1.35, hasSuper ? '#ffd75e' : '#ffb0b8', 40);
      AudioSys.play(hasSuper ? 'boss' : 'elite');
      AudioSys.sfx('roar');
    } else {
      const meta = this.level.waveMeta && this.level.waveMeta[this.waveIdx];
      const trait = meta && meta.trait && WAVE_TRAIT_BANNER[meta.trait];
      if (trait) {
        this.banner(trait.text, 1.2, trait.color, trait.size);
        if (meta.trait === 'flyers') {
          try { this.floater(W * 0.5, 108, 'Joystick omhoog = hoger mikken', '#c47aff', 13); } catch (_) {}
        }
      } else {
        this.banner(`GOLF ${this.waveIdx + 1}/${this.level.waves.length}`, 1.1, '#cfe0ff', 38);
      }
    }
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
    // Bewegend decor: tussen golven "loopt" de wereld door (à la beat 'em up)
    const travelPhase = this.wavePause > 0 || (this.betweenT > 0 && this.waveIdx < 0);
    this.traveling = travelPhase && !!(this.player && this.player.alive) && !this.over;
    // Deel 3: camera-punch bij vertrek, zwaardere beat bij aankomst op de baas
    if (this.traveling && !this.travelWasOn) {
      this.shake(motionReduced() ? 2 : 5, 0.22);
      this.bossBeatPlayed = false;
      if (!fxLite() && !motionReduced() && this.player) {
        this.burst(this.player.x - 18, this.player.y - 8, '#c9b691', 9, { kind: 'spark', size: 2.2 });
      }
    } else if (!this.traveling && this.travelWasOn) {
      if (isBossWave(this.level, this.waveIdx)) {
        this.shake(motionReduced() ? 3 : 9, 0.35);
        this.freezeT = Math.max(this.freezeT, 0.06);
        this.bossArriveT = motionReduced() ? 0.3 : 0.7;
        haptic(24);
      }
    }
    this.travelWasOn = this.traveling;
    if (this.traveling) {
      this.worldX = (this.worldX || 0) + dt * (isBossWave(this.level, this.waveIdx + 1) ? 220 : 165);
    }
    // Baas-aankomst-beat: halverwege de reis naar de baas-golf één roar
    if (this.wavePause > 0 && isBossWave(this.level, this.waveIdx + 1) && !this.bossBeatPlayed) {
      const f = 1 - this.wavePause / (this.wavePauseTotal || 1);
      if (f > 0.45) {
        this.bossBeatPlayed = true;
        try { AudioSys.sfx('roar'); } catch (_) {}
        this.floater(W / 2, 120, 'DE BAAS WACHT…', '#ff8a9a', 15);
      }
    }
    if (this.partFlashT > 0) this.partFlashT -= dt;
    if (this.bossArriveT > 0) this.bossArriveT -= dt;
    const pr = this.stageProgress();
    const part = Math.min(3, 1 + Math.floor(pr * 3));
    if (part > (this.stagePart || 1)) {
      this.stagePart = part;
      this.partFlashT = motionReduced() ? 0.22 : 0.5;
      this.floater(W / 2, 96, `CHECKPOINT — DEEL ${part}/3`, '#7cf5ff', 17);
      const orbX = W / 2 - Math.min(320, W * 0.5) / 2 + clamp(this.progressSmooth || 0, 0, 1) * Math.min(320, W * 0.5);
      if (!fxLite()) this.burst(orbX, 44, '#7cf5ff', motionReduced() ? 6 : 14, { kind: 'spark', size: 2.4 });
      try { AudioSys.sfx('bonus'); } catch (_) {}
      haptic(10);
    }
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
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
        this.allyAssistT = this.stageAlly.id === 'dawn' ? 3.6 : 5;
        const tgt = this.monsters.reduce((best, m) => {
          if (!m.alive) return best;
          const d = Math.abs(m.x - this.player.x);
          return !best || d < Math.abs(best.x - this.player.x) ? m : best;
        }, null);
        if (tgt) {
          const dmg = Math.round(this.player.baseDmg * 0.38 * (this.stageDmgMul || 1));
          tgt.takeDamage(dmg, Math.sign(tgt.x - this.player.x) * 140, this);
          this.floater(tgt.x, tgt.y - tgt.size - 22, `${this.stageAlly.name} −${dmg}`, this.stageAlly.color || '#7cf5ff', 12);
          if (!fxLite()) this.burst(tgt.x, tgt.y - tgt.size * 0.4, this.stageAlly.color || '#7cf5ff', 6, { kind: 'spark', size: 2 });
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
      if ((p.x - pk.x) ** 2 + dy ** 2 < 44 * 44) this.collectPickup(pk);
    }
    this.pickups = this.pickups.filter(pk => pk.life > 0);
    if (this.betweenT > 0) {
      this.betweenT -= dt;
      if (this.betweenT <= 0 && this.waveIdx < 0) this.nextWave();
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
          const side = Math.random() < 0.75 ? 1 : -1;
          const x = (side > 0 ? W + 40 : -40) + b * side * 32;
          const mon = new Monster(def.sp, x, this, {
            elite: !!(def.elite || def.superBoss),
            superBoss: !!def.superBoss,
            giant: !!def.giant,
            hpMul: this.level.hpMul,
            dmgMul: this.level.dmgMul,
          });
          this.monsters.push(mon);
          if (def.superBoss) {
            triggerSpecialEnemyIntro(this, mon, 'superBoss');
          } else if (def.elite || bossWave) {
            triggerSpecialEnemyIntro(this, mon, bossWave ? 'boss' : 'elite');
          } else if (def.giant && !fxLite()) {
            this.floater(mon.x, mon.y - mon.size - 28, 'REUS!', '#ffd75e', 13);
          }
        }
      } else if (alive >= ADVENTURE_MAX_ALIVE) {
        this.spawnTimer = Math.min(this.spawnTimer, 0.12);
      }
    } else if (this.waveIdx >= 0 && this.monsters.every(m => !m.alive)) {
      if (!this.wavePause) {
        const nextIsBoss = isBossWave(this.level, this.waveIdx + 1);
        this.wavePause = nextIsBoss ? 2.15 : 1.55;
        this.wavePauseTotal = this.wavePause;
        if (this.player && this.player.alive) {
          const waveHeal = Math.max(4, Math.round(this.player.maxhp * 0.06));
          this.player.hp = Math.min(this.player.maxhp, this.player.hp + waveHeal);
          this.player.energy = clamp(this.player.energy + 8, 0, 100);
          this.floater(this.player.x, this.player.y - 88, `Golf gewist +${waveHeal} HP`, '#6ee06e', 14);
        }
        if (this.stageHealBetween > 0 && this.player && this.player.alive) {
          const heal = Math.max(8, Math.round(this.player.maxhp * this.stageHealBetween));
          this.player.hp = Math.min(this.player.maxhp, this.player.hp + heal);
          this.floater(this.player.x, this.player.y - 108, `+${heal} bondgenoot`, '#6ee06e', 14);
        }
      }
      this.wavePause -= dt;
      if (this.wavePause <= 0) { this.wavePause = 0; this.nextWave(); }
    }
    if (!this.player.alive && !this.over) this.finishAdventure(false);
  }

  finishAdventure(win) {
    if (this.over) return;
    this.deactivateMasterSword(true);
    this.over = true;
    this.inputLocked = true;
    let stars = 0;
    const lv = this.level.n;
    if (win) {
      const bonus = 30 + lv * 10;
      this.grantXP(bonus);
      if (lv === save.unlocked && save.unlocked < MAX_LEVEL) { save.unlocked++; persist(); }
      if (lv % LEVELS_PER_ISLAND === 0) {
        save.advIsland = Math.min(5, lv / LEVELS_PER_ISLAND);
        persist();
        if (lv < MAX_LEVEL) {
          const next = islandMeta(islandFromLevel(lv + 1));
          const nCap = adventureWeaponCapForLevel(lv + 1);
          setTimeout(() => {
            try { UI.toast(`${next.name} ontgrendeld! Skill gate: wapens tot Lv ${nCap}`, 4200); } catch (_) {}
          }, 1700);
        }
      }
      if (save.advMasterBuff === lv) {
        save.advMasterBuff = null;
        persist();
      }
      const hpPct = this.player.hp / Math.max(1, this.player.maxhp);
      stars = starsFromHpPct(hpPct);
      const prev = save.stars[lv] || 0;
      if (stars > prev) { save.stars[lv] = stars; persist(); }
      bumpStat('advWins', 1);
      bumpDaily('advWin', 1);
      checkAchievements();
      AudioSys.sfx('win');
      this.banner('GEWONNEN!', 2, '#7cfc8a', 56);
    } else {
      if (!save.advFails || typeof save.advFails !== 'object') save.advFails = {};
      const hadMaster = save.advMasterBuff === lv;
      save.advFails[lv] = (save.advFails[lv] || 0) + 1;
      const gotMaster = save.advFails[lv] >= 5 && !hadMaster;
      if (gotMaster) save.advMasterBuff = lv;
      persist();
      if (gotMaster) {
        setTimeout(() => { try { UI.toast('Meester-buff! +20% HP, snelheid & schade tot je wint', 3800); } catch (_) {} }, 1500);
      }
      AudioSys.sfx('lose');
      this.banner('VERSLAGEN...', 2, '#ff6b6b', 50);
    }
    setTimeout(() => UI.showResult(win, {
      title: win ? 'GEWONNEN!' : 'VERSLAGEN...',
      detail: (() => {
        let base = win
          ? `Level ${lv} · ${this.kills} monsters · ${stars}★ · max combo ×${this.maxCombo || 0}`
          : `Level ${lv} · ${this.kills} monsters · max combo ×${this.maxCombo || 0}`;
        if (masterBuffActive(lv) && !win) base += ' · Meester-buff actief';
        if (this.gambleRoll && this.gambleRoll.outcome !== 'neutral') {
          base += ` · gok: ${gambleOutcomeLabel(this.gambleRoll).replace(/^[^!]+!?\s*/, '').slice(0, 48)}`;
        }
        return base;
      })(),
      xp: this.sessionXP,
      mode: 'adventure', level: this.level.n, win, stars,
      tip: win ? (stars >= 3 ? 'Perfecte run — hou je HP hoog!' : `${starHintLine()} — pickups helpen`) : (() => {
        const prog = this.waveIdx >= 0 ? `${this.waveIdx + 1}/${this.level.waves.length} golven` : 'start';
        const base = this.player.hp <= 0
          ? `Tip: blokkeer · mik omhoog op vliegers · ${prog}`
          : `Tip: pak groene orbs · vul SUPER vóór baas · ${prog}`;
        const once = onceResultTip('adventure', 'loss',
          'Eerste nederlaag: vóór elk level kun je dobbelen — bondgenoot helpt tussen golven.');
        return once ? `${once} · ${base}` : base;
      })(),
    }), 1400);
  }

  onMonsterKilled(m) {
    this.kills++;
    this.freezeT = Math.max(this.freezeT, 0.045);
    this.shake(5, 0.18);
    haptic(12);
    const rar = rarityOf(m.sp.rarity);
    const killRingR = m.superBoss ? 18 : (m.elite ? 14 : (m.giant ? 12 : 9));
    spawnFxRing(this, m.x, m.y - m.size * 0.32, rar.color, killRingR);
    if (!fxLite() && m.elite && !motionReduced()) {
      this.burst(m.x, m.y - m.size * 0.2, '#fff', 4, { kind: 'spark', size: 2.2 });
    }
    const dropChance = m.elite ? 0.42 : 0.22;
    if (Math.random() < dropChance) this.spawnPickup(m.x, m.y - m.size * 0.5);
    bumpStat('kills', 1);
    bumpDaily('kills', 1);
    if (m.elite) {
      bumpStat('bossKills', 1);
      bumpDaily('bossKill', 1);
    }
    const lvlScale = 1 + (this.level ? (this.level.n - 1) * 0.1 : 0);
    const rarMul = 1 + rar.order * 0.15;
    const giantMul = m.giant ? GIANT_XP_MUL : 1;
    const xp = Math.round(m.sp.xp * lvlScale * rarMul * (m.elite ? 2 : 1) * giantMul);
    this.grantXP(xp);
    this.floater(m.x, m.y - m.size - 30, `+${xp} XP`, rar.color, 16);
    if (rar.order >= 3) this.floater(m.x, m.y - m.size - 50, rar.name.toUpperCase(), rar.color, 13);
    this.player.energy = clamp(this.player.energy + 12 + rar.order * 2, 0, 100);
    const tiersBefore = dexRarityTierCount();
    const countBefore = dexCount();
    if (!save.dex[m.spId]) {
      save.dex[m.spId] = 0;
      persist();
      AudioSys.sfx('newmonster');
      const hpB = rarityHpBonus(m.sp.rarity);
      this.banner(`Nieuw ${rar.name}: ${m.sp.name}! +${hpB} max HP`, 2.0, rar.color, 28);
      this.player.maxhp += hpB; this.player.hp += hpB;
      UI.toast(`${rar.name}: ${m.sp.name} ontdekt! +${hpB} HP`, 3200);
    }
    save.dex[m.spId]++;
    persist();
    checkAchievements();
    // Cosmetics die op dex-drempels unlocken (geen combat-wijziging)
    if (countBefore < dexCount()) {
      const half = Math.ceil(SPECIES_ORDER.length / 2);
      if (countBefore < half && dexCount() >= half) {
        UI.toast('Nieuwe stijl: Boekmeester!', 3500);
      }
      if (tiersBefore < 4 && dexRarityTierCount() >= 4) {
        UI.toast('Nieuwe stijl: Kristallijn!', 3500);
      }
    }
    this.maybeSummon(m);
  }

  /** Hele kleine kans: Summon ascendeert een lager wapen naar Episch/Legendarisch. */
  maybeSummon(m) {
    save.stats.killsSinceSummon = (save.stats.killsSinceSummon || 0) + 1;
    const eligible = summonEligibleWeapons();
    if (!eligible.length) { persist(); return; }
    if (!rollSummonChance(!!(m && m.elite))) { persist(); return; }
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    const wasEpic = summonTierOf(pick.id) === 'epic';
    const tier = (wasEpic || Math.random() < 0.15) ? 'legendary' : 'epic';
    if (!save.summons || typeof save.summons !== 'object') save.summons = {};
    save.summons[pick.id] = tier;
    save.stats.summonCount = (save.stats.summonCount || 0) + 1;
    save.stats.killsSinceSummon = 0;
    persist();
    const rar = rarityOf(tier);
    const asc = applySummonTier(weaponById(pick.id));
    if (this.player && this.player.weapon && this.player.weapon.id === pick.id) {
      this.player.weapon = playerWeapon();
      const st = playerStats();
      this.player.baseDmg = st.dmg;
    }
    AudioSys.sfx('summon');
    setTimeout(() => { try { AudioSys.sfx('bonus'); } catch (_) {} }, 280);
    this.freezeT = Math.max(this.freezeT, 0.1);
    this.shake(9, 0.35);
    const px = this.player ? this.player.x : W * 0.5;
    const py = this.player ? this.player.y : this.ground;
    this.burst(px, py - 70, rar.color, fxLite() ? 14 : 30);
    this.burst(px, py - 70, '#fff', fxLite() ? 6 : 12);
    this.banner('✦ SUMMON! ✦', 2.2, rar.color, 44);
    setTimeout(() => this.banner(`${pick.name} → ${rar.name}!`, 2.4, rar.color, 30), 1100);
    this.floater(px, py - 130, `${pick.name} ✦ ${rar.name}`, rar.color, 17);
    UI.toast(`✦ Summon! ${pick.name} is nu ${rar.name} — schade ×${asc.dmg}`, 4200);
  }

  spawnPickup(x, y) {
    const kind = choice(PICKUP_TYPES);
    this.pickups.push({ x, y, kind, t: rand(0, TAU), life: 16, bob: 0 });
  }

  collectPickup(pk) {
    if (pk._got) return;
    pk._got = true;
    const meta = PICKUP_META[pk.kind];
    const p = this.player;
    AudioSys.sfx('pickup');
    haptic(20);
    switch (pk.kind) {
      case 'heal':
        p.hp = Math.min(p.maxhp, p.hp + Math.round(p.maxhp * 0.28));
        this.floater(p.x, p.y - 100, '+HP', meta.color, 16);
        break;
      case 'rage':
        this.dmgBuffMul = 1.38;
        this.dmgBuffT = 9;
        this.floater(p.x, p.y - 100, 'RAGE ×1.4', meta.color, 16);
        break;
      case 'chakra':
        p.energy = 100;
        this.floater(p.x, p.y - 100, 'Vol chakra!', meta.color, 16);
        break;
      case 'shield':
        this.playerShieldT = 6.5;
        this.floater(p.x, p.y - 100, 'Schild!', meta.color, 16);
        break;
    }
    this.banner(meta.label, 0.9, meta.color, 28);
    this.burst(pk.x, pk.y, meta.color, 14);
    bumpStat('pickups', 1);
    bumpDaily('pickups', 1);
    pk.life = 0;
  }

  /* --------------------------- TRAINING ------------------------------- */
  initTraining() {
    this.theme = 'dojo';
    this.roundsP = 0; this.roundsR = 0;
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
    this.banner(`RONDE ${this.round}`, 1.1, '#ffd75e', 52);
    AudioSys.sfx('bell');
  }

  updateTrainingLasers(dt) {
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
    const diff = Math.min(1.5, this.robot.aiDiff || 1);
    this.trainLaserTelegraph = 0.95;
    this.trainLaserCd = rand(8, 12) / diff;
    this.floater(this.robot.x, this.robot.y - 148, 'Oor-laser — spring!', '#ff9a9a', 15);
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
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner('VECHT!', 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      if (this.trainTelegraphT > 0) this.trainTelegraphT -= dt;
      if (this.trainMeleeTelegraphT > 0) this.trainMeleeTelegraphT -= dt;
      this.updateTrainingLasers(dt);
      this.roundTimer -= dt;
      const pDead = !this.player.alive, rDead = !this.robot.alive;
      if (pDead || rDead || this.roundTimer <= 0) {
        let pWin;
        if (rDead && !pDead) pWin = true;
        else if (pDead && !rDead) pWin = false;
        else pWin = (this.player.hp / this.player.maxhp) >= (this.robot.hp / this.robot.maxhp);
        if (pWin) this.roundsP++; else this.roundsR++;
        this.phase = 'roundend'; this.phaseT = 0;
        this.inputLocked = true;
        this.banner(pWin ? 'RONDE GEWONNEN!' : 'RONDE VERLOREN', 1.6, pWin ? '#7cfc8a' : '#ff6b6b', 40);
        AudioSys.sfx(pWin ? 'win' : 'lose');
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseT > 2) {
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
    if (win) { save.trainWins++; persist(); xp = 70 + Math.min(save.trainWins, 12) * 20; this.grantXP(xp);
      bumpDaily('trainWin', 1);
      checkAchievements();
    }
    else { xp = 15; this.grantXP(xp); }
    const trainTip = win
      ? (save.trainWins === 3 ? 'Nieuwe stijl vrij: Chakra gloed — Instellingen → Stijl!' : 'Unlock stijlen door meer train-wins!')
      : onceResultTip('training', 'loss', 'Spring tijdens CHIDORI-telegraph — robot mist · duck oor-lasers')
        || 'Tip: duck lasers · chakra vol → Rasengan';
    setTimeout(() => UI.showResult(win, {
      title: win ? 'KAMPIOEN!' : 'ROBOT WINT...',
      detail: `RabbitRobot ${win ? 'verslagen' : 'was te sterk'} (${this.roundsP}-${this.roundsR}) · ${save.trainWins}x gewonnen`,
      xp: this.sessionXP, mode: 'training', win,
      tip: trainTip,
    }), 1200);
  }

  initVersus(opts) {
    opts = opts || {};
    Input.dualMode = true;
    Input.layout(W, H);
    this.theme = 'dojo';
    this.roundsP1 = 0;
    this.roundsP2 = 0;
    this.round = 0;
    this.vsRoundLog = [];
    this.p1Pick = normalizeVsPick(opts.p1 || vsSelect.p1, 'hero');
    this.p2Pick = normalizeVsPick(opts.p2 || vsSelect.p2, 'rabbit');
    vsSelect.p1 = this.p1Pick;
    vsSelect.p2 = this.p2Pick;
    trackVsRosterUse(this.p1Pick, this.p2Pick);
    applyVsArenaBounds(this);
    this.player = buildVsFighter(vsRosterEntry(this.p1Pick), vsSpawnX(1), 1);
    this.p2 = buildVsFighter(vsRosterEntry(this.p2Pick), vsSpawnX(2), 2);
    this.startVsRound();
    AudioSys.play('versus');
  }

  startVsRound() {
    this.round++;
    this.roundTimer = 99;
    const e1 = vsRosterEntry(this.p1Pick);
    const e2 = vsRosterEntry(this.p2Pick);
    resetVsFighterRound(this.player, e1, this.ground, 1);
    resetVsFighterRound(this.p2, e2, this.ground, 2);
    this.phase = 'intro';
    this.phaseT = 0;
    this.inputLocked = true;
    const mp = this.roundsP1 === 1 || this.roundsP2 === 1;
    const decisive = this.roundsP1 === 1 && this.roundsP2 === 1;
    let sub = decisive ? ' · beslissende ronde' : (mp ? ' · match point' : '');
    this.banner(`RONDE ${this.round}${sub}`, 1.1, decisive ? '#ff9a9a' : '#ffd75e', 52);
    AudioSys.sfx('bell');
  }

  updateVersus(dt) {
    this.phaseT += dt;
    if (this.phase === 'intro') {
      if (this.phaseT > 1.2 && this.phaseT - dt <= 1.2) this.banner('FIGHT!', 0.8, '#ff6b6b', 60);
      if (this.phaseT > 1.6) { this.phase = 'fight'; this.inputLocked = false; }
    } else if (this.phase === 'fight') {
      this.roundTimer -= dt;
      const p1d = !this.player.alive, p2d = !this.p2.alive;
      if (p1d || p2d || this.roundTimer <= 0) {
        let p1Win;
        const timedOut = !p1d && !p2d && this.roundTimer <= 0;
        if (p2d && !p1d) p1Win = true;
        else if (p1d && !p2d) p1Win = false;
        else p1Win = (this.player.hp / this.player.maxhp) >= (this.p2.hp / this.p2.maxhp);
        if (p1Win) this.roundsP1++; else this.roundsP2++;
        this.vsRoundLog = this.vsRoundLog || [];
        this.vsRoundLog.push(p1Win ? 'p1' : 'p2');
        this.phase = 'roundend';
        this.phaseT = 0;
        this.inputLocked = true;
        let msg = p1Win ? 'P1 WINT RONDE!' : 'P2 WINT RONDE!';
        if (timedOut) {
          const hp1 = Math.round(this.player.hp / this.player.maxhp * 100);
          const hp2 = Math.round(this.p2.hp / this.p2.maxhp * 100);
          msg = `TIME! ${hp1}% vs ${hp2}% · ${msg}`;
        }
        this.banner(msg, 1.5, p1Win ? '#7cf5ff' : '#ffb0b8', 38);
        AudioSys.sfx(p1Win ? 'win' : 'lose');
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseT > 2.2) {
        if (this.roundsP1 >= 2 || this.roundsP2 >= 2) this.finishVersus(this.roundsP1 >= 2);
        else this.startVsRound();
      }
    }
    this.p2.update(dt, this);
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
    setTimeout(() => UI.showResult(p1Win, {
      title: p1Win ? 'SPELER 1 WINT!' : 'SPELER 2 WINT!',
      detail: `${vsRosterEntry(this.p1Pick).name} vs ${vsRosterEntry(this.p2Pick).name} · ${this.roundsP1}-${this.roundsP2}` +
        ((this.vsRoundLog || []).length ? ` · ${this.vsRoundLog.map((w, i) => `R${i + 1} ${w === 'p1' ? 'P1' : 'P2'}`).join(' · ')}` : ''),
      xp: this.sessionXP, mode: 'versus', win: p1Win, p1: this.p1Pick, p2: this.p2Pick,
      tip: 'Opnieuw = rematch · Pauze → Herstart match (0-0)',
    }), 1200);
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
    };
    this.layoutWall(true);
    this.banner('SLOOP DE MUUR!', 1.5, '#ffd75e', 46);
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
    const prevTimer = this.wallTimer;
    this.wallTimer -= dt;
    const hints = this.wallHints || (this.wallHints = {});
    if (!hints.half && prevTimer > 30 && this.wallTimer <= 30) {
      hints.half = true;
      this.floater(W / 2, 108, 'Halve tijd — combo vasthouden!', '#7cf5ff', 15);
    }
    if (!hints.quarter && prevTimer > 15 && this.wallTimer <= 15) {
      hints.quarter = true;
      this.floater(W / 2, 108, 'Laatste 15s — record jagen!', '#ffd75e', 15);
      if (this.wallTimer < 10) AudioSys.sfx('bonus');
    }
    if (!hints.five && prevTimer > 5 && this.wallTimer <= 5) {
      hints.five = true;
      this.floater(W / 2, 108, '5s — vol gas!', '#ff6b6b', 15);
      AudioSys.sfx('bonus');
    }
    const elapsed = (this.wallDuration || 60) - this.wallTimer;
    if (!hints.startCombo && elapsed > 2.5 && elapsed < 9 && this.combo === 0) {
      hints.startCombo = true;
      this.floater(W / 2, 132, 'Tip: snelle opeenvolgende slagen vullen combo', '#7cf5ff', 14);
    }
    const prevComboT = this.comboT;
    this.comboT -= dt;
    if (this.comboT <= 0) {
      if (this.combo >= 4 && !hints.lostCombo) {
        hints.lostCombo = true;
        this.floater(W / 2, 120, 'Combo weg — snel weer raken!', '#ff9a9a', 14);
      }
      this.combo = 0;
    } else if (!hints.comboWarn && this.combo >= 3 && prevComboT > 0.35 && this.comboT <= 0.35) {
      hints.comboWarn = true;
      this.floater(W / 2, 120, 'Combo bijna weg!', '#ff9a9a', 13);
    }
    const bestSaved = save.bestWall || 0;
    if (!hints.nearRec && bestSaved > 0 && this.score > 0) {
      const gap = bestSaved - this.score;
      if (gap > 0 && gap <= 5) {
        hints.nearRec = true;
        this.floater(W / 2, 94, `Bijna record — nog ${gap}!`, '#7cfc8a', 16);
        haptic(12);
      }
    }
    if (this.bricks.every(b => b.hp <= 0)) {
      this.wallGen++;
      this.grantXP(25);
      this.banner('MUUR GESLOOPT! Nieuwe muur...', 1.4, '#7cfc8a', 34);
      AudioSys.sfx('win');
      this.layoutWall(true);
    }
    if (this.wallTimer <= 0 && !this.over) this.finishWall();
  }

  finishWall() {
    this.over = true; this.inputLocked = true;
    const best = Math.max(save.bestWall, this.score);
    const isRecord = this.score > save.bestWall;
    save.bestWall = best; persist();
    const xp = Math.round(this.score * 0.6);
    this.grantXP(xp);
    bumpDaily('wallBricks', this.score);
    checkAchievements();
    AudioSys.sfx(isRecord ? 'win' : 'bell');
    this.banner('TIJD!', 1.5, '#ffd75e', 56);
    const pace = Math.round(this.score); // 60s run → stenen ≈ per minuut
    const paceDelta = wallRecordPaceDelta({ wallTimer: 0, wallDuration: this.wallDuration, score: this.score });
    let tip = isRecord ? 'Nieuw record — share met een vriend!' : 'Tip: hou combo vast voor snellere sloop';
    if (!isRecord && best > 0) {
      const gap = best - this.score;
      if (gap > 0 && gap <= 15) tip = `Nog ${gap} stenen tot je record — combo helpt!`;
      else if ((this.maxCombo || 0) < 5) tip = 'Tip: snelle opeenvolgende slagen vullen de combo-balk';
      else if ((this.maxCombo || 0) >= 8) tip = `Sterke combo (×${this.maxCombo}) — volgende keer record?`;
      else if (paceDelta != null && paceDelta < -3) tip = `Achter record-tempo — probeer combo ×5+ voor meer sloop`;
      else if (paceDelta != null && paceDelta >= 3) tip = 'Goed tempo — volgende run kan record breken!';
    }
    setTimeout(() => UI.showResult(true, {
      title: isRecord ? 'NIEUW RECORD!' : 'TIJD IS OM!',
      detail: `${this.score} stenen (~${pace}/min) · record ${best} · max combo ×${this.maxCombo || 0}` +
        (paceDelta != null && best > 0 && !isRecord ? ` · tempo ${paceDelta >= 0 ? '+' : ''}${paceDelta} vs record` : ''),
      xp: this.sessionXP, mode: 'wall', win: true,
      tip,
    }), 1200);
  }

  /* ------------------------ MATS · MUNTJES BONUS ----------------------- */
  initCoinRun() {
    this.theme = 'cyber';
    this.coinTimer = 45;
    this.coinsCollected = 0;
    this.coinPickups = [];
    this.flyers = [];
    this.coinSpawnAcc = 0;
    this.flyerSpawnAcc = 0;
    this.player.weapon = applySummonTier(weaponById('shuriken'));
    this.player.x = W * 0.28;
    this.player.face = 1;
    this.inputLocked = false;
    this.banner('MATS · MUNTJES BONUS', 1.5, '#ffd75e', 46);
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
        this.floater(c.x, c.y - 20, '+1 munt', '#ffd75e', 15);
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
    persist();
    const xp = Math.round(n * 4 + 15);
    this.grantXP(xp);
    AudioSys.sfx(isRecord ? 'win' : 'bonus');
    this.banner('BONUS KLAAR!', 1.4, '#7cfc8a', 40);
    setTimeout(() => UI.showResult(true, {
      title: isRecord ? 'MATS RECORD!' : 'Goed gedaan, Mats!',
      detail: `${n} munten · record ${best} · vliegers = +3 per hit`,
      xp: this.sessionXP,
      mode: 'coinrun',
      win: true,
      tip: 'Joystick omhoog = hoger mikken (slag + gooi) · shuriken max 3× snel',
    }), 1200);
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
  grantXP(n) {
    this.sessionXP += n;
    save.xp += n;
    while (save.xp >= xpNeed(save.lvl)) {
      save.xp -= xpNeed(save.lvl);
      save.lvl++;
      AudioSys.sfx('levelup');
      this.banner(`LEVEL OMHOOG! Lv ${save.lvl}`, 1.8, '#ffd75e', 40);
      const st = playerStats();
      this.player.maxhp = st.maxhp;
      this.player.baseDmg = st.dmg;
      this.player.hp = Math.min(this.player.maxhp, this.player.hp + Math.round(this.player.maxhp * 0.45));
      const unlockedW = WEAPONS.find(w => w.unlock === save.lvl);
      if (unlockedW) {
        setTimeout(() => this.banner(`Nieuw wapen: ${unlockedW.name}!`, 2, '#c792ff', 32), 900);
        AudioSys.sfx('newmonster');
      }
      const newStyle = STYLES.find(s => s.needLvl === save.lvl && styleUnlocked(s));
      if (newStyle) UI.toast(`Nieuwe stijl: ${newStyle.name}!`, 3500);
    }
    persist();
  }

  spawnJutsu(f, atk) {
    const jutsu = (atk && atk.jutsu) || fighterJutsuKind(f);
    const dmg = atk ? atk.dmg : f.baseDmg * 2.8;
    const from = this.projFrom(f);
    const critMeta = projCritMeta(f);
    const aim = projAimVelocity(f, jutsu === 'chidori' ? 620 : jutsu === 'rinnegan' ? 340 : 420);
    const y0 = f.y - 50 + clamp(aim.ny, -1, 0.5) * 36;
    if (jutsu === 'chidori') {
      this.spawnProjectile(Object.assign({
        x: f.x + f.face * 36, y: y0,
        vx: aim.vx, vy: aim.vy * 0.85, r: 22, dmg, life: 0.35,
        from, kind: 'chidori', pierce: false, hitSet: new Set(),
      }, critMeta));
      f.vx = f.face * 380;
      this.shake(7, 0.2);
      AudioSys.sfx('chidori');
    } else if (jutsu === 'rinnegan') {
      this.spawnProjectile(Object.assign({
        x: f.x + f.face * 38, y: y0,
        vx: aim.vx, vy: aim.vy * 0.9, r: 30, dmg,
        from, kind: 'rinnegan', pierce: true, hitSet: new Set(), life: 1.05,
        spin: 0, pull: true,
      }, critMeta));
      this.burst(f.x + f.face * 28, y0, '#c47aff', 22);
      this.burst(f.x + f.face * 28, y0, '#ff6b9d', 10);
      this.shake(8, 0.24);
      this.freezeT = Math.max(this.freezeT, 0.05);
      AudioSys.sfx('rinnegan');
      if (f.isPlayer || f.playerSlot) haptic(20);
    } else {
      // Rasengan: zware draaiende chakra-bol
      this.spawnProjectile(Object.assign({
        x: f.x + f.face * 40, y: y0,
        vx: aim.vx, vy: aim.vy * 0.9, r: 26, dmg,
        from, kind: 'rasengan', pierce: true, hitSet: new Set(), life: 1.4,
        spin: 0,
      }, critMeta));
      this.burst(f.x + f.face * 30, y0, '#7cf5ff', fxLite() ? 8 : 16);
      spawnFxRing(this, f.x + f.face * 34, y0, '#7cf5ff', 10);
      this.shake(9, 0.28);
      this.freezeT = Math.max(this.freezeT, 0.06);
      AudioSys.sfx('rasengan');
      if (f.isPlayer || f.playerSlot) haptic(22);
    }
  }

  throwShuriken(f) {
    if (!canThrowShuriken(f, this)) {
      if (!this._shurikenWarnT || this.t - this._shurikenWarnT > 0.9) {
        this._shurikenWarnT = this.t;
        try {
          UI.toast(f._shurikenCd > 0 ? 'Werpwapen even wachten…' : 'Niet spammen — max 3 snel achter elkaar', 1600);
        } catch (_) {}
      }
      return;
    }
    noteShurikenThrow(f, this);
    AudioSys.sfx('shuriken');
    const w = f.weapon;
    const big = w.id === 'fuuma';
    const critMeta = projCritMeta(f);
    const aim = projAimVelocity(f, big ? 500 : 560);
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

  spawnProjectile(p) {
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
              this.floater(W * 0.5, 136, `Combo ×3 · sloop +${wallComboDmgPct(3)}%`, '#7cf5ff', 15);
            } else if (this.combo === 5 && !wh.combo5) {
              wh.combo5 = true;
              this.floater(W * 0.5, 136, `Combo ×5 · sloop +${wallComboDmgPct(5)}%`, '#7cf5ff', 16);
              AudioSys.sfx('combo');
            } else if (this.combo === 8 && !wh.combo8) {
              wh.combo8 = true;
              this.floater(W * 0.5, 136, `Combo ×8 · sloop +${wallComboDmgPct(8)}%`, '#ffd75e', 17);
              AudioSys.sfx('combo');
              haptic(14);
            }
            if (!this.wallRecordToast && this.score > save.bestWall) {
              this.wallRecordToast = true;
              this.floater(W * 0.5, 118, 'NIEUW RECORD!', '#ffd75e', 22);
              haptic(18);
              AudioSys.sfx('bonus');
            }
            this.burst(b.x + b.w / 2, b.y + b.h / 2, `hsl(${b.hue},50%,45%)`, 14);
            AudioSys.sfx(b.bonus ? 'explode' : 'brick');
            this.shake(b.bonus ? 6 : 3, b.bonus ? 0.16 : 0.12);
            this.floater(b.x + b.w / 2, b.y, this.combo > 1 ? `x${this.combo}!` : '+1', '#ffd75e', 16);
            if (b.bonus) {
              AudioSys.sfx('bonus');
              this.score += 5;
              this.burst(b.x + b.w / 2, b.y + b.h / 2, '#ffd75e', 22);
              this.floater(b.x + b.w / 2, b.y - 22, 'BONUS +5', '#7cf5ff', 18);
            }
          } else {
            AudioSys.sfx('crack');
          }
          if (hits >= 3) break;
        }
      }
      if (hits > 0) {
        try { AudioSys.sfx(weaponHitSfx(f.weapon, spec.dmg)); } catch (_) {}
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
            this.floater(f.x + f.face * 30, f.y - 120, `COMBO ×${this.combo}!`, '#ffd75e', 17);
          }
        }
        const buff = f.isPlayer ? (this.dmgBuffMul || 1) * (this.stageDmgMul || 1) : 1;
        const hitRoll = rollHitDamage(f, spec, comboMul * buff);
        if (hitRoll.crit) applyCritFx(this, m.x, m.y);
        const kbHit = scaleKnockback(f.face * spec.kb, hitRoll.dmg, { crit: hitRoll.crit, kind: spec.kind });
        m.takeDamage(hitRoll.dmg, kbHit, this, { crit: hitRoll.crit, kind: spec.kind });
        applyHitStop(this, spec, { crit: hitRoll.crit, combo: this.combo, heavy: hitRoll.dmg >= 18 });
        applyHitConfirmFx(this, hx, hy, spec);
        if (spec.dmg >= 18) this.shake(3, 0.11);
        if (spec.kind === 'weapon') bumpWeaponComboWindow(f, 0.12);
        if ((f.isPlayer || f.playerSlot) && spec.kind === 'weapon' && spec.moveIdx === 2 && !isThrowWeapon(f.weapon.id)) {
          const labels = weaponMoveLabels(f.weapon.id);
          if (labels) this.floater(f.x + f.face * 24, f.y - 128, labels[2], '#ffd75e', 13);
        }
        this.player.energy = clamp(this.player.energy + 8, 0, 100);
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
        const hitRoll = rollHitDamage(f, spec, 1);
        const kbHit = scaleKnockback(f.face * spec.kb, hitRoll.dmg, { crit: hitRoll.crit, kind: spec.kind });
        const counter = isCounterHitWindow(tgt);
        const dmg = tgt.takeDamage(hitRoll.dmg, kbHit, this, {
          unblockable: spec.unblockable, attacker: f, kind: spec.kind,
        });
        if (hitRoll.crit) applyCritFx(this, tgt.x, tgt.y);
        const col = tgt.playerSlot === 2 ? '#ffb0b8' : (tgt.isPlayer ? '#ff8080' : '#ffe680');
        this.floater(tgt.x, tgt.y - 115, (counter ? 'COUNTER! ' : '') + '-' + dmg, col, 16);
        this.burst(tgt.bodyX, tgt.bodyY, col, 7);
        applyHitConfirmFx(this, hx, hy, spec);
        f.energy = clamp(f.energy + 9, 0, 100);
        applyHitStop(this, spec, { crit: hitRoll.crit, combo: this.combo, heavy: hitRoll.dmg >= 18 });
        if (counter) this.freezeT = Math.max(this.freezeT, 0.014);
        if (spec.kind === 'weapon') bumpWeaponComboWindow(f, 0.1);
        this.shake(spec.dmg > 20 ? 4 : 3, 0.12);
        if ((f.isPlayer || f.playerSlot) && save.haptics !== false) haptic(5);
        hit = true;
      }
    }
    if (hit && this.mode !== 'wall') AudioSys.sfx(weaponHitSfx(f.weapon, spec.dmg));
    return hit;
  }

  update(dt) {
    if (this.freezeT > 0) { this.freezeT -= dt; return; }
    if (this.mode === 'adventure') this.updateKetsbam(dt);
    this.t += dt;
    if (this.hint > 0) this.hint -= dt;
    this.shakeT = Math.max(0, this.shakeT - dt);

    this.player.update(dt, this);

    if (this.mode === 'adventure') this.updateAdventure(dt);
    else if (this.mode === 'training') this.updateTraining(dt);
    else if (this.mode === 'versus') this.updateVersus(dt);
    else if (this.mode === 'wall') this.updateWall(dt);
    else if (this.mode === 'coinrun') this.updateCoinRun(dt);

    for (const m of this.monsters) m.update(dt, this);
    this.monsters = this.monsters.filter(m => m.alive || m.deadT < 1);

    // projectielen
    for (const p of this.projectiles) {
      p.life -= dt;
      p.spin = (p.spin || 0) + dt * (p.kind === 'rasengan' ? 22 : p.kind === 'rinnegan' ? 16 : p.kind === 'shuriken' ? 28 : 12);
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'rasengan') {
        p.r = Math.min(34, (p.r || 26) + dt * 4);
        // Capte chakra-trail — minder frequent bij Lite FX / lag
        if (!motionReduced()) {
          p._trailAcc = (p._trailAcc || 0) + dt;
          const interval = (save.liteFx || Perf.tier >= 1) ? 0.07 : 0.032;
          if (p._trailAcc >= interval) {
            p._trailAcc = 0;
            const n = (save.liteFx || Perf.tier >= 1) ? 1 : 2;
            const back = Math.sign(p.vx || 1) * 10;
            this.burst(p.x - back, p.y + rand(-4, 4), '#7cf5ff', n, { kind: 'spark', size: 2.4 });
          }
        }
      }
      if (p.kind === 'rinnegan') {
        p.r = Math.min(36, (p.r || 30) + dt * 2.5);
        if (!motionReduced() && !fxLite()) {
          p._trailAcc = (p._trailAcc || 0) + dt;
          if (p._trailAcc >= 0.055) {
            p._trailAcc = 0;
            this.burst(p.x, p.y, '#c47aff', 1, { kind: 'spark', size: 2.2 });
          }
        }
      }
      if (p.from === 'enemy') {
        const pl = this.player;
        if (pl && pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          const hit = resolveProjHit(p);
          pl.takeDamage(hit.dmg, Math.sign(p.vx) * 260, this);
          applyHitStop(this, { kind: p.kind === 'chidori' ? 'special' : 'punch', dmg: hit.dmg },
            { crit: hit.crit, heavy: hit.dmg >= 18, playerHurt: true });
          this.floater(pl.x, pl.y - 115, '-' + hit.dmg, '#ff8080', 16);
          if (hit.crit) applyCritFx(this, pl.x, pl.y);
          if (p.kind === 'chidori') this.burst(p.x, p.y, '#a8e0ff', 16);
          p.life = 0;
          this.burst(p.x, p.y, p.kind === 'chidori' ? '#a8e0ff' : '#ff9a3d', 8);
        }
      } else if (p.from === 'p2' && this.p2) {
        const pl = this.player;
        if (pl && pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          projStrikeFighter(this, p, pl, '#ff8080');
        }
      } else if (p.from === 'p1' && this.p2) {
        const pl = this.p2;
        if (pl.alive && (p.x - pl.bodyX) ** 2 + (p.y - pl.bodyY) ** 2 < (p.r + pl.bodyR * 0.8) ** 2) {
          projStrikeFighter(this, p, pl, '#ffb0b8');
        }
      } else {
        for (const m of this.monsters) {
          if (!m.alive || (p.hitSet && p.hitSet.has(m))) continue;
          if ((p.x - m.x) ** 2 + (p.y - m.y) ** 2 < (p.r + m.size) ** 2) {
            const hit = resolveProjHit(p);
            m.takeDamage(hit.dmg, Math.sign(p.vx) * 300, this);
            if (hit.crit) applyCritFx(this, m.x, m.y);
            if (p.kind === 'rasengan') {
              this.burst(p.x, p.y, '#7cf5ff', fxLite() ? 5 : 10);
              spawnFxRing(this, p.x, p.y, '#a8ecff', p.r * 0.55);
            }
            if (p.kind === 'rinnegan') this.burst(p.x, p.y, '#c47aff', 10);
            if (p.hitSet) p.hitSet.add(m); else p.life = 0;
          }
        }
        if (this.robot && this.robot.alive && !(p.hitSet && p.hitSet.has(this.robot))) {
          const rb = this.robot;
          if ((p.x - rb.bodyX) ** 2 + (p.y - rb.bodyY) ** 2 < (p.r + rb.bodyR) ** 2) {
            const hit = resolveProjHit(p);
            const d = rb.takeDamage(hit.dmg, Math.sign(p.vx) * 300, this);
            this.floater(rb.x, rb.y - 115, '-' + d, '#ffe680', 16);
            if (hit.crit) applyCritFx(this, rb.x, rb.y);
            if (p.hitSet) p.hitSet.add(rb); else p.life = 0;
          }
        }
        if (this.mode === 'wall' && this.bricks) {
          for (const b of this.bricks) {
            if (b.hp <= 0) continue;
            if (p.x + p.r > b.x && p.x - p.r < b.x + b.w && p.y + p.r > b.y && p.y - p.r < b.y + b.h) {
              b.hp -= p.dmg;
              if (b.hp <= 0) { this.score++; AudioSys.sfx('brick'); this.burst(p.x, p.y, `hsl(${b.hue},50%,45%)`, 12); }
              if (!p.pierce) p.life = 0;
            }
          }
        }
        if (this.mode === 'coinrun' && this.flyers && p.kind === 'shuriken' && p.from === 'player') {
          for (const fl of this.flyers) {
            if (fl.hp <= 0) continue;
            if ((p.x - fl.x) ** 2 + (p.y - fl.y) ** 2 < (p.r + fl.r) ** 2) {
              fl.hp = 0;
              this.coinsCollected += 3;
              this.floater(fl.x, fl.y - 24, '+3 munten', '#ffd75e', 17);
              this.burst(fl.x, fl.y, '#ffd75e', 12);
              AudioSys.sfx('bonus');
              haptic(12);
              p.life = 0;
              break;
            }
          }
        }
      }
      if (p.y > this.ground + 10 || p.x < -60 || p.x > W + 60) p.life = 0;
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
    for (const fl of this.floaters) { fl.life -= dt; fl.y -= 40 * dt; }
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
      const msg = this.combo === 8 ? 'MUUR-TEMPO!' : `COMBO ×${this.combo}!`;
      this.floater(W * 0.5, 130, msg, '#7cf5ff', 18);
    }
    if (this.mode === 'adventure' && (this.combo === 6 || this.combo === 10)) {
      AudioSys.sfx(comboSfx(this.combo));
      this.floater(W * 0.5, 118, `COMBO ×${this.combo}!`, '#ffd75e', 16);
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
  floater(x, y, txt, color, size) {
    if (!perfFxBudgetAllow(this, 1)) return;
    if (perfFxRoom(this, 'floater') <= 0) return;
    const cap = fxCaps();
    if (this.floaters.length >= cap.floaters) this.floaters.shift();
    this.floaters.push({ x, y, txt, color, size: size || 15, life: 1.0 });
  }
  banner(txt, dur, color, size) {
    if (!perfFxBudgetAllow(this, 1)) return;
    if (perfFxRoom(this, 'banner') <= 0) return;
    if (motionReduced()) {
      dur = Math.min(dur, 1.15);
      size = Math.min(size || 40, 32);
    }
    const cap = fxCaps();
    if (this.banners.length >= cap.banners) this.banners.shift();
    this.banners.push({ txt, dur, color: color || '#fff', size: size || 40, t: 0 });
  }

  /* ------------------------------ TEKENEN ----------------------------- */
  draw(c) {
    if (!c || W < 8 || H < 8) return;
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
      if (this.phase === 'intro') {
        const sx1 = vsSpawnX(1);
        const sx2 = vsSpawnX(2);
        c.setLineDash([4, 8]);
        c.strokeStyle = 'rgba(124,245,255,.35)';
        c.beginPath(); c.moveTo(sx1, this.ground - 72); c.lineTo(sx1, H); c.stroke();
        c.strokeStyle = 'rgba(255,176,184,.35)';
        c.beginPath(); c.moveTo(sx2, this.ground - 72); c.lineTo(sx2, H); c.stroke();
        c.setLineDash([]);
        c.font = '800 9px sans-serif';
        c.fillStyle = 'rgba(124,245,255,.65)';
        c.textAlign = 'center';
        c.fillText('P1 spawn', sx1, this.ground - 78);
        c.fillStyle = 'rgba(255,176,184,.65)';
        c.fillText('P2 spawn', sx2, this.ground - 78);
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
        const meta = PICKUP_META[pk.kind];
        const y = pk.y + (pk.bob || 0);
        c.save();
        const pkBlur = (save.liteFx || Perf.tier >= 1 || motionReduced()) ? 0 : 14;
        c.shadowColor = meta.color; c.shadowBlur = pkBlur;
        c.fillStyle = meta.color;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.arc(pk.x, y, 14, 0, TAU); c.stroke();
        drawPickupIcon(c, pk.kind, pk.x, y);
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
    this.player.draw(c);

    // projectielen
    for (const p of this.projectiles) {
      c.save();
      if (p.kind === 'rasengan') {
        if (!fxLite() && !motionReduced()) {
          c.save();
          c.globalAlpha = 0.28 + Math.sin((p.spin || 0) * 2.1) * 0.12;
          c.strokeStyle = '#7cf5ff';
          c.lineWidth = 2;
          c.beginPath();
          c.arc(p.x, p.y, p.r * (1.22 + Math.sin(p.spin * 1.4) * 0.06), 0, TAU);
          c.stroke();
          c.restore();
        }
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'rasengan', 1);
      } else if (p.kind === 'chidori') {
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'chidori', 1);
      } else if (p.kind === 'rinnegan') {
        drawJutsuOrb(c, p.x, p.y, p.r, p.spin || 0, 'rinnegan', 1);
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
        c.strokeStyle = pt.color;
        c.lineWidth = 2.2 * (1 - t * 0.45);
        c.globalAlpha = clamp(pt.life * 3.2, 0, 0.88);
        c.beginPath();
        c.arc(pt.x, pt.y, pt.size * (1 + t * 1.1), 0, TAU);
        c.stroke();
        continue;
      }
      c.fillStyle = pt.color;
      if (pt.kind === 'spark') {
        c.beginPath();
        c.arc(pt.x, pt.y, pt.size, 0, TAU);
        c.fill();
      } else {
        c.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
    }
    c.globalAlpha = 1;

    // zwevende tekstjes
    c.textAlign = 'center';
    for (const fl of this.floaters) {
      c.globalAlpha = clamp(fl.life * 1.6, 0, 1);
      c.font = `800 ${fl.size}px -apple-system, sans-serif`;
      c.fillStyle = fl.color;
      c.fillText(fl.txt, fl.x, fl.y);
    }
    c.globalAlpha = 1;
    c.restore();

    this.drawChakraReadyFx(c);

    this.drawHUD(c);
    if (this.mode === 'adventure') this.drawKetsbamPrompt(c);

    // banners
    for (const b of this.banners) {
      const k = b.t / b.dur;
      const calm = motionReduced();
      const pop = calm ? 1 : (k < 0.15 ? k / 0.15 : 1);
      const fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      c.save();
      c.globalAlpha = fade;
      c.translate(W / 2, H * 0.34);
      c.scale(calm ? 1 : (0.6 + pop * 0.4), calm ? 1 : (0.6 + pop * 0.4));
      if (!fxLite() && !calm) {
        c.shadowColor = b.color;
        c.shadowBlur = 14;
      }
      c.font = `900 ${b.size}px -apple-system, sans-serif`;
      c.textAlign = 'center';
      if (a11yHighContrast()) {
        fillHudText(c, b.txt, 0, 0, { fill: b.color, stroke: 'rgba(0,0,0,.9)', strokeW: 4 });
      } else {
        c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.55)';
        c.strokeText(b.txt, 0, 0);
        c.fillStyle = b.color;
        c.fillText(b.txt, 0, 0);
      }
      if (!fxLite() && !calm && fade > 0.35) {
        c.globalAlpha = fade * 0.42;
        c.strokeStyle = b.color;
        c.lineWidth = 2.5;
        c.lineCap = 'round';
        const tw = c.measureText(b.txt).width;
        c.beginPath();
        c.moveTo(-tw * 0.52, 10);
        c.lineTo(tw * 0.52, 10);
        c.stroke();
      }
      c.restore();
    }

    if (IS_TOUCH) this.drawTouchControls(c);

    if (this.hint > 0) {
      c.globalAlpha = clamp(this.hint, 0, 1);
      let hintTxt = this.modeHintLine;
      if (!hintTxt) {
        if (Input.dualMode && IS_TOUCH) {
          hintTxt = 'P1 = linker helft · P2 = rechter helft · joystick + aanvalsknoppen';
        } else if (Input.dualMode) {
          hintTxt = 'P1: A/D · W · J/K/L/U · Shift  |  P2: pijltjes · 1/2/3/4/5';
        } else if (IS_TOUCH) {
          hintTxt = 'Links: joystick om te lopen · Rechts: aanvalsknoppen';
        } else {
          hintTxt = 'A/D lopen · W springen · J stomp · K trap · L wapen · U speciaal';
        }
      }
      c.font = '600 15px -apple-system, sans-serif';
      c.textAlign = 'center';
      const tw = c.measureText(hintTxt).width;
      const padX = 16;
      const pillY = H * 0.2 - 24;
      c.fillStyle = 'rgba(6,10,24,.78)';
      this.rr(c, W / 2 - tw / 2 - padX, pillY, tw + padX * 2, 30, 10);
      c.fill();
      c.strokeStyle = 'rgba(255,215,94,.35)';
      c.lineWidth = a11yHighContrast() ? 2.5 : 1.5;
      this.rr(c, W / 2 - tw / 2 - padX, pillY, tw + padX * 2, 30, 10);
      c.stroke();
      fillHudText(c, hintTxt, W / 2, H * 0.2, {
        fill: '#fff',
        stroke: 'rgba(0,0,0,.85)',
        strokeW: a11yHighContrast() ? 3.5 : 0,
      });
      c.globalAlpha = 1;
    }
  }

  drawWall(c) {
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      const dmg = 1 - b.hp / b.maxhp;
      c.fillStyle = `hsl(${b.hue}, 42%, ${48 - dmg * 12}%)`;
      c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = 'rgba(255,255,255,.14)';
      c.fillRect(b.x, b.y, b.w, 4);
      c.fillStyle = 'rgba(0,0,0,.2)';
      c.fillRect(b.x, b.y + b.h - 4, b.w, 4);
      if (b.bonus) {
        drawStarShape(c, b.x + b.w / 2, b.y + b.h / 2, 7, '#ffd75e', true);
      }
      // barsten
      if (dmg > 0.25) {
        c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.5;
        const cx = b.x + (b.seed % b.w), cy = b.y + ((b.seed * 3) % b.h);
        const n = dmg > 0.65 ? 4 : 2;
        for (let i = 0; i < n; i++) {
          const a = (b.seed + i * 2.4) % TAU;
          c.beginPath(); c.moveTo(cx, cy);
          c.lineTo(cx + Math.cos(a) * b.w * 0.4, cy + Math.sin(a) * b.h * 0.5);
          c.stroke();
        }
      }
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
        for (let ring = 0; ring < 3; ring++) {
          c.beginPath();
          c.arc(f.x, f.y - 55, 34 + ring * 8 + Math.sin(this.t * 8 + ring) * 3, this.t * (1.5 + ring * 0.3), this.t * (1.5 + ring * 0.3) + Math.PI * 1.25);
          c.stroke();
        }
        c.fillStyle = '#ff6b9d';
        for (let i = 0; i < 3; i++) {
          const a = this.t * 5 + i * (TAU / 3);
          c.beginPath();
          c.arc(f.x + Math.cos(a) * 28, f.y - 55 + Math.sin(a) * 10, 4, 0, TAU);
          c.fill();
        }
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
    c.fillText('Volgende golf', W / 2, y - 14);
    for (let i = 0; i < chips; i++) {
      const def = next[i];
      const sp = SPECIES[def.sp];
      if (!sp) continue;
      const cx = x0 + i * gap;
      const flying = sp.type === 'fly' || sp.type === 'dragon';
      const col = def.superBoss ? '#ffd75e' : (def.elite ? '#ffb0b8' : (sp.c2 || '#8899bb'));
      c.fillStyle = col;
      c.globalAlpha = 0.75;
      c.beginPath();
      c.arc(cx, y + (flying ? -5 : 0), 6 + (def.elite ? 1.5 : 0), 0, TAU);
      c.fill();
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
  drawStageProgress(c) {
    if (!this.level || !this.level.waves) return;
    const total = this.level.waves.length;
    const tw = Math.min(320, W * 0.5);
    const x0 = W / 2 - tw / 2;
    const y = 44;
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
    c.fillText(`deel ${Math.min(3, 1 + Math.floor(pr * 3))}/3`, x0 + tw + (this.level.boss ? 24 : 10), y + 3.5);
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
    const waveNum = this.waveIdx >= 0 ? Math.min(total, cur + 1) : 0;
    c.fillText(waveNum > 0 ? `Golf ${waveNum}/${total}` : `${total} golven`, W / 2, pipY + 11);
    c.textAlign = 'center';
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
      return;
    }
    if (this.ketsbamCd > 0) this.ketsbamCd -= dt;
    if (this.ketsbamSuperT > 0) this.ketsbamSuperT -= dt;
    const near = this.countNearbyMonsters(KETSBAM_DETECT_R);
    const stuck = this.player.hurtT > 0 && near >= 3;
    const swarmed = near >= KETSBAM_NEAR_MIN;
    this.ketsbamShow = this.ketsbamCd <= 0 && !this.inputLocked && !this.traveling && (swarmed || stuck);
    if (this.ketsbamShow) this.ketsbamPulse = (this.ketsbamPulse || 0) + dt;
    else this.ketsbamPulse = 0;
  }

  tryKetsbam() {
    if (!this.ketsbamShow || !this.player?.alive || this.over) return false;
    return this.player.doKetsbam(this);
  }

  drawKetsbamPrompt(c) {
    if (!this.ketsbamShow || !this.player?.alive) return;
    const ui = touchUiScale(W, H);
    const { cx, cy } = ketsbamPromptCenter();
    const pulse = 0.9 + Math.sin((this.ketsbamPulse || 0) * 10) * 0.1;
    const r = 46 * ui * pulse;
    c.save();
    c.globalAlpha = 0.92;
    c.fillStyle = 'rgba(6,10,24,.72)';
    c.beginPath();
    c.arc(cx, cy, r + 10 * ui, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(255,215,94,.55)';
    c.lineWidth = 3 * ui;
    c.stroke();
    // ster/kets-symbool
    c.translate(cx, cy);
    c.rotate((this.ketsbamPulse || 0) * 2.2);
    c.fillStyle = '#ffd75e';
    c.strokeStyle = '#ff7043';
    c.lineWidth = 2.5 * ui;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2;
      const rr = i % 2 ? r * 0.42 : r * 0.88;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.stroke();
    c.rotate(-(this.ketsbamPulse || 0) * 2.2);
    c.font = `900 ${Math.round(17 * ui)}px -apple-system,sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = 5 * ui;
    c.strokeStyle = 'rgba(0,0,0,.55)';
    c.strokeText('KETS!', 0, 2);
    c.fillStyle = '#fff';
    c.fillText('KETS!', 0, 2);
    c.restore();
    c.font = `700 ${Math.round(12 * ui)}px -apple-system,sans-serif`;
    c.textAlign = 'center';
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillText(IS_TOUCH ? 'Tik!' : 'E / tik', cx, cy + r + 18 * ui);
    c.textAlign = 'left';
  }

  drawHUD(c) {
    if (this.mode === 'adventure') this.drawStageBeatFx(c);
    const p = this.player;
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
    if (this.mode !== 'versus') {
      c.fillStyle = 'rgba(0,0,0,.45)';
      this.rr(c, bx - 4, by - 4, bw + 8, 52, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, by, bw, 15, 6); c.fill();
      c.fillStyle = p.hp / p.maxhp > 0.35 ? '#6ee06e' : '#ff6b6b';
      this.rr(c, bx, by, bw * clamp(p.hp / p.maxhp, 0, 1), 15, 6); c.fill();
      if (this.mode === 'adventure' && masterBuffActive(this.level.n)) {
        c.fillStyle = 'rgba(196,122,255,.28)';
        this.rr(c, bx - 2, by - 16, bw + 4, 13, 5); c.fill();
        c.font = '800 9px -apple-system, sans-serif';
        c.fillStyle = '#c47aff';
        c.textAlign = 'left';
        c.fillText('MEESTER +20%', bx + 4, by - 7);
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
      c.fillText('SUPER', bx + 6, by + 29);
      // getekend jutsu-icoontje (art-upgrade 3/4): bliksem / oog / orb
      const ix = bx + 6 + c.measureText('SUPER').width + 9;
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
        c.fillText(jutsuHudLabel(jKind), bx + bw + 12, by + 32);
        c.strokeStyle = jKind === 'chidori' ? 'rgba(168,224,255,.55)' : jKind === 'rinnegan' ? 'rgba(196,122,255,.55)' : 'rgba(124,245,255,.55)';
        c.lineWidth = 2;
        c.beginPath();
        const joyR = motionReduced() ? 18 : 18 + Math.sin(this.t * 8) * 3;
        c.arc(bx + bw * 0.5, by + 25, joyR, 0, TAU);
        c.stroke();
      }
      const wFam = weaponMoveFamily(p.weapon.id);
      if (wFam) drawWeaponStylePips(c, bx + 10, by + 38, p);
    }

    c.textAlign = 'center';
    if (this.mode === 'adventure') {
      const isl = islandMeta(islandFromLevel(this.level.n));
      const wCap = adventureWeaponCapForLevel(this.level.n);
      const wv = Math.max(1, this.waveIdx + 1);
      c.font = '800 16px -apple-system, sans-serif';
      fillHudText(c, `Level ${this.level.n} — Golf ${Math.min(wv, this.level.waves.length)}/${this.level.waves.length}`, W / 2, 30, {
        fill: a11yHighContrast() ? '#fff' : 'rgba(255,255,255,.9)',
      });
      c.font = '700 11px -apple-system, sans-serif';
      c.fillStyle = isl.accent;
      c.globalAlpha = 0.92;
      c.fillText(`${isl.name} · wapen ≤ Lv ${wCap}`, W / 2, 48);
      c.globalAlpha = 1;
      this.drawStageProgress(c);
      const bossAlive = this.monsters.find(m => m.elite && m.alive);
      if (!bossAlive) {
        if (this.stageAlly) {
          c.font = '700 11px sans-serif';
          const col = this.stageAlly.color || '#7cf5ff';
          c.fillStyle = col;
          const txt = this.stageAlly.name;
          c.fillText(txt, W / 2 + 7, 62);
          drawMiniDie(c, W / 2 - c.measureText(txt).width / 2 - 3, 58.5, 10, col);
        } else if (this.gambleBossWave > 0) {
          c.font = '700 11px sans-serif';
          c.fillStyle = '#ffb0b8';
          const txt = `Super-baas mogelijk · golf ${this.gambleBossWave}`;
          c.fillText(txt, W / 2 + 7, 62);
          drawMiniDie(c, W / 2 - c.measureText(txt).width / 2 - 3, 58.5, 10, '#ffb0b8');
        }
      }
      if (p.alive) {
        const hpPct = p.hp / Math.max(1, p.maxhp);
        const proj = starsFromHpPct(hpPct);
        for (let i = 0; i < 3; i++) {
          drawStarShape(c, W - 52 + i * 19, 26, 8, '#ffd75e', i < proj);
        }
        c.textAlign = 'center';
        c.font = '700 11px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        const pct = Math.round(hpPct * 100);
        let starHint = ' · 3★ zone';
        if (hpPct <= STAR_HP.two) starHint = ` · 2★ bij >${Math.round(STAR_HP.two * 100)}% HP`;
        else if (hpPct <= STAR_HP.three) starHint = ` · 3★ bij >${Math.round(STAR_HP.three * 100)}% HP`;
        c.fillText(`${pct}% HP${starHint}`, W / 2, 76);
      }
      if (this.waveIdx >= 0 && (this.spawnQueue.length > 0 || this.monsters.some((m) => m.alive))) {
        const rem = this.spawnQueue.length + this.monsters.filter((m) => m.alive).length;
        c.font = '700 11px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.62)';
        c.fillText(rem === 1 ? 'Nog 1 vijand in deze golf' : `Nog ${rem} vijanden in deze golf`, W / 2, 90);
      }
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
        const pauseMsg = nextBoss ? `Op weg naar de baas — ${sec.toFixed(1)}s` : `Verder lopen… volgende golf ${sec.toFixed(1)}s`;
        fillHudText(c, pauseMsg, ringX, ringY, {
          fill: nextBoss ? '#ffc8d0' : '#d8e8ff',
        });
        this.drawNextWavePreview(c);
      }
      const boss = bossAlive;
      if (boss) {
        const bwid = Math.min(420, W * 0.5);
        c.fillStyle = 'rgba(0,0,0,.5)'; this.rr(c, W / 2 - bwid / 2 - 3, 57, bwid + 6, 16, 8); c.fill();
        c.fillStyle = '#e04f5f'; this.rr(c, W / 2 - bwid / 2, 60, bwid * boss.hp / boss.maxhp, 10, 5); c.fill();
        c.font = '700 12px sans-serif';
        fillHudText(c, boss.sp.name.toUpperCase(), W / 2, 106, { fill: '#ffc8d0' });
      }
      if (save.comboHud !== false && this.combo > 1) {
        const calm = motionReduced();
        const pulse = calm ? 1 : (1 + Math.sin(this.t * 10) * 0.08);
        const col = this.combo >= 8 ? '#ff7a4d' : '#ffd75e';
        c.save();
        c.translate(W / 2, 92);
        c.scale(pulse, pulse);
        if (!fxLite() && !calm) {
          c.globalAlpha = 0.35 + Math.sin(this.t * 12) * 0.1;
          c.strokeStyle = col;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, -4, 30 + Math.min(12, this.combo) + Math.sin(this.t * 14) * 3, 0, TAU);
          c.stroke();
          c.globalAlpha = 1;
        }
        c.font = '900 20px sans-serif';
        c.fillStyle = col;
        if (!calm) {
          c.shadowColor = col;
          c.shadowBlur = 12;
        }
        fillHudText(c, `COMBO ×${this.combo}`, 0, 0, { fill: col, strokeW: calm ? 4 : 3.5 });
        c.restore();
      }
      if (this.dmgBuffT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#ff7a4d';
        c.fillText(`RAGE ${Math.ceil(this.dmgBuffT)}s`, W / 2, 108);
      }
      if (this.playerShieldT > 0) {
        c.font = '800 13px sans-serif'; c.fillStyle = '#9fd8ff';
        c.fillText(`Schild ${Math.ceil(this.playerShieldT)}s`, W / 2, this.dmgBuffT > 0 ? 124 : 108);
      }
      if (this.masterSwordT > 0) {
        c.font = '900 14px sans-serif'; c.fillStyle = '#7cf5ff';
        if (!motionReduced()) { c.shadowColor = '#7cf5ff'; c.shadowBlur = 8; }
        const yMs = 108 + (this.dmgBuffT > 0 ? 16 : 0) + (this.playerShieldT > 0 ? 16 : 0);
        c.fillText(`MASTER SWORD ${Math.ceil(this.masterSwordT)}s`, W / 2, yMs);
        c.shadowBlur = 0;
      }
    } else if (this.mode === 'training') {
      const r = this.robot;
      const half = Math.min(300, W * 0.36);
      const tele = this.trainLaserTelegraph > 0
        ? { label: 'OOR-LASER — spring!', frac: this.trainLaserTelegraph / 0.95, color: '#ff6b6b', max: 0.95 }
        : (this.trainTelegraphT > 0
          ? { label: 'CHIDORI — dash/spring!', frac: this.trainTelegraphT / 0.85, color: '#7cf5ff', max: 0.85 }
          : (this.trainMeleeTelegraphT > 0
            ? {
              label: this.trainTelegraphKind === 'kick' ? 'TRAP — spring/blok!' : 'SLA — blok/weg!',
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
        c.fillStyle = tele.color;
        c.fillText(tele.label, W / 2, 102);
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
        c.fillStyle = '#ffb0b8';
        c.fillText('OOR-LASER', W / 2, ly - 10);
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
      c.fillText(`RABBITROBOT · ${rPct}%`, W - 20, by + 30);
      // timer + rondepunten
      c.textAlign = 'center';
      c.font = '800 12px sans-serif';
      c.fillStyle = 'rgba(255,255,255,.65)';
      c.fillText(`Ronde ${this.round} · eerst 2 wint · ${this.roundsP}-${this.roundsR}`, W / 2, 68);
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
      for (let i = 0; i < 2; i++) {
        c.fillStyle = i < this.roundsP ? '#7cfc8a' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(W / 2 - 34 - i * 18, 82, 6, 0, TAU); c.fill();
        c.fillStyle = i < this.roundsR ? '#ff6b6b' : 'rgba(255,255,255,.25)';
        c.beginPath(); c.arc(W / 2 + 34 + i * 18, 82, 6, 0, TAU); c.fill();
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
      c.fillText('TIJD', barX, 44);
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
        c.fillText(`MUUR ×${this.wallGen + 1}`, 16, 36);
        c.textAlign = 'center';
      }
      c.font = '800 17px sans-serif'; c.fillStyle = '#ffd75e';
      c.fillText(`Stenen: ${this.score}`, W / 2, 68);
      c.font = '700 13px sans-serif';
      const bestSaved = save.bestWall || 0;
      const rec = Math.max(bestSaved, this.score);
      const onPace = this.score > bestSaved;
      c.fillStyle = onPace ? '#7cfc8a' : 'rgba(255,255,255,.55)';
      if (bestSaved > 0 && this.score < bestSaved) {
        const gap = bestSaved - this.score;
        c.fillText(`Record ${bestSaved} · nog ${gap} te gaan`, W / 2, 86);
      } else {
        c.fillText(onPace && bestSaved > 0 ? `Record gebroken · ${rec}` : `Record: ${rec}`, W / 2, 86);
      }
      let showPaceDelta = false;
      const elapsed = wallDur - this.wallTimer;
      if (elapsed > 2 && this.score > 0) {
        const pace = Math.round((this.score / elapsed) * 60);
        const proj = Math.round(this.score + (this.wallTimer / elapsed) * this.score);
        c.font = '700 12px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.62)';
        c.fillText(`~${pace}/min · projectie ~${proj}`, W / 2, 102);
        const paceDelta = wallRecordPaceDelta(this);
        if (paceDelta != null && bestSaved > 0) {
          showPaceDelta = true;
          c.font = '700 11px sans-serif';
          c.fillStyle = paceDelta >= 0 ? '#7cfc8a' : '#ffb0b8';
          c.fillText(
            paceDelta >= 0 ? `Voor op record-tempo +${paceDelta}` : `Achter record-tempo ${paceDelta}`,
            W / 2, 116
          );
        }
      }
      const comboWin = this.wallComboWindow || 1.4;
      if (this.combo > 0 && this.comboT > 0) {
        const cFrac = clamp(this.comboT / comboWin, 0, 1);
        const cBarW = Math.min(160, W * 0.42);
        const cBarX = (W - cBarW) / 2;
        const cy = showPaceDelta ? (this.combo > 1 ? 162 : 146) : (this.combo > 1 ? 148 : 132);
        c.font = '700 9px sans-serif';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(124,245,255,.55)';
        c.fillText('COMBO', cBarX, cy - 4);
        c.textAlign = 'center';
        c.fillStyle = 'rgba(0,0,0,.38)';
        this.rr(c, cBarX, cy, cBarW, 5, 3); c.fill();
        c.fillStyle = cFrac < 0.25 ? '#ff9a9a' : '#7cf5ff';
        this.rr(c, cBarX, cy, Math.max(3, cBarW * cFrac), 5, 3); c.fill();
      }
      if (this.combo > 1) {
        const pulse = motionReduced() ? 1 : (1 + Math.sin(this.t * 10) * 0.1);
        c.save();
        c.translate(W / 2, showPaceDelta ? 142 : 128);
        c.scale(pulse, pulse);
        c.font = '900 22px sans-serif'; c.fillStyle = '#7cf5ff';
        c.fillText(`COMBO ×${this.combo}`, 0, 0);
        c.font = '700 12px sans-serif'; c.fillStyle = 'rgba(124,245,255,.85)';
        c.fillText(`+${Math.min(this.combo, 12) * 4}% sloop`, 0, 18);
        c.restore();
      } else if (this.combo === 1 && this.comboT > 0) {
        c.font = '700 12px sans-serif';
        c.fillStyle = 'rgba(124,245,255,.75)';
        c.fillText('Combo actief — nog een steen!', W / 2, showPaceDelta ? 132 : 118);
      }
    } else if (this.mode === 'coinrun') {
      const tLeft = Math.ceil(Math.max(0, this.coinTimer));
      c.font = '900 30px sans-serif';
      c.fillStyle = this.coinTimer < 10 ? '#ff6b6b' : '#fff';
      c.fillText(String(tLeft), W / 2, 42);
      c.font = '800 18px sans-serif'; c.fillStyle = '#ffd75e';
      c.fillText(`Munten: ${this.coinsCollected}`, W / 2, 70);
      c.font = '700 13px sans-serif'; c.fillStyle = 'rgba(255,255,255,.7)';
      c.fillText(`Record Mats: ${save.stats.matsCoinBest || 0}`, W / 2, 90);
      c.fillStyle = 'rgba(124,245,255,.85)';
      c.fillText('Joystick ↑ mik · slag/gooi hoger · shuriken op roze vliegers', W / 2, 112);
    } else if (this.mode === 'versus' && this.p2) {
      const p2 = this.p2;
      const half = Math.min(260, W * 0.38);
      const safeTop = hudInsetTop();
      const byVs = Math.max(by, safeTop + 42);
      const name1 = vsRosterEntry(this.p1Pick).name;
      const name2 = vsRosterEntry(this.p2Pick).name;
      if (this.phase === 'intro' && this.phaseT < 1.55) {
        const n = Math.ceil(Math.max(0.35, 1.55 - this.phaseT));
        c.font = '900 48px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.92)';
        c.fillText(String(n), W / 2, H * 0.4);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.65)';
        c.fillText('Spawn · eerlijk start', W / 2, H * 0.4 + 28);
      } else if (this.phase === 'roundend') {
        const left = Math.max(0, 2.2 - this.phaseT);
        c.font = '900 34px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.fillText(String(Math.ceil(left)), W / 2, H * 0.38);
        c.font = '700 13px sans-serif';
        c.fillStyle = 'rgba(255,255,255,.7)';
        c.fillText('Volgende ronde', W / 2, H * 0.38 + 26);
        const barW = Math.min(140, W * 0.24);
        c.fillStyle = 'rgba(0,0,0,.35)';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW, 5, 3);
        c.fill();
        c.fillStyle = '#7cf5ff';
        this.rr(c, W / 2 - barW / 2, H * 0.38 + 34, barW * clamp(left / 2.2, 0, 1), 5, 3);
        c.fill();
      }
      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, bx - 4, byVs - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, bx, byVs, half, 14, 6); c.fill();
      c.fillStyle = p.hp / p.maxhp > 0.35 ? '#6ee06e' : '#ff6b6b';
      this.rr(c, bx, byVs, half * clamp(p.hp / p.maxhp, 0, 1), 14, 6); c.fill();
      c.font = '800 11px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#7cf5ff';
      const hp1Pct = Math.round(clamp(p.hp / p.maxhp, 0, 1) * 100);
      c.fillText(`P1 · ${name1} · ${hp1Pct}%`, bx, byVs + 30);
      c.fillStyle = '#333c55'; this.rr(c, bx, byVs + 34, half, 5, 3); c.fill();
      this.drawSuperMeterFill(c, bx, byVs + 34, half, 5, p.energy / 100, fighterJutsuKind(p), this.t);
      drawWeaponStylePips(c, bx + 8, byVs + 44, p);

      c.fillStyle = 'rgba(0,0,0,.45)'; this.rr(c, W - half - 20, byVs - 4, half + 8, 44, 10); c.fill();
      c.fillStyle = '#333c55'; this.rr(c, W - half - 16, byVs, half, 14, 6); c.fill();
      c.fillStyle = '#ff8080';
      const frac2 = clamp(p2.hp / p2.maxhp, 0, 1);
      this.rr(c, W - 16 - half * frac2, byVs, half * frac2, 14, 6); c.fill();
      c.textAlign = 'right'; c.fillStyle = '#ffb0b8';
      const hp2Pct = Math.round(frac2 * 100);
      c.fillText(`${hp2Pct}% · ${name2} · P2`, W - 20, byVs + 30);
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
        ? `Beslissende ronde · ${this.roundsP1}-${this.roundsP2}`
        : `Ronde ${this.round} · eerst 2 wint · ${this.roundsP1}-${this.roundsP2}`;
      c.fillText(scoreLine, W / 2, timerY + 18);
      const timerBarW = Math.min(160, W * 0.28);
      const timerFrac = clamp(this.roundTimer / 99, 0, 1);
      c.fillStyle = 'rgba(0,0,0,.35)';
      this.rr(c, W / 2 - timerBarW / 2, timerY + 24, timerBarW, 5, 3);
      c.fill();
      c.fillStyle = urgent ? '#ff6b6b' : '#7cf5ff';
      this.rr(c, W / 2 - timerBarW / 2, timerY + 24, timerBarW * timerFrac, 5, 3);
      c.fill();
      if (this.roundTimer < 12 && this.phase === 'fight') {
        c.font = '700 10px sans-serif';
        c.fillStyle = 'rgba(255,215,94,.85)';
        c.fillText('TIME = hoogste HP % wint', W / 2, timerY + 38);
      }
      const mp1 = this.roundsP1 === 1 && this.roundsP2 < 2;
      const mp2 = this.roundsP2 === 1 && this.roundsP1 < 2;
      const dotY = (this.roundTimer < 12 && this.phase === 'fight') ? timerY + 48 : timerY + 34;
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
        c.fillText(`${p.invulnT.toFixed(1)}s`, bx, byVs + 52);
      }
      if (p2.invulnT > 0.05) {
        c.font = '700 9px sans-serif'; c.fillStyle = 'rgba(255,176,184,.75)'; c.textAlign = 'right';
        c.fillText(`${p2.invulnT.toFixed(1)}s`, W - 20, byVs + 52);
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
    c.beginPath(); c.arc(b.x, b.y, ring, 0, TAU); c.stroke();
    if (pct > 0.02) {
      c.globalAlpha = kind === 'chidori' ? 0.75 + Math.sin(this.t * 18) * 0.12 : 0.82;
      c.strokeStyle = kind === 'chidori' ? '#7ec8ff' : kind === 'rinnegan' ? '#b06ae0' : accent || '#3db8ff';
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(b.x, b.y, ring, -Math.PI / 2, -Math.PI / 2 + TAU * pct);
      c.stroke();
    }
    if (pct >= 1) {
      c.globalAlpha = 0.9;
      c.strokeStyle = kind === 'chidori' ? '#a8e0ff' : kind === 'rinnegan' ? '#c47aff' : '#7cf5ff';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(b.x, b.y, ring + 5 + Math.sin(this.t * 8) * 2, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  drawTouchControls(c) {
    const ui = touchUiScale(W, H);
    const joyOuter = Math.round(52 * ui);
    const joyInner = Math.round(26 * ui);
    if (Input.dualMode) {
      this.drawPad(c, Input, this.player, 'P1', '#7cf5ff');
      this.drawPad(c, InputP2, this.p2 || this.player, 'P2', '#ffb0b8');
      return;
    }
    c.save();
    const j = Input.joy;
    const jx = j.active ? j.ox : (Input.joyHome?.x || 110), jy = j.active ? j.oy : (Input.joyHome?.y || H - 110);
    c.globalAlpha = j.active ? 0.5 : 0.22;
    c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.arc(jx, jy, joyOuter, 0, TAU); c.stroke();
    drawJoyAimGuide(c, jx, jy, j, ui, '#7cf5ff');
    c.globalAlpha = j.active ? 0.65 : 0.3;
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(jx + (j.active ? j.dx : 0), jy + (j.active ? j.dy : 0), joyInner, 0, TAU); c.fill();
    if (this.player) {
      drawPlayerAimIndicator(c, this.player, j.active ? 0.62 : 0.28);
    }
    // knoppen
    for (const b of Input.buttons) {
      if (b.id === 'special') this.drawSpecialBtnMeter(c, b, this.player, '#3db8ff');
      c.globalAlpha = b.held ? 0.85 : 0.45;
      c.fillStyle = b.color;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      c.globalAlpha = b.held ? 1 : 0.85;
      const jk = b.id === 'special' ? fighterJutsuKind(this.player) : null;
      if (!drawTouchBtnIcon(c, b.id, b.x, b.y, b.r, jk)) {
        c.font = `${b.r * 0.85}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(b.label, b.x, b.y + 2);
      }
      if (b.id === 'subst' && this.player.substCd > 0) {
        c.globalAlpha = 0.35;
        c.fillStyle = '#000';
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      }
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
    c.globalAlpha = 0.35;
    c.strokeStyle = accent;
    c.lineWidth = 3;
    c.beginPath(); c.arc(jx, jy, joyOuter, 0, TAU); c.stroke();
    drawJoyAimGuide(c, jx, jy, j, ui, accent);
    c.globalAlpha = j.active ? 0.55 : 0.25;
    c.fillStyle = accent;
    c.beginPath(); c.arc(jx + (j.active ? j.dx : 0), jy + (j.active ? j.dy : 0), joyInner, 0, TAU); c.fill();
    if (fighter) drawPlayerAimIndicator(c, fighter, j.active ? 0.55 : 0.24);
    c.font = '900 11px sans-serif'; c.fillStyle = accent; c.textAlign = 'center';
    c.fillText(label, jx, jy - 58);
    for (const b of pad.buttons) {
      if (b.id === 'special') this.drawSpecialBtnMeter(c, b, fighter, accent);
      c.globalAlpha = b.held ? 0.85 : 0.42;
      c.fillStyle = b.color;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
      c.globalAlpha = 0.9;
      const jk2 = b.id === 'special' && fighter ? fighterJutsuKind(fighter) : (b.id === 'special' ? 'rasengan' : null);
      if (!drawTouchBtnIcon(c, b.id, b.x, b.y, b.r, jk2)) {
        c.font = `${b.r * 0.8}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(b.label, b.x, b.y + 2);
      }
    }
    c.textBaseline = 'alphabetic';
    c.restore();
  }
}

