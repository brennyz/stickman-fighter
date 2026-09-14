#!/usr/bin/env node
/**
 * Buildings HOME tile + list/detail screen (batch 2 of 4).
 * No Versus. Stub API allowed until systems PR merges.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8');
const bridge = fs.readFileSync(path.join(root, 'src/systems/buildings-bridge.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/buildings-ui.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const coreUi = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');

must(/data-hub="buildings"/.test(html), 'HOME missing data-hub=buildings tile');
must(/hub-tile-buildings/.test(html), 'HOME buildings tile must use hub-tile-buildings');
must(/id="btnBuildings"/.test(html), 'missing #btnBuildings');
must(/id="buildingsScreen"/.test(html), 'missing #buildingsScreen');
must(/id="buildingsList"/.test(html), 'missing #buildingsList');
must(/id="buildingsDetail"/.test(html), 'missing #buildingsDetail');
must(/id="buildingsApiNote"/.test(html), 'missing stub/live API note');
must(/assets\/buttons\/hub\/buildings\.svg/.test(html), 'hub buildings.svg not wired');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');

must(/hub-tile-buildings/.test(css), 'missing .hub-tile-buildings style');
must(/#buildingsScreen/.test(css), 'missing #buildingsScreen CSS');
must(/buildings-cta/.test(css), 'missing collect/upgrade CTA CSS');
must(!/\.screen\s*\{\s*display:\s*none\s*!important/.test(css), 'nuclear .screen hide forbidden');

must(bridge.includes('BuildingsStub'), 'bridge must ship a stub');
must(bridge.includes('buildingsHasSystemsApi'), 'bridge must detect partner systems API');
must(bridge.includes("sf-buildings-stub-v1"), 'stub must use its own localStorage key');
for (const id of ['mill', 'forge', 'ranch', 'shrine', 'foundry']) {
  must(bridge.includes("'" + id + "'") || bridge.includes('"' + id + '"'), 'factory id missing: ' + id);
  const rel = 'assets/buildings/' + id + '.svg';
  must(fs.existsSync(path.join(root, rel)), 'missing ' + rel);
  must(sw.includes('./' + rel) || sw.includes(rel), 'sw.js missing ' + rel);
}

must(ui.includes('openBuildings') && ui.includes('renderBuildings'), 'buildings-ui missing open/render');
must(ui.includes('doBuildingCollect') && ui.includes('doBuildingUpgrade'), 'missing collect/upgrade CTAs');
must(start.includes("hub === 'buildings'"), 'start.js must route buildings hub tile');
must(coreUi.includes("'buildingsScreen'"), 'UI.screens must include buildingsScreen');
must(/case 'buildings'/.test(coreUi), 'hubTileStatLine must handle buildings');

must(/menu\.buildings/.test(i18n), 'i18n missing menu.buildings');
must(/buildings:\s*\{/.test(i18n), 'i18n missing buildings namespace');
must(manifest.includes('src/systems/buildings-bridge.js'), 'manifest missing buildings-bridge');
must(manifest.includes('src/ui/buildings-ui.js'), 'manifest missing buildings-ui');
must(sw.includes('./assets/buttons/hub/buildings.svg'), 'sw.js missing hub buildings.svg');

must(fs.existsSync(path.join(root, 'docs/BUILDINGS-UI.md')), 'missing docs/BUILDINGS-UI.md');
must(/No Versus/.test(fs.readFileSync(path.join(root, 'docs/BUILDINGS-UI.md'), 'utf8')),
  'docs must keep Versus retired');

console.log('SMOKE_OK buildings-ui: HOME tile + list/detail + stub API');
