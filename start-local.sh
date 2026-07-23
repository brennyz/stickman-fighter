#!/usr/bin/env bash
# Lokaal spelen + optioneel Cloudflare-tunnel (zelf hosten).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
PORT="${PORT:-8787}"

echo "Stickman Fighter — lokaal op http://127.0.0.1:$PORT"
echo "Op iPad (zelfde Wi‑Fi): http://$(hostname -I 2>/dev/null | awk '{print $1}'):$PORT"
echo ""

if [[ "${1:-}" == "--tunnel" ]]; then
  exec bash "$ROOT/keep-tunnel.sh"
fi

if [[ "${1:-}" == "--tunnel-once" ]]; then
  bash "$ROOT/keep-tunnel.sh" once
  exit 0
fi

python3 "$ROOT/serve.py"
