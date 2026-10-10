#!/usr/bin/env node
/**
 * Turns the starter into your project (npm run init-project; see
 * docs/getting-started.md):
 *
 * 1. sets the app identity: the APP block in app.config.ts (name, slug,
 *    scheme, bundle ID, version 1.0.0), package.json and package-lock.json
 *    (name = slug, version 1.0.0), the README title and intro, the LICENSE
 *    holder, and the identity examples in the docs and the e2e workflow;
 * 2. runs `npm run remove-demo` when asked (--remove-demo), before planning
 *    the other changes, since it edits some of the same files;
 * 3. deletes the starter's maintainer files (scripts/maintainer-files.json)
 *    and every `@init remove-block` in the docs;
 * 4. deletes itself, its test, and its npm script, then formats the changed
 *    files with Prettier.
 *
 * It refuses to run on a dirty working tree or a project that is already
 * initialized, unless --force is given.
 *
 * Usage:
 *   npm run init-project                      (prompts for each value)
 *   npm run init-project -- --name "Acme Notes" --bundle-id com.acme.notes \
 *     [--slug acme-notes] [--scheme acmenotes] [--owner "Acme Inc."] \
 *     [--remove-demo | --keep-demo] [--dry-run] [--force]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const ROOT = path.resolve(__dirname, '..');
const PLACEHOLDER_BUNDLE_PREFIX = 'com.example.';
const VERSION = '1.0.0';
const MANIFEST = 'scripts/maintainer-files.json';
/** Deleted by remove-demo itself, so its absence means the demo is gone. */
const REMOVE_DEMO = 'scripts/remove-demo.js';
const SELF_FILES = [
  'scripts/init-project.js',
  '__tests__/scripts/initProject.test.ts',
];
/** Text files that can hold `@init remove-block` markers. */
const MARKED_FILES = [
  'README.md',
  'docs/getting-started.md',
  'docs/make-it-yours.md',
  'scripts/README.md',
];

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const FLAGS = new Set([
  '--remove-demo',
  '--keep-demo',
  '--dry-run',
  '--force',
  '--help',
]);
const OPTIONS = new Set([
  '--name',
  '--slug',
  '--scheme',
  '--bundle-id',
  '--owner',
]);

function parseArgs(argv) {
  const args = { flags: new Set(), options: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const [key, inline] = arg.split(/=(.*)/s);
    if (FLAGS.has(arg)) {
      args.flags.add(arg);
    } else if (OPTIONS.has(key)) {
      const value = inline ?? argv[(i += 1)];
      if (value === undefined) throw new Error(`${key} needs a value`);
      args.options[key.slice(2)] = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (args.flags.has('--remove-demo') && args.flags.has('--keep-demo')) {
    throw new Error('use --remove-demo or --keep-demo, not both');
  }
  return args;
}

/** Each validator returns an error message, or null when the value is valid. */
const validators = {
  name(value) {
    if (!value || !value.trim()) return 'the app name is required';
    if (value !== value.trim())
      return 'the app name has leading or trailing spaces';
    if (value.length > 50) return 'the app name is longer than 50 characters';
    if (/[\p{Cc}`\\|]/u.test(value)) {
      return 'the app name contains a control character, backtick, backslash, or |';
    }
    return null;
  },
  slug(value) {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value ?? '') && value.length <= 214
      ? null
      : `slug "${value}" must be lowercase letters and digits separated by single dashes (e.g. acme-notes)`;
  },
  scheme(value) {
    return /^[a-z][a-z0-9+.-]*$/.test(value ?? '')
      ? null
      : `scheme "${value}" must start with a lowercase letter and use only a-z, 0-9, +, ., - (e.g. acmenotes)`;
  },
  bundleId(value) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(value ?? '')
    ) {
      return `bundle ID "${value}" must be reverse-DNS: two or more dot-separated parts, each starting with a letter and using only letters, digits, and _ (e.g. com.acme.notes)`;
    }
    if (value.startsWith(PLACEHOLDER_BUNDLE_PREFIX)) {
      return `bundle ID "${value}" uses the com.example placeholder; use a domain you own`;
    }
    return null;
  },
  owner(value) {
    if (!value || !value.trim()) return 'the LICENSE holder is required';
    return /\p{Cc}/u.test(value)
      ? 'the LICENSE holder contains a control character'
      : null;
  },
};

/** "Acme Notes!" -> "acme-notes" */
function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function gitUserName() {
  const result = spawnSync('git', ['config', 'user.name'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

/** Fills in values from flags, then prompts (on a terminal) or derives defaults. */
async function collectInput(args) {
  const given = {
    name: args.options.name,
    slug: args.options.slug,
    scheme: args.options.scheme,
    bundleId: args.options['bundle-id'],
    owner: args.options.owner,
  };
  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  const rl = interactive
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null;

  const ask = async (key, label, fallback) => {
    if (given[key] !== undefined) return given[key];
    if (!rl) {
      if (fallback) return fallback;
      throw new Error(
        `--${key === 'bundleId' ? 'bundle-id' : key} is required when not run in a terminal`
      );
    }
    for (;;) {
      const answer = (
        await rl.question(fallback ? `${label} (${fallback}): ` : `${label}: `)
      ).trim();
      const value = answer || fallback;
      const error = validators[key](value);
      if (!error) return value;
      process.stdout.write(`  ${error}\n`);
    }
  };

  try {
    const name = await ask('name', 'App name (shown under the icon)');
    const slug = await ask(
      'slug',
      'Slug (Expo project and npm package name)',
      slugify(name) || undefined
    );
    const scheme = await ask(
      'scheme',
      'URL scheme',
      slug ? slug.replace(/-/g, '') : undefined
    );
    const bundleId = await ask(
      'bundleId',
      'Bundle / package ID (reverse-DNS, e.g. com.acme.notes)'
    );
    const owner = await ask(
      'owner',
      'LICENSE holder',
      gitUserName() || undefined
    );

    const demoPresent = fs.existsSync(path.join(ROOT, REMOVE_DEMO));
    let removeDemo = demoPresent && args.flags.has('--remove-demo');
    if (demoPresent && !removeDemo && !args.flags.has('--keep-demo') && rl) {
      const answer = (
        await rl.question('Remove the demo features? (y/N): ')
      ).trim();
      removeDemo = /^y(es)?$/i.test(answer);
    }

    const input = { name, slug, scheme, bundleId, owner, removeDemo };
    const errors = Object.keys(validators)
      .map(key => validators[key](input[key]))
      .filter(Boolean);
    if (errors.length > 0) throw new Error(errors.join('\n'));
    return input;
  } finally {
    rl?.close();
  }
}

// ---------------------------------------------------------------------------
// Changes
// ---------------------------------------------------------------------------

const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

/** A TypeScript string literal, quoted the way Prettier (singleQuote) would. */
function tsString(value) {
  const escaped = value.replace(/\\/g, '\\\\');
  return value.includes("'") && !value.includes('"')
    ? `"${escaped}"`
    : `'${escaped.replace(/'/g, "\\'")}'`;
}

function unquote(literal) {
  return literal.slice(1, -1).replace(/\\(['"\\])/g, '$1');
}

/** The current values in app.config.ts's APP block. */
function readAppBlock(text) {
  const block = /(?:export )?const APP = \{[\s\S]*?\n\} as const;/.exec(text);
  if (!block) throw new Error('app.config.ts: APP block not found');
  const current = {};
  for (const key of ['name', 'slug', 'scheme', 'bundleId', 'version']) {
    const match = new RegExp(
      `\\n  ${key}: ('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"),`
    ).exec(block[0]);
    if (!match) throw new Error(`app.config.ts: APP.${key} not found`);
    current[key] = unquote(match[1]);
  }
  return current;
}

function replaceAppBlock(text, input, current) {
  const values = { ...input, version: VERSION };
  let out = text;
  for (const key of ['name', 'slug', 'scheme', 'bundleId', 'version']) {
    out = out.replace(
      new RegExp(
        `(\\n  ${key}: )('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")(,)`
      ),
      (_, before, _literal, after) =>
        `${before}${tsString(values[key])}${after}`
    );
  }
  return out.replace(`e.g. ${current.scheme}://.`, `e.g. ${input.scheme}://.`);
}

/** Deletes every block between `@init remove-block-start` and `-end` lines. */
function stripInitBlocks(text, file) {
  const out = [];
  let inBlock = false;
  for (const line of text.split('\n')) {
    if (line.includes('@init remove-block-start')) {
      if (inBlock) throw new Error(`${file}: nested @init block`);
      inBlock = true;
    } else if (line.includes('@init remove-block-end')) {
      if (!inBlock) throw new Error(`${file}: @init block end without start`);
      inBlock = false;
    } else if (!inBlock) {
      out.push(line);
    }
  }
  if (inBlock) throw new Error(`${file}: unterminated @init block`);
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function replaceReadmeIntro(text, name) {
  const start = text.indexOf('\n## ');
  if (!text.startsWith('# ') || start < 0)
    throw new Error('README.md: no title or sections');
  const intro = `# ${name}\n\n${name} is an Expo (SDK 57) and React Native app. Its foundation (routing, session, HTTP, storage, theming, error reporting, i18n, test setup) came from a starter; every third-party service sits behind a typed seam with a no-op or console default.\n`;
  return intro + text.slice(start);
}

/** Markdown table cells and inline code can't hold a raw |. */
const md = value => value.replace(/\|/g, '\\|');

/**
 * Builds the list of changes: { file, action: 'write' | 'delete', summary,
 * content? }. Nothing is written here.
 */
function planChanges(input) {
  const changes = [];
  const write = (file, summary, content) => {
    if (content !== read(file))
      changes.push({ file, action: 'write', summary, content });
  };

  const config = read('app.config.ts');
  const current = readAppBlock(config);
  write(
    'app.config.ts',
    `APP: name "${current.name}" -> "${input.name}", slug ${current.slug} -> ${input.slug}, scheme ${current.scheme} -> ${input.scheme}, bundleId ${current.bundleId} -> ${input.bundleId}, version ${current.version} -> ${VERSION}`,
    replaceAppBlock(config, input, current)
  );

  const pkg = JSON.parse(read('package.json'));
  pkg.name = input.slug;
  pkg.version = VERSION;
  delete pkg.scripts['init-project'];
  write(
    'package.json',
    `name -> ${input.slug}, version -> ${VERSION}, remove the init-project script`,
    `${JSON.stringify(pkg, null, 2)}\n`
  );

  if (exists('package-lock.json')) {
    const lock = JSON.parse(read('package-lock.json'));
    lock.name = input.slug;
    lock.version = VERSION;
    if (lock.packages?.['']) {
      lock.packages[''].name = input.slug;
      lock.packages[''].version = VERSION;
    }
    write(
      'package-lock.json',
      `name -> ${input.slug}, version -> ${VERSION}`,
      `${JSON.stringify(lock, null, 2)}\n`
    );
  }

  write(
    'LICENSE',
    `copyright holder -> ${new Date().getFullYear()} ${input.owner}`,
    read('LICENSE').replace(
      /^Copyright \(c\) .*$/m,
      `Copyright (c) ${new Date().getFullYear()} ${input.owner}`
    )
  );

  // Identity examples: the variant table, the dev scheme, the e2e workflow.
  const ids = {
    [`${current.bundleId}.dev`]: `${input.bundleId}.dev`,
    [`${current.bundleId}.preview`]: `${input.bundleId}.preview`,
    [current.bundleId]: input.bundleId,
    [`${current.scheme}-dev`]: `${input.scheme}-dev`,
    [`${current.scheme}-preview`]: `${input.scheme}-preview`,
    [current.scheme]: input.scheme,
  };
  const replaceIds = text =>
    text.replace(
      /`([^`\s]+)`|(?<==)(\S+?)(?=:\/\/|"|$)/gm,
      (match, code, assigned) => {
        const value = code ?? assigned;
        const base = value.replace(/:\/\/$/, '');
        if (!(base in ids)) return match;
        const replaced = value.replace(base, ids[base]);
        return code !== undefined ? `\`${replaced}\`` : replaced;
      }
    );
  const nameCells = text =>
    text
      .replace(`\`${current.name} (Dev)\``, `\`${md(input.name)} (Dev)\``)
      .replace(
        `\`${current.name} (Preview)\``,
        `\`${md(input.name)} (Preview)\``
      )
      .replace(`\`${current.name}\``, `\`${md(input.name)}\``);

  const marked = file =>
    MARKED_FILES.includes(file) ? stripInitBlocks : text => text;
  const docs = {
    'README.md': text => replaceReadmeIntro(text, input.name),
    'docs/make-it-yours.md': text => nameCells(replaceIds(text)),
    'docs/testing.md': replaceIds,
    '.github/workflows/e2e-android.yml': replaceIds,
  };
  for (const file of new Set([...MARKED_FILES, ...Object.keys(docs)])) {
    if (!exists(file)) continue;
    const transform = docs[file] ?? (text => text);
    const summary = [
      file === 'README.md' ? 'title and intro' : null,
      docs[file] && file !== 'README.md' ? 'identity examples' : null,
      MARKED_FILES.includes(file) && read(file).includes('@init remove-block')
        ? 'remove @init blocks'
        : null,
    ]
      .filter(Boolean)
      .join(', ');
    write(file, summary, transform(marked(file)(read(file), file)));
  }

  if (exists(MANIFEST)) {
    const manifest = JSON.parse(read(MANIFEST));
    for (const block of manifest.blocks ?? []) {
      const pending = changes.find(change => change.file === block.file);
      const text = pending ? pending.content : read(block.file);
      const start = text.indexOf(block.start);
      const end = text.indexOf(block.end);
      if (start < 0 || end < start) continue;
      const content =
        text.slice(0, start) +
        text.slice(end + block.end.length).replace(/^\n+/, '');
      if (pending) {
        pending.content = content;
        pending.summary += ', remove the maintainer block';
      } else {
        changes.push({
          file: block.file,
          action: 'write',
          summary: 'remove the maintainer block',
          content,
        });
      }
    }
    for (const file of manifest.files) {
      if (exists(file))
        changes.push({ file, action: 'delete', summary: 'maintainer file' });
    }
  }

  for (const file of SELF_FILES) {
    if (exists(file))
      changes.push({ file, action: 'delete', summary: 'init-project itself' });
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function gitStatus() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function runRemoveDemo(dryRun) {
  const result = spawnSync(
    process.execPath,
    // Its own closing message would repeat or precede this script's.
    [
      path.join(ROOT, REMOVE_DEMO),
      '--no-summary',
      ...(dryRun ? ['--dry-run'] : []),
    ],
    {
      cwd: ROOT,
      stdio: 'inherit',
    }
  );
  if (result.status !== 0) throw new Error('remove-demo failed');
}

const HELP = `Usage: npm run init-project [-- options]

Prompts for every value that is not given (in a terminal).

  --name <name>         app name shown under the icon
  --slug <slug>         Expo slug and npm package name (default: from the name)
  --scheme <scheme>     deep-link URL scheme (default: the slug without dashes)
  --bundle-id <id>      reverse-DNS iOS bundle ID and Android package
  --owner <holder>      LICENSE copyright holder (default: git user.name)
  --remove-demo         also run npm run remove-demo
  --keep-demo           keep the demo (the default without a terminal)
  --dry-run             list every change without making it
  --force               run on uncommitted changes or a second time
  --help                show this help`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has('--help')) {
    process.stdout.write(`${HELP}\n`);
    return;
  }
  const dryRun = args.flags.has('--dry-run');
  const force = args.flags.has('--force');
  const log = message => process.stdout.write(`${message}\n`);

  const current = readAppBlock(read('app.config.ts'));
  if (!current.bundleId.startsWith(PLACEHOLDER_BUNDLE_PREFIX) && !force) {
    throw new Error(
      `this project is already initialized (bundle ID ${current.bundleId}); pass --force to run again`
    );
  }
  const status = gitStatus();
  if (status && !force && !dryRun) {
    throw new Error(
      `the working tree has uncommitted changes; commit or stash them, or pass --force:\n${status}`
    );
  }

  const input = await collectInput(args);
  const demoPresent = exists(REMOVE_DEMO);

  log(dryRun ? 'Dry run: nothing is changed.' : 'Initializing the project...');
  if (input.removeDemo) {
    log('  run remove-demo:');
    runRemoveDemo(dryRun);
  } else if (demoPresent) {
    log('  keep the demo (run npm run remove-demo later to remove it)');
  }

  // Planned after remove-demo, which edits some of the same files.
  const changes = planChanges(input);
  for (const change of changes) {
    log(
      `  ${change.action === 'delete' ? 'delete' : 'update'} ${change.file}: ${change.summary}`
    );
  }
  if (dryRun) {
    log('Dry run complete.');
    return;
  }

  for (const change of changes) {
    const full = path.join(ROOT, change.file);
    if (change.action === 'delete')
      fs.rmSync(full, { recursive: true, force: true });
    else fs.writeFileSync(full, change.content);
  }
  const testsDir = path.join(ROOT, '__tests__/scripts');
  if (fs.existsSync(testsDir) && fs.readdirSync(testsDir).length === 0)
    fs.rmdirSync(testsDir);

  const formattable = changes
    .filter(
      change =>
        change.action === 'write' && /\.(ts|tsx|js|json|md)$/.test(change.file)
    )
    .map(change => change.file);
  const prettier = spawnSync('npx', ['prettier', '--write', ...formattable], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  if (prettier.status !== 0) throw new Error('prettier failed');

  const steps = [
    ...(input.removeDemo
      ? [
          'Register your AuthAdapter in shared/integrations/setup.ts and set your\n     backend URLs in .env (docs/connect-your-backend.md).',
        ]
      : []),
    'Review the advisories in scripts/audit-allowlist.json and make them yours\n     (docs/getting-started.md#dependency-advisories).',
    'Replace the images in assets/ and the palette in shared/ui/theme.ts\n     (docs/make-it-yours.md).',
    'Run npm run lint, npm run type-check, and npm run test:ci, then commit.',
  ];
  log(
    `Done: this is now ${input.name}. Next:\n${steps
      .map((step, i) => `  ${i + 1}. ${step}`)
      .join('\n')}`
  );
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`init-project: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = { parseArgs, validators, slugify, tsString, stripInitBlocks };
