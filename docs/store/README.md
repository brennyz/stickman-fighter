# Store drafts

**Android first** — use Play drafts below. iOS nutrition / App Review notes are optional later (Apple on hold).

## Privacy & data

| File | Purpose |
|------|---------|
| [data-safety-play.md](./data-safety-play.md) | Play Data safety — local-only save (**B7 · nu**) |
| [privacy-nutrition-ios.md](./privacy-nutrition-ios.md) | App Privacy nutrition — **later / Apple hold** |
| `/privacy.html` (repo root) | Public privacy policy → Pages |

## Soft-feel / QA

- [device-qa.md](./device-qa.md) — soft-live checklist (**prioriteit: Android Chrome**)

## Listing & rating (Play)

| File | Purpose |
|------|---------|
| [listing-nl.md](./listing-nl.md) | NL title, short/long description, keywords (B4) |
| [listing-en.md](./listing-en.md) | EN title, short/long description, keywords (B4) |
| [content-rating-iarc.md](./content-rating-iarc.md) | IARC / age-rating questionnaire draft (B6) |
| [review-notes.md](./review-notes.md) | Review notes (Play + later App Store) |

Claims: cartoon stickman arena fighter · **no IAP** · no account · dice roll = in-game run modifier only (not real-money gambling).

## Screenshots (B5 / C5)

Script (PNG binaries gitignored by default):

```bash
# from repo root — boots local static server on :8787 if free
node scripts/capture-store-screenshots.mjs
# or
npm run store:shots

# custom base URL
node scripts/capture-store-screenshots.mjs http://127.0.0.1:8787/index.html

# write under /tmp instead
OUT_DIR=/tmp/sf-store-shots node scripts/capture-store-screenshots.mjs
```

Requirements: system Chrome (`google-chrome` or `CHROME_PATH`) and `puppeteer-core`
(auto-installed under `/tmp/sf-store-shots-deps` if missing).

Output sizes (landscape):

| Prefix | Size | Use |
|--------|------|-----|
| `play-phone-1920x1080` | 1920×1080 | Google Play phone |
| `ios-iphone-2688x1242` | 2688×1242 | App Store iPhone |
| `play-tablet-1920x1200` | 1920×1200 | Google Play tablet |
| `ios-ipad-2732x2048` | 2732×2048 | App Store iPad |

Scenes per size: menu, level select, adventure fight, versus/hub.

PNG files under `docs/store/screenshots/*.png` are **gitignored** (folder kept via `.gitkeep`). Attach generated shots in Play Console / App Store Connect manually.
