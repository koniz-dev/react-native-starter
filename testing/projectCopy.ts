/**
 * Copies of the project for tests that run its scripts (Node only: import it
 * as '@/testing/projectCopy', not through '@/testing').
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const PROJECT_ROOT = path.resolve(__dirname, '..');

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

function walk(root: string, dir = ''): string[] {
  return fs
    .readdirSync(path.join(root, dir), { withFileTypes: true })
    .flatMap(entry => {
      const rel = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        return SKIPPED_DIRS.has(entry.name) ? [] : walk(root, rel);
      }
      return entry.isFile() ? [rel] : [];
    });
}

/** A regular file (not a symlink or folder) outside the skipped folders. */
function isProjectFile(root: string, file: string): boolean {
  if (file.split('/').some(part => SKIPPED_DIRS.has(part))) return false;
  try {
    return fs.lstatSync(path.join(root, file)).isFile();
  } catch {
    return false;
  }
}

/**
 * The project's regular files: tracked and untracked-but-not-ignored ones,
 * or, in a project that isn't a git repository (a downloaded ZIP), every
 * file outside the skipped folders. Symlinks (such as a linked
 * node_modules) are left out.
 */
export function projectFiles(root = PROJECT_ROOT): string[] {
  let listed: string;
  try {
    listed = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
  } catch {
    return walk(root);
  }
  return listed.split('\0').filter(file => file && isProjectFile(root, file));
}

/**
 * Links this project's node_modules into `dir`, as a junction on Windows
 * (which needs no admin rights there; other systems ignore the type).
 */
export function linkDependencies(dir: string): void {
  fs.symlinkSync(
    path.join(PROJECT_ROOT, 'node_modules'),
    path.join(dir, 'node_modules'),
    'junction'
  );
}

/** Copies the project into a new temp folder that shares its node_modules. */
export function copyProject(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const file of projectFiles()) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(PROJECT_ROOT, file), path.join(dir, file));
  }
  linkDependencies(dir);
  return dir;
}
