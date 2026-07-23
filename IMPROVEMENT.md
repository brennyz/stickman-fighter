# IMPROVEMENT — agent-first (Stickman Fighter)

**Lees eerst [AGENTS.md](./AGENTS.md) en [agent-handoff.json](./agent-handoff.json)** (open wensen + canonical agent-URL), daarna dit bestand. Doel: continue polish **zonder gameplay te breken**.

Live spel (vaste URL): **https://brennyz.github.io/stickman-fighter/**

---

## Ralph Wiggum d20 (verbeter-loop)

Elk gezicht = één thema. **Roll** = kies willekeurig uit wat nog in de zak zit. Pas als alle **20** geweest zijn → nieuwe cyclus (opnieuw shufflen, geen herhaling binnen een cyclus).

```bash
chmod +x scripts/roll-improvement-d20.sh scripts/mark-d20-done.sh
./scripts/roll-improvement-d20.sh status      # zak + PENDING
./scripts/roll-improvement-d20.sh            # roll (preflight + pending-lock)
./scripts/roll-improvement-d20.sh unroll     # pending terug in zak
./scripts/roll-improvement-d20.sh preflight  # node --check + smoke load
./scripts/mark-d20-done.sh 7 "korte note" 1.8.9
```

Staat: `improvement-d20-bag.json` (commit na roll + na afronden).

**d20 v3:** open roll = **PENDING** · **`userFeatureLog`** in `improvement-d20-bag.json` = user-wensen **zonder** nieuwe roll (Mats, mikken) · zoek **handoff** → `HANDOFF-ZOEKINDEX.md` + `.cursor/agent-handoffs/handoff.md`

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
2. Run **`./scripts/roll-improvement-d20.sh status`** — check PENDING.
3. Run **`./scripts/roll-improvement-d20.sh`** (of user zegt “roll”) — preflight + één face.
4. Werk **alleen** dat thema af — kleine diff. Bij vergissing: `unroll`.
5. Checklist + **`node --check game.js`** + **`node scripts/smoke-load-game.mjs`**.
6. `./scripts/mark-d20-done.sh <d#> "note" <version>` · Agent log · commit bag.
7. Push naar **main** → Pages update (geen tunnel nodig).

---

## Ralph zegt

> “I'm a unitard!” — en jij bent de unit die **één** thema per keer fixt. Roll. Ship. Repeat.
