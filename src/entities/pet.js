/* ============================== PET FOLLOWER ========================== */
/** Shared chase so combat pets + egg companions stay glued to the player. */
function companionFollow(ent, p, opts) {
  opts = opts || {};
  const dt = opts.dt || 0.016;
  const side = opts.side == null ? -1 : opts.side;
  const dist = opts.dist != null ? opts.dist : (typeof IS_TOUCH !== 'undefined' && IS_TOUCH ? 32 : 36);
  const hoverY = opts.hoverY != null ? opts.hoverY : -8;
  const bob = opts.bob || 0;
  const face = p.face || 1;
  const predX = clamp((p.vx || 0) * 0.09, -48, 48);
  const predY = clamp((p.vy || 0) * 0.07, -52, 36);
  const tx = p.x + side * face * dist + predX;
  const ty = p.y + hoverY + bob + predY;
  const dx = tx - ent.x;
  const dy = ty - ent.y;
  const gap = Math.hypot(dx, dy);
  const reduced = typeof motionReduced === 'function' && motionReduced();
  const flipped = ent._followFace != null && ent._followFace !== face;
  ent._followFace = face;
  if (gap > 170) {
    ent.x += dx * 0.62;
    ent.y += dy * 0.62;
    return { tx, ty, gap, flipped };
  }
  const dash = Math.abs(p.vx || 0) > 280;
  const moving = Math.abs(p.vx || 0) > 48;
  const airborne = !p.onGround || Math.abs(p.vy || 0) > 80;
  let omega = reduced ? 11 : (opts.traveling ? 28 : (dash ? 32 : (moving ? 26 : 19)));
  if (!reduced && flipped) omega = Math.max(omega, 34);
  if (!reduced && airborne) omega = Math.max(omega, 27);
  const a = 1 - Math.exp(-omega * dt);
  ent.x += dx * a;
  ent.y += dy * a;
  return { tx, ty, gap, flipped };
}

function petPickAssistTarget(g, p) {
  const inAdv = g.mode === 'adventure';
  const inTrain = g.mode === 'training';
  let tgt = null;
  let best = 1e9;
  if (inTrain) {
    tgt = g.robot && g.robot.alive ? g.robot : null;
    best = tgt ? Math.abs(tgt.x - p.x) : 1e9;
  } else if (inAdv && g.monsters) {
    for (const m of g.monsters) {
      if (!m.alive) continue;
      const d = Math.abs(m.x - p.x);
      if (d < best) { best = d; tgt = m; }
    }
  }
  return { tgt, dist: best };
}

class Pet {
  constructor(def, game) {
    this.def = def;
    this.sp = SPECIES[def.speciesId];
    this.game = game;
    this.x = game.player ? game.player.x - 36 : W * 0.2;
    this.y = game.player ? game.player.y : game.ground;
    this.face = 1;
    this.t = Math.random() * 6;
    this.assistT = 1.8;
    this.assistCd = (def.cd || 5) * (petUpgradeBonuses(def.id).cdMul || 1);
    this.size = Math.max(9, Math.round((this.sp?.size || 14) * 0.52));
    this.flashT = 0;
    this.spawnT = motionReduced() ? 0 : 0.32;
    this.windT = 0;
    this.windX = 0;
    this.lungeT = 0;
    this.lungeX = 0;
    this.squash = 1;
    this.followGap = 0;
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p || !p.alive) return;
    this.t += dt;
    if (this.flashT > 0) this.flashT = Math.max(0, this.flashT - dt);
    if (this.lungeT > 0) this.lungeT = Math.max(0, this.lungeT - dt);
    if (this.spawnT > 0) this.spawnT = Math.max(0, this.spawnT - dt);
    const bob = Math.sin(this.t * 6.4) * 1.6;
    const follow = companionFollow(this, p, {
      dt, side: -1, bob: bob * 0.2,
      dist: typeof IS_TOUCH !== 'undefined' && IS_TOUCH ? 32 : 36,
      hoverY: -8, traveling: !!g.traveling,
    });
    this.followGap = follow.gap;
    this.face = p.face || 1;

    const inAdv = g.mode === 'adventure';
    const inTrain = g.mode === 'training';
    if ((!inAdv && !inTrain) || g.over || g.inputLocked) {
      this.windT = 0;
      return;
    }
    if (inAdv && !g.monsters.some(m => m.alive)) { this.windT = 0; return; }
    if (inTrain && (!g.robot || !g.robot.alive)) { this.windT = 0; return; }

    this.assistT -= dt;
    const windWin = (typeof motionReduced === 'function' && motionReduced()) ? 0.12 : 0.28;
    const pick = petPickAssistTarget(g, p);
    if (this.assistT > 0) {
      if (this.assistT <= windWin && pick.tgt && pick.dist <= 420) {
        this.windT = 1 - (this.assistT / windWin);
        this.windX = pick.tgt.x;
        this.face = Math.sign(pick.tgt.x - this.x) || this.face;
      } else {
        this.windT = 0;
      }
      return;
    }

    if (!pick.tgt || pick.dist > 420) {
      this.assistT = 0.1;
      this.windT = 0;
      return;
    }

    this.assistCd = (this.def.cd || 5) * (petUpgradeBonuses(this.def.id).cdMul || 1);
    this.assistT = this.assistCd;
    this.windT = 0;

    const tgt = pick.tgt;
    const wasAlive = !!tgt.alive;
    const up = petUpgradeBonuses(this.def.id);
    const mul = (this.def.assistMul || 0.3) * (up.assistMul || 1) * (g.stageDmgMul || 1) * (g.petDmgMul || 1);
    const dmg = Math.max(4, Math.round(p.baseDmg * mul));
    const kb = Math.sign(tgt.x - this.x || p.face) * (120 + dmg * 2.2);
    tgt.takeDamage(dmg, kb, g);
    this.flashT = 0.2;
    this.lungeT = 0.16;
    this.lungeX = Math.sign(tgt.x - this.x || 1) * 14;
    this.face = Math.sign(tgt.x - this.x) || this.face;
    const col = this.sp?.c1 || '#7cf5ff';
    g.floater(tgt.x, tgt.y - tgt.size - 18, `${this.sp?.name || 'Pet'} −${dmg}`, col, 11);
    const lite = typeof fxLite === 'function' && fxLite();
    if (!lite) g.burst(this.x, this.y - this.size, col, 6, { kind: 'spark', size: 2.0 });
    if (wasAlive && !tgt.alive && !lite) {
      g.burst(tgt.x, tgt.y - (tgt.size || 20), col, 8, { kind: 'spark', size: 2.4 });
      if (typeof spawnFxRing === 'function') {
        try { spawnFxRing(g, tgt.x, tgt.y - (tgt.size || 20) * 0.4, col, 10); } catch (_) {}
      }
    }
    try { AudioSys.sfxAt('hit', tgt.x); } catch (_) {}
  }

  draw(c) {
    if (!this.sp) return;
    const appear = this.spawnT > 0 ? clamp(1 - this.spawnT / 0.32, 0, 1) : 1;
    const lunge = this.lungeT > 0 ? (this.lungeT / 0.16) : 0;
    const wind = this.windT || 0;
    const lean = (wind * 7 + lunge * this.lungeX);
    const stretch = this.followGap > 42 ? clamp((this.followGap - 42) / 90, 0, 0.12) : 0;
    const sc = 0.28 + appear * 0.72;
    const squash = 1 + (this.flashT > 0 ? 0.08 : 0) - wind * 0.04;
    const col = this.sp.c1 || '#7cf5ff';
    const lite = typeof fxLite === 'function' && fxLite();
    const reduced = typeof motionReduced === 'function' && motionReduced();
    const touch = typeof IS_TOUCH !== 'undefined' && IS_TOUCH;

    if (wind > 0.08 && !reduced) {
      c.save();
      c.globalAlpha = 0.32 + wind * 0.5;
      c.strokeStyle = col;
      c.lineWidth = lite ? 1.8 : (touch ? 2.6 : 2.2);
      c.beginPath();
      c.arc(this.x, this.y - this.size * 0.4, this.size * (1.22 + wind * 0.95), 0, TAU);
      c.stroke();
      if (this.windX) {
        const dir = Math.sign(this.windX - this.x) || 1;
        const tip = this.x + dir * (this.size + 18 + wind * 10);
        const midY = this.y - this.size * 0.55;
        c.globalAlpha = 0.18 + wind * 0.28;
        if (typeof c.setLineDash === 'function') c.setLineDash([4, 5]);
        c.lineWidth = lite ? 1.2 : 1.6;
        c.beginPath();
        c.moveTo(this.x + dir * (this.size + 2), midY);
        c.lineTo(this.x + dir * Math.min(56, Math.abs(this.windX - this.x) * 0.22), midY);
        c.stroke();
        if (typeof c.setLineDash === 'function') c.setLineDash([]);
        c.globalAlpha = 0.42 + wind * 0.48;
        c.lineWidth = lite ? 1.6 : 2.2;
        c.beginPath();
        c.moveTo(this.x + dir * (this.size + 4), midY);
        c.lineTo(tip, midY);
        c.stroke();
        c.beginPath();
        c.moveTo(tip, midY);
        c.lineTo(tip - dir * (6 + wind * 2), midY - 5);
        c.lineTo(tip - dir * (6 + wind * 2), midY + 5);
        c.closePath();
        c.fillStyle = col;
        c.fill();
      }
      c.restore();
    }

    c.save();
    c.translate(this.x + lean, this.y - this.size * 0.35);
    if (this.face < 0) { c.scale(-1, 1); }
    c.scale(sc * (2 - squash + stretch), sc * squash);
    c.globalAlpha = 0.62 + appear * 0.36;
    if (appear < 1 && !lite && !reduced) {
      c.save();
      c.globalAlpha = (1 - appear) * 0.55;
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, this.size * (1.3 + (1 - appear) * 1.5), 0, TAU);
      c.stroke();
      c.restore();
    }
    drawMonsterArt(c, this.sp, this.size, this.t, this.flashT > 0, false);
    c.globalAlpha = 1;
    c.restore();
    c.save();
    c.globalAlpha = 0.5 + appear * 0.25;
    c.fillStyle = wind > 0.2 ? col : 'rgba(124,245,255,.75)';
    c.beginPath();
    c.arc(this.x + lean * 0.4, this.y - this.size * 1.15, wind > 0.2 ? 3.1 : 2.2, 0, TAU);
    c.fill();
    c.restore();
  }
}

function spawnGamePet(game, opts) {
  if (!game) return;
  game.pet = null;
  const def = activePetDef();
  if (!def) return;
  game.pet = new Pet(def, game);
  const fromEquip = !!(opts && opts.fromEquip);
  if (fromEquip) {
    game.pet.flashT = 0.18;
    game.pet.spawnT = motionReduced() ? 0 : 0.32;
  }
  const sp = SPECIES[def.speciesId];
  const col = sp?.c1 || '#7cf5ff';
  const col2 = sp?.c2 || '#ffffff';
  if (typeof spawnCompanionSparkles === 'function') {
    spawnCompanionSparkles(game, game.pet.x, game.pet.y - game.pet.size * 0.6, col, {
      color2: col2,
      big: fromEquip,
    });
  }
}

function applyPetBonusesToPlayer(game, player) {
  if (!player) return;
  const pb = petPassiveBonus();
  game.petDmgMul = pb.dmgMul || 1;
  game.petEnergyMul = pb.energyMul || 1;
  game.petCritBonus = pb.critBonus || 0;
  game.petShieldWave = pb.shieldWave || 0;
  if (pb.maxHp) {
    player.maxhp += pb.maxHp;
    player.hp += pb.maxHp;
  }
  if (pb.dmgMul && pb.dmgMul !== 1) {
    player.baseDmg = Math.round(player.baseDmg * pb.dmgMul);
  }
  if (pb.speedMul && pb.speedMul !== 1) {
    player.speed = Math.round(player.speed * pb.speedMul);
  }
}
