/**
 * @jest-environment node
 */
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

/** A copy of the working tree, sharing this repo's node_modules. */
function makeCopy(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-docs-'));
  const files = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: ROOT, encoding: 'utf8' }
  )
    .split('\0')
    .filter(file => file && fs.existsSync(path.join(ROOT, file)));
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), path.join(dir, file));
  }
  fs.symlinkSync(
    path.join(ROOT, 'node_modules'),
    path.join(dir, 'node_modules')
  );
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
  }, 120000);
});
