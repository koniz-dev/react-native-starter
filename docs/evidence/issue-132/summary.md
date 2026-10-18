# Issue #132: tooling LOWs from the eighth audit

Found in the eighth deep audit (2026-10-18), auditors F and E. Commits: 5711156 (init-project), c035b39 (e2e), tests strengthened in 14033fb.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Each item fixed (with a test where it is code) or recorded; the slug change has an old-vs-new table | PASS | See below. `slug-table.md` (made by `slug-table.js.txt` from the old and new scripts): only names with Đ, ð, ß, Ø, Ł, Æ, Œ, Þ, ı, or a leading digit change. `test-before.log`: the new slug and Kotlin cases fail on the old script; `test-after.log`: 77/77. |
| 2 | Gates and CI green | PASS | `gates.log`; CI on c035b39 and later; e2e on c035b39 (Android Expo Go, Android native, iOS native). |

## Items

- **7, 8, 9 (slug letters, digit-leading default scheme, Kotlin keywords): fixed** in 5711156. 14033fb adds a CLI run with `--name "2048 Game"` (the default scheme must be accepted) and the remaining letters and keywords; `mutation-r1.log` shows each is now needed.
- **4 (flow 04 and a late iOS sheet): fixed** in c035b39, the same block as `subflows/sign-in.yaml`.
- **5 (iOS retry not visible; mock not reset): fixed** in c035b39: an Actions `::warning::` and a reset to `ok` before each attempt.
- **1 (CI doesn't run config plugins): recorded.** No gate claims it; a broken plugin option fails loudly at the first prebuild or EAS build, and the e2e workflows prebuild. Adding `npx expo prebuild --no-install` (about 50 s) is the fix if wanted.
- **2, 3 (lint gaps: named colors through constants, `.js` under features/shared, `process` import, `globalThis.console`): recorded.** The project is TypeScript (a `.js` source also skips type-check), and the color rule's own comment scopes it; each is a review item.
- **3 (no `.only` guard): recorded.** It needs eslint-plugin-jest, a new dependency for one rule.
- **6 (iOS reinstall path not in e2e): recorded.** Unit-tested with the SecureStore mock; the flow needs `clearState` without `clearKeychain`, which differs by platform.
- **10 (remove-demo scans ignored files): recorded.** It refuses and names the file; it changes nothing in that case.
- **11 (dry-run output): recorded,** cosmetic.
- Letters without a decomposition beyond those mapped (Ħ, Ŧ, Ŋ) still become dashes: recorded; the slug is an editable default.

Code: [init-project.js](https://github.com/koniz-dev/react-native-starter/blob/14033fb/scripts/init-project.js), [04-login-keyboard.yaml](https://github.com/koniz-dev/react-native-starter/blob/14033fb/.maestro/04-login-keyboard.yaml), [run.sh](https://github.com/koniz-dev/react-native-starter/blob/14033fb/scripts/e2e/run.sh).
