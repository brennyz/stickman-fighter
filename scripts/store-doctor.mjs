#!/usr/bin/env node
/**
 * Store doctor — wat zit er in de repo, wat moet jij nog doen
 * vóór Google Play / Apple App Store. Geen secrets, geen account-calls.
 *
 *   npm run store:doctor
 *   node scripts/store-doctor.mjs
 *   node scripts/store-doctor.mjs --html /tmp/store-doctor.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = [];
let fails = 0;
let warns = 0;

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
function read(rel) {
  try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return ''; }
}
function readJson(rel) {
  try { return JSON.parse(read(rel)); } catch { return null; }
}
function pngCount(dirRel) {
  const dir = path.join(root, dirRel);
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).length;
}
function fenceCopy(md) {
  const cut = String(md || '').split(/## Claims om níet|## Do not claim/i)[0];
  return [...cut.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n');
}
function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  const next = process.argv[i + 1];
  if (!next || next.startsWith('-')) return '';
  return next;
}

function add(track, status, title, detail) {
  rows.push({ track, status, title, detail });
  if (status === 'fail') fails++;
  if (status === 'warn') warns++;
}

const pkg = readJson('package.json') || {};
const appFromSrc = (read('src/core/storage.js').match(/APP_VERSION = '([^']+)'/) || [])[1]
  || pkg.version || '?';
const swRev = (read('src/core/storage.js').match(/SW_CACHE_REV = (\d+)/) || [])[1] || '?';
const twa = readJson('native/android/twa-manifest.json') || {};
const listingNl = read('docs/store/listing-nl.md');
const listingEn = read('docs/store/listing-en.md');
const review = read('docs/store/review-notes.md');
const privacy = read('privacy.html');
const shotsScript = read('scripts/capture-store-screenshots.mjs');
const shots = pngCount('docs/store/screenshots');
const hasIosXcode = exists('native/ios/ios') || exists('ios/App');
const hasKeystore = exists('native/android/signing/upload-keystore.jks')
  || exists('native/android/signing/keystore.properties');

const marketing = fenceCopy(listingNl) + '\n' + fenceCopy(listingEn);
const versusLie = /versus|2 spelers|2-player|2 player|2spelers/i.test(marketing);
const shotsVersus = /04-versus|versus-ready|versusScreen/i.test(shotsScript);
const iapLie = /in-app purchase|koop coins|battle pass|IAP/i.test(marketing)
  && !/geen in-app|no in-app|geen IAP|no IAP/i.test(marketing);
const shortNl = (listingNl.match(/## Korte beschrijving[\s\S]*?```[^\n]*\n([\s\S]*?)```/) || [])[1] || '';
const shortEn = (listingEn.match(/## Short description[\s\S]*?```[^\n]*\n([\s\S]*?)```/) || [])[1] || '';
const shortNlLen = shortNl.trim().length;
const shortEnLen = shortEn.trim().length;
const expectCode = Number(String(appFromSrc).replace(/\./g, ''));

/* ---- PWA (soft live) ---- */
add('pwa', exists('speel.html') ? 'ok' : 'fail', 'Deel-URL speel.html',
  'https://brennyz.github.io/stickman-fighter/speel.html — dit is wat je nu al deelt');
add('pwa', exists('privacy.html') && /lokale save|local/i.test(privacy) ? 'ok' : 'fail',
  'Privacy policy live',
  'https://brennyz.github.io/stickman-fighter/privacy.html — stores eisen een publieke URL');
add('pwa',
  exists('icons/icon-180.png') && exists('icons/icon-192.png') && exists('icons/icon-512.png')
    ? 'ok' : 'fail',
  'PWA-iconen 180/192/512',
  'icons/ — Add to Home Screen + bron voor store-icon (Play 512, Apple later 1024)');
add('pwa', exists('sw.js') && exists('manifest.webmanifest') ? 'ok' : 'fail',
  'Service worker + web manifest',
  `SW v${swRev} · app ${appFromSrc}`);
add('pwa', 'ok', 'Website = het spel (geen store nodig)',
  'speel.html is genoeg om te spelen en te delen. Play en App Store zijn extra, niet verplicht.');
add('pwa', 'you', 'Device-QA op je telefoon',
  'Chrome → speel.html → toevoegen aan startscherm → 5 min avontuur + Verse versie. Zie docs/store/device-qa.md');

/* ---- Play ---- */
add('play', exists('native/android/twa-manifest.json') ? 'ok' : 'fail',
  'TWA-scaffold (Bubblewrap)',
  `package ${twa.packageId || '?'} · start ${twa.startUrl || '?'}`);
add('play', exists('native/android/BUILD.md') ? 'ok' : 'fail',
  'Build-kaart APK/AAB',
  'native/android/BUILD.md — JDK + Android Studio + Bubblewrap op jouw pc');
add('play',
  twa.appVersionName && twa.appVersionName === appFromSrc ? 'ok' : 'warn',
  'TWA versionName = app-versie',
  `twa ${twa.appVersionName || '—'} · code ${appFromSrc}`);
add('play',
  twa.appVersionCode && Number(twa.appVersionCode) === expectCode ? 'ok' : 'warn',
  `TWA versionCode = ${appFromSrc} → ${Number.isFinite(expectCode) ? expectCode : '?'}`,
  `nu ${twa.appVersionCode || '—'} (Play eist unieke, stijgende codes per upload)`);
add('play', exists('docs/store/listing-nl.md') && exists('docs/store/listing-en.md') ? 'ok' : 'fail',
  'Listing-drafts NL/EN',
  'Kopieer naar Play Console — niet automatisch geüpload');
add('play',
  shortNlLen > 0 && shortNlLen <= 80 && shortEnLen > 0 && shortEnLen <= 80 ? 'ok' : 'fail',
  'Korte beschrijving ≤ 80 tekens',
  `NL ${shortNlLen} · EN ${shortEnLen} (Play knipt af)`);
add('play', exists('docs/store/data-safety-play.md') ? 'ok' : 'fail',
  'Data safety-draft',
  'docs/store/data-safety-play.md → Play Console vragenlijst');
add('play', exists('docs/store/content-rating-iarc.md') ? 'ok' : 'fail',
  'IARC / leeftijd-draft',
  'Jij start de IARC-vragen in Play Console');
add('play', shots >= 8 ? 'ok' : (shots > 0 ? 'warn' : 'you'),
  `Store-screenshots (${shots} PNG)`,
  shots ? 'docs/store/screenshots/ — handmatig in Console plakken'
    : 'npm run store:shots  (Chrome nodig; PNG’s blijven lokaal / gitignored)');
add('play', hasKeystore ? 'warn' : 'ok',
  hasKeystore
    ? 'Keystore staat in de werkmap — niet committen'
    : 'Geen keystore in git (goed)',
  'Jij maakt signing/upload-keystore.jks één keer op de pc. Nooit in GitHub.');
add('play', 'you', 'Alleen als je een Play-icoon wilt: Console-account',
  'Niet verplicht. https://play.google.com/console — eenmalig, goedkoper/sneller dan Apple');
add('play', 'you', 'Alleen als je Play wilt: AAB + Internal testing',
  'Op de pc: npm run android:init → npm run android:build → APK op telefoon → AAB naar Internal testing → vrienden → productie');

/* ---- App Store ---- */
add('ios', exists('native/ios/README.md') && exists('native/ios/GUIDELINE-4.2.md') ? 'ok' : 'fail',
  'iOS-docs + Guideline 4.2-notities',
  'native/ios/ — Capacitor stubs, nog geen Xcode-project');
add('ios', exists('native/ios/APPSTORE-CHECKLIST.md') ? 'ok' : 'fail',
  'App Store-checklist (wat het inhoudt)',
  'native/ios/APPSTORE-CHECKLIST.md — geld, Mac, 4.2, TestFlight, review');
add('ios', exists('docs/store/privacy-nutrition-ios.md') ? 'ok' : 'fail',
  'App Privacy nutrition-draft',
  'Geen tracking, geen account — herijken zodra native plugins erin zitten');
add('ios', exists('docs/store/review-notes.md') && /no login/i.test(review) ? 'ok' : 'fail',
  'Review-notes draft',
  'docs/store/review-notes.md → App Store Connect → App Review Information');
add('ios', hasIosXcode ? 'ok' : 'you',
  hasIosXcode ? 'Xcode-project aanwezig' : 'Nog geen Xcode-project',
  'Later op een Mac: npx cap add ios · bundled www (niet alleen GitHub Pages-URL)');
add('ios', 'you', 'Alleen als je App Store wilt: Developer (€99 / jaar)',
  'Niet verplicht om te spelen. Zonder dit: geen Connect, geen TestFlight, geen review. Jij betaalt — de agent kan dit niet.');
add('ios', 'you', 'Alleen als je App Store wilt: Mac + Xcode + signing',
  'Certificates, provisioning, team-id. Nooit .p12 / API-keys in de repo.');
add('ios', 'you', 'Alleen als je App Store wilt: native extras (4.2)',
  'Minimaal: lokale www-bundle + haptics + splash + landscape-lock. Alleen “website in WebView” = afkeur.');
add('ios', 'you', 'Alleen als je App Store wilt: Connect + TestFlight + Review',
  'Icon 1024, screenshots iPhone+iPad, privacy-URL, review notes, dan wachten op Apple.');

/* ---- Honesty ---- */
add('copy', versusLie ? 'fail' : 'ok',
  versusLie ? 'Listing claimt nog versus / 2 spelers' : 'Listing claimt geen versus',
  'Versus is retired — store-tekst = avontuur / training / arcade');
add('copy', shotsVersus ? 'fail' : 'ok',
  shotsVersus ? 'Screenshot-script heeft nog een versus-scene' : 'Screenshot-scenes zonder versus',
  'npm run store:shots → menu, levels, avontuur, arcade-hub');
add('copy', iapLie ? 'fail' : 'ok',
  iapLie ? 'Listing lijkt IAP te claimen' : 'Listing claimt geen IAP-winkel',
  'Gratis, geen coin shop');

/* ---- print ---- */
const mark = { ok: 'OK  ', warn: 'LET ', fail: 'FOUT', you: 'JIJ ' };
const tracks = [
  ['pwa', 'A · Website (PWA — dit ís het spel)'],
  ['play', 'B · Google Play (optioneel)'],
  ['ios', 'C · Apple App Store (optioneel)'],
  ['copy', 'Listing-eerlijkheid'],
];

const header = [
  '',
  '════════ STORE DOCTOR — Stickman Fighter ════════',
  `app ${appFromSrc} · SW v${swRev} · package ${twa.packageId || '?'}`,
  '',
];

const lines = [...header];
for (const [id, title] of tracks) {
  lines.push(`── ${title} ──`);
  for (const r of rows.filter((x) => x.track === id)) {
    lines.push(`  [${mark[r.status] || r.status}] ${r.title}`);
    if (r.detail) lines.push(`           ${r.detail}`);
  }
  lines.push('');
}

lines.push('── Wat dit inhoudt ──');
lines.push('  De website IS het spel. Geen Play-app, geen App Store-app — en dat hoeft ook niet.');
lines.push('  Delen = speel.html. “Zet op startscherm” = bladwijzer, geen store-listing.');
lines.push('  Play is extra (icoon in de Play Store). App Store is extra (apart iOS-programma).');
lines.push('  Agent = drafts/scripts. Jij = alleen store-accounts als je die extra wilt.');
lines.push('');
lines.push('── Als je tóch App Store wilt (optioneel — jij, niet de agent) ──');
lines.push('  1. Apple Developer Program — €99/jaar, Apple-ID, 2FA.');
lines.push('  2. Mac met Xcode — signing, simulator, IPA. Deze cloud-VM is geen Mac.');
lines.push('  3. Capacitor iOS + bundled www (niet alleen GitHub Pages-URL).');
lines.push('  4. Native extras: haptics + splash + landscape — anders 4.2-afkeur.');
lines.push('  5. App Store Connect: listing, 1024-icon, iPhone+iPad shots, privacy-URL.');
lines.push('  6. TestFlight intern → Submit for Review → wachten op Apple.');
lines.push('  Lees: native/ios/APPSTORE-CHECKLIST.md');
lines.push('');
lines.push('── Volgende commando’s ──');
lines.push('  npm run store:shots     # screenshots (Chrome)');
lines.push('  npm run android:init    # eenmalig TWA-project op de pc');
lines.push('  npm run android:build   # APK/AAB — zie native/android/BUILD.md');
lines.push('  STORE-LAUNCH.md         # volledige stappen A → B → C');
lines.push('');

const youN = rows.filter((r) => r.status === 'you').length;
lines.push(`samenvatting: ${fails} fout · ${warns} let-op · ${youN} stappen van jou`);
if (fails) lines.push('STORE_DOCTOR_FAIL');
else lines.push('STORE_DOCTOR_OK');

console.log(lines.join('\n'));

const htmlArg = argValue('--html');
if (htmlArg !== null) {
  const htmlPath = htmlArg
    ? path.resolve(htmlArg)
    : path.join(root, 'docs/store/doctor-report.html');
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, renderHtml({
    appFromSrc, swRev, packageId: twa.packageId || '?', rows, fails, warns, youN,
  }), 'utf8');
  console.log(`\nHTML: ${htmlPath}`);
}

if (fails) process.exit(1);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderHtml({ appFromSrc: ver, swRev: sw, packageId, rows: all, fails: f, warns: w, youN: y }) {
  const cls = { ok: 'ok', warn: 'warn', fail: 'fail', you: 'you' };
  const label = { ok: 'Klaar in repo', warn: 'Let op', fail: 'Fout in repo', you: 'Jij moet dit' };
  const sections = tracks.map(([id, title]) => {
    const items = all.filter((x) => x.track === id).map((r) => `
      <li class="${cls[r.status] || ''}">
        <span class="tag">${escapeHtml(label[r.status] || r.status)}</span>
        <div>
          <strong>${escapeHtml(r.title)}</strong>
          <p>${escapeHtml(r.detail || '')}</p>
        </div>
      </li>`).join('');
    return `<section><h2>${escapeHtml(title)}</h2><ul>${items}</ul></section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Store doctor — wat er moet gebeuren</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; font: 16px/1.45 "DejaVu Sans", "Liberation Sans", Arial, sans-serif; background: #0a0d18; color: #e8ecff; }
  header { padding: 28px 24px 12px; border-bottom: 1px solid #2a3358; }
  header p { color: #9aa3c7; margin: 8px 0 0; }
  main { max-width: 880px; margin: 0 auto; padding: 8px 24px 48px; }
  h1 { margin: 0; font-size: 1.6rem; }
  h2 { margin: 28px 0 10px; font-size: 1.05rem; color: #c9d2ff; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { display: flex; gap: 12px; padding: 12px 14px; margin: 0 0 8px; background: #151b33; border-radius: 10px; }
  .tag { flex: 0 0 8.4rem; font-size: 12px; font-weight: 700; letter-spacing: .02em; padding: 4px 8px; border-radius: 6px; height: fit-content; text-align: center; white-space: nowrap; }
  .ok .tag { background: #143d2a; color: #7dffb3; }
  .warn .tag { background: #3d3414; color: #ffd56a; }
  .fail .tag { background: #3d1418; color: #ff8a96; }
  .you .tag { background: #1b2a4a; color: #8cbcff; }
  li p { margin: 4px 0 0; color: #9aa3c7; font-size: 14px; }
  .meaning, .next { background: #12182c; border: 1px solid #2a3358; border-radius: 12px; padding: 16px 18px; margin: 20px 0; }
  .meaning h2, .next h2 { margin-top: 0; }
  .meaning ol { margin: 0; padding-left: 1.2rem; color: #c9d2ff; }
  .meaning li { display: list-item; background: none; padding: 4px 0; margin: 0; }
  footer { color: #9aa3c7; font-size: 13px; }
  code { font-family: ui-monospace, monospace; font-size: 13px; }
</style>
</head>
<body>
<header>
  <h1>Store doctor — Stickman Fighter</h1>
  <p>app ${escapeHtml(ver)} · SW v${escapeHtml(sw)} · ${escapeHtml(packageId)} · ${f} fout · ${w} let-op · ${y} stappen van jou</p>
</header>
<main>
  <div class="meaning">
    <h2>Wat dit inhoudt</h2>
    <p>Het spel is een <strong>website</strong> (PWA). Dat is <strong>geen</strong> Google Play-app en <strong>geen</strong> App Store-app — en dat <strong>hoeft ook niet</strong>. Delen = <code>speel.html</code>.</p>
    <p>Een store-icoon is extra. Play wrapt dezelfde site. App Store eist een apart iOS-programma (Mac, €99, 4.2).</p>
    <ol>
      <li><strong>Niet doen</strong> — blijven delen via <code>speel.html</code>. Geen account, geen €99.</li>
      <li><strong>Optioneel Play</strong> — icoon in de Play Store; wrapt dezelfde site. Jij + pc.</li>
      <li><strong>Optioneel App Store</strong> — apart iOS-programma: €99, Mac, 4.2, TestFlight.</li>
    </ol>
    <p>Lees <code>STORE-LAUNCH.md</code> en <code>native/ios/APPSTORE-CHECKLIST.md</code> alleen als je een store wilt.</p>
  </div>
  ${sections}
  <div class="next">
    <h2>Volgende commando’s</h2>
    <p><code>npm run store:shots</code> · <code>npm run android:init</code> · <code>npm run android:build</code></p>
  </div>
  <footer>Gegenereerd door <code>npm run store:doctor -- --html</code>. Geen secrets, geen account-calls.</footer>
</main>
</body>
</html>`;
}
