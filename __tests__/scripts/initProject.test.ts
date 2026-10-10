/**
 * @jest-environment node
 */
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const init = require('../../scripts/init-project.js') as {
  parseArgs(argv: string[]): {
    flags: Set<string>;
    options: Record<string, string>;
  };
  validators: Record<string, (value: string) => string | null>;
  slugify(name: string): string;
  tsString(value: string): string;
};

const ROOT = path.resolve(__dirname, '../..');
/** False once `npm run remove-demo` has run (it deletes itself). */
const HAS_DEMO = fs.existsSync(path.join(ROOT, 'scripts/remove-demo.js'));
const IDENTITY = [
  '--name',
  'Acme Notes',
  '--bundle-id',
  'com.acme.notes',
  '--owner',
  'Acme Inc.',
];

describe('init-project input', () => {
  it.each([
    ['slug', 'acme-notes'],
    ['slug', 'notes2'],
    ['scheme', 'acmenotes'],
    ['scheme', 'acme-notes.app'],
    ['bundleId', 'com.acme.notes'],
    ['bundleId', 'io.acme.notes_app'],
    ['name', 'Acme Notes'],
    ['name', "Bob's Ghi Chú"],
    ['owner', 'Acme Inc.'],
  ])('accepts %s %p', (key, value) => {
    expect(init.validators[key]!(value)).toBeNull();
  });

  it.each([
    ['slug', 'Acme-Notes'],
    ['slug', 'acme_notes'],
    ['slug', '-acme'],
    ['slug', 'acme--notes'],
    ['scheme', 'AcmeNotes'],
    ['scheme', '1acme'],
    ['scheme', 'acme notes'],
    ['bundleId', 'acme'],
    ['bundleId', 'com.acme-corp.notes'],
    ['bundleId', 'com.1acme.notes'],
    ['bundleId', 'com.acme.'],
    ['bundleId', 'com.example.notes'],
    ['name', ''],
    ['name', ' Acme'],
    ['name', 'Acme | Notes'],
    ['name', 'Acme\nNotes'],
    ['owner', ''],
  ])('rejects %s %p', (key, value) => {
    expect(init.validators[key]!(value)).toEqual(expect.any(String));
  });

  it('parses flags and options', () => {
    const args = init.parseArgs([
      '--name',
      'Acme Notes',
      '--slug=acme',
      '--remove-demo',
      '--dry-run',
    ]);
    expect(args.options).toEqual({ name: 'Acme Notes', slug: 'acme' });
    expect([...args.flags]).toEqual(['--remove-demo', '--dry-run']);
  });

  it('rejects unknown arguments, missing values, and conflicting demo flags', () => {
    expect(() => init.parseArgs(['--colour'])).toThrow(/unknown argument/);
    expect(() => init.parseArgs(['--name'])).toThrow(/needs a value/);
    expect(() => init.parseArgs(['--remove-demo', '--keep-demo'])).toThrow(
      /not both/
    );
  });

  it('derives a slug and quotes strings the way Prettier does', () => {
    expect(init.slugify('Ghi Chú: Acme Notes!')).toBe('ghi-chu-acme-notes');
    expect(init.tsString('Acme')).toBe("'Acme'");
    expect(init.tsString("Bob's")).toBe(`"Bob's"`);
  });
});

/** A committed copy of the working tree, sharing this repo's node_modules. */
function makeCopy(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-project-'));
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
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('init', '-q');
  git('add', '-A');
  git(
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@example.com',
    'commit',
    '-qm',
    'template'
  );
  return dir;
}

function run(dir: string, args: string[]) {
  return spawnSync(process.execPath, ['scripts/init-project.js', ...args], {
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

describe('init-project on a copy of the template', () => {
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
    const result = run(dir, [...IDENTITY, '--remove-demo', '--dry-run']);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('update app.config.ts');
    expect(result.stdout).toContain('delete docs/maintainers/');
    if (HAS_DEMO) expect(result.stdout).toContain('delete features/demo-auth');
    expect(result.stdout.match(/Dry run complete\./g)).toHaveLength(1);
    expect(gitStatus(dir)).toBe('');
  });

  it('refuses invalid input without a terminal', () => {
    const dir = copy();
    const result = run(dir, [
      '--name',
      'Acme',
      '--bundle-id',
      'com.example.acme',
      '--owner',
      'Acme',
    ]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/com\.example placeholder/);
    expect(run(dir, ['--name', 'Acme']).stderr).toMatch(
      /--bundle-id is required/
    );
    expect(gitStatus(dir)).toBe('');
  });

  it('refuses a dirty working tree unless --force', () => {
    const dir = copy();
    fs.appendFileSync(path.join(dir, 'README.md'), '\nlocal change\n');
    const result = run(dir, IDENTITY);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/uncommitted changes/);
    expect(read(dir, 'package.json')).toContain('"init-project"');
  });

  it('sets the identity, removes the maintainer files, and deletes itself', () => {
    const dir = copy();
    const result = run(dir, [...IDENTITY, '--keep-demo']);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);

    const config = read(dir, 'app.config.ts');
    expect(config).toContain("name: 'Acme Notes',");
    expect(config).toContain("slug: 'acme-notes',");
    expect(config).toContain("scheme: 'acmenotes',");
    expect(config).toContain("bundleId: 'com.acme.notes',");
    expect(config).toContain("version: '1.0.0',");

    const pkg = JSON.parse(read(dir, 'package.json'));
    expect(pkg).toMatchObject({ name: 'acme-notes', version: '1.0.0' });
    expect(pkg.scripts['init-project']).toBeUndefined();
    const lock = JSON.parse(read(dir, 'package-lock.json'));
    expect(lock.name).toBe('acme-notes');
    expect(lock.packages[''].name).toBe('acme-notes');

    expect(read(dir, 'README.md')).toMatch(/^# Acme Notes\n/);
    expect(read(dir, 'README.md')).toContain('## Documentation');
    expect(read(dir, 'LICENSE')).toContain(
      `Copyright (c) ${new Date().getFullYear()} Acme Inc.`
    );
    expect(read(dir, 'docs/make-it-yours.md')).toContain(
      '`com.acme.notes.preview`'
    );
    expect(read(dir, '.github/workflows/e2e-android.yml')).toContain(
      'E2E_APP_URL=acmenotes-dev://'
    );
    expect(read(dir, 'AGENTS.md')).not.toContain('@maintainer');

    for (const file of [
      'docs/maintainers',
      'scripts/maintainers',
      'scripts/maintainer-files.json',
      'scripts/init-project.js',
      '__tests__/scripts/initProject.test.ts',
    ]) {
      expect(exists(dir, file)).toBe(false);
    }
    expect(exists(dir, 'features/demo-auth')).toBe(HAS_DEMO);

    const leftovers = spawnSync(
      'git',
      [
        'grep',
        '-iE',
        'koniz-dev|react-native-starter|rnstarter|com\\.example|@init|init-project',
      ],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(leftovers.stdout).toBe('');

    // Formatted: Prettier finds nothing to change.
    const prettier = spawnSync(
      'npx',
      ['prettier', '--check', '**/*.{ts,tsx,js,json,md}'],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(prettier.status).toBe(0);
  }, 60000);

  it('removes the demo with --remove-demo and refuses a second run', () => {
    const dir = copy();
    // Keep the script around after the run to try it a second time.
    const script = read(dir, 'scripts/init-project.js');
    const result = run(dir, [...IDENTITY, '--remove-demo']);
    expect(result.status).toBe(0);
    // One closing message, with the sign-in step the demo no longer covers.
    expect(result.stdout.match(/Done/g)).toHaveLength(1);
    expect(result.stdout).toContain('1. Register your AuthAdapter');
    expect(exists(dir, 'features/demo-auth')).toBe(false);
    expect(read(dir, 'shared/integrations/setup.ts')).not.toMatch(/demo-auth/);
    // remove-demo ran before the identity changes, so neither undid the other.
    expect(read(dir, 'README.md')).toMatch(/^# Acme Notes\n/);
    expect(read(dir, 'README.md')).not.toMatch(/emilys|remove-block/);
    expect(read(dir, '.env.example')).toMatch(
      /^EXPO_PUBLIC_USE_DEMO_BACKENDS=false$/m
    );
    expect(exists(dir, 'scripts/remove-demo.js')).toBe(false);
    expect(
      JSON.parse(read(dir, 'package.json')).scripts['remove-demo']
    ).toBeUndefined();

    fs.writeFileSync(path.join(dir, 'scripts/init-project.js'), script);
    execFileSync('git', ['add', '-A'], { cwd: dir });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=t',
        '-c',
        'user.email=t@example.com',
        'commit',
        '-qm',
        'init',
      ],
      { cwd: dir }
    );
    const again = run(dir, IDENTITY);
    expect(again.status).toBe(1);
    expect(again.stderr).toMatch(/already initialized/);
  }, 60000);
});
