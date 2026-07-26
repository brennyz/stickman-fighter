# assets/ui — overige UI-SVG

Kleine gedeelde UI-stukken (lock, check, saga-chips, prestatiën, eiland-tabs) als ASSET-STYLE files.

**Leidend document:** [`../../ASSET-STYLE.md`](../../ASSET-STYLE.md)

## Inhoud (live)

| Prefix | Rol |
|--------|-----|
| `saga-*.svg` | Character-select saga chips |
| `ach-*.svg` | Prestatiën / achievements |
| `island-*.svg` | Adventure eiland-tabs |
| `lock.svg` / `check.svg` | Slot + vinkje in lijsten |

Wire-in: `<img>` via `sagaIconSvg` / `achIconSvg` / `SVG_LOCK_ICON` / `SVG_CHECK_MINI` / `ADVENTURE_ISLANDS.icon`.

SW precache + `hardenButtonIcons()` dekken `assets/ui/` mee.
