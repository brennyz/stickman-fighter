# Android Play shell — Stickman Fighter

**Store strategy:** Android / Google Play **first**. Apple is on hold (`STORE-LAUNCH.md`).

**Scope:** B1–B2 (Google Play wrapper scaffold). No game combat changes.

## B1 — Decision: **TWA (Bubblewrap)**

| Option | Verdict |
|--------|---------|
| **Trusted Web Activity + Bubblewrap** | **Chosen** |
| Capacitor Android | Defer (better when we need native plugins / iOS parity later) |

### Why TWA

1. Game already ships as a **PWA on GitHub Pages** — share URL  
   `https://brennyz.github.io/stickman-fighter/speel.html`.
2. TWA wraps that URL in a Chrome Custom Tab / Trusted Web Activity with almost **no native code** and no second JS runtime.
3. Updates go live via Pages (SW + `game.js`) without resubmitting every content tweak — only bump the Android wrapper when package/signing/Play policy requires it.
4. Capacitor would duplicate the web layer inside an APK and is the better fit for **Apple 4.2** / haptics later (`native/ios/`), not for the first Play listing.

### Start URL

TWA launches:

`https://brennyz.github.io/stickman-fighter/speel.html`

Players land on the share/install page (SPELEN → `index.html`), same as bookmarkShare.

---

## Package identity

| Field | Value |
|-------|-------|
| Application id | `com.brennyz.stickmanfighter` |
| App name | Stickman Fighter |
| Launcher label | Stickman |
| Orientation | landscape (matches `manifest.webmanifest`) |
| Min SDK | 21 (Bubblewrap default) |

---

## Icons

| Source (repo) | Use |
|---------------|-----|
| `icons/icon-192.png` | Web / small |
| `icons/icon-512.png` | Web + Bubblewrap `--icon` / maskable input |
| `icons/icon-180.png` | Apple touch (not used by Play) |

**Play densiteit:** Bubblewrap generates mipmaps from the 512×512 PNG. For store quality, replace with a **1024×1024** adaptive icon master before release (safe zone: keep stickman in the center ~66%).

Notes + checklist: [`icons/NOTES.md`](./icons/NOTES.md).

---

## Files in this folder

| Path | Purpose |
|------|---------|
| `twa-manifest.json` | Bubblewrap project config (checked in) |
| `signing/keystore.properties.example` | Signing placeholders — **no secrets** |
| `signing/.gitignore` | Ignore real keystores / properties |
| `assetlinks.json.example` | Digital Asset Links stub |
| `scripts/init-bubblewrap.sh` | Optional local init helper |
| `capacitor.config.stub.json` | Reference only — not the active path |

Generated Android Studio project (`app/`, `gradle/`, …) is **not** committed yet. Run Bubblewrap locally (below), then optionally commit the generated tree in a follow-up PR once signing is ready.

---

## Build locally (Bubblewrap)

### Prerequisites

- Node.js 18+ / npm  
- JDK 17+  
- Android SDK (command-line tools or Android Studio)  
- `ANDROID_HOME` set  

```bash
npm i -g @bubblewrap/cli
```

### First-time init (from repo root)

```bash
cd native/android
# Uses checked-in twa-manifest.json — do NOT paste keystore passwords into git
bubblewrap update   # or: ./scripts/init-bubblewrap.sh
bubblewrap build
```

If the directory is empty of Gradle sources, init once:

```bash
cd native/android
bubblewrap init --manifest=https://brennyz.github.io/stickman-fighter/manifest.webmanifest
# Then merge/overwrite with our twa-manifest.json fields (packageId, startUrl → speel.html)
bubblewrap build
```

Outputs (typical):

- `app-release-bundle.aab` → upload to Play Console  
- `app-release-signed.apk` → sideload smoke  

### Signing (placeholder only)

1. Copy `signing/keystore.properties.example` → `signing/keystore.properties` (gitignored).  
2. Create a **upload** keystore **outside** the repo (or under `signing/` which is gitignored for `*.jks` / `*.keystore`):

```bash
keytool -genkeypair -v -keystore signing/upload-keystore.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

3. Fill `storePassword` / `keyPassword` only in the local properties file — **never commit**.  
4. Play App Signing: upload the AAB; keep the upload key backup offline.

---

## Digital Asset Links (TWA verification)

Chrome verifies:

`https://brennyz.github.io/.well-known/assetlinks.json`

**Caveat — GitHub Pages project site:** files in *this* repo are served under  
`/stickman-fighter/…`, so a `.well-known/` here becomes  
`https://brennyz.github.io/stickman-fighter/.well-known/assetlinks.json`, which **does not** satisfy host-level DAL checks.

**Options before full TWA (no URL bar):**

1. Host `assetlinks.json` on the **user Pages apex** (`brennyz.github.io` root repo), or  
2. Put a **custom domain** on this project and serve `.well-known/assetlinks.json` there, or  
3. Ship first listing with Custom Tabs fallback (URL bar may show) until DAL is fixed.

Stub template: [`assetlinks.json.example`](./assetlinks.json.example) — replace `REPLACE_WITH_SHA256_FINGERPRINT` after you have the signing cert:

```bash
keytool -list -v -keystore signing/upload-keystore.jks -alias upload
```

---

## Capacitor (not chosen)

See `capacitor.config.stub.json` if we later need WebView + plugins. Prefer keeping Play on TWA until iOS shell needs shared Capacitor tooling.

---

## Out of scope here

- Play Console account / listing / IARC (B3–B6, human + store-listing)  
- Real keystores or passwords  
- iOS / Apple (see `native/ios/` when ios-shell lands)  
- Gameplay / `game.js` changes  
