/* ============================== I18N =================================== */
const SUPPORTED_LANGS = ['nl', 'en', 'de', 'fr', 'es'];
const LANG_LABELS = { nl: 'NL', en: 'EN', de: 'DE', fr: 'FR', es: 'ES' };

const I18N = {
  nl: {
    back: { menu: '← Menu', collect: '← Collectie', levels: '← Levels' },
    common: { backHome: 'Terug naar menu', ok: 'Begrepen!', offline: 'Offline' },
    net: {
      updateReady: 'Nieuwe versie klaar — tik om te laden',
      updateWait: 'Nieuwe versie — laadt in het menu',
      dismiss: 'Sluiten',
      offlinePlay: 'Offline — speelt uit cache · save blijft hier',
      offlinePlayHint: 'Offline — uit cache · icoon in de lade = altijd spelen',
      offlineMenu: 'Offline — menu & save uit cache',
      offlineNeedOnce: 'Offline — open 1× online, daarna speelt het zonder net',
      backOnline: 'Weer online',
      cacheLoading: 'Cache laden… — daarna ook offline',
      offlineReady: 'Klaar voor offline — save blijft hier',
    },
    menu: {
      continue: 'Verder spelen', adventure: 'Avontuur', adventureSub: 'Verhaal · eilanden · bazen',
      arcade: 'Arcade', arcadeSub: 'Training · Muur · Muntjes', versus: '2 spelers', versusSub: 'Lokaal',
      collect: 'Collectie', collectSub: 'Wapens · figuur · boek', music: 'Muziek', missions: 'Missies',
      summons: 'Summons', summonsSub: 'Dagelijkse kist · wapen & pet',
      buildings: 'Fabrieken', buildingsSub: 'Werken · oogst · upgrade',
      options: 'Opties', tips: 'Tips', fresh: 'Verse versie', install: 'Zet in app-lade', installSub: 'Één icoon, zoals een echte app',
      pressStart: 'insert coin', missionReady: 'missie klaar', dayBonus: 'Dagbonus',
      choosePath: 'KIES JE PAD', lastPlayed: 'LAATST', playHere: 'SPEEL', saveSync: 'save OK',
      startGame: 'SPELEN', startSub: 'Start het gevecht',
      titleName: 'Naam — hoeft niet', titleNamePh: 'Bijnaam (optioneel)',
      titleNote: 'Geen account — je save blijft op deze telefoon',
      titleGreet: 'Hoi, {name}',
      splash0: 'Laden…', splash1: 'Laden…', splash2: 'Laden…', splash3: 'Klaar',
    },
    hub: {
      step: 'Stap 2 · Kies modus', solo: 'SOLO', collection: 'COLLECTIE',
      arcadeTitle: 'Arcade', arcadeSub: 'Snelle sessies · save blijft hier',
      collectTitle: 'Collectie', collectSub: 'Uitrusting · wapens · pets · stijl',
      gear: 'Uitrusting', gearSub: 'Slots · look',
      training: 'Training', trainingSub: '1v1 · RabbitRobot · oefenen',
      wall: 'Muur Slopen', wallSub: '60 sec · combo = sneller',
      mats: 'Muntjes', matsSub: '45 sec · munten → pet coins',
      weapons: 'Wapens', weaponsSub: '26 wapens · summon ascends',
      pets: 'Pets', petsSub: 'Muntjes · dex temmen · ei arcade',
      style: 'Stijl', styleSub: 'Bandana & outfit unlocks',
      gear: 'Uitrusting', gearSub: '5 slots · pantser & cosmetics',
      skills: 'Skills', skillsSub: 'Energy specials · Spiral Orb · Wave Cannon',
      upgrades: 'Upgrades', upgradesSub: 'Shards · technique uitrusten',
      dex: 'Monsterboek', dexSub: '{n} soorten · rariteit = HP · boerderij · zoo · zee · woud',
      modes3: '3 snelle modi', fightersLocal: '20 vechters · lokaal', vsRecord: '{w}/{m} gewonnen',
      statTrain: '{n}× training', statWall: 'muur {n}', statMats: '{n} munten',
      loadFail: 'Hub laden mislukt',
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
      trainAgainSub: 'vs RabbitRobot',
      advWin: 'GEWONNEN!', advLose: 'VERLOREN', trainWin: 'KAMPIOEN!', trainLose: 'ROBOT WINT...',
      advLoseKeep: 'XP en loot van deze run blijven',
      wavesStart: 'begin',
      xp: '+{xp} XP verdiend · nu Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Instellingen', sub: 'Geluid & HUD — save gaat automatisch mee',
      lang: 'Taal', music: 'Muziek', sfx: 'Effecten', shake: 'Schermschok', haptics: 'Trillen',
      aimHead: 'Mik-indicator', aimHint: 'Kleur en grootte van de straal als je omhoog of omlaag mikt met de beweegbalk.',
      aimColor: 'Kleur', aimRadius: 'Grootte', aimPick: 'Kies zelf',
      comboHud: 'Combo-HUD', bigTouch: 'Grote knoppen',
      kbLegend: 'Toetsenbord-hulp', showTouchPads: 'Touch-knoppen altijd',
      reducedMotion: 'Minder beweging',
      liteFx: 'Lite FX', highContrast: 'Hoog contrast tekst', restoreBackup: 'Herstel save uit backup',
      a11yMotionOn: 'Minder beweging: aan', a11yMotionOs: 'Minder beweging: via systeem',
      a11yContrastOn: 'Hoog contrast: aan', a11yContrastOs: 'Hoog contrast: via systeem',
      a11yDefault: 'Toegankelijkheid: standaard — schakel hierboven of in je telefoon-instellingen',
      a11yTip: 'Minder beweging = rustigere banners. Hoog contrast = dikkere randen. Lite FX = soepeler op telefoon.',
      sfxSamplesOn: 'Geluidseffecten: geladen',
      sfxSamplesLoad: 'Geluidseffecten: laden…',
      sfxSamplesOff: 'Geluidseffecten: offline',
      saveAuto: 'Save gaat automatisch mee',
      saveAutoLine: 'Lv {lvl} · OK op dit apparaat',
      saveAutoBad: 'Lv {lvl} · check — open Bestand / offline',
      saveAutoHint: 'Online-save blijft vanzelf bij deze speel-link. Geen extra knop.',
      saveOfflineFold: 'Bestand / offline',
      saveOfflineTitle: 'Los pad — alleen als je een bestand wilt',
      saveOfflineOk: 'Bestandskopie klaar',
      saveOfflineBad: 'Hoofd-save check',
      saveOfflineBackup: 'Backup Lv {lvl}',
      saveOfflineDrift: 'Hoofd en backup verschillen',
      helpFold: 'Hulp',
      helpTitle: 'Vast op een oude versie?',
      helpDesc: 'Leegt de cache en laadt opnieuw. Alleen nodig als het spel niet meekomt.',
      syncBackup: 'Backup bijwerken', freshCache: 'Verse versie', clearSave: 'Nieuwe start (dubbel tikken)',
      syncHint: 'Zet de backup gelijk aan je huidige voortgang.',
      freshHint: 'Menu reageert niet? Tik hier voor de nieuwste versie.',
      hosting: 'Speel-link', copyLink: 'Kopieer speel-link', openLink: 'Open speel-link',
      playLinkOk: '✓ Speel-link — deel met vrienden (Android)',
      playLinkPages: 'Deel speel.html (Pages): ',
      shareHintAndroid: 'Deel deze link met vrienden. Op Android: Chrome → App installeren.',
      masteryHead: 'Top stijl-meesterschap',
      masteryTiers: 'Tiers: Leerling → Virtuoos (3) → Meester (10) → Legende (25)',
      savePort: 'Voortgang kopiëren', exportSave: 'Kopieer save', importSave: 'Laad save',
      importSaveFile: 'Bestand kiezen',
      savePortDesc: 'Gewone save blijft automatisch. Dit pad is alleen voor een ander apparaat of een bestand. Laden: bestand of plakken — 1× kijken, 2× laden.',
      savePortPlaceholder: 'Plak je save hier, of kies een bestand',
      privacy: 'Privacy',
      ageHint: 'Cartoon-gevecht · tiener+ · geen chat',
      installAge: 'Cartoon-gevechten · tiener+ · geen chat.',
      langChanged: 'Taal: {lang}',
    },
    season: {
      title: 'Seizoen',
      hint: 'Laag boven het originele scherm. Auto volgt de kalender. Blijft op dit apparaat.',
      auto: 'Auto',
      classic: 'Klassiek',
      jungle: 'Jungle',
      halloween: 'Halloween',
      winter: 'Winter',
      summer: 'Zomer',
      calendarNow: 'Kalender nu: {name}',
      autoSuggest: 'Auto · {name}',
      picked: 'Seizoen: {name}',
      blurb: {
        classic: 'De klassieke arena — geen extra laag, puur Stickman.',
        jungle: 'Lianen over de oude arena. De jungle fluistert: blijf laag, sla hard.',
        halloween: 'Pompoenen aan de rand. Iets grijnst mee vanuit het donker — vecht toch.',
        winter: 'Vorst op de randen. Sneeuw-art volgt — de arena blijft van jou.',
        summer: 'Zomerhitte over het scherm. Zon-art volgt — de knoppen blijven vrij.',
      },
    },
    missions: { title: 'Missies & prestaties', sub: '3 missies per dag',
      claimAll: 'Claim alle klaar', claimAllSub: '+XP in één tik', dayBonus: 'Dagbonus', dayBonusSub: '+80 XP · alle 3 geclaimd',
      achievements: 'Prestaties' },
    fomo: {
      ritualTitle: 'Vandaag',
      ritualCtaSummon: 'Naar summons',
      ritualCtaMission: 'Speel missie',
      ritualCtaAdv: 'Naar avontuur',
      ritualDismiss: 'Sluiten',
      ritualReopen: 'Dagoverzicht',
      resetIn: 'Nieuw over {reset}',
      rowSummons: 'Summons {left}/{total}',
      rowEggReady: 'Dag-ei klaar',
      rowEggDone: 'Dag-ei al open',
      streakReward3: '+1 summon',
      streakReward7: '+ei of summons',
      streakReward14: '+120 XP',
    },
    pets: { title: 'Pets · Metgezels', sub: 'Dex-pets via monsterboek · Ei-pets via dagelijkse arcade-pull',
      crackEgg: 'Dag-ei openen', crackEggSub: 'Gratis arcade-pull' },
    dex: { title: 'Monsterboek', sub: '{n} soorten · rariteit = HP · boerderij / zoo / zee / woud / crypte · 4 rariteiten = Kristallijn' },
    help: { title: 'Tips & controls' },
    gear: {
      title: 'Uitrusting', sub: '5 slots · pantser & cosmetics · level + tijd-gate',
      flagVanity: 'Alleen look — geen stats', flagStats: '+ stats', flagArmour: 'Pantser',
      needLvl: 'Vrij vanaf Lv {n}', needDays: 'Vrij vanaf dag {n}',
      equip: 'Uitrusten', equipped: 'Aan', empty: 'Leeg',
      slot: { head: 'Hoofd', chest: 'Borst', hands: 'Handen', legs: 'Benen', back: 'Rug' },
    },
    install: { title: 'Zet in app-lade', sub: 'Één icoon, zoals een echte app' },
    island: {
      1: { name: 'Oost-eiland', sub: 'Lv 1–10' }, 2: { name: 'Vuur-eiland', sub: 'Lv 11–20' },
      3: { name: 'Neon-eiland', sub: 'Lv 21–30' }, 4: { name: 'Tempel-eiland', sub: 'Lv 31–40' },
      5: { name: 'Finale-eiland', sub: 'Lv 41–50' },
      6: { name: 'Nachtmerrie', sub: 'Lv 51–60' },
      7: { name: 'Hel', sub: 'Lv 61–70' },
      progress: 'Eiland {cur}/7 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    buildings: {
      title: 'Fabrieken',
      sub: 'Vijf werken · oogst op tijd · upgrade',
      hubStatReady: '{n} klaar om te oogsten', hubStatIdle: '5 werken',
      hubStatLocked: '{n}/{total} open',
      level: 'Lv {n}', locked: 'Op slot',
      lockWorld: 'Open {name} (wereld {n})',
      collect: 'Oogsten', collectSub: '{n} {res} klaar', collectEmpty: 'Nog niks klaar',
      collectDone: '+{n} {res}',
      upgrade: 'Upgrade', upgradeSub: '{cost} pet coins · Lv {next}',
      upgradeMax: 'Max level', upgradeNeed: 'Nog {need} pet coins',
      upgradeOk: '{name} → Lv {lv}',
      nextIn: 'Volgende over {t}', stored: '{n}/{cap} opgeslagen',
      stubNote: 'Systems-API nog niet gemerged — stub-productie',
      liveNote: 'Live systems-API',
      loadFail: 'Fabrieken laden mislukt',
      build: 'Bouwen', buildHint: 'Bouwen als eiland open is',
      lockedWorld: 'Unlock: eiland {n}',
      rateLine: '{n}/uur · {pending} wacht · cap {cap}',
      collected: '+{n} {res} · {name}',
      collectedAll: 'Oogst +{n} uit {k} gebouwen',
      waveHeal: '+{n} HP',
      stick_lighter: { name: 'Stok-Aansteker Fabriek', blurb: 'Scheef schuurtje dat stokken tegen elkaar wrijft tot ze vonken geven.' },
      stick_lighterSub: 'Vonken · Oost-eiland',
      woodchip_glue: { name: 'Houtsnipper-Lijm Fabriek', blurb: 'Kookt zaagsel tot een pasta die harder plakt dan een combo. Niet likken.' },
      woodchip_glueSub: 'Lijm · Vuur-eiland',
      chipping_wood: { name: 'Versnipper-Hout Fabriek', blurb: 'Vrolijke versnipperaar die TIMBER fluistert en nuttige snippers hoest.' },
      chipping_woodSub: 'Snippers · Neon-eiland',
      bamboo_boesa: { name: 'Bamboe-Boesa Ketel', blurb: 'Vuur-ketel die holle boesa-bamboe stoomt tot de stengels fluiten.' },
      bamboo_boesaSub: 'Stoom · Tempel-eiland',
      echo_whistle: { name: 'Echo-Fluitmolen', blurb: 'Molenrad dat lucht tot taunts maalt. Het gebouw scheldt terug.' },
      echo_whistleSub: 'Echo · Finale-eiland',
      bamboo_boesa_boiler: { name: 'Bamboe-Boesa Ketel' }, echo_whistle_mill: { name: 'Echo-Fluitmolen' },
      res: { spark: 'Vonken', glue: 'Lijm', chip: 'Snippers', steam: 'Stoom', echo: 'Echo', embers: 'sintels', chips: 'chips', echoes: 'echo' },
    },
    rarity: { common: 'Gewoon', uncommon: 'Ongewoon', rare: 'Zeldzaam', epic: 'Episch', legendary: 'Legendarisch', mythic: 'Mythisch', nightmare: 'Nachtmerrie', hell: 'Hel' },
    audio: {
      musicOff: 'Muziek uit', sfxOff: 'Geluid uit', musicPct: 'Muziek {pct}%', sfxPct: 'SFX {pct}%',
      allMuted: 'Alles stil', pauseDuck: 'BGM zacht', pauseTrack: 'Track: {track}',
      ctxSuspended: 'Tik slider voor geluid',
      track: { menu: 'Menu', menu2: 'Menu 2', menu3: 'Menu 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
        battle: 'Gevecht', elite: 'Elite', boss: 'Baas', wall: 'Muur', training: 'Training', coinrun: 'Mats' },
    },
  },
  en: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Levels' },
    common: { backHome: 'Back to menu', ok: 'Got it!', offline: 'Offline' },
    net: {
      updateReady: 'New version ready — tap to load',
      updateWait: 'New version — loads in the menu',
      dismiss: 'Dismiss',
      offlinePlay: 'Offline — playing from cache · save stays here',
      offlinePlayHint: 'Offline — from cache · home-screen icon = always play',
      offlineMenu: 'Offline — menu & save from cache',
      offlineNeedOnce: 'Offline — open once online, then it plays without net',
      backOnline: 'Back online',
      cacheLoading: 'Loading cache… — then it works offline',
      offlineReady: 'Ready offline — save stays here',
    },
    menu: {
      continue: 'Continue', adventure: 'Adventure', adventureSub: 'Story · islands · bosses',
      arcade: 'Arcade', arcadeSub: 'Training · Wall · Coins', versus: '2 players', versusSub: 'Local',
      collect: 'Collection', collectSub: 'Weapons · figure · book', music: 'Music', missions: 'Missions',
      summons: 'Summons', summonsSub: 'Daily chest · weapon & pet',
      buildings: 'Buildings', buildingsSub: 'Factories · collect · upgrade',
      options: 'Options', tips: 'Tips', fresh: 'Fresh version', install: 'Add as app', installSub: 'One icon, like a real app',
      pressStart: 'insert coin', missionReady: 'mission ready', dayBonus: 'Daily bonus',
      choosePath: 'CHOOSE YOUR PATH', lastPlayed: 'LAST', playHere: 'PLAY', saveSync: 'save OK',
      startGame: 'PLAY', startSub: 'Start the fight',
      titleName: 'Name — optional', titleNamePh: 'Nickname (optional)',
      titleNote: 'No account — your save stays on this phone',
      titleGreet: 'Hi, {name}',
      splash0: 'Loading…', splash1: 'Loading…', splash2: 'Loading…', splash3: 'Ready',
    },
    hub: {
      step: 'Step 2 · Pick mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Quick sessions · save stays here',
      collectTitle: 'Collection', collectSub: 'Gear · weapons · pets · style',
      gear: 'Gear', gearSub: 'Slots · look',
      training: 'Training', trainingSub: '1v1 · RabbitRobot · practice',
      wall: 'Wall Smash', wallSub: '60 sec · combo = faster',
      mats: 'Coins', matsSub: '45 sec · coins → pet coins',
      weapons: 'Weapons', weaponsSub: '26 weapons · summon ascends',
      pets: 'Pets', petsSub: 'Coins · dex tame · egg arcade',
      style: 'Style', styleSub: 'Bandana & outfit unlocks',
      gear: 'Loadout', gearSub: '5 slots · armour & cosmetics',
      skills: 'Skills', skillsSub: 'Energy specials · Spiral Orb · Wave Cannon',
      upgrades: 'Upgrades', upgradesSub: 'Shards · equip a technique',
      dex: 'Monster book', dexSub: '{n} species · rarity = HP · farm · zoo · sea · woods',
      modes3: '3 quick modes', fightersLocal: '20 fighters · local', vsRecord: '{w}/{m} won',
      statTrain: '{n} train', statWall: 'wall {n}', statMats: '{n} coins',
      loadFail: 'Could not load hub',
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
      trainAgainSub: 'vs RabbitRobot',
      advWin: 'VICTORY!', advLose: 'VERLOREN', trainWin: 'CHAMPION!', trainLose: 'ROBOT WINS...',
      advLoseKeep: 'XP and loot from this run stay',
      wavesStart: 'start',
      xp: '+{xp} XP earned · now Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Settings', sub: 'Sound & HUD — save stays with you automatically',
      lang: 'Language', music: 'Music', sfx: 'Effects', shake: 'Screen shake', haptics: 'Haptics',
      aimHead: 'Aim indicator', aimHint: 'Color and size of the beam when you aim high or low with the move bar.',
      aimColor: 'Color', aimRadius: 'Size', aimPick: 'Custom',
      comboHud: 'Combo HUD', bigTouch: 'Big buttons',
      kbLegend: 'Keyboard help', showTouchPads: 'Always show touch pads',
      reducedMotion: 'Reduce motion',
      liteFx: 'Lite FX', highContrast: 'High contrast text', restoreBackup: 'Restore save from backup',
      a11yMotionOn: 'Reduce motion: on', a11yMotionOs: 'Reduce motion: via system',
      a11yContrastOn: 'High contrast: on', a11yContrastOs: 'High contrast: via system',
      a11yDefault: 'Accessibility: default — toggle above or in your phone settings',
      a11yTip: 'Reduce motion = calmer banners. High contrast = thicker borders. Lite FX = smoother on phone.',
      sfxSamplesOn: 'Sound effects: loaded',
      sfxSamplesLoad: 'Sound effects: loading…',
      sfxSamplesOff: 'Sound effects: offline',
      saveAuto: 'Save stays with you automatically',
      saveAutoLine: 'Lv {lvl} · OK on this device',
      saveAutoBad: 'Lv {lvl} · check — open File / offline',
      saveAutoHint: 'Online save stays with this play link automatically. No extra button.',
      saveOfflineFold: 'File / offline',
      saveOfflineTitle: 'Separate path — only if you want a file',
      saveOfflineOk: 'File copy ready',
      saveOfflineBad: 'Main save check',
      saveOfflineBackup: 'Backup Lv {lvl}',
      saveOfflineDrift: 'Main and backup differ',
      helpFold: 'Help',
      helpTitle: 'Stuck on an old version?',
      helpDesc: 'Clears the cache and reloads. Only needed if the game does not catch up.',
      syncBackup: 'Update backup', freshCache: 'Fresh version', clearSave: 'New start (tap twice)',
      syncHint: 'Set the backup equal to your current progress.',
      freshHint: 'Menu stuck? Tap here for the newest version.',
      hosting: 'Play link', copyLink: 'Copy play link', openLink: 'Open play link',
      playLinkOk: '✓ Play link — share with friends (Android)',
      playLinkPages: 'Share speel.html (Pages): ',
      shareHintAndroid: 'Share this link with friends. On Android: Chrome → Install app.',
      masteryHead: 'Top style mastery',
      masteryTiers: 'Tiers: Pupil → Virtuoso (3) → Master (10) → Legend (25)',
      savePort: 'Copy progress', exportSave: 'Copy save', importSave: 'Load save',
      importSaveFile: 'Choose file',
      savePortDesc: 'Normal save stays automatic. This path is only for another device or a file. Load: pick a file or paste — 1× preview, 2× load.',
      savePortPlaceholder: 'Paste your save here, or choose a file',
      privacy: 'Privacy',
      ageHint: 'Cartoon combat · teens+ · no chat',
      installAge: 'Cartoon combat · teens+ · no chat.',
      langChanged: 'Language: {lang}',
    },
    season: {
      title: 'Season',
      hint: 'A layer on top of the original screen. Auto follows the calendar. Saved on this device.',
      auto: 'Auto',
      classic: 'Classic',
      jungle: 'Jungle',
      halloween: 'Halloween',
      winter: 'Winter',
      summer: 'Summer',
      calendarNow: 'Calendar now: {name}',
      autoSuggest: 'Auto · {name}',
      picked: 'Season: {name}',
      blurb: {
        classic: 'The original arena — no extra layer, just Stickman.',
        jungle: 'Vines over the original arena. The jungle whispers: stay low, hit hard.',
        halloween: 'Pumpkins at the edge. Something grins from the dark — fight anyway.',
        winter: 'Frost on the edges. Snow art later — the arena stays yours.',
        summer: 'Summer heat over the screen. Sun art later — buttons stay clear.',
      },
    },
    missions: { title: 'Missions & achievements', sub: '3 missions a day',
      claimAll: 'Claim all ready', claimAllSub: '+XP in one tap', dayBonus: 'Daily bonus', dayBonusSub: '+80 XP · all 3 claimed',
      achievements: 'Achievements' },
    fomo: {
      ritualTitle: 'Today',
      ritualCtaSummon: 'Open summons',
      ritualCtaMission: 'Play mission',
      ritualCtaAdv: 'Play adventure',
      ritualDismiss: 'Close',
      ritualReopen: 'Day overview',
      resetIn: 'Resets in {reset}',
      rowSummons: 'Summons {left}/{total}',
      rowEggReady: 'Daily egg ready',
      rowEggDone: 'Daily egg already opened',
      streakReward3: '+1 summon',
      streakReward7: '+egg or summons',
      streakReward14: '+120 XP',
    },
    pets: { title: 'Pets · Companions', sub: 'Dex pets via monster book · Egg pets via daily arcade pull',
      crackEgg: 'Open daily egg', crackEggSub: 'Free arcade pull' },
    dex: { title: 'Monster book', sub: '{n} species · rarity = HP · farm / zoo / sea / woods / crypt · 4 rarities = Crystalline' },
    help: { title: 'Tips & controls' },
    gear: {
      title: 'Loadout', sub: '5 slots · armour & cosmetics · level + time gate',
      flagVanity: 'Look only — no stats', flagStats: '+ stats', flagArmour: 'Armour',
      needLvl: 'Unlocks at Lv {n}', needDays: 'Unlocks on day {n}',
      equip: 'Equip', equipped: 'On', empty: 'Empty',
      slot: { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', back: 'Back' },
    },
    install: { title: 'Add as app', sub: 'One icon, like a real app' },
    island: {
      1: { name: 'East island', sub: 'Lv 1–10' }, 2: { name: 'Fire island', sub: 'Lv 11–20' },
      3: { name: 'Neon island', sub: 'Lv 21–30' }, 4: { name: 'Temple island', sub: 'Lv 31–40' },
      5: { name: 'Final island', sub: 'Lv 41–50' },
      6: { name: 'Nightmare', sub: 'Lv 51–60' },
      7: { name: 'Hell', sub: 'Lv 61–70' },
      progress: 'Island {cur}/7 · {name} · {cleared}/{total} · unlock Lv {unlocked}/{max}',
    },
    buildings: {
      title: 'Factories',
      sub: 'Five factories · timed collect · upgrade',
      hubStatReady: '{n} ready to collect', hubStatIdle: '5 factories',
      hubStatLocked: '{n}/{total} open',
      level: 'Lv {n}', locked: 'Locked',
      lockWorld: 'Clear {name} (world {n})',
      collect: 'Collect', collectSub: '{n} {res} ready', collectEmpty: 'Nothing ready yet',
      collectDone: '+{n} {res}',
      upgrade: 'Upgrade', upgradeSub: '{cost} pet coins · Lv {next}',
      upgradeMax: 'Max level', upgradeNeed: 'Need {need} more pet coins',
      upgradeOk: '{name} → Lv {lv}',
      nextIn: 'Next in {t}', stored: '{n}/{cap} stored',
      stubNote: 'Systems API not merged yet — stub production',
      liveNote: 'Live systems API',
      loadFail: 'Could not load factories',
      build: 'Build', buildHint: 'Build once the island is open',
      lockedWorld: 'Unlock: island {n}',
      rateLine: '{n}/hr · {pending} waiting · cap {cap}',
      collected: '+{n} {res} · {name}',
      collectedAll: 'Harvest +{n} from {k} buildings',
      waveHeal: '+{n} HP',
      stick_lighter: { name: 'Stick-Lighter Factory', blurb: 'A lopsided woodshed that rubs sticks together until they sulk into sparks.' },
      stick_lighterSub: 'Sparks · East island',
      woodchip_glue: { name: 'Woodchip-Glue Factory', blurb: 'Boils yesterday’s sawdust into a paste that sticks harder than a combo. Do not lick.' },
      woodchip_glueSub: 'Glue · Fire island',
      chipping_wood: { name: 'Chipping-Wood Factory', blurb: 'A cheerful chipper that whispers TIMBER and coughs useful chips.' },
      chipping_woodSub: 'Chips · Neon island',
      bamboo_boesa: { name: 'Bamboo-Boesa Boiler', blurb: 'Fire-island kettle that steams hollow “boesa” bamboo until the stalks whistle.' },
      bamboo_boesaSub: 'Steam · Temple island',
      echo_whistle: { name: 'Echo-Whistle Mill', blurb: 'A mill wheel that turns air into taunts. The building heckles you back.' },
      echo_whistleSub: 'Echo · Final island',
      bamboo_boesa_boiler: { name: 'Bamboo-Boesa Boiler' }, echo_whistle_mill: { name: 'Echo-Whistle Mill' },
      res: { spark: 'Spark', glue: 'Glue', chip: 'Chip', steam: 'Steam', echo: 'Echo', embers: 'embers', chips: 'chips', echoes: 'echoes' },
    },
    rarity: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', nightmare: 'Nightmare', hell: 'Hell' },
    audio: {
      musicOff: 'Music off', sfxOff: 'Sound off', musicPct: 'Music {pct}%', sfxPct: 'SFX {pct}%',
      allMuted: 'All muted', pauseDuck: 'BGM ducked', pauseTrack: 'Track: {track}',
      ctxSuspended: 'Tap slider to wake audio',
      track: { menu: 'Menu', menu2: 'Menu 2', menu3: 'Menu 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
        battle: 'Battle', elite: 'Elite', boss: 'Boss', wall: 'Wall', training: 'Training', coinrun: 'Mats' },
    },
  },
  de: {
    back: { menu: '← Menü', collect: '← Sammlung', levels: '← Level' },
    common: { backHome: 'Zurück zum Menü', ok: 'Verstanden!', offline: 'Offline' },
    net: {
      updateReady: 'Neue Version bereit — tippen zum Laden',
      updateWait: 'Neue Version — lädt im Menü',
      dismiss: 'Schließen',
      offlinePlay: 'Offline — spielt aus dem Cache · Save bleibt hier',
      offlinePlayHint: 'Offline — aus dem Cache · Icon auf dem Startbildschirm = immer spielen',
      offlineMenu: 'Offline — Menü & Save aus dem Cache',
      offlineNeedOnce: 'Offline — einmal online öffnen, danach ohne Netz',
      backOnline: 'Wieder online',
      cacheLoading: 'Cache lädt… — danach auch offline',
      offlineReady: 'Bereit offline — Save bleibt hier',
    },
    menu: {
      continue: 'Weiterspielen', adventure: 'Abenteuer', adventureSub: 'Story · Inseln · Bosse',
      arcade: 'Arcade', arcadeSub: 'Training · Mauer · Münzen', versus: '2 Spieler', versusSub: 'Lokal',
      collect: 'Sammlung', collectSub: 'Waffen · Stil · Buch',
      buildings: 'Fabriken', buildingsSub: 'Werke · ernten · upgrade',
      music: 'Musik', missions: 'Missionen',
      summons: 'Summons', summonsSub: 'Tägliche Kiste · Waffe & Pet',
      options: 'Optionen', tips: 'Tipps', fresh: 'Neue Version', install: 'Als App speichern', installSub: 'Ein Icon, wie eine echte App',
      pressStart: 'insert coin', missionReady: 'Mission bereit', dayBonus: 'Tagesbonus',
      choosePath: 'WÄHLE DEINEN WEG', lastPlayed: 'ZULETZT', playHere: 'SPIEL', saveSync: 'save OK',
      startGame: 'SPIELEN', startSub: 'Starte den Kampf',
      titleName: 'Name — optional', titleNamePh: 'Spitzname (optional)',
      titleNote: 'Kein Konto — dein Save bleibt auf diesem Handy',
      titleGreet: 'Hi, {name}',
      splash0: 'Laden…', splash1: 'Laden…', splash2: 'Laden…', splash3: 'Fertig',
    },
    hub: {
      step: 'Schritt 2 · Modus wählen', solo: 'SOLO', collection: 'SAMMLUNG',
      arcadeTitle: 'Arcade', arcadeSub: 'Schnelle Runden · Save bleibt hier',
      collectTitle: 'Sammlung', collectSub: 'Ausrüstung · Waffen · Pets · Stil',
      gear: 'Ausrüstung', gearSub: 'Slots · Look',
      training: 'Training', trainingSub: '1v1 · RabbitRobot · Üben',
      wall: 'Mauer', wallSub: '60 Sek · Combo = schneller',
      mats: 'Münzen', matsSub: '45 Sek · Münzen → Pet-Coins',
      weapons: 'Waffen', weaponsSub: '26 Waffen · Summons',
      pets: 'Pets', petsSub: 'Münzen · Dex zähmen',
      style: 'Stil', styleSub: 'Outfit-Freischaltungen',
      gear: 'Ausrüstung', gearSub: '5 Slots · Rüstung & Kosmetik',
      skills: 'Skills', skillsSub: 'Energy specials · Spiral Orb · Wave Cannon',
      upgrades: 'Upgrades', upgradesSub: 'Splitter · Technik ausrüsten',
      dex: 'Monsterbuch', dexSub: '{n} Arten · Seltenheit = HP · Farm · Zoo · Meer · Wald',
      modes3: '3 schnelle Modi', fightersLocal: '20 Kämpfer · lokal', vsRecord: '{w}/{m} Siege',
      statTrain: '{n}× Training', statWall: 'Mauer {n}', statMats: '{n} Münzen',
      loadFail: 'Hub laden fehlgeschlagen',
    },
    buildings: {
      title: 'Fabriken',
      sub: 'Fünf Werke · ernten · upgrade',
      hubStatReady: '{n} bereit zum Ernten', hubStatIdle: '5 Werke',
      hubStatLocked: '{n}/{total} offen',
      level: 'Lv {n}', locked: 'Gesperrt',
      lockWorld: '{name} freischalten (Welt {n})',
      collect: 'Ernten', collectSub: '{n} {res} bereit', collectEmpty: 'Noch nichts bereit',
      collectDone: '+{n} {res}',
      upgrade: 'Upgrade', upgradeSub: '{cost} Pet-Coins · Lv {next}',
      upgradeMax: 'Max-Level', upgradeNeed: 'Noch {need} Pet-Coins',
      upgradeOk: '{name} → Lv {lv}',
      nextIn: 'Nächste in {t}', stored: '{n}/{cap} gelagert',
      stubNote: 'Systems-API noch nicht gemerged — Stub-Produktion',
      liveNote: 'Live Systems-API',
      loadFail: 'Fabriken laden fehlgeschlagen',
      build: 'Bauen', buildHint: 'Bauen, wenn die Insel offen ist',
      lockedWorld: 'Frei: Insel {n}',
      rateLine: '{n}/Std · {pending} wartet · Cap {cap}',
      collected: '+{n} {res} · {name}',
      collectedAll: 'Ernte +{n} aus {k} Gebäuden',
      waveHeal: '+{n} HP',
      stick_lighter: { name: 'Stick-Lighter Factory', blurb: 'A lopsided woodshed that rubs sticks together until they sulk into sparks.' },
      stick_lighterSub: 'Funken · Ostinsel',
      woodchip_glue: { name: 'Woodchip-Glue Factory', blurb: 'Boils yesterday’s sawdust into a paste that sticks harder than a combo. Do not lick.' },
      woodchip_glueSub: 'Leim · Feuerinsel',
      chipping_wood: { name: 'Chipping-Wood Factory', blurb: 'A cheerful chipper that whispers TIMBER and coughs useful chips.' },
      chipping_woodSub: 'Späne · Neoninsel',
      bamboo_boesa: { name: 'Bamboo-Boesa Boiler', blurb: 'Fire-island kettle that steams hollow “boesa” bamboo until the stalks whistle.' },
      bamboo_boesaSub: 'Dampf · Tempelinsel',
      echo_whistle: { name: 'Echo-Whistle Mill', blurb: 'A mill wheel that turns air into taunts. The building heckles you back.' },
      echo_whistleSub: 'Echo · Finalinsel',
      bamboo_boesa_boiler: { name: 'Bamboo-Boesa Boiler' }, echo_whistle_mill: { name: 'Echo-Whistle Mill' },
      res: { spark: 'Funken', glue: 'Leim', chip: 'Span', steam: 'Dampf', echo: 'Echo', embers: 'Glut', chips: 'Späne', echoes: 'Echos' },
    },
    modes: { adventure: 'Abenteuer', training: 'Training', wall: 'Mauer', versus: '2 Spieler', coinrun: 'Münzen' },
    pause: {
      title: 'Pause', sub: 'Spiral Orb bereit — los! · Fortschritt bleibt auf diesem Gerät',
      wallTime: '{n}s übrig', wallStones: '{n} Steine', wallCombo: 'Combo ×{n}',
      wallPaceAhead: '+{n} vs Rekordtempo', wallPaceBehind: '−{n} vs Rekordtempo',
      wallGap: 'noch {gap} bis Rekord',
      resume: 'Weiter', music: 'Musik', sfx: 'Sound', quit: 'Zum Menü',
      quitArcade: 'Stopp & Arcade',
      vsRestart: 'Match neu starten', vsRestartSub: '0-0 · gleiche Kämpfer',
      vsSwap: 'Seite tauschen', vsSwapSub: 'P1 ↔ P2 · gleicher Stand',
      audioHint: 'Lautstärke in Pause — Regler wie in Einstellungen',
      audioMuteAll: 'Alles aus', audioRestore: 'Standard', audioSfxOnly: 'Nur Sound',
    },
    result: { again: 'Nochmal', next: 'Nächstes Level', menu: 'Hauptmenü', menuArcade: 'Arcade', rematch: 'Revanche', rematchSub: 'Gleiche Kämpfer',
      trainAgainSub: 'vs RabbitRobot',
      advWin: 'GEWONNEN!', advLose: 'VERLOREN', trainWin: 'MEISTER!', trainLose: 'ROBOT GEWINNT...',
      advLoseKeep: 'XP und Beute von diesem Lauf bleiben',
      wavesStart: 'Start',
      xp: '+{xp} XP · jetzt Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Einstellungen', sub: 'Sound & HUD — Save läuft automatisch mit',
      lang: 'Sprache', music: 'Musik', sfx: 'Effekte', shake: 'Bildschirmshake', haptics: 'Vibration',
      aimHead: 'Zielanzeige', aimHint: 'Farbe und Größe des Strahls beim Zielen nach oben oder unten.',
      aimColor: 'Farbe', aimRadius: 'Größe', aimPick: 'Eigene Farbe',
      comboHud: 'Combo-HUD', bigTouch: 'Große Tasten',
      kbLegend: 'Tastatur-Hilfe', showTouchPads: 'Touch-Tasten immer',
      reducedMotion: 'Weniger Bewegung',
      liteFx: 'Lite FX', highContrast: 'Hoher Kontrast', restoreBackup: 'Save aus Backup',
      a11yMotionOn: 'Weniger Bewegung: an', a11yMotionOs: 'Weniger Bewegung: über System',
      a11yContrastOn: 'Hoher Kontrast: an', a11yContrastOs: 'Hoher Kontrast: über System',
      a11yDefault: 'Barrierefreiheit: Standard — oben oder in den Handy-Einstellungen',
      a11yTip: 'Weniger Bewegung = ruhigere Banner. Hoher Kontrast = dickere Ränder. Lite FX = flüssiger am Handy.',
      sfxSamplesOn: 'Soundeffekte: geladen',
      sfxSamplesLoad: 'Soundeffekte: laden…',
      sfxSamplesOff: 'Soundeffekte: offline',
      syncBackup: 'Backup aktualisieren', freshCache: 'Neue Version', clearSave: 'Neustart (2× tippen)',
      syncHint: 'Backup auf deinen aktuellen Stand setzen.',
      freshHint: 'Menü hängt? Tippe hier für die neueste Version.',
      hosting: 'Spiel-Link', copyLink: 'Link kopieren', openLink: 'Link öffnen',
      playLinkOk: '✓ Spiel-Link — mit Freunden teilen (Android)',
      playLinkPages: 'Teile speel.html (Pages): ',
      shareHintAndroid: 'Teile diesen Link mit Freunden. Auf Android: Chrome → App installieren.',
      masteryHead: 'Top Stil-Meisterschaft',
      masteryTiers: 'Tiers: Schüler → Virtuose (3) → Meister (10) → Legende (25)',
      savePort: 'Datei / offline', exportSave: 'Save kopieren', importSave: 'Save laden',
      importSaveFile: 'Datei wählen',
      savePortDesc: 'Der normale Save bleibt automatisch. Dieser Weg ist nur für ein anderes Gerät oder eine Datei.',
      savePortPlaceholder: 'Save hier einfügen oder Datei wählen',
      saveAuto: 'Save läuft automatisch mit',
      saveAutoLine: 'Lv {lvl} · OK auf diesem Gerät',
      saveAutoBad: 'Lv {lvl} · prüfen — Datei / offline öffnen',
      saveAutoHint: 'Online-Save bleibt automatisch bei diesem Spiel-Link. Kein Extra-Knopf.',
      saveOfflineFold: 'Datei / offline',
      saveOfflineTitle: 'Extra-Weg — nur wenn du eine Datei willst',
      saveOfflineOk: 'Datei-Kopie bereit',
      saveOfflineBad: 'Haupt-Save prüfen',
      saveOfflineBackup: 'Backup Lv {lvl}',
      saveOfflineDrift: 'Haupt und Backup unterscheiden sich',
      helpFold: 'Hilfe',
      helpTitle: 'Alte Version fest?',
      helpDesc: 'Leert den Cache und lädt neu. Nur nötig wenn das Spiel nicht mitkommt.',
      privacy: 'Datenschutz',
      ageHint: 'Cartoon-Kampf · ab Teenager · kein Chat',
      installAge: 'Cartoon-Stockfigur-Kämpfe · Teenager+ · kein Chat.',
      langChanged: 'Sprache: {lang}',
    },
    season: {
      title: 'Saison',
      hint: 'Schicht über dem Originalbildschirm. Auto folgt dem Kalender. Bleibt auf diesem Gerät.',
      auto: 'Auto',
      classic: 'Klassisch',
      jungle: 'Dschungel',
      halloween: 'Halloween',
      winter: 'Winter',
      summer: 'Sommer',
      calendarNow: 'Kalender jetzt: {name}',
      autoSuggest: 'Auto · {name}',
      picked: 'Saison: {name}',
      blurb: {
        classic: 'Die klassische Arena — keine Extra-Schicht, nur Stickman.',
        jungle: 'Ranken über der alten Arena. Der Dschungel flüstert: bleib tief, schlag hart.',
        halloween: 'Kürbisse am Rand. Etwas grinst aus dem Dunkel — kämpfe trotzdem.',
        winter: 'Frost an den Rändern. Schnee-Art folgt — die Arena bleibt deine.',
        summer: 'Sommerhitze über dem Bild. Sonnen-Art folgt — Tasten bleiben frei.',
      },
    },
    missions: { title: 'Missionen & Erfolge', sub: '3 tägliche Missionen · XP abholen',
      claimAll: 'Alle abholen', claimAllSub: '+XP auf einmal', dayBonus: 'Tagesbonus', dayBonusSub: '+80 XP',
      achievements: 'Erfolge' },
    fomo: {
      ritualTitle: 'Today', ritualCtaSummon: 'Open summons', ritualCtaMission: 'Play mission',
      ritualCtaAdv: 'Play adventure', ritualDismiss: 'Close', ritualReopen: 'Day overview',
      resetIn: 'Resets in {reset}', rowSummons: 'Summons {left}/{total}',
      rowEggReady: 'Daily egg ready', rowEggDone: 'Daily egg already opened',
      streakReward3: '+1 summon', streakReward7: '+egg or summons', streakReward14: '+120 XP',
    },
    pets: { title: 'Pets · Begleiter', sub: 'Dex-Pets & Ei-Pets', crackEgg: 'Tages-Ei öffnen', crackEggSub: 'Kostenloser Arcade-Zug' },
    dex: { title: 'Monsterbuch', sub: '{n} Arten · Seltenheit = HP · Farm / Zoo / Meer / Wald / Krypta' },
    help: { title: 'Tipps & Steuerung' },
    install: { title: 'App', sub: 'Homebildschirm' },
    island: {
      1: { name: 'Ost-Insel', sub: 'Lv 1–10' }, 2: { name: 'Feuer-Insel', sub: 'Lv 11–20' },
      3: { name: 'Neon-Insel', sub: 'Lv 21–30' }, 4: { name: 'Tempel-Insel', sub: 'Lv 31–40' },
      5: { name: 'Finale-Insel', sub: 'Lv 41–50' },
      6: { name: 'Albtraum', sub: 'Lv 51–60' },
      7: { name: 'Hölle', sub: 'Lv 61–70' },
      progress: 'Insel {cur}/7 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'Legendär', mythic: 'Mythisch', nightmare: 'Albtraum', hell: 'Hölle' },
    audio: {
      musicOff: 'Musik aus', sfxOff: 'Sound aus', musicPct: 'Musik {pct}%', sfxPct: 'SFX {pct}%',
      allMuted: 'Alles still', pauseDuck: 'BGM leise', pauseTrack: 'Track: {track}',
      ctxSuspended: 'Regler tippen für Sound',
      bgmDuckPause: ' · BGM gedämpft',
      track: { menu: 'Menü', menu2: 'Menü 2', menu3: 'Menü 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
        battle: 'Kampf', elite: 'Elite', boss: 'Boss', wall: 'Mauer', training: 'Training', coinrun: 'Mats' },
    },
  },
  fr: {
    back: { menu: '← Menu', collect: '← Collection', levels: '← Niveaux' },
    common: { backHome: 'Retour au menu', ok: 'Compris !', offline: 'Hors ligne' },
    net: {
      updateReady: 'Nouvelle version prête — tape pour charger',
      updateWait: 'Nouvelle version — se charge dans le menu',
      dismiss: 'Fermer',
      offlinePlay: 'Hors ligne — depuis le cache · sauvegarde ici',
      offlinePlayHint: 'Hors ligne — cache · icône d’accueil = toujours jouer',
      offlineMenu: 'Hors ligne — menu et sauvegarde depuis le cache',
      offlineNeedOnce: 'Hors ligne — ouvre 1× en ligne, ensuite sans réseau',
      backOnline: 'De nouveau en ligne',
      cacheLoading: 'Chargement du cache… — ensuite hors ligne aussi',
      offlineReady: 'Prêt hors ligne — sauvegarde ici',
    },
    menu: {
      continue: 'Continuer', adventure: 'Aventure', adventureSub: 'Histoire · îles · boss',
      arcade: 'Arcade', arcadeSub: 'Entraînement · Mur · Pièces', versus: '2 joueurs', versusSub: 'Local',
      collect: 'Collection', collectSub: 'Armes · style · bestiaire',
      buildings: 'Usines', buildingsSub: 'Usines · récolte · upgrade',
      music: 'Musique', missions: 'Missions',
      summons: 'Summons', summonsSub: 'Coffre du jour · arme et pet',
      options: 'Options', tips: 'Astuces', fresh: 'Nouvelle version', install: 'Ajouter comme app', installSub: 'Une icône, comme une vraie app',
      pressStart: 'insert coin', missionReady: 'mission prête', dayBonus: 'Bonus du jour',
      choosePath: 'CHOISIS TON CHEMIN', lastPlayed: 'DERNIER', playHere: 'JOUER', saveSync: 'save OK',
      startGame: 'JOUER', startSub: 'Lance le combat',
      titleName: 'Nom — pas obligatoire', titleNamePh: 'Surnom (optionnel)',
      titleNote: 'Pas de compte — ta sauvegarde reste sur ce téléphone',
      titleGreet: 'Salut, {name}',
      splash0: 'Chargement…', splash1: 'Chargement…', splash2: 'Chargement…', splash3: 'Prêt',
    },
    hub: {
      step: 'Étape 2 · Choisir le mode', solo: 'SOLO', collection: 'COLLECTION',
      arcadeTitle: 'Arcade', arcadeSub: 'Sessions rapides · sauvegarde ici',
      collectTitle: 'Collection', collectSub: 'Armes · pets · style · bestiaire',
      gear: 'Équipement', gearSub: 'Slots · look',
      training: 'Entraînement', trainingSub: '1v1 · RabbitRobot · pratique',
      wall: 'Mur', wallSub: '60 s · combo = plus vite',
      mats: 'Pièces', matsSub: '45 s · pièces → pet coins',
      weapons: 'Armes', weaponsSub: '26 armes · invocations',
      pets: 'Pets', petsSub: 'Pièces · dex · œufs',
      style: 'Style', styleSub: 'Déblocages tenues',
      gear: 'Équipement', gearSub: '5 emplacements · armure & cosmétique',
      skills: 'Skills', skillsSub: 'Spéciaux énergie · Spiral Orb · Wave Cannon',
      upgrades: 'Améliorations', upgradesSub: 'Éclats · équiper une technique',
      dex: 'Bestiaire', dexSub: '{n} espèces · rareté = PV · ferme · zoo · mer · bois',
      modes3: '3 modes rapides', fightersLocal: '20 combattants · local', vsRecord: '{w}/{m} victoires',
      statTrain: '{n}× entraînement', statWall: 'mur {n}', statMats: '{n} pièces',
      loadFail: 'Hub introuvable',
    },
    buildings: {
      title: 'Usines',
      sub: 'Cinq usines · récolte · upgrade',
      hubStatReady: '{n} prêtes à récolter', hubStatIdle: '5 usines',
      hubStatLocked: '{n}/{total} ouvertes',
      level: 'Nv {n}', locked: 'Verrouillé',
      lockWorld: 'Ouvre {name} (monde {n})',
      collect: 'Récolter', collectSub: '{n} {res} prêts', collectEmpty: 'Rien de prêt',
      collectDone: '+{n} {res}',
      upgrade: 'Upgrade', upgradeSub: '{cost} pet coins · Nv {next}',
      upgradeMax: 'Niveau max', upgradeNeed: 'Encore {need} pet coins',
      upgradeOk: '{name} → Nv {lv}',
      nextIn: 'Prochain dans {t}', stored: '{n}/{cap} stockés',
      stubNote: 'API systems pas encore fusionnée — production stub',
      liveNote: 'API systems live',
      loadFail: 'Usines introuvables',
      build: 'Construire', buildHint: 'Construire une fois l’île ouverte',
      lockedWorld: 'Déblocage : île {n}',
      rateLine: '{n}/h · {pending} en attente · cap {cap}',
      collected: '+{n} {res} · {name}',
      collectedAll: 'Récolte +{n} de {k} bâtiments',
      waveHeal: '+{n} PV',
      stick_lighter: { name: 'Stick-Lighter Factory', blurb: 'A lopsided woodshed that rubs sticks together until they sulk into sparks.' },
      stick_lighterSub: 'Étincelles · île de l’Est',
      woodchip_glue: { name: 'Woodchip-Glue Factory', blurb: 'Boils yesterday’s sawdust into a paste that sticks harder than a combo. Do not lick.' },
      woodchip_glueSub: 'Colle · île de Feu',
      chipping_wood: { name: 'Chipping-Wood Factory', blurb: 'A cheerful chipper that whispers TIMBER and coughs useful chips.' },
      chipping_woodSub: 'Copeaux · île Néon',
      bamboo_boesa: { name: 'Bamboo-Boesa Boiler', blurb: 'Fire-island kettle that steams hollow “boesa” bamboo until the stalks whistle.' },
      bamboo_boesaSub: 'Vapeur · île Temple',
      echo_whistle: { name: 'Echo-Whistle Mill', blurb: 'A mill wheel that turns air into taunts. The building heckles you back.' },
      echo_whistleSub: 'Écho · île Finale',
      bamboo_boesa_boiler: { name: 'Bamboo-Boesa Boiler' }, echo_whistle_mill: { name: 'Echo-Whistle Mill' },
      res: { spark: 'étincelles', glue: 'colle', chip: 'copeau', steam: 'vapeur', echo: 'écho', embers: 'braises', chips: 'copeaux', echoes: 'échos' },
    },
    modes: { adventure: 'Aventure', training: 'Entraînement', wall: 'Mur', versus: '2 joueurs', coinrun: 'Pièces' },
    pause: {
      title: 'Pause', sub: 'Spiral Orb prêt — go ! · progression sur cet appareil',
      wallTime: '{n}s restantes', wallStones: '{n} briques', wallCombo: 'combo ×{n}',
      wallPaceAhead: '+{n} vs rythme record', wallPaceBehind: '−{n} vs rythme record',
      wallGap: 'encore {gap} jusqu’au record',
      resume: 'Reprendre', music: 'Musique', sfx: 'Son', quit: 'Quitter vers le menu',
      quitArcade: 'Stop & Arcade',
      vsRestart: 'Recommencer', vsRestartSub: '0-0 · mêmes combattants',
      vsSwap: 'Changer de côté', vsSwapSub: 'P1 ↔ P2 · même score',
      audioHint: 'Volume en pause — comme dans Options',
      audioMuteAll: 'Tout couper', audioRestore: 'Par défaut', audioSfxOnly: 'Son seulement',
    },
    result: { again: 'Rejouer', next: 'Niveau suivant', menu: 'Menu principal', menuArcade: 'Arcade', rematch: 'Revanche', rematchSub: 'Mêmes combattants',
      trainAgainSub: 'vs RabbitRobot',
      advWin: 'VICTOIRE !', advLose: 'DÉFAITE...', trainWin: 'CHAMPION !', trainLose: 'ROBOT GAGNE...',
      advLoseKeep: 'XP et butin de cette run restent',
      wavesStart: 'début',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Options', sub: 'Son & HUD — la save suit automatiquement',
      lang: 'Langue', music: 'Musique', sfx: 'Effets', shake: 'Secousse écran', haptics: 'Vibration',
      aimHead: 'Viseur', aimHint: 'Couleur et taille du rayon quand tu vises haut ou bas avec la barre de déplacement.',
      aimColor: 'Couleur', aimRadius: 'Taille', aimPick: 'Personnaliser',
      comboHud: 'HUD combo', bigTouch: 'Gros boutons',
      kbLegend: 'Aide clavier', showTouchPads: 'Toujours boutons tactile',
      reducedMotion: 'Moins de mouvement',
      liteFx: 'Lite FX', highContrast: 'Contraste élevé', restoreBackup: 'Restaurer la sauvegarde',
      a11yMotionOn: 'Moins de mouvement : oui', a11yMotionOs: 'Moins de mouvement : via le système',
      a11yContrastOn: 'Contraste élevé : oui', a11yContrastOs: 'Contraste élevé : via le système',
      a11yDefault: 'Accessibilité : défaut — ici ou dans les réglages du téléphone',
      a11yTip: 'Moins de mouvement = bannières plus calmes. Contraste élevé = bords plus épais. Lite FX = plus fluide.',
      sfxSamplesOn: 'Effets sonores : chargés',
      sfxSamplesLoad: 'Effets sonores : chargement…',
      sfxSamplesOff: 'Effets sonores : hors ligne',
      syncBackup: 'Mettre à jour la copie', freshCache: 'Nouvelle version', clearSave: 'Nouveau départ (2× tap)',
      syncHint: 'Aligner la copie sur ta progression actuelle.',
      freshHint: 'Menu bloqué ? Tape ici pour la dernière version.',
      hosting: 'Lien de jeu', copyLink: 'Copier le lien', openLink: 'Ouvrir le lien',
      savePort: 'Fichier / hors ligne', exportSave: 'Copier la save', importSave: 'Charger la save',
      importSaveFile: 'Choisir fichier',
      savePortDesc: 'La save normale reste automatique. Ce chemin est seulement pour un autre appareil ou un fichier.',
      savePortPlaceholder: 'Colle ta save ici, ou choisis un fichier',
      saveAuto: 'La save suit automatiquement',
      saveAutoLine: 'Nv {lvl} · OK sur cet appareil',
      saveAutoBad: 'Nv {lvl} · vérifie — ouvre Fichier / hors ligne',
      saveAutoHint: 'La save en ligne reste avec ce lien, sans bouton extra.',
      saveOfflineFold: 'Fichier / hors ligne',
      saveOfflineTitle: 'Chemin à part — seulement si tu veux un fichier',
      saveOfflineOk: 'Copie fichier prête',
      saveOfflineBad: 'Save principale à vérifier',
      saveOfflineBackup: 'Backup nv {lvl}',
      saveOfflineDrift: 'Principale et backup différent',
      helpFold: 'Aide',
      helpTitle: 'Bloqué sur une vieille version ?',
      helpDesc: 'Vide le cache et recharge. Seulement si le jeu ne suit pas.',
      privacy: 'Confidentialité',
      ageHint: 'Combat cartoon · ados+ · pas de chat',
      installAge: 'Combats stickman cartoon · ados+ · pas de chat.',
      langChanged: 'Langue : {lang}',
    },
    season: {
      title: 'Saison',
      hint: 'Une couche au-dessus de l’écran d’origine. Auto suit le calendrier. Reste sur cet appareil.',
      auto: 'Auto',
      classic: 'Classique',
      jungle: 'Jungle',
      halloween: 'Halloween',
      winter: 'Hiver',
      summer: 'Été',
      calendarNow: 'Calendrier : {name}',
      autoSuggest: 'Auto · {name}',
      picked: 'Saison : {name}',
      blurb: {
        classic: 'L’arène d’origine — pas de couche en plus, juste Stickman.',
        jungle: 'Lianes sur l’arène. La jungle murmure : reste bas, frappe fort.',
        halloween: 'Citrouilles au bord. Quelque chose sourit dans le noir — combats quand même.',
        winter: 'Givre sur les bords. L’art neige vient — l’arène reste à toi.',
        summer: 'Chaleur d’été sur l’écran. L’art soleil vient — les boutons restent libres.',
      },
    },
    missions: { title: 'Missions & succès', sub: '3 missions quotidiennes · réclamer XP',
      claimAll: 'Tout réclamer', claimAllSub: '+XP en un tap', dayBonus: 'Bonus du jour', dayBonusSub: '+80 XP',
      achievements: 'Succès' },
    fomo: {
      ritualTitle: 'Today', ritualCtaSummon: 'Open summons', ritualCtaMission: 'Play mission',
      ritualCtaAdv: 'Play adventure', ritualDismiss: 'Close', ritualReopen: 'Day overview',
      resetIn: 'Resets in {reset}', rowSummons: 'Summons {left}/{total}',
      rowEggReady: 'Daily egg ready', rowEggDone: 'Daily egg already opened',
      streakReward3: '+1 summon', streakReward7: '+egg or summons', streakReward14: '+120 XP',
    },
    pets: { title: 'Pets · Compagnons', sub: 'Pets dex & œufs arcade', crackEgg: 'Ouvrir l\'œuf du jour', crackEggSub: 'Tir gratuit' },
    dex: { title: 'Bestiaire', sub: '{n} espèces · rareté = PV · ferme / zoo / mer / bois / crypte' },
    help: { title: 'Astuces & contrôles' },
    install: { title: 'App', sub: 'Écran d\'accueil' },
    island: {
      1: { name: 'Île de l\'Est', sub: 'Lv 1–10' }, 2: { name: 'Île de Feu', sub: 'Lv 11–20' },
      3: { name: 'Île Néon', sub: 'Lv 21–30' }, 4: { name: 'Île Temple', sub: 'Lv 31–40' },
      5: { name: 'Île Finale', sub: 'Lv 41–50' },
      6: { name: 'Cauchemar', sub: 'Lv 51–60' },
      7: { name: 'Enfer', sub: 'Lv 61–70' },
      progress: 'Île {cur}/7 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire', mythic: 'Mythique', nightmare: 'Cauchemar', hell: 'Enfer' },
    audio: {
      musicOff: 'Musique coupée', sfxOff: 'Son coupé', musicPct: 'Musique {pct}%', sfxPct: 'SFX {pct}%',
      allMuted: 'Tout silencieux', pauseDuck: 'BGM doux', pauseTrack: 'Piste : {track}',
      ctxSuspended: 'Tape le curseur pour le son',
      bgmDuckPause: ' · BGM atténué',
      track: { menu: 'Menu', menu2: 'Menu 2', menu3: 'Menu 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
        battle: 'Combat', elite: 'Elite', boss: 'Boss', wall: 'Mur', training: 'Entraînement', coinrun: 'Mats' },
    },
  },
  es: {
    back: { menu: '← Menú', collect: '← Colección', levels: '← Niveles' },
    common: { backHome: 'Volver al menú', ok: '¡Entendido!', offline: 'Sin conexión' },
    net: {
      updateReady: 'Nueva versión lista — toca para cargar',
      updateWait: 'Nueva versión — se carga en el menú',
      dismiss: 'Cerrar',
      offlinePlay: 'Sin conexión — desde la caché · la partida se queda aquí',
      offlinePlayHint: 'Sin conexión — caché · icono de inicio = jugar siempre',
      offlineMenu: 'Sin conexión — menú y partida desde la caché',
      offlineNeedOnce: 'Sin conexión — ábrelo 1× online, luego sin red',
      backOnline: 'De nuevo en línea',
      cacheLoading: 'Cargando caché… — luego también sin red',
      offlineReady: 'Listo sin red — la partida se queda aquí',
    },
    menu: {
      continue: 'Continuar', adventure: 'Aventura', adventureSub: 'Historia · islas · jefes',
      arcade: 'Arcade', arcadeSub: 'Entrenamiento · Muro · Monedas', versus: '2 jugadores', versusSub: 'Local',
      collect: 'Colección', collectSub: 'Armas · estilo · bestiario',
      buildings: 'Fábricas', buildingsSub: 'Obras · recolectar · mejorar',
      music: 'Música', missions: 'Misiones',
      summons: 'Summons', summonsSub: 'Cofre diario · arma y pet',
      options: 'Opciones', tips: 'Consejos', fresh: 'Versión nueva', install: 'Añadir como app', installSub: 'Un icono, como una app real',
      pressStart: 'insert coin', missionReady: 'misión lista', dayBonus: 'Bonus diario',
      choosePath: 'ELIGE TU CAMINO', lastPlayed: 'ÚLTIMO', playHere: 'JUEGA', saveSync: 'save OK',
      startGame: 'JUGAR', startSub: 'Empieza el combate',
      titleName: 'Nombre — no hace falta', titleNamePh: 'Apodo (opcional)',
      titleNote: 'Sin cuenta — tu partida se queda en este teléfono',
      titleGreet: 'Hola, {name}',
      splash0: 'Cargando…', splash1: 'Cargando…', splash2: 'Cargando…', splash3: 'Listo',
    },
    hub: {
      step: 'Paso 2 · Elige modo', solo: 'SOLO', collection: 'COLECCIÓN',
      arcadeTitle: 'Arcade', arcadeSub: 'Sesiones rápidas · partida aquí',
      collectTitle: 'Colección', collectSub: 'Armas · pets · estilo · bestiario',
      gear: 'Equipo', gearSub: 'Slots · look',
      training: 'Entrenamiento', trainingSub: '1v1 · RabbitRobot · practicar',
      wall: 'Muro', wallSub: '60 s · combo = más rápido',
      mats: 'Monedas', matsSub: '45 s · monedas → pet coins',
      weapons: 'Armas', weaponsSub: '26 armas · invocaciones',
      pets: 'Pets', petsSub: 'Monedas · dex · huevos',
      style: 'Estilo', styleSub: 'Desbloqueos de outfit',
      gear: 'Equipo', gearSub: '5 huecos · armadura y cosméticos',
      skills: 'Skills', skillsSub: 'Especiales energía · Spiral Orb · Wave Cannon',
      upgrades: 'Mejoras', upgradesSub: 'Fragmentos · equipar técnica',
      dex: 'Bestiario', dexSub: '{n} especies · rareza = HP · granja · zoo · mar · bosque',
      modes3: '3 modos rápidos', fightersLocal: '20 luchadores · local', vsRecord: '{w}/{m} ganados',
      statTrain: '{n}× entrenamiento', statWall: 'muro {n}', statMats: '{n} monedas',
      loadFail: 'No se pudo cargar el hub',
    },
    buildings: {
      title: 'Fábricas',
      sub: 'Cinco obras · recolectar · mejorar',
      hubStatReady: '{n} listas para recolectar', hubStatIdle: '5 obras',
      hubStatLocked: '{n}/{total} abiertas',
      level: 'Nv {n}', locked: 'Bloqueado',
      lockWorld: 'Abre {name} (mundo {n})',
      collect: 'Recolectar', collectSub: '{n} {res} listos', collectEmpty: 'Nada listo aún',
      collectDone: '+{n} {res}',
      upgrade: 'Mejora', upgradeSub: '{cost} pet coins · Nv {next}',
      upgradeMax: 'Nivel máx.', upgradeNeed: 'Faltan {need} pet coins',
      upgradeOk: '{name} → Nv {lv}',
      nextIn: 'Siguiente en {t}', stored: '{n}/{cap} guardados',
      stubNote: 'API de systems aún no fusionada — producción stub',
      liveNote: 'API de systems en vivo',
      loadFail: 'No se pudieron cargar las fábricas',
      build: 'Construir', buildHint: 'Construye cuando la isla esté abierta',
      lockedWorld: 'Desbloqueo: isla {n}',
      rateLine: '{n}/h · {pending} en espera · cap {cap}',
      collected: '+{n} {res} · {name}',
      collectedAll: 'Cosecha +{n} de {k} edificios',
      waveHeal: '+{n} HP',
      stick_lighter: { name: 'Stick-Lighter Factory', blurb: 'A lopsided woodshed that rubs sticks together until they sulk into sparks.' },
      stick_lighterSub: 'Chispas · isla Este',
      woodchip_glue: { name: 'Woodchip-Glue Factory', blurb: 'Boils yesterday’s sawdust into a paste that sticks harder than a combo. Do not lick.' },
      woodchip_glueSub: 'Cola · isla Fuego',
      chipping_wood: { name: 'Chipping-Wood Factory', blurb: 'A cheerful chipper that whispers TIMBER and coughs useful chips.' },
      chipping_woodSub: 'Astillas · isla Neón',
      bamboo_boesa: { name: 'Bamboo-Boesa Boiler', blurb: 'Fire-island kettle that steams hollow “boesa” bamboo until the stalks whistle.' },
      bamboo_boesaSub: 'Vapor · isla Templo',
      echo_whistle: { name: 'Echo-Whistle Mill', blurb: 'A mill wheel that turns air into taunts. The building heckles you back.' },
      echo_whistleSub: 'Eco · isla Final',
      bamboo_boesa_boiler: { name: 'Bamboo-Boesa Boiler' }, echo_whistle_mill: { name: 'Echo-Whistle Mill' },
      res: { spark: 'chispas', glue: 'cola', chip: 'astilla', steam: 'vapor', echo: 'eco', embers: 'brasas', chips: 'astillas', echoes: 'ecos' },
    },
    modes: { adventure: 'Aventura', training: 'Entrenamiento', wall: 'Muro', versus: '2 jugadores', coinrun: 'Monedas' },
    pause: {
      title: 'Pausa', sub: 'Spiral Orb listo — ¡ya! · progreso en este dispositivo',
      wallTime: '{n}s restantes', wallStones: '{n} ladrillos', wallCombo: 'combo ×{n}',
      wallPaceAhead: '+{n} vs ritmo récord', wallPaceBehind: '−{n} vs ritmo récord',
      wallGap: 'faltan {gap} para el récord',
      resume: 'Seguir', music: 'Música', sfx: 'Sonido', quit: 'Salir al menú',
      quitArcade: 'Parar y Arcade',
      vsRestart: 'Reiniciar partida', vsRestartSub: '0-0 · mismos luchadores',
      vsSwap: 'Cambiar lado', vsSwapSub: 'P1 ↔ P2 · mismo marcador',
      audioHint: 'Volumen en pausa — igual que en Opciones',
      audioMuteAll: 'Todo off', audioRestore: 'Predeterminado', audioSfxOnly: 'Solo sonido',
    },
    result: { again: 'Otra vez', next: 'Siguiente nivel', menu: 'Menú principal', menuArcade: 'Arcade', rematch: 'Revancha', rematchSub: 'Mismos luchadores',
      trainAgainSub: 'vs RabbitRobot',
      advWin: '¡VICTORIA!', advLose: 'DERROTA...', trainWin: '¡CAMPEÓN!', trainLose: 'ROBOT GANA...',
      advLoseKeep: 'XP y botín de esta run se quedan',
      wavesStart: 'inicio',
      xp: '+{xp} XP · Lv {lvl} ({cur}/{need} XP)' },
    settings: {
      title: 'Opciones', sub: 'Sonido y HUD — el save va automático',
      lang: 'Idioma', music: 'Música', sfx: 'Efectos', shake: 'Sacudida pantalla', haptics: 'Vibración',
      aimHead: 'Indicador de mira', aimHint: 'Color y tamaño del rayo al apuntar arriba o abajo con la barra de movimiento.',
      aimColor: 'Color', aimRadius: 'Tamaño', aimPick: 'Elegir',
      comboHud: 'HUD combo', bigTouch: 'Botones grandes',
      kbLegend: 'Ayuda de teclado', showTouchPads: 'Siempre botones táctiles',
      reducedMotion: 'Menos movimiento',
      liteFx: 'Lite FX', highContrast: 'Alto contraste', restoreBackup: 'Restaurar partida',
      a11yMotionOn: 'Menos movimiento: sí', a11yMotionOs: 'Menos movimiento: vía sistema',
      a11yContrastOn: 'Alto contraste: sí', a11yContrastOs: 'Alto contraste: vía sistema',
      a11yDefault: 'Accesibilidad: normal — aquí o en ajustes del teléfono',
      a11yTip: 'Menos movimiento = banners más calmos. Alto contraste = bordes más gruesos. Lite FX = más fluido.',
      sfxSamplesOn: 'Efectos de sonido: cargados',
      sfxSamplesLoad: 'Efectos de sonido: cargando…',
      sfxSamplesOff: 'Efectos de sonido: sin conexión',
      syncBackup: 'Actualizar copia', freshCache: 'Versión nueva', clearSave: 'Nuevo inicio (2× toque)',
      syncHint: 'Iguala la copia a tu progreso actual.',
      freshHint: '¿Menú atascado? Toca aquí para la versión nueva.',
      hosting: 'Enlace para jugar', copyLink: 'Copiar enlace', openLink: 'Abrir enlace',
      savePort: 'Archivo / sin red', exportSave: 'Copiar save', importSave: 'Cargar save',
      importSaveFile: 'Elegir archivo',
      savePortDesc: 'El save normal sigue automático. Este camino es solo para otro aparato o un archivo.',
      savePortPlaceholder: 'Pega tu save aquí, o elige un archivo',
      saveAuto: 'El save va automático',
      saveAutoLine: 'Nv {lvl} · OK en este aparato',
      saveAutoBad: 'Nv {lvl} · revisa — abre Archivo / sin red',
      saveAutoHint: 'El save online se queda con este enlace, sin botón extra.',
      saveOfflineFold: 'Archivo / sin red',
      saveOfflineTitle: 'Camino aparte — solo si quieres un archivo',
      saveOfflineOk: 'Copia de archivo lista',
      saveOfflineBad: 'Save principal a revisar',
      saveOfflineBackup: 'Backup nv {lvl}',
      saveOfflineDrift: 'Principal y backup no coinciden',
      helpFold: 'Ayuda',
      helpTitle: '¿Atascado en una versión vieja?',
      helpDesc: 'Vacía la caché y recarga. Solo si el juego no se pone al día.',
      privacy: 'Privacidad',
      ageHint: 'Combate cartoon · adolescentes+ · sin chat',
      installAge: 'Combates stickman cartoon · adolescentes+ · sin chat.',
      langChanged: 'Idioma: {lang}',
    },
    season: {
      title: 'Temporada',
      hint: 'Capa sobre la pantalla original. Auto sigue el calendario. Se guarda en este aparato.',
      auto: 'Auto',
      classic: 'Clásico',
      jungle: 'Jungla',
      halloween: 'Halloween',
      winter: 'Invierno',
      summer: 'Verano',
      calendarNow: 'Calendario ahora: {name}',
      autoSuggest: 'Auto · {name}',
      picked: 'Temporada: {name}',
      blurb: {
        classic: 'La arena clásica — sin capa extra, solo Stickman.',
        jungle: 'Lianas sobre la arena. La jungla susurra: agáchate, golpea fuerte.',
        halloween: 'Calabazas al borde. Algo sonríe en la oscuridad — pelea igual.',
        winter: 'Escarcha en los bordes. El arte de nieve llega — la arena sigue siendo tuya.',
        summer: 'Calor de verano en la pantalla. El arte de sol llega — los botones siguen libres.',
      },
    },
    missions: { title: 'Misiones y logros', sub: '3 misiones diarias · reclamar XP',
      claimAll: 'Reclamar todo', claimAllSub: '+XP de una vez', dayBonus: 'Bonus diario', dayBonusSub: '+80 XP',
      achievements: 'Logros' },
    fomo: {
      ritualTitle: 'Today', ritualCtaSummon: 'Open summons', ritualCtaMission: 'Play mission',
      ritualCtaAdv: 'Play adventure', ritualDismiss: 'Close', ritualReopen: 'Day overview',
      resetIn: 'Resets in {reset}', rowSummons: 'Summons {left}/{total}',
      rowEggReady: 'Daily egg ready', rowEggDone: 'Daily egg already opened',
      streakReward3: '+1 summon', streakReward7: '+egg or summons', streakReward14: '+120 XP',
    },
    pets: { title: 'Pets · Compañeros', sub: 'Pets dex y huevos arcade', crackEgg: 'Abrir huevo diario', crackEggSub: 'Tirada gratis' },
    dex: { title: 'Bestiario', sub: '{n} especies · rareza = HP · granja / zoo / mar / bosque / cripta' },
    help: { title: 'Consejos y controles' },
    install: { title: 'App', sub: 'Pantalla de inicio' },
    island: {
      1: { name: 'Isla Este', sub: 'Lv 1–10' }, 2: { name: 'Isla Fuego', sub: 'Lv 11–20' },
      3: { name: 'Isla Neón', sub: 'Lv 21–30' }, 4: { name: 'Isla Templo', sub: 'Lv 31–40' },
      5: { name: 'Isla Final', sub: 'Lv 41–50' },
      6: { name: 'Pesadilla', sub: 'Lv 51–60' },
      7: { name: 'Infierno', sub: 'Lv 61–70' },
      progress: 'Isla {cur}/7 · {name} · {cleared}/{total} · Lv {unlocked}/{max}',
    },
    rarity: { common: 'Común', uncommon: 'Poco común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario', mythic: 'Mítico', nightmare: 'Pesadilla', hell: 'Infierno' },
    audio: {
      musicOff: 'Música off', sfxOff: 'Sonido off', musicPct: 'Música {pct}%', sfxPct: 'SFX {pct}%',
      allMuted: 'Todo en silencio', pauseDuck: 'BGM suave', pauseTrack: 'Pista: {track}',
      ctxSuspended: 'Toca el control para el sonido',
      bgmDuckPause: ' · BGM atenuado',
      track: { menu: 'Menú', menu2: 'Menú 2', menu3: 'Menú 3', menuArcade: 'Arcade', menuHero: 'Hero', menuDream: 'Dream',
        battle: 'Combate', elite: 'Elite', boss: 'Jefe', wall: 'Muro', training: 'Entrenamiento', coinrun: 'Mats' },
    },
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
  return SUPPORTED_LANGS.includes(l) ? l : 'nl';
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
  // Coverage + factcheck (#283): current → EN → NL. Non-NL missing keys fall back to EN first so Dutch never leaks into FR/ES/DE.
  let s = i18nLookup(I18N[lang], key);
  if (!s && lang !== 'en') s = i18nLookup(I18N.en, key);
  if (!s && lang !== 'nl') s = i18nLookup(I18N.nl, key);
  if (!s) s = key;
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      s = s.split('{' + k + '}').join(String(v));
    }
  }
  return s;
}

/** Never leak a raw key — use fallback copy if lookup misses. */
function tOr(key, fallback, params) {
  const s = t(key, params);
  if (s && s !== key) return s;
  if (fallback && params && typeof params === 'object') {
    let out = String(fallback);
    for (const [k, v] of Object.entries(params)) {
      out = out.split('{' + k + '}').join(String(v));
    }
    return out;
  }
  return fallback || '';
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
  const netMsg = document.getElementById('netStatusMsg') || document.getElementById('netStatus');
  if (netMsg) netMsg.textContent = t('common.offline');
  const netX = document.getElementById('netStatusDismiss');
  if (netX) netX.setAttribute('aria-label', tOr('net.dismiss', 'Sluiten'));

  setText('menuLangLbl', 'settings.lang');
  setText('pressStartLine', 'menu.pressStart');
  setText('menuArcadePre', 'menu.choosePath');
  const cont = document.getElementById('btnContinue');
  if (cont) {
    const div = cont.querySelector('div');
    if (div) {
      const lp = save && save.lastPlay;
      const modeName = lp && lp.mode ? t('modes.' + lp.mode) : t('ui.continueLastMode');
      div.innerHTML = t('menu.continue') + '<small>' + modeName + '</small>';
    }
  }
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.setAttribute('aria-label', t('pause.title'));

  const hubMap = [
    ['.hub-tile-adventure .hub-tile-title', 'menu.adventure'],
    ['.hub-tile-adventure .hub-tile-sub', 'menu.adventureSub'],
    ['.hub-tile-arcade .hub-tile-title', 'menu.arcade'],
    ['.hub-tile-arcade .hub-tile-sub', 'menu.arcadeSub'],
    ['.hub-tile-collect .hub-tile-title', 'menu.collect'],
    ['.hub-tile-collect .hub-tile-sub', 'menu.collectSub'],
    ['.hub-tile-buildings .hub-tile-title', 'menu.buildings'],
    ['.hub-tile-buildings .hub-tile-sub', 'menu.buildingsSub'],
    ['.hub-tile-summon .hub-tile-title', 'menu.summons'],
    ['.hub-tile-summon .hub-tile-sub', 'menu.summonsSub'],
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
  setTitle('togMusic', 'menu.music');
  setTitle('btnMissions', 'menu.missions');
  setTitle('btnSettings', 'settings.title');
  setTitle('btnHelp', 'menu.tips');
  setTitle('btnVerseVersie', 'settings.freshHint');

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
    ['btnGear', 'hub.gear', 'hub.gearSub'],
    ['btnSkills', 'hub.skills', 'hub.skillsSub'],
    ['btnUpgrades', 'hub.upgrades', 'hub.upgradesSub'],
    ['btnUpgradesHome', 'hub.upgrades', 'hub.upgradesSub'],
    ['btnDex', 'hub.dex', 'hub.dexSub'],
    ['btnGear', 'hub.gear', 'hub.gearSub'],
  ];
  for (const [id, titleKey, subKey] of modeRows) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    const title = btn.querySelector('.hub-tile-title');
    const sub = btn.querySelector('.hub-tile-sub');
    const subParams = (id === 'btnDex' && typeof SPECIES_ORDER !== 'undefined')
      ? { n: SPECIES_ORDER.length }
      : undefined;
    if (title) title.textContent = t(titleKey);
    if (sub) sub.textContent = t(subKey, subParams);
  }

  document.querySelectorAll('.sub-home-btn .sub-home-label').forEach((el) => {
    el.textContent = t('common.backHome');
  });

  setText('settingsHead', 'settings.title');
  setText('settingsSub', 'settings.sub');
  setText('setLangLbl', 'settings.lang');
  setText('setAimHead', 'settings.aimHead');
  setText('setAimHint', 'settings.aimHint');
  setText('setAimColorLbl', 'settings.aimColor');
  setText('setAimRadiusName', 'settings.aimRadius');
  setText('setAimPickLbl', 'settings.aimPick');
  setText('setSeasonLbl', 'season.title');
  setText('seasonHint', 'season.hint');
  setText('settingsA11yTip', 'settings.a11yTip');
  try { if (typeof syncSeasonFlavorUi === 'function') syncSeasonFlavorUi(); } catch (_) {}
  try { if (typeof renderSeasonSwitch === 'function') renderSeasonSwitch(); } catch (_) {}
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
  setText('settingsSaveAutoTitle', 'settings.saveAuto');
  setText('settingsSaveAutoHint', 'settings.saveAutoHint');
  setText('settingsShareFoldSum', 'settings.hosting');
  setText('settingsShareTitle', 'settings.hosting');
  setText('settingsSaveFoldSum', 'settings.saveOfflineFold');
  setText('settingsSaveTitle', 'settings.saveOfflineTitle');
  setText('settingsHelpFoldSum', 'settings.helpFold');
  setText('settingsHelpTitle', 'settings.helpTitle');
  setText('settingsHelpDesc', 'settings.helpDesc');
  setText('settingsSyncHint', 'settings.syncHint');
  setText('settingsFreshHint', 'settings.freshHint');

  setText('missionsHead', 'missions.title');
  setText('missionsSub', 'missions.sub');
  setText('fomoRitualReopenLbl', 'fomo.ritualReopen');
  setText('fomoRitualTitle', 'fomo.ritualTitle');
  setTitle('fomoRitualDismiss', 'fomo.ritualDismiss');
  setTitle('fomoRitualBackdrop', 'fomo.ritualDismiss');
  setTitle('fomoRitualReopen', 'fomo.ritualReopen');
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

  setText('buildingsScreenHead', 'buildings.title');
  setText('buildingsScreenSub', 'buildings.sub');
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
  setText('gearScreenHead', 'ui.gearHead');
  setText('gearScreenSub', 'ui.gearSub');
  setText('skillScreenHead', 'ui.skillSummaryHead');
  setText('skillScreenSub', 'ui.skillSub');
  setText('upgradeScreenHead', 'ui.skillHead');
  setText('upgradeScreenSub', 'ui.skillSub');
  setText('superSectionHead', 'ui.superHead');
  setText('superSectionSub', 'ui.superSub');
  setText('weaponScreenHead', 'ui.weaponHead');
  setText('weaponScreenSub', 'ui.weaponSub');
  setText('buildingsScreenHead', 'buildings.title');
  setText('buildingsScreenSub', 'buildings.sub');
  setText('helpFirstMinute', 'ui.helpFirstMinute');
  setText('summonScreenHead', 'ui.summonHead');
  setText('summonScreenSub', 'ui.summonSub');
  setText('summonWhereStrip', 'ui.summonWhere');
  setText('summonStageHint', 'ui.summonHint');
  setText('summonRevealText', 'ui.summonReveal');
  const chestPullLbl = document.getElementById('btnChestPull');
  if (chestPullLbl) {
    const d = chestPullLbl.querySelector('div');
    if (d) {
      const leftSmall = document.getElementById('chestPullLbl');
      const leftTxt = leftSmall ? leftSmall.textContent : '';
      d.innerHTML = t('ui.summonPull') + '<small id="chestPullLbl">' + leftTxt + '</small>';
    }
  }
  const gotoW = document.getElementById('btnSummonGotoWeapons');
  if (gotoW) {
    const d = gotoW.querySelector('div');
    if (d) d.innerHTML = t('ui.summonGotoWeapons') + '<small>' + t('ui.summonGotoSub') + '</small>';
  }
  const gotoP = document.getElementById('btnSummonGotoPets');
  if (gotoP) {
    const d = gotoP.querySelector('div');
    if (d) d.innerHTML = t('ui.summonGotoPets') + '<small>' + t('ui.summonGotoSub') + '</small>';
  }

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
  if (charIpadCard) {
    charIpadCard.textContent = '';
    charIpadCard.hidden = true;
    charIpadCard.style.display = 'none';
  }

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
    gearScreen: t('back.collect'),
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
        try { if (UI.clearToasts) UI.clearToasts(); } catch (_) {}
        UI.toast(t('settings.langChanged', { lang: LANG_LABELS[code] }), 2200, { tone: 'ok' });
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
    else if (active === 'summonScreen' && typeof UI.renderSummon === 'function') UI.renderSummon();
    else if (active === 'upgradeScreen' && typeof UI.renderUpgrades === 'function') UI.renderUpgrades();
    else if (active === 'styleScreen' && typeof UI.renderStyle === 'function') UI.renderStyle();
    else if (active === 'gearScreen' && typeof UI.renderGear === 'function') UI.renderGear();
    else if (active === 'skillScreen' && typeof UI.renderSkills === 'function') UI.renderSkills();
    else if (active === 'charSelectScreen' && typeof UI.renderCharSelect === 'function') UI.renderCharSelect();
    else if (active === 'levelScreen' && typeof UI.renderLevels === 'function') UI.renderLevels();
    else if (active === 'gambleScreen' && typeof UI.renderGamble === 'function' && pendingAdvLevel) {
      UI.renderGamble(pendingAdvLevel);
    } else if (active === 'petScreen' && typeof UI.renderPets === 'function') UI.renderPets();
    else if (active === 'dexScreen' && typeof UI.renderDex === 'function') UI.renderDex();
    else if (active === 'skillScreen' && typeof UI.renderSkills === 'function') UI.renderSkills();
    else if (active === 'modeHubScreen') UI.renderModeHub();
    else if (active === 'resultScreen' && UI.lastResult && typeof UI.showResult === 'function') {
      try { UI.showResult(!!UI.lastResult.win, UI.lastResult); } catch (_) {}
    }
    UI.syncBackLabels();
  }
  try { if (typeof syncTitleGateCopy === 'function') syncTitleGateCopy(); } catch (_) {}
  try { if (typeof updateNetStatus === 'function') updateNetStatus(); } catch (_) {}
}

function initLang() {
  if (typeof mergeI18nCatalogs === 'function') mergeI18nCatalogs();
  if (!save.lang || !SUPPORTED_LANGS.includes(save.lang)) {
    // Dutch-first product: first run stays NL. Player can switch in the lang bar.
    save.lang = 'nl';
    persist();
  }
  applyLang();
}
