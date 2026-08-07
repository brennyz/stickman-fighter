/* ============================== MONSTER ================================ */
class Monster {
  constructor(spId, x, game, opts) {
    const sp = SPECIES[spId];
    opts = opts || {};
    const eliteMul = opts.elite ? 1.7 : 1;
    this.spId = spId; this.sp = sp;
    this.elite = !!opts.elite;
    this.superBoss = !!opts.superBoss;
    this.satanBoss = !!opts.satanBoss;
    this.reflectRatio = opts.satanBoss
      ? (Number(opts.reflectRatio) > 0 ? Number(opts.reflectRatio) : SATAN_REFLECT_RATIO)
      : 0;
    this.bossCore = !!(opts.bossCore || opts.superBoss);
    this.colossal = false;
    this.size = sp.size * (opts.elite ? 1.5 : 1);
    this.maxhp = Math.round(sp.hp * (opts.hpMul || 1) * eliteMul);
    this.hp = this.maxhp;
    this.dmg = Math.round(sp.dmg * (opts.dmgMul || 1) * (opts.elite ? 1.3 : 1));
    if (this.superBoss) {
      this.elite = true;
      this.maxhp = Math.round(this.maxhp * 2.35);
      this.hp = this.maxhp;
      this.dmg = Math.round(this.dmg * 1.42);
      this.size *= 1.32;
    }
    if (this.satanBoss) {
      this.elite = true;
      this.superBoss = false;
      this.bossCore = false;
      this.colossal = false;
      if (opts.targetHp > 0) {
        this.maxhp = Math.round(opts.targetHp);
        this.hp = this.maxhp;
      }
      this.dmg = Math.round(sp.dmg * (opts.dmgMul || SATAN_DIRECT_DMG_MUL));
      const override = Number(opts.sizeOverride) > 0
        ? Math.round(opts.sizeOverride)
        : (typeof satanCombatSize === 'function' ? satanCombatSize() : Math.round(sp.size * 2.2));
      this.size = override;
    } else if (this.bossCore) {
      if (this.superBoss) {
        // Super-baas is al zwaar gebufft — lichte extra + kans op colossaal.
        this.size = Math.round(this.size * 1.12);
        this.maxhp = Math.round(this.maxhp * 1.35);
        this.hp = this.maxhp;
      } else {
        this.size = Math.round(this.size * BOSS_CORE_SIZE_MUL);
        this.maxhp = Math.round(this.maxhp * BOSS_CORE_HP_MUL);
        this.hp = this.maxhp;
        this.dmg = Math.round(this.dmg * BOSS_CORE_DMG_MUL);
      }
      if (Math.random() < COLOSSAL_CHANCE) {
        this.colossal = true;
        this.size = Math.round(this.size * COLOSSAL_SIZE_MUL);
        this.maxhp = Math.round(this.maxhp * COLOSSAL_HP_MUL);
        this.hp = this.maxhp;
        this.dmg = Math.round(this.dmg * COLOSSAL_DMG_MUL);
      }
    }
    if (opts.giant && !this.superBoss && !this.bossCore && !this.satanBoss) {
      this.giant = true;
      this.size = Math.round(this.size * GIANT_SIZE_MUL);
      this.maxhp = Math.round(this.maxhp * GIANT_HP_MUL);
      this.hp = this.maxhp;
      this.dmg = Math.round(this.dmg * GIANT_DMG_MUL);
    }
    this.speed = sp.speed * (opts.speedMul || 1);
    this.advDiff = opts.advDiff || 'normal';
    this.enrageMul = Number(opts.enrageMul) > 0 ? Number(opts.enrageMul) : 1;
    this.enrageAt = Number.isFinite(Number(opts.enrageAt)) ? clamp(Number(opts.enrageAt), 0.25, 0.9) : 0.5;
    this.x = x;
    this.flying = sp.type === 'fly' || sp.type === 'dragon';
    this.swimming = sp.type === 'swim';
    this.y = this.flying ? game.ground - rand(90, 160) : game.ground - this.size;
    this.vx = 0; this.vy = 0;
    this.t = rand(0, 10); this.flashT = 0; this.deadT = -1;
    this.atkCD = rand(0.5, 1.5); this.shootCD = rand(1, 2.5);
    this.dashT = 0; this.telegraphT = 0; this.telegraphMax = 0; this.hopT = rand(0, 0.8);
    /** Soft-feel: langere dodge-telegraphs op golf 1 / vroege levels. */
    this.softTelegraph = !!opts.softTelegraph;
    this.face = -1;
    this.enraged = false;
    this.phase2FlashT = 0;
    this.introT = 0;
    this.introDur = 0;
    this.introTier = null;
    this.tideBoss = !!opts.tideBoss;
    if (this.bossCore && typeof BOSS_SAFETY_DUR === 'number') {
      this.safetyT = BOSS_SAFETY_DUR * (this.colossal ? 1.35 : 1);
    }
  }
  get alive() { return this.hp > 0; }

  update(dt, game) {
    this.t += dt;
    if (this.introT > 0) this.introT -= dt;
    if (this.safetyT > 0) this.safetyT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.phase2FlashT > 0) this.phase2FlashT -= dt;
    if (!this.alive) { this.deadT += dt; return; }
    const p = game.player;
    const dx = p.x - this.x, dir = Math.sign(dx) || 1, dist = Math.abs(dx);
    this.face = dir;
    this.atkCD -= dt; this.shootCD -= dt;
    if (this.superSlowT > 0) this.superSlowT -= dt;
    const genjutsuMul = (this.superSlowT > 0) ? (this.superSlowMul || 0.25) : 1;
    const enrageSpd = this.enraged ? (1.32 * (this.enrageMul || 1)) : 1;
    const spdMul = enrageSpd * genjutsuMul;
    const type = this.sp.type;

    if (type === 'hop') {
      this.hopT -= dt;
      if (this.hopT <= 0 && Math.abs(this.y - (game.ground - this.size)) < 2) {
        this.vy = -rand(240, 380); this.vx = dir * this.speed * spdMul * rand(1.2, 1.8);
        this.hopT = rand(0.7, 1.3);
      }
      this.vy += 1400 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.y >= game.ground - this.size) { this.y = game.ground - this.size; this.vy = 0; this.vx *= 0.4; }
    } else if (type === 'fly') {
      const ty = game.ground - 110 + Math.sin(this.t * 2.4) * 42;
      this.y += (ty - this.y) * dt * 2.2;
      this.x += dir * this.speed * spdMul * dt * (dist > 30 ? 1 : 0);
    } else if (type === 'charge') {
      if (this.dashT > 0) {
        this.dashT -= dt;
        this.x += this.vx * dt;
      } else if (this.telegraphT > 0) {
        this.telegraphT -= dt;
        if (this.telegraphT <= 0) { this.dashT = 0.5; this.vx = dir * this.speed * spdMul * 3.4; AudioSys.sfx('swing'); }
      } else {
        this.x += dir * this.speed * spdMul * dt * 0.6;
        if (dist < 240 && this.atkCD <= 0) {
          const wind = this.enraged ? 0.28 : (this.softTelegraph ? 0.72 : 0.45);
          this.telegraphT = wind;
          this.telegraphMax = wind;
          this.atkCD = rand(1.6, 2.6) / (this.enraged ? 1.25 : 1);
        }
      }
      this.y = game.ground - this.size;
    } else if (type === 'shoot') {
      if (dist < 190) this.x -= dir * this.speed * spdMul * dt;
      else if (dist > 330) this.x += dir * this.speed * spdMul * dt;
      if (this.sp.art === 'ghost') this.y = game.ground - this.size - 26 + Math.sin(this.t * 2) * 14;
      else this.y = game.ground - this.size;
      if (this.shootCD <= 0 && dist < 560) {
        this.shootCD = rand(2.2, 3.2);
        game.spawnProjectile({
          x: this.x + dir * this.size, y: this.y - 4,
          vx: dir * 300, vy: 0, r: 8, dmg: this.dmg, from: 'enemy',
          kind: this.sp.art === 'ghost' ? 'orb' : 'laser',
        });
        AudioSys.sfx(this.sp.art === 'ghost' ? 'shoot' : 'laser');
      }
    } else if (type === 'tank') {
      if (this.telegraphT > 0) {
        this.telegraphT -= dt;
        if (this.telegraphT <= 0) {
          AudioSys.sfx('hit2'); game.shake(8, 0.25);
          if (Math.abs(p.x - this.x) < this.size + 62 && p.y > game.ground - 90)
            p.takeDamage(this.dmg, Math.sign(p.x - this.x) * 320, game);
        }
      } else {
        this.x += dir * this.speed * dt;
        if (dist < this.size + 48 && this.atkCD <= 0) {
          const wind = this.softTelegraph ? 0.78 : 0.55;
          this.telegraphT = wind;
          this.telegraphMax = wind;
          this.atkCD = 2.0;
          AudioSys.sfx('roar');
        }
      }
      this.y = game.ground - this.size;
    } else if (type === 'dragon') {
      const ty = game.ground - 130 + Math.sin(this.t * 1.7) * 36;
      this.y += (ty - this.y) * dt * 1.6;
      const want = 200;
      if (dist > want + 40) this.x += dir * this.speed * dt;
      else if (dist < want - 60) this.x -= dir * this.speed * dt * 0.7;
      if (this.shootCD <= 0) {
        this.shootCD = (this.elite ? rand(1.4, 2.0) : rand(1.9, 2.6)) / (this.enraged ? 1.35 : 1);
        const a = Math.atan2((p.y - 40) - this.y, p.x - this.x);
        game.spawnProjectile({ x: this.x + Math.cos(a) * this.size, y: this.y + Math.sin(a) * this.size,
          vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, r: 10, dmg: this.dmg, from: 'enemy', kind: 'fire', grav: 60 });
        AudioSys.sfx('roar');
      }
    } else if (type === 'swim') {
      const bob = Math.sin(this.t * 3.4) * 6;
      this.y = game.ground - this.size + bob;
      if (this.sp.art === 'shark') {
        if (this.dashT > 0) {
          this.dashT -= dt;
          this.x += this.vx * dt;
        } else if (this.telegraphT > 0) {
          this.telegraphT -= dt;
          if (this.telegraphT <= 0) {
            this.dashT = 0.42;
            this.vx = dir * this.speed * spdMul * 3.9;
            try { AudioSys.sfx('swing'); } catch (_) {}
          }
        } else {
          this.x += dir * this.speed * spdMul * dt * 0.78;
          if (dist < 230 && this.atkCD <= 0) {
            const wind = this.enraged ? 0.2 : (this.softTelegraph ? 0.58 : 0.36);
            this.telegraphT = wind;
            this.telegraphMax = wind;
            this.atkCD = rand(1.35, 2.1) / (this.enraged ? 1.25 : 1);
          }
        }
      } else {
        if (dist < 200) this.x -= dir * this.speed * spdMul * dt * 0.45;
        else if (dist > 340) this.x += dir * this.speed * spdMul * dt * 0.65;
        if (this.shootCD <= 0 && dist < 540) {
          this.shootCD = rand(1.9, 2.8);
          game.spawnProjectile({
            x: this.x + dir * this.size, y: this.y - 8,
            vx: dir * 250, vy: rand(-50, 50), r: 9, dmg: this.dmg, from: 'enemy', kind: 'ink',
          });
          try { AudioSys.sfx('shoot'); } catch (_) {}
        }
      }
    }
    this.x = clamp(this.x, game.minX - 20, game.maxX + 20);

    this.tryEnemyJutsu(dt, game, p, dist);

    // contactschade
    if (this.atkCD <= 0 || this.dashT > 0) {
      if (game.playerHurtCd > 0) { /* stunlock-guard */ }
      else {
      const rr = (this.size + p.bodyR) * 0.82;
      if ((p.x - this.x) ** 2 + (p.bodyY - this.y) ** 2 < rr * rr) {
        const d = this.dashT > 0 ? this.dmg * 1.3 : this.dmg;
        if (p.takeDamage(d, dir * 180, game) > 0) {
          game.shake(4, 0.15);
          applyHitStop(game, { kind: 'punch', dmg: d }, { playerHurt: true, heavy: d >= 18 });
        }
        this.atkCD = Math.max(this.atkCD, 1.55);
      }
      }
    }
  }

  tryEnemyJutsu(dt, game, p, dist) {
    if (!this.enemyJutsu || !p || !p.alive || this.introT > 0 || game.inputLocked) return;
    this.jutsuCD -= dt;
    if (this.jutsuTelegraphT > 0) {
      this.jutsuTelegraphT -= dt;
      if (this.jutsuTelegraphT <= 0) game.spawnEnemyJutsu(this);
      return;
    }
    if (this.jutsuCD > 0 || dist < 130 || dist > 520) return;
    if (this.dashT > 0 || this.telegraphT > 0) return;
    this.jutsuTelegraphT = this.enemyJutsu === 'kamehame' ? 0.9 : 0.5;
    this.jutsuCD = rand(5, 8.5) / (this.enraged ? 1.2 : 1);
    try {
      AudioSys.sfx(this.enemyJutsu === 'kamehame' ? 'ketsbamCharge' : 'roar');
    } catch (_) {}
  }

  takeDamage(dmg, kbx, game, opts) {
    opts = opts || {};
    if (!this.alive) return;
    const canEnrage = this.elite || this.bossCore || this.advDiff === 'nightmare' || this.advDiff === 'hell';
    const thresh = this.maxhp * (this.enrageAt != null ? this.enrageAt : 0.5);
    if (canEnrage && !this.enraged && this.hp - dmg <= thresh) {
      this.enraged = true;
      this.phase2FlashT = motionReduced() ? 0.35 : 0.85;
      const em = this.enrageMul || 1;
      this.speed = Math.round(this.speed * (1.28 * Math.min(em, 1.5)));
      this.dmg = Math.round(this.dmg * (1.22 * Math.min(em, 1.45)));
      const phaseLabel = this.advDiff === 'hell'
        ? `${this.sp.name} — HEL-WOEDE!`
        : (this.advDiff === 'nightmare'
          ? `${this.sp.name} — VUUR-RASERNIE!`
          : `${this.sp.name} — FASE 2!`);
      game.banner(phaseLabel, 1.6, this.advDiff === 'hell' ? '#ff3a2a' : (this.advDiff === 'nightmare' ? '#ff7a4d' : '#ff6b6b'), 36);
      AudioSys.sfx('roar');
      game.shake(9, 0.28);
      haptic(28);
      // d20 polish #12 — baas fase-2 kleurflits
      game.bossPhase2Flash = motionReduced() ? 0.22 : 0.55;
      game.bossPhase2Hue = this.advDiff === 'hell' ? '#ff2a18' : (this.sp?.c1 || '#ff6b6b');
      this.flashT = Math.max(this.flashT, motionReduced() ? 0.12 : 0.28);
      const lite = fxLite() || motionReduced();
      try {
        spawnFxRing(game, this.x, this.y - this.size * 0.35, '#ff3040', lite ? 12 : 20);
        spawnFxRing(game, this.x, this.y - this.size * 0.55, '#ffb830', lite ? 8 : 14);
        game.burst(this.x, this.y - this.size * 0.3, '#ff6b6b', lite ? 10 : 22, { kind: 'spark', size: 2.8 });
        game.burst(this.x, this.y - this.size * 0.45, '#ffd75e', lite ? 6 : 14, { kind: 'spark', size: 2.2 });
      } catch (_) {}
    }
    if (this.safetyT > 0 && this.hp - dmg < 1) dmg = Math.max(0, this.hp - 1);
    this.hp -= dmg;
    this.flashT = motionReduced() ? 0.06 : (dmg >= 18 ? 0.14 : opts.crit ? 0.12 : 0.1);
    const kb = scaleKnockback(kbx, dmg, { crit: opts.crit, kind: opts.kind });
    this.x += Math.sign(kb || 1) * clamp(Math.abs(kb) * 0.038, 5, 26);
    if (!opts.quiet) {
      game.floater(this.x, this.y - this.size - 14, '-' + dmg, '#ffe680', 15);
      game.burst(this.x, this.y, this.sp.c1, dmg >= 18 ? 9 : 6);
    }
    if (opts.crit) spawnFxRing(game, this.x, this.y - this.size * 0.4, '#ffd75e', fxLite() ? 5 : 8);
    if (this.hp <= 0) {
      this.hp = 0; this.deadT = 0;
      AudioSys.sfxAt('die', this.x);
      const burstN = fxLite() ? 6 : (this.superBoss || this.satanBoss ? 14 : (this.elite ? 12 : 10));
      game.burst(this.x, this.y, this.sp.c1, burstN);
      game.onMonsterKilled(this);
    } else {
      if (this.satanBoss && this.reflectRatio > 0 && dmg > 0 && game && game.player && game.player.alive) {
        const rd = Math.max(1, Math.round(dmg * this.reflectRatio));
        try {
          game.player.takeDamage(rd, Math.sign(game.player.x - this.x) * 220, game, { reflect: true, skipHitSfx: true });
          game.floater(game.player.x, game.player.y - 70, t('combat.satanReflect', { n: rd }), '#ff3040', 13);
          game.burst(game.player.x, game.player.y - 40, '#ff3040', fxLite() ? 4 : 8);
          AudioSys.sfxAt('hit', game.player.x);
        } catch (_) {}
      }
      if (!opts.skipHitSfx) {
        AudioSys.sfxAt('hit', this.x);
      }
    }
  }

  draw(c) {
    if (!this.alive && this.deadT > 0.6) return;
    c.save();
    c.translate(this.x, this.y);
    if (!this.alive) {
      const k = this.deadT / 0.6;
      c.globalAlpha = 1 - k;
      c.scale(1 + k * 0.6, Math.max(0.05, 1 - k));
    }
    // schaduw
    if (!this.flying && !this.swimming) {
      c.save(); c.fillStyle = 'rgba(0,0,0,.28)';
      c.beginPath(); c.ellipse(0, this.size - 2, this.size, this.size * 0.24, 0, 0, TAU); c.fill(); c.restore();
    }
    // rariteit-aura
    const rar = rarityOf(this.sp.rarity);
    if (this.alive && (this.advDiff === 'nightmare' || this.advDiff === 'hell') && !motionReduced()) {
      c.save();
      const pulse = 0.55 + Math.sin(this.t * (this.advDiff === 'hell' ? 10 : 7)) * 0.2;
      c.globalAlpha = 0.18 + pulse * 0.2;
      c.strokeStyle = this.advDiff === 'hell' ? '#ff3a2a' : '#ff8a30';
      c.lineWidth = this.advDiff === 'hell' ? 3.2 : 2.4;
      c.beginPath();
      c.ellipse(0, -this.size * 0.15, this.size * 1.35, this.size * 1.15, 0, 0, TAU);
      c.stroke();
      if (this.advDiff === 'hell') {
        c.globalAlpha = 0.12 + pulse * 0.1;
        c.fillStyle = '#ff2a18';
        c.beginPath();
        c.ellipse(0, -this.size * 0.1, this.size * 1.15, this.size * 0.95, 0, 0, TAU);
        c.fill();
      }
      c.restore();
    }
    if (this.introT > 0 && this.alive) {
      c.save();
      const p = clamp(this.introT / Math.max(0.6, this.introDur || 1.6), 0, 1);
      const pulse = 1 + Math.sin(this.t * 14) * 0.08;
      const bigIntro = !!(this.bossCore || this.superBoss || this.colossal);
      c.globalAlpha = 0.25 + p * 0.45;
      c.strokeStyle = this.introTier === 'satanBoss' ? '#ff3040'
        : (this.introTier === 'tideBoss' ? '#4a9fff' : (this.introTier === 'superBoss' || this.colossal ? '#ffd75e' : (this.introTier === 'boss' ? '#ff6b6b' : '#c47aff')));
      c.lineWidth = (bigIntro || this.satanBoss ? 5 : 4) + p * (bigIntro || this.satanBoss ? 6 : 4);
      c.beginPath();
      c.ellipse(0, 0, this.size * (1.7 + (1 - p) * 0.9) * pulse, this.size * (1.35 + (1 - p) * 0.7) * pulse, 0, 0, TAU);
      c.stroke();
      if (!motionReduced()) {
        c.globalAlpha = 0.15 + p * 0.25;
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.ellipse(0, 0, this.size * 1.9 * pulse, this.size * 1.5 * pulse, 0, 0, TAU);
        c.fill();
      }
      if ((bigIntro || this.satanBoss) && p > 0.12) {
        const label = (this.sp && this.sp.name) || 'BAAS';
        const tag = this.satanBoss
          ? (typeof t === 'function' ? t('combat.satanTag') : 'SATAN')
          : (this.colossal
          ? (typeof t === 'function' ? t('combat.colossalTag') : 'COLOSSAAL')
          : (this.superBoss
            ? (typeof t === 'function' ? t('combat.superBossTag') : 'SUPER BAAS')
            : (typeof t === 'function' ? t('combat.bossTag') : 'BAAS')));
        const fs = Math.max(18, Math.min(this.satanBoss ? 40 : (this.colossal ? 42 : 34), this.size * (this.satanBoss ? 0.28 : 0.55)));
        c.globalAlpha = Math.min(1, 0.35 + p * 0.75);
        c.font = `900 ${fs}px -apple-system, sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const ty = -this.size * (this.flying ? 1.15 : 1.35) - fs * 0.35;
        c.lineWidth = Math.max(4, fs * 0.18);
        c.strokeStyle = 'rgba(0,0,0,.72)';
        c.fillStyle = this.satanBoss ? '#ff3040' : (this.colossal || this.superBoss ? '#ffd75e' : '#ff8a9a');
        c.strokeText(tag, 0, ty - fs * 0.85);
        c.fillText(tag, 0, ty - fs * 0.85);
        c.font = `900 ${Math.round(fs * 1.15)}px -apple-system, sans-serif`;
        c.fillStyle = '#fff';
        c.strokeText(label, 0, ty);
        c.fillText(label, 0, ty);
      }
      c.restore();
    }
    if (this.superSlowT > 0 && this.alive && !motionReduced()) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.t * 9) * 0.12;
      c.strokeStyle = '#c47aff';
      c.lineWidth = 2;
      c.setLineDash([4, 5]);
      c.beginPath();
      c.arc(0, -this.size * 0.35, this.size * 0.55, 0, TAU);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }
    if (rar.order >= 2 && this.alive) {
      c.save();
      c.strokeStyle = this.satanBoss ? '#ff3040' : (this.tideBoss ? '#4a9fff' : (this.superBoss ? '#ffd75e' : rar.glow)); c.lineWidth = 3 + rar.order * 0.4;
      c.beginPath(); c.ellipse(0, 0, this.size * 1.55, this.size * 1.2, 0, 0, TAU); c.stroke();
      if (rar.order >= 4) {
        c.globalAlpha = motionReduced() ? 0.25 : (0.25 + Math.sin(this.t * 6) * 0.1);
        c.fillStyle = rar.color;
        c.beginPath(); c.ellipse(0, 0, this.size * 1.7, this.size * 1.35, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    if (this.satanBoss && this.alive) {
      c.save();
      c.globalAlpha = motionReduced() ? 0.32 : (0.3 + Math.sin(this.t * 4.5) * 0.12);
      c.strokeStyle = '#ff3040'; c.lineWidth = 4.2;
      c.beginPath(); c.ellipse(0, 0, this.size * 1.58, this.size * 1.35, 0, 0, TAU); c.stroke();
      if (!motionReduced() && !fxLite()) {
        c.globalAlpha = 0.1 + Math.sin(this.t * 3.2) * 0.05;
        c.fillStyle = '#8a1020';
        c.beginPath(); c.ellipse(0, this.size * 0.15, this.size * 1.7, this.size * 0.4, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    if (this.tideBoss && this.alive) {
      c.save();
      c.globalAlpha = motionReduced() ? 0.28 : (0.28 + Math.sin(this.t * 5) * 0.1);
      c.strokeStyle = '#4a9fff'; c.lineWidth = 3.5;
      c.beginPath(); c.ellipse(0, 0, this.size * 1.62, this.size * 1.28, 0, 0, TAU); c.stroke();
      if (!motionReduced() && !fxLite()) {
        c.globalAlpha = 0.12 + Math.sin(this.t * 3.5) * 0.06;
        c.fillStyle = '#4a9fff';
        c.beginPath(); c.ellipse(0, this.size * 0.1, this.size * 1.75, this.size * 0.35, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    if ((this.giant || this.colossal) && this.alive) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.t * 4) * 0.08;
      c.strokeStyle = this.colossal ? '#ffb06a' : '#ffd75e';
      c.lineWidth = this.colossal ? 3.4 : 2.5;
      c.beginPath(); c.ellipse(0, this.size * 0.82, this.size * 1.28, this.size * 0.24, 0, 0, TAU); c.stroke();
      c.restore();
    }
    if (this.safetyT > 0 && this.alive) {
      c.save();
      const pulse = 0.35 + Math.sin(this.t * 12) * 0.12;
      c.globalAlpha = pulse;
      c.strokeStyle = '#7cf5ff';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, this.size * (1.45 + Math.sin(this.t * 8) * 0.05), 0, TAU);
      c.stroke();
      c.restore();
    }
    // Soft-feel A3: duidelijke dodge-telegraph ring + richtingspijl vóór charge/slam.
    if (this.telegraphT > 0 && this.alive) {
      c.save();
      const maxT = Math.max(0.2, this.telegraphMax || this.telegraphT);
      const frac = clamp(this.telegraphT / maxT, 0, 1);
      const calm = motionReduced();
      const pulse = calm ? 0.55 : (0.45 + Math.sin(this.t * 16) * 0.25);
      const isSlam = this.sp && this.sp.type === 'tank';
      c.globalAlpha = pulse * (0.55 + frac * 0.45);
      c.strokeStyle = isSlam ? '#ff9a3d' : '#ffdd66';
      c.lineWidth = 3.2 + (1 - frac) * 2.4;
      c.beginPath();
      c.arc(0, 0, this.size * (1.38 + (1 - frac) * 0.22), 0, TAU);
      c.stroke();
      if (!calm) {
        const arrowDir = this.face >= 0 ? 1 : -1;
        c.globalAlpha = 0.55 + pulse * 0.35;
        c.fillStyle = isSlam ? '#ff9a3d' : '#ffdd66';
        const ax = arrowDir * this.size * 1.55;
        const asz = this.size * 0.42;
        c.beginPath();
        c.moveTo(ax, 0);
        c.lineTo(ax - arrowDir * asz, -asz * 0.7);
        c.lineTo(ax - arrowDir * asz * 0.45, 0);
        c.lineTo(ax - arrowDir * asz, asz * 0.7);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
    c.scale(this.face < 0 ? 1 : -1, 1); // art kijkt standaard naar links
    drawMonsterArt(c, this.sp, this.size, this.t, this.flashT > 0, this.telegraphT > 0);
    if (this.enraged && this.alive) {
      c.save();
      const calm = motionReduced();
      const flashP = this.phase2FlashT > 0
        ? clamp(this.phase2FlashT / 0.85, 0, 1)
        : 0;
      const pulse = calm ? 0.4 : (0.38 + Math.sin(this.t * 11) * 0.18);
      // Outer rage ring
      c.globalAlpha = pulse + flashP * 0.35;
      c.strokeStyle = '#ff6b6b';
      c.lineWidth = 3 + flashP * 3;
      c.beginPath();
      c.arc(0, 0, this.size * (1.35 + flashP * 0.25), 0, TAU);
      c.stroke();
      // Inner hot ring
      c.globalAlpha = 0.22 + pulse * 0.35 + flashP * 0.25;
      c.strokeStyle = '#ffb830';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, this.size * (1.12 + Math.sin(this.t * 14) * 0.04), 0, TAU);
      c.stroke();
      // Color flash wedges on phase-2 entry
      if (flashP > 0.05 && !calm) {
        const wedges = fxLite() ? 4 : 7;
        for (let i = 0; i < wedges; i++) {
          const a0 = this.t * 6 + i * (TAU / wedges);
          c.globalAlpha = flashP * (0.28 + (i % 2) * 0.12);
          c.fillStyle = i % 2 ? '#ff3040' : '#ffd75e';
          c.beginPath();
          c.moveTo(0, 0);
          c.arc(0, 0, this.size * (1.7 + flashP * 0.5), a0, a0 + 0.28);
          c.closePath();
          c.fill();
        }
        // Pixel spark ticks around rim
        if (!fxLite()) {
          for (let i = 0; i < 8; i++) {
            const a = this.t * 9 + i * (TAU / 8);
            const rr = this.size * (1.5 + flashP * 0.35);
            c.globalAlpha = flashP * 0.7;
            c.fillStyle = i % 2 ? '#fff' : '#ffb830';
            c.fillRect(
              Math.round(Math.cos(a) * rr) - 1.5,
              Math.round(Math.sin(a) * rr) - 1.5,
              3, 3
            );
          }
        }
      }
      c.restore();
    }
    if (this.jutsuTelegraphT > 0 && this.alive) {
      c.save();
      const prog = 1 - this.jutsuTelegraphT / (this.enemyJutsu === 'kamehame' ? 0.9 : 0.5);
      c.globalAlpha = 0.4 + prog * 0.35;
      c.strokeStyle = this.enemyJutsu === 'chidori' ? '#a8e0ff' : '#7cf5ff';
      c.lineWidth = 2.5 + prog * 2;
      c.beginPath();
      c.arc(0, 0, this.size * (1.2 + prog * 0.35), 0, TAU);
      c.stroke();
      c.restore();
    }
    c.restore();

    if (this.alive && this.hp < this.maxhp && !this.elite) {
      const w = this.size * 2.4;
      c.fillStyle = 'rgba(0,0,0,.5)';
      c.fillRect(this.x - w / 2, this.y - this.size - 14, w, 5);
      c.fillStyle = '#6ee06e';
      c.fillRect(this.x - w / 2, this.y - this.size - 14, w * (this.hp / this.maxhp), 5);
    }
  }
}

function drawMonsterArt(c, sp, r, t, flash, telegraph) {
  if (!sp || !c) return;
  r = clamp(Number(r) || 24, 6, 120);
  const body = flash ? (motionReduced() ? sp.c1 : '#ffffff') : (sp.c1 || '#888');
  const dark = flash ? (motionReduced() ? sp.c2 : '#dddddd') : (sp.c2 || '#444');
  const sq = 1 + Math.sin(t * 5) * 0.05;
  c.lineWidth = 2;
  const eye = (x, y, s) => {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
    c.fillStyle = '#1a1a2a'; c.beginPath(); c.arc(x - s * 0.3, y, s * 0.45, 0, TAU); c.fill();
  };
  switch (sp.art) {
    case 'slime': {
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, r * (1 - sq) * 0.5, r * 1.15 / sq, r * sq, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath(); c.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.18, -0.5, 0, TAU); c.fill();
      eye(-r * 0.4, -r * 0.1, r * 0.2); eye(r * 0.15, -r * 0.1, r * 0.2);
      c.strokeStyle = dark; c.beginPath(); c.arc(-r * 0.12, r * 0.3, r * 0.22, 0.2, Math.PI - 0.2); c.stroke();
      break;
    }
    case 'bat': {
      const flap = Math.sin(t * 13) * 0.7;
      c.fillStyle = dark;
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * r * 0.5, -r * 0.2); c.rotate(s * (0.5 + flap));
        c.beginPath(); c.moveTo(0, 0); c.lineTo(s * r * 1.5, -r * 0.7); c.lineTo(s * r * 1.2, r * 0.35); c.closePath(); c.fill();
        c.restore();
      }
      c.fillStyle = body; c.beginPath(); c.arc(0, 0, r * 0.85, 0, TAU); c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.moveTo(-r * 0.5, -r * 0.6); c.lineTo(-r * 0.3, -r * 1.15); c.lineTo(-r * 0.1, -r * 0.65); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(r * 0.5, -r * 0.6); c.lineTo(r * 0.3, -r * 1.15); c.lineTo(r * 0.1, -r * 0.65); c.closePath(); c.fill();
      eye(-r * 0.35, -r * 0.1, r * 0.22); eye(r * 0.1, -r * 0.1, r * 0.22);
      break;
    }
    case 'hedgehog': {
      c.fillStyle = telegraph ? '#ffdd66' : dark;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
        c.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
        c.lineTo(Math.cos(a + 0.35) * r * 0.7, Math.sin(a + 0.35) * r * 0.7);
        c.closePath(); c.fill();
      }
      c.fillStyle = body; c.beginPath(); c.arc(0, 0, r * 0.9, 0, TAU); c.fill();
      c.fillStyle = dark; c.beginPath(); c.ellipse(-r * 0.85, r * 0.15, r * 0.35, r * 0.25, 0, 0, TAU); c.fill();
      eye(-r * 0.45, -r * 0.15, r * 0.18);
      break;
    }
    case 'ghost': {
      c.globalAlpha *= 0.88;
      c.fillStyle = body;
      c.beginPath();
      c.arc(0, -r * 0.15, r * 0.9, Math.PI, 0);
      const n = 4;
      for (let i = 0; i <= n; i++) {
        const x = r * 0.9 - (i / n) * r * 1.8;
        const y = r * 0.75 + Math.sin(t * 4 + i * 2) * r * 0.12 * ((i % 2) ? 1 : -1);
        c.lineTo(x, y);
      }
      c.closePath(); c.fill();
      eye(-r * 0.35, -r * 0.2, r * 0.2); eye(r * 0.15, -r * 0.2, r * 0.2);
      c.fillStyle = dark; c.beginPath(); c.ellipse(-r * 0.1, r * 0.15, r * 0.14, r * 0.2, 0, 0, TAU); c.fill();
      break;
    }
    case 'can': {
      c.fillStyle = body;
      c.fillRect(-r * 0.7, -r, r * 1.4, r * 2);
      c.fillStyle = dark;
      c.fillRect(-r * 0.7, -r, r * 1.4, r * 0.3);
      c.fillRect(-r * 0.7, r * 0.7, r * 1.4, r * 0.3);
      c.strokeStyle = dark; c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r * 1.5); c.stroke();
      c.fillStyle = '#ff5d5d'; c.beginPath(); c.arc(0, -r * 1.55, r * 0.14, 0, TAU); c.fill();
      c.fillStyle = '#20242e'; c.beginPath(); c.arc(-r * 0.15, -r * 0.3, r * 0.32, 0, TAU); c.fill();
      c.fillStyle = Math.sin(t * 6) > 0 ? '#7cf5ff' : '#3fa8b8';
      c.beginPath(); c.arc(-r * 0.15, -r * 0.3, r * 0.16, 0, TAU); c.fill();
      break;
    }
    case 'fox': {
      // vlammende staart
      c.fillStyle = '#ffd166';
      c.beginPath(); c.ellipse(r * 1.1, -r * 0.1 + Math.sin(t * 8) * 3, r * 0.55, r * 0.3, 0.3, 0, TAU); c.fill();
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-r * 0.55, -r * 0.5); c.lineTo(-r * 0.75, -r * 1.25); c.lineTo(-r * 0.15, -r * 0.7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(r * 0.1, -r * 0.6); c.lineTo(r * 0.05, -r * 1.3); c.lineTo(r * 0.55, -r * 0.65); c.closePath(); c.fill();
      c.fillStyle = dark;
      c.beginPath(); c.moveTo(-r, 0); c.lineTo(-r * 1.35, r * 0.15); c.lineTo(-r * 0.85, r * 0.3); c.closePath(); c.fill();
      eye(-r * 0.45, -r * 0.2, r * 0.17);
      break;
    }
    case 'golem': {
      c.fillStyle = body;
      const rr2 = r * 0.9;
      c.beginPath();
      c.moveTo(-rr2, r); c.lineTo(-rr2 * 1.05, -r * 0.4); c.lineTo(-r * 0.4, -r);
      c.lineTo(r * 0.5, -r * 0.95); c.lineTo(rr2 * 1.05, -r * 0.2); c.lineTo(rr2, r);
      c.closePath(); c.fill();
      c.strokeStyle = dark; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-r * 0.4, -r * 0.5); c.lineTo(-r * 0.1, 0); c.lineTo(-r * 0.35, r * 0.5); c.stroke();
      c.beginPath(); c.moveTo(r * 0.4, -r * 0.3); c.lineTo(r * 0.2, r * 0.25); c.stroke();
      // armen
      c.fillStyle = dark;
      const raise = telegraph ? -r * 0.8 : 0;
      c.beginPath(); c.arc(-r * 1.15, r * 0.15 + raise, r * 0.42, 0, TAU); c.fill();
      c.beginPath(); c.arc(r * 1.15, r * 0.3, r * 0.38, 0, TAU); c.fill();
      c.fillStyle = telegraph ? '#ff9a3d' : '#ffd75e';
      c.beginPath(); c.arc(-r * 0.35, -r * 0.45, r * 0.13, 0, TAU); c.fill();
      c.beginPath(); c.arc(r * 0.1, -r * 0.45, r * 0.13, 0, TAU); c.fill();
      break;
    }
    case 'dragon': {
      const flap = Math.sin(t * 6) * 0.55;
      // vleugels
      c.fillStyle = dark;
      for (const s of [-1, 1]) {
        c.save(); c.translate(s * r * 0.25, -r * 0.45); c.rotate(s * (0.35 + flap) - (s < 0 ? 0.2 : -0.2));
        c.beginPath(); c.moveTo(0, 0);
        c.lineTo(s * r * 1.7, -r * 1.05); c.lineTo(s * r * 1.9, -r * 0.2); c.lineTo(s * r * 0.9, r * 0.15);
        c.closePath(); c.fill(); c.restore();
      }
      // staart
      c.strokeStyle = body; c.lineWidth = r * 0.28; c.lineCap = 'round';
      c.beginPath(); c.moveTo(r * 0.5, r * 0.1);
      c.quadraticCurveTo(r * 1.4, r * 0.3, r * 1.7, -r * 0.25 + Math.sin(t * 3) * 6); c.stroke();
      // lijf
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, 0, r, r * 0.78, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffe9c9';
      c.beginPath(); c.ellipse(-r * 0.25, r * 0.25, r * 0.5, r * 0.4, 0, 0, TAU); c.fill();
      // nek + kop
      c.fillStyle = body;
      c.beginPath(); c.ellipse(-r * 0.85, -r * 0.75, r * 0.5, r * 0.4, -0.4, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-r * 1.25, -r * 0.8); c.lineTo(-r * 1.7, -r * 0.6); c.lineTo(-r * 1.2, -r * 0.5); c.closePath(); c.fill();
      // hoorns
      c.fillStyle = '#ffe9c9';
      c.beginPath(); c.moveTo(-r * 0.75, -r * 1.05); c.lineTo(-r * 0.65, -r * 1.5); c.lineTo(-r * 0.5, -r * 1.0); c.closePath(); c.fill();
      eye(-r * 1.0, -r * 0.85, r * 0.13);
      break;
    }
    case 'shark': {
      const wag = Math.sin(t * 5.5) * 0.08;
      c.save(); c.rotate(wag);
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 0, r * 1.15, r * 0.62, 0, 0, TAU);
      c.fill();
      c.fillStyle = dark;
      c.beginPath();
      c.moveTo(0, -r * 0.55);
      c.lineTo(r * 0.08, -r * 1.05);
      c.lineTo(r * 0.22, -r * 0.5);
      c.closePath();
      c.fill();
      c.fillStyle = body;
      c.beginPath();
      c.moveTo(r * 1.05, 0);
      c.lineTo(r * 1.55, r * 0.22);
      c.lineTo(r * 1.0, r * 0.08);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.22)';
      c.beginPath();
      c.ellipse(-r * 0.15, -r * 0.12, r * 0.42, r * 0.14, -0.2, 0, TAU);
      c.fill();
      c.fillStyle = dark;
      c.beginPath();
      c.moveTo(-r * 0.95, r * 0.05);
      c.lineTo(-r * 1.35, r * 0.35);
      c.lineTo(-r * 0.75, r * 0.22);
      c.closePath();
      c.fill();
      eye(-r * 0.55, -r * 0.12, r * 0.14);
      c.fillStyle = '#fff';
      c.beginPath();
      c.moveTo(-r * 1.05, r * 0.02);
      c.lineTo(-r * 1.22, r * 0.14);
      c.lineTo(-r * 1.02, r * 0.12);
      c.closePath();
      c.fill();
      c.restore();
      break;
    }
    case 'octo': {
      c.fillStyle = body;
      c.beginPath();
      c.arc(0, -r * 0.2, r * 0.82, 0, TAU);
      c.fill();
      c.strokeStyle = dark;
      c.lineWidth = Math.max(2, r * 0.14);
      c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * 0.15 + (i / 5) * Math.PI * 0.7;
        const len = r * (1.05 + Math.sin(t * 4 + i * 1.7) * 0.12);
        const ex = Math.cos(a) * len;
        const ey = Math.sin(a) * len * 0.55 + r * 0.35;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 0.55, -r * 0.05 + Math.sin(a) * r * 0.35);
        c.quadraticCurveTo(ex * 0.55, ey * 0.7, ex, ey);
        c.stroke();
      }
      eye(-r * 0.28, -r * 0.28, r * 0.16);
      eye(r * 0.12, -r * 0.28, r * 0.16);
      break;
    }
    case 'tideFox':
    case 'tideSnake':
    case 'tideToad':
    case 'tideSlug':
    case 'tideTanuki':
    case 'tideOx':
    case 'tideMonkey':
    case 'tideHawk':
    case 'tideHound':
      if (typeof drawTideBossArt === 'function') {
        try { drawTideBossArt(c, sp.art, r, t, body, dark, flash, telegraph); } catch (err) {
          console.error('[TideArt]', sp.art, err);
          c.fillStyle = body;
          c.beginPath(); c.ellipse(0, 0, r, r * 0.82, 0, 0, TAU); c.fill();
        }
      } else {
        c.fillStyle = body;
        c.beginPath(); c.ellipse(0, 0, r, r * 0.82, 0, 0, TAU); c.fill();
      }
      break;
    case 'satan': {
      if (typeof drawSatanSvgArt === 'function' && drawSatanSvgArt(c, r, t, flash, telegraph)) {
        break;
      }
      c.fillStyle = dark;
      c.beginPath();
      c.moveTo(-r * 1.1, r * 0.55);
      c.quadraticCurveTo(0, r * 1.15, r * 1.1, r * 0.55);
      c.lineTo(r * 0.85, -r * 0.2);
      c.quadraticCurveTo(0, r * 0.35, -r * 0.85, -r * 0.2);
      c.closePath();
      c.fill();
      c.fillStyle = body;
      c.beginPath(); c.arc(0, -r * 0.08, r * 0.92, 0, TAU); c.fill();
      c.fillStyle = dark;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * r * 0.42, -r * 0.72);
        c.lineTo(s * r * 0.62, -r * 1.28);
        c.lineTo(s * r * 0.18, -r * 0.85);
        c.closePath();
        c.fill();
      }
      c.strokeStyle = '#ffd75e';
      c.lineWidth = Math.max(2, r * 0.08);
      c.beginPath();
      c.moveTo(r * 0.55, r * 0.15);
      c.quadraticCurveTo(r * 1.35, r * 0.55, r * 0.7, r * 1.05);
      c.stroke();
      c.fillStyle = '#ffd75e';
      c.beginPath(); c.arc(r * 0.72, r * 1.08, r * 0.12, 0, TAU); c.fill();
      eye(-r * 0.32, -r * 0.12, r * 0.16);
      eye(r * 0.22, -r * 0.12, r * 0.16);
      c.fillStyle = '#1a0a10';
      c.beginPath(); c.ellipse(0, r * 0.28, r * 0.22, r * 0.1, 0, 0, Math.PI); c.fill();
      break;
    }
    case 'cow':
    case 'pig':
    case 'chicken':
    case 'sheep':
    case 'horse':
    case 'goat':
    case 'duck':
    case 'rooster':
    case 'donkey':
    case 'goose':
    case 'elephant':
    case 'lion':
    case 'tiger':
    case 'giraffe':
    case 'hippo':
    case 'rhino':
    case 'gorilla':
    case 'zebra':
    case 'bear':
    case 'croc':
    case 'kangaroo':
    case 'panda':
    case 'flamingo':
    case 'camel':
      if (typeof drawBeastArt === 'function') {
        try { drawBeastArt(c, sp.art, r, t, body, dark, flash, telegraph); } catch (err) {
          console.error('[BeastArt]', sp.art, err);
          c.fillStyle = body;
          c.beginPath(); c.ellipse(0, 0, r, r * 0.82, 0, 0, TAU); c.fill();
        }
      } else {
        c.fillStyle = body;
        c.beginPath(); c.ellipse(0, 0, r, r * 0.82, 0, 0, TAU); c.fill();
      }
      break;
    default:
      c.fillStyle = body;
      c.beginPath(); c.ellipse(0, 0, r, r * 0.82, 0, 0, TAU); c.fill();
      c.strokeStyle = dark;
      c.lineWidth = Math.max(2, r * 0.08);
      c.stroke();
      break;
  }
}

