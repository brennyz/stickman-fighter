#!/usr/bin/env node
/**
 * Locale switch: HOME tiles, dock Tips, weapons/settings heads
 * stay in EN / DE / NL with no leftover Dutch on EN/DE.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ensureSmokeServer, smokeBaseUrl } from './smoke-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const chrome = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (!chrome) { console.log('SMOKE_OK i18n-switch (static only, no chrome)'); process.exit(0); }

const outDir = '/tmp/sf-i18n-switch';
fs.mkdirSync(outDir, { recursive: true });

async function getPuppeteer() {
  try { return await import('puppeteer-core'); } catch (_) {
    await new Promise((res, rej) => {
      const p = spawn('npm', ['install', '--no-save', 'puppeteer-core@23'], { cwd: outDir, stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error('npm'))));
    });
    return import(path.join(outDir, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'));
  }
}

async function run() {
  const port = Number(process.env.SF_I18N_SWITCH_PORT || 8798);
  let server = null;
  try { server = await ensureSmokeServer(port); } catch (_) {}
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.default.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
  });
  const page = await browser.newPage();
  await page.goto(smokeBaseUrl(port) + '?nosplash=1', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sfBooted, { timeout: 45000 });

  const result = await page.evaluate(() => {
    const DUTCH = /(Avontuur|Collectie|Instellingen|Wapens|Vandaag|Verzameld|Uitrusten|Dag-ei|muur |× vandaag|Alle types|Alle biomen|Export bevat|Laatst opgeslagen|Cosmetisch metgezel|Nog niet uitgekomen|Volgende prestatie|prestaties|soorten in monsterboek|Muziek|Effecten|Profiel en missies|Zet in app-lade|unlock Lv)/;
    function txt(id) { return (document.getElementById(id) || {}).textContent || ''; }
    function snap(lang) {
      try { if (UI.goMenu) UI.goMenu(); } catch (_) {}
      if (typeof state !== 'undefined') state = 'menu';
      if (typeof setLang === 'function') setLang(lang);
      else if (typeof save !== 'undefined') {
        save.lang = lang;
        if (typeof persist === 'function') persist();
        if (typeof applyLang === 'function') applyLang();
      }
      try { if (UI.renderMenu) UI.renderMenu(); } catch (_) {}
      try { if (UI.renderDex) UI.renderDex(); } catch (_) {}
      try { if (UI.renderPets) UI.renderPets(); } catch (_) {}
      try { if (UI.renderSettings) UI.renderSettings(); } catch (_) {}
      const adv = (document.querySelector('.hub-tile-adventure .hub-tile-title') || {}).textContent || '';
      const collect = (document.querySelector('.hub-tile-collect .hub-tile-title') || {}).textContent || '';
      const help = (document.getElementById('btnHelp') || {}).title || (document.getElementById('btnHelp') || {}).textContent || '';
      const weapons = txt('weaponScreenHead');
      const settings = txt('settingsHead');
      const dexSum = txt('dexSummary');
      const dexTypes = txt('dexTypeFilterBar');
      const eggBtn = txt('eggCrackBtn');
      const exportHint = txt('saveExportHint');
      const tAdv = typeof t === 'function' ? t('menu.adventure') : '';
      const tHud = typeof t === 'function' ? t('hud.levelWave', { n: 1, wv: 1, total: 3 }) : '';
      const musicName = txt('setMusicVolName');
      const sfxName = txt('setSfxVolName');
      const profileAria = (document.getElementById('menuProfileBar') || {}).getAttribute('aria-label') || '';
      const summons = (document.querySelector('.hub-tile-summon .hub-tile-title') || {}).textContent || '';
      const leftover = [adv, collect, weapons, settings, dexSum, dexTypes, eggBtn, exportHint, musicName, sfxName, profileAria].join(' ');
      const tGearLock = typeof t === 'function' ? t('gear.lockOwned') : '';
      const tPetSum = typeof t === 'function' ? t('ui.petSummaryTamed', { tamed: 0, total: 12, active: 'x', wallet: 0 }) : '';
      const tPerk = typeof t === 'function' ? t('pets.perk.pet_slymo') : '';
      const tEgg = typeof t === 'function' ? t('egg.name.egg_pebble') : '';
      const tKills = typeof t === 'function' ? t('ui.petKillsLeft', { n: 3 }) : '';
      const tKick = typeof t === 'function' ? t('hud.kickTele') : '';
      const tImport = typeof t === 'function' ? t('ui.importPreview', { summary: 'x', meta: '' }) : '';
      const tStats = typeof t === 'function' ? t('ui.saveHealthStats', { lvl: 1, unlocked: 1, dex: 1, kills: 0 }) : '';
      const tQuota = typeof t === 'function' ? t('ui.summonQuota', { left: 3, total: 10 }) : '';
      const tPersist = typeof t === 'function' ? t('toast.persistCtxWeapon') : '';
      const tPower = typeof t === 'function' ? t('buildings.power.spark_kindle.label') : '';
      const tProduce = typeof t === 'function' ? t('buildings.desc.produceLocked', { res: 'x' }) : '';
      const tGearToast = typeof t === 'function' ? t('toast.gearLocked', { why: 'z' }) : '';
      const tNameShort = typeof t === 'function' ? t('buildings.stick_lighter.nameShort') : '';
      const tStyleLeaf = typeof t === 'function' ? t('style.leaf_band.name') : '';
      const tStyleEnergy = typeof t === 'function' ? t('style.energy_glow.bonus') : '';
      const tStyleVoid = typeof t === 'function' ? t('style.void.name') : '';
      const tAdvLose = typeof t === 'function' ? t('result.advLose') : '';
      const tTrainLose = typeof t === 'function' ? t('result.trainLose') : '';
      const tKeep = typeof t === 'function' ? t('result.advLoseKeep') : '';
      const tSeasonBeat = typeof t === 'function' ? t('season.beat.result.jungle') : '';
      const tErrRetry = typeof t === 'function' ? t('toast.errRetry') : '';
      const tOpenMode = typeof t === 'function' ? t('ui.errOpenMode') : '';
      const tDaily = typeof t === 'function' ? t('daily.kills12.text') : '';
      const tFightHiccup = typeof t === 'function' ? t('toast.fightHiccup') : '';
      const tAchLv70 = typeof t === 'function' ? t('ach.lv70.name') : '';
      const tAchZone = typeof t === 'function' ? t('ach.zoneWeapons10.name') : '';
      const tPickRem = typeof t === 'function' ? t('missionsUi.remainderPickupsN', { n: 3 }) : '';
      const tKillRem = typeof t === 'function' ? t('missionsUi.remainderKillsN', { n: 3 }) : '';
      const tRunRem = typeof t === 'function' ? t('missionsUi.remainderRun') : '';
      const tPick3 = typeof t === 'function' ? t('daily.pick3.text') : '';
      const tHelp0 = (typeof i18nList === 'function' && i18nList('help.tips')[0]) || '';
      const tFirstMin = typeof t === 'function' ? t('ui.firstMinuteAdventure') : '';
      const tPetTip = typeof t === 'function' ? t('ui.petCoinTip') : '';
      const petSub = txt('petScreenSub');
      const tSummonOpen = typeof t === 'function' ? t('ui.summonOpen') : '';
      const tSummonPull = typeof t === 'function' ? t('ui.summonPull') : '';
      const tLootHead = typeof t === 'function' ? t('runLoot.head') : '';
      const tBanSummon = typeof t === 'function' ? t('banner.summon') : '';
      const tSetSub = typeof t === 'function' ? t('settings.sub') : '';
      const tAudio = typeof t === 'function' ? t('settings.audioThemeHead') : '';
      const tFin3 = typeof t === 'function' ? t('daily.finisher3.text') : '';
      const tDexApp = typeof t === 'function' ? t('ui.dexAppears', { lv: 5 }) : '';
      const tFomoCta = typeof t === 'function' ? t('fomo.ritualCtaSummon') : '';
      const tLogEmpty = typeof t === 'function' ? t('ui.summonLogEmpty') : '';
      const tPullEmpty = typeof t === 'function' ? t('ui.summonPullEmpty') : '';
      const tNoPulls = typeof t === 'function' ? t('ui.summonNoPulls') : '';
      const tGearEmpty = typeof t === 'function' ? t('gear.empty') : '';
      const tFilterEmpty = typeof t === 'function' ? t('gear.filterEmpty') : '';
      const tPetNone = typeof t === 'function' ? t('ui.petNone') : '';
      const tToastPet = typeof t === 'function' ? t('toast.petNone') : '';
      const tEggUnhatched = typeof t === 'function' ? t('ui.eggUnhatched') : '';
      let collectTitle = '';
      let collectGear = '';
      try {
        if (UI.openModeHub) UI.openModeHub('collect');
        collectTitle = txt('modeHubTitle');
        collectGear = (document.querySelector('#btnGear .hub-tile-title') || {}).textContent || '';
      } catch (_) {}
      let playState = '';
      let playMode = '';
      try {
        if (typeof startGame === 'function') startGame('training');
        playState = (typeof state !== 'undefined') ? String(state) : '';
        playMode = (typeof game !== 'undefined' && game) ? String(game.mode || '') : '';
      } catch (_) {}
      try { if (UI.goMenu) UI.goMenu(); } catch (_) {}
      if (typeof state !== 'undefined') state = 'menu';
      return {
        lang, adv, collect, help, weapons, settings, dexSum, dexTypes, eggBtn, exportHint,
        musicName, sfxName, profileAria, summons, tAdv, tHud, leftover,
        tGearLock, tPetSum, tPerk, tEgg, tKills, tKick, tImport, tStats, tQuota, tPersist,
        tPower, tProduce, tGearToast, tNameShort, collectTitle, collectGear, playState, playMode,
        tStyleLeaf, tStyleEnergy, tStyleVoid, tAdvLose, tTrainLose, tKeep, tSeasonBeat,
        tErrRetry, tOpenMode, tDaily, tFightHiccup, tAchLv70, tAchZone,
        tPickRem, tKillRem, tRunRem, tPick3, tHelp0, tFirstMin, tPetTip, petSub,
        tSummonOpen, tSummonPull, tLootHead, tBanSummon, tSetSub, tAudio, tFin3, tDexApp, tFomoCta,
        tLogEmpty, tPullEmpty, tNoPulls, tGearEmpty, tFilterEmpty, tPetNone, tToastPet, tEggUnhatched,
      };
    }
    const en = snap('en');
    const de = snap('de');
    const nl = snap('nl');
    const fr = snap('fr');
    const es = snap('es');
    const DUTCH_COPY = /Nog niet gevonden|Spring-assist|Kiezel|Temmen:|Getemd/;
    const EN_LOCK = /Not found yet/;
    const enOk = /Adventure/i.test(en.adv) && /Collection/i.test(en.collect)
      && /Weapons/i.test(en.weapons) && /Settings|Options/i.test(en.settings)
      && /Tips/i.test(en.help) && !DUTCH.test(en.leftover)
      && /Wave/.test(en.tHud) && !/Golf/.test(en.tHud)
      && /Book|All types|All biomes/i.test(en.dexSum + ' ' + en.dexTypes)
      && /Music/i.test(en.musicName) && /Effect/i.test(en.sfxName)
      && /Profile/i.test(en.profileAria)
      && /Not found yet/.test(en.tGearLock) && /Hop assist/.test(en.tPerk) && /Pebble/.test(en.tEgg)
      && /KICK/.test(en.tKick) && /Preview/.test(en.tImport) && !/tik Laden|om te laden/.test(en.tImport)
      && /weapon/.test(en.tPersist)
      && /Collection/i.test(en.collectTitle) && /Spark/.test(en.tPower) && /Still locked/.test(en.tGearToast)
      && /bandana/i.test(en.tStyleLeaf) && en.tAdvLose === 'YOU LOSE'
      && /ROBOT WINS/.test(en.tTrainLose)
      && /Action failed/.test(en.tErrRetry) && /pick from the menu/.test(en.tOpenMode)
      && /Defeat 12|12 monsters/i.test(en.tDaily) && /fight continues/.test(en.tFightHiccup)
      && /Hell legend/.test(en.tAchLv70) && /Zone collector/.test(en.tAchZone)
      && !/Hel-legende|Zone-verzamelaar/.test(en.tAchLv70 + en.tAchZone)
      && /Move · punch/.test(en.tFirstMin) && !/First minute:/.test(en.tFirstMin) && en.tFirstMin.length < 56
      && /Coin bonus/.test(en.tPetTip) && !/monster book|monsterboek/.test(en.tPetTip)
      && /Open chest/.test(en.tSummonPull + en.tSummonOpen)
      && /No pulls/.test(en.tLogEmpty) && /Done/.test(en.tPullEmpty)
      && /empty|Empty/.test(en.tGearEmpty) && /Nothing/.test(en.tFilterEmpty)
      && /none/.test(en.tPetNone) && /No active pet/.test(en.tToastPet)
      && /Not hatched/.test(en.tEggUnhatched)
      && en.playState === 'play' && /train/.test(en.playMode);
    const deOk = /Abenteuer/i.test(de.adv) && /Sammlung/i.test(de.collect)
      && /Waffen/i.test(de.weapons) && /Einstellungen/i.test(de.settings)
      && /Tipp/i.test(de.help) && !DUTCH.test(de.leftover)
      && /Welle/.test(de.tHud) && !/Golf/.test(de.tHud) && !/Vandaag/.test(de.tHud)
      && /Buch|Alle Typen|Alle Biome/i.test(de.dexSum + ' ' + de.dexTypes)
      && /Musik/i.test(de.musicName) && /Effekt/i.test(de.sfxName)
      && /Profil/i.test(de.profileAria)
      && /Beschwörung/i.test(de.summons)
      && /Noch nicht gefunden/.test(de.tGearLock) && !EN_LOCK.test(de.tGearLock)
      && /Sprung-Assist/.test(de.tPerk) && /Kiesel/.test(de.tEgg) && !DUTCH_COPY.test(de.tPerk + de.tEgg + de.tGearLock)
      && /TRITT/.test(de.tKick) && !/Unlock/.test(de.tStats) && /Kiste/.test(de.tQuota) && !/Summon/i.test(de.tQuota)
      && /Waffe/.test(de.tPersist) && !/Preview:/.test(de.tImport)
      && /Sammlung/i.test(de.collectTitle) && /Funke/.test(de.tPower) && !/Spark Kindle|Unlock/.test(de.tPower + de.tProduce)
      && /gesperrt/i.test(de.tGearToast) && !/Still locked|Nog op slot/.test(de.tGearToast)
      && /Anzünder/.test(de.tNameShort) && !/Stock-Anzünder/.test(de.tNameShort)
      && /Blatt/.test(de.tStyleLeaf) && !/Leaf/.test(de.tStyleLeaf)
      && /Energie/.test(de.tStyleEnergy) && !/Energy|Knockback/.test(de.tStyleEnergy)
      && /Leeren/.test(de.tStyleVoid) && !/Void/.test(de.tStyleVoid)
      && de.tAdvLose === 'VERLOREN' && /ROBOT GEWINNT/.test(de.tTrainLose)
      && /Lauf|Beute/.test(de.tKeep) && !/\brun\b/.test(de.tKeep)
      && /Dschungel/.test(de.tSeasonBeat)
      && /fehlgeschlagen/.test(de.tErrRetry) && !/mislukt|Kon modus/.test(de.tErrRetry + de.tOpenMode)
      && /Besiege 12/.test(de.tDaily) && /kämpf weiter/.test(de.tFightHiccup)
      && /Höllen-Legende/.test(de.tAchLv70) && /Zonen-Sammler/.test(de.tAchZone)
      && !/Hel-legende|Zone-verzamelaar/.test(de.tAchLv70 + de.tAchZone)
      && /Funde/.test(de.tPickRem) && !/Pickup/i.test(de.tPickRem + de.tPick3)
      && /Monster/.test(de.tKillRem) && !/\bKills?\b/.test(de.tKillRem)
      && /Lauf/.test(de.tRunRem)
      && /^Funde:/.test(de.tHelp0) && !/Power-ups/i.test(de.tHelp0)
      && /Laufen/.test(de.tFirstMin) && !/Erste Minute:|Eerste minuut:|First minute:/.test(de.tFirstMin)
      && /Münzen-Bonus/.test(de.tPetTip) && !/Monsterbuch zähmen|monsterboek/.test(de.tPetTip)
      && /Öffnen|Kiste/.test(de.tSummonPull + de.tSummonOpen) && !/Open chest/.test(de.tSummonPull + de.tSummonOpen)
      && /Lauf/.test(de.tLootHead) && !/\brun\b/.test(de.tLootHead)
      && /KISTE/.test(de.tBanSummon) && !/SUMMON/.test(de.tBanSummon)
      && /Ton/.test(de.tSetSub) && !/Sound/.test(de.tSetSub)
      && /frei/.test(de.tDexApp) && !/Unlock/.test(de.tDexApp)
      && /Kisten/.test(de.tFomoCta) && !/Summon/i.test(de.tFomoCta)
      && /Züge/.test(de.tLogEmpty + de.tNoPulls) && !/pulls/i.test(de.tLogEmpty + de.tNoPulls)
      && de.tPullEmpty === 'Leer' && !/Done/.test(de.tPullEmpty)
      && /Leer/.test(de.tGearEmpty) && /Nichts/.test(de.tFilterEmpty)
      && /keine/.test(de.tPetNone) && /Kein aktives Pet/.test(de.tToastPet)
      && /geschlüpft/.test(de.tEggUnhatched) && !/Not hatched|Nog niet/.test(de.tEggUnhatched)
      && de.playState === 'play' && /train/.test(de.playMode);
    const nlOk = /Avontuur/.test(nl.adv) && /Collectie/.test(nl.collect)
      && /Wapens/.test(nl.weapons) && /Instellingen/.test(nl.settings)
      && /Tips/.test(nl.help) && /Boek|Alle types/.test(nl.dexSum + ' ' + nl.dexTypes)
      && /Oproepen/.test(nl.summons)
      && /Nog niet gevonden/.test(nl.tGearLock) && /Kiezel/.test(nl.tEgg)
      && /Collectie/.test(nl.collectTitle) && /Vonk/.test(nl.tPower) && !/unlock/i.test(nl.tProduce)
      && /Blad/.test(nl.tStyleLeaf) && !/Leaf/.test(nl.tStyleLeaf)
      && nl.tAdvLose === 'VERLOREN' && /ROBOT WINT/.test(nl.tTrainLose)
      && /buit|ronde/.test(nl.tKeep) && !/\bloot\b|\brun\b/.test(nl.tKeep)
      && /mislukt/.test(nl.tErrRetry) && /Kon modus/.test(nl.tOpenMode)
      && /Versla 12/.test(nl.tDaily)
      && /Hel-legende/.test(nl.tAchLv70) && /Zone-verzamelaar/.test(nl.tAchZone)
      && /Loop · sla/.test(nl.tFirstMin) && !/Eerste minuut:/.test(nl.tFirstMin)
      && /Munten-bonus/.test(nl.tPetTip) && !/monsterboek/.test(nl.tPetTip)
      && /Open kist/.test(nl.tSummonPull + nl.tSummonOpen)
      && /monsterboek|arcade/.test(nl.petSub) && !/cosmetisch of assist/.test(nl.petSub)
      && /trekkingen/.test(nl.tLogEmpty + nl.tNoPulls) && !/pulls/i.test(nl.tLogEmpty + nl.tNoPulls)
      && /Leeg/.test(nl.tGearEmpty) && /Niets/.test(nl.tFilterEmpty)
      && /geen/.test(nl.tPetNone) && /uitgekomen/.test(nl.tEggUnhatched)
      && nl.playState === 'play' && /train/.test(nl.playMode);
    const frOk = /Pas encore trouvé/.test(fr.tGearLock) && !EN_LOCK.test(fr.tGearLock)
      && /Aide saut/.test(fr.tPerk) && /Galet/.test(fr.tEgg) && !DUTCH_COPY.test(fr.tPerk + fr.tEgg + fr.tGearLock + fr.tPetSum)
      && /Apprivoisés/.test(fr.tPetSum)
      && /Coffre/.test(fr.summons) && /PIED/.test(fr.tKick) && /coffre/i.test(fr.tQuota)
      && !/Unlock/.test(fr.tStats) && /arme/.test(fr.tPersist)
      && /Collection/i.test(fr.collectTitle) && /Étincelle|Etincelle/.test(fr.tPower)
      && !/Spark Kindle|Unlock|\+ build/.test(fr.tPower + fr.tProduce)
      && /verrouill/i.test(fr.tGearToast) && !/Still locked|Nog op slot/.test(fr.tGearToast)
      && /feuille/.test(fr.tStyleLeaf) && !/Leaf/.test(fr.tStyleLeaf)
      && /énergie/.test(fr.tStyleEnergy) && !/energy|knockback/.test(fr.tStyleEnergy)
      && fr.tAdvLose === 'DÉFAITE' && /LE ROBOT GAGNE/.test(fr.tTrainLose)
      && /partie/.test(fr.tKeep) && !/\brun\b/.test(fr.tKeep)
      && /jungle/i.test(fr.tSeasonBeat)
      && /ratée/.test(fr.tErrRetry) && !/mislukt|Kon modus/.test(fr.tErrRetry + fr.tOpenMode)
      && /Vaincs 12/.test(fr.tDaily) && /Accroc/.test(fr.tFightHiccup)
      && /enfer/i.test(fr.tAchLv70) && /zone/i.test(fr.tAchZone)
      && !/Hel-legende|Zone-verzamelaar/.test(fr.tAchLv70 + fr.tAchZone)
      && /orbes/.test(fr.tPickRem + fr.tPick3) && !/power-up|Pickup/i.test(fr.tPickRem + fr.tPick3)
      && /monstres/.test(fr.tKillRem) && !/\bkills?\b/.test(fr.tKillRem)
      && /partie/.test(fr.tRunRem) && !/\brun\b/.test(fr.tRunRem)
      && /^Orbes/.test(fr.tHelp0) && !/Power-ups/i.test(fr.tHelp0)
      && /Cours · frappe/.test(fr.tFirstMin) && !/First minute:|Eerste minuut:/.test(fr.tFirstMin)
      && /Bonus pièces/.test(fr.tPetTip) && !/bestiaire|monsterboek/.test(fr.tPetTip)
      && /Ouvrir/.test(fr.tSummonPull + fr.tSummonOpen) && !/Open chest|Open kist/.test(fr.tSummonPull + fr.tSummonOpen)
      && /partie/.test(fr.tLootHead) && !/\brun\b/.test(fr.tLootHead)
      && /COFFRE/.test(fr.tBanSummon) && !/SUMMON/.test(fr.tBanSummon)
      && /Ambiance/.test(fr.tAudio) && !/Mood|soundtrack/.test(fr.tAudio)
      && /coups finaux/.test(fr.tFin3) && !/finisher/i.test(fr.tFin3)
      && /coffre/.test(fr.tFomoCta) && !/Summon/i.test(fr.tFomoCta)
      && /tirage/.test(fr.tLogEmpty + fr.tNoPulls) && !/pulls/i.test(fr.tLogEmpty + fr.tNoPulls)
      && /Vide/.test(fr.tPullEmpty + fr.tGearEmpty) && /Rien/.test(fr.tFilterEmpty)
      && /aucun/.test(fr.tPetNone) && /éclos/.test(fr.tEggUnhatched)
      && !/No pulls|Done|Nothing in this filter|Not hatched/.test(fr.tLogEmpty + fr.tPullEmpty + fr.tFilterEmpty + fr.tEggUnhatched)
      && fr.playState === 'play' && /train/.test(fr.playMode);
    const esOk = /Aún no hallado/.test(es.tGearLock) && !EN_LOCK.test(es.tGearLock)
      && /Ayuda salto/.test(es.tPerk) && /Guijarro/.test(es.tEgg) && !DUTCH_COPY.test(es.tPerk + es.tEgg + es.tGearLock + es.tPetSum)
      && /Domados/.test(es.tPetSum)
      && /Cofre/.test(es.summons) && /PATADA/.test(es.tKick) && /cofre/i.test(es.tQuota)
      && !/Unlock/.test(es.tStats) && /arma/.test(es.tPersist)
      && /Colecci/.test(es.collectTitle) && /Chispa/.test(es.tPower)
      && !/Spark Kindle|Unlock/.test(es.tPower + es.tProduce)
      && /bloqueado/i.test(es.tGearToast) && !/Still locked|Nog op slot/.test(es.tGearToast)
      && /Pañuelo|hoja/.test(es.tStyleLeaf) && !/Leaf/.test(es.tStyleLeaf)
      && /energ/.test(es.tStyleEnergy) && !/energy|knockback/.test(es.tStyleEnergy)
      && es.tAdvLose === 'DERROTA' && /EL ROBOT GANA/.test(es.tTrainLose)
      && /partida/.test(es.tKeep) && !/\brun\b/.test(es.tKeep)
      && /jungla/i.test(es.tSeasonBeat)
      && /fallida/.test(es.tErrRetry) && !/mislukt|Kon modus/.test(es.tErrRetry + es.tOpenMode)
      && /Derrota 12/.test(es.tDaily) && /Fallo/.test(es.tFightHiccup)
      && /infierno/i.test(es.tAchLv70) && /zona/i.test(es.tAchZone)
      && !/Hel-legende|Zone-verzamelaar/.test(es.tAchLv70 + es.tAchZone)
      && /orbes/.test(es.tPickRem + es.tPick3) && !/power-up|Pickup/i.test(es.tPickRem + es.tPick3)
      && /monstruos/.test(es.tKillRem) && !/\bkills?\b/.test(es.tKillRem)
      && /partida/.test(es.tRunRem) && !/\brun\b/.test(es.tRunRem)
      && /^Orbes/.test(es.tHelp0) && !/Power-ups/i.test(es.tHelp0)
      && /Corre · pega/.test(es.tFirstMin) && !/First minute:|Eerste minuut:/.test(es.tFirstMin)
      && /Bonus monedas/.test(es.tPetTip) && !/bestiario|monsterboek/.test(es.tPetTip)
      && /Abrir/.test(es.tSummonPull + es.tSummonOpen) && !/Open chest|Open kist/.test(es.tSummonPull + es.tSummonOpen)
      && /partida/.test(es.tLootHead) && !/\brun\b/.test(es.tLootHead)
      && /COFRE/.test(es.tBanSummon) && !/SUMMON/.test(es.tBanSummon)
      && /Ambiente/.test(es.tAudio) && !/Mood/.test(es.tAudio)
      && /remates/.test(es.tFin3) && !/finisher/i.test(es.tFin3)
      && /cofre/.test(es.tFomoCta) && !/Summon/i.test(es.tFomoCta)
      && /tiradas/.test(es.tLogEmpty + es.tNoPulls) && !/pulls/i.test(es.tLogEmpty + es.tNoPulls)
      && /Vacío/.test(es.tPullEmpty + es.tGearEmpty) && /Nada/.test(es.tFilterEmpty)
      && /ninguno/.test(es.tPetNone) && /eclosionado/.test(es.tEggUnhatched)
      && !/No pulls|Done|Nothing in this filter|Not hatched/.test(es.tLogEmpty + es.tPullEmpty + es.tFilterEmpty + es.tEggUnhatched)
      && es.playState === 'play' && /train/.test(es.playMode);
    return { ok: !!(enOk && deOk && nlOk && frOk && esOk), en, de, nl, fr, es, enOk, deOk, nlOk, frOk, esOk };
  });

  await browser.close();
  if (server) server.close();
  if (!result.ok) {
    console.error('SMOKE_FAIL i18n-switch', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('SMOKE_OK i18n-switch', JSON.stringify({ en: result.en, de: result.de, nl: result.nl }));
}

run().catch((e) => { console.error('SMOKE_FAIL', e); process.exit(1); });
