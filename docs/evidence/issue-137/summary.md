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
