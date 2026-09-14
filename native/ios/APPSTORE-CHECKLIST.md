# App Store — wat er moet gebeuren, en wat dat inhoudt

Dit is **geen knop in de repo**, en **niet verplicht**. Stickman Fighter is een **website-spel** (PWA) op

https://brennyz.github.io/stickman-fighter/speel.html

De Apple App Store verkoopt **iOS-programma’s** (IPA). Jij moet zo’n programma maken, tekenen, betalen en insturen. De agent kan drafts en scripts maken — **niet** jouw Apple-account, **niet** €99, **niet** Xcode op deze cloud-VM.

Controleer de stand met:

```bash
npm run store:doctor
```

---

## Wat het inhoudt (in één adem)

| Laag | Wat het is | Wie |
|------|------------|-----|
| Soft live (website) | Browser / “zet op startscherm” — **dit is het spel** | Al live, geen store nodig |
| Google Play (optioneel) | TWA: Play-icoon opent dezelfde Pages-URL in Chrome | Alleen als je een Play-listing wilt |
| App Store (optioneel) | Echt Xcode-project + lokale gamebestanden in de IPA | Alleen als je een App Store-listing wilt |

Play en App Store zijn **niet hetzelfde product**. Play mag een Chrome-tab om de site wrappen. Apple keurt dat vaak af als **Guideline 4.2** (“minimum functionality” — te dun, alleen een website).

Daarom: App Store = **gebundelde `www`** (de game zit *in* de app) + **native extras** (haptics, splash, landscape-lock). Updates gaan dan niet meer “gratis” via Pages: elke store-release is een nieuwe IPA + review.

---

## Wat jij moet hebben voordat “deploy” bestaat

### 1. Apple Developer Program — €99 per jaar

- Inschrijven met een Apple-ID + 2FA: https://developer.apple.com/programs/
- Zonder dit: geen App Store Connect, geen certificates, geen TestFlight, geen review.
- Account op **jouw** naam / bedrijf. De agent kan niet inloggen of betalen.
- Na goedkeuring van Apple (identiteit) kun je een app-record aanmaken.

### 2. Een Mac met Xcode

- Signing, Simulator, Archive → IPA gebeurt in Xcode.
- Deze Cursor-cloud is Linux. Hier kun je **geen** store-IPA tekenen.
- Nooit `.p12`, provisioning profiles of App Store Connect API-keys in GitHub.

### 3. Capacitor-iOS-project (nog niet in de repo)

Stubs staan in `native/ios/`. Er is **geen** `ios/App.xcodeproj`. Op de Mac, later:

```bash
# keuze: bundled www (verplicht voor eerste store-build)
npx cap add ios
# kopieer gebouwde PWA naar native/ios/www  (index.html, game.js, assets, sw)
npx cap sync ios
npx cap open ios
```

Bundle-id (voorstel): `com.brennyz.stickmanfighter`  
Oriëntatie: landscape.  
Details: `native/ios/README.md`.

### 4. Guideline 4.2 — anders keurt Apple af

Alleen “open GitHub Pages in een WebView” is bijna zeker **reject**.

Minimaal vóór Submit for Review:

1. Lokale `www` — menu bereikbaar **zonder** netwerk  
2. Haptics op hit / KO / menu-bevestiging (`@capacitor/haptics`)  
3. Native splash + landscape-lock, geen adresbalk  

Optioneel maar sterk: Game Center, native share van `speel.html`.  
Zie `native/ios/GUIDELINE-4.2.md`.

### 5. App Store Connect-listing (jij plakt, agent uploadt niet)

| Veld | Bron in repo |
|------|----------------|
| Naam / subtitel / beschrijving | `docs/store/listing-nl.md` + `listing-en.md` |
| Keywords | zelfde files (geen versus / 2-spelers) |
| Privacy-URL | `https://brennyz.github.io/stickman-fighter/privacy.html` |
| App Privacy vragen | `docs/store/privacy-nutrition-ios.md` |
| Review notes | `docs/store/review-notes.md` |
| Screenshots | `npm run store:shots` → iPhone 6.5" + iPad 12.9" landscape |
| Icoon 1024×1024 | nog maken uit `icons/icon-512.png` (jij / design) |

Geen IAP, geen login, geen chat. Versus is retired — beloof het niet.

### 6. TestFlight, daarna Review

1. Archive in Xcode → upload naar App Store Connect  
2. Internal TestFlight (jij + testers met Apple-ID)  
3. Als de IPA start, vecht, pauzeert, offline menu toont: **Submit for Review**  
4. Apple speelt het, leest de notes, kan vragen of afkeuren (vaak 4.2 of metadata)

Productie-knop in Connect zet je zelf om ná goedkeuring.

---

## Volgorde (geen kalender — afhankelijkheden)

```
PWA live (speel.html)
    → Play TWA (korter, updates via Pages)     ← aanbevolen eerst
    → of parallel: Developer-account + Mac
         → Capacitor + bundled www + 4.2 extras
         → listing + 1024-icon + shots
         → TestFlight
         → Review
         → Release
```

Android-first blijft het slimmere pad: je leert listing/IARC/privacy zonder €99 en zonder 4.2. App Store start je wanneer jij het account en een Mac klaarzet.

---

## Wat de agent wél / niet doet

| Agent | Jij |
|-------|-----|
| `npm run store:doctor` + drafts | Apple-ID, €99, 2FA |
| Listing-tekst, review notes, nutrition | App Store Connect invullen |
| Screenshot-script | Shots + 1024-icon uploaden |
| Capacitor-stubs + 4.2-lijst | Xcode-project, signing, IPA |
| Geen keystore / geen `.p12` in git | TestFlight + Submit for Review |

---

## Veelgemaakte misverstanden

- **“De PWA staat al in de App Store als ik ‘Zet op beginscherm’ doe.”** Nee. Dat is een Safari-bladwijzer, geen App Store-app.
- **“Zelfde TWA als Android.”** Nee. Apple heeft geen TWA. WKWebView + hosted URL is het risico.
- **“Agent kan deployen als de code klaar is.”** Nee. Deploy = jouw Apple-account + Mac + review.
- **“Updates vloeien automatisch door zoals bij de PWA.”** Alleen als je per ongeluk hosted-URL shipped — en dat is juist wat 4.2 afkeurt. Store-builds = nieuwe IPA.

Meer context: `STORE-LAUNCH.md` (pad A/B/C) · `docs/store/README.md`.
