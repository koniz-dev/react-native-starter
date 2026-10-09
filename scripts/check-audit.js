#!/usr/bin/env node
/**
 * Fails when `npm audit --omit=dev` reports a high or critical advisory that
 * is not in scripts/audit-allowlist.json, or when an allowlisted entry is
 * past its reviewBy date (npm run audit:check; CI runs it).
 *
 * Allowlisted advisories that npm no longer reports are listed so the entry
 * can be removed. Moderate and low advisories are reported but don't fail.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GATED = new Set(['high', 'critical']);

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
        reportedOn: new Set(),
      };
      entry.reportedOn.add(name);
      advisories.set(id, entry);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const allowed = new Map(allowlist.map(entry => [entry.id, entry]));
  const problems = [];
  const log = message => process.stdout.write(`${message}\n`);

  for (const advisory of [...advisories.values()].sort((a, b) =>
    a.severity.localeCompare(b.severity)
  )) {
    const entry = allowed.get(advisory.id);
    const status = !GATED.has(advisory.severity)
      ? 'reported (not gated)'
      : entry
        ? `allowlisted until ${entry.reviewBy} (${entry.tracking})`
        : 'NOT REVIEWED';
    log(
      `${advisory.severity.padEnd(9)}${advisory.package} ${advisory.id}: ${status}`
    );
    if (GATED.has(advisory.severity) && !entry) {
      problems.push(
        `${advisory.severity} ${advisory.package} ${advisory.id} (${advisory.title}) is not in scripts/audit-allowlist.json: remediate it or review and allowlist it.`
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
      log(
        `note: ${entry.package} ${entry.id} is allowlisted but no longer reported; remove the entry.`
      );
    }
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  log(
    `npm audit --omit=dev: ${advisories.size} advisories (records: ${counts.critical ?? 0} critical, ${counts.high ?? 0} high, ${counts.moderate ?? 0} moderate, ${counts.low ?? 0} low).`
  );
  if (problems.length > 0) {
    process.stderr.write(`${problems.join('\n')}\n`);
    process.exit(1);
  }
  log('No unreviewed high or critical advisories.');
}

main();
