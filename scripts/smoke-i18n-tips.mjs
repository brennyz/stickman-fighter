#!/usr/bin/env node
/** Static + source checks: training/adventure result tips never leak raw i18n keys. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

must(/function isRawI18nKey/.test(i18n), 'missing isRawI18nKey');
must(/function resolvedT/.test(i18n), 'missing resolvedT');
must(/isRawI18nKey\(tip\)/.test(ui), 'showResult must sanitize raw i18n tips');
must(/resolvedT\('combat\.trainLossTip'/.test(game), 'finishTraining must resolve combat.trainLossTip');
must(/resolvedT\('combat\.trainTipDefault'/.test(game), 'finishTraining must resolve combat.trainTipDefault');
must(/resolvedT\('combat\.trainLostTip'/.test(game), 'finishTraining must resolve combat.trainLostTip alias');

const keys = [
  'trainTipDefault',
  'trainLossTip',
  'trainLostTip',
];
for (const k of keys) {
  const nlHits = (catalog.match(new RegExp(`${k}:\\s+'[^']+'`, 'g')) || []).length;
  must(nlHits >= 2, `catalog missing nl+en strings for ${k} (found ${nlHits})`);
}

must(!/t\('combat\.trainTipDefault'\)/.test(game) || /resolvedT\('combat\.trainTipDefault'/.test(game),
  'raw t(combat.trainTipDefault) without resolvedT');

console.log('SMOKE_OK i18n result tips (no raw keys)');
