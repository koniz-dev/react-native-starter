# Evidence: issue #9 — repository-wide agent instructions

Verification was run locally on 2026-09-29.

| Acceptance criterion                                                                                                 | Result | Evidence                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Root instructions link to the full workflow and identify GitHub issues and labels as the source of truth             | PASS   | `AGENTS.md`, "Issue workflow" section.                                                                     |
| Instructions cover claim/re-read, `Refs` commits, and correct blocked/UAT routing                                    | PASS   | `AGENTS.md`, "Issue workflow" section.                                                                     |
| Instructions require the project gate and evidence-backed closure, and accurately name the closest committed harness | PASS   | `AGENTS.md`, "Verification and closure" section; `01-lint.log`, `02-type-check.log`, and `03-test-ci.log`. |

Regression gate passed: ESLint completed without diagnostics, TypeScript completed without
diagnostics, and Jest passed 4 suites and 33 tests.

`04-format-check.log` is informational, not an acceptance criterion: the existing
format check fails on pre-existing `README.md`, `docs/issue-workflow.md`, and issue #6
and #7 evidence summaries. This issue does not broaden into formatting those files.
