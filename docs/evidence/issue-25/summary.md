# Issue 25 verification — clean `npm ci` and green CI

Verified on 2026-10-06.

## Root cause

`package-lock.json` had been generated with npm's legacy peer resolver. Plain
`npm ci` (as CI runs it) rejected it (`lock file's ws@7.5.13 does not satisfy
ws@8.22.0`, missing `react-native-reanimated` / `react-native-worklets` /
`react-native-gesture-handler` / `@react-native/*` entries;
[01](01-npm-ci-before.log)). Those three packages are optional peers of
expo-router 57 declared as `"*"`, so the standard resolver picked the latest
releases (reanimated 4.7.1, worklets 0.13.0) — outside the range
`expo-modules-core` 57 accepts (`react-native-worklets ^0.7.4 … ^0.10.0`).

## Change

- `npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler`
  declares the SDK 57 versions (4.5.1, 0.10.1, ~2.32.0); `expo install` also
  added the `expo-router` config plugin to `app.json`.
- `npx expo install --fix` applied SDK 57 patch updates (`expo` ~57.0.27,
  `expo-router` ~57.0.25, `expo-linking` ~57.0.12, `expo-constants`) and
  changed `expo` from `^` to `~`.
- Lockfile regenerated with the standard resolver; no `.npmrc` or
  `--legacy-peer-deps` is needed.
- Node pinned: `.nvmrc` = 24, `engines.node` = `^22.13.0 || >=24.3.0`
  (React Native 0.86 supports `^20.19.4 || ^22.13.0 || ^24.3.0`; Node 20 is
  end-of-life).
- CI: `node-version-file: .nvmrc`, npm cache, concurrency group, plus
  `npx expo-doctor` and `npx expo export --platform web` steps.
- README and `docs/getting-started.md`: `npm ci` without flags, Node 24/22.13+,
  no yarn, and troubleshooting no longer deletes the lockfile.

## Acceptance criteria

| #   | Criterion                                                                                            | Evidence                                                                                                                                                                                                         | Result       |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | Plain `npm ci` succeeds on a clean checkout                                                          | [02](02-npm-ci-after.log) (exit 0, no `ERESOLVE`); CI "Install dependencies" step, [11](11-github-actions-run-37488448849.log)                                                                                   | PASS         |
| 2   | Lockfile has expo-router's peers; expo-doctor and `expo install --check` pass                        | [07](07-expo-doctor.log) 21/21; [09](09-expo-install-check.log) "Dependencies are up to date"                                                                                                                    | PASS         |
| 3   | Node pinned and documented                                                                           | `.nvmrc`, `package.json` `engines`, README, getting-started; CI log shows `node-version-file: .nvmrc`                                                                                                            | PASS         |
| 4   | `npm run lint` uses `--max-warnings 0`                                                               | Moved to #35: the only 6 warnings are in `components/ThemedText.tsx`, dead code that #35 deletes, and #35's criterion 4 already requires `--max-warnings 0`. Lint passes with 0 errors here ([03](03-lint.log)). | Moved to #35 |
| 5   | CI uses `.nvmrc`, caches npm, runs install, lint, format, type-check, tests, expo-doctor, web export | `.github/workflows/ci.yml`; every step succeeds in run 37488448849                                                                                                                                               | PASS         |
| 6   | CI run for the fixing commit is green                                                                | https://github.com/koniz-dev/react-native-starter/actions/runs/37488448849 (commit 0bbcea9, all steps `success`); log [11](11-github-actions-run-37488448849.log)                                                | PASS         |
| 7   | Install docs match the working command                                                               | README, `docs/getting-started.md`                                                                                                                                                                                | PASS         |
| 8   | `npx expo start` still bundles; Expo Go smoke                                                        | `iOS Bundled 10452ms index.ts (1489 modules)`; [Expo Go on iPhone 16 Pro / iOS 18.6](10-expo-go-ios-smoke.png)                                                                                                   | PASS         |

Local gate on the clean install (Node 26 locally; CI uses 24): format
[04](04-format-check.log), type-check [05](05-type-check.log), 12 suites / 65
tests [06](06-test-ci.log), web export [08](08-web-export.log).
