/* ============================ RARITEITEN =============================== */
const RARITIES = {
  common:    { id: 'common',    name: 'Gewoon',     color: '#9db1e3', glow: 'rgba(157,177,227,.35)', order: 0 },
  uncommon:  { id: 'uncommon',  name: 'Ongewoon',   color: '#5ad06a', glow: 'rgba(90,208,106,.4)',  order: 1 },
  rare:      { id: 'rare',      name: 'Zeldzaam',   color: '#4a9fff', glow: 'rgba(74,159,255,.45)', order: 2 },
  epic:      { id: 'epic',      name: 'Episch',     color: '#b06ae0', glow: 'rgba(176,106,224,.5)', order: 3 },
  legendary: { id: 'legendary', name: 'Legendarisch', color: '#ffd75e', glow: 'rgba(255,215,94,.55)', order: 4 },
  mythic:    { id: 'mythic',    name: 'Mythisch',   color: '#ff6b9d', glow: 'rgba(255,107,157,.6)', order: 5 },
  nightmare: { id: 'nightmare', name: 'Nachtmerrie', color: '#c47aff', glow: 'rgba(196,122,255,.65)', order: 6 },
  hell:      { id: 'hell',      name: 'Hel',        color: '#ff6a3d', glow: 'rgba(255,106,61,.7)', order: 7 },
};
const rarityOf = id => RARITIES[id] || RARITIES.common;
const rarityHpBonus = r => ({
  common: 3, uncommon: 5, rare: 8, epic: 12, legendary: 18, mythic: 25,
  nightmare: 32, hell: 40,
}[r] || 5);
