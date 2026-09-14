/* ======================== GEAR WORLD DROPS + PIXELS ======================== */
/**
 * Adventure spawners + 16×16 pixels on top of PR #280 catalog (`src/data/gear.js`).
 * Rolls respect unlockLvl + unlockDays (+ needAdv / needDiff). Grant is can-own-locked.
 */
const GEAR_MAX_FIELD = 3;

const GEAR_PIXEL_PALETTE = {
  k: '#1a2030', i: '#e8f0ff', d: '#9db1e3', g: '#ffd75e', o: '#c97a20',
  c: '#7cf5ff', p: '#ffb0b8', n: '#4ecf6a', r: '#ff6b6b', u: '#c792ff',
  w: '#f2f5ff', b: '#6b5344', m: '#333c55', v: '#2a1840', a: '#2d6b36',
  s: '#8fa3d9', f: '#ffe259',
};

/** 16×16 templates. A/B/C = per-item tint. */
const GEAR_PIXEL_TEMPLATES = {
  wrap: [
    '................', '................', '................', '...kkkkkkkkkk...',
    '..kiiiiAAiiiik.', '..kAAAABBBBAAAk.', '..kiiiiAAiiiik.', '...kkkkkkkkkk...',
    '..........kk....', '.........kBBk...', '..........kk....', '................',
    '................', '................', '................', '................',
  ],
  helm: [
    '................', '.....kCCCCk.....', '....kCkkkCk.....', '...kkkkkkkkkk...',
    '..kmmAAAAAAmmk..', '.kmmAAAAAAAAAmmk.', '.kmAAAAAAAAAAmk.', '.kmABkkkkkBAmk.',
    '.kmAkk....kAmk.', '..kmk......kmk..', '...kk......kk...', '................',
    '................', '................', '................', '................',
  ],
  hat: [
    '................', '......kAAk......', '.....kAAAAk.....', '....kAAAAAAk....',
    '...kAABBBBAAk...', '..kkAAAAAAAAAAkk.', 'kkkkkkkkkkkkkkkk', '..kBBBBBBBBBBk..',
    '...kkkkkkkkkk...', '................', '................', '................',
    '................', '................', '................', '................',
  ],
  visor: [
    '................', '...kkkkkkkkkk...', '..kAAAAAAAAAAk..', '.kACCCCCCCcccAk.',
    '.kAC......ccAk.', '..kAAAAAAAAAAk..', '...kkkkkkkkkk...', '....k......k....',
    '................', '................', '................', '................',
    '................', '................', '................', '................',
  ],
  hood: [
    '................', '.....kAAAAk.....', '....kABBBAAk....', '...kABBBBBAAk...',
    '..kABBkkkBBAk...', '.kABBk...kBBAk..', '.kABBk...kBBAk..', '.kAAAAk.kAAAAk..',
    '..kAAAk.kAAAk...', '...kkk...kkk....', '................', '................',
    '................', '................', '................', '................',
  ],
  shirt: [
    '................', '....kkkkkkkk....', '...kwwwwwwwwk...', '..kwwAAAAAAwwk..',
    '..kwwwwwwwwwwk..', '.kwwAAAAAAAAwwk.', '.kwwwwkkwwwwwwk.', '.kwwwwkkwwwwwwk.',
    '.kwwwwwwwwwwwwk.', '..kwwwwwwwwwwk..', '..kwwk....kwwk..', '..kwwk....kwwk..',
    '...kk......kk...', '................', '................', '................',
  ],
  vest: [
    '................', '....kkkkkkkk....', '...kmAAAAAAmk...', '..kmAiiiiAAmk...',
    '..kmAAAAAAAmk...', '.kmAiiiiiiiAAmk.', '.kmAAABBBBAAAmk.', '.kmAiiiiiiiAAmk.',
    '.kmAAAAAAAAAAmk.', '..kmAiiiiAAmk...', '..kmAAAAAAAmk...', '...kmmkkmmk.....',
    '....kk..kk......', '................', '................', '................',
  ],
  coat: [
    '................', '.....kAAAAk.....', '....kABBBAAk....', '...kABBBBBAAk...',
    '..kABBBBBBBAAk..', '.kABBBBBBBBBAAk.', '.kABBBBkBBBBAk..', 'kABBBBk.kBBBBA.',
    'kABBBk...kBBBA.', '.kABBk....kBAk..', '..kAk......kAk..', '...k........k...',
    '................', '................', '................', '................',
  ],
  plate: [
    '................', '....kkkkkkkk....', '...kAAAAAAAAAk..', '..kAACCCCCCAAk.',
    '..kAABBBBBBAAk.', '.kAACCCCCCCCAAk.', '.kAABAAAAAABAk.', '.kAACCCCCCCCAAk.',
    '.kAABBBBBBBBAAk.', '..kAACCCCCAAk...', '..kAAAAAAAAAk...', '...kAAkkAAk.....',
    '....kk..kk......', '................', '................', '................',
  ],
  gloves: [
    '................', '................', '......kkkk......', '.....kAAAAk.....',
    '....kAAAAAAAk...', '...kAAwwwwAAk...', '...kAwBBBwwAk...', '...kAwBBBwwAk...',
    '...kAAwwwwAAk...', '....kAAAAAAAk...', '.....kkkkkk.....', '......k..k......',
    '................', '................', '................', '................',
  ],
  bracer: [
    '................', '....C......C....', '...kCk....kCk...', '...kCk....kCk...',
    '..kkkkkkkkkkkk..', '.kAAAABBBBAAAAk.', '.kABBBBBBBBBBAk.', '.kAAAABBBBAAAAk.',
    '..kkkkkkkkkkkk..', '...kiiiiiiiik...', '...kiiiiiiiik...', '....kkkkkkkk....',
    '................', '................', '................', '................',
  ],
  gauntlet: [
    '................', '................', '.....kkkkkk.....', '....kAAAAAAk....',
    '...kABBBBBBak...', '...kABCCCBAAk...', '...kABBBBBBak...', '...kAAAAAAAAk...',
    '....kAAAAAAk....', '.....kkkkkk.....', '......k..k......', '................',
    '................', '................', '................', '................',
  ],
  boots: [
    '................', '................', '................', '................',
    '..kkkk....kkkk..', '.kAAAAk..kAAAAk.', '.kABBBk..kABBBk.', '.kAAAAk..kAAAAk.',
    '..kkkk....kkkk..', '.kB..Bk..kB..Bk.', '.kBBBB....BBBB.', '................',
    '................', '................', '................', '................',
  ],
  socks: [
    '................', '................', '................', '................',
    '................', '..kAAk....kAAk..', '.kABBAk..kABBAk.', '.kAAAAk..kAAAAk.',
    '.kCCCCk..kCCCCk.', '.kAAAAk..kAAAAk.', '..kkkk....kkkk..', '................',
    '................', '................', '................', '................',
  ],
  greaves: [
    '................', '................', '................', '..kkkk....kkkk..',
    '.kAAAAk..kAAAAk.', '.kABBBk..kABBBk.', '.kACCCk..kACCCk.', '.kABBBk..kABBBk.',
    '.kAAAAk..kAAAAk.', '..kkkk....kkkk..', '..k..k....k..k..', '..kkkk....kkkk..',
    '................', '................', '................', '................',
  ],
  pin: [
    '................', '................', '.......kk.......', '......kAAk......',
    '.....kABBAk.....', '....kABCCBAk....', '.....kABBAk.....', '......kAAk......',
    '.......kk.......', '.......kk.......', '.......kk.......', '................',
    '................', '................', '................', '................',
  ],
  leaf: [
    '................', '........kC......', '......kAAAk.....', '.....kAABBAAk...',
    '....kAABBBAAk...', '...kAAABBAAAk...', '..kAAAABAAAk....', '..kAAAAAAAk.....',
    '...kAAAAAk......', '....kAAAk.......', '.....kAk........', '......k.........',
    '................', '................', '................', '................',
  ],
  aura: [
    '................', '....kCCCCCCk....', '...kC......Ck...', '..kC.kAAAAk.Ck..',
    '.kC.kABBBAAk.Ck.', '.kC.kAAAAAAk.Ck.', '..kC.kAAAAk.Ck..', '...kC......Ck...',
    '....kCCCCCCk....', '................', '................', '................',
    '................', '................', '................', '................',
  ],
  cape: [
    '................', '......kkkk......', '.....kAAAAk.....', '....kABBBAAk....',
    '...kABBBBBAAk...', '..kABBBBBBBAAk..', '..kAAAAABAAAk...', '.kAAAAAkAAAAk...',
    '.kAAAAk.kAAAk...', '.kAAAk...kAAk...', '..kAk.....kAk...', '...k.......k....',
    '................', '................', '................', '................',
  ],
  voidx: [
    '................', '....kkkkkkkk....', '...kvvvvvvvvk...', '..kvvCCCCCCvvk..',
    '..kvvAAAAAAvvk..', '.kvvACCCCCAAvvk.', '.kvvAAvvvvAAvvk.', '.kvvACCCCCAAvvk.',
    '.kvvAAAAAAAAvvk.', '..kvvCCCCCCvvk..', '..kvvvvvvvvvk...', '...kvvkkvvvk....',
    '....kk..kk......', '................', '................', '................',
  ],
  wings: [
    '................', 'kAAk........kAAk', 'kABAk......kABAk', 'kABBAk....kABBAk',
    '.kABBAk..kABBAk.', '..kAAAAkkAAAAk..', '...kAAAAAAAAAk...', '....kAAAAAAk....',
    '.....kkkkkk.....', '................', '................', '................',
    '................', '................', '................', '................',
  ],
  rings: [
    '................', '................', '..kkk......kkk..', '.kCCCk....kCCCk.',
    '.kC.Ck....kC.Ck.', '.kCCCk....kCCCk.', '..kkk......kkk..', '...kAAA..AAAk...',
    '....kAAAAAAk....', '.....kkkkkk.....', '................', '................',
    '................', '................', '................', '................',
  ],
  claws: [
    '................', 'C..C........C..C', 'kC.Ck......kC.Ck', '.kCCk......kCCk.',
    '..kAAAAkkAAAAk..', '...kAAAAAAAAk...', '....kAAAAAAk....', '.....kkkkkk.....',
    '................', '................', '................', '................',
    '................', '................', '................', '................',
  ],
  tome: [
    '................', '................', '...kkkkkkkkkk...', '..kAAAAAAAAAAk..',
    '..kABBBBBBBBAk..', '..kABwwwwwwBAk..', '..kABBBBBBBBAk..', '..kAAAAAAAAAAk..',
    '...kkkkkkkkkk...', '....k......k....', '................', '................',
    '................', '................', '................', '................',
  ],
  horns: [
    '................', 'C..........C....', 'kCk........kCk..', '.kAk......kAk...',
    '..kAAAkkAAAAk...', '...kAAAAAAAAk...', '....kABkkBAk....', '.....kAAAAk.....',
    '......kkkkk.....', '................', '................', '................',
    '................', '................', '................', '................',
  ],
  shell: [
    '................', '.....kAAAAk.....', '....kABBBBAk....', '...kABCCCCBAk...',
    '..kABCCCCCCBAk..', '.kABCCCCCCCCBAk.', '.kAABBBBBBBBAk..', '..kAAAAAAAAAk...',
    '...kkkkkkkkkk...', '................', '................', '................',
    '................', '................', '................', '................',
  ],
};

const GEAR_TINTS = {
  cloth: { A: '#e8f0ff', B: '#ffd75e', C: '#c97a20' },
  tin: { A: '#9db1e3', B: '#333c55', C: '#e8f0ff' },
  paper: { A: '#f2f5ff', B: '#c97a20', C: '#ffd75e' },
  neon: { A: '#1a2030', B: '#4ecf6a', C: '#7cf5ff' },
  iron: { A: '#9db1e3', B: '#ffd75e', C: '#7cf5ff' },
  leaf: { A: '#4ecf6a', B: '#2d6b36', C: '#ffe259' },
  night: { A: '#2a1840', B: '#c792ff', C: '#7cf5ff' },
  gold: { A: '#ffd75e', B: '#c97a20', C: '#ffe259' },
  void: { A: '#2a1840', B: '#c792ff', C: '#7cf5ff' },
  red: { A: '#e04f4f', B: '#1a1424', C: '#ffd75e' },
  sand: { A: '#e8c98a', B: '#8a6030', C: '#c97a20' },
  fox: { A: '#ff8c42', B: '#d05a1e', C: '#ffe259' },
  lucky: { A: '#4ecf6a', B: '#ffd75e', C: '#c97a20' },
  sparkle: { A: '#c792ff', B: '#ffb0b8', C: '#7cf5ff' },
  focus: { A: '#7cf5ff', B: '#3db8ff', C: '#ffd75e' },
  lava: { A: '#ff6a3d', B: '#5a1010', C: '#ffd75e' },
  sprint: { A: '#7cf5ff', B: '#4ecf6a', C: '#e8f0ff' },
  shadow: { A: '#2a1840', B: '#c792ff', C: '#8fa3d9' },
  glow: { A: '#7cf5ff', B: '#e8f0ff', C: '#ffd75e' },
  tome: { A: '#c98850', B: '#6b5344', C: '#f5efe6' },
};

function gearPixelKey(item) {
  if (!item) return 'pin';
  if (item.pixel && GEAR_PIXEL_TEMPLATES[item.pixel]) return item.pixel;
  const slot = item.slot;
  const s = String(item.id || '').slice((slot ? slot.length + 1 : 0));
  const hit = (re) => re.test(s);
  if (hit(/^wrap/) && slot === 'head') return 'wrap';
  if (hit(/^wrap/) && slot === 'hands') return 'gloves';
  if (hit(/^wrap/) && slot === 'legs') return 'boots';
  if (hit(/^bandana|^beanie/)) return 'wrap';
  if (hit(/^hat_|^crown/)) return 'hat';
  if (hit(/^mask/)) return 'visor';
  if (hit(/^horns/)) return 'horns';
  if (hit(/^hood/)) return 'hood';
  if (hit(/^helm/)) return 'helm';
  if (hit(/^halo/)) return 'aura';
  if (hit(/^visor/)) return 'visor';
  if (hit(/^circlet/)) return 'pin';
  if (hit(/^shirt|^gi|^tunic/)) return 'shirt';
  if (hit(/^hoodie|^coat|^jacket|^poncho|^robe/)) return 'coat';
  if (hit(/^mail|^cuirass|^plate/)) return 'plate';
  if (hit(/^vest_padded/)) return 'vest';
  if (hit(/^vest/)) return 'vest';
  if (hit(/^capelet|^sash/)) return 'cape';
  if (hit(/^mitten|^glove/)) return 'gloves';
  if (hit(/^ring/)) return 'rings';
  if (hit(/^claw/)) return 'claws';
  if (hit(/^cuff|^bracer/)) return 'bracer';
  if (hit(/^gaunt|^fist/)) return 'gauntlet';
  if (hit(/^sock|^tabi|^short/)) return 'socks';
  if (hit(/^pant|^greave/)) return 'greaves';
  if (hit(/^boot|^sneaker/)) return 'boots';
  if (hit(/^bell|^pin|^balloon/)) return 'pin';
  if (hit(/^backpack|^pack_|^tome/)) return 'tome';
  if (hit(/^scarf|^cape|^banner/)) return 'cape';
  if (hit(/^tail|^leaf/)) return 'leaf';
  if (hit(/^kite|^wing/)) return 'wings';
  if (hit(/^aura/)) return 'aura';
  if (hit(/^void/)) return 'voidx';
  if (hit(/^shell/)) return 'shell';
  if (hit(/^crystal/)) return 'pin';
  if (slot === 'head') return 'helm';
  if (slot === 'chest') return 'shirt';
  if (slot === 'hands') return 'gloves';
  if (slot === 'legs') return 'boots';
  return 'pin';
}

function gearTintKey(item) {
  if (!item) return 'cloth';
  if (item.worldTint && GEAR_TINTS[item.worldTint]) return item.worldTint;
  const s = String(item.id || '');
  if (/hell|ash|sulfur|lava/.test(s)) return 'lava';
  if (/nightmare|dream/.test(s)) return 'night';
  if (/void/.test(s)) return 'void';
  if (/crystal/.test(s)) return 'glow';
  if (/gold|lucky/.test(s)) return 'gold';
  if (/leaf|turtle/.test(s)) return 'leaf';
  if (/fox/.test(s)) return 'fox';
  if (/red|crimson/.test(s)) return 'red';
  if (/neon|glow|aura/.test(s)) return 'neon';
  if (/paper|cardboard/.test(s)) return 'paper';
  if (/iron|steel|knight|mail/.test(s)) return 'iron';
  if (/tin|bronze|copper/.test(s)) return 'tin';
  if (/sparkle|opera|star/.test(s)) return 'sparkle';
  if (/focus|circlet|halo/.test(s)) return 'focus';
  if (/sprint|dash|sneaker/.test(s)) return 'sprint';
  if (/shadow/.test(s)) return 'shadow';
  if (/pumpkin|chef|wool|sand/.test(s)) return 'sand';
  const map = {
    common: 'cloth', uncommon: 'tin', rare: 'iron', epic: 'gold',
    legendary: 'glow', mythic: 'void', nightmare: 'night', hell: 'lava',
  };
  return map[item.rarity] || 'cloth';
}

if (typeof GEAR_ITEMS !== 'undefined') {
  for (const it of GEAR_ITEMS) {
    it.pixel = gearPixelKey(it);
    it.worldTint = gearTintKey(it);
  }
}

function gearById(id) {
  return typeof gearItemById === 'function' ? gearItemById(id) : null;
}

function canonGearId(id) {
  return typeof gearCanonItemId === 'function' ? gearCanonItemId(id) : (id || '');
}

function gearOwned(id) {
  return typeof gearItemOwned === 'function' ? !!gearItemOwned(id) : false;
}

function gearGateOpen(it, opts) {
  const item = typeof it === 'string' ? gearById(it) : it;
  if (!item || typeof gearItemLootable !== 'function') return false;
  opts = opts || {};
  const base = (typeof save !== 'undefined' && save) ? save : {};
  const st = {
    lvl: opts.lvl != null ? opts.lvl : base.lvl,
    unlocked: opts.unlocked != null ? opts.unlocked : base.unlocked,
    createdAt: base.createdAt,
    advCleared: Object.assign({}, base.advCleared || {}),
    gear: base.gear,
  };
  if (opts.days != null) {
    const have = Math.max(1, Math.floor(Number(opts.days) || 1));
    st.createdAt = Date.now() - (have - 1) * 86400000;
  }
  if (opts.zone === 'nightmare') st.advCleared.normal = true;
  if (opts.zone === 'hell') {
    st.advCleared.normal = true;
    st.advCleared.nightmare = true;
  }
  return gearItemLootable(item, st, opts.now);
}

function gearDropPool(opts) {
  opts = opts || {};
  const base = opts.save || ((typeof save !== 'undefined') ? save : null);
  const st = base ? {
    lvl: opts.lvl != null ? opts.lvl : base.lvl,
    unlocked: opts.unlocked != null ? opts.unlocked : base.unlocked,
    createdAt: base.createdAt,
    advCleared: Object.assign({}, base.advCleared || {}),
    gear: base.gear,
  } : { lvl: opts.lvl || 1, unlocked: 1, createdAt: Date.now(), advCleared: {}, gear: { owned: {} } };
  if (opts.days != null) {
    const have = Math.max(1, Math.floor(Number(opts.days) || 1));
    st.createdAt = Date.now() - (have - 1) * 86400000;
  }
  return (typeof rollGearDrop === 'function')
    ? (function () {
      const list = [];
      const fakeCtx = { save: st, now: opts.now, allowLocked: !!opts.allowLocked, allowOwned: !!opts.allowOwned };
      /* reuse eligibility without picking */
      if (typeof GEAR_ITEMS === 'undefined') return list;
      for (const item of GEAR_ITEMS) {
        if (!item.droppable && !opts.allowStarter) continue;
        if (item.starter && !opts.allowStarter) continue;
        if (!opts.allowOwned && typeof gearItemOwned === 'function' && gearItemOwned(item.id, st)) continue;
        if (!opts.allowLocked) {
          const zone = opts.zone === 'nightmare' || opts.zone === 'hell' ? opts.zone : null;
          const lootFn = typeof gearItemLootableForDrop === 'function' ? gearItemLootableForDrop : null;
          if (lootFn) {
            if (!lootFn(item, st, opts.now, zone)) continue;
          } else if (typeof gearItemLootable === 'function' && !gearItemLootable(item, st, opts.now)) {
            continue;
          }
        }
        list.push(item);
      }
      return list;
    }())
    : [];
}

function sanitizeGearOwned(raw) {
  if (typeof sanitizeGearSave === 'function') {
    return sanitizeGearSave({ owned: raw }, null).owned;
  }
  return {};
}

function mergeLegacyGearOwned(out) {
  if (!out || typeof out !== 'object') return out;
  if (!out.gear || typeof out.gear !== 'object') out.gear = { schema: 1, equipped: {}, owned: {} };
  if (!out.gear.owned || typeof out.gear.owned !== 'object') out.gear.owned = {};
  const extras = [out.ownedGear, out.gearOwned];
  for (const extra of extras) {
    if (!extra || typeof extra !== 'object') continue;
    for (const [k, v] of Object.entries(extra)) {
      if (!v) continue;
      const id = canonGearId((v && v.gearId) || k);
      if (!id || out.gear.owned[id]) continue;
      if (typeof GEAR_BY_ID !== 'undefined' && !GEAR_BY_ID[id]) continue;
      const at = (v && typeof v === 'object' && v.at) ? v.at : Date.now();
      out.gear.owned[id] = { at: Math.floor(Number(at) || Date.now()), src: 'drop' };
    }
  }
  const now = Date.now();
  if (typeof sanitizeGearSave === 'function') out.gear = sanitizeGearSave(out.gear, out, now);
  const ownedGear = {};
  for (const [id, row] of Object.entries((out.gear && out.gear.owned) || {})) {
    ownedGear[id] = { gearId: id, at: row && row.at ? row.at : 0 };
  }
  out.ownedGear = ownedGear;
  delete out.gearOwned;
  if (!out.equipment || typeof out.equipment !== 'object') out.equipment = {};
  return out;
}

function grantGearItem(gearId, opts) {
  opts = opts || {};
  if (typeof gearGrantItem !== 'function') return false;
  const src = typeof opts.src === 'string' ? opts.src : 'drop';
  const st = opts.save || (typeof save !== 'undefined' ? save : null);
  const result = gearGrantItem(gearId, src, st, opts.now);
  if (!result || !result.ok) return false;
  if (result.already) return false;
  if (!opts.silent) {
    try {
      const it = result.item;
      const col = gearAccent(it);
      if (typeof UI !== 'undefined' && UI && typeof UI.toast === 'function') {
        UI.toast(t('toast.gearDrop', { name: gearLabel(it), slot: gearSlotLabel(it.slot) }), 3800, { tone: 'ok' });
      }
      if (typeof game !== 'undefined' && game && typeof game.banner === 'function') {
        game.banner(gearLabel(it), 2.0, col, 32);
      }
      if (typeof AudioSys !== 'undefined' && AudioSys && typeof AudioSys.sfx === 'function') {
        AudioSys.sfx('newmonster');
      }
    } catch (_) {}
  }
  return true;
}

function gearLabel(itOrId, field) {
  const it = typeof itOrId === 'string' ? gearById(itOrId) : itOrId;
  if (!it) return String(itOrId || '?');
  if (typeof gearItemLabel === 'function') return gearItemLabel(it, field);
  return field === 'desc' ? (it.desc || '') : (it.name || it.id);
}

function gearAccent(it) {
  if (!it) return '#c792ff';
  try {
    if (typeof rarityOf === 'function') return rarityOf(it.rarity).color;
  } catch (_) {}
  if (it.look && it.look.accent) return it.look.accent;
  return '#c792ff';
}

function gearSpecialDuel(gameRef) {
  try {
    if (typeof adventureSpecialDuelActive === 'function' && adventureSpecialDuelActive(gameRef)) return true;
  } catch (_) {}
  return !!(gameRef && (gameRef.satanActive || gameRef.tideBattleActive));
}

function gearFieldCount(gameRef, id) {
  let n = 0;
  for (const pk of (gameRef && gameRef.pickups) || []) {
    if (pk && pk.kind === 'gear' && pk.life > 0) {
      if (!id || pk.gearId === id) n++;
    }
  }
  return n;
}

function rollGearWorldDrop(gameRef, monster) {
  if (!gameRef || gameRef.mode !== 'adventure' || !gameRef.level) return null;
  if (gearSpecialDuel(gameRef)) return null;
  if (gearFieldCount(gameRef) >= GEAR_MAX_FIELD) return null;
  if (typeof rollGearDrop !== 'function') return null;
  const n = Math.floor(Number(gameRef.level.n) || 0);
  const islandBoss = n > 0 && n % 10 === 0 && monster && (monster.elite || monster.superBoss);
  const exclude = {};
  for (const pk of gameRef.pickups || []) {
    if (pk && pk.kind === 'gear' && pk.gearId) exclude[pk.gearId] = true;
  }
  let chance = 0.055;
  if (monster) {
    if (monster.superBoss) chance = 0.55;
    else if (monster.elite) chance = 0.2;
    else if (monster.giant) chance = 0.1;
  }
  if (islandBoss) chance = 1;
  else if (gameRef.level.boss && monster && monster.elite) chance = Math.max(chance, 0.3);
  try {
    const diff = gameRef.advDiff || (gameRef.level && gameRef.level.diff) || 'normal';
    if (!islandBoss && typeof advDropChanceMul === 'function') {
      chance = Math.min(0.72, chance * advDropChanceMul(diff));
    }
  } catch (_) {}
  if (!islandBoss && Math.random() > chance) return null;
  const diff = gameRef.advDiff || (gameRef.level && gameRef.level.diff) || 'normal';
  const zone = typeof adventureDropZoneForLevel === 'function'
    ? adventureDropZoneForLevel(n, diff)
    : null;
  return rollGearDrop({
    allowLocked: !!(islandBoss || (monster && monster.superBoss)),
    excludeIds: exclude,
    zone,
  });
}

function rollGearStageClearDrop(levelN, diffId) {
  const n = Math.floor(Number(levelN) || 0);
  if (!(n > 0 && n % 10 === 0)) return null;
  if (typeof rollGearDrop !== 'function') return null;
  const zone = typeof adventureDropZoneForLevel === 'function'
    ? adventureDropZoneForLevel(n, diffId)
    : null;
  return rollGearDrop({ allowLocked: true, zone });
}

function rollGearChestPull() {
  if (typeof rollGearDrop !== 'function') return null;
  const pick = rollGearDrop({ allowLocked: false });
  if (!pick) return null;
  if (!grantGearItem(pick.id, { silent: true, src: 'chest' })) return null;
  return pick;
}

function tickPlayTime(dt) {
  if (!(dt > 0) || typeof save === 'undefined' || !save || !save.stats) return;
  const add = dt > 0.08 ? 0.08 : dt;
  const next = (Number(save.stats.playSec) || 0) + add;
  save.stats.playSec = next > 9999999 ? 9999999 : next;
}

function gearPixelRows(id) {
  const it = gearById(id) || { id: id };
  const key = gearPixelKey(it);
  const tmpl = GEAR_PIXEL_TEMPLATES[key] || GEAR_PIXEL_TEMPLATES.pin;
  const tint = GEAR_TINTS[gearTintKey(it)] || GEAR_TINTS.cloth;
  const rows = tmpl.slice();
  rows._tint = tint;
  return rows;
}

function gearPixelColor(ch, tint) {
  if (ch === 'A') return (tint && tint.A) || '#e8f0ff';
  if (ch === 'B') return (tint && tint.B) || '#9db1e3';
  if (ch === 'C') return (tint && tint.C) || '#ffd75e';
  return GEAR_PIXEL_PALETTE[ch] || null;
}

function drawGearPixels(c, id, x, y, scale) {
  const rows = gearPixelRows(id);
  if (!rows || !c) return false;
  const tint = rows._tint || GEAR_TINTS.cloth;
  const sc = scale > 0 ? scale : 2;
  const n = rows.length;
  c.save();
  c.imageSmoothingEnabled = false;
  if ('webkitImageSmoothingEnabled' in c) c.webkitImageSmoothingEnabled = false;
  if ('mozImageSmoothingEnabled' in c) c.mozImageSmoothingEnabled = false;
  const ox = Math.round(x - (n * sc) / 2);
  const oy = Math.round(y - (n * sc) / 2);
  for (let j = 0; j < n; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const col = gearPixelColor(row[i], tint);
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(ox + i * sc, oy + j * sc, sc, sc);
    }
  }
  c.restore();
  return true;
}

function gearPixelsToSvg(id) {
  const rows = gearPixelRows(id);
  if (!rows) return '';
  const tint = rows._tint || GEAR_TINTS.cloth;
  const n = rows.length;
  const rects = [];
  for (let j = 0; j < n; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const col = gearPixelColor(row[i], tint);
      if (!col) continue;
      rects.push('<rect x="' + i + '" y="' + j + '" width="1" height="1" fill="' + col + '"/>');
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" aria-hidden="true">\n' + rects.join('\n') + '\n</svg>\n';
}

function gearAssetPath(id) {
  const it = gearById(id);
  return it ? ('assets/gear/' + it.id + '.svg') : '';
}
