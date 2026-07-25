/* ============== SCENERY ART — pixel-art lagen (upgrade 1/4) ============ */
/* Gecachte offscreen tiles (1× gerenderd per thema), chunky pixel look via
   imageSmoothingEnabled=false + opschaling. Geen externe assets — offline OK. */
function sceneryRng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const SCENERY_SCALE = 3;

const SceneryArt = {
  cache: {},

  clearCache() { this.cache = {}; },

  get(themeName, kind) {
    const key = themeName + ':' + kind;
    if (key in this.cache) return this.cache[key];
    let cv = null;
    try { cv = this.render(themeName, kind); } catch (_) { cv = null; }
    this.cache[key] = cv;
    return cv;
  },

  makeTile(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const x = cv.getContext('2d');
    return { cv, x, px: (px, py, pw, ph, col) => { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), Math.max(1, Math.round(pw)), Math.max(1, Math.round(ph))); } };
  },

  /** Dither-rand: om-en-om pixels boven een silhouetlijn. */
  dither(px, x0, y, w, col, step) {
    for (let i = 0; i < w; i += (step || 2)) px(x0 + i, y, 1, 1, col);
  },

  render(themeName, kind) {
    if (kind === 'cloud') return this.renderCloud(themeName);
    if (kind === 'tree') return this.renderTree(themeName);
    return this.renderFar(themeName);
  },

  renderCloud() {
    const { cv, px } = this.makeTile(26, 12);
    const r = sceneryRng(77);
    // blokkige cumulus: 3 tinten
    const rows = [
      [7, 9, 4], [4, 16, 6], [2, 22, 9],
    ];
    for (const [y, w, x0] of rows) {
      px(x0, y, w, 3, '#f4f9ff');
    }
    px(5, 6, 14, 3, '#ffffff');
    px(8, 3, 8, 3, '#ffffff');
    for (let i = 0; i < 8; i++) px(3 + r() * 20, 9 + r() * 2, 1, 1, '#d8e8f6');
    return cv;
  },

  renderTree(themeName) {
    const { cv, px } = this.makeTile(22, 34);
    if (themeName === 'landweg') {
      // Haag / loofboom — diepgroen uit de foto
      px(9, 24, 4, 10, '#4a3420');
      px(9, 24, 2, 10, '#5c4228');
      px(2, 14, 18, 12, '#1e5a2c');
      px(4, 8, 14, 10, '#2a7040');
      px(6, 4, 10, 8, '#3a8850');
      this.dither(px, 2, 26, 18, '#1e5a2c', 2);
      px(5, 10, 3, 2, '#4aa060');
      px(12, 12, 3, 2, '#4aa060');
      return cv;
    }
    const dark = themeName === 'bos' ? '#1d4a2c' : '#2e7a3c';
    const mid = themeName === 'bos' ? '#276238' : '#3f9b4c';
    const light = themeName === 'bos' ? '#347a46' : '#55b862';
    // stam
    px(9, 24, 4, 10, '#54381f');
    px(9, 24, 2, 10, '#6b4a2a');
    // gelaagde kruin (3 lagen met dither)
    const layers = [
      [3, 14, 16, dark], [5, 8, 14, mid], [7, 3, 10, light],
    ];
    for (const [x0, y0, w, col] of layers) {
      const h = 8;
      px(x0, y0 + 2, w, h - 2, col);
      px(x0 + 2, y0, w - 4, 2, col);
      this.dither(px, x0, y0 + h, w, col, 2);
    }
    return cv;
  },

  renderFar(themeName) {
    const W0 = 160, H0 = 72;
    const { cv, px } = this.makeTile(W0, H0);
    const r = sceneryRng(themeName.length * 1337 + 42);
    const base = H0; // silhouet staat op tile-bodem
    switch (themeName) {
      case 'bos': {
        // twee rijen dennen-silhouetten
        for (let i = 0; i < 9; i++) {
          const x = i * 19 + r() * 6;
          const h = 26 + r() * 14;
          for (let yy = 0; yy < h; yy += 3) {
            const w = 2 + (yy / h) * 14;
            px(x - w / 2, base - h + yy, w, 3, '#1c3f2b');
          }
        }
        for (let i = 0; i < 7; i++) {
          const x = 8 + i * 24 + r() * 8;
          const h = 16 + r() * 10;
          for (let yy = 0; yy < h; yy += 3) {
            const w = 2 + (yy / h) * 12;
            px(x - w / 2, base - h + yy, w, 3, '#152f20');
          }
        }
        break;
      }
      case 'grot': {
        // rotswand-skyline + gloeiende kristallen
        for (let x = 0; x < W0; x += 4) {
          const h = 18 + Math.sin(x * 0.16) * 8 + r() * 10;
          px(x, base - h, 4, h, '#1b2140');
          if (r() < 0.5) px(x, base - h - 1, 2, 1, '#252c4e');
        }
        for (let i = 0; i < 8; i++) {
          const x = r() * W0, y = base - 4 - r() * 16;
          px(x, y, 2, 3, '#6fd7ff');
          px(x, y - 1, 1, 1, '#bffaff');
        }
        break;
      }
      case 'vulkaan': {
        // vulkaankegels met lava-rand + as-rook
        const cones = [[30, 44], [95, 56], [140, 36]];
        for (const [cx, h] of cones) {
          for (let yy = 0; yy < h; yy += 2) {
            const w = 4 + (yy / h) * (h * 0.9);
            px(cx - w / 2, base - h + yy, w, 2, '#241016');
          }
          px(cx - 3, base - h, 6, 2, '#ff7a30');
          px(cx - 1, base - h - 1, 3, 1, '#ffc06b');
          for (let s = 0; s < 4; s++) px(cx - 2 + r() * 6, base - h - 4 - s * 3, 2, 2, `rgba(120,100,110,${0.5 - s * 0.1})`);
        }
        for (let i = 0; i < 10; i++) px(r() * W0, base - 2 - r() * 6, 2, 1, '#3a1a20');
        break;
      }
      case 'cyber': {
        // skyline met verlichte raampjes + antennes
        let x = 0;
        while (x < W0 - 8) {
          const bw = 10 + Math.floor(r() * 14);
          const bh = 20 + Math.floor(r() * 34);
          px(x, base - bh, bw, bh, '#0d1434');
          px(x, base - bh, bw, 1, '#1c2a5e');
          for (let wy = base - bh + 3; wy < base - 3; wy += 4) {
            for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
              if (r() < 0.35) px(wx, wy, 2, 2, r() < 0.5 ? '#ff4dd2' : '#39d0ff');
            }
          }
          if (r() < 0.4) { px(x + bw / 2, base - bh - 5, 1, 5, '#1c2a5e'); px(x + bw / 2, base - bh - 6, 1, 1, '#ff5d5d'); }
          x += bw + 2 + Math.floor(r() * 5);
        }
        break;
      }
      case 'dojo': {
        // pagode-silhouet + torii-poort
        const pag = (cx, s) => {
          for (let tier = 0; tier < 3; tier++) {
            const w = (34 - tier * 9) * s, y = base - (12 + tier * 11) * s;
            px(cx - w / 2, y, w, 3 * s, '#241a12');
            px(cx - w / 2 - 3 * s, y, 3 * s, 2 * s, '#241a12');
            px(cx + w / 2, y, 3 * s, 2 * s, '#241a12');
            px(cx - (w * 0.32), y + 3 * s, w * 0.64, 8 * s, '#2f2318');
          }
          px(cx - 1, base - 40 * s, 2, 4, '#241a12');
        };
        pag(36, 1);
        pag(120, 0.7);
        // torii
        px(70, base - 22, 3, 22, '#4a1f16');
        px(88, base - 22, 3, 22, '#4a1f16');
        px(64, base - 24, 33, 3, '#5c2419');
        px(67, base - 18, 27, 2, '#4a1f16');
        for (let i = 0; i < 12; i++) px(r() * W0, base - 1 - r() * 3, 2, 1, '#2a2018');
        break;
      }
      case 'sloop': {
        // stadsblokken met kapotte daken + verre kraan
        let x = 4;
        while (x < W0 - 12) {
          const bw = 14 + Math.floor(r() * 12);
          const bh = 16 + Math.floor(r() * 22);
          px(x, base - bh, bw, bh, '#48525e');
          this.dither(px, x, base - bh - 1, bw, '#48525e', 2);
          for (let wy = base - bh + 3; wy < base - 3; wy += 5) {
            for (let wx = x + 2; wx < x + bw - 2; wx += 5) {
              if (r() < 0.3) px(wx, wy, 2, 2, '#2e353d');
            }
          }
          if (r() < 0.35) px(x + 2 + r() * (bw - 6), base - bh - 3, 3, 3, '#3a434d');
          x += bw + 3;
        }
        px(118, base - 52, 2, 52, '#3a434d');
        px(118, base - 52, 26, 2, '#3a434d');
        px(140, base - 50, 1, 8, '#3a434d');
        px(139, base - 42, 3, 3, '#2e353d');
        break;
      }
      case 'landweg': {
        // Foto-pixelmap: verre heuvels, boomlijn, bakstenen huis, rode struik
        for (let x = 0; x < W0; x += 2) {
          const h = 10 + Math.sin(x * 0.04 + 1.2) * 5 + Math.sin(x * 0.09) * 3;
          px(x, base - h, 2, h, '#4a8f52');
          if ((x >> 1) % 2 === 0) px(x, base - h - 1, 1, 1, '#5aa860');
        }
        // boomlijn / haag
        for (let i = 0; i < 8; i++) {
          const tx = 48 + i * 12 + Math.floor(r() * 3);
          const th = 14 + Math.floor(r() * 10);
          px(tx, base - th, 10, th, '#1e5a2c');
          px(tx + 2, base - th - 4, 6, 6, '#2a7040');
        }
        // bakstenen huis met donker dak
        const hx = 72, hw = 22, hh = 18;
        px(hx, base - hh, hw, hh, '#a85a48');
        px(hx + 1, base - hh + 2, hw - 2, 2, '#8a4838');
        px(hx + 1, base - hh + 8, hw - 2, 2, '#8a4838');
        px(hx - 2, base - hh - 5, hw + 4, 5, '#3a3a40');
        px(hx + 2, base - hh - 8, hw - 4, 3, '#2e2e34');
        px(hx + 8, base - 10, 4, 10, '#4a3028');
        px(hx + 4, base - 14, 3, 3, '#7cf5ff88');
        px(hx + 14, base - 14, 3, 3, '#7cf5ff88');
        // schuur rechts
        px(108, base - 10, 16, 10, '#8a6a48');
        px(106, base - 13, 20, 3, '#5a4a38');
        // rode struik links
        px(14, base - 12, 18, 12, '#6e2430');
        px(16, base - 18, 14, 10, '#8a2e3a');
        px(20, base - 22, 8, 6, '#a84852');
        // gouden akker-pixels onderaan
        for (let x = 0; x < 52; x += 2) {
          px(x, base - 2, 2, 2, x % 4 ? '#d4b45e' : '#c4a04a');
        }
        break;
      }
      default: {
        // veld: glooiende verre heuvels + molen + boerderijtje
        for (let x = 0; x < W0; x += 2) {
          const h = 14 + Math.sin(x * 0.05 + 2) * 7 + Math.sin(x * 0.11) * 4;
          px(x, base - h, 2, h, '#69ab5e');
          if ((x >> 1) % 2 === 0) px(x, base - h - 1, 1, 1, '#7dbd70');
        }
        // molen
        const mx = 118, mh = 26;
        px(mx - 3, base - mh, 6, mh, '#8a7358');
        px(mx - 4, base - mh - 2, 8, 3, '#6d5a44');
        px(mx - 1, base - mh - 8, 2, 8, '#5a4a38');
        px(mx - 8, base - mh - 3, 16, 2, '#5a4a38');
        // boerderij
        px(28, base - 8, 14, 8, '#a8544a');
        px(26, base - 11, 18, 3, '#6d3a32');
        px(32, base - 6, 3, 6, '#4a2a24');
        break;
      }
    }
    return cv;
  },
};

/** Weer per thema (art-upgrade 4/4) — stateless deeltjes uit formules. */
function drawThemeWeather(c, themeName, t, ground, scroll) {
  if (fxLite() || motionReduced() || Perf.tier >= 2) return;
  const wrapW = (v, span) => ((v % span) + span) % span;
  const n = Perf.tier >= 1 ? 6 : 11;
  c.save();
  for (let i = 0; i < n; i++) {
    const seed = i * 137.5 + 31;
    switch (themeName) {
      case 'bos': {
        // dwarrelende blaadjes
        const fall = 26 + (i % 4) * 9;
        const x = wrapW(seed * 4.1 + Math.sin(t * 0.8 + i * 1.3) * 46 - t * 12 - scroll * 0.3, W + 60) - 30;
        const y = wrapW(seed * 2.3 + t * fall, ground + 40) - 20;
        c.fillStyle = i % 2 ? 'rgba(96,168,96,.5)' : 'rgba(150,190,92,.42)';
        c.save(); c.translate(x, y); c.rotate(t * 2.2 + i); c.fillRect(-3.2, -1.6, 6.4, 3.2); c.restore();
        break;
      }
      case 'veld':
      case 'landweg':
      case 'dojo': {
        // bloesem / stro-pollen (landweg: gouden vlokjes)
        const drift = 18 + (i % 3) * 8;
        const x = wrapW(seed * 3.7 - t * drift - scroll * 0.35, W + 40) - 20;
        const y = wrapW(seed * 1.7 + t * 14 + Math.sin(t * 1.4 + i) * 24, ground + 30) - 15;
        c.fillStyle = themeName === 'dojo'
          ? 'rgba(255,170,190,.5)'
          : themeName === 'landweg'
            ? (i % 2 ? 'rgba(212,180,94,.55)' : 'rgba(255,240,200,.45)')
            : 'rgba(255,235,250,.55)';
        c.save(); c.translate(x, y); c.rotate(t * 1.6 + i * 2); c.fillRect(-2.4, -1.4, 4.8, 2.8); c.restore();
        break;
      }
      case 'vulkaan': {
        // opstijgende sintels met flikker
        const rise = 30 + (i % 4) * 12;
        const x = wrapW(seed * 3.3 + Math.sin(t * 1.7 + i * 2.1) * 18 - scroll * 0.3, W + 30) - 15;
        const y = ground - wrapW(seed * 1.9 + t * rise, ground + 20);
        const fl = 0.35 + Math.max(0, Math.sin(t * 6 + i * 1.7)) * 0.4;
        c.fillStyle = `rgba(255,${120 + (i % 3) * 30},48,${fl.toFixed(2)})`;
        c.fillRect(x, y, 3, 3);
        break;
      }
      case 'cyber': {
        // neon-regen strepen
        const fall = 320 + (i % 3) * 90;
        const x = wrapW(seed * 4.7 - scroll * 0.4, W + 20) - 10;
        const y = wrapW(seed * 2.9 + t * fall, ground + 60) - 30;
        c.strokeStyle = i % 3 ? 'rgba(90,160,255,.30)' : 'rgba(255,77,210,.24)';
        c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 13); c.stroke();
        break;
      }
      case 'grot': {
        // zwevende stofjes
        const x = wrapW(seed * 3.9 + Math.sin(t * 0.5 + i) * 30 - scroll * 0.15, W + 20) - 10;
        const y = wrapW(seed * 2.1 + Math.sin(t * 0.7 + i * 2.3) * 40 + t * 6, ground) ;
        c.fillStyle = `rgba(200,220,255,${(0.10 + (i % 3) * 0.05).toFixed(2)})`;
        c.fillRect(x, y, 2, 2);
        break;
      }
      case 'sloop': {
        // grijze stofvlokken
        const x = wrapW(seed * 4.3 - t * 22 - scroll * 0.4, W + 30) - 15;
        const y = wrapW(seed * 1.8 + t * 10 + Math.sin(t + i) * 14, ground * 0.9) + ground * 0.08;
        c.fillStyle = 'rgba(180,190,200,.22)';
        c.fillRect(x, y, 3, 2);
        break;
      }
      default:
        break;
    }
  }
  c.restore();
  c.globalAlpha = 1;
}

/** Menu hero — pixel grondstrip (d20 polish #8), chunky look + donkere menu-tint. */
/**
 * Levende pixelmap van de landweg-foto — sky, gouden akker, grindpad,
 * rode struik, boomlijn, bakstenen huis. Gebruikt op menu-hero (onverwacht)
 * en als diorama-referentie voor thema `landweg`.
 */
function drawLandwegPixelmap(c, w, h, t, opts) {
  opts = opts || {};
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const px = Math.max(2, Math.round(opts.px || 3));
  const groundY = Math.round(opts.groundY != null ? opts.groundY : h * 0.62);
  const calm = motionReduced();

  // Lucht
  const sky = c.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, '#3f9adf');
  sky.addColorStop(0.55, '#7eb8e8');
  sky.addColorStop(1, '#c5e0f5');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, groundY);

  // Wolken (blokjes)
  const cloudN = opts.lite ? 2 : 4;
  for (let i = 0; i < cloudN; i++) {
    const cx = ((i * 0.28 * w + (calm ? 0 : t * (6 + i * 2))) % (w + 80)) - 40;
    const cy = 10 + (i % 3) * 16;
    c.fillStyle = '#f4f9ff';
    c.fillRect(Math.round(cx), cy + 6, 28, 8);
    c.fillRect(Math.round(cx + 6), cy, 18, 10);
    c.fillStyle = '#d8e8f6';
    c.fillRect(Math.round(cx + 4), cy + 12, 22, 3);
  }

  // Verre heuvels
  c.fillStyle = '#4a8f52';
  c.beginPath();
  c.moveTo(0, groundY);
  for (let x = 0; x <= w; x += 20) {
    c.lineTo(x, groundY - 28 - Math.sin(x * 0.012 + 1) * 10);
  }
  c.lineTo(w, groundY);
  c.closePath();
  c.fill();
  c.fillStyle = '#3a7040';
  c.beginPath();
  c.moveTo(0, groundY);
  for (let x = 0; x <= w; x += 16) {
    c.lineTo(x, groundY - 14 - Math.sin(x * 0.02 + 3) * 6);
  }
  c.lineTo(w, groundY);
  c.closePath();
  c.fill();

  // Boomlijn
  for (let i = 0; i < 9; i++) {
    const tx = Math.round(w * 0.28 + i * (w * 0.07));
    const th = 22 + (i % 3) * 8;
    c.fillStyle = i % 2 ? '#1e5a2c' : '#2a7040';
    c.fillRect(tx, groundY - th, 14, th);
    c.fillStyle = '#3a8850';
    c.fillRect(tx + 2, groundY - th - 6, 10, 8);
  }

  // Bakstenen huis
  const hx = Math.round(w * 0.48);
  const hw = Math.round(w * 0.12);
  const hh = Math.round(h * 0.22);
  c.fillStyle = '#a85a48';
  c.fillRect(hx, groundY - hh, hw, hh);
  c.fillStyle = '#8a4838';
  for (let row = 0; row < 4; row++) {
    c.fillRect(hx + 2, groundY - hh + 4 + row * 8, hw - 4, 2);
  }
  c.fillStyle = '#3a3a40';
  c.beginPath();
  c.moveTo(hx - 4, groundY - hh);
  c.lineTo(hx + hw / 2, groundY - hh - 14);
  c.lineTo(hx + hw + 4, groundY - hh);
  c.closePath();
  c.fill();
  c.fillStyle = '#4a3028';
  c.fillRect(hx + hw * 0.4, groundY - 16, hw * 0.2, 16);
  c.fillStyle = 'rgba(180,220,255,.55)';
  c.fillRect(hx + 6, groundY - hh + 10, 8, 8);
  c.fillRect(hx + hw - 14, groundY - hh + 10, 8, 8);

  // Schuur
  c.fillStyle = '#8a6a48';
  c.fillRect(hx + hw + 10, groundY - 18, 22, 18);
  c.fillStyle = '#5a4a38';
  c.fillRect(hx + hw + 8, groundY - 22, 26, 4);

  // Rode struik
  const bx = Math.round(w * 0.12);
  c.fillStyle = '#6e2430';
  c.beginPath();
  c.ellipse(bx, groundY - 16, 28, 20, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#8a2e3a';
  c.beginPath();
  c.ellipse(bx - 8, groundY - 26, 16, 14, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#a84852';
  c.beginPath();
  c.ellipse(bx + 6, groundY - 30, 10, 8, 0, 0, TAU);
  c.fill();

  // Gouden akker (links) + grindpad (rechts/onder)
  const fieldW = Math.round(w * 0.42);
  for (let y = groundY; y < h; y += px) {
    const pr = (y - groundY) / Math.max(1, h - groundY);
    c.fillStyle = pr < 0.35 ? '#d8bc6a' : pr < 0.7 ? '#c4a04a' : '#a88838';
    c.fillRect(0, y, fieldW, px);
  }
  // Grasplukken
  for (let i = 0; i < 10; i++) {
    const gx = 8 + i * Math.floor(fieldW / 10);
    c.fillStyle = '#b89240';
    c.fillRect(gx, groundY - 6, 2, 6);
    c.fillRect(gx + 3, groundY - 4, 2, 4);
  }

  const roadX = fieldW - 4;
  for (let y = groundY; y < h; y += px) {
    const pr = (y - groundY) / Math.max(1, h - groundY);
    c.fillStyle = pr < 0.25 ? '#b0aea4' : pr < 0.65 ? '#9a9a92' : '#7e7e76';
    c.fillRect(roadX, y, w - roadX, px);
  }
  if (!opts.lite) {
    const off = calm ? 0 : ((t * 14) % 28);
    for (let x = roadX; x < w; x += 28) {
      c.fillStyle = 'rgba(255,255,255,.2)';
      c.fillRect(Math.round(x + off), groundY + 10, 3, 3);
      c.fillStyle = 'rgba(40,40,36,.25)';
      c.fillRect(Math.round(x + off + 12), groundY + 22, 2, 2);
    }
  }

  // Tiny caption
  if (opts.caption !== false) {
    c.fillStyle = 'rgba(20,24,40,.45)';
    c.fillRect(6, 6, 118, 14);
    c.fillStyle = 'rgba(255,248,220,.85)';
    c.font = '900 9px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('vakantiefoto · pixelmap', 10, 16);
  }

  c.imageSmoothingEnabled = prev;
  return { groundY, roadX, fieldW };
}

function drawMenuHeroPixelGround(c, w, h, groundY, t) {
  // Legacy hook — menu gebruikt nu drawLandwegPixelmap; fallback grasstrook
  const gh = h - groundY;
  if (gh <= 0) return;
  const px = 3;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const gy = Math.round(groundY);
  for (let y = 0; y < gh; y += px) {
    const pr = y / gh;
    c.fillStyle = pr < 0.32 ? '#d4b45e' : pr < 0.68 ? '#b8964a' : '#9a7a38';
    c.fillRect(0, gy + y, w, px);
  }
  c.fillStyle = '#9a9a92';
  c.fillRect(Math.round(w * 0.4), gy, Math.round(w * 0.6), gh);
  c.imageSmoothingEnabled = prev;
}

/** d20 polish #14 — Versus VS-banner pixels (chunky block letters). */
function drawPixelVsBanner(c, cx, cy, scale, t) {
  const s = Math.max(2, Math.round(scale || 4));
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const bounce = motionReduced() ? 0 : Math.round(Math.sin((t || 0) * 6) * s * 0.15);
  const y = Math.round(cy) + bounce;
  const x = Math.round(cx);
  const bw = 17 * s;
  const bh = 9 * s;

  // Shadow plate
  c.fillStyle = 'rgba(0,0,0,.45)';
  c.fillRect(x - bw / 2 + s, y - bh / 2 + s, bw, bh);
  // Red banner body
  c.fillStyle = '#c01828';
  c.fillRect(x - bw / 2, y - bh / 2, bw, bh);
  // Gold pixel rim
  c.fillStyle = '#ffd75e';
  c.fillRect(x - bw / 2, y - bh / 2, bw, s);
  c.fillRect(x - bw / 2, y + bh / 2 - s, bw, s);
  c.fillRect(x - bw / 2, y - bh / 2, s, bh);
  c.fillRect(x + bw / 2 - s, y - bh / 2, s, bh);
  // Corner ticks
  c.fillStyle = '#fff8dc';
  c.fillRect(x - bw / 2 + s, y - bh / 2 + s, s, s);
  c.fillRect(x + bw / 2 - s * 2, y - bh / 2 + s, s, s);
  c.fillRect(x - bw / 2 + s, y + bh / 2 - s * 2, s, s);
  c.fillRect(x + bw / 2 - s * 2, y + bh / 2 - s * 2, s, s);

  // 5×7 pixel glyphs for V and S
  const V = [
    '10001',
    '10001',
    '10001',
    '01010',
    '01010',
    '00100',
    '00100',
  ];
  const S = [
    '01110',
    '10001',
    '10000',
    '01110',
    '00001',
    '10001',
    '01110',
  ];
  const drawGlyph = (glyph, ox) => {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] !== '1') continue;
        c.fillStyle = '#ffffff';
        c.fillRect(ox + col * s, y - 3.5 * s + row * s, s, s);
        c.fillStyle = 'rgba(0,0,0,.25)';
        c.fillRect(ox + col * s, y - 3.5 * s + row * s + s - 1, s, 1);
      }
    }
  };
  drawGlyph(V, x - 7 * s);
  drawGlyph(S, x + 2 * s);

  // Side accent pips
  c.fillStyle = '#7cf5ff';
  c.fillRect(x - bw / 2 - s * 2, y - s, s, s * 2);
  c.fillStyle = '#ffb0b8';
  c.fillRect(x + bw / 2 + s, y - s, s, s * 2);

  c.imageSmoothingEnabled = prev;
}

/** d20 polish #9 — Pause-scherm pixel backdrop. */
function paintPausePixelBackdrop(t) {
  const cv = document.getElementById('pausePixelBg');
  if (!cv) return;
  const parent = cv.parentElement;
  if (parent) {
    const w = Math.max(240, Math.floor(parent.clientWidth || 480));
    const h = Math.max(320, Math.floor(parent.clientHeight || 720));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
  }
  const c = cv.getContext('2d');
  if (!c) return;
  const W = cv.width;
  const H = cv.height;
  const px = 4;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const lite = (typeof save !== 'undefined' && save.liteFx) || (typeof Perf !== 'undefined' && Perf.tier >= 2);
  const calm = typeof motionReduced === 'function' && motionReduced();

  // Night sky bands
  for (let y = 0; y < H; y += px) {
    const pr = y / H;
    c.fillStyle = pr < 0.35 ? '#1a1430' : pr < 0.7 ? '#12101c' : '#0a0812';
    c.fillRect(0, y, W, px);
  }

  // Pixel stars
  const starN = lite ? 18 : 36;
  for (let i = 0; i < starN; i++) {
    const sx = ((i * 97 + Math.floor((t || 0) * (calm ? 2 : 8))) % (W / px)) * px;
    const sy = ((i * 53) % Math.floor(H * 0.55 / px)) * px;
    c.fillStyle = i % 3 === 0 ? '#ffd75e' : (i % 2 ? '#7cf5ff' : '#ffffff');
    c.globalAlpha = 0.25 + (i % 5) * 0.1;
    c.fillRect(sx, sy, px, px);
  }
  c.globalAlpha = 1;

  // Arena ground strip
  const gy = Math.floor(H * 0.78 / px) * px;
  for (let y = gy; y < H; y += px) {
    const pr = (y - gy) / Math.max(1, H - gy);
    c.fillStyle = pr < 0.25 ? '#2a2438' : pr < 0.6 ? '#1c1828' : '#100e18';
    c.fillRect(0, y, W, px);
  }
  c.fillStyle = '#3d7a4a';
  c.fillRect(0, gy, W, px);
  for (let x = 0; x < W; x += px * 2) {
    c.fillStyle = '#4a9460';
    c.fillRect(x, gy - px, px, px);
    c.fillStyle = '#2d5a3a';
    c.fillRect(x + px, gy - px, px, px);
  }

  // Soft vignette pillars (pause frame)
  c.fillStyle = 'rgba(0,0,0,.28)';
  for (let x = 0; x < W; x += px) {
    const edge = Math.min(x, W - x) / (W * 0.22);
    if (edge >= 1) continue;
    c.globalAlpha = (1 - edge) * 0.45;
    c.fillRect(x, 0, px, H);
  }
  c.globalAlpha = 1;

  // Pause diamond watermark
  const cx = Math.round(W / 2);
  const cy = Math.round(H * 0.22);
  c.fillStyle = 'rgba(255,215,94,.12)';
  c.fillRect(cx - px * 3, cy, px * 6, px);
  c.fillRect(cx - px * 2, cy - px, px * 4, px);
  c.fillRect(cx - px, cy - px * 2, px * 2, px);
  c.fillRect(cx - px * 2, cy + px, px * 4, px);
  c.fillRect(cx - px * 3, cy + px * 2, px * 6, px);
  c.fillStyle = 'rgba(124,245,255,.1)';
  c.fillRect(cx - px, cy, px * 2, px);

  c.imageSmoothingEnabled = prev;
}

function startPausePixelBackdropLoop() {
  if (window.__sfPauseBgRaf) return;
  const t0 = performance.now();
  const tick = (now) => {
    const scr = document.getElementById('pauseScreen');
    if (!scr || !scr.classList.contains('active') || (typeof state !== 'undefined' && state !== 'pause')) {
      window.__sfPauseBgRaf = 0;
      return;
    }
    try { paintPausePixelBackdrop((now - t0) / 1000); } catch (_) {}
    window.__sfPauseBgRaf = requestAnimationFrame(tick);
  };
  window.__sfPauseBgRaf = requestAnimationFrame(tick);
}

/** Pixel-art laag tekenen: getild, smoothing uit, parallax-offset. */
function drawSceneryTile(c, tile, y, scroll, rate, scale) {
  if (!tile) return;
  const s = scale || SCENERY_SCALE;
  const tw = tile.width * s;
  const th = tile.height * s;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const off = (((-scroll * rate) % tw) + tw) % tw;
  for (let x = off - tw; x < W + tw; x += tw) {
    c.drawImage(tile, Math.round(x), Math.round(y), tw, th);
  }
  c.imageSmoothingEnabled = prev;
}

