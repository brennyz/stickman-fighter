# Android APK / AAB — hoe we dit fixen

**Geen** random online “APK maker” (onveilig + Play weigert vaak).  
**Wel:** Google **Bubblewrap** = officiële wrapper die onze live PWA in een Android-app stopt (Trusted Web Activity).

```
PWA op GitHub Pages  →  Bubblewrap  →  .apk (test) + .aab (Play Store)
speel.html live         op jouw PC
```

Updates van het spel blijven via Pages (SW); de APK hoef je niet bij elke bugfix opnieuw te uploaden.

---

## Wat je krijgt

| Bestand | Waarvoor |
|---------|----------|
| `app-release-signed.apk` | Zelf installeren op je telefoon (USB / Drive) |
| `app-release-bundle.aab` | Upload naar **Play Console** |

Package: `com.brennyz.stickmanfighter` · start-URL:  
`https://brennyz.github.io/stickman-fighter/speel.html`

---

## Eenmalig op jouw PC (Windows/Mac/Linux)

### 1. Tools

- [Node.js 18+](https://nodejs.org/)  
- [JDK 17+](https://adoptium.net/) (Java)  
- [Android Studio](https://developer.android.com/studio) → SDK meenemen  
  Zet `ANDROID_HOME` (Studio → Settings → Android SDK pad).

```bash
npm i -g @bubblewrap/cli
```

### 2. Keystore (jouw geheime sleutel — **nooit** in git)

Vanuit de repo:

```bash
cd native/android
mkdir -p signing
keytool -genkeypair -v -keystore signing/upload-keystore.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Onthoud wachtwoorden. Kopieer daarna:

```bash
cp signing/keystore.properties.example signing/keystore.properties
# vul storePassword / keyPassword / keyAlias=upload / storeFile=...
```

`signing/*.jks` en `keystore.properties` staan in `.gitignore`.

### 3. Project genereren + bouwen

```bash
# vanuit repo-root:
npm run android:init
npm run android:build

# of handmatig:
cd native/android
./scripts/init-bubblewrap.sh
bubblewrap build
```

Eerste keer vraagt Bubblewrap om JDK/SDK-paden — volg de prompts.

**Output** (map `native/android/` of submap die Bubblewrap toont):

- `*.apk` → telefoon  
- `*.aab` → Play Console → Internal testing  

### 4. APK op telefoon zetten (smoke vóór Play)

1. Zet USB-debug aan, of stuur de APK via Drive.  
2. Installeer → open → moet `speel.html` laden.  
3. Speel 2 min avontuur.  
4. Als er een **URL-balk** bovenaan staat: dat is normaal tot Digital Asset Links klaar is (zie README) — voor Internal testing OK.

---

## Play Console (na succesvolle APK-smoke)

1. Account + app `Stickman Fighter`.  
2. Upload **AAB** (niet per se de APK).  
3. Listing uit `docs/store/listing-nl.md` / `listing-en.md`.  
4. Data safety uit `docs/store/data-safety-play.md`.  
5. Privacy: `https://brennyz.github.io/stickman-fighter/privacy.html`.  
6. Internal testing → testers → daarna productie.

---

## Waarom niet “APK maker”-sites?

- Uploaden van je game/URL naar derden = risico.  
- Vaak geen juiste signing → Play weigert.  
- Geen nette TWA / asset links.  
Bubblewrap is wat PWA→Play bedoeld is.

---

## Cloud-agent kan dit niet voor je tekenen

Geen Android SDK in de cloud-build → **jij** draait Bubblewrap lokaal (of op een PC met Studio).  
Agents houden `twa-manifest.json` + scripts bij; jij produceert de APK/AAB.

Zie ook: [`README.md`](./README.md) (Asset Links / signing details).
