import http.server, json, base64, os

D = r"C:/Users/ray/Desktop/Claude code/mega-idle/progress"

class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(n)
        j = json.loads(raw)
        fn = j['name']
        b = base64.b64decode(j['data'])
        with open(os.path.join(D, fn), 'wb') as f:
            f.write(b)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'ok')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, *a):
        pass

http.server.HTTPServer(('127.0.0.1', 8124), H).serve_forever()