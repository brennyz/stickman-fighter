# Pets UI — first-class catch-up

Pets were a flat card list while gear and factories already had wallet chips,
hero preview, filters, and list → detail. This pass brings the **Pets**
collection screen up to that bar.

Share / playtest URL stays **`speel.html`**. **No Versus.**

## What this ships

- Collection tile subtitle + **next-step stat** (daily egg / claim / buy / almost tamed)
- `#petScreen` **wallet chips**: PC · Dex n/total · egg status
- **Hero** of the equipped dex pet or egg companion (idle bob)
- **Next-goal** strip under the hero
- Dex / egg tabs (i18n) · dex filters All / Ready / In progress / Tamed
- Kill **progress bars** on every dex card
- **List → detail** (Android portrait: list first; tap a row for “What does this do?”)
- Detail CTAs: Equip / Unequip / Tame now (if kills already met) / Buy
- Daily egg button **always visible** (disabled + “again tomorrow” when spent)
- EN / DE / NL / FR / ES chrome for the new UI
- Desktop landscape: list + detail side by side (same pattern as factories)

Combat numbers, tame costs, and egg weights are unchanged.

## speel.html test steps

1. Open `speel.html` → SPELEN → HOME → Collectie → **Pets**.
2. Wallet chips under the title: PC, Dex n/12, egg chip.
3. Hero shows the active pet (or empty copy). Next-goal names the next action.
4. Portrait: list of 12 dex pets with bars. Tap a row → detail + CTA. ← Overview returns.
5. Filter **Ready** shows buyable / claimable only.
6. Egg tab: crack button stays on screen; after crack it waits until tomorrow.
7. Landscape desktop: detail stays visible beside the list.
8. Versus tile stays gone.

Debug: `save.petCoins = 200; persist();` then reload to exercise Buy.
`save.dex.slymo = 20; persist();` then open Pets → Slymo should be **Ready to tame**.
