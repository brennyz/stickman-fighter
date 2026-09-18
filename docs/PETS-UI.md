# Pets UI — first-class catch-up

Pets were a flat card list while gear and factories already had wallet chips,
hero preview, filters, and list → detail. This pass brings the **Pets**
collection screen up to that bar.

Share / playtest URL stays **`speel.html`**. **No Versus.**

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
