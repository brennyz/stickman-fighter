/* ============================== MONSTER ================================ */
class Monster {
  constructor(spId, x, game, opts) {
    const sp = SPECIES[spId];
    opts = opts || {};
    const eliteMul = opts.elite ? 1.7 : 1;
    this.spId = spId; this.sp = sp;
    this.elite = !!opts.elite;
    this.superBoss = !!opts.superBoss;
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
    if (opts.giant && !this.superBoss) {
      this.giant = true;
      this.size = Math.round(this.size * GIANT_SIZE_MUL);
      this.maxhp = Math.round(this.maxhp * GIANT_HP_MUL);
      this.hp = this.maxhp;
      this.dmg = Math.round(this.dmg * GIANT_DMG_MUL);
    }
    this.speed = sp.speed;
    this.x = x;
    this.flying = sp.type === 'fly' || sp.type === 'dragon';
    this.y = this.flying ? game.ground - rand(90, 160) : game.ground - this.size;
    this.vx = 0; this.vy = 0;
    this.t = rand(0, 10); this.flashT = 0; this.deadT = -1;
    this.atkCD = rand(0.5, 1.5); this.shootCD = rand(1, 2.5);
    this.dashT = 0; this.telegraphT = 0; this.hopT = rand(0, 0.8);
    this.face = -1;
    this.enraged = false;
    this.introT = 0;
    this.introTier = null;
  }
  get alive() { return this.hp > 0; }

  update(dt, game) {
    this.t += dt;
    if (this.introT > 0) this.introT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (!this.alive) { this.deadT += dt; return; }
    const p = game.player;
    const dx = p.x - this.x, dir = Math.sign(dx) || 1, dist = Math.abs(dx);
    this.face = dir;
    this.atkCD -= dt; this.shootCD -= dt;
    const spdMul = this.enraged ? 1.32 : 1;
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
          this.telegraphT = this.enraged ? 0.28 : 0.45;
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
        if (dist < this.size + 48 && this.atkCD <= 0) { this.telegraphT = 0.55; this.atkCD = 2.0; AudioSys.sfx('roar'); }
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
    }
    this.x = clamp(this.x, game.minX - 20, game.maxX + 20);

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

  takeDamage(dmg, kbx, game, opts) {
    opts = opts || {};
    if (!this.alive) return;
    if (this.elite && !this.enraged && this.hp - dmg <= this.maxhp * 0.5) {
      this.enraged = true;
      this.speed = Math.round(this.speed * 1.28);
      this.dmg = Math.round(this.dmg * 1.22);
      game.banner(`${this.sp.name} — FASE 2!`, 1.6, '#ff6b6b', 36);
      AudioSys.sfx('roar');
      game.shake(9, 0.28);
      haptic(28);
    }
    this.hp -= dmg;
    this.flashT = motionReduced() ? 0.06 : (dmg >= 18 ? 0.14 : opts.crit ? 0.12 : 0.1);
    const kb = scaleKnockback(kbx, dmg, { crit: opts.crit, kind: opts.kind });
    this.x += Math.sign(kb || 1) * clamp(Math.abs(kb) * 0.038, 5, 26);
    game.floater(this.x, this.y - this.size - 14, '-' + dmg, '#ffe680', 15);
    game.burst(this.x, this.y, this.sp.c1, dmg >= 18 ? 9 : 6);
    if (opts.crit) spawnFxRing(game, this.x, this.y - this.size * 0.4, '#ffd75e', fxLite() ? 5 : 8);
    if (this.hp <= 0) {
      this.hp = 0; this.deadT = 0;
      AudioSys.sfxAt('die', this.x);
      const burstN = fxLite() ? 6 : (this.superBoss ? 14 : (this.elite ? 12 : 10));
      game.burst(this.x, this.y, this.sp.c1, burstN);
      game.onMonsterKilled(this);
    } else if (!opts.skipHitSfx) {
      AudioSys.sfxAt('hit', this.x);
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
    if (!this.flying) {
      c.save(); c.fillStyle = 'rgba(0,0,0,.28)';
      c.beginPath(); c.ellipse(0, this.size - 2, this.size, this.size * 0.24, 0, 0, TAU); c.fill(); c.restore();
    }
    // rariteit-aura
    const rar = rarityOf(this.sp.rarity);
    if (this.introT > 0 && this.alive) {
      c.save();
      const p = clamp(this.introT / 1.6, 0, 1);
      const pulse = 1 + Math.sin(this.t * 14) * 0.08;
      c.globalAlpha = 0.25 + p * 0.45;
      c.strokeStyle = this.introTier === 'superBoss' ? '#ffd75e' : (this.introTier === 'boss' ? '#ff6b6b' : '#c47aff');
      c.lineWidth = 4 + p * 4;
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
      c.restore();
    }
    if (rar.order >= 2 && this.alive) {
      c.save();
      c.strokeStyle = this.superBoss ? '#ffd75e' : rar.glow; c.lineWidth = 3 + rar.order * 0.4;
      c.beginPath(); c.ellipse(0, 0, this.size * 1.55, this.size * 1.2, 0, 0, TAU); c.stroke();
      if (rar.order >= 4) {
        c.globalAlpha = 0.25 + Math.sin(this.t * 6) * 0.1;
        c.fillStyle = rar.color;
        c.beginPath(); c.ellipse(0, 0, this.size * 1.7, this.size * 1.35, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    if (this.giant && this.alive) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.t * 4) * 0.08;
      c.strokeStyle = '#ffd75e'; c.lineWidth = 2.5;
      c.beginPath(); c.ellipse(0, this.size * 0.82, this.size * 1.28, this.size * 0.24, 0, 0, TAU); c.stroke();
      c.restore();
    }
    c.scale(this.face < 0 ? 1 : -1, 1); // art kijkt standaard naar links
    drawMonsterArt(c, this.sp, this.size, this.t, this.flashT > 0, this.telegraphT > 0);
    if (this.enraged && this.alive) {
      c.save();
      c.globalAlpha = 0.35 + Math.sin(this.t * 10) * 0.15;
      c.strokeStyle = '#ff6b6b'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, this.size * 1.35, 0, TAU); c.stroke();
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
  const body = flash ? (motionReduced() ? sp.c1 : '#ffffff') : sp.c1;
  const dark = flash ? (motionReduced() ? sp.c2 : '#dddddd') : sp.c2;
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
  }
}

