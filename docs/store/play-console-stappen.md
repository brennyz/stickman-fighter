# Play Console — plakvolgorde (Android GO)

Doe dit **nadat** je een AAB hebt (`npm run android:build`) of parallel met stap 1–2 terwijl Bubblewrap installeert.

App-id in de scaffold: `com.brennyz.stickmanfighter`  
Privacy-URL: https://brennyz.github.io/stickman-fighter/privacy.html

---

## 1. App aanmaken

- Create app → naam **Stickman Fighter** (of listing-titel *Stickman Fighter Arena*)
- Default language: Dutch (NL) of English — je kunt beide listings later toevoegen
- App or game: **Game** → categorie **Action**
- Free · no ads claimed · no IAP
- Declarations: privacy policy URL hierboven; geen nieuws / geen COVID / geen government

## 2. Dashboard-vakjes (minimum voor closed test)

| Vak | Wat plakken |
|-----|-------------|
| Store listing | `listing-nl.md` + `listing-en.md` (korte + lange tekst) |
| Graphics | Telefoon-shots uit `npm run store:shots` (min. 2). Feature graphic: `npm run store:feature` |
| App icon | 512×512: `icons/icon-512.png` (later 512 adaptive uit Bubblewrap) |
| Categorization | Game / Action · tags zonder “2 spelers” |
| Privacy policy | URL hierboven |
| App content → Data safety | `data-safety-play.md` — **niet verzameld** / geen account |
| App content → Data safety ads | Geen ads |
| App content → Target audience | IARC-vragenlijst (`content-rating-iarc.md`) — niet zelf “PEGI 7” invullen tot IARC klaar is |
| App content → News / COVID / Government | Nee |
| App access | Geen login |
| Ads | Nee |

## 3. Release

1. **Testing → Closed testing** → create release → upload **AAB** (niet alleen APK).  
2. Release notes: zie “What’s New” in de listing-files.  
3. Testers: e-maillijst of Google-groep. Stuur de testers-link. Zij moeten **accepteren** (opt-in).  
4. Nieuwe persoonlijke developer-accounts: **12 testers × 14 dagen** voordat productie aan te vragen is.

Internal testing mag extra (jij + 1–2 vrienden) om de build te voelen. Dat telt **niet** als de 12/14-regel.

## 4. Niet beloven

- Geen versus / 2-spelers  
- Geen IAP / coin shop  
- Geen echt-geld-gokken (dobbel = in-game buff)  
- Geen online chat / PvP
