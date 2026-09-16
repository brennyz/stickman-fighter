#!/usr/bin/env node
/**
 * Smoke: locked factory ids match systems #292, files exist, no Versus.
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
  'bamboo_boesa',
  'echo_whistle',
];

const FORBIDDEN_CANON = [
  'bamboo_boesa_boiler',
  'echo_whistle_mill',
  'sawmill',
  'forge',
  'shrine',
];

const FILES = [
  'assets/buttons/hub/buildings.svg',
  'assets/buildings/hub-buildings.svg',
  'assets/buildings/stick_lighter.svg',
  'assets/buildings/woodchip_glue.svg',
  'assets/buildings/chipping_wood.svg',
  'assets/buildings/bamboo_boesa.svg',
  'assets/buildings/echo_whistle.svg',
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
    const cap = rel.startsWith('assets/buildings/') ? 8 : 6;
    ok(kb < cap, `small ${rel} (${kb.toFixed(2)} KB)`);
  }
}

const data = read('src/data/building-pixels.js');
ok(data.includes('const BUILDING_PIXELS'), 'BUILDING_PIXELS');
ok(data.includes('window.__sfBuildingArt'), 'window hook');
for (const id of LOCKED) {
  ok(data.includes(`'${id}'`) || data.includes(`${id}:`), `catalog ${id}`);
}

const LIFE = {
  stick_lighter: 'flicker',
  woodchip_glue: 'glow',
  chipping_wood: 'spin',
  bamboo_boesa: 'steam',
  echo_whistle: 'echo',
};
for (const [id, cls] of Object.entries(LIFE)) {
  const svg = read(`assets/buildings/${id}.svg`);
  ok(svg.includes('prefers-reduced-motion'), `motion reduce ${id}`);
  ok(svg.includes(`class="${cls}"`) || svg.includes(`class='${cls}'`) || svg.includes(`class="${cls} `), `life ${cls} ${id}`);
}
ok(read('assets/buildings/hub-buildings.svg').includes('prefers-reduced-motion'), 'hub motion reduce');
ok(read('assets/buttons/hub/buildings.svg').includes('prefers-reduced-motion'), 'stroke hub motion');

const map = read('BUILDING-PIXEL-MAP.md');
for (const id of LOCKED) ok(map.includes('`' + id + '`'), `map ${id}`);
ok(map.includes('#292'), 'map cites systems #292');
ok(map.includes('Motion (factory life)'), 'map documents motion');

const ui = read('src/systems/missions.js');
ok(ui.includes('assets/buildings/'), 'hardenButtonIcons covers buildings/');

const sw = read('sw.js');
ok(sw.includes('assets/buttons/hub/buildings.svg'), 'sw hub icon');
ok(sw.includes('assets/buildings/bamboo_boesa.svg'), 'sw bamboo_boesa');
ok(sw.includes('assets/buildings/echo_whistle.svg'), 'sw echo_whistle');
ok(sw.includes('assets/buttons/modes/buildings-echo-whistle.svg'), 'sw artHint stroke');

const vs = read('src/systems/versus.js');
ok(vs.includes('VERSUS_RETIRED') || vs.includes('VS_ROSTER = []'), 'versus still retired');

const game = read('game.js');
ok(game.includes('function resolveBuildingId'), 'game.js has resolver');
ok(game.includes('bamboo_boesa'), 'game.js has bamboo_boesa');
ok(game.includes('echo_whistle'), 'game.js has echo_whistle');

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(data + '\nthis.__out = { resolveBuildingId, buildingArtSrc, buildingArtMeta, BUILDING_IDS };', ctx);
const api = ctx.__out;

ok(JSON.stringify(api.BUILDING_IDS) === JSON.stringify(LOCKED), 'BUILDING_IDS exact #292');
for (const bad of FORBIDDEN_CANON) {
  ok(!api.BUILDING_IDS.includes(bad), 'canon forbids ' + bad);
}
ok(api.resolveBuildingId('stick_lighter') === 'stick_lighter', 'exact snake');
ok(api.resolveBuildingId('bamboo_boesa') === 'bamboo_boesa', 'bamboo_boesa locked');
ok(api.resolveBuildingId('echo_whistle') === 'echo_whistle', 'echo_whistle locked');
ok(api.resolveBuildingId('bamboo_boesa_boiler') === 'bamboo_boesa', 'alias boiler → bamboo_boesa');
ok(api.resolveBuildingId('echo_whistle_mill') === 'echo_whistle', 'alias mill → echo_whistle');
ok(api.resolveBuildingId('bamboo-boesa') === 'bamboo_boesa', 'kebab bamboo-boesa');
ok(api.resolveBuildingId('echoWhistle') === 'echo_whistle', 'camel echoWhistle');
ok(api.buildingArtSrc('bamboo_boesa') === 'assets/buildings/bamboo_boesa.svg', 'bamboo card');
ok(api.buildingArtSrc('echo_whistle') === 'assets/buildings/echo_whistle.svg', 'echo card');
ok(api.buildingArtSrc('echo_whistle', 'icon') === 'assets/buttons/modes/buildings-echo-whistle.svg', 'artHint icon');
ok(api.buildingArtMeta('bamboo_boesa').id === 'bamboo_boesa', 'meta id');

if (failed) {
  console.error(`building-pixels smoke: ${failed} failure(s)`);
  process.exit(1);
}
console.log('building-pixels smoke: ok');
