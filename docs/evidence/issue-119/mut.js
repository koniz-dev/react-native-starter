// Usage: node mut.js <repoCopy> <mutants.json> <out.json>
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const [repo, mutFile, outFile] = process.argv.slice(2);
const mutants = JSON.parse(fs.readFileSync(mutFile, 'utf8'));
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};

for (const m of mutants) {
  if (only && !only.includes(m.id)) continue;
  if (!only && results[m.id]) continue;
  const file = path.join(repo, m.file);
  const orig = fs.readFileSync(file, 'utf8');
  const count = orig.split(m.from).length - 1;
  if (count !== 1) {
    results[m.id] = { status: `BAD-PATTERN(${count})` };
    console.log(m.id, results[m.id].status);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    continue;
  }
  fs.writeFileSync(file, orig.replace(m.from, m.to));
  const args = ['node_modules/.bin/jest', '--ci', '--silent', '--coverage=false', '--bail', '--maxWorkers=' + (process.env.W || '3')];
  if (m.tests === 'related') args.push('--testPathIgnorePatterns', '__tests__/scripts/');
  else if (m.tests === 'all') {}
  else args.push(...m.tests);
  const t0 = Date.now();
  const r = spawnSync('node', args, { cwd: repo, encoding: 'utf8', maxBuffer: 1e8, timeout: 900000 });
  fs.writeFileSync(file, orig);
  const out = (r.stdout || '') + (r.stderr || '');
  const failed = [...out.matchAll(/^FAIL (.+)$/gm)].map(x => x[1].trim());
  const summary = (out.match(/^Tests:.*$/m) || [''])[0];
  results[m.id] = {
    status: r.status === 0 ? 'SURVIVED' : 'KILLED',
    exit: r.status, failed, summary, secs: Math.round((Date.now() - t0) / 1000),
  };
  console.log(m.id, results[m.id].status, summary, failed.join(' '));
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
}
