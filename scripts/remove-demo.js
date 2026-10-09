#!/usr/bin/env node
/**
 * Removes the starter's demo code (see docs/remove-demo.md):
 *
 * 1. deletes the demo folders and routes listed in DEMO_PATHS;
 * 2. strips marked code from the remaining source files:
 *    - a line containing `@demo remove-current-line`;
 *    - every line from one containing `@demo remove-block-start` through
 *      the next line containing `@demo remove-block-end`;
 * 3. formats the changed files with Prettier (stripping leaves blank lines);
 * 4. fails if any `@demo` marker or import of a removed path is left.
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
];

const SOURCE_DIRS = ['app', 'features', 'shared', '__tests__'];
const SOURCE_EXT = /\.(ts|tsx|js|jsx)$/;

function sourceFiles(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap(entry => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(rel);
    return SOURCE_EXT.test(entry.name) ? [rel] : [];
  });
}

/** Returns the file's text without its marked demo lines. */
function stripMarkers(text, file) {
  const out = [];
  let inBlock = false;
  for (const line of text.split('\n')) {
    if (line.includes('@demo remove-block-start')) {
      if (inBlock) throw new Error(`${file}: nested @demo block`);
      inBlock = true;
    } else if (line.includes('@demo remove-block-end')) {
      if (!inBlock) throw new Error(`${file}: @demo block end without start`);
      inBlock = false;
    } else if (!inBlock && !line.includes('@demo remove-current-line')) {
      out.push(line);
    }
  }
  if (inBlock) throw new Error(`${file}: unterminated @demo block`);
  return out.join('\n');
}

function main() {
  const log = message => process.stdout.write(`${message}\n`);
  log(DRY_RUN ? 'Dry run: nothing is changed.' : 'Removing the demo...');

  for (const rel of DEMO_PATHS) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    log(`  delete ${rel}`);
    if (!DRY_RUN) fs.rmSync(full, { recursive: true });
  }

  const problems = [];
  const changed = [];
  for (const rel of SOURCE_DIRS.flatMap(sourceFiles)) {
    if (DRY_RUN && DEMO_PATHS.some(demo => rel.startsWith(demo))) continue;
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
  }

  if (!DRY_RUN && changed.length > 0) {
    const prettier = spawnSync('npx', ['prettier', '--write', ...changed], {
      cwd: ROOT,
      stdio: 'inherit',
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
      : 'Done. Next: register your AuthAdapter in shared/integrations/setup.ts, then run npm run lint, npm run type-check, and npm run test:ci.'
  );
}

main();
