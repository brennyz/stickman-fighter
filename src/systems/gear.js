/* ============================== GEAR UI ADAPTER ========================
 * Char-screen lane. Contract v1: docs/GEAR-CONTRACT-v1.md
 * Save bags: save.equipment + save.ownedGear. Systems #280 save.gear is a mirror.
 * Do not redeclare GEAR_SLOT_IDS, gearItemById, sanitizeGearSave, gearEquipItem.
 */
const GEAR_DRAW_ORDER = ['back', 'legs', 'chest', 'head', 'hands', 'weapon', 'pet'];
const GEAR_SLOT_DRAW_ORDER = ['back', 'legs', 'chest', 'head', 'hands'];
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

function _emptyEq() {
  return { head: null, chest: null, hands: null, legs: null, back: null };
}

function contractGearItem(raw) {
  if (!raw || typeof raw !== 'object' || !raw.id) return null;
  const slotId = raw.slotId || raw.slot || null;
  if (!slotId || _gearSlotIds().indexOf(slotId) < 0) return null;
  const mods = (raw.mods && typeof raw.mods === 'object' && !Array.isArray(raw.mods)) ? raw.mods : null;
  const hasModKeys = !!(mods && Object.keys(mods).length);
  const vanity = raw.vanity === true;
  const kind = raw.kind === 'armour' ? 'armour' : 'cosmetic';
  const isCosmetic = raw.isCosmetic != null ? !!raw.isCosmetic : (kind === 'cosmetic');
  /* Cosmetic-first often hasStats false; some cosmetics have real mods. Vanity never applies stats. */
  const hasStats = vanity ? false : (raw.hasStats === true || hasModKeys);
  return {
    id: String(raw.id).slice(0, 48),
    slotId,
    slot: slotId,
    kind,
    isCosmetic,
    hasStats: !!(hasStats && hasModKeys),
    rarity: typeof raw.rarity === 'string' ? raw.rarity : 'common',
    icon: raw.icon || null,
    needLvl: Math.floor(Number(raw.needLvl || raw.unlockLvl) || 0),
    needTrain: Math.floor(Number(raw.needTrain) || 0),
    needDex: Math.floor(Number(raw.needDex) || 0),
    needTime: typeof raw.needTime === 'string' ? raw.needTime : null,
    needDays: Math.floor(Number(raw.unlockDays || raw.needDays) || 0),
    unlockLvl: Math.max(1, Math.floor(Number(raw.unlockLvl || raw.needLvl) || 1)),
    unlockDays: Math.max(1, Math.floor(Number(raw.unlockDays || raw.needDays) || 1)),
    mods: (hasStats && hasModKeys) ? mods : null,
    draw: raw.draw || raw.look || null,
    look: raw.look || null,
    i18n: raw.i18n || ('gear.item.' + raw.id),
    name: raw.name || raw.nameEn || raw.id,
    nameEn: raw.nameEn || raw.name || raw.id,
    vanity,
    color: (raw.look && raw.look.tint) || raw.color || '#9db1e3',
  };
}

function listGearItems(slotId) {
  const want = slotId || null;
  let list = [];
  if (typeof gearItemsForSlot === 'function') list = gearItemsForSlot(want) || [];
  else if (typeof GEAR_ITEMS !== 'undefined' && Array.isArray(GEAR_ITEMS)) {
    list = GEAR_ITEMS.filter((it) => !want || it.slot === want || it.slotId === want);
  }
  return list.map(contractGearItem).filter(Boolean);
}

function _syncContractBags(st) {
  if (!st || typeof st !== 'object') return st;
  if (!st.equipment || typeof st.equipment !== 'object') st.equipment = _emptyEq();
  if (!st.ownedGear || typeof st.ownedGear !== 'object') st.ownedGear = {};
  if (!st.gear || typeof st.gear !== 'object') {
    st.gear = { schema: 1, equipped: _emptyEq(), owned: {} };
  }
  if (!st.gear.equipped || typeof st.gear.equipped !== 'object') st.gear.equipped = _emptyEq();
  if (!st.gear.owned || typeof st.gear.owned !== 'object') st.gear.owned = {};
  for (const sid of _gearSlotIds()) {
    const fromEq = st.equipment[sid];
    const fromBag = st.gear.equipped[sid];
    const id = (typeof fromEq === 'string' && fromEq) ? fromEq
      : ((typeof fromBag === 'string' && fromBag) ? fromBag : null);
    st.equipment[sid] = id;
    st.gear.equipped[sid] = id;
  }
  const owned = Object.assign({}, st.gear.owned || {}, st.ownedGear || {});
  st.ownedGear = {};
  st.gear.owned = st.gear.owned || {};
  for (const [id, v] of Object.entries(owned)) {
    if (!id || !v) continue;
    const at = (typeof v === 'object' && Number(v.at)) ? Number(v.at) : (typeof v === 'number' ? v : 1);
    const src = (typeof v === 'object' && typeof v.src === 'string') ? v.src : 'grant';
    st.ownedGear[id] = { at: at || 1 };
    if (!st.gear.owned[id]) st.gear.owned[id] = { at: at || 1, src };
  }
  return st;
}

function getEquippedGear() {
  const out = _emptyEq();
  if (typeof save === 'object' && save) _syncContractBags(save);
  for (const sid of _gearSlotIds()) {
    let id = null;
    if (typeof save === 'object' && save && save.equipment) id = save.equipment[sid];
    if (!id && typeof gearEquippedId === 'function') id = gearEquippedId(sid);
    if (!id && save && save.gear && save.gear.equipped) id = save.gear.equipped[sid];
    out[sid] = (typeof id === 'string' && id) ? id : null;
  }
  return out;
}

function gearOwned(item) {
  if (!item) return false;
  const id = typeof item === 'string' ? item : item.id;
  if (typeof save === 'object' && save) {
    _syncContractBags(save);
    if (save.ownedGear && save.ownedGear[id]) return true;
  }
  if (typeof gearItemOwned === 'function') return !!gearItemOwned(id);
  return !!(save && save.gear && save.gear.owned && save.gear.owned[id]);
}

function _lockCopy(gate, need, when) {
  if (gate === 'owned') {
    return typeof tOr === 'function' ? tOr('gear.lockOwned', 'Nog niet gevonden') : 'Nog niet gevonden';
  }
  if (gate === 'level') {
    return typeof tOr === 'function' ? tOr('gear.lockLevel', 'Lv {n}', { n: need }) : ('Lv ' + need);
  }
  if (gate === 'train') {
    return typeof tOr === 'function' ? tOr('gear.lockTrain', '{n}× training', { n: need }) : (need + '× training');
  }
  if (gate === 'dex') {
    return typeof tOr === 'function' ? tOr('gear.lockDex', '{n} monsters', { n: need }) : (need + ' monsters');
  }
  if (gate === 'time') {
    return typeof tOr === 'function' ? tOr('gear.lockTime', 'Vanaf {when}', { when: when || 'datum' }) : ('Vanaf ' + (when || 'datum'));
  }
  return typeof tOr === 'function' ? tOr('gear.pillLock', 'LOCK') : 'LOCK';
}

function _dexN() {
  try {
    if (typeof dexCount === 'function') return dexCount();
  } catch (_) {}
  if (typeof save === 'object' && save && save.dex && typeof save.dex === 'object') {
    return Object.keys(save.dex).length;
  }
  return 0;
}

function gearUnlockState(item) {
  const it = contractGearItem(item) || item;
  if (!it) return { unlocked: true, gate: null, label: '', model: null };
  if (!gearOwned(it)) {
    return { unlocked: false, gate: 'owned', label: _lockCopy('owned'), model: null };
  }
  const lvl = (typeof save === 'object' && save) ? (save.lvl || 1) : 1;
  const trains = (typeof save === 'object' && save) ? (save.trainWins || 0) : 0;
  if (it.needLvl && lvl < it.needLvl) {
    return { unlocked: false, gate: 'level', need: it.needLvl, label: _lockCopy('level', it.needLvl) };
  }
  if (it.needTrain && trains < it.needTrain) {
    return { unlocked: false, gate: 'train', need: it.needTrain, label: _lockCopy('train', it.needTrain) };
  }
  if (it.needDex && _dexN() < it.needDex) {
    return { unlocked: false, gate: 'dex', need: it.needDex, label: _lockCopy('dex', it.needDex) };
  }
  if (it.needTime) {
    const at = Date.parse(it.needTime);
    if (Number.isFinite(at) && Date.now() < at) {
      let when = it.needTime;
      try { when = new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch (_) {}
      return { unlocked: false, gate: 'time', label: _lockCopy('time', null, when) };
    }
  }
  if (it.needDays && typeof gearAccountAgeDays === 'function') {
    const have = gearAccountAgeDays(typeof save === 'object' ? save : null);
    if (have < it.needDays) {
      return { unlocked: false, gate: 'time', need: it.needDays, label: _lockCopy('time', null, String(it.needDays)) };
    }
  }
  if (typeof gearTooltipModel === 'function') {
    const raw = (item && item.unlockLvl != null) ? item : it;
    const m = gearTooltipModel(raw);
    if (m && m.gate && !m.gate.ok) {
      const why = (m.gate.reasons && m.gate.reasons[0]) || 'locked';
      if (why === 'level') return { unlocked: false, gate: 'level', label: _lockCopy('level', m.unlockLvl || it.needLvl), model: m };
      if (why === 'time') {
        const when = m.unlockDays != null ? String(m.unlockDays) : (it.needTime || 'datum');
        return { unlocked: false, gate: 'time', label: _lockCopy('time', null, when), model: m };
      }
      return { unlocked: false, gate: why, label: _lockCopy(why, m.unlockLvl || it.needLvl), model: m };
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
  const it = contractGearItem(item) || item;
  if (!it) return false;
  if (it.vanity === true) return false;
  if (typeof gearItemHasCombatStats === 'function' && (item && item.mods)) {
    return !!gearItemHasCombatStats(item);
  }
  return !!(it.hasStats && it.mods);
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
  const raw = (typeof gearItemById === 'function') ? gearItemById(itemId) : null;
  const item = contractGearItem(raw) || raw;
  if (!item) return { ok: false, reason: 'missing' };
  const can = gearCanWear(item);
  if (!can.ok) return can;
  if (typeof gearEquipItem === 'function') {
    const res = gearEquipItem(itemId);
    if (!res || !res.ok) {
      const unlock = gearUnlockState(item);
      return { ok: false, reason: (res && res.reason) || unlock.gate || 'locked', label: unlock.label, item };
    }
  }
  if (typeof save === 'object' && save) {
    _syncContractBags(save);
    save.equipment[item.slotId] = item.id;
    if (!save.ownedGear[item.id]) save.ownedGear[item.id] = { at: Date.now() };
    if (save.gear && save.gear.equipped) save.gear.equipped[item.slotId] = item.id;
    if (typeof persistOrToast === 'function') persistOrToast('gear');
    else if (typeof persist === 'function') persist();
  }
  return { ok: true, item };
}

function unequipGear(slotId) {
  const sid = (slotId && _gearSlotIds().indexOf(slotId) >= 0) ? slotId : null;
  if (!sid) return { ok: false, reason: 'slot' };
  if (typeof gearUnequipSlot === 'function') gearUnequipSlot(sid);
  if (typeof save === 'object' && save) {
    _syncContractBags(save);
    save.equipment[sid] = null;
    if (save.gear && save.gear.equipped) save.gear.equipped[sid] = null;
    if (typeof persistOrToast === 'function') persistOrToast('gear');
    else if (typeof persist === 'function') persist();
  }
  return { ok: true };
}

function gearEquippedCount() {
  const eq = getEquippedGear();
  return _gearSlotIds().reduce((n, sid) => n + (eq[sid] ? 1 : 0), 0);
}

function gearUiRenderDescriptor(s) {
  if (typeof gearRenderDescriptor === 'function') return gearRenderDescriptor(s);
  return { schema: 1, slots: _gearSlotIds().map((id) => ({ slot: id, itemId: null })) };
}

function drawGearHeroDoll(cv, saveObj) {
  if (!cv || typeof Fighter !== 'function') return;
  const cc = cv.getContext('2d');
  if (!cc) return;
  const s = saveObj || (typeof save === 'object' ? save : null);
  cc.clearRect(0, 0, cv.width, cv.height);
  cc.save();
  const desc = (typeof gearRenderDescriptor === 'function' && s) ? gearRenderDescriptor(s) : gearUiRenderDescriptor(s);
  const layers = (desc && desc.slots) ? desc.slots : [];
  for (const sid of GEAR_SLOT_DRAW_ORDER) {
    const layer = layers.find((L) => L.slot === sid);
    const tint = layer && (layer.tint || layer.accent);
    if (!tint) continue;
    const g = cc.createRadialGradient(cv.width / 2, cv.height * 0.55, 6, cv.width / 2, cv.height * 0.55, sid === 'back' ? 78 : 52);
    g.addColorStop(0, String(tint) + (sid === 'back' ? '66' : '33'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cc.fillStyle = g;
    cc.fillRect(0, 0, cv.width, cv.height);
  }
  cc.translate(cv.width / 2, cv.height - 18);
  cc.scale(1.15, 1.15);
  const st = typeof styleById === 'function' ? styleById((s && s.style) || 'classic') : { body: '#f2f5ff' };
  const wpn = (s && typeof weaponById === 'function') ? weaponById(s.weapon || 'vuist') : null;
  const preview = new Fighter({
    isPlayer: true, x: 0, y: 0, color: (st && st.body) || '#f2f5ff', style: st, scale: 1,
    weapon: wpn || undefined,
  });
  preview.animT = 0.35;
  preview.draw(cc);
  if (s && s.activePet && typeof drawMonsterArt === 'function') {
    const def = (typeof activePetDef === 'function') ? activePetDef()
      : ((typeof petDef === 'function') ? petDef(s.activePet) : null);
    const sp = def && typeof SPECIES !== 'undefined' ? SPECIES[def.speciesId] : null;
    if (sp) {
      cc.save();
      cc.translate(36, -6);
      cc.scale(0.36, 0.36);
      drawMonsterArt(cc, sp, sp.size || 22, 1.1, false, false);
      cc.restore();
    }
  }
  cc.restore();
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
  delete out.gearEquipped;
  delete out.gearOwned;
  _syncContractBags(out);
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
