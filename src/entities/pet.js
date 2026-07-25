/* ============================== PET FOLLOWER ========================== */
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
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p || !p.alive) return;
    this.t += dt;
    if (this.flashT > 0) this.flashT -= dt;
    const bob = Math.sin(this.t * 6) * 2;
    const tx = p.x - p.face * (IS_TOUCH ? 34 : 38);
    const ty = p.y - 6 + bob * 0.25;
    const follow = g.traveling ? 11 : 8;
    this.x += (tx - this.x) * Math.min(1, dt * follow);
    this.y += (ty - this.y) * Math.min(1, dt * 10);
    this.face = p.face || 1;

    const inAdv = g.mode === 'adventure';
    const inTrain = g.mode === 'training';
    if ((!inAdv && !inTrain) || g.over || g.inputLocked) return;
    if (inAdv && !g.monsters.some(m => m.alive)) return;
    if (inTrain && (!g.robot || !g.robot.alive)) return;
    this.assistT -= dt;
    if (this.assistT > 0) return;
    this.assistCd = (this.def.cd || 5) * (petUpgradeBonuses(this.def.id).cdMul || 1);
    this.assistT = this.assistCd;

    let tgt = null;
    let best = 1e9;
    if (inTrain) {
      tgt = g.robot;
      best = Math.abs(tgt.x - p.x);
    } else {
      for (const m of g.monsters) {
        if (!m.alive) continue;
        const d = Math.abs(m.x - p.x);
        if (d < best) { best = d; tgt = m; }
      }
    }
    if (!tgt || best > 420) return;

    const up = petUpgradeBonuses(this.def.id);
    const mul = (this.def.assistMul || 0.3) * (up.assistMul || 1) * (g.stageDmgMul || 1) * (g.petDmgMul || 1);
    const dmg = Math.max(4, Math.round(p.baseDmg * mul));
    const kb = Math.sign(tgt.x - this.x || p.face) * (120 + dmg * 2.2);
    tgt.takeDamage(dmg, kb, g);
    this.flashT = 0.12;
    const col = this.sp?.c1 || '#7cf5ff';
    g.floater(tgt.x, tgt.y - tgt.size - 18, `${this.sp?.name || 'Pet'} −${dmg}`, col, 11);
    if (!fxLite()) g.burst(this.x, this.y - this.size, col, 4, { kind: 'spark', size: 1.8 });
    try { AudioSys.sfxAt('hit', tgt.x); } catch (_) {}
  }

  draw(c) {
    if (!this.sp) return;
    c.save();
    c.translate(this.x, this.y - this.size * 0.35);
    if (this.face < 0) { c.scale(-1, 1); }
    c.globalAlpha = 0.94;
    drawMonsterArt(c, this.sp, this.size, this.t, this.flashT > 0, false);
    c.globalAlpha = 1;
    c.restore();
    c.save();
    c.fillStyle = 'rgba(124,245,255,.75)';
    c.beginPath();
    c.arc(this.x, this.y - this.size * 1.15, 2.2, 0, TAU);
    c.fill();
    c.restore();
  }
}

function spawnGamePet(game) {
  if (!game) return;
  game.pet = null;
  const def = activePetDef();
  if (!def) return;
  game.pet = new Pet(def, game);
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
