# Scherm-zichtbaarheid trechter — wat toont wat (blauw scherm)

**Doel:** stap-voor-stap door de code kunnen redeneren *waarom* je een UI-scherm, het gevecht, of een blauw/zwart vlak ziet.  
**Gebruik:** bij elk “blauw scherm”-rapport eerst deze trechter, pas daarna code wijzigen.

Gerelateerd: [`DEBUG-BLACK-SCREEN.md`](./DEBUG-BLACK-SCREEN.md) (snelle actie) · [`AGENTS.md`](./AGENTS.md) (play-contract).

---

## 0. Methode (hoe we checken)

Werk **van buiten naar binnen**. Stel bij elke laag één ja/nee-vraag. Stop bij de eerste “nee” — dat is de trechter-mond.

```
1. Welke MODE bedoelen we?     (menu-UI · submenu · play · pause · result)
2. Welke LAYER zou zichtbaar moeten zijn?
3. Klopt de STATE-machine?     (state + game + body.is-playing)
4. Klopt de SCREEN-laag?       (.screen.active ja/nee)
5. Klopt de CANVAS-laag?       (#game visibility + draw-pad)
6. Is er een LID/overlay?      (flash, splash, tunnel, menu-stage, …)
7. Tekent de LOOP het goede?   (game.draw vs drawMenuBackdrop #151b33)
```

**Meetinstrument:** `?sfdebug=1` → strip + `__sf.debug()` / `sfDebugScreen()`.  
Gezond play: `state=play` · `screens=—` · `isPlaying=Y` · `playBroken=N` · canvas `visibility=visible`.

**Regel:** geen fix die meerdere lagen tegelijk “forceert” (nuclear lids). Eén laag per PR, met smoke.

---

## 1. Lagen die iets op het scherm zetten

Van achter naar voren (z-index / stacking):

| Laag | DOM / code | Zichtbaar wanneer | Ziet eruit als |
|------|------------|-------------------|----------------|
| **A · Canvas** | `#game` | `state==='play' && game` → `syncPlayLayer` zet `visibility:visible` + `body.is-playing` | Speelveld (of leeg donker als `game.draw` faalt) |
| **B · Menu-backdrop paint** | `drawMenuBackdrop(ctx)` in `src/boot/loop.js` | Alleen als `Perf.canvasDrawActive()` én **niet** `state==='play'` (typisch hub) | Donkerblauw `#151b33`-achtig vlak **op de canvas** |
| **C · `.screen` UI** | `.screen` / `.screen.active` in `styles/main.css` | Exact één (of meer) schermen met class `active` → `display:flex` | Menu/settings/levels — achtergrond **ook** `#151b33` gradient |
| **D · Overlays** | splash, tunnel, `#levelRollFlash`, toasts, debug-strip | Eigen `hidden` / classes | Kan canvas of UI bedekken |
| **E · Menu-stage** *(overhaul PR)* | `#menuScreen .menu-stage` | Alleen hub live; moet weg bij play | Full-bleed vista/video achter menu-chrome |

**Belangrijk onderscheid — twee soorten “blauw”:**

1. **UI-blauw** = een `.screen` met `active` (CSS gradient `#151b33` → `#0a0d18`, z-index 20) ligt **over** de canvas.  
2. **Canvas-blauw** = loop tekent `drawMenuBackdrop` terwijl je denkt dat je speelt, of canvas is zichtbaar maar `game.draw` draait niet.

Collections die wél werken + Avontuur blauw ⇒ meestal **UI-blauw of lid** (screen/flash), niet “game.js dood”.

---

## 2. State-machine (één waarheid)

`state` in `src/boot/start.js` (globaal):

| `state` | Verwacht zichtbaar | `body.is-playing` | `.screen.active` | Canvas |
|---------|--------------------|-------------------|------------------|--------|
| `menu` | UI-scherm (menu of submenu) | nee | ja (minstens één) | `hidden` |
| `play` | gevecht | **ja** | **geen** | `visible` |
| `pause` | `#pauseScreen` | nee* | ja pause | hidden |
| `result` | `#resultScreen` | nee | ja result | hidden |

\* `is-playing` volgt `canvasHits = (state==='play' && !!game)` in `syncPlayLayer` — dus **alleen** echte play.

### Start Avontuur (canonieke volgorde)

`startGame()` in `src/boot/start.js`:

1. `game = new Game(mode, opts)` — faalt → `recoverToMenu`
2. Guard: `game.player` aanwezig
3. **`state = 'play'`** (vóór UI-wissel)
4. resize / audio / onboarding
5. **`UI.show(null)`** → `clearScreensForPlay` + `syncPlayLayer`
6. Eerste **`game.draw(ctx)`** — voorkomt 1 frame menu-blauw op canvas

Als stap 5/6 hapert: audio kan al spelen terwijl je blauw ziet (bekend symptoom).

---

## 3. Code-pad stap voor stap

### 3.1 Wie mag UI tonen?

```
UI.show(id)          src/ui/ui.js
  id truthy  → target.classList.add('active'); andere screens remove
  id null    → clearScreensForPlay()   // play: géén active screen
  altijd     → syncPlayLayer()
  id truthy  → ensureVisibleScreen()
```

CSS:

- `.screen` → `display:none` (default)
- `.screen.active` → `display:flex` + z-index 20  
→ **Elke** active screen dekt de canvas volledig (tenzij transparent — dat zijn ze niet).

### 3.2 Wie mag canvas tonen?

```
syncPlayLayer()      src/systems/missions.js
  canvasHits = (state === 'play' && !!game)
  if canvasHits → clearScreensForPlay() + hide flash
  #game.style.visibility = canvasHits ? 'visible' : 'hidden'
  body.is-playing = canvasHits
```

CSS versterking: `body.is-playing #game { visibility:visible !important; z-index:1 }`.

### 3.3 Wie tekent pixels op `#game`?

```
loop()               src/boot/loop.js
  if !Perf.canvasDrawActive() → return   // geen draw
  if state === 'play' → game.draw(ctx)   // NOOIT backdrop
  else → drawMenuBackdrop(ctx)           // #151b33 familie
```

`Perf.canvasDrawActive()` (`src/00-prelude.js`):

- `state === 'play'` → true  
- anders → alleen `menuLandingVisible()` (`state==='menu'` én `#menuScreen.active`)

Dus: op settings/levels (`state==='menu'` maar menuScreen niet active) wordt **niet** elke frame de game-canvas beschilderd — UI-scherm is de zichtbare laag. Goed.

### 3.4 Gebroken-play detectie

```
playLayerBroken()    alleen zinvol als state==='play' && game
  true als:
    - er is nog een .screen.active     → UI-blauw lid
    - body mist is-playing
    - #game computed visibility hidden / display none
```

Loop roept bij broken → `forcePlayCanvasVisible('loop')` (strip screens + sync + één draw).

### 3.5 “Is er überhaupt UI?”

```
isUiVisible()
  play+game → canvas visible + is-playing + géén active screen
  anders    → activeScreenEl() && screenLooksUsable(active)
```

`screenLooksUsable`: heeft het scherm knoppen/tiles met echte afmetingen?  
Leeg `.screen.active` = “blauw deksel zonder inhoud” → guard mag herstellen.

---

## 4. Trechter bij blauw scherm (beslisboom)

```
[ Blauw / zwart na Avontuur-start ]
            │
            ▼
   Audio speelt wél? ──nee──► startGame / Game ctor crash?
            │ja                    check console / recoverToMenu
            ▼
   ?sfdebug=1 strip lezen
            │
            ├─ state≠play ──────────────────────► state nooit gezet / teruggezet
            ├─ screens≠— (bijv. levelScreen) ───► UI-blauw: clearScreensForPlay faalde
            │                                      of iets zette .active terug
            ├─ isPlaying=N ─────────────────────► syncPlayLayer niet / game null
            ├─ playBroken=Y ────────────────────► forcePlayCanvasVisible path
            ├─ flash=ON ────────────────────────► dobbel-flash lid (moet IN levelScreen)
            └─ state=play, screens=—, isPlaying=Y, playBroken=N
                        │
                        ▼
               Canvas-blauw / lege draw
                        │
                        ├─ W/H 0? ──────────────► resize / forceGameResize
                        ├─ loopErr? ────────────► update/draw throw → recover
                        └─ drawMenuBackdrop in play? ► VERBODEN regressie in loop.js
```

### Snelle correlatie

| Symptoom | Meest waarschijnlijke laag | Eerste check |
|----------|----------------------------|--------------|
| Blauw + menu-knoppen zichtbaar | C UI | Verkeerd scherm, geen play |
| Blauw, geen knoppen, audio aan | C lid of B backdrop | `screens=` + `playBroken` |
| Collections OK, Avontuur blauw | C/D alleen op start-pad | `startGame` / flash / levelScreen |
| Helemaal dood, geen audio | start/boot | console TDZ / SW cache |
| 1 frame blauw dan OK | normaal-ish | eerste `game.draw` ontbrak vroeger |

---

## 5. Wat we al gedaan hebben (leerlog)

Chronologisch nut voor agents — **niet herhalen**:

| Aanpak | Resultaat | Les |
|--------|-----------|-----|
| “Nuclear lids”: `display:none !important` op alle `.screen`, MutationObservers, canvas z60–z80 | Collections bleven werken; **Avontuur brak** | Te zwaar; breekt CSS-contract `.screen.active` |
| Flash **buiten** `.screen` gezet | Bleef soms hangen over play | Flash hoort **in** `#levelScreen` |
| Alles behandelen als “UI over canvas” | Miste canvas-backdrop pad | Onderscheid UI-blauw vs canvas-blauw |
| **Ochtend-route** terug: `syncPlayLayer` simpel, `startGame` volgorde state→show(null)→draw | Canonieke fix | Documenteer + niet “verbeteren” met lids |
| Play-contract in `AGENTS.md` + `DEBUG-BLACK-SCREEN.md` + comment op `syncPlayLayer` | Continuïteit over agents | Eerst lezen, dan pas patchen |
| Menu full-bleed stage (overhaul) | Nieuwe laag E | Stage **moet** weg bij play (`hidden` / CSS); geen z-index lids |

**Verboden regressies (checklist bij review):**

- [ ] Geen `display:none !important` op generieke `.screen`
- [ ] Geen flash-root buiten `#levelScreen`
- [ ] Geen `drawMenuBackdrop` onder `state === 'play'`
- [ ] Geen canvas z-index > UI als “fix” (maskeert symptomen)
- [ ] `syncPlayLayer` blijft: visibility/pointer/is-playing — geen opacity/display wars

---

## 6. Agent-werkvolgorde (kort)

1. Lees dump / strip (`state`, `screens`, `isPlaying`, `playBroken`, flash).  
2. Kies **één** trechter-tak (tabel §4).  
3. Open alleen de bijbehorende functies (`startGame` / `UI.show` / `syncPlayLayer` / `loop`).  
4. Minimale patch + `npm test`.  
5. Handmatig: Avontuur start **en** Collectie openen (regressie-paar).  
6. Regel in `IMPROVEMENT.md` agent log: welke trechter-tak + versie.

---

## 7. Console-cheatsheet (iPad/Safari of desktop)

```js
// Dump
__sf.debug()
// of
sfDebugScreen({ toast: true })

// Play forceren vrij (alleen als state al play + game)
__sf.fixPlayLayer()

// Hard terug menu
__sf.goMenu()
```

URL: `https://brennyz.github.io/stickman-fighter/?sfdebug=1`

---

## 8. Bestandskaart

| Bestand | Rol in zichtbaarheid |
|---------|----------------------|
| `src/boot/start.js` | `state`, `startGame` |
| `src/ui/ui.js` | `UI.show`, screen-lijst |
| `src/systems/missions.js` | `syncPlayLayer`, `playLayerBroken`, `sfDebugScreen`, guards |
| `src/boot/loop.js` | `game.draw` vs `drawMenuBackdrop`, menu-hero paint |
| `src/00-prelude.js` | `Perf.menuLandingVisible` / `canvasDrawActive` |
| `styles/main.css` | `.screen` / `.screen.active` / `body.is-playing #game` |
| `index.html` | screen DOM, flash-locatie, (overhaul) `.menu-stage` |

---

*Laatste methodische pass: 2026-07-25 — ochtend-route bevestigd; menu-stage als extra laag genoteerd voor overhaul-PR.*
