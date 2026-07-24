/* =============================== AUDIO ================================= */
const AudioSys = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  desiredSong: null,
  song: null, step: 0, bar: 0, nextTime: 0,
  paused: false,

  init() {
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
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
      if (this.desiredSong && save.music) this.play(this.desiredSong);
      this.applyVolumes();
    } catch (err) {
      console.warn('[Stickman] AudioSys.init', err);
      this.ctx = null;
    }
  },

  _setGain(g, v) {
    if (!g) return;
    try {
      const t = this.ctx ? this.ctx.currentTime : 0;
      if (g.gain.cancelScheduledValues) g.gain.cancelScheduledValues(t);
      if (g.gain.setTargetAtTime) g.gain.setTargetAtTime(v, t, 0.04);
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
    let baseM = (id === 'menu') ? 0.24 : 0.32;
    if (lite) baseM *= 0.88;
    // Duck BGM in pauze / result — SFX blijft hoorbaar (iets harder in pauze voor knoppen)
    if (inPause) baseM *= 0.26;
    else if (state === 'result') baseM *= 0.5;
    const sfxMul = (lite ? 0.68 : 0.74) * (inPause ? 1.1 : 1);
    this._setGain(this.musicGain, baseM * mv);
    this._setGain(this.sfxGain, sfxMul * sv);
    this.syncContextPower();
  },

  /** Suspend Web Audio when fully muted (menu/pause) — saves battery on iPad/PWA */
  syncContextPower() {
    if (!this.ctx) return;
    const needAudio = !!(save.music || save.sfx);
    const keepAwake = state === 'play' || (state === 'pause' && needAudio);
    try {
      if (!needAudio && !keepAwake && this.ctx.state === 'running') {
        this.ctx.suspend();
      } else if (needAudio && !document.hidden && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (_) {}
  },

  setPaused(on) {
    this.paused = !!on;
    if (on) {
      try { this.init(); } catch (_) {}
      try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (_) {}
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
    o.connect(g); g.connect(out || this.sfxGain);
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
    src.connect(f); f.connect(g); g.connect(out || this.sfxGain);
    src.start(t);
  },

  sfx(name) {
    if (!this.ctx || !save.sfx) return;
    const lite = save.liteFx || (typeof Perf !== 'undefined' && Perf.tier >= 1);
    const v = (n) => n * (lite ? 0.72 : 0.88);
    const d = (n) => n * (lite ? 0.78 : 0.9);
    const T = (f0, f1, dur, ty, vol, w) => this.tone(f0, f1, d(dur), ty, v(vol), null, w);
    const N = (dur, vol, ff, hp, w) => this.noise(d(dur), v(vol), ff, hp, null, w);
    const now = this.ctx.currentTime;
    switch (name) {
      case 'swing':   N(0.05, 0.2, 3200, true); T(380, 180, 0.06, 'sine', 0.1); break;
      case 'punch':
        N(0.035, 0.16, 2800, true, now);
        T(220, 90, 0.06, 'sine', 0.14, now);
        break;
      case 'kick':
        N(0.045, 0.18, 2400, true, now);
        T(300, 110, 0.08, 'triangle', 0.13, now);
        break;
      case 'wKunai':
        N(0.03, 0.14, 5200, true, now);
        T(980, 420, 0.07, 'triangle', 0.12, now);
        break;
      case 'wZwaard':
        N(0.055, 0.2, 3800, true, now);
        T(620, 280, 0.09, 'sawtooth', 0.1, now);
        T(880, 440, 0.05, 'sine', 0.08, now + 0.02);
        break;
      case 'wKnuppel':
        N(0.07, 0.24, 900, false, now);
        T(140, 55, 0.1, 'sine', 0.2, now);
        break;
      case 'wSpeer':
        N(0.04, 0.15, 4000, true, now);
        T(540, 220, 0.1, 'triangle', 0.12, now);
        break;
      case 'wNunchaku':
        N(0.025, 0.12, 5000, true, now);
        T(760, 520, 0.045, 'sine', 0.1, now);
        T(520, 760, 0.045, 'sine', 0.09, now + 0.04);
        break;
      case 'wBoemerang':
        T(640, 920, 0.08, 'triangle', 0.11, now);
        T(920, 480, 0.1, 'sine', 0.1, now + 0.05);
        N(0.04, 0.1, 3600, true, now);
        break;
      case 'wHamer':
        N(0.1, 0.32, 600, false, now);
        T(90, 40, 0.14, 'sine', 0.28, now);
        T(180, 80, 0.06, 'square', 0.1, now + 0.04);
        break;
      case 'wKetting':
        N(0.06, 0.18, 2200, true, now);
        T(280, 160, 0.08, 'sawtooth', 0.12, now);
        T(480, 240, 0.05, 'triangle', 0.08, now + 0.03);
        break;
      case 'wLaser':
        T(1200, 480, 0.1, 'sawtooth', 0.14, now);
        T(1600, 900, 0.06, 'sine', 0.1, now);
        N(0.04, 0.1, 6000, true, now);
        break;
      case 'wDonder':
        T(180, 70, 0.12, 'sawtooth', 0.2, now);
        N(0.1, 0.22, 1800, true, now);
        T(980, 420, 0.08, 'sine', 0.12, now + 0.04);
        break;
      case 'wVoid':
        T(220, 90, 0.12, 'sine', 0.14, now);
        T(660, 220, 0.1, 'triangle', 0.11, now + 0.03);
        N(0.08, 0.14, 1400, true, now);
        break;
      case 'wGuvve':
        T(280, 160, 0.08, 'square', 0.16, now);
        T(420, 240, 0.07, 'triangle', 0.12, now + 0.05);
        N(0.05, 0.14, 1600, false, now + 0.02);
        break;
      case 'hit':     T(200, 70, 0.07, 'sine', 0.2); N(0.04, 0.2, 1200, true); break;
      case 'hit2':    T(150, 55, 0.1, 'square', 0.28); N(0.06, 0.28, 700, false); T(240, 100, 0.05, 'triangle', 0.11); break;
      case 'hitMetal':
        T(880, 440, 0.05, 'triangle', 0.14, now);
        N(0.04, 0.16, 2800, true, now);
        T(220, 90, 0.07, 'sine', 0.12, now);
        break;
      case 'hitHeavy':
        T(120, 45, 0.12, 'sine', 0.26, now);
        N(0.08, 0.28, 700, false, now);
        break;
      case 'hitEnergy':
        T(720, 320, 0.08, 'sine', 0.14, now);
        T(1100, 600, 0.06, 'triangle', 0.1, now);
        N(0.04, 0.12, 4200, true, now);
        break;
      case 'jump':    T(260, 520, 0.1, 'sine', 0.18); break;
      case 'land':    N(0.04, 0.16, 500, false); break;
      case 'hurt':    T(340, 140, 0.11, 'triangle', 0.2); break;
      case 'die':     T(400, 70, 0.32, 'sawtooth', 0.26); N(0.18, 0.22, 800, false); break;
      case 'shoot':   T(820, 280, 0.1, 'square', 0.16); break;
      case 'laser':   T(1400, 380, 0.12, 'sawtooth', 0.16); break;
      case 'explode': N(0.28, 0.42, 700, false); T(120, 40, 0.22, 'sine', 0.38); break;
      case 'brick':   N(0.1, 0.34, 1600, false); T(520, 220, 0.07, 'triangle', 0.18); break;
      case 'crack':   N(0.05, 0.18, 2200, false); break;
      case 'block':   T(920, 720, 0.06, 'sine', 0.16); N(0.04, 0.14, 4800, true); break;
      case 'crit':
        T(920, 1380, 0.05, 'triangle', 0.18, now);
        T(1380, 1760, 0.06, 'sine', 0.14, now + 0.03);
        break;
      case 'special':
      case 'rasengan':
        T(380, 980, 0.18, 'sine', 0.12, now);
        T(620, 1180, 0.14, 'triangle', 0.1, now + 0.04);
        N(0.1, 0.09, 3400, true, now);
        break;
      case 'chidori':
        T(980, 1520, 0.16, 'sine', 0.14, now);
        N(0.12, 0.11, 5200, true, now);
        break;
      case 'rinnegan':
        T(280, 720, 0.12, 'sine', 0.14, now);
        T(720, 520, 0.14, 'triangle', 0.11, now + 0.04);
        T(980, 1280, 0.07, 'sine', 0.1, now + 0.1);
        N(0.08, 0.1, 2000, true, now + 0.02);
        break;
      case 'subst':
        N(0.08, 0.26, 1100, true); T(320, 140, 0.07, 'sine', 0.12); break;
      case 'shuriken':
        T(920, 520, 0.06, 'triangle', 0.12); N(0.03, 0.1, 4500, true); break;
      case 'roar':    T(110, 65, 0.38, 'sawtooth', 0.28); N(0.28, 0.2, 400, false); break;
      case 'select':  T(720, 920, 0.05, 'sine', 0.11); break;
      case 'combo':
        T(560, 820, 0.06, 'triangle', 0.13, now);
        T(820, 980, 0.07, 'sine', 0.11, now + 0.03);
        break;
      case 'dash':
        N(0.05, 0.14, 3400, true); T(480, 720, 0.07, 'sine', 0.11); break;
      case 'pickup':
        T(720, 980, 0.08, 'sine', 0.15, now);
        T(980, 1280, 0.09, 'triangle', 0.12, now + 0.04);
        break;
      case 'bell':    T(1280, 1220, 0.45, 'triangle', 0.24); break;
      case 'bonus':   T(920, 1320, 0.1, 'square', 0.16); T(1320, 1680, 0.1, 'square', 0.16, now + 0.07); break;
      case 'levelup':
        [523, 659, 784, 1047].forEach((f, i) => T(f, f, 0.11, 'triangle', 0.17, now + i * 0.07));
        break;
      case 'newmonster':
        [392, 523, 659].forEach((f, i) => T(f, f, 0.1, 'sine', 0.17, now + i * 0.06));
        break;
      case 'win':
        [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, f, 0.14, 'triangle', 0.16, now + i * 0.09));
        break;
      case 'lose':
        [392, 330, 262, 196].forEach((f, i) => T(f, f * 0.97, 0.18, 'triangle', 0.14, now + i * 0.12));
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
    switch (name) {
      case 'title':
        [392, 523, 659, 784, 988].forEach((f, i) => T(f, f, 0.08, 'triangle', 0.14, now + i * 0.05));
        T(120, 60, 0.18, 'sine', 0.24, now + 0.04);
        N(0.06, 0.16, 1400, false, now + 0.28);
        break;
      case 'modeAdventure':
        [440, 554, 659, 880].forEach((f, i) => T(f, f, 0.07, 'sine', 0.12, now + i * 0.045));
        break;
      case 'modeTraining':
        T(220, 880, 0.14, 'sine', 0.11, now);
        N(0.12, 0.14, 4800, true, now + 0.03);
        T(660, 880, 0.07, 'triangle', 0.1, now + 0.14);
        break;
      case 'modeVersus':
        T(160, 880, 0.07, 'square', 0.17, now);
        T(880, 160, 0.07, 'square', 0.16, now + 0.08);
        N(0.05, 0.2, 1000, false, now + 0.04);
        break;
      case 'modeWall':
        [196, 247, 330, 392].forEach((f, i) => T(f, f * 0.96, 0.09, 'triangle', 0.15, now + i * 0.04));
        break;
      case 'modeMats':
        [523, 659, 784].forEach((f, i) => T(f, f * 1.02, 0.07, 'sine', 0.12, now + i * 0.05));
        T(392, 523, 0.1, 'triangle', 0.1, now + 0.16);
        break;
      case 'superReady':
        if (kind === 'chidori') {
          T(920, 1480, 0.14, 'sine', 0.16, now);
          N(0.1, 0.14, 5400, true, now);
          T(1200, 920, 0.06, 'triangle', 0.1, now + 0.08);
        } else if (kind === 'rinnegan') {
          T(360, 660, 0.12, 'sine', 0.16, now);
          T(880, 1180, 0.1, 'triangle', 0.12, now + 0.05);
          T(110, 60, 0.14, 'sine', 0.09, now + 0.03);
        } else {
          T(720, 1180, 0.1, 'sine', 0.14, now);
          T(980, 1320, 0.09, 'triangle', 0.12, now + 0.05);
          T(1320, 880, 0.07, 'sine', 0.08, now + 0.1);
        }
        break;
      case 'eliteIntro':
        T(98, 55, 0.22, 'sawtooth', 0.22, now);
        N(0.18, 0.22, 500, false, now);
        [392, 466, 523, 622].forEach((f, i) => T(f, f * 1.02, 0.09, 'square', 0.13, now + 0.12 + i * 0.07));
        T(180, 90, 0.28, 'sine', 0.18, now + 0.35);
        break;
      case 'bossIntro':
        T(70, 40, 0.32, 'sawtooth', 0.28, now);
        N(0.28, 0.28, 380, false, now);
        T(220, 110, 0.2, 'square', 0.2, now + 0.08);
        [311, 370, 415, 494, 622].forEach((f, i) => T(f, f * 0.97, 0.1, 'triangle', 0.14, now + 0.18 + i * 0.08));
        N(0.12, 0.2, 900, true, now + 0.55);
        break;
      case 'superBossIntro':
        T(55, 32, 0.4, 'sawtooth', 0.32, now);
        N(0.35, 0.32, 320, false, now);
        T(140, 70, 0.28, 'square', 0.24, now + 0.1);
        [262, 330, 392, 523, 659, 784].forEach((f, i) => T(f, f * 1.03, 0.11, 'square', 0.15, now + 0.22 + i * 0.09));
        T(880, 220, 0.35, 'sawtooth', 0.18, now + 0.7);
        N(0.2, 0.24, 700, true, now + 0.85);
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
  stop() { this.song = null; this.desiredSong = null; this.applyVolumes(); },
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
    if (s.kick.includes(i)) this.tone(150, 42, 0.12, 'sine', 0.85, mg, t);
    if (s.snare.includes(i)) this.noise(0.09, 0.3, 1600, true, mg, t);
    if (s.hat.includes(i)) this.noise(0.03, 0.14, 6500, true, mg, t);
    const b = s.bass[i];
    if (b != null) this.tone(midi(b), midi(b), spb * 1.7, 'triangle', 0.4, mg, t);
    const leadPat = s.lead[bar % s.lead.length];
    const L = leadPat[i];
    if (L != null) this.tone(midi(L), midi(L) * 0.995, spb * 1.6, 'square', 0.12, mg, t);
    if (s.id === 'menu' || s.id === 'menu2' || s.id === 'menu3' || s.id === 'menuArcade') {
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
    if (s.id === 'elite' || s.id === 'boss') {
      if (i === 0 && bar % 2 === 0) {
        this.tone(midi(s.id === 'boss' ? 50 : 55), midi(s.id === 'boss' ? 38 : 43), spb * 2.4, 'sawtooth', 0.07, mg, t);
      }
      if (i === 8 && bar % 4 === 1) {
        this.noise(0.06, 0.12, 2200, true, mg, t);
      }
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
  battle: {
    bpm: 138,
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [40,40,null,40, 43,null,40,null, 45,45,null,43, 40,null,38,null],
    lead: [
      [76,null,79,76, null,74,76,null, 71,null,74,71, null,69,71,74],
      [76,null,79,81, null,79,76,null, 74,null,76,74, 71,null,69,null],
    ],
  },
  elite: {
    bpm: 148,
    kick: [0, 4, 8, 11, 12], snare: [4, 12], hat: [0,2,4,6,8,10,12,14],
    bass: [41,41,null,41, 44,null,41,null, 46,46,null,44, 41,null,39,null],
    lead: [
      [77,null,80,77, null,75,77,null, 72,null,75,72, null,70,72,75],
      [77,null,80,82, null,80,77,null, 75,null,77,75, 72,null,70,null],
    ],
  },
  boss: {
    bpm: 156,
    kick: [0, 4, 8, 12, 14], snare: [4, 12], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [38,38,38,null, 39,null,38,null, 41,41,null,39, 38,null,36,null],
    lead: [
      [74,null,75,74, null,70,74,null, 77,null,75,74, null,72,70,null],
      [74,null,77,79, null,77,75,null, 74,null,72,70, 69,null,70,null],
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

const MENU_BGM_TRACKS = ['menu', 'menu2', 'menu3', 'menuArcade'];
let menuBgmIdx = 0;

/** Rotate menu BGM when returning from a game; keep current track on boot/toggle. */
function playMenuBgm(fromGame) {
  if (fromGame) menuBgmIdx = (menuBgmIdx + 1) % MENU_BGM_TRACKS.length;
  AudioSys.play(MENU_BGM_TRACKS[menuBgmIdx]);
}

