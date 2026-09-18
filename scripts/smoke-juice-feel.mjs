#!/usr/bin/env node
/**
 * Post mega-merge juice: one toast + exit, HOME ready/empty,
 * gear empty CTA, FOMO sheet, pickup/equip haptic. No Versus.
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

const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const buildings = fs.readFileSync(path.join(root, 'src/ui/buildings-ui.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const monster = fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8');

must(/_toastEls\.length >= 1/.test(ui), 'toast queue must show one at a time');
must(/_toastEls\.length < 1/.test(ui), 'toast flush must wait for the visible toast');
must(/toast-out/.test(ui) && /@keyframes toastOut/.test(css), 'toast exit animation missing');
must(/showFomoRitual\(force\)[\s\S]{0,400}clearToasts\(/.test(ui), 'FOMO sheet must clear stacked toasts');
must(/is-open/.test(ui) && /fomoSheetIn/.test(css), 'FOMO sheet enter missing');
must(/syncHubJuiceTiles/.test(ui), 'HOME juice tile sync missing');
must(/hub-tile-ready/.test(ui) && /hub-tile-empty/.test(ui), 'HOME ready/empty classes missing');
must(/@keyframes hubReadyPulse/.test(css), 'HOME ready pulse CSS missing');
must(/juiceGearNeedsAdventure/.test(ui) && /juice-empty-owned/.test(ui), 'gear starter-only Adventure banner missing');
must(/juicePetsNeedTame/.test(ui) && /juiceDexNeedDiscover/.test(ui), 'pets/book empty helpers missing');
must(/pets\.emptyOwned/.test(ui) && /dex\.emptyOwned/.test(ui), 'pets/book empty CTA missing');
must(/btnPets[\s\S]{0,400}hub-tile-empty/.test(ui) && /btnDex[\s\S]{0,400}hub-tile-empty/.test(ui), 'HOME pets/book empty tiles missing');
must(/combat\.ko/.test(game), 'kill pop must be one KO confirm');
must(!/`\+\$\{xp\} XP`/.test(game), 'kill must not stack +XP floater on KO');
must(/_hitConfirmAt/.test(storage), 'hit confirm must rate-limit');
must(/if \(motionReduced\(\)\) return;/.test(storage) && /_hitConfirmAt/.test(storage), 'hit confirm must skip pulse under reduced-motion');
must(/if \(!motionReduced\(\)\) c\.scale/.test(monster), 'monster death squash must skip under reduced-motion');
must(/body\.reduced-motion \.toast-out/.test(css) && /body\.reduced-motion \.hub-tile\.hub-tile-empty/.test(css), 'reduced-motion must skip juice pulses, keep empty clarity');
must(/petsSubEmpty:/.test(i18n) && /dexSubEmpty:/.test(i18n), 'HOME pets/book empty copy missing');
must(/applyLangStaticScreens[\s\S]*syncHubJuiceTiles/.test(i18n), 'i18n must keep HOME empty-gear subtitle');
must(/gear-empty-cta/.test(css), 'gear empty CTA style missing');
must(/juice-flash/.test(ui) && /gearDollFlash/.test(css), 'equip doll flash missing');
must(/applyHitConfirmFx\(this, p\.x/.test(game), 'gear pickup hit-confirm missing');
must(/haptic\(14\)/.test(game) && /pickupGear/.test(game), 'gear pickup haptic missing');
must(/haptic\(10\)/.test(buildings), 'buildings collect haptic missing');
must(/menu\.collectSub/.test(i18n) && /Uitrusting · wapens · boek/.test(i18n), 'HOME Collectie must mention gear');
must(!/data-hub="versus"/.test(html), 'versus hub tile must stay retired');
must(!/\.screen\s*\{\s*display:\s*none\s*!important/.test(css), 'nuclear .screen hide forbidden');

const built = fs.existsSync(path.join(root, 'game.js'))
  ? fs.readFileSync(path.join(root, 'game.js'), 'utf8')
  : '';
if (built) {
  must(/syncHubJuiceTiles/.test(built), 'built game.js missing HOME juice sync');
  must(/toast-out/.test(built), 'built game.js missing toast-out');
  must(/juicePetsNeedTame/.test(built) && /combat\.ko/.test(built), 'built game.js missing pets empty / KO');
}

console.log('SMOKE_OK juice-feel');
