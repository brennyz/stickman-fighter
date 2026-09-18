# Mid-phone FX / fxLite

**Lane:** performance · **Modes:** Adventure / Training / Wall / Coinrun  
**Not:** Versus  
**Share URL:** `speel.html`

Keep combat smooth on mid phones. Particle and FX caps, a recycled pool, and a spawn-hitch guard. **Fighters always draw.**

## Contract

| Rule | Desktop (mouse, wide) | Mid phone / Lite FX |
|------|------------------------|---------------------|
| Particle cap | up to 140 (tier 0) | lite **~58** · touch **~100** · floor **16** |
| Per-frame FX budget | 14 (unlimited only on desktop tier 0 + small horde) | lite **4** · spawnLite **≤6** · touch **10** |
| First-of-wave spawn | full burst + rings + freeze | **4–6** sparks + **one** ring · **no freeze** |
| Touch / Lite fight | spawnLite only first ~90 frames | **spawnLite stays on** whole fight on touch / Lite FX |
| Kill / hit freeze | `juiceKillSnap` 58–75ms · `applyHitStop` 34–72ms | **gated** — haptic + squash stay |
| Particle alloc | pool after first boot | **prewarm 48** at boot / `startGame` |
| Fighters / monsters / pet | always `draw()` | always `draw()` — `skipFx` only skips **particles** |

`fxLite()` stays opt-in (`save.liteFx` / Perf.tier ≥ 2 / reduced-motion).  
`fxSpawnLite()` stays **on for the whole fight** on touch / Lite FX / Perf.tier ≥ 1 — not only the first ~90 frames.  
`fxSkipFreeze()` gates `juiceKillSnap` / `applyHitStop` freeze on Lite FX / touch.

Helpers: `fxCaps`, `fxSpawnLite`, `fxSkipFreeze`, `fxTouchDevice`, `prewarmFxPool`, `allocFxParticle`, `perfFxBudgetAllow`. QA: `__sf.fx`.

Versus is untouched. No balance changes.
