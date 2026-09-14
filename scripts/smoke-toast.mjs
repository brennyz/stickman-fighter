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
must(/const APP_VERSION = '/.test(storage), 'APP_VERSION missing');
must(/const SW_CACHE_REV = \d+/.test(storage), 'SW_CACHE_REV missing');

const i18n = fs.readFileSync(path.join(root, 'src/i18n/i18n.js'), 'utf8');
const speel = fs.readFileSync(path.join(root, 'speel.html'), 'utf8');
must(!/Trillen \(iPad\)/.test(index), 'settings HTML still says Trillen (iPad)');
must(!/Grote knoppen \(iPad\)/.test(index), 'settings HTML still says Grote knoppen (iPad)');
must(!/Lite FX \(iPad/.test(index), 'settings HTML still says Lite FX (iPad)');
must(!/FX \+ iOS/.test(index), 'settings HTML still mentions iOS motion');
must(!/id="installIosSteps"/.test(index), 'install iOS steps should be gone');
must(/Android-first/.test(speel) || /stepId = isAndroid/.test(speel), 'speel.html must pick one install platform');
must(!/getElementById\('stepsIos'\)\.classList\.remove/.test(speel), 'must never unhide iPad install from Android JS');
must(!/haptics: 'Trillen \(iPad\)'/.test(i18n), 'i18n settings.haptics still iPad');
must(!/bigTouch: 'Grote knoppen \(iPad\)'/.test(i18n), 'i18n settings.bigTouch still iPad');
must(!/versusSub: 'Lokaal · iPad/.test(i18n), 'menu.versusSub still iPad');
must(!/2P op iPad/.test(catalog), 'catalog d20 tip still iPad');
must(!/handy on iPad/.test(catalog), 'EN catalog still says handy on iPad');
must(!/Android \+ iPad/.test(ui), 'menu play-link still says Android + iPad');
must(!/Safari → Delen/.test(ui), 'hosting hint still teaches Safari Add to Home');
must(!/Hosting & voortgang/.test(index), 'settings still says Hosting');
must(!/Export save/.test(index), 'settings still says Export save');
must(!/Kenney CC0/.test(i18n), 'settings still credits Kenney to players');
must(!/meta\.key stickfighter/.test(index), 'settings still shows save schema key');
must(/id="settingsSaveAutoCard"/.test(index), 'settings auto-save primary card missing');
must(/id="settingsHelpFold"/.test(index), 'settings help fold missing');
must(/id="settingsSaveFold"/.test(index), 'settings offline fold missing');
must(!/id="setPerfLine"/.test(index), 'settings still dumps perf line');
must(index.indexOf('id="settingsSaveAutoCard"') < index.indexOf('id="settingsSaveFold"'), 'auto-save must sit above offline fold');
must(index.indexOf('id="settingsSaveAutoCard"') < index.indexOf('id="langSwitchBar"'), 'auto-save status must sit above Options toggles');
must(index.indexOf('id="settingsHelpFold"') < index.indexOf('id="btnForceFresh"'), 'Verse versie must live in help fold');
must(index.indexOf('id="menuScreen"') < index.indexOf('id="btnInstallApp"') && index.indexOf('id="btnInstallApp"') > index.indexOf('id="settingsHelpFold"'), 'install CTA must leave HOME and live in Options help');
const settingsFn = ui.match(/renderSettings\(\)[\s\S]*?renderPausePerfStrip/)?.[0] || '';
must(!/SW v/.test(settingsFn), 'renderSettings still dumps SW version');
must(!/SAVE_KEY/.test(settingsFn), 'renderSettings still shows SAVE_KEY');
must(!/fps/.test(settingsFn), 'renderSettings still dumps fps');
must(/id="sfTitleGate"/.test(index), 'title gate missing');
must(/id="sfTitleStart"/.test(index), 'title SPELEN button missing');
must(!/id="sfTitleName"/.test(index), 'optional name field must stay off the title gate');
must(/id="sfTitleNote"/.test(index), 'quiet save-on-phone note missing');
must(index.indexOf('id="sfTitleStart"') < index.indexOf('id="sfTitleNote"'), 'SPELEN must sit above the quiet note');
must(/splash0:/.test(i18n), 'splash load labels should be i18n');
must(/saveLoadedPreview:/.test(catalog), 'catalog missing toast.saveLoadedPreview');
must(!/Save geladen uit/.test(fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8')), 'save import toast still hardcoded Dutch');
must(/width="720" height="360"/.test(index), 'splash canvas should be larger hero size');
must(/classList.contains\('is-title'\)/.test(index), 'failsafe must keep title gate');
must(/startGame: 'SPELEN'/.test(i18n), 'title start label missing');
must(/playerTag: ''/.test(storage), 'save should store local playerTag');
must(/function showTitleGate/.test(fs.readFileSync(path.join(root, 'src/boot/loop.js'), 'utf8')), 'showTitleGate missing');
must(!/password|inloggen|log in/i.test(index.match(/id="sfTitleGate"[\s\S]*?<\/div>\s*<script>/)?.[0] || ''), 'title must not fake an account login');

if (built) {
  must(/_toastQ/.test(built), 'built game.js missing toast queue');
  must(/aria-live/.test(index), 'index toast a11y missing after build');
}

console.log('SMOKE_OK toast-ui');
