#!/usr/bin/env node
/**
 * Checks the relative Markdown links in docs/evidence/**\/*.md on this branch:
 * each must resolve to a file or folder on the branch. Links into the code or
 * docs on main must be absolute GitHub URLs pinned to a commit, because main's
 * files are not on this branch.
 *
 * Usage: node tools/check-links.js   (from the branch root)
 */
const fs = require('fs');
const path = require('path');

const EV = 'docs/evidence';
const LINK = /\]\(([^)\s]+)\)/g;

function mdFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return mdFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

const problems = [];
const files = mdFiles(EV);
let links = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [, target] of text.matchAll(LINK)) {
    if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
    links++;
    const resolved = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), decodeURIComponent(target.split('#')[0]))
    );
    if (!(resolved === EV || resolved.startsWith(EV + '/'))) {
      problems.push(`${file}: ${target} leaves ${EV}/ (use a pinned GitHub URL)`);
    } else if (!fs.existsSync(resolved)) {
      problems.push(`${file}: ${target} does not exist`);
    }
  }
}
for (const problem of problems) console.error(problem);
console.log(`Checked ${links} relative links in ${files.length} files: ${problems.length} problems.`);
process.exit(problems.length ? 1 : 0);
