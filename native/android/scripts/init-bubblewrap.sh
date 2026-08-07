#!/usr/bin/env bash
# Optional helper: init or refresh Bubblewrap project from checked-in twa-manifest.json.
# Docs-only scaffold — does not commit secrets. Requires: npm i -g @bubblewrap/cli, JDK, Android SDK.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "Install Bubblewrap first: npm i -g @bubblewrap/cli" >&2
  exit 1
fi

if [[ ! -f twa-manifest.json ]]; then
  echo "Missing twa-manifest.json in $ROOT" >&2
  exit 1
fi

if [[ ! -f app/build.gradle && ! -f app/build.gradle.kts ]]; then
  echo "No Gradle app yet — running bubblewrap init from live web manifest…"
  echo "After init, ensure packageId=com.brennyz.stickmanfighter and startUrl=/stickman-fighter/speel.html"
  bubblewrap init \
    --manifest=https://brennyz.github.io/stickman-fighter/manifest.webmanifest
else
  echo "Updating existing Bubblewrap project…"
  bubblewrap update
fi

echo ""
echo "Next: configure signing/keystore.properties (from example), then: bubblewrap build"
echo "Output: *.aab for Play Console · do not commit keystores"
