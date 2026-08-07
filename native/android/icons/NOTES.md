# Android / Play icons

## Current web icons (reuse for first Bubblewrap build)

| File | Size | Notes |
|------|------|-------|
| `../../../icons/icon-512.png` | 512×512 | Primary input for Bubblewrap `iconUrl` / maskable |
| `../../../icons/icon-192.png` | 192×192 | Web manifest only |
| `../../../icons/icon-180.png` | 180×180 | iOS PWA — ignore for Play |

## Before store submission

1. Export a **1024×1024** PNG master (opaque or with safe transparency).
2. Keep the stickman silhouette inside the **adaptive icon safe zone** (~66% center).
3. Avoid thin strokes at the edges — Play masks to circle / squircle.
4. Optional: generate a dedicated **feature graphic** 1024×500 for the Play listing (store-listing agent).
5. Do not commit Play Console screenshots here — see `docs/store/` when that PR lands.

## Bubblewrap

```bash
# From native/android after init — icons are pulled from iconUrl in twa-manifest.json
bubblewrap update
```

Or point `--icon` at a local 512+/1024 master when regenerating.
