# Store & livegang — Android first

**Beslissing (2026-08-07):** eerst **alleen Android** (PWA soft live → Google Play TWA).  
**Apple App Store: on hold** — geen Developer-account (€99) tot Play bewezen is.

**Live PWA:** https://brennyz.github.io/stickman-fighter/speel.html · **v1.18.138 / SW 348**  
**Privacy:** https://brennyz.github.io/stickman-fighter/privacy.html

---

## Status

| Pad | Focus? | Klaar? | Blockers |
|-----|--------|--------|----------|
| A. Soft live (PWA) | ja | ~95% | Jij: Android Chrome (+ evt. iPad) smoke |
| B. Google Play (TWA) | **nu** | ~40% | Play Console, signing keystore, AAB |
| C. Apple App Store | **nee / later** | stubs only | Account + 4.2 — niet starten |

`native/ios/` blijft als **toekomstige stub**; geen agent-werk aan iOS tot jij anders zegt.

---

## A — Soft live (delen zonder store)

| # | Taak | Status |
|---|------|--------|
| A1–A4, A7–A9 | Privacy, feel, versus uit, IP skills | **done** op main |
| A5 | Device QA — focus **Android Chrome** + “Add to Home Screen” | **jij** |
| A6 | “Verse versie” 1× op telefoon | **jij** |

Deel-link = `speel.html` (niet alleen `index.html`).

---

## B — Google Play (enige store-pad nu)

| # | Taak | Wie | Status |
|---|------|-----|--------|
| B1 | Pad: **TWA / Bubblewrap** → `speel.html` | — | **done** |
| B2 | Scaffold `native/android/` | — | **done** |
| B3 | [Play Console](https://play.google.com/console) account + app | **jij** | pending |
| B4 | Listing NL/EN uit `docs/store/listing-*.md` | **jij** upload | draft klaar |
| B5 | Screenshots: `npm run store:shots` | **jij** | script klaar |
| B6 | IARC / rating | **jij** | draft in `docs/store/content-rating-iarc.md` |
| B7 | Data safety | **jij** | draft in `docs/store/data-safety-play.md` |
| B8 | Privacy URL in Console | **jij** | `…/privacy.html` |
| B9 | Keystore lokaal + Bubblewrap → **APK** (test) + **AAB** (Play) | **jij** op PC | zie `native/android/BUILD.md` |
| B10 | Internal testing track → open testing → productie | **jij** | pending |

Package id (scaffold): `com.brennyz.stickmanfighter`

### Jouw Android-volgorde (kort)

1. Soft live op je Android: Pages-link → Chrome → toevoegen aan startscherm → 5 min avontuur + Verse versie.  
2. Play Console account (eenmalig, goedkoper/sneller dan Apple).  
3. Lokaal op PC: `npm run android:init` → keystore → `npm run android:build` → APK op telefoon testen (`native/android/BUILD.md`).  
4. Listing + screenshots + data safety + privacy-URL in Play Console.  
5. Upload **AAB** → Internal testing → vrienden → productie.

---

## C — Apple (bewust uitgesteld)

| # | Status |
|---|--------|
| C1 Developer €99 | **niet nu** |
| C2–C3 Capacitor stubs / 4.2 notes | al in repo als referentie — **geen verdere work** |
| C4–C6 nutrition / shots / review | drafts bestaan; pas gebruiken als/wanneer iOS start |

---

## Agents

- Geen iOS-agents starten tot expliciet gevraagd.  
- Android-hulp: Bubblewrap/TWA, listing, Play Data Safety — geen keystore-wachtwoorden committen.
