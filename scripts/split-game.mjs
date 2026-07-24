#!/usr/bin/env node
/** Re-split root game.js into src/ modules (section markers). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'game.js');
const text = fs.readFileSync(srcPath, 'utf8');
const lines = text.split(/\n/);

const markerRe = /^\/\* =+ (.+?) =+ \*\/\s*$/;
const markers = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(markerRe);
  if (m) markers.push({ i, name: m[1] });
}

const MAP = {
  prelude: 'src/00-prelude.js',
  OPSLAG: 'src/core/storage.js',
  'IN-GAME ART HELPERS (art-upgrade 3/4)': 'src/render/art-helpers.js',
  'DAGELIJKSE MISSIES & PRESTATIES': 'src/systems/missions.js',
  RARITEITEN: 'src/data/rarities.js',
  WAPENS: 'src/data/weapons.js',
  SUMMONS: 'src/data/summons.js',
  STIJLEN: 'src/data/styles.js',
  'VERSUS / 2 SPELERS': 'src/systems/versus.js',
  MONSTERS: 'src/data/monsters.js',
  AUDIO: 'src/systems/audio.js',
  INPUT: 'src/systems/input.js',
  CANVAS: 'src/core/canvas.js',
  TEKENHULPEN: 'src/render/draw-helpers.js',
  VECHTER: 'src/entities/fighter.js',
  MONSTER: 'src/entities/monster.js',
  'SCENERY ART — pixel-art lagen (upgrade 1/4)': 'src/render/scenery.js',
  ACHTERGRONDEN: 'src/render/backgrounds.js',
  GAME: 'src/game/game.js',
  UI: 'src/ui/ui.js',
  SPELSTART: 'src/boot/start.js',
  HOOFDLUS: 'src/boot/loop.js',
};

const chunks = [];
if (markers.length) chunks.push({ name: 'prelude', start: 0, end: markers[0].i });
for (let j = 0; j < markers.length; j++) {
  chunks.push({
    name: markers[j].name,
    start: markers[j].i,
    end: j + 1 < markers.length ? markers[j + 1].i : lines.length,
  });
}

const manifest = [];
for (const { name, start, end } of chunks) {
  const rel = MAP[name];
  if (!rel) {
    console.error('split: unmapped section', name);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  const body = lines.slice(start, end).join('\n') + '\n';
  fs.writeFileSync(path.join(root, rel), body);
  manifest.push(rel);
  console.log(String(end - start).padStart(5), rel);
}

fs.writeFileSync(path.join(root, 'src', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('SPLIT_OK', manifest.length, 'modules');
