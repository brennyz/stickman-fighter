#!/usr/bin/env node
/**
 * Screenshot the factory pixel sheet + 192 zooms via headless Chrome.
 * Run after: node scripts/gen-building-pixels.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/buildings/_preview');

const chromeBin = fs.existsSync('/opt/google/chrome/chrome')
  ? '/opt/google/chrome/chrome'
  : (process.env.CHROME_PATH || 'google-chrome');

function shot(htmlRel, pngName, size) {
  const html = path.join(outDir, htmlRel);
  const png = path.join(outDir, pngName);
  if (!fs.existsSync(html)) {
    console.error('missing', html, '— run npm run pixels:buildings first');
    process.exit(1);
  }
  const userData = path.join(outDir, '.chrome-ud');
  fs.mkdirSync(userData, { recursive: true });
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    `--user-data-dir=${userData}`,
    `--window-size=${size}`,
    `--screenshot=${png}`,
    `file://${html}`,
  ];
  const r = spawnSync(chromeBin, args, { encoding: 'utf8', timeout: 45000 });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (!fs.existsSync(png) || fs.statSync(png).size < 1000) {
    console.error('preview PNG missing or tiny', png);
    process.exit(1);
  }
  console.log('OK', pngName, `(${fs.statSync(png).size} bytes)`);
}

shot('sheet.html', 'sheet.png', '1080,780');
shot('zooms.html', 'zoom.png', '1320,900');
