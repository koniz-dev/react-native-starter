> **Superseded** on 2026-10-09 by [issue 41's review](../issue-41/audit-review.md).

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

## Owner decision

On 2026-10-03, `koniz-dev` selected the current stable Expo managed baseline,
which is the community-standard toolchain for this starter. The unresolved
Expo CLI/node-forge chain is accepted as a bounded development/build-tooling
risk, not evidence that the shipped application bundle executes the affected
code.

The decision does not waive security review: rerun
`npm audit --omit=dev --json` for every Expo patch or SDK upgrade and at least
monthly. Escalate immediately if a finding becomes reachable from the app
runtime, build credentials, CI secrets, or a production service. The tracked
remediation trigger remains a supported Expo update that removes `node-forge`.

This decision unblocks ordinary starter development, but does not by itself
establish MVP or maintenance readiness; the dedicated release gate still
requires clean-install, automated, and native UAT evidence.

## Regression checks

- `npm ci --legacy-peer-deps` — PASS.
- `npm run lint`, `npm run type-check`, `npm run test:ci` (6 suites / 40
  tests), and `npm run format:check` — PASS.
- `npx expo-doctor` — PASS (21/21 checks).
- `npx expo export --platform web --output-dir /tmp/react-native-starter-web-export-16`
  — PASS (1,058 bundled modules).
