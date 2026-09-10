# Store & livegang — Android first, App Store zichtbaar

**De website is het spel.** App Store blijft optioneel.

**Android / Play: GO.** Jij maakt het icoon in de Play Store (TWA). Kaart: `native/android/GO.md` · `npm run android:go`.

**Live PWA:** https://brennyz.github.io/stickman-fighter/speel.html · **v1.18.152 / SW 362**
**Privacy:** https://brennyz.github.io/stickman-fighter/privacy.html

Stand van de repo (geen accounts, geen secrets):

```bash
npm run store:doctor
```

App Store in gewone taal: `native/ios/APPSTORE-CHECKLIST.md`.

---

## Status

| Pad | Focus? | Klaar in repo? | Blockers (jij) |
|-----|--------|----------------|----------------|
| A. Website (PWA) | blijft het spel | ~95% | Telefoon-smoke (`device-qa.md`) |
| B. Google Play (TWA) | **GO** | scaffold + drafts | Jij: $25, keystore, AAB, 12 testers |
| C. Apple App Store | later / optioneel | docs + stubs | Niet nu |

`native/ios/` is **documentatie + Capacitor-stubs**. Geen IPA tot jij op een Mac `npx cap add ios` draait.

---

## A — Soft live (delen zonder store)

| # | Taak | Status |
|---|------|--------|
| A1–A4, A7–A9 | Privacy, feel, versus uit, IP skills | **done** op main |
| A5 | Device QA — focus **Android Chrome** + “Add to Home Screen” | **jij** |
| A6 | “Verse versie” 1× op telefoon | **jij** |

Deel-link = `speel.html` (niet `ipad.html`, geen tunnel).

---

## B — Google Play — GO

Jij wilt het Play-icoon. De TWA opent dezelfde website. **Start:** `native/android/GO.md`.

TWA / Bubblewrap opent **dezelfde** Pages-URL in Chrome Custom Tabs. Updates = `git push` + Pages. Geen aparte game-binary.

| # | Taak | Wie | Status |
|---|------|-----|--------|
| B1 | Pad: **TWA / Bubblewrap** → `speel.html` | — | **done** |
| B2 | Scaffold `native/android/` | — | **done** |
| B3 | [Play Console](https://play.google.com/console) account + app | **jij** | pending |
| B4 | Listing NL/EN uit `docs/store/listing-*.md` | **jij** upload | draft klaar (geen versus) |
| B5 | Screenshots: `npm run store:shots` | **jij** | script klaar |
| B6 | IARC / rating | **jij** | draft in `docs/store/content-rating-iarc.md` |
| B7 | Data safety | **jij** | draft in `docs/store/data-safety-play.md` |
| B8 | Privacy URL in Console | **jij** | `…/privacy.html` |
| B9 | Keystore lokaal + Bubblewrap → **APK** (test) + **AAB** (Play) | **jij** op PC | zie `native/android/BUILD.md` |
| B10 | Closed testing (12 testers × 14 dagen) → productie | **jij** | pending — zie GO.md |

Package id: `com.brennyz.stickmanfighter`

### Jouw Android-volgorde

1. Soft live op Android: Pages-link → Chrome → startscherm → 5 min avontuur + Verse versie.
2. Play Console-account (eenmalig; goedkoper/sneller dan Apple).
3. Op de pc: `npm run android:init` → keystore → `npm run android:build` → APK op telefoon (`native/android/BUILD.md`).
4. Listing + screenshots + data safety + privacy-URL in Play Console.  
5. Upload **AAB** → Internal testing → vrienden → productie.

---

## C — Apple App Store (wat “deploy” daar betekent)

Dit is **niet** “PWA in de App Store zetten”. Apple wil een getekende IPA met lokale content. Zie `native/ios/APPSTORE-CHECKLIST.md` voor de uitleg.

| # | Taak | Wie | Inhoudt |
|---|------|-----|---------|
| C1 | [Apple Developer Program](https://developer.apple.com/programs/) | **jij** | €99/jaar, Apple-ID, 2FA. Zonder dit bestaat de app niet bij Apple. |
| C2 | Mac + Xcode + team signing | **jij** | Certificates, provisioning. Cloud-agent heeft geen Mac. Nooit `.p12` committen. |
| C3 | Capacitor iOS, **bundled `www`** | **jij** op Mac | `npx cap add ios` + sync. Hosted-URL-only = 4.2-risico. Stubs: `native/ios/`. |
| C4 | Native extras (Guideline 4.2) | **jij** / later agent-hulp op Mac | Haptics + splash + landscape-lock. Minimaal dat, plus offline menu. `GUIDELINE-4.2.md`. |
| C5 | Listing + 1024-icon + iPhone/iPad shots | **jij** plakt | Drafts in `docs/store/`. `npm run store:shots` voor PNG’s. |
| C6 | App Privacy + review notes | **jij** | `privacy-nutrition-ios.md`, `review-notes.md`, privacy-URL. |
| C7 | TestFlight (internal) | **jij** | Archive → upload → testers. Eerst bewijzen: start, vecht, pauze, offline. |
| C8 | Submit for Review → release | **jij** | Apple speelt en mag afkeuren. Na goedkeuring zet jij de productieschakelaar. |

### Wat 4.2 inhoudt

Apple’s regel **4.2 Minimum Functionality** treft “website in een jasje”. Een TWA-achtige wrapper (alleen GitHub Pages openen) wordt vaak geweigerd. De store-build moet de game **mee-installeren** en iets doen wat Safari-PWA niet doet (trillen, splash, lock).

Gevolg: store-updates zijn **nieuwe IPA’s**, niet automatisch de laatste Pages-push.

### Wat de agent niet kan

- Je Apple-ID of €99
- Xcode Archive / TestFlight upload
- Review versnellen of “goedgekeurd” forceren

---

## Agents

- iOS-codegeneratie alleen als jij een Mac-pad start.
- Android-hulp: Bubblewrap/TWA, listing, Play Data Safety.
- Geen keystore-wachtwoorden, `.p12` of ASC API-keys committen.
