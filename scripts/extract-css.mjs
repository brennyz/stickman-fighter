#!/usr/bin/env node
/** Sync styles/main.css from index.html inline block (legacy) or verify link exists. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const cssPath = path.join(root, 'styles', 'main.css');
const html = fs.readFileSync(htmlPath, 'utf8');

if (html.includes('<link rel="stylesheet" href="styles/main.css')) {
  if (!fs.existsSync(cssPath)) {
    console.error('extract-css: styles/main.css missing');
    process.exit(1);
  }
  console.log('CSS_OK styles/main.css', fs.readFileSync(cssPath, 'utf8').split('\n').length, 'lines');
  process.exit(0);
}

const m = html.match(/<style>([\s\S]*?)<\/style>/);
if (!m) {
  console.error('extract-css: no <style> block and no external link');
  process.exit(1);
}
fs.mkdirSync(path.dirname(cssPath), { recursive: true });
fs.writeFileSync(cssPath, m[1].trimStart() + '\n');
console.log('EXTRACT_OK styles/main.css');
