#!/usr/bin/env bash
# Markeer gerolde categorie als afgerond in improvement-d20-bag.json (na commit).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FACE="${1:-}"
NOTE="${2:-}"
VERSION="${3:-}"
if [[ -z "$FACE" || -z "$NOTE" ]]; then
  echo "Usage: $0 <d#> \"korte note\" [app-version]" >&2
  exit 1
fi
export SF_ROOT="$ROOT" SF_FACE="$FACE" SF_NOTE="$NOTE" SF_VER="$VERSION"
python3 <<'PY'
import json, os
from datetime import datetime, timezone
from pathlib import Path

root = Path(os.environ["SF_ROOT"])
bag_path = root / "improvement-d20-bag.json"
face = int(os.environ["SF_FACE"])
note = os.environ["SF_NOTE"]
ver = os.environ.get("SF_VER") or ""
bag = json.loads(bag_path.read_text())
entry = {
    "face": face,
    "note": note,
    "version": ver,
    "doneAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "cycle": bag.get("cyclesCompleted", 0),
}
bag.setdefault("implemented", []).append(entry)
bag["implemented"] = bag["implemented"][-80:]
bag_path.write_text(json.dumps(bag, indent=2) + "\n")
print("d" + str(face) + " gemarkeerd als af:", note)
PY
