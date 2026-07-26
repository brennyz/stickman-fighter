/* =============================== AUDIO ================================= */
const AudioSys = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  desiredSong: null,
  song: null, step: 0, bar: 0, nextTime: 0,
  paused: false,
  _lastPauseMix: false,
  _sfxVar: 0,
  _sfxPan: 0,
  _combatHeat: 0,
  _samples: {},
  _sampleLoadStarted: false,
  _sampleCount: 0,
  _samplesReady: false,

  init() {
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        this.loadSamples();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.28;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.74;
      this.sfxGain.connect(this.master);
      if (!this._tickTimer) this._tickTimer = setInterval(() => {
        try { this.tick(); } catch (_) {}
      }, 40);
      this.loadSamples();
      if (this.desiredSong && save.music) this.play(this.desiredSong);
      this.applyVolumes();
    } catch (err) {
      console.warn('[Stickman] AudioSys.init', err);
      this.ctx = null;
    }
  },

  /** Fetch Kenney CC0 samples (jsDelivr) — batched; procedural fallback until ready.
   *  Priority SFX (hits/UI) load first via collectSampleUrls order. */
  loadSamples() {
    if (!this.ctx || this._sampleLoadStarted || typeof collectSampleUrls !== 'function') return;
    this._sampleLoadStarted = true;
    const urls = collectSampleUrls();
    if (!urls.length) return;
    let idx = 0;
    const batch = 10;
    const loadOne = async (url) => {
      try {
        const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
        if (!res.ok) return;
        const ab = await res.arrayBuffer();
        const buf = await this.ctx.decodeAudioData(ab);
        this._samples[url] = buf;
        this._sampleCount++;
        if (this._sampleCount >= 8) this._samplesReady = true;
      } catch (_) {}
    };
    const pump = () => {
      if (!this.ctx) return;
      const chunk = urls.slice(idx, idx + batch);
      idx += batch;
      Promise.all(chunk.map(u => loadOne(u))).then(() => {
        if (idx < urls.length) setTimeout(pump, 12);
        else if (this._sampleCount > 0) this._samplesReady = true;
      });
    };
    pump();
  },

  _playSample(name) {
    if (!this.ctx || !save.sfx) return false;
    const cfg = typeof sampleMapForSfx === 'function' ? sampleMapForSfx(name) : null;
    if (!cfg) return false;
    const loaded = (cfg.files || []).map(f => sampleUrl(cfg.pack, f)).filter(u => u && this._samples[u]);
    if (!loaded.length) return false;
    const url = loaded[Math.floor(Math.random() * loaded.length)];
    const buf = this._samples[url];
    if (!buf) return false;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const sv = clamp(Number(save.sfxVol) || 1, 0, 1);
    let vol = (cfg.vol != null ? cfg.vol : 0.75) * sv * (lite ? 0.78 : 1);
    if (vol <= 0.001) return false;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    /** Spammy combat/UI: tighter pitch; rare stingers: wider variety. */
    const spammy = name === 'select' || name === 'step' || name === 'punch' || name === 'kick'
      || name === 'swing' || name === 'hit' || name === 'hit2' || name === 'hitMetal'
      || name === 'jump' || name === 'land' || name === 'dash' || name === 'block'
      || name === 'shuriken' || (name && name.charAt(0) === 'w');
    const rateJitter = spammy ? (0.95 + Math.random() * 0.1) : (0.88 + Math.random() * 0.24);
    const rate = (cfg.rate || 1) * rateJitter;
    src.playbackRate.value = rate;
    const dur = Math.min(buf.duration / rate, spammy ? 1.4 : 2.8);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g);
    g.connect(this._sfxDest());
    src.start(t);
    src.stop(t + dur + 0.02);
    return true;
  },

  _setGain(g, v, ramp) {
    if (!g) return;
    try {
      const t = this.ctx ? this.ctx.currentTime : 0;
      if (g.gain.cancelScheduledValues) g.gain.cancelScheduledValues(t);
      const tc = ramp != null ? ramp : 0.04;
      if (g.gain.setTargetAtTime) g.gain.setTargetAtTime(v, t, tc);
      else g.gain.value = v;
    } catch (_) {
      try { g.gain.value = v; } catch (_) {}
    }
  },

  applyVolumes() {
    if (!this.musicGain || !this.sfxGain) return;
    const mv = save.music ? clamp(Number(save.musicVol) || 0.85, 0, 1) : 0;
    const sv = save.sfx ? clamp(Number(save.sfxVol) || 1, 0, 1) : 0;
    const id = (this.song && this.song.id) || this.desiredSong;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const inPause = this.paused || state === 'pause';
    let baseM = (id === 'menu' || (id && String(id).startsWith('menu'))) ? 0.24 : 0.32;
    if (lite) baseM *= 0.88;
    if (inPause) baseM *= 0.26;
    else if (state === 'result') baseM *= 0.5;
    const sfxMul = (lite ? 0.68 : 0.74) * (inPause ? 1.1 : 1);
    const musicRamp = inPause !== this._lastPauseMix ? 0.14 : 0.05;
    const sfxRamp = 0.05;
    this._lastPauseMix = inPause;
    this._setGain(this.musicGain, baseM * mv, musicRamp);
    this._setGain(this.sfxGain, sfxMul * sv, sfxRamp);
    this.syncContextPower();
  },

  /** Suspend Web Audio when fully muted / tab hidden — saves battery on iPad/PWA */
  syncContextPower() {
    if (!this.ctx) return;
    const needAudio = !!(save.music || save.sfx);
    if (typeof document !== 'undefined' && document.hidden) {
      try { if (this.ctx.state === 'running') this.ctx.suspend(); } catch (_) {}
      return;
    }
    const inFight = state === 'play' || state === 'pause';
    const menuBgm = (state === 'menu' || state === 'result') && save.music && this.song;
    const keepAwake = needAudio && (inFight || menuBgm);
    try {
      if (!keepAwake && this.ctx.state === 'running') {
        this.ctx.suspend();
      } else if (keepAwake && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (_) {}
  },

  /** Soft music-channel blip when dragging volume sliders (pauze/instellingen). */
  previewMusicVol() {
    if (!this.ctx || !save.music) return;
    try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
    const mv = clamp(Number(save.musicVol) || 0.85, 0, 1);
    if (mv <= 0.001) return;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    let vol = 0.14 * mv * (lite ? 0.88 : 1);
    if (this.paused || state === 'pause') vol *= 0.26;
    this.tone(660, 880, 0.11, 'sine', vol, this.musicGain);
  },

  setPaused(on) {
    this.paused = !!on;
    const needAudio = !!(save.music || save.sfx);
    if (on) {
      try { this.init(); } catch (_) {}
      if (needAudio) {
        try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
      } else {
        try { this.syncContextPower(); } catch (_) {}
      }
    }
    this.applyVolumes();
    if (!on) {
      try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
      if (save.music && this.desiredSong) {
        if (!this.song || this.song.id !== this.desiredSong) this.play(this.desiredSong);
      }
    }
  },

  tone(f0, f1, dur, type, vol, out, when) {
    if (!this.ctx) return;
    const toMusic = out === this.musicGain;
    if (toMusic) {
      if (!save.music) return;
    } else {
      vol *= save.sfx ? clamp(Number(save.sfxVol) || 1, 0, 1) : 0;
    }
    if (vol <= 0.001) return;
    const t = (when != null ? when : this.ctx.currentTime);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(out || this._sfxDest());
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol, filterFreq, hp, out, when) {
    if (!this.ctx) return;
    const toMusic = out === this.musicGain;
    if (toMusic) {
      if (!save.music) return;
    } else {
      vol *= save.sfx ? clamp(Number(save.sfxVol) || 1, 0, 1) : 0;
    }
    if (vol <= 0.001) return;
    const t = (when != null ? when : this.ctx.currentTime);
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(out || this._sfxDest());
    src.start(t);
  },

  /** Route SFX to stereo field — screenX maps left/right on W */
  _sfxDest(out) {
    if (out) return out;
    const pan = this._sfxPan || 0;
    if (!this.ctx || Math.abs(pan) < 0.04) return this.sfxGain;
    try {
      if (!this.ctx.createStereoPanner) return this.sfxGain;
      const sp = this.ctx.createStereoPanner();
      sp.pan.value = pan;
      sp.connect(this.sfxGain);
      return sp;
    } catch (_) { return this.sfxGain; }
  },

  /** Pan SFX by world/screen X (0…W → left…right) */
  sfxAt(name, screenX) {
    if (!this.ctx || !save.sfx) return;
    if (typeof screenX === 'number' && typeof W !== 'undefined' && W > 0) {
      this._sfxPan = clamp((screenX / W) * 2 - 1, -1, 1) * 0.82;
    }
    this.sfx(name);
    this._sfxPan = 0;
  },

  /** 0…1 — ramps BGM lead intensity during hot combos */
  setCombatHeat(v) {
    this._combatHeat = clamp(Number(v) || 0, 0, 1);
  },

  /** Detuned twin layer — fuller body without samples */
  detuneTone(f0, f1, dur, type, vol, cents, out, when) {
    this.tone(f0, f1, dur, type, vol * 0.72, out, when);
    const r = Math.pow(2, (cents || 8) / 1200);
    this.tone(f0 * r, f1 * r, dur * 0.92, type, vol * 0.38, out, (when != null ? when : this.ctx.currentTime) + 0.004);
  },

  /** Micro pitch wobble so rapid SFX don't sound identical */
  _pitchVar() {
    this._sfxVar = (this._sfxVar + 1) % 97;
    return 0.94 + (this._sfxVar % 11) * 0.012 + Math.random() * 0.02;
  },

  /** 0…2 — rotate procedural combat hit bodies for variety */
  _sfxAlt() {
    this._sfxVar = (this._sfxVar + 1) % 97;
    return this._sfxVar % 3;
  },

  /** Short echo tail — arcade space without reverb node */
  echoTone(f0, f1, dur, type, vol, delay, decay, out, when) {
    this.tone(f0, f1, dur, type, vol, out, when);
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    if (lite) return;
    const t = (when != null ? when : this.ctx.currentTime) + (delay || 0.055);
    this.tone(f0 * 0.996, f1 * 0.996, dur * 0.82, type, vol * (decay || 0.4), out, t);
  },

  sfx(name) {
    if (!this.ctx || !save.sfx) return;
    try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
    if (this._playSample(name)) return;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const v = (n) => n * (lite ? 0.72 : 0.88);
    const d = (n) => n * (lite ? 0.78 : 0.9);
    const P = () => this._pitchVar();
    const T = (f0, f1, dur, ty, vol, w) => { const p = P(); this.tone(f0 * p, f1 * p, d(dur), ty, v(vol), null, w); };
    const D = (f0, f1, dur, ty, vol, w, c) => this.detuneTone(f0 * P(), f1 * P(), d(dur), ty, v(vol), c, null, w);
    const E = (f0, f1, dur, ty, vol, w, dl, dc) => this.echoTone(f0 * P(), f1 * P(), d(dur), ty, v(vol), dl, dc, null, w);
    const N = (dur, vol, ff, hp, w) => this.noise(d(dur), v(vol), ff, hp, null, w);
    const I = (thump, crack, w) => {
      T(thump, thump * 0.52, 0.08, 'sine', 0.22, w);
      N(0.04, 0.16, crack, true, w);
      if (!lite) T(crack * 0.32, crack * 0.18, 0.045, 'triangle', 0.09, w + 0.012);
    };
    const C = (freqs, ty, vol, gap, w) => {
      freqs.forEach((f, i) => T(f, f * 1.015, 0.1, ty, vol * (1 - i * 0.05), w + i * gap));
    };
    const S = (freqs, w) => {
      if (lite) { T(freqs[0], freqs[0] * 1.06, 0.05, 'sine', 0.08, w); return; }
      freqs.forEach((f, i) => T(f, f * 1.1, 0.045, 'sine', 0.075, w + i * 0.02));
    };
    const now = this.ctx.currentTime;
    const A = () => this._sfxAlt();
    const skillSynthH = { T, D, E, N, S, I, C, now, lite, v, d, P };
    if (typeof playSuperSynthFallback === 'function' && playSuperSynthFallback(name, skillSynthH)) return;
    if (typeof playSkillSynthFallback === 'function' && playSkillSynthFallback(name, skillSynthH)) return;
    switch (name) {
      case 'swing': {
        const a = A();
        N(0.055, 0.24, 3200 + a * 500, true, now);
        T(440 + a * 70, 150 + a * 25, 0.075, a === 1 ? 'triangle' : 'sine', 0.12, now);
        if (!lite) {
          N(0.028, 0.09, 6400 + a * 280, true, now + 0.012);
          T(880 + a * 40, 420, 0.035, 'sine', 0.06, now + 0.03);
        }
        break;
      }
      case 'punch': {
        const a = A();
        I(200 + a * 50, 2600 + a * 500, now);
        T(460 + a * 70, 780 + a * 100, 0.045, a === 2 ? 'sine' : 'triangle', 0.11, now + 0.015);
        if (!lite) {
          N(0.028, 0.1, 4200 + a * 400, true, now + 0.02);
          if (a) T(160 + a * 20, 70, 0.04, 'sine', 0.08, now + 0.035);
        }
        break;
      }
      case 'kick': {
        const a = A();
        I(250 + a * 40, 2200 + a * 400, now);
        T(380 + a * 50, 120 + a * 25, 0.08, 'triangle', 0.13, now + 0.018);
        if (!lite) {
          T(170 + a * 15, 55, 0.055, 'sine', 0.1, now + 0.035);
          N(0.04, 0.1, 1800 + a * 200, false, now + 0.03);
        }
        break;
      }
      case 'wKunai':
        N(0.035, 0.15, 5400, true, now);
        T(1020, 380, 0.075, 'triangle', 0.13, now);
        if (!lite) T(1480, 620, 0.04, 'sine', 0.07, now + 0.025);
        break;
      case 'wZwaard':
        N(0.06, 0.22, 4000, true, now);
        D(680, 260, 0.1, 'sawtooth', 0.11, now, 11);
        E(920, 420, 0.06, 'sine', 0.09, now + 0.02, 0.04, 0.35);
        break;
      case 'wKnuppel':
        I(120, 800, now);
        T(160, 48, 0.11, 'sine', 0.18, now);
        if (!lite) N(0.05, 0.12, 1400, false, now + 0.04);
        break;
      case 'wSpeer':
        N(0.045, 0.16, 4200, true, now);
        T(580, 180, 0.11, 'triangle', 0.13, now);
        if (!lite) T(880, 320, 0.05, 'sine', 0.08, now + 0.04);
        break;
      case 'wNunchaku':
        N(0.03, 0.13, 5200, true, now);
        T(820, 540, 0.05, 'sine', 0.11, now);
        T(540, 820, 0.05, 'sine', 0.1, now + 0.038);
        if (!lite) T(660, 440, 0.04, 'triangle', 0.08, now + 0.07);
        break;
      case 'wBoemerang':
        T(680, 980, 0.09, 'triangle', 0.12, now);
        T(980, 420, 0.11, 'sine', 0.11, now + 0.05);
        N(0.045, 0.11, 3800, true, now);
        if (!lite) E(620, 920, 0.07, 'sine', 0.08, now + 0.08, 0.05, 0.38);
        break;
      case 'wFan':
        N(0.025, 0.1, 4800, true, now);
        T(760, 1120, 0.07, 'sine', 0.1, now);
        T(520, 880, 0.05, 'triangle', 0.08, now + 0.04);
        if (!lite) T(980, 620, 0.04, 'sine', 0.06, now + 0.07);
        break;
      case 'wFuuma':
        N(0.04, 0.14, 4600, true, now);
        T(880, 520, 0.08, 'triangle', 0.12, now);
        T(620, 380, 0.06, 'sine', 0.09, now + 0.035);
        if (!lite) N(0.03, 0.08, 6200, true, now + 0.05);
        break;
      case 'wHamer':
        I(80, 550, now);
        T(95, 38, 0.15, 'sine', 0.26, now);
        T(190, 75, 0.07, 'square', 0.11, now + 0.05);
        if (!lite) N(0.08, 0.14, 900, false, now + 0.03);
        break;
      case 'wKetting':
        N(0.065, 0.19, 2400, true, now);
        T(300, 150, 0.085, 'sawtooth', 0.13, now);
        T(520, 220, 0.055, 'triangle', 0.09, now + 0.035);
        if (!lite) T(780, 360, 0.04, 'sine', 0.07, now + 0.06);
        break;
      case 'wLaser':
        T(1280, 420, 0.11, 'sawtooth', 0.15, now);
        T(1680, 880, 0.07, 'sine', 0.11, now);
        N(0.045, 0.11, 6200, true, now);
        if (!lite) E(980, 520, 0.08, 'triangle', 0.09, now + 0.03, 0.045, 0.42);
        break;
      case 'wDonder':
        T(160, 55, 0.14, 'sawtooth', 0.22, now);
        N(0.12, 0.24, 1600, true, now);
        T(1040, 380, 0.09, 'sine', 0.13, now + 0.05);
        if (!lite) T(55, 28, 0.2, 'sine', 0.12, now + 0.08);
        break;
      case 'wVoid':
        T(200, 75, 0.13, 'sine', 0.15, now);
        D(680, 200, 0.11, 'triangle', 0.12, now + 0.04, 9);
        N(0.09, 0.15, 1300, true, now);
        break;
      case 'wGuvve':
        I(220, 1800, now);
        T(320, 180, 0.09, 'square', 0.15, now + 0.02);
        if (!lite) T(480, 260, 0.07, 'triangle', 0.11, now + 0.06);
        break;
      case 'hit': {
        const a = A();
        I(150 + a * 35, 1100 + a * 350, now);
        T(780 + a * 90, 340 + a * 50, 0.055, a ? 'sine' : 'triangle', 0.11, now + 0.012);
        if (!lite) N(0.03, 0.1, 3600 + a * 400, true, now + 0.02);
        break;
      }
      case 'hit2': {
        const a = A();
        I(115 + a * 25, 800 + a * 140, now);
        T(135 + a * 25, 48 + a * 12, 0.095, 'square', 0.25, now);
        N(0.075, 0.27, 580 + a * 90, false, now);
        T(290 + a * 35, 120 + a * 25, 0.065, 'triangle', 0.13, now + 0.022);
        if (!lite) S(a ? [740, 880] : [660, 820], now + 0.04);
        break;
      }
      case 'hitMetal': {
        const a = A();
        I(480 + a * 50, 3400 + a * 350, now);
        E(940 + a * 50, 420 + a * 40, 0.07, 'triangle', 0.14, now + 0.008, 0.032, 0.48);
        T(220 + a * 25, 85 + a * 12, 0.075, 'sine', 0.12, now);
        if (!lite) T(1320 + a * 60, 880, 0.04, 'sine', 0.07, now + 0.04);
        break;
      }
      case 'hitHeavy': {
        const a = A();
        I(95 + a * 25, 560 + a * 100, now);
        T(115 + a * 18, 38 + a * 8, 0.14, 'sine', 0.26, now);
        if (!lite) {
          N(0.11, 0.24, 500 + a * 70, false, now + 0.035);
          T(220 + a * 20, 90, 0.06, 'triangle', 0.1, now + 0.05);
        }
        break;
      }
      case 'hitEnergy': {
        const a = A();
        T(720 + a * 50, 240 + a * 35, 0.1, 'sine', 0.16, now);
        D(1080 + a * 50, 480 + a * 35, 0.075, 'triangle', 0.12, now, 11);
        N(0.055, 0.14, 4000 + a * 350, true, now);
        if (!lite) {
          S(a ? [932, 1109, 1245] : [880, 1047, 1175], now + 0.035);
          E(980, 520, 0.06, 'sine', 0.08, now + 0.05, 0.04, 0.4);
        }
        break;
      }
      case 'jump': {
        const a = A();
        T(200 + a * 30, 600 + a * 40, 0.12, 'sine', 0.17, now);
        T(600 + a * 40, 900 + a * 50, 0.075, 'triangle', 0.11, now + 0.035);
        if (!lite) N(0.028, 0.08, 5000 + a * 400, true, now);
        break;
      }
      case 'land': {
        const a = A();
        I(90 + a * 15, 450 + a * 80, now);
        if (!lite) {
          T(170 + a * 20, 65, 0.055, 'sine', 0.09, now + 0.018);
          N(0.03, 0.08, 1200 + a * 200, false, now + 0.01);
        }
        break;
      }
      case 'hurt':
        T(380, 120, 0.12, 'triangle', 0.18, now);
        T(220, 90, 0.08, 'sawtooth', 0.12, now + 0.03);
        break;
      case 'die':
        T(420, 55, 0.34, 'sawtooth', 0.24, now);
        N(0.2, 0.24, 750, false, now);
        if (!lite) C([330, 262, 196], 'triangle', 0.12, 0.09, now + 0.12);
        break;
      case 'shoot':
        T(920, 240, 0.11, 'square', 0.15, now);
        N(0.035, 0.1, 5400, true, now);
        break;
      case 'laser':
        T(1500, 360, 0.13, 'sawtooth', 0.15, now);
        T(1800, 900, 0.07, 'sine', 0.1, now);
        N(0.045, 0.11, 6800, true, now + 0.02);
        break;
      case 'explode':
        N(0.3, 0.4, 650, false, now);
        T(110, 35, 0.24, 'sine', 0.34, now);
        if (!lite) {
          T(80, 28, 0.32, 'sawtooth', 0.18, now + 0.04);
          S([880, 1100, 1320], now + 0.08);
        }
        break;
      case 'brick':
        N(0.11, 0.32, 1500, false, now);
        T(540, 200, 0.08, 'triangle', 0.16, now);
        T(880, 440, 0.05, 'sine', 0.1, now + 0.03);
        break;
      case 'crack':
        N(0.06, 0.2, 2100, false, now);
        T(720, 280, 0.05, 'triangle', 0.1, now);
        break;
      case 'select': {
        const a = A();
        T(640 + a * 40, 860 + a * 50, 0.048, 'sine', 0.11, now);
        T(860 + a * 40, 1040 + a * 40, 0.055, 'triangle', 0.1, now + 0.022);
        if (!lite && a === 1) S([1175], now + 0.05);
        break;
      }
      case 'combo': {
        const a = A();
        T(500 + a * 40, 860 + a * 40, 0.07, 'triangle', 0.15, now);
        T(860 + a * 40, 1060 + a * 40, 0.08, 'sine', 0.13, now + 0.028);
        if (!lite) S(a ? [1109, 1245, 1397] : [1040, 1175, 1319], now + 0.05);
        break;
      }
      case 'dash': {
        const a = A();
        N(0.065, 0.17, 3400 + a * 400, true, now);
        T(400 + a * 40, 840 + a * 60, 0.085, 'sine', 0.12, now);
        if (!lite) T(1000 + a * 40, 620, 0.055, 'triangle', 0.09, now + 0.035);
        break;
      }
      case 'block': {
        const a = A();
        T(960 + a * 40, 740 + a * 30, 0.075, 'sine', 0.15, now);
        N(0.05, 0.16, 4800 + a * 400, true, now);
        T(600 + a * 40, 840 + a * 40, 0.055, 'triangle', 0.11, now + 0.022);
        if (!lite) E(880, 660, 0.05, 'sine', 0.07, now + 0.04, 0.035, 0.4);
        break;
      }
      case 'crit':
        I(520, 4200, now);
        D(1040, 1560, 0.07, 'triangle', 0.16, now + 0.02, 12);
        S([1560, 1870, 2093], now + 0.05);
        break;
      case 'special':
        T(320, 1040, 0.2, 'sine', 0.13, now);
        D(580, 1220, 0.16, 'triangle', 0.11, now + 0.04, 10);
        N(0.12, 0.1, 3600, true, now);
        if (!lite) S([880, 1047, 1175], now + 0.1);
        break;
      case 'subst':
        N(0.1, 0.24, 1300, true, now);
        T(520, 120, 0.09, 'sine', 0.14, now);
        if (!lite) {
          T(920, 480, 0.06, 'triangle', 0.1, now + 0.04);
          N(0.05, 0.1, 7000, true, now + 0.02);
        }
        break;
      case 'shuriken':
        T(980, 460, 0.075, 'triangle', 0.14, now);
        N(0.038, 0.12, 4900, true, now);
        if (!lite) T(1420, 680, 0.045, 'sine', 0.08, now + 0.022);
        break;
      case 'roar':
        T(95, 48, 0.42, 'sawtooth', 0.27, now);
        N(0.32, 0.26, 360, false, now);
        if (!lite) {
          T(52, 28, 0.36, 'sine', 0.17, now + 0.06);
          N(0.16, 0.15, 1100, true, now + 0.14);
        }
        break;
      case 'pickup':
        C([784, 988, 1175], 'sine', 0.15, 0.042, now);
        if (!lite) {
          S([1319, 1568], now + 0.11);
          T(1175, 1568, 0.06, 'triangle', 0.08, now + 0.16);
        }
        break;
      case 'bell':
        D(1319, 1240, 0.5, 'triangle', 0.22, now, 6);
        T(988, 988, 0.35, 'sine', 0.08, now + 0.05);
        break;
      case 'bonus':
        C([880, 1109, 1320], 'square', 0.16, 0.06, now);
        if (!lite) {
          S([1568, 1760], now + 0.13);
          E(1320, 1760, 0.08, 'sine', 0.09, now + 0.1, 0.05, 0.4);
        }
        break;
      case 'levelup':
        C([523, 659, 784, 1047], 'triangle', 0.16, 0.065, now);
        if (!lite) {
          T(1047, 1319, 0.12, 'sine', 0.12, now + 0.22);
          S([1568, 1760, 2093], now + 0.28);
        }
        break;
      case 'newmonster':
        C([392, 523, 659, 784], 'sine', 0.15, 0.055, now);
        if (!lite) T(110, 70, 0.12, 'sawtooth', 0.1, now + 0.02);
        break;
      case 'win':
        C([523, 659, 784, 1047, 1319], 'triangle', 0.15, 0.08, now);
        if (!lite) {
          C([1568, 1760, 2093], 'sine', 0.1, 0.07, now + 0.38);
          N(0.08, 0.12, 1800, true, now + 0.5);
        }
        break;
      case 'lose':
        [392, 330, 262, 196, 147].forEach((f, i) => T(f, f * 0.96, 0.2, 'triangle', 0.13, now + i * 0.11));
        if (!lite) N(0.12, 0.14, 600, false, now + 0.35);
        break;
      case 'ketsbamCharge':
        T(52, 185, 1.92, 'sawtooth', 0.22, now);
        T(88, 240, 1.95, 'sine', 0.17, now);
        N(1.95, 0.15, 720, false, now);
        if (!lite) {
          N(1.9, 0.11, 2200, true, now + 0.08);
          T(165, 440, 1.65, 'triangle', 0.13, now + 0.18);
          for (let i = 0; i < 8; i++) {
            N(0.045, 0.075, 2800 + i * 380, true, now + 0.12 + i * 0.22);
            T(380 + i * 70, 180 + i * 35, 0.055, 'square', 0.065, now + 0.16 + i * 0.22);
          }
          C([247, 330, 440, 587], 'sine', 0.085, 0.07, now + 1.35);
          N(0.2, 0.18, 1400, true, now + 1.55);
        }
        break;
      case 'ketsbam':
        N(0.36, 0.4, 400, false, now);
        T(52, 20, 0.44, 'sawtooth', 0.34, now);
        C([196, 247, 294, 392], 'square', 0.14, 0.042, now + 0.08);
        if (!lite) {
          S([523, 659, 784, 988], now + 0.18);
          N(0.16, 0.2, 850, true, now + 0.14);
        }
        break;
      case 'summon':
        C([659, 784, 988, 1175], 'sine', 0.15, 0.068, now);
        D(880, 1360, 0.22, 'triangle', 0.13, now + 0.1, 14);
        if (!lite) {
          S([1319, 1568, 1760, 2093], now + 0.24);
          N(0.08, 0.12, 3200, true, now + 0.12);
        }
        break;
      case 'gamble':
        N(0.05, 0.13, 2600, true, now);
        [920, 740, 560, 420].forEach((f, i) => T(f, f * 0.82, 0.055, 'square', 0.11, now + i * 0.038));
        break;
      case 'gambleWin':
        C([523, 659, 784, 988, 1175], 'triangle', 0.14, 0.058, now);
        if (!lite) {
          S([1568, 1760, 2093], now + 0.3);
          N(0.06, 0.1, 2400, true, now + 0.35);
        }
        break;
      case 'gambleBoss':
        T(85, 38, 0.3, 'sawtooth', 0.24, now);
        N(0.22, 0.26, 480, false, now);
        C([311, 370, 415, 494], 'square', 0.13, 0.075, now + 0.12);
        break;
      case 'comboEpic':
        C([880, 1047, 1175, 1319], 'square', 0.15, 0.048, now);
        I(360, 3400, now);
        if (!lite) S([1568, 1760, 2093], now + 0.1);
        break;
      case 'comboMega':
        C([988, 1175, 1319, 1568, 1760], 'triangle', 0.16, 0.052, now);
        N(0.14, 0.19, 1100, true, now + 0.05);
        if (!lite) {
          T(105, 38, 0.22, 'sine', 0.2, now + 0.22);
          S([2093, 2349, 2637], now + 0.28);
        }
        break;
      case 'whoosh':
        N(0.09, 0.15, 4300, true, now);
        T(260, 1280, 0.13, 'sine', 0.11, now);
        break;
      case 'skillSwoosh':
        N(0.11, 0.2, 5200, true, now);
        T(180, 1680, 0.16, 'sine', 0.14, now);
        E(920, 2200, 0.07, 'triangle', 0.1, now + 0.04, 0.05, 0.4);
        if (!lite) N(0.04, 0.1, 7800, true, now + 0.08);
        break;
      case 'skillSwooshEpic':
        N(0.14, 0.22, 4800, true, now);
        D(220, 2200, 0.18, 'sawtooth', 0.13, now, 16);
        E(680, 2640, 0.09, 'sine', 0.12, now + 0.05, 0.06, 0.45);
        if (!lite) {
          C([880, 1047, 1175], 'triangle', 0.1, 0.04, now + 0.1);
          S([1568, 1760], now + 0.14);
        }
        break;
      case 'megaDrop':
        C([784, 988, 1175, 1319, 1568], 'triangle', 0.17, 0.055, now);
        N(0.1, 0.18, 2400, true, now + 0.08);
        if (!lite) {
          S([1760, 2093, 2349, 2637], now + 0.22);
          E(1040, 520, 0.12, 'sine', 0.14, now + 0.15, 0.07, 0.5);
          T(105, 38, 0.18, 'sine', 0.16, now + 0.28);
        }
        break;
      case 'tideSurge':
        N(0.12, 0.14, 1800, true, now);
        T(280, 880, 0.2, 'sine', 0.12, now);
        T(880, 1320, 0.14, 'triangle', 0.1, now + 0.08);
        if (!lite) {
          T(520, 1040, 0.1, 'sine', 0.08, now + 0.16);
          E(660, 1180, 0.08, 'sine', 0.09, now + 0.1, 0.06, 0.38);
        }
        break;
      case 'bossTurn':
        T(55, 28, 0.28, 'sawtooth', 0.26, now);
        N(0.2, 0.24, 420, false, now);
        C([311, 370, 494, 622, 784], 'square', 0.14, 0.07, now + 0.1);
        if (!lite) {
          S([988, 1175, 1319, 1568, 1760], now + 0.25);
          T(880, 180, 0.32, 'sawtooth', 0.18, now + 0.35);
          N(0.14, 0.16, 900, true, now + 0.4);
        }
        break;
      case 'travel':
        N(0.06, 0.12, 3200, true, now);
        T(180, 520, 0.14, 'sine', 0.1, now);
        if (!lite) T(520, 880, 0.08, 'triangle', 0.08, now + 0.06);
        break;
      case 'step': {
        const a = A();
        N(0.022, 0.075, 850 + a * 120, false, now);
        T(110 + a * 20, 65 + a * 10, 0.038, 'sine', 0.09, now);
        if (!lite && a === 2) N(0.015, 0.04, 2200, true, now + 0.01);
        break;
      }
      case 'checkpoint':
        C([523, 659, 784], 'sine', 0.14, 0.055, now);
        E(988, 1175, 0.1, 'triangle', 0.11, now + 0.12, 0.06, 0.42);
        if (!lite) S([1175, 1319], now + 0.18);
        break;
      case 'bossArrive':
        T(70, 28, 0.32, 'sawtooth', 0.26, now);
        N(0.24, 0.28, 420, false, now);
        C([311, 370, 415, 494, 622], 'square', 0.13, 0.07, now + 0.1);
        if (!lite) {
          T(880, 220, 0.28, 'sawtooth', 0.16, now + 0.38);
          N(0.12, 0.16, 1100, true, now + 0.45);
        }
        break;
      case 'bossWait':
        T(110, 55, 0.22, 'sawtooth', 0.14, now);
        N(0.12, 0.14, 600, false, now);
        if (!lite) T(220, 110, 0.12, 'sine', 0.1, now + 0.08);
        break;
      case 'masterSword':
        C([784, 988, 1175, 1568], 'sine', 0.15, 0.065, now);
        D(880, 1760, 0.24, 'triangle', 0.14, now + 0.08, 12);
        if (!lite) {
          S([2093, 2349, 2637], now + 0.22);
          N(0.08, 0.12, 4200, true, now + 0.1);
        }
        break;
      case 'wMaster':
        N(0.05, 0.18, 4600, true, now);
        D(720, 1320, 0.11, 'sawtooth', 0.13, now, 14);
        E(1040, 520, 0.08, 'sine', 0.12, now + 0.03, 0.045, 0.45);
        if (!lite) S([1568, 1760], now + 0.06);
        break;
      case 'waveClear':
        C([659, 784, 988], 'triangle', 0.13, 0.05, now);
        T(880, 1040, 0.08, 'sine', 0.11, now + 0.12);
        if (!lite) S([1175, 1319], now + 0.15);
        break;
      case 'hitstop':
        I(420, 4800, now);
        T(980, 420, 0.035, 'square', 0.12, now + 0.008);
        break;
      case 'diceRoll':
        [680, 820, 540, 760, 620, 880].forEach((f, i) => {
          T(f, f * (0.85 + Math.random() * 0.1), 0.045, 'square', 0.09, now + i * 0.032);
        });
        N(0.04, 0.1, 3400, true, now);
        break;
    }
  },

  /** Korte arcade-stingers — procedureel, rechtenvrij (geen samples) */
  sting(name, kind) {
    if (!this.ctx || !save.sfx) return;
    try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const v = (n) => n * (lite ? 0.72 : 0.88);
    const d = (n) => n * (lite ? 0.78 : 0.9);
    const now = this.ctx.currentTime;
    const T = (f0, f1, dur, ty, vol, w) => this.tone(f0, f1, d(dur), ty, v(vol), null, w);
    const N = (dur, vol, ff, hp, w) => this.noise(d(dur), v(vol), ff, hp, null, w);
    const E = (f0, f1, dur, ty, vol, w, dl, dc) => this.echoTone(f0, f1, d(dur), ty, v(vol), dl, dc, null, w);
    const S = (freqs, w) => {
      if (lite) { T(freqs[0], freqs[0] * 1.06, 0.05, 'sine', 0.08, w); return; }
      freqs.forEach((f, i) => T(f, f * 1.1, 0.045, 'sine', 0.075, w + i * 0.02));
    };
    switch (name) {
      case 'title':
        [392, 523, 659, 784, 988, 1175].forEach((f, i) => T(f, f, 0.085, 'triangle', 0.13, now + i * 0.045));
        T(120, 55, 0.2, 'sine', 0.22, now + 0.04);
        N(0.07, 0.17, 1400, false, now + 0.28);
        if (!lite) S([1319, 1568], now + 0.22);
        break;
      case 'modeAdventure':
        [440, 554, 659, 784, 880].forEach((f, i) => E(f, f, 0.075, 'sine', 0.11, now + i * 0.042, 0.05, 0.35));
        if (!lite) T(220, 880, 0.12, 'triangle', 0.08, now + 0.18);
        break;
      case 'modeTraining':
        T(220, 920, 0.15, 'sine', 0.12, now);
        N(0.14, 0.15, 5000, true, now + 0.03);
        T(660, 920, 0.075, 'triangle', 0.11, now + 0.14);
        if (!lite) S([988, 1175], now + 0.22);
        break;
      case 'modeVersus':
        T(140, 920, 0.075, 'square', 0.18, now);
        T(920, 140, 0.075, 'square', 0.17, now + 0.085);
        N(0.06, 0.22, 950, false, now + 0.04);
        if (!lite) I(480, 2800, now + 0.12);
        break;
      case 'modeWall':
        [196, 247, 330, 392, 440].forEach((f, i) => T(f, f * 0.96, 0.095, 'triangle', 0.14, now + i * 0.038));
        if (!lite) N(0.05, 0.12, 5200, true, now + 0.18);
        break;
      case 'modeMats':
        [523, 659, 784, 988].forEach((f, i) => T(f, f * 1.02, 0.075, 'sine', 0.12, now + i * 0.048));
        T(392, 523, 0.11, 'triangle', 0.11, now + 0.18);
        if (!lite) S([1175, 1319], now + 0.24);
        break;
      case 'superReady':
        if (typeof playSkillSuperReadySynth === 'function' &&
            playSkillSuperReadySynth(kind, { T, N, now, lite })) break;
        T(720, 1180, 0.1, 'sine', 0.14, now);
        T(980, 1320, 0.09, 'triangle', 0.12, now + 0.05);
        T(1320, 880, 0.07, 'sine', 0.08, now + 0.1);
        break;
      case 'eliteIntro':
        T(95, 50, 0.24, 'sawtooth', 0.23, now);
        N(0.2, 0.24, 480, false, now);
        [392, 466, 523, 622, 740].forEach((f, i) => E(f, f * 1.02, 0.095, 'square', 0.12, now + 0.12 + i * 0.065, 0.05, 0.38));
        T(180, 85, 0.3, 'sine', 0.19, now + 0.38);
        break;
      case 'bossIntro':
        T(68, 36, 0.34, 'sawtooth', 0.3, now);
        N(0.3, 0.3, 360, false, now);
        T(210, 100, 0.22, 'square', 0.21, now + 0.08);
        [311, 370, 415, 494, 622, 740].forEach((f, i) => T(f, f * 0.97, 0.105, 'triangle', 0.14, now + 0.18 + i * 0.075));
        N(0.14, 0.22, 850, true, now + 0.58);
        if (!lite) T(55, 28, 0.25, 'sine', 0.14, now + 0.45);
        break;
      case 'superBossIntro':
        T(52, 28, 0.42, 'sawtooth', 0.34, now);
        N(0.38, 0.34, 300, false, now);
        T(130, 62, 0.3, 'square', 0.26, now + 0.1);
        [262, 330, 392, 523, 659, 784, 988].forEach((f, i) => E(f, f * 1.03, 0.115, 'square', 0.14, now + 0.22 + i * 0.085, 0.055, 0.4));
        T(880, 180, 0.38, 'sawtooth', 0.2, now + 0.72);
        N(0.22, 0.26, 650, true, now + 0.88);
        break;
      case 'tideBattleIntro':
        T(220, 48, 0.38, 'sine', 0.3, now);
        N(0.28, 0.22, 180, false, now);
        T(110, 52, 0.22, 'triangle', 0.24, now + 0.06);
        [220, 262, 311, 370, 440, 523, 659].forEach((f, i) => E(f, f * 1.05, 0.095, 'triangle', 0.13, now + 0.14 + i * 0.068, 0.058, 0.45));
        T(880, 165, 0.32, 'sawtooth', 0.2, now + 0.58);
        if (!lite) {
          [784, 988, 1175, 1319].forEach((f, i) => T(f, f * 0.998, 0.075, 'sine', 0.1, now + 0.68 + i * 0.048));
          T(55, 28, 0.34, 'square', 0.24, now + 0.82);
          N(0.2, 0.26, 420, true, now + 0.88);
        }
        break;
      case 'masterSword':
        [523, 659, 784, 988, 1175, 1568].forEach((f, i) => E(f, f * 1.02, 0.09, 'sine', 0.12, now + i * 0.048, 0.055, 0.4));
        T(880, 1760, 0.28, 'triangle', 0.14, now + 0.12);
        if (!lite) S([1760, 2093, 2349], now + 0.28);
        break;
      default:
        T(480, 660, 0.06, 'sine', 0.11, now);
        break;
    }
  },

  /* --------- Muziek: procedurele chiptune-sequencer (rechtenvrij) ------- */
  play(name) {
    if (!name || !SONGS[name]) return;
    this.desiredSong = name;
    if (!this.ctx || !save.music) { this.applyVolumes(); return; }
    if (this.song && this.song.id === name) { this.applyVolumes(); return; }
    this.song = Object.assign({ id: name }, SONGS[name]);
    this.step = 0; this.bar = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.applyVolumes();
  },
  stop() { this.song = null; this.desiredSong = null; this.setCombatHeat(0); this.applyVolumes(); },
  setMusicOn(on) {
    save.music = !!on; persist();
    if (!on) this.song = null;
    else if (this.desiredSong) this.play(this.desiredSong);
    this.applyVolumes();
  },
  setSfxOn(on) {
    save.sfx = !!on; persist();
    this.applyVolumes();
  },

  currentSongId() {
    return (this.song && this.song.id) || this.desiredSong || '';
  },

  tick() {
    if (!this.ctx || !this.song || !save.music) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const s = this.song;
    const spb = 60 / s.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.18) {
      this.scheduleStep(this.step, this.bar, this.nextTime, spb);
      this.nextTime += spb;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar++;
    }
  },

  scheduleStep(i, bar, t, spb) {
    const s = this.song, mg = this.musicGain;
    const midi = n => 440 * Math.pow(2, (n - 69) / 12);
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const heat = this._combatHeat || 0;
    if (s.kick.includes(i)) {
      this.tone(150, 42, 0.12, 'sine', 0.85, mg, t);
      if (!lite) this.tone(72, 34, 0.16, 'sine', 0.38, mg, t);
    }
    if (s.snare.includes(i)) {
      this.noise(0.09, 0.3, 1600, true, mg, t);
      if (!lite) {
        this.tone(190, 95, 0.055, 'triangle', 0.14, mg, t);
        this.noise(0.025, 0.12, 5200, true, mg, t + 0.008);
      }
    }
    if (s.hat.includes(i)) this.noise(0.03, 0.14, 6500, true, mg, t);
    const b = s.bass[i];
    if (b != null) {
      this.tone(midi(b), midi(b), spb * 1.7, 'triangle', 0.4, mg, t);
      if (!lite && (i === 0 || i === 8)) this.tone(midi(b + 12), midi(b + 12) * 0.998, spb * 1.2, 'sine', 0.08, mg, t);
    }
    const leadPat = s.lead[bar % s.lead.length];
    const L = leadPat[i];
    if (L != null) {
      const heat = this._combatHeat || 0;
      const lv = 0.12 + heat * 0.055;
      this.tone(midi(L), midi(L) * 0.995, spb * 1.6, 'square', lv, mg, t);
      if (!lite && i % 2 === 0) this.tone(midi(L + 7), midi(L + 7) * 0.998, spb * 1.1, 'triangle', 0.05 + heat * 0.03, mg, t + spb * 0.12);
    }
    if ((isFightBgmId(s.id)) && heat > 0.35 && !lite && i === 8 && bar % 2 === 0) {
      this.tone(midi(84), midi(79), spb * 0.9, 'square', 0.04 + heat * 0.04, mg, t);
    }
    if (isFightBgmId(s.id)) {
      if (i === 0 && bar % 4 === 0 && !lite) {
        this.tone(midi(60), midi(60), spb * 3.6, 'sine', 0.05, mg, t);
        this.tone(midi(64), midi(64), spb * 3.4, 'triangle', 0.04, mg, t);
        this.tone(midi(67), midi(67), spb * 3.2, 'sine', 0.03, mg, t);
      }
      if (i === 12 && bar % 2 === 1 && !lite) {
        this.tone(midi(72), midi(76), spb * 1.3, 'square', 0.07, mg, t);
      }
      if (i === 15 && bar % 8 === 7 && !lite) {
        this.noise(0.08, 0.17, 7800, true, mg, t);
        this.tone(midi(84), midi(67), spb * 0.75, 'square', 0.08, mg, t);
      }
      /** Punchier groove on common fight tracks */
      if (!lite && (i === 6 || i === 14) && bar % 2 === 0) {
        this.tone(midi(55), midi(48), spb * 0.7, 'triangle', 0.045, mg, t);
      }
      if (!lite && i === 4 && bar % 4 === 2) {
        this.noise(0.035, 0.1, 4800, true, mg, t);
        this.tone(midi(79), midi(76), spb * 0.85, 'square', 0.05, mg, t);
      }
      if (!lite && heat > 0.55 && (i === 2 || i === 10)) {
        this.tone(midi(88), midi(84), spb * 0.45, 'sine', 0.03 + heat * 0.025, mg, t);
      }
    }
    if ((s.id === 'tideBattle' || s.id === 'tideBattle2' || s.id === 'tideBattleSurge') && !lite) {
      if ([2, 6, 10, 14].includes(i)) {
        this.tone(midi([67, 71, 74, 79][i / 4 | 0]), midi([67, 71, 74, 79][i / 4 | 0]), spb * 0.55, 'triangle', 0.06, mg, t);
      }
      if (i === 4 && bar % 2 === 0) {
        this.tone(midi(48), midi(44), spb * 2.2, 'sine', 0.09, mg, t);
      }
      if (i === 0 && bar % 8 === 4) {
        this.noise(0.06, 0.14, 5200, true, mg, t);
        this.tone(midi(91), midi(84), spb * 0.85, 'square', 0.07, mg, t);
      }
      if (s.id === 'tideBattle2' && (i === 3 || i === 11)) {
        this.tone(midi(62), midi(55), spb * 0.9, 'triangle', 0.05, mg, t);
      }
      if (s.id === 'tideBattleSurge' && i === 8 && bar % 2 === 0) {
        this.noise(0.05, 0.12, 6400, true, mg, t);
        this.tone(midi(86), midi(79), spb * 1.1, 'square', 0.06, mg, t);
      }
    }
    const menuIds = ['menu', 'menu2', 'menu3', 'menuArcade', 'menuHero', 'menuDream'];
    if (menuIds.includes(s.id) && !lite && [3, 7, 11, 15].includes(i) && bar % 2 === 0) {
      const arp = [72, 76, 79, 84][Math.floor(i / 4)];
      this.tone(midi(arp), midi(arp + 2), spb * 0.52, 'triangle', 0.042, mg, t);
    }
    if (s.id === 'menu' || s.id === 'menu2' || s.id === 'menu3' || s.id === 'menuArcade' || s.id === 'menuHero' || s.id === 'menuDream') {
      if (i === 0 && bar % 4 === 0) {
        this.tone(midi(72), midi(72), spb * 1.8, 'square', 0.13, mg, t);
        this.tone(midi(76), midi(79), spb * 1.2, 'square', 0.09, mg, t + spb * 0.45);
      }
      if (i === 8 && bar % 2 === 0) {
        this.tone(midi(57), midi(48), spb * 1.4, 'triangle', 0.11, mg, t);
      }
      if (i === 0 && bar % 2 === 0) {
        this.tone(midi(57), midi(57), spb * 3.8, 'sine', 0.06, mg, t);
      }
      /** Soft counter-melody so long menu sessions feel less looped */
      if (!lite && i === 6 && bar % 4 === 1) {
        this.tone(midi(69), midi(72), spb * 1.5, 'sine', 0.045, mg, t);
      }
      if (!lite && i === 14 && bar % 4 === 3) {
        this.tone(midi(74), midi(71), spb * 1.2, 'triangle', 0.04, mg, t);
      }
    }
    if (s.id === 'menu2') {
      if (i === 4 || i === 12) this.tone(midi(79), midi(84), spb * 1.1, 'square', 0.1, mg, t);
      if (i === 0 && bar % 8 === 4) this.tone(midi(52), midi(45), spb * 2.6, 'triangle', 0.08, mg, t);
    }
    if (s.id === 'menu3') {
      if (i === 0 && bar % 4 === 2) this.tone(midi(64), midi(67), spb * 3.4, 'sine', 0.07, mg, t);
      if (i === 8 && bar % 4 === 0) this.tone(midi(60), midi(55), spb * 2.8, 'triangle', 0.06, mg, t);
    }
    if (s.id === 'menuArcade') {
      if (i === 0 || i === 8) this.tone(midi(67), midi(60), spb * 1.5, 'square', 0.09, mg, t);
      if (i === 4 && bar % 2 === 0) this.noise(0.03, 0.1, 5200, true, mg, t);
    }
    if (s.id === 'menuHero') {
      if (i === 4 || i === 12) this.tone(midi(79), midi(84), spb * 1.05, 'square', 0.11, mg, t);
      if (i === 0 && bar % 4 === 2) this.tone(midi(57), midi(64), spb * 2.9, 'triangle', 0.075, mg, t);
      if (!lite && i === 8 && bar % 2 === 0) this.tone(midi(72), midi(76), spb * 1.25, 'sine', 0.065, mg, t);
    }
    if (s.id === 'menuDream') {
      if (i === 0 && bar % 4 === 0) this.tone(midi(60), midi(60), spb * 4.2, 'sine', 0.055, mg, t);
      if (i === 8 && bar % 2 === 0) this.tone(midi(67), midi(64), spb * 2.4, 'triangle', 0.05, mg, t);
      if (!lite && (i === 4 || i === 12)) this.tone(midi(76), midi(79), spb * 1.6, 'sine', 0.045, mg, t);
    }
    if (s.id === 'wall' && !lite && i === 0 && bar % 2 === 0) {
      this.tone(midi(79), midi(76), spb * 0.85, 'square', 0.05, mg, t);
    }
    if (s.id === 'mats' && !lite && i === 12 && bar % 4 === 2) {
      this.tone(midi(84), midi(79), spb * 1.1, 'triangle', 0.06, mg, t);
    }
    if (s.id === 'elite' || s.id === 'elite2' || s.id === 'elitePulse' || s.id === 'boss' || s.id === 'boss2' || s.id === 'bossFury') {
      const bossish = s.id === 'boss' || s.id === 'boss2' || s.id === 'bossFury';
      if (i === 0 && bar % 2 === 0) {
        this.tone(midi(bossish ? 50 : 55), midi(bossish ? 38 : 43), spb * 2.4, 'sawtooth', 0.07, mg, t);
      }
      if (i === 8 && bar % 4 === 1) {
        this.noise(0.06, 0.12, 2200, true, mg, t);
      }
      if ((s.id === 'elitePulse' || s.id === 'bossFury') && !lite && (i === 2 || i === 10) && bar % 2 === 0) {
        this.tone(midi(bossish ? 70 : 74), midi(bossish ? 65 : 69), spb * 0.7, 'square', 0.05, mg, t);
      }
    }
    if ((s.id === 'battle2' || s.id === 'battle3' || s.id === 'battlePulse' || s.id === 'battleDrive' || s.id === 'battleRush') && !lite) {
      if (s.id === 'battle2' && (i === 2 || i === 10)) this.tone(midi(71), midi(67), spb * 0.85, 'triangle', 0.05, mg, t);
      if (s.id === 'battle3' && i === 0 && bar % 4 === 2) this.tone(midi(57), midi(50), spb * 2.8, 'sine', 0.06, mg, t);
      if (s.id === 'battlePulse' && (i === 0 || i === 8)) this.noise(0.025, 0.09, 5600, true, mg, t);
      if (s.id === 'battleDrive' && (i === 4 || i === 12) && bar % 2 === 0) this.tone(midi(79), midi(76), spb * 1.05, 'square', 0.055, mg, t);
      if (s.id === 'battleRush' && [1, 5, 9, 13].includes(i)) this.noise(0.02, 0.08, 7200, true, mg, t);
    }
    if (s.id === 'training') {
      if (i === 0) this.tone(midi(64), midi(57), spb * 2.2, 'triangle', 0.08, mg, t);
      if (i === 12 && bar % 2 === 0) this.noise(0.05, 0.1, 4800, true, mg, t);
    }
    if (s.id === 'versus') {
      if (i === 0 || i === 8) this.tone(midi(48), midi(36), spb * 1.6, 'square', 0.07, mg, t);
      if (i === 4 && bar % 2 === 1) this.noise(0.04, 0.11, 1600, false, mg, t);
    }
    if (s.id === 'wall') {
      if (i === 0 && bar % 4 === 0) this.tone(midi(67), midi(62), spb * 3.2, 'sine', 0.07, mg, t);
      if ([2, 6, 10, 14].includes(i)) this.noise(0.02, 0.08, 7000, true, mg, t);
    }
    if (s.id === 'mats') {
      if (i === 0 || i === 8) this.tone(midi(72), midi(76), spb * 1.4, 'sine', 0.09, mg, t);
      if (i === 4) this.tone(midi(79), midi(72), spb * 1.1, 'triangle', 0.07, mg, t);
    }
  },
};

const SONGS = {
  menu: {
    bpm: 96,
    kick: [0, 8], snare: [], hat: [2, 6, 10, 14],
    bass: [45,null,null,null, 48,null,null,null, 43,null,null,null, 40,null,43,null],
    lead: [
      [69,null,72,null, 76,null,72,null, 74,null,71,null, 69,null,64,null],
      [69,null,72,null, 76,null,79,null, 77,null,74,null, 72,null,71,null],
      [72,null,76,null, 79,null,76,null, 74,null,72,null, 69,null,67,null],
      [67,null,69,null, 72,null,76,null, 74,null,71,null, 69,null,72,null],
    ],
  },
  /** Menu variant — sneller, helderder */
  menu2: {
    bpm: 104,
    kick: [0, 8], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: [48,null,null,null, 52,null,null,null, 45,null,null,null, 43,null,45,null],
    lead: [
      [72,null,76,null, 79,null,76,null, 77,null,74,null, 72,null,69,null],
      [74,null,77,null, 81,null,77,null, 79,null,76,null, 74,null,72,null],
    ],
  },
  /** Menu variant — eiland / avontuur sfeer */
  menu3: {
    bpm: 84,
    kick: [0], snare: [], hat: [4, 12],
    bass: [43,null,null,null, 40,null,null,null, 38,null,null,null, 36,null,38,null],
    lead: [
      [64,null,67,null, 71,null,67,null, 69,null,64,null, 62,null,60,null],
      [67,null,71,null, 74,null,71,null, 69,null,67,null, 64,null,62,null],
    ],
  },
  /** Menu variant — coin-op arcade */
  menuArcade: {
    bpm: 110,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [50,null,50,null, 48,null,45,null, 50,null,52,null, 48,null,45,null],
    lead: [
      [76,null,79,null, 81,null,79,null, 76,null,74,null, 72,null,76,null],
      [79,null,81,null, 84,null,81,null, 79,null,76,null, 74,null,72,null],
    ],
  },
  /** Menu variant — hero fanfare / title energy */
  menuHero: {
    bpm: 100,
    kick: [0, 6, 8, 14], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: [45,null,null,48, 50,null,null,45, 43,null,40,null, 38,null,43,null],
    lead: [
      [69,null,72,76, null,74,72,null, 69,null,67,null, 64,null,67,69],
      [72,null,76,79, null,77,74,null, 72,null,69,null, 67,null,69,72],
    ],
  },
  /** Menu variant — dreamy / floaty */
  menuDream: {
    bpm: 88,
    kick: [0], snare: [], hat: [4, 12],
    bass: [48,null,null,null, 45,null,null,null, 43,null,null,null, 41,null,43,null],
    lead: [
      [67,null,71,null, 74,null,71,null, 69,null,67,null, 64,null,62,null],
      [69,null,72,null, 76,null,72,null, 69,null,67,null, 64,null,67,null],
    ],
  },
  battle: {
    bpm: 138,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [40,40,null,40, 43,null,40,null, 45,45,null,43, 40,null,38,null],
    lead: [
      [76,null,79,76, null,74,76,null, 71,null,74,71, null,69,71,74],
      [76,null,79,81, null,79,76,null, 74,null,76,74, 71,null,69,null],
      [79,null,81,79, null,76,74,null, 71,null,74,76, null,74,71,null],
      [74,null,76,79, null,81,79,null, 76,null,74,71, 69,null,71,74],
    ],
  },
  /** Battle variant — syncopisch / scherp */
  battle2: {
    bpm: 142,
    kick: [0, 3, 8, 11], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [41,null,41,null, 44,44,null,41, 38,null,41,null, 43,null,40,null],
    lead: [
      [77,null,80,77, null,76,74,null, 72,null,76,72, null,71,72,76],
      [79,null,81,79, null,77,76,null, 74,null,72,71, 69,null,71,null],
    ],
  },
  /** Battle variant — zwaarder / lagere lead */
  battle3: {
    bpm: 132,
    kick: [0, 4, 8, 12, 14], snare: [4, 12], hat: [2,6,10,14],
    bass: [38,38,null,38, 41,null,38,null, 43,43,null,41, 38,null,36,null],
    lead: [
      [72,null,74,72, null,71,69,null, 67,null,69,67, null,64,67,69],
      [74,null,76,74, null,72,71,null, 69,null,67,64, 62,null,64,null],
    ],
  },
  /** Battle variant — pulse / arcade */
  battlePulse: {
    bpm: 146,
    kick: [0, 4, 8, 12], snare: [4, 10, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [42,null,42,null, 45,null,42,null, 47,null,45,null, 42,null,40,null],
    lead: [
      [78,78,null,81, null,79,78,null, 74,74,null,76, null,74,71,null],
      [81,null,83,81, null,79,78,null, 76,null,74,71, 69,null,71,74],
    ],
  },
  /** Battle variant — drive / gallop */
  battleDrive: {
    bpm: 150,
    kick: [0, 6, 8, 14], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [40,40,43,null, 40,null,45,null, 43,43,40,null, 38,null,40,null],
    lead: [
      [76,null,79,null, 81,79,76,null, 74,null,76,79, null,76,74,null],
      [79,null,81,null, 84,81,79,null, 76,null,74,71, 74,null,76,null],
    ],
  },
  /** Battle variant — rush / snelle hats */
  battleRush: {
    bpm: 154,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [43,null,43,40, 45,null,43,null, 40,40,null,38, 40,null,43,null],
    lead: [
      [81,null,79,81, null,84,81,null, 79,null,76,79, null,74,76,79],
      [84,null,81,79, null,81,84,null, 79,null,76,74, 76,null,79,null],
    ],
  },
  elite: {
    bpm: 148,
    kick: [0, 4, 8, 11, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [41,41,null,41, 44,null,41,null, 46,46,null,44, 41,null,39,null],
    lead: [
      [77,null,80,77, null,75,77,null, 72,null,75,72, null,70,72,75],
      [77,null,80,82, null,80,77,null, 75,null,77,75, 72,null,70,null],
      [80,null,82,80, null,77,75,null, 72,null,75,77, null,75,72,null],
      [75,null,77,80, null,82,80,null, 77,null,75,72, 70,null,72,75],
    ],
  },
  /** Elite variant — hoger / scherper */
  elite2: {
    bpm: 152,
    kick: [0, 3, 8, 11, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [43,43,null,43, 46,null,43,null, 48,48,null,46, 43,null,41,null],
    lead: [
      [79,null,82,79, null,77,79,null, 74,null,77,74, null,72,74,77],
      [79,null,82,84, null,82,79,null, 77,null,79,77, 74,null,72,null],
    ],
  },
  /** Elite variant — pulse */
  elitePulse: {
    bpm: 156,
    kick: [0, 4, 8, 12], snare: [4, 10, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [42,null,42,null, 45,null,42,null, 47,null,45,null, 42,null,40,null],
    lead: [
      [80,80,null,83, null,81,80,null, 76,76,null,78, null,76,73,null],
      [83,null,85,83, null,81,80,null, 78,null,76,73, 71,null,73,76],
    ],
  },
  boss: {
    bpm: 156,
    kick: [0, 4, 8, 12, 14], snare: [4, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [38,38,38,null, 39,null,38,null, 41,41,null,39, 38,null,36,null],
    lead: [
      [74,null,75,74, null,70,74,null, 77,null,75,74, null,72,70,null],
      [74,null,77,79, null,77,75,null, 74,null,72,70, 69,null,70,null],
      [77,null,79,77, null,74,72,null, 70,null,74,77, null,75,74,null],
      [79,null,77,74, null,72,70,null, 69,null,70,72, 74,null,75,null],
    ],
  },
  /** Boss variant — lager / dreigender */
  boss2: {
    bpm: 148,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [36,36,null,36, 37,null,36,null, 39,39,null,37, 36,null,34,null],
    lead: [
      [70,null,72,70, null,67,70,null, 74,null,72,70, null,69,67,null],
      [72,null,74,77, null,74,72,null, 70,null,69,67, 65,null,67,null],
    ],
  },
  /** Boss variant — fury / sneller */
  bossFury: {
    bpm: 164,
    kick: [0, 3, 6, 8, 11, 12, 14], snare: [4, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [38,38,null,41, 38,null,43,null, 41,41,null,38, 36,null,38,null],
    lead: [
      [77,null,79,77, null,74,77,null, 81,null,79,77, null,74,72,null],
      [79,null,81,84, null,81,79,null, 77,null,74,72, 70,null,72,null],
    ],
  },
  /** Tide Battle — epische oceaangolf / summon-clash (eigen track) */
  tideBattle: {
    bpm: 164,
    kick: [0, 4, 7, 8, 12, 14], snare: [4, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [36,36,null,34, 36,36,null,31, 33,null,36,null, 34,null,31,null],
    lead: [
      [67,null,71,74, null,71,67,null, 74,null,77,79, null,77,74,null],
      [79,null,77,74, null,71,74,null, 79,null,83,86, null,83,79,null],
      [74,null,77,81, null,79,77,null, 74,null,71,67, null,71,74,null],
      [86,null,83,79, null,77,74,null, 71,null,74,77, null,79,83,null],
    ],
  },
  /** Tide variant — dieper / golvender */
  tideBattle2: {
    bpm: 158,
    kick: [0, 4, 8, 12, 14], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [34,34,null,33, 34,34,null,29, 31,null,34,null, 33,null,29,null],
    lead: [
      [64,null,67,71, null,67,64,null, 71,null,74,76, null,74,71,null],
      [76,null,74,71, null,67,71,null, 76,null,79,83, null,79,76,null],
      [71,null,74,77, null,76,74,null, 71,null,67,64, null,67,71,null],
    ],
  },
  /** Tide variant — surge / sneller */
  tideBattleSurge: {
    bpm: 172,
    kick: [0, 3, 6, 8, 11, 12, 14], snare: [4, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [36,null,36,34, 38,null,36,null, 33,33,null,36, 34,null,31,null],
    lead: [
      [71,null,74,77, null,74,71,null, 79,null,83,86, null,83,79,null],
      [83,null,81,77, null,74,77,null, 83,null,86,88, null,86,83,null],
      [77,null,79,83, null,81,79,null, 77,null,74,71, null,74,77,null],
    ],
  },
  /** Training vs RabbitRobot — strak, metallig, minder zwaar dan baas */
  training: {
    bpm: 128,
    kick: [0, 8], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [48,null,48,null, 45,null,43,null, 48,null,50,null, 45,null,43,null],
    lead: [
      [71,null,null,74, null,76,null,74, 71,null,69,null, 67,null,69,null],
      [74,null,76,null, 79,null,76,null, 74,null,71,null, 69,null,71,74],
    ],
  },
  /** 2P versus — syncopisch, duellerend */
  versus: {
    bpm: 152,
    kick: [0, 3, 8, 11], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [36,36,null,38, 36,null,41,null, 38,38,null,36, 33,null,36,null],
    lead: [
      [72,null,75,72, null,70,72,null, 67,null,70,67, null,65,67,70],
      [75,null,77,79, null,77,75,null, 72,null,70,67, 65,null,67,null],
    ],
  },
  /** Muur — snelle arcade-tick */
  wall: {
    bpm: 168,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [1,3,5,7,9,11,13,15],
    bass: [43,43,null,43, 45,null,43,null, 47,47,null,45, 43,null,40,null],
    lead: [
      [79,79,null,76, 79,null,81,null, 76,76,null,74, 76,null,79,null],
      [81,null,79,76, null,74,76,null, 79,null,81,84, null,81,79,null],
    ],
  },
  /** Mats munten — speels / vrolijk */
  mats: {
    bpm: 118,
    kick: [0, 8], snare: [4, 12], hat: [2, 6, 10, 14],
    bass: [48,null,null,48, 52,null,48,null, 50,null,null,50, 47,null,45,null],
    lead: [
      [72,null,76,79, null,76,72,null, 74,null,77,81, null,77,74,null],
      [76,null,79,83, null,79,76,null, 74,null,72,69, 71,null,72,76],
    ],
  },
};

const MENU_BGM_TRACKS = ['menu', 'menu2', 'menu3', 'menuArcade', 'menuHero', 'menuDream'];
let menuBgmIdx = 0;

/** Fight BGM pools — rotate variants so battle/elite/boss/tide stay fresh. */
const BATTLE_BGM_TRACKS = ['battle', 'battle2', 'battle3', 'battlePulse', 'battleDrive', 'battleRush'];
const ELITE_BGM_TRACKS = ['elite', 'elite2', 'elitePulse'];
const BOSS_BGM_TRACKS = ['boss', 'boss2', 'bossFury'];
const TIDE_BGM_TRACKS = ['tideBattle', 'tideBattle2', 'tideBattleSurge'];
const FIGHT_BGM_IDS = new Set([
  ...BATTLE_BGM_TRACKS, ...ELITE_BGM_TRACKS, ...BOSS_BGM_TRACKS, ...TIDE_BGM_TRACKS,
]);
const fightBgmIdx = { battle: 0, elite: 0, boss: 0, tideBattle: 0 };

function isFightBgmId(id) {
  return !!(id && FIGHT_BGM_IDS.has(id));
}

function isTideBgmId(id) {
  return !!(id && TIDE_BGM_TRACKS.includes(id));
}

/** Pick next track in a fight pool (kind: battle|elite|boss|tideBattle).
 *  Keeps current track if already in the same pool (avoids double-rotate on start). */
function playFightBgm(kind) {
  const pools = {
    battle: BATTLE_BGM_TRACKS,
    elite: ELITE_BGM_TRACKS,
    boss: BOSS_BGM_TRACKS,
    tideBattle: TIDE_BGM_TRACKS,
  };
  const key = pools[kind] ? kind : 'battle';
  const pool = pools[key];
  const cur = (typeof AudioSys !== 'undefined' && ((AudioSys.song && AudioSys.song.id) || AudioSys.desiredSong)) || '';
  if (cur && pool.includes(cur)) {
    AudioSys.play(cur);
    return cur;
  }
  fightBgmIdx[key] = ((fightBgmIdx[key] || 0) + 1) % pool.length;
  const id = pool[fightBgmIdx[key]];
  AudioSys.play(id);
  return id;
}

/** Rotate menu BGM when returning from a game; keep current track on boot/toggle. */
function playMenuBgm(fromGame) {
  if (fromGame) menuBgmIdx = (menuBgmIdx + 1) % MENU_BGM_TRACKS.length;
  AudioSys.play(MENU_BGM_TRACKS[menuBgmIdx]);
}

const SONG_LABELS = {
  menu: 'Menu', menu2: 'Menu 2', menu3: 'Menu 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
  battle: 'Gevecht', battle2: 'Gevecht 2', battle3: 'Gevecht 3', battlePulse: 'Pulse', battleDrive: 'Drive', battleRush: 'Rush',
  elite: 'Elite', elite2: 'Elite 2', elitePulse: 'Elite Pulse',
  boss: 'Baas', boss2: 'Baas 2', bossFury: 'Baas Fury',
  tideBattle: 'Tide', tideBattle2: 'Tide 2', tideBattleSurge: 'Tide Surge',
  wall: 'Muur', training: 'Training', coinrun: 'Mats',
};
function songLabel(id) {
  if (!id) return '';
  return (typeof t === 'function' && t('audio.track.' + id) !== 'audio.track.' + id)
    ? t('audio.track.' + id)
    : (SONG_LABELS[id] || id);
}

