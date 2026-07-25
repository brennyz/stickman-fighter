/* ========================= ONLINE SFX SAMPLES (CC0) ======================
   Kenney.nl game audio — CC0 1.0 · mirror: ETdoFresh/kenney.nl via jsDelivr.
   Loads on first AudioSys.init; procedural synth remains fallback offline. */
const KENNEY_CDN = 'https://cdn.jsdelivr.net/gh/ETdoFresh/kenney.nl@master';
const SAMPLE_PACKS = {
  impact: `${KENNEY_CDN}/kenney_impactsounds/Audio`,
  ui: `${KENNEY_CDN}/kenney_interfacesounds/Audio`,
  digital: `${KENNEY_CDN}/kenney_digitalaudio/Audio`,
  rpg: `${KENNEY_CDN}/kenney_rpgaudio/Audio`,
  casino: `${KENNEY_CDN}/kenney_casinoaudio/Audio`,
  uiaudio: `${KENNEY_CDN}/kenney_uiaudio/Audio`,
};

function sampleUrl(pack, file) {
  const base = SAMPLE_PACKS[pack];
  return base ? `${base}/${file}` : '';
}

/** Multiple files per SFX id → random pick each play for variety. */
const SFX_SAMPLE_MAP = {
  select: { pack: 'ui', vol: 0.55, files: ['click_002.ogg', 'click_003.ogg', 'click_004.ogg', 'confirmation_001.ogg'] },
  bonus: { pack: 'ui', vol: 0.7, files: ['confirmation_002.ogg', 'confirmation_003.ogg', 'confirmation_004.ogg'] },
  bell: { pack: 'impact', vol: 0.75, files: ['impactBell_heavy_001.ogg', 'impactBell_heavy_002.ogg', 'impactBell_heavy_003.ogg'] },
  pickup: { pack: 'ui', vol: 0.65, files: ['drop_002.ogg', 'drop_003.ogg', 'drop_004.ogg'] },
  levelup: { pack: 'ui', vol: 0.8, files: ['confirmation_003.ogg', 'confirmation_004.ogg', 'bong_001.ogg'] },
  win: { pack: 'ui', vol: 0.85, files: ['confirmation_004.ogg', 'bong_001.ogg'] },
  lose: { pack: 'ui', vol: 0.7, files: ['error_002.ogg', 'error_003.ogg', 'back_003.ogg'] },
  gamble: { pack: 'casino', vol: 0.65, files: ['chipLay1.ogg', 'chipLay2.ogg', 'cardSlide3.ogg'] },
  gambleWin: { pack: 'casino', vol: 0.75, files: ['chipLay3.ogg', 'cardPlace2.ogg', 'cardPlace3.ogg'] },
  gambleBoss: { pack: 'impact', vol: 0.9, files: ['impactPunch_heavy_003.ogg', 'impactMetal_heavy_002.ogg'] },
  diceRoll: { pack: 'casino', vol: 0.6, files: ['cardShuffle.ogg', 'chipLay1.ogg', 'cardSlide1.ogg', 'cardSlide5.ogg'] },
  summon: { pack: 'digital', vol: 0.75, files: ['phaseJump3.ogg', 'phaseJump4.ogg', 'pepSound3.ogg'] },
  newmonster: { pack: 'rpg', vol: 0.7, files: ['bookOpen.ogg', 'doorOpen_1.ogg', 'creak2.ogg'] },
  combo: { pack: 'digital', vol: 0.65, files: ['pepSound1.ogg', 'pepSound2.ogg', 'highUp.ogg'] },
  comboEpic: { pack: 'digital', vol: 0.78, files: ['pepSound4.ogg', 'phaseJump5.ogg', 'highUp.ogg'] },
  comboMega: { pack: 'digital', vol: 0.85, files: ['phaseJump5.ogg', 'pepSound5.ogg', 'bong_001.ogg'] },
  punch: { pack: 'impact', vol: 0.82, files: ['impactPunch_medium_001.ogg', 'impactPunch_medium_002.ogg', 'impactPunch_medium_003.ogg', 'impactGeneric_light_001.ogg'] },
  kick: { pack: 'impact', vol: 0.88, files: ['impactPunch_heavy_001.ogg', 'impactSoft_medium_002.ogg', 'impactPunch_medium_004.ogg'] },
  hit2: { pack: 'impact', vol: 0.75, files: ['impactGeneric_light_002.ogg', 'impactGeneric_light_003.ogg', 'impactSoft_medium_001.ogg'] },
  hitHeavy: { pack: 'impact', vol: 0.92, files: ['impactPunch_heavy_002.ogg', 'impactPunch_heavy_003.ogg', 'impactMetal_heavy_001.ogg'] },
  hitMetal: { pack: 'impact', vol: 0.85, files: ['impactMetal_medium_001.ogg', 'impactMetal_medium_002.ogg', 'impactMetal_light_003.ogg'] },
  hitEnergy: { pack: 'digital', vol: 0.7, files: ['laser3.ogg', 'laser4.ogg', 'pepSound2.ogg'] },
  crit: { pack: 'impact', vol: 0.9, files: ['impactGlass_heavy_001.ogg', 'impactGlass_heavy_002.ogg', 'impactMetal_heavy_003.ogg'] },
  block: { pack: 'impact', vol: 0.7, files: ['impactMetal_light_001.ogg', 'impactMetal_light_002.ogg', 'impactWood_medium_001.ogg'] },
  swing: { pack: 'rpg', vol: 0.55, files: ['chop.ogg', 'drawKnife1.ogg', 'drawKnife2.ogg', 'cloth2.ogg'] },
  wKunai: { pack: 'rpg', vol: 0.5, files: ['drawKnife2.ogg', 'drawKnife3.ogg', 'cloth3.ogg'] },
  wFuuma: { pack: 'rpg', vol: 0.58, files: ['drawKnife3.ogg', 'chop.ogg'] },
  wBoemerang: { pack: 'digital', vol: 0.52, files: ['phaseJump1.ogg', 'lowDown.ogg', 'lowRandom.ogg'] },
  wLaser: { pack: 'digital', vol: 0.65, files: ['laser5.ogg', 'laser6.ogg', 'laser7.ogg'] },
  wZwaard: { pack: 'rpg', vol: 0.6, files: ['drawKnife1.ogg', 'chop.ogg', 'clothBelt.ogg'] },
  wSpeer: { pack: 'rpg', vol: 0.58, files: ['drawKnife2.ogg', 'footstep04.ogg', 'chop.ogg'] },
  wKnuppel: { pack: 'impact', vol: 0.8, files: ['impactWood_heavy_001.ogg', 'impactWood_medium_002.ogg'] },
  wGuvve: { pack: 'impact', vol: 0.75, files: ['impactSoft_heavy_001.ogg', 'impactPlank_medium_001.ogg'] },
  wKatana: { pack: 'rpg', vol: 0.62, files: ['chop.ogg', 'drawKnife3.ogg'] },
  wMaster: { pack: 'digital', vol: 0.78, files: ['phaseJump4.ogg', 'laser8.ogg', 'highUp.ogg'] },
  wNunchaku: { pack: 'rpg', vol: 0.52, files: ['cloth2.ogg', 'cloth3.ogg', 'cloth4.ogg'] },
  wHamer: { pack: 'impact', vol: 0.88, files: ['impactWood_heavy_001.ogg', 'impactWood_heavy_002.ogg', 'impactPunch_heavy_002.ogg'] },
  wKetting: { pack: 'impact', vol: 0.72, files: ['impactMetal_light_001.ogg', 'impactMetal_light_002.ogg', 'impactMetal_medium_001.ogg'] },
  wDonder: { pack: 'impact', vol: 0.82, files: ['impactMetal_heavy_001.ogg', 'impactMetal_heavy_003.ogg', 'impactPunch_heavy_004.ogg'] },
  wVoid: { pack: 'digital', vol: 0.68, files: ['lowThreeTone.ogg', 'phaseJump3.ogg', 'phaseJump4.ogg'] },
  wFan: { pack: 'rpg', vol: 0.48, files: ['clothBelt.ogg', 'clothBelt2.ogg', 'cloth2.ogg'] },
  shuriken: { pack: 'digital', vol: 0.55, files: ['laser1.ogg', 'laser2.ogg', 'lowDown.ogg'] },
  shoot: { pack: 'digital', vol: 0.62, files: ['laser4.ogg', 'laser5.ogg'] },
  laser: { pack: 'digital', vol: 0.68, files: ['laser6.ogg', 'laser7.ogg', 'laser8.ogg', 'laser9.ogg'] },
  special: { pack: 'digital', vol: 0.7, files: ['phaseJump3.ogg', 'pepSound4.ogg'] },
  subst: { pack: 'rpg', vol: 0.65, files: ['cloth4.ogg', 'clothBelt2.ogg', 'dropLeather.ogg'] },
  dash: { pack: 'digital', vol: 0.5, files: ['phaseJump1.ogg', 'lowDown.ogg', 'lowRandom.ogg'] },
  jump: { pack: 'digital', vol: 0.58, files: ['phaseJump1.ogg', 'phaseJump2.ogg', 'highUp.ogg'] },
  land: { pack: 'impact', vol: 0.55, files: ['footstep_concrete_001.ogg', 'footstep_concrete_002.ogg', 'footstep_grass_002.ogg'] },
  step: { pack: 'impact', vol: 0.35, files: ['footstep_grass_001.ogg', 'footstep_grass_003.ogg', 'footstep_carpet_002.ogg'] },
  travel: { pack: 'impact', vol: 0.4, files: ['footstep_carpet_001.ogg', 'footstep_carpet_003.ogg', 'footstep_wood_002.ogg'] },
  hurt: { pack: 'ui', vol: 0.65, files: ['error_001.ogg', 'error_002.ogg'] },
  die: { pack: 'impact', vol: 0.85, files: ['impactGlass_heavy_003.ogg', 'impactSoft_heavy_003.ogg', 'impactWood_heavy_002.ogg'] },
  roar: { pack: 'impact', vol: 0.95, files: ['impactPunch_heavy_004.ogg', 'impactSoft_heavy_004.ogg', 'impactMetal_heavy_004.ogg'] },
  explode: { pack: 'impact', vol: 0.9, files: ['impactMetal_heavy_002.ogg', 'impactGlass_heavy_004.ogg', 'impactPunch_heavy_003.ogg'] },
  brick: { pack: 'impact', vol: 0.7, files: ['impactPlank_medium_002.ogg', 'impactWood_light_002.ogg', 'impactGeneric_light_004.ogg'] },
  crack: { pack: 'impact', vol: 0.65, files: ['impactGlass_light_002.ogg', 'impactWood_light_003.ogg'] },
  whoosh: { pack: 'digital', vol: 0.45, files: ['lowDown.ogg', 'lowRandom.ogg', 'phaseJump1.ogg'] },
  skillSwoosh: { pack: 'digital', vol: 0.62, files: ['lowDown.ogg', 'phaseJump2.ogg', 'lowRandom.ogg'] },
  skillSwooshEpic: { pack: 'digital', vol: 0.78, files: ['phaseJump5.ogg', 'laser8.ogg', 'highUp.ogg'] },
  megaDrop: { pack: 'digital', vol: 0.88, files: ['phaseJump5.ogg', 'pepSound5.ogg', 'bong_001.ogg'] },
  tideSurge: { pack: 'digital', vol: 0.65, files: ['lowThreeTone.ogg', 'phaseJump3.ogg', 'laser4.ogg'] },
  bossTurn: { pack: 'impact', vol: 0.95, files: ['impactPunch_heavy_004.ogg', 'impactMetal_heavy_004.ogg', 'impactBell_heavy_001.ogg'] },
  checkpoint: { pack: 'ui', vol: 0.72, files: ['confirmation_002.ogg', 'bong_001.ogg'] },
  bossArrive: { pack: 'impact', vol: 0.95, files: ['impactPunch_heavy_004.ogg', 'impactMetal_heavy_003.ogg'] },
  bossWait: { pack: 'impact', vol: 0.6, files: ['impactSoft_medium_003.ogg', 'creak1.ogg'] },
  masterSword: { pack: 'digital', vol: 0.82, files: ['phaseJump5.ogg', 'laser8.ogg', 'highUp.ogg'] },
  waveClear: { pack: 'ui', vol: 0.68, files: ['confirmation_003.ogg', 'confirmation_001.ogg'] },
  hitstop: { pack: 'impact', vol: 0.45, files: ['impactGeneric_light_001.ogg', 'impactMetal_light_004.ogg'] },
  ketsbam: { pack: 'impact', vol: 1, files: ['impactPunch_heavy_004.ogg', 'impactMetal_heavy_004.ogg', 'impactGlass_heavy_004.ogg'] },
  ketsbamCharge: { pack: 'digital', vol: 0.55, rate: 0.88, files: ['lowRandom.ogg', 'lowThreeTone.ogg'] },
};

/** Per-skill Kenney CC0 samples — each skill id maps to its own file set. */
const SKILL_SFX_SAMPLES = {
  rasengan: { pack: 'digital', vol: 0.72, files: ['phaseJump2.ogg', 'phaseJump3.ogg', 'pepSound3.ogg'] },
  fireball_jutsu: { pack: 'digital', vol: 0.74, rate: 1.06, files: ['laser5.ogg', 'pepSound1.ogg', 'highUp.ogg'] },
  chidori: { pack: 'digital', vol: 0.75, files: ['laser2.ogg', 'laser3.ogg', 'highUp.ogg'] },
  shadow_clone_burst: { pack: 'rpg', vol: 0.68, files: ['cloth4.ogg', 'dropLeather.ogg', 'clothBelt2.ogg'] },
  gentle_palm: { pack: 'impact', vol: 0.7, files: ['impactSoft_medium_001.ogg', 'impactGeneric_light_002.ogg'] },
  rinnegan: { pack: 'digital', vol: 0.78, files: ['lowThreeTone.ogg', 'phaseJump4.ogg', 'laser1.ogg'] },
  eight_gates: { pack: 'impact', vol: 0.82, rate: 1.08, files: ['impactPunch_heavy_001.ogg', 'impactPunch_heavy_002.ogg', 'impactMetal_heavy_001.ogg'] },
  black_hole: { pack: 'digital', vol: 0.8, rate: 0.86, files: ['lowThreeTone.ogg', 'lowRandom.ogg', 'phaseJump4.ogg'] },
  kamehameha: { pack: 'digital', vol: 0.8, files: ['laser8.ogg', 'laser9.ogg', 'pepSound4.ogg'] },
  galick_gun: { pack: 'digital', vol: 0.76, rate: 0.94, files: ['laser6.ogg', 'laser7.ogg', 'lowDown.ogg'] },
  destructo_disc: { pack: 'digital', vol: 0.72, rate: 1.12, files: ['laser1.ogg', 'laser2.ogg', 'phaseJump1.ogg'] },
  instant_dash: { pack: 'digital', vol: 0.7, rate: 1.18, files: ['phaseJump1.ogg', 'highUp.ogg', 'lowRandom.ogg'] },
  final_flash: { pack: 'digital', vol: 0.84, files: ['laser8.ogg', 'phaseJump5.ogg', 'pepSound5.ogg'] },
  spirit_bomb: { pack: 'digital', vol: 0.85, rate: 0.82, files: ['lowThreeTone.ogg', 'phaseJump2.ogg', 'pepSound3.ogg'] },
  getsuga: { pack: 'digital', vol: 0.74, files: ['laser3.ogg', 'laser4.ogg', 'pepSound2.ogg'] },
  cero: { pack: 'digital', vol: 0.78, files: ['laser5.ogg', 'laser6.ogg', 'laser7.ogg'] },
  bankai_slash: { pack: 'rpg', vol: 0.76, rate: 1.05, files: ['drawKnife3.ogg', 'chop.ogg', 'footstep04.ogg'] },
  gum_rocket: { pack: 'digital', vol: 0.68, rate: 1.04, files: ['lowRandom.ogg', 'phaseJump2.ogg', 'pepSound1.ogg'] },
  gear_second: { pack: 'digital', vol: 0.74, rate: 1.1, files: ['pepSound2.ogg', 'pepSound3.ogg', 'highUp.ogg'] },
  thunder_palm: { pack: 'impact', vol: 0.78, files: ['impactBell_heavy_001.ogg', 'impactBell_heavy_002.ogg'] },
  serious_punch: { pack: 'impact', vol: 0.92, files: ['impactPunch_heavy_004.ogg', 'impactPunch_heavy_003.ogg'] },
  serious_blast: { pack: 'digital', vol: 0.86, files: ['laser9.ogg', 'laser8.ogg', 'phaseJump5.ogg'] },
  sun_palm: { pack: 'impact', vol: 0.72, files: ['impactBell_heavy_002.ogg', 'impactSoft_medium_002.ogg'] },
  moon_pull: { pack: 'digital', vol: 0.76, rate: 0.95, files: ['lowThreeTone.ogg', 'phaseJump3.ogg', 'laser1.ogg'] },
};

/** Per-super Kenney CC0 samples — charge + finish pairs. */
const SUPER_SFX_SAMPLES = {
  super_shield_charge: { pack: 'impact', vol: 0.62, rate: 0.92, files: ['impactMetal_light_001.ogg', 'impactWood_medium_001.ogg'] },
  super_shield: { pack: 'impact', vol: 0.88, files: ['impactBell_heavy_002.ogg', 'impactMetal_heavy_003.ogg'] },
  super_heal_charge: { pack: 'ui', vol: 0.62, files: ['confirmation_002.ogg', 'drop_003.ogg'] },
  super_heal: { pack: 'ui', vol: 0.78, files: ['confirmation_004.ogg', 'bong_001.ogg'] },
  super_sharingan_charge: { pack: 'digital', vol: 0.68, rate: 0.9, files: ['lowThreeTone.ogg', 'lowRandom.ogg'] },
  super_sharingan: { pack: 'digital', vol: 0.82, files: ['laser2.ogg', 'phaseJump4.ogg', 'highUp.ogg'] },
  super_lightning_charge: { pack: 'digital', vol: 0.72, files: ['laser1.ogg', 'laser2.ogg', 'lowRandom.ogg'] },
  super_lightning: { pack: 'digital', vol: 0.9, files: ['laser7.ogg', 'laser8.ogg', 'laser9.ogg'] },
  super_meteor_charge: { pack: 'impact', vol: 0.65, rate: 0.85, files: ['impactWood_heavy_001.ogg', 'creak1.ogg'] },
  super_meteor: { pack: 'impact', vol: 0.95, files: ['impactPunch_heavy_004.ogg', 'impactGlass_heavy_004.ogg'] },
  super_rage_charge: { pack: 'digital', vol: 0.7, rate: 0.95, files: ['lowRandom.ogg', 'pepSound1.ogg'] },
  super_rage: { pack: 'impact', vol: 0.92, files: ['impactPunch_heavy_003.ogg', 'impactMetal_heavy_004.ogg'] },
  super_time_charge: { pack: 'digital', vol: 0.66, rate: 0.88, files: ['lowThreeTone.ogg', 'phaseJump1.ogg'] },
  super_time: { pack: 'digital', vol: 0.84, files: ['phaseJump5.ogg', 'pepSound5.ogg', 'laser3.ogg'] },
  super_clone_charge: { pack: 'rpg', vol: 0.64, files: ['cloth4.ogg', 'dropLeather.ogg'] },
  super_clone: { pack: 'rpg', vol: 0.76, files: ['clothBelt2.ogg', 'chop.ogg', 'drawKnife2.ogg'] },
  super_void_charge: { pack: 'digital', vol: 0.68, rate: 0.86, files: ['lowDown.ogg', 'lowRandom.ogg'] },
  super_void: { pack: 'impact', vol: 0.92, files: ['impactGlass_heavy_003.ogg', 'impactMetal_heavy_002.ogg'] },
};

Object.assign(SFX_SAMPLE_MAP, SKILL_SFX_SAMPLES, SUPER_SFX_SAMPLES);

function isSkillSfxId(name) {
  return !!(name && SKILL_SFX_SAMPLES[name]);
}

function isSuperSfxId(name) {
  return !!(name && SUPER_SFX_SAMPLES[name]);
}

function skillSynthSeed(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Procedural fallback when Kenney samples offline — unique per skill id. */
function playSkillSynthFallback(name, h) {
  if (!isSkillSfxId(name)) return false;
  const sk = typeof skillById === 'function' ? skillById(name) : null;
  if (!sk || sk.id !== name) return false;
  const { T, D, N, S, now, lite } = h;
  const seed = skillSynthSeed(name);
  const det = 1 + (seed % 21) * 0.007;
  const mul = (f) => f * det;
  const beh = sk.behavior || 'orb';
  if (beh === 'dash') {
    T(mul(920), mul(1580), 0.16, 'sine', 0.14, now);
    N(0.12, 0.11, 5200 + (seed % 800), true, now);
    T(mul(1400), mul(920), 0.06, 'triangle', 0.1, now + 0.05);
    if (!lite) T(mul(180 + seed % 40), mul(90), 0.07, 'sine', 0.08, now + 0.02);
  } else if (beh === 'beam') {
    T(mul(280), mul(920), 0.2, 'sine', 0.13, now);
    D(mul(520), mul(1220), 0.14, 'triangle', 0.11, now + 0.04, 10 + seed % 6);
    N(0.1, 0.09, 3800 + (seed % 600), true, now);
    if (!lite) S([mul(880), mul(1047), mul(1175)], now + 0.08);
  } else if (beh === 'disc') {
    T(mul(680), mul(420), 0.12, 'triangle', 0.13, now);
    T(mul(980), mul(680), 0.08, 'sine', 0.1, now + 0.04);
    N(0.08, 0.1, 4400 + (seed % 500), true, now);
  } else if (beh === 'pull' || beh === 'meteor') {
    T(mul(240), mul(760), 0.14, 'sine', 0.14, now);
    T(mul(760), mul(480), 0.15, 'triangle', 0.12, now + 0.04);
    T(mul(980), mul(1320), 0.08, 'sine', 0.11, now + 0.1);
    N(0.1, 0.11, 1900 + (seed % 400), true, now + 0.02);
    if (!lite) T(mul(55), mul(32), 0.16, 'sawtooth', 0.09, now + 0.05);
  } else {
    T(mul(320), mul(1040), 0.2, 'sine', 0.13, now);
    D(mul(580), mul(1220), 0.16, 'triangle', 0.11, now + 0.04, 10);
    N(0.12, 0.1, 3600 + (seed % 700), true, now);
    if (!lite) S([mul(880), mul(1047), mul(1175)], now + 0.1);
  }
  return true;
}

function playSkillSuperReadySynth(kind, h) {
  if (!kind || !isSkillSfxId(kind)) return false;
  const sk = typeof skillById === 'function' ? skillById(kind) : null;
  if (!sk || sk.id !== kind) return false;
  const { T, N, now, lite } = h;
  const seed = skillSynthSeed(kind);
  const det = 1 + (seed % 15) * 0.006;
  const mul = (f) => f * det;
  const beh = sk.behavior || 'orb';
  if (beh === 'dash') {
    T(mul(920), mul(1480), 0.14, 'sine', 0.16, now);
    N(0.1, 0.14, 5400, true, now);
    T(mul(1200), mul(920), 0.06, 'triangle', 0.1, now + 0.08);
  } else if (beh === 'pull' || beh === 'meteor') {
    T(mul(360), mul(660), 0.12, 'sine', 0.16, now);
    T(mul(880), mul(1180), 0.1, 'triangle', 0.12, now + 0.05);
    T(mul(110), mul(60), 0.14, 'sine', 0.09, now + 0.03);
  } else if (beh === 'beam' || beh === 'disc') {
    T(mul(520), mul(980), 0.12, 'sine', 0.15, now);
    T(mul(880), mul(1320), 0.09, 'triangle', 0.12, now + 0.05);
    if (!lite) T(mul(1320), mul(880), 0.07, 'sine', 0.08, now + 0.1);
  } else {
    T(mul(720), mul(1180), 0.1, 'sine', 0.14, now);
    T(mul(980), mul(1320), 0.09, 'triangle', 0.12, now + 0.05);
    T(mul(1320), mul(880), 0.07, 'sine', 0.08, now + 0.1);
  }
  return true;
}

/** Procedural fallback for super charge/finish sfx when offline. */
function playSuperSynthFallback(name, h) {
  if (!isSuperSfxId(name)) return false;
  const { T, N, C, now, lite } = h;
  const charge = name.endsWith('_charge');
  if (charge) {
    T(88, charge ? 220 : 52, charge ? 1.6 : 0.4, 'sawtooth', 0.18, now);
    N(charge ? 1.5 : 0.3, 0.14, 720, false, now);
  } else if (name.includes('lightning')) {
    for (let i = 0; i < (lite ? 3 : 6); i++) {
      T(880 + i * 120, 220, 0.06, 'square', 0.12, now + i * 0.05);
      N(0.04, 0.1, 4000 + i * 400, true, now + i * 0.05);
    }
  } else if (name.includes('heal')) {
    C([523, 659, 784, 988], 'sine', 0.12, 0.08, now);
  } else if (name.includes('shield')) {
    T(220, 440, 0.2, 'triangle', 0.16, now);
    N(0.12, 0.12, 1200, false, now);
  } else {
    N(0.3, 0.32, 400, false, now);
    T(52, 20, 0.36, 'sawtooth', 0.28, now);
    if (!lite) C([196, 247, 330, 392], 'square', 0.1, 0.05, now + 0.08);
  }
  return true;
}

function collectSampleUrls() {
  const urls = [];
  const seen = new Set();
  for (const cfg of Object.values(SFX_SAMPLE_MAP)) {
    for (const f of cfg.files || []) {
      const u = sampleUrl(cfg.pack, f);
      if (u && !seen.has(u)) { seen.add(u); urls.push(u); }
    }
  }
  return urls;
}

function sampleMapForSfx(name) {
  return SFX_SAMPLE_MAP[name] || SKILL_SFX_SAMPLES[name] || SUPER_SFX_SAMPLES[name] || null;
}
