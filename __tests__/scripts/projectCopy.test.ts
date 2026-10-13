/**
 * @jest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { projectFiles } from '@/testing/projectCopy';

describe('projectFiles', () => {
  it('lists the files of a project that is not a git repository', () => {
    // e.g. from "Download ZIP": the script tests still find the files.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'no-git-'));
    try {
      for (const file of [
        'package.json',
        'docs/a.md',
        'node_modules/x/index.js',
        'dist/index.html',
      ]) {
        fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        fs.writeFileSync(path.join(root, file), '');
      }
      expect(projectFiles(root).sort()).toEqual(['docs/a.md', 'package.json']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
