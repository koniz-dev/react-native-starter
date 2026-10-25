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
