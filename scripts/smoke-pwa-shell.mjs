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
must(/c\.put\('\.\/speel\.html'/.test(sw), 'missing canonical speel.html cache put');
must(/c\.put\('\.\/game\.js'/.test(sw), 'missing canonical game.js cache put');

must(/needsFreshJs/.test(install), 'install.js missing needsFreshJs');
must(/safeToReload/.test(install), 'install.js missing safeToReload');
must(/busyPlaying/.test(install), 'install.js missing busyPlaying');
must(/updateViaCache:\s*'none'/.test(install), 'install.js should use updateViaCache none');

must(/__sfSafeToReload/.test(loop), 'loop.js missing __sfSafeToReload');
must(/gamblePending/.test(loop), 'loop.js missing gamblePending in safe reload');

must(/serviceWorker\.register/.test(speel), 'speel.html should register SW for share-link installs');
must(/sessionStorage\.setItem\('sf_share_url'/.test(speel), 'speel.html should cache share URL for offline');
must(/offlineHint/.test(speel), 'speel.html missing offline hint');

console.log('SMOKE_OK pwa-shell rev=' + rev[1]);
