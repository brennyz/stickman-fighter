#!/usr/bin/env node
/**
 * Smoke: fluid iPad/mobile responsive tokens exist in styles/main.css.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

must(/--ui-rail:/.test(css), 'missing --ui-rail token');
must(/--ui-rail-wide:/.test(css), 'missing --ui-rail-wide token');
must(/--type-tile:/.test(css), 'missing --type-tile token');
must(/--type-caption:/.test(css), 'missing --type-caption token');
must(/--touch-min:/.test(css), 'missing --touch-min token');
must(/width:\s*var\(--ui-rail\)/.test(css), 'menu containers should use var(--ui-rail)');
must(/@media \(min-width: 768px\)/.test(css), 'missing tablet ≥768 breakpoint');
must(/@media \(min-width: 1024px\) and \(orientation: landscape\)/.test(css), 'missing iPad landscape breakpoint');
must(/@media \(orientation: landscape\) and \(max-height: 500px\)/.test(css), 'missing phone-landscape density rule');
must(/\.char-saga-bar button[\s\S]*min-height:\s*var\(--touch-min\)/.test(css)
  || /min-height:\s*var\(--touch-min\)[\s\S]*\.char-saga-bar/.test(css)
  || /char-saga-bar button \{[\s\S]*min-height:var\(--touch-min\)/.test(css),
  'saga buttons should honor --touch-min');
must(/clamp\(/.test(css), 'expected clamp() fluid type');

const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const rev = storage.match(/SW_CACHE_REV\s*=\s*(\d+)/);
const cache = sw.match(/stickfighter-app-v(\d+)/);
must(rev && cache && rev[1] === cache[1], `SW mismatch storage=${rev && rev[1]} sw=${cache && cache[1]}`);

console.log('SMOKE_OK responsive tokens + tablet/phone breakpoints');
