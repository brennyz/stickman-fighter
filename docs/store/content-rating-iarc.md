# IARC / content rating — draft answers

Draft questionnaire answers for Google Play (IARC) and Apple age rating.  
**Not submitted yet** — human fills Play Console / App Store Connect with these.

Game: **Stickman Fighter** — cartoon stickman arena fighter.  
No accounts, no user chat, no real-money gambling, no IAP.

---

## Expected band (estimate only)

| System | Likely band | Why |
|--------|-------------|-----|
| IARC / Play | **PEGI 7** / **ESRB Everyone 10+** (or similar) | Cartoon violence vs monsters; no blood/gore |
| Apple | **9+** (Infrequent/Mild Cartoon or Fantasy Violence) | Same |

Do **not** publish a hard claim in store copy until the questionnaire returns an official rating.

---

## Violence / combat

| Question (paraphrased) | Draft answer | Notes for reviewer |
|------------------------|--------------|--------------------|
| Does the app contain violence? | **Yes** | Stick-figure combat vs cartoon monsters/bosses |
| Realistic or graphic violence? | **No** | Stickmen, no blood, no dismemberment realism |
| Cartoon / fantasy violence? | **Yes** | Primary content |
| Violence toward humans / animals depicted realistically? | **No** | Abstract stick figures + stylized creatures |
| Sexual violence / torture? | **No** | — |
| Mild fantasy weapons (sword, energy orbs)? | **Yes** | Arena fighter skills |

---

## User interaction / social

| Question | Draft answer | Notes |
|----------|--------------|-------|
| Users can communicate with each other? | **No** | No chat, no voice, no text messaging |
| Users can share location? | **No** | — |
| Users can share personal info publicly? | **No** | — |
| Online multiplayer with strangers? | **No** | Local 2-player on one device only |
| User-generated content moderated? | **N/A** | No UGC feeds |

---

## Gambling / simulated gambling

| Question | Draft answer | Honest detail |
|----------|--------------|---------------|
| Real-money gambling / casino? | **No** | No stakes, no cash-out, no store of value for money |
| Simulated gambling (cards, slots, dice that look like casino)? | **Disclose carefully** | See below |
| Loot boxes purchasable with real money? | **No** | No IAP at all |
| In-game currency bought with real money? | **No** | Coins/shards earned in play only |

### In-game “gamble dice” (must describe honestly)

Before some **Adventure** levels the player can roll **two dice** (or skip):

- **Bad luck:** a tougher “super-boss” may appear in a random wave of that run.
- **Good luck:** a temporary ally/buff for **that level only**.

This is **cosmetic/loot-style run variance**, not a wager:

- Costs **no real money** and **no premium currency purchase**.
- No payouts, no leaderboard cash, no trading for money.
- Optional — player can skip and start the level normally.

For IARC “simulated gambling” items: if the form asks whether players can wager virtual items for a chance at reward, answer **No** (dice do not wager inventory; they only set a run modifier). If the form asks about “game of chance” aesthetics (dice), note **Yes — cosmetic dice UI for run modifiers only; no monetization**. Prefer the more precise option when both exist.

---

## Other common IARC buckets

| Topic | Answer |
|-------|--------|
| Sexual content / nudity | **No** |
| Profanity / crude humor | **No** (keep store listing clean; in-game names may be playful) |
| Drugs / alcohol / tobacco | **No** |
| Horror / fear themes | **Mild at most** (boss intimidation text; not horror game) |
| Discrimination / hate | **No** |
| Paid / unrestricted web access | **No** (game content only; no open browser) |
| In-app purchases | **No** |
| Ads | **No** (confirm before submit if ad SDK is ever added) |
| Account required | **No** |
| Collects personal info beyond device save | **No** — localStorage save; see privacy / data-safety drafts |

---

## Age gate copy (soft live / install hint)

Suggested short line for install/README (NL/EN):

- NL: *Cartoon-vechtspel met stickmen. Geen chat, geen echt-geld gokken. Geschikt vanaf ±7–9 jaar (officiële rating volgt).*
- EN: *Cartoon stickman fighter. No chat, no real-money gambling. Aimed at ages ~7–9+ (official rating TBD).*

---

## Checklist before human submits

1. Confirm still **no IAP / no ads** in the build being rated.  
2. Privacy URL live (`privacy.html` — soft-legal A1).  
3. Screenshots show cartoon combat only (no gore).  
4. Review notes mention dice are not real-money gambling (`review-notes.md`).
