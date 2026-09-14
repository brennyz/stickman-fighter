/* ============================== GEAR UI ADAPTER ========================
 * Char-screen lane. Binds to src/data/gear.js (#280 / docs/GEAR-SYSTEM.md).
 * Do not redeclare GEAR_SLOT_IDS, gearItemById, sanitizeGearSave, gearEquipItem.
 */
const GEAR_DRAW_ORDER = ['back', 'legs', 'chest', 'head', 'hands'];
const GEAR_UI_FILTERS = ['all', 'look', 'stat', 'lock', 'owned'];

function _gearSlotIds() {
  return (typeof GEAR_SLOT_IDS !== 'undefined' && Array.isArray(GEAR_SLOT_IDS) && GEAR_SLOT_IDS.length === 5)
    ? GEAR_SLOT_IDS.slice()
    : ['head', 'chest', 'hands', 'legs', 'back'];
}

function listGearSlots() {
  const colors = { head: '#7cf5ff', chest: '#ffd75e', hands: '#5ad06a', legs: '#c47aff', back: '#ff6b9d' };
  if (typeof GEAR_SLOTS !== 'undefined' && Array.isArray(GEAR_SLOTS)) {
    for (const s of GEAR_SLOTS) {
      if (s && s.id && (s.accent || s.color)) colors[s.id] = s.accent || s.color;
    }
  }
  return _gearSlotIds().map((id) => ({ id, color: colors[id] || '#9db1e3' }));
}

function listGearItems(slotId) {
  if (typeof gearItemsForSlot === 'function') return gearItemsForSlot(slotId) || [];
  return [];
}

function getEquippedGear() {
  const out = { head: null, chest: null, hands: null, legs: null, back: null };
  for (const sid of _gearSlotIds()) {
    let id = null;
    if (typeof gearEquippedId === 'function') id = gearEquippedId(sid);
    else if (save && save.gear && save.gear.equipped) id = save.gear.equipped[sid];
    out[sid] = (typeof id === 'string' && id) ? id : null;
  }
  return out;
}

function gearOwned(item) {
  if (!item) return false;
  const id = typeof item === 'string' ? item : item.id;
  if (typeof gearItemOwned === 'function') return !!gearItemOwned(id);
  return !!(save && save.gear && save.gear.owned && save.gear.owned[id]);
}

function _gateLabel(model) {
  if (!model) return '';
  if (!model.owned) {
    return typeof tOr === 'function' ? tOr('gear.lockOwned', 'Nog niet gevonden') : 'Nog niet gevonden';
  }
  const g = model.gate;
  if (!g || g.ok) return '';
  const why = (g.reasons && g.reasons[0]) || '';
  if (why === 'level') {
    return typeof tOr === 'function' ? tOr('gear.lockLevel', 'Lv {n}', { n: model.unlockLvl }) : ('Lv ' + model.unlockLvl);
  }
  if (why === 'time') {
    return typeof tOr === 'function' ? tOr('gear.lockDays', '{n} dagen', { n: model.unlockDays }) : (model.unlockDays + ' dagen');
  }
  if (why === 'adventure') {
    return typeof tOr === 'function' ? tOr('gear.lockAdv', 'Avontuur Lv {n}', { n: g.needLvl || model.unlockLvl }) : ('Avontuur');
  }
  if (why === 'diff') {
    return typeof tOr === 'function' ? tOr('gear.lockDiff', 'Nog niet vrij') : 'Nog niet vrij';
  }
  return typeof tOr === 'function' ? tOr('gear.pillLock', 'LOCK') : 'LOCK';
}

function gearUnlockState(item) {
  if (typeof gearTooltipModel === 'function') {
    const m = gearTooltipModel(item);
    if (!m) return { unlocked: true, gate: null, label: '', model: null };
    if (!m.owned) return { unlocked: false, gate: 'owned', label: _gateLabel(m), model: m };
    if (m.gate && !m.gate.ok) {
      const why = (m.gate.reasons && m.gate.reasons[0]) || 'locked';
      return { unlocked: false, gate: why, label: _gateLabel(m), model: m };
    }
    return { unlocked: true, gate: null, label: '', model: m };
  }
  return { unlocked: true, gate: null, label: '', model: null };
}

function gearCanWear(item) {
  if (!item) return { ok: false, reason: 'missing' };
  if (typeof gearCanEquip === 'function') {
    const can = gearCanEquip(item.id);
    if (!can || !can.ok) {
      const unlock = gearUnlockState(item);
      return { ok: false, reason: (can && can.reason) || unlock.gate || 'locked', label: unlock.label };
    }
    return { ok: true };
  }
  const unlock = gearUnlockState(item);
  if (!unlock.unlocked) return { ok: false, reason: unlock.gate || 'locked', label: unlock.label };
  return { ok: true };
}

function gearItemName(item) {
  if (!item) return '';
  if (typeof gearItemLabel === 'function') return gearItemLabel(item);
  if (typeof tOr === 'function') return tOr('gear.item.' + item.id, item.name || item.id);
  return item.name || item.id;
}

function gearSlotName(slotId) {
  if (typeof gearSlotLabel === 'function') return gearSlotLabel(slotId);
  if (typeof tOr === 'function') return tOr('gear.slot.' + slotId, slotId);
  return slotId;
}

function gearHasStats(item) {
  if (typeof gearItemHasCombatStats === 'function') return gearItemHasCombatStats(item);
  return !!(item && item.hasStats && item.vanity !== true && item.mods);
}

function gearStatLine(item) {
  if (typeof gearTooltipModel === 'function') {
    const m = gearTooltipModel(item);
    if (m) {
      if (!m.appliesStats) {
        return typeof tOr === 'function' ? tOr('gear.vanityHint', 'Geen stats — alleen look') : 'Geen stats — alleen look';
      }
      if (m.combatLine) return m.combatLine;
    }
  }
  if (typeof gearCombatLine === 'function') {
    const line = gearCombatLine(item);
    if (line) return line;
  }
  return typeof tOr === 'function' ? tOr('gear.vanityHint', 'Geen stats — alleen look') : 'Geen stats — alleen look';
}

function equipGear(itemId) {
  if (typeof gearEquipItem !== 'function') return { ok: false, reason: 'missing' };
  const res = gearEquipItem(itemId);
  if (!res) return { ok: false, reason: 'missing' };
  if (!res.ok) {
    const item = (typeof gearItemById === 'function') ? gearItemById(itemId) : null;
    const unlock = gearUnlockState(item);
    return { ok: false, reason: res.reason || unlock.gate || 'locked', label: unlock.label, item };
  }
  return res;
}

function unequipGear(slotId) {
  if (typeof gearUnequipSlot === 'function') return gearUnequipSlot(slotId);
  return { ok: false, reason: 'slot' };
}

function gearEquippedCount() {
  const eq = getEquippedGear();
  return _gearSlotIds().reduce((n, sid) => n + (eq[sid] ? 1 : 0), 0);
}

function gearUiRenderDescriptor(s) {
  if (typeof gearRenderDescriptor === 'function') return gearRenderDescriptor(s);
  return { schema: 1, slots: _gearSlotIds().map((id) => ({ slot: id, itemId: null })) };
}

function gearFilterItems(items, filter, q) {
  const needle = String(q || '').trim().toLowerCase();
  const want = filter || 'all';
  return (items || []).filter((it) => {
    const unlock = gearUnlockState(it);
    const look = !gearHasStats(it);
    if (want === 'look' && !look) return false;
    if (want === 'stat' && look) return false;
    if (want === 'lock' && unlock.unlocked) return false;
    if (want === 'owned' && !gearOwned(it)) return false;
    if (needle) {
      const name = String(gearItemName(it) || '').toLowerCase();
      const id = String(it.id || '').toLowerCase();
      if (name.indexOf(needle) === -1 && id.indexOf(needle) === -1) return false;
    }
    return true;
  });
}

function migrateFlatGearIntoBag(out) {
  if (!out || typeof out !== 'object') return out;
  if (!out.gear || typeof out.gear !== 'object' || Array.isArray(out.gear)) {
    out.gear = { schema: 1, equipped: { head: null, chest: null, hands: null, legs: null, back: null }, owned: {} };
  }
  const bag = out.gear;
  if (!bag.equipped || typeof bag.equipped !== 'object') {
    bag.equipped = { head: null, chest: null, hands: null, legs: null, back: null };
  }
  if (!bag.owned || typeof bag.owned !== 'object') bag.owned = {};
  const eqSrc = (out.equipment && typeof out.equipment === 'object') ? out.equipment : {};
  const eqOld = (out.gearEquipped && typeof out.gearEquipped === 'object') ? out.gearEquipped : {};
  for (const sid of _gearSlotIds()) {
    if (bag.equipped[sid]) continue;
    const alias = sid === 'hands' ? 'arms' : (sid === 'back' ? 'aura' : null);
    const v = eqSrc[sid] || (alias && eqSrc[alias]) || eqOld[sid] || (alias && eqOld[alias]);
    if (typeof v === 'string' && v) bag.equipped[sid] = v;
  }
  const ownOld = Object.assign(
    {},
    (out.gearOwned && typeof out.gearOwned === 'object') ? out.gearOwned : {},
    (out.ownedGear && typeof out.ownedGear === 'object') ? out.ownedGear : {}
  );
  for (const [id, v] of Object.entries(ownOld)) {
    if (!id || bag.owned[id] || !v) continue;
    bag.owned[id] = (typeof v === 'object')
      ? { at: Number(v.at) || 0, src: typeof v.src === 'string' ? v.src : 'grant' }
      : { at: 0, src: 'grant' };
  }
  delete out.equipment;
  delete out.ownedGear;
  delete out.gearEquipped;
  delete out.gearOwned;
  return out;
}

if (typeof save === 'object' && save) {
  try {
    migrateFlatGearIntoBag(save);
    if (typeof sanitizeGearSave === 'function') {
      save.gear = sanitizeGearSave(save.gear, save, Date.now());
    }
    if (typeof grantStarterGear === 'function') grantStarterGear(save);
  } catch (_) {}
}
