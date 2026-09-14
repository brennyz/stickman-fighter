#!/usr/bin/env node
/**
 * Smoke: locked factory ids + HOME tile exist, IDs resolve, no Versus.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const LOCKED = [
  'stick_lighter',
  'woodchip_glue',
  'chipping_wood',
  'bamboo_boesa_boiler',
  'echo_whistle_mill',
];

const FILES = [
  'assets/buttons/hub/buildings.svg',
  'assets/buildings/hub-buildings.svg',
  'assets/buildings/stick_lighter.svg',
  'assets/buildings/woodchip_glue.svg',
  'assets/buildings/chipping_wood.svg',
  'assets/buildings/bamboo_boesa_boiler.svg',
  'assets/buildings/echo_whistle_mill.svg',
  'assets/buildings/stick-lighter.svg',
  'assets/buttons/modes/buildings-stick-lighter.svg',
  'assets/buttons/modes/buildings-woodchip-glue.svg',
  'assets/buttons/modes/buildings-chipping-wood.svg',
  'assets/buttons/modes/buildings-bamboo-boesa.svg',
  'assets/buttons/modes/buildings-echo-whistle.svg',
  'assets/buildings/preview.html',
  'BUILDING-PIXEL-MAP.md',
];

let failed = 0;
function ok(cond, label) {
  if (!cond) {
    console.error('FAIL', label);
    failed++;
  } else {
    console.log('OK', label);
  }
}

for (const rel of FILES) {
  const abs = path.join(root, rel);
  ok(fs.existsSync(abs), `exists ${rel}`);
  if (rel.endsWith('.svg') && fs.existsSync(abs)) {
    const svg = fs.readFileSync(abs, 'utf8');
    ok(svg.includes('<svg'), `svg tag ${rel}`);
    ok(!/[\u{1F300}-\u{1FAFF}]/u.test(svg), `no emoji ${rel}`);
    const kb = Buffer.byteLength(svg) / 1024;
    ok(kb < 6, `small ${rel} (${kb.toFixed(2)} KB)`);
  }
}

const data = read('src/data/building-pixels.js');
ok(data.includes('const BUILDING_PIXELS'), 'BUILDING_PIXELS');
ok(data.includes('window.__sfBuildingArt'), 'window hook');
ok(/quirky factories — NOT generic/.test(data), 'locked comment');
for (const id of LOCKED) {
  ok(data.includes(`'${id}'`) || data.includes(`${id}:`), `catalog ${id}`);
}

const map = read('BUILDING-PIXEL-MAP.md');
for (const id of LOCKED) ok(map.includes('`' + id + '`'), `map ${id}`);
ok(map.includes('not generic sawmill/forge'), 'map rejects generic names');

const ui = read('src/systems/missions.js');
ok(ui.includes('assets/buildings/'), 'hardenButtonIcons covers buildings/');

const sw = read('sw.js');
ok(sw.includes('assets/buttons/hub/buildings.svg'), 'sw hub icon');
ok(sw.includes('assets/buildings/stick_lighter.svg'), 'sw locked card');
ok(sw.includes('assets/buttons/modes/buildings-stick-lighter.svg'), 'sw artHint stroke');

const vs = read('src/systems/versus.js');
ok(vs.includes('VERSUS_RETIRED') || vs.includes('VS_ROSTER = []'), 'versus still retired');

const game = read('game.js');
ok(game.includes('function resolveBuildingId'), 'game.js has resolver');
ok(game.includes('stick_lighter'), 'game.js has stick_lighter');

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(data + '\nthis.__out = { resolveBuildingId, buildingArtSrc, buildingArtMeta, BUILDING_IDS };', ctx);
const api = ctx.__out;

ok(JSON.stringify(api.BUILDING_IDS) === JSON.stringify(LOCKED), 'BUILDING_IDS locked order');
ok(api.resolveBuildingId('stick_lighter') === 'stick_lighter', 'exact snake');
ok(api.resolveBuildingId('stick-lighter') === 'stick_lighter', 'kebab → snake');
ok(api.resolveBuildingId('stickLighter') === 'stick_lighter', 'camel → snake');
ok(api.resolveBuildingId('factory_woodchip_glue') === 'woodchip_glue', 'prefix factory_');
ok(api.resolveBuildingId('boesa') === 'bamboo_boesa_boiler', 'alias boesa');
ok(api.resolveBuildingId('whistleMill') === 'echo_whistle_mill', 'alias whistleMill');
ok(api.resolveBuildingId('forge') === 'stick_lighter', 'compat forge → stick_lighter');
ok(api.buildingArtSrc('chipping_wood', 'card') === 'assets/buildings/chipping_wood.svg', 'card src');
ok(api.buildingArtSrc('stick_lighter', 'icon') === 'assets/buttons/modes/buildings-stick-lighter.svg', 'artHint icon');
ok(api.buildingArtSrc('buildings', 'stroke') === 'assets/buttons/hub/buildings.svg', 'hub stroke');
ok(api.buildingArtMeta('echo_whistle_mill').name === 'Echo-Whistle Mill', 'locked display name');

if (failed) {
  console.error(`building-pixels smoke: ${failed} failure(s)`);
  process.exit(1);
}
console.log('building-pixels smoke: ok');
