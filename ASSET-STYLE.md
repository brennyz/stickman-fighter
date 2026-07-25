# ASSET-STYLE — één polish-stijl voor knoppen & beelden

**Dit bestand is leidend.** Elke agent die menu-knoppen, iconen of UI-beelden maakt of vervangt, leest **eerst dit document**, dan pas code wijzigen.

Live spel: https://brennyz.github.io/stickman-fighter/

**Stijl-oordeel (2026-07-25):** de oude “stroke-first neon 24×24” was **niet** duidelijk genoeg voor wat we willen. Leidend is nu de **pixel-countryside** look van de menu-hero (foto → pixel vista in `COUNTRY_PAL` / `drawMenu*Vista`). Hub-tiles mogen mini-scènes zijn, geen dunne neon-lijnen.

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
| **Pixel-fill SVG** (chunky rects/ellipses, `COUNTRY_PAL`) | **Hub-tiles** (adventure e.d.), mode-art | **Voorkeur voor hub.** Matcht hero-canvas. |
| **Stroke SVG** (dunne lijn) | Chrome / dock (muziek, tips, settings) | Alleen kleine utility-iconen. |
| **PNG/WebP** | App-iconen, foto-scenery samples | Geen blurry UI-knoppen. |
| **Canvas-tekenen** (`drawTouchBtnIcon`, scenery) | In-game vechtknoppen, decor | Blijft code — palette hieronder geldt wél. |
| **Los AI-plaatje per knop zonder dit doc** | — | **Verboden.** |

Cursor schrijft SVG als code in `assets/`. Raster-tools alleen als jij **expliciet** een plaatje vraagt.

---

## Leidende look — foto → pixel countryside

Referentie in code (niet opnieuw “verzinnen”):

| Bron | Wat je kopieert |
|------|-----------------|
| `COUNTRY_PAL` in `src/render/scenery.js` / `game.js` | Exacte hex-tokens |
| `drawMenuSemi25dVista` / `drawMenuCrossroadsVista` / oak / openroad | Lagen: sky → bos → eik → akker → weg |
| `#menuHeroCanvas` + `image-rendering: pixelated` | Chunky opschaling, geen blur |
| User hero-foto’s (gepixeliseerd) | Gouden akker, grijze weg, diepgroene eik, koele lucht |

### `COUNTRY_PAL` tokens (hub / scenery-iconen)

| Token | Hex | Gebruik |
|-------|-----|---------|
| `skyTop` | `#4a6a82` | Bovenlucht |
| `skyMid` | `#7a94a6` | Middenlucht |
| `skyLow` | `#b4c2cc` | Horizonlucht |
| `cloud` | `#e8eef2` | Wolken highlight |
| `cloudShade` | `#c8d2da` | Wolken schaduw |
| `forestDeep` | `#243428` | Ver bos |
| `forestMid` | `#2e4034` | Bos mid |
| `forestLite` | `#3a4e3e` | Bos licht |
| `fieldHi` | `#b89a5c` | Akker highlight |
| `fieldMid` | `#9a7e48` | Akker |
| `fieldLo` | `#7a6438` | Akker schaduw |
| `straw` | `#a88850` | Stro / highlights |
| `roadHi` | `#7a7874` | Weg highlight |
| `roadMid` | `#5e5c58` | Weg |
| `roadLo` | `#484642` | Weg schaduw |
| `oakDark` … `oakHi` | `#2a402c` → `#5a6e56` | Eik-kruin lagen |
| `log` / `logLite` | `#5c4a38` / `#7a6448` | Stam |
| `stone` … | `#6a6058` e.d. | Huis / steen |

### UI accent tokens (labels, chrome, niet de scène)

| Token | Hex | Gebruik |
|-------|-----|---------|
| `ink` | `#e8f0ff` | Lichte UI-lijn |
| `gold` | `#ffd75e` | Rewards, featured |
| `cyan` | `#7cf5ff` | Info / P1 |
| `green` | `#7cfc8a` / `#4ecf6a` | Succes-tint op adventure-tile border |
| `pink` | `#ffb0b8` | Versus |
| `purple` | `#c792ff` | Collectie |
| `panel` | `#1a2030` | Donkere panels |

### Vormtaal — **pixel-fill** (hub)

- **Geen emoji.** Geen paarse glow / glassmorphism / stock AI-gradients.
- **Fill-first:** gestapelde `rect` / afgeronde blobs (ellipsen OK voor kroon), integer coördinaten.
- `shape-rendering="crispEdges"` op root SVG.
- Chunky pixels: denk in **2×2 of 3×3** blokjes op `viewBox="0 0 48 48"` (hub) of `0 0 64 64` (grote mode-art).
- Max ~**1 scène-idee** per icoon (avontuur = pad + eik + akker — niet zwaard + kaart + baas tegelijk).
- Leesbaar op **36–48 CSS-px**; hub-icoon mag groter dan oude 24-stroke.
- CSS bij wire-in: `image-rendering: pixelated` (en `crisp-edges` fallback).

### Vormtaal — **stroke** (alleen chrome/dock)

- `viewBox="0 0 24 24"`, `stroke-width` ≈ 1.8–2.2, `fill="none"`.
- Ronde kappen: `stroke-linecap="round"`.
- Max 3–6 paden; geen mini-landschap in dock-knoppen.

### Formaten

| Soort | Bestandsformaat | Canvas / viewBox | Export |
|-------|-----------------|------------------|--------|
| **Hub-tile scène** | `.svg` | **`0 0 48 48`** (of 64) | Pixel-fill, COUNTRY_PAL |
| Chrome / dock icoon | `.svg` | `0 0 24 24` | Stroke-first |
| Grote mode-knop art | `.svg` | `0 0 64 64` | Pixel-fill indien gevraagd |
| PWA / home screen | `.png` | 180 / 192 / 512 | `icons/` |
| Foto / scenery samples | `.png` / notes | `assets/forest-floor/` | Geen knop-UI |

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

Geen spatie, geen versie in de bestandsnaam. Vervangen = **overschrijven** hetzelfde pad.

---

## Hub-thema per tegel (scène-idee)

| File | Scène (1 job) | Accent border |
|------|---------------|---------------|
| `hub/adventure.svg` | Gouden akker + eik + pad/weg (hero-foto DNA) | groen / stro |
| `hub/arcade.svg` | Neon-pad / cabinet silhouet (koeler, blauw) | cyan / blauw |
| `hub/versus.svg` | Twee stick-silhouetten / vs-ring | roze |
| `hub/collect.svg` | Wapen/boek silhouet op paarse tint | paars |

Eerste ship-test: **alleen adventure** — andere tegels blijven inline tot gevraagd.

---

## Agent-workflow

Wanneer de user vraagt: *“Maak de menu-knoppen”* / *“test adventure SVG”* / *“vervang hub-tiles”*:

### Checklist (verplicht)

1. **Lees** dit bestand + bekijk huidige knop in `index.html` / `styles/main.css` + `COUNTRY_PAL`.
2. **Kies set** (niet alles tegelijk tenzij gevraagd).
3. **Schrijf SVG’s** naar `assets/buttons/<set>/` — hub = pixel-fill 48×48.
4. **Wire-in** — vervang inline `<svg>…</svg>` door bv.:

   ```html
   <span class="hub-tile-ico">
     <img src="assets/buttons/hub/adventure.svg" alt="" width="40" height="40"
          decoding="async" draggable="false">
   </span>
   ```

5. **SW / cache:** nieuwe assets in `sw.js` `ASSETS`; bump `SW_CACHE_REV` + `APP_VERSION`.
6. **Smoke:** `npm run build && npm test` (of `node --check` + smoke).
7. **Commit** met pad + set (`feat(assets): hub adventure pixel SVG`).

### Prompt-sjabloon (user → agent)

```
Lees ASSET-STYLE.md. Maak [hub|modes|chrome] als SVG in assets/buttons/…,
hub = pixel-fill COUNTRY_PAL 48×48, chrome = stroke 24×24,
vervang iconen in index.html, image-rendering pixelated, build+smoke.
```

---

## Inventaris — waar knoppen nu leven

| Set | Locatie nu | Doelmap |
|-----|------------|---------|
| Hub tiles (4) | `index.html` `.hub-tile-ico` (adventure → file; rest inline tot batch) | `assets/buttons/hub/` |
| Mode-rijen | `index.html` `.mode-btn .ico` inline SVG | `assets/buttons/modes/` |
| Terug / home | `index.html` `.sub-home-btn` / `.back-btn` | `assets/buttons/chrome/` |
| Missies claim / bonus | `index.html` `#dailyClaimAllBtn` e.d. | `assets/buttons/chrome/` |
| Pauze / result / settings | `index.html` + JS strings | `assets/buttons/chrome/` |
| Touch vechtknoppen | `src/core/storage.js` `drawTouchBtnIcon` | **code** |
| Prestatie / saga | `ACH_ICON_SVG` / `SAGA_ICON_SVG` in JS | optioneel → `assets/ui/` |
| PWA icons | `icons/icon-*.png` | blijf hier |

---

## CSS-contract voor file-iconen

```css
.hub-tile-ico img,
.mode-btn .ico img,
.sub-home-btn .ico img {
  display: block;
  pointer-events: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.hub-tile-ico img { width: 40px; height: 40px; }
.hub-tile-ico svg { width: 1.15em; height: 1.15em; } /* legacy inline */
```

- `alt=""` als er een tekstlabel naast staat.
- Niet `draggable`.
- High-contrast: scène blijft leesbaar (voldoende contrast in fills).

---

## Referentie — adventure hub (pixel-fill taal)

Zie `assets/buttons/hub/adventure.svg`: gestapelde sky-bands, bos-silhouet, eik-clusters, akker, weg. **Kopieer die taal** voor volgende hub-SVGs — geen stroke-kruis meer als “avontuur”.

Chrome-voorbeeld (stroke, dock):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="#7cf5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     aria-hidden="true">
  <path d="M4 5v6h6"/><path d="M20 19v-6h-6"/>
</svg>
```

---

## Scope-grenzen

- **Geen** balance / XP / damage in asset-PRs.
- **Geen** emoji terugbrengen.
- **Geen** nieuw CSS-framework.
- Eén set per PR waar mogelijk; **adventure-first** is OK als smoke-test.
- Als user alleen *“maak dit doc”* zegt: alleen document + mappen — nog geen massale knop-vervanging.

---

## Gerelateerd

| Bestand | Rol |
|---------|-----|
| `AGENTS.md` | Start checklist — verwijst hierheen bij art/knoppen |
| `IMPROVEMENT.md` | d20 polish-loop (aparte track) |
| `assets/buttons/README.md` | Korte map-index |
| `assets/forest-floor/README.md` | Scenery samples |
| `src/render/scenery.js` | `COUNTRY_PAL` + menu vistas |
| `styles/main.css` | Knop-layout (`.btn`, `.hub-tile`, `.mode-btn`) |
