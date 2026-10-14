// Echoes what a multipart upload looked like: the Content-Type header and
// the parts found in the body. Usage: node upload-server.js <port>
const http = require('http');
const port = Number(process.argv[2] ?? 9998);
http
  .createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const type = req.headers['content-type'] ?? '';
      const boundary = /boundary=([^;]+)/.exec(type)?.[1];
      const parts = boundary
        ? body
            .toString('latin1')
            .split(`--${boundary}`)
            .filter(part => /content-disposition/i.test(part))
            .map(part => {
              const name = /name="([^"]+)"/.exec(part)?.[1];
              const filename = /filename="([^"]+)"/.exec(part)?.[1];
              const data = part.slice(part.indexOf('\r\n\r\n') + 4, -2);
              return {
                name,
                filename,
                png: data.startsWith('\x89PNG'),
                text: filename ? undefined : data,
              };
            })
        : [];
      const result = {
        method: req.method,
        url: req.url,
        multipart: type.startsWith('multipart/form-data; boundary='),
        contentType: type.split(';')[0],
        parts,
      };
      console.log(JSON.stringify(result));
      console.log(JSON.stringify(body.toString('latin1').slice(0, 400)));
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      });
      res.end(JSON.stringify(result));
    });
  })
  .listen(port, '127.0.0.1');
