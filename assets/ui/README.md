# assets/ui — overige UI-SVG

**Leidend:** [`../../ASSET-STYLE.md`](../../ASSET-STYLE.md)

## Sets (live)

| Prefix | Rol |
|--------|-----|
| `saga-*.svg` | Char/dex saga-filters + versus chips |
| `ach-*.svg` | Prestatie-lijst iconen (missies) |
| `ui-lock.svg` / `ui-check.svg` | Slot & vinkje in lijsten |
| `ui-coin.svg` / `ui-warn.svg` | Pet-coins & save-waarschuwing |
| `island-*.svg` | Adventure eiland-tabs (7: landweg…hel) |

Wire-in via `achIconSvg` / `sagaIconSvg` / `SVG_*` helpers in `src/ui/ui.js` + `src/systems/versus.js` (`<img>`).
Islands: `ADVENTURE_ISLANDS.icon` in `src/core/storage.js` → `<img src="assets/ui/island-*.svg">`.
