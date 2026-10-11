# Issue 60 verification — dependency review 2026-10

The first monthly review, opened by `.github/workflows/dependency-review.yml`
(#59). Done on 2026-10-11 on `main` at
[`ffd2810`](https://github.com/koniz-dev/react-native-starter/commit/ffd2810)
and [`4dc5f90`](https://github.com/koniz-dev/react-native-starter/commit/4dc5f90).

## Changes

- **`4dc5f90`: in-range updates (lockfile only; `package.json` ranges are
  unchanged).** The new versions are in
  [updated-versions.txt](updated-versions.txt).

  | Package                                                         | From   | To     |
  | --------------------------------------------------------------- | ------ | ------ |
  | `eslint`, `@eslint/js`                                          | 9.39.1 | 9.39.5 |
  | `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` | 8.71.0 | 8.71.1 |
  | `eslint-plugin-prettier`                                        | 5.5.4  | 5.5.6  |
  | `eslint-plugin-react-hooks`                                     | 7.0.1  | 7.1.1  |
  | `prettier`                                                      | 3.6.2  | 3.9.10 |
  | `react-native-paper`                                            | 5.14.5 | 5.15.3 |
  | `@expo/vector-icons` (Expo SDK 57 range `^15.0.2`)              | 15.0.3 | 15.1.1 |
  | `react-native-web` (Expo SDK 57 range `~0.21.0`)                | 0.21.2 | 0.21.4 |

- **`ffd2810`: `useFetch` sets its loading state outside its effect.**
  `eslint-plugin-react-hooks` 7.1 adds `react-hooks/set-state-in-effect`,
  which flagged the synchronous `setLoading(true)` / `setError(null)` at the
  start of each request in `shared/lib/useFetch.ts`. Deferring the plugin
  would leave the next `npm install` that resolves `^7.0.1` failing lint, so
  the hook was fixed instead. The reset now happens during render when the
  deps change, and in `refetch`. The effect only starts the request, which
  sets state once it settles. Behavior is unchanged, and a new test covers
  the reset on a deps change and on `refetch` after an error.

## Deferred, with reasons

| Package(s)                                                                                                                                                                                                   | Available              | Reason                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`, `react-native`, `react-native-reanimated`, `-worklets`, `-screens`, `-safe-area-context`, `-gesture-handler`, `@react-native-async-storage/async-storage`, `@react-native/jest-preset` | newer majors or minors | Pinned by Expo SDK 57 (`npx expo install --check`: "Dependencies are up to date"). They move with Expo SDK 58 |
| `react-test-renderer`                                                                                                                                                                                        | 19.3.0                 | Must match `react`, which is 19.2.3 under Expo SDK 57                                                         |
| `@types/react`                                                                                                                                                                                               | 19.3.0                 | Follows `react`                                                                                               |
| `eslint`, `@eslint/js` 10; `globals` 17                                                                                                                                                                      | majors                 | ESLint 10 needs a config migration; that is a separate change                                                 |
| `jest`, `@types/jest` 30; `@testing-library/react-native` 14                                                                                                                                                 | majors                 | `jest-expo` for SDK 57 targets Jest 29                                                                        |
| `typescript` 7                                                                                                                                                                                               | major                  | Expo SDK 57 targets TypeScript 6                                                                              |

[outdated-before.txt](outdated-before.txt) lists 27 packages and
[outdated-after.txt](outdated-after.txt) lists 19. Everything left is in the
table above.

## Acceptance criteria

| #   | Criterion                                                                                                           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Result |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | Every high/critical advisory is fixed or reviewed with a `reviewBy` of at most 3 months; tracking issues re-checked | [gate-audit-check.log](gate-audit-check.log): 0 critical. The 45 high records come from the two allowlisted advisories (braces, node-forge), with `reviewBy` 2027-01-09. #43 was re-checked ([issue-43-recheck.log](issue-43-recheck.log)): neither advisory has a patched version (`patched: null`), and the tree already has the latest `node-forge` (1.4.0) and `braces` (3.0.3). It stays blocked; see the comment on #43                                                                                                                                                                                                                                                                    | PASS   |
| 2   | Patch/minor updates that the Expo SDK allows are applied or deferred with a reason                                  | The changes and the deferred table above. [expo-install-check.log](expo-install-check.log): "Dependencies are up to date"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | PASS   |
| 3   | A new Expo SDK has an upgrade issue                                                                                 | [expo-sdk.log](expo-sdk.log): `latest` is 57.0.27 and `next` is 58.0.7 (a beta). SDK 58 isn't released yet, so no upgrade issue is due. The next review checks again                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | PASS   |
| 4   | Gates pass; CI green; review recorded                                                                               | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log) (277 tests), [audit:check](gate-audit-check.log), [expo-doctor](gate-expo-doctor.log), [web export](gate-web-export.log). CI run 38150053992 on `4dc5f90`: success ([log](github-actions-ci-38150053992.log)). The web smoke on the updated tree passed ([web/web-smoke.log](web/web-smoke.log), [screenshots](web-sheet.png)). Android Expo Go e2e, run 38150064533 on `4dc5f90`: 6/6 plus dark mode ([report](android-expo-go/report.xml), [screenshots](android-expo-go/screenshots-sheet.png)). Every screenshot was checked | PASS   |

## Notes

- **No new tag.** These are maintenance changes on `main`. The release
  baseline stays `v1.1.1`, and they ship with the next tag.
