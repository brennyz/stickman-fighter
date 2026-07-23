#!/usr/bin/env bash
# Ralph Wiggum d20 — roll één verbeter-thema (zonder herhaling tot alle 20 geweest zijn).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SF_ROOT="$ROOT"
export SF_MODE="${1:-roll}"
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

if not bag_path.exists():
    bag = {
        "version": 2,
        "cyclesCompleted": 0,
        "remaining": list(range(1, 21)),
        "lastRoll": None,
        "history": [],
        "implemented": [],
    }
else:
    bag = json.loads(bag_path.read_text())
    if int(bag.get("version", 1)) < 2:
        bag["version"] = 2
        bag.setdefault("implemented", [])

rem = bag.get("remaining") or []
if mode == "status":
    print("")
    print("RALPH d20 — STATUS")
    print("Cyclus:", bag.get("cyclesCompleted", 0))
    print("Nog in zak:", len(rem), "/20")
    if bag.get("lastRoll"):
        lr = bag["lastRoll"]
        print("Laatste rol: d" + str(lr.get("face")) + " — " + str(lr.get("category", "")))
    done = bag.get("implemented") or []
    if done:
        last = done[-1]
        print("Laatst af:", "d" + str(last.get("face")), "·", last.get("note", ""))
    print("Resterend:", ", ".join("d" + str(x) for x in sorted(rem)) or "(leeg → nieuwe cyclus bij roll)")
    print("")
    sys.exit(0)

if not rem:
    bag["cyclesCompleted"] = int(bag.get("cyclesCompleted", 0)) + 1
    rem = list(range(1, 21))
    random.shuffle(rem)
    bag["remaining"] = rem
    print("Nieuwe cyclus — alle 20 thema's opnieuw in de zak.", file=sys.stderr)

face = rem.pop(random.randrange(len(rem)))
bag["remaining"] = rem
roll = {
    "face": face,
    "category": categories[face],
    "rolledAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "remainingCount": len(rem),
    "cycle": bag["cyclesCompleted"],
}
bag["lastRoll"] = roll
bag.setdefault("history", []).append(roll)
bag["history"] = bag["history"][-120:]
bag_path.write_text(json.dumps(bag, indent=2) + "\n")

print("")
print("RALPH WIGGUM d20 — IMPROVEMENT (v2)")
print("Rol: d" + str(face))
print("Thema: " + categories[face])
print("Focus: " + focus.get(face, "Kleine diff · checklist IMPROVEMENT.md"))
print("Nog in zak: " + str(len(rem)) + "/20 · cyclus " + str(bag["cyclesCompleted"]))
print("")
print("Checklist: menu klikbaar · geen balance-bom · SW bump · node --check game.js")
print("Na afloop: Agent log + implemented[] in bag (optioneel mark-d20-done.sh)")
print("")
PY
