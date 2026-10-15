#!/usr/bin/env node
/**
 * Checks the docs against the code (npm run docs:check):
 *
 * 1. every ```ts / ```tsx / ```typescript block (or ~~~ fence) compiles,
 *    indented ones too (as in a list): each block becomes a module in
 *    .docs-check/ and `tsc` type-checks them all against the repo (imports
 *    such as '@/shared/...' resolve to the real code). Blocks declare their
 *    own placeholders, e.g. `declare function loadRefreshToken(): ...`;
 *    A block preceded by `<!-- docs-check: requires pkg-a pkg-b -->` needs
 *    packages the project doesn't install (a library a page shows how to
 *    adopt); it is compiled when they are present (CI can install them) and
 *    skipped, with a note, otherwise;
 *    each block also passes ESLint with the project's config, as the file
 *    its first line names (`// features/x/y.ts`), or else as a test (if it
 *    reads like one), a route, or a module in a feature (lintSnippets);
 * 2. every ```json block parses; blocks in other languages (sh, js, yaml)
 *    are not checked, and a fence left open is reported;
 * 3. every `npm run <script>` (or `npm run-script`) names a script in
 *    package.json;
 * 4. every relative link points to an existing file (and heading, for
 *    #anchors): inline links (with a title or in <angle brackets> too),
 *    reference definitions (`[ref]: path`), and HTML `href`/`src`; every repo
 *    path in inline code exists (a path in a known folder or a known root
 *    file, `./` allowed), with its heading for a `.md#anchor`. Anchors are
 *    compared as GitHub writes them (lowercase). Paths with placeholders
 *    (<name>, *, {a,b}, ...) are not checked.
 *
 * 5. every `docs/<page>.md#anchor` (or `docs/<folder>/<page>.md`) mentioned
 *    in a source or config file (.ts, .tsx, .js, .sh, .yml, .yaml, .json
 *    except package-lock.json, and .env.example, in the project root, app/,
 *    features/, shared/, scripts/,
 *    testing/, .github/, and .maestro/) exists. (Tests that read a doc fail
 *    by themselves when it is missing.)
 *
 * @demo remove-block-start
 * Removing the demo removes its docs too, so a doc that still names it is
 * reported.
 * @demo remove-block-end
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
  '.maestro/',
  'public/',
];
const ROOT_FILES = new Set([
  'app.config.ts',
  'eas.json',
  'package.json',
  'tsconfig.json',
  'tsconfig.tools.json',
  'eslint.config.js',
  'jest.setup.ts',
  'jest.setup.env.js',
  '.env.example',
  '.nvmrc',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'index.ts',
  'metro.config.js',
  'babel.config.js',
  'jest.config.js',
  'app.json',
  'LICENSE',
]);

function docFiles() {
  const walk = dir =>
    fs
      .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap(entry => {
        const rel = `${dir}/${entry.name}`;
        // Installed libraries (e.g. under docs/) are not the docs.
        if (entry.isDirectory())
          return entry.name === 'node_modules' ? [] : walk(rel);
        return entry.name.endsWith('.md') ? [rel] : [];
      });
  const docs = walk('docs');
  // A README.md in any source folder (app/README.md, features/x/README.md).
  const readmes = dir => {
    if (!fs.existsSync(path.join(ROOT, dir))) return [];
    return fs
      .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap(entry => {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory())
          return entry.name === 'node_modules' ? [] : readmes(rel);
        return entry.name === 'README.md' ? [rel] : [];
      });
  };
  const folderReadmes = [
    'app',
    'features',
    'shared',
    'scripts',
    'testing',
    '.maestro',
    '.github',
  ].flatMap(readmes);
  return ['README.md', 'AGENTS.md', 'CLAUDE.md', ...docs, ...folderReadmes];
}

/** GitHub-style heading anchors for a Markdown file. */
function anchorsOf(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const anchors = new Set();
  const counts = {};
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const marker = fenceMarker(line);
    if (marker && !fence) {
      fence = marker;
      continue;
    }
    if (marker && closes(fence, marker)) {
      fence = null;
      continue;
    }
    const match = !fence && /^#{1,6}\s+(.*)$/.exec(line);
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

/** A code fence line (``` or ~~~, three or more), or null. */
function fenceMarker(line) {
  const match = /^(\s*)(`{3,}|~{3,})\s*([^\s`]*)/.exec(line);
  if (!match) return null;
  const lang = match[3].toLowerCase();
  return {
    indent: match[1].length,
    char: match[2][0],
    length: match[2].length,
    lang: lang === 'typescript' ? 'ts' : lang,
    bare: line.trim() === match[2],
  };
}

/** Whether `marker` closes `fence`: same character, at least as long, bare. */
function closes(fence, marker) {
  return (
    marker.bare && marker.char === fence.char && marker.length >= fence.length
  );
}

/** A link target without <angle brackets> and %-escapes. */
function decodeTarget(raw) {
  const target = raw.replace(/^<(.*)>$/, '$1');
  try {
    return decodeURI(target);
  } catch {
    return target;
  }
}

function isPlaceholder(value) {
  return /[<>*{}|…]|\.\.\./.test(value);
}

/**
 * Lints each snippet with the project's ESLint config, as the file its first
 * line names (`// features/posts/api/postsApi.ts`), or else as a file in a
 * feature, so a copied snippet passes `npm run lint` too. Type-aware rules
 * are off (the file doesn't exist), and so is formatting.
 */
function lintSnippets(snippets) {
  const files = snippets.map(snippet => {
    const named =
      /^\/\/ ((?:[\w.()[\]-]+\/)*[\w.()[\]-]+\.(?:tsx?|jsx?))\b/.exec(
        snippet.body
      );
    // Unnamed: a test if it reads like one, a route if it is one line
    // re-exporting a screen, else a module in a feature.
    const folder = /\b(describe|it|test|expect)\(|\bjest\b/.test(snippet.body)
      ? '__tests__/example'
      : /^export \{ \w+ as default \}/m.test(snippet.body)
        ? 'app/example'
        : 'features/example';
    return [
      path.join(ROOT, named ? named[1] : `${folder}/${snippet.name}`),
      snippet.body,
    ];
  });
  const script = `
    const { ESLint } = require('eslint');
    const files = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const eslint = new ESLint({
      overrideConfig: [{
        files: ['**/*.{ts,tsx}'],
        languageOptions: { parserOptions: { project: null } },
        rules: {
          '@typescript-eslint/no-floating-promises': 'off',
          '@typescript-eslint/no-misused-promises': 'off',
          'prettier/prettier': 'off',
        },
      }],
    });
    (async () => {
      const out = [];
      for (const [filePath, code] of files) {
        const [result] = await eslint.lintText(code, { filePath });
        out.push(result ? result.messages : []);
      }
      process.stdout.write(JSON.stringify(out));
    })();`;
  const run = spawnSync(process.execPath, ['-e', script], {
    cwd: ROOT,
    input: JSON.stringify(files),
    encoding: 'utf8',
  });
  if (run.status !== 0) return [`eslint did not run: ${run.stderr}`];
  return JSON.parse(run.stdout).flatMap((messages, i) =>
    messages.map(
      m =>
        `${snippets[i].file}:${snippets[i].line + m.line}: ${m.message}${m.ruleId ? ` (${m.ruleId})` : ''}`
    )
  );
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
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
    let fence = null;
    let requires = [];
    lines.forEach((line, index) => {
      const lineNo = index + 1;
      // Fences may be indented (inside a list item); inside a fence, only a
      // matching closer ends it (a ``` line in a ```` block is content).
      const marker = fenceMarker(line);
      if (marker && (!fence || closes(fence, marker))) {
        if (fence) {
          const body = fence.body.join('\n');
          const missing = fence.requires.filter(pkg => !isInstalled(pkg));
          if (missing.length > 0) {
            skipped.set(`${file}:${fence.line}`, missing);
          } else if (fence.lang === 'ts' || fence.lang === 'tsx') {
            const name = `${file.replace(/[/.]/g, '_')}_L${fence.line}.${fence.lang}`;
            fs.writeFileSync(path.join(OUT, name), `${body}\nexport {};\n`);
            snippets.push({
              name,
              file,
              line: fence.line,
              body,
              lang: fence.lang,
            });
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
          fence = {
            lang: marker.lang,
            char: marker.char,
            length: marker.length,
            indent: marker.indent,
            line: lineNo,
            body: [],
            requires,
          };
          requires = [];
        }
        return;
      }
      const requiresMatch = /<!-- docs-check: requires (.+?) -->/.exec(line);
      if (requiresMatch && !fence) {
        requires = requiresMatch[1].split(/\s+/);
        return;
      }
      if (fence) fence.body.push(line.slice(fence.indent));

      for (const m of line.matchAll(/npm (?:run|run-script) ([\w:-]+)/g)) {
        if (!scripts.includes(m[1])) {
          report(file, lineNo, `npm run ${m[1]}: no such script`);
        }
      }
      if (fence) return;

      const hasHeading = (doc, anchor) => {
        anchorCache[doc] ??= anchorsOf(doc);
        return anchorCache[doc].has(anchor);
      };
      const targets = [
        // [text](target) and [text](target "title"), images too.
        ...Array.from(
          line.matchAll(
            /\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g
          ),
          m => m[1]
        ),
        // [ref]: target
        ...Array.from(
          line.matchAll(/^\s{0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/g),
          m => m[1]
        ),
        // <a href="target">, <img src="target">
        ...Array.from(
          line.matchAll(/<(?:a|img)\b[^>]*?\s(?:href|src)=["']([^"']+)["']/gi),
          m => m[1]
        ),
      ];
      for (const raw of targets) {
        const target = decodeTarget(raw);
        if (/^[a-z][\w+.-]*:/i.test(target)) continue; // https:, mailto:, ...
        if (target.startsWith('#')) {
          if (!hasHeading(file, target.slice(1))) {
            report(file, lineNo, `no heading for ${target}`);
          }
          continue;
        }
        const [rel, anchor] = target.split('#');
        const resolved = path.normalize(path.join(path.dirname(file), rel));
        if (!fs.existsSync(path.join(ROOT, resolved))) {
          report(file, lineNo, `broken link ${target}`);
        } else if (anchor && resolved.endsWith('.md')) {
          if (!hasHeading(resolved, anchor)) {
            report(file, lineNo, `no heading for ${target}`);
          }
        }
      }

      for (const m of line.matchAll(/`([^`\s]+)`/g)) {
        const code = m[1].replace(/^\.\//, '');
        const anchor = /\.md#([\w-]+)/.exec(code)?.[1];
        const value = code.replace(/[#:].*$/, '').replace(/[),.]+$/, '');
        const isRepoPath =
          PATH_ROOTS.some(root => value.startsWith(root)) ||
          ROOT_FILES.has(value);
        if (!isRepoPath || isPlaceholder(m[1])) continue;
        if (!fs.existsSync(path.join(ROOT, value))) {
          report(file, lineNo, `path does not exist: ${value}`);
        } else if (anchor && !hasHeading(value, anchor)) {
          report(file, lineNo, `no heading for ${value}#${anchor}`);
        }
      }
    });
    if (fence) {
      report(file, fence.line, 'code block is never closed');
    }
  }

  const isSource = name =>
    /\.(ts|tsx|js|sh|ya?ml)$/.test(name) ||
    (name.endsWith('.json') && name !== 'package-lock.json') ||
    name === '.env.example';
  const sourceFiles = dir => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return [];
    return fs
      .readdirSync(full, { withFileTypes: true })
      .flatMap(entry =>
        entry.isDirectory()
          ? sourceFiles(path.join(dir, entry.name))
          : entry.isFile() && isSource(entry.name)
            ? [path.join(dir, entry.name)]
            : []
      );
  };
  const rootFiles = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isFile() && isSource(entry.name))
    .map(entry => entry.name);
  for (const file of [
    ...rootFiles,
    ...[
      'app',
      'features',
      'shared',
      'scripts',
      'testing',
      '.github',
      '.maestro',
    ].flatMap(sourceFiles),
  ]) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const m of line.matchAll(/docs\/([\w/-]+\.md)(#[\w-]+)?/g)) {
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
        // Snippets include tests, which need the Jest and Node types.
        extends: '../tsconfig.tools.json',
        compilerOptions: { noEmit: true },
        include: ['./*.ts', './*.tsx', '../expo-env.d.ts'],
        // The project's exclude list names this folder.
        exclude: [],
      },
      null,
      2
    )
  );
  // The project's tsc with this Node: `npx` needs a shell on Windows.
  const tsc = spawnSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      '-p',
      path.join(OUT, 'tsconfig.json'),
      '--pretty',
      'false',
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  if (tsc.error) {
    problems.push(`tsc did not run: ${tsc.error.message}`);
  }
  for (const raw of `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`.split(/\r?\n/)) {
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

  problems.push(...lintSnippets(snippets));

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
