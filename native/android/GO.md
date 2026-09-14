# Android GO — jij bouwt de Play-app

De website blijft het spel. **GO voor Android** = een icoon in de Play Store dat diezelfde site opent (TWA).

Deze cloud kan **geen** APK tekenen en **geen** Play-account aanmaken. Jij doet dit op de **pc**.

```bash
npm run android:go
```

---

## Wat het inhoudt (kort)

| | |
|--|--|
| Eenmalig geld | **US$25** Play Console (geen jaarlijkse Apple-factuur) |
| Nieuwe persoonlijke accounts | **Closed test**: minstens **12 testers**, **14 dagen** achter elkaar, daarna pas productie aanvragen |
| Updates van het spel | blijven via GitHub Pages — niet bij elke bugfix een nieuwe AAB |
| Eerste APK | mag nog een URL-balk tonen tot Digital Asset Links op `brennyz.github.io` staan |

Gratis app, geen IAP → Google neemt geen cut op aankopen.

---

## Jouw volgorde

### 0. Telefoon (5 min)

https://brennyz.github.io/stickman-fighter/speel.html → Chrome → startscherm → avontuur.  
Checklist: `docs/store/device-qa.md`.

### 1. Play Console-account

https://play.google.com/console — Google-account + 2FA + **geen prepaid-kaart**.  
Developer-naam (publiek) + support-e-mail. Identiteit als Google die vraagt.

### 2. Tools op de pc

- Node 18+
- JDK 17+
- Android Studio (SDK) + `ANDROID_HOME`
- `npm i -g @bubblewrap/cli`

### 3. Keystore (één keer, backup offline)

Zie `BUILD.md`. **Nooit** `.jks` of wachtwoorden in git.

```bash
cd native/android
mkdir -p signing
keytool -genkeypair -v -keystore signing/upload-keystore.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
cp signing/keystore.properties.example signing/keystore.properties
# wachtwoorden alleen in dat lokale bestand
```

### 4. APK + AAB

```bash
# repo-root
npm run android:init
npm run android:build
```

- `*.apk` → zelf op de telefoon (USB / Drive) — 2 min avontuur  
- `*.aab` → Play Console

### 5. Listing plakken

| Veld | Bestand |
|------|---------|
| Tekst NL/EN | `docs/store/listing-nl.md` / `listing-en.md` |
| Privacy | https://brennyz.github.io/stickman-fighter/privacy.html |
| Data safety | `docs/store/data-safety-play.md` |
| IARC | `docs/store/content-rating-iarc.md` (jij klikt de vragen) |
| Shots | `npm run store:shots` → `docs/store/screenshots/` |
| Feature graphic 1024×500 | `npm run store:feature` |

Stappen in de Console: `docs/store/play-console-stappen.md`.

### 6. Closed testing (niet meteen “iedereen”)

1. Upload AAB → **Closed testing**.  
2. Nodig **12 mensen** uit (Google-account, testers-link).  
3. Zij moeten **opt-in** en de app openen.  
4. **14 dagen** wachten → daarna “Apply for production”.

Internal testing (vrienden, weinig mensen) mag eerst om de AAB te voelen. Productie eist de closed-testregel.

### 7. URL-balk (later)

Zonder `assetlinks.json` op de **apex** `https://brennyz.github.io/.well-known/assetlinks.json` blijft Chrome soms een balk tonen. Voor de closed test is dat OK. Fingerprint ná keystore: `BUILD.md` + `assetlinks.json.example`. Dit repo alleen kan die apex-file niet hosten (Pages zit onder `/stickman-fighter/`).

---

## Wat de agent niet doet

Play-inloggen, $25 betalen, keystore bewaren, AAB uploaden, testers mailen.

Meer detail: [`BUILD.md`](./BUILD.md) · [`README.md`](./README.md).
