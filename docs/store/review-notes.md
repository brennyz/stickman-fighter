# App Review notes (Apple) + Play testing notes

Paste into App Store Connect → App Review Information → Notes.  
Also useful as the Play Console “notes for testers” blurb.

---

## Demo account

**Not applicable.** Stickman Fighter has **no login**, **no account creation**, and **no password**.

Reviewers can open the app and play immediately. Progress is stored on-device (localStorage); Settings include export/import if needed — not required for review.

---

## How to reach core gameplay (≤ 2 minutes)

1. Launch the app → main menu (hub).
2. Tap **Adventure** (or Avontuur) → pick **Level 1** (or lowest unlocked).
3. Optional **dice / gamble** screen: tap **Skip** (or equivalent) to start without a roll, **or** roll — see honesty note below.
4. Fight cartoon stickman vs monsters; touch buttons (or keyboard on Mac Catalyst / simulator).
5. Pause → Home returns to menu. Versus / Training also work without network.

Landscape orientation recommended (especially 2-player).

---

## Honesty: in-game dice (“gamble”)

The pre-level dice roll is **not** real-money gambling and **not** an IAP:

- No purchases, no ads tied to the roll.
- Outcome is a **run modifier** only (tougher boss chance or temporary ally/buff for that level).
- Player may **skip** and start the level.

Please do **not** treat this as Guideline 3.1.1 gambling or as a casino feature.

---

## What this app is / is not

| Is | Is not |
|----|--------|
| Offline-capable cartoon arena fighter | Online chat / social network |
| Local 1–2 player on one device | Account-gated online PvP |
| Free, no IAP in this build | Coin shop / battle pass |

---

## Contact

Use the developer email on the App Store Connect / Play Console account (owner: repo `brennyz/stickman-fighter`).  
Public soft-live URL (PWA reference): https://brennyz.github.io/stickman-fighter/speel.html

---

## Attachment / build tip

If reviewing a Capacitor/TWA wrapper: the game shell loads the same web game assets; no separate credentials. If a white screen appears, wait for first asset load or force-quit and relaunch once (service worker / cache warm-up on first launch).
