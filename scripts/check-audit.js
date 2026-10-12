#!/usr/bin/env node
/**
 * Checks `npm audit --omit=dev` against scripts/audit-allowlist.json
 * (npm run audit:check; .github/workflows/audit.yml runs it). It fails when:
 *
 * - a high or critical advisory is not in the allowlist;
 * - an allowlisted entry is past its reviewBy date;
 * - npm can now fix an allowlisted advisory within the current dependency
 *   ranges (`npm audit fix` would apply it without a major upgrade), so an
 *   upstream fix is noticed without tracking it by hand.
 *
 * Allowlisted advisories that npm no longer reports are listed so the entry
 * can be removed. Moderate and low advisories are reported but don't fail.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GATED = new Set(['high', 'critical']);

/** True when `npm audit fix` can apply the fix without a major upgrade. */
function fixWithinRanges(fixAvailable) {
  return (
    fixAvailable === true ||
    (typeof fixAvailable === 'object' &&
      fixAvailable !== null &&
      !fixAvailable.isSemVerMajor)
  );
}

/**
 * Compares an `npm audit --json` report with the allowlist entries on the
 * given day (YYYY-MM-DD). Returns the lines to print and the problems that
 * fail the check.
 */
function evaluate(report, allowlist, today) {
  // One entry per advisory, with the packages npm reports it on.
  const advisories = new Map();
  for (const [name, vulnerability] of Object.entries(
    report.vulnerabilities ?? {}
  )) {
    for (const via of vulnerability.via) {
      if (typeof via !== 'object') continue;
      const id = via.url.split('/').pop();
      const entry = advisories.get(id) ?? {
        id,
        package: via.name,
        severity: via.severity,
        title: via.title,
        fixable: false,
      };
      if (name === via.name && fixWithinRanges(vulnerability.fixAvailable)) {
        entry.fixable = true;
      }
      advisories.set(id, entry);
    }
  }

  const allowed = new Map(allowlist.map(entry => [entry.id, entry]));
  const problems = [];
  const lines = [];

  for (const advisory of [...advisories.values()].sort((a, b) =>
    a.severity.localeCompare(b.severity)
  )) {
    const entry = allowed.get(advisory.id);
    const status = !GATED.has(advisory.severity)
      ? 'reported (not gated)'
      : entry
        ? `allowlisted until ${entry.reviewBy} (${entry.tracking})`
        : 'NOT REVIEWED';
    lines.push(
      `${advisory.severity.padEnd(9)}${advisory.package} ${advisory.id}: ${status}`
    );
    if (!GATED.has(advisory.severity)) continue;
    if (!entry) {
      problems.push(
        `${advisory.severity} ${advisory.package} ${advisory.id} (${advisory.title}) is not in scripts/audit-allowlist.json: remediate it or review and allowlist it.`
      );
    } else if (advisory.fixable) {
      problems.push(
        `${advisory.package} ${advisory.id}: a fix is now available within your dependency ranges; apply it (npm audit fix --omit=dev, or npx expo install --fix for Expo packages), then remove the allowlist entry.`
      );
    }
  }

  for (const entry of allowlist) {
    if (entry.reviewBy < today) {
      problems.push(
        `${entry.package} ${entry.id}: allowlist review expired on ${entry.reviewBy}; re-review it (${entry.tracking}).`
      );
    }
    if (!advisories.has(entry.id)) {
      lines.push(
        `note: ${entry.package} ${entry.id} is allowlisted but no longer reported; remove the entry.`
      );
    }
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  lines.push(
    `npm audit --omit=dev: ${advisories.size} advisories (records: ${counts.critical ?? 0} critical, ${counts.high ?? 0} high, ${counts.moderate ?? 0} moderate, ${counts.low ?? 0} low).`
  );
  return { lines, problems };
}

function main() {
  const allowlist = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'audit-allowlist.json'), 'utf8')
  ).advisories;
  const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(audit.stdout);
  } catch {
    process.stderr.write(`npm audit did not return JSON:\n${audit.stderr}\n`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { lines, problems } = evaluate(report, allowlist, today);
  process.stdout.write(`${lines.join('\n')}\n`);
  if (problems.length > 0) {
    process.stderr.write(`${problems.join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write('No unreviewed high or critical advisories.\n');
}

if (require.main === module) {
  main();
}

module.exports = { evaluate };
