/* ============================ TEKENHULPEN ============================== */
function seg(x, y, ang, len) { return [x + Math.cos(ang) * len, y + Math.sin(ang) * len]; }

function drawWeaponShape(c, id, spin, moveIdx) {
  // getekend langs +x vanaf de hand (0,0); c is al getransleerd/geroteerd
  c.lineCap = 'round';
  const mi = ((moveIdx || 0) % 3 + 3) % 3;
  if (mi) {
    c.save();
    if (mi === 1) c.rotate(0.22);
    else if (mi === 2) c.rotate(-0.12);
  }
  switch (id) {
    case 'zwaard':
      // Brede kling + gevest — niet een dunne speerschacht
      c.strokeStyle = '#9aa8bc'; c.lineWidth = 7; c.beginPath(); c.moveTo(8, 0); c.lineTo(48, 0); c.stroke();
      c.strokeStyle = '#e8f0ff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(12, -1.2); c.lineTo(44, -1.2); c.stroke();
      c.fillStyle = '#c9d6e8';
      c.beginPath(); c.moveTo(46, -5); c.lineTo(56, 0); c.lineTo(46, 5); c.closePath(); c.fill();
      c.strokeStyle = '#a67c2e'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, -8); c.lineTo(4, 8); c.stroke();
      c.strokeStyle = '#6a5030'; c.lineWidth = 4; c.beginPath(); c.moveTo(-2, 0); c.lineTo(8, 0); c.stroke();
      break;
    case 'master_sword':
      c.save();
      c.shadowColor = '#6fd7ff'; c.shadowBlur = 16;
      c.strokeStyle = '#3a9fd4'; c.lineWidth = 6; c.beginPath(); c.moveTo(6, 0); c.lineTo(64, 0); c.stroke();
      c.strokeStyle = '#e8f8ff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(12, -1.5); c.lineTo(60, -1.5); c.stroke();
      c.strokeStyle = 'rgba(180,235,255,.55)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(12, 1.5); c.lineTo(60, 1.5); c.stroke();
      c.restore();
      c.fillStyle = '#c9e8ff';
      c.beginPath(); c.moveTo(62, -5); c.lineTo(74, 0); c.lineTo(62, 5); c.closePath(); c.fill();
      c.strokeStyle = '#d4af37'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, -9); c.lineTo(4, 9); c.stroke();
      c.fillStyle = '#6fd7ff'; c.beginPath(); c.arc(4, 0, 3.2, 0, TAU); c.fill();
      break;
    case 'kunai':
      c.strokeStyle = '#5a6474'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(26, 0); c.stroke();
      c.fillStyle = '#c9d6e8';
      c.beginPath(); c.moveTo(24, -8); c.lineTo(44, 0); c.lineTo(24, 8); c.closePath(); c.fill();
      c.strokeStyle = '#a67c2e'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(8, -6); c.lineTo(8, 6); c.stroke();
      c.beginPath(); c.arc(2, 0, 3.4, 0, TAU); c.stroke();
      break;
    case 'shuriken': {
      const rot = spin * 18;
      c.save(); c.translate(28, 0); c.rotate(rot);
      c.fillStyle = '#b8c4d4';
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(4, -4); c.lineTo(16, 0); c.lineTo(4, 4); c.closePath(); c.fill();
      }
      c.fillStyle = '#5a6784'; c.beginPath(); c.arc(0, 0, 3.5, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'tanto':
      // Kort mes: korte greep + dikke tip-kling
      c.strokeStyle = '#6a7484'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(24, 0); c.stroke();
      c.fillStyle = '#dce4f0';
      c.beginPath(); c.moveTo(22, -6); c.lineTo(40, 0); c.lineTo(22, 6); c.closePath(); c.fill();
      c.strokeStyle = '#8a6030'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(4, -6); c.lineTo(4, 6); c.stroke();
      c.fillStyle = '#5a4030'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
      break;
    case 'sai':
      // Driepunt: middenstaaf + twee prongs
      c.strokeStyle = '#a8b4c4'; c.lineWidth = 3.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(38, 0); c.stroke();
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(10, 0); c.lineTo(24, -12); c.stroke();
      c.beginPath(); c.moveTo(10, 0); c.lineTo(24, 12); c.stroke();
      c.fillStyle = '#c9d6e8';
      c.beginPath(); c.moveTo(38, -4); c.lineTo(50, 0); c.lineTo(38, 4); c.closePath(); c.fill();
      c.strokeStyle = '#6a7484'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -5); c.lineTo(0, 5); c.stroke();
      break;
    case 'knuppel':
      c.strokeStyle = '#6a4020'; c.lineWidth = 5; c.beginPath(); c.moveTo(2, 0); c.lineTo(18, 0); c.stroke();
      c.strokeStyle = '#8a5a30'; c.lineWidth = 14; c.beginPath(); c.moveTo(18, 0); c.lineTo(40, 0); c.stroke();
      c.strokeStyle = '#a07040'; c.lineWidth = 9; c.beginPath(); c.moveTo(22, 0); c.lineTo(36, 0); c.stroke();
      break;
    case 'waaier': {
      c.save();
      const open = 0.55 + Math.sin(spin * 6) * 0.12;
      for (let i = -3; i <= 3; i++) {
        const a = i * 0.22 * open;
        c.strokeStyle = i === 0 ? '#e8c98a' : '#c97a20';
        c.lineWidth = i === 0 ? 3 : 2;
        c.beginPath(); c.moveTo(4, 0); c.lineTo(4 + Math.cos(a) * 38, Math.sin(a) * 38); c.stroke();
      }
      c.fillStyle = 'rgba(255,215,94,.25)';
      c.beginPath(); c.moveTo(4, 0);
      c.arc(4, 0, 36, -0.7 * open, 0.7 * open);
      c.closePath(); c.fill();
      c.restore();
      break;
    }
    case 'speer':
      // Enige echte speer: lange schacht + één punt
      c.strokeStyle = '#a3763f'; c.lineWidth = 4; c.beginPath(); c.moveTo(-14, 0); c.lineTo(58, 0); c.stroke();
      c.fillStyle = '#c9d6e8'; c.beginPath(); c.moveTo(58, -6); c.lineTo(74, 0); c.lineTo(58, 6); c.closePath(); c.fill();
      c.strokeStyle = '#6a4820'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(8, -5); c.lineTo(8, 5); c.stroke();
      break;
    case 'drietand':
      // Drietand: schacht + 3 duidelijke punten
      c.strokeStyle = '#6a7488'; c.lineWidth = 4.5;
      c.beginPath(); c.moveTo(-8, 0); c.lineTo(44, 0); c.stroke();
      c.strokeStyle = '#c9d6e8'; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(44, 0); c.lineTo(66, 0); c.stroke();
      c.beginPath(); c.moveTo(44, -2); c.lineTo(62, -14); c.stroke();
      c.beginPath(); c.moveTo(44, 2); c.lineTo(62, 14); c.stroke();
      c.fillStyle = '#e8eef8';
      c.beginPath(); c.moveTo(66, -3); c.lineTo(74, 0); c.lineTo(66, 3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(62, -14); c.lineTo(68, -16); c.lineTo(62, -10); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(62, 14); c.lineTo(68, 16); c.lineTo(62, 10); c.closePath(); c.fill();
      break;
    case 'bostaf':
      // Bo-staf: lange staf zonder speerpunt
      c.strokeStyle = '#8a6030'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(-22, 0); c.lineTo(56, 0); c.stroke();
      c.strokeStyle = '#c9a66b'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-18, -5); c.lineTo(-18, 5); c.stroke();
      c.beginPath(); c.moveTo(52, -5); c.lineTo(52, 5); c.stroke();
      c.fillStyle = '#6a4820';
      c.beginPath(); c.arc(-22, 0, 3.5, 0, TAU); c.fill();
      c.beginPath(); c.arc(56, 0, 3.5, 0, TAU); c.fill();
      break;
    case 'tonfa':
      // Tonfa: zijhandvat loodrecht op stok
      c.strokeStyle = '#4a3020'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.lineTo(44, 0); c.stroke();
      c.lineWidth = 6; c.beginPath(); c.moveTo(14, 0); c.lineTo(14, 18); c.stroke();
      c.fillStyle = '#6a4830';
      c.beginPath(); c.arc(14, 18, 4, 0, TAU); c.fill();
      break;
    case 'nunchaku': {
      c.strokeStyle = '#4a3520'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(22, 0); c.stroke();
      const a = 0.7 + Math.sin(spin * 14) * 1.1;
      const [jx, jy] = seg(22, 0, 0, 7);
      c.strokeStyle = '#889'; c.lineWidth = 1.5;
      const [ex, ey] = seg(jx, jy, a, 9);
      c.beginPath(); c.moveTo(jx, jy); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = '#4a3520'; c.lineWidth = 5;
      const [fx, fy] = seg(ex, ey, a, 22);
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(fx, fy); c.stroke();
      break;
    }
    case 'kama': {
      // Sikkel: korte steel + haak-kling (niet speer)
      c.save();
      c.rotate(-0.55);
      c.strokeStyle = '#5a4030';
      c.lineWidth = 4.5;
      c.beginPath(); c.moveTo(0, 4); c.lineTo(0, -28); c.stroke();
      c.fillStyle = '#d0d8e8';
      c.beginPath();
      c.moveTo(0, -26);
      c.quadraticCurveTo(26, -30, 28, -6);
      c.quadraticCurveTo(18, -22, 2, -22);
      c.closePath();
      c.fill();
      c.strokeStyle = '#8a98b0';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(2, -24);
      c.quadraticCurveTo(20, -28, 24, -10);
      c.stroke();
      c.restore();
      break;
    }
    case 'boemerang': {
      // Klassieke L/V-boemerang (niet speer-achtig); spin roteert in hand & als projectiel.
      c.save();
      c.translate(24, 0);
      c.rotate((spin || 0) * 12);
      c.strokeStyle = '#a86a30';
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-20, -18);
      c.quadraticCurveTo(-6, -20, 0, 0);
      c.quadraticCurveTo(6, 20, 20, 18);
      c.stroke();
      c.strokeStyle = '#e0a868';
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(-16, -14);
      c.quadraticCurveTo(-4, -15, 0, 0);
      c.quadraticCurveTo(4, 15, 16, 14);
      c.stroke();
      c.fillStyle = '#6a4020';
      c.beginPath(); c.arc(0, 0, 3.2, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'zeis': {
      // Schaduwzeis: verticale paal + grote paarse sikkel (niet speer)
      c.save();
      c.rotate(-0.95);
      c.strokeStyle = '#2a2038';
      c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, 10); c.lineTo(0, -44); c.stroke();
      c.strokeStyle = '#5a4078';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(-3, 6); c.lineTo(-3, -40); c.stroke();
      c.fillStyle = '#a060e0';
      c.beginPath();
      c.moveTo(1, -42);
      c.quadraticCurveTo(42, -52, 48, -14);
      c.quadraticCurveTo(34, -38, 4, -36);
      c.closePath();
      c.fill();
      c.strokeStyle = '#e8d0ff';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(4, -40);
      c.quadraticCurveTo(36, -48, 44, -18);
      c.stroke();
      c.fillStyle = '#6a40a0';
      c.beginPath(); c.arc(0, -42, 3.5, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'hamer':
      // Moker: korte steel + dikke kop
      c.strokeStyle = '#6a4828'; c.lineWidth = 5; c.beginPath(); c.moveTo(2, 0); c.lineTo(34, 0); c.stroke();
      c.fillStyle = '#5a6478';
      c.fillRect(30, -16, 22, 32);
      c.fillStyle = '#8f9aab';
      c.fillRect(30, -16, 22, 8);
      c.fillStyle = '#3a4458';
      c.fillRect(34, -10, 14, 20);
      break;
    case 'ketting':
      // Kettingzwaard: schakels + bladpunt
      c.strokeStyle = '#8899aa'; c.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.arc(6 + i * 9, Math.sin(i * 0.9 + spin * 8) * 3, 4.2, 0, TAU);
        c.stroke();
      }
      c.fillStyle = '#c9d6e8';
      c.beginPath(); c.moveTo(56, -7); c.lineTo(72, 0); c.lineTo(56, 7); c.closePath(); c.fill();
      break;
    case 'laser':
      // Energy-kling: gloeiende blade + greep
      c.save();
      c.shadowColor = '#4ff3ff'; c.shadowBlur = 12;
      c.strokeStyle = '#4ff3ff'; c.lineWidth = 7; c.beginPath(); c.moveTo(8, 0); c.lineTo(52, 0); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(10, 0); c.lineTo(50, 0); c.stroke();
      c.restore();
      c.fillStyle = '#39404f';
      c.fillRect(-6, -6, 14, 12);
      c.strokeStyle = '#7cf5ff'; c.lineWidth = 2; c.strokeRect(-6, -6, 14, 12);
      break;
    case 'fuuma': {
      const rot = spin * 14;
      c.save(); c.translate(30, 0); c.rotate(rot);
      c.fillStyle = '#9aa8bc';
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(6, -7); c.lineTo(22, 0); c.lineTo(6, 7); c.closePath(); c.fill();
      }
      c.fillStyle = '#3a4560'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
      c.restore();
      break;
    }
    case 'kristal':
      c.save(); c.shadowColor = '#7cf5ff'; c.shadowBlur = 10;
      c.fillStyle = 'rgba(124,245,255,.55)';
      c.beginPath(); c.moveTo(8, 0); c.lineTo(28, -10); c.lineTo(52, 0); c.lineTo(28, 10); c.closePath(); c.fill();
      c.strokeStyle = '#e8ffff'; c.lineWidth = 2; c.stroke();
      c.restore();
      c.strokeStyle = '#5a6784'; c.lineWidth = 5; c.beginPath(); c.moveTo(-2, 0); c.lineTo(8, 0); c.stroke();
      break;
    case 'donder':
      // Bliksem-bijl: steel + bliksemvormige bijlkop
      c.strokeStyle = '#6a4828'; c.lineWidth = 6; c.beginPath(); c.moveTo(2, 0); c.lineTo(30, 0); c.stroke();
      c.fillStyle = '#ffd75e';
      c.beginPath();
      c.moveTo(28, -16); c.lineTo(54, -5); c.lineTo(38, 0); c.lineTo(56, 6); c.lineTo(28, 16);
      c.lineTo(34, 2); c.lineTo(24, 0); c.closePath();
      c.fill();
      c.strokeStyle = '#fff0a0'; c.lineWidth = 1.5; c.stroke();
      break;
    case 'vlamzweep': {
      c.strokeStyle = '#5a3020'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(14, 0); c.stroke();
      c.save(); c.shadowColor = '#ff8c42'; c.shadowBlur = 10;
      c.strokeStyle = '#ff6b3f'; c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(14, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(14 + i * 8, Math.sin(spin * 10 + i) * 6);
      }
      c.stroke();
      c.strokeStyle = '#ffd75e'; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(14, 0);
      for (let i = 1; i <= 6; i++) {
        c.lineTo(14 + i * 8, Math.sin(spin * 10 + i + 0.4) * 3);
      }
      c.stroke();
      c.restore();
      break;
    }
    case 'void':
      // Voidklaauw: klauw-vorm, geen schacht
      c.save(); c.shadowColor = '#ff6b9d'; c.shadowBlur = 14;
      c.fillStyle = 'rgba(90,16,64,.85)';
      c.beginPath();
      c.moveTo(4, 0); c.lineTo(22, -16); c.lineTo(36, -6); c.lineTo(48, -14);
      c.lineTo(40, 0); c.lineTo(48, 14); c.lineTo(36, 6); c.lineTo(22, 16);
      c.closePath(); c.fill();
      c.strokeStyle = '#ff6b9d'; c.lineWidth = 2.5; c.stroke();
      c.restore();
      break;
    case 'sterkling':
      // Sterkling: ster-gevest + gloedkling
      c.save(); c.shadowColor = '#ffd75e'; c.shadowBlur = 12;
      c.strokeStyle = '#ffd75e'; c.lineWidth = 6; c.beginPath(); c.moveTo(10, 0); c.lineTo(50, 0); c.stroke();
      c.strokeStyle = '#fff8d0'; c.lineWidth = 2; c.beginPath(); c.moveTo(14, -1.2); c.lineTo(46, -1.2); c.stroke();
      c.restore();
      c.fillStyle = '#c97a20';
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * TAU / 5;
        const r = i % 2 === 0 ? 8 : 3.5;
        const x = 8 + Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath(); c.fill();
      c.strokeStyle = '#8a6030'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-4, -7); c.lineTo(-4, 7); c.stroke();
      break;
    case 'guvve':
      // Guvve-stok: steel + eend-kop
      c.strokeStyle = '#43b25b'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(32, 0); c.stroke();
      c.fillStyle = '#ffe259'; c.beginPath(); c.ellipse(46, 0, 16, 12, 0, 0, TAU); c.fill();
      c.fillStyle = '#222'; c.beginPath(); c.arc(50, -3, 2.5, 0, TAU); c.fill();
      c.strokeStyle = '#ff8c42'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(58, 2); c.lineTo(70, 6); c.stroke();
      break;
    case 'nachtkaars':
      c.strokeStyle = '#c47aff'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(28, 0); c.stroke();
      c.fillStyle = '#2a1840'; c.fillRect(26, -8, 14, 16);
      c.fillStyle = '#ffd75e'; c.beginPath(); c.moveTo(33, -8); c.lineTo(36, -20); c.lineTo(39, -8); c.fill();
      break;
    case 'droomprikker':
      c.strokeStyle = '#8a70c0'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(44, 0); c.stroke();
      c.fillStyle = '#e8d0ff'; c.beginPath(); c.moveTo(42, -5); c.lineTo(58, 0); c.lineTo(42, 5); c.fill();
      break;
    case 'spooklepel':
    case 'lavalepel':
    case 'apocalypslepel': {
      const col = id === 'apocalypslepel' ? '#ff6a3d' : (id === 'lavalepel' ? '#ff8c42' : '#c47aff');
      c.strokeStyle = '#5a4030'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(30, 0); c.stroke();
      c.fillStyle = col;
      c.beginPath(); c.ellipse(44, 0, 16, 10, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(44, -2, 8, 4, 0, 0, TAU); c.fill();
      break;
    }
    case 'nachtmerriesok':
      c.fillStyle = '#6a40a0'; c.beginPath(); c.moveTo(4, -6); c.lineTo(28, -8); c.lineTo(36, 2); c.lineTo(28, 10); c.lineTo(4, 8); c.fill();
      c.fillStyle = '#ff6b9d'; c.fillRect(28, -4, 14, 10);
      break;
    case 'echotrompet':
    case 'helgitaar': {
      c.strokeStyle = id === 'helgitaar' ? '#ff6a3d' : '#c47aff';
      c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(26, 0); c.stroke();
      c.fillStyle = id === 'helgitaar' ? '#8a2020' : '#2a1840';
      c.beginPath(); c.moveTo(24, -12); c.lineTo(52, -6); c.lineTo(52, 6); c.lineTo(24, 12); c.fill();
      if (id === 'helgitaar') {
        c.strokeStyle = '#ffd75e'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(28, -4); c.lineTo(48, -2); c.moveTo(28, 4); c.lineTo(48, 2); c.stroke();
      }
      break;
    }
    case 'schaduwbanaan':
    case 'brimstonebanaan': {
      const col = id === 'brimstonebanaan' ? '#ff6a3d' : '#a060e0';
      c.strokeStyle = col; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(8, 10); c.quadraticCurveTo(28, -18, 50, 4); c.stroke();
      c.strokeStyle = '#ffe259'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(12, 6); c.quadraticCurveTo(28, -10, 46, 2); c.stroke();
      break;
    }
    case 'voidvork':
    case 'hellevork': {
      const col = id === 'hellevork' ? '#ff6a3d' : '#ff6b9d';
      c.strokeStyle = '#4a3040'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(34, 0); c.stroke();
      c.strokeStyle = col; c.lineWidth = 3;
      c.beginPath(); c.moveTo(34, 0); c.lineTo(56, 0); c.moveTo(34, -2); c.lineTo(52, -12); c.moveTo(34, 2); c.lineTo(52, 12); c.stroke();
      break;
    }
    case 'angstaccordeon':
    case 'asaccordeon': {
      const col = id === 'asaccordeon' ? '#ff6a3d' : '#c47aff';
      c.fillStyle = col;
      for (let i = 0; i < 5; i++) c.fillRect(8 + i * 8, -12 + (i % 2) * 3, 6, 24 - (i % 2) * 4);
      c.strokeStyle = '#2a1840'; c.lineWidth = 3; c.strokeRect(6, -14, 44, 28);
      break;
    }
    case 'slaapkussen':
      c.fillStyle = '#e8d0ff'; c.beginPath(); c.ellipse(28, 0, 26, 16, 0, 0, TAU); c.fill();
      c.strokeStyle = '#c47aff'; c.lineWidth = 2; c.stroke();
      break;
    case 'spooktoaster':
      c.fillStyle = '#6a5080'; c.fillRect(8, -14, 36, 28);
      c.fillStyle = '#ff6b9d'; c.fillRect(14, -8, 10, 16); c.fillRect(28, -8, 10, 16);
      c.fillStyle = '#ffd75e'; c.fillRect(16, -18, 6, 8); c.fillRect(30, -20, 6, 10);
      break;
    case 'droomspiegel':
      c.strokeStyle = '#c47aff'; c.lineWidth = 4; c.beginPath(); c.moveTo(4, 0); c.lineTo(18, 0); c.stroke();
      c.fillStyle = 'rgba(124,245,255,.45)'; c.beginPath(); c.moveTo(18, -14); c.lineTo(52, -10); c.lineTo(52, 10); c.lineTo(18, 14); c.fill();
      c.strokeStyle = '#e8ffff'; c.lineWidth = 2; c.stroke();
      break;
    case 'nachtuilvleugel':
      c.fillStyle = '#2a1840';
      c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(28, -22, 54, -4); c.quadraticCurveTo(28, -6, 4, 0); c.fill();
      c.fillStyle = '#c47aff';
      c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(26, 18, 50, 6); c.quadraticCurveTo(26, 4, 4, 0); c.fill();
      break;
    case 'waanballon':
      c.fillStyle = '#ff6b9d'; c.beginPath(); c.arc(34, -4, 18, 0, TAU); c.fill();
      c.strokeStyle = '#c47aff'; c.lineWidth = 2; c.beginPath(); c.moveTo(34, 14); c.lineTo(34, 28); c.stroke();
      break;
    case 'schriktandwiel':
      c.save(); c.translate(30, 0); c.rotate(spin * 8);
      c.fillStyle = '#6a40a0';
      for (let i = 0; i < 8; i++) {
        c.rotate(Math.PI / 4);
        c.fillRect(10, -3, 12, 6);
      }
      c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill();
      c.fillStyle = '#ff6b9d'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
      c.restore();
      break;
    case 'duiveltrommel':
      c.fillStyle = '#8a2020'; c.beginPath(); c.ellipse(30, 0, 22, 16, 0, 0, TAU); c.fill();
      c.strokeStyle = '#ffd75e'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#5a1010'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(12, 0); c.stroke();
      break;
    case 'zwavelzeep':
      c.fillStyle = '#ffd75e';
      c.beginPath();
      c.moveTo(14, -10); c.lineTo(42, -10); c.lineTo(46, -4); c.lineTo(46, 8); c.lineTo(42, 10); c.lineTo(14, 10); c.lineTo(10, 8); c.lineTo(10, -4);
      c.closePath(); c.fill();
      c.fillStyle = '#ff6a3d'; c.font = '900 9px sans-serif'; c.textAlign = 'center'; c.fillText('S', 28, 3);
      break;
    case 'infernoijsje':
      c.fillStyle = '#7cf5ff'; c.beginPath(); c.moveTo(16, -4); c.lineTo(40, -4); c.lineTo(28, 22); c.fill();
      c.fillStyle = '#ff6a3d'; c.beginPath(); c.arc(28, -10, 14, 0, TAU); c.fill();
      break;
    case 'helhamsterwiel':
      c.save(); c.translate(28, 0); c.rotate(spin * 10);
      c.strokeStyle = '#ff6a3d'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.moveTo(0, -12); c.lineTo(0, 12); c.stroke();
      c.restore();
      break;
    case 'demondoekje':
      c.fillStyle = '#5a1010'; c.fillRect(6, -12, 40, 24);
      c.strokeStyle = '#ff6a3d'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(10 + i * 10, -10); c.lineTo(10 + i * 10, 10); c.stroke(); }
      break;
    case 'chiliketting':
      c.strokeStyle = '#ff6a3d'; c.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        c.beginPath(); c.arc(8 + i * 9, Math.sin(i + spin * 6) * 4, 4, 0, TAU); c.stroke();
      }
      c.fillStyle = '#ffe259'; c.beginPath(); c.moveTo(58, -6); c.lineTo(70, 0); c.lineTo(58, 6); c.fill();
      break;
    case 'pyroeend':
      c.strokeStyle = '#ff6a3d'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(30, 0); c.stroke();
      c.fillStyle = '#ffd75e'; c.beginPath(); c.ellipse(46, 0, 16, 12, 0, 0, TAU); c.fill();
      c.fillStyle = '#222'; c.beginPath(); c.arc(50, -3, 2.5, 0, TAU); c.fill();
      c.save(); c.shadowColor = '#ff6a3d'; c.shadowBlur = 10;
      c.strokeStyle = '#ff8c42'; c.lineWidth = 3; c.beginPath(); c.moveTo(58, 2); c.lineTo(72, 8); c.stroke();
      c.restore();
      break;
    default:
      // Fallback: korte stok (nooit speer-punt)
      c.strokeStyle = '#7a5c34'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(28, 0); c.stroke();
      break;
  }
  if (mi) c.restore();
}

function fxLite() {
  return !!(save.liteFx || Perf.tier >= 2 || motionReduced());
}

function ensureParticleRoom(game, slots) {
  if (!game || slots <= 0) return true;
  const cap = fxCaps();
  let room = cap.particles - game.particles.length;
  if (room >= slots) return true;
  let need = slots - room;
  for (let i = 0; i < game.particles.length && need > 0; ) {
    const p = game.particles[i];
    if (p.kind === 'ring') { i++; continue; }
    game.particles.splice(i, 1);
    need--;
    room++;
  }
  return room >= slots;
}

function spawnFxRing(game, x, y, color, baseR) {
  if (!game || motionReduced()) return;
  if (!perfFxBudgetAllow(game, 1) || perfFxRoom(game, 'particle') <= 0) return;
  if (!ensureParticleRoom(game, 1)) return;
  const lite = fxLite();
  const life = lite ? 0.22 : 0.34;
  const size = (baseR || 12) * (lite ? 0.62 : 1);
  game.particles.push({
    x, y, vx: 0, vy: 0, life, maxLife: life,
    color: color || '#7cf5ff',
    size,
    kind: 'ring',
    grav: 0,
  });
}

/**
 * Pet / egg-pet / summon appear sparkles — rings + sparks + twinkle stars.
 * opts: { color2, big }
 */
function spawnCompanionSparkles(game, x, y, color, opts) {
  if (!game || typeof game.burst !== 'function') return;
  if (motionReduced()) {
    game.burst(x, y, color || '#7cf5ff', 4, { kind: 'spark', size: 2 });
    return;
  }
  opts = opts || {};
  const lite = fxLite();
  const col = color || '#7cf5ff';
  const col2 = opts.color2 || '#ffffff';
  const big = !!opts.big;
  const n = lite ? (big ? 8 : 5) : (big ? 18 : 11);
  game.burst(x, y, col, n, { kind: 'spark', size: big ? 2.6 : 2.1 });
  game.burst(x, y, col2, Math.max(2, Math.ceil(n * 0.4)), { kind: 'spark', size: big ? 2.0 : 1.55 });
  spawnFxRing(game, x, y, col, lite ? 7 : (big ? 16 : 11));
  if (!lite && big) spawnFxRing(game, x, y - 10, col2, 9);
  if (lite || !ensureParticleRoom(game, 3)) return;
  if (!perfFxBudgetAllow(game, 2) || perfFxRoom(game, 'particle') <= 0) return;
  const stars = big ? 7 : 4;
  for (let i = 0; i < stars; i++) {
    if (perfFxRoom(game, 'particle') <= 0) break;
    const a = (i / stars) * TAU + Math.random() * 0.5;
    const sp = 35 + Math.random() * (big ? 70 : 45);
    game.particles.push({
      x: x + Math.cos(a) * 6,
      y: y + Math.sin(a) * 4,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.7 - 55,
      life: 0.32 + Math.random() * 0.22,
      maxLife: 0.55,
      color: i % 2 ? col2 : col,
      size: (big ? 3.2 : 2.6) + Math.random() * 2.2,
      kind: 'star',
      grav: 90,
    });
  }
}

/** Technique impact burst — Lite FX capped; scale 'small' for projectile fade-out. */
function spawnTechniqueImpactFx(game, x, y, kind, scale) {
  if (!game || motionReduced()) return;
  const sk = skillById(kind);
  const col = sk.color || '#7cf5ff';
  const lite = fxLite();
  const small = scale === 'small';
  const n = lite ? (small ? 4 : 6) : (small ? 8 : 14);
  // Ring first: Lite FX per-frame budget is tiny; sparks must not eat the hit confirm.
  spawnFxRing(game, x, y, col, lite ? 6 : (small ? 8 : 14));
  game.burst(x, y, col, n, { kind: 'spark', size: small ? 2.2 : 2.8 });
  if (!lite && !small && (sk.behavior === 'pull' || sk.behavior === 'meteor')) {
    game.burst(x, y, '#ff6b9d', 6);
  }
  if (!lite && !small && (kind === 'spiral_orb' || sk.behavior === 'orb')) {
    spawnFxRing(game, x, y, '#ffffff', 10);
  }
  if (!lite && !small && (kind === 'lightning_pierce' || sk.behavior === 'dash')) {
    game.burst(x, y, '#e8f7ff', 8, { kind: 'spark', size: 1.8 });
  }
  if (!lite && !small && (kind === 'void_gaze' || sk.behavior === 'slash')) {
    game.burst(x, y, '#e8d0ff', 10, { kind: 'spark', size: 2.4 });
    spawnFxRing(game, x, y, '#ffffff', 12);
  }
}

/**
 * Hand-charge aura while winding up a technique (Spiral Orb spiral / Lightning Pierce crackle).
 * g = charge progress 0..1, animT = fighter anim clock.
 */
function drawTechniqueChargeAura(c, hx, hy, g, animT, kind) {
  const sk = skillById(kind);
  const behavior = sk.behavior || 'orb';
  const col = sk.color || '#7cf5ff';
  const calm = motionReduced();
  const lite = fxLite() || calm;
  const ox = hx + 14;
  const oy = hy;
  const spin = animT * (8 + g * 20);

  drawTechniqueOrb(c, ox, oy, 8 + g * 16, spin, kind, 0.55 + g * 0.45);

  c.save();
  if (behavior === 'dash' || kind === 'lightning_pierce') {
    // Lightning Pierce — crackling sheath + jagged bolts from the palm
    const halo = c.createRadialGradient(ox, oy, 2, ox, oy, 22 + g * 28);
    halo.addColorStop(0, `rgba(232,247,255,${0.35 + g * 0.4})`);
    halo.addColorStop(0.45, `rgba(168,224,255,${0.22 + g * 0.28})`);
    halo.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(ox, oy, 22 + g * 28, 0, TAU);
    c.fill();

    c.lineCap = 'round';
    c.lineJoin = 'round';
    const bolts = lite ? 4 : 8;
    for (let i = 0; i < bolts; i++) {
      const a = animT * (12 + g * 10) + i * (TAU / bolts);
      const len = 14 + g * 26 + (calm ? 0 : Math.sin(animT * 28 + i) * 4);
      c.strokeStyle = i % 2
        ? `rgba(255,255,255,${0.45 + g * 0.4})`
        : `rgba(168,224,255,${0.35 + g * 0.45})`;
      c.lineWidth = i % 2 ? 1.4 : 2.2;
      c.beginPath();
      c.moveTo(ox + Math.cos(a) * 4, oy + Math.sin(a) * 3);
      const mx = ox + Math.cos(a + 0.35) * len * 0.55;
      const my = oy + Math.sin(a + 0.35) * len * 0.45 + (calm ? 0 : Math.sin(animT * 40 + i * 2) * 3);
      c.lineTo(mx, my);
      c.lineTo(ox + Math.cos(a + 0.15) * len, oy + Math.sin(a) * len * 0.55);
      c.stroke();
    }
    if (!lite) {
      c.strokeStyle = `rgba(200,240,255,${0.25 + g * 0.35})`;
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const a = animT * 16 + i * 2.1;
        c.beginPath();
        c.moveTo(hx + 4, hy - 2);
        c.quadraticCurveTo(
          hx + 8 + Math.cos(a) * 10,
          hy - 8 + Math.sin(a * 1.3) * 6,
          ox + Math.cos(a) * (10 + g * 8),
          oy + Math.sin(a) * (6 + g * 6)
        );
        c.stroke();
      }
    }
  } else if (behavior === 'slash' || kind === 'void_gaze') {
    // Void Gaze — horizontale bliksem-schede beide kanten (charge preview)
    const halo = c.createRadialGradient(ox, oy, 2, ox, oy, 24 + g * 30);
    halo.addColorStop(0, `rgba(255,255,255,${0.4 + g * 0.4})`);
    halo.addColorStop(0.4, `rgba(196,122,255,${0.28 + g * 0.35})`);
    halo.addColorStop(1, 'rgba(120,40,180,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(ox, oy, 24 + g * 30, 0, TAU);
    c.fill();

    c.lineCap = 'round';
    c.lineJoin = 'round';
    const reach = 18 + g * 36;
    const bolts = lite ? 2 : 4;
    for (const dir of [-1, 1]) {
      for (let i = 0; i < bolts; i++) {
        const yOff = (i - (bolts - 1) / 2) * (4 + g * 3);
        const jagged = calm ? 0 : Math.sin(animT * 30 + i * 2.1 + dir) * (3 + g * 2);
        c.strokeStyle = i % 2
          ? `rgba(255,255,255,${0.45 + g * 0.4})`
          : `rgba(196,122,255,${0.4 + g * 0.45})`;
        c.lineWidth = i % 2 ? 1.3 : 2.4;
        c.beginPath();
        c.moveTo(ox, oy + yOff * 0.3);
        c.lineTo(ox + dir * reach * 0.4, oy + yOff + jagged);
        c.lineTo(ox + dir * reach * 0.7, oy + yOff * 0.5 - jagged * 0.6);
        c.lineTo(ox + dir * reach, oy + yOff * 0.2);
        c.stroke();
      }
    }
  } else if (behavior === 'pull' || behavior === 'meteor') {
    c.strokeStyle = `rgba(196,122,255,${0.4 + g * 0.45})`;
    c.lineWidth = 2;
    for (let ring = 0; ring < (lite ? 2 : 3); ring++) {
      c.beginPath();
      c.arc(ox, oy, 10 + g * 16 + ring * 4, animT * (6 + ring), animT * (6 + ring) + Math.PI * 1.1);
      c.stroke();
    }
    c.fillStyle = `rgba(255,100,140,${0.35 + g * 0.4})`;
    for (let i = 0; i < 3; i++) {
      const a = animT * 8 + i * (TAU / 3);
      c.beginPath();
      c.arc(ox + Math.cos(a) * (8 + g * 12), oy + Math.sin(a) * (8 + g * 10), 2.5 + g * 2, 0, TAU);
      c.fill();
    }
  } else {
    // Spiral Orb — cyan halo + orbiting motes + spiral rings
    const halo = c.createRadialGradient(ox, oy, 2, ox, oy, 20 + g * 26);
    halo.addColorStop(0, `rgba(255,255,255,${0.4 + g * 0.35})`);
    halo.addColorStop(0.4, `rgba(124,245,255,${0.28 + g * 0.32})`);
    halo.addColorStop(1, 'rgba(80,180,220,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(ox, oy, 20 + g * 26, 0, TAU);
    c.fill();

    c.strokeStyle = `rgba(124,245,255,${0.35 + g * 0.4})`;
    c.lineWidth = lite ? 1.6 : 2.2;
    c.lineCap = 'round';
    const spirals = lite ? 2 : 4;
    for (let i = 0; i < spirals; i++) {
      const a0 = spin * (0.35 + i * 0.12) + i * 0.9;
      c.beginPath();
      c.arc(ox, oy, 9 + g * 10 + i * 3.5, a0, a0 + Math.PI * (1.1 + g * 0.35));
      c.stroke();
    }

    c.fillStyle = `rgba(124,245,255,${0.3 + g * 0.4})`;
    const motes = lite ? 4 : 7;
    for (let i = 0; i < motes; i++) {
      const a = animT * (10 + g * 6) + i * (TAU / motes);
      const rr = 10 + g * 14 + (i % 3) * 2;
      const mx = ox + Math.cos(a) * rr;
      const my = oy + Math.sin(a) * (6 + g * 8) * (0.85 + (i % 2) * 0.2);
      c.beginPath();
      c.arc(mx, my, 1.6 + g * 2.2, 0, TAU);
      c.fill();
      if (!lite) {
        c.fillStyle = `rgba(255,255,255,${0.2 + g * 0.25})`;
        c.beginPath();
        c.arc(mx - Math.cos(a) * 3, my - Math.sin(a) * 2, 1 + g, 0, TAU);
        c.fill();
        c.fillStyle = `rgba(124,245,255,${0.3 + g * 0.4})`;
      }
    }
  }
  c.restore();
}

function drawTechniqueOrb(c, x, y, r, spin, kind, alpha) {
  const sk = skillById(kind);
  const behavior = sk.behavior || 'orb';
  const col = sk.color || '#7cf5ff';
  const lite = fxLite();
  const calm = motionReduced();
  c.save();
  c.translate(x, y);
  c.globalAlpha = alpha == null ? 1 : alpha;
  if (behavior === 'dash') {
    c.shadowColor = col; c.shadowBlur = lite ? 8 : 20;
    const core = c.createRadialGradient(0, 0, 0, 0, 0, r);
    core.addColorStop(0, 'rgba(255,255,255,.95)');
    core.addColorStop(0.35, col.length === 7 ? col + 'cc' : 'rgba(200,240,255,.8)');
    core.addColorStop(1, col.length === 7 ? col + '22' : 'rgba(120,180,255,.15)');
    c.fillStyle = core;
    c.beginPath(); c.arc(0, 0, r * 0.95, 0, TAU); c.fill();
    c.strokeStyle = '#e8f7ff'; c.lineWidth = 2;
    c.lineCap = 'round';
    const bolts = lite ? 4 : 9;
    for (let i = 0; i < bolts; i++) {
      const a = spin + i * (TAU / bolts);
      const jagged = calm ? 0 : Math.sin(spin * 6 + i * 2.3) * 0.18;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15);
      c.lineTo(
        Math.cos(a + 0.25 + jagged) * r * 0.75,
        Math.sin(a + 0.25 + jagged) * r * 0.75
      );
      c.lineTo(Math.cos(a + 0.45) * r * 1.35, Math.sin(a + 0.45) * r * 1.35);
      c.stroke();
    }
    if (!lite) {
      c.strokeStyle = 'rgba(255,255,255,.55)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(0, 0, r * 1.18, spin * 1.4, spin * 1.4 + Math.PI * 1.2);
      c.stroke();
    }
  } else if (behavior === 'beam' || behavior === 'disc') {
    c.shadowColor = col; c.shadowBlur = lite ? 8 : 16;
    c.fillStyle = col;
    c.globalAlpha = (alpha == null ? 1 : alpha) * 0.75;
    c.beginPath(); c.ellipse(0, 0, r * 1.35, r * (behavior === 'disc' ? 0.55 : 0.75), spin * 0.2, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, r * 1.2, r * (behavior === 'disc' ? 0.45 : 0.65), spin * 0.2, 0, TAU); c.stroke();
  } else if (behavior === 'slash') {
    // Preview-icoon: korte tweerichtings-bliksem
    c.shadowColor = col; c.shadowBlur = lite ? 8 : 20;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const reach = r * 1.55;
    for (const dir of [-1, 1]) {
      c.strokeStyle = 'rgba(255,255,255,.9)';
      c.lineWidth = Math.max(2, r * 0.22);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(dir * reach * 0.45, Math.sin(spin * 4 + dir) * r * 0.2);
      c.lineTo(dir * reach * 0.75, -Math.sin(spin * 5 + dir) * r * 0.15);
      c.lineTo(dir * reach, Math.sin(spin * 3) * r * 0.08);
      c.stroke();
      c.strokeStyle = col;
      c.lineWidth = Math.max(3.5, r * 0.38);
      c.globalAlpha = (alpha == null ? 1 : alpha) * 0.55;
      c.beginPath();
      c.moveTo(0, -r * 0.55);
      c.lineTo(dir * reach * 0.95, -r * 0.12);
      c.lineTo(dir * reach * 0.95, r * 0.12);
      c.lineTo(0, r * 0.55);
      c.closePath();
      c.stroke();
      c.globalAlpha = alpha == null ? 1 : alpha;
    }
    const core = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.7);
    core.addColorStop(0, 'rgba(255,255,255,.95)');
    core.addColorStop(0.5, col + 'cc');
    core.addColorStop(1, col + '22');
    c.fillStyle = core;
    c.beginPath(); c.arc(0, 0, r * 0.55, 0, TAU); c.fill();
  } else if (behavior === 'pull' || behavior === 'meteor') {
    c.shadowColor = col; c.shadowBlur = lite ? 10 : 24;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, col + 'ee');
    grd.addColorStop(0.5, col + '99');
    grd.addColorStop(1, col + '22');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,120,160,.85)'; c.lineWidth = 2;
    for (let ring = 0; ring < (lite ? 2 : 4); ring++) {
      c.beginPath();
      c.arc(0, 0, r * (0.35 + ring * 0.18), spin * (1 + ring * 0.2), spin * (1 + ring * 0.2) + Math.PI * 1.35);
      c.stroke();
    }
  } else {
    c.shadowColor = col; c.shadowBlur = lite ? 8 : 24;
    const grd = c.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(255,255,255,.95)');
    grd.addColorStop(0.35, col + 'dd');
    grd.addColorStop(0.7, col + '88');
    grd.addColorStop(1, col + '18');
    c.fillStyle = grd;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = 2;
    const ellipses = lite ? 2 : 6;
    for (let i = 0; i < ellipses; i++) {
      const a0 = spin + i * 0.95;
      c.beginPath();
      c.ellipse(0, 0, r * 0.95, r * (0.32 + (i % 3) * 0.11), a0, 0, TAU);
      c.stroke();
    }
    // Inner spiral ribbon (Spiral Orb signature)
    if (!lite) {
      c.strokeStyle = 'rgba(255,255,255,.55)';
      c.lineWidth = 1.5;
      c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        const a = spin * 1.6 + t * Math.PI * 3.2;
        const rr = r * (0.12 + t * 0.78);
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr * 0.72;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }
    c.strokeStyle = col;
    c.lineWidth = lite ? 2 : 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, r * 1.14, spin, spin + Math.PI * 1.35);
    c.stroke();
    if (!lite && !calm) {
      c.strokeStyle = 'rgba(255,255,255,.4)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, 0, r * 1.28, -spin * 0.8, -spin * 0.8 + Math.PI * 0.9);
      c.stroke();
    }
  }
  c.restore();
}

/**
 * Void Gaze in-flight: tweerichtings lichtschits-strook.
 * Dik bij centrum, smaller naar de tips (taper met afstand).
 */
function drawVoidGazeSlashWave(c, p) {
  if (!p) return;
  const col = (typeof skillById === 'function' ? (skillById(p.kind) || {}).color : null) || '#c47aff';
  const reach = Math.max(8, p.slashReach || 0);
  const r0 = p.r0 || 42;
  const maxR = Math.max(1, p.slashMaxReach || 460);
  const lite = fxLite();
  const calm = motionReduced();
  const spin = p.spin || 0;
  const lifeFade = clamp((p.life || 0.2) / 0.25, 0.35, 1);

  c.save();
  c.globalAlpha = lifeFade;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Kernflits in het midden
  const coreR = r0 * (0.55 + Math.sin(spin * 2.2) * 0.08);
  const core = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, coreR * 1.4);
  core.addColorStop(0, 'rgba(255,255,255,.95)');
  core.addColorStop(0.35, 'rgba(232,208,255,.85)');
  core.addColorStop(0.7, col + '88');
  core.addColorStop(1, col + '00');
  c.fillStyle = core;
  c.beginPath();
  c.arc(p.x, p.y, coreR * 1.35, 0, TAU);
  c.fill();

  for (const dir of [-1, 1]) {
    const tipX = p.x + dir * reach;
    const tipT = clamp(reach / maxR, 0, 1);
    const tipH = Math.max(3, r0 * (1 - tipT * 0.82) * 0.35);
    const midH = r0 * (1 - tipT * 0.4) * 0.7;

    // Glow-fill van de strook (taperende diamant)
    c.shadowColor = col;
    c.shadowBlur = lite ? 6 : 18;
    const grad = c.createLinearGradient(p.x, p.y, tipX, p.y);
    grad.addColorStop(0, 'rgba(255,255,255,.75)');
    grad.addColorStop(0.25, col + 'cc');
    grad.addColorStop(0.75, col + '66');
    grad.addColorStop(1, col + '18');
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(p.x, p.y - r0 * 0.95);
    c.lineTo(p.x + dir * reach * 0.45, p.y - midH);
    c.lineTo(tipX, p.y - tipH);
    c.lineTo(tipX, p.y + tipH);
    c.lineTo(p.x + dir * reach * 0.45, p.y + midH);
    c.lineTo(p.x, p.y + r0 * 0.95);
    c.closePath();
    c.fill();
    c.shadowBlur = 0;

    // Jagged lightning core
    const segs = lite ? 5 : 9;
    c.strokeStyle = 'rgba(255,255,255,.92)';
    c.lineWidth = lite ? 2.2 : 3.2;
    c.beginPath();
    c.moveTo(p.x, p.y);
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const x = p.x + dir * reach * t;
      const wob = calm ? 0 : Math.sin(spin * 9 + i * 1.7 + dir) * (6 * (1 - t) + 2);
      const y = p.y + wob * (i % 2 ? 1 : -1);
      c.lineTo(x, y);
    }
    c.stroke();

    if (!lite) {
      c.strokeStyle = col;
      c.lineWidth = 5.5;
      c.globalAlpha = lifeFade * 0.45;
      c.beginPath();
      c.moveTo(p.x, p.y);
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const x = p.x + dir * reach * t;
        const wob = calm ? 0 : Math.sin(spin * 7 + i * 2.1 + dir * 0.5) * (8 * (1 - t) + 1);
        c.lineTo(x, p.y + wob * (i % 2 ? -1 : 1));
      }
      c.stroke();
      c.globalAlpha = lifeFade;

      // Rand-stroken (boven/onder) die mee-taperen
      c.strokeStyle = 'rgba(232,208,255,.55)';
      c.lineWidth = 1.4;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(p.x, p.y + side * r0 * 0.75);
        c.lineTo(p.x + dir * reach * 0.5, p.y + side * midH * 0.85);
        c.lineTo(tipX, p.y + side * tipH * 0.9);
        c.stroke();
      }
    }
  }

  c.restore();
}

/**
 * d20 #19 — Chunky pixel joystick outer ring (forgotten gap vs smooth arcs).
 */
function drawPixelJoyRing(c, cx, cy, r, color, alpha, thickness) {
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const a0 = c.globalAlpha;
  c.globalAlpha = (alpha == null ? 1 : alpha) * a0;
  const chunk = Math.max(2, Math.round(r / 14));
  const thick = Math.max(chunk, Math.round(thickness || chunk * 1.5));
  const n = Math.max(20, Math.round(r * 1.35));
  c.fillStyle = color || '#fff';
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU;
    for (let t = 0; t < thick; t += chunk) {
      const rr = r - t;
      const x = Math.round(cx + Math.cos(ang) * rr);
      const y = Math.round(cy + Math.sin(ang) * rr);
      c.fillRect(x - (chunk >> 1), y - (chunk >> 1), chunk, chunk);
    }
  }
  const tick = Math.max(chunk + 1, Math.round(r * 0.12));
  const inset = r - thick;
  c.fillRect(Math.round(cx - (chunk >> 1)), Math.round(cy - r - 1), chunk, tick);
  c.fillRect(Math.round(cx - (chunk >> 1)), Math.round(cy + inset), chunk, tick);
  c.fillRect(Math.round(cx - r - 1), Math.round(cy - (chunk >> 1)), tick, chunk);
  c.fillRect(Math.round(cx + inset), Math.round(cy - (chunk >> 1)), tick, chunk);
  c.globalAlpha = a0;
  c.imageSmoothingEnabled = prev;
}

/** Chunky pixel joystick knob (filled disc). */
function drawPixelJoyKnob(c, cx, cy, r, color, alpha) {
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  const a0 = c.globalAlpha;
  c.globalAlpha = (alpha == null ? 1 : alpha) * a0;
  const chunk = Math.max(2, Math.round(r / 5.5));
  const r2 = r * r;
  c.fillStyle = color || '#fff';
  for (let y = -r; y <= r; y += chunk) {
    for (let x = -r; x <= r; x += chunk) {
      if (x * x + y * y <= r2) {
        c.fillRect(Math.round(cx + x - (chunk >> 1)), Math.round(cy + y - (chunk >> 1)), chunk, chunk);
      }
    }
  }
  c.fillStyle = 'rgba(255,255,255,.28)';
  const hr = Math.max(chunk, Math.round(r * 0.35));
  for (let y = -hr; y <= 0; y += chunk) {
    for (let x = -hr; x <= 0; x += chunk) {
      if (x * x + y * y <= hr * hr) {
        c.fillRect(
          Math.round(cx + x - r * 0.25 - (chunk >> 1)),
          Math.round(cy + y - r * 0.25 - (chunk >> 1)),
          chunk, chunk
        );
      }
    }
  }
  c.globalAlpha = a0;
  c.imageSmoothingEnabled = prev;
}

