#!/usr/bin/env node
/**
 * Playtest P1 (2026-09-14): landing hierarchy, combat copy, opener + train tip.
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

const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const fighter = fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const monsters = fs.readFileSync(path.join(root, 'src/data/monsters.js'), 'utf8');
const speel = fs.readFileSync(path.join(root, 'speel.html'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const built = fs.existsSync(path.join(root, 'game.js'))
  ? fs.readFileSync(path.join(root, 'game.js'), 'utf8')
  : '';

must(/trainLostTip:/.test(catalog), 'catalog missing combat.trainLostTip');
must(/trainLossTip:/.test(catalog), 'catalog missing combat.trainLossTip');
must(/energyNotFull:/.test(catalog), 'catalog missing combat.energyNotFull');
must(/function tOr\(/.test(i18n), 'i18n missing tOr fallback helper');
must(/save\.lang = 'nl'/.test(i18n), 'first-run language must default to NL');
must(/getLang\(\)[\s\S]*: 'nl'/.test(i18n), 'getLang fallback must be NL');

must(/tOr\('combat\.energyNotFull'/.test(fighter), 'energy gate must use localized copy');
must(/tOr\('combat\.protected'/.test(fighter), 'i-frames must say protected, not MISS');
must(!/Energy niet vol!/.test(fighter), 'hardcoded Energy niet vol! should be gone');
must(!/game\.floater\([^)]*'MISS!'/.test(fighter), 'hardcoded MISS! floater should be gone');
must(/trainWins >= 3 \? 0\.22/.test(fighter), 'training robot block rate should be gentler at first');
must(/game\.mode === 'training' && this\.isPlayer && game\.robot/.test(fighter), 'training attacks must face the robot');

must(/function meleeHitsTrainTarget\(/.test(fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8')),
  'training capsule hurtbox helper missing');
must(/meleeHitsTrainTarget\(hx, hy, r, tgt\)/.test(game), 'tryMelee must use training capsule vs robot');
must(/advLose: 'VERLOREN'/.test(catalog), 'NL lose title must not say VERSLAGEN');
const catalogEn = (catalog.split('const CATALOG_EN')[1] || '').split('const CATALOG_DE')[0] || '';
must(/advLose: 'YOU LOSE'/.test(catalogEn), 'EN lose title must be YOU LOSE');
must(!/advLose: 'VERLOREN'/.test(catalogEn), 'EN lose title must not stay Dutch VERLOREN');
must(!/advLose: 'YOU LOST/.test(catalog), 'YOU LOST leftover in result.advLose');
must(!/advLose: 'DEFEATED/.test(catalog), 'DEFEATED leftover in result.advLose');
must(/lost: 'VERLOREN'/.test(catalog), 'NL banner.lost must say VERLOREN');
must(/lost: 'YOU LOSE'/.test(catalog), 'EN banner.lost must be YOU LOSE');
must(!/lost: 'YOU LOST/.test(catalog), 'YOU LOST leftover in banner.lost');

must(/tOr\('combat\.trainLostTip'/.test(game), 'finishTraining must resolve combat.trainLostTip');
must(/opener \? 1 :/.test(game), 'level 1-2 wave 1 spawn must be single-file');
must(/this\.player\.energy = 45/.test(game), 'opener should start with readable energy');
must(/invulnT = Math\.max\(this\.player\.invulnT \|\| 0, 1\.35\)/.test(game), 'early adventure spawn grace missing');
must(/satanPending && !this\.satanActive/.test(game) || /!this\.satanPending && !this\.satanActive/.test(game),
  'opener grace must skip Satan');

must(/n === 1 \? 2 : 3/.test(monsters), 'level 1 wave 1 must cap at 2 enemies');
must(/waves\[1\]\.slice\(0, 4\)/.test(monsters), 'level 1 wave 2 must cap at 4 enemies');

must(/id="installFold"/.test(speel), 'landing install fold missing');
must(/id="btnPlay"/.test(speel), 'landing SPELEN id missing');
must(speel.indexOf('id="btnPlay"') < speel.indexOf('id="installFold"'), 'SPELEN must lead landing');
must(/Android-first/.test(speel), 'landing must pick one install platform (Android-first)');
must(!/getElementById\('stepsIos'\)\.classList\.remove/.test(speel), 'must never unhide iPad install from JS');
must(/class="qrbox hide"/.test(speel), 'QR must start hidden (Android never sees iPad QR first)');
must(/hub-tile-adventure/.test(index) && /hub-tile-featured/.test(index), 'Avontuur should be featured primary');

if (built) {
  must(/trainLostTip/.test(built), 'built game.js missing trainLostTip');
  must(/function tOr\(/.test(built), 'built game.js missing tOr');
}

console.log('SMOKE_OK playtest-p1');
