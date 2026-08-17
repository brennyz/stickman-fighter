#!/usr/bin/env bash
# Vergelijk deze clone met GitHub main en schrijf githubSync in agent-handoff.json.
# Gebruik: ./scripts/github-sync-status.sh
# Optie:  ./scripts/github-sync-status.sh --no-fetch
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DO_FETCH=1
if [[ "${1:-}" == "--no-fetch" ]]; then
  DO_FETCH=0
fi

if [[ "$DO_FETCH" == "1" ]]; then
  git fetch origin main >/dev/null 2>&1 || true
fi

export SF_ROOT="$ROOT"
python3 <<'PY'
import json, os, subprocess
from datetime import datetime, timezone
from pathlib import Path

root = Path(os.environ["SF_ROOT"])

def git(*args):
    r = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True)
    return (r.stdout or "").strip()

local = git("rev-parse", "HEAD")
try:
    remote = git("rev-parse", "origin/main")
except Exception:
    remote = ""
if not remote:
    remote = local

counts = git("rev-list", "--left-right", "--count", "HEAD...origin/main") or "0\t0"
parts = counts.replace("\t", " ").split()
ahead = int(parts[0]) if parts else 0
behind = int(parts[1]) if len(parts) > 1 else 0
# Ignore CRLF-only noise (Windows checkout + WSL/Git-Bash git).
changed = [p for p in git("diff", "--name-only", "--ignore-cr-at-eol").splitlines() if p]
staged = [p for p in git("diff", "--cached", "--name-only", "--ignore-cr-at-eol").splitlines() if p]
untracked = [p for p in git("ls-files", "--others", "--exclude-standard").splitlines() if p]
skip_names = {"health.json", "hosting.json", "LIVE-LINK.txt"}
real_files = []
seen = set()
for path in staged + changed + untracked:
    name = path.split("/")[-1]
    if name in skip_names or path in seen:
        continue
    seen.add(path)
    real_files.append(path)
dirty = bool(real_files)
short_local = local[:7]
short_remote = remote[:7]
equal = local == remote and not dirty and ahead == 0 and behind == 0

pending_upload = []
for path in real_files[:30]:
    kind = "untracked" if path in untracked else "file"
    pending_upload.append({
        "id": "file-" + path.replace("/", "-")[:48],
        "kind": kind,
        "text": path,
    })
if ahead > 0:
    for line in git("log", "--oneline", f"origin/main..HEAD").splitlines():
        pending_upload.append({
            "id": "commit-" + line.split()[0],
            "kind": "commit",
            "text": line,
        })

pending_merge = []
try:
    gh = subprocess.run(
        ["gh", "pr", "list", "--state", "open", "--json", "number,title,isDraft,mergeable,url"],
        cwd=root, capture_output=True, text=True,
    )
except FileNotFoundError:
    gh = None
if gh is not None and gh.returncode == 0 and gh.stdout.strip():
    try:
        for pr in json.loads(gh.stdout):
            mergeable = (pr.get("mergeable") or "").lower()
            draft = bool(pr.get("isDraft"))
            status = "draft" if draft else "open"
            if mergeable == "conflicting":
                status += "-conflicting"
            pending_merge.append({
                "id": f"pr-{pr['number']}",
                "kind": "pr",
                "ref": f"#{pr['number']}",
                "title": pr.get("title", ""),
                "status": status,
                "url": pr.get("url", ""),
                "note": "Niet op main." + (" Conflict — niet automatisch mergen." if "conflicting" in status else ""),
            })
    except json.JSONDecodeError:
        pending_merge = None
elif gh is None:
    pending_merge = None

now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
p = root / "agent-handoff.json"
j = json.loads(p.read_text(encoding="utf-8"))
sync = j.get("githubSync") or {}
if pending_merge is None:
    pending_merge = sync.get("pendingMerge") or []

j["githubSync"] = {
    "policy": sync.get("policy") or "Na betekenisvolle wijzigingen: vraag of we naar GitHub main moeten. Niet stil pushen.",
    "pcEqualsMain": equal,
    "localHead": local,
    "remoteMainHead": remote,
    "ahead": ahead,
    "behind": behind,
    "dirty": dirty,
    "lastChecked": now,
    "lastAsked": sync.get("lastAsked"),
    "pendingUpload": pending_upload,
    "pendingMerge": pending_merge,
}
ct = j.get("codeTruth") or {}
ct["localMainHead"] = local
ct["remoteMainHead"] = remote
ct["updated"] = now
j["codeTruth"] = ct
p.write_text(json.dumps(j, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

print("── GitHub sync ──")
print(f"PC HEAD:     {short_local}  {git('log', '-1', '--format=%s')}")
print(f"GitHub main: {short_remote}")
if equal:
    print("Status:      PC == GitHub main (niets te uploaden)")
else:
    bits = []
    if dirty:
        bits.append("uncommitted files")
    if ahead:
        bits.append(f"{ahead} commit(s) ahead")
    if behind:
        bits.append(f"{behind} commit(s) behind")
    print("Status:      NIET gelijk — " + ", ".join(bits) or "verschil")
if pending_upload:
    print("Nog te uploaden:")
    for item in pending_upload[:20]:
        print(f"  • {item['text']}")
else:
    print("Nog te uploaden: (leeg)")
if pending_merge:
    print("Open PRs nog niet op main:")
    for item in pending_merge:
        print(f"  • {item['ref']} {item['title']} [{item['status']}]")
else:
    print("Open PRs nog niet op main: (geen)")
PY
