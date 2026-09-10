#!/usr/bin/env node
/**
 * Android GO — wat jij op de pc doet. Geen secrets, geen Play-login.
 *
 *   npm run android:go
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function which(cmd) {
  const r = spawnSync('bash', ['-lc', `command -v ${cmd}`], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const java = which('java');
const bubble = which('bubblewrap');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
const keystore = exists('native/android/signing/upload-keystore.jks');
const props = exists('native/android/signing/keystore.properties');

const rows = [
  ['Repo TWA-scaffold', exists('native/android/twa-manifest.json') ? 'OK' : 'FOUT',
    'native/android/twa-manifest.json · com.brennyz.stickmanfighter'],
  ['Listing + data safety + IARC drafts',
    exists('docs/store/listing-nl.md') && exists('docs/store/data-safety-play.md') ? 'OK' : 'FOUT',
    'docs/store/ — plakken in Play Console'],
  ['Java (JDK 17+)', java ? 'OK' : 'JIJ',
    java || 'Installeer JDK 17+ — https://adoptium.net/'],
  ['Bubblewrap CLI', bubble ? 'OK' : 'JIJ',
    bubble || 'npm i -g @bubblewrap/cli'],
  ['ANDROID_HOME / SDK', sdk && fs.existsSync(sdk) ? 'OK' : 'JIJ',
    sdk || 'Android Studio installeren en ANDROID_HOME zetten'],
  ['Keystore (lokaal, niet git)', keystore ? 'LET' : 'JIJ',
    keystore
      ? 'signing/upload-keystore.jks staat hier — niet committen, wél offline backup'
      : 'keytool … zie native/android/GO.md stap 3'],
  ['keystore.properties', props ? 'LET' : 'JIJ',
    props ? 'Lokaal aanwezig — niet committen' : 'cp signing/keystore.properties.example …'],
];

console.log('');
console.log('════════ ANDROID GO — Stickman Fighter ════════');
console.log('De website blijft het spel. Dit pad = icoon in de Play Store.');
console.log('');
for (const [title, mark, detail] of rows) {
  console.log(`  [${mark.padEnd(4)}] ${title}`);
  console.log(`           ${detail}`);
}
console.log('');
console.log('── Jouw volgorde ──');
console.log('  0. speel.html op Android Chrome (device-qa.md)');
console.log('  1. play.google.com/console — US$25 eenmalig, geen prepaid');
console.log('  2. Node + JDK 17 + Android Studio + npm i -g @bubblewrap/cli');
console.log('  3. Keystore (GO.md) — backup offline, nooit in git');
console.log('  4. npm run android:init && npm run android:build');
console.log('  5. APK op telefoon · AAB + listing (play-console-stappen.md)');
console.log('  6. Closed testing: 12 testers × 14 dagen → daarna productie');
console.log('  7. URL-balk later: assetlinks op brennyz.github.io apex');
console.log('');
console.log('Kaart: native/android/GO.md');
console.log('');

const fail = rows.some((r) => r[1] === 'FOUT');
if (fail) {
  console.log('ANDROID_GO_FAIL');
  process.exit(1);
}
console.log('ANDROID_GO_OK  (JIJ/LET = stappen op jouw pc, geen repo-fout)');
