# Playtest bot 3/9 — landscape combat findings

**Build:** LIVE `origin/main` `c9a29fc` · **v1.18.190 / SW 400**  
**Lane:** camera / floor / touch pads · mid-fight rotate · punch/jump reach  
**Out of scope:** Versus · `origin/main` push · HOME menus (bot 2) · juice / telegraphs / death-retry  

Share URL stays `speel.html`.

## Verdict

**No P0.** Landscape combat on this build holds the #325 / #331 contract.

Fighters stand on a painted floor. Canvas matches the visual viewport (letterbox `dx/dy/ox/oy = 0`). Phone-landscape punch and jump are ≥44px, above the gesture strip, and they fire — including after a mid-fight portrait → landscape rotate.

| Check | 844×390 | After mid-fight rotate | Training 844×390 |
|-------|---------|------------------------|------------------|
| Camera / letterbox | aligned, dead=false | aligned | aligned |
| Floor | ground 312, floor lum 316 | player (350, 312) on floor | player + robot y=312 |
| Punch | 44px @ (754, 325), fires `kind=punch` | fires after rotate | fires |
| Jump | 44px @ (806, 325), leaves ground | leaves ground after rotate | reachable |

Existing smokes also green: `smoke:landscape-combat`, `smoke:landscape-touch`, `smoke:touch-btns`.

Desktop Chrome at 844×390 (no touch, `showTouchPads` unset) draws the **keyboard legend**, not pads. That is `useTouchFightPads()` — device-first. Pads appear when `IS_TOUCH` or `save.showTouchPads === true` (Puppeteer `hasTouch: true` path above). Not a missing-control bug.

## What we ran

Harness: `npm run playtest:landscape-combat` (`scripts/playtest-landscape-combat-bot.mjs`).

Viewports: 667×375, 736×414, 844×390, 915×412, 1180×820, 1280×720. Modes: Adventure + Training. Rotate both ways. Cyber city lv13. Airborne rotate. Versus not started.

## P0

None.

## P1

None for this lane.

HUD copy on the short strip still stacks (`LEVEL 1` over wave text / teach chip). That is the HUD / first-30s sibling, not camera/floor/pads.

## P2

### LC-001 — Mid-jump rotate to short landscape snaps to the new floor

Portrait hop (`y≈519`, `vy≈-167`, `onGround=false`) then rotate to 844×390. `alignCombatPlayfield` snaps the body to `ground=312` because the old Y would sit below the new `H`. Hop is cancelled. Necessary so the fighter stays on the painted floor. Feel: rotate mid-jump = land.

**Not a floor bug.** Leave unless LEAD wants a scaled hop (`y` remapped instead of snapped).

### LC-002 — Landscape → portrait while airborne keeps the hop

After a landscape jump, rotate to 390×844. Player stays airborne (`y≈539`, ground `616`) and still on canvas. Pads relayout (jump rightmost). This is the inverse of LC-001 and looks correct.

## P3 (notes, not blockers)

| ID | Note |
|----|------|
| LC-003 | Phone-land punch/jump sit on the **44px** floor (no slack). Still legal. |
| LC-004 | iPad / desktop (not `touchPhoneLandscape`) keep the 3×2 grid: **jump left of punch**. Documented as out of scope in `docs/LANDSCAPE-TOUCH.md`. Thumbs can still reach (78–98px). |
| LC-005 | Cyber night floor is dark; fighter stays visible (contrast lift from #333). No letterbox. |

## Coordinate

- **#325** owns viewport ↔ canvas ↔ floor ↔ entity coords. Still true on `c9a29fc`.
- **#331** owns phone-land pads. 844×390 order is jump > punch > kick, swipe left 34%.
- **#333** owns fighter pixels. Cyber body stayed readable.
- Do not rewrite Versus / dual pads.

## Repro

```bash
npm run smoke:landscape-combat
npm run smoke:landscape-touch
npm run playtest:landscape-combat
```

Draft only. No `main`.
