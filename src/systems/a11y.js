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

/** Wrap / ellipsis canvas HUD copy so a 390px-scaled fight stays one readable pill. */
function wrapHudLines(c, text, maxW, maxLines) {
  maxLines = Math.max(1, maxLines || 2);
  maxW = Math.max(24, maxW || 200);
  text = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!text) return [''];
  function fit(str) {
    if (c.measureText(str).width <= maxW) return str;
    let s = str;
    while (s.length > 1 && c.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s.replace(/\s+$/, '') + '…';
  }
  if (c.measureText(text).width <= maxW) return [text];
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = cur ? cur + ' ' + word : word;
    if (cur && c.measureText(next).width > maxW) {
      lines.push(cur);
      cur = word;
      if (lines.length >= maxLines - 1) {
        lines.push(fit([cur].concat(words.slice(i + 1)).join(' ')));
        return lines;
      }
      if (c.measureText(cur).width > maxW) {
        lines.push(fit(cur));
        cur = '';
        if (lines.length >= maxLines) return lines;
      }
    } else {
      cur = next;
    }
  }
  if (cur) {
    if (lines.length >= maxLines) {
      lines[maxLines - 1] = fit(lines[maxLines - 1] + ' ' + cur);
      return lines.slice(0, maxLines);
    }
    lines.push(c.measureText(cur).width > maxW ? fit(cur) : cur);
  }
  return lines.length ? lines : [fit(text)];
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
