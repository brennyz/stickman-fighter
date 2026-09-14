#!/usr/bin/env node
/**
 * Start-screen copy: no leftover “MONSTER ARENA” / debug captions.
 * SPELEN-first — optional name field stays off the title gate.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const scenery = fs.readFileSync(path.join(root, 'src/render/scenery.js'), 'utf8');
if (/fillText\(\s*['"]MONSTER ARENA['"]/.test(scenery)) fail('scenery.js still paints MONSTER ARENA');

const loop = fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8');
if (/caption:\s*true/.test(loop)) fail('menu vistas still pass caption:true (debug 1/4 labels)');
if (!/caption:\s*false/.test(loop)) fail('menu vistas must pass caption:false');
if (/splash2',\s*'Arena/.test(loop)) fail('splash fallback still says Arena');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const title = /<title>([^<]*)<\/title>/.exec(html);
if (!title) fail('missing <title>');
if (/Monster Arena/i.test(title[1])) fail('index.html title still says Monster Arena');
if (!/id="pressStartLine"[^>]*\bhidden\b/.test(html)) fail('insert-coin line must stay hidden');
if (!/id="menuArcadePre"[^>]*\bhidden\b/.test(html)) fail('KIES JE PAD kicker must stay hidden');
if (!/id="btnAdventure"/.test(html) || !/Avontuur/.test(html)) fail('Avontuur tile missing — players need a way in');
if (!/id="btnUpgradesHome"/.test(html)) fail('Upgrades HOME tile missing on start');
if (/id="btnInstallLabel">Zet in app-lade/.test(html)) fail('install label still uses cluttery app-lade copy');
if (!/id="sfTitleStart"/.test(html) || !/SPELEN/.test(html)) fail('SPELEN gate missing');
if (/id="sfTitleName"/.test(html)) fail('optional name field must stay off the title gate');
if (!/id="sfTitleNote"/.test(html)) fail('quiet save-on-phone note missing');
if (html.indexOf('id="sfTitleStart"') > html.indexOf('id="sfTitleNote"')) {
  fail('SPELEN must sit above the quiet note');
}

const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
if (/splash2: 'Arena/.test(i18n) || /splash2: 'Arène/.test(i18n)) fail('i18n splash still says Arena');
if (/splash1: 'Pixelmap/.test(i18n) || /splash1: 'Pixel map/.test(i18n)) fail('i18n splash still says Pixelmap');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
if (/Monster Arena/i.test(manifest.name || '')) fail('manifest name still Monster Arena');

const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
if (/verLine\.textContent = 'v' \+ APP_VERSION \+ ' · arcade/.test(ui)) {
  fail('menu version line still advertises arcade · SW');
}

console.log('SMOKE_OK start-copy: no MONSTER ARENA / name field / insert-coin; SPELEN + Avontuur remain');
