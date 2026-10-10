# Issue 41 verification — production dependency audit, re-reviewed and gated in CI

Verified on 2026-10-09. The review itself: [audit-review.md](audit-review.md).

## Change

- **Remediation.** `npm audit fix` without `--force` updated only the
  lockfile, within the existing ranges: `brace-expansion` 1.1.21,
  `minimatch` 3.1.5, `js-yaml` 3.15.2, and patch updates to `lodash`,
  `flatted`, `ajv`, `@humanfs/*`, and `@expo/cli` 57.0.28
  ([04](04-lockfile-changes.log)). This fixed 11 high and 4 moderate
  advisories. Two high advisories remain (`node-forge`, `braces`); neither
  has a released fix.
- **Review.** `docs/evidence/issue-41/audit-review.md` gives each remaining
  advisory its dependency path, whether it ships in the app (checked against
  the iOS, Android, and web bundles' source maps, [05](05-bundle-contents.log)),
  exposure for a mobile client, the available fix, the owner, and the next
  review date. It supersedes issue 16's review, which now says so at the top.
- **Gate.**
  - `scripts/audit-allowlist.json` records the two accepted advisories (path,
    exposure, fix status, owner, reviewed, `reviewBy` 2027-01-09, tracking
    #43).
  - `scripts/check-audit.js` (`npm run audit:check`, a new CI step) fails on
    any high or critical advisory that is not allowlisted and on any entry
    past `reviewBy`. It notes entries that are no longer reported.
  - Documented in `docs/getting-started.md` and `scripts/README.md`.
- **Tracking.** #43 (status:blocked, waiting on upstream) tracks the two
  allowlisted highs and the bundled moderate `decode-uri-component`, which
  needs Expo SDK 58.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                                | Evidence                                                                                                                                                                                                                                                                                                                         | Result |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `npm audit --omit=dev --json` captured; every critical/high remediated (compatible upgrade, verified by expo-doctor and gates) or recorded with path, exploitability, owner, review date, tracking issue | [01 before](01-npm-audit-before.json), [02 after](02-npm-audit-after.json); remediation verified by `npm ci`, `expo install --check`, `expo-doctor` 21/21 ([03](03-expo-checks.log)), iOS/Android/web exports and the gates; [audit-review.md](audit-review.md) and `scripts/audit-allowlist.json` for `node-forge` and `braces` | PASS   |
| 2   | Issue 16's review superseded by an updated review linked from this issue                                                                                                                                 | [audit-review.md](audit-review.md); `docs/evidence/issue-16/audit-review.md` starts with a "Superseded" link                                                                                                                                                                                                                     | PASS   |
| 3   | CI runs `npm audit --omit=dev --audit-level=high` against a reviewed allowlist (or equivalent), so new unreviewed highs fail                                                                             | `npm run audit:check` in CI; [12](12-audit-check.log) passes; [06](06-audit-check-probes.log): with the `braces` entry removed, or the `node-forge` entry expired, it exits 1                                                                                                                                                    | PASS   |
| 4   | Gates pass locally and in CI                                                                                                                                                                             | [07 lint](07-lint.log), [08 tsc](08-type-check.log), [09 tests](09-test-ci.log), [10 format](10-format-check.log), [11 docs](11-docs-check.log), [12 audit](12-audit-check.log); CI run in the closing comment                                                                                                                   | PASS   |
