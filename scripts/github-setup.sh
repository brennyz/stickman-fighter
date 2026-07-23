#!/usr/bin/env bash
# Eerste push naar GitHub (run in stickman-fighter map na repo aanmaken op github.com).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="${1:-}"
if [[ -z "$REMOTE" ]]; then
  cat <<'TXT'
1. Maak op GitHub een repo (bijv. stickman-fighter), leeg, zonder README.
2. Run:
   ./scripts/github-setup.sh git@github.com:JOUW-USER/stickman-fighter.git
   of
   ./scripts/github-setup.sh https://github.com/JOUW-USER/stickman-fighter.git

3. GitHub → Settings → Pages → Source: GitHub Actions
4. Na deploy: ./scripts/set-stable-url.sh https://JOUW-USER.github.io/stickman-fighter/
TXT
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"

if git show-ref --verify --quiet refs/heads/main; then
  BR=main
else
  git checkout -b main 2>/dev/null || git branch -M main
  BR=main
fi

git push -u origin "$BR"
echo ""
echo "Pages deploy start automatisch (workflow deploy-pages.yml)."
echo "Daarna: ./scripts/set-stable-url.sh https://JOUW-USER.github.io/stickman-fighter/"
