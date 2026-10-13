// Runs a script with path.join/normalize/relative etc. behaving like win32 (backslash separators),
// and fs translating backslashes back to '/', to simulate Windows path strings on macOS.
const Module = require('module');
const realPath = require('path');
const realFs = require('fs');
const fix = p => (typeof p === 'string' ? p.replace(/\\/g, '/') : p);
const winPath = { ...realPath.win32,
  resolve: realPath.posix.resolve, // keep ROOT absolute on this machine
  sep: '\\',
};
const fsProxy = new Proxy(realFs, { get(t, k) { const v = t[k]; return typeof v === 'function' ? (...a) => v.apply(t, a.map((x, i) => (i === 0 || (i === 1 && /^(rename|copyFile|symlink|link)/.test(String(k))) ? fix(x) : x))) : v; } });
const SCRIPT = process.argv[2];
const origLoad = Module._load;
Module._load = function (req, parent, isMain) {
  if (parent && parent.filename === SCRIPT) {
    if (req === 'path') return winPath;
    if (req === 'fs') return fsProxy;
  }
  return origLoad.apply(this, arguments);
};
const script = process.argv[2];
process.argv.splice(1, 1);
Module.runMain = undefined;
require(script);
