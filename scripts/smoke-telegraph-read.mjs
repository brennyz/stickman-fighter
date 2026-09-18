#!/usr/bin/env node
/**
 * Enemy attack telegraph readability — fair fail (Flappy).
 * Does NOT own spawn density (#314): scale / maxAlive / interval / batch / gap stay.
 * Versus stays out.
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
const monsterSrc = fs.readFileSync(path.join(root, 'src/entities/monster.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const versusSrc = fs.readFileSync(path.join(root, 'src/systems/versus.js'), 'utf8');
const catalogSrc = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');

must(/COMBAT_DENSITY_MIN = 0\.50/.test(densSrc), 'density floor 0.50 must stay (#314)');
must(/COMBAT_DENSITY_WIDE_W = 960/.test(densSrc), 'wide lock must stay (#314)');
must(/spawnIntervalMul: compact \? 1\.55/.test(densSrc), 'phone interval ×1.55 must stay (#314)');
must(/spawnGapPx: compact \? 64/.test(densSrc), 'phone gap 64 must stay (#314)');
must(/spawnBatchMax: compact \? 1/.test(densSrc), 'phone batch 1 must stay (#314)');

must(/COMBAT_TELEGRAPH_FLOOR_DESK = 0\.32/.test(densSrc), 'desktop telegraph floor 0.32');
must(/COMBAT_TELEGRAPH_RANGED_PHONE = 0\.46/.test(densSrc), 'phone ranged floor 0.46');
must(/function combatTelegraphReadScale\(/.test(densSrc), 'combatTelegraphReadScale missing');
must(/function combatTelegraphKindOf\(/.test(densSrc), 'combatTelegraphKindOf missing');
must(/flags && flags\.ranged/.test(densSrc), 'ranged wind flag missing');

must(/this\.telegraphKind = 'shoot'/.test(monsterSrc), 'shoot must wind before fire');
must(/this\.telegraphKind = 'fire'/.test(monsterSrc), 'dragon fire must wind before fire');
must(/this\.telegraphKind = 'ink'/.test(monsterSrc), 'ink must wind before fire');
must(/this\.telegraphKind = 'charge'/.test(monsterSrc), 'charge must tag telegraphKind');
must(/this\.telegraphKind = 'slam'/.test(monsterSrc), 'slam must tag telegraphKind');
must(/ranged: true/.test(monsterSrc), 'ranged winds must use applyCombatTelegraphWind ranged');
must(/combatTelegraphReadScale/.test(monsterSrc), 'world-space cue must scale for compact');
must(/kind === 'slam'/.test(monsterSrc), 'slam ground pad missing');
must(/kind === 'shoot'/.test(monsterSrc), 'ranged aim line missing');

must(/kind === 'shoot' \|\| m\.sp\.type === 'shoot'/.test(gameSrc), 'HUD must use shoot telegraphT');
must(/hud\.teleInk/.test(gameSrc), 'HUD ink cue missing');
must(/hud\.teleTech/.test(gameSrc), 'HUD technique cue missing');
must(/remain\.toFixed\(1\)/.test(gameSrc), 'HUD must show seconds remaining');
must(/imminent/.test(gameSrc), 'HUD imminent flash missing');
must(!/\brightPad\b/.test(gameSrc), 'adventure HUD must not reference undefined rightPad (draw crash)');

must(!/combatTelegraphReadScale/.test(versusSrc), 'versus.js must not use telegraph read scale');
must(!/applyCombatTelegraphWind/.test(versusSrc), 'versus.js must not use telegraph wind');
must(!/telegraphKind/.test(versusSrc), 'versus.js must not tag monster telegraphs');

must(/teleInk:/.test(catalogSrc), 'catalog teleInk missing');
must(/teleTech:/.test(catalogSrc), 'catalog teleTech missing');

const iso = {
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  W: 1280,
  H: 800,
  innerWidth: 1280,
  innerHeight: 800,
  IS_TOUCH: false,
};
vm.runInNewContext(densSrc, iso);

const desk = iso.combatDensityProfile({ w: 1280, h: 800 });
const phone = iso.combatDensityProfile({ w: 390, h: 844 });
const tab = iso.combatDensityProfile({ w: 834, h: 1194 });

must(desk.scale === 1, 'desktop scale still 1.0', desk);
must(phone.scale === 0.5, 'phone scale still 0.50', phone);
must(desk.maxAlive === 78, 'desktop maxAlive still 78', desk);
must(phone.spawnBatchMax === 1 && desk.spawnBatchMax === 3, 'batch ownership still #314');
must(phone.spawnGapPx === 64 && desk.spawnGapPx === 32, 'gap ownership still #314');

must(iso.applyCombatTelegraphWind(0.45, desk) === 0.45, 'desktop charge 0.45 unchanged');
must(iso.applyCombatTelegraphWind(0.28, desk) === 0.32, 'desktop enrage floor 0.32', iso.applyCombatTelegraphWind(0.28, desk));
must(iso.applyCombatTelegraphWind(0.20, desk) === 0.32, 'desktop shark floor 0.32');
must(iso.applyCombatTelegraphWind(0.20, phone) === 0.38, 'phone enrage floor 0.38');
must(iso.applyCombatTelegraphWind(0.42, desk, { ranged: true }) >= 0.40, 'desktop ranged ≥ 0.40');
must(iso.applyCombatTelegraphWind(0.42, phone, { ranged: true }) >= 0.46, 'phone ranged ≥ 0.46');
must(iso.applyCombatTelegraphWind(0.20, tab) >= 0.34, 'tablet floor ≥ 0.34');
must(iso.combatTelegraphReadScale(phone) > iso.combatTelegraphReadScale(desk), 'phone ring thicker than desktop');
must(iso.combatTelegraphKindOf({ telegraphKind: 'fire', sp: { type: 'dragon' } }) === 'fire', 'kind tag wins');
must(iso.combatTelegraphKindOf({ telegraphT: 0.2, sp: { type: 'tank' } }) === 'slam', 'tank infers slam');

console.log('TELEGRAPH_READ', {
  deskCharge: iso.applyCombatTelegraphWind(0.45, desk),
  deskEnrage: iso.applyCombatTelegraphWind(0.28, desk),
  deskShark: iso.applyCombatTelegraphWind(0.20, desk),
  phoneEnrage: iso.applyCombatTelegraphWind(0.20, phone),
  deskRanged: iso.applyCombatTelegraphWind(0.42, desk, { ranged: true }),
  phoneRanged: iso.applyCombatTelegraphWind(0.42, phone, { ranged: true }),
  phoneRead: iso.combatTelegraphReadScale(phone),
  deskRead: iso.combatTelegraphReadScale(desk),
  deskScale: desk.scale,
  phoneScale: phone.scale,
});

console.log('SMOKE_OK telegraph-read');
