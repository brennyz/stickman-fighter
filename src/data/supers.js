/* ============================== SUPERS ================================= */
/** Nood-super (Kets-slot) — vervangbaar via Collectie → Skills · alleen avontuur. */
const SUPERS = [
  { id: 'ketsbam', name: 'KETS-BAM', needLvl: 1,
    behavior: 'blast', icon: 'star',
    color: '#ffd75e', color2: '#ff7043',
    chargeBanner: 'KETS!', finishBanner: 'KETS-BAM!',
    chargeSfx: 'ketsbamCharge', finishSfx: 'ketsbam',
    cd: 9, chargeDur: 1.15, blastR: 192, power: 5,
    hint: 'Standaard', tooltip: 'Omringd? Laad op en knal alles weg — klassieke nood-ontsnapping.',
    bonus: 'AOE schade-blast', tags: ['blast', 'knockback'] },
  { id: 'iron_shield', name: 'IJzeren schild', needLvl: 5,
    behavior: 'shield', icon: 'shield',
    color: '#9fd8ff', color2: '#5a9fd4',
    chargeBanner: 'SCHILD!', finishBanner: 'BLOKADE!',
    chargeSfx: 'super_shield_charge', finishSfx: 'super_shield',
    shieldDur: 9, shieldMul: 0.18, cd: 9, chargeDur: 2.1, blastR: 168, power: 3,
    hint: 'Lv 5', tooltip: 'Trek een ijzeren koepel — langdurige schade-reductie + kleine shockwave.',
    bonus: 'Lang schild + push', tags: ['defense', 'push'] },
  { id: 'heal_wave', name: 'Genezingsgolf', needLvl: 8,
    behavior: 'heal', icon: 'heart',
    color: '#6ee06e', color2: '#43b25b',
    chargeBanner: 'HEAL!', finishBanner: 'GENEZING!',
    chargeSfx: 'super_heal_charge', finishSfx: 'super_heal',
    healPct: 0.38, cd: 9, chargeDur: 1.9, blastR: 176, power: 3,
    hint: 'Lv 8', tooltip: 'Energy-golf herstelt HP en ruimt vijanden licht weg.',
    bonus: 'HP + lichte push', tags: ['heal', 'push'] },
  { id: 'mind_eye', name: 'Mind Eye', needLvl: 12,
    behavior: 'mind_eye', icon: 'eye',
    color: '#e04040', color2: '#8b0000',
    chargeBanner: 'EYE LOCK!', finishBanner: 'MIND BIND!',
    chargeSfx: 'super_mind_eye_charge', finishSfx: 'super_mind_eye',
    slowDur: 1.5, slowMul: 0.22, cd: 9, chargeDur: 2, blastR: 188, power: 4,
    hint: 'Lv 12', tooltip: 'Oog-illusion: vertraagt vijanden, trekt ze naar je toe en slaat hard toe.',
    bonus: 'Slow + pull + hit', tags: ['illusion', 'pull', 'slow'] },
  { id: 'lightning_storm', name: 'Bliksemstorm', needLvl: 15,
    behavior: 'lightning', icon: 'bolt',
    color: '#a8e0ff', color2: '#5ad0ff',
    chargeBanner: 'STORM!', finishBanner: 'THUNDER!',
    chargeSfx: 'super_lightning_charge', finishSfx: 'super_lightning',
    strikes: 8, cd: 9, chargeDur: 1.85, blastR: 200, power: 4,
    hint: 'Lv 15', tooltip: 'Ultra-snelle bliksemslagen op alle nabije vijanden — één voor één.',
    bonus: 'Multi-bolt spam', tags: ['lightning', 'multi-hit'] },
  { id: 'meteor_strike', name: 'Meteoorregen', needLvl: 18,
    behavior: 'meteor', icon: 'meteor',
    color: '#ff8c42', color2: '#ff7043',
    chargeBanner: 'METEOR!', finishBanner: 'METEOR REGEN!',
    chargeSfx: 'super_meteor_charge', finishSfx: 'super_meteor',
    meteors: 6, cd: 9, chargeDur: 2.05, blastR: 204, power: 4,
    hint: 'Lv 18', tooltip: 'Vallende meteoren op het slagveld — brede zone-schade.',
    bonus: 'Zone meteors', tags: ['meteor', 'zone'] },
  { id: 'berserk_rage', name: 'Berserk', needLvl: 20,
    behavior: 'rage', icon: 'rage',
    color: '#ff7a4d', color2: '#ff3d3d',
    chargeBanner: 'RAGE!', finishBanner: 'BERSERK!',
    chargeSfx: 'super_rage_charge', finishSfx: 'super_rage',
    rageDur: 10, rageMul: 1.48, cd: 9, chargeDur: 1.95, blastR: 180, power: 4,
    hint: 'Lv 20', tooltip: 'Ontketen woede — langdurige schade-boost + shockwave.',
    bonus: 'Schade-buff + push', tags: ['buff', 'push'] },
  { id: 'timestop', name: 'Tijd-stil', needLvl: 22,
    behavior: 'timestop', icon: 'clock',
    color: '#c47aff', color2: '#7cf5ff',
    chargeBanner: 'TIJD!', finishBanner: 'STILSTAND!',
    chargeSfx: 'super_time_charge', finishSfx: 'super_time',
    freezeDur: 0.26, slowDur: 2.6, slowMul: 0.06, cd: 9, chargeDur: 2.15, blastR: 208, power: 5,
    hint: 'Lv 22', tooltip: 'Bevriest het slagveld — vijanden stokken vast en nemen zware schade.',
    bonus: 'Freeze + burst', tags: ['freeze', 'burst'] },
  { id: 'shadow_clones', name: 'Schaduw-clones', needLvl: 25,
    behavior: 'clones', icon: 'clone',
    color: '#cfe0ff', color2: '#7cf5ff',
    chargeBanner: 'CLONES!', finishBanner: 'CLONE RUSH!',
    chargeSfx: 'super_clone_charge', finishSfx: 'super_clone',
    cloneHits: 5, cd: 9, chargeDur: 1.9, blastR: 196, power: 4,
    hint: 'Lv 25', tooltip: 'Clones slaan van alle kanten — meerdere hits op nabije vijanden.',
    bonus: 'Multi-hit rush', tags: ['multi-hit', 'rush'] },
  { id: 'void_pulse', name: 'Void-puls', needLvl: 30,
    behavior: 'void', icon: 'void',
    color: '#6a4aff', color2: '#2a1050',
    chargeBanner: 'VOID!', finishBanner: 'VOID PULSE!',
    chargeSfx: 'super_void_charge', finishSfx: 'super_void',
    cd: 9, chargeDur: 2.1, blastR: 210, power: 5,
    hint: 'Lv 30', tooltip: 'Donkere puls trekt alles naar binnen en explodeert.',
    bonus: 'Pull + void burst', tags: ['pull', 'void'] },
];

const SUPER_BEHAVIORS = ['blast', 'shield', 'heal', 'mind_eye', 'lightning', 'meteor', 'rage', 'timestop', 'clones', 'void'];

const superById = id => SUPERS.find(s => s.id === id) || SUPERS[0];

function superExists(id) {
  return SUPERS.some(s => s.id === id);
}

function superBehaviorLabel(sp) {
  const map = {
    blast: 'Blast', shield: 'Schild', heal: 'Heal', mind_eye: 'Illusion',
    lightning: 'Bliksem', meteor: 'Meteor', rage: 'Rage', timestop: 'Tijd',
    clones: 'Clones', void: 'Void',
  };
  return map[sp && sp.behavior] || 'Super';
}

function superBehaviorLabelI18n(sp) {
  const beh = sp && sp.behavior ? sp.behavior : 'blast';
  const k = 'super.behavior.' + beh;
  const v = typeof t === 'function' ? t(k) : '';
  if (v && v !== k) return v;
  return superBehaviorLabel(sp);
}

function superSkillGated(sp) {
  return !!(sp.needLvl && sp.needLvl > adventureWeaponCap());
}

function superUnlocked(sp) {
  if (!sp) return false;
  if (sp.id === 'ketsbam') return true;
  if (superSkillGated(sp)) return false;
  if (sp.needLvl && save.lvl >= sp.needLvl) return true;
  return false;
}

function superUnlockedCount() {
  return SUPERS.filter(superUnlocked).length;
}

function equippedSuper() {
  const eq = superById(save.super || 'ketsbam');
  return superUnlocked(eq) ? eq : superById('ketsbam');
}

function superChargeBanner(sp) {
  if (!sp) return 'KETS!';
  const k = 'super.' + sp.id + '.charge';
  const v = typeof t === 'function' ? t(k) : '';
  if (v && v !== k) return v;
  return sp.chargeBanner || 'KETS!';
}

function superFinishBanner(sp) {
  if (!sp) return 'KETS-BAM!';
  const k = 'super.' + sp.id + '.finish';
  const v = typeof t === 'function' ? t(k) : '';
  if (v && v !== k) return v;
  return sp.finishBanner || 'KETS-BAM!';
}

function superSfxId(sp, phase) {
  if (!sp) return phase === 'charge' ? 'ketsbamCharge' : 'ketsbam';
  return phase === 'charge' ? (sp.chargeSfx || 'ketsbamCharge') : (sp.finishSfx || 'ketsbam');
}

function superNextUnlock() {
  const pending = SUPERS.filter(s => !superUnlocked(s))
    .sort((a, b) => (a.needLvl || 999) - (b.needLvl || 999));
  return pending[0] || null;
}

function superCombatLine(sp) {
  return sp.bonus || sp.hint || '';
}

function superChargeDur(sp) {
  return sp && sp.chargeDur ? sp.chargeDur : KETSBAM_CHARGE_DUR;
}

function superCooldown(sp) {
  return sp && sp.cd ? sp.cd : KETSBAM_CD;
}

function superBlastRadius(sp) {
  return sp && sp.blastR ? sp.blastR : KETSBAM_BLAST_R;
}

function superStatRows(sp) {
  if (!sp) return [];
  const maxPow = 5;
  const maxR = 220;
  const maxCd = 12;
  const maxCharge = 2.2;
  return [
    { key: 'pow', pct: clamp((sp.power || 3) / maxPow, 0.1, 1), text: '★'.repeat(sp.power || 3) },
    { key: 'rad', pct: clamp((sp.blastR || KETSBAM_BLAST_R) / maxR, 0.1, 1), text: String(sp.blastR || KETSBAM_BLAST_R) },
    { key: 'cd', pct: clamp(1 - (sp.cd || KETSBAM_CD) / maxCd, 0.1, 1), text: (sp.cd || KETSBAM_CD) + 's' },
    { key: 'charge', pct: clamp(1 - (sp.chargeDur || KETSBAM_CHARGE_DUR) / maxCharge, 0.1, 1),
      text: ((sp.chargeDur || KETSBAM_CHARGE_DUR) * 1000 | 0) + 'ms' },
  ];
}

function superTags(sp) {
  if (!sp) return [];
  const tags = [superBehaviorLabelI18n(sp)];
  for (const tag of sp.tags || []) {
    const k = 'super.tag.' + tag;
    const v = typeof t === 'function' ? t(k) : '';
    tags.push(v && v !== k ? v : tag);
  }
  return tags.slice(0, 4);
}

function applySuperMonsterSlow(m, dur, strength) {
  if (!m || !m.alive) return;
  m.superSlowT = Math.max(m.superSlowT || 0, dur || 1.2);
  m.superSlowMul = Math.min(m.superSlowMul || 1, strength != null ? strength : 0.25);
}

function queueSuperFx(game, fx) {
  if (!game) return;
  if (!game.superFx) game.superFx = [];
  game.superFx.push(fx);
}

function tickSuperFx(game, dt) {
  if (!game || !game.superFx || !game.superFx.length) return;
  const fighter = game.player;
  const lite = fxLite();
  for (let i = game.superFx.length - 1; i >= 0; i--) {
    const fx = game.superFx[i];
    fx.t = (fx.t || 0) + dt;
    if (fx.delay && fx.t < fx.delay) continue;
    if (fx.kind === 'lightning' && !fx.done) {
      fx.done = true;
      const m = fx.target;
      if (m && m.alive) {
        const tx = fx.x != null ? fx.x : m.x;
        const ty = fx.y != null ? fx.y : m.y - 90;
        if (!lite) {
          cDrawLightningBolt(game, tx, ty, m.x, m.y - 40, fx.color || '#a8e0ff');
        }
        game.burst(tx, ty, fx.color || '#a8e0ff', lite ? 5 : 10, { kind: 'spark', size: 2.4 });
        if (!lite) game.burst(m.x, m.y - 40, '#fff', 4);
        m.takeDamage(fx.dmg || 12, fx.kb || 320, game);
      }
      fx.life = 0.12;
    }
    if (fx.kind === 'meteor' && !fx.done) {
      fx.done = true;
      const mx = fx.x, my = fx.y;
      if (!lite) {
        for (let t = 0; t < 3; t++) {
          game.burst(mx + rand(-8, 8), my - 60 - t * 22, fx.color2 || '#ffe259', 2);
        }
      }
      game.burst(mx, my, fx.color || '#ff8c42', lite ? 8 : 16, { kind: 'spark', size: 3 });
      if (!lite) spawnFxRing(game, mx, my, fx.color2 || '#ffe259', 5);
      for (const m of game.monsters) {
        if (!m.alive) continue;
        if (Math.hypot(m.x - mx, m.y - my) > (fx.r || 58)) continue;
        m.takeDamage(fx.dmg || 10, Math.sign(m.x - mx || fighter?.face || 1) * (fx.kb || 360), game);
      }
      fx.life = 0.15;
    }
    if (fx.kind === 'clone' && !fx.done) {
      fx.done = true;
      const m = fx.target;
      if (m && m.alive) {
        game.burst(fx.x, fx.y - 40, fx.color || '#cfe0ff', lite ? 3 : 6);
        m.takeDamage(fx.dmg || 8, fx.kb || 260, game);
      }
      fx.life = 0.1;
    }
    fx.life = (fx.life != null ? fx.life : 0.2) - dt;
    if (fx.life <= 0) game.superFx.splice(i, 1);
  }
}

/** Teken bliksem-segment (wereld-coords via game.burst-trail hack — simpele lijn-FX). */
function cDrawLightningBolt(game, x0, y0, x1, y1, col) {
  if (!game._superBoltSeg) game._superBoltSeg = [];
  game._superBoltSeg.push({ x0, y0, x1, y1, col, life: 0.14 });
}

function drawSuperFxLayer(game, c) {
  if (!game) return;
  if (game._superBoltSeg && game._superBoltSeg.length) {
    for (let i = game._superBoltSeg.length - 1; i >= 0; i--) {
      const b = game._superBoltSeg[i];
      b.life -= 0.016;
      if (b.life <= 0) { game._superBoltSeg.splice(i, 1); continue; }
      c.save();
      c.globalAlpha = clamp(b.life / 0.14, 0, 1);
      c.strokeStyle = b.col || '#a8e0ff';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(b.x0, b.y0);
      const midX = (b.x0 + b.x1) / 2 + rand(-12, 12);
      const midY = (b.y0 + b.y1) / 2 + rand(-8, 8);
      c.lineTo(midX, midY);
      c.lineTo(b.x1, b.y1);
      c.stroke();
      c.restore();
    }
  }
}

function drawSuperShieldBubble(game, c, f) {
  if (!f || !f.alive || !game.playerShieldT || game.playerShieldT <= 0) return;
  const sp = equippedSuper();
  const pulse = game.t || 0;
  const calm = motionReduced();
  const r = 34 + (calm ? 0 : Math.sin(pulse * 8) * 3);
  c.save();
  c.globalAlpha = 0.22 + (calm ? 0 : Math.sin(pulse * 6) * 0.08);
  c.strokeStyle = sp.behavior === 'shield' ? sp.color : '#9fd8ff';
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(f.x, f.y - 48, r, r * 0.72, 0, 0, TAU);
  c.stroke();
  c.globalAlpha = 0.08;
  c.fillStyle = sp.behavior === 'shield' ? sp.color : '#9fd8ff';
  c.fill();
  c.restore();
}

function finishSuperBlast(fighter, game, sp, px, py, blastR, dmgMul, kbBase) {
  const monsters = (game && game.monsters) || [];
  for (const m of monsters) {
    if (!m || !m.alive) continue;
    const dx = m.x - px, dy = m.y - py;
    const dist = Math.hypot(dx, dy);
    if (dist > blastR) continue;
    const falloff = 1 - dist / blastR;
    const dmg = Math.max(10, Math.round(fighter.baseDmg * (dmgMul + falloff * 1.1)));
    const kb = Math.sign(dx || fighter.face || 1) * (kbBase + falloff * 120);
    try { m.takeDamage(dmg, kb, game); } catch (_) {}
  }
}

function finishEquippedSuper(fighter, game) {
  if (!fighter || !game) return;
  const sp = equippedSuper();
  if (!sp) return;
  const px = fighter.x, py = fighter.y - 42;
  const blastR = superBlastRadius(sp);
  const banner = superFinishBanner(sp);
  const lite = fxLite();
  if (!game.monsters) game.monsters = [];

  try { game.shake(sp.behavior === 'shield' ? 8 : 14, sp.behavior === 'timestop' ? 0.28 : 0.38); } catch (_) {}
  // Korte hit-stop — blast bijna instant zodat 1e/2e Kets → next wave soepel blijft
  try {
    const freezeHit = sp.behavior === 'timestop' ? (sp.freezeDur || 0.26)
      : (sp.behavior === 'blast' ? 0.02 : 0.045);
    game.freezeT = Math.max(game.freezeT || 0, freezeHit);
  } catch (_) {}
  try { game.banner(banner, 0.85, sp.color, 42); } catch (_) {}
  try { AudioSys.sfx(superSfxId(sp, 'finish')); } catch (_) {}

  try {
  switch (sp.behavior) {
    case 'shield':
      game.playerShieldT = Math.max(game.playerShieldT || 0, sp.shieldDur || 9);
      game.superShieldFrom = sp.id;
      finishSuperBlast(fighter, game, sp, px, py, blastR * 0.72, 0.85, 280);
      try { game.burst(px, py, sp.color, lite ? 16 : 28, { kind: 'ring' }); } catch (_) {}
      try { spawnFxRing(game, px, py, sp.color2 || sp.color, lite ? 8 : 14); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;

    case 'heal': {
      const maxHp = fighter.maxhp || fighter.maxHp || 100;
      const heal = Math.round(maxHp * (sp.healPct || 0.38));
      fighter.hp = Math.min(maxHp, (fighter.hp || 0) + heal);
      finishSuperBlast(fighter, game, sp, px, py, blastR * 0.65, 0.75, 240);
      try { game.burst(px, py, sp.color, lite ? 18 : 32, { kind: 'spark', size: 2.4 }); } catch (_) {}
      if (!lite) {
        for (let i = 0; i < 5; i++) {
          try { game.burst(px + rand(-40, 40), py + rand(-20, 30), sp.color2 || sp.color, 2); } catch (_) {}
        }
      }
      try { game.floater(px, py - 80, '+' + heal + ' HP', sp.color, 18); } catch (_) {}
      try { game.floater(px, py - 102, banner, sp.color2 || sp.color, 16); } catch (_) {}
      break;
    }

    case 'mind_eye': {
      for (const m of game.monsters) {
        if (!m || !m.alive) continue;
        const dx = px - m.x, dy = py - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist > blastR) continue;
        try { applySuperMonsterSlow(m, sp.slowDur || 1.5, sp.slowMul || 0.22); } catch (_) {}
        const falloff = 1 - dist / blastR;
        const pullF = 0.35 + falloff * 0.55;
        m.x += (dx / (dist || 1)) * pullF * 52;
        m.y += (dy / (dist || 1)) * pullF * 20;
        const dmg = Math.max(10, Math.round((fighter.baseDmg || 10) * (1.45 + falloff * 0.95)));
        try { m.takeDamage(dmg, Math.sign(m.x - px || fighter.face || 1) * (320 + falloff * 100), game); } catch (_) {}
      }
      if (!lite) try { spawnFxRing(game, px, py - 20, sp.color, 14); } catch (_) {}
      try { game.burst(px, py, sp.color, lite ? 20 : 36, { kind: 'spark', size: 2.8 }); } catch (_) {}
      try { game.burst(px, py - 18, sp.color2 || '#fff', lite ? 10 : 18); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;
    }

    case 'void': {
      for (const m of game.monsters) {
        if (!m || !m.alive) continue;
        const dx = px - m.x, dy = py - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist > blastR) continue;
        try { applySuperMonsterSlow(m, 0.85, 0.35); } catch (_) {}
        const falloff = 1 - dist / blastR;
        m.x += (dx / (dist || 1)) * (0.45 + falloff * 0.65) * 58;
        m.y += (dy / (dist || 1)) * (0.45 + falloff * 0.65) * 22;
        const dmg = Math.max(12, Math.round((fighter.baseDmg || 10) * (1.55 + falloff * 1.05)));
        try { m.takeDamage(dmg, Math.sign(m.x - px || fighter.face || 1) * (340 + falloff * 110), game); } catch (_) {}
      }
      try { game.burst(px, py, sp.color, lite ? 22 : 40, { kind: 'ring' }); } catch (_) {}
      try { game.burst(px, py, sp.color2 || '#2a1050', lite ? 12 : 22); } catch (_) {}
      try { spawnFxRing(game, px, py, sp.color, lite ? 12 : 18); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;
    }

    case 'lightning': {
      const targets = game.monsters.filter(m => m && m.alive && Math.hypot(m.x - px, m.y - py) <= blastR);
      const strikes = sp.strikes || 8;
      for (let i = 0; i < strikes; i++) {
        const m = targets[i % Math.max(1, targets.length)];
        if (!m) break;
        const falloff = 1 - Math.hypot(m.x - px, m.y - py) / blastR;
        try {
          queueSuperFx(game, {
            kind: 'lightning',
            target: m,
            x: m.x + rand(-14, 14),
            y: m.y - 92 + rand(-16, 8),
            color: sp.color,
            dmg: Math.max(12, Math.round((fighter.baseDmg || 10) * (1.32 + falloff * 0.85))),
            kb: Math.sign(m.x - px || fighter.face || 1) * (360 + falloff * 80),
            delay: i * 0.07,
            t: 0,
          });
        } catch (_) {}
      }
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;
    }

    case 'meteor': {
      const count = sp.meteors || 6;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * TAU + rand(-0.25, 0.25);
        const dist = rand(blastR * 0.18, blastR * 0.94);
        const mx = px + Math.cos(ang) * dist;
        const my = py + Math.sin(ang) * dist * 0.35;
        try {
          queueSuperFx(game, {
            kind: 'meteor',
            x: mx, y: my,
            color: sp.color,
            color2: sp.color2 || '#ffe259',
            dmg: Math.max(10, Math.round((fighter.baseDmg || 10) * (1.15 + rand(0, 0.65)))),
            kb: rand(300, 440),
            r: 58,
            delay: i * 0.09,
            t: 0,
          });
        } catch (_) {}
      }
      try { game.shake(10, 0.22); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;
    }

    case 'rage':
      game.dmgBuffT = Math.max(game.dmgBuffT || 0, sp.rageDur || 10);
      game.dmgBuffMul = Math.max(game.dmgBuffMul || 1, sp.rageMul || 1.48);
      finishSuperBlast(fighter, game, sp, px, py, blastR * 0.78, 1.05, 300);
      try { game.burst(px, py, sp.color, lite ? 18 : 30); } catch (_) {}
      if (!lite) try { game.burst(px, py - 30, sp.color2 || '#ff3d3d', 12); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;

    case 'timestop': {
      game.freezeT = Math.max(game.freezeT || 0, sp.freezeDur || 0.26);
      for (const m of game.monsters) {
        if (!m || !m.alive) continue;
        if (Math.hypot(m.x - px, m.y - py) > blastR * 1.05) continue;
        try { applySuperMonsterSlow(m, sp.slowDur || 2.6, sp.slowMul || 0.06); } catch (_) {}
      }
      finishSuperBlast(fighter, game, sp, px, py, blastR * 1.05, 1.55, 340);
      try { game.burst(px, py, sp.color, lite ? 22 : 38, { kind: 'ring' }); } catch (_) {}
      try { game.burst(px, py, sp.color2 || '#fff', lite ? 12 : 20); } catch (_) {}
      if (!lite) try { spawnFxRing(game, px, py - 24, sp.color2 || '#7cf5ff', 12); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;
    }

    case 'clones': {
      const hits = sp.cloneHits || 5;
      const nearby = game.monsters.filter(m => m && m.alive && Math.hypot(m.x - px, m.y - py) <= blastR);
      let delay = 0;
      for (const m of nearby) {
        for (let h = 0; h < hits; h++) {
          const off = (h - (hits - 1) / 2) * 26;
          try {
            queueSuperFx(game, {
              kind: 'clone',
              target: m,
              x: m.x + off,
              y: m.y,
              color: sp.color,
              dmg: Math.max(8, Math.round((fighter.baseDmg || 10) * (0.38 + h * 0.09))),
              kb: Math.sign(m.x - px + off || fighter.face || 1) * (250 + h * 42),
              delay: delay,
              t: 0,
            });
          } catch (_) {}
          delay += 0.045;
        }
      }
      try { game.burst(px, py, sp.color, lite ? 16 : 26); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;
    }

    case 'blast':
    default:
      finishSuperBlast(fighter, game, sp, px, py, blastR, 1.65, 380);
      try { game.burst(px, py, sp.color, lite ? 22 : 40, { kind: 'spark', size: 3.2 }); } catch (_) {}
      try { game.burst(px, py, sp.color2 || '#ff7043', lite ? 14 : 26); } catch (_) {}
      try { spawnFxRing(game, px, py, '#ffe259', lite ? 10 : 18); } catch (_) {}
      try { game.floater(px, py - 80, banner, sp.color, 20); } catch (_) {}
      break;
  }
  } catch (finErr) {
    try { sfReportError('finishEquippedSuper/' + (sp && sp.id), finErr); } catch (_) {}
  }

  try { if (save.haptics !== false) haptic(sp.behavior === 'shield' ? 18 : 32); } catch (_) {}
}

/** Prompt/charge icoon op canvas. */
function drawSuperIcon(c, icon, r, color, color2) {
  c.fillStyle = color || '#ffd75e';
  c.strokeStyle = color2 || '#ff7043';
  c.lineWidth = 2.5;
  switch (icon) {
    case 'shield':
      c.beginPath();
      c.moveTo(0, -r * 0.82);
      c.lineTo(r * 0.72, -r * 0.35);
      c.lineTo(r * 0.72, r * 0.25);
      c.quadraticCurveTo(0, r * 0.92, -r * 0.72, r * 0.25);
      c.lineTo(-r * 0.72, -r * 0.35);
      c.closePath();
      c.fill();
      c.stroke();
      break;
    case 'eye':
      c.beginPath();
      c.ellipse(0, 0, r * 0.82, r * 0.48, 0, 0, TAU);
      c.fill();
      c.stroke();
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(0, 0, r * 0.22, 0, TAU);
      c.fill();
      c.fillStyle = color2 || '#8b0000';
      c.beginPath();
      c.arc(0, 0, r * 0.12, 0, TAU);
      c.fill();
      for (let i = 0; i < 3; i++) {
        c.strokeStyle = color;
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(0, 0, r * (0.32 + i * 0.18), 0, TAU);
        c.stroke();
      }
      break;
    case 'bolt':
      c.beginPath();
      c.moveTo(r * 0.12, -r * 0.88);
      c.lineTo(-r * 0.28, r * 0.05);
      c.lineTo(r * 0.05, r * 0.05);
      c.lineTo(-r * 0.18, r * 0.88);
      c.lineTo(r * 0.38, -r * 0.08);
      c.lineTo(r * 0.02, -r * 0.08);
      c.closePath();
      c.fill();
      c.stroke();
      break;
    case 'heart':
      c.beginPath();
      c.moveTo(0, r * 0.32);
      c.bezierCurveTo(-r * 0.9, -r * 0.2, -r * 0.45, -r * 0.88, 0, -r * 0.42);
      c.bezierCurveTo(r * 0.45, -r * 0.88, r * 0.9, -r * 0.2, 0, r * 0.32);
      c.fill();
      c.stroke();
      break;
    case 'meteor':
      c.beginPath();
      c.arc(0, 0, r * 0.55, 0, TAU);
      c.fill();
      c.stroke();
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.15, -r * 0.75);
      c.lineTo(r * 0.35, r * 0.75);
      c.stroke();
      break;
    case 'clock':
      c.beginPath();
      c.arc(0, 0, r * 0.72, 0, TAU);
      c.fill();
      c.stroke();
      c.strokeStyle = '#fff';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -r * 0.42);
      c.moveTo(0, 0);
      c.lineTo(r * 0.32, 0);
      c.stroke();
      break;
    case 'rage':
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU - Math.PI / 2;
        const rr = i % 2 ? r * 0.45 : r * 0.88;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.stroke();
      break;
    case 'clone':
      c.globalAlpha *= 0.55;
      c.beginPath();
      c.arc(-r * 0.28, 0, r * 0.42, 0, TAU);
      c.fill();
      c.globalAlpha /= 0.55;
      c.beginPath();
      c.arc(r * 0.28, 0, r * 0.42, 0, TAU);
      c.fill();
      c.stroke();
      break;
    case 'void':
      c.beginPath();
      c.arc(0, 0, r * 0.72, 0, TAU);
      c.fill();
      c.stroke();
      c.fillStyle = '#0a0d18';
      c.beginPath();
      c.arc(0, 0, r * 0.38, 0, TAU);
      c.fill();
      c.strokeStyle = color;
      c.stroke();
      break;
    case 'star':
    default:
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
      break;
  }
}
