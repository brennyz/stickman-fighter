#!/usr/bin/env bash
# Lokale server + publieke tunnel (localtunnel — iPad Safari; trycloudflare DNS faalt hier vaak)
set -u
ROOT="/agent/stickman-fighter"
PORT=8787
LINK_FILE="$ROOT/LIVE-LINK.txt"
LT_LOG="/tmp/localtunnel.log"
TMUX_CONF="/exec-daemon/tmux.portal.conf"
HTTP_SESSION="sf-http"
LT_SESSION="sf-lt"
TUNNEL_BACKEND="${TUNNEL_BACKEND:-localtunnel}"
CURL_HDR=(-H "Bypass-Tunnel-Reminder: true" -H "User-Agent: StickmanFighter-TunnelCheck/1.6")

ensure_server() {
  if curl -sf "http://127.0.0.1:$PORT/" >/dev/null; then return 0; fi
  tmux -f "$TMUX_CONF" has-session -t "=$HTTP_SESSION" 2>/dev/null || \
    tmux -f "$TMUX_CONF" new-session -d -s "$HTTP_SESSION" -c "$ROOT" -- bash -l
  tmux -f "$TMUX_CONF" send-keys -t "$HTTP_SESSION:0.0" "cd $ROOT && python3 serve.py" C-m
  sleep 1.2
}

url_ok() {
  local u="$1"
  [[ -n "$u" ]] || return 1
  local host="${u#https://}"
  host="${host%%/*}"
  if ! dig +short "$host" @1.1.1.1 2>/dev/null | grep -qE '^[0-9.]'; then
    return 1
  fi
  if ! curl -sf "http://127.0.0.1:$PORT/index.html" >/dev/null; then
    return 1
  fi
  local code body
  body=$(curl -sS "${CURL_HDR[@]}" --max-time 18 "$u/index.html" 2>/dev/null) || body=""
  code=$(curl -sS -o /dev/null -w "%{http_code}" "${CURL_HDR[@]}" --max-time 18 "$u/index.html" 2>/dev/null) || code=000
  if [[ "$code" != "200" ]]; then
    return 1
  fi
  if echo "$body" | grep -qiE '503 - Tunnel Unavailable|Tunnel Unavailable'; then
    return 1
  fi
  [[ -n "$body" ]] && echo "$body" | grep -qi '<!DOCTYPE html'
}

write_health() {
  local u="$1"
  local ok="${2:-true}"
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  if [[ "$ok" == "true" && -n "$u" ]]; then
    printf '{"ok":true,"url":"%s","ts":"%s","provider":"%s"}\n' "$u" "$ts" "$TUNNEL_BACKEND" > "$ROOT/health.json"
  else
    printf '{"ok":false,"url":"%s","ts":"%s","provider":"%s","reason":"tunnel-unavailable"}\n' "$u" "$ts" "$TUNNEL_BACKEND" > "$ROOT/health.json"
  fi
}

write_hosting() {
  local u="$1"
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  python3 - <<PY
import json
from pathlib import Path
p = Path("$ROOT/hosting.json")
data = json.loads(p.read_text()) if p.exists() else {}
data["tunnel"] = "$u"
data["updated"] = "$ts"
data["tunnelProvider"] = "$TUNNEL_BACKEND"
if not data.get("stable"):
    data["stableHint"] = "Tunnel vernieuwt soms — bij 503: open de nieuwste link uit LIVE-LINK of Instellingen."
p.write_text(json.dumps(data, indent=2) + "\n")
PY
}

write_link() {
  local u="$1"
  printf '%s\n\nOpen in Safari op iPad → «Zet in app-lade».\nBij 503: even wachten of nieuwe link uit Instellingen → Hosting.\n' "$u" > "$LINK_FILE"
  write_health "$u" true
  write_hosting "$u"
}

latest_lt_url() {
  grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$LT_LOG" 2>/dev/null | tail -1 || true
}

stop_lt() {
  pkill -f "localtunnel.*--port $PORT" 2>/dev/null || true
  pkill -f "node.*localtunnel" 2>/dev/null || true
  pkill -f "\.bin/lt --port $PORT" 2>/dev/null || true
  sleep 0.8
}

lt_running() {
  pgrep -f "localtunnel.*--port $PORT" >/dev/null 2>&1 || \
    pgrep -f "\.bin/lt --port $PORT" >/dev/null 2>&1
}

start_localtunnel() {
  ensure_server
  stop_lt
  tmux -f "$TMUX_CONF" has-session -t "=$LT_SESSION" 2>/dev/null || \
    tmux -f "$TMUX_CONF" new-session -d -s "$LT_SESSION" -c "$ROOT" -- bash -l
  tmux -f "$TMUX_CONF" send-keys -t "$LT_SESSION:0.0" C-c
  sleep 0.6
  : > "$LT_LOG"
  tmux -f "$TMUX_CONF" send-keys -t "$LT_SESSION:0.0" \
    "npx --yes localtunnel --port $PORT 2>&1 | tee $LT_LOG" C-m

  local url="" i
  for i in $(seq 1 45); do
    sleep 1
    url=$(latest_lt_url)
    if [[ -n "$url" ]] && url_ok "$url"; then
      write_link "$url"
      echo "tunnel up (localtunnel): $url"
      return 0
    fi
  done
  write_health "${url:-}" false
  echo "localtunnel failed (last: $url)" >&2
  return 1
}

ensure_tunnel() {
  local saved
  saved=$(head -1 "$LINK_FILE" 2>/dev/null || true)
  if url_ok "$saved"; then
    write_link "$saved"
    echo "ok: $saved"
    return 0
  fi
  if [[ -n "$saved" ]]; then
    write_health "$saved" false
  fi
  local logurl
  logurl=$(latest_lt_url)
  if [[ -n "$logurl" ]] && url_ok "$logurl"; then
    write_link "$logurl"
    echo "ok (log): $logurl"
    return 0
  fi
  echo "starting localtunnel..."
  start_localtunnel
}

if [[ "${1:-}" == "once" ]]; then
  ensure_server
  ensure_tunnel
  exit $?
fi

while true; do
  ensure_server
  saved=$(head -1 "$LINK_FILE" 2>/dev/null || true)
  if [[ -n "$saved" ]] && ! url_ok "$saved"; then
    write_health "$saved" false
    stop_lt
  fi
  ensure_tunnel || true
  sleep 60
done
