#!/usr/bin/env node
/**
 * Audio theme packs: classic stays intact, jungle + fire-bamboo-boesa remix,
 * persist key, Settings/pause switcher, light scenery hooks.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const themes = fs.readFileSync(path.join(root, 'src/systems/audio-themes.js'), 'utf8');
const audio = fs.readFileSync(path.join(root, 'src/systems/audio.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const backgrounds = fs.readFileSync(path.join(root, 'src/render/backgrounds.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const loop = fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8');

if (!/AUDIO_THEME_IDS = \['classic', 'jungle', 'fire-bamboo-boesa'\]/.test(themes)) {
  fail('AUDIO_THEME_IDS must be classic + jungle + fire-bamboo-boesa');
}
if (!/audioTheme: 'classic'/.test(storage)) fail('DEFAULT_SAVE.audioTheme must default to classic');
if (!/normalizeAudioTheme\(out\.audioTheme\)/.test(storage) && !/allowedThemes.includes\(out\.audioTheme\)/.test(storage)) {
  fail('sanitizeSave must clamp audioTheme');
}

if (!/menu: \{\s*bpm: 96,/.test(audio)) fail('classic SONGS.menu bpm 96 must stay');
if (!/battle: \{\s*bpm: 138,/.test(audio)) fail('classic SONGS.battle bpm 138 must stay');
if (!/resolveThemedSong\(name\)/.test(audio)) fail('AudioSys.play must resolve themed song variants');
if (!/theme === 'classic'/.test(audio)) fail('classic play() must use raw SONGS table');
if (!/replayForTheme/.test(audio)) fail('theme switch must soft-replay via replayForTheme');
if (!/song\.audioTheme/.test(audio)) fail('play() must track audioTheme on the song');
if (!/scheduleAudioThemeStep/.test(audio)) fail('sequencer must call theme extras');
if (!/audioThemeSfxRate/.test(audio)) fail('sample playback must honor theme rate');
if (!/AUDIO_THEME_PREF_KEY/.test(themes)) fail('theme persist sidecar key missing');
if (!/persistAudioTheme/.test(themes)) fail('persistAudioTheme helper missing');
if (!/syncAudioThemeAfterSaveChange/.test(themes)) fail('import/reset must resync theme');
if (!/initAudioThemeFromStorage/.test(themes)) fail('boot must heal theme from sidecar');
if (!/syncAudioThemeAfterSaveChange/.test(missions)) fail('importSaveJson must resync audio theme');
if (!/syncAudioThemeAfterSaveChange/.test(start)) fail('clearSave must reset audio theme sidecar');
if (!/initAudioThemeFromStorage/.test(loop)) fail('boot loop must init audio theme from storage');

if (!/id="audioThemeBar"/.test(html)) fail('Settings missing audioThemeBar');
if (!/id="pauseAudioThemeBar"/.test(html)) fail('Pause missing pauseAudioThemeBar');
if (!/id="setAudioThemeLbl"/.test(html)) fail('Settings missing theme label');

if (!/resolveAudioThemePalette/.test(backgrounds)) fail('drawBackground must tint palette via audio theme');
if (!/drawAudioThemeScenery/.test(backgrounds)) fail('drawBackground must draw theme scenery wash/props');
if (!/renderAudioThemeSwitch/.test(ui)) fail('Settings/pause must render theme switcher');

if (!/src\/systems\/audio-themes\.js/.test(manifest)) fail('manifest must include audio-themes.js');

if (/delete SONGS|SONGS\s*=\s*\{\s*\}/.test(audio)) fail('must not wipe classic SONGS table');

const rt = {
  save: { audioTheme: 'classic', music: true, sfx: true },
  persist() { rt.__persisted = rt.save.audioTheme; },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] ?? null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
  },
  SONGS: {
    battle: {
      bpm: 138, kick: [0, 4], snare: [4], hat: [2, 6],
      bass: [40, null, 43, null], lead: [[76, null, 79, null]],
    },
  },
  AudioSys: { currentSongId() { return ''; }, play() {}, sfx() {}, song: null, ctx: null },
  UI: { renderSettings() {}, renderPauseToggles() {}, toast() {} },
  document: {
    body: { setAttribute(k, v) { rt.__domTheme = v; } },
    getElementById() { return null; },
  },
  bindPress() {},
  W: 480, H: 720,
};
vm.createContext(rt);
vm.runInContext(themes, rt, { filename: 'audio-themes.js' });

if (rt.getAudioTheme() !== 'classic') fail('default theme must be classic');
if (rt.normalizeAudioTheme('nope') !== 'classic') fail('unknown theme must fall back to classic');

const classicBattle = rt.resolveThemedSong('battle');
if (!classicBattle || classicBattle.bpm !== 138) fail('classic battle bpm must stay 138');

rt.setAudioTheme('jungle');
if (rt.getAudioTheme() !== 'jungle') fail('setAudioTheme(jungle) did not stick');
if (rt.__persisted !== 'jungle') fail('jungle theme must persist()');
if (rt.__domTheme !== 'jungle') fail('body data-audio-theme must be jungle');
const jungleBattle = rt.resolveThemedSong('battle');
if (!jungleBattle || jungleBattle.bpm === 138) fail('jungle battle bpm must remix classic');
if (jungleBattle.bpm !== Math.round(138 * 0.92)) fail('jungle battle bpm should be classic * 0.92');

const veld = { sky1: '#7ec8ff', sky2: '#cfeeff', hill: '#5cb85c', hill2: '#3f9b47', ground: '#4c8f3f', gtop: '#66b356', deco: 'bloem' };
const junglePal = rt.resolveAudioThemePalette(veld);
if (junglePal.sky1 === veld.sky1) fail('jungle palette must tint sky');

rt.setAudioTheme('fire-bamboo-boesa');
if (rt.getAudioTheme() !== 'fire-bamboo-boesa') fail('fire-bamboo-boesa did not stick');
const fireBattle = rt.resolveThemedSong('battle');
if (!fireBattle || fireBattle.bpm === 138) fail('fire-bamboo battle bpm must remix classic');
const firePal = rt.resolveAudioThemePalette(veld);
if (firePal.sky1 === veld.sky1 || firePal.sky1 === junglePal.sky1) fail('fire palette must differ from classic and jungle');

rt.setAudioTheme('classic');
if (rt.getAudioTheme() !== 'classic') fail('classic must remain selectable');
if (rt.resolveThemedSong('battle').bpm !== 138) fail('switching back to classic must restore bpm 138');
if (rt.localStorage.getItem('stickfighter_audio_theme_v1') !== 'classic') {
  fail('sidecar must follow classic after switch-back');
}

rt.save.audioTheme = 'nope';
if (rt.getAudioTheme() !== 'classic') fail('invalid save theme must heal from sidecar');

rt.localStorage.setItem('stickfighter_audio_theme_v1', 'jungle');
rt.save.audioTheme = 'classic';
rt.initAudioThemeFromStorage();
if (rt.getAudioTheme() !== 'jungle') fail('boot must prefer last sidecar tap over stale classic save');
if (rt.save.audioTheme !== 'jungle') fail('boot heal must write jungle back into save');

const same = rt.setAudioTheme('classic');
if (same !== 'classic') fail('setAudioTheme classic must stay classic');

console.log('SMOKE_OK audio-themes: classic pack kept, jungle + fire-bamboo-boesa switch, persist + scenery hooks');
