#!/usr/bin/env node
/**
 * TF-001: lose tip telegraph is THIS killing hit only.
 * A Bubbel/slime contact must not keep leftover "vlieger" or steal an alive bat.
 * Versus stays out. Density numbers unchanged.
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
const fighterSrc = fs.readFileSync(path.join(root, 'src/entities/fighter.js'), 'utf8');
const versusSrc = fs.readFileSync(path.join(root, 'src/systems/versus.js'), 'utf8');

must(/function notePlayerFailTele\(/.test(densSrc), 'notePlayerFailTele missing');
must(/function combatFailTeleKind\(/.test(densSrc), 'combatFailTeleKind missing');
must(/function applyCombatTelegraphWind\(/.test(densSrc), 'applyCombatTelegraphWind missing');
must(/game\.lastFailTele = combatFailTeleKind\(src\) \|\| ''/.test(densSrc),
  'notePlayerFailTele must always write THIS hit (empty clears leftover)');
must(!/m\.flying \|\| \(m\.sp && \(m\.sp\.type === 'fly'/.test(densSrc),
  'must not infer flyer from any alive bat');
must(!/adventureTelegraphHuds\(game\.monsters\)/.test(densSrc),
  'must not steal HUD telegraph from another monster');
must(/notePlayerFailTele/.test(fighterSrc), 'player hurt must note fail telegraph');
must((fighterSrc.match(/notePlayerFailTele\(game, opts\)/g) || []).length >= 2,
  'block chip and open hit must both record THIS hit');

must(!/notePlayerFailTele/.test(versusSrc), 'versus.js must not record fail telegraph');
must(!/lastFailTele/.test(versusSrc), 'versus.js must not use lastFailTele');
must(!/applyCombatTelegraphWind/.test(versusSrc), 'versus.js must not use telegraph wind');

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

must(desk.scale === 1, 'desktop scale still 1.0', desk);
must(phone.scale === 0.5, 'phone scale still 0.50', phone);
must(iso.applyCombatTelegraphWind(0.45, desk) === 0.45, 'desktop charge 0.45 unchanged');
must(iso.applyCombatTelegraphWind(0.20, phone) === 0.38, 'phone compact wind floor 0.38');

must(iso.combatFailTeleKind({ attacker: { flying: false, sp: { type: 'hop', art: 'slime' } } }) === '',
  'hop slime is contact, not flyer');
must(iso.combatFailTeleKind({ attacker: { flying: false, dashT: 0, sp: { type: 'swim', art: 'octo' } } }) === '',
  'ink octo contact is not CHARGE');
must(iso.combatFailTeleKind({ attacker: { flying: false, sp: { type: 'swim', art: 'shark' } } }) === 'charge',
  'shark swim is charge');
must(iso.combatFailTeleKind({ attacker: { flying: true, sp: { type: 'fly' } } }) === 'flyer',
  'real flyer hit tags flyer');
must(iso.combatFailTeleKind({ srcMon: { flying: true, sp: { type: 'fly' } } }) === 'flyer',
  'srcMon flyer still tags flyer');
must(iso.combatFailTeleKind({ failKind: 'slam' }) === 'slam', 'explicit failKind slam');

const sticky = {
  mode: 'adventure',
  lastFailTele: 'flyer',
  monsters: [{ alive: true, flying: true, sp: { type: 'fly' } }],
};
iso.notePlayerFailTele(sticky, { attacker: { flying: false, sp: { type: 'hop', art: 'slime', name: 'Bubbel' } } });
must(sticky.lastFailTele === '', 'TF-001 slime kill must clear leftover flyer cue', sticky.lastFailTele);
must(iso.combatFailRetryTip(sticky, '') === '', 'cleared cue → empty fail tip');

iso.notePlayerFailTele(sticky, { attacker: { flying: true, sp: { type: 'fly' } } });
must(sticky.lastFailTele === 'flyer', 'real flyer hit still tags flyer');
iso.tOr = (k, fb, p) => {
  if (k === 'result.againRetry') return 'Nog één keer';
  if (k === 'result.failTeleTip') return (p.cue || '') + ' → ' + (p.again || '');
  if (k === 'result.failTeleFlyer') return 'vlieger';
  return fb;
};
must(iso.combatFailRetryTip(sticky).indexOf('vlieger') >= 0, 'flyer killing hit still names vlieger');

iso.notePlayerFailTele(sticky, {});
must(sticky.lastFailTele === '', 'empty src must not steal an alive flyer', sticky.lastFailTele);

console.log('TELEGRAPH_READ', {
  deskCharge: iso.applyCombatTelegraphWind(0.45, desk),
  phoneFloor: iso.applyCombatTelegraphWind(0.20, phone),
  deskScale: desk.scale,
  phoneScale: phone.scale,
});
console.log('SMOKE_OK telegraph-read');
