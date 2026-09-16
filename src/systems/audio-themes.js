/* ======================== AUDIO THEME PACKS ============================
   Classic = current procedural pack (unchanged).
   Jungle / fire-bamboo-boesa / halloween = packs + light scenery.
   Player pick: save.audioTheme (sidecar + persist).
   Season overlay (#277): html[data-season-audio], currentSeasonId(),
   AudioSys.seasonId(), sf-season-change — no season UI here. */
const AUDIO_THEME_IDS = ['classic', 'jungle', 'fire-bamboo-boesa', 'halloween'];
/** #277 overlay ids. Do not invent new season UI ids. */
const SEASON_AUDIO_IDS = ['classic', 'jungle', 'halloween', 'winter', 'summer'];
const AUDIO_THEME_PACKS = ['classic', 'jungle', 'fire-bamboo-boesa', 'halloween', 'winter', 'summer'];
const AUDIO_THEME_META = {
  classic: {
    id: 'classic',
    label: 'Classic',
    sub: 'Huidige pack',
  },
  jungle: {
    id: 'jungle',
    label: 'Jungle',
    sub: 'Groen · drums',
  },
  'fire-bamboo-boesa': {
    id: 'fire-bamboo-boesa',
    label: 'Vuur-bamboe',
    sub: 'Boesa · ember',
  },
  halloween: {
    id: 'halloween',
    label: 'Halloween',
    sub: 'Spooky · ostinato',
  },
  winter: {
    id: 'winter',
    label: 'Winter',
    sub: 'Seizoen-hook',
  },
  summer: {
    id: 'summer',
    label: 'Zomer',
    sub: 'Seizoen-hook',
  },
};
const AUDIO_THEME_PROFILES = {
  classic: {
    id: 'classic',
    bpmMul: 1,
    transpose: 0,
    leadType: 'square',
    hatFreq: 6500,
    sfxRate: 1,
    sfxPitch: 1,
    sfxFilter: null,
  },
  jungle: {
    id: 'jungle',
    bpmMul: 0.92,
    transpose: -2,
    leadType: 'sine',
    hatFreq: 4200,
    sfxRate: 0.94,
    sfxPitch: 0.92,
    sfxFilter: { type: 'lowpass', freq: 3400 },
  },
  'fire-bamboo-boesa': {
    id: 'fire-bamboo-boesa',
    bpmMul: 0.88,
    transpose: 1,
    leadType: 'triangle',
    hatFreq: 2800,
    sfxRate: 1.03,
    sfxPitch: 1.06,
    sfxFilter: { type: 'lowpass', freq: 2200 },
  },
  halloween: {
    id: 'halloween',
    bpmMul: 0.92,
    transpose: 0,
    leadType: 'triangle',
    hatFreq: 2400,
    sfxRate: 0.9,
    sfxPitch: 0.88,
    sfxFilter: { type: 'lowpass', freq: 1800 },
  },
  winter: {
    id: 'winter',
    bpmMul: 0.9,
    transpose: 4,
    leadType: 'sine',
    hatFreq: 5200,
    sfxRate: 1,
    sfxPitch: 1.04,
    sfxFilter: { type: 'lowpass', freq: 3800 },
  },
  summer: {
    id: 'summer',
    bpmMul: 1.04,
    transpose: 3,
    leadType: 'triangle',
    hatFreq: 5800,
    sfxRate: 1.02,
    sfxPitch: 1.03,
    sfxFilter: null,
  },
};

const AUDIO_THEME_PREF_KEY = 'stickfighter_audio_theme_v1';

function normalizeAudioTheme(id) {
  const raw = String(id == null ? '' : id).toLowerCase().trim();
  if (raw === 'default' || raw === 'auto') return 'classic';
  if (raw === 'fire-bamboo') return 'fire-bamboo-boesa';
  return AUDIO_THEME_IDS.includes(raw) ? raw : 'classic';
}

function normalizeSeasonAudioId(id) {
  const raw = String(id == null ? '' : id).toLowerCase().trim();
  if (!raw || raw === 'default' || raw === 'auto') return 'classic';
  if (raw === 'fire-bamboo' || raw === 'fire-bamboo-boesa') return 'fire-bamboo-boesa';
  return SEASON_AUDIO_IDS.includes(raw) ? raw : '';
}

/** Map #277 season id → soundtrack pack. Overlay classic = no override. */
function seasonIdToAudioPack(id) {
  const season = normalizeSeasonAudioId(id);
  if (!season || season === 'classic') return '';
  if (season === 'fire-bamboo-boesa') return 'fire-bamboo-boesa';
  if (AUDIO_THEME_PACKS.includes(season)) return season;
  return '';
}

function readSeasonAudioHookId() {
  try {
    if (typeof currentSeasonId === 'function') {
      const id = normalizeSeasonAudioId(currentSeasonId());
      if (id) return id;
    }
  } catch (_) {}
  try {
    const root = typeof document !== 'undefined' && document.documentElement;
    const raw = root && root.dataset && (root.dataset.seasonAudio || root.dataset.season);
    const id = normalizeSeasonAudioId(raw);
    if (id) return id;
  } catch (_) {}
  try {
    if (typeof AudioSys !== 'undefined' && AudioSys && typeof AudioSys.seasonId === 'function') {
      const id = normalizeSeasonAudioId(AudioSys.seasonId());
      if (id) return id;
    }
  } catch (_) {}
  return 'classic';
}

function resolveSeasonAudioId() {
  return readSeasonAudioHookId() || 'classic';
}

function getEffectiveAudioTheme() {
  const pack = seasonIdToAudioPack(resolveSeasonAudioId());
  if (pack) return pack;
  return getAudioTheme();
}

function readAudioThemeSidecar() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(AUDIO_THEME_PREF_KEY);
    if (raw === 'fire-bamboo') return 'fire-bamboo-boesa';
    return AUDIO_THEME_IDS.includes(raw) ? raw : null;
  } catch (_) {
    return null;
  }
}

function writeAudioThemeSidecar(id) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AUDIO_THEME_PREF_KEY, normalizeAudioTheme(id));
  } catch (_) {}
}

function persistAudioTheme(id) {
  const next = normalizeAudioTheme(id);
  if (typeof save !== 'undefined' && save) save.audioTheme = next;
  try { if (typeof persist === 'function') persist(); } catch (_) {}
  if (typeof save !== 'undefined' && save && save.audioTheme !== next) save.audioTheme = next;
  writeAudioThemeSidecar(next);
  return next;
}

function getAudioTheme() {
  try {
    const fromSave = (typeof save !== 'undefined' && save) ? save.audioTheme : null;
    if (AUDIO_THEME_IDS.includes(fromSave)) return fromSave;
    const side = readAudioThemeSidecar();
    if (side) {
      if (typeof save !== 'undefined' && save) save.audioTheme = side;
      return side;
    }
  } catch (_) {}
  return 'classic';
}

function audioThemeProfile() {
  return AUDIO_THEME_PROFILES[getEffectiveAudioTheme()] || AUDIO_THEME_PROFILES.classic;
}

function audioThemeLeadType() {
  return audioThemeProfile().leadType || 'square';
}

function audioThemeHatFreq() {
  return audioThemeProfile().hatFreq || 6500;
}

function audioThemeSfxRate() {
  return audioThemeProfile().sfxRate || 1;
}

function audioThemeSfxPitch() {
  return audioThemeProfile().sfxPitch || 1;
}

function audioThemeSfxFilter() {
  return audioThemeProfile().sfxFilter || null;
}

function applyAudioThemeDom() {
  try {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.setAttribute('data-audio-theme', getEffectiveAudioTheme());
  } catch (_) {}
}

function uniqueSortedInts(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const n = arr[i];
    if (typeof n === 'number' && !out.includes(n)) out.push(n);
  }
  out.sort((a, b) => a - b);
  return out;
}

function transposePat(pat, semitones) {
  if (!Array.isArray(pat)) return pat;
  if (!semitones) return pat.slice();
  return pat.map((n) => (n == null ? null : n + semitones));
}

function cloneSongPattern(src) {
  if (!src) return null;
  return {
    bpm: src.bpm,
    kick: (src.kick || []).slice(),
    snare: (src.snare || []).slice(),
    hat: (src.hat || []).slice(),
    bass: (src.bass || []).slice(),
    lead: (src.lead || []).map((p) => (Array.isArray(p) ? p.slice() : p)),
  };
}

function resolveHalloweenSongName(name) {
  const id = String(name || '');
  if (!id) return 'halloweenMenu';
  if (id === 'boss' || id === 'boss2' || id === 'bossFury' || id === 'miniboss') return 'halloweenBoss';
  if (id.indexOf('menu') === 0 || id === 'shop' || id === 'victory' || id === 'gameover') return 'halloweenMenu';
  if (id.indexOf('summon') === 0) return 'halloweenMenu';
  return 'halloweenBattle';
}

function resolveThemedSong(name) {
  const theme = getEffectiveAudioTheme();
  if (theme === 'halloween' && typeof SONGS !== 'undefined') {
    const mapped = resolveHalloweenSongName(name);
    if (SONGS[mapped]) return cloneSongPattern(SONGS[mapped]);
  }
  const base = (typeof SONGS !== 'undefined' && SONGS[name]) || null;
  if (!base) return null;
  const prof = AUDIO_THEME_PROFILES[theme] || AUDIO_THEME_PROFILES.classic;
  const song = {
    bpm: Math.max(48, Math.round(base.bpm * (prof.bpmMul || 1))),
    kick: (base.kick || []).slice(),
    snare: (base.snare || []).slice(),
    hat: (base.hat || []).slice(),
    bass: transposePat(base.bass || [], prof.transpose || 0),
    lead: (base.lead || []).map((p) => transposePat(p, prof.transpose || 0)),
  };
  if (theme === 'jungle') {
    song.hat = uniqueSortedInts(song.hat.concat([1, 5, 9, 13]));
  } else if (theme === 'fire-bamboo-boesa') {
    song.kick = uniqueSortedInts(song.kick.concat([6]));
  } else if (theme === 'halloween') {
    song.hat = uniqueSortedInts((song.hat || []).filter((n, i) => i % 2 === 0));
  }
  return song;
}

function replayAudioThemeSong() {
  try {
    if (typeof AudioSys === 'undefined' || !AudioSys) return;
    if (typeof AudioSys.replayForTheme === 'function') {
      AudioSys.replayForTheme();
      return;
    }
    const cur = AudioSys.currentSongId ? AudioSys.currentSongId() : (AudioSys.desiredSong || '');
    if (!cur) return;
    AudioSys.song = null;
    AudioSys.play(cur);
  } catch (_) {}
}

let _seasonAudioBound = false;
function onSeasonAudioChange() {
  applyAudioThemeDom();
  replayAudioThemeSong();
}

function bindSeasonAudioListener() {
  if (_seasonAudioBound) return;
  _seasonAudioBound = true;
  try {
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('sf-season-change', onSeasonAudioChange);
    }
  } catch (_) {}
}

function initAudioThemeFromStorage() {
  const side = readAudioThemeSidecar();
  const fromSave = (typeof save !== 'undefined' && save && AUDIO_THEME_IDS.includes(save.audioTheme))
    ? save.audioTheme
    : null;
  persistAudioTheme(side || fromSave || 'classic');
  bindSeasonAudioListener();
  applyAudioThemeDom();
}

function syncAudioThemeAfterSaveChange() {
  persistAudioTheme(getAudioTheme());
  applyAudioThemeDom();
  replayAudioThemeSong();
  try { renderAudioThemeSwitch(); } catch (_) {}
}

function setAudioTheme(id) {
  const next = normalizeAudioTheme(id);
  const was = getAudioTheme();
  const wasEff = getEffectiveAudioTheme();
  let songTheme = null;
  try { songTheme = AudioSys && AudioSys.song && AudioSys.song.audioTheme; } catch (_) {}
  persistAudioTheme(next);
  applyAudioThemeDom();
  const nowEff = getEffectiveAudioTheme();
  const needReplay = wasEff !== nowEff || (songTheme && songTheme !== nowEff);
  if (needReplay) replayAudioThemeSong();
  if (was !== next) {
    try { playAudioThemePreview(); } catch (_) {}
  }
  try { renderAudioThemeSwitch(); } catch (_) {}
  try { if (typeof UI !== 'undefined' && UI.renderSettings) UI.renderSettings(); } catch (_) {}
  try { if (typeof UI !== 'undefined' && UI.renderPauseToggles) UI.renderPauseToggles(); } catch (_) {}
  return next;
}

function playAudioThemePreview() {
  if (typeof AudioSys === 'undefined' || !AudioSys || !AudioSys.ctx || !save || !save.sfx) return;
  const theme = getAudioTheme();
  const now = AudioSys.ctx.currentTime;
  if (theme === 'jungle') {
    AudioSys.tone(210, 90, 0.07, 'triangle', 0.08, null, now);
    AudioSys.tone(880, 990, 0.09, 'sine', 0.045, null, now + 0.05);
  } else if (theme === 'fire-bamboo-boesa') {
    AudioSys.tone(620, 310, 0.07, 'triangle', 0.07, null, now);
    AudioSys.tone(784, 880, 0.1, 'sine', 0.05, null, now + 0.04);
  } else if (theme === 'halloween') {
    AudioSys.tone(220, 220, 0.08, 'triangle', 0.07, null, now);
    AudioSys.tone(440, 523, 0.1, 'triangle', 0.05, null, now + 0.06);
  } else {
    AudioSys.tone(660, 820, 0.07, 'sine', 0.06, null, now);
  }
}

function scheduleAudioThemeStep(audio, i, bar, t, spb) {
  const theme = getEffectiveAudioTheme();
  if (theme === 'classic' || !audio || !audio.musicGain) return;
  const lite = (typeof save !== 'undefined' && save && save.liteFx)
    || (typeof Perf !== 'undefined' && Perf.tier >= 1);
  const mg = audio.musicGain;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  if (theme === 'jungle') {
    if (i === 6 || i === 14) audio.tone(midi(74), midi(67), spb * 0.32, 'triangle', 0.036, mg, t);
    if (!lite && i === 0 && bar % 4 === 2) audio.tone(midi(84), midi(88), spb * 1.2, 'sine', 0.026, mg, t);
    return;
  }
  if (theme === 'fire-bamboo-boesa') {
    if (i === 0 && bar % 2 === 0) audio.noise(0.036, 0.028, 1200, false, mg, t);
    if (i === 3 || i === 11) audio.tone(midi(72), midi(60), spb * 0.24, 'triangle', 0.038, mg, t);
    if (!lite && i === 4 && bar % 2 === 0) audio.tone(midi(81), midi(81), spb * 1.8, 'sine', 0.03, mg, t);
    return;
  }
  if (theme === 'halloween') {
    if (i === 0 && bar % 2 === 0) audio.tone(midi(45), midi(45), spb * 1.4, 'triangle', 0.05, mg, t);
    if (!lite && i === 8) audio.tone(midi(57), midi(55), spb * 0.8, 'sine', 0.03, mg, t);
    return;
  }
  if (theme === 'winter') {
    if (!lite && i === 4) audio.tone(midi(84), midi(88), spb * 1.1, 'sine', 0.024, mg, t);
    return;
  }
  if (theme === 'summer' && (i === 6 || i === 14)) {
    audio.tone(midi(76), midi(79), spb * 0.28, 'triangle', 0.03, mg, t);
  }
}

let _themeSfxAccentAt = 0;
function playAudioThemeSfxAccent(audio, name) {
  const theme = getEffectiveAudioTheme();
  if (theme === 'classic' || !audio) return;
  const combat = name === 'punch' || name === 'kick' || name === 'hit' || name === 'hit2'
    || name === 'swing' || name === 'hitHeavy' || (name && name.charAt(0) === 'w');
  if (!combat) return;
  const nowMs = Date.now();
  if (nowMs - _themeSfxAccentAt < 110) return;
  _themeSfxAccentAt = nowMs;
  if (theme === 'jungle') {
    audio.tone(600, 260, 0.03, 'triangle', 0.03);
    return;
  }
  if (theme === 'fire-bamboo-boesa') {
    audio.tone(860, 400, 0.032, 'sine', 0.028);
    return;
  }
  if (theme === 'halloween') {
    audio.tone(196, 147, 0.04, 'triangle', 0.028);
  }
}

function parseHexColor(hex) {
  if (typeof hex !== 'string') return null;
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixHexColor(a, b, amt) {
  const pa = parseHexColor(a), pb = parseHexColor(b);
  if (!pa || !pb) return a;
  const t = Math.max(0, Math.min(1, amt));
  const m = (x, y) => Math.round(x + (y - x) * t);
  const to = (n) => n.toString(16).padStart(2, '0');
  return '#' + to(m(pa.r, pb.r)) + to(m(pa.g, pb.g)) + to(m(pa.b, pb.b));
}

function resolveAudioThemePalette(th) {
  if (!th) return th;
  const theme = getEffectiveAudioTheme();
  if (theme === 'classic') return th;
  if (theme === 'jungle') {
    return {
      sky1: mixHexColor(th.sky1, '#2a6a40', 0.22),
      sky2: mixHexColor(th.sky2, '#8fbf78', 0.18),
      hill: mixHexColor(th.hill, '#1e4a28', 0.28),
      hill2: mixHexColor(th.hill2, '#163820', 0.24),
      ground: mixHexColor(th.ground, '#3a4a28', 0.2),
      gtop: mixHexColor(th.gtop, '#4a6a38', 0.18),
      deco: th.deco,
    };
  }
  if (theme === 'fire-bamboo-boesa') {
    return {
      sky1: mixHexColor(th.sky1, '#5a2210', 0.24),
      sky2: mixHexColor(th.sky2, '#c45a28', 0.16),
      hill: mixHexColor(th.hill, '#4a2814', 0.26),
      hill2: mixHexColor(th.hill2, '#3a1c0e', 0.22),
      ground: mixHexColor(th.ground, '#4a2a16', 0.2),
      gtop: mixHexColor(th.gtop, '#6a3a1c', 0.16),
      deco: th.deco,
    };
  }
  if (theme === 'halloween') {
    return {
      sky1: mixHexColor(th.sky1, '#2a1038', 0.28),
      sky2: mixHexColor(th.sky2, '#c45a18', 0.16),
      hill: mixHexColor(th.hill, '#2a1420', 0.26),
      hill2: mixHexColor(th.hill2, '#1a0c14', 0.22),
      ground: mixHexColor(th.ground, '#2a1810', 0.2),
      gtop: mixHexColor(th.gtop, '#4a2a14', 0.16),
      deco: th.deco,
    };
  }
  if (theme === 'winter') {
    return {
      sky1: mixHexColor(th.sky1, '#1a3048', 0.22),
      sky2: mixHexColor(th.sky2, '#c8e0f0', 0.16),
      hill: mixHexColor(th.hill, '#3a4a58', 0.2),
      hill2: mixHexColor(th.hill2, '#2a3844', 0.18),
      ground: mixHexColor(th.ground, '#4a5860', 0.16),
      gtop: mixHexColor(th.gtop, '#6a7880', 0.14),
      deco: th.deco,
    };
  }
  if (theme === 'summer') {
    return {
      sky1: mixHexColor(th.sky1, '#3a4a18', 0.18),
      sky2: mixHexColor(th.sky2, '#e0c040', 0.14),
      hill: mixHexColor(th.hill, '#4a6a20', 0.16),
      hill2: mixHexColor(th.hill2, '#3a5418', 0.14),
      ground: mixHexColor(th.ground, '#5a6a28', 0.12),
      gtop: mixHexColor(th.gtop, '#7a8a30', 0.12),
      deco: th.deco,
    };
  }
  return th;
}

function drawAudioThemeScenery(c, time, ground, scroll) {
  const theme = getEffectiveAudioTheme();
  if (theme === 'classic' || !c) return;
  const Wloc = (typeof W !== 'undefined' && W) || 480;
  const Hloc = (typeof H !== 'undefined' && H) || 720;
  const gnd = ground || Hloc * 0.72;
  const sc = scroll || 0;
  const wrap = (x, span) => ((x % span) + span) % span;
  const lite = (typeof save !== 'undefined' && save && save.liteFx)
    || (typeof fxLite === 'function' && fxLite())
    || (typeof Perf !== 'undefined' && Perf.tier >= 2);
  c.save();
  if (theme === 'jungle') {
    const wash = c.createLinearGradient(0, 0, 0, gnd);
    wash.addColorStop(0, 'rgba(16,58,28,0.16)');
    wash.addColorStop(0.5, 'rgba(20,70,32,0.07)');
    wash.addColorStop(1, 'rgba(24,48,20,0.14)');
    c.fillStyle = wash;
    c.fillRect(0, 0, Wloc, Hloc);
    if (!lite) {
      const span = Wloc + 200;
      for (let i = 0; i < 5; i++) {
        const x = wrap(i * 0.22 * span - sc * 0.45, span) - 80;
        c.strokeStyle = 'rgba(18,52,24,0.55)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x, 0);
        c.quadraticCurveTo(x + 8, gnd * 0.35, x - 6, gnd * 0.62);
        c.stroke();
        c.fillStyle = 'rgba(28,90,40,0.28)';
        c.beginPath();
        c.ellipse(x + 10, 18 + (i % 3) * 16, 16, 8, -0.4, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else if (theme === 'fire-bamboo-boesa') {
    const wash = c.createLinearGradient(0, 0, 0, gnd);
    wash.addColorStop(0, 'rgba(72,22,8,0.15)');
    wash.addColorStop(0.45, 'rgba(120,40,12,0.07)');
    wash.addColorStop(1, 'rgba(56,16,6,0.18)');
    c.fillStyle = wash;
    c.fillRect(0, 0, Wloc, Hloc);
    if (!lite) {
      const span = Wloc + 180;
      for (let i = 0; i < 6; i++) {
        const x = wrap((i * 0.17 + 0.04) * span - sc * 0.55, span) - 70;
        const h = 70 + (i % 3) * 18;
        c.fillStyle = i % 2 ? 'rgba(42,28,12,0.55)' : 'rgba(58,36,14,0.5)';
        c.fillRect(Math.round(x), gnd - h, 5, h);
        c.fillStyle = 'rgba(90,56,20,0.35)';
        c.fillRect(Math.round(x) + 1, gnd - h, 2, h);
        c.strokeStyle = 'rgba(30,18,8,0.35)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x - 2, gnd - h * 0.55);
        c.lineTo(x + 8, gnd - h * 0.62);
        c.stroke();
      }
      if (!(typeof motionReduced === 'function' && motionReduced())) {
        for (let i = 0; i < 10; i++) {
          const x = wrap(((i * 0.09 + time * 0.06) % 1) * (Wloc + 40), Wloc + 40) - 20;
          const y = gnd - 10 - ((time * (22 + (i % 4) * 7) + i * 29) % (gnd * 0.7));
          c.fillStyle = i % 2 ? 'rgba(255,140,40,0.45)' : 'rgba(255,200,90,0.35)';
          c.fillRect(x, y, 2, 2);
        }
      }
    }
  } else if (theme === 'halloween') {
    const wash = c.createLinearGradient(0, 0, 0, gnd);
    wash.addColorStop(0, 'rgba(28,10,40,0.20)');
    wash.addColorStop(0.5, 'rgba(80,24,12,0.08)');
    wash.addColorStop(1, 'rgba(20,8,16,0.16)');
    c.fillStyle = wash;
    c.fillRect(0, 0, Wloc, Hloc);
    if (!lite) {
      c.fillStyle = 'rgba(255,210,140,0.22)';
      c.beginPath();
      c.arc(Wloc * 0.82, gnd * 0.16, 22, 0, Math.PI * 2);
      c.fill();
    }
  } else if (theme === 'winter') {
    const wash = c.createLinearGradient(0, 0, 0, gnd);
    wash.addColorStop(0, 'rgba(180,210,230,0.10)');
    wash.addColorStop(1, 'rgba(40,56,72,0.12)');
    c.fillStyle = wash;
    c.fillRect(0, 0, Wloc, Hloc);
  } else if (theme === 'summer') {
    const wash = c.createLinearGradient(0, 0, 0, gnd);
    wash.addColorStop(0, 'rgba(230,190,50,0.10)');
    wash.addColorStop(1, 'rgba(40,48,16,0.08)');
    c.fillStyle = wash;
    c.fillRect(0, 0, Wloc, Hloc);
  }
  c.restore();
}

function drawAudioThemeMenuWash(c) {
  const theme = getEffectiveAudioTheme();
  if (theme === 'classic' || !c) return;
  const Wloc = (typeof W !== 'undefined' && W) || 480;
  const Hloc = (typeof H !== 'undefined' && H) || 720;
  c.save();
  if (theme === 'jungle') {
    const g = c.createLinearGradient(0, 0, 0, Hloc);
    g.addColorStop(0, 'rgba(18,70,32,0.20)');
    g.addColorStop(1, 'rgba(10,36,18,0.10)');
    c.fillStyle = g;
  } else if (theme === 'halloween') {
    const g = c.createLinearGradient(0, 0, 0, Hloc);
    g.addColorStop(0, 'rgba(40,12,48,0.22)');
    g.addColorStop(1, 'rgba(20,8,16,0.12)');
    c.fillStyle = g;
  } else if (theme === 'winter') {
    const g = c.createLinearGradient(0, 0, 0, Hloc);
    g.addColorStop(0, 'rgba(20,36,56,0.18)');
    g.addColorStop(1, 'rgba(12,20,32,0.10)');
    c.fillStyle = g;
  } else if (theme === 'summer') {
    const g = c.createLinearGradient(0, 0, 0, Hloc);
    g.addColorStop(0, 'rgba(56,48,16,0.16)');
    g.addColorStop(1, 'rgba(28,32,12,0.08)');
    c.fillStyle = g;
  } else {
    const g = c.createLinearGradient(0, 0, 0, Hloc);
    g.addColorStop(0, 'rgba(90,28,10,0.18)');
    g.addColorStop(1, 'rgba(40,12,6,0.10)');
    c.fillStyle = g;
  }
  c.fillRect(0, 0, Wloc, Hloc);
  c.restore();
}

function audioThemeLabel(id) {
  const meta = AUDIO_THEME_META[id];
  return (typeof tOr === 'function')
    ? tOr('audio.theme.' + id + '.label', (meta && meta.label) || id)
    : ((meta && meta.label) || id);
}

function audioThemeSub(id) {
  const meta = AUDIO_THEME_META[id];
  return (typeof tOr === 'function')
    ? tOr('audio.theme.' + id + '.sub', (meta && meta.sub) || '')
    : ((meta && meta.sub) || '');
}

function onAudioThemeBarPress(e) {
  const t = e && (e.target || e.srcElement);
  const btn = t && t.closest ? t.closest('[data-audio-theme]') : null;
  if (!btn) return;
  const id = btn.getAttribute('data-audio-theme');
  if (!id || id === getAudioTheme()) return;
  const apply = () => {
    setAudioTheme(id);
    try {
      if (typeof UI !== 'undefined' && UI.toast) {
        UI.toast((typeof t === 'function' ? t('settings.audioThemeLine', { name: audioThemeLabel(id) }) : ('Theme: ' + audioThemeLabel(id))), 1600, { tone: 'ok' });
      }
    } catch (_) {}
  };
  if (typeof safeUiAction === 'function') safeUiAction(apply, 'audioTheme/' + id, 'Theme switch failed');
  else apply();
}

function renderAudioThemeBar(bar) {
  if (!bar) return;
  const cur = getAudioTheme();
  const existing = bar.querySelectorAll('[data-audio-theme]');
  const same = existing.length === AUDIO_THEME_IDS.length
    && AUDIO_THEME_IDS.every((id, i) => existing[i] && existing[i].getAttribute('data-audio-theme') === id);
  if (!same) {
    bar.innerHTML = AUDIO_THEME_IDS.map((id) => {
      const active = id === cur ? ' active' : '';
      return `<button type="button" class="dex-filter-btn${active}" data-audio-theme="${id}">${audioThemeLabel(id)}</button>`;
    }).join('');
  } else {
    existing.forEach((btn) => {
      const id = btn.getAttribute('data-audio-theme');
      btn.classList.toggle('active', id === cur);
      if (id) btn.textContent = audioThemeLabel(id);
    });
  }
  if (!bar.dataset.audioThemeBound) {
    bar.dataset.audioThemeBound = '1';
    if (typeof bindPress === 'function') bindPress(bar, onAudioThemeBarPress);
    else bar.addEventListener('click', onAudioThemeBarPress);
  }
}

function renderAudioThemeSwitch() {
  renderAudioThemeBar(document.getElementById('audioThemeBar'));
  renderAudioThemeBar(document.getElementById('pauseAudioThemeBar'));
  applyAudioThemeDom();
}
