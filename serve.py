#!/usr/bin/env python3
"""Static server + debounced tunnel ensure on health/link checks."""
from __future__ import annotations

import os
import subprocess
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
KEEP_TUNNEL = os.path.join(ROOT, "keep-tunnel.sh")
DEBOUNCE_SEC = 45
_last_ensure = 0.0


def maybe_ensure_tunnel() -> None:
    global _last_ensure
    now = time.time()
    if now - _last_ensure < DEBOUNCE_SEC:
        return
    _last_ensure = now
    try:
        subprocess.run(
            ["bash", KEEP_TUNNEL, "once"],
            cwd=ROOT,
            timeout=120,
            capture_output=True,
        )
    except (subprocess.TimeoutExpired, OSError):
        pass


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path in ("/health.json", "/LIVE-LINK.txt", "/hosting.json"):
            maybe_ensure_tunnel()
        super().do_GET()

    def log_message(self, fmt: str, *args) -> None:
        if self.path.startswith("/health.json"):
            return
        super().log_message(fmt, *args)


def main() -> None:
    port = int(os.environ.get("PORT", "8787"))
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"serving {ROOT} on http://127.0.0.1:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
