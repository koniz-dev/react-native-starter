#!/usr/bin/env node
/**
 * Turns the starter into your project (npm run init-project; see
 * docs/getting-started.md):
 *
 * 1. sets the app identity: the APP block in app.config.ts (name, slug,
 *    scheme, bundle ID, version 1.0.0), package.json and package-lock.json
 *    (name = slug, version 1.0.0), the LICENSE holder, the owner of the
 *    audit allowlist entries, and the identity examples in the docs and the
 *    e2e workflow; README.md becomes a short README for the app;
 * 2. runs `npm run remove-demo` when asked (--remove-demo), before planning
 *    the other changes, since it edits some of the same files;
 * 3. deletes the template's onboarding text: every `@init remove-block` and
 *    docs/make-it-yours.md;
 * 4. deletes the state-management recipes and every `@recipes remove-block`
 *    (the TanStack Query example, links, and CI's install of their
 *    libraries), unless --keep-recipes;
 * 5. deletes itself, its test, and its npm script, then formats the changed
 *    files with Prettier.
 *
 * It refuses to run on a dirty working tree or a project that is already
 * initialized, unless --force is given.
 *
 * Usage:
 *   npm run init-project                      (prompts for each value)
 *   npm run init-project -- --name "Acme Notes" --bundle-id com.acme.notes \
 *     [--slug acme-notes] [--scheme acmenotes] [--owner "Acme Inc."] \
 *     [--remove-demo | --keep-demo] [--remove-recipes | --keep-recipes]
 *     [--dry-run] [--force]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const PLACEHOLDER_BUNDLE_PREFIX = 'com.example.';
/**
 * The template's identity, as shipped. A run with --force after the APP block
 * was edited by hand still replaces these where they appear as examples.
 */
const TEMPLATE_APP = {
  name: 'RN Starter',
  slug: 'react-native-starter',
  scheme: 'rnstarter',
  bundleId: 'com.example.rnstarter',
};
const VERSION = '1.0.0';
/** Deleted by remove-demo itself, so its absence means the demo is gone. */
const REMOVE_DEMO = 'scripts/remove-demo.js';
const SELF_FILES = [
  'scripts/init-project.js',
  '__tests__/scripts/initProject.test.ts',
];
/** Text files that can hold `@init remove-block` markers. */
const MARKED_FILES = [
  'docs/README.md',
  'docs/getting-started.md',
  'scripts/README.md',
];
/** Template onboarding pages, deleted once the project is initialized. */
const TEMPLATE_DOCS = ['docs/make-it-yours.md'];
const RECIPES = 'docs/recipes';
/** Files that can hold `@recipes remove-block` markers. */
const RECIPE_MARKED_FILES = [
  'AGENTS.md',
  'docs/README.md',
  'docs/api-and-storage.md',
  '.github/workflows/ci.yml',
];
const ALLOWLIST = 'scripts/audit-allowlist.json';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const FLAGS = new Set([
  '--remove-demo',
  '--keep-demo',
  '--remove-recipes',
  '--keep-recipes',
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
      // `--name --remove-demo` is a missing value, not the name "--remove-demo".
      if (
        value === undefined ||
        (inline === undefined && value.startsWith('--'))
      )
        throw new Error(`${key} needs a value`);
      args.options[key.slice(2)] = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (args.flags.has('--remove-demo') && args.flags.has('--keep-demo')) {
    throw new Error('use --remove-demo or --keep-demo, not both');
  }
  if (args.flags.has('--remove-recipes') && args.flags.has('--keep-recipes')) {
    throw new Error('use --remove-recipes or --keep-recipes, not both');
  }
  return args;
}

/** Java keywords and literals: Android rejects them as package segments. */
const JAVA_RESERVED = new Set(
  (
    'abstract assert boolean break byte case catch char class const continue ' +
    'default do double else enum extends false final finally float for goto ' +
    'if implements import instanceof int interface long native new null ' +
    'package private protected public return short static strictfp super ' +
    'switch synchronized this throw throws transient true try void volatile while'
  ).split(' ')
);

/** URL schemes the app must not claim: Expo Go's, the web's, the OS's. */
const RESERVED_SCHEMES = new Set([
  'exp',
  'exps',
  'expo',
  'http',
  'https',
  'file',
  'content',
  'data',
  'javascript',
  'mailto',
  'tel',
  'sms',
  'intent',
]);

/**
 * Invisible formatting characters (Unicode \p{Cf}): bidi controls, zero-width
 * spaces, word joiners, soft hyphens, and the like change how a name reads
 * or slugifies without being seen. Except the joiners (U+200C, U+200D) and
 * emoji tag characters (U+E0020-U+E007F), which emoji and Persian or Indic
 * spelling use.
 */
const INVISIBLE = /(?!\u200C|\u200D|[\u{E0020}-\u{E007F}])\p{Cf}/u;

/** Each validator returns an error message, or null when the value is valid. */
const validators = {
  name(value) {
    if (!value || !value.trim()) return 'the app name is required';
    if (value !== value.trim())
      return 'the app name has leading or trailing spaces';
    if (value.length > 50) return 'the app name is longer than 50 characters';
    // Bidi controls (a right-to-left override makes the name read
    // differently than it is) and invisible spaces; joiners stay, since
    // emoji and Persian or Indic spelling use them.
    if (/[\p{Cc}`\\|]/u.test(value) || INVISIBLE.test(value)) {
      return 'the app name contains a control or invisible character, backtick, backslash, or |';
    }
    return null;
  },
  slug(value) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value ?? '') || value.length > 214) {
      return `slug "${value}" must be lowercase letters and digits separated by single dashes (e.g. acme-notes)`;
    }
    // npm (and Expo Doctor) reject a package named after one of its own
    // dependencies.
    const { dependencies = {}, devDependencies = {} } = JSON.parse(
      read('package.json')
    );
    if (
      Object.hasOwn(dependencies, value) ||
      Object.hasOwn(devDependencies, value)
    ) {
      return `slug "${value}" is the name of a dependency; pick another (e.g. ${value}-app)`;
    }
    return null;
  },
  scheme(value) {
    if (!/^[a-z][a-z0-9+.-]*$/.test(value ?? '')) {
      return `scheme "${value}" must start with a lowercase letter and use only a-z, 0-9, +, ., - (e.g. acmenotes)`;
    }
    if (RESERVED_SCHEMES.has(value) || /^exps?\+/.test(value)) {
      return `scheme "${value}" belongs to Expo Go, the web, or the OS; pick one for your app (e.g. acmenotes)`;
    }
    return null;
  },
  bundleId(value) {
    // Letters and digits only: iOS doesn't allow _, Android doesn't allow -.
    if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(value ?? '')) {
      return `bundle ID "${value}" must be reverse-DNS: two or more dot-separated parts, each starting with a letter and using only letters and digits (e.g. com.acme.notes)`;
    }
    if (`${value}.`.startsWith(PLACEHOLDER_BUNDLE_PREFIX)) {
      return `bundle ID "${value}" uses the com.example placeholder; use a domain you own`;
    }
    const keyword = value.split('.').find(part => JAVA_RESERVED.has(part));
    if (keyword) {
      return `bundle ID "${value}": "${keyword}" is a Java keyword, which Android doesn't allow as a part`;
    }
    return null;
  },
  owner(value) {
    if (!value || !value.trim()) return 'the LICENSE holder is required';
    if (value !== value.trim())
      return 'the LICENSE holder has leading or trailing spaces';
    return /\p{Cc}/u.test(value) || INVISIBLE.test(value)
      ? 'the LICENSE holder contains a control or invisible character'
      : null;
  },
};

/** "Acme Notes!" -> "acme-notes" */
function slugify(name) {
  return (
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      // Drop apostrophes: "Mom's Recipes" is moms-recipes, not mom-s-recipes.
      .replace(/['\u2019]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Formats the planned contents with the project's Prettier, in memory, so a
 * Prettier failure (a syntax error in a file being rewritten, say) stops the
 * run before init-project writes anything. Files Prettier ignores are left
 * as they are.
 */
async function formatChanges(changes) {
  const prettier = require('prettier');
  for (const change of changes) {
    if (
      change.action !== 'write' ||
      !/\.(ts|tsx|js|json|md)$/.test(change.file)
    )
      continue;
    const file = path.join(ROOT, change.file);
    const info = await prettier.getFileInfo(file, {
      ignorePath: ['.gitignore', '.prettierignore'].map(name =>
        path.join(ROOT, name)
      ),
    });
    if (info.ignored || !info.inferredParser) continue;
    try {
      const options = await prettier.resolveConfig(file);
      change.content = await prettier.format(change.content, {
        ...options,
        filepath: file,
      });
    } catch (error) {
      throw new Error(
        `Prettier can't format the new ${change.file}: ${String(error.message).split('\n')[0]}`
      );
    }
  }
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
  // Answers come from stdin; the output may be piped (`| tee init.log`).
  const interactive = Boolean(process.stdin.isTTY);
  const rl = interactive
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null;
  // Read answers line by line from one iterator: rl.question() drops the
  // rest of a paste that holds several answers.
  const lines = rl?.[Symbol.asyncIterator]();
  const question = async prompt => {
    process.stdout.write(prompt);
    const next = await lines.next();
    if (next.done) throw new Error('input ended before all answers were given');
    return next.value;
  };

  const ask = async (key, label, fallback) => {
    if (given[key] !== undefined) {
      const error = validators[key](given[key]);
      if (error) throw new Error(error);
      return given[key];
    }
    if (!rl) {
      if (fallback) return fallback;
      throw new Error(
        `--${key === 'bundleId' ? 'bundle-id' : key} is required when not run in a terminal`
      );
    }
    for (;;) {
      const answer = (
        await question(fallback ? `${label} (${fallback}): ` : `${label}: `)
      ).trim();
      const value = answer || fallback;
      const error = value ? validators[key](value) : 'a value is required';
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
        await question('Remove the demo features? (y/N): ')
      ).trim();
      removeDemo = /^y(es)?$/i.test(answer);
    }

    // The recipes go unless kept: a project picks one store library, or none.
    const recipesPresent = fs.existsSync(path.join(ROOT, RECIPES));
    let removeRecipes = recipesPresent && !args.flags.has('--keep-recipes');
    if (removeRecipes && !args.flags.has('--remove-recipes') && rl) {
      const answer = (
        await question(
          'Keep the state-management recipes (Zustand, Redux, Jotai, Context)? (y/N): '
        )
      ).trim();
      removeRecipes = !/^y(es)?$/i.test(answer);
    }

    const input = {
      name,
      slug,
      scheme,
      bundleId,
      owner,
      removeDemo,
      removeRecipes,
    };
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
  for (const scheme of new Set([current.scheme, TEMPLATE_APP.scheme])) {
    out = out.replace(`e.g. ${scheme}://.`, () => `e.g. ${input.scheme}://.`);
  }
  return out;
}

/**
 * Deletes every block between `@<tag> remove-block-start` and `-end` lines
 * (Markdown or YAML comments).
 */
function stripBlocks(text, file, tag) {
  const out = [];
  let inBlock = false;
  for (const line of text.split('\n')) {
    if (line.includes(`@${tag} remove-block-start`)) {
      if (inBlock) throw new Error(`${file}: nested @${tag} block`);
      inBlock = true;
    } else if (line.includes(`@${tag} remove-block-end`)) {
      if (!inBlock) throw new Error(`${file}: @${tag} block end without start`);
      inBlock = false;
    } else if (!inBlock) {
      out.push(line);
    }
  }
  if (inBlock) throw new Error(`${file}: unterminated @${tag} block`);
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Keeps a block's content and drops only its `@<tag>` marker lines. */
function dropMarkerLines(text, tag) {
  return text
    .split('\n')
    .filter(line => !line.includes(`@${tag} remove-block-`))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/** Text shown as written in Markdown: `<Co>` and `*x*` stay literal. */
function markdownText(text) {
  return (
    text
      .replace(/[\\`*_{}[\]<>()#+!~&]/g, '\\$&')
      // At the start of a line, `1.` or `-` would make a list.
      .replace(/^(\d+)([.)])/, '$1\\$2')
      .replace(/^-/, '\\-')
  );
}

/** The project's README, replacing the template's. */
function appReadme(rawName) {
  const name = markdownText(rawName);
  const expo = JSON.parse(read('package.json')).dependencies?.expo ?? '';
  const sdk = /\d+/.exec(expo)?.[0];
  return `# ${name}

${name} is an Expo${sdk ? ` (SDK ${sdk})` : ''} and React Native app.

## Run it

\`\`\`bash
npm ci                 # Node 24 (.nvmrc); 24.3+ or 22.13+ also work
cp .env.example .env   # then set the backend URLs (docs/environment-variables.md)
npm start              # then press i, a, or w, or scan the QR code with Expo Go
\`\`\`

Scripts, platforms, and troubleshooting: [Getting Started](docs/getting-started.md).

## Documentation

- [Documentation index](docs/README.md)
- [Conventions](docs/conventions.md): structure, navigation, code style.
- [Connect Your Backend](docs/connect-your-backend.md): URLs, sign-in, endpoints.
- [Testing](docs/testing.md): unit, full-app, and end-to-end tests.

Coding agents: see [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
`;
}

/** The allowlist with the project as owner; the review itself is inherited. */
function allowlistFor(text, owner) {
  const list = JSON.parse(text);
  list.$comment =
    'High/critical npm audit advisories (npm audit --omit=dev) reviewed and accepted until reviewBy. Checked by scripts/check-audit.js (npm run audit:check). The first entries are the review of the dependencies the project started with; re-review each one by its reviewBy date; see docs/getting-started.md#dependency-advisories.';
  for (const entry of list.advisories ?? []) {
    entry.owner = `${owner} (re-review by reviewBy)`;
  }
  return `${JSON.stringify(list, null, 2)}\n`;
}

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
      () => `Copyright (c) ${new Date().getFullYear()} ${input.owner}`
    )
  );

  // Identity examples: the variant table, the dev scheme, the e2e workflow.
  // They show the current APP values, or the template's if the APP block was
  // edited by hand before a run with --force.
  const previous = [current, TEMPLATE_APP];
  const ids = Object.fromEntries(
    previous.flatMap(app => [
      [`${app.bundleId}.dev`, `${input.bundleId}.dev`],
      [`${app.bundleId}.preview`, `${input.bundleId}.preview`],
      [app.bundleId, input.bundleId],
      [`${app.scheme}-dev`, `${input.scheme}-dev`],
      [`${app.scheme}-preview`, `${input.scheme}-preview`],
    ])
  );
  const schemes = new Set(previous.map(app => app.scheme));
  // The bare scheme is a common word (e.g. `swipe`), so it is replaced only as
  // a URL (`scheme://`) or, with `bareScheme`, in App Config's variant table.
  const replaceIds = (text, { bareScheme = false } = {}) =>
    text.replace(
      /`([^`\s]+)`|(?<==)(\S+?)(?=:\/\/|"|$)/gm,
      (match, code, assigned) => {
        const value = code ?? assigned;
        const isUrl = value.endsWith('://') || assigned !== undefined;
        const base = value.replace(/:\/\/$/, '');
        const target = Object.hasOwn(ids, base)
          ? ids[base]
          : schemes.has(base) && (isUrl || bareScheme)
            ? input.scheme
            : undefined;
        if (target === undefined) return match;
        const replaced = target + value.slice(base.length);
        return code !== undefined ? `\`${replaced}\`` : replaced;
      }
    );
  // The name validator rejects | and \, so the name is safe in a table cell.
  const nameCells = text =>
    previous.reduce(
      (out, app) =>
        out
          .replace(`\`${app.name} (Dev)\``, () => `\`${input.name} (Dev)\``)
          .replace(
            `\`${app.name} (Preview)\``,
            () => `\`${input.name} (Preview)\``
          )
          .replace(`\`${app.name}\``, () => `\`${input.name}\``),
      text
    );

  if (exists('README.md')) {
    write('README.md', 'the README for the app', appReadme(input.name));
  }
  if (exists(ALLOWLIST)) {
    write(
      ALLOWLIST,
      `owner -> ${input.owner}`,
      allowlistFor(read(ALLOWLIST), input.owner)
    );
  }

  const identity = {
    'docs/app-config.md': text =>
      nameCells(replaceIds(text, { bareScheme: true })),
    'docs/testing.md': replaceIds,
    '.github/workflows/e2e-android.yml': replaceIds,
    '.github/workflows/e2e-ios.yml': replaceIds,
  };
  const files = new Set([
    ...MARKED_FILES,
    ...RECIPE_MARKED_FILES,
    ...Object.keys(identity),
  ]);
  for (const file of files) {
    if (!exists(file)) continue;
    const original = read(file);
    let text = original;
    const summary = [];
    if (identity[file]) {
      text = identity[file](text);
      summary.push('identity examples');
    }
    if (MARKED_FILES.includes(file) && text.includes('@init remove-block')) {
      text = stripBlocks(text, file, 'init');
      summary.push('remove @init blocks');
    }
    if (RECIPE_MARKED_FILES.includes(file) && text.includes('@recipes ')) {
      if (input.removeRecipes) {
        text = stripBlocks(text, file, 'recipes');
        summary.push('remove the recipe references');
      } else {
        text = dropMarkerLines(text, 'recipes');
        summary.push('keep the recipe references');
      }
    }
    write(file, summary.join(', '), text);
  }

  for (const file of TEMPLATE_DOCS) {
    if (exists(file))
      changes.push({ file, action: 'delete', summary: 'template onboarding' });
  }
  if (input.removeRecipes && exists(RECIPES)) {
    changes.push({
      file: `${RECIPES}/`,
      action: 'delete',
      summary: 'state-management recipes (--keep-recipes keeps them)',
    });
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

/**
 * Runs remove-demo. Returns false when it changed nothing (exit code 2),
 * throws when it failed after changing files.
 */
function runRemoveDemo(dryRun, force) {
  const result = spawnSync(
    process.execPath,
    // Its own closing message would repeat or precede this script's.
    [
      path.join(ROOT, REMOVE_DEMO),
      '--no-summary',
      ...(dryRun ? ['--dry-run'] : []),
      ...(force ? ['--force'] : []),
    ],
    {
      cwd: ROOT,
      stdio: 'inherit',
    }
  );
  if (result.status === 0) return true;
  if (result.status === 2) return false;
  throw new Error('remove-demo failed');
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
  --remove-recipes      delete the state-management recipes (the default)
  --keep-recipes        keep them (docs/recipes/)
  --dry-run             list every change without making it
  --force               run on uncommitted changes or a second time
  --help                show this help`;

/**
 * Set once files may have changed, so a failure says how to undo it;
 * `status` is the working tree's state at the start: null without git,
 * '' when clean, else the uncommitted changes (--force), which a blanket
 * restore would discard.
 */
let started = false;
let status = '';

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
  status = gitStatus();
  if (status && !force && !dryRun) {
    throw new Error(
      `the working tree has uncommitted changes; commit or stash them, or pass --force:\n${status}`
    );
  }
  if (status === null) {
    log(
      'Note: this is not a git repository, so init-project cannot check for\n' +
        'uncommitted changes or tell you how to undo a failure. Keep a copy.'
    );
  }

  const input = await collectInput(args);
  const demoPresent = exists(REMOVE_DEMO);

  log(dryRun ? 'Dry run: nothing is changed.' : 'Initializing the project...');
  if (input.removeDemo) {
    log('  run remove-demo:');
    started = !dryRun;
    if (!runRemoveDemo(dryRun, force)) {
      started = false;
      throw new Error('remove-demo stopped (see above)');
    }
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
  await formatChanges(changes);
  if (dryRun) {
    log('Dry run complete.');
    return;
  }

  // Writes first, then deletions, this script last (it is last in the plan):
  // if a step fails, the script is still there to run again.
  started = true;
  for (const change of [
    ...changes.filter(change => change.action === 'write'),
    ...changes.filter(change => change.action === 'delete'),
  ]) {
    const full = path.join(ROOT, change.file);
    if (change.action === 'delete')
      fs.rmSync(full, { recursive: true, force: true });
    else fs.writeFileSync(full, change.content);
  }
  const testsDir = path.join(ROOT, '__tests__/scripts');
  if (fs.existsSync(testsDir) && fs.readdirSync(testsDir).length === 0)
    fs.rmdirSync(testsDir);

  const steps = [
    ...(input.removeDemo
      ? [
          'Register your AuthAdapter in shared/integrations/setup.ts and set your\n     backend URLs in .env (docs/connect-your-backend.md).',
        ]
      : []),
    'Review the advisories in scripts/audit-allowlist.json and make them yours\n     (docs/getting-started.md#dependency-advisories).',
    'Replace the images in assets/ and the palette in shared/ui/theme.ts\n     (docs/app-config.md, docs/ui-and-theming.md).',
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
    if (!started) {
      process.stderr.write('Nothing was changed.\n');
    } else if (status === null) {
      process.stderr.write(
        'Some files may already be changed. This is not a git repository, so\n' +
          'restore them from your own copy, then fix the problem above and run\n' +
          'init-project again.\n'
      );
    } else if (status) {
      process.stderr.write(
        'Some files may already be changed. Your uncommitted changes are mixed\n' +
          'in, so review `git status` and `git diff` and restore what init-project\n' +
          'changed by hand, then fix the problem above and run it again.\n'
      );
    } else {
      process.stderr.write(
        'Some files may already be changed. Restore your last commit with\n' +
          // -C: npm runs scripts from the root, the shell may be elsewhere.
          `  git -C ${JSON.stringify(ROOT)} checkout -- . && git -C ${JSON.stringify(ROOT)} clean -fd\n` +
          'then fix the problem above and run init-project again.\n'
      );
    }
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  validators,
  slugify,
  tsString,
  markdownText,
  appReadme,
};
