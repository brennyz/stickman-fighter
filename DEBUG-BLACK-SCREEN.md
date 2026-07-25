# Debug: zwart / blauw scherm (Avontuur)

Dit is het **blauwachtig-zwarte menu-deksel** (`#151b33` → `#0a0d18`) dat soms **over** het gevechtscanvas blijft staan. Audio en AI kunnen dan wel doorlopen — je ziet alleen geen speelveld.

Fixes zitten al in de app (v1.18.7+). Als het **nog** gebeurt: debug hieronder, stuur de toast-regel terug.

Live: https://brennyz.github.io/stickman-fighter/

---

## 1. Eerst: verse versie (meest voorkomende oorzaak)

Op iPad/Android blijft een **oude Service Worker** soms hangen.

1. Open https://brennyz.github.io/stickman-fighter/speel.html  
2. Instellingen → **Verse versie** / hard refresh.  
3. Check menu-voettekst: moet **≥ v1.18.35 · SW v245** zijn (na deze debug-ship).  
4. Probeer Avontuur opnieuw.

Zonder verse cache debug je per ongeluk een oude bug.

---

## 2. Debug-overlay (geen laptop nodig)

Open dit adres op het apparaat waar het misgaat:

```
https://brennyz.github.io/stickman-fighter/?sfdebug=1
```

Of éénmalig in de browser-console / bookmarklet:

```js
localStorage.setItem('sf_debug_screen','1'); location.reload();
```

Uitzetten:

```js
localStorage.removeItem('sf_debug_screen'); location.reload();
```

Onderaan verschijnt een strip met o.a.:

| Veld | Gezond tijdens gevecht | Kapot (zwart deksel) |
|------|------------------------|----------------------|
| `state` | `play` | `play` of `menu` |
| `isPlaying` | `true` / `Y` | `false` / `N` |
| `screens` | `—` (leeg) | bv. `levelScreen`, `gambleScreen`, `menuScreen` |
| `canvas z` | `40` | `0` / leeg / `visibility=hidden` |
| `flash` | `off` | `ON` (dobbel-overlay blijft hangen) |

**Tik Avontuur → level** terwijl de strip zichtbaar is. Noteer de regel op het moment dat het zwart wordt.

---

## 3. Snelle dump + nood-fix (console)

Met laptop + Safari Web Inspector (iPad) of Chrome remote debug (Android):

```js
// Alleen info (toast + console)
__sf.debug()
// of:
sfDebugScreen()

// Forceer canvas zichtbaar (als je midden in “zwart maar wel geluid” zit)
__sf.fixPlayLayer()
// of:
sfDebugScreen({ fix: true })
```

De toast-regel kun je foto’en / doorsturen naar de agent.

---

## 4. Wat de agent wil weten

Stuur bij voorkeur:

1. Apparaat (iPad / Android / PWA / Safari / Chrome)  
2. Versie-regel uit het menu (`v1.x.y · SW v…`)  
3. Debug-strip of toast na `sfDebugScreen()` **tijdens** het zwarte beeld  
4. Pad: menu → Avontuur → level-tik → dobbel-flash → zwart? of pas later?

---

## 5. Technische snelle check (ontwikkelaar)

```bash
# Console filters
# [Stickman] play cover guard
# [Stickman] black screen guard
# [Stickman] sfDebugScreen
```

Bekende root cause (v1.18.8): `.screen` (z-index 20) bleef `.active` over `#game` (z-index 1).  
Sinds die fix: `body.is-playing` verbergt screens + canvas `z-index:40`.  
Dobbel-flash (`#levelRollFlash`, z-index 35) mag **niet** zichtbaar blijven tijdens `is-playing`.

---

## 6. Wat jij níet hoeft te doen

- Geen save wissen tenzij gevraagd.  
- Geen d20-roll nodig voor dit bugtype.  
- ASSET-STYLE / knoppen zijn hier niet relevant.
