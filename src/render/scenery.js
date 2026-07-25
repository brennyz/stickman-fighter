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
        // Photo thicket: stick lattice + ivy flecks (stickfight DNA)
        const P = typeof FOREST_FLOOR_PAL !== 'undefined' ? FOREST_FLOOR_PAL : null;
        const twig = P ? P.twigDark : '#2a3228';
        const twig2 = P ? P.twig : '#3a4a38';
        const ivy = P ? P.ivy : '#1e4a28';
        const ivyL = P ? P.ivyLite : '#2e6a38';
        for (let i = 0; i < 14; i++) {
          const x = i * 12 + r() * 4;
          const h = 20 + r() * 28;
          px(x, base - h, 2, h, i % 2 ? twig : twig2);
          if (r() < 0.45) px(x - 6, base - h * 0.6, 14, 2, twig2);
        }
        for (let i = 0; i < 6; i++) {
          const x = 10 + i * 26 + r() * 6;
          px(x, base - 18 - r() * 10, 8, 6, ivy);
          px(x + 2, base - 22 - r() * 8, 5, 4, ivyL);
        }
        // leaf litter band
        for (let x = 0; x < W0; x += 2) {
          px(x, base - 2, 2, 2, (x % 4) ? (P ? P.leafOchre : '#a88848') : (P ? P.leafTan : '#c4a46a'));
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
        // Foto fight-bg: heldere heuvels, loofboomlijn, grijs huis + zonnepanelen
        for (let x = 0; x < W0; x += 2) {
          const h = 12 + Math.sin(x * 0.035 + 0.8) * 6 + Math.sin(x * 0.08) * 3;
          px(x, base - h, 2, h, '#3a6a42');
          if ((x >> 1) % 2 === 0) px(x, base - h - 1, 1, 1, '#4a7a50');
        }
        for (let i = 0; i < 9; i++) {
          const tx = 40 + i * 13 + Math.floor(r() * 3);
          const th = 16 + Math.floor(r() * 12);
          px(tx, base - th, 11, th, '#1e4a28');
          px(tx + 2, base - th - 5, 7, 7, '#2a5834');
          px(tx + 3, base - th - 9, 5, 5, '#3a7044');
        }
        // modern grey house + solar
        const hx = 78, hw = 26, hh = 20;
        px(hx, base - hh, hw, hh, '#6a7078');
        px(hx + 2, base - hh + 4, 6, 6, '#3a4048');
        px(hx + 16, base - hh + 4, 6, 6, '#3a4048');
        px(hx - 2, base - hh - 6, hw + 4, 6, '#3a3e44');
        px(hx + 4, base - hh - 10, 8, 5, '#1a2840');
        px(hx + 14, base - hh - 9, 8, 5, '#1a2840');
        px(hx + 10, base - 10, 5, 10, '#2a2e34');
        // green bush left
        px(10, base - 14, 22, 14, '#1e4a28');
        px(14, base - 20, 16, 12, '#2a5834');
        px(18, base - 26, 10, 8, '#3a7044');
        // berm gold
        for (let x = 0; x < 48; x += 2) {
          px(x, base - 2, 2, 2, x % 4 ? '#c4a85a' : '#a88850');
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
        // photo-leaf + twig grit (forest-floor samples)
        const P = typeof FOREST_FLOOR_PAL !== 'undefined' ? FOREST_FLOOR_PAL : null;
        const fall = 26 + (i % 4) * 9;
        const x = wrapW(seed * 4.1 + Math.sin(t * 0.8 + i * 1.3) * 46 - t * 12 - scroll * 0.3, W + 60) - 30;
        const y = wrapW(seed * 2.3 + t * fall, ground + 40) - 20;
        const cols = P
          ? [P.leafTan, P.leafOchre, P.ivyLite, P.twig, P.moss]
          : ['#c4a46a', '#a88848', '#4a7a38', '#6a6458', '#6a8a30'];
        c.fillStyle = cols[i % cols.length];
        c.globalAlpha = 0.55;
        c.save(); c.translate(x, y); c.rotate(t * 2.2 + i);
        if (i % 3 === 0) c.fillRect(-4, -1, 8, 2); // twig
        else c.fillRect(-3.2, -1.6, 6.4, 3.2); // leaf
        c.restore();
        c.globalAlpha = 1;
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
            ? (i % 2 ? 'rgba(168,140,80,.4)' : 'rgba(200,185,150,.28)')
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

/** Mature countryside palette — foto-vistas + landweg (minder “speelgoed”). */
const COUNTRY_PAL = {
  skyTop: '#4a6a82',
  skyMid: '#7a94a6',
  skyLow: '#b4c2cc',
  cloud: '#e8eef2',
  cloudShade: '#c8d2da',
  forestDeep: '#243428',
  forestMid: '#2e4034',
  forestLite: '#3a4e3e',
  fieldHi: '#b89a5c',
  fieldMid: '#9a7e48',
  fieldLo: '#7a6438',
  straw: '#a88850',
  roadHi: '#7a7874',
  roadMid: '#5e5c58',
  roadLo: '#484642',
  stone: '#6a6058',
  stoneDark: '#524840',
  stoneLite: '#7e746c',
  log: '#5c4a38',
  logLite: '#7a6448',
  logEnd: '#a89068',
  leaf: '#3a4e34',
  leafLite: '#4a5e40',
  oakDark: '#2a402c',
  oakMid: '#354a38',
  oakLite: '#465a46',
  oakHi: '#5a6e56',
  captionBg: 'rgba(18,22,26,.55)',
  captionFg: 'rgba(220,214,200,.82)',
};

/** Pixel-eik (canopy clusters) voor semi-2.5D menu-vista. */
function drawPixelOakTree(c, cx, baseY, scale, sway) {
  const s = Math.max(1.2, scale || 1);
  const trunkW = Math.round(10 * s);
  const trunkH = Math.round(42 * s);
  const swayX = Math.round(sway || 0);
  c.fillStyle = '#3a3024';
  c.fillRect(cx - trunkW / 2, baseY - trunkH, trunkW, trunkH);
  c.fillStyle = '#4e4234';
  c.fillRect(cx - trunkW / 2, baseY - trunkH, Math.max(2, Math.round(3 * s)), trunkH);
  c.fillStyle = '#2a241c';
  c.fillRect(cx - Math.round(18 * s) + swayX, baseY - trunkH + Math.round(6 * s), Math.round(16 * s), Math.round(3 * s));
  c.fillRect(cx + Math.round(2 * s) + swayX, baseY - trunkH + Math.round(10 * s), Math.round(14 * s), Math.round(3 * s));
  const P = COUNTRY_PAL;
  const clusters = [
    [0, -trunkH - 8 * s, 28 * s, 22 * s, P.oakDark],
    [-16 * s, -trunkH + 2 * s, 22 * s, 18 * s, P.oakMid],
    [14 * s, -trunkH + 4 * s, 20 * s, 16 * s, P.oakMid],
    [-6 * s, -trunkH - 18 * s, 24 * s, 16 * s, P.oakLite],
    [8 * s, -trunkH - 14 * s, 18 * s, 14 * s, P.oakLite],
    [-2 * s, -trunkH - 26 * s, 14 * s, 10 * s, P.oakHi],
  ];
  for (const [ox, oy, cw, ch, col] of clusters) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(cx + ox + swayX, baseY + oy, cw / 2, ch / 2, 0, 0, TAU);
    c.fill();
  }
  c.fillStyle = 'rgba(180,190,160,.35)';
  c.fillRect(cx - Math.round(4 * s) + swayX, baseY - trunkH - Math.round(22 * s), 3, 3);
  c.fillRect(cx + Math.round(8 * s) + swayX, baseY - trunkH - Math.round(16 * s), 3, 3);
}

/**
 * Startscherm semi-2.5D pixel-vista (foto: gouden akker + eik + hek + weg).
 * Lagen met parallax: sky → bos → eik → akker/hek → weg.
 */
function drawMenuSemi25dVista(c, w, h, t, opts) {
  opts = opts || {};
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const lite = !!opts.lite;
  const calm = motionReduced();
  const px = 3;
  const roadH = Math.round(h * 0.18);
  const fieldH = Math.round(h * 0.28);
  const roadY = h - roadH;
  const fieldY = roadY - fieldH;
  const horizonY = fieldY;

  const pSky = calm ? 0 : t * 4;
  const pFar = calm ? 0 : t * 9;
  const pMid = calm ? 0 : t * 16;
  const pNear = calm ? 0 : t * 28;
  const wrap = (v, span) => ((v % span) + span) % span;

  // —— L0: sky ——
  const P = COUNTRY_PAL;
  const sky = c.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, P.skyTop);
  sky.addColorStop(0.45, P.skyMid);
  sky.addColorStop(1, P.skyLow);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizonY);

  const cloudN = lite ? 3 : 5;
  for (let i = 0; i < cloudN; i++) {
    const cw = 36 + (i % 3) * 14;
    const cx = wrap(i * 0.31 * w + pSky * (0.6 + i * 0.1), w + cw) - cw * 0.5;
    const cy = 8 + (i % 3) * 14 + (i === 2 ? 6 : 0);
    c.fillStyle = P.cloud;
    c.fillRect(Math.round(cx), cy + 8, cw, 10);
    c.fillRect(Math.round(cx + 8), cy, cw - 14, 12);
    c.fillRect(Math.round(cx + 16), cy - 4, Math.round(cw * 0.35), 8);
    c.fillStyle = P.cloudShade;
    c.fillRect(Math.round(cx + 4), cy + 16, cw - 8, 4);
  }

  // —— L1: bosrij + schuurtje ——
  const farOff = Math.round(wrap(-pFar, 48) - 24);
  c.fillStyle = P.forestDeep;
  c.fillRect(0, horizonY - 18, w, 20);
  for (let i = -1; i < 14; i++) {
    const tx = Math.round(i * 42 + farOff);
    const th = 28 + ((i * 17) % 22);
    c.fillStyle = i % 2 ? P.forestDeep : P.forestMid;
    c.fillRect(tx, horizonY - th, 28, th);
    c.fillStyle = P.forestLite;
    c.fillRect(tx + 4, horizonY - th - 8, 20, 12);
    c.fillStyle = P.oakHi;
    c.fillRect(tx + 8, horizonY - th - 14, 12, 8);
  }
  const bldgX = Math.round(w * 0.14 + farOff * 0.35);
  c.fillStyle = P.stone;
  c.fillRect(bldgX, horizonY - 26, 28, 26);
  c.fillStyle = P.stoneDark;
  c.beginPath();
  c.moveTo(bldgX - 3, horizonY - 26);
  c.lineTo(bldgX + 14, horizonY - 38);
  c.lineTo(bldgX + 31, horizonY - 26);
  c.closePath();
  c.fill();
  c.fillStyle = '#2e322e';
  c.fillRect(bldgX + 10, horizonY - 14, 8, 14);

  // —— L2: gouden akker ——
  const midOff = Math.round(wrap(-pMid, 20));
  for (let y = fieldY; y < roadY; y += px) {
    const pr = (y - fieldY) / Math.max(1, fieldH);
    c.fillStyle = pr < 0.35 ? P.fieldHi : pr < 0.7 ? P.fieldMid : P.fieldLo;
    c.fillRect(0, y, w, px);
  }
  for (let x = -20; x < w + 20; x += 8) {
    const xx = x + midOff;
    for (let y = fieldY + 4; y < roadY - 2; y += 7) {
      const bit = ((xx + y * 3) & 7);
      c.fillStyle = bit < 2 ? 'rgba(220,200,150,.18)' : bit > 5 ? 'rgba(60,48,24,.16)' : 'rgba(140,110,50,.1)';
      c.fillRect(xx, y, 3, 3);
    }
  }
  for (let i = 0; i < 16; i++) {
    const gx = Math.round(wrap(i * 38 + midOff * 1.2, w + 40) - 20);
    c.fillStyle = P.straw;
    c.fillRect(gx, roadY - 10, 2, 8);
    c.fillRect(gx + 3, roadY - 7, 2, 5);
    c.fillRect(gx - 3, roadY - 6, 2, 4);
  }

  // —— L2b: hek ——
  const fenceY = fieldY + Math.round(fieldH * 0.42);
  c.strokeStyle = 'rgba(50,50,48,.55)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, fenceY);
  c.lineTo(w, fenceY);
  c.moveTo(0, fenceY + 8);
  c.lineTo(w, fenceY + 8);
  c.stroke();
  for (let i = 0; i < 9; i++) {
    const pxPost = Math.round(wrap(i * (w / 8) + midOff * 0.6, w + 30) - 15);
    c.fillStyle = '#6a5438';
    c.fillRect(pxPost, fenceY - 4, 4, 22);
    c.fillStyle = '#8a7450';
    c.fillRect(pxPost, fenceY - 4, 2, 22);
  }

  // —— L3: eik ——
  const sway = calm ? 0 : Math.sin(t * 0.9) * 2.5;
  const treeX = Math.round(w * 0.58 + (calm ? 0 : Math.sin(t * 0.35) * 3));
  drawPixelOakTree(c, treeX, roadY - 2, Math.min(w, h) / 140, sway);

  // —— L4: weg ——
  for (let y = roadY; y < h; y += px) {
    const pr = (y - roadY) / Math.max(1, roadH);
    c.fillStyle = pr < 0.25 ? P.roadHi : pr < 0.65 ? P.roadMid : P.roadLo;
    c.fillRect(0, y, w, px);
  }
  c.fillStyle = 'rgba(255,255,255,.08)';
  c.fillRect(0, roadY, w, 3);
  c.fillStyle = 'rgba(0,0,0,.2)';
  c.fillRect(0, roadY + 3, w, 2);
  const nearOff = Math.round(wrap(-pNear, 32));
  for (let x = -32; x < w + 32; x += 32) {
    const xx = x + nearOff;
    c.fillStyle = 'rgba(255,255,255,.1)';
    c.fillRect(xx + 4, roadY + 10, 3, 3);
    c.fillRect(xx + 18, roadY + 18, 2, 2);
    c.fillStyle = 'rgba(20,20,18,.2)';
    c.fillRect(xx + 10, roadY + 14, 3, 3);
    c.fillRect(xx + 24, roadY + 8, 2, 2);
  }

  const vig = c.createLinearGradient(0, 0, 0, h);
  vig.addColorStop(0, 'rgba(30,40,50,.14)');
  vig.addColorStop(0.5, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(24,20,14,.22)');
  c.fillStyle = vig;
  c.fillRect(0, 0, w, h);

  if (opts.caption !== false) {
    c.fillStyle = P.captionBg;
    c.fillRect(6, 6, 118, 14);
    c.fillStyle = P.captionFg;
    c.font = '700 9px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('2/4 · eik', 10, 16);
  }

  c.imageSmoothingEnabled = prev;
  return { roadY, fieldY, treeX, horizonY, id: 'oak' };
}

/** Gestapelde houtblokken-muur (foto-inspiratie). */
function drawPixelLogWall(c, x0, y0, w, h) {
  const P = COUNTRY_PAL;
  const rowH = 5;
  const logW = 7;
  for (let y = 0; y < h; y += rowH) {
    const odd = ((y / rowH) | 0) % 2;
    for (let x = odd * -3; x < w; x += logW) {
      const lx = x0 + x;
      const ly = y0 + y;
      c.fillStyle = ((x + y) % 14 === 0) ? '#4a3a2c' : P.log;
      c.fillRect(lx, ly, logW - 1, rowH - 1);
      c.fillStyle = P.logLite;
      c.fillRect(lx + 1, ly, 2, rowH - 1);
      c.fillStyle = '#2e2418';
      c.fillRect(lx + logW - 2, ly + 1, 1, rowH - 2);
      c.fillStyle = P.logEnd;
      c.fillRect(lx + 2, ly + 1, 2, 2);
    }
  }
}

/** Steenhuis + serre + wit bijgebouw. */
function drawPixelStoneHouse(c, hx, baseY, scale) {
  const s = Math.max(1, scale || 1);
  const P = COUNTRY_PAL;
  const hw = Math.round(58 * s);
  const hh = Math.round(48 * s);
  const sx = hx - Math.round(28 * s);
  c.fillStyle = '#6e787e';
  c.fillRect(sx, baseY - Math.round(22 * s), Math.round(28 * s), Math.round(22 * s));
  c.fillStyle = '#565e64';
  c.beginPath();
  c.moveTo(sx - 2, baseY - Math.round(22 * s));
  c.lineTo(sx + Math.round(14 * s), baseY - Math.round(32 * s));
  c.lineTo(sx + Math.round(30 * s), baseY - Math.round(22 * s));
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(160,180,190,.28)';
  for (let i = 0; i < 3; i++) {
    c.fillRect(sx + 4 + i * 8 * s, baseY - Math.round(18 * s), Math.round(5 * s), Math.round(12 * s));
  }
  c.fillStyle = P.stone;
  c.fillRect(hx, baseY - hh, hw, hh);
  for (let yy = 0; yy < hh; yy += 5) {
    for (let xx = 0; xx < hw; xx += 6) {
      if (((xx + yy) / 2 | 0) % 3 === 0) {
        c.fillStyle = P.stoneDark;
        c.fillRect(hx + xx, baseY - hh + yy, 4, 3);
      } else if (((xx * 3 + yy) | 0) % 5 === 0) {
        c.fillStyle = P.stoneLite;
        c.fillRect(hx + xx + 1, baseY - hh + yy + 1, 3, 2);
      }
    }
  }
  c.fillStyle = '#3a3834';
  c.beginPath();
  c.moveTo(hx - 4, baseY - hh);
  c.lineTo(hx + hw / 2, baseY - hh - Math.round(16 * s));
  c.lineTo(hx + hw + 4, baseY - hh);
  c.closePath();
  c.fill();
  c.fillStyle = '#2a2824';
  c.fillRect(hx + Math.round(hw * 0.42), baseY - hh - Math.round(18 * s), Math.round(6 * s), Math.round(10 * s));
  c.fillStyle = '#1c2228';
  c.fillRect(hx + Math.round(8 * s), baseY - hh + Math.round(12 * s), Math.round(10 * s), Math.round(10 * s));
  c.fillRect(hx + Math.round(40 * s), baseY - hh + Math.round(12 * s), Math.round(10 * s), Math.round(10 * s));
  c.fillRect(hx + Math.round(8 * s), baseY - Math.round(22 * s), Math.round(10 * s), Math.round(10 * s));
  c.fillRect(hx + Math.round(40 * s), baseY - Math.round(22 * s), Math.round(10 * s), Math.round(10 * s));
  c.fillStyle = 'rgba(170,190,200,.3)';
  c.fillRect(hx + Math.round(9 * s), baseY - hh + Math.round(13 * s), Math.round(8 * s), Math.round(4 * s));
  c.fillRect(hx + Math.round(41 * s), baseY - hh + Math.round(13 * s), Math.round(8 * s), Math.round(4 * s));
  c.fillStyle = '#2e2418';
  c.fillRect(hx + Math.round(24 * s), baseY - Math.round(18 * s), Math.round(10 * s), Math.round(18 * s));
  const wx = hx + hw + Math.round(6 * s);
  c.fillStyle = '#d8d6d0';
  c.fillRect(wx, baseY - Math.round(28 * s), Math.round(26 * s), Math.round(28 * s));
  c.fillStyle = '#2e2e2a';
  c.beginPath();
  c.moveTo(wx - 2, baseY - Math.round(28 * s));
  c.lineTo(wx + Math.round(13 * s), baseY - Math.round(38 * s));
  c.lineTo(wx + Math.round(28 * s), baseY - Math.round(28 * s));
  c.closePath();
  c.fill();
  c.fillStyle = '#1c2228';
  c.fillRect(wx + Math.round(8 * s), baseY - Math.round(18 * s), Math.round(8 * s), Math.round(8 * s));
}

/**
 * Startscherm vista 2 — steenhuis + houtstapel + gouden gras (foto).
 * Lagen: sky → bos → huis → houtmuur → gras → bladframe.
 */
function drawMenuStonehouseVista(c, w, h, t, opts) {
  opts = opts || {};
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const lite = !!opts.lite;
  const calm = motionReduced();
  const px = 3;
  const grassH = Math.round(h * 0.32);
  const grassY = h - grassH;
  const wallH = Math.round(18 * (h / 280));
  const wallY = grassY - wallH + 4;
  const horizonY = wallY - Math.round(h * 0.08);

  const pSky = calm ? 0 : t * 3.5;
  const pFar = calm ? 0 : t * 7;
  const pMid = calm ? 0 : t * 12;
  const pNear = calm ? 0 : t * 22;
  const wrap = (v, span) => ((v % span) + span) % span;

  // —— sky ——
  const P = COUNTRY_PAL;
  const sky = c.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, P.skyTop);
  sky.addColorStop(0.5, P.skyMid);
  sky.addColorStop(1, P.skyLow);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, Math.max(horizonY, 1));

  const cloudN = lite ? 3 : 5;
  for (let i = 0; i < cloudN; i++) {
    const cw = 40 + (i % 3) * 16;
    const cx = wrap(i * 0.29 * w + pSky * (0.5 + i * 0.08), w + cw) - cw * 0.5;
    const cy = 6 + (i % 3) * 12;
    c.fillStyle = P.cloud;
    c.fillRect(Math.round(cx), cy + 8, cw, 10);
    c.fillRect(Math.round(cx + 10), cy, cw - 16, 12);
    c.fillStyle = P.cloudShade;
    c.fillRect(Math.round(cx + 6), cy + 16, cw - 10, 3);
  }

  // —— verre dennenrij ——
  const farOff = Math.round(wrap(-pFar, 40) - 20);
  for (let i = -1; i < 16; i++) {
    const tx = Math.round(i * 38 + farOff);
    const th = 34 + ((i * 13) % 20);
    c.fillStyle = i % 2 ? P.forestDeep : P.forestMid;
    c.beginPath();
    c.moveTo(tx + 10, horizonY - th);
    c.lineTo(tx, horizonY);
    c.lineTo(tx + 20, horizonY);
    c.closePath();
    c.fill();
    c.fillStyle = P.forestLite;
    c.beginPath();
    c.moveTo(tx + 10, horizonY - th + 10);
    c.lineTo(tx + 3, horizonY - 8);
    c.lineTo(tx + 17, horizonY - 8);
    c.closePath();
    c.fill();
  }

  // —— mid: tuinstruiken + huis ——
  const midOff = Math.round((calm ? 0 : Math.sin(t * 0.25) * 2));
  c.fillStyle = P.forestMid;
  c.fillRect(0, horizonY, w, wallY - horizonY + 4);
  for (let i = 0; i < 10; i++) {
    const bx = Math.round(wrap(i * 58 + midOff * 2, w + 40) - 20);
    c.fillStyle = i % 2 ? P.leaf : P.leafLite;
    c.beginPath();
    c.ellipse(bx, wallY - 4, 14, 10, 0, 0, TAU);
    c.fill();
  }

  const houseX = Math.round(w * 0.38 + midOff);
  drawPixelStoneHouse(c, houseX, wallY + 2, Math.min(w, h) / 260);

  // —— houtstapel-muur ——
  drawPixelLogWall(c, 0, wallY, w, wallH);
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.fillRect(0, wallY + wallH - 2, w, 2);

  // —— gouden gras voorgrond ——
  for (let y = grassY; y < h; y += px) {
    const pr = (y - grassY) / Math.max(1, grassH);
    c.fillStyle = pr < 0.3 ? P.fieldHi : pr < 0.65 ? P.fieldMid : P.fieldLo;
    c.fillRect(0, y, w, px);
  }
  const nearOff = Math.round(wrap(-pNear, 14));
  for (let x = -14; x < w + 14; x += 5) {
    const xx = x + nearOff;
    const sway = calm ? 0 : Math.sin(t * 2.2 + x * 0.08) * 2;
    c.fillStyle = ((x / 5) | 0) % 3 === 0 ? P.straw : P.fieldHi;
    c.fillRect(Math.round(xx + sway), grassY + 4, 2, grassH - 10);
    c.fillRect(Math.round(xx + 2 - sway), grassY + 10, 1, grassH - 16);
  }

  // —— framing blad (links/rechts, snelste laag) ——
  if (!lite) {
    const leafOff = calm ? 0 : Math.sin(t * 1.4) * 3;
    c.fillStyle = P.leaf;
    for (let i = 0; i < 6; i++) {
      const ly = 10 + i * 28 + leafOff;
      c.beginPath();
      c.ellipse(8 + (i % 2) * 6, ly, 18, 12, -0.4, 0, TAU);
      c.fill();
      c.beginPath();
      c.ellipse(w - 10 - (i % 2) * 5, ly + 8, 16, 11, 0.4, 0, TAU);
      c.fill();
    }
    c.fillStyle = P.leafLite;
    c.beginPath();
    c.ellipse(14, 40 + leafOff, 10, 7, -0.3, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(w - 16, 55 - leafOff, 10, 7, 0.3, 0, TAU);
    c.fill();
  }

  const vig = c.createLinearGradient(0, 0, 0, h);
  vig.addColorStop(0, 'rgba(30,40,50,.12)');
  vig.addColorStop(0.55, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(28,24,16,.22)');
  c.fillStyle = vig;
  c.fillRect(0, 0, w, h);

  if (opts.caption !== false) {
    c.fillStyle = P.captionBg;
    c.fillRect(6, 6, 128, 14);
    c.fillStyle = P.captionFg;
    c.font = '700 9px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('3/4 · steenhuis', 10, 16);
  }

  c.imageSmoothingEnabled = prev;
  return { roadY: grassY + Math.round(grassH * 0.55), fieldY: grassY, horizonY, id: 'stonehouse' };
}

/**
 * Startscherm vista 3 — open landweg-panorama (foto: kronkelweg + akker + haag + heuvelbos).
 * Lagen: heldere sky → heuvelrijen → gouden akker/hek → haag → kronkelende asfaltweg.
 */
function drawMenuOpenRoadVista(c, w, h, t, opts) {
  opts = opts || {};
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const lite = !!opts.lite;
  const calm = motionReduced();
  const px = 3;
  const P = COUNTRY_PAL;
  // Photo-brighter sky than the muted oak/stonehouse set
  const skyTop = '#4a9adf';
  const skyMid = '#7eb8e8';
  const skyLow = '#c5e0f5';
  const hillFar = '#3a6a42';
  const hillMid = '#2e5636';
  const hillNear = '#264a2e';
  const hedge = '#2a5030';
  const hedgeLite = '#3a6840';
  const hedgeDeep = '#1e3e26';

  const roadH = Math.round(h * 0.34);
  const roadY = h - roadH;
  const fieldTop = Math.round(h * 0.48);
  const horizonY = Math.round(h * 0.42);
  const wrap = (v, span) => ((v % span) + span) % span;
  const pSky = calm ? 0 : t * 4.5;
  const pFar = calm ? 0 : t * 6;
  const pMid = calm ? 0 : t * 11;
  const pNear = calm ? 0 : t * 24;

  // —— L0: bright sky ——
  const sky = c.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, skyTop);
  sky.addColorStop(0.55, skyMid);
  sky.addColorStop(1, skyLow);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizonY);

  const cloudN = lite ? 4 : 7;
  for (let i = 0; i < cloudN; i++) {
    const cw = 28 + (i % 4) * 12;
    const cx = wrap(i * 0.22 * w + pSky * (0.55 + i * 0.07), w + cw) - cw * 0.5;
    const cy = 4 + (i % 4) * 10 + (i > 4 ? 4 : 0);
    c.fillStyle = '#f4f9ff';
    c.fillRect(Math.round(cx), cy + 6, cw, 8);
    c.fillRect(Math.round(cx + 6), cy, Math.round(cw * 0.7), 9);
    c.fillRect(Math.round(cx + 12), cy - 3, Math.round(cw * 0.35), 6);
    c.fillStyle = '#d4e4f2';
    c.fillRect(Math.round(cx + 4), cy + 12, cw - 8, 3);
  }

  // —— L1: rolling forest hills (layered) ——
  const farOff = Math.round(wrap(-pFar, 50) - 25);
  const drawHillBand = (baseY, amp, step, col, seed) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, baseY);
    for (let x = 0; x <= w + step; x += step) {
      const yy = baseY - amp * (0.55 + 0.45 * Math.sin((x + farOff + seed) * 0.018));
      c.lineTo(x, yy);
    }
    c.lineTo(w, h);
    c.closePath();
    c.fill();
  };
  drawHillBand(horizonY + 6, 18, 18, hillFar, 10);
  drawHillBand(horizonY + 18, 14, 14, hillMid, 40);
  drawHillBand(horizonY + 28, 10, 12, hillNear, 70);

  // Tree crowns on near hill
  for (let i = -1; i < 18; i++) {
    const tx = Math.round(i * 36 + farOff * 0.6);
    const th = 16 + ((i * 11) % 14);
    const ty = horizonY + 22 - th;
    c.fillStyle = i % 3 === 0 ? hedgeLite : (i % 2 ? hillNear : hedge);
    c.fillRect(tx, ty, 14, th + 6);
    c.fillRect(tx + 2, ty - 5, 10, 7);
    // subtle early-autumn flecks
    if (i % 5 === 0) {
      c.fillStyle = '#a87838';
      c.fillRect(tx + 4, ty + 2, 4, 3);
    }
  }

  // —— L2: golden field (left of road) ——
  for (let y = fieldTop; y < h; y += px) {
    const pr = (y - fieldTop) / Math.max(1, h - fieldTop);
    c.fillStyle = pr < 0.28 ? P.fieldHi : pr < 0.6 ? P.fieldMid : P.fieldLo;
    c.fillRect(0, y, Math.round(w * 0.62), px);
  }
  const midOff = Math.round(wrap(-pMid, 16));
  for (let x = -16; x < w * 0.6; x += 7) {
    const xx = x + midOff;
    for (let y = fieldTop + 4; y < roadY + 20; y += 8) {
      const bit = ((xx + y * 3) & 7);
      c.fillStyle = bit < 2 ? 'rgba(220,200,150,.2)' : bit > 5 ? 'rgba(60,48,24,.14)' : 'rgba(140,110,50,.08)';
      c.fillRect(Math.round(xx), y, 3, 3);
    }
  }

  // Wire fence along field / road edge
  const fencePosts = [
    [0.08, fieldTop + 18], [0.16, fieldTop + 22], [0.24, fieldTop + 28],
    [0.32, fieldTop + 36], [0.40, fieldTop + 48], [0.48, roadY + 8],
  ];
  c.strokeStyle = 'rgba(40,40,38,.5)';
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < fencePosts.length; i++) {
    const [fx, fy] = fencePosts[i];
    const x = Math.round(w * fx);
    const y = Math.round(fy);
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  for (const [fx, fy] of fencePosts) {
    const x = Math.round(w * fx + (calm ? 0 : Math.sin(t + fx * 8) * 0.5));
    const y = Math.round(fy);
    c.fillStyle = '#4a4a48';
    c.fillRect(x - 1, y - 10, 2, 14);
    c.fillStyle = '#6a6a66';
    c.fillRect(x - 1, y - 10, 1, 14);
  }
  // Weed tufts along fence
  for (let i = 0; i < 10; i++) {
    const wx = Math.round(w * (0.06 + i * 0.045));
    const wy = Math.round(fieldTop + 20 + i * 4);
    c.fillStyle = i % 2 ? hedgeLite : P.straw;
    c.fillRect(wx, wy, 2, 8);
    c.fillRect(wx + 2, wy + 2, 1, 5);
  }

  // —— L3: tall green hedge (right) ——
  const hedgeX = Math.round(w * 0.72);
  for (let y = fieldTop - 4; y < h; y += px) {
    const pr = (y - fieldTop) / Math.max(1, h - fieldTop);
    c.fillStyle = pr < 0.2 ? hedgeLite : pr < 0.55 ? hedge : hedgeDeep;
    c.fillRect(hedgeX, y, w - hedgeX, px);
  }
  const leafOff = calm ? 0 : Math.sin(t * 1.2) * 2;
  for (let i = 0; i < (lite ? 6 : 10); i++) {
    const bx = hedgeX + 8 + (i % 3) * 18;
    const by = fieldTop + 6 + i * 16 + leafOff * (i % 2 ? 1 : -1);
    c.fillStyle = i % 2 ? hedgeLite : '#456e48';
    c.beginPath();
    c.ellipse(bx, by, 16, 12, 0.2, 0, TAU);
    c.fill();
  }

  // —— L4: winding asphalt road (bottom-right → left-center) ——
  const segs = [
    { y: h + 2, xl: w * 0.30, xr: w * 0.99 },
    { y: h - roadH * 0.28, xl: w * 0.36, xr: w * 0.92 },
    { y: h - roadH * 0.55, xl: w * 0.40, xr: w * 0.82 },
    { y: h - roadH * 0.78, xl: w * 0.42, xr: w * 0.70 },
    { y: horizonY + 14, xl: w * 0.44, xr: w * 0.56 },
  ];
  // Road fill
  c.beginPath();
  c.moveTo(segs[0].xl, segs[0].y);
  for (let i = 1; i < segs.length; i++) c.lineTo(segs[i].xl, segs[i].y);
  for (let i = segs.length - 1; i >= 0; i--) c.lineTo(segs[i].xr, segs[i].y);
  c.closePath();
  c.fillStyle = P.roadMid;
  c.fill();
  // Road edge highlight / shoulder
  c.strokeStyle = 'rgba(220,214,200,.16)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(segs[0].xl, segs[0].y);
  for (let i = 1; i < segs.length; i++) c.lineTo(segs[i].xl, segs[i].y);
  c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.18)';
  c.beginPath();
  c.moveTo(segs[0].xr, segs[0].y);
  for (let i = 1; i < segs.length; i++) c.lineTo(segs[i].xr, segs[i].y);
  c.stroke();
  // Band shading
  for (let i = 0; i < segs.length - 1; i++) {
    const a = segs[i];
    const b = segs[i + 1];
    const midY = (a.y + b.y) * 0.5;
    const pr = (h - midY) / Math.max(1, roadH);
    c.fillStyle = pr > 0.7 ? 'rgba(255,255,255,.06)' : (pr < 0.35 ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.04)');
    c.beginPath();
    c.moveTo(a.xl, a.y);
    c.lineTo(b.xl, b.y);
    c.lineTo(b.xr, b.y);
    c.lineTo(a.xr, a.y);
    c.closePath();
    c.fill();
  }
  // Gravel sparkle on near road
  const nearOff = Math.round(wrap(-pNear, 28));
  for (let x = -28; x < w + 28; x += 28) {
    const xx = x + nearOff;
    if (xx < w * 0.32 || xx > w * 0.95) continue;
    const yy = h - 18 - ((x * 3) % 12);
    c.fillStyle = 'rgba(255,255,255,.12)';
    c.fillRect(Math.round(xx), yy, 3, 3);
    c.fillStyle = 'rgba(20,20,18,.2)';
    c.fillRect(Math.round(xx + 8), yy + 6, 2, 2);
  }

  // Mid-road tree cluster at the bend (photo: trees at curve)
  if (!lite) {
    const bendX = Math.round(w * 0.52);
    const bendY = horizonY + 20;
    c.fillStyle = hillNear;
    c.fillRect(bendX - 6, bendY - 22, 8, 24);
    c.fillRect(bendX + 8, bendY - 18, 7, 20);
    c.fillStyle = hedgeLite;
    c.beginPath();
    c.ellipse(bendX - 2, bendY - 26, 12, 10, 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(bendX + 12, bendY - 22, 10, 8, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#a87838';
    c.fillRect(bendX + 2, bendY - 28, 3, 3);
  }

  const vig = c.createLinearGradient(0, 0, 0, h);
  vig.addColorStop(0, 'rgba(40,90,140,.1)');
  vig.addColorStop(0.5, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(24,20,14,.2)');
  c.fillStyle = vig;
  c.fillRect(0, 0, w, h);

  if (opts.caption !== false) {
    c.fillStyle = P.captionBg;
    c.fillRect(6, 6, 132, 14);
    c.fillStyle = P.captionFg;
    c.font = '700 9px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('4/4 · open weg', 10, 16);
  }

  c.imageSmoothingEnabled = prev;
  return { roadY: roadY + Math.round(roadH * 0.35), fieldY: fieldTop, horizonY, id: 'openroad' };
}

/**
 * Startscherm vista — vierweg-kruispunt (foto: gravel + asfalt + gouden gras).
 * Vier paden = hub-keuze: links Avontuur · rechtuit Arcade · rechts 2P · hier Collectie.
 */
function drawMenuCrossroadsVista(c, w, h, t, opts) {
  opts = opts || {};
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const lite = !!opts.lite;
  const calm = motionReduced();
  const px = 3;
  const P = COUNTRY_PAL;
  const skyTop = '#4a9adf';
  const skyMid = '#7eb8e8';
  const skyLow = '#c8e4f6';
  const gravelHi = '#b8b0a0';
  const gravelMid = '#9a9284';
  const gravelLo = '#7a7468';
  const asphalt = P.roadMid;
  const asphaltHi = P.roadHi;
  const redBush = '#7a4030';
  const redBushLite = '#9a5840';
  const redBushDeep = '#5a2e24';
  const grassHi = '#c4a85a';
  const grassMid = P.fieldMid;
  const grassLo = P.fieldLo;
  const hedge = '#2e5034';
  const hedgeLite = '#3e6844';

  const horizonY = Math.round(h * 0.40);
  const forkY = Math.round(h * 0.52);
  const wrap = (v, span) => ((v % span) + span) % span;
  const pSky = calm ? 0 : t * 4;
  const pFar = calm ? 0 : t * 5;
  const pulse = calm ? 0 : (0.5 + 0.5 * Math.sin(t * 2.2));

  // —— sky ——
  const sky = c.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, skyTop);
  sky.addColorStop(0.55, skyMid);
  sky.addColorStop(1, skyLow);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizonY);

  const cloudN = lite ? 4 : 6;
  for (let i = 0; i < cloudN; i++) {
    const cw = 30 + (i % 3) * 14;
    const cx = wrap(i * 0.24 * w + pSky * (0.5 + i * 0.08), w + cw) - cw * 0.5;
    const cy = 6 + (i % 3) * 11;
    c.fillStyle = '#f4f9ff';
    c.fillRect(Math.round(cx), cy + 6, cw, 8);
    c.fillRect(Math.round(cx + 8), cy, Math.round(cw * 0.65), 9);
    c.fillStyle = '#d4e4f2';
    c.fillRect(Math.round(cx + 4), cy + 12, cw - 8, 3);
  }

  // —— distant hills / forest ——
  const farOff = Math.round(wrap(-pFar, 40) - 20);
  c.fillStyle = '#3a6a42';
  c.beginPath();
  c.moveTo(0, h);
  c.lineTo(0, horizonY + 4);
  for (let x = 0; x <= w; x += 16) {
    c.lineTo(x, horizonY + 4 - 12 * (0.5 + 0.5 * Math.sin((x + farOff) * 0.02)));
  }
  c.lineTo(w, h);
  c.closePath();
  c.fill();
  for (let i = -1; i < 16; i++) {
    const tx = Math.round(i * 40 + farOff * 0.5);
    const th = 18 + ((i * 9) % 16);
    c.fillStyle = i % 2 ? '#2a5030' : '#355a38';
    c.fillRect(tx, horizonY - th + 8, 16, th + 10);
    c.fillRect(tx + 3, horizonY - th + 2, 10, 8);
  }

  // —— golden grass field base ——
  for (let y = horizonY + 6; y < h; y += px) {
    const pr = (y - horizonY) / Math.max(1, h - horizonY);
    c.fillStyle = pr < 0.25 ? grassHi : pr < 0.55 ? grassMid : grassLo;
    c.fillRect(0, y, w, px);
  }
  for (let x = 0; x < w; x += 6) {
    for (let y = horizonY + 10; y < forkY + 20; y += 9) {
      const bit = ((x + y * 3) & 7);
      if (bit < 2) {
        c.fillStyle = 'rgba(220,200,140,.18)';
        c.fillRect(x, y, 3, 3);
      }
    }
  }

  // —— LEFT gravel path ——
  c.beginPath();
  c.moveTo(0, Math.round(h * 0.62));
  c.lineTo(Math.round(w * 0.38), forkY + 4);
  c.lineTo(Math.round(w * 0.42), forkY + 18);
  c.lineTo(0, Math.round(h * 0.78));
  c.closePath();
  c.fillStyle = gravelMid;
  c.fill();
  c.fillStyle = gravelHi;
  c.beginPath();
  c.moveTo(0, Math.round(h * 0.62));
  c.lineTo(Math.round(w * 0.38), forkY + 4);
  c.lineTo(Math.round(w * 0.36), forkY + 10);
  c.lineTo(0, Math.round(h * 0.68));
  c.closePath();
  c.fill();

  // —— RIGHT gravel path ——
  c.beginPath();
  c.moveTo(w, Math.round(h * 0.58));
  c.lineTo(Math.round(w * 0.62), forkY + 2);
  c.lineTo(Math.round(w * 0.58), forkY + 20);
  c.lineTo(w, Math.round(h * 0.76));
  c.closePath();
  c.fillStyle = gravelMid;
  c.fill();
  c.fillStyle = gravelLo;
  c.beginPath();
  c.moveTo(w, Math.round(h * 0.70));
  c.lineTo(Math.round(w * 0.60), forkY + 14);
  c.lineTo(Math.round(w * 0.58), forkY + 20);
  c.lineTo(w, Math.round(h * 0.76));
  c.closePath();
  c.fill();

  // —— CENTER asphalt going into trees ——
  c.beginPath();
  c.moveTo(Math.round(w * 0.40), forkY);
  c.lineTo(Math.round(w * 0.46), horizonY + 14);
  c.lineTo(Math.round(w * 0.54), horizonY + 14);
  c.lineTo(Math.round(w * 0.60), forkY);
  c.closePath();
  c.fillStyle = asphalt;
  c.fill();
  c.fillStyle = asphaltHi;
  c.fillRect(Math.round(w * 0.47), horizonY + 14, Math.round(w * 0.06), forkY - horizonY - 12);

  // —— FOREGROUND gravel (you stand here) ——
  c.beginPath();
  c.moveTo(Math.round(w * 0.18), h);
  c.lineTo(Math.round(w * 0.38), forkY + 8);
  c.lineTo(Math.round(w * 0.62), forkY + 8);
  c.lineTo(Math.round(w * 0.88), h);
  c.closePath();
  c.fillStyle = gravelMid;
  c.fill();
  // gravel sparkle
  for (let i = 0; i < (lite ? 10 : 18); i++) {
    const gx = Math.round(w * 0.28 + (i * 37) % Math.round(w * 0.44));
    const gy = Math.round(forkY + 24 + (i * 19) % Math.round(h - forkY - 30));
    c.fillStyle = i % 2 ? 'rgba(255,255,255,.14)' : 'rgba(40,36,30,.2)';
    c.fillRect(gx, gy, 2 + (i % 2), 2);
  }
  c.fillStyle = gravelHi;
  c.fillRect(Math.round(w * 0.35), forkY + 6, Math.round(w * 0.30), 4);

  // Fence post + gate hint (left)
  const postX = Math.round(w * 0.08);
  const postY = Math.round(h * 0.58);
  c.fillStyle = P.log;
  c.fillRect(postX, postY - 28, 4, 32);
  c.fillStyle = P.logLite;
  c.fillRect(postX, postY - 28, 2, 32);
  c.strokeStyle = 'rgba(80,80,78,.55)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(postX + 4, postY - 18);
  c.lineTo(postX + 28, postY - 14);
  c.stroke();

  // Reddish bush (right — photo anchor)
  const bx = Math.round(w * 0.78);
  const by = Math.round(h * 0.55);
  c.fillStyle = redBushDeep;
  c.beginPath();
  c.ellipse(bx, by, 28, 22, 0, 0, TAU);
  c.fill();
  c.fillStyle = redBush;
  c.beginPath();
  c.ellipse(bx - 8, by - 6, 18, 14, -0.2, 0, TAU);
  c.fill();
  c.fillStyle = redBushLite;
  c.beginPath();
  c.ellipse(bx + 6, by - 10, 14, 11, 0.15, 0, TAU);
  c.fill();
  c.fillStyle = hedge;
  c.beginPath();
  c.ellipse(bx - 22, by + 4, 12, 10, 0, 0, TAU);
  c.fill();

  // Green trees flanking the asphalt vanishing point
  c.fillStyle = hedge;
  c.fillRect(Math.round(w * 0.40) - 14, horizonY - 6, 12, 28);
  c.fillRect(Math.round(w * 0.60) + 2, horizonY - 4, 12, 26);
  c.fillStyle = hedgeLite;
  c.beginPath();
  c.ellipse(Math.round(w * 0.40) - 8, horizonY - 10, 14, 11, 0, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(Math.round(w * 0.60) + 8, horizonY - 8, 13, 10, 0, 0, TAU);
  c.fill();

  // —— Four-path choice markers (hub colors) ——
  const lab = (key, fallback) => {
    try { return (typeof t === 'function' && t(key)) || fallback; } catch (_) { return fallback; }
  };
  const markers = [
    { x: w * 0.18, y: h * 0.64, label: lab('menu.adventure', 'Avontuur'), col: '#7cf5aa', dir: '←' },
    { x: w * 0.50, y: forkY - 6, label: lab('menu.arcade', 'Arcade'), col: '#9db8ff', dir: '↑' },
    { x: w * 0.78, y: h * 0.62, label: lab('menu.versus', '2P'), col: '#ff9ab8', dir: '→' },
    { x: w * 0.50, y: h * 0.88, label: lab('menu.collect', 'Collectie'), col: '#d8a8ff', dir: '●' },
  ];
  // Shorten long translated versus labels for pixel chip
  if (markers[2].label && markers[2].label.length > 10) markers[2].label = '2P';
  c.font = '700 8px -apple-system, sans-serif';
  c.textAlign = 'center';
  for (const m of markers) {
    const mx = Math.round(m.x);
    const my = Math.round(m.y);
    const glow = 0.55 + pulse * 0.35;
    c.fillStyle = m.col;
    c.globalAlpha = glow;
    // chevron / node
    if (m.dir === '←') {
      c.fillRect(mx - 10, my - 2, 14, 4);
      c.fillRect(mx - 10, my - 6, 4, 12);
    } else if (m.dir === '→') {
      c.fillRect(mx - 4, my - 2, 14, 4);
      c.fillRect(mx + 6, my - 6, 4, 12);
    } else if (m.dir === '↑') {
      c.fillRect(mx - 2, my - 10, 4, 14);
      c.fillRect(mx - 6, my - 10, 12, 4);
    } else {
      c.beginPath();
      c.arc(mx, my - 4, 4, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 0.92;
    c.fillStyle = 'rgba(12,14,16,.55)';
    const tw = Math.ceil(c.measureText(m.label).width) + 8;
    c.fillRect(mx - tw / 2, my + 4, tw, 11);
    c.fillStyle = m.col;
    c.fillText(m.label, mx, my + 12);
  }
  c.globalAlpha = 1;

  // Soft vignette
  const vig = c.createLinearGradient(0, 0, 0, h);
  vig.addColorStop(0, 'rgba(40,90,140,.08)');
  vig.addColorStop(0.45, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(24,20,14,.24)');
  c.fillStyle = vig;
  c.fillRect(0, 0, w, h);

  if (opts.caption !== false) {
    c.fillStyle = P.captionBg;
    c.fillRect(6, 6, 148, 14);
    c.fillStyle = P.captionFg;
    c.font = '700 9px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('1/4 · kruispunt', 10, 16);
  }

  c.imageSmoothingEnabled = prev;
  return { roadY: forkY + 20, fieldY: horizonY + 6, horizonY, id: 'crossroads' };
}

/**
 * d20 #8 — Menu hero pixel grondstrip.
 * Chunky asphalt/gravel edge that unifies both vistas with the title block.
 */
function drawMenuPixelGroundStrip(c, w, h, t) {
  const P = typeof COUNTRY_PAL !== 'undefined' ? COUNTRY_PAL : null;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const px = 3;
  const stripH = Math.max(18, Math.round(h * 0.09));
  const y0 = h - stripH;
  const calm = motionReduced();
  const wrap = (v, span) => ((v % span) + span) % span;
  const scroll = calm ? 0 : t * 18;

  for (let y = 0; y < stripH; y += px) {
    const pr = y / stripH;
    c.fillStyle = pr < 0.28
      ? (P ? P.roadHi : '#7a7874')
      : pr < 0.62
        ? (P ? P.roadMid : '#5e5c58')
        : (P ? P.roadLo : '#484642');
    c.fillRect(0, y0 + y, w, px);
  }
  // Seam highlight where vista meets strip
  c.fillStyle = 'rgba(220,214,200,.14)';
  c.fillRect(0, y0, w, 2);
  c.fillStyle = 'rgba(0,0,0,.28)';
  c.fillRect(0, y0 + 2, w, 2);

  // Scrolling gravel pixels
  const span = 29;
  const off = wrap(-scroll, span);
  for (let x = off - span; x < w + span; x += span) {
    c.fillStyle = 'rgba(255,255,255,.1)';
    c.fillRect(Math.round(x + 4), y0 + 7, px, px);
    c.fillRect(Math.round(x + 16), y0 + 12, 2, 2);
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(Math.round(x + 10), y0 + 9, px, px);
    c.fillRect(Math.round(x + 22), y0 + 14, 2, 2);
  }
  // Soft tufts peeking from field into strip
  for (let i = 0; i < 11; i++) {
    const tx = Math.round(wrap(i * 58 + scroll * 0.35, w + 40) - 20);
    c.fillStyle = P ? P.straw : '#a88850';
    c.fillRect(tx, y0 - 4, 2, 5);
    c.fillRect(tx + 3, y0 - 3, 1, 4);
  }

  c.imageSmoothingEnabled = prev;
}

function drawMenuHeroPixelGround(c, w, h, groundY, t) {
  // Legacy hook — menu gebruikt semi-2.5D vista; fallback grasstrook
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

/**
 * d20 polish #20 — Laadscherm / splash strip.
 * Compact countryside pixel strip (COUNTRY_PAL) for boot + tunnel overlay.
 */
function paintSplashStripCanvas(cv, t, opts) {
  if (!cv) return;
  opts = opts || {};
  const c = cv.getContext('2d');
  if (!c) return;
  const w = cv.width | 0;
  const h = cv.height | 0;
  if (w < 8 || h < 8) return;
  const P = typeof COUNTRY_PAL !== 'undefined' ? COUNTRY_PAL : null;
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const calm = typeof motionReduced === 'function' && motionReduced();
  const px = 3;
  const wrap = (v, span) => ((v % span) + span) % span;
  const scroll = calm ? 0 : (t || 0) * 20;
  const progress = opts.progress != null ? Math.max(0, Math.min(1, opts.progress)) : 1;
  const compact = !!opts.compact;

  const skyTop = P ? P.skyTop : '#4a6a82';
  const skyMid = P ? P.skyMid : '#7a94a6';
  const skyLow = P ? P.skyLow : '#b4c2cc';
  const fieldHi = P ? P.fieldHi : '#b89a5c';
  const fieldMid = P ? P.fieldMid : '#9a7e48';
  const fieldLo = P ? P.fieldLo : '#7a6438';
  const forest = P ? P.forestMid : '#2e4034';
  const roadHi = P ? P.roadHi : '#7a7874';
  const roadMid = P ? P.roadMid : '#5e5c58';
  const roadLo = P ? P.roadLo : '#484642';
  const straw = P ? P.straw : '#a88850';

  const roadH = Math.max(14, Math.round(h * (compact ? 0.22 : 0.2)));
  const fieldH = Math.max(16, Math.round(h * (compact ? 0.26 : 0.3)));
  const roadY = h - roadH;
  const fieldY = roadY - fieldH;
  const horizonY = fieldY;

  // Sky bands
  for (let y = 0; y < horizonY; y += px) {
    const pr = y / Math.max(1, horizonY);
    c.fillStyle = pr < 0.4 ? skyTop : pr < 0.75 ? skyMid : skyLow;
    c.fillRect(0, y, w, px);
  }

  // Soft clouds (parallax)
  const cloudOff = wrap(-scroll * 0.35, 64);
  c.fillStyle = P ? P.cloud : '#e8eef2';
  for (let i = 0; i < 5; i++) {
    const cx = Math.round(wrap(cloudOff + i * 96 + i * 17, w + 80) - 40);
    const cy = 10 + (i % 3) * 8;
    c.fillRect(cx, cy, 22, 6);
    c.fillRect(cx + 6, cy - 4, 14, 5);
    c.fillStyle = P ? P.cloudShade : '#c8d2da';
    c.fillRect(cx + 4, cy + 4, 16, 3);
    c.fillStyle = P ? P.cloud : '#e8eef2';
  }

  // Far forest silhouette
  const farOff = wrap(-scroll * 0.55, 40);
  c.fillStyle = forest;
  for (let x = farOff - 40; x < w + 40; x += 18) {
    const th = 10 + ((Math.round(x) * 13) % 14);
    c.fillRect(Math.round(x), horizonY - th, 12, th);
    c.fillRect(Math.round(x) + 3, horizonY - th - 6, 8, 8);
  }

  // Field bands
  for (let y = fieldY; y < roadY; y += px) {
    const pr = (y - fieldY) / Math.max(1, fieldH);
    c.fillStyle = pr < 0.35 ? fieldHi : pr < 0.7 ? fieldMid : fieldLo;
    c.fillRect(0, y, w, px);
  }
  // Straw rows
  const strawOff = wrap(-scroll * 0.9, 11);
  c.fillStyle = 'rgba(0,0,0,.12)';
  for (let x = strawOff - 11; x < w + 11; x += 11) {
    c.fillRect(Math.round(x), fieldY + 6, 1, fieldH - 10);
  }

  // Mini oak (left) — reuse canopy clusters when available
  const oakX = Math.round(w * 0.18);
  const oakBase = roadY - 2;
  if (typeof drawPixelOakTree === 'function' && !compact) {
    const sway = calm ? 0 : Math.sin((t || 0) * 1.4) * 1.5;
    drawPixelOakTree(c, oakX, oakBase, 0.55, sway);
  } else {
    c.fillStyle = '#3a3024';
    c.fillRect(oakX - 3, oakBase - 28, 6, 28);
    c.fillStyle = P ? P.oakMid : '#354a38';
    c.beginPath();
    c.ellipse(oakX, oakBase - 34, 16, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = P ? P.oakLite : '#465a46';
    c.beginPath();
    c.ellipse(oakX - 6, oakBase - 40, 10, 8, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Fence posts along field edge
  const fenceOff = wrap(-scroll * 1.1, 28);
  for (let x = fenceOff - 28; x < w + 28; x += 28) {
    const fx = Math.round(x);
    c.fillStyle = P ? P.log : '#5c4a38';
    c.fillRect(fx, fieldY + 4, 3, roadY - fieldY - 6);
    c.fillStyle = P ? P.logLite : '#7a6448';
    c.fillRect(fx, fieldY + 10, 14, 2);
  }

  // Road
  for (let y = roadY; y < h; y += px) {
    const pr = (y - roadY) / Math.max(1, roadH);
    c.fillStyle = pr < 0.28 ? roadHi : pr < 0.62 ? roadMid : roadLo;
    c.fillRect(0, y, w, px);
  }
  c.fillStyle = 'rgba(220,214,200,.14)';
  c.fillRect(0, roadY, w, 2);
  // Center dashes
  const dashOff = wrap(-scroll * 1.6, 22);
  c.fillStyle = straw;
  for (let x = dashOff - 22; x < w + 22; x += 22) {
    c.fillRect(Math.round(x), roadY + Math.round(roadH * 0.42), 10, 2);
  }
  // Progress gleam along road (load fill metaphor)
  if (progress < 1 || opts.progress != null) {
    const gw = Math.round(w * progress);
    c.fillStyle = 'rgba(216,201,160,.22)';
    c.fillRect(0, roadY, gw, 3);
    c.fillStyle = 'rgba(168,140,80,.35)';
    c.fillRect(Math.max(0, gw - 4), roadY, 4, roadH);
  }

  // Stickmen strolling on the road
  const footY = roadY + Math.round(roadH * 0.55);
  const walk = calm ? 0 : Math.sin((t || 0) * 5) * 1.5;
  const drawSplashStick = (x, face, col, sc) => {
    const s = sc || 1;
    c.save();
    c.translate(x, footY + walk * (face > 0 ? 1 : 0.6));
    c.scale(face * s, s);
    c.strokeStyle = col;
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -18);
    c.stroke();
    const leg = calm ? 0 : Math.sin((t || 0) * 7 + face) * 3.5;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-3, 5 + leg * 0.3);
    c.moveTo(0, 0);
    c.lineTo(3, 5 - leg * 0.3);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -12);
    c.lineTo(-5, -6);
    c.moveTo(0, -12);
    c.lineTo(5, -8);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.arc(0, -22, 4.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };
  const stroll = calm ? 0 : Math.sin((t || 0) * 0.7) * 10;
  drawSplashStick(w * 0.58 + stroll, 1, '#d0d4da', compact ? 0.85 : 1);
  drawSplashStick(w * 0.72 + stroll * 0.6, -1, '#c09098', compact ? 0.9 : 1.05);

  // Soft caption bar (non-compact)
  if (!compact) {
    c.fillStyle = P ? P.captionBg : 'rgba(18,22,26,.55)';
    c.fillRect(0, h - 14, w, 14);
    c.fillStyle = P ? P.captionFg : 'rgba(220,214,200,.82)';
    c.font = 'bold 9px monospace';
    c.textAlign = 'left';
    c.fillText('LANDWEG · MONSTER ARENA', 8, h - 4);
  }

  c.imageSmoothingEnabled = prev;
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

