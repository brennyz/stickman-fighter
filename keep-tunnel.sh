#!/usr/bin/env bash
# Houdt lokale server + één Cloudflare-tunnel levend (zonder elkaar te killen)
set -u
ROOT="/agent/stickman-fighter"
PORT=8787
LOG="/tmp/cf-tunnel.log"
LINK_FILE="$ROOT/LIVE-LINK.txt"
CF="${CLOUDFLARED_BIN:-/tmp/cloudflared}"
TMUX_CONF="/exec-daemon/tmux.portal.conf"
HTTP_SESSION="sf-http"
TUNNEL_SESSION="cf-direct"

ensure_server() {
  if curl -sf "http://127.0.0.1:$PORT/" >/dev/null; then return 0; fi
  tmux -f "$TMUX_CONF" has-session -t "=$HTTP_SESSION" 2>/dev/null || \
    tmux -f "$TMUX_CONF" new-session -d -s "$HTTP_SESSION" -c "$ROOT" -- bash -l
  tmux -f "$TMUX_CONF" send-keys -t "$HTTP_SESSION:0.0" "cd $ROOT && python3 serve.py" C-m
  sleep 1.2
}

latest_url() {
  rg -o 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | tail -1 || true
}

curl_public() {
  local u="$1"
  local host="${u#https://}"
  host="${host%%/*}"
  local ip code=000 try
  for try in 1 2 3 4 5; do
    ip=$(dig +short "$host" @1.1.1.1 2>/dev/null | grep -E '^[0-9.]+$' | head -1 || true)
    [[ -n "$ip" ]] || ip="104.16.231.132"
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 12 \
      --resolve "${host}:443:${ip}" "$u/index.html" 2>/dev/null) || code=000
    [[ "$code" == "200" ]] && break
    sleep 2
  done
  printf '%s' "$code"
}

url_ok() {
  local u="$1"
  [[ -n "$u" ]] || return 1
  [[ "$(curl_public "$u")" == "200" ]]
}

write_health() {
  local u="$1"
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  printf '{"ok":true,"url":"%s","ts":"%s"}\n' "$u" "$ts" > "$ROOT/health.json"
}

write_hosting() {
  local u="$1"
  local ts stable
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  stable=$(python3 -c "import json;print(json.load(open('$ROOT/hosting.json')).get('stable') or '')" 2>/dev/null || echo "")
  python3 - <<PY
import json
from pathlib import Path
p = Path("$ROOT/hosting.json")
data = json.loads(p.read_text()) if p.exists() else {}
data["tunnel"] = "$u"
data["updated"] = "$ts"
if not data.get("stable"):
    data["stableHint"] = "Tunnel actief. Bookmark deze link; verandert bij herstart."
p.write_text(json.dumps(data, indent=2) + "\n")
PY
}

write_link() {
  printf '%s\n\nOpen in Safari → «Zet in app-lade».\n' "$1" > "$LINK_FILE"
  write_health "$1"
  write_hosting "$1"
}

tunnel_running() {
  pgrep -f "$CF tunnel --url http://127.0.0.1:$PORT" >/dev/null 2>&1
}

start_tunnel() {
  ensure_server
  # Geen globale pkill — alleen cf-direct sessie herstarten
  tmux -f "$TMUX_CONF" has-session -t "=$TUNNEL_SESSION" 2>/dev/null || \
    tmux -f "$TMUX_CONF" new-session -d -s "$TUNNEL_SESSION" -c "$ROOT" -- bash -l
  tmux -f "$TMUX_CONF" send-keys -t "$TUNNEL_SESSION:0.0" C-c
  sleep 0.8
  : > "$LOG"
  tmux -f "$TMUX_CONF" send-keys -t "$TUNNEL_SESSION:0.0" \
    "$CF tunnel --url http://127.0.0.1:$PORT 2>&1 | tee $LOG" C-m

  local url="" code=000
  for _ in $(seq 1 55); do
    sleep 1
    url=$(latest_url)
    if [[ -n "$url" ]]; then
      code=$(curl_public "$url")
      [[ "$code" == "200" ]] && break
    fi
  done
  if [[ "$code" == "200" && -n "$url" ]]; then
    write_link "$url"
    echo "tunnel up: $url"
    return 0
  fi
  echo "tunnel start failed (last $url -> $code)" >&2
  return 1
}

ensure_tunnel() {
  local saved
  saved=$(head -1 "$LINK_FILE" 2>/dev/null || true)
  if url_ok "$saved" && tunnel_running; then
    echo "ok: $saved"
    return 0
  fi
  local logurl
  logurl=$(latest_url)
  if url_ok "$logurl" && tunnel_running; then
    write_link "$logurl"
    echo "ok (log): $logurl"
    return 0
  fi
  echo "restarting tunnel..."
  start_tunnel
}

if [[ "${1:-}" == "once" ]]; then
  ensure_server
  ensure_tunnel
  exit $?
fi

if [[ "${FORCE_REDO:-0}" == "1" ]]; then
  start_tunnel
  exit $?
fi

while true; do
  ensure_server
  ensure_tunnel || true
  sleep 60
done
