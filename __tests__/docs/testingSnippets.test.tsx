/**
 * Runs the example tests in docs/testing.md, taken from the page itself, so
 * an example that no longer passes fails here instead of in an adopter's
 * project. (docs:check only compiles and lints snippets.)
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { linkDependencies } from '@/testing/projectCopy';

const DOC = path.resolve(__dirname, '../../docs/testing.md');
const snippetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'testing-doc-'));
// The compiled modules need this repo's packages (Babel helpers).
linkDependencies(snippetDir);
afterAll(() => fs.rmSync(snippetDir, { recursive: true, force: true }));

/** Writes the snippet whose first line is `first` and loads it here. */
function runSnippet(first: string): void {
  const doc = fs.readFileSync(DOC, 'utf8');
  const start = doc.indexOf(first);
  if (start < 0) throw new Error(`${DOC}: no "${first}" snippet`);
  const file = path.join(snippetDir, path.basename(first.slice(3)));
  fs.writeFileSync(file, doc.slice(start, doc.indexOf('\n```', start)));
  // Its describe/it/beforeEach register in this file.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(file);
}

describe('docs/testing.md: a seam or adapter in a full-app test', () => {
  runSnippet('// __tests__/shared/integrations/analyticsProvider.test.tsx');
});
