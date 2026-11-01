# Issue #141: weekly Android Maestro run

Branch `sdk-58`, commit ab4d519: [`.github/workflows/e2e-android.yml`](https://github.com/koniz-dev/react-native-starter/blob/ab4d519/.github/workflows/e2e-android.yml), [Testing](https://github.com/koniz-dev/react-native-starter/blob/ab4d519/docs/testing.md#end-to-end-flows-maestro). Repository variable `E2E_ANDROID_SCHEDULE=true` set by the owner on 2026-10-25 (recorded in the maintainers README, b72fe7f). The schedule fires only from `main`, so it starts with the SDK 58 merge (#134).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Weekly `schedule` in the template repository only, so adopters don't pay | PASS | `workflow-structure.log`: cron `17 3 * * 1`; the job runs on a schedule only when `vars.E2E_ANDROID_SCHEDULE == 'true'`. A guard on `github.event.repository.is_template` was not used: whether the schedule payload carries `repository` couldn't be checked before the file is on `main`, and a missing field would silently never run upstream. Variables aren't copied by "Use this template", so a copy skips the job (no runner minutes); an adopter can opt in. A guard on the repository name would leave `koniz-dev` in adopter files, which init-project's test forbids. A scheduled run tests Expo Go (`APP: inputs.app \|\| 'expo-go'`). |
| 2 | A scheduled failure is visible | PASS | A failed run, plus a `report-failure` job (`if: failure() && github.event_name == 'schedule'`, `permissions: issues: write`, runs no project code) that opens "Weekly E2E (Android) run failed" or comments on the open one. `report-failure-simulation.log`: its script, extracted from the workflow, run with a fake `gh` for both branches; the real search and `--jq` against this repository return nothing. |
| 3 | No cache-poisoning pattern (#112): no ref input, caches as before | PASS | `workflow-structure.log`: the only input is `app`; no `actions/cache`; `setup-node` cache unchanged. The e2e job keeps `contents: read`. |
| 4 | One scheduled (or dispatched with the same config) run passes | PASS | Run 40189890830 (dispatched on `sdk-58` at ab4d519, `app=expo-go`, the scheduled configuration): 7/7 flows and the dark-mode screenshots (`e2e-run.log`, `maestro-report.xml`: 7 tests, 0 failures; `dark-home.png` looked at). `report-failure` was skipped, as on a dispatch. CI 40189886986 and Audit 40189886978 green; actionlint clean (`actionlint.log`); gates 750 (`gates.log`). |

Not verified yet: a run started by the schedule itself; the first one is due the Monday after `sdk-58` is merged.

## Reverted, closed as not planned (2026-11-01)

The maintainer decided not to ship this, as part of one round that also dropped #137 and the rest of #138-#141 (`sdk-58` was tidied
in one round). The starter is in maintenance mode (security fixes, regressions,
compatibility, documentation fixes), and this was a new addition no user asked for: it came
from comparing with koniz-dev/flutter-starter. It was never on `main` or in a release.

- `sdk-58` 8ddba3b reverts ab4d519. The four reverts (8ddba3b, 3c5567c, 7834bc2,
  7f8e2d8) applied without conflicts; afterwards `git grep` finds no reference to
  `new-feature`, `certificate-pinning`, `localization.md` or `E2E_ANDROID_SCHEDULE`, and
  the workflows differ from `main` only in the SDK 58 pins.
- Local gates at 7f8e2d8: format, lint, type-check, docs:check (46 snippets, "No
  problems."), 736 tests, audit:check. CI on 7f8e2d8: see issue-146 or the PR #135 checks.
- The issue was reopened, commented, its `status:in-progress` label removed (it had been
  left on at the original close), and closed as not planned.
