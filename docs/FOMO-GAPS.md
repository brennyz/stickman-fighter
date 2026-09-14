# FOMO gaps — Cursor implement spec

LIVE `v1.18.163` / SW 373 · Android-first · **no Versus** · no IAP · no widget · no gear/cosmetics · no audio themes.

**This file is the spec.** Do not invent loops. Implement only the `F*` IDs in your PR title.

```
Edit src/** then npm run build. Never hand-edit game.js.
i18n: NL + EN required. DE/FR/ES may copy EN.
IMPROVEMENT.md safety: no dmg/HP bombs, no nuclear CSS, Versus stays retired.
Do not re-enable rollSummonChance / DAWNBLADE_CHANCE / TIDE_BATTLE_CHANCE.
Share URL stays speel.html.
```

| PR | Ship | Leave closed |
|----|------|----------------|
| **A** | F0 F1 F3 | F2+ |
| **B** | F2 F7 | F4+ |
| **C** | F5 F9 | |
| **D** | F4 F10 | |
| **E** | F6 | |
| later | F8 F11 F12 F13 | |

P0 = A then B. Park P2–P3 until A is live.

---

## Shared helpers (add once, reuse)

Put date helpers next to existing `todayKey` in `src/systems/missions.js`. Sanitize in `src/core/storage.js` `sanitizeSave` (~L1227) + import merge (~L854). Default `save.fomo` on `DEFAULT_SAVE`.

```js
function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function weekKey(d) {
  d = d || new Date();
  const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (tmp.getDay() + 6) % 7; // Mon=0
  tmp.setDate(tmp.getDate() - day);
  const jan1 = new Date(tmp.getFullYear(), 0, 1);
  const wk = 1 + Math.floor((tmp - jan1) / 86400000 / 7);
  return tmp.getFullYear() + '-W' + String(wk).padStart(2, '0');
}

function daysBetweenKeys(a, b) {
  if (!a || !b) return 99;
  return Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / 86400000);
}
```

`save.fomo` defaults (unknown keys dropped):

```js
{
  ritualSeenDate: null, lastOpenDate: null, lastComebackDate: null,
  dailyShardDate: null, arcadeStampDate: null,
  sneakWeekKey: null, sneakCleared: false,
  starChestWeekKey: null, featureIds: null,
}
```

`chestDaily` extra (F2): `dudStreak: 0`, `niceToday: false`.  
`stats` extra (F3): `dailyStreak: 0`, `dailyStreakBest: 0`, `lastDayBonusDate: null`.  
Do **not** rename `SAVE_KEY`.

---

## Live inventory (do not rebuild)

| System | File | Truth |
|--------|------|--------|
| Chest 10/day, 14% nice, 30% mid, **no pity**, junk 20% | `src/data/chest-summons.js` | `CHEST_DAILY_TOTAL`, `openChestSummon`, `grantChestConsolation` |
| Combat ✦-ascend **OFF** | `src/data/summons.js` | `rollSummonChance()` → `false` |
| 3 of 8 dailies +80 XP | `src/systems/missions.js` | `DAILY_DEFS`, `ensureDaily`, `claimDailyDayBonus` |
| Reset **bug** | same | `todayKey()` = UTC ISO; `dailyResetCountdown()` = local midnight |
| “Streak” is lifetime | same | `stats.dailyBonusCount`; ach `daily7` counts lifetime |
| Egg 1/day + 1 adv-win | `src/data/egg-pets.js` | `#eggCrackBtn` in `UI.renderPets` |
| Shards RNG | `skills.js` `rollSkillShardDrop`; `upgrades.js` `rollItemShardDrop` | `addItemShards` requires **owned** track; `vuist` ineligible |
| Zone weapons ~27 | `src/data/weapons.js` | `dropZone` + `rollZoneWeaponDrop`; Normal guarantee only Lv 60/70 |
| NM/Hell | `src/core/storage.js` | NM after `advCleared.normal`; Hell after NM; 70 lv × 7 islands |
| Stars | `src/data/monsters.js` | 3★ HP>72%, 2★>38%; **no payout** |
| Hub | `index.html` + `UI.renderMenu` | tiles Avontuur/Arcade/Collectie/Summons; Missies = **dock** `#btnMissions` |

**Off:** Dawnblade chance 0 · Tide 0 · Versus retired · widget skipped · IAP forbidden.

---

## P0

### F0 — local `todayKey`

**Why:** Countdown says local midnight; bags reset on UTC.

**Do**

1. Replace `todayKey()` (missions.js ~L111) with local `YYYY-MM-DD` above.
2. Keep `dailyResetCountdown()` local `setHours(24,0,0,0)`.
3. All bags already compare `date !== todayKey()` — chest (`ensureChestDaily`), egg (`ensureEggDaily`), missions (`ensureDaily`), `sanitizeChestDaily(..., today)`, `sanitizeSave` egg/chest (~L1439–1463). After the swap they share one clock.
4. One-day UTC→local mismatch on existing saves is OK (reset once).

**Don't:** persist timezone · bank unused pulls · change quota 10.

**Edit:** `src/systems/missions.js` only for the function; no UI.

**Accept**

- [ ] `todayKey()` === date that `dailyResetCountdown` counts toward.
- [ ] `ensureChestDaily` / `ensureDaily` / `ensureEggDaily` all use that key.
- [ ] `sanitizeChestDaily` second arg is `todayKey()`, not `toISOString()`.
- [ ] No combat/audio change. `npm test` green.

---

### F1 — first-open ritual sheet

**Why:** Summons + missions + egg already exist; player must hunt three screens.

**Do**

1. Helper `fomoRitualPending()` true iff local `todayKey()` !== `save.fomo.ritualSeenDate` **and** any of: `chestSummonsLeft()>0` · `claimableDailyTasks().length` · day-bonus ready · `canCrackDailyEgg()`.
2. On `UI.renderMenu`, if pending and `#fomoRitual` not session-dismissed (`UI._fomoRitualHide`), show sheet **over hub** (not a new `.screen`).
3. Sheet rows (live counts only): summons `left/10` · 3 mission titles + progress · egg line **only if** `save.stats.advWins>=1` · streak line from F3 (hide if 0) · `dailyResetCountdown()`.
4. One primary CTA: if `left>0` → `UI.safeOpen('summonScreen')`; else first undone mission → `goDailyPlayTarget(id)`; else `#btnAdventure`.
5. Dismiss (X / backdrop) sets `UI._fomoRitualHide=true` **and** `save.fomo.ritualSeenDate=todayKey()` + persist. Same day: no auto-sheet. Reopen: Missies header button “Dagoverzicht” calls `ritualSeenDate=null` + show.
6. Each hub paint: `save.fomo.lastOpenDate=todayKey()` (needed by F8 later; write now).
7. Markup: `#fomoRitual` in `index.html` beside hub; reuse missions/HOME glass (`ASSET-STYLE.md`). Portrait scroll; ≥24px above gesture strip.

**Don't:** new economy · Versus copy · auto-reopen after dismiss · show egg on brand-new save · MutationObserver / `display:none !important` on `.screen`.

**Edit:** `src/ui/ui.js` `renderMenu` · `src/systems/missions.js` helpers · `index.html` · `src/i18n/catalog.js` + `i18n.js`.

**i18n keys:** `fomo.ritualTitle` `fomo.ritualCtaSummon` `fomo.ritualCtaMission` `fomo.ritualCtaAdv` `fomo.ritualDismiss` `fomo.ritualReopen` `fomo.resetIn`

**Accept**

- [ ] New local day + `left>0` → sheet on first hub paint.
- [ ] Counts match `chestSummonsLeft` / live tasks (never hardcoded 10).
- [ ] Second open same day: no sheet; `#btnMissions` still `tog-alert` if claimable.
- [ ] Versus string absent. `npm test` green.

---

### F3 — consecutive streak (ship in PR-A with F0/F1)

**Why:** UI says streak; `dailyBonusCount` never drops.

**Do**

1. On `claimDailyDayBonus` success:  
   `prev = stats.lastDayBonusDate`; `today = todayKey()`.  
   If `daysBetweenKeys(prev, today)===1` → `dailyStreak++`; else `dailyStreak=1`.  
   `dailyStreakBest = max(best, streak)`; `lastDayBonusDate=today`; keep incrementing `dailyBonusCount` (lifetime).
2. Rewards **same claim**, after +80 XP (once that day):

| `dailyStreak` | Extra |
|---------------|--------|
| 3 | `ensureChestDaily(); left = min(left+1, 12)` |
| 7 | if `eggOwnedCount() < 12` then `eggDaily.dailyCracked=false` (one extra crack); else `left = min(left+2, 12)` |
| 14+ | **+120 XP only** in PR-A. Do not write weekly fields (F4 not shipped). |

3. `dailyStreakLine()` uses `dailyStreak`, not `dailyBonusCount`.
4. Ach `daily7` `test`: `(s.stats.dailyStreakBest\|\|0) >= 7` (best consecutive). Lifetime count stays on the profile if already shown elsewhere — do not call it streak.

**Don't:** preserve streak on miss · extra pulls past next `ensureChestDaily` date change · implement F4 stamp.

**Edit:** `claimDailyDayBonus` · `dailyStreakLine` · `ACHIEVEMENTS` `daily7` · `sanitizeSave` stats ints.

**Accept**

- [ ] Mon+Tue claim → streak 2. Skip Wed, Thu claim → streak 1.
- [ ] Copy: lifetime never labeled streak.
- [ ] Day-3 extra pull gone after next local date (`ensureChestDaily` reset).
- [ ] `daily7` unlocks only when `dailyStreakBest>=7`.

---

### F2 — chest pity + no junk (PR-B)

**Why:** 10× video often ends in schroot.

**Dud** = result `type` ∈ `{coins,xp,junk}` **or** (`egg` && `duplicate`).  
**Hit** = `weapon_unlock` · `weapon_ascend` · `pet_unlock` · (`egg` && !duplicate).

**Do**

1. Sanitize `dudStreak` 0–20, `niceToday` bool on `sanitizeChestDaily`. Reset both when date rolls.
2. After a normal roll in `openChestSummon`: if Hit → `dudStreak=0`; if `nice` → `niceToday=true`; if Dud → `dudStreak++`.
3. Soft pity: if `dudStreak>=4` **before** roll → do not roll RNG; call `grantMidChestWeapon()` if kind weapon else `grantMidChestPet()`; if null → consolation **without junk** + `addItemShards` 1 on any eligible track else +12 pet coins. Then `dudStreak=0`.
4. Hard pity: if `!niceToday` && `d.left===1` **before** decrement → force `grantNiceChestWeapon|Pet` (same kind roll). If those return consolation, still set `niceToday=true` only when `result.nice`. Last pull of the day must not be a Dud if `!niceToday` — fallback mid then shard/coins.
5. Delete junk branch in `grantChestConsolation` (the `return { type:'junk'…}`). Third bucket → coins.
6. Log row may set `pity: 'soft'|'hard'`. Keep `CHEST_NICE_CHANCE=0.14`. Zone / `dawnblade` / `master_sword` stay out of `chestBaseWeaponPool`.

**Don't:** change video/BGM · turn `rollSummonChance` on · grant `dropZone` weapons · bank pulls · add real combat from `CHEST_*_SKILLS` strings.

**Edit:** `src/data/chest-summons.js` · `scripts/smoke-summon-screen.mjs` (pity fields survive sanitize).

**Accept**

- [ ] Forced-dud ×10 → ≥1 Hit; `type!=='junk'` on all new pulls.
- [ ] Soft pity on the pull after 4 duds.
- [ ] Hard pity on the last pull if no nice yet.
- [ ] `rollSummonChance` still false. Video/BGM untouched.

---

### F7 — weekly featured banner (PR-B, with F2)

**Do**

1. `featuredChestTargets(weekKey())`: first locked base weapon in `WEAPONS` order (same filter as `chestBaseWeaponPool` + `!weaponUnlockedByLevel` + `!chestWeaponUnlocked`); first untamed `PET_ROSTER`. If none, `null`.
2. In `grantMid*` / `grantNice*`, if featured still locked && `Math.random()<0.40`, pick that id.
3. `UI.renderSummon`: line `Deze week: {weapon} · {pet}` **before** pull (names only, no rarity of *this* pull).

**Don't:** zone weapons · persist random feature (derive from `weekKey` + roster).

**Accept**

- [ ] Same week → same names.  
- [ ] Zone ids never featured.  
- [ ] Audio/video unchanged.

---

## P1

### F4 — weekly hunt (PR-D)

**Do**

1. `src/data/weekly.js`. `ensureWeekly()` if `save.weekly.weekKey !== weekKey()` reset 3 tasks + `chestClaimed=false`.
2. Unlock UI when `save.lvl>=4 || save.stats.advWins>=2`. Else hide section.
3. Fixed pool (hash-pick 3 like dailies, seed `weekKey`):

| id | type / bump | goal | 
|----|-------------|------|
| `wAdv5` | `advWin` | 5 |
| `wStar2` | increment when `starsFromHpPct` on a **win** is 3 (count levels, not stars) | 2 |
| `wPet1` | pets tamed or coin-buy this week (`maybeTamePet` / `buyPetWithCoins` / chest pet_unlock) | 1 |
| `wWall80` | `wallBricks` max | 80 |
| `wFin15` | `weaponFinisher` | 15 |
| `wEgg5` | `hatchEggPet` calls | 5 |

4. Reuse `bumpDaily`-style `bumpWeekly(type, amount)` from the same call sites (add one line next to each `bumpDaily`).
5. All 3 claimed → week chest **once**: `openChestSummon` nice-equivalent **without** decrementing daily `left` **or** (if `left` coupling is messy) grant `grantNiceChestWeapon`/`Pet` 50/50 + persist. Fallback: 4 skill shards + 4 item shards + 40 pet coins.
6. Missions screen: second block under dailies. Do not reset at daily midnight.

**Don't:** Versus · online · merge F10 into this chest.

**Save:** `save.weekly = { weekKey, tasks:[{id,progress,done,claimed}], chestClaimed }`

**Accept**

- [ ] Daily reset does not wipe weekly progress.  
- [ ] Chest once per `weekKey`.  
- [ ] Hidden before unlock gate.

---

### F5 — daily shard (PR-C)

**Do:** In `finishAdventure(true)` next to `maybeAdvEggBonus` (`src/game/game.js` ~L867): if `save.fomo.dailyShardDate !== todayKey()`: `addSkillShards(activeTechniqueId()||'spiral_orb', 1)`; item: if `itemUpgradeEligible('weapon', save.weapon)` that id, else first `WEAPONS`/`PET_ROSTER`/`STYLES` that is eligible, else skip item. Set `dailyShardDate`. Toast `fomo.dailyShard`. Loss: no grant.

**Don't:** replace RNG drops · grant on training/wall · use `vuist` (ineligible).

**Accept**

- [ ] Two wins same day → one grant.  
- [ ] Loss → none.  
- [ ] RNG drops still roll.

---

### F6 — NM sneak (PR-E)

**Gate (one):** `advUnlockedLevel('normal') > 50`. No fighter-Lv alternate.

**Do**

1. Island rail tile “Nachtmerrie-glimp” if gated && `save.fomo.sneakWeekKey !== weekKey()` || (`===` && !sneakCleared).
2. Start: `startGame('adventure', { level: 51, difficulty: 'normal', fomoSneak: true })`. `Game` stores `this.fomoSneak`. Apply `rarityBoost+1` for this run only (do not set `save.advDiff`).
3. Win: if `Object.keys(save.zoneWeapons||{}).filter(id => weaponById(id)?.dropZone==='nightmare').length===0` → `grantZoneWeapon` first unowned nightmare weapon; else `rollZoneWeaponDrop` once. Set `sneakWeekKey=weekKey()`, `sneakCleared=true`. Cap **1 NM weapon / week** from sneak.
4. Copy: `fomo.sneakBlurb` = smaakje; full NM still needs `advCleared.normal`.

**Don't:** new mode string · unlock Nightmare map · Hell drops · skip Lv70 clear · audio themes.

**Accept**

- [ ] Hidden when `unlocked<=50`.  
- [ ] ≤1 NM weapon/week from sneak.  
- [ ] `setAdvDiff('nightmare')` still requires Normal 70 clear.  
- [ ] Hell pool unused.

---

### F10 — island 3★ weekly box (PR-D, not inside F4)

**Do:** If any island on `currentAdvDiff()` has `islandProgress(id).stars === maxStars` (30) && `starChestWeekKey !== weekKey()`: claim button on that island card → +3 `addItemShards` (owned tracks) +1 `addSkillShards` + set key.

**Don't:** pay out per-level 3★ · count other diffs toward this island.

**Accept:** 29/30 locked · one claim / week.

---

## P2

### F8 — comeback

If `daysBetweenKeys(save.fomo.lastOpenDate, todayKey())>=2` && `lastComebackDate !== today`: `left=min(left+3,13)`; if `eggDaily.dailyCracked` set `false` (do not touch `advBonus`); `grantMetaXP(80)`; `lastComebackDate=today`. Toast `fomo.comeback`. 1-day miss = no pack (F3 handles). Same-day reopen: no re-grant.

**Edit:** `renderMenu` after lastOpenDate write. Files: missions helper + ui.

**Accept:** ≥2-day gap → once · 1-day gap → no pack · no IAP words.

### F9 — arcade stamp

First `finish` of training **or** wall **or** coinrun today: +12 pet coins + `grantMetaXP(20)`; `arcadeStampDate=today`. One across all three. Does not complete dailies. Arcade tile sub: `fomo.arcadeReady` until stamped.

**Hook:** each mode’s existing over/win path in `src/game/game.js`.

**Accept:** second arcade mode same day → 0 extra.

---

## P3 (parked — spec only)

### F11 — TWA local notify

Opt-in Settings, default **off**. 19:00 local if `left>0` or unclaimed missions. Pages/web: **zero** Notification API calls. No widget. No iOS in the Android PR. Files: `native/android/` only.

### F12 — 14-day biome

Do not start before F4 UI shelf exists. Rotate `farm|zoo|sea` by `floor(Date/86400000/14)`. Goal: +3 `dexBiomeDiscovered` in that biome. Reward: one extra egg crack. Full design in the implementing PR — no extra systems here.

### F13 — share 3★

On new 3★ (`stars > prevStars && stars===3`): offer `navigator.share` / copy of `resolveSharePlayUrl()` (`speel.html` only) + `fomo.shareStars`. No `ipad.html`, no tunnel.

---

## Forbidden

| No | Why |
|----|-----|
| Energy/stamina | Short Android sessions |
| Paid pity / gems | Store + IARC |
| Combat ascend / Tide / Dawnblade | Run-breakers (`false` / 0) |
| Gear/cosmetics | Other agents |
| Battle pass | F4 is the thin version |
| Versus / leaderboards | Retired |
| Widget | Skipped |
| Audio themes | Out of scope |
| Wiring `CHEST_*_SKILLS` as real mods | Strings are flavor; leave or delete later |

---

## QA (Android)

1. Cold start 00:01 **local** — F0 bags + F1 sheet + leftover `left`.  
2. F2: empty the 10; no junk; pity if forced duds.  
3. F3: claim day bonus, kill process, reopen — streak holds; sheet does not re-modal.  
4. F5: two adv wins → one shard toast.  
5. Hub SPELEN/Avontuur first; Versus absent.  
6. `npm test` (includes `smoke:summon`).  
7. Do not commit `health.json` / `hosting.json` / `LIVE-LINK.txt`.

---

## File index

| Hook | File |
|------|------|
| `todayKey` `ensureDaily` `claimDailyDayBonus` `daily7` | `src/systems/missions.js` |
| Chest / pity | `src/data/chest-summons.js` |
| Egg | `src/data/egg-pets.js` |
| `sanitizeSave` `DEFAULT_SAVE` diffs | `src/core/storage.js` |
| `startGame(mode, opts)` | `src/boot/start.js` |
| `Game(mode, opts)` `opts.level` win loot | `src/game/game.js` |
| Hub / summon / pets | `src/ui/ui.js` |
| Tiles / Missies dock | `index.html` |
| Copy | `src/i18n/catalog.js` `src/i18n/i18n.js` |
| Summon smoke | `scripts/smoke-summon-screen.mjs` |

Stamp: audit run https://cursor.com/agents/bc-9b677837-2205-5704-b193-fad52110d237 · play https://brennyz.github.io/stickman-fighter/speel.html
