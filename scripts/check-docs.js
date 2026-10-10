#!/usr/bin/env node
/**
 * Checks the docs against the code (npm run docs:check):
 *
 * 1. every ```ts / ```tsx block compiles: each block becomes a module in
 *    .docs-check/ and `tsc` type-checks them all against the repo (imports
 *    such as '@/shared/...' resolve to the real code). Blocks declare their
 *    own placeholders, e.g. `declare function loadRefreshToken(): ...`;
 *    A block preceded by `<!-- docs-check: requires pkg-a pkg-b -->` needs
 *    packages the starter doesn't install (recipes); it is compiled when they
 *    are present (CI installs them) and skipped, with a note, otherwise;
 * 2. every ```json block parses;
 * 3. every `npm run <script>` names a script in package.json;
 * 4. every relative Markdown link points to an existing file (and heading,
 *    for #anchors), and every repo path in inline code exists. Paths with
 *    placeholders (<name>, *, {a,b}, ...) are not checked.
 *
 * 5. every `docs/<page>.md#anchor` mentioned in source files (comments in
 *    app/, features/, shared/, scripts/, testing/, app.config.ts) exists.
 *
 * Once the maintainer files (scripts/maintainer-files.json) are deleted,
 * references to them are skipped. The demo gets no such pass: removing it
 * removes its docs too, so a doc that still names it is reported.
 *
 * Usage: npm run docs:check [-- --keep]   (--keep leaves .docs-check/)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.docs-check');
const KEEP = process.argv.includes('--keep');

const PATH_ROOTS = [
  'app/',
  'features/',
  'shared/',
  'scripts/',
  'docs/',
  '__tests__/',
  'testing/',
  'assets/',
  '.github/',
];
const ROOT_FILES = new Set([
  'app.config.ts',
  'eas.json',
  'package.json',
  'tsconfig.json',
  'eslint.config.js',
  'jest.setup.ts',
  'jest.setup.env.js',
  '.env.example',
  '.nvmrc',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'index.ts',
]);

function docFiles() {
  const walk = dir =>
    fs
      .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap(entry => {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) return walk(rel);
        return entry.name.endsWith('.md') ? [rel] : [];
      });
  const docs = walk('docs');
  const folderReadmes = ['app/README.md', 'scripts/README.md'].filter(file =>
    fs.existsSync(path.join(ROOT, file))
  );
  return ['README.md', 'AGENTS.md', 'CLAUDE.md', ...docs, ...folderReadmes];
}

/** GitHub-style heading anchors for a Markdown file. */
function anchorsOf(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const anchors = new Set();
  const counts = {};
  let inFence = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    const match = !inFence && /^#{1,6}\s+(.*)$/.exec(line);
    if (!match) continue;
    const base = match[1]
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const n = counts[base] ?? 0;
    counts[base] = n + 1;
    anchors.add(n === 0 ? base : `${base}-${n}`);
  }
  return anchors;
}

const MAINTAINER_REMOVED = !fs.existsSync(path.join(ROOT, 'docs/maintainers'));
const MAINTAINER_REF =
  /docs\/maintainers\/|scripts\/maintainers\/|scripts\/maintainer-files\.json/;
const skipRemoved = value => MAINTAINER_REMOVED && MAINTAINER_REF.test(value);

function isPlaceholder(value) {
  return /[<>*{}|…]|\.\.\./.test(value);
}

function main() {
  const scripts = Object.keys(
    JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts
  );
  const problems = [];
  const snippets = [];
  const skipped = new Map();
  const isInstalled = pkg => {
    try {
      require.resolve(`${pkg}/package.json`, { paths: [ROOT] });
      return true;
    } catch {
      return false;
    }
  };
  const anchorCache = {};
  const report = (file, line, message) =>
    problems.push(`${file}:${line}: ${message}`);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT);

  for (const file of docFiles()) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    let fence = null;
    let requires = [];
    lines.forEach((line, index) => {
      const lineNo = index + 1;
      const fenceMatch = /^```(\w*)/.exec(line);
      if (fenceMatch) {
        if (fence) {
          const body = fence.body.join('\n');
          const missing = fence.requires.filter(pkg => !isInstalled(pkg));
          if (missing.length > 0) {
            skipped.set(`${file}:${fence.line}`, missing);
          } else if (fence.lang === 'ts' || fence.lang === 'tsx') {
            const name = `${file.replace(/[/.]/g, '_')}_L${fence.line}.${fence.lang}`;
            fs.writeFileSync(path.join(OUT, name), `${body}\nexport {};\n`);
            snippets.push({ name, file, line: fence.line });
          } else if (fence.lang === 'json') {
            try {
              JSON.parse(body);
            } catch (error) {
              report(
                file,
                fence.line,
                `JSON block does not parse: ${error.message}`
              );
            }
          }
          fence = null;
        } else {
          fence = { lang: fenceMatch[1], line: lineNo, body: [], requires };
          requires = [];
        }
        return;
      }
      const requiresMatch = /<!-- docs-check: requires (.+?) -->/.exec(line);
      if (requiresMatch && !fence) {
        requires = requiresMatch[1].split(/\s+/);
        return;
      }
      if (fence) fence.body.push(line);

      for (const m of line.matchAll(/npm run ([\w:-]+)/g)) {
        if (!scripts.includes(m[1])) {
          report(file, lineNo, `npm run ${m[1]}: no such script`);
        }
      }
      if (fence) return;

      for (const m of line.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = m[1];
        if (/^(https?:|mailto:|#)/.test(target)) {
          if (target.startsWith('#')) {
            anchorCache[file] ??= anchorsOf(file);
            if (!anchorCache[file].has(target.slice(1))) {
              report(file, lineNo, `no heading for ${target}`);
            }
          }
          continue;
        }
        const [rel, anchor] = target.split('#');
        const resolved = path.normalize(path.join(path.dirname(file), rel));
        if (!fs.existsSync(path.join(ROOT, resolved))) {
          if (skipRemoved(resolved)) continue;
          report(file, lineNo, `broken link ${target}`);
        } else if (anchor && resolved.endsWith('.md')) {
          anchorCache[resolved] ??= anchorsOf(resolved);
          if (!anchorCache[resolved].has(anchor)) {
            report(file, lineNo, `no heading for ${target}`);
          }
        }
      }

      for (const m of line.matchAll(/`([^`\s]+)`/g)) {
        const value = m[1].replace(/[#:].*$/, '').replace(/[),.]+$/, '');
        const isRepoPath =
          PATH_ROOTS.some(root => value.startsWith(root)) ||
          ROOT_FILES.has(value);
        if (!isRepoPath || isPlaceholder(m[1])) continue;
        if (!fs.existsSync(path.join(ROOT, value))) {
          if (skipRemoved(value)) continue;
          report(file, lineNo, `path does not exist: ${value}`);
        }
      }
    });
  }

  const sourceFiles = dir => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return [];
    if (fs.statSync(full).isFile()) return [dir];
    return fs
      .readdirSync(full, { withFileTypes: true })
      .flatMap(entry => sourceFiles(path.join(dir, entry.name)))
      .filter(file => /\.(ts|tsx|js)$/.test(file));
  };
  for (const file of [
    'app',
    'features',
    'shared',
    'scripts',
    'testing',
    'app.config.ts',
  ].flatMap(sourceFiles)) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    lines.forEach((line, index) => {
      for (const m of line.matchAll(/docs\/([\w-]+\.md)(#[\w-]+)?/g)) {
        const doc = `docs/${m[1]}`;
        if (!fs.existsSync(path.join(ROOT, doc))) {
          report(file, index + 1, `refers to missing ${doc}`);
        } else if (m[2]) {
          anchorCache[doc] ??= anchorsOf(doc);
          if (!anchorCache[doc].has(m[2].slice(1))) {
            report(file, index + 1, `no heading for ${doc}${m[2]}`);
          }
        }
      }
    });
  }

  fs.writeFileSync(
    path.join(OUT, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../tsconfig.json',
        compilerOptions: { noEmit: true },
        include: ['./*.ts', './*.tsx', '../expo-env.d.ts'],
      },
      null,
      2
    )
  );
  const tsc = spawnSync(
    'npx',
    ['tsc', '-p', path.join(OUT, 'tsconfig.json'), '--pretty', 'false'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  for (const raw of `${tsc.stdout}${tsc.stderr}`.split('\n')) {
    const m = /\.docs-check\/([^(]+)\((\d+),\d+\): (.*)$/.exec(raw);
    if (!m) {
      if (raw.trim()) problems.push(`tsc: ${raw.trim()}`);
      continue;
    }
    const snippet = snippets.find(s => s.name === m[1]);
    const where = snippet
      ? `${snippet.file}:${snippet.line + Number(m[2])}`
      : m[1];
    problems.push(`${where}: ${m[3]}`);
  }

  if (!KEEP) fs.rmSync(OUT, { recursive: true, force: true });

  const log = message => process.stdout.write(`${message}\n`);
  log(
    `Checked ${docFiles().length} files: ${snippets.length} TypeScript snippets compiled with tsc.`
  );
  for (const [where, missing] of skipped) {
    log(`Skipped ${where}: needs ${missing.join(', ')} (not installed).`);
  }
  if (problems.length > 0) {
    process.stderr.write(`${problems.join('\n')}\n`);
    process.stderr.write(`${problems.length} problem(s).\n`);
    process.exit(1);
  }
  log('No problems.');
}

main();
