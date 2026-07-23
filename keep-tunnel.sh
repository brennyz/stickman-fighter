#!/usr/bin/env bash
# Lokale server + vaste localtunnel-subdomain (iPad Safari)
set -u
ROOT="/agent/stickman-fighter"
PORT=8787
LINK_FILE="$ROOT/LIVE-LINK.txt"
LT_LOG="/tmp/localtunnel.log"
LOCK_FILE="/tmp/stickman-tunnel.lock"
TMUX_CONF="/exec-daemon/tmux.portal.conf"
HTTP_SESSION="sf-http"
LT_SESSION="sf-lt"
TUNNEL_BACKEND="${TUNNEL_BACKEND:-localtunnel}"
LT_SUBDOMAIN="${LT_SUBDOMAIN:-stickfighter-ipad-b75e}"
CURL_HDR=(-H "Bypass-Tunnel-Reminder: true" -H "User-Agent: StickmanFighter-TunnelCheck/1.6")

with_lock() {
  (
    flock -x 9
    "$@"
  ) 9>"$LOCK_FILE"
}

ensure_server() {
  if curl -sf "http://127.0.0.1:$PORT/" >/dev/null; then return 0; fi
  tmux -f "$TMUX_CONF" has-session -t "=$HTTP_SESSION" 2>/dev/null || \
    tmux -f "$TMUX_CONF" new-session -d -s "$HTTP_SESSION" -c "$ROOT" -- bash -l
  tmux -f "$TMUX_CONF" send-keys -t "$HTTP_SESSION:0.0" "cd $ROOT && python3 serve.py" C-m
  sleep 1.2
}

expected_url() {
  printf 'https://%s.loca.lt' "$LT_SUBDOMAIN"
}

url_ok() {
  local u="$1"
  [[ -n "$u" ]] || return 1
  if ! curl -sf "http://127.0.0.1:$PORT/index.html" >/dev/null; then
    return 1
  fi
  local code body
  body=$(curl -sS --max-time 22 "$u/index.html" 2>/dev/null) || body=""
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 22 "$u/index.html" 2>/dev/null) || code=000
  [[ "$code" == "200" ]] || return 1
  echo "$body" | grep -qiE '503 - Tunnel Unavailable' && return 1
  echo "$body" | grep -qi '<!DOCTYPE html'
}

write_health() {
  local u="$1"
  local ok="${2:-true}"
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  if [[ "$ok" == "true" && -n "$u" ]]; then
    printf '{"ok":true,"url":"%s","ts":"%s","provider":"%s","subdomain":"%s"}\n' "$u" "$ts" "$TUNNEL_BACKEND" "$LT_SUBDOMAIN" > "$ROOT/health.json"
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
data["tunnelSubdomain"] = "$LT_SUBDOMAIN"
data["stableHint"] = "Vaste link — bookmark stickfighter-ipad-b75e.loca.lt in Safari."
p.write_text(json.dumps(data, indent=2) + "\n")
PY
}

write_link() {
  local u="$1"
  printf '%s\n\nVaste iPad-link — bookmark in Safari.\n«Zet in app-lade» voor fullscreen.\n' "$u" > "$LINK_FILE"
  write_health "$u" true
  write_hosting "$u"
}

stop_lt() {
  pkill -f "localtunnel.*--port $PORT" 2>/dev/null || true
  pkill -f "\.bin/lt --port $PORT" 2>/dev/null || true
  sleep 1
}

lt_running() {
  pgrep -f "\.bin/lt --port $PORT" >/dev/null 2>&1
}

start_localtunnel_inner() {
  ensure_server
  stop_lt
  local want
  want=$(expected_url)
  tmux -f "$TMUX_CONF" has-session -t "=$LT_SESSION" 2>/dev/null || \
    tmux -f "$TMUX_CONF" new-session -d -s "$LT_SESSION" -c "$ROOT" -- bash -l
  tmux -f "$TMUX_CONF" send-keys -t "$LT_SESSION:0.0" C-c
  sleep 0.8
  : > "$LT_LOG"
  tmux -f "$TMUX_CONF" send-keys -t "$LT_SESSION:0.0" \
    "npx --yes localtunnel --port $PORT --subdomain $LT_SUBDOMAIN --local-host 127.0.0.1 2>&1 | tee $LT_LOG" C-m

  local i
  for i in $(seq 1 55); do
    sleep 1
    if url_ok "$want"; then
      write_link "$want"
      echo "tunnel up: $want"
      return 0
    fi
  done
  write_health "$want" false
  echo "localtunnel failed for $want" >&2
  return 1
}

start_localtunnel() {
  with_lock start_localtunnel_inner
}

ensure_tunnel_inner() {
  local want
  want=$(expected_url)
  if url_ok "$want"; then
    if ! lt_running; then
      echo "public ok but lt down — restarting client"
      start_localtunnel_inner || return 1
    else
      write_link "$want"
      echo "ok: $want"
    fi
    return 0
  fi
  write_health "$want" false
  stop_lt
  echo "starting localtunnel ($LT_SUBDOMAIN)..."
  start_localtunnel_inner
}

ensure_tunnel() {
  with_lock ensure_tunnel_inner
}

if [[ "${1:-}" == "once" ]]; then
  ensure_server
  ensure_tunnel
  exit $?
fi

while true; do
  ensure_server
  want=$(expected_url)
  if ! url_ok "$want"; then
    write_health "$want" false
    with_lock ensure_tunnel_inner || true
  else
    write_link "$want"
  fi
  sleep 25
done
