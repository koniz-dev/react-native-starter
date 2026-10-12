/**
 * @jest-environment node
 */
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

/**
 * Anything that names the demo or its backends switch. Links to this
 * command's doc and `npm run` mentions of it are left to docs:check, which
 * runs below.
 */
const DEMO_WORDS =
  'demo-todos|demo-auth|demo-showcase|explore|showcase|emilys|dummyjson|jsonplaceholder|demo.backend|use_?demo';
const CHECKED_PATHS = [
  'README.md',
  'AGENTS.md',
  'docs',
  '.env.example',
  '.maestro',
  'scripts',
  '.github',
  'app',
  'features',
  'shared',
  'testing',
  'jest.setup.env.js',
];

/** A committed copy of the working tree, sharing this repo's node_modules. */
function makeCopy(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'remove-demo-'));
  const files = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: ROOT, encoding: 'utf8' }
  )
    .split('\0')
    .filter(file => file && fs.existsSync(path.join(ROOT, file)));
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), path.join(dir, file));
  }
  fs.symlinkSync(
    path.join(ROOT, 'node_modules'),
    path.join(dir, 'node_modules')
  );
  commit(dir, 'template');
  return dir;
}

function commit(dir: string, message: string) {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  if (!fs.existsSync(path.join(dir, '.git'))) git('init', '-q');
  git('add', '-A');
  git(
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@example.com',
    'commit',
    '-qm',
    message
  );
}

function run(dir: string, args: string[] = []) {
  return spawnSync(process.execPath, ['scripts/remove-demo.js', ...args], {
    cwd: dir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const read = (dir: string, file: string) =>
  fs.readFileSync(path.join(dir, file), 'utf8');
const exists = (dir: string, file: string) =>
  fs.existsSync(path.join(dir, file));
const gitStatus = (dir: string) =>
  execFileSync('git', ['status', '--porcelain'], {
    cwd: dir,
    encoding: 'utf8',
  });

describe('remove-demo on a copy of the template', () => {
  const copies: string[] = [];
  const copy = () => {
    const dir = makeCopy();
    copies.push(dir);
    return dir;
  };
  afterAll(() => {
    for (const dir of copies) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('lists the changes on --dry-run and changes nothing', () => {
    const dir = copy();
    const result = run(dir, ['--dry-run']);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('delete features/demo-todos');
    expect(result.stdout).toContain('delete .maestro/05-explore-error-retry');
    expect(result.stdout).toContain('strip docs/testing.md');
    expect(result.stdout).toContain('strip .env.example');
    expect(gitStatus(dir)).toBe('');
  });

  it('leaves no mention of the demo in the code, docs, config, or flows', () => {
    const dir = copy();
    const result = run(dir);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);

    execFileSync('git', ['add', '-A'], { cwd: dir });
    const leftovers = spawnSync(
      'git',
      ['grep', '--cached', '-niE', DEMO_WORDS, '--', ...CHECKED_PATHS],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(leftovers.status).toBe(1); // no match (128 would be a bad pathspec)
    expect(leftovers.stdout).toBe('');

    // The env template has no demo backends switch; the config requires both
    // URLs.
    const env = read(dir, '.env.example');
    expect(env).not.toMatch(/DEMO/);
    expect(env).not.toMatch(/=true$/m);
    expect(env).toMatch(/^EXPO_PUBLIC_API_URL=$/m);
    expect(env).toMatch(/^# Set both to your servers/m);
    const config = read(dir, 'shared/config/env.ts');
    expect(config).not.toMatch(/demo/i);
    expect(config).toMatch(/^ {4}const value = env\[variable\];$/m);

    // The flows that need the demo are gone; the rest don't refer to them.
    expect(fs.readdirSync(path.join(dir, '.maestro')).sort()).toEqual([
      '01-cold-start.yaml',
      '06-login-back.yaml',
      'config.yaml',
      'dark-mode.yaml',
      'scripts',
      'subflows',
    ]);
    expect(fs.readdirSync(path.join(dir, '.maestro/subflows'))).toEqual([
      'open-app.yaml',
    ]);
    expect(read(dir, '.maestro/config.yaml')).not.toMatch(/Tab navigation/);
    // The e2e runner points both URLs at the e2e mock (or E2E_* overrides),
    // and the mock lost its demo routes and account.
    const runner = read(dir, 'scripts/e2e/run.sh');
    expect(runner).not.toMatch(/DEMO/);
    expect(runner).toMatch(
      /^AUTH_API_URL="\$\{E2E_AUTH_API_URL:-\$API_URL\}"$/m
    );
    const mock = read(dir, 'scripts/e2e/mock-api.js');
    expect(mock).toMatch(/const ROUTES = \{\};/);
    expect(mock).not.toMatch(/auth|DEMO_/);

    // The command removed itself.
    for (const file of [
      'scripts/remove-demo.js',
      'docs/remove-demo.md',
      '__tests__/scripts/removeDemo.test.ts',
    ]) {
      expect(exists(dir, file)).toBe(false);
    }
    expect(
      JSON.parse(read(dir, 'package.json')).scripts['remove-demo']
    ).toBeUndefined();

    // Formatted, and the docs still check out (links, paths, snippets).
    const prettier = spawnSync(
      'npx',
      ['prettier', '--check', '**/*.{ts,tsx,js,json,md}'],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(prettier.status).toBe(0);
    const docs = spawnSync(process.execPath, ['scripts/check-docs.js'], {
      cwd: dir,
      encoding: 'utf8',
    });
    expect(docs.stderr).toBe('');
    expect(docs.status).toBe(0);
  }, 180000);

  it('fails when a doc still names a deleted file', () => {
    const dir = copy();
    fs.appendFileSync(
      path.join(dir, 'docs/conventions.md'),
      '\nSee `features/demo-todos/` for an example.\n'
    );
    commit(dir, 'unmarked demo reference');
    const result = run(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'docs/conventions.md: still mentions features/demo-todos'
    );
  }, 60000);
});
