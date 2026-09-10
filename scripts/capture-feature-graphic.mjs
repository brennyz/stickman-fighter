#!/usr/bin/env node
/**
 * Play feature graphic 1024×500 from docs/store/feature-graphic.html
 *
 *   npm run store:feature
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = path.join(root, 'docs/store/feature-graphic.html');
const outDir = path.join(root, 'docs/store/screenshots');
const out = path.join(outDir, 'play-feature-1024x500.png');
const chrome = [
  process.env.CHROME_PATH,
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].find((p) => p && fs.existsSync(p));

if (!chrome) {
  console.error('FEATURE_FAIL no chrome — set CHROME_PATH');
  process.exit(1);
}
if (!fs.existsSync(html)) {
  console.error('FEATURE_FAIL missing', html);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const tmp = '/tmp/sf-feature-chrome';
fs.mkdirSync(tmp, { recursive: true });

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--user-data-dir=${tmp}`,
  '--hide-scrollbars',
  '--window-size=1024,500',
  `--screenshot=${out}`,
  '--default-background-color=0A0D18',
  `file://${html}`,
];

await new Promise((resolve, reject) => {
  const p = spawn(chrome, args, { stdio: 'inherit' });
  const t = setTimeout(() => {
    p.kill();
    if (fs.existsSync(out)) resolve();
    else reject(new Error('chrome timeout'));
  }, 25000);
  p.on('exit', () => {
    clearTimeout(t);
    if (fs.existsSync(out)) resolve();
    else reject(new Error('no screenshot'));
  });
});

const st = fs.statSync(out);
console.log(`FEATURE_OK ${out} (${st.size} bytes)`);
console.log('Upload dit in Play Console → Store listing → Feature graphic');
