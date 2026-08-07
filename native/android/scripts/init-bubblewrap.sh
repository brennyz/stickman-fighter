#!/usr/bin/env bash
# Init or refresh Bubblewrap TWA project (Stickman Fighter → Play / sideload APK).
# Requires locally: Node, JDK 17+, Android SDK, `npm i -g @bubblewrap/cli`
# See native/android/BUILD.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "Install Bubblewrap first:" >&2
  echo "  npm i -g @bubblewrap/cli" >&2
  exit 1
fi

if [[ ! -f twa-manifest.json ]]; then
  echo "Missing twa-manifest.json in $ROOT" >&2
  exit 1
fi

ICON_REPO="$(cd "$ROOT/../.." && pwd)/icons/icon-512.png"
if [[ -f "$ICON_REPO" ]]; then
  export BUBBLEWRAP_ICON="$ICON_REPO"
fi

if [[ ! -f app/build.gradle && ! -f app/build.gradle.kts ]]; then
  echo "==> Eerste keer: bubblewrap init vanaf live webmanifest"
  echo "    packageId moet com.brennyz.stickmanfighter blijven"
  echo "    startUrl = /stickman-fighter/speel.html (staat in twa-manifest.json)"
  bubblewrap init \
    --manifest=https://brennyz.github.io/stickman-fighter/manifest.webmanifest
  echo ""
  echo "Als Bubblewrap een nieuwe twa-manifest.json schreef: vergelijk met git en"
  echo "herstel packageId/startUrl/iconUrl uit onze checked-in twa-manifest.json indien nodig."
else
  echo "==> Bestaand project → bubblewrap update"
  bubblewrap update
fi

if [[ ! -f signing/keystore.properties ]]; then
  echo ""
  echo "Let op: nog geen signing/keystore.properties"
  echo "  cp signing/keystore.properties.example signing/keystore.properties"
  echo "  keytool -genkeypair …  (zie BUILD.md)"
fi

echo ""
echo "Volgende stap:"
echo "  cd native/android && bubblewrap build"
echo "  → *.apk (telefoon) · *.aab (Play Console)"
echo "Details: native/android/BUILD.md"
