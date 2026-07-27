# ASSET-STYLE — één polish-stijl voor knoppen & beelden

**Dit bestand is leidend.** Elke agent die menu-knoppen, iconen of UI-beelden maakt of vervangt, leest **eerst dit document**, dan pas code wijzigen.

Live spel: https://brennyz.github.io/stickman-fighter/

---

## Is dit mogelijk? (kort antwoord)

**Ja.** Jouw voorbeeld-workflow werkt:

1. Jij zegt: *“Maak de menu-knoppen”* (of één set: hub-tiles / mode-rij / home-icoon).
2. Agent leest **`ASSET-STYLE.md`**.
3. Agent maakt assets in de juiste map (`assets/buttons/…`).
4. Agent **vervangt** de oude inline SVG / placeholder door die bestanden (HTML/CSS/JS).
5. Build + smoke + commit/push zoals gewoon.

### Wat wél / niet realistisch is

| Aanpak | Geschikt voor | Notitie |
|--------|---------------|---------|
| **SVG-bestanden** (handgeschreven / gegenereerde vector) | Menu-knoppen, hub-tiles, icoontjes | **Voorkeur.** Scherp op iPad, klein, matcht huidige stijl. |
| **PNG/WebP** | App-iconen, foto-scenery, zeldzame raster-art | Alleen als SVG niet past. Geen blurry UI-knoppen. |
| **Canvas-tekenen** (`drawTouchBtnIcon`, scenery) | In-game vechtknoppen, decor | Blijft code — style tokens hieronder gelden wél. |
| **Los AI-plaatje per knop zonder dit doc** | — | **Verboden.** Leidt tot willekeurige stijlen. |

Cursor kan SVG’s als code schrijven en in `assets/` zetten. Raster via image-tools alleen als jij **expliciet** een plaatje vraagt; ook dan: dit doc = kleuren, stroke, formaat.

---

## Eén look — tokens (niet afwijken)

### Palet (bestendig met huidige UI)

| Token | Hex | Gebruik |
|-------|-----|---------|
| `ink` | `#e8f0ff` | Primair icoon-lijn / fill licht |
| `ink-dim` | `#9db1e3` | Secundair |
| `gold` | `#ffd75e` | Accent, rewards, continue |
| `gold-deep` | `#c97a20` | Schaduw / stroke op goud |
| `cyan` | `#7cf5ff` | P1, info, claim-pad |
| `pink` | `#ffb0b8` | P2, soft alert |
| `green` | `#7cfc8a` / `#4ecf6a` | Succes, avontuur |
| `red` | `#ff6b6b` | Urgent, versus |
| `purple` | `#c792ff` | Collectie / wapens |
| `panel` | `#1a2030` / `#333c55` | Achtergrond-vlakken |
| `shadow` | `rgba(0,0,0,.35)` | Knop-schaduw |

### Vormtaal

- **Geen emoji** op knoppen of in nieuwe assets.
- **Geen** paarse glow / glassmorphism / stock “AI gradient” knoppen.
- **Stroke-first** iconen: `stroke-width` ≈ **1.8–2.2** op `viewBox="0 0 24 24"`.
- `fill="none"` + lichte fill alleen voor accent-blobs (`opacity .3–.4`).
- Ronde kappen: `stroke-linecap="round"` · `stroke-linejoin="round"`.
- Chunky arcade: max **3–6 paden** per icoon; leesbaar op ~28–40px.
- Touch: icoon + label; icoon niet kleiner dan **24×24** CSS-px in de knop.

### Formaten

| Soort | Bestandsformaat | Canvas / viewBox | Export |
|-------|-----------------|------------------|--------|
| Menu / hub icoon | `.svg` | `0 0 24 24` | 1 bestand = 1 icoon |
| Grote mode-knop art (optioneel) | `.svg` | `0 0 64 64` | Alleen als gevraagd |
| PWA / home screen | `.png` | 180 / 192 / 512 | Blijft in `icons/` |
| Foto / scenery samples | `.png` / notes | zie `assets/forest-floor/` | Geen knop-UI |

---

## Mappen (plaats hier, nergens anders)

```
assets/
  buttons/          ← menu + hub SVG-iconen (leidend voor knop-vervanging)
    hub/            ← adventure, arcade, versus, collect
    modes/          ← training, wall, mats, weapons, pets, style, skills, upgrades, dex
    chrome/         ← back, home, claim, pause, settings toggles
  ui/               ← overige UI-SVG (lock, check, saga chips als files)
  forest-floor/     ← scenery samples (bestaand)
icons/              ← alleen PWA app-iconen (180/192/512 png)
```

**Naming:** `kebab-case`, Engels, stabiel:

- `assets/buttons/hub/adventure.svg`
- `assets/buttons/modes/training.svg`
- `assets/buttons/chrome/home.svg`

Geen spatie, geen versie in de bestandsnaam (`btn-v2.svg` verboden). Vervangen = **overschrijven** hetzelfde pad.

---

## Agent-workflow (jouw voorbeeld)

Wanneer de user vraagt: *“Maak de menu-knoppen”* / *“vervang hub-tiles”* / *“nieuwe knop-iconen”*:

### Checklist (verplicht)

1. **Lees** dit bestand + bekijk huidige knop in `index.html` / `styles/main.css`.
2. **Kies set** (niet alles tegelijk tenzij gevraagd):
   - `hub` (4 tiles), of
   - `modes` (arcade/collect rijen), of
   - `chrome` (terug/home/claim/…).
3. **Schrijf SVG’s** naar `assets/buttons/<set>/` volgens tokens hierboven.
4. **Wire-in** — vervang inline `<svg>…</svg>` door bv.:

   ```html
   <span class="hub-tile-ico">
     <img src="assets/buttons/hub/adventure.svg" alt="" width="28" height="28" decoding="async">
   </span>
   ```

   of CSS `mask-image` / `background-image` als de knop kleur via CSS moet krijgen.
5. **SW / cache:** nieuwe assets toevoegen aan `sw.js` precache-lijst als ze op first-load nodig zijn; bump `SW_CACHE_REV` + `APP_VERSION` bij ship.
6. **Smoke:** `npm run build && npm test` (of `node --check` + smoke).
7. **Commit** met pad + set in de message (`feat(assets): hub button SVGs`).

### Wat “vervangen” betekent

- Oude **inline** SVG in HTML → verwijderen, file + `<img>` (of gedeelde partial) gebruiken.
- Zelfde **visuele rol** (avontuur = zwaard/pad, arcade = pad, enz.) behouden zodat spelers herkennen.
- CSS-klassen (`.hub-tile`, `.mode-btn`, `.btn`) **niet** ombouwen tot image-buttons tenzij gevraagd — alleen het **icoon** vervangen.

### Prompt-sjabloon (user → agent)

```
Lees ASSET-STYLE.md. Maak [hub|modes|chrome] knop-iconen als SVG
in assets/buttons/…, vervang de huidige iconen in index.html,
houd kleuren/stroke volgens ASSET-STYLE, geen emoji, daarna build+smoke.
```

---

## Inventaris — waar knoppen nu leven

| Set | Locatie nu | Doelmap | Status |
|-----|------------|---------|--------|
| Hub tiles (4) | `index.html` `.hub-tile-ico` | `assets/buttons/hub/` | **Live** |
| Mode-rijen | `index.html` `.mode-btn .ico` | `assets/buttons/modes/` | **Live** |
| Nav chrome (terug / pauze / swap) | `.back-btn` / `#pauseBtn` / char-swap | `assets/buttons/chrome/{back,pause,swap}.svg` | **Live** |
| Home / claim / settings / dock | `index.html` | `assets/buttons/chrome/` | **Live** |
| Saga-filters | `.char-saga-bar` / dex-filter | `assets/ui/saga-*.svg` | **Live** |
| Touch vechtknoppen | `src/core/storage.js` `drawTouchBtnIcon` | **code**, geen PNG | code |
| Prestatie-iconen | `ACH_ICON_FILE` → `assets/ui/ach-*.svg` | `assets/ui/` | **Live** |
| Lock / check / coin / warn | `SVG_*` → `assets/ui/ui-*.svg` | `assets/ui/` | **Live** |
| Adventure eilanden | `ADVENTURE_ISLANDS.icon` → `assets/ui/island-*.svg` | `assets/ui/` | **Live** |
| PWA icons | `icons/icon-*.png` | blijf hier | PNG |

### Nav-set (chrome) — tokens

| Icoon | Pad | Accent | Rol |
|-------|-----|--------|-----|
| Terug | `chrome/back.svg` | `ink` `#e8f0ff` | Alle `.back-btn` |
| Pauze | `chrome/pause.svg` | `ink` | `#pauseBtn` in-gevecht |
| Swap | `chrome/swap.svg` | `ink` | P1/P2 wissel |
| Home | `chrome/home.svg` | `ink` | Terug naar menu |

Stroke `2–2.2`, chunky paden, geen emoji-pijlen (`←` / `⏸`).

### Saga-set (`assets/ui/`)

`saga-all`, `saga-fighter`, `saga-ki`, `saga-scroll`, `saga-tide`, `saga-cape`, `saga-dawn` — zelfde stroke-first taal; kleuren per saga (goud / cyan / purple / rood).

### Preview-sheet

Na icon-batch: `scripts/render-button-previews.mjs` → PNG in `assets/buttons/_preview/` (niet verplicht in SW).

---

## CSS-contract voor file-iconen

Na vervanging moeten iconen:

- In `.hub-tile-ico img` / `.mode-btn .ico img`: `width/height` 28–32px (hub), 1.55em (mode).
- `alt=""` als ernaast al een tekstlabel staat (a11y: label is de knoptekst).
- Niet `draggable`.
- Bij high-contrast: icoon blijft zichtbaar (stroke `#fff` of `currentColor` + CSS `color`).

Voorbeeld CSS-hulp (mag in `styles/main.css` bij eerste wire-in):

```css
.hub-tile-ico img,
.mode-btn .ico img,
.sub-home-btn .ico img {
  display: block;
  width: 1.55em;
  height: 1.55em;
  pointer-events: none;
}
.hub-tile-ico img { width: 28px; height: 28px; }
```

---

## Voorbeeld SVG (referentie — kopieer de taal, niet blind)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="#7cf5aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     aria-hidden="true">
  <path d="M4 4l6 16M20 4l-6 16M12 2v20"/>
</svg>
```

Accentkleur mag per knop-familie (avontuur groen, versus roze, …) — **niet** willekeurig per regeneratie.

---

## Scope-grenzen

- **Geen** balance / XP / damage in asset-PRs.
- **Geen** emoji terugbrengen.
- **Geen** nieuwe “design system” CSS-framework.
- Eén set per PR waar mogelijk (hub óf modes óf chrome).
- Als user alleen *“maak dit doc”* zegt: alleen document + mappen — nog geen massale knop-vervanging.

---

## Gerelateerd

| Bestand | Rol |
|---------|-----|
| `AGENTS.md` | Start checklist — verwijst hierheen bij art/knoppen |
| `IMPROVEMENT.md` | d20 polish-loop (aparte track van asset-batches) |
| `assets/buttons/README.md` | Korte map-index |
| `assets/forest-floor/README.md` | Scenery samples |
| `styles/main.css` | Knop-layout (`.btn`, `.hub-tile`, `.mode-btn`) |
