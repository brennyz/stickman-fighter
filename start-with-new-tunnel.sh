#!/usr/bin/env bash
# Start app + always redo Cloudflare tunnel (verse link)
set -e
ROOT="/agent/stickman-fighter"
export FORCE_REDO=1
export CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-/tmp/cloudflared}"
cd "$ROOT"

# lokale server
if ! curl -sf http://127.0.0.1:8787/ >/dev/null; then
  tmux -f /exec-daemon/tmux.portal.conf has-session -t "=sf-http" 2>/dev/null || \
    tmux -f /exec-daemon/tmux.portal.conf new-session -d -s sf-http -c "$ROOT" -- bash -l
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t sf-http:0.0 'cd /agent/stickman-fighter && python3 serve.py' C-m
  sleep 1
fi

# Herstart via keep-tunnel (geen pkill — dat killt soms de net gestarte tunnel)
FORCE_REDO=1 bash "$ROOT/keep-tunnel.sh"
echo
echo "OPEN:"
head -1 "$ROOT/LIVE-LINK.txt"
