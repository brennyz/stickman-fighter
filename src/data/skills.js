/* ============================== SKILLS ================================= */
/** Chakra-specials — equip via Collectie → Skills (avontuur/training/muur/mats). */
const SKILLS = [
  { id: 'rasengan', name: 'Rasengan', saga: 'scroll', needLvl: 1,
    behavior: 'orb', dmgMul: 2.85, windup: 0.48, speed: 420, radius: 28, pierce: true, life: 1.4,
    color: '#7cf5ff', sfx: 'rasengan', banner: 'RASENGAN!', kb: 520,
    hint: 'Standaard', tooltip: 'Draaiende chakra-bol — pierce door meerdere vijanden.',
    bonus: 'Piercing orb' },
  { id: 'fireball_jutsu', name: 'Vuurbol', saga: 'scroll', needLvl: 4,
    behavior: 'orb', dmgMul: 2.65, windup: 0.42, speed: 380, radius: 26, pierce: false, life: 1.1,
    color: '#ff8c42', sfx: 'rasengan', banner: 'VUURBOL!', kb: 480,
    hint: 'Lv 4', tooltip: 'Katon-stijl vuurprojectiel — korter maar sneller te laden.',
    bonus: 'Snelle fire orb' },
  { id: 'chidori', name: 'Chidori', saga: 'scroll', needLvl: 6,
    behavior: 'dash', dmgMul: 2.72, windup: 0.48, speed: 620, radius: 22, pierce: false, life: 0.35,
    dashVx: 380, color: '#a8e0ff', sfx: 'chidori', banner: 'CHIDORI!', kb: 540,
    hint: 'Lv 6', tooltip: 'Bliksem-dash vooruit — korte maar heftige burst.',
    bonus: 'Lightning dash' },
  { id: 'shadow_clone_burst', name: 'Schaduw-clones', saga: 'scroll', needLvl: 8,
    behavior: 'dash', dmgMul: 2.58, windup: 0.44, speed: 540, radius: 24, pierce: true, life: 0.42,
    dashVx: 320, color: '#cfe0ff', sfx: 'chidori', banner: 'CLONE RUSH!', kb: 460,
    hint: 'Lv 8', tooltip: 'Dash met pierce-slagen — mobiel en breed.',
    bonus: 'Pierce dash' },
  { id: 'gentle_palm', name: 'Zachte palm', saga: 'scroll', needLvl: 10,
    behavior: 'orb', dmgMul: 2.45, windup: 0.38, speed: 340, radius: 32, pierce: false, life: 0.55,
    color: '#b8ffc8', sfx: 'rasengan', banner: 'PALM STRIKE!', kb: 620,
    hint: 'Lv 10', tooltip: 'Interne schade-burst op korte afstand — hoge knockback.',
    bonus: 'Heavy knockback' },
  { id: 'rinnegan', name: 'Rinnegan', saga: 'scroll', needLvl: 22,
    behavior: 'pull', dmgMul: 2.55, windup: 0.52, speed: 340, radius: 30, pierce: true, life: 1.05,
    pull: true, color: '#c47aff', sfx: 'rinnegan', banner: 'RINNEGAN!', kb: 460,
    hint: 'Lv 22', tooltip: 'Traag oog-orb met pull — trekt vijanden mee.',
    bonus: 'Pull + pierce' },
  { id: 'eight_gates', name: '8 poorten', saga: 'scroll', needLvl: 24,
    behavior: 'dash', dmgMul: 3.05, windup: 0.55, speed: 680, radius: 26, pierce: true, life: 0.38,
    dashVx: 420, color: '#ff6b6b', sfx: 'chidori', banner: '8 GATES!', kb: 580,
    hint: 'Lv 24', tooltip: 'Rood-blitz dash — hoogste scroll dash-schade.',
    bonus: 'Power dash' },
  { id: 'black_hole', name: 'Zwart gat', saga: 'scroll', needLvl: 38,
    behavior: 'meteor', dmgMul: 3.2, windup: 0.62, speed: 220, radius: 36, pierce: true, life: 1.35,
    pull: true, color: '#6a4aff', sfx: 'rinnegan', banner: 'BLACK HOLE!', kb: 500,
    hint: 'Lv 38', tooltip: 'Gravity-orb — langzaam, trekt alles naar binnen.',
    bonus: 'Gravity meteor' },

  { id: 'kamehameha', name: 'Kamehameha', saga: 'ki', needLvl: 7,
    behavior: 'beam', dmgMul: 3.0, windup: 0.58, speed: 520, radius: 34, pierce: true, life: 1.15,
    color: '#5ad0ff', sfx: 'rasengan', banner: 'KAMEHAMEHA!', kb: 540,
    hint: 'Lv 7', tooltip: 'Brede ki-straal — pierce door de hele golf.',
    bonus: 'Classic beam' },
  { id: 'galick_gun', name: 'Galick Gun', saga: 'ki', needLvl: 13,
    behavior: 'beam', dmgMul: 2.92, windup: 0.52, speed: 480, radius: 30, pierce: true, life: 1.0,
    color: '#b06ae0', sfx: 'rinnegan', banner: 'GALICK GUN!', kb: 520,
    hint: 'Lv 13', tooltip: 'Paarse ki-beam — iets sneller windup.',
    bonus: 'Purple beam' },
  { id: 'destructo_disc', name: 'Destructo Disc', saga: 'ki', needLvl: 16,
    behavior: 'disc', dmgMul: 2.78, windup: 0.5, speed: 560, radius: 18, pierce: true, life: 1.25,
    color: '#ffe259', sfx: 'rasengan', banner: 'DISC!', kb: 380,
    hint: 'Lv 16', tooltip: 'Dunne snijschijf — snel en pierce.',
    bonus: 'Pierce disc' },
  { id: 'instant_dash', name: 'Instant Move', saga: 'ki', needLvl: 11,
    behavior: 'dash', dmgMul: 2.48, windup: 0.36, speed: 700, radius: 20, pierce: false, life: 0.28,
    dashVx: 440, color: '#7cf5ff', sfx: 'chidori', banner: 'TELEPORT STRIKE!', kb: 420,
    hint: 'Lv 11', tooltip: 'Ultra-korte windup dash — surprise opener.',
    bonus: 'Fast dash' },
  { id: 'final_flash', name: 'Final Flash', saga: 'ki', needLvl: 28,
    behavior: 'beam', dmgMul: 3.35, windup: 0.68, speed: 580, radius: 38, pierce: true, life: 1.3,
    color: '#ffe080', sfx: 'rasengan', banner: 'FINAL FLASH!', kb: 600,
    hint: 'Lv 28', tooltip: 'Massieve gele beam — lang windup, extreme schade.',
    bonus: 'Mega beam' },
  { id: 'spirit_bomb', name: 'Spirit Bomb', saga: 'ki', needLvl: 32,
    behavior: 'meteor', dmgMul: 3.4, windup: 0.72, speed: 180, radius: 40, pierce: true, life: 1.6,
    pull: true, color: '#a8ecff', sfx: 'rinnegan', banner: 'SPIRIT BOMB!', kb: 480,
    hint: 'Lv 32', tooltip: 'Gigantische ki-orb — langzaam, alles trekt mee.',
    bonus: 'Ultimate orb' },

  { id: 'getsuga', name: 'Getsuga', saga: 'tide', needLvl: 9,
    behavior: 'beam', dmgMul: 2.75, windup: 0.46, speed: 500, radius: 26, pierce: true, life: 0.95,
    color: '#6fd7ff', sfx: 'rasengan', banner: 'GETSUGA!', kb: 500,
    hint: 'Lv 9', tooltip: 'Cyan maanslag-golf — snelle horizontale slash.',
    bonus: 'Moon slash' },
  { id: 'cero', name: 'Cero', saga: 'tide', needLvl: 15,
    behavior: 'beam', dmgMul: 2.88, windup: 0.54, speed: 510, radius: 32, pierce: true, life: 1.05,
    color: '#ff4040', sfx: 'rinnegan', banner: 'CERO!', kb: 560,
    hint: 'Lv 15', tooltip: 'Rode hollow-straal — brede tide beam.',
    bonus: 'Red beam' },
  { id: 'bankai_slash', name: 'Bankai Flash', saga: 'tide', needLvl: 26,
    behavior: 'dash', dmgMul: 3.1, windup: 0.5, speed: 640, radius: 28, pierce: true, life: 0.45,
    dashVx: 400, color: '#9db8ff', sfx: 'chidori', banner: 'BANKAI!', kb: 580,
    hint: 'Lv 26', tooltip: 'Blauwe blitz na release — pierce dash.',
    bonus: 'Bankai dash' },

  { id: 'gum_rocket', name: 'Gum-Gum Rocket', saga: 'fighter', needLvl: 5,
    behavior: 'dash', dmgMul: 2.52, windup: 0.4, speed: 580, radius: 24, pierce: false, life: 0.32,
    dashVx: 360, color: '#ffb0b8', sfx: 'chidori', banner: 'GUM ROCKET!', kb: 500,
    hint: 'Lv 5', tooltip: 'Rubber-arm dash — vroeg unlock street-fighter vibe.',
    bonus: 'Stretch dash' },
  { id: 'gear_second', name: 'Gear Second', saga: 'fighter', needLvl: 14,
    behavior: 'orb', dmgMul: 2.95, windup: 0.42, speed: 480, radius: 26, pierce: true, life: 1.0,
    color: '#ff6b6b', sfx: 'rasengan', banner: 'GEAR 2!', kb: 540,
    hint: 'Lv 14', tooltip: 'Steam-orb — snelle pierce special.',
    bonus: 'Speed orb' },

  { id: 'thunder_palm', name: 'Thunder Palm', saga: 'cape', needLvl: 12,
    behavior: 'dash', dmgMul: 2.68, windup: 0.45, speed: 600, radius: 24, pierce: false, life: 0.34,
    dashVx: 370, color: '#ffe259', sfx: 'chidori', banner: 'THUNDER!', kb: 520,
    hint: 'Lv 12', tooltip: 'Bliksem-palm dash — cape saga special.',
    bonus: 'Hero dash' },
  { id: 'serious_punch', name: 'Serious Punch', saga: 'cape', needLvl: 30,
    behavior: 'orb', dmgMul: 3.5, windup: 0.55, speed: 460, radius: 34, pierce: true, life: 0.7,
    color: '#ff4040', sfx: 'rasengan', banner: 'SERIOUS PUNCH!', kb: 720,
    hint: 'Lv 30', tooltip: 'One-hit orb — korte range, extreme schade.',
    bonus: 'Serious hit' },
  { id: 'serious_blast', name: 'Serious Blast', saga: 'cape', needLvl: 42,
    behavior: 'beam', dmgMul: 3.55, windup: 0.65, speed: 550, radius: 36, pierce: true, life: 1.2,
    color: '#ff8080', sfx: 'rasengan', banner: 'SERIOUS BLAST!', kb: 640,
    hint: 'Lv 42', tooltip: 'Serious Series beam — endgame cape ultimate.',
    bonus: 'Serious beam' },

  { id: 'sun_palm', name: 'Sun Palm', saga: 'dawn', needLvl: 10,
    behavior: 'orb', dmgMul: 2.7, windup: 0.44, speed: 400, radius: 30, pierce: false, life: 1.0,
    color: '#ffd75e', sfx: 'rasengan', banner: 'SUN PALM!', kb: 490,
    hint: 'Lv 10', tooltip: 'Gouden palm-orb — dawn saga balanced special.',
    bonus: 'Solar orb' },
  { id: 'moon_pull', name: 'Moon Pull', saga: 'dawn', needLvl: 18,
    behavior: 'pull', dmgMul: 2.62, windup: 0.5, speed: 300, radius: 28, pierce: true, life: 1.0,
    pull: true, color: '#e0a8ff', sfx: 'rinnegan', banner: 'MOON PULL!', kb: 440,
    hint: 'Lv 18', tooltip: 'Maankracht-orb met pull — controle-special.',
    bonus: 'Lunar pull' },
];

const skillById = id => SKILLS.find(s => s.id === id) || SKILLS[0];

function skillExists(id) {
  return SKILLS.some(s => s.id === id);
}

function skillBehaviorLabel(sk) {
  const map = { orb: 'Orb', dash: 'Dash', pull: 'Pull', beam: 'Beam', disc: 'Disc', meteor: 'Meteor' };
  return map[sk && sk.behavior] || 'Special';
}

function skillSkillGated(sk) {
  return !!(sk.needLvl && sk.needLvl > adventureWeaponCap());
}

function skillUnlocked(sk) {
  if (!sk) return false;
  if (sk.id === 'rasengan') return true;
  if (skillSkillGated(sk)) return false;
  if (sk.needLvl && save.lvl >= sk.needLvl) return true;
  if (sk.needTrain && save.trainWins >= sk.needTrain) return true;
  if (sk.needDex && dexCount() >= sk.needDex) return true;
  if (sk.needDexKills && dexTotalKills() >= sk.needDexKills) return true;
  return false;
}

function skillUnlockedCount() {
  return SKILLS.filter(skillUnlocked).length;
}

function fighterEquippedSkill(f) {
  if (!f) return skillById('rasengan');
  if (f.isRobot) return skillById('chidori');
  if (f.playerSlot === 2 || (f.playerSlot && f.playerSlot !== 1)) {
    const vs = f.vsSpecial || 'rasengan';
    return skillById(vs) || skillById('rasengan');
  }
  if (f.isPlayer && !f.playerSlot) {
    const eq = skillById(save.skill || 'rasengan');
    return skillUnlocked(eq) ? eq : skillById('rasengan');
  }
  if (f.vsSpecial) return skillById(f.vsSpecial) || skillById('rasengan');
  return skillById('rasengan');
}

function applyPlayerSkill(fighter) {
  if (!fighter || !fighter.isPlayer || fighter.playerSlot) return;
  const sk = fighterEquippedSkill(fighter);
  fighter.vsSpecial = sk.id;
}

function skillBanner(sk) {
  return (sk && sk.banner) || 'SPECIAL!';
}

function skillHudColor(sk) {
  return (sk && sk.color) || '#7cf5ff';
}

function skillCombatLine(sk) {
  return sk.bonus || sk.hint || '';
}
