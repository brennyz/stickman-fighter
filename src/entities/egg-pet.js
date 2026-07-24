/* ============================== EGG PET FOLLOWER ====================== */

function drawEggPetArt(c, def, size, t, x, y, dim) {
  if (!def) return;
  const rar = rarityOf(def.rarity);
  const bob = Math.sin(t * 4.2) * 1.5;
  c.save();
  c.translate(x, y + bob);
  const s = size;
  const g = c.createLinearGradient(0, -s, 0, s * 0.9);
  g.addColorStop(0, def.c1);
  g.addColorStop(1, def.c2);
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, s * 0.72, s, 0, 0, TAU);
  c.fill();
  c.strokeStyle = dim ? 'rgba(255,255,255,.12)' : (rar.color + '88');
  c.lineWidth = 1.4;
  c.stroke();
  if (!dim) {
    c.globalAlpha = 0.35 + Math.sin(t * 3) * 0.08;
    c.fillStyle = rar.glow || 'rgba(124,245,255,.25)';
    c.beginPath();
    c.ellipse(0, 0, s * 0.95, s * 1.15, 0, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
  }
  c.save();
  c.globalAlpha = dim ? 0.25 : 0.85;
  c.fillStyle = '#fff';
  switch (def.pattern) {
    case 'stripe':
      for (let i = -2; i <= 2; i++) {
        c.fillRect(-s * 0.55, i * s * 0.22 - 2, s * 1.1, 3);
      }
      break;
    case 'dot':
      for (let i = 0; i < 5; i++) {
        const a = i * 1.25 + t * 0.4;
        c.beginPath();
        c.arc(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.45 - s * 0.1, 2.2, 0, TAU);
        c.fill();
      }
      break;
    case 'speckle':
      for (let i = 0; i < 7; i++) {
        c.beginPath();
        c.arc((i * 17 % 11 - 5) * 0.9, (i * 13 % 9 - 4) * 1.1 - 2, 1.6, 0, TAU);
        c.fill();
      }
      break;
    case 'star':
      drawStarShape(c, 0, -s * 0.15, s * 0.22, '#fff', true);
      break;
    case 'swirl':
      c.strokeStyle = '#fff';
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(0, -s * 0.05, s * 0.28, 0.2, TAU - 0.4);
      c.stroke();
      break;
    case 'flame':
      c.fillStyle = '#ffd75e';
      c.beginPath();
      c.moveTo(0, -s * 0.55);
      c.quadraticCurveTo(s * 0.2, -s * 0.2, 0, s * 0.05);
      c.quadraticCurveTo(-s * 0.2, -s * 0.2, 0, -s * 0.55);
      c.fill();
      break;
    case 'crystal':
      c.strokeStyle = '#fff';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(0, -s * 0.45);
      c.lineTo(s * 0.22, -s * 0.05);
      c.lineTo(0, s * 0.2);
      c.lineTo(-s * 0.22, -s * 0.05);
      c.closePath();
      c.stroke();
      break;
    case 'moon':
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(-s * 0.08, -s * 0.12, s * 0.18, 0, TAU);
      c.fill();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      c.arc(s * 0.04, -s * 0.16, s * 0.14, 0, TAU);
      c.fill();
      c.globalCompositeOperation = 'source-over';
      break;
    case 'gold':
      c.strokeStyle = '#ffe259';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, s * 0.55, s * 0.78, 0, 0, TAU);
      c.stroke();
      break;
    case 'neon':
      c.strokeStyle = '#4ecf6a';
      c.shadowColor = '#7cf5ff';
      c.shadowBlur = 6;
      c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(0, 0, s * 0.62, s * 0.86, 0, 0, TAU);
      c.stroke();
      c.shadowBlur = 0;
      break;
    case 'rainbow':
      ['#ff6b9d', '#ffd75e', '#4ecf6a', '#7cf5ff'].forEach((col, i) => {
        c.fillStyle = col;
        c.fillRect(-s * 0.5 + i * s * 0.25, -s * 0.35, s * 0.22, s * 0.7);
      });
      break;
    case 'prism':
      c.strokeStyle = '#fff';
      c.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        c.save();
        c.rotate(i * 0.9 + t * 0.5);
        c.strokeRect(-s * 0.15, -s * 0.35, s * 0.3, s * 0.55);
        c.restore();
      }
      break;
    default:
      break;
  }
  c.restore();
  if (!dim) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(-s * 0.18, -s * 0.08, 2.2, 0, TAU);
    c.arc(s * 0.14, -s * 0.04, 2.6, 0, TAU);
    c.fill();
    c.fillStyle = '#1a2040';
    c.beginPath();
    c.arc(-s * 0.16, -s * 0.08, 1, 0, TAU);
    c.arc(s * 0.16, -s * 0.04, 1.1, 0, TAU);
    c.fill();
  }
  c.restore();
}

class EggPet {
  constructor(def, game) {
    this.def = def;
    this.game = game;
    this.x = game.player ? game.player.x + 28 : W * 0.25;
    this.y = game.player ? game.player.y - 48 : game.ground - 48;
    this.t = Math.random() * 6;
    this.size = 11;
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p || !p.alive) return;
    this.t += dt;
    const bob = Math.sin(this.t * 4.5) * 3;
    const tx = p.x + p.face * (IS_TOUCH ? 26 : 30);
    const ty = p.y - 46 + bob;
    const follow = g.traveling ? 10 : 7;
    this.x += (tx - this.x) * Math.min(1, dt * follow);
    this.y += (ty - this.y) * Math.min(1, dt * 9);
  }

  draw(c) {
    drawEggPetArt(c, this.def, this.size, this.t, this.x, this.y, false);
  }
}

function spawnGameEggPet(game) {
  if (!game) return;
  game.eggPet = null;
  const def = activeEggPetDef();
  if (!def) return;
  game.eggPet = new EggPet(def, game);
}
