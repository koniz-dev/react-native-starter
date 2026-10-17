/**
 * @jest-environment node
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { copyProject } from '@/testing/projectCopy';

/** A copy of the working tree, sharing this repo's node_modules. */
function makeCopy(): string {
  const dir = copyProject('check-docs-');
  return dir;
}

describe('check-docs on a copy of the project', () => {
  let dir: string;
  beforeAll(() => {
    dir = makeCopy();
  });
  afterAll(() => {
    // Unset if making the copy failed: report that, not a second error.
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('checks indented snippets, flow and public paths, and docs/ subfolder references', () => {
    const append = (file: string, text: string) =>
      fs.appendFileSync(path.join(dir, file), text);
    // A snippet inside a list item.
    append(
      'docs/error-reporting.md',
      "\n- Item:\n\n  ```ts\n  export { Missing } from '@/shared/ui/NoSuchFile';\n  ```\n"
    );
    append(
      'docs/testing.md',
      '\nSee `.maestro/no-such-flow.yaml` and `public/nope.html`.\n'
    );
    append('shared/lib/logger.ts', '\n// See docs/recipes/no-such.md.\n');
    append('scripts/e2e/run.sh', '\n# See docs/testing.md#no-such-heading.\n');
    append('.env.example', '\n# See docs/no-such-page.md.\n');
    // A snippet that compiles but breaks the lint rules where it says it goes.
    append(
      'docs/conventions.md',
      '\n```ts\n// features/notes/api/notesApi.ts\nconst notes = 1;\nexport default notes;\n```\n'
    );

    const result = spawnSync(process.execPath, ['scripts/check-docs.js'], {
      cwd: dir,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/docs\/error-reporting\.md.*NoSuchFile/);
    expect(result.stderr).toContain(
      'path does not exist: .maestro/no-such-flow.yaml'
    );
    expect(result.stderr).toContain('path does not exist: public/nope.html');
    expect(result.stderr).toContain(
      'refers to missing docs/recipes/no-such.md'
    );
    expect(result.stderr).toContain('scripts/e2e/run.sh:');
    expect(result.stderr).toContain(
      'no heading for docs/testing.md#no-such-heading'
    );
    expect(result.stderr).toContain('.env.example:');
    expect(result.stderr).toContain('refers to missing docs/no-such-page.md');
    expect(result.stderr).toMatch(
      /docs\/conventions\.md:\d+: Use a named export.*\(no-restricted-syntax\)/
    );
  }, 120000);

  it('checks every link form, typescript and ~~~ fences, inline-code anchors, and open fences', () => {
    const copy = makeCopy();
    try {
      const write = (file: string, text: string) =>
        fs.writeFileSync(path.join(copy, file), text);
      write(
        'docs/forms.md',
        [
          '# Forms',
          '',
          '[titled](nope-titled.md "A title")',
          '[angle](<nope angle.md>)',
          '[ref][r]',
          '',
          '[r]: ./nope-ref.md',
          '',
          '<a href="nope-html.md">html</a>',
          '',
          'See `docs/testing.md#no-such-anchor` and `./shared/nope.ts`.',
          '',
          'Run `npm run-script nope`.',
          '',
          // Not problems: an encoded space, a real anchor, a footnote, a
          // setext heading, and parentheses in a target.
          '[space](forms%20ok.md) and [anchor](#forms)',
          '',
          'A claim.[^1] See [setext](#setext-title) and [draft](forms-(draft).md).',
          '',
          '[^1]: Footnote text',
          '',
          'Setext Title',
          '------------',
          '',
          '## See [Expo](https://expo.dev)',
          '',
          '[linked heading](#see-expo)',
          '',
          '## Twice',
          '',
          '## Twice',
          '',
          '[second](#twice-1) [gone here](#no-such-here) [gone there](testing.md#no-such-there)',
          '',
          '```json',
          '{ "unquoted": yes }',
          '```',
          '',
          '```tsx',
          "export { Missing } from '@/shared/ui/NoSuchTsx';",
          '```',
          '',
          // zod is installed, so a block that requires it is still compiled.
          '<!-- docs-check: requires zod -->',
          '',
          '```ts',
          "export { Missing } from '@/shared/ui/NoSuchRequired';",
          '```',
          '',
          '[gone](nope-(paren).md)',
          '',
          '```typescript',
          "export { Missing } from '@/shared/ui/NoSuchTypescript';",
          '```',
          '',
          '~~~ts',
          "export { Missing } from '@/shared/ui/NoSuchTilde';",
          '~~~',
          '',
          '````md',
          '```ts',
          'this is an example of Markdown, not code',
          '```',
          '````',
          '',
          '```ts',
          'const unclosed = 1;',
        ].join('\n')
      );
      write('docs/forms ok.md', '# OK\n');
      write('docs/forms-(draft).md', '# Draft\n');
      fs.writeFileSync(
        path.join(copy, 'scripts/audit-allowlist.json'),
        JSON.stringify({ $comment: 'See docs/nope-json.md.', advisories: [] })
      );
      fs.mkdirSync(path.join(copy, 'features/notes'), { recursive: true });
      write(
        'features/notes/README.md',
        'See [the page](../../docs/nope-readme.md).\n'
      );

      const result = spawnSync(process.execPath, ['scripts/check-docs.js'], {
        cwd: copy,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      for (const problem of [
        'broken link nope-titled.md',
        'broken link nope angle.md',
        'broken link ./nope-ref.md',
        'broken link nope-html.md',
        'broken link nope-(paren).md',
        'no heading for docs/testing.md#no-such-anchor',
        'path does not exist: shared/nope.ts',
        'npm run nope: no such script',
        'no heading for #no-such-here',
        'no heading for testing.md#no-such-there',
        'JSON block does not parse',
        'NoSuchTsx',
        'NoSuchRequired',
        'NoSuchTypescript',
        'NoSuchTilde',
        'code block is never closed',
        'scripts/audit-allowlist.json:1: refers to missing docs/nope-json.md',
        'features/notes/README.md:1: broken link ../../docs/nope-readme.md',
      ]) {
        expect(result.stderr).toContain(problem);
      }
      expect(result.stderr).not.toMatch(
        /forms%20ok|forms ok|#forms\b|Markdown, not code|Footnote|setext|draft|see-expo|twice-1/
      );
    } finally {
      fs.rmSync(copy, { recursive: true, force: true });
    }
  }, 120000);

  it.each([
    [
      'exits 2',
      'process.exit(2)',
      'tsc failed (exit 2) without reporting a problem',
    ],
    [
      'is killed',
      "process.kill(process.pid, 'SIGKILL')",
      'tsc failed (killed by SIGKILL) without reporting a problem',
    ],
  ])(
    'fails when tsc %s without printing anything',
    (_case, stop, message) => {
      const copy = makeCopy();
      try {
        // Loaded into every node process the check starts; acts only in tsc.
        const stub = path.join(copy, 'silent-tsc.js');
        fs.writeFileSync(
          stub,
          `if (/typescript[\\\\/]bin[\\\\/]tsc$/.test(process.argv[1] ?? '')) ${stop};\n`
        );
        const result = spawnSync(process.execPath, ['scripts/check-docs.js'], {
          cwd: copy,
          encoding: 'utf8',
          env: { ...process.env, NODE_OPTIONS: `--require ${stub}` },
        });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(message);
      } finally {
        fs.rmSync(copy, { recursive: true, force: true });
      }
    },
    120000
  );

  it('fails when tsc or ESLint fails without reporting a snippet', () => {
    const copy = makeCopy();
    try {
      // A tsconfig error: tsc fails before it reads a snippet.
      const tsconfig = path.join(copy, 'tsconfig.tools.json');
      const config = JSON.parse(fs.readFileSync(tsconfig, 'utf8'));
      config.compilerOptions = { ...config.compilerOptions, target: 'nope' };
      fs.writeFileSync(tsconfig, JSON.stringify(config));
      // An ESLint config that throws: the lint subprocess crashes.
      fs.appendFileSync(
        path.join(copy, 'eslint.config.js'),
        "\nthrow new Error('broken config');\n"
      );

      const result = spawnSync(process.execPath, ['scripts/check-docs.js'], {
        cwd: copy,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/tsc: .*target/);
      expect(result.stderr).toContain('eslint did not run');
    } finally {
      fs.rmSync(copy, { recursive: true, force: true });
    }
  }, 120000);
});
