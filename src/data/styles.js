/* ============================== STIJLEN ================================ */
const STYLES = [
  { id: 'classic', name: 'Klassiek', body: '#f2f5ff', accent: '#3db8ff', bandana: null,
    needLvl: 1, hint: 'Standaard ninja' },
  { id: 'konoha', name: 'Konoha bandana', body: '#f2f5ff', accent: '#43b25b', bandana: '#2d6b36', plate: '#dfe8ff',
    needLvl: 5, hint: 'Unlock op Lv 5' },
  { id: 'chakra', name: 'Chakra gloed', body: '#e8f4ff', accent: '#7cf5ff', bandana: '#3db8ff', glow: true,
    needTrain: 3, hint: 'Win 3× training' },
  { id: 'akatsuki', name: 'Rode mantel', body: '#1a1424', accent: '#e04f4f', bandana: '#e04f4f', coat: true,
    needLvl: 12, hint: 'Unlock op Lv 12' },
  { id: 'shadow', name: 'Schaduw-ninja', body: '#8fa3d9', accent: '#b06ae0', bandana: '#2a1840',
    needLvl: 15, hint: 'Unlock op Lv 15' },
  { id: 'guvve', name: 'Guvvedukkie', body: '#43b25b', accent: '#ffe259', bandana: '#2a8a38', duck: true,
    needDex: 8, hint: '8 monsters in boek' },
  { id: 'gold', name: 'Legendarisch', body: '#ffd75e', accent: '#c97a20', bandana: '#ffb830', glow: true,
    needLvl: 25, hint: 'Unlock op Lv 25' },
  { id: 'sand', name: 'Woestijn', body: '#e8c98a', accent: '#c97a20', bandana: '#8a6030',
    needLvl: 8, hint: 'Unlock op Lv 8' },
  { id: 'samurai', name: 'Samurai', body: '#2a2a35', accent: '#e04f4f', bandana: '#1a1a22', topknot: true,
    needLvl: 20, hint: 'Unlock op Lv 20' },
  { id: 'cyber', name: 'Cyber-ninja', body: '#1a2040', accent: '#7cf5ff', bandana: '#4ecf6a', visor: true,
    needLvl: 18, hint: 'Unlock op Lv 18' },
  { id: 'fox', name: 'Vossen-ninja', body: '#ff8c42', accent: '#ffe259', bandana: '#d05a1e', fox: true,
    needDex: 12, hint: '12 monsters in boek' },
  { id: 'storm', name: 'Stormgeest', body: '#dfe8ff', accent: '#6fd7ff', bandana: '#2a7fc0', glow: true,
    needTrain: 5, hint: 'Win 5× training' },
  { id: 'void', name: 'Void-waker', body: '#2a1840', accent: '#ff6b9d', bandana: '#5a1040', coat: true,
    needLvl: 40, hint: 'Unlock op Lv 40' },
  { id: 'hunter', name: 'Jagerlook', body: '#6b5344', accent: '#5ad06a', bandana: '#3d5c32', hunter: true,
    needDexKills: 75, hint: '75 kills in monsterboek' },
  { id: 'crystal', name: 'Kristallijn', body: '#e8f7ff', accent: '#6fd7ff', bandana: '#2f7fc0', glow: true, crystal: true,
    needDexTiers: 4, hint: '4 rariteiten in monsterboek' },
  { id: 'tome', name: 'Boekmeester', body: '#f5efe6', accent: '#c98850', bandana: '#6b5344', tome: true,
    needDexHalf: true, hint: 'Helft van het monsterboek' },
];
const styleById = id => STYLES.find(s => s.id === id) || STYLES[0];
function styleUnlocked(st) {
  if (st.id === 'classic') return true;
  if (styleSkillGated(st)) return false;
  if (st.needLvl && save.lvl >= st.needLvl) return true;
  if (st.needTrain && save.trainWins >= st.needTrain) return true;
  if (st.needDex && dexCount() >= st.needDex) return true;
  if (st.needDexKills && dexTotalKills() >= st.needDexKills) return true;
  if (st.needDexTiers && dexRarityTierCount() >= st.needDexTiers) return true;
  if (st.needDexHalf && typeof SPECIES_ORDER !== 'undefined' &&
      dexCount() >= Math.ceil(SPECIES_ORDER.length / 2)) return true;
  return false;
}
function applyPlayerStyle(fighter) {
  const st = styleById(save.style || 'classic');
  if (!styleUnlocked(st)) { save.style = 'classic'; persist(); }
  fighter.color = styleById(save.style).body;
  fighter.style = styleById(save.style);
  fighter.lineW = st.id === 'gold' ? 5 : 4.5;
}

