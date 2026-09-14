#!/usr/bin/env node
/**
 * Audio theme packs: classic stays intact, jungle + fire-bamboo-boesa remix,
 * persist key, Settings/pause switcher, light scenery hooks.
 */
import fs from 'fs';
import path from 'path';
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

if (!/AUDIO_THEME_IDS = \['classic', 'jungle', 'fire-bamboo-boesa'\]/.test(themes)) {
  fail('AUDIO_THEME_IDS must be classic + jungle + fire-bamboo-boesa');
}
if (!/audioTheme: 'classic'/.test(storage)) fail('DEFAULT_SAVE.audioTheme must default to classic');
if (!/allowedThemes.includes\(out\.audioTheme\)/.test(storage)) fail('sanitizeSave must clamp audioTheme');

if (!/menu: \{\s*bpm: 96,/.test(audio)) fail('classic SONGS.menu bpm 96 must stay');
if (!/battle: \{\s*bpm: 138,/.test(audio)) fail('classic SONGS.battle bpm 138 must stay');
if (!/resolveThemedSong\(name\)/.test(audio)) fail('AudioSys.play must resolve themed song variants');
if (!/song\.audioTheme === theme/.test(audio)) fail('play() must restart when audio theme changes');
if (!/scheduleAudioThemeStep/.test(audio)) fail('sequencer must call theme extras');
if (!/audioThemeSfxRate/.test(audio)) fail('sample playback must honor theme rate');

if (!/id="audioThemeBar"/.test(html)) fail('Settings missing audioThemeBar');
if (!/id="pauseAudioThemeBar"/.test(html)) fail('Pause missing pauseAudioThemeBar');
if (!/id="setAudioThemeLbl"/.test(html)) fail('Settings missing theme label');

if (!/resolveAudioThemePalette/.test(backgrounds)) fail('drawBackground must tint palette via audio theme');
if (!/drawAudioThemeScenery/.test(backgrounds)) fail('drawBackground must draw theme scenery wash/props');
if (!/renderAudioThemeSwitch/.test(ui)) fail('Settings/pause must render theme switcher');

if (!/src\/systems\/audio-themes\.js/.test(manifest)) fail('manifest must include audio-themes.js');

if (/delete SONGS|SONGS\s*=\s*\{\s*\}/.test(audio)) fail('must not wipe classic SONGS table');

console.log('SMOKE_OK audio-themes: classic pack kept, jungle + fire-bamboo-boesa switch, persist + scenery hooks');
