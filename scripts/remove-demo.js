#!/usr/bin/env node
/**
 * Removes the demo code (see docs/remove-demo.md):
 *
 * 1. works out every change below and checks the result (step 4) before it
 *    changes anything, so a problem leaves the project as it was;
 * 2. edits every source, doc, and config file in the project (any .ts, .tsx,
 *    .js, .jsx, .md, .yml, .yaml, .sh, or .html file, and .env.example,
 *    outside node_modules and generated folders):
 *    - deletes a line containing `@demo remove-current-line`;
 *    - deletes every line from one containing `@demo remove-block-start`
 *      through the next line containing `@demo remove-block-end`;
 *    - between `@demo uncomment-block-start` and `@demo uncomment-block-end`
 *      lines, uncomments each line (drops its leading `# ` or `// `) and
 *      deletes the two marker lines: for text that only applies once the
 *      demo is gone (.env.example, the e2e runner, the config's URL check);
 * 3. formats the changed files with Prettier (stripping leaves blank lines),
 *    then deletes the demo folders, routes, and Maestro flows listed in
 *    DEMO_PATHS, this command's doc, test, and npm script, and this script
 *    last, so it is still there if a step fails;
 * 4. fails, before step 2, if a marker is malformed or any `@demo` marker,
 *    import of a removed path, or mention of a deleted file would be left.

 * Usage: npm run remove-demo [-- --dry-run]
 * (--no-summary skips the closing message, for a caller that prints its own.)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const SUMMARY = !process.argv.includes('--no-summary');

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
  '.maestro/07-profile.yaml',
  '.maestro/subflows/sign-in.yaml',
  // This command: with the demo gone, it has nothing left to remove.
  'docs/remove-demo.md',
  '__tests__/scripts/removeDemo.test.ts',
  'scripts/remove-demo.js',
];

/** Folders that hold no project source: installed, generated, or output. */
const SKIPPED_DIRS = new Set([
  'node_modules',
  '.git',
  '.expo',
  'android',
  'ios',
  'dist',
  'web-build',
  'coverage',
  'e2e-results',
  '.docs-check',
]);
const MARKED_EXT = /\.(ts|tsx|js|jsx|md|ya?ml|sh|html)$|^\.env\.example$/;
const PRETTIER_EXT = /\.(ts|tsx|js|jsx|json|md)$/;
/** Text that names files, so it must not name a deleted one. */
const DOC_EXT = /(\.(md|ya?ml|sh)|^\.env\.example)$/;

/**
 * Every file in the project that can hold markers, as paths relative to the
 * root with forward slashes (on Windows too, to compare with DEMO_PATHS).
 */
function markedFiles(dir = '') {
  return fs
    .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .flatMap(entry => {
      const rel = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        return SKIPPED_DIRS.has(entry.name) ? [] : markedFiles(rel);
      }
      return MARKED_EXT.test(entry.name) ? [rel] : [];
    });
}

/**
 * Runs the project's Prettier with this Node (not `npx`, which needs a shell
 * on Windows). Returns an error message, or null.
 */
function runPrettier(files) {
  const result = spawnSync(
    process.execPath,
    [require.resolve('prettier/bin/prettier.cjs'), '--write', ...files],
    { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] }
  );
  if (result.error) return `prettier did not run: ${result.error.message}`;
  return result.status === 0 ? null : 'prettier failed';
}

/** Returns the file's text without its marked demo lines. */
function stripMarkers(text, file) {
  const out = [];
  let block = null;
  for (const line of text.split(/\r?\n/)) {
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
      out.push(line.replace(/^(\s*)(?:#|\/\/) ?/, '$1'));
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

  // First work out every change and check the result, without touching a
  // file, so a problem (such as a malformed marker) leaves the project as
  // it was and this script still there to run again.
  const isDeleted = rel =>
    DEMO_PATHS.some(demo => rel === demo || rel.startsWith(`${demo}/`));
  const deletions = DEMO_PATHS.filter(rel =>
    fs.existsSync(path.join(ROOT, rel))
  );

  const problems = [];
  const edits = [];
  const files = markedFiles().filter(rel => !isDeleted(rel));
  for (const rel of files) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    let stripped;
    try {
      stripped = stripMarkers(text, rel);
    } catch (error) {
      problems.push(error.message);
      continue;
    }
    if (stripped !== text) edits.push({ rel, text: stripped });
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

  if (problems.length > 0) {
    process.stderr.write(
      `${problems.join('\n')}\nNothing was changed. Fix the above, then run it again.\n`
    );
    process.exit(1);
  }

  // Write the edits first, then delete, this script last: if anything
  // fails part way, the script is still there to restore and run again.
  started = !DRY_RUN;
  for (const { rel, text } of edits) {
    log(`  strip ${rel}`);
    if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, rel), text);
  }

  const pkgFile = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  if (pkg.scripts?.['remove-demo']) {
    log('  update package.json: remove the remove-demo script');
    delete pkg.scripts['remove-demo'];
    if (!DRY_RUN)
      fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  const formattable = edits
    .map(edit => edit.rel)
    .filter(rel => PRETTIER_EXT.test(rel));
  if (!DRY_RUN && formattable.length > 0) {
    const prettierError = runPrettier(formattable);
    if (prettierError) throw new Error(prettierError);
  }

  const self = path.relative(ROOT, __filename).split(path.sep).join('/');
  for (const rel of [
    ...deletions.filter(rel => rel !== self),
    ...deletions.filter(rel => rel === self),
  ]) {
    log(`  delete ${rel}`);
    if (!DRY_RUN) fs.rmSync(path.join(ROOT, rel), { recursive: true });
  }
  const testsDir = path.join(ROOT, '__tests__/scripts');
  if (
    !DRY_RUN &&
    fs.existsSync(testsDir) &&
    fs.readdirSync(testsDir).length === 0
  )
    fs.rmdirSync(testsDir);

  if (!SUMMARY) return;
  log(
    DRY_RUN
      ? 'Dry run complete.'
      : 'Done. Next: register your AuthAdapter in shared/integrations/setup.ts, set your backend URLs in .env, then run npm run lint, npm run type-check, and npm run test:ci.'
  );
}

/** Set once files may have changed, so a failure says how to undo it. */
let started = false;

try {
  main();
} catch (error) {
  process.stderr.write(`remove-demo: ${error.message}\n`);
  if (started) {
    process.stderr.write(
      'Some files may already be changed. Restore your last commit with\n' +
        `  git -C ${JSON.stringify(ROOT)} checkout -- . && git -C ${JSON.stringify(ROOT)} clean -fd\n` +
        'then fix the problem above and run npm run remove-demo again.\n'
    );
  }
  process.exit(1);
}
