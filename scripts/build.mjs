#!/usr/bin/env node
/** Concat src modules → game.js (legacy global scope, PWA-friendly single bundle). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'src', 'manifest.json');
const outPath = path.join(root, 'game.js');
const indexPath = path.join(root, 'index.html');
const storagePath = path.join(root, 'src', 'core', 'storage.js');
const swPath = path.join(root, 'sw.js');
const pkgPath = path.join(root, 'package.json');

if (!fs.existsSync(manifestPath)) {
  console.error('build: missing src/manifest.json — run node scripts/split-game.mjs first');
  process.exit(1);
}

const files = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const parts = ["'use strict';\n"];
let total = 0;

for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error('build: missing', rel);
    process.exit(1);
  }
  const code = fs.readFileSync(abs, 'utf8');
  total += code.split('\n').length;
  parts.push(`/* --- ${rel} --- */\n`);
  parts.push(code.endsWith('\n') ? code : code + '\n');
}

fs.writeFileSync(outPath, parts.join(''));

const storageSrc = fs.readFileSync(storagePath, 'utf8');
const revMatch = storageSrc.match(/const SW_CACHE_REV = (\d+)/);
const verMatch = storageSrc.match(/const APP_VERSION = '([^']+)'/);
const swRev = revMatch ? revMatch[1] : null;
const appVer = verMatch ? verMatch[1] : null;

if (swRev && fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(/\?v=\d+/g, `?v=${swRev}`);
  if (/__SF_EXPECT_REV\s*=\s*\d+/.test(html)) {
    html = html.replace(/__SF_EXPECT_REV\s*=\s*\d+/, `__SF_EXPECT_REV = ${swRev}`);
  }
  if (appVer && /__SF_EXPECT_APP\s*=\s*'[^']*'/.test(html)) {
    html = html.replace(/__SF_EXPECT_APP\s*=\s*'[^']*'/, `__SF_EXPECT_APP = '${appVer}'`);
  }
  if (appVer) {
    html = html.replace(/v\d+\.\d+\.\d+ · arcade/g, `v${appVer} · arcade`);
  }
  fs.writeFileSync(indexPath, html);
}

if (swRev && fs.existsSync(swPath)) {
  let sw = fs.readFileSync(swPath, 'utf8');
  sw = sw.replace(/const CACHE = 'stickfighter-app-v\d+'/, `const CACHE = 'stickfighter-app-v${swRev}'`);
  fs.writeFileSync(swPath, sw);
}

if (appVer && fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = appVer;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

console.log(`BUILD_OK ${files.length} modules → game.js (~${total} lines)${swRev ? ` · cache v${swRev}` : ''}`);
