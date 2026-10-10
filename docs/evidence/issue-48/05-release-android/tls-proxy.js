// HTTPS front for the trial's mock backend (stand-in for a real TLS
// terminator), plus a plain-HTTP control port for the e2e flows:
//   https://localhost:4443/*      -> http://localhost:4000/*
//   http://localhost:4001/fail/on  creates mock-backend/.fail (notes -> 503)
//   http://localhost:4001/fail/off removes it
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const [tlsDir, failFile] = process.argv.slice(2);
https
  .createServer(
    { key: fs.readFileSync(path.join(tlsDir, 'server.key')), cert: fs.readFileSync(path.join(tlsDir, 'server.pem')) },
    (req, res) => {
      const upstream = http.request(
        { host: '127.0.0.1', port: 4000, path: req.url, method: req.method, headers: req.headers },
        up => { res.writeHead(up.statusCode, up.headers); up.pipe(res); }
      );
      upstream.on('error', e => { res.writeHead(502); res.end(String(e)); });
      req.pipe(upstream);
      console.log(new Date().toISOString(), req.method, req.url);
    }
  )
  .listen(4443, () => console.log('https proxy on 4443'));
http
  .createServer((req, res) => {
    if (req.url === '/fail/on') fs.writeFileSync(failFile, '');
    else if (req.url === '/fail/off') fs.rmSync(failFile, { force: true });
    console.log(new Date().toISOString(), 'control', req.url);
    res.end('ok');
  })
  .listen(4001, () => console.log('control on 4001'));
