#!/usr/bin/env bash
# Zet déze clone op GitHub origin/main (LIVE). Werkt vanaf een feature-branch
# of met lokale rommel: stash → checkout main → fast-forward, anders reset.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git fetch origin main

if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
  git rebase --abort || true
  echo "Rebase afgebroken."
fi
if [ -f .git/MERGE_HEAD ]; then
  git merge --abort || true
  echo "Merge afgebroken."
fi

if [ -n "$(git status --porcelain)" ]; then
  git stash push -u -m "pull-main auto-stash $(date -u +%Y%m%dT%H%M%SZ)"
  echo "Lokale wijzigingen gestashed (git stash list)."
fi

git checkout main
if git merge-base --is-ancestor HEAD origin/main; then
  git merge --ff-only origin/main
else
  echo "Lokale main week af van GitHub — reset naar origin/main."
  git reset --hard origin/main
fi

echo "OK  $(git log -1 --oneline)"
echo "    v$(node -p "require('./package.json').version") · speel.html na Pages"
echo "    https://brennyz.github.io/stickman-fighter/speel.html"
