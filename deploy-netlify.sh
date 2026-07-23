#!/usr/bin/env bash
# Netlify productie-deploy (vanaf 28 juli / wanneer credits OK).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

SITE_ID=""
if [[ -f hosting.json ]]; then
  SITE_ID=$(python3 -c "import json;print(json.load(open('hosting.json')).get('netlifySiteId') or '')" 2>/dev/null || true)
fi
if [[ -z "$SITE_ID" && -f .netlify/state.json ]]; then
  SITE_ID=$(python3 -c "import json;print(json.load(open('.netlify/state.json')).get('siteId') or '')" 2>/dev/null || true)
fi

ARGS=(deploy --prod --dir=.)
if [[ -n "$SITE_ID" ]]; then
  ARGS+=(--site "$SITE_ID")
  echo "Netlify site: $SITE_ID"
fi

set +e
OUT=$(npx --yes netlify "${ARGS[@]}" 2>&1)
CODE=$?
set -e
echo "$OUT"

if [[ $CODE -ne 0 ]]; then
  if echo "$OUT" | grep -qiE 'forbidden|credits|402|billing'; then
    echo ""
    echo "Netlify nog geblokkeerd (credits tot ca. 28 juli?)."
    echo "Gebruik intussen GitHub Pages: zie HOSTING.md"
    exit 2
  fi
  exit $CODE
fi

URL=$(echo "$OUT" | grep -oE 'https://[a-z0-9-]+\.netlify\.app' | head -1 || true)
if [[ -z "$URL" ]]; then
  URL=$(python3 -c "import json;print(json.load(open('hosting.json')).get('netlifyUrl') or '')" 2>/dev/null || true)
fi
if [[ -n "$URL" ]]; then
  bash "$ROOT/scripts/set-stable-url.sh" "$URL"
  echo "hosting.json bijgewerkt → stable = $URL"
fi

echo "Open in Safari op iPad → Zet op beginscherm."
