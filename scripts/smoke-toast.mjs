#!/usr/bin/env node
/**
 * Toast/UI polish (2026-09-14): queue, a11y, leftover i18n, Android-readable CSS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function must(cond, msg) {
  if (!cond) {
    console.error('SMOKE_FAIL', msg);
    process.exit(1);
  }
}

const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = fs.readFileSync(path.join(root, 'src/boot/start.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'src/core/storage.js'), 'utf8');
const built = fs.existsSync(path.join(root, 'game.js'))
  ? fs.readFileSync(path.join(root, 'game.js'), 'utf8')
  : '';

must(/id="toastHost"[^>]*aria-live="polite"/.test(index), 'toastHost missing aria-live=polite');
must(/id="toastHost"[^>]*role="status"/.test(index), 'toastHost missing role=status');

must(/_toastQ/.test(ui), 'toast queue missing');
must(/clearToasts\(/.test(ui), 'clearToasts missing');
must(/_dismissToast\(/.test(ui), 'tap-dismiss missing');
must(/_resolveToastText\(/.test(ui), 'raw-key sanitizer missing');
must(!/host\.replaceChildren/.test(ui), 'toast must not wipe the host (boot-fail + queue)');
must(!/Eerst gevecht afmaken of pauzeren/.test(ui), 'hardcoded finishFight leftover');
must(!/Niet tijdens gevecht/.test(ui), 'hardcoded notDuringCombat leftover');

must(/finishFight:/.test(catalog), 'catalog missing toast.finishFight');
must(/notDuringCombat:/.test(catalog), 'catalog missing toast.notDuringCombat');
must(/unknownMode:/.test(catalog), 'catalog missing toast.unknownMode');
must(/saveRestoredSafe:/.test(catalog), 'catalog missing toast.saveRestoredSafe');
must(/pagesLinkCopied:/.test(catalog), 'catalog missing toast.pagesLinkCopied');
must(/liteFxHint:/.test(catalog), 'catalog missing toast.liteFxHint');
must(/tik een melding weg/.test(catalog), 'NL welcome should mention tap-to-dismiss');

must(/toast-ok/.test(css) && /toast-danger/.test(css), 'toast tone CSS missing');
must(/body\.is-playing #toastHost/.test(css), 'play-mode toast placement missing');
must(/pointer-events:\s*auto/.test(css.match(/\.toast \{[\s\S]*?\}/)?.[0] || ''), 'toast must be tappable');

must(/t\('toast\.unknownMode'\)/.test(start), 'unknownMode must use i18n');
must(/t\('toast\.noBackup'\)/.test(start), 'backup toasts must use i18n');
must(/toastT\(/.test(storage), 'storage leftover toasts should use toastT');
must(/APP_VERSION = '1\.18\.154'/.test(storage), 'version should be 1.18.154');
must(/SW_CACHE_REV = 364/.test(storage), 'SW rev should be 364');

if (built) {
  must(/_toastQ/.test(built), 'built game.js missing toast queue');
  must(/aria-live/.test(index), 'index toast a11y missing after build');
}

console.log('SMOKE_OK toast-ui');
