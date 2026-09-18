# Combat juice (hit / kill / equip)

Flappy-like: **snap the core action**, not UI chrome. Versus retired.

| Action | What you feel | Reduced-motion |
|--------|----------------|----------------|
| **Hit** (punch / kick / weapon) | Hit-stop + rate-limited haptic + light camera punch + body squash. One impact ring (existing confirm). **No freeze on Lite FX / touch.** | Flash + damage number + haptic. No shake / squash / particles. |
| **Kill** | One **KO** floater. Slightly longer freeze on desktop. Shake/haptic rate-limited so a horde does not camera-spam. **No freeze on Lite FX / touch.** | KO text. No shake. |
| **Equip** | Combat pickup: freeze + ring + haptic. Gear doll: short scale punch. | Doll keeps a static gold outline. No extra toasts. |

## Rules

- No extra toasts, banners, or HOME pulses on this lane.
- No damage / HP formula changes.
- Do **not** own invisible-render or landscape-menu P0s.
- Share URL stays `speel.html`.

## Code

- `src/systems/combat-juice.js` — `juiceApplyHitSquash` / `juiceKillSnap` / `juiceEquipCombat` / `juiceEquipMenu`
- `applyHitConfirmFx` — haptic + light shake (rate-limited)
- `applyHitStop` — punch/kick freeze slightly punchier (feel only)
- Smoke: `npm run smoke:juice-feel`
