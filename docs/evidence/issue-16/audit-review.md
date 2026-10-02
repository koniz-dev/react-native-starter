# Issue 16 audit remediation and risk review

Verified on 2026-10-02 with Node v26.7.0 and npm 11.x after
`npm ci --legacy-peer-deps`.

## Remediation performed

Ran `npm audit fix --omit=dev --legacy-peer-deps` without `--force`. The
lockfile-only update reduced the production audit result from **1 critical / 6
high** to **0 critical / 4 high**. The four high records represent one
unresolved dependency family rather than four independently remediable direct
dependencies.

| Package reported by audit         | Exact dependency path                                                          | Status                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `expo`                            | root -> `expo@57.0.26`                                                         | Reported because it brings Expo CLI.                                           |
| `@expo/cli`                       | `expo@57.0.26` -> `@expo/cli@57.0.27`                                          | No supported npm update fixes the advisory.                                    |
| `@expo/code-signing-certificates` | `expo` -> `@expo/cli` -> `@expo/code-signing-certificates@0.0.6`               | Depends on vulnerable `node-forge`.                                            |
| `node-forge@1.4.0`                | `expo` -> `@expo/cli` -> `node-forge` (also through code-signing certificates) | High advisory `GHSA-86w9-cpqp-85rv`; no compatible audited version is offered. |

`npm audit` proposes downgrading the app to Expo `44.0.6` as its only fix. That
is incompatible with the verified Expo 57 dependency set and is rejected as a
remediation. No `npm audit fix --force` was run.

## Supported-release research

- npm marks Expo `57.0.26` as `latest`; SDK 58 is published only under the
  `next` tag and is not used as a stable baseline.
- The currently released Expo CLI `57.0.27` declares `node-forge@^1.3.3`.
  Older stable Expo SDKs 54–56 also pull an Expo CLI, so downgrading does not
  demonstrate a clean supported path.
- npm's latest `node-forge` is `1.4.0`, and the upstream source commits after
  that release only prepare `1.4.1`, adjust tests, and update security policy.
  They contain no released advisory fix. There is therefore no safe version to
  force through an npm override.

An independently upgraded Expo CLI or a canary SDK would break Expo's supported
SDK coupling and would substitute an unverified dependency graph for a known
one. Neither is a release remediation.

## Runtime exposure and controls

The remaining package path belongs to the local Expo CLI and its build/config
tooling; it is not a direct application dependency. The verified web export
completed successfully after the remediation, but that does **not** eliminate
the CLI supply-chain risk. Current compensating controls are limited to using
the committed lockfile, installing from a trusted registry, and not running
the CLI against untrusted project configuration or in a privileged production
runtime.

## Required owner decision

No agent may accept a high-severity dependency risk for the project owner.
`koniz-dev` must choose one of the following before this issue can close:

1. Accept the bounded development/build-tooling risk until the next supported
   Expo patch, recording an owner and a review date; or
2. Reject the risk and keep the starter unreleased while a supported Expo
   upgrade removes `node-forge`.

The remediation trigger is any new Expo 57 patch or the next supported Expo
SDK that removes the advisory; re-run `npm audit --omit=dev --json` at that
time. Until the decision is recorded, this is not MVP or maintenance-ready.

## Regression checks

- `npm ci --legacy-peer-deps` — PASS.
- `npm run lint`, `npm run type-check`, `npm run test:ci` (6 suites / 40
  tests), and `npm run format:check` — PASS.
- `npx expo-doctor` — PASS (21/21 checks).
- `npx expo export --platform web --output-dir /tmp/react-native-starter-web-export-16`
  — PASS (1,058 bundled modules).
