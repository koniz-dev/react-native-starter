# Dependency Review

> For maintainers of the starter itself; delete in your project. See
> [Maintainers](README.md).

`npm run audit:check` (CI runs it) fails on any high or critical advisory in
`npm audit --omit=dev` that is not reviewed in `scripts/audit-allowlist.json`,
or whose review date has passed. The allowlist ships to adopters with the
starter's review of the advisories in the starter's own dependency tree, so
their CI starts green; adopters re-review the entries for their project
(see [Getting Started](../getting-started.md#dependency-advisories)).

## The starter's review

- Review record (2026-10-09): `audit-review.md` in issue 41's folder on the
  `evidence` branch,
  <https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md>.
- Remediation is tracked in
  [koniz-dev/react-native-starter#43](https://github.com/koniz-dev/react-native-starter/issues/43):
  upgrade once upstream releases a fixed `node-forge` or `braces`, then remove
  the entry.
- Owner: koniz-dev.
- Cadence:
  - **monthly:** on the 1st, the workflow
    `.github/workflows/dependency-review.yml` opens "Dependency review
    YYYY-MM" (in `status:todo`). The issue includes the current
    `audit:check` and `npm outdated` output, and a checklist covering
    advisories, patch/minor updates, and a new Expo SDK. The workflow runs
    only on the upstream repository, and can also be started by hand
    (`gh workflow run dependency-review.yml`);
  - **per entry:** every allowlist entry's `reviewBy` is at most three months
    out. `audit:check` fails once that date passes, which forces a review
    even if a monthly one was missed.
- Security reports from users follow the
  [Support Policy](support-policy.md#security-reports).

## Reviewing an advisory

1. Find the dependency path (`npm ls <package>`) and decide whether the code
   reaches the iOS, Android, or web bundle or only build tooling.
2. Fix it if a patched version exists (`npm update`, an `overrides` entry, or
   an upgrade of the parent).
3. Otherwise add or update the entry in `scripts/audit-allowlist.json`
   (`id`, `package`, `severity`, `path`, `exposure`, `fix`, `owner`,
   `reviewed`, `reviewBy`, `tracking`), with `tracking` set to the upstream
   advisory, and record the review as evidence for the issue that did it.
