# App Store Guideline 4.2 — mitigation notes

**Goal:** Stickman Fighter must not read as “just a website wrapped in a WebView.”  
**Bundle ID:** `com.brennyz.stickmanfighter`

Apple’s **4.2 Minimum Functionality** targets thin wrappers. Mitigate by shipping native capabilities and a local content pack.

---

## Concrete extras to add (implementation later)

### Must-have before first review

1. **Haptics plugin**  
   - Capacitor: `@capacitor/haptics`  
   - Trigger on: light punch connect, heavy/KO, menu confirm, failed input  
   - Bridge from existing game feel hooks (no Safari-only vibration fallback as the *only* story)

2. **Offline asset pack**  
   - Use **Option B** (`webDir` → bundled `www`) for store builds  
   - Include: `index.html` / play shell, `game.js` (+ CSS), core `assets/` (buttons, scenery SVGs), essential SFX  
   - Document sync step: copy from Pages build or `npm run build` → `native/ios/www` → `npx cap sync ios`  
   - First launch should reach main menu **without** network

3. **Native shell polish**  
   - Landscape-only Info.plist orientations  
   - Capacitor splash screen (brand art, not blank WKWebView flash)  
   - Hide redundant browser chrome; no address bar

### Strongly recommended

4. **Game Center (optional but high signal)**  
   - Leaderboard: adventure best stage / clear time  
   - Achievement stubs: first boss, Nightmare unlock, etc.  
   - Even a minimal GameKit integration shows platform use beyond WKWebView

5. **Share sheet**  
   - Native share of canonical invite: `https://brennyz.github.io/stickman-fighter/speel.html`  
   - Never share `ipad.html` or tunnel URLs

### Later / optional

6. Local notification reminders (daily summons / missions) — no social chat  
7. Status-bar / safe-area plugin wiring for notched iPads/iPhones  
8. Controllers / Game Controller framework only if vs-mode needs it

---

## Review notes draft (for C6 / store-listing)

Suggested App Review notes bullets:

- This binary embeds the Stickman Fighter game assets locally (not a remote-only bookmark).  
- Native haptics fire on combat and UI confirmations.  
- [If GC enabled] Game Center leaderboards/achievements for adventure progress.  
- No user accounts; progress is on-device. Privacy policy: \<public https URL\>.  
- Landscape game; iPad supported.

---

## What does *not* fix 4.2 alone

- Pointing `server.url` at GitHub Pages with zero native APIs  
- PWA “Add to Home Screen” parity claims without IPA-local assets  
- Marketing screenshots of the website without a differentiated binary
