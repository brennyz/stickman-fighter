/* ============================== GEAR UI ADAPTER ========================
 * Char-screen lane. Schema: docs/GEAR-SYSTEM.md (#280).
 * Save: createdAt + save.gear { schema, equipped, owned:{id:{at,src}} }.
 * Flat save.equipment / save.ownedGear migrate once then drop.
 * Do not redeclare GEAR_SLOT_IDS, gearItemById, sanitizeGearSave, gearEquipItem,
 * gearEquipState, gearCanEquip, gearSlotInventory, GEAR_EQUIP_STATES.
 */
const GEAR_DRAW_ORDER = ['back', 'legs', 'chest', 'head', 'hands', 'weapon', 'pet'];
const GEAR_SLOT_DRAW_ORDER = ['back', 'legs', 'chest', 'head', 'hands'];
const GEAR_SLOT_ICONS = {
  head: 'assets/buttons/modes/gear-head.svg',
  chest: 'assets/buttons/modes/gear-chest.svg',
  hands: 'assets/buttons/modes/gear-hands.svg',
  legs: 'assets/buttons/modes/gear-legs.svg',
  back: 'assets/buttons/modes/gear-back.svg',
};
const GEAR_UI_FILTERS = ['all', 'look', 'stat', 'lock', 'owned'];
const GEAR_RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'nightmare', 'hell'];
const GEAR_RARITY_RANK = {
  common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6, nightmare: 7, hell: 8,
};

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
    needAdvUnlocked: raw.needAdvUnlocked != null ? Math.floor(Number(raw.needAdvUnlocked) || 0) : null,
    needDiff: raw.needDiff === 'nightmare' || raw.needDiff === 'hell' ? raw.needDiff : null,
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

function _dropFlatGearKeys(st) {
  if (!st || typeof st !== 'object') return st;
  delete st.equipment;
  delete st.ownedGear;
  delete st.gearEquipped;
  delete st.gearOwned;
  return st;
}

function _ensureGearBag(st) {
  if (!st || typeof st !== 'object') return st;
  if (typeof ensureGearSave === 'function') ensureGearSave(st);
  else {
    if (!st.gear || typeof st.gear !== 'object' || Array.isArray(st.gear)) {
      st.gear = { schema: 1, equipped: _emptyEq(), owned: {} };
    }
    if (!st.gear.equipped || typeof st.gear.equipped !== 'object') st.gear.equipped = _emptyEq();
    if (!st.gear.owned || typeof st.gear.owned !== 'object') st.gear.owned = {};
    st.gear.schema = 1;
  }
  _dropFlatGearKeys(st);
  return st;
}

function getEquippedGear() {
  const out = _emptyEq();
  if (typeof save === 'object' && save) _ensureGearBag(save);
  for (const sid of _gearSlotIds()) {
    let id = null;
    if (typeof gearEquippedId === 'function') id = gearEquippedId(sid);
    if (!id && typeof save === 'object' && save && save.gear && save.gear.equipped) id = save.gear.equipped[sid];
    out[sid] = (typeof id === 'string' && id) ? id : null;
  }
  return out;
}

function gearOwned(item) {
  if (!item) return false;
  const id = typeof item === 'string' ? item : item.id;
  if (typeof gearItemOwned === 'function') return !!gearItemOwned(id);
  if (typeof save === 'object' && save) _ensureGearBag(save);
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
  if (gate === 'time' || gate === 'days') {
    if (need != null && need !== '') {
      return typeof tOr === 'function' ? tOr('gear.lockDays', '{n} dagen', { n: need }) : (need + ' dagen');
    }
    return typeof tOr === 'function' ? tOr('gear.lockTime', 'Vanaf {when}', { when: when || 'datum' }) : ('Vanaf ' + (when || 'datum'));
  }
  if (gate === 'adventure' || gate === 'adv') {
    return typeof tOr === 'function' ? tOr('gear.lockAdv', 'Avontuur Lv {n}', { n: need }) : ('Avontuur Lv ' + need);
  }
  if (gate === 'diff') {
    return typeof tOr === 'function' ? tOr('gear.lockDiff', 'Nog niet vrij') : 'Nog niet vrij';
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

function _gearWearableState(state) {
  return state === 'ok' || state === 'vanity-ok' || state === 'already-equipped';
}

function gearUnlockState(item, expectSlot) {
  if (item && item.equipState) {
    const wearable = _gearWearableState(item.equipState);
    return {
      unlocked: wearable,
      state: item.equipState,
      canEquip: !!item.canEquip,
      gate: item.equipState === 'not-owned' ? 'owned'
        : (item.equipState === 'locked' ? 'locked'
          : (item.equipState === 'wrong-slot' ? 'slot'
            : (item.equipState === 'unknown' ? 'unknown' : null))),
      label: item.lockLabel || '',
      model: null,
    };
  }
  const raw = (item && item.id && typeof gearItemById === 'function') ? (gearItemById(item.id) || item) : item;
  const it = contractGearItem(raw) || raw;
  if (!it) return { unlocked: true, gate: null, label: '', model: null, state: 'unknown' };
  if (typeof gearEquipState === 'function') {
    const slot = (expectSlot != null && expectSlot !== '') ? expectSlot : (it.slot || it.slotId || null);
    const eq = gearEquipState(it.id, slot ? { expectSlot: slot } : undefined);
    const wearable = _gearWearableState(eq.state);
    const why = (eq.gate && eq.gate.reasons && eq.gate.reasons[0]) || null;
    let gate = null;
    if (eq.state === 'not-owned') gate = 'owned';
    else if (eq.state === 'locked') gate = why || 'locked';
    else if (eq.state === 'wrong-slot') gate = 'slot';
    else if (eq.state === 'unknown') gate = 'unknown';
    const tip = typeof gearTooltipModel === 'function' ? gearTooltipModel(raw) : null;
    return {
      unlocked: wearable,
      state: eq.state,
      canEquip: !!eq.canEquip,
      gate,
      label: eq.label || '',
      model: tip || eq.gate,
      need: (eq.gate && (eq.gate.needLvl || eq.gate.needDays)) || null,
    };
  }
  if (!gearOwned(it)) {
    return { unlocked: false, gate: 'owned', label: _lockCopy('owned'), model: null, state: 'not-owned' };
  }
  if (typeof gearGateState === 'function') {
    const g = gearGateState(raw && raw.unlockLvl != null ? raw : it);
    if (g && !g.ok) {
      const why = (g.reasons && g.reasons[0]) || 'locked';
      if (why === 'level') return { unlocked: false, gate: 'level', need: g.needLvl, label: _lockCopy('level', g.needLvl), model: g, state: 'locked' };
      if (why === 'time') return { unlocked: false, gate: 'time', need: g.needDays, label: _lockCopy('days', g.needDays), model: g, state: 'locked' };
      if (why === 'adventure') return { unlocked: false, gate: 'adv', need: it.needAdvUnlocked || g.needLvl, label: _lockCopy('adv', it.needAdvUnlocked || g.needLvl), model: g, state: 'locked' };
      if (why === 'diff') return { unlocked: false, gate: 'diff', label: _lockCopy('diff'), model: g, state: 'locked' };
      return { unlocked: false, gate: why, label: _lockCopy(why, g.needLvl), model: g, state: 'locked' };
    }
    const tip = typeof gearTooltipModel === 'function' ? gearTooltipModel(raw) : null;
    return { unlocked: true, gate: null, label: '', model: tip || g, state: it.vanity ? 'vanity-ok' : 'ok' };
  }
  const lvl = (typeof save === 'object' && save) ? (save.lvl || 1) : 1;
  if ((it.unlockLvl || it.needLvl) && lvl < (it.unlockLvl || it.needLvl)) {
    const need = it.unlockLvl || it.needLvl;
    return { unlocked: false, gate: 'level', need, label: _lockCopy('level', need), state: 'locked' };
  }
  return { unlocked: true, gate: null, label: '', model: null, state: 'ok' };
}

function gearCanWear(item, expectSlot) {
  if (!item) return { ok: false, reason: 'unknown', state: 'unknown', canEquip: false };
  if (typeof gearCanEquip === 'function') {
    const can = gearCanEquip(item.id, typeof save !== 'undefined' ? save : null, Date.now(), expectSlot);
    if (!can || !can.ok) {
      const unlock = gearUnlockState(item);
      return {
        ok: false,
        state: (can && can.state) || 'locked',
        reason: (can && can.reason) || unlock.gate || 'locked',
        label: (can && can.label) || unlock.label,
        canEquip: false,
        item: can && can.item,
        slot: can && can.slot,
      };
    }
    return {
      ok: true,
      state: can.state,
      reason: can.reason || can.state,
      canEquip: !!can.canEquip,
      item: can.item,
      slot: can.slot,
    };
  }
  const unlock = gearUnlockState(item);
  if (!unlock.unlocked) return { ok: false, reason: unlock.gate || 'locked', state: 'locked', label: unlock.label, canEquip: false };
  return { ok: true, state: 'ok', canEquip: true };
}

function listGearSlotInventory(slot) {
  if (typeof gearSlotInventory === 'function') return gearSlotInventory(slot);
  return { slot: slot || null, equippedId: null, items: [] };
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

function equipGear(itemId, opts) {
  const raw = (typeof gearItemById === 'function') ? gearItemById(itemId) : null;
  const item = contractGearItem(raw) || raw;
  if (!item) return { ok: false, reason: 'missing', state: 'unknown' };
  const expectSlot = (opts && opts.expectSlot) || item.slotId || item.slot || null;
  const can = gearCanWear(item, expectSlot);
  if (!can.ok) return can;
  if (typeof gearEquipItem === 'function') {
    const res = gearEquipItem(itemId, expectSlot ? { expectSlot } : undefined);
    if (!res || !res.ok) {
      const unlock = gearUnlockState(item, expectSlot);
      return { ok: false, reason: (res && res.state) || unlock.gate || 'locked', state: (res && res.state) || unlock.state, label: (res && res.label) || unlock.label, item };
    }
    if (typeof save === 'object' && save) _dropFlatGearKeys(save);
    return { ok: true, item, state: res.state || can.state };
  }
  if (typeof save === 'object' && save) {
    _ensureGearBag(save);
    save.gear.equipped[item.slotId] = item.id;
    if (!save.gear.owned[item.id]) save.gear.owned[item.id] = { at: Date.now(), src: 'grant' };
    if (typeof persistOrToast === 'function') persistOrToast('gear');
    else if (typeof persist === 'function') persist();
  }
  return { ok: true, item };
}

function unequipGear(slotId) {
  const sid = (slotId && _gearSlotIds().indexOf(slotId) >= 0) ? slotId : null;
  if (!sid) return { ok: false, reason: 'slot' };
  if (typeof gearUnequipSlot === 'function') gearUnequipSlot(sid);
  else if (typeof save === 'object' && save) {
    _ensureGearBag(save);
    save.gear.equipped[sid] = null;
    if (typeof persistOrToast === 'function') persistOrToast('gear');
    else if (typeof persist === 'function') persist();
  }
  if (typeof save === 'object' && save) _dropFlatGearKeys(save);
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

let _gearDollRaf = 0;
let _gearDollTick = 0;

function startGearDollLive() {
  if (_gearDollRaf) return;
  const step = (now) => {
    const el = typeof document !== 'undefined' ? document.getElementById('gearScreen') : null;
    if (!el || !el.classList.contains('active')) { _gearDollRaf = 0; return; }
    _gearDollTick++;
    const skip = (typeof fxLite === 'function' && fxLite()) ? 3 : 2;
    if (_gearDollTick % skip === 0) {
      const cv = document.getElementById('gearDollCanvas');
      if (cv) drawGearHeroDoll(cv, typeof save === 'object' ? save : null, now * 0.001);
    }
    _gearDollRaf = requestAnimationFrame(step);
  };
  _gearDollRaf = requestAnimationFrame(step);
}

/** Pins / hangers / auras are look-pieces — a generic cape to the feet is an orphan overlay. */
function _gearBackOverlayKind(itemId) {
  const id = String(itemId || '').toLowerCase();
  if (!id) return 'cape';
  if (/pin_|balloon|aura_|back_leaf\b|back_void\b/.test(id)) return 'none';
  return 'cape';
}

function _paintGearOverlay(cc, slot, tint, accent) {
  if (!tint) return;
  /* Fighter preview pose (animT 0.35): hips ~-46, shoulders ~-78, head ~-96. */
  const hipY = -46, shY = -78, headCy = -96;
  cc.save();
  cc.fillStyle = tint;
  cc.strokeStyle = accent || tint;
  cc.lineWidth = 2;
  cc.lineCap = 'round';
  cc.lineJoin = 'round';
  if (slot === 'back') {
    cc.globalAlpha = 0.32;
    cc.beginPath();
    cc.moveTo(-6, shY + 4);
    cc.quadraticCurveTo(-22, hipY, -16, -8);
    cc.lineTo(16, -8);
    cc.quadraticCurveTo(22, hipY, 6, shY + 4);
    cc.closePath();
    cc.fill();
    cc.globalAlpha = 0.7;
    cc.stroke();
  } else if (slot === 'legs') {
    cc.globalAlpha = 0.8;
    cc.beginPath();
    cc.moveTo(-11, -10); cc.lineTo(-14, 2); cc.lineTo(-4, 2); cc.lineTo(-6, -10);
    cc.moveTo(6, -10); cc.lineTo(4, 2); cc.lineTo(14, 2); cc.lineTo(11, -10);
    cc.fill();
    cc.stroke();
  } else if (slot === 'chest') {
    cc.globalAlpha = 0.38;
    cc.beginPath();
    cc.moveTo(-8, shY + 2);
    cc.lineTo(8, shY + 2);
    cc.lineTo(7, hipY + 2);
    cc.lineTo(-7, hipY + 2);
    cc.closePath();
    cc.fill();
    cc.globalAlpha = 0.85;
    cc.stroke();
  } else if (slot === 'head') {
    cc.globalAlpha = 0.88;
    cc.beginPath();
    cc.arc(0, headCy, 8.6, Math.PI * 1.05, -0.05, false);
    cc.stroke();
    cc.beginPath();
    cc.moveTo(-9, headCy - 1);
    cc.lineTo(9, headCy - 1);
    cc.stroke();
  } else if (slot === 'hands') {
    cc.globalAlpha = 0.88;
    cc.beginPath();
    cc.arc(-17, shY + 20, 3.2, 0, Math.PI * 2);
    cc.arc(17, shY + 20, 3.2, 0, Math.PI * 2);
    cc.fill();
  }
  cc.restore();
}

function drawGearHeroDoll(cv, saveObj, animT) {
  if (!cv || typeof Fighter !== 'function') return;
  const cc = cv.getContext('2d');
  if (!cc) return;
  const s = saveObj || (typeof save === 'object' ? save : null);
  cc.clearRect(0, 0, cv.width, cv.height);
  cc.save();
  if (typeof startGearDollLive === 'function') startGearDollLive();
  const desc = (typeof gearRenderDescriptor === 'function' && s) ? gearRenderDescriptor(s) : gearUiRenderDescriptor(s);
  const layers = (desc && desc.slots) ? desc.slots : [];
  const layerOf = (sid) => layers.find((L) => L.slot === sid) || null;
  const tintOf = (sid) => {
    const layer = layerOf(sid);
    return layer && (layer.tint || layer.accent) ? layer : null;
  };
  const floor = cc.createRadialGradient(cv.width / 2, cv.height * 0.86, 8, cv.width / 2, cv.height * 0.86, cv.width * 0.38);
  floor.addColorStop(0, 'rgba(255,255,255,0.08)');
  floor.addColorStop(1, 'rgba(0,0,0,0)');
  cc.fillStyle = floor;
  cc.beginPath();
  cc.ellipse(cv.width / 2, cv.height * 0.88, cv.width * 0.28, 10, 0, 0, Math.PI * 2);
  cc.fill();
  const scale = Math.min(cv.width / 140, cv.height / 190) * 1.28;
  cc.translate(cv.width / 2, cv.height - 36);
  cc.scale(scale, scale);
  const st = typeof styleById === 'function' ? styleById((s && s.style) || 'classic') : { body: '#f2f5ff' };
  const wpn = (s && typeof weaponById === 'function') ? weaponById(s.weapon || 'vuist') : null;
  const preview = new Fighter({
    isPlayer: true, x: 0, y: 0, color: (st && st.body) || '#f2f5ff', style: st, scale: 1,
    weapon: wpn || undefined,
  });
  preview.animT = Number.isFinite(animT) ? animT : 0.55;
  /* Fighter.draw already paints equipped looks on live bones.
     The old slot overlays used a stale idle pose (cape-to-feet, floating dots). */
  preview.draw(cc);
  if (s && s.activePet && typeof drawMonsterArt === 'function') {
    const def = (typeof activePetDef === 'function') ? activePetDef()
      : ((typeof petDef === 'function') ? petDef(s.activePet) : null);
    const sp = def && typeof SPECIES !== 'undefined' ? SPECIES[def.speciesId] : null;
    if (sp) {
      cc.save();
      cc.translate(40, -4);
      cc.scale(0.38, 0.38);
      drawMonsterArt(cc, sp, sp.size || 22, 1.1, false, false);
      cc.restore();
    }
  }
  cc.restore();
}

function gearRaritiesInList(items) {
  const seen = {};
  const out = [];
  for (const it of items || []) {
    const r = it && it.rarity ? String(it.rarity) : '';
    if (!r || seen[r]) continue;
    seen[r] = true;
    out.push(r);
  }
  out.sort((a, b) => (GEAR_RARITY_RANK[a] || 0) - (GEAR_RARITY_RANK[b] || 0));
  return out;
}

function gearSheetRows(slot, s) {
  if (typeof gearSlotInventory !== 'function') {
    return (typeof listGearItems === 'function' ? listGearItems(slot) : []).map((it) => {
      const unlock = gearUnlockState(it, slot);
      return Object.assign({}, it, {
        equipState: unlock.state || (unlock.unlocked ? 'ok' : 'locked'),
        canEquip: unlock.unlocked,
        lockLabel: unlock.label || '',
        preview: !unlock.unlocked,
        locked: !unlock.unlocked,
      });
    });
  }
  const inv = gearSlotInventory(slot, s);
  return (inv.items || []).map((row) => {
    const contracted = contractGearItem(row.item) || row.item;
    if (!contracted) return null;
    return Object.assign({}, contracted, {
      equipState: row.state,
      canEquip: !!row.canEquip,
      lockLabel: row.label || '',
      preview: !!row.preview,
      locked: !!row.locked,
    });
  }).filter(Boolean);
}

function gearFilterInventory(rows, filter, q, rarity) {
  const list = (rows || []).map((row) => {
    if (row && row.item && row.state && !row.equipState) {
      const it = contractGearItem(row.item) || row.item;
      return Object.assign({}, it, {
        equipState: row.state,
        canEquip: !!row.canEquip,
        lockLabel: row.label || '',
        preview: !!row.preview,
        locked: !!row.locked,
      });
    }
    return row;
  });
  return gearFilterItems(list, filter, q, rarity);
}

function gearFilterItems(items, filter, q, rarity) {
  const needle = String(q || '').trim().toLowerCase();
  const want = filter || 'all';
  const rar = (rarity && rarity !== 'all') ? String(rarity) : '';
  return (items || []).filter((it) => {
    if (rar && String(it.rarity || '') !== rar) return false;
    const unlock = gearUnlockState(it);
    const look = !gearHasStats(it);
    if (want === 'look' && !look) return false;
    if (want === 'stat' && look) return false;
    if (want === 'lock' && unlock.unlocked) return false;
    if (want === 'owned' && !gearOwned(it)) return false;
    if (needle) {
      const name = String(gearItemName(it) || '').toLowerCase();
      const id = String(it.id || '').toLowerCase();
      const rr = String(it.rarity || '').toLowerCase();
      if (name.indexOf(needle) === -1 && id.indexOf(needle) === -1 && rr.indexOf(needle) === -1) return false;
    }
    return true;
  });
}

function gearSortItems(items, eq) {
  const bag = eq || {};
  return (items || []).slice().sort((a, b) => {
    const aEq = !!(a && (bag[a.slotId] === a.id || bag[a.slot] === a.id));
    const bEq = !!(b && (bag[b.slotId] === b.id || bag[b.slot] === b.id));
    if (aEq !== bEq) return aEq ? -1 : 1;
    const aOwn = gearOwned(a);
    const bOwn = gearOwned(b);
    if (aOwn !== bOwn) return aOwn ? -1 : 1;
    const ar = GEAR_RARITY_RANK[a && a.rarity] || 0;
    const br = GEAR_RARITY_RANK[b && b.rarity] || 0;
    if (ar !== br) return br - ar;
    const an = String(gearItemName(a) || a.id || '');
    const bn = String(gearItemName(b) || b.id || '');
    return an < bn ? -1 : (an > bn ? 1 : 0);
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
  _dropFlatGearKeys(out);
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
