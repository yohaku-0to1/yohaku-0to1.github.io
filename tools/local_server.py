"""
Simple local dev server with COOP/COEP headers for FFmpeg.wasm.

Usage:
    python3 tools/local_server.py --port 8000 --dir .

Headers added:
    Cross-Origin-Opener-Policy: same-origin
    Cross-Origin-Embedder-Policy: require-corp
    Access-Control-Allow-Origin: *
"""

import argparse
import http.server
import os
import socketserver


COOP = "same-origin"
COEP = "require-corp"


class HeaderHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", COOP)
        self.send_header("Cross-Origin-Embedder-Policy", COEP)
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description="Local server with COOP/COEP headers")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on")
    parser.add_argument("--dir", default=".", help="Directory to serve")
    args = parser.parse_args()

    os.chdir(args.dir)
    with socketserver.TCPServer(("", args.port), HeaderHandler) as httpd:
        print(f"Serving {os.getcwd()} at http://localhost:{args.port} with COOP/COEP headers")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
