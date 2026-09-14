#!/usr/bin/env python3
"""Resolve recurring mega-merge conflicts in handoff docs.

Keep HEAD (stack) as the source of truth for structure/versions, then
union unique wishlist items, session log lines, and IMPROVEMENT.md agent-log rows.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git_show(rev: str, path: str) -> str | None:
    r = subprocess.run(
        ["git", "show", f"{rev}:{path}"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        return None
    return r.stdout


def resolve_handoff(ours_txt: str, theirs_txt: str) -> str:
    ours = json.loads(ours_txt)
    theirs = json.loads(theirs_txt)

    # Wishlist: ours first, then unique theirs by id
    seen = {w.get("id") for w in ours.get("userWishlist", [])}
    extra = [w for w in theirs.get("userWishlist", []) if w.get("id") not in seen]
    ours["userWishlist"] = ours.get("userWishlist", []) + extra

    # sessionLog: ours first, then unique theirs by (at, summary)
    slog = ours.get("sessionLog", [])
    slog_seen = {(e.get("at"), e.get("summary")) for e in slog}
    for e in theirs.get("sessionLog", []):
        key = (e.get("at"), e.get("summary"))
        if key not in slog_seen:
            slog.append(e)
            slog_seen.add(key)
    ours["sessionLog"] = slog[:25]

    # pendingMerge: keep ours; do not import stale PR holds from feature branches
    return json.dumps(ours, indent=2, ensure_ascii=False) + "\n"


def resolve_improvement(conflict_txt: str, ours_txt: str, theirs_txt: str) -> str:
    """Union agent-log table rows; keep HEAD body otherwise."""
    def log_rows(txt: str) -> list[str]:
        rows = []
        in_table = False
        for line in txt.splitlines():
            if line.startswith("| Datum (UTC)"):
                in_table = True
                continue
            if in_table:
                if line.startswith("|---"):
                    continue
                if line.startswith("|"):
                    rows.append(line.rstrip())
                else:
                    break
        return rows

    ours_rows = log_rows(ours_txt)
    theirs_rows = log_rows(theirs_txt)
    seen = set(ours_rows)
    extra = [r for r in theirs_rows if r not in seen]

    out_lines = []
    in_conflict = False
    conflict_buf = []
    i = 0
    lines = conflict_txt.splitlines(keepends=True)
    # If the only conflicts are in the agent-log table header block, rebuild that table.
    # Safer: take ours file and splice extra rows after the table header.
    ours_lines = ours_txt.splitlines()
    skip_sep = False
    inserted = False
    rebuilt = []
    for line in ours_lines:
        if (not inserted) and line.startswith("| Datum (UTC)"):
            rebuilt.append(line)
            rebuilt.append("|-------------|-----|--------|")
            rebuilt.extend(extra)
            inserted = True
            skip_sep = True
            continue
        if skip_sep and line.startswith("|---"):
            skip_sep = False
            continue
        rebuilt.append(line)
    if not inserted:
        return ours_txt
    return "\n".join(rebuilt) + "\n"


HUNK_RE = re.compile(r"<<<<<<<[^\n]*\n(.*?)=======\n(.*?)>>>>>>>[^\n]*\n", re.S)
VER_NORM_RE = re.compile(
    r"1\.18\.\d+|v=\d+|stickfighter-app-v\d+|__SF_EXPECT_REV = \d+|"
    r"__SF_EXPECT_APP = '1\.18\.\d+'|SW_CACHE_REV = \d+|appVersionName\": \"1\.18\.\d+\""
)


def _norm_ver(s: str) -> str:
    return VER_NORM_RE.sub("N", s)


def resolve_version_hunks(txt: str) -> str:
    def repl(m: re.Match[str]) -> str:
        ours, theirs = m.group(1), m.group(2)
        if _norm_ver(ours) == _norm_ver(theirs):
            return ours
        return m.group(0)

    return HUNK_RE.sub(repl, txt)


def resolve_package(ours_txt: str, theirs_txt: str) -> str:
    ours = json.loads(ours_txt)
    theirs = json.loads(theirs_txt)
    o_scripts = ours.get("scripts", {})
    t_scripts = theirs.get("scripts", {})
    # Union keys; for "test" concatenate unique smoke steps from theirs.
    merged = dict(o_scripts)
    for k, v in t_scripts.items():
        if k not in merged:
            merged[k] = v
        elif k == "test" and isinstance(v, str) and isinstance(merged[k], str):
            # Insert any smoke:* tokens from theirs that ours lacks, before "roll" isn't here.
            ours_parts = merged[k].split(" && ")
            theirs_parts = v.split(" && ")
            have = set(ours_parts)
            out = list(ours_parts)
            for p in theirs_parts:
                if p not in have:
                    # splice before last item if last is long, else append
                    out.append(p)
                    have.add(p)
            merged[k] = " && ".join(out)
    ours["scripts"] = merged
    ours["version"] = ours.get("version")  # keep ours
    return json.dumps(ours, indent=2, ensure_ascii=False) + "\n"


def checkout(path: str, which: str) -> None:
    subprocess.check_call(["git", "checkout", f"--{which}", "--", path], cwd=ROOT)


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "docs"
    unmerged = subprocess.check_output(
        ["git", "diff", "--name-only", "--diff-filter=U"],
        cwd=ROOT,
        text=True,
    ).splitlines()

    for path in unmerged:
        if path == "agent-handoff.json":
            ours = git_show(":2", path)
            theirs = git_show(":3", path)
            if ours is None or theirs is None:
                print("missing stages for", path)
                continue
            (ROOT / path).write_text(resolve_handoff(ours, theirs), encoding="utf-8")
            subprocess.check_call(["git", "add", "--", path], cwd=ROOT)
            print("resolved", path, "(union wishlist+sessionLog, keep ours otherwise)")
        elif path == "IMPROVEMENT.md":
            ours = git_show(":2", path)
            theirs = git_show(":3", path)
            conflict = (ROOT / path).read_text(encoding="utf-8")
            (ROOT / path).write_text(resolve_improvement(conflict, ours, theirs), encoding="utf-8")
            subprocess.check_call(["git", "add", "--", path], cwd=ROOT)
            print("resolved", path, "(union agent-log rows)")
        elif path in ("HANDOFF-ZOEKINDEX.md", ".cursor/agent-handoffs/handoff.md"):
            ours = git_show(":2", path) or ""
            theirs = git_show(":3", path) or ""
            # Prefer ours, append theirs-only trailing unique lines if file is short index.
            if path == "HANDOFF-ZOEKINDEX.md":
                ours_lines = ours.splitlines()
                theirs_lines = theirs.splitlines()
                seen = set(ours_lines)
                extra = [ln for ln in theirs_lines if ln not in seen and ln.startswith("|")]
                if extra:
                    # insert extra table rows after first table header block
                    out = []
                    inserted = False
                    for ln in ours_lines:
                        out.append(ln)
                        if (not inserted) and ln.startswith("|---"):
                            out.extend(extra)
                            inserted = True
                    (ROOT / path).write_text("\n".join(out) + "\n", encoding="utf-8")
                else:
                    checkout(path, "ours")
            else:
                checkout(path, "ours")
            subprocess.check_call(["git", "add", "--", path], cwd=ROOT)
            print("resolved", path)
        elif path == "game.js":
            checkout(path, "ours")
            subprocess.check_call(["git", "add", "--", path], cwd=ROOT)
            print("resolved", path, "(ours; rebuild later)")
        elif path.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp3", ".wav", ".ogg", ".mp4")):
            checkout(path, "theirs")
            subprocess.check_call(["git", "add", "--", path], cwd=ROOT)
            print("resolved", path, "(theirs binary)")

    # Second pass: version-only hunks keep ours; package.json unions scripts.
    still = subprocess.check_output(
        ["git", "diff", "--name-only", "--diff-filter=U"],
        cwd=ROOT,
        text=True,
    ).splitlines()
    for path in still:
        raw = (ROOT / path).read_text(encoding="utf-8")
        if path == "package.json":
            ours = git_show(":2", path)
            theirs = git_show(":3", path)
            if ours and theirs:
                (ROOT / path).write_text(resolve_package(ours, theirs), encoding="utf-8")
                subprocess.check_call(["git", "add", "--", path], cwd=ROOT)
                print("resolved", path, "(union scripts, keep ours version)")
                continue
        new = resolve_version_hunks(raw)
        if "<<<<<<<" not in new:
            (ROOT / path).write_text(new, encoding="utf-8")
            subprocess.check_call(["git", "add", "--", path], cwd=ROOT)
            print("resolved", path, "(version-only hunks → ours)")
        elif new != raw:
            (ROOT / path).write_text(new, encoding="utf-8")
            print("partial", path, "(some version hunks cleared)")

    still = subprocess.check_output(
        ["git", "diff", "--name-only", "--diff-filter=U"],
        cwd=ROOT,
        text=True,
    ).splitlines()
    print("still unmerged:", still or "(none)")
    return 0 if not still else 1


if __name__ == "__main__":
    raise SystemExit(main())
