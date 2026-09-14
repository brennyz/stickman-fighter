#!/usr/bin/env node
/**
 * EN-NL / VERLOREN / sticky toast (not unify — that is #266).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');

if (!/advLose: 'VERLOREN'/.test(catalog)) fail('NL result.advLose must stay VERLOREN');
if (!/advLose: 'YOU LOST\.\.\.'/.test(catalog)) fail('EN result.advLose must stay YOU LOST... (no DEFEATED)');
if (/advLose: 'DEFEATED/.test(catalog)) fail('DEFEATED leftover in result.advLose');
if (!/advLoseKeep: 'XP en loot van deze run blijven'/.test(catalog)) fail('NL keep-loot line missing');
if (!/advLoseKeep: 'XP and loot from this run stay'/.test(catalog)) fail('EN keep-loot line missing');
if (!/result\.advLoseKeep/.test(game)) fail('adventure lose detail must mention keep-loot');

if (/toast\.masterBuffGain/.test(game) && /toast\.satanHeatDanger/.test(game)) {
  fail('lose-path still schedules sticky heat/master toasts on VERLOREN');
}
if (!/clearToasts\(\)/.test(start)) fail('startGame must clear leftover toasts');
if (!/clearToasts\(\)/.test(ui)) fail('UI.showResult / play must clear leftover toasts');
if (/<small>vs RabbitRobot<\/small>/.test(ui)) fail('training again-sub still hardcoded (EN-NL mix)');
if (!/result\.trainAgainSub/.test(ui)) fail('training again-sub must use i18n');
if (!/result\.wavesStart/.test(game)) fail('lose-tip wave fallback must be i18n (no hardcoded start)');
if (!/this\.clearToasts\(\)/.test(ui)) fail('UI.showResult / play must call this.clearToasts');

console.log('SMOKE_OK copy-toast: VERLOREN keep-loot · no sticky lose toasts · train again i18n');
