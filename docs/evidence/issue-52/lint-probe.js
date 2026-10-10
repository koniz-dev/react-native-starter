// Temporary lint probe (issue 52): dev-only Node code reading env and logging.
const http = require('http');

const port = Number(process.env.MOCK_PORT ?? 4000);
http.createServer((req, res) => res.end('ok')).listen(port);
console.log(`mock backend on ${port}`);
