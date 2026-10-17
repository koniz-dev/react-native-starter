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
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const init = require('../../scripts/init-project.js') as {
  parseArgs(argv: string[]): {
    flags: Set<string>;
    options: Record<string, string>;
  };
  validators: Record<string, (value: string) => string | null>;
  slugify(name: string): string;
  tsString(value: string): string;
  markdownText(text: string): string;
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
    ['bundleId', 'io.acme.notesApp2'],
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
    ['bundleId', 'com.example'],
    // iOS bundle IDs can't contain _; Android rejects Java keywords.
    ['bundleId', 'io.acme.notes_app'],
    ['bundleId', 'com.acme.new'],
    ['bundleId', 'com.class.notes'],
    // Schemes that belong to Expo Go, the web, or the OS.
    ['scheme', 'exp'],
    ['scheme', 'exps'],
    ['scheme', 'https'],
    ['scheme', 'http'],
    ['scheme', 'file'],
    ['name', ''],
    ['name', ' Acme'],
    ['name', 'Acme | Notes'],
    ['name', 'Acme\nNotes'],
    ['owner', ''],
    // Invisible formatting characters: a right-to-left override, a
    // zero-width space.
    ['name', 'Acme\u202ENotes'],
    ['name', 'Acme\u200BNotes'],
    ['owner', 'Acme\u202EInc.'],
    ['owner', ' Acme Inc. '],
    // Expo's development client registers exp+<slug>.
    ['scheme', 'exp+acme'],
    // npm and Expo Doctor reject a package named after its own dependency.
    ['slug', 'react'],
    ['slug', 'expo'],
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

  it('rejects unknown arguments, missing values, and conflicting flags', () => {
    expect(() => init.parseArgs(['--colour'])).toThrow(/unknown argument/);
    expect(() => init.parseArgs(['--name'])).toThrow(/needs a value/);
    expect(() => init.parseArgs(['--name', '--remove-demo'])).toThrow(
      /--name needs a value/
    );
    expect(() => init.parseArgs(['--remove-demo', '--keep-demo'])).toThrow(
      /not both/
    );
    expect(() =>
      init.parseArgs(['--remove-recipes', '--keep-recipes'])
    ).toThrow(/not both/);
  });

  it('derives a slug and quotes strings the way Prettier does', () => {
    expect(init.slugify('Ghi Chú: Acme Notes!')).toBe('ghi-chu-acme-notes');
    expect(init.slugify('Mom’s Recipes')).toBe('moms-recipes');
    expect(init.slugify("Bob's App")).toBe('bobs-app');
    expect(init.tsString('Acme')).toBe("'Acme'");
    expect(init.tsString("Bob's")).toBe(`"Bob's"`);
  });

  it('writes the name into the README as literal Markdown text', () => {
    expect(init.markdownText('Café & <Co> *x* [y]')).toBe(
      'Café \\& \\<Co\\> \\*x\\* \\[y\\]'
    );
    expect(init.markdownText('Acme Notes')).toBe('Acme Notes');
  });
});

/** A committed copy of the working tree, sharing this repo's node_modules. */
function makeCopy(): string {
  const dir = copyProject('init-project-');
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: dir, stdio: 'ignore', env: GIT_ENV });
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

/** Prettier's check over the files format:check covers, with this Node. */
function prettierCheck(dir: string) {
  return spawnSync(
    process.execPath,
    [
      require.resolve('prettier/bin/prettier.cjs'),
      '--check',
      '**/*.{ts,tsx,js,jsx,json,md}',
    ],
    { cwd: dir, encoding: 'utf8' }
  );
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
    expect(result.stdout).toContain('delete scripts/init-project.js');
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

  it('names the empty app name as the problem', () => {
    const dir = copy();
    const result = run(dir, ['--name', '', '--bundle-id', 'com.acme.x']);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/the app name is required/);
  });

  it('writes $ in the name and owner literally', () => {
    const dir = copy();
    const result = run(dir, [
      '--name',
      'Cash$&App',
      '--slug',
      'cash-app',
      '--bundle-id',
      'com.acme.cash',
      '--owner',
      "Acme $' Inc $`",
      '--keep-demo',
      '--keep-recipes',
    ]);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const license = read(dir, 'LICENSE');
    expect(license).toMatch(/^Copyright \(c\) \d{4} Acme \$' Inc \$`$/m);
    expect(license.match(/MIT License/g)).toHaveLength(1);
    const appConfig = read(dir, 'docs/app-config.md');
    expect(appConfig).toContain('`Cash$&App (Dev)`');
    expect(appConfig).toContain('`Cash$&App`');
    expect(appConfig).not.toMatch(/RN Starter/);
  });

  it('on --force, changes the old scheme only where it is the scheme', () => {
    const dir = copy();
    // The production scheme becomes "swipe", a word testing.md also uses.
    const first = run(dir, [
      '--name',
      'Swipe',
      '--bundle-id',
      'com.acme.swipe',
      '--owner',
      'Acme',
      '--keep-demo',
      '--keep-recipes',
    ]);
    expect(first.status).toBe(0);
    const testingDoc = read(dir, 'docs/testing.md');
    const swipeMentions = testingDoc.match(/`swipe`/g)?.length ?? 0;
    fs.writeFileSync(
      path.join(dir, 'scripts/init-project.js'),
      read(ROOT, 'scripts/init-project.js')
    );
    const second = run(dir, [
      '--name',
      'Glide',
      '--bundle-id',
      'com.acme.glide',
      '--owner',
      'Acme',
      '--keep-demo',
      '--keep-recipes',
      '--force',
    ]);
    expect(second.status).toBe(0);
    expect(read(dir, 'docs/testing.md').match(/`swipe`/g)?.length ?? 0).toBe(
      swipeMentions
    );
    expect(read(dir, 'docs/app-config.md')).toContain('`glide`');
    expect(read(dir, 'docs/app-config.md')).toContain('`glide-dev`');
  });

  it('on --force after the APP block was edited, replaces the template identity too', () => {
    const dir = copy();
    // The adopter followed app.config.ts's header and edited APP by hand.
    const config = read(dir, 'app.config.ts')
      .replace("name: 'RN Starter'", "name: 'Acme Notes'")
      .replace("slug: 'react-native-starter'", "slug: 'acme-notes'")
      .replace("scheme: 'rnstarter'", "scheme: 'acmenotes'")
      .replace(
        "bundleId: 'com.example.rnstarter'",
        "bundleId: 'com.acme.notes'"
      );
    fs.writeFileSync(path.join(dir, 'app.config.ts'), config);
    execFileSync('git', ['commit', '-qam', 'edit APP'], {
      cwd: dir,
      env: {
        ...GIT_ENV,
        GIT_AUTHOR_NAME: 't',
        GIT_AUTHOR_EMAIL: 't@example.com',
        GIT_COMMITTER_NAME: 't',
        GIT_COMMITTER_EMAIL: 't@example.com',
      },
    });

    const result = run(dir, [...IDENTITY, '--keep-demo', '--force']);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const leftovers = spawnSync(
      'git',
      [
        'grep',
        '-nE',
        'RN Starter|rnstarter',
        '--',
        '.',
        ':(exclude)__tests__',
        ':(exclude)scripts/init-project.js',
      ],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(leftovers.stdout).toBe('');
    for (const workflow of ['e2e-android.yml', 'e2e-ios.yml']) {
      expect(read(dir, `.github/workflows/${workflow}`)).toContain(
        'com.acme.notes.dev'
      );
    }
  });

  it('refuses a dirty working tree unless --force', () => {
    const dir = copy();
    fs.appendFileSync(path.join(dir, 'README.md'), '\nlocal change\n');
    const result = run(dir, IDENTITY);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/uncommitted changes/);
    expect(read(dir, 'package.json')).toContain('"init-project"');
  });

  it('sets the identity and deletes itself', () => {
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

    // The app's own README replaces the template's pitch.
    const readme = read(dir, 'README.md');
    expect(readme).toMatch(/^# Acme Notes\n/);
    expect(readme).toContain('## Run it');
    expect(readme).toContain('## Documentation');
    expect(readme).not.toMatch(/What you get|template/);
    expect(read(dir, 'LICENSE')).toContain(
      `Copyright (c) ${new Date().getFullYear()} Acme Inc.`
    );
    // The onboarding checklist goes; what stays useful is in App Config.
    expect(exists(dir, 'docs/make-it-yours.md')).toBe(false);
    expect(read(dir, 'docs/app-config.md')).toContain(
      '`com.acme.notes.preview`'
    );
    expect(read(dir, 'docs/app-config.md')).toContain('`Acme Notes (Dev)`');
    // The recipes go by default, with their links and CI's install.
    expect(exists(dir, 'docs/recipes')).toBe(false);
    expect(read(dir, 'AGENTS.md')).not.toContain('recipes/');
    expect(read(dir, 'docs/api-and-storage.md')).not.toContain(
      '@tanstack/react-query'
    );
    expect(read(dir, '.github/workflows/ci.yml')).not.toContain(
      'npm ci --prefix docs/recipes'
    );
    // The project owns the inherited advisory review.
    for (const entry of JSON.parse(read(dir, 'scripts/audit-allowlist.json'))
      .advisories) {
      expect(entry.owner).toBe('Acme Inc. (re-review by reviewBy)');
    }
    for (const workflow of ['e2e-android.yml', 'e2e-ios.yml']) {
      expect(read(dir, `.github/workflows/${workflow}`)).toContain(
        'E2E_APP_ID=com.acme.notes.dev'
      );
    }

    for (const file of [
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
        'koniz-dev|react-native-starter|rnstarter|com\\.example|@init|@recipes|init-project|make-it-yours',
      ],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(leftovers.status).toBe(1);
    expect(leftovers.stdout).toBe('');

    // Formatted: Prettier finds nothing to change.
    expect(prettierCheck(dir).status).toBe(0);
  }, 60000);

  it('keeps the recipes with --keep-recipes, without their markers', () => {
    const dir = copy();
    const result = run(dir, [...IDENTITY, '--keep-demo', '--keep-recipes']);
    expect(result.status).toBe(0);
    expect(exists(dir, 'docs/recipes/state-management.md')).toBe(true);
    expect(read(dir, 'AGENTS.md')).toContain('recipes/state-management.md');
    expect(read(dir, 'docs/api-and-storage.md')).toContain(
      '@tanstack/react-query'
    );
    expect(read(dir, '.github/workflows/ci.yml')).toContain(
      'npm ci --prefix docs/recipes'
    );
    const markers = spawnSync('git', ['grep', '-n', '@recipes'], {
      cwd: dir,
      encoding: 'utf8',
    });
    expect(markers.status).toBe(1);
    expect(markers.stdout).toBe('');
  }, 60000);

  it('after a failure on uncommitted changes, never suggests discarding them', () => {
    const dir = copy();
    fs.writeFileSync(path.join(dir, 'NOTES.md'), 'my notes\n');
    // A write that fails once init-project has started changing files.
    fs.chmodSync(path.join(dir, 'app.config.ts'), 0o444);
    const result = run(dir, [...IDENTITY, '--keep-demo', '--force']);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^init-project: EACCES/);
    expect(result.stderr).toContain(
      'restore what init-project\nchanged by hand'
    );
    expect(result.stderr).not.toMatch(/checkout|clean -fd/);
    expect(read(dir, 'NOTES.md')).toBe('my notes\n');
    expect(exists(dir, 'scripts/init-project.js')).toBe(true);
  });

  it('after a failure on a clean tree, prints a restore command for the project root', () => {
    const dir = copy();
    fs.chmodSync(path.join(dir, 'app.config.ts'), 0o444);
    const result = run(dir, [...IDENTITY, '--keep-demo']);
    expect(result.status).toBe(1);
    // -C with the root, so it works from a subdirectory too.
    const root = JSON.stringify(fs.realpathSync(dir));
    expect(result.stderr.replace(/\/private\/var\//g, '/var/')).toContain(
      `git -C ${root.replace(/\/private\/var\//g, '/var/')} checkout -- .`
    );
    expect(exists(dir, 'scripts/init-project.js')).toBe(true);
  });

  it('changes nothing, and keeps itself, when Prettier cannot format a result', () => {
    const dir = copy();
    // Work in progress that doesn't parse, in a file init-project rewrites.
    fs.appendFileSync(path.join(dir, 'app.config.ts'), '\nconst = ;\n');
    const before = gitStatus(dir);
    const result = run(dir, [...IDENTITY, '--keep-demo', '--force']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "init-project: Prettier can't format the new app.config.ts"
    );
    expect(result.stderr).toContain('Nothing was changed.');
    expect(gitStatus(dir)).toBe(before);
    expect(exists(dir, 'scripts/init-project.js')).toBe(true);
  });

  (HAS_DEMO ? it : it.skip)(
    'says nothing was changed when remove-demo stops before changing anything',
    () => {
      const dir = copy();
      fs.appendFileSync(
        path.join(dir, 'docs/conventions.md'),
        // Split, so remove-demo doesn't read this test as a marker.
        `\n<!-- @${'demo'} remove-block-start -->\nunterminated\n`
      );
      fs.writeFileSync(path.join(dir, 'NOTES.md'), 'my notes\n');
      const before = gitStatus(dir);
      const result = run(dir, [...IDENTITY, '--remove-demo', '--force']);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'docs/conventions.md: unterminated @' + 'demo block'
      );
      expect(result.stderr).toMatch(/Nothing was changed\.\n$/);
      expect(result.stderr).not.toMatch(/checkout|clean -fd/);
      expect(gitStatus(dir)).toBe(before);
    }
  );

  it('without git, says it cannot check or undo, and never suggests git', () => {
    const dir = copy();
    fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
    fs.chmodSync(path.join(dir, 'app.config.ts'), 0o444);
    const result = run(dir, [...IDENTITY, '--keep-demo']);
    expect(result.stdout).toContain('this is not a git repository');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('restore them from your own copy');
    expect(result.stderr).not.toMatch(/git -C|checkout|clean -fd/);
  });

  (HAS_DEMO ? it : it.skip)(
    'stops, and keeps itself, when remove-demo fails after changing files',
    () => {
      const dir = copy();
      // remove-demo rewrites this file, then fails on the write (exit 1).
      fs.chmodSync(path.join(dir, 'shared/i18n/en.ts'), 0o444);
      const result = run(dir, [...IDENTITY, '--remove-demo']);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('remove-demo failed');
      expect(exists(dir, 'scripts/init-project.js')).toBe(true);
      // The identity was not written.
      expect(read(dir, 'app.config.ts')).not.toContain('com.acme.notes');
    },
    60000
  );

  it('removes the demo with --remove-demo and refuses a second run', () => {
    const dir = copy();
    // Keep the script around after the run to try it a second time.
    const script = read(dir, 'scripts/init-project.js');
    const result = run(dir, [...IDENTITY, '--remove-demo']);
    expect(result.status).toBe(0);
    // One closing message, with the sign-in step the demo no longer covers
    // when this run removed it (not when remove-demo had already run).
    expect(result.stdout.match(/Done/g)).toHaveLength(1);
    expect(result.stdout.includes('1. Register your AuthAdapter')).toBe(
      HAS_DEMO
    );
    expect(exists(dir, 'features/demo-auth')).toBe(false);
    expect(read(dir, 'shared/integrations/setup.ts')).not.toMatch(/demo-auth/);
    // remove-demo ran before the identity changes, so neither undid the other.
    expect(read(dir, 'README.md')).toMatch(/^# Acme Notes\n/);
    expect(read(dir, 'README.md')).not.toMatch(/emilys|remove-block/);
    expect(read(dir, '.env.example')).toMatch(/^EXPO_PUBLIC_API_URL=$/m);
    expect(exists(dir, 'scripts/remove-demo.js')).toBe(false);
    // Nothing reads like the template any more (tests may name it).
    const starter = spawnSync(
      'git',
      [
        'grep',
        '-iE',
        "starter|demo|the template|template's",
        '--',
        '.',
        ':(exclude)__tests__',
        ':(exclude)package-lock.json',
        ':(exclude)scripts/init-project.js',
      ],
      { cwd: dir, encoding: 'utf8' }
    );
    // Exit 1: no match (an invalid pathspec would exit 128).
    expect(starter.status).toBe(1);
    expect(starter.stdout).toBe('');
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
      { cwd: dir, env: GIT_ENV }
    );
    const again = run(dir, IDENTITY);
    expect(again.status).toBe(1);
    expect(again.stderr).toMatch(/already initialized/);
  }, 60000);
});
