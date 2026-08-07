# Store & livegang — verdeelbord

**Doel:** Stickman Fighter klaar maken voor (1) soft live als PWA, daarna (2) Google Play, (3) Apple App Store.  
**Huidige build:** PWA op GitHub Pages · **v1.18.138 / SW 348** (na soft-live merge) · geen native `.ipa`/APK in repo.  
**Share:** https://brennyz.github.io/stickman-fighter/speel.html  
**Privacy:** https://brennyz.github.io/stickman-fighter/privacy.html (na Pages deploy)

---

## Status in één oogopslag

| Pad | Klaar? | Blockers |
|-----|--------|----------|
| A. Soft live (PWA delen) | ~95% | Human device QA (A5/A6) |
| B. Google Play | ~40% | Play Console account, signing, AAB upload |
| C. Apple App Store | ~25% | Apple Developer €99, real Capacitor build, 4.2 extras |

---

## Lijst A — Soft live (PWA) — eerst

| # | Taak | Owner / agent | Status |
|---|------|---------------|--------|
| A1 | Privacy policy pagina (`privacy.html`) + link in settings/menu | cloud: soft-legal | **done** (merged) |
| A2 | Content/leeftijd hint (geweld stickmen, geen chat) in install + README | cloud: soft-legal | **done** |
| A3 | Adventure onboarding: milder wave 1 OF duidelijkere telegraphs | cloud: soft-feel | **done** |
| A4 | Checkpoint “loop rechts” cue sterker (touch + KB) | cloud: soft-feel | **done** |
| A5 | Echte device QA checklist (iPhone Safari, Android Chrome, iPad) | human + notes | notes done · **human smoke open** |
| A6 | “Verse versie” / SW update flow 1× op echt device verifiëren | human | **pending** |
| A7 | Deel-link + install copy NL/EN kloppend houden | cloud: soft-legal | **done** |
| A8 | Local versus retired (IP + unfinished local 2P) | cloud: versus-retire | **done** |
| A9 | Anime skill names → generic techniques | cloud: IP-A | **done** |

---

## Lijst B — Google Play

| # | Taak | Owner / agent | Status |
|---|------|---------------|--------|
| B1 | Kies pad: **TWA (Bubblewrap)** | cloud: play-shell | **done** (docs) |
| B2 | Scaffold Android wrapper (package id, icons, signing placeholder) | cloud: play-shell | **done** (docs) |
| B3 | Play Console account + app aanmaken | human | pending |
| B4 | Store listing NL/EN (korte/lange beschrijving, tags) | cloud: store-listing | **done** (drafts) |
| B5 | Screenshots script (phone + tablet landscape) | cloud: store-listing | **done** (script) |
| B6 | IARC / content rating questionnaire antwoorden (draft) | cloud: store-listing | **done** (draft) |
| B7 | Data safety form draft (localStorage save, geen account) | cloud: soft-legal | **done** |
| B8 | Privacy policy URL (publiek https) | Pages na merge | **pending deploy** |

---

## Lijst C — Apple App Store

| # | Taak | Owner / agent | Status |
|---|------|---------------|--------|
| C1 | Apple Developer Program (€99/jaar) | human | pending |
| C2 | Capacitor iOS shell + bundle id | cloud: ios-shell | **done** (stubs) |
| C3 | Guideline **4.2** mitigatie notes | cloud: ios-shell | **done** (notes) |
| C4 | Privacy Nutrition Labels draft | cloud: soft-legal | **done** |
| C5 | Screenshots iPhone + iPad landscape | cloud: store-listing | **done** (script) |
| C6 | Review notes + demo account (n.v.t. als geen login) | cloud: store-listing | **done** (draft) |

---

## Human (jij) — niet door agents

1. Play Console + Apple Developer accounts.
2. Echte iPhone / Android / iPad smoke (A5, A6) + Verse versie.
3. Signing keys / certificaten buiten git.
4. Optioneel: IP-B dawnblade (#240) als `master_sword` easter-egg nog weg moet.

---

## Aanbevolen volgorde (nu)

1. Soft live: **device QA** op Pages na deploy.  
2. Play: Bubblewrap AAB + Console listing uit `docs/store/`.  
3. iOS: Capacitor build + 4.2 extras als Developer account klaar.
