#!/usr/bin/env node
/**
 * Start-screen copy: no leftover “MONSTER ARENA” / debug captions.
 * Tiles + SPELEN stay — those are how a new player understands the game.
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
if (!/id="sfTitleStart"/.test(html) || !/SPELEN/.test(html)) fail('SPELEN gate missing');
if (!/id="sfTitleStart"[^>]*hub-tile|hub-tile[^>]*id="sfTitleStart"/.test(html)) fail('SPELEN must match HOME hub-tile style');
if (/id="sfTitleName"/.test(html)) fail('optional name field should be off the title gate');

const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
if (/splash2: 'Arena/.test(i18n) || /splash2: 'Arène/.test(i18n)) fail('i18n splash still says Arena');
if (/splash1: 'Pixelmap/.test(i18n) || /splash1: 'Pixel map/.test(i18n)) fail('i18n splash still says Pixelmap');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
if (/Monster Arena/i.test(manifest.name || '')) fail('manifest name still Monster Arena');

console.log('SMOKE_OK start-copy: no MONSTER ARENA / insert-coin / path-kicker; SPELEN + Avontuur remain');
