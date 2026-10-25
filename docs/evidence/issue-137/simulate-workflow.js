// Simulates .github/workflows/eas-build.yml: runs each `run:` step with bash
// (the build command replaced by an echo) and evaluates each `if:`.
const fs = require('fs'), cp = require('child_process'), os = require('os'), path = require('path');
const yaml = require(path.resolve('node_modules/js-yaml'));
const wf = yaml.load(fs.readFileSync('.github/workflows/eas-build.yml', 'utf8'));
const job = wf.jobs.build;
function evalIf(expr, ctx) {
  const js = expr
    .replace(/steps\.token\.outputs\.enabled/g, JSON.stringify(ctx.enabled ?? ''))
    .replace(/inputs\.(\w+)/g, (_, k) => JSON.stringify(ctx.inputs[k]))
    .replace(/==/g, '===').replace(/!===/g, '!==');
  return Function(`return (${js});`)();
}
function run(inputs, token) {
  const ctx = { inputs }; const log = [];
  for (const step of job.steps) {
    // Steps without if: run only while no earlier step failed (success()).
    const ok = step.if ? evalIf(step.if, ctx) : true;
    if (ctx.failed || !ok) { log.push(`  skip  ${step.name}`); continue; }
    if (step.uses) { log.push(`  run   ${step.name} (uses ${step.uses.split('@')[0]})`); continue; }
    const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gho')), 'out');
    fs.writeFileSync(out, '');
    const script = step.run.replace(/npx --yes .*$/m, 'echo "WOULD RUN: eas-cli@${EAS_CLI_VERSION} ${args[*]}"');
    const env = { PATH: process.env.PATH, GITHUB_OUTPUT: out, EAS_CLI_VERSION: job.env.EAS_CLI_VERSION,
      PROFILE: inputs.profile, PLATFORM: inputs.platform, SUBMIT: String(inputs.submit), EXPO_TOKEN: token };
    const r = cp.spawnSync('bash', ['-e', '-c', step.name === 'Install dependencies' ? 'echo "(npm ci)"' : script], { env, encoding: 'utf8' });
    log.push(`  run   ${step.name}: exit ${r.status}${(r.stdout + r.stderr).trim() ? '\n        ' + (r.stdout + r.stderr).trim().replace(/\n/g, '\n        ') : ''}`);
    const m = fs.readFileSync(out, 'utf8').match(/enabled=(\w+)/); if (m) ctx.enabled = m[1];
    if (r.status !== 0) ctx.failed = true;
  }
  return `${ctx.failed ? 'JOB FAILS' : 'JOB SUCCEEDS'}\n${log.join('\n')}`;
}
const cases = [
  [{ profile: 'preview', platform: 'android', submit: false }, ''],
  [{ profile: 'production', platform: 'all', submit: true }, ''],
  [{ profile: 'preview', platform: 'android', submit: false }, 'tok'],
  [{ profile: 'production', platform: 'ios', submit: true }, 'tok'],
  [{ profile: 'preview', platform: 'android', submit: true }, 'tok'],
];
for (const [inputs, token] of cases) console.log(`\n## ${JSON.stringify(inputs)} EXPO_TOKEN=${token ? 'set' : 'empty'}\n${run(inputs, token)}`);
