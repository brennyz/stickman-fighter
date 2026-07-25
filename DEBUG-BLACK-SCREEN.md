# Debug: zwart / blauw scherm (Avontuur + menu)

Dit is het **blauwachtig-zwarte menu-deksel** (`#151b33` → `#0a0d18`) dat soms **over** het gevechtscanvas blijft staan, of een **submenu zonder knoppen** (alleen deksel) terwijl `state=menu`.

Live: https://brennyz.github.io/stickman-fighter/

---

## 1. Eerst: verse versie

1. Open https://brennyz.github.io/stickman-fighter/speel.html  
2. Instellingen → **Verse versie** / hard refresh.  
3. Check menu-voettekst: moet **≥ v1.18.42 · SW v252** zijn.  
4. Probeer opnieuw.

**Blauw + wél geluid** = gevecht loopt achter een UI-deksel. Hardening: `beginPlaySession(lock→armed→live)`, `UI.show` blokkeert non-pause screens tijdens play, DOM-volgorde, MutationObserver + 280ms watchdog, canvas z80.

**Orphan pauseBtn (training/rabbit):** alleen ║║ zichtbaar, speelveld zwart → play-laag kapot. Fix forceert canvas terug; debug-strip toont `playBroken=Y`.

**Adventure blue/black:** na level-tik/dobbel moet speelveld zichtbaar zijn. Strip: `state=play` · `screens=—` · `isPlaying=true` · `playBroken=N`.

---

## 2. Debug-overlay

```
https://brennyz.github.io/stickman-fighter/?sfdebug=1
```

Of:

```js
localStorage.setItem('sf_debug_screen','1'); location.reload();
```

**Tik op de debug-strip onderaan** → forceert **hoofdmenu** (wist settings/level-deksel).

| Veld | Gezond menu | Kapot (jouw screenshot) |
|------|-------------|-------------------------|
| `state` | `menu` | `menu` |
| `screens` | `menuScreen` | `settingsScreen` (of level/gamble) |
| `usable` | `Y` | `N` |
| `isPlaying` | `false` | `false` |
| `canvas` | `hidden` / z≈0 | `hidden` |

Gevecht-zwart: `state=play`, `screens` niet leeg, canvas z laag.

---

## 3. Console / nood-fix

```js
__sf.goMenu()                 // altijd hoofdmenu
__sf.debug({ fix: true })     // play→canvas; anders→menu
sfDebugScreen({ fix: true })
```

---

## 4. Wat de agent wil weten

1. Apparaat (iPad / Android / PWA)  
2. Versie-regel  
3. Debug-strip foto (zoals je deed — top)  
4. Pad: avontuur-zwart → debug → menu? of settings → leeg?

---

## 5. Root cause (bekend)

- **Play:** `.screen.active` over `#game` = blauw deksel + wel audio.  
- **Menu (screenshot):** `state=menu` + `settingsScreen` active maar UI niet bruikbaar; oude `recoverToMenu` deed early-return en liet het deksel staan. Fix: `screenLooksUsable` + `recoverToMenu({ force:true })` + tikbare debug-strip.

---

## 6. Wat jij níet hoeft te doen

- Geen save wissen.  
- Geen d20 nodig.  
