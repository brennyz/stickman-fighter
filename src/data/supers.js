/* ============================== SUPERS ================================= */
/** Nood-super (Kets-slot) — vervangbaar via Collectie → Skills · alleen avontuur. */
const SUPERS = [
  { id: 'ketsbam', name: 'KETS-BAM', needLvl: 1,
    behavior: 'blast', icon: 'star',
    color: '#ffd75e', color2: '#ff7043',
    chargeBanner: 'KETS!', finishBanner: 'KETS-BAM!',
    chargeSfx: 'ketsbamCharge', finishSfx: 'ketsbam',
    hint: 'Standaard', tooltip: 'Omringd? Laad op en knal alles weg — klassieke nood-ontsnapping.',
    bonus: 'AOE schade-blast' },
  { id: 'iron_shield', name: 'IJzeren schild', needLvl: 5,
    behavior: 'shield', icon: 'shield',
    color: '#9fd8ff', color2: '#5a9fd4',
    chargeBanner: 'SCHILD!', finishBanner: 'BLOKADE!',
    chargeSfx: 'super_shield_charge', finishSfx: 'super_shield',
    shieldDur: 9, shieldMul: 0.18,
    hint: 'Lv 5', tooltip: 'Trek een ijzeren koepel — langdurige schade-reductie + kleine shockwave.',
    bonus: 'Lang schild + push' },
  { id: 'heal_wave', name: 'Genezingsgolf', needLvl: 8,
    behavior: 'heal', icon: 'heart',
    color: '#6ee06e', color2: '#43b25b',
    chargeBanner: 'HEAL!', finishBanner: 'GENEZING!',
    chargeSfx: 'super_heal_charge', finishSfx: 'super_heal',
    healPct: 0.38,
    hint: 'Lv 8', tooltip: 'Chakra-golf herstelt HP en ruimt vijanden licht weg.',
    bonus: 'HP + lichte push' },
  { id: 'sharingan', name: 'Sharingan', needLvl: 12,
    behavior: 'sharingan', icon: 'eye',
    color: '#e04040', color2: '#8b0000',
    chargeBanner: 'SHARINGAN!', finishBanner: 'GENJUTSU!',
    chargeSfx: 'super_sharingan_charge', finishSfx: 'super_sharingan',
    hint: 'Lv 12', tooltip: 'Oog-genjutsu: trekt vijanden naar je toe en slaat hard toe.',
    bonus: 'Pull + genjutsu-hit' },
  { id: 'lightning_storm', name: 'Bliksemstorm', needLvl: 15,
    behavior: 'lightning', icon: 'bolt',
    color: '#a8e0ff', color2: '#5ad0ff',
    chargeBanner: 'STORM!', finishBanner: 'RAIJIN!',
    chargeSfx: 'super_lightning_charge', finishSfx: 'super_lightning',
    strikes: 7,
    hint: 'Lv 15', tooltip: 'Ultra-snelle bliksemslagen op alle nabije vijanden.',
    bonus: 'Multi-bolt spam' },
  { id: 'meteor_strike', name: 'Meteoorregen', needLvl: 18,
    behavior: 'meteor', icon: 'meteor',
    color: '#ff8c42', color2: '#ff7043',
    chargeBanner: 'METEOR!', finishBanner: 'METEOR REGEN!',
    chargeSfx: 'super_meteor_charge', finishSfx: 'super_meteor',
    meteors: 5,
    hint: 'Lv 18', tooltip: 'Vallende meteoren op het slagveld — brede zone-schade.',
    bonus: 'Zone meteors' },
  { id: 'berserk_rage', name: 'Berserk', needLvl: 20,
    behavior: 'rage', icon: 'rage',
    color: '#ff7a4d', color2: '#ff3d3d',
    chargeBanner: 'RAGE!', finishBanner: 'BERSERK!',
    chargeSfx: 'super_rage_charge', finishSfx: 'super_rage',
    rageDur: 10, rageMul: 1.48,
    hint: 'Lv 20', tooltip: 'Ontketen woede — langdurige schade-boost + shockwave.',
    bonus: 'Schade-buff + push' },
  { id: 'timestop', name: 'Tijd-stil', needLvl: 22,
    behavior: 'timestop', icon: 'clock',
    color: '#c47aff', color2: '#7cf5ff',
    chargeBanner: 'TIJD!', finishBanner: 'STILSTAND!',
    chargeSfx: 'super_time_charge', finishSfx: 'super_time',
    freezeDur: 0.22,
    hint: 'Lv 22', tooltip: 'Bevriest het slagveld kort — alle vijanden nemen zware schade.',
    bonus: 'Freeze + burst' },
  { id: 'shadow_clones', name: 'Schaduw-clones', needLvl: 25,
    behavior: 'clones', icon: 'clone',
    color: '#cfe0ff', color2: '#7cf5ff',
    chargeBanner: 'CLONES!', finishBanner: 'CLONE RUSH!',
    chargeSfx: 'super_clone_charge', finishSfx: 'super_clone',
    cloneHits: 4,
    hint: 'Lv 25', tooltip: 'Clones slaan van alle kanten — meerdere hits op nabije vijanden.',
    bonus: 'Multi-hit rush' },
  { id: 'void_pulse', name: 'Void-puls', needLvl: 30,
    behavior: 'void', icon: 'void',
    color: '#6a4aff', color2: '#2a1050',
    chargeBanner: 'VOID!', finishBanner: 'VOID PULSE!',
    chargeSfx: 'super_void_charge', finishSfx: 'super_void',
    hint: 'Lv 30', tooltip: 'Donkere puls trekt alles naar binnen en explodeert.',
    bonus: 'Pull + void burst' },
];

const superById = id => SUPERS.find(s => s.id === id) || SUPERS[0];

function superExists(id) {
  return SUPERS.some(s => s.id === id);
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

function superBlastRadius(sp) {
  return sp && sp.blastR ? sp.blastR : KETSBAM_BLAST_R;
}

function finishSuperBlast(fighter, game, sp, px, py, blastR, dmgMul, kbBase) {
  for (const m of game.monsters) {
    if (!m.alive) continue;
    const dx = m.x - px, dy = m.y - py;
    const dist = Math.hypot(dx, dy);
    if (dist > blastR) continue;
    const falloff = 1 - dist / blastR;
    const dmg = Math.max(10, Math.round(fighter.baseDmg * (dmgMul + falloff * 1.1)));
    const kb = Math.sign(dx || fighter.face || 1) * (kbBase + falloff * 120);
    m.takeDamage(dmg, kb, game);
  }
}

function finishEquippedSuper(fighter, game) {
  if (!fighter || !game) return;
  const sp = equippedSuper();
  const px = fighter.x, py = fighter.y - 42;
  const blastR = superBlastRadius(sp);
  const banner = superFinishBanner(sp);
  const lite = fxLite();

  game.shake(sp.behavior === 'shield' ? 8 : 14, sp.behavior === 'timestop' ? 0.28 : 0.38);
  game.freezeT = Math.max(game.freezeT, sp.behavior === 'timestop' ? (sp.freezeDur || 0.22) : 0.06);
  game.banner(banner, 0.85, sp.color, 42);
  try { AudioSys.sfx(superSfxId(sp, 'finish')); } catch (_) {}

  switch (sp.behavior) {
    case 'shield':
      game.playerShieldT = Math.max(game.playerShieldT, sp.shieldDur || 9);
      finishSuperBlast(fighter, game, sp, px, py, blastR * 0.72, 0.85, 280);
      game.burst(px, py, sp.color, lite ? 16 : 28, { kind: 'ring' });
      spawnFxRing(game, px, py, sp.color2 || sp.color, lite ? 8 : 14);
      game.floater(px, py - 80, banner, sp.color, 20);
      break;

    case 'heal': {
      const maxHp = fighter.maxHp || 100;
      const heal = Math.round(maxHp * (sp.healPct || 0.38));
      fighter.hp = Math.min(maxHp, fighter.hp + heal);
      finishSuperBlast(fighter, game, sp, px, py, blastR * 0.65, 0.75, 240);
      game.burst(px, py, sp.color, lite ? 18 : 32, { kind: 'spark', size: 2.4 });
      game.floater(px, py - 80, '+' + heal + ' HP', sp.color, 18);
      game.floater(px, py - 102, banner, sp.color2 || sp.color, 16);
      break;
    }

    case 'sharingan':
    case 'void': {
      const pull = sp.behavior === 'void' ? 1.35 : 1.0;
      for (const m of game.monsters) {
        if (!m.alive) continue;
        const dx = px - m.x, dy = py - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist > blastR) continue;
        const falloff = 1 - dist / blastR;
        const pullF = (0.35 + falloff * 0.55) * pull;
        m.x += (dx / (dist || 1)) * pullF * 48;
        m.y += (dy / (dist || 1)) * pullF * 18;
        const dmg = Math.max(10, Math.round(fighter.baseDmg * (1.45 + falloff * 0.95)));
        const kb = Math.sign(m.x - px || fighter.face || 1) * (320 + falloff * 100);
        m.takeDamage(dmg, kb, game);
      }
      game.burst(px, py, sp.color, lite ? 20 : 36, { kind: 'spark', size: 2.8 });
      game.burst(px, py, sp.color2 || '#fff', lite ? 10 : 18);
      spawnFxRing(game, px, py, sp.color, lite ? 10 : 16);
      game.floater(px, py - 80, banner, sp.color, 20);
      break;
    }

    case 'lightning': {
      const targets = game.monsters.filter(m => m.alive && Math.hypot(m.x - px, m.y - py) <= blastR);
      const strikes = sp.strikes || 7;
      for (let i = 0; i < strikes; i++) {
        const m = targets[i % Math.max(1, targets.length)];
        if (!m) break;
        const tx = m.x + rand(-18, 18);
        const ty = m.y - 90 + rand(-20, 10);
        game.burst(tx, ty, sp.color, lite ? 6 : 12, { kind: 'spark', size: 2.2 });
        if (!lite) game.burst(tx, ty + 40, '#fff', 4);
        const falloff = 1 - Math.hypot(m.x - px, m.y - py) / blastR;
        const dmg = Math.max(12, Math.round(fighter.baseDmg * (1.35 + falloff * 0.8)));
        m.takeDamage(dmg, Math.sign(m.x - px || fighter.face || 1) * (360 + falloff * 80), game);
      }
      game.floater(px, py - 80, banner, sp.color, 20);
      break;
    }

    case 'meteor': {
      const count = sp.meteors || 5;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * TAU + rand(-0.2, 0.2);
        const dist = rand(blastR * 0.2, blastR * 0.92);
        const mx = px + Math.cos(ang) * dist;
        const my = py + Math.sin(ang) * dist * 0.35;
        game.burst(mx, my, sp.color, lite ? 10 : 18, { kind: 'spark', size: 3 });
        if (!lite) spawnFxRing(game, mx, my, sp.color2 || '#ffe259', 6);
        for (const m of game.monsters) {
          if (!m.alive) continue;
          if (Math.hypot(m.x - mx, m.y - my) > 56) continue;
          const dmg = Math.max(10, Math.round(fighter.baseDmg * (1.2 + rand(0, 0.6))));
          m.takeDamage(dmg, Math.sign(m.x - mx || fighter.face || 1) * rand(280, 420), game);
        }
      }
      game.floater(px, py - 80, banner, sp.color, 20);
      break;
    }

    case 'rage':
      game.dmgBuffT = Math.max(game.dmgBuffT, sp.rageDur || 10);
      game.dmgBuffMul = Math.max(game.dmgBuffMul || 1, sp.rageMul || 1.48);
      finishSuperBlast(fighter, game, sp, px, py, blastR * 0.78, 1.05, 300);
      game.burst(px, py, sp.color, lite ? 18 : 30);
      game.floater(px, py - 80, banner, sp.color, 20);
      break;

    case 'timestop':
      game.freezeT = Math.max(game.freezeT, sp.freezeDur || 0.22);
      finishSuperBlast(fighter, game, sp, px, py, blastR * 1.05, 1.55, 340);
      game.burst(px, py, sp.color, lite ? 22 : 38, { kind: 'ring' });
      game.burst(px, py, sp.color2 || '#fff', lite ? 12 : 20);
      game.floater(px, py - 80, banner, sp.color, 20);
      break;

    case 'clones': {
      const hits = sp.cloneHits || 4;
      const nearby = game.monsters.filter(m => m.alive && Math.hypot(m.x - px, m.y - py) <= blastR);
      for (const m of nearby) {
        for (let h = 0; h < hits; h++) {
          const off = (h - (hits - 1) / 2) * 28;
          const dmg = Math.max(8, Math.round(fighter.baseDmg * (0.42 + h * 0.08)));
          m.takeDamage(dmg, Math.sign(m.x - px + off || fighter.face || 1) * (260 + h * 40), game);
          if (!lite && h === 0) game.burst(m.x + off, m.y - 40, sp.color, 4);
        }
      }
      game.burst(px, py, sp.color, lite ? 16 : 26);
      game.floater(px, py - 80, banner, sp.color, 20);
      break;
    }

    case 'blast':
    default:
      finishSuperBlast(fighter, game, sp, px, py, blastR, 1.65, 380);
      game.burst(px, py, sp.color, lite ? 22 : 40, { kind: 'spark', size: 3.2 });
      game.burst(px, py, sp.color2 || '#ff7043', lite ? 14 : 26);
      spawnFxRing(game, px, py, '#ffe259', lite ? 10 : 18);
      game.floater(px, py - 80, banner, sp.color, 20);
      break;
  }

  if (save.haptics !== false) haptic(sp.behavior === 'shield' ? 18 : 32);
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
