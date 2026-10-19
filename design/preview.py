"""Serve the self-contained Tankuj design prototype on localhost."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def document() -> bytes:
    fragment = Path(__file__).with_name("tankuj-prototype.html").read_text(
        encoding="utf-8"
    )
    prefix = """<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Tankuj — návrh používateľského toku</title>
  <style>
    body { margin: 0; padding: 16px; color-scheme: light dark;
      background: light-dark(#fafbf8, #111713); }
    button { cursor: pointer; }
    button:disabled { cursor: default; }
  </style>
</head>
<body>
"""
    return (prefix + fragment + "\n</body>\n</html>\n").encode("utf-8")


class PreviewHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path not in ("/", "/index.html"):
            self.send_error(404)
            return
        content = document()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'none'; script-src 'unsafe-inline'; "
            "style-src 'unsafe-inline'; connect-src 'none'; "
            "base-uri 'none'; form-action 'none'",
        )
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8765), PreviewHandler)
    print("Tankuj prototype: http://127.0.0.1:8765", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
