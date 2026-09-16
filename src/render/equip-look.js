/* ======================== EQUIP LOOK DRAW ============================== */
function lookPx(v) {
  return typeof lookSnap === 'function' ? lookSnap(v) : (Number.isFinite(v) ? Math.round(v) : 0);
}

function lookBoneOk(p) {
  return !!(p && Number.isFinite(p.x) && Number.isFinite(p.y));
}

function lookUseShadow() {
  if (typeof motionReduced === 'function' && motionReduced()) return false;
  if (typeof fxLite === 'function' && fxLite()) return false;
  return true;
}

function lookShadow(c, color, blur) {
  if (!c || !lookUseShadow()) return;
  const cap = (typeof IS_TOUCH !== 'undefined' && IS_TOUCH) ? 5 : 12;
  c.shadowColor = color;
  c.shadowBlur = Math.min(Math.max(0, blur || 0), cap);
}

function lookAnchor(bones, slot, look) {
  if (!bones) return { x: 0, y: 0 };
  const key = (look && look.anchor) || slot;
  let p = null;
  if (key === 'head') p = bones.head;
  else if (key === 'hand' || key === 'hands' || key === 'weapon-hold') p = bones.hand || bones.shoulder;
  else if (key === 'shoulder' || key === 'chest' || key === 'back') p = bones.shoulder;
  else if (key === 'hip' || key === 'legs') p = bones.hip;
  else if (key === 'pet') p = bones.hip || bones.shoulder;
  else p = bones.head;
  return lookBoneOk(p) ? p : (lookBoneOk(bones.head) ? bones.head : { x: 0, y: 0 });
}

function drawEquipLayer(c, looks, layer, bones, fighter) {
  if (!c || !looks || !looks.length) return;
  const want = typeof canonEquipLayer === 'function' ? canonEquipLayer(layer, layer) : layer;
  const rows = typeof looksOnLayer === 'function' ? looksOnLayer(looks, want) : looks.filter((l) => l.layer === want);
  for (const look of rows) {
    try { drawEquipPiece(c, look, bones, fighter); } catch (_) { /* one piece must not stall combat */ }
  }
}

function safeDrawEquipLayer(c, looks, layer, bones, fighter) {
  if (!c || !looks || !looks.length) return;
  try { drawEquipLayer(c, looks, layer, bones, fighter); } catch (_) {}
}

function drawEquipLooks(c, looks, bones, fighter, opts) {
  const layers = (opts && opts.layers) || EQUIP_LOOK_LAYERS;
  for (const layer of layers) safeDrawEquipLayer(c, looks, layer, bones, fighter);
}

function drawEquipPiece(c, look, bones, fighter) {
  if (!c || !look || typeof look.kind !== 'string') return;
  const fn = Object.prototype.hasOwnProperty.call(EQUIP_LOOK_DRAW, look.kind) ? EQUIP_LOOK_DRAW[look.kind] : null;
  if (typeof fn !== 'function') return;
  const anchor = lookAnchor(bones, look.slot, look);
  if (!lookBoneOk(anchor)) return;
  const x = lookPx(anchor.x + (look.ox || 0));
  const y = lookPx(anchor.y + (look.oy || 0));
  const sc = Number.isFinite(look.scale) && look.scale > 0 ? look.scale : 1;
  c.save();
  try {
    if (look.rot) {
      c.translate(x, y);
      c.rotate(look.rot);
      c.translate(-x, -y);
    }
    fn(c, look, x, y, sc, bones, fighter);
  } catch (_) {
    /* isolate bad piece / Android canvas quirk */
  } finally {
    c.restore();
  }
}

function drawLookBandana(c, look, x, y, sc, bones) {
  const r = (typeof EQUIP_LOOK_HEAD_R === 'number' ? EQUIP_LOOK_HEAD_R : 10.5) * sc;
  const sway = typeof lookClothSway === 'function' ? lookClothSway(bones, 1.8 * sc) : 0;
  /* Forehead wrap only — never swallow the face / chin of the stick head. */
  const y0 = y - r * 0.92;
  const h = 4.6 * sc;
  c.fillStyle = look.color;
  c.beginPath();
  c.moveTo(x - r * 0.96, y0);
  c.quadraticCurveTo(x - r * 1.02, y - r * 1.02, x - r * 0.48, y - r * 1.08);
  c.quadraticCurveTo(x, y - r * 1.14, x + r * 0.48, y - r * 1.08);
  c.quadraticCurveTo(x + r * 1.02, y - r * 1.02, x + r * 0.96, y0);
  c.lineTo(x + r * 0.88, y0 + h);
  c.quadraticCurveTo(x, y0 + h + 0.8 * sc, x - r * 0.88, y0 + h);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,.28)';
  c.lineWidth = 1;
  c.stroke();
  if (look.plate) {
    c.fillStyle = look.plate;
    const pw = 8.6 * sc, ph = 3.6 * sc;
    c.beginPath();
    c.rect(lookPx(x - pw / 2), lookPx(y0 + 0.6 * sc), pw, ph);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,.22)';
    c.lineWidth = 0.8;
    c.stroke();
  }
  // Tails stream behind the head (−x) so they do not sit on the face.
  c.strokeStyle = look.color;
  c.lineCap = 'round';
  c.lineWidth = 2.4 * sc;
  c.beginPath();
  c.moveTo(x - r * 0.86, y0 + 1.2 * sc);
  c.quadraticCurveTo(x - r * 1.4 + sway * 0.4, y0 + 4 * sc, x - r * 1.55 + sway, y0 + 11 * sc);
  c.stroke();
  c.lineWidth = 1.7 * sc;
  c.beginPath();
  c.moveTo(x - r * 0.8, y0 + 2 * sc);
  c.quadraticCurveTo(x - r * 1.24 + sway * 0.3, y0 + 6 * sc, x - r * 1.32 + sway * 0.85, y0 + 13 * sc);
  c.stroke();
}

function drawLookVisor(c, look, x, y, sc) {
  const w = 17.2 * sc, h = 4.6 * sc;
  const y0 = y - 1.2 * sc;
  c.fillStyle = look.color || look.accent || '#7cf5ff';
  c.globalAlpha = 0.88;
  c.beginPath();
  c.moveTo(x - w / 2, y0);
  c.quadraticCurveTo(x, y0 + 1.6 * sc, x + w / 2, y0);
  c.lineTo(x + w / 2 - 0.8 * sc, y0 + h);
  c.quadraticCurveTo(x, y0 + h + 1.1 * sc, x - w / 2 + 0.8 * sc, y0 + h);
  c.closePath();
  c.fill();
  c.globalAlpha = 0.45;
  c.fillStyle = '#e8ffff';
  c.fillRect(lookPx(x - w / 2 + 2 * sc), lookPx(y0 + 1.0 * sc), w * 0.36, 1.4 * sc);
  c.globalAlpha = 1;
}

function drawLookFox(c, look, x, y, sc) {
  const col = look.accent || look.color;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x - 9 * sc, y - 15 * sc);
  c.lineTo(x - 14 * sc, y - 27 * sc);
  c.lineTo(x - 4.5 * sc, y - 17 * sc);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(x + 9 * sc, y - 15 * sc);
  c.lineTo(x + 14 * sc, y - 27 * sc);
  c.lineTo(x + 4.5 * sc, y - 17 * sc);
  c.closePath();
  c.fill();
  c.fillStyle = '#fff4d6';
  c.beginPath();
  c.moveTo(x - 8.2 * sc, y - 16.2 * sc);
  c.lineTo(x - 12.2 * sc, y - 24.2 * sc);
  c.lineTo(x - 6.2 * sc, y - 17.2 * sc);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(x + 8.2 * sc, y - 16.2 * sc);
  c.lineTo(x + 12.2 * sc, y - 24.2 * sc);
  c.lineTo(x + 6.2 * sc, y - 17.2 * sc);
  c.closePath();
  c.fill();
}

function drawLookDuck(c, look, x, y, sc) {
  c.fillStyle = look.accent || '#ffe259';
  c.beginPath();
  c.moveTo(x + 8 * sc, y + 1 * sc);
  c.lineTo(x + 18 * sc, y + 4 * sc);
  c.lineTo(x + 8 * sc, y + 7 * sc);
  c.closePath();
  c.fill();
  c.fillStyle = '#c97a20';
  c.fillRect(x + 10 * sc, y + 3.2 * sc, 6 * sc, 1.2 * sc);
}

function drawLookTopknot(c, look, x, y, sc) {
  c.strokeStyle = look.accent || look.color;
  c.lineCap = 'round';
  c.lineWidth = 3.1 * sc;
  c.beginPath();
  c.moveTo(x, y - 17 * sc);
  c.lineTo(x + 1 * sc, y - 29 * sc);
  c.stroke();
  c.fillStyle = look.accent || look.color;
  c.beginPath();
  c.arc(x + 1 * sc, y - 32 * sc, 4.6 * sc, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.28)';
  c.beginPath();
  c.arc(x - 0.4 * sc, y - 33.2 * sc, 1.6 * sc, 0, TAU);
  c.fill();
}

function drawLookHelmet(c, look, x, y, sc, bones, fighter) {
  const r = 11.0 * sc;
  /* Replacement skull — if the base hollow head is skipped, this disc is the head. */
  c.fillStyle = look.color;
  c.beginPath();
  c.arc(x, y, r * 0.9, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(x, y - 0.6 * sc, r, Math.PI, 0);
  c.lineTo(x + r, y + 1.2 * sc);
  c.quadraticCurveTo(x, y + 2.4 * sc, x - r, y + 1.2 * sc);
  c.closePath();
  c.fill();
  c.strokeStyle = look.accent || 'rgba(0,0,0,.3)';
  c.lineWidth = 1.2;
  c.stroke();
  /* Open face / chin so a helm never leaves a blank hole. */
  const body = (fighter && fighter.color) || look.accent || '#f2f5ff';
  c.strokeStyle = body;
  c.lineWidth = (fighter && fighter.lineW) || 3.2;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(x, y, (typeof EQUIP_LOOK_HEAD_R === 'number' ? EQUIP_LOOK_HEAD_R : 10.5) * sc, 0.2, Math.PI - 0.2);
  c.stroke();
}

function drawLookCoat(c, look, x, y, sc, bones) {
  const sh = lookBoneOk(bones && bones.shoulder) ? bones.shoulder : { x, y };
  const hip = lookBoneOk(bones && bones.hip) ? bones.hip : { x, y: y + 32 };
  const sway = typeof lookClothSway === 'function' ? lookClothSway(bones, 2.8 * sc) : 0;
  const flare = 17 * sc;
  c.fillStyle = look.fill || look.color;
  c.beginPath();
  c.moveTo(lookPx(hip.x - 5 + sway * 0.3), lookPx(hip.y + 10 * sc));
  c.quadraticCurveTo(hip.x - flare - 2 + sway, hip.y + 3, hip.x - flare + sway, hip.y - 6);
  c.lineTo(lookPx(sh.x - 16 * sc), lookPx(sh.y - 5));
  c.quadraticCurveTo(sh.x, sh.y - 12 * sc, sh.x + 16 * sc, sh.y - 5);
  c.lineTo(lookPx(hip.x + flare + sway), lookPx(hip.y - 6));
  c.quadraticCurveTo(hip.x + flare + 2 + sway, hip.y + 3, hip.x + 5 + sway * 0.3, hip.y + 10 * sc);
  c.quadraticCurveTo(hip.x + sway * 0.2, hip.y + 6 * sc, hip.x - 5 + sway * 0.3, hip.y + 10 * sc);
  c.closePath();
  c.fill();
  c.strokeStyle = look.accent;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(sh.x - 7 * sc, sh.y - 1);
  c.lineTo(0, hip.y + 3);
  c.lineTo(sh.x + 7 * sc, sh.y - 1);
  c.stroke();
}

function drawLookCape(c, look, x, y, sc, bones) {
  const sh = lookBoneOk(bones && bones.shoulder) ? bones.shoulder : { x, y };
  const hip = lookBoneOk(bones && bones.hip) ? bones.hip : { x, y: y + 32 };
  const sway = typeof lookClothSway === 'function' ? lookClothSway(bones, 3.2 * sc) : 0;
  c.fillStyle = look.fill || look.color;
  c.beginPath();
  c.moveTo(sh.x - 12 * sc, sh.y - 4);
  c.quadraticCurveTo(sh.x - 22 * sc + sway, hip.y - 4, hip.x - 14 * sc + sway, hip.y + 12 * sc);
  c.quadraticCurveTo(hip.x + sway * 0.4, hip.y + 8 * sc, hip.x + 6 * sc + sway * 0.5, hip.y + 10 * sc);
  c.lineTo(sh.x + 4 * sc, sh.y - 2);
  c.quadraticCurveTo(sh.x, sh.y - 8 * sc, sh.x - 12 * sc, sh.y - 4);
  c.closePath();
  c.fill();
}

function drawLookVest(c, look, x, y, sc, bones) {
  const sh = lookBoneOk(bones && bones.shoulder) ? bones.shoulder : { x, y };
  const hip = lookBoneOk(bones && bones.hip) ? bones.hip : { x, y: y + 32 };
  c.fillStyle = look.fill || look.color;
  c.beginPath();
  c.moveTo(lookPx(sh.x - 13 * sc), lookPx(sh.y - 3));
  c.lineTo(lookPx(sh.x + 13 * sc), lookPx(sh.y - 3));
  c.lineTo(lookPx(hip.x + 11 * sc), lookPx(hip.y - 4));
  c.lineTo(lookPx(hip.x - 11 * sc), lookPx(hip.y - 4));
  c.closePath();
  c.fill();
  c.strokeStyle = look.accent;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(sh.x - 3 * sc, sh.y);
  c.lineTo(0, hip.y - 6);
  c.lineTo(sh.x + 3 * sc, sh.y);
  c.stroke();
}

function drawLookChestplate(c, look, x, y, sc, bones) {
  drawLookVest(c, look, x, y, sc, bones);
  const sh = lookBoneOk(bones && bones.shoulder) ? bones.shoulder : { x, y };
  c.fillStyle = look.accent || '#dfe8ff';
  c.globalAlpha = 0.45;
  c.fillRect(lookPx(sh.x - 6 * sc), lookPx(sh.y + 2), 12 * sc, 4 * sc);
  c.globalAlpha = 1;
}

function drawLookWrap(c, look, x, y, sc, bones) {
  const hip = lookBoneOk(bones && bones.hip) ? bones.hip : { x, y };
  c.fillStyle = look.fill || look.color;
  c.globalAlpha = 0.8;
  c.beginPath();
  if (typeof c.ellipse === 'function') {
    c.ellipse(hip.x, hip.y + 10 * sc, 15 * sc, 5.2 * sc, 0, 0, TAU);
  } else {
    c.save();
    c.translate(hip.x, hip.y + 10 * sc);
    c.scale(15 * sc, 5.2 * sc);
    c.arc(0, 0, 1, 0, TAU);
    c.restore();
  }
  c.fill();
  c.globalAlpha = 1;
}

function drawLookGreaves(c, look, x, y, sc, bones) {
  const hip = lookBoneOk(bones && bones.hip) ? bones.hip : { x, y };
  const gx = lookPx(hip.x), gy = lookPx(hip.y + 22 * sc);
  const w = 7 * sc, h = 12 * sc;
  c.fillStyle = look.color;
  c.fillRect(lookPx(gx - 14 * sc), gy, w, h);
  c.fillRect(lookPx(gx + 7 * sc), gy, w, h);
  c.strokeStyle = look.accent || 'rgba(0,0,0,.25)';
  c.lineWidth = 1;
  c.strokeRect(lookPx(gx - 14 * sc), gy, w, h);
  c.strokeRect(lookPx(gx + 7 * sc), gy, w, h);
}

function drawLookTome(c, look, x, y, sc) {
  const bx = lookPx(x - 15 * sc);
  const by = lookPx(y + 1 * sc);
  const w = 8.5 * sc, h = 12 * sc;
  c.fillStyle = look.accent || look.color;
  c.fillRect(bx, by, w, h);
  c.fillStyle = '#fff8e8';
  c.fillRect(bx + 1.6 * sc, by + 2.2 * sc, w - 3.2 * sc, h - 4.4 * sc);
  c.strokeStyle = look.color;
  c.lineWidth = 1.2;
  c.strokeRect(bx, by, w, h);
  c.strokeStyle = 'rgba(107,83,68,.45)';
  c.beginPath();
  c.moveTo(bx + w / 2, by + 2.4 * sc);
  c.lineTo(bx + w / 2, by + h - 2.4 * sc);
  c.stroke();
}

function drawLookCrystal(c, look, x, y, sc) {
  const cx = lookPx(x);
  const cy = lookPx(y);
  c.fillStyle = look.accent || look.color;
  c.globalAlpha = 0.92;
  c.beginPath();
  c.moveTo(cx, cy - 7 * sc);
  c.lineTo(cx + 6 * sc, cy);
  c.lineTo(cx, cy + 6 * sc);
  c.lineTo(cx - 6 * sc, cy);
  c.closePath();
  c.fill();
  c.globalAlpha = 0.55;
  c.fillStyle = '#e8ffff';
  c.beginPath();
  c.moveTo(cx - 1, cy - 4 * sc);
  c.lineTo(cx + 2.4 * sc, cy - 1);
  c.lineTo(cx - 1.6 * sc, cy + 1);
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
}

function drawLookGlow(c, look, x, y, sc, bones, fighter) {
  const t = fighter && Number.isFinite(fighter.animT) ? fighter.animT : 0;
  lookShadow(c, look.accent || look.color, 10 + Math.sin(t * 5) * 3);
  c.strokeStyle = look.accent || look.color;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y, 12.2 * sc, 0, TAU);
  c.stroke();
}

function drawLookLightning(c, look, x, y, sc, bones, fighter) {
  if (typeof motionReduced === 'function' && motionReduced()) return;
  if (typeof fxLite === 'function' && fxLite()) return;
  const t = fighter && Number.isFinite(fighter.animT) ? fighter.animT : 0;
  const pulse = Math.sin(t * 14) * 0.5 + 0.5;
  const cyber = look.styleId === 'cyber';
  if (pulse <= 0.32 && !cyber) return;
  c.strokeStyle = cyber ? '#7cf5ff' : (look.accent || '#6fd7ff');
  lookShadow(c, cyber ? '#4ecf6a' : '#7cf5ff', cyber ? 10 : 6);
  c.lineWidth = cyber ? 2 : 1.4;
  c.globalAlpha = 0.55 + pulse * 0.35;
  const lx = x + (cyber ? 14 : -12) * sc;
  const ly = y - 8 * sc;
  c.beginPath();
  c.moveTo(x, y - 10 * sc);
  c.lineTo(x + 4 * sc, y - 4 * sc);
  c.lineTo(x - 2 * sc, y + 2 * sc);
  c.lineTo(lx, ly);
  c.stroke();
  if (cyber && pulse > 0.6) {
    c.beginPath();
    c.moveTo(x - 6 * sc, y - 14 * sc);
    c.lineTo(x + 8 * sc, y - 18 * sc);
    c.lineTo(x + 2 * sc, y - 6 * sc);
    c.stroke();
  }
}

function drawLookHorns(c, look, x, y, sc) {
  c.fillStyle = look.color || look.accent;
  c.beginPath();
  c.moveTo(x - 8 * sc, y - 14 * sc);
  c.lineTo(x - 13 * sc, y - 28 * sc);
  c.lineTo(x - 4 * sc, y - 16 * sc);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(x + 8 * sc, y - 14 * sc);
  c.lineTo(x + 13 * sc, y - 28 * sc);
  c.lineTo(x + 4 * sc, y - 16 * sc);
  c.closePath();
  c.fill();
}

function drawLookHalo(c, look, x, y, sc) {
  c.strokeStyle = look.accent || look.color || '#ffe259';
  c.lineWidth = 2.2 * sc;
  c.beginPath();
  c.ellipse ? c.ellipse(x, y - 20 * sc, 9 * sc, 3.2 * sc, 0, 0, TAU)
    : c.arc(x, y - 20 * sc, 8 * sc, 0, TAU);
  c.stroke();
}

function drawLookTail(c, look, x, y, sc, bones) {
  const hip = lookBoneOk(bones && bones.hip) ? bones.hip : { x, y };
  c.strokeStyle = look.color || look.accent || '#c97a20';
  c.lineCap = 'round';
  c.lineWidth = 4.4 * sc;
  c.beginPath();
  const sway = typeof lookClothSway === 'function' ? lookClothSway(bones, 3.6 * sc) : 0;
  c.moveTo(hip.x + 3 * sc, hip.y + 2 * sc);
  c.quadraticCurveTo(hip.x + 16 * sc + sway, hip.y + 6 * sc, hip.x + 14 * sc + sway * 0.7, hip.y + 18 * sc);
  c.stroke();
  c.fillStyle = look.accent || '#fff4d6';
  c.beginPath();
  c.arc(hip.x + 14 * sc + sway * 0.7, hip.y + 18 * sc, 3.2 * sc, 0, TAU);
  c.fill();
}

function drawLookWings(c, look, x, y, sc, bones) {
  const sh = lookBoneOk(bones && bones.shoulder) ? bones.shoulder : { x, y };
  const flap = typeof lookClothSway === 'function' ? lookClothSway(bones, 4.2 * sc) : 0;
  c.fillStyle = look.fill || look.color || 'rgba(200,208,220,.55)';
  c.beginPath();
  c.moveTo(sh.x - 6 * sc, sh.y);
  c.quadraticCurveTo(sh.x - 28 * sc, sh.y - 18 * sc - flap, sh.x - 22 * sc, sh.y + 16 * sc);
  c.quadraticCurveTo(sh.x - 12 * sc, sh.y + 8 * sc, sh.x - 6 * sc, sh.y + 4 * sc);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(sh.x + 4 * sc, sh.y);
  c.quadraticCurveTo(sh.x + 26 * sc, sh.y - 16 * sc - flap, sh.x + 20 * sc, sh.y + 16 * sc);
  c.quadraticCurveTo(sh.x + 10 * sc, sh.y + 8 * sc, sh.x + 4 * sc, sh.y + 4 * sc);
  c.closePath();
  c.fill();
}

function drawLookGloves(c, look, x, y, sc, bones) {
  const hand = lookBoneOk(bones && bones.hand) ? bones.hand : { x, y };
  c.fillStyle = look.color || look.accent || '#8fa3d9';
  c.beginPath();
  c.arc(hand.x, hand.y, 4.8 * sc, 0, TAU);
  c.fill();
  c.strokeStyle = look.accent || 'rgba(0,0,0,.28)';
  c.lineWidth = 1.2;
  c.stroke();
}

function drawLookCharm(c, look, x, y, sc) {
  c.fillStyle = look.accent || look.color;
  c.beginPath();
  c.arc(x, y, 3.1 * sc, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)';
  c.beginPath();
  c.arc(x - 0.8 * sc, y - 0.8 * sc, 1.1 * sc, 0, TAU);
  c.fill();
}

function drawStickmanHead(c, x, y, color, opts) {
  if (!c) return;
  const r = (opts && Number.isFinite(opts.r)) ? opts.r
    : (typeof EQUIP_LOOK_HEAD_R === 'number' ? EQUIP_LOOK_HEAD_R : 10.5);
  const lineW = (opts && Number.isFinite(opts.lineW)) ? opts.lineW : 4.5;
  const px = lookPx(x);
  const py = lookPx(y);
  const col = (typeof lookHeadStroke === 'function') ? lookHeadStroke(color || '#f2f5ff') : (color || '#f2f5ff');
  c.save();
  try {
    if (opts && opts.bald) {
      c.fillStyle = '#ffe8c8';
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)';
      c.lineWidth = 1.2;
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.arc(px - 3, py - 3, 2.8, 0, TAU); c.fill();
    } else {
      const fill = typeof lookHeadFill === 'function' ? lookHeadFill(col) : 'rgba(255,255,255,.10)';
      c.fillStyle = fill;
      c.beginPath(); c.arc(px, py, Math.max(2, r - lineW * 0.28), 0, TAU); c.fill();
      c.strokeStyle = col;
      c.lineWidth = lineW;
      c.lineCap = 'round';
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.stroke();
      const rim = typeof lookHeadRim === 'function' ? lookHeadRim(col) : null;
      if (rim) {
        c.strokeStyle = rim;
        c.lineWidth = Math.max(1.15, lineW * 0.32);
        c.beginPath(); c.arc(px, py, r + 0.7, 0, TAU); c.stroke();
      }
    }
  } finally {
    c.restore();
  }
}

/** Lower-arc restroke so a bandana/visor cannot erase the stick-head. */
function restrokeStickmanChin(c, x, y, color, opts) {
  if (!c) return;
  const r = (opts && Number.isFinite(opts.r)) ? opts.r
    : (typeof EQUIP_LOOK_HEAD_R === 'number' ? EQUIP_LOOK_HEAD_R : 10.5);
  const lineW = (opts && Number.isFinite(opts.lineW)) ? opts.lineW : 4.5;
  const px = lookPx(x);
  const py = lookPx(y);
  const col = (typeof lookHeadStroke === 'function') ? lookHeadStroke(color || '#f2f5ff') : (color || '#f2f5ff');
  c.save();
  try {
    c.strokeStyle = col;
    c.lineWidth = lineW;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(px, py, r, 0.18, Math.PI - 0.18);
    c.stroke();
    const rim = typeof lookHeadRim === 'function' ? lookHeadRim(col) : null;
    if (rim) {
      c.strokeStyle = rim;
      c.lineWidth = Math.max(1.1, lineW * 0.3);
      c.beginPath();
      c.arc(px, py, r + 0.7, 0.18, Math.PI - 0.18);
      c.stroke();
    }
  } finally {
    c.restore();
  }
}

function ensureEquipHeadVisible(c, looks, bones, fighter) {
  if (!c) return;
  const head = bones && bones.head;
  if (!lookBoneOk(head)) return;
  void looks;
  restrokeStickmanChin(c, head.x, head.y, fighter && fighter.color, {
    lineW: fighter && fighter.lineW,
  });
}

function drawEquipLookPreview(c, styleId, gear) {
  if (!c) return null;
  try {
    const st = typeof styleById === 'function' ? styleById(styleId) : { id: 'classic', body: '#f2f5ff' };
    const f = new Fighter({
      isPlayer: true, x: 0, y: 0, color: st.body || '#f2f5ff', style: st, scale: 1,
      gear: gear || null,
      _preview: true,
    });
    f.animT = 0.55;
    f.draw(c);
    return f;
  } catch (_) {
    return null;
  }
}

if (typeof EquipLookApi !== 'undefined') {
  EquipLookApi.drawPreview = drawEquipLookPreview;
  EquipLookApi.drawLayer = drawEquipLayer;
  EquipLookApi.safeDrawLayer = safeDrawEquipLayer;
  EquipLookApi.drawHead = drawStickmanHead;
  EquipLookApi.restrokeChin = restrokeStickmanChin;
  EquipLookApi.ensureHead = ensureEquipHeadVisible;
}

const EQUIP_LOOK_DRAW = {
  bandana: drawLookBandana,
  visor: drawLookVisor,
  fox: drawLookFox,
  duck: drawLookDuck,
  topknot: drawLookTopknot,
  helmet: drawLookHelmet,
  coat: drawLookCoat,
  cape: drawLookCape,
  vest: drawLookVest,
  chestplate: drawLookChestplate,
  wrap: drawLookWrap,
  greaves: drawLookGreaves,
  tome: drawLookTome,
  crystal: drawLookCrystal,
  glow: drawLookGlow,
  lightning: drawLookLightning,
  charm: drawLookCharm,
  gloves: drawLookGloves,
  horns: drawLookHorns,
  halo: drawLookHalo,
  wings: drawLookWings,
  tail: drawLookTail,
};
