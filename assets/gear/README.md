# assets/gear — pixel armour / cosmetics

16×16 stickman-pixel icons for world-drop gear.  
**IDs:** PR #280 catalog (`src/data/gear.js`).  
**Pixels:** `src/data/gear-world.js` templates + tints.

```bash
node scripts/render-gear-assets.mjs
```

Not SW-precached (Android first-load). Combat pickups blit pixels from JS.
