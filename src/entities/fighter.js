/* ============================== VECHTER ================================ */
class Fighter {
  constructor(opts) {
    Object.assign(this, {
      x: 0, y: 0, vx: 0, vy: 0, face: 1, onGround: true,
      color: '#f2f5ff', lineW: 4.5, scale: 1,
      hp: 100, maxhp: 100, energy: 0, baseDmg: 10,
      state: 'idle', animT: 0, attack: null, hurtT: 0, deadT: 0,
      blocking: false, blockT: 0, isPlayer: false, isRobot: false,
      weapon: weaponById('vuist'), speed: 260, jumpV: 620,
      ai: null, aiTimer: 0, aiMove: 0, aiCd: 2,
      name: 'Stickman',
      substCd: 0, invulnT: 0, hitFlashT: 0, afterimages: [], dashCd: 0,
      weaponComboIdx: 0, weaponComboT: 0, _lastWeaponKind: null, _weaponComboPrimed: false, _weaponComboHits: 0,
      style: null, playerSlot: 0, vsSpecial: 'rasengan',
    }, opts);
  }

  get bodyX() { return this.x; }
  get bodyY() { return this.y - 45 * this.scale; }
  get bodyR() { return 30 * this.scale; }
  get alive() { return this.hp > 0; }

  attackSpec(kind) {
    const w = this.weapon;
    let spec;
    switch (kind) {
      case 'punch':
        spec = { kind, windup: 0.07, active: 0.09, recover: 0.12, range: 48, r: 30, dmg: this.baseDmg * 0.7, kb: 160 };
        break;
      case 'kick':
        spec = { kind, windup: 0.11, active: 0.11, recover: 0.2,  range: 58, r: 32, dmg: this.baseDmg * 1.1, kb: 340 };
        break;
      case 'weapon': {
        const wid = (w && w.id) || 'vuist';
        const moveIdx = clamp(((this.weaponComboIdx || 0) % 3 + 3) % 3, 0, 2);
        const move = weaponMoveDef(wid, moveIdx);
        spec = {
          kind, windup: 0.13 / (w.speed || 1), active: 0.1 / (w.speed || 1), recover: 0.2 / (w.speed || 1),
          range: (w.range || 40) + 18, r: 30 + (w.range || 40) * 0.26, dmg: this.baseDmg * (w.dmg || 1), kb: 260,
          moveIdx, move,
        };
        if (move) {
          spec.windup *= move.windupMul || 1;
          spec.active *= move.activeMul || 1;
          spec.range *= move.rangeMul || 1;
          spec.r *= move.rangeMul || 1;
          spec.dmg *= move.dmgMul || 1;
          spec.kb *= move.kbMul || 1;
          spec.moveHitY = move.hitY || 0;
          const stepMul = weaponComboStepMul(moveIdx);
          spec.dmg *= stepMul;
          spec.kb *= stepMul;
        }
        break;
      }
      case 'special': {
        const sk = fighterEquippedSkill(this);
        spec = {
          kind, windup: sk.windup || 0.48, active: 0.12, recover: sk.recover || 0.28,
          range: 62, r: sk.radius || 44,
          dmg: this.baseDmg * (sk.dmgMul || 2.8), kb: sk.kb || 520, jutsu: sk.id,
        };
        break;
      }
      default:
        return null;
    }
    if (spec && spec.kind === 'weapon') spec = sanitizeWeaponSpec(spec);
    if (spec && spec.kind === 'weapon' && (w.masterSword || w.id === 'master_sword')) spec.unblockable = true;
    spec = applySignatureToSpec(this, spec);
    return applyStyleToSpec(this, spec);
  }

  startAttack(kind, game) {
    if (this.attack || this.state === 'hurt' || !this.alive || this.invulnT > 0 && kind !== 'special') return;
    if (kind === 'special') {
      const jKind = fighterJutsuKind(this);
      const chakraCost = skillChakraCost(jKind);
      if (this.energy < chakraCost) {
        if (this.isPlayer) game.floater(this.x, this.y - 110, 'Chakra niet vol!', '#7cf5ff', 13);
        return;
      }
      this.energy = 0;
      const sk = fighterEquippedSkill(this);
      AudioSys.sfx(skillSfxId(sk));
      if (this.isPlayer || this.playerSlot) {
        game.banner(skillBanner(sk), 0.7, skillHudColor(sk), 40);
      }
    } else {
      AudioSys.sfx(weaponSwingSfx(this.weapon, kind));
    }
    if (kind === 'weapon' && !isThrowWeapon(this.weapon.id)) {
      if (this.isPlayer || this.playerSlot) weaponComboTipOnce(game);
      const sameWep = this._lastWeaponKind === this.weapon.id;
      if (this._weaponComboPrimed && this.weaponComboT > 0 && sameWep) {
        this.weaponComboIdx = (this.weaponComboIdx + 1) % 3;
      } else {
        this.weaponComboIdx = 0;
      }
      this._weaponComboPrimed = false;
      this.weaponComboT = WEAPON_COMBO_WINDOW;
      this._lastWeaponKind = this.weapon.id;
    } else if (kind !== 'weapon') {
      resetWeaponCombo(this);
    }
    this.attack = Object.assign({ t: 0, hasHit: false, fired: false }, this.attackSpec(kind));
    if (this.attack && this.attack.kind === 'weapon' && this.attack.move) {
      this.attack.moveIdx = this.weaponComboIdx;
    }
    this._aimAtAttack = fighterAimNorm(this);
    if (this.isRobot && kind === 'special') this.attack.windup = 0.58;
    this.blocking = false;
  }

  doSubstitution(game) {
    if (!this.alive || this.substCd > 0 || this.attack || this.invulnT > 0) return;
    const sb = skillBonuses('subst');
    resetWeaponCombo(this);
    this.substCd = 1.35 * sb.cdMul;
    this.invulnT = 0.28 + (sb.invulnAdd || 0);
    AudioSys.sfx('subst');
    // rookwolk + afterimage (substitutie / Kawarimi)
    game.burst(this.x, this.y - 40, '#c9a66b', 16);
    game.burst(this.x, this.y - 50, '#eee', 8);
    this.afterimages.push({ x: this.x, y: this.y, face: this.face, life: 0.35 });
    const dir = this.face || 1;
    const pad = this.playerSlot === 2 ? InputP2 : Input;
    const dashDir = Math.abs(pad.move) > 0.2 ? Math.sign(pad.move) : dir;
    const dist = 140 * (sb.dashDistMul || 1);
    this.x = clampFighterX(this, game, this.x + dashDir * dist);
    this.vx = dashDir * 420 * (sb.dashDistMul || 1);
    game.floater(this.x, this.y - 100, 'Substitutie!', '#c9a66b', 14);
    game.shake(2, 0.08);
  }

  doDash(game, dir) {
    if (!this.alive || this.dashCd > 0 || Math.abs(dir) < 0.1) return;
    if (this.attack && this.hurtT <= 0) return;
    if (this.hurtT > 0) this.hurtT = 0;
    const db = skillBonuses('dash');
    resetWeaponCombo(this);
    this.dashCd = 0.85 * db.cdMul;
    this.invulnT = Math.max(this.invulnT, 0.14);
    AudioSys.sfx('dash');
    const dist = 98 * (db.dashDistMul || 1);
    this.x = clampFighterX(this, game, this.x + dir * dist);
    this.vx = dir * 340 * (db.dashSpeedMul || 1);
    game.burst(this.x, this.y - 38, this.style?.accent || '#7cf5ff', 8);
    game.floater(this.x, this.y - 92, 'Dash!', '#7cf5ff', 12);
  }

  /** Nood-super (Kets-slot): omringd/stunlock → tik midden-symbool of druk E. */
  doKetsbam(game) {
    if (!this.isPlayer || !this.alive || !game) return false;
    if (game.ketsbamCd > 0 || game.ketsbamChargeT > 0 || game.inputLocked || game.traveling) return false;
    const near = game.countNearbyMonsters(KETSBAM_DETECT_R);
    const stuck = this.hurtT > 0 && near >= 2;
    const swarmed = near >= KETSBAM_NEAR_MIN;
    if (!swarmed && !stuck) return false;

    const sp = equippedSuper();
    const chargeDur = superChargeDur(sp);

    game.ketsbamCd = superCooldown(sp);
    game.ketsbamSuperT = KETSBAM_SUPER_ARMOR + chargeDur;
    game.ketsbamShow = false;
    game.ketsbamChargeT = chargeDur;
    game.ketsbamChargeDur = chargeDur;
    game.ketsbamChargePulse = 0;
    game.inputLocked = true;
    this.hurtT = 0;
    this.attack = null;
    this.blocking = false;
    this.vx = 0;
    this.vy = 0;
    this.invulnT = Math.max(this.invulnT, KETSBAM_INVULN + chargeDur);
    resetWeaponCombo(this);

    game.banner(superChargeBanner(sp), chargeDur, sp.color || '#ffd75e', 44);
    try { AudioSys.sfx(superSfxId(sp, 'charge')); } catch (_) {}
    if (save.haptics !== false) haptic(12);
    return true;
  }

  finishKetsbam(game) {
    if (!this.isPlayer || !this.alive || !game) return;
    game.ketsbamChargeT = 0;
    game.inputLocked = false;
    game.ketsbamSuperT = Math.max(game.ketsbamSuperT, KETSBAM_SUPER_ARMOR);
    finishEquippedSuper(this, game);
  }

  intent(dt, game) {
    if (this.playerSlot === 1 || (this.isPlayer && !this.playerSlot)) {
      const I = Input;
      return {
        move: I.move,
        jump: I.take('jump'),
        punch: I.take('punch'),
        kick: I.take('kick'),
        weapon: I.take('weapon'),
        special: I.take('special'),
        subst: I.take('subst'),
        dash: I.take('dash'),
        block: false,
      };
    }
    if (this.playerSlot === 2) {
      const I = InputP2;
      return {
        move: I.move,
        jump: I.take('jump'),
        punch: I.take('punch'),
        kick: I.take('kick'),
        weapon: I.take('weapon'),
        special: I.take('special'),
        subst: I.take('subst'),
        dash: I.take('dash'),
        block: false,
      };
    }
    return this.aiIntent(dt, game);
  }

  aiIntent(dt, game) {
    // RabbitRobot street-fighter AI
    const out = { move: 0, jump: false, punch: false, kick: false, weapon: false, special: false, block: false };
    const p = game.player;
    if (!p || !p.alive || !this.alive) return out;
    this.aiTimer -= dt; this.aiCd -= dt;
    const dx = p.x - this.x, dist = Math.abs(dx), dir = Math.sign(dx) || 1;
    let diff = this.aiDiff || 1;
    if (game.mode === 'training' && p.hp / Math.max(1, p.maxhp) < 0.32) diff *= 0.84;
    const pAir = !p.onGround;

    // reactief blokkeren als de speler aanvalt en dichtbij is
    if (p.attack && p.attack.t < p.attack.windup + p.attack.active && dist < 130 && !this.attack) {
      if (Math.random() < 0.55 * diff * dt * 22) { this.blockT = 0.42; }
    }
    if (this.blockT > 0) { this.blockT -= dt; out.block = true; return out; }

    if (this.aiTimer <= 0) {
      this.aiTimer = rand(0.22, 0.55) / diff;
      if (dist > 240) {
        this.aiMove = dir;
        if (this.aiCd <= 0 && dist > 105 && !pAir && Math.random() < 0.3) { out.special = true; this.aiCd = rand(2.6, 4.2) / diff; }
        if (Math.random() < 0.12) out.jump = true;
      } else if (dist > 110) {
        const r = Math.random();
        if (r < 0.55) this.aiMove = dir;
        else if (r < 0.72 && this.aiCd <= 0 && dist > 120 && !pAir) { out.special = true; this.aiCd = rand(2.6, 4.2) / diff; }
        else this.aiMove = -dir * 0.6;
      } else {
        const trainFair = game.mode === 'training';
        const r = Math.random();
        if (r < (trainFair ? 0.34 : 0.42)) out.punch = true;
        else if (r < (trainFair ? 0.58 : 0.72)) out.kick = true;
        else if (r < (trainFair ? 0.82 : 0.86)) { this.aiMove = -dir; }
        else { out.jump = true; this.aiMove = dir; }
      }
    }
    out.move = this.aiMove;
    return out;
  }

  update(dt, game) {
    this.animT += dt;
    if (!this.alive) {
      this.deadT += dt;
      resetWeaponCombo(this);
      this.vy += 1600 * dt; this.y += this.vy * dt;
      if (this.y > game.ground) { this.y = game.ground; this.vy = 0; }
      return;
    }
    const locked = game.inputLocked && (this.isPlayer || this.playerSlot);
    const it = locked ? { move: 0 } : this.intent(dt, game);
    if (this.isPlayer && game && game.partGate) {
      if (it.move < 0) it.move = 0;
      it.punch = it.kick = it.weapon = it.special = it.subst = it.jump = it.dash = false;
      it.block = false;
    }
    if (game.inputLocked && !this.isPlayer && !this.playerSlot) {
      it.punch = it.kick = it.weapon = it.special = false; it.move = 0;
    }

    this.blocking = !!it.block && this.onGround && !this.attack;

    if (this.hurtT > 0) {
      this.hurtT -= dt;
      if (this.hurtT <= 0) this.state = 'idle';
    }

    const canAct = this.hurtT <= 0 && !this.blocking;
    const pad = (this.playerSlot === 2) ? InputP2 : (this.isPlayer ? Input : null);
    let mv = 0;
    if (canAct) {
      if (!this.attack) mv = it.move || 0;
      else if (this.attack.t >= this.attack.windup + this.attack.active) {
        mv = (it.move || 0) * MOVE_ATTACK_RECOVER_MUL;
      }
    } else if ((this.isPlayer || this.playerSlot) && this.hurtT > 0 && this.onGround) {
      mv = (it.move || 0) * MOVE_HURT_MUL;
    }
    const dig = pad && padDigitalMove(pad) !== 0
      && Math.abs((it.move || 0) - padDigitalMove(pad)) < 0.08;
    applyFighterMove(this, mv, dt, { canAct: canAct || this.hurtT > 0, digital: !!dig });

    if (canAct && it.jump && this.onGround && !this.attack) {
      this.vy = -this.jumpV; this.onGround = false; AudioSys.sfx('jump');
    } else if ((this.isPlayer || this.playerSlot) && this.hurtT > 0 && this.hurtT <= 0.14
        && this.onGround && !this.attack && it.jump) {
      this.vy = -this.jumpV * 0.92;
      this.onGround = false;
      this.hurtT = 0;
      this.state = 'idle';
      AudioSys.sfx('jump');
    }
    if (this.substCd > 0) this.substCd -= dt;
    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.weaponComboT > 0) {
      this.weaponComboT -= dt;
      if (this.weaponComboT <= 0) resetWeaponCombo(this);
    }
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.hitFlashT > 0) this.hitFlashT -= dt;
    if (this._shurikenCd > 0) this._shurikenCd -= dt;
    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter(a => a.life > 0);

    if (canAct && it.subst) this.doSubstitution(game);
    const canDash = canAct || ((this.isPlayer || this.playerSlot) && this.hurtT > 0 && this.onGround);
    if (canDash && it.dash) this.doDash(game, it.move || this.face);

    if (canAct) {
      if (it.punch) this.startAttack('punch', game);
      else if (it.kick) this.startAttack('kick', game);
      else if (it.weapon) {
        if (isThrowWeapon(this.weapon.id)) game.throwShuriken(this);
        else this.startAttack(this.weapon.id === 'vuist' ? 'punch' : 'weapon', game);
      }
      else if (it.special) this.startAttack('special', game);
    }

    // zwaartekracht
    this.vy += 1700 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y >= game.ground) {
      if (!this.onGround && this.vy > 300) AudioSys.sfx('land');
      this.y = game.ground; this.vy = 0; this.onGround = true;
    } else this.onGround = false;
    this.x = clampFighterX(this, game, this.x);

    // aanval-timing
    if (this.attack) {
      const a = this.attack;
      a.t += dt;
      if (this.isRobot && a.kind === 'special' && !a.fired && !a._telegraphed && a.t >= a.windup * 0.28) {
        a._telegraphed = true;
        if (game.mode === 'training') {
          game.trainTelegraphT = 0.85;
          game.floater(this.x, this.y - 138, 'CHIDORI — dash/spring!', '#7cf5ff', 16);
          haptic(10);
        }
      }
      if (this.isRobot && a.kind === 'special' && !a.fired && a._telegraphed && game.mode === 'training') {
        const p = game.player;
        if (p && !p.onGround) {
          this.attack = null;
          game.trainTelegraphT = 0;
          this.aiCd = rand(2.5, 4.2) / (this.aiDiff || 1);
          game.floater(this.x, this.y - 128, 'Chidori gemist — spring werkt!', '#7cf5ff', 14);
        } else if (a.t >= a.windup) {
          a.fired = true;
          game.spawnJutsu(this, a);
        }
      } else if (a.kind === 'special' && !a.fired && a.t >= a.windup) {
        a.fired = true;
        game.spawnJutsu(this, a);
      }
      if (this.isRobot && game.mode === 'training' && !a.fired && (a.kind === 'punch' || a.kind === 'kick') && a.t < a.windup) {
        const p = game.player;
        if (p && p.alive && Math.abs(p.x - this.x) < a.range + 36) {
          const maxT = a.kind === 'kick' ? 0.42 : 0.32;
          game.trainMeleeTelegraphT = Math.max(game.trainMeleeTelegraphT || 0, a.windup - a.t + 0.04);
          game.trainMeleeTelegraphMax = maxT;
          game.trainTelegraphKind = a.kind;
        }
      }
      if (a.kind !== 'special' && !a.hasHit && a.t >= a.windup && a.t <= a.windup + a.active) {
        if (game.tryMelee(this, a)) a.hasHit = true;
      }
      if (a.t >= a.windup + a.active + a.recover) {
        if (a.kind === 'weapon' && !isThrowWeapon(this.weapon.id)) {
          this._weaponComboPrimed = true;
          this.weaponComboT = Math.max(this.weaponComboT, WEAPON_COMBO_WINDOW * WEAPON_COMBO_GRACE);
        }
        this.attack = null;
      }
    }

    // chakra laadt sneller bij combo-gevoel (in beweging/gevecht)
    if (this.isPlayer || this.playerSlot) {
      const stageMul = (typeof game !== 'undefined' && game && game.stageEnergyMul) ? game.stageEnergyMul : 1;
      const petMul = (typeof game !== 'undefined' && game && game.petEnergyMul) ? game.petEnergyMul : 1;
      const styleMul = (typeof game !== 'undefined' && game && game.styleEnergyMul) ? game.styleEnergyMul : 1;
      const chakraMul = (this.isPlayer || this.playerSlot) ? skillBonuses('chakra').regenMul : 1;
      const rate = (this.attack ? 4.2 : 2.8) * stageMul * petMul * styleMul * chakraMul;
      const prevE = this._energyPrev == null ? this.energy : this._energyPrev;
      this.energy = clamp(this.energy + dt * rate, 0, 100);
      if (this.energy >= 100 && prevE < 100) {
        try { AudioSys.sting('superReady', fighterJutsuKind(this)); } catch (_) {}
      }
      this._energyPrev = this.energy;
    }

    // state voor animatie
    if (this.hurtT > 0) this.state = 'hurt';
    else if (this.attack) this.state = 'attack';
    else if (!this.onGround) this.state = 'jump';
    else if (Math.abs(this.vx) > 30) this.state = 'run';
    else this.state = 'idle';
    // Bewegend decor: speler "loopt" mee tijdens reis tussen golven
    if (this.isPlayer && game && game.traveling) {
      const pad = inputPadForFighter(this);
      const tMove = pad ? pad.move : 0;
      if (game.partGate && tMove > 0.05) {
        this.face = 1;
        this.vx = Math.max(this.vx, this.speed * 0.95);
        this.state = 'run';
      } else if (game.partGate) {
        this.face = 1;
        if (this.state === 'idle') this.state = 'run';
      } else if (Math.abs(tMove) > 0.05) this.face = tMove > 0 ? 1 : -1;
      else if (this.state === 'idle' || Math.abs(this.vx) < 22) this.face = 1;
      if (this.state === 'idle') this.state = 'run';
    }
  }

  takeDamage(dmg, kbx, game, opts) {
    opts = opts || {};
    if (!this.alive) return 0;
    if ((this.isPlayer || this.playerSlot) && game && game.ketsbamSuperT > 0) return 0;
    if (this.invulnT > 0) {
      game.floater(this.x, this.y - 115, 'MISS!', '#c9a66b', 13, 'fx');
      return 0;
    }
    if (this.blocking && !opts.unblockable) {
      const blockMul = (this.isPlayer && game && game.styleBlockMul) ? game.styleBlockMul : 1;
      dmg = Math.max(1, Math.round(dmg * 0.15 * blockMul));
      AudioSys.sfx('block');
      const atk = opts.attacker && opts.attacker.attack;
      const parry = atk && atk.t >= atk.windup && atk.t <= atk.windup + 0.16;
      game.floater(this.x, this.y - 115, parry ? 'PARRY!' : 'BLOK!', parry ? '#ffd75e' : '#9fd8ff', 14, 'fx');
      if (game) {
        applyHitStop(game, { kind: 'punch' }, { chip: true });
        if (parry) game.freezeT = Math.max(game.freezeT, 0.032);
        spawnFxRing(game, this.x, this.y - 42, parry ? '#ffd75e' : '#9fd8ff', fxLite() ? 6 : 10);
      }
      if (save.haptics !== false) haptic(parry ? 9 : 4);
      this.hp -= dmg;
      return dmg;
    }
    if (this.isPlayer && game && game.playerShieldT > 0) {
      dmg = Math.max(1, Math.round(dmg * 0.32));
      game.floater(this.x, this.y - 115, 'Schild!', '#9fd8ff', 13, 'fx');
    }
    dmg = Math.round(dmg);
    if (this.isPlayer && game && game.styleDefMul && game.styleDefMul !== 1) {
      dmg = Math.max(1, Math.round(dmg * game.styleDefMul));
    }
    this.hp -= dmg;
    if (this.isPlayer && game) {
      if (game.mode === 'training' || game.mode === 'adventure') {
        game.combo = 0;
        game.comboT = 0;
      }
      if (game.mode === 'adventure') game.killStreak = 0;
    }
    this.hurtT = dmg >= 18 ? 0.28 : 0.24;
    this.hitFlashT = motionReduced() ? 0.06 : (dmg >= 18 ? 0.18 : 0.14);
    this.attack = null;
    const kbScaled = scaleKnockback(kbx, dmg, { heavy: dmg >= 18 });
    this.vx = kbScaled;
    this.vy = Math.min(this.vy, -120);
    if (this.isPlayer || this.playerSlot) {
      this.invulnT = Math.max(this.invulnT, dmg >= 18 ? 0.54 : 0.46);
      if (game) game.playerHurtCd = PLAYER_HURT_CHAIN_CD;
      resetWeaponCombo(this);
      if (game) applyHitStop(game, { kind: 'punch', dmg }, { playerHurt: true, heavy: dmg >= 18 });
    }
    if (this.isPlayer) this.energy = clamp(this.energy + 4, 0, 100);
    if (opts.projWeaponId) {
      try { AudioSys.sfxAt(weaponHitSfx(opts.projWeaponId, dmg), this.x); } catch (_) {}
    } else {
      AudioSys.sfxAt(this.isPlayer ? 'hurt' : 'hit', this.x);
    }
    if (this.isPlayer && game) {
      game.floater(this.x, this.y - 118, '-' + dmg, '#ff8080', 15);
    }
    if ((this.isPlayer || this.playerSlot) && game && save.haptics !== false) {
      haptic(dmg >= 18 ? 16 : 8);
    }
    if (this.hp <= 0) {
      this.hp = 0; this.deadT = 0; this.vy = -260;
      AudioSys.sfxAt('die', this.x);
    }
    return dmg;
  }

  /* ------------------------------ tekenen ----------------------------- */
  pose() {
    const t = this.animT, s = this.state;
    const P = {
      hipY: -46, lean: 0,
      arms: [[1.9, -1.1], [1.15, -0.85]],   // [achter, voor] : [schouder, elleboog] hoeken
      legs: [[1.82, 1.72], [1.34, 1.55]],
      headB: 0,
    };
    if (s === 'idle') {
      const b = Math.sin(t * 3);
      P.hipY = -46 + b * 1.4; P.headB = b * 0.6;
    } else if (s === 'run') {
      const c = t * 11;
      P.lean = 0.14;
      P.legs = [
        [Math.PI / 2 + Math.sin(c) * 0.75, Math.PI / 2 + Math.sin(c) * 0.75 + Math.max(0, Math.cos(c)) * 1.0],
        [Math.PI / 2 + Math.sin(c + Math.PI) * 0.75, Math.PI / 2 + Math.sin(c + Math.PI) * 0.75 + Math.max(0, Math.cos(c + Math.PI)) * 1.0],
      ];
      P.arms = [
        [1.55 - Math.sin(c + Math.PI) * 0.7, 1.55 - Math.sin(c + Math.PI) * 0.7 - 0.8],
        [1.55 - Math.sin(c) * 0.7, 1.55 - Math.sin(c) * 0.7 - 0.8],
      ];
      P.hipY = -46 + Math.abs(Math.sin(c)) * 2;
    } else if (s === 'jump') {
      const up = this.vy < 0;
      P.legs = up ? [[2.2, 1.4], [1.0, 2.0]] : [[1.9, 1.5], [1.25, 1.8]];
      P.arms = [[2.4, -2.6], [-0.6, -0.3]];
      P.lean = 0.08;
    } else if (s === 'hurt') {
      P.lean = -0.32;
      P.arms = [[-2.4, -2.0], [-0.5, -1.2]];
      P.legs = [[1.95, 1.8], [1.2, 1.45]];
    } else if (s === 'attack' && this.attack) {
      const a = this.attack;
      const total = a.windup + a.active + a.recover;
      const p = clamp(a.t / total, 0, 1);
      const wEnd = a.windup / total;
      const ext = p < wEnd ? -(p / wEnd) * 0.25
        : clamp((p - wEnd) / Math.max(0.001, (a.windup + a.active) / total - wEnd), 0, 1);
      if (a.kind === 'punch') {
        P.lean = 0.12 * ext;
        P.arms = [[1.9, -1.1], [lerp(1.15, 0.02, Math.max(0, ext)), lerp(-0.85, 0.0, Math.max(0, ext))]];
      } else if (a.kind === 'kick') {
        P.lean = -0.18 * Math.max(0, ext);
        P.legs = [[1.82, 1.72], [lerp(1.34, -0.06, Math.max(0, ext)), lerp(1.55, -0.02, Math.max(0, ext))]];
        P.arms = [[2.2, -2.2], [-0.8, -0.4]];
      } else if (a.kind === 'weapon') {
        const move = a.move || weaponMoveDef(this.weapon.id, a.moveIdx || 0);
        applyWeaponMovePose(P, ext, move);
      } else if (a.kind === 'special') {
        // Rasengan / Chidori houding: hand naar voren
        const charge = clamp(a.t / a.windup, 0, 1);
        P.arms = [[2.1, -2.0], [lerp(0.4, 0.05, charge), lerp(-0.2, 0.05, charge)]];
        P.legs = [[1.95, 1.85], [1.15, 1.4]];
        P.lean = 0.18 * charge;
      }
    }
    if (this.blocking) {
      P.arms = [[0.9, -1.35], [0.75, -1.15]];
      P.lean = 0.05;
    }
    return P;
  }

  draw(c) {
    const s = this.scale;
    c.save();
    c.translate(this.x, this.y);
    if (this.hitFlashT > 0) {
      const flashA = motionReduced() ? 0.18 : 0.4;
      c.globalAlpha = Math.min(flashA, this.hitFlashT * (flashA / 0.14));
      c.fillStyle = this.isPlayer ? '#ff8080' : '#ffe680';
      c.beginPath();
      c.ellipse(0, -44 * s, 34 * s, 48 * s, 0, 0, TAU);
      c.fill();
      c.globalAlpha = 1;
    }
    // schaduw
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath(); c.ellipse(0, 2, 26 * s, 6 * s, 0, 0, TAU); c.fill();
    c.scale(this.face * s, s);

    if (!this.alive) {
      const k = clamp(this.deadT * 2.2, 0, 1);
      c.rotate(-1.45 * k);
      c.globalAlpha = this.deadT > 2 ? clamp(1 - (this.deadT - 2), 0, 1) : 1;
    }

    const P = this.pose();
    const hipX = 0, hipY = P.hipY;
    const shX = hipX + Math.sin(P.lean) * 32, shY = hipY - Math.cos(P.lean) * 32;
    const headX = shX + Math.sin(P.lean) * 12 + P.headB, headY = shY - Math.cos(P.lean) * 12 - 5;

    c.strokeStyle = this.color; c.lineWidth = this.lineW; c.lineCap = 'round';
    const armL = 17, legL = 24;

    const drawLimb = (x, y, a1, a2, l1, l2) => {
      const [mx, my] = seg(x, y, a1, l1);
      const [ex, ey] = seg(mx, my, a2, l2);
      c.beginPath(); c.moveTo(x, y); c.lineTo(mx, my); c.lineTo(ex, ey); c.stroke();
      return [ex, ey];
    };

    // achterste ledematen (donkerder)
    c.save();
    c.globalAlpha *= 0.75;
    drawLimb(hipX, hipY, P.legs[0][0], P.legs[0][1], legL, legL);
    drawLimb(shX, shY, P.arms[0][0], P.arms[0][1], armL, armL);
    c.restore();

    // romp
    c.beginPath(); c.moveTo(hipX, hipY); c.lineTo(shX, shY); c.stroke();
    // voorste been
    drawLimb(hipX, hipY, P.legs[1][0], P.legs[1][1], legL, legL);
    // hoofd
    if (this.bald) {
      c.fillStyle = '#ffe8c8';
      c.beginPath(); c.arc(headX, headY - 9, 10.5, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2;
      c.beginPath(); c.arc(headX, headY - 9, 10.5, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.arc(headX - 3, headY - 12, 2.8, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.arc(headX, headY - 9, 10.5, 0, TAU); c.stroke();
    }
    if (this.gi === 'white' || this.gi === 'red' || this.gi === 'hero') {
      const giFill = this.gi === 'red' ? 'rgba(220,48,48,.55)' : this.gi === 'hero' ? 'rgba(255,226,89,.72)' : 'rgba(255,255,255,.78)';
      c.fillStyle = giFill;
      c.fillRect(shX - 14, shY - 8, 28, 22);
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1;
      c.strokeRect(shX - 14, shY - 8, 28, 22);
      if (this.gi === 'hero') {
        c.fillStyle = 'rgba(255,80,80,.75)';
        c.fillRect(shX - 16, shY - 2, 6, 18);
      }
    }
    if (this.isPlayer && this.style) this.drawStyleExtras(c, headX, headY - 9, shX, shY, hipX, hipY);
    if (this.isRobot) this.drawRobotHead(c, headX, headY - 9);

    // voorste arm + wapen
    const [hx, hy] = drawLimb(shX, shY, P.arms[1][0], P.arms[1][1], armL, armL);
    c.fillStyle = this.color;
    c.beginPath(); c.arc(hx, hy, 3.4, 0, TAU); c.fill();

    if (this.isPlayer && this.weapon.id !== 'vuist' && !(this.attack && this.attack.kind === 'special')) {
      const aimLift = (this._aimAtAttack && (this.attack?.kind === 'weapon' || this.attack?.kind === 'punch' || this.attack?.kind === 'kick'))
        ? clamp(this._aimAtAttack.ny, -1, 0.4) * 0.85
        : 0;
      const wAng = this.attack && this.attack.kind === 'weapon' ? P.arms[1][1] + aimLift : -0.5 + aimLift * 0.25;
      if (this.attack && this.attack.kind === 'weapon' && this.attack.move && !motionReduced() && !fxLite()) {
        const a = this.attack;
        if (a.t >= a.windup && a.t <= a.windup + a.active) {
          const ext = clamp((a.t - a.windup) / Math.max(0.01, a.active), 0, 1);
          c.save();
          c.globalAlpha = 0.32 * (1 - ext * 0.35);
          c.strokeStyle = weaponMoveFxColor(a.move);
          c.lineWidth = 2.5;
          c.beginPath();
          c.arc(hx, hy, 16 + ext * 30, wAng - 0.85, wAng + 0.45);
          c.stroke();
          c.restore();
        }
      }
      c.save(); c.translate(hx, hy); c.rotate(wAng);
      if (this.weapon.masterSword || this.weapon.id === 'master_sword') {
        c.shadowColor = '#6fd7ff';
        c.shadowBlur = fxLite() ? 10 : 18;
      }
      drawWeaponShape(c, this.weapon.id, this.animT, this.attack && this.attack.moveIdx);
      c.restore();
    }

    if (this.blocking) {
      c.strokeStyle = 'rgba(120,220,255,.8)'; c.lineWidth = 3;
      c.beginPath(); c.arc(22, -50, 26, -1.4, 1.4); c.stroke();
    }
    // Rasengan / Chidori oplaad in de hand
    if (this.attack && this.attack.kind === 'special' && !this.attack.fired) {
      const g = clamp(this.attack.t / this.attack.windup, 0, 1);
      const kind = fighterJutsuKind(this);
      drawJutsuOrb(c, hx + 14, hy, 8 + g * 16, this.animT * (8 + g * 20), kind, 0.55 + g * 0.45);
      if (kind === 'chidori') {
        c.strokeStyle = `rgba(200,240,255,${0.35 + g * 0.45})`;
        c.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const a = this.animT * 14 + i * 1.4;
          c.beginPath();
          c.moveTo(hx + 10, hy - 4);
          c.lineTo(hx + 10 + Math.cos(a) * (18 + g * 22), hy - 4 + Math.sin(a) * 8);
          c.stroke();
        }
      } else if (kind === 'rinnegan') {
        c.strokeStyle = `rgba(196,122,255,${0.4 + g * 0.45})`;
        c.lineWidth = 2;
        for (let ring = 0; ring < 3; ring++) {
          c.beginPath();
          c.arc(hx + 14, hy, 10 + g * 16 + ring * 4, this.animT * (6 + ring), this.animT * (6 + ring) + Math.PI * 1.1);
          c.stroke();
        }
        c.fillStyle = `rgba(255,100,140,${0.35 + g * 0.4})`;
        for (let i = 0; i < 3; i++) {
          const a = this.animT * 8 + i * (TAU / 3);
          c.beginPath();
          c.arc(hx + 14 + Math.cos(a) * (8 + g * 12), hy + Math.sin(a) * (8 + g * 10), 2.5 + g * 2, 0, TAU);
          c.fill();
        }
      } else {
        c.fillStyle = `rgba(124,245,255,${0.25 + g * 0.35})`;
        for (let i = 0; i < 5; i++) {
          const a = this.animT * 10 + i * (TAU / 5);
          c.beginPath();
          c.arc(hx + 14 + Math.cos(a) * (10 + g * 14), hy + Math.sin(a) * (6 + g * 8), 2 + g * 2, 0, TAU);
          c.fill();
        }
      }
    }
    c.restore();

    // afterimages (substitutie)
    for (const ai of this.afterimages) {
      c.save();
      c.globalAlpha = clamp(ai.life * 2, 0, 0.45);
      c.translate(ai.x, ai.y);
      c.scale(ai.face * this.scale, this.scale);
      c.strokeStyle = '#c9a66b'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -46); c.lineTo(0, -14); c.stroke();
      c.beginPath(); c.arc(0, -58, 9, 0, TAU); c.stroke();
      c.restore();
    }
    if (this.invulnT > 0) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.animT * 40) * 0.15;
      c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(this.x, this.y - 40, 28, 48, 0, 0, TAU); c.stroke();
      c.restore();
    }
  }

  drawStyleExtras(c, hx, hy, shX, shY, hipX, hipY) {
    const st = this.style;
    if (st.glow) {
      c.save();
      c.shadowColor = st.accent;
      c.shadowBlur = 10 + Math.sin(this.animT * 5) * 4;
      c.strokeStyle = st.accent;
      c.lineWidth = 2;
      c.beginPath(); c.arc(hx, hy, 12, 0, TAU); c.stroke();
      c.restore();
    }
    if (st.bandana) {
      c.fillStyle = st.bandana;
      c.fillRect(hx - 11, hy - 17, 22, 7);
      if (st.plate) {
        c.fillStyle = st.plate;
        c.fillRect(hx - 5, hy - 16, 10, 5);
      }
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(hx + 9, hy - 14); c.lineTo(hx + 18, hy - 10); c.stroke();
    }
    if (st.coat) {
      c.fillStyle = 'rgba(224,79,79,.32)';
      c.beginPath();
      c.moveTo(hipX - 14, hipY - 8); c.lineTo(hipX + 14, hipY - 8);
      c.lineTo(shX + 18, shY - 4); c.lineTo(shX - 18, shY - 4);
      c.closePath(); c.fill();
      c.strokeStyle = st.accent; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, shY - 6); c.lineTo(0, hipY + 4); c.stroke();
    }
    if (st.duck) {
      c.fillStyle = '#ffe259';
      c.beginPath(); c.moveTo(hx + 8, hy + 2); c.lineTo(hx + 16, hy + 4); c.lineTo(hx + 8, hy + 6); c.closePath(); c.fill();
    }
    if (st.fox) {
      c.fillStyle = st.accent;
      c.beginPath(); c.moveTo(hx - 10, hy - 16); c.lineTo(hx - 14, hy - 26); c.lineTo(hx - 6, hy - 18); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(hx + 4, hy - 16); c.lineTo(hx + 8, hy - 26); c.lineTo(hx + 2, hy - 18); c.closePath(); c.fill();
    }
    if (st.visor) {
      c.fillStyle = '#7cf5ff';
      c.globalAlpha = 0.85;
      c.fillRect(hx - 9, hy - 5, 18, 6);
      c.globalAlpha = 1;
    }
    if (st.topknot) {
      c.strokeStyle = st.accent; c.lineWidth = 3;
      c.beginPath(); c.moveTo(hx, hy - 18); c.lineTo(hx, hy - 30); c.stroke();
      c.fillStyle = st.accent;
      c.beginPath(); c.arc(hx, hy - 32, 4.5, 0, TAU); c.fill();
    }
    if (st.hunter) {
      c.fillStyle = 'rgba(61,92,50,.55)';
      c.beginPath();
      c.moveTo(hipX - 16, hipY - 6); c.lineTo(hipX + 16, hipY - 6);
      c.lineTo(shX + 20, shY - 2); c.lineTo(shX - 20, shY - 2);
      c.closePath(); c.fill();
      c.fillStyle = st.accent;
      c.beginPath(); c.arc(hx - 14, hy - 8, 3, 0, TAU); c.fill();
    }
    if (st.crystal) {
      c.fillStyle = st.accent;
      c.globalAlpha = 0.9;
      c.beginPath();
      c.moveTo(hx + 10, hy - 6); c.lineTo(hx + 16, hy - 12); c.lineTo(hx + 22, hy - 6); c.lineTo(hx + 16, hy); c.closePath();
      c.fill();
      c.globalAlpha = 1;
    }
    if (st.tome) {
      c.fillStyle = st.accent;
      c.fillRect(hx - 18, hy - 2, 7, 10);
      c.fillStyle = '#fff8e8';
      c.fillRect(hx - 16.5, hy, 4, 6);
      c.strokeStyle = st.bandana || '#6b5344';
      c.lineWidth = 1.2;
      c.strokeRect(hx - 18, hy - 2, 7, 10);
    }
    if (st.lightning && !motionReduced()) {
      const pulse = Math.sin(this.animT * 14) * 0.5 + 0.5;
      if (pulse > 0.35 || st.id === 'cyber') {
        c.save();
        c.strokeStyle = st.id === 'cyber' ? '#7cf5ff' : '#6fd7ff';
        c.shadowColor = st.id === 'cyber' ? '#4ecf6a' : '#7cf5ff';
        c.shadowBlur = st.id === 'cyber' ? 10 : 6;
        c.lineWidth = st.id === 'cyber' ? 2 : 1.4;
        c.globalAlpha = 0.55 + pulse * 0.35;
        const lx = hx + (st.id === 'cyber' ? 14 : -12);
        const ly = hy - 8;
        c.beginPath();
        c.moveTo(hx, hy - 10);
        c.lineTo(hx + 4, hy - 4);
        c.lineTo(hx - 2, hy + 2);
        c.lineTo(lx, ly);
        c.stroke();
        if (st.id === 'cyber' && pulse > 0.6) {
          c.beginPath();
          c.moveTo(hx - 6, hy - 14);
          c.lineTo(hx + 8, hy - 18);
          c.lineTo(hx + 2, hy - 6);
          c.stroke();
        }
        c.restore();
      }
    }
  }

  drawRobotHead(c, hx, hy) {
    // konijnenoren + vizier
    c.strokeStyle = this.color; c.lineWidth = 4;
    c.beginPath(); c.moveTo(hx - 5, hy - 8); c.lineTo(hx - 9, hy - 26); c.stroke();
    c.beginPath(); c.moveTo(hx + 3, hy - 9); c.lineTo(hx + 5, hy - 27); c.stroke();
    c.strokeStyle = '#ff5d5d'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(hx - 9, hy - 26); c.lineTo(hx - 9, hy - 20); c.stroke();
    c.beginPath(); c.moveTo(hx + 5, hy - 27); c.lineTo(hx + 5, hy - 21); c.stroke();
    c.fillStyle = '#ff4d4d';
    c.fillRect(hx - 1, hy - 3, 9, 4);
    c.fillStyle = '#ffd0d0';
    c.fillRect(hx + 5, hy - 3, 2, 4);
  }
}

