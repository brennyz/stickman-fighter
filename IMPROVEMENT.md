| 2026-08-17 | **merge** | LIVE FF: d8 PWA + d20 health + d13 missies + d2 training + d11 nav + d19 muur + d7 save + d14 FX · **v1.18.151 / SW v361**. |
| 2026-08-17 | **14** | d14 c6: Spiral Orb ring alleen op echte hit (ook robot); geen rand-ghost; Lite FX ring-eerst. v1.18.151 / SW v361. |
| 2026-08-17 | **7** | d7 c6: Import overschreef Backup — Herstel deed niks. Nu: huidige save eerst in Backup, daarna alleen primary. v1.18.150 / SW v360. |
| 2026-08-17 | **19** | d19 c6: Muur-HUD had ~/min én projectie (zelfde getal); balk “achter” tot record al gebroken. Eén “Op weg naar N”. v1.18.149 / SW v359. |
| 2026-08-17 | **11** | d11 c6: Arcade result/pauze terug naar Arcade-hub i.p.v. KIES JE PAD; avontuur blijft landing. v1.18.148 / SW v358. |
| 2026-08-17 | **2** | d2 c6: RabbitRobot Pierce had energy-gate (nooit); telegraph = windup; laser XOR Pierce; tips zeggen spring. v1.18.147 / SW v357. |
| 2026-08-17 | **13** | d13 c6: missies-copy één adem — Dagbonus, geen grind-mantra, geen dubbele claim-toast; knop pas als klaar. v1.18.146 / SW v356. |
| 2026-08-17 | **20** | d20 c6: dode Kets-UI (`kablam-ui.js`) eruit — live thermometer blijft; versus-ghost binds; duplicate LIVE-LINK. Zero gedrag. v1.18.145 / SW v355. |
| 2026-08-17 | **8** | d8 c6: SW wacht op menu (geen skipWaiting midden-gevecht); update-banner tikt alleen op hub; tijdens play “laadt in het menu”; install-cache regel. v1.18.144 / SW v354. |
| 2026-08-16 | — | **Merge-fix + touch-maat:** (1) versus-retire `vsRosterEntry()`=null + adventure `rosterId:'hero'` → `combatEntryFor` crash in `attackSpec` (sla/wapen/trap dood, "hiccup"-toast). (2) `touchUiScale` portret-aspect `W/H*0.95` pinde elke 19,5:9 telefoon op de ondergrens → 36px knoppen 4px van de gesture-strip; nu ≥44px + 24px vrijloop, kolom-pitch op 2×r. `smoke:touch-btns` sweept 8 formaten. LIVE v1.18.143 / SW v353. |
| 2026-08-16 | **12** | d12 c6: monsterboek biome-filters (boerderij/zoo/zee) + flavor-regels + 282-count + farm/zoo/zee-prestaties. v1.18.142 / SW v352. |
| 2026-08-07 | — | Soft-feel store A3/A4: milder golf 1 + langere telegraphs/visual cue; sterkere partGate loop-rechts (touch+KB); device-qa.md. v1.18.134 / SW v344. |
| 2026-07-26 | **18** | d18 c5: char fight dock (step/TOT/same-pair) + replay last duo; boot-fail toast dismiss; summon smoke counter timing · v1.18.125 / SW v335 LIVE. |
| 2026-07-26 | **4** | d4 c5: spawn funnel + star beat HUD + stage-clear runway; _levelClearPending reset · v1.18.124 / SW v334 LIVE. |
| 2026-07-26 | **6** | Achterstallig audio LIVE: SFX/battle diversiteit + top-SFX polish + d6 pause → main. v1.18.112 / SW v322. |
# IMPROVEMENT — agent-first (Stickman Fighter)
- 2026-08-07 IP-A: anime skill IDs → generic (spiral_orb/lightning_pierce/…) · Jutsu→Technique · Chakra→Energy · activeTechnique save migrate · v1.18.136 / SW v346

**Lees eerst [AGENTS.md](./AGENTS.md) en [agent-handoff.json](./agent-handoff.json)** (open wensen + canonical agent-URL), daarna dit bestand. Doel: continue polish **zonder gameplay te breken**. Knoppen/beelden: **[ASSET-STYLE.md](./ASSET-STYLE.md)** is leidend.

Live spel (vaste URL): **https://brennyz.github.io/stickman-fighter/**

---

## Ralph Wiggum d20 (verbeter-loop)

**`roll`** = alleen de dev-workflow (d20 thema kiezen → uitwerken → coderen).  
In-game avontuur-gok heet **Gooi & start** / **dobbel** — nooit “roll” in de UI.

Elk gezicht = één thema. **Roll** = kies willekeurig uit wat nog in de zak zit. Pas als alle **20** geweest zijn → nieuwe cyclus (opnieuw shufflen, geen herhaling binnen een cyclus).

```bash
npm run roll                              # = ./scripts/roll-improvement-d20.sh
npm run roll:doctor                       # HTML/versie/SW/handshake + play-safe guards
chmod +x scripts/roll-improvement-d20.sh scripts/mark-d20-done.sh
./scripts/roll-improvement-d20.sh status      # zak + PENDING + hard-bug handoff
./scripts/roll-improvement-d20.sh            # roll (preflight; open pending → backlog + nieuwe roll)
./scripts/roll-improvement-d20.sh unroll     # pending terug in zak (geen nieuwe roll)
./scripts/roll-improvement-d20.sh backlog   # wachtrij uit te werken
./scripts/roll-improvement-d20.sh pick 11   # d11 uit backlog → PENDING
./scripts/mark-d20-done.sh 7 "korte note" 1.8.9
```

Staat: `improvement-d20-bag.json` (commit na roll + na afronden).

**d20 v4 tooling** (bag blijft schema v3): `doctor` + strengere preflight (`smoke:html`, `__SF_EXPECT_REV`, install/sw syntax) · status toont hard-bug handoff · focus voor SW/play-safe & screen-transities.

**d20 v3:** open roll = **PENDING** · **`rollBacklog`** = gerold maar nog niet uitgewerkt (blijft bewaard bij re-roll) · **`userFeatureLog`** = user-wensen zonder roll · handoff → `HANDOFF-ZOEKINDEX.md`

### Diagnose — Chrome “tap feedback, geen actie” (2026-07-23)

| Symptoom | Oorzaak | Fix |
|----------|---------|-----|
| Knop deukt in (CSS `:active`), geen schermwissel | `game.js` crashte vóór `addEventListener` | `MAX_LEVEL` vóór `sanitizeSave()` (v1.8.9) |
| Menu dood op iPad/PWA | canvas + tunnel-overlay vingen touches | canvas hidden buiten play; overlay `pointer-events:none` (v1.8.8) |
| Detectie | `node scripts/smoke-load-game.mjs` | zit in d20 **preflight** |

### Review — laatste 8 rolls (2026-07-23)

| d# | Oordeel |
|----|---------|
| **15** Onboarding | Goed — 1 toast/modus, geen stack; past bij iPad. |
| **1** Combat | Goed — feel-only (hit-stop, i-frames), geen dmg×. |
| **4** Avontuur | Goed — stars/pacing zichtbaar, geen grind. |
| **10** A11y | Goed — OS reduced-motion + contrast. |
| **16** Hosting | Goed — Pages primair; tunnel fallback. |
| **5** Perf | Goed — caps/DPR; Lite FX opt-in. |
| **18** Char select | Goed — UI/stats; geen roster balance. |
| **12** Content | Goed — dex/cosmetic; geen loop-slop. |

**Conclusie:** cyclus 1 bezig (d12 af). Open: **deploy push** (403).

| d# | Categorie | Voorbeelden (klein & veilig) |
|----|-----------|------------------------------|
| **1** | Combat feel | Hit-stop, i-frames, combo window — **geen** dmg-formule wijzigen zonder test |
| **2** | Training / RabbitRobot | Telegraphen, round timer, AI aggressie |
| **3** | Versus 2P | Rematch, HUD, spawn fairness |
| **4** | Avontuur | Sterren-drempels, wave spacing, pickup rates |
| **5** | Performance | FX caps, debounce resize, minder particles |
| **6** | Audio | Volume curves, mute in pauze, geen nieuwe grote assets |
| **7** | Save & backup | Sanitize, export hint, geen key rename |
| **8** | PWA / offline | SW bump, network-first HTML, manifest |
| **9** | iPad touch | `pointer-events`, grote knoppen, dual pad layout |
| **10** | Toegankelijkheid | reducedMotion respect, contrast, geen flits-FX |
| **11** | Menu & navigatie | Terug-knoppen, “Verder spelen”, tips |
| **12** | Content | Stats in dex, nieuwe cosmetic — **niet** core loop slopen |
| **13** | Missies / achievements | Daily copy, claim UX, geen grind x10 |
| **14** | Visuele FX | Rasengan ring, combo pulse — cap particles |
| **15** | Onboarding | Eén toast per modus, help tekst |
| **16** | Hosting | hosting.json, LIVE-LINK, geen tunnel op Pages |
| **17** | Stabiliteit | try/catch loop, toast bij error |
| **18** | Character select | Saga-filters + parodie-hints; 5 saga-icon sticks; touch-delegatie |
| **19** | Muur | Combo feedback, bonus bricks |
| **20** | Code health | Rename/comments — **zero** gedrag wijzigen |

---

## Gameplay-safe checklist (verplicht)

Voordat je merge/commit:

1. **Menu’s klikbaar** — `#game` heeft `pointer-events: none` tenzij `body.is-playing` en `state === 'play'`.
2. **Geen overlay** op GitHub Pages — tunnel boot direct `ready()` op `.github.io`.
3. **Geen balance-bom** — geen globale dmg/hp × factor zonder expliciet verzoek.
4. **Touch in gevecht** — joystick + knoppen alleen testen in play-modus (niet in pauze/menu).
5. **Save** — `SAVE_KEY` niet wijzigen; migratie via `sanitizeSave` alleen uitbreiden.
6. **SW** — cache versie bumpen bij `game.js` / `index.html` wijzigingen.
7. **Smoke** — `node --check game.js`; handmatig: menu → training 30s → terug.

---

## Wat kan beter (snapshot — categorieën)

| Bucket | Prioriteit | Opmerking |
|--------|------------|-----------|
| **iPad UX** | Hoog | Pages live; oude PWA-cache kan oude JS tonen → SW v19+ |
| **GitHub deploy** | Hoog | Push `main` met PAT `repo` — lokaal v1.8.3 / SW v31 |
| **Tunnel** | Laag | Alleen fallback; Pages is primair |
| **Versus balance** | Medium | Per-char tuning in kleine stappen (d3) |
| **Content** | Medium | Meer achievements, geen 50 nieuwe levels in één PR |
| **Onboarding** | Medium | Minder toast-stapel (d15) |

---

## Agent log (kort — nieuwste bovenaan)

Schrijf **1–3 regels** per sessie: datum, d#, wat, versie.

| Datum (UTC) | d# | Update |
|-------------|-----|--------|
| 2026-08-17 | **merge** | LIVE FF-merge #248–#255 → main · v1.18.151 / SW 361. Pull `main` op de pc. |
| 2026-08-17 | **14** | FX: Spiral Orb hit-ring (ook robot); geen off-screen ghost; Lite FX ring vóór sparks. v1.18.151 / SW 361. |
| 2026-08-17 | **7** | Save: import bewaart vorige voortgang in Backup; Herstel backup is echte undo. v1.18.150 / SW 360. |
| 2026-08-17 | **19** | Muur: één tempo-getal (Op weg naar N · record); balk groen op tempo, niet pas ná record. v1.18.149 / SW 359. |
| 2026-08-17 | **11** | Menu: Arcade-fight exits (result/pauze) landen op Arcade-hub; avontuur op landing; labels Arcade / Stop & Arcade. v1.18.148 / SW 358. |
| 2026-08-17 | **2** | Training: Pierce doet het weer (robot-energy); balk = windup; één dreiging; spring i.p.v. duck. v1.18.147 / SW 357. |
| 2026-08-17 | **13** | Missies: één term Dagbonus, hub-hook, scherm = flow+Nu+kaarten; claim-toast alleen XP; Dagbonus-knop pas klaar/binnen. v1.18.146 / SW 356. |
| 2026-08-17 | **20** | Code health: spook-Kets UI weg, live balk ongemoeid; versus-ghost knoppen; LIVE-LINK 1×. v1.18.145 / SW 355. |
| 2026-08-17 | **8** | PWA: nieuwe SW wacht tot hub; gouden balk tikt alleen in menu; gevecht ziet “laadt in het menu”; install toont cache-klaar. v1.18.144 / SW 354. |
| 2026-08-16 | **12** | Monsterboek: biome-filters, flavor-tekst op kaarten, juiste 282-count, 3 biome-prestaties. v1.18.142 / SW 352. |
| 2026-08-07 | — | **iOS shell:** Capacitor stubs + Guideline 4.2 notes (C2–C3). Docs only. |
| 2026-08-07 | **merge** | Soft-live stack op main: privacy + soft-feel + versus-retire + IP-A techniques · **v1.18.138 / SW v348**. |
| 2026-08-07 | — | **soft-legal:** privacy.html + settings/menu link, age/teens+ hints, docs/store data-safety + iOS nutrition; A1/A2/A7/B7/C4 done. v1.18.134 / SW v344. |
| 2026-08-07 | — | **IP-A:** anime skill names → generic techniques (spiral_orb/lightning_pierce/void_gaze/…); jutsu→technique; chakra→energy; activeTechnique + hex alias migration; v1.18.136 / SW v346. |
| 2026-08-07 | — | **Store listing:** NL/EN copy, IARC draft, App Review notes, `capture-store-screenshots.mjs` (B4–B6, C5–C6). Docs only. |
| 2026-08-07 | — | **Store B1–B2:** Play shell = TWA/Bubblewrap → `speel.html`; scaffold `native/android/` (`com.brennyz.stickmanfighter`, signing placeholder, DAL notes). Docs only. |
| 2026-08-07 | — | **Summons fix:** kist-onderkant zichtbaar (16:9 + right-crop watermark); reward true center. v1.18.131 / SW v341. |
| 2026-08-07 | — | **Summons polish:** reward rarity-tint in kist, per-pull BGM, Open kist CTA + stage-tap, video 90% + watermark crop. v1.18.130 / SW v340. |
| 2026-08-07 | **merge** | Loose ends LIVE: hub coin innerHTML (#220) + island SVGs (#227) + Satan stall-boss/heat (#206) · v1.18.129 / SW v339. |
| 2026-08-07 | **1** | Combat c6: adventure counter-hit gold confirm ring + haptic(9) + 26ms freeze; training/versus counter ring parity. v1.18.128 / SW v338. |
| 2026-07-27 | **4** | Avontuur c6: wave-pip trait-kleuren (alle 8 traits), next-wave preview via waveTraitBanner, stageAlly HUD op hy-stack, level-grid ★☆ slots, spawn funnel vanaf 2 vijanden. v1.18.127 / SW v337. |
| 2026-07-26 | **2** | Training c5: 3s dummy grace wired, Chidori cap 32% HP + low-HP mercy AI, trainRoundBest per ronde, summon counter snap tijdens reveal. v1.18.126 / SW v336. |
| 2026-07-26 | **18** | Char select c5: fight dock + replay duo + boot toast fix. v1.18.125 / SW v335. |
| 2026-07-26 | — | **Summons video:** echte Gemini-share mp4 (10s) i.p.v. placeholder + true fullscreen (`has-video`). v1.18.122 / SW v332. |
| 2026-07-26 | — | **Summons:** 10× random/dag, fullscreen pull (`is-pulling`), geen spoiler-toast, nice 14% + mid 30%. v1.18.121 / SW v331. |
| 2026-07-26 | — | **Summons spectacle LIVE:** 5s reveal.mp4, ui-rail-wide stage-first, arcade chest, rarity rays, video display:block fix. v1.18.120 / SW v330. |
| 2026-07-26 | — | **Arcade UI icons:** prestaties/lock/check/coin/warn + saga JS → `assets/ui/*.svg`; emoji uit ach/hub/loot. v1.18.119 / SW v329. |
| 2026-07-26 | **19** | Muur c5: pauze live-stats (timer/stenen/combo/record-tempo), combo×10 milestone, smoke-wall regressie. v1.18.118 / SW v328. |
| 2026-07-26 | — | **Rasengan CD LIVE:** Lv1–2 = 2s · Lv3–7 = 3s · Lv8 = 5s. v1.18.117 / SW v327. |
| 2026-07-26 | — | **Summons video:** `assets/summon/reveal.mp4` (4s stickman tree→chest) wired + SW precache. Gemini share was login-walled; replace file anytime. v1.18.116 / SW v326. |
| 2026-07-26 | — | **LIVE merge:** daily summons harden (menu-kist, center-card last 2s, save quota fix, smoke) zonder conflict op main. v1.18.115 / SW v325. |
| 2026-07-26 | — | **Summons harden:** where-from/where-see strip, center-card laatste 2s (video of fallback), rarity FX shell, geen open tijdens play, save null→5 fix, smoke-summon. |
| 2026-07-26 | — | **User fix harden+merge:** wapen-upgrades ownership-only (expliciete zone-gate + belt in add/try); smoke banked-shards cheat. v1.18.114 / SW v324. |
| 2026-07-26 | — | **User fix:** wapen-upgrades alleen voor bezit (`weaponUnlockedByLevel`) — geen zone/locked wapens meer upgraden. v1.18.113 / SW v323. |
| 2026-07-26 | — | **iPad/mobile scale:** fluid `--ui-rail` / type tokens, tablet≥768 + iPad landscape + phone-landscape density, saga touch floors, leesbaarheid clamp. v1.18.111 / SW v321. |
| 2026-07-26 | — | **Menu SVG nav LIVE:** back/pause chrome, saga-*.svg, preview sheet. v1.18.110 / SW v320. |
| 2026-07-26 | — | **Zone-wapens harden:** adventure keep-equipped fix, DoT quiet/skipHitSfx, smoke:zone, regressie-guards. v1.18.109 / SW v319. |
| 2026-07-26 | **6** | Audio c5: pauze reset combat-heat (BGM lead rustig), combat-SFX geblokkeerd (UI allowlist), syncAudioVolSliders pause↔instellingen, iPad ctx-suspended hint. v1.18.108 / SW v318. |
| 2026-07-26 | — | **Zone-wapens wire:** drops + on-hit effects + burn-tick aangesloten; Nightmare 2.0/Hell 3.0 drops overal; UI zone/effect badges. v1.18.107 / SW v317. |
| 2026-07-26 | — | **Model deepen:** Nightmare 2.0 / Hell 3.0 — enrageMul wired, ember/pain golven, sterkere vuur/lava visuals, unlock Lv70, petcoin bonus, UI-blurb. v1.18.106 / SW v316. |
| 2026-07-26 | — | **LIVE fix:** Nightmare 2.0 / Hell 3.0 + herstel Nachtmerrie/Hel eilanden (Lv51–70) & zone-wapens. v1.18.105 / SW v315. |
| 2026-07-26 | — | **User: Nachtmerrie/Hel wapens.** +2 eilanden (Lv 51–70), +27 ludieke zone-only wapens met on-hit effecten, rariteiten nightmare/hell, weapons-UI zone/effect badges. v1.18.104 / SW v314. |
| 2026-07-26 | — | **User:** grootste bazen (bossCore/super) — grotere intro-tekst + naamplaat, soms colossaal ×2 size, veel meer HP. v1.18.103 / SW v313 (na merge Rinnegan+boerderij). |
| 2026-07-26 | — | **Rinnegan check:** upgrade-strook dikker (Lv0 r0 42 → Lv5 ~78), smoke + merge main. v1.18.102 / SW v312. |
| 2026-07-26 | — | **Rinnegan:** pull-orb → tweerichtings lichtschits-explosie (slash), strook tapert met afstand; dmg/kb omhoog. v1.18.101 / SW v311. |
| 2026-07-26 | — | **Nightmare 2.0 / Hell 3.0:** model-labels, sterkere vuur/lava/schreeuw-visuals, HUD-chip, snellere vijanden + aura, merge boerderij/dierentuin. v1.18.102 / SW v312. |
| 2026-07-26 | — | **Endgame diffs:** Normal / Nightmare 2.0 / Hell 3.0 na adventure clear. Harder HP/DMG + wildere rariteiten; Nightmare vuur-bg; Hell lava + schreeuwende stickmans. |
| 2026-07-26 | — | **User:** monster diversiteit ~2× (137→281): +60 boerderij-op-hol +84 dierentuin-uitbraak (24 arts, grote sizes), ranch/safari golven, vaker reuzen. v1.18.101 / SW v311. |
| 2026-07-26 | **12** | Content c5: weapon/pet rarity chips n/tot, volgende-wapen unlock hint, hub icon SVG data-URI fallback bij stale SW. v1.18.100 / SW v310. |
| 2026-07-26 | **8** | PWA c5: speel.html SW register + offline share cache; SW canonical puts voor speel/ipad/android; install/loop shell check incl. speel; smoke-pwa-shell in test+doctor. v1.18.99 / SW v309. |
| 2026-07-26 | **6** | Achterstallig audio LIVE: SFX/battle diversiteit + top-SFX polish + d6 pause → main. v1.18.112 / SW v322. |
| 2026-07-26 | **6** | Merge d6 pause-duck van main; pause UI allowlist +bonus/win/pickup/gamble; versie na dual-108 → v1.18.109 / SW v319. |
| 2026-07-26 | — | Merge main: audio diversity PR + zone weapons/grote bazen — playFightBgm behouden, colossal banners behouden. v1.18.108 / SW v318. |
| 2026-07-26 | **6** | Top-SFX polish: `hit` samples + priority load, rijkere punch/hit/select/combo synth, battle/menu lead×2 + groove layers. v1.18.104 / SW v314. |
| 2026-07-26 | **6** | Audio diversiteit ×2: Kenney SFX samples ~311→685 (~6/id), battle/elite/boss/tide BGM-pools + `playFightBgm` rotatie, bredere pitch/synth-alt. v1.18.103 / SW v313. |
| 2026-07-26 | **3** | Versus 2P c5: pause Wissel kant (swapVsSides), TOT rating chip in HUD + pauze, swap.svg chrome. v1.18.98 / SW v308. |
| 2026-07-26 | **17** | Stabiliteit tooling: smoke Puppeteer-tests (gamble/levelup/petwave/wave12/adventure) starten nu eigen static server via `smoke-static-server.mjs` — `npm test` faalde in cloud VM met ERR_CONNECTION_REFUSED. v1.18.97. |
| 2026-07-26 | **20** | Code health c5: skillLabel duplicate merge (object+flat i18n), dead code prune (syncPlayLayerWithoutGuard, syncCharFightBtn, eggDailyLine, rollD20Polish, playerWalkRightInput, utilitySkillActive, ensureActiveJutsuValid). v1.18.96 / SW v306. |
| 2026-07-26 | **7** | Save c5: skill/item upgrade Lv in export meta, import preview, drift detail; progress score tie-break; readSaveJson merge. v1.18.95 / SW v305. |
| 2026-07-26 | **5** | Performance c5: projectile spawn via perfFx budget/room, verborgen-tab loop ~2 Hz, SceneryArt cache cap per tier. v1.18.94 / SW v304. |
| 2026-07-26 | **1** | Combat feel c5: avontuur counter-hit op monster telegraph/dash/jutsu (geen dmg×) + dup btnAdventure hub-fix + monster art fallback. v1.18.93 / SW v303. |
| 2026-07-26 | **17** | HOTFIX: pickup life constants terug + shark/octo draw (drops + onzichtbare zwemmers). v1.18.92 / SW v302. |
| 2026-07-26 | **15** | Collectie-iconen live: soft → arcade ASSET-STYLE (cachebust v1.18.91 / SW v301). |
| 2026-07-26 | **15** | Collectie-iconen: soft/kinderachtig → ASSET-STYLE arcade (wapens/pets/stijl/skills/upgrades/dex/collect/ei). v1.18.90 / SW v300. |
| 2026-07-26 | **15** | Hub Avontuur-icoon: kapotte UTF-8 (Win-1252) → Safari/iPad toonde geen afbeelding; duidelijker map-SVG + utf8 smoke. v1.18.89 / SW v299. |
| 2026-07-26 | **14** | Visuele FX: training combo HUD dubbel-blok verwijderd; Rasengan dual/triple extra ring+spark (Lite FX capped); ring fill in Lite. v1.18.88 / SW v298. |
| 2026-07-26 | — | **Rasengan:** altijd horizontaal; Lv4+ dual krul ↑↓; Lv8 triple ultimate (→↑↓). Max Lv8. v1.18.84 / SW v294. |
| 2026-07-26 | **17** | Stabiliteit: save envelope unwrap (import + readSaveJson), gamble `__sfStartGameBusy` reload guard, spawn queue invalid-species guard. v1.18.83 / SW v293. |
| 2026-07-26 | **17** | Rasengan hiccup: `spawnJutsu` jb/jutsu/fireProj regressie na skill-refactor — ReferenceError elke cast; orbs opruimen bij wave-clear. v1.18.82 / SW v292. |
| 2026-07-26 | **17** | Golf 1/2 vast: geen checkpoint op korte levels (<4 golven); lijken weg; partGate touch/vx fix. v1.18.81 / SW v291. |
| 2026-07-26 | **17** | Wave-clear hiccup: ontbrekende `partBoundaryWaveIdx` + `playerWalkInput` na module-split (checkpoint golf 1/2 + pet Slymo). v1.18.79 / SW v289. |
| 2026-07-26 | — | **Menu polish:** hub-iconen 0 transparantie; tegels solid; stickmen alleen in top-band (niet achter knoppen). v1.18.79 / SW v289. |
| 2026-07-26 | **17** | Fight hiccup-freeze: loop tekent/input na update-crash door; grantXP level-up + pickup guarded; recoverFightHiccup. v1.18.78 / SW v288. |
| 2026-07-26 | **13** | Missies c5: in-play mission floater (geen toast-stack), XP-voortgangsbalk vandaag, achievement spotlight Speel-knop. v1.18.77 / SW v287. |
| 2026-07-26 | — | **HOTFIX dice→start:** Continue/level rolled dice maar startte niet (levelScreenActive-guard + flash in display:none). Flash buiten screen; start altijd na roll. v1.18.76 / SW v286. |
| 2026-07-26 | **16** | Hosting c5: shareCacheRevFor max(SW, hosting.json); speel.html QR sync via index rev; settings refresh hosting. v1.18.75 / SW v285. |
| 2026-07-26 | **17** | Stabiliteit cron: gameUiTimerOk op deferred toast/banner; dexBag() guard tegen corrupt save.dex. v1.18.74 / SW v284. |
| 2026-07-26 | **17** | Stabiliteit cron: gamble timer screen-guard (level/gamble), safeOpen cancel, tab-hide/bfcache cancelGambleStart, ensureTipsSeen array. v1.18.73 / SW v283. |
| 2026-07-26 | **17** | Stabiliteit cron: tab-hide/bfcache geen pause na game.over; sanitizeTipsSeen 0/1; gamble timer startGen guard. v1.18.72 / SW v282. |
| 2026-07-26 | **11** | Menu nav c5: goMenu cancelGamble+bumpResult, goBack renderMenu refresh, pause hidden na over. v1.18.71 / SW v281. |
| 2026-07-26 | **17** | Stabiliteit cron: version-restore modal + mission claim toast guards tijdens play/gamble; partGate tipsSeen sanitize. v1.18.90 / SW v300. |
| 2026-07-26 | **14** | d14 FX: training combo dup fix, Rasengan rings, lite ring fill. v1.18.88 / SW v298. |
| 2026-07-25 | **17** | Stabiliteit cron: stale result timer (d17 regressie), training→scheduleGameResult, gamble cancel op level terug. v1.18.68 / SW v278. |
| 2026-07-25 | **17** | Stabiliteit cron: char swap `t()` shadow crash; adventure win→pauze→menu laat resultaat zien. v1.18.67 / SW v277. |
| 2026-07-26 | **10** | d10 a11y c5: calm joy/special meter + rarity glow, HC gamble flash CSS. v1.18.70 / SW v280. |
| 2026-07-26 | **17** | d17 stabiliteit: stale level hold, gamble SFX cancel, petCoinCost guard. v1.18.69 / SW v279. |
| 2026-07-25 | — | **HOTFIX:** zeldzame extra krachten UIT (summon/Master Sword/tide); level-einde → LEVEL KLAAR + betrouwbaar resultaat/Volgende. v1.18.65 / SW v275. |
| 2026-07-25 | — | **HOTFIX rariteit:** kill/summon/tide/masterSword + showResult hardened — zeldzame rolls crashen run niet meer. v1.18.64 / SW v274. |
| 2026-07-25 | — | **HOTFIX adventure flow:** dual pads alleen versus; update/draw crash → geen menu; Kets finish hardened. v1.18.63 / SW v273. |
| 2026-07-25 | — | **HOTFIX zichtbaar:** Kets-thermometer + skills/supers scroll (speciale Kets weer te zien/equippen). hosting shareCacheRev sync. v1.18.62 / SW v272. |
| 2026-07-25 | — | **HOTFIX adventure:** dualMode via mode-string → 2P pads; Ketsbam finish try/catch (geen late menu). v1.18.61 / SW v271. |
| 2026-07-25 | **17** | Stabiliteit cron: char select bindCharPickSurface crash (→ bindCollectionPickGrid), claim-all batch, gamble race, lastPlay clamp. v1.18.60 / SW v270. |
| 2026-07-25 | — | **HOTFIX play v2:** adventure 1-tap→menu. Inline suppress + NOOIT recoverToMenu bij window-error tijdens play/pause + smoke regressie. v1.18.59 / SW v269. |
| 2026-07-25 | — | **HOTFIX play:** adventure 1e tik → menu. `playInputSuppressed` + try/catch Input/canvas + geen recoverToMenu zolang game leeft. v1.18.58 / SW v268. |
| 2026-07-25 | — | **Adventure tap→menu:** `playInputSuppressed` terug + geen recoverToMenu bij window-error zolang `game` leeft. v1.18.57 / SW v267. |
| 2026-07-25 | **9** | iPad touch c5: pointerup scroll-guard (id mismatch fix), joy held pulse, 2P neutral zone strip. v1.18.56 / SW v266. |
| 2026-07-25 | **15** | Onboarding c5: pauze eerste-minuut chip, Ketsbam/Tide inline hints, eerste Tide zonder toast. v1.18.55 / SW v265. |
| 2026-07-25 | **17** | Stabiliteit (cron): blackScreenGuard tide cleanup, ketsbam charge abort bij death, todayKey fallback in sanitizeSave. v1.18.55. |
| 2026-07-25 | — | **Ship:** gamble timer cancel op skip/back/recover (uit #141) mee naar live. v1.18.51 / SW v261. |
| 2026-07-25 | — | **Ship live:** menu full-bleed glass UI + 47 button SVGs + visibility funnel docs. v1.18.50 / SW v260. |
| 2026-07-25 | — | **Assets harden:** hub+modes+chrome SVG’s in app, SW precache, CSS HC/sizes, `hardenButtonIcons`, 0 inline ico/tog SVG. v1.18.49 / SW v259. |
| 2026-07-25 | — | **SW play-safe + d20 v4 tooling:** geen mid-flow reload tijdens dobbel/level/play (`__sfSafeToReload`/`needsFreshJs`); blackScreenGuard/uiWatch skip bij `gamblePending`; Ralph `doctor` + strengere preflight. v1.18.55 / SW v265. |
| 2026-07-25 | — | **Assets hub:** SVG-iconen adventure/arcade/versus/collect/continue → `assets/buttons/hub/`, wire-in startmenu. Volgende: chrome-dock → modes → harden. v1.18.48 / SW v258. |
| 2026-07-25 | — | **Menu UI harden:** stage hide tijdens play (`syncMenuHubStage` + CSS), lite-fx/a11y glass, focus/touch, `smoke:menu`. v1.18.47 / SW v257. |
| 2026-07-25 | — | **Menu UI fase 1:** full-bleed omgeving-canvas + translucent titel/tiles/meta/talen (`.menu-video-overhaul`). Video-assets later. v1.18.46 / SW v256. |
| 2026-07-25 | **17** | Stabiliteit (cron): goMenu ruimt tide-battle timers op; finishTideBattle atomisch met rollback; sanitizeSave daily done/claimed afgeleid van progress. v1.18.46 / SW v256. |
| 2026-07-25 | **5** | Performance (cyclus 4 af): geen canvas-draw tijdens pauze (hidden canvas); missie-claim/dagbonus atomisch met rollback; tide-battle monsters guard; fighter takeDamage floater guards. v1.18.45 / SW v255. **Cyclus 4 vol.** |
| 2026-07-25 | **4** | Avontuur (cyclus 4): actieve golf-trait chip, sterren-buffer strip (2★/3★ drempels), volgende-golf trait-ring; stabiliteit: ketsbamPromptCenter→layout, chargePulse aura, sanitizeSave SPECIES/SKILL_IDS/dailyDef/VS_ROSTER guards. v1.18.36 / SW v246. |
| 2026-07-25 | **17** | Stabiliteit (cron): KETS-BAM charge aura `pulse`/`innerR` ReferenceError; sanitizeSave guards voor SUPPORTED_LANGS/ACHIEVEMENTS; i18n/menu child-DOM null checks. v1.18.31 / SW v241. |
| 2026-07-25 | **17** | Stabiliteit (cron): projStrikeFighter `sk` ReferenceError in Versus jutsu-hits; VERSION_UPDATE save keys ontbraken; saveDriftDetail localStorage guard. v1.18.16 / SW v226. |
| 2026-07-25 | **17** | Stabiliteit (cron): lang-save TDZ wipe fix, level holdX/Y strict crash, showResult guards, dead uiGestureMoved weg. v1.18.1 / SW v211. |
| 2026-07-24 | — | **Top 3 feel:** combo-trainer training (×5/8/10 + XP), adventure kill-streak juice, baas telegraph HUD (slam/charge/shoot/vuur). v1.17.47 / SW v173. |
| 2026-07-24 | **16** | Hosting (cyclus 3): deploy LIVE-LINK→speel.html, speel share via hosting.json, tunnel hint, keep-tunnel Pages-first. v1.17.42 / SW v168. **Cyclus 3 vol.** |
| 2026-07-24 | **6** | Audio (cyclus 3): slider↔mute sync, Lite FX mix refresh, ctx suspend in mute-pauze, SFX preview, settings status. v1.17.41 / SW v167. |
| 2026-07-24 | — | **Envelope live:** d4+d9+d20+d10+d11 merged → v1.17.40 / SW v166. |
| 2026-07-24 | **10** | A11y (cyclus 3): calm banners/telegraphs, static low-HP, no checkpoint flash, tint hit-flash, HC HUD text, toast off. v1.17.39 / SW v165. |
| 2026-07-24 | **20** | Code health (cyclus 3): dead `openGambleForLevel`, single P1 pad, `volPct`, hitConfirm cache, redundant branches — zero gedrag. v1.17.38 / SW v164. |
| 2026-07-24 | **9** | Touch (cyclus 3): bredere 2P neutraal-strip, dual joy-guard, uiTap op level/wapen/stijl, pan-y scroll + bigTouch slop. v1.17.37 / SW v163. |
| 2026-07-24 | **4** | Avontuur (cyclus 3): golf-pips rij + Golf N/M label, reis-pauze countdown-ring, level-grid wave-strip (baas-pip) — geen xp/hp×. v1.17.36 / SW v162. |
| 2026-07-24 | **2** | Training (cyclus 3): melee telegraph HUD (SLA/TRAP), Chidori cancel bij spring, laser pauze tijdens robot-aanval, fairere spacing AI — geen one-shots. v1.17.13 / SW v140. |
| 2026-07-24 | **13** | Missies (cyclus 3): 3-stappen flow-balk (Speel→Claim→Dagbonus), “Nog X” remainder-copy, modus-pill, max-XP vandaag, claim follow-up toasts, prestatie-filter + voortgangsbalk. v1.17.12 / SW v139. |
| 2026-07-24 | **17** | Stabiliteit (cyclus 3): `safeUiAction` + `persistOrToast`, scherm/submenu handlers (missies/levels/wapens/stijl/gok), UI.show toast, SW-update tap async, install/PWA fail hints — geen silent fail. v1.17.11 / SW v138. |
| 2026-07-24 | **1** | Combat feel (cyclus 4): harden anti-stunlock — PLAYER_HURT_CHAIN_CD, geen hurt-freeze in avontuur/training/muur, jump/dash escape, langere i-frames, KETS-BAM stuck≥2. v1.17.50 / SW v176. |
| 2026-07-24 | **7** | Save (cyclus 4): schema v3 meta pets/ei/stijl; readSaveJson pets+egg merge; sync backup knop; export download; drift pets/ei; import repair-toast; stale-save hint — SAVE_KEY vast. v1.17.49 / SW v175. |
| 2026-07-24 | **7** | Save (cyclus 3): sanitize-reparatie hints (boot + import), export meta summary, live import-preview, drift-detail bij backup, stijl-unlock check op dex-prestaties — SAVE_KEY vast. v1.17.10 / SW v137. |
| 2026-07-24 | **12** | Content (cyclus 3): monsterboek type-filter + sort (boek/rariteit/unlock/kills), rariteit-tellers, volgende-dex-prestatie tracker, Top jager badge; wapens verzamel-strip. v1.17.9 / SW v136. |
| 2026-07-25 | — | **Play-simple solidify:** canonieke syncPlayLayer-contract; flash alleen hide bij play (niet menu-sync); dead __sfPlayLock weg; AGENTS/DEBUG route vastgelegd. v1.18.44 / SW v254. |
| 2026-07-25 | — | **Adventure simple revert:** nuclear lids approach wrong — back to morning syncPlayLayer, flash inside levelScreen, no !important screen kills. Keep no-menu-backdrop-during-play. v1.18.43 / SW v253. |
| 2026-07-25 | — | **Play-layer harden:** `beginPlaySession(lock→armed→live)`, UI.show blocks lids during play, DOM order, mutobs+280ms watchdog, canvas z80. v1.18.42 / SW v252. |
| 2026-07-25 | — | **Blue+audio nuclear:** lids `display:none !important`, canvas z60, `__sfPlayLock`, freeUi never hides during play, flash in playLayerBroken. v1.18.41 / SW v251. |
| 2026-07-25 | — | **Blue CSS cachebust:** `main.css` bleef op `?v=239` terwijl JS `?v=249` was — Verse versie liet oude CSS (geen flash-hide / play z40). Flash `:not(.visible)` hard weg + reassert. v1.18.40 / SW v250. |
| 2026-07-25 | — | **Adventure blue ROOT:** menu-backdrop op canvas tijdens play + geen forceGameResize; flash buiten levelScreen; first-frame draw. v1.18.39 / SW v249. |
| 2026-07-25 | — | **Adventure blue-lid:** merge main + harden gok-flash hide, forcePlayCanvas retries, CSS is-playing kills screens/flash. v1.18.38 / SW v248. |
| 2026-07-25 | — | **Fix orphan pauseBtn:** training/rabbit — alleen pauze zichtbaar; `playLayerBroken` + `forcePlayCanvasVisible`, pause z50 boven canvas. v1.18.37 / SW v247. |
| 2026-07-25 | — | **Fix menu-stuck:** screenshot `state=menu`+`settingsScreen` deksel — `screenLooksUsable`, `recoverToMenu({force})`, tikbare debug-strip → menu. v1.18.36 / SW v246. |
| 2026-07-25 | — | **Debug zwart/blauw scherm:** `DEBUG-BLACK-SCREEN.md` + `?sfdebug=1` overlay + `__sf.debug()` / `{fix:true}`; harden adventure start (hide roll-flash, force is-playing). v1.18.35 / SW v245. |
| 2026-07-25 | — | **User: ASSET-STYLE.md.** Leidend doc voor één knop/beeld-stijl + `assets/buttons/{hub,modes,chrome}/`. Workflow: lees doc → SVG → vervang inline iconen. Nog geen massale knop-batch. |
| 2026-07-25 | **13** | Missies (cyclus 4): claim-pad copy naar dagbonus, claim-call strip, almost-tag ≥75%, claim/bonus pulse, streak in dagbonus-toast — geen grind×. v1.18.34 / SW v244. |
| 2026-07-25 | **3** | Versus (cyclus 4): spawn-pads + grace label, match-point/HP-lead floaters, low-HP bar pulse, round-end skip + winner, rematch tips. v1.18.33 / SW v243. |
| 2026-07-25 | **19** | Muur (cyclus 4): record-chase meter + tempo-tick, pace-checkpoints 45s/20s, combo-warn re-arm, near-miss eindtip, muren in result. v1.18.32 / SW v242. |
| 2026-07-24 | **1** | Combat feel (cyclus 3): hit-confirm ring/spark per aanvalstype, parry-window op blok (PARRY! + freeze), counter-hit floater + extra freeze in training/versus — geen dmg×. v1.17.8 / SW v135. |
| 2026-07-24 | **2** | Training (cyclus 2): telegraph HUD-balk, Chidori-dash-lijn, laser wacht tot speler landt, geen Chidori vs lucht — geen one-shots. v1.17.7 / SW v134. |
| 2026-07-24 | **18** | Char select (cyclus 4): signature-preview, locked-hover stats, saga (n/n), fair duo ΔTOT, matchup-meter, touch preview. v1.17.49 / SW v175. |
| 2026-07-24 | **18** | Char select c3: sort HP/SPD/DMG, TOT bar, gespeeld-chip, stap-header preview. v1.17.35 / SW v161. |
| 2026-07-24 | **10** | A11y c3: calm banners/telegraphs, static low-HP vignette, fillHudText hints, HC hub tiles. v1.17.34 / SW v160. |
| 2026-07-24 | **15** | Onboarding c3: eiland-hint inline (geen toast), menu 2/5 progress, muur dubbele banner weg, missies 1 toast. v1.17.33 / SW v159. |
| 2026-07-24 | **8** | PWA c3: pageshow/visibility net refresh, cache hint in offline strip, install cache line, speel/menu offline fallback. v1.17.32 / SW v158. |
| 2026-07-24 | **20** | Code health c3: dead gamble opener, single P1 pad, volPct helper, hitConfirm cache, saga filter noop. v1.17.31 / SW v157. |
| 2026-07-24 | **3** | Versus c3: beslissende ronde + ronde-log HUD, spawn invuln timer, round-end countdown, pauze match point. v1.17.30 / SW v156. |
| 2026-07-24 | **11** | Menu nav (cyclus 3): context back-labels, scroll reset menu/levels/wapens/char, grotere hub-tiles big-touch. v1.17.29 / SW v155. |
| 2026-07-24 | **9** | iPad touch (cyclus 3): bredere 2P neutral strip, ketsbam slop, joy vs knop slop, relayoutTouchPads + bigTouch resize. v1.17.28 / SW v154. |
| 2026-07-24 | — | **Terminologie:** `roll` = alleen d20 dev-workflow (`npm run roll`). In-game gok = **Gooi & start** (geen “Roll” in UI). v1.17.27 / SW v153. |
| 2026-07-24 | **14** | FX (cyclus 3): kill confirm ring per tier, Lite FX rings (klein/kort), banner underline glow, death burst binnen cap. v1.17.26 / SW v152. |
| 2026-07-24 | **5** | Performance (cyclus 3): FX-ruimte + per-frame budget vóór burst/floater/banner/ring, lagere menu-DPR, resize debounce tier 2, hidden-tab skip tick, instellingen perf-regel. v1.17.17 / SW v144. |
| 2026-07-24 | **19** | Muur (cyclus 3): record-tempo HUD (voor/achter), timer-ticks 30s/15s, 5s hint, combo ×3/×5/×8 milestones, start-combo tip, eindscherm tempo-delta. v1.17.16 / SW v143. |
| 2026-07-24 | **3** | Versus (cyclus 2): timer-balk + HP% HUD, TIME-toast met %, spawn-markers, ronde-log op result, pauze-herstart zichtbaar, resize clamp. v1.17.6 / SW v133. |
| 2026-07-24 | **18** | Char select (cyclus 2): stat-delta’s in preview, hover-preview op kaarten, matchup-hints, random duo met HP/dmg-samenvatting — geen dmg-tweak. v1.17.5 / SW v132. |
| 2026-07-24 | **17** | Stabiliteit (cyclus 2): `safeAsync`, share/copy/resume/daily-claim toasts, save-reset melding, async reject + SW-update fail toast. v1.17.4 / SW v131. |
| 2026-07-24 | **12** | Content (cyclus 2): monsterboek rariteit-filter, stijl-unlock voortgang (Kristallijn/Boekmeester/Jager), “verschijnt in avontuur” highlight. v1.17.3 / SW v130. |
| 2026-07-24 | **11** | Menu-nav (cyclus 2): sticky Terug-knop op lange subschermen; **Terug naar menu** gaat altijd naar hoofdmenu (ook vanaf gok-scherm). v1.17.2 / SW v129. |
| 2026-07-24 | **13** | Missies (cyclus 2): Speel→ knop per daily (Avontuur/Muur/Training), volgende-missie highlight, dagbonus-streak, prestaties sorteer op bijna-klaar + intro-toast. v1.17.1 / SW v128. |
| 2026-07-24 | — | **d20 roll UX:** `./scripts/roll-improvement-d20.sh` blokkeert niet meer op open pending — zet vorige face terug in zak en rolt direct opnieuw. `unroll` = terug zonder roll. |
| 2026-07-24 | — | **User: harden movement.** `applyFighterMove` — snappy keyboard-turn (2.4× accel), joy curve, air control, lichte beweging tijdens hurt, snellere stop. v1.17.0 / SW v127. |
| 2026-07-24 | — | **User fix: muur + joystick.** Muur-modus: speler mag langs hele muur lopen (geen onzichtbare muur vóór rechter stenen). Touch-joy: vasthouden werkt — geen stale-release meer bij stil vinger. v1.16.9 / SW v126. |
| 2026-07-24 | — | **User: KETS-BAM ontsnapping + strakkere loop.** Omringd/stunlock → midden-symbool (tik / **E**): shockwave schade + knockback, ~1s super-armor (geen stun). Snappere links/rechts turn (accel + momentum-cut). v1.16.8 / SW v125. |
| 2026-07-24 | — | **User horde deel 2/2:** **+55 nieuwe soorten** in monsterboek (**114 totaal = 6× origineel**), UNLOCK_AT tot level 50; baas-golven krijgen horde-padding (3–10 extra minions). v1.16.7 / SW v124. |
| 2026-07-24 | — | **User horde deel 1/2:** 6× meer monsters per golf (`ADVENTURE_HORDE_MUL`), reuzen-variant (groter/sterker, ~15%), batch-spawn + alive-cap; **+40 nieuwe soorten** in monsterboek (59 totaal). v1.16.6 / SW v123. |
| 2026-07-24 | — | **User: Master Sword easter egg.** 2% kans per avontuur-level (slash/energy-zwaard): wapen wordt 15s Master Sword — ×2 dmg, groot bereik, unblockable melee, HUD-timer + Hyrules banner. v1.16.5 / SW v122. |
| 2026-07-24 | — | **User fix: menu-tegel scroll.** Slepen over tegels (levels, chars, wapens) selecteerde meteen bij loslaten. `initUiTapScrollGuard`: pointer-slop + scroll-delta detectie, blokkeert click/touchend na slide. v1.16.4 / SW v121. |
| 2026-07-24 | — | **User: wapen 3-move styles (hardening).** Primed chain (volgende move pas na vorige), resets bij hurt/death/dash/subst/special, `sanitizeWeaponSpec` clamps, HUD pips versus. v1.16.3 / SW v120. |
| 2026-07-24 | — | **User: wapen 3-move styles.** `WEAPON_MOVE_FAMILIES` (8 families × 3 moves), weapon-knop chain binnen ~1,38s, shuriken/fuuma throw-only, wapen-scherm toont move-namen. v1.16.2 / SW v119. |
| 2026-07-24 | **15** | Onboarding (cyclus 2): single-toast queue, hint-pill HUD, untried-modus menu/help, gamble eerste-keer copy, result-tip once — geen toast-stapel. v1.16.1 / SW v118. |
| 2026-07-24 | **1** | Combat feel (cyclus 2): `scaleKnockback`, player-hurt hit-stop, block ring+haptic, combo chain bonus, monster kb/flash — geen dmg×. v1.16.0 / SW v117. |
| 2026-07-24 | **8** | PWA (cyclus 2): SW update banner tap, offline-ready strip, soft `applySwUpdate`, branded offline fallback. v1.15.9 / SW v116. |
| 2026-07-23 | **10** | A11y (cyclus 2): `fillHudText`, rustige pips/combo/super-ring, instellingen OS-status. v1.12.26 / SW v89. |
| 2026-07-23 | **4** | Avontuur (cyclus 2): golf-pips HUD, resterende vijanden, huidig level highlight in grid. v1.12.25 / SW v88. |
| 2026-07-23 | **20** | Code health (cyclus 2): `_padP1Methods`, Input `hitButton` reuse, geen dubbele global error-toast na boot. v1.12.24 / SW v87. |
| 2026-07-23 | **14** | FX (cyclus 2): crit/combo/jutsu impact rings, `ensureParticleRoom` voor ring-prioriteit. v1.12.23 / SW v86. |
| 2026-07-23 | — | **Fix:** vroege `sanitizeSave` vóór `SPECIES` (TDZ) kon save crashen zodra dex-data bestond — alleen bootGame sanitize. v1.12.22 / SW v85. |
| 2026-07-23 | **7** | Save (cyclus 1): strip onbekende keys, NaN-volumes fix, storage diagnostics + stamp, import-warnings, export schema. v1.12.21 / SW v84. **Cyclus 1 compleet.** |
| 2026-07-23 | **9** | iPad touch: 2P midden-neutraal, slop schaal, touchend op knop/kaart, grotere pauze-hit. v1.12.20 / SW v83. |
| 2026-07-23 | **6** | Audio (cyclus 1): pauze-volume sliders (sync instellingen), Lite FX zachter BGM/SFX, `syncContextPower` bij volledig mute. v1.12.19 / SW v82. |
| 2026-07-23 | **14** | FX: Rasengan halo + impact-ring (cap-aware), minder spawn-burst bij Lite FX. v1.12.18 / SW v81. |
| 2026-07-23 | **20** | Code health: header sync, verwijderd dubbele P1-dash keydown + legacy onboarding wrappers. v1.12.16 / SW v79. |
| 2026-07-23 | **15** | Onboarding: één in-gevecht hint per modus (geen dubbele toast); welcome uitgesteld; Mats-banner alleen eerste keer; help-modus chips. v1.12.15 / SW v78. |
| 2026-07-23 | **17** | Stabiliteit: userToast, sfReportError met context, update/draw try/catch, persist/import/backup toasts, bindPress/goMenu fouten. v1.12.14 / SW v77. |
| 2026-07-23 | **3** | Versus: halve-arena bounds, fair spawn + ronde-invuln, resize respawn, intro countdown, HUD safe-top, pauze herstart 0-0. v1.12.13 / SW v76. |
| 2026-07-23 | **8** | PWA: SW v75, manifest network-first, offline HTML-fallback, netStatus in play/standalone + cache-hint. v1.12.12 / SW v75. |
| 2026-07-23 | **16** | Hosting: LIVE-LINK + stableHint → GitHub Pages primair; instellingen toont Pages-link + tunnel als dev; bundle negeert tunnel als canonical. v1.12.10 / SW v73. |
| 2026-07-23 | **19** | Muur: 60s-timerbalk, combo-vensterbalk + milestones, record-chase, tempo/projectie, MUUR×-badge. v1.12.9 / SW v72. |
| 2026-07-23 | **5** | Perf: menu-hero skip frames, lichtere backdrop bij tier 2, iPad resize debounce, Lite FX-hint, instellingen FPS. v1.12.8 / SW v71. |
| 2026-07-23 | **4** | Avontuur: HP-balk 2★/3★ ticks, live ster-hint, golf-pauze countdown + level-tooltip. v1.12.7 / SW v70. |
| 2026-07-23 | **2** | Training: oor-laser met 0,95s telegraph (spring) + RabbitRobot minder Chidori op melee-range. v1.12.6 / SW v69. |
| 2026-07-23 | **10** | A11y: rustige banners/chakra bij reduced motion; zachtere hit-flash; `prefers-contrast: more`; menu-tip contrast. v1.12.5 / SW v68. |
| 2026-07-23 | — | **Fix:** `IS_TOUCH` terug — avontuur-crash v1.12.4. |
| 2026-07-23 | — | **handoff zoekindex:** `.cursor/agent-handoffs/handoff.md`, HANDOFF-ZOEKINDEX.md, d20 `userFeatureLog` (char deel 1/2, Mats, mikken, anti-spam). |
| 2026-07-23 | **18** | Char select deel 1+2 (zie userFeatureLog) — v1.11.1–1.11.2. |
| 2026-07-23 | — | **User off-d20:** Mats coinrun + shuriken mik/vliegers + anti-spam — v1.12.0 / `f6c86bf`. |
| 2026-07-23 | — | **Android delen:** bookmarkShare, Deel link → Pages root, Web Share, ANDROID-DELEN.txt, install-stappen. v1.12.1 / SW v64. |
| 2026-07-23 | — | **Agent handoff:** AGENTS.md, agent-handoff.json, CURSOR-EEN-AGENT.txt — gedeelde context iPad/Mac; dashboard repo-koppeling voor push. |
| 2026-07-23 | — | **Mats bonus:** muntjes-modus, shuriken anti-spam (3/1,4s + cd), joystick-mik voor shuriken. v1.12.0 / SW v63. |
| 2026-07-23 | **6** | Audio: lichte snelle procedurele SFX (Rasengan/Chidori/Rinnegan, hits, stingers); Lite FX extra zacht. v1.11.7 / SW v62. |
| 2026-07-23 | **13** | Missies (cyclus 1): speel-hints per daily, prestatie-voortgang, menu **Missies · +XP**, claim-all bij 1 klaar, stappen-copy. v1.11.5 / SW v59. |
| 2026-07-23 | **1** | Combat feel (cyclus 1): hit-stop schaal (crit/zwaar/combo/2P/blok-chip), jutsu-projectielen, langere hurt-flash op big hits — geen dmg×. v1.11.4 / SW v58. |
| 2026-07-23 | **11** | Menu-nav (cyclus 1): sticky **Terug naar menu**-balk op subschermen, char-grid scroll reset, charPickStep reset bij menu. v1.11.3 / SW v57. |
| 2026-07-23 | **18** | Char select **deel 2**: saga-icon strip, Saga clash-knop, filter-random, gouden icon-kaarten, prestatie Saga-legends. v1.11.2 / SW v56. |
| 2026-07-23 | **18** | Char select **deel 1**: Stap 1/2 badge, unlock-hints, saga bindPress. v1.11.1 / SW v55. |
| 2026-07-23 | — | **Merge main:** arcade title + SVG icons + v1.10.1/SW v50; hero canvas alleen op menu; docs sync. |
| 2026-07-23 | **12** | Content: dex rariteit-chips, Kristallijn + Boekmeester looks, 3 dex-prestaties. v1.9.9 / SW v48. |
| 2026-07-23 | **14** | FX: Rasengan buitenringen + capte spark-trail, combo-ring, banner glow; Lite FX respect. v1.9.8 / SW v47. |
| 2026-07-23 | **20** | Code health: dead helpers/no-ops weg, joystick onMove gedeeld, header comment — zero gedrag. v1.9.7 / SW v46. |
| 2026-07-23 | **6** | Audio: BGM duck pause/result, music≠SFX mute, pause houdt battle-song, soft gains, setPaused. v1.9.6 / SW v45. |
| 2026-07-23 | — | **Harden v1.9.5/SW v43:** safe boot/loop/startGame/recover, persist guards, SW per-asset precache, overlay always nuked. |
| 2026-07-23 | — | **iPad press:** bindPress(touchend), overlay weg, ipad.html zonder SW, v1.9.4/SW v42. Pages nog 1.7.0 — speel via tunnel `/ipad.html`. |
| 2026-07-23 | — | **Press-fix:** sanitizeSave TDZ-proof, Verse versie-knop (SW nuke), script ?v=, UI tap-fix alle touch. v1.9.3 / SW v41. Live Pages was nog 1.7.0 (push 403). |
| 2026-07-23 | **7** | Save: dex kill-counts bewaard, export meta+clipboard, import preview, backup confirm, health-regel. v1.9.2 / SW v40. |
| 2026-07-23 | **8** | PWA: network-first HTML/JS, offline/online banner, SW update toast, install copy. v1.9.1 / SW v39. |
| 2026-07-23 | **13** | Missies: claim-UX, claim-all, statuscopy, dagbonus-hints, geen grind-wijziging. v1.9.0 / SW v38. |
| 2026-07-23 | — | **d20 v3:** PENDING-lock, unroll, preflight (check+smoke), history/force. Smoke script. Diagnose tap=load-crash. |
| 2026-07-23 | — | **Chrome tap fix:** `MAX_LEVEL` vóór `sanitizeSave()` — game.js crashte, geen handlers. v1.8.9 / SW v37. |
| 2026-07-23 | **3** | Versus 2P: spawn/round reset, timer-urgency HUD, match-point dots, TIME banner, pauze-score, rematch toast. v1.8.6 / SW v34. |
| 2026-07-23 | **17** | Stabiliteit: startGame/loop recovery, save-import fouten, persist-waarschuwing. v1.8.5 / SW v33. |
| 2026-07-23 | **2** | Training: Chidori-telegraph + ring, langere windup robot, ronde-HUD. v1.8.4 / SW v32. |
| 2026-07-23 | — | **d20 v2:** focus per roll, `status`, `mark-d20-done.sh`, review laatste 8. |
| 2026-07-23 | **15** | Onboarding: welkom-toast, 1 toast/modus, eerste-minuut HUD-hint, help-blok. v1.8.3 / SW v31. |
| 2026-07-23 | **1** | Combat feel: hit-stop per attack, korte i-frames speler, hit-flash, combo 1.62s. v1.8.2 / SW v30. |
| 2026-07-23 | **4** | Avontuur: ster-drempels zichtbaar, baas-golf pacing, adempauze vóór baas. v1.8.1 / SW v29. |
| 2026-07-23 | **10** | A11y: iOS reduced-motion, hoog contrast, rustigere UI/CSS/FX. v1.8.0 / SW v28. |
| 2026-07-23 | **16** | Hosting: `primary`/Pages als deel-link; health.json; tunnel 503 → Pages-knop. v1.7.9 / SW v27. |
| 2026-07-23 | **5** | Perf: adaptieve FX caps, debounced resize, Lite FX + lagere DPR. v1.7.8 / SW v26. |
| 2026-07-23 | **18** | 2P char select: stat-bars preview, scroll roster, P1/P2 pills, swap + random duo. v1.7.7 / SW v25. |
| 2026-07-23 | **12** | Monsterboek: stat-bars + samenvatting; Jagerlook (75 kills); prestaties Encyclopedie/Jager. v1.7.6 / SW v24. |
| 2026-07-23 | **19** | Muur: record-HUD, live record floater, combo dmg-hint, timer pulse laatste 10s. v1.7.5 / SW v23. |
| 2026-07-23 | **11** | `goBack()`, scroll reset, grotere terug-knoppen. v1.7.4. |
| 2026-07-23 | **9** | Joystick dode zone, knophits, touch-action menu. v1.7.3. |
| 2026-07-23 | — | **IMPROVEMENT.md + Ralph d20** toegevoegd. Gameplay: canvas tikken alleen bij `state==='play'`. v1.7.2 / SW v20. |
| 2026-07-23 | — | GitHub Pages live `brennyz.github.io/stickman-fighter/`. iPad: menu niet klikbaar → pointer-events fix. |
| 2026-07-23 | 14 | v1.7 combo pulse, low-HP vignette, result tips. |
| 2026-07-24 | — | **User fix: movement + mik.** Beweging voelt trager/clunky door zware lerp + geen slide in recovery; verticale mik verdween bij diagonale joy (genormaliseerd weg). Fix: snappere accel/flip/stop, recovery-slide 70%, verticale mik los van loop (`JOY_AIM_DEAD_PX`), volledige joy-dy weergave, `drawJoyAimGuide` (↑↓ + hoogtebalk), `drawPlayerAimIndicator` (kleur cyan/oranje = hoog/laag + kruis op hitpunt). v1.15.5 / SW v112. |
| 2026-07-24 | **8** | PWA (cyclus 2): SW v116 + hosting/health precache, branded offline fallback + speel.html shell, zachte update via `applySwUpdate`, tappable update-banner, offline-klaar strip, visibility SW check. v1.15.9 / SW v116. |
| 2026-07-24 | — | **User: avontuur polish.** Golf-traits (vliegers/rush/elite) + banners, `worldX` scroll tijdens reis, golf-gewist +6% HP +8 chakra, bondgenoot-assist schade, volgende-golf preview chips, combo ×6/×10 callouts, slimmere lose-tips. v1.15.8 / SW v115. |
| 2026-07-24 | **9** | iPad touch (cyclus 2): `hitTouchButton` closest-match i.p.v. first-match; portrait 3-kolommen (geen punch/jump stack); joy-guard op `joyHome`-radius; 2P pointer-pad lock (drift neutral stopt joy niet); menu scroll-lock + canvas touch-action toggle. v1.15.7 / SW v114. |
| 2026-07-24 | **5** | Performance (cyclus 2): snellere adaptieve tier op iPad (24f sample, 22ms dremp), resize skip bij zelfde maat/DPR/tier, SceneryArt cache clear bij tier-wissel, scenery/weather caps per tier, hidden-tab pauze, tier-2 alternate-frame draw skip. v1.15.6 / SW v113. |
| 2026-07-24 | — | **User fix: touch-knoppen overlap.** Landscape/iPad-cluster had punch en jump exact op elkaar (jump onbereikbaar — `hitButton` pakt eerste match) + kick/weapon/subst overlapten. Nieuw: 1P 3×2-grid, 2P 2×3-grid per kant, `clampButtonsToScreen`, joystick-clearance. Automatisch geverifieerd op iPad/phone × portrait/landscape + 2P: 0 overlap, 6/6 knoppen raakbaar + juiste press-dispatch. v1.15.4 / SW v111. |
| 2026-07-23 | — | **User art-upgrade (deel 4/4, AF): final pass + 2P-hotfix.** Touch-vechtknoppen getekend (vuist/laars/kling/jutsu-per-soort/rookwolk/pijl) ipv emoji; weer per thema (blaadjes bos, bloesem veld/dojo, sintels vulkaan, neon-regen cyber, stof grot/sloop, uit bij Lite FX/minder beweging); 16 prestatie-iconen + saga-chips als SVG; mini-vinkje ipv ✔; emoji uit hints/toasts/help/gamble. **Hotfix:** `f.alive = true` op getter-only property crashte élke 2P-start (`resetVsFighterRound`) — regel weg, 2P werkt weer. v1.15.3 / SW v110. |
| 2026-07-23 | — | **User art-upgrade (deel 3/4): in-game canvas-art.** `drawPickupIcon` (hart/vlam/spiraal/schild op orbs), `drawStarShape` voor HUD-sterrating + bonusstenen, getekende wapperende baas-vlag ipv ⚑, SUPER-meter met getekend bliksem/oog/orb-icoon, `drawMiniDie` ipv 🎲 bij gamble-HUD-regels, emoji uit floaters. In echte Chrome geverifieerd. v1.15.2 / SW v109. |
| 2026-07-23 | — | **User art-upgrade (deel 2/4): menu SVG-iconen.** Alle emoji-knoppen → inline SVG: 10× home-balk, Mats-munt, gamble (dobbelsteen/zwaarden/skip), 7 instellingen-toggles, save/hosting/export/import, missies claim/dagbonus, pauze (play/muziek/geluid/herstart/home), result, install, char-random; `SVG_LOCK_ICON` vervangt 🔒 in level/wapen-lijsten. In echte Chrome geverifieerd (0 emoji over op geteste knoppen). v1.15.1 / SW v108. |
| 2026-07-23 | — | **User art-upgrade (deel 1/4): scenery pixel-art.** `SceneryArt` cached offscreen tiles per thema — verre skyline (dennen/kristalgrot/vulkanen/neon-stad/pagodes/sloop-stad/molen-veld), pixel-wolken, pixel-bomen, grond-speckles; smoothing-off ×3 chunky look. Alle 7 thema's in echte Chrome geverifieerd. Plan deel 2: menu SVG-iconen · deel 3: in-game UI art · deel 4: final pass. v1.15.0 / SW v107. |
| 2026-07-23 | **19** | Muur (cyclus 2): timer-milestones (30s/15s), combo-decay hints, bijna-record floater, HUD TIJD/COMBO labels, slimmere eindscherm-tips. v1.14.8 / SW v106. |
| 2026-07-23 | **6** | Audio (cyclus 2): pauze duck + SFX-boost voor UI; context wakker in pauze; statusregel sliders; Escape/terug hervat audio; 2P herstart vanuit pauze. v1.14.7 / SW v105. |
| 2026-07-23 | **7** | Save (cyclus 2): export schema v2 + backupKey in meta; import-warnings (key/schema/summons); stats-strip; corrupt-primary repair-toast; healthregel drift/backup corrupt. v1.14.6 / SW v104. |
| 2026-07-23 | — | **User (deel 3/3):** stage-reis polish — checkpoint-flits + diamantjes op deel-grenzen, camera-punch bij vertrek, speed-lines tijdens reizen, baas-hartslag-vignet + roar halverwege + rode aankomst-flits. Reduced motion/Lite FX gerespecteerd. v1.14.5 / SW v103. |
| 2026-07-23 | — | **User summons:** hele kleine kans per avontuur-kill (~0,7% + zachte pity, elites ×2,5) dat een lager wapen (t/m rare) ✦ **Episch** (×1,55 dmg) of **Legendarisch** (×1,95) wordt — boven hogere unlock-wapens. `save.summons` permanent, ✦ badge + boost in wapens-UI, live hot-swap als het je uitgeruste wapen is. v1.14.4 / SW v102. |
| 2026-07-23 | — | **User balancing:** level-pacing rustiger — `xpNeed` pace-factor (+15% vroeg → +50% vanaf ~Lv 18, totaal ~45% meer speeltijd Lv 1→31) + training-win XP-cap (×12). Geen dmg/rewards-feel gewijzigd. v1.14.3 / SW v101. |
| 2026-07-23 | **16** | Hosting (cyclus 2): share/copy altijd Pages `speel.html`; tunnel-URL verstopt in instellingen (alleen zichtbaar op tunnel); LIVE-LINK zonder tunnel-https; tunnel-boot CTA → Pages primair. v1.14.2 / SW v100. |
| 2026-07-23 | — | **User (deel 2/3):** Decor evolueert per stage-deel — schemer richting einde, rotsen vanaf deel 2, arena-fakkels in deel 3 (+rode gloed bij baas); volgende golf loopt als silhouetten binnen tijdens de reis. v1.14.1 / SW v99. |
| 2026-07-23 | — | **User (deel 1/3):** Bewegend decor — wereld scrollt tussen golven (parallax heuvels/deco/grondstrepen), speler loopt door; stage-voortgangsbalk in 3 delen met bolletje + baas-vlag. v1.14.0 / SW v98. |
| 2026-07-23 | — | **User:** +12 wapens (tanto→sterkling) met art, unlocks, SFX; Fūma-shuriken gooit. v1.13.7 / SW v97. |
| 2026-07-23 | — | **User:** Meer BGM-verschil (training/versus/wall/mats) + per-wapen swing/hit SFX. v1.13.6 / SW v96. |
| 2026-07-23 | — | **User:** Speciale enemies (elite/baas/super-baas) krijgen intro-stinger + elite/boss-lied + entrance FX/aura. v1.13.5 / SW v95. |
| 2026-07-23 | — | **User:** Joy ↑ mikken tilts melee hit + shuriken/jutsu throw hoger; aim-lijn voor alle wapens. v1.13.4 / SW v94. |
| 2026-07-23 | — | **Hotfix:** TDZ `ultraLite` in `drawMenuBackdrop` (uit d5 perf) — menu-lus crashte elke frame → “Er ging iets mis, terug naar menu”. Gevonden via echte-browser E2E (puppeteer). v1.13.1 / SW v91. |
| 2026-07-23 | — | **User:** Avontuur 🎲 gok (2× d6) — random super-baas in golf of super-bondgenoot (stage buff). v1.13.0 / SW v90. |


1. Open **IMPROVEMENT.md** (dit bestand).
2. Run **`./scripts/roll-improvement-d20.sh status`** — check PENDING + backlog.
3. Run **`./scripts/roll-improvement-d20.sh`** (of user zegt “roll”) — vorige pending → **`rollBacklog`** + nieuwe face.
4. Werk **PENDING** af (code + test). **`mark-d20-done.sh`** wist pending + backlog-entry.
5. Andere ideeën uit backlog: **`./scripts/roll-improvement-d20.sh pick <d#>`** of zeg **go pick 11**.
6. User-wensen zonder roll: **`userFeatureLog`** in `improvement-d20-bag.json`.
7. Checklist + **`node --check game.js`** + **`node scripts/smoke-load-game.mjs`** · commit bag · push **main**.

---

## Ralph zegt

> “I'm a unitard!” — en jij bent de unit die **één** thema per keer fixt. Roll. Ship. Repeat.
