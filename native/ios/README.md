# Stickman Fighter — Capacitor iOS shell (prep)

**Scope:** App Store shell scaffolding only (C2–C3). No certificates, provisioning profiles, or secrets in this repo.  
**Bundle ID (suggested):** `com.brennyz.stickmanfighter`  
**App display name:** Stickman Fighter  
**Web source today:** GitHub Pages PWA — https://brennyz.github.io/stickman-fighter/

This folder is a **docs + config stub**. It does not contain a generated Xcode project yet. When Apple Developer Program (C1) is ready, generate the real iOS project on a Mac with Xcode.

---

## Two wrap options

Document both; pick one before first TestFlight build.

### Option A — Hosted URL (server load)

Capacitor loads the live PWA over HTTPS (`server.url`). Fast to iterate; always matches Pages. Weaker for App Review **Guideline 4.2** if the binary is “just a browser chrome” around a website — mitigate with native extras (see below) and prefer shipping a local asset pack for store builds.

| Pros | Cons |
|------|------|
| No `www` copy / sync step | Needs network at launch |
| Instant content updates | Looks more like a thin web wrapper to review |
| Same URL as soft-live PWA | ATS / domain allowlist must include Pages host |

Config stub: see `capacitor.config.example.ts` → **hosted** block, and `capacitor.config.hosted.example.json`.

### Option B — Local `www` copy (bundled WebView)

Copy (or build-copy) the PWA into `native/ios/www` (or repo-root `www`) and set `webDir`. Offline-capable shell; stronger App Store story when paired with haptics + offline asset pack.

| Pros | Cons |
|------|------|
| Works offline after install | Must sync `www` on each release |
| Clearer “native app” packaging | Larger IPA |
| Better 4.2 posture with local assets | Two deploy pipelines (Pages + store) |

Config stub: see `capacitor.config.example.ts` → **www** block, and `capacitor.config.www.example.json`.

**Recommendation for first store submit:** Option B (bundled `www`) + native extras from the 4.2 list. Keep Option A for internal debug builds only.

---

## Suggested Capacitor bootstrap (Mac, later)

No secrets. Run only on a machine with Xcode + Apple ID.

```bash
# from repo root (after Node deps exist)
npm install @capacitor/core @capacitor/cli @capacitor/ios --save-dev
# copy chosen stub → capacitor.config.ts at repo root (or keep under native/ios and point CLI)
npx cap init "Stickman Fighter" com.brennyz.stickmanfighter
# set webDir or server.url per chosen option, then:
npx cap add ios
npx cap sync ios
npx cap open ios
```

Signing: use Xcode → Signing & Capabilities with your team. **Never** commit `.p12`, provisioning profiles, or App Store Connect API keys.

---

## Bundle / project constants

| Key | Value |
|-----|--------|
| Bundle identifier | `com.brennyz.stickmanfighter` |
| Product name | Stickman Fighter |
| Orientation | Landscape (match game) |
| Min iOS | 15+ (align with Capacitor default of the day) |
| Privacy policy URL | Public https (depends on soft-legal A1) |

---

## Guideline 4.2 mitigation — native extras (add later)

Apple rejects many “website in a WebView” apps under **4.2 Minimum Functionality**. Plan concrete native value beyond the PWA chrome:

| # | Extra | Plugin / approach | Why it helps review |
|---|--------|-------------------|---------------------|
| 1 | **Haptics** | `@capacitor/haptics` (or thin Swift bridge) — punch / hit / KO / UI confirm | Device-only feedback the Safari PWA does not match |
| 2 | **Offline asset pack** | Bundled `www` + critical `assets/` (SVG, audio stubs) in the IPA; SW optional inside WebView | App usable without network; not “open a URL” |
| 3 | **Game Center (optional)** | GameKit leaderboards / achievements for adventure clears, Ketsbam scores | Platform integration unique to iOS |
| 4 | **Native splash + landscape lock** | Capacitor splash + `UISupportedInterfaceOrientations` landscape | Proper App Store binary polish |
| 5 | **Status bar / safe-area bridge** | `@capacitor/status-bar` + CSS env(safe-area-inset-*) | Notch/home-indicator aware shell |
| 6 | **Push / local reminders (optional, later)** | Local notifications for daily summon / mission reset — **no** chat | Recurring native engagement |
| 7 | **Share sheet** | `@capacitor/share` for `speel.html` invite link | Native share vs in-page copy only |

Ship **at least** (1)+(2)+(4) before first review submit. (3) and (6) are optional stretch.

Detail notes: [`GUIDELINE-4.2.md`](./GUIDELINE-4.2.md).

---

## Out of scope (this agent)

- Real Apple certificates, provisioning, App Store Connect uploads  
- Android / Play shell (`native/android/` → play-shell agent)  
- Combat / `game.js` changes  
- Force-push or secrets in git  

---

## Files in this folder

| File | Purpose |
|------|---------|
| `README.md` | This guide |
| `GUIDELINE-4.2.md` | 4.2 checklist for review notes |
| `capacitor.config.example.ts` | TS stub: hosted vs www |
| `capacitor.config.hosted.example.json` | JSON example — Option A |
| `capacitor.config.www.example.json` | JSON example — Option B |
| `www/.gitkeep` | Placeholder for future bundled web copy |

When generating the real project, Capacitor will create `ios/` (Xcode). Prefer keeping generated `ios/` either gitignored until first green build, or committed without secrets — team choice.
