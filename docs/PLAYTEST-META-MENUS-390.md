# PLAYTEST BOT 8/9 — META MENUS @ 390

**Build:** LIVE `origin/main` `c9a29fc` · **v1.18.190 / SW 400**  
**Viewport:** 390×844 + extra **834×1194** tablet + **844×390** landscape  
**Window:** until ~18:36 Amsterdam · 2026-09-18  
**Share:** `speel.html` · **Versus:** retired (no `data-hub="versus"`)  
**This PR:** draft findings only. **Do not merge main.** STOP for LEAD after extra pass.

Re-run: `node scripts/playtest-meta-menus-390.mjs` · `node scripts/playtest-meta-menus-extra.mjs`

## Method

1. Fresh save (lvl 1, 0 PC, starter gear) and veteran seed (lvl 18, 640 PC, 3 pets, 51 owned gear).
2. Open HOME → Fabrieken → Gear → Pets → Summons. Measure overflow, tap size, scroll height, open ms, pull ms.
3. Screenshot each list / detail / sheet / pull. No Versus. No combat.

Open times are **not** the lag. All four screens open in **14–37 ms**. Perceived clunk is **scroll length, stacked chrome, repeated copy, and a 2.2 s blank-card pull**.

| Screen | Open ms | ScrollH / 844 | Notes |
|--------|---------|---------------|--------|
| Fabrieken | 35 / 18 | 939 / 944 | ~100 px over fold; sheet 349 px |
| Gear | 30 / 27 | **4285 / 3668** | **~4–5 viewports**; picker 27–28 rows |
| Pets | 14 / 18 | 864 | Chrome eats the fold; list/detail below |
| Summons | 37 / 23 | 844 | Fits; pull **2208 ms**, card not readable |

`npm run smoke:buildings-ui` **fails on this LIVE build** (`doesShort: false`, `toastShort: false`). Gear/pets/summon static smokes were not re-gated here.

## Verdict

**No unique P0** (nothing unusable). Flow still works. Several **P1 clunky/ugly** leftovers after the examinator mega-merge — same symptoms EXAMINATOR already delegated (`EX-010` summons, `EX-011` gear, `EX-016` factories). Pets chrome-stack is the new unique leftover.

Suggested next owners if Brendon wants fixes (new drafts, not this PR):

| ID | P | Lane | Symptom |
|----|---|------|---------|
| **MM-001** | P1 | gear (`EX-011`) | One-page catalog: doll + 5 slots + 14 filter chips + 27 locked rows. ~3668–4285 px. Filters not a sheet. |
| **MM-002** | P1 | pets | Wallet + hero + “Dag-ei klaar” + 84 px crack + tabs ≈ 530 px chrome. Dex list and detail CTAs sit **below the fold**. Triple egg CTA. |
| **MM-003** | P1 | factories (`EX-016`) | Wallet chips are unlabeled dots; lock lines wrap `(eiland n)`; upgrade sheet repeats “Mis 20 PC” / full factory name. LIVE `smoke:buildings-ui` fails (`doesShort`, `toastShort`). |
| **MM-004** | P1 | summons (`EX-010`) | Pull spends **~2.2 s**; stage shows a dark card; reward name only in the log (`Schroot`). Tut strip still on first open. |
| **MM-005** | P1 | FOMO / HOME (`#322`) | Returning player: Vandaag sheet covers Fabrieken / Uitrusting / Pets / Oproepen. Only “Naar oproepen”. |
| **MM-006** | P2 | factories | Offline toast parks on the back button / title (`Klaar voor offline — save blijft hier`). |
| **MM-007** | P2 | gear | Filter labels jam counts (`Alles27`, `Look15`); rarity chips wrap (`legendarisch` / `nachtmerrie`). Hunt CTA + picker empty CTA duplicate. |
| **MM-008** | P2 | pets | Egg wallet chip **74×36** (under 44). Hero perk repeats the next-goal line. |
| **MM-009** | P3 | summons | Honest `geen pity` + `✦14% · mid 30%` is readable; junk pull feels empty. |
| **MM-010** | P1 | gear / landscape | 844×390 first paint is **doll only**. Slots start y≈594. Scroll still **3804 px**. Dual-pane CSS is `min-width: 900px` so 834 and 844 stay one column. |
| **MM-011** | P1 | pets / landscape | 844×390: **0** dex cards on the fold. Chrome (title + wallet + hero) fills 390. List scrollH **2311**. |
| **MM-012** | P1 | summons / landscape | 844×390: gold `Open kist` is **clipped** at the bottom edge. Stage still readable. |

No Versus. Factory ids unchanged (`stick_lighter` … `echo_whistle`).

---

## Extra pass — tablet 834 + landscape 844×390

Veteran seed only. Numbers: `docs/playtest-meta-390/extra-report.json`. Versus still gone.

| Surface | 834×1194 tablet | 844×390 landscape | vs 390 |
|---------|-----------------|-------------------|--------|
| HOME / FOMO | Vandaag covers tiles (`tab834-vet-00-home.png`) | **Left dock** — Fabrieken/Uitrusting/Pets/Oproepen stay tappable (`land844-vet-00-home.png`) | MM-005 is **portrait**. Landscape #329 dock works. |
| Fabrieken | All 5 cards + labeled wallet + Oogst-2. Fits one screen. | Wallet labeled; first card + Oogst-2 on screen; rest scroll (949 / 390) | MM-003 unlabeled dots are **phone-only**. |
| Gear | All 5 slots on first paint. Catalog still **3843 px**. `grid = none` (needs 900). | **Doll only** on first paint (`MM-010`). Slot tap → chip wall, no rows. 3804 px. | MM-001 first-paint softens on tablet, **worsens** on landscape. |
| Pets | **5 cards** on fold + filters. Triple egg still there. | **0 cards** on fold (`MM-011`). Hero clipped. | MM-002 is phone + landscape, not tablet. |
| Summons | Stage tall (ratio 3.1). Pull ~1.6 s. | CTA clipped (`MM-012`). Ratio 1.3. Pull ~1.6 s. | MM-004 timing holds; landscape clips the primary. |

**LEAD pick:** do not treat tablet 834 as a new owner — it mostly **confirms** MM-001 (no 900 px dual-pane) and **clears** MM-002/003 first-paint. New unique leftovers are **landscape** MM-010/011/012. Suggested fix still: gear sheet (helps 390 + 834 + 844) → pets chrome collapse (helps 390 + 844) → summon CTA `min()` on `max-height: 420px` landscape.

---

## HOME (entry to meta)

Fresh: four tiles tappable — Fabrieken `1/5 open`, Uitrusting `starter · 0 drops`, Pets `Dag-ei klaar`, Oproepen `10× vandaag`. Dock icons are 34×48 (music / share / verse versie) — out of lane.

Veteran: FOMO **Vandaag** sheet on HOME (`MM-005`). Meta tiles `getBoundingClientRect` empty until dismiss. Screenshot: `veteran-00-home.png`.

## Fabrieken

Screens: `fresh-10/11/12` · `veteran-10/11/12`.

**Works:** list XOR detail; 5 canonical ids; collect pill vs upgrade CTA (not mashed); sheet opens; Stick-Lighter unlocked at start; locks named by island.

**Clunky / ugly**

- Wallet is six tiny columns. Fresh reads `PC 0` + five unlabeled `0`s. Veteran `640 / 24 +12/u / 8 +7/u / 3 +10/u / 0 / 0` — rates exist, **names do not** at 390.
- Lock does-lines wrap: `Dicht — speel Vuur-eiland (eiland 2) vrij`. Same pattern eiland 3–5.
- Detail title uses the long name (`Stok-Aansteker Fabriek`) while the list card says `Aansteker`.
- Fresh empty-build: small `Bouw VONKEN` pill **and** a disabled 84 px `Bouwen… Mis 20 PC — speel of oogst eerst`. Sheet repeats the miss line + `Bouw Stok-Aansteker Fabriek?`.
- Veteran harvest `Oogst 36 VONKEN` is clear; upgrade still `Mis 6 Vonken` while the wallet already shows 24 Vonken (cost 30) — readable, but the sheet restates the same miss.
- `smoke:buildings-ui` on LIVE: collect toast `+96 Vonken · hopper vol (96)` fails `toastShort`; does-lines fail `doesShort` (length / “Kracht rank”).

Not a lock bug: world 2 needs adventure level &gt; 10 (`buildingUnlocked`). Veteran seed `unlocked: 7` correctly keeps Hout-Lijm locked.

## Gear / Uitrusting

Screens: `fresh-20/21` · `veteran-20/21`.

**Works:** 5 slots; starter vanity on; `SIER` pills; Aandoen/Uitdoen; Versus gone; `renderGear` **7 ms** (no JS hitch).

**Clunky / ugly — strongest 390 miss**

- Fresh scrollHeight **4285 px**. Veteran **3668 px** with 51 owned items. Doll + hunt + weapon aside + 5 slots + 5 look-filters + 9 rarity chips + search + **27 head rows**.
- First paint (`fresh-20-gear.png`): hunt + ghost doll (`5/5 alleen look`) + Vuist aside + Hoofd/Borst. Hands / Legs / Back / filters / picker are **below the fold**.
- Slot tap jumps into a chip wall (`fresh-21-gear-slot.png`): `Alles27 Look15 Stats12 Slot26 Van jou1` then `Alle gewoon ongewoon zeldzaam episch` / `legendarisch mythisch nachtmerrie hel`. Then another `Naar avontuur` empty card, then the real rows. Locked Hell/Nightmare pieces lead the list (`Hel-helm VAST`, `Zwavelhoorns`).
- `#gearFilterDock` does **not** exist. Tools live in `#gearSheetTools` (248 px tall) mid-page — not a bottom sheet.
- Doll y went negative after the slot tap (page scrolled the hero away). Equip preview is not sticky on 390.

This is **EX-011 still live on main** after #315.

## Pets

Screens: `fresh-30/31` · `veteran-30/31`.

**Works:** HOME tile; wallet PC/Dex/Ei; daily-egg CTA; list→detail XOR; 12 roster cards; Versus gone.

**Clunky / ugly**

- Chrome stack to y≈530: title + Kist + wallet + hero + next-goal + 84 px `Dag-ei openen`. **The dex list is not on the first screen.** First card top ≈ 716.
- `Dag-ei klaar` is said **three times** (wallet chip, next strip, primary button). Fresh hero is `Geen pet` / `Dag-ei klaar` — same sentence again.
- Detail CTA sits at y≈931–950 (`Uitzetten` / `0/12 kills · 18 PC`). Viewport shot of “detail” looks like the list because the detail body is off-screen (`fresh-31-pets-detail.png` == chrome stack).
- Egg chip tap target **74×36** (`MM-008`).
- Veteran with Slymo equipped still leads with the egg wall; the pet you have is a 82 px strip, not the page.

Combat follow (EX-003) was not retested — out of this menu pass.

## Summons / Oproepen

Screens: `fresh-40` · `fresh-42` · `veteran-40/41`.

**Works:** Gold `Open kist` 334×94 on-screen; quota `10/10`; `summon-where` hidden; Wapens/Pets links; no Versus; open 23–37 ms.

**Clunky / ugly**

- First-open tut `Tik de kist — 10× per dag, wapen of pet` still shows (seed `tipsSeen.summonChest` did not hide it).
- Stage 209 px vs CTA 94 px (ratio **2.2**). Idle chest is fine; after pull the stage is a **dark card in rings** with no name (`veteran-41-summons-pull.png`). Quota becomes `9/10`. Log under the fold: `Nieuwste · Schroot`.
- Timed pull **2208 ms**; at that frame `cardShow` was false. Reward is not the primary thing you see.
- Empty-quota seed did not stick (still `10/10`) — harness dateKey miss, not a player bug. Not ranked.

This is **EX-010 still live on main** after #313.

## What we did **not** see

- Versus tile or Versus copy.
- Horizontal overflow on the four screens (HOME share URL off-screen is menu chrome, not these sheets).
- JS hitch opening any meta screen.
- Factory dual-pane (list XOR detail holds).
- Gear/pets nuclear `.screen { display:none !important }`.

## Suggested fix order (not this PR)

1. **Gear sheet** — slot tap opens a bottom sheet (filters + owned-first rows). Kill the 4k px page. (`MM-001` / EX-011)
2. **Pets first screen** — one egg CTA; list visible under tabs; detail replaces the chrome stack, not appends below it. (`MM-002`)
3. **Factory wallet labels** + short does/toast so `smoke:buildings-ui` passes on main. (`MM-003` / EX-016)
4. **Summon reveal** — name/rarity on the stage in &lt;1 s; skip tut after first visit. (`MM-004` / EX-010)
5. FOMO stays `#322` — only note that it hides the four tiles (`MM-005`).

## Evidence

| File | What |
|------|------|
| `docs/playtest-meta-390/report.json` | Numbers |
| `fresh-10-factories-list.png` | Unlabeled wallet + wrapped locks |
| `fresh-12-factories-sheet.png` | Repeated miss-copy |
| `fresh-20-gear.png` | Doll + 2 slots, rest below fold |
| `fresh-21-gear-slot.png` | Chip wall + 27-row picker |
| `fresh-30-pets.png` | Triple egg, no list |
| `veteran-00-home.png` | FOMO covers meta tiles |
| `veteran-41-summons-pull.png` | Blank card, `Schroot` in log |
| `tab834-vet-20-gear.png` | Tablet: 5 slots visible, still one column |
| `tab834-vet-30-pets.png` | Tablet: dex list on first screen |
| `land844-vet-00-home.png` | Landscape FOMO dock — tiles stay up |
| `land844-vet-20-gear.png` | Landscape: doll only (`MM-010`) |
| `land844-vet-30-pets.png` | Landscape: no list (`MM-011`) |
| `land844-vet-40-summons.png` | Landscape: CTA clipped (`MM-012`) |
