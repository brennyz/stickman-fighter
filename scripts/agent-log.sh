#!/usr/bin/env bash
# Voeg een sessie-regel toe aan agent-handoff.json (sessionLog + evt. wishlist-status).
# Gebruik:
#   ./scripts/agent-log.sh "korte samenvatting van wat er gedaan is"
#   ./scripts/agent-log.sh "samenvatting" --done wish-id      (markeer wens done-in-code)
#   ./scripts/agent-log.sh "samenvatting" --wish "nieuwe user-wens tekst"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUMMARY="${1:-}"
if [[ -z "$SUMMARY" ]]; then
  echo "Gebruik: $0 \"samenvatting\" [--done wish-id] [--wish \"tekst\"]" >&2
  exit 1
fi
shift || true
DONE_ID=""
NEW_WISH=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --done) DONE_ID="${2:-}"; shift 2 ;;
    --wish) NEW_WISH="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done
export SF_ROOT="$ROOT" SF_SUMMARY="$SUMMARY" SF_DONE="$DONE_ID" SF_WISH="$NEW_WISH"
python3 <<'PY'
import json, os
from datetime import datetime, timezone
from pathlib import Path

p = Path(os.environ["SF_ROOT"]) / "agent-handoff.json"
j = json.loads(p.read_text())
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
today = now[:10]

j.setdefault("sessionLog", []).insert(0, {"at": now, "summary": os.environ["SF_SUMMARY"]})
j["sessionLog"] = j["sessionLog"][:25]

done = os.environ.get("SF_DONE")
if done:
    for w in j.get("userWishlist", []):
        if w.get("id") == done:
            w["status"] = "done-in-code"
            w["updated"] = today

wish = os.environ.get("SF_WISH")
if wish:
    j.setdefault("userWishlist", []).insert(0, {
        "id": "w-" + now.replace(":", "").replace("-", "")[:15],
        "from": "user",
        "text": wish,
        "status": "open",
        "updated": today,
    })

p.write_text(json.dumps(j, indent=2, ensure_ascii=False) + "\n")
print("sessionLog +1", ("· done: " + done) if done else "", ("· wens: " + wish[:40]) if wish else "")
PY
