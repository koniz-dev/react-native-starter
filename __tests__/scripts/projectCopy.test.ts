/**
 * @jest-environment node
 */
import { execFileSync } from 'child_process';
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

  it('leaves out a symlinked node_modules, even one git lists', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'linked-'));
    const shared = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-modules-'));
    try {
      fs.writeFileSync(path.join(root, 'package.json'), '');
      fs.symlinkSync(shared, path.join(root, 'node_modules'), 'junction');
      execFileSync('git', ['init', '-q'], { cwd: root });
      // Committed by `git add -A` before node_modules matched symlinks too.
      execFileSync('git', ['add', '-A'], { cwd: root });
      expect(projectFiles(root)).toEqual(['package.json']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(shared, { recursive: true, force: true });
    }
  });
});
