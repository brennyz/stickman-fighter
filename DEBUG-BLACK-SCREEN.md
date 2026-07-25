# Waarom Avontuur een blauw scherm met niets toont

Kort antwoord: je ziet **geen kapot speelveld**, maar het **menu-blauw** (`#151b33` → `#0a0d18`) dat blijft staan terwijl het gevecht al loopt (of een leeg submenu-deksel). Audio kan wél spelen — dat is het kenmerk van deze bugklasse.

Live: https://brennyz.github.io/stickman-fighter/

---

## Waarom (root causes, chronologisch)

Er zijn **meerdere lagen** die hetzelfde symptoom geven (“blauw/zwart + niets”). De recente Avontuur-gevallen (2026-07-25) kwamen vooral door #1 en #2.

### 1. Menu-backdrop op het canvas tijdens play (hoofdreden Avontuur)

Na level-tik / dobbel verdwijnen de HTML-schermen (`.screen`), maar het **canvas** kwam naar voren terwijl het nog het **menu-frame** tekende (`drawMenuBackdrop` → blauw `#151b33`). Gevolg: leeg blauw vlak, geen stickmen/HUD, wél soms geluid.

Oorzaken in code:
- `loop.js` tekende soms nog menu-backdrop terwijl `state === 'play'`
- `startGame` deed alleen `scheduleResize()` (debounce ~140 ms) → eerste frames op oude menu-grootte / oude frame
- geen directe `game.draw()` bij start

**Fix (merged, v1.18.39 · PR #142):** nooit menu-backdrop tijdens play/pause; `forceGameResize()` + directe `game.draw()` bij start.

### 2. Stale CSS na “Verse versie” (ziet er hetzelfde uit)

Na Verse versie kreeg **JS** wél een nieuwe query (`game.js?v=249`), maar **`styles/main.css?v=239`** bleef oud in de browser-cache. Die oude CSS miste o.a.:
- `body.is-playing` regels die `.screen` / flash verbergen
- canvas `z-index: 40`

Tegelijk stond `#levelRollFlash` **buiten** `.screen` (nodig na #142). Zonder verse CSS blijft die flash als blauw/zwart deksel over het gevecht.

**Fix (merged, v1.18.40 · PR #143):** cache-bust CSS naar `main.css?v=250` (gelijk met JS/SW), flash default `display:none`, play-layer weer met `!important`.

### 3. HTML-deksel: `.screen.active` over `#game`

Een menu-/level-/settings-/gamble-scherm blijft `active` terwijl `state=play`. Dat is het blauwe CSS-deksel **over** het canvas (gevecht draait eronder → wel audio).

**Fix (v1.18.35–38):** `clearScreensForPlay` / `forcePlayCanvasVisible` + `body.is-playing` CSS.

### 4. Gamble-timer race (skip/back → dubbele start)

Bij **Gooi & start** kan een pending `gokScreenTimer` (~50–420 ms) blijven lopen na skip, terug, long-press skip of menu-recover. Die start Avontuur opnieuw → dubbele `startGame` → weer blauw/zwart deksel.

**Fix:** PR #141 (`cancelGambleStart` in start/recover/skip) — check of die gemerged is.

### 5. Menu-stuck (settings-deksel zonder knoppen)

`state=menu` + `settingsScreen` active maar UI niet bruikbaar; oude `recoverToMenu` deed early-return.

**Fix (v1.18.36 · PR #140):** `screenLooksUsable` + `recoverToMenu({ force:true })` + tikbare debug-strip.

### 6. Orphan pauseBtn (training, niet Avontuur)

Alleen ║║ zichtbaar, speelveld zwart → play-laag kapot (`playBroken=Y`). Apart pad; zelfde debug-strip helpt.

---

## Wat jij nu moet zien (gezond)

1. Open https://brennyz.github.io/stickman-fighter/speel.html  
2. Instellingen → **Verse versie** / hard refresh.  
3. Menu-voettekst: **≥ v1.18.40 · SW v250** (én CSS `main.css?v=250`).  
4. Avontuur → level tikken → **echt speelveld** (grond, stickman, HUD), geen blauw vlak.

Debug-strip gezond tijdens gevecht: `state=play` · `screens=—` · `isPlaying=true` · `playBroken=N`.

---

## Debug-overlay

```
https://brennyz.github.io/stickman-fighter/?sfdebug=1
```

Of:

```js
localStorage.setItem('sf_debug_screen','1'); location.reload();
```

**Tik op de debug-strip onderaan** → forceert **hoofdmenu** (wist settings/level-deksel).

| Veld | Gezond menu | Kapot menu-deksel | Kapot Avontuur-blauw |
|------|-------------|-------------------|----------------------|
| `state` | `menu` | `menu` | `play` (of speelt audio) |
| `screens` | `menuScreen` | `settingsScreen` / level / gamble | niet leeg, of canvas toont menu-blauw |
| `usable` | `Y` | `N` | — |
| `isPlaying` | `false` | `false` | zou `true` moeten zijn |
| `canvas` | `hidden` / z≈0 | `hidden` | zichtbaar maar blauw frame |

---

## Console / nood-fix

```js
__sf.goMenu()                 // altijd hoofdmenu
__sf.debug({ fix: true })     // play→canvas; anders→menu
sfDebugScreen({ fix: true })
```

---

## Wat de agent wil weten (als het weer misgaat)

1. Apparaat (iPad / Android / PWA)  
2. Versie-regel in menu-voettekst (+ of CSS `?v=` klopt)  
3. Debug-strip foto  
4. Pad: Avontuur → level → blauw? of settings → leeg? Wel/geen audio?

---

## Wat jij níet hoeft te doen

- Geen save wissen.  
- Geen d20 nodig voor deze bugklasse.

## Code-pointers

| Onderwerp | Bestand |
|-----------|---------|
| Menu-backdrop vs play draw | `src/boot/loop.js` |
| Start + eerste frame | `src/boot/start.js` (`startGame`) |
| Play-laag / screens clear | `src/systems/missions.js` (`applyPlayLayerStyles`, `forcePlayCanvasVisible`) |
| Gamble timer | `src/systems/missions.js` (`gokScreenTimer`, `cancelGambleStart`) |
| Blauw kleuren / is-playing | `styles/main.css`, `index.html` (`#levelRollFlash`) |
| Versie / cache-bust | `src/core/storage.js` (`APP_VERSION`, `SW_CACHE_REV`), `index.html` query strings |
