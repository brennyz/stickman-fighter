#!/usr/bin/env bash
# Agent-status: alles wat een (nieuwe) agent moet weten in één overzicht.
# Gebruik: ./scripts/agent-status.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "════════ STICKMAN FIGHTER — AGENT STATUS ════════"
echo
echo "── Versie (code) ──"
grep -m1 "APP_VERSION" src/core/storage.js 2>/dev/null || grep -m1 "APP_VERSION" game.js || true
grep -m1 "SW_CACHE_REV" src/core/storage.js 2>/dev/null || grep -m1 "SW_CACHE_REV" game.js || true
grep -m1 "const CACHE" sw.js || true
grep -m1 "game.js?v=" index.html || true
echo "src modules: $(wc -l < src/manifest.json 2>/dev/null | tr -d ' ') files · npm run build → game.js"
echo
echo "── Git ──"
echo "branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
git log --oneline -6 2>/dev/null || true
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo "LET OP: uncommitted wijzigingen:"
  git status --short | head -15
fi
LOCAL_HEAD="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
REMOTE_HEAD="$(git rev-parse --short origin/main 2>/dev/null || echo '?')"
if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" ]]; then
  echo "sync: PC == origin/main ($LOCAL_HEAD)"
else
  echo "sync: PC ($LOCAL_HEAD) ≠ origin/main ($REMOTE_HEAD) — zie githubSync / ./scripts/github-sync-status.sh"
fi
echo
echo "── GitHub wachtlijst ──"
python3 - <<'PY'
import json
from pathlib import Path
p = Path("agent-handoff.json")
if not p.exists():
    print("(geen agent-handoff.json)")
else:
    j = json.loads(p.read_text(encoding="utf-8"))
    sync = j.get("githubSync") or {}
    up = sync.get("pendingUpload") or []
    mg = sync.get("pendingMerge") or []
    print("pcEqualsMain:", sync.get("pcEqualsMain"))
    if up:
        print("nog te uploaden:")
        for item in up[:12]:
            print("  •", item.get("text") or item.get("title") or item.get("id"))
    else:
        print("nog te uploaden: (leeg)")
    if mg:
        print("open PRs niet op main:")
        for item in mg[:8]:
            print(f"  • {item.get('ref','?')} {item.get('title','')} [{item.get('status','')}]")
    else:
        print("open PRs niet op main: (geen)")
PY
echo
echo "── Handoff (open wensen) ──"
python3 - <<'PY'
import json
from pathlib import Path
p = Path("agent-handoff.json")
if not p.exists():
    print("(geen agent-handoff.json)")
else:
    j = json.loads(p.read_text())
    print("canonical agent:", j.get("canonicalAgent", {}).get("url", "?"))
    ct = j.get("codeTruth", {})
    print("codeTruth:", ct.get("appVersion"), "/", ct.get("swCache"), "/", ct.get("featureBranch", ""))
    for w in j.get("userWishlist", []):
        mark = "[open]" if w.get("status") == "open" else f"[{w.get('status','?')}]"
        print(f"  {mark} {w.get('id')}: {w.get('text', '')[:90]}")
    log = j.get("sessionLog", [])
    if log:
        print("laatste sessie:", log[0].get("at", "?"), "-", log[0].get("summary", "")[:100])
PY
echo
echo "── d20 ──"
python3 - <<'PY'
import json
from pathlib import Path
p = Path("improvement-d20-bag.json")
if p.exists():
    j = json.loads(p.read_text())
    pend = j.get("pending")
    print("pending:", (f"d{pend['face']} — {pend.get('category','')}" if pend else "geen"))
    print("remaining in zak:", len(j.get("remaining", [])), "· cycles af:", j.get("cyclesCompleted", 0))
PY
echo
echo "── Delen / spelen ──"
python3 - <<'PY'
import json
from pathlib import Path
p = Path("hosting.json")
if p.exists():
    j = json.loads(p.read_text())
    print("deel-link (share):", j.get("bookmarkShare") or j.get("primary", "?"))
    print("iPad bookmark:    ", j.get("bookmarkPages", "?"))
    print("tunnel:           ", j.get("bookmarkTunnel", "?"))
PY
echo
echo "Meer context: AGENTS.md · IMPROVEMENT.md (agent log) · agent-handoff.json"
echo "═════════════════════════════════════════════════"
