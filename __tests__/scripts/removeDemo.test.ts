/**
 * @jest-environment node
 */
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { copyProject } from '@/testing/projectCopy';

// Git in the temporary copies ignores the developer's own config (commit
// signing, hooks), so their commits never prompt or fail.
const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: os.devNull,
  GIT_CONFIG_NOSYSTEM: '1',
  // No background gc or maintenance that outlives a command and writes
  // into a copy while a test reads or deletes it.
  GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: 'gc.auto',
  GIT_CONFIG_VALUE_0: '0',
  GIT_CONFIG_KEY_1: 'maintenance.auto',
  GIT_CONFIG_VALUE_1: 'false',
};

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
  const dir = copyProject('remove-demo-');
  commit(dir, 'template');
  return dir;
}

function commit(dir: string, message: string) {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: dir, stdio: 'ignore', env: GIT_ENV });
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

  it('prints its usage on --help and refuses an unknown argument, changing nothing', () => {
    const dir = copy();

    const help = run(dir, ['--help']);
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('Usage: npm run remove-demo');
    expect(gitStatus(dir)).toBe('');

    const typo = run(dir, ['--dryrun']);
    expect(typo.status).toBe(2);
    expect(typo.stderr).toContain('unknown argument: --dryrun');
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
    // The subflows stay, for the adopter's own (signed-in) flows; signing in
    // uses the test account variables, not the demo's.
    expect(fs.readdirSync(path.join(dir, '.maestro/subflows')).sort()).toEqual([
      'open-app.yaml',
      'open-login.yaml',
      'sign-in.yaml',
      'type-username.yaml',
    ]);
    expect(read(dir, '.maestro/subflows/sign-in.yaml')).toMatch(
      /runFlow: type-username\.yaml/
    );
    expect(read(dir, '.maestro/subflows/type-username.yaml')).toMatch(
      /inputText: \$\{MAESTRO_E2E_USERNAME\}/
    );
    expect(read(dir, '.maestro/config.yaml')).not.toMatch(/Tab navigation/);
    // The e2e runner points both URLs at the e2e mock (or E2E_* overrides),
    // and the mock lost its demo routes and account.
    const runner = read(dir, 'scripts/e2e/run.sh');
    expect(runner).not.toMatch(/DEMO|emilys/);
    expect(runner).toMatch(/-e "API_URL=\$API_URL"/);
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
    // With this Node, not npx (which needs a shell on Windows).
    const prettier = spawnSync(
      process.execPath,
      [
        require.resolve('prettier/bin/prettier.cjs'),
        '--check',
        '**/*.{ts,tsx,js,jsx,json,md}',
      ],
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
    expect(result.status).toBe(2);
    expect(result.stderr).toContain(
      'docs/conventions.md: still mentions features/demo-todos'
    );
    expect(gitStatus(dir)).toBe('');
  }, 60000);

  it('removes marked blocks anywhere in the project, not only in source folders', () => {
    const dir = copy();
    const marked = (comment: string) =>
      `${comment} @${'demo'} remove-block-start\n${comment} demo only\n${comment} @${'demo'} remove-block-end\n`;
    fs.appendFileSync(path.join(dir, 'testing/render.tsx'), marked('//'));
    fs.appendFileSync(path.join(dir, '.github/workflows/ci.yml'), marked('#'));
    commit(dir, 'markers outside the source folders');

    const result = run(dir);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(read(dir, 'testing/render.tsx')).not.toMatch(/demo only/);
    expect(read(dir, '.github/workflows/ci.yml')).not.toMatch(/demo only/);
  }, 60000);

  it('keeps itself and the demo, and says how to restore, when a write fails', () => {
    const dir = copy();
    fs.chmodSync(path.join(dir, 'shared/i18n/en.ts'), 0o444);
    const result = run(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^remove-demo: EACCES/);
    expect(result.stderr).not.toMatch(/\n\s+at /);
    expect(result.stderr).toContain('checkout -- . &&');
    expect(exists(dir, 'scripts/remove-demo.js')).toBe(true);
    expect(exists(dir, 'features/demo-todos')).toBe(true);
  }, 60000);

  it('refuses uncommitted changes unless --force, and then never suggests discarding them', () => {
    const dir = copy();
    fs.writeFileSync(path.join(dir, 'NOTES.md'), 'my notes\n');
    const refused = run(dir);
    expect(refused.status).toBe(2);
    expect(refused.stderr).toContain('uncommitted changes');
    expect(refused.stderr).toContain('Nothing was changed.');
    expect(gitStatus(dir)).toBe('?? NOTES.md\n');

    // With --force, a write that fails part way: restore by hand.
    fs.chmodSync(path.join(dir, 'shared/i18n/en.ts'), 0o444);
    const result = run(dir, ['--force']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('restore what remove-demo changed by hand');
    expect(result.stderr).not.toMatch(/checkout|clean -fd/);
    expect(read(dir, 'NOTES.md')).toBe('my notes\n');
  }, 60000);

  it('without git, says it cannot check or undo, unless its caller already did', () => {
    // Never a repository, as a project downloaded as a ZIP.
    const dir = copyProject('remove-demo-');
    copies.push(dir);
    const result = run(dir, ['--dry-run']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      'Note: this is not a git repository, so remove-demo cannot check for'
    );
    // A caller runs it with --no-summary, after printing its own note.
    const quiet = run(dir, ['--dry-run', '--no-summary']);
    expect(quiet.status).toBe(0);
    expect(quiet.stdout).not.toContain('not a git repository');
  }, 60000);

  it("changes nothing when Prettier can't format a result", () => {
    const dir = copy();
    // Parses only with the marked line in: it opens the comment that the
    // next line closes.
    fs.writeFileSync(
      path.join(dir, 'shared/lib/broken.ts'),
      `/* @${'demo'} remove-current-line\nexport const x = 1; */\n`
    );
    commit(dir, 'a marker whose result does not parse');
    const result = run(dir);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain(
      "shared/lib/broken.ts: Prettier can't format the result"
    );
    expect(result.stderr).toContain('Nothing was changed.');
    expect(gitStatus(dir)).toBe('');
    expect(exists(dir, 'features/demo-todos')).toBe(true);
  }, 60000);

  it.each([
    [
      'a nested block',
      'README.md',
      `\n<!-- @${'demo'} remove-block-start -->\n<!-- @${'demo'} remove-block-start -->\nx\n<!-- @${'demo'} remove-block-end -->\n`,
      'README.md: nested @demo block',
    ],
    [
      'an end without a start',
      'README.md',
      `\n<!-- @${'demo'} remove-block-end -->\n`,
      'README.md: @demo remove-block end without start',
    ],
    [
      'a misspelled marker',
      'shared/lib/x.ts',
      `// @${'demo'} remove-blok-start\nexport const x = 1;\n`,
      'shared/lib/x.ts: unhandled @demo marker',
    ],
    [
      'an unmarked import of a demo feature',
      'shared/lib/x.ts',
      `// @${'demo'} remove-current-line\nexport { fetchTodos } from '@/features/demo-todos/api/todosApi';\n`,
      'shared/lib/x.ts: still imports a demo feature',
    ],
  ])(
    'changes nothing on %s',
    (_case, file, text, problem) => {
      const dir = copy();
      fs.appendFileSync(path.join(dir, file), text);
      commit(dir, _case);
      const result = run(dir);
      expect(result.status).toBe(2);
      expect(result.stderr).toContain(problem);
      expect(result.stderr).toContain('Nothing was changed.');
      expect(gitStatus(dir)).toBe('');
    },
    60000
  );

  it('changes nothing when a marker is malformed, and says so without a stack trace', () => {
    const dir = copy();
    fs.appendFileSync(
      path.join(dir, 'README.md'),
      '\n<!-- @demo remove-block-start -->\nnote\n'
    );
    commit(dir, 'unterminated marker');
    const result = run(dir);
    expect(result.status).toBe(2);
    expect(result.stderr).toBe(
      'remove-demo: README.md: unterminated @demo block\nFix the above, then run it again.\nNothing was changed.\n'
    );
    expect(gitStatus(dir)).toBe('');
  }, 60000);
});
