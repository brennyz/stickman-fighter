# Apple App Privacy (Nutrition Labels) — draft

**App:** Stickman Fighter (future Capacitor / native shell)  
**Policy URL:** `https://brennyz.github.io/stickman-fighter/privacy.html`  
**Draft date:** 2026-08-07 · agent soft-legal  
**Status:** draft — re-check when C2/C3 ship native bridges (haptics, Game Center, etc.)

---

## App Privacy questionnaire — suggested labels

### Data Used to Track You

**None.** Do not declare tracking. No advertising identifier use claimed; no cross-app tracking SDKs in the current web build.

### Data Linked to You

**None.** No account, no email collection in-app, no developer backend profile.

### Data Not Linked to You

Typically **none collected off-device**. Local gameplay save is not “collected” by the developer.

If App Store Connect forces a category for on-device-only storage, prefer declaring **no data collected**. If a future build writes diagnostics to Apple/Crash tools, add:

| Type | Purpose | Linked? | Used for Tracking? |
|------|---------|---------|-------------------|
| Crash Data (only if you add a crash reporter) | App Functionality | No | No |
| Performance Data (only if you add telemetry) | App Functionality | No | No |

**Do not** list Product Interaction / Gameplay as collected unless you send it off-device.

---

## Current product facts (web / PWA)

| Fact | Detail |
|------|--------|
| Save | `localStorage` on device |
| Account | None |
| Ads | None claimed |
| Analytics | None claimed in game build |
| Chat | None |
| Age hint | Cartoon combat violence · teens+ · no chat |

---

## When native shell lands (C2/C3)

Re-audit before submission:

1. Capacitor plugins (filesystem, haptics, push) — any new data types?
2. Game Center — may require “User ID” / Game Center under Identifiers (linked to you via Apple, not your servers).
3. Any third-party SDK → update this draft + `privacy.html`.

---

## Age Rating / content (cross-ref listing)

- Cartoon / fantasy violence (stick figures)
- No realistic gore
- No unrestricted web access required for core play (hosted game URL)
- No chat / user-generated messaging

Exact IARC/Apple questionnaire answers: see store-listing agent (B6).
