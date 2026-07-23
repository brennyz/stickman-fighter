#!/usr/bin/env bash
# Ralph Wiggum d20 v3 — roll één verbeter-thema (geen herhaling binnen cyclus).
#
# Commands:
#   ./scripts/roll-improvement-d20.sh           # roll (blokkeert als pending open)
#   ./scripts/roll-improvement-d20.sh status
#   ./scripts/roll-improvement-d20.sh history
#   ./scripts/roll-improvement-d20.sh unroll    # zet pending terug in de zak
#   ./scripts/roll-improvement-d20.sh force     # roll ondanks open pending
#   ./scripts/roll-improvement-d20.sh preflight # node --check + smoke load
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SF_ROOT="$ROOT"
export SF_MODE="${1:-roll}"

run_preflight() {
  echo ""
  echo "PREFLIGHT"
  if ! node --check "$ROOT/game.js"; then
    echo "FAIL: node --check game.js"
    return 1
  fi
  echo "OK  node --check game.js"
  if ! node "$ROOT/scripts/smoke-load-game.mjs"; then
    echo "FAIL: smoke-load-game.mjs — game.js crasht bij load (handlers binden niet)"
    return 1
  fi
  echo "OK  smoke-load-game.mjs"
  local ver sw gsw
  ver="$(rg -o "APP_VERSION = '[^']+'" "$ROOT/game.js" | head -1 || true)"
  sw="$(rg -o "stickfighter-app-v[0-9]+" "$ROOT/sw.js" | head -1 || true)"
  gsw="$(rg -o "SW_CACHE_REV = [0-9]+" "$ROOT/game.js" | head -1 | rg -o "[0-9]+" || true)"
  sw_n="$(echo "$sw" | rg -o "[0-9]+$" || true)"
  if [[ -n "$gsw" && -n "$sw_n" && "$gsw" != "$sw_n" ]]; then
    echo "FAIL: SW mismatch game.js SW_CACHE_REV=$gsw vs sw.js $sw"
    return 1
  fi
  echo "App: ${ver:-?} · SW: ${sw:-?}"
  echo ""
}

if [[ "$SF_MODE" == "preflight" ]]; then
  run_preflight
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
    8: "SW bump + offline banner — network-first HTML.",
    9: "touch-action, hit slop, dual pad — menu blijft klikbaar.",
    10: "prefers-reduced-motion + contrast — geen flits-FX.",
    11: "goBack/scroll/grote knoppen — één flow-fix.",
    12: "Dex/cosmetic/achievement — geen 50 levels.",
    13: "Daily/claim UX copy — geen grind ×10.",
    14: "Particle cap + 1 juice — respecteer Lite FX.",
    15: "Max 1 toast/modus — help tekst, geen spam.",
    16: "hosting.json/Pages link — tunnel niet primair.",
    17: "try/catch + user toast — geen silent fail.",
    18: "Char select UI — stats preview, geen dmg tweak.",
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

def implemented_faces(bag):
    return {int(x["face"]) for x in bag.get("implemented") or [] if x.get("face") is not None}

def migrate(bag):
    ver = int(bag.get("version", 1))
    bag.setdefault("implemented", [])
    bag.setdefault("history", [])
    bag.setdefault("remaining", list(range(1, 21)))
    bag.setdefault("cyclesCompleted", 0)
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
                # Face mag niet in remaining zitten als hij pending is
                rem = [int(x) for x in bag.get("remaining") or []]
                bag["remaining"] = [x for x in rem if x != face]
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
    print("RALPH d20 — STATUS (v3)")
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

if mode == "unroll":
    pending = bag.get("pending")
    if not pending:
        print("Geen pending roll om terug te zetten.", file=sys.stderr)
        sys.exit(1)
    face = int(pending["face"])
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

if mode not in ("roll", "force"):
    print("Usage: roll | status | history | unroll | force | preflight", file=sys.stderr)
    sys.exit(1)

pending = bag.get("pending")
if pending and mode != "force":
    face = pending.get("face")
    print("", file=sys.stderr)
    print("BLOKKEERD: open PENDING d" + str(face) + " — " + str(pending.get("category", "")), file=sys.stderr)
    print("Focus: " + focus.get(int(face), ""), file=sys.stderr)
    print("Maak af met mark-d20-done.sh, of: ./scripts/roll-improvement-d20.sh unroll", file=sys.stderr)
    print("Forceer nieuwe roll: ./scripts/roll-improvement-d20.sh force", file=sys.stderr)
    print("", file=sys.stderr)
    sys.exit(3)

if pending and mode == "force":
    # Pending blijft open tenzij we 'm terugzetten — force markeert oude pending als verloren?
    # Veiliger: stop force als pending bestaat en eis unroll. Of: auto-unroll warning.
    old = int(pending["face"])
    rem = [int(x) for x in bag.get("remaining") or []]
    if old not in rem:
        rem.append(old)
    bag["remaining"] = rem
    bag["pending"] = None
    print("FORCE: oude pending d" + str(old) + " terug in zak vóór nieuwe roll.", file=sys.stderr)

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
print("RALPH WIGGUM d20 — IMPROVEMENT (v3)")
print("Rol: d" + str(face))
print("Thema: " + categories[face])
print("Focus: " + focus.get(face, "Kleine diff · checklist IMPROVEMENT.md"))
print("Nog in zak: " + str(len(rem)) + "/20 · cyclus " + str(bag["cyclesCompleted"]))
print("PENDING: d" + str(face) + " (nieuwe roll geblokkeerd tot done/unroll)")
print("")
print("Checklist: menu klikbaar · geen balance-bom · SW bump · node --check + smoke")
print("Na afloop: ./scripts/mark-d20-done.sh", face, '"korte note"', "1.x.y")
print("Agent log + IMPROVEMENT.md bijwerken.")
print("")
PY
