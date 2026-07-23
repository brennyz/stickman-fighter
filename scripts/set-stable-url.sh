#!/usr/bin/env bash
# Zet vaste speel-URL in hosting.json (GitHub Pages of Netlify).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo "Gebruik: $0 https://jouw-site.netlify.app" >&2
  exit 1
fi
URL="${URL%/}/"
python3 - <<PY
import json
from pathlib import Path
from datetime import datetime, timezone
p = Path("$ROOT/hosting.json")
data = json.loads(p.read_text()) if p.exists() else {}
data["stable"] = "$URL"
data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
host = "$URL"
if "github.io" in host:
    data["githubPages"] = "$URL"
    data["stableHint"] = "Vaste GitHub Pages-link — ideaal voor iPad PWA."
elif "netlify.app" in host:
    data["netlifyUrl"] = "$URL"
    data["stableHint"] = "Vaste Netlify-link — ideaal voor iPad PWA."
else:
    data["stableHint"] = "Vaste speel-link ingesteld."
p.write_text(json.dumps(data, indent=2) + "\n")
print("stable →", "$URL")
PY
