# IMPROVEMENT — agent-first (Stickman Fighter)

**Lees dit bestand eerst** voordat je de app “verbetert”. Doel: continue polish **zonder gameplay te breken**.

Live spel (vaste URL): **https://brennyz.github.io/stickman-fighter/**

---

## Ralph Wiggum d20 (verbeter-loop)

Elk gezicht = één thema. **Roll** = kies willekeurig uit wat nog in de zak zit. Pas als alle **20** geweest zijn → nieuwe cyclus (opnieuw shufflen, geen herhaling binnen een cyclus).

```bash
chmod +x scripts/roll-improvement-d20.sh
./scripts/roll-improvement-d20.sh
```

Staat van de zak: `improvement-d20-bag.json` (commit na elke roll + na elke afgeronde verbetering).

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
| **GitHub deploy** | Hoog | v1.7.1 click-fix nog pushen (token `repo`) |
| **Tunnel** | Laag | Alleen fallback; Pages is primair |
| **Versus balance** | Medium | Per-char tuning in kleine stappen (d3) |
| **Content** | Medium | Meer achievements, geen 50 nieuwe levels in één PR |
| **Onboarding** | Medium | Minder toast-stapel (d15) |

---

## Agent log (kort — nieuwste bovenaan)

Schrijf **1–3 regels** per sessie: datum, d#, wat, versie.

| Datum (UTC) | d# | Update |
|-------------|-----|--------|
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
2. Run **`./scripts/roll-improvement-d20.sh`** (of user zegt “roll”).
3. Werk **alleen** het gerolde thema af — kleine diff.
4. Checklist hierboven afvinken.
5. Regel in **Agent log** + commit `improvement-d20-bag.json` als die gewijzigd is.
6. Push naar **main** → Pages update (geen tunnel nodig).

---

## Ralph zegt

> “I'm a unitard!” — en jij bent de unit die **één** thema per keer fixt. Roll. Ship. Repeat.
