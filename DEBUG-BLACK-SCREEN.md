# Debug: zwart / blauw scherm (Avontuur + menu)

Live: https://brennyz.github.io/stickman-fighter/

## Canonieke play-laag (doe dit, niets zwaarder)

1. Menu/collections → `.screen.active` (CSS). Canvas `visibility:hidden`.
2. Avontuur start → `state=play`, `UI.show(null)` (stript `.active`), `body.is-playing`, canvas zichtbaar.
3. Dobbel-flash zit **in** `#levelScreen` → verdwijnt met het scherm.
4. Loop tekent tijdens play **geen** `drawMenuBackdrop` (#151b33).
5. **Verboden regressie:** `display:none !important` op alle screens, flash buiten `.screen`, MutationObserver-lid-wars, canvas z50+.

Code: `syncPlayLayer()` + comment-contract in `src/systems/missions.js`.

---

## 1. Eerst: verse versie

1. Open https://brennyz.github.io/stickman-fighter/speel.html  
2. Instellingen → **Verse versie**.  
3. Voettekst: **≥ v1.18.44 · SW v254**.  
4. Avontuur → level tikken.

Gezond gevecht: `state=play` · `screens=—` · `isPlaying=true` · `playBroken=N`.

---

## 2. Debug-overlay

```
https://brennyz.github.io/stickman-fighter/?sfdebug=1
```

Of: `localStorage.setItem('sf_debug_screen','1'); location.reload();`

Tik op de debug-strip → forceert hoofdmenu.

```js
__sf.goMenu()
__sf.debug({ fix: true })
```

---

## 3. Wat de agent wil weten

1. Apparaat (iPad / Android / PWA)  
2. Versie-regel in menu  
3. Debug-strip foto tijdens blauw  
4. Werken collections/training wél?

---

## 4. Wat jij níet hoeft te doen

- Geen save wissen.  
- Geen d20 nodig.  
