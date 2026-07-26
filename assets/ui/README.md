# assets/ui — overige UI-SVG

**Leidend document:** [`../../ASSET-STYLE.md`](../../ASSET-STYLE.md)

Kleine gedeelde UI-stukken die uit HTML/JS-strings zijn gehaald.

| Prefix | Rol |
|--------|-----|
| `saga-*.svg` | Character/skill saga-filter chips |
| `ach-*.svg` | Prestatie-lijst iconen |
| `lock.svg` / `check.svg` | Slot & vinkje in lijsten |
| `island-*.svg` | Avontuur-eiland tabs / help |

## Regels

- Alleen **SVG**, `viewBox="0 0 24 24"`, stroke-first waar mogelijk, geen emoji.
- Wire-in: `<img src="assets/ui/…">` (HTML of JS-helper).
- SW precache: alle `assets/ui/*.svg` staan in `sw.js`.

## Status

| Set | Status |
|-----|--------|
| saga | Live |
| ach | Live |
| lock / check | Live |
| island | Live |
