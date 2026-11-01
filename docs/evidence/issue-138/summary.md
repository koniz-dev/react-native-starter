# Issue #138: npm run new-feature

Branch `sdk-58`, commit 2c81883: [`scripts/new-feature.js`](https://github.com/koniz-dev/react-native-starter/blob/2c81883/scripts/new-feature.js), [`__tests__/scripts/newFeature.test.ts`](https://github.com/koniz-dev/react-native-starter/blob/2c81883/__tests__/scripts/newFeature.test.ts), [Adding a screen](https://github.com/koniz-dev/react-native-starter/blob/2c81883/docs/conventions.md#adding-a-screen). Non-security work ships with the SDK 58 merge (#134).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `npm run new-feature <name> [--route public\|signed-in\|tab]` creates the screen (named export), the route file in the matching group, a typed i18n key, and a passing test that renders the screen | PASS | `generated/files.txt` (screens, routes, tests for `settings`, `account --route signed-in`, `reports --route tab`), `generated/en.ts.diff` (`<camel>.title` keys), `generated/tabs-layout.diff` (both diffs are against `sdk-58` with the demo, so they also show `remove-demo`'s deletions; a tab must be declared under Expo Router 58, so `--route tab` adds its `Tabs.Screen`). Each generated test opens the route with `renderRouter` (the signed-in one stores a session first) and finds the title; each generated screen is 100% covered by it (`adopter-after-remove-demo.log`). |
| 2 | Refuses an invalid or existing name and changes nothing | PASS | `refusals.log`: not kebab-case, reserved (`index`, `demo-*`), an existing feature folder, route file (any group) or i18n key prefix, a bad `--route`, no name. Each exits 2 and `git status --porcelain` stays empty. The script validates the name before deriving anything from it (a first version crashed with exit 1 on `order--history`; caught by the test). |
| 3 | Output passes `npm run lint && npm run type-check && npm run test:ci` without edits | PASS | `adopter-after-remove-demo.log`: a fresh copy, `remove-demo`, then the three features, then lint, type-check, test:ci (699 passed, 2 skipped as in the baseline) and format:check, exit 0. |
| 4 | A test covers the script; Adding a screen mentions it | PASS | `newFeature.test.ts` (14 tests): scaffolds all three routes in a copy, checks the files, runs Prettier on them and `tsc --noEmit` on the project; and the refusals, comparing every file before and after. Conventions "Adding a screen", `scripts/README.md`, and AGENTS.md mention the command. `gates.log`: 750 tests, docs:check "No problems.". CI 40186837618, Audit 40186837560 green on 2c81883. |

## Found while verifying

- **Fixture names an adopter would use.** The script's own test first scaffolded `settings` and `reports`; in a project that already has a `settings` feature it would fail. It now uses `scaffold-public`, `scaffold-signed-in`, `scaffold-tab`.
- **`remove-demo` leftovers.** The `demo-*` refusal and its test case are between `@demo` markers, so init-project's "nothing reads like the template" check passes after `--remove-demo` (it failed before the markers were added).
- Two init-project test failures during one adopter run were caused by my own log file written into the copy's root (the copy has no `.git`, so `copyProject` copies every file, log included). Rerun with the log outside the copy: green. A baseline copy of HEAD with `remove-demo` was also green.

## Reverted, closed as not planned (2026-11-01)

The maintainer decided not to ship this, as part of one round that also dropped #137 and the rest of #138-#141 (`sdk-58` was tidied
in one round). The starter is in maintenance mode (security fixes, regressions,
compatibility, documentation fixes), and this was a new addition no user asked for: it came
from comparing with koniz-dev/flutter-starter. It was never on `main` or in a release.

- `sdk-58` 7f8e2d8 reverts 2c81883. The four reverts (8ddba3b, 3c5567c, 7834bc2,
  7f8e2d8) applied without conflicts; afterwards `git grep` finds no reference to
  `new-feature`, `certificate-pinning`, `localization.md` or `E2E_ANDROID_SCHEDULE`, and
  the workflows differ from `main` only in the SDK 58 pins.
- Local gates at 7f8e2d8: format, lint, type-check, docs:check (46 snippets, "No
  problems."), 736 tests, audit:check. CI on 7f8e2d8: see issue-146 or the PR #135 checks.
- The issue was reopened, commented, its `status:in-progress` label removed (it had been
  left on at the original close), and closed as not planned.
