#!/usr/bin/env node
/**
 * Toasts: één zichtbaar, rest in de rij. Android = dezelfde HTML (geen native Toast).
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
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const built = fs.existsSync(path.join(root, 'game.js'))
  ? fs.readFileSync(path.join(root, 'game.js'), 'utf8')
  : '';

must(/_pumpToast/.test(ui) && /_showToastNow/.test(ui), 'UI toast queue helpers missing');
must(/_toastQ/.test(ui), 'toast queue array missing');
must(/sf-boot-fail/.test(ui), 'queue must not wipe Android/PWA boot-fail refresh toast');
must(/q\.length >= 4/.test(ui), 'toast queue must cap flood');
must(/levelScreen/.test(missions) && /welcome/.test(missions), 'welcome toast must skip island screen');
must(!/host\.innerHTML = ''/.test(ui.match(/if \(id === 'levelScreen'\)[\s\S]{0,400}/)?.[0] || ''),
  'opening island must not wipe the toast host');
must(/safe-area-inset-top/.test(css), 'toast CSS needs Android safe-area');
must(/pointer-events:none/.test(css) || /pointer-events: none/.test(css), 'toasts must not block Android taps');
must(/text-size-adjust:100%/.test(css), 'Android must not inflate toast text');
must(!/body:has\(#levelScreen\.active\) #toastHost/.test(css), 'island screen must still show queued toasts');

if (built) {
  must(/_pumpToast/.test(built), 'built game.js missing toast queue');
  must(/_showToastNow/.test(built), 'built game.js missing _showToastNow');
}

console.log('SMOKE_OK toast-queue');
