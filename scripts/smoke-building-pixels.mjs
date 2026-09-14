#!/usr/bin/env node
/**
 * Smoke: 5 factory pixel icons + HOME tile exist, IDs resolve, no Versus.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const FILES = [
  'assets/buttons/hub/buildings.svg',
  'assets/buildings/hub-buildings.svg',
  'assets/buildings/stick-lighter.svg',
  'assets/buildings/woodchip-glue.svg',
  'assets/buildings/chipping-wood.svg',
  'assets/buildings/bamboo-boesa-boiler.svg',
  'assets/buildings/echo-whistle-mill.svg',
  'assets/buildings/forge.svg',
  'assets/buildings/dojo.svg',
  'assets/buildings/garden.svg',
  'assets/buildings/tower.svg',
  'assets/buildings/shrine.svg',
  'assets/buildings/mill.svg',
  'assets/buildings/ranch.svg',
  'assets/buildings/foundry.svg',
  'assets/buildings/preview.html',
  'BUILDING-PIXEL-MAP.md',
];

const IDS = [
  'stick-lighter',
  'woodchip-glue',
  'chipping-wood',
  'bamboo-boesa-boiler',
  'echo-whistle-mill',
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
ok(data.includes("const BUILDING_PIXELS"), 'BUILDING_PIXELS');
ok(data.includes('window.__sfBuildingArt'), 'window hook');
for (const id of IDS) {
  ok(data.includes(`'${id}'`) || data.includes(`"${id}"`), `catalog ${id}`);
}

const map = read('BUILDING-PIXEL-MAP.md');
for (const id of IDS) ok(map.includes(id), `map ${id}`);

const ui = read('src/systems/missions.js');
ok(ui.includes('assets/buildings/'), 'hardenButtonIcons covers buildings/');

const sw = read('sw.js');
ok(sw.includes('assets/buttons/hub/buildings.svg'), 'sw hub icon');
ok(sw.includes('assets/buildings/stick-lighter.svg'), 'sw card icon');

const vs = read('src/systems/versus.js');
ok(vs.includes('VERSUS_RETIRED') || vs.includes('VS_ROSTER = []'), 'versus still retired');

const game = read('game.js');
ok(game.includes('function resolveBuildingId'), 'game.js has resolver');
ok(game.includes('stick-lighter'), 'game.js has stick-lighter');

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(data + '\nthis.__out = { resolveBuildingId, buildingArtSrc, buildingArtMeta, BUILDING_IDS };', ctx);
const api = ctx.__out;

ok(api.resolveBuildingId('stickLighter') === 'stick-lighter', 'alias stickLighter');
ok(api.resolveBuildingId('factory-woodchip-glue') === 'woodchip-glue', 'prefix factory-');
ok(api.resolveBuildingId('boesa') === 'bamboo-boesa-boiler', 'alias boesa');
ok(api.resolveBuildingId('whistleMill') === 'echo-whistle-mill', 'alias whistleMill');
ok(api.resolveBuildingId('forge') === 'stick-lighter', 'powers forge');
ok(api.resolveBuildingId('dojo') === 'chipping-wood', 'powers dojo');
ok(api.resolveBuildingId('garden') === 'bamboo-boesa-boiler', 'powers garden');
ok(api.resolveBuildingId('mill') === 'echo-whistle-mill', 'UI mill');
ok(api.resolveBuildingId('buildings') === 'buildings', 'hub id');
ok(api.buildingArtSrc('chipping-wood', 'card') === 'assets/buildings/chipping-wood.svg', 'card src');
ok(api.buildingArtSrc('buildings', 'stroke') === 'assets/buttons/hub/buildings.svg', 'hub stroke');
ok(api.BUILDING_IDS.length === 5, 'five factories');

if (failed) {
  console.error(`building-pixels smoke: ${failed} failure(s)`);
  process.exit(1);
}
console.log('building-pixels smoke: ok');
