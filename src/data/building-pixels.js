/* ======================== BUILDING PIXEL WIRE MAP ======================== */
/**
 * Locked catalog (#292 / user): quirky factories — NOT generic sawmill/forge.
 *
 *   stick_lighter
 *   woodchip_glue
 *   chipping_wood
 *   bamboo_boesa_boiler
 *   echo_whistle_mill
 *
 * Preview: assets/buildings/preview.html
 * Map:     BUILDING-PIXEL-MAP.md
 */
const BUILDING_HUB_ID = 'buildings';

const BUILDING_PIXELS = {
  stick_lighter: {
    id: 'stick_lighter',
    name: 'Stick-Lighter Factory',
    nameNl: 'Stok-Aansteker Fabriek',
    accent: '#ffd75e',
    card: 'assets/buildings/stick_lighter.svg',
    hub: 'assets/buttons/hub/buildings.svg',
    iconFile: 'assets/buttons/modes/buildings-stick-lighter.svg',
  },
  woodchip_glue: {
    id: 'woodchip_glue',
    name: 'Woodchip-Glue Factory',
    nameNl: 'Houtsnipper-Lijm Fabriek',
    accent: '#d4e05a',
    card: 'assets/buildings/woodchip_glue.svg',
    hub: 'assets/buttons/hub/buildings.svg',
    iconFile: 'assets/buttons/modes/buildings-woodchip-glue.svg',
  },
  chipping_wood: {
    id: 'chipping_wood',
    name: 'Chipping-Wood Factory',
    nameNl: 'Versnipper-Hout Fabriek',
    accent: '#7cf5ff',
    card: 'assets/buildings/chipping_wood.svg',
    hub: 'assets/buttons/hub/buildings.svg',
    iconFile: 'assets/buttons/modes/buildings-chipping-wood.svg',
  },
  bamboo_boesa_boiler: {
    id: 'bamboo_boesa_boiler',
    name: 'Bamboo-Boesa Boiler',
    nameNl: 'Bamboe-Boesa Ketel',
    accent: '#4ecf6a',
    card: 'assets/buildings/bamboo_boesa_boiler.svg',
    hub: 'assets/buttons/hub/buildings.svg',
    iconFile: 'assets/buttons/modes/buildings-bamboo-boesa.svg',
  },
  echo_whistle_mill: {
    id: 'echo_whistle_mill',
    name: 'Echo-Whistle Mill',
    nameNl: 'Echo-Fluitmolen',
    accent: '#c792ff',
    card: 'assets/buildings/echo_whistle_mill.svg',
    hub: 'assets/buttons/hub/buildings.svg',
    iconFile: 'assets/buttons/modes/buildings-echo-whistle.svg',
  },
};

const BUILDING_IDS = [
  'stick_lighter',
  'woodchip_glue',
  'chipping_wood',
  'bamboo_boesa_boiler',
  'echo_whistle_mill',
];

/** HOME tile (stroke + pixel). */
const BUILDING_HUB_ART = {
  id: BUILDING_HUB_ID,
  stroke: 'assets/buttons/hub/buildings.svg',
  pixel: 'assets/buildings/hub-buildings.svg',
};

/**
 * Compat only. Locked ids are snake_case quirky factories.
 * kebab-case, camelCase, and leftover generic partner stubs fold in here.
 */
const BUILDING_PIXEL_ALIASES = {
  buildings: BUILDING_HUB_ID,
  factory: BUILDING_HUB_ID,
  factories: BUILDING_HUB_ID,
  fabrieken: BUILDING_HUB_ID,

  sticklighter: 'stick_lighter',
  sticklighterfactory: 'stick_lighter',
  lighter: 'stick_lighter',
  'stick-light': 'stick_lighter',

  woodchipglue: 'woodchip_glue',
  woodchipgluefactory: 'woodchip_glue',
  glue: 'woodchip_glue',
  'wood-chip-glue': 'woodchip_glue',

  chippingwood: 'chipping_wood',
  chippingwoodfactory: 'chipping_wood',
  woodchipper: 'chipping_wood',
  'chip-wood': 'chipping_wood',

  bambooboesaboiler: 'bamboo_boesa_boiler',
  bambooboesa: 'bamboo_boesa_boiler',
  'bamboo-boesa': 'bamboo_boesa_boiler',
  'boesa-boiler': 'bamboo_boesa_boiler',
  boesa: 'bamboo_boesa_boiler',
  'bamboo-boiler': 'bamboo_boesa_boiler',
  bambooboiler: 'bamboo_boesa_boiler',

  echowhistlemill: 'echo_whistle_mill',
  'whistle-mill': 'echo_whistle_mill',
  whistlemill: 'echo_whistle_mill',
  'echo-mill': 'echo_whistle_mill',
  echomill: 'echo_whistle_mill',

  /* leftover generic stubs from early partner drafts — not the locked names */
  dojo: 'chipping_wood',
  hall: 'chipping_wood',
  sawmill: 'chipping_wood',
  forge: 'stick_lighter',
  smith: 'stick_lighter',
  workshop: 'stick_lighter',
  foundry: 'stick_lighter',
  garden: 'bamboo_boesa_boiler',
  farm: 'bamboo_boesa_boiler',
  kitchen: 'bamboo_boesa_boiler',
  tower: 'woodchip_glue',
  watch: 'woodchip_glue',
  barracks: 'woodchip_glue',
  ranch: 'woodchip_glue',
  shrine: 'echo_whistle_mill',
  well: 'echo_whistle_mill',
  temple: 'echo_whistle_mill',
  mill: 'echo_whistle_mill',
};

function _buildingKeyForms(id) {
  if (id == null) return null;
  let s = String(id).trim();
  if (!s) return null;
  const camel = s.replace(/([a-z\d])([A-Z])/g, '$1_$2');
  let snake = camel.replace(/[-\s.]+/g, '_').toLowerCase();
  snake = snake.replace(/^(factory|factories|bldg|bld|building|buildings)_/, '');
  const kebab = snake.replace(/_/g, '-');
  const compact = snake.replace(/_/g, '');
  return { raw: s, snake, kebab, compact, lower: s.toLowerCase() };
}

function resolveBuildingId(id) {
  const f = _buildingKeyForms(id);
  if (!f) return null;
  if (BUILDING_PIXELS[f.raw]) return f.raw;
  if (BUILDING_PIXELS[f.snake]) return f.snake;
  if (f.snake === BUILDING_HUB_ID || f.compact === BUILDING_HUB_ID) return BUILDING_HUB_ID;
  const hit = BUILDING_PIXEL_ALIASES[f.snake]
    || BUILDING_PIXEL_ALIASES[f.kebab]
    || BUILDING_PIXEL_ALIASES[f.compact]
    || BUILDING_PIXEL_ALIASES[f.lower];
  if (hit === BUILDING_HUB_ID) return BUILDING_HUB_ID;
  if (hit && BUILDING_PIXELS[hit]) return hit;
  return null;
}

/**
 * @param {string} id
 * @param {'card'|'hub'|'pixel'|'stroke'|'icon'} [slot='card']
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
  if (slot === 'icon') return row.iconFile;
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
