#!/usr/bin/env bash
# Ralph Wiggum d20 — roll één verbeter-thema (zonder herhaling tot alle 20 geweest zijn).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SF_ROOT="$ROOT"
python3 <<'PY'
import json, os, random, sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(os.environ["SF_ROOT"])
bag_path = root / "improvement-d20-bag.json"
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

if not bag_path.exists():
    bag = {"version": 1, "cyclesCompleted": 0, "remaining": list(range(1, 21)), "lastRoll": None, "history": []}
else:
    bag = json.loads(bag_path.read_text())

rem = bag.get("remaining") or []
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
print("RALPH WIGGUM d20 — IMPROVEMENT")
print("Rol: d" + str(face))
print("Thema: " + categories[face])
print("Nog in zak: " + str(len(rem)) + "/20 · cyclus " + str(bag["cyclesCompleted"]))
print("")
print("Lees IMPROVEMENT.md (Gameplay-safe checklist).")
print("Na afloop: korte regel in Agent log + commit.")
print("")
PY
