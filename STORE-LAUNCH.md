# Store & livegang — verdeelbord

**Doel:** Stickman Fighter klaar maken voor (1) soft live als PWA, daarna (2) Google Play, (3) Apple App Store.  
**Huidige build:** PWA op GitHub Pages · v1.18.133 / SW 343 · geen native `.ipa`/APK in repo.  
**Share:** https://brennyz.github.io/stickman-fighter/speel.html

---

## Status in één oogopslag

| Pad | Klaar? | Blockers |
|-----|--------|----------|
| A. Soft live (PWA delen) | ~85% | Echte device QA, onboarding (privacy A1 done on soft-legal) |
| B. Google Play | ~10% | TWA/Capacitor, Play Console, listing, rating |
| C. Apple App Store | ~5% | Developer account, native shell, Guideline 4.2 |

---

## Lijst A — Soft live (PWA) — eerst

| # | Taak | Owner / agent | Status |
|---|------|---------------|--------|
| A1 | Privacy policy pagina (`privacy.html`) + link in settings/menu | cloud: soft-legal | done |
| A2 | Content/leeftijd hint (geweld stickmen, geen chat) in install + README | cloud: soft-legal | done |
| A3 | Adventure onboarding: milder wave 1 OF duidelijkere telegraphs | cloud: soft-feel | pending |
| A4 | Checkpoint “loop rechts” cue sterker (touch + KB) | cloud: soft-feel | pending |
| A5 | Echte device QA checklist (iPhone Safari, Android Chrome, iPad) | human + cloud: soft-feel notes | pending |
| A6 | “Verse versie” / SW update flow 1× op echt device verifiëren | human | pending |
| A7 | Deel-link + install copy NL/EN kloppend houden | cloud: soft-legal | done |

---

## Lijst B — Google Play

| # | Taak | Owner / agent | Status |
|---|------|---------------|--------|
| B1 | Kies pad: **TWA (Bubblewrap)** vs **Capacitor Android** | cloud: play-shell | pending |
| B2 | Scaffold Android wrapper (package id, icons, signing placeholder) | cloud: play-shell | pending |
| B3 | Play Console account + app aanmaken | human | pending |
| B4 | Store listing NL/EN (korte/lange beschrijving, tags) | cloud: store-listing | pending |
| B5 | Screenshots script (phone + tablet landscape) | cloud: store-listing | pending |
| B6 | IARC / content rating questionnaire antwoorden (draft) | cloud: store-listing | pending |
| B7 | Data safety form draft (localStorage save, geen account) | cloud: soft-legal | done (`docs/store/data-safety-play.md`) |
| B8 | Privacy policy URL (moet publiek https zijn) | hangt van A1 merge → Pages | pending (URL ready: `…/privacy.html`) |

---

## Lijst C — Apple App Store

| # | Taak | Owner / agent | Status |
|---|------|---------------|--------|
| C1 | Apple Developer Program (€99/jaar) | human | pending |
| C2 | Capacitor iOS shell + bundle id | cloud: ios-shell | pending |
| C3 | Guideline **4.2** mitigatie: native extras (haptics bridge, Game Center later, offline pack) | cloud: ios-shell | pending |
| C4 | Privacy Nutrition Labels draft | cloud: soft-legal | done (`docs/store/privacy-nutrition-ios.md`) |
| C5 | Screenshots iPhone + iPad landscape | cloud: store-listing | pending |
| C6 | Review notes + demo account (n.v.t. als geen login) | cloud: store-listing | pending |

---

## Cloud-agent verdeling (deze ronde)

| Agent codenaam | Branch prefix | Scope (alleen dit) |
|----------------|---------------|--------------------|
| **soft-legal** | `cursor/store-soft-legal-2125` | A1, A2, A7, B7, C4 — privacy.html, settings-link, data-safety/nutrition drafts in `docs/store/` |
| **soft-feel** | `cursor/store-soft-feel-2125` | A3, A4 (+ korte A5 notes) — adventure feel/onboarding, geen store wrappers |
| **play-shell** | `cursor/store-play-shell-2125` | B1–B2 — Android TWA of Capacitor scaffold + README in `native/android/` |
| **ios-shell** | `cursor/store-ios-shell-2125` | C2–C3 — Capacitor iOS scaffold + 4.2 notes in `native/ios/` |
| **store-listing** | `cursor/store-listing-2125` | B4–B6, C5–C6 — listing copy + screenshot script in `docs/store/` |

**Regels voor agents**
- Eigen feature branch `cursor/<name>-2125`, PR naar `main`, **geen** force-push.
- Geen geheimen (keystore passwords, API keys) committen.
- Versie alleen bumpen als runtime game.js/sw wijzigt (feel-agent); docs-only = geen SW bump verplicht.
- Na afloop: status in dit bestand of PR-body updaten (`pending` → `done` / `blocked`).

---

## Human (jij) — niet door agents

1. Play Console + Apple Developer accounts.
2. Echte iPhone / Android / iPad smoke (A5, A6).
3. Beslissing: eerst alleen PWA soft live, of meteen Play TWA.
4. Signing keys / certificaten buiten git bewaren.

---

## Aanbevolen volgorde

1. **soft-legal** + **soft-feel** parallel (soft live).  
2. **store-listing** parallel (teksten/screenshots).  
3. **play-shell** daarna (Android eerst — makkelijker dan iOS).  
4. **ios-shell** als Play-pad bewezen is + Developer account klaar.
