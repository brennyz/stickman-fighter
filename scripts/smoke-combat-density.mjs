#!/usr/bin/env node
/**
 * Mobile combat density — phone must get fewer simultaneous threats than desktop,
 * desktop cadence/counts must stay at the legacy 1.0 profile, Versus stays out.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg, extra) {
  console.error('SMOKE_FAIL', msg);
  if (extra !== undefined) console.error(extra);
  process.exit(1);
}

function must(cond, msg, extra) {
  if (!cond) fail(msg, extra);
}

const densSrc = fs.readFileSync(path.join(root, 'src/systems/combat-density.js'), 'utf8');
const monstersSrc = fs.readFileSync(path.join(root, 'src/data/monsters.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const versusSrc = fs.readFileSync(path.join(root, 'src/systems/versus.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
const built = fs.existsSync(path.join(root, 'game.js'))
  ? fs.readFileSync(path.join(root, 'game.js'), 'utf8')
  : '';

must(fs.existsSync(path.join(root, 'scripts/smoke-lose-retry.mjs')), 'smoke-lose-retry.mjs missing');
must(manifest.includes('src/systems/combat-density.js'), 'manifest missing combat-density.js');
must(/function combatDensityProfile\(/.test(densSrc), 'combatDensityProfile missing');
must(/function adventureSpawnCadence\(/.test(densSrc), 'adventureSpawnCadence missing');
must(/function combatSmoothOpenInterval\(/.test(densSrc), 'combatSmoothOpenInterval missing');
must(/function combatWaveGapSec\(/.test(densSrc), 'combatWaveGapSec missing');
must(/function combatPreferStrike\(/.test(densSrc), 'combatPreferStrike missing');
must(/function combatCadenceBand\(/.test(densSrc), 'combatCadenceBand missing');
must(/COMBAT_TAB_OPEN_MIN = 0\.66/.test(densSrc), 'tablet opener band missing');
must(/function scaleAdventurePerWave\(/.test(densSrc), 'scaleAdventurePerWave missing');
must(/COMBAT_DENSITY_MIN = 0\.50/.test(densSrc), 'phone floor must stay 0.50 (still a horde)');
must(/function combatLoseResultMs\(/.test(densSrc), 'combatLoseResultMs missing');
must(/function notePlayerFailTele\(/.test(densSrc), 'notePlayerFailTele missing');
must(/function combatFailRetryTip\(/.test(densSrc), 'combatFailRetryTip missing');
must(/COMBAT_DENSITY_WIDE_W = 960/.test(densSrc), 'wide-screen lock missing');
must(/Versus/.test(densSrc) && /untouched/.test(densSrc), 'density module must document Versus-out');

must(/combatDensityProfile\(/.test(monstersSrc), 'buildLevel must read combatDensityProfile');
must(/scaleAdventurePerWave\(/.test(monstersSrc), 'buildLevel must scale per-wave counts');
must(/scaleAdventureHordePad\(/.test(monstersSrc), 'buildLevel must scale boss horde pad');
must(/n === 1 \? 2 : 3/.test(monstersSrc), 'level 1 wave 1 soft-cap (2) must stay');
must(/waves\[1\]\.slice\(0, 4\)/.test(monstersSrc), 'level 1 wave 2 soft-cap (4) must stay');

must(/applyCombatTelegraphWind\(/.test(fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8')),
  'monster winds must use applyCombatTelegraphWind');
must(/combatIntroHolds\(/.test(fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8')),
  'compact intro must hold aggression');
must(/combatJoySwipeAccepts\(/.test(fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8')),
  'compact joy swipe pad missing');
must(/combatJumpSlopExtra\(/.test(fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8')),
  'compact jump slop missing');
must(/combatFitBossSize\(/.test(fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8')),
  'colossal spawn must fit radius via combatFitBossSize');
must(/combatColossalSizeMul\(/.test(fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8')),
  'colossal spawn must use viewport size mul');
must(/refreshAdventureBossScale\(/.test(fs.readFileSync(path.join(root, 'src/core/canvas.js'), 'utf8')),
  'resize must refit adventure colossal radius');
must(/combatEnrageWalkMul\(/.test(fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8')),
  'enrage walk must use combatEnrageWalkMul');
must(/combatSpreadPickupX\(/.test(fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8')),
  'spawnPickup must fan compact floor loot');
must(/adventureTelegraphHuds\(/.test(fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8')),
  'HUD must collect all telegraph cues');
must(/combatPickTelegraphHuds\(/.test(fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8')),
  'HUD must pick soonest cues, not break on first');
must(/combatFlyerHover\(/.test(fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8')),
  'flyers must use combatFlyerHover');
must(/combatMeleeAimLift\(/.test(fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8')),
  'melee aim-up must use combatMeleeAimLift');
must(/combatPartGateWalkSec\(/.test(fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8')),
  'part-gate hold must use combatPartGateWalkSec');
must(/combatSmoothOpenInterval\(/.test(gameSrc), 'nextWave / spawn must clamp compact opener');
must(/combatOpenerHold\(/.test(gameSrc), 'initAdventure must use compact opener hold');
must(/combatSpawnEdgeX\(/.test(gameSrc), 'spawn must use combatSpawnEdgeX');
must(/combatWaveGapSec\(/.test(gameSrc), 'between-wave pause must use combatWaveGapSec');
must(/combatLoseResultMs\(/.test(gameSrc), 'lose result delay must use combatLoseResultMs');
must(/resultShowDelayMs\(win, 'adventure'\)/.test(gameSrc), 'win/lose delay defers to #323 resultShowDelayMs');
must(!/scheduleGameResult\(this, win \? 1600 : 1400/.test(gameSrc), 'lose delay no longer hard 1400');
must(/restartAdventureInstant/.test(fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8')),
  'resAgain lose must call restartAdventureInstant');
must(/function restartAdventureInstant\(/.test(fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8')),
  'restartAdventureInstant helper missing');
must(/notePlayerFailTele/.test(fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8')),
  'player hurt must note fail telegraph');
must(/againRetry/.test(fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8')),
  'showResult must label Nog één keer on adventure lose');
must(/lose-retry/.test(fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8')),
  'showResult must mark lose-retry for the big CTA');
must(/lose-retry/.test(fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8')),
  'result CSS must fatten adventure lose retry');
must(!/function showResult\(/.test(gameSrc), 'showResult stays in ui.js');
must(/combatPreferStrike\(/.test(fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8')),
  'onDown must prefer punch/kick near the joy pad');
must(/claimTouchStrike\(/.test(fs.readFileSync(path.join(root, 'src/systems/input.js'), 'utf8')),
  'claimTouchStrike helper missing');
must(!/if \(advTele\) break/.test(fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8')),
  'HUD must not break on the first telegraph');
must(!/applyCombatTelegraphWind/.test(versusSrc), 'versus.js must not use telegraph density');

must(/opener \? 1 :/.test(gameSrc), 'opener must stay single-file');
must(/adventureMaxAliveNow\(/.test(gameSrc), 'spawn loop must use live alive cap');
must(/adventureSpawnCadence\(/.test(gameSrc), 'spawn loop must use density cadence');
must(/dens && dens\.gapPx/.test(gameSrc) || /gapPx/.test(gameSrc), 'spawn loop must use density gap');

must(!/combatDensity/.test(versusSrc), 'versus.js must not call combat density');
must(!/adventureMaxAliveNow/.test(versusSrc), 'versus.js must not use adventure alive cap');
must(!/scaleAdventurePerWave/.test(versusSrc), 'versus.js must not scale adventure waves');

if (built) {
  must(/function combatDensityProfile\(/.test(built), 'built game.js missing combatDensityProfile');
  must(/__sf[\s\S]*combatDensity/.test(built), 'built game.js must expose __sf.combatDensity');
}

/* ---- isolated profile math ---- */
const iso = {
  IS_TOUCH: false,
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  W: 1280,
  H: 800,
  innerWidth: 1280,
  innerHeight: 800,
};
vm.runInNewContext(densSrc, iso);

const VIEWPORTS = [
  { id: 'desktop-mouse', w: 1280, h: 800, touch: false },
  { id: 'desktop-touch', w: 1280, h: 800, touch: true },
  { id: 'ipad-landscape', w: 1180, h: 820, touch: true },
  { id: 'ipad-portrait', w: 834, h: 1194, touch: true },
  { id: 'phone-landscape', w: 844, h: 390, touch: true },
  { id: 'phone-portrait', w: 390, h: 844, touch: true },
  { id: 'android-small', w: 360, h: 800, touch: true },
];

function profileAt(vp) {
  iso.IS_TOUCH = !!vp.touch;
  return iso.combatDensityProfile({ w: vp.w, h: vp.h });
}

const table = VIEWPORTS.map((vp) => {
  const p = profileAt(vp);
  return { id: vp.id, w: vp.w, h: vp.h, touch: !!vp.touch, ...p };
});
console.log('COMBAT_DENSITY_TABLE');
console.log(JSON.stringify(table.map((r) => ({
  id: r.id, w: r.w, h: r.h, scale: Number(r.scale.toFixed(3)),
  maxAlive: r.maxAlive, interval: r.spawnIntervalMul, batch: r.spawnBatchMax, gap: r.spawnGapPx,
})), null, 2));

const desk = profileAt({ w: 1280, h: 800, touch: false });
must(desk.scale === 1, 'desktop scale must be 1.0', desk);
must(desk.maxAlive === 78, 'desktop mouse maxAlive must stay 78', desk);
must(desk.spawnIntervalMul === 1, 'desktop interval mul must stay 1', desk);
must(desk.spawnBatchMax === 3, 'desktop batch max must stay 3', desk);
must(desk.spawnGapPx === 32, 'desktop gap must stay 32', desk);
must(desk.compact === false, 'desktop must not be compact', desk);

const deskTouch = profileAt({ w: 1280, h: 800, touch: true });
must(deskTouch.scale === 1, 'touch-laptop scale must stay 1.0', deskTouch);
must(deskTouch.maxAlive === 54, 'touch-laptop maxAlive must stay legacy 54', deskTouch);

const phone = profileAt({ w: 390, h: 844, touch: true });
must(phone.scale === 0.5, 'phone portrait scale must sit on 0.50 floor', phone);
must(phone.maxAlive <= 14 && phone.maxAlive >= 8, 'phone maxAlive should be ~8–14', phone);
must(phone.spawnBatchMax === 1, 'phone must spawn single-file', phone);
must(phone.spawnGapPx >= 56, 'phone spawn gap must be wider than desktop 32', phone);
must(phone.spawnIntervalMul > 1.4, 'phone spawn interval must be slower', phone);
must(phone.maxAlive < desk.maxAlive, 'phone maxAlive must be below desktop');
must(phone.scale < desk.scale, 'phone scale must be below desktop');

const phoneLand = profileAt({ w: 844, h: 390, touch: true });
must(phoneLand.scale < 1 && phoneLand.scale >= 0.5, 'phone landscape in (0.50, 1)', phoneLand);
must(phoneLand.maxAlive < deskTouch.maxAlive, 'phone landscape maxAlive < large-touch 54', phoneLand);
must(phoneLand.maxAlive > phone.maxAlive, 'landscape phone may host more than portrait', phoneLand);

iso.IS_TOUCH = false;
const deskCad = iso.adventureSpawnCadence(30, false, false, 1, desk);
must(deskCad.batch === 3, 'legacy batch 3 when queue>28 on desktop', deskCad);
must(Math.abs(deskCad.interval - 0.38 * 0.72) < 1e-9, 'legacy interval 0.38*0.72 on desktop', deskCad);
must(deskCad.gapPx === 32, 'legacy gap 32', deskCad);

const phoneCad = iso.adventureSpawnCadence(30, false, false, 1, phone);
must(phoneCad.batch === 1, 'phone batch capped at 1 even with long queue', phoneCad);
must(phoneCad.interval > deskCad.interval, 'phone interval slower than desktop', phoneCad);
must(phoneCad.gapPx > deskCad.gapPx, 'phone spawn gap wider than desktop', phoneCad);

const openCad = iso.adventureSpawnCadence(8, true, false, 1, phone);
must(openCad.batch === 1, 'opener always single-file', openCad);

must(iso.scaleAdventurePerWave(24, desk) === 24, 'desktop per-wave 24 stays 24');
must(iso.scaleAdventurePerWave(24, phone) === 12, 'phone per-wave 24 → 12 (ceil 24*0.5)');
must(iso.scaleAdventurePerWave(36, phone) === 18, 'phone cap-36 → 18');
must(iso.scaleAdventureHordePad(4, desk) === 4, 'desktop boss pad unchanged');
must(iso.scaleAdventureHordePad(4, phone) === 2, 'phone boss pad 4 → 2');

must(iso.applyCombatTelegraphWind(0.45, desk) === 0.45, 'desktop charge wind stays 0.45');
must(iso.applyCombatTelegraphWind(0.28, desk) === 0.28, 'desktop enrage wind stays 0.28');
must(iso.applyCombatTelegraphWind(0.20, desk) === 0.20, 'desktop shark-enrage wind stays 0.20');
const phoneCharge = iso.applyCombatTelegraphWind(0.45, phone);
must(phoneCharge > 0.45 && phoneCharge >= 0.38, 'phone charge wind longer than desktop', phoneCharge);
must(iso.applyCombatTelegraphWind(0.20, phone) === 0.38, 'phone enrage floor 0.38s (readable jump)');
must(iso.combatChargeTeleDist(240, desk) === 240, 'desktop charge trigger 240');
const phoneDist = iso.combatChargeTeleDist(240, phone);
must(phoneDist < 240 && phoneDist >= 140, 'phone charge trigger on-screen', phoneDist);
must(phoneDist <= Math.round(390 * 0.42), 'phone charge trigger ≤ 42% of W', phoneDist);
must(iso.combatIntroHolds(desk) === false, 'desktop intro does not freeze AI');
must(iso.combatIntroHolds(phone) === true, 'phone intro holds elite/boss aggression');
must(iso.combatBannerSize(68, desk) === 68, 'desktop super-boss banner 68');
must(iso.combatBannerSize(68, phone) === 40, 'phone banners cap at 40');
must(iso.combatJumpSlopExtra(desk) === 0, 'desktop jump slop unchanged');
must(iso.combatJumpSlopExtra(phone) === 10, 'phone jump dodge slop +10');
must(iso.combatJoySwipeAccepts(80, 700, 390, 844, phone) === true, 'phone left-bottom swipe is live');
must(iso.combatJoySwipeAccepts(300, 700, 390, 844, phone) === false, 'phone right cluster stays buttons');
must(iso.combatJoySwipeAccepts(80, 100, 390, 844, phone) === false, 'phone upper playfield is not a pad');
must(iso.combatJoySwipeAccepts(80, 400, 1280, 800, desk) === false, 'desktop has no extra swipe pad');
must(iso.combatJoySwipeAccepts(150, 700, 390, 844, phone) === false, 'old 42% swipe band no longer steals mid-strip');
must(iso.combatJoySwipeAccepts(80, 500, 390, 844, phone) === false, 'swipe starts lower (y>62%) so kick near-misses stay strikes');
must(iso.combatJoySwipeAccepts(80, 320, 844, 390, phoneLand) === true, '844×390 left-bottom swipe is live');
must(iso.combatJoySwipeAccepts(80, 200, 844, 390, phoneLand) === false, '844×390 swipe stays below mid (y>55%)');
must(iso.combatJoySwipeAccepts(700, 320, 844, 390, phoneLand) === false, '844×390 right cluster is not a swipe pad');
must(iso.combatJumpSlopExtra(phoneLand) === 10, 'short landscape jump slop +10');
const landKick = { id: 'kick', x: 690, y: 326, r: 22 };
const landPunch = { id: 'punch', x: 742, y: 326, r: 22 };
const landJoy = { x: 90, y: 326 };
must(iso.combatPreferStrike(660, 326, [landKick, landPunch], landJoy, phoneLand)
  && iso.combatPreferStrike(660, 326, [landKick, landPunch], landJoy, phoneLand).id === 'kick',
  '844×390 near-miss left of kick is a strike');
must(iso.combatPreferStrike(90, 326, [landKick, landPunch], landJoy, phoneLand) === null,
  '844×390 tap on joy is not a strike');

const phoneOpenRaw = iso.adventureSpawnCadence(2, true, false, 1.55, phone);
const phoneOpenSmooth = iso.adventureSpawnCadence(2, true, false, 1.55, phone, 0);
const deskOpen = iso.adventureSpawnCadence(2, true, false, 1.55, desk, 0);
must(phoneOpenRaw.interval > 2.0, 'raw compact opener is the empty-then-spike (~2.58s)', phoneOpenRaw);
must(phoneOpenSmooth.interval >= 0.70 && phoneOpenSmooth.interval <= 1.12,
  'first 30s compact opener clamp 0.70–1.12', phoneOpenSmooth);
must(Math.abs(deskOpen.interval - (0.78 * 1.55 * 1.55)) < 1e-9, 'desktop opener interval stays raw', deskOpen);
const phoneSpike = iso.adventureSpawnCadence(4, false, false, 1, phone, 5);
must(phoneSpike.interval >= 0.70 && phoneSpike.interval <= 1.12, 'first 30s wave-2 dump clamped', phoneSpike);
const phoneLate = iso.adventureSpawnCadence(4, false, false, 1, phone, 31);
must(phoneLate.interval >= 0.62 && phoneLate.interval <= 1.05, 'after 30s compact sustain 0.62–1.05 (no 0.38 dump)', phoneLate);
const phoneMin1 = iso.adventureSpawnCadence(30, false, false, 1, phone, 65);
must(phoneMin1.interval >= 0.62 && phoneMin1.interval <= 1.05, 'minute 1+ long-queue dump clamped', phoneMin1);
must(iso.adventureSpawnCadence(30, false, false, 1, desk, 65).interval === 0.38 * 0.72,
  'desktop minute 1+ cadence stays raw');
must(iso.combatWaveGapSec(1.55, 65, desk) === 1.55, 'desktop wave gap 1.55');
must(iso.combatWaveGapSec(1.55, 65, phone) < 1.55 && iso.combatWaveGapSec(1.55, 65, phone) >= 0.82,
  'phone between-wave hole shorter after minute 1');
must(iso.combatWaveGapSec(2.35, 65, phone) === 2.35, 'phone win-clear fanfare unscaled');
must(iso.combatSmoothOpenInterval(0.38 * 0.72 * 1.38, 65, phone) === 0.62,
  'phone minute-1 spike floor 0.62');
must(iso.combatOpenerHold(0, desk) === 1.2, 'desktop start hold 1.2');
must(iso.combatOpenerHold(0, phone) === 0.55, 'phone first-30s hold 0.55');
must(iso.combatOpenerHold(31, phone) === 1.2, 'phone after 30s hold back to 1.2');
must(iso.combatSpawnEdgeX(1, desk) === 1280 + 40, 'desktop spawn edge W+40');
must(iso.combatSpawnEdgeX(1, phone) === 390 + 18, 'phone spawn edge W+18');
must(iso.combatSpawnEdgeX(-1, phone) === -18, 'phone left spawn -18');
must(iso.combatSmoothOpenInterval(2.58, 0, desk) === 2.58, 'desktop smooth is a no-op');
const tab = profileAt({ w: 834, h: 1194, touch: true });
must(tab.tablet === true && tab.compact === false, '834 portrait is tablet mid-band', tab);
must(tab.scale > phone.scale && tab.scale < desk.scale, 'tablet scale between phone 0.50 and desktop 1.0', tab);
must(tab.maxAlive > phone.maxAlive && tab.maxAlive < deskTouch.maxAlive, 'tablet alive between phone and large-touch', tab);
must(tab.spawnBatchMax === 2, 'tablet batch stays 2', tab);
must(iso.scaleAdventurePerWave(24, tab) > 12 && iso.scaleAdventurePerWave(24, tab) < 24,
  'tablet per-wave 24 sits between phone 12 and desktop 24');
const tabOpenRaw = iso.adventureSpawnCadence(2, true, false, 1.55, tab);
const tabOpen = iso.adventureSpawnCadence(2, true, false, 1.55, tab, 0);
must(tabOpenRaw.interval > 2.0, 'raw tablet opener is the empty hole (~2.10s)', tabOpenRaw);
must(tabOpen.interval >= 0.66 && tabOpen.interval <= 1.22, 'tablet first-30s clamp 0.66–1.22', tabOpen);
const tabSpike = iso.adventureSpawnCadence(4, false, false, 1, tab, 5);
must(tabSpike.interval >= 0.66 && tabSpike.interval <= 1.22, 'tablet wave-2 dump clamped', tabSpike);
const tabMin1 = iso.adventureSpawnCadence(30, false, false, 1, tab, 65);
must(tabMin1.interval >= 0.55 && tabMin1.interval <= 1.15, 'tablet minute-1+ no 0.31s dump', tabMin1);
must(iso.combatOpenerHold(0, tab) === 0.80, 'tablet first-30s hold 0.80');
must(iso.combatOpenerHold(31, tab) === 1.2, 'tablet after 30s hold back to 1.2');
must(iso.combatWaveGapSec(1.55, 65, tab) < 1.55 && iso.combatWaveGapSec(1.55, 65, tab) >= 1.00,
  'tablet between-wave hole shorter, milder than phone');
must(iso.combatWaveGapSec(1.55, 65, tab) > iso.combatWaveGapSec(1.55, 65, phone),
  'tablet wave gap milder than phone ×0.56');
must(iso.combatWaveGapSec(2.35, 65, tab) === 2.35, 'tablet win-clear fanfare unscaled');
must(iso.combatSpawnEdgeX(1, tab) === 834 + 28, 'tablet spawn edge W+28');
must(iso.combatJoySwipeAccepts(80, 900, 834, 1194, tab) === false, 'tablet has no phone swipe pad');
must(!/lose-retry/.test(densSrc), 'density module must not own result CTA layout');
must(iso.combatLoseResultMs(desk) === 850, 'desktop lose CTA 850ms');
must(iso.combatLoseResultMs(phone) === 650, 'phone lose CTA 650ms');
must(iso.combatLoseResultMs(phone) + 1100 < 3000, 'phone death banner+CTA under 3s');
must(typeof iso.notePlayerFailTele === 'function', 'notePlayerFailTele missing in iso');
must(typeof iso.combatFailRetryTip === 'function', 'combatFailRetryTip missing in iso');
iso.tOr = (k, fb, p) => {
  if (k === 'result.againRetry') return 'Nog één keer';
  if (k === 'result.failTeleTip') return (p.cue || '') + ' → ' + (p.again || '');
  if (k === 'result.failTeleSlam') return 'SLAM';
  if (k === 'result.failTeleCharge') return 'CHARGE';
  if (k === 'result.failTeleFlyer') return 'vlieger';
  return fb;
};
const tipGame = { lastFailTele: 'slam' };
must(iso.combatFailRetryTip(tipGame).indexOf('SLAM') >= 0, 'fail tip names the cue', iso.combatFailRetryTip(tipGame));
must(iso.combatFailRetryTip(tipGame).indexOf('Nog één keer') >= 0, 'fail tip points at retry', iso.combatFailRetryTip(tipGame));
must(iso.combatFailRetryTip({ lastFailTele: null }, '') === '', 'no cue → empty tip');
const rec = { mode: 'adventure', lastFailTele: null, monsters: [{ alive: true, flying: true, sp: { type: 'fly' } }] };
iso.notePlayerFailTele(rec, {});
must(rec.lastFailTele === 'flyer', 'notePlayerFailTele infers flyer', rec.lastFailTele);
iso.notePlayerFailTele(rec, { failKind: 'slam' });
must(rec.lastFailTele === 'slam', 'notePlayerFailTele records slam', rec.lastFailTele);

const kickBtn = { id: 'kick', x: 268, y: 800, r: 24 };
const punchBtn = { id: 'punch', x: 322, y: 800, r: 24 };
const joyHome = { x: 64, y: 800 };
const nearKick = iso.combatPreferStrike(230, 800, [kickBtn, punchBtn], joyHome, phone);
must(nearKick && nearKick.id === 'kick', 'near-miss left of kick is a strike', nearKick);
must(iso.combatPreferStrike(80, 800, [kickBtn, punchBtn], joyHome, phone) === null,
  'tap on the joy home is not a strike');
must(iso.combatPreferStrike(230, 800, [kickBtn, punchBtn], joyHome, desk) === null,
  'desktop has no prefer-strike');
must(iso.combatPreferStrike(230, 1100, [kickBtn, punchBtn], joyHome, tab) === null,
  'tablet has no prefer-strike');
must(!/combatPreferStrike/.test(versusSrc), 'versus.js must not use prefer-strike');
must(!/combatSmoothOpenInterval/.test(versusSrc), 'versus.js must not use opener clamp');

must(iso.combatColossalSizeMul(desk) === 2, 'desktop colossal mul stays 2.0');
must(iso.combatColossalSizeMul(phone) === 1.38, 'phone colossal mul 1.38 (still huge)');
must(iso.combatFitBossSize(180, desk) === 180, 'desktop colossal size uncapped');
const phoneCol = iso.combatFitBossSize(180, phone);
must(phoneCol <= iso.combatBossSizeCap(phone) && phoneCol >= 64, 'phone colossal capped', phoneCol);
must(phoneCol < 180, 'phone colossal smaller than raw 180', phoneCol);
const deskLane = iso.combatColossalFairLane(180, desk);
const phoneLane = iso.combatColossalFairLane(phoneCol, phone);
must(phoneLane > deskLane || phoneLane >= 80, 'phone leftover lane after colossal fit', { phoneLane, deskLane, phoneCol });
must(iso.applyCombatTelegraphWind(0.45, phone, { colossal: true }) >= 0.46, 'phone colossal wind ≥ 0.46');
must(iso.applyCombatTelegraphWind(0.45, desk, { colossal: true }) === 0.45, 'desktop colossal wind unchanged');
must(typeof iso.refreshAdventureBossScale === 'function', 'resize refit helper missing');

must(iso.combatEnrageWalkMul(1, desk) === 1.32, 'desktop Normal enrage walk 1.32');
must(iso.combatEnrageWalkMul(1.32, desk) === 1.32 * 1.32, 'desktop Hell enrage walk 1.7424');
must(iso.combatEnrageWalkMul(1.18, desk) === 1.32 * 1.18, 'desktop Nightmare enrage walk raw');
const phoneHellWalk = iso.combatEnrageWalkMul(1.32, phone);
must(phoneHellWalk < 1.32 * 1.32, 'phone Hell enrage walk slower than desktop', phoneHellWalk);
must(phoneHellWalk > 1.32, 'phone Hell enrage still faster than Normal desktop 1.32', phoneHellWalk);
must(Math.abs(phoneHellWalk - (1 + (1.32 * 1.32 - 1) * 0.52)) < 1e-9, 'phone Hell extra ×0.52', phoneHellWalk);
must(iso.combatEnrageWalkMul(1, phone) < 1.32, 'phone Normal enrage extra also damped');
must(iso.combatSpreadPickupX(200, [], desk) === 200, 'desktop loot x unchanged');
must(iso.combatSpreadPickupX(200, [{ x: 200, life: 1 }], desk) === 200, 'desktop stacked loot stays');
const phoneLoot = iso.combatSpreadPickupX(200, [{ x: 200, life: 1 }], phone);
must(Math.abs(phoneLoot - 200) >= 40, 'phone stacked loot fans ≥40px', phoneLoot);
must(!/combatEnrageWalkMul/.test(versusSrc), 'versus.js must not use enrage walk scale');
must(!/combatSpreadPickupX/.test(versusSrc), 'versus.js must not use pickup fan');

must(iso.combatTelegraphHudSlots(desk) === 2, 'desktop HUD can show 2 cues');
must(iso.combatTelegraphHudSlots(phone) === 2, 'phone portrait HUD shows 2 stacked cues');
must(iso.combatTelegraphHudSlots(phoneLand) === 1, 'short landscape HUD stays 1 + overflow');
const picked = iso.combatPickTelegraphHuds([
  { remain: 0.40, label: 'slam' },
  { remain: 0.18, label: 'charge' },
  { remain: 0.90, label: 'fire' },
], phone);
must(picked.length === 2 && picked[0].label === 'charge' && picked[1].label === 'slam',
  'phone HUD sorts soonest first', picked);
must(picked[0].extra === 1, 'phone 2-slot +1 when a third cue is waiting', picked);
const twoOnly = iso.combatPickTelegraphHuds([
  { remain: 0.40, label: 'slam' },
  { remain: 0.18, label: 'charge' },
], phone);
must(twoOnly.length === 2 && !twoOnly[0].extra, 'phone 2-of-2 has no overflow chip', twoOnly);
const landPick = iso.combatPickTelegraphHuds([
  { remain: 0.40, label: 'slam' },
  { remain: 0.18, label: 'charge' },
], phoneLand);
must(landPick.length === 1 && landPick[0].label === 'charge' && landPick[0].extra === 1,
  'short landscape shows soonest +1', landPick);
must(!/combatPickTelegraphHuds/.test(versusSrc), 'versus.js must not use multi telegraph HUD');

must(iso.combatFlyerHover(110, desk) === 110, 'desktop flyer hover 110');
must(iso.combatFlyerHover(130, desk) === 130, 'desktop dragon hover 130');
must(iso.combatFlyerHover(110, phone) === 110, 'tall phone portrait keeps desktop hover');
const landHover = iso.combatFlyerHover(110, phoneLand);
must(landHover < 110 && landHover >= 54, 'short landscape flyer hover lowered', landHover);
must(iso.combatFlyerBob(42, desk) === 42, 'desktop flyer bob 42');
must(iso.combatFlyerBob(42, phoneLand) < 42, 'short landscape flyer bob damped');
must(iso.combatMeleeAimLift(desk) === 88, 'desktop melee lift 88');
must(iso.combatMeleeAimLift(phoneLand) === 104, 'short landscape melee lift 104');
must(iso.combatMeleeAimLift(phone) === 96, 'phone portrait melee lift 96');
must(iso.combatJoyAimGain(desk) === 1, 'desktop joy aim gain 1');
must(iso.combatJoyAimGain(phoneLand) > 1, 'short landscape joy aim more sensitive');
must(iso.combatPartGateWalkSec(desk) === 3.35, 'desktop part-gate 3.35s');
must(iso.combatPartGateWalkSec(phone) === 2.2, 'phone part-gate 2.2s');
must(iso.combatPartGateWalkSec(phoneLand) === 2.2, 'short landscape part-gate 2.2s');
must(!/combatFlyerHover/.test(versusSrc), 'versus.js must not call flyer hover');
must(!/combatPartGateWalkSec/.test(versusSrc), 'versus.js must not call part-gate scale');

/* ---- buildLevel with explicit viewports (full bundle) ---- */
if (!built) fail('game.js missing — run npm run build first');

function makeEl(id) {
  return {
    id, tagName: id === 'game' ? 'CANVAS' : 'DIV',
    classList: { s: new Set(), add(x) { this.s.add(x); }, remove(x) { this.s.delete(x); }, contains(x) { return this.s.has(x); }, toggle() {} },
    style: {}, hidden: false, dataset: {}, disabled: false, textContent: '', innerHTML: '', value: '',
    children: [], parentElement: null, closest() { return this; },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {}, focus() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    clientWidth: 320, clientHeight: 480,
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 40 }; },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    getContext() {
      return new Proxy({}, {
        get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient'
          ? () => ({ addColorStop() {} }) : () => undefined),
      });
    },
  };
}
const byId = new Map();
const get = (id) => { if (!byId.has(id)) byId.set(id, makeEl(id)); return byId.get(id); };
[
  'menuScreen', 'levelScreen', 'gambleScreen', 'game', 'toastHost', 'pauseBtn',
  'resultScreen', 'pauseScreen', 'settingsScreen', 'buildingsScreen',
  'btnAdventure', 'btnContinue', 'btnTraining', 'pauseResume', 'pauseQuit',
  'resAgain', 'resNext', 'resMenu',
].forEach(get);
get('menuScreen').classList.add('active');

const ctx = {
  document: {
    getElementById: get, querySelector() { return null; },
    querySelectorAll(sel) {
      if (sel === '.screen') return [...byId.values()].filter((e) => String(e.id).endsWith('Screen'));
      return [];
    },
    body: get('body'), createElement: (t) => makeEl(t),
    addEventListener() {}, dispatchEvent() {},
  },
  addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  getComputedStyle() { return { display: 'flex', visibility: 'visible', opacity: '1', animationName: 'none', zIndex: '20', pointerEvents: 'auto' }; },
  setInterval() { return 0; }, clearInterval() {},
  setTimeout(fn) { try { fn(); } catch (_) {} return 0; }, clearTimeout() {},
  performance: { now: () => 0 },
  console,
  location: { href: 'https://brennyz.github.io/stickman-fighter/', hostname: 'brennyz.github.io', protocol: 'https:', search: '', pathname: '/stickman-fighter/', origin: 'https://brennyz.github.io' },
  navigator: { onLine: true, userAgent: 'Chrome', maxTouchPoints: 0, platform: 'Linux', vibrate() {} },
  localStorage: { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } },
  sfTunnelBoot: Promise.resolve(),
  dispatchEvent() {},
  AudioContext: class {
    constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0; this.sampleRate = 44100; }
    createGain() { return { connect() { return this; }, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createOscillator() { return { connect() { return this; }, start() {}, stop() {}, type: 'sine', frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    createBufferSource() { return { connect() { return this; }, start() {}, buffer: null }; }
    createBiquadFilter() { return { connect() { return this; }, type: '', frequency: { value: 0 } }; }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  },
};
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.self = ctx;
ctx.webkitAudioContext = ctx.AudioContext;

try {
  vm.runInContext(built, vm.createContext(ctx), { filename: 'game.js' });
} catch (e) {
  fail('game.js vm load', e && e.message);
}

must(typeof ctx.buildLevel === 'function', 'buildLevel not in vm scope');
must(typeof ctx.combatDensityProfile === 'function', 'combatDensityProfile not in vm scope');

const lv = 12;
const deskLv = ctx.buildLevel(lv, 'normal', { w: 1280, h: 800 });
const phoneLv = ctx.buildLevel(lv, 'normal', { w: 390, h: 844 });
const deskBudget = deskLv.waves.reduce((s, w) => s + w.length, 0);
const phoneBudget = phoneLv.waves.reduce((s, w) => s + w.length, 0);

must(deskLv.combatDensity && deskLv.combatDensity.scale === 1, 'buildLevel desktop scale 1', deskLv.combatDensity);
must(phoneLv.combatDensity && phoneLv.combatDensity.scale === 0.5, 'buildLevel phone scale 0.5', phoneLv.combatDensity);
must(deskLv.waves.length === phoneLv.waves.length, 'wave COUNT must match (do not shorten stages)', {
  desk: deskLv.waves.length, phone: phoneLv.waves.length,
});
must(phoneBudget < deskBudget, 'phone mid-level spawn budget must be below desktop', {
  phoneBudget, deskBudget, phoneWaves: phoneLv.waves.map((w) => w.length), deskWaves: deskLv.waves.map((w) => w.length),
});
must(phoneLv.waves[0].length <= deskLv.waves[0].length, 'phone wave 1 must not exceed desktop');

const lv1desk = ctx.buildLevel(1, 'normal', { w: 1280, h: 800 });
const lv1phone = ctx.buildLevel(1, 'normal', { w: 390, h: 844 });
must(lv1desk.waves[0].length === 2, 'desktop lv1 wave1 stays 2 (playtest P1)', lv1desk.waves[0].length);
must(lv1phone.waves[0].length === 2, 'phone lv1 wave1 stays 2 (do not gut opener)', lv1phone.waves[0].length);
must(lv1desk.waves[1].length <= 4 && lv1phone.waves[1].length <= 4, 'lv1 wave2 cap 4');

const hellDesk = ctx.buildLevel(20, 'hell', { w: 1280, h: 800 });
const hellPhone = ctx.buildLevel(20, 'hell', { w: 390, h: 844 });
const hellDeskN = hellDesk.waves.reduce((s, w) => s + w.length, 0);
const hellPhoneN = hellPhone.waves.reduce((s, w) => s + w.length, 0);
must(hellPhoneN < hellDeskN, 'Hell 3.0 phone still below desktop (not gutted to 1v1)', { hellPhoneN, hellDeskN });
must(hellPhoneN >= 20, 'Hell phone still a horde', hellPhoneN);

console.log('BUILDLEVEL', {
  lv12: { deskBudget, phoneBudget, waves: deskLv.waves.length, deskW0: deskLv.waves[0].length, phoneW0: phoneLv.waves[0].length },
  hell20: { hellDeskN, hellPhoneN },
  lv1: { desk: lv1desk.waves.map((w) => w.length), phone: lv1phone.waves.map((w) => w.length) },
});

must(typeof ctx.applyCombatTelegraphWind === 'function', 'applyCombatTelegraphWind not in vm');
must(typeof ctx.combatIntroHolds === 'function', 'combatIntroHolds not in vm');
must(ctx.applyCombatTelegraphWind(0.45, { w: 1280, h: 800 }) === 0.45, 'vm desktop wind 0.45');
must(ctx.applyCombatTelegraphWind(0.20, { w: 390, h: 844 }) === 0.38, 'vm phone enrage floor 0.38');
must(ctx.combatChargeTeleDist(240, { w: 390, h: 844 }) <= Math.round(390 * 0.42), 'vm phone charge on-screen');
must(ctx.combatIntroHolds({ w: 390, h: 844 }) === true, 'vm phone intro holds');
must(ctx.combatIntroHolds({ w: 1280, h: 800 }) === false, 'vm desktop intro does not hold');
must(ctx.combatBannerSize(68, { w: 390, h: 844 }) === 40, 'vm phone banner cap 40');
must(ctx.combatJumpSlopExtra({ w: 390, h: 844 }) === 10, 'vm phone jump slop');
must(ctx.combatJoySwipeAccepts(80, 700, 390, 844, { w: 390, h: 844 }) === true, 'vm swipe pad');
must(ctx.combatColossalSizeMul({ w: 1280, h: 800 }) === 2, 'vm desktop colossal 2.0');
must(ctx.combatFitBossSize(168, { w: 390, h: 844 }) < 168, 'vm phone fits guvve-scale colossal');
must(ctx.combatColossalFairLane(ctx.combatFitBossSize(168, { w: 390, h: 844 }), { w: 390, h: 844 }) >= 80,
  'vm phone colossal leaves ≥80px fair lane');
must(ctx.combatEnrageWalkMul(1.32, { w: 1280, h: 800 }) === 1.32 * 1.32, 'vm desktop Hell walk raw');
must(ctx.combatEnrageWalkMul(1.32, { w: 390, h: 844 }) < 1.5, 'vm phone Hell walk damped');
must(ctx.combatEnrageWalkMul(1.32, { w: 390, h: 844 }) > 1.32, 'vm phone Hell walk still a rush');
must(Math.abs(ctx.combatSpreadPickupX(180, [{ x: 180, life: 1 }], { w: 390, h: 844 }) - 180) >= 40,
  'vm phone loot fans off the pile');
must(typeof ctx.adventureTelegraphHuds === 'function', 'adventureTelegraphHuds not in vm');
const slamM = { alive: true, telegraphT: 0.40, telegraphMax: 0.45, sp: { type: 'tank' } };
const chargeM = { alive: true, telegraphT: 0.22, telegraphMax: 0.45, sp: { type: 'charge' } };
const hudList = ctx.adventureTelegraphHuds([slamM, chargeM, { alive: true, sp: { type: 'hop' } }]);
must(hudList.length === 2, 'vm two winding elites both produce HUD cues', hudList);
const phoneHud = ctx.combatPickTelegraphHuds(hudList, { w: 390, h: 844 });
must(phoneHud.length === 2 && phoneHud[0].kind === 'charge', 'vm 390 stacks soonest charge then slam', phoneHud);
const landHud = ctx.combatPickTelegraphHuds(hudList, { w: 844, h: 390 });
must(landHud.length === 1 && landHud[0].extra === 1, 'vm 844×390 one bar +1', landHud);
must(ctx.combatFlyerHover(110, { w: 1280, h: 800 }) === 110, 'vm desktop flyer 110');
must(ctx.combatFlyerHover(110, { w: 844, h: 390 }) < 110, 'vm short flyer lower');
must(ctx.combatMeleeAimLift({ w: 844, h: 390 }) === 104, 'vm short melee lift');
must(ctx.combatPartGateWalkSec({ w: 390, h: 844 }) === 2.2, 'vm phone gate 2.2');
must(ctx.combatPartGateWalkSec({ w: 1280, h: 800 }) === 3.35, 'vm desktop gate 3.35');
must(typeof ctx.combatSmoothOpenInterval === 'function', 'combatSmoothOpenInterval not in vm');
must(ctx.combatSmoothOpenInterval(2.58, 0, { w: 390, h: 844 }) <= 1.12, 'vm phone opener clamp');
must(ctx.combatSmoothOpenInterval(2.58, 0, { w: 1280, h: 800 }) === 2.58, 'vm desktop opener raw');
must(ctx.combatSmoothOpenInterval(0.37, 65, { w: 390, h: 844 }) === 0.62, 'vm phone minute-1 floor');
must(ctx.combatWaveGapSec(1.55, 65, { w: 390, h: 844 }) < 1.55, 'vm phone wave gap shorter');
must(ctx.combatWaveGapSec(1.55, 65, { w: 1280, h: 800 }) === 1.55, 'vm desktop wave gap raw');
must(ctx.combatOpenerHold(0, { w: 390, h: 844 }) === 0.55, 'vm phone hold 0.55');
must(ctx.combatSpawnEdgeX(1, { w: 390, h: 844 }) === 408, 'vm phone edge 408');
must(ctx.combatPreferStrike(230, 800, [{ id: 'kick', x: 268, y: 800, r: 24 }], { x: 64, y: 800 }, { w: 390, h: 844 }),
  'vm prefer-strike claims near-miss kick');
must(ctx.combatSmoothOpenInterval(2.10, 0, { w: 834, h: 1194 }) <= 1.22, 'vm tablet opener clamp');
must(ctx.combatSmoothOpenInterval(0.31, 65, { w: 834, h: 1194 }) === 0.55, 'vm tablet minute-1 floor');
must(ctx.combatOpenerHold(0, { w: 834, h: 1194 }) === 0.80, 'vm tablet hold 0.80');
must(ctx.combatWaveGapSec(1.55, 65, { w: 834, h: 1194 }) < 1.55, 'vm tablet wave gap shorter');
must(ctx.combatWaveGapSec(1.55, 65, { w: 834, h: 1194 }) > ctx.combatWaveGapSec(1.55, 65, { w: 390, h: 844 }),
  'vm tablet gap milder than phone');
must(ctx.combatDensityProfile({ w: 834, h: 1194 }).scale > 0.5
  && ctx.combatDensityProfile({ w: 834, h: 1194 }).scale < 1,
  'vm tablet scale between phone and desktop');

console.log('TELEGRAPH_390', {
  phoneWind: ctx.applyCombatTelegraphWind(0.45, { w: 390, h: 844 }),
  enrageFloor: ctx.applyCombatTelegraphWind(0.20, { w: 390, h: 844 }),
  chargeDist: ctx.combatChargeTeleDist(240, { w: 390, h: 844 }),
  introHolds: ctx.combatIntroHolds({ w: 390, h: 844 }),
  banner: ctx.combatBannerSize(68, { w: 390, h: 844 }),
});

const phoneCap = ctx.combatBossSizeCap({ w: 390, h: 844 });
const phoneFit = ctx.combatFitBossSize(168, { w: 390, h: 844 });
console.log('FLYER_GATE_390', {
  deskHover: ctx.combatFlyerHover(110, { w: 1280, h: 800 }),
  landHover: ctx.combatFlyerHover(110, { w: 844, h: 390 }),
  phoneHover: ctx.combatFlyerHover(110, { w: 390, h: 844 }),
  landLift: ctx.combatMeleeAimLift({ w: 844, h: 390 }),
  phoneGate: ctx.combatPartGateWalkSec({ w: 390, h: 844 }),
  deskGate: ctx.combatPartGateWalkSec({ w: 1280, h: 800 }),
});

console.log('TELE_HUD_390', {
  slots390: ctx.combatTelegraphHudSlots({ w: 390, h: 844 }),
  slotsLand: ctx.combatTelegraphHudSlots({ w: 844, h: 390 }),
  n: hudList.length,
  phoneShown: phoneHud.map((h) => h.kind),
  landExtra: landHud[0] && landHud[0].extra,
});

console.log('ENRAGE_LOOT_390', {
  deskHell: ctx.combatEnrageWalkMul(1.32, { w: 1280, h: 800 }),
  phoneHell: ctx.combatEnrageWalkMul(1.32, { w: 390, h: 844 }),
  phoneNormal: ctx.combatEnrageWalkMul(1, { w: 390, h: 844 }),
  lootFan: ctx.combatSpreadPickupX(180, [{ x: 180, life: 1 }], { w: 390, h: 844 }),
});

console.log('COLOSSAL_390', {
  deskMul: ctx.combatColossalSizeMul({ w: 1280, h: 800 }),
  phoneMul: ctx.combatColossalSizeMul({ w: 390, h: 844 }),
  phoneCap,
  raw168: 168,
  phoneFit,
  phoneLane: ctx.combatColossalFairLane(phoneFit, { w: 390, h: 844 }),
  deskFit: ctx.combatFitBossSize(168, { w: 1280, h: 800 }),
  colossalWind: ctx.applyCombatTelegraphWind(0.45, { w: 390, h: 844 }, { colossal: true }),
});

console.log('OPENER_STRIKE_390', {
  phoneOpenSmooth: ctx.adventureSpawnCadence(2, true, false, 1.55, { w: 390, h: 844 }, 0).interval,
  deskOpen: ctx.adventureSpawnCadence(2, true, false, 1.55, { w: 1280, h: 800 }, 0).interval,
  phoneHold: ctx.combatOpenerHold(0, { w: 390, h: 844 }),
  phoneEdge: ctx.combatSpawnEdgeX(1, { w: 390, h: 844 }),
  min1Iv: ctx.adventureSpawnCadence(30, false, false, 1, { w: 390, h: 844 }, 65).interval,
  waveGap: ctx.combatWaveGapSec(1.55, 65, { w: 390, h: 844 }),
  swipe34: ctx.combatJoySwipeAccepts(80, 700, 390, 844, { w: 390, h: 844 }),
  swipeOld42: ctx.combatJoySwipeAccepts(150, 700, 390, 844, { w: 390, h: 844 }),
  loseMsPhone: ctx.combatLoseResultMs({ w: 390, h: 844 }),
  loseMsDesk: ctx.combatLoseResultMs({ w: 1280, h: 800 }),
});
must(ctx.combatLoseResultMs({ w: 390, h: 844 }) === 650, 'vm phone lose 650');
must(ctx.combatLoseResultMs({ w: 1280, h: 800 }) === 850, 'vm desktop lose 850');
must(typeof ctx.restartAdventureInstant === 'function', 'restartAdventureInstant not in vm');
must(typeof ctx.notePlayerFailTele === 'function', 'notePlayerFailTele not in vm');

console.log('SMOKE_OK combat-density');
