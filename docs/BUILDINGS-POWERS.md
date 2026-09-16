# Buildings — powers depth + timed resources 2.0

Lane continues **#290** against the locked **#292** catalog. Android-first. No Versus. No HOME tile work (UI lane). **Do not merge to `main`** until Brendon says «merge main».

Share URL stays `speel.html`.

Combat apply lives in `src/data/buildings-powers.js` (stats) + `src/systems/buildings-combat.js` (identities). Tick / collect prefer `buildingTickAll` / `buildingCollect` from `src/data/buildings.js`.

---

## Rank breakpoints

`buildingPowerRank = floor((lvl − 1) / 2)`

| Level | Rank | Note |
|------:|-----:|------|
| 0 / missing | −1 | Unbuilt — no power, no hopper |
| 1–2 | 0 | First identity unlocks |
| 3–4 | 1 | Second identity |
| 5–6 | 2 | Mid-game breakpoint |
| 7–8 | 3 | Late |
| 9–10 | 4 | Cap identity (Lv 10 is still rank 4) |

Each factory has **one identity**. Stats do not stack the same axis across factories (lighter is crit, chipper is DMG, boiler is HP, glue is defense, whistle is energy/technique).

---

## Exact power table (rank 0–4)

Hooks match `BUILDINGS[].powers` in `src/data/buildings.js`. Versus never applies.

### `stick_lighter` · spark · island 1 — **ember / crit**

| Rank | Lv | Power id | Always-on | Combat identity |
|-----:|--:|----------|-----------|-----------------|
| 0 | 1 | `spark_kindle` | crit **+2%** | First melee each wave leaves a tiny ember (burn ticks) |
| 1 | 3 | `kindle_trail` | crit **+4%** | Moving drops ember crumbs on a nearby foe |
| 2 | 5 | `ember_pocket` | crit **+6%** | Weapon hits can pop a spark chip (~22%, 0.55s cd) |
| 3 | 7 | `flare_step` | crit **+8%** | Dash leaves a short burn line |
| 4 | 9 | `matchstick_storm` | crit **+10%** | Technique cast: short fire cone (7.5s cd) |

Does **not** multiply base DMG (chipper owns that).

### `woodchip_glue` · glue · island 2 — **sticky / armor**

| Rank | Lv | Power id | Always-on | Combat identity |
|-----:|--:|----------|-----------|-----------------|
| 0 | 1 | `sticky_soles` | shield **0.55s** / wave · knockback **×0.78** | Boots hold the floor |
| 1 | 3 | `tacky_block` | shield **0.90s** · block chip **×0.72** | Block holds a beat (less chip) |
| 2 | 5 | `glue_trap` | shield **1.25s** · incoming **×0.95** | First connect / technique arms a slow puddle |
| 3 | 7 | `paste_armor` | shield **1.80s** · incoming **×0.92** | Thicker wave-start glue shield |
| 4 | 9 | `chip_golem` | shield **2.40s** · incoming **×0.88** | Wave-start chip-armor (extra shield) |

### `chipping_wood` · chip · island 3 — **splinter / damage**

| Rank | Lv | Power id | Always-on | Combat identity |
|-----:|--:|----------|-----------|-----------------|
| 0 | 1 | `splinter_edge` | DMG **×1.04** | Weapon hits fling a bonus splinter |
| 1 | 3 | `chip_spray` | DMG **×1.08** | Combo ≥3 coughs extra chips |
| 2 | 5 | `sawdust_cloud` | DMG **×1.12** · speed **×1.04** | Technique: brief miss-haze (incoming ×0.72 for 0.85s) |
| 3 | 7 | `hopper_guard` | DMG **×1.15** · speed **×1.07** | First hit each wave is softer (×0.55) |
| 4 | 9 | `chipper_fury` | DMG **×1.18** · speed **×1.10** | Combo ≥6 sprays nearby splinters |

### `bamboo_boesa` · steam · island 4 — **steam / survive**

| Rank | Lv | Power id | Always-on | Combat identity |
|-----:|--:|----------|-----------|-----------------|
| 0 | 1 | `boiler_hiss` | **+6 HP** | Close-range heat aura (~1.45s) |
| 1 | 3 | `bamboo_vent` | **+12 HP** | Dash puffs a steam shove |
| 2 | 5 | `bamboo_burst` | **+18 HP** · between-wave heal **4%** | Technique: steam cone knock |
| 3 | 7 | `pressure_cook` | **+26 HP** · heal **6%** | Combos build a heat pip (pops at 5) |
| 4 | 9 | `boesa_overheat` | **+36 HP** · heal **8%** | Below 30% HP: faster aura + extra fire chip |

### `echo_whistle` · echo · island 5 — **taunt / control**

| Rank | Lv | Power id | Always-on | Combat identity |
|-----:|--:|----------|-----------|-----------------|
| 0 | 1 | `taunt_toot` | energy regen **×1.06** | Technique: nearest foe faces you |
| 1 | 3 | `mill_heckle` | energy **×1.10** | Taking a hit toots a tiny taunt |
| 2 | 5 | `echo_ridge` | energy **×1.14** · technique **×1.08** | Kills leave a sound-slow ripple |
| 3 | 7 | `ridge_reply` | energy **×1.18** · technique **×1.12** | Parry echoes a stun/slow pip |
| 4 | 9 | `whistle_chorus` | energy **×1.24** · technique **×1.16** | Technique: area taunt + brief slow |

### Stacked caps (so one factory cannot dominate)

| Axis | Cap |
|------|-----|
| DMG | ×1.18 (chipper only) |
| Crit | +10% (lighter only) |
| Speed | ×1.10 |
| Energy regen | ×1.24 |
| Technique dmg | ×1.16 |
| Max HP | +36 |
| Incoming def | ≥ ×0.88 |
| Wave shield | 2.4s |
| Between-wave heal | 8% of max HP |
| Knockback taken | ≥ ×0.68 |
| Block chip extra | ≥ ×0.64 |

Apply order: styles → pets → **buildings**. Training + adventure. Versus skipped.

---

## Timed resources 2.0

Same **#292** start rates and `1.22^(level−1)` rounded curve. Hopper cap = **8 hours × current rate**. Contract-compatible: Lv1 /h and 8h caps are unchanged.

Online (~1s loop) and offline / tab-hide / `pageshow` use the same wall-clock `buildingTickAll`. Clock rollback snaps `lastTickAt` to now — **no refund**.

`stored` may be fractional in memory (short sessions keep progress). `buildingCanCollect` / collect still use `floor(stored + 1e-9)`. Collect **zeros the hopper before crediting the wallet** and uses a re-entry lock so a double tap never double-pays.

### Rates (start × 1.22, rounded each level)

| Building | Res | Lv1 /h | Lv5 /h | Lv10 /h | Lv1 cap (8h) | Lv5 cap (8h) | Lv10 cap |
|----------|-----|-------:|-------:|--------:|-------------:|-------------:|---------:|
| stick_lighter | spark | 8 | 18 | 48 | 64 | 144 | 384 |
| woodchip_glue | glue | 6 | 13 | 36 | 48 | 104 | 288 |
| chipping_wood | chip | 10 | 22 | 60 | 80 | 176 | 480 |
| bamboo_boesa | steam | 7 | 16 | 42 | 56 | 128 | 336 |
| echo_whistle | echo | 5 | 11 | 29 | 40 | 88 | 232 |

### Why a daily open is worth it (mid-game)

Lv5→6 spend is about **one factory’s own resource** (`upRes0 × 1.38^4`): spark ~58, glue ~51, chip ~73, steam ~58, echo ~44.

One **full 8h hopper at Lv5** is spark 144 / glue 104 / chip 176 / steam 128 / echo 88 — **about two upgrades**, or one upgrade plus a buffer for the next island’s build cost. That is the daily loop: open, collect, upgrade, leave the hopper filling.

---

## Save (`BUILDINGS_SCHEMA = 1`)

```js
save.buildings = {
  schema: 1,
  factories: { stick_lighter: { level: 3, lastTickAt: 1710000000000, stored: 12 } },
  wallet: { spark: 4, glue: 0, chip: 0, steam: 0, echo: 0 },
};
```

Sanitize is **idempotent**: alias wallet keys (`embers`/`chips`/`echoes`) take **max**, not sum, so a leftover dual-key bag does not double-pay. Legacy `byId` / `pending` / `stock` / kebab / `_boiler` / `_mill` still migrate once.

---

## Verify

```bash
npm run smoke:buildings-powers
npm run smoke:buildings
npm run smoke:save
```

Manual: `setBuildingLevel('chipping_wood', 5)` then Training — DMG ×1.12 and splinter chips; RabbitRobot still plays. `setBuildingLevel('stick_lighter', 9)` then technique — matchstick cone, no Versus. Close the tab 10+ minutes, reopen: `stored` rose if built. Collect twice — wallet rises once.
