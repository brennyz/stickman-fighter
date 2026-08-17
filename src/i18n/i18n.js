/* ============================== I18N =================================== */
const SUPPORTED_LANGS = ['nl', 'en', 'de', 'fr', 'es'];
const LANG_LABELS = { nl: 'NL', en: 'EN', de: 'DE', fr: 'FR', es: 'ES' };

const I18N = {
  nl: {
    back: { menu: '← Menu', collect: '← Collectie', levels: '← Levels' },
    common: { backHome: 'Terug naar menu', ok: 'Begrepen!', offline: 'Offline' },
    menu: {
      continue: 'Verder spelen', adventure: 'Avontuur', adventureSub: 'Verhaal · eilanden · bazen',
      arcade: 'Arcade', arcadeSub: 'Training · Muur · Muntjes', versus: '2 spelers', versusSub: 'Lokaal · iPad liggend',
      collect: 'Collectie', collectSub: 'Wapens · stijl · boek', music: 'Muziek', missions: 'Missies',
      summons: 'Summons', summonsSub: 'Dagelijkse kist · wapen & pet',
      options: 'Opties', tips: 'Tips', fresh: 'Verse versie', install: 'Zet in app-lade', installSub: 'Één icoon op je beginscherm',
      pressStart: 'insert coin', missionReady: 'missie klaar', dayBonus: 'Dagbonus',
      choosePath: 'KIES JE PAD',
    },
    hub: {
      step: 'Stap 2 · Kies modus', solo: 'SOLO', collection: 'COLLECTIE',
      arcadeTitle: 'Arcade', arcadeSub: 'Snelle sessies · high scores · geen voortgang verlies',
      collectTitle: 'Verzameling', collectSub: 'Wapens · dex & ei-pets · stijlen · monsterboek',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · oefenen',
      wall: 'Muur Slopen', wallSub: '60 sec · combo = sneller',
      mats: 'Muntjes bonus', matsSub: '45 sec · munten → pet coins',
      weapons: 'Wapens', weaponsSub: '26 wapens · summon ascends',
      pets: 'Pets', petsSub: 'Muntjes · dex temmen · ei arcade',
      style: 'Stijl', styleSub: 'Bandana & outfit unlocks',
      skills: 'Skills', skillsSub: 'Energy specials · Spiral Orb · Wave Cannon',
      dex: 'Monsterboek', dexSub: '{n} soorten · rariteit = HP · boerderij · zoo · zee',
      modes3: '3 snelle modi', fightersLocal: '20 vechters · lokaal', vsRecord: '{w}/{m} gewonnen',
    },
    modes: { adventure: 'Avontuur', training: 'Training', wall: 'Muur', versus: '2 spelers', coinrun: 'Muntjes' },
    pause: {
      title: 'Pauze', sub: 'Spiral Orb klaar — moto! · voortgang blijft op dit apparaat',
      wallTime: '{n}s resterend', wallStones: '{n} stenen', wallCombo: 'combo ×{n}',
      wallPaceAhead: '+{n} vs record-tempo', wallPaceBehind: '−{n} vs record-tempo',
      wallGap: 'nog {gap} tot record',
      resume: 'Verder spelen', music: 'Muziek', sfx: 'Geluid', quit: 'Stop & hoofdmenu',
      quitArcade: 'Stop & Arcade',
      vsRestart: 'Herstart match', vsRestartSub: '0-0 · zelfde vechters',
      vsSwap: 'Wissel kant', vsSwapSub: 'P1 ↔ P2 · zelfde score',
      audioHint: 'Volume in pauze — sliders sync met Instellingen',
      audioMuteAll: 'Alles uit', audioRestore: 'Standaard', audioSfxOnly: 'Alleen geluid',
    },
    result: { again: 'Opnieuw', next: 'Volgend level', menu: 'Hoofdmenu', menuArcade: 'Arcade', rematch: 'Rematch', rematchSub: 'Zelfde vechters',
      xp: '+{xp} XP verdiend · nu Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Instellingen', sub: 'Geluid, trilling & HUD — opgeslagen op dit apparaat',
      lang: 'Taal / Language', music: 'Muziek', sfx: 'Effecten', shake: 'Schermschok', haptics: 'Trillen (iPad)',
      comboHud: 'Combo-HUD', bigTouch: 'Grote knoppen (iPad)',
      kbLegend: 'Toetsen-legenda (PC)', showTouchPads: 'Touch-knoppen altijd',
      reducedMotion: 'Minder beweging (FX + iOS)',
      liteFx: 'Lite FX (iPad sneller)', highContrast: 'Hoog contrast tekst', restoreBackup: 'Herstel save uit backup',
      a11yMotionOn: 'Minder beweging: aan', a11yMotionOs: 'Minder beweging: via iOS/OS',
      a11yContrastOn: 'Hoog contrast: aan', a11yContrastOs: 'Hoog contrast: via iOS/OS',
      a11yDefault: 'Toegankelijkheid: standaard — schakel hierboven of via iOS Weergave',
      sfxSamplesOn: 'Online SFX: Kenney CC0 geladen',
      sfxSamplesLoad: 'Online SFX: laden… (synth fallback)',
      sfxSamplesOff: 'Online SFX: offline — synth fallback',
      syncBackup: 'Sync backup = hoofd-save', freshCache: 'Verse versie (cache legen)', clearSave: 'Nieuwe start (dubbel tikken)',
      hosting: 'Hosting & voortgang', copyLink: 'Kopieer vaste speel-link', openLink: 'Open vaste link',
      savePort: 'Save export / import', exportSave: 'Export save', importSave: 'Import save',
      importSaveFile: 'Bestand kiezen',
      savePortDesc: 'Export kopieert JSON (clipboard + download). Import: kies een exportbestand of plak JSON — 1× Import = preview, 2× = toepassen.',
      savePortPlaceholder: 'Plak JSON of kies een exportbestand (.json) — meta.key stickfighter_save_v1 · 2× Import om te laden',
      privacy: 'Privacy',
      ageHint: 'Cartoon-gevecht · tiener+ · geen chat',
      installAge: 'Cartoon-stickman gevechten · aanbevolen tiener+ · geen chat.',
      langChanged: 'Taal: {lang}',
    },
    missions: { title: 'Missies & prestaties', sub: '3 missies per dag',
      claimAll: 'Claim alle klaar', claimAllSub: '+XP in één tik', dayBonus: 'Dagbonus', dayBonusSub: '+80 XP · alle 3 geclaimd',
      achievements: 'Prestaties' },
    pets: { title: 'Pets · Metgezels', sub: 'Dex-pets via monsterboek · Ei-pets via dagelijkse arcade-pull',
      crackEgg: 'Dag-ei openen', crackEggSub: 'Gratis arcade-pull' },
    dex: { title: 'Monsterboek', sub: '{n} soorten · rariteit = HP · boerderij / dierentuin / zee-filters · 4 rariteiten = Kristallijn' },
    help: { title: 'Tips & controls' },
    install: { title: 'In app-lade zetten', sub: 'Verschijnt als icoon — net als een echte app' },
    island: {
      1: { name: 'Oost-eiland', sub: 'Lv 1–10' }, 2: { name: 'Vuur-eiland', sub: 'Lv 11–20' },
      3: { name: 'Neon-eiland', sub: 'Lv 21–30' }, 4: { name: 'Tempel-eiland', sub: 'Lv 31–40' },
      5: { name: 'Finale-eiland', sub: 'Lv 41–50' },
      6: { name: 'Nachtmerrie', sub: 'Lv 51–60' },
      7: { name: 'Hel', sub: 'Lv 61–70' },
      progress: 'Eiland {cur}/7 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    rarity: { common: 'Gewoon', uncommon: 'Ongewoon', rare: 'Zeldzaam', epic: 'Episch', legendary: 'Legendarisch', mythic: 'Mythisch', nightmare: 'Nachtmerrie', hell: 'Hel' },
    audio: {
      musicOff: 'Muziek uit', sfxOff: 'Geluid uit', musicPct: 'Muziek {pct}%', sfxPct: 'SFX {pct}%',
      allMuted: 'Alles stil', pauseDuck: 'BGM zacht', pauseTrack: 'Track: {track}',
      ctxSuspended: 'Tik slider voor geluid (iPad)',
      track: { menu: 'Menu', menu2: 'Menu 2', menu3: 'Menu 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
        battle: 'Gevecht', elite: 'Elite', boss: 'Baas', wall: 'Muur', training: 'Training', coinrun: 'Mats' },
    },
  },
  en: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Levels' },
    common: { backHome: 'Back to menu', ok: 'Got it!', offline: 'Offline' },
    menu: {
      continue: 'Continue', adventure: 'Adventure', adventureSub: 'Story · islands · bosses',
      arcade: 'Arcade', arcadeSub: 'Training · Wall · Coins', versus: '2 players', versusSub: 'Local · iPad landscape',
      collect: 'Collection', collectSub: 'Weapons · style · book', music: 'Music', missions: 'Missions',
      summons: 'Summons', summonsSub: 'Daily chest · weapon & pet',
      options: 'Options', tips: 'Tips', fresh: 'Fresh version', install: 'Add to home screen', installSub: 'One icon on your device',
      pressStart: 'insert coin', missionReady: 'mission ready', dayBonus: 'Daily bonus',
      choosePath: 'CHOOSE YOUR PATH',
    },
    hub: {
      step: 'Step 2 · Pick mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Quick sessions · high scores · no progress loss',
      collectTitle: 'Collection', collectSub: 'Weapons · dex & egg pets · styles · monster book',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · practice',
      wall: 'Wall Smash', wallSub: '60 sec · combo = faster',
      mats: 'Coin bonus', matsSub: '45 sec · coins → pet coins',
      weapons: 'Weapons', weaponsSub: '26 weapons · summon ascends',
      pets: 'Pets', petsSub: 'Coins · dex tame · egg arcade',
      style: 'Style', styleSub: 'Bandana & outfit unlocks',
      skills: 'Skills', skillsSub: 'Energy specials · Spiral Orb · Wave Cannon',
      dex: 'Monster book', dexSub: '{n} species · rarity = HP · farm · zoo · sea',
      modes3: '3 quick modes', fightersLocal: '20 fighters · local', vsRecord: '{w}/{m} won',
    },
    modes: { adventure: 'Adventure', training: 'Training', wall: 'Wall', versus: '2 players', coinrun: 'Coins' },
    pause: {
      title: 'Paused', sub: 'Spiral Orb ready — go! · progress stays on this device',
      wallTime: '{n}s left', wallStones: '{n} bricks', wallCombo: 'combo ×{n}',
      wallPaceAhead: '+{n} vs record pace', wallPaceBehind: '−{n} vs record pace',
      wallGap: '{gap} to record',
      resume: 'Resume', music: 'Music', sfx: 'Sound', quit: 'Quit to menu',
      quitArcade: 'Quit to Arcade',
      vsRestart: 'Restart match', vsRestartSub: '0-0 · same fighters',
      vsSwap: 'Swap sides', vsSwapSub: 'P1 ↔ P2 · same score',
      audioHint: 'Volume in pause — sliders sync with Settings',
      audioMuteAll: 'Mute all', audioRestore: 'Default', audioSfxOnly: 'SFX only',
    },
    result: { again: 'Again', next: 'Next level', menu: 'Main menu', menuArcade: 'Arcade', rematch: 'Rematch', rematchSub: 'Same fighters',
      xp: '+{xp} XP earned · now Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Settings', sub: 'Sound, haptics & HUD — saved on this device',
      lang: 'Language / Taal', music: 'Music', sfx: 'Effects', shake: 'Screen shake', haptics: 'Haptics (iPad)',
      comboHud: 'Combo HUD', bigTouch: 'Big buttons (iPad)',
      kbLegend: 'Keyboard legend (PC)', showTouchPads: 'Always show touch pads',
      reducedMotion: 'Reduce motion (FX + iOS)',
      liteFx: 'Lite FX (faster iPad)', highContrast: 'High contrast text', restoreBackup: 'Restore save from backup',
      a11yMotionOn: 'Reduce motion: on', a11yMotionOs: 'Reduce motion: via iOS/OS',
      a11yContrastOn: 'High contrast: on', a11yContrastOs: 'High contrast: via iOS/OS',
      a11yDefault: 'Accessibility: default — toggle above or via iOS Display settings',
      sfxSamplesOn: 'Online SFX: Kenney CC0 loaded',
      sfxSamplesLoad: 'Online SFX: loading… (synth fallback)',
      sfxSamplesOff: 'Online SFX: offline — synth fallback',
      syncBackup: 'Sync backup = main save', freshCache: 'Fresh version (clear cache)', clearSave: 'New start (tap twice)',
      hosting: 'Hosting & progress', copyLink: 'Copy play link', openLink: 'Open play link',
      savePort: 'Save export / import', exportSave: 'Export save', importSave: 'Import save',
      importSaveFile: 'Choose file',
      savePortDesc: 'Export copies JSON (clipboard + download). Import: pick an export file or paste JSON — 1× Import = preview, 2× = apply.',
      savePortPlaceholder: 'Paste JSON or choose an export file (.json) — meta.key stickfighter_save_v1 · tap Import twice to load',
      privacy: 'Privacy',
      ageHint: 'Cartoon combat · teens+ · no chat',
      installAge: 'Cartoon stickman combat · teens+ recommended · no chat.',
      langChanged: 'Language: {lang}',
    },
    missions: { title: 'Missions & achievements', sub: '3 missions a day',
      claimAll: 'Claim all ready', claimAllSub: '+XP in one tap', dayBonus: 'Daily bonus', dayBonusSub: '+80 XP · all 3 claimed',
      achievements: 'Achievements' },
    pets: { title: 'Pets · Companions', sub: 'Dex pets via monster book · Egg pets via daily arcade pull',
      crackEgg: 'Open daily egg', crackEggSub: 'Free arcade pull' },
    dex: { title: 'Monster book', sub: '{n} species · rarity = HP · farm / zoo / sea filters · 4 rarities = Crystalline' },
    help: { title: 'Tips & controls' },
    install: { title: 'Add to home screen', sub: 'Shows as an icon — like a real app' },
    island: {
      1: { name: 'East island', sub: 'Lv 1–10' }, 2: { name: 'Fire island', sub: 'Lv 11–20' },
      3: { name: 'Neon island', sub: 'Lv 21–30' }, 4: { name: 'Temple island', sub: 'Lv 31–40' },
      5: { name: 'Final island', sub: 'Lv 41–50' },
      6: { name: 'Nightmare', sub: 'Lv 51–60' },
      7: { name: 'Hell', sub: 'Lv 61–70' },
      progress: 'Island {cur}/7 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    rarity: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', nightmare: 'Nightmare', hell: 'Hell' },
    audio: {
      musicOff: 'Music off', sfxOff: 'Sound off', musicPct: 'Music {pct}%', sfxPct: 'SFX {pct}%',
      allMuted: 'All muted', pauseDuck: 'BGM ducked', pauseTrack: 'Track: {track}',
      ctxSuspended: 'Tap slider to wake audio (iPad)',
      track: { menu: 'Menu', menu2: 'Menu 2', menu3: 'Menu 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
        battle: 'Battle', elite: 'Elite', boss: 'Boss', wall: 'Wall', training: 'Training', coinrun: 'Mats' },
    },
  },
  de: {
    back: { menu: '← Menü', collect: '← Sammlung', levels: '← Level' },
    common: { backHome: 'Zurück zum Menü', ok: 'Verstanden!', offline: 'Offline' },
    menu: {
      continue: 'Weiterspielen', adventure: 'Abenteuer', adventureSub: 'Story · Inseln · Bosse',
      arcade: 'Arcade', arcadeSub: 'Training · Mauer · Münzen', versus: '2 Spieler', versusSub: 'Lokal · iPad quer',
      collect: 'Sammlung', collectSub: 'Waffen · Stil · Buch', music: 'Musik', missions: 'Missionen',
      options: 'Optionen', tips: 'Tipps', fresh: 'Neue Version', install: 'Zum Home-Bildschirm', installSub: 'Ein Icon auf dem Gerät',
      pressStart: 'insert coin', missionReady: 'Mission bereit', dayBonus: 'Tagesbonus',
      choosePath: 'WÄHLE DEINEN WEG',
    },
    hub: {
      step: 'Schritt 2 · Modus wählen', solo: 'SOLO', collection: 'SAMMLUNG',
      arcadeTitle: 'Arcade', arcadeSub: 'Schnelle Runden · Highscores',
      collectTitle: 'Sammlung', collectSub: 'Waffen · Pets · Stile · Monsterbuch',
      training: 'Training vs RabbitRobot', trainingSub: '1v1 · Üben',
      wall: 'Mauer zerstören', wallSub: '60 Sek · Combo = schneller',
      mats: 'Münzen-Bonus', matsSub: '45 Sek · Münzen → Pet-Coins',
      weapons: 'Waffen', weaponsSub: '26 Waffen · Summons',
      pets: 'Pets', petsSub: 'Münzen · Dex zähmen',
      style: 'Stil', styleSub: 'Outfit-Freischaltungen',
      skills: 'Skills', skillsSub: 'Energy specials · Spiral Orb · Wave Cannon',
      dex: 'Monsterbuch', dexSub: '{n} Arten · Seltenheit = HP · Farm · Zoo · Meer',
      modes3: '3 schnelle Modi', fightersLocal: '20 Kämpfer · lokal', vsRecord: '{w}/{m} Siege',
    },
    modes: { adventure: 'Abenteuer', training: 'Training', wall: 'Mauer', versus: '2 Spieler', coinrun: 'Münzen' },
    pause: {
      title: 'Pause', sub: 'Spiral Orb bereit — los! · Fortschritt bleibt auf diesem Gerät',
      resume: 'Weiter', music: 'Musik', sfx: 'Sound', quit: 'Menü verlassen',
      quitArcade: 'Stopp & Arcade',
      vsRestart: 'Match neu starten', vsRestartSub: '0-0 · gleiche Kämpfer',
      vsSwap: 'Seite tauschen', vsSwapSub: 'P1 ↔ P2 · gleicher Stand',
      audioHint: 'Lautstärke in Pause — sync mit Einstellungen',
    },
    result: { again: 'Nochmal', next: 'Nächstes Level', menu: 'Hauptmenü', menuArcade: 'Arcade', rematch: 'Revanche', rematchSub: 'Gleiche Kämpfer',
      xp: '+{xp} XP · jetzt Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Einstellungen', sub: 'Sound, Vibration & HUD — auf diesem Gerät gespeichert',
      lang: 'Sprache / Language', music: 'Musik', sfx: 'Effekte', shake: 'Bildschirmshake', haptics: 'Vibration (iPad)',
      comboHud: 'Combo-HUD', bigTouch: 'Große Tasten (iPad)',
      kbLegend: 'Tastatur-Legende (PC)', showTouchPads: 'Touch-Tasten immer',
      reducedMotion: 'Weniger Bewegung',
      liteFx: 'Lite FX (schneller)', highContrast: 'Hoher Kontrast', restoreBackup: 'Save aus Backup',
      syncBackup: 'Backup syncen', freshCache: 'Neue Version (Cache leeren)', clearSave: 'Neustart (2× tippen)',
      hosting: 'Hosting & Fortschritt', copyLink: 'Link kopieren', openLink: 'Link öffnen',
      savePort: 'Save export / import', exportSave: 'Save exportieren', importSave: 'Save importieren',
      importSaveFile: 'Datei wählen',
      savePortDesc: 'Export kopiert JSON (Zwischenablage + Download). Import: Datei wählen oder JSON einfügen — 1× Import = Vorschau, 2× = anwenden.',
      savePortPlaceholder: 'JSON einfügen oder Exportdatei (.json) wählen — meta.key stickfighter_save_v1 · 2× Import zum Laden',
      privacy: 'Datenschutz',
      ageHint: 'Cartoon-Kampf · ab Teenager · kein Chat',
      installAge: 'Cartoon-Stockfigur-Kämpfe · Teenager+ · kein Chat.',
      langChanged: 'Sprache: {lang}',
    },
    missions: { title: 'Missionen & Erfolge', sub: '3 tägliche Missionen · XP abholen',
      claimAll: 'Alle abholen', claimAllSub: '+XP auf einmal', dayBonus: 'Tagesbonus', dayBonusSub: '+80 XP',
      achievements: 'Erfolge' },
    pets: { title: 'Pets · Begleiter', sub: 'Dex-Pets & Ei-Pets', crackEgg: 'Tages-Ei öffnen', crackEggSub: 'Gratis Pull' },
    dex: { title: 'Monsterbuch', sub: '{n} Arten · Seltenheit = HP · Farm / Zoo / Meer' },
    help: { title: 'Tipps & Steuerung' },
    install: { title: 'Zum Home-Bildschirm', sub: 'Wie eine echte App' },
    island: {
      1: { name: 'Ost-Insel', sub: 'Lv 1–10' }, 2: { name: 'Feuer-Insel', sub: 'Lv 11–20' },
      3: { name: 'Neon-Insel', sub: 'Lv 21–30' }, 4: { name: 'Tempel-Insel', sub: 'Lv 31–40' },
      5: { name: 'Finale-Insel', sub: 'Lv 41–50' },
      6: { name: 'Albtraum', sub: 'Lv 51–60' },
      7: { name: 'Hölle', sub: 'Lv 61–70' },
      progress: 'Insel {cur}/7 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'Legendär', mythic: 'Mythisch', nightmare: 'Albtraum', hell: 'Hölle' },
    audio: { musicOff: 'Musik aus', sfxOff: 'Sound aus', musicPct: 'Musik {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM gedämpft' },
  },
  fr: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Niveaux' },
    common: { backHome: 'Retour au menu', ok: 'Compris !', offline: 'Hors ligne' },
    menu: {
      continue: 'Continuer', adventure: 'Aventure', adventureSub: 'Histoire · îles · boss',
      arcade: 'Arcade', arcadeSub: 'Entraînement · Mur · Pièces', versus: '2 joueurs', versusSub: 'Local · iPad paysage',
      collect: 'Collection', collectSub: 'Armes · style · bestiaire', music: 'Musique', missions: 'Missions',
      options: 'Options', tips: 'Astuces', fresh: 'Version fraîche', install: 'Ajouter à l\'écran d\'accueil', installSub: 'Une icône sur l\'appareil',
      pressStart: 'insert coin', missionReady: 'mission prête', dayBonus: 'Bonus du jour',
      choosePath: 'CHOISIS TON CHEMIN',
    },
    hub: {
      step: 'Étape 2 · Choisir le mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Sessions rapides · high scores',
      collectTitle: 'Collection', collectSub: 'Armes · pets · styles · bestiaire',
      training: 'Entraînement vs RabbitRobot', trainingSub: '1v1 · pratique',
      wall: 'Mur à détruire', wallSub: '60 s · combo = plus vite',
      mats: 'Bonus pièces', matsSub: '45 s · pièces → pet coins',
      weapons: 'Armes', weaponsSub: '26 armes · invocations',
      pets: 'Pets', petsSub: 'Pièces · dex · œufs',
      style: 'Style', styleSub: 'Déblocages tenues',
      skills: 'Skills', skillsSub: 'Spéciaux énergie · Spiral Orb · Wave Cannon',
      dex: 'Bestiaire', dexSub: '{n} espèces · rareté = PV · ferme · zoo · mer',
      modes3: '3 modes rapides', fightersLocal: '20 combattants · local', vsRecord: '{w}/{m} victoires',
    },
    modes: { adventure: 'Aventure', training: 'Entraînement', wall: 'Mur', versus: '2 joueurs', coinrun: 'Pièces' },
    pause: {
      title: 'Pause', sub: 'Spiral Orb prêt — go ! · progrès sur cet appareil',
      resume: 'Reprendre', music: 'Musique', sfx: 'Son', quit: 'Quitter au menu',
      quitArcade: 'Stop & Arcade',
      vsRestart: 'Recommencer', vsRestartSub: '0-0 · mêmes combattants',
      vsSwap: 'Changer de côté', vsSwapSub: 'P1 ↔ P2 · même score',
      audioHint: 'Volume en pause — sync avec Options',
    },
    result: { again: 'Rejouer', next: 'Niveau suivant', menu: 'Menu principal', menuArcade: 'Arcade', rematch: 'Revanche', rematchSub: 'Mêmes combattants',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Options', sub: 'Son, vibrations & HUD — sauvegardé sur cet appareil',
      lang: 'Langue / Language', music: 'Musique', sfx: 'Effets', shake: 'Secousse écran', haptics: 'Vibration (iPad)',
      comboHud: 'HUD combo', bigTouch: 'Gros boutons (iPad)',
      kbLegend: 'Légende clavier (PC)', showTouchPads: 'Toujours boutons tactile',
      reducedMotion: 'Moins de mouvement',
      liteFx: 'Lite FX (plus rapide)', highContrast: 'Contraste élevé', restoreBackup: 'Restaurer backup',
      syncBackup: 'Sync backup', freshCache: 'Version fraîche (cache)', clearSave: 'Nouveau départ (2× tap)',
      hosting: 'Hébergement & progrès', copyLink: 'Copier le lien', openLink: 'Ouvrir le lien',
      savePort: 'Export / import save', exportSave: 'Exporter save', importSave: 'Importer save',
      importSaveFile: 'Choisir fichier',
      savePortDesc: 'Export copie le JSON (presse-papiers + téléchargement). Import : choisir un fichier ou coller le JSON — 1× Import = aperçu, 2× = appliquer.',
      savePortPlaceholder: 'Coller le JSON ou choisir un fichier (.json) — meta.key stickfighter_save_v1 · 2× Import pour charger',
      privacy: 'Confidentialité',
      ageHint: 'Combat cartoon · ados+ · pas de chat',
      installAge: 'Combats stickman cartoon · ados+ · pas de chat.',
      langChanged: 'Langue : {lang}',
    },
    missions: { title: 'Missions & succès', sub: '3 missions quotidiennes · réclamer XP',
      claimAll: 'Tout réclamer', claimAllSub: '+XP en un tap', dayBonus: 'Bonus du jour', dayBonusSub: '+80 XP',
      achievements: 'Succès' },
    pets: { title: 'Pets · Compagnons', sub: 'Pets dex & œufs arcade', crackEgg: 'Ouvrir l\'œuf du jour', crackEggSub: 'Tir gratuit' },
    dex: { title: 'Bestiaire', sub: '{n} espèces · rareté = PV · ferme / zoo / mer' },
    help: { title: 'Astuces & contrôles' },
    install: { title: 'Ajouter à l\'écran d\'accueil', sub: 'Comme une vraie app' },
    island: {
      1: { name: 'Île de l\'Est', sub: 'Lv 1–10' }, 2: { name: 'Île de Feu', sub: 'Lv 11–20' },
      3: { name: 'Île Néon', sub: 'Lv 21–30' }, 4: { name: 'Île Temple', sub: 'Lv 31–40' },
      5: { name: 'Île Finale', sub: 'Lv 41–50' },
      6: { name: 'Cauchemar', sub: 'Lv 51–60' },
      7: { name: 'Enfer', sub: 'Lv 61–70' },
      progress: 'Île {cur}/7 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire', mythic: 'Mythique', nightmare: 'Cauchemar', hell: 'Enfer' },
    audio: { musicOff: 'Musique off', sfxOff: 'Son off', musicPct: 'Musique {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM atténué' },
  },
  es: {
    back: { menu: '← Menú', collect: '← Colección', levels: '← Niveles' },
    common: { backHome: 'Volver al menú', ok: '¡Entendido!', offline: 'Sin conexión' },
    menu: {
      continue: 'Continuar', adventure: 'Aventura', adventureSub: 'Historia · islas · jefes',
      arcade: 'Arcade', arcadeSub: 'Entrenamiento · Muro · Monedas', versus: '2 jugadores', versusSub: 'Local · iPad horizontal',
      collect: 'Colección', collectSub: 'Armas · estilo · bestiario', music: 'Música', missions: 'Misiones',
      options: 'Opciones', tips: 'Consejos', fresh: 'Versión nueva', install: 'Añadir a inicio', installSub: 'Un icono en tu dispositivo',
      pressStart: 'insert coin', missionReady: 'misión lista', dayBonus: 'Bonus diario',
      choosePath: 'ELIGE TU CAMINO',
    },
    hub: {
      step: 'Paso 2 · Elige modo', solo: 'SOLO', collection: 'COLECCIÓN',
      arcadeTitle: 'Arcade', arcadeSub: 'Sesiones rápidas · high scores',
      collectTitle: 'Colección', collectSub: 'Armas · pets · estilos · bestiario',
      training: 'Entrenamiento vs RabbitRobot', trainingSub: '1v1 · practicar',
      wall: 'Romper muro', wallSub: '60 s · combo = más rápido',
      mats: 'Bonus monedas', matsSub: '45 s · monedas → pet coins',
      weapons: 'Armas', weaponsSub: '26 armas · invocaciones',
      pets: 'Pets', petsSub: 'Monedas · dex · huevos',
      style: 'Estilo', styleSub: 'Desbloqueos de outfit',
      skills: 'Skills', skillsSub: 'Especiales energía · Spiral Orb · Wave Cannon',
      dex: 'Bestiario', dexSub: '{n} especies · rareza = HP · granja · zoo · mar',
      modes3: '3 modos rápidos', fightersLocal: '20 luchadores · local', vsRecord: '{w}/{m} ganados',
    },
    modes: { adventure: 'Aventura', training: 'Entrenamiento', wall: 'Muro', versus: '2 jugadores', coinrun: 'Monedas' },
    pause: {
      title: 'Pausa', sub: 'Spiral Orb listo — ¡ya! · progreso en este dispositivo',
      resume: 'Seguir', music: 'Música', sfx: 'Sonido', quit: 'Salir al menú',
      quitArcade: 'Parar y Arcade',
      vsRestart: 'Reiniciar partida', vsRestartSub: '0-0 · mismos luchadores',
      vsSwap: 'Cambiar lado', vsSwapSub: 'P1 ↔ P2 · mismo marcador',
      audioHint: 'Volumen en pausa — sync con Opciones',
    },
    result: { again: 'Otra vez', next: 'Siguiente nivel', menu: 'Menú principal', menuArcade: 'Arcade', rematch: 'Revancha', rematchSub: 'Mismos luchadores',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Opciones', sub: 'Sonido, vibración y HUD — guardado en este dispositivo',
      lang: 'Idioma / Language', music: 'Música', sfx: 'Efectos', shake: 'Sacudida pantalla', haptics: 'Vibración (iPad)',
      comboHud: 'HUD combo', bigTouch: 'Botones grandes (iPad)',
      kbLegend: 'Leyenda teclado (PC)', showTouchPads: 'Siempre botones táctiles',
      reducedMotion: 'Menos movimiento',
      liteFx: 'Lite FX (más rápido)', highContrast: 'Alto contraste', restoreBackup: 'Restaurar backup',
      syncBackup: 'Sync backup', freshCache: 'Versión nueva (caché)', clearSave: 'Nuevo inicio (2× tap)',
      hosting: 'Hosting y progreso', copyLink: 'Copiar enlace', openLink: 'Abrir enlace',
      savePort: 'Export / import save', exportSave: 'Exportar save', importSave: 'Importar save',
      importSaveFile: 'Elegir archivo',
      savePortDesc: 'Export copia JSON (portapapeles + descarga). Import: elige un archivo o pega JSON — 1× Import = vista previa, 2× = aplicar.',
      savePortPlaceholder: 'Pega JSON o elige un archivo (.json) — meta.key stickfighter_save_v1 · 2× Import para cargar',
      privacy: 'Privacidad',
      ageHint: 'Combate cartoon · teens+ · sin chat',
      installAge: 'Combates stickman cartoon · teens+ · sin chat.',
      langChanged: 'Idioma: {lang}',
    },
    missions: { title: 'Misiones y logros', sub: '3 misiones diarias · reclamar XP',
      claimAll: 'Reclamar todo', claimAllSub: '+XP de una vez', dayBonus: 'Bonus diario', dayBonusSub: '+80 XP',
      achievements: 'Logros' },
    pets: { title: 'Pets · Compañeros', sub: 'Pets dex y huevos arcade', crackEgg: 'Abrir huevo diario', crackEggSub: 'Tirada gratis' },
    dex: { title: 'Bestiario', sub: '{n} especies · rareza = HP · granja / zoo / mar' },
    help: { title: 'Consejos y controles' },
    install: { title: 'Añadir a inicio', sub: 'Como una app real' },
    island: {
      1: { name: 'Isla Este', sub: 'Lv 1–10' }, 2: { name: 'Isla Fuego', sub: 'Lv 11–20' },
      3: { name: 'Isla Neón', sub: 'Lv 21–30' }, 4: { name: 'Isla Templo', sub: 'Lv 31–40' },
      5: { name: 'Isla Final', sub: 'Lv 41–50' },
      6: { name: 'Pesadilla', sub: 'Lv 51–60' },
      7: { name: 'Infierno', sub: 'Lv 61–70' },
      progress: 'Isla {cur}/7 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Común', uncommon: 'Poco común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario', mythic: 'Mítico', nightmare: 'Pesadilla', hell: 'Infierno' },
    audio: { musicOff: 'Música off', sfxOff: 'Sonido off', musicPct: 'Música {pct}%', sfxPct: 'SFX {pct}%', bgmDuckPause: ' · BGM atenuado' },
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

function setTitle(id, key, params) {
  const el = document.getElementById(id);
  if (el) el.title = t(key, params);
}

function applyLangStaticScreens() {
  if (!canApplyDomI18n()) return;
  if (document.documentElement) document.documentElement.lang = getLang();
  const net = document.getElementById('netStatus');
  if (net) net.textContent = t('common.offline');

  setText('menuLangLbl', 'settings.lang');
  setText('pressStartLine', 'menu.pressStart');
  setText('menuArcadePre', 'menu.choosePath');
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
    ['btnSkills', 'hub.skills', 'hub.skillsSub'],
    ['btnDex', 'hub.dex', 'hub.dexSub'],
  ];
  for (const [id, titleKey, subKey] of modeRows) {
    const btn = document.getElementById(id);
    const div = btn && btn.querySelector('div');
    if (!div) continue;
    const stat = div.querySelector('.hub-mode-stat');
    const statHtml = stat ? stat.outerHTML : '';
    const subParams = (id === 'btnDex' && typeof SPECIES_ORDER !== 'undefined')
      ? { n: SPECIES_ORDER.length }
      : undefined;
    div.innerHTML = t(titleKey) + '<small>' + t(subKey, subParams) + '</small>' + statHtml;
  }

  document.querySelectorAll('.sub-home-btn .sub-home-label').forEach((el) => {
    el.textContent = t('common.backHome');
  });

  setText('settingsHead', 'settings.title');
  setText('settingsSub', 'settings.sub');
  setText('setLangLbl', 'settings.lang');
  const setMap = [
    ['setShake', 'settings.shake'], ['setHaptics', 'settings.haptics'], ['setComboHud', 'settings.comboHud'],
    ['setBigTouch', 'settings.bigTouch'], ['setKbLegend', 'settings.kbLegend'], ['setShowTouchPads', 'settings.showTouchPads'],
    ['setReducedMotion', 'settings.reducedMotion'],
    ['setLiteFx', 'settings.liteFx'], ['setHighContrast', 'settings.highContrast'],
    ['btnRestoreBackup', 'settings.restoreBackup'], ['btnSyncBackup', 'settings.syncBackup'],
    ['btnForceFresh', 'settings.freshCache'], ['btnClearSave', 'settings.clearSave'],
    ['btnCopyLink', 'settings.copyLink'], ['btnOpenPlayLink', 'settings.openLink'],
    ['btnExportSave', 'settings.exportSave'], ['btnImportSaveFile', 'settings.importSaveFile'], ['btnImportSave', 'settings.importSave'],
    ['btnPrivacy', 'settings.privacy'],
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
  const savePortDesc = document.getElementById('savePortDesc');
  if (savePortDesc) savePortDesc.textContent = t('settings.savePortDesc');
  const savePortText = document.getElementById('savePortText');
  if (savePortText) savePortText.placeholder = t('settings.savePortPlaceholder');
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
  setText('dexScreenSub', 'dex.sub', typeof SPECIES_ORDER !== 'undefined' ? { n: SPECIES_ORDER.length } : undefined);
  setText('helpHead', 'help.title');
  setText('installHead', 'install.title');
  setText('installSub', 'ui.installSub');
  setText('installAgeHint', 'settings.installAge');
  setText('menuAgeHint', 'settings.ageHint');
  const privMenu = document.getElementById('menuPrivacyLink');
  if (privMenu) privMenu.textContent = t('settings.privacy');


  setText('charArenaPre', 'ui.charArenaPre');
  setText('charSelectHead', 'ui.charHead');
  setText('charSelectRosterLine', 'ui.charRosterLine');
  setText('levelScreenHead', 'ui.levelHead');
  setText('levelScreenSub', 'ui.levelSub');
  setTitle('btnIslandHelp', 'ui.helpIslandBtnTitle');
  setText('gambleSub', 'ui.gambleSub');
  setText('styleScreenHead', 'ui.styleHead');
  setText('styleScreenSub', 'ui.styleSub');
  setText('skillScreenHead', 'ui.skillSummaryHead');
  setText('skillScreenSub', 'ui.skillSub');
  setText('upgradeScreenHead', 'ui.skillHead');
  setText('upgradeScreenSub', 'ui.skillSub');
  setText('superSectionHead', 'ui.superHead');
  setText('superSectionSub', 'ui.superSub');
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
  if (pauseResume) {
    const d = pauseResume.querySelector('div');
    if (d) d.textContent = t('pause.resume');
  }
  const pauseQuit = document.getElementById('pauseQuit');
  if (pauseQuit) {
    const d = pauseQuit.querySelector('div');
    if (d) {
      const arcade = typeof hubForPlayMode === 'function'
        && hubForPlayMode(typeof game !== 'undefined' && game && game.mode) === 'arcade';
      d.textContent = t(arcade ? 'pause.quitArcade' : 'pause.quit');
    }
  }
  const pauseVs = document.getElementById('pauseVsRestart');
  if (pauseVs) {
    const d = pauseVs.querySelector('div');
    if (d) d.innerHTML = t('pause.vsRestart') + '<small>' + t('pause.vsRestartSub') + '</small>';
  }
  const pauseVsSwapEl = document.getElementById('pauseVsSwap');
  if (pauseVsSwapEl) {
    const d = pauseVsSwapEl.querySelector('div');
    if (d) d.innerHTML = t('pause.vsSwap') + '<small>' + t('pause.vsSwapSub') + '</small>';
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
  const pausePresets = [
    ['pauseAudioMuteAll', 'pause.audioMuteAll'],
    ['pauseAudioRestore', 'pause.audioRestore'],
    ['pauseAudioSfxOnly', 'pause.audioSfxOnly'],
  ];
  for (const [id, key] of pausePresets) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }

  const resAgain = document.getElementById('resAgain');
  if (resAgain) {
    const d = resAgain.querySelector('div');
    if (d) d.textContent = t('result.again');
  }
  const resNext = document.getElementById('resNext');
  if (resNext) {
    const d = resNext.querySelector('div');
    if (d) d.textContent = t('result.next');
  }
  const resMenu = document.getElementById('resMenu');
  if (resMenu) {
    const d = resMenu.querySelector('div');
    if (d) {
      const mode = (typeof UI !== 'undefined' && UI.lastResult && UI.lastResult.mode)
        || (typeof game !== 'undefined' && game && game.mode);
      const arcade = typeof hubForPlayMode === 'function' && hubForPlayMode(mode) === 'arcade';
      d.textContent = t(arcade ? 'result.menuArcade' : 'result.menu');
    }
  }
  const helpOk = document.getElementById('helpOk');
  if (helpOk) {
    const d = helpOk.querySelector('div');
    if (d) d.textContent = t('common.ok');
  }

  UI.pauseSubDefault = t('pause.sub');
  if (!UI.BACK_LABELS) UI.BACK_LABELS = {};
  Object.assign(UI.BACK_LABELS, {
    modeHubScreen: t('back.menu'),
    levelScreen: t('back.menu'),
    gambleScreen: t('back.levels'),
    summonScreen: t('back.menu'),
    weaponScreen: t('back.collect'),
    petScreen: t('back.collect'),
    styleScreen: t('back.collect'),
    skillScreen: t('back.collect'),
    upgradeScreen: t('back.collect'),
    dexScreen: t('back.collect'),
    charSelectScreen: t('back.menu'),
    missionsScreen: t('back.menu'),
    settingsScreen: t('back.menu'),
    helpScreen: t('back.menu'),
    installScreen: t('back.menu'),
  });
  UI.syncBackLabels();
}

function renderLangSwitchBar(bar) {
  if (!bar) return;
  const cur = getLang();
  bar.innerHTML = SUPPORTED_LANGS.map((code) =>
    `<button type="button" class="dex-filter-btn${cur === code ? ' active' : ''}" data-lang="${code}">${LANG_LABELS[code]}</button>`
  ).join('');
  bar.querySelectorAll('[data-lang]').forEach((btn) => {
    const code = btn.getAttribute('data-lang');
    if (!code) return;
    btn.dataset.langBound = '1';
    bindPress(btn, () => {
      if (code === getLang()) return;
      safeUiAction(() => {
        setLang(code);
        AudioSys.sfx('select');
        UI.toast(t('settings.langChanged', { lang: LANG_LABELS[code] }), 2200);
        UI.renderSettings();
        UI.renderMenu();
        if (typeof UI.renderModeHub === 'function') UI.renderModeHub();
      }, 'setLang/' + code, t('ui.langSwitchFail') || 'Language switch failed');
    });
  });
}

function renderLangSwitch() {
  renderLangSwitchBar(document.getElementById('langSwitchBar'));
  renderLangSwitchBar(document.getElementById('menuLangBar'));
  renderLangSwitchBar(document.getElementById('levelLangBar'));
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
    else if (active === 'skillScreen' && typeof UI.renderSkills === 'function') UI.renderSkills();
    else if (active === 'charSelectScreen' && typeof UI.renderCharSelect === 'function') UI.renderCharSelect();
    else if (active === 'levelScreen' && typeof UI.renderLevels === 'function') UI.renderLevels();
    else if (active === 'gambleScreen' && typeof UI.renderGamble === 'function' && pendingAdvLevel) {
      UI.renderGamble(pendingAdvLevel);
    } else if (active === 'petScreen' && typeof UI.renderDexPets === 'function') UI.renderDexPets();
    else if (active === 'dexScreen' && typeof UI.renderDex === 'function') UI.renderDex();
    else if (active === 'skillScreen' && typeof UI.renderSkills === 'function') UI.renderSkills();
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
