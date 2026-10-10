#!/usr/bin/env node
/**
 * Removes the starter's demo code (see docs/remove-demo.md):
 *
 * 1. deletes the demo folders, routes, and Maestro flows listed in
 *    DEMO_PATHS, and then this script, its doc, its test, and its npm script;
 * 2. edits the remaining source, docs, and config files (MARKED_DIRS and
 *    MARKED_FILES):
 *    - deletes a line containing `@demo remove-current-line`;
 *    - deletes every line from one containing `@demo remove-block-start`
 *      through the next line containing `@demo remove-block-end`;
 *    - between `@demo uncomment-block-start` and `@demo uncomment-block-end`
 *      lines, uncomments each line (drops its leading `# `) and deletes the
 *      two marker lines: for text that only applies once the demo is gone
 *      (.env.example, the e2e runner);
 * 3. formats the changed files with Prettier (stripping leaves blank lines);
 * 4. fails if any `@demo` marker, import of a removed path, or mention of a
 *    deleted file is left.
 *
 * Usage: npm run remove-demo [-- --dry-run]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const DEMO_PATHS = [
  'features/demo-auth',
  'features/demo-todos',
  'features/demo-showcase',
  'app/(tabs)/explore.tsx',
  'app/showcase.tsx',
  '__tests__/features/demo-auth',
  '__tests__/features/demo-todos',
  '__tests__/features/demo-showcase',
  // Flows that need the demo: the Explore tab, or the DummyJSON sign-in.
  '.maestro/02-tabs.yaml',
  '.maestro/03-auth-session.yaml',
  '.maestro/04-login-keyboard.yaml',
  '.maestro/05-explore-error-retry.yaml',
  '.maestro/subflows/sign-in.yaml',
  // This command: with the demo gone, it has nothing left to remove.
  'docs/remove-demo.md',
  '__tests__/scripts/removeDemo.test.ts',
  'scripts/remove-demo.js',
];

const MARKED_DIRS = [
  'app',
  'features',
  'shared',
  '__tests__',
  'docs',
  '.maestro',
  'scripts',
];
const MARKED_FILES = ['README.md', 'AGENTS.md', '.env.example'];
const MARKED_EXT = /\.(ts|tsx|js|jsx|md|ya?ml|sh)$/;
const PRETTIER_EXT = /\.(ts|tsx|js|jsx|json|md)$/;
/** Text that names files, so it must not name a deleted one. */
const DOC_EXT = /(\.(md|ya?ml|sh)|^\.env\.example)$/;

function markedFiles(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap(entry => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return markedFiles(rel);
    return MARKED_EXT.test(entry.name) ? [rel] : [];
  });
}

/** Returns the file's text without its marked demo lines. */
function stripMarkers(text, file) {
  const out = [];
  let block = null;
  for (const line of text.split('\n')) {
    const start = /@demo (remove|uncomment)-block-start/.exec(line);
    const end = /@demo (remove|uncomment)-block-end/.exec(line);
    if (start) {
      if (block) throw new Error(`${file}: nested @demo block`);
      block = start[1];
    } else if (end) {
      if (block !== end[1])
        throw new Error(`${file}: @demo ${end[1]}-block end without start`);
      block = null;
    } else if (block === 'uncomment') {
      out.push(line.replace(/^(\s*)# ?/, '$1'));
    } else if (!block && !line.includes('@demo remove-current-line')) {
      out.push(line);
    }
  }
  if (block) throw new Error(`${file}: unterminated @demo block`);
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function main() {
  const log = message => process.stdout.write(`${message}\n`);
  log(DRY_RUN ? 'Dry run: nothing is changed.' : 'Removing the demo...');

  const isDeleted = rel =>
    DEMO_PATHS.some(demo => rel === demo || rel.startsWith(`${demo}/`));
  for (const rel of DEMO_PATHS) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    log(`  delete ${rel}`);
    if (!DRY_RUN) fs.rmSync(full, { recursive: true });
  }
  const testsDir = path.join(ROOT, '__tests__/scripts');
  if (
    !DRY_RUN &&
    fs.existsSync(testsDir) &&
    fs.readdirSync(testsDir).length === 0
  )
    fs.rmdirSync(testsDir);

  const problems = [];
  const changed = [];
  const files = [
    ...MARKED_DIRS.flatMap(markedFiles),
    ...MARKED_FILES.filter(file => fs.existsSync(path.join(ROOT, file))),
  ].filter(rel => !isDeleted(rel));
  for (const rel of files) {
    const full = path.join(ROOT, rel);
    const text = fs.readFileSync(full, 'utf8');
    const stripped = stripMarkers(text, rel);
    if (stripped !== text) {
      log(`  strip ${rel}`);
      changed.push(rel);
      if (!DRY_RUN) fs.writeFileSync(full, stripped);
    }
    if (stripped.includes('@demo')) {
      problems.push(`${rel}: unhandled @demo marker`);
    }
    if (/from ['"]@\/features\/demo-/.test(stripped)) {
      problems.push(`${rel}: still imports a demo feature`);
    }
    if (DOC_EXT.test(rel)) {
      for (const demo of DEMO_PATHS) {
        if (stripped.includes(path.basename(demo)))
          problems.push(`${rel}: still mentions ${demo}`);
      }
    }
  }

  const pkgFile = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  if (pkg.scripts?.['remove-demo']) {
    log('  update package.json: remove the remove-demo script');
    delete pkg.scripts['remove-demo'];
    if (!DRY_RUN)
      fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  const formattable = changed.filter(rel => PRETTIER_EXT.test(rel));
  if (!DRY_RUN && formattable.length > 0) {
    const prettier = spawnSync('npx', ['prettier', '--write', ...formattable], {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    if (prettier.status !== 0) problems.push('prettier failed');
  }

  if (problems.length > 0) {
    process.stderr.write(`${problems.join('\n')}\n`);
    process.exit(1);
  }
  log(
    DRY_RUN
      ? 'Dry run complete.'
      : 'Done. Next: register your AuthAdapter in shared/integrations/setup.ts, set your backend URLs in .env, then run npm run lint, npm run type-check, and npm run test:ci.'
  );
}

main();
