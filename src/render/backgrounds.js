/* ========================== ACHTERGRONDEN ============================== */
const THEMES = {
  veld:    { sky1: '#7ec8ff', sky2: '#cfeeff', hill: '#5cb85c', hill2: '#3f9b47', ground: '#4c8f3f', gtop: '#66b356', deco: 'bloem' },
  landweg: { sky1: '#4ea6e8', sky2: '#c5e0f5', hill: '#3f8a48', hill2: '#2f6a38', ground: '#b8964a', gtop: '#d4b45e', deco: 'struik' },
  bos:     { sky1: '#5aa9d6', sky2: '#bfe6d0', hill: '#2f7a45', hill2: '#215c33', ground: '#3c6b33', gtop: '#4c8543', deco: 'boom' },
  grot:    { sky1: '#232840', sky2: '#3a4265', hill: '#2a3050', hill2: '#1d2340', ground: '#3d4056', gtop: '#4d5170', deco: 'stalag' },
  vulkaan: { sky1: '#3a1f28', sky2: '#7a3020', hill: '#552430', hill2: '#3a1820', ground: '#4a2a28', gtop: '#5e3630', deco: 'lava' },
  cyber:   { sky1: '#0a1030', sky2: '#252a60', hill: '#1c2350', hill2: '#131840', ground: '#20264a', gtop: '#2c3468', deco: 'neon' },
  dojo:    { sky1: '#3a2d24', sky2: '#6a5240', hill: '#4a3a2c', hill2: '#3a2d22', ground: '#7a5c3c', gtop: '#8f6f4a', deco: 'lampion' },
  sloop:   { sky1: '#8fb6d0', sky2: '#d8e8f0', hill: '#7a8794', hill2: '#5f6b78', ground: '#6f7684', gtop: '#848b99', deco: 'kraan' },
};

function drawBackground(c, themeName, t, ground, scroll, stageFx) {
  scroll = scroll || 0;
  const th = THEMES[themeName] || THEMES.veld;
  const g = c.createLinearGradient(0, 0, 0, ground);
  g.addColorStop(0, th.sky1); g.addColorStop(1, th.sky2);
  c.fillStyle = g; c.fillRect(0, 0, W, ground);
  const wrap = (x, span) => ((x % span) + span) % span;

  if (themeName === 'grot' || themeName === 'cyber') {
    c.fillStyle = 'rgba(255,255,255,.5)';
    const starN = Perf.tier >= 1 ? 14 : 26;
    for (let i = 0; i < starN; i++) {
      const x = wrap(i * 137.5 - scroll * 0.08, W), y = (i * 61.3) % (ground * 0.7);
      const tw = 0.5 + Math.sin(t * 2 + i) * 0.5;
      c.globalAlpha = 0.25 + tw * 0.5;
      c.fillRect(x, y, 2, 2);
    }
    c.globalAlpha = 1;
  } else {
    // pixel-art wolken (art-upgrade 1/4) — cached sprite, drijft langzaam mee
    const cloud = SceneryArt.get(themeName, 'cloud');
    if (cloud) {
      const prev = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      const cloudN = Perf.tier >= 1 ? 2 : 4;
      for (let i = 0; i < cloudN; i++) {
        const s = (i % 2 ? 2.6 : 3.4);
        const cw = cloud.width * s, chh = cloud.height * s;
        const x = wrap(i * 260 + t * 10 - scroll * 0.15, W + 240) - 120;
        const y = 36 + (i % 3) * 44;
        c.globalAlpha = 0.75;
        c.drawImage(cloud, Math.round(x), y, cw, chh);
      }
      c.globalAlpha = 1;
      c.imageSmoothingEnabled = prev;
    }
  }
  // pixel-art skyline per thema (art-upgrade 1/4) — traagste parallax-laag
  const farTile = SceneryArt.get(themeName, 'far');
  if (farTile && Perf.tier < 2) {
    drawSceneryTile(c, farTile, ground - 52 - farTile.height * SCENERY_SCALE, scroll, 0.18);
  }
  // heuvels (parallax: verre laag traag, nabije laag sneller)
  c.fillStyle = th.hill;
  c.beginPath(); c.moveTo(0, ground);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, ground - 60 - Math.sin((x + scroll * 0.3) * 0.008 + 1) * 40);
  c.lineTo(W, ground); c.closePath(); c.fill();
  c.fillStyle = th.hill2;
  c.beginPath(); c.moveTo(0, ground);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, ground - 26 - Math.sin((x + scroll * 0.55) * 0.013 + 4) * 22);
  c.lineTo(W, ground); c.closePath(); c.fill();

  // decoratie (scrollt mee — wrap zodat het oneindig doorloopt)
  const dSpan = W + 220;
  const dX = (base) => wrap(base - scroll * 0.7, dSpan) - 110;
  if (th.deco === 'boom') {
    // pixel-art bomen (art-upgrade 1/4) — cached sprite, 2 formaten
    const tree = SceneryArt.get(themeName, 'tree');
    if (tree) {
      const prev = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      const treeN = Perf.tier >= 2 ? 3 : (Perf.tier >= 1 ? 4 : 5);
      for (let i = 0; i < treeN; i++) {
        const x = dX((i * 0.22 + 0.06) * dSpan);
        const s = i % 2 ? 3.6 : 4.6;
        const twd = tree.width * s, thg = tree.height * s;
        c.drawImage(tree, Math.round(x - twd / 2), Math.round(ground - thg), twd, thg);
      }
      c.imageSmoothingEnabled = prev;
    } else {
      for (let i = 0; i < 5; i++) {
        const x = dX((i * 0.22 + 0.06) * dSpan);
        c.fillStyle = '#54381f';
        c.fillRect(x - 5, ground - 90, 10, 90);
        c.fillStyle = th.hill2;
        c.beginPath(); c.arc(x, ground - 105, 38, 0, TAU); c.fill();
        c.beginPath(); c.arc(x - 24, ground - 82, 27, 0, TAU); c.fill();
        c.beginPath(); c.arc(x + 24, ground - 82, 27, 0, TAU); c.fill();
      }
    }
  } else if (th.deco === 'stalag') {
    c.fillStyle = '#20263f';
    for (let i = 0; i < 7; i++) {
      const x = dX((i * 0.15 + 0.04) * dSpan);
      c.beginPath(); c.moveTo(x - 20, 0); c.lineTo(x, 70 + (i % 3) * 32); c.lineTo(x + 20, 0); c.closePath(); c.fill();
    }
  } else if (th.deco === 'lava') {
    c.fillStyle = '#ff7a30';
    for (let i = 0; i < 8; i++) {
      const x = dX((i * 0.13 + 0.05) * dSpan);
      const bub = Math.max(0, Math.sin(t * 3 + i * 2.2)) * 5;
      c.beginPath(); c.arc(x, ground - 8, 4 + bub, 0, TAU); c.fill();
    }
  } else if (th.deco === 'neon') {
    for (let i = 0; i < 6; i++) {
      const x = dX((i * 0.18 + 0.03) * dSpan), h = 110 + (i % 3) * 60;
      c.fillStyle = '#161c3f';
      c.fillRect(x, ground - h, 54, h);
      c.fillStyle = i % 2 ? '#ff4dd2' : '#39d0ff';
      for (let wy = ground - h + 12; wy < ground - 12; wy += 22)
        for (let wx = x + 8; wx < x + 48; wx += 16)
          if ((Math.round(wx - x) + wy) % 3 !== 0) c.fillRect(wx, wy, 7, 9);
    }
  } else if (th.deco === 'lampion') {
    for (let i = 0; i < 4; i++) {
      const x = dX((i * 0.28 + 0.1) * dSpan);
      c.strokeStyle = '#2c2018'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 46); c.stroke();
      c.fillStyle = '#e04f4f';
      c.beginPath(); c.ellipse(x, 62, 15, 19, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffd75e'; c.fillRect(x - 5, 78, 10, 5);
    }
    c.fillStyle = 'rgba(0,0,0,.15)';
    const off = wrap(-scroll * 0.7, 90);
    for (let x = off - 90; x < W; x += 90) c.fillRect(x, 0, 4, ground);
  } else if (th.deco === 'kraan') {
    c.strokeStyle = '#c9a227'; c.lineWidth = 7;
    const cx = dX(W * 0.16);
    c.beginPath(); c.moveTo(cx, ground); c.lineTo(cx, 60); c.lineTo(cx + 200, 60); c.stroke();
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx + 170, 60); c.lineTo(cx + 170, 130); c.stroke();
    c.fillStyle = '#5f6b78'; c.fillRect(cx + 155, 130, 30, 22);
  } else if (th.deco === 'bloem') {
    for (let i = 0; i < 9; i++) {
      const x = dX((i * 0.115 + 0.03) * dSpan);
      c.fillStyle = ['#ff6b8a', '#ffd75e', '#fff'][i % 3];
      c.beginPath(); c.arc(x, ground - 7, 4, 0, TAU); c.fill();
      c.strokeStyle = '#2f7a45'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, ground - 4); c.lineTo(x, ground + 4); c.stroke();
    }
  } else if (th.deco === 'struik') {
    // landweg: rode struik + gouden grasplukken + houtstapel (steenhuis-foto)
    for (let i = 0; i < 5; i++) {
      const x = dX((i * 0.22 + 0.08) * dSpan);
      const tall = i % 2 === 0;
      c.fillStyle = tall ? '#8a2e3a' : '#6e2430';
      c.beginPath();
      c.ellipse(x, ground - (tall ? 22 : 14), tall ? 28 : 18, tall ? 26 : 16, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#a84852';
      c.beginPath();
      c.ellipse(x - 6, ground - (tall ? 28 : 18), tall ? 12 : 8, tall ? 10 : 7, 0, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < 7; i++) {
      const x = dX((i * 0.14 + 0.02) * dSpan);
      c.fillStyle = '#c9a24a';
      c.fillRect(x - 2, ground - 10, 3, 10);
      c.fillRect(x + 3, ground - 7, 2, 7);
    }
    if (typeof drawPixelLogWall === 'function' && Perf.tier < 2) {
      const lx = dX(0.55 * dSpan);
      drawPixelLogWall(c, lx - 40, ground - 16, 80, 16);
    }
  }

  // grond
  const gg = c.createLinearGradient(0, ground, 0, H);
  gg.addColorStop(0, th.gtop); gg.addColorStop(1, th.ground);
  c.fillStyle = gg; c.fillRect(0, ground, W, H - ground);
  c.fillStyle = 'rgba(255,255,255,.12)';
  c.fillRect(0, ground, W, 3);

  // landweg: grindpad over de gouden akker (foto-pixelmap)
  if (themeName === 'landweg') {
    const roadY = ground + 6;
    const roadH = Math.max(28, (H - ground) * 0.42);
    c.fillStyle = '#9a9a92';
    c.fillRect(0, roadY, W, roadH);
    c.fillStyle = '#b0aea4';
    c.fillRect(0, roadY, W, 5);
    c.fillStyle = '#7e7e76';
    c.fillRect(0, roadY + roadH - 4, W, 4);
    // grind-pixels
    if (!fxLite()) {
      const wrapSp = 37;
      const offR = wrap(-scroll * 1.05, wrapSp);
      for (let x = offR - wrapSp; x < W + wrapSp; x += wrapSp) {
        c.fillStyle = 'rgba(255,255,255,.18)';
        c.fillRect(x + 4, roadY + 10, 3, 3);
        c.fillRect(x + 18, roadY + 22, 2, 2);
        c.fillStyle = 'rgba(40,40,36,.22)';
        c.fillRect(x + 12, roadY + 16, 3, 3);
        c.fillRect(x + 26, roadY + 8, 2, 2);
      }
    }
    // linker akker-rand (goud)
    c.fillStyle = 'rgba(212,180,94,.55)';
    c.fillRect(0, ground, W * 0.38, 8);
  }

  // grondstrepen — lopen mee met de wereld (loop-gevoel)
  c.fillStyle = 'rgba(0,0,0,.14)';
  const span = 92;
  const off = wrap(-scroll, span);
  for (let x = off - span; x < W + span; x += span) {
    c.fillRect(x, ground + 10, 36, 4);
    c.fillRect(x + 52, ground + 26, 20, 3);
  }
  // weer per thema (art-upgrade 4/4): blaadjes/bloesem/sintels/regen/stof
  drawThemeWeather(c, themeName, t, ground, scroll);
  // pixel-speckles op de grond (art-upgrade 1/4) — deterministisch, scroll-vast
  if (!fxLite()) {
    const spSpan = 61;
    const spOff = wrap(-scroll, spSpan);
    c.fillStyle = 'rgba(255,255,255,.08)';
    for (let x = spOff - spSpan; x < W + spSpan; x += spSpan) {
      c.fillRect(x + 8, ground + 18, 3, 3);
      c.fillRect(x + 34, ground + 38, 3, 3);
    }
    c.fillStyle = 'rgba(0,0,0,.12)';
    for (let x = spOff - spSpan; x < W + spSpan; x += spSpan) {
      c.fillRect(x + 22, ground + 30, 3, 3);
      c.fillRect(x + 48, ground + 14, 3, 3);
    }
  }

  // Stage-delen (avontuur): decor evolueert per deel — schemer + rotsen + arena-fakkels
  if (stageFx && stageFx.pr > 0.02) {
    const pr = clamp(stageFx.pr, 0, 1);
    const part = stageFx.part || 1;
    // 1) lucht kleurt langzaam naar schemer richting het einde
    const dusk = c.createLinearGradient(0, 0, 0, ground);
    dusk.addColorStop(0, `rgba(30,14,60,${(pr * 0.30).toFixed(3)})`);
    dusk.addColorStop(1, `rgba(90,30,50,${(pr * 0.16).toFixed(3)})`);
    c.fillStyle = dusk;
    c.fillRect(0, 0, W, ground);
    // 2) vanaf deel 2: rotsblokken op de grondlijn
    if (part >= 2) {
      const rSpan = W + 260;
      for (let i = 0; i < 5; i++) {
        const x = wrap((i * 0.21 + 0.12) * rSpan - scroll * 0.85, rSpan) - 130;
        const s = 10 + (i % 3) * 7;
        c.fillStyle = 'rgba(20,16,34,.55)';
        c.beginPath();
        c.moveTo(x - s, ground);
        c.lineTo(x - s * 0.3, ground - s);
        c.lineTo(x + s * 0.5, ground - s * 0.7);
        c.lineTo(x + s, ground);
        c.closePath(); c.fill();
      }
    }
    // 3) deel 3: arena-fakkels (extra fel bij baas-level)
    if (part >= 3) {
      const fSpan = W + 300;
      const n = stageFx.boss ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const x = wrap((i * 0.27 + 0.08) * fSpan - scroll * 0.9, fSpan) - 150;
        c.strokeStyle = '#3a2a1a'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(x, ground); c.lineTo(x, ground - 64); c.stroke();
        const fl = Math.sin(t * 9 + i * 2.1) * 3;
        c.fillStyle = stageFx.boss ? '#ff6b3f' : '#ffb347';
        c.beginPath();
        c.ellipse(x, ground - 72 + fl * 0.4, 7 + fl * 0.5, 13 + fl, 0, 0, TAU);
        c.fill();
        c.fillStyle = '#ffe9a8';
        c.beginPath();
        c.ellipse(x, ground - 68 + fl * 0.3, 3.5, 6, 0, 0, TAU);
        c.fill();
      }
      if (stageFx.boss) {
        c.fillStyle = `rgba(150,20,40,${(0.05 + Math.sin(t * 2.2) * 0.02).toFixed(3)})`;
        c.fillRect(0, 0, W, ground);
      }
    }
  }
}

