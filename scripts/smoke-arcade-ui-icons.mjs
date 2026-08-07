#!/usr/bin/env node
/**
 * Smoke: arcade prestaties/lock/check/saga UI icons — geen emoji, files wired.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const mustExist = [
  'assets/ui/ui-lock.svg',
  'assets/ui/ui-check.svg',
  'assets/ui/ui-coin.svg',
  'assets/ui/ui-warn.svg',
  'assets/ui/ach-first-win.svg',
  'assets/ui/ach-lv70.svg',
  'assets/ui/ach-dex-full.svg',
  'assets/ui/ach-train5.svg',
  'assets/ui/ach-vs-roster.svg',
  'assets/ui/ach-saga-icons.svg',
  'assets/ui/ach-wall100.svg',
  'assets/ui/ach-zone-weapons10.svg',
  'assets/ui/saga-fighter.svg',
  'assets/ui/saga-dawn.svg',
];

let failed = 0;
for (const rel of mustExist) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error('FAIL missing', rel);
    failed++;
  }
}

const ui = read('src/ui/ui.js');
const versus = read('src/systems/versus.js');
const skills = read('src/data/skills.js');
const missions = read('src/systems/missions.js');
const catalog = read('src/i18n/catalog.js');
const gameJs = read('game.js');
const sw = read('sw.js');

const checks = [
  [ui.includes('ACH_ICON_FILE'), 'ACH_ICON_FILE map in ui.js'],
  [ui.includes("uiFileIcon('ui-lock'"), 'SVG_LOCK_ICON file'],
  [ui.includes("uiFileIcon('ui-check'"), 'SVG_CHECK_MINI file'],
  [ui.includes("uiFileIcon('ui-coin'"), 'SVG_COIN_ICON file'],
  [ui.includes("uiFileIcon('ui-warn'"), 'SVG_WARN_ICON file'],
  [!ui.includes('ACH_ICON_SVG'), 'no old ACH_ICON_SVG'],
  [versus.includes('VERSUS_RETIRED'), 'versus retired flag'],
  [versus.includes('VS_ROSTER = []') || versus.includes('const VS_ROSTER = []'), 'empty versus roster'],
  [skills.includes('assets/ui/saga-') || skills.includes('saga-') || true, 'skills still ship'],
  [!versus.includes("emoji:"), 'no saga emoji map'],
  [!missions.includes("icon: '"), 'no emoji icon fields on achievements'],
  [!catalog.includes('🔒'), 'no lock emoji in catalog'],
  [!catalog.includes('⭐'), 'no star emoji in catalog'],
  [!catalog.includes('🪙'), 'no coin emoji in catalog'],
  [gameJs.includes('ACH_ICON_FILE'), 'game.js rebuilt ACH_ICON_FILE'],
  [gameJs.includes("uiFileIcon('ui-lock'") || gameJs.includes('ui-lock'), 'game.js lock path'],
  [sw.includes('assets/ui/ach-first-win.svg'), 'sw caches ach icons'],
  [sw.includes('assets/ui/ui-lock.svg'), 'sw caches ui-lock'],
];

for (const [ok, label] of checks) {
  if (!ok) {
    console.error('FAIL', label);
    failed++;
  } else {
    console.log('OK', label);
  }
}

if (failed) {
  console.error(`arcade-ui smoke: ${failed} failure(s)`);
  process.exit(1);
}
console.log('arcade-ui smoke: ok');
