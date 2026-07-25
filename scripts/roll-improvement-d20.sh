#!/usr/bin/env bash
# Ralph Wiggum d20 v3 — roll één verbeter-thema (geen herhaling binnen cyclus).
#
# Commands:
#   ./scripts/roll-improvement-d20.sh           # roll (preflight; open pending → backlog + nieuwe roll)
#   ./scripts/roll-improvement-d20.sh status
#   ./scripts/roll-improvement-d20.sh history
#   ./scripts/roll-improvement-d20.sh unroll    # zet pending terug in de zak (geen nieuwe roll)
#   ./scripts/roll-improvement-d20.sh backlog   # wachtrij: gerold maar nog niet uitgewerkt
#   ./scripts/roll-improvement-d20.sh pick 11   # zet d11 uit backlog als PENDING (geen roll)
#   ./scripts/roll-improvement-d20.sh preflight # node --check + smokes + bag verify
#   ./scripts/roll-improvement-d20.sh doctor    # diepere gezondheidscheck (HTML/versie/SW/handshake)
#   ./scripts/roll-improvement-d20.sh verify    # bag integrity (geen overlap pending/remaining)
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SF_ROOT="$ROOT"
export SF_MODE="${1:-roll}"
export SF_PICK_FACE="${2:-}"

run_preflight() {
  echo ""
  echo "PREFLIGHT"
  if ! node --check "$ROOT/game.js"; then
    echo "FAIL: node --check game.js"
    return 1
  fi
  echo "OK  node --check game.js"
  if ! node --check "$ROOT/install.js"; then
    echo "FAIL: node --check install.js"
    return 1
  fi
  echo "OK  node --check install.js"
  if ! node --check "$ROOT/sw.js"; then
    echo "FAIL: node --check sw.js"
    return 1
  fi
  echo "OK  node --check sw.js"
  if ! node "$ROOT/scripts/smoke-load-game.mjs"; then
    echo "FAIL: smoke-load-game.mjs — game.js crasht bij load (handlers binden niet)"
    return 1
  fi
  echo "OK  smoke-load-game.mjs"
  if [[ -f "$ROOT/scripts/smoke-html-structure.mjs" ]]; then
    if ! node "$ROOT/scripts/smoke-html-structure.mjs"; then
      echo "FAIL: smoke-html-structure — canvas#game nested / tag balance"
      return 1
    fi
    echo "OK  smoke-html-structure.mjs"
  fi
  local ver sw gsw
  ver="$(rg -o "APP_VERSION = '[^']+'" "$ROOT/src/core/storage.js" | head -1 || rg -o "APP_VERSION = '[^']+'" "$ROOT/game.js" | head -1 || true)"
  sw="$(rg -o "stickfighter-app-v[0-9]+" "$ROOT/sw.js" | head -1 || true)"
  gsw="$(rg -o "SW_CACHE_REV = [0-9]+" "$ROOT/src/core/storage.js" | head -1 | rg -o "[0-9]+" || rg -o "SW_CACHE_REV = [0-9]+" "$ROOT/game.js" | head -1 | rg -o "[0-9]+" || true)"
  sw_n="$(echo "$sw" | rg -o "[0-9]+$" || true)"
  if [[ -n "$gsw" && -n "$sw_n" && "$gsw" != "$sw_n" ]]; then
    echo "FAIL: SW mismatch game.js SW_CACHE_REV=$gsw vs sw.js $sw"
    return 1
  fi
  local expect html_rev
  expect="$(rg -o "__SF_EXPECT_REV = [0-9]+" "$ROOT/index.html" | head -1 | rg -o "[0-9]+$" || true)"
  html_rev="$(rg -o "game\\.js\\?v=[0-9]+" "$ROOT/index.html" | head -1 | rg -o "[0-9]+$" || true)"
  if [[ -n "$gsw" && -n "$expect" && "$gsw" != "$expect" ]]; then
    echo "FAIL: handshake mismatch SW_CACHE_REV=$gsw vs __SF_EXPECT_REV=$expect"
    return 1
  fi
  if [[ -n "$gsw" && -n "$html_rev" && "$gsw" != "$html_rev" ]]; then
    echo "FAIL: index.html game.js?v=$html_rev ≠ SW_CACHE_REV=$gsw"
    return 1
  fi
  echo "App: ${ver:-?} · SW: ${sw:-?} · HTML expect: ${expect:-?}"
  if ! python3 - "$ROOT/improvement-d20-bag.json" <<'PYVERIFY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
if not p.exists():
    print("OK  bag (missing — first roll creates)")
    sys.exit(0)
bag = json.loads(p.read_text())
rem = sorted(set(int(x) for x in bag.get("remaining") or [] if 1 <= int(x) <= 20))
pend = bag.get("pending")
pend_f = int(pend.get("face", 0)) if pend else 0
cyc = int(bag.get("cyclesCompleted", 0))
done_c = set(int(x["face"]) for x in bag.get("implemented") or [] if x.get("face") is not None and int(x.get("cycle", -1)) == cyc)
errs = []
if len(rem) != len(set(rem)):
    errs.append("remaining has duplicates")
if pend_f and pend_f in rem:
    errs.append(f"pending d{pend_f} still in remaining")
if pend_f and pend_f in done_c:
    errs.append(f"pending d{pend_f} already implemented this cycle")
for f in rem:
    if f in done_c:
        errs.append(f"d{f} in remaining but implemented cycle {cyc}")
if len(rem) + len(done_c) + (1 if pend_f else 0) > 20:
    errs.append("face count overflow")
if errs:
    print("FAIL: bag verify — " + "; ".join(errs))
    sys.exit(1)
print("OK  bag verify")
PYVERIFY
  then
    return 1
  fi
  echo ""
}

run_doctor() {
  echo ""
  echo "RALPH d20 — DOCTOR"
  local fail=0
  run_preflight || fail=1
  if ! rg -q "function gamblePending" "$ROOT/src/systems/missions.js"; then
    echo "FAIL: gamblePending() ontbreekt — dobbel→menu races komen terug"
    fail=1
  else
    echo "OK  gamblePending guard"
  fi
  if ! rg -q "__sfSafeToReload" "$ROOT/src/boot/loop.js"; then
    echo "FAIL: __sfSafeToReload ontbreekt — SW kan midden in flow herladen"
    fail=1
  else
    echo "OK  __sfSafeToReload"
  fi
  if ! rg -q "needsFreshJs" "$ROOT/install.js"; then
    echo "FAIL: needsFreshJs ontbreekt in install.js"
    fail=1
  else
    echo "OK  needsFreshJs (alleen herladen bij échte JS-mismatch)"
  fi
  if ! rg -q "safeToReload" "$ROOT/install.js"; then
    echo "FAIL: safeToReload ontbreekt in install.js"
    fail=1
  else
    echo "OK  safeToReload (geen reload tijdens play/dobbel)"
  fi
  # Beide bekende reloads: nukeSwAndReload (expliciet Verse versie) + tryReload (na safeToReload).
  local reload_n
  reload_n="$(rg -c "location\\.reload\\(\\)" "$ROOT/install.js" || true)"
  if [[ "${reload_n:-0}" -eq 2 ]]; then
    echo "OK  location.reload ×2 (nuke + idle) — play-safe pad"
  else
    echo "WARN: install.js heeft $reload_n× location.reload (verwacht 2)"
  fi
  if [[ -f "$ROOT/scripts/smoke-menu-hub.mjs" ]]; then
    if node "$ROOT/scripts/smoke-menu-hub.mjs"; then
      echo "OK  smoke-menu-hub"
    else
      echo "FAIL: smoke-menu-hub"
      fail=1
    fi
  fi
  echo ""
  if [[ "$fail" -ne 0 ]]; then
    echo "DOCTOR FAIL — fix bovenstaande vóór roll/ship"
    return 1
  fi
  echo "DOCTOR OK — klaar voor roll / ship"
  echo ""
  return 0
}

if [[ "$SF_MODE" == "preflight" ]]; then
  run_preflight
  exit $?
fi

if [[ "$SF_MODE" == "doctor" ]]; then
  run_doctor
  exit $?
fi

# Voor echte rolls: korte preflight (fail = geen roll)
if [[ "$SF_MODE" == "roll" || "$SF_MODE" == "force" ]]; then
  if ! run_preflight; then
    echo "Geen roll — fix load-crash eerst (zie Chrome: tap feedback zonder actie)." >&2
    exit 2
  fi
fi

python3 <<'PY'
import json, os, random, sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(os.environ["SF_ROOT"])
bag_path = root / "improvement-d20-bag.json"
mode = os.environ.get("SF_MODE", "roll")
pick_face = os.environ.get("SF_PICK_FACE", "").strip()

categories = {
    1: "Combat feel — hits, knockback, frame data, fairness",
    2: "Training vs RabbitRobot — AI, rounds, difficulty curve",
    3: "Versus 2P — split controls, rematch, char balance",
    4: "Avontuur — levels, waves, boss pacing, stars",
    5: "Performance — FPS, FX caps, resize, low-end iPad",
    6: "Audio — BGM loops, SFX mix, mute paths",
    7: "Save & backup — import/export, corruptie, migratie",
    8: "PWA & offline — SW cache, install, standalone",
    9: "iPad touch — knoppen, joystick, geen mis-taps",
    10: "Toegankelijkheid — reduced motion, contrast, tekst",
    11: "Menu & navigatie — terug, flow, grote knoppen",
    12: "Content — monsters, wapens, rariteit, dex",
    13: "Missies & achievements — daily loop, beloningen",
    14: "Visuele FX — particles, banners, Rasengan polish",
    15: "Onboarding — tips, eerste speelminuut, help",
    16: "Hosting & links — Pages, tunnel, stable URL",
    17: "Stabiliteit — try/catch, errors, edge cases",
    18: "Character select — roster UI, stats, random duo",
    19: "Muur & minigames — combo, timer, record",
    20: "Code health — kleine refactors, geen gameplay-break",
}

focus = {
    1: "Hit-stop / i-frames / feedback — géén globale dmg×.",
    2: "Telegraphen + 1 AI-tweak — geen one-shot kills.",
    3: "HUD/rematch/spawn — geen roster dmg-herbalancering.",
    4: "Stars/waves/pacing UI — geen xp/hp curve ×.",
    5: "Caps/debounce/DPR — meet vóór nieuwe FX.",
    6: "Volumes/mute in pauze — geen grote nieuwe assets.",
    7: "sanitizeSave/export hints — SAVE_KEY frozen.",
    8: "SW bump + offline + no mid-play reload — network-first HTML.",
    9: "touch-action, hit slop, dual pad — menu blijft klikbaar.",
    10: "prefers-reduced-motion + contrast — geen flits-FX.",
    11: "goBack/scroll/screen-transities — één flow-fix; geen recover tijdens dobbel.",
    12: "Dex/cosmetic/achievement — geen 50 levels.",
    13: "Daily/claim UX copy — geen grind ×10.",
    14: "Particle cap + 1 juice — respecteer Lite FX.",
    15: "Max 1 toast/modus — help tekst, geen spam.",
    16: "hosting.json/Pages link — tunnel niet primair.",
    17: "try/catch + user toast — guards tijdens gamble/play; geen silent fail.",
    18: "Char select UI — stats preview, geen dmg tweak; HTML tags sluiten.",
    19: "Muur feedback/record — timer/combo hints.",
    20: "Rename/comments/dead code — zero gedrag wijzigen.",
}

def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def load_bag():
    if not bag_path.exists():
        return {
            "version": 3,
            "cyclesCompleted": 0,
            "remaining": list(range(1, 21)),
            "pending": None,
            "lastRoll": None,
            "history": [],
            "implemented": [],
        }
    bag = json.loads(bag_path.read_text())
    migrate(bag)
    return bag

def implemented_faces(bag, cycle=None):
    out = set()
    for x in bag.get("implemented") or []:
        if x.get("face") is None:
            continue
        if cycle is not None and int(x.get("cycle", -1)) != int(cycle):
            continue
        out.add(int(x["face"]))
    return out

def queue_roll(bag, roll, reason="skipped"):
    if not roll:
        return
    face = int(roll.get("face", 0))
    if not face:
        return
    done = implemented_faces(bag, bag.get("cyclesCompleted", 0))
    if face in done:
        return
    bag.setdefault("rollBacklog", [])
    bl = bag["rollBacklog"]
    bl = [x for x in bl if int(x.get("face", 0)) != face]
    bl.insert(0, {
        "face": face,
        "category": roll.get("category") or categories.get(face, ""),
        "focus": focus.get(face, ""),
        "rolledAt": roll.get("rolledAt") or utc_now(),
        "queuedAt": utc_now(),
        "reason": reason,
        "cycle": bag.get("cyclesCompleted", 0),
    })
    bag["rollBacklog"] = bl[:24]

def backlog_faces(bag):
    return [int(x.get("face", 0)) for x in bag.get("rollBacklog") or [] if x.get("face") is not None]

def migrate(bag):
    ver = int(bag.get("version", 1))
    bag.setdefault("implemented", [])
    bag.setdefault("history", [])
    bag.setdefault("remaining", list(range(1, 21)))
    bag.setdefault("cyclesCompleted", 0)
    bag.setdefault("rollBacklog", [])
    if ver < 3:
        bag["version"] = 3
        bag.setdefault("pending", None)
        # Herstel open roll: lastRoll niet in implemented → pending
        lr = bag.get("lastRoll")
        if lr and bag.get("pending") is None:
            done = implemented_faces(bag)
            face = int(lr.get("face", 0))
            if face and face not in done:
                bag["pending"] = dict(lr)
                rem = [int(x) for x in bag.get("remaining") or []]
                bag["remaining"] = [x for x in rem if x != face]
    # Eenmalige backfill: cyclus-rolls die nog niet af zijn → backlog
    if not bag.get("rollBacklog") and bag.get("history"):
        cyc = int(bag.get("cyclesCompleted", 0))
        done_c = implemented_faces(bag, cyc)
        seen = set()
        for h in reversed(bag.get("history") or []):
            if int(h.get("cycle", -1)) != cyc:
                continue
            f = int(h.get("face", 0))
            if not f or f in done_c or f in seen:
                continue
            pend = bag.get("pending")
            if pend and int(pend.get("face", 0)) == f:
                continue
            seen.add(f)
            queue_roll(bag, h, reason="backfill")
    bag["version"] = 3
    # Dedup remaining, clamp 1..20
    rem = []
    seen = set()
    for x in bag.get("remaining") or []:
        n = int(x)
        if 1 <= n <= 20 and n not in seen:
            seen.add(n)
            rem.append(n)
    bag["remaining"] = rem

def save_bag(bag):
    bag_path.write_text(json.dumps(bag, indent=2) + "\n")

def print_status(bag):
    rem = bag.get("remaining") or []
    pending = bag.get("pending")
    print("")
    print("RALPH d20 — STATUS (v4 tooling · bag v3)")
    print("Cyclus:", bag.get("cyclesCompleted", 0))
    print("Nog in zak:", len(rem), "/20")
    if pending:
        face = pending.get("face")
        print("PENDING: d" + str(face), "—", pending.get("category", categories.get(face, "")))
        print("Focus:", focus.get(int(face), ""))
        print("→ Werk dit af, dan: ./scripts/mark-d20-done.sh", face, '"korte note" 1.x.y')
        print("→ Of terug in zak: ./scripts/roll-improvement-d20.sh unroll")
    else:
        print("PENDING: (geen)")
    if bag.get("lastRoll"):
        lr = bag["lastRoll"]
        print("Laatste rol: d" + str(lr.get("face")) + " — " + str(lr.get("category", "")))
    done = bag.get("implemented") or []
    if done:
        last = done[-1]
        print("Laatst af: d" + str(last.get("face")), "·", last.get("note", ""), "·", last.get("version", ""))
    print("Resterend:", ", ".join("d" + str(x) for x in sorted(rem)) or "(leeg → nieuwe cyclus bij roll)")
    bl = bag.get("rollBacklog") or []
    if bl:
        print("Backlog (uit te werken):", ", ".join("d" + str(x.get("face")) for x in bl[:8]))
        if len(bl) > 8:
            print("  … +" + str(len(bl) - 8) + " meer · pick d# · ./scripts/roll-improvement-d20.sh backlog")
    print("Doctor: ./scripts/roll-improvement-d20.sh doctor  ·  Preflight: … preflight")
    print("Handoff-tips (recente hard-bugs):")
    print("  · canvas#game moet directe <body>-child zijn (smoke:html)")
    print("  · SW mag NIET herladen tijdens play/dobbel (__sfSafeToReload)")
    print("  · KETSBAM_BUILD_DUR moet bestaan (adventure update crash → blauw)")
    print("")

def print_backlog(bag):
    bl = bag.get("rollBacklog") or []
    print("")
    print("RALPH d20 — BACKLOG (uit te werken)")
    if not bl:
        print("(leeg — roll zet overgeslagen faces hier)")
        print("")
        return
    for i, x in enumerate(bl):
        print("  " + str(i + 1) + ". d" + str(x.get("face")), "·", (x.get("category") or "")[:52])
        print("     focus:", (x.get("focus") or focus.get(int(x.get("face", 0)), ""))[:60])
    print("")
    print("Pick: ./scripts/roll-improvement-d20.sh pick <d#>")
    print("Af:   ./scripts/mark-d20-done.sh <d#> \"note\" 1.x.y")
    print("")

def print_history(bag):
    hist = bag.get("history") or []
    print("")
    print("RALPH d20 — HISTORY (laatste 12)")
    for h in hist[-12:]:
        print("  d" + str(h.get("face")), "·", h.get("rolledAt", ""), "·", h.get("category", "")[:48])
    impl = bag.get("implemented") or []
    print("Implemented (laatste 8):")
    for x in impl[-8:]:
        print("  d" + str(x.get("face")), "·", x.get("version", ""), "·", x.get("note", ""))
    print("")

bag = load_bag()

if mode == "status":
    print_status(bag)
    save_bag(bag)  # migrate persist
    sys.exit(0)

if mode == "history":
    print_history(bag)
    save_bag(bag)
    sys.exit(0)

if mode == "backlog":
    print_backlog(bag)
    save_bag(bag)
    sys.exit(0)

if mode == "pick":
    if not pick_face.isdigit():
        print("Usage: pick <d#>  (bijv. pick 11)", file=sys.stderr)
        sys.exit(1)
    want = int(pick_face)
    bl = bag.get("rollBacklog") or []
    hit = next((x for x in bl if int(x.get("face", 0)) == want), None)
    if not hit:
        print("d" + str(want) + " staat niet in backlog. Run: ./scripts/roll-improvement-d20.sh backlog", file=sys.stderr)
        sys.exit(1)
    if bag.get("pending"):
        queue_roll(bag, bag.get("pending"), reason="pick-replace")
    bag["rollBacklog"] = [x for x in bl if int(x.get("face", 0)) != want]
    rem = [int(x) for x in bag.get("remaining") or [] if int(x) != want]
    bag["remaining"] = rem
    roll = {
        "face": want,
        "category": hit.get("category") or categories.get(want, ""),
        "rolledAt": utc_now(),
        "remainingCount": len(rem),
        "cycle": bag.get("cyclesCompleted", 0),
        "fromBacklog": True,
    }
    bag["pending"] = roll
    bag["lastRoll"] = roll
    save_bag(bag)
    print("")
    print("PICK — d" + str(want) + " uit backlog → PENDING")
    print("Thema:", roll["category"])
    print("Focus:", focus.get(want, ""))
    print("")
    sys.exit(0)

if mode == "unroll":
    pending = bag.get("pending")
    if not pending:
        print("Geen pending roll om terug te zetten.", file=sys.stderr)
        sys.exit(1)
    face = int(pending["face"])
    queue_roll(bag, pending, reason="unroll")
    rem = [int(x) for x in bag.get("remaining") or []]
    if face not in rem:
        rem.append(face)
        rem.sort()
    bag["remaining"] = rem
    bag["pending"] = None
    # Verwijder laatste history-entry als die deze face is
    hist = bag.get("history") or []
    if hist and int(hist[-1].get("face", -1)) == face:
        hist.pop()
        bag["history"] = hist
    bag["lastRoll"] = hist[-1] if hist else None
    save_bag(bag)
    print("")
    print("UNROLL — d" + str(face) + " terug in de zak.")
    print("Nog in zak:", len(bag["remaining"]), "/20")
    print("")
    sys.exit(0)

if mode == "verify":
    errs = []
    rem = sorted(set(int(x) for x in bag.get("remaining") or [] if 1 <= int(x) <= 20))
    pend = bag.get("pending")
    pend_f = int(pend.get("face", 0)) if pend else 0
    cyc = int(bag.get("cyclesCompleted", 0))
    done_c = implemented_faces(bag, cyc)
    if pend_f and pend_f in rem:
        errs.append("pending d" + str(pend_f) + " still in remaining")
    if pend_f and pend_f in done_c:
        errs.append("pending d" + str(pend_f) + " already done this cycle")
    for f in rem:
        if f in done_c:
            errs.append("d" + str(f) + " in remaining but implemented")
    if errs:
        print("BAG_VERIFY FAIL:", "; ".join(errs))
        sys.exit(1)
    print("BAG_VERIFY OK · cyclus", cyc, "· remaining", len(rem), "· pending", ("d" + str(pend_f)) if pend_f else "—")
    sys.exit(0)

if mode not in ("roll", "force"):
    print("Usage: roll | status | history | backlog | pick <d#> | unroll | force | preflight | doctor | verify", file=sys.stderr)
    sys.exit(1)

pending = bag.get("pending")
if pending and mode in ("roll", "force"):
    old = int(pending["face"])
    queue_roll(bag, pending, reason="re-roll")
    rem = [int(x) for x in bag.get("remaining") or []]
    if old not in rem:
        rem.append(old)
    bag["remaining"] = rem
    bag["pending"] = None
    print("Open pending d" + str(old) + " → backlog + zak — nieuwe roll.", file=sys.stderr)

rem = [int(x) for x in bag.get("remaining") or []]
if not rem:
    bag["cyclesCompleted"] = int(bag.get("cyclesCompleted", 0)) + 1
    rem = list(range(1, 21))
    random.shuffle(rem)
    bag["remaining"] = rem
    print("Nieuwe cyclus — alle 20 thema's opnieuw in de zak.", file=sys.stderr)

roll_first = [int(x) for x in bag.get("rollFirst") or []]
face = None
for rf in roll_first:
    if rf in rem:
        face = rf
        rem.remove(rf)
        break
if face is None:
    face = rem.pop(random.randrange(len(rem)))
bag["remaining"] = rem
roll = {
    "face": face,
    "category": categories[face],
    "rolledAt": utc_now(),
    "remainingCount": len(rem),
    "cycle": bag["cyclesCompleted"],
}
bag["pending"] = roll
bag["lastRoll"] = roll
bag.setdefault("history", []).append(roll)
bag["history"] = bag["history"][-120:]
save_bag(bag)

print("")
print("RALPH WIGGUM d20 — IMPROVEMENT (v4 tooling)")
print("Rol: d" + str(face))
print("Thema: " + categories[face])
print("Focus: " + focus.get(face, "Kleine diff · checklist IMPROVEMENT.md"))
print("Nog in zak: " + str(len(rem)) + "/20 · cyclus " + str(bag["cyclesCompleted"]))
print("PENDING: d" + str(face) + " — uitwerken met go + mark-d20-done")
bln = len(bag.get("rollBacklog") or [])
if bln:
    print("Backlog:", bln, "thema('s) wachten · ./scripts/roll-improvement-d20.sh backlog")
print("")
print("Checklist: menu klikbaar · geen balance-bom · SW bump · doctor OK · smoke:html")
print("Na afloop: ./scripts/mark-d20-done.sh", face, '"korte note"', "1.x.y")
print("Agent log + IMPROVEMENT.md bijwerken.")
print("")
PY
