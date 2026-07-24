# Stickman Fighter — source modules

Game logic is split from the monolithic `game.js` into ordered modules.
`npm run build` concatenates these back into root `game.js` for the PWA (single cached bundle).

## Layout

| Path | Contents |
|------|----------|
| `00-prelude.js` | Math utils, Perf, FX budget |
| `core/storage.js` | Save/load, version, islands, adventure helpers |
| `core/canvas.js` | Canvas resize, DPR |
| `data/*` | Weapons, monsters, styles, rarities |
| `systems/*` | Audio, input, missions, versus |
| `entities/*` | Fighter & monster classes |
| `render/*` | Draw helpers, scenery, backgrounds |
| `game/game.js` | Main Game class & modes |
| `ui/ui.js` | Screens, menu hub, render* |
| `boot/*` | Event bindings, main loop |

## Commands

```bash
npm run build    # src → game.js
npm run test     # build + syntax + smoke
npm run split    # re-split game.js into src/ (after editing monolith)
```

**Edit `src/` files**, then `npm run build`. Do not edit `game.js` by hand.

Version lives in `core/storage.js` (`APP_VERSION`, `SW_CACHE_REV`) — keep in sync with `sw.js`.
