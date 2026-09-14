#!/usr/bin/env node
/**
 * Post-merge polish: HEAT/SATAN portraits stay art (no sf-icon-broken),
 * floater lanes spread + −N merge is display-only.
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

const satan = fs.readFileSync(path.join(root, 'src/data/satan-encounter.js'), 'utf8');
const missions = fs.readFileSync(path.join(root, 'src/systems/missions.js'), 'utf8');
const prelude = fs.readFileSync(path.join(root, 'src/00-prelude.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/game/game.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
const satanSvg = fs.readFileSync(path.join(root, 'assets/ui/satan.svg'), 'utf8');
const markSvg = fs.readFileSync(path.join(root, 'assets/ui/satan-mark.svg'), 'utf8');
const built = fs.existsSync(path.join(root, 'game.js'))
  ? fs.readFileSync(path.join(root, 'game.js'), 'utf8')
  : '';

must(fs.existsSync(path.join(root, 'assets/ui/satan.svg')), 'satan.svg missing');
must(fs.existsSync(path.join(root, 'assets/ui/satan-mark.svg')), 'satan-mark.svg missing');
must(/width="160"/.test(satanSvg) && /height="200"/.test(satanSvg), 'satan.svg needs intrinsic width/height');
must(/width="24"/.test(markSvg) && /height="24"/.test(markSvg), 'satan-mark.svg needs intrinsic width/height');
must(!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(satanSvg), 'satan.svg has XML-illegal control chars (Chrome rejects <img>)');
must(!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(markSvg), 'satan-mark.svg has XML-illegal control chars');

must(/SATAN_SVG_URL = '\.\/assets\/ui\/satan\.svg'/.test(satan), 'SATAN_SVG_URL must use ./assets');
must(/SATAN_MARK_URL = '\.\/assets\/ui\/satan-mark\.svg'/.test(satan), 'SATAN_MARK_URL must use ./assets');
must(/function satanPortraitOnError\(/.test(satan), 'satanPortraitOnError missing');
must(/satan-portrait-art/.test(satan), 'portrait html needs satan-portrait-art class');
must(/onerror=/.test(satan), 'portrait html needs onerror fallback');

must(/function skipButtonIconHarden\(/.test(missions), 'skipButtonIconHarden missing');
must(/satan-portrait-art/.test(missions), 'harden must skip satan-portrait-art');
must(/satan:/.test(missions) && /'satan-mark':/.test(missions), 'BUTTON_ICON_FALLBACKS must include satan');

must(/FLOATER_LANE_H = 30/.test(prelude), 'floater lane height should be 30');
must(/FLOATER_LANE_W = 40/.test(prelude), 'floater lane width should be 40');
must(/function tryMergeDmgFloater\(/.test(prelude), 'tryMergeDmgFloater missing');
must(/function parseDmgFloaterTxt\(/.test(prelude), 'parseDmgFloaterTxt missing');
must(/tryMergeDmgFloater\(this,/.test(game), 'Game.floater must try merge first');
must(/renderAdvHeatMeter\(meterHeat, \{ bare: true \}\)/.test(ui), 'island heat meter must be bare (no duplicate portrait)');
must(/Wapens tot Lv/.test(fs.readFileSync(path.join(root, 'src/i18n/catalog.js'), 'utf8')), 'island sub copy should be short NL');
must(!/Aura-ringen/.test(satanSvg), 'satan.svg must not use aura rings (read as a bug at card size)');

must(/url\("\.\.\/assets\/ui\/satan\.svg"\)/.test(css), 'card-face CSS fallback path wrong (must be ../assets)');
must(/width:104px/.test(css) && /height:128px/.test(css), 'satan card face should be larger (104x128)');
must(/adv-heat\.bare/.test(css), 'bare heat meter style missing');
must(/toastHost/.test(css) && /safe-area-inset-top/.test(css), 'toast host must clear Android status bar');
must(!/#levelScreen\.active ~ #toastHost/.test(css), 'do not hide all toasts on the island screen');
must(/url\("\.\.\/assets\/ui\/satan-mark\.svg"\)/.test(css), 'heat-face CSS fallback path wrong');
must(/satan-portrait-art\.sf-icon-broken/.test(css), 'CSS must neutralize broken outline on satan art');

if (built) {
  must(/function skipButtonIconHarden\(/.test(built), 'built game.js missing skipButtonIconHarden');
  must(/function tryMergeDmgFloater\(/.test(built), 'built game.js missing tryMergeDmgFloater');
  must(/satanPortraitOnError/.test(built), 'built game.js missing satanPortraitOnError');
  must(/\.\/assets\/ui\/satan\.svg/.test(built), 'built game.js SATAN path');
}

console.log('SMOKE_OK island-polish');
