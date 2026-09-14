/* ======================== AUDIO THEME PACKS ============================
   Classic = current procedural pack (unchanged).
   Jungle / fire-bamboo-boesa = same song IDs, remixed feel + light scenery.
   Preference: save.audioTheme (localStorage via persist). */
const AUDIO_THEME_IDS = ['classic', 'jungle', 'fire-bamboo-boesa'];
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
};

function normalizeAudioTheme(id) {
  return AUDIO_THEME_IDS.includes(id) ? id : 'classic';
}

function getAudioTheme() {
  try {
    return normalizeAudioTheme(typeof save !== 'undefined' && save ? save.audioTheme : 'classic');
  } catch (_) {
    return 'classic';
  }
}

function audioThemeProfile() {
  return AUDIO_THEME_PROFILES[getAudioTheme()] || AUDIO_THEME_PROFILES.classic;
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
    document.body.setAttribute('data-audio-theme', getAudioTheme());
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

function resolveThemedSong(name) {
  const base = (typeof SONGS !== 'undefined' && SONGS[name]) || null;
  if (!base) return null;
  const theme = getAudioTheme();
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
    if (!song.snare.includes(10)) song.snare = uniqueSortedInts(song.snare.concat([10]));
  }
  return song;
}

function setAudioTheme(id) {
  const next = normalizeAudioTheme(id);
  const prev = getAudioTheme();
  if (typeof save !== 'undefined' && save) {
    save.audioTheme = next;
    try { if (typeof persist === 'function') persist(); } catch (_) {}
  }
  applyAudioThemeDom();
  if (typeof AudioSys !== 'undefined' && AudioSys && next !== prev) {
    const cur = AudioSys.currentSongId ? AudioSys.currentSongId() : '';
    if (cur) {
      AudioSys.song = null;
      try { AudioSys.play(cur); } catch (_) {}
    }
    try { AudioSys.sfx('select'); } catch (_) {}
    try { playAudioThemePreview(); } catch (_) {}
  }
  try { if (typeof UI !== 'undefined' && UI.renderSettings) UI.renderSettings(); } catch (_) {}
  try { if (typeof UI !== 'undefined' && UI.renderPauseToggles) UI.renderPauseToggles(); } catch (_) {}
  return next;
}

function playAudioThemePreview() {
  if (typeof AudioSys === 'undefined' || !AudioSys || !AudioSys.ctx || !save || !save.sfx) return;
  const theme = getAudioTheme();
  const now = AudioSys.ctx.currentTime;
  if (theme === 'jungle') {
    AudioSys.tone(210, 90, 0.09, 'triangle', 0.12, null, now);
    AudioSys.noise(0.05, 0.08, 1800, false, null, now + 0.02);
    AudioSys.tone(880, 990, 0.12, 'sine', 0.06, null, now + 0.06);
  } else if (theme === 'fire-bamboo-boesa') {
    AudioSys.noise(0.08, 0.07, 900, false, null, now);
    AudioSys.tone(620, 310, 0.08, 'triangle', 0.1, null, now + 0.02);
    AudioSys.tone(784, 880, 0.16, 'sine', 0.07, null, now + 0.05);
  }
}

function scheduleAudioThemeStep(audio, i, bar, t, spb) {
  const theme = getAudioTheme();
  if (theme === 'classic' || !audio || !audio.musicGain) return;
  const lite = (typeof save !== 'undefined' && save && save.liteFx)
    || (typeof Perf !== 'undefined' && Perf.tier >= 1);
  const mg = audio.musicGain;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  if (theme === 'jungle') {
    if ([1, 5, 9, 13].includes(i)) audio.noise(0.024, 0.065, 3600, true, mg, t);
    if (i === 6 || i === 14) audio.tone(midi(74), midi(67), spb * 0.34, 'triangle', 0.042, mg, t);
    if (!lite && i === 0 && bar % 4 === 2) audio.tone(midi(84), midi(88), spb * 1.35, 'sine', 0.032, mg, t);
    if (!lite && i === 10 && bar % 8 === 5) audio.tone(midi(79), midi(76), spb * 0.75, 'sine', 0.028, mg, t);
    return;
  }
  if (theme === 'fire-bamboo-boesa') {
    if (i === 0 || i === 8) audio.noise(0.048, 0.04, 1300, false, mg, t);
    if (i === 3 || i === 11) audio.tone(midi(72), midi(60), spb * 0.26, 'triangle', 0.048, mg, t);
    if (!lite && i === 4 && bar % 2 === 0) audio.tone(midi(81), midi(81), spb * 2.1, 'sine', 0.038, mg, t);
    if (!lite && i === 12 && bar % 4 === 1) audio.tone(midi(76), midi(79), spb * 1.5, 'sine', 0.032, mg, t);
  }
}

function playAudioThemeSfxAccent(audio, name) {
  const theme = getAudioTheme();
  if (theme === 'classic' || !audio) return;
  const combat = name === 'punch' || name === 'kick' || name === 'hit' || name === 'hit2'
    || name === 'swing' || name === 'hitHeavy' || (name && name.charAt(0) === 'w');
  if (!combat) return;
  if (theme === 'jungle') {
    audio.noise(0.032, 0.06, 1500, false);
    audio.tone(600, 260, 0.038, 'triangle', 0.045);
    return;
  }
  if (theme === 'fire-bamboo-boesa') {
    audio.noise(0.042, 0.055, 820, false);
    audio.tone(860, 400, 0.046, 'sine', 0.038);
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
  const theme = getAudioTheme();
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
  return th;
}

function drawAudioThemeScenery(c, time, ground, scroll) {
  const theme = getAudioTheme();
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
  }
  c.restore();
}

function drawAudioThemeMenuWash(c) {
  const theme = getAudioTheme();
  if (theme === 'classic' || !c) return;
  const Wloc = (typeof W !== 'undefined' && W) || 480;
  const Hloc = (typeof H !== 'undefined' && H) || 720;
  c.save();
  if (theme === 'jungle') {
    const g = c.createLinearGradient(0, 0, 0, Hloc);
    g.addColorStop(0, 'rgba(18,70,32,0.20)');
    g.addColorStop(1, 'rgba(10,36,18,0.10)');
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

function renderAudioThemeBar(bar) {
  if (!bar) return;
  const cur = getAudioTheme();
  bar.innerHTML = AUDIO_THEME_IDS.map((id) => {
    const meta = AUDIO_THEME_META[id];
    const active = id === cur ? ' active' : '';
    return `<button type="button" class="dex-filter-btn${active}" data-audio-theme="${id}">${meta.label}</button>`;
  }).join('');
  bar.querySelectorAll('[data-audio-theme]').forEach((btn) => {
    const id = btn.getAttribute('data-audio-theme');
    if (!id) return;
    if (typeof bindPress === 'function') {
      bindPress(btn, () => {
        if (id === getAudioTheme()) return;
        if (typeof safeUiAction === 'function') {
          safeUiAction(() => {
            setAudioTheme(id);
            try {
              if (typeof UI !== 'undefined' && UI.toast) {
                const meta = AUDIO_THEME_META[id];
                UI.toast('Sfeer: ' + meta.label, 1800, { tone: 'ok' });
              }
            } catch (_) {}
          }, 'audioTheme/' + id, 'Theme switch failed');
        } else {
          setAudioTheme(id);
        }
      });
    } else {
      btn.addEventListener('click', () => setAudioTheme(id));
    }
  });
}

function renderAudioThemeSwitch() {
  renderAudioThemeBar(document.getElementById('audioThemeBar'));
  renderAudioThemeBar(document.getElementById('pauseAudioThemeBar'));
  applyAudioThemeDom();
}
