/* ============================ EQUIP LOOK =============================== */
/**
 * Look-only attachment table for worn outfits / future 5-slot gear.
 * Does not unlock, drop, price, or invent an economy.
 *
 * Slots (stable names for the parallel gear-systems lane):
 *   head · chest · legs · back · trinket
 *
 * Layers (draw order in Fighter.draw):
 *   under → body → legs → head → over → front
 */
const EQUIP_LOOK_SLOTS = ['head', 'chest', 'legs', 'back', 'trinket'];
const EQUIP_LOOK_LAYERS = ['under', 'body', 'legs', 'head', 'over', 'front'];

const EQUIP_SLOT_ALIAS = {
  helmet: 'head', hat: 'head', bandana: 'head', visor: 'head',
  armor: 'chest', coat: 'chest', chestplate: 'chest', vest: 'chest',
  boots: 'legs', greaves: 'legs', shin: 'legs',
  cape: 'back', cloak: 'back', tome: 'back',
  accessory: 'trinket', charm: 'trinket', aura: 'trinket', ring: 'trinket',
};

const EQUIP_LOOK_DEFAULTS = {
  bandana: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  visor: { slot: 'head', layer: 'head', ox: 0, oy: 1, scale: 1 },
  fox: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  duck: { slot: 'head', layer: 'head', ox: 1, oy: 1, scale: 1 },
  topknot: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  helmet: { slot: 'head', layer: 'head', ox: 0, oy: -1, scale: 1 },
  coat: { slot: 'back', layer: 'under', ox: 0, oy: 1, scale: 1 },
  cape: { slot: 'back', layer: 'under', ox: 0, oy: 2, scale: 1 },
  vest: { slot: 'chest', layer: 'body', ox: 0, oy: 0, scale: 1 },
  chestplate: { slot: 'chest', layer: 'body', ox: 0, oy: 0, scale: 1 },
  wrap: { slot: 'legs', layer: 'legs', ox: 0, oy: 0, scale: 1 },
  greaves: { slot: 'legs', layer: 'legs', ox: 0, oy: 1, scale: 1 },
  tome: { slot: 'back', layer: 'under', ox: -1, oy: 2, scale: 1 },
  crystal: { slot: 'trinket', layer: 'front', ox: 1, oy: 0, scale: 1 },
  glow: { slot: 'trinket', layer: 'over', ox: 0, oy: 0, scale: 1 },
  lightning: { slot: 'trinket', layer: 'over', ox: 0, oy: 0, scale: 1 },
  charm: { slot: 'trinket', layer: 'front', ox: 0, oy: 2, scale: 1 },
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
  return EQUIP_SLOT_ALIAS[key] || key;
}

function lookSnap(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function hydrateEquipLook(piece, style) {
  if (!piece || !piece.kind) return null;
  const defaults = EQUIP_LOOK_DEFAULTS[piece.kind] || { slot: 'trinket', layer: 'front', ox: 0, oy: 0, scale: 1 };
  const st = style || {};
  return {
    id: piece.id || (st.id ? st.id + ':' + piece.kind : piece.kind),
    kind: piece.kind,
    slot: canonEquipSlot(piece.slot || defaults.slot),
    layer: piece.layer || defaults.layer,
    anchor: piece.anchor || defaults.anchor || null,
    ox: piece.ox != null ? piece.ox : defaults.ox,
    oy: piece.oy != null ? piece.oy : defaults.oy,
    scale: piece.scale != null ? piece.scale : defaults.scale,
    rot: piece.rot || 0,
    color: piece.color || st.bandana || st.accent || '#8fa3d9',
    accent: piece.accent || st.accent || '#7cf5ff',
    plate: piece.plate || st.plate || null,
    fill: piece.fill || null,
    styleId: st.id || piece.styleId || null,
  };
}

function looksForStyle(st) {
  if (!st) return [];
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
  if (!id || !def) return;
  EQUIP_LOOK[id] = def;
}

function lookForItemId(id, slot, src) {
  if (!id) return [];
  const registered = EQUIP_LOOK[id];
  if (registered) {
    const piece = Object.assign({}, registered, { id, slot: slot || registered.slot });
    return [hydrateEquipLook(piece, src || registered)].filter(Boolean);
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
  if (!gear || typeof gear !== 'object') return [];
  const out = [];
  const seen = new Set();
  const visit = (slotKey, val) => {
    if (val == null || val === false) return;
    const slot = canonEquipSlot(slotKey);
    if (typeof val === 'string') {
      lookForItemId(val, slot).forEach((l) => out.push(l));
      return;
    }
    if (typeof val !== 'object') return;
    if (val.look && val.look.kind) {
      out.push(hydrateEquipLook(Object.assign({ id: val.id, slot: val.slot || slot }, val.look), val));
      return;
    }
    if (val.kind) {
      out.push(hydrateEquipLook(Object.assign({ slot }, val), val));
      return;
    }
    if (val.id) lookForItemId(val.id, slot, val).forEach((l) => out.push(l));
  };
  for (const slot of EQUIP_LOOK_SLOTS) {
    if (gear[slot] != null) {
      seen.add(slot);
      visit(slot, gear[slot]);
    }
  }
  for (const key of Object.keys(gear)) {
    const slot = canonEquipSlot(key);
    if (seen.has(slot) || seen.has(key)) continue;
    if (key === 'id' || key === 'look') continue;
    visit(key, gear[key]);
  }
  return out.filter(Boolean);
}

function resolveFighterLooks(fighter) {
  if (!fighter) return [];
  const styleLooks = looksForStyle(fighter.style);
  let gear = fighter.gear;
  if (gear == null && fighter.isPlayer && typeof save !== 'undefined' && save && save.gear) {
    gear = save.gear;
  }
  const gearLooks = looksForGear(gear);
  if (!gearLooks.length) return styleLooks;
  const blocked = new Set(gearLooks.map((l) => l.slot).filter(Boolean));
  return styleLooks.filter((l) => !blocked.has(l.slot)).concat(gearLooks);
}

function looksOnLayer(looks, layer) {
  if (!looks || !looks.length) return [];
  return looks.filter((l) => l.layer === layer);
}

/** Menu-card camera: leave crown room so bandana / ears / topknot do not clip. */
function applyEquipLookPreview(cc, w, h) {
  const width = w || 80;
  const height = h || 86;
  cc.translate(width * 0.5, height * 0.87);
  cc.scale(0.78, 0.78);
}

const EquipLookApi = {
  slots: EQUIP_LOOK_SLOTS,
  layers: EQUIP_LOOK_LAYERS,
  resolve: resolveFighterLooks,
  forStyle: looksForStyle,
  forGear: looksForGear,
  register: registerEquipLook,
  snap: lookSnap,
  preview: applyEquipLookPreview,
};

if (typeof globalThis !== 'undefined') globalThis.EquipLookApi = EquipLookApi;
