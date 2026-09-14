# Stickman Fighter — FOMO / retention gap package

**Audience:** designer + coder who will implement loops (not this PR).  
**Audit base:** LIVE `v1.18.163` / SW `v373` (`origin/main` @ 2026-09-14).  
**Play:** Android-first PWA/TWA · [speel.html](https://brennyz.github.io/stickman-fighter/speel.html) · **no Versus**.  
**Out of this package:** full gear/cosmetics (other agents) · audio themes · home-screen **widget**.

Read this as two voices:

| Voice | Question |
|-------|----------|
| **Player (Mats on a phone)** | Why open the game *today*? What do I lose if I skip? What do I almost have? |
| **Maker (Brendon)** | Which hook is cheap, free-to-play honest, and does not break combat or the store “no IAP / no casino” line? |

**FOMO here means time + progress, never money.** No IAP. Dice-before-level stays a run-variance roll (already declared cosmetic in store copy). Chest pulls stay daily-quota, not paid.

---

## How to execute

1. Ship **P0** in one PR (ritual + clock + pity). That is the retention spine.  
2. Add **P1** loops as separate PRs (weekly, daily shard, NM sneak).  
3. Park **P2–P3** until P0 is live for a week of play.  
4. Touch **`src/` + rebuild `game.js`**, never edit the bundle by hand.  
5. Follow `IMPROVEMENT.md` gameplay-safe checklist (no global dmg/HP bombs, no nuclear CSS, Versus stays retired).  
6. i18n: NL first, then EN. No raw key leaks.

---

## Priority board (ship order)

| ID | Pri | Loop | Why first | Size |
|----|-----|------|-----------|------|
| **F0** | P0 | Local-midnight clock | Timer on missions **lies** vs UTC reset — players miss or waste quota | S |
| **F1** | P0 | First-open daily ritual | Summons / missions / egg exist but do not *meet* the player | M |
| **F2** | P0 | Chest pity + no-junk | 10 pulls often feel empty; “better summons” starts here | M |
| **F3** | P0 | True consecutive streak | `dailyBonusCount` is lifetime, not a streak — no “don’t break it” | S–M |
| **F4** | P1 | Weekly hunt + 3★ box | Nothing lives longer than 24h except the Lv70 cliff | M |
| **F5** | P1 | Daily guaranteed shard | Upgrades are RNG; mid-game has no “today I grew” | S |
| **F6** | P1 | Nightmare sneak (Lv 50+) | Endgame loot is locked behind clearing Normal 70 | M |
| **F7** | P1 | Weekly featured chest banner | Summon screen is a quota, not a *want* | S |
| **F8** | P2 | Comeback pack (2+ days) | No “welcome back” — lapse = silence | S |
| **F9** | P2 | Arcade first-run stamp | Training / Wall / Mats have no daily reason | S |
| **F10** | P2 | Island 3★ weekly chest | Stars are HUD vanity | S |
| **F11** | P3 | Android local reminder (TWA) | Widget skipped; native ping is later | M · native |
| **F12** | P3 | 14-day biome hunt | Dex is huge but has no season | M |
| **F13** | P3 | Share 3★ card | Social FOMO without Versus | S |

Do **not** re-enable combat summon-ascend, Dawnblade, or Tide Battle as FOMO. Those are `return false` / chance `0` because they crashed or froze runs.

---

## Player journey (what it feels like now)

### Session 1 (new phone)

Hub shows Avontuur / Arcade / Collectie / **Summons 10×**. Missions live in the **dock**, not the tile grid. Daily egg is inside Pets. After ten chest pulls many results are coins, XP, or “roestig schroot”. Weapons still unlock mainly by **character level**. Combat ✦-ascend is off. Player can leave thinking summons are a sideshow.

### Day 2–3

Missions and the chest reset. Unused pulls from yesterday are **gone** (fresh 10, no bank). The missions subtitle can say “streak 3/7” but missing a day does **not** reset anything — it is a lifetime counter toward achievement `daily7`. Egg says “morgen weer”. No weekly goal. If the player only plays Avontuur, a Wall or Training daily can sit unfinished.

### Mid-game (fighter Lv 12–40, islands 2–4)

Power comes from level unlocks (weapons, skills, supers, styles), shard RNG, and dex kills for pets. Nothing says “log in before tonight.” 3★ is a HP% badge with **no chest**. Island 6–7 weapons exist in the roster but are invisible as *drops* until Nightmare/Hell diffs.

### The cliff (Normal Lv 70)

Clearing Normal 70 unlocks **Nightmare 2.0**. Clearing that 70 unlocks **Hell 3.0**. ~27 zone weapons (`dropZone`) only roll in those diffs (Normal only guarantees a zone drop on island bosses 60/70). A player who stalls at 40–60 has no weekly taste of that loot. That is the biggest **progression FOMO hole**: the carrot is real, the path is a wall.

### Android habit

PWA/TWA. No widget (this cycle). No local notification. Close the tab = the game cannot tap the shoulder. Retention must happen **inside the first 10 seconds of the next open**.

---

## Current systems (code truth)

### Daily chest summons — `src/data/chest-summons.js`

| Rule | Live value |
|------|------------|
| Quota | `CHEST_DAILY_TOTAL = 10` random (weapon **or** pet), reset when `save.chestDaily.date !== todayKey()` |
| Jackpot | `CHEST_NICE_CHANCE = 0.14` |
| Mid unlock on miss | `CHEST_GOOD_CHANCE = 0.30` |
| Pity | **None** |
| Bank unused | **No** — leftover `left` dies at date change |
| Early weapon | `save.chestWeapons[id]` bypasses level unlock (`weaponUnlockedByLevel`) |
| Ascend | Nice weapon path may write `save.summons[id] = epic\|legendary` if already unlocked |
| Pet | Tames `PET_ROSTER` or `hatchEggPet('chest')` |
| Consolation | 45% pet coins 8–23 · 35% XP 22–55 · 20% junk text |
| Flavor “skills” | `CHEST_*_SKILLS` strings only — **not** real combat mods |
| Combat kill-ascend | `rollSummonChance()` → **`false`** (`src/data/summons.js`) |
| Dawnblade | `DAWNBLADE_CHANCE = 0` |

Hub tile pulses `has-summons` while `left > 0`. Screen copy: `Vandaag: N/10`. After empty: `Op · morgen weer`.

### Daily missions — `src/systems/missions.js`

- Pool of **8**, hashed pick of **3** per UTC date.  
- Types: 12 kills · 1 adv win · 35 wall bricks · 1 train win · combo ×5 · 3 finishers · 3 pickups · 1 boss.  
- XP ~30–60 each + **+80** day bonus if all three claimed.  
- Potential ~170–255 XP/day vs `xpNeed` ≈ 70 @Lv1 … ~1.5k+ late.  
- `dailyBonusCount` increments on day-bonus claim — **not** consecutive.  
- `dailyResetCountdown()` uses **local** `setHours(24,0,0,0)`.  
- `todayKey()` uses **`toISOString().slice(0,10)` = UTC**.  
- Dock alert when claimable; no first-open sheet.

### Daily egg — `src/data/egg-pets.js`

- 12 cosmetic eggs, weighted (mythic 1).  
- 1 free crack/day + 1 bonus on first adventure **win** if collection incomplete.  
- Duplicate = +10 XP. Buried under Collectie → Pets.

### Upgrades / loot in-run — `src/data/upgrades.js`, `skills.js`, `weapons.js`, `game.js`

| Drop | Chance (Normal) | Note |
|------|-----------------|------|
| Skill shard | ~10% / 28% elite / 55% super | Weighted to active technique |
| Item shard (weapon/pet/style) | ~7% / 18% elite / 42% super | Must already **own** the track |
| Zone weapon | ~4.5% / higher elite; × `dropMul` | Only if `adventureDropZoneForLevel` + not owned |
| Zone boss guarantee | Island boss on NM/Hell; Normal only Lv 60/70 | |
| Egg bonus | First adv win / day | Cosmetic |

Nightmare `dropMul 1.42` · Hell `1.8`. Upgrade caps: standard Lv3, mythic/extreme Lv5, Spiral Orb Lv8. Costs `[2,4,7,12,20]` items / `[3,5,8,…]` skills.

### Pets — `src/data/pets.js`

12 dex pets. Tame by kill thresholds (12–75 by rarity) **or** pet coins (Mats: 2 gold → 1 PC) **or** chest. Passives grow with dex kills / 25.

### Progression skeleton — `src/core/storage.js`

- Adventure **70** levels × **7** islands (10 each). Weapon caps `[10,20,30,40,48,60,70]`.  
- Diffs: Normal → Nightmare 2.0 (need `advCleared.normal`) → Hell 3.0 (need NM clear).  
- Stars: 3★ if HP > 72%, 2★ > 38%, 1★ = win. Stored, **no payout**.  
- Master buff after 5 fails on a level (+20% until win) — anti-frustration, not FOMO.  
- `lastPlay` features a hub tile (“LAATST”) — resume, not ritual.

### Also present (not daily FOMO)

Achievements (~24, one-shot) · weapon mastery tiers (3/10/25 finishers) · styles / supers / skills by fighter level or dex/train · island SATAN after a diff clear · stage dice (run-only) · Arcade records (wall / train / Mats).

### Explicitly off (do not use for FOMO)

| System | State | Why |
|--------|-------|-----|
| Combat summon ascend | `rollSummonChance` false | Mid-combo run breaks |
| Dawnblade / Master Sword | chance 0 | Sudden run-breaks |
| Tide Battle | `TIDE_BATTLE_CHANCE = 0` | Interrupt broke adventure |
| Versus | Retired | Android-first; no social ladder |
| Widget | Skipped this cycle | — |
| IAP / paid pity | Forbidden | Store + IARC: no real-money loot |

---

## Gaps (maker + player)

| Gap | Player feel | Maker note |
|-----|-------------|------------|
| **Clock split** | “Resets in 2h” then quota already gone (UTC) | Fix before any new timer UI |
| **Ritual scatter** | Must tap Summons + dock Missies + Pets | One sheet, one breath |
| **Empty pulls** | Junk after a 10s video | Pity + always-useful consolation |
| **Fake streak** | “3/7” still grows if you skip a week | Consecutive or don’t call it streak |
| **24h-only horizon** | Nothing to plan for Saturday | Weekly hunt |
| **Upgrade RNG** | Can play a night and get 0 shards | First win = 1 shard |
| **Lv70 wall** | NM toys exist in data, not in hands | Sneak at island 5 / Lv 50 |
| **Stars are stickers** | 3★ is pride only | Weekly box |
| **Arcade orphan** | Dailies *sometimes* send you there | First-run stamp |
| **Lapse = void** | Week off → same hub | Comeback pack |
| **No shoulder tap** | Android close = gone | Ritual first; TWA notify later |
| **Flavor skills lie** | Chest text looks like a perk | Don’t add more fake perks; wire later or drop |

---

## Proposed loops

Each loop: **gates · save · files · accept**. Copy the accept list into the implementing PR.

### F0 — P0 · One reset clock (local midnight)

**Loop:** Every daily bag (`daily`, `chestDaily`, `eggDaily`, future weekly) keys off the **same local calendar day**. Countdown matches that instant.

**Gates:** Time only. No level gate.

**Save:** Keep `{ date: 'YYYY-MM-DD', … }`. Change `todayKey()` to local:

```js
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

Travel across midnight local → new day. UTC travellers: acceptable (offline kids game).

**Files:** `src/systems/missions.js` (`todayKey`, `dailyResetCountdown`) · callers in `chest-summons.js` / `egg-pets.js` already use `todayKey`.

**Accept:**

- [ ] `todayKey()` === the date `dailyResetCountdown` is counting toward.  
- [ ] Smoke: freeze clock via injected Date in `smoke:summon` / missions if easy; else a unit comment + manual NL evening check.  
- [ ] Existing saves with a UTC date string still sanitize (wrong-day once, then stable).  
- [ ] No combat / audio change.

---

### F1 — P0 · First-open daily ritual (hub)

**Loop:** First hub paint of a new local day (or if any daily claim/pull/egg is still pending) shows a **single sheet**: summons left · 3 missions · egg · streak · “resets in Hh Mm”. One primary CTA (Summons if `left>0`, else first unfinished mission, else Avontuur). Dismiss for the session; reopen from Missies.

**Player:** “I opened the game because I still have 7 pulls and a day bonus.”  
**Maker:** Surfaces systems you already shipped. No new economy.

**Gates:** Time (local day). Show from fighter Lv 1. Soft-hide egg line until Pets screen has been opened once **or** after first adventure (avoid tutorial pile-on).

**Save (additive):**

```js
save.fomo = {
  ritualSeenDate: 'YYYY-MM-DD' | null,  // sheet already shown today
  lastOpenDate: 'YYYY-MM-DD' | null,
};
```

**Files:** `src/ui/ui.js` `renderMenu` · thin helper in `src/systems/missions.js` · `index.html` sheet markup (reuse missions glass, HOME tiles) · i18n `catalog.js` / `i18n.js`.

**Accept:**

- [ ] Cold start on a new day with `left>0` → sheet before the player hunts the dock.  
- [ ] Sheet lists only **live** counts (no “10” if 3 remain).  
- [ ] Second open same day does not re-modal; dock/tile still badge.  
- [ ] Android portrait: sheet scrollable, no overlap with gesture strip (`IMPROVEMENT.md` touch rules).  
- [ ] Versus not mentioned.  
- [ ] `npm test` green.

---

### F2 — P0 · Better summons (pity + useful miss)

**Loop:** Every pull still costs 1 of 10. After **4** non-nice / non-unlock results in a row (today), next pull is at least mid-unlock or shard. The **10th** pull of the day is a **nice** if none yet today. Consolation **never** junk: coins **or** XP **and** 1 item/skill shard if any upgrade track is eligible; else +pet coins.

**Player:** “The video is still a show, but I’m not walking out with schroot.”  
**Maker:** Odds stay free; jackpot stays ~14% plus a floor. Not a casino — daily stamp + collection.

**Gates:** Time (daily quota). Nice still respects `unlock <= lvl+16` (existing). Do not grant zone weapons from the menu chest (keep NM/Hell identity).

**Save:**

```js
save.chestDaily = {
  date, left, pulls,
  dudStreak: 0,      // consecutive empty-ish pulls today
  niceToday: false,
};
```

**Tune (start here, do not buff mid-PR):**

| Constant | Value |
|----------|-------|
| `CHEST_PITY_SOFT` | 4 |
| `CHEST_PITY_HARD` | 10 (or last pull if `left` started at 10) |
| Junk | delete `grantChestConsolation` junk branch |

**Files:** `src/data/chest-summons.js` · `scripts/smoke-summon-screen.mjs` (assert pity fields sanitize) · summon log shows `pity` tag.

**Accept:**

- [ ] 10 pulls with forced RNG miss → at least one nice or mid unlock / ascend / new pet.  
- [ ] Soft pity fires on the pull after 4 duds.  
- [ ] No junk type in new pulls (`type !== 'junk'`).  
- [ ] Zone / dawnblade / master_sword still excluded from chest pool.  
- [ ] Combat `rollSummonChance` stays false.  
- [ ] Reveal video / BGM **untouched** (no theme work).

---

### F3 — P0 · Consecutive day-bonus streak

**Loop:** Claiming the +80 day bonus on consecutive local days increments `streakDays`. Miss a day → streak returns to 0 (or 1 if they claim today). Rewards on top of +80:

| Streak | Extra (stack, one-shot that day) |
|--------|----------------------------------|
| 3 | +1 chest pull (`left++`, cap 12 that day) |
| 7 | +1 egg crack **or** +2 pulls if eggs complete · toast “Vastberaden” |
| 14 | +1 weekly-hunt stamp (if F4 live) else +120 XP |

Achievement `daily7` should mean **7 consecutive**, not 7 lifetime. Keep `dailyBonusCount` as lifetime for stats.

**Gates:** Time. No level.

**Save:**

```js
save.stats.dailyStreak = 0;
save.stats.dailyStreakBest = 0;
save.stats.lastDayBonusDate = null; // todayKey when bonus claimed
```

**Files:** `claimDailyDayBonus` · `dailyStreakLine` · missions UI · `daily7` test.

**Accept:**

- [ ] Claim Mon + Tue → streak 2. Skip Wed, claim Thu → streak 1.  
- [ ] Copy never says “streak” for lifetime count.  
- [ ] Day 3 extra pull does not persist past next reset.  
- [ ] `daily7` unlocks only after 7 consecutive claims.

---

### F4 — P1 · Weekly hunt

**Loop:** Monday local 00:00 rolls **3 weekly** missions from a harder pool (win 5 adventure, 3★ two levels, tame or buy 1 pet, wall 80, 15 finishers, crack 5 eggs this week). Completing all three opens a **week chest**: 1 nice-equivalent unlock **or** 8 shards + 40 pet coins. Progress persists all week; incomplete resets Monday.

**Gates:** Time (ISO week-local). Unlock weekly UI at fighter **Lv 4** or after **2** adventure wins (skip the noisy first session).

**Save:**

```js
save.weekly = {
  weekKey: '2026-W38', // local
  tasks: [{ id, progress, done, claimed }],
  chestClaimed: false,
};
```

**Files:** new `src/data/weekly.js` + missions screen section · hub Missies subline.

**Accept:**

- [ ] Tasks do not reset on daily midnight.  
- [ ] Week chest claimable once.  
- [ ] No Versus / online requirement.  
- [ ] NL/EN strings, Speel → still adventure/arcade only.

---

### F5 — P1 · Daily guaranteed shard

**Loop:** First **adventure win** each local day grants exactly **1** skill shard (active technique) **and** **1** item shard (equipped weapon if eligible, else any owned). Toast: “Dag-shard · morgen weer.” Nightmare/Hell can keep RNG extras.

**Gates:** Time + 1 win. Available from level 1 (fist/spiral always eligible).

**Save:** `save.fomo.dailyShardDate`

**Files:** `src/game/game.js` win path (near `maybeAdvEggBonus`) · `rollSkillShardDrop` / `addItemShards`.

**Accept:**

- [ ] Two wins same day → only one grant.  
- [ ] Loss → no grant.  
- [ ] Does not replace random drops.  
- [ ] No audio theme change (existing `bonus` / `win` SFX ok).

---

### F6 — P1 · Nightmare sneak (soft cliff)

**Loop:** After **island 5 cleared on Normal** (`unlocked > 50`) **or** fighter Lv ≥ 40, a weekly tile “Nachtmerrie-glimp” appears: **one** pre-made Lv 51-style fight on Normal rules with `rarityBoost` +1 and a **single** NM weapon roll (pity: guaranteed if the week’s sneak is won and player owns 0 NM weapons). Not the full 2.0 diff. Copy: “Smaakje · echte Nachtmerrie na Normal 70.”

**Player:** Can *want* NM before the wall.  
**Maker:** Does not skip the 70 clear; does not dump 14 NM weapons.

**Gates:** Level/island + 1/week.

**Save:** `save.fomo.sneakWeekKey`, `save.fomo.sneakCleared`

**Files:** `src/core/storage.js` (flag) · `src/ui/ui.js` island rail · `rollZoneWeaponDrop` allow-list for sneak run only.

**Accept:**

- [ ] Hidden before the gate.  
- [ ] At most one NM weapon from sneak per week.  
- [ ] `advCleared.normal` still required for full Nightmare 2.0 map.  
- [ ] Hell weapons never drop here.  
- [ ] Versus unused.

---

### F7 — P1 · Weekly featured chest banner

**Loop:** Each local week, pick 1 locked **base** weapon (not zone) + 1 untamed pet as “in de schijnwerper”. During nice/mid rolls, 40% chance to pick the featured item if still locked. Summon title: “Deze week: {name}.” After own both, feature a shard bundle.

**Gates:** Time. Chest still 10/day.

**Save:** derived from `weekKey` + roster hash (no extra bag required) or cache `save.fomo.featureIds`.

**Files:** `chest-summons.js` `grantNice*` / `grantMid*` · `renderSummon`.

**Accept:**

- [ ] Featured names visible before pull (no spoiler of *this* pull’s rarity).  
- [ ] Zone weapons excluded.  
- [ ] Audio/video unchanged.

---

### F8 — P2 · Comeback pack

**Loop:** If `lastOpenDate` is ≥ 2 local days ago, first ritual grants **+3** pulls (cap 13 that day), refreshes egg if already cracked, +80 XP once. Copy: “Welkom terug — 3 extra kisten.” Not a streak preserve (F3 still drops).

**Gates:** Time. Once per lapse.

**Save:** `save.fomo.lastComebackDate`

**Accept:**

- [ ] Same-day reopen does not re-grant.  
- [ ] 1-day miss = no pack (that is F3’s job).  
- [ ] No IAP language.

---

### F9 — P2 · Arcade daily stamp

**Loop:** First Training **or** Wall **or** Mats finish of the day: +12 pet coins + 20 XP. Missions can still roll those modes; this is the *reason* on days they don’t.

**Gates:** Time. Any fighter level.

**Save:** `save.fomo.arcadeStampDate`

**Accept:**

- [ ] Only one stamp / day across the three modes.  
- [ ] Does not auto-complete the train/wall daily.  
- [ ] Hub Arcade tile shows “bonus klaar” until stamped.

---

### F10 — P2 · Island 3★ weekly chest

**Loop:** If current island `stars === maxStars` (30), a weekly claim gives 3 item shards + 1 skill shard. Re-earning 3★ on a new island same week does not double.

**Gates:** 30/30 stars on **one** island + weekly claim.

**Save:** `save.fomo.starChestWeekKey`

**Accept:**

- [ ] 29/30 → locked.  
- [ ] Stars on other diffs (NM) count on **that** island bag, not Normal.  
- [ ] No combat stat bomb.

---

### F11 — P3 · Android local reminder (not a widget)

**Loop:** TWA/Capacitor only. Optional opt-in in Settings: 19:00 local if `left>0` or missions unclaimed. Copy: “Nog {n} summons vandaag.” No chat, no server.

**Gates:** Native shell. **Do not** block P0 on this.

**Files:** `native/android/` · already sketched in `native/ios/README.md` item 6.

**Accept:**

- [ ] Off by default.  
- [ ] Web/Pages build has zero notify API calls.  
- [ ] No widget / no iOS-only work in the Android PR.

---

### F12 — P3 · 14-day biome hunt

**Loop:** Rotate farm / zoo / sea every 14 local days. Discover N new species → style tint or egg pity. Uses existing dex biomes (`dexBiomeDiscovered`).

**Accept:** Design in a follow-up; do not start before F4 exists (same UI shelf).

---

### F13 — P3 · Share 3★ card

**Loop:** After a new 3★, offer Web Share of `speel.html` + “3★ Lv {n}”. Social FOMO without Versus.

**Accept:** Share URL remains `speel.html` (`AGENTS.md`). No tunnel / `ipad.html`.

---

## Suggested save blob (all loops)

Sanitize in `src/core/storage.js`. Unknown keys dropped. Defaults:

```js
fomo: {
  ritualSeenDate: null,
  lastOpenDate: null,
  lastComebackDate: null,
  dailyShardDate: null,
  arcadeStampDate: null,
  sneakWeekKey: null,
  sneakCleared: false,
  starChestWeekKey: null,
  featureIds: null,
}
```

Do not rename `SAVE_KEY`. Extend `sanitizeSave` only.

---

## What not to build

| Temptation | Why not |
|------------|---------|
| Energy / stamina | Punishes short Android sessions; this game is already short-burst |
| Paid summons / gem shop | Violates store + IARC drafts |
| Re-enable kill-ascend / Tide / Dawnblade for spectacle | Known run-breakers |
| Full cosmetics / gear slots | Other agents own that |
| Battle pass with 60 free tiers | Too big; weekly hunt is the thin version |
| Leaderboards / Versus ghosts | Retired; online MP later |
| Home-screen widget | Explicitly skipped |
| New audio themes | Out of scope |
| Fake chest perks that don’t apply | Makes F2 feel like a lie |

---

## Sprint map

```
PR-A  F0 + F1 + F3          clock, ritual sheet, real streak
PR-B  F2 + F7               summons feel good + weekly feature
PR-C  F5 + F9               daily shard + arcade stamp
PR-D  F4 + F10              weekly hunt + 3★ box
PR-E  F6                    NM sneak (needs island/diff QA)
later F8, F11–F13
```

PR-A is the only one that should merge before more content. A player who already has 10 pulls and 3 missions will **feel** FOMO the next morning.

---

## QA / playtest (Android-first)

1. Chrome Android or TWA: cold start after 00:01 **local** — ritual, correct leftover pulls.  
2. Pull until empty; confirm no junk; confirm pity if you forced duds (dev).  
3. Claim 3 missions + day bonus; kill process; reopen — streak +1, ritual not re-modal.  
4. Adventure win → egg bonus + (after F5) shards; second win no second daily shard.  
5. Hub still SPELEN / Avontuur first; Versus absent.  
6. `npm test` (build + check + smokes including `smoke:summon`).  
7. Do not commit `health.json` / `hosting.json` / `LIVE-LINK.txt` if a local server touched them.

---

## Code index

| System | Files |
|--------|--------|
| Chest | `src/data/chest-summons.js` |
| Combat summon (off) | `src/data/summons.js` |
| Missions / XP / ach | `src/systems/missions.js` |
| Egg | `src/data/egg-pets.js` |
| Pets / coins | `src/data/pets.js` |
| Item upgrades / shards | `src/data/upgrades.js` |
| Skill shards | `src/data/skills.js` |
| Zone weapons | `src/data/weapons.js` |
| Diffs / islands / stars | `src/core/storage.js` |
| Win loot | `src/game/game.js` (~egg, zone boss, shards) |
| Hub / summon UI | `src/ui/ui.js` `renderMenu`, `renderSummon` |
| Hub markup | `index.html` tiles + `#missionsScreen` |
| Copy | `src/i18n/catalog.js`, `src/i18n/i18n.js` |
| Summon smoke | `scripts/smoke-summon-screen.mjs` |
| Native notify (later) | `native/android/`, `native/ios/README.md` |

---

## Audit stamp

| Field | Value |
|-------|--------|
| Code | v1.18.163 · SW 373 |
| Live | https://brennyz.github.io/stickman-fighter/speel.html |
| Versus | Retired — do not revive for FOMO |
| Widget | Skipped — full scan used instead |
| Gear/cosmetics | Do not implement here |
| Audio themes | Do not touch |
| Authoring run | https://cursor.com/agents/bc-9b677837-2205-5704-b193-fad52110d237 |
