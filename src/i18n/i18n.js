/* ============================== I18N =================================== */
const SUPPORTED_LANGS = ['nl', 'en', 'de', 'fr', 'es'];
const LANG_LABELS = { nl: 'NL', en: 'EN', de: 'DE', fr: 'FR', es: 'ES' };

const I18N = {
  nl: {
    back: { menu: '← Menu', collect: '← Collectie', levels: '← Levels' },
    common: { backHome: 'Terug naar menu', ok: 'Begrepen!', offline: 'Offline' },
    menu: {
      continue: 'Verder spelen', adventure: 'Avontuur', adventureSub: 'Verhaal · eilanden · bazen',
      arcade: 'Arcade', arcadeSub: 'Training · Muur · Mats', versus: '2 spelers', versusSub: 'Lokaal · iPad liggend',
      collect: 'Collectie', collectSub: 'Wapens · stijl · boek', music: 'Muziek', missions: 'Missies',
      options: 'Opties', tips: 'Tips', fresh: 'Verse versie', install: 'Zet in app-lade', installSub: 'Één icoon op je beginscherm',
      pressStart: 'insert coin', missionReady: 'missie klaar', dayBonus: 'Dagbonus',
    },
    hub: {
      step: 'Stap 2 · Kies modus', solo: 'SOLO', collection: 'COLLECTIE',
      arcadeTitle: 'Arcade', arcadeSub: 'Snelle sessies · high scores · geen voortgang verlies',
      collectTitle: 'Verzameling', collectSub: 'Wapens · dex & ei-pets · stijlen · monsterboek',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · oefenen',
      wall: 'Muur Slopen', wallSub: '60 sec · combo = sneller',
      mats: 'Mats · Muntjes bonus', matsSub: '45 sec · munten → pet coins',
      weapons: 'Wapens', weaponsSub: '26 wapens · summon ascends',
      pets: 'Pets', petsSub: 'Mats coins · dex temmen · ei arcade',
      style: 'Stijl', styleSub: 'Bandana & outfit unlocks',
      dex: 'Monsterboek', dexSub: '114 soorten · rariteit = HP',
      modes3: '3 snelle modi', fightersLocal: '20 vechters · lokaal', vsRecord: '{w}/{m} gewonnen',
    },
    modes: { adventure: 'Avontuur', training: 'Training', wall: 'Muur', versus: '2 spelers', coinrun: 'Mats · munten' },
    pause: {
      title: 'Pauze', sub: 'Rasengan klaar — moto! · voortgang blijft op dit apparaat',
      resume: 'Verder spelen', music: 'Muziek', sfx: 'Geluid', quit: 'Stop & hoofdmenu',
      vsRestart: 'Herstart match', vsRestartSub: '0-0 · zelfde vechters',
      audioHint: 'Volume in pauze — sliders sync met Instellingen',
    },
    result: { again: 'Opnieuw', next: 'Volgend level', menu: 'Hoofdmenu', rematch: 'Rematch', rematchSub: 'Zelfde vechters',
      xp: '+{xp} XP verdiend · nu Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Instellingen', sub: 'Geluid, trilling & HUD — opgeslagen op dit apparaat',
      lang: 'Taal / Language', music: 'Muziek', sfx: 'Effecten', shake: 'Schermschok', haptics: 'Trillen (iPad)',
      comboHud: 'Combo-HUD', bigTouch: 'Grote knoppen (iPad)', reducedMotion: 'Minder beweging (FX + iOS)',
      liteFx: 'Lite FX (iPad sneller)', highContrast: 'Hoog contrast tekst', restoreBackup: 'Herstel save uit backup',
      syncBackup: 'Sync backup = hoofd-save', freshCache: 'Verse versie (cache legen)', clearSave: 'Nieuwe start (dubbel tikken)',
      hosting: 'Hosting & voortgang', copyLink: 'Kopieer vaste speel-link', openLink: 'Open vaste link',
      savePort: 'Save export / import', exportSave: 'Export save', importSave: 'Import save',
      langChanged: 'Taal: {lang}',
    },
    missions: { title: 'Missies & prestaties', sub: '3 lichte dagmissies · claim XP wanneer klaar',
      claimAll: 'Claim alle klaar', claimAllSub: '+XP in één tik', dayBonus: 'Dagbonus', dayBonusSub: '+80 XP · alle 3 geclaimd',
      achievements: 'Prestaties' },
    pets: { title: 'Pets · Metgezels', sub: 'Dex-pets via monsterboek · Ei-pets via dagelijkse arcade-pull',
      crackEgg: 'Dag-ei openen', crackEggSub: 'Gratis arcade-pull' },
    dex: { title: 'Monsterboek', sub: 'Rariteit = HP-bonus (+3…+25) · 4 rariteiten = Kristallijn · helft boek = Boekmeester · 75 kills = Jagerlook' },
    help: { title: 'Tips & controls' },
    install: { title: 'In app-lade zetten', sub: 'Verschijnt als icoon — net als een echte app' },
    island: {
      1: { name: 'Oost-eiland', sub: 'Lv 1–10' }, 2: { name: 'Vuur-eiland', sub: 'Lv 11–20' },
      3: { name: 'Neon-eiland', sub: 'Lv 21–30' }, 4: { name: 'Tempel-eiland', sub: 'Lv 31–40' },
      5: { name: 'Finale-eiland', sub: 'Lv 41–50' },
      progress: 'Eiland {cur}/5 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    rarity: { common: 'Gewoon', uncommon: 'Ongewoon', rare: 'Zeldzaam', epic: 'Episch', legendary: 'Legendarisch', mythic: 'Mythisch' },
    audio: { musicOff: 'Muziek uit', sfxOff: 'Geluid uit', musicPct: 'Muziek {pct}%', sfxPct: 'SFX {pct}%' },
  },
  en: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Levels' },
    common: { backHome: 'Back to menu', ok: 'Got it!', offline: 'Offline' },
    menu: {
      continue: 'Continue', adventure: 'Adventure', adventureSub: 'Story · islands · bosses',
      arcade: 'Arcade', arcadeSub: 'Training · Wall · Mats', versus: '2 players', versusSub: 'Local · iPad landscape',
      collect: 'Collection', collectSub: 'Weapons · style · book', music: 'Music', missions: 'Missions',
      options: 'Options', tips: 'Tips', fresh: 'Fresh version', install: 'Add to home screen', installSub: 'One icon on your device',
      pressStart: 'insert coin', missionReady: 'mission ready', dayBonus: 'Daily bonus',
    },
    hub: {
      step: 'Step 2 · Pick mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Quick sessions · high scores · no progress loss',
      collectTitle: 'Collection', collectSub: 'Weapons · dex & egg pets · styles · monster book',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · practice',
      wall: 'Wall Smash', wallSub: '60 sec · combo = faster',
      mats: 'Mats · Coin bonus', matsSub: '45 sec · coins → pet coins',
      weapons: 'Weapons', weaponsSub: '26 weapons · summon ascends',
      pets: 'Pets', petsSub: 'Mats coins · dex tame · egg arcade',
      style: 'Style', styleSub: 'Bandana & outfit unlocks',
      dex: 'Monster book', dexSub: '114 species · rarity = HP',
      modes3: '3 quick modes', fightersLocal: '20 fighters · local', vsRecord: '{w}/{m} won',
    },
    modes: { adventure: 'Adventure', training: 'Training', wall: 'Wall', versus: '2 players', coinrun: 'Mats · coins' },
    pause: {
      title: 'Paused', sub: 'Rasengan ready — go! · progress stays on this device',
      resume: 'Resume', music: 'Music', sfx: 'Sound', quit: 'Quit to menu',
      vsRestart: 'Restart match', vsRestartSub: '0-0 · same fighters',
      audioHint: 'Volume in pause — sliders sync with Settings',
    },
    result: { again: 'Again', next: 'Next level', menu: 'Main menu', rematch: 'Rematch', rematchSub: 'Same fighters',
      xp: '+{xp} XP earned · now Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Settings', sub: 'Sound, haptics & HUD — saved on this device',
      lang: 'Language / Taal', music: 'Music', sfx: 'Effects', shake: 'Screen shake', haptics: 'Haptics (iPad)',
      comboHud: 'Combo HUD', bigTouch: 'Big buttons (iPad)', reducedMotion: 'Reduce motion (FX + iOS)',
      liteFx: 'Lite FX (faster iPad)', highContrast: 'High contrast text', restoreBackup: 'Restore save from backup',
      syncBackup: 'Sync backup = main save', freshCache: 'Fresh version (clear cache)', clearSave: 'New start (tap twice)',
      hosting: 'Hosting & progress', copyLink: 'Copy play link', openLink: 'Open play link',
      savePort: 'Save export / import', exportSave: 'Export save', importSave: 'Import save',
      langChanged: 'Language: {lang}',
    },
    missions: { title: 'Missions & achievements', sub: '3 light daily missions · claim XP when done',
      claimAll: 'Claim all ready', claimAllSub: '+XP in one tap', dayBonus: 'Daily bonus', dayBonusSub: '+80 XP · all 3 claimed',
      achievements: 'Achievements' },
    pets: { title: 'Pets · Companions', sub: 'Dex pets via monster book · Egg pets via daily arcade pull',
      crackEgg: 'Open daily egg', crackEggSub: 'Free arcade pull' },
    dex: { title: 'Monster book', sub: 'Rarity = HP bonus (+3…+25) · 4 rarities = Crystalline · half book = Bookmaster · 75 kills = Hunter look' },
    help: { title: 'Tips & controls' },
    install: { title: 'Add to home screen', sub: 'Shows as an icon — like a real app' },
    island: {
      1: { name: 'East island', sub: 'Lv 1–10' }, 2: { name: 'Fire island', sub: 'Lv 11–20' },
      3: { name: 'Neon island', sub: 'Lv 21–30' }, 4: { name: 'Temple island', sub: 'Lv 31–40' },
      5: { name: 'Final island', sub: 'Lv 41–50' },
      progress: 'Island {cur}/5 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    rarity: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic' },
    audio: { musicOff: 'Music off', sfxOff: 'Sound off', musicPct: 'Music {pct}%', sfxPct: 'SFX {pct}%' },
  },
  de: {
    back: { menu: '← Menü', collect: '← Sammlung', levels: '← Level' },
    common: { backHome: 'Zurück zum Menü', ok: 'Verstanden!', offline: 'Offline' },
    menu: {
      continue: 'Weiterspielen', adventure: 'Abenteuer', adventureSub: 'Story · Inseln · Bosse',
      arcade: 'Arcade', arcadeSub: 'Training · Mauer · Mats', versus: '2 Spieler', versusSub: 'Lokal · iPad quer',
      collect: 'Sammlung', collectSub: 'Waffen · Stil · Buch', music: 'Musik', missions: 'Missionen',
      options: 'Optionen', tips: 'Tipps', fresh: 'Neue Version', install: 'Zum Home-Bildschirm', installSub: 'Ein Icon auf dem Gerät',
      pressStart: 'insert coin', missionReady: 'Mission bereit', dayBonus: 'Tagesbonus',
    },
    hub: {
      step: 'Schritt 2 · Modus wählen', solo: 'SOLO', collection: 'SAMMLUNG',
      arcadeTitle: 'Arcade', arcadeSub: 'Schnelle Runden · Highscores',
      collectTitle: 'Sammlung', collectSub: 'Waffen · Pets · Stile · Monsterbuch',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · Üben',
      wall: 'Mauer zerstören', wallSub: '60 Sek · Combo = schneller',
      mats: 'Mats · Münzen', matsSub: '45 Sek · Münzen → Pet-Coins',
      weapons: 'Waffen', weaponsSub: '26 Waffen · Summons',
      pets: 'Pets', petsSub: 'Mats-Coins · Dex zähmen',
      style: 'Stil', styleSub: 'Outfit-Freischaltungen',
      dex: 'Monsterbuch', dexSub: '114 Arten · Seltenheit = HP',
      modes3: '3 schnelle Modi', fightersLocal: '20 Kämpfer · lokal', vsRecord: '{w}/{m} Siege',
    },
    modes: { adventure: 'Abenteuer', training: 'Training', wall: 'Mauer', versus: '2 Spieler', coinrun: 'Mats · Münzen' },
    pause: {
      title: 'Pause', sub: 'Rasengan bereit — los! · Fortschritt bleibt auf diesem Gerät',
      resume: 'Weiter', music: 'Musik', sfx: 'Sound', quit: 'Menü verlassen',
      vsRestart: 'Match neu starten', vsRestartSub: '0-0 · gleiche Kämpfer',
      audioHint: 'Lautstärke in Pause — sync mit Einstellungen',
    },
    result: { again: 'Nochmal', next: 'Nächstes Level', menu: 'Hauptmenü', rematch: 'Revanche', rematchSub: 'Gleiche Kämpfer',
      xp: '+{xp} XP · jetzt Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Einstellungen', sub: 'Sound, Vibration & HUD — auf diesem Gerät gespeichert',
      lang: 'Sprache / Language', music: 'Musik', sfx: 'Effekte', shake: 'Bildschirmshake', haptics: 'Vibration (iPad)',
      comboHud: 'Combo-HUD', bigTouch: 'Große Tasten (iPad)', reducedMotion: 'Weniger Bewegung',
      liteFx: 'Lite FX (schneller)', highContrast: 'Hoher Kontrast', restoreBackup: 'Save aus Backup',
      syncBackup: 'Backup syncen', freshCache: 'Neue Version (Cache leeren)', clearSave: 'Neustart (2× tippen)',
      hosting: 'Hosting & Fortschritt', copyLink: 'Link kopieren', openLink: 'Link öffnen',
      savePort: 'Save export / import', exportSave: 'Save exportieren', importSave: 'Save importieren',
      langChanged: 'Sprache: {lang}',
    },
    missions: { title: 'Missionen & Erfolge', sub: '3 tägliche Missionen · XP abholen',
      claimAll: 'Alle abholen', claimAllSub: '+XP auf einmal', dayBonus: 'Tagesbonus', dayBonusSub: '+80 XP',
      achievements: 'Erfolge' },
    pets: { title: 'Pets · Begleiter', sub: 'Dex-Pets & Ei-Pets', crackEgg: 'Tages-Ei öffnen', crackEggSub: 'Gratis Pull' },
    dex: { title: 'Monsterbuch', sub: 'Seltenheit = HP-Bonus' },
    help: { title: 'Tipps & Steuerung' },
    install: { title: 'Zum Home-Bildschirm', sub: 'Wie eine echte App' },
    island: {
      1: { name: 'Ost-Insel', sub: 'Lv 1–10' }, 2: { name: 'Feuer-Insel', sub: 'Lv 11–20' },
      3: { name: 'Neon-Insel', sub: 'Lv 21–30' }, 4: { name: 'Tempel-Insel', sub: 'Lv 31–40' },
      5: { name: 'Finale-Insel', sub: 'Lv 41–50' },
      progress: 'Insel {cur}/5 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'Legendär', mythic: 'Mythisch' },
    audio: { musicOff: 'Musik aus', sfxOff: 'Sound aus', musicPct: 'Musik {pct}%', sfxPct: 'SFX {pct}%' },
  },
  fr: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Niveaux' },
    common: { backHome: 'Retour au menu', ok: 'Compris !', offline: 'Hors ligne' },
    menu: {
      continue: 'Continuer', adventure: 'Aventure', adventureSub: 'Histoire · îles · boss',
      arcade: 'Arcade', arcadeSub: 'Entraînement · Mur · Mats', versus: '2 joueurs', versusSub: 'Local · iPad paysage',
      collect: 'Collection', collectSub: 'Armes · style · bestiaire', music: 'Musique', missions: 'Missions',
      options: 'Options', tips: 'Astuces', fresh: 'Version fraîche', install: 'Ajouter à l\'écran d\'accueil', installSub: 'Une icône sur l\'appareil',
      pressStart: 'insert coin', missionReady: 'mission prête', dayBonus: 'Bonus du jour',
    },
    hub: {
      step: 'Étape 2 · Choisir le mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Sessions rapides · high scores',
      collectTitle: 'Collection', collectSub: 'Armes · pets · styles · bestiaire',
      training: 'Entraînement vs RabbitRobot', trainingSub: '1v1 · pratique',
      wall: 'Mur à détruire', wallSub: '60 s · combo = plus vite',
      mats: 'Mats · Pièces', matsSub: '45 s · pièces → pet coins',
      weapons: 'Armes', weaponsSub: '26 armes · invocations',
      pets: 'Pets', petsSub: 'Pièces Mats · dex · œufs',
      style: 'Style', styleSub: 'Déblocages tenues',
      dex: 'Bestiaire', dexSub: '114 espèces · rareté = PV',
      modes3: '3 modes rapides', fightersLocal: '20 combattants · local', vsRecord: '{w}/{m} victoires',
    },
    modes: { adventure: 'Aventure', training: 'Entraînement', wall: 'Mur', versus: '2 joueurs', coinrun: 'Mats · pièces' },
    pause: {
      title: 'Pause', sub: 'Rasengan prêt — go ! · progrès sur cet appareil',
      resume: 'Reprendre', music: 'Musique', sfx: 'Son', quit: 'Quitter au menu',
      vsRestart: 'Recommencer', vsRestartSub: '0-0 · mêmes combattants',
      audioHint: 'Volume en pause — sync avec Options',
    },
    result: { again: 'Rejouer', next: 'Niveau suivant', menu: 'Menu principal', rematch: 'Revanche', rematchSub: 'Mêmes combattants',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Options', sub: 'Son, vibrations & HUD — sauvegardé sur cet appareil',
      lang: 'Langue / Language', music: 'Musique', sfx: 'Effets', shake: 'Secousse écran', haptics: 'Vibration (iPad)',
      comboHud: 'HUD combo', bigTouch: 'Gros boutons (iPad)', reducedMotion: 'Moins de mouvement',
      liteFx: 'Lite FX (plus rapide)', highContrast: 'Contraste élevé', restoreBackup: 'Restaurer backup',
      syncBackup: 'Sync backup', freshCache: 'Version fraîche (cache)', clearSave: 'Nouveau départ (2× tap)',
      hosting: 'Hébergement & progrès', copyLink: 'Copier le lien', openLink: 'Ouvrir le lien',
      savePort: 'Export / import save', exportSave: 'Exporter save', importSave: 'Importer save',
      langChanged: 'Langue : {lang}',
    },
    missions: { title: 'Missions & succès', sub: '3 missions quotidiennes · réclamer XP',
      claimAll: 'Tout réclamer', claimAllSub: '+XP en un tap', dayBonus: 'Bonus du jour', dayBonusSub: '+80 XP',
      achievements: 'Succès' },
    pets: { title: 'Pets · Compagnons', sub: 'Pets dex & œufs arcade', crackEgg: 'Ouvrir l\'œuf du jour', crackEggSub: 'Tir gratuit' },
    dex: { title: 'Bestiaire', sub: 'Rareté = bonus PV' },
    help: { title: 'Astuces & contrôles' },
    install: { title: 'Ajouter à l\'écran d\'accueil', sub: 'Comme une vraie app' },
    island: {
      1: { name: 'Île de l\'Est', sub: 'Lv 1–10' }, 2: { name: 'Île de Feu', sub: 'Lv 11–20' },
      3: { name: 'Île Néon', sub: 'Lv 21–30' }, 4: { name: 'Île Temple', sub: 'Lv 31–40' },
      5: { name: 'Île Finale', sub: 'Lv 41–50' },
      progress: 'Île {cur}/5 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire', mythic: 'Mythique' },
    audio: { musicOff: 'Musique off', sfxOff: 'Son off', musicPct: 'Musique {pct}%', sfxPct: 'SFX {pct}%' },
  },
  es: {
    back: { menu: '← Menú', collect: '← Colección', levels: '← Niveles' },
    common: { backHome: 'Volver al menú', ok: '¡Entendido!', offline: 'Sin conexión' },
    menu: {
      continue: 'Continuar', adventure: 'Aventura', adventureSub: 'Historia · islas · jefes',
      arcade: 'Arcade', arcadeSub: 'Entrenamiento · Muro · Mats', versus: '2 jugadores', versusSub: 'Local · iPad horizontal',
      collect: 'Colección', collectSub: 'Armas · estilo · bestiario', music: 'Música', missions: 'Misiones',
      options: 'Opciones', tips: 'Consejos', fresh: 'Versión nueva', install: 'Añadir a inicio', installSub: 'Un icono en tu dispositivo',
      pressStart: 'insert coin', missionReady: 'misión lista', dayBonus: 'Bonus diario',
    },
    hub: {
      step: 'Paso 2 · Elige modo', solo: 'SOLO', collection: 'COLECCIÓN',
      arcadeTitle: 'Arcade', arcadeSub: 'Sesiones rápidas · high scores',
      collectTitle: 'Colección', collectSub: 'Armas · pets · estilos · bestiario',
      training: 'Entrenamiento vs RabbitRobot', trainingSub: '1v1 · practicar',
      wall: 'Romper muro', wallSub: '60 s · combo = más rápido',
      mats: 'Mats · Monedas', matsSub: '45 s · monedas → pet coins',
      weapons: 'Armas', weaponsSub: '26 armas · invocaciones',
      pets: 'Pets', petsSub: 'Monedas Mats · dex · huevos',
      style: 'Estilo', styleSub: 'Desbloqueos de outfit',
      dex: 'Bestiario', dexSub: '114 especies · rareza = HP',
      modes3: '3 modos rápidos', fightersLocal: '20 luchadores · local', vsRecord: '{w}/{m} ganados',
    },
    modes: { adventure: 'Aventura', training: 'Entrenamiento', wall: 'Muro', versus: '2 jugadores', coinrun: 'Mats · monedas' },
    pause: {
      title: 'Pausa', sub: 'Rasengan listo — ¡ya! · progreso en este dispositivo',
      resume: 'Seguir', music: 'Música', sfx: 'Sonido', quit: 'Salir al menú',
      vsRestart: 'Reiniciar partida', vsRestartSub: '0-0 · mismos luchadores',
      audioHint: 'Volumen en pausa — sync con Opciones',
    },
    result: { again: 'Otra vez', next: 'Siguiente nivel', menu: 'Menú principal', rematch: 'Revancha', rematchSub: 'Mismos luchadores',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Opciones', sub: 'Sonido, vibración y HUD — guardado en este dispositivo',
      lang: 'Idioma / Language', music: 'Música', sfx: 'Efectos', shake: 'Sacudida pantalla', haptics: 'Vibración (iPad)',
      comboHud: 'HUD combo', bigTouch: 'Botones grandes (iPad)', reducedMotion: 'Menos movimiento',
      liteFx: 'Lite FX (más rápido)', highContrast: 'Alto contraste', restoreBackup: 'Restaurar backup',
      syncBackup: 'Sync backup', freshCache: 'Versión nueva (caché)', clearSave: 'Nuevo inicio (2× tap)',
      hosting: 'Hosting y progreso', copyLink: 'Copiar enlace', openLink: 'Abrir enlace',
      savePort: 'Export / import save', exportSave: 'Exportar save', importSave: 'Importar save',
      langChanged: 'Idioma: {lang}',
    },
    missions: { title: 'Misiones y logros', sub: '3 misiones diarias · reclamar XP',
      claimAll: 'Reclamar todo', claimAllSub: '+XP de una vez', dayBonus: 'Bonus diario', dayBonusSub: '+80 XP',
      achievements: 'Logros' },
    pets: { title: 'Pets · Compañeros', sub: 'Pets dex y huevos arcade', crackEgg: 'Abrir huevo diario', crackEggSub: 'Tirada gratis' },
    dex: { title: 'Bestiario', sub: 'Rareza = bonus HP' },
    help: { title: 'Consejos y controles' },
    install: { title: 'Añadir a inicio', sub: 'Como una app real' },
    island: {
      1: { name: 'Isla Este', sub: 'Lv 1–10' }, 2: { name: 'Isla Fuego', sub: 'Lv 11–20' },
      3: { name: 'Isla Neón', sub: 'Lv 21–30' }, 4: { name: 'Isla Templo', sub: 'Lv 31–40' },
      5: { name: 'Isla Final', sub: 'Lv 41–50' },
      progress: 'Isla {cur}/5 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Común', uncommon: 'Poco común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario', mythic: 'Mítico' },
    audio: { musicOff: 'Música off', sfxOff: 'Sonido off', musicPct: 'Música {pct}%', sfxPct: 'SFX {pct}%' },
  },
};

function i18nLookup(table, key) {
  const parts = key.split('.');
  let cur = table;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return null;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : null;
}

function detectBrowserLang() {
  try {
    const raw = (navigator.language || navigator.userLanguage || 'nl').slice(0, 2).toLowerCase();
    return SUPPORTED_LANGS.includes(raw) ? raw : 'en';
  } catch (_) {
    return 'nl';
  }
}

function getLang() {
  const l = save && save.lang;
  return SUPPORTED_LANGS.includes(l) ? l : detectBrowserLang();
}

function setLang(code) {
  if (!SUPPORTED_LANGS.includes(code)) return false;
  save.lang = code;
  persist();
  applyLang();
  return true;
}

function t(key, params) {
  const lang = getLang();
  let s = i18nLookup(I18N[lang], key) || i18nLookup(I18N.nl, key) || i18nLookup(I18N.en, key) || key;
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      s = s.split('{' + k + '}').join(String(v));
    }
  }
  return s;
}

function rarityLabel(id) {
  return t('rarity.' + id) || rarityOf(id).name;
}

function islandLabel(id, field) {
  return t('island.' + id + '.' + field) || (islandMeta(id)[field === 'name' ? 'name' : 'sub']);
}

function achLabel(ach, field) {
  const k = 'ach.' + ach.id + '.' + field;
  const v = t(k);
  if (v && v !== k) return v;
  return ach[field];
}

function setText(id, key, params) {
  const el = document.getElementById(id);
  if (el) el.textContent = t(key, params);
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function canApplyDomI18n() {
  return typeof document !== 'undefined' && document.getElementById
    && typeof document.createTextNode === 'function';
}

function applyLangStaticScreens() {
  if (!canApplyDomI18n()) return;
  if (document.documentElement) document.documentElement.lang = getLang();
  const net = document.getElementById('netStatus');
  if (net) net.textContent = t('common.offline');

  setText('menuLangLbl', 'settings.lang');
  setText('pressStartLine', 'menu.pressStart');
  const cont = document.getElementById('btnContinue');
  if (cont) {
    const div = cont.querySelector('div');
    if (div && !save.lastPlay?.mode) div.firstChild && (div.childNodes[0].textContent = t('menu.continue') + '\n');
  }

  const hubMap = [
    ['.hub-tile-adventure .hub-tile-title', 'menu.adventure'],
    ['.hub-tile-adventure .hub-tile-sub', 'menu.adventureSub'],
    ['.hub-tile-arcade .hub-tile-title', 'menu.arcade'],
    ['.hub-tile-arcade .hub-tile-sub', 'menu.arcadeSub'],
    ['.hub-tile-versus .hub-tile-title', 'menu.versus'],
    ['.hub-tile-versus .hub-tile-sub', 'menu.versusSub'],
    ['.hub-tile-collect .hub-tile-title', 'menu.collect'],
    ['.hub-tile-collect .hub-tile-sub', 'menu.collectSub'],
  ];
  for (const [sel, key] of hubMap) {
    const el = document.querySelector(sel);
    if (el) el.textContent = t(key);
  }

  const dockMap = [
    ['togMusic', 'menu.music', true], ['btnMissionsLbl', 'menu.missions', false],
    ['btnSettings', 'menu.options', true], ['btnHelp', 'menu.tips', true],
    ['btnVerseVersie', 'menu.fresh', true],
  ];
  for (const [id, key, isBtn] of dockMap) {
    const el = document.getElementById(id);
    if (!el) continue;
    const label = t(key);
    if (isBtn) {
      const ico = el.querySelector('.tog-ico');
      el.textContent = '';
      if (ico) el.appendChild(ico);
      el.appendChild(document.createTextNode(label));
    } else el.textContent = label;
  }

  const installLbl = document.getElementById('btnInstallLabel');
  if (installLbl) installLbl.innerHTML = t('menu.install') + '<small>' + t('menu.installSub') + '</small>';

  setText('modeHubStep', 'hub.step');
  const modeRows = [
    ['btnTraining', 'hub.training', 'hub.trainingSub'],
    ['btnWall', 'hub.wall', 'hub.wallSub'],
    ['btnMatsCoins', 'hub.mats', 'hub.matsSub'],
    ['btnWeapons', 'hub.weapons', 'hub.weaponsSub'],
    ['btnPets', 'hub.pets', 'hub.petsSub'],
    ['btnStyle', 'hub.style', 'hub.styleSub'],
    ['btnDex', 'hub.dex', 'hub.dexSub'],
  ];
  for (const [id, titleKey, subKey] of modeRows) {
    const btn = document.getElementById(id);
    const div = btn && btn.querySelector('div');
    if (!div) continue;
    const stat = div.querySelector('.hub-mode-stat');
    const statHtml = stat ? stat.outerHTML : '';
    div.innerHTML = t(titleKey) + '<small>' + t(subKey) + '</small>' + statHtml;
  }

  document.querySelectorAll('.sub-home-btn div').forEach((el) => {
    el.textContent = t('common.backHome');
  });

  setText('settingsHead', 'settings.title');
  setText('settingsSub', 'settings.sub');
  setText('setLangLbl', 'settings.lang');
  const setMap = [
    ['setShake', 'settings.shake'], ['setHaptics', 'settings.haptics'], ['setComboHud', 'settings.comboHud'],
    ['setBigTouch', 'settings.bigTouch'], ['setReducedMotion', 'settings.reducedMotion'],
    ['setLiteFx', 'settings.liteFx'], ['setHighContrast', 'settings.highContrast'],
    ['btnRestoreBackup', 'settings.restoreBackup'], ['btnSyncBackup', 'settings.syncBackup'],
    ['btnForceFresh', 'settings.freshCache'], ['btnClearSave', 'settings.clearSave'],
    ['btnCopyLink', 'settings.copyLink'], ['btnOpenPlayLink', 'settings.openLink'],
    ['btnExportSave', 'settings.exportSave'], ['btnImportSave', 'settings.importSave'],
  ];
  for (const [id, key] of setMap) {
    const el = document.getElementById(id);
    if (!el) continue;
    const ico = el.querySelector('.tog-ico');
    const label = t(key);
    if (ico) {
      el.textContent = '';
      el.appendChild(ico);
      el.appendChild(document.createTextNode(label));
    } else el.textContent = label;
  }
  const hostingTitle = document.querySelector('#settingsScreen .settings-card div[style*="ffd75e"]');
  if (hostingTitle) hostingTitle.textContent = t('settings.hosting');
  const savePortTitle = document.querySelectorAll('#settingsScreen .settings-card div[style*="ffd75e"]')[1];
  if (savePortTitle) savePortTitle.textContent = t('settings.savePort');

  setText('missionsHead', 'missions.title');
  setText('missionsSub', 'missions.sub');
  const claimAll = document.getElementById('dailyClaimAllBtn');
  if (claimAll) {
    const d = claimAll.querySelector('div');
    if (d) d.innerHTML = t('missions.claimAll') + '<small>' + t('missions.claimAllSub') + '</small>';
  }
  const dayBonus = document.getElementById('dailyBonusBtn');
  if (dayBonus) {
    const d = dayBonus.querySelector('div');
    if (d) d.innerHTML = t('missions.dayBonus') + '<small>' + t('missions.dayBonusSub') + '</small>';
  }
  document.querySelectorAll('#missionsScreen .head')[1] &&
    (document.querySelectorAll('#missionsScreen .head')[1].textContent = t('missions.achievements'));

  setText('petScreenHead', 'pets.title');
  setText('petScreenSub', 'pets.sub');
  const eggBtn = document.getElementById('eggCrackBtn');
  if (eggBtn) {
    const d = eggBtn.querySelector('div');
    if (d) d.innerHTML = t('pets.crackEgg') + '<small>' + t('pets.crackEggSub') + '</small>';
  }

  setText('dexScreenHead', 'dex.title');
  setText('dexScreenSub', 'dex.sub');
  setText('helpHead', 'help.title');
  setText('installHead', 'install.title');
  setText('installSub', 'ui.installSub');

  setText('charArenaPre', 'ui.charArenaPre');
  setText('charSelectHead', 'ui.charHead');
  setText('charSelectRosterLine', 'ui.charRosterLine');
  setText('levelScreenHead', 'ui.levelHead');
  setText('levelScreenSub', 'ui.levelSub');
  setText('gambleSub', 'ui.gambleSub');
  setText('styleScreenHead', 'ui.styleHead');
  setText('styleScreenSub', 'ui.styleSub');
  setText('weaponScreenHead', 'ui.weaponHead');
  setText('weaponScreenSub', 'ui.weaponSub');
  setText('helpFirstMinute', 'ui.helpFirstMinute');

  const gambleStartLbl = document.getElementById('gambleStartLbl');
  if (gambleStartLbl) gambleStartLbl.innerHTML = t('ui.gambleStart') + '<small>' + t('ui.gambleStartSub') + '</small>';
  const gambleSkipLbl = document.getElementById('gambleSkipLbl');
  if (gambleSkipLbl) gambleSkipLbl.innerHTML = t('ui.gambleSkip') + '<small>' + t('ui.gambleSkipSub') + '</small>';

  const helpTipsList = document.getElementById('helpTipsList');
  if (helpTipsList && typeof i18nList === 'function') {
    const tips = i18nList('help.tips');
    helpTipsList.innerHTML = tips.map((line) => `<li>${line}</li>`).join('');
  }

  const charIpadCard = document.getElementById('charIpadTipCard');
  if (charIpadCard) charIpadCard.innerHTML = t('ui.charIpadTip');

  const charFightBtn = document.getElementById('btnCharFight');
  if (charFightBtn) charFightBtn.textContent = t('ui.charFight');

  setText('pauseHead', 'pause.title');
  setText('pauseSub', 'pause.sub');
  const pauseResume = document.getElementById('pauseResume');
  if (pauseResume) pauseResume.querySelector('div').textContent = t('pause.resume');
  const pauseQuit = document.getElementById('pauseQuit');
  if (pauseQuit) pauseQuit.querySelector('div').textContent = t('pause.quit');
  const pauseVs = document.getElementById('pauseVsRestart');
  if (pauseVs) {
    const d = pauseVs.querySelector('div');
    if (d) d.innerHTML = t('pause.vsRestart') + '<small>' + t('pause.vsRestartSub') + '</small>';
  }
  ['pauseTogMusic', 'pauseTogSfx'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const ico = el.querySelector('.tog-ico');
    const label = t(i ? 'pause.sfx' : 'pause.music');
    el.textContent = '';
    if (ico) el.appendChild(ico);
    el.appendChild(document.createTextNode(label));
  });

  const resAgain = document.getElementById('resAgain');
  if (resAgain) resAgain.querySelector('div').textContent = t('result.again');
  const resNext = document.getElementById('resNext');
  if (resNext) resNext.querySelector('div').textContent = t('result.next');
  const resMenu = document.getElementById('resMenu');
  if (resMenu) resMenu.querySelector('div').textContent = t('result.menu');
  const helpOk = document.getElementById('helpOk');
  if (helpOk) helpOk.querySelector('div').textContent = t('common.ok');

  UI.pauseSubDefault = t('pause.sub');
  if (!UI.BACK_LABELS) UI.BACK_LABELS = {};
  Object.assign(UI.BACK_LABELS, {
    modeHubScreen: t('back.menu'),
    levelScreen: t('back.menu'),
    gambleScreen: t('back.levels'),
    weaponScreen: t('back.collect'),
    petScreen: t('back.collect'),
    styleScreen: t('back.collect'),
    dexScreen: t('back.collect'),
    charSelectScreen: t('back.menu'),
    missionsScreen: t('back.menu'),
    settingsScreen: t('back.menu'),
    helpScreen: t('back.menu'),
    installScreen: t('back.menu'),
  });
  UI.syncBackLabels();
}

function onLangSwitchClick(e) {
  const btn = e.target.closest('[data-lang]');
  if (!btn) return;
  const code = btn.getAttribute('data-lang');
  if (!code || code === getLang()) return;
  safeUiAction(() => {
    setLang(code);
    AudioSys.sfx('select');
    UI.toast(t('settings.langChanged', { lang: LANG_LABELS[code] }), 2200);
    UI.renderSettings();
    UI.renderMenu();
    if (typeof UI.renderModeHub === 'function') UI.renderModeHub();
  }, 'setLang/' + code, t('ui.langSwitchFail') || 'Language switch failed');
}

function renderLangSwitchBar(bar) {
  if (!bar) return;
  const cur = getLang();
  bar.innerHTML = SUPPORTED_LANGS.map((code) =>
    `<button type="button" class="dex-filter-btn${cur === code ? ' active' : ''}" data-lang="${code}">${LANG_LABELS[code]}</button>`
  ).join('');
  if (!bar.dataset.bound) {
    bar.dataset.bound = '1';
    bar.addEventListener('click', onLangSwitchClick);
  }
}

function renderLangSwitch() {
  renderLangSwitchBar(document.getElementById('langSwitchBar'));
  renderLangSwitchBar(document.getElementById('menuLangBar'));
}

function applyLang() {
  if (!canApplyDomI18n()) return;
  applyLangStaticScreens();
  renderLangSwitch();
    if (typeof UI !== 'undefined') {
    UI.renderMenu();
    const active = UI.activeScreen && UI.activeScreen();
    if (active === 'settingsScreen') UI.renderSettings();
    else if (active === 'missionsScreen') UI.renderMissions();
    else if (active === 'helpScreen' && typeof UI.renderHelp === 'function') UI.renderHelp();
    else if (active === 'weaponScreen' && typeof UI.renderWeapons === 'function') UI.renderWeapons();
    else if (active === 'styleScreen' && typeof UI.renderStyle === 'function') UI.renderStyle();
    else if (active === 'charSelectScreen' && typeof UI.renderCharSelect === 'function') UI.renderCharSelect();
    else if (active === 'levelScreen' && typeof UI.renderLevels === 'function') UI.renderLevels();
    else if (active === 'modeHubScreen') UI.renderModeHub();
    UI.syncBackLabels();
  }
}

function initLang() {
  if (typeof mergeI18nCatalogs === 'function') mergeI18nCatalogs();
  if (!save.lang || !SUPPORTED_LANGS.includes(save.lang)) {
    save.lang = detectBrowserLang();
    persist();
  }
  applyLang();
}
