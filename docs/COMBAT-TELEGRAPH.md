# Enemy attack telegraphs — fair fail

**Lane:** telegraph readability · **Modes:** Adventure (Training HUD already has its own bars)  
**Not:** Versus · **Not:** spawn density (#314)  
**Share URL:** `speel.html`

Deaths should feel like Flappy: you saw the pipe. A charge, slam, shot, fire, or ink blob that hits with no readable wind is a bad fail.

## What this lane owns

| Cue | World-space | HUD | Wind |
|-----|-------------|-----|------|
| Charge / shark | Ring + arrow + dash lane | `hud.teleCharge` + 0.1s chip | Desktop floor **0.32s** · phone **0.38s** (×1.28) |
| Slam | Ring + ground pad | `hud.teleSlam` | Same floors on 0.55 base |
| Shoot / ink / fire | Ring + aim line toward player | `hud.teleShoot` / `teleInk` / `teleFire` | Real `telegraphT` before spawn (not leftover CD) · ranged floor **0.40 / 0.46** |
| Enemy technique | Ring + aim | `hud.teleTech` | Existing 0.5 / 0.9 then same floors |

HUD: 2 bars on tall screens, 1 +N on short landscape. Imminent (<0.22s) flashes white on a darker plate. Compact rings scale **1.22×**.

Fail tip (`lastFailTele`) is the **killing hit**, not a leftover chip and not another alive flyer. Hop/slime contact has no cue (body is the pipe). Swim ink is not CHARGE.

## What stays with #314

Scale **0.50 / 1.00**, max alive, interval ×1.55, batch 1, gap 64, opener clamps, tablet mid-band. This PR does not retune horde size.

Desktop charge **0.45s** is unchanged (already above the 0.32 floor). Only the old 0.20–0.28 enrage/shark windows get the readable floor.

## Prove

```bash
npm run smoke:telegraph-read
npm run smoke:combat-density
```
