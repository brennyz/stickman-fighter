# Landscape touch pads (1P, ~844×390)

Short phone landscape gets its own 1P cluster. Portrait (~390×844) and Versus/dual stay on the existing paths.

## Why

The tablet 3×2 grid put **jump** too far left for a landscape thumb and parked the joystick in the Android/iOS gesture strip. Punch/jump/swipe need to be reachable and mistap-safe on ~844×390 without shrinking below **44px**.

## Layout (1P only)

- `touchPhoneLandscape(W, H)` = `W > H×1.04 && H ≤ 500 && W < 960`
- Right-thumb cluster like portrait: **jump · punch · kick** on the bottom row, special/weapon/subst above
- Centers sit `navKeep + joy radius` above the bottom (`navKeep ≥ 24px`) so the hitboxes clear the system nav
- Joystick home shares that baseline on the left
- Swipe pad (`combatJoySwipeAccepts`) stays left 34%; short landscape uses `y > 55%` so the lifted stick is still in-pad
- Kick stays right of the swipe band; `combatPreferStrike` still claims punch/kick near-misses (compact profile, `h < 430`)

## HUD (#321)

Do **not** change `hudSafeLayout` / `hudPauseGutter` / `--hud-pause-gutter`. Pause stays top-right. The special button must sit below that gutter. Landscape is **not** `hudPhoneCompact` (width > 430).

## Out of scope

- Versus / `Input.dualMode`
- iPad landscape (≥960 or height > 500)
- Portrait 390×844 (jump stays rightmost)

Share URL: `speel.html`.
