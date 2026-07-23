#!/usr/bin/env bash
# Maak GitHub-repo + push main + start Pages (vereist: gh auth login).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${1:-stickman-fighter}"
VIS="${2:-public}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Installeer GitHub CLI: https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Nog niet ingelogd. Run op je Mac/PC:"
  echo "  gh auth login"
  echo "Daarna opnieuw: ./scripts/create-github-pages.sh"
  exit 1
fi

USER=$(gh api user -q .login)
echo "GitHub user: $USER"

# Zorg dat we op main zitten met de speelbare code
git checkout main 2>/dev/null || git checkout -b main
git branch -M main

if gh repo view "$USER/$REPO_NAME" >/dev/null 2>&1; then
  echo "Repo bestaat al: $USER/$REPO_NAME"
else
  echo "Maak repo $USER/$REPO_NAME ($VIS)…"
  gh repo create "$REPO_NAME" --"$VIS" --source=. --remote=origin --push
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$USER/$REPO_NAME.git" 2>/dev/null || \
  git remote set-url origin "https://github.com/$USER/$REPO_NAME.git"

git push -u origin main

echo "Pages source → GitHub Actions…"
gh api -X PUT "repos/$USER/$REPO_NAME/pages" \
  -f build_type=workflow 2>/dev/null || \
  echo "(Zet handmatig: Settings → Pages → Source: GitHub Actions)"

STABLE="https://${USER}.github.io/${REPO_NAME}/"
bash "$ROOT/scripts/set-stable-url.sh" "$STABLE"
git add hosting.json
git commit -m "Set stable GitHub Pages URL" || true
git push origin main || true

echo ""
echo "Klaar. Wacht ~1–2 min tot Actions groen is, open dan in Safari:"
echo "  $STABLE"
echo "Delen → Zet op beginscherm."
