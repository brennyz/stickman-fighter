# Google Play — Data safety form (draft)

**App:** Stickman Fighter (PWA / eventual Play wrapper)  
**Policy URL (after merge + Pages):** `https://brennyz.github.io/stickman-fighter/privacy.html`  
**Draft date:** 2026-08-07 · agent soft-legal  
**Status:** draft for Console — verify against live build before submit

---

## Overview answers

| Question | Suggested answer |
|----------|------------------|
| Does your app collect or share user data? | **No** — progress/settings stay on-device (`localStorage`). No account backend. |
| Is all user data encrypted in transit? | N/A if no collection; HTTPS hosting still applies for the web shell. |
| Can users request deletion? | Yes — in-app “Nieuwe start” clears local save; uninstall/clear site data also removes it. |

---

## Data types (Play Data safety categories)

Mark **Not collected** for account, location, personal info, financial, messages, photos, contacts, etc., unless a future native shell adds something new.

| Category | Collected? | Shared? | Notes |
|----------|------------|---------|-------|
| App activity (gameplay) | No (not off-device) | No | Local save only |
| App info & performance | No | No | No crash SDK claimed |
| Device or other IDs | No | No | No advertising ID use claimed |
| Location | No | No | — |
| Personal info / account | No | No | No login |
| Messages / chat | No | No | No chat feature |
| Photos / files | No* | No | *User may pick a JSON file for **import**; file stays local unless they share export |

Optional: if Play asks about “files and docs” for the import picker, describe as **ephemeral, user-initiated, not uploaded to developer**.

---

## Security practices (checkboxes)

- [x] Data is encrypted in transit (HTTPS for hosted PWA / TWA)
- [ ] Users can request data deletion — **yes via local clear**; no server copy to delete
- [x] Committed to following Play Families / content policies as applicable (cartoon combat; teens+)

---

## Privacy policy

Must be a **public https** URL. After soft-legal merge:

`https://brennyz.github.io/stickman-fighter/privacy.html`

Store listing B8 depends on this URL staying live.

---

## Reviewer notes (optional Console text)

> Stickman Fighter is a local PWA fighting game. Save data is stored only in the device browser localStorage. There is no user account, no cloud sync, no ads SDK, and no chat. Contact: bzijffers@gmail.com
