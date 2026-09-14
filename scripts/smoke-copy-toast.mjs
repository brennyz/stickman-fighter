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
if (!/const CATALOG_EN = \{[\s\S]*?advLose: 'VERLOREN'/.test(catalog)) fail('EN result.advLose must be VERLOREN (no YOU LOST / DEFEATED)');
if (/advLose: 'YOU LOST/.test(catalog)) fail('YOU LOST leftover in result.advLose');
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
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const nlBlock = i18n.split(/\n  en: \{/)[0] || '';
if (!/trainLose: 'ROBOT WINT\.\.\.'/.test(nlBlock)) fail('NL result.trainLose must be ROBOT WINT (not ROBOT WINS)');
if (/trainLose: 'ROBOT WINS/.test(nlBlock)) fail('NL UI still has ROBOT WINS');
if (!/tOr\(titleKey, titleFallback\)/.test(ui)) fail('showResult must not reuse stale EN lose titles');
if (!/detailKey/.test(game)) fail('result detail must store i18n keys for lang switch');
if (!/combat\.streak3/.test(game)) fail('combat streak shouts must follow language');
if (!/hubStatStyle/.test(ui) && !/hubStatOutfits/.test(ui)) fail('Arcade/collect hub stats must use i18n (no hardcoded outfits)');
if (!/hub\.statTrain/.test(ui) && !/hubStatArcadeTrain/.test(ui)) fail('HOME arcade tile stats must follow language');

console.log('SMOKE_OK copy-toast: VERLOREN keep-loot · no sticky lose toasts · train again i18n');
