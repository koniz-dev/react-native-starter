# Dependency Review

> Part of the starter's maintainer process (branch `maintainers`). See
> [Maintainers](README.md).

`npm run audit:check` (the Audit workflow, `.github/workflows/audit.yml`, on
push, pull request, weekly, and manual) fails on any high or critical advisory
in `npm audit --omit=dev` that is not reviewed in
`scripts/audit-allowlist.json`, whose review date has passed, or that npm can
now fix within the current dependency ranges. It is not part of CI, so CI
gives the same result for the same commit (#67). The allowlist ships to adopters with the
starter's review of the advisories in the starter's own dependency tree, so
their CI starts green; adopters re-review the entries for their project
(see [Getting Started](https://github.com/koniz-dev/react-native-starter/blob/main/docs/getting-started.md#dependency-advisories)).

## The starter's review

- Review record (2026-10-09): `audit-review.md` in issue 41's folder on the
  `evidence` branch,
  <https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md>.
- Remediation needs no tracking issue (#43 was closed by #67): the weekly
  Audit run fails once npm can apply an upstream fix for `node-forge` or
  `braces`; then upgrade and remove the entry. A fix that needs a major
  upgrade (Expo SDK 58) arrives with the SDK upgrade.
- Owner: koniz-dev.
- Cadence:
  - **a review on the owner's request, normally monthly:** an issue
    "Dependency review YYYY-MM" (`task`, `epic:tooling`, `priority:P2`) with
    the [checklist below](#monthly-review-checklist), worked like any issue
    (#60 was the first);
  - **per entry:** every allowlist entry's `reviewBy` is at most three months
    out. `audit:check` fails once that date passes, which forces a review
    even if none was requested.
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

## Monthly review checklist

Open the issue with the current `npm run audit:check` and `npm outdated`
output under `## Context`, and these acceptance criteria:

1. Every high or critical advisory is fixed, or reviewed in
   `scripts/audit-allowlist.json` with a `reviewBy` at most 3 months out;
   tracking issues are re-checked.
2. Patch and minor updates that the Expo SDK allows
   (`npx expo install --check`, online; CI's `npm run doctor` checks only
   against the installed SDK) are applied, or deferred with a reason.
3. A new Expo SDK release, if any, has an upgrade issue (Support Policy:
   merged within about 1 week of the store's Expo Go moving to it).
4. Gates pass; CI and the Audit workflow are green. The review is recorded
   as evidence.
