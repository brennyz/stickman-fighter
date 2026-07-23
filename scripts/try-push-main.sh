#!/usr/bin/env bash
# Probeer main naar GitHub te pushen (Pages deploy). Faalt vaak in cloud-agent zonder repo-write.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "Branch: $(git branch --show-current) · $(rg -o \"APP_VERSION = '[^']+'\" game.js | head -1) · $(rg -o 'stickfighter-app-v[0-9]+' sw.js | head -1)"
if git push -u origin main; then
  echo "OK — wacht op GitHub Actions «Deploy GitHub Pages», daarna:"
  echo "https://brennyz.github.io/stickman-fighter/ipad.html"
else
  echo ""
  echo "Push mislukt (403/ auth). Jij met gelinkte git:"
  echo "  git push origin main"
  echo "Zie GITHUB-PUSH.txt"
  exit 1
fi
