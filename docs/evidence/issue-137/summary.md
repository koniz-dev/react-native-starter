# Issue #137: manual EAS Build workflow, inert without EXPO_TOKEN

Branch `sdk-58`, commit d1eb09f: [`.github/workflows/eas-build.yml`](https://github.com/koniz-dev/react-native-starter/blob/d1eb09f/.github/workflows/eas-build.yml), [`docs/app-config.md`](https://github.com/koniz-dev/react-native-starter/blob/d1eb09f/docs/app-config.md#eas-build-from-github-actions). Non-security work goes on `sdk-58` while #134 waits (Support Policy) and ships with the SDK 58 merge.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `workflow_dispatch` with profile and platform, runs `eas build`, optionally submits; least-privilege `permissions:`; `concurrency:` with `cancel-in-progress: false` | PASS | Inputs `profile` (preview/production), `platform` (android/ios/all), `submit` (boolean, production only: `--auto-submit` with eas.json's `production` submit profile). `permissions: contents: read`; `concurrency: eas-build-<profile>-<platform>`, `cancel-in-progress: false`. eas-cli pinned to 24.13.0; its source has `--platform android/ios/all` and `--auto-submit`. Inputs reach the shell through `env`, not `${{ }}` in scripts. |
| 2 | Without `EXPO_TOKEN` the job succeeds with a notice | PASS (simulated) | `simulate-workflow.log`: the workflow's own steps run with bash and its `if:` conditions evaluated (`simulate-workflow.js`, run from the repository root). No token: only the check runs, it prints the `::notice`, every other step is skipped, the job succeeds (also for production + submit). With a token: the build command is the expected one. Preview + submit fails with an error. A live run isn't possible yet: GitHub dispatches only workflows on the default branch (`dispatch-before-merge.log`, HTTP 404). |
| 3 | Docs: the secret, the inputs, the relation to OTA updates | PASS | App Config, "EAS Build from GitHub Actions": prerequisites, the secret, an input table, which credentials must already be on EAS (Android keystore is generated non-interactively; iOS certificate and profile need a first local build: checked in eas-cli 24.13.0's `CreateKeystore` and `SetUpDistributionCertificate`), `APP_BUILD_NUMBER`, and `eas update` for JavaScript-only changes. |
| 4 | `npm run docs:check` passes; actionlint has no errors | PASS | `gates.log` (lint, type-check, 736 tests, format, docs:check "No problems."), `actionlint.log` (1.7.12, exit 0). CI 40184067605 and Audit 40184067599 green on d1eb09f. |
| 5 | (human-only) a real `preview` Android build completes on EAS | NEEDS UAT | Needs an Expo account token; the starter has none by design. |

## Left for a human

- After `sdk-58` is merged to `main`: run `gh workflow run eas-build.yml -f profile=preview -f platform=android` in this repository (no `EXPO_TOKEN`). Expect a green run whose summary shows the "EAS Build skipped" notice and skipped build steps.
- Criterion 5, in a project with a real `EXPO_TOKEN` and `eas init` done: the same command; expect the run to finish green and the build to appear on expo.dev with an installable APK.

## Closed as not planned (2026-11-01)

The maintainer decided not to ship the workflow, before any UAT. The starter is in
maintenance mode (security fixes, regressions, compatibility, docs), and this was a new
feature no user asked for: it came from comparing with koniz-dev/flutter-starter. It also
duplicated Expo's own CI options (EAS Workflows, the GitHub integration on expo.dev),
pinned an eas-cli version to keep raising, shipped inert until configured, and its real
build (criterion 5) could never run in this repository's CI. It can be reopened if a user
asks for it.

On `sdk-58` (never on `main`, never released):

- 2333840 reverts d1eb09f (removes `.github/workflows/eas-build.yml` and the App Config
  section "EAS Build from GitHub Actions").
- 1233656 adds the line 2333840's message promised but left out (it wasn't staged): App
  Config's "EAS Build, the first time" step 4 points to Expo's
  [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/) and
  [build on CI](https://docs.expo.dev/build/building-on-ci/) guides (both HTTP 200 on
  2026-11-01).
- Local gates on 1233656's tree: format, lint, type-check, docs:check "No problems.", 750/750
  tests.
- 1233656 got no CI or Audit run: PR #135 conflicted with `main` (the README rewrite,
  1a3015a), so GitHub ran no `pull_request` workflows. 57d73bb merges `main` into `sdk-58`
  (README: main's version with the Expo SDK badge and Tech stack row on SDK 58, React Native
  0.88). Local gates on it: the same, 750/750. Actions on 57d73bb: CI 41282828760 success,
  CodeQL 41282828410 success, Audit 41282828756 failure.
- The Audit failure isn't from these commits: high advisories published on 2026-10-29/30
  for `follow-redirects` (GHSA-mrwp-f3q8-3g9p, via axios) and `node-forge` (five, via
  `@expo/cli`), which `main` has too (plus `decode-uri-component` GHSA-qr28-fpjm-wq7f). They
  are handled in their own issue.

Verdict: closed, not planned; nothing of #137 remains on any branch.
