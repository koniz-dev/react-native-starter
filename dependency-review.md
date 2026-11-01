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

- Review records: each entry's review is in the evidence folder of the issue
  that added it on the `evidence` branch (the first, 2026-10-09, in
  [issue 41](https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md)).
  On `main` (2026-11-01) the entries are `decode-uri-component` (#146) and
  the zod 3 under `@expo/cli` (#142); on `sdk-58` the list is empty (Expo
  58.0.22 dropped zod 3, and Expo Router 58 has no `query-string`).
- Remediation needs no tracking issue (#43 was closed by #67): the weekly
  Audit run fails once npm can apply an upstream fix within the current
  ranges, and notes an entry npm no longer reports; then upgrade and remove
  the entry. A fix that needs a major upgrade arrives with the SDK upgrade.
- **Don't rely on npm alone to spot a fix.** npm's `fixAvailable` can be
  wrong: for the zod entry it offered `expo@51` (a downgrade), so
  audit:check treated the advisory as unfixable while `expo ~58.0.16`
  already allowed the fixed 58.0.22 (#146). At each review, also check the
  parents' newer patch releases (`npm view <parent> dependencies`).
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
3. Expo SDK upgrades are not scheduled (Support Policy): an open upgrade
   issue is merged only once the store's Expo Go runs that SDK.
4. Gates pass; CI and the Audit workflow are green. The review is recorded
   as evidence.
