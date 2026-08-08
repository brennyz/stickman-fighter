#!/usr/bin/env node
/**
 * Stability guard:
 * 1) Regression list — symbols that MUST exist if referenced (module-split bugs).
 * 2) Heuristic — bare calls in game loop matching *Idx|*Input|*Gate etc. must be defined.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src', 'manifest.json'), 'utf8'));
const bundle = manifest.map((rel) => fs.readFileSync(path.join(root, rel), 'utf8')).join('\n');

const REGRESSION_MUST_DEFINE = [
  'partBoundaryWaveIdx', 'playerWalkInput',
  'recoverFightHiccup', 'playInputSuppressed', 'rollStageGamble',
  'applyGambleToStage', 'gameUiTimerOk', 'syncPlayLayer', 'forcePlayCanvasVisible',
  'rollZoneWeaponDrop', 'grantZoneBossClearWeapon', 'applyWeaponOnHitEffect',
  'tickWeaponStatusEffects', 'adventureDropZoneForLevel', 'weaponZoneUnlocked',
  /* Shared combat helpers — must not vanish when versus.js is stubbed */
  'padDigitalMove', 'joyMoveAxis', 'applyFighterMove', 'clampFighterX',
  'fighterMoveXBounds', 'refreshA11yUi', 'motionReduced',
];

const CRITICAL_FILES = /^src\/(game|boot|entities)\//;
const GLOBAL_CALL_HEURISTIC = /(?:Idx|Gate|Input|Walk|Boundary|Trait|Loot|Sanitize|Unlocked|Eligible|Persistable|Bonuses|Summary|Preview|Toast|Banner|Sfx|Art|Pool|Roll|Gamble|Tame|Equip|Shard|Upgrade|Achieve|Mission|Repair|Stash|Backup|Export|Import|Hiccup|Recover|Suppress|Onboard|Floater|Spawn|Clear|Tide|Summon|Dex|Pet|Egg|Wave|Level|Stage|Part|Checkpoint)$/;

const OPTIONAL_EXTERNALS = new Set(['techniqueSwooshSfx']);
const SKIP = new Set(['if', 'for', 'while', 'catch', 'typeof', 'return', 'new', 'throw', 'await', 'async', 'function', 'class', 'super', 'this']);

function stripLiterals(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch;
      i++;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
          i += 2;
          let depth = 1;
          while (i < src.length && depth > 0) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') depth--;
            i++;
          }
          continue;
        }
        if (src[i] === q) { i++; break; }
        i++;
      }
      out += ' ';
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function collectDefs(code) {
  const defined = new Set();
  const s = stripLiterals(code);
  for (const m of s.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) defined.add(m[1]);
  for (const m of s.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)\b/g)) defined.add(m[1]);
  for (const m of s.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|\(|[^=;]+\s*=>)/g)) {
    defined.add(m[1]);
  }
  return defined;
}

const stripped = stripLiterals(bundle);
const defined = collectDefs(bundle);
const problems = [];

for (const sym of REGRESSION_MUST_DEFINE) {
  if (!defined.has(sym)) problems.push({ name: sym, file: 'regression-list', line: 0, why: 'missing definition' });
}

for (const rel of manifest) {
  if (!CRITICAL_FILES.test(rel)) continue;
  const code = stripLiterals(fs.readFileSync(path.join(root, rel), 'utf8'));
  const lines = code.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const rawLine = lines[li];
    if (/^\s*(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/.test(rawLine)) continue;
    if (/\bfunction\s+[A-Za-z_$][\w$]*\s*\(/.test(rawLine)) continue;
    for (const m of rawLine.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
      const name = m[1];
      if (SKIP.has(name) || OPTIONAL_EXTERNALS.has(name) || defined.has(name)) continue;
      if (!GLOBAL_CALL_HEURISTIC.test(name)) continue;
      problems.push({ name, file: rel, line: li + 1, why: 'heuristic global call' });
    }
  }
}

const uniq = new Map();
for (const p of problems) {
  if (!uniq.has(p.name)) uniq.set(p.name, p);
}

if (uniq.size) {
  console.error('CHECK_FAIL critical symbols:');
  for (const [name, p] of uniq) {
    console.error(`  ${name} — ${p.why} (${p.file}${p.line ? ':' + p.line : ''})`);
  }
  process.exit(1);
}
console.log(`CHECK_OK critical-symbols — ${REGRESSION_MUST_DEFINE.length} regression guards, ${defined.size} bundle defs`);
