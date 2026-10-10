import json, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
MODE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth-mode")
USER = {"id": 1, "username": "emilys", "email": "emily.local@example.com", "firstName": "Emily", "lastName": "Local"}
class H(BaseHTTPRequestHandler):
    def send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(body)
    def do_POST(self):
        n = int(self.headers.get('Content-Length') or 0); data = json.loads(self.rfile.read(n) or b'{}')
        print(f"POST {self.path} username={data.get('username')}", flush=True)
        if self.path == '/auth/login' and data.get('username') == 'emilys' and data.get('password') == 'emilyspass':
            return self.send(200, {**USER, "accessToken": "local-token-1"})
        self.send(400, {"message": "Invalid credentials"})
    def do_GET(self):
        mode = open(MODE).read().strip() if os.path.exists(MODE) else 'ok'
        auth = self.headers.get('Authorization') or ''
        print(f"GET {self.path} mode={mode} authorization={'Bearer <token>' if auth.startswith('Bearer ') else 'absent'}", flush=True)
        if self.path == '/auth/me' and mode == 'ok' and auth == 'Bearer local-token-1':
            return self.send(200, USER)
        self.send(401, {"message": "Invalid/Expired Token!"})
    def log_message(self, *a): pass
ThreadingHTTPServer(('0.0.0.0', 9998), H).serve_forever()
