/* ============================== I18N CATALOG ========================== */
function deepMergeI18n(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const k of Object.keys(source)) {
    const sv = source[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) target[k] = {};
      deepMergeI18n(target[k], sv);
    } else target[k] = sv;
  }
  return target;
}

function seedNlGameStrings() {
  if (!I18N.nl.banner) I18N.nl.banner = {};
  Object.assign(I18N.nl.banner, {
    levelStart: 'LEVEL {n}',
    levelUp: 'LEVEL OMHOOG! Lv {lvl}',
    newWeapon: 'Nieuw wapen: {name}!',
    masterBuff: 'MEESTER-BUFF +20%',
    masterSword: 'MASTER SWORD!',
    bossWave: 'BAAS-GOLF!',
    eliteWave: 'ELITE-GOLF',
    superBossWave: 'SUPER-BAAS GOLF',
    flyerWave: 'VLIEGER-GOLF',
    rushWave: 'RUSH-GOLF',
    eliteTraitWave: 'ELITE-GOLF',
    tideWave: 'TIDE-GOLF',
    waveClear: 'Golf gewist +{heal} HP',
    waveN: 'GOLF {n}/{total}',
    fight: 'VECHT!',
    won: 'GEWONNEN!',
    lost: 'VERSLAGEN...',
    round: 'RONDE {n}',
    roundDecisive: 'RONDE {n} · beslissende ronde',
    roundMatchPoint: 'RONDE {n} · match point',
    roundWon: 'RONDE GEWONNEN!',
    roundLost: 'RONDE VERLOREN',
    p1RoundWin: 'P1 WINT RONDE!',
    p2RoundWin: 'P2 WINT RONDE!',
    timeHpVs: 'TIME! {hp1}% vs {hp2}% · {msg}',
    summon: '✦ SUMMON! ✦',
    summonAscend: '{name} → {rar}!',
    newDex: 'Nieuw {rar}: {name}! +{hp} max HP',
    pet: 'PET! {name}',
    matsStart: 'MATS · MUNTJES BONUS',
    wallStart: 'SLOOP DE MUUR!',
    bonusDone: 'BONUS KLAAR!',
    kets: 'KETS!',
    ketsBam: 'KETS-BAM!',
    wallTime: 'TIJD!',
    wallNewWall: 'MUUR GESLOOPT! Nieuwe muur...',
  });
  if (!I18N.nl.result) I18N.nl.result = {};
  Object.assign(I18N.nl.result, {
    advWin: 'GEWONNEN!', advLose: 'VERSLAGEN...', trainWin: 'KAMPIOEN!', trainLose: 'ROBOT WINT...',
    vsP1Win: 'SPELER 1 WINT!', vsP2Win: 'SPELER 2 WINT!', wallRecord: 'NIEUW RECORD!', wallTime: 'TIJD IS OM!',
    matsRecord: 'MATS RECORD!', matsDone: 'Goed gedaan, Mats!',
    perfectRun: 'Perfecte run — hou je HP hoog!',
    pickupsHelp: '{hint} — pickups helpen',
    lossBlockTip: 'Tip: blokkeer · mik omhoog op vliegers · {prog}',
    lossOrbTip: 'Tip: pak groene orbs · vul SUPER vóór baas · {prog}',
    lossGambleTip: 'Eerste nederlaag: vóór elk level kun je dobbelen — bondgenoot helpt tussen golven.',
    trainComboRecord: 'Combo-trainer: ×{n}{rec}',
    trainComboNewRec: ' — nieuw record!',
    trainStyleUnlock: 'Nieuwe stijl vrij: Chakra gloed — Instellingen → Stijl!',
    trainStyleMore: 'Unlock stijlen door meer train-wins!',
    trainLossTip: 'Spring tijdens CHIDORI-telegraph — robot mist · duck oor-lasers',
    trainTipDefault: 'Tip: duck lasers · chakra vol → Rasengan',
    vsRematchTip: 'Opnieuw = rematch · Pauze → Herstart match (0-0)',
    wallRecordShare: 'Nieuw record — share met een vriend!',
    wallComboTip: 'Tip: hou combo vast voor snellere sloop',
    wallGapTip: 'Nog {gap} stenen tot je record — combo helpt!',
    wallComboBarTip: 'Tip: snelle opeenvolgende slagen vullen de combo-balk',
    wallStrongCombo: 'Sterke combo (×{n}) — volgende keer record?',
    wallBehindPace: 'Achter record-tempo — probeer combo ×5+ voor meer sloop',
    wallGoodPace: 'Goed tempo — volgende run kan record breken!',
    matsPetTip: 'Pet coins uitgeven in Collectie → Pets · elke 2 Mats-munten = 1 pet coin',
    matsControlTip: 'Joystick omhoog = hoger mikken (slag + gooi) · shuriken max 3× snel',
    masterBuffActive: ' · Meester-buff actief',
    wavesProg: '{cur}/{total} golven',
    trainDetail: 'RabbitRobot {outcome} ({s}-{r}) · max combo ×{combo}{wins}{record}{finishers}',
    trainOutcomeWin: 'verslagen', trainOutcomeLose: 'was te sterk',
    trainWinsLine: ' · {n}x gewonnen', trainRecordLine: ' · record ×{n}',
    finishersLine: ' · {n} finishers',
    wallDetail: '{score} stenen (~{pace}/min) · record {best} · max combo ×{combo}{paceDelta}',
    wallPaceDelta: ' · tempo {delta} vs record',
    matsDetail: '{n} munten · record {best}{pet}{flyers}',
    matsPetEarned: ' · +{n} pet coins (totaal {wallet})',
    matsFlyers: ' · vliegers = +3 per hit',
    advDetailWin: 'Level {lv} · {kills} monsters · {stars}★ · max combo ×{combo}{finishers}{streak}',
    advDetailLose: 'Level {lv} · {kills} monsters · max combo ×{combo}{finishers}{streak}',
    streakLine: ' · streak ×{n}',
    gambleLine: ' · gok: {text}',
  });
  if (!I18N.nl.combat) I18N.nl.combat = {};
  Object.assign(I18N.nl.combat, {
    counter: 'COUNTER!', crit: 'CRIT!', streak3: 'STREAK ×3', streak5: 'ON FIRE!',
    streak8: 'RAMPAGE!', streak12: 'UNSTOPPABLE!', streakHold: 'STREAK ×{n} vast!',
    combo3: 'Combo ×3 — door!', combo5: 'Combo ×5 — netjes!', combo8: 'Combo ×8 — pro!',
    combo10: 'Combo ×10 — meester!', comboN: 'COMBO ×{n}!',
    pickupHp: '+HP', pickupRage: 'RAGE ×1.4', pickupChakra: 'Vol chakra!', pickupShield: 'Schild!',
    pickupSkillShard: '+1 {name} shard',
    pickupItemShard: '+1 {name} item-shard',
    giant: 'REUS!', wallCombo3: 'Combo ×3 · sloop +{pct}%',
    wallCombo5: 'Combo ×5 · sloop +{pct}%', wallCombo8: 'Combo ×8 · sloop +{pct}%',
    wallTempo: 'MUUR-TEMPO!', wallRecord: 'NIEUW RECORD!', bonus5: 'BONUS +5',
    masterSwordGain: 'Hyrules legendarische kling — 15s!',
    masterSwordFade: 'Master Sword vervaagt…',
    bossWaits: 'DE BAAS WACHT…',
    checkpoint: 'CHECKPOINT — DEEL {part}/3',
    allyHeal: '+{heal} bondgenoot',
    allyHit: '{name} −{dmg}',
    tideAllyIntro: '{name} — tide-heal tussen golven',
    tideHeal: '+{heal} tide · {name}',
    tideTraitTip: 'Snelle tide-golf — bondgenoot-heal telt extra',
    gambleSuperBoss: 'Super-baas mogelijk golf {n}',
    allyHelps: '{name} helpt je!',
    masterBuffFloater: '5× verloren — HP, snelheid & schade ↑',
    skillGate: 'Eiland-skill gate: max wapen Lv {cap}',
    aimUp: 'Joystick omhoog = hoger mikken',
    trainIntro: 'Combo-trainer — 3s oefenen, robot wacht',
    earLaser: 'Oor-laser — spring!',
    robotActive: 'Robot activeert — hou combo vast!',
    roundCombo: 'Ronde combo ×{n}',
    wallHalf: 'Halve tijd — combo vasthouden!',
    wallLast15: 'Laatste 15s — record jagen!',
    wallLast5: '5s — vol gas!',
    wallComboTipShort: 'Tip: snelle opeenvolgende slagen vullen combo',
    wallComboLost: 'Combo weg — snel weer raken!',
    wallComboLow: 'Combo bijna weg!',
    wallNearRec: 'Bijna record — nog {gap}!',
    coinPlus1: '+1 munt', coinPlus3: '+3 munten',
  });
  if (!I18N.nl.toast) I18N.nl.toast = {};
  Object.assign(I18N.nl.toast, {
    islandUnlock: '{name} ontgrendeld! Skill gate: wapens tot Lv {cap}',
    masterBuffGain: 'Meester-buff! +20% HP, snelheid & schade tot je wint',
    eggDuplicate: 'Bonus-ei dubbel: {name} (+10 XP)',
    eggNew: 'Bonus-ei! {name} ({rar})',
    dexDiscover: '{rar}: {name} ontdekt! +{hp} HP',
    petTamed: '{name} getemd — metgezel! ({cur}/{need} kills)',
    styleUnlockTome: 'Nieuwe stijl: Boekmeester!',
    styleUnlockCrystal: 'Nieuwe stijl: Kristallijn!',
    styleUnlock: 'Nieuwe stijl: {name}!',
    summon: '✦ Summon! {name} is nu {rar} — schade ×{dmg}',
    shurikenWait: 'Werpwapen even wachten…',
    shurikenSpam: 'Niet spammen — max 3 snel achter elkaar',
    missionDone: 'Missie klaar: {text}',
    claimXp: '+{xp} XP · {text}',
    noMissionReady: 'Nog geen missie klaar om te claimen',
    claimBatch1: '+{total} XP geclaimd',
    claimBatchN: '{n} missies · +{total} XP',
    dayBonusAlready: 'Dagbonus al geclaimd — morgen weer 3 nieuwe',
    dayBonusNeed1: 'Nog 1 missie claimen voor de dagbonus',
    dayBonusNeedN: 'Nog {n} missies claimen voor +80 XP dagbonus',
    dayBonusDone: 'Dagbonus! +80 XP · tot morgen',
    allClaimedTapBonus: 'Alles geclaimd — tik Dagbonus (+80 XP)',
    followUp1: 'Nog 1 missie klaar om te claimen (+{xp} XP)',
    followUpN: 'Nog {n} missies klaar · +{xp} XP',
    followUpBonus: 'Stap 3: tik Dagbonus (+80 XP)',
    achievementUnlock: 'Prestatie: {name} — bekijk bij Missies',
    charSagaUnlock: 'Unlock minstens 2 saga-icons (Ki/Scroll/Tide/Cape/Dawn)',
    charSagaClash: '{a} vs {b} — saga clash!',
    charSwap: 'P1 ↔ P2 omgewisseld',
    charNotEnough: 'Niet genoeg unlocked vechters in deze saga',
    charRandom: '{a} vs {b} · HP {hp1}/{hp2} · TOT {tot1}/{tot2}',
    charFair: 'Fair duo: {a} vs {b} · TOT Δ{diff}',
    skillUpgradeReady: '{name} kan upgraden — Collectie → Upgrades',
    skillUpgraded: '{name} Lv {lv}! {detail}',
    itemUpgradeReady: '{name} kan upgraden — Collectie → Upgrades',
    itemUpgraded: '{name} Lv {lv}! {detail}',
    skipGamble: 'Zonder gok',
    weaponIslandCap: 'Klaar voor training — in avontuur max Lv {cap}',
    petNone: 'Geen actieve pet',
    petFollow: '{name} volgt je nu!',
    petNoCoins: 'Niet genoeg pet coins',
    petBought: '{name} gekocht! Volgt je nu.',
    eggAlreadyOpened: 'Dag-ei al geopend — morgen weer',
    eggDuplicateUi: 'Dubbel ei: {name} (+10 XP)',
    eggHatch: 'Uitgekomen! {name} ({rarity})',
    eggNone: 'Geen actief ei-pet',
    eggFloat: '{name} zweeft nu mee!',
    styleEquipped: '{name} uitgerust',
    welcome: 'Welkom! Menu → Tips · per modus één korte hint bovenin (geen toast-stapel)',
  });
  if (!I18N.nl.versionUpdate) I18N.nl.versionUpdate = {};
  Object.assign(I18N.nl.versionUpdate, {
    beforeTitle: 'Versie ophalen',
    beforeBodyProgress: 'Je hebt voortgang op dit apparaat:\n{summary}\n\nSave veiligstellen vóór v{version}? Daarna kun je die save in de nieuwe versie gebruiken.',
    beforeBodyFresh: 'Nieuwe versie laden (v{version})?\nGeen voortgang gevonden — je kunt direct updaten.',
    backupAndGo: 'Ja — save maken & updaten',
    goWithout: 'Updaten zonder extra save',
    cancel: 'Annuleren',
    afterTitle: 'Save gevonden',
    afterBody: 'Vóór de update (v{from}) bewaarde je:\n{stashSummary}\n\nHuidige save:\n{currentSummary}\n\nDeze save gebruiken in v{to}?',
    useStash: 'Ja — gebruik bewaarde save',
    keepCurrent: 'Nee — houd huidige save',
    stashOk: 'Save bewaard — update start…',
    stashFail: 'Save bewaren mislukt — probeer Export in Instellingen',
    applied: 'Save van v{from} geladen in v{to} · {summary}',
    applyFail: 'Save laden mislukt — probeer Herstel backup in Instellingen',
    keptCurrent: 'Huidige save behouden',
    fail: 'Update mislukt — sluit tab en open opnieuw',
  });
  if (!I18N.nl.missionsUi) I18N.nl.missionsUi = {};
  Object.assign(I18N.nl.missionsUi, {
    flowDone: '✓ Dag afgerond — morgen 3 nieuwe missies (middernacht)',
    flowPlay: 'Speel', flowPlaySub: 'doe missies',
    flowClaim: 'Claim', flowClaimSub: '+XP',
    flowBonus: 'Dagbonus', flowBonusSub: '+80 XP',
    subDayDone: 'Dag voltooid — morgen 3 nieuwe lichte missies (middernacht)',
    subDayDoneStreak: 'Dag voltooid · {streak} — morgen 3 nieuwe lichte missies (middernacht)',
    subStep1: 'Stap 1: speel missies · max +{xp} XP vandaag — licht, geen grind',
    subStep2: 'Stap 2: claim +{xp} XP · daarna dagbonus (+80) — licht, geen grind',
    subStep3: 'Stap 3: tik Dagbonus (+80 XP) — licht, geen grind',
    summaryDone: '{done}/3 klaar · {claimed}/3 geclaimd',
    summaryReady: '{n} klaar om te claimen',
    summaryBonusReady: 'dagbonus +80 XP klaar',
    summaryBonusAfter1: 'dagbonus na 1 claim',
    summaryBonusAfterN: 'dagbonus na {n} claims',
    summaryMax: 'max vandaag +{xp} XP',
    claimAllBtn: 'Claim alle klaar',
    claimAllAfter1: 'nog 1 claim voor dagbonus +80',
    claimAllAfterN: 'nog {n} claims voor dagbonus +80',
    claimAllThenBonus: 'daarna dagbonus +80',
    dailyClaimed: 'Geclaimd',
    dailyReady: 'Klaar — tik Claim hieronder',
    dailyProgress: 'Bezig {cur}/{goal}',
    dailyReward: 'Beloning +{xp} XP',
    dailyClaimBtn: 'Claim +{xp} XP',
    dailyPlayBtn: 'Speel {mode} →',
    dailyNextUp: 'volgende',
    bonusClaimed: 'Dagbonus geclaimd',
    bonusTomorrow: 'Morgen weer nieuw',
    bonusClaimBtn: 'Dagbonus claimen',
    bonusTap: '+80 XP · tik hier',
    bonusNeed: 'Dagbonus',
    bonusNeed1: 'Nog 1 claim nodig',
    bonusNeedN: 'Nog {n} claims nodig',
    achSummary: '{got}/{total} prestaties · permanent (niet dagelijks)',
    achNear: '{n} bijna klaar',
    filterAll: 'Alle', filterNear: 'Bijna', filterOpen: 'Open', filterDone: 'Behaald',
    badgeNew: 'nieuw', badgeNear: 'bijna', stillOpen: 'nog open',
    streakDone: '{n}× dagbonus · Vastberaden!',
    streakLine: '{n}× dagbonus streak',
    statusDone: 'Vandaag klaar{streak} · {ach}/{total} prestaties · morgen nieuwe missies',
    statusStep2: 'Stap 2: claim XP',
    statusStep3: 'Stap 3: dagbonus +80 XP',
    statusStep1: 'Stap 1: speel missies',
    statusReady: '{hint} · +{xp} XP klaar · {done}/3 gedaan{streak}',
    statusAllClaimed: '{hint} — open Missies{streak} · {ach}/{total} prestaties',
    statusDefault: '{hint} · {done}/3 klaar · max +{xp} XP vandaag{streak}',
    remainderKills1: 'Nog 1 kill',
    remainderKillsN: 'Nog {n} kills',
    remainderBricks1: 'Nog 1 steen',
    remainderBricksN: 'Nog {n} stenen',
    remainderCombo: 'Nog combo ×{n}',
    remainderPickups1: 'Nog 1 pickup',
    remainderPickupsN: 'Nog {n} pickups',
    remainderRun: 'Nog 1 run',
    remainderGeneric: 'Nog {n}',
  });
  if (!I18N.nl.help) I18N.nl.help = {};
  I18N.nl.help.tips = [
    '<b>Power-ups:</b> verslagen monsters laten soms bolletjes vallen — HP, rage, chakra, schild.',
    '<b>Bazen:</b> onder half HP worden ze woester (fase 2).',
    '<b>Combo’s:</b> sla snel achter elkaar om ×2 / ×3 schade te stapelen.',
    '<b>Dash:</b> dubbel-tik links/rechts (of toets <b>Shift</b>) om te ontwijken.',
    '<b>Rasengan:</b> vul je <b>chakra</b>-balk — dan laad je een draaiende chakra-bol en knal je ‘m erin.',
    '<b>Substitutie:</b> rookwolk + ontwijk (knop of <b>Shift</b>). Korte onkwetsbaarheid.',
    '<b>Wapen-combo:</b> tik wapen 3× snel — elk wapen heeft 3 eigen moves (①②③). Raak met ① én ②, dan is ③ een <b>finisher</b> (+schade, +chakra). Meesterschap: Virtuoos 3× · Meester 10× · Legende 25× per wapen.',
    '<b>2 spelers:</b> roster met <b>5 saga-icons</b> (Ki/Scroll/Tide/Cape/Dawn parodie) + filters · best-of-3.',
    '<b>RabbitRobot:</b> hij gebruikt <b>Chidori</b> (bliksem) — wacht tot hij open is.',
    '<b>Muur:</b> 60s timer · combo-balk (+4% sloop per hit) · milestones ×3/×5/×8 · record-tempo in HUD · bom/goud bonusstenen.',
    '<b>Rariteiten:</b> Gewoon → Ongewoon → Zeldzaam → Episch → Legendarisch → Mythisch. Zeldzamer = meer XP & meer max HP.',
    '<b>50 levels:</b> <b>5 eilanden × 10 levels</b> — skill gate wapens per eiland · baas Lv 10/20/30/40/50 opent volgend eiland · 5× verlies = Meester-buff (+20%).',
    '<b>Backup:</b> elke save wordt dubbel opgeslagen — bij problemen: <b>Instellingen → Herstel save uit backup</b>.',
    '<b>Delen:</b> menu → <b>Deel link</b> — vrienden op Android openen in Chrome → Zet in app-lade. Zie ANDROID-DELEN.txt op GitHub.',
    '<b>Offline:</b> na 1× online openen cache’t de app HTML+JS — banner onderaan bij geen net. Tunnel-link heeft internet nodig; GitHub Pages + app-lade = stabielst.',
  ];
  if (!I18N.nl.menu) I18N.nl.menu = {};
  I18N.nl.menu.tips = [
    'Kies een tegel — Avontuur · Arcade · 2P · Collectie',
    '5 eilanden — baas Lv 10/20/30/40/50 opent volgend eiland',
    'Skill gate — max wapen per eiland in avontuur',
    '5× verlies op één level = Meester-buff +20%',
    'Training = solo · Versus = 2P lokaal op iPad',
    'Muur-combo’s = sneller sloop & meer XP',
    'Monsterboek vullen = meer max HP',
    'Verder spelen hervat je laatste modus',
    'Menu-muziek wisselt als je terugkeert uit een modus',
  ];
  if (!I18N.nl.ui) I18N.nl.ui = {};
  Object.assign(I18N.nl.ui, {
    menuMissionReady: 'missie klaar',
    menuFirstMinuteNext: 'Eerste minuut {seen}/{total} · probeer: {next}',
    menuFirstMinutePartial: 'Eerste minuut {seen}/{total} modi — één hint per modus bovenin',
    charArenaPre: 'VERSUS · BEST OF 3',
    charSub1: 'Speler 1 — tik een unlocked kaart (linker helft in gevecht)',
    charSub2: 'Speler 2 — tik een andere vechter (rechter helft in gevecht)',
    charStep1: 'Stap 1/2 · Choose P1',
    charStep2: 'Stap 2/2 · Choose P2',
    charRosterLine: '20 vechters · STR · RNG · mDPS · rDPS',
    charBlurbAll: '20 legends · tik kaart = kiezen · hover = stats preview',
    charEmpty: 'Geen vechters in deze saga — tik ⭐ Alle',
    charLocked: '🔒 Locked',
    charIconRow: 'Saga-icons · deel 2 — tik om te kiezen',
    charBig5Title: 'Legends · snel kiezen',
    charBig5Hint: 'Ryu · Ken · Goku · One Punch Man · Aruskankou · Kutjankorio · Xavi',
    charArenaPre: 'VERSUS · BEST OF 3',
    charHead: 'SELECT FIGHTER',
    charBackP1: '← Andere P1',
    charBackMenu: '← Menu',
    charFight: 'VECHT! (best-of-3)',
    charIpadTip: 'iPad: speler 1 gebruikt de linker helft van het scherm (joystick + knoppen), speler 2 de rechter helft. Draai je iPad liggend voor het meeste ruimte.',
    levelHead: 'Kies een eiland',
    levelSub: '5 eilanden × 10 levels · Tik level = Gooi & start · lang indrukken = zonder gok',
    gambleSub: 'Twee dobbelstenen: pech = super-baas in een willekeurige golf · geluk = sterke bondgenoot (buff alleen dit level)',
    gambleSumDefault: 'Tik Gooi & start — of overslaan zonder gok',
    gambleSumRoll: 'Som: {d1} + {d2} = {sum}',
    gambleHead: 'Gok — {island} · Lv {level}',
    gambleCtx: 'Skill gate: wapens tot Lv {cap} · daarna dobbelen voor super-baas of bondgenoot',
    gamblePreview: 'Super-baas (som ≤5) of super-bondgenoot (som ≥9) kan dit level veranderen.',
    gambleStart: 'Gooi & start',
    gambleStartSub: '2× d6 · meteen level',
    gambleSkip: 'Overslaan',
    gambleSkipSub: 'Geen gok — geen extra baas of buff',
    styleHead: 'Stijl',
    styleSub: 'Outfits met bonus — level, training, monsterboek · hover voor tooltip',
    styleActive: 'Actief',
    stylePick: 'Tik om te kiezen',
    styleIslandGate: 'Eiland-skill Lv {lvl}',
    weaponHead: 'Wapens',
    weaponSub: 'Summons zijn echt · eiland-skill gate: alleen wapens tot je huidige eiland-cap in avontuur',
    skillHead: 'Upgrades',
    skillSub: 'Shards in avontuur · skills, wapens, pets & stijl · meestal max Lv 3 · zeldzaam Lv 5',
    skillTabSkills: 'Skills',
    skillTabWeapons: 'Wapens',
    skillTabPets: 'Pets',
    skillTabStyle: 'Stijl',
    upgradeSubSkills: 'Skill-shards in avontuur · jutsu max Lv 5 · utility max Lv 3',
    upgradeSubWeapons: 'Item-shards voor unlocked wapens · mythisch max Lv 5',
    upgradeSubPets: 'Item-shards voor getemde pets · passief, assist & CD',
    upgradeSubStyle: 'Item-shards voor unlocked outfits · bonus, HP & shield',
    upgradeEmptyWeapons: 'Unlock eerst wapens via level in avontuur.',
    upgradeEmptyPets: 'Tem eerst een pet via monsterboek-kills of pet coins.',
    upgradeEmptyStyle: 'Unlock eerst stijlen via level, training of monsterboek.',
    upgradeReady: '{n} klaar om te upgraden',
    upgradeShardHint: 'Goud = skill shard · paars = wapen/pet/stijl shard',
    itemUpgrade: 'Upgrade',
    itemMax: 'MAX',
    itemShards: '{cur}/{cost} shards',
    itemLevel: 'Lv {lv}/{max}',
    itemNow: 'Nu',
    itemNext: 'Volgende',
    skillUpgrade: 'Upgrade',
    skillMax: 'MAX',
    skillShards: '{cur}/{cost} shards',
    skillShardsOnly: '{n} shards',
    skillLevel: 'Lv {lv}/{max}',
    skillNow: 'Nu',
    skillNext: 'Volgende',
    skillGroupJutsu: 'Jutsu',
    skillGroupUtility: 'Utility',
    helpFirstMinute: 'Eerste minuut — per modus één korte hint bovenin het gevecht (geen toast-stapel). Avontuur: joystick + knoppen · groen = HP · vol chakra = SUPER-knop. Training = Robot · Muur = combo · 2 spelers = links/rechts.',
    helpOnboardHead: 'Eerste-minuut hints: {seen}/{total} modi gezien · max één regel bovenin per modus',
    helpTryNext: 'Probeer als volgende: {mode}',
    helpTrySub: 'Nog niet gespeeld — één hint bovenin, geen extra toast.',
    helpHintSeen: '✓ hint gezien',
    helpHintNot: '· nog niet',
    helpTouch: 'touch',
    helpKeyboard: 'toetsenbord',
    helpIslandTitle: 'Eilanden & skill gate',
    helpIslandIntro: 'avontuur is 5×10 levels. Per eiland geldt een wapen-cap (nu Lv {cap} op eiland {cur}).',
    helpMasterBuff: 'Meester-buff: 5× verlies op hetzelfde level → +20% HP, snelheid & schade tot je wint. Baas op Lv 10/20/30/40/50 opent het volgende eiland.',
    helpIslandLocked: 'Vergrendeld — versla baas Lv {lv}',
    helpIslandProg: '{cleared}/{total} levels · {stars}/{maxStars}★ · skill gate wapens Lv {cap}',
    installSub: 'Verschijnt als icoon — net als een echte app',
    boss: 'BAAS',
    topHunter: 'Top jager',
    modeAdventure: '5 eilanden × 10 levels · skill gate wapens · Meester-buff na 5× verlies · dobbel-gok vóór level',
    modeTraining: 'Combo-trainer ×5/×8/×10 · 3s dummy · lasers · Chidori',
    modeWall: '60s · combo ×3/×5/×8 hints · record-tempo + projectie in HUD · 5s waarschuwing',
    modeVersus: 'P1 links P2 rechts · best-of-3 · rematch in pauze',
    modeCoinrun: '45s munten · 2 munten = 1 pet coin · mik ↑ · vliegers +3',
    langSwitchFail: 'Taal wisselen mislukt',
  });
  if (!I18N.nl.skill) I18N.nl.skill = {};
  Object.assign(I18N.nl.skill, {
    rasengan: 'Rasengan', chidori: 'Chidori', rinnegan: 'Rinnegan',
    subst: 'Substitutie', dash: 'Dash', chakra: 'Chakra',
  });
  if (!I18N.nl.hud) I18N.nl.hud = {};
  Object.assign(I18N.nl.hud, {
    super: 'SUPER', masterShort: 'MEESTER +20%', masterSword: 'MASTER SWORD {n}s',
    levelWave: 'Level {n} — Golf {wv}/{total}', islandWeapon: '{name} · wapen ≤ Lv {cap}',
    part: 'deel {cur}/3', waveLine: 'Golf {n}/{total}', wavesTotal: '{total} golven',
    nextWave: 'Volgende golf', eggPet: 'Ei · {name}', petActive: 'Pet · {name}',
    petDefault: 'Metgezel', cosmetic: 'Cosmetisch',
    gambleBoss: 'Super-baas mogelijk · golf {n}', starZone: ' · 3★ zone',
    star2: ' · 2★ bij >{pct}% HP', star3: ' · 3★ bij >{pct}% HP', hpPct: '{pct}% HP{hint}',
    enemiesLeft1: 'Nog 1 vijand in deze golf', enemiesLeftN: 'Nog {n} vijanden in deze golf',
    toBoss: 'Op weg naar de baas — {sec}s', walkNext: 'Verder lopen… volgende golf {sec}s',
    streak: 'STREAK ×{n}', combo: 'COMBO ×{n}', rage: 'RAGE {n}s', shield: 'Schild {n}s',
    earLaser: 'OOR-LASER — spring!', chidoriTele: 'CHIDORI — dash/spring!',
    kickTele: 'TRAP — spring/blok!', punchTele: 'SLA — blok/weg!', earLaserShort: 'OOR-LASER',
    rabbitRobot: 'RABBITROBOT · {pct}%', roundInfo: 'Ronde {n} · eerst 2 wint · {s}-{r}',
    dummyGrace: 'Dummy {n}s — oefen combo', goal: 'doel ×{n}', record: 'record ×{n}',
    time: 'TIJD', wallGen: 'MUUR ×{n}', stones: 'Stenen: {n}',
    recordGap: 'Record {best} · nog {gap} te gaan',
    recordBroken: 'Record gebroken · {rec}', recordLine: 'Record: {rec}',
    pace: '~{pace}/min · projectie ~{proj}', paceAhead: 'Voor op record-tempo +{n}',
    paceBehind: 'Achter record-tempo {n}', comboLabel: 'COMBO',
    comboSmash: '+{pct}% sloop', comboActive: 'Combo actief — nog een steen!',
    coins: 'Munten: {n}', matsRecord: 'Record Mats: {n}',
    petCoins: 'Pet coins: +{pending} · wallet {wallet}',
    matsHint: 'Joystick ↑ mik · slag/gooi hoger · shuriken op roze vliegers',
    spawnFair: 'Spawn · eerlijk start', nextRound: 'Volgende ronde',
    p1Line: 'P1 · {name} · {pct}%', p2Line: '{pct}% · {name} · P2',
    decisiveRound: 'Beslissende ronde · {s}-{r}',
    timeHpWin: 'TIME = hoogste HP % wint',
    hintDualTouch: 'P1 = linker helft · P2 = rechter helft · joystick + aanvalsknoppen',
    hintDualKb: 'P1: A/D · W · J/K/L/U · Shift  |  P2: pijltjes · 1/2/3/4/5',
    hintTouch: 'Links: joystick om te lopen · Rechts: aanvalsknoppen',
    hintKb: 'A/D lopen · W springen · J stomp · K trap · L wapen · U speciaal',
    ketsTap: 'Tik!', ketsKey: 'E / tik',
  });
}

function seedNlFromRuntime() {
  if (typeof ACHIEVEMENTS !== 'undefined') {
    if (!I18N.nl.ach) I18N.nl.ach = {};
    for (const a of ACHIEVEMENTS) I18N.nl.ach[a.id] = { name: a.name, desc: a.desc };
  }
  if (typeof DAILY_DEFS !== 'undefined') {
    if (!I18N.nl.daily) I18N.nl.daily = {};
    for (const d of DAILY_DEFS) {
      if (!I18N.nl.daily[d.id]) I18N.nl.daily[d.id] = {};
      I18N.nl.daily[d.id].text = d.text;
    }
  }
  if (typeof DAILY_PLAY_HINTS !== 'undefined') {
    if (!I18N.nl.daily) I18N.nl.daily = {};
    for (const id of Object.keys(DAILY_PLAY_HINTS)) {
      if (!I18N.nl.daily[id]) I18N.nl.daily[id] = {};
      I18N.nl.daily[id].hint = DAILY_PLAY_HINTS[id];
    }
  }
  if (typeof WEAPONS !== 'undefined') {
    if (!I18N.nl.weapon) I18N.nl.weapon = {};
    for (const w of WEAPONS) I18N.nl.weapon[w.id] = { name: w.name, desc: w.desc };
  }
  if (typeof STYLES !== 'undefined') {
    if (!I18N.nl.style) I18N.nl.style = {};
    for (const s of STYLES) I18N.nl.style[s.id] = { name: s.name, hint: s.hint, tooltip: s.tooltip, bonus: s.bonus };
  }
  if (typeof PICKUP_META !== 'undefined') {
    if (!I18N.nl.pickup) I18N.nl.pickup = {};
    for (const kind of PICKUP_TYPES || Object.keys(PICKUP_META)) {
      const m = PICKUP_META[kind];
      if (m && m.label) I18N.nl.pickup[kind] = m.label;
    }
  }
}

function mergeI18nCatalogs() {
  seedNlFromRuntime();
  seedNlGameStrings();
  deepMergeI18n(I18N.en, CATALOG_EN);
  deepMergeI18n(I18N.de, CATALOG_DE);
  deepMergeI18n(I18N.fr, CATALOG_FR);
  deepMergeI18n(I18N.es, CATALOG_ES);
}

const CATALOG_EN = {
  ach: {
    first_win: { name: 'First triumph', desc: 'Win your first level' },
    lv10: { name: 'Growing ninja', desc: 'Reach fighter Lv 10' },
    dex10: { name: 'Monster expert', desc: '10 species in monster book' },
    dexFull: { name: 'Encyclopedia', desc: 'All monster species discovered' },
    dex100: { name: 'Hunter', desc: '100 monster kills logged' },
    dexHalf: { name: 'Field guide', desc: 'Half of all species discovered' },
    dexTiers: { name: 'Rarity hunter', desc: '4 different rarities in book' },
    dexMythic: { name: 'Myth seeker', desc: 'Discover one mythic monster' },
    train5: { name: 'Robot breaker', desc: 'Win training 5×' },
    wall100: { name: 'Demolisher', desc: 'Wall record 100+' },
    combo8: { name: 'Combo king', desc: 'Reach combo ×8' },
    finisher10: { name: 'Style master', desc: 'Land 10 weapon finishers' },
    finisher1: { name: 'First style', desc: 'Land your first weapon finisher' },
    weaponMaster25: { name: 'Weapon legend', desc: '25 finishers with one weapon' },
    finisher50: { name: 'Combo sensei', desc: '50 finishers total' },
    streak10: { name: 'Unstoppable', desc: 'Kill streak ×10 in adventure' },
    trainCombo10: { name: 'Dummy master', desc: 'Training combo ×10' },
    lv50: { name: 'Legend', desc: 'Unlock level 50' },
    daily7: { name: 'Determined', desc: 'Claim 7 daily bonuses' },
    vs5: { name: 'Duelist', desc: 'Play 5× 2-player duels' },
    vs_roster: { name: 'Full roster', desc: 'Play 10+ different fighters (2P)' },
    saga_icons: { name: 'Saga legends', desc: 'Play 2P with all 7 legend picks' },
  },
  daily: {
    kills12: { text: 'Defeat 12 monsters', hint: 'Play Adventure or Training' },
    advwin: { text: 'Win 1 adventure level', hint: 'Menu → Adventure, win the level' },
    wall35: { text: 'Smash 35 wall bricks', hint: 'Menu → Wall smash (combo helps)' },
    trainwin: { text: 'Win training vs Robot', hint: 'Menu → Training vs RabbitRobot' },
    combo5: { text: 'Reach combo ×5', hint: 'Adventure: fast combos on monsters' },
    finisher3: { text: 'Land 3 weapon finishers', hint: 'Adventure/Training: hit ①+②, then finisher ③' },
    pick3: { text: 'Grab 3 power-ups', hint: 'Adventure: green/orange/blue orbs' },
    boss1: { text: 'Defeat 1 boss monster', hint: 'Adventure: boss at end of a level' },
  },
  weapon: {
    vuist: { name: 'Fists', desc: 'Taijutsu basics' },
    kunai: { name: 'Kunai', desc: 'Classic ninja blade' },
    shuriken: { name: 'Shuriken', desc: 'Throws sharp stars' },
    tanto: { name: 'Tanto', desc: 'Short blade · fast' },
    zwaard: { name: 'Ninja sword', desc: 'Kenjutsu all-rounder' },
    sai: { name: 'Sai', desc: 'Three-prong · parry' },
    knuppel: { name: 'Club', desc: 'Raw blunt force' },
    waaier: { name: 'War fan', desc: 'Fan slash · stylish' },
    speer: { name: 'Spear', desc: 'Huge reach' },
    tonfa: { name: 'Tonfa', desc: 'Side handle · flurry' },
    nunchaku: { name: 'Nunchaku', desc: 'Lightning fast' },
    kama: { name: 'Kama', desc: 'Sickle · hook strikes' },
    boemerang: { name: 'Boomerang', desc: 'Comes back' },
    zeis: { name: 'Shadow scythe', desc: 'Long arc · dark' },
    hamer: { name: 'Sledgehammer', desc: 'Smashes everything' },
    drietand: { name: 'Trident', desc: 'Three points · thrust' },
    ketting: { name: 'Chain blade', desc: 'Reach + pressure' },
    bostaf: { name: 'Bo staff', desc: 'Long staff · tempo' },
    laser: { name: 'Chakra blade', desc: 'Blue burning edge' },
    fuuma: { name: 'Fūma shuriken', desc: 'Large throwing star' },
    kristal: { name: 'Crystal blade', desc: 'Shard slash' },
    donder: { name: 'Lightning axe', desc: 'Like Chidori, but an axe' },
    vlamzweep: { name: 'Flame whip', desc: 'Fire line · long reach' },
    void: { name: 'Void claw', desc: 'Mythic claw' },
    sterkling: { name: 'Star blade', desc: 'Sky metal · crits' },
    guvve: { name: 'Guvvedukkie stick', desc: 'Quack. Please. Boom.' },
  },
  style: {
    classic: { name: 'Classic', hint: 'Standard ninja', tooltip: 'Base ninja — no bonus, fastest unlock.', bonus: 'No combat bonus' },
    konoha: { name: 'Konoha bandana', hint: 'Unlock at Lv 5', tooltip: 'Leaf village headband. Slightly more max HP — steady in long levels.', bonus: '+5 max HP' },
    chakra: { name: 'Chakra glow', hint: 'Win training 3×', tooltip: 'Blue chakra aura. Chakra charges faster — more Rasengan/Chidori.', bonus: '+8% chakra regen' },
    akatsuki: { name: 'Red cloak', hint: 'Unlock at Lv 12', tooltip: 'Red cloak — aggressive hits. More melee and weapon damage.', bonus: '+4% damage' },
    shadow: { name: 'Shadow ninja', hint: 'Unlock at Lv 15', tooltip: 'Shadow steps. Extra crit chance on all hits.', bonus: '+3% crit' },
    guvve: { name: 'Guvvedukkie', hint: '8 monsters in book', tooltip: 'Quack cosplay. Bonus XP on adventure kills — light, no grind.', bonus: '+6% adventure XP' },
    gold: { name: 'Legendary', hint: 'Unlock at Lv 25', tooltip: 'Golden outline + glow. Stronger knockback on kicks and specials.', bonus: '+10% knockback' },
    sand: { name: 'Desert', hint: 'Unlock at Lv 8', tooltip: 'Sand cloak — less damage taken and stronger block. Tank style for crowds.', bonus: '−14% damage · block −25% chip' },
    samurai: { name: 'Samurai', hint: 'Unlock at Lv 20', tooltip: 'Topknot + katana stance. Weapon combos reach slightly farther.', bonus: '+8% weapon reach' },
    cyber: { name: 'Cyber ninja', hint: 'Unlock at Lv 18', tooltip: 'Neon visor + lightning flash on melee. Faster chakra and chain sparks.', bonus: 'Lightning FX · +6% chakra' },
    fox: { name: 'Fox ninja', hint: '12 monsters in book', tooltip: 'Fox ears — faster on the ground. Great for kiting and shuriken.', bonus: '+5% move speed' },
    storm: { name: 'Storm spirit', hint: 'Win training 5×', tooltip: 'Storm aura + soft lightning. Extra shield at start of each wave.', bonus: 'Lightning glow · +0.8s shield/wave' },
    void: { name: 'Void walker', hint: 'Unlock at Lv 40', tooltip: 'Void cloak — heavier jutsu. Specials (Rasengan/Chidori/Rinnegan) hit harder.', bonus: '+8% jutsu damage' },
    hunter: { name: 'Hunter look', hint: '75 kills in monster book', tooltip: 'Hunter cape + green accents. Bonus damage vs monsters in adventure.', bonus: '+6% vs monsters' },
    crystal: { name: 'Crystalline', hint: '4 rarities in monster book', tooltip: 'Crystal shard — reflective glow. Short shield each wave.', bonus: '+1.0s shield/wave' },
    tome: { name: 'Bookmaster', hint: 'Half the monster book', tooltip: 'Monster book on your back. More HP bonus on new dex discoveries.', bonus: '+4 max HP · book wisdom' },
  },
  pickup: { heal: '+HP', rage: 'RAGE', chakra: 'CHAKRA', shield: 'SHIELD' },
  result: {
    advWin: 'VICTORY!', advLose: 'DEFEATED...', trainWin: 'CHAMPION!', trainLose: 'ROBOT WINS...',
    vsP1Win: 'PLAYER 1 WINS!', vsP2Win: 'PLAYER 2 WINS!', wallRecord: 'NEW RECORD!', wallTime: "TIME'S UP!",
    matsRecord: 'MATS RECORD!', matsDone: 'Nice job, Mats!',
    perfectRun: 'Perfect run — keep HP high!',
    pickupsHelp: '{hint} — pickups help',
    lossBlockTip: 'Tip: block · aim up at flyers · {prog}',
    lossOrbTip: 'Tip: grab green orbs · fill SUPER before boss · {prog}',
    lossGambleTip: 'First loss: before each level you can gamble — ally helps between waves.',
    trainComboRecord: 'Combo trainer: ×{n}{rec}',
    trainComboNewRec: ' — new record!',
    trainStyleUnlock: 'New style unlocked: Chakra glow — Settings → Style!',
    trainStyleMore: 'Unlock styles with more training wins!',
    trainLossTip: 'Jump during CHIDORI telegraph — robot misses · duck ear-lasers',
    trainTipDefault: 'Tip: duck lasers · full chakra → Rasengan',
    vsRematchTip: 'Again = rematch · Pause → Restart match (0-0)',
    wallRecordShare: 'New record — share with a friend!',
    wallComboTip: 'Tip: keep combo for faster smash',
    wallGapTip: '{gap} bricks to your record — combo helps!',
    wallComboBarTip: 'Tip: quick consecutive hits fill the combo bar',
    wallStrongCombo: 'Strong combo (×{n}) — record next time?',
    wallBehindPace: 'Behind record pace — try combo ×5+ for more smash',
    wallGoodPace: 'Good pace — next run could break record!',
    matsPetTip: 'Spend pet coins in Collection → Pets · every 2 Mats coins = 1 pet coin',
    matsControlTip: 'Joystick up = aim higher (melee + throw) · shuriken max 3× fast',
    masterBuffActive: ' · Master buff active',
    wavesProg: '{cur}/{total} waves',
    trainDetail: 'RabbitRobot {outcome} ({s}-{r}) · max combo ×{combo}{wins}{record}{finishers}',
    trainOutcomeWin: 'defeated', trainOutcomeLose: 'was too strong',
    trainWinsLine: ' · {n} wins', trainRecordLine: ' · record ×{n}',
    finishersLine: ' · {n} finishers',
    wallDetail: '{score} bricks (~{pace}/min) · record {best} · max combo ×{combo}{paceDelta}',
    wallPaceDelta: ' · pace {delta} vs record',
    matsDetail: '{n} coins · record {best}{pet}{flyers}',
    matsPetEarned: ' · +{n} pet coins (total {wallet})',
    matsFlyers: ' · flyers = +3 per hit',
    advDetailWin: 'Level {lv} · {kills} monsters · {stars}★ · max combo ×{combo}{finishers}{streak}',
    advDetailLose: 'Level {lv} · {kills} monsters · max combo ×{combo}{finishers}{streak}',
    streakLine: ' · streak ×{n}',
    gambleLine: ' · gamble: {text}',
  },
  banner: {
    levelStart: 'LEVEL {n}',
    levelUp: 'LEVEL UP! Lv {lvl}', newWeapon: 'New weapon: {name}!', masterBuff: 'MASTER BUFF +20%',
    masterSword: 'MASTER SWORD!',
    bossWave: 'BOSS WAVE!', eliteWave: 'ELITE WAVE', superBossWave: 'SUPER-BOSS WAVE',
    flyerWave: 'FLYER WAVE', rushWave: 'RUSH WAVE', eliteTraitWave: 'ELITE WAVE', tideWave: 'TIDE WAVE',
    waveClear: 'Wave cleared +{heal} HP', waveN: 'WAVE {n}/{total}',
    fight: 'FIGHT!', won: 'VICTORY!', lost: 'DEFEATED...',
    round: 'ROUND {n}', roundDecisive: 'ROUND {n} · decisive round', roundMatchPoint: 'ROUND {n} · match point',
    roundWon: 'ROUND WON!', roundLost: 'ROUND LOST',
    p1RoundWin: 'P1 WINS ROUND!', p2RoundWin: 'P2 WINS ROUND!',
    timeHpVs: 'TIME! {hp1}% vs {hp2}% · {msg}',
    summon: '✦ SUMMON! ✦', summonAscend: '{name} → {rar}!',
    newDex: 'New {rar}: {name}! +{hp} max HP', pet: 'PET! {name}',
    matsStart: 'MATS · COIN BONUS', wallStart: 'SMASH THE WALL!', bonusDone: 'BONUS DONE!',
    kets: 'KETS!', ketsBam: 'KETS-BAM!', wallTime: 'TIME!', wallNewWall: 'WALL SMASHED! New wall...',
  },
  help: { tips: [
    'Power-ups: defeated monsters sometimes drop orbs — HP, rage, chakra, shield.',
    'Bosses: below half HP they get fiercer (phase 2).',
    'Combos: hit quickly in a row to stack ×2 / ×3 damage.',
    'Dash: double-tap left/right (or Shift) to dodge.',
    'Rasengan: fill your chakra bar — then charge a spinning orb and slam it in.',
    'Substitution: smoke cloud + dodge (button or Shift). Brief invulnerability.',
    'Weapon combo: tap weapon 3× fast — each weapon has 3 moves (①②③). Hit with ① and ②, then ③ is a finisher (+damage, +chakra). Mastery: Virtuoso 3× · Master 10× · Legend 25× per weapon.',
    '2 players: roster with 5 saga-icons (Ki/Scroll/Tide/Cape/Dawn parody) + filters · best-of-3.',
    'RabbitRobot: uses Chidori (lightning) — wait until he opens up.',
    'Wall: 60s timer · combo bar (+4% smash per hit) · milestones ×3/×5/×8 · record pace in HUD · bomb/gold bonus bricks.',
    'Rarities: Common → Uncommon → Rare → Epic → Legendary → Mythic. Rarer = more XP & max HP.',
    '50 levels: 5 islands × 10 levels — skill gate weapons per island · boss Lv 10/20/30/40/50 opens next island · 5× loss = Master buff (+20%).',
    'Backup: every save is stored twice — if needed: Settings → Restore save from backup.',
    'Share: menu → Share link — friends on Android open in Chrome → Add to home screen. See ANDROID-DELEN.txt on GitHub.',
    'Offline: after opening online once the app caches HTML+JS — banner at bottom when offline. Tunnel links need internet; GitHub Pages + home screen = most stable.',
  ] },
  toast: {
    unknownMode: 'Unknown mode', noSession: 'No session yet — pick a mode',
    missionsIntro: 'Missions: Play → claim XP → daily bonus — light, no grind',
    missionReady1: '1 mission ready to claim', missionReadyN: '{n} missions ready to claim',
    dayBonusReady: 'Daily bonus +80 XP ready', noPlayLink: 'No play link found — see Settings',
    pasteSaveFirst: 'Paste save JSON in the box first', importPreview: 'Import preview — tap Import again to load',
    invalidSave: 'Invalid save — check JSON', noBackup: 'No backup found on this device',
    backupConfirm: 'Backup Lv {lvl}{drift} — tap again to restore',
    backupRestored: 'Backup restored — save + backup in sync',
    backupFailed: 'Backup restore failed — export save if you have one',
    syncConfirm: 'Sync overwrites backup with main save — tap again',
    syncOk: 'Backup synced with main save', syncFailed: 'Sync failed — export save as backup',
    clearConfirm: 'Tap again = wipe progress (backup stays)', newStart: 'Fresh start — backup still in Settings',
    exportCopied: 'Save copied + download · {summary} (~{size})',
    exportBox: 'Save in box + download · {summary} (~{size})',
    islandUnlock: '{name} unlocked! Skill gate: weapons up to Lv {cap}',
    masterBuffGain: 'Master buff! +20% HP, speed & damage until you win',
    eggDuplicate: 'Bonus egg duplicate: {name} (+10 XP)',
    eggNew: 'Bonus egg! {name} ({rar})',
    dexDiscover: '{rar}: {name} discovered! +{hp} HP',
    petTamed: '{name} tamed — companion! ({cur}/{need} kills)',
    styleUnlockTome: 'New style: Bookmaster!',
    styleUnlockCrystal: 'New style: Crystalline!',
    styleUnlock: 'New style: {name}!',
    summon: '✦ Summon! {name} is now {rar} — damage ×{dmg}',
    shurikenWait: 'Throw weapon on cooldown…',
    shurikenSpam: "Don't spam — max 3 rapid throws",
    missionDone: 'Mission complete: {text}',
    claimXp: '+{xp} XP · {text}',
    noMissionReady: 'No mission ready to claim yet',
    claimBatch1: '+{total} XP claimed',
    claimBatchN: '{n} missions · +{total} XP',
    dayBonusAlready: 'Daily bonus already claimed — 3 new tomorrow',
    dayBonusNeed1: 'Claim 1 more mission for daily bonus',
    dayBonusNeedN: 'Claim {n} more missions for +80 XP daily bonus',
    dayBonusDone: 'Daily bonus! +80 XP · see you tomorrow',
    allClaimedTapBonus: 'All claimed — tap Daily bonus (+80 XP)',
    followUp1: '1 more mission ready to claim (+{xp} XP)',
    followUpN: '{n} more missions ready · +{xp} XP',
    followUpBonus: 'Step 3: tap Daily bonus (+80 XP)',
    achievementUnlock: 'Achievement: {name} — see Missions',
    charSagaUnlock: 'Unlock at least 2 saga-icons (Ki/Scroll/Tide/Cape/Dawn)',
    charSagaClash: '{a} vs {b} — saga clash!',
    charSwap: 'P1 ↔ P2 swapped',
    charNotEnough: 'Not enough unlocked fighters in this saga',
    charRandom: '{a} vs {b} · HP {hp1}/{hp2} · TOT {tot1}/{tot2}',
    charFair: 'Fair duo: {a} vs {b} · TOT Δ{diff}',
    skillUpgradeReady: '{name} ready to upgrade — Collection → Upgrades',
    skillUpgraded: '{name} Lv {lv}! {detail}',
    itemUpgradeReady: '{name} ready to upgrade — Collection → Upgrades',
    itemUpgraded: '{name} Lv {lv}! {detail}',
    skipGamble: 'No gamble',
    weaponIslandCap: 'Ready for training — in adventure max Lv {cap}',
    petNone: 'No active pet',
    petFollow: '{name} follows you now!',
    petNoCoins: 'Not enough pet coins',
    petBought: '{name} bought! Follows you now.',
    eggAlreadyOpened: 'Daily egg already opened — try tomorrow',
    eggDuplicateUi: 'Duplicate egg: {name} (+10 XP)',
    eggHatch: 'Hatched! {name} ({rarity})',
    eggNone: 'No active egg pet',
    eggFloat: '{name} floats along now!',
    styleEquipped: '{name} equipped',
    welcome: 'Welcome! Menu → Tips · one short hint per mode (no toast stack)',
  },
  versionUpdate: {
    beforeTitle: 'Fetch new version',
    beforeBodyProgress: 'You have progress on this device:\n{summary}\n\nBack up save before v{version}? You can use it in the new version after reload.',
    beforeBodyFresh: 'Load new version (v{version})?\nNo progress found — you can update directly.',
    backupAndGo: 'Yes — back up save & update',
    goWithout: 'Update without extra backup',
    cancel: 'Cancel',
    afterTitle: 'Save found',
    afterBody: 'Before update (v{from}) you saved:\n{stashSummary}\n\nCurrent save:\n{currentSummary}\n\nUse this save in v{to}?',
    useStash: 'Yes — use saved backup',
    keepCurrent: 'No — keep current save',
    stashOk: 'Save backed up — starting update…',
    stashFail: 'Backup failed — try Export in Settings',
    applied: 'Save from v{from} loaded in v{to} · {summary}',
    applyFail: 'Load failed — try Restore backup in Settings',
    keptCurrent: 'Kept current save',
    fail: 'Update failed — close tab and reopen',
  },
  missionsUi: {
    flowDone: '✓ Day complete — 3 new missions tomorrow (midnight)',
    flowPlay: 'Play', flowPlaySub: 'do missions',
    flowClaim: 'Claim', flowClaimSub: '+XP',
    flowBonus: 'Daily bonus', flowBonusSub: '+80 XP',
    subDayDone: 'Day complete — 3 new light missions tomorrow (midnight)',
    subDayDoneStreak: 'Day complete · {streak} — 3 new light missions tomorrow (midnight)',
    subStep1: 'Step 1: play missions · max +{xp} XP today — light, no grind',
    subStep2: 'Step 2: claim +{xp} XP · then daily bonus (+80) — light, no grind',
    subStep3: 'Step 3: tap Daily bonus (+80 XP) — light, no grind',
    summaryDone: '{done}/3 done · {claimed}/3 claimed',
    summaryReady: '{n} ready to claim',
    summaryBonusReady: 'daily bonus +80 XP ready',
    summaryBonusAfter1: 'daily bonus after 1 claim',
    summaryBonusAfterN: 'daily bonus after {n} claims',
    summaryMax: 'max today +{xp} XP',
    claimAllBtn: 'Claim all ready',
    claimAllAfter1: '1 more claim for +80 daily bonus',
    claimAllAfterN: '{n} more claims for +80 daily bonus',
    claimAllThenBonus: 'then daily bonus +80',
    dailyClaimed: 'Claimed',
    dailyReady: 'Ready — tap Claim below',
    dailyProgress: 'In progress {cur}/{goal}',
    dailyReward: 'Reward +{xp} XP',
    dailyClaimBtn: 'Claim +{xp} XP',
    dailyPlayBtn: 'Play {mode} →',
    dailyNextUp: 'next up',
    bonusClaimed: 'Daily bonus claimed',
    bonusTomorrow: 'New tomorrow',
    bonusClaimBtn: 'Claim daily bonus',
    bonusTap: '+80 XP · tap here',
    bonusNeed: 'Daily bonus',
    bonusNeed1: '1 more claim needed',
    bonusNeedN: '{n} more claims needed',
    achSummary: '{got}/{total} achievements · permanent (not daily)',
    achNear: '{n} almost done',
    filterAll: 'All', filterNear: 'Almost', filterOpen: 'Open', filterDone: 'Earned',
    badgeNew: 'new', badgeNear: 'almost', stillOpen: 'still open',
    streakDone: '{n}× daily bonus · Determined!',
    streakLine: '{n}× daily bonus streak',
    statusDone: 'Done today{streak} · {ach}/{total} achievements · new missions tomorrow',
    statusStep2: 'Step 2: claim XP',
    statusStep3: 'Step 3: daily bonus +80 XP',
    statusStep1: 'Step 1: play missions',
    statusReady: '{hint} · +{xp} XP ready · {done}/3 done{streak}',
    statusAllClaimed: '{hint} — open Missions{streak} · {ach}/{total} achievements',
    statusDefault: '{hint} · {done}/3 done · max +{xp} XP today{streak}',
    remainderKills1: '1 kill left',
    remainderKillsN: '{n} kills left',
    remainderBricks1: '1 brick left',
    remainderBricksN: '{n} bricks left',
    remainderCombo: 'combo ×{n} left',
    remainderPickups1: '1 pickup left',
    remainderPickupsN: '{n} pickups left',
    remainderRun: '1 run left',
    remainderGeneric: '{n} left',
  },
  ui: {
    menuMissionReady: 'mission ready',
    menuFirstMinuteNext: 'First minute {seen}/{total} · try: {next}',
    menuFirstMinutePartial: 'First minute {seen}/{total} modes — one hint per mode at top',
    charSub1: 'Player 1 — tap an unlocked card (left half in fight)',
    charSub2: 'Player 2 — tap another fighter (right half in fight)',
    charStep1: 'Step 1/2 · Choose P1',
    charStep2: 'Step 2/2 · Choose P2',
    charRosterLine: '20 fighters · STR · RNG · mDPS · rDPS',
    charBlurbAll: '20 legends · tap card to pick · hover = stat preview',
    charEmpty: 'No fighters in this saga — tap ⭐ All',
    charLocked: '🔒 Locked',
    charIconRow: 'Saga icons · part 2 — tap to pick',
    charBig5Title: 'Legends · quick pick',
    charBig5Hint: 'Ryu · Ken · Goku · One Punch Man · Aruskankou · Kutjankorio · Xavi',
    charArenaPre: 'VERSUS · BEST OF 3',
    charHead: 'SELECT FIGHTER',
    charBackP1: '← Other P1',
    charBackMenu: '← Menu',
    charFight: 'FIGHT! (best-of-3)',
    charIpadTip: 'iPad: player 1 uses the left half (joystick + buttons), player 2 the right half. Landscape works best.',
    levelHead: 'Pick an island',
    levelSub: '5 islands × 10 levels · Tap level = Roll & start · long press = no gamble',
    gambleSub: 'Two dice: bad luck = super-boss in a random wave · lucky = strong ally (buff this level only)',
    gambleSumDefault: 'Tap Roll & start — or skip with no gamble',
    gambleSumRoll: 'Sum: {d1} + {d2} = {sum}',
    gambleHead: 'Gamble — {island} · Lv {level}',
    gambleCtx: 'Skill gate: weapons up to Lv {cap} · then roll for super-boss or ally',
    gamblePreview: 'Super-boss (sum ≤5) or super-ally (sum ≥9) can change this level.',
    gambleStart: 'Roll & start',
    gambleStartSub: '2× d6 · straight into level',
    gambleSkip: 'Skip',
    gambleSkipSub: 'No gamble — no extra boss or buff',
    styleHead: 'Style',
    styleSub: 'Outfits with bonus — level, training, monster book · hover for tooltip',
    styleActive: 'Active',
    stylePick: 'Tap to equip',
    styleIslandGate: 'Island skill Lv {lvl}',
    weaponHead: 'Weapons',
    weaponSub: 'Summons are real · island skill gate: adventure weapons up to your island cap',
    skillHead: 'Upgrades',
    skillSub: 'Adventure shards · skills, weapons, pets & style · usually max Lv 3 · rare Lv 5',
    skillTabSkills: 'Skills',
    skillTabWeapons: 'Weapons',
    skillTabPets: 'Pets',
    skillTabStyle: 'Style',
    upgradeSubSkills: 'Skill shards in adventure · jutsu max Lv 5 · utility max Lv 3',
    upgradeSubWeapons: 'Item shards for unlocked weapons · mythic max Lv 5',
    upgradeSubPets: 'Item shards for tamed pets · passive, assist & CD',
    upgradeSubStyle: 'Item shards for unlocked outfits · bonus, HP & shield',
    upgradeEmptyWeapons: 'Unlock weapons via adventure level first.',
    upgradeEmptyPets: 'Tame a pet via monster book kills or pet coins first.',
    upgradeEmptyStyle: 'Unlock styles via level, training or monster book first.',
    upgradeReady: '{n} ready to upgrade',
    upgradeShardHint: 'Gold = skill shard · purple = weapon/pet/style shard',
    itemUpgrade: 'Upgrade',
    itemMax: 'MAX',
    itemShards: '{cur}/{cost} shards',
    itemLevel: 'Lv {lv}/{max}',
    itemNow: 'Now',
    itemNext: 'Next',
    skillUpgrade: 'Upgrade',
    skillMax: 'MAX',
    skillShards: '{cur}/{cost} shards',
    skillShardsOnly: '{n} shards',
    skillLevel: 'Lv {lv}/{max}',
    skillNow: 'Now',
    skillNext: 'Next',
    skillGroupJutsu: 'Jutsu',
    skillGroupUtility: 'Utility',
    helpFirstMinute: 'First minute — one short hint per mode at top (no toast stack). Adventure: joystick + buttons · green = HP · full chakra = SUPER. Training = Robot · Wall = combo · 2P = left/right.',
    helpOnboardHead: 'First-minute hints: {seen}/{total} modes seen · max one line per mode at top',
    helpTryNext: 'Try next: {mode}',
    helpTrySub: 'Not played yet — one hint at top, no extra toast.',
    helpHintSeen: '✓ hint seen',
    helpHintNot: '· not yet',
    helpTouch: 'touch',
    helpKeyboard: 'keyboard',
    helpIslandTitle: 'Islands & skill gate',
    helpIslandIntro: 'adventure is 5×10 levels. Each island has a weapon cap (now Lv {cap} on island {cur}).',
    helpMasterBuff: 'Master buff: 5× loss on same level → +20% HP, speed & damage until you win. Boss Lv 10/20/30/40/50 opens next island.',
    helpIslandLocked: 'Locked — beat boss Lv {lv}',
    helpIslandProg: '{cleared}/{total} levels · {stars}/{maxStars}★ · skill gate weapons Lv {cap}',
    installSub: 'Shows as an icon — like a real app',
    boss: 'BOSS',
    topHunter: 'Top hunter',
    modeAdventure: '5 islands × 10 levels · skill gate weapons · Master buff after 5× loss · gamble roll before level',
    modeTraining: 'Combo trainer ×5/×8/×10 · 3s dummy · lasers · Chidori',
    modeWall: '60s · combo ×3/×5/×8 hints · record pace + projection in HUD · 5s warning',
    modeVersus: 'P1 left P2 right · best-of-3 · rematch in pause',
    modeCoinrun: '45s coins · 2 coins = 1 pet coin · aim ↑ · flyers +3',
    langSwitchFail: 'Language switch failed',
  },
  fighter: {
    chakraEmpty: 'Chakra not full!', subst: 'Substitution!', dash: 'Dash!',
    shield: 'Shield!', parry: 'PARRY!', block: 'BLOCK!', miss: 'MISS!',
  },
  egg: { dailyReady: 'Daily egg ready', advBonus: 'Bonus egg: win 1× adventure', tomorrow: 'Egg again tomorrow' },
  pet: {
    active: 'Pet · active', tamed: 'Pet · tamed', buy: 'Pet · buy {cost} 🪙',
    killsNeed: 'Pet · {need} kills', killsProgress: 'Pet · {cur}/{need} kills',
  },
  menu: { tips: [
    'Pick a tile — Adventure · Arcade · 2P · Collection',
    '5 islands — boss Lv 10/20/30/40/50 opens next island',
    'Skill gate — max weapon per island in adventure',
    '5× loss on one level = Master buff +20%',
    'Training = solo · Versus = 2P local on iPad',
    'Wall combos = faster smash & more XP',
    'Fill monster book = more max HP',
    'Continue resumes your last mode',
    'Menu music changes when you return from a mode',
  ] },
  combat: {
    counter: 'COUNTER!', crit: 'CRIT!', streak3: 'STREAK ×3', streak5: 'ON FIRE!',
    streak8: 'RAMPAGE!', streak12: 'UNSTOPPABLE!', streakHold: 'STREAK ×{n} locked!',
    combo3: 'Combo ×3 — keep going!', combo5: 'Combo ×5 — nice!', combo8: 'Combo ×8 — pro!',
    combo10: 'Combo ×10 — master!', comboN: 'COMBO ×{n}!',
    pickupHp: '+HP', pickupRage: 'RAGE ×1.4', pickupChakra: 'Full chakra!', pickupShield: 'Shield!',
    pickupSkillShard: '+1 {name} shard',
    pickupItemShard: '+1 {name} item-shard',
    giant: 'GIANT!', wallCombo3: 'Combo ×3 · smash +{pct}%',
    wallCombo5: 'Combo ×5 · smash +{pct}%', wallCombo8: 'Combo ×8 · smash +{pct}%',
    wallTempo: 'WALL TEMPO!', wallRecord: 'NEW RECORD!', bonus5: 'BONUS +5',
    masterSwordGain: "Hyrule's legendary blade — 15s!",
    masterSwordFade: 'Master Sword fades…',
    bossWaits: 'THE BOSS AWAITS…',
    checkpoint: 'CHECKPOINT — PART {part}/3',
    allyHeal: '+{heal} ally', allyHit: '{name} −{dmg}',
    tideAllyIntro: '{name} — tide heal between waves',
    tideHeal: '+{heal} tide · {name}',
    tideTraitTip: 'Fast tide wave — ally heal counts extra',
    gambleSuperBoss: 'Super-boss possible wave {n}', allyHelps: '{name} helps you!',
    masterBuffFloater: '5× lost — HP, speed & damage ↑',
    skillGate: 'Island skill gate: max weapon Lv {cap}',
    aimUp: 'Joystick up = aim higher',
    trainIntro: 'Combo trainer — 3s practice, robot waits',
    earLaser: 'Ear-laser — jump!', robotActive: 'Robot active — keep combo!',
    roundCombo: 'Round combo ×{n}',
    wallHalf: 'Half time — keep combo!', wallLast15: 'Last 15s — chase record!',
    wallLast5: '5s — full gas!', wallComboTipShort: 'Tip: quick consecutive hits fill combo',
    wallComboLost: 'Combo gone — hit again fast!', wallComboLow: 'Combo almost gone!',
    wallNearRec: 'Almost record — {gap} to go!', coinPlus1: '+1 coin', coinPlus3: '+3 coins',
  },
  hud: {
    super: 'SUPER', masterShort: 'MASTER +20%', masterSword: 'MASTER SWORD {n}s',
    levelWave: 'Level {n} — Wave {wv}/{total}', islandWeapon: '{name} · weapon ≤ Lv {cap}',
    part: 'part {cur}/3', waveLine: 'Wave {n}/{total}', wavesTotal: '{total} waves',
    nextWave: 'Next wave', eggPet: 'Egg · {name}', petActive: 'Pet · {name}',
    petDefault: 'Companion', cosmetic: 'Cosmetic',
    gambleBoss: 'Super-boss possible · wave {n}', starZone: ' · 3★ zone',
    star2: ' · 2★ at >{pct}% HP', star3: ' · 3★ at >{pct}% HP', hpPct: '{pct}% HP{hint}',
    enemiesLeft1: '1 enemy left this wave', enemiesLeftN: '{n} enemies left this wave',
    toBoss: 'Heading to boss — {sec}s', walkNext: 'Walking on… next wave {sec}s',
    streak: 'STREAK ×{n}', combo: 'COMBO ×{n}', rage: 'RAGE {n}s', shield: 'Shield {n}s',
    earLaser: 'EAR-LASER — jump!', chidoriTele: 'CHIDORI — dash/jump!',
    kickTele: 'KICK — jump/block!', punchTele: 'PUNCH — block/dodge!', earLaserShort: 'EAR-LASER',
    rabbitRobot: 'RABBITROBOT · {pct}%', roundInfo: 'Round {n} · first to 2 · {s}-{r}',
    dummyGrace: 'Dummy {n}s — practice combo', goal: 'goal ×{n}', record: 'record ×{n}',
    time: 'TIME', wallGen: 'WALL ×{n}', stones: 'Stones: {n}',
    recordGap: 'Record {best} · {gap} to go',
    recordBroken: 'Record broken · {rec}', recordLine: 'Record: {rec}',
    pace: '~{pace}/min · projection ~{proj}', paceAhead: 'Ahead of record pace +{n}',
    paceBehind: 'Behind record pace {n}', comboLabel: 'COMBO',
    comboSmash: '+{pct}% smash', comboActive: 'Combo active — one more brick!',
    coins: 'Coins: {n}', matsRecord: 'Mats record: {n}',
    petCoins: 'Pet coins: +{pending} · wallet {wallet}',
    matsHint: 'Joystick ↑ aim · melee/throw higher · shuriken on pink flyers',
    spawnFair: 'Spawn · fair start', nextRound: 'Next round',
    p1Line: 'P1 · {name} · {pct}%', p2Line: '{pct}% · {name} · P2',
    decisiveRound: 'Decisive round · {s}-{r}',
    timeHpWin: 'TIME = highest HP % wins',
    hintDualTouch: 'P1 = left half · P2 = right half · joystick + attack buttons',
    hintDualKb: 'P1: A/D · W · J/K/L/U · Shift  |  P2: arrows · 1/2/3/4/5',
    hintTouch: 'Left: joystick to walk · Right: attack buttons',
    hintKb: 'A/D walk · W jump · J punch · K kick · L weapon · U special',
    ketsTap: 'Tap!', ketsKey: 'E / tap',
  },
  jutsu: { rasengan: 'RASENGAN!', chidori: 'CHIDORI!', rinnegan: 'RINNEGAN!' },
  skill: {
    rasengan: 'Rasengan', chidori: 'Chidori', rinnegan: 'Rinnegan',
    subst: 'Substitution', dash: 'Dash', chakra: 'Chakra',
  },
  gamble: {
    superBoss: 'Bad luck! Super-boss in a random wave',
    miniBoss: 'Risk: extra elite in a wave',
    superAlly: 'Jackpot! Super-ally: {name} (strong buff)',
    ally: 'Lucky! Ally: {name} (buff this level)',
    neutral: 'Neutral — normal level (no extra gamble effect)',
  },
};

const CATALOG_DE = {
  ach: {
    first_win: { name: 'Erster Triumph', desc: 'Gewinne dein erstes Level' },
    lv10: { name: 'Wachsender Ninja', desc: 'Erreiche Kämpfer Lv 10' },
    dex10: { name: 'Monsterkenner', desc: '10 Arten im Monsterbuch' },
    dexFull: { name: 'Enzyklopädie', desc: 'Alle Monsterarten entdeckt' },
    dex100: { name: 'Jäger', desc: '100 Monster-Kills registriert' },
    dexHalf: { name: 'Feldguide', desc: 'Hälfte aller Arten entdeckt' },
    dexTiers: { name: 'Seltenheitsjäger', desc: '4 Seltenheiten im Buch' },
    dexMythic: { name: 'Mythensucher', desc: 'Ein mythisches Monster entdeckt' },
    train5: { name: 'Robotbrecher', desc: '5× Training gewonnen' },
    wall100: { name: 'Schlacker', desc: 'Mauer-Rekord 100+' },
    combo8: { name: 'Combo-König', desc: 'Combo ×8 erreicht' },
    finisher10: { name: 'Stil-Meister', desc: '10 Waffen-Finisher gelandet' },
    finisher1: { name: 'Erster Stil', desc: 'Lande deinen ersten Finisher' },
    weaponMaster25: { name: 'Waffenlegende', desc: '25 Finisher mit einer Waffe' },
    finisher50: { name: 'Combo-Sensei', desc: '50 Finisher insgesamt' },
    streak10: { name: 'Unaufhaltsam', desc: 'Kill-Streak ×10 im Abenteuer' },
    trainCombo10: { name: 'Dummy-Meister', desc: 'Training-Combo ×10' },
    lv50: { name: 'Legende', desc: 'Level 50 freischalten' },
    daily7: { name: 'Entschlossen', desc: '7 Tagesboni abgeholt' },
    vs5: { name: 'Duellant', desc: '5× 2-Spieler-Duell gespielt' },
    vs_roster: { name: 'Volles Roster', desc: '10+ verschiedene Kämpfer (2P)' },
    saga_icons: { name: 'Saga-Legenden', desc: '2P mit allen 7 Legend-Picks' },
  },
  daily: {
    kills12: { text: 'Besiege 12 Monster', hint: 'Abenteuer oder Training spielen' },
    advwin: { text: 'Gewinne 1 Abenteuer-Level', hint: 'Menü → Abenteuer, Level gewinnen' },
    wall35: { text: 'Zerstöre 35 Mauersteine', hint: 'Menü → Mauer (Combo hilft)' },
    trainwin: { text: 'Gewinne Training vs Robot', hint: 'Menü → Training vs RabbitRobot' },
    combo5: { text: 'Erreiche Combo ×5', hint: 'Abenteuer: schnelle Combos' },
    finisher3: { text: 'Lande 3 Waffen-Finisher', hint: '①+② treffen, dann Finisher ③' },
    pick3: { text: 'Sammle 3 Power-ups', hint: 'Abenteuer: grüne/orange/blaue Kugeln' },
    boss1: { text: 'Besiege 1 Boss-Monster', hint: 'Abenteuer: Boss am Levelende' },
  },
  weapon: {
    vuist: { name: 'Fäuste', desc: 'Taijutsu-Grundlagen' }, kunai: { name: 'Kunai', desc: 'Klassische Ninja-Klinge' },
    shuriken: { name: 'Shuriken', desc: 'Wirft scharfe Sterne' }, tanto: { name: 'Tanto', desc: 'Kurze Klinge · schnell' },
    zwaard: { name: 'Ninja-Schwert', desc: 'Kenjutsu-Allrounder' }, sai: { name: 'Sai', desc: 'Dreizack · parieren' },
    knuppel: { name: 'Knüppel', desc: 'Rohe Schlagkraft' }, waaier: { name: 'Kriegsfächer', desc: 'Fächer-Schnitt · stilvoll' },
    speer: { name: 'Speer', desc: 'Enorme Reichweite' }, tonfa: { name: 'Tonfa', desc: 'Seitengriff · Flurry' },
    nunchaku: { name: 'Nunchaku', desc: 'Blitzschnell' }, kama: { name: 'Kama', desc: 'Sichel · Haken-Schläge' },
    boemerang: { name: 'Bumerang', desc: 'Kommt zurück' }, zeis: { name: 'Schattensense', desc: 'Langer Bogen · dunkel' },
    hamer: { name: 'Vorschlaghammer', desc: 'Zerstört alles' }, drietand: { name: 'Dreizack', desc: 'Drei Spitzen · stechen' },
    ketting: { name: 'Kettenklinge', desc: 'Reichweite + Druck' }, bostaf: { name: 'Bo-Stab', desc: 'Langer Stab · Tempo' },
    laser: { name: 'Chakra-Klinge', desc: 'Blau brennende Klinge' }, fuuma: { name: 'Fūma-Shuriken', desc: 'Großer Wurfstern' },
    kristal: { name: 'Kristallklinge', desc: 'Splitter-Schnitt' }, donder: { name: 'Blitz-Axt', desc: 'Wie Chidori, aber eine Axt' },
    vlamzweep: { name: 'Flammenpeitsche', desc: 'Feuerlinie · lange Reichweite' }, void: { name: 'Void-Klaue', desc: 'Mythische Klaue' },
    sterkling: { name: 'Sternklinge', desc: 'Himmelsmetall · Crits' }, guvve: { name: 'Guvvedukkie-Stab', desc: 'Quak. Bitte. Boom.' },
  },
  style: {
    classic: { name: 'Klassisch', hint: 'Standard-Ninja', tooltip: 'Basis-Ninja — kein Bonus.', bonus: 'Kein Kampfbonus' },
    konoha: { name: 'Konoha-Bandana', hint: 'Lv 5', tooltip: 'Leaf-Dorf-Kopfband. Etwas mehr max HP.', bonus: '+5 max HP' },
    chakra: { name: 'Chakra-Glühen', hint: '3× Training gewinnen', tooltip: 'Blaues Chakra. Schnelleres Laden.', bonus: '+8% Chakra-Regen' },
    akatsuki: { name: 'Roter Mantel', hint: 'Lv 12', tooltip: 'Aggressive Schläge.', bonus: '+4% Schaden' },
    shadow: { name: 'Schatten-Ninja', hint: 'Lv 15', tooltip: 'Extra Crit-Chance.', bonus: '+3% Crit' },
    guvve: { name: 'Guvvedukkie', hint: '8 Monster im Buch', tooltip: 'Quack-Cosplay. Bonus-XP.', bonus: '+6% Abenteuer-XP' },
    gold: { name: 'Legendär', hint: 'Lv 25', tooltip: 'Goldene Umrandung.', bonus: '+10% Knockback' },
    sand: { name: 'Wüste', hint: 'Lv 8', tooltip: 'Sandmantel — weniger Schaden.', bonus: '−14% Schaden · Block −25%' },
    samurai: { name: 'Samurai', hint: 'Lv 20', tooltip: 'Katana-Haltung.', bonus: '+8% Waffen-Reichweite' },
    cyber: { name: 'Cyber-Ninja', hint: 'Lv 18', tooltip: 'Neon-Visier.', bonus: 'Blitz-FX · +6% Chakra' },
    fox: { name: 'Fuchs-Ninja', hint: '12 Monster im Buch', tooltip: 'Fuchsohren — schneller.', bonus: '+5% Lauftempo' },
    storm: { name: 'Sturmgeist', hint: '5× Training gewinnen', tooltip: 'Sturm-Aura.', bonus: 'Blitz · +0,8s Schild/Welle' },
    void: { name: 'Void-Wanderer', hint: 'Lv 40', tooltip: 'Schwerere Jutsu.', bonus: '+8% Jutsu-Schaden' },
    hunter: { name: 'Jägerlook', hint: '75 Kills im Buch', tooltip: 'Jäger-Umhang.', bonus: '+6% vs Monster' },
    crystal: { name: 'Kristallin', hint: '4 Seltenheiten', tooltip: 'Kristall-Splitter.', bonus: '+1,0s Schild/Welle' },
    tome: { name: 'Buchmeister', hint: 'Hälfte des Buches', tooltip: 'Monsterbuch auf dem Rücken.', bonus: '+4 max HP · Buchweisheit' },
  },
  result: {
    advWin: 'GEWONNEN!', advLose: 'BESIEGT...', trainWin: 'MEISTER!', trainLose: 'ROBOT GEWINNT...',
    vsP1Win: 'SPIELER 1 GEWINNT!', vsP2Win: 'SPIELER 2 GEWINNT!', wallRecord: 'NEUER REKORD!', wallTime: 'ZEIT UM!',
    matsRecord: 'MATS-REKORD!', matsDone: 'Gut gemacht, Mats!',
  },
  banner: {
    levelUp: 'LEVEL UP! Lv {lvl}', masterBuff: 'MEISTER-BUFF +20%', bossWave: 'BOSS-WELLE!',
    fight: 'KÄMPF!', won: 'GEWONNEN!', lost: 'VERLOREN...', summon: '✦ SUMMON! ✦',
    matsStart: 'MATS · MÜNZEN-BONUS', wallStart: 'ZERSTÖRE DIE MAUER!', bonusDone: 'BONUS FERTIG!',
    kets: 'KETS!', ketsBam: 'KETS-BAM!',
  },
  help: { tips: [
    'Power-ups: besiegte Monster lassen manchmal Kugeln fallen — HP, Rage, Chakra, Schild.',
    'Bosse: unter halb HP werden sie wütender (Phase 2).',
    'Combos: schnell hintereinander schlagen für ×2 / ×3 Schaden.',
    'Dash: doppelt tippen links/rechts (oder Shift) zum Ausweichen.',
    'Rasengan: Chakra-Balken füllen — dann Kugel laden und einschlagen.',
    'Substitution: Rauchwolke + Ausweichen (Taste oder Shift). Kurz unverwundbar.',
    'Waffen-Combo: Waffe 3× schnell — ①②③. Mit ① und ② treffen, dann ③ Finisher.',
    '2 Spieler: Roster mit 5 Saga-Icons · Best-of-3.',
    'RabbitRobot: nutzt Chidori — warte auf eine Lücke.',
    'Mauer: 60s · Combo-Balken · Meilensteine ×3/×5/×8 · Rekord-Tempo im HUD.',
    'Seltenheiten: Gewöhnlich → Ungewöhnlich → Selten → Episch → Legendär → Mythisch.',
    '50 Level: 5 Inseln × 10 — Skill-Gate · Boss Lv 10/20/30/40/50 · 5× Verlust = Meister-Buff.',
    'Backup: jede Save doppelt — Einstellungen → Backup wiederherstellen.',
    'Teilen: Menü → Link teilen — Chrome auf Android → Zum Home-Bildschirm.',
    'Offline: nach 1× online wird gecacht — Banner unten ohne Netz.',
  ] },
};

const CATALOG_FR = {
  ach: {
    first_win: { name: 'Première victoire', desc: 'Gagne ton premier niveau' },
    lv10: { name: 'Ninja en croissance', desc: 'Atteins combattant Lv 10' },
    dex10: { name: 'Expert monstres', desc: '10 espèces au bestiaire' },
    dexFull: { name: 'Encyclopédie', desc: 'Toutes les espèces découvertes' },
    dex100: { name: 'Chasseur', desc: '100 kills enregistrés' },
    dexHalf: { name: 'Guide terrain', desc: 'Moitié des espèces découvertes' },
    dexTiers: { name: 'Chasseur de raretés', desc: '4 raretés au bestiaire' },
    dexMythic: { name: 'Chercheur de mythes', desc: 'Un monstre mythique découvert' },
    train5: { name: 'Brise-robot', desc: '5× entraînement gagné' },
    wall100: { name: 'Démolisseur', desc: 'Record mur 100+' },
    combo8: { name: 'Roi du combo', desc: 'Combo ×8 atteint' },
    finisher10: { name: 'Maître du style', desc: '10 finishers d\'arme' },
    finisher1: { name: 'Premier style', desc: 'Ton premier finisher' },
    weaponMaster25: { name: 'Légende d\'arme', desc: '25 finishers avec une arme' },
    finisher50: { name: 'Sensei combo', desc: '50 finishers au total' },
    streak10: { name: 'Impossible à arrêter', desc: 'Série ×10 en aventure' },
    trainCombo10: { name: 'Maître du dummy', desc: 'Combo entraînement ×10' },
    lv50: { name: 'Légende', desc: 'Débloquer niveau 50' },
    daily7: { name: 'Déterminé', desc: '7 bonus quotidiens réclamés' },
    vs5: { name: 'Duelliste', desc: '5× duels 2 joueurs' },
    vs_roster: { name: 'Roster complet', desc: '10+ combattants différents (2P)' },
    saga_icons: { name: 'Légendes saga', desc: '2P avec les 7 légendes' },
  },
  daily: {
    kills12: { text: 'Vaincs 12 monstres', hint: 'Joue Aventure ou Entraînement' },
    advwin: { text: 'Gagne 1 niveau aventure', hint: 'Menu → Aventure, gagne le niveau' },
    wall35: { text: 'Casse 35 briques du mur', hint: 'Menu → Mur (combo aide)' },
    trainwin: { text: 'Gagne entraînement vs Robot', hint: 'Menu → Entraînement vs RabbitRobot' },
    combo5: { text: 'Atteins combo ×5', hint: 'Aventure : combos rapides' },
    finisher3: { text: 'Lande 3 finishers d\'arme', hint: '①+② puis finisher ③' },
    pick3: { text: 'Prends 3 power-ups', hint: 'Aventure : orbes vert/orange/bleu' },
    boss1: { text: 'Vaincs 1 boss', hint: 'Aventure : boss en fin de niveau' },
  },
  weapon: {
    vuist: { name: 'Poings', desc: 'Bases taijutsu' }, kunai: { name: 'Kunai', desc: 'Lame ninja classique' },
    shuriken: { name: 'Shuriken', desc: 'Lance des étoiles' }, tanto: { name: 'Tanto', desc: 'Lame courte · rapide' },
    zwaard: { name: 'Épée ninja', desc: 'Kenjutsu polyvalent' }, sai: { name: 'Sai', desc: 'Trois dents · parade' },
    knuppel: { name: 'Massue', desc: 'Force brute' }, waaier: { name: 'Éventail de guerre', desc: 'Entaille stylée' },
    speer: { name: 'Lance', desc: 'Grande portée' }, tonfa: { name: 'Tonfa', desc: 'Poignée latérale' },
    nunchaku: { name: 'Nunchaku', desc: 'Ultra rapide' }, kama: { name: 'Kama', desc: 'Faucille · crochet' },
    boemerang: { name: 'Boomerang', desc: 'Revient en arrière' }, zeis: { name: 'Faux de l\'ombre', desc: 'Long arc · sombre' },
    hamer: { name: 'Masse', desc: 'Tout détruit' }, drietand: { name: 'Trident', desc: 'Trois pointes' },
    ketting: { name: 'Lame chaîne', desc: 'Portée + pression' }, bostaf: { name: 'Bô', desc: 'Long bâton' },
    laser: { name: 'Lame chakra', desc: 'Lame bleue ardente' }, fuuma: { name: 'Shuriken Fūma', desc: 'Grande étoile' },
    kristal: { name: 'Lame cristal', desc: 'Entaille de shards' }, donder: { name: 'Hache foudre', desc: 'Comme Chidori, en hache' },
    vlamzweep: { name: 'Fouet flamme', desc: 'Ligne de feu' }, void: { name: 'Griffe du vide', desc: 'Griffe mythique' },
    sterkling: { name: 'Lame étoile', desc: 'Métal céleste · crits' }, guvve: { name: 'Bâton Guvvedukkie', desc: 'Coin. S\'il vous plaît. Boum.' },
  },
  style: {
    classic: { name: 'Classique', hint: 'Ninja standard', tooltip: 'Ninja de base — pas de bonus.', bonus: 'Pas de bonus combat' },
    konoha: { name: 'Bandana Konoha', hint: 'Lv 5', tooltip: 'Bandeau du village.', bonus: '+5 PV max' },
    chakra: { name: 'Lueur chakra', hint: '3× entraînement gagné', tooltip: 'Aura bleue.', bonus: '+8% regen chakra' },
    akatsuki: { name: 'Manteau rouge', hint: 'Lv 12', tooltip: 'Coups agressifs.', bonus: '+4% dégâts' },
    shadow: { name: 'Ninja ombre', hint: 'Lv 15', tooltip: 'Crit en plus.', bonus: '+3% crit' },
    guvve: { name: 'Guvvedukkie', hint: '8 monstres au bestiaire', tooltip: 'Cosplay coin-coin.', bonus: '+6% XP aventure' },
    gold: { name: 'Légendaire', hint: 'Lv 25', tooltip: 'Contour doré.', bonus: '+10% knockback' },
    sand: { name: 'Désert', hint: 'Lv 8', tooltip: 'Manteau de sable.', bonus: '−14% dégâts · bloc −25%' },
    samurai: { name: 'Samouraï', hint: 'Lv 20', tooltip: 'Posture katana.', bonus: '+8% portée arme' },
    cyber: { name: 'Cyber-ninja', hint: 'Lv 18', tooltip: 'Visière néon.', bonus: 'FX éclair · +6% chakra' },
    fox: { name: 'Ninja renard', hint: '12 monstres', tooltip: 'Oreilles de renard.', bonus: '+5% vitesse' },
    storm: { name: 'Esprit tempête', hint: '5× entraînement', tooltip: 'Aura tempête.', bonus: 'Éclair · +0,8s bouclier/vague' },
    void: { name: 'Marcheur du vide', hint: 'Lv 40', tooltip: 'Jutsu plus lourds.', bonus: '+8% dégâts jutsu' },
    hunter: { name: 'Look chasseur', hint: '75 kills bestiaire', tooltip: 'Cape chasseur.', bonus: '+6% vs monstres' },
    crystal: { name: 'Cristallin', hint: '4 raretés', tooltip: 'Éclat cristal.', bonus: '+1,0s bouclier/vague' },
    tome: { name: 'Maître du livre', hint: 'Moitié du bestiaire', tooltip: 'Bestiaire sur le dos.', bonus: '+4 PV max · sagesse' },
  },
  result: {
    advWin: 'VICTOIRE !', advLose: 'DÉFAITE...', trainWin: 'CHAMPION !', trainLose: 'ROBOT GAGNE...',
    vsP1Win: 'JOUEUR 1 GAGNE !', vsP2Win: 'JOUEUR 2 GAGNE !', wallRecord: 'NOUVEAU RECORD !', wallTime: 'FIN DU TEMPS !',
    matsRecord: 'RECORD MATS !', matsDone: 'Bien joué, Mats !',
  },
  banner: {
    levelUp: 'LEVEL UP ! Lv {lvl}', masterBuff: 'BUFF MAÎTRE +20 %', bossWave: 'VAGUE BOSS !',
    fight: 'COMBAT !', won: 'VICTOIRE !', lost: 'DÉFAITE...', summon: '✦ INVOCATION ! ✦',
    matsStart: 'MATS · BONUS PIÈCES', wallStart: 'CASSE LE MUR !', bonusDone: 'BONUS TERMINÉ !',
    kets: 'KETS !', ketsBam: 'KETS-BAM !',
  },
  help: { tips: [
    'Power-ups : les monstres vaincus laissent parfois des orbes — PV, rage, chakra, bouclier.',
    'Boss : sous la moitié des PV ils deviennent plus furieux (phase 2).',
    'Combos : enchaîne vite pour ×2 / ×3 dégâts.',
    'Dash : double-tap gauche/droite (ou Shift) pour esquiver.',
    'Rasengan : remplis la barre chakra — charge une boule et frappe.',
    'Substitution : nuage de fumée + esquive (bouton ou Shift). Invulnérabilité brève.',
    'Combo arme : arme 3× vite — ①②③. Touche ① et ②, puis ③ finisher.',
    '2 joueurs : roster 5 icônes saga · best-of-3.',
    'RabbitRobot : utilise Chidori — attends qu\'il s\'ouvre.',
    'Mur : 60 s · barre combo · jalons ×3/×5/×8 · tempo record au HUD.',
    'Raretés : Commun → Peu commun → Rare → Épique → Légendaire → Mythique.',
    '50 niveaux : 5 îles × 10 — skill gate · boss Lv 10/20/30/40/50 · 5× échec = buff maître.',
    'Backup : chaque save est doublée — Options → Restaurer backup.',
    'Partager : menu → Lien — Chrome Android → Écran d\'accueil.',
    'Hors ligne : après 1× en ligne, cache HTML+JS — bannière sans réseau.',
  ] },
};

const CATALOG_ES = {
  ach: {
    first_win: { name: 'Primer triunfo', desc: 'Gana tu primer nivel' },
    lv10: { name: 'Ninja en crecimiento', desc: 'Alcanza luchador Lv 10' },
    dex10: { name: 'Experto monstruos', desc: '10 especies en el bestiario' },
    dexFull: { name: 'Enciclopedia', desc: 'Todas las especies descubiertas' },
    dex100: { name: 'Cazador', desc: '100 kills registrados' },
    dexHalf: { name: 'Guía de campo', desc: 'Mitad de especies descubiertas' },
    dexTiers: { name: 'Cazador de rarezas', desc: '4 rarezas en el libro' },
    dexMythic: { name: 'Buscador de mitos', desc: 'Un monstruo mítico descubierto' },
    train5: { name: 'Rompe-robots', desc: '5× entrenamiento ganado' },
    wall100: { name: 'Demoledor', desc: 'Récord muro 100+' },
    combo8: { name: 'Rey del combo', desc: 'Combo ×8 alcanzado' },
    finisher10: { name: 'Maestro del estilo', desc: '10 finishers de arma' },
    finisher1: { name: 'Primer estilo', desc: 'Tu primer finisher' },
    weaponMaster25: { name: 'Leyenda de armas', desc: '25 finishers con un arma' },
    finisher50: { name: 'Sensei combo', desc: '50 finishers en total' },
    streak10: { name: 'Imparable', desc: 'Racha ×10 en aventura' },
    trainCombo10: { name: 'Maestro del dummy', desc: 'Combo entrenamiento ×10' },
    lv50: { name: 'Leyenda', desc: 'Desbloquear nivel 50' },
    daily7: { name: 'Determinado', desc: '7 bonos diarios reclamados' },
    vs5: { name: 'Duelista', desc: '5× duelos a 2 jugadores' },
    vs_roster: { name: 'Roster completo', desc: '10+ luchadores distintos (2P)' },
    saga_icons: { name: 'Leyendas saga', desc: '2P con las 7 leyendas' },
  },
  daily: {
    kills12: { text: 'Derrota 12 monstruos', hint: 'Juega Aventura o Entrenamiento' },
    advwin: { text: 'Gana 1 nivel aventura', hint: 'Menú → Aventura, gana el nivel' },
    wall35: { text: 'Rompe 35 ladrillos del muro', hint: 'Menú → Muro (combo ayuda)' },
    trainwin: { text: 'Gana entrenamiento vs Robot', hint: 'Menú → Entrenamiento vs RabbitRobot' },
    combo5: { text: 'Alcanza combo ×5', hint: 'Aventura: combos rápidos' },
    finisher3: { text: 'Aterriza 3 finishers de arma', hint: '①+② luego finisher ③' },
    pick3: { text: 'Recoge 3 power-ups', hint: 'Aventura: orbes verde/naranja/azul' },
    boss1: { text: 'Derrota 1 jefe', hint: 'Aventura: jefe al final del nivel' },
  },
  weapon: {
    vuist: { name: 'Puños', desc: 'Básicos taijutsu' }, kunai: { name: 'Kunai', desc: 'Cuchilla ninja clásica' },
    shuriken: { name: 'Shuriken', desc: 'Lanza estrellas' }, tanto: { name: 'Tanto', desc: 'Hoja corta · rápida' },
    zwaard: { name: 'Espada ninja', desc: 'Kenjutsu versátil' }, sai: { name: 'Sai', desc: 'Tres puntas · parada' },
    knuppel: { name: 'Garrote', desc: 'Fuerza bruta' }, waaier: { name: 'Abanico de guerra', desc: 'Corte con estilo' },
    speer: { name: 'Lanza', desc: 'Gran alcance' }, tonfa: { name: 'Tonfa', desc: 'Empuñadura lateral' },
    nunchaku: { name: 'Nunchaku', desc: 'Ultrarrápido' }, kama: { name: 'Kama', desc: 'Hoz · gancho' },
    boemerang: { name: 'Bumerán', desc: 'Vuelve atrás' }, zeis: { name: 'Guadaña sombra', desc: 'Arco largo · oscuro' },
    hamer: { name: 'Mazo', desc: 'Lo destroza todo' }, drietand: { name: 'Tridente', desc: 'Tres puntas' },
    ketting: { name: 'Espada cadena', desc: 'Alcance + presión' }, bostaf: { name: 'Bastón bo', desc: 'Bastón largo' },
    laser: { name: 'Hoja chakra', desc: 'Filo azul ardiente' }, fuuma: { name: 'Shuriken Fūma', desc: 'Estrella grande' },
    kristal: { name: 'Hoja cristal', desc: 'Corte de fragmentos' }, donder: { name: 'Hacha rayo', desc: 'Como Chidori, pero hacha' },
    vlamzweep: { name: 'Látigo llama', desc: 'Línea de fuego' }, void: { name: 'Garra void', desc: 'Garra mítica' },
    sterkling: { name: 'Hoja estrella', desc: 'Metal celestial · críticos' }, guvve: { name: 'Palo Guvvedukkie', desc: 'Cuac. Por favor. Boom.' },
  },
  style: {
    classic: { name: 'Clásico', hint: 'Ninja estándar', tooltip: 'Ninja base — sin bonus.', bonus: 'Sin bonus combate' },
    konoha: { name: 'Bandana Konoha', hint: 'Lv 5', tooltip: 'Cinta del pueblo.', bonus: '+5 HP máx' },
    chakra: { name: 'Brillo chakra', hint: '3× entrenamiento ganado', tooltip: 'Aura azul.', bonus: '+8% regen chakra' },
    akatsuki: { name: 'Capa roja', hint: 'Lv 12', tooltip: 'Golpes agresivos.', bonus: '+4% daño' },
    shadow: { name: 'Ninja sombra', hint: 'Lv 15', tooltip: 'Más críticos.', bonus: '+3% crít' },
    guvve: { name: 'Guvvedukkie', hint: '8 monstruos en libro', tooltip: 'Cosplay cuac.', bonus: '+6% XP aventura' },
    gold: { name: 'Legendario', hint: 'Lv 25', tooltip: 'Contorno dorado.', bonus: '+10% knockback' },
    sand: { name: 'Desierto', hint: 'Lv 8', tooltip: 'Capa de arena.', bonus: '−14% daño · bloqueo −25%' },
    samurai: { name: 'Samurái', hint: 'Lv 20', tooltip: 'Postura katana.', bonus: '+8% alcance arma' },
    cyber: { name: 'Cyber-ninja', hint: 'Lv 18', tooltip: 'Visor neón.', bonus: 'FX rayo · +6% chakra' },
    fox: { name: 'Ninja zorro', hint: '12 monstruos', tooltip: 'Orejas de zorro.', bonus: '+5% velocidad' },
    storm: { name: 'Espíritu tormenta', hint: '5× entrenamiento', tooltip: 'Aura tormenta.', bonus: 'Rayo · +0,8s escudo/ola' },
    void: { name: 'Caminante void', hint: 'Lv 40', tooltip: 'Jutsu más fuertes.', bonus: '+8% daño jutsu' },
    hunter: { name: 'Look cazador', hint: '75 kills libro', tooltip: 'Capa cazador.', bonus: '+6% vs monstruos' },
    crystal: { name: 'Cristalino', hint: '4 rarezas', tooltip: 'Fragmento cristal.', bonus: '+1,0s escudo/ola' },
    tome: { name: 'Maestro del libro', hint: 'Mitad del bestiario', tooltip: 'Libro en la espalda.', bonus: '+4 HP máx · sabiduría' },
  },
  result: {
    advWin: '¡VICTORIA!', advLose: 'DERROTA...', trainWin: '¡CAMPEÓN!', trainLose: 'ROBOT GANA...',
    vsP1Win: '¡JUGADOR 1 GANA!', vsP2Win: '¡JUGADOR 2 GANA!', wallRecord: '¡NUEVO RÉCORD!', wallTime: '¡SE ACABÓ EL TIEMPO!',
    matsRecord: '¡RÉCORD MATS!', matsDone: '¡Bien hecho, Mats!',
  },
  banner: {
    levelUp: '¡SUBIDA DE NIVEL! Lv {lvl}', masterBuff: 'BUFF MAESTRO +20%', bossWave: '¡OLA JEFE!',
    fight: '¡LUCHA!', won: '¡VICTORIA!', lost: 'DERROTA...', summon: '✦ ¡INVOCACIÓN! ✦',
    matsStart: 'MATS · BONUS MONEDAS', wallStart: '¡ROMPE EL MURO!', bonusDone: '¡BONUS LISTO!',
    kets: '¡KETS!', ketsBam: '¡KETS-BAM!',
  },
  help: { tips: [
    'Power-ups: monstruos derrotados sueltan orbes — HP, furia, chakra, escudo.',
    'Jefes: bajo mitad HP se vuelven más feroces (fase 2).',
    'Combos: golpea rápido para ×2 / ×3 daño.',
    'Dash: doble toque izquierda/derecha (o Shift) para esquivar.',
    'Rasengan: llena la barra chakra — carga una bola y golpea.',
    'Substitución: nube de humo + esquiva (botón o Shift). Invulnerabilidad breve.',
    'Combo arma: arma 3× rápido — ①②③. Acierta ① y ②, luego ③ finisher.',
    '2 jugadores: roster 5 iconos saga · best-of-3.',
    'RabbitRobot: usa Chidori — espera que se abra.',
    'Muro: 60 s · barra combo · hitos ×3/×5/×8 · ritmo récord en HUD.',
    'Rarezas: Común → Poco común → Raro → Épico → Legendario → Mítico.',
    '50 niveles: 5 islas × 10 — skill gate · jefe Lv 10/20/30/40/50 · 5× derrotas = buff maestro.',
    'Backup: cada save se guarda doble — Opciones → Restaurar backup.',
    'Compartir: menú → Enlace — Chrome Android → Añadir a inicio.',
    'Offline: tras 1× online cachea HTML+JS — banner sin red.',
  ] },
};

function weaponLabel(w) {
  const id = typeof w === 'string' ? w : (w && w.id);
  const k = 'weapon.' + id + '.name';
  const v = t(k);
  if (v && v !== k) return v;
  const ww = typeof w === 'object' && w ? w : (typeof weaponById === 'function' ? weaponById(id) : null);
  return ww ? ww.name : String(id || '');
}

function weaponDesc(w) {
  const id = typeof w === 'string' ? w : (w && w.id);
  const k = 'weapon.' + id + '.desc';
  const v = t(k);
  if (v && v !== k) return v;
  const ww = typeof w === 'object' && w ? w : (typeof weaponById === 'function' ? weaponById(id) : null);
  return ww ? ww.desc : '';
}

function styleLabel(st, field) {
  field = field || 'name';
  const id = typeof st === 'string' ? st : (st && st.id);
  const k = 'style.' + id + '.' + field;
  const v = t(k);
  if (v && v !== k) return v;
  const ss = typeof st === 'object' && st ? st : (typeof styleById === 'function' ? styleById(id) : null);
  return ss && ss[field] != null ? ss[field] : '';
}

function dailyText(id) {
  const k = 'daily.' + id + '.text';
  const v = t(k);
  if (v && v !== k) return v;
  const def = typeof dailyDef === 'function' ? dailyDef(id) : null;
  return def ? def.text : id;
}

function dailyHint(id) {
  const k = 'daily.' + id + '.hint';
  const v = t(k);
  if (v && v !== k) return v;
  return (typeof DAILY_PLAY_HINTS !== 'undefined' && DAILY_PLAY_HINTS[id]) || '';
}

function pickupLabel(kind, skillId, itemCat, itemId) {
  if (kind === 'skill_shard' && skillId) {
    return t('combat.pickupSkillShard', { name: skillLabel(skillId) });
  }
  if (kind === 'item_shard' && itemCat && itemId) {
    return t('combat.pickupItemShard', { name: itemUpgradeLabel(itemCat, itemId) });
  }
  const k = 'pickup.' + kind;
  const v = t(k);
  if (v && v !== k) return v;
  return (typeof PICKUP_META !== 'undefined' && PICKUP_META[kind] && PICKUP_META[kind].label) || kind;
}

function skillLabel(id) {
  const k = 'skill.' + (id || 'rasengan');
  const v = t(k);
  if (v && v !== k) return v;
  if (id === 'subst') return 'Substitutie';
  if (id === 'dash') return 'Dash';
  if (id === 'chakra') return 'Chakra';
  return jutsuLabel(id);
}

function skillDesc(id) {
  const k = 'skillDesc.' + id;
  const v = t(k);
  if (v && v !== k) return v;
  return '';
}

function jutsuLabel(kind) {
  const k = 'jutsu.' + (kind || 'rasengan');
  const v = t(k);
  if (v && v !== k) return v;
  if (typeof jutsuHudLabel === 'function') return jutsuHudLabel(kind);
  return String(kind || '').toUpperCase();
}

function eggDailyLine(key) {
  const k = 'egg.' + key;
  const v = t(k);
  if (v && v !== k) return v;
  const nl = { dailyReady: 'Dag-ei klaar', advBonus: 'Bonus-ei: win 1× avontuur', tomorrow: 'Morgen weer ei' };
  return nl[key] || key;
}

function gambleOutcomeLabelFromKey(g) {
  if (!g) return '';
  const out = g.outcome || 'neutral';
  if (out === 'superAlly' || out === 'ally') {
    const a = typeof GAMBLE_ALLIES !== 'undefined' ? GAMBLE_ALLIES[g.allyId] : null;
    return t('gamble.' + out, { name: a ? a.name : 'Sage' });
  }
  const k = 'gamble.' + out;
  const v = t(k);
  return (v && v !== k) ? v : (typeof gambleOutcomeLabel === 'function' ? gambleOutcomeLabel(g) : out);
}

function i18nList(key) {
  const parts = key.split('.');
  for (const code of [getLang(), 'nl', 'en']) {
    let cur = I18N[code];
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') { cur = null; break; }
      cur = cur[p];
    }
    if (Array.isArray(cur) && cur.length) return cur;
  }
  let cur = CATALOG_EN;
  for (const p of parts) {
    if (!cur) return [];
    cur = cur[p];
  }
  return Array.isArray(cur) ? cur : [];
}

function menuTipAt(i) {
  const tips = i18nList('menu.tips');
  if (!tips.length) return '';
  return tips[((i % tips.length) + tips.length) % tips.length];
}

function dailyModeLabel(mode) {
  if (mode === 'adventure') return t('modes.adventure');
  if (mode === 'training') return t('modes.training');
  if (mode === 'wall') return t('modes.wall');
  if (mode === 'versus') return t('modes.versus');
  if (mode === 'coinrun') return t('modes.coinrun');
  return mode;
}
