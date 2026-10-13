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
    fs.rmSync(dir, { recursive: true, force: true });
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
    expect(result.stderr).toMatch(
      /docs\/conventions\.md:\d+: Use a named export.*\(no-restricted-syntax\)/
    );
  }, 120000);
});
