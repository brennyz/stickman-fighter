/* ============================ EQUIP LOOK =============================== */
/**
 * Look-only. Gear contract v1 (no economy):
 *   slotIds: head · chest · hands · legs · back   (one item per slot)
 *   draw order back→front: back, legs, chest, head, hands, weapon-hold, pet
 *   Item.draw.layer + Item.draw offsets (ox/oy/scale).
 * weapon-hold + pet are pipeline stages (existing weapon / pet draw).
 */
const EQUIP_LOOK_SLOTS = ['head', 'chest', 'hands', 'legs', 'back'];
const EQUIP_LOOK_LAYERS = ['back', 'legs', 'chest', 'head', 'hands', 'weapon-hold', 'pet'];
const EQUIP_LOOK_PAINT = ['back', 'legs', 'chest', 'head', 'hands'];
const EQUIP_LOOK_MAX = 5;
const EQUIP_LOOK_OX_MAX = 48;
const EQUIP_LOOK_SCALE_MIN = 0.35;
const EQUIP_LOOK_SCALE_MAX = 1.75;

const EQUIP_LAYER_ALIAS = {
  under: 'back', behind: 'back', underbody: 'back', cape: 'back', cloak: 'back',
  torso: 'chest', body: 'chest', bodyover: 'chest', vest: 'chest',
  shin: 'legs', boots: 'legs',
  over: 'head', headover: 'head', overlay: 'head', aura: 'head',
  front: 'hands', fg: 'hands', foreground: 'hands', gloves: 'hands',
  weapon: 'weapon-hold', hold: 'weapon-hold',
  companion: 'pet',
};

const EQUIP_SLOT_ALIAS = {
  helmet: 'head', hat: 'head', bandana: 'head', visor: 'head',
  armor: 'chest', coat: 'chest', chestplate: 'chest', vest: 'chest',
  boots: 'legs', greaves: 'legs', shin: 'legs',
  cape: 'back', cloak: 'back', tome: 'back',
  gloves: 'hands', bracers: 'hands', wrists: 'hands',
  accessory: 'hands', trinket: 'hands', charm: 'hands', ring: 'hands', aura: 'hands',
};

const EQUIP_LOOK_DEFAULTS = {
  bandana: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  visor: { slot: 'head', layer: 'head', ox: 0, oy: 1, scale: 1 },
  fox: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  duck: { slot: 'head', layer: 'head', ox: 1, oy: 1, scale: 1 },
  topknot: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  helmet: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  glow: { slot: 'head', layer: 'head', ox: 0, oy: 0, scale: 1 },
  lightning: { slot: 'head', layer: 'head', ox: 0, oy: 0, scale: 1 },
  charm: { slot: 'head', layer: 'head', ox: 0, oy: 2, scale: 1 },
  coat: { slot: 'back', layer: 'back', ox: 0, oy: 1, scale: 1 },
  cape: { slot: 'back', layer: 'back', ox: 0, oy: 2, scale: 1 },
  tome: { slot: 'back', layer: 'back', ox: -1, oy: 2, scale: 1 },
  vest: { slot: 'chest', layer: 'chest', ox: 0, oy: 0, scale: 1 },
  chestplate: { slot: 'chest', layer: 'chest', ox: 0, oy: 0, scale: 1 },
  crystal: { slot: 'chest', layer: 'chest', ox: 1, oy: 0, scale: 1 },
  wrap: { slot: 'legs', layer: 'legs', ox: 0, oy: 0, scale: 1 },
  greaves: { slot: 'legs', layer: 'legs', ox: 0, oy: 1, scale: 1 },
  gloves: { slot: 'hands', layer: 'hands', ox: 0, oy: 0, scale: 1 },
};

/** Optional registry: item id → look. Gear systems can add rows without touching draw code. */
const EQUIP_LOOK = Object.create(null);

/**
 * Per-style pieces with tuned offsets. Colors fall back to the style’s
 * bandana / accent / plate when omitted.
 */
const EQUIP_LOOK_BY_STYLE = {
  classic: [],
  leaf_band: [
    { kind: 'bandana', ox: 0, oy: -1, scale: 1.04 },
  ],
  energy_glow: [
    { kind: 'glow', scale: 1.05 },
    { kind: 'bandana', oy: -0.5, scale: 0.96 },
  ],
  crimson_pact: [
    { kind: 'coat', oy: 1, scale: 1.06, fill: 'rgba(224,79,79,.46)' },
    { kind: 'bandana', oy: -1, scale: 1.02 },
  ],
  shadow: [
    { kind: 'cape', oy: 2, scale: 1.02, fill: 'rgba(42,24,64,.42)' },
    { kind: 'bandana', oy: -1, scale: 1.0 },
  ],
  guvve: [
    { kind: 'bandana', oy: -1, scale: 1.02 },
    { kind: 'duck', ox: 1, oy: 1.5, scale: 1.08 },
  ],
  gold: [
    { kind: 'glow', scale: 1.12 },
    { kind: 'bandana', oy: -1, scale: 1.04 },
  ],
  sand: [
    { kind: 'vest', fill: 'rgba(201,122,32,.34)', oy: 0, scale: 1.02 },
    { kind: 'wrap', fill: 'rgba(138,96,48,.55)', scale: 1.0 },
    { kind: 'bandana', oy: -0.5, scale: 1.0 },
  ],
  samurai: [
    { kind: 'topknot', oy: -1.5, scale: 1.06 },
    { kind: 'bandana', oy: 0, scale: 0.94 },
  ],
  cyber: [
    { kind: 'visor', oy: 1.5, scale: 1.04 },
    { kind: 'bandana', oy: -2, scale: 0.92 },
    { kind: 'lightning', ox: 1, oy: -1 },
  ],
  fox: [
    { kind: 'fox', oy: -1.5, scale: 1.08 },
    { kind: 'bandana', oy: 0.5, scale: 0.94 },
  ],
  storm: [
    { kind: 'glow', scale: 1.08 },
    { kind: 'bandana', oy: -1, scale: 1.0 },
    { kind: 'lightning', ox: -1, oy: -1 },
  ],
  void: [
    { kind: 'coat', oy: 1, scale: 1.08, fill: 'rgba(90,16,64,.50)' },
    { kind: 'bandana', oy: -1, scale: 1.02 },
  ],
  hunter: [
    { kind: 'vest', fill: 'rgba(61,92,50,.58)', oy: 0, scale: 1.04 },
    { kind: 'bandana', oy: -1, scale: 1.0 },
    { kind: 'charm', ox: -12, oy: -6, scale: 1.0 },
  ],
  crystal: [
    { kind: 'glow', scale: 1.04 },
    { kind: 'bandana', oy: -1, scale: 1.0 },
    { kind: 'crystal', anchor: 'shoulder', ox: 12, oy: -2, scale: 1.08 },
  ],
  tome: [
    { kind: 'tome', ox: -2, oy: 3, scale: 1.1 },
    { kind: 'bandana', oy: -0.5, scale: 0.98 },
  ],
};

function canonEquipSlot(slot) {
  if (!slot) return null;
  const key = String(slot).toLowerCase();
  if (EQUIP_LOOK_SLOTS.includes(key)) return key;
  const aliased = EQUIP_SLOT_ALIAS[key];
  return aliased || null;
}

function canonEquipLayer(layer, fallback) {
  const map = (v) => {
    if (!v) return null;
    const key = String(v).toLowerCase();
    if (EQUIP_LOOK_LAYERS.includes(key)) return key;
    return EQUIP_LAYER_ALIAS[key] || null;
  };
  return map(layer) || map(fallback) || 'chest';
}

function lookSnap(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function lookNum(v, fallback, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}

function lookColor(v, fallback) {
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  if (!s || s.length > 48 || /[\n\r<>]/.test(s)) return fallback;
  return s;
}

function isPlainGear(gear) {
  return !!gear && typeof gear === 'object' && !Array.isArray(gear);
}

function mergeItemDraw(base, draw) {
  if (!draw || typeof draw !== 'object' || Array.isArray(draw)) return base;
  const out = Object.assign({}, base);
  if (draw.kind) out.kind = draw.kind;
  if (draw.slot) out.slot = draw.slot;
  if (draw.layer) out.layer = draw.layer;
  if (draw.anchor) out.anchor = draw.anchor;
  ['ox', 'oy', 'scale', 'rot', 'color', 'accent', 'plate', 'fill'].forEach((k) => {
    if (draw[k] != null) out[k] = draw[k];
  });
  return out;
}

function hydrateEquipLook(piece, style) {
  if (!piece || typeof piece !== 'object') return null;
  piece = mergeItemDraw(piece, piece.draw);
  if (typeof piece.kind !== 'string' || !piece.kind) return null;
  if (piece.kind === '__proto__' || piece.kind === 'constructor' || piece.kind === 'prototype') return null;
  const defaults = EQUIP_LOOK_DEFAULTS[piece.kind] || { slot: 'chest', layer: 'chest', ox: 0, oy: 0, scale: 1 };
  const st = style && typeof style === 'object' ? style : {};
  const slot = canonEquipSlot(piece.slot || defaults.slot) || canonEquipSlot(defaults.slot) || 'chest';
  const layerHint = piece.layer || defaults.layer || slot;
  return {
    id: typeof piece.id === 'string' ? piece.id : (st.id ? st.id + ':' + piece.kind : piece.kind),
    kind: piece.kind,
    slot: EQUIP_LOOK_SLOTS.includes(slot) ? slot : 'chest',
    layer: canonEquipLayer(layerHint, slot),
    anchor: typeof piece.anchor === 'string' ? piece.anchor : (defaults.anchor || null),
    ox: lookNum(piece.ox != null ? piece.ox : defaults.ox, 0, -EQUIP_LOOK_OX_MAX, EQUIP_LOOK_OX_MAX),
    oy: lookNum(piece.oy != null ? piece.oy : defaults.oy, 0, -EQUIP_LOOK_OX_MAX, EQUIP_LOOK_OX_MAX),
    scale: lookNum(piece.scale != null ? piece.scale : defaults.scale, 1, EQUIP_LOOK_SCALE_MIN, EQUIP_LOOK_SCALE_MAX),
    rot: lookNum(piece.rot, 0, -3, 3),
    color: lookColor(piece.color, lookColor(st.bandana, lookColor(st.accent, '#8fa3d9'))),
    accent: lookColor(piece.accent, lookColor(st.accent, '#7cf5ff')),
    plate: lookColor(piece.plate, lookColor(st.plate, null)),
    fill: lookColor(piece.fill, null),
    styleId: st.id || piece.styleId || null,
  };
}

function looksForStyle(st) {
  if (!st) return [];
  if (typeof st === 'string') {
    st = typeof styleById === 'function' ? styleById(st) : { id: st };
  }
  if (!st || typeof st !== 'object') return [];
  const rows = EQUIP_LOOK_BY_STYLE[st.id];
  if (Array.isArray(rows)) return rows.map((p) => hydrateEquipLook(p, st)).filter(Boolean);
  return looksFromStyleFlags(st);
}

function looksFromStyleFlags(st) {
  if (!st) return [];
  const out = [];
  if (st.glow) out.push(hydrateEquipLook({ kind: 'glow' }, st));
  if (st.coat) out.push(hydrateEquipLook({ kind: 'coat' }, st));
  if (st.hunter) out.push(hydrateEquipLook({ kind: 'vest' }, st));
  if (st.bandana) out.push(hydrateEquipLook({ kind: 'bandana' }, st));
  if (st.visor) out.push(hydrateEquipLook({ kind: 'visor' }, st));
  if (st.fox) out.push(hydrateEquipLook({ kind: 'fox' }, st));
  if (st.duck) out.push(hydrateEquipLook({ kind: 'duck' }, st));
  if (st.topknot) out.push(hydrateEquipLook({ kind: 'topknot' }, st));
  if (st.crystal) out.push(hydrateEquipLook({ kind: 'crystal' }, st));
  if (st.tome) out.push(hydrateEquipLook({ kind: 'tome' }, st));
  if (st.lightning) out.push(hydrateEquipLook({ kind: 'lightning' }, st));
  return out.filter(Boolean);
}

function registerEquipLook(id, def) {
  if (typeof id !== 'string' || !id || !def || typeof def !== 'object') return;
  if (id === '__proto__' || id === 'constructor' || id === 'prototype') return;
  EQUIP_LOOK[id] = def;
}

function lookForItemId(id, slot, src) {
  if (!id) return [];
  const registered = EQUIP_LOOK[id];
  if (registered) {
    const piece = mergeItemDraw(Object.assign({}, registered, { id, slot: slot || registered.slot }), registered.draw);
    const one = hydrateEquipLook(piece, src || registered);
    return one ? [one] : [];
  }
  if (typeof styleById === 'function') {
    const st = styleById(id);
    if (st && st.id === id) {
      const all = looksForStyle(st);
      const want = canonEquipSlot(slot);
      return want ? all.filter((l) => l.slot === want) : all;
    }
  }
  return [];
}

function looksForGear(gear) {
  if (!isPlainGear(gear)) return [];
  const out = [];
  const seen = new Set();
  const visit = (slotKey, val) => {
    if (val == null || val === false || out.length >= EQUIP_LOOK_MAX) return;
    const slot = canonEquipSlot(slotKey);
    if (!slot || !EQUIP_LOOK_SLOTS.includes(slot)) return;
    if (typeof val === 'string') {
      const found = lookForItemId(val, slot);
      const one = found.find((l) => l.slot === slot) || found[0];
      if (one) out.push(one);
      return;
    }
    if (typeof val !== 'object' || Array.isArray(val)) return;
    const fromDraw = isPlainGear(val.draw) || isPlainGear(val.look);
    if (fromDraw || val.kind) {
      const merged = mergeItemDraw(Object.assign({ id: val.id, kind: val.kind, slot: val.slot || slot }, val.look || {}), val.draw);
      if (!merged.kind && val.id) {
        const found = lookForItemId(val.id, slot, val);
        const one = found[0];
        if (one) {
          const over = hydrateEquipLook(mergeItemDraw(Object.assign({}, one, { slot }), val.draw), val);
          out.push(over || one);
        }
        return;
      }
      const piece = hydrateEquipLook(Object.assign({ slot }, merged), val);
      if (piece) out.push(piece);
      return;
    }
    if (val.id) {
      const found = lookForItemId(val.id, slot, val);
      const one = found.find((l) => l.slot === slot) || found[0];
      if (one) out.push(one);
    }
  };
  const keys = EQUIP_LOOK_SLOTS.concat(Object.keys(EQUIP_SLOT_ALIAS));
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(gear, key)) continue;
    const slot = canonEquipSlot(key);
    if (!slot || seen.has(slot)) continue;
    seen.add(slot);
    visit(slot, gear[key]);
    if (out.length >= EQUIP_LOOK_MAX) break;
  }
  return out.filter(Boolean);
}

function resolveFighterLooks(fighter) {
  if (!fighter) return [];
  let styleLooks = [];
  try { styleLooks = looksForStyle(fighter.style) || []; } catch (_) { styleLooks = []; }
  let gear = fighter.gear;
  if (!isPlainGear(gear) && fighter.isPlayer && typeof save !== 'undefined' && save && isPlainGear(save.gear)) {
    gear = save.gear;
  }
  let gearLooks = [];
  try { gearLooks = looksForGear(gear) || []; } catch (_) { gearLooks = []; }
  if (!gearLooks.length) return styleLooks.slice(0, EQUIP_LOOK_MAX);
  const blocked = new Set(gearLooks.map((l) => l.slot).filter(Boolean));
  return styleLooks.filter((l) => !blocked.has(l.slot)).concat(gearLooks).slice(0, EQUIP_LOOK_MAX);
}

function looksOnLayer(looks, layer) {
  if (!looks || !looks.length) return [];
  return looks.filter((l) => l.layer === layer);
}

/** Menu-card camera: leave crown room so bandana / ears / topknot do not clip. */
function applyEquipLookPreview(cc, w, h) {
  if (!cc || typeof cc.translate !== 'function') return;
  const width = Number.isFinite(w) && w > 0 ? w : 80;
  const height = Number.isFinite(h) && h > 0 ? h : 86;
  cc.translate(width * 0.5, height * 0.87);
  cc.scale(0.78, 0.78);
}

const EquipLookApi = {
  slots: EQUIP_LOOK_SLOTS,
  layers: EQUIP_LOOK_LAYERS,
  paint: EQUIP_LOOK_PAINT,
  resolve: resolveFighterLooks,
  forStyle: looksForStyle,
  forGear: looksForGear,
  register: registerEquipLook,
  snap: lookSnap,
  preview: applyEquipLookPreview,
  canonSlot: canonEquipSlot,
  canonLayer: canonEquipLayer,
  max: EQUIP_LOOK_MAX,
};

if (typeof globalThis !== 'undefined') globalThis.EquipLookApi = EquipLookApi;
