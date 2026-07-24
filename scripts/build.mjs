#!/usr/bin/env node
/** Concat src modules → game.js (legacy global scope, PWA-friendly single bundle). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'src', 'manifest.json');
const outPath = path.join(root, 'game.js');

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
console.log(`BUILD_OK ${files.length} modules → game.js (~${total} lines)`);
