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
  shuriken: { pack: 'digital', vol: 0.55, files: ['laser1.ogg', 'laser2.ogg', 'lowDown.ogg'] },
  shoot: { pack: 'digital', vol: 0.62, files: ['laser4.ogg', 'laser5.ogg'] },
  laser: { pack: 'digital', vol: 0.68, files: ['laser6.ogg', 'laser7.ogg', 'laser8.ogg', 'laser9.ogg'] },
  rasengan: { pack: 'digital', vol: 0.72, files: ['phaseJump2.ogg', 'phaseJump3.ogg', 'pepSound3.ogg'] },
  chidori: { pack: 'digital', vol: 0.75, files: ['laser2.ogg', 'laser3.ogg', 'highUp.ogg'] },
  rinnegan: { pack: 'digital', vol: 0.78, files: ['lowThreeTone.ogg', 'phaseJump4.ogg', 'laser1.ogg'] },
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
  checkpoint: { pack: 'ui', vol: 0.72, files: ['confirmation_002.ogg', 'bong_001.ogg'] },
  bossArrive: { pack: 'impact', vol: 0.95, files: ['impactPunch_heavy_004.ogg', 'impactMetal_heavy_003.ogg'] },
  bossWait: { pack: 'impact', vol: 0.6, files: ['impactSoft_medium_003.ogg', 'creak1.ogg'] },
  masterSword: { pack: 'digital', vol: 0.82, files: ['phaseJump5.ogg', 'laser8.ogg', 'highUp.ogg'] },
  wMaster: { pack: 'digital', vol: 0.7, files: ['laser7.ogg', 'pepSound5.ogg'] },
  waveClear: { pack: 'ui', vol: 0.68, files: ['confirmation_003.ogg', 'confirmation_001.ogg'] },
  hitstop: { pack: 'impact', vol: 0.45, files: ['impactGeneric_light_001.ogg', 'impactMetal_light_004.ogg'] },
  ketsbam: { pack: 'impact', vol: 1, files: ['impactPunch_heavy_004.ogg', 'impactMetal_heavy_004.ogg', 'impactGlass_heavy_004.ogg'] },
  ketsbamCharge: { pack: 'digital', vol: 0.55, rate: 0.88, files: ['lowRandom.ogg', 'lowThreeTone.ogg'] },
};

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
  return SFX_SAMPLE_MAP[name] || null;
}
