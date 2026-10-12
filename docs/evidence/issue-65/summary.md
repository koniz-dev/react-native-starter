# Issue 65 verification: Expo SDK 57 patch releases

Done on 2026-10-12 on `main` at
[`be22909`](https://github.com/koniz-dev/react-native-starter/commit/be22909)
(`npx expo install --fix`).

| package | from | to |
| ------- | ---- | -- |
| expo | ~57.0.27 | ~57.0.28 |
| expo-router | ~57.0.25 | ~57.0.26 |
| expo-splash-screen | ~57.0.9 | ~57.0.10 |
| jest-expo | ~57.0.5 | ~57.0.6 |

The other 36 lockfile changes are these packages' own dependencies (Expo
CLI, modules core and autolinking, babel-preset-expo, radix packages under
expo-router's `vaul`); see [commit-be22909.txt](commit-be22909.txt) and
[package-json.diff](package-json.diff).

## Acceptance criteria

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | `expo install --check` up to date; expo-doctor 21/21 on a fresh clone | [expo-install-check.log](expo-install-check.log): "Dependencies are up to date". [expo-doctor-after.log](expo-doctor-after.log) (fresh clone at `be22909`): 21/21. Before: [the failing CI run 38265011360](github-actions-ci-38265011360-failed.log) | PASS |
| 2   | Gates pass; CI green | The fresh-clone gates of [issue 64](../issue-64/summary.md) ran on `be22909`: lint, type-check, test:ci (279), format:check, docs:check, audit:check, web export, all exit 0. CI run 38265639991: success | PASS |
| 3   | The app starts and the baseline flows pass on Android Expo Go, 6/6 plus dark | Run 38266035038 on `be22909`: [report](../issue-64/android-expo-go/report.xml) 6/6, plus dark. Native debug (prebuild with the new Expo), run 38266040630: [report](../issue-64/android-native-debug/report.xml) 6/6, plus dark. Screenshots checked | PASS |
