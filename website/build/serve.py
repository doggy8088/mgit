#!/usr/bin/env python3
"""A local preview server for the site.

    python3 website/build/serve.py [port]

It differs from `python3 -m http.server` in one way that matters while working
on the site: it tells the browser not to cache anything, so a reload always
shows the file you just wrote. It also serves directory URLs the way GitHub
Pages does, and returns 404.html for a missing path.
"""

from __future__ import annotations

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            page = SITE / "404.html"
            if page.exists():
                body = page.read_bytes()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
                return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
    handler = partial(Handler, directory=str(SITE))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"mgit site: http://localhost:{port}/  (serving {SITE})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
