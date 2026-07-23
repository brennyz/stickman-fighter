# IMPROVEMENT — agent-first (Stickman Fighter)

**Lees dit bestand eerst** voordat je de app “verbetert”. Doel: continue polish **zonder gameplay te breken**.

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

**d20 v3:** open roll = **PENDING** (geen tweede roll tot `mark-d20-done` of `unroll`) · preflight vangt load-crashes · `history` · `force` zet oude pending terug vóór nieuwe roll.

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

**Conclusie:** ja, goede weg — blijf **één thema**, checklist, SW bump. Open: **deploy push** (403), zak **d6,d14,d20**.

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
| **18** | Character select | Stat preview, random duo, scroll |
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
| 2026-07-23 | 9 | v1.7.1 menu klikbaar (canvas niet over UI). |

---

## Workflow voor agents

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
