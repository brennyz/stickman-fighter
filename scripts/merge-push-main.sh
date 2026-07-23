#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
git checkout main
git fetch origin
echo "Local:  $(git log -1 --oneline)"
echo "Remote: $(git log -1 --oneline origin/main 2>/dev/null || echo '?')"
git push -u origin main
echo "OK — wacht 2 min op Pages, test:"
echo "https://brennyz.github.io/stickman-fighter/speel.html"
