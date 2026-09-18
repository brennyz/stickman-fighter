# Pets UI — first-class catch-up

Pets were a flat card list while gear and factories already had wallet chips,
hero preview, filters, and list → detail. This pass brings the **Pets**
collection screen up to that bar.

Share / playtest URL stays **`speel.html`**. **No Versus.**

**P3 DONE** (draft #319, not on main): HOME Pets tile, pause chip, and daily-egg CTAs are i18n’d in EN / DE / FR / ES / NL.

## Combat feel (P0 sluggish follow)

Feel-only — assist damage and cooldown numbers unchanged.

- Shared `companionFollow`: exp smoothing + player vx/vy predict + face-flip / dash / jump snap
- Assist **telegraph** (filled disc + white outer + color ring, min radius 24) in the last ~0.38s of CD; drawn on top of the pet; hit still fires on the old beat
- Training: CD ticks during the intro lock (ready at the bell) and reach covers the ring on desktop PWA
- Missed range no longer burns a full CD
- Light juice: lunge + extra sparks on hit, ring on pet kill, stretch while catching up, bigger sparkles on pause-equip
- Egg companion uses the same chase
- Reduced-motion / Lite FX stay quieter. No extra toasts.

## What this ships

- **HOME 1-tap Pets** tile (same pattern as gear) + Collection tile
- Collection / HOME **next-step stat** (daily egg / claim / buy / almost tamed)
- `#petScreen` **wallet chips**: PC · Dex n/total · egg status (egg chip taps when ready)
- **Hero** of the equipped dex pet or egg companion (idle bob)
- **Next-goal** strip — tappable when egg / claim / buy is ready
- **One chrome daily-egg CTA** when `canCrackDailyEgg()` — not buried on the Egg tab
- FOMO ritual: egg row tappable; CTA goes to daily egg when ready and summons are spent
- Dex / egg tabs (i18n) · dex filters All / Ready / In progress / Tamed
- Kill **progress bars** on every dex card
- **List → detail** (Android portrait: list first; tap a row for “What does this do?”)
- List cards stay short on 390px: name + rarity + `{cur}/{need} · {cost} PC` (perk lives in detail)
- **390 empty/equip:** hero perk = next-goal (not “tap a row”); tamed-filter empty has **Show all**; pause chip “hunt or buy”. List scrolls inside the pane (no whole-screen drag). Combat follow P0 left as-is.
- **Fold-first (MM-002 / MM-011):** portrait 390 + landscape 844×390 put the dex list (≥3 cards) and the primary CTA (daily egg, else next-goal / first card) on first paint. Hero / jump / sub-home drop off the fold; triple-egg next-goal hides when the crack CTA is up. Detail Equip/Tame/Buy sits under the name (sticky on short viewports).
- Detail CTAs: Equip / Unequip / Tame now (if kills already met) / Buy
- **Pause pet chip**: no tamed = copy only; unequipped = one-tap first tamed; equipped = cycle. Stays in pause (no mid-fight screen hop)
- EN / DE / NL / FR / ES chrome for the new UI
- Desktop landscape: list + detail side by side (same pattern as factories)

Combat numbers, tame costs, and egg weights are unchanged.

## speel.html test steps

1. Open `speel.html` → SPELEN → HOME. **Pets** tile sits next to gear. Badge when the daily egg is ready.
2. Pets screen: if the daily egg is ready, a full-width **Open daily egg** button sits under the next-goal strip (Dex tab too).
3. Wallet egg chip / next-goal “Daily egg ready” also crack the egg.
4. Portrait 390px: locked cards are one short line + bar. No perk wall. Filter count hidden.
5. Pause in adventure/training: pet chip under Resume. Equip / cycle without leaving combat.
6. Versus tile stays gone. Do not share `ipad.html`.

Debug: `save.petCoins = 200; persist();` then reload to exercise Buy.
`save.dex.slymo = 20; persist();` then open Pets → Slymo should be **Ready to tame**.
