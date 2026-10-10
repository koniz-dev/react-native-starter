# Production dependency audit review

Reviewed on 2026-10-09 (Node 26.7, npm 11), Expo SDK 57.0.27,
`expo-router` 57.0.25. It supersedes
[issue 16's review](../issue-16/audit-review.md). The next review is due by
2027-01-09 (the allowlist's `reviewBy`), or earlier when a fix is released
(tracked in #43).

## Summary

| Stage                                                 | Advisories (distinct)  | npm records (critical / high / moderate) |
| ----------------------------------------------------- | ---------------------- | ---------------------------------------- |
| Before ([01](01-npm-audit-before.json))               | 8 roots, 21 advisories | 0 / 48 / 13                              |
| After `npm audit fix` ([02](02-npm-audit-after.json)) | 5 advisories           | 0 / 45 / 16                              |

npm counts a record for every package on the path to a vulnerable one
(`jest`, `metro`, `react-native`, `expo`, ...), so the record counts barely
move. What matters is the advisories: after the fix, two high advisories
remain, both without a released fix, and three moderate ones.

## Remediated

`npm audit fix` without `--force` updated the lockfile only, within existing
semver ranges ([04](04-lockfile-changes.log)):

| Package           | From → to       | Advisories fixed                                                                                                                            |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `brace-expansion` | 1.1.12 → 1.1.21 | GHSA-3jxr-9vmj-r5cp, -mh99-v99m-4gvg, -rgw5-rvv9-x895, -qhr7-859c-m2p7, -6j4f-fj2g-mc7p (high); -f886-m6hf-6m8v, -q2hr-2g5m-vwhr (moderate) |
| `minimatch` (3.x) | 3.1.2 → 3.1.5   | GHSA-3ppc-4f35-3m26, -7r86-cg39-jmmj, -23c5-xmqv-rm74 (high)                                                                                |
| `js-yaml` (3.x)   | 3.14.1 → 3.15.2 | GHSA-52cp-r559-cp3m, -5p4m-2wfm-xmqj, -2883-xcg3-v3hh (high); -mh29-5h37-fv8m, -h67p-54hq-rp68 (moderate)                                   |

It also brought patch updates to `lodash`, `flatted`, `ajv`, and `@humanfs/*`,
and hoisted `@expo/cli` 57.0.28. Verified after `npm ci`: `npx expo install
--check` and `npx expo-doctor` (21/21) clean ([03](03-expo-checks.log)); iOS,
Android, and web exports build; lint, type-check, 199 tests, and docs check
pass.

## Accepted (allowlisted, high)

Both are in `scripts/audit-allowlist.json`; `npm run audit:check` (CI) fails
on any other high or critical advisory and on an entry past `reviewBy`.

| Advisory                                                                                                                | Path                                                                            | Fix available                                                                                    | Exposure for this mobile client                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node-forge` GHSA-86w9-cpqp-85rv (RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm elements) | `expo` → `@expo/cli` → `node-forge` (and via `@expo/code-signing-certificates`) | No: 1.4.0 is the latest release, in range `<=1.4.0`. npm's only "fix" is downgrading to Expo 44. | Build tool only. Expo CLI uses it on the developer's or CI machine for code-signing certificates (EAS Update code signing). Not in the app: the bundles' source maps contain no `node-forge` or `@expo/code-signing-certificates` ([05](05-bundle-contents.log)). Relevant only if you adopt update code signing; the starter doesn't configure it. |
| `braces` GHSA-vfj7-8cjw-p6xm (stack-exhaustion DoS through deeply nested patterns)                                      | `jest`, `metro`, `jest-haste-map` → `micromatch` → `braces`                     | No: 3.0.3 is the latest release, in range `<=3.0.3`.                                             | Build tool only: Metro and Jest match the project's own glob patterns. An attacker would need to control those patterns (i.e. the repository). Not in the app bundles ([05](05-bundle-contents.log)).                                                                                                                                               |

Owner: koniz-dev. Tracking: #43.

## Reported, not gated (moderate)

| Advisory                                                                                        | Path                                                          | In the app?                | Assessment                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decode-uri-component` GHSA-vcc3-ghjq-m6fr (exponential decoding of malformed percent-encoding) | `expo-router` → `query-string` → `decode-uri-component@0.2.2` | **Yes**, all three bundles | Expo Router parses URL query strings with it. A crafted link opened in the app could make it decode slowly (the user's own app, no data exposure). The fix needs `expo-router` 58 (SDK 58), outside the supported SDK 57 set. Revisit with the SDK 58 upgrade (#43). |
| `sprintf-js` GHSA-hp3w-g68c-fv3c                                                                | `js-yaml` 3 → `argparse` → `sprintf-js`                       | No                         | Build tooling; no fixed release (`<=1.1.3`).                                                                                                                                                                                                                         |
| `uuid` GHSA-w5hq-g745-h8pq (v3/v5/v6 with a caller-supplied buffer)                             | `@expo/config-plugins` → `xcode` → `uuid@7`                   | No                         | Prebuild tooling on the developer's machine; `xcode` pins `uuid@^7`, the fix is `uuid` 11.                                                                                                                                                                           |

## Not done

- No `npm audit fix --force` (it proposes Expo 44, React Native 0.72, and
  Jest 30, which break the SDK 57 set) and no `overrides` forcing major
  versions under Expo or Jest.
- Development-only dependencies (`npm audit` without `--omit=dev`) are outside
  the release gate in AGENTS.md and were not reviewed here.
