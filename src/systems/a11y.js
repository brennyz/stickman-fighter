/* ============================== A11Y ================================== */
/** Lived in versus.js historically — kept here so retiring local 2P does not break boot. */

function systemPrefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}
function systemPrefersMoreContrast() {
  try { return window.matchMedia('(prefers-contrast: more)').matches; } catch (_) { return false; }
}
function motionReduced() {
  return !!(typeof save !== 'undefined' && save && save.reducedMotion) || systemPrefersReducedMotion();
}
function a11yHighContrast() {
  return !!(typeof save !== 'undefined' && save && save.highContrast) || systemPrefersMoreContrast() || motionReduced();
}
function syncA11yClasses() {
  try {
    document.body.classList.toggle('reduced-motion', motionReduced());
    document.body.classList.toggle('high-contrast', a11yHighContrast());
    document.body.classList.toggle('lite-fx', !!(typeof save !== 'undefined' && save && save.liteFx));
  } catch (_) {}
}
function a11yStatusText() {
  const bits = [];
  try {
    if (motionReduced()) {
      bits.push(save.reducedMotion ? t('settings.a11yMotionOn') : t('settings.a11yMotionOs'));
    }
    if (a11yHighContrast()) {
      bits.push(save.highContrast ? t('settings.a11yContrastOn') : t('settings.a11yContrastOs'));
    }
    return bits.length ? bits.join(' · ') : t('settings.a11yDefault');
  } catch (_) {
    return bits.join(' · ') || '';
  }
}
function refreshA11yUi() {
  syncA11yClasses();
  try {
    const el = document.getElementById('a11yStatusLine');
    if (el) el.textContent = a11yStatusText();
    const active = document.getElementById('settingsScreen')?.classList.contains('active');
    if (active && typeof UI !== 'undefined' && UI.renderSettings) UI.renderSettings();
  } catch (_) {}
}

/** Canvas HUD-tekst met optionele stroke bij hoog contrast (geen flits). */
function fillHudText(c, text, x, y, opts) {
  opts = opts || {};
  const align = opts.align || c.textAlign || 'center';
  c.textAlign = align;
  const fill = opts.fill || '#fff';
  if (a11yHighContrast()) {
    c.lineWidth = opts.strokeW || 3.5;
    c.strokeStyle = opts.stroke || 'rgba(0,0,0,.88)';
    c.strokeText(text, x, y);
  }
  c.fillStyle = fill;
  c.fillText(text, x, y);
}

/** Word-wrap HUD copy so long locale strings stay inside the canvas (layout, not i18n). */
function wrapHudText(c, text, maxW, maxLines) {
  const raw = String(text || '');
  const limit = Math.max(1, maxLines || 2);
  const width = Math.max(40, maxW || 200);
  if (!raw) return [];
  if (c.measureText(raw).width <= width) return [raw];
  const words = raw.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (c.measureText(test).width > width && line) {
      lines.push(line);
      line = word;
      if (lines.length >= limit) break;
    } else {
      line = test;
    }
  }
  if (lines.length < limit && line) lines.push(line);
  if (lines.length >= limit) {
    let last = lines[limit - 1];
    const leftover = (line && lines[limit - 1] !== line) ? line : '';
    if (leftover || c.measureText(last).width > width) {
      while (last.length > 1 && c.measureText(last.replace(/\s+$/, '') + '…').width > width) {
        last = last.slice(0, -1);
      }
      lines[limit - 1] = last.replace(/\s+$/, '') + '…';
    }
  }
  return lines.slice(0, limit);
}

function fillHudWrapped(c, text, x, y, opts) {
  opts = opts || {};
  const lines = wrapHudText(c, text, opts.maxW, opts.maxLines || 2);
  const lh = opts.lineH || 16;
  for (let i = 0; i < lines.length; i++) {
    fillHudText(c, lines[i], x, y + i * lh, opts);
  }
  return lines.length * lh;
}
