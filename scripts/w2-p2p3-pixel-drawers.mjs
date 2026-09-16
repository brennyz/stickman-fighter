/** Unique 32×32 W2 P2+P3 drawers. P1 stays in gen-monster-pixels.mjs (#298). */
export const P2P3_ART_IDS = [
  'raven',
  'moose',
  'beaver',
  'badger',
  'stag',
  'lynx',
  'wisp',
  'gargoyle',
  'lich',
  'cog',
  'turret',
  'rivet',
  'piston',
  'walrus',
  'ray',
  'mole',
  'junkbat',
  'seal',
];
export const P2P3_PREVIEW_PAL = {
  raven: { B: '#505868', D: '#202830' },
  moose: { B: '#c98850', D: '#6b4a28' },
  beaver: { B: '#c98850', D: '#6b4a28' },
  badger: { B: '#9a917f', D: '#4a4038' },
  stag: { B: '#d4a574', D: '#8a6030' },
  lynx: { B: '#e8c98a', D: '#8a6030' },
  wisp: { B: '#cfe6ff', D: '#7aa8cf' },
  gargoyle: { B: '#8a8478', D: '#5a5548' },
  lich: { B: '#c47aff', D: '#5a2080' },
  cog: { B: '#c98850', D: '#7a5030' },
  turret: { B: '#9fb2c8', D: '#5f7189' },
  rivet: { B: '#9fb2c8', D: '#5f7189' },
  piston: { B: '#9fb2c8', D: '#5f7189' },
  walrus: { B: '#9fb2c8', D: '#5f7189' },
  ray: { B: '#6a9fc8', D: '#2a5080' },
  mole: { B: '#6b5344', D: '#3a2820' },
  junkbat: { B: '#9fb2c8', D: '#5f7189' },
  seal: { B: '#cfe6ff', D: '#7aa8cf' },
};
export function attachP2P3Builders(api) {
  const { grid, fillEllipse, fillRect, fillTri, eyes, outline, set, CH } = api;
  function artRaven() {
    const g = grid();
    fillEllipse(g, 16, 16, 6, 4, CH.body);
    fillTri(g, 10, 15, 4, 16, 11, 18, CH.body);
    fillTri(g, 8, 14, 2, 12, 10, 16, CH.dark);
    fillTri(g, 16, 14, 8, 8, 18, 16, CH.dark);
    fillTri(g, 16, 14, 26, 8, 20, 16, CH.dark);
    fillTri(g, 22, 16, 30, 14, 28, 20, CH.body);
    eyes(g, 10, 14, 1);
    set(g, 6, 16, CH.orange);
    return outline(g);
  }

  function artMoose() {
    const g = grid();
    fillEllipse(g, 19, 20, 9, 6, CH.body);
    fillRect(g, 8, 13, 4, 9, CH.body);
    fillEllipse(g, 6, 16, 4, 3, CH.dark);
    fillRect(g, 6, 19, 2, 4, CH.dark);
    fillRect(g, 1, 7, 7, 3, CH.accent);
    fillRect(g, 10, 7, 7, 3, CH.accent);
    fillRect(g, 1, 4, 3, 5, CH.accent);
    fillRect(g, 15, 4, 3, 5, CH.accent);
    fillRect(g, 4, 3, 4, 2, CH.accent);
    fillRect(g, 11, 3, 4, 2, CH.accent);
    eyes(g, 5, 15, 1);
    fillRect(g, 13, 25, 3, 4, CH.dark);
    fillRect(g, 18, 25, 3, 4, CH.dark);
    fillRect(g, 23, 25, 3, 4, CH.dark);
    return outline(g);
  }

  function artBeaver() {
    const g = grid();
    fillEllipse(g, 15, 17, 7, 6, CH.body);
    fillEllipse(g, 8, 16, 4, 4, CH.dark);
    fillRect(g, 4, 17, 4, 3, CH.accent);
    set(g, 5, 16, CH.eye);
    set(g, 7, 16, CH.eye);
    fillRect(g, 22, 15, 8, 6, CH.dark);
    fillRect(g, 23, 14, 6, 1, CH.dark);
    fillRect(g, 23, 21, 6, 1, CH.dark);
    eyes(g, 7, 15, 1);
    fillRect(g, 11, 22, 3, 5, CH.dark);
    fillRect(g, 16, 22, 3, 5, CH.dark);
    return outline(g);
  }

  function artBadger() {
    const g = grid();
    fillEllipse(g, 18, 18, 10, 6, CH.body);
    fillEllipse(g, 7, 17, 5, 4, CH.dark);
    fillRect(g, 4, 15, 10, 3, CH.accent);
    fillRect(g, 8, 14, 3, 7, CH.ink);
    eyes(g, 6, 16, 1);
    fillRect(g, 26, 16, 4, 3, CH.dark);
    fillRect(g, 12, 23, 3, 4, CH.dark);
    fillRect(g, 17, 23, 3, 4, CH.dark);
    fillRect(g, 22, 23, 3, 4, CH.dark);
    return outline(g);
  }

  function artStag() {
    const g = grid();
    fillEllipse(g, 18, 19, 8, 5, CH.body);
    fillRect(g, 9, 13, 3, 8, CH.body);
    fillEllipse(g, 7, 16, 3, 3, CH.dark);
    fillTri(g, 6, 12, 4, 5, 8, 13, CH.accent);
    fillTri(g, 10, 12, 13, 4, 11, 13, CH.accent);
    set(g, 3, 7, CH.accent);
    set(g, 14, 6, CH.accent);
    set(g, 5, 6, CH.accent);
    set(g, 12, 5, CH.accent);
    eyes(g, 6, 15, 1);
    fillRect(g, 14, 23, 2, 4, CH.dark);
    fillRect(g, 22, 23, 2, 4, CH.dark);
    return outline(g);
  }

  function artLynx() {
    const g = grid();
    fillEllipse(g, 17, 18, 8, 6, CH.body);
    fillEllipse(g, 8, 16, 4, 4, CH.body);
    fillTri(g, 6, 13, 5, 7, 8, 13, CH.body);
    fillTri(g, 10, 13, 11, 7, 12, 13, CH.body);
    set(g, 5, 6, CH.dark);
    set(g, 11, 6, CH.dark);
    fillEllipse(g, 8, 18, 3, 2, CH.accent);
    fillRect(g, 24, 17, 2, 3, CH.dark);
    eyes(g, 7, 15, 1);
    fillRect(g, 13, 23, 2, 4, CH.dark);
    fillRect(g, 21, 23, 2, 4, CH.dark);
    return outline(g);
  }

  function artWisp() {
    const g = grid();
    fillEllipse(g, 16, 12, 5, 6, CH.body);
    fillEllipse(g, 16, 11, 3, 3, CH.hi);
    fillTri(g, 16, 18, 12, 26, 20, 26, CH.dark);
    fillTri(g, 14, 20, 10, 28, 15, 24, CH.body);
    fillTri(g, 18, 20, 22, 28, 17, 24, CH.body);
    eyes(g, 14, 11, 1);
    eyes(g, 18, 11, 1);
    set(g, 16, 8, CH.orange);
    return outline(g);
  }

  function artGargoyle() {
    const g = grid();
    fillEllipse(g, 16, 18, 7, 7, CH.body);
    fillEllipse(g, 12, 11, 5, 5, CH.dark);
    fillTri(g, 9, 8, 6, 3, 12, 10, CH.dark);
    fillTri(g, 14, 8, 17, 3, 13, 10, CH.dark);
    fillTri(g, 16, 14, 2, 8, 14, 18, CH.dark);
    fillTri(g, 16, 14, 30, 8, 18, 18, CH.dark);
    fillRect(g, 7, 21, 4, 6, CH.dark);
    fillRect(g, 21, 21, 4, 6, CH.dark);
    eyes(g, 10, 10, 1);
    fillTri(g, 7, 13, 3, 14, 8, 16, CH.body);
    return outline(g);
  }

  function artLich() {
    const g = grid();
    fillTri(g, 16, 6, 8, 24, 24, 24, CH.body);
    fillEllipse(g, 16, 9, 4, 4, CH.accent);
    fillRect(g, 13, 6, 6, 2, CH.dark);
    fillRect(g, 12, 5, 8, 1, CH.orange);
    fillRect(g, 7, 12, 2, 12, CH.dark);
    fillEllipse(g, 8, 11, 2, 2, CH.orange);
    eyes(g, 14, 9, 1);
    eyes(g, 18, 9, 1);
    fillRect(g, 13, 24, 2, 3, CH.dark);
    fillRect(g, 17, 24, 2, 3, CH.dark);
    return outline(g);
  }

  function artCog() {
    const g = grid();
    fillEllipse(g, 16, 16, 8, 8, CH.body);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      fillRect(g, 16 + Math.round(Math.cos(a) * 10) - 1, 16 + Math.round(Math.sin(a) * 10) - 1, 3, 3, CH.dark);
    }
    fillEllipse(g, 16, 16, 3, 3, CH.ink);
    fillEllipse(g, 16, 16, 1, 1, CH.orange);
    return outline(g);
  }

  function artTurret() {
    const g = grid();
    fillRect(g, 10, 18, 12, 7, CH.body);
    fillRect(g, 12, 14, 8, 5, CH.dark);
    fillRect(g, 4, 15, 9, 3, CH.body);
    fillRect(g, 3, 14, 3, 5, CH.orange);
    fillEllipse(g, 16, 16, 2, 2, CH.ink);
    set(g, 16, 16, CH.orange);
    fillRect(g, 11, 25, 3, 2, CH.dark);
    fillRect(g, 18, 25, 3, 2, CH.dark);
    return outline(g);
  }

  function artRivet() {
    const g = grid();
    fillRect(g, 8, 10, 16, 14, CH.body);
    fillRect(g, 10, 6, 12, 5, CH.dark);
    set(g, 10, 12, CH.accent);
    set(g, 21, 12, CH.accent);
    set(g, 10, 18, CH.accent);
    set(g, 21, 18, CH.accent);
    set(g, 16, 15, CH.accent);
    fillRect(g, 5, 14, 3, 6, CH.dark);
    fillRect(g, 24, 14, 3, 6, CH.dark);
    fillRect(g, 11, 24, 3, 3, CH.dark);
    fillRect(g, 18, 24, 3, 3, CH.dark);
    eyes(g, 13, 8, 1);
    eyes(g, 18, 8, 1);
    return outline(g);
  }

  function artPiston() {
    const g = grid();
    fillRect(g, 12, 10, 8, 14, CH.body);
    fillRect(g, 11, 8, 10, 3, CH.dark);
    fillRect(g, 11, 22, 10, 3, CH.dark);
    fillRect(g, 6, 14, 6, 3, CH.dark);
    fillRect(g, 3, 13, 4, 5, CH.orange);
    fillRect(g, 14, 5, 4, 4, CH.body);
    fillEllipse(g, 16, 16, 2, 2, CH.ink);
    set(g, 16, 16, CH.hi);
    return outline(g);
  }

  function artWalrus() {
    const g = grid();
    fillEllipse(g, 17, 18, 10, 7, CH.body);
    fillEllipse(g, 8, 18, 5, 4, CH.dark);
    fillRect(g, 6, 20, 2, 6, CH.accent);
    fillRect(g, 9, 20, 2, 5, CH.accent);
    set(g, 4, 17, CH.ink);
    set(g, 5, 18, CH.ink);
    set(g, 4, 19, CH.ink);
    eyes(g, 8, 16, 1);
    fillEllipse(g, 12, 24, 3, 2, CH.dark);
    fillEllipse(g, 22, 24, 3, 2, CH.dark);
    return outline(g);
  }

  function artRay() {
    const g = grid();
    fillTri(g, 8, 16, 22, 8, 22, 24, CH.body);
    fillTri(g, 22, 16, 30, 14, 28, 20, CH.dark);
    fillEllipse(g, 10, 16, 3, 2, CH.body);
    eyes(g, 8, 15, 1);
    fillRect(g, 16, 15, 4, 2, CH.dark);
    return outline(g);
  }

  function artMole() {
    const g = grid();
    fillEllipse(g, 17, 18, 8, 6, CH.body);
    fillEllipse(g, 8, 18, 5, 3, CH.dark);
    fillRect(g, 3, 17, 5, 2, CH.body);
    fillTri(g, 6, 20, 2, 24, 8, 22, CH.dark);
    fillTri(g, 10, 21, 7, 26, 12, 23, CH.dark);
    set(g, 8, 16, CH.ink);
    fillRect(g, 22, 16, 4, 2, CH.dark);
    fillRect(g, 14, 23, 2, 3, CH.dark);
    fillRect(g, 20, 23, 2, 3, CH.dark);
    return outline(g);
  }

  function artJunkbat() {
    const g = grid();
    fillRect(g, 3, 12, 8, 3, CH.dark);
    fillRect(g, 21, 12, 8, 3, CH.dark);
    fillTri(g, 4, 12, 2, 8, 10, 14, CH.dark);
    fillTri(g, 28, 12, 30, 8, 22, 14, CH.dark);
    fillRect(g, 12, 14, 8, 6, CH.body);
    set(g, 6, 13, CH.accent);
    set(g, 25, 13, CH.accent);
    fillTri(g, 13, 13, 12, 9, 15, 14, CH.dark);
    fillTri(g, 19, 13, 20, 9, 17, 14, CH.dark);
    eyes(g, 14, 16, 1);
    eyes(g, 18, 16, 1);
    set(g, 16, 19, CH.orange);
    return outline(g);
  }

  function artSeal() {
    const g = grid();
    fillEllipse(g, 16, 18, 10, 5, CH.body);
    fillEllipse(g, 7, 16, 4, 3, CH.dark);
    set(g, 4, 15, CH.ink);
    set(g, 5, 17, CH.ink);
    set(g, 4, 17, CH.ink);
    eyes(g, 6, 15, 1);
    fillEllipse(g, 12, 22, 3, 2, CH.dark);
    fillEllipse(g, 24, 16, 3, 2, CH.dark);
    fillRect(g, 26, 15, 3, 2, CH.dark);
    return outline(g);
  }

  return {
    raven: artRaven,
    moose: artMoose,
    beaver: artBeaver,
    badger: artBadger,
    stag: artStag,
    lynx: artLynx,
    wisp: artWisp,
    gargoyle: artGargoyle,
    lich: artLich,
    cog: artCog,
    turret: artTurret,
    rivet: artRivet,
    piston: artPiston,
    walrus: artWalrus,
    ray: artRay,
    mole: artMole,
    junkbat: artJunkbat,
    seal: artSeal,
  };
}

