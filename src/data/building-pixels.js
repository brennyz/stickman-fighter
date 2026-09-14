/* ======================== BUILDING PIXEL WIRE MAP ======================== */
/**
 * Art-only contract for the 5 quirky factories (mega-merge 3 of 4).
 * Systems / UI should reuse these buildingIds. If they ship a different
 * string, add it to BUILDING_PIXEL_ALIASES — do not rename files.
 *
 * Preview: assets/buildings/preview.html
 * Map:     BUILDING-PIXEL-MAP.md
 */
const BUILDING_HUB_ID = 'buildings';

const BUILDING_PIXELS = {
  'stick-lighter': {
    id: 'stick-lighter',
    name: 'Stick-Lighter',
    nameNl: 'Stok-Aansteker',
    accent: '#ffd75e',
    card: 'assets/buildings/stick-lighter.svg',
    hub: 'assets/buttons/hub/buildings.svg',
  },
  'woodchip-glue': {
    id: 'woodchip-glue',
    name: 'Woodchip-Glue',
    nameNl: 'Houtsnip-Lijm',
    accent: '#d4e05a',
    card: 'assets/buildings/woodchip-glue.svg',
    hub: 'assets/buttons/hub/buildings.svg',
  },
  'chipping-wood': {
    id: 'chipping-wood',
    name: 'Chipping-Wood',
    nameNl: 'Versnipper-Hout',
    accent: '#7cf5ff',
    card: 'assets/buildings/chipping-wood.svg',
    hub: 'assets/buttons/hub/buildings.svg',
  },
  'bamboo-boesa-boiler': {
    id: 'bamboo-boesa-boiler',
    name: 'Bamboo-Boesa Boiler',
    nameNl: 'Bamboe-Boesa Ketel',
    accent: '#4ecf6a',
    card: 'assets/buildings/bamboo-boesa-boiler.svg',
    hub: 'assets/buttons/hub/buildings.svg',
  },
  'echo-whistle-mill': {
    id: 'echo-whistle-mill',
    name: 'Echo-Whistle Mill',
    nameNl: 'Echo-Fluit Molen',
    accent: '#c792ff',
    card: 'assets/buildings/echo-whistle-mill.svg',
    hub: 'assets/buttons/hub/buildings.svg',
  },
};

const BUILDING_IDS = Object.keys(BUILDING_PIXELS);

/** HOME tile (stroke + pixel). */
const BUILDING_HUB_ART = {
  id: BUILDING_HUB_ID,
  stroke: 'assets/buttons/hub/buildings.svg',
  pixel: 'assets/buildings/hub-buildings.svg',
};

/**
 * Systems-doc aliases. Resolution strips factory-/bldg-/building- prefixes
 * and camelCase / snake_case before this table.
 */
const BUILDING_PIXEL_ALIASES = {
  buildings: BUILDING_HUB_ID,
  factory: BUILDING_HUB_ID,
  factories: BUILDING_HUB_ID,
  fabrieken: BUILDING_HUB_ID,
  sticklighter: 'stick-lighter',
  'stick_lighter': 'stick-lighter',
  lighter: 'stick-lighter',
  'stick-light': 'stick-lighter',
  woodchipglue: 'woodchip-glue',
  'woodchip_glue': 'woodchip-glue',
  glue: 'woodchip-glue',
  'wood-chip-glue': 'woodchip-glue',
  chippingwood: 'chipping-wood',
  'chipping_wood': 'chipping-wood',
  woodchipper: 'chipping-wood',
  sawmill: 'chipping-wood',
  'chip-wood': 'chipping-wood',
  bambooboesa: 'bamboo-boesa-boiler',
  'bamboo-boesa': 'bamboo-boesa-boiler',
  'bamboo_boesa_boiler': 'bamboo-boesa-boiler',
  'boesa-boiler': 'bamboo-boesa-boiler',
  boesa: 'bamboo-boesa-boiler',
  'bamboo-boiler': 'bamboo-boesa-boiler',
  bambooboiler: 'bamboo-boesa-boiler',
  echowhistlemill: 'echo-whistle-mill',
  'echo_whistle_mill': 'echo-whistle-mill',
  'whistle-mill': 'echo-whistle-mill',
  whistlemill: 'echo-whistle-mill',
  'echo-mill': 'echo-whistle-mill',
  echocmill: 'echo-whistle-mill',
};

function _normBuildingKey(id) {
  if (id == null) return '';
  let s = String(id).trim();
  if (!s) return '';
  s = s.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
  s = s.replace(/[_\s.]+/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^(factory|factories|bldg|bld|building|buildings)-/, '');
  return s;
}

function resolveBuildingId(id) {
  const raw = _normBuildingKey(id);
  if (!raw) return null;
  if (BUILDING_PIXELS[raw]) return raw;
  if (raw === BUILDING_HUB_ID || BUILDING_PIXEL_ALIASES[raw] === BUILDING_HUB_ID) return BUILDING_HUB_ID;
  const aliased = BUILDING_PIXEL_ALIASES[raw];
  if (aliased && (BUILDING_PIXELS[aliased] || aliased === BUILDING_HUB_ID)) return aliased;
  return null;
}

/**
 * @param {string} id
 * @param {'card'|'hub'|'pixel'|'stroke'} [slot='card']
 * @returns {string|null} relative asset URL
 */
function buildingArtSrc(id, slot) {
  const key = resolveBuildingId(id);
  if (!key) return null;
  if (key === BUILDING_HUB_ID) {
    if (slot === 'pixel' || slot === 'card') return BUILDING_HUB_ART.pixel;
    return BUILDING_HUB_ART.stroke;
  }
  const row = BUILDING_PIXELS[key];
  if (!row) return null;
  if (slot === 'hub' || slot === 'stroke') return row.hub;
  return row.card;
}

function buildingArtMeta(id) {
  const key = resolveBuildingId(id);
  if (!key) return null;
  if (key === BUILDING_HUB_ID) {
    return {
      id: BUILDING_HUB_ID,
      name: 'Buildings',
      nameNl: 'Fabrieken',
      accent: '#ffd75e',
      card: BUILDING_HUB_ART.pixel,
      hub: BUILDING_HUB_ART.stroke,
    };
  }
  const row = BUILDING_PIXELS[key];
  return row ? { ...row } : null;
}

try {
  if (typeof window !== 'undefined') {
    window.__sfBuildingArt = {
      ids: BUILDING_IDS.slice(),
      hub: BUILDING_HUB_ART,
      src: buildingArtSrc,
      resolve: resolveBuildingId,
      meta: buildingArtMeta,
    };
  }
} catch (_) { /* node / workers */ }
