#!/usr/bin/env node
/**
 * Smoke: index.html tag balance + play canvas must be a direct <body> child.
 *
 * Achtergrond: een ontbrekende </div> liet #charSelectScreen openstaan, waardoor
 * elk scherm daarna — inclusief <canvas id="game"> — in een display:none container
 * belandde. Gevolg: adventure "speelde" wel maar het canvas kreeg 0x0 layout
 * (het beruchte blauwe scherm).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');

function fail(msg) {
  console.error('SMOKE_FAIL', msg);
  process.exit(1);
}

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
  'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'stop', 'use',
]);

const clean = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<script\b[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[\s\S]*?<\/style>/gi, '');

const lineOf = (pos) => clean.slice(0, pos).split('\n').length;

const stack = [];
const problems = [];
const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
let m;
while ((m = tagRe.exec(clean)) !== null) {
  const [, closing, rawTag, attrs, selfClose] = m;
  const tag = rawTag.toLowerCase();
  if (VOID.has(tag) || selfClose) continue;
  if (!closing) {
    const id = /id="([^"]+)"/.exec(attrs);
    stack.push({ tag, id: id ? id[1] : null, line: lineOf(m.index) });
    continue;
  }
  if (stack.length && stack[stack.length - 1].tag === tag) {
    stack.pop();
    continue;
  }
  const idx = stack.map((s) => s.tag).lastIndexOf(tag);
  if (idx === -1) {
    problems.push(`stray </${tag}> at line ${lineOf(m.index)}`);
  } else {
    const unclosed = stack.slice(idx + 1)
      .map((s) => `<${s.tag}${s.id ? '#' + s.id : ''}> line ${s.line}`)
      .join(', ');
    problems.push(`</${tag}> at line ${lineOf(m.index)} closes over unclosed: ${unclosed}`);
    stack.length = idx;
  }
}
if (stack.length) {
  problems.push('never closed: ' + stack
    .map((s) => `<${s.tag}${s.id ? '#' + s.id : ''}> line ${s.line}`)
    .join(', '));
}
if (problems.length) fail('index.html tag balance — ' + problems.join(' | '));

const canvasIdx = html.indexOf('<canvas id="game"');
if (canvasIdx === -1) fail('missing <canvas id="game">');

const before = html.slice(0, canvasIdx);
const openScreens = (before.match(/<div id="[^"]+" class="screen\b/g) || []).length;
const bodyOpen = before.lastIndexOf('<body');
if (bodyOpen === -1) fail('missing <body>');

// Elke .screen die vóór het canvas opent moet ook weer gesloten zijn: als er
// een openstaat, ligt het canvas in een display:none container.
const screenStack = [];
const scoped = before.slice(bodyOpen).replace(/<!--[\s\S]*?-->/g, '');
const divRe = /<div\b([^>]*)>|<\/div>/g;
let d;
while ((d = divRe.exec(scoped)) !== null) {
  if (d[0] === '</div>') screenStack.pop();
  else screenStack.push(/class="[^"]*\bscreen\b/.test(d[1] || '') ? 'screen' : 'div');
}
const stillOpen = screenStack.filter((x) => x === 'screen').length;
if (stillOpen > 0 || screenStack.length > 0) {
  fail(`<canvas id="game"> is nested ${screenStack.length} div(s) deep (${stillOpen} .screen) — must be a direct <body> child`);
}

console.log(`SMOKE_OK index.html balanced · canvas#game direct in <body> · ${openScreens} screens before it`);
