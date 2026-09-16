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
/** Matches Fighter.draw head radius — keep overlays sitting on this circle. */
const EQUIP_LOOK_HEAD_R = 10.5;
/** Kinds that replace the hollow stick-head (must draw a skull/helm disc). */
const EQUIP_COVERS_HEAD = { helmet: true };
/**
 * Scale-1 stickman: feet at origin, head centre ≈ −104, crown/ears ≈ −126.
 * Preview camera uses this so the head never clips off a style card.
 */
const EQUIP_LOOK_STICK_TOP = 126;

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
  /* #280: charm / accessory / aura migrate → back. trinket / ring stay hands. */
  accessory: 'back', aura: 'back', charm: 'back',
  trinket: 'hands', ring: 'hands',
};

const EQUIP_LOOK_DEFAULTS = {
  bandana: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  visor: { slot: 'head', layer: 'head', ox: 0, oy: 0, scale: 1 },
  fox: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  duck: { slot: 'head', layer: 'head', ox: 1, oy: 1, scale: 1 },
  topknot: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  helmet: { slot: 'head', layer: 'head', ox: 0, oy: 0, scale: 1 },
  glow: { slot: 'head', layer: 'head', ox: 0, oy: 0, scale: 1 },
  lightning: { slot: 'head', layer: 'head', ox: 0, oy: 0, scale: 1 },
  charm: { slot: 'head', layer: 'head', ox: 0, oy: 2, scale: 1 },
  coat: { slot: 'back', layer: 'back', ox: 0, oy: 1, scale: 1 },
  cape: { slot: 'back', layer: 'back', ox: 0, oy: 2, scale: 1 },
  tome: { slot: 'back', layer: 'back', ox: -1, oy: 3, scale: 1 },
  vest: { slot: 'chest', layer: 'chest', ox: 0, oy: 0, scale: 1 },
  chestplate: { slot: 'chest', layer: 'chest', ox: 0, oy: 1, scale: 1 },
  crystal: { slot: 'chest', layer: 'chest', ox: 1, oy: 0, scale: 1 },
  wrap: { slot: 'legs', layer: 'legs', ox: 0, oy: 1, scale: 1 },
  greaves: { slot: 'legs', layer: 'legs', ox: 0, oy: 4, scale: 1 },
  gloves: { slot: 'hands', layer: 'hands', ox: 0, oy: 0, scale: 1 },
  horns: { slot: 'head', layer: 'head', ox: 0, oy: -2, scale: 1 },
  halo: { slot: 'head', layer: 'head', ox: 0, oy: -3, scale: 1 },
  wings: { slot: 'back', layer: 'back', ox: 0, oy: 1, scale: 1 },
  tail: { slot: 'back', layer: 'back', ox: 2, oy: 4, scale: 1 },
};

/** #280 catalog suffixes → draw kind (131 ids). More specific first. */
const GEAR_ID_KIND_RULES = [
  [/bandana|wrap_cloth|head_wrap/, 'bandana'],
  [/visor/, 'visor'],
  [/mask_fox/, 'fox'],
  [/tail_/, 'tail'],
  [/horns/, 'horns'],
  [/halo|circlet/, 'halo'],
  [/aura_glow|hood_void/, 'glow'],
  [/mask_/, 'visor'],
  [/helm|beanie|hat_|crown|hood|pumpkin/, 'helmet'],
  [/gaunt|bracer|mittens|cuffs|fists|claws|gloves|hands_wrap|wraps_monk|wraps_gold|wraps_dream/, 'gloves'],
  [/rings_/, 'charm'],
  [/greaves|boots_|sneakers/, 'greaves'],
  [/legs_wrap|socks|shorts|pants|tabi|bells/, 'wrap'],
  [/wings_|wing_/, 'wings'],
  [/cape|scarf|banner|kite|capelet/, 'cape'],
  [/backpack|pack_|shell|plate_back|banner_iron/, 'tome'],
  [/crystal_shard|void_spine/, 'crystal'],
  [/pin_|balloon|back_leaf\b|back_void\b/, 'charm'],
  [/plate_|mail_|cuirass/, 'chestplate'],
  [/vest_|shirt_|hoodie|gi_|tunic|sash|jacket|robe|coat_|poncho/, 'vest'],
];

function lookKindFromGearId(itemId, slot) {
  const id = typeof itemId === 'string' ? itemId.toLowerCase() : '';
  for (let i = 0; i < GEAR_ID_KIND_RULES.length; i++) {
    if (GEAR_ID_KIND_RULES[i][0].test(id)) return GEAR_ID_KIND_RULES[i][1];
  }
  if (slot === 'head') return /wrap/.test(id) ? 'bandana' : 'helmet';
  if (slot === 'chest') return 'vest';
  if (slot === 'hands') return 'gloves';
  if (slot === 'legs') return /wrap|sock/.test(id) ? 'wrap' : 'greaves';
  if (slot === 'back') return 'cape';
  return 'vest';
}

/** Optional registry: item id → look. Gear systems can add rows without touching draw code. */
const EQUIP_LOOK = Object.create(null);

/**
 * Per-style pieces with tuned offsets. Colors fall back to the style’s
 * bandana / accent / plate when omitted.
 */
const EQUIP_LOOK_BY_STYLE = {
  classic: [],
  leaf_band: [
    { kind: 'bandana', ox: 0, oy: -1, scale: 1.0 },
  ],
  energy_glow: [
    { kind: 'glow', scale: 1.04 },
    { kind: 'bandana', oy: -1, scale: 0.96 },
  ],
  crimson_pact: [
    { kind: 'coat', oy: 1, scale: 1.06, fill: 'rgba(224,79,79,.46)' },
    { kind: 'bandana', oy: -1, scale: 1.0 },
  ],
  shadow: [
    { kind: 'cape', oy: 2, scale: 1.02, fill: 'rgba(42,24,64,.42)' },
    { kind: 'bandana', oy: -1, scale: 1.0 },
  ],
  guvve: [
    { kind: 'bandana', oy: -1, scale: 1.0 },
    { kind: 'duck', ox: 1, oy: 1.5, scale: 1.04 },
  ],
  gold: [
    { kind: 'glow', scale: 1.08 },
    { kind: 'bandana', oy: -1, scale: 1.0 },
  ],
  sand: [
    { kind: 'vest', fill: 'rgba(201,122,32,.34)', oy: 0, scale: 1.02 },
    { kind: 'wrap', fill: 'rgba(138,96,48,.55)', scale: 1.0 },
    { kind: 'bandana', oy: -1, scale: 1.0 },
  ],
  samurai: [
    { kind: 'topknot', oy: -1, scale: 1.04 },
    { kind: 'bandana', oy: -1, scale: 0.94 },
  ],
  cyber: [
    { kind: 'visor', oy: 0, scale: 1.0 },
    { kind: 'bandana', oy: -1, scale: 0.92 },
    { kind: 'lightning', ox: 1, oy: -1 },
  ],
  fox: [
    { kind: 'fox', oy: -1, scale: 1.04 },
    { kind: 'bandana', oy: -1, scale: 0.94 },
  ],
  storm: [
    { kind: 'glow', scale: 1.06 },
    { kind: 'bandana', oy: -1, scale: 1.0 },
    { kind: 'lightning', ox: -1, oy: -1 },
  ],
  void: [
    { kind: 'coat', oy: 1, scale: 1.08, fill: 'rgba(90,16,64,.50)' },
    { kind: 'bandana', oy: -1, scale: 1.0 },
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
    { kind: 'tome', ox: -2, oy: 3, scale: 1.08 },
    { kind: 'bandana', oy: -1, scale: 0.98 },
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
  ['ox', 'oy', 'scale', 'rot', 'color', 'accent', 'plate', 'fill', 'coversHead'].forEach((k) => {
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
    coversHead: piece.coversHead === true || (!!(EQUIP_COVERS_HEAD[piece.kind]) && piece.coversHead !== false),
  };
}

function lookCoversHead(look) {
  if (!look || typeof look !== 'object') return false;
  if (look.coversHead === true) return true;
  if (look.coversHead === false) return false;
  return !!EQUIP_COVERS_HEAD[look.kind];
}

function looksHideBaseHead(looks) {
  if (!looks || !looks.length) return false;
  for (let i = 0; i < looks.length; i++) {
    const row = looks[i];
    if (!row) continue;
    if ((row.slot === 'head' || row.layer === 'head') && lookCoversHead(row)) return true;
  }
  return false;
}

/** 0–1 luma from #rgb / #rrggbb / rgb() / rgba(). Non-colors → 0.7 (assume light). */
function lookLuma(color) {
  if (typeof color !== 'string') return 0.7;
  const s = color.trim();
  let r = 200, g = 200, b = 200;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    }
  } else {
    const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(s);
    if (!rgb) return 0.7;
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function lookMixToward(color, toward, t) {
  const parse = (s, fallback) => {
    if (typeof s !== 'string') return fallback;
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
    if (!hex) return fallback;
    const h = hex[1];
    if (h.length === 3) {
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const a = parse(color, null);
  const b = parse(toward, [232, 238, 248]);
  if (!a) return null;
  const k = Math.max(0, Math.min(1, Number(t) || 0));
  const ch = (i) => Math.round(a[i] * (1 - k) + b[i] * k);
  const hex = (n) => n.toString(16).padStart(2, '0');
  return '#' + hex(ch(0)) + hex(ch(1)) + hex(ch(2));
}

/** Dark body colors vanish on the Styles grid — lighten the circle so it always reads. */
function lookHeadStroke(color) {
  if (lookLuma(color) >= 0.38) return color || '#f2f5ff';
  return lookMixToward(color, '#e8eef8', 0.64) || 'rgba(232,238,248,.92)';
}

function lookHeadRim(color) {
  return lookLuma(color) < 0.38 ? 'rgba(255,255,255,.82)' : null;
}

function lookHeadFill(color) {
  const luma = lookLuma(color);
  if (luma < 0.38) return 'rgba(255,255,255,.22)';
  if (luma > 0.82) return 'rgba(255,255,255,.10)';
  return 'rgba(255,255,255,.08)';
}

/** Preview-only: keep a dark style readable on the card without changing combat. */
function lookPreviewBody(color) {
  if (lookLuma(color) >= 0.28) return color || '#f2f5ff';
  return lookMixToward(color, '#c8d2e4', 0.42) || color || '#f2f5ff';
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

/** #280 `_gearLook` defaulted layer to `body` — never relocate a slotted item. */
const EQUIP_GENERIC_LAYERS = ['body', 'torso', 'under', 'over', 'front', 'fg', 'overlay'];

function lookPieceFromDescriptorRow(row) {
  if (!row || !row.itemId) return null;
  const slot = canonEquipSlot(row.slot) || canonEquipSlot(row.layer);
  if (!slot) return null;
  const rawLayer = row.layer != null ? String(row.layer).toLowerCase() : '';
  const layer = (rawLayer && EQUIP_GENERIC_LAYERS.includes(rawLayer)) ? slot : (row.layer || slot);
  const kind = lookKindFromGearId(row.itemId, slot);
  return hydrateEquipLook({
    id: row.itemId,
    kind,
    slot,
    layer,
    color: row.tint,
    accent: row.accent,
  });
}

function looksFromGearDescriptor(desc) {
  if (!desc || !Array.isArray(desc.slots)) return [];
  const bySlot = Object.create(null);
  for (let i = 0; i < desc.slots.length; i++) {
    const piece = lookPieceFromDescriptorRow(desc.slots[i]);
    if (!piece) continue;
    bySlot[piece.slot] = piece;
  }
  const out = [];
  for (let i = 0; i < EQUIP_LOOK_SLOTS.length; i++) {
    const piece = bySlot[EQUIP_LOOK_SLOTS[i]];
    if (piece) out.push(piece);
  }
  return out;
}

function looksFromEquippedIds(equipped) {
  if (!isPlainGear(equipped)) return [];
  const slots = [];
  for (let i = 0; i < EQUIP_LOOK_SLOTS.length; i++) {
    const slot = EQUIP_LOOK_SLOTS[i];
    const raw = equipped[slot];
    const itemId = typeof raw === 'string' ? raw : (raw && raw.id);
    if (!itemId) continue;
    let tint = null, accent = null, layer = slot;
    if (typeof gearItemById === 'function') {
      try {
        const item = gearItemById(itemId);
        if (item && item.look) {
          tint = item.look.tint;
          accent = item.look.accent;
          layer = item.look.layer || slot;
        }
      } catch (_) {}
    }
    slots.push({ slot, itemId, tint, accent, layer });
  }
  return looksFromGearDescriptor({ slots });
}

function resolveGearLooks(fighter) {
  if (fighter && fighter.gearDescriptor) {
    const fromDesc = looksFromGearDescriptor(fighter.gearDescriptor);
    if (fromDesc.length) return fromDesc;
  }
  /* Explicit look-map on the fighter (preview / #276 smoke) wins over live save.gear. */
  const direct = fighter && fighter.gear;
  if (isPlainGear(direct) && !direct.equipped && !direct.owned && direct.schema == null) {
    const fromLook = looksForGear(direct);
    if (fromLook.length) return fromLook;
  }
  /* Style / upgrade cards are ephemeral previews — do not steal the live loadout. */
  const preview = !!(fighter && fighter._preview);
  const store = (fighter && fighter.save)
    || (!preview && fighter && fighter.isPlayer && typeof save !== 'undefined' ? save : null);
  if (typeof gearRenderDescriptor === 'function' && store) {
    try {
      const fromApi = looksFromGearDescriptor(gearRenderDescriptor(store));
      if (fromApi.length) return fromApi;
    } catch (_) {}
  }
  if (store && isPlainGear(store.gear) && isPlainGear(store.gear.equipped)) {
    const fromEq = looksFromEquippedIds(store.gear.equipped);
    if (fromEq.length) return fromEq;
  }
  let gear = fighter && fighter.gear;
  if (!isPlainGear(gear) && fighter && fighter.isPlayer && store && isPlainGear(store.gear) && !store.gear.equipped) {
    gear = store.gear;
  }
  return looksForGear(gear);
}

function resolveFighterLooks(fighter) {
  if (!fighter) return [];
  let styleLooks = [];
  try { styleLooks = looksForStyle(fighter.style) || []; } catch (_) { styleLooks = []; }
  let gearLooks = [];
  try { gearLooks = resolveGearLooks(fighter) || []; } catch (_) { gearLooks = []; }
  if (!gearLooks.length) return styleLooks.slice(0, 12);
  const blocked = new Set(gearLooks.map((l) => l.slot).filter(Boolean));
  return styleLooks.filter((l) => !blocked.has(l.slot)).concat(gearLooks).slice(0, 12);
}

function looksOnLayer(looks, layer) {
  if (!looks || !looks.length) return [];
  return looks.filter((l) => l.layer === layer);
}

/** Menu-card camera: fit a scale-1 stickman so the head circle stays on-card. */
function equipLookPreviewCamera(w, h) {
  const width = Number.isFinite(w) && w > 0 ? w : 80;
  const height = Number.isFinite(h) && h > 0 ? h : 86;
  const padTop = 5;
  const padBot = Math.max(5, Math.round(height * 0.08));
  const usable = Math.max(28, height - padTop - padBot);
  const sc = usable / EQUIP_LOOK_STICK_TOP;
  return {
    width,
    height,
    tx: width * 0.5,
    ty: height - padBot,
    sc,
    padTop,
    padBot,
    headLocalY: -(78 + 12 + 5 + 9),
    headR: EQUIP_LOOK_HEAD_R,
  };
}

function applyEquipLookPreview(cc, w, h) {
  if (!cc || typeof cc.translate !== 'function') return null;
  const cam = equipLookPreviewCamera(w, h);
  const tx = typeof lookSnap === 'function' ? lookSnap(cam.tx) : Math.round(cam.tx);
  const ty = typeof lookSnap === 'function' ? lookSnap(cam.ty) : Math.round(cam.ty);
  cc.translate(tx, ty);
  cc.scale(cam.sc, cam.sc);
  return cam;
}

const EquipLookApi = {
  slots: EQUIP_LOOK_SLOTS,
  layers: EQUIP_LOOK_LAYERS,
  paint: EQUIP_LOOK_PAINT,
  resolve: resolveFighterLooks,
  forStyle: looksForStyle,
  forGear: looksForGear,
  fromDescriptor: looksFromGearDescriptor,
  kindFromId: lookKindFromGearId,
  register: registerEquipLook,
  snap: lookSnap,
  preview: applyEquipLookPreview,
  previewCamera: equipLookPreviewCamera,
  canonSlot: canonEquipSlot,
  canonLayer: canonEquipLayer,
  coversHead: lookCoversHead,
  hidesBaseHead: looksHideBaseHead,
  luma: lookLuma,
  headStroke: lookHeadStroke,
  previewBody: lookPreviewBody,
  headR: EQUIP_LOOK_HEAD_R,
  max: EQUIP_LOOK_MAX,
};

if (typeof globalThis !== 'undefined') globalThis.EquipLookApi = EquipLookApi;
