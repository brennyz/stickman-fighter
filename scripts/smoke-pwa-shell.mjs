#!/usr/bin/env node
/**
 * Smoke: PWA shell — SW network-first, canonical offline keys, install play-safe guards.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const install = fs.readFileSync(path.join(root, 'install.js'), 'utf8');
const loop = fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const speel = fs.readFileSync(path.join(root, 'speel.html'), 'utf8');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const rev = storage.match(/SW_CACHE_REV\s*=\s*(\d+)/);
const cache = sw.match(/stickfighter-app-v(\d+)/);
must(rev && cache && rev[1] === cache[1], `SW mismatch storage=${rev && rev[1]} sw=${cache && cache[1]}`);

const expect = index.match(/__SF_EXPECT_REV\s*=\s*(\d+)/);
must(expect && expect[1] === rev[1], `handshake mismatch __SF_EXPECT_REV=${expect && expect[1]} SW=${rev[1]}`);

const landing = ['./speel.html', './ipad.html', './android.html', './index.html', './game.js', './install.js'];
for (const asset of landing) {
  must(sw.includes(asset), `sw.js ASSETS missing ${asset}`);
}

must(/function isNetworkFirstPath/.test(sw), 'missing isNetworkFirstPath');
must(/speel\.html/.test(sw) && /index\.html/.test(sw), 'network-first paths missing HTML shells');
must(/offlineFallbackHtml/.test(sw), 'missing offlineFallbackHtml');
must((sw.match(/p\.endsWith\('\/LIVE-LINK\.txt'\)/g) || []).length === 1,
  'LIVE-LINK.txt network-first check should appear once');
must(/c\.put\('\.\/speel\.html'/.test(sw), 'missing canonical speel.html cache put');
must(/c\.put\('\.\/game\.js'/.test(sw), 'missing canonical game.js cache put');

const installHandler = sw.match(/addEventListener\(\s*'install'[\s\S]*?addEventListener\(\s*'activate'/);
must(installHandler && !/skipWaiting/.test(installHandler[0]),
  'install must not skipWaiting — updates wait for SF_SKIP_WAITING (no mid-fight claim)');
must(/SF_SKIP_WAITING/.test(sw) && /self\.skipWaiting\(\)/.test(sw),
  'skipWaiting must remain available via SF_SKIP_WAITING');

must(/needsFreshJs/.test(install), 'install.js missing needsFreshJs');
must(/safeToReload/.test(install), 'install.js missing safeToReload');
must(/busyPlaying/.test(install), 'install.js missing busyPlaying');
must(/toastIfHub/.test(install), 'install.js missing toastIfHub (no update toast during fight)');
must(/updateViaCache:\s*'none'/.test(install), 'install.js should use updateViaCache none');

must(/__sfSafeToReload/.test(loop), 'loop.js missing __sfSafeToReload');
must(/gamblePending/.test(loop), 'loop.js missing gamblePending in safe reload');
must(/function netUpdateOnHub/.test(loop), 'loop.js missing netUpdateOnHub');
must(/sw-update-wait/.test(loop), 'loop.js missing wait-banner class for in-fight updates');
must(/laadt in het menu/.test(loop), 'update-during-play copy should promise the menu, not a tap');
must(!/HTML\/game via netwerk/.test(loop), 'online banner must not dump HTML/network jargon');

const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
must(/#netStatus\.sw-update[^}]*pointer-events:\s*auto/.test(css),
  'tappable update banner needs pointer-events:auto (base #netStatus is none)');
must(/#netStatus\.sw-update[^}]*bottom:/.test(css),
  'update banner must dock to the bottom so it does not cover the HOME logo');
must(/#netStatus\.sw-update-wait/.test(css), 'css missing sw-update-wait');
must(/body\.is-playing #netStatus\.sw-update/.test(css),
  'update banner during play must hide so it does not crowd the HUD');
must(/parseInt\(sessionStorage\.getItem\(key\)/.test(index),
  'nukeStale must count retries instead of locking after one failed attempt');
must(/n >= 2/.test(index), 'nukeStale must allow a second stale-cache retry');
must(/try \{ wireNetStatusTap\(\); \}/.test(loop),
  'update banner tap must bind at parse, not only after bootGame');
must(/setTimeout\(\(\) => finish\(false\), 2500\)/.test(install) || /2500/.test(install),
  'applySwUpdate must fail fast so forceFreshVersion can nuke a stuck worker');
must(!/tik de gouden balk/.test(install),
  'update toast must not send players to a hidden gold bar');
must(/net\.updateApplying/.test(install),
  'auto-apply on HOME must toast net.updateApplying');
must(/id="btnForceFresh"/.test(index) && index.indexOf('id="settingsHelpFold"') < index.indexOf('id="btnForceFresh"'),
  'Verse versie must stay in Options Help');
must(index.indexOf('id="btnForceFresh"') < index.indexOf('id="settingsDiagBlock"'),
  'Verse versie must sit before the hidden diagnostic block');

must(/id="installCacheStatus"/.test(index), 'install screen must show cache-ready line');
must(!/Sluit Safari/.test(index), 'install done-copy must not assume Safari');

must(/serviceWorker\.register/.test(speel), 'speel.html should register SW for share-link installs');
must(/sessionStorage\.setItem\('sf_share_url'/.test(speel), 'speel.html should cache share URL for offline');
must(/offlineHint/.test(speel), 'speel.html missing offline hint');
must(/id="btnPlay"/.test(speel) && /▶ SPELEN/.test(speel), 'speel.html missing primary SPELEN');
must(/id="installFold"/.test(speel) && /<details/.test(speel), 'speel.html should fold install steps');
const playAt = speel.indexOf('id="btnPlay"');
const foldAt = speel.indexOf('id="installFold"');
must(playAt !== -1 && foldAt !== -1 && playAt < foldAt, 'SPELEN must appear before install fold');

console.log('SMOKE_OK pwa-shell rev=' + rev[1]);
